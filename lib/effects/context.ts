import type {
  Attack,
  AttackResult,
  Card,
  Catalog,
  ChoiceOption,
  EffectChoice,
  GameState,
  HandCard,
  Piece,
  Player,
} from "../game-types";
import {
  allPieces,
  condition,
  discardEnergy,
  flip,
  log,
  switchActive,
} from "../game-core";
import { attachmentEnergy, providedEnergy } from "./base-set/energy";
import {
  clefairyDollRules,
  defenderReduction,
  plusPowerBonus,
} from "./base-set/modifiers";

export class EffectError extends Error {}
export class NeedsChoice extends Error {
  constructor(public choice: EffectChoice) {
    super(choice.title);
  }
}
export type Answers = Record<string, string[]>;

/** Effects mutate a disposable transaction. The engine commits only after every choice is valid. */
export class EffectContext {
  constructor(
    public state: GameState,
    public catalog: Catalog,
    public player: Player,
    public answers: Answers = {},
  ) {}
  get opponent() {
    return this.state.players.find((p) => p.id !== this.player.id)!;
  }
  require(ok: unknown, message: string): asserts ok {
    if (!ok) throw new EffectError(message);
  }
  choose(
    key: string,
    title: string,
    options: ChoiceOption[],
    min = 1,
    max = min,
    player = this.player.id,
    ordered = false,
  ): string[] {
    this.require(options.length >= min, `No valid choice: ${title}`);
    max = Math.min(max, options.length);
    const answer = this.answers[key];
    if (answer !== undefined) {
      this.require(
        Array.isArray(answer) &&
          answer.length >= min &&
          answer.length <= max &&
          new Set(answer).size === answer.length &&
          answer.every((v) => options.some((o) => o.value === v)),
        "Choose the required number of valid, different options.",
      );
      return answer;
    }
    if (!ordered && options.length === min) return options.map((o) => o.value);
    if (max === 0) return [];
    throw new NeedsChoice({ key, title, options, min, max, player, ordered });
  }
  choosePiece(
    key: string,
    title: string,
    pieces: Piece[],
    player = this.player.id,
  ) {
    const [uid] = this.choose(
      key,
      title,
      pieces.map((p) => ({
        value: p.uid,
        card: p.card,
        label: `${this.catalog[p.card].name} · ${Math.max(0, this.catalog[p.card].hp - p.damage)} HP · ${p.energy.length} Energy${this.state.players.some((q) => q.active?.uid === p.uid) ? " · Active" : " · Bench"}`,
      })),
      1,
      1,
      player,
    );
    return pieces.find((p) => p.uid === uid)!;
  }
  chooseCards(
    key: string,
    title: string,
    cards: HandCard[],
    min = 1,
    max = min,
    ordered = false,
  ) {
    const ids = this.choose(
      key,
      title,
      cards.map((h) => ({
        value: h.uid,
        label: this.catalog[h.card].name,
        card: h.card,
      })),
      min,
      max,
      this.player.id,
      ordered,
    );
    return ids.map((uid) => cards.find((h) => h.uid === uid)!);
  }
  chooseEnergy(
    key: string,
    title: string,
    p: Piece,
    min = 1,
    max = min,
    type?: string,
  ) {
    const options = p.energy.flatMap((card, i) => {
      const units = attachmentEnergy(p, i, this.catalog);
      return !type || units.includes(type)
        ? [
            {
              value: String(i),
              card,
              label: `${this.catalog[card].name} · ${units.join(" + ")}`,
            },
          ]
        : [];
    });
    this.require(
      options.length >= min,
      `Attach ${min} ${type || ""} Energy card${min === 1 ? "" : "s"} first.`,
    );
    // Interchangeable copies need no extra click; different Energy always stays a choice.
    if (
      this.answers[key] === undefined &&
      min === max &&
      options.length &&
      options.every((o) => o.label === options[0].label)
    )
      return options.slice(0, min).map((o) => +o.value);
    return this.choose(key, title, options, min, max).map(Number);
  }
  reveal(title: string, cards: HandCard[]) {
    this.state.reveals = [
      ...(this.state.reveals || []),
      { id: this.state.seq, title, cards: cards.map((c) => c.card) },
    ].slice(-8);
    log(
      this.state,
      `${title}: ${cards.map((c) => this.catalog[c.card].name).join(", ") || "empty hand"}.`,
      "reveal",
    );
  }
  discardHand(cards: HandCard[]) {
    const ids = new Set(cards.map((c) => c.uid));
    this.player.hand = this.player.hand.filter((c) => !ids.has(c.uid));
    this.player.discard.push(...cards);
  }
}

