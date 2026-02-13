"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Plus, ArrowRight, Pencil, Check, LogOut } from "lucide-react";
import { EmberBackground, MagneticButton, EmberKeyframes } from "@/components/shared/ember";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";

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
    <h1 className="relative font-serif" style={{ fontSize: "clamp(4.5rem,11vw,8.5rem)", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 0.92 }}>
      {letters.map((ch, i) => (
        <span key={i} className="inline-block" style={{
          opacity: 0, animation: `letterIn 0.9s cubic-bezier(0.16,1,0.3,1) ${delay + i * 90}ms forwards`,
          textShadow: shimmer ? "0 0 40px rgba(220,75,35,0.3), 0 0 80px rgba(200,55,30,0.12)" : "0 0 0 transparent",
          transition: "text-shadow 1.5s ease",
        }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
      {shimmer && (
        <span className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
          background: "linear-gradient(90deg, transparent 0%, transparent 35%, rgba(255,170,90,0.12) 50%, transparent 65%, transparent 100%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shimmer 5s ease-in-out infinite",
        }}>{text}</span>
      )}
    </h1>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function UsernameEditor({ initialName, onSave }: { initialName: string; onSave: (name: string) => void }) {
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
        className="group flex items-center gap-2 transition-all duration-300"
      >
        <span className="text-sm font-sans text-white/60 group-hover:text-white/90 transition-colors">
          {initialName}
        </span>
        <Pencil className="w-3 h-3 text-white/20 group-hover:text-ember/60 transition-colors" />
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
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(initialName); setEditing(false); } }}
        onBlur={save}
        maxLength={20}
        className="bg-white/[0.04] border border-white/[0.12] rounded-lg px-3 py-1.5 text-sm text-white font-sans outline-none focus:border-ember/40 transition-all w-40 text-center"
      />
      <button onClick={save} className="text-ember/60 hover:text-ember transition-colors">
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [guestName, setGuestNameState] = useState("");
  const subtitle = useTyping("Joue avec tes potes, sans pub, sans prise de tête.", 1800, 30);

  // Load guest name on mount
  useEffect(() => {
    const guest = getOrCreateGuest();
    setGuestNameState(guest.name);
  }, []);

  const handleSaveName = useCallback((newName: string) => {
    setGuestName(newName);
    setGuestNameState(newName);
  }, []);

  const handleCreate = useCallback(() => {
    const roomCode = generateRoomCode();
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

      {/* Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-white select-none">
        {/* Title */}
        <div className="mb-5">
          <AnimatedTitle delay={700} />
        </div>

        {/* Subtitle (typing) */}
        <p className="h-5 mb-10 font-sans" style={{ fontSize: "0.7rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", fontWeight: 300 }}>
          {subtitle}
          <span style={{ animation: "blink 0.8s step-end infinite", color: "rgba(200,60,30,0.5)" }}>|</span>
        </p>

        {/* User identity */}
        <div className="mb-8 flex flex-col items-center gap-2" style={{ opacity: 0, animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 2s forwards" }}>
          {session?.user ? (
            /* Discord user — show avatar + name + sign out */
            <div className="flex items-center gap-3 rounded-full border border-white/[0.08] px-4 py-2" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)" }}>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-7 h-7 rounded-full ring-2 ring-ember/30"
                />
              )}
              <span className="text-sm font-sans text-white/80">
                {session.user.name}
              </span>
              <div className="w-px h-4 bg-white/[0.08]" />
              <button
                onClick={() => signOut()}
                className="text-white/20 hover:text-white/50 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Guest — editable username */
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-sans">
                Ton pseudo
              </span>
              {guestName && (
                <UsernameEditor initialName={guestName} onSave={handleSaveName} />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3.5 items-center" style={{ opacity: 0, animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 2.2s forwards" }}>
          {/* Create room */}
          <MagneticButton
            onClick={handleCreate}
            className="group flex items-center gap-2.5 rounded-full border border-white/[0.08] overflow-hidden relative"
            style={{ padding: "0.85rem 2.2rem", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <Plus className="w-3.5 h-3.5 text-white/40 group-hover:text-red-400/80 transition-colors duration-500" />
            <span className="text-[13px] font-medium tracking-[0.04em] text-white/70 group-hover:text-white transition-colors duration-500 font-sans">
              Nouvelle salle
            </span>
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-600" style={{ boxShadow: "0 0 50px rgba(200,55,28,0.12), inset 0 0 30px rgba(200,55,28,0.04)" }} />
          </MagneticButton>

          {/* Join room */}
          <MagneticButton
            className="group flex items-center rounded-full border border-white/[0.08] overflow-hidden relative"
            style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <input
              type="text" value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, ROOM_CODE_LENGTH))}
              placeholder="CODE" maxLength={ROOM_CODE_LENGTH}
              className="bg-transparent w-[5.5rem] px-5 py-3.5 text-[13px] tracking-[0.35em] text-white/70 placeholder:text-white/15 outline-none text-center font-sans"
              onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
              onFocus={e => {
                const p = e.currentTarget.parentElement;
                if (p) { p.style.borderColor = "rgba(200,65,30,0.3)"; p.style.boxShadow = "0 0 50px rgba(200,55,28,0.1)"; }
              }}
              onBlur={e => {
                const p = e.currentTarget.parentElement;
                if (p) { p.style.borderColor = "rgba(255,255,255,0.08)"; p.style.boxShadow = "none"; }
              }}
            />
            <button
              onClick={handleJoin}
              className="flex items-center justify-center px-4 py-3.5 border-l border-white/[0.06] text-white/30 hover:text-red-400/70 hover:bg-white/[0.03] transition-all duration-300"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </MagneticButton>
        </div>

        {/* Discord login for guests */}
        {!session?.user && (
          <button onClick={() => signIn("discord")} className="group flex items-center gap-2 mt-10" style={{ opacity: 0, animation: "fadeIn 1s ease 2.8s forwards" }}>
            <DiscordIcon className="w-3.5 h-3.5 text-white/15 group-hover:text-[#5865F2]/60 transition-colors duration-500" />
            <span className="text-[11px] tracking-[0.12em] text-white/15 group-hover:text-white/40 transition-colors duration-500 font-sans">
              Connexion Discord
            </span>
          </button>
        )}
      </main>
    </EmberBackground>
  );
}
