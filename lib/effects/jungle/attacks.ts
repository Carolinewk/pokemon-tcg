import type { AttackContext, AttackHandler } from "../context";
import * as O from "../classic/operations";
import * as R from "../classic/state";
import * as B from "../base-set/attacks";

/** base2-1 · Metronome */
export function clefable1Metronome0(c: AttackContext) {
  B.clefairyMetronome(c);
}

/** base2-1 · Minimize */
export function clefable1Minimize1(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "reduceDamage", 1, 20);
}

/** base2-2 · Tackle */
export function electrode2Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base2-2 · Chain Lightning */
export function electrode2ChainLightning1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (
    !R.pokemonCard(c.state, c.defender, c.catalog).types.includes("Colorless")
  )
    O.benchDamage(c, 10, "both", (p) =>
      R.pokemonCard(c.state, p, c.catalog).types.some((t) =>
        R.pokemonCard(c.state, c.defender, c.catalog).types.includes(t),
      ),
    );
}

/** base2-3 · Quick Attack */
export function flareon3QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** base2-3 · Flamethrower */
export function flareon3Flamethrower1(c: AttackContext) {
  c.payEnergy(1, "Fire");
  if (c.begin()) c.hit(60);
}

/** base2-4 · Quick Attack */
export function jolteon4QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** base2-4 · Pin Missile */
export function jolteon4PinMissile1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 4));
}

/** base2-5 · Fetch */
export function kangaskhan5Fetch0(c: AttackContext) {
  if (!c.begin()) return;
  O.draw(c.state, c.player, 1);
}

/** base2-5 · Comet Punch */
export function kangaskhan5CometPunch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 4));
}

/** base2-6 · Meditate */
export function mrMime6Meditate0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.defender.damage);
}

/** base2-7 · Boyfriends */
export function nidoqueen7Boyfriends0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + 20 * O.countNames(c, ["Nidoking"]));
}

/** base2-7 · Mega Punch */
export function nidoqueen7MegaPunch1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base2-8 · Wing Attack */
export function pidgeot8WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base2-8 · Hurricane */
export function pidgeot8Hurricane1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (
    !c.effectsBlocked() &&
    c.defender.damage < R.maximumHP(c.state, c.defender, c.catalog)
  )
    O.leavePlay(c, c.defender, "hand");
}

/** base2-9 · Irongrip */
export function pinsir9Irongrip0(c: AttackContext) {
  B.tangelaBind(c);
}

/** base2-9 · Guillotine */
export function pinsir9Guillotine1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base2-10 · Swords Dance */
export function scyther10SwordsDance0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "nextDamage", 2, 60, undefined, "Slash");
}

/** base2-10 · Slash */
export function scyther10Slash1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base2-11 · Body Slam */
export function snorlax11BodySlam0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base2-12 · Quick Attack */
export function vaporeon12QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** base2-12 · Water Gun */
export function vaporeon12WaterGun1(c: AttackContext) {
  B.poliwrathWaterGun(c);
}

/** base2-13 · Venom Powder */
export function venomoth13VenomPowder0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) {
    c.status("Confused");
    c.status("Poisoned");
  }
}

/** base2-14 · Lure */
export function victreebel14Lure0(c: AttackContext) {
  B.ninetalesLure(c);
}

/** base2-14 · Acid */
export function victreebel14Acid1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.opponentMark(c, "noRetreat");
}

/** base2-15 · Petal Dance */
export function vileplume15PetalDance0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(O.coins(c, 3) * 40);
  c.selfStatus("Confused");
}

/** base2-16 · Lullaby */
export function wigglytuff16Lullaby0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base2-16 · Do the Wave */
export function wigglytuff16DotheWave1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.player.bench.length * 10);
}

/** base2-17 · Metronome */
export function clefable17Metronome0(c: AttackContext) {
  B.clefairyMetronome(c);
}

/** base2-17 · Minimize */
export function clefable17Minimize1(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "reduceDamage", 1, 20);
}

/** base2-18 · Tackle */
export function electrode18Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base2-18 · Chain Lightning */
export function electrode18ChainLightning1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (
    !R.pokemonCard(c.state, c.defender, c.catalog).types.includes("Colorless")
  )
    O.benchDamage(c, 10, "both", (p) =>
      R.pokemonCard(c.state, p, c.catalog).types.some((t) =>
        R.pokemonCard(c.state, c.defender, c.catalog).types.includes(t),
      ),
    );
}

