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
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { getGlobalStats, getLevel } from "@/lib/stores/global-points";

export type MeAccessory = "none" | "arms" | "crown";

export interface Me {
  id: string;          // = guest id (identité partagée avec les jeux + Supabase)
  name: string;
  email: string;
  color: MascotColor;
  mood: MascotMood;
  accessory: MeAccessory;
  level: number;       // dérivé des stats Supabase
  xp: number;          // = total_points Supabase
  title: string;       // dérivé du niveau
}

const STORAGE_KEY = "afgames-me";
const EVENT = "af-me-changed";

// Customisation par défaut (l'XP/niveau/titre sont écrasés par les vraies stats).
export const DEFAULT_ME: Me = {
  id: "",
  name: "",
  email: "",
  color: "purple",
  mood: "happy",
  accessory: "crown",
  level: 1,
  xp: 0,
  title: "Débutant",
};

// On ne persiste que la customisation (pas l'XP/niveau, qui viennent de la DB).
type Persona = Pick<Me, "name" | "email" | "color" | "mood" | "accessory">;

function readStored(): Partial<Persona> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Persona>) : {};
  } catch {
    return {};
  }
}

export function useMe(): [Me, (patch: Partial<Me>) => void] {
  const [me, setMe] = useState<Me>(DEFAULT_ME);

  // Hydrate après le montage : identité = guest, XP/niveau = Supabase.
  useEffect(() => {
    const guest = getOrCreateGuest();
    const stored = readStored();
    setMe((m) => ({ ...m, ...stored, id: guest.id, name: stored.name || guest.name }));
    getGlobalStats(guest.id)
      .then((s) => {
        if (!s) return;
        const lvl = getLevel(s.totalPoints);
        setMe((m) => ({ ...m, xp: s.totalPoints, level: lvl.level, title: lvl.title }));
      })
      .catch(() => {});
  }, []);

  // Sync entre instances du hook (ex. nav ↔ profil).
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
      const persona: Persona = {
        name: next.name, email: next.email, color: next.color, mood: next.mood, accessory: next.accessory,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persona)); } catch {}
      // Le nom est partagé avec les jeux (guest) pour rester cohérent partout.
      if (patch.name !== undefined && patch.name.trim()) setGuestName(patch.name.trim());
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
  { id: "happy",     label: "Joie" },
  { id: "wink",      label: "Clin d'œil" },
  { id: "cool",      label: "Cool 😎" },
  { id: "laughing",  label: "Rire" },
  { id: "love",      label: "Amoureux" },
  { id: "mindblown", label: "Mind blown" },
  { id: "sus",       label: "Suspicieux" },
  { id: "angry",     label: "Énervé" },
  { id: "shocked",   label: "Surpris" },
  { id: "neutral",   label: "Stoïque" },
  { id: "asleep",    label: "Endormi" },
];

export const ACCESSORY_CHOICES: { id: MeAccessory; label: string; icon: string }[] = [
  { id: "none",  label: "Aucun",    icon: "—"  },
  { id: "arms",  label: "Bras",     icon: "🙌" },
  { id: "crown", label: "Couronne", icon: "👑" },
];
