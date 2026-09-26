"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Flag, Shuffle } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GameLayout } from "@/components/game/GameLayout";
import { PlayerCard } from "@/components/game/PlayerCard";
import { MoveList } from "@/components/game/MoveList";
import { GameOverCard, useResultCard } from "@/components/game/GameOverCard";
import { PanelFooter, PanelHeader, PanelSection } from "@/components/game/Panel";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { StockfishClient } from "@/lib/engine/stockfishClient";
import { useAiGameStore } from "@/lib/stores/aiGameStore";
import { useAnalysisStore } from "@/lib/stores/analysisStore";
import { displayName, useSettings } from "@/lib/settings/store";
import { resultHeadline, statusLine } from "@/lib/chess/status";
import { toPgn } from "@/lib/chess/pgn";
import { useGameSounds } from "@/lib/sound/useGameSounds";
import type { PieceColor } from "@/lib/chess/types";

const DIFFICULTIES: { label: string; elo: number }[] = [
  { label: "Beginner", elo: 1320 },
  { label: "Easy", elo: 1500 },
  { label: "Intermediate", elo: 1800 },
  { label: "Advanced", elo: 2200 },
  { label: "Expert", elo: 2800 },
];

type SidePick = "w" | "random" | "b";

const THINK_TIME_MS = 700;

export default function PlayAiPage() {
  const router = useRouter();
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
  const loadIntoAnalysis = useAnalysisStore((s) => s.loadPgn);
  const playerName = useSettings((s) => s.playerName);

  // The store outlives this page, so returning mid-game resumes it.
  const [playing, setPlaying] = useState(() => {
    const s = useAiGameStore.getState();
    return s.sanHistory.length > 0 && !s.result;
  });
  const [difficultyIndex, setDifficultyIndex] = useState(2);
  const [side, setSide] = useState<SidePick>("w");
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
    if (!playing || !engine || !engineReady || result || turn === playerColor) return;
    let cancelled = false;
    setThinking(true);
    engine.getBestMove(fen, { movetimeMs: THINK_TIME_MS }).then((move) => {
      if (cancelled) return;
      setThinking(false);
      if (move) makeMove(move);
    });
    return () => {
      cancelled = true;
      setThinking(false);
    };
  }, [playing, fen, turn, playerColor, result, engineReady, makeMove]);

  useGameSounds(sanHistory, !!result);
  const [showResult, dismissResult] = useResultCard(result);

  function start(color: PieceColor) {
    reset(color);
    engineRef.current?.newGame();
    setPlaying(true);
  }

  function startFromSetup() {
    start(side === "random" ? (Math.random() < 0.5 ? "w" : "b") : side);
  }

  function backToSetup() {
    setPlaying(false);
    reset(side === "b" ? "b" : "w");
  }

  function analyze() {
    loadIntoAnalysis(toPgn(sanHistory));
    router.push("/analysis");
  }

  const level = DIFFICULTIES[difficultyIndex];
  const engineCard = (
    <PlayerCard
      name="Stockfish"
      detail={`${level.label} · ${level.elo}`}
      icon={Bot}
      color={playerColor === "w" ? "b" : "w"}
      fen={fen}
    />
  );
  const youCard = <PlayerCard name={displayName(playerName)} color={playerColor} fen={fen} />;
  const headline = result ? resultHeadline(result, playerColor) : null;
  const gameOver = playing && !!result;

  const status = !playing
    ? engineReady
      ? "Stockfish runs in your browser"
      : "Loading engine…"
    : thinking && !result
      ? "Stockfish is thinking…"
      : statusLine(turn, isCheck, result);

  return (
    <GameLayout
      top={engineCard}
      bottom={youCard}
      board={
        <ChessBoard
          fen={fen}
          orientation={playerColor === "w" ? "white" : "black"}
          interactive={playing && !result}
          turnColor={turn}
          lastMove={lastMove}
          checkSquare={checkSquare}
          legalDestinations={(square) => (turn === playerColor ? legalDestinations(square) : [])}
          onMove={(from, to, promotion) => makeMove({ from, to, promotion })}
        />
      }
      overlay={
        headline &&
        gameOver &&
        showResult && (
          <GameOverCard title={headline.title} reason={headline.reason} onClose={dismissResult}>
            <Button variant="primary" size="lg" onClick={() => start(playerColor)}>
              Rematch
            </Button>
            <Button onClick={analyze}>Analyze</Button>
          </GameOverCard>
        )
      }
      panel={
        <>
          <PanelHeader title="Play vs AI" status={status} />
          {!playing ? (
            <>
              <PanelSection>
                <div>
                  <p className="mb-2 text-label font-semibold text-fg-secondary">Difficulty</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DIFFICULTIES.map((d, i) => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => setDifficultyIndex(i)}
                        aria-pressed={difficultyIndex === i}
                        className={`flex flex-col items-start rounded-md px-3 py-2 text-left transition-colors last:col-span-2 ${
                          difficultyIndex === i
                            ? "bg-raised outline-2 -outline-offset-2 outline-accent-fg"
                            : "bg-raised/50 hover:bg-hover"
                        }`}
                      >
                        <span className="text-label font-semibold">{d.label}</span>
                        <span className="tabular text-caption text-fg-muted">{d.elo}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-label font-semibold text-fg-secondary">I play as</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["w", "random", "b"] as SidePick[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSide(s)}
                        aria-pressed={side === s}
                        title={s === "w" ? "White" : s === "b" ? "Black" : "Random"}
                        className={`flex h-14 items-center justify-center rounded-md transition-colors ${
                          side === s ? "bg-raised outline-2 -outline-offset-2 outline-accent-fg" : "bg-raised/50 hover:bg-hover"
                        }`}
                      >
                        {s === "random" ? (
                          <Shuffle size={22} strokeWidth={1.75} className="text-fg-secondary" />
                        ) : (
                          <span
                            className="h-10 w-10 bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `var(--piece-${s}k)` }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </PanelSection>
              <PanelFooter>
                <Button variant="primary" size="lg" onClick={startFromSetup} disabled={!engineReady}>
                  Start game
                </Button>
              </PanelFooter>
            </>
          ) : (
            <>
              <MoveList sanHistory={sanHistory} />
              <PanelFooter>
                <div className="flex gap-1">
                  <IconButton icon={Flag} label="Resign" onClick={resign} disabled={!!result} />
                </div>
                {result ? (
                  <Button variant="primary" size="lg" onClick={backToSetup}>
                    New game
                  </Button>
                ) : null}
              </PanelFooter>
            </>
          )}
        </>
      }
    />
  );
}
