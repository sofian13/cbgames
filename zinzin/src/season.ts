/**
 * Saisons spéciales de l'app (date du téléphone, 100 % hors ligne).
 * Halloween : du 24 octobre au 1er novembre inclus.
 * Pour tester hors saison : build avec VITE_SEASON=halloween.
 */
export type Season = "halloween" | null;

export function currentSeason(d: Date = new Date()): Season {
  const forced = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SEASON;
  if (forced === "halloween") return "halloween";
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 10 && day >= 24) || (m === 11 && day === 1)) return "halloween";
  return null;
}
