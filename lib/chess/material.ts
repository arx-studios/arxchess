import type { PieceColor } from "./types";

const START: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const ORDER = ["p", "n", "b", "r", "q"];

/**
 * Pieces `color` has captured (as piece codes of the opponent, e.g. "bp"),
 * cheapest first like chess.com, and `color`'s material lead (0 if behind or level).
 */
export function capturedBy(fen: string, color: PieceColor): { pieces: string[]; advantage: number } {
  const counts: Record<PieceColor, Record<string, number>> = { w: {}, b: {} };
  for (const ch of fen.split(" ")[0]) {
    const role = ch.toLowerCase();
    if (!(role in VALUE)) continue;
    const side: PieceColor = ch === ch.toUpperCase() ? "w" : "b";
    counts[side][role] = (counts[side][role] ?? 0) + 1;
  }
  const opponent: PieceColor = color === "w" ? "b" : "w";
  const pieces: string[] = [];
  for (const role of ORDER) {
    const missing = Math.max(0, START[role] - (counts[opponent][role] ?? 0));
    for (let i = 0; i < missing; i++) pieces.push(`${opponent}${role}`);
  }
  const material = (side: PieceColor) => ORDER.reduce((sum, r) => sum + (counts[side][r] ?? 0) * VALUE[r], 0);
  return { pieces, advantage: Math.max(0, material(color) - material(opponent)) };
}
