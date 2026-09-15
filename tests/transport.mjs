import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSync } from "esbuild";
import WebSocket from "ws";
globalThis.WebSocket = WebSocket;
const load = async (file) => {
  const result = buildSync({
    entryPoints: [file],
    bundle: true,
    format: "esm",
    platform: "browser",
    write: false,
    target: "es2022",
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(result.outputFiles[0].text).toString("base64")
  );
};
const { connectTable } = await load("lib/network.ts");
const { STARTERS, isBasic } = await load("lib/game.ts");
const catalog = Object.fromEntries(
  JSON.parse(readFileSync("public/data/cards.json", "utf8")).map((c) => [
    c.id,
    c,
  ]),
);
const room = "test" + Date.now().toString(36);
const clients = [];
let nonce = 0;
const effectDeck = [
  ...["base1-57", "base1-46", "base1-45", "base1-71", "base1-95"].flatMap(
    (id) => Array(4).fill(id),
  ),
  ...Array(40).fill("base1-98"),
];
const wait = async (predicate, label, limit = 18000) => {
  const start = Date.now();
  while (Date.now() - start < limit) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw Error("Timeout: " + label);
};
const post = (client, pid, action, data) =>
  client.post({
    pid,
    id: `${pid}-${action}-${Date.now()}-${nonce++}`,
    action,
    payload: JSON.stringify(data),
  });
try {
  const a = connectTable(
      room,
      catalog,
      process.env.POKETABLE_TEST_ORIGIN || "http://localhost:5174",
    ),
    b = connectTable(
      room,
      catalog,
      process.env.POKETABLE_TEST_ORIGIN || "http://localhost:5174",
    );
  clients.push(a, b);
  let sa = false,
    sb = false;
  a.on_sync(() => (sa = true));
  b.on_sync(() => (sb = true));
  await wait(() => sa && sb, "server time sync");
  console.log("PASS: both clients connected to the VibiNet room relay");
  post(a, "a", "join", {
    name: "Alice",
    deckName: "Base Set effects test",
    cards: effectDeck,
  });
  await wait(
    () =>
      a.compute_render_state().players.length === 1 &&
      b.compute_render_state().players.length === 1,
    "first join",
  );
  post(b, "b", "join", {
    name: "Bob",
    deckName: "Base Set effects test",
    cards: effectDeck,
  });
  await wait(
    () =>
      a.compute_render_state().players.length === 2 &&
      b.compute_render_state().players.length === 2,
    "second join",
  );
  assert.deepEqual(a.compute_render_state(), b.compute_render_state());
  console.log("PASS: two clients agree on shuffled decks and opening hands");
  for (const [client, id] of [
    [a, "a"],
    [b, "b"],
  ]) {
    const p = client.compute_render_state().players.find((p) => p.id === id);
    const h = p.hand.find((h) => isBasic(catalog[h.card]));
    post(client, id, "play", { uid: h.uid });
  }
  await wait(
    () =>
      [a, b].every((c) =>
        c.compute_render_state().players.every((p) => p.active),
      ),
    "opening Pokémon",
  );
  post(a, "a", "ready", {});
  post(b, "b", "ready", {});
  await wait(
    () => [a, b].every((c) => c.compute_render_state().status === "playing"),
    "both ready",
  );
  const synchronizedMove = async (pid, action, data = {}) => {
    const seq = a.compute_render_state().seq;
    post(pid === "a" ? a : b, pid, action, data);
    await wait(
      () => clients.every((c) => c.compute_render_state().seq > seq),
      `${action} acknowledged by every client`,
    );
    const next = a.compute_render_state();
    for (const c of clients) assert.deepEqual(c.compute_render_state(), next);
    return next;
  };
  const getHandCard = async (pid, match) => {
    let p = a.compute_render_state().players.find((p) => p.id === pid);
    let card = p.hand.find((h) => match(catalog[h.card]));
    if (card) return card;
    for (const from of ["deck", "discard", "prizes"]) {
      card = p[from].find((h) => match(catalog[h.card]));
      if (card) {
        await synchronizedMove(pid, "move", {
          from,
          to: "hand",
          uid: card.uid,
        });
        return card;
      }
    }
    throw Error("Test fixture card unavailable");
  };
  const addBench = async (pid) => {
    while (
      a.compute_render_state().players.find((p) => p.id === pid).bench.length <
      2
    ) {
      const h = await getHandCard(pid, isBasic);
      await synchronizedMove(pid, "play", { uid: h.uid });
    }
  };
  await addBench(
    a.compute_render_state().players[a.compute_render_state().current].id,
  );
  const state = a.compute_render_state();
  const current = state.players[state.current];
  const client = current.id === "a" ? a : b;
  post(client, current.id, "end", {});
  await wait(
    () => [a, b].every((c) => c.compute_render_state().turn === 2),
    "turn synchronization",
  );
  assert.deepEqual(a.compute_render_state(), b.compute_render_state());
  console.log("PASS: setup, coin toss, draw, and turn change synchronized");
  const late = connectTable(
    room,
    catalog,
    process.env.POKETABLE_TEST_ORIGIN || "http://localhost:5174",
  );
  clients.push(late);
  await wait(() => late.compute_render_state().turn === 2, "late-join replay");
  assert.deepEqual(a.compute_render_state(), late.compute_render_state());
  console.log("PASS: reconnect/late join replays the exact match");
  post(late, "third", "join", {
    name: "Third",
    deckName: STARTERS[0].name,
    cards: STARTERS[0].cards,
  });
  await new Promise((r) => setTimeout(r, 1400));
  assert.equal(a.compute_render_state().players.length, 2);
  console.log("PASS: third player cannot take an occupied seat");
  const attacker =
    a.compute_render_state().players[a.compute_render_state().current].id;
  await addBench(attacker);
  let p = a.compute_render_state().players.find((p) => p.id === attacker);
  if (p.active.card !== "base1-57") {
    if (!p.bench.some((c) => c.card === "base1-57")) {
      const bird = await getHandCard(attacker, (c) => c.id === "base1-57");
      await synchronizedMove(attacker, "play", { uid: bird.uid });
    }
    p = a.compute_render_state().players.find((p) => p.id === attacker);
    await synchronizedMove(attacker, "swap", {
      owner: attacker,
      uid: p.bench.find((c) => c.card === "base1-57").uid,
    });
  }
  for (let i = 0; i < 2; i++) {
    const energy = await getHandCard(attacker, (c) => c.id === "base1-98");
    await synchronizedMove(attacker, "play", {
      uid: energy.uid,
      target: a.compute_render_state().players.find((p) => p.id === attacker)
        .active.uid,
      manual: i > 0,
    });
  }
  const search = await getHandCard(attacker, (c) => c.id === "base1-71");
  while (
    a.compute_render_state().players.find((p) => p.id === attacker).hand
      .length < 4
  ) {
    p = a.compute_render_state().players.find((p) => p.id === attacker);
    await synchronizedMove(attacker, "move", {
      from: "deck",
      to: "hand",
      uid: p.deck[0].uid,
    });
  }
  let pending = (await synchronizedMove(attacker, "play", { uid: search.uid }))
    .pending;
  assert.equal(pending.choice.key, "search-cost");
  while (pending) {
    await synchronizedMove(pending.choice.player, "choose", {
      resolution: pending.id,
      choice: pending.choice.key,
      values: pending.choice.options
        .slice(0, pending.choice.max)
        .map((o) => o.value),
    });
    pending = a.compute_render_state().pending;
  }
  console.log(
    "PASS: Computer Search choices and discards synchronize on all clients",
  );
  pending = (await synchronizedMove(attacker, "attack", { index: 0 })).pending;
  assert.equal(pending.choice.key, "force-switch");
  assert.notEqual(pending.choice.player, attacker);
  assert.equal(a.compute_render_state().turn, 2);
  const reconnect = connectTable(
    room,
    catalog,
    process.env.POKETABLE_TEST_ORIGIN || "http://localhost:5174",
  );
  clients.push(reconnect);
  await wait(
    () => reconnect.compute_render_state().pending?.id === pending.id,
    "reconnect during pending Whirlwind",
  );
  assert.deepEqual(reconnect.compute_render_state(), a.compute_render_state());
  const target = pending.choice.options.at(-1).value;
  const after = await synchronizedMove(pending.choice.player, "choose", {
    resolution: pending.id,
    choice: pending.choice.key,
    values: [target],
  });
  assert.equal(after.turn, 3);
  assert.equal(after.pending, undefined);
  assert.equal(
    after.players.find((p) => p.id === pending.choice.player).active.uid,
    target,
  );
  console.log(
    "PASS: Whirlwind waits for the opponent, survives reconnect, and ends the turn after their selection",
  );
  console.log("MULTIPLAYER INTEGRATION PASSED");
} finally {
  clients.forEach((c) => c.close());
}
