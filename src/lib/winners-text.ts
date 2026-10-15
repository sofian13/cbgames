import type { I18n } from "@/lib/i18n";

/**
 * Textes communs des écrans de fin quand la règle unique des gagnants (src/lib/game-finished.ts)
 * donne plusieurs gagnants ex æquo, ou aucun (toute la table à égalité).
 */
export const WIN_STR: I18n<{
  /** « Léa », « Léa et Tom », « Léa, Tom et Inès » */
  names: (n: string[]) => string;
  /** « Léa gagne ! » / « Léa et Tom gagnent ! » */
  win: (n: string[]) => string;
  /** Toute la table ex æquo */
  allTied: string;
  allTiedSub: string;
  /** « Terminer » avant que chacun ait joué */
  incomplete: string;
}> = {
  fr: {
    names: (n) => (n.length > 1 ? `${n.slice(0, -1).join(", ")} et ${n[n.length - 1]}` : n[0] ?? ""),
    win: (n) => `${n.length > 1 ? `${n.slice(0, -1).join(", ")} et ${n[n.length - 1]}` : n[0] ?? ""} gagne${n.length > 1 ? "nt" : ""} !`,
    allTied: "Égalité parfaite !",
    allTiedSub: "Toute la table à égalité : pas de gagnant",
    incomplete: "Partie arrêtée avant que tout le monde ait joué : pas de gagnant",
  },
  en: {
    names: (n) => (n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n[0] ?? ""),
    win: (n) => `${n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n[0] ?? ""} win${n.length > 1 ? "" : "s"}!`,
    allTied: "Perfect tie!",
    allTiedSub: "The whole table is tied: no winner",
    incomplete: "Game stopped before everyone played: no winner",
  },
  es: {
    names: (n) => (n.length > 1 ? `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}` : n[0] ?? ""),
    win: (n) => `¡${n.length > 1 ? `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}` : n[0] ?? ""} gana${n.length > 1 ? "n" : ""}!`,
    allTied: "¡Empate total!",
    allTiedSub: "Toda la mesa empatada: no hay ganador",
    incomplete: "Partida detenida antes de que todos jugaran: no hay ganador",
  },
};
