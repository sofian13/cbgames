"use client";

/**
 * TU ME CONNAIS ? — quiz de couple/duo sur un seul téléphone.
 * À chaque manche : l'un répond sur lui-même en secret, l'autre devine.
 * Bonne réponse = 1 point pour celui qui devine. On alterne les rôles.
 * À la fin : taux de complicité. 100% local (LocalGame stub).
 */

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { LocalShell, ModeSelect, colorForIndex, type GameMode } from "@/components/games/local-kit";
import { Mascot, MASCOT_PALETTE } from "@/components/Mascot";
import { ArrowLeft, Brain, Check, Flame, Heart, Hourglass, House, MessageCircle, Pizza, RotateCcw, Sparkles, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import { GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { isSfxMuted, playCombo, playSfx, preloadSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { QPACKS, type Q } from "./questions";
import { getSavedDuo, saveDuo } from "@/lib/saved-players";

const ACCENT = "#FF6BAE";

function verdictFor(pct: number) {
  return pct >= 85 ? { t: "Âmes sœurs !", c: "#3DDC97" }
    : pct >= 65 ? { t: "Sacrée complicité", c: "#FFD23F" }
    : pct >= 45 ? { t: "Encore des choses à découvrir", c: "#FF8A3D" }
    : { t: "Premier rendez-vous ?", c: "#FF6B5B" };
}

// ── WRAPPER : choix local / en ligne ──
export default function CoupleQuizGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (mode === null) {
    return <ModeSelect emoji="❤️" name="Tu me connais ?"
      tagline="Quiz de couple : l'un répond sur lui, l'autre devine. Ensemble sur un tél, ou chacun le sien à distance."
      onPick={setMode} />;
  }
  if (mode === "local") return <CoupleQuizLocal onReturnToLobby={props.onReturnToLobby} />;
  return <CoupleQuizOnline {...props} />;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type Phase = "names" | "config" | "pass-answer" | "answer" | "pass-guess" | "guess" | "reveal" | "over";

// ── DA « sticker » du mode local ──
const INK = "#15082E";
const NIGHT = "#1E1250";
const PINK = "#FF3EA5";
const DOTS = "radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px)";
const TOP_SAFE = "calc(env(safe-area-inset-top, 0px) + 72px)";
const BOTTOM_SAFE = "calc(env(safe-area-inset-bottom, 0px) + 20px)";
const DISPLAY: CSSProperties = { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", wordSpacing: "0.12em" };

function sticker(bg: string, shadow = 4): CSSProperties {
  return { background: bg, border: `${shadow >= 5 ? 3 : 2.5}px solid ${INK}`, boxShadow: `0 ${shadow}px 0 ${INK}` };
}

/** Texte lisible sur une couleur pleine : encre foncée ou blanc. */
function inkOn(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!m) return INK;
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.22 ? INK : "#fff";
}

const bodyOf = (i: number) => MASCOT_PALETTE[colorForIndex(i)].body;
const qKey = (x: Q) => [x.a, x.b].sort().join("|");
/** Inverse le sens A/B une fois sur deux (évite les automatismes). */
const flip = (x: Q): Q => (Math.random() < 0.5 ? x : { a: x.b, b: x.a });

/** Son coupé / actif : une seule coupure globale (sfx.ts). */
function useSfxMuted() {
  return useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
}

// Conteneur plein écran : rien sous la barre d'état ni sous la croix « quitter » de l'app
function Screen({ children, center, footer }: { children: ReactNode; center?: boolean; footer?: ReactNode }) {
  const muted = useSfxMuted();
  return (
    <div
      className="relative flex min-h-[100dvh] shrink-0 flex-col px-5 text-white"
      style={{ background: NIGHT, backgroundImage: DOTS, backgroundSize: "22px 22px", paddingTop: TOP_SAFE, paddingBottom: BOTTOM_SAFE }}
    >
      <GameTopRight>
        <GameIconButton icon={muted ? VolumeX : Volume2} label={muted ? "Activer le son" : "Couper le son"} active={muted} onClick={() => setSfxMuted(!muted)} />
      </GameTopRight>
      <div className={`mx-auto flex w-full max-w-md flex-col ${center ? "my-auto items-center" : ""}`}>{children}</div>
      {footer && (
        <div
          className="sticky bottom-0 z-[2] -mx-5 mt-auto px-5 pt-5"
          style={{ paddingBottom: BOTTOM_SAFE, marginBottom: `calc(-1 * ${BOTTOM_SAFE})`, background: `linear-gradient(180deg, transparent, ${NIGHT} 38%)` }}
        >
          <div className="mx-auto w-full max-w-md">{footer}</div>
        </div>
      )}
    </div>
  );
}

function BigBtn({ bg, onClick, disabled, children }: { bg: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-full text-[22px] transition-transform active:translate-y-[3px]"
      style={{ ...DISPLAY, letterSpacing: "-0.01em", ...(disabled ? sticker("#3B2C7A", 5) : sticker(bg, 5)), color: disabled ? "rgba(255,255,255,0.8)" : inkOn(bg) }}
    >
      {children}
    </button>
  );
}

function SubBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 px-3 text-[15px] font-semibold text-white/85">
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-7" style={{ ...DISPLAY, fontSize: 26, lineHeight: 1 }}>{children}</h2>;
}

/** Prénom mis en valeur : même police que la phrase, couleur du joueur. */
/** Icône de chaque thème (pas d'emoji : icônes du kit, cohérentes avec la DA). */
const PACK_ICON: Record<string, LucideIcon> = { gouts: Pizza, quotidien: House, caractere: Brain, couple: Heart, hypo: Sparkles, coquin: Flame };

/** Prénom propre : pas d'espace ni de trait d'union qui traîne (coupure à 16 caractères). */
const cleanName = (s: string) => s.trim().replace(/[\s\-–'’.]+$/, "");

function Who({ i, children }: { i: number; children: ReactNode }) {
  return <span style={{ color: MASCOT_PALETTE[colorForIndex(i)].hi }}>{children}</span>;
}

function CoupleQuizLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  const [phase, setPhase] = useState<Phase>("names");
  const [names, setNames] = useState<[string, string]>(() => getSavedDuo());
  const [packs, setPacks] = useState<string[]>(() => QPACKS.filter((p) => p.defaultOn).map((p) => p.id));
  const [rounds, setRounds] = useState(10);
  const [deck, setDeck] = useState<Q[]>([]);
  const [round, setRound] = useState(0);
  const [answerer, setAnswerer] = useState(0); // index 0/1
  const [truth, setTruth] = useState<"a" | "b" | null>(null);
  const [guess, setGuess] = useState<"a" | "b" | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [seen, setSeen] = useState<string[]>([]); // questions déjà sorties dans la partie

  useEffect(() => {
    preloadSfx(["whoosh", "select", "toggle", "pop", "success", "ding", "wrong", "lose", "win", "powerup", "confirm", "card-flip"]);
  }, []);

  const guesser = 1 - answerer;
  const q = deck[round];
  const pool = QPACKS.filter((p) => packs.includes(p.id)).flatMap((p) => p.qs);

  const begin = () => {
    // Les deux sens (A/B) sont mélangés pour éviter les automatismes
    const picked = shuffle(pool).slice(0, rounds).map(flip);
    setSeen(picked.map(qKey));
    setDeck(picked);
    setRound(0); setAnswerer(0); setScores([0, 0]); setTruth(null); setGuess(null);
    setPhase("pass-answer");
    playSfx("confirm", { volume: 0.7 });
  };

  /** « Pas fou ? Une autre » : question jamais vue dans la partie (avant que le joueur réponde). */
  const fresh = pool.filter((x) => !seen.includes(qKey(x)));
  const reroll = () => {
    if (!fresh.length) return;
    const nq = flip(fresh[Math.floor(Math.random() * fresh.length)]);
    setSeen((k) => [...k, qKey(nq)]);
    setDeck((d) => d.map((x, i) => (i === round ? nq : x)));
    playSfx("card-flip", { volume: 0.7, delay: 0.08 });
  };

  const onAnswer = (pick: "a" | "b") => { setTruth(pick); setPhase("pass-guess"); playSfx("pop", { volume: 0.6 }); };
  const onGuess = (pick: "a" | "b") => {
    setGuess(pick);
    const ok = pick === truth;
    if (ok) setScores((s) => (guesser === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
    if (ok) { playSfx("success", { volume: 0.8 }); playSfx("ding", { volume: 0.5, rate: 1.2, delay: 0.15 }); }
    else playCombo("fail");
    try { navigator.vibrate?.(ok ? 60 : [120, 60, 120]); } catch { /* rien */ }
    setPhase("reveal");
  };
  const nextRound = () => {
    if (round + 1 >= deck.length) {
      const total = scores[0] + scores[1];
      const pct = deck.length ? (total / deck.length) * 100 : 0;
      if (pct >= 65) playCombo("fanfare");
      else if (pct >= 45) playSfx("win", { volume: 0.8 });
      else playSfx("lose", { volume: 0.7 });
      setPhase("over");
      return;
    }
    setRound(round + 1); setAnswerer((a) => 1 - a); setTruth(null); setGuess(null);
    setPhase("pass-answer");
  };

  // prénoms longs → scores l'un sous l'autre (sinon « Jean-Chri… » tronqué)
  const longDuo = names[0].length > 9 || names[1].length > 9;

  // ── Prénoms (2 joueurs exactement) ──
  if (phase === "names") {
    const ok = cleanName(names[0]) && cleanName(names[1]);
    return (
      <Screen
        footer={
          <BigBtn bg={PINK} disabled={!ok} onClick={() => { const clean: [string, string] = [cleanName(names[0]), cleanName(names[1])]; saveDuo(clean); setNames(clean); setPhase("config"); playSfx("confirm", { volume: 0.6 }); }}>
            {ok ? "Continuer" : "Vos deux prénoms"}
          </BigBtn>
        }
      >
        <h1 style={{ ...DISPLAY, fontSize: "clamp(42px, 12.5vw, 60px)", lineHeight: 0.92 }}>
          Tu me
          <br />
          <span style={{ color: PINK }}>connais&nbsp;?</span>
        </h1>
        <p className="mt-3 text-[16px] font-semibold leading-snug text-white/85">
          À deux sur un seul tél. L&apos;un répond en secret sur lui-même, l&apos;autre doit deviner sa réponse. On alterne à chaque question.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[0, 1].map((i) => {
            const bg = bodyOf(i);
            const ink = inkOn(bg);
            return (
              <div key={i} className="flex flex-col items-center" style={{ transform: `rotate(${i ? 2 : -2}deg)` }}>
                <div className="relative z-[1] -mb-5">
                  <Mascot size={72} color={colorForIndex(i)} mood={names[i].trim() ? "love" : "thinking"} shadow={false} delay={i * 0.3} />
                </div>
                <input
                  value={names[i]}
                  onChange={(e) => { const v = e.target.value.slice(0, 16); setNames((n) => (i === 0 ? [v, n[1]] : [n[0], v])); }}
                  placeholder={i === 0 ? "Toi" : "Ta moitié"}
                  aria-label={`Prénom ${i + 1}`}
                  autoComplete="off" autoCorrect="off" autoCapitalize="words" spellCheck={false} enterKeyHint={i === 0 ? "next" : "done"}
                  className="cq-name w-full min-w-0 rounded-[20px] px-2 pb-3 pt-7 text-center outline-none"
                  style={{ ...sticker(bg), ...DISPLAY, letterSpacing: "-0.01em", color: ink, fontSize: names[i] ? 22 : 17, ["--ph" as string]: ink === "#fff" ? "rgba(255,255,255,0.75)" : "rgba(21,8,46,0.55)" }}
                />
              </div>
            );
          })}
        </div>
        <style>{`.cq-name::placeholder{color:var(--ph);opacity:1}`}</style>
      </Screen>
    );
  }

  // ── Thèmes + nombre de questions ──
  if (phase === "config") {
    return (
      <Screen
        footer={
          <>
            <BigBtn bg={PINK} disabled={pool.length < 2} onClick={begin}>
              {pool.length < 2 ? "Choisis au moins un thème" : "C'est parti !"}
            </BigBtn>
            <div className="mt-1 flex justify-center">
              <SubBtn onClick={() => setPhase("names")}><GameInlineIcon icon={ArrowLeft} /> Changer les prénoms</SubBtn>
            </div>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {[0, 1].map((i) => (
            <span key={i} className="contents">
              {i === 1 && <span style={{ ...DISPLAY, fontSize: 30 }}>&amp;</span>}
              <span
                className="max-w-full rounded-[18px] px-4 pb-1.5 pt-2"
                style={{ ...sticker(bodyOf(i), 4), ...DISPLAY, color: inkOn(bodyOf(i)), fontSize: 32, lineHeight: 1, transform: `rotate(${i ? 2 : -2}deg)`, overflowWrap: "anywhere" }}
              >
                {names[i]}
              </span>
            </span>
          ))}
        </div>

        <SectionTitle>Les thèmes</SectionTitle>
        <p className="mt-0.5 text-[14px] font-semibold text-white/70">{pool.length} questions dans la pioche</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {QPACKS.map((p, i) => {
            const on = packs.includes(p.id);
            const bg = on ? (p.adult ? PINK : "#FFD23F") : "#2E1F6B";
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => { playSfx("toggle", { volume: 0.5 }); setPacks((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id])); }}
                className="flex items-center gap-2 rounded-[18px] pl-2.5 pr-2 text-left transition-transform active:translate-y-[3px]"
                style={{ ...sticker(bg), color: on ? INK : "#fff", minHeight: 60, transform: `rotate(${i % 2 ? 1 : -1}deg)` }}
              >
                {(() => { const Ic = PACK_ICON[p.id] ?? Sparkles; return <Ic size={20} strokeWidth={2.6} className="shrink-0" aria-hidden />; })()}
                <span className="min-w-0 flex-1 text-[14.5px] font-bold leading-tight">
                  {p.name}
                  {p.adult && <span className="block text-[13px] font-semibold" style={{ opacity: 0.8 }}>18+, coquin</span>}
                </span>
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                  style={{ background: on ? "#fff" : "transparent", border: `2.5px solid ${on ? INK : "rgba(255,255,255,0.5)"}` }}
                  aria-hidden
                >
                  {on && <Check size={14} strokeWidth={3.5} color={INK} />}
                </span>
              </button>
            );
          })}
        </div>

        <SectionTitle>Combien de questions&nbsp;?</SectionTitle>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {[6, 10, 16, 20].map((n) => {
            const on = rounds === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => { playSfx("select", { volume: 0.5 }); setRounds(n); }}
                className="min-h-[54px] rounded-[18px] text-[22px] transition-transform active:translate-y-[3px]"
                style={{ ...DISPLAY, ...sticker(on ? "#FFD23F" : "#2E1F6B", on ? 4 : 3), color: on ? INK : "#fff", transform: on ? "rotate(-2deg)" : undefined }}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex justify-center">
          <IdeaButton game="Tu me connais ?" kind="idée de question" bg="#fff" />
        </div>
      </Screen>
    );
  }

  // ── Passer le tél ──
  if (phase === "pass-answer" || phase === "pass-guess") {
    const to = phase === "pass-answer" ? answerer : guesser;
    const bg = bodyOf(to);
    return (
      <Screen
        center
        footer={
          <BigBtn bg="#fff" onClick={() => { playSfx("whoosh", { volume: 0.5 }); setPhase(phase === "pass-answer" ? "answer" : "guess"); }}>
            {phase === "pass-answer" ? "C'est moi, je réponds" : "C'est moi, je devine"}
          </BigBtn>
        }
      >
        <QuestionChip round={round} total={deck.length} />
        <p className="mt-6 text-[18px] font-semibold text-white/85">Passe le tél à…</p>
        <div className="relative z-[1] -mb-6 mt-2">
          <Mascot size={124} color={colorForIndex(to)} mood="wink" arms shadow={false} />
        </div>
        <h1
          className="max-w-full rounded-[24px] px-6 pb-3 pt-7 text-center"
          style={{ ...sticker(bg, 6), ...DISPLAY, color: inkOn(bg), fontSize: names[to].length > 10 ? "clamp(26px, 8vw, 38px)" : "clamp(36px, 11vw, 54px)", lineHeight: 1, transform: "rotate(-2deg)", overflowWrap: "anywhere" }}
        >
          {names[to]}
        </h1>
        <p className="mt-5 max-w-sm text-center text-[16px] font-semibold leading-snug text-white/85">
          {phase === "pass-answer"
            ? <>Réponds sur toi, sans montrer l&apos;écran. <Who i={guesser}>{names[guesser]}</Who> devra deviner.</>
            : <>Devine ce que <Who i={answerer}>{names[answerer]}</Who> a répondu sur soi.</>}
        </p>
      </Screen>
    );
  }

  // ── Celui qui répond / celui qui devine ──
  if ((phase === "answer" || phase === "guess") && q) {
    const answering = phase === "answer";
    return (
      <Screen
        footer={answering && fresh.length > 0 ? (
          <div className="flex justify-center pb-1">
            <RerollButton onClick={reroll} label="Pas fou ? Une autre" />
          </div>
        ) : undefined}
      >
        <div className="flex justify-center"><QuestionChip round={round} total={deck.length} /></div>
        <h2 className="mt-5 text-center" style={{ ...DISPLAY, fontSize: "clamp(30px, 9vw, 40px)", lineHeight: 1.02 }}>
          {answering
            ? <><Who i={answerer}>{names[answerer]}</Who>, toi tu es plutôt…</>
            : <><Who i={answerer}>{names[answerer]}</Who> est plutôt…</>}
        </h2>
        <p className="mt-2 text-center text-[16px] font-semibold text-white/80">
          {answering ? "Réponds honnêtement, et ne montre pas !" : <>À ton avis, qu&apos;a répondu <Who i={answerer}>{names[answerer]}</Who>&nbsp;?</>}
        </p>
        <StickerChoice key={`${round}-${q.a}`} a={q.a} b={q.b} onPick={answering ? onAnswer : onGuess} />
      </Screen>
    );
  }

  // ── Révélation ──
  if (phase === "reveal" && q) {
    const correct = guess === truth;
    const truthText = truth === "a" ? q.a : q.b;
    const guessText = guess === "a" ? q.a : q.b;
    const last = round + 1 >= deck.length;
    return (
      <Screen
        center
        footer={<BigBtn bg="#FFD23F" onClick={nextRound}>{last ? "Voir le résultat" : "Question suivante"}</BigBtn>}
      >
        <div className="flex items-end justify-center gap-1">
          <Mascot size={78} color={colorForIndex(0)} mood={correct ? "love" : "shocked"} shadow={false} />
          <Mascot size={78} color={colorForIndex(1)} mood={correct ? "kiss" : "sad"} shadow={false} delay={0.3} />
        </div>
        <h1 className="mt-2 text-center" style={{ ...DISPLAY, fontSize: "clamp(40px, 12vw, 56px)", lineHeight: 0.95, color: correct ? "#3DDC97" : "#FF6B5B" }}>
          {correct ? "Dans le mille !" : "Raté !"}
        </h1>
        <div className="mt-5 grid w-full gap-3">
          <div className="rounded-[22px] px-4 py-3 text-center" style={{ ...sticker("#FFF6E5", 4), color: INK, transform: "rotate(-1.5deg)" }}>
            <p className="text-[15px] font-semibold" style={{ color: "#4A3A66" }}>{names[answerer]} est plutôt</p>
            <p className="mt-0.5" style={{ ...DISPLAY, fontSize: 26, lineHeight: 1.05, overflowWrap: "anywhere" }}>{truthText}</p>
          </div>
          <div className="rounded-[22px] px-4 py-3 text-center" style={{ ...sticker(correct ? "#3DDC97" : "#FF6B5B", 4), color: INK, transform: "rotate(1.5deg)" }}>
            <p className="text-[15px] font-semibold">{names[guesser]} avait deviné</p>
            <p className="mt-0.5" style={{ ...DISPLAY, fontSize: 26, lineHeight: 1.05, overflowWrap: "anywhere" }}>{guessText}</p>
          </div>
        </div>
        {!correct && (
          <p className="mt-4 text-center text-[16px] font-semibold text-white/85">
            <GameInlineIcon icon={MessageCircle} /> {names[answerer]}, explique-toi&nbsp;!
          </p>
        )}
        <div className={`mt-5 grid w-full gap-3 ${longDuo ? "grid-cols-1" : "grid-cols-2"}`}>
          <DuoScore name={names[0]} score={scores[0]} idx={0} />
          <DuoScore name={names[1]} score={scores[1]} idx={1} />
        </div>
      </Screen>
    );
  }

  // ── Fin ──
  if (phase === "over") {
    const total = scores[0] + scores[1];
    const pct = deck.length ? Math.round((total / deck.length) * 100) : 0;
    const verdict = verdictFor(pct);
    return (
      <Screen
        footer={
          <>
            <BigBtn bg={PINK} onClick={begin}><RotateCcw size={22} strokeWidth={3} aria-hidden /> Rejouer</BigBtn>
            <div className="mt-1 flex justify-center gap-2">
              <SubBtn onClick={() => setPhase("config")}>Changer les thèmes</SubBtn>
              {onReturnToLobby && <SubBtn onClick={onReturnToLobby}>Quitter</SubBtn>}
            </div>
          </>
        }
      >
        {pct >= 65 && <ConfettiBurst count={60} />}
        <div className="flex flex-col items-center">
          <p className="text-[18px] font-semibold text-white/85">Votre taux de complicité</p>
          <div className="mt-3 flex items-end justify-center gap-1">
            <Mascot size={60} color={colorForIndex(0)} mood={pct >= 45 ? "love" : "sad"} shadow={false} />
            <div
              className="rounded-[26px] px-6 pb-2 pt-3"
              style={{ ...sticker(verdict.c, 6), ...DISPLAY, color: INK, fontSize: "clamp(46px, 14vw, 64px)", lineHeight: 1, transform: "rotate(-3deg)", whiteSpace: "nowrap" }}
            >
              {pct}&nbsp;%
            </div>
            <Mascot size={60} color={colorForIndex(1)} mood={pct >= 45 ? "kiss" : "sad"} shadow={false} delay={0.3} />
          </div>
          <h1 className="mt-5 text-center" style={{ ...DISPLAY, fontSize: 34, lineHeight: 1 }}>{verdict.t}</h1>
          <p className="mt-2 text-[16px] font-semibold text-white/80">
            {total} bonne{total > 1 ? "s" : ""} réponse{total > 1 ? "s" : ""} sur {deck.length}
          </p>
          <div className={`mt-5 grid w-full gap-3 ${longDuo ? "grid-cols-1" : "grid-cols-2"}`}>
            <DuoScore name={names[0]} score={scores[0]} idx={0} big />
            <DuoScore name={names[1]} score={scores[1]} idx={1} big />
          </div>
          <div className="mt-7">
            <IdeaButton game="Tu me connais ?" kind="idée de question" bg="#fff" />
          </div>
        </div>
      </Screen>
    );
  }

  return null;
}

function QuestionChip({ round, total }: { round: number; total: number }) {
  return (
    <span className="inline-flex min-h-9 items-center rounded-full px-3.5 text-[15px] font-bold" style={{ ...sticker("#fff", 3), color: INK, transform: "rotate(-2deg)" }}>
      Question {round + 1} sur {total}
    </span>
  );
}

/** Deux grosses cartes « plutôt A ou B ». */
function StickerChoice({ a, b, onPick }: { a: string; b: string; onPick: (p: "a" | "b") => void }) {
  return (
    <div className="mt-6 flex w-full flex-col items-center">
      {(["a", "b"] as const).map((side, i) => (
        <div key={side} className="contents">
          {i === 1 && (
            <span className="z-[1] -my-3 grid h-12 w-12 place-items-center rounded-full text-[20px]" style={{ ...sticker("#fff", 3), ...DISPLAY, color: INK }}>
              ou
            </span>
          )}
          <button
            type="button"
            data-choice={side}
            onClick={() => onPick(side)}
            className="w-full rounded-[26px] px-5 py-6 text-center transition-transform active:translate-y-[4px]"
            style={{ ...sticker(i ? "#4ECDC4" : "#FFD23F", 6), ...DISPLAY, color: INK, fontSize: "clamp(24px, 7.5vw, 32px)", lineHeight: 1.05, minHeight: 116, transform: `rotate(${i ? 1.5 : -1.5}deg)`, overflowWrap: "anywhere" }}
          >
            {side === "a" ? a : b}
          </button>
        </div>
      ))}
    </div>
  );
}

function DuoScore({ name, score, idx, big }: { name: string; score: number; idx: number; big?: boolean }) {
  const bg = bodyOf(idx);
  return (
    <div
      className="flex min-w-0 items-center gap-2.5 rounded-[18px] py-2 pl-2 pr-3"
      style={{ ...sticker(bg, 4), color: inkOn(bg), transform: `rotate(${idx ? 2 : -2}deg)` }}
    >
      <span className="grid shrink-0 place-items-center rounded-[12px]" style={{ ...sticker("#fff", 2), ...DISPLAY, color: INK, width: big ? 46 : 38, height: big ? 46 : 38, fontSize: big ? 26 : 21 }}>
        {score}
      </span>
      <span className="min-w-0 text-[15px] font-bold leading-tight" style={{ overflowWrap: "break-word" }}>{name}</span>
    </div>
  );
}

function Choice({ a, b, onPick }: { a: string; b: string; onPick: (p: "a" | "b") => void }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {(["a", "b"] as const).map((side) => (
        <button key={side} onClick={() => onPick(side)}
          className="rounded-3xl border p-5 text-center text-lg font-semibold transition active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)", minHeight: 76, overflowWrap: "anywhere" }}>
          {side === "a" ? a : b}
        </button>
      ))}
    </div>
  );
}

function ScorePill({ name, score, idx, big }: { name: string; score: number; idx: number; big?: boolean }) {
  const c = colorForIndex(idx);
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center rounded-full font-extrabold"
        style={{ width: big ? 64 : 44, height: big ? 64 : 44, background: `${c}33`, border: `2px solid ${c}`, fontSize: big ? 26 : 18 }}>{score}</div>
      <div className="mt-1 text-xs font-semibold">{name}</div>
    </div>
  );
}

