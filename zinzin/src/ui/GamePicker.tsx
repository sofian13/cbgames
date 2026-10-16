import { useMemo, useState } from "react";
import { ArrowRight, Dices, Lock } from "lucide-react";
import { GAMES, getZGame, playerRange, type ZGame } from "../catalog";
import type { ZGameId } from "../catalog-text";
import { type I18n, type Lang, pick, useLang } from "@/lib/i18n";
import { ZBlob } from "./ZBlob";
import { CloseBtn, Sheet, Tag } from "./common";
import { gameInfo, haptic } from "./util";
import { uiSfx } from "@/lib/ui-sfx";

/**
 * « Quel jeu ce soir ? » (slide du carrousel de l'accueil) : combien vous êtes + quelle ambiance
 * → 3 jeux proposés (tirage pondéré par les jeux qui marchent le mieux en soirée), « Autre idée » pour retirer.
 * Toucher un jeu ouvre sa fiche (le cadenas Zinzin+ y est géré comme partout).
 */

type Mood = "laugh" | "move" | "bluff" | "brain";

const T: I18n<{
  title: string; count: string; mood: string; ideas: string; again: string; pickBoth: string;
  counts: [string, string, string, string];
  moods: Record<Mood, string>;
}> = {
  fr: {
    title: "Quel jeu ce soir ?", count: "Vous êtes combien ?", mood: "Quelle ambiance ?", ideas: "On vous propose", again: "Autre idée",
    pickBoth: "Choisis les deux, on s'occupe du reste.",
    counts: ["2", "3-4", "5-7", "8 et +"],
    moods: { laugh: "On rigole 😂", move: "Ça bouge 💥", bluff: "On bluffe 🕵️", brain: "On réfléchit 🧠" },
  },
  en: {
    title: "What are we playing?", count: "How many of you?", mood: "What's the vibe?", ideas: "Try one of these", again: "Another idea",
    pickBoth: "Pick both, we'll handle the rest.",
    counts: ["2", "3-4", "5-7", "8+"],
    moods: { laugh: "Laughs 😂", move: "Action 💥", bluff: "Bluffing 🕵️", brain: "Brain time 🧠" },
  },
  es: {
    title: "¿A qué jugamos?", count: "¿Cuántos sois?", mood: "¿Qué ambiente?", ideas: "Os proponemos", again: "Otra idea",
    pickBoth: "Elige las dos cosas, nosotros hacemos el resto.",
    counts: ["2", "3-4", "5-7", "8 o más"],
    moods: { laugh: "Reír 😂", move: "Acción 💥", bluff: "Faroles 🕵️", brain: "Pensar 🧠" },
  },
};

/** Nombre de joueurs testé pour chaque choix (« 3-4 » → 4…) */
const COUNT_N = [2, 4, 6, 9];

/** Ambiances de chaque jeu (un jeu peut en avoir plusieurs) */
const MOODS: Record<ZGameId, Mood[]> = {
  undercover: ["bluff"],
  "faux-temoin": ["bluff", "brain"],
  "loup-garou": ["bluff"],
  "le-bluffeur": ["bluff", "laugh"],
  patate: ["move", "laugh"],
  "lache-pas": ["move"],
  "pile-poil": ["move"],
  verre: ["move", "laugh"],
  chut: ["laugh", "move"],
  "make-guess": ["laugh", "move"],
  "guess-word": ["laugh", "move"],
  "code-names": ["brain"],
  "longueur-onde": ["brain", "laugh"],
  "category-chrono": ["move", "brain"],
  "top-ten": ["laugh", "brain"],
  "tu-prefere": ["laugh"],
  purete: ["laugh"],
  picolette: ["laugh"],
  tgv: ["laugh", "move"],
  "pensez-pareil": ["brain", "laugh"],
  "couple-quiz": ["laugh", "brain"],
};

/** Les jeux qui font le plus l'unanimité en soirée sortent plus souvent */
const WEIGHT: Partial<Record<ZGameId, number>> = {
  undercover: 9, patate: 9, picolette: 9, "top-ten": 8, "make-guess": 8, "guess-word": 8, "le-bluffeur": 8,
  "tu-prefere": 7, "longueur-onde": 7, "loup-garou": 7, chut: 7, verre: 7, "faux-temoin": 6, purete: 6,
};

function draw(pool: ZGame[], k: number, avoid: Set<string>, freeFirst: boolean): ZGame[] {
  // Tirage pondéré sans remise, en évitant si possible les jeux qu'on vient de proposer
  const fresh = pool.filter((g) => !avoid.has(g.id));
  const src = fresh.length >= k ? fresh : pool;
  const left = [...src];
  const out: ZGame[] = [];
  // Sans Zinzin+ : le 1er proposé est jouable tout de suite si possible
  if (freeFirst) {
    const free = left.filter((g) => g.free);
    if (free.length) {
      const g = weighted(free);
      out.push(g);
      left.splice(left.indexOf(g), 1);
    }
  }
  while (out.length < k && left.length) {
    const g = weighted(left);
    out.push(g);
    left.splice(left.indexOf(g), 1);
  }
  return out;
}

