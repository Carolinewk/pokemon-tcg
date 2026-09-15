import type { Catalog, EffectIntent, GameState } from "./game-types";
import {
  allPieces,
  checkKnockouts,
  discardAttachments,
  discardEnergy,
  effect,
  findPiece,
  log,
  nextTurn,
  removePiece,
  switchActive,
} from "./game-core";
import {
  AttackContext,
  EffectContext,
  EffectError,
  NeedsChoice,
  type Answers,
} from "./effects/context";
import { attackHandler } from "./effects/base-set";
import {
  attachmentEnergy,
  canPay,
  providedEnergy,
} from "./effects/base-set/energy";
import { TrainerContext } from "./effects/base-set/trainers";
import * as R from "./effects/classic/state";
import * as O from "./effects/classic/operations";
import * as L from "./effects/classic/lifecycle";
import * as D from "./effects/classic/damage";
import { availablePowers } from "./effects/classic/powers";
import { trainerFor } from "./effects/classic/trainers";
import {
  payTrainerCosts,
  interceptTrainer,
} from "./effects/classic/interception";
import { clefairyDollRules } from "./effects/base-set/modifiers";

function attack(c: EffectContext, intent: EffectIntent, rerollCount = 0) {
  const beforeAttack = structuredClone(c.state);
  const a = c.player.active,
    b = c.opponent.active;
  c.require(a && b, "Both Trainers need an Active Pokémon.");
  c.require(
    c.state.turn > 1,
    "The first player cannot attack on the first turn.",
  );
  c.require(
    !a.conditions.some((x) => ["Asleep", "Paralyzed"].includes(x)),
    "An Asleep or Paralyzed Pokémon cannot attack.",
  );
  if (!L.revealFaceDown(c, a)) return;
  if (!L.revealFaceDown(c, b)) {
    checkKnockouts(c.state, c.catalog);
    if (c.state.status === "playing") nextTurn(c.state, c.catalog, c.answers);
    return;
  }
  const index = intent.index;
  const selected = Number.isInteger(index)
    ? R.attackOptions(c.state, a, c.catalog)[index!]
    : undefined;
  const card = selected?.card || R.pokemonCard(c.state, a, c.catalog);
  c.require(
    Number.isInteger(index) && index! >= 0 && selected,
    "Choose an attack.",
  );
  const printed = selected!.attack;
  c.require(!R.mark(c.state, a, "noAttack"), "This Pokémon cannot attack.");
  const locked = R.mark(c.state, a, "cannotAttackSource");
  c.require(
    locked?.source !== b.uid,
    "This Pokémon cannot attack that opponent.",
  );
  c.require(
    R.mark(c.state, a, "attackDisabled")?.name !== printed.name,
    "This attack is unavailable this turn.",
  );
  c.require(
    !a.usedAttacks?.includes(printed.name),
    "This attack can only be used once while this Pokémon is in play.",
  );
  c.require(
    !(
      a.effects?.amnesia &&
      a.effects.amnesia.until >= c.state.turn &&
      a.effects.amnesia.name === printed.name
    ),
    `${printed.name} is disabled by Amnesia this turn.`,
  );
  c.require(
    canPay(a, printed, c.catalog, c.state),
    "Attach the required Energy first.",
  );
  const handler = attackHandler(card, selected!.index);
  // The Baby check precedes attack costs and is not a Pokémon Power.
  if (
    R.pokemonCard(c.state, b, c.catalog).subtypes.includes("Baby") &&
    !O.flip(c.state)
  ) {
    O.log(c.state, "The Baby Pokémon prevented the attack.", "attack");
    nextTurn(c.state, c.catalog, c.answers);
    return;
  }
  if (R.powerOn(c.state, a, c.catalog, "Rebellion")) {
    const h1 = O.flip(c.state),
      h2 = O.flip(c.state);
    if (!h1 && !h2) {
      O.leavePlay(c, a, "deck");
      checkKnockouts(c.state, c.catalog);
      if (c.state.status === "playing") nextTurn(c.state, c.catalog, c.answers);
      return;
    }
  }
  if (
    (b.trainerAttachments || []).some((t) => t.card === "gym2-115") &&
    c.opponent.bench.length &&
    !R.switchingBlocked(c.state, c.opponent) &&
    O.optional(
      c,
      "ninja-trick",
      "Use Koga’s Ninja Trick to switch before the attack?",
      c.opponent.id,
    )
  ) {
    const p = c.choosePiece(
      "ninja-target",
      "Choose your new Active Pokémon",
      c.opponent.bench,
      c.opponent.id,
    );
    O.switchPokemon(c, c.opponent, p);
  }
  const ctx = new AttackContext(
    c.state,
    c.catalog,
    c.player,
    c.answers,
    printed,
    card,
    attackHandler,
    D.attackReaction,
  );
  ctx.rerollSkip = rerollCount;
  if (rerollCount) ctx.choicePrefix = "reroll:";
  if (
    c.state.stadium?.card === "gym1-120" &&
    R.pokemonCard(c.state, a, c.catalog).name.includes("Lt. Surge") &&
    O.optional(c, "vermilion", "Use Vermilion City Gym?")
  ) {
    if (O.flip(c.state)) ctx.vermilionBonus = 10;
    else ctx.recoil(10);
  }
  if (handler) handler(ctx);
  else {
    c.require(
      typeof intent.damage === "number" &&
        Number.isInteger(intent.damage) &&
        intent.damage >= 0 &&
        intent.damage <= 9990,
      "Enter damage and resolve this expansion’s printed effects with table tools.",
    );
    if (ctx.begin()) ctx.hit(intent.damage);
  }
  if (
    !rerollCount &&
    ctx.coinResults.length &&
    (a.trainerAttachments || []).some(
      (t) => t.card === "gym1-117" && t.expires >= c.state.turn,
    ) &&
    O.optional(
      c,
      "esp-reroll",
      `Sabrina’s ESP: re-flip the attack coins (${ctx.coinResults.map((x) => (x ? "heads" : "tails")).join(", ")})?`,
    )
  ) {
    Object.assign(c.state, beforeAttack);
    const restarted = new EffectContext(
      c.state,
      c.catalog,
      c.state.players.find((p) => p.id === c.player.id)!,
      c.answers,
    );
    attack(restarted, intent, ctx.coinResults.length);
    return;
  }
  for (const target of allPieces(c.opponent)) {
    const old = beforeAttack.players
      .flatMap(allPieces)
      .find((p) => p.uid === target.uid);
    if (!old) continue;
    const changed = Object.fromEntries(
      Object.entries(target.marks || {}).filter(
        ([key, m]) => JSON.stringify(m) !== JSON.stringify(old.marks?.[key]),
      ),
    );
    if (Object.keys(changed).length)
      ctx.record(target).marks = structuredClone(changed);
    if (target.charred && !old.charred) ctx.record(target).charred = true;
    if (target.damage < old.damage)
      ctx.record(target).healed = old.damage - target.damage;
  }
  // Destiny Bond reacts to the attack, never between-turn Poison or a later turn.
  for (const target of allPieces(c.opponent))
    if (
      (ctx.damageDone.get(target.uid) || 0) > 0 &&
      target.damage >= R.maximumHP(c.state, target, c.catalog) &&
      (target.effects?.destinyBondUntil ?? -1) >= c.state.turn
    ) {
      a.damage = Math.max(a.damage, R.maximumHP(c.state, a, c.catalog));
      log(
        c.state,
        "Destiny Bond Knocked Out the attacking Pokémon.",
        "knockout",
      );
    }
  if (
    (c.player.rules?.kogaTurn ?? -1) === c.state.turn &&
    R.pokemonCard(c.state, a, c.catalog).name.includes("Koga") &&
    ctx.damage > 0
  )
    ctx.status("Poisoned");
  D.preventAttackKnockouts(ctx);
  if (O.allPieces(c.player).includes(a))
    a.lastUsed = { name: printed.name, turn: c.state.turn };
  log(
    c.state,
    `${card.name} used ${printed.name} for ${ctx.damage} damage.`,
    "attack",
  );
  effect(c.state, "attack", `${printed.name} · ${ctx.damage}`);
  L.beforeKnockouts(c);
  checkKnockouts(c.state, c.catalog);
  if (c.state.status === "playing") nextTurn(c.state, c.catalog, c.answers);
}
function trainer(c: EffectContext, intent: EffectIntent) {
  c.require(
    !R.trainerBlocked(c.state, c.player, c.catalog),
    "Trainer cards cannot be played right now.",
  );
  const i = c.player.hand.findIndex((h) => h.uid === intent.uid);
  c.require(i >= 0, "That card is no longer in your hand.");
  const [source] = c.player.hand.splice(i, 1);
  const handler = trainerFor(c.catalog[source.card]);
  c.require(handler, "This Trainer has no automated effect.");
  const ctx = new TrainerContext(
    c.state,
    c.catalog,
    c.player,
    c.answers,
    source,
    intent.target,
  );
  payTrainerCosts(ctx);
  if (!interceptTrainer(ctx)) handler(ctx);
  if (!ctx.sourceHandled) c.player.discard.push(source);
  log(
    c.state,
    `${c.player.name} played ${c.catalog[source.card].name}.`,
    "trainer",
  );
  L.beforeKnockouts(c);
  checkKnockouts(c.state, c.catalog);
  if (ctx.endsTurn && c.state.status === "playing")
    nextTurn(c.state, c.catalog, c.answers);
}
function power(c: EffectContext, intent: EffectIntent) {
  const source = findPiece(c.player, intent.uid);
  c.require(source, "Choose one of your Pokémon in play.");
  const available = availablePowers(c.state, source, c.catalog).filter(
    (p) => p.use,
  );
  const ability = available[intent.index || 0];
  c.require(ability?.use, "This Pokémon has no activated Power.");
  c.require(
    R.powerOn(c.state, source, c.catalog, ability.name),
    "This Power cannot be used while its Pokémon is Asleep, Confused, or Paralyzed.",
  );
  ability.use(c, source);
  log(c.state, `${c.catalog[source.card].name} used ${ability.name}.`, "power");
  effect(c.state, "energy", ability.name);
  L.beforeKnockouts(c);
  checkKnockouts(c.state, c.catalog);
  if (c.endsTurn && c.state.status === "playing")
    nextTurn(c.state, c.catalog, c.answers);
}
function retreat(c: EffectContext, intent: EffectIntent) {
  const a = c.player.active;
  c.require(
    a && clefairyDollRules(a.card).canRetreat,
    "This Pokémon cannot retreat.",
  );
  c.require(!c.player.retreated, "You have already retreated this turn.");
  c.require(
    !a.conditions.some((x) => ["Asleep", "Paralyzed"].includes(x)),
    "An Asleep or Paralyzed Pokémon cannot retreat.",
  );
  c.require(
    c.player.bench.some((p) => p.uid === intent.uid),
    "Choose a Benched Pokémon.",
  );
  c.require(
    !R.mark(c.state, a, "noRetreat") && !R.switchingBlocked(c.state, c.player),
    "This Pokémon cannot retreat.",
  );
  const cost = R.retreatCost(c.state, c.player, c.catalog);
  c.require(
    providedEnergy(a, c.catalog, c.state).length >= cost,
    `Retreat needs ${cost} Energy.`,
  );
  if (cost > 0) {
    const options = a.energy.map((card, i) => ({
      value: String(i),
      card,
      label: `${c.catalog[card].name} · ${attachmentEnergy(a, i, c.catalog, c.state).length} Energy`,
    }));
    const allSingle = options.every(
      (_, i) => attachmentEnergy(a, i, c.catalog, c.state).length === 1,
    );
    const indices = allSingle
      ? c.chooseEnergy(
          "retreat-energy",
          `Discard ${cost} Energy for retreat`,
          a,
          cost,
          cost,
        )
      : c
          .choose(
            "retreat-energy",
            `Choose Energy cards providing ${cost} Energy for retreat`,
            options,
            1,
            Math.min(cost, options.length),
          )
          .map(Number);
    const units = indices.map(
      (i) => attachmentEnergy(a, i, c.catalog, c.state).length,
    );
    const total = units.reduce((a, b) => a + b, 0);
    c.require(
      total >= cost && units.every((n) => total - n < cost),
      "Choose just enough Energy cards to pay the retreat cost.",
    );
    discardEnergy(c.state, c.player, a, indices);
  }
  L.darkDugtrioSinkhole(c, a);
  switchActive(c.player, intent.uid!);
  L.beforeKnockouts(c);
  checkKnockouts(c.state, c.catalog);
  c.player.retreated = true;
  log(
    c.state,
    `${c.player.name} retreated and promoted ${c.catalog[c.player.active!.card].name}.`,
  );
}
function discardDoll(c: EffectContext, intent: EffectIntent) {
  const doll = findPiece(c.player, intent.uid);
  c.require(
    doll && clefairyDollRules(doll.card).canDiscardVoluntarily,
    "Choose your Clefairy Doll in play.",
  );
  discardAttachments(c.state, c.player, doll);
  c.player.discard.push({ uid: doll.uid, card: doll.card });
  removePiece(c.player, doll);
  log(
    c.state,
    `${c.player.name} discarded Clefairy Doll. No Prize is awarded.`,
  );
  checkKnockouts(c.state, c.catalog);
}

