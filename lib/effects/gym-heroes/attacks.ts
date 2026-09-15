import type { AttackContext, AttackHandler } from "../context";
import * as O from "../classic/operations";
import * as R from "../classic/state";
import * as B from "../base-set/attacks";

/** gym1-1 · Phoenix Flame */
export function blainesMoltres1PhoenixFlame0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(90);
  if (!c.coin()) O.leavePlay(c, c.attacker, "deck");
}

/** gym1-2 · Lariat */
export function brocksRhydon2Lariat0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(70);
}

/** gym1-3 · Fairy Power */
export function erikasClefable3FairyPower0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    const all = O.allPieces(c.player);
    const ids = c.choose(
      "fairy-power",
      "Return Pokémon and their attachments to your hand",
      all.map((p) => ({
        value: p.uid,
        label: c.catalog[p.card].name,
        card: p.card,
      })),
      0,
      all.length,
    );
    for (const p of all.filter((p) => ids.includes(p.uid)))
      O.leavePlay(c, p, "hand");
  }
}

/** gym1-3 · Moon Impact */
export function erikasClefable3MoonImpact1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym1-4 · Blizzard */
export function erikasDragonair4Blizzard0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.benchDamage(c, 10, c.coin() ? "opponent" : "own");
}

/** gym1-4 · Take Away */
export function erikasDragonair4TakeAway1(c: AttackContext) {
  if (!c.begin()) return;
  O.leavePlay(c, c.attacker, "deck");
  if (!c.effectsBlocked()) O.leavePlay(c, c.defender, "deck");
}

/** gym1-5 · Mega Drain */
export function erikasVileplume5MegaDrain0(c: AttackContext) {
  if (!c.begin()) return;
  const n = c.hit(30);
  O.heal(c.attacker, Math.ceil(n / 20) * 10);
}

/** gym1-6 · Charge */
export function ltSurgesElectabuzz6Charge0(c: AttackContext) {
  if (!c.begin()) return;
  O.recover(c, c.player, O.namedEnergy("Lightning"), 2, "energy", c.attacker);
}

/** gym1-6 · Discharge */
export function ltSurgesElectabuzz6Discharge1(c: AttackContext) {
  const n = c.copying ? 0 : O.discardAll(c, "Lightning");
  if (!c.begin()) return;
  c.hit(30 * O.coins(c, n));
}

/** gym1-7 · Repeating Drill */
export function ltSurgesFearow7RepeatingDrill0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 5));
}

/** gym1-7 · Clutch */
export function ltSurgesFearow7Clutch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.opponentMark(c, "noRetreat");
}

/** gym1-8 · Mega Shock */
export function ltSurgesMagneton8MegaShock0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  if (!c.coin()) c.recoil(20);
}

/** gym1-9 · Tail Snap */
export function mistysSeadra9TailSnap0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-9 · Knockout Needle */
export function mistysSeadra9KnockoutNeedle1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + (O.coins(c, 2) === 2 ? 60 : 0));
}

/** gym1-10 · Jellyfish Poison */
export function mistysTentacruel10JellyfishPoison0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  c.status(c.coin() ? "Poisoned" : "Confused");
}

/** gym1-11 · Crosscounter */
export function rocketsHitmonchan11Crosscounter0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "crosscounter");
}

/** gym1-11 · Magnum Punch */
export function rocketsHitmonchan11MagnumPunch1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** gym1-12 · Fire Wall */
export function rocketsMoltres12FireWall0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  O.putMark(c, c.attacker, "fireWall");
}

/** gym1-13 · Shadow Images */
export function rocketsScyther13ShadowImages0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "shadowImages", O.forever);
}

/** gym1-13 · Blinding Scythe */
export function rocketsScyther13BlindingScythe1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** gym1-14 · Pain Amplifier */
export function sabrinasGengar14PainAmplifier0(c: AttackContext) {
  if (!c.begin()) return;
  for (const p of O.allPieces(c.opponent))
    if (p.damage) O.damageCounters(c, p, 10);
}

