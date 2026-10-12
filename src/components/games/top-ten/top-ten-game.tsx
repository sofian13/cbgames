"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { MascotAvatar } from "@/components/Mascot";
import { ModeSelect, PlayersSetup, PassScreen, colorForIndex, type GameMode } from "@/components/games/local-kit";
import { ArrowLeft, Check, Eye, Flame, RefreshCw, Timer, Trophy, type LucideIcon } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";

// ── Types ─────────────────────────────────────────────────
interface TopTenPlayerState {
  id: string;
  name: string;
  score: number;
}

interface ThemeState {
  theme: string;
  low: string;
  high: string;
}

interface RoundResult {
  correct: number;
  total: number;
  perfect: boolean;
  points: number;
}

interface TopTenState {
  phase: "waiting" | "config" | "intro" | "theme" | "answering" | "ordering" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  numberRange: number;
  pack: Pack;
  theme: ThemeState | null;
  numberedOrder: string[];
  submittedCount: number;
  submittedIds: string[] | null;
  trueOrder: string[] | null;
  revealNumbers: Record<string, number> | null;
  roundResults: Record<string, RoundResult> | null;
  players: TopTenPlayerState[];
  myNumber: number | null;
  iSubmitted: boolean;
  myGuess: string[] | null;
  isSpectator?: boolean;
  activeCount?: number;
  orderRemainingMs?: number | null;
}

const ACCENT = "#ff5a8a";

