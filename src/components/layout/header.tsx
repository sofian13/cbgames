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
    <header
      className="sticky top-0 z-40 border-b border-white/[0.06] backdrop-blur-2xl"
      style={{
        background: "linear-gradient(180deg, rgba(3,8,19,0.92) 0%, rgba(3,8,19,0.82) 100%)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 group press-effect">
          <div
            className="h-6 w-6 rounded-lg transition-all duration-500 group-hover:scale-110 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(80,216,255,0.2), rgba(99,102,241,0.15))",
              border: "1px solid rgba(80,216,255,0.35)",
              boxShadow: "0 0 16px rgba(64,170,255,0.25), inset 0 0 8px rgba(80,216,255,0.1)",
            }}
          >
            <span className="text-[8px] font-bold text-cyan-200/90 font-serif">AF</span>
          </div>
          <span className="text-xs font-bold tracking-[0.18em] text-cyan-100/85 font-serif premium-text-glow group-hover:text-cyan-100 transition-colors">
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
