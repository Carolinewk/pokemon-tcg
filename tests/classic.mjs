import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildSync } from "esbuild";
const compiled = buildSync({
  stdin: {
    contents: `import * as game from './lib/game';import * as core from './lib/game-core';import * as attacks from './lib/effects/base-set';import * as context from './lib/effects/context';import * as powers from './lib/effects/classic/powers';import * as trainers from './lib/effects/classic/trainers';import * as rules from './lib/effects/classic/state';import * as damage from './lib/effects/classic/damage';import * as energy from './lib/effects/base-set/energy';export {game,core,attacks,context,powers,trainers,rules,damage,energy};`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  write: false,
  target: "es2022",
}).outputFiles[0].text;
const {
  game,
  core,
  attacks,
  context,
  powers,
  trainers,
  rules,
  damage,
  energy,
} = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
const cards = JSON.parse(readFileSync("public/data/cards.json", "utf8"));
const catalog = Object.fromEntries(cards.map((c) => [c.id, c]));
catalog.neutral = {
  ...catalog["base1-3"],
  id: "neutral",
  name: "Neutral target",
  hp: 1000,
  types: ["Colorless"],
  weaknesses: [],
  resistances: [],
  abilities: [],
  attacks: [
    { name: "Tap", cost: [], damage: "30", text: "", convertedEnergyCost: 0 },
  ],
};
const scope = cards.filter((c) =>
  [
    "base1",
    "base2",
    "base3",
    "base4",
    "base5",
    "gym1",
    "gym2",
    "neo1",
  ].includes(c.setId),
);
let serial = 0;
const h = (id) => ({ card: id, uid: `h-${++serial}` });
const piece = (id, damage = 0, energies = []) => ({
  ...core.piece(h(id), 0),
  damage,
  energy: energies,
});
function fixture(id = "neutral", defender = "neutral") {
  const s = core.initialState("classic");
  s.status = "playing";
  s.turn = 4;
  s.current = 0;
  s.seed = 1;
  s.players = ["a", "b"].map((id) => ({
    id,
    name: id,
    deckName: "Fixture",
    deck: Array.from({ length: 24 }, (_, j) =>
      h(
        [
          "base1-98",
          "base1-102",
          "base1-91",
          "base1-46",
          "base1-24",
          "base1-99",
        ][j % 6],
      ),
    ),
    hand: [],
    prizes: Array.from({ length: 6 }, () => h("base1-100")),
    discard: [],
    active: null,
    bench: [piece("neutral"), piece("neutral")],
    ready: true,
    energyPlayed: false,
    supportPlayed: false,
    retreated: false,
    turns: 2,
    mulligans: 0,
  }));
  s.players[0].active = piece(id);
  s.players[1].active = piece(defender);
  return s;
}
const post = (pid, action, data = {}) => ({
  pid,
  id: `action-${++serial}`,
  action,
  payload: JSON.stringify(data),
});
function step(s, pid, action, data = {}) {
  const r = game.applyPost(s, post(pid, action, data), catalog);
  assert.equal(r.error, undefined, r.error);
  return r.state;
}
function finish(s, answers = {}) {
  for (let n = 0; s.pending && n < 100; n++) {
    const p = s.pending,
      ch = p.choice;
    let values = answers[ch.key];
    if (typeof values === "function") values = values(ch);
    if (values === undefined)
      values = ch.input
        ? ["3'0\""]
        : ch.options.slice(0, ch.min).map((o) => o.value);
    s = step(s, ch.player, "choose", {
      resolution: p.id,
      choice: ch.key,
      values,
    });
  }
  assert.equal(!!s.pending, false, "effect must finish");
  return s;
}
function act(s, pid, action, data = {}, answers = {}) {
  return finish(step(s, pid, action, data), answers);
}
function play(s, id, answers = {}) {
  const card = h(id);
  s.players[0].hand.push(card);
  return act(s, "a", "play", { uid: card.uid }, answers);
}
function rejects(s, pid, action, data = {}, pattern = /./) {
  const r = game.applyPost(s, post(pid, action, data), catalog);
  assert.match(r.error || "", pattern);
  assert.equal(r.state, s);
}
function inventory(s) {
  return s.players
    .flatMap((p) => [
      ...p.deck,
      ...p.hand,
      ...p.discard,
      ...p.prizes,
      ...(p.aside || []).flatMap((a) => a.cards),
      ...core
        .allPieces(p)
        .flatMap((q) => [
          { card: q.card },
          ...q.stack.map((card) => ({ card })),
          ...q.energy.map((card) => ({ card })),
          ...q.tools.map((card) => ({ card })),
          ...(q.trainerAttachments || []),
          ...(q.shapeAttachments || (q.shape ? [q.shape] : [])),
        ]),
    ])
    .concat(s.stadium ? [s.stadium] : [])
    .map((h) => h.card)
    .sort();
}
function enoughEnergy(s) {
  s.players[0].active.energy = [
    "base1-98",
    "base1-102",
    "base1-99",
    "base1-100",
    "base1-101",
    "base1-97",
    "base5-17",
  ].flatMap((id) => Array(6).fill(id));
}
function direct(id, index, coins = [true], configure = () => {}, answers = {}) {
  const original = fixture(id);
  enoughEnergy(original);
  original.players[0].active.damage = 20;
  original.players[1].active.energy = ["base1-98", "base1-102"];
  original.players[0].discard = [h("base1-91"), h("base1-98"), h("base1-100")];
  configure(original);
  for (let tries = 0; tries < 100; tries++) {
    const s = structuredClone(original),
      p = s.players[0],
      card = catalog[id];
    const c = new context.AttackContext(
      s,
      catalog,
      p,
      answers,
      card.attacks[index],
      card,
      attacks.attackHandler,
      damage.attackReaction,
    );
    let n = 0;
    c.coin = () => coins[n++ % coins.length];
    try {
      attacks.attackHandler(card, index)(c);
      return { s, c, a: p.active, b: s.players[1].active, original };
    } catch (e) {
      if (!(e instanceof context.NeedsChoice)) throw e;
      const ch = e.choice;
      answers[ch.key] = ch.options.slice(0, ch.min).map((o) => o.value);
    }
  }
  throw Error("Unbounded choices");
}

test("all 816 expansion cards through Neo Genesis have registered attacks, Powers and Trainers", () => {
  assert.equal(scope.length, 816);
  assert.equal(
    scope.reduce((n, c) => n + c.attacks.length, 0),
    1053,
  );
  for (const c of scope) {
    for (const [i, a] of c.attacks.entries())
      assert.equal(
        typeof attacks.attackHandler(c, i),
        "function",
        `${c.id} ${a.name}`,
      );
    if (c.abilities.length) assert.ok(powers.POWERS[c.id], `${c.id} Power`);
    if (c.supertype === "Trainer")
      assert.equal(
        typeof trainers.trainerFor(c),
        "function",
        `${c.id} Trainer`,
      );
  }
});
test("reprinted attacks each have an explicit named entry point", () => {
  for (const set of [
    "base2",
    "base3",
    "base4",
    "base5",
    "gym1",
    "gym2",
    "neo1",
  ]) {
    const fs = scope
      .filter((c) => c.setId === set)
      .flatMap((c) => c.attacks.map((_, i) => attacks.attackHandler(c, i)));
    assert.equal(new Set(fs).size, fs.length);
    assert.ok(fs.every((f) => f.name));
  }
});
for (const id of ["neo1-12", "neo1-20", "neo1-22", "neo1-23"])
  test(`${id} is a legal starting Baby Pokémon`, () =>
    assert.equal(game.isBasic(catalog[id]), true));
test("a Baby tails ends the attack before any Energy discard cost", () => {
  let s = fixture("neo1-9", "neo1-20");
  s.players[0].active.energy = ["base1-98", "base1-102", "base1-100"];
  const before = [...s.players[0].active.energy];
  s = act(s, "a", "attack", { index: 0 });
  assert.deepEqual(s.players[0].active.energy, before);
  assert.equal(s.players[1].active.damage, 0);
  assert.equal(s.current, 1);
});
test("Rainbow Energy provides one flexible unit, never multiple simultaneous types", () => {
  const p = piece("neutral", 0, ["base5-17"]);
  assert.equal(energy.canPay(p, { cost: ["Fire"] }, catalog), true);
  assert.equal(energy.canPay(p, { cost: ["Water", "Fire"] }, catalog), false);
  p.energy.push("base1-98");
  assert.equal(energy.canPay(p, { cost: ["Water", "Fire"] }, catalog), true);
});
test("Rainbow, Potion and Full Heal Energy apply their hand-attachment effects", () => {
  for (const [id, damageExpected, conditions] of [
    ["base5-17", 30, ["Poisoned"]],
    ["base5-82", 10, ["Poisoned"]],
    ["base5-81", 20, []],
  ]) {
    let s = fixture();
    s.players[0].active.damage = 20;
    s.players[0].active.conditions = ["Poisoned"];
    const card = h(id);
    s.players[0].hand = [card];
    s = act(s, "a", "play", { uid: card.uid, target: s.players[0].active.uid });
    assert.equal(s.players[0].active.damage, damageExpected);
    assert.deepEqual(s.players[0].active.conditions, conditions);
  }
});
test("Wild Growth doubles Grass units only for the owner’s Grass Pokémon and stops under Toxic Gas", () => {
  const s = fixture("base1-44");
  s.players[0].bench = [piece("neo1-11")];
  s.players[0].active.energy = ["base1-99"];
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog, s), [
    "Grass",
    "Grass",
  ]);
  s.players[1].bench.push(piece("base3-13"));
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog, s), [
    "Grass",
  ]);
});
test("Energy Burn and Photosynthesis use their actual converted type", () => {
  const s = fixture("gym1-47");
  s.players[0].active.energy = ["base1-98", "base1-96"];
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog, s), [
    "Grass",
    "Grass",
    "Grass",
  ]);
  s.powerLockUntil = 5;
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog, s), [
    "Fire",
    "Colorless",
    "Colorless",
  ]);
});
test("Recycle Energy returns to hand when discarded from play, including a Knock Out", () => {
  const s = fixture("neutral");
  const p = s.players[0];
  p.active.energy = ["neo1-105"];
  core.discardEnergy(s, p, p.active, [0]);
  assert.equal(p.hand.at(-1).card, "neo1-105");
  p.active.energy = ["neo1-105"];
  p.active.damage = 1000;
  core.checkKnockouts(s, catalog);
  assert.equal(p.hand.filter((h) => h.card === "neo1-105").length, 2);
});
test("Ecogym returns an opposing colored Energy, while Colorless is discarded", () => {
  const s = fixture();
  s.stadium = { ...h("neo1-84"), owner: "a" };
  const p = s.players[1];
  p.active.energy = ["gym2-128", "base1-96"];
  core.discardEnergy(s, p, p.active, [0, 1], { player: "a", kind: "attack" });
  assert.ok(p.hand.some((h) => h.card === "gym2-128"));
  assert.ok(p.discard.some((h) => h.card === "base1-96"));
});
test("Brock’s Protection prevents opposing attack/Trainer removal but not its own retreat cost", () => {
  const s = fixture();
  const p = s.players[1];
  p.active.energy = ["base1-98"];
  p.active.trainerAttachments = [{ ...h("gym2-101"), expires: 999 }];
  core.discardEnergy(s, p, p.active, [0], { player: "a", kind: "attack" });
  assert.equal(p.active.energy.length, 1);
  core.discardEnergy(s, p, p.active, [0], { player: "b", kind: "retreat" });
  assert.equal(p.active.energy.length, 0);
});
test("Murkrow’s Mean Look ends when its source leaves the Active position", () => {
  const r = direct("neo1-24", 0);
  assert.ok(rules.mark(r.s, r.b, "noRetreat"));
  core.switchActive(r.s.players[0], r.s.players[0].bench[0].uid);
  assert.equal(rules.mark(r.s, r.b, "noRetreat"), undefined);
});
test("Spider Web remains after the source is Benched but clears from the target when it switches", () => {
  const r = direct("neo1-27", 0);
  core.switchActive(r.s.players[0], r.s.players[0].bench[0].uid);
  assert.ok(rules.mark(r.s, r.b, "noRetreat"));
  core.switchActive(r.s.players[1], r.s.players[1].bench[0].uid);
  assert.equal(rules.mark(r.s, r.b, "noRetreat"), undefined);
});
test("Jaw Clamp blocks a Trainer switch; ordinary no-retreat still permits Switch", () => {
  let r = direct("neo1-31", 1);
  r.s.current = 1;
  r.s.turn = 5;
  const card = h("base1-95");
  r.s.players[1].hand = [card];
  const original = r.b.uid;
  let s = act(r.s, "b", "play", { uid: card.uid });
  assert.equal(s.players[1].active.uid, original);
  r = direct("neo1-24", 0);
  r.s.current = 1;
  r.s.turn = 5;
  const card2 = h("base1-95");
  r.s.players[1].hand = [card2];
  s = act(r.s, "b", "play", { uid: card2.uid });
  assert.notEqual(s.players[1].active.uid, r.b.uid);
});
test("Char remains on the Bench, resolves each turn and clears on evolution", () => {
  let r = direct("neo1-47", 1, [true]);
  assert.equal(r.b.charred, true);
  core.switchActive(r.s.players[1], r.s.players[1].bench[0].uid);
  assert.equal(r.b.charred, true);
  let s = fixture("base1-46");
  s.players[0].active.charred = true;
  const evo = h("base1-24");
  s.players[0].hand = [evo];
  s = act(s, "a", "play", { uid: evo.uid, target: s.players[0].active.uid });
  assert.equal(s.players[0].active.charred, undefined);
});
test("Ditto copies the opponent’s HP, attacks, type, and flexible Energy without changing its physical card", () => {
  const s = fixture("base3-3", "base1-4");
  s.players[0].active.energy = [
    "base1-102",
    "base1-99",
    "base1-101",
    "base1-97",
  ];
  const p = s.players[0].active;
  assert.equal(rules.maximumHP(s, p, catalog), 120);
  assert.equal(rules.attackOptions(s, p, catalog)[0].attack.name, "Fire Spin");
  assert.equal(
    energy.canPay(p, catalog["base1-4"].attacks[0], catalog, s),
    true,
  );
  p.conditions = ["Confused"];
  assert.equal(rules.maximumHP(s, p, catalog), 50);
  assert.equal(p.card, "base3-3");
});
test("Shapeshift uses the attached Evolution’s stats but keeps its own Power and card inventory", () => {
  let s = fixture("gym2-3");
  const card = h("base1-4");
  s.players[0].hand = [card];
  const before = inventory(s);
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  assert.equal(rules.maximumHP(s, s.players[0].active, catalog), 120);
  assert.equal(s.players[0].active.card, "gym2-3");
  assert.deepEqual(inventory(s), before);
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  assert.equal(rules.maximumHP(s, s.players[0].active, catalog), 70);
  assert.deepEqual(inventory(s), before);
});
test("Psylink offers other friendly Psychic attacks with their printed Energy costs", () => {
  const s = fixture("gym2-16");
  s.players[0].bench = [piece("base1-10"), piece("base1-4")];
  const names = rules
    .attackOptions(s, s.players[0].active, catalog)
    .map((a) => a.attack.name);
  assert.ok(names.includes("Psychic"));
  assert.ok(names.includes("Barrier"));
  assert.ok(!names.includes("Fire Spin"));
  s.powerLockUntil = 4;
  assert.deepEqual(
    rules
      .attackOptions(s, s.players[0].active, catalog)
      .map((a) => a.attack.name),
    ["Mega Burn"],
  );
});
test("Headache and Hay Fever reject Trainer plays; Toxic Gas disables Hay Fever", () => {
  let s = direct("base3-53", 0).s;
  s.current = 1;
  s.turn = 5;
  const card = h("base1-91");
  s.players[1].hand = [card];
  rejects(s, "b", "play", { uid: card.uid }, /Trainer/);
  s = fixture();
  s.players[1].bench = [piece("base5-13")];
  s.players[0].hand = [card];
  rejects(s, "a", "play", { uid: card.uid }, /Trainer/);
  s.players[0].bench = [piece("base3-13")];
  s = act(s, "a", "play", { uid: card.uid });
  assert.equal(s.players[0].hand.length, 2);
});
test("Prehistoric Power blocks normal and Trainer evolution", () => {
  const s = fixture("base1-46");
  s.players[1].bench = [piece("base3-1")];
  const card = h("base1-24");
  s.players[0].hand = [card];
  rejects(
    s,
    "a",
    "play",
    { uid: card.uid, target: s.players[0].active.uid },
    /Prehistoric/,
  );
});
test("Giovanni allows successive evolution in the same turn", () => {
  let s = fixture("gym2-76");
  s.players[0].active.entered = 4;
  s.players[0].turns = 1;
  s.players[0].hand = [h("gym2-18"), h("gym2-45"), h("gym2-7")];
  s = act(s, "a", "play", { uid: s.players[0].hand[0].uid });
  s = act(s, "a", "play", {
    uid: s.players[0].hand[0].uid,
    target: s.players[0].active.uid,
  });
  s = act(s, "a", "play", {
    uid: s.players[0].hand[0].uid,
    target: s.players[0].active.uid,
  });
  assert.equal(s.players[0].active.card, "gym2-7");
});
test("Narrow Gym makes each owner choose and return the excess Bench Pokémon with attachments", () => {
  let s = fixture();
  for (const p of s.players)
    p.bench = Array.from({ length: 5 }, () =>
      piece("neutral", 0, ["base1-98"]),
    );
  const card = h("gym1-124");
  s.players[0].hand = [card];
  const before = inventory(s);
  s = step(s, "a", "play", { uid: card.uid });
  assert.equal(s.pending.choice.player, "b");
  s = finish(s);
  assert.equal(s.players[0].bench.length, 4);
  assert.equal(s.players[1].bench.length, 4);
  assert.deepEqual(inventory(s), before);
});
test("Professor Elm draws seven and forbids further Trainers that turn", () => {
  let s = fixture();
  s.players[0].hand = [h("base1-98")];
  s = play(s, "neo1-96");
  assert.equal(s.players[0].hand.length, 7);
  const b = h("base1-91");
  s.players[0].hand.push(b);
  rejects(s, "a", "play", { uid: b.uid }, /Trainer/);
});
test("Tickling Machine preserves set-aside hand cards and returns them after the owner’s next turn", () => {
  let s = fixture();
  s.seed = 9000;
  s.players[1].hand = [h("base1-4"), h("base1-91")];
  while (true) {
    const probe = structuredClone(s);
    if (core.flip(probe)) break;
    s.seed++;
  }
  const held = s.players[1].hand.map((h) => h.uid);
  s = play(s, "gym1-119");
  assert.equal(s.players[1].hand.length, 0);
  s = act(s, "a", "end");
  s = act(s, "b", "end");
  assert.ok(held.every((id) => s.players[1].hand.some((h) => h.uid === id)));
});
test("Mysterious Fossil can evolve and awards no Prize when it is discarded or Knocked Out", () => {
  let s = fixture();
  s = play(s, "base3-62");
  const fossil = s.players[0].bench.at(-1);
  assert.equal(fossil.card, "base3-62");
  const prizes = s.players[1].prizes.length;
  s = act(s, "a", "discardDoll", { uid: fossil.uid });
  assert.equal(s.players[1].prizes.length, prizes);
});
test("Metal and Darkness modifiers apply on the correct sides of Weakness", () => {
  const s = fixture("base1-58", "neutral");
  s.players[0].active.energy = ["neo1-104", "neo1-19"];
  const r = direct("neutral", 0, [true], (x) => {
    x.players[0].active.energy = ["neo1-104", "neo1-19"];
    x.players[1].active.energy = ["neo1-19"];
  });
  assert.equal(r.c.damage, 20);
});
test("Mr. Mime prevents large damage and Swift ignores that prevention", () => {
  let r = direct("base1-4", 0, [true], (s) => {
    s.players[1].active = piece("base2-6");
  });
  assert.equal(r.b.damage, 0);
  r = direct("neo1-33", 1, [true], (s) => {
    s.players[1].active = piece("base2-6");
  });
  assert.equal(r.b.damage, 30);
});
test("Gaseous Form and Giant Growth change actual Knock Out thresholds", () => {
  const s = fixture("gym2-97");
  const p = s.players[0].active;
  p.energy = ["base1-101", "base1-101"];
  assert.equal(rules.maximumHP(s, p, catalog), 60);
  const r = direct("gym2-10", 0, [true]);
  assert.equal(rules.maximumHP(r.s, r.a, catalog), 80);
});
test("Gaseous Form counts converted Psychic cards once, including Buzzap and Ditto", () => {
  const s = fixture("gym2-97");
  const p = s.players[0].active;
  p.energy = ["base1-101", "base1-21"];
  p.energyTypes = { 1: "Psychic" };
  assert.equal(rules.maximumHP(s, p, catalog), 60);
  p.effects = { energyBurnTurn: 4 };
  p.burnedEnergy = [0, 1];
  assert.equal(rules.maximumHP(s, p, catalog), 40);
  const ditto = fixture("base3-3", "gym2-97");
  ditto.players[0].active.energy = ["base1-96"];
  assert.equal(rules.maximumHP(ditto, ditto.players[0].active, catalog), 50);
});
test("Rainbow damage precedes Gaseous Form HP gain and can Knock Out its recipient", () => {
  for (const damage of [40, 50]) {
    let s = fixture("gym2-97");
    s.players[0].active.energy = ["base1-101", "base1-101"];
    s.players[0].active.damage = damage;
    const rainbow = h("base5-17");
    s.players[0].hand = [rainbow];
    const before = inventory(s);
    s = act(s, "a", "play", {
      uid: rainbow.uid,
      target: s.players[0].active.uid,
    });
    assert.deepEqual(inventory(s), before);
    if (damage === 50) {
      assert.equal(s.players[0].active, null);
      assert.equal(s.players[1].prizes.length, 5);
      assert.ok(s.players[0].discard.some((c) => c.uid === rainbow.uid));
    } else {
      assert.equal(s.players[0].active.damage, 50);
      assert.equal(rules.maximumHP(s, s.players[0].active, catalog), 70);
    }
  }
});
test("Mirror Move repeats Magnetic Lines Energy movement with new legal targets", () => {
  let s = fixture("base5-11", "base1-22");
  s.players[0].active.energy = ["base1-100", "base1-100", "base1-98"];
  s.players[1].active.energy = ["base1-96", "base1-98", "base1-98"];
  s.players[1].active.trainerAttachments = [{ ...h("base1-80"), expires: 4 }];
  const before = inventory(s);
  s = act(s, "a", "attack", { index: 1 });
  assert.equal(s.players[1].active.lastAttack.movedBasicEnergy, 1);
  assert.equal(s.players[1].bench[0].energy.length, 1);
  s = act(s, "b", "attack", { index: 1 });
  assert.equal(s.players[0].bench[0].energy.length, 1);
  assert.deepEqual(inventory(s), before);
});
test("Leech Life heals actual damage dealt; Petal Dance confuses its user", () => {
  let r = direct("base3-34", 1, [true]);
  assert.equal(r.a.damage, 0);
  assert.equal(r.b.damage, 20);
  r = direct("base2-15", 0, [true, false, true]);
  assert.equal(r.b.damage, 80);
  assert.ok(r.a.conditions.includes("Confused"));
});
test("Riptide counts discarded Water cards and moves exactly those cards into the deck", () => {
  const r = direct(
    "neo1-5",
    0,
    [true],
    (s) =>
      (s.players[0].discard = [h("base1-102"), h("base1-102"), h("base1-98")]),
  );
  assert.equal(r.b.damage, 30);
  assert.deepEqual(
    r.s.players[0].discard.map((h) => h.card),
    ["base1-98"],
  );
  assert.deepEqual(inventory(r.s), inventory(r.original));
});
test("Lugia discards three separate typed cards and keeps a Double Colorless", () => {
  let s = fixture("neo1-9");
  s.players[0].active.energy = [
    "base1-98",
    "base1-102",
    "base1-100",
    "base1-96",
  ];
  s = act(s, "a", "attack", { index: 0 });
  assert.deepEqual(s.players[0].active.energy, ["base1-96"]);
  assert.equal(s.players[1].active.damage, 90);
});
test("Endure prevents attack Knock Out but Poison between turns still finishes it", () => {
  let s = fixture("neutral", "neo1-43");
  s.players[1].active.damage = 30;
  s.players[1].active.marks = { endure: { until: 4 } };
  s.players[1].active.conditions = ["Poisoned"];
  s = act(s, "a", "attack", { index: 0 });
  assert.equal(s.players[1].active, null);
  assert.equal(s.players[0].prizes.length, 5);
});
test("Healing Fire triggers on a hand attachment and Berserk triggers on hand evolution", () => {
  let s = fixture("gym2-21");
  s.players[0].active.damage = 20;
  const fire = h("base1-98");
  s.players[0].hand = [fire];
  s = act(s, "a", "play", { uid: fire.uid, target: s.players[0].active.uid });
  assert.equal(s.players[0].active.damage, 10);
  s = fixture("neo1-31");
  const evo = h("neo1-4");
  s.players[0].hand = [evo];
  s = act(s, "a", "play", { uid: evo.uid, target: s.players[0].active.uid });
  assert.equal(s.players[0].discard.length + s.players[1].discard.length, 5);
});
test("activated Powers enforce once per turn and respect global suppression", () => {
  let s = fixture("base2-55");
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  rejects(s, "a", "power", { uid: s.players[0].active.uid }, /already/);
  s.powerLockUntil = 4;
  rejects(s, "a", "power", { uid: s.players[0].active.uid }, /Power/);
});
test("Secret Plan hides the card and discards non-Basic cards without awarding a Prize", () => {
  let s = fixture();
  s.players[0].hand = [h("base1-98")];
  s = play(s, "gym2-107");
  const p = s.players[0].bench.at(-1);
  assert.equal(p.faceDown, true);
  assert.equal(rules.pokemonCard(s, p, catalog).name, "Face-down Pokémon");
  s = act(s, "a", "revealPiece", { uid: p.uid });
  assert.equal(s.players[0].bench.length, 2);
  assert.equal(s.players[1].prizes.length, 6);
});
test("private peeks identify a single recipient and never put hidden names in the public log", () => {
  const r = direct(
    "gym2-94",
    0,
    [true],
    (s) => (s.players[1].hand = [h("base1-4")]),
  );
  assert.equal(r.s.reveals.at(-1).player, "a");
  assert.ok(!r.s.log.some((x) => x.text.includes("Charizard")));
});
for (const set of ["base2", "base3", "base4", "base5", "gym1", "gym2", "neo1"])
  test(`${set}: every attack resolves on heads and tails with finite damage and conserved cards`, () => {
    for (const card of scope.filter((c) => c.setId === set))
      for (const [index, attack] of card.attacks.entries())
        for (const heads of [true, false]) {
          const coinSequence = heads ? [true, true, true, false] : [false];
          let r;
          try {
            r = direct(card.id, index, coinSequence, (s) => {
              s.players[1].active.conditions = ["Asleep"];
              s.players[0].active.lastUsed = { name: "Lie Low", turn: 2 };
              if (attack.name === "Synchronize")
                s.players[1].active.energy = [...s.players[0].active.energy];
            });
          } catch (e) {
            throw new Error(
              `${card.id} ${attack.name} (${heads ? "heads" : "tails"}): ${e.message}`,
              { cause: e },
            );
          }
          assert.ok(
            core
              .allPieces(r.s.players[0])
              .concat(core.allPieces(r.s.players[1]))
              .every((p) => Number.isFinite(p.damage) && p.damage >= 0),
            `${card.id} ${attack.name}`,
          );
          assert.deepEqual(
            inventory(r.s),
            inventory(r.original),
            `${card.id} ${attack.name}: cards are conserved`,
          );
        }
  });