function weighted(list: ZGame[]): ZGame {
  const w = list.map((g) => WEIGHT[g.id] ?? 5);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}

export function GamePicker({ premium, onClose, onOpenGame }: { premium: boolean; onClose: () => void; onOpenGame: (id: string) => void }) {
  const lang = useLang();
  const t = pick(T, lang);
  const [count, setCount] = useState<number | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [roll, setRoll] = useState(0);
  const [shown, setShown] = useState<string[]>([]);

  const ideas = useMemo(() => {
    if (count == null || !mood) return [];
    const n = COUNT_N[count];
    const fits = GAMES.filter((g) => { const [a, b] = playerRange(g); return a <= n && n <= b; });
    const match = fits.filter((g) => MOODS[g.id]?.includes(mood));
    let out = draw(match, 3, new Set(shown), !premium);
    // Pas assez de jeux pour cette ambiance : on complète avec ceux qui marchent à ce nombre
    if (out.length < 3) out = [...out, ...draw(fits.filter((g) => !out.includes(g)), 3 - out.length, new Set(), false)];
    return out;
    // `roll` : « Autre idée » relance le tirage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, mood, roll, premium]);

  const chip = (on: boolean, label: string, onClick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      onClick={() => { haptic("light"); uiSfx.choice(); onClick(); }}
      aria-pressed={on}
      className="zz-push zz-stk-sm h-11 rounded-full px-4 text-[16px] font-bold"
      style={{ background: on ? "#FFD23F" : "#fff", color: "var(--zz-ink)", rotate: on ? "-2deg" : "0deg", transition: "rotate 200ms var(--zz-spring)" }}
    >
      {label}
    </button>
  );

  return (
    <Sheet onClose={onClose} label={t.title}>
      {(close) => (
        <div className="zz-scroll min-h-0 flex-1 px-5 pb-[calc(var(--sab)+24px)] pt-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="zz-title text-[34px] leading-[0.95] text-white">{t.title}</h2>
            <CloseBtn onClick={close} />
          </div>

          <p className="mt-5 text-[15px] font-bold" style={{ color: "var(--zz-dim)" }}>{t.count}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.counts.map((c, i) => chip(count === i, c, () => { setCount(i); setShown([]); }, `c${i}`))}
          </div>

          <p className="mt-5 text-[15px] font-bold" style={{ color: "var(--zz-dim)" }}>{t.mood}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(t.moods) as Mood[]).map((m) => chip(mood === m, t.moods[m], () => { setMood(m); setShown([]); }, m))}
          </div>

          {!ideas.length ? (
            <p className="mt-7 text-center text-[15px] font-semibold" style={{ color: "var(--zz-mute)" }}>{t.pickBoth}</p>
          ) : (
            <>
              <p className="mt-7 text-[15px] font-bold" style={{ color: "var(--zz-dim)" }}>{t.ideas}</p>
              <div key={roll} className="mt-2 flex flex-col gap-3">
                {ideas.map((g, i) => (
                  <IdeaCard key={g.id} game={g} lang={lang} i={i} locked={!premium && !g.free}
                    onClick={() => { haptic(); uiSfx.blob(); close(); setTimeout(() => onOpenGame(g.id), 260); }} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { haptic("light"); uiSfx.choice(); setShown(ideas.map((g) => g.id)); setRoll((r) => r + 1); }}
                className="zz-push zz-stk-sm mx-auto mt-4 flex h-11 items-center gap-2 rounded-full px-5 text-[16px] font-bold"
                style={{ background: "var(--zz-bg)", color: "#fff" }}
              >
                <Dices size={19} strokeWidth={2.5} /> {t.again}
              </button>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

function IdeaCard({ game, lang, i, locked, onClick }: { game: ZGame; lang: Lang; i: number; locked: boolean; onClick: () => void }) {
  const info = gameInfo(game, lang);
  const g = getZGame(game.id) ?? game;
  return (
    <button
      type="button"
      onClick={onClick}
      className="zz-push zz-stk zz-rise relative flex min-h-[84px] w-full items-center gap-3 rounded-[24px] py-3 pl-[88px] pr-3 text-left"
      style={{ background: "#fff", color: "var(--zz-ink)", rotate: `${i % 2 ? 1 : -1}deg`, ["--d" as string]: `${i * 70}ms` }}
    >
      <div className="absolute left-1 top-1/2 -translate-y-1/2">
        <ZBlob size={78} color={g.color} mood={g.mood} seed={i * 5 + 2} shadow={false} outline costume={g.costume} hop={false} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="zz-title truncate text-[21px] leading-tight">{info.name}</span>
          {locked && <Tag bg="#FFD23F" tilt={-3}><Lock size={11} strokeWidth={3} /></Tag>}
        </div>
        <div className="mt-0.5 text-[13.5px] font-semibold leading-snug" style={{ opacity: 0.75 }}>{info.tagline}</div>
      </div>
      <ArrowRight size={20} strokeWidth={3} className="shrink-0" />
    </button>
  );
}
