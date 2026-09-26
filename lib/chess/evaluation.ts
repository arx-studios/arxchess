import type { PieceColor } from "./types";

export type EngineScore = { scoreCp?: number; scoreMate?: number };

/** Converts a score reported from the side-to-move's perspective into White's perspective. */
export function toWhiteScore(score: EngineScore, turn: PieceColor): EngineScore {
  const sign = turn === "w" ? 1 : -1;
  return {
    scoreCp: score.scoreCp != null ? score.scoreCp * sign : undefined,
    scoreMate: score.scoreMate != null ? score.scoreMate * sign : undefined,
  };
}

/** 0-100, White's share of the eval bar. */
export function whiteWinPercent(whiteScore: EngineScore): number {
  if (whiteScore.scoreMate != null) return whiteScore.scoreMate > 0 ? 100 : 0;
  if (whiteScore.scoreCp == null) return 50;
  const winChance = 2 / (1 + Math.exp(-0.00368208 * whiteScore.scoreCp)) - 1;
  return Math.max(0, Math.min(100, 50 + 50 * winChance));
}

/** "+0.29", "M3"; `compact` gives the eval bar's short form ("0.3", like chess.com). */
export function formatWhiteScore(whiteScore: EngineScore, compact = false): string {
  if (whiteScore.scoreMate != null) {
    return `M${Math.abs(whiteScore.scoreMate)}`;
  }
  if (whiteScore.scoreCp == null) return "—";
  const pawns = whiteScore.scoreCp / 100;
  if (compact) return Math.abs(pawns).toFixed(1);
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}
