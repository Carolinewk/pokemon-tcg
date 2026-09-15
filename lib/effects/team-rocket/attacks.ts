import type { AttackContext, AttackHandler } from "../context";
import * as O from "../classic/operations";
import * as R from "../classic/state";
import * as B from "../base-set/attacks";

/** base5-1 · Teleport Blast */
export function darkAlakazam1TeleportBlast0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.switchSelf(c, true);
}

/** base5-1 · Mind Shock */
export function darkAlakazam1MindShock1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40, c.defender, false);
}

/** base5-2 · Stare */
export function darkArbok2Stare0(c: AttackContext) {
  if (!c.begin()) return;
  const p = c.choosePiece("stare", "Choose a Pokémon", O.allPieces(c.opponent));
  c.hit(10, p, false);
  if (!c.effectsBlocked(p)) O.putMark(c, p, "powerOff");
}

/** base5-2 · Poison Vapor */
export function darkArbok2PoisonVapor1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.status("Poisoned");
  O.benchDamage(c, 10);
}

/** base5-3 · Hydrocannon */
export function darkBlastoise3Hydrocannon0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + 2 * c.waterBonus());
}

/** base5-3 · Rocket Tackle */
export function darkBlastoise3RocketTackle1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  c.recoil(10);
  if (c.coin()) c.protect("preventDamageUntil");
}

/** base5-4 · Nail Flick */
export function darkCharizard4NailFlick0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-4 · Continuous Fireball */
export function darkCharizard4ContinuousFireball1(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.coins(c, O.energyIndices(c, c.attacker, "Fire").length);
  if (n) {
    const ix = c.chooseEnergy(
      "fireball-discard",
      "Discard Fire Energy for the heads",
      c.attacker,
      n,
      n,
      "Fire",
    );
    O.discardEnergy(c.state, c.player, c.attacker, ix);
  }
  c.hit(n * 50);
}

/** base5-5 · Giant Tail */
export function darkDragonite5GiantTail0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(70);
}

/** base5-6 · Knock Down */
export function darkDugtrio6KnockDown0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 0 : 20));
}

/** base5-7 · Flitter */
export function darkGolbat7Flitter0(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 20, 1, false);
}

/** base5-8 · Ice Beam */
export function darkGyarados8IceBeam0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base5-9 · Psypunch */
export function darkHypno9Psypunch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-9 · Bench Manipulation */
export function darkHypno9BenchManipulation1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(
    20 * (c.opponent.bench.length - O.coins(c, c.opponent.bench.length)),
    c.defender,
    false,
  );
}

/** base5-10 · Mega Punch */
export function darkMachamp10MegaPunch0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base5-10 · Fling */
export function darkMachamp10Fling1(c: AttackContext) {
  c.require(c.opponent.bench.length, "Your opponent needs a Benched Pokémon.");
  if (!c.begin()) return;
  if (!c.effectsBlocked()) O.leavePlay(c, c.defender, "deck");
}

/** base5-11 · Sonicboom */
export function darkMagneton11Sonicboom0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20, c.defender, false);
}

/** base5-11 · Magnetic Lines */
export function darkMagneton11MagneticLines1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.moveDefenderBasicEnergy(c);
}

/** base5-12 · Fickle Attack */
export function darkSlowbro12FickleAttack0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(40);
}

/** base5-13 · Petal Whirlwind */
export function darkVileplume13PetalWhirlwind0(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.coins(c, 3);
  c.hit(n * 30);
  if (n >= 2) c.selfStatus("Confused");
}

/** base5-14 · Mass Explosion */
export function darkWeezing14MassExplosion0(c: AttackContext) {
  if (!c.begin()) return;
  const names = ["Koffing", "Weezing", "Dark Weezing"];
  c.hit(20 * O.countNames(c, names, true));
  for (const p of O.board(c.state).filter((p) =>
    names.includes(R.pokemonCard(c.state, p, c.catalog).name),
  ))
    c.hit(20, p, false);
}

/** base5-14 · Stun Gas */
export function darkWeezing14StunGas1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.status(c.coin() ? "Poisoned" : "Paralyzed");
}

/** base5-18 · Teleport Blast */
export function darkAlakazam18TeleportBlast0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.switchSelf(c, true);
}

/** base5-18 · Mind Shock */
export function darkAlakazam18MindShock1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40, c.defender, false);
}