test("Sabrina’s ESP rerolls the attack once and serializes the second set of choices", () => {
  let s = fixture("gym1-25");
  s.players[0].active.energy = ["base1-96"];
  s.players[0].active.trainerAttachments = [{ ...h("gym1-117"), expires: 4 }];
  s = step(s, "a", "attack", { index: 1 });
  s = finish(s, { "esp-reroll": ["yes"] });
  assert.equal(s.current, 1);
  assert.ok(s.log.filter((x) => x.kind === "coin").length >= 6);
});
test("Wild Growth gives each Grass card exactly two units, including Buzzap and flexible Rainbow", () => {
  const s = fixture("base1-44");
  s.players[0].bench = [piece("neo1-11")];
  const p = s.players[0].active;
  p.energy = ["base1-21"];
  p.energyTypes = { 0: "Grass" };
  assert.deepEqual(energy.providedEnergy(p, catalog, s), ["Grass", "Grass"]);
  p.energy = ["base5-17"];
  p.energyTypes = {};
  assert.equal(
    energy.canPay(p, { cost: ["Grass", "Grass"] }, catalog, s),
    true,
  );
  assert.equal(energy.canPay(p, { cost: ["Fire"] }, catalog, s), true);
  assert.equal(
    energy.canPay(p, { cost: ["Fire", "Grass"] }, catalog, s),
    false,
  );
});
test("Ditto can use a copied activated Power and a copied passive Power", () => {
  let s = fixture("base3-3", "base1-2");
  s.players[0].hand = [h("base1-102")];
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  assert.equal(s.players[0].active.energy[0], "base1-102");
  assert.equal(s.players[0].energyPlayed, false);
  s = fixture("base3-3", "base2-6");
  assert.equal(
    rules.powerOn(s, s.players[0].active, catalog, "Invisible Wall"),
    true,
  );
});
test("Shapeshift keeps older attachments inert when its latest form is discarded", () => {
  let s = fixture("gym2-3");
  s.players[0].hand = [h("base1-4")];
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  s.turn = 6;
  s.players[0].hand = [h("base1-2")];
  s = act(
    s,
    "a",
    "power",
    { uid: s.players[0].active.uid },
    { "shape-mode": ["attach"] },
  );
  assert.equal(s.players[0].active.shapeAttachments.length, 2);
  const latest = s.players[0].active.shape.uid;
  s = act(
    s,
    "a",
    "power",
    { uid: s.players[0].active.uid },
    { "shape-mode": [latest] },
  );
  assert.equal(s.players[0].active.shapeAttachments.length, 1);
  assert.equal(rules.pokemonCard(s, s.players[0].active, catalog).id, "gym2-3");
});
for (const set of ["base2", "base3", "base4", "base5", "gym1", "gym2", "neo1"])
  test(`${set}: every attack completes through the public multiplayer action reducer`, () => {
    for (const card of scope.filter((c) => c.setId === set))
      for (const [index, attack] of card.attacks.entries()) {
        let s = fixture(card.id);
        enoughEnergy(s);
        s.players[0].active.damage = 20;
        s.players[1].active.conditions = ["Asleep"];
        s.players[0].active.lastUsed = { name: "Lie Low", turn: 2 };
        s.players[1].active.energy = ["base1-102"];
        s.players[0].discard = [h("base1-91"), h("base1-98"), h("base1-100")];
        if (attack.name === "Synchronize")
          s.players[1].active.energy = [...s.players[0].active.energy];
        const before = inventory(s);
        try {
          s = act(s, "a", "attack", { index });
        } catch (e) {
          throw new Error(`${card.id} ${attack.name}: ${e.message}`, {
            cause: e,
          });
        }
        assert.deepEqual(
          inventory(s),
          before,
          `${card.id} ${attack.name}: inventory`,
        );
        assert.ok(
          s.current === 1 || s.status === "finished",
          `${card.id} ${attack.name}: turn ends`,
        );
      }
  });
