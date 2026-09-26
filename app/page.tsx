import Link from "next/link";
import { Bot, Globe, Microscope, Puzzle, Swords, Users, type LucideIcon } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";

// A quiet Italian Game position for the hero board.
const HERO_FEN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5";

const MODES: { href: string; title: string; description: string; icon: LucideIcon }[] = [
  { href: "/play/ai", title: "Play vs AI", description: "Stockfish from beginner to expert, right in your browser.", icon: Bot },
  { href: "/play/online", title: "Online", description: "Send a friend a room link and play live.", icon: Globe },
  { href: "/play/local", title: "Pass & Play", description: "Two players, one screen, with clocks.", icon: Users },
  { href: "/puzzles", title: "Puzzles", description: "Find the mating move and build a streak.", icon: Puzzle },
  { href: "/analysis", title: "Analysis", description: "Step through games with a live engine eval.", icon: Microscope },
  { href: "/arena", title: "Arena", description: "Pit two engines against each other and watch.", icon: Swords },
];

const primaryButton =
  "inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-body font-bold text-on-accent shadow-raised transition-[background-color,transform,box-shadow] duration-100 hover:bg-accent-hover active:translate-y-1 active:shadow-none";
const secondaryButton =
  "inline-flex h-12 items-center justify-center rounded-md bg-raised px-6 text-body font-semibold text-fg transition-colors hover:bg-hover";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div>
          <p className="text-label font-semibold uppercase tracking-[0.12em] text-accent-fg">arxchess</p>
          <h1 className="mt-3 text-[2.75rem] font-bold leading-[1.1] tracking-[-0.02em] md:text-[3.5rem]">
            Play chess.
            <br />
            Get better.
          </h1>
          <p className="mt-4 max-w-md text-body text-fg-secondary">
            Play the engine, a friend online, or across the table. Then analyze the game, train with puzzles, or let two
            engines fight it out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/play/ai" className={primaryButton}>
              Play vs AI
            </Link>
            <Link href="/play/online" className={secondaryButton}>
              Play a friend
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[440px]">
          <ChessBoard fen={HERO_FEN} orientation="white" interactive={false} turnColor="w" lastMove={{ from: "f8", to: "c5" }} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-title font-bold">Modes</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-lg bg-panel p-5 transition-colors hover:bg-raised"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-raised text-accent-fg transition-colors group-hover:bg-accent group-hover:text-on-accent">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-body font-bold">{title}</span>
                <span className="mt-0.5 block text-caption text-fg-secondary">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
