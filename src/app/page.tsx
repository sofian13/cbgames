"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Pencil, Check, Gamepad2 } from "lucide-react";
import { EmberBackground, MagneticButton, EmberKeyframes } from "@/components/shared/ember";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { GAMES } from "@/lib/games/registry";

function useTyping(text: string, startDelay: number, charSpeed = 35) {
  const [out, setOut] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, charSpeed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, startDelay, charSpeed]);
  return out;
}

function AnimatedTitle({ delay }: { delay: number }) {
  const text = "AF Games";
  const letters = text.split("");
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShimmer(true), delay + letters.length * 90 + 600);
    return () => clearTimeout(t);
  }, [delay, letters.length]);

  return (
    <h1
      className="relative font-serif"
      style={{
        fontSize: "clamp(3.5rem, 12vw, 9rem)",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 0.9,
      }}
    >
      {letters.map((ch, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            opacity: 0,
            animation: `letterIn 0.9s cubic-bezier(0.16,1,0.3,1) ${delay + i * 90}ms forwards`,
            textShadow: shimmer
              ? "0 0 40px rgba(80,216,255,0.35), 0 0 80px rgba(89,120,255,0.16)"
              : "0 0 0 transparent",
            transition: "text-shadow 1.5s ease",
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
      {shimmer && (
        <span
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, transparent 35%, rgba(112,228,255,0.2) 50%, transparent 65%, transparent 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 5s ease-in-out infinite",
          }}
        >
          {text}
        </span>
      )}
    </h1>
  );
}

function UsernameEditor({
  initialName,
  onSave,
}: {
  initialName: string;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== initialName) {
      onSave(trimmed);
    } else {
      setName(initialName);
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
      >
        <span className="text-sm font-sans font-medium text-white/70 group-hover:text-white/90 transition-colors">
          {initialName}
        </span>
        <Pencil className="h-3 w-3 text-white/20 group-hover:text-cyan-300/70 transition-colors" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 20))}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setName(initialName);
            setEditing(false);
          }
        }}
        onBlur={save}
        maxLength={20}
        className="w-44 rounded-xl border border-cyan-300/30 bg-cyan-300/8 px-4 py-2 text-center text-sm text-white font-sans outline-none transition-all focus:border-cyan-300/50 focus:shadow-[0_0_20px_rgba(80,216,255,0.15)]"
      />
      <button onClick={save} className="text-cyan-300/75 hover:text-cyan-200 transition-colors">
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [guestName, setGuestNameState] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateGuest().name;
  });
  const subtitle = useTyping("Joue avec tes potes, sans pub, sans prise de tete.", 1800, 30);
  const gameCount = GAMES.filter((g) => g.implemented).length;

  const handleSaveName = useCallback((newName: string) => {
    setGuestName(newName);
    setGuestNameState(newName);
  }, []);

  const handleCreate = useCallback(() => {
    const roomCode = generateRoomCode();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("af-created-room-code", roomCode);
    }
    router.push(`/room/${roomCode}`);
  }, [router]);

  const handleJoin = useCallback(() => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === ROOM_CODE_LENGTH) {
      router.push(`/room/${trimmed}`);
    }
  }, [code, router]);

  return (
    <EmberBackground>
      <EmberKeyframes />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-white select-none">
        {/* Game count chip */}
        <div
          className="mb-8 flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-1.5 backdrop-blur-sm"
          style={{ opacity: 0, animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards" }}
        >
          <Gamepad2 className="h-3.5 w-3.5 text-cyan-300/70" />
          <span className="text-[11px] font-sans font-medium tracking-wide text-cyan-200/70">
            {gameCount} jeux disponibles
          </span>
        </div>

        {/* Title */}
        <div className="mb-4">
          <AnimatedTitle delay={700} />
        </div>

        {/* Subtitle */}
        <p
          className="mb-10 h-5 text-center font-sans"
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
            fontWeight: 400,
          }}
        >
          {subtitle}
          <span style={{ animation: "blink 0.8s step-end infinite", color: "rgba(80,216,255,0.5)" }}>|</span>
        </p>

        {/* Username */}
        <div
          className="mb-10 flex flex-col items-center gap-2"
          style={{ opacity: 0, animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 2s forwards" }}
        >
          <span className="section-title mb-1">Ton pseudo</span>
          {guestName && <UsernameEditor initialName={guestName} onSave={handleSaveName} />}
        </div>

        {/* Action buttons */}
        <div
          className="flex w-full max-w-lg flex-col items-center gap-3 sm:flex-row sm:justify-center"
          style={{ opacity: 0, animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 2.3s forwards" }}
        >
          <MagneticButton
            onClick={handleCreate}
            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 px-7 py-4 sm:w-auto"
            style={{ backdropFilter: "blur(16px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <Plus className="h-4 w-4 text-cyan-300/70 group-hover:text-cyan-200 transition-colors duration-500" />
            <span className="text-[13px] font-semibold tracking-[0.06em] text-white/80 group-hover:text-white transition-colors duration-500 font-sans">
              Nouvelle salle
            </span>
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-600"
              style={{ boxShadow: "0 0 50px rgba(76,176,255,0.2), inset 0 0 30px rgba(90,130,255,0.08)" }}
            />
          </MagneticButton>

          <MagneticButton
            className="group relative flex w-full items-center overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] sm:w-auto"
            style={{ backdropFilter: "blur(16px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, ROOM_CODE_LENGTH))
              }
              placeholder="CODE"
              maxLength={ROOM_CODE_LENGTH}
              className="w-full bg-transparent px-5 py-4 text-center text-[13px] font-semibold tracking-[0.35em] text-white/75 placeholder:text-white/15 outline-none font-sans sm:w-[7.5rem]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoin();
              }}
            />
            <button
              onClick={handleJoin}
              className="flex items-center justify-center border-l border-white/[0.08] px-5 py-4 text-white/30 transition-all duration-300 hover:text-cyan-200 hover:bg-cyan-300/10"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </MagneticButton>
        </div>

        {/* Footer */}
        <p
          className="mt-16 text-[10px] tracking-[0.15em] text-white/[0.12] font-sans"
          style={{ opacity: 0, animation: "fadeIn 1s ease 3.5s forwards" }}
        >
          Gratuit &bull; Open source &bull; Aucun compte requis
        </p>
      </main>
    </EmberBackground>
  );
}