/** base2-19 · Quick Attack */
export function flareon19QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** base2-19 · Flamethrower */
export function flareon19Flamethrower1(c: AttackContext) {
  c.payEnergy(1, "Fire");
  if (c.begin()) c.hit(60);
}

/** base2-20 · Quick Attack */
export function jolteon20QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** base2-20 · Pin Missile */
export function jolteon20PinMissile1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 4));
}

/** base2-21 · Fetch */
export function kangaskhan21Fetch0(c: AttackContext) {
  if (!c.begin()) return;
  O.draw(c.state, c.player, 1);
}

/** base2-21 · Comet Punch */
export function kangaskhan21CometPunch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 4));
}

/** base2-22 · Meditate */
export function mrMime22Meditate0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.defender.damage);
}

/** base2-23 · Boyfriends */
export function nidoqueen23Boyfriends0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + 20 * O.countNames(c, ["Nidoking"]));
}

/** base2-23 · Mega Punch */
export function nidoqueen23MegaPunch1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base2-24 · Wing Attack */
export function pidgeot24WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base2-24 · Hurricane */
export function pidgeot24Hurricane1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (
    !c.effectsBlocked() &&
    c.defender.damage < R.maximumHP(c.state, c.defender, c.catalog)
  )
    O.leavePlay(c, c.defender, "hand");
}

/** base2-25 · Irongrip */
export function pinsir25Irongrip0(c: AttackContext) {
  B.tangelaBind(c);
}

/** base2-25 · Guillotine */
export function pinsir25Guillotine1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base2-26 · Swords Dance */
export function scyther26SwordsDance0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "nextDamage", 2, 60, undefined, "Slash");
}

/** base2-26 · Slash */
export function scyther26Slash1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base2-27 · Body Slam */
export function snorlax27BodySlam0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base2-28 · Quick Attack */
export function vaporeon28QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** base2-28 · Water Gun */
export function vaporeon28WaterGun1(c: AttackContext) {
  B.poliwrathWaterGun(c);
}

/** base2-29 · Venom Powder */
export function venomoth29VenomPowder0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) {
    c.status("Confused");
    c.status("Poisoned");
  }
}

/** base2-30 · Lure */
export function victreebel30Lure0(c: AttackContext) {
  B.ninetalesLure(c);
}

/** base2-30 · Acid */
export function victreebel30Acid1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.opponentMark(c, "noRetreat");
}

/** base2-31 · Petal Dance */
export function vileplume31PetalDance0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(O.coins(c, 3) * 40);
  c.selfStatus("Confused");
}

/** base2-32 · Lullaby */
export function wigglytuff32Lullaby0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base2-32 · Do the Wave */
export function wigglytuff32DotheWave1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.player.bench.length * 10);
}

/** base2-33 · Whirlwind */
export function butterfree33Whirlwind0(c: AttackContext) {
  B.pidgeottoWhirlwind(c);
}

/** base2-33 · Mega Drain */
export function butterfree33MegaDrain1(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(40);
  O.heal(c.attacker, Math.ceil(n / 20) * 10);
}

/** base2-34 · Rage */
export function dodrio34Rage0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
}

/** base2-35 · Teleport */
export function exeggutor35Teleport0(c: AttackContext) {
  c.require(c.player.bench.length, "You need a Benched Pokémon.");
  if (!c.begin()) return;
  O.switchSelf(c);
}

/** base2-35 · Big Eggsplosion */
export function exeggutor35BigEggsplosion1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, O.energyCount(c, c.attacker)));
}

/** base2-36 · Agility */
export function fearow36Agility0(c: AttackContext) {
  B.raichuAgility(c);
}

/** base2-36 · Drill Peck */
export function fearow36DrillPeck1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** base2-37 · Poisonpowder */
export function gloom37Poisonpowder0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    c.status("Poisoned");
  }
}

/** base2-37 · Foul Odor */
export function gloom37FoulOdor1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.status("Confused");
  c.selfStatus("Confused");
}

/** base2-38 · Tongue Wrap */
export function lickitung38TongueWrap0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base2-38 · Supersonic */
export function lickitung38Supersonic1(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** base2-39 · Bonemerang */
export function marowak39Bonemerang0(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base2-39 · Call for Friend */
export function marowak39CallforFriend1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(c, (x) => R.startingPokemon(x) && x.types.includes("Fighting"));
}

/** base2-40 · Supersonic */
export function nidorina40Supersonic0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** base2-40 · Double Kick */
export function nidorina40DoubleKick1(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base2-41 · Spore */
export function parasect41Spore0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base2-41 · Slash */
export function parasect41Slash1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base2-42 · Scratch */
export function persian42Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base2-42 · Pounce */
export function persian42Pounce1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.linkedReduction(c, 10);
}

/** base2-43 · Fury Swipes */
export function primeape43FurySwipes0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 3));
}

