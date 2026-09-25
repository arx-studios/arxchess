import { Chess, type Square } from "chess.js";
import { create } from "zustand";
import { snapshotGame, type GameSnapshot } from "@/lib/chess/snapshot";
import type { PieceColor } from "@/lib/chess/types";

type AiGameState = GameSnapshot & {
  playerColor: PieceColor;
};

type AiGameActions = {
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  legalDestinations: (square: string) => { to: string; promotion?: boolean }[];
  reset: (playerColor: PieceColor) => void;
  resign: () => void;
};

const game = new Chess();

export const useAiGameStore = create<AiGameState & AiGameActions>((set, get) => ({
  ...snapshotGame(game, null),
  playerColor: "w",

  makeMove: ({ from, to, promotion }) => {
    if (get().result) return false;
    try {
      const move = game.move({ from, to, promotion });
      if (!move) return false;
      set(snapshotGame(game, { from: move.from, to: move.to }));
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

  reset: (playerColor) => {
    game.reset();
    set({ ...snapshotGame(game, null), playerColor });
  },

  resign: () => {
    if (get().result) return;
    const color = get().playerColor;
    set({ result: { kind: "resignation", winner: color === "w" ? "b" : "w" } });
  },
}));