/** base5-19 · Stare */
export function darkArbok19Stare0(c: AttackContext) {
  if (!c.begin()) return;
  const p = c.choosePiece("stare", "Choose a Pokémon", O.allPieces(c.opponent));
  c.hit(10, p, false);
  if (!c.effectsBlocked(p)) O.putMark(c, p, "powerOff");
}

/** base5-19 · Poison Vapor */
export function darkArbok19PoisonVapor1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.status("Poisoned");
  O.benchDamage(c, 10);
}

/** base5-20 · Hydrocannon */
export function darkBlastoise20Hydrocannon0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + 2 * c.waterBonus());
}

/** base5-20 · Rocket Tackle */
export function darkBlastoise20RocketTackle1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  c.recoil(10);
  if (c.coin()) c.protect("preventDamageUntil");
}

/** base5-21 · Nail Flick */
export function darkCharizard21NailFlick0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-21 · Continuous Fireball */
export function darkCharizard21ContinuousFireball1(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.coins(c, O.energyIndices(c, c.attacker, "Fire").length);
  if (n) {
    const ix = c.chooseEnergy(
      "fireball-discard",
      "Discard Fire Energy for the heads",
      c.attacker,
      n,
      n,
      "Fire",
    );
    O.discardEnergy(c.state, c.player, c.attacker, ix);
  }
  c.hit(n * 50);
}

/** base5-22 · Giant Tail */
export function darkDragonite22GiantTail0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(70);
}

/** base5-23 · Knock Down */
export function darkDugtrio23KnockDown0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 0 : 20));
}

/** base5-24 · Flitter */
export function darkGolbat24Flitter0(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 20, 1, false);
}

/** base5-25 · Ice Beam */
export function darkGyarados25IceBeam0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base5-26 · Psypunch */
export function darkHypno26Psypunch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-26 · Bench Manipulation */
export function darkHypno26BenchManipulation1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(
    20 * (c.opponent.bench.length - O.coins(c, c.opponent.bench.length)),
    c.defender,
    false,
  );
}

/** base5-27 · Mega Punch */
export function darkMachamp27MegaPunch0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base5-27 · Fling */
export function darkMachamp27Fling1(c: AttackContext) {
  c.require(c.opponent.bench.length, "Your opponent needs a Benched Pokémon.");
  if (!c.begin()) return;
  if (!c.effectsBlocked()) O.leavePlay(c, c.defender, "deck");
}

/** base5-28 · Sonicboom */
export function darkMagneton28Sonicboom0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20, c.defender, false);
}

/** base5-28 · Magnetic Lines */
export function darkMagneton28MagneticLines1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.moveDefenderBasicEnergy(c);
}

/** base5-29 · Fickle Attack */
export function darkSlowbro29FickleAttack0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(40);
}

/** base5-30 · Petal Whirlwind */
export function darkVileplume30PetalWhirlwind0(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.coins(c, 3);
  c.hit(n * 30);
  if (n >= 2) c.selfStatus("Confused");
}

/** base5-31 · Mass Explosion */
export function darkWeezing31MassExplosion0(c: AttackContext) {
  if (!c.begin()) return;
  const names = ["Koffing", "Weezing", "Dark Weezing"];
  c.hit(20 * O.countNames(c, names, true));
  for (const p of O.board(c.state).filter((p) =>
    names.includes(R.pokemonCard(c.state, p, c.catalog).name),
  ))
    c.hit(20, p, false);
}

/** base5-31 · Stun Gas */
export function darkWeezing31StunGas1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.status(c.coin() ? "Poisoned" : "Paralyzed");
}

/** base5-32 · Tail Slap */
export function darkCharmeleon32TailSlap0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-32 · Fireball */
export function darkCharmeleon32Fireball1(c: AttackContext) {
  c.require(
    c.copying || O.energyIndices(c, c.attacker, "Fire").length,
    "Attach Fire Energy first.",
  );
  if (!c.begin()) return;
  if (c.coin()) {
    if (!c.copying) c.payEnergy(1, "Fire");
    c.hit(70);
  }
}

/** base5-33 · Tail Strike */
export function darkDragonair33TailStrike0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 20 : 0));
}

/** base5-34 · Rolling Tackle */
export function darkElectrode34RollingTackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-34 · Energy Bomb */
export function darkElectrode34EnergyBomb1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.moveAttackEnergy(c, true);
}

/** base5-35 · Rage */
export function darkFlareon35Rage0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
}

