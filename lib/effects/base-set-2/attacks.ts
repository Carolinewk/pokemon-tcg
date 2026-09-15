import type { AttackContext, AttackHandler } from "../context";
import * as O from "../classic/operations";
import * as R from "../classic/state";
import * as B from "../base-set/attacks";

/** base4-1 · Confuse Ray */
export function alakazam1ConfuseRay0(c: AttackContext) {
  B.alakazamConfuseRay(c);
}

/** base4-2 · Hydro Pump */
export function blastoise2HydroPump0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40 + c.waterBonus());
}

/** base4-3 · Scrunch */
export function chansey3Scrunch0(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** base4-3 · Double-edge */
export function chansey3Doubleedge1(c: AttackContext) {
  B.chanseyDoubleedge(c);
}

/** base4-4 · Fire Spin */
export function charizard4FireSpin0(c: AttackContext) {
  B.charizardFireSpin(c);
}

/** base4-5 · Metronome */
export function clefable5Metronome0(c: AttackContext) {
  B.clefairyMetronome(c);
}

/** base4-5 · Minimize */
export function clefable5Minimize1(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "reduceDamage", 1, 20);
}

/** base4-6 · Sing */
export function clefairy6Sing0(c: AttackContext) {
  B.gastlySleepingGas(c);
}

/** base4-6 · Metronome */
export function clefairy6Metronome1(c: AttackContext) {
  B.clefairyMetronome(c);
}

/** base4-7 · Dragon Rage */
export function gyarados7DragonRage0(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base4-7 · Bubblebeam */
export function gyarados7Bubblebeam1(c: AttackContext) {
  B.gyaradosBubblebeam(c);
}

/** base4-8 · Jab */
export function hitmonchan8Jab0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-8 · Special Punch */
export function hitmonchan8SpecialPunch1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** base4-9 · Thunder Wave */
export function magneton9ThunderWave0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base4-9 · Selfdestruct */
export function magneton9Selfdestruct1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(80);
  O.benchDamage(c, 20, "both");
  c.recoil(80);
}

/** base4-10 · Psychic */
export function mewtwo10Psychic0(c: AttackContext) {
  B.mewtwoPsychic(c);
}

/** base4-10 · Barrier */
export function mewtwo10Barrier1(c: AttackContext) {
  c.payEnergy(1, "Psychic");
  if (!c.begin()) return;
  c.protect("preventAllUntil");
}

/** base4-11 · Thrash */
export function nidoking11Thrash0(c: AttackContext) {
  B.nidokingThrash(c);
}

/** base4-11 · Toxic */
export function nidoking11Toxic1(c: AttackContext) {
  B.nidokingToxic(c);
}

/** base4-12 · Boyfriends */
export function nidoqueen12Boyfriends0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + 20 * O.countNames(c, ["Nidoking"]));
}

/** base4-12 · Mega Punch */
export function nidoqueen12MegaPunch1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base4-13 · Lure */
export function ninetales13Lure0(c: AttackContext) {
  if (!c.begin()) return;
  c.forceSwitch(false);
}

/** base4-13 · Fire Blast */
export function ninetales13FireBlast1(c: AttackContext) {
  B.ninetalesFireBlast(c);
}

/** base4-14 · Wing Attack */
export function pidgeot14WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-14 · Hurricane */
export function pidgeot14Hurricane1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (
    !c.effectsBlocked() &&
    c.defender.damage < R.maximumHP(c.state, c.defender, c.catalog)
  )
    O.leavePlay(c, c.defender, "hand");
}

/** base4-15 · Water Gun */
export function poliwrath15WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + c.waterBonus());
}

/** base4-15 · Whirlpool */
export function poliwrath15Whirlpool1(c: AttackContext) {
  B.poliwrathWhirlpool(c);
}

/** base4-16 · Agility */
export function raichu16Agility0(c: AttackContext) {
  B.raichuAgility(c);
}

/** base4-16 · Thunder */
export function raichu16Thunder1(c: AttackContext) {
  B.zapdosThunder(c);
}

/** base4-17 · Swords Dance */
export function scyther17SwordsDance0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "nextDamage", 2, 60, undefined, "Slash");
}

/** base4-17 · Slash */
export function scyther17Slash1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-18 · Solarbeam */
export function venusaur18Solarbeam0(c: AttackContext) {
  if (c.begin()) c.hit(60);
}

