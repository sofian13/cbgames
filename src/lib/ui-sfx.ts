/**
 * Sons d'interface de l'app Zinzin, style « blob » : doux, courts, volume bas.
 * Un seul son par geste (jamais en doublon avec celui d'un jeu), rien sur le défilement.
 * Hauteur légèrement aléatoire (±5 %) pour que les touchers répétés ne lassent pas.
 * Coupure globale : celle de sfx.ts.
 */
import { playSfx, preloadSfx } from "@/lib/sfx";

const vary = () => 0.95 + Math.random() * 0.1;

export const uiSfx = {
  /** Toucher un jeu, une carte du carrousel, un perso : « bloop » de blob */
  blob: () => playSfx("bloop", { volume: 0.45, rate: vary() }),
  /** Petit choix : onglet, option, interrupteur, élément de perso */
  choice: () => playSfx("bloop2", { volume: 0.4, rate: vary() }),
  /** Action principale (Jouer, Suivant…) : le même bloop, plus grave */
  primary: () => playSfx("bloop", { volume: 0.55, rate: 0.8 * vary() }),
  /** Ouverture d'un écran / d'une fiche */
  open: () => playSfx("swoop-up", { volume: 0.45 }),
  /** Fermeture d'un écran / d'une fiche */
  close: () => playSfx("swoop-down", { volume: 0.4 }),
  /** Carrousel balayé au doigt */
  swipe: () => playSfx("whoosh", { volume: 0.22, rate: vary() }),
};

/** À l'accueil : précharge les sons d'interface (pas les gros sons des jeux). */
export function preloadUiSfx() {
  // preloadSfx ajoute les sons des combos (fanfare…) : utiles juste après, au 1er jeu lancé
  preloadSfx(["bloop", "bloop2", "swoop-up", "swoop-down", "whoosh"]);
}
