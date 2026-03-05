import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Config ──────────────────────────────────────────────────
const REVEAL_DURATION = 5000;
const DESCRIBE_TIMEOUT = 30000;
const VOTE_TIMEOUT = 30000;
const RESULT_DISPLAY_TIME = 4000;
const MR_WHITE_GUESS_TIMEOUT = 20000;
const GAME_END_DISPLAY_TIME = 5000;
const LOCAL_BOT_TARGET_PLAYERS = 4;
const BOT_NAME_POOL = [
  "Bot Alpha",
  "Bot Bravo",
  "Bot Charlie",
  "Bot Delta",
  "Bot Echo",
  "Bot Foxtrot",
];

// ── Word Pairs (70 pairs) ───────────────────────────────────
const CLASSIC_WORD_PAIRS: [string, string][] = [
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
];

const MANGA_WORD_PAIRS: [string, string][] = [
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
];

const ADULT_WORD_PAIRS: [string, string][] = [
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
  ["chaine", "Menottes"],
  ["Latex", "Cuir"],
  ["message mignon", "Nude"],
  ["OnlyFans", "MYM"],
 ["Johnny Sins", "Manuel Ferrara"],                                                                                                                                   
  ["Mia Khalifa", "Angela White"],                                                                                                                                     
  ["Lana Rhoades", "Abella Danger"],                                                                                                                                   
["Riley Reid", "Adriana Chechik"],                                                                                                                                   
   ["Pornhub", "Xvideos"],                                                                                                                                              
    ["XHamster", "YouPorn"],                                                                                                                                             
    ["Brazzers", "xnxx"],                                                                                                                                                                                                                                                                         
    ["Jacquie et Michel", "youporn"],                                                                                                                                                                                                                                                                                
    ["MYM", "OnlyFans"],                                                                                                                                                 
["Tinder", "Bumble"],
  ["Date", "Plan d'un soir"],
  ["Crush", "Ex"],
  ["18+", "Tout public"],
  ["Sensuel", "Sexuel"],
  ["Tease", "Provoc"],
  ["Kiss", "French kiss"],
  ["Preliminaires", "Baiser"],
["Infidele", "Fidele"],
  ["Desir", "Tentation"],


];

type ThemeId = "classic" | "manga" | "adult" | "mixed";

const THEME_LABELS: Record<ThemeId, string> = {
  classic: "Classique",
  manga: "Anime / Manga",
  adult: "-18",
  mixed: "Melange total",
};

const THEME_DESCRIPTIONS: Record<ThemeId, string> = {
  classic: "Mots generalistes",
  manga: "Persos et references anime/manga",
  adult: "References reservees adultes",
  mixed: "Pioche dans tous les themes",
};

const THEME_PAIR_MAP: Record<Exclude<ThemeId, "mixed">, [string, string][]> = {
  classic: CLASSIC_WORD_PAIRS,
  manga: MANGA_WORD_PAIRS,
  adult: ADULT_WORD_PAIRS,
};

function getWordPairsForTheme(themeId: ThemeId): [string, string][] {
  if (themeId === "mixed") {
    return [
      ...CLASSIC_WORD_PAIRS,
      ...MANGA_WORD_PAIRS,
      ...ADULT_WORD_PAIRS,
    ];
  }
  return THEME_PAIR_MAP[themeId];
}

// ── Types ───────────────────────────────────────────────────

type Role = "civilian" | "undercover" | "mrwhite";

type GamePhase =
  | "waiting"
  | "role-reveal"
  | "describe"
  | "vote"
  | "vote-result"
  | "mrwhite-guess"
  | "game-over";

interface UndercoverPlayer {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  alive: boolean;
  description: string | null;
  hasDescribed: boolean;
  vote: string | null;
  hasVoted: boolean;
}

interface ClueEntry {
  playerId: string;
  playerName: string;
  text: string;
  round: number;
}

interface RoleDistributionConfig {
  undercoverCount: number;
  mrWhiteCount: number;
}

interface RoleDistributionOption extends RoleDistributionConfig {
  civilianCount: number;
}

// ── Game Class ──────────────────────────────────────────────

