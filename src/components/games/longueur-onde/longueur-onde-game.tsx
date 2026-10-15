"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";
import {
  ModeSelect, PlayersSetup, PassScreen, type GameMode,
  DISPLAY, ZButton, ZCard, ZChip, ZLink, ZRanking, ZScreen, ZTitle, useScrollTopOn,
} from "@/components/games/local-kit";
import { SynthwaveScreen, NeonConsole, CassetteInput, SpectrumPair, WAVE_COLOR } from "@/components/games/longueur-onde/synthwave";
import { CursorGauge } from "@/components/games/longueur-onde/gauge";
import { CURSOR_PAIRS, buildDeck, categoryLabel, cursorPoints, exampleFor, type CursorPair } from "@/components/games/longueur-onde/pairs";
import { Lock, Pencil } from "lucide-react";
import { GameInlineIcon, GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { getLang, pick, useT } from "@/lib/i18n";
import { STR } from "@/components/games/longueur-onde/i18n";
import { uniqueMin, useGameFinished, winnersOf } from "@/lib/game-finished";
import { WIN_STR } from "@/lib/winners-text";
import { ShareResultButton } from "@/components/games/share-result-button";
import { rankingCard } from "@/lib/share-cards";
import { GameRulesSheet, GameTuto, RulesIconButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { useCurseurTuto } from "@/components/games/longueur-onde/tuto";
import { SoireeNextButton } from "@/components/games/soiree-next";
import { EndHomeLink, EndPill, EndPills, EndReplay } from "@/components/games/end-actions";

// Un indice sans aucune lettre (ex. « 73 ») donnerait directement la cible
function clueProblem(clue: string): string | null {
  const c = clue.trim();
  if (!c) return null;
  if (!/\p{L}/u.test(c)) return pick(STR).noDigits;
  return null;
}
/** Cible tirée au sort, jamais collée aux bords (la part entière reste visible). */
const randomTarget = () => 10 + Math.floor(Math.random() * 81);

// ── WRAPPER : le joueur choisit local ou online ───────────
export default function LongueurOndeGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const t = useT(STR);
  if (mode === null) {
    return (
      <ModeSelect emoji="📡" name={t.name}
        tagline={t.tagline}
        onPick={setMode} />
    );
  }
  if (mode === "local") return <LongueurOndeLocal onReturnToLobby={props.onReturnToLobby} />;
  return <LongueurOndeOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (un seul téléphone, Devin tournant)
// ══════════════════════════════════════════════════════════

/** Pastille numérotée des étapes / vignettes. */
function StepNum({ n, bg = GAME_INK }: { n: number; bg?: string }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[17px]"
      style={{ ...DISPLAY, background: bg, color: bg === GAME_INK ? "#FFD23F" : GAME_INK, border: `2.5px solid ${GAME_INK}` }}>
      {n}
    </span>
  );
}

/** Étape du Devin : pastille + phrase courte (+ contenu en dessous). */
function Step({ n, bg, tilt = 0, title, children }: { n: number; bg: string; tilt?: number; title: ReactNode; children?: ReactNode }) {
  return (
    <ZCard bg={bg} tilt={tilt} shadow={4} radius={22} className="px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <StepNum n={n} />
        <p className="text-[17px] font-extrabold leading-tight">{title}</p>
      </div>
      {children}
    </ZCard>
  );
}

/** Sticker de la catégorie de la manche (« Une destination »), en gros au-dessus du cadran. */
function CategorySticker({ pair, small = false, className }: { pair: CursorPair; small?: boolean; className?: string }) {
  const label = categoryLabel(pair);
  if (!label) return null;
  const n = label.length;
  const fs = small ? 12.5 : n <= 12 ? 27 : n <= 18 ? 23 : n <= 26 ? 20 : 18;
  return (
    <div className={`flex justify-center ${className ?? ""}`}>
      <span className="max-w-full rounded-[16px] text-center"
        style={{
          ...DISPLAY, fontSize: fs, lineHeight: 1.05, textWrap: "balance", whiteSpace: small ? "nowrap" : undefined,
          background: GAME_INK, color: "#FFD23F", border: `${small ? 2 : 3}px solid ${GAME_INK}`,
          boxShadow: `0 ${small ? 2 : 4}px 0 #FF3EA5`, rotate: "-1.5deg",
          padding: small ? "3px 8px" : "6px 14px",
        }}>
        {label}
      </span>
    </div>
  );
}

/** « Trouve UNE destination qui se place là » (ou « UN truc » pour une paire simple). */
function findTitle(pair: CursorPair, t: (typeof STR)["fr"]): ReactNode {
  if (!pair.category) return t.findThing;
  return t.findCat(pair.art ?? "un", pair.category);
}

/** Mode local : tuto 1re fois (dès l'ouverture, avant les joueurs) + feuille de règles par-dessus la partie. */
function LongueurOndeLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  const t = useT(STR);
  const tuto = useFirstTimeTuto("longueur-onde", { atMount: true });
  const content = useCurseurTuto();
  const [rulesOpen, setRulesOpen] = useState(false);
  return (
    <>
      <LocalGame onReturnToLobby={onReturnToLobby} onTuto={tuto.show}
        rulesBtn={<RulesIconButton onClick={() => setRulesOpen(true)} />} />
      {rulesOpen && <GameRulesSheet name={t.name} rules={content.rules} onClose={() => setRulesOpen(false)} onTuto={tuto.show} />}
      {tuto.open && <GameTuto slides={content.slides} onDone={tuto.close} />}
    </>
  );
}

