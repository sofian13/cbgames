"use client";

import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarCircleProps {
  name: string;
  avatar?: string;
  isConnected?: boolean;
  isHost?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function AvatarCircle({
  name,
  avatar,
  isConnected = true,
  isHost = false,
  size = "md",
  className,
}: AvatarCircleProps) {
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("relative", className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          "ring-1 ring-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.22)]",
          !isConnected && "opacity-45 grayscale"
        )}
      >
        {avatar && <AvatarImage src={avatar} alt={name} />}
        <AvatarFallback className="bg-gradient-to-br from-cyan-300/18 to-[#ff8755]/14 text-xs font-bold text-white">
          {initials}
        </AvatarFallback>
      </Avatar>

      <span
        className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
          isConnected
            ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
            : "bg-white/35"
        )}
      />

      {isHost && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/12 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.18)]">
          <Crown className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}
