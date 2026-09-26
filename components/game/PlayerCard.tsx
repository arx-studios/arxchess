import type { LucideIcon } from "lucide-react";
import { capturedBy } from "@/lib/chess/material";
import type { PieceColor } from "@/lib/chess/types";
import { Clock } from "./Clock";

type PlayerCardProps = {
  name: string;
  /** Rating, engine level, "Waiting…", etc. */
  detail?: string;
  color: PieceColor;
  fen: string;
  /** Avatar icon; omitted = the name's first letter. */
  icon?: LucideIcon;
  clockMs?: number;
  /** This side is to move (its clock runs). */
  toMove?: boolean;
  /** false shows a warning dot (e.g. online opponent dropped). */
  connected?: boolean;
  /** Rendered at the right instead of a clock (e.g. an engine level picker). */
  extra?: React.ReactNode;
  /** Off for positions that didn't start from the initial setup (puzzles). */
  showCaptures?: boolean;
};

export function PlayerCard({
  name,
  detail,
  color,
  fen,
  icon: Icon,
  clockMs,
  toMove = false,
  connected,
  extra,
  showCaptures = true,
}: PlayerCardProps) {
  const { pieces, advantage } = showCaptures ? capturedBy(fen, color) : { pieces: [], advantage: 0 };

  return (
    <div className="flex h-12 items-center gap-3">
      <div className="relative shrink-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-sm text-title font-bold ${
            color === "w" ? "bg-[#ebebea] text-[#22211e] light:ring-1 light:ring-line" : "bg-[#403d39] text-[#ebebea]"
          }`}
        >
          {Icon ? <Icon size={22} strokeWidth={1.75} /> : name.trim().charAt(0).toUpperCase() || "?"}
        </div>
        {connected === false && (
          <span
            title="Disconnected"
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-app bg-warning"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-label font-semibold">{name}</span>
          {detail && <span className="tabular truncate text-caption text-fg-muted">{detail}</span>}
        </div>
        <div className="flex h-5 items-center">
          {/* Captured pieces: same kinds overlap, like chess.com. */}
          {pieces.map((code, i) => (
            <span
              key={i}
              className={`h-[18px] w-[18px] shrink-0 bg-contain bg-center bg-no-repeat ${
                i > 0 && pieces[i - 1] === code ? "-ml-[10px]" : i > 0 ? "ml-0.5" : ""
              }`}
              style={{ backgroundImage: `var(--piece-${code})` }}
            />
          ))}
          {advantage > 0 && <span className="tabular ml-1.5 text-caption text-fg-secondary">+{advantage}</span>}
        </div>
      </div>

      {extra}
      {clockMs !== undefined && <Clock ms={clockMs} live={toMove} />}
    </div>
  );
}
