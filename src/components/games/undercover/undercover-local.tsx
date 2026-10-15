"use client";

import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { useMemo, useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Mascot, MASCOT_COLORS, MASCOT_PALETTE, type MascotColor, type MascotMood } from "@/components/Mascot";
import { registerSoftReplay } from "@/lib/game-replay";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronUp, Dices, Eye, Lock, Minus, Plus, RotateCcw, Scale, Shuffle, Target, TriangleAlert } from "lucide-react";
import { GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { DISPLAY, PlayersSetup, SoundButton, ZButton, ZChip, ZZ, zBackground, useScrollTopOn } from "@/components/games/local-kit";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { isOfflineApp } from "@/lib/offline-app";
import { requestPaywall, useUnlocked } from "@/lib/entitlements";
import { PremiumNudge, fmtCount, useNudgeText } from "@/components/games/premium-nudge";
import { adultDefault } from "@/lib/party-mood";
import { getLang, useT, type Lang } from "@/lib/i18n";
import { FREE_CAT_IDS, allWordPairs, freePairs, wordCategories, type WordCategory } from "@/components/games/undercover/words";
import { UC_STR } from "@/components/games/undercover/i18n";
import { useGameFinished } from "@/lib/game-finished";
import { GameTuto, TutoAgainButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { useUndercoverTuto } from "@/components/games/undercover/tuto";
import { SoireeGain, SoireeNextButton } from "@/components/games/soiree-next";
import { EndHomeLink, EndPills, EndReplay } from "@/components/games/end-actions";

/* ─────────────────────────────────────────────────────────────
   L'INTRUS LOCAL — Pass-and-play (un seul téléphone)
   Toute la logique de jeu tourne dans le composant.
   Aucune dépendance serveur / PartyKit.
   ───────────────────────────────────────────────────────────── */

// ═════════════════════════════════════════════════════════════
//  Modèle de données
// ═════════════════════════════════════════════════════════════
type Role = "civil" | "undercover" | "mrwhite" | "jester";

interface LocalPlayer {
  idx: number;            // position d'origine (sert de "id" stable)
  name: string;
  role: Role;
  word: string | null;
  isEliminated: boolean;
  eliminatedRound: number | null;
  hasSpoken: boolean;     // a confirmé "j'ai parlé" pour la manche en cours
  score: number;
}

type LocalPhase =
  | "setup-players"
  | "setup-roles"
  | "pass-reveal"
  | "reveal"
  | "table"
  | "review-pick"
  | "review-pass"
  | "review-show"
  | "pass-vote"
  | "vote"
  | "tally"
  | "eliminate"
  | "mrwhite-pass"
  | "mrwhite-guess"
  | "over";

type EndReason = "civils-win" | "undercover-wins" | "mrwhite-wins" | "jester-wins";

// ═════════════════════════════════════════════════════════════
//  Banque de mots : voir words.ts (une version par langue)
// ═════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════
//  Tokens (mirror online)
// ═════════════════════════════════════════════════════════════
const ROLE_COLOR: Record<Role, string> = { civil: "#3DDC97", undercover: "#FF3EA5", mrwhite: "#FFD23F", jester: "#C58CFF" };

/** Taille du mot secret adaptée à sa longueur (le mot le plus long décide). */
const wordFontSize = (word: string | null, max = 56) => {
  const longest = Math.max(1, ...(word ?? "?????").split(/\s+/).map((w) => w.length));
  return `clamp(24px, ${Math.min(15, 125 / longest).toFixed(1)}vw, ${max}px)`;
};
const WORD_WRAP: CSSProperties = { overflowWrap: "break-word", wordBreak: "break-word", hyphens: "auto" };


// ═════════════════════════════════════════════════════════════
//  Composant principal
// ═════════════════════════════════════════════════════════════
export default function UndercoverLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  // ── State global ────────────────────────────────────────
  const [phase, setPhase]           = useState<LocalPhase>("setup-players");
  const [players, setPlayers]       = useState<LocalPlayer[]>([]);
  const [round, setRound]           = useState(1);
  const [endReason, setEndReason]   = useState<EndReason | null>(null);
  // Fin de partie → note éventuelle + Soirée (app) : les joueurs du camp gagnant
  useGameFinished(phase === "over", { winners: endReason ? players.filter((p) => (endReason === "civils-win" ? p.role === "civil" : endReason === "undercover-wins" ? p.role === "undercover" || p.role === "mrwhite" : endReason === "jester-wins" ? p.role === "jester" : p.role === "mrwhite")).map((p) => p.name) : [] });
  // Catégories de mots sélectionnées (toutes par défaut, sauf le +18).
  // Langue figée pour la partie (on ne change pas de banque de mots en cours de jeu).
  const [lang] = useState<Lang>(() => getLang());
  const t = useT(UC_STR);
  const cats = wordCategories(lang);
  // Abonné (ou site web) = tous les thèmes ; sinon 50 paires gratuites
  const unlocked = useUnlocked();
  // Soirée « Folle » : le +18 est coché d'office (seulement s'il est débloqué).
  const [selectedCats, setSelectedCats] = useState<Set<string>>(() => new Set(cats.filter((c) => !c.adult || (unlocked && adultDefault(false))).map((c) => c.id)));

  // Pair de mots tirée pour la partie
  const [civilWord, setCivilWord]   = useState("");
  const [rerollNotice, setRerollNotice] = useState(false);
  const [ucWord, setUcWord]         = useState("");

  // Config de rôles (configurée en setup-roles)
  const [ucCount, setUcCount]       = useState(1);
  const [mrWhite, setMrWhite]       = useState(false);
  const [jester, setJester]         = useState(false);  // Bouffon : gagne seul s'il se fait éliminer par le vote

  // Distribution / phase pass-reveal
  const [revealIdx, setRevealIdx]   = useState(0);   // joueur courant qui voit son mot

  // Ordre de parole + joueur courant
  const [order, setOrder]           = useState<number[]>([]); // index des joueurs vivants
  const [currentSpeaker, setCurrentSpeaker] = useState(0);    // position dans `order`

  // Phase vote
  const [voteOrder, setVoteOrder]   = useState<number[]>([]); // ordre des votants vivants
  const [voteIdx, setVoteIdx]       = useState(0);            // position dans voteOrder
  const [votes, setVotes]           = useState<Record<number, number>>({}); // voter → target

  // Phase eliminate
  const [eliminatedIdx, setEliminatedIdx] = useState<number | null>(null);

  // Phase review (revoir mon mot)
  const [reviewIdx, setReviewIdx]   = useState<number | null>(null);
  const [reviewBack, setReviewBack] = useState<LocalPhase>("table");

  // Le Fantôme devine
  const [mrWhiteGuess, setMrWhiteGuess] = useState<string | null>(null);
  const [mrWhiteRight, setMrWhiteRight] = useState<boolean | null>(null);

  useEffect(() => { preloadSfx(["card-shuffle", "card-flip", "whoosh", "tock", "gong", "boom", "wrong", "lose", "win", "powerup", "ding", "toggle", "select", "success"]); }, []);
  useScrollTopOn(`${phase}-${revealIdx}-${round}`);
  // Tuto en slides : 1re fois dès l'ouverture, avant les prénoms (version générique, sans les rôles
  // bonus pas encore choisis) ; « Revoir le tuto » ajoute la slide « rôles bonus » si Fantôme/Bouffon
  const tuto = useFirstTimeTuto("undercover", { atMount: true });
  const tutoSlides = useUndercoverTuto(!tuto.auto && (mrWhite || jester));
  const tutoLayer = tuto.open ? <GameTuto slides={tutoSlides} onDone={tuto.close} /> : null;

  // ── Helpers ─────────────────────────────────────────────
  const alive = players.filter((p) => !p.isEliminated);
  const aliveUC = alive.filter((p) => p.role === "undercover").length;
  const aliveMW = alive.filter((p) => p.role === "mrwhite").length;
  const aliveCv = alive.filter((p) => p.role === "civil").length;

  // ── Démarrage : noms validés ────────────────────────────
  const handleStartNames = (names: string[]) => {
    const initial: LocalPlayer[] = names.map((n, i) => ({
      idx: i, name: n,
      role: "civil", word: null,
      isEliminated: false, eliminatedRound: null,
      hasSpoken: false, score: 0,
    }));
    setPlayers(initial);
    // Auto-balance par défaut selon nb joueurs
    const n = names.length;
    if (n <= 4)      { setUcCount(1); setMrWhite(false); }
    else if (n <= 6) { setUcCount(1); setMrWhite(true);  }
    else             { setUcCount(2); setMrWhite(true);  }
    setJester(false);
    setPhase("setup-roles");
  };

  // ── Distribution des rôles + mots ───────────────────────
  const distributeRoles = () => {
    // Pioche dans les catégories choisies (toutes si aucune sélection).
    const pool = !unlocked
      ? freePairs(lang)
      : selectedCats.size === 0
        ? allWordPairs(lang)
        : cats.filter((c) => selectedCats.has(c.id)).flatMap((c) => c.pairs);
    const src0 = pool.length > 0 ? pool : allWordPairs(lang);
    // Jamais deux fois la même paire d'affilée (bouton « Changer de mot »)
    const src = src0.length > 1 ? src0.filter((pp) => !pp.includes(civilWord)) : src0;
    const pair = src[Math.floor(Math.random() * src.length)];
    const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
    setCivilWord(a); setUcWord(b);

    const ids = players.map((p) => p.idx);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);

    // Nouvelle distribution = manche neuve : on remet tout le monde en vie.
    const newPlayers: LocalPlayer[] = players.map((p) => ({ ...p, isEliminated: false, eliminatedRound: null, hasSpoken: false, role: "civil" as Role, word: a as string | null }));
    let i = 0;
    for (let u = 0; u < ucCount && i < shuffled.length; u++, i++) {
      const id = shuffled[i];
      newPlayers[id] = { ...newPlayers[id], role: "undercover", word: b };
    }
    if (mrWhite && i < shuffled.length) {
      const id = shuffled[i];
      newPlayers[id] = { ...newPlayers[id], role: "mrwhite", word: null };
      i++;
    }
    if (jester && i < shuffled.length) {
      const id = shuffled[i];
      // Le Bouffon a le mot des civils (il se fond dans la masse), mais son but
      // est de se faire éliminer.
      newPlayers[id] = { ...newPlayers[id], role: "jester", word: a };
      i++;
    }
    for (; i < shuffled.length; i++) {
      const id = shuffled[i];
      newPlayers[id] = { ...newPlayers[id], role: "civil", word: a };
    }

    setPlayers(newPlayers);
    setRevealIdx(0);
    playSfx("card-shuffle", { volume: 0.8 });
    setPhase("pass-reveal");
  };

  // « Relancer la partie » (menu paramètres) : si une partie est en cours,
  // on redistribue directement avec les mêmes joueurs + rôles (nouveau mot),
  // sans repasser par les écrans de réglages.
  const inGame = players.length > 0 && phase !== "setup-players" && phase !== "setup-roles";
  useEffect(() => {
    registerSoftReplay(inGame ? () => {
      setRound(1);
      setEndReason(null);
      setEliminatedIdx(null);
      setMrWhiteGuess(null);
      setMrWhiteRight(null);
      distributeRoles();
    } : null);
    return () => registerSoftReplay(null);
  });

  // « Mot nul ? » : nouvelle paire (et nouveaux rôles). Si c'est le 1er joueur,
  // il voit directement son nouveau mot ; sinon d'autres ont vu l'ancien → on
  // refait la distribution depuis le début.
  const rerollWord = () => {
    const first = revealIdx === 0;
    distributeRoles();
    if (first) setPhase("reveal");
    else setRerollNotice(true);
  };

  // ── Avancer dans pass-reveal ────────────────────────────
  const ackReveal = () => {
    if (revealIdx < players.length - 1) {
      setRevealIdx(revealIdx + 1);
      setPhase("pass-reveal");
    } else {
      // Tous ont vu leur mot → table de parole
      startRoundTable();
    }
  };

  // ── Démarrage manche : ordre de parole ──────────────────
  const startRoundTable = () => {
    const aliveIds = players
      .filter((p) => !p.isEliminated)
      .map((p) => p.idx);
    const shuffled = [...aliveIds].sort(() => Math.random() - 0.5);
    setOrder(shuffled);
    setCurrentSpeaker(0);
    // reset hasSpoken
    setPlayers((ps) => ps.map((p) => ({ ...p, hasSpoken: false })));
    setVotes({});
    setEliminatedIdx(null);
    setMrWhiteGuess(null);
    setMrWhiteRight(null);
    setPhase("table");
  };

  const advanceSpeaker = () => {
    const next = currentSpeaker + 1;
    setPlayers((ps) => ps.map((p) => p.idx === order[currentSpeaker] ? { ...p, hasSpoken: true } : p));
    if (next < order.length) {
      setCurrentSpeaker(next);
    }
    // Si plus personne → on n'avance pas automatiquement, l'hôte clique "Passer au vote"
  };

  // ── Vote de groupe (un seul, sur le téléphone partagé) ──
  const startVote = () => {
    setPhase("vote");
  };

  // La table désigne UN joueur ensemble → on l'élimine directement.
  const eliminateTarget = (id: number) => {
    const target = players[id];
    if (!target) return;
    setPlayers((ps) => ps.map((p) => (p.idx === id ? { ...p, isEliminated: true, eliminatedRound: round } : p)));
    setEliminatedIdx(id);
    // Roulement de tambour… puis le verdict (imposteur démasqué = gong, innocent = raté)
    playCombo("drumroll");
    if (target.role === "undercover") { playSfx("gong", { volume: 0.85, delay: 1.05 }); }
    else if (target.role === "jester") { playSfx("win", { volume: 0.9, delay: 1.05 }); }
    else if (target.role === "mrwhite") { playSfx("gong", { volume: 0.8, delay: 1.05 }); }
    else { playSfx("wrong", { volume: 0.8, delay: 1.05 }); playSfx("lose", { volume: 0.5, delay: 1.12 }); }
    if (target.role === "jester") {
      // Le Bouffon voulait être éliminé → il gagne immédiatement.
      setPlayers((ps) => ps.map((p) => (p.idx === id ? { ...p, score: p.score + 6 } : p)));
      setEndReason("jester-wins");
      setPhase("over");
      return;
    }
    if (target.role === "mrwhite") setPhase("mrwhite-pass");
    else setPhase("eliminate");
  };

  // ── Le Fantôme devine ───────────────────────────────────
  const submitMrWhiteGuess = (guess: string) => {
    setMrWhiteGuess(guess);
    const norm = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const right = norm(guess) === norm(civilWord);
    setMrWhiteRight(right);
    if (right) playCombo("fanfare"); else playCombo("fail");
    if (right) {
      // Le Fantôme gagne seul
      if (eliminatedIdx !== null) {
        setPlayers((ps) => ps.map((p) => p.idx === eliminatedIdx ? { ...p, score: p.score + 5 } : p));
      }
      setEndReason("mrwhite-wins");
      setPhase("over");
    } else {
      setPhase("eliminate");
    }
  };

  // ── Vérifier victoire / passer manche suivante ──────────
  const afterEliminate = () => {
    const remain = players.filter((p) => !p.isEliminated);
    const remUC = remain.filter((p) => p.role === "undercover").length;
    const remMW = remain.filter((p) => p.role === "mrwhite").length;
    const remCv = remain.filter((p) => p.role === "civil" || p.role === "jester").length;

    // Civils gagnent
    if (remUC === 0 && remMW === 0) {
      setPlayers((ps) => ps.map((p) => (p.role === "civil" && !p.isEliminated) ? { ...p, score: p.score + 3 } : p));
      setEndReason("civils-win");
      playCombo("fanfare");
      setPhase("over");
      return;
    }
    // Imposteurs gagnent (aussi nombreux que les autres joueurs vivants).
    // Le Bouffon n'est PAS un imposteur : il ne gagne que s'il est éliminé par le vote.
    if (remUC + remMW >= remCv) {
      setPlayers((ps) => ps.map((p) =>
        ((p.role === "undercover" || p.role === "mrwhite") && !p.isEliminated) ? { ...p, score: p.score + 5 } : p
      ));
      setEndReason("undercover-wins");
      playCombo("fanfare");
      setPhase("over");
      return;
    }
    // Bonus survie
    setPlayers((ps) => ps.map((p) => (p.role === "civil" && !p.isEliminated) ? { ...p, score: p.score + 1 } : p));
    // Manche suivante
    setRound(round + 1);
    startRoundTable();
  };

  // ── Revoir mon mot ──────────────────────────────────────
  const startReview = () => {
    setReviewBack(phase);
    setPhase("review-pick");
  };
  const pickReview = (idx: number) => {
    setReviewIdx(idx);
    setPhase("review-pass");
  };

  // ═════════════════════════════════════════════════════════
  //  Rendering par phase
  // ═════════════════════════════════════════════════════════

  // 1. Setup joueurs
  if (phase === "setup-players") {
    return (
      <>
        <PlayersSetup emoji="🕶️" name={t.gameName} min={3} max={12} accent="#FF3EA5" onStart={handleStartNames} onBack={onReturnToLobby}
          footer={<IdeaButton game={t.gameName} kind="mot" />} />
        {tutoLayer}
      </>
    );
  }

  // 2. Setup rôles
  if (phase === "setup-roles") {
    return (
      <SetupRoles
        players={players}
        ucCount={ucCount}
        setUcCount={setUcCount}
        mrWhite={mrWhite}
        setMrWhite={setMrWhite}
        jester={jester}
        setJester={setJester}
        selectedCats={selectedCats}
        cats={cats}
        lang={lang}
        unlocked={unlocked}
        setSelectedCats={setSelectedCats}
        onStart={distributeRoles}
        onBack={() => setPhase("setup-players")}
        onTuto={tuto.show}
        tutoLayer={tutoLayer}
      />
    );
  }

  // 3. Pass phone for reveal
  if (phase === "pass-reveal") {
    const p = players[revealIdx];
    return (
      <PassScreenUC
        toName={p.name}
        colorIdx={p.idx}
        label={t.distribution(revealIdx + 1, players.length)}
        tag={rerollNotice ? t.rerollNotice : undefined}
        players={players}
        currentIdx={p.idx}
        buttonLabel={<><GameInlineIcon icon={Eye} /> {t.seeMyRole}</>}
        onReady={() => { setRerollNotice(false); playSfx("card-flip", { volume: 0.8 }); setPhase("reveal"); }}
      />
    );
  }

  // 4. Reveal word
  if (phase === "reveal") {
    const p = players[revealIdx];
    return (
      <RevealScreen
        player={p}
        lang={lang}
        round={round}
        position={revealIdx + 1}
        total={players.length}
        onAck={ackReveal}
        onReroll={rerollWord}
      />
    );
  }

  // 5. Table (ordre de parole)
  if (phase === "table") {
    return (
      <TableScreen
        players={players}
        order={order}
        round={round}
        onReviewWord={startReview}
        onForceVote={startVote}
      />
    );
  }

  // 6. Review pick (qui veut revoir ?)
  if (phase === "review-pick") {
    return (
      <ReviewPick
        players={players}
        onPick={pickReview}
        onCancel={() => setPhase(reviewBack)}
      />
    );
  }
  if (phase === "review-pass") {
    const p = players[reviewIdx!];
    return (
      <PassScreenUC
        toName={p.name}
        colorIdx={p.idx}
        label={t.reviewLabel}
        tag={t.privateTag}
        buttonLabel={<><GameInlineIcon icon={Eye} /> {t.seeMyRole}</>}
        onReady={() => setPhase("review-show")}
      />
    );
  }
  if (phase === "review-show") {
    const p = players[reviewIdx!];
    return (
      <RevealScreen
        player={p}
        lang={lang}
        round={round}
        position={null}
        total={players.length}
        review
        onAck={() => setPhase(reviewBack)}
      />
    );
  }

  // 7. Vote
  if (phase === "vote" || phase === "pass-vote") {
    return (
      <GroupVoteScreen
        players={players}
        round={round}
        onEliminate={eliminateTarget}
        onCancel={() => setPhase("table")}
      />
    );
  }

  // 8. Eliminate
  if (phase === "eliminate") {
    const elim = eliminatedIdx !== null ? players[eliminatedIdx] : null;
    return (
      <EliminateScreen
        eliminated={elim}
        round={round}
        civilWord={civilWord}
        onNext={afterEliminate}
      />
    );
  }

  // 9. Le Fantôme : passe + devine
  if (phase === "mrwhite-pass") {
    const p = eliminatedIdx !== null ? players[eliminatedIdx] : null;
    if (!p) return null;
    return (
      <PassScreenUC
        toName={p.name}
        colorIdx={p.idx}
        label={t.ghostLastChanceLabel}
        tag={t.bonus}
        buttonLabel={<><GameInlineIcon icon={Target} /> {t.tryMyLuck}</>}
        onReady={() => setPhase("mrwhite-guess")}
      />
    );
  }
  if (phase === "mrwhite-guess") {
    const p = eliminatedIdx !== null ? players[eliminatedIdx] : null;
    if (!p) return null;
    return (
      <MrWhiteGuess
        player={p}
        onSubmit={submitMrWhiteGuess}
      />
    );
  }

  // 10. Game over
  if (phase === "over") {
    return (
      <GameOverScreen
        players={players}
        endReason={endReason!}
        civilWord={civilWord}
        ucWord={ucWord}
        mrWhiteGuess={mrWhiteGuess}
        mrWhiteRight={mrWhiteRight}
        onReplay={() => {
          // Revanche : mêmes joueurs + même config de rôles, on redistribue
          // juste un nouveau mot (pas besoin de repasser par les réglages).
          setRound(1);
          setEndReason(null);
          setEliminatedIdx(null);
          setMrWhiteGuess(null);
          setMrWhiteRight(null);
          distributeRoles();
        }}
        onLobby={onReturnToLobby}
      />
    );
  }

  return null;
}