// Mélange uniforme (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Thèmes 18+ (mode local) ───────────────────────────────
const LOCAL_THEMES: ThemeState[] = [
  { theme: "Un endroit où tu ferais l'amour", low: "Dans ton lit, tranquille", high: "En public, avec le risque de se faire prendre" },
  { theme: "Un message coquin à envoyer à ton crush", low: "« Tu me manques... »", high: "Un truc carrément explicite" },
  { theme: "Une tenue pour une soirée", low: "Jean - t-shirt classique", high: "Quasi rien, tout est suggéré" },
  { theme: "Un fantasme à avouer à voix haute", low: "Un câlin sous la couette", high: "Le truc que t'oserais jamais dire normalement" },
  { theme: "Ton niveau de dignité un samedi à 4h du mat", low: "Impeccable, je rentre en taxi", high: "Je fais des câlins aux videurs" },
  { theme: "Un truc qui t'excite", low: "Un regard appuyé", high: "Quelque chose de carrément chaud" },
  { theme: "Une chose à faire pour un date parfait", low: "Dîner aux chandelles", high: "On saute l'étape dîner direct" },
  { theme: "Un endroit pour un premier baiser", low: "Devant sa porte, timidement", high: "Sur la piste, devant tout le monde" },
  { theme: "Le degré d'audace d'un sexto", low: "Un emoji cœur", high: "Photo et description détaillée" },
  { theme: "Une chose qu'on pourrait te demander dans une chambre", low: "Un massage du dos", high: "Un truc franchement osé" },
  { theme: "Ce que tu fais quand tu perds tout contrôle en soirée", low: "Je deviens très câlin", high: "Je fais un truc dont j'aurai honte demain" },
  { theme: "Le niveau d'un strip-tease", low: "J'enlève ma veste", high: "Je garde plus rien du tout" },
  { theme: "Un gage pour le perdant de la soirée", low: "Faire la vaisselle de tout le monde", high: "Un gage interdit aux mineurs" },
  { theme: "Une partie du corps à embrasser", low: "La joue", high: "Un endroit très intime" },
  { theme: "Un secret de chambre à coucher", low: "Je dors avec une peluche", high: "Le kink que personne ne connaît" },
  { theme: "Ce que tu cherches sur une appli de rencontre", low: "Une vraie histoire d'amour", high: "Un plan d'un soir, ce soir" },
  { theme: "Le niveau d'un gage de soirée", low: "Imiter un animal", high: "Embrasser la personne à ta gauche" },
  { theme: "Une position", low: "Classique, face à face", high: "Acrobatique, faut être souple" },
  { theme: "Un lieu insolite pour le faire", low: "Le canapé du salon", high: "Les toilettes d'une boîte de nuit" },
  { theme: "Ce que tu postes sur les réseaux", low: "Un coucher de soleil", high: "Une photo qui fait monter la température" },
  { theme: "Un compliment à faire à un inconnu", low: "« T'as un joli sourire »", high: "Une phrase très directe et osée" },
  { theme: "Le niveau de jalousie en couple", low: "Je m'en fiche un peu", high: "Je fouille son téléphone en cachette" },
  { theme: "Une chose à faire les yeux bandés", low: "Deviner un aliment au goût", high: "Quelque chose de bien plus coquin" },
  { theme: "Un truc à tester en couple", low: "Un resto romantique", high: "Une nuit sans aucune limite" },
  { theme: "Ce que tu réponds à « on monte chez moi ? »", low: "« Il se fait tard, une autre fois »", high: "« J'attendais que ça depuis le début »" },
  { theme: "Le niveau d'un suçon", low: "À peine visible", high: "Impossible à cacher au boulot" },
  { theme: "Une activité de couple un dimanche", low: "Brunch et série", high: "On sort pas du lit de la journée" },
  { theme: "Un endroit pour une photo sexy", low: "Devant le miroir, habillé", high: "Sous la douche, sans filtre" },
  { theme: "Ce qui te fait craquer chez quelqu'un", low: "Son humour", high: "Un détail très physique et précis" },
  { theme: "Le niveau d'un date sur une appli de rencontre qui dérape", low: "On s'est juste fait la bise", high: "On a fini la nuit ensemble" },
  { theme: "Une phrase à murmurer à l'oreille", low: "« T'es vraiment mignon(ne) »", high: "Un truc qui ferait rougir n'importe qui" },
  { theme: "Le degré d'une danse en boîte", low: "Je bouge gentiment", high: "Collé-serré très rapproché" },
  { theme: "Un objet du quotidien détourné au lit", low: "Une cravate", high: "Un truc auquel personne ne pense" },
  { theme: "Ce que tu fais le matin après une nuit chaude", low: "Petit déj en amoureux", high: "Je file avant qu'il/elle se réveille" },
  { theme: "Le niveau d'un jeu de rôles", low: "On se fait des surnoms", high: "Costumes et scénario complet" },
  { theme: "Une chose à faire dans le noir", low: "Se tenir la main", high: "Tout sauf dormir" },
  { theme: "Un endroit pour flirter", low: "Au bar, en discutant", high: "Dans l'ascenseur, entre deux étages" },
  { theme: "Le niveau d'un texto à 3h du matin", low: "« Tu dors ? »", high: "« Viens, je suis seul(e) »" },
  { theme: "Ce que tu révèles lors d'un strip-poker", low: "Une chaussette", high: "Tout, j'ai trop perdu" },
  { theme: "Une audace en vacances", low: "Bronzer sur la plage", high: "Se baigner sans maillot la nuit" },
  // Malaise / vie quotidienne (drôle)
  { theme: "Tu ouvres un tiroir dans la chambre de tes parents, y a quoi ?", low: "De vieilles photos de vacances", high: "Un truc que t'aurais préféré ne jamais voir" },
  { theme: "Tu envoies un message dans le groupe famille, c'est quoi ?", low: "« Bon dimanche à tous »", high: "Un message très privé destiné à quelqu'un d'autre" },
  { theme: "Le dernier truc dans ton historique de recherche", low: "La météo de demain", high: "Quelque chose à effacer d'urgence" },
  { theme: "Ce que ta mère trouverait en fouillant ton téléphone", low: "Des memes débiles", high: "Une conversation qu'elle doit jamais lire" },
  { theme: "La dernière photo de ta galerie", low: "Un plat au resto", high: "Une photo carrément intime" },
  { theme: "Ce que tu caches quand quelqu'un entre dans ta chambre", low: "Le bazar par terre", high: "Un objet super gênant" },
  { theme: "Le niveau de honte de ta photo de profil de 2014", low: "Une coupe de cheveux discutable", high: "À supprimer immédiatement" },
  { theme: "Le dernier mensonge que t'as raconté", low: "« J'arrive dans 5 minutes »", high: "Un gros mensonge bien assumé" },
  { theme: "Ce que tu fais quand t'es seul(e) à la maison", low: "Je chante sous la douche", high: "Un truc que j'avouerai jamais" },
  { theme: "Ce que ton ex pourrait balancer sur toi", low: "« Il/elle ronflait un peu »", high: "Un secret bien embarrassant" },
  { theme: "Le contenu de tes notes de téléphone", low: "Une liste de courses", high: "Des trucs que personne doit lire" },
  { theme: "Ce que tu dirais à ton boss s'il y avait zéro conséquence", low: "« Faut qu'on parle salaire »", high: "Tout ce que je pense vraiment de lui" },
  { theme: "Le truc le plus louche que t'as commandé à 2h du mat", low: "Une pizza", high: "Un truc franchement honteux" },
  { theme: "Ce que tu mettrais jamais sur ton CV", low: "Mon vrai niveau d'anglais", high: "La vraie raison de mon dernier départ" },
  { theme: "Le truc le plus gênant dans ton panier de linge sale", low: "Des chaussettes trouées", high: "Quelque chose d'inavouable" },
  { theme: "Ce que tu googles en pleine nuit, paniqué(e)", low: "« Pourquoi mon chat me fixe »", high: "Un symptôme flippant que t'as inventé" },
  { theme: "Le dernier truc pour lequel t'as pleuré", low: "Une pub trop mignonne", high: "Un truc complètement ridicule" },
  { theme: "Ce que t'as déjà fait croire à un date", low: "« J'adore la rando »", high: "Un mensonge énorme sur ma vie" },
  // Très osé +18 (gros niveau)
  { theme: "Le nombre de partenaires que t'as eu", low: "Très peu, je compte sur une main", high: "J'ai arrêté de compter" },
  { theme: "Le crush le plus inattendu que t'as eu", low: "Un(e) collègue un peu mignon(ne)", high: "Quelqu'un que je devrais vraiment pas regarder" },
  { theme: "L'endroit le plus risqué où t'as eu un moment intime", low: "Chez mes parents, porte fermée", high: "Un endroit où on aurait pu finir au poste" },
  { theme: "Le compliment le plus sale à dire pendant l'acte", low: "« T'es beau/belle »", high: "Une phrase carrément crue" },
  { theme: "Ton tabou sexuel le plus profond", low: "Un truc bizarre mais avouable", high: "Le secret que personne saura jamais" },
  { theme: "Le plan le plus louche que t'as eu sur une appli", low: "Un date qui parlait que de son chat", high: "Une rencontre vraiment chelou" },
  { theme: "Ce que tu regardes en cachette", low: "Une série niaise", high: "Quelque chose de bien embarrassant" },
  { theme: "Une histoire dont t'as honte mais que tu referais", low: "Un texto regretté à 3h du mat", high: "Une nuit que personne doit savoir" },
  { theme: "Le pire endroit où t'as fini la nuit", low: "Sur le canapé d'un(e) inconnu(e)", high: "Un lieu carrément interdit" },
  { theme: "Le sexto le plus chaud que t'as déjà envoyé", low: "Un emoji bien placé", high: "Une description très détaillée et imagée" },
  { theme: "Le partenaire le plus surprenant que t'as eu", low: "Un(e) ami(e) d'ami(e)", high: "Quelqu'un qu'on aurait jamais imaginé" },
  { theme: "Une chose interdite que t'as déjà faite en cachette", low: "Manger le dessert des autres", high: "Quelque chose que j'avouerai jamais" },
  { theme: "Le délire d'un soir qui a vraiment dérapé", low: "On a fini en after", high: "Une nuit complètement folle, vrai chaos" },
  { theme: "Ce que t'as déjà fait dans des toilettes publiques", low: "Refaire mon maquillage", high: "Un truc carrément pas réglementaire" },
  { theme: "La chose la plus folle que t'as faite par amour (ou par désir)", low: "Traverser la ville à pied", high: "Un truc que je pensais pas pouvoir faire" },
];

