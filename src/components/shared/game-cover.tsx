"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  BadgeHelp,
  Bomb,
  BookOpenText,
  Brain,
  Crown,
  Crosshair,
  Hand,
  Landmark,
  Link2,
  MoonStar,
  Rabbit,
  Shield,
  Skull,
  Sparkles,
  Swords,
  TimerReset,
  Trophy,
  VenetianMask,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

type CoverPalette = {
  sky: string;
  horizon: string;
  ground: string;
  accent: string;
  shadow: string;
  title: string;
};

type CoverConfig = {
  icon: LucideIcon;
  palette: CoverPalette;
  label: string;
};

const DEFAULT_PALETTE: CoverPalette = {
  sky: "from-sky-200 via-cyan-200 to-cyan-300",
  horizon: "from-cyan-300/40 via-blue-300/25 to-transparent",
  ground: "from-slate-700 via-slate-800 to-slate-950",
  accent: "bg-white/88",
  shadow: "shadow-[0_14px_24px_rgba(0,0,0,0.24)]",
  title: "from-emerald-500 to-green-500",
};

const GAME_COVER_MAP: Record<string, CoverConfig> = {
  "bomb-party": {
    icon: Bomb,
    palette: {
      sky: "from-fuchsia-200 via-violet-200 to-indigo-300",
      horizon: "from-amber-300/35 via-orange-300/20 to-transparent",
      ground: "from-violet-800 via-slate-800 to-slate-950",
      accent: "bg-fuchsia-300",
      shadow: "shadow-[0_16px_26px_rgba(93,24,220,0.32)]",
      title: "from-slate-800 to-slate-900",
    },
    label: "Words",
  },
  "word-chain": {
    icon: Link2,
    palette: {
      sky: "from-slate-200 via-zinc-200 to-violet-200",
      horizon: "from-white/45 via-violet-200/25 to-transparent",
      ground: "from-slate-700 via-slate-800 to-slate-950",
      accent: "bg-white/92",
      shadow: "shadow-[0_16px_26px_rgba(68,63,93,0.26)]",
      title: "from-slate-700 to-slate-900",
    },
    label: "Words",
  },
  "speed-quiz": {
    icon: Brain,
    palette: {
      sky: "from-orange-200 via-amber-200 to-yellow-300",
      horizon: "from-yellow-300/45 via-orange-300/20 to-transparent",
      ground: "from-slate-700 via-slate-800 to-slate-950",
      accent: "bg-orange-300",
      shadow: "shadow-[0_16px_26px_rgba(251,146,60,0.3)]",
      title: "from-orange-500 to-red-500",
    },
    label: "Quiz",
  },
  "roast-quiz": {
    icon: Sparkles,
    palette: {
      sky: "from-rose-200 via-orange-200 to-amber-200",
      horizon: "from-rose-300/35 via-orange-300/20 to-transparent",
      ground: "from-rose-800 via-slate-800 to-slate-950",
      accent: "bg-orange-300",
      shadow: "shadow-[0_16px_26px_rgba(244,63,94,0.26)]",
      title: "from-rose-500 to-orange-500",
    },
    label: "Chaos",
  },
  "reaction-time": {
    icon: Crosshair,
    palette: {
      sky: "from-pink-200 via-rose-200 to-indigo-200",
      horizon: "from-cyan-300/30 via-violet-300/18 to-transparent",
      ground: "from-slate-800 via-slate-900 to-black",
      accent: "bg-pink-300",
      shadow: "shadow-[0_16px_26px_rgba(244,114,182,0.3)]",
      title: "from-rose-500 to-fuchsia-500",
    },
    label: "Reflex",
  },
  "tap-rush": {
    icon: Hand,
    palette: {
      sky: "from-amber-100 via-orange-100 to-yellow-200",
      horizon: "from-amber-300/30 via-orange-300/20 to-transparent",
      ground: "from-orange-700 via-slate-800 to-slate-950",
      accent: "bg-amber-300",
      shadow: "shadow-[0_16px_26px_rgba(245,158,11,0.28)]",
      title: "from-orange-500 to-amber-500",
    },
    label: "Tap",
  },
  "split-second": {
    icon: TimerReset,
    palette: {
      sky: "from-blue-200 via-cyan-200 to-emerald-200",
      horizon: "from-cyan-300/35 via-emerald-300/20 to-transparent",
      ground: "from-slate-800 via-slate-900 to-black",
      accent: "bg-cyan-300",
      shadow: "shadow-[0_16px_26px_rgba(34,211,238,0.28)]",
      title: "from-cyan-500 to-emerald-500",
    },
    label: "Micro",
  },
  "king-hill": {
    icon: Crown,
    palette: {
      sky: "from-lime-200 via-emerald-200 to-cyan-200",
      horizon: "from-emerald-300/30 via-cyan-300/20 to-transparent",
      ground: "from-emerald-700 via-slate-800 to-slate-950",
      accent: "bg-amber-300",
      shadow: "shadow-[0_16px_26px_rgba(16,185,129,0.3)]",
      title: "from-emerald-500 to-lime-500",
    },
    label: "Arena",
  },
  undercover: {
    icon: VenetianMask,
    palette: {
      sky: "from-slate-200 via-indigo-200 to-violet-300",
      horizon: "from-violet-300/30 via-indigo-300/20 to-transparent",
      ground: "from-indigo-800 via-slate-900 to-black",
      accent: "bg-white/92",
      shadow: "shadow-[0_16px_26px_rgba(99,102,241,0.3)]",
      title: "from-sky-500 to-blue-500",
    },
    label: "Bluff",
  },
  "loup-garou": {
    icon: MoonStar,
    palette: {
      sky: "from-slate-200 via-indigo-200 to-blue-300",
      horizon: "from-blue-300/20 via-indigo-300/14 to-transparent",
      ground: "from-slate-800 via-slate-900 to-black",
      accent: "bg-indigo-300",
      shadow: "shadow-[0_16px_26px_rgba(59,130,246,0.24)]",
      title: "from-indigo-500 to-slate-800",
    },
    label: "Night",
  },
  infiltre: {
    icon: Skull,
    palette: {
      sky: "from-stone-200 via-zinc-200 to-neutral-300",
      horizon: "from-zinc-300/28 via-neutral-200/16 to-transparent",
      ground: "from-zinc-700 via-slate-800 to-black",
      accent: "bg-rose-300",
      shadow: "shadow-[0_16px_26px_rgba(39,39,42,0.28)]",
      title: "from-zinc-700 to-black",
    },
    label: "Spy",
  },
  "la-taupe": {
    icon: Rabbit,
    palette: {
      sky: "from-cyan-200 via-sky-200 to-blue-200",
      horizon: "from-cyan-300/28 via-blue-300/20 to-transparent",
      ground: "from-emerald-700 via-slate-800 to-slate-950",
      accent: "bg-cyan-300",
      shadow: "shadow-[0_16px_26px_rgba(6,182,212,0.28)]",
      title: "from-cyan-500 to-sky-500",
    },
    label: "Secret",
  },
  "black-market": {
    icon: Landmark,
    palette: {
      sky: "from-yellow-100 via-amber-100 to-orange-200",
      horizon: "from-orange-300/32 via-amber-300/20 to-transparent",
      ground: "from-amber-700 via-slate-800 to-black",
      accent: "bg-yellow-200",
      shadow: "shadow-[0_16px_26px_rgba(245,158,11,0.28)]",
      title: "from-amber-500 to-orange-600",
    },
    label: "Trade",
  },
  "code-names": {
    icon: BadgeHelp,
    palette: {
      sky: "from-red-100 via-orange-100 to-amber-100",
      horizon: "from-red-300/26 via-orange-300/14 to-transparent",
      ground: "from-red-700 via-slate-800 to-black",
      accent: "bg-amber-200",
      shadow: "shadow-[0_16px_26px_rgba(220,38,38,0.22)]",
      title: "from-red-500 to-orange-500",
    },
    label: "Teams",
  },
  roulette: {
    icon: Crosshair,
    palette: {
      sky: "from-stone-200 via-zinc-200 to-red-200",
      horizon: "from-red-300/20 via-zinc-300/16 to-transparent",
      ground: "from-zinc-700 via-slate-900 to-black",
      accent: "bg-red-300",
      shadow: "shadow-[0_16px_26px_rgba(239,68,68,0.24)]",
      title: "from-zinc-800 to-red-700",
    },
    label: "Risk",
  },
  chess: {
    icon: Shield,
    palette: {
      sky: "from-slate-100 via-zinc-100 to-stone-200",
      horizon: "from-stone-300/20 via-zinc-300/12 to-transparent",
      ground: "from-stone-700 via-slate-800 to-black",
      accent: "bg-white/90",
      shadow: "shadow-[0_16px_26px_rgba(68,64,60,0.28)]",
      title: "from-stone-700 to-black",
    },
    label: "Classic",
  },
  battleship: {
    icon: Shield,
    palette: {
      sky: "from-cyan-200 via-sky-200 to-blue-300",
      horizon: "from-sky-300/30 via-blue-300/18 to-transparent",
      ground: "from-blue-800 via-slate-800 to-slate-950",
      accent: "bg-sky-300",
      shadow: "shadow-[0_16px_26px_rgba(59,130,246,0.26)]",
      title: "from-sky-500 to-blue-600",
    },
    label: "Naval",
  },
  "motion-tennis": {
    icon: Trophy,
    palette: {
      sky: "from-blue-200 via-cyan-200 to-emerald-200",
      horizon: "from-emerald-300/24 via-cyan-300/18 to-transparent",
      ground: "from-emerald-700 via-slate-800 to-slate-950",
      accent: "bg-lime-300",
      shadow: "shadow-[0_16px_26px_rgba(52,211,153,0.26)]",
      title: "from-emerald-500 to-lime-500",
    },
    label: "Sport",
  },
  uno: {
    icon: BookOpenText,
    palette: {
      sky: "from-red-200 via-yellow-100 to-blue-200",
      horizon: "from-yellow-300/22 via-red-300/18 to-transparent",
      ground: "from-blue-800 via-slate-800 to-black",
      accent: "bg-white/92",
      shadow: "shadow-[0_16px_26px_rgba(59,130,246,0.24)]",
      title: "from-red-500 to-yellow-500",
    },
    label: "Cards",
  },
  poker: {
    icon: Swords,
    palette: {
      sky: "from-emerald-200 via-teal-200 to-cyan-200",
      horizon: "from-emerald-300/20 via-cyan-300/14 to-transparent",
      ground: "from-emerald-800 via-slate-800 to-black",
      accent: "bg-emerald-300",
      shadow: "shadow-[0_16px_26px_rgba(16,185,129,0.24)]",
      title: "from-emerald-500 to-teal-600",
    },
    label: "Cards",
  },
};