/** base4-19 · Lullaby */
export function wigglytuff19Lullaby0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base4-19 · Do the Wave */
export function wigglytuff19DotheWave1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.player.bench.length * 10);
}

/** base4-20 · Thunder */
export function zapdos20Thunder0(c: AttackContext) {
  B.zapdosThunder(c);
}

/** base4-20 · Thunderbolt */
export function zapdos20Thunderbolt1(c: AttackContext) {
  B.zapdosThunderbolt(c);
}

/** base4-21 · Twineedle */
export function beedrill21Twineedle0(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base4-21 · Poison Sting */
export function beedrill21PoisonSting1(c: AttackContext) {
  B.beedrillPoisonSting(c);
}

/** base4-22 · Slam */
export function dragonair22Slam0(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base4-22 · Hyper Beam */
export function dragonair22HyperBeam1(c: AttackContext) {
  B.dragonairHyperBeam(c);
}

/** base4-23 · Slash */
export function dugtrio23Slash0(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** base4-23 · Earthquake */
export function dugtrio23Earthquake1(c: AttackContext) {
  B.dugtrioEarthquake(c);
}

/** base4-24 · Thundershock */
export function electabuzz24Thundershock0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base4-24 · Thunderpunch */
export function electabuzz24Thunderpunch1(c: AttackContext) {
  B.nidokingThrash(c);
}

/** base4-25 · Electric Shock */
export function electrode25ElectricShock0(c: AttackContext) {
  B.electrodeElectricShock(c);
}

/** base4-26 · Fetch */
export function kangaskhan26Fetch0(c: AttackContext) {
  if (!c.begin()) return;
  O.draw(c.state, c.player, 1);
}

/** base4-26 · Comet Punch */
export function kangaskhan26CometPunch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 4));
}

/** base4-27 · Meditate */
export function mrMime27Meditate0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.defender.damage);
}

/** base4-28 · Whirlwind */
export function pidgeotto28Whirlwind0(c: AttackContext) {
  B.pidgeottoWhirlwind(c);
}

/** base4-28 · Mirror Move */
export function pidgeotto28MirrorMove1(c: AttackContext) {
  B.pidgeottoMirrorMove(c);
}

/** base4-29 · Irongrip */
export function pinsir29Irongrip0(c: AttackContext) {
  B.tangelaBind(c);
}

/** base4-29 · Guillotine */
export function pinsir29Guillotine1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base4-30 · Body Slam */
export function snorlax30BodySlam0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base4-31 · Venom Powder */
export function venomoth31VenomPowder0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) {
    c.status("Confused");
    c.status("Poisoned");
  }
}

/** base4-32 · Lure */
export function victreebel32Lure0(c: AttackContext) {
  B.ninetalesLure(c);
}

/** base4-32 · Acid */
export function victreebel32Acid1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.opponentMark(c, "noRetreat");
}

/** base4-33 · Flamethrower */
export function arcanine33Flamethrower0(c: AttackContext) {
  B.magmarFlamethrower(c);
}

/** base4-33 · Take Down */
export function arcanine33TakeDown1(c: AttackContext) {
  B.arcanineTakeDown(c);
}

/** base4-34 · Whirlwind */
export function butterfree34Whirlwind0(c: AttackContext) {
  B.pidgeottoWhirlwind(c);
}

/** base4-34 · Mega Drain */
export function butterfree34MegaDrain1(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(40);
  O.heal(c.attacker, Math.ceil(n / 20) * 10);
}

/** base4-35 · Slash */
export function charmeleon35Slash0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-35 · Flamethrower */
export function charmeleon35Flamethrower1(c: AttackContext) {
  B.magmarFlamethrower(c);
}

/** base4-36 · Aurora Beam */
export function dewgong36AuroraBeam0(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base4-36 · Ice Beam */
export function dewgong36IceBeam1(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base4-37 · Rage */
export function dodrio37Rage0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
}

/** base4-38 · Pound */
export function dratini38Pound0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-39 · Teleport */
export function exeggutor39Teleport0(c: AttackContext) {
  c.require(c.player.bench.length, "You need a Benched Pokémon.");
  if (!c.begin()) return;
  O.switchSelf(c);
}

/** base4-39 · Big Eggsplosion */
export function exeggutor39BigEggsplosion1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, O.energyCount(c, c.attacker)));
}

/** base4-40 · Leek Slap */
export function farfetchd40LeekSlap0(c: AttackContext) {
  B.farfetchdLeekSlap(c);
}

