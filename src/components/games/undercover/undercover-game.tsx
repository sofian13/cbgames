"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types (mirrors server state) ────────────────────────────

type Role = "civilian" | "undercover" | "mrwhite";
type GamePhase =
  | "waiting"
  | "role-reveal"
  | "describe"
  | "vote"
  | "vote-result"
  | "mrwhite-guess"
  | "game-over";

interface UndercoverPlayerState {
  id: string;
  name: string;
  alive: boolean;
  hasDescribed: boolean;
  hasVoted: boolean;
  description: string | null;
  role: Role | null;
  word: string | null;
}

interface ClueEntry {
  playerId: string;
  playerName: string;
  text: string;
  round: number;
}

interface UndercoverState {
  phase: GamePhase;
  round: number;
  players: UndercoverPlayerState[];
  turnOrder: string[];
  currentDescriberId: string | null;
  clueHistory: ClueEntry[];
  timeLeft: number;
  myRole: Role | null;
  myWord: string | null;
  eliminatedPlayerId: string | null;
  eliminatedRole: Role | null;
  mrWhiteGuessCorrect: boolean | null;
  winners: Role | null;
  civilianWord: string | null;
  undercoverWord: string | null;
  selectedThemeId?: "classic" | "manga" | "adult" | "mixed";
  availableThemes?: Array<{
    id: "classic" | "manga" | "adult" | "mixed";
    label: string;
    description: string;
  }>;
  expectedPlayerCount?: number;
  selectedRoleDistribution?: {
    undercoverCount: number;
    mrWhiteCount: number;
    civilianCount: number;
  };
  availableRoleDistributions?: Array<{
    undercoverCount: number;
    mrWhiteCount: number;
    civilianCount: number;
  }>;
}

type ThemeId = "classic" | "manga" | "adult" | "mixed";

interface LocalPlayer {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  alive: boolean;
}

interface LocalSecretCard {
  role: Role;
  word: string | null;
}

type LocalPhase =
  | "setup"
  | "cards"
  | "order"
  | "describe"
  | "vote"
  | "vote-result"
  | "game-over";

const LOCAL_WORD_PAIRS: Record<Exclude<ThemeId, "mixed">, [string, string][]> = {
  classic: [
    ["Chat", "Chien"],
    ["Coca-Cola", "Pepsi"],
    ["Netflix", "YouTube"],
    ["Pizza", "Burger"],
    ["iPhone", "Samsung"],
    ["Paris", "Londres"],
    ["Football", "Rugby"],
    ["Chocolat", "Caramel"],
    ["Avion", "Helicoptere"],
    ["Guitare", "Piano"],
    ["Batman", "Superman"],
    ["McDonald's", "Burger King"],
    ["Instagram", "TikTok"],
    ["Plage", "Piscine"],
    ["Voiture", "Moto"],
    ["Soleil", "Lune"],
    ["Dentiste", "Medecin"],
    ["Cinema", "Theatre"],
    ["Cafe", "The"],
    ["Montagne", "Colline"],
    ["Pomme", "Poire"],
    ["Ski", "Snowboard"],
    ["Chemise", "T-shirt"],
    ["Biere", "Vin"],
    ["Violon", "Violoncelle"],
    ["Manga", "Comics"],
    ["Croissant", "Pain au chocolat"],
    ["Sushi", "Maki"],
    ["Tennis", "Badminton"],
    ["Lion", "Tigre"],
    ["Rose", "Tulipe"],
    ["Pluie", "Neige"],
    ["Train", "Metro"],
    ["Livre", "Magazine"],
    ["Canape", "Fauteuil"],
    ["Email", "SMS"],
    ["Gateau", "Tarte"],
    ["Google", "Bing"],
    ["Stylo", "Crayon"],
    ["Fourchette", "Cuillere"],
    ["Basket", "Running"],
    ["Chapeau", "Casquette"],
    ["Araignee", "Scorpion"],
    ["Mer", "Ocean"],
    ["Fromage", "Beurre"],
    ["Radio", "Podcast"],
    ["Aquarium", "Zoo"],
    ["Chaussettes", "Chaussures"],
    ["Marteau", "Tournevis"],
    ["Fraise", "Framboise"],
    ["Souris", "Rat"],
    ["Crocodile", "Alligator"],
    ["Trompette", "Saxophone"],
    ["Bretagne", "Normandie"],
    ["Hibou", "Chouette"],
    ["Crevette", "Homard"],
    ["Mars", "Snickers"],
    ["Spotify", "Deezer"],
    ["WhatsApp", "Telegram"],
    ["Karate", "Judo"],
    ["Opera", "Ballet"],
    ["Camping", "Glamping"],
    ["Bague", "Bracelet"],
    ["Valise", "Sac a dos"],
    ["Pyramide", "Tour Eiffel"],
    ["Moustache", "Barbe"],
    ["Aspirateur", "Balai"],
    ["Parapluie", "Parasol"],
    ["Vampire", "Loup-garou"],
    ["Banane", "Ananas"],
  ],
  manga: [
    ["Naruto", "Sasuke"],
    ["Goku", "Vegeta"],
    ["Luffy", "Zoro"],
    ["Itachi", "Madara"],
    ["Gojo", "Sukuna"],
    ["Tanjiro", "Zenitsu"],
    ["Levi", "Eren"],
    ["Mikasa", "Historia"],
    ["Nami", "Robin"],
    ["One Piece", "Bleach"],
    ["Konoha", "Akatsuki"],
    ["Shinigami", "Hollow"],
    ["Sharingan", "Byakugan"],
    ["Bankai", "Zanpakuto"],
    ["Titan", "Geant"],
    ["Jutsu", "Technique"],
  ],
  adult: [
    ["Tinder", "Bumble"],
    ["Date", "Plan d'un soir"],
    ["Crush", "Ex"],
    ["Flirt", "Seduire"],
    ["Love hotel", "Airbnb"],
    ["String", "Culotte"],
    ["Corset", "Porte-jarretelles"],
    ["Strip-tease", "Lap dance"],
    ["Fantasme", "Roleplay"],
    ["Soumis", "Dominant"],
    ["Latex", "Cuir"],
    ["message mignon", "Nude"],
    ["OnlyFans", "MYM"],
    ["18+", "Tout public"],
    ["Sensuel", "Sexuel"],
    ["Tease", "Provoc"],
    ["Kiss", "French kiss"],
    ["Preliminaires", "Baiser"],
    ["Infidele", "Fidele"],
    ["Desir", "Tentation"],
    ["Clara Morgane", "Lana Rhoades"],
    ["Khalamite", "Mia Khalifa"],
    ["Johnny Sins", "Manuel Ferrara"],
    ["Missionnaire", "Levrette"],
    ["Chatte", "Seins"],
    ["Cunnilingus", "Pipe"],
    ["Echangisme", "Partouze"],
    ["Levre", "Clito"],
    ["Sperme", "Jus"],
    ["Gorge profonde", "Sodomie"],
    ["Fellation", "Cunnilingus"],
    ["Penetration", "Ejaculation"],
    ["Fetichisme", "Voyeurisme"],
    ["Plug anal", "Gode ceinture"],
    ["Domination", "Soumission"],
    ["Nymphomane", "Puceau"],
    ["Menottes", "Chaines"],
    ["Masque", "Ouvre-bouche"],
    ["Poil", "Rase"],
    ["69", "Ciseaux"],
    ["Lubrifiant", "Salive"],
    ["BDSM", "Soft Dom"],
    ["Footjob", "Handjob"],
    ["Pornhub", "Xvideos"],
    ["Lingerie", "String troue"],
    ["Brazzers", "xnxx"],
    ["Jacquie et Michel", "YouPorn"],
    ["XHamster", "RedTube"],
    ["Riley Reid", "Adriana Chechik"],
    ["Mia Khalifa", "Angela White"],
    ["Lana Rhoades", "Abella Danger"],
  ],
};

function getLocalPairs(themeId: ThemeId): [string, string][] {
  if (themeId === "mixed") {
    return [
      ...LOCAL_WORD_PAIRS.classic,
      ...LOCAL_WORD_PAIRS.manga,
      ...LOCAL_WORD_PAIRS.adult,
    ];
  }
  return LOCAL_WORD_PAIRS[themeId];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Helpers ─────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  civilian: "Civil",
  undercover: "Undercover",
  mrwhite: "Mr. White",
};

const ROLE_COLORS: Record<Role, string> = {
  civilian: "text-blue-400",
  undercover: "text-red-400",
  mrwhite: "text-white",
};

const ROLE_BG: Record<Role, string> = {
  civilian: "border-blue-400/30 bg-blue-400/5",
  undercover: "border-red-400/30 bg-red-400/5",
  mrwhite: "border-white/30 bg-white/5",
};

