import type {
  Card,
  Catalog,
  GameState,
  Piece,
  Player,
  RuleMark,
} from "../../game-types";
import { isClassicSet } from "./scope";
import { cardProvidesEnergy } from "../base-set/energy";

export const pieces = (p: Player) => [
  ...(p.active ? [p.active] : []),
  ...p.bench,
];
export const board = (s: GameState) => s.players.flatMap(pieces);
export const ownerOf = (s: GameState, p: Piece) =>
  s.players.find((q) => pieces(q).some((v) => v.uid === p.uid))!;
export const awake = (p: Piece) =>
  !p.conditions.some((x) => ["Asleep", "Confused", "Paralyzed"].includes(x));
export function mark(
  s: GameState,
  p: Piece,
  key: string,
): RuleMark | undefined {
  const m = p.marks?.[key];
  if (!m || m.until < s.turn) return;
  if (m.source) {
    const source = board(s).find((q) => q.uid === m.source);
    if (!source || (source.generation || 0) !== (m.generation || 0)) return;
  }
  return m;
}
export function hasPrintedPower(p: Piece, name: string, catalog: Catalog) {
  const c = catalog[p.card];
  return (
    !p.faceDown &&
    isClassicSet(c?.setId || "") &&
    c.abilities.some((a) => a.name === name)
  );
}
export function toxicGas(s: GameState, catalog: Catalog) {
  return (
    (s.powerLockUntil ?? -1) < s.turn &&
    board(s).some(
      (p) =>
        hasPrintedPower(p, "Toxic Gas", catalog) &&
        awake(p) &&
        !mark(s, p, "powerOff"),
    )
  );
}
const unconditional = new Set([
  "Retreat Aid",
  "Step In",
  "Bench Guard",
  "Pollen Defense",
  "Restless Sleep",
  "Photosynthesis",
  "Frenzy",
  "Shock Blast",
  "Gaseous Form",
  "Rebellion",
]);
export function abilityCards(s: GameState, p: Piece, catalog: Catalog): Card[] {
  const own = catalog[p.card];
  if (
    hasPrintedPower(p, "Transform", catalog) &&
    awake(p) &&
    !mark(s, p, "powerOff") &&
    (s.powerLockUntil ?? -1) < s.turn &&
    !toxicGas(s, catalog) &&
    s.players.some((q) => q.active?.uid === p.uid)
  ) {
    const other = s.players.find((q) => q.id !== ownerOf(s, p)?.id)?.active;
    if (
      other &&
      !hasPrintedPower(other, "Transform", catalog) &&
      !other.faceDown
    )
      return [own, catalog[other.card]];
  }
  return [own];
}
export function powerOn(
  s: GameState,
  p: Piece,
  catalog: Catalog,
  name?: string,
) {
  if (
    p.faceDown ||
    (s.powerLockUntil ?? -1) >= s.turn ||
    mark(s, p, "powerOff")
  )
    return false;
  const abilities = abilityCards(s, p, catalog)
    .filter((card) => isClassicSet(card.setId))
    .flatMap((card) => card.abilities);
  const a = name ? abilities.find((a) => a.name === name) : abilities[0];
  if (!a || (a.name !== "Toxic Gas" && toxicGas(s, catalog))) return false;
  return unconditional.has(a.name) || awake(p);
}
export function providers(
  s: GameState,
  catalog: Catalog,
  name: string,
  player?: Player,
) {
  return (player ? pieces(player) : board(s)).filter((p) =>
    powerOn(s, p, catalog, name),
  );
}
export function pokemonCard(s: GameState, p: Piece, catalog: Catalog): Card {
  let c = catalog[p.card];
  if (p.faceDown)
    return {
      ...c,
      name: "Face-down Pokémon",
      supertype: "Pokémon",
      subtypes: ["Basic"],
      hp: 9999,
      attacks: [],
      abilities: [],
      types: [],
      weaknesses: [],
      resistances: [],
      retreat: 0,
    };
  if (
    powerOn(s, p, catalog, "Transform") &&
    s.players.some((q) => q.active?.uid === p.uid)
  ) {
    const other = s.players.find((q) => q.id !== ownerOf(s, p).id)?.active;
    if (
      other &&
      !other.faceDown &&
      !hasPrintedPower(other, "Transform", catalog)
    )
      c = catalog[other.card];
  }
  if (p.shape && powerOn(s, p, catalog, "Shapeshift"))
    c = catalog[p.shape.card];
  return p.shiftedType ? { ...c, types: [p.shiftedType] } : c;
}
export function gaseousForm(s: GameState, p: Piece, catalog: Catalog) {
  return powerOn(s, p, catalog, "Gaseous Form")
    ? 10 *
        p.energy.filter((_, i) =>
          cardProvidesEnergy(p, i, "Psychic", catalog, s),
        ).length
    : 0;
}
export function giantGrowth(s: GameState, p: Piece) {
  return mark(s, p, "giantGrowth") ? 80 : 0;
}
export function maximumHP(s: GameState, p: Piece, catalog: Catalog) {
  return (
    (giantGrowth(s, p) || pokemonCard(s, p, catalog).hp) +
    gaseousForm(s, p, catalog)
  );
}
export function narrowGym(s: GameState) {
  return s.stadium?.card === "gym1-124" ? 4 : 5;
}
export function retreatAid(s: GameState, p: Player, catalog: Catalog) {
  return providers(s, catalog, "Retreat Aid", p).filter((q) =>
    p.bench.includes(q),
  ).length;
}
export function stickyGoo(s: GameState, p: Player, catalog: Catalog) {
  const other = s.players.find((q) => q.id !== p.id)?.active;
  return other && powerOn(s, other, catalog, "Sticky Goo") ? 2 : 0;
}
export function retreatCost(s: GameState, p: Player, catalog: Catalog) {
  if (!p.active) return 0;
  const c = pokemonCard(s, p.active, catalog);
  return Math.max(
    0,
    c.retreat -
      retreatAid(s, p, catalog) +
      stickyGoo(s, p, catalog) +
      (s.stadium?.card === "gym1-104" ? 1 : 0) -
      (s.stadium?.card === "gym1-108" && c.name.includes("Misty") ? 1 : 0),
  );
}
export function switchingBlocked(s: GameState, p: Player) {
  return !!p.active && !!mark(s, p.active, "jawClamp");
}
export function evolutionBlocked(s: GameState, catalog: Catalog) {
  return providers(s, catalog, "Prehistoric Power").length > 0;
}
export function trainerBlocked(s: GameState, p: Player, catalog: Catalog) {
  return (
    (p.rules?.noTrainerUntil ?? -1) >= s.turn ||
    providers(s, catalog, "Hay Fever").length > 0
  );
}
export function clairvoyance(s: GameState, p: Player, catalog: Catalog) {
  return s.players.some(
    (q) => q.id !== p.id && providers(s, catalog, "Clairvoyance", q).length > 0,
  );
}
export const BABY_EVOLUTIONS: Record<string, string> = {
  Pichu: "Pikachu",
  Cleffa: "Clefairy",
  Igglybuff: "Jigglypuff",
  Elekid: "Electabuzz",
  Magby: "Magmar",
  Smoochum: "Jynx",
  Tyrogue: "Hitmonlee",
};
export function evolvesInto(from: Card, to: Card) {
  return to.evolvesFrom === from.name || BABY_EVOLUTIONS[from.name] === to.name;
}
export function startingPokemon(c: Card | undefined) {
  return (
    c?.supertype === "Pokémon" &&
    c.subtypes.some((t) => t === "Basic" || t === "Baby")
  );
}
export function attackOptions(s: GameState, p: Piece, catalog: Catalog) {
  const card = pokemonCard(s, p, catalog);
  const out = card.attacks.map((attack, index) => ({ card, index, attack }));
  if (powerOn(s, p, catalog, "Psylink"))
    for (const q of pieces(ownerOf(s, p)))
      if (
        q.uid !== p.uid &&
        pokemonCard(s, q, catalog).types.includes("Psychic")
      ) {
        const qc = pokemonCard(s, q, catalog);
        qc.attacks.forEach((attack, index) =>
          out.push({ card: qc, index, attack }),
        );
      }
  if (mark(s, p, "recall"))
    for (const id of p.stack)
      catalog[id].attacks.forEach((attack, index) =>
        out.push({ card: catalog[id], index, attack }),
      );
  return out;
}
