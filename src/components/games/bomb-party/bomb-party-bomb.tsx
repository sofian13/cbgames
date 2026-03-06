"use client";

import { cn } from "@/lib/utils";

interface BombPartyBombProps {
  syllable: string;
  timeLeft: number;
  isMyTurn: boolean;
}

export function BombPartyBomb({ syllable, timeLeft, isMyTurn }: BombPartyBombProps) {
  const isUrgent = timeLeft <= 3;

  return (
    <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-8 text-center">
      <div
        className={cn(
          "absolute inset-0 opacity-80 transition-all duration-500",
          isUrgent
            ? "bg-[radial-gradient(circle_at_50%_35%,rgba(239,68,68,0.24),transparent_35%),radial-gradient(circle_at_50%_110%,rgba(255,138,61,0.16),transparent_44%)]"
            : isMyTurn
              ? "bg-[radial-gradient(circle_at_50%_35%,rgba(255,138,61,0.18),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(110,228,247,0.14),transparent_45%)]"
              : "bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.06),transparent_36%)]"
        )}
      />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div
          className={cn(
            "relative flex h-40 w-40 items-center justify-center rounded-full border transition-all duration-300",
            isUrgent
              ? "border-red-400/40 bg-gradient-to-br from-red-500/18 to-orange-500/12 shadow-[0_0_55px_rgba(239,68,68,0.24)] animate-[bombShake_0.18s_ease-in-out_infinite]"
              : isMyTurn
                ? "border-[#ffb98c]/35 bg-gradient-to-br from-[#ff8a3d]/18 to-[#72e4f7]/10 shadow-[0_0_48px_rgba(255,138,61,0.18)]"
                : "border-white/12 bg-white/[0.05]"
          )}
        >
          <div className="absolute -top-7 left-1/2 -translate-x-1/2">
            <div className={cn("h-8 w-1 rounded-full", isUrgent ? "bg-red-300" : "bg-white/22")} />
            <div
              className={cn(
                "absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full",
                isUrgent
                  ? "bg-orange-400 shadow-[0_0_22px_rgba(251,146,60,0.9)] animate-ping"
                  : "bg-[#ffb17f] shadow-[0_0_16px_rgba(255,177,127,0.55)] animate-pulse"
              )}
            />
          </div>

          <div className="absolute inset-[12%] rounded-full border border-white/10" />
          <div className="absolute inset-[20%] rounded-full border border-white/8" />

          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">Syllabe</p>
            <p
              className={cn(
                "mt-2 font-mono text-5xl font-black uppercase tracking-[0.22em]",
                isUrgent ? "text-red-200" : isMyTurn ? "text-[#fff2e4]" : "text-white/70"
              )}
            >
              {syllable}
            </p>
          </div>
        </div>

        <p className="max-w-sm text-sm leading-6 text-white/52">
          {isMyTurn
            ? "Trouve vite un mot qui contient la syllabe affichee."
            : "Observe le chrono. La bombe passe au joueur suivant des qu'un mot valide tombe."}
        </p>
      </div>
    </div>
  );
}
