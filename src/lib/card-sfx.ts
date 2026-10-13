// Bruitages des jeux de cartes : vrais samples (src/lib/sfx.ts) à la place des
// anciens bips synthétisés. Mêmes fonctions exportées qu'avant (utilisées par
// plusieurs jeux du site et de l'app) ; le mute global de sfx.ts s'applique en plus
// de celui géré par l'appelant.
import { playSfx, preloadSfx } from "@/lib/sfx";

/** Précharge les sons de cartes (à appeler au montage d'un jeu de cartes). */
export function preloadCardSfx() {
  preloadSfx(["card-place", "card-slide", "card-shuffle", "card-flip", "pop", "success", "lose", "rise"]);
}

// Carte posée sur le tapis.
export function sfxCardPlay() {
  playSfx("card-place", { volume: 0.8, rate: 0.95 + Math.random() * 0.1 });
}

// Le gagnant ramasse le pli : glissé des cartes.
export function sfxTrickWin() {
  playSfx("card-slide", { volume: 0.75 });
}

// Belote / annonce : petit « pop ».
export function sfxBidPop() {
  playSfx("pop", { volume: 0.7 });
}

// Fin de manche : jingle gagné / perdu.
export function sfxHandChime(win = true) {
  if (win) playSfx("success", { volume: 0.75 });
  else playSfx("lose", { volume: 0.6 });
}

// Accompagne le remplissage d'une barre (récap) : montée.
export function sfxBarFill(dur = 0.7) {
  // le sample « rise » dure ~0,7 s : on accélère/ralentit pour coller à la durée
  playSfx("rise", { volume: 0.5, rate: Math.max(0.6, Math.min(1.6, 0.7 / Math.max(0.2, dur))) });
}
