"use client";

/**
 * TU PRÉFÈRES ? — dilemmes party sur un seul téléphone (pass-and-play).
 * On choisit une ambiance, on lit le dilemme à voix haute, tout le monde
 * vote « à 3 avec la main », puis on tape une carte pour révéler le score
 * « des gens » + une petite punchline. 100% local (LocalGame stub).
 */

import { useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { LocalShell } from "@/components/games/local-kit";

const ACCENT = "#FF8A3D";

type Cat = "classique" | "hot" | "absurde" | "couple";
interface Dilemma { a: string; b: string; aPct: number; quip?: string }

const PACKS: Record<Cat, { emoji: string; label: string; color: string; tag: string; list: Dilemma[] }> = {
  classique: {
    emoji: "🎲", label: "Classique", color: "#5B9CFF", tag: "Pour tout le monde",
    list: [
      { a: "Voler comme un oiseau", b: "Être invisible", aPct: 58 },
      { a: "Ne plus jamais manger de fromage", b: "Ne plus jamais manger de chocolat", aPct: 47 },
      { a: "Vivre sans musique", b: "Vivre sans films & séries", aPct: 38 },
      { a: "Toujours dire la vérité", b: "Toujours mentir", aPct: 71 },
      { a: "Gagner 1 million tout de suite", b: "Gagner 5 000 €/mois à vie", aPct: 44 },
      { a: "Pouvoir téléporter", b: "Voyager dans le temps", aPct: 52 },
      { a: "Ne plus jamais avoir froid", b: "Ne plus jamais avoir chaud", aPct: 49 },
      { a: "Lire dans les pensées", b: "Parler toutes les langues", aPct: 55 },
      { a: "Vivre 200 ans en bonne santé", b: "Revivre tes 20 ans pour toujours", aPct: 46 },
      { a: "Ne plus avoir de réseau social", b: "Ne plus regarder de séries", aPct: 60 },
      { a: "Être super riche mais seul", b: "Fauché mais entouré", aPct: 34, quip: "L'argent ne fait pas le bonheur… paraît-il." },
      { a: "Connaître la date de ta mort", b: "Connaître la cause", aPct: 41 },
      { a: "Toujours avoir trop chaud aux pieds", b: "Toujours avoir une chaussette mouillée", aPct: 63 },
      { a: "Ne plus jamais te tromper", b: "Toujours apprendre de tes erreurs", aPct: 48 },
    ],
  },
  hot: {
    emoji: "🌶️", label: "Chaud", color: "#FF3E6E", tag: "18+ entre potes",
    list: [
      { a: "Avouer ton plus gros crush", b: "Montrer ton historique de recherche", aPct: 56 },
      { a: "Embrasser ton ex", b: "Embrasser le/la dernier(e) crush du groupe", aPct: 50 },
      { a: "Lire tes messages à voix haute", b: "Laisser quelqu'un poster sur ton compte", aPct: 47 },
      { a: "Dire qui tu trouves le/la plus beau/belle ici", b: "Faire un gage choisi par le groupe", aPct: 52 },
      { a: "Révéler ton nombre de relations", b: "Révéler ton pire rendez-vous", aPct: 44 },
      { a: "Un date parfait avec un inconnu", b: "Un date moyen avec ton crush", aPct: 39 },
      { a: "Te faire larguer par message", b: "Larguer quelqu'un en personne", aPct: 58 },
      { a: "Que ton crush sache tout", b: "Ne jamais rien tenter", aPct: 61, quip: "Qui ne tente rien…" },
      { a: "Sortir avec quelqu'un de trop drôle", b: "Quelqu'un de trop beau", aPct: 64 },
      { a: "Avouer un mensonge à ton/ta partenaire", b: "Garder le secret à vie", aPct: 49 },
      { a: "Un ex qui revient", b: "Un crush qui se déclare", aPct: 70 },
    ],
  },
  absurde: {
    emoji: "🤪", label: "Absurde", color: "#3DDC97", tag: "Pour les tordus",
    list: [
      { a: "Avoir des doigts en saucisse", b: "Un nez qui coule en continu", aPct: 55 },
      { a: "Parler comme un présentateur 24/7", b: "Chanter chaque phrase", aPct: 48 },
      { a: "Te battre contre 100 canards taille poulet", b: "1 cheval taille canard", aPct: 62 },
      { a: "Avoir toujours une chaussure qui couine", b: "Éternuer toutes les 5 minutes", aPct: 51 },
      { a: "Voir le futur mais éternuer à chaque fois", b: "Lire les pensées mais entendre un bip", aPct: 47 },
      { a: "Une tête 2x plus grosse", b: "Des mains 2x plus petites", aPct: 44 },
      { a: "Manger uniquement épicé", b: "Manger uniquement fade", aPct: 53 },
      { a: "Que tout le monde t'entende penser", b: "Voir les rêves des autres", aPct: 46 },
      { a: "Avoir un cri de chèvre", b: "Un rire de méchant de dessin animé", aPct: 57 },
      { a: "Téléporter mais nu à chaque fois", b: "Voler mais à 3 km/h", aPct: 41, quip: "Pas de bon choix ici." },
    ],
  },
  couple: {
    emoji: "❤️", label: "Couple", color: "#FF6BAE", tag: "À deux",
    list: [
      { a: "Un week-end surprise", b: "Un cadeau coûteux", aPct: 66 },
      { a: "Que ton/ta partenaire soit ton meilleur ami", b: "Ta plus grande passion", aPct: 58 },
      { a: "Vous disputer puis vous réconcilier", b: "Ne jamais vous disputer mais rester distants", aPct: 72 },
      { a: "Petit-déj au lit chaque dimanche", b: "Massage chaque soir", aPct: 49 },
      { a: "Connaître toutes ses pensées", b: "Garder du mystère", aPct: 43 },
      { a: "Vivre la même journée parfaite en boucle ensemble", b: "Une vie pleine de hauts et de bas", aPct: 38 },
      { a: "Un mot doux chaque matin", b: "Un câlin de 5 min chaque soir", aPct: 52 },
      { a: "Voyager partout sans maison", b: "Une maison de rêve sans voyager", aPct: 47 },
      { a: "Qu'il/elle cuisine tous les jours", b: "Qu'il/elle range tout tout le temps", aPct: 55 },
    ],
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function TuPrefereGame({ onReturnToLobby }: GameProps) {
  const [cat, setCat] = useState<Cat | null>(null);
  const [deck, setDeck] = useState<Dilemma[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);

  const startPack = (c: Cat) => { setCat(c); setDeck(shuffle(PACKS[c].list)); setIdx(0); setPicked(null); };
  const current = deck[idx];
  const accent = cat ? PACKS[cat].color : ACCENT;

  const next = () => {
    if (idx + 1 >= deck.length) { setDeck(shuffle(PACKS[cat!].list)); setIdx(0); }
    else setIdx(idx + 1);
    setPicked(null);
  };

  // ── Choix d'ambiance ──
  if (!cat) {
    return (
      <LocalShell accent={ACCENT} center>
        <div className="mb-2 text-5xl sm:text-6xl">🤔</div>
        <h1 className="cb-display-lg text-center sm:text-5xl">Tu préfères ?</h1>
        <p className="mt-2 mb-7 max-w-sm text-center text-sm sm:text-base" style={{ color: "var(--text-dim)" }}>
          Un dilemme, deux choix impossibles. Lisez à voix haute, votez « à 3 » avec la main, puis tapez pour voir ce que pensent les gens.
        </p>
        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          {(Object.keys(PACKS) as Cat[]).map((c) => {
            const p = PACKS[c];
            return (
              <button key={c} onClick={() => startPack(c)}
                className="flex flex-col items-start gap-1 rounded-3xl border p-4 text-left transition active:scale-95"
                style={{ background: `linear-gradient(160deg, ${p.color}22, rgba(255,255,255,0.03))`, borderColor: `${p.color}66` }}>
                <span className="text-3xl">{p.emoji}</span>
                <span className="cb-display-sm">{p.label}</span>
                <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{p.tag}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onReturnToLobby} className="mt-7 text-sm" style={{ color: "var(--text-muted)" }}>← Quitter</button>
      </LocalShell>
    );
  }

  const bPct = current ? 100 - current.aPct : 50;
  const Card = ({ side, text, pct }: { side: "a" | "b"; text: string; pct: number }) => {
    const isPicked = picked === side;
    const dim = picked && !isPicked;
    return (
      <button onClick={() => !picked && setPicked(side)}
        className="relative flex-1 overflow-hidden rounded-3xl border p-5 text-left transition active:scale-[0.98]"
        style={{
          background: isPicked ? `linear-gradient(160deg, ${accent}44, ${accent}18)` : "rgba(255,255,255,0.05)",
          borderColor: isPicked ? accent : "var(--line-soft)",
          opacity: dim ? 0.5 : 1, minHeight: 132,
        }}>
        <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold" style={{ background: accent, color: "#180c2e" }}>{side.toUpperCase()}</div>
        <div className="text-lg font-semibold leading-snug sm:text-xl">{text}</div>
        {picked && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: accent, transition: "width .6s cubic-bezier(.4,1.3,.5,1)" }} />
            </div>
            <div className="mt-1 text-2xl font-extrabold" style={{ color: accent }}>{pct}%</div>
          </div>
        )}
      </button>
    );
  };

  return (
    <LocalShell accent={accent}>
      <div className="flex w-full max-w-md items-center justify-between">
        <button onClick={() => setCat(null)} className="text-sm" style={{ color: "var(--text-muted)" }}>← Ambiances</button>
        <span className="af-eyebrow" style={{ color: "var(--text-dim)" }}>{PACKS[cat].emoji} {PACKS[cat].label} · {idx + 1}/{deck.length}</span>
      </div>

      <div className="mt-6 mb-1 text-center">
        <div className="af-eyebrow" style={{ color: accent }}>Tu préfères…</div>
      </div>

      <div className="flex w-full max-w-md flex-1 flex-col gap-3 sm:max-w-xl">
        {current && <Card side="a" text={current.a} pct={current.aPct} />}
        <div className="self-center rounded-full border px-4 py-1 text-sm font-bold" style={{ borderColor: "var(--line-soft)", color: "var(--text-dim)" }}>OU</div>
        {current && <Card side="b" text={current.b} pct={bPct} />}
      </div>

      <div className="mt-5 mb-2 w-full max-w-md">
        {picked ? (
          <>
            {current?.quip && <p className="mb-3 text-center text-sm italic" style={{ color: "var(--text-dim)" }}>« {current.quip} »</p>}
            <button onClick={next} className="af-btn af-btn-primary w-full" style={{ fontSize: 16 }}>Question suivante →</button>
          </>
        ) : (
          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>Votez tous en même temps, puis tapez une carte pour révéler.</p>
        )}
      </div>
    </LocalShell>
  );
}
