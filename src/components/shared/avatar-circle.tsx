"use client";

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
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size], !isConnected && "opacity-40")}>
        {avatar && <AvatarImage src={avatar} alt={name} />}
        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {/* Online indicator */}
      <span
        className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
          isConnected ? "bg-green-500" : "bg-muted-foreground"
        )}
      />
      {/* Host crown */}
      {isHost && (
        <span className="absolute -top-1 -right-1 text-xs">👑</span>
      )}
    </div>
  );
}
