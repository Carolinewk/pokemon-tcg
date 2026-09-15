import { VibiNet } from "vibinet";
import {
  initialState,
  reducer,
  type Catalog,
  type GameState,
  type Post,
} from "./game";
import { createHttpClient } from "./http-client";
import { relayOrigin } from "./public-path";
export const POST_PACKER: VibiNet.Packed = {
  $: "Struct",
  fields: {
    pid: { $: "String" },
    id: { $: "String" },
    action: { $: "String" },
    payload: { $: "String" },
  },
};
// A frozen rules and data namespace prevents mismatched game versions sharing a table.
export const ROOM_VERSION = "poketable-v4-neo-genesis-20444";
export function connectTable(
  room: string,
  catalog: Catalog,
  baseUrl = relayOrigin,
  useOfficialRelay = false,
) {
  return new VibiNet.game<GameState, Post>({
    room: ROOM_VERSION + "-" + room.toLowerCase(),
    initial: initialState(room.toUpperCase()),
    on_tick: (s) => s,
    on_post: (p, s) => reducer(p, s, catalog),
    packer: POST_PACKER,
    tick_rate: 4,
    tolerance: 400,
    cache: true,
    snapshot_stride: 4,
    snapshot_count: 120,
    ...(useOfficialRelay ? {} : { client: createHttpClient<Post>(baseUrl) }),
  });
}
