import { Chess } from "chess.js";

export type GameResult =
  | { kind: "checkmate"; winner: "w" | "b" }
  | { kind: "stalemate" }
  | { kind: "draw"; reason: "insufficient-material" | "repetition" | "fifty-move" | "other" }
  | { kind: "timeout"; winner: "w" | "b" }
  | { kind: "resignation"; winner: "w" | "b" }
  | null;

export function deriveResult(game: Chess): GameResult {
  if (game.isCheckmate()) {
    // side to move is the side that got mated
    return { kind: "checkmate", winner: game.turn() === "w" ? "b" : "w" };
  }
  if (game.isStalemate()) return { kind: "stalemate" };
  if (game.isDraw()) {
    if (game.isInsufficientMaterial()) return { kind: "draw", reason: "insufficient-material" };
    if (game.isThreefoldRepetition()) return { kind: "draw", reason: "repetition" };
    return { kind: "draw", reason: "fifty-move" };
  }
  return null;
}

export function describeResult(result: GameResult): string {
  if (!result) return "";
  switch (result.kind) {
    case "checkmate":
      return `Checkmate — ${result.winner === "w" ? "White" : "Black"} wins`;
    case "stalemate":
      return "Draw by stalemate";
    case "draw":
      return result.reason === "insufficient-material"
        ? "Draw — insufficient material"
        : result.reason === "repetition"
          ? "Draw — threefold repetition"
          : "Draw — fifty-move rule";
    case "timeout":
      return `${result.winner === "w" ? "White" : "Black"} wins on time`;
    case "resignation":
      return `${result.winner === "w" ? "White" : "Black"} wins by resignation`;
  }
}
