import type { Card } from "../../game-types";
import { TrainerContext, BASE_TRAINERS } from "../base-set/trainers";
import * as B from "../base-set/trainers";
import * as O from "./operations";
import * as R from "./state";
import { clearAttackEffects } from "../../game-core";
import { onPlayPower } from "./powers";

export function pokeBall(c: TrainerContext) {
  if (O.flip(c.state)) O.search(c, c.player, O.pokemon);
}
export function mrFuji(c: TrainerContext) {
  O.leavePlay(
    c,
    c.choosePiece(
      "fuji",
      "Shuffle a Benched Pokémon into your deck",
      c.player.bench,
    ),
    "deck",
  );
}
export function energySearch(c: TrainerContext) {
  O.search(c, c.player, O.basicEnergy);
}
export function gambler(c: TrainerContext) {
  O.newHand(c, c.player, O.flip(c.state) ? 8 : 1);
}
export function recycle(c: TrainerContext) {
  if (O.flip(c.state)) O.recoverTop(c, c.player);
}
export function mysteriousFossil(c: TrainerContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  c.player.bench.push(O.piece(c.source, c.state.turn));
  c.sourceHandled = true;
}
export function hereComesTeamRocket(c: TrainerContext) {
  for (const p of c.state.players) p.publicPrizes = p.prizes.map((h) => h.uid);
}
export function rocketsSneakAttack(c: TrainerContext) {
  O.privateReveal(c, "Opponent’s hand", c.opponent.hand);
  const cards = c.opponent.hand.filter(
    (h) => c.catalog[h.card].supertype === "Trainer",
  );
  if (cards.length) {
    const chosen = c.chooseCards(
      "sneak-trainer",
      "Choose an opposing Trainer to shuffle away",
      cards,
    );
    O.moveCards(c.opponent.hand, c.opponent.deck, chosen);
    O.shuffle(c.state, c.opponent.deck);
  }
}
export function theBossWay(c: TrainerContext) {
  O.search(c, c.player, (x) => O.evolution(x) && x.name.includes("Dark"));
}
export function challenge(c: TrainerContext) {
  if (
    c.state.players.every((p) => p.bench.length >= R.narrowGym(c.state)) ||
    !O.optional(c, "challenge", "Accept the challenge?", c.opponent.id)
  ) {
    O.draw(c.state, c.player, 2);
    return;
  }
  for (const p of [c.opponent, c.player])
    if (p.bench.length < R.narrowGym(c.state))
      O.search(
        c,
        p,
        R.startingPokemon,
        5,
        "bench",
        undefined,
        `challenge-${p.id}`,
      );
}
export function digger(c: TrainerContext) {
  let p = c.player;
  while (O.flip(c.state)) p = p === c.player ? c.opponent : c.player;
  if (p.active) c.powerDamage(p.active, p.active, 10);
}
export function imposterOaksRevenge(c: TrainerContext) {
  c.discardHand(c.chooseCards("revenge-cost", "Discard a card", c.player.hand));
  O.newHand(c, c.opponent, 4);
}
export function nightlyGarbageRun(c: TrainerContext) {
  const hs = O.recover(
    c,
    c.player,
    (x) => O.pokemon(x) || O.basicEnergy(x),
    3,
    "deck",
  );
  if (hs.length) c.reveal("Nightly Garbage Run", hs);
}
export function goopGasAttack(c: TrainerContext) {
  c.state.powerLockUntil = c.state.turn + 1;
}
export function sleep(c: TrainerContext) {
  if (O.flip(c.state)) c.applyCondition(c.opponent.active!, "Asleep");
}
export function brock(c: TrainerContext) {
  for (const p of O.allPieces(c.player)) O.heal(p, 10);
}
export function erika(c: TrainerContext) {
  O.drawUpTo(c, c.player, 3, "erika-self");
  O.drawUpTo(c, c.opponent, 3, "erika-opponent");
}
export function ltSurge(c: TrainerContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  c.require(
    !R.switchingBlocked(c.state, c.player),
    "Your Active Pokémon cannot be switched.",
  );
  const [h] = c.chooseCards(
    "surge-basic",
    "Choose your new Active Pokémon",
    c.player.hand.filter((h) => R.startingPokemon(c.catalog[h.card])),
  );
  c.player.hand.splice(
    c.player.hand.findIndex((q) => q.uid === h.uid),
    1,
  );
  const old = c.player.active!;
  clearAttackEffects(old);
  c.player.bench.push(old);
  c.player.active = O.piece(h, c.state.turn);
  onPlayPower(c, c.player.active);
}
export function misty(c: TrainerContext) {
  c.discardHand(
    c.chooseCards("misty-cost", "Discard 2 other cards", c.player.hand, 2),
  );
  const r = (c.player.rules ||= {});
  if (r.mistyTurn !== c.state.turn) r.mistyBonus = 0;
  r.mistyTurn = c.state.turn;
  r.mistyBonus = (r.mistyBonus || 0) + 20;
}
export function rocketsTrap(c: TrainerContext) {
  if (O.flip(c.state)) {
    const n = O.numberChoice(
      c,
      "trap-count",
      "How many random cards to shuffle away?",
      Math.min(3, c.opponent.hand.length),
    );
    for (let i = 0; i < n; i++) {
      const h = c.opponent.hand.splice(
        Math.floor(c.random() * c.opponent.hand.length),
        1,
      )[0];
      c.opponent.deck.push(h);
    }
    O.shuffle(c.state, c.opponent.deck);
  }
}
export function charity(c: TrainerContext) {
  c.require(c.player.active, "Choose an Active Pokémon.");
  c.attach(c.player.active, c.state.turn);
}
export function blainesLastResort(c: TrainerContext) {
  c.require(
    !c.player.hand.length,
    "Your hand must contain only Blaine’s Last Resort.",
  );
  c.reveal("Blaine’s Last Resort", []);
  O.draw(c.state, c.player, 5);
}
export function brocksTrainingMethod(c: TrainerContext) {
  O.search(c, c.player, (x) => O.pokemon(x) && x.name.includes("Brock"));
}
export function erikasMaids(c: TrainerContext) {
  const trade = c.chooseCards(
    "maids-trade",
    "Trade 2 other cards",
    c.player.hand,
    2,
  );
  c.discardHand(trade);
  O.search(c, c.player, (x) => O.pokemon(x) && x.name.includes("Erika"), 2);
}
export function erikasPerfume(c: TrainerContext) {
  O.privateReveal(c, "Erika’s Perfume", c.opponent.hand);
  const hs = c.chooseCards(
    "perfume-basic",
    "Put opposing Basic Pokémon onto their Bench",
    c.opponent.hand.filter((h) => R.startingPokemon(c.catalog[h.card])),
    0,
    Math.max(0, R.narrowGym(c.state) - c.opponent.bench.length),
  );
  for (const h of hs) {
    c.opponent.hand.splice(
      c.opponent.hand.findIndex((q) => q.uid === h.uid),
      1,
    );
    const p = O.piece(h, c.state.turn);
    c.opponent.bench.push(p);
    if (c.state.stadium?.card === "gym2-119" && !O.flip(c.state))
      p.damage += 20;
  }
}
export function goodManners(c: TrainerContext) {
  c.require(
    !c.player.hand.some((h) => R.startingPokemon(c.catalog[h.card])),
    "You already have a Basic Pokémon in your hand.",
  );
  c.reveal("Good Manners", c.player.hand);
  O.search(c, c.player, R.startingPokemon);
}
export function ltSurgesTreaty(c: TrainerContext) {
  if (
    O.optional(c, "treaty", "Let both players take a Prize?", c.opponent.id)
  ) {
    for (const p of [c.opponent, c.player])
      if (p.prizes.length) {
        const i =
          O.numberChoice(
            c,
            `treaty-${p.id}`,
            "Choose a Prize",
            p.prizes.length,
            1,
            p.id,
          ) - 1;
        p.hand.push(...p.prizes.splice(i, 1));
      }
  } else O.draw(c.state, c.player, 1);
}
export function minionOfTeamRocket(c: TrainerContext) {
  const a = O.flip(c.state),
    b = O.flip(c.state);
  if (a && b) {
    if (c.opponent.bench.length)
      O.leavePlay(
        c,
        c.choosePiece(
          "minion",
          "Return an opposing Benched Pokémon",
          c.opponent.bench,
        ),
        "hand",
      );
  } else c.endsTurn = true;
}
export function mistysWrath(c: TrainerContext) {
  const top = c.player.deck.splice(0, 7);
  const hs = c.chooseCards(
    "wrath",
    "Choose 2 cards to keep",
    top,
    Math.min(2, top.length),
  );
  O.moveCards(top, c.player.hand, hs);
  c.player.discard.push(...top);
}
export function recall(c: TrainerContext) {
  c.require(c.player.active, "Choose an Active Pokémon.");
  O.putMark(c, c.player.active, "recall", 0);
}
export function sabrinasEsp(c: TrainerContext) {
  const p = c.choosePiece(
    "esp-target",
    "Attach Sabrina’s ESP",
    O.allPieces(c.player).filter((p) =>
      R.pokemonCard(c.state, p, c.catalog).name.includes("Sabrina"),
    ),
  );
  c.attach(p, c.state.turn);
}
export function secretMission(c: TrainerContext) {
  O.privateReveal(c, "Secret Mission", c.opponent.hand);
  const hs = c.chooseCards(
    "mission-discard",
    "Discard cards to draw replacements",
    c.player.hand,
    0,
    c.player.hand.length,
  );
  c.discardHand(hs);
  O.draw(c.state, c.player, hs.length);
}
export function ticklingMachine(c: TrainerContext) {
  if (O.flip(c.state)) {
    (c.opponent.aside ||= []).push({
      cards: c.opponent.hand,
      until: c.state.turn + 1,
    });
    c.opponent.hand = [];
  } else c.endsTurn = true;
}
export function blainesGamble(c: TrainerContext) {
  const hs = c.chooseCards(
    "gamble-cost",
    "Discard cards before flipping",
    c.player.hand,
    0,
    c.player.hand.length,
  );
  c.discardHand(hs);
  if (O.flip(c.state)) O.draw(c.state, c.player, 2 * hs.length);
}
export function energyFlow(c: TrainerContext) {
  for (const p of O.allPieces(c.player)) {
    const ix = c.chooseEnergy(
      `flow-${p.uid}`,
      "Return attached Energy to your hand",
      p,
      0,
      p.energy.length,
    );
    O.returnEnergy(c, p, ix);
  }
}
export function mistysDuel(c: TrainerContext) {
  O.newHand(c, O.flip(c.state) ? c.player : c.opponent, 5);
}
export function sabrinasGaze(c: TrainerContext) {
  for (const p of c.state.players) O.newHand(c, p, p.hand.length);
}
export function trashExchange(c: TrainerContext) {
  const n = c.player.discard.length;
  c.player.deck.push(...c.player.discard);
  c.player.discard = [];
  O.shuffle(c.state, c.player.deck);
  O.mill(c, c.player, n);
}
export function blaine(c: TrainerContext) {
  c.require(
    !c.player.energyPlayed,
    "Your normal Energy attachment was already used.",
  );
  (c.player.rules ||= {}).blaineTurn = c.state.turn;
}
export function giovanni(c: TrainerContext) {
  const p = c.choosePiece(
    "giovanni",
    "Choose a Pokémon with Giovanni in its name",
    O.allPieces(c.player).filter((p) =>
      R.pokemonCard(c.state, p, c.catalog).name.includes("Giovanni"),
    ),
  );
  (p.powerUsed ||= {}).Giovanni = c.state.turn;
}
export function koga(c: TrainerContext) {
  (c.player.rules ||= {}).kogaTurn = c.state.turn;
}
export function sabrina(c: TrainerContext) {
  const targets = O.allPieces(c.player).filter((p) =>
    R.pokemonCard(c.state, p, c.catalog).name.includes("Sabrina"),
  );
  c.require(
    targets.length >= 2,
    "You need 2 Pokémon with Sabrina in their names.",
  );
  const from = c.choosePiece(
    "sabrina-from",
    "Move Energy from…",
    targets.filter((p) => p.energy.length),
  );
  const to = c.choosePiece(
    "sabrina-to",
    "Move all that Energy to…",
    targets.filter((p) => p !== from),
  );
  for (let i = from.energy.length - 1; i >= 0; i--)
    O.moveEnergy(c, from, to, i);
}
export function brocksProtection(c: TrainerContext) {
  const p = c.choosePiece(
    "brock-protection",
    "Protect a Pokémon’s Energy",
    O.allPieces(c.player).filter((p) =>
      R.pokemonCard(c.state, p, c.catalog).name.includes("Brock"),
    ),
  );
  c.attach(p, O.forever);
}
export function erikasKindness(c: TrainerContext) {
  for (const p of O.board(c.state)) O.heal(p, 20);
}
export function giovannisLastResort(c: TrainerContext) {
  const p = c.choosePiece(
    "giovanni-resort",
    "Heal a Pokémon with Giovanni in its name",
    O.allPieces(c.player).filter((p) =>
      R.pokemonCard(c.state, p, c.catalog).name.includes("Giovanni"),
    ),
  );
  O.heal(p, p.damage);
  c.discardHand([...c.player.hand]);
}
export function surgeSecretPlan(c: TrainerContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  const [h] = c.chooseCards(
    "secret-plan",
    "Put a card face down on your Bench",
    c.player.hand,
  );
  c.player.hand.splice(
    c.player.hand.findIndex((q) => q.uid === h.uid),
    1,
  );
  const p = O.piece(h, c.state.turn);
  p.faceDown = true;
  c.player.bench.push(p);
}
export function mistysWish(c: TrainerContext) {
  const i =
    O.numberChoice(
      c,
      "wish-prize",
      "Choose a Prize to inspect",
      c.player.prizes.length,
      1,
    ) - 1;
  O.privateReveal(c, "Misty’s Wish", [c.player.prizes[i]]);
  if (
    O.optional(
      c,
      "wish-accept",
      "Allow the opponent to exchange a Prize with a hand card?",
      c.opponent.id,
    ) &&
    c.player.hand.length
  ) {
    const [h] = c.chooseCards(
      "wish-hand",
      "Choose a card to exchange",
      c.player.hand,
    );
    const j = c.player.hand.findIndex((q) => q.uid === h.uid);
    [c.player.hand[j], c.player.prizes[i]] = [
      c.player.prizes[i],
      c.player.hand[j],
    ];
  } else O.draw(c.state, c.player, 1);
}
export function blainesQuizTwo(c: TrainerContext) {
  const [h] = c.chooseCards(
    "quiz-card",
    "Choose a card to hide",
    c.player.hand,
  );
  const answer = c.choose(
    "quiz-type",
    "Guess the type of the hidden card",
    ["Energy", "Trainer", "Pokémon"].map((value) => ({ value, label: value })),
    1,
    1,
    c.opponent.id,
  )[0];
  c.reveal("Blaine’s Quiz #2", [h]);
  O.draw(
    c.state,
    answer === c.catalog[h.card].supertype ? c.opponent : c.player,
    2,
  );
}
export function blainesQuizThree(c: TrainerContext) {
  const [h] = c.chooseCards(
    "quiz-card",
    "Choose a Pokémon to hide",
    c.player.hand.filter(
      (h) =>
        O.pokemon(c.catalog[h.card]) && c.catalog[h.card].attacks.length > 0,
    ),
  );
  const card = c.catalog[h.card];
  const name = c.choose(
    "quiz-attack",
    "Which attack name will you reveal?",
    card.attacks.map((a) => ({ value: a.name, label: a.name })),
  )[0];
  const names = [
    ...new Set(
      Object.values(c.catalog)
        .filter((x) => R.startingPokemon(x) || O.evolution(x))
        .map((x) => x.name),
    ),
  ];
  const answer = c.choose(
    "quiz-name",
    `Which Pokémon has the attack “${name}”?`,
    names.map((value) => ({ value, label: value })),
    1,
    1,
    c.opponent.id,
  )[0];
  c.reveal("Blaine’s Quiz #3", [h]);
  O.draw(c.state, answer === card.name ? c.opponent : c.player, 3);
}
export function blainesQuizOne(c: TrainerContext) {
  const [h] = c.chooseCards(
    "quiz-card",
    "Choose a Pokémon whose printed length can be read",
    c.player.hand.filter((h) => O.pokemon(c.catalog[h.card])),
  );
  const card = c.catalog[h.card];
  const length = c.chooseText(
    "quiz-length",
    "Enter the length printed on this card (feet and inches)",
    c.player.id,
    h.card,
  );
  const guess = c.chooseText(
    "quiz-guess",
    `Guess ${card.name}’s printed length (feet and inches)`,
    c.opponent.id,
  );
  c.reveal("Blaine’s Quiz #1", [h]);
  const normalize = (s: string) => s.replace(/[^0-9]/g, "");
  O.draw(
    c.state,
    normalize(length) === normalize(guess) ? c.opponent : c.player,
    2,
  );
}
export function kogasNinjaTrick(c: TrainerContext) {
  c.require(
    c.player.active &&
      R.pokemonCard(c.state, c.player.active, c.catalog).name.includes("Koga"),
    "Choose an Active Pokémon with Koga in its name.",
  );
  c.attach(c.player.active, O.forever);
}
export function masterBall(c: TrainerContext) {
  const hs = c.chooseCards(
    "master-ball",
    "Choose a Pokémon among the top 7 cards",
    c.player.deck.slice(0, 7).filter((h) => O.pokemon(c.catalog[h.card])),
    0,
    1,
  );
  if (hs.length) c.reveal("Master Ball", hs);
  O.moveCards(c.player.deck, c.player.hand, hs);
  O.shuffle(c.state, c.player.deck);
}
export function maxRevive(c: TrainerContext) {
  c.require(
    c.player.bench.length < R.narrowGym(c.state),
    "Your Bench is full.",
  );
  c.require(
    c.player.discard.some((h) => R.startingPokemon(c.catalog[h.card])),
    "No Basic Pokémon to revive.",
  );
  c.discardHand(
    c.chooseCards(
      "max-revive-cost",
      "Discard 2 Energy cards",
      c.player.hand.filter((h) => c.catalog[h.card].supertype === "Energy"),
      2,
    ),
  );
  const [h] = c.chooseCards(
    "max-revive",
    "Choose a Basic Pokémon",
    c.player.discard.filter((h) => R.startingPokemon(c.catalog[h.card])),
  );
  c.player.discard.splice(
    c.player.discard.findIndex((q) => q.uid === h.uid),
    1,
  );
  c.player.bench.push(O.piece(h, c.state.turn));
}
export function mistysTears(c: TrainerContext) {
  c.discardHand(c.chooseCards("tears-cost", "Discard a card", c.player.hand));
  O.search(c, c.player, O.namedEnergy("Water"), 2);
}
export function rocketsSecretExperiment(c: TrainerContext) {
  if (O.flip(c.state))
    O.search(
      c,
      c.player,
      () => true,
      1,
      "hand",
      undefined,
      "experiment",
      false,
    );
  else O.lockTrainers(c, c.player, 2);
}
export function psychicControl(c: TrainerContext) {
  if (!O.flip(c.state)) return;
  const cards = c.opponent.discard.filter(
    (h) =>
      !!trainerFor(c.catalog[h.card]) &&
      !putsInPlay(c.catalog[h.card]) &&
      h.card !== "gym2-121",
  );
  const [h] = c.chooseCards(
    "psychic-control",
    "Choose a discarded Trainer to use",
    cards,
    0,
    1,
  );
  if (!h) return;
  const ctx = new TrainerContext(c.state, c.catalog, c.player, c.answers, h);
  ctx.choicePrefix = "psychic-control:";
  trainerFor(c.catalog[h.card])!(ctx);
  c.endsTurn = ctx.endsTurn;
}
export function fervor(c: TrainerContext) {
  const hs = c.player.deck.splice(0, 3);
  c.reveal("Fervor", hs);
  for (const h of hs)
    (O.namedEnergy("Fire")(c.catalog[h.card])
      ? c.player.hand
      : c.player.discard
    ).push(h);
}
export function transparentWalls(c: TrainerContext) {
  (c.player.rules ||= {}).benchGuardUntil = c.state.turn + 1;
}
export function warpPoint(c: TrainerContext) {
  if (c.opponent.bench.length)
    O.switchPokemon(
      c,
      c.opponent,
      c.choosePiece(
        "warp-opponent",
        "Choose your new Active Pokémon",
        c.opponent.bench,
        c.opponent.id,
      ),
    );
  if (c.player.bench.length)
    O.switchPokemon(
      c,
      c.player,
      c.choosePiece(
        "warp-self",
        "Choose your new Active Pokémon",
        c.player.bench,
      ),
    );
}
export function arcadeGame(c: TrainerContext) {
  O.shuffle(c.state, c.player.deck);
  const hs = c.player.deck.slice(0, 3);
  c.reveal("Arcade Game", hs);
  const name = hs
    .map((h) => c.catalog[h.card].name)
    .find(
      (name) => hs.filter((h) => c.catalog[h.card].name === name).length >= 2,
    );
  if (name)
    O.moveCards(
      c.player.deck,
      c.player.hand,
      hs.filter((h) => c.catalog[h.card].name === name),
    );
  O.shuffle(c.state, c.player.deck);
}
export function energyCharge(c: TrainerContext) {
  if (O.flip(c.state))
    O.recover(c, c.player, (x) => x.supertype === "Energy", 2, "deck");
}
export function mary(c: TrainerContext) {
  O.draw(c.state, c.player, 2);
  const hs = c.chooseCards(
    "mary-return",
    "Shuffle 2 hand cards into your deck",
    c.player.hand,
    Math.min(2, c.player.hand.length),
  );
  O.moveCards(c.player.hand, c.player.deck, hs);
  O.shuffle(c.state, c.player.deck);
}
export function pokeGear(c: TrainerContext) {
  const hs = c.chooseCards(
    "pokegear",
    "Choose a Trainer among the top 7 cards",
    c.player.deck
      .slice(0, 7)
      .filter((h) => c.catalog[h.card].supertype === "Trainer"),
    0,
    1,
  );
  if (hs.length) c.reveal("PokéGear", hs);
  O.moveCards(c.player.deck, c.player.hand, hs);
  O.shuffle(c.state, c.player.deck);
  O.lockTrainers(c, c.player, 0);
}
export function superEnergyRetrieval(c: TrainerContext) {
  const pool = c.player.discard.filter((h) => O.basicEnergy(c.catalog[h.card]));
  c.require(pool.length, "No basic Energy to retrieve.");
  const trade = c.chooseCards(
    "super-retrieval-trade",
    "Trade 2 other cards",
    c.player.hand,
    2,
  );
  const chosen = c.chooseCards(
    "super-retrieval",
    "Retrieve basic Energy cards",
    pool,
    Math.min(4, pool.length),
  );
  c.discardHand(trade);
  O.moveCards(c.player.discard, c.player.hand, chosen);
}
export function timeCapsule(c: TrainerContext) {
  for (const p of [c.opponent, c.player]) {
    const pool = p.discard.filter(
      (h) => O.pokemon(c.catalog[h.card]) || O.basicEnergy(c.catalog[h.card]),
    );
    if (
      pool.length &&
      O.optional(c, `capsule-use-${p.id}`, "Use Time Capsule?", p.id)
    ) {
      const n = Math.min(5, pool.length);
      const hs = O.forPlayer(c, p).chooseCards(
        `capsule-${p.id}`,
        "Choose cards to shuffle back",
        pool,
        n,
      );
      O.moveCards(p.discard, p.deck, hs);
      O.shuffle(c.state, p.deck);
    }
  }
  O.lockTrainers(c, c.player, 0);
}
export function billsTeleporter(c: TrainerContext) {
  if (O.flip(c.state)) O.draw(c.state, c.player, 4);
}
export function cardFlipGame(c: TrainerContext) {
  const pool = c.opponent.prizes.filter(
    (h) => !c.opponent.publicPrizes?.includes(h.uid),
  );
  c.require(pool.length, "There are no face-down opposing Prizes.");
  const uid = c.choose(
    "flip-prize",
    "Choose an opposing Prize",
    pool.map((h) => ({
      value: h.uid,
      label: `Prize ${c.opponent.prizes.indexOf(h) + 1}`,
    })),
  )[0];
  const guess = c.choose(
    "flip-guess",
    "Guess the card type",
    ["Energy", "Trainer", "Pokémon"].map((value) => ({ value, label: value })),
  )[0];
  const h = pool.find((h) => h.uid === uid)!;
  (c.opponent.publicPrizes ||= []).push(uid);
  c.reveal("Card-Flip Game", [h]);
  if (guess === c.catalog[h.card].supertype) O.draw(c.state, c.player, 2);
}
export function newPokedex(c: TrainerContext) {
  O.shuffle(c.state, c.player.deck);
  O.reorder(c, c.player, 5);
}
export function professorElm(c: TrainerContext) {
  O.newHand(c, c.player, 7);
  O.lockTrainers(c, c.player, 0);
}
export function superScoopUp(c: TrainerContext) {
  if (O.flip(c.state))
    O.leavePlay(
      c,
      c.choosePiece(
        "super-scoop",
        "Return a Pokémon and its attachments to your hand",
        O.allPieces(c.player),
      ),
      "hand",
    );
}
export function doubleGust(c: TrainerContext) {
  if (c.player.bench.length)
    O.switchPokemon(
      c,
      c.player,
      c.choosePiece(
        "gust-self",
        "Choose the opponent’s new Active Pokémon",
        c.player.bench,
        c.opponent.id,
      ),
    );
  if (c.opponent.bench.length)
    O.switchPokemon(
      c,
      c.opponent,
      c.choosePiece(
        "gust-other",
        "Choose the opponent’s new Active Pokémon",
        c.opponent.bench,
      ),
    );
}
export function mooMooMilk(c: TrainerContext) {
  const p = c.choosePiece(
    "milk",
    "Choose a Pokémon to heal",
    O.allPieces(c.player),
  );
  const n = Number(O.flip(c.state)) + Number(O.flip(c.state));
  O.heal(p, 20 * n);
}
export function pokemonMarch(c: TrainerContext) {
  for (const p of [c.opponent, c.player])
    if (p.bench.length < R.narrowGym(c.state))
      O.search(c, p, R.startingPokemon, 1, "bench", undefined, `march-${p.id}`);
}
export function superRod(c: TrainerContext) {
  const filter = O.flip(c.state) ? O.evolution : R.startingPokemon;
  O.recover(c, c.player, filter, 1, "hand", undefined, "rod", true);
}

