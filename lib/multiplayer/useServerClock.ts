"use client";

import { useEffect, useState } from "react";
import type { PlayerColor } from "./protocol";

export function useServerClock(params: {
  clockMs: { w: number; b: number };
  lastMoveAt: number;
  turn: PlayerColor;
  isRunning: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!params.isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [params.isRunning]);

  const elapsed = params.isRunning ? Math.max(0, now - params.lastMoveAt) : 0;
  return {
    w: Math.max(0, params.clockMs.w - (params.turn === "w" ? elapsed : 0)),
    b: Math.max(0, params.clockMs.b - (params.turn === "b" ? elapsed : 0)),
  };
}