test("every new Trainer can resolve through public actions without losing physical cards", () => {
  const unique = new Map();
  for (const card of scope.filter(
    (c) => c.supertype === "Trainer" && !["base1", "base4"].includes(c.setId),
  ))
    unique.set(trainers.trainerFor(card), card);
  for (const card of unique.values())
    for (const firstHeads of [false, true]) {
      let s = fixture("gym2-94");
      s.players[0].active.damage = 10;
      s.players[0].active.energy = ["base1-101"];
      s.players[0].active.conditions = ["Poisoned"];
      s.players[0].bench = ["gym1-42", "gym1-66", "gym2-77", "gym1-91"].map(
        (id) => piece(id, 10, ["base1-98", "base1-99", "base1-101"]),
      );
      s.players[0].hand = [
        "base1-46",
        "base1-24",
        "base1-98",
        "base1-102",
        "base1-99",
        "base1-91",
      ].map(h);
      s.players[1].hand = ["base1-91", "base1-46", "base1-98"].map(h);
      for (const p of s.players)
        p.discard = [
          "base1-46",
          "base1-24",
          "base1-98",
          "base1-102",
          "base1-99",
          "base1-91",
        ].map(h);
      if (card.name.includes("Giovanni"))
        s.players[0].active = piece("gym2-7", 10, ["base1-99"]);
      if (card.name === "Koga's Ninja Trick")
        s.players[0].active = piece("gym2-77", 10, ["base1-99"]);
      if (card.name === "Good Manners")
        s.players[0].hand = s.players[0].hand.filter(
          (h) => !rules.startingPokemon(catalog[h.card]),
        );
      if (card.name === "Blaine's Last Resort") s.players[0].hand = [];
      while (true) {
        const probe = structuredClone(s);
        if (core.flip(probe) === firstHeads) break;
        s.seed++;
      }
      const source = h(card.id);
      s.players[0].hand.push(source);
      const before = inventory(s);
      try {
        s = act(s, "a", "play", { uid: source.uid });
      } catch (e) {
        throw new Error(`${card.id} ${card.name}: ${e.message}`, { cause: e });
      }
      assert.deepEqual(
        inventory(s),
        before,
        `${card.id} ${card.name}: inventory`,
      );
    }
});
test("every activated Power through Neo Genesis resolves without losing physical cards", () => {
  const unique = new Map();
  for (const card of scope)
    if (powers.POWERS[card.id]?.use)
      unique.set(powers.POWERS[card.id].use, card);
  for (const card of unique.values()) {
    let s = fixture(card.id);
    s.players[0].active.damage = 10;
    s.players[0].active.energy = ["base1-99", "base1-98", "base1-100"];
    s.players[0].bench = [
      piece("base3-10", 10, ["base1-98", "base1-99", "base1-100"]),
      piece("base1-44", 10, ["base1-99"]),
    ];
    s.players[1].active.damage = 20;
    s.players[0].hand = ["base1-102", "base1-98", "base1-4", "base1-46"].map(h);
    s.players[0].discard = ["base1-98", "base1-100"].map(h);
    let uid = s.players[0].active.uid;
    if (powers.POWERS[card.id].name === "Step In") {
      const p = s.players[0].active;
      s.players[0].active = s.players[0].bench[0];
      s.players[0].bench[0] = p;
    }
    const before = inventory(s);
    try {
      s = act(s, "a", "power", { uid });
    } catch (e) {
      throw new Error(
        `${card.id} ${powers.POWERS[card.id].name}: ${e.message}`,
        { cause: e },
      );
    }
    assert.deepEqual(inventory(s), before, `${card.id}: inventory`);
  }
});
test("every on-play Power handles choices atomically and conserves cards", () => {
  const unique = new Map();
  for (const card of scope)
    if (powers.POWERS[card.id]?.onPlay)
      unique.set(powers.POWERS[card.id].onPlay, card);
  for (const card of unique.values()) {
    const from = scope.find((x) => x.name === card.evolvesFrom);
    assert.ok(from, card.id);
    let s = fixture(from.id);
    s.players[0].hand = [h(card.id)];
    s.players[0].discard = ["base1-46", "base1-24", "base1-98"].map(h);
    s.players[0].deck.push(h("gym2-18"));
    s.seed = 9000;
    const before = inventory(s);
    try {
      s = act(s, "a", "play", {
        uid: s.players[0].hand[0].uid,
        target: s.players[0].active.uid,
      });
    } catch (e) {
      throw new Error(`${card.id} on play: ${e.message}`, { cause: e });
    }
    assert.deepEqual(inventory(s), before, `${card.id}: inventory`);
  }
});
test("Mirror Move repeats newer retreat locks and Char effects with fresh timing", () => {
  let s = fixture("neo1-47", "base1-22");
  s.players[0].active.energy = ["base1-98", "base1-98", "base1-98"];
  s.players[1].active.energy = ["base1-96", "base1-98"];
  while (true) {
    const probe = structuredClone(s);
    if (core.flip(probe)) break;
    s.seed++;
  }
  s = act(s, "a", "attack", { index: 1 });
  assert.equal(s.players[1].active.lastAttack.charred, true);
  s = act(s, "b", "attack", { index: 1 });
  assert.ok(
    s.players[0].active?.charred ||
      s.players[0].discard.some((h) => h.card === "neo1-47"),
  );
});
test("Slowking receives the decision, stops Bill on heads and returns it to the top of its owner’s deck", () => {
  let s = fixture();
  s.players[1].bench = [piece("neo1-14")];
  const card = h("base1-91");
  s.players[0].hand = [card];
  while (true) {
    const probe = structuredClone(s);
    if (core.flip(probe)) break;
    s.seed++;
  }
  s = step(s, "a", "play", { uid: card.uid });
  assert.equal(s.pending.choice.player, "b");
  s = finish(s, { [s.pending.choice.key]: ["yes"] });
  assert.equal(s.players[0].deck[0].uid, card.uid);
  assert.equal(s.players[0].hand.length, 0);
});
test("Chaos Gym pays discard costs before its coin and may offer the effect to the opponent", () => {
  let s = fixture();
  s.stadium = { ...h("gym2-102"), owner: "a" };
  s.players[0].hand = [h("base1-71"), h("base1-98"), h("base1-102")];
  s.players[1].hand = [h("base1-99"), h("base1-100")];
  const source = s.players[0].hand[0];
  s = step(s, "a", "play", { uid: source.uid });
  s = finish(s, { "chaos-use": ["no"] });
  assert.ok(s.players[0].discard.some((h) => h.card === "base1-98"));
  assert.ok(s.players[0].discard.some((h) => h.card === "base1-102"));
  assert.ok(s.players[0].discard.some((h) => h.card === "base1-71"));
  assert.equal(s.players[0].hand.length, 0);
});
test("Focus Band on heads preserves the Pokémon at 10 HP and is discarded", () => {
  let s = fixture("neutral", "base1-46");
  s.players[1].active.damage = 20;
  s.players[1].active.tools = ["neo1-86"];
  while (true) {
    const probe = structuredClone(s);
    if (core.flip(probe)) break;
    s.seed++;
  }
  s = act(s, "a", "attack", { index: 0 });
  assert.equal(s.players[1].active.damage, 40);
  assert.ok(s.players[1].discard.some((h) => h.card === "neo1-86"));
  assert.equal(s.players[0].prizes.length, 6);
});
test("Fortitude on heads preserves Giovanni’s Machamp at 10 HP", () => {
  let s = fixture("neutral", "gym2-6");
  s.players[1].active.damage = 80;
  while (true) {
    const probe = structuredClone(s);
    if (core.flip(probe)) break;
    s.seed++;
  }
  s = act(s, "a", "attack", { index: 0 });
  assert.equal(s.players[1].active.damage, 90);
  assert.equal(s.players[0].prizes.length, 6);
});
test("Pollen Defense works while its user was already Confused", () => {
  const r = direct("neutral", 0, [true], (s) => {
    s.players[1].active = piece("gym1-5");
    s.players[1].active.conditions = ["Confused"];
    while (true) {
      const probe = structuredClone(s);
      if (core.flip(probe)) break;
      s.seed++;
    }
  });
  assert.ok(r.a.conditions.includes("Confused"));
});
test("Shock Blast responds to Power damage and does not recursively trigger itself", () => {
  const s = fixture("gym2-52", "gym2-52");
  const c = new context.EffectContext(s, catalog, s.players[0]);
  c.powerDamage(s.players[1].active, s.players[0].active, 10);
  assert.equal(s.players[0].active.damage, 30);
  assert.equal(s.players[1].active.damage, 20);
  assert.equal(s.log.filter((x) => x.kind === "coin").length, 1);
});
test("Misty’s Tentacruel can Flee before the attack’s remaining Special Conditions", () => {
  let s = fixture("base1-43", "gym1-10");
  s.players[0].active.energy = ["base1-101"];
  s = step(s, "a", "attack", { index: 0 });
  assert.equal(s.pending.choice.player, "b");
  s = finish(s, { [s.pending.choice.key]: ["yes"] });
  const escaped = s.players[1].bench.find((p) => p.card === "gym1-10");
  assert.ok(escaped);
  assert.deepEqual(escaped.conditions, []);
});
test("Brock’s Rhydon redirects exactly 10 of one Benched Pokémon’s damage", () => {
  const r = direct(
    "gym1-39",
    1,
    [true],
    (s) => {
      s.players[1].bench = [piece("neutral"), piece("gym1-2")];
    },
    {},
  );
  assert.equal(r.s.players[1].bench[0].damage, 10);
  const configured = fixture("gym1-39");
  enoughEnergy(configured);
  configured.players[1].bench = [piece("neutral"), piece("gym1-2")];
  const target = configured.players[1].bench[0],
    guard = configured.players[1].bench[1];
  let s = step(configured, "a", "attack", { index: 1 });
  s = finish(s, { [`bench-guard-${target.uid}`]: [guard.uid] });
  assert.equal(s.players[1].bench[0].damage, 0);
  assert.equal(s.players[1].bench[1].damage, 20);
});
test("Berry and Miracle Berry execute automatically at the start of a turn when their conditions are met", () => {
  let s = fixture();
  s.players[0].active.damage = 40;
  s.players[0].active.tools = ["neo1-93"];
  s = act(
    s,
    "a",
    "end",
    {},
    { [`berry-${s.players[0].active.uid}-4`]: ["no"] },
  );
  assert.equal(s.players[0].active.damage, 0);
  assert.ok(s.players[0].discard.some((h) => h.card === "neo1-93"));
});