function LocalGame({ onReturnToLobby, onTuto, rulesBtn }: { onReturnToLobby?: () => void; onTuto: () => void; rulesBtn: ReactNode }) {
  const t = useT(STR);
  type Phase = "setup" | "pass" | "clue" | "guess" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  // fin de partie → demande de note éventuelle + stats de la bande (app)
  useGameFinished(phase === "over", { loser: uniqueMin(players, scores), scores: { names: players, values: scores } });
  const [round, setRound] = useState(0);
  const [psychic, setPsychic] = useState(0);
  const [pairs, setPairs] = useState<CursorPair[]>(() => buildDeck(getLang()));
  const [target, setTarget] = useState(50);
  const [clue, setClue] = useState("");
  const [guess, setGuess] = useState(50);
  const [writing, setWriting] = useState(false);
  const [clueInput, setClueInput] = useKeyedState<string>(`${round}-localclue`, "");
  const [shown, setShown] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    preloadSfx(["whoosh", "gong", "confirm", "tick", "tock", "win", "ding", "success", "wrong", "lose", "coins", "card-flip", "pop"]);
    return () => { if (revealTimer.current) clearTimeout(revealTimer.current); };
  }, []);
  useScrollTopOn(`${phase}-${round}`);

  const total = players.length;
  const pair = pairs[(round - 1 + pairs.length) % pairs.length] ?? CURSOR_PAIRS[0];
  const pts = cursorPoints(guess - target);

  const startRound = (r: number, p: number) => {
    setRound(r); setPsychic(p);
    setTarget(randomTarget()); setClue(""); setWriting(false); setShown(false); setPhase("pass");
  };
  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    // Langue figée au début de la partie
    setPairs(buildDeck(getLang()));
    startRound(1, 0);
  };
  // « Une autre paire » : la paire est retirée → une paire jamais vue prend sa place
  const rerollPair = () => {
    if (pairs.length <= total + 1) return;
    const at = (round - 1) % pairs.length;
    playSfx("card-flip", { volume: 0.6, delay: 0.1 });
    setPairs((sp) => sp.filter((_, i) => i !== at));
    setTarget(randomTarget());
  };

  if (phase === "setup") {
    return <PlayersSetup emoji="📡" name={t.name} min={2} max={8} accent={WAVE_COLOR} onStart={begin} onBack={onReturnToLobby}
      footer={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <IdeaButton game="Le Curseur" kind="paire" />
          <ZLink onClick={onTuto} className="!mx-0">{t.reviewExample}</ZLink>
        </div>
      } />;
  }

  if (phase === "pass") {
    return <PassScreen toName={players[psychic]} colorIndex={psychic} accent={WAVE_COLOR}
      hint={t.passHint}
      onReady={() => { playCombo("reveal"); setPhase("clue"); }} />;
  }

  if (phase === "clue") {
    const name = players[psychic];
    const err = clueProblem(clueInput);
    const go = () => {
      if (err) return;
      playSfx("whoosh", { volume: 0.6 });
      setClue(writing ? clueInput.trim() : ""); setGuess(50); setPhase("guess");
    };
    return (
      <ZScreen bg={WAVE_COLOR} tools={rulesBtn}>
        <div className="flex items-center justify-between gap-2">
          <ZChip bg="#fff" tilt={-2}>{t.round(round, total)}</ZChip>
          <RerollButton label={t.otherPair} onClick={rerollPair} className="shrink-0" />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Step n={1} bg="#fff" title={<>{t.lookTarget(name)}<span style={{ color: "#E0218A" }}>{t.hideScreen}</span></>}>
            <CategorySticker pair={pair} className="mt-3" />
            <CursorGauge left={pair.left} right={pair.right} target={target} className={`mx-auto max-w-[300px] ${pair.category ? "mt-3" : "mt-2"}`} />
          </Step>

          <Step n={2} bg="#FFD23F" tilt={-0.8} title={findTitle(pair, t)}>
            <p className="mt-1.5 pl-[42px] text-[15px] font-semibold leading-tight">{t.exPrefix}<span className="text-[21px]" style={DISPLAY}>{exampleFor(pair, target)}</span>
              <span className="text-[13px]" style={{ color: "#4A3A66" }}>{t.orYours}</span></p>
          </Step>

          <Step n={3} bg="#3DDC97" tilt={0.8} title={t.sayItPass} />
        </div>

        {writing && (
          <div className="mt-4">
            <ZCard bg="#fff" shadow={4} radius={20} className="px-4 pb-2.5 pt-2">
              <label className="text-[14px] font-bold" htmlFor="cur-clue">{t.yourClueLabel}</label>
              <input id="cur-clue" value={clueInput} onChange={(e) => setClueInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()}
                autoFocus maxLength={40} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="done"
                placeholder={exampleFor(pair, target)}
                className="mt-0.5 w-full bg-transparent outline-none placeholder:text-[#15082E]/35"
                style={{ ...DISPLAY, fontSize: 22, color: GAME_INK }} />
            </ZCard>
            {err && <p role="alert" className="mt-2 text-center text-[15px] font-bold">{err}</p>}
          </div>
        )}

        {!writing && (
          <ZLink color={GAME_INK} className="mt-2" onClick={() => setWriting(true)}>
            <Pencil size={15} strokeWidth={3} aria-hidden /> {t.writeClue}
          </ZLink>
        )}
        <div className="min-h-2 flex-1" />
        <ZButton bg={GAME_INK} className="mt-3 flex-col !gap-0 py-2" onClick={go} disabled={!!err}>
          <span>{t.gaveClue}</span>
          <span className="text-[15px]" style={{ fontFamily: "inherit", opacity: 0.85 }}>{t.othersPlay}</span>
        </ZButton>
      </ZScreen>
    );
  }

  if (phase === "guess") {
    const name = players[psychic];
    return (
      <ZScreen bg={WAVE_COLOR} tools={rulesBtn}>
        <ZTitle size={32}>{t.yourTurn}</ZTitle>

        <ZCard bg="#FFD23F" tilt={-1.5} shadow={5} radius={22} className="mt-3 flex items-center gap-3 px-4 py-2.5">
          <PlayerBlob name={name} colorIndex={psychic} size={44} mood="wink" bob={false} />
          {clue ? (
            <div className="min-w-0">
              <p className="text-[15px] font-bold">{t.clueOf(name)}</p>
              <p className="break-words text-[28px] leading-none" style={DISPLAY}>{clue}</p>
            </div>
          ) : (
            <p className="text-[16px] font-bold leading-snug">{t.saidAloud(name)}</p>
          )}
        </ZCard>

        <p className="mt-4 text-[16px] font-extrabold leading-snug">{t.dragHint}</p>
        <CategorySticker pair={pair} className="mt-3" />
        <CursorGauge left={pair.left} right={pair.right} needle={guess} onChange={setGuess} className="mx-auto mt-3 max-w-[340px]" />
        <p className="mt-3 text-[14px] font-semibold leading-snug" style={{ color: "#2A1A55" }}>
          {t.oneCursor(name)}
        </p>

        <div className="min-h-2 flex-1" />
        <ZButton bg={GAME_INK} className="mt-3" onClick={() => {
          const p = cursorPoints(guess - target);
          playCombo("drumroll");
          if (p >= 4) { playSfx("win", { volume: 0.9, delay: 1.05 }); playSfx("coins", { volume: 0.7, delay: 1.3 }); }
          else if (p > 0) { playSfx("success", { volume: 0.8, delay: 1.05 }); playSfx("coin", { volume: 0.6, delay: 1.25 }); }
          else { playSfx("wrong", { volume: 0.8, delay: 1.05 }); playSfx("lose", { volume: 0.5, delay: 1.12 }); }
          setShown(false); setPhase("reveal");
          if (revealTimer.current) clearTimeout(revealTimer.current);
          revealTimer.current = setTimeout(() => setShown(true), 1050);
        }}>
          {t.validate}
        </ZButton>
      </ZScreen>
    );
  }

  if (phase === "reveal") {
    const name = players[psychic];
    const bull = pts >= 4;
    const verdict = !shown ? t.verdictWait : bull ? t.bull : pts === 3 ? t.close : pts === 2 ? t.notFar : t.missed;
    const next = (psychic + 1) % total;
    return (
      <ZScreen bg={shown && bull ? "#3DDC97" : WAVE_COLOR} tools={rulesBtn}>
        {shown && bull && <ConfettiBurst count={40} />}
        <ZChip bg="#fff" tilt={-2}>{t.round(round, total)}</ZChip>
        <ZTitle size={38} className="mt-3">{verdict}</ZTitle>
        {clue && <p className="mt-1 text-[16px] font-bold">{t.clueQuote(name, clue)}</p>}

        <CategorySticker pair={pair} className="mt-4" />
        <CursorGauge left={pair.left} right={pair.right} target={shown ? target : null} needle={guess} reveal className={pair.category ? "mt-3" : "mt-5"} />

        <div className="mt-5 flex min-h-[92px] items-center justify-center">
          {shown && (
            <ZCard bg={pts > 0 ? "#FF3EA5" : "#fff"} tilt={-2} shadow={6} radius={24} className="flex items-center gap-3 px-5 py-3"
              style={{ animation: "cur-pop .45s cubic-bezier(.2,1.6,.4,1) both" }}>
              <PlayerBlob name={players[psychic]} colorIndex={psychic} size={52} mood={bull ? "laughing" : pts ? "happy" : "sad"} bob={false} />
              <div>
                <p className="text-[44px] leading-none" style={DISPLAY}>{pts > 0 ? `+${pts}` : t.zeroPoint}</p>
                <p className="text-[15px] font-bold">{pts > 0 ? t.pointsFor(name) : t.tooBad}</p>
              </div>
            </ZCard>
          )}
        </div>

        <div className="min-h-6 flex-1" />
        {shown && (
          <ZButton bg={GAME_INK} className="mt-4" onClick={() => {
            const ns = [...scores]; ns[psychic] += pts; setScores(ns);
            if (round >= total) { playCombo("fanfare"); setPhase("over"); } else startRound(round + 1, next);
          }}>
            {round >= total ? t.seeScores : t.nextPsychic(players[next])}
          </ZButton>
        )}
        <style>{`@keyframes cur-pop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}`}</style>
      </ZScreen>
    );
  }

  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], colorIndex: i })).sort((a, b) => b.score - a.score);
  // Couronnés = règle unique (la même que la Soirée) : ex æquo en tête = tous, toute la table = personne
  const winners = winnersOf({ names: players, values: scores });
  const wt = pick(WIN_STR);
  return (
    <ZScreen bg={WAVE_COLOR} tools={rulesBtn}>
      <ConfettiBurst count={50} />
      <ZTitle size={wt.names(winners).length > 9 ? 32 : 40} className="text-center">
        {/* prénom composé jamais coupé au trait d'union */}
        {winners.length ? <><span className="whitespace-nowrap">{wt.names(winners)},</span>{t.bestPsychic}</> : wt.allTied}
      </ZTitle>
      <p className="mt-2 text-center text-[15px] font-bold" style={{ textWrap: "balance" }}>{t.scoreNote}</p>
      <div className="mt-6"><ZRanking rows={ranking} winners={winners} /></div>
      <div className="min-h-8 flex-1" />
      {/* Une seule action principale (Jeu suivant en Soirée, sinon Rejouer), le reste en pastilles */}
      <div className="mt-6 flex flex-col gap-3">
        <SoireeNextButton />
        <EndReplay onClick={() => begin(players)} label={t.playAgain}>
          <ZButton bg={GAME_INK} onClick={() => begin(players)}>{t.playAgain}</ZButton>
        </EndReplay>
        <EndPills className="mt-1">
          <ShareResultButton short card={() => rankingCard("longueur-onde", ranking)} />
          <IdeaButton short game="Le Curseur" kind="paire" bg="#fff" />
          <EndPill onClick={() => setPhase("setup")}>{t.changePlayers}</EndPill>
        </EndPills>
        <EndHomeLink onClick={onReturnToLobby} color={GAME_INK}>{t.backHome}</EndHomeLink>
      </div>
    </ZScreen>
  );
}