/** gym1-14 · Call of the Night */
export function sabrinasGengar14CalloftheNight1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  if (
    c.defender.damage < R.maximumHP(c.state, c.defender, c.catalog) &&
    O.coins(c, 2) === 2 &&
    !c.effectsBlocked()
  )
    O.leavePlay(c, c.defender, "deck");
}

/** gym1-20 · Rock Slide */
export function brocksGolem20RockSlide0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.selectedDamage(c, 10, 3, true, true);
}

/** gym1-20 · Fissure */
export function brocksGolem20Fissure1(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** gym1-21 · Bind */
export function brocksOnix21Bind0(c: AttackContext) {
  B.tangelaBind(c);
}

/** gym1-21 · Tunneling */
export function brocksOnix21Tunneling1(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 20, 2, true, true);
  O.putMark(c, c.attacker, "noAttack", 2);
}

/** gym1-22 · Horn Toss */
export function brocksRhyhorn22HornToss0(c: AttackContext) {
  B.pidgeottoWhirlwind(c);
}

/** gym1-22 · Take Down */
export function brocksRhyhorn22TakeDown1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  c.recoil(10);
}

/** gym1-23 · Needles */
export function brocksSandslash23Needles0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) {
    c.status("Paralyzed");
    c.status("Poisoned");
  }
}

/** gym1-23 · Sandstorm */
export function brocksSandslash23Sandstorm1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (!c.effectsBlocked())
      (c.defender.effects ||= {}).sandAttackUntil = c.state.turn + 1;
  }
}

/** gym1-24 · Alert */
export function brocksZubat24Alert0(c: AttackContext) {
  c.require(c.player.bench.length, "You need a Benched Pokémon.");
  if (!c.begin()) return;
  O.draw(c.state, c.player, 1);
  O.switchSelf(c);
}

/** gym1-24 · Wing Attack */
export function brocksZubat24WingAttack1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-25 · Moonwatching */
export function erikasClefairy25Moonwatching0(c: AttackContext) {
  if (!c.begin()) return;
  O.search(c, c.player, O.basicEnergy);
}

/** gym1-25 · Comet Slap */
export function erikasClefairy25CometSlap1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** gym1-26 · Razor Leaf */
export function erikasVictreebel26RazorLeaf0(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** gym1-27 · Charge */
export function ltSurgesElectabuzz27Charge0(c: AttackContext) {
  if (!c.begin()) return;
  O.recover(c, c.player, O.namedEnergy("Lightning"), 2, "energy", c.attacker);
}

/** gym1-27 · Electric Current */
export function ltSurgesElectabuzz27ElectricCurrent1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.moveAttackEnergy(c, false, "Lightning");
}

/** gym1-28 · Mega Punch */
export function ltSurgesRaichu28MegaPunch0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym1-28 · Thunderbolt */
export function ltSurgesRaichu28Thunderbolt1(c: AttackContext) {
  B.zapdosThunderbolt(c);
}

/** gym1-29 · Triple Cannon */
export function mistysCloyster29TripleCannon0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 3));
}

/** gym1-30 · Horn Hazard */
export function mistysGoldeen30HornHazard0(c: AttackContext) {
  B.nidoranHornHazard(c);
}

/** gym1-31 · Water Ring */
export function mistysPoliwrath31WaterRing0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.benchDamage(
    c,
    10,
    "both",
    (p) => !R.pokemonCard(c.state, p, c.catalog).types.includes("Water"),
  );
}

/** gym1-32 · Mysterious Light */
export function mistysTentacool32MysteriousLight0(c: AttackContext) {
  B.gastlySleepingGas(c);
}

/** gym1-32 · Jellyfish Pod */
export function mistysTentacool32JellyfishPod1(c: AttackContext) {
  if (!c.begin()) return;
  O.search(
    c,
    c.player,
    O.named([
      "Tentacool",
      "Tentacruel",
      "Misty's Tentacool",
      "Misty's Tentacruel",
    ]),
    c.player.deck.length,
  );
}

/** gym1-33 · Collapse */
export function rocketsSnorlax33Collapse0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.selfStatus("Asleep");
}

/** gym1-34 · Healing Pollen */
export function sabrinasVenomoth34HealingPollen0(c: AttackContext) {
  if (!c.begin()) return;
  const n = 10 * O.coins(c, 3);
  for (const p of O.allPieces(c.player)) O.heal(p, n);
}