/** base5-35 · Playing with Fire */
export function darkFlareon35PlayingwithFire1(c: AttackContext) {
  c.require(
    c.copying || O.energyIndices(c, c.attacker, "Fire").length,
    "Attach Fire Energy first.",
  );
  if (!c.begin()) return;
  const heads = c.coin();
  if (heads && !c.copying) c.payEnergy(1, "Fire");
  c.hit(30 + (heads ? 20 : 0));
}

/** base5-36 · Poisonpowder */
export function darkGloom36Poisonpowder0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Poisoned");
  }
}

/** base5-37 · Third Eye */
export function darkGolduck37ThirdEye0(c: AttackContext) {
  c.payEnergy(1);
  if (!c.begin()) return;
  O.drawUpTo(c, c.player, 3);
}

/** base5-37 · Super Psy */
export function darkGolduck37SuperPsy1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base5-38 · Lightning Flash */
export function darkJolteon38LightningFlash0(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (!c.effectsBlocked())
      (c.defender.effects ||= {}).sandAttackUntil = c.state.turn + 1;
  }
}

/** base5-38 · Thunder Attack */
export function darkJolteon38ThunderAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) c.status("Paralyzed");
  else c.recoil(10);
}

/** base5-39 · Mind Shock */
export function darkKadabra39MindShock0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30, c.defender, false);
}

/** base5-40 · Drag Off */
export function darkMachoke40DragOff0(c: AttackContext) {
  c.require(c.opponent.bench.length, "Your opponent needs a Benched Pokémon.");
  if (O.dragOff(c)) c.hit(20);
}

/** base5-40 · Knock Back */
export function darkMachoke40KnockBack1(c: AttackContext) {
  if (c.begin()) {
    c.hit(30);
    c.forceSwitch(true);
  }
}

/** base5-41 · Sludge Punch */
export function darkMuk41SludgePunch0(c: AttackContext) {
  B.tangelaPoisonpowder(c);
}

/** base5-42 · Fascinate */
export function darkPersian42Fascinate0(c: AttackContext) {
  c.require(c.opponent.bench.length, "Your opponent needs a Benched Pokémon.");
  if (!c.begin()) return;
  if (c.coin()) c.forceSwitch(false);
}

/** base5-42 · Poison Claws */
export function darkPersian42PoisonClaws1(c: AttackContext) {
  B.weedlePoisonSting(c);
}

/** base5-43 · Frenzied Attack */
export function darkPrimeape43FrenziedAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  c.selfStatus("Confused");
}

/** base5-44 · Rear Kick */
export function darkRapidash44RearKick0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-44 · Flame Pillar */
export function darkRapidash44FlamePillar1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (
    O.energyIndices(c, c.attacker, "Fire").length &&
    O.optional(c, "flame-pillar", "Discard a Fire Energy for 10 Bench damage?")
  ) {
    const ix = c.chooseEnergy(
      "pillar-energy",
      "Discard Fire Energy",
      c.attacker,
      1,
      1,
      "Fire",
    );
    O.discardEnergy(c.state, c.player, c.attacker, ix);
    O.selectedDamage(c, 10);
  }
}

/** base5-45 · Bite */
export function darkVaporeon45Bite0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base5-45 · Whirlpool */
export function darkVaporeon45Whirlpool1(c: AttackContext) {
  B.dragonairHyperBeam(c);
}

/** base5-46 · Doubleslap */
export function darkWartortle46Doubleslap0(c: AttackContext) {
  B.doduoFuryAttack(c);
}

/** base5-46 · Mirror Shell */
export function darkWartortle46MirrorShell1(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "mirrorShell");
}

/** base5-47 · Flop */
export function magikarp47Flop0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-47 · Rapid Evolution */
export function magikarp47RapidEvolution1(c: AttackContext) {
  if (!c.begin()) return;
  O.evolveFromDeck(c, [c.attacker], ["Gyarados", "Dark Gyarados"]);
}

/** base5-48 · Conversion 1 */
export function porygon48Conversion10(c: AttackContext) {
  B.porygonConversion1(c);
}

/** base5-48 · Psybeam */
export function porygon48Psybeam1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (c.coin()) c.status("Confused");
  }
}

/** base5-49 · Vanish */
export function abra49Vanish0(c: AttackContext) {
  if (!c.begin()) return;
  O.leavePlay(c, c.attacker, "deck", false);
}

