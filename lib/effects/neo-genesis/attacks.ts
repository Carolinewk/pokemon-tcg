import type { AttackContext, AttackHandler } from "../context";
import * as O from "../classic/operations";
import * as R from "../classic/state";
import * as B from "../base-set/attacks";

/** neo1-1 · Gigaspark */
export function ampharos1Gigaspark0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  if (c.coin()) {
    c.status("Paralyzed");
    O.benchDamage(c, 10);
  }
}

/** neo1-2 · Tackle */
export function azumarill2Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-2 · Bubble Shower */
export function azumarill2BubbleShower1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) {
    c.status("Paralyzed");
    O.benchDamage(c, 10);
  }
}

/** neo1-3 · Sweet Nectar */
export function bellossom3SweetNectar0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    const p = c.choosePiece(
      "nectar",
      "Choose a Pokémon to heal",
      O.allPieces(c.player),
    );
    O.heal(p, p.damage);
  }
}

/** neo1-3 · Flower Dance */
export function bellossom3FlowerDance1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(
    30 *
      O.allPieces(c.player).filter((p) =>
        R.pokemonCard(c.state, p, c.catalog).name.includes("Bellossom"),
      ).length,
  );
}

/** neo1-4 · Chomp */
export function feraligatr4Chomp0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50 + 10 * O.coins(c, Math.floor(c.attacker.damage / 10)));
}

/** neo1-5 · Riptide */
export function feraligatr5Riptide0(c: AttackContext) {
  if (!c.begin()) return;
  const cards = c.player.discard.filter((h) =>
    O.namedEnergy("Water")(c.catalog[h.card]),
  );
  c.hit(10 + 10 * cards.length);
  O.moveCards(c.player.discard, c.player.deck, cards);
  O.shuffle(c.state, c.player.deck);
}

/** neo1-6 · Megahorn */
export function heracross6Megahorn0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(60);
}

/** neo1-7 · Sleep Powder */
export function jumpluff7SleepPowder0(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    c.status("Asleep");
  }
}

/** neo1-7 · Leech Seed */
export function jumpluff7LeechSeed1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.hit(20) > 0) O.heal(c.attacker, 10);
}

/** neo1-8 · Agility */
export function kingdra8Agility0(c: AttackContext) {
  if (c.begin()) {
    c.hit(30);
    if (c.coin()) c.protect("preventAllUntil");
  }
}

/** neo1-8 · Dragon Tornado */
export function kingdra8DragonTornado1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  c.forceSwitch(false);
}

/** neo1-9 · Elemental Blast */
export function lugia9ElementalBlast0(c: AttackContext) {
  c.payEnergy(1, "Fire");
  c.payEnergy(1, "Water");
  c.payEnergy(1, "Lightning");
  if (!c.begin()) return;
  c.hit(90);
}

/** neo1-10 · Body Slam */
export function meganium10BodySlam0(c: AttackContext) {
  B.gyaradosBubblebeam(c);
}

/** neo1-11 · Soothing Scent */
export function meganium11SoothingScent0(c: AttackContext) {
  if (c.begin()) {
    c.hit(40);
    c.status("Asleep");
  }
}

/** neo1-12 · Zzzap */
export function pichu12Zzzap0(c: AttackContext) {
  if (!c.begin()) return;
  for (const p of O.board(c.state))
    if (c.catalog[p.card].abilities.length) c.hit(20, p, false);
}

/** neo1-13 · Claw */
export function skarmory13Claw0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(20);
}

/** neo1-13 · Steel Wing */
export function skarmory13SteelWing1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) O.putMark(c, c.attacker, "reduceDamage", 1, 20);
}

/** neo1-14 · Mind Blast */
export function slowking14MindBlast0(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(20 + (heads ? 10 : 0));
  if (heads) c.status("Confused");
}

/** neo1-15 · Tackle */
export function steelix15Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-15 · Tail Crush */
export function steelix15TailCrush1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + (c.coin() ? 20 : 0));
}

/** neo1-16 · Super Metronome */
export function togetic16SuperMetronome0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.copyAttack(c, true, true);
}

/** neo1-16 · Fly */
export function togetic16Fly1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    c.hit(30);
    c.protect("preventAllUntil");
  }
}

/** neo1-17 · Flame Burst */
export function typhlosion17FlameBurst0(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(60 + (heads ? 20 : 0));
  if (heads) c.recoil(20);
}

