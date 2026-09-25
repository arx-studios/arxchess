"use client";

import { useEffect, useRef, useState } from "react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveList } from "@/components/board/MoveList";
import { GameStatusBanner } from "@/components/board/GameStatusBanner";
import { StockfishClient } from "@/lib/engine/stockfishClient";
import { useArenaGameStore } from "@/lib/stores/arenaGameStore";

const DIFFICULTIES: { label: string; elo: number }[] = [
  { label: "Beginner", elo: 1320 },
  { label: "Easy", elo: 1500 },
  { label: "Intermediate", elo: 1800 },
  { label: "Advanced", elo: 2200 },
  { label: "Expert", elo: 2800 },
];

const SPEEDS = [
  { label: "Fast", ms: 200 },
  { label: "Normal", ms: 500 },
  { label: "Slow", ms: 1200 },
];

function EngineConfig({
  label,
  eloIndex,
  onChange,
  ready,
}: {
  label: string;
  eloIndex: number;
  onChange: (index: number) => void;
  ready: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label} {!ready && "(loading…)"}
      </p>
      <div className="flex flex-wrap gap-2">
        {DIFFICULTIES.map((d, i) => (
          <button
            key={d.label}
            onClick={() => onChange(i)}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              eloIndex === i
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
                : "border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ArenaPage() {
  const { fen, sanHistory, turn, isCheck, checkSquare, result, lastMove, makeMove, reset } = useArenaGameStore();

  const [whiteEloIndex, setWhiteEloIndex] = useState(1);
  const [blackEloIndex, setBlackEloIndex] = useState(3);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState({ w: false, b: false });

  const whiteEngineRef = useRef<StockfishClient | null>(null);
  const blackEngineRef = useRef<StockfishClient | null>(null);

  useEffect(() => {
    const white = new StockfishClient();
    const black = new StockfishClient();
    whiteEngineRef.current = white;
    blackEngineRef.current = black;
    white.ready().then(() => setReady((r) => ({ ...r, w: true })));
    black.ready().then(() => setReady((r) => ({ ...r, b: true })));
    return () => {
      white.quit();
      black.quit();
    };
  }, []);

  useEffect(() => {
    if (!ready.w) return;
    whiteEngineRef.current?.setStrength({ elo: DIFFICULTIES[whiteEloIndex].elo });
  }, [ready.w, whiteEloIndex]);

  useEffect(() => {
    if (!ready.b) return;
    blackEngineRef.current?.setStrength({ elo: DIFFICULTIES[blackEloIndex].elo });
  }, [ready.b, blackEloIndex]);

  useEffect(() => {
    if (!running || result) return;
    const engine = turn === "w" ? whiteEngineRef.current : blackEngineRef.current;
    const engineReady = turn === "w" ? ready.w : ready.b;
    if (!engine || !engineReady) return;

    let cancelled = false;
    engine.getBestMove(fen, { movetimeMs: SPEEDS[speedIndex].ms }).then((move) => {
      if (cancelled) return;
      makeMove(move);
    });
    return () => {
      cancelled = true;
    };
  }, [fen, turn, result, running, speedIndex, ready, makeMove]);

  function handleNewGame() {
    reset();
    whiteEngineRef.current?.newGame();
    blackEngineRef.current?.newGame();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Arena</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Two independently configured Stockfish instances play each other.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,480px)_260px]">
        <div className="mx-auto w-full max-w-[480px]">
          <ChessBoard
            fen={fen}
            orientation="white"
            interactive={false}
            turnColor={turn}
            lastMove={lastMove}
            checkSquare={checkSquare}
          />
        </div>

        <div className="flex flex-col gap-4">
          <GameStatusBanner result={result} isCheck={isCheck} turn={turn} />

          <MoveList sanHistory={sanHistory} />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              disabled={!!result}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={handleNewGame}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              New game
            </button>
          </div>

          <EngineConfig label="White" eloIndex={whiteEloIndex} onChange={setWhiteEloIndex} ready={ready.w} />
          <EngineConfig label="Black" eloIndex={blackEloIndex} onChange={setBlackEloIndex} ready={ready.b} />

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Speed</p>
            <div className="flex flex-wrap gap-2">
              {SPEEDS.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setSpeedIndex(i)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    speedIndex === i
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