/** gym1-34 · Sonic Distortion */
export function sabrinasVenomoth34SonicDistortion1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (O.coins(c, 2)) c.status("Confused");
}

/** gym1-35 · Shake */
export function blainesGrowlithe35Shake0(c: AttackContext) {
  B.pidgeyWhirlwind(c);
}

/** gym1-35 · Fire Tackle */
export function blainesGrowlithe35FireTackle1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  c.recoil(10);
}

/** gym1-36 · Child's Punch */
export function blainesKangaskhan36ChildsPunch0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(10);
}

/** gym1-36 · One-Two Punch */
export function blainesKangaskhan36OneTwoPunch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + (c.coin() ? 10 : 0));
}

/** gym1-37 · Firebreathing */
export function blainesMagmar37Firebreathing0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 10 : 0));
}

/** gym1-37 · Lava Burst */
export function blainesMagmar37LavaBurst1(c: AttackContext) {
  if (!c.begin()) return;
  const top = c.player.deck.splice(0, 5);
  c.player.discard.push(...top);
  c.hit(
    top.filter((h) => O.namedEnergy("Fire")(c.catalog[h.card])).length * 20,
  );
}

/** gym1-38 · Tackle */
export function brocksGeodude38Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-38 · Lucky Shot */
export function brocksGeodude38LuckyShot1(c: AttackContext) {
  c.require(c.opponent.bench.length, "Your opponent needs a Benched Pokémon.");
  if (!c.begin()) return;
  const p = c.choosePiece(
    "lucky-shot",
    "Choose a Benched Pokémon",
    c.opponent.bench,
  );
  if (c.coin()) c.hit(30, p, false);
}

/** gym1-39 · Dive */
export function brocksGolbat39Dive0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-39 · Spiral Dive */
export function brocksGolbat39SpiralDive1(c: AttackContext) {
  if (!c.begin()) return;
  for (const p of O.allPieces(c.opponent)) c.hit(10, p, false);
}

/** gym1-40 · Rock Toss */
export function brocksGraveler40RockToss0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 3));
}

/** gym1-41 · Tongue Slap */
export function brocksLickitung41TongueSlap0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-41 · Slam */
export function brocksLickitung41Slam1(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** gym1-42 · Tail Strike */
export function erikasDratini42TailStrike0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** gym1-43 · Deflector */
export function erikasExeggcute43Deflector0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "halveDamage");
}

/** gym1-43 · Egg Bomb */
export function erikasExeggcute43EggBomb1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) c.hit(40);
  else c.recoil(20);
}

/** gym1-44 · Psychic Exchange */
export function erikasExeggutor44PsychicExchange0(c: AttackContext) {
  if (!c.begin()) return;
  O.newHand(c, c.player, 5);
}

/** gym1-44 · Stomp */
export function erikasExeggutor44Stomp1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + (c.coin() ? 10 : 0));
}

/** gym1-45 · Healing Pollen */
export function erikasGloom45HealingPollen0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.heal(c.attacker, 40);
}

/** gym1-45 · Magic Pollen */
export function erikasGloom45MagicPollen1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin())
    c.status(
      c.choose(
        "magic-pollen",
        "Choose a Special Condition",
        ["Asleep", "Confused", "Paralyzed", "Poisoned"].map((value) => ({
          value,
          label: value,
        })),
      )[0],
    );
}

/** gym1-46 · Dream Dance */
export function erikasGloom46DreamDance0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.status("Asleep");
  c.selfStatus("Asleep");
}

/** gym1-46 · Vile Smell */
export function erikasGloom46VileSmell1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  c.status("Confused");
  c.selfStatus("Confused");
}

