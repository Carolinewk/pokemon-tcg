import type { AttackContext, AttackHandler } from "../context";
import * as O from "../classic/operations";
import * as R from "../classic/state";
import * as B from "../base-set/attacks";

/** gym2-1 · Heat Tackle */
export function blainesArcanine1HeatTackle0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  c.recoil(10);
}

/** gym2-1 · Firestorm */
export function blainesArcanine1Firestorm1(c: AttackContext) {
  c.payEnergy(3, "Fire");
  if (!c.begin()) return;
  c.hit(120);
}

/** gym2-2 · Roaring Flames */
export function blainesCharizard2RoaringFlames0(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.energyCount(c, c.attacker, "Fire");
  O.discardAll(c, "Fire");
  c.hit(20 + 20 * n);
}

/** gym2-2 · Flame Jet */
export function blainesCharizard2FlameJet1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.selectedDamage(c, 40, 1, false);
}

/** gym2-3 · Will-o'-the-wisp */
export function brocksNinetales3Willothewisp0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym2-4 · Growth */
export function erikasVenusaur4Growth0(c: AttackContext) {
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

/** gym2-4 · Wide Solarbeam */
export function erikasVenusaur4WideSolarbeam1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.selectedDamage(c, 20, 2);
}

/** gym2-5 · Summon Storm */
export function giovannisGyarados5SummonStorm0(c: AttackContext) {
  if (!c.begin()) return;
  if (O.coins(c, 2) === 2)
    for (const p of O.board(c.state))
      if (p.uid !== c.attacker.uid) c.hit(20, p, false);
}

/** gym2-5 · Dragon Tornado */
export function giovannisGyarados5DragonTornado1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  c.forceSwitch(false);
}

/** gym2-6 · Hurricane Punch */
export function giovannisMachamp6HurricanePunch0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 * O.coins(c, 4));
}

/** gym2-7 · Intimidate */
export function giovannisNidoking7Intimidate0(c: AttackContext) {
  if (!c.begin()) return;
  if (R.maximumHP(c.state, c.defender, c.catalog) <= 50)
    O.opponentMark(c, "cannotAttackSource", 1, undefined, true);
}

/** gym2-7 · Tumbling Attack */
export function giovannisNidoking7TumblingAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40 + (c.coin() ? 30 : 0));
}

/** gym2-8 · Ambush */
export function giovannisPersian8Ambush0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 20 : 0));
}

/** gym2-9 · Nerve Poison */
export function kogasBeedrill9NervePoison0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) {
    c.status("Paralyzed");
    c.status("Poisoned");
  }
}

/** gym2-9 · Hyper Needle */
export function kogasBeedrill9HyperNeedle1(c: AttackContext) {
  c.require(
    !c.attacker.usedAttacks?.includes(c.attack.name),
    "This attack was already used.",
  );
  if (c.begin()) {
    (c.attacker.usedAttacks ||= []).push(c.attack.name);
    if (c.coin()) c.hit(70);
  }
}

/** gym2-10 · Giant Growth */
export function kogasDitto10GiantGrowth0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.putMark(c, c.attacker, "giantGrowth", O.forever);
}

/** gym2-10 · Pound */
export function kogasDitto10Pound1(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-11 · Kerzap */
export function ltSurgesRaichu11Kerzap0(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(20 + (heads ? 30 : 0));
  if (heads) O.discardAll(c, "Lightning");
}

/** gym2-11 · Thundertackle */
export function ltSurgesRaichu11Thundertackle1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  if (c.coin()) c.status("Paralyzed");
  else c.recoil(20);
}

/** gym2-12 · Electro Beam */
export function mistysGolduck12ElectroBeam0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  if (!c.coin()) O.discardAll(c);
}

/** gym2-12 · Super Removal */
export function mistysGolduck12SuperRemoval1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin())
    for (const p of O.allPieces(c.opponent)) {
      if (p.energy.length && !c.effectsBlocked(p)) {
        const ix = c.chooseEnergy(
          `super-removal-${p.uid}`,
          "Discard an opposing Energy card",
          p,
        );
        O.discardEnergy(c.state, c.opponent, p, ix);
      }
    }
}

/** gym2-13 · Tidal Wave */
export function mistysGyarados13TidalWave0(c: AttackContext) {
  if (c.begin()) c.hit(70);
}

/** gym2-14 · Juxtapose */
export function rocketsMewtwo14Juxtapose0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin() && !c.effectsBlocked()) {
    const n = c.attacker.damage;
    c.attacker.damage = c.defender.damage;
    c.defender.damage = n;
  }
}

/** gym2-14 · Hypnoblast */
export function rocketsMewtwo14Hypnoblast1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (c.coin()) c.status("Asleep");
  }
}

/** gym2-14 · Psyburn */
export function rocketsMewtwo14Psyburn2(c: AttackContext) {
  if (c.begin()) c.hit(60);
}

/** gym2-15 · Plasma */
export function rocketsZapdos15Plasma0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.recover(
    c,
    c.player,
    O.namedEnergy("Lightning"),
    1,
    "energy",
    c.attacker,
    "plasma",
    true,
  );
}

