/**
 * Saisons spéciales de l'app (date du téléphone, 100 % hors ligne).
 * Halloween : du 24 octobre au 1er novembre inclus, ou toute l'année avec l'icône Halloween
 * (Réglages, Zinzin+ : pratique pour tester, effet au prochain lancement).
 * Pour forcer un build : VITE_SEASON=halloween.
 * Posée sur <html data-zz-season> dès le chargement : l'accueil passe en couleurs d'Halloween (zinzin.css).
 */
import { APP_ICON_KEY } from "./app-icon";

export type Season = "halloween" | null;

export function currentSeason(d: Date = new Date()): Season {
  const forced = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SEASON;
  if (forced === "halloween") return "halloween";
  try { if (localStorage.getItem(APP_ICON_KEY) === "halloween") return "halloween"; } catch { /* indispo */ }
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 10 && day >= 24) || (m === 11 && day === 1)) return "halloween";
  return null;
}

/** Saison de cette ouverture de l'app (fixée au lancement : pas de bascule en pleine partie). */
export const SEASON: Season = currentSeason();

if (typeof document !== "undefined" && SEASON) document.documentElement.setAttribute("data-zz-season", SEASON);
