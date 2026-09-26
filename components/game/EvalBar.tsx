import { formatWhiteScore, whiteWinPercent, type EngineScore } from "@/lib/chess/evaluation";

/** Vertical eval bar beside the board; white's share grows from the bottom (white's side). */
export function EvalBar({
  whiteScore,
  orientation = "white",
}: {
  whiteScore: EngineScore | null;
  orientation?: "white" | "black";
}) {
  const percent = whiteScore ? whiteWinPercent(whiteScore) : 50;
  const label = whiteScore ? formatWhiteScore(whiteScore, true) : "";
  const whiteAhead = percent >= 50;
  const flipped = orientation === "black";

  return (
    <div
      className={`relative flex h-full w-6 overflow-hidden rounded-sm bg-[#403d39] ${flipped ? "flex-col" : "flex-col-reverse"}`}
      aria-label={`Evaluation ${label || "unknown"}`}
    >
      <div className="bg-[#ebebea] transition-[height] duration-300" style={{ height: `${percent}%` }} />
      {label && (
        <span
          className={`tabular absolute inset-x-0 text-center text-[10px] font-bold leading-none ${
            whiteAhead ? "text-[#403d39]" : "text-[#ebebea]"
          } ${whiteAhead !== flipped ? "bottom-1" : "top-1"}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
