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
    id: `${pid}-${action}-${Date.now()}`,
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
    deckName: STARTERS[0].name,
    cards: STARTERS[0].cards,
  });
  await wait(
    () =>
      a.compute_render_state().players.length === 1 &&
      b.compute_render_state().players.length === 1,
    "first join",
  );
  post(b, "b", "join", {
    name: "Bob",
    deckName: STARTERS[1].name,
    cards: STARTERS[1].cards,
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
  console.log("MULTIPLAYER INTEGRATION PASSED");
} finally {
  clients.forEach((c) => c.close());
}