/** base5-49 · Psyshock */
export function abra49Psyshock1(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base5-50 · Fire Tail */
export function charmander50FireTail0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-51 · Gnaw */
export function darkRaticate51Gnaw0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-51 · Hyper Fang */
export function darkRaticate51HyperFang1(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(50);
}

/** base5-52 · Dig Under */
export function diglett52DigUnder0(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 10, 1, false);
}

/** base5-52 · Scratch */
export function diglett52Scratch1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-53 · Wrap */
export function dratini53Wrap0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base5-54 · Nightmare */
export function drowzee54Nightmare0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Asleep");
  }
}

/** base5-55 · Tackle */
export function eevee55Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-55 · Sand-attack */
export function eevee55Sandattack1(c: AttackContext) {
  B.sandshrewSandattack(c);
}

/** base5-56 · Bite */
export function ekans56Bite0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-56 · Poison Sting */
export function ekans56PoisonSting1(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** base5-57 · Poison Gas */
export function grimer57PoisonGas0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base5-57 · Sticky Hands */
export function grimer57StickyHands1(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(10 + (heads ? 20 : 0));
  if (heads) c.status("Paralyzed");
}

/** base5-58 · Tackle */
export function koffing58Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-58 · Poison Gas */
export function koffing58PoisonGas1(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** base5-59 · Punch */
export function machop59Punch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-59 · Kick */
export function machop59Kick1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base5-60 · Tackle */
export function magnemite60Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-60 · Magnetism */
export function magnemite60Magnetism1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(
    10 +
      10 *
        O.countNames(
          c,
          ["Magnemite", "Magneton", "Dark Magneton"],
          false,
          true,
        ),
  );
}

/** base5-61 · Mischief */
export function mankey61Mischief0(c: AttackContext) {
  if (!c.begin()) return;
  O.shuffle(c.state, c.opponent.deck);
}

/** base5-61 · Anger */
export function mankey61Anger1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 20 : 0));
}

/** base5-62 · Coin Hurl */
export function meowth62CoinHurl0(c: AttackContext) {
  if (!c.begin()) return;
  const p = c.choosePiece(
    "coin-hurl",
    "Choose a Pokémon",
    O.allPieces(c.opponent),
  );
  if (c.coin()) c.hit(20, p, false);
}

/** base5-63 · Sleep Powder */
export function oddish63SleepPowder0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base5-63 · Poisonpowder */
export function oddish63Poisonpowder1(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    c.status("Poisoned");
  }
}

/** base5-64 · Ember */
export function ponyta64Ember0(c: AttackContext) {
  B.charmanderEmber(c);
}

/** base5-65 · Dizziness */
export function psyduck65Dizziness0(c: AttackContext) {
  if (!c.begin()) return;
  O.draw(c.state, c.player, 1);
}

/** base5-65 · Water Gun */
export function psyduck65WaterGun1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + c.waterBonus());
}

/** base5-66 · Quick Attack */
export function rattata66QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 10 : 0));
}

/** base5-67 · Afternoon Nap */
export function slowpoke67AfternoonNap0(c: AttackContext) {
  if (!c.begin()) return;
  O.search(c, c.player, O.namedEnergy("Psychic"), 1, "energy", c.attacker);
}

/** base5-67 · Headbutt */
export function slowpoke67Headbutt1(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-68 · Shell Attack */
export function squirtle68ShellAttack0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-69 · Speed Ball */
export function voltorb69SpeedBall0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-70 · Ram */
export function zubat70Ram0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base5-70 · Bite */
export function zubat70Bite1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base5-83 · Surprise Thunder */
export function darkRaichu83SurpriseThunder0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) O.benchDamage(c, c.coin() ? 20 : 10);
}

