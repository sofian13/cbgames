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
  forehand: "#22c55e",
  backhand: "#3b82f6",
  smash: "#ef4444",
  slice: "#a855f7",
  lob: "#f59e0b",
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
      // Register as controller for existing player (not a new player)
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

        // Serve window notification
        if (payload.event === "serve-window-open") {
          setIsServing(true);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
        if (payload.event === "ball-served") {
          setIsServing(false);
        }

        // Point scored
        if (payload.event === "point-scored") {
          setIsServing(false);
          if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
        }
      }
    });

    socket.addEventListener("close", () => {
      setPhase("disconnected");
    });
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

  useEffect(() => {
    startMotionListeningRef.current = startMotionListening;
  });

  useEffect(() => {
    return () => {
      if (motionListenerRef.current) {
        window.removeEventListener("devicemotion", motionListenerRef.current);
      }
      socketRef.current?.close();
    };
  }, []);

  // Dynamic background based on state
  let bgColor = "#060606";
  if (isServing) bgColor = "#92400e";
  else if (lastSwing && phase === "playing") bgColor = SWING_COLORS[lastSwing.type];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-white select-none"
      style={{
        background: bgColor,
        transition: "background-color 0.15s",
        touchAction: "none",
      }}
    >
      {phase === "permission" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-6xl">🎾</div>
          <h1 className="text-2xl font-bold">Motion Tennis</h1>
          <p className="text-white/60 text-sm">Ton téléphone = ta raquette !</p>
          <p className="text-xs text-white/40">Room : {code}</p>

          <input
            type="text"
            placeholder="Ton nom"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-64 rounded-xl bg-white/10 px-4 py-3 text-center text-lg border border-white/20 placeholder-white/30 outline-none focus:border-white/40"
          />

          <button
            onClick={requestPermission}
            className="rounded-xl bg-green-500 px-8 py-4 text-lg font-bold shadow-lg active:scale-95 transition-transform"
          >
            🎯 Activer le gyroscope
          </button>

          <p className="text-[10px] text-white/30 max-w-xs">
            Autorisation nécessaire sur iPhone. Tiens ton téléphone comme une raquette !
          </p>
        </div>
      )}

      {phase === "connecting" && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p>Connexion à la room {code}...</p>
        </div>
      )}

      {phase === "calibrating" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-5xl">📐</div>
          <h2 className="text-xl font-bold">Calibration</h2>
          <p className="text-white/60">
            Fais <strong>{3 - calibrationSwings}</strong> swing{3 - calibrationSwings > 1 ? "s" : ""} de test !
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full transition-colors"
                style={{
                  backgroundColor: i < calibrationSwings ? "#22c55e" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
          <p className="text-xs text-white/40">
            Tiens ton téléphone comme une raquette et frappe l&apos;air
          </p>
        </div>
      )}

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold">Prêt !</h2>
          <p className="text-white/60">En attente du début de la partie...</p>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Serve prompt */}
          {isServing && (
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <div className="text-7xl">🎾</div>
              <h2 className="text-3xl font-black">SERVICE !</h2>
              <p className="text-white/70">Swing pour servir</p>
            </div>
          )}

          {/* Last swing info */}
          {!isServing && lastSwing && (
            <>
              <div className="text-5xl">
                {SWING_ICONS[lastSwing.type]}
              </div>
              <h2 className="text-2xl font-bold">{SWING_LABELS[lastSwing.type]}</h2>
              <div className="w-48 h-3 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${lastSwing.power * 100}%` }}
                />
              </div>
              <p className="text-xs text-white/60">
                Puissance : {Math.round(lastSwing.power * 100)}%
              </p>
            </>
          )}

          {!isServing && !lastSwing && (
            <>
              <div className="text-5xl">🎾</div>
              <h2 className="text-xl font-bold">Swing ta raquette !</h2>
            </>
          )}

          <p className="text-xs text-white/30 mt-4">{swingCount} coups joués</p>
        </div>
      )}

      {phase === "disconnected" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">❌</div>
          <h2 className="text-xl font-bold">Déconnecté</h2>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-white/10 px-6 py-3 text-sm active:scale-95"
          >
            Reconnecter
          </button>
        </div>
      )}
    </div>
  );
}