const BAND_WIDE = 22;
const BAND_MID  = 12;
const BAND_TIGHT = 5;

interface WavePlayerState {
  id: string;
  name: string;
  score: number;
  isPsychic: boolean;
  hasGuessed: boolean;
  present?: boolean;
}

interface Spectrum { left: string; right: string; }

interface WaveState {
  phase: "waiting" | "intro" | "clue" | "guessing" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  timeLeft: number;
  psychicId: string | null;
  psychicName: string | null;
  spectrum: Spectrum | null;
  clue: string | null;
  target: number | null;
  guesses: Record<string, number> | null;
  roundPoints: Record<string, number> | null;
  players: WavePlayerState[];
  amPsychic: boolean;
  myGuess: number | null;
  myTarget: number | null;
  isSpectator?: boolean;
  clueError?: string | null;
}

const COLORS: MascotColor[] = ["purple", "pink", "yellow", "mint", "sky", "coral", "lavender"];
function colorFor(id: string): MascotColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

function LongueurOndeOnline({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "longueur-onde", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as WaveState;

  const clueKey = `${state?.round ?? 0}-clue`;
  const [clueInput, setClueInput] = useKeyedState<string>(clueKey, "");

  const submitClue = useCallback(() => {
    const t = clueInput.trim();
    if (!t || clueProblem(t)) return;
    sendAction({ action: "submit-clue", clue: t });
  }, [clueInput, sendAction]);

  const nameOf = useCallback((id: string) => state?.players?.find((p) => p.id === id)?.name ?? "?", [state?.players]);

  if (!state || state.phase === "waiting") {
    return <Centered emoji="📡" text="Calibrage des ondes..." />;
  }

  // ── INTRO ───────────────────────────────────────────────
  if (state.phase === "intro") {
    const psychicColor: MascotColor = state.psychicId ? colorFor(state.psychicId) : "purple";
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),24px)]">
        <Sparkles count={10} />
        <p className="af-eyebrow mb-6">Manche {state.round} / {state.totalRounds}</p>
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>Le Devin de ce tour est</p>
        <Mascot size={120} color={psychicColor} mood="wink" arms crown delay={0} />
        <h2 className="cb-display-xl mt-4" style={{ letterSpacing: -1.5, fontSize: "clamp(2rem, 7vw, 3.5rem)", textShadow: "0 0 40px rgba(91,54,214,0.5)" }}>
          {state.psychicName}
          {state.amPsychic && <span style={{ color: "var(--text-dim)", fontSize: "0.5em" }}> (toi)</span>}
        </h2>
        <p className="mt-6 max-w-xs animate-pulse text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {state.isSpectator
            ? "👀 Arrivé(e) en cours de partie : tu regardes, tu joueras à la prochaine."
            : state.amPsychic
            ? "Tu vas voir une cible secrète et donner un indice"
            : "Tu devras deviner où le Devin vise sur le curseur"}
        </p>
      </div>
    );
  }

  // ── CLUE — psychic gives a clue (DA synthwave) ──────────
  if (state.phase === "clue") {
    if (state.amPsychic) {
      return (
        <SynthwaveScreen round={state.round} total={state.totalRounds} spectrum={state.spectrum}>
          <NeonConsole readout={`TARGET · ${state.timeLeft}s`}>
            <SpectrumDial spectrum={state.spectrum} target={state.myTarget} mode="psychic" />
            <p className="mt-1 text-center" style={{ fontFamily: "var(--font-mono-face)", fontSize: 12, color: "var(--af-yellow)", letterSpacing: 1 }}><GameInlineIcon icon={Lock} /> Toi seul vois la cible</p>
          </NeonConsole>
          <CassetteInput value={clueInput} onChange={setClueInput} placeholder="Ton indice (un mot, un exemple...)"
            error={clueProblem(clueInput)} onSubmit={submitClue} />
          <div className="pb-20" />
        </SynthwaveScreen>
      );
    }
    return <Centered emoji="🔮" text={`${state.psychicName} cherche un indice...`} />;
  }

  // ── GUESSING ────────────────────────────────────────────
  if (state.phase === "guessing") {
    if (state.amPsychic) {
      const guessed = state.players?.filter((p) => !p.isPsychic && p.hasGuessed).length ?? 0;
      const total = state.players?.filter((p) => !p.isPsychic && p.present !== false).length ?? 0;
      return (
        <div className="flex flex-1 flex-col items-center p-5 pt-[max(env(safe-area-inset-top),20px)]">
          <RoundHeader round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} role="🔮 Devin" />
          <ClueBadge clue={state.clue} authorName={state.psychicName} />
          <SpectrumDial spectrum={state.spectrum} target={state.myTarget} mode="psychic" />
          <Waiting text={`${guessed}/${total} ont placé leur curseur...`} />
        </div>
      );
    }
    if (state.isSpectator) {
      return (
        <div className="flex flex-1 flex-col items-center p-5 pt-[max(env(safe-area-inset-top),20px)]">
          <RoundHeader round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} role="👀 Spectateur" />
          <ClueBadge clue={state.clue} authorName={state.psychicName} />
          <SpectrumDial spectrum={state.spectrum} target={null} mode="psychic" />
          <Waiting text="Mode spectateur : tu es arrivé(e) en cours de partie, tu joueras à la prochaine." />
        </div>
      );
    }
    return (
      <GuessBoard
        key={`${state.round}-guess`}
        spectrum={state.spectrum}
        clue={state.clue}
        round={state.round}
        total={state.totalRounds}
        timeLeft={state.timeLeft}
        submitted={state.myGuess != null}
        onSubmit={(g) => sendAction({ action: "submit-guess", guess: g })}
        psychicName={state.psychicName}
      />
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const markers = Object.entries(state.guesses ?? {}).map(([id, val]) => ({
      value: val,
      label: nameOf(id),
      isMe: id === playerId,
      color: colorFor(id),
    }));
    const myPts = state.roundPoints?.[playerId] ?? 0;
    const bullseye = myPts >= 4;

    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto p-5 pt-[max(env(safe-area-inset-top),20px)]">
        {bullseye && <ConfettiBurst count={50} />}
        <Sparkles count={8} />

        <div className="relative z-10 w-full">
          <div className="text-center">
            <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>
              {bullseye ? "✦ Bullseye !" : "Révélation"}
            </p>
            <h2 className="cb-display-xl mt-2" style={{ letterSpacing: -1.5, lineHeight: 0.95, fontSize: "clamp(2rem, 6vw, 3rem)" }}>
              +<span style={{ color: "var(--af-yellow)" }}>{myPts}</span> pts
            </h2>
            {bullseye && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
                Vous êtes vraiment connectés.
              </p>
            )}
          </div>
          <ClueBadge clue={state.clue} authorName={state.psychicName} />
          <SpectrumDial spectrum={state.spectrum} target={state.target} markers={markers} mode="reveal" />
          <div className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3"
               style={{
                 background: "rgba(91,54,214,0.18)",
                 borderColor: "rgba(91,54,214,0.45)",
               }}>
            <span className="text-sm">{state.amPsychic ? "Ton indice rapporte" : "Tu marques"}</span>
            <span className="cb-display-md" style={{ color: "var(--af-yellow)", fontSize: 22 }}>+{myPts}</span>
          </div>
          <p className="mt-4 animate-pulse text-center text-xs" style={{ color: "var(--text-muted)" }}>Manche suivante…</p>
        </div>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),24px)]">
        <ConfettiBurst count={50} />
        <div className="relative z-10 w-full max-w-sm">
          <p className="af-eyebrow text-center" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
          <h2 className="cb-display-lg mt-2 text-center">Résultats</h2>
          <div className="mt-6 space-y-2.5">
            {sorted.map((p, i) => {
              const c = colorFor(p.id);
              return (
                <div key={p.id}
                     className="flex items-center justify-between rounded-3xl border p-4"
                     style={{
                       background: i === 0
                         ? `linear-gradient(120deg, ${MASCOT_PALETTE[c].body}30, rgba(255,255,255,0.04))`
                         : "rgba(255,255,255,0.04)",
                       borderColor: i === 0 ? `${MASCOT_PALETTE[c].body}55` : "rgba(255,255,255,0.10)",
                       boxShadow: i === 0 ? `0 0 25px ${MASCOT_PALETTE[c].body}33` : undefined,
                     }}>
                  <div className="flex items-center gap-3">
                    <span className="cb-mono w-8 text-xl font-bold" style={{ color: i === 0 ? MASCOT_PALETTE[c].body : "var(--text-muted)" }}>#{i + 1}</span>
                    <MascotAvatar color={c} size={36} mood={i === 0 ? "wink" : "neutral"} />
                    <span className="text-sm font-bold" style={{ color: i === 0 ? "#fff" : "var(--text-dim)" }}>
                      {p.name}{p.id === playerId && " (toi)"}
                    </span>
                  </div>
                  <span className="cb-mono text-xl font-bold" style={{ color: i === 0 ? MASCOT_PALETTE[c].body : "var(--text-muted)" }}>{p.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <Centered emoji="📡" text={error ?? "Chargement..."} />;
}

// ── Guess board with interactive slider ───────────────────
function GuessBoard({
  spectrum, clue, round, total, timeLeft, submitted, onSubmit, psychicName, role = "Place le curseur", note,
}: {
  spectrum: Spectrum | null; clue: string | null;
  round: number; total: number; timeLeft: number | null;
  submitted: boolean; onSubmit: (g: number) => void;
  psychicName: string | null;
  role?: string;
  note?: string;
}) {
  const [value, setValue] = useState(50);
  const [sent, setSent] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setValue(Math.max(0, Math.min(100, Math.round(pct))));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (sent || submitted) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    setFromClientX(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  const submit = () => { if (!sent && !submitted) { setSent(true); onSubmit(value); } };
  const locked = sent || submitted;

  return (
    <ZScreen>
      <RoundHeader round={round} total={total} timeLeft={timeLeft} max={30} role={role} />
      <ClueBadge clue={clue} authorName={psychicName} />
      {note && <p className="mt-4 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{note}</p>}

      <div className="mt-5"><SpectrumPair spectrum={spectrum} /></div>
      {/* Piste : on glisse le curseur */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative mx-2 mt-8 h-16 cursor-pointer select-none rounded-full"
        style={{ touchAction: "none", background: "#fff", border: `3px solid ${GAME_INK}`, boxShadow: `0 5px 0 ${GAME_INK}` }}
      >
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="absolute top-1/2 w-[2px] -translate-y-1/2" style={{ left: `${i * 10}%`, height: i % 5 === 0 ? 22 : 12, background: "rgba(21,8,46,0.35)" }} />
        ))}
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${value}%` }}>
          <div className="grid h-[68px] w-[68px] place-items-center rounded-full text-[24px]"
            style={{ ...DISPLAY, background: "#FFD23F", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}` }}>
            {value}
          </div>
        </div>
      </div>
      {!locked && <p className="mt-6 text-center text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>Fais glisser le rond jaune</p>}

      <div className="min-h-8 flex-1" />
      <ZButton bg="#FFD23F" onClick={submit} disabled={locked}>
        {locked ? "Curseur placé" : `Valider : ${value}`}
      </ZButton>
    </ZScreen>
  );
}

// ── Spectrum dial (read-only display) ─────────────────────
function SpectrumDial({
  spectrum, target, markers = [], mode, bare,
}: {
  spectrum: Spectrum | null;
  target: number | null;
  markers?: { value: number; label: string; isMe: boolean; color: MascotColor }[];
  mode: "psychic" | "reveal";
  /** Sans les étiquettes des extrêmes (affichées à part) */
  bare?: boolean;
}) {
  return (
    <div className="mt-4 w-full">
      {!bare && <div className="mb-4"><SpectrumPair spectrum={spectrum} /></div>}
      <div className="relative h-16 overflow-hidden rounded-full" style={{ background: "#fff", border: `3px solid ${GAME_INK}` }}>
        {target != null && (
          <>
            <Zone center={target} half={BAND_WIDE}  color="#FFF0B3" />
            <Zone center={target} half={BAND_MID}   color="#FFD23F" />
            <Zone center={target} half={BAND_TIGHT} color="#FF3EA5" />
            {mode === "reveal" && (() => {
              const side = target - 17 >= 4 ? -1 : 1;
              return (
                <>
                  <ZoneLabel value="5" center={target} y={"50%"} bold />
                  <ZoneLabel value="3" center={clampPct(target + side * 8)} y={"50%"} />
                  <ZoneLabel value="2" center={clampPct(target + side * 17)} y={"50%"} />
                </>
              );
            })()}
            {mode === "psychic" && (
              <div className="absolute top-0 bottom-0 w-[3px]" style={{ left: `${target}%`, transform: "translateX(-50%)", background: GAME_INK }} />
            )}
          </>
        )}
      </div>
      {mode === "psychic" && target != null && (
        <p className="mt-2 text-center text-[15px] font-bold" style={{ color: GAME_INK }}>Cible : {target} · vise le rose</p>
      )}

      {markers.length > 0 && (
        <div className="relative mt-2" style={{ height: 34 + Math.min(markers.length, 3) * 28 }}>
          {[...markers].sort((a, b) => a.value - b.value).map((m, i) => {
            const align = m.value < 15 ? "0%" : m.value > 85 ? "-100%" : "-50%";
            return (
              <div key={i} className="absolute" style={{ left: `${m.value}%`, top: (i % 3) * 28 }}>
                <div className="flex -translate-x-1/2 justify-center">
                  <MascotAvatar color={m.color} size={22} mood={m.isMe ? "wink" : "happy"} border={m.isMe} />
                </div>
                <span className="absolute mt-0.5 block max-w-[40vw] truncate whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-bold"
                  style={{ left: 0, transform: `translateX(${align})`, background: "#fff", color: GAME_INK, border: `2px solid ${GAME_INK}` }}>
                  {m.label} · {m.value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function clampPct(v: number) {
  return Math.max(3, Math.min(97, v));
}

function Zone({ center, half, color }: { center: number; half: number; color: string }) {
  const left = Math.max(0, center - half);
  const right = Math.min(100, center + half);
  return <div className="absolute top-0 bottom-0" style={{ left: `${left}%`, width: `${right - left}%`, background: color }} />;
}

function ZoneLabel({ value, center, y, bold }: { value: string; center: number; y: string; bold?: boolean }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        left: `${center}%`,
        top: y,
        ...DISPLAY,
        color: GAME_INK,
        fontSize: bold ? 18 : 14,
      }}
    >
      {value}
    </div>
  );
}

// ── Small shared pieces ───────────────────────────────────
function RoundHeader({ round, total, timeLeft, max, role }: {
  round: number; total: number; timeLeft: number | null; max: number; role: string;
}) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <ZChip bg="#fff" tilt={-2}>Manche {round}/{total}</ZChip>
        <ZChip bg={WAVE_COLOR} tilt={2}>{role}</ZChip>
      </div>
      {timeLeft != null && (
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full" style={{ background: "#fff", border: `2.5px solid ${GAME_INK}` }}>
          <div className="h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(0, Math.min(1, timeLeft / max)) * 100}%`, background: timeLeft <= 5 ? "#FF3EA5" : "#3DDC97" }} />
        </div>
      )}
    </div>
  );
}

function ClueBadge({ clue, authorName }: { clue: string | null; authorName: string | null }) {
  if (!clue) return null;
  return (
    <div className="mt-5 rounded-[22px] px-5 pb-4 pt-3" style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 5px 0 ${GAME_INK}`, rotate: "-1.5deg" }}>
      <p className="text-[14px] font-bold">L&apos;indice de {authorName ?? "?"}</p>
      <p className="mt-0.5 break-words text-[30px] leading-none" style={DISPLAY}>{clue}</p>
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <div className="mt-6 max-w-md rounded-2xl border px-5 py-4"
         style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}>
      <p className="animate-pulse text-center text-sm" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}

function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border"
           style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", boxShadow: "0 0 40px rgba(91,54,214,0.3)" }}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="animate-pulse text-center text-lg" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}
