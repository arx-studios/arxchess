import { Chess, type Square } from "chess.js";
import { create } from "zustand";
import { snapshotGame, type GameSnapshot } from "@/lib/chess/snapshot";

type PlayedMove = { from: string; to: string; san: string; promotion?: string };

type AnalysisState = GameSnapshot & {
  moves: PlayedMove[];
  currentIndex: number; // -1 = start position
  headers: Record<string, string | null>;
};

type AnalysisActions = {
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  legalDestinations: (square: string) => { to: string; promotion?: boolean }[];
  loadPgn: (pgn: string) => { ok: boolean; error?: string };
  reset: () => void;
  goTo: (index: number) => void;
  stepBack: () => void;
  stepForward: () => void;
};

const game = new Chess();
let moves: PlayedMove[] = [];
let currentIndex = -1;

function replayTo(index: number) {
  game.reset();
  for (let i = 0; i <= index; i++) {
    game.move({ from: moves[i].from, to: moves[i].to, promotion: moves[i].promotion });
  }
  currentIndex = index;
}

function snapshot(): AnalysisState {
  return {
    ...snapshotGame(game, currentIndex >= 0 ? { from: moves[currentIndex].from, to: moves[currentIndex].to } : null),
    moves,
    currentIndex,
    headers: game.header(),
  };
}

export const useAnalysisStore = create<AnalysisState & AnalysisActions>((set, get) => ({
  ...snapshot(),

  makeMove: ({ from, to, promotion }) => {
    try {
      const move = game.move({ from, to, promotion });
      if (!move) return false;
      // manual move truncates any redo-able future line
      moves = moves.slice(0, currentIndex + 1);
      moves.push({ from: move.from, to: move.to, san: move.san, promotion: move.promotion });
      currentIndex = moves.length - 1;
      set(snapshot());
      return true;
    } catch {
      return false;
    }
  },

  legalDestinations: (square) => {
    return game
      .moves({ square: square as Square, verbose: true })
      .map((m) => ({ to: m.to, promotion: m.isPromotion() }));
  },

  loadPgn: (pgn) => {
    const probe = new Chess();
    try {
      probe.loadPgn(pgn);
    } catch {
      return { ok: false, error: "Could not parse that PGN." };
    }
    moves = probe.history({ verbose: true }).map((m) => ({
      from: m.from,
      to: m.to,
      san: m.san,
      promotion: m.promotion,
    }));
    replayTo(moves.length - 1);
    set(snapshot());
    return { ok: true };
  },

  reset: () => {
    moves = [];
    replayTo(-1);
    set(snapshot());
  },

  goTo: (index) => {
    const clamped = Math.max(-1, Math.min(index, moves.length - 1));
    replayTo(clamped);
    set(snapshot());
  },

  stepBack: () => {
    if (currentIndex < 0) return;
    replayTo(currentIndex - 1);
    set(snapshot());
  },

  stepForward: () => {
    if (currentIndex >= moves.length - 1) return;
    replayTo(currentIndex + 1);
    set(snapshot());
  },
}));
