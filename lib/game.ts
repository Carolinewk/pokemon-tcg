export type Attack = {
  name: string;
  cost: string[];
  damage: string;
  text: string;
  convertedEnergyCost: number;
};
export type Card = {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp: number;
  types: string[];
  evolvesFrom: string;
  attacks: Attack[];
  abilities: { name: string; text: string; type: string }[];
  rules: string[];
  weaknesses: { type: string; value: string }[];
  resistances: { type: string; value: string }[];
  retreat: number;
  image: string;
  small: string;
  set: string;
  setId: string;
  number: string;
  rarity: string;
  date: string;
  legalities: Record<string, string>;
};
export type Catalog = Record<string, Card>;
export type Piece = {
  uid: string;
  card: string;
  damage: number;
  energy: string[];
  stack: string[];
  tools: string[];
  conditions: string[];
  entered: number;
  evolved: number;
  shield: number;
};
export type HandCard = { uid: string; card: string };
export type Player = {
  id: string;
  name: string;
  deckName: string;
  deck: HandCard[];
  hand: HandCard[];
  prizes: HandCard[];
  discard: HandCard[];
  active: Piece | null;
  bench: Piece[];
  ready: boolean;
  energyPlayed: boolean;
  supportPlayed: boolean;
  retreated: boolean;
  turns: number;
  mulligans: number;
};
export type GameState = {
  players: Player[];
  status: "waiting" | "setup" | "playing" | "finished";
  turn: number;
  current: number;
  seed: number;
  seq: number;
  log: { id: number; text: string; kind: string }[];
  winner: string | null;
  coin: string | null;
  stadium: HandCard | null;
  seen: string[];
  effect: { id: number; kind: string; text: string } | null;
};
export type Post = { pid: string; id: string; action: string; payload: string };
export type Deck = {
  id: string;
  name: string;
  description: string;
  type: string;
  cover: string;
  cards: string[];
};
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
function random(s: GameState) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function shuffle<T>(s: GameState, a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function log(s: GameState, text: string, kind = "play") {
  s.log.push({ id: s.seq, text, kind });
  s.log = s.log.slice(-80);
}
function effect(s: GameState, kind: string, text: string) {
  s.effect = { id: s.seq, kind, text };
}
export const isBasic = (c: Card | undefined) =>
  c?.supertype === "Pokémon" && c.subtypes.includes("Basic");
export const energyType = (c: Card | undefined) =>
  [
    "Fire",
    "Water",
    "Grass",
    "Lightning",
    "Psychic",
    "Fighting",
    "Darkness",
    "Metal",
    "Fairy",
  ].find((t) => c?.name.includes(t)) || "Colorless";
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
function piece(h: HandCard, turn: number): Piece {
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
function findPiece(p: Player, uid: string | undefined) {
  return allPieces(p).find((x) => x.uid === uid);
}
function draw(s: GameState, p: Player, n: number, required = false) {
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
function flip(s: GameState) {
  const heads = random(s) >= 0.5;
  s.coin = heads ? "Heads" : "Tails";
  log(s, `Coin flip: ${s.coin}.`, "coin");
  return heads;
}
function condition(c: Piece, name: string) {
  if (["Asleep", "Confused", "Paralyzed"].includes(name))
    c.conditions = c.conditions.filter(
      (x) => !["Asleep", "Confused", "Paralyzed"].includes(x),
    );
  if (!c.conditions.includes(name)) c.conditions.push(name);
}
function checkKnockouts(s: GameState, catalog: Catalog) {
  const awards: [number, number][] = [];
  for (let i = 0; i < s.players.length; i++) {
    const p = s.players[i];
    for (const c of allPieces(p)) {
      if (c.damage < (catalog[c.card]?.hp || 9999)) continue;
      const card = catalog[c.card];
      p.discard.push(
        { uid: c.uid, card: c.card },
        ...c.stack.map((id, k) => ({ uid: c.uid + "s" + k, card: id })),
        ...c.energy.map((id, k) => ({ uid: c.uid + "e" + k, card: id })),
        ...c.tools.map((id, k) => ({ uid: c.uid + "t" + k, card: id })),
      );
      if (p.active?.uid === c.uid) p.active = null;
      else p.bench = p.bench.filter((b) => b.uid !== c.uid);
      const prizes = card.subtypes.some((t) => ["VMAX", "TAG TEAM"].includes(t))
        ? 3
        : card.subtypes.some((t) =>
              ["ex", "EX", "V", "VSTAR", "V-UNION", "GX"].includes(t),
            )
          ? 2
          : 1;
      awards.push([1 - i, prizes]);
      log(s, `${card.name} was Knocked Out!`, "knockout");
      effect(s, "knockout", `${card.name} • Knocked Out`);
    }
  }
  for (const [idx, n] of awards) {
    const p = s.players[idx];
    if (!p) continue;
    for (let i = 0; i < n; i++) {
      const card = p.prizes.shift();
      if (card) p.hand.push(card);
    }
    log(s, `${p.name} took ${n} Prize card${n > 1 ? "s" : ""}.`, "prize");
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
function nextTurn(s: GameState, catalog: Catalog) {
  const ending = s.players[s.current];
  for (const p of s.players) {
    const a = p.active;
    if (!a) continue;
    if (a.conditions.includes("Poisoned")) a.damage += 10;
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
  draw(s, p, 1, true);
  log(s, `${p.name}'s turn. Drew a card.`, "turn");
}
export function canPay(c: Piece, attack: Attack, catalog: Catalog) {
  const pool = c.energy.flatMap((id) => {
    const card = catalog[id];
    return /Double Colorless|Twin Energy/.test(card?.name || "")
      ? ["Colorless", "Colorless"]
      : [energyType(card)];
  });
  for (const cost of attack.cost.filter((t) => t !== "Colorless")) {
    let ix = pool.indexOf(cost);
    if (ix < 0 && catalog[c.card]?.id === "base1-4") ix = pool.length ? 0 : -1;
    if (ix < 0) return false;
    pool.splice(ix, 1);
  }
  return pool.length >= attack.cost.filter((t) => t === "Colorless").length;
}
export function automaticAttack(card: Card, attack: Attack) {
  return (
    (!attack.text && !/[+×x]/.test(attack.damage)) ||
    (card.setId === "base1" &&
      [
        "Fire Spin",
        "Flamethrower",
        "Ember",
        "Recover",
        "Flail",
        "Double Kick",
        "Psyshock",
        "Leech Seed",
        "Foul Gas",
        "Horn Hazard",
        "Thunder Jolt",
        "Water Gun",
        "Bubble",
        "Withdraw",
        "Star Freeze",
        "Bind",
        "Poisonpowder",
        "Bubblebeam",
      ].includes(attack.name))
  );
}
function attackDamage(
  s: GameState,
  a: Piece,
  b: Piece,
  attack: Attack,
  catalog: Catalog,
  override?: number,
) {
  const card = catalog[a.card];
  let damage = Number.parseInt(attack.damage) || 0;
  const text = attack.text;
  if (override !== undefined) damage = override;
  else if (card.setId === "base1") {
    if (attack.name === "Flail") damage = a.damage;
    if (attack.name === "Double Kick")
      damage = 30 * (Number(flip(s)) + Number(flip(s)));
    if (attack.name === "Horn Hazard" && !flip(s)) damage = 0;
    if (attack.name === "Water Gun")
      damage +=
        10 *
        Math.min(
          2,
          Math.max(
            0,
            a.energy.filter((id) => energyType(catalog[id]) === "Water")
              .length - 1,
          ),
        );
    if (
      ["Bubble", "Bubblebeam", "Psyshock", "Star Freeze", "Bind"].includes(
        attack.name,
      ) &&
      flip(s)
    )
      condition(b, "Paralyzed");
    if (attack.name === "Foul Gas")
      condition(b, flip(s) ? "Poisoned" : "Confused");
    if (attack.name === "Poisonpowder") condition(b, "Poisoned");
    if (attack.name === "Thunder Jolt" && !flip(s)) a.damage += 10;
    if (attack.name === "Withdraw" && flip(s)) a.shield = s.turn + 1;
    if (attack.name === "Recover") a.damage = 0;
    const discard = text.match(
      /Discard (\d+) (Fire |Psychic |Water )?Energy card/,
    );
    if (discard) {
      const count = Number(discard[1]);
      for (let n = 0; n < count; n++) {
        const i = discard[2]
          ? a.energy.findIndex(
              (id) => energyType(catalog[id]) === discard[2].trim(),
            )
          : 0;
        if (i >= 0) {
          const [id] = a.energy.splice(i, 1);
          s.players[s.current].discard.push({
            uid: `${a.uid}-cost-${s.seq}-${n}`,
            card: id,
          });
        }
      }
    }
  }
  if (damage > 0) {
    const weak = catalog[b.card].weaknesses.find((w) =>
      card.types.includes(w.type),
    );
    const resist = catalog[b.card].resistances.find((w) =>
      card.types.includes(w.type),
    );
    if (weak)
      damage = weak.value.includes("×")
        ? damage * (Number(weak.value.replace("×", "")) || 2)
        : damage + (Number(weak.value) || 0);
    if (resist) damage += Number(resist.value) || 0;
    if (b.shield >= s.turn) damage = 0;
    damage = Math.max(0, damage);
  }
  b.damage += damage;
  if (attack.name === "Leech Seed" && card.setId === "base1" && damage > 0)
    a.damage = Math.max(0, a.damage - 10);
  return damage;
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
  if (post.action === "concede") {
    if (s.status === "finished" || !opponent) return fail("No active match.");
    s.status = "finished";
    s.winner = opponent.id;
    log(s, `${p.name} conceded. ${opponent.name} wins.`, "win");
    return { state: s };
  }
  if (s.status === "finished")
    return fail("This match has finished. Start a new table.");
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
        target.conditions = [];
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
      if (c.subtypes.includes("Supporter")) {
        if (p.supportPlayed) return fail("One Supporter per turn.");
        if (s.turn === 1)
          return fail(
            "The first player cannot play a Supporter on their first turn.",
          );
        p.supportPlayed = true;
      }
      // Keep arbitrary printed effects explicit; tabletop tools resolve them.
      if (c.subtypes.includes("Stadium")) {
        if (s.stadium) p.discard.push(s.stadium);
        s.stadium = h;
      } else if (c.subtypes.includes("Pokémon Tool")) {
        const target = findPiece(p, data.target);
        if (!target) return fail("Choose a Pokémon for this Tool.");
        if (target.tools.length)
          return fail("This Pokémon already has a Tool.");
        target.tools.push(h.card);
      } else p.discard.push(h);
      p.hand.splice(hi, 1);
      if (c.name === "Bill") draw(s, p, 2);
      else if (c.name === "Professor Oak") {
        p.discard.push(...p.hand);
        p.hand = [];
        draw(s, p, 7);
      } else if (c.name === "Pokémon Center") {
        for (const v of allPieces(p)) {
          if (v.damage) {
            v.damage = 0;
            p.discard.push(
              ...v.energy.map((id, k) => ({
                uid: `${v.uid}-heal-${s.seq}-${k}`,
                card: id,
              })),
            );
            v.energy = [];
          }
        }
      } else if (c.name === "Switch") {
        const bi = p.bench.findIndex((b) => b.uid === data.target);
        if (bi < 0 || !p.active)
          return fail("Choose a Benched Pokémon to switch.");
        const old = p.active;
        old.conditions = [];
        p.active = p.bench[bi];
        p.bench[bi] = old;
      }
      log(
        s,
        `${p.name} played ${c.name}.${!["Bill", "Professor Oak", "Pokémon Center", "Switch"].includes(c.name) ? " Resolve its printed effect with table tools." : ""}`,
        "trainer",
      );
      return { state: s };
    }
    p.hand.splice(hi, 1);
    return { state: s };
  }
  if (setup) return fail("Place your Basic Pokémon and ready up first.");
  if (post.action === "attack") {
    const a = p.active,
      b = opponent?.active;
    if (!a || !b) return fail("Both Trainers need an Active Pokémon.");
    if (s.turn === 1)
      return fail("The first player cannot attack on the first turn.");
    if (a.conditions.some((c) => ["Asleep", "Paralyzed"].includes(c)))
      return fail(
        `${catalog[a.card].name} cannot attack while ${a.conditions.join(", ")}.`,
      );
    const attack = catalog[a.card].attacks[Number(data.index)];
    if (!attack) return fail("Choose an attack.");
    if (!canPay(a, attack, catalog))
      return fail("Attach the required Energy first.");
    if (
      !automaticAttack(catalog[a.card], attack) &&
      (typeof data.damage !== "number" ||
        !Number.isInteger(data.damage) ||
        data.damage < 0 ||
        data.damage > 9990)
    )
      return fail(
        "Enter this attack’s damage and resolve its printed effects with table tools.",
      );
    if (a.conditions.includes("Confused") && !flip(s)) {
      a.damage += 30;
      log(s, `${catalog[a.card].name} hurt itself in confusion.`, "attack");
      nextTurn(s, catalog);
      return { state: s };
    }
    const damage = attackDamage(
      s,
      a,
      b,
      attack,
      catalog,
      automaticAttack(catalog[a.card], attack) ? undefined : data.damage,
    );
    log(
      s,
      `${catalog[a.card].name} used ${attack.name} for ${damage} damage.`,
      "attack",
    );
    effect(s, "attack", `${attack.name} · ${damage}`);
    checkKnockouts(s, catalog);
    if (s.status === "playing") nextTurn(s, catalog);
    return { state: s };
  }
  if (post.action === "retreat") {
    if (p.retreated) return fail("You have already retreated this turn.");
    if (!p.active) return fail("No Active Pokémon.");
    if (p.active.conditions.some((c) => ["Asleep", "Paralyzed"].includes(c)))
      return fail("An Asleep or Paralyzed Pokémon cannot retreat.");
    const idx = p.bench.findIndex((b) => b.uid === data.uid);
    if (idx < 0) return fail("Choose a Benched Pokémon.");
    const cost = catalog[p.active.card].retreat;
    if (p.active.energy.length < cost)
      return fail(
        `Retreat needs ${cost} attached Energy card${cost !== 1 ? "s" : ""}.`,
      );
    const old = p.active;
    const paid = old.energy.splice(0, cost);
    p.discard.push(
      ...paid.map((card, i) => ({
        uid: `${old.uid}-retreat-${s.seq}-${i}`,
        card,
      })),
    );
    old.conditions = [];
    p.active = p.bench[idx];
    p.bench[idx] = old;
    p.retreated = true;
    log(s, `${p.name} retreated and promoted ${catalog[p.active.card].name}.`);
    return { state: s };
  }
  if (post.action === "end") {
    nextTurn(s, catalog);
    return { state: s };
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
    const [card] = target[key].splice(idx, 1);
    q.discard.push({ uid: `${target.uid}-detach-${s.seq}`, card });
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
    old.conditions = [];
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
  if (!p.active && p.bench.length)
    return { action: "promote", data: { uid: p.bench[0].uid } };
  if (
    s.players[s.current]?.id !== playerId ||
    !p.active ||
    s.players.some((q) => !q.active)
  )
    return null;
  if (p.bench.length < 5) {
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
  if (evo)
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
            c.energy.length <
            Math.max(...catalog[c.card].attacks.map((a) => a.cost.length), 1),
        ) || p.active;
      return { action: "play", data: { uid: energy.uid, target: target.uid } };
    }
  }
  const bill = p.hand.find((h) => catalog[h.card].name === "Bill");
  if (bill) return { action: "play", data: { uid: bill.uid } };
  const attacks = catalog[p.active.card].attacks
    .map((a, i) => ({ a, i }))
    .filter(
      ({ a }) =>
        canPay(p.active!, a, catalog) &&
        automaticAttack(catalog[p.active!.card], a),
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
