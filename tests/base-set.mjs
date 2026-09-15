import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildSync } from "esbuild";
const compiled = buildSync({
  stdin: {
    contents: `import * as game from './lib/game'; import * as core from './lib/game-core'; import * as base from './lib/effects/base-set'; import * as context from './lib/effects/context'; import * as powers from './lib/effects/base-set/powers'; import * as energy from './lib/effects/base-set/energy'; export {game,core,base,context,powers,energy};`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  write: false,
  target: "es2022",
}).outputFiles[0].text;
const { game, core, base, context, powers, energy } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
const cards = JSON.parse(readFileSync("public/data/cards.json", "utf8"));
const catalog = Object.fromEntries(cards.map((c) => [c.id, c]));
catalog.neutral = {
  ...catalog["base1-3"],
  id: "neutral",
  name: "Test target",
  types: ["Colorless"],
  weaknesses: [],
  resistances: [],
  attacks: [
    {
      name: "Test attack",
      cost: [],
      text: "",
      damage: "20",
      convertedEnergyCost: 0,
    },
  ],
};
let serial = 0;
const hand = (id) => ({ uid: `test-${++serial}`, card: id });
const piece = (id, damage = 0, energies = []) => ({
  ...core.piece(hand(id), 0),
  damage,
  energy: energies,
});
function fixture(id = "base1-46", opponent = "neutral") {
  const s = game.initialState("base-set-test");
  s.status = "playing";
  s.turn = 4;
  s.current = 0;
  s.players = ["a", "b"].map((pid, i) => ({
    id: pid,
    name: pid,
    deckName: "Test",
    deck: Array.from({ length: 20 }, (_, j) =>
      hand(["base1-98", "base1-102", "base1-46", "base1-4", "base1-91"][j % 5]),
    ),
    hand: [],
    discard: [],
    prizes: Array.from({ length: 6 }, () => hand("base1-98")),
    active: piece(
      i ? opponent : id,
      20,
      i
        ? ["base1-102", "base1-96"]
        : [
            "base1-98",
            "base1-98",
            "base1-98",
            "base1-98",
            ...Array(5).fill("base1-102"),
            ...Array(4).fill("base1-99"),
            ...Array(4).fill("base1-101"),
            ...Array(4).fill("base1-97"),
            ...Array(4).fill("base1-100"),
          ],
    ),
    bench: [piece("neutral"), piece("neutral")],
    ready: true,
    energyPlayed: false,
    supportPlayed: false,
    retreated: false,
    turns: 2,
    mulligans: 0,
  }));
  return s;
}
function post(pid, action, data = {}) {
  return {
    pid,
    id: `action-${++serial}`,
    action,
    payload: JSON.stringify(data),
  };
}
function step(s, pid, action, data = {}) {
  const result = game.applyPost(s, post(pid, action, data), catalog);
  assert.equal(result.error, undefined, `${action}: ${result.error}`);
  return result.state;
}
function chooseDefault(choice) {
  let options = choice.options;
  if (choice.key === "heal-amount") options = [...options].reverse();
  return options.slice(0, choice.max).map((o) => o.value);
}
function finish(s, answers = {}) {
  for (let i = 0; s.pending && i < 30; i++) {
    const p = s.pending;
    let values = answers[p.choice.key];
    if (typeof values === "function") values = values(p.choice);
    if (values === undefined) values = chooseDefault(p.choice);
    s = step(s, p.choice.player, "choose", {
      resolution: p.id,
      choice: p.choice.key,
      values,
    });
  }
  assert.ok(!s.pending, "effect choices must finish");
  return s;
}
function act(s, pid, action, data = {}, answers = {}) {
  return finish(step(s, pid, action, data), answers);
}
function rejects(s, pid, action, data = {}, pattern = /.+/) {
  const result = game.applyPost(s, post(pid, action, data), catalog);
  assert.match(result.error || "", pattern);
  assert.equal(result.state, s);
}
function inventory(s) {
  const ids = [];
  for (const p of s.players) {
    ids.push(
      ...[...p.deck, ...p.hand, ...p.discard, ...p.prizes].map((h) => h.card),
    );
    for (const c of core.allPieces(p))
      ids.push(
        c.card,
        ...c.stack,
        ...c.energy,
        ...c.tools,
        ...(c.trainerAttachments || []).map((t) => t.card),
      );
  }
  if (s.stadium) ids.push(s.stadium.card);
  return ids.sort();
}
function conserved(before, after) {
  assert.deepEqual(
    inventory(after),
    inventory(before),
    "all physical cards must be conserved",
  );
}
function directAttack(
  id,
  index,
  coins = [true, true],
  configure = () => {},
  answers = {},
) {
  const original = fixture(id);
  configure(original);
  let next;
  for (let attempt = 0; attempt < 30; attempt++) {
    next = structuredClone(original);
    const p = next.players[0],
      card = catalog[id];
    const ctx = new context.AttackContext(
      next,
      catalog,
      p,
      answers,
      card.attacks[index],
      card,
      base.attackHandler,
      powers.machampStrikesBack,
    );
    let flip = 0;
    ctx.coin = () => coins[flip++ % coins.length];
    try {
      base.BASE_ATTACKS[id][index](ctx);
      conserved(original, next);
      return { state: next, ctx, a: ctx.attacker, b: ctx.defender, original };
    } catch (e) {
      if (!(e instanceof context.NeedsChoice)) throw e;
      answers[e.choice.key] = chooseDefault(e.choice);
    }
  }
  throw Error("Attack did not finish");
}
const set = cards.filter((c) => c.setId === "base1");
test("every Base Set card is registered: 114 distinct attack functions, 6 Powers, 26 Trainers, 7 Energy", () => {
  assert.equal(set.length, 102);
  const attacks = Object.values(base.BASE_ATTACKS).flat();
  assert.equal(attacks.length, 114);
  assert.equal(new Set(attacks).size, 114);
  assert.equal(Object.keys(base.BASE_POWERS).length, 6);
  assert.equal(Object.keys(base.BASE_TRAINERS).length, 26);
  assert.equal(Object.keys(base.BASE_ENERGY).length, 7);
  for (const card of set) {
    card.attacks.forEach((a, i) => {
      assert.equal(typeof base.BASE_ATTACKS[card.id]?.[i], "function");
      assert.equal(base.automaticAttack(card, a), true);
    });
    if (card.abilities.length) assert.ok(base.BASE_POWERS[card.id]);
    if (card.supertype === "Trainer")
      assert.equal(typeof base.BASE_TRAINERS[card.id], "function");
    if (card.supertype === "Energy")
      assert.equal(typeof base.BASE_ENERGY[card.id], "function");
  }
});
// Independent expected damage table for every attack with effect text. Columns: two heads / two tails.
const damageRows = {
  "1:0": [30, 30],
  "2:0": [60, 60],
  "3:0": [0, 0],
  "3:1": [80, 80],
  "4:0": [100, 100],
  "5:0": [0, 0],
  "5:1": [20, 20],
  "6:1": [40, 40],
  "9:0": [30, 30],
  "9:1": [80, 80],
  "10:0": [30, 30],
  "10:1": [0, 0],
  "11:0": [40, 30],
  "11:1": [20, 20],
  "12:0": [0, 0],
  "12:1": [80, 80],
  "13:0": [50, 50],
  "13:1": [40, 40],
  "14:0": [20, 20],
  "14:1": [60, 60],
  "16:0": [60, 60],
  "16:1": [100, 100],
  "17:0": [60, 0],
  "17:1": [40, 40],
  "18:0": [60, 0],
  "18:1": [20, 20],
  "19:1": [70, 70],
  "20:0": [10, 10],
  "20:1": [40, 30],
  "21:0": [50, 50],
  "22:0": [20, 20],
  "22:1": [30, 30],
  "23:0": [50, 50],
  "23:1": [80, 80],
  "24:1": [50, 50],
  "25:1": [30, 30],
  "27:0": [30, 0],
  "29:0": [0, 0],
  "29:1": [50, 50],
  "30:1": [20, 20],
  "31:0": [20, 0],
  "31:1": [40, 40],
  "32:0": [0, 0],
  "33:0": [0, 0],
  "33:1": [20, 20],
  "34:0": [30, 30],
  "34:1": [60, 60],
  "35:1": [20, 20],
  "36:1": [50, 50],
  "37:0": [60, 0],
  "38:0": [0, 0],
  "38:1": [60, 0],
  "39:0": [0, 0],
  "39:1": [0, 0],
  "40:1": [50, 50],
  "42:0": [0, 0],
  "43:0": [10, 10],
  "44:0": [20, 20],
  "45:0": [10, 10],
  "46:1": [30, 30],
  "48:0": [20, 0],
  "49:1": [10, 10],
  "50:0": [0, 0],
  "50:1": [0, 0],
  "51:0": [10, 10],
  "53:0": [10, 10],
  "53:1": [40, 40],
  "54:0": [0, 0],
  "54:1": [20, 20],
  "55:0": [30, 0],
  "56:1": [0, 0],
  "57:0": [10, 10],
  "58:1": [30, 30],
  "59:0": [30, 30],
  "62:0": [10, 10],
  "63:0": [10, 10],
  "63:1": [0, 0],
  "64:0": [0, 0],
  "64:1": [20, 20],
  "66:0": [20, 20],
  "66:1": [20, 20],
  "68:0": [10, 10],
  "69:0": [10, 10],
};
assert.equal(Object.keys(damageRows).length, 83);
for (const card of set)
  card.attacks.forEach((attack, index) =>
    test(`${card.name}: ${attack.name} — damage on heads and tails`, () => {
      for (const [roll, heads] of [true, false].entries()) {
        const { ctx } = directAttack(card.id, index, [heads, heads], (s) => {
          if (card.id === "base1-29" && index === 1)
            s.players[1].active.conditions = ["Asleep"];
          if (card.id === "base1-22" && index === 1)
            s.players[0].active.lastAttack = {
              turn: 3,
              damage: 30,
              conditions: ["Poisoned"],
            };
        });
        const expected = attack.text
          ? damageRows[`${card.number}:${index}`][roll]
          : Number(attack.damage);
        assert.equal(
          ctx.damage,
          expected,
          `${card.id} ${attack.name}, heads=${heads}`,
        );
      }
    }),
  );
const paralyze = "6:1 9:0 20:0 25:1 43:0 45:0 53:0 54:1 63:0 64:1 66:0".split(
  " ",
);
const poisonCoin = "17:1 33:1 69:0".split(" ");
const confuseCoin = "1:0 49:1 68:0".split(" ");
const sleepCoin = "5:0 50:0".split(" ");
for (const [keys, status] of [
  [paralyze, "Paralyzed"],
  [poisonCoin, "Poisoned"],
  [confuseCoin, "Confused"],
  [sleepCoin, "Asleep"],
]) {
  test(`every coin-based ${status} effect applies on heads only`, () => {
    for (const key of keys) {
      const [n, i] = key.split(":");
      for (const heads of [true, false]) {
        const { b } = directAttack(`base1-${n}`, +i, [heads]);
        assert.equal(b.conditions.includes(status), heads, key);
      }
    }
  });
}
test("guaranteed status effects and Toxic differ from coin-based Poisonpowder", () => {
  for (const n of [30, 66])
    assert.ok(
      directAttack(`base1-${n}`, 1, [false]).b.conditions.includes("Poisoned"),
    );
  assert.ok(directAttack("base1-29", 0).b.conditions.includes("Asleep"));
  assert.equal(directAttack("base1-11", 1).b.effects.poisonDamage, 20);
  assert.ok(
    directAttack("base1-51", 0, [true]).b.conditions.includes("Poisoned"),
  );
  assert.ok(
    directAttack("base1-51", 0, [false]).b.conditions.includes("Confused"),
  );
});
test("every recoil effect applies its own amount and coin condition", () => {
  const rows = [
    ["3:1", 80, 80],
    ["9:1", 80, 80],
    ["11:0", 0, 10],
    ["14:1", 0, 30],
    ["16:0", 0, 30],
    ["20:1", 0, 10],
    ["21:0", 0, 10],
    ["23:1", 30, 30],
    ["34:1", 20, 20],
    ["53:1", 40, 40],
    ["58:1", 0, 10],
  ];
  for (const [key, onHeads, onTails] of rows) {
    const [n, i] = key.split(":");
    for (const [flip, amount] of [
      [true, onHeads],
      [false, onTails],
    ])
      assert.equal(
        directAttack(`base1-${n}`, +i, [flip]).a.damage,
        20 + amount,
        key,
      );
  }
});
test("every required attack discard removes cards of the right type", () => {
  const rows = [
    ["4:0", 2],
    ["10:1", 1],
    ["12:1", 1],
    ["16:1", 25],
    ["23:0", 1],
    ["24:1", 1],
    ["32:0", 1],
    ["36:1", 1],
    ["46:1", 1],
    ["50:1", 1],
    ["64:0", 1],
  ];
  for (const [key, count] of rows) {
    const [n, i] = key.split(":");
    const result = directAttack(`base1-${n}`, +i);
    assert.equal(result.a.energy.length, 25 - count, key);
  }
  for (const key of ["13:1", "18:1"]) {
    const [n, i] = key.split(":");
    assert.equal(directAttack(`base1-${n}`, +i).b.energy.length, 1);
  }
});
test("healing, bench splash, protection, locks, conversions and once-in-play effects resolve", () => {
  assert.equal(directAttack("base1-32", 0).a.damage, 0);
  assert.equal(directAttack("base1-64", 0).a.damage, 0);
  assert.equal(directAttack("base1-44", 0).a.damage, 10);
  for (const [n, i, amount, both] of [
    [9, 1, 20, true],
    [53, 1, 10, true],
    [19, 1, 10, false],
  ]) {
    const r = directAttack(`base1-${n}`, i);
    assert.deepEqual(
      r.state.players[0].bench.map((p) => p.damage),
      [amount, amount],
    );
    assert.deepEqual(
      r.state.players[1].bench.map((p) => p.damage),
      [both ? amount : 0, both ? amount : 0],
    );
  }
  for (const key of ["3:0", "33:0", "42:0", "54:0", "63:1"]) {
    const [n, i] = key.split(":");
    assert.equal(
      directAttack(`base1-${n}`, +i, [true]).a.effects.preventDamageUntil,
      5,
    );
    assert.equal(
      directAttack(`base1-${n}`, +i, [false]).a.effects?.preventDamageUntil,
      undefined,
    );
  }
  assert.equal(directAttack("base1-10", 1).a.effects.preventAllUntil, 5);
  assert.equal(
    directAttack("base1-14", 0, [true]).a.effects.preventAllUntil,
    5,
  );
  assert.equal(
    directAttack("base1-14", 0, [false]).a.effects?.preventAllUntil,
    undefined,
  );
  assert.equal(directAttack("base1-50", 1).a.effects.destinyBondUntil, 5);
  assert.equal(directAttack("base1-56", 1).a.effects.hardenUntil, 5);
  assert.equal(directAttack("base1-62", 0).b.effects.sandAttackUntil, 5);
  assert.equal(
    directAttack("base1-38", 0).b.effects.amnesia.name,
    "Test attack",
  );
  assert.equal(
    directAttack(
      "base1-39",
      0,
      [true],
      (s) => (s.players[1].active.effects = { weakness: "Fire" }),
    ).b.effects.weakness,
    "Grass",
  );
  assert.equal(directAttack("base1-39", 1).a.effects.resistance, "Grass");
  for (const heads of [true, false])
    assert.deepEqual(directAttack("base1-27", 0, [heads]).a.usedAttacks, [
      "Leek Slap",
    ]);
  for (const n of [12, 22, 57]) {
    const r = directAttack(`base1-${n}`, 0);
    assert.notEqual(r.state.players[1].active.uid, r.ctx.defender.uid);
  }
});
function trainerFixture(n) {
  const s = fixture("base1-24");
  const [p, q] = s.players;
  p.active.stack = ["base1-46"];
  p.active.damage = 30;
  p.active.energy = ["base1-98", "base1-96"];
  p.active.conditions = ["Poisoned"];
  p.active.effects = { poisonDamage: 20, amnesia: { name: "Slash", until: 5 } };
  p.bench = [
    piece("base1-44", 10, ["base1-99"]),
    piece("base1-46", 0, ["base1-98"]),
  ];
  p.hand = [
    hand(`base1-${n}`),
    ...[
      "base1-98",
      "base1-102",
      "base1-99",
      "base1-4",
      "base1-2",
      "base1-91",
      "base1-85",
    ].map(hand),
  ];
  p.discard = ["base1-63", "base1-98", "base1-102", "base1-91"].map(hand);
  q.hand = ["base1-46", "base1-98", "base1-91", "base1-93"].map(hand);
  q.discard = [hand("base1-63")];
  return s;
}
const trainerChecks = {
  70: (s, b) => {
    assert.equal(s.players[0].bench.length, 3);
    assert.equal(s.players[0].bench[2].card, "base1-70");
    assert.equal(s.players[0].bench[2].damage, 0);
  },
  71: (s, b) => {
    assert.equal(s.players[0].deck.length, b.players[0].deck.length - 1);
    assert.ok(
      s.players[0].hand.some((h) => h.uid === b.players[0].deck[0].uid),
    );
    assert.equal(s.players[0].discard.length, b.players[0].discard.length + 3);
  },
  72: (s) => {
    assert.equal(s.players[0].active.card, "base1-46");
    assert.equal(s.players[0].active.damage, 30);
    assert.deepEqual(s.players[0].active.conditions, []);
    assert.deepEqual(s.players[0].active.effects, {});
    assert.equal(s.players[0].active.evolved, 4);
  },
  73: (s, b) => {
    assert.equal(s.players[1].hand.length, 7);
    assert.equal(
      s.players[1].deck.length,
      b.players[1].deck.length + b.players[1].hand.length - 7,
    );
  },
  74: (s, b) => {
    assert.ok(
      s.players[0].hand.some(
        (h) =>
          h.uid === b.players[0].discard.find((h) => h.card === "base1-91").uid,
      ),
    );
    assert.ok(!s.players[0].hand.some((h) => h.card === "base1-74"));
  },
  75: (s, b) => {
    assert.ok(
      s.players.every((p) =>
        p.hand.every((h) => catalog[h.card].supertype !== "Trainer"),
      ),
    );
    assert.equal(s.reveals.length, 2);
    assert.deepEqual(
      s.reveals[0].cards,
      b.players[0].hand.slice(1).map((h) => h.card),
    );
  },
  76: (s) => {
    assert.equal(s.players[0].bench[1].card, "base1-4");
    assert.deepEqual(s.players[0].bench[1].stack, ["base1-46"]);
    assert.equal(s.players[0].bench[1].evolved, 4);
  },
  77: (s, b) => {
    assert.ok(
      s.players[0].deck.some(
        (h) =>
          h.uid === b.players[0].hand.find((h) => h.card === "base1-4").uid,
      ),
    );
    assert.ok(
      s.players[0].hand.some(
        (h) =>
          h.uid === b.players[0].deck.find((h) => h.card === "base1-46").uid,
      ),
    );
    assert.equal(s.reveals[0].cards.length, 2);
  },
  78: (s) => {
    assert.equal(s.players[0].active, null);
    assert.ok(s.players[0].hand.some((h) => h.card === "base1-46"));
    assert.ok(s.players[0].discard.some((h) => h.card === "base1-24"));
  },
  79: (s) => {
    assert.equal(s.players[0].active.energy.length, 1);
    assert.equal(s.players[1].active.energy.length, 0);
  },
  80: (s) => {
    assert.equal(s.players[0].active.trainerAttachments[0].card, "base1-80");
    assert.equal(s.players[0].active.trainerAttachments[0].expires, 5);
  },
  81: (s, b) => {
    for (const h of b.players[0].discard.filter(
      (h) => catalog[h.card].supertype === "Energy",
    ))
      assert.ok(s.players[0].hand.some((c) => c.uid === h.uid));
    assert.ok(
      s.players[0].discard.some((h) => h.uid === b.players[0].hand[1].uid),
    );
  },
  82: (s) => {
    assert.deepEqual(s.players[0].active.conditions, []);
    assert.equal(s.players[0].active.effects.poisonDamage, undefined);
    assert.equal(s.players[0].active.effects.amnesia.name, "Slash");
  },
  83: (s, b) => {
    assert.equal(s.players[0].deck.length, b.players[0].deck.length + 1);
    assert.equal(s.players[0].hand.length, b.players[0].hand.length - 2);
  },
  84: (s) => {
    assert.equal(s.players[0].active.trainerAttachments[0].card, "base1-84");
    assert.equal(s.players[0].active.trainerAttachments[0].expires, 4);
  },
  85: (s) => {
    assert.equal(s.players[0].active.damage, 0);
    assert.equal(s.players[0].active.energy.length, 0);
    assert.equal(s.players[0].bench[0].damage, 0);
    assert.equal(s.players[0].bench[0].energy.length, 0);
    assert.equal(s.players[0].bench[1].energy.length, 1);
  },
  86: (s) => {
    assert.equal(s.players[1].bench.length, 3);
    assert.equal(s.players[1].bench[2].card, "base1-63");
    assert.equal(s.players[1].discard.length, 0);
  },
  87: (s, b) => {
    assert.deepEqual(
      s.players[0].deck.slice(0, 5),
      b.players[0].deck.slice(0, 5).reverse(),
    );
    assert.deepEqual(s.players[0].deck.slice(5), b.players[0].deck.slice(5));
  },
  88: (s, b) => {
    assert.equal(s.players[0].hand.length, 7);
    assert.equal(s.players[0].deck.length, b.players[0].deck.length - 7);
    for (const h of b.players[0].hand)
      assert.ok(s.players[0].discard.some((x) => x.uid === h.uid));
  },
  89: (s) => {
    assert.equal(s.players[0].bench.length, 3);
    assert.equal(s.players[0].bench[2].card, "base1-63");
    assert.equal(s.players[0].bench[2].damage, 20);
  },
  90: (s) => {
    assert.equal(s.players[0].active.damage, 0);
    assert.equal(s.players[0].active.energy.length, 1);
  },
  91: (s, b) => {
    assert.equal(s.players[0].hand.length, b.players[0].hand.length + 1);
    assert.equal(s.players[0].deck.length, b.players[0].deck.length - 2);
  },
  92: (s) => assert.deepEqual(s.players[1].active.energy, ["base1-96"]),
  93: (s, b) =>
    assert.equal(s.players[1].active.uid, b.players[1].bench[0].uid),
  94: (s) => assert.equal(s.players[0].active.damage, 10),
  95: (s, b) => {
    assert.equal(s.players[0].active.uid, b.players[0].bench[0].uid);
    assert.deepEqual(s.players[0].bench[0].conditions, []);
    assert.deepEqual(s.players[0].bench[0].effects, {});
  },
};
for (let n = 70; n <= 95; n++)
  test(`Trainer ${catalog[`base1-${n}`].name}: complete effect and card conservation`, () => {
    const before = trainerFixture(n);
    const uid = before.players[0].hand[0].uid;
    const answers =
      n === 87
        ? { pokedex: (choice) => choice.options.map((o) => o.value).reverse() }
        : {};
    const after = act(before, "a", "play", { uid }, answers);
    trainerChecks[n](after, before);
    conserved(before, after);
    assert.equal(after.current, 0, "Trainers do not end the turn");
  });
test("all 7 Energy cards provide their printed Energy, with Double Colorless counting as one physical card", () => {
  for (const [id, types] of Object.entries({
    "base1-96": ["Colorless", "Colorless"],
    "base1-97": ["Fighting"],
    "base1-98": ["Fire"],
    "base1-99": ["Grass"],
    "base1-100": ["Lightning"],
    "base1-101": ["Psychic"],
    "base1-102": ["Water"],
  })) {
    let s = fixture();
    s.players[0].active.energy = [];
    s.players[0].hand = [hand(id)];
    const before = structuredClone(s);
    s = act(s, "a", "play", {
      uid: s.players[0].hand[0].uid,
      target: s.players[0].active.uid,
    });
    assert.deepEqual(
      energy.providedEnergy(s.players[0].active, catalog),
      types,
    );
    assert.equal(s.players[0].active.energy.length, 1);
    assert.ok(s.players[0].energyPlayed);
    conserved(before, s);
  }
});
test("Alakazam moves exactly one counter, repeatedly, between owned Pokémon without causing a Knock Out", () => {
  let s = fixture("base1-1");
  s.players[0].bench = [piece("base1-43", 10), piece("base1-46", 0)];
  const before = structuredClone(s);
  const [a, to, last] = core.allPieces(s.players[0]);
  s = act(
    s,
    "a",
    "power",
    { uid: a.uid },
    { "damage-source": [a.uid], "damage-target": [to.uid] },
  );
  assert.equal(s.players[0].active.damage, 10);
  assert.equal(s.players[0].bench[0].damage, 20);
  s = act(
    s,
    "a",
    "power",
    { uid: a.uid },
    { "damage-source": [a.uid], "damage-target": [last.uid] },
  );
  assert.equal(s.players[0].active.damage, 0);
  assert.equal(s.players[0].bench[1].damage, 10);
  const pending = step(s, "a", "power", { uid: a.uid });
  assert.ok(pending.pending);
  const src = step(pending, "a", "choose", {
    resolution: pending.pending.id,
    choice: pending.pending.choice.key,
    values: [last.uid],
  });
  if (src.pending)
    assert.ok(
      !src.pending.choice.options.some((o) => o.value === to.uid),
      "cannot move lethal counter to Abra",
    );
  conserved(before, s);
});
test("Blastoise Rain Dance attaches only Water Energy to Water Pokémon without using the normal attachment", () => {
  let s = fixture("base1-2");
  s.players[0].hand = [
    hand("base1-102"),
    hand("base1-102"),
    hand("base1-98"),
    hand("base1-96"),
  ];
  s.players[0].active.energy = [];
  s.players[0].bench = [piece("base1-63"), piece("base1-46")];
  const before = structuredClone(s);
  const uid = s.players[0].active.uid;
  s = act(
    s,
    "a",
    "power",
    { uid },
    {
      "rain-energy": [s.players[0].hand[0].uid],
      "rain-target": [s.players[0].bench[0].uid],
    },
  );
  assert.equal(s.players[0].energyPlayed, false);
  assert.deepEqual(s.players[0].bench[0].energy, ["base1-102"]);
  s = act(s, "a", "power", { uid }, { "rain-target": [uid] });
  assert.equal(s.players[0].energyPlayed, false);
  rejects(s, "a", "power", { uid }, /No valid/);
  s = act(s, "a", "play", {
    uid: s.players[0].hand[0].uid,
    target: s.players[0].bench[1].uid,
  });
  assert.equal(s.players[0].energyPlayed, true);
  conserved(before, s);
});
test("Charizard Energy Burn is explicit, preserves double Energy, survives devolution, and expires", () => {
  let s = fixture("base1-4");
  const p = s.players[0];
  p.active.stack = ["base1-46", "base1-24"];
  p.active.energy = ["base1-96", "base1-96"];
  p.active.damage = 0;
  p.hand = [hand("base1-72")];
  assert.equal(
    game.canPay(p.active, catalog[p.active.card].attacks[0], catalog),
    false,
  );
  s = act(s, "a", "power", { uid: p.active.uid });
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog), [
    "Fire",
    "Fire",
    "Fire",
    "Fire",
  ]);
  assert.equal(
    game.canPay(s.players[0].active, catalog["base1-4"].attacks[0], catalog),
    true,
  );
  s = act(s, "a", "play", { uid: p.hand[0].uid }, { "devolve-stage": ["2"] });
  assert.equal(s.players[0].active.card, "base1-24");
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog), [
    "Fire",
    "Fire",
    "Fire",
    "Fire",
  ]);
  s = act(s, "a", "end");
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog), [
    "Colorless",
    "Colorless",
    "Colorless",
    "Colorless",
  ]);
});
test("Venusaur moves one Grass Energy card, including a Grass Buzzap, and does not move Fire-burned cards", () => {
  let s = fixture("base1-15");
  const p = s.players[0];
  p.active.energy = ["base1-99", "base1-21"];
  p.active.energyTypes = { 1: "Grass" };
  p.bench = [piece("base1-46")];
  const before = structuredClone(s);
  s = act(s, "a", "power", { uid: p.active.uid }, { "trans-energy": ["1"] });
  assert.deepEqual(s.players[0].bench[0].energy, ["base1-21"]);
  assert.equal(s.players[0].bench[0].energyTypes[0], "Grass");
  assert.deepEqual(energy.providedEnergy(s.players[0].bench[0], catalog), [
    "Grass",
    "Grass",
  ]);
  conserved(before, s);
  s.players[0].active.effects = { energyBurnTurn: 4 };
  s.players[0].active.burnedEnergy = [0];
  s.players[0].bench[0].energyTypes[0] = "Fire";
  rejects(s, "a", "power", { uid: p.active.uid });
});
test("Electrode Buzzap awards a Prize, discards its evolution and attachments, and supplies two chosen Energy", () => {
  let s = fixture("base1-21");
  const p = s.players[0];
  p.active.stack = ["base1-67"];
  p.active.energy = ["base1-100"];
  const before = structuredClone(s);
  const dest = p.bench[0].uid;
  s = act(
    s,
    "a",
    "power",
    { uid: p.active.uid },
    { "buzzap-target": [dest], "buzzap-type": ["Water"] },
  );
  assert.equal(s.players[0].active, null);
  assert.equal(s.players[1].prizes.length, 5);
  assert.ok(s.players[0].discard.some((h) => h.card === "base1-67"));
  assert.deepEqual(energy.providedEnergy(s.players[0].bench[0], catalog), [
    "Water",
    "Water",
  ]);
  conserved(before, s);
  s = step(s, "a", "promote", { uid: dest });
  s = act(s, "a", "end");
  s.players[1].hand = [hand("base1-92")];
  const beforeRemoval = structuredClone(s);
  s = act(s, "b", "play", { uid: s.players[1].hand[0].uid });
  assert.equal(s.players[0].active.energy.length, 0);
  assert.ok(s.players[0].discard.some((h) => h.card === "base1-21"));
  conserved(beforeRemoval, s);
});
test("all activated Powers reject wrong turns, opponents’ Pokémon, and Asleep/Confused/Paralyzed users", () => {
  for (const id of ["base1-1", "base1-2", "base1-4", "base1-15", "base1-21"]) {
    for (const status of ["Asleep", "Confused", "Paralyzed"]) {
      const s = fixture(id);
      s.players[0].active.conditions = [status];
      rejects(s, "a", "power", { uid: s.players[0].active.uid }, /Power/);
    }
    const s = fixture(id);
    rejects(s, "b", "power", { uid: s.players[0].active.uid }, /opponent/);
    rejects(s, "a", "power", { uid: s.players[1].active.uid }, /your Pokémon/);
  }
});
test("Machamp Strikes Back triggers even on a Knock Out, before attack status, and on the Bench, but never chains", () => {
  let r = directAttack("base1-43", 0, [true], (s) => {
    s.players[1].active = piece("base1-8", 90);
  });
  assert.equal(r.a.damage, 30);
  assert.ok(r.b.conditions.includes("Paralyzed"));
  r = directAttack("base1-43", 0, [true], (s) => {
    s.players[1].active = piece("base1-8", 90);
    s.players[1].active.conditions = ["Paralyzed"];
  });
  assert.equal(r.a.damage, 20);
  r = directAttack(
    "base1-9",
    1,
    [true],
    (s) => (s.players[1].bench = [piece("base1-8")]),
  );
  assert.equal(r.a.damage, 110);
  r = directAttack(
    "base1-8",
    0,
    [true],
    (s) => (s.players[1].active = piece("base1-8")),
  );
  assert.equal(r.a.damage, 30);
  assert.equal(r.b.damage, 60);
});
test("two-coin attacks also handle one head, and scaled damage clamps at zero and caps surplus Water", () => {
  for (const key of ["17:0", "18:0", "37:0", "38:1", "31:0", "48:0"]) {
    const [n, i] = key.split(":");
    assert.equal(
      directAttack(`base1-${n}`, +i, [true, false]).ctx.damage,
      ["31:0", "48:0"].includes(key) ? 10 : 30,
    );
  }
  assert.equal(
    directAttack(
      "base1-34",
      0,
      [true],
      (s) => (s.players[0].active.damage = 70),
    ).ctx.damage,
    0,
  );
  for (const [id, index, attached, expected] of [
    ["base1-2", 0, 3, 40],
    ["base1-2", 0, 4, 50],
    ["base1-2", 0, 10, 60],
    ["base1-13", 0, 3, 30],
    ["base1-13", 0, 4, 40],
    ["base1-59", 0, 1, 10],
    ["base1-59", 0, 2, 20],
    ["base1-59", 0, 6, 30],
  ])
    assert.equal(
      directAttack(
        id,
        index,
        [true],
        (s) => (s.players[0].active.energy = Array(attached).fill("base1-102")),
      ).ctx.damage,
      expected,
    );
  for (const remaining of [1, 10, 30, 50, 110, 120])
    assert.equal(
      directAttack(
        "base1-40",
        1,
        [true],
        (s) => (s.players[1].active.damage = 120 - remaining),
      ).ctx.damage,
      Math.ceil(remaining / 20) * 10,
    );
});
test("damage protection permits secondary effects; Barrier blocks damage and every defender effect; Harden applies after modifiers", () => {
  let r = directAttack(
    "base1-43",
    0,
    [true],
    (s) => (s.players[1].active.effects = { preventDamageUntil: 4 }),
  );
  assert.equal(r.ctx.damage, 0);
  assert.ok(r.b.conditions.includes("Paralyzed"));
  for (const key of [
    "43:0",
    "11:1",
    "13:1",
    "12:0",
    "22:0",
    "38:0",
    "39:0",
    "62:0",
  ]) {
    const [n, i] = key.split(":");
    r = directAttack(
      `base1-${n}`,
      +i,
      [true],
      (s) =>
        (s.players[1].active.effects = {
          preventAllUntil: 4,
          weakness: "Fire",
        }),
    );
    assert.equal(r.ctx.damage, 0, key);
    assert.deepEqual(r.b.conditions, [], key);
    assert.equal(r.b.energy.length, 2, key);
    assert.equal(r.state.players[1].active.uid, r.b.uid, key);
    assert.equal(r.b.effects.amnesia, undefined, key);
    assert.equal(r.b.effects.weakness, "Fire", key);
    assert.equal(r.b.effects.sandAttackUntil, undefined, key);
  }
  assert.equal(
    directAttack(
      "base1-24",
      0,
      [true],
      (s) => (s.players[1].active.effects = { hardenUntil: 4 }),
    ).ctx.damage,
    0,
  );
  assert.equal(
    directAttack("base1-24", 0, [true], (s) => {
      s.players[1].active.effects = { hardenUntil: 4 };
      s.players[0].active.trainerAttachments = [
        { ...hand("base1-84"), expires: 4 },
      ];
    }).ctx.damage,
    40,
  );
  assert.equal(
    directAttack("base1-24", 1, [true], (s) => {
      s.players[1].active.effects = { hardenUntil: 4 };
      s.players[1].active.trainerAttachments = [
        { ...hand("base1-80"), expires: 4 },
      ];
    }).ctx.damage,
    0,
  );
});
test("PlusPower stacks after Weakness and Resistance, cannot create damage, and Defender reduces recoil and bench damage", () => {
  let r = directAttack("base1-43", 0, [true], (s) => {
    s.players[1].active.effects = { weakness: "Psychic" };
    s.players[0].active.trainerAttachments = [
      { ...hand("base1-84"), expires: 4 },
      { ...hand("base1-84"), expires: 4 },
    ];
  });
  assert.equal(r.ctx.damage, 40);
  r = directAttack("base1-43", 0, [true], (s) => {
    s.players[1].active.effects = { resistance: "Psychic" };
    s.players[0].active.trainerAttachments = [
      { ...hand("base1-84"), expires: 4 },
    ];
  });
  assert.equal(r.ctx.damage, 0);
  r = directAttack(
    "base1-3",
    1,
    [true],
    (s) =>
      (s.players[0].active.trainerAttachments = [
        { ...hand("base1-80"), expires: 5 },
      ]),
  );
  assert.equal(r.a.damage, 80);
  r = directAttack(
    "base1-9",
    1,
    [true],
    (s) =>
      (s.players[1].bench[0].trainerAttachments = [
        { ...hand("base1-80"), expires: 5 },
      ]),
  );
  assert.equal(r.state.players[1].bench[0].damage, 0);
  assert.equal(r.state.players[1].bench[1].damage, 20);
});
test("temporary Trainer attachments expire at their respective turn ends and survive switching and evolution", () => {
  let s = fixture("base1-46");
  s.players[0].active.damage = 0;
  s.players[0].hand = [
    hand("base1-84"),
    hand("base1-80"),
    hand("base1-24"),
    hand("base1-95"),
  ];
  const id = s.players[0].active.uid;
  s = act(s, "a", "play", { uid: s.players[0].hand[0].uid });
  s = act(
    s,
    "a",
    "play",
    { uid: s.players[0].hand[0].uid },
    { "defender-target": [id] },
  );
  s = act(s, "a", "play", { uid: s.players[0].hand[0].uid, target: id });
  assert.equal(s.players[0].active.trainerAttachments.length, 2);
  s = act(
    s,
    "a",
    "play",
    { uid: s.players[0].hand[0].uid },
    { switch: [s.players[0].bench[0].uid] },
  );
  assert.equal(s.players[0].bench[0].trainerAttachments.length, 2);
  s = act(s, "a", "end");
  assert.deepEqual(
    s.players[0].bench[0].trainerAttachments.map((t) => t.card),
    ["base1-80"],
  );
  s = act(s, "b", "end");
  assert.deepEqual(s.players[0].bench[0].trainerAttachments, []);
});
test("Toxic damages twice per round, ordinary poison replaces it, and Full Heal removes only status conditions", () => {
  let s = fixture("base1-11");
  s.players[1].active.damage = 0;
  s = act(s, "a", "attack", { index: 1 });
  assert.equal(s.players[1].active.damage, 40);
  assert.equal(s.players[1].active.effects.poisonDamage, 20);
  s = act(s, "b", "end");
  assert.equal(s.players[1].active.damage, 60);
  const r = directAttack("base1-66", 1, [true], (s) => {
    s.players[1].active.conditions = ["Poisoned"];
    s.players[1].active.effects = { poisonDamage: 20 };
  });
  assert.equal(r.b.effects.poisonDamage, 10);
});
test("Destiny Bond reacts to an attack Knock Out, including simultaneous final Prizes, but not Poison", () => {
  let s = fixture("base1-46", "base1-50");
  s.players[1].active.damage = 20;
  s.players[1].active.effects = { destinyBondUntil: 4 };
  const before = structuredClone(s);
  s = act(s, "a", "attack", { index: 1 });
  assert.equal(s.players[0].active, null);
  assert.equal(s.players[1].active, null);
  assert.equal(s.players[0].prizes.length, 5);
  assert.equal(s.players[1].prizes.length, 5);
  conserved(before, s);
  s = fixture("base1-46", "base1-50");
  s.players[1].active.damage = 20;
  s.players[1].active.effects = { destinyBondUntil: 4 };
  s.players.forEach((p) => {
    p.hand.push(...p.prizes.splice(1));
  });
  s = act(s, "a", "attack", { index: 1 });
  assert.equal(s.status, "finished");
  assert.equal(s.winner, "draw");
  s = fixture("base1-46", "base1-50");
  s.players[1].active.damage = 20;
  s.players[1].active.conditions = ["Poisoned"];
  s.players[1].active.effects = { destinyBondUntil: 4 };
  s = act(s, "a", "end");
  assert.ok(s.players[0].active);
  assert.equal(s.players[1].active, null);
});
test("Selfdestruct and Earthquake resolve every simultaneous Knock Out and award the right players Prizes", () => {
  let s = fixture("base1-9");
  s.players[0].active.damage = 0;
  s.players[0].bench = [piece("base1-43", 20)];
  s.players[1].active.damage = 100;
  s.players[1].bench = [piece("base1-43", 20)];
  const before = structuredClone(s);
  s = act(s, "a", "attack", { index: 1 });
  assert.equal(s.players[0].active, null);
  assert.equal(s.players[1].active, null);
  assert.equal(s.players[0].bench.length, 0);
  assert.equal(s.players[1].bench.length, 0);
  assert.equal(s.players[0].prizes.length, 4);
  assert.equal(s.players[1].prizes.length, 4);
  assert.equal(s.winner, "draw");
  conserved(before, s);
});
test("Clefairy Doll is a 10 HP Pokémon in play, immune to status, cannot retreat, and never gives a Prize", () => {
  let s = fixture("base1-43", "base1-70");
  s.players[1].active.damage = 0;
  const before = structuredClone(s);
  s = act(s, "a", "attack", { index: 0 });
  assert.equal(s.players[1].active, null);
  assert.equal(s.players[0].prizes.length, 6);
  conserved(before, s);
  const r = directAttack(
    "base1-29",
    0,
    [true],
    (s) => (s.players[1].active = piece("base1-70")),
  );
  assert.deepEqual(r.b.conditions, []);
  s = fixture("base1-70");
  s.players[0].active.damage = 0;
  rejects(
    s,
    "a",
    "retreat",
    { uid: s.players[0].bench[0].uid },
    /cannot retreat/,
  );
  const old = structuredClone(s);
  s = act(s, "a", "discardDoll", { uid: s.players[0].active.uid });
  assert.equal(s.players[0].active, null);
  assert.equal(s.players[1].prizes.length, 6);
  conserved(old, s);
});
test("Whirlwind waits for the defending player; Lure waits for the attacking player; attacks end only after the choice", () => {
  for (const [id, chooser] of [
    ["base1-57", "b"],
    ["base1-12", "a"],
  ]) {
    let s = fixture(id);
    const initial = structuredClone(s);
    s = step(s, "a", "attack", { index: 0 });
    assert.equal(s.pending.choice.player, chooser);
    assert.equal(s.current, 0);
    assert.equal(s.turn, 4);
    conserved(initial, s);
    rejects(
      s,
      chooser === "a" ? "b" : "a",
      "choose",
      {
        resolution: s.pending.id,
        choice: s.pending.choice.key,
        values: [s.pending.choice.options[0].value],
      },
      /other Trainer/,
    );
    const promoted = s.pending.choice.options[1].value;
    s = finish(s, { "force-switch": [promoted] });
    assert.equal(s.current, 1);
    assert.equal(s.turn, 5);
    assert.equal(s.players[1].active.uid, promoted);
    conserved(initial, s);
  }
  let s = fixture("base1-57");
  s.players[1].active.damage = 110;
  s = step(s, "a", "attack", { index: 0 });
  assert.equal(s.pending, undefined);
  assert.equal(
    s.players[1].active,
    null,
    "a Knock Out uses promotion, not forced switching",
  );
});
test("pending choices are atomic, deterministic, replayable, reject duplicates and forged input, and lock unrelated actions", () => {
  const start = trainerFixture(71);
  const action = post("a", "play", { uid: start.players[0].hand[0].uid });
  let s = game.applyPost(start, action, catalog).state;
  assert.ok(s.pending);
  assert.deepEqual(s.players, start.players, "cost is not partially paid");
  assert.deepEqual(game.applyPost(start, action, catalog).state, s);
  assert.equal(game.applyPost(s, action, catalog).state, s);
  rejects(s, "a", "end", {}, /Finish/);
  rejects(s, "a", "power", { uid: s.players[0].active.uid }, /Finish/);
  const data = {
    resolution: s.pending.id,
    choice: s.pending.choice.key,
    values: [
      s.pending.choice.options[0].value,
      s.pending.choice.options[0].value,
    ],
  };
  rejects(s, "a", "choose", data, /different/);
  rejects(
    s,
    "a",
    "choose",
    { ...data, values: ["forged", "unknown"] },
    /valid/,
  );
  rejects(s, "a", "choose", { ...data, resolution: "expired" }, /expired/);
  const choose = post("a", "choose", {
    ...data,
    values: s.pending.choice.options.slice(0, 2).map((o) => o.value),
  });
  const result = game.applyPost(s, choose, catalog);
  assert.equal(result.error, undefined);
  assert.deepEqual(game.applyPost(s, choose, catalog), result);
  assert.equal(
    game.applyPost(result.state, choose, catalog).state,
    result.state,
  );
  s = finish(result.state);
  conserved(start, s);
  assert.equal(s.pending, undefined);
});
test("Pokédex supports shorter decks and rejects incomplete or duplicate orderings", () => {
  for (const count of [1, 3, 5]) {
    let s = trainerFixture(87);
    s.players[0].discard.push(...s.players[0].deck.splice(count));
    const before = structuredClone(s);
    s = step(s, "a", "play", { uid: s.players[0].hand[0].uid });
    assert.equal(s.pending.choice.ordered, true);
    assert.equal(s.pending.choice.max, count);
    rejects(
      s,
      "a",
      "choose",
      { resolution: s.pending.id, choice: s.pending.choice.key, values: [] },
      /required/,
    );
    s = finish(s, { pokedex: (c) => c.options.map((o) => o.value).reverse() });
    assert.deepEqual(
      s.players[0].deck,
      before.players[0].deck.slice().reverse(),
    );
    conserved(before, s);
  }
});
test("Base Set attacks cannot bypass missing discard costs, Dream Eater, Amnesia or Leek Slap restrictions", () => {
  let s = fixture("base1-29");
  rejects(s, "a", "attack", { index: 1 }, /Asleep/);
  s = fixture("base1-27");
  s.players[0].active.usedAttacks = ["Leek Slap"];
  rejects(s, "a", "attack", { index: 0 }, /once/);
  s = fixture("base1-24");
  s.players[0].active.effects = { amnesia: { name: "Slash", until: 4 } };
  rejects(s, "a", "attack", { index: 0 }, /Amnesia/);
  s = fixture("base1-4");
  s.players[0].active.energy = ["base1-21", "base1-96"];
  s.players[0].active.energyTypes = { 0: "Fire" };
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  s.players[0].active.energy = ["base1-21"];
  s.players[0].active.energyTypes = { 0: "Fire" };
  rejects(s, "a", "attack", { index: 0 }, /Energy/);
});
test("retreat counts Energy units, offers Energy choices, rejects excess payments, and preserves Buzzap metadata", () => {
  let s = fixture("base1-7");
  s.players[0].active.energy = ["base1-96", "base1-98"];
  const before = structuredClone(s);
  s = step(s, "a", "retreat", { uid: s.players[0].bench[0].uid });
  assert.ok(s.pending);
  rejects(
    s,
    "a",
    "choose",
    {
      resolution: s.pending.id,
      choice: s.pending.choice.key,
      values: ["0", "1"],
    },
    /just enough/,
  );
  s = finish(s, { "retreat-energy": ["0"] });
  assert.deepEqual(s.players[0].bench[0].energy, ["base1-98"]);
  assert.equal(s.players[0].retreated, true);
  conserved(before, s);
  s = fixture("base1-7");
  s.players[0].active.energy = ["base1-21"];
  s.players[0].active.energyTypes = { 0: "Grass" };
  s = act(s, "a", "retreat", { uid: s.players[0].bench[0].uid });
  assert.equal(s.players[0].bench[0].energy.length, 0);
  assert.deepEqual(s.players[0].bench[0].energyTypes, {});
});
test("Metronome copies costs correctly, keeps Clefairy’s type, preserves self-reference, and uses its own Energy", () => {
  let r = directAttack(
    "base1-5",
    1,
    [true],
    (s) => {
      s.players[1].active = piece("base1-4", 0);
      s.players[0].active.energy = ["base1-96", "base1-98"];
    },
    { metronome: ["0"] },
  );
  assert.equal(r.ctx.damage, 100);
  assert.equal(r.a.energy.length, 2, "no Fire Spin discard for Metronome");
  r = directAttack(
    "base1-5",
    1,
    [true],
    (s) => (s.players[1].active = piece("base1-3", 0)),
    { metronome: ["1"] },
  );
  assert.equal(r.ctx.damage, 80, "Clefairy stays Colorless");
  assert.equal(r.a.damage, 100, "Double-edge recoil hits Clefairy");
  r = directAttack(
    "base1-5",
    1,
    [true],
    (s) => {
      s.players[1].active = piece("base1-2", 0);
      s.players[0].active.energy = ["base1-96", "base1-102", "base1-102"];
    },
    { metronome: ["0"] },
  );
  assert.equal(
    r.ctx.damage,
    50,
    "one surplus Water after paying the three-Colorless Metronome cost",
  );
  r = directAttack(
    "base1-5",
    1,
    [true],
    (s) => (s.players[1].active = piece("base1-5", 0)),
    { metronome: ["1"] },
  );
  assert.equal(r.ctx.damage, 0, "Metronome copying itself terminates");
  let s = fixture("base1-5", "base1-29");
  s = step(s, "a", "attack", { index: 1 });
  rejects(
    s,
    "a",
    "choose",
    { resolution: s.pending.id, choice: s.pending.choice.key, values: ["1"] },
    /Asleep/,
  );
});
test("Mirror Move repeats actual last-turn results without rerolling, ignores recoil, and can reflect bench damage", () => {
  let r = directAttack(
    "base1-22",
    1,
    [false],
    (s) =>
      (s.players[0].active.lastAttack = {
        turn: 3,
        damage: 30,
        conditions: ["Poisoned"],
        poisonDamage: 20,
        discardedEnergy: 1,
      }),
  );
  assert.equal(r.ctx.damage, 30);
  assert.ok(r.b.conditions.includes("Poisoned"));
  assert.equal(r.b.effects.poisonDamage, 20);
  assert.equal(r.b.energy.length, 1);
  assert.equal(r.a.damage, 20);
  r = directAttack(
    "base1-22",
    1,
    [true],
    (s) =>
      (s.players[0].active.lastAttack = {
        turn: 2,
        damage: 80,
        conditions: ["Confused"],
      }),
  );
  assert.equal(r.ctx.damage, 0);
  assert.deepEqual(r.b.conditions, []);
  let s = fixture("base1-53");
  s.players[0].active.damage = 0;
  s.players[1].bench = [piece("base1-22")];
  s = act(s, "a", "attack", { index: 1 });
  assert.equal(s.players[1].bench[0].lastAttack.damage, 10);
  assert.equal(s.players[1].bench[0].lastAttack.turn, 4);
});
test("all 114 attacks can also enter and complete the public action pipeline without manual damage", () => {
  for (const card of set)
    for (let index = 0; index < card.attacks.length; index++) {
      let s = fixture(card.id);
      s.players[0].active.damage = 0;
      if (card.id === "base1-29" && index === 1)
        s.players[1].active.conditions = ["Asleep"];
      if (card.id === "base1-22" && index === 1)
        s.players[0].active.lastAttack = {
          turn: 3,
          damage: 30,
          conditions: [],
        };
      const before = structuredClone(s);
      s = act(s, "a", "attack", { index });
      assert.ok(
        s.log.some((l) => l.text.includes(`used ${card.attacks[index].name}`)),
        `${card.id} ${index}`,
      );
      assert.ok(s.turn === 5 || s.status === "finished");
      conserved(before, s);
    }
});
test("Metronome can resolve every Base Set attack through the action pipeline", () => {
  for (const card of set)
    for (let index = 0; index < card.attacks.length; index++) {
      let s = fixture("base1-5", card.id);
      s.players[1].active.damage = 0;
      if (card.id === "base1-29" && index === 1)
        s.players[1].active.conditions = ["Asleep"];
      s.players[0].active.lastAttack = {
        turn: 3,
        damage: 10,
        conditions: ["Poisoned"],
      };
      const before = structuredClone(s);
      s = act(s, "a", "attack", { index: 1 }, { metronome: [String(index)] });
      assert.ok(
        s.log.some((l) => l.text.includes("used Metronome")),
        `${card.id}/${index}`,
      );
      conserved(before, s);
    }
});
test("attack costs are paid on misses, and misses do not apply healing, damage or secondary effects", () => {
  for (const condition of ["Confused", "Sand-attack"]) {
    let s = fixture("base1-24");
    s.seed = 1; // first LCG flip is tails
    if (condition === "Confused") s.players[0].active.conditions = ["Confused"];
    else s.players[0].active.effects = { sandAttackUntil: 4 };
    const before = structuredClone(s);
    s = act(s, "a", "attack", { index: 1 });
    assert.equal(s.players[1].active.damage, 20);
    assert.equal(s.players[0].active.energy.length, 24);
    assert.equal(
      s.players[0].active.damage,
      condition === "Confused" ? 50 : 20,
    );
    assert.equal(s.turn, 5);
    conserved(before, s);
  }
});
test("coin state stays unchanged during choices and final replay produces the same outcome", () => {
  const s = fixture("base1-11");
  s.players[0].active.energy = ["base1-99", "base1-99", "base1-99"];
  const started = post("a", "attack", { index: 0 });
  assert.deepEqual(
    game.applyPost(s, started, catalog),
    game.applyPost(s, started, catalog),
  );
  let original = fixture("base1-44");
  const attack = post("a", "attack", { index: 0 });
  const pending = game.applyPost(original, attack, catalog).state;
  assert.ok(pending.pending);
  assert.equal(pending.seed, original.seed);
  const choice = post("a", "choose", {
    resolution: pending.pending.id,
    choice: pending.pending.choice.key,
    values: ["yes"],
  });
  assert.deepEqual(
    game.applyPost(pending, choice, catalog),
    game.applyPost(pending, choice, catalog),
  );
});
test("invalid Trainers are rejected before an impossible choice can trap the match", () => {
  for (const n of [70, 86, 89]) {
    const s = trainerFixture(n);
    const p = n === 86 ? s.players[1] : s.players[0];
    p.bench = Array.from({ length: 5 }, () => piece("neutral"));
    rejects(s, "a", "play", { uid: s.players[0].hand[0].uid }, /full/);
  }
  let s = trainerFixture(74);
  s.players[0].discard = [];
  s.players[0].hand = [
    s.players[0].hand[0],
    hand("base1-98"),
    hand("base1-98"),
    hand("base1-98"),
  ];
  rejects(s, "a", "play", { uid: s.players[0].hand[0].uid }, /no Trainer/);
  for (const n of [71, 83]) {
    s = trainerFixture(n);
    s.players[0].hand = s.players[0].hand.slice(0, 2);
    rejects(s, "a", "play", { uid: s.players[0].hand[0].uid }, /No valid/);
  }
  s = trainerFixture(76);
  s.players[0].turns = 1;
  rejects(s, "a", "play", { uid: s.players[0].hand[0].uid }, /second turn/);
  s = trainerFixture(76);
  s.players[0].bench.forEach((p) => (p.entered = s.turn));
  rejects(s, "a", "play", { uid: s.players[0].hand[0].uid }, /No valid/);
  s = trainerFixture(76);
  s.players[0].hand = s.players[0].hand.filter((h) => h.card !== "base1-4");
  rejects(s, "a", "play", { uid: s.players[0].hand[0].uid }, /No valid/);
});
test("evolution and switching clear attack effects; devolution can Knock Out a Pokémon without deleting damage", () => {
  let s = trainerFixture(72);
  s.players[0].active.damage = 60;
  const before = structuredClone(s);
  s = act(s, "a", "play", { uid: s.players[0].hand[0].uid });
  assert.equal(s.players[0].active, null);
  assert.equal(s.players[1].prizes.length, 5);
  conserved(before, s);
  s = fixture("base1-46");
  s.players[0].active.conditions = ["Poisoned", "Confused"];
  s.players[0].active.effects = {
    weakness: "Water",
    resistance: "Grass",
    preventAllUntil: 4,
    sandAttackUntil: 4,
    amnesia: { name: "Ember", until: 4 },
  };
  s.players[0].hand = [hand("base1-24")];
  s = act(s, "a", "play", {
    uid: s.players[0].hand[0].uid,
    target: s.players[0].active.uid,
  });
  assert.deepEqual(s.players[0].active.effects, {});
  assert.deepEqual(s.players[0].active.conditions, []);
});
test("Energy Burn affects the cards present at activation, and fresh attachments need a new activation", () => {
  let s = fixture("base1-4");
  s.players[0].active.energy = ["base1-96"];
  s.players[0].hand = [hand("base1-99")];
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  s = act(s, "a", "play", {
    uid: s.players[0].hand[0].uid,
    target: s.players[0].active.uid,
  });
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog), [
    "Fire",
    "Fire",
    "Grass",
  ]);
  s = act(s, "a", "power", { uid: s.players[0].active.uid });
  assert.deepEqual(energy.providedEnergy(s.players[0].active, catalog), [
    "Fire",
    "Fire",
    "Fire",
  ]);
});

