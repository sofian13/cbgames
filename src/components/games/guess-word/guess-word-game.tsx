"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Word lists                                                         */
/* ------------------------------------------------------------------ */

const WORD_LISTS: Record<string, string[]> = {
  "Acteurs porno": [
    "Clara Morgane", "Lana Rhoades", "Mia Khalifa", "Johnny Sins", "Jordi El Nino",
    "Riley Reid", "Sasha Grey", "Lisa Ann", "Asa Akira", "Abella Danger",
    "Brandi Love", "Angela White", "Mia Malkova", "Adriana Chechik", "Madison Ivy",
    "Eva Elfie", "Lena Paul", "Dani Daniels", "Kendra Lust", "Alexis Texas",
    "Nicolette Shea", "Valentina Nappi", "Emily Willis", "Gabbie Carter", "Autumn Falls",
  ],
  "Positions sexuelles": [
    "Missionnaire", "Levrette", "Amazone", "Cuillere", "69",
    "Brouette", "Lotus", "Andromaque", "Elephant", "Pont de Londres",
    "La balancoire", "Le lotus", "Cowgirl", "La chaise", "L'union du loup",
    "Le bateau ivre", "Le pilonneur", "La danseuse", "Le paresseux", "La chevauchee",
    "Le toboggan", "L'arc en ciel", "Le siege arriere", "La planche", "La toupie",
  ],
  "Acteurs celebres": [
    "Leonardo DiCaprio", "Brad Pitt", "Tom Cruise", "Will Smith", "Johnny Depp",
    "Keanu Reeves", "Ryan Reynolds", "Robert Downey Jr", "Morgan Freeman", "Denzel Washington",
    "Dwayne Johnson", "Chris Hemsworth", "Tom Hanks", "Samuel L Jackson", "Al Pacino",
    "Robert De Niro", "Scarlett Johansson", "Margot Robbie", "Angelina Jolie", "Jennifer Lawrence",
    "Natalie Portman", "Zendaya", "Timothee Chalamet", "Florence Pugh", "Omar Sy",
  ],
  "Animaux": [
    "Elephant", "Girafe", "Crocodile", "Flamant rose", "Koala",
    "Paon", "Ornithorynque", "Cameleon", "Pangolin", "Axolotl",
    "Narval", "Okapi", "Toucan", "Anaconda", "Herisson",
    "Raie Manta", "Colibri", "Tatou", "Pieuvre", "Capybara",
    "Mandrill", "Lynx", "Panda roux", "Iguane", "Scarabee",
  ],
  "Pays": [
    "Japon", "Bresil", "Australie", "Egypte", "Canada",
    "Inde", "Mexique", "Russie", "Thailande", "Maroc",
    "Argentine", "Norvege", "Grece", "Colombie", "Turquie",
    "Kenya", "Perou", "Islande", "Vietnam", "Portugal",
    "Nouvelle-Zelande", "Suede", "Cuba", "Philippines", "Senegal",
  ],
  "Sports": [
    "Football", "Basketball", "Tennis", "Natation", "Boxe",
    "Escalade", "Surf", "Judo", "Tir a l&apos;arc", "Escrime",
    "Handball", "Volleyball", "Gymnastique", "Patinage artistique", "Plongee sous-marine",
    "Polo", "Cricket", "Baseball", "Rugby", "Golf",
    "Badminton", "Ski", "Kayak", "Lutte", "Aviron",
  ],
  "Films": [
    "Titanic", "Matrix", "Star Wars", "Le Parrain", "Inception",
    "Interstellar", "Avengers", "Forrest Gump", "Pulp Fiction", "Fight Club",
    "Le Roi Lion", "Harry Potter", "Jurassic Park", "Shrek", "Batman",
    "Spider-Man", "Gladiator", "Rocky", "Les Evades", "Alien",
    "Terminator", "Indiana Jones", "Le Seigneur des Anneaux", "Django Unchained", "Mad Max",
  ],
  "Nourriture": [
    "Sushi", "Tacos", "Croissant", "Pizza", "Hamburger",
    "Ramen", "Couscous", "Tiramisu", "Paella", "Fondue",
    "Kebab", "Ceviche", "Pad Thai", "Fish and Chips", "Poutine",
    "Empanada", "Falafel", "Brownie", "Macaron", "Churros",
    "Boeuf Bourguignon", "Dim Sum", "Bibimbap", "Creme Brulee", "Guacamole",
  ],
  "Metiers": [
    "Pompier", "Astronaute", "Chirurgien", "Detective", "Pilote",
    "Plombier", "Boulanger", "Architecte", "Veterinaire", "Photographe",
    "Journaliste", "Electricien", "Avocat", "Pharmacien", "Coach sportif",
    "Styliste", "Diplomate", "Cascadeur", "Sommelier", "Tatoueur",
    "Apiculteur", "Paleontologue", "Huissier", "Osteopathe", "Thanatopracteur",
  ],
};

