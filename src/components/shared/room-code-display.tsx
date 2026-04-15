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
        "group flex min-w-0 items-center gap-1.5 rounded-full border border-[color:var(--line-brand)] bg-[linear-gradient(180deg,rgba(46,124,255,0.18),rgba(46,124,255,0.08))] px-3 py-2 text-white transition hover:border-[color:var(--brand)] hover:bg-[rgba(46,124,255,0.16)] sm:gap-2 sm:px-3.5",
        className
      )}
    >
      <span className="font-mono text-xs font-bold tracking-[0.18em] text-[color:var(--brand-light)] group-hover:text-white sm:text-sm sm:tracking-[0.24em]">
        {code}
      </span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[color:var(--brand-accent)]" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-white/32 transition-colors group-hover:text-[color:var(--brand-light)]" />
      )}
    </button>
  );
}