test("practice chooses for the opponent's attack and correctly pays retreat with Buzzap", () => {
  let s = fixture("base1-57");
  s = step(s, "a", "attack", { index: 0 });
  const choice = game.botAction(s, catalog, "b");
  assert.equal(choice.action, "choose");
  s = step(s, "b", choice.action, choice.data);
  assert.equal(s.pending, undefined);
  assert.equal(s.turn, 5);
  s = fixture("base1-7");
  s.players[0].active.energy = ["base1-98", "base1-21"];
  s.players[0].active.energyTypes = { 1: "Water" };
  s = step(s, "a", "retreat", { uid: s.players[0].bench[0].uid });
  const pay = game.botAction(s, catalog, "a");
  assert.deepEqual(pay.data.values, ["1"]);
  s = step(s, "a", pay.action, pay.data);
  assert.equal(s.pending, undefined);
  assert.deepEqual(s.players[0].bench[0].energy, ["base1-98"]);
});

test("unsupported mixed-set Metronome cannot trap a player in an impossible choice", () => {
  catalog["manual-target"] = {
    ...catalog.neutral,
    id: "manual-target",
    attacks: [
      {
        ...catalog.neutral.attacks[0],
        name: "Manual one",
        text: "A special effect from another set.",
      },
      {
        ...catalog.neutral.attacks[0],
        name: "Manual two",
        text: "Another special effect.",
      },
    ],
  };
  const s = fixture("base1-5", "manual-target");
  rejects(s, "a", "attack", { index: 1 }, /manual resolution/);
  assert.equal(s.pending, undefined);
});
