"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Mascot, MASCOT_COLORS, type MascotColor, type MascotMood } from "@/components/Mascot";

/* ─────────────────────────────────────────────────────────────
   UNDERCOVER LOCAL — Pass-and-play (un seul téléphone)
   Toute la logique de jeu tourne dans le composant.
   Aucune dépendance serveur / PartyKit.
   ───────────────────────────────────────────────────────────── */

// ═════════════════════════════════════════════════════════════
//  Modèle de données
// ═════════════════════════════════════════════════════════════
type Role = "civil" | "undercover" | "mrwhite";

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

type EndReason = "civils-win" | "undercover-wins" | "mrwhite-wins";

// ═════════════════════════════════════════════════════════════
//  Banque de mots (même contenu que le serveur)
// ═════════════════════════════════════════════════════════════
const WORD_PAIRS: [string, string][] = [
  ["Pizza", "Pâtes"], ["Hamburger", "Sandwich"], ["Sushi", "Maki"],
  ["Croissant", "Brioche"], ["Crêpe", "Galette"], ["Kebab", "Tacos"],
  ["Raclette", "Fondue"], ["Tiramisu", "Mousse au chocolat"], ["Café", "Thé"],
  ["Bière", "Vin"], ["Vodka", "Rhum"], ["Coca", "Pepsi"],
  ["Plage", "Piscine"], ["Montagne", "Colline"], ["Forêt", "Jungle"],
  ["Hôpital", "Pharmacie"], ["Cinéma", "Théâtre"], ["Bibliothèque", "Librairie"],
  ["Aéroport", "Gare"], ["Restaurant", "Cafétéria"], ["Hôtel", "Auberge"],
  ["Football", "Rugby"], ["Tennis", "Badminton"], ["Ski", "Snowboard"],
  ["Boxe", "Karaté"], ["Natation", "Plongée"], ["Cyclisme", "Course à pied"],
  ["Chien", "Chat"], ["Lion", "Tigre"], ["Aigle", "Faucon"],
  ["Dauphin", "Requin"], ["Vache", "Chèvre"], ["Cheval", "Âne"],
  ["Lapin", "Hamster"], ["Batman", "Superman"], ["Star Wars", "Star Trek"],
  ["Naruto", "One Piece"], ["Harry Potter", "Le Seigneur des Anneaux"],
  ["Titanic", "Avatar"], ["Mario", "Sonic"], ["Pokemon", "Digimon"],
  ["Voiture", "Moto"], ["Train", "Bus"], ["Avion", "Hélicoptère"],
  ["Téléphone", "Tablette"], ["Ordinateur", "Console"], ["Livre", "Magazine"],
  ["Stylo", "Crayon"], ["Lunettes", "Loupe"], ["Montre", "Bracelet"],
  ["Soleil", "Lune"], ["Pluie", "Neige"], ["Été", "Hiver"],
  ["Printemps", "Automne"], ["Mer", "Lac"], ["Volcan", "Geyser"],
  ["Mariage", "Anniversaire"], ["Noël", "Pâques"], ["Halloween", "Carnaval"],
  ["Festival", "Concert"], ["Médecin", "Infirmier"], ["Boulanger", "Pâtissier"],
  ["Avocat", "Juge"], ["Pompier", "Policier"], ["Pilote", "Astronaute"],
  ["Coiffeur", "Barbier"], ["Professeur", "Directeur"], ["Plombier", "Électricien"],
];

// ═════════════════════════════════════════════════════════════
//  Tokens (mirror online)
// ═════════════════════════════════════════════════════════════
const ROLE_COLOR: Record<Role, string> = { civil: "#3DDC97", undercover: "#FF3EA5", mrwhite: "#FFD23F" };
const ROLE_LABEL: Record<Role, string> = { civil: "Civil", undercover: "Undercover", mrwhite: "Mr. White" };

const colorByIdx = (idx: number): MascotColor => MASCOT_COLORS[idx % MASCOT_COLORS.length];