/** base4-40 · Pot Smash */
export function farfetchd40PotSmash1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-41 · Agility */
export function fearow41Agility0(c: AttackContext) {
  B.raichuAgility(c);
}

/** base4-41 · Drill Peck */
export function fearow41DrillPeck1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** base4-42 · Flare */
export function growlithe42Flare0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-43 · Hypnosis */
export function haunter43Hypnosis0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base4-43 · Dream Eater */
export function haunter43DreamEater1(c: AttackContext) {
  B.haunterDreamEater(c);
}

/** base4-44 · Vine Whip */
export function ivysaur44VineWhip0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-44 · Poisonpowder */
export function ivysaur44Poisonpowder1(c: AttackContext) {
  B.tangelaPoisonpowder(c);
}

/** base4-45 · Doubleslap */
export function jynx45Doubleslap0(c: AttackContext) {
  B.doduoFuryAttack(c);
}

/** base4-45 · Meditate */
export function jynx45Meditate1(c: AttackContext) {
  B.jynxMeditate(c);
}

/** base4-46 · Recover */
export function kadabra46Recover0(c: AttackContext) {
  B.kadabraRecover(c);
}

/** base4-46 · Super Psy */
export function kadabra46SuperPsy1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base4-47 · Stiffen */
export function kakuna47Stiffen0(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** base4-47 · Poisonpowder */
export function kakuna47Poisonpowder1(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** base4-48 · Tongue Wrap */
export function lickitung48TongueWrap0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base4-48 · Supersonic */
export function lickitung48Supersonic1(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** base4-49 · Karate Chop */
export function machoke49KarateChop0(c: AttackContext) {
  B.machokeKarateChop(c);
}

/** base4-49 · Submission */
export function machoke49Submission1(c: AttackContext) {
  B.machokeSubmission(c);
}

/** base4-50 · Tackle */
export function magikarp50Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-50 · Flail */
export function magikarp50Flail1(c: AttackContext) {
  B.magikarpFlail(c);
}

/** base4-51 · Fire Punch */
export function magmar51FirePunch0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-51 · Flamethrower */
export function magmar51Flamethrower1(c: AttackContext) {
  B.magmarFlamethrower(c);
}

/** base4-52 · Bonemerang */
export function marowak52Bonemerang0(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base4-52 · Call for Friend */
export function marowak52CallforFriend1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(c, (x) => R.startingPokemon(x) && x.types.includes("Fighting"));
}

/** base4-53 · Supersonic */
export function nidorina53Supersonic0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** base4-53 · Double Kick */
export function nidorina53DoubleKick1(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base4-54 · Double Kick */
export function nidorino54DoubleKick0(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base4-54 · Horn Drill */
export function nidorino54HornDrill1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base4-55 · Spore */
export function parasect55Spore0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base4-55 · Slash */
export function parasect55Slash1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-56 · Scratch */
export function persian56Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-56 · Pounce */
export function persian56Pounce1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.linkedReduction(c, 10);
}

/** base4-57 · Amnesia */
export function poliwhirl57Amnesia0(c: AttackContext) {
  B.poliwhirlAmnesia(c);
}

/** base4-57 · Doubleslap */
export function poliwhirl57Doubleslap1(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base4-58 · Bite */
export function raticate58Bite0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-58 · Super Fang */
export function raticate58SuperFang1(c: AttackContext) {
  B.raticateSuperFang(c);
}

/** base4-59 · Horn Attack */
export function rhydon59HornAttack0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-59 · Ram */
export function rhydon59Ram1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  c.recoil(20);
  c.forceSwitch(true);
}

/** base4-60 · Horn Attack */
export function seaking60HornAttack0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-60 · Waterfall */
export function seaking60Waterfall1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-61 · Headbutt */
export function seel61Headbutt0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-62 · Stomp */
export function tauros62Stomp0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 10 : 0));
}

/** base4-62 · Rampage */
export function tauros62Rampage1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + c.attacker.damage);
  if (!c.coin()) c.selfStatus("Confused");
}

/** base4-63 · Withdraw */
export function wartortle63Withdraw0(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** base4-63 · Bite */
export function wartortle63Bite1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** base4-64 · Poisonpowder */
export function weepinbell64Poisonpowder0(c: AttackContext) {
  B.weedlePoisonSting(c);
}

/** base4-64 · Razor Leaf */
export function weepinbell64RazorLeaf1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-65 · Psyshock */
export function abra65Psyshock0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base4-66 · Vine Whip */
export function bellsprout66VineWhip0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-66 · Call for Family */
export function bellsprout66CallforFamily1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(c, (x) => R.startingPokemon(x) && x.name === c.printedCard.name);
}

