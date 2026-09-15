import type { Card, HandCard, Piece, Player } from "../../game-types";
import {
  allPieces,
  clearAttackEffects,
  discardAttachments,
  discardEnergy,
  draw,
  piece,
  removePiece,
  shuffle,
  switchActive,
  takeEnergy,
} from "../../game-core";
import { AttackContext, EffectContext } from "../context";
import { energyOptions, cardProvidesEnergy } from "../base-set/energy";
import {
  board,
  evolvesInto,
  evolutionBlocked,
  narrowGym,
  ownerOf,
  pokemonCard,
  startingPokemon,
  switchingBlocked,
} from "./state";

export const forever = Number.MAX_SAFE_INTEGER;
export const forPlayer = (c: EffectContext, p: Player) => {
  const ctx = new EffectContext(c.state, c.catalog, p, c.answers);
  ctx.choicePrefix = c.choicePrefix;
  return ctx;
};
export function optional(
  c: EffectContext,
  key: string,
  title: string,
  player = c.player.id,
) {
  return (
    c.choose(
      key,
      title,
      [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      1,
      1,
      player,
    )[0] === "yes"
  );
}
export function numberChoice(
  c: EffectContext,
  key: string,
  title: string,
  max: number,
  min = 0,
  player = c.player.id,
) {
  return Number(
    c.choose(
      key,
      title,
      Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => ({
        value: String(i + min),
        label: String(i + min),
      })),
      1,
      1,
      player,
    )[0],
  );
}
export function coins(c: AttackContext, n: number) {
  let heads = 0;
  for (let i = 0; i < n; i++) if (c.coin()) heads++;
  return heads;
}
export function energyIndices(c: EffectContext, p: Piece, type?: string) {
  return p.energy.flatMap((_, i) =>
    !type || cardProvidesEnergy(p, i, type, c.catalog, c.state) ? [i] : [],
  );
}
export function energyCount(c: EffectContext, p: Piece, type?: string) {
  return p.energy.reduce(
    (n, _, i) =>
      n +
      Math.max(
        ...energyOptions(p, i, c.catalog, c.state).map(
          (units) =>
            units.filter((t) => !type || t === type || t === "Any").length,
        ),
      ),
    0,
  );
}
export function basicEnergy(card: Card) {
  return card.supertype === "Energy" && card.subtypes.includes("Basic");
}
export const pokemon = (card: Card) => card.supertype === "Pokémon";
export const evolution = (card: Card) =>
  pokemon(card) && !startingPokemon(card);
export const named = (names: string[]) => (card: Card) =>
  names.includes(card.name);
export const namedEnergy = (type: string) => (card: Card) =>
  card.name === `${type} Energy`;
