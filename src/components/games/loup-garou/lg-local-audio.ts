/**
 * Loup-Garou local : narration vocale (Web Speech API, fr-FR / en-US / es-ES selon la langue) + bruitages et
 * ambiance en vrais samples (src/lib/sfx.ts, coupure son globale de l'app).
 * Tout est optionnel et échoue en silence.
 */

import { playSfx, preloadSfx } from "@/lib/sfx";
import { getLang, type Lang } from "@/lib/i18n";
import { SPEECH_LANG } from "./lg-local-i18n";

// ── Narration ─────────────────────────────────────────────
export function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

// Voix préférées par langue (noms courants iOS / macOS / Android), sinon la 1re de la langue
const PREFERRED: Record<Lang, RegExp> = {
  fr: /thomas|amélie|amelie|audrey|marie/i,
  en: /samantha|alex|daniel|karen|google us english/i,
  es: /mónica|monica|jorge|paulina|google español/i,
};

const cachedVoice: Partial<Record<Lang, SpeechSynthesisVoice>> = {};
function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
  if (cachedVoice[lang]) return cachedVoice[lang];
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const tag = SPEECH_LANG[lang];
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-");
  const found =
    voices.find((v) => norm(v) === tag && PREFERRED[lang].test(v.name)) ??
    voices.find((v) => norm(v) === tag) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ??
    null;
  if (found) cachedVoice[lang] = found;
  return found;
}

const RATE = 0.95;

/** Durée estimée d'une phrase lue (sert à cadencer la nuit, sans dépendre de onend) */
export function speechMs(text: string): number {
  return Math.max(1800, (text.length * 62) / RATE);
}

export function speak(text: string, enabled: boolean) {
  if (!enabled || !speechAvailable() || !text) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/·e/g, "e").replace(/[…]/g, "."));
    const lang = getLang();
    u.lang = SPEECH_LANG[lang];
    const v = voiceFor(lang);
    if (v) u.voice = v;
    u.rate = RATE;
    u.pitch = 0.92;
    synth.speak(u);
  } catch {
    /* narration indisponible : le texte reste à l'écran */
  }
}

export function stopSpeech() {
  if (!speechAvailable()) return;
  try { window.speechSynthesis.cancel(); } catch { /* rien */ }
}

// ── Ambiance & bruitages (samples) ────────────────────────
export type Mood = "night" | "day" | "off";

/** Sons du jeu, préchargés au montage */
export function preloadLgSfx() {
  preloadSfx(["tick", "tock", "gong", "whooshdown", "whoosh", "bell", "thump", "boom", "card-flip", "lose", "win", "powerup", "ding", "wrong", "pop", "success"]);
}

/** Bruitages des grands moments (jamais pendant les actions de nuit : ça trahirait qui joue). */
export const lgSfx = {
  /** La nuit tombe */
  nightFall: () => { playSfx("whooshdown", { volume: 0.5, rate: 0.7 }); playSfx("gong", { volume: 0.55, rate: 0.6, delay: 0.15 }); },
  /** Le soleil se lève */
  dawn: () => { playSfx("bell", { volume: 0.6 }); playSfx("bell", { volume: 0.35, rate: 1.25, delay: 0.25 }); },
  /** Carte retournée (distribution, voyante) */
  card: () => playSfx("card-flip", { volume: 0.8 }),
  /** Annonce d'un mort */
  death: () => { playSfx("thump", { volume: 0.9, rate: 0.7 }); playSfx("lose", { volume: 0.45, delay: 0.15 }); },
  /** Personne n'est mort */
  spared: () => playSfx("success", { volume: 0.7 }),
  /** Vote validé / tir du chasseur */
  verdict: () => { playSfx("boom", { volume: 0.7, rate: 0.8 }); playSfx("thump", { volume: 0.7, rate: 0.6, delay: 0.04 }); },
  /** Égalité */
  tie: () => playSfx("twotone", { volume: 0.7 }),
  /** Fin de partie */
  win: () => { playSfx("win", { volume: 0.9 }); playSfx("powerup", { volume: 0.55, delay: 0.12 }); playSfx("ding", { volume: 0.6, rate: 1.25, delay: 0.32 }); },
  allDead: () => { playSfx("wrong", { volume: 0.8 }); playSfx("lose", { volume: 0.6, delay: 0.08 }); },
};

/**
 * Ambiance discrète : la nuit, une vieille horloge (tic… tac…) très bas ;
 * le jour, silence (on parle !). Coupée par le bouton son global.
 */
export class Ambience {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private mood: Mood = "off";
  private beat = 0;

  /** Compat : sfx.ts se déverrouille tout seul au premier toucher */
  unlock() {
    preloadLgSfx();
  }

  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (mood === "night") this.tickTock();
  }

  private tickTock() {
    this.timer = setTimeout(() => {
      if (this.mood !== "night") return;
      this.beat++;
      playSfx(this.beat % 2 ? "tick" : "tock", { volume: 0.1, rate: 0.62 });
      this.tickTock();
    }, 1500);
  }

  /** Les loups se réveillent : gong grave + souffle */
  howl() {
    playSfx("gong", { volume: 0.5, rate: 0.45 });
    playSfx("whooshdown", { volume: 0.3, rate: 0.55, delay: 0.1 });
  }

  /** Cloche (fin du débat) */
  bell(times = 1) {
    for (let k = 0; k < times; k++) playSfx("bell", { volume: 0.8, delay: k * 0.4 });
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.mood = "off";
  }
}
