"use client";

/**
 * InstallApp — Bannière "Installer l'app" (PWA).
 * - Android/Chrome : capte `beforeinstallprompt` et déclenche le vrai prompt natif.
 * - iOS Safari : pas d'install programmatique possible → ouvre une notice
 *   illustrée (Partager → Sur l'écran d'accueil).
 * - Se cache si l'app tourne déjà en standalone (déjà installée) ou si l'utilisateur
 *   a fermé la bannière (mémorisé en localStorage).
 */

import { useEffect, useState } from "react";
import { X, Share, Plus } from "lucide-react";
import { MascotAvatar } from "@/components/Mascot";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "af-install-dismissed";

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // déjà installée

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (dismissed) return;

    const ua = window.navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    if (ios) {
      setIsIOS(true);
      setVisible(true); // iOS : on affiche tout de suite (install manuelle)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
    } else if (isIOS) {
      setShowGuide(true);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Bannière */}
      <div className="fixed inset-x-0 bottom-0 z-[150] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:inset-x-auto md:right-4 md:w-[22rem]">
        <div
          className="flex items-center gap-3 rounded-2xl border p-3"
          style={{
            background: "rgba(20,12,50,0.97)",
            borderColor: "var(--line-soft)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <MascotAvatar color="purple" size={44} mood="happy" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Installe af.games</p>
            <p className="truncate text-xs" style={{ color: "var(--text-dim)" }}>
              {isIOS ? "Ajoute-la à ton écran d'accueil" : "Plein écran, accès direct, hors navigateur"}
            </p>
          </div>
          <button
            onClick={install}
            className="af-btn af-btn-primary shrink-0"
            style={{ padding: "10px 16px", fontSize: 13 }}
          >
            {isIOS ? "Comment ?" : "Installer"}
          </button>
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)", color: "var(--text-dim)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notice iOS */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border p-6"
            style={{ background: "var(--surface)", borderColor: "rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="cb-display-md">Installer l&apos;app</h3>
              <button
                onClick={() => setShowGuide(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "var(--text-dim)" }}
              >
                ✕
              </button>
            </div>
            <p className="mb-5 text-sm" style={{ color: "var(--text-dim)" }}>
              Sur iPhone, depuis <b style={{ color: "#fff" }}>Safari</b>, en 2 étapes :
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: "var(--line-soft)", background: "rgba(255,255,255,0.03)" }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: "var(--cb-brand)" }}>1</span>
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-white">
                  Appuie sur
                  <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--line-soft)", color: "var(--af-sky, #7CC8FF)" }}>
                    <Share className="h-3.5 w-3.5" /> Partager
                  </span>
                  (barre du bas)
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: "var(--line-soft)", background: "rgba(255,255,255,0.03)" }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: "var(--af-pink)" }}>2</span>
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-white">
                  Choisis
                  <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--line-soft)", color: "var(--af-yellow)" }}>
                    <Plus className="h-3.5 w-3.5" /> Sur l&apos;écran d&apos;accueil
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs" style={{ color: "var(--text-muted)" }}>
              L&apos;icône 🫐 af.games apparaîtra sur ton écran, comme une vraie app.
            </p>
            <button onClick={dismiss} className="af-btn af-btn-ghost mt-4 w-full" style={{ fontSize: 13 }}>
              Ne plus afficher
            </button>
          </div>
        </div>
      )}
    </>
  );
}
