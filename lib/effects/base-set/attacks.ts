import type { AttackContext, AttackHandler } from "../context";
import { ENERGY_TYPES } from "./energy";

// Indexed by printed card ID and attack position: same-named attacks can have different effects.
/** Alakazam — Confuse Ray (base1-1, attack 1). */
export function alakazamConfuseRay(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) c.status("Confused");
}

/** Blastoise — Hydro Pump (base1-2, attack 1). */
export function blastoiseHydroPump(c: AttackContext) {
  if (c.begin()) c.hit(40 + c.waterBonus(3));
}

/** Chansey — Scrunch (base1-3, attack 1). */
export function chanseyScrunch(c: AttackContext) {
  if (c.begin() && c.coin()) c.protect("preventDamageUntil");
}

/** Chansey — Double-edge (base1-3, attack 2). */
export function chanseyDoubleedge(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(80);
  c.recoil(80);
}

/** Charizard — Fire Spin (base1-4, attack 1). */
export function charizardFireSpin(c: AttackContext) {
  c.payEnergy(2);
  if (c.begin()) c.hit(100);
}

/** Clefairy — Sing (base1-5, attack 1). */
export function clefairySing(c: AttackContext) {
  if (c.begin() && c.coin()) c.status("Asleep");
}

/** Clefairy — Metronome (base1-5, attack 2). */
export function clefairyMetronome(c: AttackContext) {
  const card = c.catalog[c.defender.card];
  // Copying Metronome leads to another selection from the same card. Skip
  // repeated copies of that same selector and ask for its eventual attack.
  const options = card.attacks.flatMap((a, i) =>
    (c.copyDepth > 0 && a.name === "Metronome") || !c.resolveAttack(card, i)
      ? []
      : [{ value: String(i), label: a.name }],
  );
  if (!card.attacks.length) {
    c.begin();
    return;
  }
  c.require(
    options.length,
    "This Pokémon’s attacks need manual resolution. Use table tools to resolve the copied attack, then end your turn.",
  );
  const [index] = c.choose(
    c.copyDepth > 0 ? "metronome-final" : "metronome",
    "Choose the attack to copy",
    options,
  );
  const handler = c.resolveAttack(card, +index);
  c.require(
    handler,
    "That expansion’s copied effect is not automated. Use table tools for this mixed-set interaction.",
  );
  c.copyDepth++;
  c.copying = true;
  c.attack = card.attacks[+index];
  c.printedCard = card;
  handler(c);
}

