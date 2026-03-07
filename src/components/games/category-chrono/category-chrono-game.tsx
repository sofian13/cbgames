"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Categories ──────────────────────────────────────────────

interface Category {
  name: string;
  emoji: string;
  examples?: string;
}

const CATEGORIES: Category[] = [
  // -- Adult / Spicy --
  { name: "Actrices porno", emoji: "🔞", examples: "Lana Rhoades, Mia Khalifa..." },
  { name: "Acteurs porno", emoji: "🔞", examples: "Johnny Sins, Manuel Ferrara..." },
  { name: "Positions sexuelles", emoji: "🍑", examples: "Missionnaire, Levrette..." },
  { name: "Sites porno", emoji: "💻", examples: "Pornhub, Xvideos..." },
  { name: "Mots liés au sexe", emoji: "🔥", examples: "Orgasme, Capote..." },
  { name: "Parties du corps sexy", emoji: "👀", examples: "Fesses, Lèvres..." },
  { name: "Sex toys", emoji: "🎀", examples: "Vibro, Menottes..." },
  { name: "Trucs qu'on dit au lit", emoji: "🛏️", examples: "Plus fort, Continue..." },
  { name: "Fantasmes courants", emoji: "💭", examples: "Trio, Uniforme..." },
  { name: "Fetichismes", emoji: "⛓️", examples: "Pieds, Cuir..." },
  { name: "Excuses pour un suçon", emoji: "😳", examples: "Le chat, L'aspirateur..." },
  { name: "Raisons de rompre", emoji: "💔", examples: "Il ronfle, Il triche..." },
  { name: "Choses interdites en public", emoji: "🚫", examples: "Péter, Se gratter..." },
  { name: "Pires textos à envoyer à son ex", emoji: "📱", examples: "Tu me manques, T'es où..." },
  { name: "Excuses pour rentrer tard", emoji: "🌙", examples: "Mon tel était mort..." },
  { name: "Surnoms coquins", emoji: "😏", examples: "Bébé, Mon coeur..." },
  { name: "Trucs qu'on fait en cachette", emoji: "🤫", examples: "Stalker un ex..." },
  { name: "Pickup lines nulles", emoji: "🧀", examples: "T'as un plan ?..." },
  { name: "Endroits pour faire l'amour", emoji: "📍", examples: "Voiture, Ascenseur..." },
  { name: "Types de kiss", emoji: "💋", examples: "French, Dans le cou..." },

  // -- Drôle / Soirée --
  { name: "Insultes créatives", emoji: "🤬", examples: "Patate, Cornichon..." },
  { name: "Choses qu'on fait bourré", emoji: "🍺", examples: "Appeler son ex, Tomber..." },
  { name: "Pires premiers dates", emoji: "💀", examples: "Il parle de son ex..." },
  { name: "Excuses pour pas aller en cours", emoji: "📚", examples: "J'ai la gastro..." },
  { name: "Mensonges qu'on dit tous", emoji: "🤥", examples: "J'arrive dans 5 min..." },
  { name: "Trucs relous en soirée", emoji: "🎉", examples: "Quelqu'un vomit..." },
  { name: "Phrases de mère", emoji: "👩", examples: "On a de la nourriture à la maison..." },
  { name: "Pires cadeaux", emoji: "🎁", examples: "Des chaussettes, Un livre..." },
  { name: "Trucs qu'on Google en secret", emoji: "🔍", examples: "C'est grave si..." },
  { name: "Red flags en couple", emoji: "🚩", examples: "Il check ton tel..." },
  { name: "Icks", emoji: "🤢", examples: "Il court avec un sac à dos..." },
  { name: "Types de potes en soirée", emoji: "🥳", examples: "Celui qui dort, celui qui pleure..." },
  { name: "Trucs chiants au réveil", emoji: "⏰", examples: "Pas de café, Le réveil..." },
  { name: "Raisons d'être en retard", emoji: "⌚", examples: "Le bus, Mon réveil..." },
  { name: "Bruits du corps humain", emoji: "💨", examples: "Rot, Pet, Gargouilli..." },

  // -- Culture / Classique --
  { name: "Marques de voiture", emoji: "🚗", examples: "BMW, Mercedes..." },
  { name: "Pays d'Europe", emoji: "🇪🇺", examples: "France, Espagne..." },
  { name: "Capitales du monde", emoji: "🌍", examples: "Paris, Tokyo..." },
  { name: "Rappeurs français", emoji: "🎤", examples: "Booba, Jul..." },
  { name: "Rappeurs américains", emoji: "🎙️", examples: "Drake, Eminem..." },
  { name: "Chanteurs/chanteuses", emoji: "🎵", examples: "Beyoncé, Adele..." },
  { name: "Films Disney", emoji: "🏰", examples: "Le Roi Lion, Aladdin..." },
  { name: "Séries Netflix", emoji: "📺", examples: "Squid Game, Stranger Things..." },
  { name: "Jeux vidéo", emoji: "🎮", examples: "GTA, FIFA..." },
  { name: "Personnages de manga", emoji: "📖", examples: "Naruto, Goku..." },
  { name: "Footballeurs", emoji: "⚽", examples: "Mbappé, Messi..." },
  { name: "Marques de luxe", emoji: "👜", examples: "Gucci, Louis Vuitton..." },
  { name: "Marques de fast-food", emoji: "🍔", examples: "McDo, KFC..." },
  { name: "Réseaux sociaux", emoji: "📲", examples: "Insta, TikTok..." },
  { name: "Super-héros", emoji: "🦸", examples: "Batman, Spider-Man..." },
  { name: "Pokémon", emoji: "⚡", examples: "Pikachu, Dracaufeu..." },
  { name: "Fruits", emoji: "🍎", examples: "Pomme, Banane..." },
  { name: "Légumes", emoji: "🥦", examples: "Carotte, Tomate..." },
  { name: "Animaux de la ferme", emoji: "🐄", examples: "Vache, Cochon..." },
  { name: "Animaux sauvages", emoji: "🦁", examples: "Lion, Tigre..." },
  { name: "Sports", emoji: "🏅", examples: "Foot, Tennis..." },
  { name: "Instruments de musique", emoji: "🎸", examples: "Guitare, Piano..." },
  { name: "Matières à l'école", emoji: "✏️", examples: "Maths, Français..." },
  { name: "Couleurs", emoji: "🎨", examples: "Rouge, Bleu..." },
  { name: "Prénoms de mec", emoji: "👦", examples: "Lucas, Adam..." },
  { name: "Prénoms de meuf", emoji: "👧", examples: "Léa, Emma..." },
  { name: "Marques de fringues", emoji: "👕", examples: "Nike, Zara..." },
  { name: "Marques de téléphone", emoji: "📱", examples: "Apple, Samsung..." },
  { name: "Desserts", emoji: "🍰", examples: "Tiramisu, Crème brûlée..." },
  { name: "Boissons alcoolisées", emoji: "🍸", examples: "Vodka, Whisky..." },
  { name: "Cocktails", emoji: "🍹", examples: "Mojito, Piña Colada..." },
  { name: "Pays d'Afrique", emoji: "🌍", examples: "Maroc, Sénégal..." },
  { name: "Villes de France", emoji: "🇫🇷", examples: "Marseille, Lyon..." },
  { name: "Émissions TV", emoji: "📺", examples: "TPMP, Koh-Lanta..." },
  { name: "Youtubers/Streamers français", emoji: "🖥️", examples: "Squeezie, Amixem..." },
  { name: "Applications de téléphone", emoji: "📲", examples: "WhatsApp, Uber..." },
  { name: "Films d'horreur", emoji: "👻", examples: "Scream, Saw..." },
  { name: "Marques de chips", emoji: "🥔", examples: "Lay's, Pringles..." },
  { name: "Marques de soda", emoji: "🥤", examples: "Coca, Fanta..." },
  { name: "Drapeaux qu'on connait", emoji: "🏳️", examples: "France, Japon..." },
  { name: "Trucs dans une trousse", emoji: "✏️", examples: "Stylo, Gomme..." },
  { name: "Trucs dans un frigo", emoji: "🧊", examples: "Lait, Beurre..." },
  { name: "Trucs dans une salle de bain", emoji: "🚿", examples: "Savon, Shampoing..." },
  { name: "Métiers qu'on voulait faire enfant", emoji: "👶", examples: "Pompier, Astronaute..." },
  { name: "Races de chien", emoji: "🐕", examples: "Labrador, Berger allemand..." },
  { name: "Personnages de film culte", emoji: "🎬", examples: "Dark Vador, Joker..." },
];