export class UndercoverGame extends BaseGame {
  ucPlayers: Map<string, UndercoverPlayer> = new Map();
  botIds: Set<string> = new Set();
  selectedThemeId: ThemeId = "mixed";
  selectedRoleDistribution: RoleDistributionConfig | null = null;
  phase: GamePhase = "waiting";
  round = 0;
  civilianWord = "";
  undercoverWord = "";
  turnOrder: string[] = [];
  currentDescriberIndex = 0;
  clueHistory: ClueEntry[] = [];
  eliminatedPlayerId: string | null = null;
  eliminatedRole: Role | null = null;
  mrWhiteGuessCorrect: boolean | null = null;
  winners: Role | null = null;

  revealTimeout: ReturnType<typeof setTimeout> | null = null;
  describeTimeout: ReturnType<typeof setTimeout> | null = null;
  voteTimeout: ReturnType<typeof setTimeout> | null = null;
  resultTimeout: ReturnType<typeof setTimeout> | null = null;
  mrWhiteTimeout: ReturnType<typeof setTimeout> | null = null;
  timerInterval: ReturnType<typeof setInterval> | null = null;
  botActionTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();
  timeLeft = 0;

  getExpectedPlayerCount() {
    const humanPlayerCount = this.players.size;
    if (humanPlayerCount < 1) return 0;
    if (humanPlayerCount < 3) {
      return Math.max(LOCAL_BOT_TARGET_PLAYERS, humanPlayerCount);
    }
    return humanPlayerCount;
  }

  getRoleDistributionOptions(playerCount: number): RoleDistributionOption[] {
    if (playerCount <= 1) return [];

    const minCivilians = 2;
    const minThreats = playerCount >= 6 ? 2 : 1;
    const maxThreatsByCount =
      playerCount >= 10 ? 4 : playerCount >= 8 ? 3 : playerCount >= 6 ? 2 : 1;
    const maxThreats = Math.min(maxThreatsByCount, playerCount - minCivilians);
    const options: RoleDistributionOption[] = [];

    for (let threats = maxThreats; threats >= minThreats; threats--) {
      for (let mrWhiteCount = 0; mrWhiteCount <= threats; mrWhiteCount++) {
        const undercoverCount = threats - mrWhiteCount;
        const civilianCount = playerCount - threats;
        if (civilianCount < minCivilians) continue;
        options.push({ undercoverCount, mrWhiteCount, civilianCount });
      }
    }

    return options;
  }

  getResolvedRoleDistribution(playerCount: number): RoleDistributionOption {
    const options = this.getRoleDistributionOptions(playerCount);
    if (options.length === 0) {
      return {
        undercoverCount: 1,
        mrWhiteCount: 0,
        civilianCount: Math.max(0, playerCount - 1),
      };
    }

    if (this.selectedRoleDistribution) {
      const picked = options.find(
        (opt) =>
          opt.undercoverCount === this.selectedRoleDistribution?.undercoverCount &&
          opt.mrWhiteCount === this.selectedRoleDistribution?.mrWhiteCount
      );
      if (picked) return picked;
    }

    return options[0];
  }

