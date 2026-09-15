import type { Attack, Card } from "../../game-types";
import type { AttackContext, AttackHandler } from "../context";
import { BASE_ATTACKS } from "./attacks";
import { ATTACKS as BASE2_ATTACKS } from "../jungle/attacks";
import { ATTACKS as BASE3_ATTACKS } from "../fossil/attacks";
import { ATTACKS as BASE4_ATTACKS } from "../base-set-2/attacks";
import { ATTACKS as BASE5_ATTACKS } from "../team-rocket/attacks";
import { ATTACKS as GYM1_ATTACKS } from "../gym-heroes/attacks";
import { ATTACKS as GYM2_ATTACKS } from "../gym-challenge/attacks";
import { ATTACKS as NEO1_ATTACKS } from "../neo-genesis/attacks";
export const ALL_ATTACKS: Record<string, AttackHandler[]> = {
  ...BASE_ATTACKS,
  ...BASE2_ATTACKS,
  ...BASE3_ATTACKS,
  ...BASE4_ATTACKS,
  ...BASE5_ATTACKS,
  ...GYM1_ATTACKS,
  ...GYM2_ATTACKS,
  ...NEO1_ATTACKS,
};
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
  if (ALL_ATTACKS[card.id]) return ALL_ATTACKS[card.id][index];
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
