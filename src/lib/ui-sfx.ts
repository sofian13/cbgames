/**
 * Sons d'interface de l'app Zinzin, style « blob » : doux, courts, volume bas.
 * Un seul son par geste (jamais en doublon avec celui d'un jeu), rien sur le défilement.
 * Hauteur légèrement aléatoire (±5 %) pour que les touchers répétés ne lassent pas.
 * Le toucher reprend le « pop » du logo (vrais pops enregistrés, cf. CREDITS) : pas de sons synthétiques à glissement.
 * Coupure globale : celle de sfx.ts.
 */
import { playSfx, preloadSfx } from "@/lib/sfx";

const vary = () => 0.95 + Math.random() * 0.1;

export const uiSfx = {
  /** Toucher un jeu, une carte du carrousel, un perso : le pop du logo */
  blob: () => playSfx("pop", { volume: 0.4, rate: vary() }),
  /** Petit choix : onglet, option, interrupteur, élément de perso */
  choice: () => playSfx("bloop2", { volume: 0.4, rate: vary() }),
  /** Action principale (Jouer, Suivant…) : pop plus grave */
  primary: () => playSfx("pop2", { volume: 0.4, rate: 0.85 * vary() }),
  /** Ouverture d'un écran / d'une fiche : un simple pop (pas de son en plus de celui du toucher) */
  open: () => playSfx("pop", { volume: 0.4, rate: vary() }),
  /** Fermeture d'un écran / d'une fiche : pop grave, très doux */
  close: () => playSfx("pop2", { volume: 0.25, rate: 0.8 * vary() }),
  /** Carrousel balayé au doigt */
  swipe: () => playSfx("whoosh", { volume: 0.22, rate: vary() }),
};

/** À l'accueil : précharge les sons d'interface (pas les gros sons des jeux). */
export function preloadUiSfx() {
  // preloadSfx ajoute les sons des combos (fanfare…) : utiles juste après, au 1er jeu lancé
  preloadSfx(["pop", "pop2", "bloop2", "whoosh"]);
}
