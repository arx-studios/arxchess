"use client";

import { useEffect, useRef, useState } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrawBrushes, DrawShape } from "@lichess-org/chessground/draw";
import type { Dests, Key } from "@lichess-org/chessground/types";
import "@lichess-org/chessground/assets/chessground.base.css";
import "./chessboard-theme.css";

export type LastMoveHighlight = { from: string; to: string } | null;
export type BoardArrow = { from: string; to: string };

type Destination = { to: string; promotion?: boolean };

type ChessBoardProps = {
  fen: string;
  orientation: "white" | "black";
  interactive?: boolean;
  turnColor: "w" | "b";
  lastMove?: LastMoveHighlight;
  checkSquare?: string | null;
  arrows?: BoardArrow[];
  /** Omit both for a read-only/spectator board (e.g. Arena mode). */
  legalDestinations?: (square: string) => Destination[];
  onMove?: (from: string, to: string, promotion?: string) => boolean;
};

// Right-click drawing colors (plain, shift, alt, ctrl/meta), chess.com-like.
const BRUSHES: DrawBrushes = {
  green: { key: "g", color: "#ffaa00", opacity: 1, lineWidth: 10 },
  red: { key: "r", color: "#f0503c", opacity: 1, lineWidth: 10 },
  blue: { key: "b", color: "#52b0dc", opacity: 1, lineWidth: 10 },
  yellow: { key: "y", color: "#9fcf3f", opacity: 1, lineWidth: 10 },
  best: { key: "best", color: "#3b82f6", opacity: 1, lineWidth: 10 },
};

const FILES = "abcdefgh";

const toColor = (c: "w" | "b") => (c === "w" ? "white" : "black") as "white" | "black";

function squaresWithColor(fen: string, color: "w" | "b"): string[] {
  const out: string[] = [];
  fen
    .split(" ")[0]
    .split("/")
    .forEach((row, i) => {
      let file = 0;
      for (const ch of row) {
        if (/\d/.test(ch)) {
          file += Number(ch);
          continue;
        }
        if ((color === "w") === (ch === ch.toUpperCase())) out.push(`${FILES[file]}${8 - i}`);
        file++;
      }
    });
  return out;
}

function computeDests(fen: string, turnColor: "w" | "b", legal?: ChessBoardProps["legalDestinations"]) {
  const dests: Dests = new Map();
  const promotions = new Set<string>();
  if (!legal) return { dests, promotions };
  for (const from of squaresWithColor(fen, turnColor)) {
    const moves = legal(from);
    if (!moves.length) continue;
    dests.set(from as Key, moves.map((m) => m.to as Key));
    for (const m of moves) if (m.promotion) promotions.add(from + m.to);
  }
  return { dests, promotions };
}

type PendingPromotion = { from: string; to: string; color: "w" | "b" };

