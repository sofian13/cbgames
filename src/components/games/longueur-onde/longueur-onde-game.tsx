"use client";

import { useCallback, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";
import { ModeSelect, PlayersSetup, PassScreen, colorForIndex, type GameMode } from "@/components/games/local-kit";
import { SynthwaveScreen, NeonConsole, CassetteInput } from "@/components/games/longueur-onde/synthwave";
import { Lock, MoveHorizontal } from "lucide-react";
import { GameInlineIcon } from "@/components/games/game-icon-button";

// ── Spectres pour le mode local (mêmes que le serveur) ────
const LOCAL_SPECTRUMS: Spectrum[] = [
  { left: "Ta mère approuverait", right: "Ta mère appellerait un prêtre" },
  { left: "Dimanche soir déprime", right: "Vendredi soir 23h" },
  { left: "Truc de boomer", right: "Truc de Gen Z" },
  { left: "Red flag", right: "Green flag" },
  { left: "Ça passe en story", right: "Ça reste en amis proches" },
  { left: "Mon banquier est fier", right: "Mon banquier pleure" },
  { left: "Message vu à 8h", right: "Message vu à 4h du mat" },
  { left: "Ça sent le linge propre", right: "Ça sent le vestiaire" },
  { left: "Réveil tout frais", right: "Réveil de zombie" },
  { left: "Truc de daron", right: "Truc de gamin" },
  { left: "Pote fiable", right: "Pote qui ghoste" },
  { left: "Même pas de 2e date", right: "Présenté(e) aux parents" },
  { left: "Faisable un lundi", right: "Seulement en vacances" },
  { left: "Personne ne remarque", right: "Tout le bureau en parle" },
  { left: "Phrase de drague gênante", right: "Phrase de drague qui marche" },
  { left: "Gâteau de mamie", right: "Plat de chef étoilé" },
  { left: "Ça se dit au repas de famille", right: "Surtout pas au repas de famille" },
  { left: "Un 👍 suffit", right: "Ça mérite un vocal de 5 min" },
  { left: "Normal à 30 ans", right: "Bizarre à 30 ans" },
  { left: "Énergie de figurant", right: "Énergie de perso principal" },
  { left: "Silence gênant", right: "Fou rire général" },
  { left: "Lit défait toute la semaine", right: "Appart de catalogue" },
  { left: "Moment de solitude", right: "Moment de gloire" },
  { left: "Ça craque au premier lavage", right: "Indestructible" },
  { left: "Ça se règle par SMS", right: "Ça se règle en face" },
  { left: "Calme plat", right: "Drama de télé-réalité" },
  { left: "Anecdote oubliée demain", right: "Histoire racontée à ton mariage" },
  { left: "Talent de canapé", right: "Talent de scène" },
  { left: "Fond de placard", right: "Repas de fête" },
  { left: "Un peu fatigué(e)", right: "Je dors trois jours" },
  { left: "Ça vaut un mot d'excuse", right: "Ça vaut une démission" },
  { left: "Truc de collégien", right: "Truc d'adulte responsable" },
  { left: "Pas besoin de tuto", right: "Faut un tuto de 2h" },
  { left: "Spoiler pardonnable", right: "Spoiler impardonnable" },
  { left: "Ça fait sourire", right: "Ça fait pleurer de rire" },
  { left: "Vibe bibliothèque", right: "Vibe festival" },
  { left: "Prénom de chien", right: "Prénom de bébé" },
  { left: "Mérite un like", right: "Mérite d'être partagé partout" },
  { left: "Tenue pour sortir les poubelles", right: "Tenue de mariage" },
  { left: "Coloc de rêve", right: "Coloc de l'enfer" },
  { left: "Hygiène de vie de moine", right: "Hygiène de vie de rockstar" },
  { left: "Repas de régime", right: "Repas de lendemain de soirée" },
  { left: "Discret comme un ninja", right: "Discret comme une fanfare" },
  { left: "Je l'avoue au premier date", right: "Je l'emporte dans la tombe" },
  { left: "Deux minutes de retard", right: "J'ai raté mon train" },
  { left: "Sport de chill", right: "Sport de guerrier" },
  { left: "Réaction de mamie", right: "Réaction d'ado" },
  { left: "Zéro stress", right: "Stress d'entretien d'embauche" },
  { left: "Musique d'ascenseur", right: "Son de fin de soirée" },
  { left: "Plus vieux que tes parents", right: "Sorti la semaine dernière" },
  { left: "Cringe", right: "Iconique" },
  { left: "Idée de premier date", right: "Idée de dixième date" },
  { left: "Ça se fait seul(e)", right: "Ça se fait à quinze" },
  { left: "Snack de 16h", right: "Festin de Noël" },
  { left: "Personnalité de chat", right: "Personnalité de chien" },
  { left: "Mensonge pieux", right: "Mensonge d'État" },
  { left: "Petit plaisir", right: "Bonheur absolu" },
  { left: "Week-end sous la couette", right: "Week-end sans dormir" },
  { left: "Effort minimum", right: "Effort olympique" },
  { left: "Avis de tonton", right: "Avis d'expert" },
  { left: "Swipe à gauche", right: "Swipe à droite" },
  { left: "OK dès 8 ans", right: "Interdit aux moins de 18 ans" },
  { left: "Énergie de lundi matin", right: "Énergie de samedi soir" },
  { left: "Romantique comme un ticket de caisse", right: "Romantique comme un film de Noël" },
  { left: "Truc qu'on assume", right: "Truc qu'on cache à ses potes" },
  { left: "Sage comme une image", right: "Coquin(e) assumé(e)" },
  { left: "Ça se pardonne", right: "On en reparlera dans 10 ans" },
  { left: "Vibe camping", right: "Vibe palace" },
];

function localPoints(d: number): number {
  if (d <= 5) return 5;
  if (d <= 12) return 3;
  if (d <= 22) return 2;
  return 0;
}
// Un indice sans aucune lettre (ex. « 73 ») donnerait directement la cible
function clueProblem(clue: string): string | null {
  const c = clue.trim();
  if (!c) return null;
  if (!/\p{L}/u.test(c)) return "Pas de chiffres seuls : donne un mot ou un exemple !";
  return null;
}
function shuffleArr<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

// ── WRAPPER : le joueur choisit local ou online ───────────
export default function LongueurOndeGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (mode === null) {
    return (
      <ModeSelect emoji="📡" name="Le Curseur"
        tagline="Un Médium voit une cible secrète entre 0 et 100 et donne un indice (un mot, un exemple) : retrouvez-la sur le curseur."
        onPick={setMode} />
    );
  }
  if (mode === "local") return <LongueurOndeLocal onReturnToLobby={props.onReturnToLobby} />;
  return <LongueurOndeOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play, coopératif, Médium tournant)
