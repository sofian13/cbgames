"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import QRCode from "react-qr-code";
import * as THREE from "three";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { TennisCourt } from "./tennis-court";
import { TennisBall } from "./tennis-ball";
import { TennisPlayer } from "./tennis-player";
import { TennisSounds } from "./tennis-sounds";
import { charTargets, ballStore, resetStore } from "./tennis-store";

type SwingType = "forehand" | "backhand" | "smash" | "slice" | "lob";

interface CharacterState {
  id: string;
  side: "near" | "far";
  role: "front" | "back";
  x: number;
  z: number;
}

interface TennisState {
  status: "waiting" | "connecting" | "serving" | "playing" | "point-scored" | "game-over";
  score: { near: number; far: number };
  servingSide: "near" | "far";
  ball: { x: number; y: number; z: number; vx: number; vy: number; vz: number } | null;
  hittable: boolean;
  hittableTarget: string | null;
  serveWindow: boolean;
  serveWindowPlayerId: string | null;
  activeCharacterId: string | null;
  characters: CharacterState[];
  hasBot: boolean;
  players: {
    id: string;
    name: string;
    side: "near" | "far";
    isBot: boolean;
    controllerConnected: boolean;
    lastSwing: string | null;
    score: number;
  }[];
  pointsToWin: number;
}

// Default character positions (doubles formation)
const DEFAULT_CHARACTERS: CharacterState[] = [
  { id: "near-front", side: "near", role: "front", x: -3.5, z: -12 },
  { id: "near-back", side: "near", role: "back", x: 3.5, z: -16 },
  { id: "far-front", side: "far", role: "front", x: 3.5, z: 12 },
  { id: "far-back", side: "far", role: "back", x: -3.5, z: 16 },
];

// Team colors: near = blue team, far = red team
const CHAR_COLORS: Record<string, string> = {
  "near-front": "#3b82f6",
  "near-back": "#60a5fa",
  "far-front": "#ef4444",
  "far-back": "#f87171",
};

/** Static camera — fixed position behind the near player (Wii Sports style) */
function StaticCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 20, -32);
    camera.lookAt(new THREE.Vector3(0, 0, 5));
  }, [camera]);
  return null;
}