/** Gyarados — Dragon Rage (base1-6, attack 1). */
export function gyaradosDragonRage(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** Gyarados — Bubblebeam (base1-6, attack 2). */
export function gyaradosBubblebeam(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  if (c.coin()) c.status("Paralyzed");
}

/** Hitmonchan — Jab (base1-7, attack 1). */
export function hitmonchanJab(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** Hitmonchan — Special Punch (base1-7, attack 2). */
export function hitmonchanSpecialPunch(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** Machamp — Seismic Toss (base1-8, attack 1). */
export function machampSeismicToss(c: AttackContext) {
  if (c.begin()) c.hit(60);
}

/** Magneton — Thunder Wave (base1-9, attack 1). */
export function magnetonThunderWave(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) c.status("Paralyzed");
}

/** Magneton — Selfdestruct (base1-9, attack 2). */
export function magnetonSelfdestruct(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(80);
  for (const p of c.state.players) for (const b of p.bench) c.hit(20, b, false);
  c.recoil(80);
}

/** Mewtwo — Psychic (base1-10, attack 1). */
export function mewtwoPsychic(c: AttackContext) {
  if (c.begin()) c.hit(10 + 10 * c.defender.energy.length);
}

/** Mewtwo — Barrier (base1-10, attack 2). */
export function mewtwoBarrier(c: AttackContext) {
  c.payEnergy(1, "Psychic");
  if (c.begin()) c.protect("preventAllUntil");
}

/** Nidoking — Thrash (base1-11, attack 1). */
export function nidokingThrash(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(30 + (heads ? 10 : 0));
  if (!heads) c.recoil(10);
}

/** Nidoking — Toxic (base1-11, attack 2). */
export function nidokingToxic(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.status("Poisoned", 20);
}

/** Ninetales — Lure (base1-12, attack 1). */
export function ninetalesLure(c: AttackContext) {
  if (c.begin()) c.forceSwitch(false);
}

/** Ninetales — Fire Blast (base1-12, attack 2). */
export function ninetalesFireBlast(c: AttackContext) {
  c.payEnergy(1, "Fire");
  if (c.begin()) c.hit(80);
}

/** Poliwrath — Water Gun (base1-13, attack 1). */
export function poliwrathWaterGun(c: AttackContext) {
  if (c.begin()) c.hit(30 + c.waterBonus(2));
}

/** Poliwrath — Whirlpool (base1-13, attack 2). */
export function poliwrathWhirlpool(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  c.discardDefenderEnergy();
}

/** Raichu — Agility (base1-14, attack 1). */
export function raichuAgility(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) c.protect("preventAllUntil");
}

/** Raichu — Thunder (base1-14, attack 2). */
export function raichuThunder(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(60);
  if (!c.coin()) c.recoil(30);
}

/** Venusaur — Solarbeam (base1-15, attack 1). */
export function venusaurSolarbeam(c: AttackContext) {
  if (c.begin()) c.hit(60);
}

/** Zapdos — Thunder (base1-16, attack 1). */
export function zapdosThunder(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(60);
  if (!c.coin()) c.recoil(30);
}

/** Zapdos — Thunderbolt (base1-16, attack 2). */
export function zapdosThunderbolt(c: AttackContext) {
  c.payEnergy(c.attacker.energy.length);
  if (c.begin()) c.hit(100);
}

/** Beedrill — Twineedle (base1-17, attack 1). */
export function beedrillTwineedle(c: AttackContext) {
  if (c.begin()) c.hit(30 * (Number(c.coin()) + Number(c.coin())));
}

/** Beedrill — Poison Sting (base1-17, attack 2). */
export function beedrillPoisonSting(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  if (c.coin()) c.status("Poisoned");
}

/** Dragonair — Slam (base1-18, attack 1). */
export function dragonairSlam(c: AttackContext) {
  if (c.begin()) c.hit(30 * (Number(c.coin()) + Number(c.coin())));
}

/** Dragonair — Hyper Beam (base1-18, attack 2). */
export function dragonairHyperBeam(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.discardDefenderEnergy();
}

/** Dugtrio — Slash (base1-19, attack 1). */
export function dugtrioSlash(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** Dugtrio — Earthquake (base1-19, attack 2). */
export function dugtrioEarthquake(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(70);
  for (const p of c.player.bench) c.hit(10, p, false);
}

/** Electabuzz — Thundershock (base1-20, attack 1). */
export function electabuzzThundershock(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Paralyzed");
}

/** Electabuzz — Thunderpunch (base1-20, attack 2). */
export function electabuzzThunderpunch(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(30 + (heads ? 10 : 0));
  if (!heads) c.recoil(10);
}

/** Electrode — Electric Shock (base1-21, attack 1). */
export function electrodeElectricShock(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  if (!c.coin()) c.recoil(10);
}

/** Pidgeotto — Whirlwind (base1-22, attack 1). */
export function pidgeottoWhirlwind(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.forceSwitch(true);
}

/** Pidgeotto — Mirror Move (base1-22, attack 2). */
export function pidgeottoMirrorMove(c: AttackContext) {
  const previous = c.previousAttack;
  if (!c.begin() || previous?.turn !== c.state.turn - 1) return;
  c.hit(previous.damage);
  for (const name of previous.conditions) c.status(name, previous.poisonDamage);
  if (previous.discardedEnergy)
    c.discardDefenderEnergy(previous.discardedEnergy);
  if (c.effectsBlocked()) return;
  c.defender.effects ||= {};
  if (previous.weakness) {
    c.defender.effects.weakness = previous.weakness;
    c.record().weakness = previous.weakness;
  }
  if (previous.sandAttack) {
    c.defender.effects.sandAttackUntil = c.state.turn + 1;
    c.record().sandAttack = true;
  }
  if (previous.amnesia) {
    const attacks = c.catalog[c.defender.card].attacks;
    if (attacks.length) {
      const [name] = c.choose(
        "mirror-amnesia",
        "Choose the attack to disable",
        attacks.map((a) => ({ value: a.name, label: a.name })),
      );
      c.defender.effects.amnesia = { name, until: c.state.turn + 1 };
      c.record().amnesia = name;
    }
  }
}

/** Arcanine — Flamethrower (base1-23, attack 1). */
export function arcanineFlamethrower(c: AttackContext) {
  c.payEnergy(1, "Fire");
  if (c.begin()) c.hit(50);
}

/** Arcanine — Take Down (base1-23, attack 2). */
export function arcanineTakeDown(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(80);
  c.recoil(30);
}

/** Charmeleon — Slash (base1-24, attack 1). */
export function charmeleonSlash(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** Charmeleon — Flamethrower (base1-24, attack 2). */
export function charmeleonFlamethrower(c: AttackContext) {
  c.payEnergy(1, "Fire");
  if (c.begin()) c.hit(50);
}

/** Dewgong — Aurora Beam (base1-25, attack 1). */
export function dewgongAuroraBeam(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** Dewgong — Ice Beam (base1-25, attack 2). */
export function dewgongIceBeam(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) c.status("Paralyzed");
}

/** Dratini — Pound (base1-26, attack 1). */
export function dratiniPound(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Farfetch'd — Leek Slap (base1-27, attack 1). */
export function farfetchdLeekSlap(c: AttackContext) {
  c.require(
    !c.attacker.usedAttacks?.includes("Leek Slap"),
    "Leek Slap can only be used once while this Pokémon stays in play.",
  );
  if (!c.begin()) return;
  (c.attacker.usedAttacks ||= []).push("Leek Slap");
  if (c.coin()) c.hit(30);
}

/** Farfetch'd — Pot Smash (base1-27, attack 2). */
export function farfetchdPotSmash(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** Growlithe — Flare (base1-28, attack 1). */
export function growlitheFlare(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** Haunter — Hypnosis (base1-29, attack 1). */
export function haunterHypnosis(c: AttackContext) {
  if (c.begin()) c.status("Asleep");
}

/** Haunter — Dream Eater (base1-29, attack 2). */
export function haunterDreamEater(c: AttackContext) {
  c.require(
    c.defender.conditions.includes("Asleep"),
    "Dream Eater needs the Defending Pokémon to be Asleep.",
  );
  if (c.begin()) c.hit(50);
}

/** Ivysaur — Vine Whip (base1-30, attack 1). */
export function ivysaurVineWhip(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** Ivysaur — Poisonpowder (base1-30, attack 2). */
export function ivysaurPoisonpowder(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.status("Poisoned");
}

/** Jynx — Doubleslap (base1-31, attack 1). */
export function jynxDoubleslap(c: AttackContext) {
  if (c.begin()) c.hit(10 * (Number(c.coin()) + Number(c.coin())));
}

/** Jynx — Meditate (base1-31, attack 2). */
export function jynxMeditate(c: AttackContext) {
  if (c.begin()) c.hit(20 + c.defender.damage);
}

/** Kadabra — Recover (base1-32, attack 1). */
export function kadabraRecover(c: AttackContext) {
  c.payEnergy(1, "Psychic");
  if (c.begin()) c.attacker.damage = 0;
}

/** Kadabra — Super Psy (base1-32, attack 2). */
export function kadabraSuperPsy(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** Kakuna — Stiffen (base1-33, attack 1). */
export function kakunaStiffen(c: AttackContext) {
  if (c.begin() && c.coin()) c.protect("preventDamageUntil");
}

/** Kakuna — Poisonpowder (base1-33, attack 2). */
export function kakunaPoisonpowder(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) c.status("Poisoned");
}

/** Machoke — Karate Chop (base1-34, attack 1). */
export function machokeKarateChop(c: AttackContext) {
  if (c.begin()) c.hit(Math.max(0, 50 - c.attacker.damage));
}

/** Machoke — Submission (base1-34, attack 2). */
export function machokeSubmission(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(60);
  c.recoil(20);
}

/** Magikarp — Tackle (base1-35, attack 1). */
export function magikarpTackle(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Magikarp — Flail (base1-35, attack 2). */
export function magikarpFlail(c: AttackContext) {
  if (c.begin()) c.hit(c.attacker.damage);
}

/** Magmar — Fire Punch (base1-36, attack 1). */
export function magmarFirePunch(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** Magmar — Flamethrower (base1-36, attack 2). */
export function magmarFlamethrower(c: AttackContext) {
  c.payEnergy(1, "Fire");
  if (c.begin()) c.hit(50);
}

/** Nidorino — Double Kick (base1-37, attack 1). */
export function nidorinoDoubleKick(c: AttackContext) {
  if (c.begin()) c.hit(30 * (Number(c.coin()) + Number(c.coin())));
}

/** Nidorino — Horn Drill (base1-37, attack 2). */
export function nidorinoHornDrill(c: AttackContext) {
  if (c.begin()) c.hit(50);
}

/** Poliwhirl — Amnesia (base1-38, attack 1). */
export function poliwhirlAmnesia(c: AttackContext) {
  const attacks = c.catalog[c.defender.card].attacks;
  if (!attacks.length) {
    c.begin();
    return;
  }
  const [name] = c.choose(
    "amnesia",
    "Choose the opponent’s attack to disable",
    attacks.map((a) => ({ value: a.name, label: a.name })),
  );
  if (!c.begin() || c.effectsBlocked()) return;
  (c.defender.effects ||= {}).amnesia = { name, until: c.state.turn + 1 };
  c.record().amnesia = name;
}

/** Poliwhirl — Doubleslap (base1-38, attack 2). */
export function poliwhirlDoubleslap(c: AttackContext) {
  if (c.begin()) c.hit(30 * (Number(c.coin()) + Number(c.coin())));
}

/** Porygon — Conversion 1 (base1-39, attack 1). */
export function porygonConversion1(c: AttackContext) {
  if (
    !c.catalog[c.defender.card].weaknesses.length &&
    !c.defender.effects?.weakness
  ) {
    c.begin();
    return;
  }
  const selected = c.choose(
    "conversion-1",
    "Choose a new Weakness, or skip",
    ENERGY_TYPES.filter((t) => t !== "Colorless").map((value) => ({
      value,
      label: value,
    })),
    0,
    1,
  );
  if (!c.begin() || c.effectsBlocked() || !selected.length) return;
  (c.defender.effects ||= {}).weakness = selected[0];
  c.record().weakness = selected[0];
}

/** Porygon — Conversion 2 (base1-39, attack 2). */
export function porygonConversion2(c: AttackContext) {
  const [type] = c.choose(
    "conversion-2",
    "Choose Porygon’s Resistance",
    ENERGY_TYPES.filter((t) => t !== "Colorless").map((value) => ({
      value,
      label: value,
    })),
  );
  if (c.begin()) (c.attacker.effects ||= {}).resistance = type;
}

/** Raticate — Bite (base1-40, attack 1). */
export function raticateBite(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** Raticate — Super Fang (base1-40, attack 2). */
export function raticateSuperFang(c: AttackContext) {
  if (c.begin())
    c.hit(
      Math.ceil(
        Math.max(0, c.catalog[c.defender.card].hp - c.defender.damage) / 20,
      ) * 10,
    );
}

/** Seel — Headbutt (base1-41, attack 1). */
export function seelHeadbutt(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Wartortle — Withdraw (base1-42, attack 1). */
export function wartortleWithdraw(c: AttackContext) {
  if (c.begin() && c.coin()) c.protect("preventDamageUntil");
}

/** Wartortle — Bite (base1-42, attack 2). */
export function wartortleBite(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** Abra — Psyshock (base1-43, attack 1). */
export function abraPsyshock(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Paralyzed");
}

/** Bulbasaur — Leech Seed (base1-44, attack 1). */
export function bulbasaurLeechSeed(c: AttackContext) {
  if (!c.begin()) return;
  if (c.hit(20) > 0 && c.attacker.damage > 0) {
    const [heal] = c.choose(
      "leech-seed",
      "Remove a damage counter with Leech Seed?",
      [
        { value: "yes", label: "Heal 10 damage" },
        { value: "no", label: "Keep the damage" },
      ],
    );
    if (heal === "yes") c.attacker.damage = Math.max(0, c.attacker.damage - 10);
  }
}

/** Caterpie — String Shot (base1-45, attack 1). */
export function caterpieStringShot(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Paralyzed");
}

/** Charmander — Scratch (base1-46, attack 1). */
export function charmanderScratch(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Charmander — Ember (base1-46, attack 2). */
export function charmanderEmber(c: AttackContext) {
  c.payEnergy(1, "Fire");
  if (c.begin()) c.hit(30);
}

/** Diglett — Dig (base1-47, attack 1). */
export function diglettDig(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Diglett — Mud Slap (base1-47, attack 2). */
export function diglettMudSlap(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** Doduo — Fury Attack (base1-48, attack 1). */
export function doduoFuryAttack(c: AttackContext) {
  if (c.begin()) c.hit(10 * (Number(c.coin()) + Number(c.coin())));
}

/** Drowzee — Pound (base1-49, attack 1). */
export function drowzeePound(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Drowzee — Confuse Ray (base1-49, attack 2). */
export function drowzeeConfuseRay(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Confused");
}

/** Gastly — Sleeping Gas (base1-50, attack 1). */
export function gastlySleepingGas(c: AttackContext) {
  if (c.begin() && c.coin()) c.status("Asleep");
}

/** Gastly — Destiny Bond (base1-50, attack 2). */
export function gastlyDestinyBond(c: AttackContext) {
  c.payEnergy(1, "Psychic");
  if (c.begin()) c.protect("destinyBondUntil");
}

/** Koffing — Foul Gas (base1-51, attack 1). */
export function koffingFoulGas(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.status(c.coin() ? "Poisoned" : "Confused");
}

/** Machop — Low Kick (base1-52, attack 1). */
export function machopLowKick(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** Magnemite — Thunder Wave (base1-53, attack 1). */
export function magnemiteThunderWave(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Paralyzed");
}

/** Magnemite — Selfdestruct (base1-53, attack 2). */
export function magnemiteSelfdestruct(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  for (const p of c.state.players) for (const b of p.bench) c.hit(10, b, false);
  c.recoil(40);
}

/** Metapod — Stiffen (base1-54, attack 1). */
export function metapodStiffen(c: AttackContext) {
  if (c.begin() && c.coin()) c.protect("preventDamageUntil");
}

/** Metapod — Stun Spore (base1-54, attack 2). */
export function metapodStunSpore(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) c.status("Paralyzed");
}

/** Nidoran ♂ — Horn Hazard (base1-55, attack 1). */
export function nidoranHornHazard(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(30);
}

/** Onix — Rock Throw (base1-56, attack 1). */
export function onixRockThrow(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Onix — Harden (base1-56, attack 2). */
export function onixHarden(c: AttackContext) {
  if (c.begin()) c.protect("hardenUntil");
}

/** Pidgey — Whirlwind (base1-57, attack 1). */
export function pidgeyWhirlwind(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.forceSwitch(true);
}

/** Pikachu — Gnaw (base1-58, attack 1). */
export function pikachuGnaw(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Pikachu — Thunder Jolt (base1-58, attack 2). */
export function pikachuThunderJolt(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (!c.coin()) c.recoil(10);
}

/** Poliwag — Water Gun (base1-59, attack 1). */
export function poliwagWaterGun(c: AttackContext) {
  if (c.begin()) c.hit(10 + c.waterBonus(1));
}

/** Ponyta — Smash Kick (base1-60, attack 1). */
export function ponytaSmashKick(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** Ponyta — Flame Tail (base1-60, attack 2). */
export function ponytaFlameTail(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** Rattata — Bite (base1-61, attack 1). */
export function rattataBite(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** Sandshrew — Sand-attack (base1-62, attack 1). */
export function sandshrewSandattack(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (!c.effectsBlocked()) {
    (c.defender.effects ||= {}).sandAttackUntil = c.state.turn + 1;
    c.record().sandAttack = true;
  }
}

/** Squirtle — Bubble (base1-63, attack 1). */
export function squirtleBubble(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Paralyzed");
}

/** Squirtle — Withdraw (base1-63, attack 2). */
export function squirtleWithdraw(c: AttackContext) {
  if (c.begin() && c.coin()) c.protect("preventDamageUntil");
}

/** Starmie — Recover (base1-64, attack 1). */
export function starmieRecover(c: AttackContext) {
  c.payEnergy(1, "Water");
  if (c.begin()) c.attacker.damage = 0;
}

/** Starmie — Star Freeze (base1-64, attack 2). */
export function starmieStarFreeze(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) c.status("Paralyzed");
}

/** Staryu — Slap (base1-65, attack 1). */
export function staryuSlap(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** Tangela — Bind (base1-66, attack 1). */
export function tangelaBind(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) c.status("Paralyzed");
}

/** Tangela — Poisonpowder (base1-66, attack 2). */
export function tangelaPoisonpowder(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.status("Poisoned");
}

/** Voltorb — Tackle (base1-67, attack 1). */
export function voltorbTackle(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** Vulpix — Confuse Ray (base1-68, attack 1). */
export function vulpixConfuseRay(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Confused");
}

/** Weedle — Poison Sting (base1-69, attack 1). */
export function weedlePoisonSting(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) c.status("Poisoned");
}

export const BASE_ATTACKS: Record<string, AttackHandler[]> = {
  "base1-1": [alakazamConfuseRay],
  "base1-2": [blastoiseHydroPump],
  "base1-3": [chanseyScrunch, chanseyDoubleedge],
  "base1-4": [charizardFireSpin],
  "base1-5": [clefairySing, clefairyMetronome],
  "base1-6": [gyaradosDragonRage, gyaradosBubblebeam],
  "base1-7": [hitmonchanJab, hitmonchanSpecialPunch],
  "base1-8": [machampSeismicToss],
  "base1-9": [magnetonThunderWave, magnetonSelfdestruct],
  "base1-10": [mewtwoPsychic, mewtwoBarrier],
  "base1-11": [nidokingThrash, nidokingToxic],
  "base1-12": [ninetalesLure, ninetalesFireBlast],
  "base1-13": [poliwrathWaterGun, poliwrathWhirlpool],
  "base1-14": [raichuAgility, raichuThunder],
  "base1-15": [venusaurSolarbeam],
  "base1-16": [zapdosThunder, zapdosThunderbolt],
  "base1-17": [beedrillTwineedle, beedrillPoisonSting],
  "base1-18": [dragonairSlam, dragonairHyperBeam],
  "base1-19": [dugtrioSlash, dugtrioEarthquake],
  "base1-20": [electabuzzThundershock, electabuzzThunderpunch],
  "base1-21": [electrodeElectricShock],
  "base1-22": [pidgeottoWhirlwind, pidgeottoMirrorMove],
  "base1-23": [arcanineFlamethrower, arcanineTakeDown],
  "base1-24": [charmeleonSlash, charmeleonFlamethrower],
  "base1-25": [dewgongAuroraBeam, dewgongIceBeam],
  "base1-26": [dratiniPound],
  "base1-27": [farfetchdLeekSlap, farfetchdPotSmash],
  "base1-28": [growlitheFlare],
  "base1-29": [haunterHypnosis, haunterDreamEater],
  "base1-30": [ivysaurVineWhip, ivysaurPoisonpowder],
  "base1-31": [jynxDoubleslap, jynxMeditate],
  "base1-32": [kadabraRecover, kadabraSuperPsy],
  "base1-33": [kakunaStiffen, kakunaPoisonpowder],
  "base1-34": [machokeKarateChop, machokeSubmission],
  "base1-35": [magikarpTackle, magikarpFlail],
  "base1-36": [magmarFirePunch, magmarFlamethrower],
  "base1-37": [nidorinoDoubleKick, nidorinoHornDrill],
  "base1-38": [poliwhirlAmnesia, poliwhirlDoubleslap],
  "base1-39": [porygonConversion1, porygonConversion2],
  "base1-40": [raticateBite, raticateSuperFang],
  "base1-41": [seelHeadbutt],
  "base1-42": [wartortleWithdraw, wartortleBite],
  "base1-43": [abraPsyshock],
  "base1-44": [bulbasaurLeechSeed],
  "base1-45": [caterpieStringShot],
  "base1-46": [charmanderScratch, charmanderEmber],
  "base1-47": [diglettDig, diglettMudSlap],
  "base1-48": [doduoFuryAttack],
  "base1-49": [drowzeePound, drowzeeConfuseRay],
  "base1-50": [gastlySleepingGas, gastlyDestinyBond],
  "base1-51": [koffingFoulGas],
  "base1-52": [machopLowKick],
  "base1-53": [magnemiteThunderWave, magnemiteSelfdestruct],
  "base1-54": [metapodStiffen, metapodStunSpore],
  "base1-55": [nidoranHornHazard],
  "base1-56": [onixRockThrow, onixHarden],
  "base1-57": [pidgeyWhirlwind],
  "base1-58": [pikachuGnaw, pikachuThunderJolt],
  "base1-59": [poliwagWaterGun],
  "base1-60": [ponytaSmashKick, ponytaFlameTail],
  "base1-61": [rattataBite],
  "base1-62": [sandshrewSandattack],
  "base1-63": [squirtleBubble, squirtleWithdraw],
  "base1-64": [starmieRecover, starmieStarFreeze],
  "base1-65": [staryuSlap],
  "base1-66": [tangelaBind, tangelaPoisonpowder],
  "base1-67": [voltorbTackle],
  "base1-68": [vulpixConfuseRay],
  "base1-69": [weedlePoisonSting],
};
