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
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(22,30,66,0.85),rgba(8,12,32,0.82))] px-3 py-2.5 shadow-[0_16px_44px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:min-h-16 sm:gap-3 sm:px-5 sm:py-3">
        <Link href="/" className="group flex items-center gap-3 press-effect">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[color:var(--line-brand)] bg-[rgba(46,124,255,0.08)] shadow-[0_10px_25px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105">
            <Gamepad2 className="h-5 w-5 text-[color:var(--brand-light)]" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[color:var(--brand)] shadow-[0_0_10px_var(--brand)]" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand)]">
              AF Games
            </span>
            <span className="block text-sm text-white/72">Party arcade live</span>
          </div>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {roomCode && <RoomCodeDisplay code={roomCode} />}
          {isConnected !== undefined && <ConnectionStatus isConnected={isConnected} />}
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/62 transition hover:border-[color:var(--brand)] hover:bg-[rgba(46,124,255,0.08)] hover:text-white sm:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Accueil
          </Link>
        </div>
      </div>
    </header>
  );
}