// ═════════════════════════════════════════════════════════════
//  Composant principal
// ═════════════════════════════════════════════════════════════
export default function UndercoverLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  // ── State global ────────────────────────────────────────
  const [phase, setPhase]           = useState<LocalPhase>("setup-players");
  const [players, setPlayers]       = useState<LocalPlayer[]>([]);
  const [round, setRound]           = useState(1);
  const [endReason, setEndReason]   = useState<EndReason | null>(null);

  // Pair de mots tirée pour la partie
  const [civilWord, setCivilWord]   = useState("");
  const [ucWord, setUcWord]         = useState("");

  // Config de rôles (configurée en setup-roles)
  const [ucCount, setUcCount]       = useState(1);
  const [mrWhite, setMrWhite]       = useState(false);

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

  // Mr. White guess
  const [mrWhiteGuess, setMrWhiteGuess] = useState<string | null>(null);
  const [mrWhiteRight, setMrWhiteRight] = useState<boolean | null>(null);

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
    setPhase("setup-roles");
  };

  // ── Distribution des rôles + mots ───────────────────────
  const distributeRoles = () => {
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
    setCivilWord(a); setUcWord(b);

    const ids = players.map((p) => p.idx);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);

    const newPlayers = [...players];
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
    for (; i < shuffled.length; i++) {
      const id = shuffled[i];
      newPlayers[id] = { ...newPlayers[id], role: "civil", word: a };
    }

    setPlayers(newPlayers);
    setRevealIdx(0);
    setPhase("pass-reveal");
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
    if (target.role === "mrwhite") setPhase("mrwhite-pass");
    else setPhase("eliminate");
  };

  // ── Phase mr-white guess ────────────────────────────────
  const submitMrWhiteGuess = (guess: string) => {
    setMrWhiteGuess(guess);
    const norm = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const right = norm(guess) === norm(civilWord);
    setMrWhiteRight(right);
    if (right) {
      // MW gagne seul
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
    const remCv = remain.filter((p) => p.role === "civil").length;

    // Civils gagnent
    if (remUC === 0 && remMW === 0) {
      setPlayers((ps) => ps.map((p) => (p.role === "civil" && !p.isEliminated) ? { ...p, score: p.score + 3 } : p));
      setEndReason("civils-win");
      setPhase("over");
      return;
    }
    // Imposteurs gagnent
    if (remUC + remMW >= remCv) {
      setPlayers((ps) => ps.map((p) =>
        (p.role !== "civil" && !p.isEliminated) ? { ...p, score: p.score + 5 } : p
      ));
      setEndReason("undercover-wins");
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
      <PlayersSetupUC onStart={handleStartNames} onBack={onReturnToLobby} />
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
        onStart={distributeRoles}
        onBack={() => setPhase("setup-players")}
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
        label={`${revealIdx + 1} / ${players.length} · Distribution`}
        players={players}
        currentIdx={p.idx}
        buttonLabel="🕶️ Voir mon rôle"
        buttonSub="Maintiens pour confirmer"
        onReady={() => setPhase("reveal")}
      />
    );
  }

  // 4. Reveal word
  if (phase === "reveal") {
    const p = players[revealIdx];
    return (
      <RevealScreen
        player={p}
        round={round}
        position={revealIdx + 1}
        total={players.length}
        onAck={ackReveal}
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
        label="Revoir le mot"
        tag="Privé"
        buttonLabel="🕶️ Voir mon rôle"
        onReady={() => setPhase("review-show")}
      />
    );
  }
  if (phase === "review-show") {
    const p = players[reviewIdx!];
    return (
      <RevealScreen
        player={p}
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

  // 9. Mr. White pass + guess
  if (phase === "mrwhite-pass") {
    const p = eliminatedIdx !== null ? players[eliminatedIdx] : null;
    if (!p) return null;
    return (
      <PassScreenUC
        toName={p.name}
        colorIdx={p.idx}
        label="Mr. White · dernière chance"
        tag="Bonus"
        buttonLabel="🎯 Tenter ma chance"
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
          // reset state, garder les noms
          setRound(1);
          setEndReason(null);
          setPlayers((ps) => ps.map((p) => ({ ...p, role: "civil", word: null, isEliminated: false, eliminatedRound: null, hasSpoken: false, score: 0 })));
          setEliminatedIdx(null);
          setMrWhiteGuess(null);
          setMrWhiteRight(null);
          setPhase("setup-roles");
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
  players, ucCount, setUcCount, mrWhite, setMrWhite, onStart, onBack,
}: {
  players: LocalPlayer[];
  ucCount: number; setUcCount: (v: number) => void;
  mrWhite: boolean; setMrWhite: (v: boolean) => void;
  onStart: () => void; onBack: () => void;
}) {
  const total = players.length;
  // Les civils doivent rester majoritaires : (Undercover + Mr.White) < civils.
  const impostorCap = Math.floor((total - 1) / 2); // nb max d'imposteurs au total
  const canMrWhite = impostorCap >= 2;             // Mr.White à partir de 5 joueurs
  const mwSlots = mrWhite && canMrWhite ? 1 : 0;
  const maxUC = Math.max(1, Math.min(3, impostorCap - mwSlots));
  const ucEff = Math.min(Math.max(1, ucCount), maxUC);
  const civils = total - ucEff - mwSlots;
  const valid = ucEff >= 1 && civils > ucEff + mwSlots;
  const toggleMrWhite = (v: boolean) => {
    const nv = v && canMrWhite;
    if (nv) {
      const cap = Math.max(1, Math.min(3, impostorCap - 1));
      if (ucCount > cap) setUcCount(cap);
    }
    setMrWhite(nv);
  };

  return (
    <LocalShell tone="noir">
      <NavBar sub={`Étape 2 · ${total} joueurs`} title="Composition" onBack={onBack} right={<Tag color="#FF3EA5">RÔLES</Tag>} />

      <FileCard accent="#FF3EA5" style={{ marginBottom: 14 }}>
        <Mono style={{ marginBottom: 12 }}>La table · {total} joueurs</Mono>

        {/* Visualisation : un blob par rôle */}
        <div style={{
          padding: "16px 12px", borderRadius: 14,
          background: "rgba(0,0,0,0.3)", border: "1px dashed rgba(255,255,255,0.10)",
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
          <Stat n={civils} label="Civils" color="#3DDC97" sub="même mot" />
          <Stat n={ucEff} label="Undercover" color="#FF3EA5" sub="mot voisin" />
          <Stat n={mwSlots} label="Mr. White" color="#FFD23F" sub="aucun mot" />
        </div>

        <Row label="Undercover" hint={`1 à ${maxUC}`}>
          <Stepper value={ucEff} min={1} max={maxUC} onChange={setUcCount} />
        </Row>
        <Row label="Mr. White" hint={canMrWhite ? "bonus chaos" : "5 joueurs min"}>
          <Toggle value={mwSlots > 0} onChange={toggleMrWhite} />
        </Row>
      </FileCard>

      <div style={{
        padding: "10px 14px", borderRadius: 12,
        background: "rgba(255,210,63,0.08)",
        border: "1px dashed rgba(255,210,63,0.30)",
        fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.4,
        display: "flex", gap: 10, alignItems: "center",
        marginBottom: 14,
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div>Les rôles vont être attribués au hasard. Chacun verra son mot sur ce téléphone, à son tour.</div>
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" disabled={!valid} onClick={onStart} icon={<span style={{ fontSize: 18 }}>🎲</span>}>
          Distribuer les rôles
        </Btn>
      </div>
    </LocalShell>
  );
}

// — REVEAL (carte dossier)
function RevealScreen({
  player, round, position, total, review = false, onAck,
}: {
  player: LocalPlayer;
  round: number;
  position: number | null;
  total: number;
  review?: boolean;
  onAck: () => void;
}) {
  // L'undercover NE SAIT PAS qu'il l'est : civil + undercover voient "Civil".
  // Seul Mr. White sait qu'il n'a pas de mot.
  const isMrWhite = player.role === "mrwhite";
  const displayRole: Role = isMrWhite ? "mrwhite" : "civil";
  const color = ROLE_COLOR[displayRole];
  const label = ROLE_LABEL[displayRole];
  const hint = isMrWhite
    ? "Aucun mot. Bluff. Si tu es éliminé, devine le mot des civils pour gagner seul."
    : "Mémorise ton mot. Donne un indice clair, mais pas trop évident.";

  const blobColor: MascotColor = isMrWhite ? "white" : "mint";
  const blobMood: MascotMood = isMrWhite ? "thinking" : "happy";

  return (
    <LocalShell tone={isMrWhite ? "gold" : "civ"}>
      <NavBar
        sub={review ? "Rappel · ne pas montrer" : `Joueur · ${player.name}`}
        title="Mot secret"
        right={<Tag color={color}>{label.toUpperCase()}</Tag>}
      />

      <div style={{ display: "flex", justifyContent: "center", marginBottom: -10 }}>
        <Mascot color={blobColor} size={88} mood={blobMood} arms />
      </div>

      <DossierCard word={player.word} role={displayRole} hint={hint} round={round} />

      {position !== null && (
        <div style={{
          padding: "10px 14px", borderRadius: 12,
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,62,165,0.3)",
          display: "flex", gap: 10, alignItems: "center", marginBottom: 14,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
            Personne d'autre ne doit voir l'écran. ({position}/{total})
          </div>
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" onClick={onAck}>
          {review ? "Cacher · revenir" : "J'ai mémorisé · suivant →"}
        </Btn>
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
  const alive = players.filter((p) => !p.isEliminated);
  const dead = players.filter((p) => p.isEliminated);
  const orderedAlive = order.map((idx) => players[idx]).filter(Boolean) as LocalPlayer[];
  const rows: { p: LocalPlayer; n: number | null; dead: boolean }[] = [
    ...orderedAlive.map((p, i) => ({ p, n: i + 1, dead: false })),
    ...dead.map((p) => ({ p, n: null, dead: true })),
  ];

  return (
    <LocalShell tone="noir">
      <NavBar sub={`Manche ${round}`} title="Tour de table" right={<Tag color="#3DDC97">{alive.length} EN VIE</Tag>} />
      <Mono style={{ marginBottom: 12 }}>Chacun donne un indice à voix haute, dans l&apos;ordre</Mono>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.map(({ p, n, dead: d }) => (
          <div key={p.idx} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14,
            background: d ? "transparent" : "rgba(255,255,255,0.04)",
            border: d ? "1px dashed rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.08)",
            opacity: d ? 0.45 : 1,
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 13,
              background: d ? "transparent" : "rgba(255,255,255,0.08)", color: d ? "#FF3EA5" : "#fff",
            }}>{d ? "✕" : n}</span>
            <Mascot size={40} color={colorByIdx(p.idx)} mood={d ? "dead" : "happy"} bob={false} shadow={false} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 800, color: d ? "rgba(255,255,255,0.45)" : "#fff", textDecoration: d ? "line-through" : "none" }}>{p.name}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, paddingTop: 18 }}>
        <Btn tone="ghost" icon={<span style={{ fontSize: 16 }}>👁</span>} onClick={onReviewWord}>Revoir mon mot</Btn>
        <Btn tone="danger" icon={<span style={{ fontSize: 16 }}>⚖</span>} onClick={onForceVote}>Passer au vote</Btn>
      </div>
    </LocalShell>
  );
}

function PlayerRow({
  player, n, isCurrent, hasSpoken, isDead, right,
}: {
  player: LocalPlayer;
  n: number | null;
  isCurrent: boolean;
  hasSpoken: boolean;
  isDead: boolean;
  right?: ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px 10px 8px", borderRadius: 12,
      background: isCurrent ? "linear-gradient(90deg, rgba(255,210,63,0.20) 0%, rgba(255,210,63,0.04) 100%)" : "transparent",
      border: isCurrent ? "1.5px solid #FFD23F" : "1px solid transparent",
      opacity: isDead ? 0.4 : 1,
      boxShadow: isCurrent ? "0 8px 20px rgba(255,210,63,0.20)" : "none",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        background: isCurrent ? "#FFD23F" : isDead ? "transparent" : "rgba(255,255,255,0.06)",
        border: isDead ? "1px dashed rgba(255,255,255,0.25)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display, system-ui)", fontWeight: 900, fontSize: 13,
        color: isCurrent ? "#1A0E2E" : isDead ? "rgba(255,255,255,0.4)" : "white",
      }}>{isDead ? "✕" : n}</div>

      <div style={{ position: "relative", flexShrink: 0 }}>
        {isCurrent && [0, 1].map((i) => (
          <div key={i} style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: "2px solid #FFD23F",
            animation: "uc-pulse 1.6s ease-out infinite",
            animationDelay: `${i * 0.6}s`, opacity: 0.5,
          }} />
        ))}
        <Mascot size={40} color={colorByIdx(player.idx)}
          mood={isDead ? "dead" : isCurrent ? "happy" : hasSpoken ? "wink" : "neutral"}
          bob={false} delay={player.idx * 0.1} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 800,
          color: isDead ? "rgba(255,255,255,0.4)" : "white",
          textDecoration: isDead ? "line-through" : "none",
          lineHeight: 1, letterSpacing: -0.3,
        }}>{player.name}</div>
        <div style={{
          fontSize: 11, marginTop: 4,
          color: isCurrent ? "#FFD23F" : isDead ? "#FF3EA5" : hasSpoken ? "#3DDC97" : "rgba(255,255,255,0.5)",
          fontWeight: isCurrent ? 700 : 500,
        }}>
          {isCurrent && "🎤 à toi · donne un indice à voix haute"}
          {hasSpoken && "✓ a parlé"}
          {isDead && `éliminé · manche ${player.eliminatedRound ?? "?"}`}
          {!isCurrent && !hasSpoken && !isDead && "en attente"}
        </div>
      </div>

      {right}
      {hasSpoken && <span style={{ color: "#3DDC97", fontSize: 14, fontWeight: 800 }}>✓</span>}
    </div>
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
  const alive = players.filter((p) => !p.isEliminated);
  return (
    <LocalShell tone="noir">
      <NavBar sub="Mémoire courte ?" title="Qui veut revoir ?" onBack={onCancel} right={<Tag color="#FF3EA5">CONFIDENTIEL</Tag>} />

      <div style={{
        padding: "10px 14px", borderRadius: 12,
        background: "rgba(255,62,165,0.08)",
        border: "1px dashed rgba(255,62,165,0.30)",
        fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.4,
        marginBottom: 14,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div>Choisis ton blob, puis <strong>personne d'autre ne doit voir l'écran.</strong></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {alive.map((p) => (
          <button key={p.idx} onClick={() => onPick(p.idx)} style={{
            padding: "16px 12px 14px", borderRadius: 18,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer", color: "white", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            fontFamily: "inherit",
          }}>
            <Mascot color={colorByIdx(p.idx)} size={56} mood="neutral" bob={false} />
            <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{p.name}</div>
            <div style={{
              padding: "3px 10px", borderRadius: 99,
              background: "rgba(255,255,255,0.06)",
              fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600,
            }}>tap pour revoir</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="ghost" onClick={onCancel}>← Revenir au tour de table</Btn>
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
  const [picked, setPicked] = useState<number | null>(null);
  const alive = players.filter((p) => !p.isEliminated);

  return (
    <LocalShell tone="danger">
      <NavBar
        sub={`Manche ${round} · vote du groupe`}
        title="Qui éliminer ?"
        onBack={onCancel}
        right={<Tag color="#FF3EA5">{alive.length} EN VIE</Tag>}
      />

      <Mono style={{ marginBottom: 12 }}>Décidez ensemble qui démasquer, puis confirmez</Mono>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {alive.map((p) => {
          const isPicked = picked === p.idx;
          return (
            <button key={p.idx} onClick={() => setPicked(p.idx)}
              style={{
                position: "relative", padding: "16px 12px 14px", borderRadius: 18,
                background: isPicked ? "linear-gradient(160deg, rgba(255,62,165,0.35), rgba(0,0,0,0.4))" : "rgba(255,255,255,0.04)",
                border: isPicked ? "2px solid #FF3EA5" : "1px solid rgba(255,255,255,0.10)",
                boxShadow: isPicked ? "0 18px 36px rgba(255,62,165,0.4)" : "0 4px 10px rgba(0,0,0,0.3)",
                transform: isPicked ? "scale(1.04)" : "scale(1)",
                color: "white", textAlign: "center", fontFamily: "inherit", cursor: "pointer",
              }}>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                <Mascot color={colorByIdx(p.idx)} size={64} mood={isPicked ? "shocked" : "shifty"} arms bob={false} />
              </div>
              <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 18, marginTop: 10, lineHeight: 1, fontWeight: 800 }}>{p.name}</div>
              <div style={{ marginTop: 8, padding: "6px 0", borderRadius: 10, background: isPicked ? "#FF3EA5" : "rgba(255,255,255,0.05)", color: isPicked ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 800 }}>
                {isPicked ? "✕ Éliminer" : "tap pour choisir"}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="danger" disabled={picked === null} onClick={() => picked !== null && onEliminate(picked)}
          sub={picked !== null ? players[picked]?.name : undefined}>
          Éliminer ce joueur
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
  const role = eliminated?.role ?? null;
  const color = role ? ROLE_COLOR[role] : "#FFD23F";

  return (
    <LocalShell tone="danger">
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 800, height: 800, maxWidth: "180vw",
        background: `conic-gradient(from 0deg, transparent 0deg, ${color}30 10deg, transparent 28deg, transparent 80deg, ${color}26 90deg, transparent 110deg, transparent 160deg, ${color}30 170deg, transparent 190deg, transparent 240deg, ${color}26 250deg, transparent 270deg, transparent 320deg, ${color}30 330deg, transparent 350deg)`,
        animation: "uc-rotate 18s linear infinite",
        opacity: 0.55, pointerEvents: "none", borderRadius: "50%", zIndex: 0,
        maskImage: "radial-gradient(circle, transparent 25%, black 50%, transparent 85%)",
      }} />

      <NavBar
        sub={`Verdict · manche ${round}`}
        title={eliminated ? "Démasqué !" : "Égalité"}
        right={<Tag color={color}>{role ? ROLE_LABEL[role].toUpperCase() : "—"}</Tag>}
      />

      {eliminated ? (
        <>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px" }}>
            <div style={{ position: "absolute", top: 10, width: 280, height: 220, background: `radial-gradient(circle, ${color}40 0%, transparent 65%)` }} />
            <div style={{ position: "relative", animation: "uc-die 1.1s cubic-bezier(0.34,1.45,0.64,1) both" }}>
              <SpyMascotById idx={eliminated.idx} size={160} tilt={-14} mood="dead" />
              <div style={{ position: "absolute", top: -8, right: -50, zIndex: 5, animation: "uc-die 0.5s ease-out 0.9s both" }}>
                <Stamp text="Éliminé" color={color} rotate={-12} size={20} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 44, marginTop: 14, letterSpacing: -1.5, fontWeight: 900 }}>{eliminated.name}</div>
          </div>

          <div style={{
            padding: "16px 18px", borderRadius: 18,
            background: `linear-gradient(160deg, ${color}26, rgba(0,0,0,0.45))`,
            border: `1px solid ${color}55`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16,
          }}>
            <div>
              <Mono>Son mot</Mono>
              <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 24, color, fontWeight: 900, marginTop: 4 }}>{eliminated.word ?? "Aucun mot"}</div>
            </div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)" }}>≠</div>
            <div style={{ textAlign: "right" }}>
              <Mono>Vrai mot</Mono>
              <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 24, color: "#3DDC97", fontWeight: 900, marginTop: 4 }}>{civilWord}</div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.6)" }}>
          Pas de majorité — personne ne sort cette manche.
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <Btn tone="primary" onClick={onNext}>Continuer →</Btn>
      </div>
    </LocalShell>
  );
}

// — MR WHITE GUESS
function MrWhiteGuess({ player, onSubmit }: { player: LocalPlayer; onSubmit: (g: string) => void }) {
  const [text, setText] = useState("");
  return (
    <LocalShell tone="gold">
      <NavBar sub="Coup du destin" title="Mr. White devine" right={<Tag color="#FFD23F">DERNIÈRE CHANCE</Tag>} />

      <div style={{
        padding: 18, borderRadius: 22,
        background: "linear-gradient(160deg, rgba(255,210,63,0.20) 0%, rgba(0,0,0,0.45) 100%)",
        border: "1px solid rgba(255,210,63,0.40)",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Mascot color={colorByIdx(player.idx)} size={68} mood="thinking" arms />
          <div>
            <Mono>Mr. White éliminé</Mono>
            <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 26, fontWeight: 900, marginTop: 4 }}>{player.name}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
          🎯 Une dernière chance. Tape le mot des civils pour gagner seul.
        </div>
      </div>

      <div style={{
        display: "flex", gap: 8, padding: 6, borderRadius: 14,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,210,63,0.40)",
        marginBottom: 12,
      }}>
        <input autoFocus value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && onSubmit(text.trim())}
          placeholder="Ton pari…"
          style={{
            flex: 1, background: "transparent", border: "none", color: "white",
            fontSize: 18, padding: 10, outline: "none", fontWeight: 700, letterSpacing: 0.5,
            fontFamily: "inherit",
          }} />
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" disabled={!text.trim()} onClick={() => text.trim() && onSubmit(text.trim())}>
          🎲 Parier
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
  const title =
    endReason === "civils-win" ? "Civils victorieux" :
    endReason === "undercover-wins" ? "Undercover gagne" :
    "Mr. White triomphe";
  const accent =
    endReason === "civils-win" ? "#3DDC97" :
    endReason === "undercover-wins" ? "#FF3EA5" : "#FFD23F";

  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const winners = sorted.filter((p) => {
    if (endReason === "civils-win") return p.role === "civil";
    if (endReason === "undercover-wins") return p.role !== "civil";
    return p.role === "mrwhite";
  });

  return (
    <LocalShell tone="civ">
      <Confetti accent={accent} count={50} />

      <NavBar sub="Fin de partie" title="" right={<Tag color={accent}>VICTOIRE</Tag>} />

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h1 style={{
          fontFamily: "var(--font-display, system-ui)",
          fontSize: 48, margin: 0, letterSpacing: -2, lineHeight: 0.9, fontWeight: 900,
          textShadow: `0 0 36px ${accent}88`,
        }}>
          <span style={{
            background: `linear-gradient(120deg, ${accent}, #FFD23F)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{title.split(" ")[0]}</span>
          <br/>{title.split(" ").slice(1).join(" ")}
        </h1>
      </div>

      <div style={{ position: "relative", height: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ position: "absolute", left: "50%", top: 20, transform: "translateX(-50%)", width: 360, height: 220, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${accent}40, transparent 70%)` }} />
        {winners[1] && <div style={{ position: "absolute", left: "12%", bottom: 0 }}><SpyMascotById idx={winners[1].idx} size={72} tilt={-8} mood="happy" arms delay={0.2} /></div>}
        {winners[2] && <div style={{ position: "absolute", right: "12%", bottom: 0 }}><SpyMascotById idx={winners[2].idx} size={68} tilt={6} mood="wink" arms delay={0.3} /></div>}
        {winners[0] && <div style={{ position: "relative", zIndex: 2 }}><SpyMascotById idx={winners[0].idx} size={130} tilt={-2} mood="happy" cheering arms crown /></div>}
      </div>

      <div style={{
        padding: "12px 14px", borderRadius: 14,
        background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.10)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12,
      }}>
        <div>
          <Mono>Civils</Mono>
          <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 20, color: "#3DDC97", fontWeight: 900 }}>{civilWord}</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>vs</div>
        <div style={{ textAlign: "right" }}>
          <Mono>Undercover</Mono>
          <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 20, color: "#FF3EA5", fontWeight: 900 }}>{ucWord}</div>
        </div>
      </div>

      {mrWhiteGuess !== null && (
        <div style={{
          padding: "10px 14px", borderRadius: 12,
          background: mrWhiteRight ? "rgba(61,220,151,0.10)" : "rgba(255,62,165,0.10)",
          border: `1px dashed ${mrWhiteRight ? "rgba(61,220,151,0.30)" : "rgba(255,62,165,0.30)"}`,
          fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 12, lineHeight: 1.4,
        }}>
          Mr. White a tenté : <strong>{mrWhiteGuess}</strong> {mrWhiteRight ? "✓ pari réussi" : "✕ raté"}
        </div>
      )}

      <Mono style={{ marginBottom: 8 }}>Classement</Mono>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
        {sorted.map((p, i) => {
          const win = winners.includes(p);
          const rc = ROLE_COLOR[p.role];
          return (
            <div key={p.idx} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 10px 6px 6px", borderRadius: 10,
              background: i === 0 ? "rgba(255,210,63,0.10)" : win ? "rgba(61,220,151,0.06)" : "rgba(255,62,165,0.06)",
              border: `1px solid ${i === 0 ? "rgba(255,210,63,0.30)" : win ? "rgba(61,220,151,0.20)" : "rgba(255,62,165,0.18)"}`,
            }}>
              <span style={{ width: 16, fontFamily: "var(--font-mono, monospace)", fontWeight: 800, fontSize: 11, color: i === 0 ? "#FFD23F" : "rgba(255,255,255,0.5)" }}>#{i + 1}</span>
              <Mascot color={colorByIdx(p.idx)} size={28} mood={win ? "wink" : "dead"} bob={false} shadow={false} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{p.name}</span>
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 99,
                background: p.role === "mrwhite" ? "rgba(255,210,63,0.18)" : `${rc}26`,
                color: rc, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4,
              }}>{ROLE_LABEL[p.role]}</span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 800, color: win ? "#3DDC97" : "rgba(255,255,255,0.5)", width: 38, textAlign: "right" }}>{p.score}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
        {onLobby && <Btn tone="ghost" full={false} style={{ flex: 1 }} onClick={onLobby}>Lobby</Btn>}
        <Btn tone="gold" full={false} style={{ flex: 1.4 }} onClick={onReplay} icon={<span>🔄</span>}>Revanche</Btn>
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
  const bg: Record<Tone, string> = {
    noir:   "radial-gradient(120% 70% at 50% 0%, rgba(91,54,214,0.40) 0%, transparent 60%), radial-gradient(120% 60% at 50% 100%, rgba(255,62,165,0.18) 0%, transparent 60%), linear-gradient(180deg, #0A0420 0%, #150834 100%)",
    danger: "radial-gradient(circle at 50% 25%, rgba(255,62,165,0.40), transparent 55%), linear-gradient(180deg, #1A0414 0%, #0E0828 100%)",
    civ:    "radial-gradient(circle at 50% 25%, rgba(61,220,151,0.30), transparent 55%), linear-gradient(180deg, #0A1A18 0%, #0E0828 100%)",
    gold:   "radial-gradient(ellipse 90% 50% at 50% 18%, rgba(255,210,63,0.22) 0%, transparent 55%), linear-gradient(180deg, #1A1206 0%, #0E0828 100%)",
  };
  return (
    <div style={{
      minHeight: "100dvh", color: "white",
      fontFamily: "var(--font-body, 'DM Sans'), system-ui, sans-serif",
      background: bg[tone], position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes uc-pulse { 0% { transform: scale(0.95); opacity: 0.7; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes uc-spin { to { transform: rotate(360deg); } }
        @keyframes uc-rotate { to { transform: translate(-50%, -50%) rotate(360deg); } }
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
      <div style={{
        position: "fixed", inset: 0,
        background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px)",
        maskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 80%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px calc(env(safe-area-inset-bottom, 0px) + 28px)", maxWidth: 460, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ children, color = "#FFD23F", style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 800, letterSpacing: 2,
      textTransform: "uppercase", color, padding: "4px 9px",
      border: `1px solid ${color}55`, borderRadius: 4, background: `${color}11`,
      whiteSpace: "nowrap", display: "inline-block", ...style,
    }}>{children}</span>
  );
}

function NavBar({ sub, title, right, onBack }: { sub?: string; title?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && (
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "#FFD23F", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{sub}</div>
        )}
        {title && (
          <div style={{ fontFamily: "var(--font-display, system-ui)", fontWeight: 800, fontSize: 24, color: "white", letterSpacing: -0.6, marginTop: 4, lineHeight: 1.05 }}>{title}</div>
        )}
      </div>
      {right}
    </div>
  );
}

type BtnTone = "primary" | "danger" | "gold" | "ghost" | "mint";
function Btn({ children, tone = "primary", disabled = false, onClick, full = true, icon, sub, style = {} }: {
  children: ReactNode; tone?: BtnTone; disabled?: boolean; onClick?: () => void;
  full?: boolean; icon?: ReactNode; sub?: string; style?: CSSProperties;
}) {
  const tones: Record<BtnTone, { bg: string; color: string; shadow: string }> = {
    primary: { bg: "linear-gradient(180deg, #7A4EE8 0%, #4D26B6 100%)", color: "white", shadow: "0 14px 30px rgba(91,54,214,0.55), inset 0 1px 0 rgba(255,255,255,0.25)" },
    danger:  { bg: "linear-gradient(180deg, #FF3EA5 0%, #B5176E 100%)", color: "white", shadow: "0 14px 30px rgba(255,62,165,0.55), inset 0 1px 0 rgba(255,255,255,0.25)" },
    gold:    { bg: "linear-gradient(180deg, #FFD23F 0%, #C48800 100%)", color: "#1A0E2E", shadow: "0 14px 30px rgba(255,210,63,0.45), inset 0 1px 0 rgba(255,255,255,0.4)" },
    ghost:   { bg: "rgba(255,255,255,0.08)", color: "white", shadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" },
    mint:    { bg: "linear-gradient(180deg, #3DDC97 0%, #189A66 100%)", color: "#0E0828", shadow: "0 14px 30px rgba(61,220,151,0.45), inset 0 1px 0 rgba(255,255,255,0.3)" },
  };
  const t = tones[tone];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? "100%" : "auto",
      padding: sub ? "12px 20px" : "16px 22px", borderRadius: 18, border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      background: t.bg, color: t.color, boxShadow: t.shadow,
      opacity: disabled ? 0.45 : 1,
      fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
      fontFamily: "var(--font-body, system-ui)",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
      ...style,
    }}>
      {icon && <span>{icon}</span>}
      <span style={{ display: "flex", flexDirection: "column", alignItems: sub ? "flex-start" : "center" }}>
        <span>{children}</span>
        {sub && <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.78, letterSpacing: 0.3, marginTop: 2 }}>{sub}</span>}
      </span>
    </button>
  );
}

