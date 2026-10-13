"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";
import {
  ModeSelect, PlayersSetup, PassScreen, colorForIndex, type GameMode,
  DISPLAY, ZButton, ZCard, ZChip, ZLink, ZRanking, ZScreen, ZTitle, useScrollTopOn,
} from "@/components/games/local-kit";
import { SynthwaveScreen, NeonConsole, CassetteInput, SpectrumPair, WAVE_COLOR } from "@/components/games/longueur-onde/synthwave";
import { Lock } from "lucide-react";
import { GameInlineIcon, GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";

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
  const [spectrums, setSpectrums] = useState(() => shuffleArr(LOCAL_SPECTRUMS));
  const [target, setTarget] = useState(50);
  const [clue, setClue] = useState("");
  const [guess, setGuess] = useState(50);
  const [clueInput, setClueInput] = useKeyedState<string>(`${round}-localclue`, "");

  useEffect(() => { preloadSfx(["whoosh", "gong", "confirm", "tick", "tock", "win", "powerup", "ding", "success", "wrong", "lose", "coins", "card-flip"]); }, []);
  useScrollTopOn(`${phase}-${round}`);

  const total = players.length;
  const spectrum = spectrums[(round - 1) % spectrums.length] ?? null;
  const lastPts = localPoints(Math.abs(guess - target));

  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    setSpectrums(shuffleArr(LOCAL_SPECTRUMS));
    setPsychic(0); setRound(1);
    setTarget(8 + Math.floor(Math.random() * 85)); setClue(""); setPhase("pass");
  };
  const startRound = (r: number, p: number) => {
    setRound(r); setPsychic(p);
    setTarget(8 + Math.floor(Math.random() * 85)); setClue(""); setPhase("pass");
  };
  // « Pas fou ? » : la paire d'extrêmes est retirée → une paire jamais vue prend sa place
  const rerollSpectrum = () => {
    if (spectrums.length <= total + 1) return;
    const at = (round - 1) % spectrums.length;
    playSfx("card-flip", { volume: 0.6, delay: 0.1 });
    setSpectrums((sp) => sp.filter((_, i) => i !== at));
    setTarget(8 + Math.floor(Math.random() * 85));
  };

  if (phase === "setup") {
    return <PlayersSetup emoji="📡" name="Le Curseur" min={2} max={8} accent={WAVE_COLOR} onStart={begin} onBack={onReturnToLobby}
      footer={<IdeaButton game="Le Curseur" kind="idée" />} />;
  }
  if (phase === "pass") {
    return <PassScreen toName={players[psychic]} colorIndex={psychic} accent={WAVE_COLOR}
      hint="Toi seul regardes l'écran : tu vas voir la cible secrète." onReady={() => { playCombo("reveal"); setPhase("clue"); }} />;
  }
  if (phase === "clue") {
    return (
      <SynthwaveScreen round={round} total={total} spectrum={spectrum} title={`${players[psychic]}, la cible est là`}>
        <NeonConsole readout="Toi seul la vois">
          <SpectrumDial spectrum={spectrum} target={target} mode="psychic" bare />
        </NeonConsole>
        <div className="mt-4 flex justify-center">
          <RerollButton label="Pas fou ? Une autre paire" onClick={rerollSpectrum} />
        </div>
        <CassetteInput value={clueInput} onChange={setClueInput}
          placeholder="Ex. : une raclette"
          error={clueProblem(clueInput)}
          onSubmit={() => {
            if (clueProblem(clueInput)) return;
            playSfx("whoosh", { volume: 0.6 });
            setClue(clueInput.trim() || "(à l'oral)"); setGuess(50); setPhase("guess");
          }} />
      </SynthwaveScreen>
    );
  }
  if (phase === "guess") {
    return <GuessBoard key={`${round}-localguess`} spectrum={spectrum} clue={clue} round={round} total={total}
      timeLeft={null} submitted={false} psychicName={players[psychic]} role="Toute la table"
      note={`Discutez ensemble et placez UN seul curseur. Les points vont à ${players[psychic]}.`}
      onSubmit={(g) => {
        const pts = localPoints(Math.abs(g - target));
        playCombo("drumroll");
        if (pts >= 5) { playSfx("win", { volume: 0.9, delay: 1.05 }); playSfx("coins", { volume: 0.7, delay: 1.3 }); }
        else if (pts > 0) playSfx("success", { volume: 0.8, delay: 1.05 });
        else { playSfx("wrong", { volume: 0.8, delay: 1.05 }); playSfx("lose", { volume: 0.5, delay: 1.12 }); }
        setGuess(g); setPhase("reveal");
      }} />;
  }
  if (phase === "reveal") {
    const markers = [{ value: guess, label: "La table", isMe: true, color: colorForIndex(psychic) }];
    const bull = lastPts >= 5;
    const verdict = bull ? "Dans le mille !" : lastPts >= 3 ? "Pas loin !" : lastPts > 0 ? "Ça chauffe…" : "Raté !";
    return (
      <ZScreen bg={bull ? "#3DDC97" : WAVE_COLOR}>
        {bull && <ConfettiBurst count={40} />}
        <ZChip bg="#fff" tilt={-2}>Manche {round}/{total}</ZChip>
        <ZTitle size={40} className="mt-3">{verdict}</ZTitle>
        <div className="mt-4"><SpectrumPair spectrum={spectrum} /></div>
        <SpectrumDial spectrum={spectrum} target={target} markers={markers} mode="reveal" bare />
        <ZCard bg="#FFD23F" tilt={-1.5} shadow={5} radius={22} className="mt-3 flex items-center gap-3 px-4 py-3">
          <Mascot size={46} color={colorForIndex(psychic)} mood={bull ? "laughing" : lastPts ? "happy" : "sad"} shadow={false} bob={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[19px] leading-tight" style={DISPLAY}>{players[psychic]}</p>
            <p className="truncate text-[14px] font-semibold">Indice : {clue} · cible {target}</p>
          </div>
          <span className="text-[30px]" style={DISPLAY}>+{lastPts}</span>
        </ZCard>
        <div className="min-h-8 flex-1" />
        <ZButton bg={GAME_INK} onClick={() => {
          const ns = [...scores]; ns[psychic] += lastPts; setScores(ns);
          if (round >= total) { playCombo("fanfare"); setPhase("over"); } else startRound(round + 1, (psychic + 1) % total);
        }}>
          {round >= total ? "Voir les scores" : "Manche suivante"}
        </ZButton>
      </ZScreen>
    );
  }
  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], colorIndex: i })).sort((a, b) => b.score - a.score);
  return (
    <ZScreen bg={WAVE_COLOR}>
      <ConfettiBurst count={50} />
      <ZTitle size={40} className="text-center">{ranking[0]?.name}, meilleur médium</ZTitle>
      <div className="mt-6"><ZRanking rows={ranking} /></div>
      <div className="min-h-8 flex-1" />
      <ZButton bg={GAME_INK} onClick={() => begin(players)}>Rejouer</ZButton>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <ZButton size="sm" bg="#fff" style={{ width: "auto" }} onClick={() => setPhase("setup")}>Changer les joueurs</ZButton>
        <IdeaButton game="Le Curseur" kind="idée" bg="#fff" />
      </div>
      {onReturnToLobby && <ZLink onClick={onReturnToLobby} color={GAME_INK} className="mt-2">Retour à l&apos;accueil</ZLink>}
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