export function putMark(
  c: EffectContext,
  p: Piece,
  key: string,
  turns = 1,
  value?: number,
  source?: Piece,
  name?: string,
) {
  (p.marks ||= {})[key] = {
    until: turns === forever ? forever : c.state.turn + turns,
    value,
    source: source?.uid,
    generation: source?.generation || 0,
    name,
  };
}
export function opponentMark(
  c: AttackContext,
  key: string,
  turns = 1,
  value?: number,
  linked = false,
  name?: string,
) {
  if (!c.effectsBlocked())
    putMark(
      c,
      c.defender,
      key,
      turns,
      value,
      linked ? c.attacker : undefined,
      name,
    );
}
export function lockTrainers(c: EffectContext, p: Player, turns = 1) {
  (p.rules ||= {}).noTrainerUntil = c.state.turn + turns;
}
export function moveCards(from: HandCard[], to: HandCard[], cards: HandCard[]) {
  for (const h of cards) {
    const i = from.findIndex((q) => q.uid === h.uid);
    if (i >= 0) to.push(...from.splice(i, 1));
  }
}
export function heal(p: Piece, amount: number) {
  p.damage = Math.max(0, p.damage - Math.max(0, amount));
}
export function mill(c: EffectContext, p: Player, n: number) {
  p.discard.push(...p.deck.splice(0, n));
}
export function newHand(c: EffectContext, p: Player, n: number) {
  p.deck.push(...p.hand);
  p.hand = [];
  shuffle(c.state, p.deck);
  draw(c.state, p, n);
}
export function cardsInPlay(c: EffectContext, p: Piece): HandCard[] {
  return [
    { uid: p.uid, card: p.card },
    ...p.stack.map((card, i) => ({ uid: `${p.uid}-stack-${i}`, card })),
    ...p.energy.map((card, i) => ({
      uid: `${p.uid}-energy-${c.state.seq}-${i}`,
      card,
    })),
    ...p.tools.map((card, i) => ({ uid: `${p.uid}-tool-${i}`, card })),
    ...(p.trainerAttachments || []).map(({ uid, card }) => ({ uid, card })),
    ...(p.shapeAttachments || (p.shape ? [p.shape] : [])),
  ];
}
export function leavePlay(
  c: EffectContext,
  p: Piece,
  zone: "hand" | "deck",
  attachments = true,
  onlyEnergy = false,
) {
  const owner = ownerOf(c.state, p);
  if (owner.active === p && switchingBlocked(c.state, owner)) return false;
  if (attachments) owner[zone].push(...cardsInPlay(c, p));
  else {
    owner[zone].push({ uid: p.uid, card: p.card });
    if (onlyEnergy) {
      owner[zone].push(
        ...p.energy.map((card, i) => ({
          uid: `${p.uid}-return-${c.state.seq}-${i}`,
          card,
        })),
      );
      p.energy = [];
    }
    owner.discard.push(
      ...p.stack.map((card, i) => ({ uid: `${p.uid}-stack-${i}`, card })),
    );
    discardAttachments(c.state, owner, p);
  }
  removePiece(owner, p);
  if (zone === "deck") shuffle(c.state, owner.deck);
  return true;
}
export function switchPokemon(c: EffectContext, p: Player, target: Piece) {
  if (switchingBlocked(c.state, p)) return false;
  switchActive(p, target.uid);
  return true;
}
export function switchSelf(c: AttackContext, optionalSwitch = false) {
  if (!c.player.bench.length || switchingBlocked(c.state, c.player)) return;
  if (
    optionalSwitch &&
    !optional(c, "switch-self-optional", "Switch your Active Pokémon?")
  )
    return;
  const p = c.choosePiece(
    "switch-self",
    "Choose your new Active Pokémon",
    c.player.bench,
  );
  switchPokemon(c, c.player, p);
}
export function dragOff(c: AttackContext) {
  c.require(c.opponent.bench.length, "Your opponent needs a Benched Pokémon.");
  if (!c.begin() || c.effectsBlocked() || switchingBlocked(c.state, c.opponent))
    return false;
  const p = c.choosePiece(
    "drag-off",
    "Choose the new Defending Pokémon",
    c.opponent.bench,
  );
  switchPokemon(c, c.opponent, p);
  c.defender = c.opponent.active!;
  return true;
}
export function benchDamage(
  c: AttackContext,
  amount: number,
  side: "opponent" | "own" | "both" = "opponent",
  filter: (p: Piece) => boolean = () => true,
) {
  const targets =
    side === "both"
      ? [...c.player.bench, ...c.opponent.bench]
      : side === "own"
        ? c.player.bench
        : c.opponent.bench;
  for (const p of targets.filter(filter)) c.hit(amount, p, false);
}
export function selectedDamage(
  c: AttackContext,
  amount: number,
  count = 1,
  bench = true,
  optionalCount = false,
  side: Player = c.opponent,
  key = "damage-targets",
) {
  const targets = bench ? side.bench : allPieces(side);
  if (!targets.length) return;
  const ids = c.choose(
    key,
    "Choose Pokémon to damage",
    targets.map((p) => ({
      value: p.uid,
      label: pokemonCard(c.state, p, c.catalog).name,
      card: p.card,
    })),
    optionalCount ? 0 : Math.min(count, targets.length),
    Math.min(count, targets.length),
  );
  for (const id of ids)
    c.hit(amount, targets.find((p) => p.uid === id)!, false);
}
export function search(
  c: EffectContext,
  p: Player,
  filter: (card: Card) => boolean,
  max = 1,
  destination: "hand" | "bench" | "energy" = "hand",
  target?: Piece,
  key = "search",
  reveal = true,
) {
  const room =
    destination === "bench"
      ? Math.max(0, narrowGym(c.state) - p.bench.length)
      : max;
  const selected = forPlayer(c, p).chooseCards(
    key,
    "Search your deck",
    p.deck.filter((h) => filter(c.catalog[h.card])),
    0,
    Math.min(max, room),
  );
  if (reveal && selected.length) c.reveal(`${p.name} found`, selected);
  if (destination === "hand") moveCards(p.deck, p.hand, selected);
  else
    for (const h of selected) {
      p.deck.splice(
        p.deck.findIndex((q) => q.uid === h.uid),
        1,
      );
      if (destination === "bench") p.bench.push(piece(h, c.state.turn));
      else target!.energy.push(h.card);
    }
  shuffle(c.state, p.deck);
  return selected;
}
export function family(
  c: AttackContext,
  filter: (card: Card) => boolean,
  max = 1,
  requiredRoom = true,
) {
  if (requiredRoom)
    c.require(
      c.player.bench.length < narrowGym(c.state),
      "Your Bench is full.",
    );
  search(c, c.player, filter, max, "bench");
}
export function recover(
  c: EffectContext,
  p: Player,
  filter: (card: Card) => boolean,
  max: number,
  zone: "hand" | "deck" | "energy" = "hand",
  target?: Piece,
  key = "recover",
  exact = false,
) {
  const pool = p.discard.filter((h) => filter(c.catalog[h.card]));
  const n = Math.min(max, pool.length);
  const chosen = forPlayer(c, p).chooseCards(
    key,
    "Choose cards from your discard pile",
    pool,
    exact ? n : 0,
    n,
  );
  if (zone === "energy")
    for (const h of chosen) {
      p.discard.splice(
        p.discard.findIndex((q) => q.uid === h.uid),
        1,
      );
      target!.energy.push(h.card);
    }
  else moveCards(p.discard, p[zone], chosen);
  if (zone === "deck") shuffle(c.state, p.deck);
  return chosen;
}
export function returnEnergy(c: EffectContext, p: Piece, indices: number[]) {
  const owner = ownerOf(c.state, p);
  for (const i of [...indices].sort((a, b) => b - a)) {
    const { card } = takeEnergy(p, i);
    owner.hand.push({ uid: `${p.uid}-return-${c.state.seq}-${i}`, card });
  }
}
export function moveEnergy(
  c: EffectContext,
  from: Piece,
  to: Piece,
  index: number,
) {
  const moved = takeEnergy(from, index);
  if (moved.type) (to.energyTypes ||= {})[to.energy.length] = moved.type;
  to.energy.push(moved.card);
}
export function moveDefenderBasicEnergy(c: AttackContext, key = "magnetic") {
  if (c.effectsBlocked() || !c.opponent.bench.length) return;
  const indices = c.defender.energy.flatMap((id, i) =>
    basicEnergy(c.catalog[id]) ? [i] : [],
  );
  if (!indices.length) return;
  const index = Number(
    c.choose(
      `${key}-energy`,
      "Move a basic Energy",
      indices.map((i) => ({
        value: String(i),
        label: c.catalog[c.defender.energy[i]].name,
        card: c.defender.energy[i],
      })),
    )[0],
  );
  const target = c.choosePiece(
    `${key}-target`,
    "Move the Energy to…",
    c.opponent.bench,
  );
  moveEnergy(c, c.defender, target, index);
  c.record().movedBasicEnergy = (c.record().movedBasicEnergy || 0) + 1;
}
export function moveAttackEnergy(
  c: AttackContext,
  all: boolean,
  type?: string,
) {
  const indices = energyIndices(c, c.attacker, type);
  const selected = all
    ? indices
    : c.chooseEnergy(
        "move-attack-energy",
        "Choose Energy to move",
        c.attacker,
        Math.min(1, indices.length),
        Math.min(1, indices.length),
        type,
      );
  for (const i of [...selected].sort((a, b) => b - a)) {
    if (c.player.bench.length) {
      const p = c.choosePiece(
        `move-energy-${i}`,
        "Attach this Energy to a Benched Pokémon",
        c.player.bench,
      );
      moveEnergy(c, c.attacker, p, i);
    } else discardEnergy(c.state, c.player, c.attacker, [i]);
  }
}
export function discardAll(c: AttackContext, type?: string) {
  const ids = energyIndices(c, c.attacker, type);
  discardEnergy(c.state, c.player, c.attacker, ids);
  return ids.length;
}
export function evolvePiece(c: EffectContext, p: Piece, h: HandCard) {
  c.require(
    !evolutionBlocked(c.state, c.catalog),
    "Prehistoric Power prevents evolution.",
  );
  c.require(
    !p.shape && !["base3-3", "base3-18"].includes(p.card),
    "This Pokémon cannot evolve.",
  );
  p.stack.push(p.card);
  p.card = h.card;
  p.evolved = c.state.turn;
  clearAttackEffects(p);
  delete p.charred;
  delete p.shiftedType;
  if (
    c.state.stadium?.card === "gym2-123" &&
    c.catalog[p.card].name.includes("Giovanni")
  )
    heal(p, 20);
}
export function evolveFromDeck(
  c: EffectContext,
  targets: Piece[],
  names?: string[],
  key = "evolution",
) {
  if (evolutionBlocked(c.state, c.catalog)) return;
  const options = targets.flatMap((p) =>
    c.player.deck
      .filter((h) =>
        names
          ? names.includes(c.catalog[h.card].name)
          : evolvesInto(c.catalog[p.card], c.catalog[h.card]),
      )
      .map((h) => ({
        value: `${p.uid}/${h.uid}`,
        label: `${c.catalog[p.card].name} → ${c.catalog[h.card].name}`,
        card: h.card,
      })),
  );
  const [value] = c.choose(
    key,
    "Choose a Pokémon to evolve from your deck",
    options,
    0,
    1,
  );
  if (value) {
    const [uid, hid] = value.split("/");
    const p = targets.find((p) => p.uid === uid)!;
    const i = c.player.deck.findIndex((h) => h.uid === hid);
    evolvePiece(c, p, c.player.deck.splice(i, 1)[0]);
  }
  shuffle(c.state, c.player.deck);
}
export function reorder(
  c: EffectContext,
  p: Player,
  count: number,
  key = "reorder",
) {
  const cards = p.deck.slice(0, count);
  const sorted = c.chooseCards(
    key,
    "Order the top cards (first selected stays on top)",
    cards,
    cards.length,
    cards.length,
    true,
  );
  p.deck.splice(0, cards.length, ...sorted);
}
export function prophecy(c: AttackContext) {
  const id = c.choose(
    "prophecy-player",
    "Choose a deck to inspect",
    c.state.players.map((p) => ({ value: p.id, label: p.name })),
  )[0];
  reorder(c, c.state.players.find((p) => p.id === id)!, 3, "prophecy-order");
}
export function privateReveal(
  c: EffectContext,
  title: string,
  cards: HandCard[],
  player = c.player.id,
) {
  c.state.reveals = [
    ...(c.state.reveals || []),
    { id: c.state.seq, title, cards: cards.map((h) => h.card), player },
  ].slice(-8);
}
export function copyAttack(
  c: AttackContext,
  anyOpponent = false,
  payCosts = true,
) {
  c.require(c.copyDepth < 4, "Choose a non-copying attack.");
  const copyingNames = ["Metronome", "Super Metronome", "ESP"];
  const targets = anyOpponent ? allPieces(c.opponent) : [c.defender];
  const options = targets.flatMap((p) => {
    const card = pokemonCard(c.state, p, c.catalog);
    return card.attacks.flatMap((a, i) =>
      c.resolveAttack(card, i) && !copyingNames.includes(a.name)
        ? [
            {
              value: `${card.id}:${i}`,
              label: `${card.name} · ${a.name}`,
              card: card.id,
            },
          ]
        : [],
    );
  });
  if (!options.length) return;
  const [choice] = c.choose(
    `copy-${c.copyDepth}`,
    "Choose an attack to copy",
    options,
  );
  const [id, idx] = choice.split(":");
  const card = c.catalog[id];
  const oldAttack = c.attack,
    oldPrinted = c.printedCard,
    oldCopy = c.copying;
  c.attack = card.attacks[+idx];
  c.printedCard = card;
  c.copying = !payCosts;
  c.copyDepth++;
  c.resolveAttack(card, +idx)!(c);
  c.copyDepth--;
  c.attack = oldAttack;
  c.printedCard = oldPrinted;
  c.copying = oldCopy;
}
export function discardStadium(c: EffectContext) {
  const s = c.state.stadium;
  if (s) {
    c.state.players
      .find((p) => p.id === s.owner)!
      .discard.push({ uid: s.uid, card: s.card });
    c.state.stadium = null;
  }
}
export function countNames(
  c: EffectContext,
  names: string[],
  both = false,
  bench = false,
) {
  return (
    both ? board(c.state) : bench ? c.player.bench : allPieces(c.player)
  ).filter((p) => names.includes(pokemonCard(c.state, p, c.catalog).name))
    .length;
}
export function linkedReduction(
  c: AttackContext,
  amount: number,
  before = false,
) {
  opponentMark(c, before ? "reduceBefore" : "reduceAgainst", 1, amount, true);
}
export function recoverTop(c: EffectContext, p: Player) {
  if (!p.discard.length) return;
  const [h] = c.chooseCards(
    "recover-top",
    "Choose a card to put on top of the deck",
    p.discard,
  );
  p.discard.splice(
    p.discard.findIndex((q) => q.uid === h.uid),
    1,
  );
  p.deck.unshift(h);
}
export function damageCounters(c: AttackContext, p: Piece, n: number) {
  if (!c.effectsBlocked(p)) {
    p.damage += n;
    c.record(p).counterDamage = (c.record(p).counterDamage || 0) + n;
    c.damageDone.set(p.uid, (c.damageDone.get(p.uid) || 0) + n);
  }
}
export function drawUpTo(
  c: EffectContext,
  p: Player,
  max: number,
  key = "draw-count",
) {
  draw(
    c.state,
    p,
    numberChoice(
      c,
      key,
      "How many cards to draw?",
      Math.min(max, p.deck.length),
      0,
      p.id,
    ),
  );
}
export { board } from "./state";
export {
  allPieces,
  condition,
  discardEnergy,
  draw,
  flip,
  log,
  piece,
  shuffle,
} from "../../game-core";

export function mirrorClassicResults(c: AttackContext) {
  const previous = c.previousAttack;
  if (!previous || c.effectsBlocked()) return;
  for (const [key, m] of Object.entries(previous.marks || {}))
    opponentMark(
      c,
      key,
      m.until === forever ? forever : Math.max(0, m.until - previous.turn),
      m.value,
      !!m.source,
      m.name,
    );
  if (previous.charred) {
    c.defender.charred = true;
    c.record().charred = true;
  }
  if (previous.counterDamage)
    damageCounters(c, c.defender, previous.counterDamage);
  if (previous.healed) {
    heal(c.defender, previous.healed);
    c.record().healed = previous.healed;
  }
  for (let i = 0; i < (previous.movedBasicEnergy || 0); i++)
    moveDefenderBasicEnergy(c, `mirror-energy-${i}`);
}
