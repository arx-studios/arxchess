"use client";

import { useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "./protocol";
import { DEFAULT_WS_URL } from "./protocol";

const CLIENT_ID_KEY = "arxchess-client-id";

function getClientId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export type ConnectionStatus = "connecting" | "open" | "closed";

export function useGameSocket(roomId: string) {
  const [state, setState] = useState<ServerMessage | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL;
    const socket = new WebSocket(url);
    socketRef.current = socket;
    const clientId = getClientId();

    socket.onopen = () => {
      setStatus("open");
      const join: ClientMessage = { type: "join", roomId, clientId };
      socket.send(JSON.stringify(join));
    };
    socket.onclose = () => setStatus("closed");
    socket.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      setState(message);
    };

    return () => socket.close();
  }, [roomId]);

  function send(message: ClientMessage) {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  return {
    state,
    status,
    move: (from: string, to: string, promotion?: string) => send({ type: "move", from, to, promotion }),
    resign: () => send({ type: "resign" }),
  };
}
