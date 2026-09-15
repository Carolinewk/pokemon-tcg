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
import {
  BASE_POWERS,
  machampStrikesBack,
  powerAvailable,
} from "./effects/base-set/powers";
import { trainerHandler, TrainerContext } from "./effects/base-set/trainers";

function attack(c: EffectContext, intent: EffectIntent) {
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
  const card = c.catalog[a.card];
  const index = intent.index;
  c.require(
    Number.isInteger(index) && index! >= 0 && card.attacks[index!],
    "Choose an attack.",
  );
  const printed = card.attacks[index!];
  c.require(
    !(
      a.effects?.amnesia &&
      a.effects.amnesia.until >= c.state.turn &&
      a.effects.amnesia.name === printed.name
    ),
    `${printed.name} is disabled by Amnesia this turn.`,
  );
  c.require(canPay(a, printed, c.catalog), "Attach the required Energy first.");
  const handler = attackHandler(card, index!);
  const ctx = new AttackContext(
    c.state,
    c.catalog,
    c.player,
    c.answers,
    printed,
    card,
    attackHandler,
    machampStrikesBack,
  );
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
  // Destiny Bond reacts to the attack, never between-turn Poison or a later turn.
  for (const target of allPieces(c.opponent))
    if (
      (ctx.damageDone.get(target.uid) || 0) > 0 &&
      target.damage >= c.catalog[target.card].hp &&
      (target.effects?.destinyBondUntil ?? -1) >= c.state.turn
    ) {
      a.damage = Math.max(a.damage, c.catalog[a.card].hp);
      log(
        c.state,
        "Destiny Bond Knocked Out the attacking Pokémon.",
        "knockout",
      );
    }
  log(
    c.state,
    `${card.name} used ${printed.name} for ${ctx.damage} damage.`,
    "attack",
  );
  effect(c.state, "attack", `${printed.name} · ${ctx.damage}`);
  checkKnockouts(c.state, c.catalog);
  if (c.state.status === "playing") nextTurn(c.state, c.catalog);
}
function trainer(c: EffectContext, intent: EffectIntent) {
  const i = c.player.hand.findIndex((h) => h.uid === intent.uid);
  c.require(i >= 0, "That card is no longer in your hand.");
  const [source] = c.player.hand.splice(i, 1);
  const handler = trainerHandler(c.catalog[source.card]);
  c.require(handler, "This Trainer has no Base Set effect.");
  const ctx = new TrainerContext(
    c.state,
    c.catalog,
    c.player,
    c.answers,
    source,
    intent.target,
  );
  handler(ctx);
  if (!ctx.sourceHandled) c.player.discard.push(source);
  log(
    c.state,
    `${c.player.name} played ${c.catalog[source.card].name}.`,
    "trainer",
  );
  checkKnockouts(c.state, c.catalog);
}
function power(c: EffectContext, intent: EffectIntent) {
  const source = findPiece(c.player, intent.uid);
  c.require(source, "Choose one of your Pokémon in play.");
  const ability = BASE_POWERS[source.card];
  c.require(ability?.use, "This Pokémon has no activated Base Set Power.");
  c.require(
    powerAvailable(source),
    "This Power cannot be used while its Pokémon is Asleep, Confused, or Paralyzed.",
  );
  ability.use(c, source);
  log(c.state, `${c.catalog[source.card].name} used ${ability.name}.`, "power");
  effect(c.state, "energy", ability.name);
  checkKnockouts(c.state, c.catalog);
}
function retreat(c: EffectContext, intent: EffectIntent) {
  const a = c.player.active;
  c.require(a && a.card !== "base1-70", "This Pokémon cannot retreat.");
  c.require(!c.player.retreated, "You have already retreated this turn.");
  c.require(
    !a.conditions.some((x) => ["Asleep", "Paralyzed"].includes(x)),
    "An Asleep or Paralyzed Pokémon cannot retreat.",
  );
  c.require(
    c.player.bench.some((p) => p.uid === intent.uid),
    "Choose a Benched Pokémon.",
  );
  const cost = c.catalog[a.card].retreat;
  c.require(
    providedEnergy(a, c.catalog).length >= cost,
    `Retreat needs ${cost} Energy.`,
  );
  if (cost > 0) {
    const options = a.energy.map((card, i) => ({
      value: String(i),
      card,
      label: `${c.catalog[card].name} · ${attachmentEnergy(a, i, c.catalog).length} Energy`,
    }));
    const allSingle = options.every(
      (_, i) => attachmentEnergy(a, i, c.catalog).length === 1,
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
    const units = indices.map((i) => attachmentEnergy(a, i, c.catalog).length);
    const total = units.reduce((a, b) => a + b, 0);
    c.require(
      total >= cost && units.every((n) => total - n < cost),
      "Choose just enough Energy cards to pay the retreat cost.",
    );
    discardEnergy(c.state, c.player, a, indices);
  }
  switchActive(c.player, intent.uid!);
  c.player.retreated = true;
  log(
    c.state,
    `${c.player.name} retreated and promoted ${c.catalog[c.player.active!.card].name}.`,
  );
}
function discardDoll(c: EffectContext, intent: EffectIntent) {
  const doll = findPiece(c.player, intent.uid);
  c.require(doll?.card === "base1-70", "Choose your Clefairy Doll in play.");
  discardAttachments(c.state, c.player, doll);
  c.player.discard.push({ uid: doll.uid, card: doll.card });
  removePiece(c.player, doll);
  log(
    c.state,
    `${c.player.name} discarded Clefairy Doll. No Prize is awarded.`,
  );
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
  try {
    ({ attack, trainer, power, retreat, discardDoll })[intent.action](
      ctx,
      intent,
    );
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