/** neo1-18 · Flame Wheel */
export function typhlosion18FlameWheel0(c: AttackContext) {
  c.payEnergy(3, "Fire");
  if (!c.begin()) return;
  c.hit(80);
  O.benchDamage(c, 20, "both");
}

/** neo1-20 · Eeeeeeek */
export function cleffa20Eeeeeeek0(c: AttackContext) {
  if (!c.begin()) return;
  O.newHand(c, c.player, 7);
}

/** neo1-21 · Flail */
export function donphan21Flail0(c: AttackContext) {
  B.magikarpFlail(c);
}

/** neo1-21 · Rapid Spin */
export function donphan21RapidSpin1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  c.forceSwitch(true);
  O.switchSelf(c);
}

/** neo1-23 · Sputter */
export function magby23Sputter0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.state.powerLockUntil = c.state.turn + 2;
}

/** neo1-24 · Mean Look */
export function murkrow24MeanLook0(c: AttackContext) {
  if (!c.begin()) return;
  O.opponentMark(c, "noRetreat", O.forever, undefined, true);
}

/** neo1-24 · Feint Attack */
export function murkrow24FeintAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.ignoreDefenses = true;
  O.selectedDamage(c, 20, 1, false);
}

/** neo1-25 · Fury Swipes */
export function sneasel25FurySwipes0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** neo1-25 · Beat Up */
export function sneasel25BeatUp1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, O.allPieces(c.player).length));
}

/** neo1-26 · Pilfer */
export function aipom26Pilfer0(c: AttackContext) {
  if (!c.begin()) return;
  O.leavePlay(c, c.attacker, "deck");
  if (c.coin()) O.recover(c, c.player, () => true, 1, "deck");
}

/** neo1-26 · Tail Rap */
export function aipom26TailRap1(c: AttackContext) {
  B.doduoFuryAttack(c);
}

/** neo1-27 · Spider Web */
export function ariados27SpiderWeb0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.opponentMark(c, "noRetreat", O.forever);
}

/** neo1-27 · Poison Bite */
export function ariados27PoisonBite1(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(20);
  if (n) {
    c.status("Poisoned");
    O.heal(c.attacker, Math.ceil(n / 20) * 10);
  }
}

/** neo1-28 · Poisonpowder */
export function bayleef28Poisonpowder0(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** neo1-28 · Pollen Shield */
export function bayleef28PollenShield1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.putMark(c, c.attacker, "conditionGuard");
}

/** neo1-29 · Sweet Scent */
export function bayleef29SweetScent0(c: AttackContext) {
  if (!c.begin()) return;
  const player = c.coin() ? c.player : c.opponent;
  const targets = O.allPieces(player).filter((p) => p.damage);
  if (targets.length)
    O.heal(
      c.choosePiece("sweet-scent", "Choose a Pokémon to heal", targets),
      20,
    );
}

/** neo1-29 · Double Razor Leaf */
export function bayleef29DoubleRazorLeaf1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40 * O.coins(c, 2));
}

/** neo1-30 · Doubleslap */
export function clefairy30Doubleslap0(c: AttackContext) {
  B.doduoFuryAttack(c);
}

/** neo1-30 · Squaredance */
export function clefairy30Squaredance1(c: AttackContext) {
  if (!c.begin()) return;
  O.search(c, c.player, O.basicEnergy, O.coins(c, O.board(c.state).length));
}

/** neo1-31 · Screech */
export function croconaw31Screech0(c: AttackContext) {
  if (!c.begin()) return;
  O.opponentMark(c, "screech", 2, 20);
}

/** neo1-31 · Jaw Clamp */
export function croconaw31JawClamp1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.opponentMark(c, "jawClamp", 1, undefined, true);
}

/** neo1-32 · Tackle */
export function croconaw32Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-32 · Sweep Away */
export function croconaw32SweepAway1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  O.mill(c, c.player, 3);
}

/** neo1-33 · Punch */
export function electabuzz33Punch0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-33 · Swift */
export function electabuzz33Swift1(c: AttackContext) {
  if (!c.begin()) return;
  c.ignoreDefenses = true;
  c.hit(30, c.defender, false);
}

/** neo1-34 · Discharge */
export function flaaffy34Discharge0(c: AttackContext) {
  const n = c.copying ? 0 : O.discardAll(c, "Lightning");
  if (!c.begin()) return;
  c.hit(30 * O.coins(c, n));
}

/** neo1-34 · Electric Current */
export function flaaffy34ElectricCurrent1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.moveAttackEnergy(c, false, "Lightning");
}

