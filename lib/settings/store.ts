import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BOARD, DEFAULT_PIECES } from "@/lib/themes/catalog";

export type Appearance = "system" | "dark" | "light";

export type Settings = {
  appearance: Appearance;
  board: string;
  pieces: string;
  soundEnabled: boolean;
  volume: number; // 0..1
  playerName: string;
};

type SettingsActions = {
  set: (patch: Partial<Settings>) => void;
};

export const SETTINGS_STORAGE_KEY = "arxchess-settings";

export const DEFAULT_SETTINGS: Settings = {
  appearance: "system",
  board: DEFAULT_BOARD,
  pieces: DEFAULT_PIECES,
  soundEnabled: true,
  volume: 0.7,
  playerName: "",
};

export const useSettings = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (patch) => set(patch),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      // Rehydrated from localStorage after mount (SettingsBootstrap) so the first
      // client render matches the server's; visual settings are already applied
      // before paint by the inline theme script.
      skipHydration: true,
      partialize: (s): Settings => ({
        appearance: s.appearance,
        board: s.board,
        pieces: s.pieces,
        soundEnabled: s.soundEnabled,
        volume: s.volume,
        playerName: s.playerName,
      }),
    },
  ),
);

export const displayName = (name: string) => name.trim() || "You";
