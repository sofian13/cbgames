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
      className={cn("group flex items-center gap-2 rounded-full border px-3 py-1.5 transition", className)}
      style={{
        background: "var(--cb-brand-tint)",
        borderColor: "var(--line-brand)",
        color: "var(--cb-brand)",
      }}
    >
      <span
        className="cb-mono text-xs font-bold tracking-[0.22em]"
        style={{ color: "var(--cb-brand)" }}
      >
        {code}
      </span>
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
      )}
    </button>
  );
}
