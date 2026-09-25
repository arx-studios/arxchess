"use client";

import { useRouter } from "next/navigation";

function randomRoomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export default function OnlineLobbyPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Online</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Create a room, then share the link with whoever you want to play.
      </p>
      <button
        onClick={() => router.push(`/play/online/${randomRoomId()}`)}
        className="mt-4 rounded-md border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Create a room
      </button>
    </div>
  );
}
