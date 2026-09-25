import { WebSocketServer, WebSocket } from "ws";
import { deriveResult } from "../lib/chess/status";
import type { ClientMessage, ServerMessage, PlayerColor } from "../lib/multiplayer/protocol";
import { getOrCreateRoom, allRooms, type Room, type PlayerSlot } from "./rooms";

const PORT = Number(process.env.WS_PORT ?? 3001);

function currentResult(room: Room) {
  return room.manualResult ?? deriveResult(room.game);
}

function stateFor(room: Room, seatFor: PlayerSlot["color"] | "spectator"): ServerMessage {
  const history = room.game.history({ verbose: true });
  const last = history.length ? history[history.length - 1] : null;
  return {
    type: "state",
    yourSeat: seatFor,
    fen: room.game.fen(),
    sanHistory: room.game.history(),
    turn: room.game.turn(),
    lastMove: last ? { from: last.from, to: last.to } : null,
    result: currentResult(room),
    clockMs: room.clockMs,
    lastMoveAt: room.lastMoveAt,
    timeControlSeconds: room.timeControlSeconds,
    connected: {
      w: room.players.find((p) => p.color === "w")?.socket != null,
      b: room.players.find((p) => p.color === "b")?.socket != null,
    },
  };
}

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(room: Room) {
  for (const player of room.players) {
    if (player.socket) send(player.socket, stateFor(room, player.color));
  }
  for (const spectator of room.spectatorSockets) {
    send(spectator, stateFor(room, "spectator"));
  }
}

function endGame(room: Room, winner: PlayerColor, kind: "timeout" | "resignation") {
  room.manualResult = { kind, winner };
  broadcast(room);
}

const wss = new WebSocketServer({ port: PORT });
console.log(`arxchess WS server listening on ws://localhost:${PORT}`);

wss.on("connection", (socket) => {
  let room: Room | null = null;
  let clientId: string | null = null;

  socket.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "join") {
      room = getOrCreateRoom(msg.roomId);
      clientId = msg.clientId;

      const existing = room.players.find((p) => p.clientId === clientId);
      if (existing) {
        existing.socket = socket;
      } else if (room.players.length < 2) {
        const color: PlayerColor = room.players.length === 0 ? "w" : "b";
        room.players.push({ clientId, color, socket });
      } else {
        room.spectatorSockets.add(socket);
      }

      broadcast(room);
      return;
    }

    if (!room || !clientId) return;
    const activeRoom = room;

    if (msg.type === "move") {
      const player = activeRoom.players.find((p) => p.clientId === clientId);
      if (!player || currentResult(activeRoom)) return;
      if (activeRoom.game.turn() !== player.color) return;

      const now = Date.now();
      const elapsed = now - activeRoom.lastMoveAt;
      const remaining = Math.max(0, activeRoom.clockMs[player.color] - elapsed);
      activeRoom.clockMs[player.color] = remaining;
      activeRoom.lastMoveAt = now;

      if (remaining === 0) {
        endGame(activeRoom, player.color === "w" ? "b" : "w", "timeout");
        return;
      }

      try {
        const move = activeRoom.game.move({ from: msg.from, to: msg.to, promotion: msg.promotion });
        if (!move) return;
      } catch {
        return;
      }

      broadcast(activeRoom);
      return;
    }

    if (msg.type === "resign") {
      const player = activeRoom.players.find((p) => p.clientId === clientId);
      if (!player || currentResult(activeRoom)) return;
      endGame(activeRoom, player.color === "w" ? "b" : "w", "resignation");
      return;
    }
  });

  socket.on("close", () => {
    if (!room) return;
    const player = room.players.find((p) => p.socket === socket);
    if (player) player.socket = null;
    room.spectatorSockets.delete(socket);
    broadcast(room);
  });
});

// Flag-fall: rooms only get re-checked when a message arrives, so an idle
// clock that runs out with nobody moving needs its own periodic sweep.
setInterval(() => {
  const now = Date.now();
  for (const room of allRooms()) {
    if (currentResult(room)) continue;
    const turn = room.game.turn();
    const elapsed = now - room.lastMoveAt;
    const remaining = room.clockMs[turn] - elapsed;
    if (remaining <= 0) {
      room.clockMs[turn] = 0;
      endGame(room, turn === "w" ? "b" : "w", "timeout");
    }
  }
}, 1000);
