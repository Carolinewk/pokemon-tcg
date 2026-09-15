import type { AttackContext, AttackHandler } from "../context";
import * as O from "../classic/operations";
import * as R from "../classic/state";
import * as B from "../base-set/attacks";

/** base3-1 · Wing Attack */
export function aerodactyl1WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base3-2 · Freeze Dry */
export function articuno2FreezeDry0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base3-2 · Blizzard */
export function articuno2Blizzard1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  O.benchDamage(c, 10, c.coin() ? "opponent" : "own");
}

/** base3-4 · Slam */
export function dragonite4Slam0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40 * O.coins(c, 2));
}

/** base3-5 · Dark Mind */
export function gengar5DarkMind0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.selectedDamage(c, 10);
}

/** base3-6 · Nightmare */
export function haunter6Nightmare0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Asleep");
  }
}

/** base3-7 · Stretch Kick */
export function hitmonlee7StretchKick0(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 20);
}

/** base3-7 · High Jump Kick */
export function hitmonlee7HighJumpKick1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base3-8 · Prophecy */
export function hypno8Prophecy0(c: AttackContext) {
  if (!c.begin()) return;
  O.prophecy(c);
}

/** base3-8 · Dark Mind */
export function hypno8DarkMind1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.selectedDamage(c, 10);
}

/** base3-9 · Sharp Sickle */
export function kabutops9SharpSickle0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base3-9 · Absorb */
export function kabutops9Absorb1(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(40);
  O.heal(c.attacker, Math.ceil(n / 20) * 10);
}

/** base3-10 · Water Gun */
export function lapras10WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.waterBonus());
}

/** base3-10 · Confuse Ray */
export function lapras10ConfuseRay1(c: AttackContext) {
  B.vulpixConfuseRay(c);
}

/** base3-11 · Sonicboom */
export function magneton11Sonicboom0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20, c.defender, false);
}

/** base3-11 · Selfdestruct */
export function magneton11Selfdestruct1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(100);
  O.benchDamage(c, 20, "both");
  c.recoil(100);
}

/** base3-12 · Wildfire */
export function moltres12Wildfire0(c: AttackContext) {
  if (!c.begin()) return;
  const ix = c.chooseEnergy(
    "wildfire",
    "Discard Fire Energy to discard cards from the opponent’s deck",
    c.attacker,
    0,
    O.energyIndices(c, c.attacker, "Fire").length,
    "Fire",
  );
  O.discardEnergy(c.state, c.player, c.attacker, ix);
  O.mill(c, c.opponent, ix.length);
}

/** base3-12 · Dive Bomb */
export function moltres12DiveBomb1(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(80);
}

/** base3-13 · Sludge */
export function muk13Sludge0(c: AttackContext) {
  if (c.begin()) {
    c.hit(30);
    if (c.coin()) c.status("Poisoned");
  }
}

/** base3-14 · Gigashock */
export function raichu14Gigashock0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.selectedDamage(c, 10, 3);
}

/** base3-15 · Thunderstorm */
export function zapdos15Thunderstorm0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  let tails = 0;
  for (const p of c.opponent.bench) {
    if (c.coin()) c.hit(20, p, false);
    else tails++;
  }
  c.recoil(tails * 10);
}

/** base3-16 · Wing Attack */
export function aerodactyl16WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base3-17 · Freeze Dry */
export function articuno17FreezeDry0(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** base3-17 · Blizzard */
export function articuno17Blizzard1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  O.benchDamage(c, 10, c.coin() ? "opponent" : "own");
}

/** base3-19 · Slam */
export function dragonite19Slam0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40 * O.coins(c, 2));
}

/** base3-20 · Dark Mind */
export function gengar20DarkMind0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.selectedDamage(c, 10);
}

/** base3-21 · Nightmare */
export function haunter21Nightmare0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Asleep");
  }
}

/** base3-22 · Stretch Kick */
export function hitmonlee22StretchKick0(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 20);
}

