# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AF Games is a real-time multiplayer browser game hub with 19 games. French-language UI. Built with Next.js 16 (App Router) + PartyKit (WebSocket server) + React 19.

## Commands

```bash
npm run dev           # Next.js dev server (http://localhost:3000)
npm run party:dev     # PartyKit WebSocket server (ws://localhost:1999)
npm run build         # Production build
npm run lint          # ESLint

npx partykit deploy   # Deploy WebSocket server to PartyKit Cloud
npx vercel --prod     # Deploy frontend to Vercel
npx partykit tail     # Live logs from PartyKit server
```

For local dev, both `dev` and `party:dev` must run simultaneously. Set `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999` in `.env.local` for local WebSocket.

## Architecture

**Two separate runtimes:**
- `src/` — Next.js frontend (React, runs in browser)
- `party/` — PartyKit server (WebSocket, runs on Cloudflare Workers)

**PartyKit servers** (configured in `partykit.json`):
- `party/lobby.ts` — Main party: room management, player joins, game selection
- `party/game.ts` — Game router: dispatches WebSocket messages to the active game instance
- `party/stats.ts` — Global stats/leaderboard persistence

**Game pattern** — Each game has:
- Server: `party/games/<game>.ts` — extends `BaseGame` (abstract class in `party/games/base-game.ts`). Must implement `start()`, `onMessage()`, `getState()`, `cleanup()`.
- Client: `src/components/games/<game>/` — React component receiving `GameProps` (`roomCode`, `playerId`, `playerName`)
- Registry entry: `src/lib/games/registry.ts` — `GameMeta` with lazy-loaded component

**Shared types:**
- `party/shared/types.ts` — Server-side types (`Player`, `LobbyState`, `GameRanking`)
- `src/lib/games/types.ts` — Client-side types (`GameMeta`, `GameProps`, `SessionScore`)

**App routes:**
- `/` — Home page (create/join room)
- `/room/[code]` — Lobby
- `/room/[code]/game/[gameId]` — Active game view
- `/controller/[code]` — Phone controller page (Motion Tennis gyroscope)

**WebSocket message protocol:**
```
Client -> Server:  { type: "game-join", payload: { playerId, name } }
                   { type: "game-action", payload: { action: "...", ... } }
Server -> Client:  { type: "game-state", payload: { ... } }
                   { type: "game-update", payload: { ... } }
                   { type: "game-over", payload: { rankings } }
```

## Key Conventions

- **TypeScript strict** mode enabled
- **Path alias:** `@/*` maps to `./src/*`
- **Server is source of truth** — clients only render state received via WebSocket
- **60Hz real-time data** (e.g., Motion Tennis): use mutable store pattern (`src/components/games/motion-tennis/tennis-store.ts`) with `useFrame()` reads, NOT React state/useEffect. Zustand's `subscribe()` fires synchronously, bypassing React 19 batching.
- **Sounds:** synthesized via Web Audio API (no audio files)
- **UI components:** shadcn/ui (new-york style) with Tailwind CSS 4, icons from lucide-react
- **State management:** Zustand stores in `src/lib/stores/`
- **All UI text is in French**
