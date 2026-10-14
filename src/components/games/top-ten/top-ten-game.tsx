"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import {
  ModeSelect, PlayersSetup, PassScreen, type GameMode,
  DISPLAY, SoundButton, ZButton, ZCard, ZChip, ZChoice, ZLink, ZRanking, ZScreen, ZTitle, useScrollTopOn,
} from "@/components/games/local-kit";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Eye, Flame, GripVertical, RefreshCw, Timer, Trophy, type LucideIcon } from "lucide-react";
import { GameIconBadge, GameIconButton, GameInlineIcon, GameTopRight, GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx, type SfxName } from "@/lib/sfx";
import { getLang, useT } from "@/lib/i18n";
import { adultDefault } from "@/lib/party-mood";
import { useUnlocked } from "@/lib/entitlements";
import { LockedPack, PremiumNudge, fmtCount, useNudgeText } from "@/components/games/premium-nudge";
import { THEMES, type ThemeState } from "@/components/games/top-ten/themes";
import { TT_STR } from "@/components/games/top-ten/i18n";
import { GameRulesSheet, GameTuto, RulesIconButton, TutoAgainButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { TT_EXTRA, useTtTutoSlides } from "@/components/games/top-ten/tuto";
import { uniqueMin, useGameFinished } from "@/lib/game-finished";
import { ShareResultButton } from "@/components/games/share-result-button";
import { rankingCard } from "@/lib/share-cards";

// ── Types ─────────────────────────────────────────────────
interface TopTenPlayerState {
  id: string;
  name: string;
  score: number;
}


interface RoundResult {
  correct: number;
  total: number;
  perfect: boolean;
  points: number;
}

interface TopTenState {
  phase: "waiting" | "config" | "intro" | "theme" | "answering" | "ordering" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  numberRange: number;
  pack: Pack;
  theme: ThemeState | null;
  numberedOrder: string[];
  submittedCount: number;
  submittedIds: string[] | null;
  trueOrder: string[] | null;
  revealNumbers: Record<string, number> | null;
  roundResults: Record<string, RoundResult> | null;
  players: TopTenPlayerState[];
  myNumber: number | null;
  iSubmitted: boolean;
  myGuess: string[] | null;
  isSpectator?: boolean;
  activeCount?: number;
  orderRemainingMs?: number | null;
}

const ACCENT = "#ff5a8a";
/** Couleur du jeu dans l'app (corail) */
const TT_COLOR = "#FF6B5B";

// Mélange uniforme (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Pack = "adult" | "culture";
// Vocabulaire de l'échelle selon le pack : voir TT_STR.scale (soft↔hard pour 18+, faible↔fort pour les classements).
// Thèmes de la langue courante, figée au lancement de la partie.
const themesForPack = (p: Pack) => THEMES[getLang()][p];
// Version découverte (app sans Zinzin+) : tout le pack Culture pop (30 thèmes fixes) ;
// le pack Soirée 18+ (thèmes chauds et malaise) est réservé à Zinzin+.
const FREE_PACK: Pack = "culture";
// Aperçu du pack 18+ verrouillé : thèmes « malaise » drôles, pas les plus crus
const PREVIEW_IDX = [41, 42];

// Score un classement (paires adjacentes bien ordonnées soft→hard)
function scorePairs(orderedNums: number[]): { correct: number; total: number; perfect: boolean; points: number } {
  const total = Math.max(0, orderedNums.length - 1);
  let correct = 0;
  for (let i = 0; i < orderedNums.length - 1; i++) {
    if (orderedNums[i] < orderedNums[i + 1]) correct++;
  }
  const perfect = total > 0 && correct === total;
  return { correct, total, perfect, points: correct * 2 + (perfect ? 5 : 0) };
}

// ── WRAPPER : le joueur choisit local ou online ───────────
export default function TopTenGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const t = useT(TT_STR);
  if (mode === null) {
    return (
      <ModeSelect emoji="🔥" name={t.gameName}
        tagline={t.tagline}
        onPick={setMode} />
    );
  }
  if (mode === "local") return <TopTenLocal onReturnToLobby={props.onReturnToLobby} />;
  return <TopTenOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play — chacun voit son numéro, puis chacun classe)
// ══════════════════════════════════════════════════════════
const TT_SFX: SfxName[] = ["card-flip", "card-shuffle", "gong", "whoosh", "tock", "ding", "win", "powerup", "coins", "confirm", "select", "tap"];

function TopTenLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  // Tuto 1re fois (dès l'ouverture, avant les joueurs) + feuille de règles, au-dessus de tous les écrans
  const tuto = useFirstTimeTuto("top-ten", { atMount: true });
  const slides = useTtTutoSlides();
  const x = useT(TT_EXTRA);
  const t = useT(TT_STR);
  const [rulesOpen, setRulesOpen] = useState(false);
  return (
    <>
      <TopTenLocalGame onReturnToLobby={onReturnToLobby} tools={<RulesIconButton onClick={() => setRulesOpen(true)} />} onTuto={tuto.show} />
      {rulesOpen && <GameRulesSheet name={t.gameName} rules={x.rules} onClose={() => setRulesOpen(false)} onTuto={tuto.show} />}
      {tuto.open && <GameTuto slides={slides} onDone={tuto.close} />}
    </>
  );
}