function fallbackConfig(gameId: string, category?: string): CoverConfig {
  const categoryMap: Record<string, CoverConfig> = {
    words: { icon: Link2, palette: DEFAULT_PALETTE, label: "Words" },
    trivia: { icon: Brain, palette: DEFAULT_PALETTE, label: "Quiz" },
    speed: { icon: TimerReset, palette: DEFAULT_PALETTE, label: "Arcade" },
    strategy: { icon: Shield, palette: DEFAULT_PALETTE, label: "Strategy" },
    social: { icon: VenetianMask, palette: DEFAULT_PALETTE, label: "Bluff" },
    cards: { icon: BookOpenText, palette: DEFAULT_PALETTE, label: "Cards" },
    party: { icon: Sparkles, palette: DEFAULT_PALETTE, label: "Party" },
    sport: { icon: Trophy, palette: DEFAULT_PALETTE, label: "Sport" },
  };

  return GAME_COVER_MAP[gameId] ?? categoryMap[category ?? ""] ?? {
    icon: Sparkles,
    palette: DEFAULT_PALETTE,
    label: "Game",
  };
}

interface GameCoverProps {
  gameId: string;
  name: string;
  category?: string;
  compact?: boolean;
  className?: string;
}

export function GameCover({
  gameId,
  name,
  category,
  compact = false,
  className,
}: GameCoverProps) {
  const [useGeneratedImage, setUseGeneratedImage] = useKeyedState(gameId, true);
  const { icon: Icon, palette, label } = fallbackConfig(gameId, category);
  const generatedImagePath = `/game-covers/${gameId}.png`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.65rem] border-[3px] border-slate-800 bg-slate-200 shadow-[0_10px_0_rgba(15,23,42,0.95)]",
        compact ? "aspect-[1.05/1.1]" : "aspect-[0.92/1.18]",
        className
      )}
    >
      {useGeneratedImage ? (
        <>
          <Image
            src={generatedImagePath}
            alt={name}
            fill
            sizes={compact ? "40vw" : "25vw"}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setUseGeneratedImage(false)}
          />
          <div className="absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-black/58 via-black/22 to-transparent" />
          <div className="absolute inset-x-[7%] bottom-[6%]">
            <div className="rounded-[1.15rem] border-[3px] border-slate-900 bg-white/94 px-3 py-2 shadow-[0_8px_0_rgba(15,23,42,0.9)]">
              <div className="rounded-[0.9rem] bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-2">
                <p
                  className={cn(
                    "font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]",
                    compact ? "line-clamp-2 text-base" : "line-clamp-2 text-[1.05rem]"
                  )}
                >
                  {name}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={cn("absolute inset-0 bg-gradient-to-b", palette.sky)} />
          <div className={cn("absolute inset-x-0 top-[32%] h-[35%] bg-gradient-to-b", palette.horizon)} />
          <div className="absolute inset-x-[10%] top-[11%] h-[3%] rounded-full bg-white/80" />
          <div className="absolute inset-x-0 bottom-[18%] h-[34%] bg-gradient-to-b from-transparent via-slate-950/12 to-slate-950/60" />
          <div className={cn("absolute inset-x-[-8%] bottom-0 h-[38%] bg-gradient-to-b", palette.ground)} />
          <div className="absolute inset-x-[-8%] bottom-[8%] h-[19%] bg-slate-900/35 [clip-path:polygon(0_100%,0_58%,13%_48%,26%_66%,38%_38%,52%_70%,66%_44%,81%_62%,100%_50%,100%_100%)]" />

          <div className="absolute left-[11%] top-[19%] rounded-full border border-white/50 bg-white/24 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-900">
            {label}
          </div>

          <div
            className={cn(
              "absolute left-1/2 top-[36%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.5rem] border-[3px] border-slate-800/75 text-slate-900",
              palette.accent,
              palette.shadow,
              compact ? "h-[33%] w-[33%]" : "h-[31%] w-[31%]"
            )}
          >
            <Icon className={cn(compact ? "h-12 w-12" : "h-14 w-14")} strokeWidth={2.6} />
          </div>

          <div className="absolute inset-x-[8%] bottom-[6%]">
            <div className="rounded-[1.15rem] border-[3px] border-slate-800 bg-white/94 px-3 py-2 shadow-[0_8px_0_rgba(15,23,42,0.9)]">
              <div className={cn("rounded-[0.9rem] bg-gradient-to-r px-3 py-2", palette.title)}>
                <p
                  className={cn(
                    "font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]",
                    compact ? "line-clamp-2 text-base" : "line-clamp-2 text-[1.05rem]"
                  )}
                >
                  {name}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