export function stadium(c: TrainerContext) {
  c.require(
    c.state.stadium?.card !== c.source.card,
    "That Stadium is already in play.",
  );
  O.discardStadium(c);
  c.state.stadium = { ...c.source, owner: c.player.id };
  c.sourceHandled = true;
}
export function narrowGym(c: TrainerContext) {
  stadium(c);
  for (const p of [c.opponent, c.player])
    if (p.bench.length > 4)
      O.leavePlay(
        c,
        c.choosePiece(
          `narrow-${p.id}`,
          "Return a Benched Pokémon to your hand",
          p.bench,
          p.id,
        ),
        "hand",
      );
}
export function noRemovalGym(c: TrainerContext) {
  stadium(c);
}
export function rocketsTrainingGym(c: TrainerContext) {
  stadium(c);
}
export function celadonCityGym(c: TrainerContext) {
  stadium(c);
}
export function ceruleanCityGym(c: TrainerContext) {
  stadium(c);
}
export function pewterCityGym(c: TrainerContext) {
  stadium(c);
}
export function vermilionCityGym(c: TrainerContext) {
  stadium(c);
}
export function chaosGym(c: TrainerContext) {
  stadium(c);
}
export function resistanceGym(c: TrainerContext) {
  stadium(c);
}
export function cinnabarCityGym(c: TrainerContext) {
  stadium(c);
}
export function fuchsiaCityGym(c: TrainerContext) {
  stadium(c);
}
export function rocketsMinefieldGym(c: TrainerContext) {
  stadium(c);
}
export function saffronCityGym(c: TrainerContext) {
  stadium(c);
}
export function viridianCityGym(c: TrainerContext) {
  stadium(c);
}
export function ecogym(c: TrainerContext) {
  stadium(c);
}
export function sproutTower(c: TrainerContext) {
  stadium(c);
}
export function tool(c: TrainerContext) {
  const p = c.choosePiece(
    "tool",
    "Attach a Pokémon Tool",
    O.allPieces(c.player).filter((p) => !p.tools.length),
  );
  p.tools.push(c.source.card);
  c.sourceHandled = true;
}
export function focusBand(c: TrainerContext) {
  tool(c);
}
export function berry(c: TrainerContext) {
  tool(c);
}
export function goldBerry(c: TrainerContext) {
  tool(c);
}
export function miracleBerry(c: TrainerContext) {
  tool(c);
}

