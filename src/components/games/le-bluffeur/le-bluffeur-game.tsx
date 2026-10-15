"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";
import {
  ModeSelect, PlayersSetup, PassScreen, type GameMode,
  DISPLAY, ZButton, ZCard, ZChip, ZLink, ZRanking, ZScreen, ZTitle, useScrollTopOn,
} from "@/components/games/local-kit";
import { TheatreScreen, QuestionBillboard, RecWave, BLUFF_COLOR } from "@/components/games/le-bluffeur/theatre";
import { GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { getLang, pick as pickLang, useT } from "@/lib/i18n";
import { STR, questionsFor } from "@/components/games/le-bluffeur/i18n";
import { Smartphone, Target } from "lucide-react";
import { GameInlineIcon } from "@/components/games/game-icon-button";
import { uniqueMin, useGameFinished, winnersOf } from "@/lib/game-finished";
import { WIN_STR } from "@/lib/winners-text";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { ShareResultButton } from "@/components/games/share-result-button";
import { rankingCard } from "@/lib/share-cards";
import { GameTuto, RulesIconButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { BluffRules, useBluffSlides } from "@/components/games/le-bluffeur/tuto";
import { SoireeNextButton } from "@/components/games/soiree-next";

interface BluffPlayerState {
  id: string;
  name: string;
  score: number;
  hasFake: boolean;
  hasVoted: boolean;
  foundTruth: boolean | null;
  connected?: boolean;
}

interface OptionState {
  id: string;
  text: string;
  isTruth: boolean | null;
  authors: string[] | null;
  authorIds: string[] | null;
  voterNames: string[] | null;
  voteCount: number | null;
}

interface BluffState {
  phase: "waiting" | "writing" | "voting" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  timeLeft: number;
  connectedCount?: number;
  minPlayers?: number;
  question: string | null;
  trueAnswer: string | null;
  options: OptionState[] | null;
  roundPoints: Record<string, number> | null;
  players: BluffPlayerState[];
  myFake: string | null;
  myVote: string | null;
  iFoundTruth: boolean;
  myOptionId?: string | null;
  spectator?: boolean;
}

// Stable color per player
const COLORS: MascotColor[] = ["purple", "pink", "yellow", "mint", "sky", "coral", "lavender"];
function colorFor(id: string): MascotColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

const normFake = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ");

interface LocalOption { id: number; text: string; authors: number[]; isTruth: boolean; }

// ── WRAPPER : le joueur choisit local ou online ───────────
export default function LeBluffeurGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const t = useT(STR);
  if (mode === null) {
    return (
      <ModeSelect emoji="🎭" name={t.name}
        tagline={t.tagline}
        onPick={setMode} />
    );
  }
  if (mode === "local") return <LeBluffeurLocal onReturnToLobby={props.onReturnToLobby} />;
  return <LeBluffeurOnline {...props} onSwitchLocal={() => setMode("local")} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play)
// ══════════════════════════════════════════════════════════
const TOTAL_LOCAL_ROUNDS = 5;

function LeBluffeurLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  const t = useT(STR);
  // Vote final : un seul écran commun (tél au milieu), plus de passage de main en main
  type Phase = "setup" | "question" | "pass-write" | "write" | "table" | "vote" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  // fin de partie → demande de note éventuelle + stats de la bande (app)
  useGameFinished(phase === "over", { loser: uniqueMin(players, scores), scores: { names: players, values: scores } });
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState(() => [...questionsFor(getLang())].sort(() => Math.random() - 0.5));
  const [fakes, setFakes] = useState<string[]>([]);
  const [wroteTruth, setWroteTruth] = useState<boolean[]>([]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [options, setOptions] = useState<LocalOption[]>([]);
  const [votes, setVotes] = useState<number[]>([]); // optionId per player, -1 = none
  const [draft, setDraft] = useState("");
  // Tuto 1re fois (dès l'ouverture, avant les prénoms) + règles en jeu (bouton livre, en haut à droite)
  const tuto = useFirstTimeTuto("le-bluffeur", { atMount: true });
  const tutoSlides = useBluffSlides();
  const [rulesOpen, setRulesOpen] = useState(false);
  const tools = (
    <>
      <RulesIconButton onClick={() => setRulesOpen(true)} />
      {rulesOpen && <BluffRules onClose={() => setRulesOpen(false)} onTuto={tuto.show} />}
      {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
    </>
  );

  const total = players.length;
  const q = questions[(round - 1) % questions.length] ?? null;
  const totalRounds = Math.min(TOTAL_LOCAL_ROUNDS, questions.length);

  useEffect(() => { preloadSfx(["card-flip", "card-shuffle", "confirm", "select", "whoosh", "gong", "coins", "win", "powerup", "ding", "wrong", "tick"]); }, []);
  useScrollTopOn(`${phase}-${turnIdx}-${round}`);

  // « Pas fou ? » : la question est retirée de la pioche → la suivante (jamais vue) prend sa place
  const rerollQuestion = () => {
    if (questions.length <= TOTAL_LOCAL_ROUNDS) return;
    const at = (round - 1) % questions.length;
    playSfx("card-flip", { volume: 0.6, delay: 0.1 });
    setQuestions((qs) => qs.filter((_, i) => i !== at));
  };

  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    // Nouvelle pioche à chaque partie (sinon « Nouvelle partie » rejouerait les mêmes questions)
    // … dans la langue choisie, figée pour la partie
    setQuestions([...questionsFor(getLang())].sort(() => Math.random() - 0.5));
    startRound(1, names);
  };
  const startRound = (r: number, names = players) => {
    setRound(r);
    setFakes(names.map(() => ""));
    setWroteTruth(names.map(() => false));
    setVotes(names.map(() => -1));
    setOptions([]);
    setTurnIdx(0);
    setDraft("");
    playSfx("card-flip", { volume: 0.7 });
    setPhase("question");
  };

  const buildOptions = (allFakes: string[], truth: string) => {
    const truthN = normFake(truth);
    const map = new Map<string, { text: string; authors: number[] }>();
    const wt = players.map(() => false);
    allFakes.forEach((f, i) => {
      const n = normFake(f);
      if (!f.trim()) return;
      if (n === truthN) { wt[i] = true; return; }
      const ex = map.get(n);
      if (ex) ex.authors.push(i); else map.set(n, { text: f.trim(), authors: [i] });
    });
    const opts: LocalOption[] = [];
    let id = 0;
    for (const { text, authors } of map.values()) opts.push({ id: id++, text, authors, isTruth: false });
    opts.push({ id: id++, text: truth, authors: [], isTruth: true });
    const shuffled = opts.sort(() => Math.random() - 0.5);
    setWroteTruth(wt);
    setOptions(shuffled);
    return { opts: shuffled, wt };
  };

  const resolve = (finalVotes: number[], opts: LocalOption[] = options, wt: boolean[] = wroteTruth) => {
    const pts = players.map(() => 0);
    finalVotes.forEach((optId, voter) => {
      if (optId < 0) return;
      // Ceux qui ont écrit la vraie réponse votent comme tout le monde (pour ne rien trahir), sans effet
      if (wt[voter]) return;
      const opt = opts.find((o) => o.id === optId);
      if (!opt) return;
      if (opt.isTruth) pts[voter] += 30;
      // Voter pour son propre bluff ne rapporte rien (le vote est public : on ne peut pas l'interdire sans trahir l'auteur)
      else if (!opt.authors.includes(voter)) opt.authors.forEach((a) => { pts[a] += 20; });
    });
    wt.forEach((w, i) => { if (w) pts[i] += 15; });
    setScores((s) => s.map((v, i) => v + pts[i]));
    // Révélation : gong, puis pluie de pièces s'il y a eu des points
    playCombo("reveal");
    if (pts.some((p) => p > 0)) playSfx("coins", { volume: 0.7, delay: 0.55 });
    setPhase("reveal");
  };

  if (phase === "setup") {
    return (
      <>
        <PlayersSetup emoji="🎭" name={t.name} min={3} max={8} accent={BLUFF_COLOR} onStart={begin} onBack={onReturnToLobby}
          footer={<IdeaButton game="Le Bluffeur" kind="question" />} />
        {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
      </>
    );
  }
  if (phase === "question") {
    return (
      <TheatreScreen round={round} total={totalRounds} tools={tools}>
        <QuestionBillboard question={q?.question ?? null} />
        <p className="mt-6 text-[16px] font-semibold leading-snug">
          {t.intro}
        </p>
        <div className="mt-5 flex justify-center">
          <RerollButton label={t.rerollQ} onClick={rerollQuestion} />
        </div>
        <div className="min-h-8 flex-1" />
        <ZButton bg={GAME_INK} onClick={() => { setTurnIdx(0); setDraft(""); setPhase("pass-write"); }}>
          {t.action}
        </ZButton>
      </TheatreScreen>
    );
  }
  if (phase === "pass-write") {
    return <PassScreen toName={players[turnIdx]} colorIndex={turnIdx} accent={BLUFF_COLOR}
      hint={t.passWrite} onReady={() => { setDraft(""); setPhase("write"); }} />;
  }
  if (phase === "write") {
    return (
      <TheatreScreen round={round} total={totalRounds} tools={tools}>
        <QuestionBillboard question={q?.question ?? null} />
        <div className="mt-6">
          <BluffInput value={draft} onChange={setDraft} autoFocus onSubmit={() => {}} />
        </div>
        <div className="min-h-8 flex-1" />
        <ZButton bg={GAME_INK} disabled={!draft.trim()} onClick={() => {
          playSfx("confirm", { volume: 0.7 });
          const nf = [...fakes]; nf[turnIdx] = draft.trim(); setFakes(nf);
          if (turnIdx < total - 1) { setTurnIdx(turnIdx + 1); setDraft(""); setPhase("pass-write"); }
          else {
            const built = buildOptions(nf, q?.answer ?? "");
            playSfx("card-shuffle", { volume: 0.7, delay: 0.15 });
            // Tout le monde a écrit la vraie réponse : rien à voter
            if (built.wt.every(Boolean)) resolve(players.map(() => -1), built.opts, built.wt);
            else { setVotes(players.map(() => -1)); setPhase("table"); }
          }
        }}>{t.validateBluff}</ZButton>
      </TheatreScreen>
    );
  }
  if (phase === "table") {
    // Le dernier bluffeur pose le tél au centre : écran neutre, rien de secret
    return (
      <TheatreScreen round={round} total={totalRounds} tools={tools}>
        <ZTitle size={38} className="mt-2 text-center">{t.tableTitle}</ZTitle>
        <div className="mt-6 flex justify-center gap-1.5">
          {players.map((n, i) => (
            <PlayerBlob key={i} name={n} colorIndex={i} size={players.length > 6 ? 34 : 42} mood={i % 2 ? "shifty" : "sus"} delay={i * 0.15} />
          ))}
        </div>
        <p className="mt-6 text-center text-[16px] font-semibold leading-snug">{t.tableHint}</p>
        <div className="min-h-8 flex-1" />
        <ZButton bg={GAME_INK} onClick={() => { playSfx("whoosh", { volume: 0.5 }); setPhase("vote"); }}>{t.tableBtn}</ZButton>
      </TheatreScreen>
    );
  }
  if (phase === "vote") {
    return (
      <CommonVote tools={tools} players={players} options={options} votes={votes} question={q?.question ?? ""}
        onVote={(voter, optId) => { playSfx("select", { volume: 0.6 }); setVotes((v) => v.map((x, i) => (i === voter ? optId : x))); }}
        onReveal={() => resolve(votes)} />
    );
  }
  if (phase === "reveal") {
    const truth = options.find((o) => o.isTruth);
    const bluffs = options.filter((o) => !o.isTruth);
    // (ceux qui ont écrit la vraie réponse sont cités à part, +15)
    const finders = truth ? votes.map((v, i) => (v === truth.id && !wroteTruth[i] ? players[i] : null)).filter(Boolean) : [];
    return (
      <ZScreen tools={tools}>
        <ConfettiBurst count={30} />
        <ZChip bg="#fff" tilt={-2}>{t.round(round, totalRounds)}</ZChip>
        <ZTitle size={38} className="mt-3">{t.trueAnswer}</ZTitle>
        <ZCard bg={BLUFF_COLOR} tilt={-1.5} shadow={6} radius={26} className="mt-4 px-5 pb-5 pt-4">
          <p className="text-[15px] font-semibold leading-snug">{q?.question?.replace(/\s*_{2,}\.?/g, "…")}</p>
          <p className="mt-2 break-words" style={{ ...DISPLAY, fontSize: 34, lineHeight: 1 }}>{q?.answer}</p>
          {finders.length > 0 && <p className="mt-3 text-[15px] font-bold">{t.foundBy}<NameList names={finders as string[]} /> · +30</p>}
          {wroteTruth.some(Boolean) && (
            <p className="mt-1 text-[15px] font-bold"><GameInlineIcon icon={Target} />{t.writtenBy}<NameList names={players.filter((_, i) => wroteTruth[i])} /> · +15</p>
          )}
        </ZCard>
        {bluffs.length > 0 && <ZTitle size={28} className="mt-8">{t.theBluffs}</ZTitle>}
        <div className="mt-3 flex flex-col gap-3">
          {bluffs.map((o, i) => {
            // Un vote pour son propre bluff ne compte pas
            const voters = votes.map((v, k) => (v === o.id && !o.authors.includes(k) && !wroteTruth[k] ? players[k] : null)).filter(Boolean);
            return (
              <ZCard key={o.id} bg={voters.length ? "#FF3EA5" : "#fff"} tilt={i % 2 ? 1 : -1} shadow={4} radius={20} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-[19px] leading-tight" style={DISPLAY}>{o.text}</p>
                  {voters.length > 0 && <span className="shrink-0 text-[20px]" style={DISPLAY}>+{voters.length * 20}</span>}
                </div>
                <p className="mt-1 text-[14px] font-semibold">
                  {t.by}<NameList names={o.authors.map((a) => players[a])} />{o.authors.length > 1 && voters.length ? t.each : ""}
                  {voters.length ? <>{t.fooled}<NameList names={voters as string[]} /></> : t.nobodyFell}
                </p>
              </ZCard>
            );
          })}
        </div>
        <ZButton bg={BLUFF_COLOR} className="mt-8" onClick={() => {
          if (round >= totalRounds) { playCombo("fanfare"); setPhase("over"); } else startRound(round + 1);
        }}>{round >= totalRounds ? t.seeScores : t.nextRound}</ZButton>
      </ZScreen>
    );
  }
  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], colorIndex: i })).sort((a, b) => b.score - a.score);
  // Couronnés = règle unique (la même que la Soirée) : ex æquo en tête = tous, toute la table = personne
  const winners = winnersOf({ names: players, values: scores });
  const wt = pickLang(WIN_STR);
  return (
    <ZScreen bg={BLUFF_COLOR} tools={tools}>
      <ConfettiBurst count={50} />
      <ZTitle size={wt.names(winners).length > 9 ? 30 : 40} className="text-center">{winners.length ? <><span className="whitespace-nowrap">{wt.names(winners)},</span>{t.bluffAce}</> : wt.allTied}</ZTitle>
      <div className="mt-6"><ZRanking rows={ranking} winners={winners} /></div>
      <div className="min-h-8 flex-1" />
      <SoireeNextButton className="mb-3" />
      <ZButton bg={GAME_INK} onClick={() => begin(players)}>{t.playAgain}</ZButton>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <ZButton size="sm" bg="#fff" style={{ width: "auto" }} onClick={() => setPhase("setup")}>{t.changePlayers}</ZButton>
        <IdeaButton game="Le Bluffeur" kind="question" bg="#fff" />
        <ShareResultButton card={() => rankingCard("le-bluffeur", ranking)} />
      </div>
      {onReturnToLobby && <ZLink onClick={onReturnToLobby} color={GAME_INK} className="mt-2">{t.backHome}</ZLink>}
    </ZScreen>
  );
}