export type AttackHandler = (ctx: AttackContext) => void;
export type DamageReaction = (
  ctx: AttackContext,
  target: Piece,
  amount: number,
) => void;

export class AttackContext extends EffectContext {
  readonly attacker: Piece;
  readonly defender: Piece;
  readonly previousAttack?: AttackResult;
  readonly awakePowers: Set<string>;
  readonly damageDone = new Map<string, number>();
  copying = false;
  copyDepth = 0;
  private begun?: boolean;
  damage = 0;
  constructor(
    state: GameState,
    catalog: Catalog,
    player: Player,
    answers: Answers,
    public attack: Attack,
    public printedCard: Card,
    public resolveAttack: (
      card: Card,
      index: number,
    ) => AttackHandler | undefined,
    public reaction: DamageReaction,
  ) {
    super(state, catalog, player, answers);
    this.attacker = player.active!;
    this.defender = this.opponent.active!;
    this.previousAttack = this.attacker.lastAttack;
    this.awakePowers = new Set(
      state.players
        .flatMap(allPieces)
        .filter(
          (p) =>
            !p.conditions.some((c) =>
              ["Asleep", "Confused", "Paralyzed"].includes(c),
            ),
        )
        .map((p) => p.uid),
    );
  }
  begin() {
    if (this.begun !== undefined) return this.begun;
    this.begun = true;
    // These checks happen after attack costs; failures still consume the turn and costs.
    if (
      (this.attacker.effects?.sandAttackUntil ?? -1) >= this.state.turn &&
      !flip(this.state)
    ) {
      log(this.state, "Sand-attack made the attack miss.", "attack");
      return (this.begun = false);
    }
    if (this.attacker.conditions.includes("Confused") && !flip(this.state)) {
      this.attacker.damage += 30;
      log(
        this.state,
        `${this.catalog[this.attacker.card].name} hurt itself in confusion.`,
        "attack",
      );
      return (this.begun = false);
    }
    this.defender.lastAttack = {
      turn: this.state.turn,
      damage: 0,
      conditions: [],
    };
    return true;
  }
  coin() {
    return flip(this.state);
  }
  payEnergy(count: number, type?: string) {
    if (this.copying) return;
    const indices = this.chooseEnergy(
      "attack-cost",
      `Discard ${count} ${type || ""} Energy card${count === 1 ? "" : "s"}`,
      this.attacker,
      count,
      count,
      type,
    );
    discardEnergy(this.state, this.player, this.attacker, indices);
  }
  effectsBlocked(target = this.defender) {
    return (target.effects?.preventAllUntil ?? -1) >= this.state.turn;
  }
  record(target = this.defender) {
    if (target.lastAttack?.turn !== this.state.turn)
      target.lastAttack = { turn: this.state.turn, damage: 0, conditions: [] };
    return target.lastAttack;
  }
  hit(base: number, target = this.defender, applyWeakness = true) {
    let amount = Math.max(0, base);
    const attacking = this.catalog[this.attacker.card];
    const defending = this.catalog[target.card];
    const opposing = allPieces(this.opponent).includes(target);
    const isDefender = target.uid === this.defender.uid;
    if (amount > 0 && applyWeakness) {
      const weak = target.effects?.weakness
        ? {
            type: target.effects.weakness,
            value: defending.weaknesses[0]?.value || "×2",
          }
        : defending.weaknesses.find((w) => attacking.types.includes(w.type));
      const resist = target.effects?.resistance
        ? { type: target.effects.resistance, value: "-30" }
        : defending.resistances.find((w) => attacking.types.includes(w.type));
      if (weak && attacking.types.includes(weak.type))
        amount = weak.value.includes("×")
          ? amount * (Number(weak.value.replace("×", "")) || 2)
          : amount + Number(weak.value);
      if (resist && attacking.types.includes(resist.type))
        amount = Math.max(0, amount + Number(resist.value));
    }
    if (isDefender)
      amount += plusPowerBonus(this.attacker, this.state.turn, amount);
    amount = Math.max(0, amount - defenderReduction(target, this.state.turn));
    if (
      this.effectsBlocked(target) ||
      (target.effects?.preventDamageUntil ?? -1) >= this.state.turn ||
      target.shield >= this.state.turn ||
      ((target.effects?.hardenUntil ?? -1) >= this.state.turn && amount <= 30)
    )
      amount = 0;
    target.damage += amount;
    if (opposing) {
      this.record(target).damage += amount;
      this.damageDone.set(
        target.uid,
        (this.damageDone.get(target.uid) || 0) + amount,
      );
      this.reaction(this, target, amount);
    }
    if (isDefender) this.damage += amount;
    return amount;
  }
  recoil(amount: number) {
    this.hit(amount, this.attacker);
  }
  status(name: string, poisonDamage = 10) {
    if (
      this.effectsBlocked() ||
      clefairyDollRules(this.defender.card).immuneToConditions
    )
      return;
    condition(this.defender, name);
    const result = this.record();
    result.conditions.push(name);
    if (name === "Poisoned") {
      this.defender.effects!.poisonDamage = poisonDamage;
      result.poisonDamage = poisonDamage;
    }
  }
  protect(
    kind:
      | "preventDamageUntil"
      | "preventAllUntil"
      | "hardenUntil"
      | "destinyBondUntil",
  ) {
    this.attacker.effects ||= {};
    this.attacker.effects[kind] = this.state.turn + 1;
  }
  discardDefenderEnergy(count = 1) {
    if (this.effectsBlocked() || !this.defender.energy.length) return;
    const n = Math.min(count, this.defender.energy.length);
    const chosen = this.chooseEnergy(
      "defender-energy",
      "Choose the opponent’s Energy to discard",
      this.defender,
      n,
      n,
    );
    discardEnergy(this.state, this.opponent, this.defender, chosen);
    this.record().discardedEnergy = n;
  }
  forceSwitch(opponentChooses: boolean) {
    if (
      this.effectsBlocked() ||
      !this.opponent.bench.length ||
      this.defender.damage >= this.catalog[this.defender.card].hp
    )
      return;
    const target = this.choosePiece(
      "force-switch",
      "Choose the new Active Pokémon",
      this.opponent.bench,
      opponentChooses ? this.opponent.id : this.player.id,
    );
    switchActive(this.opponent, target.uid);
    log(
      this.state,
      `${this.opponent.name} switched to ${this.catalog[target.card].name}.`,
    );
  }
  waterBonus(cost: number) {
    const water = providedEnergy(this.attacker, this.catalog).filter(
      (t) => t === "Water",
    ).length;
    // Water used for a Colorless cost is only surplus when other Energy can cover that cost.
    const units = providedEnergy(this.attacker, this.catalog).length;
    const required = this.copying
      ? this.catalog[this.attacker.card].attacks.find(
          (a) => a.name === "Metronome",
        )?.cost.length || 3
      : this.attack.cost.length;
    return (
      10 *
      Math.min(
        2,
        Math.max(
          0,
          Math.min(water - (this.copying ? 0 : cost), units - required),
        ),
      )
    );
  }
}