// ══════════════════════════════════════════════════════════
function LongueurOndeLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  type Phase = "setup" | "pass" | "clue" | "guess" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [psychic, setPsychic] = useState(0);
  const [spectrums] = useState(() => shuffleArr(LOCAL_SPECTRUMS));
  const [target, setTarget] = useState(50);
  const [clue, setClue] = useState("");
  const [guess, setGuess] = useState(50);
  const [clueInput, setClueInput] = useKeyedState<string>(`${round}-localclue`, "");

  const total = players.length;
  const spectrum = spectrums[(round - 1) % spectrums.length] ?? null;
  const lastPts = localPoints(Math.abs(guess - target));

  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    setPsychic(0); setRound(1);
    setTarget(8 + Math.floor(Math.random() * 85)); setClue(""); setPhase("pass");
  };
  const startRound = (r: number, p: number) => {
    setRound(r); setPsychic(p);
    setTarget(8 + Math.floor(Math.random() * 85)); setClue(""); setPhase("pass");
  };

  if (phase === "setup") {
    return <PlayersSetup emoji="📡" name="Le Curseur" min={2} max={8} accent="#36d0e0" onStart={begin} onBack={onReturnToLobby} />;
  }
  if (phase === "pass") {
    return <PassScreen toName={players[psychic]} colorIndex={psychic} accent="#36d0e0"
      hint="Toi seul regardes l'écran : tu vas voir la cible secrète." onReady={() => setPhase("clue")} />;
  }
  if (phase === "clue") {
    return (
      <SynthwaveScreen round={round} total={total} spectrum={spectrum}>
        <NeonConsole readout="TARGET LOCKED">
          <SpectrumDial spectrum={spectrum} target={target} mode="psychic" />
          <p className="mt-1 text-center" style={{ fontFamily: "var(--font-mono-face)", fontSize: 12, color: "var(--af-yellow)", letterSpacing: 1 }}><GameInlineIcon icon={Lock} /> {players[psychic]} : toi seul vois la cible — annonce ton indice à voix haute</p>
        </NeonConsole>
        <CassetteInput value={clueInput} onChange={setClueInput}
          placeholder="Ton indice (à l'oral aussi)"
          error={clueProblem(clueInput)}
          onSubmit={() => { if (clueProblem(clueInput)) return; setClue(clueInput.trim() || "(à l'oral)"); setGuess(50); setPhase("guess"); }} />
        <div className="pb-20" />
      </SynthwaveScreen>
    );
  }
  if (phase === "guess") {
    return <GuessBoard key={`${round}-localguess`} spectrum={spectrum} clue={clue} round={round} total={total}
      timeLeft={null} submitted={false} psychicName={players[psychic]} role="Équipe"
      note="Mode local coopératif : discutez ensemble et placez UN seul curseur pour toute l'équipe. Les points vont au Médium."
      onSubmit={(g) => { setGuess(g); setPhase("reveal"); }} />;
  }
  if (phase === "reveal") {
    const markers = [{ value: guess, label: "Équipe", isMe: true, color: colorForIndex(psychic) }];
    const bull = lastPts >= 5;
    return (
      <div className="relative flex min-h-[100svh] flex-col items-center p-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] text-white"
        style={{ background: "radial-gradient(circle at 50% 12%, rgba(54,208,224,0.28), transparent 45%), #0E0828" }}>
        {bull && <ConfettiBurst count={40} />}
        <Sparkles count={6} />
        <p className="af-eyebrow mt-3" style={{ color: "var(--af-yellow)" }}>{bull ? "✦ Dans le mille !" : "Révélation"}</p>
        <h2 className="cb-display-lg mt-1">+<span style={{ color: "var(--af-yellow)" }}>{lastPts}</span> pts · {players[psychic]}</h2>
        <ClueBadge clue={clue} authorName={players[psychic]} />
        <SpectrumDial spectrum={spectrum} target={target} markers={markers} mode="reveal" />
        <button onClick={() => {
          const ns = [...scores]; ns[psychic] += lastPts; setScores(ns);
          if (round >= total) setPhase("over"); else startRound(round + 1, (psychic + 1) % total);
        }} className="af-btn af-btn-primary mt-6 w-full max-w-md">
          {round >= total ? "Voir les scores" : "Manche suivante"}
        </button>
      </div>
    );
  }
  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], i })).sort((a, b) => b.score - a.score);
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)] text-white"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(54,208,224,0.3), transparent 45%), #0E0828" }}>
      <ConfettiBurst count={50} />
      <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
      <h2 className="cb-display-lg mt-1 mb-5">Meilleur Médium</h2>
      <div className="w-full max-w-sm space-y-2">
        {ranking.map((p, idx) => (
          <div key={p.i} className="flex items-center justify-between rounded-2xl border p-4"
            style={{ background: idx === 0 ? "rgba(54,208,224,0.14)" : "rgba(255,255,255,0.04)", borderColor: idx === 0 ? "rgba(54,208,224,0.5)" : "var(--line-soft)" }}>
            <div className="flex items-center gap-3">
              <span className="cb-mono w-7 font-bold" style={{ color: idx === 0 ? "var(--af-yellow)" : "var(--text-muted)" }}>#{idx + 1}</span>
              <MascotAvatar color={colorForIndex(p.i)} size={34} mood={idx === 0 ? "wink" : "happy"} />
              <span className="font-bold">{p.name}</span>
            </div>
            <span className="cb-mono font-bold" style={{ color: idx === 0 ? "var(--af-yellow)" : "#fff" }}>{p.score}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <button onClick={() => setPhase("setup")} className="af-btn af-btn-ghost">Nouvelle partie</button>
        {onReturnToLobby && <button onClick={onReturnToLobby} className="af-btn af-btn-primary">Lobby</button>}
      </div>
    </div>
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
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>Le Médium de ce tour est</p>
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
            : "Tu devras deviner où le Médium vise sur le curseur"}
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
          <RoundHeader round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} role="🔮 Médium" />
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
    <div className="flex flex-1 flex-col items-center p-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]">
      <RoundHeader round={round} total={total} timeLeft={timeLeft} max={30} role={role} />
      <ClueBadge clue={clue} authorName={psychicName} />
      {note && (
        <p className="mx-auto mt-3 max-w-md text-center text-sm" style={{ color: "var(--text-dim)" }}>{note}</p>
      )}

      <div className="w-full max-w-md mt-6">
        {/* Spectrum labels */}
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: `${MASCOT_PALETTE.sky.body}22`, color: MASCOT_PALETTE.sky.body }}>
            {spectrum?.left}
          </span>
          <MoveHorizontal size={16} strokeWidth={2.6} style={{ color: "var(--text-muted)" }} aria-hidden />
          <span className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: `${MASCOT_PALETTE.pink.body}22`, color: MASCOT_PALETTE.pink.body }}>
            {spectrum?.right}
          </span>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative h-20 cursor-pointer select-none rounded-full"
          style={{
            touchAction: "none",
            background: "linear-gradient(90deg, #4ECDC4 0%, #5B36D6 50%, #FF3EA5 100%)",
            boxShadow: "inset 0 4px 16px rgba(0,0,0,0.4), 0 8px 24px rgba(91,54,214,0.3)",
          }}
        >
          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="absolute top-1/2 h-3 w-px -translate-y-1/2"
                 style={{ left: `${i * 10}%`, background: "rgba(255,255,255,0.3)" }} />
          ))}

          {/* KNOB */}
          <div
            className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform", locked ? "" : "scale-100")}
            style={{ left: `${value}%` }}
          >
            {!locked && (
              <div className="absolute -inset-3 rounded-full border-2"
                   style={{ borderColor: "rgba(255,255,255,0.3)", animation: "af-pulse-ring 1.8s ease-out infinite" }} />
            )}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full"
                 style={{
                   background: "linear-gradient(135deg, #fff 0%, #F0E8FF 100%)",
                   boxShadow: "0 8px 20px rgba(0,0,0,0.4), 0 0 0 6px rgba(91,54,214,0.25)",
                   color: "var(--cb-brand)",
                   fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
                 }}>
              {value}
            </div>
          </div>
        </div>
      </div>

      <button onClick={submit} disabled={locked}
              className="af-btn af-btn-primary mt-8 w-full max-w-md disabled:opacity-50"
              style={{ padding: "16px", fontSize: 15 }}>
        {locked ? "Curseur placé ✓" : "Valider la position"}
      </button>
    </div>
  );
}

