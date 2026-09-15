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
  discardEnergy,
  flip,
  log,
  switchActive,
  random,
} from "../game-core";
import {
  attachmentEnergy,
  cardProvidesEnergy,
  surplusEnergy,
} from "./base-set/energy";
import {
  clefairyDollRules,
  defenderReduction,
  plusPowerBonus,
} from "./base-set/modifiers";

import * as R from "./classic/state";
import { revealFaceDown } from "./classic/lifecycle";
import * as D from "./classic/damage";
import { attachEnergy as attach } from "./classic/energy";

export class EffectError extends Error {}
export class NeedsChoice extends Error {
  constructor(public choice: EffectChoice) {
    super(choice.title);
  }
}
export type Answers = Record<string, string[]>;

/** Effects mutate a disposable transaction. The engine commits only after every choice is valid. */
export class EffectContext {
  endsTurn = false;
  choicePrefix = "";
  random() {
    return random(this.state);
  }
  applyCondition(p: Piece, name: string, poison = 10) {
    D.applyCondition(this, p, name, poison);
  }
  powerDamage(source: Piece, target: Piece, amount: number, wr = false) {
    return D.powerDamage(this, source, target, amount, wr);
  }
  attachEnergy(p: Piece, h: HandCard, fromHand = true) {
    attach(this, p, h, fromHand);
  }
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
  chooseText(
    key: string,
    title: string,
    player = this.player.id,
    referenceCard?: string,
  ): string {
    key = this.choicePrefix + key;
    const a = this.answers[key];
    if (a !== undefined) {
      this.require(
        a.length === 1 &&
          typeof a[0] === "string" &&
          a[0].trim().length > 0 &&
          a[0].length <= 80,
        "Enter a short answer.",
      );
      return a[0].trim();
    }
    throw new NeedsChoice({
      key,
      title,
      player,
      options: [],
      min: 1,
      max: 1,
      input: true,
      referenceCard,
    });
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
    key = this.choicePrefix + key;
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
      const units = attachmentEnergy(p, i, this.catalog, this.state);
      return !type || cardProvidesEnergy(p, i, type, this.catalog, this.state)
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
  defender: Piece;
  ignoreResistance = false;
  ignoreDefenses = false;
  shadowRolls = new Map<string, boolean>();
  transparencyRolls = new Map<string, boolean>();
  fled = new Set<string>();
  startingConditions = new Map<string, string[]>();
  coinResults: boolean[] = [];
  rerollSkip = 0;
  private costStep = 0;
  selfStatus(name: string) {
    this.applyCondition(this.attacker, name);
  }
  readonly previousAttack?: AttackResult;
  readonly awakePowers: Set<string>;
  readonly damageDone = new Map<string, number>();
  copying = false;
  copyDepth = 0;
  private begun?: boolean;
  damage = 0;
  vermilionBonus = 0;
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
    this.startingConditions = new Map(
      state.players.flatMap(allPieces).map((p) => [p.uid, [...p.conditions]]),
    );
    this.awakePowers = new Set(
      state.players
        .flatMap(allPieces)
        .filter((p) => R.powerOn(state, p, catalog))
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
      this.attacker.damage += D.darkPrimeapeFrenzy(this, 30);
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
    while (this.rerollSkip > 0) {
      flip(this.state);
      this.rerollSkip--;
    }
    const result = flip(this.state);
    this.coinResults.push(result);
    return result;
  }
  payEnergy(count: number, type?: string) {
    if (this.copying) return;
    const indices = this.chooseEnergy(
      `attack-cost${this.costStep++ ? "-" + this.costStep : ""}`,
      `Discard ${count} ${type || ""} Energy card${count === 1 ? "" : "s"}`,
      this.attacker,
      count,
      count,
      type,
    );
    discardEnergy(this.state, this.player, this.attacker, indices);
  }
  effectsBlocked(target = this.defender) {
    if (this.ignoreDefenses) return false;
    return (
      this.fled.has(target.uid) ||
      (target.effects?.preventAllUntil ?? -1) >= this.state.turn ||
      D.haunterTransparency(this, target)
    );
  }
  record(target = this.defender) {
    if (target.lastAttack?.turn !== this.state.turn)
      target.lastAttack = { turn: this.state.turn, damage: 0, conditions: [] };
    return target.lastAttack;
  }
  hit(base: number, target = this.defender, applyWeakness = true) {
    if (target.faceDown && !revealFaceDown(this, target)) return 0;
    let amount = Math.max(0, base);
    const opposing = allPieces(this.opponent).includes(target);
    const isDefender = target.uid === this.defender.uid;
    amount = D.attackBase(this, target, amount);
    if (amount > 0 && applyWeakness && !this.ignoreDefenses)
      amount = D.weaknessResistance(
        this,
        this.attacker,
        target,
        amount,
        this.ignoreResistance,
      );
    if (isDefender && amount > 0) {
      amount +=
        plusPowerBonus(this.attacker, this.state.turn, amount) +
        D.darknessEnergyBonus(this.attacker);
      if (
        (this.player.rules?.mistyTurn ?? -1) === this.state.turn &&
        R.pokemonCard(this.state, this.attacker, this.catalog).name.includes(
          "Misty",
        )
      )
        amount += this.player.rules?.mistyBonus || 20;
      const screech = R.mark(this.state, target, "screech");
      if (screech && !this.ignoreDefenses) amount += screech.value || 20;
      if (this.vermilionBonus) amount += this.vermilionBonus;
    }
    if (!this.ignoreDefenses) {
      amount = Math.max(0, amount - defenderReduction(target, this.state.turn));
      amount = D.attackDefenses(this, target, amount);
      if (
        this.effectsBlocked(target) ||
        (target.effects?.preventDamageUntil ?? -1) >= this.state.turn ||
        target.shield >= this.state.turn ||
        ((target.effects?.hardenUntil ?? -1) >= this.state.turn && amount <= 30)
      )
        amount = 0;
      amount = D.brockRhydonBenchGuard(this, target, amount);
    }
    target.damage += amount;
    if (opposing) {
      this.record(target).damage += amount;
      this.damageDone.set(
        target.uid,
        (this.damageDone.get(target.uid) || 0) + amount,
      );
    }
    this.reaction(this, target, amount);
    if (isDefender) this.damage += amount;
    return amount;
  }
  recoil(amount: number) {
    this.hit(
      R.mark(this.state, this.attacker, "doubleRecoil") ? amount * 2 : amount,
      this.attacker,
    );
  }
  status(name: string, poisonDamage = 10) {
    if (
      this.effectsBlocked() ||
      clefairyDollRules(this.defender.card).immuneToConditions
    )
      return;
    this.applyCondition(this.defender, name, poisonDamage);
    if (!this.defender.conditions.includes(name)) return;
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
      R.switchingBlocked(this.state, this.opponent) ||
      this.opponent.active?.uid !== this.defender.uid ||
      this.defender.damage >=
        R.maximumHP(this.state, this.defender, this.catalog)
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
  waterBonus() {
    const paid = this.copying
      ? R.pokemonCard(this.state, this.attacker, this.catalog).attacks.find(
          (a) => a.name === "Metronome",
        ) || this.attack
      : this.attack;
    return (
      10 *
      Math.min(
        2,
        surplusEnergy(this.attacker, paid, "Water", this.catalog, this.state),
      )
    );
  }
}