/** gym2-15 · Electroburn */
export function rocketsZapdos15Electroburn1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(70);
  c.recoil(10 * O.energyIndices(c, c.attacker, "Lightning").length);
}

/** gym2-16 · Mega Burn */
export function sabrinasAlakazam16MegaBurn0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(60);
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

/** gym2-21 · Burn Up */
export function blainesNinetales21BurnUp0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  if (!c.coin()) O.discardAll(c, "Fire");
}

/** gym2-22 · Lie Low */
export function brocksDugtrio22LieLow0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "reduceDamage", 1, 20);
}

/** gym2-22 · Earthdrill */
export function brocksDugtrio22Earthdrill1(c: AttackContext) {
  c.require(
    c.attacker.lastUsed?.name === "Lie Low" &&
      c.attacker.lastUsed.turn === c.state.turn - 2,
    "Use Lie Low on your previous turn first.",
  );
  if (!c.begin()) return;
  c.hit(60);
}

/** gym2-23 · Mega Kick */
export function giovannisNidoqueen23MegaKick0(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** gym2-23 · Love Lariat */
export function giovannisNidoqueen23LoveLariat1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin())
    c.hit(
      50 + (O.countNames(c, ["Giovanni's Nidoking"], false, true) ? 50 : 0),
    );
}

/** gym2-24 · Snapping Pincers */
export function giovannisPinsir24SnappingPincers0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 10 : 0));
}

/** gym2-24 · Overhead Toss */
export function giovannisPinsir24OverheadToss1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  if (c.player.bench.length && !c.coin())
    O.selectedDamage(c, 20, 1, true, false, c.player);
}

/** gym2-25 · Poison Buildup */
export function kogasArbok25PoisonBuildup0(c: AttackContext) {
  if (!c.begin()) return;
  c.selfStatus("Poisoned");
}

/** gym2-25 · Poison Power */
export function kogasArbok25PoisonPower1(c: AttackContext) {
  if (!c.begin()) return;
  const poisoned = c.attacker.conditions.includes("Poisoned");
  c.hit(poisoned ? 40 : 20);
  if (poisoned) c.status("Poisoned");
}

/** gym2-26 · Sludge Whirlpool */
export function kogasMuk26SludgeWhirlpool0(c: AttackContext) {
  if (c.begin()) c.hit(40);
}

/** gym2-27 · Quick Turn */
export function kogasPidgeotto27QuickTurn0(c: AttackContext) {
  B.poliwhirlDoubleslap(c);
}

/** gym2-27 · Aerial Maneuvers */
export function kogasPidgeotto27AerialManeuvers1(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(10 + (heads ? 30 : 0));
  if (heads) c.protect("preventAllUntil");
}

/** gym2-28 · High Voltage */
export function ltSurgesJolteon28HighVoltage0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.lockTrainers(c, c.opponent);
}

/** gym2-28 · Thunder Flare */
export function ltSurgesJolteon28ThunderFlare1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + c.attacker.damage);
  if (!c.coin()) c.recoil(30);
}

/** gym2-29 · Dark Wave */
export function sabrinasGengar29DarkWave0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  c.state.powerLockUntil = c.state.turn + 1;
}

/** gym2-29 · Shadow Bind */
export function sabrinasGengar29ShadowBind1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40);
  O.opponentMark(c, "noRetreat");
}

/** gym2-30 · Damage Shift */
export function sabrinasGolduck30DamageShift0(c: AttackContext) {
  if (!c.begin()) return;
  if (!c.effectsBlocked())
    for (const p of O.allPieces(c.player))
      if (p.damage >= 10) {
        p.damage -= 10;
        O.damageCounters(c, c.defender, 10);
      }
}

/** gym2-30 · Water Spray */
export function sabrinasGolduck30WaterSpray1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.coin() ? 20 : 0));
}

/** gym2-31 · Fire Claws */
export function blainesCharmeleon31FireClaws0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym2-31 · Bonfire */
export function blainesCharmeleon31Bonfire1(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.coins(c, 3);
  if (O.energyIndices(c, c.attacker, "Fire").length < n) return;
  if (n) {
    const ix = c.chooseEnergy(
      "bonfire-energy",
      "Discard Fire Energy",
      c.attacker,
      n,
      n,
      "Fire",
    );
    O.discardEnergy(c.state, c.player, c.attacker, ix);
  }
  for (const p of O.allPieces(c.opponent)) c.hit(10 * n, p, false);
}

/** gym2-32 · Mega Peck */
export function blainesDodrio32MegaPeck0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(50);
}

/** gym2-33 · Fire Mane */
export function blainesRapidash33FireMane0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym2-33 · Stamp */
export function blainesRapidash33Stamp1(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(30 + (heads ? 10 : 0));
  if (heads) O.benchDamage(c, 10);
}