/* ════════════════ MODE EN LIGNE (2 téléphones à distance) ════════════════ */
interface OnlineState {
  started: boolean;
  phase: "lobby" | "answer" | "guess" | "reveal" | "over";
  round: number;
  total: number;
  players: { id: string; name: string }[];
  answererId: string | null;
  guesserId: string | null;
  question: { a: string; b: string } | null;
  truth: "a" | "b" | null;
  guess: "a" | "b" | null;
  scores: Record<string, number>;
}

function Waiting({ title, sub }: { title: string; sub?: string }) {
  return (
    <LocalShell accent={ACCENT} center>
      <Hourglass size={48} strokeWidth={2.4} color={ACCENT} className="mb-3" aria-hidden />
      <h2 className="cb-display-md text-center">{title}</h2>
      {sub && <p className="mt-2 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>{sub}</p>}
    </LocalShell>
  );
}

function CoupleQuizOnline({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "couple-quiz", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as OnlineState | null;

  // salon d'attente
  if (!state || !state.started) {
    const here = state?.players?.length ?? 0;
    return (
      <LocalShell accent={ACCENT} center>
        <div className="mb-3"><Mascot size={84} color="pink" mood="love" arms shadow={false} /></div>
        <h1 className="cb-display-lg text-center sm:text-5xl">Tu me connais ?</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>En ligne · <b style={{ color: "#fff" }}>{here}/2</b> joueurs connectés</p>
        <p className="mt-4 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Ton/ta partenaire doit rejoindre <b style={{ color: "#fff" }}>la même salle</b> (code <b style={{ color: ACCENT }}>{roomCode}</b>) et choisir « Plusieurs téléphones ». Le jeu démarre dès que vous êtes 2.
        </p>
        <button onClick={onReturnToLobby} className="mt-7 text-sm" style={{ color: "var(--text-muted)" }}><GameInlineIcon icon={ArrowLeft} /> Quitter</button>
      </LocalShell>
    );
  }

  const players = state.players ?? [];
  const me = players.find((p) => p.id === playerId);
  const answererName = players.find((p) => p.id === state.answererId)?.name ?? "?";
  const guesserName = players.find((p) => p.id === state.guesserId)?.name ?? "?";
  const amAnswerer = state.answererId === playerId;
  const amGuesser = state.guesserId === playerId;
  const q = state.question;

  if (!me) return <Waiting title="Partie en cours" sub="« Tu me connais ? » se joue à 2. Les deux places sont prises." />;

  // fin
  if (state.phase === "over") {
    const s0 = state.scores[players[0]?.id] ?? 0;
    const s1 = state.scores[players[1]?.id] ?? 0;
    const total = s0 + s1;
    const pct = state.total ? Math.round((total / state.total) * 100) : 0;
    const v = verdictFor(pct);
    return (
      <LocalShell accent={ACCENT} center>
        <div className="af-eyebrow" style={{ color: "var(--text-dim)" }}>Taux de complicité</div>
        <div className="my-1 text-7xl font-extrabold" style={{ color: v.c }}>{pct}%</div>
        <h1 className="cb-display-md text-center" style={{ color: v.c }}>{v.t}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{total} bonnes devinettes sur {state.total}</p>
        <div className="mt-5 flex gap-5">
          <ScorePill name={players[0]?.name ?? "J1"} score={s0} idx={0} big />
          <ScorePill name={players[1]?.name ?? "J2"} score={s1} idx={1} big />
        </div>
        <div className="mt-7 flex w-full max-w-xs flex-col gap-2">
          <button onClick={() => sendAction({ action: "restart" })} className="af-btn af-btn-primary" style={{ fontSize: 16 }}>Rejouer</button>
          <button onClick={onReturnToLobby} className="text-sm" style={{ color: "var(--text-muted)" }}>Quitter</button>
        </div>
      </LocalShell>
    );
  }

  // phase réponse
  if (state.phase === "answer") {
    if (amAnswerer && q) {
      return (
        <LocalShell accent={ACCENT} center>
          <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Manche {state.round + 1}/{state.total} · à toi</div>
          <h2 className="cb-display-sm mb-1 text-center sm:cb-display-md">Toi, tu es plutôt…</h2>
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>Réponds honnêtement — {guesserName} va deviner.</p>
          <Choice a={q.a} b={q.b} onPick={(p) => sendAction({ action: "answer", pick: p })} />
        </LocalShell>
      );
    }
    return <Waiting title={`${answererName} répond…`} sub="Patiente, ce sera bientôt à toi de deviner." />;
  }

  // phase devinette
  if (state.phase === "guess") {
    if (amGuesser && q) {
      return (
        <LocalShell accent={ACCENT} center>
          <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Manche {state.round + 1}/{state.total} · devine</div>
          <h2 className="cb-display-sm mb-1 text-center sm:cb-display-md">{answererName} est plutôt…</h2>
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>À ton avis, qu&apos;a répondu {answererName} ?</p>
          <Choice a={q.a} b={q.b} onPick={(p) => sendAction({ action: "guess", pick: p })} />
        </LocalShell>
      );
    }
    return <Waiting title={`${guesserName} devine…`} sub={`${guesserName} essaie de retrouver ta réponse.`} />;
  }

  // révélation
  if (state.phase === "reveal" && q) {
    const correct = state.guess === state.truth;
    const truthText = state.truth === "a" ? q.a : q.b;
    const guessText = state.guess === "a" ? q.a : q.b;
    const s0 = state.scores[players[0]?.id] ?? 0;
    const s1 = state.scores[players[1]?.id] ?? 0;
    return (
      <LocalShell accent={ACCENT} center>
        <div className="text-6xl mb-2">{correct ? "💞" : "💔"}</div>
        <h1 className="cb-display-md text-center" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{correct ? "Dans le mille !" : "Raté !"}</h1>
        <div className="mt-5 w-full max-w-sm space-y-2">
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: `${ACCENT}66`, background: `${ACCENT}18` }}>
            <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{answererName} est plutôt</div>
            <div className="text-lg font-bold">{truthText}</div>
          </div>
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: "var(--line-soft)" }}>
            <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{guesserName} avait deviné</div>
            <div className="text-lg font-bold" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{guessText}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-center">
          <ScorePill name={players[0]?.name ?? "J1"} score={s0} idx={0} />
          <ScorePill name={players[1]?.name ?? "J2"} score={s1} idx={1} />
        </div>
        <button onClick={() => sendAction({ action: "next" })} className="af-btn af-btn-primary mt-6 w-full max-w-xs" style={{ fontSize: 16 }}>
          {state.round + 1 >= state.total ? "Voir le résultat →" : "Manche suivante →"}
        </button>
      </LocalShell>
    );
  }

  return <Waiting title="Connexion…" />;
}
