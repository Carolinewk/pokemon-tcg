# Base Set effect implementation

The supported set is the 102-card English `base1` set in the bundled catalog. Its 69 Pokémon have 114 attacks, including 83 with effect text. The other cards comprise 26 Trainers and 7 Energy cards; six Pokémon also have Powers.

## File boundaries

| File | Responsibility |
| --- | --- |
| `lib/effects/base-set/attacks.ts` | One exported, named function for each of the 114 attacks; card-ID and attack-index registry |
| `lib/effects/base-set/powers.ts` | Five activated Powers and Machamp's passive Strikes Back, each in its own function |
| `lib/effects/base-set/trainers.ts` | One function per Trainer, with small helpers for moving cards and healing |
| `lib/effects/base-set/energy.ts` | Seven Energy providers, Buzzap's chosen type, Energy Burn, and Energy-unit payment |
| `lib/effects/context.ts` | Choice validation and shared attack operations: damage, conditions, protection, costs, and switching |
| `lib/effect-engine.ts` | Transaction boundaries, legality, dispatch, completion, and pending choices |
| `lib/game-core.ts` | General state operations, shuffling, turns, attachment movement, and Knock Outs |
| `lib/game-types.ts` | Serializable shared types; effect modules have no dependency on the UI |
| `lib/game.ts` | Public post reducer, setup, ordinary play, tabletop tools, and practice opponent |
| `components/effect-choice.tsx` | Card/target selection, ordered Pokédex choices, and visible effect labels |

Attack dispatch uses the printed card ID and attack position, not an attack-name whitelist. For example, Kakuna's Poisonpowder flips a coin; Ivysaur's and Tangela's Poisonpowder do not. New effects should use the same explicit registration pattern, with a behavioral test for their distinct rules.

## Resolution contract

1. An attack, Trainer, Power, or retreat declares an intent through the existing post stream.
2. The engine runs its effect on a disposable clone. A required selection produces a serializable `pending` choice with a resolution ID, a stable key, the selecting player, legal options, and selection limits.
3. All unrelated moves are blocked until the effect finishes. Only the designated player may answer. Invalid, duplicate, stale, and out-of-turn choices leave the previous state intact; concession remains available.
4. Each answer deterministically replays the same intent and earlier selections. No partial payment, movement, or random outcome is committed while choices remain. There is no cancel-and-reroll path.
5. The completed transaction commits once. Attacks then resolve Knock Outs and the turn boundary. Whirlwind checks damage before asking the defending player to switch; a Knock Out uses normal promotion instead.

All state needed for choices, temporary effects, Buzzap attachments, Leek Slap usage, and Mirror Move results is serializable and travels through VibiNet replay. The practice opponent answers choices belonging to it, including choices during another player's turn. New and old clients use separate room namespaces.

## Card-specific timing

- Attack discard costs count **cards**; attack and retreat payment count **Energy units**. A Double Colorless or Buzzap attachment is one card providing two units. Players select non-interchangeable Energy cards.
- Energy Burn is an activated Power affecting attached cards present when it is used. It persists through devolution and conditions until the turn ends. A new Energy attachment can be converted by activating the Power again.
- Damage Swap cannot Knock Out its receiving Pokémon. Rain Dance preserves the normal Energy attachment. Energy Trans preserves Buzzap's type. Buzzap discards Electrode's former attachments and evolution cards, awards an opposing Prize, and attaches Electrode as Energy.
- Damage prevention differs from prevention of all attack effects. PlusPower and Defender apply after Weakness and Resistance; Harden checks the resulting damage. Attached Trainers survive switching/evolution and expire at the printed turn boundary.
- Toxic's Poison deals 20 between turns; a later ordinary Poison replaces it. Switching and evolution clear conditions and attack effects. Leek Slap's use marker persists on the Bench and resets only when the Pokémon leaves play.
- Metronome uses the copying Pokémon's type, damage, and Energy; it skips required discard costs but retains Dream Eater's sleep prerequisite. Copying Metronome again leads to the eventual non-Metronome attack on that card rather than an unbounded selector loop. Mirror Move stores the final damage and defender effects of the previous attack, including damage received on the Bench, and does not reroll those results.
- Clefairy Doll has 10 HP in play, cannot retreat or receive the specified conditions, can be voluntarily discarded, and awards no Prize. Devolution retains damage and can cause a Knock Out. Multiple Knock Outs are resolved together.
- Computer Search does not reveal the chosen card. Pokémon Trader shows the trade, and Lass shows both hands, in a card-art dialog for both players; the names remain in the match log. Pokédex choices show only the top five cards to the acting player's interface and preserve the uninspected remainder.

## Rule sources and scope

The effect specification is the bundled [Pokémon TCG Data Base Set card text](https://github.com/PokemonTCG/pokemon-tcg-data/blob/master/cards/en/base1.json). Historical details were cross-checked against the archived official Wizards of the Coast FAQs and chat rulings collected in the [Pokémon Rulings Compendium](https://compendium.pokegym.net/compendium.html), particularly Energy Burn, Energy Trans, Buzzap, Strikes Back, Metronome, Mirror Move, Devolution Spray, PlusPower, and the distinction between trading a card and paying a discard cost.

The surrounding match rules remain the app's existing rules, as described in the README. This is not a conversion of setup, turn restrictions, Confusion, or tie handling to a particular historical tournament format. Automation of another set's Powers or special attacks is outside this implementation; mixed-set interactions that depend on them still require tabletop resolution. Hidden information continues to be concealed by the UI rather than by an authoritative server.

## Verification

`tests/base-set.mjs` checks the complete card registry, distinct attack functions, all 114 attack outputs, 83 effect-text damage cases on heads and tails, all status/recoil/discard families, all Trainers, all Powers, and all Energy. It exercises every attack both directly and through public posts, plus every Base Set attack copied by Metronome. Additional cases cover ordering, optional choices, restrictions, temporary effects, card conservation, simultaneous Knock Outs, and deterministic replay.

`tests/game.mjs` retains the existing setup, play, conservation, and complete-practice-game regressions. `tests/transport.mjs` checks independent VibiNet clients against the actual relay, including selection ownership and reconnect during a pending Whirlwind. These are behavioral and transport checks; they do not claim exhaustive coverage of every possible mixed-set interaction.