/** gym2-34 · Tackle */
export function brocksGraveler34Tackle0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym2-34 · Detonate */
export function brocksGraveler34Detonate1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(50);
  O.benchDamage(c, 10, "both");
  c.recoil(50);
  O.discardStadium(c);
}

/** gym2-35 · Mega Thrash */
export function brocksPrimeape35MegaThrash0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(60);
  c.recoil(20);
  O.discardStadium(c);
}

/** gym2-36 · Swift */
export function brocksSandslash36Swift0(c: AttackContext) {
  if (!c.begin()) return;
  c.ignoreDefenses = true;
  c.hit(20, c.defender, false);
}

/** gym2-36 · Needle Ball */
export function brocksSandslash36NeedleBall1(c: AttackContext) {
  if (c.begin()) {
    c.hit(30);
    if (c.coin()) c.status("Poisoned");
  }
}

/** gym2-37 · Hypnotic Gaze */
export function brocksVulpix37HypnoticGaze0(c: AttackContext) {
  B.haunterHypnosis(c);
}

/** gym2-37 · Fire Ring */
export function brocksVulpix37FireRing1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.selectedDamage(c, 10);
}

/** gym2-38 · Stretch Vine */
export function erikasBellsprout38StretchVine0(c: AttackContext) {
  if (!c.begin()) return;
  O.selectedDamage(c, 10);
}

/** gym2-39 · Sleep Seed */
export function erikasBulbasaur39SleepSeed0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Asleep");
  }
}

/** gym2-39 · Errand-Running */
export function erikasBulbasaur39ErrandRunning1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.search(c, c.player, (x) => x.supertype === "Trainer");
}

/** gym2-40 · Lunar Power */
export function erikasClefairy40LunarPower0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.evolveFromDeck(c, c.player.bench);
}

/** gym2-40 · Moon Kick */
export function erikasClefairy40MoonKick1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym2-41 · Double Razor Leaf */
export function erikasIvysaur41DoubleRazorLeaf0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(40 * O.coins(c, 2));
}

/** gym2-42 · Risky Attack */
export function giovannisMachoke42RiskyAttack0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) c.hit(60);
  else c.recoil(100);
}

/** gym2-42 · Headlock */
export function giovannisMachoke42Headlock1(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(20 + (heads ? 20 : 0));
  if (heads) c.status("Paralyzed");
}

/** gym2-43 · False Charity */
export function giovannisMeowth43FalseCharity0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    const h = c.opponent.deck.shift();
    if (h) {
      O.privateReveal(c, "False Charity", [h]);
      (c.catalog[h.card].supertype === "Trainer"
        ? c.opponent.discard
        : c.opponent.hand
      ).push(h);
    }
  }
}

/** gym2-43 · Double Scratch */
export function giovannisMeowth43DoubleScratch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, 2));
}

/** gym2-44 · Poison Sting Tackle */
export function giovannisNidorina44PoisonStingTackle0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  c.recoil(20);
  if (c.coin()) c.status("Poisoned");
}

/** gym2-44 · Body Slam */
export function giovannisNidorina44BodySlam1(c: AttackContext) {
  B.tangelaBind(c);
}

/** gym2-45 · Rend */
export function giovannisNidorino45Rend0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 + (c.defender.damage ? 20 : 0));
}

/** gym2-46 · Bite */
export function kogasGolbat46Bite0(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym2-46 · Sonic Scream */
export function kogasGolbat46SonicScream1(c: AttackContext) {
  B.alakazamConfuseRay(c);
}

/** gym2-47 · Toxic Secretion */
export function kogasKakuna47ToxicSecretion0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(0);
  if (c.coin()) c.status("Poisoned", 20);
}

/** gym2-48 · Smokescreen */
export function kogasKoffing48Smokescreen0(c: AttackContext) {
  B.sandshrewSandattack(c);
}

/** gym2-48 · Obscuring Gas */
export function kogasKoffing48ObscuringGas1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  if (c.coin()) O.leavePlay(c, c.attacker, "deck");
}

/** gym2-49 · Messenger */
export function kogasPidgey49Messenger0(c: AttackContext) {
  if (!c.begin()) return;
  const name = c.printedCard.name;
  O.leavePlay(c, c.attacker, "deck");
  O.search(c, c.player, (x) => O.pokemon(x) && x.name !== name);
}

/** gym2-49 · Wing Attack */
export function kogasPidgey49WingAttack1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym2-50 · Spontaneous Explosion */
export function kogasWeezing50SpontaneousExplosion0(c: AttackContext) {
  if (!c.begin()) return;
  const heads = c.coin();
  c.hit(10 + (heads ? 30 : 0));
  if (heads) c.recoil(30);
}

/** gym2-50 · Toxic Cloud */
export function kogasWeezing50ToxicCloud1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) c.status("Poisoned", 20);
}

/** gym2-51 · Surprise */
export function ltSurgesEevee51Surprise0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.opponent.hand.length) {
    const h = c.opponent.hand[Math.floor(c.random() * c.opponent.hand.length)];
    O.privateReveal(c, "Surprise", [h]);
    O.moveCards(c.opponent.hand, c.opponent.deck, [h]);
    O.shuffle(c.state, c.opponent.deck);
  }
}

