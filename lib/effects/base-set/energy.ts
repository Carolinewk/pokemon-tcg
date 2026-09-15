import type { Card, Catalog, Piece, Attack, GameState } from "../../game-types";
import { ownerOf, pokemonCard, powerOn, providers } from "../classic/state";

export function fightingEnergy() {
  return ["Fighting"];
}
export function fireEnergy() {
  return ["Fire"];
}
export function grassEnergy() {
  return ["Grass"];
}
export function lightningEnergy() {
  return ["Lightning"];
}
export function psychicEnergy() {
  return ["Psychic"];
}
export function waterEnergy() {
  return ["Water"];
}
export function doubleColorlessEnergy() {
  return ["Colorless", "Colorless"];
}

export const BASE_ENERGY: Record<string, () => string[]> = {
  "base1-96": doubleColorlessEnergy,
  "base1-97": fightingEnergy,
  "base1-98": fireEnergy,
  "base1-99": grassEnergy,
  "base1-100": lightningEnergy,
  "base1-101": psychicEnergy,
  "base1-102": waterEnergy,
};
export const ENERGY_TYPES = [
  "Grass",
  "Fire",
  "Water",
  "Lightning",
  "Psychic",
  "Fighting",
  "Colorless",
  "Darkness",
  "Metal",
];
export function energyType(c: Card | undefined) {
  return (
    [...ENERGY_TYPES, "Darkness", "Metal", "Fairy"].find((t) =>
      c?.name.includes(t),
    ) || "Colorless"
  );
}
function rawAttachmentEnergy(
  p: Piece,
  index: number,
  catalog: Catalog,
  state?: GameState,
): string[] {
  const id = p.energy[index];
  if (!id) return [];
  let units = p.energyTypes?.[index]
    ? [p.energyTypes[index], p.energyTypes[index]]
    : BASE_ENERGY[id]?.() ||
      (/Double Colorless|Twin Energy/.test(catalog[id]?.name || "")
        ? doubleColorlessEnergy()
        : catalog[id]?.name === "Rainbow Energy"
          ? ["Any"]
          : [energyType(catalog[id])]);
  if (state && powerOn(state, p, catalog, "Photosynthesis"))
    units = units.map(() => "Grass");
  if (
    state &&
    powerOn(state, p, catalog, "Transform") &&
    ownerOf(state, p)?.active?.uid === p.uid
  )
    units = units.map(() => "Any");
  if (
    p.effects?.energyBurnTurn !== undefined &&
    p.burnedEnergy?.includes(index)
  )
    units = units.map(() => "Fire");
  return units;
}
export function energyOptions(
  p: Piece,
  index: number,
  catalog: Catalog,
  state?: GameState,
): string[][] {
  const units = rawAttachmentEnergy(p, index, catalog, state);
  const wild =
    state &&
    pokemonCard(state, p, catalog).types.includes("Grass") &&
    providers(state, catalog, "Wild Growth", ownerOf(state, p)).length;
  if (wild && units.includes("Any")) return [units, ["Grass", "Grass"]];
  if (wild && units.length && units.every((t) => t === "Grass"))
    return [["Grass", "Grass"]];
  return [units];
}
export function attachmentEnergy(
  p: Piece,
  index: number,
  catalog: Catalog,
  state?: GameState,
) {
  return energyOptions(p, index, catalog, state).reduce(
    (best, units) => (units.length > best.length ? units : best),
    [],
  );
}
export function cardProvidesEnergy(
  p: Piece,
  index: number,
  type: string,
  catalog: Catalog,
  state?: GameState,
) {
  return energyOptions(p, index, catalog, state).some(
    (units) => units.includes(type) || units.includes("Any"),
  );
}
export function providedEnergy(p: Piece, catalog: Catalog, state?: GameState) {
  return p.energy.flatMap((_, i) => attachmentEnergy(p, i, catalog, state));
}
export function energyPools(
  p: Piece,
  catalog: Catalog,
  state?: GameState,
  cap = 10,
) {
  let pools: string[][] = [[]];
  for (let i = 0; i < p.energy.length; i++) {
    const unique = new Map<string, string[]>();
    for (const pool of pools)
      for (const units of energyOptions(p, i, catalog, state)) {
        const counts: Record<string, number> = {};
        for (const t of [...pool, ...units])
          counts[t] = Math.min(cap, (counts[t] || 0) + 1);
        const limited = Object.entries(counts)
          .sort(([a], [b]) => a.localeCompare(b))
          .flatMap(([t, n]) => Array<string>(n).fill(t));
        unique.set(limited.join(","), limited);
      }
    pools = [...unique.values()];
  }
  return pools;
}
export function canPay(
  p: Piece,
  attack: Attack,
  catalog: Catalog,
  state?: GameState,
) {
  return energyPools(p, catalog, state, attack.cost.length).some((units) => {
    const pool = [...units];
    for (const cost of attack.cost.filter((t) => t !== "Colorless")) {
      let i = pool.indexOf(cost);
      if (i < 0) i = pool.indexOf("Any");
      if (i < 0) return false;
      pool.splice(i, 1);
    }
    return pool.length >= attack.cost.filter((t) => t === "Colorless").length;
  });
}
export function surplusEnergy(
  p: Piece,
  attack: Attack,
  type: string,
  catalog: Catalog,
  state?: GameState,
) {
  return Math.max(
    0,
    ...energyPools(p, catalog, state, attack.cost.length + 10).map((units) => {
      const pool = [...units];
      for (const cost of attack.cost.filter((t) => t !== "Colorless")) {
        let i = pool.indexOf(cost);
        if (i < 0) i = pool.indexOf("Any");
        if (i < 0) return 0;
        pool.splice(i, 1);
      }
      for (const cost of attack.cost.filter((t) => t === "Colorless")) {
        void cost;
        let i = pool.findIndex((t) => t !== type && t !== "Any");
        if (i < 0) i = 0;
        if (!pool.length) return 0;
        pool.splice(i, 1);
      }
      return pool.filter((t) => t === type || t === "Any").length;
    }),
  );
}
