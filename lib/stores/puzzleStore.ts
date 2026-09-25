import { Chess, type Square } from "chess.js";
import { create } from "zustand";
import puzzleData from "@/public/puzzles/puzzle-set.json";
import { snapshotGame, type GameSnapshot } from "@/lib/chess/snapshot";
import type { PieceColor } from "@/lib/chess/types";

export type Puzzle = {
  id: string;
  fen: string;
  solution: string[];
  themes: string[];
  rating: number;
  solverColor: PieceColor;
};

const PUZZLES = puzzleData as Puzzle[];

type PuzzleStatus = "solving" | "incorrect" | "complete";

type PuzzleState = GameSnapshot & {
  puzzle: Puzzle | null;
  stepIndex: number;
  status: PuzzleStatus;
};

type PuzzleActions = {
  loadRandom: () => void;
  loadById: (id: string) => void;
  legalDestinations: (square: string) => { to: string; promotion?: boolean }[];
  attemptMove: (move: { from: string; to: string; promotion?: string }) => boolean;
};

const game = new Chess();

function parseUci(uci: string) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci.slice(4, 5) : undefined };
}

function loadPuzzle(puzzle: Puzzle): PuzzleState {
  game.load(puzzle.fen);
  return {
    ...snapshotGame(game, null),
    puzzle,
    stepIndex: 0,
    status: "solving",
  };
}

export const usePuzzleStore = create<PuzzleState & PuzzleActions>((set, get) => ({
  puzzle: null,
  stepIndex: 0,
  status: "solving",
  ...snapshotGame(game, null),

  loadRandom: () => {
    const puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
    set(loadPuzzle(puzzle));
  },

  loadById: (id) => {
    const puzzle = PUZZLES.find((p) => p.id === id);
    if (!puzzle) return;
    set(loadPuzzle(puzzle));
  },

  legalDestinations: (square) => {
    if (get().status === "complete") return [];
    return game
      .moves({ square: square as Square, verbose: true })
      .map((m) => ({ to: m.to, promotion: m.isPromotion() }));
  },

  attemptMove: ({ from, to, promotion }) => {
    const { puzzle, stepIndex, status } = get();
    if (!puzzle || status === "complete") return false;

    const expected = puzzle.solution[stepIndex];
    const attempted = `${from}${to}${promotion ?? ""}`;
    if (attempted !== expected) {
      set({ status: "incorrect" });
      return false;
    }

    const move = game.move({ from, to, promotion });
    if (!move) return false;
    let nextIndex = stepIndex + 1;
    let lastMove = { from: move.from, to: move.to };

    // auto-play the opponent's forced reply, if the puzzle has one
    if (nextIndex < puzzle.solution.length) {
      const reply = parseUci(puzzle.solution[nextIndex]);
      const replyMove = game.move(reply);
      if (replyMove) {
        lastMove = { from: replyMove.from, to: replyMove.to };
        nextIndex += 1;
      }
    }

    set({
      ...snapshotGame(game, lastMove),
      stepIndex: nextIndex,
      status: nextIndex >= puzzle.solution.length ? "complete" : "solving",
    });
    return true;
  },
}));
