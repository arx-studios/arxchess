"use client";

import { useEffect, useRef, useState } from "react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveList } from "@/components/board/MoveList";
import { GameStatusBanner } from "@/components/board/GameStatusBanner";
import { StockfishClient } from "@/lib/engine/stockfishClient";
import { useAiGameStore } from "@/lib/stores/aiGameStore";
import type { PieceColor } from "@/lib/chess/types";

const DIFFICULTIES: { label: string; elo: number }[] = [
  { label: "Beginner", elo: 1320 },
  { label: "Easy", elo: 1500 },
  { label: "Intermediate", elo: 1800 },
  { label: "Advanced", elo: 2200 },
  { label: "Expert", elo: 2800 },
];

const THINK_TIME_MS = 700;

export default function PlayAiPage() {
  const {
    fen,
    sanHistory,
    turn,
    isCheck,
    checkSquare,
    result,
    lastMove,
    playerColor,
    makeMove,
    legalDestinations,
    reset,
    resign,
  } = useAiGameStore();

  const [difficultyIndex, setDifficultyIndex] = useState(2);
  const [engineReady, setEngineReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const engineRef = useRef<StockfishClient | null>(null);

  useEffect(() => {
    const engine = new StockfishClient();
    engineRef.current = engine;
    engine.ready().then(() => setEngineReady(true));
    return () => {
      engine.quit();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engineReady) return;
    engine.setStrength({ elo: DIFFICULTIES[difficultyIndex].elo });
  }, [engineReady, difficultyIndex]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engineReady || result || turn === playerColor) return;
    let cancelled = false;
    setThinking(true);
    engine.getBestMove(fen, { movetimeMs: THINK_TIME_MS }).then((move) => {
      if (cancelled) return;
      setThinking(false);
      makeMove(move);
    });
    return () => {
      cancelled = true;
    };
  }, [fen, turn, playerColor, result, engineReady, makeMove]);

  function startNewGame(color: PieceColor) {
    reset(color);
    engineRef.current?.newGame();
  }


  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Play vs AI</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {engineReady ? "Stockfish (WASM) running locally in your browser." : "Loading engine…"}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,480px)_260px]">
        <div className="mx-auto w-full max-w-[480px]">
          <ChessBoard
            fen={fen}
            orientation={playerColor === "w" ? "white" : "black"}
            interactive={!result}
            playerColor={playerColor}
            turnColor={turn}
            lastMove={lastMove}
            checkSquare={checkSquare}
            legalDestinations={legalDestinations}
            onMove={(from, to, promotion) => makeMove({ from, to, promotion })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <GameStatusBanner result={result} isCheck={isCheck} turn={turn} />
          {thinking && !result && (
            <p className="text-sm text-neutral-500">Engine is thinking…</p>
          )}

          <MoveList sanHistory={sanHistory} />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={resign}
              disabled={!!result}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Resign
            </button>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => setDifficultyIndex(i)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    difficultyIndex === i
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">New game</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => startNewGame("w")}
                className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Play as White
              </button>
              <button
                onClick={() => startNewGame("b")}
                className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Play as Black
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
