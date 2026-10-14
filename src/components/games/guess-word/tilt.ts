import { useEffect, useRef, useState } from "react";
import { newTiltInput, startSensors } from "@/components/games/verre/sensors";

/**
 * Geste « tél sur le front » de Deviner le Mot :
 * - pencher EN AVANT (écran vers le sol)      → « found »
 * - pencher EN ARRIÈRE (écran vers le plafond) → « pass »
 *
 * On ne regarde que l'élévation de l'écran : angle entre la normale de l'écran et
 * l'horizontale, calculé depuis beta/gamma (DeviceOrientation, convention W3C).
 * Vecteur « haut » dans le repère du tél : (−sin γ·cos β, sin β, cos γ·cos β)
 * → élévation = asin(cos β · cos γ). Indépendant du sens du paysage (gauche/droite)
 * et des sauts d'angles d'Euler près de γ = ±90°.
 */
export function screenElevation(beta: number, gamma: number): number {
  const r = Math.PI / 180;
  const z = Math.cos(beta * r) * Math.cos(gamma * r);
  return Math.asin(Math.max(-1, Math.min(1, z))) / r;
}

export type TiltGesture = "found" | "pass";

/** Réglages du détecteur (exportés pour les tests). */
export const TILT = {
  /** durée de calibrage de la position neutre (tél posé sur le front) */
  calibMs: 800,
  /** angle franc pour déclencher un geste */
  trigger: 38,
  /** retour à la position neutre avant le geste suivant (hystérésis) */
  rearm: 15,
  /** anti-rebond entre deux gestes */
  debounceMs: 600,
};

interface Sample { t: number; e: number }

/** Détecteur pur (sans DOM) : on lui donne des élévations horodatées. */
export class TiltDetector {
  private samples: Sample[] = [];
  ref: number | null = null;
  private armed = true;
  private lastFire = -Infinity;

  /** Garde seulement la dernière fenêtre de calibrage. */
  push(e: number, t: number): TiltGesture | null {
    this.samples.push({ t, e });
    while (this.samples.length && t - this.samples[0].t > TILT.calibMs) this.samples.shift();
    if (this.ref === null) return null;
    const d = e - this.ref;
    if (!this.armed) {
      if (Math.abs(d) <= TILT.rearm) this.armed = true;
      return null;
    }
    if (t - this.lastFire < TILT.debounceMs) return null;
    if (d <= -TILT.trigger || d >= TILT.trigger) {
      this.armed = false;
      this.lastFire = t;
      return d < 0 ? "found" : "pass";
    }
    return null;
  }

  /**
   * Fixe la référence sur la moyenne des échantillons récents s'ils couvrent
   * presque toute la fenêtre de calibrage. Renvoie vrai si c'est fait.
   */
  tryCalibrate(now: number): boolean {
    if (this.ref !== null) return true;
    const s = this.samples.filter((x) => now - x.t <= TILT.calibMs);
    if (s.length < 4 || now - s[0].t < TILT.calibMs * 0.75) return false;
    this.ref = s.reduce((a, x) => a + x.e, 0) / s.length;
    this.armed = true;
    return true;
  }

  /** Nouvelle manche : on oublie la référence (le joueur suivant tient le tél autrement). */
  reset() {
    this.ref = null;
    this.armed = true;
    this.lastFire = -Infinity;
  }
}

/**
 * Branche les capteurs pendant la manche.
 * - `listen` : capteurs actifs (compte à rebours + manche) — l'échantillonnage du
 *   compte à rebours sert au calibrage dès le « GO » ;
 * - `active` : gestes pris en compte (manche en cours) ;
 * Renvoie `live` : vrai dès qu'un vrai événement capteur arrive.
 */
export function useTiltGestures(listen: boolean, active: boolean, onGesture: (g: TiltGesture) => void) {
  const [live, setLive] = useState(false);
  const cb = useRef(onGesture);
  useEffect(() => { cb.current = onGesture; });
  const det = useRef<TiltDetector | null>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
    // Chaque manche repart d'une référence neuve
    if (!active) det.current?.reset();
  }, [active]);

  useEffect(() => {
    if (!listen) return;
    const input = newTiltInput();
    const stop = startSensors(input);
    const d = (det.current ??= new TiltDetector());
    let lastSeen = 0;
    const id = setInterval(() => {
      if (!input.live || input.last === lastSeen) return;
      lastSeen = input.last;
      setLive(true);
      const now = performance.now();
      const g = d.push(screenElevation(input.beta, input.gamma), now);
      if (!activeRef.current) return;
      // Référence = position moyenne des ~0,8 s précédentes (tél posé sur le front)
      if (d.ref === null) { d.tryCalibrate(now); return; }
      if (g) cb.current(g);
    }, 30);
    return () => { clearInterval(id); stop(); };
  }, [listen]);

  return { live };
}
