// Effets Pile Poil : vrais bruitages (src/lib/sfx.ts, coupure du son globale) + vibrations :
// tic-tac d'horloge, vrai roulement de tambour, « ta-da » + applaudissements sur PILE POIL.
// Tout est « best effort » : si l'API n'existe pas (iOS ne vibre pas en webview), on ignore.
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";

/** Précharge les sons du jeu (au montage). */
export function fxPreload() {
  preloadSfx(["tick", "tock", "tap", "select", "error", "buzzer", "crowd-aww", "correct", "tada", "applause", "crowd-cheer", "drumroll", "drumroll-end", "whoosh", "gong"]);
}

/** Gardé pour compat : sfx.ts réveille déjà l'audio au premier toucher. */
export function fxUnlock() {
  fxPreload();
}

/** Tic du compteur qui défile — la hauteur monte avec les secondes. */
export function fxTick(step: number) {
  playSfx(step % 2 ? "tick" : "tock", { volume: 0.55, rate: 0.9 + Math.min(step, 30) * 0.025 });
}

/** GO / STOP : clic franc. */
export function fxTap(high = true) {
  playSfx(high ? "select" : "tap", { volume: 0.8, rate: high ? 1.1 : 0.9 });
}

/** La cible vient d'être dépassée pendant le défilement. */
export function fxOver() {
  playSfx("error", { volume: 0.5 });
}

/** Résultat correct (sans être pile poil). */
export function fxGood() {
  playSfx("success", { volume: 0.75 });
}

/** Loin de la cible. */
export function fxBad() {
  playCombo("fail");
}

/** PILE POIL : « ta-da », applaudissements et la foule qui crie. */
export function fxPerfect() {
  playCombo("fanfare");
  playSfx("crowd-cheer", { volume: 0.55, delay: 0.45 });
}

/** Vrai roulement de tambour (cible mystère, suspense), en crescendo, arrêté net après `seconds`. */
export function fxDrum(seconds = 1.2) {
  playCombo("drumroll", { duration: seconds });
}

/** Grande révélation (cible mystère dévoilée, champion). */
export function fxReveal() {
  playCombo("reveal");
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* pas de vibration dispo */
  }
}