// ── Helpers ─────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const BG_GRADIENT =
  "bg-[radial-gradient(circle_at_18%_20%,rgba(255,120,50,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(168,85,247,0.14),transparent_35%),linear-gradient(145deg,#0a0118,#120428_42%,#08011a)]";

// ── Component ───────────────────────────────────────────────

export default function CategoryChronoGame({
  roomCode,
  playerId,
  playerName,
  onReturnToLobby,
}: GameProps) {
  // ── Setup ──
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", ""]);
  const [timerBase, setTimerBase] = useState(10);

  // ── Game ──
  const [phase, setPhase] = useState<"setup" | "category-reveal" | "playing" | "eliminated" | "game-over">("setup");
  const [players, setPlayers] = useState<{ name: string; lives: number; eliminated: boolean }[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [categoryQueue, setCategoryQueue] = useState<Category[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundInCategory, setRoundInCategory] = useState(0);
  const [eliminatedName, setEliminatedName] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const currentCategory = categoryQueue[categoryIndex];
  const alivePlayers = players.filter((p) => !p.eliminated);
  const currentPlayer = players[currentPlayerIndex];

  // ── Timer ──
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === "playing" && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          const next = Math.max(0, +(t - 0.1).toFixed(1));
          if (next === 0) {
            stopTimer();
          }
          return next;
        });
      }, 100);
      return () => stopTimer();
    }
  }, [phase, isPaused, stopTimer]);

  // ── Derived timer speed: gets faster as rounds go on ──
  const getTimer = useCallback(() => {
    const reduction = Math.min(roundInCategory * 0.5, timerBase - 3);
    return Math.max(3, timerBase - reduction);
  }, [roundInCategory, timerBase]);

  // ── Setup handlers ──
  const updateName = (i: number, val: string) => {
    setPlayerNames((prev) => {
      const copy = [...prev];
      copy[i] = val;
      return copy;
    });
  };

  const addPlayer = () => setPlayerNames((prev) => [...prev, ""]);
  const removePlayer = (i: number) => setPlayerNames((prev) => prev.filter((_, idx) => idx !== i));

  const canStart = playerNames.filter((n) => n.trim()).length >= 2;

  const startGame = useCallback(() => {
    const activePlayers = playerNames
      .filter((n) => n.trim())
      .map((n) => ({ name: n.trim(), lives: 3, eliminated: false }));
    setPlayers(activePlayers);
    setCategoryQueue(shuffleArray(CATEGORIES));
    setCategoryIndex(0);
    setCurrentPlayerIndex(0);
    setRoundInCategory(0);
    setPhase("category-reveal");
  }, [playerNames]);

  // ── Category reveal → playing ──
  const startPlaying = useCallback(() => {
    setRoundInCategory(0);
    setTimeLeft(timerBase);
    setPhase("playing");
    setIsPaused(false);
  }, [timerBase]);

  // ── Find next alive player ──
  const nextAlivePlayer = useCallback(
    (fromIndex: number, playersList: typeof players) => {
      let idx = (fromIndex + 1) % playersList.length;
      let loops = 0;
      while (playersList[idx].eliminated && loops < playersList.length) {
        idx = (idx + 1) % playersList.length;
        loops++;
      }
      return idx;
    },
    []
  );

  // ── Correct answer → next player ──
  const handleCorrect = useCallback(() => {
    if (phase !== "playing") return;
    stopTimer();
    const nextRound = roundInCategory + 1;
    setRoundInCategory(nextRound);
    const nextIdx = nextAlivePlayer(currentPlayerIndex, players);
    setCurrentPlayerIndex(nextIdx);
    const reduction = Math.min(nextRound * 0.5, timerBase - 3);
    setTimeLeft(Math.max(3, timerBase - reduction));
    setIsPaused(false);
  }, [phase, stopTimer, roundInCategory, currentPlayerIndex, players, nextAlivePlayer, timerBase]);

  // ── Player fails (time out or wrong) ──
  const handleFail = useCallback(() => {
    if (phase !== "playing") return;
    stopTimer();

    const updated = [...players];
    updated[currentPlayerIndex] = {
      ...updated[currentPlayerIndex],
      lives: updated[currentPlayerIndex].lives - 1,
    };

    if (updated[currentPlayerIndex].lives <= 0) {
      updated[currentPlayerIndex].eliminated = true;
    }

    setPlayers(updated);
    setEliminatedName(players[currentPlayerIndex].name);

    const alive = updated.filter((p) => !p.eliminated);
    if (alive.length <= 1) {
      setPlayers(updated);
      setPhase("game-over");
      return;
    }

    setPhase("eliminated");
  }, [phase, stopTimer, players, currentPlayerIndex]);

  // Auto-fail when timer reaches 0
  useEffect(() => {
    if (phase === "playing" && timeLeft === 0) {
      const timeoutId = setTimeout(() => {
        handleFail();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [phase, timeLeft, handleFail]);

  // ── After elimination screen → next category ──
  const continueGame = useCallback(() => {
    const nextCat = categoryIndex + 1;
    const nextIdx = nextAlivePlayer(currentPlayerIndex, players);
    setCurrentPlayerIndex(nextIdx);

    if (nextCat < categoryQueue.length) {
      setCategoryIndex(nextCat);
      setPhase("category-reveal");
    } else {
      // Reshuffle if we ran out
      setCategoryQueue(shuffleArray(CATEGORIES));
      setCategoryIndex(0);
      setPhase("category-reveal");
    }
  }, [categoryIndex, categoryQueue.length, currentPlayerIndex, players, nextAlivePlayer]);

  const resetGame = () => {
    setPhase("setup");
    setPlayers([]);
    setCategoryIndex(0);
  };

  // ── Winner ──
  const winner = alivePlayers[0];

  // ── Timer bar width ──
  const timerPercent = timerBase > 0 ? (timeLeft / timerBase) * 100 : 0;
  const timerColor =
    timeLeft > timerBase * 0.5
      ? "bg-green-500"
      : timeLeft > timerBase * 0.25
      ? "bg-yellow-500"
      : "bg-red-500";

  // ── Render ────────────────────────────────────────────────

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden text-white", BG_GRADIENT)}>
      {/* ── SETUP ──────────────────────────────────────────── */}
      {phase === "setup" && (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8">
          <h1
            className="mb-2 text-center text-4xl font-bold tracking-tight text-orange-100"
            style={{ animation: "fadeUp 0.5s ease-out" }}
          >
            Catégorie Chrono
          </h1>
          <p
            className="mb-8 text-center text-sm text-orange-200/60"
            style={{ animation: "fadeUp 0.6s ease-out" }}
          >
            Trouve un mot dans la catégorie avant que le temps s&apos;écoule !
          </p>

          <div className="mb-4 w-full space-y-3">
            {playerNames.map((name, i) => (
              <div key={i} className="flex gap-2" style={{ animation: `fadeUp ${0.4 + i * 0.08}s ease-out` }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Joueur ${i + 1}`}
                  className="flex-1 rounded-xl border border-orange-300/20 bg-black/30 px-4 py-3 text-sm text-orange-100 placeholder-orange-300/30 outline-none backdrop-blur-xl focus:border-orange-400/40"
                />
                {playerNames.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="rounded-xl px-3 text-xs text-red-400/70 transition hover:bg-red-500/10"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>

          {playerNames.length < 8 && (
            <button
              onClick={addPlayer}
              className="mb-6 rounded-xl border border-orange-300/20 bg-black/30 px-5 py-2 text-sm text-orange-300/80 backdrop-blur-xl transition hover:bg-orange-500/10"
            >
              + Ajouter un joueur
            </button>
          )}

          <div
            className="mb-6 w-full rounded-2xl border border-orange-300/20 bg-black/35 p-5 backdrop-blur-xl"
            style={{ animation: "fadeUp 0.7s ease-out" }}
          >
            <label className="mb-2 block text-xs uppercase tracking-wider text-orange-200/50">
              Temps par tour
            </label>
            <div className="flex gap-2">
              {[6, 8, 10, 12, 15].map((d) => (
                <button
                  key={d}
                  onClick={() => setTimerBase(d)}
                  className={cn(
                    "rounded-xl px-4 py-2 font-mono text-sm transition-all",
                    timerBase === d
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20"
                      : "border border-orange-300/20 bg-black/30 text-orange-300/60 hover:bg-orange-500/10"
                  )}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={!canStart}
            className={cn(
              "press-effect rounded-xl px-8 py-3 text-lg font-semibold transition-all",
              canStart
                ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                : "cursor-not-allowed bg-gray-700/50 text-gray-500"
            )}
          >
            C&apos;est parti !
          </button>
          {!canStart && <p className="mt-2 text-xs text-orange-300/40">Min. 2 joueurs</p>}

          {onReturnToLobby && (
            <button onClick={onReturnToLobby} className="mt-4 text-sm text-orange-300/40 transition hover:text-orange-300/70">
              Retour au lobby
            </button>
          )}
        </div>
      )}

      {/* ── CATEGORY REVEAL ────────────────────────────────── */}
      {phase === "category-reveal" && currentCategory && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div
            className="w-full max-w-sm rounded-3xl border border-orange-300/20 bg-black/40 p-8 text-center backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            {/* Lives display */}
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {players
                .filter((p) => !p.eliminated)
                .map((p, i) => (
                  <div key={i} className="rounded-full border border-orange-300/15 bg-black/30 px-3 py-1 text-xs">
                    <span className="text-orange-100">{p.name}</span>
                    <span className="ml-1 text-red-400">{"❤️".repeat(p.lives)}</span>
                  </div>
                ))}
            </div>

            <p className="mb-2 text-xs uppercase tracking-wider text-orange-200/50">
              Catégorie
            </p>
            <div className="mb-2 text-6xl">{currentCategory.emoji}</div>
            <h2 className="mb-3 text-3xl font-bold text-orange-100">{currentCategory.name}</h2>
            {currentCategory.examples && (
              <p className="mb-6 text-sm text-white/40">{currentCategory.examples}</p>
            )}

            <p className="mb-6 text-sm text-white/50">
              <span className="font-semibold text-orange-200">{players[currentPlayerIndex]?.name}</span> commence !
            </p>

            <button
              onClick={startPlaying}
              className="press-effect rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-orange-500/40"
            >
              GO !
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYING ────────────────────────────────────────── */}
      {phase === "playing" && currentCategory && currentPlayer && (
        <div className="flex min-h-screen flex-col">
          {/* Timer bar */}
          <div className="relative h-2 w-full bg-white/10">
            <div
              className={cn("h-full transition-all duration-100", timerColor)}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          {/* Category + Timer */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCategory.emoji}</span>
              <span className="text-sm font-semibold text-white/70">{currentCategory.name}</span>
            </div>
            <div
              className={cn(
                "font-mono text-3xl font-bold tabular-nums",
                timeLeft <= 3 ? "animate-pulse text-red-400" : "text-orange-100"
              )}
            >
              {timeLeft.toFixed(1)}
            </div>
          </div>

          {/* Lives */}
          <div className="flex flex-wrap justify-center gap-2 px-4 pb-2">
            {players
              .filter((p) => !p.eliminated)
              .map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    p.name === currentPlayer.name
                      ? "border-orange-400/50 bg-orange-500/20 text-orange-100"
                      : "border-white/10 bg-black/20 text-white/50"
                  )}
                >
                  {p.name} {"❤️".repeat(p.lives)}
                </div>
              ))}
          </div>

          {/* Current player */}
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <p className="mb-2 text-sm uppercase tracking-wider text-white/40">C&apos;est à</p>
            <h2
              className="mb-4 text-5xl font-bold text-orange-100"
              style={{ animation: "scaleIn 0.2s ease-out" }}
              key={currentPlayerIndex}
            >
              {currentPlayer.name}
            </h2>
            <p className="text-lg text-white/50">Dis un mot !</p>
          </div>

          {/* Action buttons */}
          <div className="flex">
            <button
              onClick={handleCorrect}
              className="flex flex-1 flex-col items-center justify-center border-r border-green-400/10 bg-green-500/8 py-8 transition active:bg-green-500/20"
            >
              <span className="text-4xl">✓</span>
              <span className="mt-1 text-sm uppercase tracking-wider text-green-300/70">Valide</span>
            </button>
            <button
              onClick={handleFail}
              className="flex flex-1 flex-col items-center justify-center bg-red-500/8 py-8 transition active:bg-red-500/20"
            >
              <span className="text-4xl">✗</span>
              <span className="mt-1 text-sm uppercase tracking-wider text-red-300/70">Perdu</span>
            </button>
          </div>
        </div>
      )}

      {/* ── ELIMINATED ─────────────────────────────────────── */}
      {phase === "eliminated" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div
            className="w-full max-w-sm rounded-3xl border border-red-400/20 bg-black/40 p-8 text-center backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            <div className="mb-4 text-6xl">💀</div>
            <h2 className="mb-2 text-2xl font-bold text-red-300">{eliminatedName}</h2>
            <p className="mb-2 text-white/50">
              {players.find((p) => p.name === eliminatedName)?.eliminated
                ? "est éliminé !"
                : "perd une vie !"}
            </p>

            {/* Lives display */}
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {players
                .filter((p) => !p.eliminated)
                .map((p, i) => (
                  <div key={i} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs">
                    <span className="text-orange-100">{p.name}</span>
                    <span className="ml-1 text-red-400">{"❤️".repeat(p.lives)}</span>
                  </div>
                ))}
            </div>

            <button
              onClick={continueGame}
              className="press-effect rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-3 font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-orange-500/40"
            >
              Catégorie suivante
            </button>
          </div>
        </div>
      )}

      {/* ── GAME OVER ──────────────────────────────────────── */}
      {phase === "game-over" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div
            className="w-full max-w-sm rounded-3xl border border-orange-300/20 bg-black/40 p-8 text-center backdrop-blur-xl"
            style={{ animation: "scaleIn 0.5s ease-out" }}
          >
            <div className="mb-4 text-6xl">🏆</div>
            <p className="mb-1 text-xs uppercase tracking-wider text-orange-200/50">Vainqueur</p>
            <h2 className="mb-6 text-4xl font-bold text-yellow-200" style={{ animation: "fadeUp 0.7s ease-out" }}>
              {winner?.name ?? "Personne"}
            </h2>

            <div className="mb-8 space-y-2">
              {players
                .sort((a, b) => b.lives - a.lives)
                .map((p, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3",
                      i === 0 ? "border-yellow-400/30 bg-yellow-500/10" : "border-white/8 bg-black/20"
                    )}
                  >
                    <span className="text-sm text-orange-100">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {p.name}
                    </span>
                    <span className="text-sm text-red-400">
                      {p.eliminated ? "💀" : "❤️".repeat(p.lives)}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="press-effect flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-orange-500/40"
              >
                Rejouer
              </button>
              <button
                onClick={resetGame}
                className="flex-1 rounded-xl border border-orange-300/20 bg-black/30 py-3 text-sm text-orange-300/70 backdrop-blur-xl transition hover:bg-orange-500/10"
              >
                Nouvelle partie
              </button>
            </div>

            {onReturnToLobby && (
              <button onClick={onReturnToLobby} className="mt-4 text-sm text-orange-300/40 transition hover:text-orange-300/70">
                Retour au lobby
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
