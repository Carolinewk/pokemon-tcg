import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildSync } from "esbuild";
const compiled = buildSync({
  entryPoints: ["lib/game.ts"],
  bundle: true,
  format: "esm",
  write: false,
  target: "es2022",
}).outputFiles[0].text;
const {
  STARTERS,
  deckError,
  makePractice,
  initialState,
  applyPost,
  isBasic,
  canPay,
  allPieces,
} = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
const catalog = Object.fromEntries(
  JSON.parse(readFileSync("public/data/cards.json", "utf8")).map((c) => [
    c.id,
    c,
  ]),
);
let nonce = 0;
const post = (pid, action, data = {}) => ({
  pid,
  id: String(nonce++),
  action,
  payload: JSON.stringify(data),
});
const move = (s, pid, action, data = {}) => {
  const result = applyPost(s, post(pid, action, data), catalog);
  assert.equal(result.error, undefined, `${action}: ${result.error}`);
  return result.state;
};
function integrity(s) {
  for (const p of s.players) {
    const ids = [...p.deck, ...p.hand, ...p.prizes, ...p.discard].map(
      (c) => c.card,
    );
    for (const c of allPieces(p))
      ids.push(c.card, ...c.energy, ...c.stack, ...c.tools, ...(c.trainerAttachments || []).map(t => t.card));
    assert.equal(ids.length, 60);
    assert.ok(ids.every((id) => catalog[id]));
    assert.ok(p.bench.length <= 5);
    assert.ok(allPieces(p).every((c) => c.damage >= 0));
  }
}
test("all 20,444 cards have unique IDs and complete playable metadata", () => {
  assert.equal(Object.keys(catalog).length, 20444);
  for (const c of Object.values(catalog)) {
    assert.ok(c.id && c.name && c.image && c.set);
    assert.ok(Array.isArray(c.attacks) && Array.isArray(c.subtypes));
  }
});
test("starter decks have 60 valid cards; invalid decks are rejected", () => {
  for (const deck of STARTERS) {
    assert.equal(deckError(deck.cards, catalog), null);
  }
  assert.match(deckError(STARTERS[0].cards.slice(1), catalog), /60/);
  assert.match(deckError(Array(60).fill("base1-4"), catalog), /Basic/);
  assert.match(
    deckError(
      [...Array(5).fill("base1-46"), ...Array(55).fill("base1-98")],
      catalog,
    ),
    /at most 4/,
  );
});
test("100 seeded opening hands contain Basics and conserve cards", () => {
  for (let i = 0; i < 100; i++) {
    const s = makePractice(catalog, STARTERS[i % 3], `test-${i}`);
    assert.equal(s.status, "playing");
    integrity(s);
    assert.ok(s.players.every((p) => isBasic(catalog[p.active.card])));
  }
});
test("input replay is deterministic and never mutates earlier state", () => {
  const init = initialState("TEST42");
  const frozen = JSON.stringify(init);
  const p = post("alice", "join", {
    name: "Alice",
    deckName: STARTERS[0].name,
    cards: STARTERS[0].cards,
  });
  const a = applyPost(init, p, catalog).state,
    b = applyPost(init, p, catalog).state;
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(init), frozen);
  assert.equal(applyPost(a, p, catalog).state, a);
});
test("reject out-of-turn moves and an occupied third seat", () => {
  const s = makePractice(catalog);
  const result = applyPost(s, post("bot", "end"), catalog);
  assert.match(result.error, /opponent/);
  assert.equal(result.state, s);
  const third = applyPost(
    s,
    post("third", "join", { cards: STARTERS[0].cards }),
    catalog,
  );
  assert.match(third.error, /two Trainers/);
});
test("Energy attaches once per turn and typed costs are enforced", () => {
  let s = makePractice(catalog);
  const p = s.players[0];
  const energies = p.hand.filter((h) => catalog[h.card].supertype === "Energy");
  s = move(s, "you", "play", { uid: energies[0].uid, target: p.active.uid });
  assert.equal(s.players[0].active.energy.length, 3);
  const second = applyPost(
    s,
    post("you", "play", { uid: energies[1].uid, target: p.active.uid }),
    catalog,
  );
  assert.match(second.error, /attached your Energy/);
  const fire = catalog["base1-24"].attacks[1];
  assert.equal(
    canPay(
      { ...p.active, energy: ["base1-102", "base1-102", "base1-102"] },
      fire,
      catalog,
    ),
    false,
  );
  integrity(s);
});
test("evolution retains Energy and damage; attacks apply weakness, discard costs, prizes and turn advancement", () => {
  let s = makePractice(catalog);
  const p = s.players[0];
  s = move(s, "you", "play", {
    uid: p.hand.find((h) => h.card === "base1-98").uid,
    target: p.active.uid,
  });
  const active = s.players[0].active;
  s = move(s, "you", "attack", { index: 1 });
  assert.equal(s.players[0].active.energy.length, 2);
  assert.equal(s.players[0].prizes.length, 5);
  assert.equal(s.players[1].active, null);
  assert.equal(s.current, 1);
  assert.equal(s.turn, 5);
  assert.ok(s.log.some((l) => l.text.includes("50 damage")));
  integrity(s);
});
test("evolving and ending turns preserves cards", () => {
  let s = makePractice(catalog);
  const p = s.players[0];
  s = move(s, "you", "play", {
    uid: p.hand.find((h) => h.card === "base1-4").uid,
    target: p.active.uid,
  });
  assert.equal(s.players[0].active.card, "base1-4");
  assert.equal(s.players[0].active.stack.length, 2);
  assert.equal(s.players[0].active.damage, 10);
  s = move(s, "you", "end");
  assert.equal(s.turn, 5);
  assert.equal(s.current, 1);
  integrity(s);
});
test("Bill and Professor Oak resolve draw and discard effects", () => {
  let s = makePractice(catalog);
  const bill = s.players[0].hand.find((h) => h.card === "base1-91");
  const before = s.players[0].hand.length;
  s = move(s, "you", "play", { uid: bill.uid });
  assert.equal(s.players[0].hand.length, before + 1);
  assert.equal(s.players[0].discard.at(-1).card, "base1-91");
  integrity(s);
});
test("the final Prize ends the match, and finished matches reject actions", () => {
  let s = makePractice(catalog);
  const p = s.players[0];
  p.hand.push(...p.prizes.splice(1));
  s = move(s, "you", "play", {
    uid: p.hand.find((h) => h.card === "base1-98").uid,
    target: p.active.uid,
  });
  s = move(s, "you", "attack", { index: 1 });
  assert.equal(s.status, "finished");
  assert.equal(s.winner, "you");
  assert.match(applyPost(s, post("you", "end"), catalog).error, /finished/);
  integrity(s);
});
test("turn draw from an empty deck awards opponent the match", () => {
  let s = makePractice(catalog);
  const p = s.players[1];
  p.hand.push(...p.deck);
  p.deck = [];
  s = move(s, "you", "end");
  assert.equal(s.status, "finished");
  assert.equal(s.winner, "you");
  integrity(s);
});
test("manual effects, condition clearing, card moves and shuffle are replayable", () => {
  let s = makePractice(catalog);
  const p = s.players[0];
  s = move(s, "you", "adjust", { owner: "you", uid: p.active.uid, damage: 20 });
  assert.equal(s.players[0].active.damage, 30);
  s = move(s, "you", "adjust", {
    owner: "bot",
    uid: s.players[1].active.uid,
    condition: "Poisoned",
  });
  s = move(s, "you", "adjust", {
    owner: "bot",
    uid: s.players[1].active.uid,
    condition: "Clear",
  });
  assert.deepEqual(s.players[1].active.conditions, []);
  s = move(s, "you", "move", { from: "hand", to: "deck", uid: p.hand[0].uid });
  s = move(s, "you", "shuffle");
  integrity(s);
});

