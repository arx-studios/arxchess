import { Chess, type Square } from "chess.js";
import { create } from "zustand";
import { snapshotGame, type GameSnapshot, type LastMove } from "@/lib/chess/snapshot";
import type { PieceColor } from "@/lib/chess/types";

type LocalGameState = GameSnapshot & {
  boardOrientation: "white" | "black";
};

type LocalGameActions = {
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  legalDestinations: (square: string) => { to: string; promotion?: boolean }[];
  reset: () => void;
  undo: () => void;
  flipBoard: () => void;
  resign: (color: PieceColor) => void;
  flagFall: (color: PieceColor) => void;
};

const game = new Chess();

function snapshot(lastMove: LastMove): GameSnapshot {
  return snapshotGame(game, lastMove);
}

export const useLocalGameStore = create<LocalGameState & LocalGameActions>((set, get) => ({
  ...snapshot(null),
  boardOrientation: "white",

  makeMove: ({ from, to, promotion }) => {
    if (get().result) return false;
    try {
      const move = game.move({ from, to, promotion });
      if (!move) return false;
      set(snapshot({ from: move.from, to: move.to }));
      return true;
    } catch {
      return false;
    }
  },

  legalDestinations: (square) => {
    if (get().result) return [];
    return game
      .moves({ square: square as Square, verbose: true })
      .map((m) => ({ to: m.to, promotion: m.isPromotion() }));
  },

  reset: () => {
    game.reset();
    set(snapshot(null));
  },

  undo: () => {
    game.undo();
    const history = game.history({ verbose: true });
    const last = history.length ? history[history.length - 1] : null;
    set(snapshot(last ? { from: last.from, to: last.to } : null));
  },

  flipBoard: () => set((s) => ({ boardOrientation: s.boardOrientation === "white" ? "black" : "white" })),

  resign: (color) => {
    if (get().result) return;
    set({ result: { kind: "resignation", winner: color === "w" ? "b" : "w" } });
  },

  flagFall: (color) => {
    if (get().result) return;
    set({ result: { kind: "timeout", winner: color === "w" ? "b" : "w" } });
  },
}));
