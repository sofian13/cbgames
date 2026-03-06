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
        "group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-left transition-all duration-300 hover:border-[#72e4f7]/28 hover:bg-[#72e4f7]/10",
        className
      )}
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/34">Room code</p>
        <p className="mt-1 font-mono text-sm font-bold tracking-[0.28em] text-white/88">{code}</p>
      </div>
      {copied ? (
        <Check className="h-4 w-4 text-[#8ff2bb]" />
      ) : (
        <Copy className="h-4 w-4 text-white/28 transition-colors group-hover:text-[#72e4f7]" />
      )}
    </button>
  );
}