const ROLE_GLOW: Record<Role, string> = {
  civilian: "0 0 40px rgba(96,165,250,0.3), 0 0 80px rgba(96,165,250,0.15)",
  undercover:
    "0 0 40px rgba(248,113,113,0.3), 0 0 80px rgba(248,113,113,0.15)",
  mrwhite: "0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.15)",
};

function getRoleLabel(role: Role | null): string {
  return role ? ROLE_LABELS[role] : "???";
}

function getRoleColor(role: Role | null): string {
  return role ? ROLE_COLORS[role] : "text-white/40";
}

function getMaxUndercoverFor(playerCount: number): number {
  return Math.floor(Math.max(0, playerCount) / 2);
}

function getMaxMrWhiteFor(playerCount: number): number {
  return playerCount >= 5 ? 1 : 0;
}

function getMaxThreatsFor(playerCount: number): number {
  return Math.floor(Math.max(0, playerCount) / 2);
}

function normalizeLocalRoleConfig(
  playerCount: number,
  undercoverCount: number,
  mrWhiteCount: number
) {
  const safePlayers = Math.max(1, playerCount);
  const maxUndercover = Math.min(getMaxUndercoverFor(safePlayers), safePlayers - 1);
  const maxMrWhite = Math.min(getMaxMrWhiteFor(safePlayers), safePlayers - 1);
  const maxThreats = Math.min(getMaxThreatsFor(safePlayers), safePlayers - 1);

  const minUndercover = safePlayers >= 2 ? 1 : 0;
  const normalizedUndercover = Math.max(
    minUndercover,
    Math.min(undercoverCount, maxUndercover)
  );
  let normalizedMrWhite = Math.max(0, Math.min(mrWhiteCount, maxMrWhite));

  if (normalizedUndercover + normalizedMrWhite > maxThreats) {
    normalizedMrWhite = Math.max(0, maxThreats - normalizedUndercover);
  }

  if (safePlayers - normalizedUndercover - normalizedMrWhite < 1) {
    normalizedMrWhite = Math.max(0, safePlayers - normalizedUndercover - 1);
  }

  return {
    undercoverCount: normalizedUndercover,
    mrWhiteCount: normalizedMrWhite,
  };
}

// ── Component ───────────────────────────────────────────────