/** gym1-47 · Poisonpowder */
export function erikasOddish47Poisonpowder0(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** gym1-48 · Drool */
export function erikasWeepinbell48Drool0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-48 · Flytrap */
export function erikasWeepinbell48Flytrap1(c: AttackContext) {
  c.require(c.opponent.bench.length, "Your opponent needs a Benched Pokémon.");
  if (O.dragOff(c)) c.hit(20);
}

/** gym1-49 · Sleep Poison */
export function erikasWeepinbell49SleepPoison0(c: AttackContext) {
  if (!c.begin()) return;
  c.status("Asleep");
  c.status("Poisoned");
}

/** gym1-49 · Vine Whip */
export function erikasWeepinbell49VineWhip1(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** gym1-50 · Removal Pulse */
export function ltSurgesMagnemite50RemovalPulse0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.defender.energy.length && c.coin()) c.discardDefenderEnergy();
}

/** gym1-50 · Confusion Pulse */
export function ltSurgesMagnemite50ConfusionPulse1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (c.coin()) c.status("Confused");
  }
}

/** gym1-51 · Super Fang */
export function ltSurgesRaticate51SuperFang0(c: AttackContext) {
  B.raticateSuperFang(c);
}

/** gym1-52 · Drill Peck */
export function ltSurgesSpearow52DrillPeck0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-53 · Rapids */
export function mistysPoliwhirl53Rapids0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.defender.energy.length && c.coin()) c.discardDefenderEnergy();
}

/** gym1-53 · Water Punch */
export function mistysPoliwhirl53WaterPunch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + 10 * O.coins(c, O.energyCount(c, c.attacker, "Water")));
}

/** gym1-54 · Scratch */
export function mistysPsyduck54Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-54 · Call for Friend */
export function mistysPsyduck54CallforFriend1(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  if (c.coin())
    O.family(c, (x) => R.startingPokemon(x) && x.name.includes("Misty"));
}

/** gym1-55 · Horn Attack */
export function mistysSeaking55HornAttack0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-55 · Mud Splash */
export function mistysSeaking55MudSplash1(c: AttackContext) {
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

/** gym1-56 · Water Gun */
export function mistysStarmie56WaterGun0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + c.waterBonus());
}

/** gym1-56 · Bubblebeam */
export function mistysStarmie56Bubblebeam1(c: AttackContext) {
  B.dewgongIceBeam(c);
}

/** gym1-57 · Crystal Beam */
export function mistysTentacool57CrystalBeam0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.opponentMark(c, "noEnergy");
}

/** gym1-58 · Night Spirits */
export function sabrinasHaunter58NightSpirits0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(
    30 *
      O.coins(
        c,
        O.countNames(c, [
          "Sabrina's Gastly",
          "Sabrina's Haunter",
          "Sabrina's Gengar",
        ]),
      ),
  );
}

/** gym1-59 · Good Night */
export function sabrinasJynx59GoodNight0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Asleep");
  }
}

/** gym1-59 · Good Morning */
export function sabrinasJynx59GoodMorning1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (!c.effectsBlocked())
    c.defender.conditions = c.defender.conditions.filter((x) => x !== "Asleep");
}

/** gym1-60 · Naptime */
export function sabrinasSlowbro60Naptime0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    O.heal(c.attacker, 30);
    c.selfStatus("Asleep");
  }
}

/** gym1-60 · Screaming Headbutt */
export function sabrinasSlowbro60ScreamingHeadbutt1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  O.putMark(
    c,
    c.attacker,
    "attackDisabled",
    2,
    undefined,
    undefined,
    c.attack.name,
  );
}

/** gym1-61 · Kindle */
export function blainesCharmander61Kindle0(c: AttackContext) {
  c.payEnergy(1);
  if (!c.begin()) return;
  c.hit(10);
  c.discardDefenderEnergy();
}

/** gym1-61 · Slash */
export function blainesCharmander61Slash1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-62 · Blaze */
export function blainesGrowlithe62Blaze0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.benchDamage(c, 10, "opponent", (p) =>
    R.pokemonCard(c.state, p, c.catalog).types.includes("Grass"),
  );
}

/** gym1-63 · Agility */
export function blainesPonyta63Agility0(c: AttackContext) {
  B.raichuAgility(c);
}

/** gym1-64 · 3-Pronged Tail */
export function blainesTauros643ProngedTail0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** gym1-64 · Full Speed Charge */
export function blainesTauros64FullSpeedCharge1(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.coins(c, 4);
  c.hit(n * 20);
  c.recoil((4 - n) * 20);
}

