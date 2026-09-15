import type { HandCard, Piece } from "../../game-types";
import type { EffectContext } from "../context";
import { mark, maximumHP, ownerOf, powerOn } from "./state";
import { heal } from "./operations";
import { checkKnockouts } from "../../game-core";

export function rainbowEnergy(c: EffectContext, p: Piece) {
  c.powerDamage(p, p, 10);
}
export function fullHealEnergy(_c: EffectContext, p: Piece) {
  p.conditions = [];
}
export function potionEnergy(_c: EffectContext, p: Piece) {
  heal(p, 10);
}
export function healingFire(c: EffectContext, p: Piece, card: HandCard) {
  if (
    c.catalog[card.card].name === "Fire Energy" &&
    powerOn(c.state, p, c.catalog, "Healing Fire")
  )
    heal(p, 10);
}
export function attachEnergy(
  c: EffectContext,
  p: Piece,
  card: HandCard,
  fromHand = true,
) {
  c.require(
    !mark(c.state, p, "noEnergy"),
    "Energy cannot be attached to this Pokémon this turn.",
  );
  // Rainbow damages before it provides Energy: Gaseous Form cannot save a
  // Gastly with only 10 HP remaining by counting the new attachment early.
  if (fromHand && c.catalog[card.card].name === "Rainbow Energy") {
    rainbowEnergy(c, p);
    if (p.damage >= maximumHP(c.state, p, c.catalog)) {
      ownerOf(c.state, p).discard.push(card);
      checkKnockouts(c.state, c.catalog);
      return;
    }
  }
  p.energy.push(card.card);
  if (!fromHand) return;
  if (card.card === "base5-81") fullHealEnergy(c, p);
  if (card.card === "base5-82") potionEnergy(c, p);
  healingFire(c, p, card);
}
