// Les jeux lisent ce flag au rendu (pas à l'import) : il suffit qu'il soit posé avant render().
(globalThis as { __ZINZIN_OFFLINE__?: boolean }).__ZINZIN_OFFLINE__ = true;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { App } from "./App";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { initPremium } from "./premium";
import { initRating } from "./rating";
import { initBandStats, setBandStatsGameNames } from "@/lib/band-stats";
import { GAME_TEXT } from "./catalog-text";
import { installFrenchTypo } from "./ui/typo";
import "./share-art"; // blobs déguisés des images « Partager mon résultat »
import "./band-stats-art"; // blobs déguisés des jeux dans « Les stats de la bande »
import { getLang } from "@/lib/i18n";
import { lockOrientation } from "@/lib/orientation";

// navigator.vibrate n'existe pas dans la webview iOS : on le branche sur Haptics
// pour que toutes les vibrations des jeux marchent sur iPhone.
const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
if (cap?.isNativePlatform?.()) {
  const hapticsP = import("@capacitor/haptics");
  (navigator as { vibrate: (p: VibratePattern) => boolean }).vibrate = (pattern: VibratePattern) => {
    const ms = Array.isArray(pattern) ? pattern.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) : pattern;
    if (!ms) return true;
    hapticsP.then(({ Haptics, ImpactStyle }) =>
      ms >= 200 ? Haptics.vibrate({ duration: Math.min(ms, 1000) }) : Haptics.impact({ style: ms >= 60 ? ImpactStyle.Heavy : ImpactStyle.Medium }),
    ).catch(() => {});
    return true;
  };
}

initPremium();
// Toute l'app en portrait (seul « Deviner le Mot » passe en paysage pendant la manche)
void lockOrientation("portrait");
// Demande de note automatique après les fins de partie (rare, natif uniquement)
initRating();
// Stats de « Ma bande » (parties, jeu préféré, qui perd le plus) : 100 % local
initBandStats();
setBandStatsGameNames((id, lang) => (GAME_TEXT as Record<string, Record<string, { name: string }>>)[id]?.[lang]?.name);
// Langue du document (lecteurs d'écran, césure) : mise à jour ensuite par setLang()
document.documentElement.lang = getLang();
// Espaces insécables devant « ? ! : ; » partout en français (aucun « ? » orphelin en début de ligne)
installFrenchTypo();

// Planche de contrôle des persos (développement uniquement, absente du build)
if (import.meta.env.DEV && location.hash.startsWith("#avatar-lab")) {
  void import("./avatar-lab").then((m) => m.mountAvatarLab());
} else createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary onBack={() => location.reload()}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
