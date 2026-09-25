import type { GameResult } from "../chess/status";

export type PlayerColor = "w" | "b";
export type Seat = PlayerColor | "spectator";

export type ClientMessage =
  | { type: "join"; roomId: string; clientId: string }
  | { type: "move"; from: string; to: string; promotion?: string }
  | { type: "resign" };

export type ServerMessage = {
  type: "state";
  yourSeat: Seat;
  fen: string;
  sanHistory: string[];
  turn: PlayerColor;
  lastMove: { from: string; to: string } | null;
  result: GameResult;
  clockMs: { w: number; b: number };
  lastMoveAt: number;
  timeControlSeconds: number;
  connected: { w: boolean; b: boolean };
};

export const DEFAULT_WS_URL = "ws://localhost:3001";
export const DEFAULT_TIME_CONTROL_SECONDS = 600;
