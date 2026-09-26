"use client";

import { useEffect, useRef } from "react";
import { toMoveListEntries } from "@/lib/chess/types";

export function MoveList({
  sanHistory,
  currentIndex,
  onSelectMove,
}: {
  sanHistory: string[];
  /** Highlights this ply (0-based); defaults to the last move. */
  currentIndex?: number;
  /** Makes moves clickable (Analysis). */
  onSelectMove?: (index: number) => void;
}) {
  const rows = toMoveListEntries(sanHistory);
  const current = currentIndex ?? sanHistory.length - 1;
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current?.querySelector("[data-current='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [current, sanHistory.length]);

  if (rows.length === 0) {
    return <p className="px-4 py-3 text-body text-fg-muted">No moves yet.</p>;
  }

  const cell = (san: string | undefined, index: number) => {
    if (!san) return <span />;
    const isCurrent = index === current;
    const cls = `rounded-sm px-2 py-0.5 text-left ${isCurrent ? "bg-raised font-bold text-fg" : "text-fg"} ${
      onSelectMove ? "cursor-pointer hover:bg-hover" : ""
    }`;
    return onSelectMove ? (
      <button type="button" data-current={isCurrent} className={cls} onClick={() => onSelectMove(index)}>
        {san}
      </button>
    ) : (
      <span data-current={isCurrent} className={cls}>
        {san}
      </span>
    );
  };

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
      {rows.map((row, i) => (
        <div
          key={row.moveNumber}
          className={`grid grid-cols-[3rem_1fr_1fr] items-center gap-1 px-2 py-0.5 text-body ${
            i % 2 ? "bg-app/40" : ""
          }`}
        >
          <span className="tabular pl-2 text-fg-secondary">{row.moveNumber}.</span>
          {cell(row.white, (row.moveNumber - 1) * 2)}
          {cell(row.black, (row.moveNumber - 1) * 2 + 1)}
        </div>
      ))}
    </div>
  );
}