/** base2-43 · Tantrum */
export function primeape43Tantrum1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  if (!c.coin()) c.selfStatus("Confused");
}

/** base2-44 · Stomp */
export function rapidash44Stomp0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 10 : 0));
}

/** base2-44 · Agility */
export function rapidash44Agility1(c: AttackContext) {
  if (c.begin()) {
    c.hit(30);
    if (c.coin()) c.protect("preventAllUntil");
  }
}

/** base2-45 · Horn Attack */
export function rhydon45HornAttack0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base2-45 · Ram */
export function rhydon45Ram1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  c.recoil(20);
  c.forceSwitch(true);
}

/** base2-46 · Horn Attack */
export function seaking46HornAttack0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base2-46 · Waterfall */
export function seaking46Waterfall1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base2-47 · Stomp */
export function tauros47Stomp0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 10 : 0));
}

/** base2-47 · Rampage */
export function tauros47Rampage1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + c.attacker.damage);
  if (!c.coin()) c.selfStatus("Confused");
}

/** base2-48 · Poisonpowder */
export function weepinbell48Poisonpowder0(c: AttackContext) {
  B.weedlePoisonSting(c);
}

/** base2-48 · Razor Leaf */
export function weepinbell48RazorLeaf1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base2-49 · Vine Whip */
export function bellsprout49VineWhip0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base2-49 · Call for Family */
export function bellsprout49CallforFamily1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(c, (x) => R.startingPokemon(x) && x.name === c.printedCard.name);
}

/** base2-50 · Snivel */
export function cubone50Snivel0(c: AttackContext) {
  if (!c.begin()) return;
  O.linkedReduction(c, 20);
}

/** base2-50 · Rage */
export function cubone50Rage1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
}

/** base2-51 · Tail Wag */
export function eevee51TailWag0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.opponentMark(c, "cannotAttackSource", 1, undefined, true);
}

/** base2-51 · Quick Attack */
export function eevee51QuickAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** base2-52 · Hypnosis */
export function exeggcute52Hypnosis0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base2-52 · Leech Seed */
export function exeggcute52LeechSeed1(c: AttackContext) {
  B.bulbasaurLeechSeed(c);
}

/** base2-53 · Horn Attack */
export function goldeen53HornAttack0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base2-54 · Lullaby */
export function jigglypuff54Lullaby0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base2-54 · Pound */
export function jigglypuff54Pound1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base2-55 · Scratch */
export function mankey55Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base2-56 · Pay Day */
export function meowth56PayDay0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) O.draw(c.state, c.player, 1);
}

/** base2-57 · Fury Swipes */
export function nidoranFemale57FurySwipes0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** base2-57 · Call for Family */
export function nidoranFemale57CallforFamily1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(
    c,
    (x) =>
      R.startingPokemon(x) && ["Nidoran ♂", "Nidoran ♀"].includes(x.name),
  );
}

/** base2-58 · Stun Spore */
export function oddish58StunSpore0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base2-58 · Sprout */
export function oddish58Sprout1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(c, (x) => R.startingPokemon(x) && x.name === c.printedCard.name);
}

/** base2-59 · Scratch */
export function paras59Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base2-59 · Spore */
export function paras59Spore1(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base2-60 · Spark */
export function pikachu60Spark0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.selectedDamage(c, 10);
}

/** base2-61 · Leer */
export function rhyhorn61Leer0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.opponentMark(c, "cannotAttackSource", 1, undefined, true);
}

/** base2-61 · Horn Attack */
export function rhyhorn61HornAttack1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base2-62 · Peck */
export function spearow62Peck0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base2-62 · Mirror Move */
export function spearow62MirrorMove1(c: AttackContext) {
  B.pidgeottoMirrorMove(c);
}

/** base2-63 · Stun Spore */
export function venonat63StunSpore0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base2-63 · Leech Life */
export function venonat63LeechLife1(c: AttackContext) {
  if (!c.begin()) return;
  O.heal(c.attacker, c.hit(10));
}

