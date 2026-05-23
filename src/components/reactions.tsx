"use client";

/**
 * GameReactions — blob-themed emoji reactions for live games.
 * Drop <GameReactions /> once inside a game screen: it renders a floating
 * reaction bar + the flying-blob overlay. Local (you see your own reactions).
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import PartySocket from "partysocket";
import { Mascot, MASCOT_PALETTE, type MascotColor, type MascotMood, type MascotLook } from "@/components/Mascot";
import { useAudio } from "@/lib/hooks/useAudio";
import { getPartyKitHost, getPartyKitWsProtocol } from "@/lib/party/host";

interface ReactionDef {
  id: string;
  label: string;
  hint: string;
  color: MascotColor;
  mood: MascotMood;
  sparkle?: boolean;
  arms?: boolean;
  crown?: boolean;
  sweat?: boolean;
  tear?: boolean;
  cheering?: boolean;
  look?: MascotLook;
}

const REACTIONS: ReactionDef[] = [
  { id: "haha", label: "Haha", hint: "Mort de rire", color: "yellow", mood: "laughing" },
  { id: "rofl", label: "ROFL", hint: "Plié en deux", color: "pink", mood: "rofl" },
  { id: "love", label: "Love", hint: "Adoré", color: "pink", mood: "love" },
  { id: "wow", label: "Wow", hint: "Choqué", color: "yellow", mood: "shocked", sparkle: true },
  { id: "mind", label: "Mind blown", hint: "Pété le cerveau", color: "purple", mood: "mindblown", sparkle: true },
  { id: "fire", label: "Feu", hint: "Énorme", color: "coral", mood: "fire" },
  { id: "clap", label: "Clap", hint: "Bien joué", color: "mint", mood: "happy", arms: true, cheering: true },
  { id: "king", label: "Roi", hint: "Couronne pour toi", color: "yellow", mood: "wink", crown: true },
  { id: "sus", label: "Suspect", hint: "Mouais...", color: "coral", mood: "sus" },
  { id: "think", label: "Réflexion", hint: "Hmm", color: "lavender", mood: "thinking" },
  { id: "cool", label: "Stylé", hint: "Trop classe", color: "sky", mood: "cool" },
  { id: "sleep", label: "Boring", hint: "Trop long", color: "lavender", mood: "asleep" },
  { id: "sad", label: "Triste", hint: "Snif", color: "sky", mood: "sad", tear: true },
  { id: "dead", label: "Mort", hint: "Game over", color: "white", mood: "dead" },
  { id: "kiss", label: "Bisou", hint: "Mwah", color: "pink", mood: "kiss" },
  { id: "angry", label: "Énervé", hint: "Grrrr", color: "coral", mood: "angry" },
  { id: "shocked", label: "Choqué", hint: "Quoi ?!", color: "purple", mood: "shocked" },
  { id: "sweat", label: "Stress", hint: "Ça transpire", color: "mint", mood: "neutral", sweat: true },
  { id: "shifty", label: "Shifty", hint: "Cache un truc", color: "coral", mood: "shifty", look: "shifty" },
  { id: "wink", label: "Wink", hint: "Entre nous", color: "purple", mood: "wink" },
];

const BY_ID: Record<string, ReactionDef> = Object.fromEntries(REACTIONS.map((r) => [r.id, r]));
const QUICK_IDS = ["haha", "love", "wow", "fire", "clap", "sus"];

interface Piece {
  key: number; id: string; left: number; size: number;
  driftX: number; rot1: number; rot2: number; rot3: number;
}

function BlobReaction({ r, size = 48 }: { r: ReactionDef; size?: number }) {
  return (
    <Mascot
      size={size} color={r.color} mood={r.mood} look={r.look}
      arms={r.arms} crown={r.crown} sweat={r.sweat} tear={r.tear}
      sparkle={r.sparkle} cheering={r.cheering}
      bob={false} blink={false} shadow={false}
    />
  );
}

export function GameReactions({ roomCode, gameId }: { roomCode?: string; gameId?: string }) {
  const [stream, setStream] = useState<Piece[]>([]);
  const [grid, setGrid] = useState(false);
  const idRef = useRef(0);
  const socketRef = useRef<PartySocket | null>(null);
  const { playClick } = useAudio();

  // Spawn a flying blob locally (used by own clicks + remote reactions).
  const spawn = useCallback((id: string, fromRemote = false) => {
    if (!BY_ID[id]) return;
    const piece: Piece = {
      key: ++idRef.current, id,
      left: fromRemote ? 25 + Math.random() * 50 : 45 + Math.random() * 10,
      size: 50 + Math.random() * 22,
      driftX: (Math.random() - 0.5) * 80,
      rot1: (Math.random() - 0.5) * 24,
      rot2: (Math.random() - 0.5) * 24,
      rot3: (Math.random() - 0.5) * 24,
    };
    setStream((s) => [...s, piece]);
    setTimeout(() => setStream((s) => s.filter((x) => x.key !== piece.key)), 2600);
  }, []);

  // Dedicated socket to the game party room — broadcasts reactions to everyone.
  useEffect(() => {
    if (!roomCode || !gameId) return;
    const host = getPartyKitHost();
    const socket = new PartySocket({
      host, room: `${roomCode}-${gameId}`, party: "game",
      protocol: getPartyKitWsProtocol(host),
    });
    socketRef.current = socket;
    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload?: { id?: string } };
        if (msg.type === "reaction" && msg.payload?.id) spawn(msg.payload.id, true);
      } catch { /* ignore */ }
    });
    return () => { socket.close(); socketRef.current = null; };
  }, [roomCode, gameId, spawn]);

  const fire = useCallback((id: string) => {
    if (!BY_ID[id]) return;
    spawn(id);
    playClick("pill");
    socketRef.current?.send(JSON.stringify({ type: "reaction", payload: { id } }));
  }, [spawn, playClick]);

  return (
    <>
      {/* Flying blobs overlay */}
      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
        {stream.map((p) => (
          <div
            key={p.key}
            className="absolute"
            style={{
              left: `${p.left}%`, bottom: 90, transform: "translateX(-50%)",
              animation: "reaction-fly 2.4s cubic-bezier(.4,.7,.6,1) forwards",
              ["--rx" as string]: `${p.driftX}px`,
              ["--rot1" as string]: `${p.rot1}deg`,
              ["--rot2" as string]: `${p.rot2}deg`,
              ["--rot3" as string]: `${p.rot3}deg`,
            } as CSSProperties}
          >
            <BlobReaction r={BY_ID[p.id]} size={p.size} />
          </div>
        ))}
      </div>

      {/* Floating bar — bottom-center, raised above the game dock */}
      <div className="fixed left-1/2 z-[85] -translate-x-1/2" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.2rem)" }}>
        {grid && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: "calc(100% + 12px)", width: 340, padding: 14, borderRadius: 24,
              background: "rgba(20,12,50,0.96)", border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
              animation: "picker-in .22s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <p className="af-eyebrow mb-2" style={{ color: "var(--text-dim)" }}>Envoyer une réaction</p>
            <div className="grid grid-cols-5 gap-1.5">
              {REACTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { fire(r.id); setGrid(false); }}
                  title={r.hint}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl border transition active:scale-95"
                  style={{ borderColor: "rgba(255,255,255,0.06)", background: `linear-gradient(180deg, ${MASCOT_PALETTE[r.color].body}26, rgba(255,255,255,0.02))` }}
                >
                  <BlobReaction r={r} size={34} />
                  <span className="mt-0.5 text-[8px] font-bold" style={{ color: "var(--text-muted)" }}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className="flex items-center gap-1 rounded-full p-1.5"
          style={{
            background: "rgba(20,12,50,0.85)", border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)",
          }}
        >
          {QUICK_IDS.map((id) => (
            <button
              key={id}
              onClick={() => fire(id)}
              title={BY_ID[id].hint}
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-90"
            >
              <BlobReaction r={BY_ID[id]} size={30} />
            </button>
          ))}
          <div className="mx-1 h-5 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          <button
            onClick={() => setGrid((g) => !g)}
            title="Plus de réactions"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-white transition active:scale-90"
            style={{ background: grid ? "var(--cb-brand)" : "rgba(255,255,255,0.06)", fontFamily: "var(--font-display)" }}
          >
            {grid ? "✕" : "+"}
          </button>
        </div>
      </div>
    </>
  );
}