// ═════════════════════════════════════════════════════════════
//  ÉCRANS — chacun mappé sur une maquette
// ═════════════════════════════════════════════════════════════

// — SETUP ROLES (composition)
function SetupRoles({
  players, ucCount, setUcCount, mrWhite, setMrWhite, jester, setJester, selectedCats, setSelectedCats, cats, lang, unlocked, onStart, onBack, onTuto, tutoLayer,
}: {
  players: LocalPlayer[];
  ucCount: number; setUcCount: (v: number) => void;
  mrWhite: boolean; setMrWhite: (v: boolean) => void;
  jester: boolean; setJester: (v: boolean) => void;
  selectedCats: Set<string>; setSelectedCats: (v: Set<string>) => void;
  cats: WordCategory[]; lang: Lang;
  unlocked: boolean;
  onStart: () => void; onBack: () => void;
  onTuto: () => void; tutoLayer: ReactNode;
}) {
  const t = useT(UC_STR);
  const toggleCat = (id: string) => {
    const next = new Set(selectedCats);
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) return; // garder au moins une catégorie
    setSelectedCats(next);
  };
  // « Tout » = toutes les catégories tout public ; le +18 se coche à part.
  const safeIds = cats.filter((c) => !c.adult).map((c) => c.id);
  const allSafe = safeIds.every((id) => selectedCats.has(id));
  const toggleAll = () => {
    const next = new Set(allSafe ? [safeIds[0]] : safeIds);
    for (const c of cats) if (c.adult && selectedCats.has(c.id)) next.add(c.id);
    setSelectedCats(next);
  };
  const total = players.length;
  // Les civils doivent rester majoritaires : (Intrus + Fantôme) < civils.
  const impostorCap = Math.floor((total - 1) / 2); // nb max d'imposteurs au total
  const canMrWhite = impostorCap >= 2;             // Fantôme à partir de 5 joueurs
  const mwSlots = mrWhite && canMrWhite ? 1 : 0;
  const maxUC = Math.max(1, Math.min(3, impostorCap - mwSlots));
  const ucEff = Math.min(Math.max(1, ucCount), maxUC);
  // Le Bouffon est neutre : il prend une place côté civils. Il faut qu'il
  // reste au moins 1 vrai civil après Intrus + Fantôme + Bouffon.
  const canJester = total - ucEff - mwSlots >= 3;
  const jSlots = jester && canJester ? 1 : 0;
  const civils = total - ucEff - mwSlots - jSlots;
  const valid = ucEff >= 1 && civils >= 1 && ucEff + mwSlots < civils + jSlots;
  const toggleMrWhite = (v: boolean) => {
    const nv = v && canMrWhite;
    if (nv) {
      const cap = Math.max(1, Math.min(3, impostorCap - 1));
      if (ucCount > cap) setUcCount(cap);
    }
    setMrWhite(nv);
  };
  const toggleJester = (v: boolean) => setJester(v && canJester);

  return (
    <LocalShell tone="noir">
      <NavBar sub={t.setupSub(total)} title={t.setupTitle} onBack={onBack} right={<Tag color="#FF3EA5">{t.rolesTag}</Tag>} />

      <FileCard accent="#FF3EA5" style={{ marginBottom: 14 }}>
        <div style={{ ...DISPLAY, fontSize: 24, marginBottom: 10 }}>{t.whoIsWho}</div>

        {/* Visualisation : un blob par rôle */}
        <div style={{
          padding: "14px 10px", borderRadius: 18,
          background: "#fff", border: `2.5px solid ${ZZ.ink}`,
          display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap",
          marginBottom: 14,
        }}>
          {Array.from({ length: civils }).map((_, i) => (
            <Mascot key={`c${i}`} size={42} color="mint" mood="happy" bob={false} shadow={false} delay={i * 0.1} />
          ))}
          {Array.from({ length: ucEff }).map((_, i) => (
            <Mascot key={`u${i}`} size={42} color="pink" mood="shifty" bob={false} shadow={false} delay={0.3 + i * 0.1} />
          ))}
          {mwSlots > 0 && <Mascot size={42} color="white" mood="thinking" bob={false} shadow={false} delay={0.5} />}
          {jSlots > 0 && <Mascot size={42} color="lavender" mood="laughing" bob={false} shadow={false} delay={0.6} />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: jSlots > 0 ? "repeat(4,1fr)" : "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
          <Stat n={civils} label={t.statCivils} color="#3DDC97" sub={t.statCivilsSub} />
          <Stat n={ucEff} label={t.statImpostor} color="#FF3EA5" sub={t.statImpostorSub} />
          <Stat n={mwSlots} label={t.statGhost} color="#FFD23F" sub={t.statGhostSub} />
          {jSlots > 0 && <Stat n={jSlots} label={t.statJester} color="#C58CFF" sub={t.statJesterSub} />}
        </div>

        <Row label={t.role.undercover} hint={maxUC > 1 ? t.ucRange(maxUC) : t.ucMaxOne}>
          <Stepper value={ucEff} min={1} max={maxUC} onChange={setUcCount} />
        </Row>
        <Row label={t.role.mrwhite} hint={canMrWhite ? t.ghostHint : t.ghostMin}>
          <Toggle value={mwSlots > 0} onChange={toggleMrWhite} disabled={!canMrWhite} />
        </Row>
        <Row label={t.role.jester} hint={canJester ? t.jesterHint : t.jesterNotEnough}>
          <Toggle value={jSlots > 0} onChange={toggleJester} disabled={!canJester} />
        </Row>
      </FileCard>

      {/* Catégories de mots */}
      {unlocked ? (
        <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 10px" }}>
          <div style={{ ...DISPLAY, fontSize: 28 }}>{t.theWords}</div>
          <ZButton size="sm" bg={allSafe ? ZZ.yellow : "#fff"} onClick={toggleAll} style={{ width: "auto" }}>{allSafe ? t.allChecked : t.checkAll}</ZButton>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {cats.map((c, i) => {
            const on = selectedCats.has(c.id);
            return (
              <button key={c.id} type="button" onClick={() => { playSfx("toggle", { volume: 0.45 }); toggleCat(c.id); }} aria-pressed={on}
                className="transition-[translate,box-shadow] shadow-[0_3px_0_#15082E] active:translate-y-[2px] active:shadow-[0_1px_0_#15082E]"
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "0 14px", minHeight: 44, borderRadius: 999,
                  fontSize: 15, fontWeight: 800, color: ZZ.ink,
                  // Décoché : sticker blanc plein avec « + » (pas de gris translucide qui fait « désactivé »)
                  background: on ? (c.adult ? ZZ.pink : ZZ.yellow) : "#fff",
                  border: `2.5px solid ${ZZ.ink}`, rotate: on ? `${i % 2 ? 1.5 : -1.5}deg` : undefined,
                }}>
                {on ? <Check size={15} strokeWidth={3.2} aria-hidden /> : <Plus size={15} strokeWidth={3.2} aria-hidden />}{c.adult ? t.naughty : c.label}
              </button>
            );
          })}
        </div>
        </>
      ) : (
        <>
          <div style={{ ...DISPLAY, fontSize: 28, margin: "14px 0 10px" }}>{t.theWords}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 6, padding: "0 14px", minHeight: 44, borderRadius: 999,
              fontSize: 15, fontWeight: 800, color: ZZ.ink, background: ZZ.yellow, border: `2.5px solid ${ZZ.ink}`,
              boxShadow: `0 3px 0 ${ZZ.ink}`, rotate: "-1.5deg",
            }}>
              <Check size={15} strokeWidth={3.2} aria-hidden /> {t.freePairs(freePairs(lang).length)}
            </span>
            {cats.filter((c) => !FREE_CAT_IDS.includes(c.id)).map((c) => (
              <button key={c.id} type="button" onClick={() => { playSfx("tap", { volume: 0.5 }); requestPaywall(); }}
                aria-label={t.premiumOnly(c.adult ? t.naughty : c.label)}
                className="transition-[translate,box-shadow] shadow-[0_3px_0_#15082E] active:translate-y-[2px] active:shadow-[0_1px_0_#15082E]"
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "0 14px", minHeight: 44, borderRadius: 999,
                  fontSize: 15, fontWeight: 800, color: ZZ.ink, background: "#fff", border: `2.5px solid ${ZZ.ink}`,
                }}>
                <Lock size={14} strokeWidth={3} aria-hidden /> {c.adult ? t.naughty : c.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { playSfx("open", { volume: 0.6 }); requestPaywall(); }}
            className="transition-[translate,box-shadow] shadow-[0_4px_0_#15082E] active:translate-y-[3px] active:shadow-[0_1px_0_#15082E]"
            style={{
              width: "100%", textAlign: "left", padding: "14px 16px", marginBottom: 18, borderRadius: 22,
              background: ZZ.pink, color: ZZ.ink, border: `2.5px solid ${ZZ.ink}`,
            }}>
            <div style={{ ...DISPLAY, fontSize: 21 }}>{t.unlockAll}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t.unlockAllSub(allWordPairs(lang).length - freePairs(lang).length)}</div>
          </button>
        </>
      )}

      <RulesCard jester={jSlots > 0} onTuto={onTuto} />
      {tutoLayer}

      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Btn tone="gold" disabled={!valid} onClick={onStart} icon={<Shuffle size={20} strokeWidth={2.6} aria-hidden />}>
          {t.dealRoles}
        </Btn>
        <p style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 10 }}>{t.dealHint}</p>
      </div>
    </LocalShell>
  );
}

