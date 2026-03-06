"use client";

import { useState, useCallback, useRef } from "react";
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
    <h1
      className="relative font-serif"
      style={{
        fontSize: "clamp(3.2rem,11vw,8.5rem)",
        fontWeight: 300,
        letterSpacing: "-0.02em",
        lineHeight: 0.92,
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

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
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
        className="group flex items-center gap-2 transition-all duration-300"
      >
        <span className="text-sm font-sans text-white/60 group-hover:text-white/90 transition-colors">
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
        className="w-44 rounded-lg border border-cyan-300/24 bg-cyan-300/8 px-3 py-1.5 text-center text-sm text-white font-sans outline-none transition-all focus:border-cyan-300/45"
      />
      <button onClick={save} className="text-cyan-300/75 hover:text-cyan-200 transition-colors">
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [guestName, setGuestNameState] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateGuest().name;
  });
  const subtitle = useTyping("Joue avec tes potes, sans pub, sans prise de tete.", 1800, 30);

  const handleSaveName = useCallback((newName: string) => {
    setGuestName(newName);
    setGuestNameState(newName);
  }, []);

  const handleCreate = useCallback(() => {
    const roomCode = generateRoomCode();
    router.push(`/room/${roomCode}?host=1`);
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
        <div className="mb-5">
          <AnimatedTitle delay={700} />
        </div>

        <p
          className="mb-8 h-5 text-center font-sans"
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 300,
          }}
        >
          {subtitle}
          <span style={{ animation: "blink 0.8s step-end infinite", color: "rgba(80,216,255,0.6)" }}>|</span>
        </p>

        <div
          className="mb-8 flex flex-col items-center gap-2"
          style={{ opacity: 0, animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 2s forwards" }}
        >
          {session?.user ? (
            <div className="premium-panel-soft flex items-center gap-3 rounded-full px-4 py-2">
              {session.user.image && (
                <img src={session.user.image} alt="" className="h-7 w-7 rounded-full ring-2 ring-cyan-300/40" />
              )}
              <span className="text-sm font-sans text-white/80">{session.user.name}</span>
              <div className="h-4 w-px bg-white/[0.08]" />
              <button
                onClick={() => signOut()}
                className="text-white/25 hover:text-white/55 transition-colors"
                title="Deconnexion"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-sans">Ton pseudo</span>
              {guestName && <UsernameEditor initialName={guestName} onSave={handleSaveName} />}
            </div>
          )}
        </div>

        <div
          className="flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center"
          style={{ opacity: 0, animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 2.2s forwards" }}
        >
          <MagneticButton
            onClick={handleCreate}
            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full border border-cyan-300/24 bg-cyan-300/8 px-6 py-3.5 sm:w-auto"
            style={{ backdropFilter: "blur(16px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <Plus className="h-3.5 w-3.5 text-white/45 group-hover:text-cyan-300 transition-colors duration-500" />
            <span className="text-[13px] font-medium tracking-[0.04em] text-white/75 group-hover:text-white transition-colors duration-500 font-sans">
              Nouvelle salle
            </span>
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-600"
              style={{ boxShadow: "0 0 50px rgba(76,176,255,0.2), inset 0 0 30px rgba(90,130,255,0.08)" }}
            />
          </MagneticButton>

          <MagneticButton
            className="group relative flex w-full items-center overflow-hidden rounded-full border border-cyan-300/24 bg-cyan-300/8 sm:w-auto"
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
              className="w-full bg-transparent px-5 py-3.5 text-center text-[13px] tracking-[0.35em] text-white/75 placeholder:text-white/18 outline-none font-sans sm:w-[7rem]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoin();
              }}
            />
            <button
              onClick={handleJoin}
              className="flex items-center justify-center border-l border-cyan-300/18 px-4 py-3.5 text-white/35 transition-all duration-300 hover:text-cyan-200 hover:bg-cyan-300/10"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </MagneticButton>
        </div>

        {!session?.user && (
          <button
            onClick={() => signIn("discord")}
            className="group mt-10 flex items-center gap-2"
            style={{ opacity: 0, animation: "fadeIn 1s ease 2.8s forwards" }}
          >
            <DiscordIcon className="h-3.5 w-3.5 text-white/18 transition-colors duration-500 group-hover:text-[#5865F2]/75" />
            <span className="text-[11px] tracking-[0.12em] text-white/20 transition-colors duration-500 group-hover:text-white/45 font-sans">
              Connexion Discord
            </span>
          </button>
        )}
      </main>
    </EmberBackground>
  );
}