export function ChessBoard(props: ChessBoardProps) {
  const { fen, orientation, interactive = true, turnColor, lastMove, checkSquare, arrows } = props;

  const canMove = interactive && !!props.onMove && !!props.legalDestinations;
  const { dests, promotions } = computeDests(fen, turnColor, canMove ? props.legalDestinations : undefined);
  const destsKey = [...dests].map(([k, v]) => `${k}:${v.join(",")}`).join(";");
  const arrowsKey = (arrows ?? []).map((a) => a.from + a.to).join(",");

  const elRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<Api | null>(null);
  const appliedFenRef = useRef<string | null>(null);
  // Chessground registers its callbacks once, so they read live values from here.
  const live = useRef({ props, canMove, dests, promotions });
  live.current = { props, canMove, dests, promotions };

  const [pending, setPending] = useState<PendingPromotion | null>(null);

  function buildConfig(forceFen: boolean): Config {
    const { props: p, canMove: movable, dests: d } = live.current;
    const autoShapes: DrawShape[] = (p.arrows ?? []).map((a) => ({
      orig: a.from as Key,
      dest: a.to as Key,
      brush: "best",
    }));
    const config: Config = {
      orientation: p.orientation,
      turnColor: toColor(p.turnColor),
      lastMove: p.lastMove ? [p.lastMove.from as Key, p.lastMove.to as Key] : undefined,
      check: !!p.checkSquare,
      movable: { color: movable ? toColor(p.turnColor) : undefined, dests: d },
      drawable: { autoShapes },
    };
    // Only hand chessground a FEN when the position really changed; re-setting
    // it would interrupt drags and wipe the user's drawn arrows.
    if (forceFen || appliedFenRef.current !== p.fen) {
      config.fen = p.fen;
      appliedFenRef.current = p.fen;
    }
    return config;
  }

  function resync() {
    groundRef.current?.set(buildConfig(true));
  }

  function handleUserMove(orig: Key, dest: Key) {
    const { props: p, promotions: promos } = live.current;
    if (promos.has(orig + dest)) {
      setPending({ from: orig, to: dest, color: p.turnColor });
      return;
    }
    if (!(p.onMove?.(orig, dest) ?? false)) resync();
  }
  const handleUserMoveRef = useRef(handleUserMove);
  handleUserMoveRef.current = handleUserMove;

  useEffect(() => {
    if (!elRef.current) return;
    const p = live.current.props;
    const ground = Chessground(elRef.current, {
      fen: p.fen,
      orientation: p.orientation,
      coordinates: true,
      ranksPosition: "left",
      disableContextMenu: true,
      animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      movable: {
        free: false,
        showDests: true,
        rookCastle: false,
        events: { after: (orig, dest) => handleUserMoveRef.current(orig, dest) },
      },
      premovable: { enabled: false },
      draggable: { enabled: true, showGhost: true },
      drawable: { enabled: true, visible: true, brushes: BRUSHES },
    });
    groundRef.current = ground;
    appliedFenRef.current = p.fen;
    ground.set(buildConfig(false));
    return () => {
      ground.destroy();
      groundRef.current = null;
      appliedFenRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    groundRef.current?.set(buildConfig(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, orientation, turnColor, lastMove?.from, lastMove?.to, checkSquare, destsKey, arrowsKey, canMove]);

  useEffect(() => {
    setPending(null);
  }, [fen]);

  function choosePromotion(piece: string) {
    if (!pending) return;
    const ok = live.current.props.onMove?.(pending.from, pending.to, piece) ?? false;
    setPending(null);
    if (!ok) resync();
  }

  function cancelPromotion() {
    setPending(null);
    resync();
  }

  return (
    <div className="arx-board">
      <div ref={elRef} className="h-full w-full" />
      {pending && (
        <PromotionPicker
          pending={pending}
          orientation={orientation}
          onChoose={choosePromotion}
          onCancel={cancelPromotion}
        />
      )}
    </div>
  );
}

const PROMOTION_PIECES = [
  { piece: "q", name: "queen" },
  { piece: "n", name: "knight" },
  { piece: "r", name: "rook" },
  { piece: "b", name: "bishop" },
];

function PromotionPicker({
  pending,
  orientation,
  onChoose,
  onCancel,
}: {
  pending: PendingPromotion;
  orientation: "white" | "black";
  onChoose: (piece: string) => void;
  onCancel: () => void;
}) {
  const file = FILES.indexOf(pending.to[0]);
  const col = orientation === "white" ? file : 7 - file;
  const atTop = (orientation === "white") === (pending.to[1] === "8");

  return (
    <div className="absolute inset-0 z-20 rounded-[4px] bg-black/25" onClick={onCancel}>
      <div
        className={`absolute flex w-[12.5%] overflow-hidden rounded-[4px] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.45)] ${
          atTop ? "top-0 flex-col" : "bottom-0 flex-col-reverse"
        }`}
        style={{ left: `${col * 12.5}%` }}
        onClick={(e) => e.stopPropagation()}
      >
        {PROMOTION_PIECES.map(({ piece, name }) => (
          <button
            key={piece}
            onClick={() => onChoose(piece)}
            className="aspect-square w-full bg-contain bg-center bg-no-repeat transition-colors hover:bg-neutral-200"
            style={{ backgroundImage: `url(/themes/pieces/neo/${pending.color}${piece}.png)` }}
            aria-label={`Promote to ${name}`}
          />
        ))}
        <button
          onClick={onCancel}
          className="flex h-[6.25cqw] w-full items-center justify-center bg-neutral-100 text-[3cqw] leading-none text-neutral-500 hover:bg-neutral-200"
          aria-label="Cancel promotion"
        >
          ×
        </button>
      </div>
    </div>
  );
}