/** gym1-65 · Tail Fan */
export function blainesVulpix65TailFan0(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (c.coin()) c.status("Confused");
  }
}

/** gym1-66 · Call for Friend */
export function brocksGeodude66CallforFriend0(c: AttackContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  if (!c.begin()) return;
  if (c.coin())
    O.family(c, (x) => R.startingPokemon(x) && x.name.includes("Brock"));
}

/** gym1-66 · Hook Shot */
export function brocksGeodude66HookShot1(c: AttackContext) {
  if (!c.begin()) return;
  c.ignoreResistance = true;
  c.hit(20);
}

/** gym1-67 · Taunt */
export function brocksMankey67Taunt0(c: AttackContext) {
  if (!c.begin()) return;
  c.forceSwitch(false);
}

/** gym1-67 · Light Kick */
export function brocksMankey67LightKick1(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-68 · Fidget */
export function brocksMankey68Fidget0(c: AttackContext) {
  if (!c.begin()) return;
  O.shuffle(c.state, c.player.deck);
}

/** gym1-68 · Karate Chop */
export function brocksMankey68KarateChop1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40 - c.attacker.damage);
}

/** gym1-69 · Bellow */
export function brocksOnix69Bellow0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Paralyzed");
  }
}

/** gym1-69 · Rock Throw */
export function brocksOnix69RockThrow1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym1-70 · Drill Tackle */
export function brocksRhyhorn70DrillTackle0(c: AttackContext) {
  if (!c.begin()) return;
  if (O.coins(c, 2) === 2) c.hit(70);
}

/** gym1-71 · Defense Curl */
export function brocksSandshrew71DefenseCurl0(c: AttackContext) {
  B.squirtleWithdraw(c);
}

/** gym1-71 · Rolling Attack */
export function brocksSandshrew71RollingAttack1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-72 · Sand Pit */
export function brocksSandshrew72SandPit0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.opponentMark(c, "noRetreat");
}

/** gym1-73 · Flame */
export function brocksVulpix73Flame0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-73 · Quick Attack */
export function brocksVulpix73QuickAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** gym1-74 · Wing Attack */
export function brocksZubat74WingAttack0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-74 · Poison Fang */
export function brocksZubat74PoisonFang1(c: AttackContext) {
  B.kakunaPoisonpowder(c);
}

/** gym1-75 · Poison Vine */
export function erikasBellsprout75PoisonVine0(c: AttackContext) {
  B.weedlePoisonSting(c);
}

/** gym1-75 · Vine Whip */
export function erikasBellsprout75VineWhip1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym1-76 · Careless Tackle */
export function erikasBellsprout76CarelessTackle0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.recoil(10);
}

/** gym1-77 · Eggsplosion */
export function erikasExeggcute77Eggsplosion0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, O.energyCount(c, c.attacker)));
}

/** gym1-77 · Psychic */
export function erikasExeggcute77Psychic1(c: AttackContext) {
  B.mewtwoPsychic(c);
}

/** gym1-78 · Blot */
export function erikasOddish78Blot0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  O.heal(c.attacker, 10);
}

/** gym1-78 · Sporadic Sponging */
export function erikasOddish78SporadicSponging1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.attacker.damage && c.coin()) O.heal(c.attacker, 10);
}

/** gym1-79 · Vine Slap */
export function erikasTangela79VineSlap0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-79 · Stretch Vine */
export function erikasTangela79StretchVine1(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 20);
}

/** gym1-80 · Thundershock */
export function ltSurgesMagnemite80Thundershock0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** gym1-80 · Tackle */
export function ltSurgesMagnemite80Tackle1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-81 · Charge */
export function ltSurgesPikachu81Charge0(c: AttackContext) {
  if (!c.begin()) return;
  O.recover(
    c,
    c.player,
    O.namedEnergy("Lightning"),
    1,
    "energy",
    c.attacker,
    "charge",
    true,
  );
}

/** gym1-81 · Lightning Tail */
export function ltSurgesPikachu81LightningTail1(c: AttackContext) {
  B.tangelaBind(c);
}

/** gym1-82 · Focus Energy */
export function ltSurgesRattata82FocusEnergy0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "doubleDamage", 2, 2, undefined, "Gnaw");
}

