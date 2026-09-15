import type { Catalog, GameState, Piece } from "../../game-types";
import type { AttackContext, EffectContext } from "../context";
import * as R from "./state";
import * as O from "./operations";
import { condition, discardEnergy, flip } from "../../game-core";

export function metalEnergyReduction(p: Piece) {
  return 10 * p.energy.filter((id) => id === "neo1-19").length;
}
export function darknessEnergyBonus(p: Piece) {
  return 10 * p.energy.filter((id) => id === "neo1-104").length;
}
export function thickSkinned(s: GameState, p: Piece, catalog: Catalog) {
  return R.powerOn(s, p, catalog, "Thick Skinned");
}
export function applyCondition(
  c: EffectContext,
  p: Piece,
  name: string,
  poison = 10,
) {
  if (
    thickSkinned(c.state, p, c.catalog) ||
    R.mark(c.state, p, "conditionGuard")
  )
    return;
  condition(p, name);
  if (name === "Poisoned" && p.conditions.includes(name))
    (p.effects ||= {}).poisonDamage = poison;
  if ((p.shape || p.shapeAttachments?.length) && !R.awake(p)) {
    R.ownerOf(c.state, p).discard.push(
      ...(p.shapeAttachments || (p.shape ? [p.shape] : [])),
    );
    delete p.shape;
    delete p.shapeAttachments;
  }
}
export function weaknessResistance(
  c: EffectContext,
  source: Piece,
  target: Piece,
  amount: number,
  ignoreResistance = false,
  attack = true,
) {
  const a = R.pokemonCard(c.state, source, c.catalog),
    b = R.pokemonCard(c.state, target, c.catalog);
  const weak = target.effects?.weakness
    ? [{ type: target.effects.weakness, value: b.weaknesses[0]?.value || "×2" }]
    : b.weaknesses;
  const resist = target.effects?.resistance
    ? [{ type: target.effects.resistance, value: "-30" }]
    : b.resistances;
  const stadium = attack ? c.state.stadium?.card : undefined;
  if (
    !(
      stadium === "gym2-113" &&
      a.types.includes("Water") &&
      b.name.includes("Blaine")
    )
  )
    for (const w of weak)
      if (a.types.includes(w.type)) {
        amount = w.value.includes("×")
          ? amount * (Number(w.value.replace("×", "")) || 2)
          : amount + Number(w.value);
        break;
      }
  if (
    !ignoreResistance &&
    !(stadium === "gym1-115" && a.name.includes("Brock"))
  )
    for (const r of resist)
      if (a.types.includes(r.type)) {
        amount += Math.min(
          0,
          Number(r.value) + (stadium === "gym2-109" ? 20 : 0),
        );
        break;
      }
  return Math.max(0, amount);
}
export function powerDamage(
  c: EffectContext,
  source: Piece,
  target: Piece,
  amount: number,
  wr = false,
  suppressShock = false,
) {
  if (!R.pokemonCard(c.state, source, c.catalog).types.includes("Metal"))
    amount = Math.max(0, amount - metalEnergyReduction(source));
  if (wr) amount = weaknessResistance(c, source, target, amount, false, false);
  amount = Math.max(0, amount - metalEnergyReduction(target));
  target.damage += amount;
  if (
    amount > 0 &&
    !suppressShock &&
    R.ownerOf(c.state, target)?.active === target &&
    R.powerOn(c.state, target, c.catalog, "Shock Blast") &&
    !flip(c.state)
  ) {
    for (const owner of c.state.players)
      if (owner.active) powerDamage(c, target, owner.active, 20, false, true);
  }
  return amount;
}
export function mrMimeInvisibleWall(amount: number) {
  return amount >= 30 ? 0 : amount;
}
export function kabutoArmor(amount: number) {
  return Math.floor(amount / 20) * 10;
}
export function erikaDratiniStrangeBarrier(amount: number, basic: boolean) {
  return basic && amount >= 20 ? 10 : amount;
}
export function mistyCloysterShellArmor(amount: number) {
  return Math.max(0, amount - 10);
}
export function erikaIvysaurRelaxingScent(amount: number) {
  return Math.ceil(amount / 20) * 10;
}
export function sproutTower(c: AttackContext, amount: number) {
  return c.state.stadium?.card === "neo1-97" &&
    R.pokemonCard(c.state, c.attacker, c.catalog).types.includes("Colorless")
    ? Math.max(0, amount - 30)
    : amount;
}
export function darkPrimeapeFrenzy(c: AttackContext, amount: number) {
  return amount > 0 &&
    R.powerOn(c.state, c.attacker, c.catalog, "Frenzy") &&
    c.attacker.conditions.includes("Confused")
    ? amount + 30
    : amount;
}
export function attackBase(c: AttackContext, target: Piece, amount: number) {
  const m = R.mark(c.state, c.attacker, "doubleDamage");
  const n = R.mark(c.state, c.attacker, "nextDamage");
  if (target === c.defender) {
    if (n?.name === c.attack.name) amount = n.value || amount;
    if (m?.name === c.attack.name) amount *= m.value || 2;
    if (R.mark(c.state, c.attacker, "giantGrowth") && c.attack.name === "Pound")
      amount = 30;
    if (
      R.powerOn(c.state, c.attacker, c.catalog, "Final Blow") &&
      R.maximumHP(c.state, c.attacker, c.catalog) - c.attacker.damage <= 20 &&
      c.attack.name === "Megahorn" &&
      O.optional(c, "final-blow", "Use Final Blow for 120 base damage?")
    )
      amount = 120;
    if (
      R.powerOn(c.state, c.attacker, c.catalog, "Hydroelectric Power") &&
      c.attack.name === "Floodlight" &&
      O.optional(c, "hydroelectric", "Add Hydroelectric Power damage?")
    )
      amount +=
        10 *
        Math.max(
          0,
          Math.min(
            O.energyCount(c, c.attacker, "Water"),
            O.energyCount(c, c.attacker) - c.attack.cost.length,
          ),
        );
  }
  amount = darkPrimeapeFrenzy(c, amount);
  if (!R.pokemonCard(c.state, c.attacker, c.catalog).types.includes("Metal"))
    amount = Math.max(0, amount - metalEnergyReduction(c.attacker));
  const before = R.mark(c.state, c.attacker, "reduceBefore");
  if (before?.source === target.uid)
    amount = Math.max(0, amount - (before.value || 0));
  return amount;
}
export function attackDefenses(
  c: AttackContext,
  target: Piece,
  amount: number,
) {
  const s = c.state;
  const own = R.ownerOf(s, target);
  const active = own?.active === target;
  amount = Math.max(0, amount - metalEnergyReduction(target));
  amount = sproutTower(c, amount);
  if (!active && (own?.rules?.benchGuardUntil ?? -1) >= s.turn) amount = 0;
  const reduce = R.mark(s, target, "reduceDamage");
  if (reduce) amount = Math.max(0, amount - (reduce.value || 0));
  const linked = R.mark(s, c.attacker, "reduceAgainst");
  if (linked?.source === target.uid)
    amount = Math.max(0, amount - (linked.value || 0));
  if (R.mark(s, target, "halveDamage")) amount = kabutoArmor(amount);
  if (R.powerOn(s, target, c.catalog, "Invisible Wall"))
    amount = mrMimeInvisibleWall(amount);
  if (R.powerOn(s, target, c.catalog, "Kabuto Armor"))
    amount = kabutoArmor(amount);
  if (R.powerOn(s, target, c.catalog, "Strange Barrier"))
    amount = erikaDratiniStrangeBarrier(
      amount,
      R.startingPokemon(R.pokemonCard(s, c.attacker, c.catalog)),
    );
  if (
    R.powerOn(s, target, c.catalog, "Shell Armor") &&
    amount &&
    O.optional(
      c,
      `shell-armor-${target.uid}`,
      "Reduce damage with Shell Armor?",
      own.id,
    )
  )
    amount = mistyCloysterShellArmor(amount);
  // Multiple copies do not repeatedly halve a single simultaneous damage event.
  if (
    R.providers(s, c.catalog, "Relaxing Scent").some(
      (p) => R.ownerOf(s, p).active === p,
    )
  )
    amount = erikaIvysaurRelaxingScent(amount);
  if (R.mark(s, target, "shadowImages")) {
    if (!c.shadowRolls.has(target.uid)) c.shadowRolls.set(target.uid, flip(s));
    if (!c.shadowRolls.get(target.uid)) amount = 0;
  }
  if (target === c.defender && amount > 0) {
    const charity = (c.attacker.trainerAttachments || []).some(
      (t) => t.card === "gym1-99",
    );
    if (charity)
      amount -=
        10 *
        O.numberChoice(
          c,
          "charity",
          "How many damage counters should Charity prevent?",
          Math.floor(amount / 10),
        );
  }
  return amount;
}
export function haunterTransparency(c: AttackContext, target: Piece) {
  if (!R.powerOn(c.state, target, c.catalog, "Transparency")) return false;
  if (!c.transparencyRolls.has(target.uid))
    c.transparencyRolls.set(target.uid, flip(c.state));
  return !!c.transparencyRolls.get(target.uid);
}
export function brockRhydonBenchGuard(
  c: AttackContext,
  target: Piece,
  amount: number,
) {
  const owner = R.ownerOf(c.state, target);
  if (!owner?.bench.includes(target) || amount < 10) return amount;
  const guards = R.providers(c.state, c.catalog, "Bench Guard", owner).filter(
    (p) => owner.bench.includes(p) && p.uid !== target.uid,
  );
  const [id] = c.choose(
    `bench-guard-${target.uid}`,
    "Redirect 10 damage with Bench Guard?",
    guards.map((p) => ({
      value: p.uid,
      label: c.catalog[p.card].name,
      card: p.card,
    })),
    0,
    1,
    owner.id,
  );
  if (id) {
    const guard = guards.find((p) => p.uid === id)!;
    guard.damage += 10;
    c.record(guard).damage += 10;
    c.damageDone.set(id, (c.damageDone.get(id) || 0) + 10);
    return amount - 10;
  }
  return amount;
}
export function erikaVileplumePollenDefense(c: AttackContext, target: Piece) {
  if (c.opponent.active === target && flip(c.state))
    applyCondition(c, c.attacker, "Confused");
}
export function rocketSnorlaxRestlessSleep(c: AttackContext, target: Piece) {
  if (c.startingConditions.get(target.uid)?.includes("Asleep"))
    powerDamage(c, target, c.attacker, 20);
}
export function kogaMukEnergyDrain(c: AttackContext, target: Piece) {
  if (flip(c.state) && c.attacker.energy.length) {
    const ix = O.forPlayer(c, c.opponent).chooseEnergy(
      `drain-${target.uid}`,
      "Discard an attacking Energy card",
      c.attacker,
    );
    discardEnergy(c.state, c.player, c.attacker, ix, {
      player: c.opponent.id,
      kind: "power",
    });
  }
}
export function surgeElectrodeShockBlast(c: AttackContext, target: Piece) {
  if (R.ownerOf(c.state, target).active === target && !flip(c.state))
    for (const p of c.state.players)
      if (p.active) powerDamage(c, target, p.active, 20, false, true);
}
export function mistyTentacruelFlee(c: AttackContext, target: Piece) {
  if (
    c.opponent.active !== target ||
    !c.opponent.bench.length ||
    R.switchingBlocked(c.state, c.opponent) ||
    target.damage >= R.maximumHP(c.state, target, c.catalog)
  )
    return;
  if (
    O.optional(
      c,
      `flee-${target.uid}`,
      "Use Flee to switch and prevent the remaining effects?",
      c.opponent.id,
    )
  ) {
    const p = c.choosePiece(
      `flee-target-${target.uid}`,
      "Choose your new Active Pokémon",
      c.opponent.bench,
      c.opponent.id,
    );
    O.switchPokemon(c, c.opponent, p);
    c.fled.add(target.uid);
  }
}
export function mirrorShell(c: AttackContext, target: Piece, amount: number) {
  powerDamage(c, target, c.attacker, amount, true);
}
export function crosscounter(c: AttackContext, target: Piece, amount: number) {
  if (flip(c.state)) powerDamage(c, target, c.attacker, 2 * amount, true);
}
export function fireWall(c: AttackContext, target: Piece) {
  powerDamage(c, target, c.attacker, 10, true);
}
export function attackReaction(
  c: AttackContext,
  target: Piece,
  amount: number,
) {
  if (amount <= 0) return;
  if (R.mark(c.state, target, "shadowImages"))
    delete target.marks!.shadowImages;
  if (
    c.awakePowers.has(target.uid) &&
    R.powerOn(c.state, target, c.catalog, "Shock Blast")
  )
    surgeElectrodeShockBlast(c, target);
  if (
    !R.ownerOf(c.state, target) ||
    R.ownerOf(c.state, target).id === c.player.id
  )
    return;
  if (c.awakePowers.has(target.uid)) {
    const has = (name: string) =>
      R.abilityCards(c.state, target, c.catalog).some((card) =>
        card.abilities.some((a) => a.name === name),
      );
    if (has("Strikes Back")) powerDamage(c, target, c.attacker, 10);
    if (has("Pollen Defense")) erikaVileplumePollenDefense(c, target);
    if (has("Restless Sleep")) rocketSnorlaxRestlessSleep(c, target);
    if (has("Energy Drain")) kogaMukEnergyDrain(c, target);
    if (has("Flee")) mistyTentacruelFlee(c, target);
  }
  if (R.mark(c.state, target, "mirrorShell")) mirrorShell(c, target, amount);
  if (R.mark(c.state, target, "crosscounter")) crosscounter(c, target, amount);
  if (R.mark(c.state, target, "fireWall")) fireWall(c, target);
}
export function giovanniMachampFortitude(c: AttackContext, target: Piece) {
  return (
    c.awakePowers.has(target.uid) &&
    R.abilityCards(c.state, target, c.catalog).some((card) =>
      card.abilities.some((a) => a.name === "Fortitude"),
    ) &&
    flip(c.state)
  );
}
export function focusBand(c: AttackContext, target: Piece) {
  const i = target.tools.indexOf("neo1-86");
  if (i < 0) return false;
  if (!flip(c.state)) return false;
  R.ownerOf(c.state, target).discard.push({
    uid: `${target.uid}-focus-${c.state.seq}`,
    card: target.tools.splice(i, 1)[0],
  });
  return true;
}
export function darkGyaradosFinalBeam(c: AttackContext, target: Piece) {
  if (flip(c.state))
    powerDamage(
      c,
      target,
      c.attacker,
      20 * O.energyCount(c, target, "Water"),
      true,
    );
}
export function preventAttackKnockouts(c: AttackContext) {
  for (const p of O.allPieces(c.opponent))
    if (
      p.damage >= R.maximumHP(c.state, p, c.catalog) &&
      (c.damageDone.get(p.uid) || 0) > 0
    ) {
      if (
        R.mark(c.state, p, "endure") ||
        giovanniMachampFortitude(c, p) ||
        focusBand(c, p)
      ) {
        p.damage = R.maximumHP(c.state, p, c.catalog) - 10;
        continue;
      }
      if (
        c.awakePowers.has(p.uid) &&
        R.abilityCards(c.state, p, c.catalog).some((card) =>
          card.abilities.some((a) => a.name === "Final Beam"),
        )
      )
        darkGyaradosFinalBeam(c, p);
    }
}
