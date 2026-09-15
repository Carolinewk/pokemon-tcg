import type {
  Card,
  Catalog,
  Piece,
  HandCard,
  Player,
  GameState,
} from "./game-types";
export { energyType } from "./effects/base-set/energy";
import { clefairyDollRules } from "./effects/base-set/modifiers";
import * as R from "./effects/classic/state";
import * as L from "./effects/classic/lifecycle";
import { ENERGY_NAMES } from "./effects/classic/energy-cards";
import { attachmentEnergy } from "./effects/base-set/energy";
import { EffectContext, type Answers } from "./effects/context";
export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
export function initialState(room = "practice"): GameState {
  return {
    players: [],
    status: "waiting",
    turn: 0,
    current: 0,
    seed: hash(room) || 1,
    seq: 0,
    log: [],
    winner: null,
    coin: null,
    stadium: null,
    seen: [],
    effect: null,
  };
}
export function random(s: GameState) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
export function shuffle<T>(s: GameState, a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function log(s: GameState, text: string, kind = "play") {
  s.log.push({ id: s.seq, text, kind });
  s.log = s.log.slice(-80);
}
export function effect(s: GameState, kind: string, text: string) {
  s.effect = { id: s.seq, kind, text };
}
export const isBasic = (c: Card | undefined) => R.startingPokemon(c);
export function piece(h: HandCard, turn: number): Piece {
  return {
    ...h,
    damage: 0,
    energy: [],
    stack: [],
    tools: [],
    conditions: [],
    entered: turn,
    evolved: -1,
    shield: 0,
  };
}
export function allPieces(p: Player) {
  return [...(p.active ? [p.active] : []), ...p.bench];
}
export function findPiece(p: Player, uid: string | undefined) {
  return allPieces(p).find((x) => x.uid === uid);
}
export function draw(s: GameState, p: Player, n: number, required = false) {
  for (let i = 0; i < n; i++) {
    const c = p.deck.shift();
    if (c) p.hand.push(c);
    else if (required) {
      s.status = "finished";
      s.winner = s.players.find((q) => q.id !== p.id)?.id || null;
      log(s, `${p.name} cannot draw. The other Trainer wins.`, "win");
      break;
    }
  }
}
export function flip(s: GameState) {
  const heads = random(s) >= 0.5;
  s.coin = heads ? "Heads" : "Tails";
  log(s, `Coin flip: ${s.coin}.`, "coin");
  return heads;
}
export function condition(c: Piece, name: string) {
  if (clefairyDollRules(c.card).immuneToConditions) return;
  if (["Asleep", "Confused", "Paralyzed"].includes(name))
    c.conditions = c.conditions.filter(
      (x) => !["Asleep", "Confused", "Paralyzed"].includes(x),
    );
  if (!c.conditions.includes(name)) c.conditions.push(name);
  if (name === "Poisoned") {
    c.effects ||= {};
    c.effects.poisonDamage = 10;
  }
}
/** Benching and evolution clear attack effects, but not attached cards or Energy Burn. */
export function clearAttackEffects(c: Piece) {
  c.conditions = [];
  c.generation = (c.generation || 0) + 1;
  c.marks = {};
  delete c.lastUsed;
  c.shield = 0;
  c.effects =
    c.effects?.energyBurnTurn === undefined
      ? {}
      : { energyBurnTurn: c.effects.energyBurnTurn };
  delete c.lastAttack;
}
export function switchActive(p: Player, uid: string) {
  const i = p.bench.findIndex((b) => b.uid === uid);
  if (i < 0 || !p.active) throw new Error("Choose a Benched Pokémon.");
  const old = p.active;
  clearAttackEffects(old);
  const ninja = (old.trainerAttachments || []).filter(
    (t) => t.card === "gym2-115",
  );
  p.discard.push(...ninja.map(({ uid, card }) => ({ uid, card })));
  old.trainerAttachments = (old.trainerAttachments || []).filter(
    (t) => t.card !== "gym2-115",
  );
  p.active = p.bench[i];
  p.bench[i] = old;
}
export function takeEnergy(c: Piece, index: number) {
  const card = c.energy.splice(index, 1)[0];
  const type = c.energyTypes?.[index];
  const burned = c.burnedEnergy?.includes(index) || false;
  c.energyTypes = Object.fromEntries(
    Object.entries(c.energyTypes || {})
      .filter(([i]) => +i !== index)
      .map(([i, t]) => [+i > index ? +i - 1 : +i, t]),
  );
  c.burnedEnergy = (c.burnedEnergy || [])
    .filter((i) => i !== index)
    .map((i) => (i > index ? i - 1 : i));
  return { card, type, burned };
}
export function discardEnergy(
  s: GameState,
  p: Player,
  c: Piece,
  indices: number[],
  cause: { player: string; kind: string } = s.resolving || {
    player: s.players[s.current]?.id || p.id,
    kind: "effect",
  },
) {
  const removed: string[] = [];
  if (
    cause.player !== p.id &&
    ["attack", "trainer"].includes(cause.kind) &&
    (c.trainerAttachments || []).some((t) => t.card === "gym2-101")
  )
    return removed;
  for (const i of [...indices].sort((a, b) => b - a)) {
    const units = attachmentEnergy(c, i, {
      [c.energy[i]]: {
        name: ENERGY_NAMES[c.energy[i]] || "Colorless Energy",
      } as Card,
    });
    const { card } = takeEnergy(c, i);
    if (card) {
      removed.push(card);
      const eco =
        s.stadium?.card === "neo1-84" &&
        cause.player !== p.id &&
        cause.kind !== "knockout" &&
        units.some((t) => t !== "Colorless");
      (card === "neo1-105" || eco ? p.hand : p.discard).push({
        uid: `${p.id}-energy-${s.seq}-${p.discard.length}`,
        card,
      });
    }
  }
  return removed;
}
export function discardAttachments(s: GameState, p: Player, c: Piece) {
  discardEnergy(
    s,
    p,
    c,
    c.energy.map((_, i) => i),
    { player: p.id, kind: "knockout" },
  );
  p.discard.push(
    ...c.tools.map((card, i) => ({ uid: `${c.uid}-tool-${s.seq}-${i}`, card })),
    ...(c.trainerAttachments || []).map(({ uid, card }) => ({ uid, card })),
  );
  if (c.shape || c.shapeAttachments?.length) {
    p.discard.push(...(c.shapeAttachments || (c.shape ? [c.shape] : [])));
    delete c.shape;
    delete c.shapeAttachments;
  }
  c.tools = [];
  c.trainerAttachments = [];
}
export function removePiece(p: Player, c: Piece) {
  if (p.active?.uid === c.uid) p.active = null;
  else p.bench = p.bench.filter((b) => b.uid !== c.uid);
}
export function awardPrizes(s: GameState, p: Player, count: number) {
  p.hand.push(...p.prizes.splice(0, count));
  log(
    s,
    `${p.name} took ${count} Prize card${count === 1 ? "" : "s"}.`,
    "prize",
  );
}
export function checkKnockouts(s: GameState, catalog: Catalog) {
  const awards: [number, number][] = [];
  for (let i = 0; i < s.players.length; i++) {
    const p = s.players[i];
    for (const c of allPieces(p)) {
      if (c.damage < (R.maximumHP(s, c, catalog) || 9999)) continue;
      const card = catalog[c.card];
      const rebirth = R.mark(s, c, "rebirth");
      p.discard.push(
        { uid: c.uid, card: c.card },
        ...c.stack.map((id, k) => ({ uid: c.uid + "s" + k, card: id })),
      );
      discardAttachments(s, p, c);
      removePiece(p, c);
      if (rebirth) {
        const i = p.discard.findIndex((h) => h.uid === c.uid);
        if (i >= 0) p.hand.push(...p.discard.splice(i, 1));
      }
      const prizes = card.subtypes.some((t) => ["VMAX", "TAG TEAM"].includes(t))
        ? 3
        : card.subtypes.some((t) =>
              ["ex", "EX", "V", "VSTAR", "V-UNION", "GX"].includes(t),
            )
          ? 2
          : 1;
      if (clefairyDollRules(c.card).awardsPrizes) awards.push([1 - i, prizes]);
      log(s, `${card.name} was Knocked Out!`, "knockout");
      effect(s, "knockout", `${card.name} • Knocked Out`);
    }
  }
  for (const [idx, n] of awards) {
    const p = s.players[idx];
    if (!p) continue;
    awardPrizes(s, p, n);
  }
  const winners = s.players.filter(
    (p, i) =>
      (p.prizes.length === 0 && s.status === "playing") ||
      (!s.players[1 - i]?.active &&
        !s.players[1 - i]?.bench.length &&
        s.status === "playing"),
  );
  if (winners.length) {
    s.status = "finished";
    delete s.pending;
    s.winner = winners.length === 1 ? winners[0].id : "draw";
    log(
      s,
      winners.length === 1
        ? `${winners[0].name} wins the match!`
        : "The match ends in a draw.",
      "win",
    );
    effect(
      s,
      "win",
      winners.length === 1 ? `${winners[0].name} wins!` : "A draw!",
    );
  }
}
export function nextTurn(
  s: GameState,
  catalog: Catalog,
  answers: Answers = {},
) {
  const ctx = new EffectContext(s, catalog, s.players[s.current], answers);
  L.endOfTurnEffects(ctx);
  const ending = s.players[s.current];
  for (const p of s.players) {
    const a = p.active;
    if (!a) continue;
    if (a.conditions.includes("Poisoned"))
      a.damage += a.effects?.poisonDamage || 10;
    if (a.conditions.includes("Burned")) {
      a.damage += 20;
      if (flip(s)) a.conditions = a.conditions.filter((x) => x !== "Burned");
    }
    if (a.conditions.includes("Asleep") && flip(s))
      a.conditions = a.conditions.filter((x) => x !== "Asleep");
  }
  if (ending.active)
    ending.active.conditions = ending.active.conditions.filter(
      (x) => x !== "Paralyzed",
    );
  for (const p of s.players)
    for (const c of allPieces(p)) {
      const expired = (c.trainerAttachments || []).filter(
        (t) => t.expires <= s.turn,
      );
      p.discard.push(
        ...expired
          .filter((t) => t.card !== "gym1-99")
          .map(({ uid, card }) => ({ uid, card })),
      );
      p.hand.push(
        ...expired
          .filter((t) => t.card === "gym1-99")
          .map(({ uid, card }) => ({ uid, card })),
      );
      c.trainerAttachments = (c.trainerAttachments || []).filter(
        (t) => t.expires > s.turn,
      );
      if (
        c.effects?.energyBurnTurn !== undefined &&
        c.effects.energyBurnTurn <= s.turn
      ) {
        delete c.effects.energyBurnTurn;
        c.burnedEnergy = [];
      }
    }
  L.ticklingMachineReturn(s);
  L.beforeKnockouts(ctx);
  checkKnockouts(s, catalog);
  if (s.status === "finished") return;
  s.current = 1 - s.current;
  s.turn++;
  const p = s.players[s.current];
  p.energyPlayed = false;
  p.supportPlayed = false;
  p.retreated = false;
  p.turns++;
  for (const c of allPieces(p)) c.shield = 0;
  L.startOfTurnEffects(ctx);
  L.normalizePowers(ctx);
  checkKnockouts(s, catalog);
  if ((s.status as string) === "finished") return;
  draw(s, p, 1, true);
  log(s, `${p.name}'s turn. Drew a card.`, "turn");
}