/** gym2-51 · Scratch */
export function ltSurgesEevee51Scratch1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym2-52 · Power Ball */
export function ltSurgesElectrode52PowerBall0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30 + 10 * O.coins(c, 3));
}

/** gym2-53 · Focus Energy */
export function ltSurgesRaticate53FocusEnergy0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "doubleDamage", 2, 2, undefined, "Double-edge");
  O.putMark(c, c.attacker, "doubleRecoil", 2);
}

/** gym2-53 · Double-edge */
export function ltSurgesRaticate53Doubleedge1(c: AttackContext) {
  if (c.begin()) {
    c.hit(40);
    c.recoil(20);
  }
}

/** gym2-54 · Ice Throw */
export function mistysDewgong54IceThrow0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(
    20 *
      (R.pokemonCard(c.state, c.defender, c.catalog).types.includes("Fighting")
        ? 2
        : 1),
  );
}

/** gym2-54 · Take Down */
export function mistysDewgong54TakeDown1(c: AttackContext) {
  B.machokeSubmission(c);
}

/** gym2-55 · Nightmare */
export function sabrinasHaunter55Nightmare0(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    c.status("Asleep");
  }
}

/** gym2-55 · Shadow Attack */
export function sabrinasHaunter55ShadowAttack1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.selectedDamage(c, 30);
}

/** gym2-56 · Invigorate */
export function sabrinasHypno56Invigorate0(c: AttackContext) {
  if (!c.begin()) return;
  const options = c.state.players.flatMap((p) =>
    p.bench.length < R.narrowGym(c.state)
      ? p.discard
          .filter((h) => R.startingPokemon(c.catalog[h.card]))
          .map((h) => ({
            value: `${p.id}/${h.uid}`,
            label: `${p.name} · ${c.catalog[h.card].name}`,
            card: h.card,
          }))
      : [],
  );
  const v = c.choose(
    "invigorate",
    "Choose a Basic Pokémon to revive",
    options,
    0,
    1,
  )[0];
  if (v) {
    const [pid, uid] = v.split("/");
    const p = c.state.players.find((p) => p.id === pid)!;
    const i = p.discard.findIndex((h) => h.uid === uid);
    const q = O.piece(p.discard.splice(i, 1)[0], c.state.turn);
    q.damage = Math.floor(c.catalog[q.card].hp / 20) * 10;
    p.bench.push(q);
  }
}

/** gym2-56 · Pendulum Curse */
export function sabrinasHypno56PendulumCurse1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20 * O.coins(c, Math.floor(c.defender.damage / 10)));
}

/** gym2-57 · Helping Hand */
export function sabrinasJynx57HelpingHand0(c: AttackContext) {
  if (!c.begin()) return;
  const p = c.choosePiece(
    "helping-hand",
    "Choose an opposing Pokémon",
    O.allPieces(c.opponent),
  );
  if (!c.effectsBlocked(p)) {
    const n = O.numberChoice(
      c,
      "helping-amount",
      "How many damage counters to remove?",
      Math.floor(p.damage / 10),
    );
    O.heal(p, n * 10);
    O.draw(c.state, c.player, n);
  }
}

/** gym2-57 · Hug */
export function sabrinasJynx57Hug1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.opponentMark(c, "noRetreat");
}

/** gym2-58 · Life Drain */
export function sabrinasKadabra58LifeDrain0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin() && !c.effectsBlocked())
    O.damageCounters(
      c,
      c.defender,
      Math.max(
        0,
        R.maximumHP(c.state, c.defender, c.catalog) - 10 - c.defender.damage,
      ),
    );
}

/** gym2-58 · Psyshot */
export function sabrinasKadabra58Psyshot1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym2-59 · Magic Darts */
export function sabrinasMrMime59MagicDarts0(c: AttackContext) {
  if (!c.begin()) return;
  const p = c.choosePiece(
    "magic-darts",
    "Choose an opposing Pokémon",
    O.allPieces(c.opponent),
  );
  c.hit(10 * O.coins(c, 3), p, false);
}

/** gym2-60 · Fire Tail Slap */
export function blainesCharmander60FireTailSlap0(c: AttackContext) {
  c.require(
    c.copying || O.energyIndices(c, c.attacker, "Fire").length,
    "Attach Fire Energy first.",
  );
  if (!c.begin()) return;
  c.hit(20);
  if (!c.coin()) c.payEnergy(1, "Fire");
}

/** gym2-61 · Wild Kick */
export function blainesDoduo61WildKick0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(20);
}

/** gym2-61 · Retaliate */
export function blainesDoduo61Retaliate1(c: AttackContext) {
  B.magikarpFlail(c);
}

/** gym2-62 · Stoke */
export function blainesGrowlithe62Stoke0(c: AttackContext) {
  if (!c.begin()) return;
  O.search(c, c.player, O.namedEnergy("Fire"), 1, "energy", c.attacker);
}

