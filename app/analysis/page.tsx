"use client";

import { useEffect, useRef, useState } from "react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveList } from "@/components/board/MoveList";
import { EvalBar } from "@/components/board/EvalBar";
import { StockfishClient, type EngineInfo, type EngineMove } from "@/lib/engine/stockfishClient";
import { useAnalysisStore } from "@/lib/stores/analysisStore";
import { formatWhiteScore, toWhiteScore } from "@/lib/chess/evaluation";

const ANALYSIS_DEPTH = 18;

export default function AnalysisPage() {
  const {
    fen,
    moves,
    currentIndex,
    turn,
    isCheck,
    checkSquare,
    lastMove,
    makeMove,
    legalDestinations,
    loadPgn,
    reset,
    goTo,
    stepBack,
    stepForward,
  } = useAnalysisStore();

  const [pgnText, setPgnText] = useState("");
  const [pgnError, setPgnError] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [liveInfo, setLiveInfo] = useState<EngineInfo | null>(null);
  const [bestMove, setBestMove] = useState<EngineMove | null>(null);
  const engineRef = useRef<StockfishClient | null>(null);

  useEffect(() => {
    const engine = new StockfishClient();
    engineRef.current = engine;
    engine.ready().then(() => setEngineReady(true));
    return () => engine.quit();
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engineReady) return;
    let cancelled = false;
    setLiveInfo(null);
    setBestMove(null);
    engine.onInfo = (info) => {
      if (!cancelled) setLiveInfo(info);
    };
    engine.getBestMove(fen, { depth: ANALYSIS_DEPTH }).then((move) => {
      if (cancelled) return;
      setBestMove(move);
    });
    return () => {
      cancelled = true;
    };
  }, [fen, engineReady]);

  function handleLoadPgn() {
    const outcome = loadPgn(pgnText);
    setPgnError(outcome.ok ? null : outcome.error ?? "Invalid PGN");
  }

  function handleClear() {
    reset();
    setPgnText("");
    setPgnError(null);
  }

  const whiteScore = liveInfo ? toWhiteScore(liveInfo, turn) : null;
  const arrows = bestMove ? [{ from: bestMove.from, to: bestMove.to }] : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Analysis Board</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {engineReady ? "Move freely, or paste a PGN to step through a game." : "Loading engine…"}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[32px_minmax(0,480px)_260px]">
        <div className="hidden h-[480px] lg:block">
          <EvalBar whiteScore={whiteScore} />
        </div>

        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-2 flex h-6 items-center gap-2 text-xs text-neutral-500 lg:hidden">
            <span className="font-mono">{whiteScore ? formatWhiteScore(whiteScore) : "—"}</span>
          </div>
          <ChessBoard
            fen={fen}
            orientation="white"
            turnColor={turn}
            lastMove={lastMove}
            checkSquare={checkSquare}
            arrows={arrows}
            legalDestinations={legalDestinations}
            onMove={(from, to, promotion) => makeMove({ from, to, promotion })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex gap-1">
              <button onClick={() => goTo(-1)} className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-700">
                ⏮
              </button>
              <button onClick={stepBack} className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-700">
                ◀
              </button>
              <button onClick={stepForward} className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-700">
                ▶
              </button>
              <button
                onClick={() => goTo(moves.length - 1)}
                className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-700"
              >
                ⏭
              </button>
            </div>
            {liveInfo?.depth && <span className="text-xs text-neutral-400">depth {liveInfo.depth}</span>}
          </div>

          <MoveList sanHistory={moves.map((m) => m.san)} currentIndex={currentIndex} onSelectMove={goTo} />

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Import PGN</p>
            <textarea
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 Nc6 ..."
              className="h-24 w-full resize-none rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            />
            {pgnError && <p className="mt-1 text-xs text-red-600">{pgnError}</p>}
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleLoadPgn}
                className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Load
              </button>
              <button
                onClick={handleClear}
                className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Clear board
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