/** neo1-35 · Quick Attack */
export function furret35QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 10 : 0));
}

/** neo1-35 · Slam */
export function furret35Slam1(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** neo1-36 · Strange Powder */
export function gloom36StrangePowder0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.status(c.coin() ? "Confused" : "Asleep");
}

/** neo1-36 · Sticky Nectar */
export function gloom36StickyNectar1(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(20 + (heads ? 10 : 0));
  if (heads) O.opponentMark(c, "jawClamp", 2, undefined, true);
}

/** neo1-37 · Tackle */
export function granbull37Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-37 · Raging Charge */
export function granbull37RagingCharge1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
  c.recoil(20);
}

/** neo1-38 · Floodlight */
export function lanturn38Floodlight0(c: AttackContext) {
  B.tangelaBind(c);
}

/** neo1-39 · Baton Pass */
export function ledian39BatonPass0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  const targets = c.player.bench.filter((p) =>
    R.pokemonCard(c.state, p, c.catalog).types.includes("Grass"),
  );
  if (targets.length) {
    const to = c.choosePiece("baton-pass", "Pass Energy to…", targets);
    for (const i of O.energyIndices(c, c.attacker, "Grass").reverse())
      O.moveEnergy(c, c.attacker, to, i);
    O.switchPokemon(c, c.player, to);
  }
}

/** neo1-40 · Tail Slap */
export function magmar40TailSlap0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-40 · Magma Punch */
export function magmar40MagmaPunch1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** neo1-41 · Milk Drink */
export function miltank41MilkDrink0(c: AttackContext) {
  if (!c.begin()) return;
  O.heal(c.attacker, 20 * O.coins(c, 2));
}

/** neo1-41 · Body Slam */
export function miltank41BodySlam1(c: AttackContext) {
  B.tangelaBind(c);
}

/** neo1-42 · Wing Attack */
export function noctowl42WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** neo1-43 · Tackle */
export function phanpy43Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** neo1-43 · Endure */
export function phanpy43Endure1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.putMark(c, c.attacker, "endure");
}

/** neo1-44 · Freeze */
export function piloswine44Freeze0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) O.opponentMark(c, "noAttack", O.forever);
}

/** neo1-44 · Blizzard */
export function piloswine44Blizzard1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.benchDamage(c, 10, c.coin() ? "opponent" : "own");
}

/** neo1-45 · Surf */
export function quagsire45Surf0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** neo1-45 · Earthquake */
export function quagsire45Earthquake1(c: AttackContext) {
  if (c.begin()) {
    c.hit(60);
    O.benchDamage(c, 10, "own");
  }
}

/** neo1-46 · Ember */
export function quilava46Ember0(c: AttackContext) {
  B.charmanderEmber(c);
}

/** neo1-46 · Fire Wind */
export function quilava46FireWind1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.opponent.bench.length) {
    const p = c.choosePiece(
      "fire-wind",
      "Choose a Benched Pokémon",
      c.opponent.bench,
    );
    c.hit(10 * O.coins(c, 2), p, false);
  }
}

/** neo1-47 · Smokescreen */
export function quilava47Smokescreen0(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (!c.effectsBlocked())
      (c.defender.effects ||= {}).sandAttackUntil = c.state.turn + 1;
  }
}

/** neo1-47 · Char */
export function quilava47Char1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (!c.defender.charred && c.coin() && !c.effectsBlocked())
    c.defender.charred = true;
}

/** neo1-48 · Bubble */
export function seadra48Bubble0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** neo1-48 · Mud Splash */
export function seadra48MudSplash1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.opponent.bench.length) {
    const p = c.choosePiece(
      "mud-splash",
      "Choose a Benched Pokémon",
      c.opponent.bench,
    );
    if (c.coin()) c.hit(10, p, false);
  }
}

/** neo1-49 · Poisonpowder */
export function skiploom49Poisonpowder0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Poisoned");
  }
}

/** neo1-49 · Stun Spore */
export function skiploom49StunSpore1(c: AttackContext) {
  B.squirtleBubble(c);
}

/** neo1-50 · Petal Dance */
export function sunflora50PetalDance0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(O.coins(c, 3) * 30);
  c.selfStatus("Confused");
}

/** neo1-51 · Poison Barb */
export function togepi51PoisonBarb0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Poisoned");
  }
}

/** neo1-52 · Prophecy */
export function xatu52Prophecy0(c: AttackContext) {
  if (!c.begin()) return;
  O.prophecy(c);
}

