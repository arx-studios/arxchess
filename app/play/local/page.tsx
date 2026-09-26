"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Flag, Undo2 } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GameLayout } from "@/components/game/GameLayout";
import { PlayerCard } from "@/components/game/PlayerCard";
import { MoveList } from "@/components/game/MoveList";
import { GameOverCard, useResultCard } from "@/components/game/GameOverCard";
import { PanelFooter, PanelHeader, PanelSection } from "@/components/game/Panel";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ChipGroup } from "@/components/ui/Chip";
import { useChessClock } from "@/lib/chess/useChessClock";
import { resultHeadline, statusLine } from "@/lib/chess/status";
import { toPgn } from "@/lib/chess/pgn";
import { useGameSounds } from "@/lib/sound/useGameSounds";
import { useLocalGameStore } from "@/lib/stores/localGameStore";
import { useAnalysisStore } from "@/lib/stores/analysisStore";
import type { PieceColor } from "@/lib/chess/types";

const TIME_CONTROLS = [
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
  { value: 0, label: "No clock" },
];

export default function LocalPlayPage() {
  const router = useRouter();
  const {
    fen,
    sanHistory,
    turn,
    isCheck,
    checkSquare,
    result,
    lastMove,
    boardOrientation,
    makeMove,
    legalDestinations,
    reset,
    undo,
    flipBoard,
    resign,
    flagFall,
  } = useLocalGameStore();
  const loadIntoAnalysis = useAnalysisStore((s) => s.loadPgn);

  const [clockSeconds, setClockSeconds] = useState(300);
  const handleFlagFall = useCallback((color: PieceColor) => flagFall(color), [flagFall]);

  const clockEnabled = clockSeconds > 0;
  const { times, reset: resetClock } = useChessClock({
    initialSeconds: clockSeconds || 1,
    turn,
    isRunning: clockEnabled && !result && sanHistory.length > 0,
    onFlagFall: handleFlagFall,
  });

  useGameSounds(sanHistory, !!result);
  const [showResult, dismissResult] = useResultCard(result);

  function newGame() {
    reset();
    resetClock(clockSeconds || 1);
  }

  function changeTimeControl(seconds: number) {
    setClockSeconds(seconds);
    resetClock(seconds || 1);
  }

  function analyze() {
    loadIntoAnalysis(toPgn(sanHistory));
    router.push("/analysis");
  }

  const bottomColor: PieceColor = boardOrientation === "white" ? "w" : "b";
  const card = (color: PieceColor) => (
    <PlayerCard
      name={color === "w" ? "White" : "Black"}
      color={color}
      fen={fen}
      clockMs={clockEnabled ? times[color] : undefined}
      toMove={turn === color && !result && sanHistory.length > 0}
    />
  );
  const headline = result ? resultHeadline(result) : null;

  return (
    <GameLayout
      top={card(bottomColor === "w" ? "b" : "w")}
      bottom={card(bottomColor)}
      board={
        <ChessBoard
          fen={fen}
          orientation={boardOrientation}
          interactive={!result}
          turnColor={turn}
          lastMove={lastMove}
          checkSquare={checkSquare}
          legalDestinations={legalDestinations}
          onMove={(from, to, promotion) => makeMove({ from, to, promotion })}
        />
      }
      overlay={
        headline &&
        showResult && (
          <GameOverCard title={headline.title} reason={headline.reason} onClose={dismissResult}>
            <Button variant="primary" size="lg" onClick={newGame}>
              New game
            </Button>
            <Button onClick={analyze}>Analyze</Button>
          </GameOverCard>
        )
      }
      panel={
        <>
          <PanelHeader title="Pass & Play" status={statusLine(turn, isCheck, result)} />
          <PanelSection className="border-b border-line">
            <ChipGroup
              label="Time control"
              options={TIME_CONTROLS}
              value={clockSeconds}
              onChange={changeTimeControl}
              disabled={sanHistory.length > 0 && !result}
            />
          </PanelSection>
          <MoveList sanHistory={sanHistory} />
          <PanelFooter>
            <div className="flex gap-1">
              <IconButton icon={Undo2} label="Undo move" onClick={undo} disabled={!sanHistory.length} />
              <IconButton icon={ArrowUpDown} label="Flip board" onClick={flipBoard} />
              <IconButton icon={Flag} label="Resign" onClick={() => resign(turn)} disabled={!!result || !sanHistory.length} />
            </div>
            <Button variant="primary" size="lg" onClick={newGame}>
              New game
            </Button>
          </PanelFooter>
        </>
      }
    />
  );
}