function TopTenLocalGame({ onReturnToLobby, tools, onTuto }: { onReturnToLobby?: () => void; tools: React.ReactNode; onTuto: () => void }) {
  const x = useT(TT_EXTRA);
  const t = useT(TT_STR);
  type Phase = "setup" | "target" | "theme" | "pass-number" | "show-number" | "answer" | "pass-rank" | "rank" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  // fin de partie → demande de note éventuelle + stats de la bande (app)
  useGameFinished(phase === "over", { loser: uniqueMin(players, scores), scores: { names: players, values: scores } });
  const [round, setRound] = useState(0);
  const [numberRange, setNumberRange] = useState<10 | 25 | 50>(10);
  // 18+ jamais présélectionné, sauf en Soirée « Folle »
  const unlocked = useUnlocked();
  const nudge = useNudgeText();
  const [packChoice, setPack] = useState<Pack>(() => (adultDefault(false) ? "adult" : "culture"));
  // Sans Zinzin+ : on reste sur le pack gratuit (réactif : tout se débloque dès l'abonnement)
  const pack: Pack = unlocked ? packChoice : FREE_PACK;
  const [themes, setThemes] = useState<ThemeState[]>(() => shuffle(themesForPack("adult")));
  const [themeCursor, setThemeCursor] = useState(0); // avance à chaque manche / changement
  const [numbers, setNumbers] = useState<Record<number, number>>({}); // playerIdx -> numéro
  const [passOrder, setPassOrder] = useState<number[]>([]); // ordre de passage (mélangé)
  const [stepIdx, setStepIdx] = useState(0); // index dans passOrder (voir numéro / classer)
  const [guesses, setGuesses] = useState<Record<number, number[]>>({}); // playerIdx -> classement (player indices)
  const [results, setResults] = useState<Record<number, RoundResult>>({});

  useEffect(() => { preloadSfx(TT_SFX); }, []);
  useScrollTopOn(`${phase}-${stepIdx}`);

  const theme = themes[themeCursor % themes.length] ?? null;
  const total = players.length;
  const totalRounds = Math.min(8, Math.max(4, total));

  // Prépare une manche : numéros + ordre de passage. La phrase est montrée
  // en phase "theme" AVANT que chacun voie son numéro (avec bouton "changer").
  const startRound = (r: number, names = players) => {
    const all = names.map((_, i) => i);
    const range = Math.max(numberRange, all.length); // sécurise si numberRange < #joueurs
    const pool = shuffle(Array.from({ length: range }, (_, i) => i + 1));
    const nums: Record<number, number> = {};
    all.forEach((idx, k) => { nums[idx] = pool[k]; });
    setNumbers(nums);
    setPassOrder(shuffle(all));
    setStepIdx(0);
    setGuesses({});
    setResults({});
    setRound(r);
    playSfx("card-flip", { volume: 0.7 });
    setPhase("theme");
  };

  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    setThemeCursor(0);
    setPhase("target"); // on choisit l'échelle avant la 1re manche
  };
  const launch = () => {
    playSfx("card-shuffle", { volume: 0.8 });
    setThemes(shuffle(themesForPack(pack)));
    setThemeCursor(0);
    startRound(1, players);
  };

  // Quand tout le monde a classé → score + reveal
  const finishRanking = (allGuesses: Record<number, number[]>) => {
    const res: Record<number, RoundResult> = {};
    const gained: number[] = players.map(() => 0);
    players.forEach((_, idx) => {
      const guess = allGuesses[idx] ?? passOrder;
      const nums = guess.map((pIdx) => numbers[pIdx]);
      const r = scorePairs(nums);
      res[idx] = r;
      gained[idx] = r.points;
    });
    setResults(res);
    setScores((s) => s.map((v, i) => v + gained[i]));
    // Roulement de tambour… puis le verdict
    playCombo("drumroll");
    const perfect = Object.values(res).some((r) => r.perfect);
    if (perfect) { playSfx("win", { volume: 0.9, delay: 1.05 }); playSfx("coins", { volume: 0.7, delay: 1.25 }); }
    else playSfx("ding", { volume: 0.8, delay: 1.05 });
    setPhase("reveal");
  };

  if (phase === "setup") {
    return (
      <PlayersSetup emoji="🔥" name={t.gameName} min={3} max={10} accent={TT_COLOR} onStart={begin} onBack={onReturnToLobby}
        footer={<IdeaButton game={t.gameName} kind="thème" />} />
    );
  }
  if (phase === "target") {
    return (
      <ZScreen tools={tools}>
        <RangePicker range={numberRange} onPick={setNumberRange} pack={pack} onPickPack={setPack} locked={!unlocked} onStart={launch} onBack={() => setPhase("setup")} />
        <TutoAgainButton onClick={onTuto} />
      </ZScreen>
    );
  }
  if (phase === "theme") {
    return (
      <ZScreen bg={TT_COLOR} tools={tools}>
        <RoundChips round={round} total={totalRounds} range={numberRange} />
        <div className="mt-5 flex flex-1 flex-col justify-center">
          <ThemeCard theme={theme} range={numberRange} pack={pack} />
          <ZCard bg="#FFF6E5" tilt={1} shadow={4} radius={20} className="mt-5 px-4 py-3">
            <p className="text-[15px] font-semibold leading-snug">{x.themeHelp(numberRange)}</p>
            <p className="mt-2 text-[15px] font-bold leading-snug">{x.secretRule(t.scale[pack].low.toLowerCase(), numberRange, t.scale[pack].high.toLowerCase())}</p>
          </ZCard>
          <div className="mt-5 flex justify-center">
            <RerollButton label={t.rerollTheme} onClick={() => setThemeCursor((c) => c + 1)} />
          </div>
        </div>
        <ZButton bg="#FFD23F" className="mt-6" onClick={() => { setStepIdx(0); setPhase("pass-number"); }}>
          {t.dealNumbers}
        </ZButton>
      </ZScreen>
    );
  }
  if (phase === "pass-number") {
    const idx = passOrder[stepIdx];
    // Bouton son présent aussi sur les écrans « passe le tél » (comme partout dans le jeu)
    return <><PassScreen toName={players[idx]} colorIndex={idx} accent={TT_COLOR}
      hint={t.passNumberHint(t.scale[pack].low.toLowerCase(), numberRange, t.scale[pack].high.toLowerCase())}
      onReady={() => { playSfx("card-flip", { volume: 0.8 }); setPhase("show-number"); }} /><GameTopRight><SoundButton /></GameTopRight></>;
  }
  if (phase === "show-number") {
    const idx = passOrder[stepIdx];
    return (
      <ZScreen tools={tools}>
        <ZTitle size={30} className="text-center">{t.yourNumber(players[idx])}</ZTitle>
        <div className="flex flex-1 flex-col items-center justify-center">
          <NumberCard myNumber={numbers[idx]} range={numberRange} pack={pack} />
        </div>
        <ZButton bg="#fff" className="mt-6" onClick={() => {
          if (stepIdx < passOrder.length - 1) { setStepIdx(stepIdx + 1); setPhase("pass-number"); }
          else { setStepIdx(0); playSfx("gong", { volume: 0.6 }); setPhase("answer"); }
        }}>{t.seenHide}</ZButton>
      </ZScreen>
    );
  }
  if (phase === "answer") {
    return (
      <ZScreen bg={TT_COLOR} tools={tools}>
        <RoundChips round={round} total={totalRounds} range={numberRange} />
        <div className="mt-5"><ThemeCard theme={theme} range={numberRange} pack={pack} /></div>
        <ZCard bg="#FFF6E5" tilt={1.5} shadow={4} radius={20} className="mt-6 px-4 py-3.5">
          <p className="text-[16px] font-semibold leading-snug">
            {t.answerHelp[0]}<b>{t.answerHelp[1]}</b>{t.answerHelp[2]}<b>{t.answerHelp[3]}</b>{t.answerHelp[4]}
          </p>
          <p className="mt-2 text-[16px] font-bold leading-snug">{x.neverSay}</p>
        </ZCard>
        <p className="mt-5 text-[15px] font-bold">{x.speakOrder}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {passOrder.map((idx, k) => (
            <ZChip key={idx} bg="#fff" tilt={k % 2 ? 2 : -2}>{k + 1}. {players[idx]}</ZChip>
          ))}
        </div>
        <div className="min-h-6 flex-1" />
        <ZButton bg="#FFD23F" onClick={() => { setStepIdx(0); setPhase("pass-rank"); }}>{t.everyoneSpoke}</ZButton>
      </ZScreen>
    );
  }
  if (phase === "pass-rank") {
    const idx = passOrder[stepIdx];
    return <><PassScreen toName={players[idx]} colorIndex={idx} accent={TT_COLOR}
      buttonLabel={t.itsMeRank} hint={t.scale[pack].passRankHint} onReady={() => setPhase("rank")} /><GameTopRight><SoundButton /></GameTopRight></>;
  }
  if (phase === "rank") {
    const ranker = passOrder[stepIdx];
    return (
      <OrderingBoard
        key={`${round}-${stepIdx}`}
        ids={passOrder.map(String)}
        nameOf={(id) => players[+id]}
        colorOf={(id) => +id}
        rankerName={players[ranker]}
        round={round} total={totalRounds} range={numberRange} pack={pack}
        theme={theme} tools={tools}
        onSubmit={(o) => {
          playSfx("confirm", { volume: 0.7 });
          const g = o.map(Number);
          const next = { ...guesses, [ranker]: g };
          setGuesses(next);
          if (stepIdx < passOrder.length - 1) { setStepIdx(stepIdx + 1); setPhase("pass-rank"); }
          else finishRanking(next);
        }} />
    );
  }
  if (phase === "reveal") {
    // Vrai classement (soft → hard)
    const trueOrder = [...passOrder].sort((a, b) => numbers[a] - numbers[b]);
    const perRound = players
      .map((name, i) => ({ name, i, ...results[i] }))
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    const anyPerfect = perRound.some((p) => p.perfect);
    return (
      <ZScreen tools={tools}>
        {anyPerfect && <ConfettiBurst count={40} />}
        <RoundChips round={round} total={totalRounds} range={numberRange} />
        <ZTitle size={38} className="mt-4">{t.trueRanking}</ZTitle>
        <div className="mt-4 flex flex-col gap-2.5">
          {trueOrder.map((idx, i) => {
            const num = numbers[idx];
            const hot = num / Math.max(numberRange, total);
            return (
              <div key={idx} className="flex items-center gap-3 rounded-[18px] py-2 pl-2 pr-4"
                style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}`, rotate: `${i % 2 ? 0.8 : -0.8}deg` }}>
                <span className="grid h-11 min-w-11 shrink-0 place-items-center rounded-[14px] px-1 text-[22px]"
                  style={{ ...DISPLAY, background: hot > 0.66 ? "#FF3EA5" : hot > 0.33 ? "#FFD23F" : "#3DDC97", color: GAME_INK, border: `2.5px solid ${GAME_INK}` }}>{num}</span>
                <PlayerBlob name={players[idx]} colorIndex={idx} size={34} mood="happy" bob={false} />
                <span className="min-w-0 flex-1 truncate text-[19px]" style={DISPLAY}>{players[idx]}</span>
              </div>
            );
          })}
        </div>

        <ZTitle size={28} className="mt-8">{t.whoNailedIt}</ZTitle>
        <p className="mt-1 text-[14px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{x.scoreLine}</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {perRound.map((p) => (
            <div key={p.i} className="flex items-center gap-3 rounded-[18px] px-3 py-2.5"
              style={{ background: p.perfect ? "#3DDC97" : "#FFF6E5", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}` }}>
              <PlayerBlob name={p.name} colorIndex={p.i} size={34} mood={p.perfect ? "laughing" : "happy"} bob={false} />
              <span className="min-w-0 flex-1 truncate text-[18px]" style={DISPLAY}>{p.name}</span>
              <span className="text-[14px] font-bold">{p.perfect ? t.perfect : t.pairs(p.correct, p.total)}</span>
              <span className="text-[22px]" style={DISPLAY}>+{p.points}</span>
            </div>
          ))}
        </div>

        <ZButton bg="#FFD23F" className="mt-8" onClick={() => {
          if (round >= totalRounds) { playCombo("fanfare"); setPhase("over"); }
          else { setThemeCursor((c) => c + 1); startRound(round + 1); }
        }}>{round >= totalRounds ? t.seeScores : t.nextRound}</ZButton>
      </ZScreen>
    );
  }
  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], colorIndex: i })).sort((a, b) => b.score - a.score);
  return (
    <ZScreen bg={TT_COLOR} tools={tools}>
      <ConfettiBurst count={50} />
      {/* Ex æquo en tête : pas de « X a le meilleur flair » arbitraire */}
      <ZTitle size={(ranking[0]?.name.length ?? 0) > 10 ? 32 : 40} className="text-center">
        {ranking.length > 1 && ranking[1].score === ranking[0]?.score ? t.tieTop : t.bestInstinct(ranking[0]?.name ?? "")}
      </ZTitle>
      <div className="mt-6"><ZRanking rows={ranking} /></div>
      <div className="min-h-8 flex-1" />
      {/* Version découverte : un petit mot sur Zinzin+, une seule fois, en fin de partie */}
      <PremiumNudge text={nudge.topTen(fmtCount(themesForPack("adult").length))} style={{ marginBottom: 16 }} />
      <ZButton bg="#FFD23F" onClick={() => { setPhase("target"); }}>{t.playAgain}</ZButton>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <ZButton size="sm" bg="#fff" style={{ width: "auto" }} onClick={() => setPhase("setup")}>{t.changePlayers}</ZButton>
        <IdeaButton game={t.gameName} kind="thème" bg="#fff" />
        <ShareResultButton card={() => rankingCard("top-ten", ranking)} />
      </div>
      {onReturnToLobby && <ZLink onClick={onReturnToLobby} color={GAME_INK} className="mt-2">{t.backHome}</ZLink>}
    </ZScreen>
  );
}