/** base3-22 · High Jump Kick */
export function hitmonlee22HighJumpKick1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** base3-23 · Prophecy */
export function hypno23Prophecy0(c: AttackContext) {
  if (!c.begin()) return;
  O.prophecy(c);
}

/** base3-23 · Dark Mind */
export function hypno23DarkMind1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.selectedDamage(c, 10);
}

/** base3-24 · Sharp Sickle */
export function kabutops24SharpSickle0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base3-24 · Absorb */
export function kabutops24Absorb1(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(40);
  O.heal(c.attacker, Math.ceil(n / 20) * 10);
}

/** base3-25 · Water Gun */
export function lapras25WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.waterBonus());
}

/** base3-25 · Confuse Ray */
export function lapras25ConfuseRay1(c: AttackContext) {
  B.vulpixConfuseRay(c);
}

/** base3-26 · Sonicboom */
export function magneton26Sonicboom0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20, c.defender, false);
}

/** base3-26 · Selfdestruct */
export function magneton26Selfdestruct1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(100);
  O.benchDamage(c, 20, "both");
  c.recoil(100);
}

/** base3-27 · Wildfire */
export function moltres27Wildfire0(c: AttackContext) {
  if (!c.begin()) return;
  const ix = c.chooseEnergy(
    "wildfire",
    "Discard Fire Energy to discard cards from the opponent’s deck",
    c.attacker,
    0,
    O.energyIndices(c, c.attacker, "Fire").length,
    "Fire",
  );
  O.discardEnergy(c.state, c.player, c.attacker, ix);
  O.mill(c, c.opponent, ix.length);
}

/** base3-27 · Dive Bomb */
export function moltres27DiveBomb1(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(80);
}

/** base3-28 · Sludge */
export function muk28Sludge0(c: AttackContext) {
  if (c.begin()) {
    c.hit(30);
    if (c.coin()) c.status("Poisoned");
  }
}

/** base3-29 · Gigashock */
export function raichu29Gigashock0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.selectedDamage(c, 10, 3);
}

/** base3-30 · Thunderstorm */
export function zapdos30Thunderstorm0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  let tails = 0;
  for (const p of c.opponent.bench) {
    if (c.coin()) c.hit(20, p, false);
    else tails++;
  }
  c.recoil(tails * 10);
}

/** base3-31 · Terror Strike */
export function arbok31TerrorStrike0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.forceSwitch(true);
}

/** base3-31 · Poison Fang */
export function arbok31PoisonFang1(c: AttackContext) {
  B.tangelaPoisonpowder(c);
}

/** base3-32 · Clamp */
export function cloyster32Clamp0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    c.hit(30);
    c.status("Paralyzed");
  }
}

/** base3-32 · Spike Cannon */
export function cloyster32SpikeCannon1(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base3-33 · Lick */
export function gastly33Lick0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base3-33 · Energy Conversion */
export function gastly33EnergyConversion1(c: AttackContext) {
  if (!c.begin()) return;
  O.recover(c, c.player, (x) => x.supertype === "Energy", 2);
  c.recoil(10);
}

/** base3-34 · Wing Attack */
export function golbat34WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** base3-34 · Leech Life */
export function golbat34LeechLife1(c: AttackContext) {
  if (!c.begin()) return;
  O.heal(c.attacker, c.hit(20));
}

/** base3-35 · Psyshock */
export function golduck35Psyshock0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base3-35 · Hyper Beam */
export function golduck35HyperBeam1(c: AttackContext) {
  B.dragonairHyperBeam(c);
}

/** base3-36 · Avalanche */
export function golem36Avalanche0(c: AttackContext) {
  if (c.begin()) c.hit(60);
}

/** base3-36 · Selfdestruct */
export function golem36Selfdestruct1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(100);
  O.benchDamage(c, 20, "both");
  c.recoil(100);
}

/** base3-37 · Harden */
export function graveler37Harden0(c: AttackContext) {
  B.onixHarden(c);
}

/** base3-37 · Rock Throw */
export function graveler37RockThrow1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** base3-38 · Flail */
export function kingler38Flail0(c: AttackContext) {
  B.magikarpFlail(c);
}

