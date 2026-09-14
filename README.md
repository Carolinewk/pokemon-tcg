# PokéTable

A tactile, casual Pokémon TCG table built with React, Vinext, and **VibiNet 0.1.1**. The opening screen is an interactive practice match, not a lobby mockup.

## Play

- Inspect a card by clicking it. Drag Basic Pokémon to your Bench and Energy onto your Pokémon, or use the buttons in Card details. Touch devices have a keyboard-accessible card sheet.
- Attach one Energy per turn, evolve Pokémon, play Trainers, retreat, attack, and take Prizes. A practice opponent plays complete matches.
- Select **Play with a friend**, choose a 60-card deck, create a room, and share the link or code. Your friend needs access to the hosting site. The first two player identities occupy the seats; a refresh in the same tab reconnects that identity.
- **Card library** contains a bundled snapshot of all **20,444 English cards in 174 sets** available from [Pokémon TCG Data](https://github.com/PokemonTCG/pokemon-tcg-data), downloaded September 14, 2026. It is not every language, physical printing, or subsequently released card. Starter artwork is local; other card art loads from the dataset's image URLs.
- Build and import/export 60-card decks. Custom decks and sound/name preferences are explicitly saved on the current device.

## Rules scope

This is an **assisted tabletop**, not a complete tournament rules engine. The core implements deterministic shuffling and mulligans, opening hands, setup, turns, Basic Pokémon and evolution timing, one Energy attachment, Supporter limits, typed attack costs, weakness/resistance, retreat, conditions, Knock Outs, multi-Prize Pokémon, prizes, deck-out, and concession. The classic starter attacks and Bill, Professor Oak, Switch, and Pokémon Center are automated.

Complex printed effects, unusual special Energy, abilities, era-specific rules, and nonstandard card interactions are resolved by the players using Table tools. These tools expose coin flips, damage/healing, conditions, attachment removal, swapping Active Pokémon, drawing, searching/moving between card zones, shuffling, and resolving Knock Outs. Printed card text is always available for inspection. Practice is intended for the included starter decks; the bot does not interpret arbitrary card text.

Rooms are for trusted casual play. Both clients replay the same inputs, so hidden card identities are concealed by the interface, **not encrypted or enforced by an authoritative game server**. There is no competitive anti-cheat. Sharing a room gives access to its input history.

## Multiplayer architecture

`lib/game.ts` is a pure, immutable reducer. All random outcomes use a seeded integer PRNG. `lib/network.ts` creates a real `VibiNet.game<GameState, Post>` with a packed input schema, fixed ticks, rollback snapshots, and late-join replay.

The default VibiNet WebSocket endpoint did not complete a connection in this development environment. The game therefore uses VibiNet's supported `client` option with `lib/http-client.ts`, a same-origin HTTP relay backed by Cloudflare D1. VibiNet still computes, orders, predicts, rolls back, and replays game states. The relay only stores inputs with gapless per-room indexes and server timestamps. Idempotent write retries preserve ordering after interrupted requests. Passing `true` as `connectTable`'s fourth argument opts into VibiNet's official WebSocket relay for a separately namespaced, consistently configured deployment.

Room moves survive reconnects and deployments in D1. The `poketable-v2-20444` namespace freezes the rules/catalog version; change it in both `lib/network.ts` and `app/api/relay/route.ts` when incompatible rules or card data change. A room is capped at 10,001 input posts.

## Development

Requires Node 22.13+.

```sh
npm ci
npm run dev
```

Open http://localhost:5174. The development server requires port 5174 to be available.

## GitHub Pages

The Pages build uses the same game, deck builder, card catalog, and themes as the hosted app. `github-pages/main.tsx` is a static React entry point; the existing Vinext build continues to serve the multiplayer API.

GitHub Pages cannot run the multiplayer API or its database. The public relay must serve `/api/relay` and permit the Pages origin through CORS. This project's relay permits `https://carolinewk.github.io`; update `lib/relay-cors.ts` when publishing under a different GitHub account.

```sh
POKETABLE_RELAY_ORIGIN=https://pokemon-table-caroline.carolinenunesjk.chatgpt.site POKETABLE_BASE_PATH=/pokemon-tcg/ npm run build:pages
npm run preview:pages
```

`dist-pages/` contains only the static frontend and public card assets. The build requires `POKETABLE_RELAY_ORIGIN` so a Pages deployment cannot silently point multiplayer at a missing local API. Do not put authentication tokens in this value; it becomes public frontend configuration. The backend must allow anonymous access for invited friends to connect.

The GitHub repository variable `POKETABLE_RELAY_ORIGIN` configures the backend. Set the Pages publishing source to **GitHub Actions**; `.github/workflows/pages.yml` publishes pushes to `main` and obtains the repository's asset base path from GitHub. All card art and catalog requests respect this base path, including room invite links.

For local multiplayer, build and initialize the local D1 database once:

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_easy_purifiers.sql
```

Do not reapply an already applied migration. Production migrations are included in the Sites deployment. `.openai/hosting.json` contains only the logical DB binding and the registered Site identifier.

## Verification

```sh
npm run typecheck
npm test
npm run lint:game
POKETABLE_TEST_ORIGIN=http://localhost:5174 npm run test:multiplayer
npm run build
```

The game tests include 100 reproducible opening hands, 24 complete simulated matches, conservation of every card, illegal-turn rejection, typed costs, evolution, attack costs, prizes, deck-out, and manual effects. The multiplayer test runs independent VibiNet clients against the actual HTTP/D1 relay and verifies exact state agreement, turn changes, replay, and rejection of a third player.

Refresh the data snapshot with `npm run cards:sync`. This downloads the upstream public JSON dataset and starter art; review the count and update the rules/catalog namespace before publishing an incompatible snapshot.

Unofficial fan project. Pokémon card artwork and names belong to their respective rights holders, including Pokémon, Nintendo, Creatures, and GAME FREAK. VibiNet is MIT licensed.
