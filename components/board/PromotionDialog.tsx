"use client";

import type { PieceColor } from "@/lib/chess/types";

const PIECES: { symbol: string; label: string }[] = [
  { symbol: "q", label: "Queen" },
  { symbol: "r", label: "Rook" },
  { symbol: "b", label: "Bishop" },
  { symbol: "n", label: "Knight" },
];

const GLYPH: Record<PieceColor, Record<string, string>> = {
  w: { q: "♕", r: "♖", b: "♗", n: "♘" },
  b: { q: "♛", r: "♜", b: "♝", n: "♞" },
};

export function PromotionDialog({
  color,
  onSelect,
  onCancel,
}: {
  color: PieceColor;
  onSelect: (piece: string) => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-center text-sm font-medium text-neutral-600 dark:text-neutral-300">
          Promote to
        </p>
        <div className="flex gap-2">
          {PIECES.map((p) => (
            <button
              key={p.symbol}
              onClick={() => onSelect(p.symbol)}
              className="flex h-16 w-16 items-center justify-center rounded-md border border-neutral-200 text-4xl leading-none hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-700"
              aria-label={p.label}
              title={p.label}
            >
              {GLYPH[color][p.symbol]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