const CATEGORIES = [
  "Acteurs porno",
  "Positions sexuelles",
  "Acteurs celebres",
  "Animaux",
  "Pays",
  "Sports",
  "Films",
  "Nourriture",
  "Metiers",
  "Melange",
] as const;

const TIMER_OPTIONS = [30, 60, 90, 120] as const;

type Phase = "setup" | "playing" | "gameover";
type WordResult = { word: string; status: "correct" | "passed" };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildWordList(category: string): string[] {
  if (category === "Melange") {
    const all = Object.values(WORD_LISTS).flat();
    return shuffle(all);
  }
  return shuffle(WORD_LISTS[category] ?? []);
}

/* ------------------------------------------------------------------ */
/*  Background                                                         */
/* ------------------------------------------------------------------ */

const BG_GRADIENT =
  "bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GuessWordGame({
  roomCode,
  playerId,
  playerName,
  onReturnToLobby,
}: GameProps) {
  /* state */
  const [phase, setPhase] = useState<Phase>("setup");
  const [category, setCategory] = useState<string>("Animaux");
  const [duration, setDuration] = useState<number>(60);

  const [words, setWords] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<WordResult[]>([]);

  const [flash, setFlash] = useState<"green" | "red" | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- timer ---- */
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setPhase("gameover");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  /* ---- cleanup flash timeout ---- */
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  /* ---- start game ---- */
  const handleStart = useCallback(() => {
    const list = buildWordList(category);
    setWords(list);
    setWordIndex(0);
    setScore(0);
    setResults([]);
    setTimeLeft(duration);
    setPhase("playing");
  }, [category, duration]);

  /* ---- next word helper ---- */
  const advanceWord = useCallback(() => {
    setWordIndex((prev) => {
      if (prev + 1 >= words.length) {
        // ran out of words — end game
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("gameover");
      }
      return prev + 1;
    });
  }, [words.length]);

  /* ---- correct ---- */
  const handleCorrect = useCallback(() => {
    if (phase !== "playing") return;
    const currentWord = words[wordIndex];
    if (!currentWord) return;

    setScore((s) => s + 1);
    setResults((r) => [...r, { word: currentWord, status: "correct" }]);

    setFlash("green");
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 350);

    advanceWord();
  }, [phase, words, wordIndex, advanceWord]);

  /* ---- pass ---- */
  const handlePass = useCallback(() => {
    if (phase !== "playing") return;
    const currentWord = words[wordIndex];
    if (!currentWord) return;

    setResults((r) => [...r, { word: currentWord, status: "passed" }]);

    setFlash("red");
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 350);

    advanceWord();
  }, [phase, words, wordIndex, advanceWord]);

  /* ---- replay ---- */
  const handleReplay = useCallback(() => {
    handleStart();
  }, [handleStart]);

  const handleChangeOptions = useCallback(() => {
    setPhase("setup");
  }, []);

  /* ================================================================ */
  /*  SETUP PHASE                                                      */
  /* ================================================================ */
  if (phase === "setup") {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center min-h-screen p-4", BG_GRADIENT)}>
        <div
          className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-black/35 backdrop-blur-xl p-8 animate-[scaleIn_0.4s_ease-out]"
          style={{ boxShadow: "0 0 60px rgba(80,216,255,0.08)" }}
        >
          {/* Title */}
          <h1 className="font-serif text-3xl text-white text-center mb-1">
            Deviner le Mot
          </h1>
          <p className="font-sans text-sm text-white/40 text-center mb-8">
            Style &quot;Heads Up&quot; — telephone sur le front !
          </p>

          {/* Category */}
          <label className="block font-sans text-xs uppercase tracking-widest text-cyan-300/60 mb-2">
            Categorie
          </label>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-sans transition-all duration-200 border",
                  category === cat
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(80,216,255,0.15)]"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Timer */}
          <label className="block font-sans text-xs uppercase tracking-widest text-cyan-300/60 mb-2">
            Duree (secondes)
          </label>
          <div className="flex gap-2 mb-8">
            {TIMER_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setDuration(t)}
                className={cn(
                  "flex-1 rounded-xl py-2 font-mono text-sm transition-all duration-200 border",
                  duration === t
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(80,216,255,0.15)]"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                )}
              >
                {t}s
              </button>
            ))}
          </div>

          {/* Start */}
          <button
            onClick={handleStart}
            className="press-effect w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-sans font-semibold text-white text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
          >
            Commencer
          </button>

          {/* Return to lobby */}
          {onReturnToLobby && (
            <button
              onClick={onReturnToLobby}
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 font-sans text-sm text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
            >
              Retour au lobby
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  PLAYING PHASE                                                    */
  /* ================================================================ */
  if (phase === "playing") {
    const currentWord = words[wordIndex] ?? "";
    const timerPct = duration > 0 ? (timeLeft / duration) * 100 : 0;
    const timerUrgent = timeLeft <= 10;

    return (
      <div className={cn("relative flex flex-1 flex-col min-h-screen select-none overflow-hidden", BG_GRADIENT)}>
        {/* Flash overlay */}
        {flash && (
          <div
            className={cn(
              "absolute inset-0 z-50 pointer-events-none transition-opacity duration-300",
              flash === "green" ? "bg-emerald-500/25" : "bg-red-500/25"
            )}
          />
        )}

        {/* Top bar: timer + score */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
          {/* Score */}
          <div className="rounded-2xl border border-cyan-300/20 bg-black/35 backdrop-blur-xl px-4 py-2">
            <span className="font-mono text-xs text-white/40 mr-1">Score</span>
            <span className="font-mono text-xl text-cyan-300">{score}</span>
          </div>

          {/* Timer */}
          <div className={cn(
            "rounded-2xl border bg-black/35 backdrop-blur-xl px-4 py-2",
            timerUrgent ? "border-red-400/40" : "border-cyan-300/20"
          )}>
            <span className={cn(
              "font-mono text-2xl font-bold",
              timerUrgent ? "text-red-400 animate-pulse" : "text-white"
            )}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="relative z-10 mx-6 mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              timerUrgent
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-cyan-500 to-blue-500"
            )}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Word display — center */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-8">
          <h2
            className="font-serif text-5xl sm:text-6xl md:text-7xl text-white text-center leading-tight animate-[scaleIn_0.25s_ease-out]"
            key={wordIndex}
          >
            {currentWord}
          </h2>
        </div>

        {/* Tap zones */}
        <div className="relative z-10 flex flex-1 max-h-[40vh]">
          {/* LEFT — correct */}
          <button
            onClick={handleCorrect}
            className="flex-1 flex flex-col items-center justify-center gap-2 rounded-tl-3xl border-t border-r border-emerald-400/20 bg-emerald-500/10 active:bg-emerald-500/25 transition-colors"
          >
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-sans text-lg font-semibold text-emerald-300">Devine !</span>
          </button>

          {/* RIGHT — pass */}
          <button
            onClick={handlePass}
            className="flex-1 flex flex-col items-center justify-center gap-2 rounded-tr-3xl border-t border-l border-red-400/20 bg-red-500/10 active:bg-red-500/25 transition-colors"
          >
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-sans text-lg font-semibold text-red-300">Passe !</span>
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  GAME OVER PHASE                                                  */
  /* ================================================================ */
  const correctCount = results.filter((r) => r.status === "correct").length;
  const passedCount = results.filter((r) => r.status === "passed").length;

  return (
    <div className={cn("flex flex-1 flex-col items-center min-h-screen p-4 overflow-y-auto", BG_GRADIENT)}>
      <div
        className="w-full max-w-md mt-8 rounded-3xl border border-cyan-300/20 bg-black/35 backdrop-blur-xl p-8 animate-[scaleIn_0.4s_ease-out]"
        style={{ boxShadow: "0 0 60px rgba(80,216,255,0.08)" }}
      >
        {/* Title */}
        <h1 className="font-serif text-3xl text-white text-center mb-1">
          Temps ecoule !
        </h1>
        <p className="font-sans text-sm text-white/40 text-center mb-6">
          {category}
        </p>

        {/* Score summary */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="font-mono text-4xl font-bold text-cyan-300">{score}</div>
            <div className="font-sans text-xs text-white/40 uppercase tracking-wider mt-1">Score</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-4xl font-bold text-emerald-400">{correctCount}</div>
            <div className="font-sans text-xs text-white/40 uppercase tracking-wider mt-1">Devines</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-4xl font-bold text-red-400">{passedCount}</div>
            <div className="font-sans text-xs text-white/40 uppercase tracking-wider mt-1">Passes</div>
          </div>
        </div>

        {/* Word list */}
        <div className="space-y-2 mb-8 max-h-[40vh] overflow-y-auto pr-1">
          {results.map((r, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-2.5 animate-[fadeUp_0.3s_ease-out]",
                r.status === "correct"
                  ? "border-emerald-400/20 bg-emerald-500/10"
                  : "border-red-400/20 bg-red-500/10"
              )}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
            >
              <span className="font-sans text-sm text-white/80">{r.word}</span>
              {r.status === "correct" ? (
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={handleReplay}
          className="press-effect w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-sans font-semibold text-white text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow mb-3"
        >
          Rejouer
        </button>
        <button
          onClick={handleChangeOptions}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 font-sans text-sm text-white/40 hover:text-white/60 hover:bg-white/10 transition-all mb-3"
        >
          Changer les options
        </button>
        {onReturnToLobby && (
          <button
            onClick={onReturnToLobby}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 font-sans text-sm text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
          >
            Retour au lobby
          </button>
        )}
      </div>
    </div>
  );
}
