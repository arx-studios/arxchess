# arxchess

A chess platform: local pass-and-play, play vs Stockfish, an analysis board, puzzles, engine-vs-engine arena battles, and real-time online multiplayer.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `chess.js` for rules/state
- Board UI: lichess's [chessground](https://github.com/lichess-org/chessground) (GPLv3) wrapped in `components/board/ChessBoard.tsx`, skinned to look like chess.com (`components/board/chessboard-theme.css`) with chess.com's Neo pieces and Green board image in `public/themes/`. Those images are chess.com's artwork, sourced via [chess.com-boards-and-pieces](https://github.com/GiorgioMegrelli/chess.com-boards-and-pieces) — fine for personal use, but swap them out before publishing or deploying this anywhere public.
- Stockfish 19 (WASM, lite single-threaded build) running in a Web Worker per engine instance — no server-side engine, no COOP/COEP headers needed
- `zustand` for per-mode game state
- A standalone Node WebSocket server (`server/`) for online multiplayer rooms

## Running it

Most modes only need the Next.js dev server:

```bash
npm run dev
```

Open <http://localhost:3000>. Everything except **Online** works from this alone (engine modes run entirely in your browser).

**Online multiplayer** needs the WebSocket server too. Run both together:

```bash
npm run dev:all
```

or separately in two terminals: `npm run dev` and `npm run ws-server`. The client looks for the WS server at `ws://localhost:3001` by default (override with `NEXT_PUBLIC_WS_URL`).

Multiplayer rooms are in-memory — restarting the WS server clears any in-progress games. There are no accounts yet; a room is just a shared link (`/play/online/<roomId>`), and the first two people to open it are seated White/Black.

## Puzzles

`public/puzzles/puzzle-set.json` is generated (not hand-edited) by `scripts/generate-puzzles.mjs`, which mechanically verifies every puzzle — each move legal in sequence, every opponent reply forced, the final position an actual checkmate — before writing it out:

```bash
npm run puzzles:build
```

Add new candidates to the `candidates` array in that script and re-run it; anything that fails validation is reported and excluded rather than shipped. The current set is a small hand-authored mate-in-1 starter pack — importing the full Lichess puzzle database (CC0) through the same validation pipeline is a natural next step.

## Other scripts

- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check only
