import type { Piece } from "../../game-types";
import { EffectContext, type AttackContext } from "../context";
import { BASE_POWERS, type PowerHandler } from "../base-set/powers";
import * as O from "./operations";
import * as R from "./state";

export function once(c: EffectContext, p: Piece, name: string) {
  c.require(
    p.powerUsed?.[name] !== c.state.turn,
    "This Power was already used this turn.",
  );
  (p.powerUsed ||= {})[name] = c.state.turn;
}
export function vileplumeHeal(c: EffectContext, p: Piece) {
  once(c, p, "Heal");
  if (O.flip(c.state)) {
    const targets = O.allPieces(c.player).filter((q) => q.damage);
    if (targets.length)
      O.heal(c.choosePiece("heal-power", "Heal a Pokémon", targets), 10);
  }
}
export function mankeyPeek(c: EffectContext, p: Piece) {
  once(c, p, "Peek");
  const choices = c.state.players.flatMap((q) => [
    ...(q.deck.length
      ? [{ value: `deck/${q.id}`, label: `Top card of ${q.name}’s deck` }]
      : []),
    ...q.prizes.map((_, i) => ({
      value: `prize/${q.id}/${i}`,
      label: `${q.name}’s Prize ${i + 1}`,
    })),
  ]);
  if (c.opponent.hand.length)
    choices.push({
      value: `hand/${c.opponent.id}`,
      label: "A random card from the opponent’s hand",
    });
  const [v] = c.choose("peek", "Where to peek?", choices);
  const [zone, id, index] = v.split("/");
  const q = c.state.players.find((q) => q.id === id)!;
  const h =
    zone === "deck"
      ? q.deck[0]
      : zone === "prize"
        ? q.prizes[+index]
        : q.hand[Math.floor(c.random() * q.hand.length)];
  O.privateReveal(c, "Peek", [h]);
}
export function venomothShift(c: EffectContext, p: Piece) {
  once(c, p, "Shift");
  const types = [
    ...new Set(
      O.board(c.state)
        .filter((q) => q.uid !== p.uid)
        .flatMap((q) => R.pokemonCard(c.state, q, c.catalog).types),
    ),
  ].filter((t) => t !== "Colorless");
  p.shiftedType = c.choose(
    "shift",
    "Choose a type in play",
    types.map((value) => ({ value, label: value })),
  )[0];
}
export function dragoniteStepIn(c: EffectContext, p: Piece) {
  once(c, p, "Step In");
  c.require(c.player.bench.includes(p), "Dragonite must be on your Bench.");
  O.switchPokemon(c, c.player, p);
}
export function gengarCurse(c: EffectContext, p: Piece) {
  const targets = O.allPieces(c.opponent);
  c.require(targets.length > 1, "Curse needs two opposing Pokémon.");
  once(c, p, "Curse");
  const from = c.choosePiece(
    "curse-from",
    "Move a damage counter from…",
    targets.filter((q) => q.damage >= 10),
  );
  const to = c.choosePiece(
    "curse-to",
    "Move that counter to…",
    targets.filter((q) => q !== from),
  );
  from.damage -= 10;
  to.damage += 10;
}
export function slowbroStrangeBehavior(c: EffectContext, p: Piece) {
  c.require(
    p.damage + 10 < R.maximumHP(c.state, p, c.catalog),
    "This would Knock Out Slowbro.",
  );
  const from = c.choosePiece(
    "strange-from",
    "Move a damage counter to Slowbro",
    O.allPieces(c.player).filter((q) => q !== p && q.damage >= 10),
  );
  from.damage -= 10;
  p.damage += 10;
}
export function tentacoolCowardice(c: EffectContext, p: Piece) {
  c.require(
    p.entered < c.state.turn,
    "Wait until your next turn to use Cowardice.",
  );
  O.leavePlay(c, p, "hand", false);
}
export function darkDragoniteSummonMinions(c: EffectContext) {
  O.search(c, c.player, R.startingPokemon, 2, "bench");
}
export function darkGolbatSneakAttack(c: EffectContext, p: Piece) {
  if (O.optional(c, "sneak-attack", "Use Sneak Attack?")) {
    const to = c.choosePiece(
      "sneak-target",
      "Choose an opponent’s Pokémon",
      O.allPieces(c.opponent),
    );
    c.powerDamage(p, to, 10, true);
  }
}
export function darkSlowbroReelIn(c: EffectContext) {
  O.recover(c, c.player, O.pokemon, 3);
}
export function darkDragonairEvolutionaryLight(c: EffectContext, p: Piece) {
  once(c, p, "Evolutionary Light");
  O.search(c, c.player, O.evolution);
}
export function darkGloomPollenStench(c: EffectContext, p: Piece) {
  once(c, p, "Pollen Stench");
  c.applyCondition(
    O.flip(c.state) ? c.opponent.active! : c.player.active!,
    "Confused",
  );
}
export function darkKadabraMatterExchange(c: EffectContext, p: Piece) {
  c.require(c.player.hand.length, "Discard a card from your hand first.");
  once(c, p, "Matter Exchange");
  c.discardHand(c.chooseCards("matter-cost", "Discard a card", c.player.hand));
  O.draw(c.state, c.player, 1);
}
function gather(
  c: EffectContext,
  p: Piece,
  type: string,
  max = 1,
  key = "gather",
) {
  const options = O.allPieces(c.player)
    .filter((q) => q !== p)
    .flatMap((q) =>
      O.energyIndices(c, q, type).map((i) => ({
        value: `${q.uid}/${i}`,
        label: `${c.catalog[q.card].name} · ${c.catalog[q.energy[i]].name}`,
        card: q.energy[i],
      })),
    );
  const values = c.choose(
    key,
    `Move ${type} Energy to ${c.catalog[p.card].name}`,
    options,
    0,
    max,
  );
  for (const q of O.allPieces(c.player).filter((q) => q !== p))
    for (const i of values
      .filter((v) => v.startsWith(q.uid + "/"))
      .map((v) => Number(v.split("/").at(-1)))
      .sort((a, b) => b - a))
      O.moveEnergy(c, q, p, i);
}
export function charmanderGatherFire(c: EffectContext, p: Piece) {
  once(c, p, "Gather Fire");
  gather(c, p, "Fire");
}
export function drowzeeLongDistanceHypnosis(c: EffectContext, p: Piece) {
  once(c, p, "Long-Distance Hypnosis");
  c.applyCondition(
    O.flip(c.state) ? c.opponent.active! : c.player.active!,
    "Asleep",
  );
}
export function rattataTrickery(c: EffectContext, p: Piece) {
  c.require(
    c.player.deck.length && c.player.prizes.length,
    "Trickery needs a deck card and a Prize.",
  );
  once(c, p, "Trickery");
  const i =
    O.numberChoice(
      c,
      "trickery",
      "Choose a Prize position",
      c.player.prizes.length,
      1,
    ) - 1;
  [c.player.prizes[i], c.player.deck[0]] = [
    c.player.deck[0],
    c.player.prizes[i],
  ];
}
export function surgeMagnetonEnergyCharge(c: EffectContext, p: Piece) {
  c.require(c.player.active === p, "Magneton must be your Active Pokémon.");
  gather(c, p, "Lightning");
}
export function erikaVictreebelFragranceTrap(c: EffectContext, p: Piece) {
  once(c, p, "Fragrance Trap");
  if (O.flip(c.state) && c.opponent.bench.length)
    O.switchPokemon(
      c,
      c.opponent,
      c.choosePiece(
        "fragrance",
        "Choose the opponent’s new Active Pokémon",
        c.opponent.bench,
      ),
    );
}
export function blaineVulpixNaturalHealing(c: EffectContext, p: Piece) {
  c.require(p.damage, "There is no damage to heal.");
  once(c, p, "Natural Healing");
  O.heal(p, 10);
}
export function brockNinetalesShapeshift(c: EffectContext, p: Piece) {
  const attached = p.shapeAttachments || (p.shape ? [p.shape] : []);
  const evolutions = c.player.hand.filter((h) =>
    O.evolution(c.catalog[h.card]),
  );
  const options = attached.map((h) => ({
    value: h.uid,
    label: `Discard ${c.catalog[h.card].name}`,
  }));
  if (p.powerUsed?.Shapeshift !== c.state.turn && evolutions.length)
    options.push({ value: "attach", label: "Attach an Evolution card" });
  c.require(
    options.length,
    "Shapeshift was already used, or there is no Evolution card to attach.",
  );
  const [mode] = c.choose("shape-mode", "Shapeshift", options);
  if (mode !== "attach") {
    const removed = attached.find((h) => h.uid === mode)!;
    c.player.discard.push(removed);
    p.shapeAttachments = attached.filter((h) => h.uid !== mode);
    if (p.shape?.uid === mode) delete p.shape;
    return;
  }
  once(c, p, "Shapeshift");
  const [h] = c.chooseCards(
    "shape-card",
    "Attach an Evolution card",
    evolutions,
  );
  c.player.hand.splice(
    c.player.hand.findIndex((q) => q.uid === h.uid),
    1,
  );
  p.shape = h;
  p.shapeAttachments = [...attached, h];
}
export function giovanniPersianCallTheBoss(c: EffectContext) {
  if (O.optional(c, "call-boss", "Search for Giovanni?"))
    O.search(c, c.player, O.named(["Giovanni"]));
}
export function erikaBellsproutSoakUp(c: EffectContext, p: Piece) {
  once(c, p, "Soak Up");
  gather(c, p, "Grass", 2, "soak-up");
}
export function kogaKakunaEmerge(c: EffectContext, p: Piece) {
  once(c, p, "Emerge");
  if (O.flip(c.state)) O.evolveFromDeck(c, [p], ["Koga's Beedrill"]);
}
export function feraligatrBerserk(c: EffectContext) {
  O.mill(c, O.flip(c.state) ? c.opponent : c.player, 5);
}
export function feraligatrDownpour(c: EffectContext) {
  const cards = c.player.hand.filter((h) =>
    O.namedEnergy("Water")(c.catalog[h.card]),
  );
  c.discardHand(c.chooseCards("downpour", "Discard Water Energy", cards));
}
export function meganiumHerbalScent(c: EffectContext) {
  if (O.optional(c, "herbal-scent", "Use Herbal Scent?") && O.flip(c.state))
    for (const p of O.board(c.state))
      if (R.pokemonCard(c.state, p, c.catalog).types.includes("Grass"))
        O.heal(p, p.damage);
}
export function typhlosionFireRecharge(c: EffectContext, p: Piece) {
  once(c, p, "Fire Recharge");
  if (O.flip(c.state)) {
    const targets = O.allPieces(c.player).filter((q) =>
      R.pokemonCard(c.state, q, c.catalog).types.includes("Fire"),
    );
    if (
      targets.length &&
      c.player.discard.some((h) => O.namedEnergy("Fire")(c.catalog[h.card]))
    ) {
      const target = c.choosePiece(
        "recharge-target",
        "Attach Fire Energy to…",
        targets,
      );
      O.recover(
        c,
        c.player,
        O.namedEnergy("Fire"),
        1,
        "energy",
        target,
        "recharge-energy",
        true,
      );
    }
  }
}
export function typhlosionFireBoost(c: EffectContext, p: Piece) {
  if (O.optional(c, "fire-boost", "Use Fire Boost?") && O.flip(c.state))
    O.search(c, c.player, O.namedEnergy("Fire"), 4, "energy", p);
}
export function elekidPlayfulPunch(c: EffectContext, p: Piece) {
  once(c, p, "Playful Punch");
  if (O.flip(c.state)) c.powerDamage(p, c.opponent.active!, 20, true);
  c.endsTurn = true;
}
export function noctowlGlaringGaze(c: EffectContext, p: Piece) {
  once(c, p, "Glaring Gaze");
  if (O.flip(c.state)) {
    O.privateReveal(c, "Glaring Gaze", c.opponent.hand);
    const pool = c.opponent.hand.filter(
      (h) => c.catalog[h.card].supertype === "Trainer",
    );
    if (pool.length) {
      const cards = c.chooseCards(
        "gaze-trainer",
        "Shuffle an opposing Trainer into their deck",
        pool,
      );
      O.moveCards(c.opponent.hand, c.opponent.deck, cards);
      O.shuffle(c.state, c.opponent.deck);
    }
  }
}

