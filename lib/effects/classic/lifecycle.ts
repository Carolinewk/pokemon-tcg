import type { GameState, Piece } from "../../game-types";
import { EffectContext } from "../context";
import * as O from "./operations";
import * as R from "./state";
import { discardAttachments, removePiece } from "../../game-core";
import { onPlayPower } from "./powers";

export function discardTool(c: EffectContext, p: Piece, id: string) {
  const i = p.tools.indexOf(id);
  if (i >= 0)
    R.ownerOf(c.state, p).discard.push({
      uid: `${p.uid}-tool-${c.state.seq}-${i}`,
      card: p.tools.splice(i, 1)[0],
    });
}
export function berryHeal(
  c: EffectContext,
  p: Piece,
  id: string,
  amount: number,
  mandatory: boolean,
) {
  if (
    p.damage >= amount &&
    (mandatory ||
      O.optional(
        c,
        `berry-${p.uid}-${c.state.turn}`,
        `Use ${c.catalog[id].name} before between-turn damage?`,
        R.ownerOf(c.state, p).id,
      ))
  ) {
    O.heal(p, amount);
    discardTool(c, p, id);
  }
}
export function miracleBerryCure(
  c: EffectContext,
  p: Piece,
  mandatory: boolean,
) {
  if (
    p.conditions.length &&
    (mandatory ||
      O.optional(
        c,
        `miracle-${p.uid}-${c.state.turn}`,
        "Use Miracle Berry before between-turn effects?",
        R.ownerOf(c.state, p).id,
      ))
  ) {
    p.conditions = [];
    discardTool(c, p, "neo1-94");
  }
}
export function berries(c: EffectContext, mandatory = false) {
  for (const p of O.board(c.state)) {
    if (p.tools.includes("neo1-99")) berryHeal(c, p, "neo1-99", 20, mandatory);
    if (p.tools.includes("neo1-93")) berryHeal(c, p, "neo1-93", 40, mandatory);
    if (p.tools.includes("neo1-94")) miracleBerryCure(c, p, mandatory);
  }
}
export function darknessEnergyCheckup(c: EffectContext, p: Piece) {
  const card = R.pokemonCard(c.state, p, c.catalog);
  if (!card.types.includes("Darkness") && !card.name.includes("Dark"))
    p.damage += 10 * p.energy.filter((id) => id === "neo1-104").length;
}
export function charCheckup(c: EffectContext, p: Piece) {
  if (p.charred && !O.flip(c.state)) p.damage += 20;
}
export function endOfTurnEffects(c: EffectContext) {
  berries(c);
  for (const p of O.board(c.state)) {
    darknessEnergyCheckup(c, p);
    charCheckup(c, p);
  }
}
export function startOfTurnEffects(c: EffectContext) {
  berries(c, true);
}
export function ticklingMachineReturn(s: GameState) {
  for (const p of s.players) {
    for (const a of p.aside || [])
      if (a.until <= s.turn) p.hand.push(...a.cards);
    p.aside = (p.aside || []).filter((a) => a.until > s.turn);
  }
}
export function rocketMoltresRebirth(c: EffectContext, p: Piece) {
  if (
    O.optional(
      c,
      `rebirth-${p.uid}`,
      "Return Rocket’s Moltres to your hand after its Knock Out?",
      R.ownerOf(c.state, p).id,
    )
  )
    O.putMark(c, p, "rebirth", 0);
}
export function brockPrimeapeScram(c: EffectContext, p: Piece) {
  if (R.maximumHP(c.state, p, c.catalog) - p.damage === 10)
    O.leavePlay(c, p, "deck");
}
export function normalizePowers(c: EffectContext) {
  for (const p of O.board(c.state)) {
    if (
      (p.shape || p.shapeAttachments?.length) &&
      !R.powerOn(c.state, p, c.catalog, "Shapeshift")
    ) {
      R.ownerOf(c.state, p).discard.push(
        ...(p.shapeAttachments || (p.shape ? [p.shape] : [])),
      );
      delete p.shape;
      delete p.shapeAttachments;
    }
    if (R.powerOn(c.state, p, c.catalog, "Scram")) brockPrimeapeScram(c, p);
  }
}
export function beforeKnockouts(c: EffectContext) {
  normalizePowers(c);
  for (const p of O.board(c.state))
    if (
      p.damage >= R.maximumHP(c.state, p, c.catalog) &&
      R.powerOn(c.state, p, c.catalog, "Rebirth")
    )
      rocketMoltresRebirth(c, p);
}
export function minefieldGym(c: EffectContext, p: Piece) {
  if (c.state.stadium?.card === "gym2-119" && !O.flip(c.state)) p.damage += 20;
}
export function onPokemonPlayed(
  c: EffectContext,
  p: Piece,
  fromHand: boolean,
  basic: boolean,
) {
  if (fromHand && basic && c.player.bench.includes(p)) minefieldGym(c, p);
  if (fromHand) onPlayPower(c, p);
  normalizePowers(c);
}
export function darkDugtrioSinkhole(c: EffectContext, p: Piece) {
  for (const source of R.providers(c.state, c.catalog, "Sinkhole", c.opponent))
    if (!O.flip(c.state)) c.powerDamage(source, p, 20);
}
export function revealFaceDown(c: EffectContext, p: Piece) {
  if (!p.faceDown) return true;
  delete p.faceDown;
  c.reveal("Lt. Surge’s Secret Plan", [{ uid: p.uid, card: p.card }]);
  if (!R.startingPokemon(c.catalog[p.card])) {
    const owner = R.ownerOf(c.state, p);
    discardAttachments(c.state, owner, p);
    owner.discard.push({ uid: p.uid, card: p.card });
    removePiece(owner, p);
    return false;
  }
  return true;
}
export function activateStadium(c: EffectContext) {
  const id = c.state.stadium?.card;
  c.require(id, "There is no Stadium in play.");
  if (id === "gym1-107") {
    c.require(
      c.player.rules?.celadonTurn !== c.state.turn,
      "Celadon City Gym was already used this turn.",
    );
    const p = c.choosePiece(
      "celadon",
      "Cure a Pokémon with Erika in its name",
      O.allPieces(c.player).filter(
        (p) =>
          R.pokemonCard(c.state, p, c.catalog).name.includes("Erika") &&
          p.conditions.length &&
          p.energy.length,
      ),
    );
    const ix = c.chooseEnergy(
      "celadon-energy",
      "Discard an Energy to cure conditions",
      p,
    );
    O.discardEnergy(c.state, c.player, p, ix);
    p.conditions = [];
    (c.player.rules ||= {}).celadonTurn = c.state.turn;
  } else if (id === "gym2-114") {
    c.require(
      c.player.rules?.fuchsiaTurn !== c.state.turn,
      "Fuchsia City Gym was already used this turn.",
    );
    (c.player.rules ||= {}).fuchsiaTurn = c.state.turn;
    if (O.flip(c.state)) {
      const ps = O.allPieces(c.player).filter((p) =>
        R.pokemonCard(c.state, p, c.catalog).name.includes("Koga"),
      );
      if (
        ps.length &&
        O.optional(
          c,
          "fuchsia-use",
          "Shuffle one of your Koga Pokémon into your deck?",
        )
      )
        O.leavePlay(
          c,
          c.choosePiece("fuchsia", "Choose a Pokémon", ps),
          "deck",
        );
    }
  } else if (id === "gym2-122") {
    const ps = O.allPieces(c.player).filter(
      (p) =>
        R.pokemonCard(c.state, p, c.catalog).name.includes("Sabrina") &&
        p.energy.some((id) => O.basicEnergy(c.catalog[id])),
    );
    const p = c.choosePiece("saffron", "Return basic Energy to your hand", ps);
    const indices = p.energy.flatMap((id, i) =>
      O.basicEnergy(c.catalog[id])
        ? [{ value: String(i), label: c.catalog[id].name, card: id }]
        : [],
    );
    O.returnEnergy(c, p, [
      Number(c.choose("saffron-energy", "Choose basic Energy", indices)[0]),
    ]);
  } else c.require(false, "This Stadium has a continuous effect.");
}
