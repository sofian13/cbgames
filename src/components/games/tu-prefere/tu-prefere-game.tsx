"use client";

/**
 * TU PRÉFÈRES ? — dilemmes party sur un seul téléphone (pass-and-play).
 * On choisit une ambiance, on lit le dilemme à voix haute, tout le monde
 * lève la main pour son choix, on compte les mains sur l'écran, puis on
 * révèle le résultat du groupe + une petite punchline. 100% local.
 */

import { useEffect, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { DISPLAY, ZButton, ZCard, ZChip, ZLink, ZScreen, ZTitle, inkOn, useScrollTopOn } from "@/components/games/local-kit";
import { Mascot } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { ArrowLeft, Dices, Flame, Hand, Heart, Laugh, Minus, type LucideIcon } from "lucide-react";
import { GameIconButton, GameIconBadge, GameInlineIcon, GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { CLASSIQUE, CHAUD, ABSURDE, COUPLE, type DilemmaTuple } from "@/components/games/tu-prefere/dilemmas";

type Cat = "classique" | "hot" | "absurde" | "couple";
interface Dilemma { a: string; b: string; quip: string }

const toDilemmas = (list: DilemmaTuple[]): Dilemma[] => list.map(([a, b, quip]) => ({ a, b, quip }));

const PACKS: Record<Cat, { icon: LucideIcon; label: string; color: string; tag: string; list: Dilemma[] }> = {
  classique: { icon: Dices, label: "Classique", color: "#4ECDC4", tag: "Pour tout le monde", list: toDilemmas(CLASSIQUE) },
  hot: { icon: Flame, label: "Chaud", color: "#FF3EA5", tag: "18+ entre potes", list: toDilemmas(CHAUD) },
  absurde: { icon: Laugh, label: "Absurde", color: "#3DDC97", tag: "Pour les tordus", list: toDilemmas(ABSURDE) },
  couple: { icon: Heart, label: "Couple", color: "#FF6B5B", tag: "À deux", list: toDilemmas(COUPLE) },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Carte d'une option : tap = +1 main levée, bouton − pour corriger. Après révélation : % du groupe.
function OptionCard({
  side, text, count, total, revealed, winner, color, tilt, onInc, onDec,
}: {
  side: "a" | "b"; text: string; count: number; total: number; revealed: boolean; winner: boolean;
  color: string; tilt: number; onInc: () => void; onDec: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const dim = revealed && !winner;
  const bg = revealed ? (winner ? color : "#fff") : side === "a" ? "#fff" : "#FFF6E5";
  return (
    <div
      className="relative flex flex-1 flex-col rounded-[26px] transition-opacity"
      style={{ background: bg, color: inkOn(bg), border: `3px solid ${GAME_INK}`, boxShadow: `0 6px 0 ${GAME_INK}`, rotate: `${tilt}deg`, opacity: dim ? 0.6 : 1, minHeight: 132 }}
    >
      <button
        type="button"
        onClick={onInc}
        disabled={revealed}
        className="flex-1 px-5 pb-2 pt-4 text-left"
        aria-label={`Compter une main pour : ${text}`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full text-[18px]"
          style={{ ...DISPLAY, background: side === "a" ? "#FFD23F" : "#FF3EA5", color: GAME_INK, border: `2.5px solid ${GAME_INK}` }}>
          {side.toUpperCase()}
        </span>
        <p className="mt-2 break-words hyphens-auto" style={{ ...DISPLAY, fontSize: text.length > 50 ? 22 : 25, lineHeight: 1.05 }}>{text}</p>
      </button>
      <div className="flex items-center justify-between gap-2 px-4 pb-3.5">
        {revealed ? (
          <span style={{ ...DISPLAY, fontSize: 34, lineHeight: 1 }}>{pct}%</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[16px] font-bold">
            <Hand size={18} strokeWidth={2.6} aria-hidden /> {count} main{count > 1 ? "s" : ""}
          </span>
        )}
        {revealed ? (
          <span className="text-[15px] font-bold">{count} main{count > 1 ? "s" : ""}</span>
        ) : (
          count > 0 && <GameIconButton icon={Minus} label="Retirer une main" onClick={onDec} />
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

  useEffect(() => { preloadSfx(["pop", "pop2", "whoosh", "gong", "card-slide", "card-flip", "select", "ding", "win"]); }, []);
  useScrollTopOn(`${cat}-${idx}`);

  const startPack = (c: Cat) => {
    playSfx("card-flip", { volume: 0.7 });
    setCat(c); setDeck(shuffle(PACKS[c].list)); setIdx(0); setVotes({ a: 0, b: 0 }); setRevealed(false);
  };
  const current = deck[idx];
  const color = cat ? PACKS[cat].color : "#4ECDC4";
  const total = votes.a + votes.b;

  const next = () => {
    playSfx("card-slide", { volume: 0.7 });
    if (idx + 1 >= deck.length) { setDeck(shuffle(PACKS[cat!].list)); setIdx(0); }
    else setIdx(idx + 1);
    setVotes({ a: 0, b: 0 });
    setRevealed(false);
  };
  const bump = (side: "a" | "b", d: 1 | -1) => {
    if (revealed) return;
    const n = Math.max(0, Math.min(99, votes[side] + d));
    if (n === votes[side]) return;
    // Une main de plus : « pop » qui monte avec le nombre de mains
    if (d > 0) playSfx(side === "a" ? "pop" : "pop2", { volume: 0.6, rate: Math.min(1.6, 0.9 + n * 0.06) });
    setVotes({ ...votes, [side]: n });
  };
  const reveal = () => {
    const tie = votes.a === votes.b;
    playCombo("reveal");
    if (!tie && Math.max(votes.a, votes.b) === total) playSfx("win", { volume: 0.6, delay: 0.35 }); // unanimité
    setRevealed(true);
  };

  // ── Choix d'ambiance ──
  if (!cat) {
    return (
      <ZScreen>
        <div className="flex items-end gap-3">
          <ZTitle as="h1" size={52} style={{ lineHeight: 0.92 }}>Tu préfères&nbsp;?</ZTitle>
          <div className="-mb-1 shrink-0"><Mascot size={74} color="sky" mood="thinking" shadow={false} /></div>
        </div>
        <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
          Deux choix impossibles. Lisez-le à voix haute, levez la main, comptez les mains… et découvrez ce que pense le groupe.
        </p>
        <ZTitle size={28} className="mt-7">L&apos;ambiance</ZTitle>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(Object.keys(PACKS) as Cat[]).map((c, i) => {
            const pk = PACKS[c];
            return (
              <button key={c} type="button" onClick={() => startPack(c)}
                className="flex min-h-[132px] flex-col items-start gap-1 rounded-[22px] p-3.5 text-left transition-[translate,box-shadow] shadow-[0_5px_0_#15082E] active:translate-y-[4px] active:shadow-[0_1px_0_#15082E]"
                style={{ background: pk.color, color: inkOn(pk.color), border: `3px solid ${GAME_INK}`, rotate: `${i % 2 ? 1.5 : -1.5}deg` }}>
                <GameIconBadge icon={pk.icon} bg="#fff" size={40} />
                <span className="mt-1 text-[22px] leading-none" style={DISPLAY}>{pk.label}</span>
                <span className="text-[14px] font-semibold leading-tight">{pk.tag} · {pk.list.length}</span>
              </button>
            );
          })}
        </div>
        <div className="min-h-8 flex-1" />
        <div className="flex justify-center"><IdeaButton game="Tu préfères" kind="dilemme" /></div>
        {onReturnToLobby && <ZLink onClick={onReturnToLobby} className="mt-2"><GameInlineIcon icon={ArrowLeft} /> Retour à l&apos;accueil</ZLink>}
      </ZScreen>
    );
  }

  const winner: "a" | "b" | "tie" | null = !revealed || total === 0 ? null : votes.a === votes.b ? "tie" : votes.a > votes.b ? "a" : "b";

  return (
    <ZScreen tools={<IdeaButton game="Tu préfères" kind="dilemme" compact bg="#fff" />}>
      {revealed && winner !== "tie" && total > 1 && Math.max(votes.a, votes.b) === total && <ConfettiBurst count={36} />}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setCat(null)} className="min-h-11" aria-label="Changer d'ambiance">
          <ZChip bg={color} tilt={-2}><GameInlineIcon icon={PACKS[cat].icon} /> {PACKS[cat].label}</ZChip>
        </button>
        <ZChip bg="#fff" tilt={2}>{idx + 1}/{deck.length}</ZChip>
      </div>
      <ZTitle size={38} className="mt-3">Tu préfères…</ZTitle>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        {current && (
          <OptionCard side="a" text={current.a} count={votes.a} total={total} revealed={revealed} tilt={-1}
            winner={winner === "a" || winner === "tie"} color={color} onInc={() => bump("a", 1)} onDec={() => bump("a", -1)} />
        )}
        <div className="relative z-[1] -my-4 self-center">
          <span className="grid h-14 w-14 place-items-center rounded-full text-[22px]"
            style={{ ...DISPLAY, background: GAME_INK, color: "#fff", border: "3px solid #fff", rotate: "-6deg" }}>ou</span>
        </div>
        {current && (
          <OptionCard side="b" text={current.b} count={votes.b} total={total} revealed={revealed} tilt={1}
            winner={winner === "b" || winner === "tie"} color={color} onInc={() => bump("b", 1)} onDec={() => bump("b", -1)} />
        )}
      </div>

      <div className="mt-5">
        {revealed ? (
          <>
            <ZCard bg="#FFD23F" tilt={-1.5} shadow={4} radius={20} className="px-4 py-3">
              <p className="text-[19px] leading-tight" style={DISPLAY}>
                {winner === "tie" ? "Égalité parfaite, la table est coupée en deux !" : `La table a choisi ${winner === "a" ? "A" : "B"} !`}
              </p>
              {current?.quip && <p className="mt-1 text-[15px] font-semibold leading-snug">{current.quip}</p>}
            </ZCard>
            <ZButton bg={color} className="mt-5" onClick={next}>Dilemme suivant</ZButton>
          </>
        ) : (
          <>
            {total === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                  Levez la main ! Touchez une carte pour chaque main levée.
                </p>
                <RerollButton label="Pas fou ? Un autre" onClick={next} />
              </div>
            ) : (
              <ZButton bg="#FFD23F" onClick={reveal}>Voir le résultat ({total} main{total > 1 ? "s" : ""})</ZButton>
            )}
          </>
        )}
      </div>
    </ZScreen>
  );
}