export const ATTACKS: Record<string, AttackHandler[]> = {
  "base2-1": [clefable1Metronome0, clefable1Minimize1],
  "base2-2": [electrode2Tackle0, electrode2ChainLightning1],
  "base2-3": [flareon3QuickAttack0, flareon3Flamethrower1],
  "base2-4": [jolteon4QuickAttack0, jolteon4PinMissile1],
  "base2-5": [kangaskhan5Fetch0, kangaskhan5CometPunch1],
  "base2-6": [mrMime6Meditate0],
  "base2-7": [nidoqueen7Boyfriends0, nidoqueen7MegaPunch1],
  "base2-8": [pidgeot8WingAttack0, pidgeot8Hurricane1],
  "base2-9": [pinsir9Irongrip0, pinsir9Guillotine1],
  "base2-10": [scyther10SwordsDance0, scyther10Slash1],
  "base2-11": [snorlax11BodySlam0],
  "base2-12": [vaporeon12QuickAttack0, vaporeon12WaterGun1],
  "base2-13": [venomoth13VenomPowder0],
  "base2-14": [victreebel14Lure0, victreebel14Acid1],
  "base2-15": [vileplume15PetalDance0],
  "base2-16": [wigglytuff16Lullaby0, wigglytuff16DotheWave1],
  "base2-17": [clefable17Metronome0, clefable17Minimize1],
  "base2-18": [electrode18Tackle0, electrode18ChainLightning1],
  "base2-19": [flareon19QuickAttack0, flareon19Flamethrower1],
  "base2-20": [jolteon20QuickAttack0, jolteon20PinMissile1],
  "base2-21": [kangaskhan21Fetch0, kangaskhan21CometPunch1],
  "base2-22": [mrMime22Meditate0],
  "base2-23": [nidoqueen23Boyfriends0, nidoqueen23MegaPunch1],
  "base2-24": [pidgeot24WingAttack0, pidgeot24Hurricane1],
  "base2-25": [pinsir25Irongrip0, pinsir25Guillotine1],
  "base2-26": [scyther26SwordsDance0, scyther26Slash1],
  "base2-27": [snorlax27BodySlam0],
  "base2-28": [vaporeon28QuickAttack0, vaporeon28WaterGun1],
  "base2-29": [venomoth29VenomPowder0],
  "base2-30": [victreebel30Lure0, victreebel30Acid1],
  "base2-31": [vileplume31PetalDance0],
  "base2-32": [wigglytuff32Lullaby0, wigglytuff32DotheWave1],
  "base2-33": [butterfree33Whirlwind0, butterfree33MegaDrain1],
  "base2-34": [dodrio34Rage0],
  "base2-35": [exeggutor35Teleport0, exeggutor35BigEggsplosion1],
  "base2-36": [fearow36Agility0, fearow36DrillPeck1],
  "base2-37": [gloom37Poisonpowder0, gloom37FoulOdor1],
  "base2-38": [lickitung38TongueWrap0, lickitung38Supersonic1],
  "base2-39": [marowak39Bonemerang0, marowak39CallforFriend1],
  "base2-40": [nidorina40Supersonic0, nidorina40DoubleKick1],
  "base2-41": [parasect41Spore0, parasect41Slash1],
  "base2-42": [persian42Scratch0, persian42Pounce1],
  "base2-43": [primeape43FurySwipes0, primeape43Tantrum1],
  "base2-44": [rapidash44Stomp0, rapidash44Agility1],
  "base2-45": [rhydon45HornAttack0, rhydon45Ram1],
  "base2-46": [seaking46HornAttack0, seaking46Waterfall1],
  "base2-47": [tauros47Stomp0, tauros47Rampage1],
  "base2-48": [weepinbell48Poisonpowder0, weepinbell48RazorLeaf1],
  "base2-49": [bellsprout49VineWhip0, bellsprout49CallforFamily1],
  "base2-50": [cubone50Snivel0, cubone50Rage1],
  "base2-51": [eevee51TailWag0, eevee51QuickAttack1],
  "base2-52": [exeggcute52Hypnosis0, exeggcute52LeechSeed1],
  "base2-53": [goldeen53HornAttack0],
  "base2-54": [jigglypuff54Lullaby0, jigglypuff54Pound1],
  "base2-55": [mankey55Scratch0],
  "base2-56": [meowth56PayDay0],
  "base2-57": [nidoranFemale57FurySwipes0, nidoranFemale57CallforFamily1],
  "base2-58": [oddish58StunSpore0, oddish58Sprout1],
  "base2-59": [paras59Scratch0, paras59Spore1],
  "base2-60": [pikachu60Spark0],
  "base2-61": [rhyhorn61Leer0, rhyhorn61HornAttack1],
  "base2-62": [spearow62Peck0, spearow62MirrorMove1],
  "base2-63": [venonat63StunSpore0, venonat63LeechLife1],
};
