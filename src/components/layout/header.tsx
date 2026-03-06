"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoomCodeDisplay } from "@/components/shared/room-code-display";
import { ConnectionStatus } from "@/components/shared/connection-status";

interface HeaderProps {
  roomCode?: string;
  isConnected?: boolean;
}

export function Header({ roomCode, isConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-cyan-300/15 bg-[#030813]/76 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="h-6 w-6 rounded-full"
            style={{
              border: "1.5px solid rgba(80,216,255,0.55)",
              boxShadow: "0 0 24px rgba(64,170,255,0.45), inset 0 0 14px rgba(80,216,255,0.18)",
            }}
          />
          <span className="text-sm font-semibold tracking-[0.2em] text-cyan-100/95 font-serif premium-text-glow">
            AF GAMES
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {roomCode && <RoomCodeDisplay code={roomCode} />}
          {isConnected !== undefined && <ConnectionStatus isConnected={isConnected} />}
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-300/25 bg-cyan-400/10 text-cyan-100/80"
          >
            Mode lien
          </Button>
        </div>
      </div>
    </header>
  );
}
