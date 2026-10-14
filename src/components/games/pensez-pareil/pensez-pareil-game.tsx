"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adultDefault } from "@/lib/party-mood";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot } from "@/components/Mascot";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { isOfflineApp } from "@/lib/offline-app";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";
import {
  ModeSelect, PassScreen, type GameMode,
  DISPLAY, ZButton, ZCard, ZChip, ZChoice, ZLink, ZScreen, ZTitle, useScrollTopOn,
} from "@/components/games/local-kit";
import { GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { getSavedDuo, saveDuo } from "@/lib/saved-players";
import { ArrowLeft, Check, Flame, Flower2, Heart, Lock, type LucideIcon } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";
import {
  recordGame,
  getProgress,
  levelFor,
  PP_BADGES,
  type RecordResult,
} from "@/lib/games/pensez-pareil-progress";
import { getLang, useT, type Lang } from "@/lib/i18n";
import { STR, promptsFor } from "@/components/games/pensez-pareil/i18n";
import {
  ANSWER_TIME,
  isMatch,
  shuffle,
  type Prompt as PPPrompt,
  type Tier as PPTier,
} from "@/components/games/pensez-pareil/pp-content";
import { useGameFinished } from "@/lib/game-finished";
import { GameRulesSheet, GameTuto, RulesIconButton, TutoAgainButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { usePPRules, usePPTuto } from "@/components/games/pensez-pareil/tuto";
import type { ReactNode } from "react";

const SYNC_BASE = 100;
const COMBO_STEP = 25;
const TOTAL_ROUNDS = 8;
const ACCENT = "#FF3EA5";
/** Couleur du jeu dans l'app (rose) */
const PP_COLOR = "#FF3EA5";

// ── Prompts (partagés avec le serveur) ────────────────────
type Tier = PPTier;
type Prompt = PPPrompt;

type Pack = "soft" | "mix" | "hot";
const PACKS: { id: Pack; icon: LucideIcon; tiers: Tier[] }[] = [
  { id: "soft", icon: Flower2, tiers: ["soft"] },
  { id: "mix", icon: Heart, tiers: ["soft", "couple"] },
  { id: "hot", icon: Flame, tiers: ["soft", "couple", "spicy"] },
];

function buildDeck(pack: Pack, lang: Lang): Prompt[] {
  const tiers = PACKS.find((p) => p.id === pack)!.tiers;
  const pool = shuffle(promptsFor(lang).filter((p) => tiers.includes(p.tier)));
  const out: Prompt[] = [];
  let i = 0;
  while (out.length < TOTAL_ROUNDS) {
    out.push(pool[i % pool.length]);
    i++;
  }
  return out;
}

// ══════════════════════════════════════════════════════════
// WRAPPER
// ══════════════════════════════════════════════════════════
export default function PensezPareilGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const t = useT(STR);
  if (mode === null) {
    return (
      <ModeSelect
        emoji="💞"
        name={t.name}
        tagline={t.tagline}
        onPick={setMode}
      />
    );
  }
  if (mode === "local") return <PensezPareilLocal onReturnToLobby={props.onReturnToLobby} />;
  return <PensezPareilOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play à deux)
// ══════════════════════════════════════════════════════════
function PensezPareilLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  type Phase = "setup" | "passA" | "typeA" | "passB" | "typeB" | "reveal" | "over";
  const t = useT(STR);
  const [phase, setPhase] = useState<Phase>("setup");
  useGameFinished(phase === "over"); // fin de partie → demande de note éventuelle (app)
  // Langue figée au début de la partie (thèmes + règles de comparaison des réponses)
  const [lang, setLang] = useState<Lang>(getLang);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [pack, setPack] = useState<Pack>(() => (adultDefault(false) ? "hot" : "mix")); // Soirée « Folle » : pack coquin
  const [deck, setDeck] = useState<Prompt[]>([]);
  const [round, setRound] = useState(0);
  const [ansA, setAnsA] = useState("");
  const [ansB, setAnsB] = useState("");
  const [syncs, setSyncs] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [teamScore, setTeamScore] = useState(0);
  // Résultat figé de la manche (évite de lire un ansB encore périmé au moment de scorer)
  const [lastResult, setLastResult] = useState<{ matched: boolean; points: number; streak: number; syncs: number }>({ matched: false, points: 0, streak: 0, syncs: 0 });
  const [inputA, setInputA] = useKeyedState<string>(`${round}-A`, "");
  const [inputB, setInputB] = useKeyedState<string>(`${round}-B`, "");

  useEffect(() => { preloadSfx(["whoosh", "confirm", "success", "ding", "ding2", "wrong", "lose", "win", "powerup", "levelup", "card-flip", "gong", "tock"]); }, []);
  useScrollTopOn(`${phase}-${round}`);
  // Tuto 1re fois (dès l'ouverture, avant les prénoms) + règles en jeu (bouton livre)
  const tuto = useFirstTimeTuto("pensez-pareil", { atMount: true });
  const tutoSlides = usePPTuto();
  const rules = usePPRules();
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesTool = <RulesIconButton onClick={() => setRulesOpen(true)} />;
  const layers = (
    <>
      {rulesOpen && <GameRulesSheet name={t.name} rules={rules} onClose={() => setRulesOpen(false)} onTuto={tuto.show} />}
      {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
    </>
  );

  const prompt = deck[round] ?? null;
  const nameA = names[0] || t.player(1);
  const nameB = names[1] || t.player(2);

  const begin = (n: [string, string], p: Pack) => {
    const l = getLang();
    setLang(l);
    setNames(n); setPack(p); setDeck(buildDeck(p, l));
    setRound(0); setSyncs(0); setStreak(0); setBestStreak(0); setTeamScore(0);
    setPhase("passA");
  };

  // « Pas fou ? » : thème remplacé par un thème du même pack jamais tiré dans la partie
  const rerollPrompt = () => {
    const tiers = PACKS.find((x) => x.id === pack)!.tiers;
    const used = new Set(deck.map((d) => d.text));
    const pool = promptsFor(lang).filter((x) => tiers.includes(x.tier) && !used.has(x.text));
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    playSfx("card-flip", { volume: 0.6, delay: 0.1 });
    setDeck((d) => d.map((x, i) => (i === round ? pick : x)));
  };

  const resolveReveal = (bAns: string) => {
    const m = isMatch(ansA, bAns, lang);
    const pts = m ? SYNC_BASE + streak * COMBO_STEP : 0;
    const nStreak = m ? streak + 1 : 0;
    const nSyncs = syncs + (m ? 1 : 0);
    if (m) {
      setStreak(nStreak);
      setBestStreak((b) => Math.max(b, nStreak));
      setSyncs(nSyncs);
      setTeamScore((t) => t + pts);
    } else {
      setStreak(0);
    }
    // Suspense… puis sync (ça monte avec la série) ou raté
    playCombo("drumroll");
    if (m) { playSfx("success", { volume: 0.9, delay: 1.05 }); playSfx("ding", { volume: 0.7, rate: 1 + Math.min(nStreak, 5) * 0.08, delay: 1.25 }); }
    else { playSfx("wrong", { volume: 0.8, delay: 1.05 }); playSfx("lose", { volume: 0.5, delay: 1.12 }); }
    setLastResult({ matched: m, points: pts, streak: nStreak, syncs: nSyncs });
  };

  if (phase === "setup") {
    return <><CoupleSetup pack={pack} onBack={onReturnToLobby} onStart={begin} tools={rulesTool} onTuto={tuto.show} />{layers}</>;
  }
  if (phase === "passA") {
    return <><PassScreen toName={nameA} colorIndex={0} accent={PP_COLOR}
      hint={t.passA}
      onReady={() => setPhase("typeA")} />{layers}</>;
  }
  if (phase === "typeA") {
    return <><TypeScreen prompt={prompt} player={nameA} idx={0} round={round + 1}
      value={inputA} onChange={setInputA} onReroll={rerollPrompt} tools={rulesTool}
      onSubmit={() => { playSfx("confirm", { volume: 0.7 }); setAnsA(inputA.trim()); setPhase("passB"); }} />{layers}</>;
  }
  if (phase === "passB") {
    return <PassScreen toName={nameB} colorIndex={1} accent={PP_COLOR}
      hint={t.passB(nameA)}
      onReady={() => setPhase("typeB")} />;
  }
  if (phase === "typeB") {
    return <><TypeScreen prompt={prompt} player={nameB} idx={1} round={round + 1}
      value={inputB} onChange={setInputB} tools={rulesTool}
      onSubmit={() => { const b = inputB.trim(); setAnsB(b); resolveReveal(b); setPhase("reveal"); }} />{layers}</>;
  }
  if (phase === "reveal") {
    return (
      <>
      <RevealScreen
        tools={rulesTool}
        prompt={prompt} matched={lastResult.matched} points={lastResult.points} streak={lastResult.streak}
        names={[nameA, nameB]} answers={[ansA, ansB]}
        round={round + 1} total={TOTAL_ROUNDS} syncs={lastResult.syncs}
        onNext={() => {
          if (round + 1 >= TOTAL_ROUNDS) {
            // fin de partie : le son suit le verdict affiché (même seuils que l'écran final)
            const s = lastResult.syncs;
            if (s >= TOTAL_ROUNDS * 0.75) playCombo("fanfare");
            else if (s >= TOTAL_ROUNDS / 2) playSfx("win", { volume: 0.7 });
            else playSfx("lose", { volume: 0.6 });
            setPhase("over");
          }
          else { setRound((r) => r + 1); setPhase("passA"); }
        }}
      />
      {layers}
      </>
    );
  }
  // over
  return (
    <GameOverScreen
      teamScore={teamScore} syncs={syncs} total={TOTAL_ROUNDS} bestStreak={bestStreak}
      onReplay={() => setPhase("setup")} onReturnToLobby={onReturnToLobby}
    />
  );
}

/** Prénom coupé à 16 caractères : pas de tiret / espace qui traîne à la fin (« Jean-Christophe- »). */
const cleanName = (n: string) => n.trim().replace(/[\s\-–'’.]+$/u, "");

// ── Setup couple (2 joueurs + pack + niveau actuel) ───────
function CoupleSetup({ pack, onStart, onBack, tools, onTuto }: {
  pack: Pack;
  tools?: ReactNode;
  onTuto?: () => void;
  onStart: (names: [string, string], pack: Pack) => void;
  onBack?: () => void;
}) {
  // Le dernier duo est pré-rempli (mémoire des prénoms)
  const [a, setA] = useState(() => getSavedDuo()[0]);
  const [b, setB] = useState(() => getSavedDuo()[1]);
  const [sel, setSel] = useState<Pack>(pack);
  const t = useT(STR);
  const lvl = levelFor(getProgress().xp);
  const can = !!(a.trim() && b.trim());
  const COLORS: Record<Pack, string> = { soft: "#3DDC97", mix: "#FFD23F", hot: "#FF3EA5" };

  return (
    <ZScreen tools={tools}>
      <div className="flex items-end gap-3">
        <ZTitle as="h1" size={48} style={{ lineHeight: 0.92 }}>{t.name}</ZTitle>
        <div className="-mb-1 shrink-0"><Mascot size={66} color="pink" mood="love" shadow={false} /></div>
      </div>
      <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
        {t.intro}
      </p>
      <ZChip bg="#FFD23F" tilt={-2} className="mt-3">{t.yourLevel(t.levels[lvl.index] ?? lvl.name)}</ZChip>

      <ZTitle size={28} className="mt-7">{t.youTwo}</ZTitle>
      <div className="mt-3 flex flex-col gap-3">
        {[{ v: a, set: setA, i: 0 }, { v: b, set: setB, i: 1 }].map(({ v, set, i }) => (
          <div key={i} className="flex items-center gap-3 rounded-[20px] py-1.5 pl-2 pr-3"
            style={{ background: "#fff", border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}`, rotate: `${i ? 1 : -1}deg` }}>
            <PlayerBlob name={v.trim()} colorIndex={i} size={42} mood="happy" bob={false} />
            <input value={v} onChange={(e) => set(e.target.value.slice(0, 16))}
              placeholder={i === 0 ? t.yourName : t.theirName} aria-label={i === 0 ? t.yourName : t.partnerAria}
              autoCorrect="off" autoCapitalize="words" spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-2 outline-none"
              style={{ ...DISPLAY, fontSize: 22, color: GAME_INK, letterSpacing: "-0.01em" }} />
          </div>
        ))}
      </div>

      <ZTitle size={28} className="mt-7">{t.vibe}</ZTitle>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {PACKS.map((pk, i) => (
          <ZChoice key={pk.id} active={sel === pk.id} color={COLORS[pk.id]} onClick={() => setSel(pk.id)} tilt={i === 1 ? 1.5 : -1.5} className="px-2.5 text-center">
            <pk.icon size={24} strokeWidth={2.6} className="mx-auto" aria-hidden />
            {/* Centré comme l'icône (ZChoice force text-left sur le bouton) */}
            <p className="mt-1 text-center text-[17px] leading-none" style={DISPLAY}>{t.packs[pk.id].label}</p>
            <p className="mt-1 text-center text-[13px] font-semibold leading-tight" style={{ textWrap: "balance" }}>{t.packs[pk.id].sub}</p>
          </ZChoice>
        ))}
      </div>

      <div className="mt-6 flex justify-center"><IdeaButton game="Pensez Pareil" kind="thème" /></div>
      {onTuto && <TutoAgainButton onClick={onTuto} className="mt-2" />}
      <div className="min-h-6 flex-1" />
      <ZButton bg={PP_COLOR} disabled={!can} onClick={() => { if (!can) return; const n: [string, string] = [cleanName(a), cleanName(b)]; saveDuo(n); onStart(n, sel); }}>
        {can ? t.go : t.bothNames}
      </ZButton>
      {onBack && !isOfflineApp() && <ZLink onClick={onBack} className="mt-2"><GameInlineIcon icon={ArrowLeft} /> Retour</ZLink>}
    </ZScreen>
  );
}

// ══════════════════════════════════════════════════════════
// MODE ONLINE
// ══════════════════════════════════════════════════════════
interface PPState {
  phase: "waiting" | "config" | "intro" | "answer" | "reveal" | "game-over";
  paused?: boolean;
  ambiance?: "classic" | "spicy";
  connectedCount?: number;
  isSpectator?: boolean;
  round: number;
  totalRounds: number;
  timeLeft: number;
  prompt: Prompt | null;
  syncs: number;
  streak: number;
  bestStreak: number;
  teamScore: number;
  matched: boolean | null;
  lastPoints: number | null;
  answers: Record<string, string | null> | null;
  players: { id: string; name: string; hasAnswered: boolean; present?: boolean }[];
  myAnswer: string | null;
}

function PensezPareilOnline({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "pensez-pareil", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as PPState;

  const [input, setInput] = useKeyedState<string>(`${state?.round ?? 0}-ans`, "");
  const submit = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    sendAction({ action: "submit-answer", answer: t });
  }, [input, sendAction]);

  if (!state || state.phase === "waiting") {
    const waitingPartner = state?.players && state.players.length < 2;
    return <Centered emoji="💞" text={waitingPartner ? "En attente de ton/ta partenaire…" : "Connexion…"} />;
  }

  // Au-delà de 2 joueurs : spectateur (la partie se joue à deux)
  if (state.isSpectator && state.phase !== "game-over") {
    return <Centered emoji="👀" text="Pensez Pareil se joue à deux : tu regardes cette partie en spectateur." />;
  }

  // Partenaire déconnecté : jeu en pause
  if (state.paused) {
    return <Centered emoji="⏸️" text="En attente de ton/ta partenaire… La manche reprendra à son retour." />;
  }

  // ── CONFIG : choix de l'ambiance ──
  if (state.phase === "config") {
    const amb = state.ambiance ?? "classic";
    const ready = (state.connectedCount ?? 0) >= 2;
    const OPTS: { id: "classic" | "spicy"; icon: LucideIcon; label: string; sub: string }[] = [
      { id: "classic", icon: Heart, label: "Classique", sub: "Tout public + notre vie à deux" },
      { id: "spicy", icon: Flame, label: "Coquin 18+", sub: "Ça monte en température" },
    ];
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),24px)] text-white">
        <Mascot size={78} color="pink" mood="love" arms shadow={false} />
        <h1 className="cb-display-lg mt-1">Pensez Pareil</h1>
        <p className="mt-2 max-w-xs text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Un thème, 35 s, chacun écrit 1 ou 2 mots en secret. Même réponse = sync !
        </p>
        <p className="af-eyebrow mt-6 mb-2">Ambiance</p>
        <div className="grid w-full max-w-sm grid-cols-2 gap-2">
          {OPTS.map((o) => {
            const on = amb === o.id;
            return (
              <button key={o.id} onClick={() => sendAction({ action: "set-ambiance", ambiance: o.id })}
                className="rounded-2xl border p-3 text-center transition active:scale-95"
                style={{ background: on ? `${ACCENT}22` : "rgba(255,255,255,0.04)", borderColor: on ? `${ACCENT}88` : "var(--line-soft)" }}>
                <o.icon size={24} strokeWidth={2.6} className="mx-auto" aria-hidden />
                <div className="mt-1 text-sm font-bold">{o.label}</div>
                <div className="mt-0.5 text-xs leading-tight" style={{ color: "var(--text-muted)" }}>{o.sub}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => sendAction({ action: "begin-game" })} disabled={!ready}
          className="af-btn af-btn-primary mt-7 w-full max-w-sm disabled:opacity-40" style={{ fontSize: 16 }}>
          {ready ? "C'est parti 💞" : "En attente de ton/ta partenaire…"}
        </button>
        <p className="mt-3 text-center text-xs" style={{ color: "var(--text-muted)" }}>L&apos;un de vous deux peut choisir et lancer.</p>
      </div>
    );
  }

  if (state.phase === "intro") {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),24px)]">
        <Sparkles count={10} />
        <p className="af-eyebrow mb-5">Manche {state.round} / {state.totalRounds}</p>
        <Mascot size={120} color="pink" mood="love" arms delay={0} />
        <h2 className="cb-display-xl mt-4 text-center" style={{ fontSize: "clamp(1.8rem,7vw,3rem)" }}>Pensez pareil…</h2>
        <p className="mt-4 max-w-xs animate-pulse text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Un thème arrive — 35 s pour répondre la même chose en 1 ou 2 mots, sans vous parler !
        </p>
      </div>
    );
  }

  if (state.phase === "answer") {
    const me = state.players?.find((p) => p.id === playerId);
    const other = state.players?.find((p) => p.id !== playerId);
    if (me?.hasAnswered || state.myAnswer != null) {
      return (
        <div className="flex flex-1 flex-col items-center p-5 pt-[max(env(safe-area-inset-top),20px)]">
          <RoundBar round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} streak={state.streak} />
          <PromptCard prompt={state.prompt} />
          <div className="mt-8 rounded-3xl border px-6 py-5 text-center"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)" }}>
            <div className="flex justify-center"><GameIconBadge icon={Check} bg="#3DDC97" size={52} /></div>
            <p className="mt-2 font-bold">Réponse envoyée !</p>
            <p className="mt-1 animate-pulse text-sm" style={{ color: "var(--text-dim)" }}>
              {other?.hasAnswered ? "Révélation…" : `On attend ${other?.name ?? "l'autre"}…`}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center p-5 pt-[max(env(safe-area-inset-top),20px)]">
        <RoundBar round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} streak={state.streak} />
        <PromptCard prompt={state.prompt} />
        <AnswerInput value={input} onChange={setInput} onSubmit={submit} />
      </div>
    );
  }

  if (state.phase === "reveal") {
    const ids = state.players?.map((p) => p.id) ?? [];
    const names = state.players?.map((p) => p.name) ?? [];
    const answers: [string, string] = [
      state.answers?.[ids[0]] ?? "—",
      state.answers?.[ids[1]] ?? "—",
    ];
    return (
      <RevealScreen
        prompt={state.prompt} matched={!!state.matched} points={state.lastPoints ?? 0} streak={state.streak}
        names={[names[0] ?? "J1", names[1] ?? "J2"]} answers={answers}
        round={state.round} total={state.totalRounds} syncs={state.syncs} auto
      />
    );
  }

  if (state.phase === "game-over") {
    return (
      <GameOverScreen
        teamScore={state.teamScore} syncs={state.syncs} total={state.totalRounds} bestStreak={state.bestStreak}
        onReturnToLobby={onReturnToLobby}
      />
    );
  }

  return <Centered emoji="💞" text={error ?? "Chargement…"} />;
}

// ══════════════════════════════════════════════════════════
// COMPOSANTS PARTAGÉS
// ══════════════════════════════════════════════════════════
function PromptCard({ prompt, timed = true }: { prompt: Prompt | null; timed?: boolean }) {
  const t = useT(STR);
  if (!prompt) return null;
  const tierLabel = prompt.tier === "spicy" ? t.tierSpicy : prompt.tier === "couple" ? t.tierCouple : t.tierSoft;
  const tierColor = prompt.tier === "spicy" ? "#FF3EA5" : prompt.tier === "couple" ? "#FFD23F" : "#3DDC97";
  return (
    <div className="mt-6 w-full">
      <div className="relative rounded-[26px] px-5 pb-5 pt-7 text-center"
        style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 6px 0 ${GAME_INK}`, rotate: "-1.5deg" }}>
        <span className="absolute -top-4 left-1/2 inline-flex min-h-8 -translate-x-1/2 items-center rounded-full px-3 text-[14px] font-bold"
          style={{ background: tierColor, border: `2.5px solid ${GAME_INK}`, rotate: "-3deg" }}>{tierLabel}</span>
        <p style={{ ...DISPLAY, fontSize: prompt.text.length > 40 ? 28 : 34, lineHeight: 1.02, textWrap: "balance" }}>{prompt.text}</p>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: "#4A3A66" }}>{t.wordsHint(timed)}</p>
      </div>
    </div>
  );
}

function AnswerInput({ value, onChange, onSubmit }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void;
}) {
  const t = useT(STR);
  return (
    <div className="mt-6 w-full">
      <input
        autoFocus value={value} maxLength={40}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        placeholder={t.placeholder}
        aria-label={t.placeholder.replace(/…$/, "")}
        autoCorrect="off" autoCapitalize="off" spellCheck={false} autoComplete="off"
        className="w-full rounded-[20px] px-5 py-4 text-center outline-none"
        style={{ ...DISPLAY, fontSize: 24, background: "#FFF6E5", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}` }}
      />
      <ZButton bg="#FFD23F" className="mt-5" onClick={onSubmit} disabled={!value.trim()}>
        <Lock size={20} strokeWidth={2.8} aria-hidden /> {t.lock}
      </ZButton>
    </div>
  );
}

function RoundBar({ round, total, timeLeft, streak }: {
  round: number; total: number; timeLeft?: number; streak: number;
}) {
  const t = useT(STR);
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <ZChip bg="#fff" tilt={-2}>{t.round(round, total)}</ZChip>
        {streak > 0 && <ZChip bg="#FFD23F" tilt={2}><Flame size={15} strokeWidth={3} aria-hidden /> {t.streak(streak)}</ZChip>}
      </div>
      {timeLeft != null && (
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full" style={{ background: "#fff", border: `2.5px solid ${GAME_INK}` }}>
          <div className="h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, (timeLeft / ANSWER_TIME) * 100))}%`, background: timeLeft <= 5 ? "#FF3EA5" : "#3DDC97" }} />
        </div>
      )}
    </div>
  );
}

