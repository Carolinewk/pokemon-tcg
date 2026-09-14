import { env } from "cloudflare:workers";
export function relayDb() {
  if (!env.DB) throw new Error("Room storage is unavailable.");
  return env.DB;
}
