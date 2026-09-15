import { relayDb } from "@/db/relay";
import type { Post } from "@/lib/game";
import { relayHeaders, relayOriginAllowed } from "@/lib/relay-cors";
const reply = (request: Request, body: unknown, status = 200) =>
  Response.json(body, { status, headers: relayHeaders(request) });
const validRoom = (room: unknown): room is string =>
  typeof room === "string" &&
  /^poketable-(?:v2-20444|v3-base-set-20444|v4-neo-genesis-20444)-[a-z0-9]{6,24}$/.test(
    room,
  );
export async function GET(request: Request) {
  if (!relayOriginAllowed(request))
    return reply(request, { error: "This site cannot access the relay." }, 403);
  try {
    const url = new URL(request.url);
    if (url.searchParams.has("ping"))
      return reply(request, { server_time: Date.now() });
    const room = url.searchParams.get("room");
    if (!validRoom(room))
      return reply(request, { error: "Invalid room code." }, 400);
    const from = Number(url.searchParams.get("from") || 0);
    if (!Number.isInteger(from) || from < 0)
      return reply(request, { error: "Invalid post index." }, 400);
    const db = relayDb();
    const results = await db.batch<Record<string, string | number>>([
      db
        .prepare(
          "SELECT post_index AS idx, post_name AS name, server_time, data FROM room_posts WHERE room = ? AND post_index >= ? ORDER BY post_index ASC LIMIT 300",
        )
        .bind(room, from),
      db
        .prepare(
          "SELECT COALESCE(MAX(post_index), -1) AS latest FROM room_posts WHERE room = ?",
        )
        .bind(room),
    ]);
    const posts = results[0].results.map((row) => ({
      room,
      index: Number(row.idx),
      name: String(row.name),
      server_time: Number(row.server_time),
      client_time: Number(row.server_time),
      data: JSON.parse(String(row.data)) as Post,
    }));
    return reply(request, {
      server_time: Date.now(),
      latest_index: Number(results[1].results[0]?.latest ?? -1),
      posts,
    });
  } catch (error) {
    console.error("Room read failed", error);
    return reply(
      request,
      { error: "The table is temporarily unavailable. Retrying is safe." },
      503,
    );
  }
}
export function OPTIONS(request: Request) {
  if (!relayOriginAllowed(request))
    return reply(request, { error: "This site cannot access the relay." }, 403);
  const headers = relayHeaders(request);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "600");
  return new Response(null, { status: 204, headers });
}
export async function POST(request: Request) {
  if (!relayOriginAllowed(request))
    return reply(request, { error: "This site cannot access the relay." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 12000)
      return reply(request, { error: "Move is too large." }, 413);
    const body = JSON.parse(raw);
    const { room, name, data } = body;
    if (
      !validRoom(room) ||
      typeof name !== "string" ||
      name.length > 100 ||
      !data ||
      typeof data.pid !== "string" ||
      data.pid.length > 100 ||
      typeof data.id !== "string" ||
      data.id.length > 150 ||
      typeof data.action !== "string" ||
      data.action.length > 30 ||
      typeof data.payload !== "string" ||
      data.payload.length > 10000
    )
      return reply(request, { error: "Invalid move." }, 400);
    const db = relayDb();
    const now = Date.now();
    // SQLite serializes writes. Allocation and insertion share one statement;
    // idempotent retry cannot consume an index or leave a gap in the room stream.
    await db
      .prepare(
        `INSERT INTO room_posts (room, post_index, post_name, server_time, data)
 SELECT ?, COALESCE(MAX(post_index), -1) + 1, ?, MAX(?, COALESCE(MAX(server_time), 0)), ?
 FROM room_posts WHERE room = ?
 HAVING COALESCE(MAX(post_index), -1) < 10000
 ON CONFLICT(room, post_name) DO NOTHING`,
      )
      .bind(room, name, now, JSON.stringify(data), room)
      .run();
    const saved = await db
      .prepare(
        "SELECT post_index AS idx, post_name AS name, server_time, data FROM room_posts WHERE room = ? AND post_name = ?",
      )
      .bind(room, name)
      .first<{
        idx: number;
        name: string;
        server_time: number;
        data: string;
      }>();
    if (!saved)
      return reply(
        request,
        { error: "This room has reached its move limit. Start a new match." },
        409,
      );
    return reply(request, {
      server_time: Date.now(),
      post: {
        room,
        index: saved.idx,
        name: saved.name,
        server_time: saved.server_time,
        client_time: saved.server_time,
        data: JSON.parse(saved.data),
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError)
      return reply(request, { error: "Invalid move JSON." }, 400);
    console.error("Room write failed", error);
    return reply(
      request,
      { error: "The move could not be saved. Retrying is safe." },
      503,
    );
  }
}