/** base4-67 · Leech Seed */
export function bulbasaur67LeechSeed0(c: AttackContext) {
  B.bulbasaurLeechSeed(c);
}

/** base4-68 · String Shot */
export function caterpie68StringShot0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base4-69 · Scratch */
export function charmander69Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-69 · Ember */
export function charmander69Ember1(c: AttackContext) {
  B.charmanderEmber(c);
}

/** base4-70 · Snivel */
export function cubone70Snivel0(c: AttackContext) {
  if (!c.begin()) return;
  O.linkedReduction(c, 20);
}

/** base4-70 · Rage */
export function cubone70Rage1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
}

/** base4-71 · Dig */
export function diglett71Dig0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-71 · Mud Slap */
export function diglett71MudSlap1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-72 · Fury Attack */
export function doduo72FuryAttack0(c: AttackContext) {
  B.doduoFuryAttack(c);
}

/** base4-73 · Pound */
export function drowzee73Pound0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-73 · Confuse Ray */
export function drowzee73ConfuseRay1(c: AttackContext) {
  B.vulpixConfuseRay(c);
}

/** base4-74 · Hypnosis */
export function exeggcute74Hypnosis0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base4-74 · Leech Seed */
export function exeggcute74LeechSeed1(c: AttackContext) {
  B.bulbasaurLeechSeed(c);
}

/** base4-75 · Sleeping Gas */
export function gastly75SleepingGas0(c: AttackContext) {
  B.gastlySleepingGas(c);
}

/** base4-75 · Destiny Bond */
export function gastly75DestinyBond1(c: AttackContext) {
  B.gastlyDestinyBond(c);
}

/** base4-76 · Horn Attack */
export function goldeen76HornAttack0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-77 · Lullaby */
export function jigglypuff77Lullaby0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base4-77 · Pound */
export function jigglypuff77Pound1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-78 · Low Kick */
export function machop78LowKick0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-79 · Thunder Wave */
export function magnemite79ThunderWave0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base4-79 · Selfdestruct */
export function magnemite79Selfdestruct1(c: AttackContext) {
  B.magnemiteSelfdestruct(c);
}

/** base4-80 · Pay Day */
export function meowth80PayDay0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) O.draw(c.state, c.player, 1);
}

/** base4-81 · Stiffen */
export function metapod81Stiffen0(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** base4-81 · Stun Spore */
export function metapod81StunSpore1(c: AttackContext) {
  B.tangelaBind(c);
}

/** base4-82 · Fury Swipes */
export function nidoranFemale82FurySwipes0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** base4-82 · Call for Family */
export function nidoranFemale82CallforFamily1(c: AttackContext) {
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

/** base4-83 · Horn Hazard */
export function nidoranMale83HornHazard0(c: AttackContext) {
  B.nidoranHornHazard(c);
}

/** base4-84 · Rock Throw */
export function onix84RockThrow0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-84 · Harden */
export function onix84Harden1(c: AttackContext) {
  B.onixHarden(c);
}

/** base4-85 · Scratch */
export function paras85Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-85 · Spore */
export function paras85Spore1(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** base4-86 · Whirlwind */
export function pidgey86Whirlwind0(c: AttackContext) {
  B.pidgeyWhirlwind(c);
}

/** base4-87 · Gnaw */
export function pikachu87Gnaw0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-87 · Thunder Jolt */
export function pikachu87ThunderJolt1(c: AttackContext) {
  B.pikachuThunderJolt(c);
}

/** base4-88 · Water Gun */
export function poliwag88WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.waterBonus());
}

/** base4-89 · Bite */
export function rattata89Bite0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-90 · Leer */
export function rhyhorn90Leer0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.opponentMark(c, "cannotAttackSource", 1, undefined, true);
}

/** base4-90 · Horn Attack */
export function rhyhorn90HornAttack1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base4-91 · Sand-attack */
export function sandshrew91Sandattack0(c: AttackContext) {
  B.sandshrewSandattack(c);
}

/** base4-92 · Peck */
export function spearow92Peck0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-92 · Mirror Move */
export function spearow92MirrorMove1(c: AttackContext) {
  B.pidgeottoMirrorMove(c);
}

