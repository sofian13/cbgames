"use client";

import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { IdeaButton } from "@/components/games/idea-button";
import { ShareResultButton } from "@/components/games/share-result-button";
import { ZButton, ZLink, ZRanking, ZScreen, ZTitle, ZZ } from "@/components/games/local-kit";
import { rankingCard } from "@/lib/share-cards";
import { decideWinners, rankingOf, useGameFinished, type GameScores } from "@/lib/game-finished";
import { WIN_STR } from "@/lib/winners-text";
import { SoireeNextButton } from "@/components/games/soiree-next";
import { CHUT_STR } from "./i18n";
import { MODES_STR } from "./modes-i18n";
import { ChutStyles, SentenceCard, useReducedMotion, type Sentence } from "./shared";

export interface EndRow { name: string; score: number | string; colorIndex: number; note?: string }

/**
 * Écran de fin commun aux modes micro : classement, peine du dernier (ou égalité),
 * Rejouer / Quitter / Partager. Émet le signal de fin de partie.
 */
export function ModeEnd({ title, top, rows, unit, loser, tieNote, result, complete = true, tools, overlays, onReplay, onQuit }: {
  title?: string;
  top?: ReactNode;
  rows: EndRow[];
  unit: string;
  loser: { name: string; colorIndex: number; sentence: Sentence; onReroll: () => void; title?: string } | null;
  tieNote?: string | null;
  /** Ce que le jeu sait du résultat (gagnants explicites ou scores) → signal de fin de partie */
  result?: { winners?: string[]; scores?: GameScores };
  /** false : « Terminer » avant que chacun ait joué → pas de gagnant */
  complete?: boolean;
  tools: ReactNode;
  overlays: ReactNode;
  onReplay: () => void;
  onQuit?: () => void;
}) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const reduced = useReducedMotion();
  const w = useT(WIN_STR);
  // Couronnés à l'écran = gagnants de la Soirée (règle unique)
  const ranks = complete && result?.scores ? rankingOf(result.scores) : [];
  const winners = complete ? decideWinners({ winners: result?.winners, ranking: ranks }) : [];
  useGameFinished(true, complete ? { loser: loser?.name ?? null, ...result } : { noWinner: true });
  return (
    <ZScreen tools={tools}>
      {overlays}
      <ChutStyles />
      {!reduced && <ConfettiBurst count={50} />}
      <ZTitle size="clamp(40px, 12vw, 56px)" as="h1" className="text-center">{title ?? m.endTitle}</ZTitle>
      {top}
      <div className="mt-5">
        <ZRanking rows={rows.map((r) => ({ ...r, rank: ranks.find((x) => x.name === r.name.trim())?.rank }))} unit={unit} winners={winners} />
      </div>
      {!complete && <p className="mt-4 text-center text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{w.incomplete}</p>}
      {loser && <SentenceCard name={loser.name} colorIndex={loser.colorIndex} sentence={loser.sentence} onReroll={loser.onReroll} title={loser.title} />}
      {!loser && tieNote && <p className="mt-5 text-center text-[16px] font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{tieNote}</p>}
      <div className="mt-auto flex flex-col items-center gap-1 pt-7">
        <SoireeNextButton className="mb-2" />
        <ZButton bg={ZZ.pink} onClick={onReplay}>{t.replay}</ZButton>
        {onQuit && <ZLink onClick={onQuit}>{t.quit}</ZLink>}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <ShareResultButton bg={ZZ.yellow} card={() => rankingCard("chut", rows, unit)} />
          <IdeaButton game={t.name} kind="carte" bg={ZZ.cream} />
        </div>
      </div>
    </ZScreen>
  );
}
