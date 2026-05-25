// Registre minimal pour un « relancer » en place (sans remonter le composant).
// Un jeu (ex. Undercover local) enregistre sa fonction de relance ; le shell
// l'appelle pour le bouton « Relancer la partie » au lieu de tout réinitialiser.
let _softReplay: (() => void) | null = null;

export function registerSoftReplay(fn: (() => void) | null) {
  _softReplay = fn;
}

// Retourne true si un relancer « doux » a été déclenché.
export function softReplay(): boolean {
  if (_softReplay) {
    _softReplay();
    return true;
  }
  return false;
}
