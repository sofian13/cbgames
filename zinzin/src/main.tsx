// Les jeux lisent ce flag au rendu (pas à l'import) : il suffit qu'il soit posé avant render().
(globalThis as { __ZINZIN_OFFLINE__?: boolean }).__ZINZIN_OFFLINE__ = true;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { App } from "./App";
import { initPremium } from "./premium";

// navigator.vibrate n'existe pas dans la webview iOS : on le branche sur Haptics
// pour que toutes les vibrations des jeux marchent sur iPhone.
const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
if (cap?.isNativePlatform?.()) {
  const hapticsP = import("@capacitor/haptics");
  navigator.vibrate = (pattern: VibratePattern) => {
    const ms = Array.isArray(pattern) ? pattern.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) : pattern;
    if (!ms) return true;
    hapticsP.then(({ Haptics, ImpactStyle }) =>
      ms >= 200 ? Haptics.vibrate({ duration: Math.min(ms, 1000) }) : Haptics.impact({ style: ms >= 60 ? ImpactStyle.Heavy : ImpactStyle.Medium }),
    ).catch(() => {});
    return true;
  };
}

initPremium();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
