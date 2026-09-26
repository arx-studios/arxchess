"use client";

import { useEffect, useRef, useState } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import { premove as premoveDests } from "@lichess-org/chessground/premove";
import type { Dests, Key } from "@lichess-org/chessground/types";
import "@lichess-org/chessground/assets/chessground.base.css";
import { playSound } from "@/lib/sound/sounds";
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
  /** Engine/program arrows (e.g. best move), drawn in the same style as user arrows. */
  arrows?: BoardArrow[];
  /**
   * Legal moves the user may play right now. Return [] for pieces the user
   * doesn't control (e.g. the engine's side). Omit, together with onMove,
   * for a read-only/spectator board.
   */
  legalDestinations?: (square: string) => Destination[];
  onMove?: (from: string, to: string, promotion?: string) => boolean;
};

const FILES = "abcdefgh";
const ANIMATION_MS = 200;

type Side = "w" | "b";
type Premove = { from: string; to: string; color: Side; promotion?: string };
type PendingPromotion = { from: string; to: string; color: Side };

// chess.com drawing: right-click a square to highlight it, right-drag to draw an
// arrow; holding a modifier picks another color. Left-click clears everything.
type Tint = "default" | "shift" | "ctrl" | "alt";
type UserArrow = { from: string; to: string; tint: Tint };
const ARROW_COLORS: Record<Tint | "engine", string> = {
  default: "#ffaa00",
  shift: "#9fcf3f",
  ctrl: "#f8553f",
  alt: "#48c1f9",
  engine: "#3b82f6",
};

const toColor = (c: Side) => (c === "w" ? "white" : "black") as "white" | "black";
const sideOf = (piece: string): Side => (piece === piece.toUpperCase() ? "w" : "b");
const fileIdx = (square: string) => FILES.indexOf(square[0]);

function tintOf(e: { altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }): Tint {
  if (e.altKey) return "alt";
  if (e.ctrlKey || e.metaKey) return "ctrl";
  if (e.shiftKey) return "shift";
  return "default";
}

/** Square -> FEN piece letter ("P", "n", ...). */
function readBoard(fen: string): Map<string, string> {
  const board = new Map<string, string>();
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
        board.set(`${FILES[file]}${8 - i}`, ch);
        file++;
      }
    });
  return board;
}

function writeBoard(board: Map<string, string>): string {
  const rows: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = "";
    let empty = 0;
    for (const file of FILES) {
      const piece = board.get(`${file}${rank}`);
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      row += piece;
    }
    rows.push(empty ? row + empty : row);
  }
  return rows.join("/");
}

/** The position as the user sees it: the real one with the given moves already made. */
function previewFen(fen: string, moves: Premove[]): string {
  if (!moves.length) return fen;
  const board = readBoard(fen);
  for (const m of moves) {
    const piece = board.get(m.from);
    if (!piece) continue;
    board.delete(m.from);
    board.set(m.to, m.promotion ? (m.color === "w" ? "Q" : "q") : piece);
    if (piece.toLowerCase() === "k" && Math.abs(fileIdx(m.to) - fileIdx(m.from)) === 2) {
      const kingside = fileIdx(m.to) > fileIdx(m.from);
      const rookFrom = `${kingside ? "h" : "a"}${m.from[1]}`;
      const rook = board.get(rookFrom);
      if (rook) {
        board.delete(rookFrom);
        board.set(`${kingside ? "f" : "d"}${m.from[1]}`, rook);
      }
    }
  }
  return [writeBoard(board), ...fen.split(" ").slice(1)].join(" ");
}

/** Half-moves played so far, from the FEN's move counters. */
function plyOf(fen: string): number {
  const parts = fen.split(" ");
  return (Number(parts[5] ?? 1) - 1) * 2 + (parts[1] === "b" ? 1 : 0);
}

function computeDests(fen: string, turnColor: Side, legal?: ChessBoardProps["legalDestinations"]) {
  const dests: Dests = new Map();
  const promotions = new Set<string>();
  if (!legal) return { dests, promotions };
  for (const [from, piece] of readBoard(fen)) {
    if (sideOf(piece) !== turnColor) continue;
    const moves = legal(from);
    if (!moves.length) continue;
    dests.set(from as Key, moves.map((m) => m.to as Key));
    for (const m of moves) if (m.promotion) promotions.add(from + m.to);
  }
  return { dests, promotions };
}