/** neo1-52 · Confuse Ray */
export function xatu52ConfuseRay1(c: AttackContext) {
  B.alakazamConfuseRay(c);
}

/** neo1-53 · Tackle */
export function chikorita53Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** neo1-53 · Deflector */
export function chikorita53Deflector1(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "halveDamage");
}

/** neo1-54 · Growl */
export function chikorita54Growl0(c: AttackContext) {
  if (!c.begin()) return;
  O.linkedReduction(c, 10, true);
}

/** neo1-54 · Razor Leaf */
export function chikorita54RazorLeaf1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-55 · Supersonic */
export function chinchou55Supersonic0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** neo1-55 · Flail */
export function chinchou55Flail1(c: AttackContext) {
  B.magikarpFlail(c);
}

/** neo1-56 · Leer */
export function cyndaquil56Leer0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.opponentMark(c, "cannotAttackSource", 1, undefined, true);
}

/** neo1-56 · Swift */
export function cyndaquil56Swift1(c: AttackContext) {
  if (!c.begin()) return;
  c.ignoreDefenses = true;
  c.hit(20, c.defender, false);
}

/** neo1-57 · Fireworks */
export function cyndaquil57Fireworks0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (!c.coin() && c.attacker.energy.length) c.payEnergy(1);
}

/** neo1-57 · Quick Attack */
export function cyndaquil57QuickAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** neo1-58 · Agility */
export function girafarig58Agility0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    if (c.coin()) c.protect("preventAllUntil");
  }
}

/** neo1-58 · Psybeam */
export function girafarig58Psybeam1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (c.coin()) c.status("Confused");
  }
}

/** neo1-59 · Poison Sting */
export function gligar59PoisonSting0(c: AttackContext) {
  B.weedlePoisonSting(c);
}

/** neo1-59 · Slash */
export function gligar59Slash1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-60 · Hypnosis */
export function hoothoot60Hypnosis0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** neo1-60 · Peck */
export function hoothoot60Peck1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** neo1-61 · Hop */
export function hoppip61Hop0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** neo1-61 · Sprout */
export function hoppip61Sprout1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  O.family(c, (x) => R.startingPokemon(x) && x.name === c.printedCard.name);
}

/** neo1-62 · Fin Slap */
export function horsea62FinSlap0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(
    20 +
      (c.previousAttack?.turn === c.state.turn - 1 &&
      c.previousAttack.damage > 0
        ? 10
        : 0),
  );
}

/** neo1-63 · Supersonic */
export function ledyba63Supersonic0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** neo1-63 · Comet Punch */
export function ledyba63CometPunch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 4));
}

/** neo1-64 · Undulate */
export function mantine64Undulate0(c: AttackContext) {
  B.raichuAgility(c);
}

/** neo1-65 · Static Electricity */
export function mareep65StaticElectricity0(c: AttackContext) {
  if (!c.begin()) return;
  O.search(
    c,
    c.player,
    O.namedEnergy("Lightning"),
    O.countNames(c, ["Mareep"], true),
    "energy",
    c.attacker,
  );
}

/** neo1-65 · Thundershock */
export function mareep65Thundershock1(c: AttackContext) {
  B.tangelaBind(c);
}

/** neo1-66 · Defense Curl */
export function marill66DefenseCurl0(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** neo1-66 · Bubble Bomb */
export function marill66BubbleBomb1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) c.status("Paralyzed");
  else c.recoil(10);
}

/** neo1-67 · Peck */
export function natu67Peck0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** neo1-67 · Telekinesis */
export function natu67Telekinesis1(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 20, 1, false);
}

/** neo1-68 · Hide */
export function oddish68Hide0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.protect("preventAllUntil");
  }
}

/** neo1-68 · Absorb */
export function oddish68Absorb1(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(20);
  O.heal(c.attacker, Math.ceil(n / 20) * 10);
}

/** neo1-69 · Screech */
export function onix69Screech0(c: AttackContext) {
  if (!c.begin()) return;
  O.opponentMark(c, "screech", 2, 20);
}

/** neo1-69 · Rage */
export function onix69Rage1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
}

/** neo1-70 · Quick Attack */
export function pikachu70QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** neo1-70 · Agility */
export function pikachu70Agility1(c: AttackContext) {
  B.raichuAgility(c);
}

