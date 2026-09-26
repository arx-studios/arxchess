"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eraser } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GameLayout } from "@/components/game/GameLayout";
import { PlayerCard } from "@/components/game/PlayerCard";
import { MoveList } from "@/components/game/MoveList";
import { EvalBar } from "@/components/game/EvalBar";
import { PanelFooter, PanelHeader } from "@/components/game/Panel";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { StockfishClient, type EngineInfo, type EngineMove } from "@/lib/engine/stockfishClient";
import { useAnalysisStore } from "@/lib/stores/analysisStore";
import { formatWhiteScore, toWhiteScore } from "@/lib/chess/evaluation";
import { statusLine } from "@/lib/chess/status";
import type { PieceColor } from "@/lib/chess/types";

const ANALYSIS_DEPTH = 18;

function sanOf(fen: string, move: EngineMove): string {
  try {
    return new Chess(fen).move(move).san;
  } catch {
    return `${move.from}${move.to}`;
  }
}

export default function AnalysisPage() {
  const {
    fen,
    moves,
    currentIndex,
    turn,
    isCheck,
    checkSquare,
    lastMove,
    result,
    makeMove,
    legalDestinations,
    loadPgn,
    reset,
    goTo,
    stepBack,
    stepForward,
  } = useAnalysisStore();

  const [orientation, setOrientation] = useState<"white" | "black">("white");
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

  // Arrow keys step through the game, like chess.com.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") stepBack();
      else if (e.key === "ArrowRight") stepForward();
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepBack, stepForward]);

  function handleLoadPgn() {
    const outcome = loadPgn(pgnText);
    setPgnError(outcome.ok ? null : outcome.error ?? "Invalid PGN");
    if (outcome.ok) setPgnText("");
  }

  const whiteScore = liveInfo ? toWhiteScore(liveInfo, turn) : null;
  const arrows = bestMove ? [{ from: bestMove.from, to: bestMove.to }] : [];
  const bestSan = useMemo(() => (bestMove ? sanOf(fen, bestMove) : null), [fen, bestMove]);
  const sanHistory = useMemo(() => moves.map((m) => m.san), [moves]);

  const bottom: PieceColor = orientation === "white" ? "w" : "b";
  const card = (color: PieceColor) => <PlayerCard name={color === "w" ? "White" : "Black"} color={color} fen={fen} />;

  return (
    <GameLayout
      top={card(bottom === "w" ? "b" : "w")}
      bottom={card(bottom)}
      beside={<EvalBar whiteScore={whiteScore} orientation={orientation} />}
      board={
        <ChessBoard
          fen={fen}
          orientation={orientation}
          turnColor={turn}
          lastMove={lastMove}
          checkSquare={checkSquare}
          arrows={arrows}
          legalDestinations={legalDestinations}
          onMove={(from, to, promotion) => makeMove({ from, to, promotion })}
        />
      }
      panel={
        <>
          <PanelHeader
            title="Analysis"
            status={statusLine(turn, isCheck, result)}
            actions={
              <>
                <IconButton
                  icon={ArrowUpDown}
                  label="Flip board"
                  onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
                />
                <IconButton icon={Eraser} label="Clear board" onClick={reset} />
              </>
            }
          />

          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="tabular min-w-[4.5rem] rounded-sm bg-raised px-2 py-1 text-center text-title font-bold">
              {whiteScore ? formatWhiteScore(whiteScore) : "…"}
            </span>
            <div className="min-w-0 text-caption text-fg-secondary">
              {!engineReady ? (
                "Loading engine…"
              ) : (
                <>
                  <p className="truncate">
                    Best move{" "}
                    <span className="font-semibold text-engine">{bestSan ?? "…"}</span>
                  </p>
                  <p className="tabular">Depth {liveInfo?.depth ?? 0}/{ANALYSIS_DEPTH}</p>
                </>
              )}
            </div>
          </div>

          <MoveList sanHistory={sanHistory} currentIndex={currentIndex} onSelectMove={goTo} />

          <details className="group border-t border-line px-4 py-3">
            <summary className="cursor-pointer select-none text-label font-semibold text-fg-secondary hover:text-fg">
              Import PGN
            </summary>
            <textarea
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 Nc6 ..."
              className="mt-3 h-24 w-full resize-none rounded-md bg-raised p-3 font-mono text-caption text-fg outline-none placeholder:text-fg-muted focus:outline-2 focus:outline-accent-fg"
            />
            {pgnError && <p className="mt-1 text-caption text-danger">{pgnError}</p>}
            <Button variant="primary" size="md" className="mt-3 w-full" onClick={handleLoadPgn} disabled={!pgnText.trim()}>
              Load PGN
            </Button>
          </details>

          <PanelFooter>
            <div className="grid grid-cols-4 gap-1">
              <IconButton icon={ChevronsLeft} label="First move" onClick={() => goTo(-1)} className="w-full" />
              <IconButton icon={ChevronLeft} label="Previous move (←)" onClick={stepBack} className="w-full" />
              <IconButton icon={ChevronRight} label="Next move (→)" onClick={stepForward} className="w-full" />
              <IconButton icon={ChevronsRight} label="Last move" onClick={() => goTo(moves.length - 1)} className="w-full" />
            </div>
          </PanelFooter>
        </>
      }
    />
  );
}