const registry: Record<string, (c: TrainerContext) => void> = {
  "base2-64": pokeBall,
  "base3-58": mrFuji,
  "base3-59": energySearch,
  "base3-60": gambler,
  "base3-61": recycle,
  "base3-62": mysteriousFossil,
  "base5-15": hereComesTeamRocket,
  "base5-71": hereComesTeamRocket,
  "base5-16": rocketsSneakAttack,
  "base5-72": rocketsSneakAttack,
  "base5-73": theBossWay,
  "base5-74": challenge,
  "base5-75": digger,
  "base5-76": imposterOaksRevenge,
  "base5-77": nightlyGarbageRun,
  "base5-78": goopGasAttack,
  "base5-79": sleep,
  "gym1-15": brock,
  "gym1-98": brock,
  "gym1-16": erika,
  "gym1-100": erika,
  "gym1-17": ltSurge,
  "gym1-101": ltSurge,
  "gym1-18": misty,
  "gym1-102": misty,
  "gym1-19": rocketsTrap,
  "gym1-97": blainesQuizOne,
  "gym1-99": charity,
  "gym1-103": noRemovalGym,
  "gym1-104": rocketsTrainingGym,
  "gym1-105": blainesLastResort,
  "gym1-106": brocksTrainingMethod,
  "gym1-107": celadonCityGym,
  "gym1-108": ceruleanCityGym,
  "gym1-109": erikasMaids,
  "gym1-110": erikasPerfume,
  "gym1-111": goodManners,
  "gym1-112": ltSurgesTreaty,
  "gym1-113": minionOfTeamRocket,
  "gym1-114": mistysWrath,
  "gym1-115": pewterCityGym,
  "gym1-116": recall,
  "gym1-117": sabrinasEsp,
  "gym1-118": secretMission,
  "gym1-119": ticklingMachine,
  "gym1-120": vermilionCityGym,
  "gym1-121": blainesGamble,
  "gym1-122": energyFlow,
  "gym1-123": mistysDuel,
  "gym1-124": narrowGym,
  "gym1-125": sabrinasGaze,
  "gym1-126": trashExchange,
  "gym2-17": blaine,
  "gym2-100": blaine,
  "gym2-18": giovanni,
  "gym2-104": giovanni,
  "gym2-19": koga,
  "gym2-106": koga,
  "gym2-20": sabrina,
  "gym2-110": sabrina,
  "gym2-101": brocksProtection,
  "gym2-102": chaosGym,
  "gym2-103": erikasKindness,
  "gym2-105": giovannisLastResort,
  "gym2-107": surgeSecretPlan,
  "gym2-108": mistysWish,
  "gym2-109": resistanceGym,
  "gym2-111": blainesQuizTwo,
  "gym2-112": blainesQuizThree,
  "gym2-113": cinnabarCityGym,
  "gym2-114": fuchsiaCityGym,
  "gym2-115": kogasNinjaTrick,
  "gym2-116": masterBall,
  "gym2-117": maxRevive,
  "gym2-118": mistysTears,
  "gym2-119": rocketsMinefieldGym,
  "gym2-120": rocketsSecretExperiment,
  "gym2-121": psychicControl,
  "gym2-122": saffronCityGym,
  "gym2-123": viridianCityGym,
  "gym2-124": fervor,
  "gym2-125": transparentWalls,
  "gym2-126": warpPoint,
  "neo1-83": arcadeGame,
  "neo1-84": ecogym,
  "neo1-85": energyCharge,
  "neo1-86": focusBand,
  "neo1-87": mary,
  "neo1-88": pokeGear,
  "neo1-89": superEnergyRetrieval,
  "neo1-90": timeCapsule,
  "neo1-91": billsTeleporter,
  "neo1-92": cardFlipGame,
  "neo1-93": goldBerry,
  "neo1-94": miracleBerry,
  "neo1-95": newPokedex,
  "neo1-96": professorElm,
  "neo1-97": sproutTower,
  "neo1-98": superScoopUp,
  "neo1-99": berry,
  "neo1-100": doubleGust,
  "neo1-101": mooMooMilk,
  "neo1-102": pokemonMarch,
  "neo1-103": superRod,
};
for (const [id, base] of Object.entries({
  "base4-101": "base1-71",
  "base4-102": "base1-73",
  "base4-103": "base1-74",
  "base4-104": "base1-75",
  "base4-105": "base1-76",
  "base4-106": "base1-77",
  "base4-107": "base1-78",
  "base4-108": "base1-79",
  "base4-109": "base1-80",
  "base4-110": "base1-81",
  "base4-111": "base1-82",
  "base4-112": "base1-83",
  "base4-113": "base1-84",
  "base4-114": "base1-85",
  "base4-115": "base1-87",
  "base4-116": "base1-88",
  "base4-117": "base1-90",
  "base4-118": "base1-91",
  "base4-119": "base1-92",
  "base4-120": "base1-93",
  "base4-122": "base1-94",
  "base4-123": "base1-95",
}))
  registry[id] = BASE_TRAINERS[base];
registry["base4-121"] = pokeBall;
export const TRAINERS = { ...BASE_TRAINERS, ...registry };
export function trainerFor(card: Card) {
  return TRAINERS[card.id] || B.trainerHandler(card);
}
export function putsInPlay(card: Card) {
  return (
    card.subtypes.some((t) => ["Stadium", "Pokémon Tool"].includes(t)) ||
    [
      "base1-70",
      "base3-62",
      "base1-80",
      "base1-84",
      "base4-109",
      "base4-113",
      "gym1-99",
      "gym1-117",
      "gym2-101",
      "gym2-115",
    ].includes(card.id)
  );
}
