import { Chess } from "chess.js";
import type { WebSocket } from "ws";
import type { GameResult } from "../lib/chess/status";
import type { PlayerColor } from "../lib/multiplayer/protocol";
import { DEFAULT_TIME_CONTROL_SECONDS } from "../lib/multiplayer/protocol";

export type PlayerSlot = {
  clientId: string;
  color: PlayerColor;
  socket: WebSocket | null;
};

export type Room = {
  id: string;
  game: Chess;
  players: PlayerSlot[];
  spectatorSockets: Set<WebSocket>;
  clockMs: { w: number; b: number };
  lastMoveAt: number;
  timeControlSeconds: number;
  manualResult: GameResult;
};

const rooms = new Map<string, Room>();

export function getOrCreateRoom(id: string): Room {
  let room = rooms.get(id);
  if (!room) {
    room = {
      id,
      game: new Chess(),
      players: [],
      spectatorSockets: new Set(),
      clockMs: {
        w: DEFAULT_TIME_CONTROL_SECONDS * 1000,
        b: DEFAULT_TIME_CONTROL_SECONDS * 1000,
      },
      lastMoveAt: Date.now(),
      timeControlSeconds: DEFAULT_TIME_CONTROL_SECONDS,
      manualResult: null,
    };
    rooms.set(id, room);
  }
  return room;
}

export function allRooms(): IterableIterator<Room> {
  return rooms.values();
}