  start() {
    const humanPlayerCount = this.players.size;

    if (humanPlayerCount < 1) {
      this.broadcast({
        type: "game-error",
        payload: { message: "Aucun joueur connecté." },
      });
      return;
    }

    this.started = true;
    this.ucPlayers.clear();
    this.botIds.clear();
    this.clearBotActionTimeouts();

    const roster: { id: string; name: string }[] = Array.from(
      this.players.values()
    ).map((p) => ({ id: p.id, name: p.name }));

    if (humanPlayerCount < 3) {
      const botCount = Math.max(0, LOCAL_BOT_TARGET_PLAYERS - humanPlayerCount);
      for (let i = 0; i < botCount; i++) {
        const botId = `bot-${i + 1}`;
        const botName = BOT_NAME_POOL[i] ?? `Bot ${i + 1}`;
        roster.push({ id: botId, name: botName });
        this.botIds.add(botId);
      }
    }

    const playerCount = roster.length;

    // Pick a random word pair from selected theme
    const pairs = getWordPairsForTheme(this.selectedThemeId);
    const safePairs = pairs.length > 0 ? pairs : CLASSIC_WORD_PAIRS;
    const pairIndex = Math.floor(Math.random() * safePairs.length);
    const pair = safePairs[pairIndex];
    if (Math.random() < 0.5) {
      this.civilianWord = pair[0];
      this.undercoverWord = pair[1];
    } else {
      this.civilianWord = pair[1];
      this.undercoverWord = pair[0];
    }

    // Assign roles
    const playerIds = roster.map((p) => p.id);
    this.shuffleArray(playerIds);

    const resolvedDistribution = this.getResolvedRoleDistribution(playerCount);
    const undercoverCount = resolvedDistribution.undercoverCount;
    const mrWhiteCount = resolvedDistribution.mrWhiteCount;

    for (let i = 0; i < playerIds.length; i++) {
      const pid = playerIds[i];
      const player = roster.find((p) => p.id === pid);
      if (!player) continue;
      let role: Role = "civilian";
      let word: string | null = this.civilianWord;

      if (i < undercoverCount) {
        role = "undercover";
        word = this.undercoverWord;
      } else if (i < undercoverCount + mrWhiteCount) {
        role = "mrwhite";
        word = null;
      }

      this.ucPlayers.set(pid, {
        id: pid,
        name: player.name,
        role,
        word,
        alive: true,
        description: null,
        hasDescribed: false,
        vote: null,
        hasVoted: false,
      });
    }

    // Randomize turn order
    this.turnOrder = Array.from(this.ucPlayers.keys());
    this.shuffleArray(this.turnOrder);

    // Start role reveal
    this.phase = "role-reveal";
    this.broadcastPersonalizedState();

    this.revealTimeout = setTimeout(() => {
      this.startDescribePhase();
    }, REVEAL_DURATION);
  }

  // ── Phase transitions ─────────────────────────────────────

  startDescribePhase() {
    this.clearTimers();
    this.round++;
    this.currentDescriberIndex = 0;
    this.phase = "describe";

    for (const p of this.ucPlayers.values()) {
      if (p.alive) {
        p.description = null;
        p.hasDescribed = false;
      }
    }

    this.advanceToNextAliveDescriber();
    this.startDescribeTimer();
    this.broadcastPersonalizedState();
    this.scheduleBotDescribeIfNeeded();
  }

  advanceToNextAliveDescriber(): boolean {
    while (this.currentDescriberIndex < this.turnOrder.length) {
      const pid = this.turnOrder[this.currentDescriberIndex];
      const p = this.ucPlayers.get(pid);
      if (p && p.alive) return true;
      this.currentDescriberIndex++;
    }
    return false;
  }