// ── Spectrum dial (read-only display) ─────────────────────
function SpectrumDial({
  spectrum, target, markers = [], mode,
}: {
  spectrum: Spectrum | null;
  target: number | null;
  markers?: { value: number; label: string; isMe: boolean; color: MascotColor }[];
  mode: "psychic" | "reveal";
}) {
  return (
    <div className="w-full max-w-md mt-4">
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: `${MASCOT_PALETTE.sky.body}22`, color: MASCOT_PALETTE.sky.body }}>
          {spectrum?.left}
        </span>
        <MoveHorizontal size={16} strokeWidth={2.6} style={{ color: "var(--text-muted)" }} aria-hidden />
        <span className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: `${MASCOT_PALETTE.pink.body}22`, color: MASCOT_PALETTE.pink.body }}>
          {spectrum?.right}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-20 overflow-hidden rounded-full"
           style={{
             background: "linear-gradient(90deg, #4ECDC4 0%, #5B36D6 50%, #FF3EA5 100%)",
             boxShadow: "inset 0 4px 16px rgba(0,0,0,0.4)",
           }}>
        {/* Score zones — psychic sees target, reveal shows them too */}
        {target != null && (
          <>
            <Zone center={target} half={BAND_WIDE}  color="rgba(255,255,255,0.10)" />
            <Zone center={target} half={BAND_MID}   color="rgba(255,210,63,0.30)" />
            <Zone center={target} half={BAND_TIGHT} color="rgba(255,62,165,0.65)" />
            {/* Pts labels at reveal */}
            {mode === "reveal" && (() => {
              // Les labels 3 et 2 vont du côté où il y a de la place (jamais hors du curseur)
              const side = target - 17 >= 4 ? -1 : 1;
              return (
                <>
                  <ZoneLabel value="5" center={target} y={"50%"} bold />
                  <ZoneLabel value="3" center={clampPct(target + side * 8)} y={"50%"} />
                  <ZoneLabel value="2" center={clampPct(target + side * 17)} y={"50%"} />
                </>
              );
            })()}
            {/* Target line */}
            <div className="absolute top-0 bottom-0 w-1 bg-white"
                 style={{ left: `${target}%`, transform: "translateX(-50%)", boxShadow: "0 0 14px rgba(255,255,255,0.8)" }} />
          </>
        )}
      </div>

      {/* Markers below for reveal */}
      {markers.length > 0 && (
        <div className="relative mt-2" style={{ height: 30 + Math.min(markers.length, 3) * 26 }}>
          {[...markers].sort((a, b) => a.value - b.value).map((m, i) => {
            // Près des bords, l'étiquette s'aligne vers l'intérieur pour ne pas déborder
            const align = m.value < 15 ? "0%" : m.value > 85 ? "-100%" : "-50%";
            return (
              <div key={i} className="absolute" style={{ left: `${m.value}%`, top: (i % 3) * 26 }}>
                <div className="flex -translate-x-1/2 justify-center">
                  <MascotAvatar color={m.color} size={20} mood={m.isMe ? "wink" : "happy"} border={m.isMe} />
                </div>
                <span className="absolute mt-0.5 block max-w-[40vw] truncate whitespace-nowrap rounded px-1.5 py-0.5 text-xs"
                      style={{
                        left: 0,
                        transform: `translateX(${align})`,
                        background: m.isMe ? "var(--cb-brand)" : "rgba(0,0,0,0.55)",
                        color: "#fff", fontWeight: 700,
                      }}>
                  {m.label}
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
      className="absolute -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none"
      style={{
        left: `${center}%`,
        top: y,
        fontFamily: "var(--font-display)",
        fontSize: bold ? 14 : 11,
        fontWeight: 800,
        textShadow: "0 1px 4px rgba(0,0,0,0.6)",
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
    <div className="w-full max-w-md">
      <div className="mb-1 mr-14 flex items-center justify-between">
        <span className="af-chip">Manche {round}/{total}</span>
        <span className="af-chip" style={{
          background: "rgba(255,210,63,0.18)",
          borderColor: "rgba(255,210,63,0.3)",
          color: "var(--af-yellow)",
        }}>{role}</span>
      </div>
      {timeLeft != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-linear"
               style={{
                 width: `${Math.max(0, Math.min(1, timeLeft / max)) * 100}%`,
                 background: "linear-gradient(90deg, var(--cb-brand), var(--af-pink))",
               }} />
        </div>
      )}
    </div>
  );
}

function ClueBadge({ clue, authorName }: { clue: string | null; authorName: string | null }) {
  if (!clue) return null;
  return (
    <div className="mx-auto mt-4 max-w-md rounded-2xl border px-5 py-3 text-center"
         style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(6px)" }}>
      <p className="af-eyebrow mb-1">Indice de {authorName ?? "?"}</p>
      <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", letterSpacing: -0.3 }}>
        « {clue} »
      </p>
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
