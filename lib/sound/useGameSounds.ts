"use client";

import { useEffect, useRef } from "react";
import { playSound, soundForSan } from "./sounds";

/** Plays move / game-start / game-end sounds as a game's move list and result change. */
export function useGameSounds(sanHistory: string[], finished: boolean) {
  const seen = useRef<{ length: number; finished: boolean } | null>(null);

  useEffect(() => {
    const prev = seen.current;
    seen.current = { length: sanHistory.length, finished };
    if (!prev) return; // first render: nothing happened yet

    if (sanHistory.length === prev.length + 1) playSound(soundForSan(sanHistory[sanHistory.length - 1]));
    else if (sanHistory.length === 0 && prev.length > 0) playSound("game-start");

    if (finished && !prev.finished) playSound("game-end");
  }, [sanHistory, finished]);
}
