import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { MascotMood } from "@/components/Mascot";
import type { AvatarLook } from "@/lib/avatar/look";
import { AvatarSvg } from "./AvatarBlob";

let n = 0;

/**
 * SVG autonome d'un perso (images de partage) : rendu hors écran, figé,
 * repère agrandi (-30 -30 180 180) pour les chapeaux et coupes qui dépassent.
 */
export function avatarSvgMarkup(look: AvatarLook, mood: MascotMood = "happy", px = 600): string | null {
  if (typeof document === "undefined") return null;
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(<AvatarSvg look={look} size={px} mood={mood} uid={`sh${++n}`} viewBox="-30 -30 180 180" />);
    });
    const svg = host.querySelector("svg");
    if (!svg) return null;
    svg.removeAttribute("style");
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return null;
  } finally {
    root.unmount();
  }
}
