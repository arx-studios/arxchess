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

/**
 * Headline and reason for the game-over card, e.g. "White won" / "by checkmate".
 * Pass `me` to phrase it from the user's side ("You won" / "You lost").
 */
export function resultHeadline(result: NonNullable<GameResult>, me?: "w" | "b"): { title: string; reason: string } {
  const reason =
    result.kind === "checkmate"
      ? "by checkmate"
      : result.kind === "timeout"
        ? "on time"
        : result.kind === "resignation"
          ? "by resignation"
          : result.kind === "stalemate"
            ? "by stalemate"
            : result.reason === "insufficient-material"
              ? "by insufficient material"
              : result.reason === "repetition"
                ? "by repetition"
                : "by the fifty-move rule";
  if (!("winner" in result)) return { title: "Draw", reason };
  if (me) return { title: result.winner === me ? "You won" : "You lost", reason };
  return { title: `${result.winner === "w" ? "White" : "Black"} won`, reason };
}

/** One-line status for a panel header: "White to move", "Black to move · check", or the result. */
export function statusLine(turn: "w" | "b", isCheck: boolean, result: GameResult): string {
  if (result) return describeResult(result);
  return `${turn === "w" ? "White" : "Black"} to move${isCheck ? " · check" : ""}`;
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
