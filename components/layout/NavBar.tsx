import Link from "next/link";

const LINKS = [
  { href: "/play/local", label: "Pass & Play" },
  { href: "/play/ai", label: "vs AI" },
  { href: "/play/online", label: "Online" },
  { href: "/analysis", label: "Analysis" },
  { href: "/puzzles", label: "Puzzles" },
  { href: "/arena", label: "Arena" },
];

export function NavBar() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          arxchess
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-300">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-neutral-950 dark:hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