/** base3-38 · Crabhammer */
export function kingler38Crabhammer1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** base3-39 · Smokescreen */
export function magmar39Smokescreen0(c: AttackContext) {
  B.sandshrewSandattack(c);
}

/** base3-39 · Smog */
export function magmar39Smog1(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** base3-40 · Water Gun */
export function omastar40WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + c.waterBonus());
}

/** base3-40 · Spike Cannon */
export function omastar40SpikeCannon1(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** base3-41 · Slash */
export function sandslash41Slash0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base3-41 · Fury Swipes */
export function sandslash41FurySwipes1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 3));
}

/** base3-42 · Water Gun */
export function seadra42WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + c.waterBonus());
}

/** base3-42 · Agility */
export function seadra42Agility1(c: AttackContext) {
  B.raichuAgility(c);
}

/** base3-43 · Psyshock */
export function slowbro43Psyshock0(c: AttackContext) {
  B.tangelaBind(c);
}

/** base3-44 · Supersonic */
export function tentacruel44Supersonic0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** base3-44 · Jellyfish Sting */
export function tentacruel44JellyfishSting1(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Poisoned");
  }
}

/** base3-45 · Smog */
export function weezing45Smog0(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** base3-45 · Selfdestruct */
export function weezing45Selfdestruct1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(60);
  O.benchDamage(c, 10, "both");
  c.recoil(60);
}

/** base3-46 · Spit Poison */
export function ekans46SpitPoison0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Poisoned");
  }
}

/** base3-46 · Wrap */
export function ekans46Wrap1(c: AttackContext) {
  B.tangelaBind(c);
}

/** base3-47 · Stone Barrage */
export function geodude47StoneBarrage0(c: AttackContext) {
  if (!c.begin()) return;
  let heads = 0;
  while (c.coin()) heads++;
  c.hit(heads * 10);
}

/** base3-48 · Nasty Goo */
export function grimer48NastyGoo0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** base3-48 · Minimize */
export function grimer48Minimize1(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "reduceDamage", 1, 20);
}

/** base3-49 · Smokescreen */
export function horsea49Smokescreen0(c: AttackContext) {
  B.sandshrewSandattack(c);
}

/** base3-50 · Scratch */
export function kabuto50Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base3-51 · Call for Family */
export function krabby51CallforFamily0(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(c, (x) => R.startingPokemon(x) && x.name === c.printedCard.name);
}

/** base3-51 · Irongrip */
export function krabby51Irongrip1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** base3-52 · Water Gun */
export function omanyte52WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.waterBonus());
}

/** base3-53 · Headache */
export function psyduck53Headache0(c: AttackContext) {
  if (!c.begin()) return;
  O.lockTrainers(c, c.opponent);
}