function SpyMascotById({ idx, size = 80, tilt = -3, mood = "sus", cheering = false, crown = false, arms = false, delay = 0 }: {
  idx: number; size?: number; tilt?: number; mood?: MascotMood; cheering?: boolean; crown?: boolean; arms?: boolean; delay?: number;
}) {
  const color = colorByIdx(idx);
  const w = size * 0.66, h = size * 0.18;
  return (
    <div style={{ position: "relative", display: "inline-block", width: size, height: size * 1.15 + (crown ? size * 0.3 : 0) }}>
      <Mascot size={size} color={color} mood={mood} cheering={cheering} crown={crown} arms={arms} delay={delay} />
      <div style={{ position: "absolute", left: "50%", top: (crown ? size * 0.3 : 0) + size * 0.32, width: w, height: h, transform: `translateX(-50%) rotate(${tilt}deg)`, pointerEvents: "none", zIndex: 5 }}>
        <svg viewBox="0 0 100 28" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M2 12 L18 12 M48 12 L52 12 M82 12 L98 12" stroke="#0E0828" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M18 4 Q18 18 30 22 Q44 24 47 14 Q48 6 36 4 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1.2" />
          <path d="M53 14 Q56 24 70 22 Q82 18 82 4 L65 4 Q53 6 53 14 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1.2" />
          <ellipse cx="26" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.6" />
          <ellipse cx="63" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.45" />
        </svg>
      </div>
    </div>
  );
}