export default function UndercoverGame({
  roomCode,
  playerId,
  playerName,
}: GameProps) {
  const { sendAction } = useGame(roomCode, "undercover", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as UndercoverState;

  const [clueInput, setClueInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [voteTarget, setVoteTarget] = useState<string | null>(null);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [clueSubmitted, setClueSubmitted] = useState(false);
  const clueInputRef = useRef<HTMLInputElement>(null);
  const guessInputRef = useRef<HTMLInputElement>(null);
  const prevRoundRef = useRef(0);
  const prevPhaseRef = useRef<GamePhase>("waiting");
  const clueListRef = useRef<HTMLDivElement>(null);

  // Single-phone local mode
  const [localMode, setLocalMode] = useState(false);
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [localSetupStep, setLocalSetupStep] = useState<"config" | "names">(
    "config"
  );
  const [localTheme, setLocalTheme] = useState<ThemeId>("mixed");
  const [localPlayerCount, setLocalPlayerCount] = useState(5);
  const [localUndercoverCount, setLocalUndercoverCount] = useState(1);
  const [localMrWhiteCount, setLocalMrWhiteCount] = useState(1);
  const [localNameInput, setLocalNameInput] = useState("");
  const [localNameIndex, setLocalNameIndex] = useState(0);
  const [localCollectedNames, setLocalCollectedNames] = useState<string[]>(
    []
  );
  const [localPlayers, setLocalPlayers] = useState<LocalPlayer[]>([]);
  const [localTurnOrder, setLocalTurnOrder] = useState<string[]>([]);
  const [localCurrentIndex, setLocalCurrentIndex] = useState(0);
  const [localRound, setLocalRound] = useState(1);
  const [localClues, setLocalClues] = useState<ClueEntry[]>([]);
  const [localCardTurnIndex, setLocalCardTurnIndex] = useState(0);
  const [localSecretDeck, setLocalSecretDeck] = useState<LocalSecretCard[]>([]);
  const [localCardReveal, setLocalCardReveal] = useState<{
    playerName: string;
    role: Role;
    word: string | null;
  } | null>(null);
  const [localCardFlip, setLocalCardFlip] = useState(false);
  const [localDrawnSlot, setLocalDrawnSlot] = useState<number | null>(null);
  const [localReviewOpen, setLocalReviewOpen] = useState(false);
  const [localReviewPlayerId, setLocalReviewPlayerId] = useState<string | null>(null);
  const [localVoteQueue, setLocalVoteQueue] = useState<string[]>([]);
  const [localVoteIndex, setLocalVoteIndex] = useState(0);
  const [localSelectedTarget, setLocalSelectedTarget] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, string>>({});
  const [localPassToId, setLocalPassToId] = useState<string | null>(null);
  const [localEliminatedId, setLocalEliminatedId] = useState<string | null>(null);
  const [localEliminatedRole, setLocalEliminatedRole] = useState<Role | null>(null);
  const [localWinners, setLocalWinners] = useState<Role | null>(null);
  const [showWordPeek, setShowWordPeek] = useState(false);

  // Reset state on phase/round changes
  useEffect(() => {
    if (!state) return;
    const phaseChanged = state.phase !== prevPhaseRef.current;
    const roundChanged = state.round !== prevRoundRef.current;

    if (phaseChanged || roundChanged) {
      prevPhaseRef.current = state.phase;
      prevRoundRef.current = state.round;

      if (state.phase === "describe") {
        setClueInput("");
        setClueSubmitted(false);
      }
      if (state.phase === "vote") {
        setVoteTarget(null);
        setVoteConfirmed(false);
      }
      if (state.phase === "mrwhite-guess") {
        setGuessInput("");
      }
    }
  }, [state?.phase, state?.round, state]);

  // Focus clue input when it is my turn
  useEffect(() => {
    if (state?.phase === "describe" && state.currentDescriberId === playerId) {
      setTimeout(() => clueInputRef.current?.focus(), 100);
    }
  }, [state?.phase, state?.currentDescriberId, playerId]);

  // Focus guess input for Mr. White
  useEffect(() => {
    if (state?.phase === "mrwhite-guess" && state.myRole === "mrwhite") {
      setTimeout(() => guessInputRef.current?.focus(), 100);
    }
  }, [state?.phase, state?.myRole]);

  // Auto-scroll clue history
  useEffect(() => {
    if (clueListRef.current) {
      clueListRef.current.scrollTop = clueListRef.current.scrollHeight;
    }
  }, [state?.clueHistory?.length]);

  const handleSubmitClue = useCallback(() => {
    const trimmed = clueInput.trim();
    if (!trimmed || clueSubmitted) return;
    setClueSubmitted(true);
    sendAction({ action: "describe", text: trimmed });
  }, [clueInput, clueSubmitted, sendAction]);

  const handleClueKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitClue();
      }
    },
    [handleSubmitClue]
  );

  const handleVote = useCallback(() => {
    if (!voteTarget || voteConfirmed) return;
    setVoteConfirmed(true);
    sendAction({ action: "vote", targetId: voteTarget });
  }, [voteTarget, voteConfirmed, sendAction]);

  const handleMrWhiteGuess = useCallback(() => {
    const trimmed = guessInput.trim();
    if (!trimmed) return;
    sendAction({ action: "mrwhite-guess", guess: trimmed });
  }, [guessInput, sendAction]);

  const handleGuessKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleMrWhiteGuess();
      }
    },
    [handleMrWhiteGuess]
  );

  const handleBackToGamePicker = useCallback(() => {
    window.location.href = `/room/${roomCode}`;
  }, [roomCode]);

  const getLocalCurrentPlayer = useCallback(() => {
    const id = localTurnOrder[localCurrentIndex];
    return localPlayers.find((p) => p.id === id) ?? null;
  }, [localCurrentIndex, localPlayers, localTurnOrder]);

  const getLocalAlive = useCallback(
    () => localPlayers.filter((p) => p.alive),
    [localPlayers]
  );

  const buildDescribeOrder = useCallback((playersList: LocalPlayer[]) => {
    const aliveIds = playersList.filter((p) => p.alive).map((p) => p.id);
    const randomized = shuffle(aliveIds);
    if (randomized.length <= 1) return randomized;

    const first = playersList.find((p) => p.id === randomized[0]);
    if (first?.role !== "mrwhite") return randomized;

    const nextNonMrWhiteIndex = randomized.findIndex((id) => {
      const player = playersList.find((p) => p.id === id);
      return player?.role !== "mrwhite";
    });
    if (nextNonMrWhiteIndex <= 0) return randomized;

    return [
      ...randomized.slice(nextNonMrWhiteIndex),
      ...randomized.slice(0, nextNonMrWhiteIndex),
    ];
  }, []);

  const applyLocalRoleConfig = useCallback(
    (playerCount: number, undercoverCount: number, mrWhiteCount: number) => {
      const normalized = normalizeLocalRoleConfig(
        playerCount,
        undercoverCount,
        mrWhiteCount
      );
      setLocalUndercoverCount(normalized.undercoverCount);
      setLocalMrWhiteCount(normalized.mrWhiteCount);
    },
    []
  );

  const startLocalGame = useCallback((names: string[]) => {
    if (names.length < 1) return;
    const normalizedRoles = normalizeLocalRoleConfig(
      names.length,
      localUndercoverCount,
      localMrWhiteCount
    );

    const pairs = getLocalPairs(localTheme);
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const civilianWord = Math.random() < 0.5 ? pair[0] : pair[1];
    const undercoverWord = civilianWord === pair[0] ? pair[1] : pair[0];

    const players: LocalPlayer[] = names.map((name, i) => ({
      id: `local-${i + 1}`,
      name,
      role: "civilian",
      word: null,
      alive: true,
    }));

    const baseRoles: Role[] = [
      ...Array.from({ length: normalizedRoles.undercoverCount }, () => "undercover" as Role),
      ...Array.from({ length: normalizedRoles.mrWhiteCount }, () => "mrwhite" as Role),
      ...Array.from(
        {
          length:
            players.length -
            normalizedRoles.undercoverCount -
            normalizedRoles.mrWhiteCount,
        },
        () => "civilian" as Role
      ),
    ];

    const secretDeck = shuffle(
      baseRoles.map((role) => ({
        role,
        word:
          role === "mrwhite"
            ? null
            : role === "undercover"
              ? undercoverWord
              : civilianWord,
      }))
    );

    setLocalPlayers(players);
    setLocalTurnOrder([]);
    setLocalCurrentIndex(0);
    setLocalRound(1);
    setLocalClues([]);
    setLocalCardTurnIndex(0);
    setLocalSecretDeck(secretDeck);
    setLocalCardReveal(null);
    setLocalCardFlip(false);
    setLocalDrawnSlot(null);
    setLocalReviewOpen(false);
    setLocalReviewPlayerId(null);
    setLocalVotes({});
    setLocalPassToId(null);
    setLocalVoteQueue([]);
    setLocalVoteIndex(0);
    setLocalSelectedTarget(null);
    setLocalEliminatedId(null);
    setLocalEliminatedRole(null);
    setLocalWinners(null);
    setShowWordPeek(false);
    setLocalSetupStep("config");
    setLocalNameInput("");
    setLocalNameIndex(0);
    setLocalCollectedNames([]);
    setLocalPassToId(players[0]?.id ?? null);
    setLocalPhase("cards");
    setLocalMode(true);
  }, [localMrWhiteCount, localTheme, localUndercoverCount]);

  const handleContinueToNames = useCallback(() => {
    setLocalCollectedNames([]);
    setLocalNameIndex(0);
    setLocalNameInput("");
    setLocalSetupStep("names");
  }, []);

  const handleSubmitLocalName = useCallback(() => {
    const raw = localNameInput.trim();
    const nextName = raw || `Joueur ${localNameIndex + 1}`;
    const nextNames = [...localCollectedNames, nextName];

    if (nextNames.length >= localPlayerCount) {
      startLocalGame(nextNames);
      return;
    }

    setLocalCollectedNames(nextNames);
    setLocalNameIndex(nextNames.length);
    setLocalNameInput("");
  }, [
    localCollectedNames,
    localNameIndex,
    localNameInput,
    localPlayerCount,
    startLocalGame,
  ]);

  const beginLocalVote = useCallback(() => {
    setLocalSelectedTarget(null);
    setLocalPhase("vote");
  }, []);

  const goNextDescribeTurn = useCallback(() => {
    let nextIndex = localCurrentIndex + 1;
    while (
      nextIndex < localTurnOrder.length &&
      !localPlayers.find((p) => p.id === localTurnOrder[nextIndex] && p.alive)
    ) {
      nextIndex++;
    }

    if (nextIndex >= localTurnOrder.length) {
      beginLocalVote();
      return;
    }
    setLocalCurrentIndex(nextIndex);
    setLocalPassToId(localTurnOrder[nextIndex] ?? null);
  }, [beginLocalVote, localCurrentIndex, localPlayers, localTurnOrder]);

  const submitLocalClue = useCallback(() => {
    const current = getLocalCurrentPlayer();
    if (!current) return;

    setLocalClues((prev) => [
      ...prev,
      {
        playerId: current.id,
        playerName: current.name,
        text: "(indice oral)",
        round: localRound,
      },
    ]);
    setShowWordPeek(false);
    goNextDescribeTurn();
  }, [getLocalCurrentPlayer, goNextDescribeTurn, localRound]);

  const drawLocalRandomCard = useCallback(() => {
    const current = localPlayers[localCardTurnIndex];
    if (!current || localSecretDeck.length === 0) return;

    const drawIndex = Math.floor(Math.random() * localSecretDeck.length);
    const deckSlot = drawIndex;
    const card = localSecretDeck[drawIndex];
    const nextDeck = localSecretDeck.filter((_, i) => i !== drawIndex);

    setLocalPlayers((prev) =>
      prev.map((p) =>
        p.id === current.id ? { ...p, role: card.role, word: card.word } : p
      )
    );
    setLocalSecretDeck(nextDeck);
    setLocalCardReveal({
      playerName: current.name,
      role: card.role,
      word: card.word,
    });
    setLocalDrawnSlot(deckSlot);
    setLocalCardFlip(false);
    setTimeout(() => setLocalCardFlip(true), 30);
  }, [localCardTurnIndex, localPlayers, localSecretDeck]);

  const confirmLocalCard = useCallback(() => {
    if (!localCardReveal) return;
    setLocalCardReveal(null);
    setLocalDrawnSlot(null);

    const nextIndex = localCardTurnIndex + 1;
    if (nextIndex < localPlayers.length) {
      setLocalCardTurnIndex(nextIndex);
      setLocalPassToId(localPlayers[nextIndex]?.id ?? null);
      return;
    }

    const order = buildDescribeOrder(localPlayers);
    setLocalTurnOrder(order);
    setLocalCurrentIndex(0);
    setLocalPassToId(null);
    setLocalPhase("order");
  }, [buildDescribeOrder, localCardReveal, localCardTurnIndex, localPlayers]);

  const resolveLocalVotes = useCallback(
    (votes: Record<string, string>) => {
      const counts: Record<string, number> = {};
      Object.values(votes).forEach((targetId) => {
        counts[targetId] = (counts[targetId] ?? 0) + 1;
      });

      let eliminatedId: string | null = null;
      let maxVotes = 0;
      let tie = false;
      Object.entries(counts).forEach(([pid, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedId = pid;
          tie = false;
        } else if (count === maxVotes) {
          tie = true;
        }
      });

      if (tie || !eliminatedId || maxVotes === 0) {
        setLocalEliminatedId(null);
        setLocalEliminatedRole(null);
        setLocalPassToId(null);
        setLocalPhase("vote-result");
        return;
      }

      const eliminatedPlayer = localPlayers.find((p) => p.id === eliminatedId);
      if (!eliminatedPlayer) return;

      setLocalPlayers((prev) =>
        prev.map((p) => (p.id === eliminatedId ? { ...p, alive: false } : p))
      );
      setLocalEliminatedId(eliminatedId);
      setLocalEliminatedRole(eliminatedPlayer.role);
      setLocalPassToId(null);
      setLocalPhase("vote-result");
    },
    [localPlayers]
  );

  const submitLocalVote = useCallback(() => {
    if (!localSelectedTarget) return;
    resolveLocalVotes({ oral: localSelectedTarget });
    setLocalSelectedTarget(null);
  }, [localSelectedTarget, resolveLocalVotes]);

  const continueAfterLocalVoteResult = useCallback(() => {
    const alive = localPlayers.filter((p) => p.alive);
    const aliveThreats = alive.filter(
      (p) => p.role === "undercover" || p.role === "mrwhite"
    ).length;
    const aliveCivilians = alive.filter((p) => p.role === "civilian").length;

    if (aliveThreats === 0) {
      setLocalWinners("civilian");
      setLocalPhase("game-over");
      return;
    }
    if (aliveThreats >= aliveCivilians) {
      setLocalWinners("undercover");
      setLocalPhase("game-over");
      return;
    }

    const nextTurnOrder = buildDescribeOrder(alive);
    setLocalTurnOrder(nextTurnOrder);
    setLocalCurrentIndex(0);
    setLocalRound((r) => r + 1);
    setLocalEliminatedId(null);
    setLocalEliminatedRole(null);
    setLocalVotes({});
    setLocalVoteQueue([]);
    setLocalVoteIndex(0);
    setLocalSelectedTarget(null);
    setLocalPassToId(null);
    setLocalReviewOpen(false);
    setLocalReviewPlayerId(null);
    setLocalPhase("order");
  }, [buildDescribeOrder, localPlayers]);

  // ── Waiting ───────────────────────────────────────────────
  if (localMode) {
    const localThemeLabel: Record<ThemeId, string> = {
      classic: "Classique",
      manga: "Anime / Manga",
      adult: "Culture Pop 18+",
      mixed: "Melange Total",
    };
    const localThemeDesc: Record<ThemeId, string> = {
      classic: "Mots grand public",
      manga: "Univers anime",
      adult: "References adultes connues",
      mixed: "Tout melange",
    };

    if (localPhase === "setup") {
      const previewCivilians =
        localPlayerCount - localUndercoverCount - localMrWhiteCount;

      if (localSetupStep === "names") {
        return (
          <div className="relative flex min-h-[100svh] flex-1 flex-col overflow-hidden bg-[#030921] p-4 pb-8 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(149,60,101,0.38),transparent_40%),radial-gradient(circle_at_50%_62%,rgba(36,224,224,0.35),transparent_34%),linear-gradient(180deg,#040424_0%,#05113a_42%,#01072a_100%)]" />
            <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center text-white">
              <p className="mt-8 rounded-full bg-white/15 px-4 py-1 text-sm font-sans uppercase tracking-[0.2em] text-white/80">
                Etape 2/2
              </p>
              <p className="mt-4 text-xl font-sans uppercase tracking-[0.2em] text-white/70">
                Entrer les noms
              </p>
              <p className="mt-2 text-5xl font-sans font-semibold">
                Joueur {localNameIndex + 1}/{localPlayerCount}
              </p>
              <div className="mt-4 flex gap-2">
                {Array.from({ length: localPlayerCount }).map((_, idx) => (
                  <span
                    key={`step-dot-${idx}`}
                    className={cn(
                      "h-2.5 w-8 rounded-full",
                      idx < localNameIndex
                        ? "bg-emerald-300"
                        : idx === localNameIndex
                          ? "bg-cyan-300"
                          : "bg-white/25"
                    )}
                  />
                ))}
              </div>

              <div className="mt-8 w-full rounded-3xl border border-white/25 bg-black/30 p-4">
                <label className="text-sm font-sans text-white/75">
                  Nom du joueur
                </label>
                <input
                  type="text"
                  value={localNameInput}
                  onChange={(e) => setLocalNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitLocalName();
                    }
                  }}
                  placeholder={`Joueur ${localNameIndex + 1}`}
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-white/20 bg-black/35 px-4 py-3 text-lg text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-300/50"
                />
                <button
                  onClick={handleSubmitLocalName}
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-8 py-3 text-2xl font-sans font-semibold text-white"
                >
                  {localNameIndex + 1 === localPlayerCount ? "Lancer la distribution" : "Continuer"}
                </button>
              </div>

              {localCollectedNames.length > 0 && (
                <div className="mt-4 w-full rounded-2xl border border-white/20 bg-black/20 p-3">
                  <p className="text-xs font-sans uppercase tracking-[0.2em] text-white/65">
                    Deja saisis
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {localCollectedNames.map((name, idx) => (
                      <span
                        key={`${name}-${idx}`}
                        className="rounded-full bg-white/15 px-3 py-1 text-sm font-sans text-white/90"
                      >
                        {idx + 1}. {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setLocalSetupStep("config");
                  setLocalCollectedNames([]);
                  setLocalNameIndex(0);
                  setLocalNameInput("");
                }}
                className="mt-4 text-sm font-sans text-white/75 underline-offset-4 hover:underline"
              >
                Retour configuration
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="relative flex min-h-[100svh] flex-1 flex-col overflow-hidden bg-[#030921] p-4 pb-8 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(149,60,101,0.38),transparent_40%),radial-gradient(circle_at_50%_62%,rgba(36,224,224,0.35),transparent_34%),linear-gradient(180deg,#040424_0%,#05113a_42%,#01072a_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,rgba(5,11,34,0),rgba(0,4,24,0.95))]" />

          <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center text-white">
            <p className="mt-2 rounded-full bg-white/15 px-4 py-1 text-sm font-sans uppercase tracking-[0.2em] text-white/80">
              Etape 1/2
            </p>
            <p className="mt-3 text-4xl font-sans font-semibold">
              Joueurs: {localPlayerCount}
            </p>
            <div className="mt-4 h-[3px] w-[92%] rounded-full bg-white/85" />

            <div className="mt-6 w-full rounded-3xl border border-black/15 bg-[#e5e8ef] px-4 py-4 text-black shadow-[0_10px_40px_rgba(0,0,0,0.28)]">
              <p className="mx-auto mb-3 w-fit rounded-full bg-[#5ba5ee] px-4 py-1 text-lg font-semibold leading-none text-white">
                {previewCivilians} Civilians
              </p>
              <div className="space-y-2 text-lg font-semibold">
                <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-black px-3 py-1 text-white">
                  <button
                    onClick={() =>
                      applyLocalRoleConfig(
                        localPlayerCount,
                        localUndercoverCount - 1,
                        localMrWhiteCount
                      )
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xl leading-none"
                  >
                    -
                  </button>
                  <span>{localUndercoverCount} Undercover</span>
                  <button
                    onClick={() =>
                      applyLocalRoleConfig(
                        localPlayerCount,
                        localUndercoverCount + 1,
                        localMrWhiteCount
                      )
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xl leading-none"
                  >
                    +
                  </button>
                </div>
                <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-black shadow-[inset_0_0_0_2px_rgba(0,0,0,0.15)]">
                  <button
                    onClick={() =>
                      applyLocalRoleConfig(
                        localPlayerCount,
                        localUndercoverCount,
                        localMrWhiteCount - 1
                      )
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xl leading-none"
                  >
                    -
                  </button>
                  <span>{localMrWhiteCount} Mr. White</span>
                  <button
                    onClick={() =>
                      applyLocalRoleConfig(
                        localPlayerCount,
                        localUndercoverCount,
                        localMrWhiteCount + 1
                      )
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xl leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 w-full rounded-2xl border border-white/20 bg-black/20 p-3">
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-white/60">
                Nombre de joueurs
              </p>
              <div className="mt-2 flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    const next = Math.max(1, localPlayerCount - 1);
                    setLocalPlayerCount(next);
                    applyLocalRoleConfig(next, localUndercoverCount, localMrWhiteCount);
                  }}
                  className="h-10 w-10 rounded-full bg-white/20 text-2xl"
                >
                  -
                </button>
                <span className="text-4xl font-sans font-semibold">{localPlayerCount}</span>
                <button
                  onClick={() => {
                    const next = Math.min(8, localPlayerCount + 1);
                    setLocalPlayerCount(next);
                    applyLocalRoleConfig(next, localUndercoverCount, localMrWhiteCount);
                  }}
                  className="h-10 w-10 rounded-full bg-white/20 text-2xl"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-3 grid w-full grid-cols-2 gap-2">
              {(["classic", "manga", "adult", "mixed"] as ThemeId[]).map((themeId) => (
                <button
                  key={themeId}
                  onClick={() => setLocalTheme(themeId)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-all",
                    localTheme === themeId
                      ? "border-cyan-300/50 bg-cyan-400/20"
                      : "border-white/20 bg-white/10"
                  )}
                >
                  <p className="text-sm font-sans font-medium text-white">{localThemeLabel[themeId]}</p>
                  <p className="text-[11px] font-sans text-white/65">{localThemeDesc[themeId]}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleContinueToNames}
              className="mt-6 w-[78%] rounded-full bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-8 py-3 text-3xl font-sans font-semibold text-white shadow-[0_8px_24px_rgba(80,214,154,0.45)]"
            >
              Suivant
            </button>
                <button
                  onClick={handleBackToGamePicker}
                  className="mt-3 text-sm font-sans text-white/75 underline-offset-4 hover:underline"
                >
                  Retour a l&apos;ecran des jeux
                </button>
              </div>
            </div>
          );
    }

    if (localPhase === "cards") {
      const current = localPlayers[localCardTurnIndex] ?? null;
      const remaining = localSecretDeck.length;
      const infiltratedCount = localUndercoverCount + localMrWhiteCount;
      const remainingMrWhite = localSecretDeck.filter((c) => c.role === "mrwhite").length;
      if (!current) return null;

      if (localPassToId && !localCardReveal) {
        const passPlayer = localPlayers.find((p) => p.id === localPassToId) ?? null;
        if (passPlayer) {
          return (
            <div className="relative flex min-h-[100svh] flex-1 flex-col items-center justify-center overflow-hidden bg-[#040824] p-6 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(149,60,101,0.35),transparent_40%),radial-gradient(circle_at_50%_62%,rgba(36,224,224,0.3),transparent_34%),linear-gradient(180deg,#040424_0%,#05113a_42%,#01072a_100%)]" />
              <div className="relative w-full max-w-lg rounded-3xl border border-white/35 bg-black/35 p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                <p className="text-[11px] font-sans uppercase tracking-[0.24em] text-cyan-300/80">Passe le telephone</p>
                <p className="mt-3 text-5xl font-sans font-semibold text-cyan-300">{passPlayer.name}</p>
                <p className="mt-3 text-base font-sans text-white/85">Pioche une carte</p>
                <button
                  onClick={() => setLocalPassToId(null)}
                  className="mt-6 rounded-full bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-8 py-2.5 text-lg font-sans font-semibold text-white"
                >
                  Continuer
                </button>
              </div>
            </div>
          );
        }
      }

      return (
        <div className="relative flex min-h-[100svh] flex-1 flex-col gap-5 overflow-hidden bg-[#040824] p-4 pb-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(149,60,101,0.35),transparent_40%),radial-gradient(circle_at_50%_62%,rgba(36,224,224,0.3),transparent_34%),linear-gradient(180deg,#040424_0%,#05113a_42%,#01072a_100%)]" />
          <div className="relative mt-6 text-center">
            <h2 className="text-5xl font-sans font-semibold text-cyan-300">Joueur {localCardTurnIndex + 1}</h2>
            <p className="mt-1 text-3xl font-sans text-white/90">Pioche une carte</p>
          </div>

          <div className="relative mx-auto flex w-full max-w-md gap-2">
            <div className="flex-1 rounded-3xl bg-white/35 px-4 py-3 text-center text-black/80 backdrop-blur-[1px]">
              <p className="text-xl font-sans">Nombre infiltres</p>
              <p className="text-3xl font-semibold">{infiltratedCount}</p>
            </div>
            <div className="flex-1 rounded-3xl bg-white/35 px-4 py-3 text-center text-black/80 backdrop-blur-[1px]">
              <p className="text-xl font-sans">Roles speciaux</p>
              <p className="text-3xl font-semibold">{remainingMrWhite === 0 ? "Aucun" : `${remainingMrWhite} Mr. White`}</p>
            </div>
          </div>

          <div
            className={cn(
              "relative mx-auto grid w-full max-w-md gap-3",
              remaining <= 4 ? "grid-cols-2" : "grid-cols-3"
            )}
          >
            {Array.from({ length: remaining }).map((_, i) => (
              <button
                key={i}
                onClick={drawLocalRandomCard}
                disabled={!!localCardReveal}
                className={cn(
                  "group relative h-32 rounded-2xl border border-yellow-300/60 bg-[#ffc911] text-black shadow-[0_8px_25px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 disabled:opacity-55",
                  localDrawnSlot === i && "ring-2 ring-white/80"
                )}
              >
                <div className="relative flex h-full items-center justify-center">
                  <span className="text-6xl font-sans font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">?</span>
                </div>
              </button>
            ))}
          </div>

          <div className="relative text-center">
            <p className="text-sm font-sans text-white/70">
              {current.name} - {Math.max(remaining, 0)} cartes restantes
            </p>
          </div>

          {localCardReveal && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm p-5">
              <div className="w-full max-w-md rounded-3xl border border-white/65 bg-[rgba(8,19,58,0.55)] p-6 text-center shadow-[0_20px_90px_rgba(0,0,0,0.55)]">
                <p className="text-5xl font-sans font-semibold text-cyan-300">Joueur {localCardTurnIndex + 1}</p>
                <p className="mt-1 text-3xl font-sans text-white/95">Pioche une carte</p>
                <div className="mx-auto mt-5 h-56 w-40 [perspective:1000px]">
                  <div
                    className="relative h-full w-full transition-transform duration-500"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: localCardFlip ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-2xl border border-yellow-300/60 bg-[#ffc911]"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <p className="text-6xl font-sans font-bold text-white">?</p>
                    </div>
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/40 bg-[linear-gradient(145deg,#102046,#1c2a63)]"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <p className="text-3xl font-sans font-semibold text-cyan-300">
                        {localCardReveal.role === "mrwhite" ? "Mr. White" : "Civil"}
                      </p>
                      <p className="mt-2 px-3 text-center text-4xl font-sans font-semibold text-white">
                        {localCardReveal.role === "mrwhite" ? "???" : localCardReveal.word}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={confirmLocalCard}
                  className="mt-6 w-[78%] rounded-full bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] py-2.5 text-2xl font-sans font-semibold text-white"
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (localPhase === "order") {
      const orderedPlayers = localTurnOrder
        .map((id) => localPlayers.find((p) => p.id === id))
        .filter((p): p is LocalPlayer => !!p);

      const reviewedPlayer =
        localReviewPlayerId
          ? localPlayers.find((p) => p.id === localReviewPlayerId) ?? null
          : null;

      return (
        <div className="relative flex flex-1 flex-col gap-5 overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_90%_75%,rgba(96,165,250,0.13),transparent_35%)]" />
          <div className="relative text-center">
            <p className="text-[11px] text-white/30 font-sans uppercase tracking-[0.24em]">Ordre des joueurs</p>
            <p className="mt-1 text-sm text-white/55 font-sans">Indices a voix haute, dans cet ordre.</p>
          </div>

          <div className="relative mx-auto grid w-full max-w-2xl grid-cols-2 gap-4 rounded-2xl border border-cyan-300/20 bg-[#070d17]/75 p-4 sm:grid-cols-3">
            {orderedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="flex flex-col items-center"
              >
                <p className="mb-2 text-[11px] font-sans uppercase tracking-widest text-cyan-200/80">
                  {idx === 0 ? "Commence" : `Tour ${idx + 1}`}
                </p>
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-200/60 bg-[radial-gradient(circle_at_30%_30%,#64f0a8,#26c8d9_65%,#0ea5e9)] text-5xl font-sans font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="mt-2 w-24 rounded-md bg-white/65 px-2 py-1 text-center text-sm font-sans font-semibold text-black">
                  {p.name}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-auto mx-auto w-full max-w-md rounded-full border border-white/20 bg-black/35 px-3 py-2 backdrop-blur-sm">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setLocalReviewOpen(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-gradient-to-b from-[#a855f7] to-[#7c3aed] text-xs font-sans font-semibold text-white"
              >
                Mot
              </button>
              <button
                onClick={beginLocalVote}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-xs font-sans font-semibold text-white"
              >
                Vote
              </button>
              <button
                onClick={() => {
                  setLocalSetupStep("config");
                  setLocalCollectedNames([]);
                  setLocalNameIndex(0);
                  setLocalNameInput("");
                  setLocalPhase("setup");
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-gradient-to-b from-[#f97316] to-[#ef4444] text-[10px] font-sans font-semibold text-white"
              >
                Reset
              </button>
              <button
                onClick={handleBackToGamePicker}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-xs font-sans font-semibold text-white"
              >
                Jeux
              </button>
            </div>
          </div>

          {localReviewOpen && (
            <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-cyan-300/25 bg-[#0b111d] p-5">
                {!reviewedPlayer ? (
                  <>
                    <p className="mb-3 text-sm text-white/80 font-sans">Choisis ta carte pour revoir ton mot:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {localPlayers.filter((p) => p.alive).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setLocalReviewPlayerId(p.id)}
                          className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-left text-sm text-white/80 font-sans hover:border-cyan-300/35 hover:bg-cyan-300/[0.06]"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-white/30 font-sans">{reviewedPlayer.name}</p>
                    <p className="mt-2 text-xl text-cyan-300 font-serif">
                      {reviewedPlayer.role === "mrwhite" ? "Mr. White" : "Civil"}
                    </p>
                    <p className="mt-1 text-3xl text-white font-serif">
                      {reviewedPlayer.role === "mrwhite" ? "???" : reviewedPlayer.word}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 justify-end mt-4">
                  {reviewedPlayer && (
                    <button
                      onClick={() => setLocalReviewPlayerId(null)}
                      className="px-3 py-2 rounded border border-white/[0.15] text-white/70 text-xs font-sans"
                    >
                      Choisir autre carte
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setLocalReviewOpen(false);
                      setLocalReviewPlayerId(null);
                    }}
                    className="px-3 py-2 rounded border border-cyan-300/35 bg-cyan-500/80 text-white text-xs font-sans"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (localPhase === "vote" && localPassToId && !localCardReveal) {
      const passPlayer = localPlayers.find((p) => p.id === localPassToId) ?? null;
      if (passPlayer) {
        return (
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg rounded-3xl border border-cyan-300/25 bg-[#070d17]/90 p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.4)]">
              <p className="text-[11px] font-sans uppercase tracking-[0.24em] text-cyan-300/60">Passe le telephone</p>
              <p className="mt-3 text-4xl text-white font-serif text-center">{passPlayer.name}</p>
              <p className="mt-3 text-sm text-white/45 font-sans">Ordre direct. Le prochain joueur prend la parole.</p>
              <button
                onClick={() => {
                  setLocalPassToId(null);
                  setShowWordPeek(false);
                }}
                className="mt-6 rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-7 py-2.5 text-sm font-sans font-medium text-white"
              >
                Continuer
              </button>
            </div>
          </div>
        );
      }
    }

    if (localPhase === "describe") {
      const current = getLocalCurrentPlayer();
      if (!current) return null;
      return (
        <div className="relative flex flex-1 flex-col gap-4 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%)]" />
          <div className="relative text-center">
            <p className="text-xs text-white/30 font-sans">Manche {localRound}</p>
            <h2 className="mt-1 text-3xl text-white font-serif">{current.name}</h2>
            <p className="text-xs text-white/35 font-sans">donne un indice oral</p>
          </div>
          <div className="relative mx-auto w-full max-w-md rounded-2xl border border-cyan-300/20 bg-[#070d17]/85 p-4 text-center">
            <p className="text-sm text-white/70 font-sans">Donne ton indice a voix haute.</p>
            <button
              onClick={submitLocalClue}
              className="mt-3 rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-sans text-white"
            >
              Indice donne, joueur suivant
            </button>
          </div>
          <button
            onClick={() => setShowWordPeek((v) => !v)}
            className="mx-auto text-xs text-cyan-300/70 hover:text-cyan-200 font-sans"
          >
            {showWordPeek ? "Masquer mon mot" : "Revoir mon mot"}
          </button>
          {showWordPeek && (
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-cyan-300/25 bg-[#070d17]/85 p-4 text-center">
              <p className="text-xs text-white/30 font-sans">{current.role === "mrwhite" ? "Mr. White" : "Mot secret"}</p>
              <p className="mt-1 text-2xl text-white font-serif">{current.role === "mrwhite" ? "???" : current.word}</p>
            </div>
          )}
          <div className="relative mx-auto w-full max-w-2xl space-y-1">
            {localClues.map((clue, i) => (
              <div key={`${clue.playerId}-${i}`} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                <span className="text-xs text-white/40 font-sans">{clue.playerName}</span>
                <span className="text-sm text-white/60 font-sans ml-2">{clue.text}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (localPhase === "vote") {
      const aliveTargets = getLocalAlive();
      return (
        <div className="relative flex flex-1 flex-col items-center gap-4 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(14,165,233,0.12),transparent_35%)]" />
          <p className="relative text-xs text-white/30 font-sans">Vote oral de groupe</p>
          <h2 className="relative text-3xl text-white/90 font-serif">Qui eliminer ?</h2>
          <div className="relative grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
            {aliveTargets.map((p) => (
              <button
                key={p.id}
                onClick={() => setLocalSelectedTarget(p.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-sans transition-all",
                  localSelectedTarget === p.id
                    ? "border-cyan-300/50 bg-cyan-300/[0.12] text-cyan-200 shadow-[0_0_25px_rgba(80,216,255,0.2)]"
                    : "border-white/[0.1] bg-white/[0.03] text-white/75 hover:border-cyan-300/35"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={submitLocalVote}
            disabled={!localSelectedTarget}
            className="relative rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-sans font-medium text-white disabled:border-white/[0.12] disabled:bg-white/[0.05] disabled:text-white/20"
          >
            Eliminer ce joueur
          </button>
        </div>
      );
    }

    if (localPhase === "vote-result") {
      const eliminated = localPlayers.find((p) => p.id === localEliminatedId) ?? null;
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-6 gap-4">
          {!eliminated ? (
            <p className="text-white/60 font-serif text-2xl">Egalite, personne elimine.</p>
          ) : (
            <>
              <p className="text-xs text-white/30 font-sans">Elimine</p>
              <p className="text-3xl text-white font-serif">{eliminated.name}</p>
              <p className="text-sm text-cyan-200/85 font-sans">
                Role: {localEliminatedRole === "undercover" ? "Undercover" : localEliminatedRole === "mrwhite" ? "Mr. White" : "Civil"}
              </p>
            </>
          )}
          <p className="text-xs text-white/25 font-sans">Le mot n&apos;est jamais revele ici.</p>
          <button
            onClick={continueAfterLocalVoteResult}
            className="rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2 text-sm font-sans text-white"
          >
            Continuer
          </button>
        </div>
      );
    }

    if (localPhase === "game-over") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-6 gap-4">
          <p className="text-xs text-white/30 font-sans">Fin de partie locale</p>
          <p className="text-3xl font-serif text-cyan-300">
            {localWinners === "civilian" ? "Les Civils gagnent" : "Undercover / Mr.White gagnent"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => {
                setLocalSetupStep("config");
                setLocalCollectedNames([]);
                setLocalNameIndex(0);
                setLocalNameInput("");
                setLocalPhase("setup");
              }}
              className="rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2 text-sm font-sans text-white"
            >
              Recommencer la partie
            </button>
            <button
              onClick={handleBackToGamePicker}
              className="rounded-xl border border-white/25 bg-white/10 px-6 py-2 text-sm font-sans text-white"
            >
              Retour a l&apos;ecran des jeux
            </button>
          </div>
        </div>
      );
    }
  }
  if (!state || state.phase === "waiting") {
    const onlineCount = state?.players?.length ?? 0;
    const expectedCount = state?.expectedPlayerCount ?? onlineCount;
    const selectedDist = state?.selectedRoleDistribution;

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(251,146,60,0.16),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(239,68,68,0.12),transparent_38%),linear-gradient(145deg,#09090b,#111118_48%,#1b0f0f)]" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-orange-300/20 bg-black/35 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-sans uppercase tracking-[0.22em] text-orange-200/65">
                Undercover
              </p>
              <h2 className="mt-1 text-2xl font-serif text-white sm:text-3xl">
                Preparer la partie
              </h2>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
              <p className="text-[10px] font-sans uppercase tracking-widest text-white/35">
                Joueurs
              </p>
              <p className="text-sm font-sans text-white/85">
                {onlineCount} connectes
                {expectedCount > onlineCount && ` + ${expectedCount - onlineCount} bot`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid flex-1 gap-4 overflow-y-auto pr-1 sm:mt-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <p className="text-xs font-sans uppercase tracking-widest text-white/45">
                Theme des mots
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {state?.availableThemes?.map((theme) => {
                  const active = theme.id === state.selectedThemeId;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => sendAction({ action: "set-theme", themeId: theme.id })}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left transition-all",
                        active
                          ? "border-orange-300/45 bg-orange-300/10 shadow-[0_0_24px_rgba(251,146,60,0.16)]"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-orange-300/30 hover:bg-orange-300/[0.06]"
                      )}
                    >
                      <p className={cn("text-sm font-sans", active ? "text-orange-200" : "text-white/80")}>
                        {theme.label}
                      </p>
                      <p className="text-xs text-white/35 font-sans">{theme.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <p className="text-xs font-sans uppercase tracking-widest text-white/45">
                Repartition des roles ({expectedCount} joueurs)
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {state?.availableRoleDistributions?.map((option, idx) => {
                  const active =
                    selectedDist?.undercoverCount === option.undercoverCount &&
                    selectedDist?.mrWhiteCount === option.mrWhiteCount;
                  return (
                    <button
                      key={`${option.undercoverCount}-${option.mrWhiteCount}-${idx}`}
                      onClick={() =>
                        sendAction({
                          action: "set-role-distribution",
                          undercoverCount: option.undercoverCount,
                          mrWhiteCount: option.mrWhiteCount,
                        })
                      }
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-emerald-300/45 bg-emerald-300/10 shadow-[0_0_24px_rgba(52,211,153,0.14)]"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-emerald-300/30 hover:bg-emerald-300/[0.06]"
                      )}
                    >
                      <p className="text-sm font-sans text-white/90">
                        {option.undercoverCount} Undercover
                        {option.undercoverCount > 1 ? "s" : ""} • {option.mrWhiteCount} Mr. White
                        {option.mrWhiteCount > 1 ? "s" : ""}
                      </p>
                      <p className="mt-1 text-xs font-sans text-white/40">
                        {option.civilianCount} civil
                        {option.civilianCount > 1 ? "s" : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs font-sans text-white/45">
              {selectedDist
                ? `Selection: ${selectedDist.undercoverCount} Undercover / ${selectedDist.mrWhiteCount} Mr. White / ${selectedDist.civilianCount} civils`
                : "Choisis les roles puis lance la partie"}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                onClick={() => {
                  setLocalMode(true);
                  setLocalSetupStep("config");
                  setLocalCollectedNames([]);
                  setLocalNameIndex(0);
                  setLocalNameInput("");
                  setLocalPhase("setup");
                }}
                className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-sans text-white/70 transition-colors hover:text-white sm:w-auto"
              >
                Jouer sur 1 telephone
              </button>
              <button
                onClick={() => sendAction({ action: "start-game" })}
                className="w-full rounded-xl border border-orange-300/40 bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-sans font-medium text-white transition-all hover:from-orange-400 hover:to-red-400 sm:w-auto"
              >
                Lancer la partie en ligne
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const me = state.players?.find((p) => p.id === playerId);
  const alivePlayers = state.players?.filter((p) => p.alive) ?? [];
  const isTimeLow = (state.timeLeft ?? 0) <= 5;

  // ── Role Reveal ───────────────────────────────────────────
  if (state.phase === "role-reveal") {
    const myRole = state.myRole;
    const myWord = state.myWord;

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center rounded-3xl border border-cyan-300/20 bg-black/35 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8" style={{ animation: "scaleIn 0.5s ease" }}>
          <span className="text-xs text-white/20 font-sans uppercase tracking-widest mb-8" style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
            Ton identite secrete
          </span>

          <div
            className={cn(
              "rounded-2xl border p-8 text-center max-w-sm w-full",
              myRole ? ROLE_BG[myRole] : "border-white/[0.06] bg-white/[0.03]"
            )}
            style={{ animation: "scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
          >
            <span
              className={cn(
                "text-sm font-sans font-medium uppercase tracking-wider",
                getRoleColor(myRole)
              )}
            >
              {getRoleLabel(myRole)}
            </span>

            <div className="mt-6 mb-4">
              {myRole === "mrwhite" ? (
                <p
                  className="text-3xl font-serif font-light text-white/90"
                  style={{ textShadow: ROLE_GLOW.mrwhite }}
                >
                  ???
                </p>
              ) : (
                <p
                  className={cn(
                    "text-4xl font-serif font-light",
                    getRoleColor(myRole)
                  )}
                  style={{
                    textShadow: myRole ? ROLE_GLOW[myRole] : undefined,
                  }}
                >
                  {myWord}
                </p>
              )}
            </div>

            {myRole === "mrwhite" && (
              <p className="text-xs text-white/30 font-sans mt-2">
                Tu n&apos;as pas de mot. Ecoute les indices et bluff !
              </p>
            )}
            {myRole === "undercover" && (
              <p className="text-xs text-white/30 font-sans mt-2">
                Ton mot est different des autres. Sois discret !
              </p>
            )}
            {myRole === "civilian" && (
              <p className="text-xs text-white/30 font-sans mt-2">
                Decris ton mot sans te devoiler. Trouve l&apos;imposteur !
              </p>
            )}
          </div>

          <p className="text-xs text-white/20 font-sans mt-6 animate-pulse">
            Memorise ton mot...
          </p>
        </div>
      </div>
    );
  }

  // ── Describe Phase ────────────────────────────────────────
  if (state.phase === "describe") {
    const isMyTurn = state.currentDescriberId === playerId;
    const currentDescriber = state.players?.find(
      (p) => p.id === state.currentDescriberId
    );
    const iAmAlive = me?.alive ?? false;

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 rounded-3xl border border-cyan-300/20 bg-black/35 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6" style={{ animation: "scaleIn 0.4s ease" }}>
        {/* Header: round + timer */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/20 font-sans">
              Manche {state.round}
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                isTimeLow ? "text-red-400" : "text-cyan-300"
              )}
            >
              {state.timeLeft}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                isTimeLow ? "bg-red-500" : "bg-gradient-to-r from-cyan-400 to-blue-400"
              )}
              style={{
                width: `${((state.timeLeft ?? 0) / 30) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Current describer */}
        <div className="text-center">
          {isMyTurn ? (
            <h2
              className="text-2xl font-serif font-light text-cyan-200"
              style={{ textShadow: "0 0 30px rgba(80,216,255,0.35)" }}
            >
              C&apos;est ton tour !
            </h2>
          ) : (
            <h2 className="text-xl font-serif font-light text-white/70">
              <span className="text-cyan-300">{currentDescriber?.name}</span>{" "}
              decrit son mot...
            </h2>
          )}
          <p className="text-xs text-white/30 font-sans mt-1">
            Donne un indice SANS dire ton mot
          </p>
        </div>

        {/* Clue input (only for current describer) */}
        {isMyTurn && iAmAlive && !clueSubmitted && (
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <input
              ref={clueInputRef}
              type="text"
              value={clueInput}
              onChange={(e) => setClueInput(e.target.value)}
              onKeyDown={handleClueKeyDown}
              placeholder="Ton indice..."
              autoFocus
              autoComplete="off"
              className="flex-1 px-4 py-3 rounded-xl border border-cyan-300/20 bg-white/[0.04] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-300/40 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={handleSubmitClue}
              disabled={!clueInput.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:bg-white/[0.06] disabled:from-transparent disabled:to-transparent disabled:text-white/20 text-white font-sans text-sm font-medium transition-all shadow-[0_0_20px_rgba(80,216,255,0.2)]"
            >
              Envoyer
            </button>
          </div>
        )}
        {isMyTurn && clueSubmitted && (
          <div className="max-w-md mx-auto text-center">
            <div className="px-4 py-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06]">
              <p className="text-sm text-cyan-200/70 font-sans">
                Indice envoye !
              </p>
            </div>
          </div>
        )}

        {/* Clue history */}
        <div className="flex-1 w-full flex flex-col min-h-0">
          <span className="text-xs text-white/25 font-sans mb-2">
            Indices donnes
          </span>
          <div
            ref={clueListRef}
            className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin"
          >
            {state.clueHistory?.length === 0 && (
              <p className="text-xs text-white/15 font-sans text-center py-4">
                Aucun indice pour le moment...
              </p>
            )}
            {state.clueHistory?.map((clue, i) => (
              <div
                key={`${clue.playerId}-${clue.round}-${i}`}
                className={cn(
                  "flex items-baseline gap-2 px-3 py-2 rounded-xl",
                  clue.playerId === playerId
                    ? "bg-cyan-300/[0.06] border border-cyan-300/15"
                    : "bg-white/[0.02] border border-white/[0.06]"
                )}
                style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
              >
                <span className="text-[10px] text-white/20 font-mono shrink-0">
                  R{clue.round}
                </span>
                <span className="text-xs text-white/50 font-sans font-medium shrink-0">
                  {clue.playerName}
                </span>
                <span className="text-sm text-white/80 font-sans">
                  {clue.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Player grid */}
        <div className="flex flex-wrap justify-center gap-2">
          {state.players?.map((p, i) => {
            const isDescribing = p.id === state.currentDescriberId;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 min-w-[80px] transition-all",
                  !p.alive && "opacity-30",
                  isDescribing
                    ? "border-cyan-300/40 bg-cyan-300/[0.08] shadow-[0_0_16px_rgba(80,216,255,0.15)]"
                    : p.hasDescribed
                      ? "border-white/[0.12] bg-white/[0.05]"
                      : "border-white/[0.06] bg-white/[0.02]"
                )}
                style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
              >
                <span
                  className={cn(
                    "text-xs font-medium truncate max-w-[70px] font-sans",
                    isDescribing ? "text-cyan-200" : "text-white/60"
                  )}
                >
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
                <span className="text-[10px] text-white/25 font-sans">
                  {!p.alive
                    ? "Elimine"
                    : p.hasDescribed
                      ? "Fait"
                      : isDescribing
                        ? "Parle..."
                        : "En attente"}
                </span>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  }

  // ── Vote Phase ────────────────────────────────────────────
  if (state.phase === "vote") {
    const iAmAlive = me?.alive ?? false;

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-5 rounded-3xl border border-cyan-300/20 bg-black/35 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6" style={{ animation: "scaleIn 0.4s ease" }}>
        {/* Header */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/20 font-sans">
              Vote — Manche {state.round}
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                isTimeLow ? "text-red-400" : "text-cyan-300"
              )}
            >
              {state.timeLeft}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                isTimeLow ? "bg-red-500" : "bg-gradient-to-r from-cyan-400 to-blue-400"
              )}
              style={{
                width: `${((state.timeLeft ?? 0) / 30) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="text-center">
          <h2
            className="text-2xl font-serif font-light text-white/90"
            style={{ textShadow: "0 0 30px rgba(80,216,255,0.2)" }}
          >
            Qui est l&apos;imposteur ?
          </h2>
          <p className="text-xs text-white/30 font-sans mt-1">
            Votez pour eliminer un joueur suspect
          </p>
        </div>

        {/* Vote cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full">
          {alivePlayers
            .filter((p) => p.id !== playerId)
            .map((p, i) => {
              const isSelected = voteTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!voteConfirmed && iAmAlive) setVoteTarget(p.id);
                  }}
                  disabled={voteConfirmed || !iAmAlive}
                  className={cn(
                    "rounded-xl border p-4 text-center transition-all press-effect",
                    isSelected
                      ? "border-red-400/50 bg-red-400/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                      : "border-white/[0.08] bg-white/[0.03] hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]",
                    (voteConfirmed || !iAmAlive) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  style={{ animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}
                >
                  <span
                    className={cn(
                      "text-sm font-sans font-medium",
                      isSelected ? "text-red-400" : "text-white/70"
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Confirm vote */}
        {iAmAlive && !voteConfirmed && voteTarget && (
          <button
            onClick={handleVote}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-sans text-sm font-medium transition-all shadow-[0_0_20px_rgba(239,68,68,0.25)] press-effect"
            style={{ animation: "scaleIn 0.3s ease" }}
          >
            Confirmer le vote
          </button>
        )}
        {voteConfirmed && (
          <p className="text-xs text-white/20 font-sans animate-pulse">
            Vote enregistre. En attente des autres...
          </p>
        )}

        {/* Vote status */}
        <div className="flex flex-wrap justify-center gap-2 mt-auto">
          {alivePlayers.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 min-w-[80px] transition-all",
                p.hasVoted
                  ? "border-cyan-300/20 bg-cyan-300/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}
              style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
            >
              <span className="text-xs text-white/60 font-sans truncate max-w-[70px]">
                {p.name}
                {p.id === playerId && " (toi)"}
              </span>
              <span className="text-[10px] text-white/25 font-sans">
                {p.hasVoted ? "A vote" : "..."}
              </span>
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  // ── Mr. White Guess ───────────────────────────────────────
  if (state.phase === "mrwhite-guess") {
    const iAmMrWhite = state.myRole === "mrwhite";
    const eliminatedPlayer = state.players?.find(
      (p) => p.id === state.eliminatedPlayerId
    );

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8" style={{ animation: "scaleIn 0.4s ease" }}>
        <div className="text-center">
          <span className="text-xs text-white/20 font-sans uppercase tracking-widest" style={{ animation: "fadeUp 0.4s ease 0.1s both" }}>
            Mr. White elimine !
          </span>
          <h2
            className="text-3xl font-serif font-light text-white mt-3"
            style={{ textShadow: ROLE_GLOW.mrwhite, animation: "scaleIn 0.5s ease 0.2s both" }}
          >
            {eliminatedPlayer?.name ?? "Mr. White"}
          </h2>
          <p className="text-sm text-white/40 font-sans mt-2">
            Derniere chance : deviner le mot des civils !
          </p>
        </div>

        {/* Timer */}
        <span
          className={cn(
            "text-sm font-mono font-bold",
            isTimeLow ? "text-red-400" : "text-cyan-300"
          )}
        >
          {state.timeLeft}s
        </span>

        {iAmMrWhite ? (
          <div className="flex gap-3 max-w-md w-full">
            <input
              ref={guessInputRef}
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={handleGuessKeyDown}
              placeholder="Le mot des civils est..."
              autoFocus
              autoComplete="off"
              className="flex-1 px-4 py-3 rounded-xl border border-cyan-300/20 bg-white/[0.04] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-300/40 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={handleMrWhiteGuess}
              disabled={!guessInput.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:bg-white/[0.06] disabled:from-transparent disabled:to-transparent disabled:text-white/20 text-white font-sans text-sm font-medium transition-all shadow-[0_0_20px_rgba(80,216,255,0.2)] press-effect"
            >
              Deviner
            </button>
          </div>
        ) : (
          <p className="text-xs text-white/20 font-sans animate-pulse">
            Mr. White tente de deviner le mot...
          </p>
        )}
        </div>
      </div>
    );
  }

  // ── Vote Result ───────────────────────────────────────────
  if (state.phase === "vote-result") {
    const eliminatedPlayer = state.players?.find(
      (p) => p.id === state.eliminatedPlayerId
    );
    const noElimination = !state.eliminatedPlayerId;

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8" style={{ animation: "scaleIn 0.4s ease" }}>
        {noElimination ? (
          <div className="text-center" style={{ animation: "fadeUp 0.5s ease" }}>
            <h2 className="text-3xl font-serif font-light text-white/60">
              Egalite !
            </h2>
            <p className="text-sm text-white/30 font-sans mt-2">
              Personne n&apos;est elimine ce tour.
            </p>
          </div>
        ) : (
          <div className="text-center" style={{ animation: "fadeUp 0.5s ease" }}>
            <span className="text-xs text-white/20 font-sans uppercase tracking-widest">
              Elimine
            </span>
            <h2
              className={cn(
                "text-3xl font-serif font-light mt-3",
                state.eliminatedRole
                  ? ROLE_COLORS[state.eliminatedRole]
                  : "text-white/90"
              )}
              style={{
                textShadow: state.eliminatedRole
                  ? ROLE_GLOW[state.eliminatedRole]
                  : undefined,
                animation: "scaleIn 0.5s ease 0.2s both",
              }}
            >
              {eliminatedPlayer?.name}
            </h2>
            <div
              className={cn(
                "inline-block mt-3 px-4 py-1.5 rounded-full border text-sm font-sans font-medium",
                state.eliminatedRole ? ROLE_BG[state.eliminatedRole] : "",
                getRoleColor(state.eliminatedRole)
              )}
              style={{ animation: "scaleIn 0.4s ease 0.35s both" }}
            >
              {getRoleLabel(state.eliminatedRole)}
            </div>
          </div>
        )}

        {/* Mr. White guess result */}
        {state.mrWhiteGuessCorrect !== null && (
          <div
            className={cn(
              "rounded-xl border p-4 text-center max-w-sm",
              state.mrWhiteGuessCorrect
                ? "border-emerald-400/30 bg-emerald-400/5"
                : "border-red-400/30 bg-red-400/5"
            )}
            style={{ animation: "scaleIn 0.4s ease 0.3s both" }}
          >
            {state.mrWhiteGuessCorrect ? (
              <>
                <p className="text-lg text-emerald-400 font-serif">
                  Mr. White a devine le mot !
                </p>
                <p className="text-xs text-emerald-400/60 font-sans mt-1">
                  Victoire de Mr. White
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-red-400 font-serif">
                  Mauvaise reponse !
                </p>
                <p className="text-xs text-red-400/60 font-sans mt-1">
                  Mr. White n&apos;a pas trouve le mot
                </p>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-white/20 font-sans animate-pulse">
          La partie continue...
        </p>
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────
  if (state.phase === "game-over") {
    const winnerLabel =
      state.winners === "civilian"
        ? "Les Civils"
        : state.winners === "mrwhite"
          ? "Mr. White"
          : "Les Undercovers";
    const winnerColor =
      state.winners === "civilian"
        ? "text-blue-400"
        : state.winners === "mrwhite"
          ? "text-white"
          : "text-red-400";
    const winnerGlow = state.winners ? ROLE_GLOW[state.winners] : undefined;

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8" style={{ animation: "scaleIn 0.4s ease" }}>
        <div className="text-center" style={{ animation: "fadeUp 0.5s ease" }}>
          <span className="text-xs text-white/20 font-sans uppercase tracking-widest">
            Fin de la partie
          </span>
          <h2
            className={cn("text-4xl font-serif font-light mt-3", winnerColor)}
            style={{ textShadow: winnerGlow, animation: "scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
          >
            {winnerLabel} gagnent !
          </h2>
        </div>

        {/* Word reveal */}
        <div className="flex gap-6 mt-2" style={{ animation: "fadeUp 0.4s ease 0.3s both" }}>
          <div className="text-center rounded-xl border border-blue-400/20 bg-blue-400/[0.06] px-4 py-3">
            <span className="text-[10px] text-blue-400/60 font-sans uppercase tracking-wider">
              Mot civil
            </span>
            <p className="text-xl font-serif text-blue-400 mt-1">
              {state.civilianWord}
            </p>
          </div>
          <div className="text-center rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
            <span className="text-[10px] text-red-400/60 font-sans uppercase tracking-wider">
              Mot undercover
            </span>
            <p className="text-xl font-serif text-red-400 mt-1">
              {state.undercoverWord}
            </p>
          </div>
        </div>

        {/* All players with roles revealed */}
        <div className="w-full max-w-md space-y-2 mt-2">
          {state.players?.map((p, i) => {
            const role = p.role;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-all",
                  role
                    ? ROLE_BG[role]
                    : "border-white/[0.06] bg-white/[0.03]",
                  !p.alive && "opacity-60"
                )}
                style={{ animation: `fadeUp 0.3s ease ${0.35 + i * 0.06}s both` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-sans font-medium",
                      role ? ROLE_COLORS[role] : "text-white/60"
                    )}
                  >
                    {p.name}
                    {p.id === playerId && " (toi)"}
                  </span>
                  {!p.alive && (
                    <span className="text-[10px] text-white/20 font-sans">
                      elimine
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-sans font-medium uppercase tracking-wider",
                    getRoleColor(role)
                  )}
                >
                  {getRoleLabel(role)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-white/20 font-sans animate-pulse mt-4">
          Retour au lobby...
        </p>
        </div>
      </div>
    );
  }

  // ── Fallback ──────────────────────────────────────────────
  return (
    <div className="flex flex-1 items-center justify-center">
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
    </div>
  );
}
