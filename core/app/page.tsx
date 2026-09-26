"use client";

import { ChessBoard } from "@/components/board/ChessBoard";
import { useLocalGameStore } from "@/lib/stores/localGameStore";

export default function LocalPlayPage() {
  const { fen, turn, checkSquare, result, lastMove, boardOrientation, makeMove, legalDestinations } =
    useLocalGameStore();

  return (
    <div className="flex h-dvh w-screen items-center justify-center overflow-hidden">
      <div className="w-[min(100vw,100dvh)]">
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
      </div>
    </div>
  );
}