export type ClassicPower = {
  name: string;
  use?: PowerHandler;
  onPlay?: PowerHandler;
  passive?: true | ((c: AttackContext, p: Piece, amount: number) => void);
};
export const POWERS: Record<string, ClassicPower> = {};
for (const id of [
  "base1-1",
  "base1-2",
  "base1-4",
  "base1-8",
  "base1-15",
  "base1-21",
])
  Object.defineProperty(POWERS, id, {
    enumerable: true,
    get: () => BASE_POWERS[id],
  });
const register = (
  ids: string[],
  name: string,
  use?: PowerHandler,
  onPlay?: PowerHandler,
) =>
  ids.forEach(
    (id) =>
      (POWERS[id] = {
        name,
        use,
        onPlay,
        ...(!use && !onPlay ? { passive: true as const } : {}),
      }),
  );
register(["base2-6", "base2-22", "base4-27"], "Invisible Wall");
register(["base2-11", "base2-27", "base4-30"], "Thick Skinned");
register(["base2-13", "base2-29", "base4-31"], "Shift", venomothShift);
register(["base2-15", "base2-31"], "Heal", vileplumeHeal);
register(["base2-34", "base4-37"], "Retreat Aid");
register(["base2-55"], "Peek", mankeyPeek);
register(["base3-1", "base3-16"], "Prehistoric Power");
register(["base3-3", "base3-18"], "Transform");
register(["base3-4", "base3-19"], "Step In", dragoniteStepIn);
register(["base3-5", "base3-20"], "Curse", gengarCurse);
register(["base3-6", "base3-21"], "Transparency");
register(["base3-13", "base3-28"], "Toxic Gas");
register(["base3-43"], "Strange Behavior", slowbroStrangeBehavior);
register(["base3-50"], "Kabuto Armor");
register(["base3-52"], "Clairvoyance");
register(["base3-56"], "Cowardice", tentacoolCowardice);
for (const [id, base] of Object.entries({
  "base4-1": "base1-1",
  "base4-2": "base1-2",
  "base4-4": "base1-4",
  "base4-18": "base1-15",
  "base4-25": "base1-21",
}))
  Object.defineProperty(POWERS, id, {
    enumerable: true,
    get: () => BASE_POWERS[base],
  });