// ── Pack Culture pop & Classements (1 = le plus faible/nul → 10 = le plus fort/ouf) ──
const CULTURE_THEMES: ThemeState[] = [
  { theme: "Un perso de Dragon Ball, par puissance", low: "Yamcha", high: "Zeno, le roi de tout" },
  { theme: "Un Pokémon, par puissance", low: "Magicarpe", high: "Arceus" },
  { theme: "Un perso de One Piece, par prime", low: "Un pirate sans prime", high: "Un Yonko (Empereur)" },
  { theme: "Un perso de Naruto, par force", low: "Un genin de l'académie", high: "Kaguya" },
  { theme: "Un super-héros Marvel, par puissance", low: "Œil-de-Faucon", high: "Thanos" },
  { theme: "Une ville de France, de la plus stylée à la plus pourrie", low: "Une ville de rêve", high: "Le trou paumé le plus pourri" },
  { theme: "Un joueur de foot, par talent", low: "Un amateur du dimanche", high: "Messi" },
  { theme: "Un rappeur FR, par notoriété", low: "Un rappeur inconnu", high: "Une légende du game" },
  { theme: "Une marque de voiture, du low-cost au luxe", low: "Une Dacia", high: "Une Ferrari" },
  { theme: "Un animal, du plus inoffensif au plus dangereux", low: "Un lapin", high: "Un grand requin blanc" },
  { theme: "Un fast-food, du pire au meilleur", low: "Le pire endroit", high: "Ton resto préféré" },
  { theme: "Un réseau social, par temps perdu dessus", low: "LinkedIn", high: "TikTok" },
  { theme: "Une matière à l'école, de la plus cool à la plus chiante", low: "La plus cool", high: "La plus soûlante" },
  { theme: "Un métier, par salaire", low: "Stagiaire non payé", high: "PDG du CAC 40" },
  { theme: "Une console de jeu, par puissance", low: "Une vieille Game Boy", high: "Une PS5 / PC de gamer" },
  { theme: "Un plat, du plus light au plus lourd", low: "Une salade verte", high: "Une raclette" },
  { theme: "Une destination de vacances, du nul au paradis", low: "Camping sous la pluie", high: "Les Maldives" },
  { theme: "Un streamer/youtubeur FR, par notoriété", low: "Un inconnu à 10 vues", high: "Squeezie" },
  { theme: "Un film de super-héros, du flop au chef-d'œuvre", low: "Le gros navet", high: "Le chef-d'œuvre culte" },
  { theme: "Un perso de Disney, du plus gentil au plus méchant", low: "Le gentil tout mignon", high: "Le grand méchant" },
  { theme: "Un moyen de transport, du plus lent au plus rapide", low: "Une trottinette", high: "Un avion de chasse" },
  { theme: "Un méchant de film ou d'anime, du soft au terrifiant", low: "Un sbire de base", high: "Le boss final ultime" },
  { theme: "Un téléphone, du plus pourri au plus haut de gamme", low: "Un vieux Nokia 3310", high: "Le dernier iPhone" },
  { theme: "Une soirée, du flop au légendaire", low: "Seul devant la TV", high: "La soirée dont on parle encore" },
];

type Pack = "adult" | "culture";
const PACK_LABEL: Record<Pack, string> = { adult: "Thème 18+", culture: "Culture pop" };
// Vocabulaire de l'échelle selon le pack (soft↔hard pour 18+, faible↔fort pour les classements)
const SCALE: Record<Pack, { low: string; high: string; lowFull: string; highFull: string }> = {
  adult: { low: "Soft", high: "Hard", lowFull: "plus soft", highFull: "plus hard" },
  culture: { low: "Faible", high: "Fort", lowFull: "plus faible", highFull: "plus fort" },
};
const themesForPack = (p: Pack) => (p === "culture" ? CULTURE_THEMES : LOCAL_THEMES);

// Score un classement (paires adjacentes bien ordonnées soft→hard)
function scorePairs(orderedNums: number[]): { correct: number; total: number; perfect: boolean; points: number } {
  const total = Math.max(0, orderedNums.length - 1);
  let correct = 0;
  for (let i = 0; i < orderedNums.length - 1; i++) {
    if (orderedNums[i] < orderedNums[i + 1]) correct++;
  }
  const perfect = total > 0 && correct === total;
  return { correct, total, perfect, points: correct * 2 + (perfect ? 5 : 0) };
}

// ── WRAPPER : le joueur choisit local ou online ───────────
export default function TopTenGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (mode === null) {
    return (
      <ModeSelect emoji="🔥" name="De 1 à 10"
        tagline="Un thème, un numéro secret (de 1 à 10, 25 ou 50). Chacun répond à voix haute selon son numéro… puis chacun classe toute la table, lui compris. Deux ambiances : Soirée 18+ ou Culture pop (classements animés, villes, foot…)."
        onPick={setMode} />
    );
  }
  if (mode === "local") return <TopTenLocal onReturnToLobby={props.onReturnToLobby} />;
  return <TopTenOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play — chacun voit son numéro, puis chacun classe)
