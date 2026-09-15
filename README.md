# PokéTable

A tactile, casual Pokémon TCG table built with React, Vinext, and **VibiNet 0.1.1**. The opening screen is an interactive practice match, not a lobby mockup.

## Play

- Inspect a card by clicking it. Drag Basic Pokémon to your Bench and Energy onto your Pokémon, or use the buttons in Card details. Touch devices have a keyboard-accessible card sheet.
- Attach one Energy per turn, evolve Pokémon, play Trainers, retreat, attack, and take Prizes. A practice opponent plays complete matches.
- Select **Play with a friend**, choose a 60-card deck, create a room, and share the link or code. Your friend needs access to the hosting site. The first two player identities occupy the seats; a refresh in the same tab reconnects that identity.
- **Card library** contains a bundled snapshot of all **20,444 English cards in 174 sets** available from [Pokémon TCG Data](https://github.com/PokemonTCG/pokemon-tcg-data), downloaded September 14, 2026. It is not every language, physical printing, or subsequently released card. Starter artwork is local; other card art loads from the dataset's image URLs.
- Build and import/export 60-card decks. Custom decks and sound/name preferences are explicitly saved on the current device.

## Rules scope

All **816 cards in the eight English main expansions from Base Set through Neo Genesis** have registered effects: **1,053 attacks, 96 Pokémon Power entries, and 153 Trainers**, including reprints. The sets are Base Set, Jungle, Fossil, Base Set 2, Team Rocket, Gym Heroes, Gym Challenge, and Neo Genesis. Attack dispatch uses a separate named function for each printed card and attack position. Activated Powers, passive effects, Trainers, special Energy, Stadiums, and Pokémon Tools have named handlers. See [the classic effects guide](docs/classic-effects.md) and [the original Base Set guide](docs/base-set-effects.md).

Card effects ask the appropriate player to select targets, Energy, discards, search results, deck order, and responses. Copied attacks and Powers appear in Card details; hidden-card reveals are shown only to their designated viewer. Blaine’s Quiz #1 asks its player to read and enter the printed length from the card image because that field is absent from the catalog.

The surrounding match rules remain the existing assisted tabletop rules: deterministic setup and turns, evolution timing, one normal Energy attachment, Supporter limits, typed attack costs, weakness/resistance, retreat, conditions, Knock Outs, multi-Prize Pokémon, prizes, deck-out, and concession. This update does not switch the entire table to the historical 1999 ruleset. For example, the first player still cannot attack on their first turn, Confusion deals 30 damage on tails, retreat is limited to once per turn, and Prizes are taken automatically.

Special effects outside those eight expansions, including promotional sets, and interactions requiring those effects still use Table tools. Plain attacks without effect text also work automatically, and the four previously supported Trainer reprints remain supported. The card catalog is broader than the automated rules. Practice is intended for the included starter decks; the bot resolves its effect choices but does not interpret arbitrary printed text.

Rooms are for trusted casual play. Both clients replay the same inputs, so hidden card identities are concealed by the interface, **not encrypted or enforced by an authoritative game server**. There is no competitive anti-cheat. Sharing a room gives access to its input history.

## Multiplayer architecture

`lib/game.ts` is a pure, immutable reducer. All random outcomes use a seeded integer PRNG. `lib/network.ts` creates a real `VibiNet.game<GameState, Post>` with a packed input schema, fixed ticks, rollback snapshots, and late-join replay.

The default VibiNet WebSocket endpoint did not complete a connection in this development environment. The game therefore uses VibiNet's supported `client` option with `lib/http-client.ts`, a same-origin HTTP relay backed by Cloudflare D1. VibiNet still computes, orders, predicts, rolls back, and replays game states. The relay only stores inputs with gapless per-room indexes and server timestamps. Idempotent write retries preserve ordering after interrupted requests. Passing `true` as `connectTable`'s fourth argument opts into VibiNet's official WebSocket relay for a separately namespaced, consistently configured deployment.

Room moves survive reconnects and deployments in D1. New matches use the `poketable-v4-neo-genesis-20444` namespace so clients with the previous rules cannot silently disagree in the same room. The relay continues to serve the previous namespace for already-open older clients. Update both `lib/network.ts` and `app/api/relay/route.ts` when incompatible rules or card data change. A room is capped at 10,001 input posts.

## Development

Requires Node 22.13+.

```sh
npm ci
npm run dev
```

Open http://localhost:5174. The development server requires port 5174 to be available.

For local multiplayer, build and initialize the local D1 database once:

```sh
npm run build
node --import ./scripts/wrangler-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_easy_purifiers.sql
```

Do not reapply an already applied migration. Apply `drizzle/` migrations to the production D1 database as part of deploying the Worker.

## Verification

```sh
npm run typecheck
npm test
npm run lint:game
POKETABLE_TEST_ORIGIN=http://localhost:5174 npm run test:multiplayer
npm run build
```

The tests cover all 1,053 registered attacks (including heads and tails), each Trainer and activated/on-play Power, special Energy, Metronome copying every Base Set attack, effect timing and protection, simultaneous Knock Outs, valid and invalid choices, and conservation of every physical card. Targeted cases cover Ditto, Shapeshift, Baby Pokémon, Char, Wild Growth, Slowking, Chaos Gym, Sabrina’s ESP, and other distinct interactions. The existing 100 seeded openings and 24 complete simulated matches remain covered. The multiplayer test runs independent VibiNet clients against the HTTP/D1 relay and checks Computer Search, an opponent's Whirlwind choice, both players’ Double Gust choices, Rainbow Energy, reconnect during pending effects, exact replay, and rejection of a third seat.

Refresh the data snapshot with `npm run cards:sync`. This downloads the upstream public JSON dataset and starter art; review the count and update the rules/catalog namespace before publishing an incompatible snapshot.

Unofficial fan project. Pokémon card artwork and names belong to their respective rights holders, including Pokémon, Nintendo, Creatures, and GAME FREAK. VibiNet is MIT licensed.
