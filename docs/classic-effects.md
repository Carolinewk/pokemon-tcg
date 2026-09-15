# Effects through Neo Genesis

The automated registry covers these English main expansions from the bundled catalog. Counts include reprints; an attack is a printed card ID plus an attack position.

| Expansion     | Catalog ID | Cards | Attacks |
| ------------- | ---------- | ----: | ------: |
| Base Set      | `base1`    |   102 |     114 |
| Jungle        | `base2`    |    64 |     113 |
| Fossil        | `base3`    |    62 |      90 |
| Base Set 2    | `base4`    |   130 |     172 |
| Team Rocket   | `base5`    |    83 |     110 |
| Gym Heroes    | `gym1`     |   132 |     153 |
| Gym Challenge | `gym2`     |   132 |     163 |
| Neo Genesis   | `neo1`     |   111 |     138 |
| Total         |            |   816 |   1,053 |

There are also 96 printed Pokémon Power entries and 153 Trainer cards. Promotional sets are separate from these eight expansions. The broader card library remains available, with Table tools for unsupported effects.

## Module boundaries

Each expansion has an `attacks.ts` module under `lib/effects/`, with a separate named function for each attack and an explicit registry. Identical reprints may call the original named function; attacks with the same name but different printed effects have their own implementations. Runtime dispatch does not interpret arbitrary English card text.

The shared `lib/effects/classic/` modules separate the remaining rules:

| Module            | Responsibility                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `state.ts`        | Derived card identity, HP, attack lists, Power availability, retreat costs, linked restrictions |
| `operations.ts`   | Targeted card movement, search/reveal, Energy movement, copying, evolution, and effect markers  |
| `powers.ts`       | Named activated and on-play Powers, passive registry, reprint aliases                           |
| `damage.ts`       | Damage modifiers, immunity, reactions, and attack Knock Out prevention                          |
| `trainers.ts`     | Named Trainer, Stadium, and Pokémon Tool handlers                                               |
| `interception.ts` | Trainer discard costs, Slowking's Mind Games, and Chaos Gym                                     |
| `energy.ts`       | Effects triggered by attaching special Energy from the hand                                     |
| `lifecycle.ts`    | Tools, Char, Darkness Energy, Stadium actions, continuous-state cleanup, and turn boundaries    |
| `scope.ts`        | Supported expansion IDs                                                                         |

The original [Base Set guide](base-set-effects.md) describes the replayable transaction contract. Every choice has a stable key and an owning player. VibiNet clients replay the same serializable intent, answers, and seeded random outcomes. Invalid choices cannot partially spend cards. The `poketable-v4-neo-genesis-20444` room namespace separates this rules version from older clients.

## Interactions represented in game state

- Baby Pokémon can start the game and evolve into their matching Basic Pokémon. The defending Baby coin flip happens before attack costs.
- Ditto keeps its physical card while deriving its opponent's printed stats, attacks, and Powers. Its Energy remains one attachment per physical card. Brock's Ninetales keeps Shapeshift and its attached Evolution cards separately; its most recent form supplies stats and attacks. Venomoth's shifted type persists until it evolves or leaves play.
- Mean Look and Jaw Clamp track their source Pokémon and its generation. Switching or evolution clears the appropriate attack effects. Char has its own marker, persists on the Bench, and clears on evolution.
- Energy payment distinguishes physical cards from units. Wild Growth makes a Grass Energy card provide two Grass units, including converted cards; Rainbow can supply those Grass units or one other type, without spending the same card twice. Energy Burn, Photosynthesis, and Buzzap retain their own conversion rules.
- Metal and Darkness Energy modify damage at their appropriate stages. Damage, placed counters, reactions, and Knock Out prevention are separate operations. Focus Band, Fortitude, Berries, and between-turn damage resolve at their specified boundaries.
- Slowking and Chaos Gym resolve after required discard costs. Their choices can belong to the opponent. Stolen Trainers preserve the original card's ownership when discarded or returned to a deck.
- Sabrina's ESP replays the attack with a second set of coin flips and separately keyed subsequent choices. Mirror Move records resolved damage and effects instead of rerolling the original attack.
- Search results and revealed cards retain their recipient. Clairvoyance, public Prizes, and Lt. Surge's Secret Plan have explicit presentation state. Copied attacks and activated Powers appear in the normal card controls.

## Sources and boundaries

Printed specifications come from the bundled [Pokémon TCG Data](https://github.com/PokemonTCG/pokemon-tcg-data) snapshot, including the [Neo Genesis card records](https://github.com/PokemonTCG/pokemon-tcg-data/blob/master/cards/en/neo1.json). Historical details were checked against the official Wizards of the Coast FAQs and chat rulings archived in the [Pokémon Rulings Compendium](https://compendium.pokegym.net/compendium.html).

Known transcription corrections are implemented in the effect functions: Minefield Gym places two damage counters on heads, Blaine's Charizard discards Fire Energy, and Dark Vileplume's Petal Whirlwind flips three coins. Blaine's Quiz #1 uses the printed length on the card image; the owner enters that value because length is absent from the data snapshot. Misty's Duel uses the coin-flip alternative printed on the card.

This expansion preserves the existing assisted match format described in the README: first-turn attack restriction, 30-damage Confusion, one retreat per turn, and automatic Prize taking. It does not convert the whole match to a historical tournament format. Hidden information is concealed in the UI, not encrypted against other room participants.

## Verification

`tests/classic.mjs` checks registry coverage, executes every additional attack on heads and tails, and exercises every additional attack, Trainer, activated Power, and on-play Power through public game actions. It checks finite outcomes, legal choice ownership, completion, and conservation of physical cards. Targeted assertions cover the distinct interactions above; these are not an exhaustive proof of every possible deck combination.

The Base Set and general game suites remain in `npm test`. `tests/transport.mjs` uses independent VibiNet clients against the HTTP/D1 relay, including reconnect during Whirlwind and Double Gust, changing choice ownership, Rainbow Energy, exact replay, and refusal of a third player seat.
