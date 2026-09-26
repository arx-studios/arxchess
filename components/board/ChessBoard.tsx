"use client";

import { useEffect, useRef, useState } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrawBrushes, DrawShape } from "@lichess-org/chessground/draw";
import { premove as premoveDests } from "@lichess-org/chessground/premove";
import type { Dests, Key } from "@lichess-org/chessground/types";
import "@lichess-org/chessground/assets/chessground.base.css";
import "./chessboard-theme.css";

export type LastMoveHighlight = { from: string; to: string } | null;
export type BoardArrow = { from: string; to: string };

type Destination = { to: string; promotion?: boolean };

type ChessBoardProps = {
  fen: string;
  /** The side at the bottom is treated as the user's side for premoves. */
  orientation: "white" | "black";
  interactive?: boolean;
  turnColor: "w" | "b";
  lastMove?: LastMoveHighlight;
  checkSquare?: string | null;
  arrows?: BoardArrow[];
  /**
   * Legal moves the user may play right now. Return [] for pieces the user
   * doesn't control (e.g. the engine's side). Omit, together with onMove,
   * for a read-only/spectator board.
   */
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
const ANIMATION_MS = 200;

type Side = "w" | "b";
type Premove = { from: string; to: string; color: Side };
type PendingPromotion = { from: string; to: string; color: Side };

const toColor = (c: Side) => (c === "w" ? "white" : "black") as "white" | "black";

/** Maps each occupied square to "w" or "b". */
function colorsBySquare(fen: string): Map<string, Side> {
  const out = new Map<string, Side>();
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
        out.set(`${FILES[file]}${8 - i}`, ch === ch.toUpperCase() ? "w" : "b");
        file++;
      }
    });
  return out;
}

function computeDests(fen: string, turnColor: Side, legal?: ChessBoardProps["legalDestinations"]) {
  const dests: Dests = new Map();
  const promotions = new Set<string>();
  if (!legal) return { dests, promotions };
  for (const [from, color] of colorsBySquare(fen)) {
    if (color !== turnColor) continue;
    const moves = legal(from);
    if (!moves.length) continue;
    dests.set(from as Key, moves.map((m) => m.to as Key));
    for (const m of moves) if (m.promotion) promotions.add(from + m.to);
  }
  return { dests, promotions };
}

/** chessground allows castling premoves onto the rook square; the rules engine wants g/c-file. */
function normalizeCastle(fen: string, from: string, to: string): string {
  const board = fen.split(" ")[0].split("/");
  const rank = Number(from[1]);
  const row = board[8 - rank];
  let file = 0;
  let isKing = false;
  for (const ch of row) {
    if (/\d/.test(ch)) {
      file += Number(ch);
      continue;
    }
    if (FILES[file] === from[0]) isKing = ch.toLowerCase() === "k";
    file++;
  }
  const df = FILES.indexOf(to[0]) - FILES.indexOf(from[0]);
  if (!isKing || to[1] !== from[1] || Math.abs(df) < 2) return to;
  return `${df > 0 ? "g" : "c"}${from[1]}`;
}

