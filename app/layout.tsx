import { readdirSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { InlineScript } from "@/components/layout/InlineScript";
import { SettingsBootstrap } from "@/components/layout/SettingsBootstrap";
import { themeScript } from "@/lib/themes/applyTheme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "arxchess",
  description: "A chess platform — play, analyze, solve puzzles, and pit engines against each other.",
};

function listSoundFiles(): string[] {
  try {
    return readdirSync(path.join(process.cwd(), "public", "sounds")).filter((f) => !f.startsWith("."));
  } catch {
    return [];
  }
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme and the board/piece CSS variables are set by the inline script before paint.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <InlineScript html={themeScript()} />
      </head>
      <body>
        <SettingsBootstrap soundFiles={listSoundFiles()} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