// ══════════════════════════════════════════════════════════
function TopTenLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  type Phase = "setup" | "target" | "theme" | "pass-number" | "show-number" | "answer" | "pass-rank" | "rank" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [numberRange, setNumberRange] = useState<10 | 25 | 50>(10);
  const [pack, setPack] = useState<Pack>("adult");
  const [themes, setThemes] = useState<ThemeState[]>(() => shuffle(LOCAL_THEMES));
  const [themeCursor, setThemeCursor] = useState(0); // avance à chaque manche / changement
  const [numbers, setNumbers] = useState<Record<number, number>>({}); // playerIdx -> numéro
  const [passOrder, setPassOrder] = useState<number[]>([]); // ordre de passage (mélangé)
  const [stepIdx, setStepIdx] = useState(0); // index dans passOrder (voir numéro / classer)
  const [guesses, setGuesses] = useState<Record<number, number[]>>({}); // playerIdx -> classement (player indices)
  const [results, setResults] = useState<Record<number, RoundResult>>({});

  const theme = themes[themeCursor % themes.length] ?? null;
  const total = players.length;
  const totalRounds = Math.min(8, Math.max(4, total));

  // Prépare une manche : numéros + ordre de passage. La phrase est montrée
  // en phase "theme" AVANT que chacun voie son numéro (avec bouton "changer").
  const startRound = (r: number, names = players) => {
    const all = names.map((_, i) => i);
    const range = Math.max(numberRange, all.length); // sécurise si numberRange < #joueurs
    const pool = shuffle(Array.from({ length: range }, (_, i) => i + 1));
    const nums: Record<number, number> = {};
    all.forEach((idx, k) => { nums[idx] = pool[k]; });
    setNumbers(nums);
    setPassOrder(shuffle(all));
    setStepIdx(0);
    setGuesses({});
    setResults({});
    setRound(r);
    setPhase("theme");
  };

  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    setThemeCursor(0);
    setPhase("target"); // on choisit le score cible avant la 1re manche
  };
  const launch = () => {
    setThemes(shuffle(themesForPack(pack)));
    setThemeCursor(0);
    startRound(1, players);
  };

  // Quand tout le monde a classé → score + reveal
  const finishRanking = (allGuesses: Record<number, number[]>) => {
    const res: Record<number, RoundResult> = {};
    const gained: number[] = players.map(() => 0);
    players.forEach((_, idx) => {
      const guess = allGuesses[idx] ?? passOrder;
      const nums = guess.map((pIdx) => numbers[pIdx]);
      const r = scorePairs(nums);
      res[idx] = r;
      gained[idx] = r.points;
    });
    setResults(res);
    setScores((s) => s.map((v, i) => v + gained[i]));
    setPhase("reveal");
  };

  if (phase === "setup") {
    return <PlayersSetup emoji="🔥" name="De 1 à 10" min={3} max={10} accent="#ff5a8a" onStart={begin} onBack={onReturnToLobby} />;
  }
  if (phase === "target") {
    return <RangePicker range={numberRange} onPick={setNumberRange} pack={pack} onPickPack={setPack} onStart={launch} onBack={() => setPhase("setup")} />;
  }
  if (phase === "theme") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center p-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] text-white"
        style={{ background: `radial-gradient(circle at 50% 18%, ${ACCENT}26, transparent 45%), #0E0828` }}>
        <p className="af-eyebrow mb-4">Manche {round}/{totalRounds} · sur {numberRange}</p>
        <ThemeCard theme={theme} range={numberRange} pack={pack} />
        <button onClick={() => { setStepIdx(0); setPhase("pass-number"); }}
          className="af-btn af-btn-primary mt-7 w-full max-w-md">C&apos;est bon → distribuer les numéros</button>
        <button onClick={() => setThemeCursor((c) => c + 1)}
          className="af-btn af-btn-ghost mt-3 w-full max-w-md"><GameInlineIcon icon={RefreshCw} /> Changer de thème</button>
      </div>
    );
  }
  if (phase === "pass-number") {
    const idx = passOrder[stepIdx];
    return <PassScreen toName={players[idx]} colorIndex={idx} accent="#ff5a8a"
      hint={`Toi seul : tu vas voir ton numéro secret (1 = ${SCALE[pack].low.toLowerCase()}, ${numberRange} = ${SCALE[pack].high.toLowerCase()}).`} onReady={() => setPhase("show-number")} />;
  }
  if (phase === "show-number") {
    const idx = passOrder[stepIdx];
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] text-white"
        style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}30, transparent 45%), #0E0828` }}>
        <p className="af-eyebrow mb-2">{players[idx]} · ton numéro</p>
        <NumberCard myNumber={numbers[idx]} range={numberRange} />
        <button onClick={() => {
          if (stepIdx < passOrder.length - 1) { setStepIdx(stepIdx + 1); setPhase("pass-number"); }
          else { setStepIdx(0); setPhase("answer"); }
        }} className="af-btn af-btn-primary mt-8 w-full max-w-xs">J&apos;ai vu — cacher</button>
      </div>
    );
  }
  if (phase === "answer") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center p-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] text-white"
        style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}26, transparent 45%), #0E0828` }}>
        <p className="af-eyebrow mt-3">Manche {round}/{totalRounds} · sur {numberRange}</p>
        <div className="mt-4 w-full max-w-md rounded-3xl border p-6" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)" }}>
          <p className="af-eyebrow mb-2 text-center" style={{ color: ACCENT }}>{PACK_LABEL[pack]}</p>
          <p className="cb-display-sm text-center">{theme?.theme}</p>
          <div className="mt-4 flex gap-2 text-center text-xs">
            <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2"><b className="text-emerald-400">1</b><br/>{theme?.low}</div>
            <div className="flex-1 rounded-2xl border p-2" style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}><b style={{ color: ACCENT }}>{numberRange}</b><br/>{theme?.high}</div>
          </div>
        </div>
        <p className="mt-5 max-w-xs text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Chacun annonce sa réponse <b>à voix haute</b> selon l&apos;intensité de son numéro. Écoutez bien : ensuite <b>chacun</b> classera la table à son tour.
        </p>
        <button onClick={() => { setStepIdx(0); setPhase("pass-rank"); }} className="af-btn af-btn-primary mt-6 w-full max-w-md">Tout le monde a parlé → classer</button>
      </div>
    );
  }
  if (phase === "pass-rank") {
    const idx = passOrder[stepIdx];
    return <PassScreen toName={players[idx]} colorIndex={idx} accent="#ff5a8a"
      buttonLabel="C'est moi, je classe" hint={`Personne ne regarde ! Classe toute la table (toi compris) du ${SCALE[pack].lowFull} au ${SCALE[pack].highFull}, selon ce que t'as entendu.`} onReady={() => setPhase("rank")} />;
  }
  if (phase === "rank") {
    const ranker = passOrder[stepIdx];
    return (
      <OrderingBoard
        key={`${round}-${stepIdx}`}
        ids={passOrder.map(String)}
        nameOf={(id) => players[+id]}
        rankerName={players[ranker]}
        round={round} total={totalRounds} range={numberRange} pack={pack}
        onSubmit={(o) => {
          const g = o.map(Number);
          const next = { ...guesses, [ranker]: g };
          setGuesses(next);
          if (stepIdx < passOrder.length - 1) { setStepIdx(stepIdx + 1); setPhase("pass-rank"); }
          else finishRanking(next);
        }} />
    );
  }
  if (phase === "reveal") {
    // Vrai classement (soft → hard)
    const trueOrder = [...passOrder].sort((a, b) => numbers[a] - numbers[b]);
    const perRound = players
      .map((name, i) => ({ name, i, ...results[i] }))
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    return (
      <div className="flex min-h-[100svh] flex-col items-center overflow-y-auto p-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] text-white"
        style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}26, transparent 45%), #0E0828` }}>
        <p className="af-eyebrow mt-3">Manche {round}/{totalRounds} — Résultat · sur {numberRange}</p>
        <p className="cb-display-sm mt-1 mb-3">Le vrai classement</p>
        <div className="w-full max-w-md space-y-1.5">
          {trueOrder.map((idx, i) => {
            const num = numbers[idx];
            return (
              <div key={idx} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5">
                <span className="cb-mono w-5 text-white/40">{i + 1}.</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full font-mono font-bold text-white" style={{ background: ACCENT, opacity: 0.3 + (num / numberRange) * 0.7 }}>{num}</span>
                <span className="flex-1 font-semibold">{players[idx]}</span>
              </div>
            );
          })}
        </div>

        <p className="af-eyebrow mt-6 mb-2" style={{ color: ACCENT }}>Précision de chacun</p>
        <div className="w-full max-w-md space-y-2">
          {perRound.map((p) => (
            <div key={p.i} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", p.perfect ? "border-emerald-500/40 bg-emerald-500/[0.1]" : "border-white/10 bg-black/30")}>
              <MascotAvatar color={colorForIndex(p.i)} size={30} mood={p.perfect ? "wink" : "happy"} />
              <span className="flex-1 font-semibold">{p.name}</span>
              <span className="cb-mono text-sm text-white/60">{p.correct}/{p.total}{p.perfect ? " 🎉" : ""}</span>
              <span className="cb-mono font-bold" style={{ color: ACCENT }}>+{p.points}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { if (round >= totalRounds) setPhase("over"); else { setThemeCursor((c) => c + 1); startRound(round + 1); } }}
          className="af-btn af-btn-primary mt-6 mb-4 w-full max-w-md">{round >= totalRounds ? "Voir les scores" : "Manche suivante"}</button>
      </div>
    );
  }
  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], i })).sort((a, b) => b.score - a.score);
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] text-white"
      style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}2e, transparent 45%), #0E0828` }}>
      <p className="af-eyebrow" style={{ color: ACCENT }}>Partie terminée</p>
      <h2 className="cb-display-lg mt-1 mb-5">Meilleur flair</h2>
      <div className="w-full max-w-sm space-y-2">
        {ranking.map((p, idx) => (
          <div key={p.i} className="flex items-center justify-between rounded-2xl border p-4"
            style={{ background: idx === 0 ? `${ACCENT}22` : "rgba(255,255,255,0.04)", borderColor: idx === 0 ? `${ACCENT}55` : "var(--line-soft)" }}>
            <div className="flex items-center gap-3">
              <span className="cb-mono w-7 font-bold" style={{ color: idx === 0 ? ACCENT : "var(--text-muted)" }}>#{idx + 1}</span>
              <MascotAvatar color={colorForIndex(p.i)} size={34} mood={idx === 0 ? "wink" : "happy"} />
              <span className="font-bold">{p.name}</span>
            </div>
            <span className="cb-mono font-bold" style={{ color: idx === 0 ? ACCENT : "#fff" }}>{p.score}</span>
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

// ══════════════════════════════════════════════════════════
// MODE ONLINE (multi-appareils) — tout le monde classe
// ══════════════════════════════════════════════════════════
function TopTenOnline({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "top-ten", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as TopTenState;

  const nameOf = useCallback(
    (id: string) => state?.players?.find((p) => p.id === id)?.name ?? "?",
    [state?.players]
  );

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return (
      <Centered>
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-sm"
            style={{ boxShadow: `0 0 40px ${ACCENT}22` }}
          >
            <Flame size={36} strokeWidth={2.4} color={ACCENT} aria-hidden />
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg">
            Distribution des num&eacute;ros...
          </p>
        </div>
      </Centered>
    );
  }

  // ── CONFIG (choix du score cible avant la 1re manche) ───
  if (state.phase === "config") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}1c, transparent 45%), #060606` }}>
        <RangePicker
          range={(state.numberRange as 10 | 25 | 50) ?? 10}
          onPick={(r) => sendAction({ action: "set-range", range: r })}
          pack={state.pack ?? "adult"}
          onPickPack={(p) => sendAction({ action: "set-pack", pack: p })}
          onStart={() => sendAction({ action: "begin-game" })}
          shared
        />
      </div>
    );
  }

  // ── INTRO ───────────────────────────────────────────────
  if (state.phase === "intro") {
    return (
      <Centered>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
          Manche {state.round}/{state.totalRounds} · sur {state.numberRange}
        </span>
        <Flame size={48} strokeWidth={2.4} color={ACCENT} className="mb-6" aria-hidden />
        <p className="text-2xl font-serif font-semibold text-white/90 mb-3 text-center px-6" style={{ textShadow: `0 0 40px ${ACCENT}33` }}>
          Chacun reçoit un numéro secret
        </p>
        <p className="text-sm text-white/45 font-sans max-w-xs text-center">
          De 1 ({SCALE[state.pack ?? "adult"].low.toLowerCase()}) à {state.numberRange} ({SCALE[state.pack ?? "adult"].high.toLowerCase()}). Réponds à voix haute selon ton numéro… puis chacun classe toute la table, <b className="text-white/75">toi compris</b>.
        </p>
      </Centered>
    );
  }

  // ── THEME (on voit la phrase AVANT les numéros) ─────────
  if (state.phase === "theme") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-5 md:p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}16, transparent 45%), #060606` }}
      >
        <Header round={state.round} total={state.totalRounds} range={state.numberRange} pack={state.pack ?? "adult"} />
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <ThemeCard theme={state.theme} range={state.numberRange} pack={state.pack ?? "adult"} />
          <button
            onClick={() => sendAction({ action: "start-answering" })}
            className="mt-7 w-full max-w-md py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
          >
            C&apos;est bon → voir mon numéro
          </button>
          <button
            onClick={() => sendAction({ action: "change-theme" })}
            className="mt-3 w-full max-w-md py-3 rounded-2xl font-sans text-sm font-semibold text-white/70 border border-white/15 bg-white/[0.04] transition-all hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <GameInlineIcon icon={RefreshCw} /> Changer de thème
          </button>
          <p className="text-xs text-white/35 font-sans mt-3 text-center max-w-xs">
            N&apos;importe qui peut changer la phrase ou lancer la distribution.
          </p>
        </div>
      </div>
    );
  }

  // ── ANSWERING ───────────────────────────────────────────
  if (state.phase === "answering") {
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}14, transparent 45%), #060606` }}
      >
        <Header round={state.round} total={state.totalRounds} range={state.numberRange} pack={state.pack ?? "adult"} />

        {/* Theme card */}
        <div className="mt-4 mb-6 w-full max-w-md">
          <ThemeCard theme={state.theme} range={state.numberRange} pack={state.pack ?? "adult"} />
        </div>

        {/* My secret number */}
        {state.isSpectator ? (
          <p className="mt-2 max-w-xs text-center text-sm text-white/50 font-sans">
            👀 Tu es arrivé(e) en cours de partie : tu regardes cette manche, tu joueras à la prochaine partie.
          </p>
        ) : (
          <NumberCard myNumber={state.myNumber} range={state.numberRange} />
        )}

        <button
          onClick={() => sendAction({ action: "start-ordering" })}
          className="mt-7 w-full max-w-md py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
        >
          Tout le monde a parlé → Classer
        </button>
        <p className="text-xs text-white/35 font-sans mt-3 text-center max-w-xs">
          Quand chacun a donné sa réponse à voix haute, lance le classement (n&apos;importe qui peut le faire).
        </p>
      </div>
    );
  }

  // ── ORDERING (tout le monde classe) ─────────────────────
  if (state.phase === "ordering") {
    const expected = state.activeCount ?? state.players.length;
    if (state.iSubmitted || state.isSpectator) {
      return (
        <Centered>
          <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
            Manche {state.round}/{state.totalRounds} · sur {state.numberRange}
          </span>
          <div className="mb-4 flex justify-center"><GameIconBadge icon={state.isSpectator ? Eye : Check} bg={state.isSpectator ? "#FFFFFF" : "#3DDC97"} size={52} /></div>
          <p className="text-2xl font-serif font-semibold text-white/90 mb-3 text-center px-6">
            {state.isSpectator ? "Les joueurs classent la table" : "Classement envoyé"}
          </p>
          <p className="text-sm text-white/40 font-sans animate-pulse">
            {state.submittedCount}/{expected} ont validé…
          </p>
          {state.orderRemainingMs != null && (
            <OrderCountdown key={state.round} remainingMs={state.orderRemainingMs} />
          )}
        </Centered>
      );
    }
    return (
      <OrderingBoard
        key={`${state.round}-${state.numberedOrder.join(",")}`}
        ids={state.numberedOrder}
        nameOf={nameOf}
        myId={playerId}
        onSubmit={(order) => sendAction({ action: "submit-order", order })}
        round={state.round}
        total={state.totalRounds}
        range={state.numberRange}
        pack={state.pack ?? "adult"}
        submittedCount={state.submittedCount}
        playerCount={expected}
        remainingMs={state.orderRemainingMs ?? null}
      />
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const trueOrder = state.trueOrder ?? [];
    const myResult = state.roundResults?.[playerId];
    const ranking = [...(state.players ?? [])]
      .map((p) => ({ ...p, res: state.roundResults?.[p.id] }))
      .sort((a, b) => (b.res?.points ?? 0) - (a.res?.points ?? 0));
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] overflow-y-auto"
        style={{
          background: myResult?.perfect
            ? `radial-gradient(circle at 50% 20%, ${ACCENT}22, transparent 50%), #060606`
            : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.04), transparent 45%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-3 mt-1">
          Manche {state.round}/{state.totalRounds} · sur {state.numberRange} — R&eacute;sultat
        </span>

        <p
          className={cn("text-3xl font-serif font-semibold mb-1 text-center", myResult?.perfect ? "text-white/95" : "text-white/85")}
          style={myResult?.perfect ? { textShadow: `0 0 40px ${ACCENT}55` } : undefined}
        >
          {myResult?.perfect
            ? "🎉 Classement parfait !"
            : myResult
            ? `Toi : ${myResult.correct}/${myResult.total} bien placés`
            : "Résultat"}
        </p>
        <p className="text-xs text-white/35 font-sans mb-4 text-center">Le vrai classement (soft → hard)</p>

        {/* Vrai classement */}
        <div className="w-full max-w-md space-y-1.5 mb-5">
          {trueOrder.map((id, i) => {
            const num = state.revealNumbers?.[id] ?? 0;
            return (
              <div key={id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-xs text-white/30 font-mono w-5">{i + 1}.</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono font-bold text-sm text-white"
                  style={{ background: ACCENT, opacity: 0.25 + (num / (state.numberRange ?? 10)) * 0.75 }}
                >
                  {num}
                </span>
                <span className="text-sm font-sans font-semibold text-white/85 flex-1 truncate">
                  {nameOf(id)}
                  {id === playerId && <span className="text-white/35"> (toi)</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Précision de chacun */}
        <p className="text-xs text-white/30 font-sans uppercase tracking-[0.25em] mb-2" style={{ color: `${ACCENT}cc` }}>
          Précision de chacun
        </p>
        <div className="w-full max-w-md space-y-2">
          {ranking.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-sm",
                p.res?.perfect ? "border-emerald-500/35 bg-emerald-500/[0.09]" : "border-white/10 bg-black/30"
              )}
            >
              <span className="text-sm font-sans font-semibold text-white/85 flex-1 truncate">
                {p.name}
                {p.id === playerId && <span className="text-white/35"> (toi)</span>}
              </span>
              <span className="text-xs font-mono text-white/50">
                {p.res ? `${p.res.correct}/${p.res.total}` : "—"}{p.res?.perfect ? " 🎉" : ""}
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: ACCENT }}>+{p.res?.points ?? 0}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/35 font-sans mt-5 animate-pulse">Manche suivante...</p>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}18, transparent 45%), #060606` }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-2">Partie termin&eacute;e</span>
        <Flame size={40} strokeWidth={2.4} color={ACCENT} className="mb-6" aria-hidden />
        <div className="w-full max-w-sm space-y-2.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-3xl border p-4 backdrop-blur-sm",
                i === 0 ? "border-rose-500/35 bg-rose-500/10" : "border-white/10 bg-black/30"
              )}
              style={i === 0 ? { boxShadow: `0 0 25px ${ACCENT}33` } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={cn("text-xl font-mono font-bold w-8", i === 0 ? "text-rose-400" : "text-white/25")}>
                  #{i + 1}
                </span>
                <span className={cn("text-sm font-sans font-semibold", i === 0 ? "text-white/90" : "text-white/45")}>
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
              </div>
              <span
                className={cn("text-xl font-mono font-bold", i === 0 ? "text-rose-400" : "text-white/40")}
                style={i === 0 ? { textShadow: `0 0 15px ${ACCENT}55` } : undefined}
              >
                {p.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── FALLBACK ────────────────────────────────────────────
  return (
    <Centered>
      {error ? (
        <p className="text-sm text-red-400 font-sans font-semibold">{error}</p>
      ) : (
        <p className="text-white/40 animate-pulse font-sans text-lg">Chargement...</p>
      )}
    </Centered>
  );
}

// ── Sub-components ────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
      style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}10, transparent 45%), #060606` }}
    >
      {children}
    </div>
  );
}