  startDescribeTimer() {
    this.timeLeft = Math.ceil(DESCRIBE_TIMEOUT / 1000);
    this.clearTimerInterval();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimerInterval();
      }
      this.broadcastPersonalizedState();
    }, 1000);

    this.describeTimeout = setTimeout(() => {
      this.handleDescribeTimeout();
    }, DESCRIBE_TIMEOUT);
  }

  handleDescribeTimeout() {
    this.clearTimers();
    const currentPid = this.turnOrder[this.currentDescriberIndex];
    const p = this.ucPlayers.get(currentPid);
    if (p && p.alive && !p.hasDescribed) {
      p.hasDescribed = true;
      p.description = "(pas de description)";
      this.clueHistory.push({
        playerId: p.id,
        playerName: p.name,
        text: "(pas de description)",
        round: this.round,
      });
    }
    this.moveToNextDescriber();
  }

  moveToNextDescriber() {
    this.currentDescriberIndex++;
    if (!this.advanceToNextAliveDescriber()) {
      this.startVotePhase();
    } else {
      this.startDescribeTimer();
      this.broadcastPersonalizedState();
      this.scheduleBotDescribeIfNeeded();
    }
  }

  startVotePhase() {
    this.clearTimers();
    this.phase = "vote";

    for (const p of this.ucPlayers.values()) {
      p.vote = null;
      p.hasVoted = false;
    }

    this.timeLeft = Math.ceil(VOTE_TIMEOUT / 1000);
    this.clearTimerInterval();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimerInterval();
      }
      this.broadcastPersonalizedState();
    }, 1000);

    this.voteTimeout = setTimeout(() => {
      this.resolveVotes();
    }, VOTE_TIMEOUT);

    this.broadcastPersonalizedState();
    this.scheduleBotVotes();
  }

  resolveVotes() {
    this.clearTimers();

    const voteCounts: Record<string, number> = {};
    for (const p of this.ucPlayers.values()) {
      if (p.alive && p.vote) {
        voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
      }
    }

    let maxVotes = 0;
    let eliminated: string | null = null;
    let isTie = false;

    for (const [pid, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminated = pid;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    if (isTie || !eliminated || maxVotes === 0) {
      this.eliminatedPlayerId = null;
      this.eliminatedRole = null;
      this.phase = "vote-result";
      this.broadcastPersonalizedState();

      this.resultTimeout = setTimeout(() => {
        this.afterVoteResult();
      }, RESULT_DISPLAY_TIME);
      return;
    }

    const ep = this.ucPlayers.get(eliminated);
    if (!ep) return;

    ep.alive = false;
    this.eliminatedPlayerId = eliminated;
    this.eliminatedRole = ep.role;

    // Mr. White gets a chance to guess
    if (ep.role === "mrwhite") {
      this.phase = "mrwhite-guess";
      this.timeLeft = Math.ceil(MR_WHITE_GUESS_TIMEOUT / 1000);
      this.broadcastPersonalizedState();

      this.clearTimerInterval();
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.clearTimerInterval();
        }
        this.broadcastPersonalizedState();
      }, 1000);

      this.mrWhiteTimeout = setTimeout(() => {
        this.mrWhiteGuessCorrect = false;
        this.phase = "vote-result";
        this.broadcastPersonalizedState();
        this.resultTimeout = setTimeout(() => {
          this.afterVoteResult();
        }, RESULT_DISPLAY_TIME);
      }, MR_WHITE_GUESS_TIMEOUT);

      this.scheduleBotMrWhiteGuess(ep.id);
      return;
    }

    this.phase = "vote-result";
    this.broadcastPersonalizedState();

    this.resultTimeout = setTimeout(() => {
      this.afterVoteResult();
    }, RESULT_DISPLAY_TIME);
  }

  afterVoteResult() {
    this.clearTimers();
    this.mrWhiteGuessCorrect = null;

    const alive = Array.from(this.ucPlayers.values()).filter((p) => p.alive);
    const aliveThreats = alive.filter(
      (p) => p.role === "undercover" || p.role === "mrwhite"
    ).length;
    const aliveCivilians = alive.filter((p) => p.role === "civilian").length;

    // Civilians win: all threats eliminated
    if (aliveThreats === 0) {
      this.winners = "civilian";
      this.endUndercoverGame();
      return;
    }

    // Undercover/MrWhite win: threats >= civilians
    if (aliveThreats >= aliveCivilians) {
      this.winners = "undercover";
      this.endUndercoverGame();
      return;
    }

    // Continue
    this.eliminatedPlayerId = null;
    this.eliminatedRole = null;
    this.startDescribePhase();
  }

  endUndercoverGame() {
    this.clearTimers();
    this.phase = "game-over";

    const players = Array.from(this.ucPlayers.values());
    const winnerRole = this.winners;
    const rankings: GameRanking[] = [];

    const isWinner = (p: UndercoverPlayer) => {
      if (winnerRole === "civilian") return p.role === "civilian";
      if (winnerRole === "mrwhite") return p.role === "mrwhite";
      return p.role === "undercover" || p.role === "mrwhite";
    };

    const winners = players.filter(isWinner);
    const losers = players.filter((p) => !isWinner(p));

    let rank = 1;
    for (const p of winners) {
      rankings.push({
        playerId: p.id,
        playerName: p.name,
        rank,
        score: p.alive ? 100 : 50,
      });
    }
    rank = winners.length + 1;
    for (const p of losers) {
      rankings.push({
        playerId: p.id,
        playerName: p.name,
        rank,
        score: 0,
      });
    }

    this.broadcastPersonalizedState();

    setTimeout(() => {
      this.endGame(rankings);
    }, GAME_END_DISPLAY_TIME);
  }

  // ── Message handling ──────────────────────────────────────

  isBot(playerId: string): boolean {
    return this.botIds.has(playerId);
  }

  queueBotAction(action: () => void, minDelayMs = 900, maxDelayMs = 2200) {
    const delay =
      minDelayMs + Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1));
    const timeout = setTimeout(() => {
      this.botActionTimeouts.delete(timeout);
      action();
    }, delay);
    this.botActionTimeouts.add(timeout);
  }

  scheduleBotDescribeIfNeeded() {
    if (this.phase !== "describe") return;
    const currentPid = this.turnOrder[this.currentDescriberIndex];
    if (!currentPid || !this.isBot(currentPid)) return;

    this.queueBotAction(() => {
      const current = this.turnOrder[this.currentDescriberIndex];
      if (current !== currentPid || this.phase !== "describe") return;

      const p = this.ucPlayers.get(currentPid);
      if (!p || !p.alive || p.hasDescribed) return;

      const clue = this.generateBotClue(p.role);
      p.description = clue;
      p.hasDescribed = true;
      this.clueHistory.push({
        playerId: p.id,
        playerName: p.name,
        text: clue,
        round: this.round,
      });

      this.clearTimers();
      this.moveToNextDescriber();
    });
  }

  scheduleBotVotes() {
    if (this.phase !== "vote") return;

    for (const botId of this.botIds) {
      const bot = this.ucPlayers.get(botId);
      if (!bot || !bot.alive || bot.hasVoted) continue;

      this.queueBotAction(() => {
        if (this.phase !== "vote") return;
        const currentBot = this.ucPlayers.get(botId);
        if (!currentBot || !currentBot.alive || currentBot.hasVoted) return;

        const aliveTargets = Array.from(this.ucPlayers.values()).filter(
          (p) => p.alive && p.id !== botId
        );
        if (aliveTargets.length === 0) return;

        const target =
          aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        currentBot.vote = target.id;
        currentBot.hasVoted = true;

        this.broadcastPersonalizedState();

        const allVoted = Array.from(this.ucPlayers.values())
          .filter((p) => p.alive)
          .every((p) => p.hasVoted);
        if (allVoted) {
          this.resolveVotes();
        }
      });
    }
  }

  scheduleBotMrWhiteGuess(playerId: string) {
    if (!this.isBot(playerId) || this.phase !== "mrwhite-guess") return;

    this.queueBotAction(
      () => {
        if (this.phase !== "mrwhite-guess") return;
        const bot = this.ucPlayers.get(playerId);
        if (!bot || bot.role !== "mrwhite") return;

        const guessPool = [this.civilianWord, this.undercoverWord];
        const guess =
          Math.random() < 0.35
            ? this.civilianWord
            : guessPool[Math.floor(Math.random() * guessPool.length)];
        this.applyMrWhiteGuess(guess);
      },
      1200,
      2600
    );
  }

  applyMrWhiteGuess(guessText: string) {
    const guess = guessText.trim().toLowerCase();
    const correct = guess === this.civilianWord.toLowerCase();

    this.clearTimers();
    this.mrWhiteGuessCorrect = correct;

    if (correct) {
      this.winners = "mrwhite";
      this.phase = "vote-result";
      this.broadcastPersonalizedState();

      this.resultTimeout = setTimeout(() => {
        this.endUndercoverGame();
      }, RESULT_DISPLAY_TIME);
    } else {
      this.phase = "vote-result";
      this.broadcastPersonalizedState();

      this.resultTimeout = setTimeout(() => {
        this.afterVoteResult();
      }, RESULT_DISPLAY_TIME);
    }
  }

  generateBotClue(role: Role): string {
    const commonClues = [
      "C'est quelque chose de tres connu.",
      "On peut le voir souvent.",
      "Le mot est assez simple.",
      "Je pense que tout le monde connait.",
      "C'est plutot facile a imaginer.",
    ];
    const undercoverClues = [
      "Je dirais que c'est un peu similaire.",
      "Ca me fait penser a quelque chose de proche.",
      "C'est dans la meme idee.",
    ];
    const mrWhiteClues = [
      "Je dirais que c'est quelque chose de courant.",
      "On en entend parler tres souvent.",
      "Je vais rester vague sur ce tour.",
    ];

    if (role === "mrwhite") {
      return mrWhiteClues[Math.floor(Math.random() * mrWhiteClues.length)];
    }
    if (role === "undercover" && Math.random() < 0.7) {
      return undercoverClues[Math.floor(Math.random() * undercoverClues.length)];
    }
    return commonClues[Math.floor(Math.random() * commonClues.length)];
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderPlayer = this.findPlayerByConnection(sender.id);
    if (!senderPlayer) return;

    if (!this.started || this.phase === "waiting") {
      if (action === "set-theme") {
        const themeId = payload.themeId as ThemeId;
        if (!themeId || !Object.keys(THEME_LABELS).includes(themeId)) return;
        this.selectedThemeId = themeId;
        this.broadcastPersonalizedState();
        return;
      }

      if (action === "set-role-distribution") {
        const undercoverCount = Number(payload.undercoverCount);
        const mrWhiteCount = Number(payload.mrWhiteCount);
        if (!Number.isFinite(undercoverCount) || !Number.isFinite(mrWhiteCount)) {
          return;
        }

        const expectedCount = this.getExpectedPlayerCount();
        const allowed = this.getRoleDistributionOptions(expectedCount).some(
          (opt) =>
            opt.undercoverCount === undercoverCount &&
            opt.mrWhiteCount === mrWhiteCount
        );
        if (!allowed) return;

        this.selectedRoleDistribution = {
          undercoverCount,
          mrWhiteCount,
        };
        this.broadcastPersonalizedState();
        return;
      }

      if (action === "start-game") {
        this.start();
        return;
      }
    }

    const pid = senderPlayer.id;
    const ucp = this.ucPlayers.get(pid);
    if (!ucp) return;

    switch (action) {
      case "describe": {
        if (this.phase !== "describe") return;
        if (!ucp.alive || ucp.hasDescribed) return;

        const currentPid = this.turnOrder[this.currentDescriberIndex];
        if (pid !== currentPid) return;

        const text = ((payload.text as string) || "").trim();
        if (!text) return;

        ucp.description = text;
        ucp.hasDescribed = true;
        this.clueHistory.push({
          playerId: pid,
          playerName: ucp.name,
          text,
          round: this.round,
        });

        this.clearTimers();
        this.moveToNextDescriber();
        break;
      }

      case "vote": {
        if (this.phase !== "vote") return;
        if (!ucp.alive || ucp.hasVoted) return;

        const targetId = payload.targetId as string;
        if (!targetId || targetId === pid) return;

        const target = this.ucPlayers.get(targetId);
        if (!target || !target.alive) return;

        ucp.vote = targetId;
        ucp.hasVoted = true;

        this.broadcastPersonalizedState();

        const allVoted = Array.from(this.ucPlayers.values())
          .filter((p) => p.alive)
          .every((p) => p.hasVoted);

        if (allVoted) {
          this.resolveVotes();
        }
        break;
      }

      case "mrwhite-guess": {
        if (this.phase !== "mrwhite-guess") return;
        if (ucp.role !== "mrwhite") return;

        const guess = (payload.guess as string) || "";
        this.applyMrWhiteGuess(guess);
        break;
      }
    }
  }

  // ── Personalized state ────────────────────────────────────

  broadcastPersonalizedState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  getStateForPlayer(playerId: string): Record<string, unknown> {
    if (this.phase === "waiting" || !this.started) {
      const expectedPlayerCount = this.getExpectedPlayerCount();
      const availableRoleDistributions =
        this.getRoleDistributionOptions(expectedPlayerCount);
      const selectedRoleDistribution =
        this.getResolvedRoleDistribution(expectedPlayerCount);
      return {
        phase: "waiting",
        round: 0,
        players: Array.from(this.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          alive: true,
          hasDescribed: false,
          hasVoted: false,
          description: null,
          role: null,
          word: null,
        })),
        turnOrder: [],
        currentDescriberId: null,
        clueHistory: [],
        timeLeft: 0,
        myRole: null,
        myWord: null,
        eliminatedPlayerId: null,
        eliminatedRole: null,
        mrWhiteGuessCorrect: null,
        winners: null,
        civilianWord: null,
        undercoverWord: null,
        selectedThemeId: this.selectedThemeId,
        availableThemes: this.getAvailableThemes(),
        expectedPlayerCount,
        selectedRoleDistribution,
        availableRoleDistributions,
      };
    }

    const me = this.ucPlayers.get(playerId);
    const visibleMyRole: Role | null =
      this.phase === "game-over"
        ? (me?.role ?? null)
        : me?.role === "mrwhite"
          ? "mrwhite"
          : null;

    const players = Array.from(this.ucPlayers.values()).map((p) => {
      const isMe = p.id === playerId;
      const isEliminated = !p.alive;

      return {
        id: p.id,
        name: p.name,
        alive: p.alive,
        hasDescribed: p.hasDescribed,
        hasVoted: p.hasVoted,
        description: p.description,
        role:
          isMe
            ? visibleMyRole
            : isEliminated || this.phase === "game-over"
              ? p.role
              : null,
        word:
          isMe
            ? p.word
            : this.phase === "game-over"
              ? p.word
              : null,
      };
    });

    let currentDescriberId: string | null = null;
    if (
      this.phase === "describe" &&
      this.currentDescriberIndex < this.turnOrder.length
    ) {
      currentDescriberId = this.turnOrder[this.currentDescriberIndex];
    }

    return {
      phase: this.phase,
      round: this.round,
      players,
      turnOrder: this.turnOrder,
      currentDescriberId,
      clueHistory: this.clueHistory,
      timeLeft: this.timeLeft,
      myRole: visibleMyRole,
      myWord: me?.word ?? null,
      eliminatedPlayerId: this.eliminatedPlayerId,
      eliminatedRole: this.eliminatedRole,
      mrWhiteGuessCorrect: this.mrWhiteGuessCorrect,
      winners: this.winners,
      civilianWord: this.phase === "game-over" ? this.civilianWord : null,
      undercoverWord: this.phase === "game-over" ? this.undercoverWord : null,
      selectedThemeId: this.selectedThemeId,
      availableThemes: this.getAvailableThemes(),
    };
  }

  getState(): Record<string, unknown> {
    if (!this.started || this.phase === "waiting") {
      return this.getStateForPlayer("");
    }
    return {
      phase: this.phase,
      round: this.round,
      players: Array.from(this.ucPlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        alive: p.alive,
        hasDescribed: p.hasDescribed,
        hasVoted: p.hasVoted,
        description: p.description,
        role: !p.alive || this.phase === "game-over" ? p.role : null,
        word: null,
      })),
      turnOrder: this.turnOrder,
      currentDescriberId: null,
      clueHistory: this.clueHistory,
      timeLeft: this.timeLeft,
      myRole: null,
      myWord: null,
      eliminatedPlayerId: this.eliminatedPlayerId,
      eliminatedRole: this.eliminatedRole,
      mrWhiteGuessCorrect: this.mrWhiteGuessCorrect,
      winners: this.winners,
      civilianWord: null,
      undercoverWord: null,
      selectedThemeId: this.selectedThemeId,
      availableThemes: this.getAvailableThemes(),
    };
  }

  // ── Utilities ─────────────────────────────────────────────

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  getAvailableThemes() {
    return (Object.keys(THEME_LABELS) as ThemeId[]).map((id) => ({
      id,
      label: THEME_LABELS[id],
      description: THEME_DESCRIPTIONS[id],
    }));
  }

  shuffleArray<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  clearTimerInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  clearTimers() {
    this.clearTimerInterval();
    this.clearBotActionTimeouts();
    if (this.revealTimeout) { clearTimeout(this.revealTimeout); this.revealTimeout = null; }
    if (this.describeTimeout) { clearTimeout(this.describeTimeout); this.describeTimeout = null; }
    if (this.voteTimeout) { clearTimeout(this.voteTimeout); this.voteTimeout = null; }
    if (this.resultTimeout) { clearTimeout(this.resultTimeout); this.resultTimeout = null; }
    if (this.mrWhiteTimeout) { clearTimeout(this.mrWhiteTimeout); this.mrWhiteTimeout = null; }
  }

  clearBotActionTimeouts() {
    for (const timeout of this.botActionTimeouts) {
      clearTimeout(timeout);
    }
    this.botActionTimeouts.clear();
  }

  cleanup() {
    this.clearTimers();
  }
}
