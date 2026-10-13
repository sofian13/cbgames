import { useCallback, useEffect, useState } from "react";
import { getZGame } from "./catalog";
import { usePremium } from "./premium";
import "./ui/zinzin.css";
import { useToast } from "./ui/common";
import { GameSheet } from "./ui/GameSheet";
import { Home, isLocked } from "./ui/Home";
import { Paywall } from "./ui/Paywall";
import { AgeGate, GameScreen, LegalScreen, SettingsSheet, type LegalPage } from "./ui/Screens";
import { Splash } from "./ui/Splash";
import { installLookAtFinger } from "./ui/ZBlob";
import { isAgeOk } from "./ui/util";

type Phase = "splash" | "age" | "app";

/**
 * Navigation de l'app (état React, pas d'URL) :
 * lancement animé → âge (1re fois) → paywall (si pas premium) → accueil.
 */
export function App() {
  const premium = usePremium();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("splash");
  const [paywall, setPaywall] = useState<{ thenOpen?: string } | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [legal, setLegal] = useState<LegalPage | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  // Les yeux des blobs suivent le doigt
  useEffect(() => installLookAtFinger(), []);
  // Un jeu demande l'abonnement (contenu verrouillé) → paywall par-dessus le jeu
  useEffect(() => {
    const open = () => setPaywall({});
    window.addEventListener("zz:paywall", open);
    return () => window.removeEventListener("zz:paywall", open);
  }, []);

  const afterIntro = useCallback(() => {
    // Paywall de lancement : uniquement pour les non-premium
    if (!premium) setPaywall({});
  }, [premium]);

  const openGame = (id: string) => setSheet(id);

  return (
    <>
      {phase !== "splash" && phase !== "age" && (
        <div style={{ display: playing ? "none" : undefined }}>
          <Home
            premium={premium}
            onOpenGame={openGame}
            onSettings={() => setSettings(true)}
            onUnlock={() => setPaywall({})}
          />
        </div>
      )}

      {sheet && (
        <GameSheet
          key={sheet}
          id={sheet}
          premium={premium}
          locked={isLocked(getZGame(sheet)!, premium)}
          onClose={() => setSheet(null)}
          onPlay={(id) => { setSheet(null); setPlaying(id); }}
          onUnlock={() => { const id = sheet; setSheet(null); setPaywall({ thenOpen: id }); }}
        />
      )}

      {settings && (
        <SettingsSheet
          premium={premium}
          onClose={() => setSettings(false)}
          onUnlock={() => setPaywall({})}
          onLegal={setLegal}
          toast={toast.show}
        />
      )}

      {playing && <GameScreen key={playing} id={playing} onExit={() => setPlaying(null)} />}

      {paywall && (
        <Paywall
          onClose={() => setPaywall(null)}
          onUnlocked={() => { const next = paywall.thenOpen; setPaywall(null); if (next) setTimeout(() => setSheet(next), 80); }}
          onLegal={setLegal}
          toast={toast.show}
        />
      )}

      {phase === "age" && <AgeGate onOk={() => { setPhase("app"); afterIntro(); }} />}

      {phase === "splash" && (
        <Splash
          onDone={() => {
            if (!isAgeOk()) setPhase("age");
            else { setPhase("app"); afterIntro(); }
          }}
        />
      )}

      {legal && <LegalScreen page={legal} onClose={() => setLegal(null)} />}

      {toast.node}
    </>
  );
}