// — REVEAL (carte dossier)
function RevealScreen({
  player, lang, round, position, total, review = false, onAck, onReroll,
}: {
  player: LocalPlayer;
  lang: Lang;
  round: number;
  position: number | null;
  total: number;
  review?: boolean;
  onAck: () => void;
  /** Mot nul ? On retire une nouvelle paire (absent en relecture) */
  onReroll?: () => void;
}) {
  // L'Intrus NE SAIT PAS qu'il l'est : civils et Intrus voient juste leur mot
  // (aucune mention « Civil »). Le Fantôme et le Bouffon connaissent leur rôle
  // (ils ont un objectif spécial).
  const t = useT(UC_STR);
  const isMrWhite = player.role === "mrwhite";
  const isJester = player.role === "jester";
  const displayRole: Role = isMrWhite ? "mrwhite" : isJester ? "jester" : "civil";
  const color = isMrWhite || isJester ? ROLE_COLOR[displayRole] : "#FFD23F";
  const label = isMrWhite || isJester ? t.role[displayRole] : t.topSecret;
  const hint = isMrWhite ? t.hintGhost : isJester ? t.hintJester : t.hintCivil;

  const blobColor: MascotColor = isMrWhite ? "white" : isJester ? "lavender" : "mint";
  const blobMood: MascotMood = isMrWhite ? "thinking" : isJester ? "laughing" : "happy";

  return (
    <LocalShell tone={isMrWhite ? "gold" : "civ"}>
      <NavBar
        sub={review ? t.reminderSub : t.playerSub(player.name)}
        title={t.secretWordTitle}
        right={<Tag color={color}>{label}</Tag>}
      />

      <div style={{ display: "flex", justifyContent: "center", marginBottom: -10 }}>
        <Mascot color={blobColor} size={64} mood={blobMood} arms shadow={false} />
      </div>

      <DossierCard word={player.word} role={displayRole} hint={hint} round={round} lang={lang} />

      {position !== null && (
        <div style={{
          padding: "10px 14px", borderRadius: 16, background: ZZ.pink, color: ZZ.ink,
          border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`,
          display: "flex", gap: 10, alignItems: "center", marginBottom: 14,
        }}>
          <Lock size={18} strokeWidth={2.8} aria-hidden />
          <div style={{ fontSize: 15, fontWeight: 700, flex: 1, minWidth: 0, textWrap: "balance" }}>
            {t.nobodyElse}
          </div>
          {/* Compteur à part : jamais seul sur une ligne */}
          <span style={{ ...DISPLAY, fontSize: 17, whiteSpace: "nowrap", flexShrink: 0 }}>{position}/{total}</span>
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" onClick={onAck}>
          {review ? t.hideAndBack : <>{t.memorizedNext} <GameInlineIcon icon={ArrowRight} /></>}
        </Btn>
        {onReroll && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <RerollButton label={t.rerollWord} onClick={onReroll} />
          </div>
        )}
      </div>
    </LocalShell>
  );
}

// — TABLE (ordre de parole)
function TableScreen({
  players, order, round, onReviewWord, onForceVote,
}: {
  players: LocalPlayer[];
  order: number[];
  round: number;
  onReviewWord: () => void;
  onForceVote: () => void;
}) {
  const t = useT(UC_STR);
  const alive = players.filter((p) => !p.isEliminated);
  const dead = players.filter((p) => p.isEliminated);
  const orderedAlive = order.map((idx) => players[idx]).filter(Boolean) as LocalPlayer[];
  const rows: { p: LocalPlayer; n: number | null; dead: boolean }[] = [
    ...orderedAlive.map((p, i) => ({ p, n: i + 1, dead: false })),
    ...dead.map((p) => ({ p, n: null, dead: true })),
  ];

  return (
    <LocalShell tone="noir">
      <NavBar sub={t.roundN(round)} title={t.tableTitle} right={<Tag color="#3DDC97">{t.aliveN(alive.length)}</Tag>} />
      <Mono style={{ marginBottom: 14 }}>{t.tableHelp}</Mono>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.map(({ p, n, dead: d }) => (
          <div key={p.idx} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "6px 12px", borderRadius: 18,
            background: d ? "transparent" : n === 1 ? ZZ.yellow : "#fff", color: d ? "rgba(255,255,255,0.75)" : ZZ.ink,
            border: d ? "2.5px dashed rgba(255,255,255,0.4)" : `3px solid ${ZZ.ink}`,
            boxShadow: d ? undefined : `0 4px 0 ${ZZ.ink}`,
            rotate: d ? undefined : `${(n ?? 0) % 2 ? -0.8 : 0.8}deg`,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 999, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              ...DISPLAY, fontSize: 17, background: d ? "transparent" : ZZ.ink, color: d ? "#FF3EA5" : "#fff",
            }}>{d ? "✕" : n}</span>
            <PlayerBlob name={p.name} colorIndex={p.idx} size={40} mood={d ? "dead" : "happy"} bob={false} />
            <span style={{ flex: 1, ...DISPLAY, fontSize: 20, textDecoration: d ? "line-through" : "none" }}>{p.name}</span>
            {n === 1 && <span style={{ fontSize: 13, fontWeight: 800 }}>{t.starts}</span>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, paddingTop: 18 }}>
        <Btn tone="ghost" icon={<Eye size={19} strokeWidth={2.6} aria-hidden />} onClick={onReviewWord}>{t.reviewMyWord}</Btn>
        <Btn tone="danger" icon={<Scale size={19} strokeWidth={2.6} aria-hidden />} onClick={onForceVote}>{t.goVote}</Btn>
      </div>
    </LocalShell>
  );
}

// — REVIEW PICK (qui veut revoir son mot ?)
function ReviewPick({
  players, onPick, onCancel,
}: {
  players: LocalPlayer[];
  onPick: (idx: number) => void;
  onCancel: () => void;
}) {
  const t = useT(UC_STR);
  const alive = players.filter((p) => !p.isEliminated);
  return (
    <LocalShell tone="noir">
      <NavBar sub={t.shortMemory} title={t.whoReviews} onBack={onCancel} right={<Tag color="#FF3EA5">{t.confidential}</Tag>} />

      <div style={{
        padding: "10px 14px", borderRadius: 16, background: ZZ.pink, color: ZZ.ink,
        border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`,
        fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginBottom: 16,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <TriangleAlert size={20} strokeWidth={2.8} style={{ flexShrink: 0 }} aria-hidden />
        <div>{t.pickBlobThen} <strong>{t.nobodyElseStrong}</strong></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {alive.map((p) => (
          <button key={p.idx} onClick={() => onPick(p.idx)} className="transition-[translate,box-shadow] shadow-[0_4px_0_#15082E] active:translate-y-[3px] active:shadow-[0_1px_0_#15082E]" style={{
            padding: "14px 10px 12px", borderRadius: 22,
            background: "#fff", border: `3px solid ${ZZ.ink}`,
            cursor: "pointer", color: ZZ.ink, textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            fontFamily: "inherit",
          }}>
            <PlayerBlob name={p.name} colorIndex={p.idx} size={56} mood="neutral" bob={false} />
            <div style={{ ...DISPLAY, fontSize: p.name.length > 13 ? 15 : p.name.length > 10 ? 17 : 20, lineHeight: 1.05, overflowWrap: "anywhere" }}>{p.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6B5C88" }}>{t.tapToReview}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="ghost" onClick={onCancel} icon={<ArrowLeft size={19} strokeWidth={2.6} aria-hidden />}>{t.backToTable}</Btn>
      </div>
    </LocalShell>
  );
}

// — VOTE
function GroupVoteScreen({
  players, round, onEliminate, onCancel,
}: {
  players: LocalPlayer[];
  round: number;
  onEliminate: (id: number) => void;
  onCancel: () => void;
}) {
  const t = useT(UC_STR);
  const [picked, setPicked] = useState<number | null>(null);
  const alive = players.filter((p) => !p.isEliminated);

  return (
    <LocalShell tone="danger">
      <NavBar
        sub={t.voteSub(round)}
        title={t.whoEliminate}
        onBack={onCancel}
        right={<Tag color="#FF3EA5">{t.aliveN(alive.length)}</Tag>}
      />

      <Mono style={{ marginBottom: 14 }}>{t.voteHelp}</Mono>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {alive.map((p) => {
          const isPicked = picked === p.idx;
          return (
            <button key={p.idx} onClick={() => setPicked(p.idx)}
              style={{
                position: "relative", padding: "14px 10px 12px", borderRadius: 22,
                background: isPicked ? ZZ.pink : "#fff", border: `3px solid ${ZZ.ink}`,
                boxShadow: `0 ${isPicked ? 6 : 4}px 0 ${ZZ.ink}`,
                transform: isPicked ? "scale(1.04) rotate(-2deg)" : "scale(1)", transition: "transform 150ms",
                color: ZZ.ink, textAlign: "center", fontFamily: "inherit", cursor: "pointer",
              }}>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                <PlayerBlob name={p.name} colorIndex={p.idx} size={64} mood={isPicked ? "shocked" : "shifty"} arms bob={false} />
              </div>
              <div style={{ ...DISPLAY, fontSize: p.name.length > 13 ? 15 : p.name.length > 10 ? 17 : 21, marginTop: 8, lineHeight: 1.05, overflowWrap: "anywhere", minHeight: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.name}</div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: isPicked ? ZZ.ink : "#6B5C88" }}>
                {isPicked ? t.suspectPicked : t.tapToPick}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="danger" disabled={picked === null} onClick={() => picked !== null && onEliminate(picked)}
          sub={picked !== null ? players[picked]?.name : undefined}>
          {t.eliminatePlayer}
        </Btn>
      </div>
    </LocalShell>
  );
}

// — ELIMINATE
function EliminateScreen({
  eliminated, round, civilWord, onNext,
}: {
  eliminated: LocalPlayer | null;
  round: number;
  civilWord: string;
  onNext: () => void;
}) {
    // On révèle le RÔLE à l'élimination, mais jamais le mot.
    void civilWord;
    const t = useT(UC_STR);
    const role = eliminated?.role ?? null;
    const color = role ? ROLE_COLOR[role] : "#FFD23F";
    const isImpostor = role === "undercover" || role === "mrwhite";

  return (
    <LocalShell tone="danger">
      <NavBar
        sub={t.verdictSub(round)}
        title={eliminated ? (isImpostor ? t.unmasked : t.innocent) : t.nobodyOut}
        right={<Tag color={color}>{role ? t.role[role] : t.vote}</Tag>}
      />

      {eliminated ? (
        <>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px" }}>
            <div style={{ position: "relative", animation: "uc-die 1.1s cubic-bezier(0.34,1.45,0.64,1) both" }}>
              <SpyMascotById name={eliminated.name} idx={eliminated.idx} size={160} tilt={-4} mood="dead" />
              <div style={{ position: "absolute", top: -34, right: -56, zIndex: 5, animation: "uc-die 0.5s ease-out 0.9s both" }}>
                <Stamp text={t.stampEliminated} color={color} rotate={-12} size={20} />
              </div>
            </div>
            {/* Prénom long : la taille baisse pour rester sur une ligne */}
            <div style={{ ...DISPLAY, fontSize: `min(46px, 11vw, ${(120 / Math.max(1, eliminated.name.length)).toFixed(1)}vw)`, lineHeight: 1, marginTop: 14, textAlign: "center", overflowWrap: "anywhere" }}>{eliminated.name}</div>
          </div>

          <div style={{
            padding: "14px 18px", borderRadius: 24, background: color, color: ZZ.ink,
            border: `3px solid ${ZZ.ink}`, boxShadow: `0 5px 0 ${ZZ.ink}`, rotate: "-1.5deg",
            textAlign: "center", marginBottom: 16,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t.itWas}</div>
            <div style={{ ...DISPLAY, fontSize: 34, marginTop: 2 }}>{role ? t.roleArticle[role] : "—"}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{role === "mrwhite" ? t.hadNoWord : t.wordStaysSecret}</div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
          {t.noMajority}
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <Btn tone="primary" onClick={onNext}>{t.continueBtn}</Btn>
      </div>
    </LocalShell>
  );
}

// — MR WHITE GUESS
function MrWhiteGuess({ player, onSubmit }: { player: LocalPlayer; onSubmit: (g: string) => void }) {
  const t = useT(UC_STR);
  const [text, setText] = useState("");
  return (
    <LocalShell tone="gold">
      <NavBar sub={t.twistOfFate} title={t.ghostGuesses} right={<Tag color="#FFD23F">{t.lastChance}</Tag>} />

      <div style={{
        padding: 18, borderRadius: 24, background: ZZ.yellow, color: ZZ.ink,
        border: `3px solid ${ZZ.ink}`, boxShadow: `0 5px 0 ${ZZ.ink}`, rotate: "-1deg",
        marginBottom: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <PlayerBlob name={player.name} colorIndex={player.idx} size={68} mood="thinking" arms />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t.ghostEliminated}</div>
            <div style={{ ...DISPLAY, fontSize: player.name.length > 12 ? 21 : 28, marginTop: 2, lineHeight: 1.05, overflowWrap: "anywhere" }}>{player.name}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>
          <GameInlineIcon icon={Target} /> {t.ghostGuessHelp}
        </div>
      </div>

      <div style={{
        display: "flex", gap: 8, padding: 6, borderRadius: 20,
        background: "#fff", border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`,
        marginBottom: 12,
      }}>
        <input autoFocus value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && onSubmit(text.trim())}
          placeholder={t.guessPlaceholder}
          autoCorrect="off" autoCapitalize="off" spellCheck={false}
          style={{
            flex: 1, background: "transparent", border: "none", color: ZZ.ink,
            fontSize: 22, padding: 10, outline: "none", ...DISPLAY, letterSpacing: "-0.01em", minWidth: 0,
          }} />
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" disabled={!text.trim()} onClick={() => text.trim() && onSubmit(text.trim())} icon={<Dices size={20} strokeWidth={2.6} aria-hidden />}>
          {t.bet}
        </Btn>
      </div>
    </LocalShell>
  );
}

// — GAME OVER
function GameOverScreen({
  players, endReason, civilWord, ucWord, mrWhiteGuess, mrWhiteRight, onReplay, onLobby,
}: {
  players: LocalPlayer[];
  endReason: EndReason;
  civilWord: string;
  ucWord: string;
  mrWhiteGuess: string | null;
  mrWhiteRight: boolean | null;
  onReplay: () => void;
  onLobby?: () => void;
}) {
  const t = useT(UC_STR);
  const nudge = useNudgeText();
  const [titleTop, titleBottom] =
    endReason === "civils-win" ? t.winTitle.civils :
    endReason === "undercover-wins" ? (players.filter((p) => p.role === "undercover" || p.role === "mrwhite").length > 1 ? t.winTitle.impostors : t.winTitle.impostor) :
    endReason === "jester-wins" ? t.winTitle.jester :
    t.winTitle.ghost;
  const accent =
    endReason === "civils-win" ? "#3DDC97" :
    endReason === "undercover-wins" ? "#FF3EA5" :
    endReason === "jester-wins" ? "#C58CFF" : "#FFD23F";

  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const winners = sorted.filter((p) => {
    if (endReason === "civils-win") return p.role === "civil";
    if (endReason === "undercover-wins") return p.role === "undercover" || p.role === "mrwhite";
    if (endReason === "jester-wins") return p.role === "jester";
    return p.role === "mrwhite";
  });

  return (
    <LocalShell tone="civ">
      <Confetti accent={accent} count={50} />

      <NavBar sub={t.endSub} title="" right={<Tag color={accent}>{t.victory}</Tag>} />

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h1 style={{ ...DISPLAY, fontSize: "clamp(36px, 12vw, 50px)", margin: 0, lineHeight: 0.95 }}>
          <span style={{ color: accent }}>{titleTop}</span>
          <br/>{titleBottom}
        </h1>
      </div>

      <div style={{ position: "relative", height: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 14 }}>
        {winners[1] && <div style={{ position: "absolute", left: "12%", bottom: 0 }}><SpyMascotById name={winners[1].name} idx={winners[1].idx} size={72} tilt={-8} mood="happy" arms delay={0.2} /></div>}
        {winners[2] && <div style={{ position: "absolute", right: "12%", bottom: 0 }}><SpyMascotById name={winners[2].name} idx={winners[2].idx} size={68} tilt={6} mood="wink" arms delay={0.3} /></div>}
        {winners[0] && <div style={{ position: "relative", zIndex: 2 }}><SpyMascotById name={winners[0].name} idx={winners[0].idx} size={130} tilt={-2} mood="happy" cheering arms crown /></div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ padding: "10px 12px", borderRadius: 20, background: ZZ.mint, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`, rotate: "-1.5deg" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{t.civilWord}</div>
          <div style={{ ...DISPLAY, fontSize: 22, lineHeight: 1.05, textWrap: "balance", ...WORD_WRAP }}>{civilWord}</div>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 20, background: ZZ.pink, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`, rotate: "1.5deg", textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{t.impostorWord}</div>
          <div style={{ ...DISPLAY, fontSize: 22, lineHeight: 1.05, textWrap: "balance", ...WORD_WRAP }}>{ucWord}</div>
        </div>
      </div>

      {mrWhiteGuess !== null && (
        <div style={{
          padding: "10px 14px", borderRadius: 16,
          background: "#fff", color: ZZ.ink, border: `2.5px solid ${ZZ.ink}`,
          fontSize: 15, fontWeight: 600, marginBottom: 14, lineHeight: 1.4,
        }}>
          {t.ghostTried} <strong>{mrWhiteGuess}</strong> {mrWhiteRight ? t.betWon : t.betLost}
        </div>
      )}

      <div style={{ ...DISPLAY, fontSize: 28, marginBottom: 10 }}>{t.ranking}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {sorted.map((p, i) => {
          const win = winners.includes(p);
          const rc = ROLE_COLOR[p.role];
          return (
            <div key={p.idx} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 12px 6px 8px", borderRadius: 18,
              background: i === 0 ? ZZ.yellow : "#fff", color: ZZ.ink,
              border: `3px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`,
            }}>
              <span style={{ width: 22, ...DISPLAY, fontSize: 17 }}>{i + 1}</span>
              <PlayerBlob name={p.name} colorIndex={p.idx} size={28} mood={win ? "wink" : "dead"} bob={false} />
              <span style={{ flex: 1, minWidth: 0, ...DISPLAY, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{
                fontSize: 13, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0,
                background: rc, color: ZZ.ink, border: `2px solid ${ZZ.ink}`, fontWeight: 800,
              }}>{t.role[p.role]}</span>
              <span style={{ ...DISPLAY, fontSize: 20, width: 40, textAlign: "right", flexShrink: 0 }}>{p.score}</span>
              <SoireeGain name={p.name} />
            </div>
          );
        })}
      </div>

      {/* Version découverte : petite bannière Zinzin+ (rien si abonné / site web) */}
      <PremiumNudge text={nudge.undercover(fmtCount(allWordPairs(getLang()).length - freePairs(getLang()).length))} style={{ marginBottom: 18 }} />

      <div style={{ marginTop: "auto" }}>
        {/* Une seule action principale (Jeu suivant en Soirée, sinon Revanche), le reste en pastilles */}
        <SoireeNextButton className="mb-3" />
        <EndReplay onClick={onReplay} label={t.rematch}>
          <Btn tone="gold" onClick={onReplay} icon={<RotateCcw size={20} strokeWidth={2.8} aria-hidden />} sub={t.rematchSub}>{t.rematch}</Btn>
        </EndReplay>
        <EndPills className="mt-4"><IdeaButton short game={t.gameName} kind="mot" bg="#fff" /></EndPills>
        <EndHomeLink onClick={onLobby} color="rgba(255,255,255,0.9)" className="mt-2">{t.backHome}</EndHomeLink>
      </div>
    </LocalShell>
  );
}

// ═════════════════════════════════════════════════════════════
//  PRIMITIVES (locales — dupliquées de undercover-online.tsx
//  pour éviter une dépendance croisée. Si tu refactores, sors
//  vers un fichier undercover-ui.tsx commun.)
// ═════════════════════════════════════════════════════════════
type Tone = "noir" | "danger" | "civ" | "gold";

function LocalShell({ tone = "noir", children }: { tone?: Tone; children: ReactNode }) {
  // Fonds pleins (DA sticker) : violet nuit, ou la couleur du moment
  const bg: Record<Tone, string> = { noir: ZZ.night, danger: "#3A0E5C", civ: ZZ.night, gold: "#2B1A6E" };
  const offline = isOfflineApp();
  return (
    <div className="relative w-full shrink-0" style={{
      minHeight: "100dvh", color: "white",
      fontFamily: "var(--font-body, 'DM Sans'), system-ui, sans-serif",
      background: zBackground(bg[tone]), position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes uc-pulse { 0% { transform: scale(0.95); opacity: 0.7; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes uc-confetti { 0% { transform: translateY(-30px) rotate(0); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 1; } }
        @keyframes uc-die {
          0%   { transform: translateY(-26px) scale(1.12) rotate(0deg); opacity: 0; filter: none; }
          22%  { transform: translateY(0) scale(1) rotate(-9deg); opacity: 1; }
          40%  { transform: translateY(0) rotate(9deg); }
          55%  { transform: rotate(-7deg); }
          70%  { transform: rotate(5deg); }
          100% { transform: translateY(8px) rotate(-14deg); filter: grayscale(0.55) brightness(0.85); }
        }
      `}</style>
      {offline && <GameTopRight><SoundButton /></GameTopRight>}
      <div style={{ position: "relative", zIndex: 1, padding: `calc(env(safe-area-inset-top, 0px) + ${offline ? 72 : 18}px) 20px calc(env(safe-area-inset-bottom, 0px) + 24px)`, maxWidth: 460, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ children, color = "#FFD23F", style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <ZChip bg={color} tilt={3} style={{ flexShrink: 0, ...style }}>{children}</ZChip>;
}

function NavBar({ sub, title, right, onBack }: { sub?: string; title?: string; right?: ReactNode; onBack?: () => void }) {
  const t = useT(UC_STR);
  return (
    // Sur le site, le coin haut-droit reste à l'engrenage du shell
    // Grille : le titre passe SOUS le tag de droite (pleine largeur) → plus de « Qui » seul sur sa ligne
    <div style={{
      display: "grid", gridTemplateColumns: onBack ? "auto minmax(0,1fr) auto" : "minmax(0,1fr) auto",
      columnGap: 12, alignItems: "center", marginBottom: 18, paddingRight: isOfflineApp() ? 0 : 52,
    }}>
      {onBack && <div style={{ gridRow: title ? "1 / span 2" : "1" }}><GameIconButton icon={ArrowLeft} label={t.back} onClick={onBack} /></div>}
      <div style={{ minWidth: 0 }}>
        {sub && <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </div>
      <div style={{ justifySelf: "end" }}>{right}</div>
      {title && <div style={{ ...DISPLAY, gridColumn: onBack ? "2 / span 2" : "1 / span 2", fontSize: 34, color: "white", marginTop: 2, lineHeight: 0.98, textWrap: "balance" }}>{title}</div>}
    </div>
  );
}

type BtnTone = "primary" | "danger" | "gold" | "ghost" | "mint";
function Btn({ children, tone = "primary", disabled = false, onClick, full = true, icon, sub, style = {} }: {
  children: ReactNode; tone?: BtnTone; disabled?: boolean; onClick?: () => void;
  full?: boolean; icon?: ReactNode; sub?: string; style?: CSSProperties;
}) {
  const tones: Record<BtnTone, string> = { primary: ZZ.violet, danger: ZZ.pink, gold: ZZ.yellow, ghost: "#fff", mint: ZZ.mint };
  return (
    <ZButton bg={tones[tone]} onClick={onClick} disabled={disabled} size={full ? "lg" : "md"} style={{ width: full ? "100%" : "auto", ...style }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      <span style={{ display: "flex", flexDirection: "column", alignItems: sub ? "flex-start" : "center" }}>
        <span>{children}</span>
        {sub && <span style={{ fontFamily: "var(--font-body, 'DM Sans'), system-ui", fontSize: 13, fontWeight: 700, letterSpacing: 0, wordSpacing: "normal", marginTop: 1 }}>{sub}</span>}
      </span>
    </ZButton>
  );
}

function SpyMascotById({ name, idx, size = 80, mood = "sus", cheering = false, crown = false, arms = false, delay = 0 }: {
  name?: string; idx: number; size?: number; tilt?: number; mood?: MascotMood; cheering?: boolean; crown?: boolean; arms?: boolean; delay?: number;
}) {
  // Perso personnalisé : tel quel ; sans perso : son perso de base avec les lunettes d'espion
  // (éliminé = yeux/bouche « dead », les lunettes tombent)
  return <PlayerBlob name={name} colorIndex={idx} size={size} mood={mood} cheering={cheering} crown={crown} arms={arms} delay={delay} fallbackLook={SPY_LOOK} />;
}
const SPY_LOOK = { face: "shades" } as const;

function Stamp({ text, color = "#FF3EA5", rotate = -10, size = 18 }: { text: string; color?: string; rotate?: number; size?: number }) {
  return (
    <div style={{
      display: "inline-block", padding: `${size * 0.3}px ${size * 0.7}px`,
      background: color, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`,
      ...DISPLAY, fontSize: size, transform: `rotate(${rotate}deg)`, borderRadius: 999, whiteSpace: "nowrap",
    }}>{text}</div>
  );
}

function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", fontWeight: 700, ...style }}>{children}</span>;
}

function FileCard({ children, accent = "#FFD23F", style }: { children: ReactNode; accent?: string; style?: CSSProperties }) {
  void accent;
  return (
    <div style={{ position: "relative", background: ZZ.violet, color: "#fff", border: `3px solid ${ZZ.ink}`, boxShadow: `0 5px 0 ${ZZ.ink}`, borderRadius: 24, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function Stat({ n, label, color, sub }: { n: number; label: string; color: string; sub?: string }) {
  return (
    <div style={{ padding: "8px 4px", borderRadius: 16, background: color, color: ZZ.ink, border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`, textAlign: "center" }}>
      <div style={{ ...DISPLAY, fontSize: 28, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "2px dashed rgba(255,255,255,0.3)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...DISPLAY, fontSize: 19, color: "white" }}>{label}</div>
        {hint && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2, fontWeight: 600, textWrap: "pretty" }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange, disabled }: { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const t = useT(UC_STR);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <GameIconButton icon={Minus} label={t.lessOne} bg="#fff" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} />
      <span style={{ width: 24, textAlign: "center", ...DISPLAY, fontSize: 24 }}>{value}</span>
      {/* Désactivé : blanc (le jaune à 50 % vire au marron sur le violet) */}
      <GameIconButton icon={Plus} label={t.moreOne} bg={disabled || value >= max ? "#fff" : ZZ.yellow} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} />
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => { playSfx("toggle", { volume: 0.5 }); onChange(!value); }} aria-pressed={value} style={{
      minWidth: 64, height: 44, padding: 0, border: "none", background: "transparent", flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "flex-end",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    }}>
      <span style={{ width: 58, height: 34, borderRadius: 99, background: value ? ZZ.mint : "#fff", border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`, position: "relative", transition: "background .15s", display: "block" }}>
        <span style={{ position: "absolute", top: 3, left: value ? 27 : 3, width: 23, height: 23, borderRadius: "50%", background: ZZ.ink, transition: "left .15s" }} />
      </span>
    </button>
  );
}

function DossierCard({ word, role, hint, round, lang }: { word: string | null; role: Role; hint: string; round: number; lang: Lang }) {
  const t = useT(UC_STR);
  // Le tampon ne dit jamais « Civil » : l'Intrus ne doit pas savoir qui il est.
  const special = role === "mrwhite" || role === "jester";
  const color = special ? ROLE_COLOR[role] : "#FF3EA5";
  const label = special ? t.role[role] : t.stampSecret;
  return (
    <div style={{
      position: "relative", padding: "20px 20px 18px", borderRadius: 26,
      background: ZZ.cream, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 6px 0 ${ZZ.ink}`,
      transform: "rotate(-1.5deg)", margin: "16px 4px",
    }}>
      <div style={{ position: "absolute", top: -18, right: 14 }}>
        <Stamp text={label} color={color} rotate={6} size={15} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 800 }}>
        {role === "mrwhite" ? t.noWord : t.yourSecretWord} <span style={{ fontWeight: 600, color: "#6B5C88" }}>{t.roundSuffix(round)}</span>
      </div>
      <div lang={lang} style={{
        ...DISPLAY, fontSize: word ? wordFontSize(word) : 44, lineHeight: 1.02, margin: "8px 0 6px",
        textAlign: role === "mrwhite" ? "center" : "left", opacity: role === "mrwhite" ? 0.4 : 1, ...WORD_WRAP,
      }}>{word ?? "?????"}</div>
      <div style={{ marginTop: 10, paddingTop: 12, borderTop: `2px dashed rgba(21,8,46,0.25)`, fontSize: 15, fontWeight: 600, color: "#3A2A56", lineHeight: 1.4, textWrap: "pretty" }}>{hint}</div>
    </div>
  );
}

function Confetti({ count = 40, accent = "#FFD23F" }: { count?: number; accent?: string }) {
  const pieces = useMemo(() => {
    const colors = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4", "#7A4EE8", "#FF6B5B", accent];
    return Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 2.5,
      duration: 2.6 + Math.random() * 1.8,
      color: colors[i % colors.length],
      rot: Math.floor(Math.random() * 360),
      w: 6 + Math.floor(Math.random() * 6),
    }));
  }, [count, accent]);
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: "absolute", top: -20, left: `${p.left}%`,
          width: p.w, height: p.w * 1.4,
          background: p.color, borderRadius: 2,
          transform: `rotate(${p.rot}deg)`,
          animation: `uc-confetti ${p.duration}s ${p.delay}s linear infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Maquette 03 — "Qui joue ?" + grille LES SUSPECTS (remplace le PlayersSetup générique) ──
function PassScreenUC({ toName, colorIdx, label, players, currentIdx, buttonLabel, buttonSub, tag, onReady }: {
  toName: string; colorIdx: number; label: string;
  players?: LocalPlayer[]; currentIdx?: number;
  buttonLabel: ReactNode; buttonSub?: string; tag?: string; onReady: () => void;
}) {
  const t = useT(UC_STR);
  return (
    <LocalShell tone="noir">
      <NavBar sub={label} right={<Tag color="#3DDC97">{tag ?? t.rolesReady}</Tag>} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
        <div style={{ position: "relative" }}>
          <PlayerBlob name={toName} colorIndex={colorIdx} size={110} mood="wink" arms />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>{t.passPhoneTo}</div>
        <div style={{ ...DISPLAY, fontSize: `clamp(32px, ${Math.min(14, 110 / Math.max(1, toName.length)).toFixed(1)}vw, 54px)`, lineHeight: 1.05, textAlign: "center", overflowWrap: "anywhere", maxWidth: "100%", padding: "8px 22px 10px", borderRadius: 24, background: MASCOT_PALETTE[MASCOT_COLORS[colorIdx % MASCOT_COLORS.length]].body, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 6px 0 ${ZZ.ink}`, rotate: "-2deg" }}>{toName}</div>
      </div>

      {players && (
        <div style={{ marginTop: 22 }}>
          <Mono style={{ marginBottom: 8, display: "block", textAlign: "center" }}>{t.whoSawWord}</Mono>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {players.map((p) => {
              const active = p.idx === currentIdx;
              return (
                <div key={p.idx} style={{ textAlign: "center", opacity: active ? 1 : 0.45, width: 52 }}>
                  {/* Anneau parfaitement rond, blob centré dedans */}
                  <div style={{
                    width: 46, height: 46, margin: "0 auto", borderRadius: "50%", display: "grid", placeItems: "center",
                    border: active ? `3px solid ${ZZ.yellow}` : "3px solid transparent", boxSizing: "border-box",
                  }}>
                    <PlayerBlob name={p.name} colorIndex={p.idx} size={32} mood="happy" bob={false} style={{ display: "block" }} />
                  </div>
                  <div style={{ fontSize: 13, marginTop: 3, color: active ? "#FFD23F" : "rgba(255,255,255,0.85)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 24 }}>
        <Btn tone="gold" sub={buttonSub} onClick={onReady}>{buttonLabel}</Btn>
      </div>
    </LocalShell>
  );
}

// Règles visibles avant la distribution (repliables).
function RulesCard({ jester, onTuto }: { jester: boolean; onTuto: () => void }) {
  const t = useT(UC_STR);
  const [open, setOpen] = useState(false);
  const items = [...t.rulesItems, ...(jester ? [t.ruleJester] : [])];
  return (
    <FileCard accent="#4ECDC4" style={{ marginBottom: 14 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", minHeight: 44, display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "transparent", border: "none", color: "white", padding: 0, cursor: "pointer", fontFamily: "inherit",
      }}>
        <span style={{ ...DISPLAY, fontSize: 21 }}><GameInlineIcon icon={BookOpen} /> {t.rules}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{open ? t.hide : t.show} <GameInlineIcon icon={open ? ChevronUp : ChevronDown} /></span>
      </button>
      {open && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "#fff" }}>
          {items.map((it) => <li key={it}>{it}</li>)}
        </ul>
      )}
      {open && <TutoAgainButton onClick={onTuto} className="mt-2" />}
    </FileCard>
  );
}
