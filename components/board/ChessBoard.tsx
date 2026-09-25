"use client";

import { useMemo, useState } from "react";
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from "react-chessboard";

export type LastMoveHighlight = { from: string; to: string } | null;

type ChessBoardProps = {
  fen: string;
  orientation: "white" | "black";
  interactive?: boolean;
  turnColor: "w" | "b";
  lastMove?: LastMoveHighlight;
  checkSquare?: string | null;
  legalDestinations: (square: string) => { to: string; promotion?: boolean }[];
  onMove: (from: string, to: string) => boolean;
  onPromotionNeeded: (from: string, to: string) => void;
};

const SELECTED_STYLE: React.CSSProperties = { boxShadow: "inset 0 0 0 3px rgba(59,130,246,0.85)" };
const LAST_MOVE_STYLE: React.CSSProperties = { backgroundColor: "rgba(250, 204, 21, 0.45)" };
const CHECK_STYLE: React.CSSProperties = { backgroundColor: "rgba(239, 68, 68, 0.55)" };
const LEGAL_DOT: React.CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgba(15,23,42,0.35) 22%, transparent 25%)",
};
const LEGAL_CAPTURE_RING: React.CSSProperties = {
  boxShadow: "inset 0 0 0 4px rgba(15,23,42,0.35)",
};

export function ChessBoard({
  fen,
  orientation,
  interactive = true,
  turnColor,
  lastMove,
  checkSquare,
  legalDestinations,
  onMove,
  onPromotionNeeded,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const destinations = useMemo(
    () => (selected ? legalDestinations(selected) : []),
    [selected, legalDestinations, fen],
  );

  function attemptMove(from: string, to: string): boolean {
    const candidate = legalDestinations(from).find((d) => d.to === to);
    if (!candidate) return false;
    if (candidate.promotion) {
      onPromotionNeeded(from, to);
      return false;
    }
    return onMove(from, to);
  }

  function handlePieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    setSelected(null);
    if (!targetSquare) return false;
    return attemptMove(sourceSquare, targetSquare);
  }

  function handleSquareClick({ square, piece }: SquareHandlerArgs) {
    if (!interactive) return;

    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      const moved = attemptMove(selected, square);
      if (moved) {
        setSelected(null);
        return;
      }
      // fall through to allow reselecting a different own piece
    }

    if (piece && piece.pieceType[0].toLowerCase() === turnColor) {
      setSelected(square);
    } else {
      setSelected(null);
    }
  }

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { ...squareStyles[lastMove.from], ...LAST_MOVE_STYLE };
    squareStyles[lastMove.to] = { ...squareStyles[lastMove.to], ...LAST_MOVE_STYLE };
  }
  if (checkSquare) {
    squareStyles[checkSquare] = { ...squareStyles[checkSquare], ...CHECK_STYLE };
  }
  if (selected) {
    squareStyles[selected] = { ...squareStyles[selected], ...SELECTED_STYLE };
    for (const dest of destinations) {
      squareStyles[dest.to] = {
        ...squareStyles[dest.to],
        ...(dest.promotion ? LEGAL_CAPTURE_RING : LEGAL_DOT),
      };
    }
  }

  return (
    <Chessboard
      options={{
        position: fen,
        boardOrientation: orientation,
        allowDragging: interactive,
        onPieceDrop: handlePieceDrop,
        onSquareClick: handleSquareClick,
        squareStyles,
        animationDurationInMs: 180,
        darkSquareStyle: { backgroundColor: "#6d8a52" },
        lightSquareStyle: { backgroundColor: "#eeeed2" },
      }}
    />
  );
}
