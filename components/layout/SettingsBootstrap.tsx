"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings/store";
import { applyTheme, THEME_INDEX } from "@/lib/themes/applyTheme";
import { DEFAULT_BOARD, DEFAULT_PIECES } from "@/lib/themes/catalog";
import { setAvailableSounds } from "@/lib/sound/sounds";

const DEFAULTS = { board: DEFAULT_BOARD, pieces: DEFAULT_PIECES };

/**
 * Loads saved settings and keeps <html>'s theme in sync with them and with the OS.
 * `soundFiles` is the server's listing of public/sounds.
 */
export function SettingsBootstrap({ soundFiles }: { soundFiles: string[] }) {
  useEffect(() => {
    setAvailableSounds(soundFiles);
  }, [soundFiles]);

  useEffect(() => {
    const apply = () => applyTheme(useSettings.getState(), THEME_INDEX, DEFAULTS);
    const unsubscribe = useSettings.subscribe((s, prev) => {
      if (s.appearance !== prev.appearance || s.board !== prev.board || s.pieces !== prev.pieces) apply();
    });
    useSettings.persist.rehydrate();

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onOsChange = () => {
      if (useSettings.getState().appearance === "system") apply();
    };
    media.addEventListener("change", onOsChange);
    return () => {
      unsubscribe();
      media.removeEventListener("change", onOsChange);
    };
  }, []);

  return null;
}