export default function MotionTennisGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "motion-tennis", playerId, playerName);
  const { gameState } = useGameStore();
  const state = gameState as unknown as TennisState;

  // --- React state: UI-only (triggers re-renders for overlays) ---
  const [pointMessage, setPointMessage] = useState<string | null>(null);
  const [timingMessage, setTimingMessage] = useState<{ text: string; color: string } | null>(null);
  const [swingAnimations, setSwingAnimations] = useState<Record<string, { active: boolean; type: string | null }>>({});
  const [showServePrompt, setShowServePrompt] = useState(false);

  // Character list: set ONCE from the first game state that contains characters, used to render TennisPlayer components
  const characterListRef = useRef<CharacterState[]>(DEFAULT_CHARACTERS);
  const [characterList, setCharacterList] = useState<CharacterState[]>(DEFAULT_CHARACTERS);
  const characterListInitialized = useRef(false);

  const ambientStopRef = useRef<(() => void) | null>(null);

  const controllerUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/controller/${roomCode}`;
  }, [roomCode]);

  // Clear stale mutable store data on mount
  useEffect(() => {
    resetStore();

    // Seed charTargets with default positions
    for (const char of DEFAULT_CHARACTERS) {
      charTargets[char.id] = { x: char.x, z: char.z };
    }

    return () => {
      resetStore();
    };
  }, []);

  // Start ambient crowd when game begins
  useEffect(() => {
    if (state.status === "playing" && !ambientStopRef.current) {
      ambientStopRef.current = TennisSounds.ambientStart();
    }
    if (state.status === "game-over" && ambientStopRef.current) {
      ambientStopRef.current();
      ambientStopRef.current = null;
    }
    return () => {
      if (ambientStopRef.current) {
        ambientStopRef.current();
        ambientStopRef.current = null;
      }
    };
  }, [state.status]);

  // Initialize character list from first game state that has characters
  useEffect(() => {
    if (!characterListInitialized.current && state.characters && state.characters.length > 0) {
      characterListRef.current = state.characters;
      setCharacterList(state.characters);
      characterListInitialized.current = true;

      // Seed charTargets with initial positions
      for (const char of state.characters) {
        charTargets[char.id] = { x: char.x, z: char.z };
      }
    }
  }, [state.characters]);

  // Process game events via Zustand subscribe — fires SYNCHRONOUSLY for every
  // WebSocket message, bypassing React's batching. This ensures every ball-tick
  // reaches the mutable store even if React batches multiple updates per frame.
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prevState) => {
      if (state.gameState === prevState.gameState) return;

      const update = state.gameState;
      const event = update.event as string | undefined;
      if (!event) return;

      switch (event) {
        case "ball-tick": {
          // Write ball position to mutable store SYNCHRONOUSLY (no React)
          const ball = update.ball as { x: number; y: number; z: number } | undefined;
          if (ball) {
            ballStore.current = { x: ball.x, y: ball.y, z: ball.z };
          }

          // Write character targets to mutable store SYNCHRONOUSLY (no React)
          const chars = update.characters as CharacterState[] | undefined;
          if (chars) {
            for (const char of chars) {
              charTargets[char.id] = { x: char.x, z: char.z };
            }
          }
          break;
        }

        case "ball-served": {
          const ball = update.ball as { x: number; y: number; z: number } | undefined;
          if (ball) {
            ballStore.current = { x: ball.x, y: ball.y, z: ball.z };
          }

          TennisSounds.serve();
          setShowServePrompt(false);

          const activeChar = update.activeCharacterId as string | undefined;
          if (activeChar) {
            setSwingAnimations((prev) => ({
              ...prev,
              [activeChar]: { active: true, type: (update.swingType as string) || "forehand" },
            }));
            setTimeout(() => {
              setSwingAnimations((prev) => ({
                ...prev,
                [activeChar]: { active: false, type: null },
              }));
            }, 400);
          }
          break;
        }

        case "ball-hit": {
          const ball = update.ball as { x: number; y: number; z: number } | undefined;
          if (ball) {
            ballStore.current = { x: ball.x, y: ball.y, z: ball.z };
          }

          const swingType = update.swingType as string;
          const power = update.power as number;
          const activeChar = update.activeCharacterId as string | undefined;
          const timing = update.timingResult as "early" | "perfect" | "late" | undefined;

          if (swingType === "smash") {
            TennisSounds.smash();
          } else {
            TennisSounds.hit(power);
          }

          if (timing) {
            const timingMap: Record<string, { text: string; color: string }> = {
              early: { text: "T\u00D4T !", color: "#f59e0b" },
              perfect: { text: "PARFAIT !", color: "#22c55e" },
              late: { text: "TARD !", color: "#ef4444" },
            };
            setTimingMessage(timingMap[timing] ?? null);
            if (timing === "perfect") TennisSounds.perfect();
            setTimeout(() => setTimingMessage(null), timing === "perfect" ? 1200 : 800);
          }

          if (activeChar) {
            setSwingAnimations((prev) => ({
              ...prev,
              [activeChar]: { active: true, type: swingType },
            }));
            setTimeout(() => {
              setSwingAnimations((prev) => ({
                ...prev,
                [activeChar]: { active: false, type: null },
              }));
            }, 400);
          }
          break;
        }

        case "ball-bounce":
          TennisSounds.bounce();
          break;

        case "characters-update": {
          const chars = update.characters as CharacterState[] | undefined;
          if (chars) {
            for (const char of chars) {
              charTargets[char.id] = { x: char.x, z: char.z };
            }
          }
          break;
        }

        case "player-swung": {
          // Wii Sports: swing anytime → character always swings visually
          const swungChar = update.activeCharacterId as string | undefined;
          const swungType = update.swingType as string;
          if (swungChar) {
            setSwingAnimations((prev) => ({
              ...prev,
              [swungChar]: { active: true, type: swungType || "forehand" },
            }));
            setTimeout(() => {
              setSwingAnimations((prev) => ({
                ...prev,
                [swungChar]: { active: false, type: null },
              }));
            }, 400);
          }
          break;
        }

        case "serve-window-open":
          setShowServePrompt(true);
          break;

        case "point-scored": {
          const reason = update.reason as string;
          const winnerName = update.winnerName as string;

          // Ball disappears on point scored
          ballStore.current = null;

          if (reason === "net") TennisSounds.net();
          else if (reason === "out") TennisSounds.out();

          TennisSounds.point();
          TennisSounds.crowd();

          setPointMessage(`Point pour ${winnerName} !`);
          setTimeout(() => setPointMessage(null), 2000);
          setShowServePrompt(false);
          break;
        }
      }
    });

    return unsub;
  }, []);

  // Keyboard — includes swingTimestamp + immediate visual swing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const swings: Record<string, string> = {
        ArrowRight: "forehand",
        ArrowLeft: "backhand",
        ArrowUp: "smash",
        ArrowDown: "slice",
        " ": "lob",
      };
      const swingType = swings[e.key];
      if (swingType) {
        sendAction({ action: "swing", swingType, power: 0.7, swingTimestamp: Date.now() });

        // Immediate visual: animate nearest "near" character (no server round-trip)
        const nearChars = characterListRef.current.filter((c) => c.side === "near");
        const animChar = nearChars[0]?.id;
        if (animChar) {
          setSwingAnimations((prev) => ({
            ...prev,
            [animChar]: { active: true, type: swingType },
          }));
          setTimeout(() => {
            setSwingAnimations((prev) => ({
              ...prev,
              [animChar]: { active: false, type: null },
            }));
          }, 400);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sendAction]);

  const nearPlayer = state.players?.find((p) => p.side === "near");
  const farPlayer = state.players?.find((p) => p.side === "far");

  // Connecting phase: show QR code
  if (!state.status || state.status === "waiting" || state.status === "connecting") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-8 max-w-md text-center">
          <div className="text-6xl">🎾</div>
          <h1 className="text-3xl font-serif font-light text-white/90">Motion Tennis</h1>
          <p className="text-white/50 font-sans text-sm">
            Doubles Wii Sports — 2 joueurs, 4 persos sur le terrain !
          </p>
          <p className="text-white/40 font-sans text-xs">
            Scanne ce QR code avec ton t&eacute;l&eacute;phone pour l&apos;utiliser comme raquette
          </p>

          <div className="rounded-2xl bg-white p-4">
            <QRCode value={controllerUrl} size={200} />
          </div>

          <p className="text-xs text-white/30 font-mono break-all">{controllerUrl}</p>

          {state.players && state.players.length > 0 && (
            <div className="space-y-2 w-full">
              <p className="text-xs text-white/40 font-sans">Joueurs connect&eacute;s :</p>
              {state.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-2"
                >
                  <span className="text-sm text-white/70 font-sans">{p.name}</span>
                  <span className={`text-xs font-sans ${p.controllerConnected ? "text-green-400" : "text-white/30"}`}>
                    {p.controllerConnected ? "📱 Manette connect\u00e9e" : "⏳ En attente de la manette"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => sendAction({ action: "start-keyboard" })}
            className="mt-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-3 text-white font-sans font-medium transition-colors"
          >
            ⌨️ Jouer au clavier
          </button>

          <p className="text-xs text-white/20 font-sans">
            → coup droit, ← revers, ↑ smash, ↓ slice, espace = lob
          </p>
        </div>
      </div>
    );
  }

  // Game phase: 3D scene
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 56px)" }}>
      {/* Score overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 rounded-xl bg-black/70 backdrop-blur-md px-8 py-3 border border-white/[0.08] shadow-xl">
        <div className="text-center min-w-[60px]">
          <p className="text-[10px] text-blue-400 font-sans uppercase tracking-wider font-medium">
            {nearPlayer?.name || "Joueur 1"}
          </p>
          <p className="text-4xl font-bold text-white font-mono">{state.score?.near ?? 0}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="text-white/20 text-lg font-light">vs</div>
          <div className="text-[8px] text-white/20 font-sans">
            Premier \u00e0 {state.pointsToWin || 7}
          </div>
        </div>
        <div className="text-center min-w-[60px]">
          <p className="text-[10px] text-red-400 font-sans uppercase tracking-wider font-medium">
            {farPlayer?.isBot ? "🤖 BOT" : farPlayer?.name || "Joueur 2"}
          </p>
          <p className="text-4xl font-bold text-white font-mono">{state.score?.far ?? 0}</p>
        </div>
      </div>

      {/* Serve prompt */}
      {(state.status === "serving" || showServePrompt) && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 animate-pulse rounded-xl bg-yellow-500/20 backdrop-blur-md px-6 py-3 border border-yellow-500/30 shadow-lg">
          <p className="text-lg text-yellow-300 font-sans font-bold text-center">
            🎾 SERVICE
          </p>
          <p className="text-sm text-yellow-200/70 font-sans text-center">
            {state.servingSide === "near" ? nearPlayer?.name : farPlayer?.name} — Swing pour servir !
          </p>
        </div>
      )}

      {/* Point scored message */}
      {pointMessage && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl bg-black/80 backdrop-blur-lg px-12 py-6 border border-ember/30 shadow-2xl">
            <p className="text-3xl font-serif text-white text-center">{pointMessage}</p>
          </div>
        </div>
      )}

      {/* Timing feedback */}
      {timingMessage && (
        <>
          {timingMessage.text === "PARFAIT !" && (
            <div className="absolute inset-0 z-24 pointer-events-none bg-green-400/15 animate-pulse" />
          )}
          <div className={`absolute z-25 pointer-events-none ${
            timingMessage.text === "PARFAIT !"
              ? "inset-0 flex items-center justify-center"
              : "top-36 left-1/2 -translate-x-1/2"
          }`}>
            <p
              className={`font-black font-sans ${
                timingMessage.text === "PARFAIT !" ? "text-7xl" : "text-2xl animate-bounce"
              }`}
              style={{
                color: timingMessage.color,
                textShadow: timingMessage.text === "PARFAIT !"
                  ? "0 0 20px rgba(34,197,94,0.9), 0 0 40px rgba(34,197,94,0.6), 0 0 80px rgba(34,197,94,0.3)"
                  : "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {timingMessage.text}
            </p>
          </div>
        </>
      )}

      {/* Controls legend — Wii Sports style */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 rounded-lg bg-black/50 backdrop-blur-sm px-4 py-3 border border-white/[0.08]">
        <p className="text-[10px] text-white/50 font-sans font-bold">Direction de la balle :</p>
        <p className="text-[10px] text-white/50 font-mono">→ Coup droit = balle à <span className="text-blue-400">DROITE</span></p>
        <p className="text-[10px] text-white/50 font-mono">← Revers = balle à <span className="text-blue-400">GAUCHE</span></p>
        <p className="text-[10px] text-white/50 font-mono">↑ Smash rapide · ↓ Slice courbe</p>
        <p className="text-[10px] text-white/50 font-mono">⎵ Lob haut</p>
        <p className="text-[9px] text-green-400/60 font-sans mt-1">Bon timing = PARFAIT !</p>
      </div>

      {/* 3D Canvas — no Physics wrapper */}
      <Canvas
        shadows
        camera={{
          position: [0, 20, -32],
          fov: 55,
          near: 0.1,
          far: 100,
        }}
        style={{ background: "#87CEEB" }}
      >
        <StaticCamera />

        <TennisCourt />

        <TennisBall />

        {/* 4 characters — Wii Sports doubles */}
        {characterList.map((char) => (
          <TennisPlayer
            key={char.id}
            charId={char.id}
            side={char.side}
            color={CHAR_COLORS[char.id] || (char.side === "near" ? "#3b82f6" : "#ef4444")}
            initialX={char.x}
            initialZ={char.z}
            isSwinging={swingAnimations[char.id]?.active ?? false}
            swingType={(swingAnimations[char.id]?.type as SwingType) ?? null}
          />
        ))}
      </Canvas>
    </div>
  );
}