/** gym1-82 · Gnaw */
export function ltSurgesRattata82Gnaw1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-83 · Whirlwind */
export function ltSurgesSpearow83Whirlwind0(c: AttackContext) {
  B.pidgeyWhirlwind(c);
}

/** gym1-83 · Razor Wind */
export function ltSurgesSpearow83RazorWind1(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(40);
}

/** gym1-84 · Spin Ball */
export function ltSurgesVoltorb84SpinBall0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) c.hit(20);
}

/** gym1-84 · Double Spin */
export function ltSurgesVoltorb84DoubleSpin1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 2));
}

/** gym1-85 · Fury Attack */
export function mistysGoldeen85FuryAttack0(c: AttackContext) {
  B.doduoFuryAttack(c);
}

/** gym1-85 · Supersonic */
export function mistysGoldeen85Supersonic1(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** gym1-86 · Tackle */
export function mistysHorsea86Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-86 · Smokescreen */
export function mistysHorsea86Smokescreen1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (!c.effectsBlocked())
      (c.defender.effects ||= {}).sandAttackUntil = c.state.turn + 1;
  }
}

/** gym1-87 · Hypnotic Stare */
export function mistysPoliwag87HypnoticStare0(c: AttackContext) {
  if (!c.begin()) return;
  c.status(c.coin() ? "Paralyzed" : "Asleep");
}

/** gym1-87 · Tail Rap */
export function mistysPoliwag87TailRap1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 2));
}

/** gym1-88 · Aurora Beam */
export function mistysSeel88AuroraBeam0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-89 · Tackle */
export function mistysShellder89Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym1-89 · Clamp */
export function mistysShellder89Clamp1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    c.hit(20);
    c.status("Paralyzed");
  }
}

/** gym1-90 · Swift */
export function mistysStaryu90Swift0(c: AttackContext) {
  if (!c.begin()) return;
  c.ignoreDefenses = true;
  c.hit(20, c.defender, false);
}

/** gym1-91 · Energy Loop */
export function sabrinasAbra91EnergyLoop0(c: AttackContext) {
  if (!c.copying)
    O.returnEnergy(
      c,
      c.attacker,
      c.chooseEnergy(
        "energy-loop",
        "Return a Psychic Energy to your hand",
        c.attacker,
        1,
        1,
        "Psychic",
      ),
    );
  if (!c.begin()) return;
  c.hit(20);
}

/** gym1-92 · Suggestion */
export function sabrinasDrowzee92Suggestion0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.opponentMark(c, "noAttack");
}

/** gym1-92 · Headbutt */
export function sabrinasDrowzee92Headbutt1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-93 · Spook */
export function sabrinasGastly93Spook0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.opponentMark(c, "noRetreat");
}

/** gym1-94 · Sleight of Hand */
export function sabrinasMrMime94SleightofHand0(c: AttackContext) {
  if (!c.begin()) return;
  const hs = c.chooseCards(
    "sleight-cost",
    "Return up to 3 cards to the deck",
    c.player.hand,
    0,
    3,
  );
  O.moveCards(c.player.hand, c.player.deck, hs);
  O.search(c, c.player, O.basicEnergy, hs.length);
}

/** gym1-94 · Slap */
export function sabrinasMrMime94Slap1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym1-95 · Lazy Attack */
export function sabrinasSlowpoke95LazyAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  c.selfStatus("Asleep");
}

/** gym1-96 · Poison Antennae */
export function sabrinasVenonat96PoisonAntennae0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    c.status("Poisoned");
  }
}

/** gym1-96 · Removal Beam */
export function sabrinasVenonat96RemovalBeam1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.defender.energy.length && c.coin()) c.discardDefenderEnergy();
}