export const ATTACKS: Record<string, AttackHandler[]> = {
  "base5-1": [darkAlakazam1TeleportBlast0, darkAlakazam1MindShock1],
  "base5-2": [darkArbok2Stare0, darkArbok2PoisonVapor1],
  "base5-3": [darkBlastoise3Hydrocannon0, darkBlastoise3RocketTackle1],
  "base5-4": [darkCharizard4NailFlick0, darkCharizard4ContinuousFireball1],
  "base5-5": [darkDragonite5GiantTail0],
  "base5-6": [darkDugtrio6KnockDown0],
  "base5-7": [darkGolbat7Flitter0],
  "base5-8": [darkGyarados8IceBeam0],
  "base5-9": [darkHypno9Psypunch0, darkHypno9BenchManipulation1],
  "base5-10": [darkMachamp10MegaPunch0, darkMachamp10Fling1],
  "base5-11": [darkMagneton11Sonicboom0, darkMagneton11MagneticLines1],
  "base5-12": [darkSlowbro12FickleAttack0],
  "base5-13": [darkVileplume13PetalWhirlwind0],
  "base5-14": [darkWeezing14MassExplosion0, darkWeezing14StunGas1],
  "base5-18": [darkAlakazam18TeleportBlast0, darkAlakazam18MindShock1],
  "base5-19": [darkArbok19Stare0, darkArbok19PoisonVapor1],
  "base5-20": [darkBlastoise20Hydrocannon0, darkBlastoise20RocketTackle1],
  "base5-21": [darkCharizard21NailFlick0, darkCharizard21ContinuousFireball1],
  "base5-22": [darkDragonite22GiantTail0],
  "base5-23": [darkDugtrio23KnockDown0],
  "base5-24": [darkGolbat24Flitter0],
  "base5-25": [darkGyarados25IceBeam0],
  "base5-26": [darkHypno26Psypunch0, darkHypno26BenchManipulation1],
  "base5-27": [darkMachamp27MegaPunch0, darkMachamp27Fling1],
  "base5-28": [darkMagneton28Sonicboom0, darkMagneton28MagneticLines1],
  "base5-29": [darkSlowbro29FickleAttack0],
  "base5-30": [darkVileplume30PetalWhirlwind0],
  "base5-31": [darkWeezing31MassExplosion0, darkWeezing31StunGas1],
  "base5-32": [darkCharmeleon32TailSlap0, darkCharmeleon32Fireball1],
  "base5-33": [darkDragonair33TailStrike0],
  "base5-34": [darkElectrode34RollingTackle0, darkElectrode34EnergyBomb1],
  "base5-35": [darkFlareon35Rage0, darkFlareon35PlayingwithFire1],
  "base5-36": [darkGloom36Poisonpowder0],
  "base5-37": [darkGolduck37ThirdEye0, darkGolduck37SuperPsy1],
  "base5-38": [darkJolteon38LightningFlash0, darkJolteon38ThunderAttack1],
  "base5-39": [darkKadabra39MindShock0],
  "base5-40": [darkMachoke40DragOff0, darkMachoke40KnockBack1],
  "base5-41": [darkMuk41SludgePunch0],
  "base5-42": [darkPersian42Fascinate0, darkPersian42PoisonClaws1],
  "base5-43": [darkPrimeape43FrenziedAttack0],
  "base5-44": [darkRapidash44RearKick0, darkRapidash44FlamePillar1],
  "base5-45": [darkVaporeon45Bite0, darkVaporeon45Whirlpool1],
  "base5-46": [darkWartortle46Doubleslap0, darkWartortle46MirrorShell1],
  "base5-47": [magikarp47Flop0, magikarp47RapidEvolution1],
  "base5-48": [porygon48Conversion10, porygon48Psybeam1],
  "base5-49": [abra49Vanish0, abra49Psyshock1],
  "base5-50": [charmander50FireTail0],
  "base5-51": [darkRaticate51Gnaw0, darkRaticate51HyperFang1],
  "base5-52": [diglett52DigUnder0, diglett52Scratch1],
  "base5-53": [dratini53Wrap0],
  "base5-54": [drowzee54Nightmare0],
  "base5-55": [eevee55Tackle0, eevee55Sandattack1],
  "base5-56": [ekans56Bite0, ekans56PoisonSting1],
  "base5-57": [grimer57PoisonGas0, grimer57StickyHands1],
  "base5-58": [koffing58Tackle0, koffing58PoisonGas1],
  "base5-59": [machop59Punch0, machop59Kick1],
  "base5-60": [magnemite60Tackle0, magnemite60Magnetism1],
  "base5-61": [mankey61Mischief0, mankey61Anger1],
  "base5-62": [meowth62CoinHurl0],
  "base5-63": [oddish63SleepPowder0, oddish63Poisonpowder1],
  "base5-64": [ponyta64Ember0],
  "base5-65": [psyduck65Dizziness0, psyduck65WaterGun1],
  "base5-66": [rattata66QuickAttack0],
  "base5-67": [slowpoke67AfternoonNap0, slowpoke67Headbutt1],
  "base5-68": [squirtle68ShellAttack0],
  "base5-69": [voltorb69SpeedBall0],
  "base5-70": [zubat70Ram0, zubat70Bite1],
  "base5-83": [darkRaichu83SurpriseThunder0],
};
