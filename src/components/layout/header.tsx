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
    <header className="sticky top-0 z-40 backdrop-blur-md"
            style={{ background: "color-mix(in oklab, var(--background) 80%, transparent)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-black"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            cb
          </span>
          <span
            className="hidden text-base font-black tracking-tight sm:inline"
            style={{ fontFamily: "var(--font-display)" }}
          >
            games
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          {roomCode && <RoomCodeDisplay code={roomCode} />}
          {isConnected !== undefined && <ConnectionStatus isConnected={isConnected} />}
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:flex"
            style={{
              borderColor: "var(--line-soft)",
              color: "var(--text-dim)",
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Accueil
          </Link>
        </div>
      </div>
    </header>
  );
}