export const ATTACKS: Record<string, AttackHandler[]> = {
  "gym1-1": [blainesMoltres1PhoenixFlame0],
  "gym1-2": [brocksRhydon2Lariat0],
  "gym1-3": [erikasClefable3FairyPower0, erikasClefable3MoonImpact1],
  "gym1-4": [erikasDragonair4Blizzard0, erikasDragonair4TakeAway1],
  "gym1-5": [erikasVileplume5MegaDrain0],
  "gym1-6": [ltSurgesElectabuzz6Charge0, ltSurgesElectabuzz6Discharge1],
  "gym1-7": [ltSurgesFearow7RepeatingDrill0, ltSurgesFearow7Clutch1],
  "gym1-8": [ltSurgesMagneton8MegaShock0],
  "gym1-9": [mistysSeadra9TailSnap0, mistysSeadra9KnockoutNeedle1],
  "gym1-10": [mistysTentacruel10JellyfishPoison0],
  "gym1-11": [
    rocketsHitmonchan11Crosscounter0,
    rocketsHitmonchan11MagnumPunch1,
  ],
  "gym1-12": [rocketsMoltres12FireWall0],
  "gym1-13": [rocketsScyther13ShadowImages0, rocketsScyther13BlindingScythe1],
  "gym1-14": [sabrinasGengar14PainAmplifier0, sabrinasGengar14CalloftheNight1],
  "gym1-20": [brocksGolem20RockSlide0, brocksGolem20Fissure1],
  "gym1-21": [brocksOnix21Bind0, brocksOnix21Tunneling1],
  "gym1-22": [brocksRhyhorn22HornToss0, brocksRhyhorn22TakeDown1],
  "gym1-23": [brocksSandslash23Needles0, brocksSandslash23Sandstorm1],
  "gym1-24": [brocksZubat24Alert0, brocksZubat24WingAttack1],
  "gym1-25": [erikasClefairy25Moonwatching0, erikasClefairy25CometSlap1],
  "gym1-26": [erikasVictreebel26RazorLeaf0],
  "gym1-27": [
    ltSurgesElectabuzz27Charge0,
    ltSurgesElectabuzz27ElectricCurrent1,
  ],
  "gym1-28": [ltSurgesRaichu28MegaPunch0, ltSurgesRaichu28Thunderbolt1],
  "gym1-29": [mistysCloyster29TripleCannon0],
  "gym1-30": [mistysGoldeen30HornHazard0],
  "gym1-31": [mistysPoliwrath31WaterRing0],
  "gym1-32": [
    mistysTentacool32MysteriousLight0,
    mistysTentacool32JellyfishPod1,
  ],
  "gym1-33": [rocketsSnorlax33Collapse0],
  "gym1-34": [
    sabrinasVenomoth34HealingPollen0,
    sabrinasVenomoth34SonicDistortion1,
  ],
  "gym1-35": [blainesGrowlithe35Shake0, blainesGrowlithe35FireTackle1],
  "gym1-36": [blainesKangaskhan36ChildsPunch0, blainesKangaskhan36OneTwoPunch1],
  "gym1-37": [blainesMagmar37Firebreathing0, blainesMagmar37LavaBurst1],
  "gym1-38": [brocksGeodude38Tackle0, brocksGeodude38LuckyShot1],
  "gym1-39": [brocksGolbat39Dive0, brocksGolbat39SpiralDive1],
  "gym1-40": [brocksGraveler40RockToss0],
  "gym1-41": [brocksLickitung41TongueSlap0, brocksLickitung41Slam1],
  "gym1-42": [erikasDratini42TailStrike0],
  "gym1-43": [erikasExeggcute43Deflector0, erikasExeggcute43EggBomb1],
  "gym1-44": [erikasExeggutor44PsychicExchange0, erikasExeggutor44Stomp1],
  "gym1-45": [erikasGloom45HealingPollen0, erikasGloom45MagicPollen1],
  "gym1-46": [erikasGloom46DreamDance0, erikasGloom46VileSmell1],
  "gym1-47": [erikasOddish47Poisonpowder0],
  "gym1-48": [erikasWeepinbell48Drool0, erikasWeepinbell48Flytrap1],
  "gym1-49": [erikasWeepinbell49SleepPoison0, erikasWeepinbell49VineWhip1],
  "gym1-50": [
    ltSurgesMagnemite50RemovalPulse0,
    ltSurgesMagnemite50ConfusionPulse1,
  ],
  "gym1-51": [ltSurgesRaticate51SuperFang0],
  "gym1-52": [ltSurgesSpearow52DrillPeck0],
  "gym1-53": [mistysPoliwhirl53Rapids0, mistysPoliwhirl53WaterPunch1],
  "gym1-54": [mistysPsyduck54Scratch0, mistysPsyduck54CallforFriend1],
  "gym1-55": [mistysSeaking55HornAttack0, mistysSeaking55MudSplash1],
  "gym1-56": [mistysStarmie56WaterGun0, mistysStarmie56Bubblebeam1],
  "gym1-57": [mistysTentacool57CrystalBeam0],
  "gym1-58": [sabrinasHaunter58NightSpirits0],
  "gym1-59": [sabrinasJynx59GoodNight0, sabrinasJynx59GoodMorning1],
  "gym1-60": [sabrinasSlowbro60Naptime0, sabrinasSlowbro60ScreamingHeadbutt1],
  "gym1-61": [blainesCharmander61Kindle0, blainesCharmander61Slash1],
  "gym1-62": [blainesGrowlithe62Blaze0],
  "gym1-63": [blainesPonyta63Agility0],
  "gym1-64": [blainesTauros643ProngedTail0, blainesTauros64FullSpeedCharge1],
  "gym1-65": [blainesVulpix65TailFan0],
  "gym1-66": [brocksGeodude66CallforFriend0, brocksGeodude66HookShot1],
  "gym1-67": [brocksMankey67Taunt0, brocksMankey67LightKick1],
  "gym1-68": [brocksMankey68Fidget0, brocksMankey68KarateChop1],
  "gym1-69": [brocksOnix69Bellow0, brocksOnix69RockThrow1],
  "gym1-70": [brocksRhyhorn70DrillTackle0],
  "gym1-71": [brocksSandshrew71DefenseCurl0, brocksSandshrew71RollingAttack1],
  "gym1-72": [brocksSandshrew72SandPit0],
  "gym1-73": [brocksVulpix73Flame0, brocksVulpix73QuickAttack1],
  "gym1-74": [brocksZubat74WingAttack0, brocksZubat74PoisonFang1],
  "gym1-75": [erikasBellsprout75PoisonVine0, erikasBellsprout75VineWhip1],
  "gym1-76": [erikasBellsprout76CarelessTackle0],
  "gym1-77": [erikasExeggcute77Eggsplosion0, erikasExeggcute77Psychic1],
  "gym1-78": [erikasOddish78Blot0, erikasOddish78SporadicSponging1],
  "gym1-79": [erikasTangela79VineSlap0, erikasTangela79StretchVine1],
  "gym1-80": [ltSurgesMagnemite80Thundershock0, ltSurgesMagnemite80Tackle1],
  "gym1-81": [ltSurgesPikachu81Charge0, ltSurgesPikachu81LightningTail1],
  "gym1-82": [ltSurgesRattata82FocusEnergy0, ltSurgesRattata82Gnaw1],
  "gym1-83": [ltSurgesSpearow83Whirlwind0, ltSurgesSpearow83RazorWind1],
  "gym1-84": [ltSurgesVoltorb84SpinBall0, ltSurgesVoltorb84DoubleSpin1],
  "gym1-85": [mistysGoldeen85FuryAttack0, mistysGoldeen85Supersonic1],
  "gym1-86": [mistysHorsea86Tackle0, mistysHorsea86Smokescreen1],
  "gym1-87": [mistysPoliwag87HypnoticStare0, mistysPoliwag87TailRap1],
  "gym1-88": [mistysSeel88AuroraBeam0],
  "gym1-89": [mistysShellder89Tackle0, mistysShellder89Clamp1],
  "gym1-90": [mistysStaryu90Swift0],
  "gym1-91": [sabrinasAbra91EnergyLoop0],
  "gym1-92": [sabrinasDrowzee92Suggestion0, sabrinasDrowzee92Headbutt1],
  "gym1-93": [sabrinasGastly93Spook0],
  "gym1-94": [sabrinasMrMime94SleightofHand0, sabrinasMrMime94Slap1],
  "gym1-95": [sabrinasSlowpoke95LazyAttack0],
  "gym1-96": [sabrinasVenonat96PoisonAntennae0, sabrinasVenonat96RemovalBeam1],
};