/** gym2-62 · Body Slam */
export function blainesGrowlithe62BodySlam1(c: AttackContext) {
  B.tangelaBind(c);
}

/** gym2-63 · Pranks */
export function blainesMankey63Pranks0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.recoverTop(c, c.opponent);
}

/** gym2-63 · Fury Swipes */
export function blainesMankey63FurySwipes1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** gym2-64 · Hind Kick */
export function blainesPonyta64HindKick0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.player.bench.length && c.coin()) O.switchSelf(c);
}

/** gym2-65 · Horn Charge */
export function blainesRhyhorn65HornCharge0(c: AttackContext) {
  B.nidoranHornHazard(c);
}

/** gym2-65 · Overrun */
export function blainesRhyhorn65Overrun1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.selectedDamage(c, 20);
}

/** gym2-66 · Bite */
export function blainesVulpix66Bite0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-66 · Call Will-o'-the-wisp */
export function blainesVulpix66CallWillothewisp1(c: AttackContext) {
  if (!c.begin()) return;
  O.recover(
    c,
    c.player,
    O.namedEnergy("Fire"),
    O.coins(c, 3),
    "hand",
    undefined,
    "wisp",
    true,
  );
}

/** gym2-67 · Surprise Attack */
export function brocksDiglett67SurpriseAttack0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(20);
}

/** gym2-67 · Tremor */
export function brocksDiglett67Tremor1(c: AttackContext) {
  if (c.begin()) {
    c.hit(40);
    O.benchDamage(c, 10, "own");
  }
}

/** gym2-68 · Rock Toss */
export function brocksGeodude68RockToss0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** gym2-69 · Group Therapy */
export function erikasJigglypuff69GroupTherapy0(c: AttackContext) {
  if (!c.begin()) return;
  for (const p of O.board(c.state)) O.heal(p, 10);
}

/** gym2-69 · Pulled Punch */
export function erikasJigglypuff69PulledPunch1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(c.defender.damage ? 10 : 40);
}

/** gym2-70 · Strange Powder */
export function erikasOddish70StrangePowder0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.status(c.coin() ? "Confused" : "Asleep");
}

/** gym2-71 · Irongrip */
export function erikasParas71Irongrip0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-71 · Poison Spore */
export function erikasParas71PoisonSpore1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    c.status("Poisoned");
    O.benchDamage(c, 10);
  }
}

/** gym2-72 · Chop */
export function giovannisMachop72Chop0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-72 · Fury Punch */
export function giovannisMachop72FuryPunch1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) c.hit(2 * c.attacker.damage);
}

/** gym2-73 · Ancestral Memory */
export function giovannisMagikarp73AncestralMemory0(c: AttackContext) {
  c.require(
    !c.attacker.usedAttacks?.includes(c.attack.name),
    "This attack was already used.",
  );
  if (c.begin()) {
    (c.attacker.usedAttacks ||= []).push(c.attack.name);
    if (c.coin()) c.hit(40);
  }
}

/** gym2-73 · Flail Around */
export function giovannisMagikarp73FlailAround1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 * O.coins(c, 3));
}

/** gym2-74 · Cat Fleas */
export function giovannisMeowth74CatFleas0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.status("Confused");
  }
}

/** gym2-74 · Cat Kick */
export function giovannisMeowth74CatKick1(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym2-75 · Horn Thrust */
export function giovannisNidoranFemale75HornThrust0(c: AttackContext) {
  if (c.begin() && c.coin()) c.hit(20);
}

/** gym2-75 · Double-edge */
export function giovannisNidoranFemale75Doubleedge1(c: AttackContext) {
  if (c.begin()) {
    c.hit(30);
    c.recoil(20);
  }
}

/** gym2-76 · Double Kick */
export function giovannisNidoranMale76DoubleKick0(c: AttackContext) {
  B.doduoFuryAttack(c);
}

/** gym2-76 · Retaliation */
export function giovannisNidoranMale76Retaliation1(c: AttackContext) {
  c.require(
    c.attacker.damage >= 20,
    "This attack needs at least 2 damage counters.",
  );
  if (!c.begin()) return;
  c.hit(30);
}

/** gym2-77 · Fast-Acting Poison */
export function kogasEkans77FastActingPoison0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (O.coins(c, 2) === 2) {
    c.status("Confused");
    c.status("Poisoned");
  }
}

/** gym2-78 · Sludge Grip */
export function kogasGrimer78SludgeGrip0(c: AttackContext) {
  if (!c.begin()) return;
  if (c.opponent.bench.length && c.coin() && !c.effectsBlocked()) {
    c.forceSwitch(false);
    c.defender = c.opponent.active!;
    c.status("Poisoned");
  }
}

/** gym2-78 · Sludge Toss */
export function kogasGrimer78SludgeToss1(c: AttackContext) {
  if (c.begin()) c.hit(20);
}

/** gym2-79 · Smelly Gas */
export function kogasKoffing79SmellyGas0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  if (c.coin()) O.benchDamage(c, 10, "both");
}

