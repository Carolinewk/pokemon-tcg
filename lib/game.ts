export * from "./game-types";
import type {
  Catalog,
  Player,
  GameState,
  Post,
  Deck,
  EffectIntent,
} from "./game-types";
import {
  initialState,
  shuffle,
  log,
  effect,
  isBasic,
  piece,
  allPieces,
  findPiece,
  draw,
  flip,
  condition,
  checkKnockouts,
  clearAttackEffects,
  discardEnergy,
} from "./game-core";
export { initialState, isBasic, allPieces, energyType } from "./game-core";
import { automaticAttack, canPay } from "./effects/base-set";
import { resolveEffect } from "./effect-engine";
import { trainerFor as trainerHandler } from "./effects/classic/trainers";
import * as classic from "./effects/classic/state";
import { attachmentEnergy } from "./effects/base-set/energy";
export { automaticAttack, canPay } from "./effects/base-set";
const copies = (id: string, n: number) => Array<string>(n).fill(id);
const trainers = [
  ...copies("base1-91", 4),
  ...copies("base1-88", 2),
  ...copies("base1-95", 2),
  ...copies("base1-85", 2),
];
export const STARTERS: Deck[] = [
  {
    id: "fire",
    name: "Ember & ash",
    description: "Build up to a devastating Fire Spin.",
    type: "Fire",
    cover: "base1-4",
    cards: [
      ...copies("base1-46", 4),
      ...copies("base1-24", 3),
      ...copies("base1-4", 2),
      ...copies("base1-28", 4),
      ...copies("base1-60", 4),
      ...copies("base1-58", 3),
      ...trainers,
      ...copies("base1-98", 24),
      ...copies("base1-100", 6),
    ],
  },
  {
    id: "water",
    name: "Tidal current",
    description: "A steady flow of powerful Water Pokémon.",
    type: "Water",
    cover: "base1-6",
    cards: [
      ...copies("base1-35", 4),
      ...copies("base1-6", 3),
      ...copies("base1-63", 4),
      ...copies("base1-65", 4),
      ...copies("base1-64", 2),
      ...copies("base1-59", 3),
      ...trainers,
      ...copies("base1-102", 30),
    ],
  },
  {
    id: "grass",
    name: "Leaf & lightning",
    description: "Poison, paralysis, and a little spark.",
    type: "Grass",
    cover: "base1-66",
    cards: [
      ...copies("base1-66", 4),
      ...copies("base1-44", 4),
      ...copies("base1-55", 4),
      ...copies("base1-37", 3),
      ...copies("base1-58", 3),
      ...copies("base1-67", 2),
      ...trainers,
      ...copies("base1-99", 22),
      ...copies("base1-100", 8),
    ],
  },
];
export function deckError(ids: string[], catalog: Catalog) {
  if (ids.length !== 60) return `A deck needs 60 cards (${ids.length}/60).`;
  if (ids.some((id) => !catalog[id]))
    return "This deck contains an unknown card.";
  if (!ids.some((id) => isBasic(catalog[id])))
    return "Add at least one Basic Pokémon.";
  const counts: Record<string, number> = {};
  for (const id of ids) {
    const c = catalog[id];
    if (c.supertype === "Energy" && c.subtypes.includes("Basic")) continue;
    counts[c.name] = (counts[c.name] || 0) + 1;
    if (
      counts[c.name] > 4 &&
      !c.rules.some((r) => /any number|as many/i.test(r))
    )
      return `Use at most 4 copies of ${c.name}.`;
  }
  return null;
}
export function applyPost(
  state: GameState,
  post: Post,
  catalog: Catalog,
): { state: GameState; error?: string } {
  const fail = (error: string) => ({ state, error });
  if (state.seen.includes(post.id)) return { state };
  type Payload = {
    cards?: string[];
    name?: string;
    deckName?: string;
    uid?: string;
    target?: string;
    manual?: boolean;
    index?: number;
    damage?: number;
    count?: number;
    condition?: string;
    owner?: string;
    from?: string;
    to?: string;
    kind?: string;
    choice?: string;
    resolution?: string;
    values?: string[];
  };
  let data: Payload;
  try {
    data = JSON.parse(post.payload);
    if (!data || typeof data !== "object") return fail("Invalid action.");
  } catch {
    return fail("Invalid action.");
  }
  const s = structuredClone(state);
  s.seq++;
  s.seen.push(post.id);
  s.seen = s.seen.slice(-4096);
  if (post.action === "join") {
    if (s.players.some((p) => p.id === post.pid)) return { state };
    if (s.players.length >= 2)
      return fail("This table already has two Trainers.");
    const ids = data.cards;
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string"))
      return fail("Choose a deck.");
    const err = deckError(ids, catalog);
    if (err) return fail(err);
    const p: Player = {
      id: post.pid,
      name: String(data.name || "Trainer").slice(0, 24),
      deckName: String(data.deckName || "Custom deck").slice(0, 40),
      deck: ids.map((card: string, i: number) => ({
        uid: post.pid + "-" + i,
        card,
      })),
      hand: [],
      prizes: [],
      discard: [],
      active: null,
      bench: [],
      ready: false,
      energyPlayed: false,
      supportPlayed: false,
      retreated: false,
      turns: 0,
      mulligans: 0,
    };
    do {
      shuffle(s, p.deck);
      p.hand = p.deck.splice(0, 7);
      if (p.hand.some((h) => isBasic(catalog[h.card]))) break;
      p.deck.push(...p.hand);
      p.hand = [];
      p.mulligans++;
    } while (p.mulligans < 100);
    if (!p.hand.length) return fail("Could not draw a starting hand.");
    p.prizes = p.deck.splice(0, 6);
    s.players.push(p);
    log(s, `${p.name} joined with ${p.deckName}.`, "join");
    if (p.mulligans)
      log(
        s,
        `${p.name} took ${p.mulligans} mulligan${p.mulligans > 1 ? "s" : ""}.`,
        "draw",
      );
    if (s.players.length === 2) {
      s.status = "setup";
      for (let i = 0; i < 2; i++)
        draw(s, s.players[i], Math.min(s.players[1 - i].mulligans, 20));
      log(s, "Choose an Active Basic Pokémon, then ready up.", "turn");
    }
    return { state: s };
  }
  const index = s.players.findIndex((p) => p.id === post.pid);
  if (index < 0) return fail("Join this table first.");
  const p = s.players[index];
  const opponent = s.players[1 - index];
  const resolve = (intent: EffectIntent) => {
    const result = resolveEffect(s, intent, catalog);
    return result.error ? fail(result.error) : result;
  };
  if (post.action === "concede") {
    if (s.status === "finished" || !opponent) return fail("No active match.");
    s.status = "finished";
    s.winner = opponent.id;
    delete s.pending;
    log(s, `${p.name} conceded. ${opponent.name} wins.`, "win");
    return { state: s };
  }
  if (s.status === "finished")
    return fail("This match has finished. Start a new table.");
  if (post.action === "choose") {
    const pending = s.pending;
    if (
      !pending ||
      data.resolution !== pending.id ||
      data.choice !== pending.choice.key
    )
      return fail("That choice has expired.");
    if (pending.choice.player !== p.id)
      return fail("This choice belongs to the other Trainer.");
    const values = data.values;
    if (!Array.isArray(values) || values.some((v) => typeof v !== "string"))
      return fail("Choose valid options.");
    const result = resolveEffect(
      s,
      pending.intent,
      catalog,
      { ...pending.answers, [pending.choice.key]: values },
      pending.id,
    );
    return result.error ? fail(result.error) : result;
  }
  if (s.pending) return fail("Finish the current card effect first.");
  if (post.action === "ready") {
    if (s.status !== "setup") return fail("Wait for another Trainer.");
    if (!p.active) return fail("Choose an Active Basic Pokémon first.");
    if (p.ready) return fail("You are already ready.");
    p.ready = true;
    log(s, `${p.name} is ready.`, "join");
    if (s.players.every((q) => q.ready)) {
      s.status = "playing";
      s.current = flip(s) ? 0 : 1;
      s.turn = 1;
      s.players[s.current].turns = 1;
      draw(s, s.players[s.current], 1, true);
      log(s, `${s.players[s.current].name} goes first.`, "turn");
    }
    return { state: s };
  }
  if (post.action === "promote") {
    if (p.active) return fail("Your Active spot is occupied.");
    const idx = p.bench.findIndex((c) => c.uid === data.uid);
    if (idx < 0) return fail("Choose a Benched Pokémon.");
    p.active = p.bench.splice(idx, 1)[0];
    log(s, `${p.name} promoted ${catalog[p.active.card].name}.`);
    return { state: s };
  }
  const setup = s.status === "setup" || s.status === "waiting";
  if (!setup && s.current !== index) return fail("It is your opponent's turn.");
  if (!setup && s.players.some((q) => !q.active))
    return fail("Choose a new Active Pokémon before continuing.");
  if (setup && p.ready)
    return fail("Wait for the other Trainer to finish setup.");
  if (post.action === "play") {
    const hi = p.hand.findIndex((h) => h.uid === data.uid);
    if (hi < 0) return fail("That card is no longer in your hand.");
    const h = p.hand[hi];
    const c = catalog[h.card];
    if (!setup && c.supertype !== "Trainer")
      return resolve({
        action: "play",
        player: p.id,
        uid: h.uid,
        target: data.target,
        manual: data.manual,
      });
    if (c.supertype === "Pokémon") {
      if (isBasic(c)) {
        if (p.active && p.bench.length >= 5)
          return fail("Your Bench is full (5 Pokémon).");
        const v = piece(h, s.turn);
        if (!p.active) p.active = v;
        else p.bench.push(v);
        log(s, `${p.name} played ${c.name}.`);
      } else {
        if (setup || p.turns < 2)
          return fail("You can evolve starting with your second turn.");
        const target = findPiece(p, data.target);
        if (!target || catalog[target.card].name !== c.evolvesFrom)
          return fail(
            `Choose ${c.evolvesFrom || "the matching Pokémon"} to evolve.`,
          );
        if (target.entered >= s.turn || target.evolved >= s.turn)
          return fail("This Pokémon must wait a turn before evolving.");
        target.stack.push(target.card);
        target.card = h.card;
        target.evolved = s.turn;
        clearAttackEffects(target);
        log(s, `${p.name} evolved into ${c.name}.`);
        effect(s, "evolve", c.name);
      }
    } else if (c.supertype === "Energy") {
      if (setup) return fail("Attach Energy once the match starts.");
      if (p.energyPlayed && !data.manual)
        return fail("You have attached your Energy for this turn.");
      const target = findPiece(p, data.target);
      if (!target) return fail("Choose a Pokémon for this Energy.");
      target.energy.push(h.card);
      p.energyPlayed = true;
      log(s, `${p.name} attached ${c.name} to ${catalog[target.card].name}.`);
      effect(s, "energy", "Energy attached");
    } else {
      if (setup) return fail("Play Trainer cards once the match starts.");
      if (classic.trainerBlocked(s, p, catalog))
        return fail("Trainer cards cannot be played right now.");
      if (c.subtypes.includes("Supporter")) {
        if (p.supportPlayed) return fail("One Supporter per turn.");
        if (s.turn === 1)
          return fail(
            "The first player cannot play a Supporter on their first turn.",
          );
        p.supportPlayed = true;
      }
      if (trainerHandler(c))
        return resolve({
          action: "trainer",
          player: p.id,
          uid: h.uid,
          target: data.target,
        });
      // Keep arbitrary printed effects explicit; tabletop tools resolve them.
      if (c.subtypes.includes("Stadium")) {
        if (s.stadium) {
          const owner = s.players.find((q) => q.id === s.stadium?.owner);
          owner?.discard.push({ uid: s.stadium.uid, card: s.stadium.card });
        }
        s.stadium = { ...h, owner: p.id };
      } else if (c.subtypes.includes("Pokémon Tool")) {
        const target = findPiece(p, data.target);
        if (!target) return fail("Choose a Pokémon for this Tool.");
        if (target.tools.length)
          return fail("This Pokémon already has a Tool.");
        target.tools.push(h.card);
      } else p.discard.push(h);
      p.hand.splice(hi, 1);
      log(
        s,
        `${p.name} played ${c.name}. Resolve its printed effect with table tools.`,
        "trainer",
      );
      return { state: s };
    }
    p.hand.splice(hi, 1);
    return { state: s };
  }
  if (setup) return fail("Place your Basic Pokémon and ready up first.");
  if (
    [
      "attack",
      "retreat",
      "power",
      "discardDoll",
      "stadium",
      "revealPiece",
    ].includes(post.action)
  ) {
    return resolve({
      action: post.action as EffectIntent["action"],
      player: p.id,
      uid: data.uid,
      index: data.index,
      damage: data.damage,
    });
  }
  if (post.action === "end") {
    return resolve({ action: "end", player: p.id });
  }
  if (post.action === "coin") {
    flip(s);
    effect(s, "coin", s.coin!);
    return { state: s };
  }
  if (post.action === "draw") {
    const n = Number(data.count);
    if (!Number.isInteger(n) || n < 1 || n > 20)
      return fail("Choose 1–20 cards.");
    draw(s, p, n);
    log(
      s,
      `${p.name} drew ${n} card${n > 1 ? "s" : ""} (card effect).`,
      "manual",
    );
    return { state: s };
  }
  if (post.action === "clearStadium") {
    if (!s.stadium) return fail("There is no Stadium in play.");
    const owner = s.players.find((q) => q.id === s.stadium?.owner);
    owner?.discard.push({ uid: s.stadium.uid, card: s.stadium.card });
    log(
      s,
      `${p.name} discarded ${catalog[s.stadium.card].name} (card effect).`,
      "manual",
    );
    s.stadium = null;
    return { state: s };
  }
  if (post.action === "shuffle") {
    shuffle(s, p.deck);
    log(s, `${p.name} shuffled their deck.`, "manual");
    return { state: s };
  }
  if (post.action === "adjust") {
    const q = s.players.find((x) => x.id === data.owner);
    const target = q && findPiece(q, data.uid);
    if (!target) return fail("Choose a Pokémon on the table.");
    if (data.condition === "Clear") target.conditions = [];
    else if (
      ["Poisoned", "Burned", "Asleep", "Paralyzed", "Confused"].includes(
        data.condition || "",
      )
    )
      condition(target, data.condition!);
    else if (
      typeof data.damage === "number" &&
      Number.isInteger(data.damage) &&
      Math.abs(data.damage) <= 9990
    )
      target.damage = Math.max(0, target.damage + data.damage);
    else return fail("Choose damage or a Special Condition.");
    log(
      s,
      `${p.name} adjusted ${catalog[target.card].name}: ${data.condition || `${Number(data.damage) > 0 ? "+" : ""}${data.damage} damage`} (card effect).`,
      "manual",
    );
    return { state: s };
  }
  if (post.action === "resolve") {
    checkKnockouts(s, catalog);
    log(s, "Resolved Knock Outs from card effects.", "manual");
    return { state: s };
  }
  if (post.action === "move") {
    const valid = ["hand", "deck", "discard", "prizes"];
    if (
      !valid.includes(data.from || "") ||
      !valid.includes(data.to || "") ||
      data.from === data.to
    )
      return fail("Choose different card zones.");
    const from = p[data.from as "hand"];
    const idx = from.findIndex((h) => h.uid === data.uid);
    if (idx < 0) return fail("Card not found.");
    const [h] = from.splice(idx, 1);
    p[data.to as "hand"].push(h);
    log(
      s,
      `${p.name} moved a card from ${data.from} to ${data.to} (card effect).`,
      "manual",
    );
    return { state: s };
  }
  if (post.action === "detach") {
    const q = s.players.find((x) => x.id === data.owner);
    const target = q && findPiece(q, data.uid);
    if (!q || !target) return fail("Choose a Pokémon.");
    const key = data.kind === "tool" ? "tools" : "energy";
    const idx = Number(data.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= target[key].length)
      return fail("Choose an attachment.");
    const card = target[key][idx];
    if (key === "energy") discardEnergy(s, q, target, [idx]);
    else {
      target.tools.splice(idx, 1);
      q.discard.push({ uid: `${target.uid}-detach-${s.seq}`, card });
    }
    log(
      s,
      `${p.name} discarded ${catalog[card].name} from ${catalog[target.card].name} (card effect).`,
      "manual",
    );
    return { state: s };
  }
  if (post.action === "swap") {
    const q = s.players.find((x) => x.id === data.owner);
    const idx = q?.bench.findIndex((b) => b.uid === data.uid) ?? -1;
    if (!q || !q.active || idx < 0) return fail("Choose a Benched Pokémon.");
    const old = q.active;
    clearAttackEffects(old);
    q.active = q.bench[idx];
    q.bench[idx] = old;
    log(
      s,
      `${p.name} switched ${q.name}'s Active Pokémon (card effect).`,
      "manual",
    );
    return { state: s };
  }
  return fail("Unknown action.");
}
export function reducer(post: Post, state: GameState, catalog: Catalog) {
  try {
    return applyPost(state, post, catalog).state;
  } catch {
    return state;
  }
}
export function makePractice(
  catalog: Catalog,
  deck: Deck = STARTERS[0],
  seed = "practice-intro",
): GameState {
  let s = initialState(seed);
  let n = 0;
  const post = (pid: string, action: string, payload: unknown) => {
    s = reducer(
      { pid, id: `init-${n++}`, action, payload: JSON.stringify(payload) },
      s,
      catalog,
    );
  };
  post("you", "join", { name: "You", deckName: deck.name, cards: deck.cards });
  post("bot", "join", {
    name: "Misty",
    deckName: STARTERS[1].name,
    cards: STARTERS[1].cards,
  });
  for (const p of s.players) {
    const h = p.hand.find((h) => isBasic(catalog[h.card]));
    if (h) post(p.id, "play", { uid: h.uid });
    post(p.id, "ready", {});
  }
  // The guided opening is a legal saved table position, ready for an Energy attachment.
  if (seed === "practice-intro" && deck.id === "fire") {
    for (const p of s.players) {
      p.deck.push(...p.hand, ...p.prizes);
      if (p.active) p.deck.push({ uid: p.active.uid, card: p.active.card });
      p.hand = [];
      p.prizes = [];
      p.active = null;
      p.bench = [];
      p.turns = 2;
    }
    const take = (p: Player, id: string) => {
      const i = p.deck.findIndex((c) => c.card === id);
      if (i < 0) throw Error("Missing practice card " + id);
      return p.deck.splice(i, 1)[0];
    };
    const p = s.players[0],
      o = s.players[1];
    p.active = piece(take(p, "base1-24"), 0);
    p.active.stack = [take(p, "base1-46").card];
    p.active.energy = [take(p, "base1-98").card, take(p, "base1-98").card];
    p.active.damage = 10;
    p.bench = [piece(take(p, "base1-28"), 0), piece(take(p, "base1-60"), 0)];
    p.hand = [
      "base1-4",
      "base1-98",
      "base1-46",
      "base1-91",
      "base1-60",
      "base1-98",
      "base1-95",
    ].map((id) => take(p, id));
    o.active = piece(take(o, "base1-63"), 0);
    o.active.energy = [take(o, "base1-102").card];
    o.bench = [piece(take(o, "base1-35"), 0), piece(take(o, "base1-65"), 0)];
    o.hand = o.deck.splice(0, 5);
    for (const q of s.players) q.prizes = q.deck.splice(0, 6);
    s.status = "playing";
    s.turn = 4;
    s.current = 0;
    s.log = [
      {
        id: 0,
        text: "Practice match ready. Attach Energy, evolve, or play a Trainer.",
        kind: "turn",
      },
    ];
    s.effect = null;
    s.coin = null;
  }
  return s;
}
export function botAction(
  s: GameState,
  catalog: Catalog,
  playerId = "bot",
): { action: string; data: Record<string, unknown> } | null {
  const p = s.players.find((p) => p.id === playerId);
  if (!p || s.status !== "playing") return null;
  if (s.pending) {
    const { choice, id } = s.pending;
    if (choice.player !== playerId) return null;
    if (choice.input)
      return {
        action: "choose",
        data: { resolution: id, choice: choice.key, values: ["1'0"] },
      };
    let options = choice.options;
    if (choice.key === "heal-amount") options = [...options].reverse();
    if (choice.key === "retreat-energy") {
      const cost = classic.retreatCost(s, p, catalog);
      const chosen: string[] = [];
      let paid = 0;
      for (const o of [...options].sort(
        (a, b) =>
          attachmentEnergy(p.active!, Number(b.value), catalog, s).length -
          attachmentEnergy(p.active!, Number(a.value), catalog, s).length,
      )) {
        chosen.push(o.value);
        paid += attachmentEnergy(p.active!, Number(o.value), catalog, s).length;
        if (paid >= cost) break;
      }
      return {
        action: "choose",
        data: { resolution: id, choice: choice.key, values: chosen },
      };
    }
    return {
      action: "choose",
      data: {
        resolution: id,
        choice: choice.key,
        values: options.slice(0, choice.max).map((o) => o.value),
      },
    };
  }

  if (!p.active && p.bench.length)
    return { action: "promote", data: { uid: p.bench[0].uid } };
  if (
    s.players[s.current]?.id !== playerId ||
    !p.active ||
    s.players.some((q) => !q.active)
  )
    return null;
  if (p.active.faceDown)
    return { action: "revealPiece", data: { uid: p.active.uid } };
  if (p.bench.length < classic.narrowGym(s)) {
    const basic = p.hand.find((h) => isBasic(catalog[h.card]));
    if (basic) return { action: "play", data: { uid: basic.uid } };
  }
  const evo = p.hand.find(
    (h) =>
      catalog[h.card].evolvesFrom &&
      allPieces(p).some(
        (c) =>
          catalog[c.card].name === catalog[h.card].evolvesFrom &&
          c.entered < s.turn &&
          c.evolved < s.turn,
      ) &&
      p.turns >= 2,
  );
  if (evo && !classic.evolutionBlocked(s, catalog))
    return {
      action: "play",
      data: {
        uid: evo.uid,
        target: allPieces(p).find(
          (c) =>
            catalog[c.card].name === catalog[evo.card].evolvesFrom &&
            c.entered < s.turn &&
            c.evolved < s.turn,
        )!.uid,
      },
    };
  if (!p.energyPlayed) {
    const energy = p.hand.find((h) => catalog[h.card].supertype === "Energy");
    if (energy) {
      const target =
        [p.active, ...p.bench].find(
          (c) =>
            !classic.mark(s, c, "noEnergy") &&
            c.energy.length <
              Math.max(...catalog[c.card].attacks.map((a) => a.cost.length), 1),
        ) || p.active;
      if (!classic.mark(s, target, "noEnergy"))
        return {
          action: "play",
          data: { uid: energy.uid, target: target.uid },
        };
    }
  }
  const bill = p.hand.find((h) => catalog[h.card].name === "Bill");
  if (bill && !classic.trainerBlocked(s, p, catalog))
    return { action: "play", data: { uid: bill.uid } };
  if (
    p.active.card === "base1-4" &&
    p.active.energy.length &&
    classic.powerOn(s, p.active, catalog) &&
    (p.active.effects?.energyBurnTurn !== s.turn ||
      p.active.burnedEnergy?.length !== p.active.energy.length)
  )
    return { action: "power", data: { uid: p.active.uid } };
  const attacks = classic
    .attackOptions(s, p.active, catalog)
    .map(({ attack: a, card }, i) => ({ a, i, card }))
    .filter(
      ({ a, i, card }) =>
        canPay(p.active!, a, catalog, s) &&
        automaticAttack(card, a) &&
        !resolveEffect(
          s,
          {
            action: "attack",
            player: p.id,
            index: i,
          },
          catalog,
        ).error,
    )
    .sort(
      (a, b) =>
        (Number.parseInt(b.a.damage) || 0) - (Number.parseInt(a.a.damage) || 0),
    );
  if (
    attacks.length &&
    s.turn > 1 &&
    !p.active.conditions.some((c) => ["Asleep", "Paralyzed"].includes(c))
  )
    return { action: "attack", data: { index: attacks[0].i } };
  return { action: "end", data: {} };
}