function Header({ round, total, range, pack = "adult" }: { round: number; total: number; range: number; pack?: Pack }) {
  return (
    <div className="flex w-full max-w-md items-center justify-between">
      <span className="text-xs text-white/25 font-sans tracking-wide">
        Manche {round}/{total} · sur {range}
      </span>
      <span
        className="mr-14 text-xs px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider"
        style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
      >
        {PACK_LABEL[pack]}
      </span>
    </div>
  );
}

// ── Choix de l'échelle des numéros (1→10 / 25 / 50) ─────
function RangePicker({
  range,
  onPick,
  pack,
  onPickPack,
  onStart,
  onBack,
  shared,
}: {
  range: 10 | 25 | 50;
  onPick: (r: 10 | 25 | 50) => void;
  pack?: Pack;
  onPickPack?: (p: Pack) => void;
  onStart: () => void;
  onBack?: () => void;
  shared?: boolean;
}) {
  const OPTIONS: { v: 10 | 25 | 50; label: string; sub: string }[] = [
    { v: 10, label: "Classique", sub: "De 1 à 10" },
    { v: 25, label: "Nuance", sub: "De 1 à 25" },
    { v: 50, label: "Sniper", sub: "De 1 à 50" },
  ];
  const PACKS: { v: Pack; icon: LucideIcon; label: string; sub: string }[] = [
    { v: "adult", icon: Flame, label: "Soirée 18+", sub: "Thèmes osés & malaise" },
    { v: "culture", icon: Trophy, label: "Culture pop", sub: "Classements : animés, villes, foot…" },
  ];
  return (
    <div className="flex w-full max-w-md flex-col items-center text-white">
      {pack != null && onPickPack && (
        <>
          <p className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: `${ACCENT}cc` }}>
            Type de thèmes
          </p>
          <div className="grid w-full grid-cols-2 gap-2.5 mb-6">
            {PACKS.map((o) => {
              const active = o.v === pack;
              return (
                <button
                  key={o.v}
                  onClick={() => onPickPack(o.v)}
                  className={cn(
                    "rounded-3xl border p-4 text-center transition-all active:scale-[0.97]",
                    active ? "shadow-lg" : "hover:bg-white/[0.04]"
                  )}
                  style={{
                    borderColor: active ? `${ACCENT}aa` : "rgba(255,255,255,0.10)",
                    background: active ? `${ACCENT}1e` : "rgba(0,0,0,0.32)",
                    boxShadow: active ? `0 0 30px ${ACCENT}44` : undefined,
                  }}
                >
                  <o.icon size={26} strokeWidth={2.6} className="mx-auto" style={{ color: active ? ACCENT : "#fff" }} aria-hidden />
                  <p className="text-xs font-semibold mt-1 text-white/90">{o.label}</p>
                  <p className="text-xs text-white/45 mt-0.5 leading-tight">{o.sub}</p>
                </button>
              );
            })}
          </div>
        </>
      )}
      <p className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: `${ACCENT}cc` }}>
        Échelle des numéros
      </p>
      <h2 className="text-3xl font-serif font-semibold text-white/95 mb-1 text-center">
        Les numéros vont jusqu&apos;à…
      </h2>
      <p className="text-xs text-white/35 font-sans mb-6 text-center px-3">
        Chacun reçoit un numéro secret et répond à voix haute selon son intensité. Ensuite, chacun classe toute la table (lui compris). Plus l&apos;échelle est haute, plus il faut être précis.
      </p>
      <div className="grid w-full grid-cols-3 gap-2.5">
        {OPTIONS.map((o) => {
          const active = o.v === range;
          return (
            <button
              key={o.v}
              onClick={() => onPick(o.v)}
              className={cn(
                "rounded-3xl border p-4 text-center transition-all active:scale-[0.97]",
                active ? "shadow-lg" : "hover:bg-white/[0.04]"
              )}
              style={{
                borderColor: active ? `${ACCENT}aa` : "rgba(255,255,255,0.10)",
                background: active ? `${ACCENT}1e` : "rgba(0,0,0,0.32)",
                boxShadow: active ? `0 0 30px ${ACCENT}44` : undefined,
              }}
            >
              <p className="cb-mono text-3xl font-bold text-white" style={{ color: active ? ACCENT : "#fff" }}>
                {o.v}
              </p>
              <p className="text-xs font-semibold mt-0.5 text-white/85">{o.label}</p>
              <p className="text-xs text-white/45 mt-0.5 leading-tight">{o.sub}</p>
            </button>
          );
        })}
      </div>
      <button
        onClick={onStart}
        className="mt-7 w-full py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
      >
        Lancer la partie
      </button>
      {shared && (
        <p className="text-xs text-white/35 font-sans mt-3 text-center">
          N&apos;importe qui peut changer l&apos;échelle ou lancer.
        </p>
      )}
      {onBack && (
        <button onClick={onBack} className="mt-2 min-h-11 px-4 text-sm text-white/40 active:text-white/70"><GameInlineIcon icon={ArrowLeft} /> Modifier les joueurs</button>
      )}
    </div>
  );
}

