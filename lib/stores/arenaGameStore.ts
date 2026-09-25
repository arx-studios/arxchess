import { Chess } from "chess.js";
import { create } from "zustand";
import { snapshotGame, type GameSnapshot } from "@/lib/chess/snapshot";

type ArenaGameActions = {
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  reset: () => void;
};

const game = new Chess();

export const useArenaGameStore = create<GameSnapshot & ArenaGameActions>((set, get) => ({
  ...snapshotGame(game, null),

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

  reset: () => {
    game.reset();
    set(snapshotGame(game, null));
  },
}));
