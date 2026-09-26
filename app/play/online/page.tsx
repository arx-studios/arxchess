"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { GameLayout } from "@/components/game/GameLayout";
import { PlayerCard } from "@/components/game/PlayerCard";
import { PanelFooter, PanelHeader, PanelSection } from "@/components/game/Panel";
import { Button } from "@/components/ui/Button";
import { displayName, useSettings } from "@/lib/settings/store";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const randomRoomId = () => Math.random().toString(36).slice(2, 8);

export default function OnlineLobbyPage() {
  const router = useRouter();
  const playerName = useSettings((s) => s.playerName);

  return (
    <GameLayout
      top={<PlayerCard name="Opponent" detail="Not joined" icon={Globe} color="b" fen={START_FEN} />}
      bottom={<PlayerCard name={displayName(playerName)} color="w" fen={START_FEN} />}
      board={<ChessBoard fen={START_FEN} orientation="white" interactive={false} turnColor="w" />}
      panel={
        <>
          <PanelHeader title="Online" status="Play a friend over a room link" />
          <PanelSection>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-body text-fg-secondary">
              <li>Create a room.</li>
              <li>Send the room link to your opponent.</li>
              <li>The first person in plays White; 10 minutes each.</li>
            </ol>
          </PanelSection>
          <PanelFooter>
            <Button variant="primary" size="lg" onClick={() => router.push(`/play/online/${randomRoomId()}`)}>
              Create room
            </Button>
          </PanelFooter>
        </>
      }
    />
  );
}