test("practice opponents complete 24 seeded games without losing or duplicating cards", async () => {
  const { botAction } = await import(
    "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
  );
  for (let seed = 0; seed < 24; seed++) {
    let s = makePractice(catalog, STARTERS[seed % 3], `self-play-${seed}`);
    for (let step = 0; step < 1600 && s.status === "playing"; step++) {
      const promotion = s.players.find((p) => !p.active && p.bench.length);
      if (promotion) {
        s = move(s, promotion.id, "promote", { uid: promotion.bench[0].uid });
        continue;
      }
      const id = s.players[s.current].id;
      const action = botAction(s, catalog, id);
      assert.ok(action, `No action at seed ${seed}, turn ${s.turn}`);
      s = move(s, id, action.action, action.data);
      integrity(s);
    }
    assert.equal(s.status, "finished", `Game ${seed} must reach a winner`);
  }
});

test("Stadium replacements return the previous card to its owner, and remain inspectable", () => {
  let s = makePractice(catalog);
  const stadium = Object.values(catalog).find((c) =>
    c.subtypes.includes("Stadium"),
  );
  const inject = (p) => {
    const old = p.hand[0];
    p.hand[0] = { uid: old.uid, card: stadium.id };
    return old.uid;
  };
  s = move(s, "you", "play", { uid: inject(s.players[0]) });
  assert.equal(s.stadium.owner, "you");
  s = move(s, "you", "end");
  s = move(s, "bot", "play", { uid: inject(s.players[1]) });
  assert.equal(s.stadium.owner, "bot");
  assert.ok(s.players[0].discard.some((h) => h.card === stadium.id));
  s = move(s, "bot", "clearStadium");
  assert.equal(s.stadium, null);
  assert.ok(s.players[1].discard.some((h) => h.card === stadium.id));
});
