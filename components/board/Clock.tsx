"use client";

import { useEffect, useRef, useState } from "react";
import type { PieceColor } from "@/lib/chess/types";

export type ClockTimes = { w: number; b: number };

export function useChessClock({
  initialSeconds,
  turn,
  isRunning,
  onFlagFall,
}: {
  initialSeconds: number;
  turn: PieceColor;
  isRunning: boolean;
  onFlagFall: (color: PieceColor) => void;
}) {
  const [times, setTimes] = useState<ClockTimes>({
    w: initialSeconds * 1000,
    b: initialSeconds * 1000,
  });
  const flagged = useRef(false);

  useEffect(() => {
    if (!isRunning || flagged.current) return;
    const id = setInterval(() => {
      setTimes((prev) => ({ ...prev, [turn]: Math.max(0, prev[turn] - 100) }));
    }, 100);
    return () => clearInterval(id);
  }, [isRunning, turn]);

  useEffect(() => {
    if (!flagged.current && (times.w === 0 || times.b === 0)) {
      flagged.current = true;
      onFlagFall(times.w === 0 ? "w" : "b");
    }
  }, [times, onFlagFall]);

  function reset(seconds = initialSeconds) {
    flagged.current = false;
    setTimes({ w: seconds * 1000, b: seconds * 1000 });
  }

  return { times, reset };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ClockDisplay({
  label,
  ms,
  active,
}: {
  label: string;
  ms: number;
  active: boolean;
}) {
  const low = ms <= 30_000;
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-2 font-mono text-lg tabular-nums ${
        active
          ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
          : "border-neutral-200 dark:border-neutral-700"
      } ${low ? "text-red-600" : ""}`}
    >
      <span className="font-sans text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <span>{formatTime(ms)}</span>
    </div>
  );
}