register(
  ["base5-5", "base5-22"],
  "Summon Minions",
  undefined,
  darkDragoniteSummonMinions,
);
register(["base5-6", "base5-23"], "Sinkhole");
register(
  ["base5-7", "base5-24"],
  "Sneak Attack",
  undefined,
  darkGolbatSneakAttack,
);
register(["base5-8", "base5-25"], "Final Beam");
register(["base5-12", "base5-29"], "Reel In", undefined, darkSlowbroReelIn);
register(["base5-13", "base5-30"], "Hay Fever");
register(["base5-33"], "Evolutionary Light", darkDragonairEvolutionaryLight);
register(["base5-36"], "Pollen Stench", darkGloomPollenStench);
register(["base5-39"], "Matter Exchange", darkKadabraMatterExchange);
register(["base5-41"], "Sticky Goo");
register(["base5-43"], "Frenzy");
register(["base5-50"], "Gather Fire", charmanderGatherFire);
register(["base5-54"], "Long-Distance Hypnosis", drowzeeLongDistanceHypnosis);
register(["base5-66"], "Trickery", rattataTrickery);
register(["gym1-2"], "Bench Guard");
register(["gym1-5"], "Pollen Defense");
register(["gym1-8"], "Energy Charge", surgeMagnetonEnergyCharge);
register(["gym1-10"], "Flee");
register(["gym1-12"], "Rebirth");
register(["gym1-26"], "Fragrance Trap", erikaVictreebelFragranceTrap);
register(["gym1-29"], "Shell Armor");
register(["gym1-33"], "Restless Sleep");
register(["gym1-42"], "Strange Barrier");
register(["gym1-47"], "Photosynthesis");
register(["gym1-65"], "Natural Healing", blaineVulpixNaturalHealing);
register(["gym2-3"], "Shapeshift", brockNinetalesShapeshift);
register(["gym2-6"], "Fortitude");
register(["gym2-8"], "Call the Boss", undefined, giovanniPersianCallTheBoss);
register(["gym2-13"], "Rebellion");
register(["gym2-16"], "Psylink");
register(["gym2-21"], "Healing Fire");
register(["gym2-26"], "Energy Drain");
register(["gym2-35"], "Scram");
register(["gym2-38"], "Soak Up", erikaBellsproutSoakUp);
register(["gym2-41"], "Relaxing Scent");
register(["gym2-47"], "Emerge", kogaKakunaEmerge);
register(["gym2-52"], "Shock Blast");
register(["gym2-97"], "Gaseous Form");
register(["neo1-4"], "Berserk", undefined, feraligatrBerserk);
register(["neo1-5"], "Downpour", feraligatrDownpour);
register(["neo1-6"], "Final Blow");
register(["neo1-10"], "Herbal Scent", undefined, meganiumHerbalScent);
register(["neo1-11"], "Wild Growth");
register(["neo1-14"], "Mind Games");
register(["neo1-17"], "Fire Recharge", typhlosionFireRecharge);
register(["neo1-18"], "Fire Boost", undefined, typhlosionFireBoost);
register(["neo1-22"], "Playful Punch", elekidPlayfulPunch);
register(["neo1-38"], "Hydroelectric Power");
register(["neo1-42"], "Glaring Gaze", noctowlGlaringGaze);
export function onPlayPower(c: EffectContext, p: Piece) {
  if (R.powerOn(c.state, p, c.catalog)) POWERS[p.card]?.onPlay?.(c, p);
}

export function availablePowers(
  s: import("../../game-types").GameState,
  p: Piece,
  catalog: import("../../game-types").Catalog,
) {
  return R.abilityCards(s, p, catalog).flatMap((card) =>
    POWERS[card.id] ? [{ ...POWERS[card.id], card }] : [],
  );
}
