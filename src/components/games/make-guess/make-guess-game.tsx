"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Word lists ─────────────────────────────────────────────

const WORDS_OBJECTS = [
  "Parapluie", "Aspirateur", "Trampoline", "Skateboard", "Telescope",
  "Boussole", "Hamac", "Toboggan", "Marionnette", "Sablier",
  "Cerf-volant", "Monocle", "Catapulte", "Periscope", "Sifflet",
  "Echasses", "Kaleidoscope", "Metronome", "Pendule", "Entonnoir",
];

const WORDS_ANIMALS = [
  "Hippopotame", "Cameleon", "Ornithorynque", "Flamant rose", "Herisson",
  "Paresseux", "Tatou", "Colibri", "Narval", "Capybara",
  "Salamandre", "Poulpe", "Toucan", "Iguane", "Scarabee",
  "Koala", "Okapi", "Axolotl", "Pangolin", "Suricate",
];

const WORDS_FAMOUS = [
  "Napoleon", "Cleopatre", "Einstein", "Mozart", "Picasso",
  "Shakespeare", "Mandela", "Chaplin", "Gandhi", "Marie Curie",
  "Jules Cesar", "Marco Polo", "Beethoven", "Van Gogh", "Darwin",
  "Aristote", "Da Vinci", "Moliere", "Voltaire", "Pasteur",
];

const WORDS_ACTIONS = [
  "Jongler", "Eternuer", "Ronfler", "Plonger", "Escalader",
  "Surfer", "Patiner", "Galoper", "Danser le tango", "Faire du mime",
  "Siffler", "Applaudir", "Ramper", "Mediter", "Bailler",
  "Tricoter", "Souder", "Pecher", "Demenager", "Negocier",
];

const WORDS_PLACES = [
  "Pyramides", "Tour Eiffel", "Colisee", "Muraille de Chine", "Machu Picchu",
  "Taj Mahal", "Statue de la Liberte", "Big Ben", "Acropole", "Niagara",
  "Mont Blanc", "Sahara", "Amazonie", "Antarctique", "Hollywood",
  "Las Vegas", "Venise", "Tokyo", "Dubai", "Tombouctou",
];

const WORDS_EXPRESSIONS = [
  "Avoir le cafard", "Poser un lapin", "Tomber dans les pommes",
  "Avoir la chair de poule", "Couper les cheveux en quatre",
  "Mettre les pieds dans le plat", "Se noyer dans un verre d'eau",
  "Prendre ses jambes a son cou", "Avoir un poil dans la main",
  "Tirer les vers du nez",
];

const WORDS_MOVIES = [
  "Game of Thrones", "Breaking Bad", "Titanic", "Star Wars", "Harry Potter",
  "Le Roi Lion", "Jurassic Park", "Stranger Things", "The Office", "Friends",
  "Matrix", "Inception", "Shrek", "Avatar", "Batman",
  "Squid Game", "La Casa de Papel", "Peaky Blinders", "Naruto", "Dragon Ball",
];

const WORDS_FOOD = [
  "Croissant", "Sushi", "Fondue", "Ratatouille", "Tiramisu",
  "Guacamole", "Pretzel", "Churros", "Bruschetta", "Macaron",
  "Creme brulee", "Tartare", "Raclette", "Pain au chocolat", "Eclair",
  "Mille-feuille", "Profiterole", "Galette des rois", "Crepe Suzette", "Baba au rhum",
];

const ALL_WORDS = [
  ...WORDS_OBJECTS,
  ...WORDS_ANIMALS,
  ...WORDS_FAMOUS,
  ...WORDS_ACTIONS,
  ...WORDS_PLACES,
  ...WORDS_EXPRESSIONS,
  ...WORDS_MOVIES,
  ...WORDS_FOOD,
];

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

// ── Background wrapper ─────────────────────────────────────

const BG_GRADIENT =
  "bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]";

// ── Component ──────────────────────────────────────────────

