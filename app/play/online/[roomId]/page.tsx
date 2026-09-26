"use client";

import { use, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveList } from "@/components/board/MoveList";
import { GameStatusBanner } from "@/components/board/GameStatusBanner";
import { ClockDisplay } from "@/components/board/Clock";
import { useGameSocket } from "@/lib/multiplayer/useGameSocket";
import { useServerClock } from "@/lib/multiplayer/useServerClock";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function OnlineRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { state, status, move, resign } = useGameSocket(roomId);
  const [copied, setCopied] = useState(false);

  const fen = state?.fen ?? START_FEN;
  const chess = useMemo(() => new Chess(fen), [fen]);
  const isCheck = chess.isCheck();
  const checkSquare = isCheck ? (chess.findPiece({ type: "k", color: chess.turn() })[0] ?? null) : null;

  const clocks = useServerClock({
    clockMs: state?.clockMs ?? { w: 0, b: 0 },
    lastMoveAt: state?.lastMoveAt ?? Date.now(),
    turn: state?.turn ?? "w",
    isRunning: !!state && !state.result,
  });

  function legalDestinations(square: string) {
    return chess.moves({ square: square as Square, verbose: true }).map((m) => ({ to: m.to, promotion: m.isPromotion() }));
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {status === "closed" ? "Couldn't reach the multiplayer server. Is it running (npm run dev:all)?" : "Connecting…"}
      </div>
    );
  }

  const mySeat = state.yourSeat;
  const isPlayer = mySeat === "w" || mySeat === "b";
  const interactive = isPlayer && !state.result;
  const opponentConnected = isPlayer ? state.connected[mySeat === "w" ? "b" : "w"] : true;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Online</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {isPlayer ? `You are playing ${mySeat === "w" ? "White" : "Black"}.` : "Spectating."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,480px)_260px]">
        <div className="mx-auto w-full max-w-[480px]">
          <ChessBoard
            fen={fen}
            orientation={mySeat === "b" ? "black" : "white"}
            interactive={interactive}
            playerColor={isPlayer ? mySeat : undefined}
            turnColor={state.turn}
            lastMove={state.lastMove}
            checkSquare={checkSquare}
            legalDestinations={legalDestinations}
            onMove={(from, to, promotion) => {
              move(from, to, promotion);
              return true;
            }}
          />
        </div>

        <div className="flex flex-col gap-4">
          <ClockDisplay label="Black" ms={clocks.b} active={!state.result && state.turn === "b"} />
          <GameStatusBanner result={state.result} isCheck={isCheck} turn={state.turn} />
          <MoveList sanHistory={state.sanHistory} />
          <ClockDisplay label="White" ms={clocks.w} active={!state.result && state.turn === "w"} />

          {isPlayer && !opponentConnected && !state.result && (
            <p className="text-xs text-amber-600">Waiting for your opponent to connect…</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {copied ? "Copied!" : "Copy room link"}
            </button>
            {isPlayer && (
              <button
                onClick={resign}
                disabled={!!state.result}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Resign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
