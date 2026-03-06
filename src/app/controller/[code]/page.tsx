"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PartySocket from "partysocket";
import {
  Activity,
  CheckCircle2,
  LoaderCircle,
  RefreshCcw,
  Smartphone,
  Target,
  Trophy,
  WifiOff,
} from "lucide-react";
import { SwingDetector, type SwingType } from "@/components/games/motion-tennis/swing-detector";
import { getPartyKitHost, getPartyKitWsProtocol } from "@/lib/party/host";

type Phase = "permission" | "connecting" | "calibrating" | "ready" | "playing" | "disconnected";

const SWING_LABELS: Record<SwingType, string> = {
  forehand: "Coup droit",
  backhand: "Revers",
  smash: "Smash",
  slice: "Slice",
  lob: "Lob",
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
  const motionListenerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const sendThrottleRef = useRef(0);
  const startMotionListeningRef = useRef<() => void>(() => {});

  const connectToRoom = useCallback(
    (name: string) => {
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
        socket.send(
          JSON.stringify({
            type: "game-action",
            payload: { action: "controller-join", playerName: name },
          })
        );
        setPhase("calibrating");
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "game-state" || message.type === "game-update") {
          const payload = message.payload;
          if (payload.status === "serving" || payload.status === "playing") {
            setPhase("playing");
          }

          if (payload.event === "serve-window-open") {
            setIsServing(true);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }

          if (payload.event === "ball-served") {
            setIsServing(false);
          }

          if (payload.event === "point-scored") {
            setIsServing(false);
            if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
          }
        }
      });

      socket.addEventListener("close", () => {
        setPhase("disconnected");
      });
    },
    [code]
  );

  const requestPermission = useCallback(async () => {
    const motionEvent = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (motionEvent.requestPermission) {
      try {
        const result = await motionEvent.requestPermission();
        if (result !== "granted") {
          alert("L'acces au gyroscope est necessaire pour jouer.");
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

    const handler = (event: DeviceMotionEvent) => {
      if (!detector.calibrated) {
        detector.calibrate(event);
        return;
      }

      const swing = detector.addSample(event);
      if (!swing) return;

      if (navigator.vibrate) navigator.vibrate(swing.type === "smash" ? 100 : 50);

      setLastSwing(swing);
      setSwingCount((count) => count + 1);

      if (calibrationSwings < 3) {
        setCalibrationSwings((count) => {
          const next = count + 1;
          if (next >= 3) setPhase("ready");
          return next;
        });
      }

      const now = Date.now();
      if (now - sendThrottleRef.current > 33) {
        sendThrottleRef.current = now;
        socketRef.current?.send(
          JSON.stringify({
            type: "game-action",
            payload: {
              action: "swing",
              swingType: swing.type,
              power: swing.power,
              swingTimestamp: Date.now(),
            },
          })
        );
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

  let backgroundColor = "#05070f";
  if (isServing) backgroundColor = "#7c3b13";
  else if (lastSwing && phase === "playing") backgroundColor = SWING_COLORS[lastSwing.type];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-5 text-white"
      style={{
        background: `radial-gradient(circle_at_50%_18%, rgba(255,255,255,0.08), transparent 32%), linear-gradient(180deg, ${backgroundColor}, #05070f)`,
        transition: "background-color 0.18s ease",
        touchAction: "none",
      }}
    >
      <div className="premium-panel mesh-surface w-full max-w-md rounded-[2rem] p-5 text-center sm:p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
            <Smartphone className="h-5 w-5 text-[#72e4f7]" />
          </div>
          <div className="text-left">
            <p className="section-title">Motion tennis</p>
            <h1 className="mt-1 text-2xl font-black text-white">Controleur mobile</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-white/56">Room: {code}</p>

        {phase === "permission" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-left">
              <p className="text-sm font-semibold text-white/88">Ton telephone devient la raquette.</p>
              <p className="mt-2 text-sm leading-6 text-white/48">
                Autorise le gyroscope, saisis ton nom et swing comme avec une vraie manette.
              </p>
            </div>

            <input
              type="text"
              placeholder="Ton nom"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className="sunrise-input h-14 w-full rounded-2xl px-4 text-center text-base font-semibold text-white outline-none placeholder:text-white/24"
            />

            <button
              onClick={requestPermission}
              className="press-effect flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#ffb98c]/35 bg-gradient-to-r from-[#ff8a3d] via-[#ff7a48] to-[#ff5d67] text-sm font-black uppercase tracking-[0.16em] text-[#190b04] shadow-[0_18px_34px_rgba(255,118,63,0.28)]"
            >
              <Target className="h-4 w-4" />
              Activer le gyroscope
            </button>
          </div>
        )}

        {phase === "connecting" && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <LoaderCircle className="h-10 w-10 animate-spin text-[#72e4f7]" />
            <p className="text-sm text-white/62">Connexion a la room en cours...</p>
          </div>
        )}

        {phase === "calibrating" && (
          <div className="mt-6 space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <Activity className="h-8 w-8 text-[#ffb17f]" />
            </div>
            <div>
              <p className="text-xl font-black text-white">Calibration</p>
              <p className="mt-2 text-sm text-white/52">
                Fais encore {Math.max(0, 3 - calibrationSwings)} swing(s) de test.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-3.5 w-10 rounded-full"
                  style={{ background: index < calibrationSwings ? "#72e4f7" : "rgba(255,255,255,0.12)" }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-[#8ff2bb]" />
            <p className="text-xl font-black text-white">Pret</p>
            <p className="text-sm text-white/52">Attends le debut de l&apos;echange sur l&apos;ecran principal.</p>
          </div>
        )}

        {phase === "playing" && (
          <div className="mt-6 space-y-4">
            {isServing ? (
              <div className="rounded-[1.6rem] border border-[#ffb98c]/28 bg-[#ff8a3d]/14 p-5 animate-pulse">
                <p className="section-title">Service</p>
                <p className="mt-2 text-3xl font-black text-white">Swing maintenant</p>
                <p className="mt-2 text-sm text-white/56">Ton prochain geste sert la balle.</p>
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="section-title">Dernier geste</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {lastSwing ? SWING_LABELS[lastSwing.type] : "En attente"}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-200"
                    style={{ width: `${Math.round((lastSwing?.power ?? 0) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/42">
                  Puissance {Math.round((lastSwing?.power ?? 0) * 100)}%
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Coups</p>
                <p className="mt-2 text-2xl font-black text-white">{swingCount}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Etat</p>
                <p className="mt-2 text-sm font-semibold text-white/84">{isServing ? "Serve" : "Echange"}</p>
              </div>
            </div>
          </div>
        )}

        {phase === "disconnected" && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <WifiOff className="h-12 w-12 text-red-300" />
            <div>
              <p className="text-xl font-black text-white">Deconnecte</p>
              <p className="mt-2 text-sm text-white/52">La connexion au controleur est tombee.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="press-effect flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold text-white/80"
            >
              <RefreshCcw className="h-4 w-4" />
              Reconnecter
            </button>
          </div>
        )}

        <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-3 text-left text-sm text-white/48">
          <div className="flex items-center gap-2 text-white/78">
            <Trophy className="h-4 w-4 text-[#ffb17f]" />
            Tips
          </div>
          <p className="mt-2 leading-6">
            Tiens le telephone fermement et garde une bonne amplitude pour que les swings soient detectes proprement.
          </p>
        </div>
      </div>
    </div>
  );
}
