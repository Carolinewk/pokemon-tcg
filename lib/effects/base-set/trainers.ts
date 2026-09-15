import type {
  Card,
  Catalog,
  GameState,
  HandCard,
  Piece,
  Player,
} from "../../game-types";
import {
  allPieces,
  clearAttackEffects,
  discardAttachments,
  discardEnergy,
  draw,
  isBasic,
  piece,
  removePiece,
  shuffle,
} from "../../game-core";
import { EffectContext, type Answers } from "../context";

import * as R from "../classic/state";
import { evolvePiece, switchPokemon } from "../classic/operations";
import { onPlayPower } from "../classic/powers";
export class TrainerContext extends EffectContext {
  paidCards: Record<string, HandCard[]> = {};
  paidEnergy: Record<string, number[]> = {};
  paidPieces: Record<string, Piece> = {};
  override chooseCards(...args: Parameters<EffectContext["chooseCards"]>) {
    return this.paidCards[args[0]] || super.chooseCards(...args);
  }
  override chooseEnergy(...args: Parameters<EffectContext["chooseEnergy"]>) {
    return this.paidEnergy[args[0]] || super.chooseEnergy(...args);
  }
  override choosePiece(...args: Parameters<EffectContext["choosePiece"]>) {
    return this.paidPieces[args[0]] || super.choosePiece(...args);
  }
  override discardHand(cards: HandCard[]) {
    super.discardHand(
      cards.filter((h) => !this.player.discard.some((q) => q.uid === h.uid)),
    );
  }
  discardCost(key: string, p: Piece, indices: number[]) {
    if (!this.paidEnergy[key])
      discardEnergy(this.state, this.player, p, indices);
  }
  sourceHandled = false;
  constructor(
    s: GameState,
    catalog: Catalog,
    p: Player,
    answers: Answers,
    public source: HandCard,
    public target?: string,
  ) {
    super(s, catalog, p, answers);
  }
  attach(target: Piece, expires: number) {
    (target.trainerAttachments ||= []).push({ ...this.source, expires });
    this.sourceHandled = true;
  }
}
function moveCards(from: HandCard[], to: HandCard[], cards: HandCard[]) {
  for (const h of cards) {
    const i = from.findIndex((c) => c.uid === h.uid);
    if (i >= 0) to.push(...from.splice(i, 1));
  }
}
function heal(c: TrainerContext, target: Piece, max: number) {
  const limit = Math.min(max, Math.floor(target.damage / 10));
  const [amount] = c.choose(
    "heal-amount",
    "Choose how much damage to heal",
    Array.from({ length: limit + 1 }, (_, i) => ({
      value: String(i * 10),
      label: i ? `Heal ${i * 10} damage` : "Heal no damage",
    })),
  );
  target.damage -= Number(amount);
}
export function clefairyDoll(c: TrainerContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full (5 Pokémon).",
  );
  c.player.bench.push(piece(c.source, c.state.turn));
  c.sourceHandled = true;
}
export function computerSearch(c: TrainerContext) {
  c.require(c.player.deck.length, "Your deck is empty.");
  const cost = c.chooseCards(
    "search-cost",
    "Discard 2 other cards from your hand",
    c.player.hand,
    2,
  );
  c.discardHand(cost);
  const selected = c.chooseCards(
    "search-card",
    "Choose any card from your deck",
    c.player.deck,
  );
  moveCards(c.player.deck, c.player.hand, selected);
  shuffle(c.state, c.player.deck);
}
export function devolutionSpray(c: TrainerContext) {
  const target = c.choosePiece(
    "devolve-target",
    "Choose a Pokémon to devolve",
    allPieces(c.player).filter((p) => p.stack.length && !p.shape),
  );
  const stack = [...target.stack, target.card];
  const [stage] = c.choose(
    "devolve-stage",
    "Discard which Evolution stage and everything above it?",
    stack.slice(1).map((card, i) => ({
      value: String(i + 1),
      label: `${c.catalog[card].subtypes.join(" · ")} · ${c.catalog[card].name}`,
      card,
    })),
  );
  const cut = +stage;
  c.player.discard.push(
    ...stack.slice(cut).map((card, i) => ({
      uid: `${target.uid}-devolve-${c.state.seq}-${i}`,
      card,
    })),
  );
  target.card = stack[cut - 1];
  target.stack = stack.slice(0, cut - 1);
  target.evolved = c.state.turn;
  clearAttackEffects(target);
  delete target.charred;
  delete target.shiftedType;
}
export function impostorProfessorOak(c: TrainerContext) {
  c.opponent.deck.push(...c.opponent.hand);
  c.opponent.hand = [];
  shuffle(c.state, c.opponent.deck);
  draw(c.state, c.opponent, 7);
}
export function itemFinder(c: TrainerContext) {
  c.require(
    [...c.player.discard, ...c.player.hand].some(
      (h) => c.catalog[h.card].supertype === "Trainer",
    ),
    "There is no Trainer card to retrieve.",
  );
  const cost = c.chooseCards(
    "finder-cost",
    "Discard 2 other cards from your hand",
    c.player.hand,
    2,
  );
  c.discardHand(cost);
  const selected = c.chooseCards(
    "finder-trainer",
    "Choose a Trainer from your discard pile",
    c.player.discard.filter((h) => c.catalog[h.card].supertype === "Trainer"),
  );
  moveCards(c.player.discard, c.player.hand, selected);
}
export function lass(c: TrainerContext) {
  for (const p of c.state.players) {
    c.reveal(`${p.name} revealed their hand for Lass`, [...p.hand]);
    const trainers = p.hand.filter(
      (h) => c.catalog[h.card].supertype === "Trainer",
    );
    moveCards(p.hand, p.deck, trainers);
    shuffle(c.state, p.deck);
  }
}
function breederMatches(c: TrainerContext, basic: Piece, evolution: HandCard) {
  const card = c.catalog[evolution.card];
  return (
    card.subtypes.includes("Stage 2") &&
    Object.values(c.catalog).some(
      (stage1) =>
        stage1.name === card.evolvesFrom &&
        stage1.evolvesFrom === c.catalog[basic.card].name,
    )
  );
}
export function pokemonBreeder(c: TrainerContext) {
  c.require(
    c.player.turns >= 2,
    "You can evolve starting with your second turn.",
  );
  c.require(
    !R.evolutionBlocked(c.state, c.catalog),
    "Prehistoric Power prevents evolution.",
  );
  const targets = allPieces(c.player).filter(
    (p) =>
      isBasic(c.catalog[p.card]) &&
      p.entered < c.state.turn &&
      p.evolved < c.state.turn &&
      c.player.hand.some((h) => breederMatches(c, p, h)),
  );
  const target = c.choosePiece(
    "breeder-target",
    "Choose a Basic Pokémon ready to evolve",
    targets,
  );
  const [evolution] = c.chooseCards(
    "breeder-evolution",
    "Choose its Stage 2 Evolution",
    c.player.hand.filter((h) => breederMatches(c, target, h)),
  );
  c.player.hand = c.player.hand.filter((h) => h.uid !== evolution.uid);
  evolvePiece(c, target, evolution);
  onPlayPower(c, target);
}
export function pokemonTrader(c: TrainerContext) {
  c.require(c.player.deck.length, "Your deck is empty.");
  const [trade] = c.chooseCards(
    "trader-cost",
    "Choose a Pokémon from your hand to trade",
    c.player.hand.filter((h) => c.catalog[h.card].supertype === "Pokémon"),
  );
  const selected = c.chooseCards(
    "trader-search",
    "Choose a Pokémon from your deck, or finish without finding one",
    c.player.deck.filter((h) => c.catalog[h.card].supertype === "Pokémon"),
    0,
    1,
  );
  c.player.hand = c.player.hand.filter((h) => h.uid !== trade.uid);
  moveCards(c.player.deck, c.player.hand, selected);
  c.player.deck.push(trade);
  c.reveal("Pokémon Trader", [trade, ...selected]);
  shuffle(c.state, c.player.deck);
}
export function scoopUp(c: TrainerContext) {
  const target = c.choosePiece(
    "scoop-target",
    "Return which Pokémon’s Basic card to your hand?",
    allPieces(c.player),
  );
  const stack = [...target.stack, target.card];
  c.player.hand.push({ uid: target.uid, card: stack[0] });
  c.player.discard.push(
    ...stack.slice(1).map((card, i) => ({
      uid: `${target.uid}-scoop-${c.state.seq}-${i}`,
      card,
    })),
  );
  discardAttachments(c.state, c.player, target);
  removePiece(c.player, target);
}
export function superEnergyRemoval(c: TrainerContext) {
  const from = c.choosePiece(
    "ser-source",
    "Pay with Energy attached to…",
    allPieces(c.player).filter((p) => p.energy.length),
  );
  const cost = c.chooseEnergy(
    "ser-cost",
    "Discard one of your Energy cards",
    from,
  );
  const target = c.choosePiece(
    "ser-target",
    "Remove Energy from which opposing Pokémon?",
    allPieces(c.opponent),
  );
  const removed = c.chooseEnergy(
    "ser-remove",
    "Choose up to 2 Energy cards to discard",
    target,
    0,
    2,
  );
  c.discardCost("ser-cost", from, cost);
  discardEnergy(c.state, c.opponent, target, removed);
}
export function defender(c: TrainerContext) {
  const target = c.choosePiece(
    "defender-target",
    "Protect which Pokémon with Defender?",
    allPieces(c.player),
  );
  c.attach(target, c.state.turn + 1);
}
export function energyRetrieval(c: TrainerContext) {
  // A trade cannot return the very card offered in that trade.
  const eligible = c.player.discard.filter(
    (h) =>
      c.catalog[h.card].supertype === "Energy" &&
      c.catalog[h.card].subtypes.includes("Basic"),
  );
  const cost = c.chooseCards(
    "retrieval-cost",
    "Trade one other card from your hand",
    c.player.hand,
  );
  const selected = c.chooseCards(
    "retrieval-energy",
    "Return up to 2 Basic Energy cards",
    eligible,
    0,
    2,
  );
  c.discardHand(cost);
  moveCards(c.player.discard, c.player.hand, selected);
}
export function fullHeal(c: TrainerContext) {
  const target = c.player.active!;
  c.require(
    target.conditions.some((x) =>
      ["Asleep", "Confused", "Paralyzed", "Poisoned"].includes(x),
    ),
    "Your Active Pokémon has no condition Full Heal can remove.",
  );
  target.conditions = target.conditions.filter(
    (x) => !["Asleep", "Confused", "Paralyzed", "Poisoned"].includes(x),
  );
  if (target.effects) delete target.effects.poisonDamage;
}
export function maintenance(c: TrainerContext) {
  const selected = c.chooseCards(
    "maintenance",
    "Shuffle 2 other cards into your deck",
    c.player.hand,
    2,
  );
  moveCards(c.player.hand, c.player.deck, selected);
  shuffle(c.state, c.player.deck);
  draw(c.state, c.player, 1);
}
export function plusPower(c: TrainerContext) {
  c.attach(c.player.active!, c.state.turn);
}
export function pokemonCenter(c: TrainerContext) {
  for (const target of allPieces(c.player))
    if (target.damage > 0) {
      target.damage = 0;
      discardEnergy(
        c.state,
        c.player,
        target,
        target.energy.map((_, i) => i),
      );
    }
}
export function pokemonFlute(c: TrainerContext) {
  c.require(
    c.opponent.bench.length < R.narrowGym(c.state),
    "Your opponent’s Bench is full.",
  );
  const [selected] = c.chooseCards(
    "flute",
    "Put a Basic Pokémon from the opponent’s discard onto their Bench",
    c.opponent.discard.filter((h) => isBasic(c.catalog[h.card])),
  );
  c.opponent.discard = c.opponent.discard.filter((h) => h.uid !== selected.uid);
  c.opponent.bench.push(piece(selected, c.state.turn));
}
export function pokedex(c: TrainerContext) {
  c.require(c.player.deck.length, "Your deck is empty.");
  const top = c.player.deck.slice(0, 5);
  const selected = c.chooseCards(
    "pokedex",
    "Arrange the top cards: choose the next card you want to draw first",
    top,
    top.length,
    top.length,
    true,
  );
  c.player.deck.splice(0, top.length, ...selected);
}
export function professorOak(c: TrainerContext) {
  c.player.discard.push(...c.player.hand);
  c.player.hand = [];
  draw(c.state, c.player, 7);
}
export function revive(c: TrainerContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  const [selected] = c.chooseCards(
    "revive",
    "Revive a Basic Pokémon onto your Bench",
    c.player.discard.filter((h) => isBasic(c.catalog[h.card])),
  );
  c.player.discard = c.player.discard.filter((h) => h.uid !== selected.uid);
  const revived = piece(selected, c.state.turn);
  revived.damage = Math.floor(c.catalog[selected.card].hp / 20) * 10;
  c.player.bench.push(revived);
}
export function superPotion(c: TrainerContext) {
  const target = c.choosePiece(
    "super-potion",
    "Heal which Pokémon?",
    allPieces(c.player).filter((p) => p.damage > 0 && p.energy.length),
  );
  const cost = c.chooseEnergy(
    "super-potion-cost",
    "Discard an Energy from that Pokémon",
    target,
  );
  c.discardCost("super-potion-cost", target, cost);
  heal(c, target, 4);
}
export function bill(c: TrainerContext) {
  draw(c.state, c.player, 2);
}
export function energyRemoval(c: TrainerContext) {
  const target = c.choosePiece(
    "removal-target",
    "Remove Energy from…",
    allPieces(c.opponent).filter((p) => p.energy.length),
  );
  const selected = c.chooseEnergy(
    "removal-energy",
    "Choose an Energy card to discard",
    target,
  );
  discardEnergy(c.state, c.opponent, target, selected);
}
export function gustOfWind(c: TrainerContext) {
  const target = c.choosePiece(
    "gust",
    "Choose the opponent’s new Active Pokémon",
    c.opponent.bench,
  );
  switchPokemon(c, c.opponent, target);
}
export function potion(c: TrainerContext) {
  const target = c.choosePiece(
    "potion-target",
    "Heal which Pokémon?",
    allPieces(c.player).filter((p) => p.damage > 0),
  );
  heal(c, target, 2);
}
export function switchTrainer(c: TrainerContext) {
  const target = c.target
    ? c.player.bench.find((p) => p.uid === c.target)
    : c.choosePiece("switch", "Choose your new Active Pokémon", c.player.bench);
  c.require(target, "Choose a Benched Pokémon to switch.");
  switchPokemon(c, c.player, target);
}
export const BASE_TRAINERS: Record<string, (c: TrainerContext) => void> = {
  "base1-70": clefairyDoll,
  "base1-71": computerSearch,
  "base1-72": devolutionSpray,
  "base1-73": impostorProfessorOak,
  "base1-74": itemFinder,
  "base1-75": lass,
  "base1-76": pokemonBreeder,
  "base1-77": pokemonTrader,
  "base1-78": scoopUp,
  "base1-79": superEnergyRemoval,
  "base1-80": defender,
  "base1-81": energyRetrieval,
  "base1-82": fullHeal,
  "base1-83": maintenance,
  "base1-84": plusPower,
  "base1-85": pokemonCenter,
  "base1-86": pokemonFlute,
  "base1-87": pokedex,
  "base1-88": professorOak,
  "base1-89": revive,
  "base1-90": superPotion,
  "base1-91": bill,
  "base1-92": energyRemoval,
  "base1-93": gustOfWind,
  "base1-94": potion,
  "base1-95": switchTrainer,
};

/** Preserve the four reprint effects the table already supported, using the same functions. */
export function trainerHandler(card: Card) {
  const reprints: Record<string, (c: TrainerContext) => void> = {
    Bill: bill,
    "Professor Oak": professorOak,
    "Pokémon Center": pokemonCenter,
    Switch: switchTrainer,
  };
  return BASE_TRAINERS[card.id] || reprints[card.name];
}
