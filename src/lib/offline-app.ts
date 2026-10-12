/**
 * Vrai dans l'app mobile Zinzin (bundle hors-ligne, un seul téléphone) :
 * les jeux sautent leur écran « En ligne / Sur ce tél » et passent direct en local.
 * Le flag est posé par zinzin/src/main.tsx avant le premier rendu.
 */
export function isOfflineApp(): boolean {
  return (globalThis as { __ZINZIN_OFFLINE__?: boolean }).__ZINZIN_OFFLINE__ === true;
}
