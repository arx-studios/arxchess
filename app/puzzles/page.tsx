"use client";

import { useEffect } from "react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { usePuzzleStore } from "@/lib/stores/puzzleStore";

function themeLabel(theme: string): string {
  return theme.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export default function PuzzlesPage() {
  const { puzzle, fen, turn, checkSquare, lastMove, status, legalDestinations, attemptMove, loadRandom } =
    usePuzzleStore();

  useEffect(() => {
    loadRandom();
  }, [loadRandom]);

  if (!puzzle) {
    return <div className="mx-auto max-w-5xl px-4 py-8">Loading puzzle…</div>;
  }

  const toMove = puzzle.solverColor === "w" ? "White" : "Black";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Puzzles</h1>
      <p className="mt-1 text-sm text-neutral-500">Find the best move for {toMove}.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,480px)_260px]">
        <div className="mx-auto w-full max-w-[480px]">
          <ChessBoard
            fen={fen}
            orientation={puzzle.solverColor === "w" ? "white" : "black"}
            interactive={status !== "complete"}
            turnColor={turn}
            lastMove={lastMove}
            checkSquare={checkSquare}
            legalDestinations={legalDestinations}
            onMove={(from, to, promotion) => attemptMove({ from, to, promotion })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700">
            <p className="font-medium">Rating {puzzle.rating}</p>
            <p className="mt-0.5 text-neutral-500">{puzzle.themes.map(themeLabel).join(" · ")}</p>
          </div>

          {status === "incorrect" && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              Not quite — try again.
            </div>
          )}
          {status === "complete" && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              Solved!
            </div>
          )}

          <button
            onClick={loadRandom}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Next puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