function ThemeCard({ theme, range = 10, pack = "adult" }: { theme: ThemeState | null; range?: number; pack?: Pack }) {
  return (
    <div
      className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm p-6"
      style={{ boxShadow: `0 0 40px ${ACCENT}1a` }}
    >
      <p className="text-xs text-white/35 font-sans uppercase tracking-[0.2em] mb-3 text-center">
        {PACK_LABEL[pack]} · échelle 1 → {range}
      </p>
      <p className="text-2xl font-serif font-semibold text-white/95 text-center leading-snug">
        {theme?.theme}
      </p>
      <div className="mt-5 flex items-stretch gap-2 text-center">
        <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <p className="text-emerald-400 font-mono font-bold text-lg">1</p>
          <p className="text-xs text-white/55 font-sans leading-tight mt-1">{theme?.low}</p>
        </div>
        <div className="flex items-center text-white/30 text-xs font-sans">vers</div>
        <div className="flex-1 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5">
          <p className="font-mono font-bold text-lg" style={{ color: ACCENT }}>{range}</p>
          <p className="text-xs text-white/55 font-sans leading-tight mt-1">{theme?.high}</p>
        </div>
      </div>
    </div>
  );
}

function NumberCard({ myNumber, range = 10 }: { myNumber: number | null; range?: number }) {
  return (
    <div className="flex flex-col items-center mt-2">
      <p className="text-xs text-white/35 font-sans mb-3 uppercase tracking-[0.15em]">Ton num&eacute;ro secret · sur {range}</p>
      <div
        className="flex h-32 w-32 items-center justify-center rounded-3xl border backdrop-blur-sm"
        style={{
          borderColor: `${ACCENT}55`,
          background: "rgba(0,0,0,0.4)",
          boxShadow: `0 0 50px ${ACCENT}33`,
        }}
      >
        <span className="text-7xl font-serif font-bold text-white/95" style={{ textShadow: `0 0 30px ${ACCENT}66` }}>
          {myNumber ?? "?"}
        </span>
      </div>
      <p className="text-sm text-white/45 font-sans mt-5 max-w-xs text-center leading-relaxed">
        Donne une r&eacute;ponse <span className="text-white/80">à voix haute</span> qui colle à
        l&apos;intensit&eacute; de ton num&eacute;ro <span className="text-white/75">(sur {range})</span>. Les autres devront te ranger au bon endroit !
      </p>
    </div>
  );
}