// ── Reveal (sync ou raté) ─────────────────────────────────
function RevealScreen({
  prompt, matched, points, streak, names, answers, round, total, syncs, onNext, auto, tools,
}: {
  tools?: ReactNode;
  prompt: Prompt | null; matched: boolean; points: number; streak: number;
  names: [string, string]; answers: [string, string];
  round: number; total: number; syncs: number;
  onNext?: () => void; auto?: boolean;
}) {
  const t = useT(STR);
  return (
    <ZScreen bg={matched ? PP_COLOR : undefined} tools={tools}>
      {matched && <ConfettiBurst count={50} />}
      <div className="flex flex-wrap items-center gap-2">
        <ZChip bg="#fff" tilt={-2}>{t.round(round, total)}</ZChip>
        <ZChip bg="#FFD23F" tilt={2}>{t.syncs(syncs)}</ZChip>
      </div>
      <ZTitle size={56} className="mt-4">{matched ? t.sync : t.almost}</ZTitle>
      <p className="mt-1 text-[17px] font-bold">
        {matched ? t.ptsLine(points, streak) : t.noMatch}
      </p>
      {prompt && <p className="mt-4 text-[16px] font-semibold" style={{ opacity: 0.9 }}>{prompt.text}</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[22px] px-3 pb-4 pt-3 text-center"
            style={{ background: i ? "#FFF6E5" : "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 5px 0 ${GAME_INK}`, rotate: `${i ? 2 : -2}deg` }}>
            <div className="flex justify-center"><PlayerBlob name={names[i]} colorIndex={i} size={44} mood={matched ? "love" : "shocked"} bob={false} />
</div>
            <p className="mt-1 truncate text-[14px] font-bold">{names[i]}</p>
            {/* Réponse longue (40 car. max) : plus petite, sans césure au milieu des mots */}
            <p className="mt-1 leading-tight" style={{ ...DISPLAY, fontSize: (answers[i] ?? "").length > 18 ? 18 : (answers[i] ?? "").length > 10 ? 21 : 24, overflowWrap: "anywhere" }}>{answers[i] || "—"}</p>
          </div>
        ))}
      </div>

      <div className="min-h-8 flex-1" />
      {auto ? (
        <p className="mt-6 animate-pulse text-center text-[15px] font-bold">{t.nextRound}…</p>
      ) : (
        <ZButton bg={matched ? "#FFD23F" : PP_COLOR} onClick={onNext}>
          {round >= total ? t.seeBond : t.nextRound}
        </ZButton>
      )}
    </ZScreen>
  );
}