const LETTERS = "ABCDEFGHIJ";

/**
 * Vote commun (tél au milieu de la table) : chacun vote À SON TOUR, devant tout le monde,
 * sur le même écran (propositions sans auteur, aucune info privée, rien à se repasser).
 */
function CommonVote({ players, options, votes, question, onVote, onReveal, tools }: {
  tools?: ReactNode;
  players: string[];
  options: LocalOption[];
  votes: number[];
  question: string;
  onVote: (voter: number, optId: number) => void;
  onReveal: () => void;
}) {
  const t = useT(STR);
  const done = votes.filter((v) => v >= 0).length;
  const [turn, setTurn] = useState(() => Math.max(0, votes.findIndex((v) => v < 0)));
  const all = done === players.length && turn >= players.length;
  const cur = Math.min(turn, players.length - 1);
  const pick = (optId: number) => {
    onVote(cur, optId);
    // joueur suivant qui n'a pas encore voté (sinon : fin du vote)
    const next = players.findIndex((_, k) => k > cur && votes[k] < 0);
    setTurn(next >= 0 ? next : players.length);
  };
  const back = () => {
    const before = all ? players.length : cur;
    for (let k = before - 1; k >= 0; k--) if (votes[k] >= 0) { setTurn(k); return; }
  };
  return (
    <ZScreen tools={tools}>
      <ZChip bg={BLUFF_COLOR} tilt={-2}>{t.voteChip} · {t.votesCount(done, players.length)}</ZChip>
      <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{question.replace(/\s*_{2,}\.?/g, "…")}</p>
      {/* Ordre de vote : celui qui vote est mis en avant */}
      <div className="mt-4 flex flex-wrap items-end justify-center gap-2">
        {players.map((name, p) => (
          <div key={p} className="flex flex-col items-center" style={{ opacity: !all && p !== cur && votes[p] < 0 ? 0.55 : 1 }}>
            <PlayerBlob name={name} colorIndex={p} size={!all && p === cur ? 52 : 36} mood={votes[p] >= 0 ? "happy" : p === cur ? "thinking" : "sus"} bob={false} />
            <span className="mt-0.5 max-w-[64px] truncate text-[12px] font-bold" style={{ color: votes[p] >= 0 ? "#3DDC97" : "#fff" }}>{name}</span>
          </div>
        ))}
      </div>
      {!all ? (
        <>
          <ZTitle size={30} className="mt-5">{t.voteTurn(players[cur])}</ZTitle>
          <p className="mt-1 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{t.voteHow}</p>
          <div className="mt-4 flex flex-col gap-3">
            {options.map((o, i) => (
              <button key={o.id} type="button" onClick={() => pick(o.id)}
                className="flex items-center gap-3 rounded-[20px] px-3 py-3 text-left transition-transform active:scale-[0.98]"
                style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}`, rotate: `${i % 2 ? 0.6 : -0.6}deg` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[20px]" style={{ ...DISPLAY, background: BLUFF_COLOR, border: `2.5px solid ${GAME_INK}` }}>{LETTERS[i]}</span>
                <span className="min-w-0 break-words text-[18px] leading-tight" style={{ ...DISPLAY, letterSpacing: "-0.01em" }}>{o.text}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{t.ownNote}</p>
        </>
      ) : (
        <>
          <ZTitle size={30} className="mt-6 text-center">{t.votesCount(done, players.length)}</ZTitle>
          <ZButton bg={GAME_INK} className="mt-6" onClick={onReveal}>{t.revealBtn}</ZButton>
        </>
      )}
      {done > 0 && <ZLink color="#fff" className="mt-4" onClick={back}>{t.prevVoter}</ZLink>}
    </ZScreen>
  );
}

/** Liste de prénoms : un prénom composé ne se coupe jamais au tiret. */
function NameList({ names }: { names: string[] }) {
  return <>{names.map((n, i) => <Fragment key={i}>{i ? ", " : ""}<span className="whitespace-nowrap">{n}</span></Fragment>)}</>;
}

/** Champ du bluff : bloc blanc sticker, police ≥ 16 px (pas de zoom iOS). */
function BluffInput({ value, onChange, onSubmit, autoFocus, inputRef }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; autoFocus?: boolean;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const t = useT(STR);
  return (
    <div className="rounded-[20px] px-4 pb-3 pt-2.5" style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}` }}>
      <div className="flex items-center justify-between text-[14px] font-bold">
        <span>{t.inputLabel}</span>
        <span style={{ color: "#6B5C88" }}>{value.length}/80</span>
      </div>
      {/* Zone multi-ligne : un bluff long reste lisible en entier (pas de défilement horizontal) */}
      <textarea
        ref={inputRef}
        value={value} onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
        placeholder={t.placeholder} maxLength={80} autoComplete="off" autoFocus={autoFocus}
        rows={value.length > 22 ? 3 : 2} enterKeyHint="done"
        className="mt-1 w-full resize-none bg-transparent leading-tight outline-none"
        style={{ ...DISPLAY, fontSize: value.length > 40 ? 19 : 22, color: GAME_INK, letterSpacing: "-0.01em" }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MODE ONLINE (multi-appareils) — inchangé
// ══════════════════════════════════════════════════════════
function LeBluffeurOnline({ roomCode, playerId, playerName, onSwitchLocal }: GameProps & { onSwitchLocal: () => void }) {
  const { sendAction } = useGame(roomCode, "le-bluffeur", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as BluffState;

  const writeKey = `${state?.round ?? 0}-write`;
  const [fakeInput, setFakeInput] = useKeyedState<string>(writeKey, "");
  const fakeRef = useRef<HTMLTextAreaElement>(null);

  const submitFake = useCallback(() => {
    const t = fakeInput.trim();
    if (!t || state?.myFake) return;
    sendAction({ action: "submit-fake", fake: t });
  }, [fakeInput, state?.myFake, sendAction]);

  const vote = useCallback((optionId: string) => {
    if (state?.myVote) return;
    sendAction({ action: "vote", optionId });
  }, [state?.myVote, sendAction]);

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    const min = state?.minPlayers ?? 3;
    const count = state?.connectedCount ?? 0;
    if (state && count < min) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center"
             style={{ paddingTop: "max(env(safe-area-inset-top), 24px)", paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}>
          <div className="mx-auto mb-5"><Mascot size={80} color="purple" mood="shifty" arms shadow={false} /></div>
          <p className="cb-display-sm">En attente de joueurs ({count}/{min})</p>
          <p className="mt-2 max-w-xs text-sm" style={{ color: "var(--text-dim)" }}>
            Il faut au moins {min} joueurs en ligne pour que les bluffs piègent quelqu&apos;un — ou jouez sur un seul téléphone en vous le passant.
          </p>
          <button onClick={onSwitchLocal} className="af-btn af-btn-primary mt-6 w-full max-w-xs">
            <GameInlineIcon icon={Smartphone} /> Jouer sur ce téléphone
          </button>
        </div>
      );
    }
    return <Centered emoji="🎭" text="Préparation des questions…" />;
  }

  // ── SPECTATEUR (arrivé en cours de manche) ─────────────
  if (state.spectator && state.phase !== "game-over") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center"
           style={{ paddingTop: "max(env(safe-area-inset-top), 24px)", paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}>
        <Mascot size={72} color="yellow" mood="happy" shadow={false} />
        <p className="cb-display-sm mt-4">Partie en cours</p>
        <p className="mt-2 max-w-xs text-sm" style={{ color: "var(--text-dim)" }}>
          Tu es arrivé pendant la manche {state.round}/{state.totalRounds}. Tu entres en jeu dès la prochaine manche !
        </p>
        {state.question && (
          <p className="mt-5 max-w-sm rounded-2xl border px-4 py-3 text-sm" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)", color: "var(--text-dim)" }}>
            {state.question}
          </p>
        )}
        <PlayerProgress players={state.players} done={(p) => (state.phase === "writing" ? p.hasFake : p.hasVoted)} selfId={playerId} />
      </div>
    );
  }

  // ── WRITING (DA théâtre) ────────────────────────────────
  if (state.phase === "writing") {
    const submitted = !!state.myFake;
    return (
      <TheatreScreen round={state.round} total={state.totalRounds}>
        <QuestionBillboard question={state.question} take={`prise ${String(state.round).padStart(2, "0")}`} />
        <RecWave timeLeft={state.timeLeft} max={40} />
        <div className="mt-5">
          {!submitted ? (
            <>
              <BluffInput value={fakeInput} onChange={setFakeInput} onSubmit={submitFake} inputRef={fakeRef} />
              <ZButton bg={GAME_INK} className="mt-4" onClick={submitFake} disabled={!fakeInput.trim()}>Envoyer mon bluff</ZButton>
            </>
          ) : (
            <ZCard bg="#fff" tilt={1} shadow={4} radius={20} className="px-5 py-4 text-center">
              <p className="text-[16px] font-bold">Bluff envoyé ! {state.players.filter((p) => p.hasFake).length}/{state.players.filter((p) => p.connected !== false).length} prêts</p>
            </ZCard>
          )}
          <div className="mt-4"><PlayerProgress players={state.players} done={(p) => p.hasFake} selfId={playerId} /></div>
        </div>
      </TheatreScreen>
    );
  }

  // ── VOTING ──────────────────────────────────────────────
  if (state.phase === "voting") {
    const voted = !!state.myVote;
    return (
      <Shell round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} label="Trouve la VRAIE réponse">
        {/* Reminder of question */}
        <div className="mx-auto mt-3 max-w-md rounded-xl border border-dashed px-4 py-2"
             style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.15)" }}>
          <p className="af-eyebrow mb-1">La question</p>
          <p className="text-sm" style={{ color: "var(--text-dim)", lineHeight: 1.35 }}>{state.question}</p>
        </div>

        {state.iFoundTruth ? (
          <Waiting text="Tu as écrit la vraie réponse ! En attente des votes des autres..." />
        ) : !voted ? (
          <div className="w-full max-w-md mt-4 space-y-2">
            {state.options?.map((o, i) => {
              const isMine = !!state.myOptionId && o.id === state.myOptionId;
              return (
                <button
                  key={o.id}
                  onClick={() => !isMine && vote(o.id)}
                  disabled={isMine}
                  className={cn(
                    "w-full text-left rounded-2xl border px-4 py-3.5 transition-all flex items-center gap-3",
                    isMine
                      ? "cursor-not-allowed opacity-40"
                      : "active:scale-[0.99]",
                  )}
                  style={{
                    background: isMine ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                    borderColor: isMine ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black"
                       style={{
                         background: "rgba(255,255,255,0.08)",
                         color: "var(--text-muted)",
                         fontFamily: "var(--font-display)",
                       }}>
                    {"ABCDEFGH"[i]}
                  </div>
                  <span className="min-w-0 break-words text-sm text-white/85">
                    {o.text}
                    {isMine && <span className="ml-2 text-xs text-white/40">(ton bluff)</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <Waiting text="Vote enregistré ! En attente des autres..." />
        )}
        <PlayerProgress players={state.players} done={(p) => p.hasVoted} selfId={playerId} />
      </Shell>
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const myPts = state.roundPoints?.[playerId] ?? 0;
    const truthOption = state.options?.find(o => o.isTruth);
    const bluffs = state.options?.filter(o => !o.isTruth) ?? [];
    const playerById = new Map(state.players.map(p => [p.id, p]));

    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto p-5"
           style={{
             paddingTop: "max(env(safe-area-inset-top), 20px)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)", 
             background: "radial-gradient(circle at 50% 25%, #FF3EA5 0%, #5B36D6 40%, #0E0828 100%)",
           }}>
        <ConfettiBurst count={60} />
        <Sparkles count={14} />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-4">
            <p className="af-eyebrow" style={{ color: "var(--af-yellow)", letterSpacing: 3 }}>✦ La vraie réponse ✦</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{state.question}</p>
          </div>

          {/* TRUTH CARD — spectacular big yellow */}
          {truthOption && (
            <div
              className="relative mb-5 rounded-3xl p-5"
              style={{
                background: "linear-gradient(160deg, var(--af-yellow), #FFA800)",
                boxShadow: "0 20px 60px rgba(255,210,63,0.5), 0 0 0 4px rgba(255,210,63,0.2)",
                animation: "af-slide-up .6s ease-out",
              }}
            >
              <div className="absolute left-1/2 -top-3 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black tracking-wider"
                   style={{ background: "var(--af-mint)", color: "#0E0828" }}>
                VÉRITÉ ✓
              </div>
              <p className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.55)" }}>La bonne réponse était…</p>
              <p className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#1A0E2E", letterSpacing: -0.5, lineHeight: 1.1 }}>
                {state.trueAnswer ?? truthOption.text}
              </p>
              {(truthOption.voterNames?.length ?? 0) > 0 && (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                   style={{ background: "rgba(0,0,0,0.12)", color: "#3A1B00" }}>
                  ✓ Trouvée par {truthOption.voterNames?.join(", ")}
                </p>
              )}
              {state.players.some((p) => p.foundTruth) && (
                <p className="mt-2 text-xs font-bold" style={{ color: "#3A1B00" }}>
                  <GameInlineIcon icon={Target} /> Écrite pile par {state.players.filter((p) => p.foundTruth).map((p) => p.name).join(", ")} (+15)
                </p>
              )}
            </div>
          )}

          {/* BLUFFS UNVEILED */}
          <p className="af-eyebrow mb-2 text-center" style={{ color: "var(--text-muted)" }}>✘ Les bluffs démasqués</p>
          <div className="space-y-2">
            {bluffs.map((o) => {
              const authorId = o.authorIds?.[0];
              const authorNames = o.authors ?? [];
              const color: MascotColor = authorId ? colorFor(authorId) : "coral";
              const voterCount = o.voteCount ?? 0;
              return (
                <div key={o.id}
                     className="flex items-center gap-3 rounded-2xl border p-3"
                     style={{
                       background: "rgba(0,0,0,0.4)",
                       borderColor: "rgba(255,255,255,0.08)",
                       backdropFilter: "blur(6px)",
                     }}>
                  <MascotAvatar color={color} size={32} mood={voterCount > 0 ? "wink" : "neutral"} border={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 truncate text-xs font-bold">{authorNames.length ? authorNames.join(" & ") : "?"}</span>
                      <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>{authorNames.length > 1 ? "ont écrit :" : "a écrit :"}</span>
                    </div>
                    <p className="break-words text-xs italic" style={{ color: "var(--text-dim)" }}>
                      &ldquo;{o.text}&rdquo;
                    </p>
                    {voterCount > 0 && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Piégé : {o.voterNames?.join(", ")}</p>
                    )}
                  </div>
                  {voterCount > 0 ? (
                    <span className="cb-mono text-xs font-bold" style={{ color: "var(--af-mint)" }}>
                      +{voterCount * 20}{authorNames.length > 1 ? " chacun" : ""}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>0 piégé</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* YOUR POINTS */}
          <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border px-5 py-3"
               style={{
                 background: "rgba(91,54,214,0.18)",
                 borderColor: "rgba(91,54,214,0.45)",
               }}>
            <span className="text-sm">Tu marques</span>
            <span className="cb-display-md" style={{ color: "var(--af-yellow)", fontSize: 24 }}>+{myPts} pts</span>
          </div>
          <p className="mt-3 animate-pulse text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Manche suivante…
          </p>
        </div>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    return <BluffScoreboard players={state.players} playerId={playerId} />;
  }

  return <Centered emoji="🎭" text={error ?? "Chargement..."} />;
}

// ── Sub-components ────────────────────────────────────────
function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6"
         style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}>
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border"
           style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", boxShadow: "0 0 40px rgba(91,54,214,0.3)" }}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="animate-pulse text-center text-lg" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}

function Shell({
  round, total, timeLeft, max, label, children,
}: {
  round: number; total: number; timeLeft: number; max: number; label: string; children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center p-5 md:p-6"
         style={{ paddingTop: "max(env(safe-area-inset-top), 12px)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
      {/* Coin haut-droit réservé au bouton réglages du shell */}
      <div className="flex min-h-[44px] w-full max-w-md items-center gap-3 pr-14">
        <span className="af-chip">Manche {round}/{total}</span>
        <span className={cn("cb-mono text-lg font-bold", timeLeft <= 5 ? "animate-pulse" : "")}
              style={{ color: timeLeft <= 5 ? "var(--af-coral)" : "var(--text-muted)" }}>
          {timeLeft}s
        </span>
      </div>
      <div className="mb-3 mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
             style={{
               width: `${(timeLeft / max) * 100}%`,
               background: "linear-gradient(90deg, var(--cb-brand), var(--af-pink))",
             }} />
      </div>
      <p className="af-eyebrow mb-3" style={{ color: "var(--af-yellow)" }}>{label}</p>
      {children}
    </div>
  );
}

function QuestionCard({ question }: { question: string | null }) {
  return (
    <div className="relative w-full max-w-md mt-3">
      <div className="absolute" style={{ inset: "8px -6px -6px 6px", background: "rgba(255,62,165,0.4)", borderRadius: 28, filter: "blur(0.5px)" }} />
      <div className="absolute" style={{ inset: "4px -3px -3px 3px", background: "rgba(91,54,214,0.6)", borderRadius: 28 }} />
      <div className="relative rounded-3xl p-6"
           style={{
             background: "linear-gradient(160deg, #F5F1E8 0%, #FFE4D2 100%)",
             boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
           }}>
        <div className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-base font-black text-white"
             style={{ background: "var(--cb-brand)", fontFamily: "var(--font-display)" }}>
          ?
        </div>
        <p className="text-xl text-center leading-snug"
           style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#1A0E2E", letterSpacing: -0.4 }}>
          {question}
        </p>
      </div>
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

function PlayerProgress({ players, done, selfId }: {
  players: BluffPlayerState[];
  done: (p: BluffPlayerState) => boolean;
  selfId: string;
}) {
  return (
    <div className="mt-auto flex flex-wrap justify-center gap-2 pt-5">
      {players?.map((p) => {
        const c = colorFor(p.id);
        const isDone = done(p);
        return (
          <div key={p.id} className="relative">
            <MascotAvatar color={c} size={36} mood={isDone ? "wink" : "shifty"} border={p.id === selfId} />
            {isDone && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black text-white"
                   style={{ background: "var(--af-mint)", borderColor: "#0E0828" }}>
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BluffScoreboard({ players, playerId }: { players: BluffPlayerState[]; playerId: string }) {
  const sorted = [...(players ?? [])].sort((a, b) => b.score - a.score);
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-6"
         style={{ paddingTop: "max(env(safe-area-inset-top), 24px)", paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}>
      <ConfettiBurst count={50} />
      <div className="relative z-10 w-full max-w-sm">
        <p className="af-eyebrow text-center" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
        <h2 className="cb-display-lg text-center mt-2">Résultats</h2>
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
