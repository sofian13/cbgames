"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot, type MascotColor } from "@/components/Mascot";
import { PlayerBlob, usePlayerLook } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { registerSoftReplay } from "@/lib/game-replay";
import { getSavedPlayers, savePlayers } from "@/lib/saved-players";
import { ArrowRight, Check, Crown, Lock, Plus, Undo2, X } from "lucide-react";
import { GameIconBadge, GameIconButton, GameInlineIcon } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { TopRightControls } from "@/components/games/patate/rules-sheet";
import { C, Chip, DISPLAY, INK, KitStyles, SectionTitle, StickerBtn, StickerCard, StickerScreen, BOTTOM_PAD, dotted, sticker } from "@/components/games/patate/sticker-kit";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { useLang, type Lang } from "@/lib/i18n";
import { adultDefault } from "@/lib/party-mood";
import { STR } from "./i18n";
import { DEFAULT_THEME_IDS, FREE_THEME_IDS, OPT_IN_THEME_IDS, THEME_IDS, WORDS, freeWords, type ThemeId } from "./words";
import { requestPaywall, useUnlocked } from "@/lib/entitlements";
import { PremiumNudge, fmtCount, useNudgeText } from "../premium-nudge";
import { useGameFinished } from "@/lib/game-finished";

const ACCENT = "#FFD23F";

// Couleurs de blob par équipe (DA du site).
const TEAM_BLOB: MascotColor[] = ["yellow", "sky", "coral", "mint", "pink", "lavender"];

function getWordsForThemes(selectedIds: ThemeId[], lang: Lang): string[] {
  // Aucun thème coché = aucun mot. Dédoublonnage insensible à la casse
  // (un même mot peut apparaître dans plusieurs thèmes).
  const lists = WORDS[lang];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of THEME_IDS) {
    if (!selectedIds.includes(id)) continue;
    for (const w of lists[id]) {
      const key = w.toLocaleLowerCase(lang);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(w);
    }
  }
  return out;
}

// Taille de police adaptative pour le mot à faire deviner (375 px de large).
function wordFontSize(word: string): number {
  const longest = Math.max(...word.split(/\s+/).map((w) => w.length));
  if (longest > 13) return 30;
  if (longest > 10) return 36;
  if (word.length > 18) return 36;
  return 46;
}

// ── Types ──────────────────────────────────────────────────

interface Team {
  name: string;
  player1: string;
  player2: string;
}

interface WordResult {
  word: string;
  correct: boolean;
}

interface TurnResult {
  teamIndex: number;
  round: number;
  words: WordResult[];
  score: number;
}

type Phase = "setup" | "pre-turn" | "playing" | "turn-result" | "round-summary" | "game-over";

// ── Helpers ────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ── Component ──────────────────────────────────────────────

