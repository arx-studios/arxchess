"use client";

import { useCallback, useState } from "react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { PromotionDialog } from "@/components/board/PromotionDialog";
import { MoveList } from "@/components/board/MoveList";
import { GameStatusBanner } from "@/components/board/GameStatusBanner";
import { ClockDisplay, useChessClock } from "@/components/board/Clock";
import { useLocalGameStore } from "@/lib/stores/localGameStore";

const TIME_CONTROLS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "No clock", seconds: 0 },
];

export default function LocalPlayPage() {
  const {
    fen,
    sanHistory,
    turn,
    isCheck,
    checkSquare,
    result,
    lastMove,
    boardOrientation,
    makeMove,
    legalDestinations,
    reset,
    undo,
    flipBoard,
    resign,
    flagFall,
  } = useLocalGameStore();

  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [clockSeconds, setClockSeconds] = useState(300);

  const handleFlagFall = useCallback((color: "w" | "b") => flagFall(color), [flagFall]);

  const clockEnabled = clockSeconds > 0;
  const { times, reset: resetClock } = useChessClock({
    initialSeconds: clockSeconds || 1,
    turn,
    isRunning: clockEnabled && !result,
    onFlagFall: handleFlagFall,
  });

  function handleReset() {
    reset();
    resetClock(clockSeconds || 1);
    setPendingPromotion(null);
  }

  function handleTimeControlChange(seconds: number) {
    setClockSeconds(seconds);
    resetClock(seconds || 1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Pass & Play</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Two players share this board. Moves alternate automatically.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,480px)_260px]">
        <div className="mx-auto w-full max-w-[480px]">
          <ChessBoard
            fen={fen}
            orientation={boardOrientation}
            turnColor={turn}
            lastMove={lastMove}
            checkSquare={checkSquare}
            legalDestinations={legalDestinations}
            onMove={(from, to) => makeMove({ from, to })}
            onPromotionNeeded={(from, to) => setPendingPromotion({ from, to })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <ClockDisplay label="Black" ms={times.b} active={clockEnabled && turn === "b" && !result} />

          <GameStatusBanner result={result} isCheck={isCheck} turn={turn} />

          <MoveList sanHistory={sanHistory} />

          <ClockDisplay label="White" ms={times.w} active={clockEnabled && turn === "w" && !result} />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={undo}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Undo
            </button>
            <button
              onClick={flipBoard}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Flip board
            </button>
            <button
              onClick={() => resign(turn)}
              disabled={!!result}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Resign
            </button>
            <button
              onClick={handleReset}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              New game
            </button>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Time control
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_CONTROLS.map((tc) => (
                <button
                  key={tc.label}
                  onClick={() => handleTimeControlChange(tc.seconds)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    clockSeconds === tc.seconds
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {pendingPromotion && (
        <PromotionDialog
          color={turn}
          onCancel={() => setPendingPromotion(null)}
          onSelect={(piece) => {
            makeMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
            setPendingPromotion(null);
          }}
        />
      )}
    </div>
  );
}
