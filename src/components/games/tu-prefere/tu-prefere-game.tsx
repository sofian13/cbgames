"use client";

/**
 * TU PRÉFÈRES ? — dilemmes party sur un seul téléphone (pass-and-play).
 * On choisit une ambiance, on lit le dilemme à voix haute, tout le monde
 * lève la main pour son choix, on compte les mains sur l'écran, puis on
 * révèle le résultat du groupe + une petite punchline. 100% local.
 */

import { useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { LocalShell } from "@/components/games/local-kit";
import { Mascot } from "@/components/Mascot";
import { ArrowLeft, Dices, Flame, Hand, Heart, Laugh, Minus, Plus, type LucideIcon } from "lucide-react";
import { GameIconButton, GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";
import { CLASSIQUE, CHAUD, ABSURDE, COUPLE, type DilemmaTuple } from "@/components/games/tu-prefere/dilemmas";

const ACCENT = "#FF8A3D";

type Cat = "classique" | "hot" | "absurde" | "couple";
interface Dilemma { a: string; b: string; quip: string }

const toDilemmas = (list: DilemmaTuple[]): Dilemma[] => list.map(([a, b, quip]) => ({ a, b, quip }));

const PACKS: Record<Cat, { icon: LucideIcon; label: string; color: string; tag: string; list: Dilemma[] }> = {
  classique: { icon: Dices, label: "Classique", color: "#5B9CFF", tag: "Pour tout le monde", list: toDilemmas(CLASSIQUE) },
  hot: { icon: Flame, label: "Chaud", color: "#FF3E6E", tag: "18+ entre potes", list: toDilemmas(CHAUD) },
  absurde: { icon: Laugh, label: "Absurde", color: "#3DDC97", tag: "Pour les tordus", list: toDilemmas(ABSURDE) },
  couple: { icon: Heart, label: "Couple", color: "#FF6BAE", tag: "À deux", list: toDilemmas(COUPLE) },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Carte d'une option : tap = +1 main levée, bouton − pour corriger. Après révélation : % du groupe.
function OptionCard({
  side, text, count, total, revealed, winner, accent, onInc, onDec,
}: {
  side: "a" | "b"; text: string; count: number; total: number; revealed: boolean; winner: boolean;
  accent: string; onInc: () => void; onDec: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const dim = revealed && !winner;
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border transition"
      style={{
        background: winner ? `linear-gradient(160deg, ${accent}44, ${accent}18)` : "rgba(255,255,255,0.05)",
        borderColor: winner ? accent : "var(--line-soft)",
        opacity: dim ? 0.6 : 1, minHeight: 132,
      }}>
      <button onClick={onInc} disabled={revealed}
        className="flex-1 p-5 pb-3 text-left transition active:scale-[0.98] disabled:active:scale-100"
        aria-label={`Compter une main pour : ${text}`}>
        <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold" style={{ background: accent, color: "#180c2e" }}>{side.toUpperCase()}</div>
        <div className="break-words text-lg font-semibold leading-snug hyphens-auto sm:text-xl">{text}</div>
        {revealed && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: accent, transition: "width .6s cubic-bezier(.4,1.3,.5,1)" }} />
            </div>
            <div className="mt-1 text-2xl font-extrabold" style={{ color: accent }}>{pct}%</div>
          </div>
        )}
      </button>
      <div className="flex items-center justify-between gap-2 px-4 pb-3">
        <span className="text-sm font-bold" style={{ color: "var(--text-dim)" }}>
          <GameInlineIcon icon={Hand} /> {count} main{count > 1 ? "s" : ""}
        </span>
        {!revealed && (
          <div className="flex gap-2">
            <GameIconButton icon={Minus} label="Retirer une main" onClick={onDec} disabled={count === 0} />
            <GameIconButton icon={Plus} label="Ajouter une main" onClick={onInc} bg={accent} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TuPrefereGame({ onReturnToLobby }: GameProps) {
  const [cat, setCat] = useState<Cat | null>(null);
  const [deck, setDeck] = useState<Dilemma[]>([]);
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [revealed, setRevealed] = useState(false);

  const startPack = (c: Cat) => { setCat(c); setDeck(shuffle(PACKS[c].list)); setIdx(0); setVotes({ a: 0, b: 0 }); setRevealed(false); };
  const current = deck[idx];
  const accent = cat ? PACKS[cat].color : ACCENT;
  const total = votes.a + votes.b;

  const next = () => {
    if (idx + 1 >= deck.length) { setDeck(shuffle(PACKS[cat!].list)); setIdx(0); }
    else setIdx(idx + 1);
    setVotes({ a: 0, b: 0 });
    setRevealed(false);
  };
  const bump = (side: "a" | "b", d: 1 | -1) => {
    if (revealed) return;
    setVotes((v) => ({ ...v, [side]: Math.max(0, Math.min(99, v[side] + d)) }));
  };

  // ── Choix d'ambiance ──
  if (!cat) {
    return (
      <LocalShell accent={ACCENT} center>
        <div style={{ height: "env(safe-area-inset-top)" }} />
        <div className="mb-2"><Mascot size={84} color="sky" mood="thinking" arms shadow={false} /></div>
        <h1 className="cb-display-lg text-center sm:text-5xl">Tu préfères ?</h1>
        <p className="mt-2 mb-7 max-w-sm text-center text-sm sm:text-base" style={{ color: "var(--text-dim)" }}>
          Un dilemme, deux choix impossibles. Lisez-le à voix haute, levez la main pour votre choix, comptez les mains sur l&apos;écran… et découvrez ce que pense le groupe.
        </p>
        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          {(Object.keys(PACKS) as Cat[]).map((c) => {
            const p = PACKS[c];
            return (
              <button key={c} onClick={() => startPack(c)}
                className="flex flex-col items-start gap-1 rounded-3xl border p-4 text-left transition active:scale-95"
                style={{ background: `linear-gradient(160deg, ${p.color}22, rgba(255,255,255,0.03))`, borderColor: `${p.color}66` }}>
                <GameIconBadge icon={p.icon} bg={p.color} size={42} />
                <span className="cb-display-sm">{p.label}</span>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>{p.tag} · {p.list.length} dilemmes</span>
              </button>
            );
          })}
        </div>
        {onReturnToLobby && (
          <button onClick={onReturnToLobby} className="mt-5 min-h-11 px-4 text-sm" style={{ color: "var(--text-muted)" }}><GameInlineIcon icon={ArrowLeft} /> Quitter</button>
        )}
      </LocalShell>
    );
  }

  const winner: "a" | "b" | "tie" | null = !revealed || total === 0 ? null : votes.a === votes.b ? "tie" : votes.a > votes.b ? "a" : "b";

  return (
    <LocalShell accent={accent}>
      <div style={{ height: "env(safe-area-inset-top)" }} />
      {/* Coin haut-droit laissé libre pour l'engrenage */}
      <div className="flex w-full max-w-md items-center pr-14">
        <button onClick={() => setCat(null)} className="-ml-2 min-h-11 px-2 text-sm" style={{ color: "var(--text-muted)" }}><GameInlineIcon icon={ArrowLeft} /> Ambiances</button>
      </div>

      <div className="mt-3 mb-2 text-center">
        <div className="af-eyebrow" style={{ color: "var(--text-dim)" }}><GameInlineIcon icon={PACKS[cat].icon} /> {PACKS[cat].label} · {idx + 1}/{deck.length}</div>
        <div className="af-eyebrow mt-1" style={{ color: accent }}>Tu préfères…</div>
      </div>

      <div className="flex w-full max-w-md flex-1 flex-col gap-3 sm:max-w-xl">
        {current && (
          <OptionCard side="a" text={current.a} count={votes.a} total={total} revealed={revealed}
            winner={winner === "a" || winner === "tie"} accent={accent} onInc={() => bump("a", 1)} onDec={() => bump("a", -1)} />
        )}
        <div className="self-center rounded-full border px-4 py-1 text-sm font-bold" style={{ borderColor: "var(--line-soft)", color: "var(--text-dim)" }}>OU</div>
        {current && (
          <OptionCard side="b" text={current.b} count={votes.b} total={total} revealed={revealed}
            winner={winner === "b" || winner === "tie"} accent={accent} onInc={() => bump("b", 1)} onDec={() => bump("b", -1)} />
        )}
      </div>

      <div className="mt-5 mb-2 w-full max-w-md" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {revealed ? (
          <>
            <p className="mb-2 text-center text-base font-bold" style={{ color: accent }}>
              {winner === "tie" ? "Égalité parfaite, le groupe est coupé en deux !" : `Le groupe a choisi ${winner === "a" ? "A" : "B"} !`}
            </p>
            {current?.quip && <p className="mb-3 text-center text-sm italic" style={{ color: "var(--text-dim)" }}>« {current.quip} »</p>}
            <button onClick={next} className="af-btn af-btn-primary w-full" style={{ fontSize: 16 }}>Question suivante →</button>
          </>
        ) : (
          <>
            <p className="mb-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Levez la main ! Tapez une carte (ou +) pour chaque main levée.
            </p>
            <button onClick={() => total > 0 ? setRevealed(true) : next()} className="af-btn af-btn-primary w-full" style={{ fontSize: 16 }}>
              {total > 0 ? `Voir le résultat du groupe (${total})` : "Passer ce dilemme →"}
            </button>
          </>
        )}
      </div>
    </LocalShell>
  );
}