/** Remet l'écran en haut à chaque changement de phase (sinon on arrive « scrollé » depuis les réglages). */
function ScrollTop({ dep }: { dep: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    for (let el = ref.current?.parentElement ?? null; el; el = el.parentElement) {
      if (el.scrollTop > 0) el.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [dep]);
  return <span ref={ref} hidden />;
}

export default function MakeGuessGame({
  roomCode,
  playerId,
  playerName,
  onReturnToLobby,
}: GameProps) {
  // Langue figée au montage du jeu (on ne change pas de langue en pleine partie)
  const lang = useLang();
  const t = STR[lang];

  // ── Setup state ──
  // Équipes pré-remplies avec la dernière bande (mémoire des prénoms), 2 par équipe
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = getSavedPlayers();
    const count = Math.max(2, Math.floor(saved.length / 2));
    return Array.from({ length: count }, (_, i) => ({
      name: STR[lang].teamName(i + 1),
      player1: saved[i * 2] ?? "",
      player2: saved[i * 2 + 1] ?? "",
    }));
  });
  const [timerDuration, setTimerDuration] = useState(60);
  const [totalRounds, setTotalRounds] = useState(1);
  // Soirée « Folle » : thème 18+ coché d'office (Marques reste décoché).
  const [selectedThemes, setSelectedThemes] = useState<ThemeId[]>(() => (adultDefault(false) ? [...DEFAULT_THEME_IDS, "adult"] : [...DEFAULT_THEME_IDS]));

  // App sans Zinzin+ : version découverte (60 mots fixes qui tournent)
  const unlocked = useUnlocked();
  const nudge = useNudgeText();

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("setup");
  useGameFinished(phase === "game-over"); // fin de partie → demande de note éventuelle (app)
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  // Dans une manche : passage 0 → le joueur 1 de chaque équipe fait deviner,
  // passage 1 → le joueur 2. Une manche = chaque joueur fait deviner une fois.
  const [subTurn, setSubTurn] = useState<0 | 1>(0);
  const [wordPool, setWordPool] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [turnWords, setTurnWords] = useState<WordResult[]>([]);
  const [allResults, setAllResults] = useState<TurnResult[]>([]);
  const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);
  const [wordAnim, setWordAnim] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived ──
  const currentTeam = teams[currentTeamIndex];
  const describerIsPlayer1 = subTurn === 0;
  const describer = currentTeam
    ? describerIsPlayer1
      ? currentTeam.player1
      : currentTeam.player2
    : "";
  const guesser = currentTeam
    ? describerIsPlayer1
      ? currentTeam.player2
      : currentTeam.player1
    : "";

  // ── Timer logic ──
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const endTurn = useCallback(() => {
    stopTimer();
    setPhase("turn-result");
  }, [stopTimer]);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((time) => {
          const next = Math.max(0, time - 1);
          if (next === 0) {
            stopTimer();
            setPhase("turn-result");
          }
          return next;
        });
      }, 1000);
      return () => stopTimer();
    }
  }, [phase, stopTimer]);

  // ── Sons : préchargés, tic-tac sur les 10 dernières secondes, cloche à la fin ──
  useEffect(() => {
    preloadSfx(["tick", "tock", "bell", "success", "whooshdown", "back", "gong", "win", "powerup", "ding"]);
  }, []);
  useEffect(() => {
    if (phase !== "playing" && !(phase === "turn-result" && timeLeft === 0)) return;
    if (timeLeft === 0) playSfx("bell", { volume: 0.8 });
    else if (timeLeft <= 10) playSfx(timeLeft % 2 ? "tick" : "tock", { volume: 0.6, rate: 1 + (10 - timeLeft) * 0.04 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);
  useEffect(() => {
    if (phase === "game-over") playCombo("fanfare");
  }, [phase]);

  // ── Setup handlers ──
  const updateTeam = useCallback(
    (index: number, field: keyof Team, value: string) => {
      setTeams((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
    },
    []
  );

  const addTeam = useCallback(() => {
    setTeams((prev) => [
      ...prev,
      {
        name: t.teamName(prev.length + 1),
        player1: "",
        player2: "",
      },
    ]);
  }, [t]);

  const removeTeam = useCallback((index: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const allThemesSelected = DEFAULT_THEME_IDS.every((id) => selectedThemes.includes(id));
  const canStart =
    teams.length >= 2 &&
    teams.every((t) => t.name.trim() && t.player1.trim() && t.player2.trim()) &&
    (!unlocked || getWordsForThemes(selectedThemes, lang).length > 0);

  const toggleTheme = useCallback((id: ThemeId) => {
    setSelectedThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  // Toggle global : tout cocher (hors thèmes opt-in « Marques » et « 18+ ») ou tout décocher.
  const selectAllThemes = useCallback(() => {
    setSelectedThemes((prev) =>
      DEFAULT_THEME_IDS.every((id) => prev.includes(id))
        ? []
        : [...DEFAULT_THEME_IDS, ...prev.filter((id) => OPT_IN_THEME_IDS.includes(id))]
    );
  }, []);

  const startGame = useCallback(() => {
    savePlayers(teams.flatMap((t) => [t.player1, t.player2]));
    // Version découverte : les 60 mots offerts, remélangés à chaque tour de liste
    const shuffled = unlocked
      ? shuffleArray(getWordsForThemes(selectedThemes, lang))
      : Array.from({ length: 5 }, () => shuffleArray(freeWords(lang))).flat();
    setWordPool(shuffled);
    setWordIndex(0);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setSubTurn(0);
    setAllResults([]);
    setPhase("pre-turn");
  }, [selectedThemes, teams, lang, unlocked]);

  // ── Turn handlers ──
  const startTurn = useCallback(() => {
    setTimeLeft(timerDuration);
    setTurnWords([]);
    playSfx("gong", { volume: 0.55, rate: 1.2 });
    setPhase("playing");
    setWordAnim(true);
  }, [timerDuration]);

  const handleCorrect = useCallback(() => {
    if (phase !== "playing" || timeLeft <= 0) return;
    const word = wordPool[wordIndex];
    if (!word) {
      endTurn();
      return;
    }
    playSfx("success", { volume: 0.7 });
    setTurnWords((prev) => [...prev, { word, correct: true }]);
    setWordIndex((i) => i + 1);
    setFlashColor("green");
    setWordAnim(false);
    setTimeout(() => {
      setWordAnim(true);
      setFlashColor(null);
    }, 200);
  }, [phase, timeLeft, wordPool, wordIndex, endTurn]);

  const handlePass = useCallback(() => {
    if (phase !== "playing" || timeLeft <= 0) return;
    const word = wordPool[wordIndex];
    if (!word) {
      endTurn();
      return;
    }
    playSfx("whooshdown", { volume: 0.55 });
    setTurnWords((prev) => [...prev, { word, correct: false }]);
    setWordIndex((i) => i + 1);
    setFlashColor("red");
    setWordAnim(false);
    setTimeout(() => {
      setWordAnim(true);
      setFlashColor(null);
    }, 200);
  }, [phase, timeLeft, wordPool, wordIndex, endTurn]);

  // Annule le dernier tap (mauvais bouton) : le mot revient à l'écran.
  const handleUndo = useCallback(() => {
    if (phase !== "playing" || turnWords.length === 0) return;
    playSfx("back", { volume: 0.6 });
    setTurnWords((prev) => prev.slice(0, -1));
    setWordIndex((i) => Math.max(0, i - 1));
    setFlashColor(null);
    setWordAnim(true);
  }, [phase, turnWords.length]);

  // « Mot nul ? » : on saute le 1er mot du tour sans le compter (avant toute réponse)
  const handleReroll = useCallback(() => {
    if (phase !== "playing" || turnWords.length > 0) return;
    setWordIndex((i) => i + 1);
    setWordAnim(true);
  }, [phase, turnWords.length]);

  const turnScore = turnWords.filter((w) => w.correct).length;

  // ── Post-turn navigation ──
  const nextTeam = useCallback(() => {
    // Save turn result
    const result: TurnResult = {
      teamIndex: currentTeamIndex,
      round: currentRound,
      words: turnWords,
      score: turnWords.filter((w) => w.correct).length,
    };
    setAllResults((prev) => [...prev, result]);

    const nextIdx = currentTeamIndex + 1;
    if (nextIdx < teams.length) {
      // More teams this pass
      setCurrentTeamIndex(nextIdx);
      setPhase("pre-turn");
    } else if (subTurn === 0) {
      // Second passage : les joueurs 2 font deviner
      setSubTurn(1);
      setCurrentTeamIndex(0);
      setPhase("pre-turn");
    } else {
      // Round finished
      if (currentRound < totalRounds) {
        setPhase("round-summary");
      } else {
        // All rounds done — save and go to game over
        setPhase("game-over");
      }
    }
  }, [currentTeamIndex, currentRound, teams.length, totalRounds, turnWords, subTurn]);

  const nextRound = useCallback(() => {
    setCurrentRound((r) => r + 1);
    setCurrentTeamIndex(0);
    setSubTurn(0);
    setPhase("pre-turn");
  }, []);

  const resetGame = useCallback(() => {
    setPhase("setup");
    setAllResults([]);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setSubTurn(0);
    setWordIndex(0);
  }, []);

  const replay = useCallback(() => {
    startGame();
  }, [startGame]);

  // « Relancer la partie » (menu paramètres) : revient au setup en GARDANT les
  // noms d'équipes/joueurs + les réglages (pas besoin de tout réécrire).
  useEffect(() => {
    registerSoftReplay(() => resetGame());
    return () => registerSoftReplay(null);
  }, [resetGame]);

  // ── Final scores (for game-over, include last turn) ──
  const finalScores = teams.map((t, tIdx) => {
    // allResults already contains everything by the time we reach game-over
    const score = allResults
      .filter((r) => r.teamIndex === tIdx)
      .reduce((sum, r) => sum + r.score, 0);
    return { name: t.name, score, idx: tIdx };
  });

  const sortedFinal = [...finalScores].sort((a, b) => b.score - a.score);

  // ── Round summary scores ──
  const roundSummaryScores = teams.map((t, tIdx) => {
    const score = allResults
      .filter((r) => r.teamIndex === tIdx)
      .reduce((sum, r) => sum + r.score, 0);
    return { name: t.name, score };
  });

  // ── Render ───────────────────────────────────────────────
  const controls = (
    <>
      <ScrollTop dep={phase} />
      <TopRightControls title={t.title} rules={t.rules} accent={ACCENT} />
    </>
  );
  const input = (bg: string, big = false): React.CSSProperties => ({
    ...sticker(bg, { radius: 16, shadow: 0, border: 2.5 }),
    ...(big ? DISPLAY : {}),
    fontSize: big ? 20 : 17,
    fontWeight: big ? 700 : 600,
  });
  const words = unlocked ? getWordsForThemes(selectedThemes, lang).length : freeWords(lang).length;

  // ── SETUP ──
  if (phase === "setup") {
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <div className="flex items-end justify-center gap-1">
          <Mascot size={52} color="sky" mood="thinking" delay={0.15} shadow={false} />
          <Mascot size={80} color="yellow" mood="happy" arms cheering shadow={false} />
          <Mascot size={52} color="coral" mood="laughing" delay={0.3} shadow={false} />
        </div>
        <h1 className="mt-2 text-center text-[clamp(46px,13vw,62px)] leading-[0.92]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          {t.title}
        </h1>
        <p className="mt-2 text-center text-[17px] font-semibold">{t.tagline}</p>

        <StickerCard bg={C.cream} radius={22} shadow={5} tilt={-1} className="mt-5 p-4">
          <p className="text-[21px] leading-tight" style={DISPLAY}>{t.howTo}</p>
          <ul className="mt-2 space-y-1.5 text-[15px] font-semibold leading-snug">
            {[t.howTo1, t.howTo2, t.howTo3].map(([a, b, c], k) => (
              <li key={k}>{a}<b>{b}</b>{c}</li>
            ))}
            <li><GameInlineIcon icon={Check} />{t.howTo4[0]}<GameInlineIcon icon={ArrowRight} />{t.howTo4[1]}<GameInlineIcon icon={Undo2} />{t.howTo4[2]}</li>
          </ul>
        </StickerCard>

        {/* Équipes */}
        <div className="mt-6 w-full space-y-3">
          <SectionTitle>{t.teams}</SectionTitle>
          {teams.map((team, i) => (
            <div key={i} className="p-3" style={{ ...sticker(MASCOT_BG[TEAM_BLOB[i % TEAM_BLOB.length]], { radius: 22, shadow: 4 }), transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <Mascot size={38} color={TEAM_BLOB[i % TEAM_BLOB.length]} mood="happy" bob={false} shadow={false} />
                <input
                  type="text" value={team.name} onChange={(e) => updateTeam(i, "name", e.target.value)} placeholder={t.teamNamePh} aria-label={t.teamNameAria(i + 1)}
                  className="min-h-12 min-w-0 flex-1 px-3 outline-none" style={input("#fff", true)}
                />
                {teams.length > 2 && <GameIconButton icon={X} label={t.removeTeam} onClick={() => removeTeam(i)} />}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input type="text" value={team.player1} onChange={(e) => updateTeam(i, "player1", e.target.value)} placeholder={t.playerPh(1)} aria-label={t.playerAria(1, i + 1)}
                  className="min-h-12 min-w-0 px-3 outline-none" style={input("#fff")} />
                <input type="text" value={team.player2} onChange={(e) => updateTeam(i, "player2", e.target.value)} placeholder={t.playerPh(2)} aria-label={t.playerAria(2, i + 1)}
                  className="min-h-12 min-w-0 px-3 outline-none" style={input("#fff")} />
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-1">
            <StickerBtn bg="#fff" onClick={addTeam}><Plus size={18} strokeWidth={3} aria-hidden /> {t.addTeam}</StickerBtn>
          </div>
        </div>

        {/* Thèmes */}
        <div className="mt-7 w-full">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2 className="text-[22px] leading-tight" style={DISPLAY}>{t.themes} <span className="text-[16px]" style={{ color: "rgba(255,255,255,0.8)" }}>· {t.words(words)}</span></h2>
            {unlocked && <button type="button" onClick={selectAllThemes} className="zk-push min-h-11 shrink-0 px-3.5 text-[14px] font-bold" style={sticker(allThemesSelected ? C.cream : C.yellow, { radius: 999, shadow: 3, border: 2.5 })}>
              {allThemesSelected ? t.clearAll : t.mixAll}
            </button>}
          </div>
          {/* Grille 2 colonnes : lisible sur iPhone même avec ~30 thèmes (libellé sur 2 lignes si besoin) */}
          <div className="grid grid-cols-2 gap-2">
            {THEME_IDS.map((id) => {
              // Version découverte : 4 thèmes offerts (cochés, fixes), les autres avec cadenas → Zinzin+
              if (!unlocked) {
                const free = FREE_THEME_IDS.includes(id);
                return (
                  <button key={id} type="button"
                    onClick={free ? undefined : () => { playSfx("tap", { volume: 0.5 }); void requestPaywall(); }}
                    aria-disabled={free || undefined}
                    aria-label={free ? undefined : t.lockedTheme(t.themeLabels[id])}
                    className="zk-push flex min-h-11 min-w-0 items-center gap-1.5 px-3 py-1.5 text-left text-[14px] font-bold leading-tight"
                    style={sticker(free ? ACCENT : C.cream, { radius: 16, shadow: free ? 3 : 2, border: 2.5 })}>
                    <span className="flex w-4 shrink-0 justify-center">
                      {free ? <Check size={15} strokeWidth={3.5} aria-hidden /> : <Lock size={13} strokeWidth={3} aria-hidden />}
                    </span>
                    <span className="min-w-0">{t.themeLabels[id]}</span>
                  </button>
                );
              }
              const on = selectedThemes.includes(id);
              return (
                <button key={id} type="button" onClick={() => toggleTheme(id)} aria-pressed={on}
                  className="zk-push flex min-h-11 min-w-0 items-center gap-1.5 px-3 py-1.5 text-left text-[14px] font-bold leading-tight"
                  style={{ ...sticker(on ? (id === "adult" ? C.pink : ACCENT) : C.cream, { radius: 16, shadow: on ? 3 : 2, border: 2.5 }), opacity: on ? 1 : 0.8 }}>
                  <span className="flex w-4 shrink-0 justify-center">{on && <Check size={15} strokeWidth={3.5} aria-hidden />}</span>
                  <span className="min-w-0">{t.themeLabels[id]}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>
            {!unlocked ? t.freeNote(words) : words === 0 ? t.pickOne : t.optInNote}
          </p>
        </div>

        <div className="mt-6 w-full">
          <SectionTitle>{t.timer}</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {[30, 60, 90, 120].map((d) => (
              <Chip key={d} on={timerDuration === d} onClick={() => setTimerDuration(d)} onBg={ACCENT} className="whitespace-nowrap px-1">{t.timerChip(d)}</Chip>
            ))}
          </div>
        </div>
        <div className="mt-6 w-full">
          <SectionTitle>{t.rounds}</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((r) => (
              <Chip key={r} on={totalRounds === r} onClick={() => setTotalRounds(r)} onBg={ACCENT}>{r}</Chip>
            ))}
          </div>
        </div>

        <div className="mt-auto flex w-full flex-col items-center pt-7">
          <StickerBtn big bg={ACCENT} disabled={!canStart} onClick={startGame}>{t.start}</StickerBtn>
          {!canStart && (
            <p className="mt-2.5 text-center text-[14px] font-semibold">{t.fillNames}</p>
          )}
          <div className="mt-4">
            <IdeaButton game="Fais Deviner" kind="mot" bg={C.cream} />
          </div>
        </div>
      </StickerScreen>
    );
  }

  // ── AVANT LE TOUR ──
  if (phase === "pre-turn" && currentTeam) {
    const blob = TEAM_BLOB[currentTeamIndex % TEAM_BLOB.length];
    return (
      <StickerScreen bg={C.night} center>
        {controls}
        <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker("#fff", { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
          {t.roundTurn(currentRound, totalRounds, subTurn + 1)}
        </span>
        <div className="relative z-[1] mt-4 -mb-6">
          <PlayerBlob name={describer} color={blob} size={90} mood="happy" arms />
        </div>
        <h2 className="max-w-full break-words px-6 pb-2 pt-6 text-center text-[clamp(34px,10vw,48px)] leading-none" style={{ ...sticker(MASCOT_BG[blob], { radius: 24, shadow: 5 }), ...DISPLAY, transform: "rotate(-2deg)" }}>
          {currentTeam.name}
        </h2>
        <div className="mt-6 grid w-full grid-cols-[minmax(0,1fr)] gap-3">
          <StickerCard bg={C.yellow} radius={20} shadow={4} tilt={-1} className="px-4 py-3">
            <p className="text-[15px] font-bold">{t.describer}</p>
            <p className="text-[28px] leading-tight" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{describer}</p>
          </StickerCard>
          <StickerCard bg={C.cream} radius={20} shadow={4} tilt={1} className="px-4 py-3">
            <p className="text-[15px] font-bold">{t.guesser}</p>
            <p className="text-[28px] leading-tight" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{guesser}</p>
          </StickerCard>
        </div>
        <p className="mt-5 text-center text-[16px] font-semibold">{t.passPhone(describer, guesser)}</p>
        <div className="mt-6 w-full">
          <StickerBtn big bg={ACCENT} onClick={startTurn}>{t.letsGo}</StickerBtn>
        </div>
      </StickerScreen>
    );
  }

  // ── EN JEU ──
  if (phase === "playing") {
    const word = wordPool[wordIndex];
    const urgent = timeLeft <= 10;
    return (
      <div className="relative flex h-[100dvh] shrink-0 select-none flex-col" style={{ ...dotted(urgent ? "#5E1640" : C.night), color: "#fff", paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", transition: "background-color .5s" }}>
        <KitStyles />
        {flashColor && (
          <div className="pointer-events-none fixed inset-0 z-50" style={{ background: flashColor === "green" ? "rgba(61,220,151,0.35)" : "rgba(255,107,91,0.35)" }} />
        )}
        {/* Chrono centré (coins du haut laissés à la croix et aux réglages) */}
        <div className="flex flex-col items-center">
          <span className="px-5 py-0.5 tabular-nums leading-tight" style={{ ...sticker(urgent ? C.coral : "#fff", { radius: 999, shadow: 3 }), ...DISPLAY, fontSize: 42 }}>
            {timeLeft}
          </span>
          <span className="mt-2 text-[16px] font-bold">{currentTeam?.name} · {t.points(turnScore)}</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
          {word ? (
            <div key={wordIndex} className={`max-w-full px-5 py-4 text-center ${wordAnim ? "zk-pop" : ""}`} style={{ ...sticker(C.cream, { radius: 26, shadow: 6 }), ["--zk-r" as string]: "-2deg", transform: "rotate(-2deg)" }}>
              <h2 lang={lang} className="break-words hyphens-auto" style={{ ...DISPLAY, fontSize: wordFontSize(word), lineHeight: 1.05 }}>{word}</h2>
            </div>
          ) : (
            <p className="text-[22px]" style={DISPLAY}>{t.noMoreWords}</p>
          )}
          {turnWords.length === 0 ? (
            <div className="mt-6"><RerollButton onClick={handleReroll} label={t.reroll} /></div>
          ) : (
            <button
              type="button"
              onClick={handleUndo}
              className="zk-push mt-6 inline-flex min-h-11 items-center gap-2 px-4 text-[15px] font-bold"
              style={sticker("#fff", { radius: 999, shadow: 3, border: 2.5 })}
            >
              <Undo2 size={17} strokeWidth={3} aria-hidden /> {t.undo}
            </button>
          )}
        </div>

        {/* Zones de tap */}
        <div className="flex flex-1 items-stretch" style={{ borderTop: `3px solid ${INK}` }}>
          <button type="button" onClick={handleCorrect} className="flex w-1/2 flex-col items-center justify-center active:brightness-110" style={{ background: C.mint, color: INK, borderRight: `3px solid ${INK}`, paddingBottom: BOTTOM_PAD }}>
            <GameIconBadge icon={Check} bg="#fff" size={64} />
            <span className="mt-2 text-[22px]" style={DISPLAY}>{t.got}</span>
          </button>
          <button type="button" onClick={handlePass} className="flex w-1/2 flex-col items-center justify-center active:brightness-110" style={{ background: C.coral, color: INK, paddingBottom: BOTTOM_PAD }}>
            <GameIconBadge icon={ArrowRight} bg="#fff" size={64} />
            <span className="mt-2 text-[22px]" style={DISPLAY}>{t.skip}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── RÉSULTAT DU TOUR ──
  if (phase === "turn-result" && currentTeam) {
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker(C.coral, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
          {t.timeUp}
        </span>
        <h2 className="mt-3 max-w-full text-center text-[40px] leading-[0.95]" style={{ ...DISPLAY, overflowWrap: "anywhere", textWrap: "balance", textShadow: `3px 3px 0 ${INK}` }}>{currentTeam.name}</h2>
        <div className="mt-3 px-6 py-1.5 text-center" style={{ ...sticker(ACCENT, { radius: 22, shadow: 5 }), transform: "rotate(-2deg)" }}>
          <p className="text-[56px] leading-none" style={DISPLAY}>{turnScore}</p>
          <p className="text-[16px] font-bold">{t.wordsFound(turnScore)}</p>
        </div>
        <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
          {turnWords.map((w, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 text-[15px] font-bold" style={sticker(w.correct ? C.mint : C.cream, { radius: 999, shadow: 2, border: 2.5 })}>
              {w.correct ? <Check size={14} strokeWidth={3.5} aria-hidden /> : <X size={14} strokeWidth={3.5} aria-hidden />} {w.word}
            </span>
          ))}
          {turnWords.length === 0 && <p className="text-[16px] font-semibold">{t.noWords}</p>}
        </div>
        <div className="mt-auto w-full pt-7">
          <StickerBtn big bg={ACCENT} onClick={nextTeam}>
            {currentTeamIndex + 1 < teams.length ? t.nextTeam : subTurn === 0 ? t.nextTurn : currentRound < totalRounds ? t.seeRecap : t.finalResults}
          </StickerBtn>
        </div>
      </StickerScreen>
    );
  }

  // ── RÉCAP DE MANCHE ──
  if (phase === "round-summary") {
    const rows = [...roundSummaryScores].map((t, idx) => ({ ...t, idx })).sort((a, b) => b.score - a.score);
    return (
      <StickerScreen bg={C.night} center>
        {controls}
        <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker("#fff", { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
          {t.endOfRound(currentRound)}
        </span>
        <h2 className="mt-3 text-[48px] leading-none" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>{t.ranking}</h2>
        <div className="mt-5 w-full space-y-2">
          {rows.map((row) => {
            // Ex aequo = même rang (et même couronne)
            const rank = 1 + rows.filter((x) => x.score > row.score).length;
            return (
              <div key={row.idx} className="flex items-center gap-3 px-3" style={{ ...sticker(rank === 1 ? C.yellow : C.cream, { radius: 18, shadow: 3 }), minHeight: 54 }}>
                <span className="grid w-6 place-items-center text-[20px]" style={DISPLAY}>{rank === 1 ? <Crown size={18} strokeWidth={2.8} aria-hidden /> : rank}</span>
                <Mascot size={32} color={TEAM_BLOB[row.idx % TEAM_BLOB.length]} mood="happy" bob={false} shadow={false} />
                <span className="min-w-0 flex-1 truncate text-[18px]" style={DISPLAY}>{row.name}</span>
                <span className="text-[20px]" style={DISPLAY}>{row.score}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 w-full">
          <StickerBtn big bg={ACCENT} onClick={nextRound}>{t.round(currentRound + 1)}</StickerBtn>
        </div>
      </StickerScreen>
    );
  }

  // ── FIN DE PARTIE ──
  const top3 = sortedFinal.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const PODIUM_BG: Record<number, string> = { 1: C.yellow, 2: C.cream, 3: C.coral };
  const heights: Record<number, number> = { 1: 118, 2: 92, 3: 74 };
  return (
    <StickerScreen bg={C.night}>
      {controls}
      <ConfettiBurst count={60} />
      <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker(C.yellow, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
        {t.gameOver}
      </span>
      {sortedFinal[0] && (
        <h2 className="mt-3 text-center text-[clamp(36px,10vw,48px)] leading-[0.95]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          {sortedFinal[1] && sortedFinal[1].score === sortedFinal[0].score ? t.tie : t.wins(sortedFinal[0].name)}
        </h2>
      )}

      {/* Podium */}
      {top3.length >= 2 && (
        // 2 équipes : podium à 2 marches, centré (pas une colonne vide à droite)
        <div className={`mt-7 grid w-full items-end gap-2.5 ${top3.length === 3 ? "grid-cols-3" : "mx-auto max-w-[260px] grid-cols-2"}`}>
          {podiumOrder.map((row) => {
            // Ex aequo = même marche
            const place = sortedFinal.findIndex((x) => x.score === row.score) + 1;
            return (
              <div key={row.idx} className="flex flex-col items-center">
                <TeamBlob team={teams[row.idx]} size={place === 1 ? 72 : 54} color={TEAM_BLOB[row.idx % TEAM_BLOB.length]} mood="happy" arms cheering={place === 1} crown={place === 1} delay={place * 0.12} />
                <div className="mt-1 flex w-full flex-col items-center pt-2" style={{ ...sticker(PODIUM_BG[place], { radius: 18, shadow: 4 }), borderBottomLeftRadius: 6, borderBottomRightRadius: 6, minHeight: heights[place] }}>
                  <div className="leading-none" style={{ ...DISPLAY, fontSize: place === 1 ? 32 : 24 }}>{place}</div>
                  <div className="mt-1 line-clamp-2 w-full px-1.5 text-center text-[14px] font-bold leading-tight" lang={lang} style={{ hyphens: "auto", overflowWrap: "anywhere" }}>{row.name}</div>
                  <div className="text-[14px] font-bold">{t.points(row.score)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Classement (4e et +) */}
      {sortedFinal.length > 3 && (
        <div className="mt-4 w-full space-y-2">
          {sortedFinal.slice(3).map((row) => (
            <div key={row.idx} className="flex items-center justify-between px-4" style={{ ...sticker(C.cream, { radius: 16, shadow: 3 }), minHeight: 48 }}>
              <span className="min-w-0 truncate text-[16px] font-bold">{t.ordinal(sortedFinal.findIndex((x) => x.score === row.score) + 1)} · {row.name}</span>
              <span className="text-[18px]" style={DISPLAY}>{row.score}</span>
            </div>
          ))}
        </div>
      )}

      {!unlocked && (
        <PremiumNudge
          style={{ marginTop: 20 }}
          text={nudge.makeGuess(fmtCount(getWordsForThemes([...THEME_IDS], lang).length - freeWords(lang).length, lang))}
        />
      )}

      <div className="mt-auto flex w-full flex-col items-center pt-8">
        <StickerBtn big bg={ACCENT} onClick={replay}>{t.rematch}</StickerBtn>
        <p className="mt-2 text-center text-[14px] font-semibold text-white/75">{t.rematchHint}</p>
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          <StickerBtn bg={C.cream} onClick={resetGame}>{t.settings}</StickerBtn>
          {onReturnToLobby ? <StickerBtn bg="#fff" onClick={onReturnToLobby}>{t.quit}</StickerBtn> : <span />}
        </div>
        <div className="mt-4">
          <IdeaButton game="Fais Deviner" kind="mot" bg={C.cream} />
        </div>
      </div>
    </StickerScreen>
  );
}

/** Blob d'une équipe sur le podium : les persos des deux joueurs s'ils en ont, sinon le blob d'équipe habituel. */
function TeamBlob({ team, size, color, mood, arms, cheering, crown, delay }: {
  team?: Team; size: number; color: MascotColor; mood: "happy"; arms?: boolean; cheering?: boolean; crown?: boolean; delay?: number;
}) {
  const a = usePlayerLook(team?.player1);
  const b = usePlayerLook(team?.player2);
  if (!team || (!a && !b)) return <Mascot size={size} color={color} mood={mood} arms={arms} cheering={cheering} crown={crown} delay={delay} shadow={false} />;
  const k = Math.round(size * 0.78);
  return (
    // Même hauteur que le blob d'équipe : le podium ne bouge pas
    <div className="flex items-end justify-center" style={{ height: size * 1.15 + (crown ? size * 0.3 : 0) }}>
      <PlayerBlob name={team.player1} color={color} size={k} mood={mood} arms={arms} cheering={cheering} crown={crown} delay={delay} />
      <PlayerBlob name={team.player2} color={color} size={k} mood={mood} arms={arms} cheering={cheering} delay={(delay ?? 0) + 0.2} style={{ marginLeft: -k * 0.28 }} />
    </div>
  );
}

// Fond plein de la carte d'équipe (couleur du blob)
const MASCOT_BG: Record<MascotColor, string> = {
  purple: "#B5A1FF", pink: "#FF8FC8", yellow: "#FFD23F", mint: "#3DDC97",
  sky: "#4ECDC4", coral: "#FF6B5B", lavender: "#B5A1FF", white: "#FFF6E5",
};