/** Pastilles « Manche 2/4 » + « De 1 à 10 ». */
function RoundChips({ round, total, range }: { round: number; total: number; range: number }) {
  const t = useT(TT_STR);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ZChip bg="#fff" tilt={-2}>{t.roundOf(round, total)}</ZChip>
      <ZChip bg="#FFD23F" tilt={2}>{t.fromOneTo(range)}</ZChip>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MODE ONLINE (multi-appareils) — tout le monde classe
// ══════════════════════════════════════════════════════════
function TopTenOnline({ roomCode, playerId, playerName }: GameProps) {
  const t = useT(TT_STR);
  const { sendAction } = useGame(roomCode, "top-ten", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as TopTenState;

  const nameOf = useCallback(
    (id: string) => state?.players?.find((p) => p.id === id)?.name ?? "?",
    [state?.players]
  );

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return (
      <Centered>
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-sm"
            style={{ boxShadow: `0 0 40px ${ACCENT}22` }}
          >
            <Flame size={36} strokeWidth={2.4} color={ACCENT} aria-hidden />
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg">
            Distribution des num&eacute;ros...
          </p>
        </div>
      </Centered>
    );
  }

  // ── CONFIG (choix du score cible avant la 1re manche) ───
  if (state.phase === "config") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}1c, transparent 45%), #060606` }}>
        <RangePicker
          range={(state.numberRange as 10 | 25 | 50) ?? 10}
          onPick={(r) => sendAction({ action: "set-range", range: r })}
          pack={state.pack ?? "adult"}
          onPickPack={(p) => sendAction({ action: "set-pack", pack: p })}
          onStart={() => sendAction({ action: "begin-game" })}
          shared
        />
      </div>
    );
  }

  // ── INTRO ───────────────────────────────────────────────
  if (state.phase === "intro") {
    return (
      <Centered>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
          Manche {state.round}/{state.totalRounds} · sur {state.numberRange}
        </span>
        <Flame size={48} strokeWidth={2.4} color={ACCENT} className="mb-6" aria-hidden />
        <p className="text-2xl font-display font-semibold text-white/90 mb-3 text-center px-6" style={{ textShadow: `0 0 40px ${ACCENT}33` }}>
          Chacun reçoit un numéro secret
        </p>
        <p className="text-sm text-white/45 font-sans max-w-xs text-center">
          De 1 ({t.scale[state.pack ?? "adult"].low.toLowerCase()}) à {state.numberRange} ({t.scale[state.pack ?? "adult"].high.toLowerCase()}). Réponds à voix haute selon ton numéro… puis chacun classe toute la table, <b className="text-white/75">toi compris</b>.
        </p>
      </Centered>
    );
  }

  // ── THEME (on voit la phrase AVANT les numéros) ─────────
  if (state.phase === "theme") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-5 md:p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}16, transparent 45%), #060606` }}
      >
        <Header round={state.round} total={state.totalRounds} range={state.numberRange} pack={state.pack ?? "adult"} />
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <ThemeCard theme={state.theme} range={state.numberRange} pack={state.pack ?? "adult"} />
          <button
            onClick={() => sendAction({ action: "start-answering" })}
            className="mt-7 w-full max-w-md py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: TT_COLOR, color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 5px 0 ${GAME_INK}`, ...DISPLAY }}
          >
            C&apos;est bon → voir mon numéro
          </button>
          <button
            onClick={() => sendAction({ action: "change-theme" })}
            className="mt-3 w-full max-w-md py-3 rounded-2xl font-sans text-sm font-semibold text-white/70 border border-white/15 bg-white/[0.04] transition-all hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <GameInlineIcon icon={RefreshCw} /> Changer de thème
          </button>
          <p className="text-xs text-white/35 font-sans mt-3 text-center max-w-xs">
            N&apos;importe qui peut changer la phrase ou lancer la distribution.
          </p>
        </div>
      </div>
    );
  }

  // ── ANSWERING ───────────────────────────────────────────
  if (state.phase === "answering") {
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}14, transparent 45%), #060606` }}
      >
        <Header round={state.round} total={state.totalRounds} range={state.numberRange} pack={state.pack ?? "adult"} />

        {/* Theme card */}
        <div className="mt-4 mb-6 w-full max-w-md">
          <ThemeCard theme={state.theme} range={state.numberRange} pack={state.pack ?? "adult"} />
        </div>

        {/* My secret number */}
        {state.isSpectator ? (
          <p className="mt-2 max-w-xs text-center text-sm text-white/50 font-sans">
            👀 Tu es arrivé(e) en cours de partie : tu regardes cette manche, tu joueras à la prochaine partie.
          </p>
        ) : (
          <NumberCard myNumber={state.myNumber} range={state.numberRange} />
        )}

        <button
          onClick={() => sendAction({ action: "start-ordering" })}
          className="mt-7 w-full max-w-md py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: TT_COLOR, color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 5px 0 ${GAME_INK}`, ...DISPLAY }}
        >
          Tout le monde a parlé → Classer
        </button>
        <p className="text-xs text-white/35 font-sans mt-3 text-center max-w-xs">
          Quand chacun a donné sa réponse à voix haute, lance le classement (n&apos;importe qui peut le faire).
        </p>
      </div>
    );
  }

  // ── ORDERING (tout le monde classe) ─────────────────────
  if (state.phase === "ordering") {
    const expected = state.activeCount ?? state.players.length;
    if (state.iSubmitted || state.isSpectator) {
      return (
        <Centered>
          <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
            Manche {state.round}/{state.totalRounds} · sur {state.numberRange}
          </span>
          <div className="mb-4 flex justify-center"><GameIconBadge icon={state.isSpectator ? Eye : Check} bg={state.isSpectator ? "#FFFFFF" : "#3DDC97"} size={52} /></div>
          <p className="text-2xl font-display font-semibold text-white/90 mb-3 text-center px-6">
            {state.isSpectator ? "Les joueurs classent la table" : "Classement envoyé"}
          </p>
          <p className="text-sm text-white/40 font-sans animate-pulse">
            {state.submittedCount}/{expected} ont validé…
          </p>
          {state.orderRemainingMs != null && (
            <OrderCountdown key={state.round} remainingMs={state.orderRemainingMs} />
          )}
        </Centered>
      );
    }
    return (
      <OrderingBoard
        key={`${state.round}-${state.numberedOrder.join(",")}`}
        ids={state.numberedOrder}
        nameOf={nameOf}
        myId={playerId}
        onSubmit={(order) => sendAction({ action: "submit-order", order })}
        round={state.round}
        total={state.totalRounds}
        range={state.numberRange}
        pack={state.pack ?? "adult"}
        submittedCount={state.submittedCount}
        playerCount={expected}
        remainingMs={state.orderRemainingMs ?? null}
      />
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const trueOrder = state.trueOrder ?? [];
    const myResult = state.roundResults?.[playerId];
    const ranking = [...(state.players ?? [])]
      .map((p) => ({ ...p, res: state.roundResults?.[p.id] }))
      .sort((a, b) => (b.res?.points ?? 0) - (a.res?.points ?? 0));
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] overflow-y-auto"
        style={{
          background: myResult?.perfect
            ? `radial-gradient(circle at 50% 20%, ${ACCENT}22, transparent 50%), #060606`
            : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.04), transparent 45%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-3 mt-1">
          Manche {state.round}/{state.totalRounds} · sur {state.numberRange} — R&eacute;sultat
        </span>

        <p
          className={cn("text-3xl font-display font-semibold mb-1 text-center", myResult?.perfect ? "text-white/95" : "text-white/85")}
          style={myResult?.perfect ? { textShadow: `0 0 40px ${ACCENT}55` } : undefined}
        >
          {myResult?.perfect
            ? "🎉 Classement parfait !"
            : myResult
            ? `Toi : ${myResult.correct}/${myResult.total} bien placés`
            : "Résultat"}
        </p>
        <p className="text-xs text-white/35 font-sans mb-4 text-center">Le vrai classement (soft → hard)</p>

        {/* Vrai classement */}
        <div className="w-full max-w-md space-y-1.5 mb-5">
          {trueOrder.map((id, i) => {
            const num = state.revealNumbers?.[id] ?? 0;
            return (
              <div key={id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-xs text-white/30 font-mono w-5">{i + 1}.</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono font-bold text-sm text-white"
                  style={{ background: ACCENT, opacity: 0.25 + (num / (state.numberRange ?? 10)) * 0.75 }}
                >
                  {num}
                </span>
                <span className="text-sm font-sans font-semibold text-white/85 flex-1 truncate">
                  {nameOf(id)}
                  {id === playerId && <span className="text-white/35"> (toi)</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Précision de chacun */}
        <p className="text-xs text-white/30 font-sans uppercase tracking-[0.25em] mb-2" style={{ color: `${ACCENT}cc` }}>
          Précision de chacun
        </p>
        <div className="w-full max-w-md space-y-2">
          {ranking.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-sm",
                p.res?.perfect ? "border-emerald-500/35 bg-emerald-500/[0.09]" : "border-white/10 bg-black/30"
              )}
            >
              <span className="text-sm font-sans font-semibold text-white/85 flex-1 truncate">
                {p.name}
                {p.id === playerId && <span className="text-white/35"> (toi)</span>}
              </span>
              <span className="text-xs font-mono text-white/50">
                {p.res ? `${p.res.correct}/${p.res.total}` : "—"}{p.res?.perfect ? " 🎉" : ""}
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: ACCENT }}>+{p.res?.points ?? 0}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/35 font-sans mt-5 animate-pulse">Manche suivante...</p>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}18, transparent 45%), #060606` }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-2">Partie termin&eacute;e</span>
        <Flame size={40} strokeWidth={2.4} color={ACCENT} className="mb-6" aria-hidden />
        <div className="w-full max-w-sm space-y-2.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-3xl border p-4 backdrop-blur-sm",
                i === 0 ? "border-rose-500/35 bg-rose-500/10" : "border-white/10 bg-black/30"
              )}
              style={i === 0 ? { boxShadow: `0 0 25px ${ACCENT}33` } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={cn("text-xl font-mono font-bold w-8", i === 0 ? "text-rose-400" : "text-white/25")}>
                  #{i + 1}
                </span>
                <span className={cn("text-sm font-sans font-semibold", i === 0 ? "text-white/90" : "text-white/45")}>
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
              </div>
              <span
                className={cn("text-xl font-mono font-bold", i === 0 ? "text-rose-400" : "text-white/40")}
                style={i === 0 ? { textShadow: `0 0 15px ${ACCENT}55` } : undefined}
              >
                {p.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── FALLBACK ────────────────────────────────────────────
  return (
    <Centered>
      {error ? (
        <p className="text-sm text-red-400 font-sans font-semibold">{error}</p>
      ) : (
        <p className="text-white/40 animate-pulse font-sans text-lg">Chargement...</p>
      )}
    </Centered>
  );
}

// ── Sub-components ────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
      style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}10, transparent 45%), #060606` }}
    >
      {children}
    </div>
  );
}

