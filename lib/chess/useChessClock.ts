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