/** neo1-71 · Fury Swipes */
export function sentret71FurySwipes0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** neo1-72 · Withdraw */
export function shuckle72Withdraw0(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** neo1-72 · Wrap */
export function shuckle72Wrap1(c: AttackContext) {
  B.tangelaBind(c);
}

/** neo1-73 · Psyshock */
export function slowpoke73Psyshock0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** neo1-73 · Water Gun */
export function slowpoke73WaterGun1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.waterBonus());
}

/** neo1-74 · Roar */
export function snubbull74Roar0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(0);
  if (c.coin()) c.forceSwitch(true);
}

/** neo1-74 · Lick */
export function snubbull74Lick1(c: AttackContext) {
  B.squirtleBubble(c);
}

/** neo1-75 · Scary Face */
export function spinarak75ScaryFace0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    O.opponentMark(c, "noAttack");
    O.opponentMark(c, "noRetreat");
  }
}

/** neo1-75 · String Shot */
export function spinarak75StringShot1(c: AttackContext) {
  B.squirtleBubble(c);
}

/** neo1-76 · Stomp */
export function stantler76Stomp0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 10 : 0));
}

/** neo1-76 · Mystifying Horns */
export function stantler76MystifyingHorns1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (c.coin()) c.status("Confused");
  }
}

/** neo1-77 · Flail */
export function sudowoodo77Flail0(c: AttackContext) {
  B.magikarpFlail(c);
}

/** neo1-77 · Rock Throw */
export function sudowoodo77RockThrow1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** neo1-78 · Growth */
export function sunkern78Growth0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    const hs = c.chooseCards(
      "growth",
      "Attach up to 2 Grass Energy cards",
      c.player.hand.filter((h) => O.namedEnergy("Grass")(c.catalog[h.card])),
      0,
      2,
    );
    for (const h of hs) {
      c.player.hand.splice(
        c.player.hand.findIndex((q) => q.uid === h.uid),
        1,
      );
      c.attachEnergy(c.attacker, h);
    }
  }
}

/** neo1-78 · Mega Drain */
export function sunkern78MegaDrain1(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(30);
  O.heal(c.attacker, Math.ceil(n / 20) * 10);
}

/** neo1-79 · Powder Snow */
export function swinub79PowderSnow0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Asleep");
  }
}

/** neo1-80 · Bite */
export function totodile80Bite0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** neo1-80 · Rage */
export function totodile80Rage1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.attacker.damage);
}

/** neo1-81 · Leer */
export function totodile81Leer0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.opponentMark(c, "cannotAttackSource", 1, undefined, true);
}

/** neo1-81 · Fury Swipes */
export function totodile81FurySwipes1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** neo1-82 · Amnesia */
export function wooper82Amnesia0(c: AttackContext) {
  B.poliwhirlAmnesia(c);
}

/** neo1-82 · Slam */
export function wooper82Slam1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 2));
}

