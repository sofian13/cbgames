"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import PartySocket from "partysocket";
import { SwingDetector, type SwingType } from "@/components/games/motion-tennis/swing-detector";
import { getPartyKitHost, getPartyKitWsProtocol } from "@/lib/party/host";

type Phase = "permission" | "connecting" | "calibrating" | "ready" | "playing" | "disconnected";

const SWING_LABELS: Record<SwingType, string> = {
  forehand: "Coup droit",
  backhand: "Revers",
  smash: "SMASH",
  slice: "Slice",
  lob: "Lob",
};

const SWING_ICONS: Record<SwingType, string> = {
  forehand: "💪",
  backhand: "🎯",
  smash: "💥",
  slice: "🌀",
  lob: "🌈",
};

const SWING_COLORS: Record<SwingType, string> = {
  forehand: "var(--cb-sport)",
  backhand: "var(--cb-words)",
  smash:    "var(--cb-social)",
  slice:    "var(--cb-cards)",
  lob:      "var(--cb-trivia)",
};

export default function ControllerPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [phase, setPhase] = useState<Phase>("permission");
  const [lastSwing, setLastSwing] = useState<{ type: SwingType; power: number } | null>(null);
  const [swingCount, setSwingCount] = useState(0);
  const [calibrationSwings, setCalibrationSwings] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [isServing, setIsServing] = useState(false);
  const [score, setScore] = useState<{ me: number; opp: number } | null>(null);

  const socketRef = useRef<PartySocket | null>(null);
  const detectorRef = useRef(new SwingDetector());
  const motionListenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const sendThrottleRef = useRef(0);
  const startMotionListeningRef = useRef<() => void>(() => {});

  const connectToRoom = useCallback((name: string) => {
    const host = getPartyKitHost();
    const protocol = getPartyKitWsProtocol(host);
    const socket = new PartySocket({
      host,
      room: `${code}-motion-tennis`,
      party: "game",
      protocol,
    });
    socketRef.current = socket;
    setPhase("connecting");

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        type: "game-action",
        payload: { action: "controller-join", playerName: name },
      }));
      setPhase("calibrating");
    });

    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "game-state" || msg.type === "game-update") {
        const payload = msg.payload;
        if (payload.status === "serving" || payload.status === "playing") setPhase("playing");
        if (payload.event === "serve-window-open") {
          setIsServing(true);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
        if (payload.event === "ball-served") setIsServing(false);
        if (payload.event === "point-scored") {
          setIsServing(false);
          if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
        }
        if (payload.scores) setScore(payload.scores);
      }
    });

    socket.addEventListener("close", () => setPhase("disconnected"));
  }, [code]);

  const requestPermission = useCallback(async () => {
    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (DME.requestPermission) {
      try {
        const result = await DME.requestPermission();
        if (result !== "granted") {
          alert("L'accès au gyroscope est nécessaire pour jouer !");
          return;
        }
      } catch {
        alert("Erreur lors de la demande de permission gyroscope.");
        return;
      }
    }
    const name = playerName.trim() || "Joueur";
    connectToRoom(name);
    startMotionListeningRef.current();
  }, [playerName, connectToRoom]);

  function startMotionListening() {
    const detector = detectorRef.current;
    const handler = (e: DeviceMotionEvent) => {
      if (!detector.calibrated) {
        detector.calibrate(e);
        return;
      }
      const swing = detector.addSample(e);
      if (swing) {
        if (navigator.vibrate) navigator.vibrate(swing.type === "smash" ? 100 : 50);
        setLastSwing(swing);
        setSwingCount((c) => c + 1);
        if (calibrationSwings < 3) {
          setCalibrationSwings((c) => {
            const next = c + 1;
            if (next >= 3) setPhase("ready");
            return next;
          });
        }
        const now = Date.now();
        if (now - sendThrottleRef.current > 33) {
          sendThrottleRef.current = now;
          socketRef.current?.send(JSON.stringify({
            type: "game-action",
            payload: {
              action: "swing",
              swingType: swing.type,
              power: swing.power,
              swingTimestamp: Date.now(),
            },
          }));
        }
      }
    };
    motionListenerRef.current = handler;
    window.addEventListener("devicemotion", handler);
  }

  useEffect(() => { startMotionListeningRef.current = startMotionListening; });

  useEffect(() => {
    return () => {
      if (motionListenerRef.current) {
        window.removeEventListener("devicemotion", motionListenerRef.current);
      }
      socketRef.current?.close();
    };
  }, []);

  const swingColor = lastSwing ? SWING_COLORS[lastSwing.type] : "var(--cb-sport)";
  const dark = phase === "playing" || phase === "ready";

  return (
    <div
      className="dark flex min-h-screen flex-col select-none px-4 py-4"
      style={{
        background: dark
          ? "linear-gradient(180deg, #0B0B0C 0%, #050507 100%)"
          : "var(--background)",
        color: dark ? "#FAFAF9" : "var(--foreground)",
        touchAction: "none",
      }}
    >
      {/* Top status row */}
      {phase !== "permission" && (
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: phase === "calibrating" ? "rgba(232,154,43,0.15)" :
                           "rgba(47,216,200,0.15)",
              color: phase === "calibrating" ? "var(--cb-trivia)" : "var(--cb-sport)",
              border: "1px solid " +
                (phase === "calibrating" ? "rgba(232,154,43,0.35)" : "rgba(47,216,200,0.35)"),
            }}
          >
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{
                background: phase === "calibrating" ? "var(--cb-trivia)" : "var(--cb-sport)",
              }}
            />
            {phase === "calibrating"
              ? "Calibrage"
              : phase === "ready"
              ? "Prêt · " + code
              : phase === "playing"
              ? "En jeu · " + code
              : phase === "connecting"
              ? "Connexion..."
              : "Déconnecté"}
          </span>
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
            🎾 motion tennis
          </span>
        </div>
      )}

      {/* PERMISSION SCREEN */}
      {phase === "permission" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-7xl mb-2">🎾</div>
          <span className="cb-eyebrow" style={{ color: "var(--text-dim)" }}>
            room · {code}
          </span>
          <h1 className="cb-display-xl mt-2">Motion Tennis</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
            Ton téléphone = ta raquette
          </p>

          <input
            type="text"
            placeholder="Ton nom"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="mt-8 w-64 rounded-xl border px-4 py-3 text-center text-base outline-none"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line-soft)",
              color: "var(--foreground)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          />

          <button
            onClick={requestPermission}
            className="cb-btn cb-btn-brand cb-btn-lg mt-4 w-64"
          >
            Activer le gyroscope
          </button>

          <p className="mt-8 text-[10px] max-w-xs" style={{ color: "var(--text-muted)" }}>
            Autorisation nécessaire sur iPhone. Tiens ton téléphone comme une raquette.
          </p>
        </div>
      )}

      {/* SCORE BANNER (when playing) */}
      {phase === "playing" && score && (
        <div className="mt-4 flex items-center justify-around">
          <div className="text-center">
            <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>toi</div>
            <div className="cb-display-xl mt-0.5" style={{ color: "var(--cb-sport)", fontSize: 48 }}>
              {score.me}
            </div>
          </div>
          <span className="text-2xl font-black" style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
          <div className="text-center">
            <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>bot</div>
            <div className="cb-display-xl mt-0.5" style={{ color: "rgba(255,255,255,0.55)", fontSize: 48 }}>
              {score.opp}
            </div>
          </div>
        </div>
      )}

      {/* MAIN SWING ZONE */}
      {(phase === "calibrating" || phase === "ready" || phase === "playing") && (
        <div
          className="relative mt-4 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border"
          style={{
            background: phase === "calibrating"
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(160deg, rgba(0,179,166,0.18), rgba(43,109,232,0.10))",
            borderColor: phase === "calibrating" ? "rgba(255,255,255,0.1)" : "rgba(0,179,166,0.3)",
          }}
        >
          {phase === "calibrating" && (
            <>
              <div className="text-7xl mb-4" style={{ animation: "cb-shake 1.2s infinite" }}>📱</div>
              <h2 className="cb-display-md text-center">Calibre ta raquette</h2>
              <p className="mt-2 max-w-xs text-center text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                Tiens ton tel comme une raquette puis fais 3 swings de test
              </p>
              <div className="mt-5 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block h-1.5 w-8 rounded-full transition-all"
                    style={{
                      background: i < calibrationSwings ? "var(--cb-sport)" : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
              <style>{`@keyframes cb-shake { 0%,100% { transform: translate(0,0) rotate(0); } 25% { transform: translate(-2px, 1px) rotate(-2deg); } 75% { transform: translate(2px, -1px) rotate(2deg); } }`}</style>
            </>
          )}

          {phase === "ready" && (
            <>
              <div className="text-6xl mb-3">✅</div>
              <h2 className="cb-display-md text-center">Prêt</h2>
              <p className="mt-2 text-xs text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
                En attente du début de la partie...
              </p>
            </>
          )}

          {phase === "playing" && (
            <>
              {/* Mini-map court */}
              <div
                className="absolute top-4 left-4 right-4 h-24 rounded-xl border p-2"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="relative flex-1 h-full rounded"
                  style={{
                    background: "repeating-linear-gradient(90deg, transparent 0 18px, rgba(255,255,255,0.06) 18px 19px)",
                  }}
                >
                  <div
                    className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
                    style={{ width: 2, background: "rgba(255,255,255,0.3)" }}
                  />
                  <div
                    className="absolute left-[15%] top-1/3 h-3 w-3 rounded-full"
                    style={{
                      background: "var(--cb-sport)",
                      boxShadow: "0 0 0 4px rgba(47,216,200,0.25)",
                    }}
                  />
                  <div
                    className="absolute right-[15%] bottom-1/3 h-3 w-3 rounded-full"
                    style={{ background: "rgba(255,255,255,0.5)" }}
                  />
                  {/* Ball */}
                  <div
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      left: "44%", top: "55%",
                      background: "var(--cb-trivia)",
                      boxShadow: "0 0 10px rgba(255,179,71,0.7)",
                    }}
                  />
                </div>
              </div>

              {/* Serve prompt */}
              {isServing ? (
                <div className="flex flex-col items-center cb-live-pulse">
                  <div className="text-7xl">🎾</div>
                  <h2 className="cb-display-lg mt-3" style={{ color: "var(--cb-trivia)" }}>SERVICE !</h2>
                  <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Swing pour servir
                  </p>
                </div>
              ) : lastSwing ? (
                <div className="flex flex-col items-center">
                  <div
                    className="text-6xl"
                    style={{ filter: "drop-shadow(0 8px 18px rgba(0,179,166,0.4))" }}
                  >
                    {SWING_ICONS[lastSwing.type]}
                  </div>
                  <h2 className="cb-display-md mt-2">{SWING_LABELS[lastSwing.type]}</h2>
                  <div
                    className="mt-3 h-2 w-48 overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${lastSwing.power * 100}%`,
                        background: swingColor,
                      }}
                    />
                  </div>
                  <p className="mt-1 cb-mono text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {Math.round(lastSwing.power * 100)}% puissance
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-6xl mb-2">🎾</div>
                  <h2 className="cb-display-md text-center">Swing maintenant</h2>
                  <p className="mt-1 max-w-xs text-center text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Le timing décide de la direction
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Stats / last swing summary */}
      {phase === "playing" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "Dernier swing", value: lastSwing ? SWING_LABELS[lastSwing.type] : "—",   color: swingColor },
            { label: "Puissance",     value: lastSwing ? `${Math.round(lastSwing.power*100)}%` : "—", color: "var(--cb-trivia)" },
            { label: "Coups joués",   value: String(swingCount),                                color: "#fff" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl border px-2 py-2 text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div className="cb-eyebrow" style={{ fontSize: 8, color: "rgba(255,255,255,0.5)" }}>
                {s.label}
              </div>
              <div className="cb-display-sm mt-0.5" style={{ fontSize: 13, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === "connecting" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{
              borderColor: "rgba(255,255,255,0.15)",
              borderTopColor: "var(--cb-sport)",
            }}
          />
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>Connexion à {code}...</p>
        </div>
      )}

      {phase === "disconnected" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="cb-display-md">Déconnecté</h2>
          <button
            onClick={() => window.location.reload()}
            className="cb-btn cb-btn-brand"
          >
            Reconnecter
          </button>
        </div>
      )}
    </div>
  );
}