/** base4-93 · Bubble */
export function squirtle93Bubble0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base4-93 · Withdraw */
export function squirtle93Withdraw1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) c.protect("preventDamageUntil");
}

/** base4-94 · Recover */
export function starmie94Recover0(c: AttackContext) {
  B.starmieRecover(c);
}

/** base4-94 · Star Freeze */
export function starmie94StarFreeze1(c: AttackContext) {
  B.tangelaBind(c);
}

/** base4-95 · Slap */
export function staryu95Slap0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base4-96 · Bind */
export function tangela96Bind0(c: AttackContext) {
  B.tangelaBind(c);
}

/** base4-96 · Poisonpowder */
export function tangela96Poisonpowder1(c: AttackContext) {
  B.tangelaPoisonpowder(c);
}

/** base4-97 · Stun Spore */
export function venonat97StunSpore0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base4-97 · Leech Life */
export function venonat97LeechLife1(c: AttackContext) {
  if (!c.begin()) return;
  O.heal(c.attacker, c.hit(10));
}

/** base4-98 · Tackle */
export function voltorb98Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base4-99 · Confuse Ray */
export function vulpix99ConfuseRay0(c: AttackContext) {
  B.vulpixConfuseRay(c);
}

/** base4-100 · Poison Sting */
export function weedle100PoisonSting0(c: AttackContext) {
  B.weedlePoisonSting(c);
}