/** gym2-80 · Peck */
export function kogasPidgey80Peck0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-80 · Sand-attack */
export function kogasPidgey80Sandattack1(c: AttackContext) {
  if (c.begin()) {
    c.hit(20);
    if (!c.effectsBlocked())
      (c.defender.effects ||= {}).sandAttackUntil = c.state.turn + 1;
  }
}

/** gym2-81 · Sleep Powder */
export function kogasTangela81SleepPowder0(c: AttackContext) {
  if (c.begin()) {
    c.hit(10);
    c.status("Asleep");
  }
}

/** gym2-81 · Grasping Vine */
export function kogasTangela81GraspingVine1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) O.draw(c.state, c.player, 2);
}

/** gym2-82 · Sting */
export function kogasWeedle82Sting0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-82 · Sharp Stinger */
export function kogasWeedle82SharpStinger1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  c.status(c.coin() ? "Poisoned" : "Paralyzed");
}

/** gym2-83 · Group Attack */
export function kogasZubat83GroupAttack0(c: AttackContext) {
  if (!c.begin()) return;
  O.family(
    c,
    (x) => R.startingPokemon(x) && x.name === c.printedCard.name,
    5,
    false,
  );
  c.hit(10 * O.countNames(c, [c.printedCard.name]));
}

/** gym2-84 · Quick Attack */
export function ltSurgesPikachu84QuickAttack0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** gym2-85 · Focus Energy */
export function ltSurgesRattata85FocusEnergy0(c: AttackContext) {
  if (!c.begin()) return;
  O.putMark(c, c.attacker, "doubleDamage", 2, 2, undefined, "Quick Attack");
}

/** gym2-85 · Quick Attack */
export function ltSurgesRattata85QuickAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** gym2-86 · Bouncing Ball */
export function ltSurgesVoltorb86BouncingBall0(c: AttackContext) {
  B.pikachuThunderJolt(c);
}

/** gym2-87 · Ink Spurt */
export function mistysHorsea87InkSpurt0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin() && !c.effectsBlocked()) {
    (c.defender.effects ||= {}).sandAttackUntil = O.forever;
  }
}

/** gym2-88 · Play Dead */
export function mistysMagikarp88PlayDead0(c: AttackContext) {
  if (c.begin()) {
    c.hit(0);
    if (c.coin()) c.protect("preventAllUntil");
  }
}

/** gym2-88 · Leap */
export function mistysMagikarp88Leap1(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-89 · Bubbles */
export function mistysPoliwag89Bubbles0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (!c.coin())
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

/** gym2-89 · Amnesia */
export function mistysPoliwag89Amnesia1(c: AttackContext) {
  B.poliwhirlAmnesia(c);
}

/** gym2-90 · ESP */
export function mistysPsyduck90ESP0(c: AttackContext) {
  if (!c.begin()) return;
  const n = O.coins(c, 3);
  if (n === 1) O.draw(c.state, c.player, 1);
  if (n === 2) c.hit(20);
  if (n === 3) O.copyAttack(c, false, true);
}

/** gym2-91 · Frostbite */
export function mistysSeel91Frostbite0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10);
  O.opponentMark(c, "noRetreat");
}

/** gym2-91 · Mirage */
export function mistysSeel91Mirage1(c: AttackContext) {
  B.sandshrewSandattack(c);
}

/** gym2-92 · Star Boomerang */
export function mistysStaryu92StarBoomerang0(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  if (c.coin()) O.leavePlay(c, c.attacker, "hand");
}

/** gym2-93 · Pound */
export function sabrinasAbra93Pound0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-93 · Synchronize */
export function sabrinasAbra93Synchronize1(c: AttackContext) {
  c.require(
    c.attacker.energy.length === c.defender.energy.length,
    "Both Pokémon need the same number of Energy cards.",
  );
  if (!c.begin()) return;
  c.hit(40);
}

/** gym2-94 · Psyscan */
export function sabrinasAbra94Psyscan0(c: AttackContext) {
  if (!c.begin()) return;
  O.privateReveal(c, "Opponent’s hand", c.opponent.hand);
}

/** gym2-94 · Quick Attack */
export function sabrinasAbra94QuickAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(10 + (c.coin() ? 20 : 0));
}

/** gym2-95 · Energy Support */
export function sabrinasDrowzee95EnergySupport0(c: AttackContext) {
  if (!c.begin()) return;
  O.search(c, c.player, O.namedEnergy("Psychic"));
}

/** gym2-95 · Mind Shock */
export function sabrinasDrowzee95MindShock1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20, c.defender, false);
}

/** gym2-96 · Lick */
export function sabrinasGastly96Lick0(c: AttackContext) {
  B.squirtleBubble(c);
}

/** gym2-96 · Fade Out */
export function sabrinasGastly96FadeOut1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(30);
  O.leavePlay(c, c.attacker, "hand", false, true);
}

/** gym2-97 · Suffocating Gas */
export function sabrinasGastly97SuffocatingGas0(c: AttackContext) {
  if (c.begin()) c.hit(30);
}