function Header({ round, total, range, pack = "adult" }: { round: number; total: number; range: number; pack?: Pack }) {
  const t = useT(TT_STR);
  return (
    <div className="flex w-full max-w-md items-center justify-between">
      <span className="text-xs text-white/25 font-sans tracking-wide">
        Manche {round}/{total} · sur {range}
      </span>
      <span
        className="mr-14 text-xs px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider"
        style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
      >
        {t.packLabel[pack]}
      </span>
    </div>
  );
}

// ── Choix des thèmes + de l'échelle des numéros (1→10 / 25 / 50) ─────
function RangePicker({
  range,
  onPick,
  pack,
  onPickPack,
  locked,
  onStart,
  onBack,
  shared,
}: {
  range: 10 | 25 | 50;
  onPick: (r: 10 | 25 | 50) => void;
  pack?: Pack;
  onPickPack?: (p: Pack) => void;
  /** App sans Zinzin+ : le pack 18+ est verrouillé (cadenas + aperçu) */
  locked?: boolean;
  onStart: () => void;
  onBack?: () => void;
  shared?: boolean;
}) {
  const t = useT(TT_STR);
  const OPTIONS: { v: 10 | 25 | 50; label: string; color: string }[] = [
    { v: 10, label: t.rangeLabels[10], color: "#3DDC97" },
    { v: 25, label: t.rangeLabels[25], color: "#FFD23F" },
    { v: 50, label: t.rangeLabels[50], color: "#FF3EA5" },
  ];
  const PACKS: { v: Pack; icon: LucideIcon; label: string; sub: string; color: string }[] = [
    { v: "adult", icon: Flame, ...t.packs.adult, color: "#FF3EA5" },
    { v: "culture", icon: Trophy, ...t.packs.culture, color: "#4ECDC4" },
  ];
  return (
    <div className="flex w-full flex-1 flex-col text-white">
      {pack != null && onPickPack && (
        <>
          <ZTitle size={30}>{t.themesTitle}</ZTitle>
          {locked ? (
            // Version découverte : Culture pop offert, Soirée 18+ visible avec cadenas + aperçu
            <div className="mt-3 flex flex-col gap-3">
              {PACKS.filter((o) => o.v === FREE_PACK).map((o) => (
                <ZChoice key={o.v} active color={o.color} onClick={() => onPickPack(o.v)} tilt={-1} className="flex items-center gap-3">
                  <GameIconBadge icon={o.icon} bg="#fff" size={40} />
                  <span className="min-w-0 text-left">
                    <span className="block text-[20px] leading-none" style={DISPLAY}>{o.label}</span>
                    <span className="mt-1 block text-[14px] font-semibold leading-tight">{o.sub}{"\u00A0·\u00A0"}{t.freeThemes(themesForPack(FREE_PACK).length)}</span>
                  </span>
                </ZChoice>
              ))}
              <LockedPack
                emoji="🔥"
                label={`${t.packs.adult.label} · ${t.packs.adult.sub}`}
                preview={PREVIEW_IDX.map((i) => themesForPack("adult")[i]?.theme).filter((x): x is string => Boolean(x))}
              />
            </div>
          ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {PACKS.map((o, i) => (
              <ZChoice key={o.v} active={o.v === pack} color={o.color} onClick={() => onPickPack(o.v)} tilt={i ? 1.5 : -1.5} className="flex min-h-[124px] flex-col items-start justify-start">
                <GameIconBadge icon={o.icon} bg={o.v === pack ? "#fff" : o.color} size={40} />
                <p className="mt-2 text-[20px] leading-none" style={DISPLAY}>{o.label}</p>
                <p className="mt-1 text-[14px] font-semibold leading-tight">{o.sub}</p>
              </ZChoice>
            ))}
          </div>
          )}
        </>
      )}
      <ZTitle size={30} className="mt-8">{t.numbersUpTo}</ZTitle>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {OPTIONS.map((o, i) => (
          <ZChoice key={o.v} active={o.v === range} color={o.color} onClick={() => onPick(o.v)} tilt={i === 1 ? 2 : -2} style={{ textAlign: "center" }}>
            <p className="text-[38px] leading-none" style={DISPLAY}>{o.v}</p>
            <p className="mt-1 text-[14px] font-bold">{o.label}</p>
          </ZChoice>
        ))}
      </div>
      <p className="mt-5 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
        {t.rangeHelp}
      </p>
      <div className="min-h-8 flex-1" />
      <ZButton bg={TT_COLOR} onClick={() => { playSfx("confirm", { volume: 0.7 }); onStart(); }}>{t.startGame}</ZButton>
      {shared && (
        <p className="mt-3 text-center text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
          {t.sharedHint}
        </p>
      )}
      {onBack && <ZLink onClick={onBack} className="mt-2"><GameInlineIcon icon={ArrowLeft} /> {t.editPlayers}</ZLink>}
    </div>
  );
}