function Stamp({ text, color = "#FF3EA5", rotate = -10, size = 18 }: { text: string; color?: string; rotate?: number; size?: number }) {
  return (
    <div style={{
      display: "inline-block",
      padding: `${size * 0.25}px ${size * 0.7}px`,
      border: `3px solid ${color}`, color,
      fontFamily: "var(--font-display, system-ui)",
      fontWeight: 900, fontSize: size, letterSpacing: 3,
      textTransform: "uppercase",
      transform: `rotate(${rotate}deg)`,
      borderRadius: 6, background: "rgba(0,0,0,0.3)",
      boxShadow: `inset 0 0 0 1px ${color}55, 0 6px 18px rgba(0,0,0,0.4)`,
      textShadow: `0 0 14px ${color}66`,
    }}>{text}</div>
  );
}

function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono, monospace)", fontSize: 10,
      color: "rgba(255,255,255,0.5)", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
      ...style,
    }}>{children}</span>
  );
}

function FileCard({ children, accent = "#FFD23F", style }: { children: ReactNode; accent?: string; style?: CSSProperties }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 18, padding: 16,
      boxShadow: "0 12px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      ...style,
    }}>
      <div style={{
        position: "absolute", top: -1, right: -1,
        width: 22, height: 22, background: "#0E0828",
        clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        borderTopRightRadius: 18,
      }} />
      <div style={{
        position: "absolute", left: 0, top: 14, bottom: 14,
        width: 3, borderRadius: 3, background: accent,
        boxShadow: `0 0 12px ${accent}`, opacity: 0.9,
      }} />
      {children}
    </div>
  );
}

