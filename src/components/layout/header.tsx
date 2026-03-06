"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RoomCodeDisplay } from "@/components/shared/room-code-display";
import { ConnectionStatus } from "@/components/shared/connection-status";

interface HeaderProps {
  roomCode?: string;
  isConnected?: boolean;
}

export function Header({ roomCode, isConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#07101e]/72 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
        <Link href="/" className="group flex items-center gap-3 press-effect">
          <div className="hero-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-white/6 shadow-[0_16px_34px_rgba(0,0,0,0.28)] transition-transform duration-300 group-hover:scale-[1.03]">
            <span className="text-sm font-black tracking-[0.18em] text-white/92">AF</span>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/36">
              <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Retour accueil
            </div>
            <p className="mt-1 text-sm font-semibold tracking-[0.14em] text-white/84">AF GAMES</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {roomCode && <RoomCodeDisplay code={roomCode} />}
          {isConnected !== undefined && <ConnectionStatus isConnected={isConnected} />}
        </div>
      </div>
    </header>
  );
}