export const ATTACKS: Record<string, AttackHandler[]> = {
  "neo1-1": [ampharos1Gigaspark0],
  "neo1-2": [azumarill2Tackle0, azumarill2BubbleShower1],
  "neo1-3": [bellossom3SweetNectar0, bellossom3FlowerDance1],
  "neo1-4": [feraligatr4Chomp0],
  "neo1-5": [feraligatr5Riptide0],
  "neo1-6": [heracross6Megahorn0],
  "neo1-7": [jumpluff7SleepPowder0, jumpluff7LeechSeed1],
  "neo1-8": [kingdra8Agility0, kingdra8DragonTornado1],
  "neo1-9": [lugia9ElementalBlast0],
  "neo1-10": [meganium10BodySlam0],
  "neo1-11": [meganium11SoothingScent0],
  "neo1-12": [pichu12Zzzap0],
  "neo1-13": [skarmory13Claw0, skarmory13SteelWing1],
  "neo1-14": [slowking14MindBlast0],
  "neo1-15": [steelix15Tackle0, steelix15TailCrush1],
  "neo1-16": [togetic16SuperMetronome0, togetic16Fly1],
  "neo1-17": [typhlosion17FlameBurst0],
  "neo1-18": [typhlosion18FlameWheel0],
  "neo1-20": [cleffa20Eeeeeeek0],
  "neo1-21": [donphan21Flail0, donphan21RapidSpin1],
  "neo1-23": [magby23Sputter0],
  "neo1-24": [murkrow24MeanLook0, murkrow24FeintAttack1],
  "neo1-25": [sneasel25FurySwipes0, sneasel25BeatUp1],
  "neo1-26": [aipom26Pilfer0, aipom26TailRap1],
  "neo1-27": [ariados27SpiderWeb0, ariados27PoisonBite1],
  "neo1-28": [bayleef28Poisonpowder0, bayleef28PollenShield1],
  "neo1-29": [bayleef29SweetScent0, bayleef29DoubleRazorLeaf1],
  "neo1-30": [clefairy30Doubleslap0, clefairy30Squaredance1],
  "neo1-31": [croconaw31Screech0, croconaw31JawClamp1],
  "neo1-32": [croconaw32Tackle0, croconaw32SweepAway1],
  "neo1-33": [electabuzz33Punch0, electabuzz33Swift1],
  "neo1-34": [flaaffy34Discharge0, flaaffy34ElectricCurrent1],
  "neo1-35": [furret35QuickAttack0, furret35Slam1],
  "neo1-36": [gloom36StrangePowder0, gloom36StickyNectar1],
  "neo1-37": [granbull37Tackle0, granbull37RagingCharge1],
  "neo1-38": [lanturn38Floodlight0],
  "neo1-39": [ledian39BatonPass0],
  "neo1-40": [magmar40TailSlap0, magmar40MagmaPunch1],
  "neo1-41": [miltank41MilkDrink0, miltank41BodySlam1],
  "neo1-42": [noctowl42WingAttack0],
  "neo1-43": [phanpy43Tackle0, phanpy43Endure1],
  "neo1-44": [piloswine44Freeze0, piloswine44Blizzard1],
  "neo1-45": [quagsire45Surf0, quagsire45Earthquake1],
  "neo1-46": [quilava46Ember0, quilava46FireWind1],
  "neo1-47": [quilava47Smokescreen0, quilava47Char1],
  "neo1-48": [seadra48Bubble0, seadra48MudSplash1],
  "neo1-49": [skiploom49Poisonpowder0, skiploom49StunSpore1],
  "neo1-50": [sunflora50PetalDance0],
  "neo1-51": [togepi51PoisonBarb0],
  "neo1-52": [xatu52Prophecy0, xatu52ConfuseRay1],
  "neo1-53": [chikorita53Tackle0, chikorita53Deflector1],
  "neo1-54": [chikorita54Growl0, chikorita54RazorLeaf1],
  "neo1-55": [chinchou55Supersonic0, chinchou55Flail1],
  "neo1-56": [cyndaquil56Leer0, cyndaquil56Swift1],
  "neo1-57": [cyndaquil57Fireworks0, cyndaquil57QuickAttack1],
  "neo1-58": [girafarig58Agility0, girafarig58Psybeam1],
  "neo1-59": [gligar59PoisonSting0, gligar59Slash1],
  "neo1-60": [hoothoot60Hypnosis0, hoothoot60Peck1],
  "neo1-61": [hoppip61Hop0, hoppip61Sprout1],
  "neo1-62": [horsea62FinSlap0],
  "neo1-63": [ledyba63Supersonic0, ledyba63CometPunch1],
  "neo1-64": [mantine64Undulate0],
  "neo1-65": [mareep65StaticElectricity0, mareep65Thundershock1],
  "neo1-66": [marill66DefenseCurl0, marill66BubbleBomb1],
  "neo1-67": [natu67Peck0, natu67Telekinesis1],
  "neo1-68": [oddish68Hide0, oddish68Absorb1],
  "neo1-69": [onix69Screech0, onix69Rage1],
  "neo1-70": [pikachu70QuickAttack0, pikachu70Agility1],
  "neo1-71": [sentret71FurySwipes0],
  "neo1-72": [shuckle72Withdraw0, shuckle72Wrap1],
  "neo1-73": [slowpoke73Psyshock0, slowpoke73WaterGun1],
  "neo1-74": [snubbull74Roar0, snubbull74Lick1],
  "neo1-75": [spinarak75ScaryFace0, spinarak75StringShot1],
  "neo1-76": [stantler76Stomp0, stantler76MystifyingHorns1],
  "neo1-77": [sudowoodo77Flail0, sudowoodo77RockThrow1],
  "neo1-78": [sunkern78Growth0, sunkern78MegaDrain1],
  "neo1-79": [swinub79PowderSnow0],
  "neo1-80": [totodile80Bite0, totodile80Rage1],
  "neo1-81": [totodile81Leer0, totodile81FurySwipes1],
  "neo1-82": [wooper82Amnesia0, wooper82Slam1],
};