export default function MakeGuessGame({
  roomCode,
  playerId,
  playerName,
  onReturnToLobby,
}: GameProps) {
  // ── Setup state ──
  const [teams, setTeams] = useState<Team[]>([
    { name: "Equipe 1", player1: "", player2: "" },
    { name: "Equipe 2", player1: "", player2: "" },
  ]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [totalRounds, setTotalRounds] = useState(1);

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
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
  // Alternate describer each round: even rounds → player1 describes, odd → player2
  const describerIsPlayer1 = (currentRound - 1) % 2 === 0;
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
    if (phase === "playing" && timeLeft <= 0) {
      endTurn();
    }
  }, [phase, timeLeft, endTurn]);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => stopTimer();
    }
  }, [phase, stopTimer]);

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
        name: `Equipe ${prev.length + 1}`,
        player1: "",
        player2: "",
      },
    ]);
  }, []);

  const removeTeam = useCallback((index: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canStart =
    teams.length >= 2 &&
    teams.every((t) => t.name.trim() && t.player1.trim() && t.player2.trim());

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(ALL_WORDS);
    setWordPool(shuffled);
    setWordIndex(0);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setAllResults([]);
    setPhase("pre-turn");
  }, []);

  // ── Turn handlers ──
  const startTurn = useCallback(() => {
    setTimeLeft(timerDuration);
    setTurnWords([]);
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
    setTurnWords((prev) => [...prev, { word, correct: false }]);
    setWordIndex((i) => i + 1);
    setFlashColor("red");
    setWordAnim(false);
    setTimeout(() => {
      setWordAnim(true);
      setFlashColor(null);
    }, 200);
  }, [phase, timeLeft, wordPool, wordIndex, endTurn]);

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
      // More teams this round
      setCurrentTeamIndex(nextIdx);
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
  }, [currentTeamIndex, currentRound, teams.length, totalRounds, turnWords]);

  const nextRound = useCallback(() => {
    setCurrentRound((r) => r + 1);
    setCurrentTeamIndex(0);
    setPhase("pre-turn");
  }, []);

  const resetGame = useCallback(() => {
    setPhase("setup");
    setAllResults([]);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setWordIndex(0);
  }, []);

  const replay = useCallback(() => {
    startGame();
  }, [startGame]);

  // ── Final scores (for game-over, include last turn) ──
  const finalScores = teams.map((t, tIdx) => {
    // allResults already contains everything by the time we reach game-over
    const score = allResults
      .filter((r) => r.teamIndex === tIdx)
      .reduce((sum, r) => sum + r.score, 0);
    return { name: t.name, score };
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

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden text-white",
        BG_GRADIENT
      )}
    >
      {/* Flash overlay */}
      {flashColor && (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-50 transition-opacity duration-200",
            flashColor === "green" ? "bg-green-500/20" : "bg-red-500/20"
          )}
        />
      )}

      {/* ── SETUP ─────────────────────────────────────────── */}
      {phase === "setup" && (
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-8">
          <h1
            className="mb-2 text-center font-serif text-4xl font-bold tracking-tight text-cyan-100"
            style={{ animation: "fadeUp 0.5s ease-out" }}
          >
            Fais Deviner
          </h1>
          <p
            className="mb-8 text-center font-sans text-sm text-cyan-200/60"
            style={{ animation: "fadeUp 0.6s ease-out" }}
          >
            Decris, fais deviner, marque des points !
          </p>

          {/* Teams */}
          <div className="mb-6 w-full space-y-4">
            {teams.map((team, i) => (
              <div
                key={i}
                className="rounded-2xl border border-cyan-300/20 bg-black/35 p-4 backdrop-blur-xl"
                style={{ animation: `fadeUp ${0.4 + i * 0.1}s ease-out` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => updateTeam(i, "name", e.target.value)}
                    placeholder="Nom de l'equipe"
                    className="w-48 rounded-lg border border-cyan-300/20 bg-black/30 px-3 py-1.5 font-sans text-sm text-cyan-100 placeholder-cyan-300/30 outline-none focus:border-cyan-400/40"
                  />
                  {teams.length > 2 && (
                    <button
                      onClick={() => removeTeam(i)}
                      className="rounded-lg px-2 py-1 text-xs text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={team.player1}
                    onChange={(e) => updateTeam(i, "player1", e.target.value)}
                    placeholder="Joueur 1"
                    className="rounded-lg border border-cyan-300/20 bg-black/30 px-3 py-2 font-sans text-sm text-cyan-100 placeholder-cyan-300/30 outline-none focus:border-cyan-400/40"
                  />
                  <input
                    type="text"
                    value={team.player2}
                    onChange={(e) => updateTeam(i, "player2", e.target.value)}
                    placeholder="Joueur 2"
                    className="rounded-lg border border-cyan-300/20 bg-black/30 px-3 py-2 font-sans text-sm text-cyan-100 placeholder-cyan-300/30 outline-none focus:border-cyan-400/40"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addTeam}
            className="mb-6 rounded-xl border border-cyan-300/20 bg-black/30 px-5 py-2 font-sans text-sm text-cyan-300/80 backdrop-blur-xl transition-colors hover:bg-cyan-500/10"
          >
            + Ajouter une equipe
          </button>

          {/* Options */}
          <div
            className="mb-6 w-full rounded-2xl border border-cyan-300/20 bg-black/35 p-5 backdrop-blur-xl"
            style={{ animation: "fadeUp 0.7s ease-out" }}
          >
            {/* Timer duration */}
            <div className="mb-4">
              <label className="mb-2 block font-sans text-xs uppercase tracking-wider text-cyan-200/50">
                Duree du timer
              </label>
              <div className="flex gap-2">
                {[30, 60, 90, 120].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTimerDuration(d)}
                    className={cn(
                      "rounded-xl px-4 py-2 font-mono text-sm transition-all",
                      timerDuration === d
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                        : "border border-cyan-300/20 bg-black/30 text-cyan-300/60 hover:bg-cyan-500/10"
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds */}
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-wider text-cyan-200/50">
                Nombre de manches
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTotalRounds(r)}
                    className={cn(
                      "rounded-xl px-4 py-2 font-mono text-sm transition-all",
                      totalRounds === r
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                        : "border border-cyan-300/20 bg-black/30 text-cyan-300/60 hover:bg-cyan-500/10"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={!canStart}
            className={cn(
              "press-effect rounded-xl px-8 py-3 font-sans text-lg font-semibold transition-all",
              canStart
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                : "cursor-not-allowed bg-gray-700/50 text-gray-500"
            )}
          >
            Commencer
          </button>
          {!canStart && (
            <p className="mt-2 font-sans text-xs text-cyan-300/40">
              Remplis tous les champs (min. 2 equipes)
            </p>
          )}

          {onReturnToLobby && (
            <button
              onClick={onReturnToLobby}
              className="mt-4 font-sans text-sm text-cyan-300/40 transition-colors hover:text-cyan-300/70"
            >
              Retour au lobby
            </button>
          )}
        </div>
      )}

      {/* ── PRE-TURN ──────────────────────────────────────── */}
      {phase === "pre-turn" && currentTeam && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div
            className="rounded-3xl border border-cyan-300/20 bg-black/35 p-8 text-center backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            <p className="mb-1 font-sans text-xs uppercase tracking-wider text-cyan-200/50">
              Manche {currentRound} / {totalRounds}
            </p>
            <h2 className="mb-6 font-serif text-3xl font-bold text-cyan-100">
              {currentTeam.name}
            </h2>

            <div className="mb-8 space-y-3">
              <div className="rounded-xl border border-cyan-300/10 bg-cyan-500/5 px-6 py-3">
                <p className="font-sans text-xs uppercase tracking-wider text-cyan-200/40">
                  Fait deviner
                </p>
                <p className="font-sans text-xl font-semibold text-cyan-100">
                  {describer}
                </p>
              </div>
              <div className="rounded-xl border border-cyan-300/10 bg-indigo-500/5 px-6 py-3">
                <p className="font-sans text-xs uppercase tracking-wider text-indigo-200/40">
                  Devine
                </p>
                <p className="font-sans text-xl font-semibold text-indigo-100">
                  {guesser}
                </p>
              </div>
            </div>

            <button
              onClick={startTurn}
              className="press-effect rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 font-sans text-lg font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
            >
              C&apos;est parti !
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYING ───────────────────────────────────────── */}
      {phase === "playing" && (
        <div className="relative flex min-h-screen flex-col">
          {/* Timer bar */}
          <div className="relative flex items-center justify-center py-4">
            <div
              className={cn(
                "font-mono text-5xl font-bold tabular-nums",
                timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-100"
              )}
            >
              {timeLeft}
            </div>
            <div className="absolute right-4 top-4 rounded-lg border border-cyan-300/10 bg-black/30 px-3 py-1 backdrop-blur-xl">
              <span className="font-mono text-sm text-cyan-200/60">
                {turnScore} pts
              </span>
            </div>
          </div>

          {/* Word display */}
          <div className="flex flex-1 items-center justify-center px-4">
            {wordPool[wordIndex] ? (
              <h2
                className={cn(
                  "text-center font-serif text-5xl font-bold leading-tight text-white md:text-6xl",
                  wordAnim && "animate-[scaleIn_0.25s_ease-out]"
                )}
                key={wordIndex}
              >
                {wordPool[wordIndex]}
              </h2>
            ) : (
              <p className="font-sans text-xl text-cyan-200/50">
                Plus de mots !
              </p>
            )}
          </div>

          {/* Tap zones */}
          <div className="flex flex-1 items-stretch">
            {/* Correct zone (left / green) */}
            <button
              onClick={handleCorrect}
              className="flex w-1/2 flex-col items-center justify-center border-r border-green-400/10 bg-green-500/5 transition-colors active:bg-green-500/20"
            >
              <span className="text-4xl">&#10003;</span>
              <span className="mt-1 font-sans text-sm uppercase tracking-wider text-green-300/70">
                Correct
              </span>
            </button>

            {/* Pass zone (right / red) */}
            <button
              onClick={handlePass}
              className="flex w-1/2 flex-col items-center justify-center bg-red-500/5 transition-colors active:bg-red-500/20"
            >
              <span className="text-4xl">&#10140;</span>
              <span className="mt-1 font-sans text-sm uppercase tracking-wider text-red-300/70">
                Passer
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── TURN RESULT ───────────────────────────────────── */}
      {phase === "turn-result" && currentTeam && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div
            className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            <h2 className="mb-1 text-center font-serif text-2xl font-bold text-cyan-100">
              {currentTeam.name}
            </h2>
            <p className="mb-6 text-center font-mono text-4xl font-bold text-cyan-300">
              {turnScore} {turnScore === 1 ? "mot" : "mots"}
            </p>

            {/* Word list */}
            <div className="mb-6 max-h-60 space-y-1 overflow-y-auto">
              {turnWords.map((w, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-1.5 font-sans text-sm",
                    w.correct
                      ? "bg-green-500/10 text-green-300"
                      : "bg-white/5 text-gray-400"
                  )}
                >
                  <span>{w.word}</span>
                  <span>{w.correct ? "+" : "-"}</span>
                </div>
              ))}
            </div>

            <button
              onClick={nextTeam}
              className="press-effect w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-sans text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
            >
              {currentTeamIndex + 1 < teams.length
                ? "Equipe suivante"
                : currentRound < totalRounds
                ? "Voir le recap"
                : "Resultats finaux"}
            </button>
          </div>
        </div>
      )}

      {/* ── ROUND SUMMARY ─────────────────────────────────── */}
      {phase === "round-summary" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div
            className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            <p className="mb-1 text-center font-sans text-xs uppercase tracking-wider text-cyan-200/50">
              Fin de la manche {currentRound}
            </p>
            <h2 className="mb-6 text-center font-serif text-2xl font-bold text-cyan-100">
              Classement
            </h2>

            <div className="mb-6 space-y-2">
              {[...roundSummaryScores]
                .sort((a, b) => b.score - a.score)
                .map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3",
                      i === 0
                        ? "border-yellow-400/30 bg-yellow-500/10"
                        : "border-cyan-300/10 bg-black/20"
                    )}
                  >
                    <span className="font-sans text-sm text-cyan-100">
                      {i + 1}. {t.name}
                    </span>
                    <span className="font-mono text-lg font-bold text-cyan-300">
                      {t.score}
                    </span>
                  </div>
                ))}
            </div>

            <button
              onClick={nextRound}
              className="press-effect w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-sans text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
            >
              Manche {currentRound + 1}
            </button>
          </div>
        </div>
      )}

      {/* ── GAME OVER ─────────────────────────────────────── */}
      {phase === "game-over" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div
            className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-black/35 p-8 text-center backdrop-blur-xl"
            style={{ animation: "scaleIn 0.5s ease-out" }}
          >
            <p className="mb-2 font-sans text-xs uppercase tracking-wider text-cyan-200/50">
              Partie terminee
            </p>

            {/* Winner */}
            {sortedFinal[0] && (
              <div
                className="mb-6"
                style={{ animation: "fadeUp 0.7s ease-out" }}
              >
                <p className="mb-1 font-sans text-sm text-yellow-300/70">
                  Vainqueur
                </p>
                <h2 className="font-serif text-3xl font-bold text-yellow-200">
                  {sortedFinal[0].name}
                </h2>
                <p className="font-mono text-5xl font-bold text-cyan-300">
                  {sortedFinal[0].score}
                </p>
              </div>
            )}

            {/* Full ranking */}
            <div className="mb-8 space-y-2">
              {sortedFinal.map((t, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3",
                    i === 0
                      ? "border-yellow-400/30 bg-yellow-500/10"
                      : i === 1
                      ? "border-cyan-300/20 bg-cyan-500/5"
                      : "border-cyan-300/10 bg-black/20"
                  )}
                  style={{ animation: `fadeUp ${0.5 + i * 0.1}s ease-out` }}
                >
                  <span className="font-sans text-sm text-cyan-100">
                    {i === 0 ? "1er" : `${i + 1}e`} - {t.name}
                  </span>
                  <span className="font-mono text-lg font-bold text-cyan-300">
                    {t.score}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={replay}
                className="press-effect flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-sans text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
              >
                Rejouer
              </button>
              <button
                onClick={resetGame}
                className="flex-1 rounded-xl border border-cyan-300/20 bg-black/30 py-3 font-sans text-sm text-cyan-300/70 backdrop-blur-xl transition-colors hover:bg-cyan-500/10"
              >
                Nouvelle partie
              </button>
            </div>

            {onReturnToLobby && (
              <button
                onClick={onReturnToLobby}
                className="mt-4 font-sans text-sm text-cyan-300/40 transition-colors hover:text-cyan-300/70"
              >
                Retour au lobby
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