function Stat({ n, label, color, sub }: { n: number; label: string; color: string; sub?: string }) {
  return (
    <div style={{
      padding: "10px 6px", borderRadius: 10,
      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
      textAlign: "center",
    }}>
      <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 26, color, lineHeight: 1, fontWeight: 900 }}>{n}</div>
      <div style={{ fontSize: 11, color: "white", fontWeight: 700, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderTop: "1px dashed rgba(255,255,255,0.08)",
    }}>
      <div>
        <div style={{ fontSize: 13, color: "white", fontWeight: 700 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange, disabled }: { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const btn: CSSProperties = {
    width: 30, height: 30, borderRadius: 9, border: "none",
    background: "rgba(255,255,255,0.06)", color: "white",
    fontWeight: 900, fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button style={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span style={{ width: 22, textAlign: "center", fontWeight: 800, fontSize: 18, fontFamily: "var(--font-display, system-ui)" }}>{value}</span>
      <button style={{ ...btn, background: value < max && !disabled ? "#FFD23F" : "rgba(255,255,255,0.06)", color: value < max && !disabled ? "#1A0E2E" : "white" }} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!value)} style={{
      width: 46, height: 26, borderRadius: 99, border: "none",
      background: value ? "#3DDC97" : "rgba(255,255,255,0.14)",
      position: "relative", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "background .15s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 22 : 2,
        width: 22, height: 22, borderRadius: "50%", background: "white",
        transition: "left .15s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

function DossierCard({ word, role, hint, round }: { word: string | null; role: Role; hint: string; round: number }) {
  const color = ROLE_COLOR[role];
  const label = ROLE_LABEL[role];
  return (
    <div style={{
      position: "relative", padding: "22px 20px 24px",
      borderRadius: 22,
      background: "linear-gradient(180deg, #FFF7E0 0%, #F0DA9A 100%)",
      color: "#1A0E2E",
      boxShadow: "0 24px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.10)",
      transform: "rotate(-1.5deg)", margin: "16px 4px",
    }}>
      <div style={{
        position: "absolute", top: -13, left: "50%", transform: "translateX(-50%) rotate(-2deg)",
        width: 100, height: 22,
        background: "linear-gradient(180deg, rgba(255,210,63,0.7) 0%, rgba(255,210,63,0.5) 100%)",
        borderTop: "1px dashed rgba(0,0,0,0.15)", borderBottom: "1px dashed rgba(0,0,0,0.15)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
      }} />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 12, marginBottom: 16,
        borderBottom: "2px solid rgba(26,14,46,0.25)",
      }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>CONFIDENTIEL</div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#7A3008" }}>MANCHE {round}</div>
      </div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "#7A3008", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
        {role === "mrwhite" ? "Pas de mot" : "Ton mot secret"}
      </div>
      <div style={{
        fontFamily: "var(--font-display, system-ui)",
        fontSize: word ? 56 : 44, lineHeight: 1, margin: "10px 0 6px",
        letterSpacing: -2.5, color: "#1A0E2E", fontWeight: 900,
        textAlign: role === "mrwhite" ? "center" : "left",
        opacity: role === "mrwhite" ? 0.4 : 1,
      }}>{word ?? "?????"}</div>
      <div style={{ position: "absolute", top: 22, right: 16, transform: "rotate(8deg)" }}>
        <Stamp text={label} color={color} rotate={0} size={11} />
      </div>
      <div style={{
        marginTop: 12, paddingTop: 14,
        borderTop: "1px dashed rgba(26,14,46,0.25)",
        fontSize: 12, fontStyle: "italic", color: "#3A2700", lineHeight: 1.45,
      }}>{hint}</div>
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
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
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
function PlayersSetupUC({ onStart, onBack }: { onStart: (names: string[]) => void; onBack?: () => void }) {
  const [names, setNames] = useState<string[]>(["", "", "", "", ""]);
  const count = names.length;
  const setCount = (n: number) =>
    setNames((prev) => {
      const next = [...prev];
      while (next.length < n) next.push("");
      return next.slice(0, n);
    });
  return (
    <LocalShell tone="noir">
      <NavBar sub="Étape 2/3" title="Qui joue ?" onBack={onBack} right={<Tag>LOCAL</Tag>} />

      <FileCard accent="#FFD23F" style={{ marginBottom: 16 }}>
        <Mono style={{ marginBottom: 6 }}>Nombre de joueurs</Mono>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 800, color: "#FFD23F", lineHeight: 1 }}>{count}</span>
          <Stepper value={count} min={3} max={7} onChange={setCount} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[3, 4, 5, 6, 7].map((n) => {
            const sel = n === count, on = n <= count;
            return (
              <button key={n} onClick={() => setCount(n)} style={{
                width: sel ? 36 : 30, height: sel ? 36 : 30, borderRadius: "50%", padding: 0, cursor: "pointer",
                border: sel ? "2px solid #fff" : "1px solid rgba(255,255,255,0.1)",
                background: on ? (sel ? "linear-gradient(135deg,#FFD23F,#FF8B5C)" : "rgba(255,210,63,0.3)") : "rgba(255,255,255,0.05)",
                color: on ? (sel ? "#1A0E2E" : "#fff") : "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: sel ? 15 : 12,
              }}>{n}</button>
            );
          })}
        </div>
      </FileCard>

      <Mono style={{ marginBottom: 8 }}>Les suspects</Mono>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {names.map((nm, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 10, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Mascot size={48} color={MASCOT_COLORS[i % MASCOT_COLORS.length]} mood="happy" bob={false} shadow={false} />
            <input
              value={nm}
              onChange={(e) => setNames((prev) => prev.map((x, idx) => (idx === i ? e.target.value.slice(0, 14) : x)))}
              placeholder={`Joueur ${i + 1}`}
              style={{ width: "100%", textAlign: "center", background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}
            />
            <Mono style={{ fontSize: 8 }}>Suspect N°{String(i + 1).padStart(2, "0")}</Mono>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <Btn tone="gold" onClick={() => onStart(names.map((n, i) => n.trim() || `Joueur ${i + 1}`))}>Choisir les rôles →</Btn>
      </div>
    </LocalShell>
  );
}

// ── Maquette 06 — "Passe le téléphone" (remplace le PassScreen générique) ──
function PassScreenUC({ toName, colorIdx, label, players, currentIdx, buttonLabel, buttonSub, tag = "Rôles prêts", onReady }: {
  toName: string; colorIdx: number; label: string;
  players?: LocalPlayer[]; currentIdx?: number;
  buttonLabel: string; buttonSub?: string; tag?: string; onReady: () => void;
}) {
  return (
    <LocalShell tone="noir">
      <NavBar sub={label} right={<Tag color="#3DDC97">{tag}</Tag>} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
        <div style={{ position: "relative" }}>
          {[0, 1].map((i) => (
            <span key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 150, height: 150, borderRadius: "50%", border: "1.5px solid rgba(255,210,63,0.5)", transform: "translate(-50%,-50%)", animation: "uc-pulse 2.6s ease-out infinite", animationDelay: `${i * 1.3}s` }} />
          ))}
          <Mascot size={150} color={MASCOT_COLORS[colorIdx % MASCOT_COLORS.length]} mood="neutral" bob={false} shadow={false} />
        </div>
        <Mono style={{ color: "#FFD23F", marginTop: 12 }}>Passe le téléphone à</Mono>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1, textShadow: "0 0 32px rgba(122,78,232,0.5)" }}>{toName}</div>
      </div>

      {players && (
        <div style={{ marginTop: 28 }}>
          <Mono style={{ marginBottom: 8, display: "block", textAlign: "center" }}>Tour de distribution</Mono>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            {players.map((p) => {
              const active = p.idx === currentIdx;
              return (
                <div key={p.idx} style={{ textAlign: "center", opacity: active ? 1 : 0.4 }}>
                  <div style={{ borderRadius: "50%", border: active ? "2px solid #FFD23F" : "1px solid rgba(255,255,255,0.1)", padding: 1 }}>
                    <Mascot size={34} color={MASCOT_COLORS[p.idx % MASCOT_COLORS.length]} mood="happy" bob={false} shadow={false} />
                  </div>
                  <div style={{ fontSize: 8, marginTop: 3, color: active ? "#FFD23F" : "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>{p.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Btn tone="gold" sub={buttonSub} onClick={onReady}>{buttonLabel}</Btn>
      </div>
    </LocalShell>
  );
}
