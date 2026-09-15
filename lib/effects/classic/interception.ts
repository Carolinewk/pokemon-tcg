import type { Card, Player } from "../../game-types";
import { TrainerContext } from "../base-set/trainers";
import { EffectError } from "../context";
import { trainerFor, putsInPlay } from "./trainers";
import * as O from "./operations";
import * as R from "./state";

const handCosts: Record<string, { key: string; n: number; energy?: boolean }> =
  {
    "Computer Search": { key: "search-cost", n: 2 },
    "Item Finder": { key: "finder-cost", n: 2 },
    "Imposter Oak's Revenge": { key: "revenge-cost", n: 1 },
    Misty: { key: "misty-cost", n: 2 },
    "Max Revive": { key: "max-revive-cost", n: 2, energy: true },
    "Misty's Tears": { key: "tears-cost", n: 1 },
  };
export function payTrainerCosts(c: TrainerContext) {
  const card = c.catalog[c.source.card],
    cost = handCosts[card.name];
  if (card.name === "Computer Search")
    c.require(c.player.deck.length, "Your deck is empty.");
  if (card.name === "Item Finder")
    c.require(
      [...c.player.discard, ...c.player.hand].some(
        (h) => c.catalog[h.card].supertype === "Trainer",
      ),
      "There is no Trainer card to retrieve.",
    );
  if (cost) {
    const pool = c.player.hand.filter(
      (h) => !cost.energy || c.catalog[h.card].supertype === "Energy",
    );
    const hs = c.chooseCards(
      cost.key,
      `Discard ${cost.n} other card${cost.n === 1 ? "" : "s"}`,
      pool,
      cost.n,
    );
    c.discardHand(hs);
    c.paidCards[cost.key] = hs;
  }
  if (
    c.state.stadium?.card === "gym1-103" &&
    ["Energy Removal", "Super Energy Removal"].includes(card.name)
  )
    c.discardHand(
      c.chooseCards(
        "no-removal-cost",
        "No Removal Gym: discard 2 extra cards",
        c.player.hand,
        2,
      ),
    );
  if (["Super Energy Removal", "Super Potion"].includes(card.name)) {
    const potion = card.name === "Super Potion",
      pk = potion ? "super-potion" : "ser-source",
      ek = potion ? "super-potion-cost" : "ser-cost";
    const p = c.choosePiece(
      pk,
      "Choose a Pokémon to pay the Energy cost",
      O.allPieces(c.player).filter(
        (p) => p.energy.length && (!potion || p.damage),
      ),
    );
    const ix = c.chooseEnergy(ek, "Discard an Energy card", p);
    O.discardEnergy(c.state, c.player, p, ix);
    c.paidEnergy[ek] = ix;
    c.paidPieces[pk] = p;
  }
}
export function mindGames(c: TrainerContext, user: Player, owner: Player) {
  const defending = c.state.players.find((p) => p.id !== user.id)!;
  for (const slowking of R.providers(
    c.state,
    c.catalog,
    "Mind Games",
    defending,
  ))
    if (
      O.optional(
        c,
        `mind-games-${user.id}-${slowking.uid}`,
        "Use Slowking’s Mind Games?",
        defending.id,
      ) &&
      O.flip(c.state)
    ) {
      owner.deck.unshift(c.source);
      c.sourceHandled = true;
      return true;
    }
  return false;
}
function canUseStolen(c: TrainerContext, card: Card) {
  if (
    R.trainerBlocked(c.state, c.opponent, c.catalog) ||
    ["Pokémon Breeder", "Giovanni", "Blaine"].includes(card.name) ||
    putsInPlay(card)
  )
    return false;
  const cost = handCosts[card.name];
  if (
    cost &&
    c.opponent.hand.filter(
      (h) => !cost.energy || c.catalog[h.card].supertype === "Energy",
    ).length < cost.n
  )
    return false;
  if (card.name === "Computer Search" && !c.opponent.deck.length) return false;
  if (
    card.name === "Item Finder" &&
    ![...c.opponent.discard, ...c.opponent.hand].some(
      (h) => c.catalog[h.card].supertype === "Trainer",
    )
  )
    return false;
  return true;
}
export function interceptTrainer(c: TrainerContext) {
  const chaos =
    c.state.stadium?.card === "gym2-102" &&
    !c.catalog[c.source.card].subtypes.includes("Stadium");
  const slows = R.providers(c.state, c.catalog, "Mind Games", c.opponent);
  let chaosFirst = !!chaos && c.state.stadium?.owner === c.player.id;
  if (chaos && slows.length && c.state.stadium?.owner === c.opponent.id)
    chaosFirst = O.optional(
      c,
      "interception-order",
      "Resolve Chaos Gym before Mind Games?",
      c.opponent.id,
    );
  const doChaos = () => {
    if (!chaos || O.flip(c.state)) return false;
    const card = c.catalog[c.source.card];
    if (
      canUseStolen(c, card) &&
      O.optional(
        c,
        "chaos-use",
        `Use the opponent’s ${card.name}?`,
        c.opponent.id,
      )
    ) {
      const other = new TrainerContext(
        c.state,
        c.catalog,
        c.opponent,
        c.answers,
        c.source,
      );
      other.choicePrefix = "chaos:";
      try {
        payTrainerCosts(other);
        if (!mindGames(other, other.player, c.player)) trainerFor(card)!(other);
        if (other.sourceHandled) c.sourceHandled = true;
      } catch (e) {
        if (!(e instanceof EffectError)) throw e;
        O.log(
          c.state,
          `${card.name} could not be used: ${e.message}`,
          "trainer",
        );
      }
    }
    return true;
  };
  if (chaosFirst) {
    if (doChaos()) return true;
    if (mindGames(c, c.player, c.player)) return true;
  } else {
    if (mindGames(c, c.player, c.player)) return true;
    if (doChaos()) return true;
  }
  return false;
}
