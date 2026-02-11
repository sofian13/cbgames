"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "@/components/shared/avatar-circle";
import { RoomCodeDisplay } from "@/components/shared/room-code-display";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { LogOut } from "lucide-react";

interface HeaderProps {
  roomCode?: string;
  isConnected?: boolean;
}

export function Header({ roomCode, isConnected }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-5 h-5 rounded-full"
            style={{
              border: "1.5px solid rgba(200,65,30,0.35)",
              boxShadow: "0 0 12px rgba(200,55,28,0.2)",
            }}
          />
          <span className="text-sm font-semibold tracking-[0.1em] text-white/85 font-serif">
            AF GAMES
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {roomCode && <RoomCodeDisplay code={roomCode} />}
          {isConnected !== undefined && <ConnectionStatus isConnected={isConnected} />}

          {session?.user ? (
            <div className="flex items-center gap-2">
              <AvatarCircle
                name={session.user.name ?? ""}
                avatar={session.user.image ?? undefined}
                size="sm"
              />
              <span className="text-sm font-medium hidden sm:block text-white/70">
                {session.user.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12]"
              onClick={() => signIn("discord")}
            >
              Discord
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
