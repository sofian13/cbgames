"use client";

/**
 * TU PRÉFÈRES ? — dilemmes party sur un seul téléphone (pass-and-play).
 * On choisit une ambiance, on lit le dilemme à voix haute, tout le monde
 * lève la main pour son choix, on compte les mains sur l'écran, puis on
 * révèle le résultat du groupe + une petite punchline. Le camp minoritaire
 * prend la peine (gage, ou 1 à 2 gorgées de zinzin selon le réglage) ; en cas
 * d'égalité ou d'unanimité, TOUT LE MONDE prend. 100% local.
 * Une partie = 15 dilemmes (10 dans une Soirée Zinzin), jamais deux fois le même,
 * puis un bilan (unanimes, le plus serré).
 */

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { DISPLAY, ZButton, ZCard, ZChip, ZLink, ZScreen, ZTitle, inkOn, useScrollTopOn } from "@/components/games/local-kit";
import { Mascot } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { ArrowLeft, CupSoda, Dices, Flame, Hand, Heart, Laugh, Minus, Sparkles, type LucideIcon } from "lucide-react";
import { GameIconButton, GameIconBadge, GameInlineIcon, GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import * as DIL_FR from "@/components/games/tu-prefere/dilemmas";
import * as DIL_EN from "@/components/games/tu-prefere/dilemmas.en";
import * as DIL_ES from "@/components/games/tu-prefere/dilemmas.es";
import type { DilemmaTuple } from "@/components/games/tu-prefere/dilemmas";
import { getLang, useT, type I18n, type Lang } from "@/lib/i18n";
import { TP_STR } from "@/components/games/tu-prefere/i18n";
import { adultDefault, isNoAlcohol, sipsAllowed } from "@/lib/party-mood";
import { useUnlocked } from "@/lib/entitlements";
import { LockedPack, PremiumNudge, fmtCount, useNudgeText } from "@/components/games/premium-nudge";
import { GameRulesSheet, RulesIconButton } from "@/components/games/game-tuto";
import { SoireeNextButton, useSoireeNext } from "@/components/games/soiree-next";
import { EndHomeLink, EndPill, EndPills, EndReplay } from "@/components/games/end-actions";
import { useGameFinished } from "@/lib/game-finished";

type Cat = "classique" | "hot" | "absurde" | "couple";
type Penalty = "dares" | "sips";
interface Dilemma { a: string; b: string; quip: string }

const toDilemmas = (list: DilemmaTuple[]): Dilemma[] => list.map(([a, b, quip]) => ({ a, b, quip }));

// Dilemmes par langue (mêmes 4 ambiances). Libellés des ambiances : TP_STR.packs.
const DILEMMAS: I18n<typeof DIL_FR> = { fr: DIL_FR, en: DIL_EN, es: DIL_ES };
const listFor = (c: Cat, lang: Lang): Dilemma[] => {
  const d = DILEMMAS[lang] ?? DIL_FR;
  return toDilemmas(c === "classique" ? d.CLASSIQUE : c === "hot" ? d.CHAUD : c === "absurde" ? d.ABSURDE : d.COUPLE);
};
// Version découverte (app sans Zinzin+) : les 40 premiers dilemmes du Classique
// (toujours les mêmes) ; Chaud, Absurde, Couple et le reste du Classique = Zinzin+.
const FREE_COUNT = 40;
const FREE_CAT: Cat = "classique";
const deckFor = (c: Cat, lang: Lang, unlocked: boolean): Dilemma[] =>
  unlocked ? listFor(c, lang) : listFor(FREE_CAT, lang).slice(0, FREE_COUNT);
const totalAll = (lang: Lang) => (["classique", "hot", "absurde", "couple"] as Cat[]).reduce((n, c) => n + listFor(c, lang).length, 0);
// Bannière Zinzin+ (version découverte) : une seule fois, au résultat de ce dilemme
const NUDGE_AT = 12;
// Longueur d'une partie (dans une Soirée Zinzin : plus courte, on enchaîne)
const GAME_LEN = 15;
const SOIREE_LEN = 10;
/** Résultat d'un dilemme joué (pour le bilan) */
interface Played { a: string; b: string; va: number; vb: number }
const isUnanimous = (r: Played) => r.va + r.vb >= 2 && Math.min(r.va, r.vb) === 0;
/** Le dilemme le plus serré : plus petit écart relatif (au moins 2 mains), puis le plus de mains */
function closestOf(results: Played[]): Played | null {
  let best: Played | null = null;
  let bestGap = Infinity;
  for (const r of results) {
    const tot = r.va + r.vb;
    if (tot < 2) continue;
    const gap = Math.abs(r.va - r.vb) / tot;
    if (gap < bestGap || (gap === bestGap && best && tot > best.va + best.vb)) { best = r; bestGap = gap; }
  }
  return best;
}
const PACKS: Record<Cat, { icon: LucideIcon; color: string }> = {
  classique: { icon: Dices, color: "#4ECDC4" },
  hot: { icon: Flame, color: "#FF3EA5" },
  absurde: { icon: Laugh, color: "#3DDC97" },
  couple: { icon: Heart, color: "#FF6B5B" },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Carte d'une option : tap = +1 main levée, bouton − pour corriger. Après révélation : % du groupe.
function OptionCard({
  side, text, count, total, revealed, winner, loser, color, tilt, onInc, onDec,
}: {
  side: "a" | "b"; text: string; count: number; total: number; revealed: boolean; winner: boolean;
  /** Camp minoritaire : c'est lui qui prend la peine */
  loser: boolean;
  color: string; tilt: number; onInc: () => void; onDec: () => void;
}) {
  const t = useT(TP_STR);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  // Le camp minoritaire n'est pas grisé : c'est lui qui prend la peine
  const dim = revealed && !winner && !loser;
  const bg = revealed ? (winner ? color : "#fff") : side === "a" ? "#fff" : "#FFF6E5";
  return (
    <div
      className="relative flex flex-1 flex-col rounded-[26px] transition-opacity"
      style={{ background: bg, color: inkOn(bg), border: `3px solid ${GAME_INK}`, boxShadow: `0 6px 0 ${GAME_INK}`, rotate: `${tilt}deg`, opacity: dim ? 0.6 : 1, minHeight: 132 }}
    >
      {loser && (
        <span className="absolute -top-3 right-4 z-[2] rounded-full px-3 py-1 text-[13px] font-bold uppercase tracking-wide"
          style={{ background: "#FF3EA5", color: "#fff", border: `2.5px solid ${GAME_INK}`, rotate: "4deg" }}>
          {t.minorityBadge}
        </span>
      )}
      <button
        type="button"
        onClick={onInc}
        disabled={revealed}
        className="flex-1 px-5 pb-2 pt-4 text-left"
        aria-label={t.countHandFor(text)}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full text-[18px]"
          style={{ ...DISPLAY, background: side === "a" ? "#FFD23F" : "#FF3EA5", color: GAME_INK, border: `2.5px solid ${GAME_INK}` }}>
          {side.toUpperCase()}
        </span>
        <p className="mt-2 break-words hyphens-auto" style={{ ...DISPLAY, fontSize: text.length > 50 ? 22 : 25, lineHeight: 1.05 }}>{text}</p>
      </button>
      <div className="flex items-center justify-between gap-2 px-4 pb-3.5">
        {revealed ? (
          <span style={{ ...DISPLAY, fontSize: 34, lineHeight: 1 }}>{t.pct(pct)}</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[16px] font-bold">
            <Hand size={18} strokeWidth={2.6} aria-hidden /> {t.hands(count)}
          </span>
        )}
        {revealed ? (
          <span className="text-[15px] font-bold">{t.hands(count)}</span>
        ) : (
          count > 0 && <GameIconButton icon={Minus} label={t.removeHand} onClick={onDec} />
        )}
      </div>
    </div>
  );
}

export default function TuPrefereGame({ onReturnToLobby }: GameProps) {
  const t = useT(TP_STR);
  const nudge = useNudgeText();
  // Langue des dilemmes figée à l'ouverture du jeu.
  const [lang] = useState<Lang>(() => getLang());
  // Abonné Zinzin+ (ou site web) : tous les packs ; sinon 40 dilemmes du Classique
  const unlocked = useUnlocked();
  // Soirée « Folle » : on démarre directement sur l'ambiance Chaud (le chip permet d'en changer).
  const [cat, setCat] = useState<Cat | null>(() => (adultDefault(false) && unlocked ? "hot" : null));
  const [deck, setDeck] = useState<Dilemma[]>(() => (adultDefault(false) && unlocked ? shuffle(listFor("hot", lang)) : []));
  // Dans une Soirée Zinzin (contexte « Jeu suivant » présent) : partie plus courte
  const inSoiree = useSoireeNext() !== null;
  const [gameLen] = useState(() => (inSoiree ? SOIREE_LEN : GAME_LEN));
  // Nombre de dilemmes de la partie en cours (plafonné à la taille du paquet)
  const [target, setTarget] = useState(() => Math.min(gameLen, deck.length));
  // Dilemmes joués dans la partie en cours (bilan) et écran de fin
  const [results, setResults] = useState<Played[]>([]);
  const [phase, setPhase] = useState<"play" | "end">("play");
  // Nombre de dilemmes révélés (bannière Zinzin+ une seule fois)
  const [played, setPlayed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [revealed, setRevealed] = useState(false);
  // Peine du camp minoritaire. Soirée « Chill » : gages uniquement (pas de gorgées).
  const [sipsOk] = useState(() => sipsAllowed(true));
  const [penalty, setPenalty] = useState<Penalty>(() => (sipsOk ? "sips" : "dares"));
  // Feuille de règles (bouton livre en haut à droite, sur tous les écrans du jeu)
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesBtn = <RulesIconButton onClick={() => setRulesOpen(true)} />;
  const rulesSheet = rulesOpen && <GameRulesSheet name={t.title} rules={t.rules(sipsOk && penalty === "sips", gameLen)} onClose={() => setRulesOpen(false)} />;
  const [dare, setDare] = useState("");
  const penaltyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { preloadSfx(["pop", "pop2", "whoosh", "gong", "card-slide", "card-flip", "select", "ding", "win"]); }, []);
  useScrollTopOn(`${cat}-${idx}-${phase}`);
  // Écran de fin : jeu sans gagnant (la Soirée enchaîne, note / stats de la bande)
  useGameFinished(phase === "end", { noWinner: true });
  // À la révélation, on fait défiler jusqu'à la peine pour que tout le monde la voie
  useEffect(() => {
    if (!revealed) return;
    const id = window.setTimeout(() => penaltyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
    return () => window.clearTimeout(id);
  }, [revealed]);

  // Nouvelle partie sur un paquet déjà mélangé (jamais deux fois le même dilemme dans la partie)
  const startGame = (d: Dilemma[]) => {
    setDeck(d); setIdx(0); setTarget(Math.min(gameLen, d.length));
    setResults([]); setPhase("play"); setVotes({ a: 0, b: 0 }); setRevealed(false);
  };
  const startPack = (c: Cat) => {
    playSfx("card-flip", { volume: 0.7 });
    setCat(c); startGame(shuffle(deckFor(c, lang, unlocked)));
  };
  // « Encore 15 » : les dilemmes pas encore vus du paquet (on remélange tout s'il n'en reste plus)
  const rest = deck.slice(idx + 1);
  const again = () => {
    playSfx("card-flip", { volume: 0.7 });
    startGame(rest.length ? rest : shuffle(deckFor(cat!, lang, unlocked)));
  };
  const current = deck[idx];
  const color = cat ? PACKS[cat].color : "#4ECDC4";
  const total = votes.a + votes.b;

  // Dilemme en cours = n° (joués + 1) ; dernier révélé → « Voir le bilan »
  const isLast = revealed && results.length >= target;
  // « Un autre » (sans compter) seulement s'il reste assez de dilemmes pour finir la partie
  const canReroll = deck.length - idx - 1 > target - results.length - 1;
  const next = () => {
    if (isLast) { playCombo("reveal"); setPhase("end"); return; }
    if (idx + 1 >= deck.length) return;
    playSfx("card-slide", { volume: 0.7 });
    setIdx(idx + 1);
    setVotes({ a: 0, b: 0 });
    setRevealed(false);
  };
  const bump = (side: "a" | "b", d: 1 | -1) => {
    if (revealed) return;
    const n = Math.max(0, Math.min(99, votes[side] + d));
    if (n === votes[side]) return;
    // Une main de plus : « pop » qui monte avec le nombre de mains
    if (d > 0) playSfx(side === "a" ? "pop" : "pop2", { volume: 0.45, rate: Math.min(1.6, 0.9 + n * 0.06) });
    setVotes({ ...votes, [side]: n });
  };
  const reveal = () => {
    const tie = votes.a === votes.b;
    const all = tie || Math.max(votes.a, votes.b) === total; // égalité ou unanimité : tout le monde prend
    playCombo("reveal");
    const pool = all ? t.groupDares : t.dares;
    setDare(pool[Math.floor(Math.random() * pool.length)]);
    setPlayed((n) => n + 1);
    if (current) setResults((r) => [...r, { a: current.a, b: current.b, va: votes.a, vb: votes.b }]);
    setRevealed(true);
  };

  // ── Choix d'ambiance ──
  if (!cat) {
    return (
      <ZScreen tools={rulesBtn}>
        {rulesSheet}
        <div className="flex items-end gap-3">
          <ZTitle as="h1" size={52} style={{ lineHeight: 0.92 }}>{t.title}</ZTitle>
          <div className="-mb-1 shrink-0"><Mascot size={74} color="sky" mood="thinking" shadow={false} /></div>
        </div>
        <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
          {t.intro}
        </p>
        <ZTitle size={22} className="mt-6">{t.penaltyTitle}</ZTitle>
        {sipsOk ? (
          <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-label={t.penaltyTitle}>
            {([["dares", Sparkles, t.penaltyDares], ["sips", CupSoda, t.penaltySips]] as const).map(([p, Icon, txt]) => {
              const on = penalty === p;
              return (
                <button key={p} type="button" role="radio" aria-checked={on} onClick={() => { playSfx("select", { volume: 0.5 }); setPenalty(p); }}
                  className="flex min-h-[64px] items-center gap-2.5 rounded-[18px] px-3 py-2 text-left"
                  style={{ background: on ? "#FFD23F" : "rgba(255,255,255,0.08)", color: on ? GAME_INK : "#fff", border: `3px solid ${on ? GAME_INK : "rgba(255,255,255,0.25)"}` }}>
                  <Icon size={22} strokeWidth={2.6} aria-hidden className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[16px] leading-tight" style={DISPLAY}>{txt.title}</span>
                    <span className="block text-[13px] font-semibold leading-tight opacity-80">{txt.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{isNoAlcohol() ? t.penaltyNoAlc : t.penaltyChill}</p>
        )}
        <ZTitle size={28} className="mt-6">{t.vibe}</ZTitle>
        {!unlocked ? (
          // Version découverte : Classique (40 dilemmes) offert, les autres ambiances avec cadenas + aperçu
          <div className="mt-3 flex flex-col gap-3">
            <button type="button" onClick={() => startPack(FREE_CAT)}
              className="flex min-h-[84px] items-center gap-3 rounded-[22px] p-3.5 text-left transition-[translate,box-shadow] shadow-[0_5px_0_#15082E] active:translate-y-[4px] active:shadow-[0_1px_0_#15082E]"
              style={{ background: PACKS[FREE_CAT].color, color: inkOn(PACKS[FREE_CAT].color), border: `3px solid ${GAME_INK}`, rotate: "-1deg" }}>
              <GameIconBadge icon={PACKS[FREE_CAT].icon} bg="#fff" size={40} />
              <span className="min-w-0">
                <span className="block text-[22px] leading-none" style={DISPLAY}>{t.packs[FREE_CAT].label}</span>
                <span className="mt-1 block text-[14px] font-semibold leading-tight">{t.packs[FREE_CAT].tag}{"\u00A0·\u00A0"}{t.freeDilemmas(FREE_COUNT)}</span>
              </span>
            </button>
            {(["hot", "absurde", "couple"] as Cat[]).map((c) => (
              <LockedPack key={c} label={`${t.packs[c].label} · ${t.packs[c].tag}`}
                preview={listFor(c, lang).slice(0, 2).map((d) => `${d.a} ${t.or} ${d.b}`)} />
            ))}
            <LockedPack label={t.restOfClassic(listFor(FREE_CAT, lang).length - FREE_COUNT)}
              preview={listFor(FREE_CAT, lang).slice(FREE_COUNT, FREE_COUNT + 2).map((d) => `${d.a} ${t.or} ${d.b}`)} />
          </div>
        ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(Object.keys(PACKS) as Cat[]).map((c, i) => {
            const pk = PACKS[c];
            return (
              <button key={c} type="button" onClick={() => startPack(c)}
                className="flex min-h-[132px] flex-col items-start gap-1 rounded-[22px] p-3.5 text-left transition-[translate,box-shadow] shadow-[0_5px_0_#15082E] active:translate-y-[4px] active:shadow-[0_1px_0_#15082E]"
                style={{ background: pk.color, color: inkOn(pk.color), border: `3px solid ${GAME_INK}`, rotate: `${i % 2 ? 1.5 : -1.5}deg` }}>
                <GameIconBadge icon={pk.icon} bg="#fff" size={40} />
                <span className="mt-1 text-[22px] leading-none" style={DISPLAY}>{t.packs[c].label}</span>
                <span className="text-[14px] font-semibold leading-tight">{t.packs[c].tag}{"\u00A0·\u00A0"}{listFor(c, lang).length}</span>
              </button>
            );
          })}
        </div>
        )}
        <div className="min-h-8 flex-1" />
        <div className="flex justify-center"><IdeaButton game={t.gameName} kind="dilemme" /></div>
        {onReturnToLobby && <ZLink onClick={onReturnToLobby} className="mt-2"><GameInlineIcon icon={ArrowLeft} /> {t.backHome}</ZLink>}
      </ZScreen>
    );
  }

  // ── Bilan ──
  if (phase === "end") {
    const unanimous = results.filter(isUnanimous).length;
    const close = closestOf(results);
    const nextLen = Math.min(gameLen, rest.length || deckFor(cat, lang, unlocked).length);
    const closeTot = close ? close.va + close.vb : 0;
    return (
      <ZScreen tools={rulesBtn}>
        {rulesSheet}
        <ConfettiBurst count={40} />
        <div className="flex justify-center"><Mascot size={104} color="sky" mood="laughing" arms shadow={false} /></div>
        <ZTitle as="h1" size={44} className="mt-3 text-center" style={{ lineHeight: 0.95 }}>{t.endTitle(unanimous, results.length)}</ZTitle>
        <p className="mt-2 text-center text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{t.endSub(results.length)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ZCard bg="#fff" tilt={-1.5} shadow={4} radius={20} className="px-3 py-3 text-center">
            <p style={{ ...DISPLAY, fontSize: 40, lineHeight: 1 }}>{results.length}</p>
            <p className="mt-1 text-[14px] font-bold leading-tight">{t.statPlayed}</p>
          </ZCard>
          <ZCard bg={color} tilt={1.5} shadow={4} radius={20} className="px-3 py-3 text-center">
            <p style={{ ...DISPLAY, fontSize: 40, lineHeight: 1 }}>{unanimous}</p>
            <p className="mt-1 text-[14px] font-bold leading-tight">{t.statUnanimous}</p>
          </ZCard>
        </div>
        <ZCard bg="#FFD23F" tilt={-1} shadow={4} radius={20} className="mt-4 px-4 py-3">
          <p className="text-[19px] leading-tight" style={DISPLAY}>{t.closestTitle}</p>
          {close ? (
            <>
              <p className="mt-1.5 text-[16px] font-bold leading-snug">
                <span style={DISPLAY}>A</span> {close.a} <span className="opacity-70">{t.pct(Math.round((close.va / closeTot) * 100))}</span>
              </p>
              <p className="mt-0.5 text-[16px] font-bold leading-snug">
                <span style={DISPLAY}>B</span> {close.b} <span className="opacity-70">{t.pct(Math.round((close.vb / closeTot) * 100))}</span>
              </p>
              <p className="mt-1 text-[14px] font-semibold opacity-80">{t.closestSplit(Math.max(close.va, close.vb), Math.min(close.va, close.vb))}</p>
            </>
          ) : (
            <p className="mt-1 text-[15px] font-semibold leading-snug">{t.noClosest}</p>
          )}
        </ZCard>
        {/* Une seule action principale (Jeu suivant en Soirée, sinon Encore 15), le reste en pastilles */}
        <div className="mt-auto flex flex-col gap-3 pt-7">
          <SoireeNextButton />
          <EndReplay onClick={again} label={t.again(nextLen)}>
            <ZButton bg={color} onClick={again}>{t.again(nextLen)}</ZButton>
          </EndReplay>
          <EndPills className="mt-1">
            <EndPill onClick={() => { playSfx("select", { volume: 0.5 }); setPhase("play"); setCat(null); }}>{t.changeVibe}</EndPill>
            <IdeaButton short game={t.gameName} kind="dilemme" bg="#fff" />
          </EndPills>
          <EndHomeLink onClick={onReturnToLobby}><GameInlineIcon icon={ArrowLeft} /> {t.backHome}</EndHomeLink>
        </div>
      </ZScreen>
    );
  }

  const winner: "a" | "b" | "tie" | null = !revealed || total === 0 ? null : votes.a === votes.b ? "tie" : votes.a > votes.b ? "a" : "b";
  // Camp minoritaire = l'autre camp, s'il a au moins une main.
  // Égalité ou unanimité (pas de minorité) : TOUT LE MONDE prend la peine.
  const loser: "a" | "b" | null = winner === "a" && votes.b > 0 ? "b" : winner === "b" && votes.a > 0 ? "a" : null;
  const everyone = winner !== null && loser === null;
  const loserCount = loser ? votes[loser] : 0;
  // Seul(e) contre tous : 2 gorgées ; sinon (minorité ou tout le monde) 1 chacun (jamais plus de 3)
  const sips = loserCount === 1 ? 2 : 1;
  // Version découverte : la bannière Zinzin+ apparaît au résultat du 12e dilemme (ou au dernier du paquet)
  const showNudge = revealed && !unlocked && (played === NUDGE_AT || (played < NUDGE_AT && idx + 1 >= deck.length));

  return (
    <ZScreen tools={<>{rulesBtn}<IdeaButton game={t.gameName} kind="dilemme" compact bg="#fff" /></>}>
      {rulesSheet}
      {revealed && winner !== "tie" && total > 1 && Math.max(votes.a, votes.b) === total && <ConfettiBurst count={36} />}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setCat(null)} className="min-h-11" aria-label={t.changeVibe}>
          <ZChip bg={color} tilt={-2}><GameInlineIcon icon={PACKS[cat].icon} /> {t.packs[cat].label}</ZChip>
        </button>
        <ZChip bg="#fff" tilt={2}>{Math.min(target, results.length + (revealed ? 0 : 1))}/{target}</ZChip>
      </div>
      <ZTitle size={38} className="mt-3">{t.prompt}</ZTitle>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        {current && (
          <OptionCard side="a" text={current.a} count={votes.a} total={total} revealed={revealed} tilt={-1}
            winner={winner === "a" || winner === "tie"} loser={loser === "a"} color={color} onInc={() => bump("a", 1)} onDec={() => bump("a", -1)} />
        )}
        <div className="relative z-[1] -my-4 self-center">
          <span className="grid h-14 w-14 place-items-center rounded-full text-[22px]"
            style={{ ...DISPLAY, background: GAME_INK, color: "#fff", border: "3px solid #fff", rotate: "-6deg" }}>{t.or}</span>
        </div>
        {current && (
          <OptionCard side="b" text={current.b} count={votes.b} total={total} revealed={revealed} tilt={1}
            winner={winner === "b" || winner === "tie"} loser={loser === "b"} color={color} onInc={() => bump("b", 1)} onDec={() => bump("b", -1)} />
        )}
      </div>

      <div className="mt-5">
        {revealed ? (
          <>
            <ZCard bg="#FFD23F" tilt={-1.5} shadow={4} radius={20} className="px-4 py-3">
              <p className="text-[19px] leading-tight" style={DISPLAY}>
                {winner === "tie" ? t.tie : t.tableChose(winner === "a" ? "A" : "B")}
              </p>
              {current?.quip && <p className="mt-1 text-[15px] font-semibold leading-snug">{current.quip}</p>}
            </ZCard>
            {/* Peine : explicite, qui prend quoi */}
            <div ref={penaltyRef}>
            <ZCard bg="#fff" tilt={1} shadow={4} radius={20} className="mt-3 px-4 py-3">
              {loser || everyone ? (
                <>
                  <p className="text-[18px] leading-tight" style={{ ...DISPLAY, color: "#E0218A" }}>
                    {loser ? t.loserHead(loser === "a" ? "A" : "B", loserCount) : winner === "tie" ? t.everyoneTie : t.everyoneUnanimous}
                  </p>
                  {penalty === "sips" ? (
                    <>
                      <p className="mt-1.5 text-[17px] font-bold leading-snug">
                        <GameInlineIcon icon={CupSoda} /> {loserCount === 1 ? t.sipsSolo(sips) : t.sipsEach(sips)}
                      </p>
                      <p className="mt-0.5 text-[15px] font-semibold leading-snug">{t.orDare} {dare}</p>
                      <p className="mt-1 text-[13px] font-semibold opacity-80">{t.waterOk}</p>
                    </>
                  ) : (
                    <p className="mt-1.5 text-[16px] font-bold leading-snug">{t.dareOnly} {dare}</p>
                  )}
                </>
              ) : null}
            </ZCard>
            </div>
            {showNudge && <PremiumNudge text={nudge.tuPrefere(fmtCount(totalAll(lang) - FREE_COUNT, lang))} style={{ marginTop: 16 }} />}
            <ZButton bg={isLast ? "#FFD23F" : color} className="mt-5" onClick={next}>{isLast ? t.seeRecap : t.nextDilemma}</ZButton>
          </>
        ) : (
          <>
            {total === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                  {t.raiseHands}
                </p>
                {canReroll && <RerollButton label={t.reroll} onClick={next} />}
              </div>
            ) : (
              <ZButton bg="#FFD23F" onClick={reveal}>{t.seeResult(total)}</ZButton>
            )}
          </>
        )}
      </div>
    </ZScreen>
  );
}
