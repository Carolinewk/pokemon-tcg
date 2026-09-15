import type { Piece } from "../../game-types";
import type { AttackContext, EffectContext } from "../context";
import {
  allPieces,
  awardPrizes,
  discardAttachments,
  log,
  removePiece,
  takeEnergy,
} from "../../game-core";
import { attachmentEnergy, ENERGY_TYPES } from "./energy";

export function powerAvailable(p: Piece) {
  return !p.conditions.some((c) =>
    ["Asleep", "Confused", "Paralyzed"].includes(c),
  );
}
export function alakazamDamageSwap(c: EffectContext) {
  const pieces = allPieces(c.player);
  const from = c.choosePiece(
    "damage-source",
    "Move a damage counter from…",
    pieces.filter(
      (p) =>
        p.damage >= 10 &&
        pieces.some(
          (q) => q.uid !== p.uid && q.damage + 10 < c.catalog[q.card].hp,
        ),
    ),
  );
  const to = c.choosePiece(
    "damage-target",
    "Move that counter to…",
    pieces.filter(
      (p) => p.uid !== from.uid && p.damage + 10 < c.catalog[p.card].hp,
    ),
  );
  from.damage -= 10;
  to.damage += 10;
}
export function blastoiseRainDance(c: EffectContext) {
  const targets = allPieces(c.player).filter((p) =>
    c.catalog[p.card].types.includes("Water"),
  );
  c.require(targets.length, "Rain Dance needs a Water Pokémon in play.");
  const [energy] = c.chooseCards(
    "rain-energy",
    "Choose a Water Energy from your hand",
    c.player.hand.filter(
      (h) =>
        c.catalog[h.card].supertype === "Energy" &&
        c.catalog[h.card].subtypes.includes("Basic") &&
        c.catalog[h.card].name === "Water Energy",
    ),
  );
  const target = c.choosePiece(
    "rain-target",
    "Attach Water Energy to…",
    targets,
  );
  c.player.hand = c.player.hand.filter((h) => h.uid !== energy.uid);
  target.energy.push(energy.card);
  // This is a Power, so the normal Energy attachment stays available.
}
export function charizardEnergyBurn(c: EffectContext, source: Piece) {
  c.require(source.energy.length, "Attach Energy to Charizard first.");
  source.effects ||= {};
  source.effects.energyBurnTurn = c.state.turn;
  source.burnedEnergy = source.energy.map((_, i) => i);
}
/** A passive reaction, evaluated using Machamp's condition when the attack began. */
export function machampStrikesBack(
  c: AttackContext,
  target: Piece,
  amount: number,
) {
  if (
    target.card !== "base1-8" ||
    amount <= 0 ||
    !c.awakePowers.has(target.uid)
  )
    return;
  c.attacker.damage += 10;
  log(
    c.state,
    "Machamp’s Strikes Back dealt 10 damage to the attacker.",
    "power",
  );
}
export function venusaurEnergyTrans(c: EffectContext) {
  const pieces = allPieces(c.player);
  c.require(pieces.length > 1, "Energy Trans needs another Pokémon in play.");
  const from = c.choosePiece(
    "trans-source",
    "Move Grass Energy from…",
    pieces.filter((p) =>
      p.energy.some((_, i) =>
        attachmentEnergy(p, i, c.catalog).includes("Grass"),
      ),
    ),
  );
  const [index] = c.chooseEnergy(
    "trans-energy",
    "Choose Grass Energy to move",
    from,
    1,
    1,
    "Grass",
  );
  const to = c.choosePiece(
    "trans-target",
    "Move that Energy to…",
    pieces.filter((p) => p.uid !== from.uid),
  );
  const moved = takeEnergy(from, index);
  if (moved.type) (to.energyTypes ||= {})[to.energy.length] = moved.type;
  to.energy.push(moved.card);
}
export function electrodeBuzzap(c: EffectContext, source: Piece) {
  const target = c.choosePiece(
    "buzzap-target",
    "Knock Out Electrode and attach it to…",
    allPieces(c.player).filter((p) => p.uid !== source.uid),
  );
  const [type] = c.choose(
    "buzzap-type",
    "Choose the Energy type Electrode will provide",
    ENERGY_TYPES.map((value) => ({ value, label: value })),
  );
  discardAttachments(c.state, c.player, source);
  c.player.discard.push(
    ...source.stack.map((card, i) => ({
      uid: `${source.uid}-buzzap-${c.state.seq}-${i}`,
      card,
    })),
  );
  removePiece(c.player, source);
  (target.energyTypes ||= {})[target.energy.length] = type;
  target.energy.push(source.card);
  awardPrizes(c.state, c.opponent, 1);
  log(
    c.state,
    `Electrode became an Energy card providing 2 ${type} Energy.`,
    "power",
  );
}
export type PowerHandler = (c: EffectContext, source: Piece) => void;
export const BASE_POWERS: Record<
  string,
  { name: string; use?: PowerHandler; passive?: typeof machampStrikesBack }
> = {
  "base1-1": { name: "Damage Swap", use: alakazamDamageSwap },
  "base1-2": { name: "Rain Dance", use: blastoiseRainDance },
  "base1-4": { name: "Energy Burn", use: charizardEnergyBurn },
  "base1-8": { name: "Strikes Back", passive: machampStrikesBack },
  "base1-15": { name: "Energy Trans", use: venusaurEnergyTrans },
  "base1-21": { name: "Buzzap", use: electrodeBuzzap },
};
