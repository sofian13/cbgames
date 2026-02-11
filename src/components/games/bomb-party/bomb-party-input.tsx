"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface BombPartyInputProps {
  isMyTurn: boolean;
  syllable: string;
  onSubmit: (word: string) => void;
}

export function BombPartyInput({ isMyTurn, syllable, onSubmit }: BombPartyInputProps) {
  const [word, setWord] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and reset word when it's my turn or syllable changes
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
      <Input
        ref={inputRef}
        value={word}
        onChange={(e) => setWord(e.target.value.toLowerCase())}
        placeholder={isMyTurn ? `Mot avec "${syllable}"...` : "Attends ton tour..."}
        disabled={!isMyTurn}
        className="font-mono text-lg"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <Button type="submit" disabled={!isMyTurn || !word.trim()} size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
