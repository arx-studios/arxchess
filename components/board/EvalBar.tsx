import { formatWhiteScore, whiteWinPercent, type EngineScore } from "@/lib/chess/evaluation";

export function EvalBar({ whiteScore }: { whiteScore: EngineScore | null }) {
  const percent = whiteScore ? whiteWinPercent(whiteScore) : 50;
  const label = whiteScore ? formatWhiteScore(whiteScore) : "—";

  return (
    <div className="flex h-full w-8 flex-col overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
      <div
        className="flex items-start justify-center bg-neutral-800 text-[10px] font-medium text-white transition-[height] duration-300"
        style={{ height: `${100 - percent}%` }}
      />
      <div
        className="flex items-end justify-center bg-neutral-100 text-[10px] font-medium text-neutral-900 transition-[height] duration-300"
        style={{ height: `${percent}%` }}
      >
        <span className="pb-0.5">{label}</span>
      </div>
    </div>
  );
}