export function ChessBoard(props: ChessBoardProps) {
  const { fen, orientation, interactive = true, turnColor, lastMove, checkSquare, arrows } = props;

  const canMove = interactive && !!props.onMove && !!props.legalDestinations;
  const bottom: Side = orientation === "white" ? "w" : "b";
  const { dests, promotions } = computeDests(fen, turnColor, canMove ? props.legalDestinations : undefined);
  const destsKey = [...dests].map(([k, v]) => `${k}:${v.join(",")}`).join(";");
  const arrowsKey = (arrows ?? []).map((a) => a.from + a.to).join(",");

  const elRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<Api | null>(null);
  const appliedFenRef = useRef<string | null>(null);
  const seenFenRef = useRef(fen);
  const seenOrientationRef = useRef(orientation);
  const premoveRef = useRef<Premove | null>(null);
  // Chessground registers its callbacks once, so they read live values from here.
  const live = useRef({ props, canMove, dests, promotions, bottom });
  live.current = { props, canMove, dests, promotions, bottom };

  const [pending, setPending] = useState<PendingPromotion | null>(null);

  /** Pushes the current props (plus any queued premove) into chessground. */
  function sync(forceFen: boolean, animate = true) {
    const ground = groundRef.current;
    if (!ground) return;
    const { props: p, canMove: movable, dests: d, bottom: me } = live.current;
    const pm = premoveRef.current;
    // While the other side is to move, the user's (bottom) side stays grabbable
    // so input on it can be captured as a premove.
    const premoveWindow = movable && p.turnColor !== me;

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
      movable: {
        color: movable ? (premoveWindow ? "both" : toColor(p.turnColor)) : undefined,
        dests: d,
      },
      highlight: {
        custom: new Map(pm ? [[pm.from as Key, "current-premove"], [pm.to as Key, "current-premove"]] : []),
      },
      drawable: { autoShapes },
    };
    // Only hand chessground a FEN when the position really changed; re-setting
    // it would interrupt drags and wipe the user's drawn arrows.
    if (forceFen || appliedFenRef.current !== p.fen) {
      config.fen = p.fen;
      appliedFenRef.current = p.fen;
    }
    if (!animate) config.animation = { enabled: false };
    ground.set(config);
    if (!animate) ground.set({ animation: { enabled: true, duration: ANIMATION_MS } });

    if (premoveWindow) {
      // Premove targets use chessground's own geometry for the waiting side.
      const all: Dests = new Map(d);
      for (const [sq, color] of colorsBySquare(p.fen)) {
        if (color !== me) continue;
        const targets = premoveDests(ground.state, sq as Key);
        if (targets.length) all.set(sq as Key, targets);
      }
      ground.set({ movable: { color: "both", dests: all } });
    }
  }

  function setPremove(pm: Premove | null) {
    premoveRef.current = pm;
  }

  function play(from: string, to: string, promotion?: string) {
    const ok = live.current.props.onMove?.(from, to, promotion) ?? false;
    if (!ok) sync(true);
  }

  function handleUserMove(orig: Key, dest: Key) {
    const { props: p, promotions: promos } = live.current;
    const mover = colorsBySquare(p.fen).get(orig);

    if (mover && mover !== p.turnColor) {
      // Not this side's turn: queue it and put the piece back where it really is.
      setPremove({ from: orig, to: normalizeCastle(p.fen, orig, dest), color: mover });
      sync(true, false);
      return;
    }

    if (promos.has(orig + dest)) {
      setPending({ from: orig, to: dest, color: p.turnColor });
      return;
    }
    play(orig, dest);
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
      animation: { enabled: true, duration: ANIMATION_MS },
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
    sync(false);
    return () => {
      ground.destroy();
      groundRef.current = null;
      appliedFenRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fenChanged = seenFenRef.current !== fen;
    const flipped = seenOrientationRef.current !== orientation;
    seenFenRef.current = fen;
    seenOrientationRef.current = orientation;

    // A queued premove gets exactly one chance: the next position. If it's now
    // that side's turn and the move is legal, play it; otherwise drop it.
    let due: Premove | null = null;
    const pm = premoveRef.current;
    if (pm && (!canMove || flipped)) setPremove(null);
    else if (pm && fenChanged) {
      setPremove(null);
      const legal = pm.color === turnColor && dests.get(pm.from as Key)?.includes(pm.to as Key);
      if (legal) due = pm;
    }

    sync(false);
    if (due) play(due.from, due.to, promotions.has(due.from + due.to) ? "q" : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, orientation, turnColor, lastMove?.from, lastMove?.to, checkSquare, destsKey, arrowsKey, canMove]);

  useEffect(() => {
    setPending(null);
  }, [fen]);

  // chess.com-style: right-click cancels a queued premove instead of drawing.
  function handleMouseDownCapture(e: React.MouseEvent) {
    if (e.button !== 2 || !premoveRef.current) return;
    setPremove(null);
    sync(false);
    e.stopPropagation();
    e.preventDefault();
  }

  function choosePromotion(piece: string) {
    if (!pending) return;
    setPending(null);
    play(pending.from, pending.to, piece);
  }

  function cancelPromotion() {
    setPending(null);
    sync(true);
  }

  return (
    <div className="arx-board" onMouseDownCapture={handleMouseDownCapture}>
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