/** gym2-98 · Sharp Point */
export function sabrinasPorygon98SharpPoint0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-98 · Barrier Attack */
export function sabrinasPorygon98BarrierAttack1(c: AttackContext) {
  if (!c.begin()) return;
  c.hit(20);
  O.putMark(c, c.attacker, "reduceDamage", 1, 10);
}

/** gym2-99 · Scratch */
export function sabrinasPsyduck99Scratch0(c: AttackContext) {
  if (c.begin()) c.hit(10);
}

/** gym2-99 · Random ESP */
export function sabrinasPsyduck99RandomESP1(c: AttackContext) {
  if (!c.begin()) return;
  if (c.coin()) {
    c.hit(20);
    c.status("Confused");
  } else c.selfStatus("Confused");
}

export const ATTACKS: Record<string, AttackHandler[]> = {
  "gym2-1": [blainesArcanine1HeatTackle0, blainesArcanine1Firestorm1],
  "gym2-2": [blainesCharizard2RoaringFlames0, blainesCharizard2FlameJet1],
  "gym2-3": [brocksNinetales3Willothewisp0],
  "gym2-4": [erikasVenusaur4Growth0, erikasVenusaur4WideSolarbeam1],
  "gym2-5": [giovannisGyarados5SummonStorm0, giovannisGyarados5DragonTornado1],
  "gym2-6": [giovannisMachamp6HurricanePunch0],
  "gym2-7": [giovannisNidoking7Intimidate0, giovannisNidoking7TumblingAttack1],
  "gym2-8": [giovannisPersian8Ambush0],
  "gym2-9": [kogasBeedrill9NervePoison0, kogasBeedrill9HyperNeedle1],
  "gym2-10": [kogasDitto10GiantGrowth0, kogasDitto10Pound1],
  "gym2-11": [ltSurgesRaichu11Kerzap0, ltSurgesRaichu11Thundertackle1],
  "gym2-12": [mistysGolduck12ElectroBeam0, mistysGolduck12SuperRemoval1],
  "gym2-13": [mistysGyarados13TidalWave0],
  "gym2-14": [
    rocketsMewtwo14Juxtapose0,
    rocketsMewtwo14Hypnoblast1,
    rocketsMewtwo14Psyburn2,
  ],
  "gym2-15": [rocketsZapdos15Plasma0, rocketsZapdos15Electroburn1],
  "gym2-16": [sabrinasAlakazam16MegaBurn0],
  "gym2-21": [blainesNinetales21BurnUp0],
  "gym2-22": [brocksDugtrio22LieLow0, brocksDugtrio22Earthdrill1],
  "gym2-23": [giovannisNidoqueen23MegaKick0, giovannisNidoqueen23LoveLariat1],
  "gym2-24": [
    giovannisPinsir24SnappingPincers0,
    giovannisPinsir24OverheadToss1,
  ],
  "gym2-25": [kogasArbok25PoisonBuildup0, kogasArbok25PoisonPower1],
  "gym2-26": [kogasMuk26SludgeWhirlpool0],
  "gym2-27": [kogasPidgeotto27QuickTurn0, kogasPidgeotto27AerialManeuvers1],
  "gym2-28": [ltSurgesJolteon28HighVoltage0, ltSurgesJolteon28ThunderFlare1],
  "gym2-29": [sabrinasGengar29DarkWave0, sabrinasGengar29ShadowBind1],
  "gym2-30": [sabrinasGolduck30DamageShift0, sabrinasGolduck30WaterSpray1],
  "gym2-31": [blainesCharmeleon31FireClaws0, blainesCharmeleon31Bonfire1],
  "gym2-32": [blainesDodrio32MegaPeck0],
  "gym2-33": [blainesRapidash33FireMane0, blainesRapidash33Stamp1],
  "gym2-34": [brocksGraveler34Tackle0, brocksGraveler34Detonate1],
  "gym2-35": [brocksPrimeape35MegaThrash0],
  "gym2-36": [brocksSandslash36Swift0, brocksSandslash36NeedleBall1],
  "gym2-37": [brocksVulpix37HypnoticGaze0, brocksVulpix37FireRing1],
  "gym2-38": [erikasBellsprout38StretchVine0],
  "gym2-39": [erikasBulbasaur39SleepSeed0, erikasBulbasaur39ErrandRunning1],
  "gym2-40": [erikasClefairy40LunarPower0, erikasClefairy40MoonKick1],
  "gym2-41": [erikasIvysaur41DoubleRazorLeaf0],
  "gym2-42": [giovannisMachoke42RiskyAttack0, giovannisMachoke42Headlock1],
  "gym2-43": [giovannisMeowth43FalseCharity0, giovannisMeowth43DoubleScratch1],
  "gym2-44": [
    giovannisNidorina44PoisonStingTackle0,
    giovannisNidorina44BodySlam1,
  ],
  "gym2-45": [giovannisNidorino45Rend0],
  "gym2-46": [kogasGolbat46Bite0, kogasGolbat46SonicScream1],
  "gym2-47": [kogasKakuna47ToxicSecretion0],
  "gym2-48": [kogasKoffing48Smokescreen0, kogasKoffing48ObscuringGas1],
  "gym2-49": [kogasPidgey49Messenger0, kogasPidgey49WingAttack1],
  "gym2-50": [kogasWeezing50SpontaneousExplosion0, kogasWeezing50ToxicCloud1],
  "gym2-51": [ltSurgesEevee51Surprise0, ltSurgesEevee51Scratch1],
  "gym2-52": [ltSurgesElectrode52PowerBall0],
  "gym2-53": [ltSurgesRaticate53FocusEnergy0, ltSurgesRaticate53Doubleedge1],
  "gym2-54": [mistysDewgong54IceThrow0, mistysDewgong54TakeDown1],
  "gym2-55": [sabrinasHaunter55Nightmare0, sabrinasHaunter55ShadowAttack1],
  "gym2-56": [sabrinasHypno56Invigorate0, sabrinasHypno56PendulumCurse1],
  "gym2-57": [sabrinasJynx57HelpingHand0, sabrinasJynx57Hug1],
  "gym2-58": [sabrinasKadabra58LifeDrain0, sabrinasKadabra58Psyshot1],
  "gym2-59": [sabrinasMrMime59MagicDarts0],
  "gym2-60": [blainesCharmander60FireTailSlap0],
  "gym2-61": [blainesDoduo61WildKick0, blainesDoduo61Retaliate1],
  "gym2-62": [blainesGrowlithe62Stoke0, blainesGrowlithe62BodySlam1],
  "gym2-63": [blainesMankey63Pranks0, blainesMankey63FurySwipes1],
  "gym2-64": [blainesPonyta64HindKick0],
  "gym2-65": [blainesRhyhorn65HornCharge0, blainesRhyhorn65Overrun1],
  "gym2-66": [blainesVulpix66Bite0, blainesVulpix66CallWillothewisp1],
  "gym2-67": [brocksDiglett67SurpriseAttack0, brocksDiglett67Tremor1],
  "gym2-68": [brocksGeodude68RockToss0],
  "gym2-69": [erikasJigglypuff69GroupTherapy0, erikasJigglypuff69PulledPunch1],
  "gym2-70": [erikasOddish70StrangePowder0],
  "gym2-71": [erikasParas71Irongrip0, erikasParas71PoisonSpore1],
  "gym2-72": [giovannisMachop72Chop0, giovannisMachop72FuryPunch1],
  "gym2-73": [
    giovannisMagikarp73AncestralMemory0,
    giovannisMagikarp73FlailAround1,
  ],
  "gym2-74": [giovannisMeowth74CatFleas0, giovannisMeowth74CatKick1],
  "gym2-75": [
    giovannisNidoranFemale75HornThrust0,
    giovannisNidoranFemale75Doubleedge1,
  ],
  "gym2-76": [
    giovannisNidoranMale76DoubleKick0,
    giovannisNidoranMale76Retaliation1,
  ],
  "gym2-77": [kogasEkans77FastActingPoison0],
  "gym2-78": [kogasGrimer78SludgeGrip0, kogasGrimer78SludgeToss1],
  "gym2-79": [kogasKoffing79SmellyGas0],
  "gym2-80": [kogasPidgey80Peck0, kogasPidgey80Sandattack1],
  "gym2-81": [kogasTangela81SleepPowder0, kogasTangela81GraspingVine1],
  "gym2-82": [kogasWeedle82Sting0, kogasWeedle82SharpStinger1],
  "gym2-83": [kogasZubat83GroupAttack0],
  "gym2-84": [ltSurgesPikachu84QuickAttack0],
  "gym2-85": [ltSurgesRattata85FocusEnergy0, ltSurgesRattata85QuickAttack1],
  "gym2-86": [ltSurgesVoltorb86BouncingBall0],
  "gym2-87": [mistysHorsea87InkSpurt0],
  "gym2-88": [mistysMagikarp88PlayDead0, mistysMagikarp88Leap1],
  "gym2-89": [mistysPoliwag89Bubbles0, mistysPoliwag89Amnesia1],
  "gym2-90": [mistysPsyduck90ESP0],
  "gym2-91": [mistysSeel91Frostbite0, mistysSeel91Mirage1],
  "gym2-92": [mistysStaryu92StarBoomerang0],
  "gym2-93": [sabrinasAbra93Pound0, sabrinasAbra93Synchronize1],
  "gym2-94": [sabrinasAbra94Psyscan0, sabrinasAbra94QuickAttack1],
  "gym2-95": [sabrinasDrowzee95EnergySupport0, sabrinasDrowzee95MindShock1],
  "gym2-96": [sabrinasGastly96Lick0, sabrinasGastly96FadeOut1],
  "gym2-97": [sabrinasGastly97SuffocatingGas0],
  "gym2-98": [sabrinasPorygon98SharpPoint0, sabrinasPorygon98BarrierAttack1],
  "gym2-99": [sabrinasPsyduck99Scratch0, sabrinasPsyduck99RandomESP1],
};
