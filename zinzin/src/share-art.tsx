import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { registerShareArt, SHARE_ART_VIEWBOX } from "@/lib/share-card";
import { getZGame } from "./catalog";
import { ZBlob } from "./ui/ZBlob";

/**
 * Cartes « Partager mon résultat » (src/lib/share-card.ts) : fournit le SVG des
 * blobs de l'app, déguisés avec le costume du jeu. Rendu hors écran, figé
 * (pas d'animation), puis sérialisé pour être dessiné sur le canvas.
 */
registerShareArt(({ game, color, mood, crown, seed = 0 }) => {
  const g = game ? getZGame(game) : undefined;
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(
        <ZBlob
          size={600}
          color={color ?? g?.color ?? "yellow"}
          mood={mood ?? g?.mood ?? "laughing"}
          costume={g?.costume}
          crown={crown}
          seed={seed}
          wobble={false}
          shadow={false}
          outline
          hop={false}
        />,
      );
    });
    const svg = host.querySelector("svg");
    if (!svg) return null;
    // Les costumes dépassent du repère 120×120 : on agrandit la zone visible
    svg.setAttribute("viewBox", SHARE_ART_VIEWBOX);
    svg.setAttribute("width", "600");
    svg.setAttribute("height", "600");
    svg.removeAttribute("style");
    return new XMLSerializer().serializeToString(svg);
  } finally {
    root.unmount();
  }
});
