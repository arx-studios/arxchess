import { useSettings } from "@/lib/settings/store";

// Drop files named after these events into public/sounds (e.g. public/sounds/move.mp3);
// any that are missing are simply silent.
export const SOUND_EVENTS = [
  "move",
  "capture",
  "check",
  "castle",
  "promote",
  "game-start",
  "game-end",
  "premove",
  "illegal",
  "low-time",
] as const;
export type SoundEvent = (typeof SOUND_EVENTS)[number];

const SOUND_EXTENSIONS = ["mp3", "ogg", "wav", "webm"];

// Filled from the server's listing of public/sounds (see SettingsBootstrap).
const available = new Map<SoundEvent, string>();
const cache = new Map<SoundEvent, HTMLAudioElement>();

export function setAvailableSounds(files: string[]) {
  available.clear();
  for (const file of files) {
    const dot = file.lastIndexOf(".");
    const name = file.slice(0, dot) as SoundEvent;
    if ((SOUND_EVENTS as readonly string[]).includes(name) && SOUND_EXTENSIONS.includes(file.slice(dot + 1))) {
      available.set(name, `/sounds/${file}`);
    }
  }
}

export const hasSound = (event: SoundEvent) => available.has(event);

export function playSound(event: SoundEvent) {
  if (typeof window === "undefined") return;
  const { soundEnabled, volume } = useSettings.getState();
  const src = available.get(event);
  if (!soundEnabled || volume <= 0 || !src) return;
  let audio = cache.get(event);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    cache.set(event, audio);
  }
  // A fresh node per play so quick successive moves can overlap.
  const instance = audio.cloneNode(true) as HTMLAudioElement;
  instance.volume = volume;
  void instance.play().catch(() => {});
}

/** The sound chess.com would play for a move written in SAN. */
export function soundForSan(san: string): SoundEvent {
  if (san.includes("#") || san.includes("+")) return "check";
  if (san.startsWith("O-O")) return "castle";
  if (san.includes("=")) return "promote";
  if (san.includes("x")) return "capture";
  return "move";
}
