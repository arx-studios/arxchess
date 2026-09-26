"use client";

import { X } from "lucide-react";
import { useState, type ReactNode } from "react";

/**
 * Whether the game-over card is showing: true once `result` is set, until the
 * user closes it. A different `result` (compared with Object.is) shows it again.
 */
export function useResultCard(result: unknown): [boolean, () => void] {
  const [dismissed, setDismissed] = useState<unknown>(null);
  const open = result != null && !Object.is(result, dismissed);
  return [open, () => setDismissed(result)];
}

/** Result card centered over the board. Rendered inside GameLayout's `overlay`. */
export function GameOverCard({
  title,
  reason,
  onClose,
  children,
}: {
  title: string;
  reason?: string;
  onClose: () => void;
  /** The action buttons (primary first). */
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-sm bg-scrim p-4">
      <div
        role="dialog"
        aria-label={title}
        className="relative w-full max-w-[320px] animate-[gameover-in_150ms_ease-out] rounded-lg bg-panel p-6 text-center shadow-overlay"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
        <p className="text-display font-bold">{title}</p>
        {reason && <p className="mt-1 text-caption text-fg-secondary">{reason}</p>}
        <div className="mt-5 flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
