import type { Attack, Card } from "../../game-types";
import type { AttackContext, AttackHandler } from "../context";
import { BASE_ATTACKS } from "./attacks";
export { BASE_ATTACKS } from "./attacks";
export { BASE_TRAINERS } from "./trainers";
export { BASE_POWERS } from "./powers";
export { BASE_ENERGY, canPay } from "./energy";

function plainDamage(c: AttackContext) {
  if (c.begin()) c.hit(Number(c.attack.damage) || 0);
}
export function attackHandler(
  card: Card,
  index: number,
): AttackHandler | undefined {
  if (BASE_ATTACKS[card.id]) return BASE_ATTACKS[card.id][index];
  const attack = card.attacks[index];
  return attack && !attack.text && /^\d*$/.test(attack.damage)
    ? plainDamage
    : undefined;
}
export function automaticAttack(card: Card, attack: Attack) {
  return !!attackHandler(
    card,
    card.attacks.findIndex((a) => a.name === attack.name),
  );
}
