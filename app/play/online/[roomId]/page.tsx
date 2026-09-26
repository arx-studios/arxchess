"use client";

import { use, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { Check, Copy, Flag, Globe } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GameLayout } from "@/components/game/GameLayout";
import { PlayerCard } from "@/components/game/PlayerCard";
import { MoveList } from "@/components/game/MoveList";
import { GameOverCard, useResultCard } from "@/components/game/GameOverCard";
import { PanelFooter, PanelHeader, PanelSection } from "@/components/game/Panel";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useGameSocket } from "@/lib/multiplayer/useGameSocket";
import { useServerClock } from "@/lib/multiplayer/useServerClock";
import { useAnalysisStore } from "@/lib/stores/analysisStore";
import { displayName, useSettings } from "@/lib/settings/store";
import { resultHeadline, statusLine } from "@/lib/chess/status";
import { toPgn } from "@/lib/chess/pgn";
import { useGameSounds } from "@/lib/sound/useGameSounds";
import type { PieceColor } from "@/lib/chess/types";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const NO_MOVES: string[] = [];
const noSubscribe = () => () => {};

export default function OnlineRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { state, status: connection, move, resign } = useGameSocket(roomId);
  const loadIntoAnalysis = useAnalysisStore((s) => s.loadPgn);
  const playerName = useSettings((s) => s.playerName);
  const [copied, setCopied] = useState(false);
  // The full URL is only known in the browser; the server renders the path.
  const link = useSyncExternalStore(
    noSubscribe,
    () => window.location.href,
    () => `/play/online/${roomId}`,
  );

  const fen = state?.fen ?? START_FEN;
  const sanHistory = state?.sanHistory ?? NO_MOVES;
  const chess = useMemo(() => new Chess(fen), [fen]);
  const isCheck = chess.isCheck();
  const checkSquare = isCheck ? (chess.findPiece({ type: "k", color: chess.turn() })[0] ?? null) : null;

  const clocks = useServerClock({
    clockMs: state?.clockMs ?? { w: 0, b: 0 },
    lastMoveAt: state?.lastMoveAt ?? Date.now(),
    turn: state?.turn ?? "w",
    isRunning: !!state && !state.result,
  });

  useGameSounds(sanHistory, !!state?.result);
  // The server sends a new object on every update, so compare the result's content.
  const [showResult, dismissResult] = useResultCard(state?.result ? JSON.stringify(state.result) : null);

  function legalDestinations(square: string) {
    if (state?.turn !== state?.yourSeat) return [];
    return chess.moves({ square: square as Square, verbose: true }).map((m) => ({ to: m.to, promotion: m.isPromotion() }));
  }

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function analyze() {
    loadIntoAnalysis(toPgn(sanHistory));
    router.push("/analysis");
  }

  const mySeat = state?.yourSeat;
  const isPlayer = mySeat === "w" || mySeat === "b";
  const me: PieceColor = mySeat === "b" ? "b" : "w";
  const opponent: PieceColor = me === "w" ? "b" : "w";
  const opponentConnected = state ? state.connected[opponent] : false;
  const waiting = isPlayer && !opponentConnected && !state?.result;
  const running = !!state && !state.result;

  const status = !state
    ? connection === "closed"
      ? "Can't reach the multiplayer server (npm run dev:all)"
      : "Connecting…"
    : !isPlayer
      ? `Spectating · ${statusLine(state.turn, isCheck, state.result)}`
      : waiting
        ? "Waiting for your opponent to join…"
        : statusLine(state.turn, isCheck, state.result);

  const headline = state?.result ? resultHeadline(state.result, isPlayer ? me : undefined) : null;

  return (
    <GameLayout
      top={
        <PlayerCard
          name={isPlayer ? "Opponent" : opponent === "w" ? "White" : "Black"}
          detail={isPlayer && !opponentConnected ? (sanHistory.length ? "Disconnected" : "Not joined") : undefined}
          icon={Globe}
          color={opponent}
          fen={fen}
          clockMs={state ? clocks[opponent] : undefined}
          toMove={running && state?.turn === opponent}
          connected={isPlayer && sanHistory.length > 0 ? opponentConnected : undefined}
        />
      }
      bottom={
        <PlayerCard
          name={isPlayer ? displayName(playerName) : me === "w" ? "White" : "Black"}
          color={me}
          fen={fen}
          clockMs={state ? clocks[me] : undefined}
          toMove={running && state?.turn === me}
        />
      }
      board={
        <ChessBoard
          fen={fen}
          orientation={me === "b" ? "black" : "white"}
          interactive={isPlayer && running}
          turnColor={state?.turn ?? "w"}
          lastMove={state?.lastMove ?? null}
          checkSquare={checkSquare}
          legalDestinations={legalDestinations}
          onMove={(from, to, promotion) => {
            move(from, to, promotion);
            return true;
          }}
        />
      }
      overlay={
        headline &&
        showResult && (
          <GameOverCard title={headline.title} reason={headline.reason} onClose={dismissResult}>
            <Button variant="primary" size="lg" onClick={() => router.push("/play/online")}>
              New room
            </Button>
            <Button onClick={analyze}>Analyze</Button>
          </GameOverCard>
        )
      }
      panel={
        <>
          <PanelHeader title="Online" status={status} />
          {(waiting || !isPlayer) && state && (
            <PanelSection className="border-b border-line">
              <div>
                <p className="mb-2 text-label font-semibold text-fg-secondary">Room link</p>
                <div className="flex items-center gap-2 rounded-md bg-raised py-1 pl-3 pr-1">
                  <span className="min-w-0 flex-1 truncate font-mono text-caption text-fg-secondary">
                    {link}
                  </span>
                  <IconButton icon={copied ? Check : Copy} label={copied ? "Copied" : "Copy link"} onClick={copyLink} />
                </div>
              </div>
            </PanelSection>
          )}
          <MoveList sanHistory={sanHistory} />
          <PanelFooter>
            <div className="flex gap-1">
              {isPlayer && <IconButton icon={Flag} label="Resign" onClick={resign} disabled={!running} />}
              <IconButton icon={copied ? Check : Copy} label={copied ? "Copied" : "Copy room link"} onClick={copyLink} />
            </div>
          </PanelFooter>
        </>
      }
    />
  );
}
