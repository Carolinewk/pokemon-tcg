import type { Piece } from "../../game-types";

/** The Doll's continuous rules apply only while it is a Pokémon in play. */
export function clefairyDollRules(cardId: string) {
  const doll = cardId === "base1-70" || cardId === "base3-62";
  return {
    immuneToConditions: doll,
    canRetreat: !doll,
    awardsPrizes: !doll,
    canDiscardVoluntarily: doll,
  };
}

/** Base Set PlusPower is added only after a positive damage result survives W/R. */
export function plusPowerBonus(attacker: Piece, turn: number, damage: number) {
  if (damage <= 0) return 0;
  return (
    10 *
    (attacker.trainerAttachments || []).filter(
      (t) => ["base1-84", "base4-113"].includes(t.card) && t.expires >= turn,
    ).length
  );
}

/** Defender reduces attack damage, including recoil and damage to the Bench. */
export function defenderReduction(target: Piece, turn: number) {
  return (
    20 *
    (target.trainerAttachments || []).filter(
      (t) => ["base1-80", "base4-109"].includes(t.card) && t.expires >= turn,
    ).length
  );
}
