"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Pause, Play, RotateCcw } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GameLayout } from "@/components/game/GameLayout";
import { PlayerCard } from "@/components/game/PlayerCard";
import { MoveList } from "@/components/game/MoveList";
import { PanelFooter, PanelHeader, PanelSection } from "@/components/game/Panel";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ChipGroup } from "@/components/ui/Chip";
import { StockfishClient } from "@/lib/engine/stockfishClient";
import { useArenaGameStore } from "@/lib/stores/arenaGameStore";
import { statusLine } from "@/lib/chess/status";
import { useGameSounds } from "@/lib/sound/useGameSounds";
import type { PieceColor } from "@/lib/chess/types";

const DIFFICULTIES: { label: string; elo: number }[] = [
  { label: "Beginner", elo: 1320 },
  { label: "Easy", elo: 1500 },
  { label: "Intermediate", elo: 1800 },
  { label: "Advanced", elo: 2200 },
  { label: "Expert", elo: 2800 },
];

const SPEEDS = [
  { value: 200, label: "Fast" },
  { value: 500, label: "Normal" },
  { value: 1200, label: "Slow" },
];

function LevelPicker({ value, onChange, label }: { value: number; onChange: (i: number) => void; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 cursor-pointer rounded-md bg-raised px-2 text-label font-semibold text-fg outline-none hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent-fg"
    >
      {DIFFICULTIES.map((d, i) => (
        <option key={d.label} value={i}>
          {d.label} · {d.elo}
        </option>
      ))}
    </select>
  );
}

export default function ArenaPage() {
  const { fen, sanHistory, turn, isCheck, checkSquare, result, lastMove, makeMove, reset } = useArenaGameStore();

  const [levels, setLevels] = useState<Record<PieceColor, number>>({ w: 1, b: 3 });
  const [speed, setSpeed] = useState(500);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState({ w: false, b: false });
  const [score, setScore] = useState({ w: 0, draws: 0, b: 0 });

  const engines = useRef<Record<PieceColor, StockfishClient | null>>({ w: null, b: null });

  useEffect(() => {
    const white = new StockfishClient();
    const black = new StockfishClient();
    engines.current = { w: white, b: black };
    white.ready().then(() => setReady((r) => ({ ...r, w: true })));
    black.ready().then(() => setReady((r) => ({ ...r, b: true })));
    return () => {
      white.quit();
      black.quit();
    };
  }, []);

  useEffect(() => {
    if (ready.w) engines.current.w?.setStrength({ elo: DIFFICULTIES[levels.w].elo });
  }, [ready.w, levels.w]);

  useEffect(() => {
    if (ready.b) engines.current.b?.setStrength({ elo: DIFFICULTIES[levels.b].elo });
  }, [ready.b, levels.b]);

  useEffect(() => {
    if (!running || result) return;
    const engine = engines.current[turn];
    if (!engine || !ready[turn]) return;

    let cancelled = false;
    engine.getBestMove(fen, { movetimeMs: speed }).then((move) => {
      if (cancelled || !move) return;
      makeMove(move);
    });
    return () => {
      cancelled = true;
    };
  }, [fen, turn, result, running, speed, ready, makeMove]);

  // Tally each finished game once.
  const counted = useRef<typeof result>(null);
  useEffect(() => {
    if (!result || counted.current === result) return;
    counted.current = result;
    setRunning(false);
    setScore((s) =>
      "winner" in result ? { ...s, [result.winner]: s[result.winner] + 1 } : { ...s, draws: s.draws + 1 },
    );
  }, [result]);

  useGameSounds(sanHistory, !!result);

  function newGame() {
    reset();
    engines.current.w?.newGame();
    engines.current.b?.newGame();
  }

  const card = (color: PieceColor) => (
    <PlayerCard
      name={`Stockfish ${color === "w" ? "A" : "B"}`}
      detail={color === "w" ? "White" : "Black"}
      icon={Bot}
      color={color}
      fen={fen}
      extra={
        <LevelPicker
          label={`${color === "w" ? "White" : "Black"} engine level`}
          value={levels[color]}
          onChange={(i) => setLevels((l) => ({ ...l, [color]: i }))}
        />
      }
    />
  );

  const status = !ready.w || !ready.b ? "Loading engines…" : result || running ? statusLine(turn, isCheck, result) : "Paused";

  return (
    <GameLayout
      top={card("b")}
      bottom={card("w")}
      board={
        <ChessBoard fen={fen} orientation="white" interactive={false} turnColor={turn} lastMove={lastMove} checkSquare={checkSquare} />
      }
      panel={
        <>
          <PanelHeader title="Arena" status={status} />
          <PanelSection className="border-b border-line">
            <div className="grid grid-cols-3 overflow-hidden rounded-md bg-raised text-center">
              {[
                { label: "Stockfish A", value: score.w },
                { label: "Draws", value: score.draws },
                { label: "Stockfish B", value: score.b },
              ].map((s) => (
                <div key={s.label} className="px-2 py-2">
                  <p className="tabular text-title font-bold">{s.value}</p>
                  <p className="text-caption text-fg-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <ChipGroup label="Speed" options={SPEEDS} value={speed} onChange={setSpeed} />
          </PanelSection>
          <MoveList sanHistory={sanHistory} />
          <PanelFooter>
            <div className="flex gap-1">
              <IconButton icon={RotateCcw} label="New game" onClick={newGame} />
            </div>
            {result ? (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  newGame();
                  setRunning(true);
                }}
              >
                <Play size={18} strokeWidth={2} /> Next game
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={() => setRunning((r) => !r)} disabled={!ready.w || !ready.b}>
                {running ? <Pause size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} />}
                {running ? "Pause" : sanHistory.length ? "Resume" : "Start"}
              </Button>
            )}
          </PanelFooter>
        </>
      }
    />
  );
}