function play(c: EffectContext, intent: EffectIntent) {
  const i = c.player.hand.findIndex((h) => h.uid === intent.uid);
  c.require(i >= 0, "That card is no longer in your hand.");
  const h = c.player.hand[i],
    card = c.catalog[h.card];
  if (card.supertype === "Energy") {
    c.require(
      !c.player.energyPlayed || intent.manual,
      "You have attached your Energy for this turn.",
    );
    const target = findPiece(c.player, intent.target);
    c.require(target, "Choose a Pokémon to receive this Energy.");
    const blaine =
      c.player.rules?.blaineTurn === c.state.turn &&
      R.pokemonCard(c.state, target, c.catalog).name.includes("Blaine") &&
      card.name === "Fire Energy";
    c.player.hand.splice(i, 1);
    c.attachEnergy(target, h);
    c.player.energyPlayed = true;
    if (blaine) {
      const extra = c.chooseCards(
        "blaine-extra",
        "Attach one additional Fire Energy to the same Pokémon",
        c.player.hand.filter((h) => c.catalog[h.card].name === "Fire Energy"),
        0,
        1,
      );
      for (const e of extra) {
        c.player.hand.splice(
          c.player.hand.findIndex((h) => h.uid === e.uid),
          1,
        );
        c.attachEnergy(target, e);
      }
    }
    log(c.state, `${c.player.name} attached ${card.name}.`, "energy");
    effect(c.state, "energy", "Energy attached");
  } else if (card.supertype === "Pokémon") {
    const target = findPiece(c.player, intent.target);
    const evolving =
      target && R.evolvesInto(R.pokemonCard(c.state, target, c.catalog), card);
    if (R.startingPokemon(card) && !evolving) {
      c.require(
        c.player.bench.length < R.narrowGym(c.state),
        "Your Bench is full.",
      );
      c.player.hand.splice(i, 1);
      const p = O.piece(h, c.state.turn);
      c.player.bench.push(p);
      L.onPokemonPlayed(c, p, true, true);
      log(c.state, `${c.player.name} played ${card.name}.`);
    } else {
      c.require(
        target && evolving,
        `Choose ${card.evolvesFrom || "the matching Baby Pokémon"} to evolve.`,
      );
      const giovanni = target.powerUsed?.Giovanni === c.state.turn;
      c.require(
        giovanni ||
          (c.player.turns >= 2 &&
            target.entered < c.state.turn &&
            target.evolved < c.state.turn),
        "This Pokémon must wait before evolving.",
      );
      c.player.hand.splice(i, 1);
      O.evolvePiece(c, target, h);
      L.onPokemonPlayed(c, target, true, false);
      log(c.state, `${c.player.name} evolved into ${card.name}.`);
      effect(c.state, "evolve", card.name);
    }
  } else c.require(false, "Use the Trainer effect to play this card.");
  L.beforeKnockouts(c);
  checkKnockouts(c.state, c.catalog);
}
function end(c: EffectContext) {
  nextTurn(c.state, c.catalog, c.answers);
}
function stadium(c: EffectContext) {
  L.activateStadium(c);
  L.beforeKnockouts(c);
  checkKnockouts(c.state, c.catalog);
}
function revealPiece(c: EffectContext, intent: EffectIntent) {
  const p = findPiece(c.player, intent.uid);
  c.require(p?.faceDown, "Choose a face-down Pokémon.");
  L.revealFaceDown(c, p);
  checkKnockouts(c.state, c.catalog);
}

/** Replayable, atomic resolution: selecting a target never partially pays a cost or rerolls a coin. */
export function resolveEffect(
  state: GameState,
  intent: EffectIntent,
  catalog: Catalog,
  answers: Answers = {},
  resolution = `effect-${state.seq}`,
): { state: GameState; error?: string } {
  const working = structuredClone(state);
  delete working.pending;
  const p = working.players.find((p) => p.id === intent.player);
  if (!p) return { state, error: "Join this table first." };
  const ctx = new EffectContext(working, catalog, p, answers);
  working.resolving = { player: p.id, kind: intent.action };
  try {
    ({
      attack,
      trainer,
      power,
      retreat,
      discardDoll,
      play,
      end,
      stadium,
      revealPiece,
    })[intent.action](ctx, intent);
    delete working.resolving;
    return { state: working };
  } catch (error) {
    if (error instanceof NeedsChoice)
      return {
        state: {
          ...state,
          pending: { id: resolution, intent, answers, choice: error.choice },
        },
      };
    if (error instanceof EffectError) return { state, error: error.message };
    throw error;
  }
}
