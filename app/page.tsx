import Link from "next/link";

const MODES: { href: string; title: string; description: string; ready: boolean }[] = [
  {
    href: "/play/local",
    title: "Pass & Play",
    description: "Two players, one board, no setup.",
    ready: true,
  },
  {
    href: "/play/ai",
    title: "vs AI",
    description: "Play Stockfish at an adjustable strength.",
    ready: true,
  },
  {
    href: "/play/online",
    title: "Online",
    description: "Real-time multiplayer over a shared room link.",
    ready: true,
  },
  {
    href: "/analysis",
    title: "Analysis Board",
    description: "Import a PGN and get engine evaluation.",
    ready: true,
  },
  {
    href: "/puzzles",
    title: "Puzzles",
    description: "Solve mate-in-1 tactics.",
    ready: true,
  },
  {
    href: "/arena",
    title: "Arena",
    description: "Pit engines against each other and watch them play.",
    ready: true,
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Play chess.</h1>
      <p className="mt-1 text-neutral-500">Pick a mode to get started.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="group rounded-lg border border-neutral-200 p-5 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{mode.title}</h2>
              {!mode.ready && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                  soon
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-500">{mode.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
