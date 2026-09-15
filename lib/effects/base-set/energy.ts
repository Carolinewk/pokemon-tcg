import type { Card, Catalog, Piece, Attack } from "../../game-types";

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
];
export function energyType(c: Card | undefined) {
  return (
    [...ENERGY_TYPES, "Darkness", "Metal", "Fairy"].find((t) =>
      c?.name.includes(t),
    ) || "Colorless"
  );
}
export function attachmentEnergy(
  p: Piece,
  index: number,
  catalog: Catalog,
): string[] {
  const id = p.energy[index];
  if (!id) return [];
  let units = p.energyTypes?.[index]
    ? [p.energyTypes[index], p.energyTypes[index]]
    : BASE_ENERGY[id]?.() ||
      (/Double Colorless|Twin Energy/.test(catalog[id]?.name || "")
        ? doubleColorlessEnergy()
        : [energyType(catalog[id])]);
  if (
    p.effects?.energyBurnTurn !== undefined &&
    p.burnedEnergy?.includes(index)
  )
    units = units.map(() => "Fire");
  return units;
}
export function providedEnergy(p: Piece, catalog: Catalog) {
  return p.energy.flatMap((_, i) => attachmentEnergy(p, i, catalog));
}
export function canPay(p: Piece, attack: Attack, catalog: Catalog) {
  const pool = providedEnergy(p, catalog);
  for (const cost of attack.cost.filter((t) => t !== "Colorless")) {
    const i = pool.indexOf(cost);
    if (i < 0) return false;
    pool.splice(i, 1);
  }
  return pool.length >= attack.cost.filter((t) => t === "Colorless").length;
}
