"use client";

import Link from "next/link";
import { ChevronLeft, Gamepad2 } from "lucide-react";
import { RoomCodeDisplay } from "@/components/shared/room-code-display";
import { ConnectionStatus } from "@/components/shared/connection-status";

interface HeaderProps {
  roomCode?: string;
  isConnected?: boolean;
}

export function Header({ roomCode, isConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[#08111acc]/90 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:min-h-16 sm:gap-3 sm:px-5 sm:py-3">
        <Link href="/" className="group flex items-center gap-3 press-effect">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:scale-105">
            <Gamepad2 className="h-5 w-5 text-[#ffb68c]" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
              AF Games
            </span>
            <span className="block text-sm text-white/72">Party arcade</span>
          </div>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {roomCode && <RoomCodeDisplay code={roomCode} />}
          {isConnected !== undefined && <ConnectionStatus isConnected={isConnected} />}
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/62 transition hover:border-cyan-300/28 hover:text-white sm:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Accueil
          </Link>
        </div>
      </div>
    </header>
  );
}
