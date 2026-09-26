"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Globe,
  House,
  Microscope,
  Moon,
  Puzzle,
  Settings as SettingsIcon,
  Sun,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useSettings } from "@/lib/settings/store";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/play/ai", label: "Play vs AI", icon: Bot },
  { href: "/play/local", label: "Pass & Play", icon: Users },
  { href: "/play/online", label: "Online", icon: Globe },
  { href: "/puzzles", label: "Puzzles", icon: Puzzle },
  { href: "/analysis", label: "Analysis", icon: Microscope },
  { href: "/arena", label: "Arena", icon: Swords },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/play/ai", label: "Play", icon: Bot },
  { href: "/play/online", label: "Online", icon: Globe },
  { href: "/puzzles", label: "Puzzles", icon: Puzzle },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-12 items-center gap-3 rounded-md px-3 text-label transition-colors justify-center xl:justify-start ${
        active ? "bg-raised text-fg" : "text-fg-secondary hover:bg-hover hover:text-fg"
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent-fg" />}
      <Icon size={24} strokeWidth={1.75} className="shrink-0" />
      <span className="hidden xl:inline">{item.label}</span>
    </Link>
  );
}

function ThemeToggle() {
  const setSettings = useSettings((s) => s.set);
  const toggle = () => {
    const current = document.documentElement.getAttribute("data-theme");
    setSettings({ appearance: current === "light" ? "dark" : "light" });
  };
  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle light / dark"
      className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-label text-fg-secondary transition-colors hover:bg-hover hover:text-fg justify-center xl:justify-start"
    >
      <Sun size={24} strokeWidth={1.75} className="shrink-0 light:hidden" />
      <Moon size={24} strokeWidth={1.75} className="hidden shrink-0 light:block" />
      <span className="hidden xl:inline">
        <span className="light:hidden">Light mode</span>
        <span className="hidden light:inline">Dark mode</span>
      </span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden w-16 shrink-0 flex-col gap-1 bg-sidebar px-2 py-4 md:flex xl:w-[200px] xl:px-3">
        <Link href="/" className="mb-4 flex h-10 items-center justify-center px-1 xl:justify-start xl:px-3">
          <span className="text-title font-bold tracking-[-0.02em] xl:hidden">a</span>
          <span className="hidden text-title font-bold tracking-[-0.02em] xl:inline">arxchess</span>
        </Link>
        {NAV.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <div className="mt-auto flex flex-col gap-1">
          <ThemeToggle />
          <SidebarLink
            item={{ href: "/settings", label: "Settings", icon: SettingsIcon }}
            active={isActive(pathname, "/settings")}
          />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-line bg-sidebar md:hidden">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-caption ${
                active ? "text-accent-fg" : "text-fg-secondary"
              }`}
            >
              <Icon size={22} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
