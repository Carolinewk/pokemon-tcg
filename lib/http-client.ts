import type { VibiNet } from "vibinet";
// Supported VibiNet client adapter for a durable same-origin HTTP room relay.
// Input order, time assignment, prediction, rollback and replay are VibiNet's.
type WirePost<P> = {
  room: string;
  index: number;
  name: string;
  server_time: number;
  client_time: number;
  data: P;
};
type Watch<P> = {
  cursor: number;
  handlers: Set<(post: WirePost<P>) => void>;
  busy: boolean;
};
export function createHttpClient<P>(baseUrl = "") {
  let stopped = false,
    synced = false,
    offset = 0,
    rtt = 200,
    bestRtt = Infinity,
    lastResponse = 0,
    flushing = false,
    syncing = false;
  const abort = new AbortController();
  const syncListeners = new Set<() => void>();
  const latestListeners = new Set<
    (info: { room: string; latest_index: number; server_time: number }) => void
  >();
  const watches = new Map<string, Watch<P>>();
  const pending: { room: string; name: string; data: P }[] = [];
  const request = async (path: string, options: RequestInit = {}) => {
    const started = Date.now();
    const response = await fetch(baseUrl + path, {
      ...options,
      signal: AbortSignal.any([abort.signal, AbortSignal.timeout(8000)]),
      cache: "no-store",
    });
    if (!response.ok) throw Error(`Room connection (${response.status})`);
    const data = (await response.json()) as {
      server_time: number;
      latest_index: number;
      posts: WirePost<P>[];
    };
    const elapsed = Date.now() - started;
    rtt = elapsed;
    lastResponse = Date.now();
    if (elapsed < bestRtt) {
      bestRtt = elapsed;
      offset = data.server_time - (started + elapsed / 2);
    }
    return data;
  };
  const notify = (room: string, post: WirePost<P>) => {
    const watch = watches.get(room);
    if (!watch) return;
    for (const fn of watch.handlers) fn(post);
  };
  const poll = async (room: string) => {
    const watch = watches.get(room);
    if (!watch || watch.busy || stopped) return;
    watch.busy = true;
    try {
      const data = await request(
        `/api/relay?room=${encodeURIComponent(room)}&from=${watch.cursor}`,
      );
      for (const post of data.posts as WirePost<P>[]) {
        if (post.index === watch.cursor) {
          notify(room, post);
          watch.cursor++;
        }
      }
      for (const fn of latestListeners)
        fn({
          room,
          latest_index: data.latest_index,
          server_time: data.server_time,
        });
    } catch {
      /* Retain cursor and retry automatically after a temporary disconnect. */
    } finally {
      watch.busy = false;
    }
  };
  const flush = async () => {
    if (flushing || stopped || !synced) return;
    flushing = true;
    try {
      while (pending.length && !stopped) {
        const p = pending[0];
        await request("/api/relay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        pending.shift();
        await poll(p.room);
      }
    } catch {
      /* A request with an unknown outcome is retried with its original id. */
    } finally {
      flushing = false;
    }
  };
  const sync = async () => {
    if (stopped || synced || syncing) return;
    syncing = true;
    try {
      await request("/api/relay?ping=1");
      if (stopped) return;
      synced = true;
      for (const callback of syncListeners) callback();
    } catch {
      /* The UI exposes a retry state if the relay cannot be reached. */
    } finally {
      syncing = false;
    }
  };
  const tick = setInterval(() => {
    if (!synced) void sync();
    for (const room of watches.keys()) void poll(room);
    void flush();
  }, 350);
  queueMicrotask(() => void sync());
  return {
    on_sync: (callback: () => void) => {
      syncListeners.add(callback);
      if (synced) queueMicrotask(callback);
    },
    watch: (
      room: string,
      _packer: VibiNet.Packed,
      handler?: (post: WirePost<P>) => void,
    ) => {
      let w = watches.get(room);
      if (!w) {
        w = { cursor: 0, handlers: new Set(), busy: false };
        watches.set(room, w);
      }
      if (handler) w.handlers.add(handler);
      void poll(room);
    },
    load: (
      room: string,
      from: number,
      _packer: VibiNet.Packed,
      handler?: (post: WirePost<P>) => void,
    ) => {
      let w = watches.get(room);
      if (!w) {
        w = { cursor: from, handlers: new Set(), busy: false };
        watches.set(room, w);
      } else w.cursor = Math.min(w.cursor, from);
      if (handler) w.handlers.add(handler);
      void poll(room);
    },
    get_latest_post_index: (room: string) => {
      void poll(room);
    },
    on_latest_post_index: (
      callback: (info: {
        room: string;
        latest_index: number;
        server_time: number;
      }) => void,
    ) => {
      latestListeners.add(callback);
    },
    post: (room: string, data: P) => {
      const name = crypto.randomUUID();
      pending.push({ room, name, data });
      void flush();
      return name;
    },
    server_time: () => Date.now() + offset,
    ping: () => rtt,
    close: () => {
      stopped = true;
      abort.abort();
      clearInterval(tick);
      syncListeners.clear();
      latestListeners.clear();
      watches.clear();
    },
    debug_dump: () => ({
      transport: "http",
      ws_ready_state: lastResponse && Date.now() - lastResponse < 6000 ? 1 : 0,
      is_synced: synced,
      pending_post_count: pending.length,
      last_response: lastResponse,
      watched_rooms: [...watches.keys()],
    }),
  };
}
