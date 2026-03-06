"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPartyKitHost } from "@/lib/party/host";

interface RoomCodeDisplayProps {
  code: string;
  className?: string;
}

export function RoomCodeDisplay({ code, className }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const url = new URL(`${window.location.origin}/room/${code}`);
    const partyHost = getPartyKitHost();
    if (partyHost && !partyHost.startsWith("localhost") && !partyHost.startsWith("127.")) {
      url.searchParams.set("pk", partyHost);
    }
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 font-mono text-xl font-bold tracking-[0.24em] text-cyan-200 premium-text-glow">
        {code}
      </span>
      <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8 border border-cyan-300/20 bg-cyan-300/10">
        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-cyan-200/80" />}
      </Button>
    </div>
  );
}