/** « 1 500 € » ne doit pas se couper entre les chiffres (ni avant €/%). */
function nbNum(t?: string) {
  return t?.replace(/(\d) (?=\d{3}\b|€|%)/g, "$1\u00A0");
}

function ThemeCard({ theme, range = 10, pack = "adult" }: { theme: ThemeState | null; range?: number; pack?: Pack }) {
  const t = useT(TT_STR);
  return (
    <div className="w-full">
      <ZCard bg="#fff" tilt={-1.5} shadow={6} radius={26} className="px-5 pb-5 pt-4">
        <ZChip bg={pack === "adult" ? "#FF3EA5" : "#4ECDC4"} tilt={-3} className="-mt-8 mb-2">{t.packLabel[pack]}</ZChip>
        <ZTitle size={theme && theme.theme.length > 60 ? 26 : 31} as="p" style={{ lineHeight: 1.05, textWrap: "pretty" }}>{nbNum(theme?.theme)}</ZTitle>
      </ZCard>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ZCard bg="#3DDC97" tilt={1.5} shadow={4} radius={20} className="px-3 pb-3 pt-2">
          <p className="text-[30px] leading-none" style={DISPLAY}>1</p>
          <p className="mt-1 text-[14px] font-semibold leading-snug">{nbNum(theme?.low)}</p>
        </ZCard>
        <ZCard bg="#FFD23F" tilt={-1.5} shadow={4} radius={20} className="px-3 pb-3 pt-2 text-right">
          <p className="text-[30px] leading-none" style={DISPLAY}>{range}</p>
          <p className="mt-1 text-[14px] font-semibold leading-snug">{nbNum(theme?.high)}</p>
        </ZCard>
      </div>
    </div>
  );
}

