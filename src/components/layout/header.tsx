"use client";

import Link from "next/link";
import { RoomCodeDisplay } from "@/components/shared/room-code-display";
import { ConnectionStatus } from "@/components/shared/connection-status";

interface HeaderProps {
  roomCode?: string;
  isConnected?: boolean;
}

export function Header({ roomCode, isConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#030813]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="h-5 w-5 rounded-full transition-all duration-500 group-hover:scale-110"
            style={{
              border: "1.5px solid rgba(80,216,255,0.5)",
              boxShadow: "0 0 18px rgba(64,170,255,0.35), inset 0 0 10px rgba(80,216,255,0.15)",
            }}
          />
          <span className="text-xs font-bold tracking-[0.22em] text-cyan-100/85 font-serif premium-text-glow group-hover:text-cyan-100 transition-colors">
            AF GAMES
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {roomCode && <RoomCodeDisplay code={roomCode} />}
          {isConnected !== undefined && <ConnectionStatus isConnected={isConnected} />}
        </div>
      </div>
    </header>
  );
}
