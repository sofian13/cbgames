"use client";

/**
 * useMe — Local user profile (blob customization).
 *
 * Persists to localStorage and broadcasts changes via a custom event so
 * any other hook instance in the page stays in sync (e.g. SiteNav avatar
 * updates instantly when the user changes their color on Profile).
 *
 * TODO (intégration backend) :
 *   - Quand l'auth Next-Auth est branchée, hydrater depuis la session
 *     côté serveur et persister à la fois en local + via une route API.
 *   - Le shape `Me` peut migrer vers Prisma — il est déjà serializable.
 */

import { useCallback, useEffect, useState } from "react";
import type { MascotColor, MascotMood } from "@/components/Mascot";

export type MeAccessory = "none" | "arms" | "crown";

export interface Me {
  name: string;
  email: string;
  color: MascotColor;
  mood: MascotMood;
  accessory: MeAccessory;
  level: number;
  xp: number;
  title: string;
}

const STORAGE_KEY = "afgames-me";
const EVENT = "af-me-changed";

export const DEFAULT_ME: Me = {
  name: "Léa",
  email: "lea@af.games",
  color: "purple",
  mood: "happy",
  accessory: "crown",
  level: 9,
  xp: 12480,
  title: "Mythique",
};

function readStored(): Me {
  if (typeof window === "undefined") return DEFAULT_ME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ME;
    const parsed = JSON.parse(raw) as Partial<Me>;
    return { ...DEFAULT_ME, ...parsed };
  } catch {
    return DEFAULT_ME;
  }
}

export function useMe(): [Me, (patch: Partial<Me>) => void] {
  const [me, setMe] = useState<Me>(DEFAULT_ME);

  // Hydrate after mount (avoids SSR/CSR mismatch)
  useEffect(() => {
    setMe(readStored());
  }, []);

  // Listen for external updates (other hook instances)
  useEffect(() => {
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<Me>).detail;
      if (next) setMe(next);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const update = useCallback((patch: Partial<Me>) => {
    setMe((current) => {
      const next = { ...current, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      window.dispatchEvent(new CustomEvent<Me>(EVENT, { detail: next }));
      return next;
    });
  }, []);

  return [me, update];
}

export const COLOR_CHOICES: MascotColor[] = [
  "purple", "pink", "yellow", "mint", "sky", "coral", "lavender", "white",
];

export const MOOD_CHOICES: { id: MascotMood; label: string }[] = [
  { id: "happy",   label: "Joie" },
  { id: "wink",    label: "Clin d'œil" },
  { id: "neutral", label: "Stoïque" },
  { id: "love",    label: "Amoureux" },
  { id: "shocked", label: "Surpris" },
  { id: "asleep",  label: "Endormi" },
];

export const ACCESSORY_CHOICES: { id: MeAccessory; label: string; icon: string }[] = [
  { id: "none",  label: "Aucun",    icon: "—"  },
  { id: "arms",  label: "Bras",     icon: "🙌" },
  { id: "crown", label: "Couronne", icon: "👑" },
];
