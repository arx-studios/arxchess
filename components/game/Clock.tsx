"use client";

import { useEffect, useRef } from "react";
import { playSound } from "@/lib/sound/sounds";

const LOW_MS = 20_000;
const WARN_MS = 10_000;

function format(ms: number): string {
  if (ms < WARN_MS) {
    // Tenths under ten seconds, like chess.com.
    const tenths = Math.floor(ms / 100);
    return `0:${String(Math.floor(tenths / 10)).padStart(2, "0")}.${tenths % 10}`;
  }
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function Clock({ ms, live }: { ms: number; live: boolean }) {
  const low = ms < LOW_MS;
  const warned = useRef(false);

  useEffect(() => {
    if (live && ms < WARN_MS && ms > 0 && !warned.current) {
      warned.current = true;
      playSound("low-time");
    }
    if (ms >= WARN_MS) warned.current = false;
  }, [live, ms]);

  const tone = low && live ? "bg-danger text-on-accent" : live ? "bg-clock-live text-clock-live-fg" : "bg-raised text-fg-muted";

  return (
    <div
      className={`tabular flex h-11 min-w-[7.5rem] items-center justify-end rounded-sm px-3 text-clock font-bold transition-colors ${tone}`}
      aria-label={`Clock ${format(ms)}`}
    >
      {format(ms)}
    </div>
  );
}
