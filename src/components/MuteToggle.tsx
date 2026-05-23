"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/lib/hooks/useAudio";

interface MuteToggleProps {
  className?: string;
  size?: number;
}

export function MuteToggle({ className, size = 18 }: MuteToggleProps) {
  const { muted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      title={muted ? "Activer le son" : "Couper le son"}
      className={
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.12] " +
        (className ?? "")
      }
    >
      {muted ? <VolumeX size={size} /> : <Volume2 size={size} />}
    </button>
  );
}