/** base3-53 · Fury Swipes */
export function psyduck53FurySwipes1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** base3-54 · Supersonic */
export function shellder54Supersonic0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** base3-54 · Hide in Shell */
export function shellder54HideinShell1(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** base3-55 · Spacing Out */
export function slowpoke55SpacingOut0(c: AttackContext) {
  c.require(c.attacker.damage > 0, "This Pokémon has no damage counters.");
  if (!c.begin()) return;
  if (c.coin()) O.heal(c.attacker, 10);
}

/** base3-55 · Scavenge */
export function slowpoke55Scavenge1(c: AttackContext) {
  c.require(
    c.player.discard.some((h) => c.catalog[h.card].supertype === "Trainer"),
    "No Trainer to retrieve.",
  );
  c.payEnergy(1, "Psychic");
  if (!c.begin()) return;
  O.recover(
    c,
    c.player,
    (x) => x.supertype === "Trainer",
    1,
    "hand",
    undefined,
    "scavenge",
    true,
  );
}

/** base3-56 · Acid */
export function tentacool56Acid0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** base3-57 · Supersonic */
export function zubat57Supersonic0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** base3-57 · Leech Life */
export function zubat57LeechLife1(c: AttackContext) {
  if (!c.begin()) return;
  O.heal(c.attacker, c.hit(10));
}

export const ATTACKS: Record<string, AttackHandler[]> = {
  "base3-1": [aerodactyl1WingAttack0],
  "base3-2": [articuno2FreezeDry0, articuno2Blizzard1],
  "base3-4": [dragonite4Slam0],
  "base3-5": [gengar5DarkMind0],
  "base3-6": [haunter6Nightmare0],
  "base3-7": [hitmonlee7StretchKick0, hitmonlee7HighJumpKick1],
  "base3-8": [hypno8Prophecy0, hypno8DarkMind1],
  "base3-9": [kabutops9SharpSickle0, kabutops9Absorb1],
  "base3-10": [lapras10WaterGun0, lapras10ConfuseRay1],
  "base3-11": [magneton11Sonicboom0, magneton11Selfdestruct1],
  "base3-12": [moltres12Wildfire0, moltres12DiveBomb1],
  "base3-13": [muk13Sludge0],
  "base3-14": [raichu14Gigashock0],
  "base3-15": [zapdos15Thunderstorm0],
  "base3-16": [aerodactyl16WingAttack0],
  "base3-17": [articuno17FreezeDry0, articuno17Blizzard1],
  "base3-19": [dragonite19Slam0],
  "base3-20": [gengar20DarkMind0],
  "base3-21": [haunter21Nightmare0],
  "base3-22": [hitmonlee22StretchKick0, hitmonlee22HighJumpKick1],
  "base3-23": [hypno23Prophecy0, hypno23DarkMind1],
  "base3-24": [kabutops24SharpSickle0, kabutops24Absorb1],
  "base3-25": [lapras25WaterGun0, lapras25ConfuseRay1],
  "base3-26": [magneton26Sonicboom0, magneton26Selfdestruct1],
  "base3-27": [moltres27Wildfire0, moltres27DiveBomb1],
  "base3-28": [muk28Sludge0],
  "base3-29": [raichu29Gigashock0],
  "base3-30": [zapdos30Thunderstorm0],
  "base3-31": [arbok31TerrorStrike0, arbok31PoisonFang1],
  "base3-32": [cloyster32Clamp0, cloyster32SpikeCannon1],
  "base3-33": [gastly33Lick0, gastly33EnergyConversion1],
  "base3-34": [golbat34WingAttack0, golbat34LeechLife1],
  "base3-35": [golduck35Psyshock0, golduck35HyperBeam1],
  "base3-36": [golem36Avalanche0, golem36Selfdestruct1],
  "base3-37": [graveler37Harden0, graveler37RockThrow1],
  "base3-38": [kingler38Flail0, kingler38Crabhammer1],
  "base3-39": [magmar39Smokescreen0, magmar39Smog1],
  "base3-40": [omastar40WaterGun0, omastar40SpikeCannon1],
  "base3-41": [sandslash41Slash0, sandslash41FurySwipes1],
  "base3-42": [seadra42WaterGun0, seadra42Agility1],
  "base3-43": [slowbro43Psyshock0],
  "base3-44": [tentacruel44Supersonic0, tentacruel44JellyfishSting1],
  "base3-45": [weezing45Smog0, weezing45Selfdestruct1],
  "base3-46": [ekans46SpitPoison0, ekans46Wrap1],
  "base3-47": [geodude47StoneBarrage0],
  "base3-48": [grimer48NastyGoo0, grimer48Minimize1],
  "base3-49": [horsea49Smokescreen0],
  "base3-50": [kabuto50Scratch0],
  "base3-51": [krabby51CallforFamily0, krabby51Irongrip1],
  "base3-52": [omanyte52WaterGun0],
  "base3-53": [psyduck53Headache0, psyduck53FurySwipes1],
  "base3-54": [shellder54Supersonic0, shellder54HideinShell1],
  "base3-55": [slowpoke55SpacingOut0, slowpoke55Scavenge1],
  "base3-56": [tentacool56Acid0],
  "base3-57": [zubat57Supersonic0, zubat57LeechLife1],
};
