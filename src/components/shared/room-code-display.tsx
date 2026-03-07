"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomCodeDisplayProps {
  code: string;
  className?: string;
}

export function RoomCodeDisplay({ code, className }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/room/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className={cn(
        "group flex min-w-0 items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-2 text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.12] sm:gap-2 sm:px-3.5",
        className
      )}
    >
      <span className="font-mono text-xs font-bold tracking-[0.16em] text-cyan-100/90 group-hover:text-white sm:text-sm sm:tracking-[0.22em]">
        {code}
      </span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-white/32 transition-colors group-hover:text-cyan-100" />
      )}
    </button>
  );
}
