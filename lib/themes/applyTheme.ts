import { BOARDS, PIECE_SETS, DEFAULT_BOARD, DEFAULT_PIECES } from "./catalog";
import { SETTINGS_STORAGE_KEY, type Settings } from "@/lib/settings/store";

/** What the pre-paint script needs to know about each board: file, light, dark. */
export type ThemeIndex = { boards: Record<string, [string, string, string]>; pieces: string[] };

export const THEME_INDEX: ThemeIndex = {
  boards: Object.fromEntries(BOARDS.map((b) => [b.id, [b.file, b.light, b.dark]])),
  pieces: PIECE_SETS.map((p) => p.id),
};

/**
 * Puts the chosen appearance, board and pieces onto <html> (data-theme + CSS
 * variables the board styles read). Must stay self-contained: its source is
 * also inlined into <head> to run before first paint.
 */
export function applyTheme(
  settings: Partial<Pick<Settings, "appearance" | "board" | "pieces">>,
  index: ThemeIndex,
  defaults: { board: string; pieces: string },
) {
  const root = document.documentElement;
  const appearance = settings.appearance || "system";
  const theme =
    appearance === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : appearance;
  root.setAttribute("data-theme", theme);

  const board = index.boards[settings.board || ""] || index.boards[defaults.board];
  root.style.setProperty("--board-image", "url(/themes/boards/" + board[0] + ")");
  // Coordinates take the opposite square's color, like chess.com.
  root.style.setProperty("--coord-on-light", board[2]);
  root.style.setProperty("--coord-on-dark", board[1]);

  const pieces = index.pieces.indexOf(settings.pieces || "") >= 0 ? settings.pieces : defaults.pieces;
  const codes = ["wp", "wn", "wb", "wr", "wq", "wk", "bp", "bn", "bb", "br", "bq", "bk"];
  for (let i = 0; i < codes.length; i++) {
    root.style.setProperty("--piece-" + codes[i], "url(/themes/pieces/" + pieces + "/" + codes[i] + ".png)");
  }
}

/** Inline <head> script: read saved settings and apply them before anything paints. */
export function themeScript(): string {
  const defaults = { board: DEFAULT_BOARD, pieces: DEFAULT_PIECES };
  return `(function(){var s={};try{s=JSON.parse(localStorage.getItem(${JSON.stringify(
    SETTINGS_STORAGE_KEY,
  )})||"{}").state||{}}catch(e){}(${applyTheme.toString()})(s,${JSON.stringify(THEME_INDEX)},${JSON.stringify(defaults)})})()`;
}
