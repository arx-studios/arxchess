"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, Volume2 } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useSettings, type Appearance } from "@/lib/settings/store";
import { BOARDS, PIECE_SETS, boardThumb, pieceImage } from "@/lib/themes/catalog";
import { playSound, SOUND_EVENTS, hasSound } from "@/lib/sound/sounds";

const noSubscribe = () => () => {};

const PREVIEW_FEN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5";

const APPEARANCES: { value: Appearance; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-panel p-5">
      <h2 className="text-title font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-caption text-fg-secondary">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const selectedRing = "outline-2 outline-offset-2 outline-accent-fg";

export default function SettingsPage() {
  const settings = useSettings();
  const soundsAvailable = useSyncExternalStore(
    noSubscribe,
    () => SOUND_EVENTS.filter(hasSound).length,
    () => 0,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <h1 className="text-display font-bold">Settings</h1>
      <p className="mt-1 text-body text-fg-secondary">Saved in this browser and applied instantly.</p>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Profile" description="Shown on your player card.">
            <input
              value={settings.playerName}
              onChange={(e) => settings.set({ playerName: e.target.value.slice(0, 24) })}
              placeholder="You"
              aria-label="Your name"
              className="h-11 w-full max-w-sm rounded-md bg-raised px-3 text-body text-fg outline-none placeholder:text-fg-muted focus:outline-2 focus:outline-accent-fg"
            />
          </Section>

          <Section title="Appearance">
            <div role="radiogroup" aria-label="Appearance" className="grid max-w-sm grid-cols-3 gap-2">
              {APPEARANCES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={settings.appearance === value}
                  onClick={() => settings.set({ appearance: value })}
                  className={`flex h-16 flex-col items-center justify-center gap-1 rounded-md text-label font-semibold transition-colors ${
                    settings.appearance === value ? `bg-raised ${selectedRing}` : "bg-raised/50 text-fg-secondary hover:bg-hover"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  {label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Board" description={`${BOARDS.length} boards`}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {BOARDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => settings.set({ board: b.id })}
                  aria-pressed={settings.board === b.id}
                  className="group flex flex-col gap-1.5 text-left"
                >
                  <span
                    className={`aspect-square w-full rounded-sm bg-cover bg-center transition-transform group-hover:scale-[1.03] ${
                      settings.board === b.id ? selectedRing : ""
                    }`}
                    style={{ backgroundImage: `url(${boardThumb(b)})` }}
                  />
                  <span className={`truncate text-caption ${settings.board === b.id ? "font-semibold text-fg" : "text-fg-secondary"}`}>
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Pieces" description={`${PIECE_SETS.length} piece sets`}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {PIECE_SETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => settings.set({ pieces: p.id })}
                  aria-pressed={settings.pieces === p.id}
                  className="group flex flex-col gap-1.5 text-left"
                >
                  <span
                    className={`flex aspect-square w-full items-end justify-center overflow-hidden rounded-sm bg-cover bg-center transition-transform group-hover:scale-[1.03] ${
                      settings.pieces === p.id ? selectedRing : ""
                    }`}
                    style={{ backgroundImage: "var(--board-image)" }}
                  >
                    {(["wn", "bq"] as const).map((code) => (
                      <span
                        key={code}
                        className="h-1/2 w-1/2 bg-contain bg-bottom bg-no-repeat"
                        style={{ backgroundImage: `url(${pieceImage(p.id, code)})` }}
                      />
                    ))}
                  </span>
                  <span className={`truncate text-caption ${settings.pieces === p.id ? "font-semibold text-fg" : "text-fg-secondary"}`}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Sound">
            <div className="flex max-w-sm flex-col gap-4">
              <label className="flex items-center justify-between gap-3 text-body">
                Sound effects
                <Switch
                  label="Sound effects"
                  checked={settings.soundEnabled}
                  onChange={(on) => settings.set({ soundEnabled: on })}
                />
              </label>
              <label className="flex items-center gap-3 text-body">
                <Volume2 size={20} strokeWidth={1.75} className="shrink-0 text-fg-secondary" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  disabled={!settings.soundEnabled}
                  onChange={(e) => settings.set({ volume: Number(e.target.value) })}
                  aria-label="Volume"
                  className="w-full accent-[var(--accent)] disabled:opacity-40"
                />
              </label>
              <div className="flex items-center gap-3">
                <Button onClick={() => playSound("move")} disabled={!settings.soundEnabled}>
                  Test sound
                </Button>
                <span className="text-caption text-fg-muted">
                  {soundsAvailable
                    ? `${soundsAvailable} of ${SOUND_EVENTS.length} sounds installed`
                    : "No sound files yet — add them to public/sounds"}
                </span>
              </div>
            </div>
          </Section>
        </div>

        <div className="lg:sticky lg:top-6">
          <div className="rounded-lg bg-panel p-4">
            <p className="mb-3 text-label font-semibold text-fg-secondary">Preview</p>
            <div className="aspect-square w-full">
              <ChessBoard fen={PREVIEW_FEN} orientation="white" interactive={false} turnColor="w" lastMove={{ from: "f8", to: "c5" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
