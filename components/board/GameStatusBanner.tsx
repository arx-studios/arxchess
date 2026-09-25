import { describeResult, type GameResult } from "@/lib/chess/status";
import type { PieceColor } from "@/lib/chess/types";

export function GameStatusBanner({
  result,
  isCheck,
  turn,
}: {
  result: GameResult;
  isCheck: boolean;
  turn: PieceColor;
}) {
  if (result) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        {describeResult(result)}
      </div>
    );
  }
  return (
    <div className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
      {turn === "w" ? "White" : "Black"} to move{isCheck ? " — check!" : ""}
    </div>
  );
}
