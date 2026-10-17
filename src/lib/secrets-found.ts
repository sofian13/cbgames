/**
 * Secrets (easter eggs) trouvés par l'utilisateur : compteur « Secrets trouvés » des Réglages de l'app.
 * Chaque secret appelle foundSecret(id) quand il se déclenche ; la 1re fois, l'événement window
 * « zz:secret-found » (detail : { id }) permet à l'app d'afficher « Secret trouvé ! (n/18) ».
 * Liste, noms et indices : zinzin/src/secrets-list.ts. Sur le site web, rien n'écoute : sans effet.
 */
import { useSyncExternalStore } from "react";

export type SecretId =
  | "golden" | "shake" | "themes" | "disco" | "dizzy" | "screenshot" | "facedown" | "sleepy" | "pull"
  | "sulk" | "battery" | "threeam" | "crown" | "kiss" | "eject" | "slap" | "credits" | "addicts"
  // Bonus Halloween
  | "ghost" | "trick" | "lights" | "midnight";

const KEY = "zz-secrets-found";
export const SECRET_FOUND_EVENT = "zz:secret-found";

let cache: string | null | undefined;
let set = new Set<string>();
function read(): Set<string> {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { raw = null; }
  if (raw !== cache) {
    cache = raw;
    try { set = new Set(JSON.parse(raw ?? "[]") as string[]); } catch { set = new Set(); }
  }
  return set;
}

/** Le secret `id` vient de se déclencher (sans effet s'il était déjà trouvé). */
export function foundSecret(id: SecretId): void {
  if (typeof window === "undefined") return;
  const s = read();
  if (s.has(id)) return;
  const next = new Set(s); next.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch { return; }
  window.dispatchEvent(new CustomEvent(SECRET_FOUND_EVENT, { detail: { id } }));
}

export function foundSecrets(): Set<string> {
  return typeof window === "undefined" ? new Set() : read();
}

/** Réactif (Réglages) : la liste se met à jour quand un secret est trouvé. */
export function useFoundSecrets(): Set<string> {
  return useSyncExternalStore(
    (cb) => { window.addEventListener(SECRET_FOUND_EVENT, cb); return () => window.removeEventListener(SECRET_FOUND_EVENT, cb); },
    foundSecrets,
    () => new Set<string>(),
  );
}