// ── Drag & drop reorder board (touch + mouse) ─────────────
function OrderingBoard({
  ids,
  nameOf,
  onSubmit,
  round,
  total,
  range,
  pack = "adult",
  myId,
  rankerName,
  submittedCount,
  playerCount,
  remainingMs,
}: {
  ids: string[];
  nameOf: (id: string) => string;
  onSubmit: (order: string[]) => void;
  round: number;
  total: number;
  range: number;
  pack?: Pack;
  myId?: string;
  rankerName?: string;
  submittedCount?: number;
  playerCount?: number;
  remainingMs?: number | null;
}) {
  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handlePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (submitted) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    e.preventDefault();
    const y = e.clientY;
    // Find which item we're hovering over
    let targetId: string | null = null;
    for (const id of order) {
      const el = itemRefs.current.get(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        targetId = id;
        break;
      }
    }
    if (!targetId || targetId === dragId) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragId);
      const to = prev.indexOf(targetId!);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
  };

  const handlePointerUp = () => setDragId(null);

  const move = (id: string, dir: -1 | 1) => {
    if (submitted) return;
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(order);
  };

  return (
    <div
      className="flex flex-1 flex-col p-5 md:p-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]"
      style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}14, transparent 45%), #060606` }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex items-center justify-between mb-1 mr-14">
        <span className="text-xs text-white/35 font-sans tracking-wide">Manche {round}/{total} · sur {range}</span>
        <span
          className="text-xs px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider"
          style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
        >
          {rankerName ? rankerName : "Ton classement"}
        </span>
      </div>
      <p className="text-center text-lg font-serif font-semibold text-white/90 mt-2 mb-1">
        Classe-les du {SCALE[pack].lowFull} au {SCALE[pack].highFull}
      </p>
      <p className="text-center text-xs text-white/40 font-sans mb-2">
        Toi compris ! Glisse avec la poignée ⠿ ou utilise les flèches.
      </p>
      {remainingMs != null && <OrderCountdown key={round} remainingMs={remainingMs} />}
      <div className="flex items-center justify-between max-w-md w-full mx-auto px-1 mb-3">
        <span className="text-xs text-emerald-400 font-sans uppercase tracking-wider">↑ 1 · {SCALE[pack].low}</span>
        <span className="text-xs font-sans uppercase tracking-wider" style={{ color: ACCENT }}>{range} · {SCALE[pack].high} ↓</span>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto space-y-2 select-none">
        {order.map((id, i) => {
          const isDragging = id === dragId;
          const isMe = myId != null && id === myId;
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) itemRefs.current.set(id, el);
                else itemRefs.current.delete(id);
              }}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-2 py-1.5 backdrop-blur-sm transition-shadow",
                isDragging
                  ? "border-white/40 bg-black/60 shadow-2xl scale-[1.02]"
                  : isMe
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/10 bg-black/35"
              )}
              style={isDragging ? { boxShadow: `0 0 30px ${ACCENT}44` } : undefined}
            >
              <span className="text-sm font-mono font-bold w-6 text-center text-white/30">{i + 1}</span>
              <div
                onPointerDown={handlePointerDown(id)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/45 cursor-grab active:cursor-grabbing active:bg-white/10 touch-none"
                style={{ touchAction: "none" }}
                role="button"
                aria-label="Glisser pour réordonner"
              >
                <DotsIcon />
              </div>
              <span className="flex-1 text-sm font-sans font-semibold text-white/90 truncate">
                {nameOf(id)}
                {isMe && <span className="text-white/35"> (toi)</span>}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => move(id, -1)}
                  disabled={i === 0 || submitted}
                  aria-label="Monter"
                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 text-white/55 disabled:opacity-20 active:bg-white/15 active:scale-90"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(id, 1)}
                  disabled={i === order.length - 1 || submitted}
                  aria-label="Descendre"
                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 text-white/55 disabled:opacity-20 active:bg-white/15 active:scale-90"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={submit}
        disabled={submitted}
        className="mt-4 w-full max-w-md mx-auto py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
      >
        {submitted
          ? submittedCount != null
            ? `Envoyé — ${submittedCount}/${playerCount}…`
            : "Classement envoyé..."
          : "Valider mon classement"}
      </button>
    </div>
  );
}

// Compte à rebours de la phase de classement (calculé localement à partir du temps restant reçu)
function OrderCountdown({ remainingMs }: { remainingMs: number }) {
  const [deadline] = useState(() => Date.now() + remainingMs);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));
  const urgent = left <= 10;
  return (
    <p
      className={cn("text-center text-sm font-mono font-bold mb-3", urgent && "animate-pulse")}
      style={{ color: urgent ? ACCENT : "rgba(255,255,255,0.55)" }}
    >
      <GameInlineIcon icon={Timer} /> {left} s
    </p>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
      {[4, 10, 16].map((cy) =>
        [4, 10].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" />)
      )}
    </svg>
  );
}
