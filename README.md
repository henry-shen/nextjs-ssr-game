# nextjs-ssr-game

Small **Next.js 15** (App Router) boilerplate for a **single-room** multiplayer web game: one global lobby, one host, shared server-side state, and spectating while a round is active. Intended for deployment on **Vercel**.

## Behavior

- **Lobby**: Visitors enter a display name and **Join**. Optionally **Join as host** if no host exists yet.
- **Single host**: Only one `hostId` is allowed; the API rejects a second host.
- **Start**: The host starts the game; late visitors **cannot join** and only **observe** until the round ends.
- **End**: The host ends the game; the room returns to **lobby** (players cleared so everyone picks names again).

Sessions use an HTTP-only cookie (`game_player_id`) so the server can recognize returning players in the same browser.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use multiple browsers or incognito windows to simulate several players.

## Deploy on Vercel

Connect the repo to Vercel and use the default Next.js settings. No extra env vars are required for the in-memory store.

## Production note (important)

`lib/game-store.ts` keeps state **in process memory**. That is fine for local development, but on Vercel **serverless instances do not share RAM** and may scale to multiple instances, so players can see **split-brain** or **lost** state.

For a real deployment, swap the store for a **shared** service, for example:

- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Redis](https://upstash.com/)

Keep the same semantics (one room, host, phases) and serialize `GameSnapshot` as JSON.

## Where to extend the game

| Area | Purpose |
|------|---------|
| `lib/types.ts` | `GamePayload` — your rules, entities, scores |
| `lib/game-store.ts` | Mutations when moves happen; replace backing storage |
| `app/api/game/route.ts` | Add actions (e.g. `move`) with host/player checks |
| `components/GameExperience.tsx` | UI for lobby, play, and spectate |

The home page is **SSR** (`dynamic = "force-dynamic"`) and hydrates with `GameExperience`, which **polls** `GET /api/game` every few seconds so lobby and spectator views stay roughly in sync without WebSockets.