function toPremove(board: Map<string, string>, from: string, to: string): Premove | null {
  const piece = board.get(from);
  if (!piece) return null;
  const color = sideOf(piece);
  const role = piece.toLowerCase();
  const df = fileIdx(to) - fileIdx(from);
  // chessground lets a king premove onto its own rook to castle; the rules engine wants the g/c-file square.
  const dest = role === "k" && to[1] === from[1] && Math.abs(df) >= 2 ? `${df > 0 ? "g" : "c"}${from[1]}` : to;
  // A premove fires with no one watching, so it can't wait on a picker: auto-queen.
  const promotes = role === "p" && dest[1] === (color === "w" ? "8" : "1");
  return { from, to: dest, color, promotion: promotes ? "q" : undefined };
}

export function ChessBoard(props: ChessBoardProps) {
  const { fen, orientation, interactive = true, turnColor, lastMove, checkSquare, arrows } = props;

  const canMove = interactive && !!props.onMove && !!props.legalDestinations;
  const bottom: Side = orientation === "white" ? "w" : "b";
  const { dests, promotions } = computeDests(fen, turnColor, canMove ? props.legalDestinations : undefined);
  const destsKey = [...dests].map(([k, v]) => `${k}:${v.join(",")}`).join(";");

  const [marks, setMarks] = useState<Map<string, Tint>>(() => new Map());
  const [userArrows, setUserArrows] = useState<UserArrow[]>([]);
  const [drawing, setDrawing] = useState<UserArrow | null>(null);
  const marksKey = [...marks].map(([sq, t]) => sq + t).join(",");

  const elRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<Api | null>(null);
  const appliedFenRef = useRef<string | null>(null);
  const seenFenRef = useRef(fen);
  const seenOrientationRef = useRef(orientation);
  // Premoves waiting to be played, in order, one per turn.
  const queueRef = useRef<Premove[]>([]);
  // A move handed to onMove whose resulting position hasn't arrived yet (e.g.
  // an online move awaiting the server); kept on screen so it doesn't snap back.
  const sentRef = useRef<Premove | null>(null);
  // Chessground registers its callbacks once, so they read live values from here.
  const live = useRef({ props, canMove, dests, promotions, bottom, marks });
  live.current = { props, canMove, dests, promotions, bottom, marks };

  const [pending, setPending] = useState<PendingPromotion | null>(null);

  function shownFen() {
    const sent = sentRef.current;
    return previewFen(live.current.props.fen, [...(sent ? [sent] : []), ...queueRef.current]);
  }

  /** Pushes the current props, with queued premoves shown as already made, into chessground. */
  function sync(forceFen: boolean, animate = true) {
    const ground = groundRef.current;
    if (!ground) return;
    const { props: p, canMove: movable, dests: d, bottom: me, marks: m } = live.current;
    const display = shownFen();
    // While the other side is to move, the user's (bottom) side stays grabbable
    // so input on it can be queued as premoves.
    const premoveWindow = movable && p.turnColor !== me;

    // Square classes: queued premoves plus right-click highlights (drawn under the pieces).
    const squareClasses = new Map<Key, string>();
    const addClass = (sq: string, cls: string) => {
      const prev = squareClasses.get(sq as Key);
      squareClasses.set(sq as Key, prev ? `${prev} ${cls}` : cls);
    };
    for (const pm of queueRef.current) {
      addClass(pm.from, "current-premove");
      addClass(pm.to, "current-premove");
    }
    for (const [sq, tint] of m) addClass(sq, `mark-${tint}`);

    const config: Config = {
      orientation: p.orientation,
      turnColor: toColor(p.turnColor),
      lastMove: p.lastMove ? [p.lastMove.from as Key, p.lastMove.to as Key] : undefined,
      check: !!p.checkSquare,
      movable: {
        color: movable ? (premoveWindow ? "both" : toColor(p.turnColor)) : undefined,
        dests: d,
      },
      highlight: { custom: squareClasses },
    };
    // Only hand chessground a FEN when the position really changed; re-setting
    // it would interrupt an in-progress drag.
    if (forceFen || appliedFenRef.current !== display) {
      config.fen = display;
      appliedFenRef.current = display;
    }
    if (!animate) config.animation = { enabled: false };
    ground.set(config);
    if (!animate) ground.set({ animation: { enabled: true, duration: ANIMATION_MS } });

    if (premoveWindow) {
      // Premove targets use chessground's own geometry, from where the user's
      // pieces appear to be after earlier premoves, so premoves can chain.
      const all: Dests = new Map(d);
      for (const [sq, piece] of readBoard(display)) {
        if (sideOf(piece) !== me) continue;
        const targets = premoveDests(ground.state, sq as Key);
        if (targets.length) all.set(sq as Key, targets);
      }
      ground.set({ movable: { color: "both", dests: all } });
    }
  }

  function clearQueue() {
    queueRef.current = [];
  }

  /** Hands a move to the parent; returns whether it was accepted. */
  function play(move: Premove): boolean {
    const ok = live.current.props.onMove?.(move.from, move.to, move.promotion) ?? false;
    if (ok) sentRef.current = move;
    else playSound("illegal");
    return ok;
  }

  function handleUserMove(orig: Key, dest: Key) {
    const { props: p, promotions: promos } = live.current;
    const board = readBoard(shownFen());
    const piece = board.get(orig);

    if (piece && sideOf(piece) !== p.turnColor) {
      // Not this side's turn: queue it. The board already shows the piece on its new square.
      const premove = toPremove(board, orig, dest);
      if (premove) {
        queueRef.current = [...queueRef.current, premove];
        playSound("premove");
      }
      sync(true, false);
      return;
    }

    if (promos.has(orig + dest)) {
      setPending({ from: orig, to: dest, color: p.turnColor });
      return;
    }
    if (!play({ from: orig, to: dest, color: p.turnColor })) sync(true);
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
      // Arrows and square highlights are drawn by this component, chess.com-style.
      drawable: { enabled: false, visible: false },
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
    const previousFen = seenFenRef.current;
    const fenChanged = previousFen !== fen;
    const flipped = seenOrientationRef.current !== orientation;
    seenFenRef.current = fen;
    seenOrientationRef.current = orientation;
    if (fenChanged) sentRef.current = null;

    const queue = queueRef.current;
    let due: Premove | null = null;
    if (queue.length && (!canMove || flipped)) clearQueue();
    else if (queue.length && fenChanged) {
      if (plyOf(fen) !== plyOf(previousFen) + 1) {
        // Not a single move forward (new game, undo, navigation...): the queue no longer applies.
        clearQueue();
      } else if (queue[0].color === turnColor) {
        // It's the user's turn: play the next premove, or drop the whole queue if it's illegal now.
        const next = queue[0];
        if (dests.get(next.from as Key)?.includes(next.to as Key)) {
          queueRef.current = queue.slice(1);
          due = next;
        } else clearQueue();
      }
    }

    if (due && !play(due)) clearQueue();
    sync(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, orientation, turnColor, lastMove?.from, lastMove?.to, checkSquare, destsKey, canMove, marksKey]);

  useEffect(() => {
    // Like chess.com, drawings belong to the position they were made on.
    setPending(null);
    setMarks(new Map());
    setUserArrows([]);
    setDrawing(null);
  }, [fen, orientation]);

  function squareAt(clientX: number, clientY: number): string | null {
    const boardEl = elRef.current?.querySelector("cg-board");
    if (!boardEl) return null;
    const r = boardEl.getBoundingClientRect();
    const col = Math.floor(((clientX - r.left) / r.width) * 8);
    const row = Math.floor(((clientY - r.top) / r.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const white = live.current.props.orientation === "white";
    return `${FILES[white ? col : 7 - col]}${white ? 8 - row : row + 1}`;
  }

  // Track a right-drag anywhere on the page until the button is released.
  useEffect(() => {
    if (!drawing) return;
    function onMove(e: MouseEvent) {
      const sq = squareAt(e.clientX, e.clientY);
      setDrawing((d) => (d && sq && sq !== d.to ? { ...d, to: sq } : d));
    }
    function onUp(e: MouseEvent) {
      if (e.button !== 2) return;
      const d = drawing;
      const end = squareAt(e.clientX, e.clientY) ?? d?.to;
      setDrawing(null);
      if (!d || !end) return;
      if (end === d.from) {
        setMarks((prev) => {
          const next = new Map(prev);
          if (next.get(end) === d.tint) next.delete(end);
          else next.set(end, d.tint);
          return next;
        });
      } else {
        setUserArrows((prev) => {
          const same = prev.find((a) => a.from === d.from && a.to === end);
          const rest = prev.filter((a) => a !== same);
          return same?.tint === d.tint ? rest : [...rest, { from: d.from, to: end, tint: d.tint }];
        });
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing?.from, drawing?.tint]);

  function handleMouseDownCapture(e: React.MouseEvent) {
    if (e.button === 2) {
      // Right-click is ours: chessground never sees it.
      e.stopPropagation();
      e.preventDefault();
      if (queueRef.current.length) {
        // chess.com: right-click cancels queued premoves.
        clearQueue();
        sync(false, false);
        return;
      }
      const sq = squareAt(e.clientX, e.clientY);
      if (sq) setDrawing({ from: sq, to: sq, tint: tintOf(e) });
      return;
    }
    if (e.button === 0 && (marks.size || userArrows.length)) {
      setMarks(new Map());
      setUserArrows([]);
    }
  }

  function choosePromotion(piece: string) {
    if (!pending) return;
    setPending(null);
    if (!play({ ...pending, promotion: piece })) sync(true);
  }

  function cancelPromotion() {
    setPending(null);
    sync(true);
  }

  const shownArrows = [
    ...(arrows ?? []).map((a) => ({ ...a, color: ARROW_COLORS.engine, id: `engine-${a.from}${a.to}` })),
    ...userArrows.map((a) => ({ ...a, color: ARROW_COLORS[a.tint], id: `user-${a.from}${a.to}` })),
    // The arrow being dragged out; may duplicate an existing one until released.
    ...(drawing && drawing.to !== drawing.from
      ? [{ ...drawing, color: ARROW_COLORS[drawing.tint], id: "drawing" }]
      : []),
  ];

  return (
    <div
      className="arx-board"
      onMouseDownCapture={handleMouseDownCapture}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={elRef} className="h-full w-full" />
      <ArrowLayer arrows={shownArrows} orientation={orientation} />
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

// Arrow proportions in square units, matched to chess.com.
const SHAFT_WIDTH = 0.22;
const HEAD_WIDTH = 0.5;
const HEAD_LENGTH = 0.45;

function ArrowLayer({
  arrows,
  orientation,
}: {
  arrows: { from: string; to: string; color: string; id: string }[];
  orientation: "white" | "black";
}) {
  if (!arrows.length) return null;
  const center = (sq: string) => {
    const f = fileIdx(sq);
    const r = Number(sq[1]);
    return orientation === "white" ? { x: f + 0.5, y: 8 - r + 0.5 } : { x: 7 - f + 0.5, y: r - 1 + 0.5 };
  };

  return (
    <svg className="arx-arrows" viewBox="0 0 8 8" aria-hidden>
      {arrows.map((a) => {
        const start = center(a.from);
        const end = center(a.to);
        const dx = Math.abs(fileIdx(a.to) - fileIdx(a.from));
        const dy = Math.abs(Number(a.to[1]) - Number(a.from[1]));
        const knight = (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
        // Knight arrows bend: the long leg first, then the short one.
        const points = knight
          ? [start, dy > dx ? { x: start.x, y: end.y } : { x: end.x, y: start.y }, end]
          : [start, end];
        const prev = points[points.length - 2];
        const len = Math.hypot(end.x - prev.x, end.y - prev.y);
        const ux = (end.x - prev.x) / len;
        const uy = (end.y - prev.y) / len;
        const base = { x: end.x - ux * HEAD_LENGTH, y: end.y - uy * HEAD_LENGTH };
        const shaft = [...points.slice(0, -1), { x: base.x + ux * 0.01, y: base.y + uy * 0.01 }];
        const half = HEAD_WIDTH / 2;
        const head = [
          `${end.x},${end.y}`,
          `${base.x - uy * half},${base.y + ux * half}`,
          `${base.x + uy * half},${base.y - ux * half}`,
        ].join(" ");
        return (
          // Group opacity keeps the shaft/head overlap from darkening.
          <g key={a.id} opacity={0.8}>
            <polyline
              points={shaft.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={a.color}
              strokeWidth={SHAFT_WIDTH}
              strokeLinejoin="miter"
              strokeLinecap="butt"
            />
            <polygon points={head} fill={a.color} />
          </g>
        );
      })}
    </svg>
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
            style={{ backgroundImage: `var(--piece-${pending.color}${piece}, url(/themes/pieces/neo/${pending.color}${piece}.png))` }}
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
