"use client";
/* eslint-disable react-hooks/refs -- Game input callbacks read the current network snapshot only when an input event occurs. */
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
} from "react";
import {
  CircleDot,
  Swords,
  Layers3,
  LibraryBig,
  Volume2,
  VolumeX,
  CircleHelp,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Search,
  X,
  Check,
  Copy,
  Users,
  Zap,
  Flame,
  Droplets,
  Leaf,
  Sparkles,
  RotateCcw,
  Shuffle,
  Hand,
  LogOut,
  Trophy,
  SlidersHorizontal,
  LoaderCircle,
  Eye,
  ShieldCheck,
  BookOpen,
  Download,
  Trash2,
  Heart,
  Circle,
  Target,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-provider";
import { toast } from "sonner";
import starterData from "@/lib/starter-cards.json";
import {
  STARTERS,
  makePractice,
  initialState,
  applyPost,
  botAction,
  isBasic,
  allPieces,
  deckError,
  canPay,
  automaticAttack,
  type Card,
  type Catalog,
  type Piece,
  type Player,
  type GameState,
  type Post,
  type Deck,
} from "@/lib/game";
import { playSound } from "@/lib/audio";
import type { connectTable } from "@/lib/network";
import { publicPath } from "@/lib/public-path";
import {
  compareCardRelease,
  formatCardRelease,
  type ReleaseOrder,
} from "@/lib/catalog";
import {
  EffectChoiceDialog,
  pieceEffectLabels,
  RevealedCardsDialog,
} from "@/components/effect-choice";
import { BASE_POWERS, powerAvailable } from "@/lib/effects/base-set/powers";
import {
  attachmentEnergy,
  providedEnergy,
} from "@/lib/effects/base-set/energy";

const STARTER_CATALOG = Object.fromEntries(
  (starterData as Card[]).map((c) => [c.id, c]),
);
const LOCAL_IMAGES = new Set(starterData.map((c) => c.id));
const TYPE_COLORS: Record<string, string> = {
  Fire: "#eb774e",
  Water: "#62abdb",
  Grass: "#6daf69",
  Lightning: "#eccb58",
  Psychic: "#b18ec5",
  Fighting: "#bf8763",
  Darkness: "#5e7291",
  Metal: "#8ba29f",
  Fairy: "#dc8db9",
  Dragon: "#b6a051",
  Colorless: "#aeb8ae",
};
const imageUrl = (c: Card, small = false) =>
  LOCAL_IMAGES.has(c.id)
    ? publicPath(`cards/${c.id}.png`)
    : small
      ? c.small || c.image
      : c.image;
function Energy({ type, size = 18 }: { type: string; size?: number }) {
  const Icon =
    type === "Fire"
      ? Flame
      : type === "Water"
        ? Droplets
        : type === "Grass"
          ? Leaf
          : type === "Lightning"
            ? Zap
            : type === "Psychic"
              ? Eye
              : type === "Colorless"
                ? Sparkles
                : Circle;
  return (
    <span
      className="energy-icon"
      style={{
        background: TYPE_COLORS[type] || TYPE_COLORS.Colorless,
        width: size,
        height: size,
      }}
      title={type}
    >
      <Icon
        size={Math.round(size * 0.64)}
        fill={type === "Lightning" ? "currentColor" : "none"}
      />
    </span>
  );
}
function CardImage({
  card,
  small = false,
  className = "",
}: {
  card: Card;
  small?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  /* eslint-disable @next/next/no-img-element -- Card providers supply exact artwork sizes; all images have a recoverable fallback. */
  return failed ? (
    <div className={`card-fallback ${className}`}>
      <CircleDot />
      <strong>{card.name}</strong>
      <span>{card.hp ? `${card.hp} HP` : card.supertype}</span>
      <small>
        {card.set} · {card.number}
      </small>
    </div>
  ) : (
    <img
      className={className}
      src={imageUrl(card, small)}
      alt={`${card.name} — ${card.set} #${card.number}`}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`card-back ${className}`} aria-label="Face-down card">
      <span className="back-inner">
        <CircleDot strokeWidth={1} />
        <b>POKÉTABLE</b>
      </span>
    </div>
  );
}
function Choice({
  value,
  onChange,
  options,
  label,
  collection = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
  collection?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="select-field" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent
        className={collection ? "collection-ui collection-menu" : undefined}
      >
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Selection = {
  card: string;
  uid?: string;
  owner?: string;
  zone: "hand" | "active" | "bench" | "catalog" | "discard";
};
export default function Home() {
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const update = () => setIsCompact(media.matches);
    const initial = setTimeout(update, 0);
    media.addEventListener("change", update);
    return () => {
      clearTimeout(initial);
      media.removeEventListener("change", update);
    };
  }, []);
  const [catalog, setCatalog] = useState<Catalog>(STARTER_CATALOG),
    [loaded, setLoaded] = useState(false),
    [catalogError, setCatalogError] = useState(false);
  const [screen, setScreen] = useState<"table" | "cards" | "decks">("table");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const workspaceRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<GameState>(() =>
    makePractice(STARTER_CATALOG),
  );
  const [mode, setMode] = useState<"practice" | "online">("practice"),
    [pid, setPid] = useState("you");
  const [selection, setSelection] = useState<Selection | null>({
    card: "base1-24",
    uid: makePractice(STARTER_CATALOG).players[0].active!.uid,
    owner: "you",
    zone: "active",
  });
  const [dialog, setDialog] = useState<
    "room" | "help" | "new" | "tools" | "concede" | null
  >(null);
  const [room, setRoom] = useState(""),
    [roomInput, setRoomInput] = useState(""),
    [name, setName] = useState("Trainer"),
    [connection, setConnection] = useState<
      "offline" | "connecting" | "connected" | "error"
    >("offline"),
    [ping, setPing] = useState(0);
  const [sound, setSound] = useState(true),
    [selectedDeck, setSelectedDeck] = useState("fire"),
    [customDecks, setCustomDecks] = useState<Deck[]>([]);
  const [query, setQuery] = useState(""),
    [typeFilter, setTypeFilter] = useState("all"),
    [setFilter, setSetFilter] = useState("all"),
    [releaseOrder, setReleaseOrder] = useState<ReleaseOrder>("oldest"),
    [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Deck | null>(null),
    [target, setTarget] = useState(""),
    [attackAmount, setAttackAmount] = useState("0"),
    [detailTab, setDetailTab] = useState("card");
  const [zone, setZone] = useState<"deck" | "discard" | "prizes" | "hand">(
      "discard",
    ),
    [moveTo, setMoveTo] = useState("hand"),
    [toolTarget, setToolTarget] = useState(""),
    [toolDamage, setToolDamage] = useState("10"),
    [drawCount, setDrawCount] = useState("1");
  const [burst, setBurst] = useState<{ kind: string; text: string } | null>(
      null,
    ),
    [inspectorOpen, setInspectorOpen] = useState(false),
    [loadedSettings, setLoadedSettings] = useState(false);
  const network = useRef<ReturnType<typeof connectTable> | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null),
    counter = useRef(0),
    stateRef = useRef(state),
    soundRef = useRef(sound),
    lastSeq = useRef(0),
    networkGeneration = useRef(0);
  const usableCustomDecks = customDecks.filter(
    (d) => d.cards.every((id) => !!catalog[id]) && !!catalog[d.cover],
  );
  const decks = [...STARTERS, ...usableCustomDecks];
  const activeDeck = decks.find((d) => d.id === selectedDeck) || STARTERS[0];
  const me = state.players.find((p) => p.id === pid);
  const opponent = state.players.find((p) => p.id !== pid);
  const myTurn =
    state.status === "playing" &&
    state.players[state.current]?.id === pid &&
    !state.pending;
  const selectedCard = selection ? catalog[selection.card] : undefined;
  const selectedPiece = selection?.uid
    ? state.players.flatMap(allPieces).find((p) => p.uid === selection.uid)
    : undefined;
  const canAct =
    (myTurn || state.status === "setup" || state.status === "waiting") &&
    state.status !== "finished" &&
    !state.pending;
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);
  const fetchCatalog = useCallback(async () => {
    setCatalogError(false);
    try {
      const response = await fetch(publicPath("data/cards.json"));
      if (!response.ok) throw Error("Card catalog unavailable");
      const cards: Card[] = await response.json();
      setCatalog(Object.fromEntries(cards.map((c) => [c.id, c])));
      setLoaded(true);
    } catch {
      setCatalogError(true);
    }
  }, []);
  useEffect(() => {
    const hydrateTimer = setTimeout(() => {
      void fetchCatalog();
      try {
        const saved = JSON.parse(
          localStorage.getItem("poketable-decks") || "[]",
        );
        if (Array.isArray(saved))
          setCustomDecks(
            saved.filter(
              (d) => d && typeof d.id === "string" && Array.isArray(d.cards),
            ),
          );
        const savedName = localStorage.getItem("poketable-name");
        if (savedName) setName(savedName);
        setSound(localStorage.getItem("poketable-sound") !== "off");
      } catch {}
      setLoadedSettings(true);
      const invite = new URLSearchParams(window.location.search).get("room");
      if (invite && /^[A-Z0-9]{6,12}$/i.test(invite)) {
        setRoomInput(invite.toUpperCase());
        setDialog("room");
      }
    }, 0);
    return () => {
      clearTimeout(hydrateTimer);
      // This counter deliberately invalidates all pending connections on unmount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      networkGeneration.current++;
      network.current?.close();
      if (timer.current) clearInterval(timer.current);
    };
  }, [fetchCatalog]);
  useEffect(() => {
    if (loadedSettings) {
      try {
        localStorage.setItem("poketable-decks", JSON.stringify(customDecks));
        localStorage.setItem("poketable-name", name);
        localStorage.setItem("poketable-sound", sound ? "on" : "off");
      } catch {
        toast.error("Device storage is full. Export your deck to keep it.");
      }
    }
  }, [customDecks, name, sound, loadedSettings]);
  useEffect(() => {
    if (state.seq <= lastSeq.current) {
      lastSeq.current = state.seq;
      return;
    }
    lastSeq.current = state.seq;
    if (soundRef.current)
      playSound(state.effect?.id === state.seq ? state.effect.kind : "card");
  }, [state.seq, state.effect]);
  useEffect(() => {
    const event = stateRef.current.effect;
    const begin = setTimeout(
      () => setBurst(event ? { kind: event.kind, text: event.text } : null),
      0,
    );
    const finish = setTimeout(
      () => setBurst(null),
      event?.kind === "win" ? 2500 : 1400,
    );
    return () => {
      clearTimeout(begin);
      clearTimeout(finish);
    };
  }, [state.effect?.id]);
  const send = useCallback(
    (action: string, data: Record<string, unknown> = {}, sender = pid) => {
      const current = stateRef.current;
      const post: Post = {
        pid: sender,
        id: `${sender}-${Date.now().toString(36)}-${counter.current++}`,
        action,
        payload: JSON.stringify(data),
      };
      const result = applyPost(current, post, catalog);
      if (result.error) {
        if (sender !== "bot") toast.error(result.error);
        return false;
      }
      if (mode === "online") {
        if (connection !== "connected" || !network.current) {
          toast.error("Wait for the table to reconnect.");
          return false;
        }
        network.current.post(post);
      } else {
        stateRef.current = result.state;
        setState(result.state);
      }
      return true;
    },
    [pid, catalog, mode, connection],
  );
  useEffect(() => {
    if (mode !== "practice") return;
    const action = botAction(state, catalog);
    if (!action) return;
    const id = setTimeout(() => send(action.action, action.data, "bot"), 1100);
    return () => clearTimeout(id);
  }, [state, catalog, mode, send]);
  const closeNetwork = () => {
    networkGeneration.current++;
    network.current?.close();
    network.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setConnection("offline");
  };
  const startPractice = (deck = activeDeck) => {
    const error = deckError(deck.cards, catalog);
    if (error) {
      toast.error(error);
      return;
    }
    closeNetwork();
    // eslint-disable-next-line react-hooks/purity -- This runs only in the New match click handler.
    const next = makePractice(catalog, deck, `practice-${Date.now()}`);
    setMode("practice");
    setPid("you");
    stateRef.current = next;
    lastSeq.current = next.seq;
    setState(next);
    setSelection(null);
    setScreen("table");
    setDialog(null);
    setRoom("");
    window.history.replaceState({}, "", window.location.pathname);
    toast.success("A new practice match is ready.");
  };
  const openRoom = async (create: boolean) => {
    if (!loaded) {
      toast.error("Wait for the complete card catalog to load.");
      return;
    }
    const code = create
      ? Array.from(
          crypto.getRandomValues(new Uint8Array(6)),
          (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32],
        ).join("")
      : roomInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,12}$/.test(code)) {
      toast.error("Enter a 6–12 character room code.");
      return;
    }
    const err = deckError(activeDeck.cards, catalog);
    if (err) {
      toast.error(err);
      return;
    }
    closeNetwork();
    const generation = networkGeneration.current;
    setConnection("connecting");
    setRoom(code);
    setMode("online");
    setScreen("table");
    setSelection(null);
    let identity: string;
    try {
      identity =
        sessionStorage.getItem(`poketable-player-${code}`) ||
        crypto.randomUUID();
      sessionStorage.setItem(`poketable-player-${code}`, identity);
    } catch {
      identity = crypto.randomUUID();
    }
    setPid(identity);
    const empty = initialState(code);
    stateRef.current = empty;
    lastSeq.current = 0;
    setState(empty);
    window.history.replaceState({}, "", `?room=${code}`);
    try {
      const { connectTable } = await import("@/lib/network");
      if (generation !== networkGeneration.current) return;
      const game = connectTable(code, catalog);
      network.current = game;
      let synced = false;
      let joined = false;
      // eslint-disable-next-line react-hooks/purity -- Connection timing starts in the Create or Join click handler.
      const began = Date.now();
      game.on_sync(() => {
        if (generation !== networkGeneration.current) return;
        synced = true;
        setConnection("connected");
      });
      timer.current = setInterval(() => {
        if (generation !== networkGeneration.current) return;
        try {
          const health = game.client_api.debug_dump?.() as
            | { ws_ready_state?: number; pending_post_count?: number }
            | undefined;
          if (synced)
            setConnection(
              health?.ws_ready_state === 1 ? "connected" : "connecting",
            );
          const next = game.compute_render_state();
          setPing(Math.round(game.ping()));
          if (next !== stateRef.current) {
            stateRef.current = next;
            setState(next);
          }
          if (synced && !joined) {
            game.post({
              pid: identity,
              id: `join-${identity}`,
              action: "join",
              payload: JSON.stringify({
                name: name.trim() || "Trainer",
                deckName: activeDeck.name,
                cards: activeDeck.cards,
              }),
            });
            joined = true;
            setDialog(null);
          }
          if (
            synced &&
            next.players.length === 2 &&
            !next.players.some((p) => p.id === identity)
          ) {
            setConnection("error");
            setDialog("room");
            toast.error("This table is full. Create a new room.");
            if (timer.current) clearInterval(timer.current);
            game.close();
          }
          if (!synced && Date.now() - began > 15000) {
            setConnection("error");
            setDialog("room");
            if (timer.current) clearInterval(timer.current);
            game.close();
          }
        } catch {
          setConnection("error");
        }
      }, 250);
    } catch {
      setConnection("error");
      toast.error("Could not connect to the table. Try again.");
    }
  };
  const inspect = (s: Selection) => {
    setSelection(s);
    setTarget("");
    setAttackAmount("0");
    setDetailTab("card");
    setInspectorOpen(true);
    if (sound) playSound("card");
  };
  const playSelected = () => {
    if (!selection?.uid || !selectedCard) return;
    let dest = target || me?.active?.uid;
    const c = selectedCard;
    if (c.name === "Switch") dest = target || me?.bench[0]?.uid;
    if (c.evolvesFrom)
      dest =
        target ||
        (me ? allPieces(me) : []).find(
          (p) => catalog[p.card].name === c.evolvesFrom,
        )?.uid;
    if (send("play", { uid: selection.uid, target: dest })) {
      if (c.supertype === "Energy" || c.supertype === "Trainer") {
        setSelection(null);
        setInspectorOpen(false);
      }
    }
  };
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}?room=${room}`,
      );
      toast.success("Invite link copied. Send it to your friend.");
    } catch {
      toast.info(`Room code: ${room}`);
    }
  };
  const cards = useMemo(
    () =>
      Object.values(catalog).sort((a, b) =>
        compareCardRelease(a, b, releaseOrder),
      ),
    [catalog, releaseOrder],
  );
  const sets = useMemo(
    () =>
      Array.from(
        new Map(
          cards.map((c) => [c.setId, { value: c.setId, label: c.set }]),
        ).values(),
      ),
    [cards],
  );
  const filtered = useMemo(() => {
    const q = query.toLocaleLowerCase().trim();
    return cards.filter(
      (c) =>
        (!q ||
          `${c.name} ${c.set} ${c.id} ${c.rarity}`
            .toLocaleLowerCase()
            .includes(q)) &&
        (typeFilter === "all" ||
          c.types.includes(typeFilter) ||
          c.supertype === typeFilter) &&
        (setFilter === "all" || c.setId === setFilter),
    );
  }, [cards, query, typeFilter, setFilter]);
  const editCard = (id: string, delta: number) => {
    if (!editing) return;
    const next = { ...editing, cards: [...editing.cards] };
    if (delta > 0) {
      if (next.cards.length >= 60) {
        toast.error(
          "Your deck already has 60 cards. Remove a card to add another.",
        );
        return;
      }
      const c = catalog[id];
      const same = next.cards.filter(
        (cid) => catalog[cid]?.name === c.name,
      ).length;
      if (
        same >= 4 &&
        !(c.supertype === "Energy" && c.subtypes.includes("Basic"))
      ) {
        toast.error(`A maximum of 4 ${c.name} cards.`);
        return;
      }
      next.cards.push(id);
    } else {
      const i = next.cards.lastIndexOf(id);
      if (i >= 0) next.cards.splice(i, 1);
    }
    setEditing(next);
  };
  const saveDeck = () => {
    if (!editing) return;
    const err = deckError(editing.cards, catalog);
    if (err) {
      toast.error(err);
      return;
    }
    if (!editing.name.trim()) {
      toast.error("Give your deck a name.");
      return;
    }
    const d = {
      ...editing,
      name: editing.name.trim(),
      cover:
        editing.cards.find((id) => catalog[id].supertype === "Pokémon") ||
        editing.cards[0],
    };
    setCustomDecks((old) => [...old.filter((x) => x.id !== d.id), d]);
    setSelectedDeck(d.id);
    setEditing(null);
    setScreen("decks");
    toast.success("Deck saved on this device.");
  };
  const exportDeck = (deck: Deck) => {
    const blob = new Blob([JSON.stringify(deck, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.name.replace(/[^a-z0-9]/gi, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importDeck = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.cards))
        throw Error("Choose a PokéTable deck JSON file.");
      const err = deckError(data.cards, catalog);
      if (err) throw Error(err);
      const deck: Deck = {
        id: `custom-${crypto.randomUUID()}`,
        name: String(data.name || "Imported deck").slice(0, 40),
        description: "Custom deck",
        type: "Colorless",
        cover:
          data.cards.find(
            (id: string) => catalog[id].supertype === "Pokémon",
          ) || data.cards[0],
        cards: data.cards,
      };
      setCustomDecks((d) => [...d, deck]);
      toast.success("Deck imported.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not import deck.");
    }
  };
  const tablePiece = (
    p: Piece | undefined,
    owner: Player | undefined,
    zone: "active" | "bench",
    i = 0,
  ) => {
    const c = p ? catalog[p.card] : undefined;
    const own = owner?.id === pid;
    const selected = selection?.uid === p?.uid && !!p;
    return (
      <div
        className={`table-slot ${zone} ${p ? "occupied" : ""} ${selected ? "selected" : ""}`}
        key={p?.uid || i}
        onDragOver={(e) => {
          if (own) e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!own) return;
          const uid = e.dataTransfer.getData("text/plain");
          if (uid) send("play", { uid, target: p?.uid || me?.active?.uid });
        }}
      >
        {p && c ? (
          <>
            <button
              className="table-card"
              aria-label={`Inspect ${owner?.name}'s ${c.name}, ${Math.max(0, c.hp - p.damage)} HP`}
              onClick={() =>
                inspect({ card: p.card, uid: p.uid, owner: owner?.id, zone })
              }
            >
              <CardImage card={c} small={zone === "bench"} />
              {p.damage > 0 && (
                <span className="damage-counter">{p.damage}</span>
              )}
              {p.conditions.length > 0 && (
                <span className="condition-chip">
                  {p.conditions.join(" · ")}
                </span>
              )}
            </button>
            <div className="attached-energy">
              {providedEnergy(p, catalog)
                .slice(0, 6)
                .map((type, j) => (
                  <Energy key={j} type={type} size={16} />
                ))}
              {providedEnergy(p, catalog).length > 6 && (
                <span>+{providedEnergy(p, catalog).length - 6}</span>
              )}
            </div>
            {zone === "active" && (
              <div className="pokemon-health">
                <span>{c.name}</span>
                <strong>
                  {Math.max(0, c.hp - p.damage)}
                  <small> / {c.hp}</small>
                </strong>
                <div className="hp-track">
                  <i
                    style={{
                      width: `${Math.max(0, (c.hp - p.damage) / c.hp) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            className="empty-slot"
            aria-label={
              zone === "active"
                ? "Active Pokémon slot"
                : `Empty Bench slot ${i + 1}`
            }
            onClick={() => {
              if (own && selection?.zone === "hand") playSelected();
              else if (own)
                toast.info(
                  zone === "active"
                    ? "Choose a Basic Pokémon from your hand."
                    : "Select a Basic Pokémon from your hand to Bench it.",
                );
            }}
          >
            {zone === "active" ? (
              <Target size={28} strokeWidth={1} />
            ) : (
              <Plus size={19} strokeWidth={1} />
            )}
          </button>
        )}
      </div>
    );
  };
  const renderPrizes = (p: Player | undefined) => (
    <div
      className="prize-area"
      role="group"
      aria-label={`${p?.id === pid ? "Your" : "Opponent's"} prize cards: ${p?.prizes.length ?? 6} remaining`}
    >
      <div className="prize-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={`prize-mini ${i < (p?.prizes.length ?? 6) ? "" : "taken"}`}
          >
            {i < (p?.prizes.length ?? 6) ? <CardBack /> : <Check size={13} />}
          </div>
        ))}
      </div>
    </div>
  );
  const renderPile = (p: Player | undefined, own: boolean) => (
    <div className="pile-area">
      <button
        className="deck-pile"
        aria-label={own ? "View deck with table tools" : "Opponent deck"}
        onClick={() => {
          if (own) {
            setZone("deck");
            setDialog("tools");
          }
        }}
      >
        <CardBack />
        <span>{p?.deck.length ?? 60}</span>
      </button>
      <span className="pile-caption">DECK</span>
      <button
        className={`discard-pile ${p?.discard.length ? "has-card" : ""}`}
        onClick={() => {
          if (own) {
            setZone("discard");
            setDialog("tools");
          } else if (p?.discard.length)
            inspect({
              card: p.discard.at(-1)!.card,
              zone: "discard",
              owner: p.id,
            });
        }}
        aria-label={`${own ? "Your" : "Opponent's"} discard pile`}
      >
        {p?.discard.length ? (
          <CardImage card={catalog[p.discard.at(-1)!.card]} small />
        ) : (
          <Layers3 size={18} />
        )}
        <span>{p?.discard.length || 0}</span>
      </button>
      <span className="pile-caption">DISCARD</span>
    </div>
  );
  const emptyRoom = mode === "online" && state.players.length < 2;
  const targets = me
    ? allPieces(me).map((p) => ({
        value: p.uid,
        label:
          catalog[p.card].name +
          (p.uid === me.active?.uid ? " · Active" : " · Bench"),
      }))
    : [];
  const inspectorContent = (
    <>
      {state.pending && (
        <p className="effect-waiting" role="status">
          {state.pending.choice.player === pid
            ? "Choose how to resolve this card."
            : `${state.players.find((p) => p.id === state.pending?.choice.player)?.name || "Your opponent"} is choosing for a card effect…`}
        </p>
      )}
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList className="inspector-tabs" variant="line">
          <TabsTrigger value="card">
            <Eye size={15} />
            Card details
          </TabsTrigger>
          <TabsTrigger value="log">
            <BookOpen size={15} />
            Match log
            <span className="log-count">{state.log.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="card">
          {selectedCard ? (
            <div className="card-detail">
              <div className="detail-overline">
                <span>
                  {selection?.zone === "hand"
                    ? "IN YOUR HAND"
                    : selection?.zone === "active"
                      ? "ACTIVE POKÉMON"
                      : selection?.zone === "bench"
                        ? "BENCHED POKÉMON"
                        : "CARD DETAILS"}
                </span>
                <button
                  className="icon-button"
                  onClick={() => {
                    setSelection(null);
                    setInspectorOpen(false);
                  }}
                  aria-label="Clear card selection"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="detail-image">
                <CardImage card={selectedCard} />
                <span className="detail-image-glow" />
              </div>
              <div className="detail-title">
                <h2>{selectedCard.name}</h2>
                {selectedCard.types[0] && (
                  <Energy type={selectedCard.types[0]} size={23} />
                )}
              </div>
              <div className="detail-subtitle">
                {selectedCard.subtypes.join(" · ") || selectedCard.supertype}
                <span>
                  {selectedCard.hp
                    ? `${selectedCard.hp} HP`
                    : selectedCard.supertype}
                </span>
              </div>
              {selectedPiece && (
                <div className="piece-stats">
                  <span>
                    Remaining HP
                    <strong>
                      {Math.max(0, selectedCard.hp - selectedPiece.damage)}
                      <small> / {selectedCard.hp}</small>
                    </strong>
                  </span>
                  <span>
                    Attached Energy
                    <strong>
                      {selectedPiece.energy.length}
                      <Zap size={14} />
                    </strong>
                  </span>
                </div>
              )}
              {selectedPiece && (
                <div className="active-card-effects">
                  {pieceEffectLabels(selectedPiece, state.turn, catalog).map(
                    (label, i) => (
                      <span key={`${label}-${i}`}>{label}</span>
                    ),
                  )}
                  {selectedPiece.energyTypes &&
                    Object.keys(selectedPiece.energyTypes).map((index) => (
                      <span key={`buzzap-${index}`}>
                        Electrode ·{" "}
                        {attachmentEnergy(
                          selectedPiece,
                          Number(index),
                          catalog,
                        ).join(" + ")}
                      </span>
                    ))}
                </div>
              )}
              {selectedCard.abilities.map((a, i) => (
                <div className="ability" key={i}>
                  <small>{a.type}</small>
                  <strong>{a.name}</strong>
                  <p>{a.text}</p>
                  {selectedPiece &&
                    selection?.owner === pid &&
                    BASE_POWERS[selectedCard.id]?.use && (
                      <button
                        className="button primary full-width"
                        disabled={!myTurn || !powerAvailable(selectedPiece)}
                        onClick={() => {
                          if (send("power", { uid: selectedPiece.uid }))
                            setInspectorOpen(false);
                        }}
                      >
                        <Sparkles size={15} /> Use {a.name}
                      </button>
                    )}
                  {BASE_POWERS[selectedCard.id]?.passive && (
                    <small>
                      Triggers automatically when this Pokémon is damaged by an
                      opponent’s attack.
                    </small>
                  )}
                </div>
              ))}
              {selectedCard.attacks.map((a, i) => {
                const attacking =
                  selection?.zone === "active" && selection.owner === pid;
                const payable =
                  !!selectedPiece && canPay(selectedPiece, a, catalog);
                const disabledByEffect =
                  selectedPiece?.usedAttacks?.includes(a.name) ||
                  (selectedPiece?.effects?.amnesia?.name === a.name &&
                    selectedPiece.effects.amnesia.until >= state.turn);
                return (
                  <div className="attack-detail" key={i}>
                    <div className="attack-top">
                      <span className="attack-energy">
                        {a.cost.map((t, j) => (
                          <Energy type={t} size={15} key={j} />
                        ))}
                      </span>
                      <strong>{a.damage || "—"}</strong>
                    </div>
                    <h3>{a.name}</h3>
                    {a.text && <p>{a.text}</p>}
                    {attacking && (
                      <>
                        {!automaticAttack(selectedCard, a) && (
                          <label className="manual-damage">
                            Damage before weakness
                            <input
                              type="number"
                              min="0"
                              max="9990"
                              step="10"
                              value={attackAmount}
                              onChange={(e) => setAttackAmount(e.target.value)}
                            />
                          </label>
                        )}
                        <button
                          className="attack-button"
                          disabled={
                            !myTurn ||
                            !payable ||
                            !!disabledByEffect ||
                            state.turn === 1 ||
                            selectedPiece?.conditions.some((c) =>
                              ["Asleep", "Paralyzed"].includes(c),
                            )
                          }
                          onClick={() => {
                            if (
                              send("attack", {
                                index: i,
                                damage: Number(attackAmount),
                              })
                            )
                              setInspectorOpen(false);
                          }}
                        >
                          <Swords size={14} />
                          {!myTurn
                            ? "Wait for your turn"
                            : !payable
                              ? "More Energy needed"
                              : disabledByEffect
                                ? "This attack is unavailable"
                                : `Use ${a.name}`}
                          <ArrowUpRight size={14} />
                        </button>
                        {!automaticAttack(selectedCard, a) && (
                          <small className="manual-note">
                            Resolve printed effects with table tools before
                            attacking.
                          </small>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {selectedCard.rules.length > 0 && (
                <div className="card-rules">
                  {selectedCard.rules.map((r, i) => (
                    <p key={i}>{r}</p>
                  ))}
                </div>
              )}
              {selectedPiece?.card === "base1-70" &&
                selection?.owner === pid && (
                  <button
                    className="button full-width"
                    disabled={!myTurn}
                    onClick={() =>
                      send("discardDoll", { uid: selectedPiece.uid })
                    }
                  >
                    <Trash2 size={15} /> Discard Clefairy Doll
                  </button>
                )}
              {selection?.zone === "hand" && (
                <div className="play-action">
                  {(selectedCard.supertype === "Energy" ||
                    selectedCard.evolvesFrom ||
                    selectedCard.name === "Switch" ||
                    selectedCard.subtypes.includes("Pokémon Tool")) &&
                    targets.length > 0 && (
                      <Choice
                        value={
                          target ||
                          (selectedCard.name === "Switch"
                            ? me?.bench[0]?.uid
                            : selectedCard.evolvesFrom
                              ? (me ? allPieces(me) : []).find(
                                  (p) =>
                                    catalog[p.card].name ===
                                    selectedCard.evolvesFrom,
                                )?.uid
                              : me?.active?.uid) ||
                          ""
                        }
                        onChange={setTarget}
                        label="Target Pokémon"
                        options={
                          selectedCard.name === "Switch"
                            ? targets.filter((t) => t.value !== me?.active?.uid)
                            : targets
                        }
                      />
                    )}
                  <button
                    className="button primary full-width"
                    disabled={!canAct}
                    onClick={playSelected}
                  >
                    {selectedCard.supertype === "Energy" ? (
                      <Zap size={16} />
                    ) : (
                      <Plus size={16} />
                    )}{" "}
                    {selectedCard.supertype === "Energy"
                      ? "Attach Energy"
                      : selectedCard.evolvesFrom
                        ? "Evolve Pokémon"
                        : selectedCard.supertype === "Trainer"
                          ? "Play Trainer"
                          : !me?.active
                            ? "Make Active"
                            : "Add to Bench"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {selection?.zone === "bench" && selection.owner === pid && (
                <button
                  className="button primary full-width"
                  disabled={!!me?.active && !myTurn}
                  onClick={() => {
                    send(me?.active ? "retreat" : "promote", {
                      uid: selection.uid,
                    });
                    setInspectorOpen(false);
                  }}
                >
                  <RotateCcw size={15} />
                  {me?.active
                    ? `Retreat Active · ${catalog[me.active.card].retreat} Energy`
                    : "Promote to Active"}
                </button>
              )}
              {selectedCard.supertype === "Pokémon" && (
                <div className="card-traits">
                  <span>
                    Weakness
                    <b>
                      {selectedCard.weaknesses.map((w) => (
                        <span key={w.type}>
                          <Energy type={w.type} size={14} />
                          {w.value}
                        </span>
                      )) || "—"}
                    </b>
                  </span>
                  <span>
                    Resistance
                    <b>
                      {selectedCard.resistances.length
                        ? selectedCard.resistances.map((r) => r.value).join(" ")
                        : "—"}
                    </b>
                  </span>
                  <span>
                    Retreat
                    <b>
                      {selectedCard.retreat}
                      <Sparkles size={13} />
                    </b>
                  </span>
                </div>
              )}
              <div className="card-provenance">
                <span>{selectedCard.set}</span>
                <b>
                  {selectedCard.number} ·{" "}
                  {selectedCard.rarity || selectedCard.supertype}
                </b>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <Layers3 size={36} strokeWidth={1} />
              <h2>A closer look.</h2>
              <p>
                Select a card on the table or in your hand to see its attacks
                and available moves.
              </p>
              <div className="mini-tip">
                <Sparkles size={20} />
                <span>Try attaching an Energy to your Active Pokémon.</span>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="log">
          <div className="match-log">
            <div className="log-heading">
              <h2>Every move matters.</h2>
              <span>{state.log.length} table events</span>
            </div>
            {[...state.log].reverse().map((l, i) => (
              <div className={`log-entry ${l.kind}`} key={`${l.id}-${i}`}>
                <span className="log-icon">
                  {l.kind === "attack" ? (
                    <Swords size={15} />
                  ) : l.kind === "turn" ? (
                    <RotateCcw size={15} />
                  ) : l.kind === "win" ? (
                    <Trophy size={15} />
                  ) : l.kind === "coin" ? (
                    <CircleDot size={15} />
                  ) : (
                    <Layers3 size={15} />
                  )}
                </span>
                <p>{l.text}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <div className="inspector-bottom">
        <span>
          <CircleHelp size={17} />
          <b>Find your next move.</b>
        </span>
        <p>Take your time. Inspect your cards. Find your next great move.</p>
        <button onClick={() => setDialog("help")}>
          The table guide <ArrowUpRight size={14} />
        </button>
      </div>
    </>
  );
  const navigateTo = (next: typeof screen) => {
    if (next === "cards") setEditing(null);
    setScreen(next);
    setNavigationOpen(false);
    workspaceRef.current?.focus({ preventScroll: true });
  };
  return (
    <div className={`app-shell ${screen === "table" ? "is-playing" : ""}`}>
      <div
        className={`navigation-reveal ${navigationOpen ? "is-open" : ""}`}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") return;
          setNavigationOpen(false);
          const focused = document.activeElement;
          if (
            focused &&
            event.currentTarget.contains(focused) &&
            !focused.matches(":focus-visible")
          ) {
            workspaceRef.current?.focus({ preventScroll: true });
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setNavigationOpen(false);
            workspaceRef.current?.focus({ preventScroll: true });
          }
        }}
      >
        <button
          className="navigation-handle"
          aria-label={navigationOpen ? "Hide navigation" : "Show navigation"}
          aria-expanded={navigationOpen}
          aria-controls="top-navigation"
          onClick={() => {
            setNavigationOpen(!navigationOpen);
            workspaceRef.current?.focus({ preventScroll: true });
          }}
        >
          <span aria-hidden="true" />
        </button>
        <header className="app-header" id="top-navigation">
          <nav className="main-nav" aria-label="Main navigation">
            <button
              className={screen === "table" ? "current" : ""}
              aria-current={screen === "table" ? "page" : undefined}
              onClick={() => navigateTo("table")}
            >
              <Swords size={17} />
              Play
            </button>
            <button
              className={screen === "decks" ? "current" : ""}
              aria-current={screen === "decks" ? "page" : undefined}
              onClick={() => navigateTo("decks")}
            >
              <Layers3 size={17} />
              My decks
            </button>
            <button
              className={screen === "cards" ? "current" : ""}
              aria-current={screen === "cards" ? "page" : undefined}
              onClick={() => navigateTo("cards")}
            >
              <LibraryBig size={17} />
              Card library
            </button>
          </nav>
          <div className="header-end">
            <ThemeToggle />
            <button
              className="icon-button sound-toggle"
              aria-label={sound ? "Mute sounds" : "Enable sounds"}
              onClick={() => setSound(!sound)}
            >
              {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <button
              className="avatar"
              onClick={() => setDialog("room")}
              aria-label="Trainer profile"
            >
              {name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
      </div>
      <main
        ref={workspaceRef}
        tabIndex={-1}
        onPointerDown={() => setNavigationOpen(false)}
        className={`workspace ${screen !== "table" ? "library-workspace" : ""}`}
      >
        {screen === "table" ? (
          <>
            <section className="play-surface">
              <div className="page-heading">
                {mode === "online" && (
                  <div className="title-line">
                    <span className="soft-badge">
                      <span
                        className={`live-dot ${connection !== "connected" ? "pending" : ""}`}
                      />
                      {connection === "connected"
                        ? `ROOM ${room}`
                        : connection === "connecting"
                          ? "CONNECTING…"
                          : "OFFLINE"}
                    </span>
                  </div>
                )}
                <div className="table-heading-actions">
                  <button
                    className="text-button"
                    onClick={() => setDialog("new")}
                  >
                    <RotateCcw size={15} />
                    New match
                  </button>
                  <button
                    className="button invite-button"
                    onClick={() =>
                      mode === "online" && room
                        ? copyInvite()
                        : setDialog("room")
                    }
                  >
                    <Users size={16} />
                    {mode === "online" ? "Invite friend" : "Play with a friend"}
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
              <div
                className={`game-table ${myTurn ? "your-turn" : ""} ${burst?.kind === "attack" ? "impact" : ""}`}
              >
                <div className="felt-topline">
                  <div className="trainer-profile">
                    <span className="trainer-avatar opponent-avatar">
                      {opponent?.name.slice(0, 1) || "?"}
                    </span>
                    <span>
                      <strong>
                        {opponent?.name || "Waiting for a friend"}
                      </strong>
                      <small>
                        {mode === "practice"
                          ? "Practice partner"
                          : opponent?.deckName || "Your seat is reserved"}
                      </small>
                    </span>
                    {mode === "practice" && (
                      <span className="bot-tag">BOT</span>
                    )}
                  </div>
                  <div
                    className="opponent-hand"
                    aria-label={`${opponent?.hand.length || 0} cards in opponent's hand`}
                  >
                    {Array.from(
                      { length: Math.min(opponent?.hand.length || 0, 7) },
                      (_, i) => (
                        <CardBack key={i} />
                      ),
                    )}
                    <span>
                      <Hand size={13} />
                      {opponent?.hand.length || 0}
                    </span>
                  </div>
                </div>
                <div className="board-half opponent-half">
                  {renderPrizes(opponent)}
                  <div className="pokemon-zone">
                    <div
                      className="bench-line"
                      role="group"
                      aria-label="Opponent's Bench"
                    >
                      {Array.from({ length: 5 }, (_, i) =>
                        tablePiece(opponent?.bench[i], opponent, "bench", i),
                      )}
                    </div>
                    <div className="active-line">
                      {tablePiece(
                        opponent?.active || undefined,
                        opponent,
                        "active",
                      )}
                      <span className="active-label">ACTIVE</span>
                    </div>
                  </div>
                  {renderPile(opponent, false)}
                </div>
                <div className="table-divider">
                  <span />
                  {state.stadium && (
                    <button
                      className="stadium-chip"
                      aria-label={`Inspect Stadium ${catalog[state.stadium.card].name}`}
                      onClick={() =>
                        inspect({ card: state.stadium!.card, zone: "catalog" })
                      }
                    >
                      <CardImage card={catalog[state.stadium.card]} small />
                      <span>{catalog[state.stadium.card].name}</span>
                    </button>
                  )}
                  <div className="turn-token" aria-hidden="true">
                    <CircleDot size={20} />
                  </div>
                  <span />
                </div>
                <div className="board-half your-half">
                  {renderPrizes(me)}
                  <div className="pokemon-zone">
                    <div className="active-line">
                      {tablePiece(me?.active || undefined, me, "active")}
                      <span className="active-label">ACTIVE</span>
                    </div>
                    <div
                      className="bench-line"
                      role="group"
                      aria-label={`Your Bench: ${me?.bench.length || 0} of 5 Pokémon`}
                    >
                      {Array.from({ length: 5 }, (_, i) =>
                        tablePiece(me?.bench[i], me, "bench", i),
                      )}
                    </div>
                  </div>
                  {renderPile(me, true)}
                </div>
                <div className="felt-bottomline">
                  <div className="trainer-profile">
                    <span className="trainer-avatar your-avatar">
                      {mode === "practice"
                        ? "Y"
                        : name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <strong>
                        {me?.name || name}{" "}
                        <small className="you-label">YOU</small>
                      </strong>
                      <small>{me?.deckName || activeDeck.name}</small>
                    </span>
                  </div>
                  <div className="turn-actions">
                    {state.status === "finished" ? (
                      <button
                        className="end-turn"
                        onClick={() => setDialog("new")}
                      >
                        <Trophy size={16} />
                        Play again
                      </button>
                    ) : state.status === "setup" ? (
                      <button
                        className="end-turn"
                        disabled={!me?.active || me?.ready}
                        onClick={() => send("ready")}
                      >
                        <Check size={17} />
                        {me?.ready ? "Waiting for opponent" : "Ready to play"}
                      </button>
                    ) : (
                      <>
                        <span
                          className={`turn-status ${myTurn ? "active-turn" : ""}`}
                        >
                          {emptyRoom
                            ? "Waiting for a friend"
                            : myTurn
                              ? "Your turn"
                              : "Opponent's turn"}
                        </span>
                        <button
                          className="end-turn"
                          disabled={!myTurn}
                          onClick={() => send("end")}
                        >
                          End turn
                          <ArrowRight size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <section className="hand-panel" aria-label="Your hand">
                  <div className="hand-toolbar">
                    <span>
                      <Hand size={16} />
                      Your hand <b>{me?.hand.length || 0}</b>
                    </span>
                    <button
                      onClick={() => {
                        setZone("discard");
                        setDialog("tools");
                      }}
                    >
                      <SlidersHorizontal size={15} />
                      Table tools
                    </button>
                  </div>
                  <div className="hand-cards">
                    {me?.hand.map((h, i) => (
                      <button
                        key={h.uid}
                        className={`hand-card ${selection?.uid === h.uid ? "selected" : ""} ${isBasic(catalog[h.card]) ? "basic-card" : ""}`}
                        style={
                          {
                            "--card-index": i,
                            "--card-angle": `${(i - (me.hand.length - 1) / 2) * 1.4}deg`,
                          } as CSSProperties
                        }
                        onClick={() =>
                          inspect({
                            card: h.card,
                            uid: h.uid,
                            owner: pid,
                            zone: "hand",
                          })
                        }
                        draggable={canAct}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", h.uid);
                          setSelection({
                            card: h.card,
                            uid: h.uid,
                            owner: pid,
                            zone: "hand",
                          });
                        }}
                        aria-label={`Inspect ${catalog[h.card].name} in hand`}
                      >
                        <CardImage card={catalog[h.card]} small />
                        <span className="hand-card-label">
                          {catalog[h.card].name}
                        </span>
                      </button>
                    ))}
                    {!me?.hand.length && (
                      <div className="empty-hand">
                        {emptyRoom
                          ? "Your opening hand will appear when you join."
                          : "No cards in hand."}
                      </div>
                    )}
                  </div>
                  <div className="hand-hint">
                    <span>
                      <span className="keycap">CLICK</span> Inspect a card <i />{" "}
                      <span className="keycap">DRAG</span> Play or attach
                    </span>
                    <span>
                      {myTurn
                        ? me?.energyPlayed
                          ? "Energy attached this turn"
                          : "1 Energy attachment available"
                        : "Make every card count."}
                    </span>
                  </div>
                </section>
                {emptyRoom && (
                  <div className="room-overlay">
                    <div className="room-waiting">
                      <Users size={28} />
                      <h2>A table for two.</h2>
                      <p>Share this room with a friend to start playing.</p>
                      <button className="room-code" onClick={copyInvite}>
                        {room}
                        <Copy size={18} />
                      </button>
                      <span>
                        {connection === "connected"
                          ? "Connected · Waiting for another Trainer"
                          : connection === "error"
                            ? "Connection failed. Open the room menu to retry."
                            : "Connecting…"}
                      </span>
                      <button
                        className="button"
                        onClick={() => setDialog("room")}
                      >
                        Room options
                      </button>
                    </div>
                  </div>
                )}
                {burst && (
                  <div className={`table-burst ${burst.kind}`} role="status">
                    {burst.kind === "coin" ? (
                      <CircleDot size={28} />
                    ) : burst.kind === "knockout" ? (
                      <Swords size={25} />
                    ) : burst.kind === "energy" ? (
                      <Zap size={24} />
                    ) : burst.kind === "win" ? (
                      <Trophy size={32} />
                    ) : (
                      <Sparkles size={22} />
                    )}
                    <strong>{burst.text}</strong>
                  </div>
                )}
                {state.status === "finished" && (
                  <div className="victory-banner">
                    <Trophy size={32} />
                    <h2>
                      {state.winner === "draw"
                        ? "A worthy draw."
                        : state.winner === pid
                          ? "Victory is yours!"
                          : `${state.players.find((p) => p.id === state.winner)?.name} wins!`}
                    </h2>
                    <p>Good game, Trainer.</p>
                    <button
                      className="button primary"
                      onClick={() => setDialog("new")}
                    >
                      Play again
                      <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </div>
              <footer className="table-footer">
                <span>
                  <ShieldCheck size={13} />
                  Casual tabletop · special effects use table tools
                </span>
                <span>
                  {mode === "online" && connection === "connected"
                    ? `${ping} ms · `
                    : ""}
                  Made for the love of the game.
                </span>
              </footer>
            </section>
            <aside className="inspector">{inspectorContent}</aside>
            <Sheet
              open={inspectorOpen && isCompact}
              onOpenChange={setInspectorOpen}
            >
              <SheetContent className="mobile-inspector" side="right">
                <SheetTitle>Card details</SheetTitle>
                <SheetDescription className="sr-only">
                  Inspect a card and choose your next move.
                </SheetDescription>
                {inspectorContent}
              </SheetContent>
            </Sheet>
          </>
        ) : screen === "decks" ? (
          <section className="decks-page collection-ui">
            <div className="collection-heading">
              <div>
                <span className="eyebrow">TRAINER’S PC</span>
                <h1>My decks</h1>
                <p>Pick a ready-to-play deck, or make it your own.</p>
              </div>
              <button
                className="button primary"
                onClick={() => {
                  setEditing({
                    id: `custom-${crypto.randomUUID()}`,
                    name: "My new deck",
                    description: "Custom deck",
                    type: "Colorless",
                    cover: "base1-4",
                    cards: [],
                  });
                  setScreen("cards");
                }}
              >
                <Plus size={18} />
                Build a deck
              </button>
            </div>
            <div className="section-label custom-label">
              <h2>
                Your decks <span>{customDecks.length}</span>
              </h2>
              <label className="text-button import-label">
                <Download size={15} />
                Import deck
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    void importDeck(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {!customDecks.length ? (
              <div className="no-decks">
                <Layers3 size={31} strokeWidth={1.3} />
                <div>
                  <h3>Something only you could build.</h3>
                  <p>
                    Choose from {loaded ? "20,444" : "thousands of"} cards. Your
                    custom decks are saved on this device.
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setEditing({
                      ...STARTERS[0],
                      id: `custom-${crypto.randomUUID()}`,
                      name: "My first deck",
                    });
                    setScreen("cards");
                  }}
                >
                  Customize a starter
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <div className="custom-deck-grid">
                {usableCustomDecks.map((d) => (
                  <div className="custom-deck" key={d.id}>
                    {catalog[d.cover] && (
                      <CardImage card={catalog[d.cover]} small />
                    )}
                    <div>
                      <h3>{d.name}</h3>
                      <p>{d.cards.length} cards · Saved on this device</p>
                      <div className="custom-deck-buttons">
                        <button
                          className="text-button"
                          onClick={() => {
                            setSelectedDeck(d.id);
                            toast.success("Deck selected");
                          }}
                        >
                          {selectedDeck === d.id ? "✓ Selected" : "Select"}
                        </button>
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditing({ ...d, cards: [...d.cards] });
                            setScreen("cards");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Export ${d.name}`}
                          onClick={() => exportDeck(d)}
                        >
                          <Download size={15} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${d.name}`}
                          onClick={() => {
                            setCustomDecks((old) =>
                              old.filter((x) => x.id !== d.id),
                            );
                            toast("Deck removed", {
                              action: {
                                label: "Undo",
                                onClick: () =>
                                  setCustomDecks((old) => [...old, d]),
                              },
                            });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="section-label starter-decks-label">
              <h2>Ready to play</h2>
              <span>60 cards · unlimited format</span>
            </div>
            <div className="deck-grid starter-deck-grid">
              {STARTERS.map((d) => (
                <div
                  className={`deck-card deck-${d.type.toLowerCase()} ${selectedDeck === d.id ? "chosen" : ""}`}
                  key={d.id}
                >
                  <div className="deck-art">
                    <div className="deck-type">
                      <Energy type={d.type} size={25} />
                      <span>{d.type} deck</span>
                    </div>
                    <CardImage card={catalog[d.cover]} />
                    <span className="deck-art-word">
                      {d.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="deck-info">
                    <h3>{d.name}</h3>
                    <p>{d.description}</p>
                    <div className="deck-counts">
                      <span>
                        <Layers3 size={14} />
                        60 cards
                      </span>
                      <span>Classic collection</span>
                    </div>
                    <div className="deck-buttons">
                      <button
                        className={`button ${selectedDeck === d.id ? "selected-button" : "primary"}`}
                        onClick={() => {
                          setSelectedDeck(d.id);
                          toast.success(
                            `${d.name} selected for your next match.`,
                          );
                        }}
                      >
                        {selectedDeck === d.id ? (
                          <Check size={16} />
                        ) : (
                          <Swords size={16} />
                        )}{" "}
                        {selectedDeck === d.id ? "Selected" : "Select deck"}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Customize ${d.name}`}
                        onClick={() => {
                          setEditing({
                            ...d,
                            id: `custom-${crypto.randomUUID()}`,
                            name: d.name + " remix",
                          });
                          setScreen("cards");
                        }}
                      >
                        <SlidersHorizontal size={19} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="deck-footnote">
              <ShieldCheck size={17} />
              <p>
                Unlimited tabletop play. Different eras may need printed effects
                resolved with table tools.
              </p>
              <button className="button" onClick={() => setDialog("new")}>
                Let’s play
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        ) : (
          <section
            className={`library-page collection-ui ${editing ? "building-deck" : ""}`}
          >
            <div className="collection-heading">
              <div>
                <span className="eyebrow">POKÉMON TCG</span>
                <h1>{editing ? "Deck builder" : "Card library"}</h1>
                <p>
                  {loaded
                    ? "20,444 English cards. 174 sets. Endless possibilities."
                    : catalogError
                      ? "The full catalog could not load. Starter cards are available."
                      : "Loading the complete English collection…"}
                </p>
              </div>
              {editing ? (
                <button
                  className="button"
                  onClick={() => {
                    setEditing(null);
                    setScreen("decks");
                  }}
                >
                  <ChevronLeft size={16} />
                  My decks
                </button>
              ) : (
                <span className="library-count">
                  <LibraryBig size={20} />
                  {loaded ? "20,444 cards" : "Starter collection"}
                </span>
              )}
            </div>
            {catalogError && (
              <button className="button" onClick={fetchCatalog}>
                <RotateCcw size={16} />
                Retry card catalog
              </button>
            )}
            <div className="library-layout">
              <div className="catalog-area">
                <div className="catalog-filters">
                  <label className="search-box">
                    <Search size={19} />
                    <input
                      aria-label="Search all cards"
                      placeholder="Search Pokémon, card name, or set…"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                      }}
                    />
                    {query && (
                      <button
                        aria-label="Clear search"
                        onClick={() => {
                          setQuery("");
                          setPage(0);
                        }}
                      >
                        <X size={17} />
                      </button>
                    )}
                  </label>
                  <Choice
                    collection
                    label="Card type"
                    value={typeFilter}
                    onChange={(v) => {
                      setTypeFilter(v);
                      setPage(0);
                    }}
                    options={[
                      { value: "all", label: "All types" },
                      ...[
                        "Pokémon",
                        "Trainer",
                        "Energy",
                        ...Object.keys(TYPE_COLORS),
                      ].map((t) => ({ value: t, label: t })),
                    ]}
                  />
                  <Choice
                    collection
                    label="Card set"
                    value={setFilter}
                    onChange={(v) => {
                      setSetFilter(v);
                      setPage(0);
                    }}
                    options={[{ value: "all", label: "All sets" }, ...sets]}
                  />
                  <Choice
                    collection
                    label="Release date order"
                    value={releaseOrder}
                    onChange={(value) => {
                      setReleaseOrder(value === "newest" ? "newest" : "oldest");
                      setPage(0);
                    }}
                    options={[
                      { value: "oldest", label: "Oldest first" },
                      { value: "newest", label: "Newest first" },
                    ]}
                  />
                </div>
                <div className="catalog-caption">
                  <span>
                    {filtered.length.toLocaleString()} cards{" "}
                    {query && `matching “${query}”`}
                  </span>
                  <span>
                    Release date ·{" "}
                    {releaseOrder === "newest"
                      ? "Newest first"
                      : "Oldest first"}
                  </span>
                </div>
                <div className="card-grid">
                  {filtered.slice(page * 36, page * 36 + 36).map((c) => (
                    <article className="catalog-card" key={c.id}>
                      <button
                        className="catalog-image"
                        onClick={() => inspect({ card: c.id, zone: "catalog" })}
                      >
                        <CardImage card={c} small />
                      </button>
                      <div className="catalog-card-title">
                        <h3>{c.name}</h3>
                        {c.types[0] && <Energy type={c.types[0]} size={15} />}
                      </div>
                      <p>
                        {c.set} · {c.number}
                      </p>
                      {c.date && (
                        <p>
                          <time dateTime={c.date.replaceAll("/", "-")}>
                            {formatCardRelease(c.date)}
                          </time>
                        </p>
                      )}
                      {editing && (
                        <div className="quantity-buttons">
                          <button
                            aria-label={`Remove ${c.name}`}
                            disabled={!editing.cards.includes(c.id)}
                            onClick={() => editCard(c.id, -1)}
                          >
                            <Minus size={15} />
                          </button>
                          <span>
                            {editing.cards.filter((id) => id === c.id).length ||
                              "Add to deck"}
                          </span>
                          <button
                            aria-label={`Add ${c.name}`}
                            onClick={() => editCard(c.id, 1)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="empty-search">
                    <Search size={32} />
                    <h2>No cards found.</h2>
                    <p>Try another name or choose a different set.</p>
                    <button
                      className="button"
                      onClick={() => {
                        setQuery("");
                        setTypeFilter("all");
                        setSetFilter("all");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}
                <div className="pagination">
                  <button
                    className="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span>
                    Page {page + 1} of{" "}
                    {Math.max(1, Math.ceil(filtered.length / 36))}
                  </span>
                  <button
                    className="button"
                    disabled={(page + 1) * 36 >= filtered.length}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              {editing && (
                <aside className="deck-builder">
                  <span className="eyebrow">YOUR DECK</span>
                  <input
                    className="deck-name-input"
                    value={editing.name}
                    maxLength={40}
                    aria-label="Deck name"
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                  <div className="deck-progress-heading">
                    <span>
                      {editing.cards.length === 60
                        ? "Ready to play"
                        : "Keep building"}
                    </span>
                    <strong>
                      {editing.cards.length}
                      <small> / 60</small>
                    </strong>
                  </div>
                  <div className="deck-progress">
                    <i
                      style={{ width: `${(editing.cards.length / 60) * 100}%` }}
                    />
                  </div>
                  <div className="builder-summary">
                    {["Pokémon", "Trainer", "Energy"].map((t) => (
                      <span key={t}>
                        {t}
                        <b>
                          {
                            editing.cards.filter(
                              (id) => catalog[id]?.supertype === t,
                            ).length
                          }
                        </b>
                      </span>
                    ))}
                  </div>
                  <div className="builder-list">
                    {Array.from(new Set(editing.cards)).map((id) => (
                      <div className="builder-card" key={id}>
                        <button
                          className="builder-thumb"
                          onClick={() => inspect({ card: id, zone: "catalog" })}
                        >
                          <CardImage card={catalog[id]} small />
                        </button>
                        <span>
                          <strong>{catalog[id].name}</strong>
                          <small>{catalog[id].set}</small>
                        </span>
                        <button
                          aria-label={`Remove ${catalog[id].name}`}
                          onClick={() => editCard(id, -1)}
                        >
                          <Minus size={12} />
                        </button>
                        <b>{editing.cards.filter((c) => c === id).length}</b>
                        <button
                          aria-label={`Add ${catalog[id].name}`}
                          onClick={() => editCard(id, 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ))}
                    {!editing.cards.length && (
                      <p className="builder-empty">
                        Choose cards from the library to start building your
                        deck.
                      </p>
                    )}
                  </div>
                  <button
                    className="button primary full-width"
                    onClick={saveDeck}
                    disabled={editing.cards.length !== 60}
                  >
                    <Check size={16} />
                    Save deck
                  </button>
                  <small className="builder-note">
                    60 cards · 4 per card name · Unlimited Basic Energy
                  </small>
                </aside>
              )}
            </div>
            <footer className="catalog-source">
              Complete English snapshot from{" "}
              <a
                href="https://github.com/PokemonTCG/pokemon-tcg-data"
                target="_blank"
                rel="noreferrer"
              >
                Pokémon TCG Data
                <ArrowUpRight size={12} />
              </a>
              . Artwork © Pokémon / Nintendo / Creatures / GAME FREAK.
              Unofficial fan project.
            </footer>
          </section>
        )}
      </main>
      <Dialog
        open={!!dialog && dialog !== "concede"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent
          className={`poketable-dialog ${dialog === "tools" ? "tools-dialog" : ""}`}
        >
          <DialogTitle>
            {dialog === "room"
              ? "Better with a friend."
              : dialog === "help"
                ? "Welcome to the table."
                : dialog === "new"
                  ? "Your next match awaits."
                  : dialog === "concede"
                    ? "Concede this match?"
                    : "Table tools"}
          </DialogTitle>
          <DialogDescription>
            {dialog === "room"
              ? "Choose your deck, open a room, and invite another Trainer."
              : dialog === "help"
                ? "A little guidance, then it’s your move."
                : dialog === "new"
                  ? "Choose a deck and take your seat."
                  : dialog === "concede"
                    ? "Your opponent will win the current match."
                    : "Resolve printed card effects. Every change is recorded in the match log."}
          </DialogDescription>
          {(dialog === "room" || dialog === "new") && (
            <>
              <label className="form-label">
                Trainer name
                <input
                  className="input-field"
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="form-label">
                Your deck
                <Choice
                  value={selectedDeck}
                  onChange={setSelectedDeck}
                  label="Choose deck"
                  options={decks.map((d) => ({
                    value: d.id,
                    label: `${d.name} · ${d.cards.length} cards`,
                  }))}
                />
              </label>
              <div className="chosen-deck-preview">
                <CardImage card={catalog[activeDeck.cover]} small />
                <div>
                  <Energy type={activeDeck.type} size={20} />
                  <h3>{activeDeck.name}</h3>
                  <p>{activeDeck.description}</p>
                </div>
              </div>
              {dialog === "new" ? (
                <>
                  <button
                    className="button primary full-width"
                    onClick={() => startPractice()}
                  >
                    <Swords size={17} />
                    Practice with Misty
                    <ArrowRight size={17} />
                  </button>
                  <button
                    className="button full-width"
                    onClick={() => setDialog("room")}
                  >
                    <Users size={17} />
                    Play with a friend
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="button primary full-width"
                    disabled={!loaded || connection === "connecting"}
                    onClick={() => openRoom(true)}
                  >
                    {connection === "connecting" ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <Plus size={17} />
                    )}
                    Create a room
                  </button>
                  <div className="or-divider">
                    <span />
                    or join a friend’s table
                    <span />
                  </div>
                  <div className="join-row">
                    <input
                      className="input-field room-input"
                      aria-label="Room code"
                      placeholder="ROOM CODE"
                      maxLength={12}
                      value={roomInput}
                      onChange={(e) =>
                        setRoomInput(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, ""),
                        )
                      }
                    />
                    <button
                      className="button"
                      disabled={
                        !loaded ||
                        connection === "connecting" ||
                        roomInput.length < 6
                      }
                      onClick={() => openRoom(false)}
                    >
                      Join
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  {connection === "error" && (
                    <p className="error-text">
                      The multiplayer server did not connect. Retry or play a
                      practice match while it is unavailable.
                    </p>
                  )}
                  {!loaded && (
                    <p className="dialog-note">
                      {catalogError
                        ? "Catalog unavailable. Retry from the Card library to enable rooms."
                        : "Loading the complete card catalog before connecting…"}
                    </p>
                  )}
                  {mode === "online" && room && (
                    <button className="text-button" onClick={copyInvite}>
                      <Copy size={15} />
                      Copy invite for {room}
                    </button>
                  )}
                  <p className="dialog-note">
                    Casual rooms for people you trust. Your friend needs access
                    to this site to open the invite.
                  </p>
                </>
              )}
            </>
          )}
          {dialog === "help" && (
            <div className="guide">
              <div className="guide-step">
                <b>01</b>
                <div>
                  <h3>Make yourself at home.</h3>
                  <p>
                    Practice starts at a ready-to-play table. A fresh match
                    deals 7 cards and sets aside 6 Prizes. Choose an Active
                    Basic Pokémon, fill your Bench, then ready up.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <b>02</b>
                <div>
                  <h3>Build your play.</h3>
                  <p>
                    Click a card to inspect it, or drag it onto your Pokémon.
                    Attach one Energy per turn. Play Basic Pokémon onto your
                    Bench and evolve from your second turn.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <b>03</b>
                <div>
                  <h3>Make your move count.</h3>
                  <p>
                    Select your Active Pokémon to attack. Energy costs,
                    weakness, resistance, Base Set effects, Knock Outs, and
                    Prizes are handled for you. Attacking ends your turn.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <b>04</b>
                <div>
                  <h3>Every era has a seat.</h3>
                  <p>
                    All 20,444 English cards in the bundled catalog are
                    available. All 102 Base Set cards have automated effects;
                    choices appear when a card needs them. For effects from
                    other sets, agree on the printed rules and use Table tools
                    to draw, move cards, flip coins, adjust damage, and apply
                    conditions. This is an assisted casual table, not a complete
                    tournament rules engine.
                  </p>
                </div>
              </div>
              <div className="guide-note">
                <Heart size={19} />
                <p>
                  Take all 6 Prizes, leave your opponent without Pokémon, or
                  have them fail their turn’s draw to win. This unofficial fan
                  project is not affiliated with Pokémon.
                </p>
              </div>
              <a
                className="text-button"
                href="https://www.pokemon.com/us/pokemon-tcg/rules"
                target="_blank"
                rel="noreferrer"
              >
                Official Pokémon TCG rules
                <ArrowUpRight size={15} />
              </a>
            </div>
          )}
          {dialog === "tools" && me && (
            <Tabs defaultValue="actions">
              <TabsList className="tools-tabs">
                <TabsTrigger value="actions">Card effects</TabsTrigger>
                <TabsTrigger value="zones">Card zones</TabsTrigger>
                <TabsTrigger value="match">Match</TabsTrigger>
              </TabsList>
              <TabsContent value="actions">
                <div className="tool-row">
                  <div>
                    <h3>Draw cards</h3>
                    <p>For Trainer and Pokémon effects.</p>
                  </div>
                  <input
                    className="input-field number-input"
                    type="number"
                    min="1"
                    max="20"
                    aria-label="Cards to draw"
                    value={drawCount}
                    onChange={(e) => setDrawCount(e.target.value)}
                  />
                  <button
                    className="button"
                    onClick={() => send("draw", { count: Number(drawCount) })}
                  >
                    <Plus size={15} />
                    Draw
                  </button>
                </div>
                <div className="tool-row">
                  <div>
                    <h3>Flip a coin</h3>
                    <p>
                      {state.coin
                        ? `Last flip: ${state.coin}`
                        : "The result is shared with both Trainers."}
                    </p>
                  </div>
                  <button className="button" onClick={() => send("coin")}>
                    <CircleDot size={16} />
                    Flip
                  </button>
                </div>
                {state.stadium && (
                  <div className="tool-row">
                    <div>
                      <h3>Stadium in play</h3>
                      <p>{catalog[state.stadium.card].name}</p>
                    </div>
                    <button
                      className="button"
                      onClick={() => send("clearStadium")}
                    >
                      <Trash2 size={15} />
                      Discard
                    </button>
                  </div>
                )}
                <div className="tool-target">
                  <label className="form-label">
                    Pokémon to adjust
                    <Choice
                      value={toolTarget}
                      onChange={setToolTarget}
                      label="Choose any Pokémon"
                      options={state.players.flatMap((p) =>
                        allPieces(p).map((c) => ({
                          value: `${p.id}|${c.uid}`,
                          label: `${p.name} · ${catalog[c.card].name}`,
                        })),
                      )}
                    />
                  </label>
                  <div className="damage-tools">
                    <input
                      className="input-field number-input"
                      aria-label="Damage amount"
                      type="number"
                      step="10"
                      min="0"
                      max="9990"
                      value={toolDamage}
                      onChange={(e) => setToolDamage(e.target.value)}
                    />
                    <button
                      className="button"
                      disabled={!toolTarget}
                      onClick={() =>
                        send("adjust", {
                          owner: toolTarget.split("|")[0],
                          uid: toolTarget.split("|")[1],
                          damage: Number(toolDamage),
                        })
                      }
                    >
                      <Plus size={15} />
                      Damage
                    </button>
                    <button
                      className="button"
                      disabled={!toolTarget}
                      onClick={() =>
                        send("adjust", {
                          owner: toolTarget.split("|")[0],
                          uid: toolTarget.split("|")[1],
                          damage: -Number(toolDamage),
                        })
                      }
                    >
                      <Heart size={15} />
                      Heal
                    </button>
                  </div>
                  <div className="condition-tools">
                    {[
                      "Poisoned",
                      "Burned",
                      "Asleep",
                      "Paralyzed",
                      "Confused",
                      "Clear",
                    ].map((c) => (
                      <button
                        className="condition-button"
                        disabled={!toolTarget}
                        key={c}
                        onClick={() => {
                          send("adjust", {
                            owner: toolTarget.split("|")[0],
                            uid: toolTarget.split("|")[1],
                            condition: c,
                          });
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {toolTarget &&
                    (() => {
                      const [owner, uid] = toolTarget.split("|");
                      const q = state.players.find((p) => p.id === owner);
                      const p = q && allPieces(q).find((c) => c.uid === uid);
                      return (
                        p && (
                          <div className="attachment-tools">
                            {p.energy.map((id, i) => (
                              <button
                                className="text-button"
                                key={`e${i}`}
                                onClick={() =>
                                  send("detach", {
                                    owner,
                                    uid,
                                    index: i,
                                    kind: "energy",
                                  })
                                }
                              >
                                <Minus size={13} />
                                {catalog[id].name}
                              </button>
                            ))}
                            {p.tools.map((id, i) => (
                              <button
                                className="text-button"
                                key={`t${i}`}
                                onClick={() =>
                                  send("detach", {
                                    owner,
                                    uid,
                                    index: i,
                                    kind: "tool",
                                  })
                                }
                              >
                                <Minus size={13} />
                                {catalog[id].name}
                              </button>
                            ))}
                            {q?.bench.some((b) => b.uid === uid) && (
                              <button
                                className="button"
                                onClick={() => send("swap", { owner, uid })}
                              >
                                <RotateCcw size={14} />
                                Switch to Active (effect)
                              </button>
                            )}
                          </div>
                        )
                      );
                    })()}
                  <button
                    className="button full-width"
                    onClick={() => send("resolve")}
                  >
                    <Check size={15} />
                    Resolve Knock Outs
                  </button>
                </div>
              </TabsContent>
              <TabsContent value="zones">
                <div className="zone-tools-heading">
                  <Choice
                    value={zone}
                    onChange={(v) => setZone(v as typeof zone)}
                    label="Source zone"
                    options={["discard", "deck", "hand", "prizes"].map((v) => ({
                      value: v,
                      label: `Your ${v} (${me[v as typeof zone].length})`,
                    }))}
                  />
                  <ArrowRight size={17} />
                  <Choice
                    value={moveTo}
                    onChange={setMoveTo}
                    label="Move to"
                    options={["hand", "deck", "discard", "prizes"].map((v) => ({
                      value: v,
                      label: `Move to ${v}`,
                    }))}
                  />
                </div>
                <p className="dialog-note">
                  Only inspect hidden zones when a printed effect allows it.
                  Shuffle after searching your deck.
                </p>
                <div className="zone-card-list">
                  {me[zone].map((c) => (
                    <button
                      key={c.uid}
                      disabled={zone === moveTo}
                      onClick={() =>
                        send("move", { from: zone, to: moveTo, uid: c.uid })
                      }
                    >
                      <CardImage card={catalog[c.card]} small />
                      <span>{catalog[c.card].name}</span>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                  {!me[zone].length && <p>This zone is empty.</p>}
                </div>
                <button
                  className="button full-width"
                  onClick={() => send("shuffle")}
                >
                  <Shuffle size={16} />
                  Shuffle your deck
                </button>
              </TabsContent>
              <TabsContent value="match">
                <div className="tool-row">
                  <div>
                    <h3>
                      {mode === "practice" ? "Practice match" : `Room ${room}`}
                    </h3>
                    <p>
                      {me.deckName} · Turn {state.turn}
                    </p>
                  </div>
                  {mode === "online" && (
                    <button className="button" onClick={copyInvite}>
                      <Copy size={15} />
                      Invite
                    </button>
                  )}
                </div>
                <button
                  className="button danger full-width"
                  onClick={() => setDialog("concede")}
                >
                  <LogOut size={16} />
                  Concede match
                </button>
                <p className="dialog-note">
                  Rooms synchronize through VibiNet. Card identities are
                  concealed in the interface; casual rooms do not provide
                  server-enforced hidden information or anti-cheat protection.
                </p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={screen !== "table" && !!selection && inspectorOpen}
        onOpenChange={(open) => {
          if (!open) setInspectorOpen(false);
        }}
      >
        <DialogContent className="catalog-detail-dialog collection-ui">
          <DialogTitle>{selectedCard?.name}</DialogTitle>
          <DialogDescription>
            {selectedCard?.set} · {selectedCard?.rarity}
          </DialogDescription>
          {selectedCard && (
            <div className="catalog-detail-body">
              <CardImage card={selectedCard} />
              <div>
                <span className="soft-badge">
                  {selectedCard.subtypes.join(" · ") || selectedCard.supertype}
                </span>
                {selectedCard.hp > 0 && <h3>{selectedCard.hp} HP</h3>}
                {selectedCard.abilities.map((a) => (
                  <div className="attack-detail" key={a.name}>
                    <h3>{a.name}</h3>
                    <p>{a.text}</p>
                  </div>
                ))}
                {selectedCard.attacks.map((a) => (
                  <div className="attack-detail" key={a.name}>
                    <div className="attack-top">
                      <span>
                        {a.cost.map((c, i) => (
                          <Energy key={i} type={c} size={17} />
                        ))}
                      </span>
                      <b>{a.damage}</b>
                    </div>
                    <h3>{a.name}</h3>
                    <p>{a.text}</p>
                  </div>
                ))}
                {selectedCard.rules.map((r, i) => (
                  <p className="catalog-rule" key={i}>
                    {r}
                  </p>
                ))}
                {editing && (
                  <button
                    className="button primary full-width"
                    onClick={() => editCard(selectedCard.id, 1)}
                  >
                    <Plus size={16} />
                    Add to deck
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={dialog === "concede"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <AlertDialogContent className="poketable-dialog">
          <AlertDialogTitle>Concede this match?</AlertDialogTitle>
          <AlertDialogDescription>
            Your opponent will win the current match.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep playing</AlertDialogCancel>
            <AlertDialogAction
              className="danger"
              onClick={() => {
                send("concede");
                setDialog(null);
              }}
            >
              Concede match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="bottom-center" richColors closeButton />
      {screen === "table" && !!state.reveals?.length && (
        <RevealedCardsDialog
          key={`${mode}-${room}-${state.reveals.at(-1)!.id}`}
          reveals={state.reveals.filter(
            (r) => r.id === state.reveals!.at(-1)!.id,
          )}
          catalog={catalog}
          renderCard={(card) => <CardImage card={card} small />}
        />
      )}
      {state.pending?.choice.player === pid && (
        <EffectChoiceDialog
          key={`${state.pending.id}-${state.pending.choice.key}`}
          pending={state.pending}
          catalog={catalog}
          renderCard={(card) => <CardImage card={card} small />}
          onChoose={(values) =>
            send("choose", {
              resolution: state.pending!.id,
              choice: state.pending!.choice.key,
              values,
            })
          }
        />
      )}
    </div>
  );
}