export const ATTACKS: Record<string, AttackHandler[]> = {
  "base4-1": [alakazam1ConfuseRay0],
  "base4-2": [blastoise2HydroPump0],
  "base4-3": [chansey3Scrunch0, chansey3Doubleedge1],
  "base4-4": [charizard4FireSpin0],
  "base4-5": [clefable5Metronome0, clefable5Minimize1],
  "base4-6": [clefairy6Sing0, clefairy6Metronome1],
  "base4-7": [gyarados7DragonRage0, gyarados7Bubblebeam1],
  "base4-8": [hitmonchan8Jab0, hitmonchan8SpecialPunch1],
  "base4-9": [magneton9ThunderWave0, magneton9Selfdestruct1],
  "base4-10": [mewtwo10Psychic0, mewtwo10Barrier1],
  "base4-11": [nidoking11Thrash0, nidoking11Toxic1],
  "base4-12": [nidoqueen12Boyfriends0, nidoqueen12MegaPunch1],
  "base4-13": [ninetales13Lure0, ninetales13FireBlast1],
  "base4-14": [pidgeot14WingAttack0, pidgeot14Hurricane1],
  "base4-15": [poliwrath15WaterGun0, poliwrath15Whirlpool1],
  "base4-16": [raichu16Agility0, raichu16Thunder1],
  "base4-17": [scyther17SwordsDance0, scyther17Slash1],
  "base4-18": [venusaur18Solarbeam0],
  "base4-19": [wigglytuff19Lullaby0, wigglytuff19DotheWave1],
  "base4-20": [zapdos20Thunder0, zapdos20Thunderbolt1],
  "base4-21": [beedrill21Twineedle0, beedrill21PoisonSting1],
  "base4-22": [dragonair22Slam0, dragonair22HyperBeam1],
  "base4-23": [dugtrio23Slash0, dugtrio23Earthquake1],
  "base4-24": [electabuzz24Thundershock0, electabuzz24Thunderpunch1],
  "base4-25": [electrode25ElectricShock0],
  "base4-26": [kangaskhan26Fetch0, kangaskhan26CometPunch1],
  "base4-27": [mrMime27Meditate0],
  "base4-28": [pidgeotto28Whirlwind0, pidgeotto28MirrorMove1],
  "base4-29": [pinsir29Irongrip0, pinsir29Guillotine1],
  "base4-30": [snorlax30BodySlam0],
  "base4-31": [venomoth31VenomPowder0],
  "base4-32": [victreebel32Lure0, victreebel32Acid1],
  "base4-33": [arcanine33Flamethrower0, arcanine33TakeDown1],
  "base4-34": [butterfree34Whirlwind0, butterfree34MegaDrain1],
  "base4-35": [charmeleon35Slash0, charmeleon35Flamethrower1],
  "base4-36": [dewgong36AuroraBeam0, dewgong36IceBeam1],
  "base4-37": [dodrio37Rage0],
  "base4-38": [dratini38Pound0],
  "base4-39": [exeggutor39Teleport0, exeggutor39BigEggsplosion1],
  "base4-40": [farfetchd40LeekSlap0, farfetchd40PotSmash1],
  "base4-41": [fearow41Agility0, fearow41DrillPeck1],
  "base4-42": [growlithe42Flare0],
  "base4-43": [haunter43Hypnosis0, haunter43DreamEater1],
  "base4-44": [ivysaur44VineWhip0, ivysaur44Poisonpowder1],
  "base4-45": [jynx45Doubleslap0, jynx45Meditate1],
  "base4-46": [kadabra46Recover0, kadabra46SuperPsy1],
  "base4-47": [kakuna47Stiffen0, kakuna47Poisonpowder1],
  "base4-48": [lickitung48TongueWrap0, lickitung48Supersonic1],
  "base4-49": [machoke49KarateChop0, machoke49Submission1],
  "base4-50": [magikarp50Tackle0, magikarp50Flail1],
  "base4-51": [magmar51FirePunch0, magmar51Flamethrower1],
  "base4-52": [marowak52Bonemerang0, marowak52CallforFriend1],
  "base4-53": [nidorina53Supersonic0, nidorina53DoubleKick1],
  "base4-54": [nidorino54DoubleKick0, nidorino54HornDrill1],
  "base4-55": [parasect55Spore0, parasect55Slash1],
  "base4-56": [persian56Scratch0, persian56Pounce1],
  "base4-57": [poliwhirl57Amnesia0, poliwhirl57Doubleslap1],
  "base4-58": [raticate58Bite0, raticate58SuperFang1],
  "base4-59": [rhydon59HornAttack0, rhydon59Ram1],
  "base4-60": [seaking60HornAttack0, seaking60Waterfall1],
  "base4-61": [seel61Headbutt0],
  "base4-62": [tauros62Stomp0, tauros62Rampage1],
  "base4-63": [wartortle63Withdraw0, wartortle63Bite1],
  "base4-64": [weepinbell64Poisonpowder0, weepinbell64RazorLeaf1],
  "base4-65": [abra65Psyshock0],
  "base4-66": [bellsprout66VineWhip0, bellsprout66CallforFamily1],
  "base4-67": [bulbasaur67LeechSeed0],
  "base4-68": [caterpie68StringShot0],
  "base4-69": [charmander69Scratch0, charmander69Ember1],
  "base4-70": [cubone70Snivel0, cubone70Rage1],
  "base4-71": [diglett71Dig0, diglett71MudSlap1],
  "base4-72": [doduo72FuryAttack0],
  "base4-73": [drowzee73Pound0, drowzee73ConfuseRay1],
  "base4-74": [exeggcute74Hypnosis0, exeggcute74LeechSeed1],
  "base4-75": [gastly75SleepingGas0, gastly75DestinyBond1],
  "base4-76": [goldeen76HornAttack0],
  "base4-77": [jigglypuff77Lullaby0, jigglypuff77Pound1],
  "base4-78": [machop78LowKick0],
  "base4-79": [magnemite79ThunderWave0, magnemite79Selfdestruct1],
  "base4-80": [meowth80PayDay0],
  "base4-81": [metapod81Stiffen0, metapod81StunSpore1],
  "base4-82": [nidoranFemale82FurySwipes0, nidoranFemale82CallforFamily1],
  "base4-83": [nidoranMale83HornHazard0],
  "base4-84": [onix84RockThrow0, onix84Harden1],
  "base4-85": [paras85Scratch0, paras85Spore1],
  "base4-86": [pidgey86Whirlwind0],
  "base4-87": [pikachu87Gnaw0, pikachu87ThunderJolt1],
  "base4-88": [poliwag88WaterGun0],
  "base4-89": [rattata89Bite0],
  "base4-90": [rhyhorn90Leer0, rhyhorn90HornAttack1],
  "base4-91": [sandshrew91Sandattack0],
  "base4-92": [spearow92Peck0, spearow92MirrorMove1],
  "base4-93": [squirtle93Bubble0, squirtle93Withdraw1],
  "base4-94": [starmie94Recover0, starmie94StarFreeze1],
  "base4-95": [staryu95Slap0],
  "base4-96": [tangela96Bind0, tangela96Poisonpowder1],
  "base4-97": [venonat97StunSpore0, venonat97LeechLife1],
  "base4-98": [voltorb98Tackle0],
  "base4-99": [vulpix99ConfuseRay0],
  "base4-100": [weedle100PoisonSting0],
};
