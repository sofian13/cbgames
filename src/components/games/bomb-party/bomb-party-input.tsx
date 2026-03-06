"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface BombPartyInputProps {
  isMyTurn: boolean;
  syllable: string;
  onSubmit: (word: string) => void;
}

export function BombPartyInput({ isMyTurn, syllable, onSubmit }: BombPartyInputProps) {
  const [word, setWord] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMyTurn) {
      inputRef.current?.focus();
    }
  }, [isMyTurn, syllable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !isMyTurn) return;
    onSubmit(word.trim());
    setWord("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          value={word}
          onChange={(e) => setWord(e.target.value.toLowerCase())}
          placeholder={isMyTurn ? `Mot avec "${syllable}"...` : "Attends ton tour..."}
          disabled={!isMyTurn}
          className={cn(
            "w-full rounded-2xl border bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none transition-all backdrop-blur-sm",
            isMyTurn
              ? "border-cyan-300/25 shadow-[0_0_20px_rgba(34,211,238,0.08)] focus:border-cyan-300/40 focus:shadow-[0_0_25px_rgba(34,211,238,0.15)]"
              : "border-white/[0.08] opacity-60"
          )}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
      <button
        type="submit"
        disabled={!isMyTurn || !word.trim()}
        className={cn(
          "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border transition-all",
          isMyTurn && word.trim()
            ? "border-emerald-400/30 bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] text-black shadow-[0_0_20px_rgba(78,207,138,0.25)] hover:shadow-[0_0_30px_rgba(78,207,138,0.4)] active:scale-95"
            : "border-white/[0.08] bg-white/[0.04] text-white/20"
        )}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}
