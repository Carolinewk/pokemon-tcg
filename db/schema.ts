import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
// An append-only input stream. VibiNet remains responsible for game-state replay.
export const roomPosts = sqliteTable(
  "room_posts",
  {
    room: text("room").notNull(),
    index: integer("post_index").notNull(),
    name: text("post_name").notNull(),
    serverTime: integer("server_time").notNull(),
    data: text("data").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.room, t.index] }),
    uniqueIndex("room_posts_name").on(t.room, t.name),
  ],
);
