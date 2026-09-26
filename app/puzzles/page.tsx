"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX, Flame, Target } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GameLayout } from "@/components/game/GameLayout";
import { PlayerCard } from "@/components/game/PlayerCard";
import { PanelFooter, PanelHeader, PanelSection } from "@/components/game/Panel";
import { Button } from "@/components/ui/Button";
import { usePuzzleStore } from "@/lib/stores/puzzleStore";
import { displayName, useSettings } from "@/lib/settings/store";
import { playSound } from "@/lib/sound/sounds";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function themeLabel(theme: string): string {
  return theme.replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1").replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** "mateIn2" -> "find mate in 2"; otherwise a generic prompt. */
function objective(themes: string[]): string {
  const mate = themes.find((t) => /^mateIn\d+$/.test(t));
  return mate ? `find mate in ${mate.slice(6)}` : "find the best move";
}

export default function PuzzlesPage() {
  const { puzzle, fen, turn, checkSquare, lastMove, status, legalDestinations, attemptMove, loadRandom } =
    usePuzzleStore();
  const playerName = useSettings((s) => s.playerName);
  const [streak, setStreak] = useState(0);
  const missed = useRef(false);

  useEffect(() => {
    loadRandom();
  }, [loadRandom]);

  function handleMove(from: string, to: string, promotion?: string) {
    const ok = attemptMove({ from, to, promotion });
    const now = usePuzzleStore.getState().status;
    if (now === "incorrect") {
      missed.current = true;
      setStreak(0);
    } else if (now === "complete") {
      playSound("game-end");
      if (!missed.current) setStreak((s) => s + 1);
    } else if (ok) playSound("move");
    return ok;
  }

  function nextPuzzle() {
    missed.current = false;
    loadRandom();
  }

  const solver = puzzle?.solverColor ?? "w";
  const toMove = solver === "w" ? "White" : "Black";

  const prompt =
    status === "complete"
      ? { tone: "bg-accent text-on-accent", icon: CircleCheck, title: "Solved!", body: "Nicely done." }
      : status === "incorrect"
        ? { tone: "bg-danger text-on-accent", icon: CircleX, title: "Not quite", body: "That's not it — try again." }
        : {
            tone: "bg-raised text-fg",
            icon: Target,
            title: `${toMove} to play`,
            body: puzzle ? `${objective(puzzle.themes).replace(/^./, (c) => c.toUpperCase())}.` : "Loading…",
          };
  const PromptIcon = prompt.icon;

  return (
    <GameLayout
      top={
        <div className="flex h-12 items-center gap-2">
          {puzzle && (
            <>
              <span className="tabular rounded-sm bg-raised px-2 py-1 text-label font-bold">{puzzle.rating}</span>
              {puzzle.themes.map((t) => (
                <span key={t} className="rounded-sm bg-raised/60 px-2 py-1 text-caption text-fg-secondary">
                  {themeLabel(t)}
                </span>
              ))}
            </>
          )}
        </div>
      }
      bottom={<PlayerCard name={displayName(playerName)} color={solver} fen={fen} showCaptures={false} />}
      board={
        <ChessBoard
          fen={puzzle ? fen : START_FEN}
          orientation={solver === "w" ? "white" : "black"}
          interactive={!!puzzle && status !== "complete"}
          turnColor={turn}
          lastMove={lastMove}
          checkSquare={checkSquare}
          legalDestinations={legalDestinations}
          onMove={handleMove}
        />
      }
      panel={
        <>
          <PanelHeader title="Puzzles" status="Find the mating move" />
          <PanelSection>
            <div className={`flex items-start gap-3 rounded-lg px-4 py-4 transition-colors ${prompt.tone}`}>
              <PromptIcon size={28} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-title font-bold">{prompt.title}</p>
                <p className="text-body opacity-90">{prompt.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-body text-fg-secondary">
              <Flame size={20} strokeWidth={1.75} className={streak ? "text-warning" : ""} />
              <span>
                Streak <span className="tabular font-bold text-fg">{streak}</span>
              </span>
            </div>
          </PanelSection>
          <PanelFooter>
            <Button variant="primary" size="lg" onClick={nextPuzzle}>
              {status === "complete" ? "Next puzzle" : "Skip puzzle"}
            </Button>
          </PanelFooter>
        </>
      }
    />
  );
}
