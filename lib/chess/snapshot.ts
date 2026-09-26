import type { Chess } from "chess.js";
import { deriveResult, type GameResult } from "./status";
import type { PieceColor } from "./types";

export type LastMove = { from: string; to: string } | null;

export type GameSnapshot = {
  fen: string;
  sanHistory: string[];
  turn: PieceColor;
  isCheck: boolean;
  checkSquare: string | null;
  result: GameResult;
  lastMove: LastMove;
};

export function snapshotGame(game: Chess, lastMove: LastMove): GameSnapshot {
  const isCheck = game.isCheck();
  const checkedKing = isCheck ? game.findPiece({ type: "k", color: game.turn() })[0] : undefined;
  return {
    fen: game.fen(),
    sanHistory: game.history(),
    turn: game.turn(),
    isCheck,
    checkSquare: checkedKing ?? null,
    result: deriveResult(game),
    lastMove,
  };
}