function NumberCard({ myNumber, range = 10, pack = "adult" }: { myNumber: number | null; range?: number; pack?: Pack }) {
  const t = useT(TT_STR);
  const hot = myNumber != null ? myNumber / range : 0.5;
  const bg = hot > 0.66 ? "#FF3EA5" : hot > 0.33 ? "#FFD23F" : "#3DDC97";
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid h-48 w-48 place-items-center rounded-[40px]"
        style={{ background: bg, color: GAME_INK, border: `4px solid ${GAME_INK}`, boxShadow: `0 8px 0 ${GAME_INK}`, rotate: "-4deg" }}
      >
        <span style={{ ...DISPLAY, fontSize: myNumber != null && myNumber >= 10 ? 104 : 124, lineHeight: 1 }}>{myNumber ?? "?"}</span>
      </div>
      <ZChip bg="#fff" tilt={3} className="mt-6" style={{ alignSelf: "center" }}>
        {t.outOf(range)} · {myNumber != null && hot > 0.5 ? t.scale[pack].chipHigh : t.scale[pack].chipLow}
      </ZChip>
      <p className="mt-5 max-w-xs text-center text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.9)" }}>
        {t.numberHelp}
      </p>
    </div>
  );
}

// ── Drag & drop reorder board (touch + mouse) ─────────────
function OrderingBoard({
  ids,
  nameOf,
  onSubmit,
  round,
  total,
  range,
  pack = "adult",
  myId,
  rankerName,
  submittedCount,
  playerCount,
  remainingMs,
  colorOf,
  theme,
  tools,
}: {
  ids: string[];
  nameOf: (id: string) => string;
  /** Index de couleur du blob du joueur (mode local) */
  colorOf?: (id: string) => number;
  onSubmit: (order: string[]) => void;
  round: number;
  total: number;
  range: number;
  pack?: Pack;
  myId?: string;
  rankerName?: string;
  submittedCount?: number;
  playerCount?: number;
  remainingMs?: number | null;
  /** Mode local : rappel du thème et des repères (on ne classe pas de mémoire) */
  theme?: ThemeState | null;
  tools?: React.ReactNode;
}) {
  const t = useT(TT_STR);
  const x = useT(TT_EXTRA);
  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handlePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (submitted) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    e.preventDefault();
    const y = e.clientY;
    // Find which item we're hovering over
    let targetId: string | null = null;
    for (const id of order) {
      const el = itemRefs.current.get(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        targetId = id;
        break;
      }
    }
    if (!targetId || targetId === dragId) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragId);
      const to = prev.indexOf(targetId!);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
  };

  const handlePointerUp = () => setDragId(null);

  const move = (id: string, dir: -1 | 1) => {
    if (submitted) return;
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(order);
  };

  return (
    <div onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className="flex shrink-0 flex-col">
    <ZScreen tools={tools}>
      <div className="flex flex-wrap items-center gap-2">
        <ZChip bg="#fff" tilt={-2}>{t.roundOf(round, total)}</ZChip>
        {rankerName && <ZChip bg={TT_COLOR} tilt={2}>{t.ranks(rankerName)}</ZChip>}
      </div>
      {theme && (
        <ZCard bg="#fff" tilt={-1} shadow={4} radius={20} className="mt-4 px-4 pb-3 pt-2.5">
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: "#6B5A8E" }}>{x.themeReminder}</p>
          <p className="mt-0.5 text-[18px] leading-tight" style={DISPLAY}>{nbNum(theme.theme)}</p>
          <p className="mt-1.5 text-[13px] font-semibold leading-snug"><b>1</b> = {nbNum(theme.low)} · <b>{range}</b> = {nbNum(theme.high)}</p>
        </ZCard>
      )}
      <ZTitle size={30} className="mt-4">{t.scale[pack].rankTitle}</ZTitle>
      <p className="mt-2 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
        {t.rankHelp}{theme ? ` ${x.inSpeakOrder}` : ""}
      </p>
      {remainingMs != null && <OrderCountdown key={round} remainingMs={remainingMs} />}

      <div className="mt-4"><ZChip bg="#3DDC97" tilt={-1.5}><ArrowUp size={15} strokeWidth={3} aria-hidden /> 1 · {t.scale[pack].low}</ZChip></div>
      <div className="mt-3 flex w-full flex-col gap-2.5 select-none">
        {order.map((id, i) => {
          const isDragging = id === dragId;
          const isMe = myId != null && id === myId;
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) itemRefs.current.set(id, el);
                else itemRefs.current.delete(id);
              }}
              className="flex items-center gap-2 rounded-[18px] py-1.5 pl-1.5 pr-1.5 transition-transform"
              style={{
                background: isDragging ? "#FFD23F" : isMe ? "#FFF6E5" : "#fff",
                color: GAME_INK,
                border: `3px solid ${GAME_INK}`,
                boxShadow: `0 ${isDragging ? 8 : 4}px 0 ${GAME_INK}`,
                transform: isDragging ? "scale(1.03) rotate(-1.5deg)" : undefined,
              }}
            >
              <div
                onPointerDown={handlePointerDown(id)}
                className="grid h-11 w-10 shrink-0 cursor-grab place-items-center rounded-[12px] active:cursor-grabbing"
                style={{ touchAction: "none", background: "#F1ECFF" }}
                role="button"
                aria-label={t.dragAria}
              >
                <GripVertical size={20} strokeWidth={2.6} aria-hidden />
              </div>
              <span className="w-6 shrink-0 text-center text-[18px]" style={DISPLAY}>{i + 1}</span>
              {colorOf && <PlayerBlob name={nameOf(id)} colorIndex={colorOf(id)} size={30} mood="happy" bob={false} />}
              {/* Prénom long : plus petit et sur 2 lignes (coupure au trait d'union) plutôt que « Jean-Chri… » */}
              <span className={`min-w-0 flex-1 ${nameOf(id).length > 10 ? "line-clamp-2 text-[15px] leading-[1.05]" : "truncate text-[18px]"}`} style={DISPLAY}>
                {nameOf(id)}{isMe && t.me}
              </span>
              <GameIconButton icon={ArrowUp} label={t.moveUp(nameOf(id))} onClick={() => move(id, -1)} disabled={i === 0 || submitted} bg="#3DDC97" />
              <GameIconButton icon={ArrowDown} label={t.moveDown(nameOf(id))} onClick={() => move(id, 1)} disabled={i === order.length - 1 || submitted} bg="#FF3EA5" />
            </div>
          );
        })}
      </div>
      <div className="mt-3"><ZChip bg="#FF3EA5" tilt={1.5}><ArrowDown size={15} strokeWidth={3} aria-hidden /> {range} · {t.scale[pack].high}</ZChip></div>

      <div className="min-h-6 flex-1" />
      <ZButton bg="#FFD23F" onClick={submit} disabled={submitted}>
        {submitted
          ? submittedCount != null
            ? t.sent(submittedCount, playerCount ?? 0)
            : t.rankingSent
          : t.submitRanking}
      </ZButton>
    </ZScreen>
    </div>
  );
}

// Compte à rebours de la phase de classement (calculé localement à partir du temps restant reçu)
function OrderCountdown({ remainingMs }: { remainingMs: number }) {
  const [deadline] = useState(() => Date.now() + remainingMs);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));
  const urgent = left <= 10;
  return (
    <p
      className={cn("text-center text-sm font-mono font-bold mb-3", urgent && "animate-pulse")}
      style={{ color: urgent ? ACCENT : "rgba(255,255,255,0.55)" }}
    >
      <GameInlineIcon icon={Timer} /> {left} s
    </p>
  );
}
