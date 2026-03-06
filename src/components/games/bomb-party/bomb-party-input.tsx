"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!word.trim() || !isMyTurn) return;
    onSubmit(word.trim());
    setWord("");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_64px]">
      <div className="relative">
        <input
          ref={inputRef}
          value={word}
          onChange={(event) => setWord(event.target.value.toLowerCase())}
          placeholder={isMyTurn ? `Tape un mot avec \"${syllable}\"` : "Attends ton tour"}
          disabled={!isMyTurn}
          className={cn(
            "sunrise-input h-14 w-full rounded-2xl px-5 text-base font-semibold text-white outline-none transition-all",
            isMyTurn
              ? "border-[#ffb98c]/28 bg-white/[0.06] focus:border-[#ff8a3d]/42 focus:shadow-[0_0_0_1px_rgba(255,138,61,0.22),0_0_30px_rgba(255,138,61,0.12)]"
              : "opacity-60"
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
          "press-effect flex h-14 w-full items-center justify-center rounded-2xl border transition-all",
          isMyTurn && word.trim()
            ? "border-[#ffb98c]/35 bg-gradient-to-r from-[#ff8a3d] via-[#ff7a48] to-[#ff5d67] text-[#190b04] shadow-[0_18px_34px_rgba(255,118,63,0.28)]"
            : "border-white/10 bg-white/[0.04] text-white/24"
        )}
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  );
}