// ── Game over + progression persistante ───────────────────
function GameOverScreen({
  teamScore, syncs, total, bestStreak, onReplay, onReturnToLobby,
}: {
  teamScore: number; syncs: number; total: number; bestStreak: number;
  onReplay?: () => void; onReturnToLobby?: () => void;
}) {
  const t = useT(STR);
  const recordedRef = useRef(false);
  const [result, setResult] = useState<RecordResult | null>(null);

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    const r = recordGame({ syncs, bestStreak, perfect: syncs === total && total > 0 });
    if (r.leveledUp) playSfx("chime", { volume: 0.8, delay: 1.6 }); // après la fanfare, pas par-dessus
    setResult(r);
  }, [syncs, bestStreak, total]);

  const lvl = result?.toLevel ?? levelFor(getProgress().xp);
  const xp = result?.after.xp ?? getProgress().xp;
  const span = lvl.next === Infinity ? 1 : lvl.next - lvl.min;
  const into = lvl.next === Infinity ? 1 : (xp - lvl.min) / span;
  const pct = Math.max(0, Math.min(100, into * 100));

  return (
    <ZScreen bg={PP_COLOR}>
      <ConfettiBurst count={50} />
      <ZTitle size={48} className="text-center">{t.totalSyncs(syncs, total)}</ZTitle>
      <p className="mt-1 text-center text-[17px] font-bold">{syncs >= total * 0.75 ? t.great : syncs >= total / 2 ? t.good : t.practice}</p>

      <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
        <Stat label={t.score} value={teamScore} />
        <Stat label={t.syncsLabel} value={`${syncs}/${total}`} />
        <Stat label={t.bestStreak} value={`×${bestStreak}`} />
      </div>

      {/* Carte complicité */}
      <ZCard bg="#fff" tilt={-1.5} shadow={6} radius={24} className="mt-6 px-4 pb-4 pt-3">
        {result?.leveledUp && <ZChip bg="#FFD23F" tilt={-3} className="mb-2">{t.levelUp}</ZChip>}
        <div className="flex items-center gap-3">
          <Mascot size={52} color="pink" mood="love" shadow={false} bob={false} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">{t.ourBond}</p>
            <p className="text-[22px] leading-tight" style={{ ...DISPLAY, textWrap: "balance" }}>{t.levels[lvl.index] ?? lvl.name}</p>
          </div>
          <div className="text-right">
            <p className="whitespace-nowrap text-[20px]" style={DISPLAY}>{xp} XP</p>
            {lvl.next !== Infinity && <p className="whitespace-nowrap text-[13px] font-semibold">{t.xpLeft(lvl.next - xp)}</p>}
          </div>
        </div>
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full" style={{ background: "#F1ECFF", border: `2.5px solid ${GAME_INK}` }}>
          <div className="h-full transition-[width] duration-700" style={{ width: `${pct}%`, background: PP_COLOR }} />
        </div>
        {result && result.newBadges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.newBadges.map((bd) => (
              <ZChip key={bd} bg="#FFD23F" tilt={0}>{t.badges[bd] ?? PP_BADGES[bd]?.label}</ZChip>
            ))}
          </div>
        )}
      </ZCard>

      <div className="min-h-8 flex-1" />
      {onReplay && <ZButton bg="#FFD23F" onClick={onReplay}>{t.playAgain}</ZButton>}
      <div className="mt-4 flex justify-center"><IdeaButton game="Pensez Pareil" kind="thème" bg="#fff" /></div>
      {onReturnToLobby && <ZLink onClick={onReturnToLobby} color={GAME_INK} className="mt-2">{t.backHome}</ZLink>}
    </ZScreen>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[18px] px-2 py-2.5" style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}` }}>
      <p className="text-[24px] leading-none" style={DISPLAY}>{value}</p>
      <p className="mt-1 text-[13px] font-bold">{label}</p>
    </div>
  );
}

// ── Saisie (local) ────────────────────────────────────────
function TypeScreen({ prompt, player, idx, round, value, onChange, onSubmit, onReroll, tools }: {
  tools?: ReactNode;
  prompt: Prompt | null; player: string; idx: number; round: number;
  value: string; onChange: (v: string) => void; onSubmit: () => void; onReroll?: () => void;
}) {
  const t = useT(STR);
  return (
    <ZScreen tools={tools}>
      <div className="flex flex-wrap items-center gap-2">
        <ZChip bg="#fff" tilt={-2}>{t.round(round, TOTAL_ROUNDS)}</ZChip>
        <ZChip bg={idx ? "#FF3EA5" : "#7A4EE8"} tilt={2}>{t.answers(player)}</ZChip>
      </div>
      <PromptCard prompt={prompt} timed={false} />
      {onReroll && !value.trim() && (
        <div className="mt-5 flex justify-center"><RerollButton label={t.reroll} onClick={onReroll} /></div>
      )}
      <AnswerInput value={value} onChange={onChange} onSubmit={() => value.trim() && onSubmit()} />
    </ZScreen>
  );
}

function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--line-soft)", boxShadow: `0 0 40px ${ACCENT}33` }}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="max-w-xs animate-pulse text-center text-lg" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}
