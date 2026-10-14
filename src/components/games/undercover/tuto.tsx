"use client";

/**
 * Tuto en slides de L'Intrus (mode local / app) : mot secret, indices, vote, rôles bonus.
 * La 4e slide (Fantôme / Bouffon) n'apparaît que si l'un de ces rôles est activé.
 */

import { type I18n, useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Badge, Blob, Bubble, CAST, Card, INK, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

/** Les textes SVG en police display collent les mots : on rétablit l'espace entre les mots. */
const WS_CSS = ".gt-ws text{word-spacing:0.28em}";

type S = {
  slides: { title: string; text: string }[];
  pizza: string; burger: string;
  clues: [string, string, string, string];
  out: string; impostor: string;
};

const STR: I18n<S> = {
  fr: {
    slides: [
      { title: "Un mot secret", text: "Chacun voit son mot en secret. Tous ont « Pizza »… sauf l'Intrus, qui a « Burger » sans le savoir !" },
      { title: "Un indice chacun", text: "Dans l'ordre, dis un seul mot sur ton mot. Pas trop clair, pas trop flou ! Léa : « italien ». Inès : « rapide »." },
      { title: "Éliminez le suspect", text: "Mettez-vous d'accord et éliminez le plus louche. Les civils gagnent quand tous les imposteurs sont sortis." },
      { title: "Les rôles bonus", text: "Le Fantôme n'a aucun mot : il bluffe. Et le Bouffon gagne seul s'il se fait éliminer !" },
    ],
    pizza: "PIZZA", burger: "BURGER",
    clues: ["italien", "fromage", "four", "rapide…"],
    out: "ÉLIMINÉE", impostor: "INTRUS",
  },
  en: {
    slides: [
      { title: "One secret word", text: "Everyone sees their word in secret. All have \"Pizza\"… except the Impostor, who has \"Burger\" without knowing!" },
      { title: "One clue each", text: "In order, say one word about your word. Not too obvious, not too vague! Léa: \"Italian\". Inès: \"fast\"." },
      { title: "Vote out the suspect", text: "Agree together and vote out the shadiest. Civilians win once every impostor is out." },
      { title: "Bonus roles", text: "The Ghost gets no word: they bluff. And the Jester wins alone if voted out!" },
    ],
    pizza: "PIZZA", burger: "BURGER",
    clues: ["Italian", "cheese", "oven", "fast…"],
    out: "VOTED OUT", impostor: "IMPOSTOR",
  },
  es: {
    slides: [
      { title: "Una palabra secreta", text: "Cada uno ve su palabra en secreto. Todos tienen «Pizza»… menos el Impostor, que tiene «Hamburguesa» ¡sin saberlo!" },
      { title: "Una pista cada uno", text: "Por orden, di una sola palabra sobre la tuya. ¡Ni muy clara ni muy vaga! Léa: «italiana». Inès: «rápida»." },
      { title: "Eliminad al sospechoso", text: "Poneos de acuerdo y eliminad al más sospechoso. Los civiles ganan cuando echan a todos los impostores." },
      { title: "Roles extra", text: "El Fantasma no tiene palabra: se tira el farol. ¡Y el Bufón gana solo si lo eliminan!" },
    ],
    pizza: "PIZZA", burger: "HAMBURGUESA",
    clues: ["italiana", "queso", "horno", "rápida…"],
    out: "ELIMINADA", impostor: "IMPOSTOR",
  },
};

/** Part de pizza. */
function Pizza({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-10 -9 Q0 -14 10 -9 L0 11 Z" fill="#FFD23F" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d="M-10 -9 Q0 -14 10 -9" fill="none" stroke="#E08A2E" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={-3} cy={-4} r={2} fill="#FF6B5B" />
      <circle cx={3} cy={1} r={2} fill="#FF6B5B" />
    </g>
  );
}

/** Burger. */
function Burger({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-11 -2 Q-11 -12 0 -12 Q11 -12 11 -2 Z" fill="#E08A2E" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <rect x={-12} y={-2} width={24} height={4} rx={2} fill="#3DDC97" stroke={INK} strokeWidth={1.6} />
      <rect x={-11} y={2} width={22} height={4} rx={2} fill="#7A3B1F" stroke={INK} strokeWidth={1.6} />
      <path d="M-11 6 L11 6 Q11 11 0 11 Q-11 11 -11 6 Z" fill="#E08A2E" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

/** Bulle de pensée ronde avec un contenu. */
function Thought({ x, y, children, className, delay = 0 }: { x: number; y: number; children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className} style={{ animationDelay: `${delay}s` }}>
        <circle cx={-6} cy={24} r={2.5} fill="#fff" stroke={INK} strokeWidth={1.5} />
        <circle cx={-2} cy={18} r={3.5} fill="#fff" stroke={INK} strokeWidth={1.5} />
        <circle cx={0} cy={0} r={15} fill="#fff" stroke={INK} strokeWidth={2.5} />
        {children}
      </g>
    </g>
  );
}

function ArtWord({ s }: { s: S }) {
  const who = [CAST.lea, CAST.malik, CAST.tom, CAST.ines];
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      {who.map((c, i) => {
        const x = 30 + i * 53;
        const imp = i === 3;
        return (
          <g key={i}>
            <Blob x={x} y={146} s={40} color={c} mood={imp ? "smirk" : "happy"} className={imp ? undefined : "gt-bob"} style={{ animationDelay: `${i * 0.2}s` }} />
            <Thought x={x + 6} y={70} className="gt-pop" delay={i * 0.25}>
              {imp ? <Burger x={0} y={0} s={0.95} /> : <Pizza x={0} y={0} s={0.95} />}
            </Thought>
            {imp && <SvgText x={x + 22} y={50} text="?" size={16} fill="#fff" outline className="gt-blink" />}
          </g>
        );
      })}
      <SvgText x={84} y={22} text={`${s.pizza} ×3`} size={14} fill="#FFD23F" outline />
      <SvgText x={214} y={22} text={s.burger} size={s.burger.length > 7 ? 10 : 12} fill="#FF3EA5" outline anchor="end" />
      </g>
    </TutoSvg>
  );
}

function ArtClues({ s }: { s: S }) {
  const who = [CAST.lea, CAST.malik, CAST.tom, CAST.ines];
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      {who.map((c, i) => {
        const x = 30 + i * 53;
        const high = i % 2 === 0;
        return (
          <g key={i}>
            <Blob x={x} y={148} s={38} color={c} mood={i === 3 ? "panic" : "talk"} className={i === 3 ? "gt-shake" : undefined} />
            <Badge x={x} y={96} r={9} text={String(i + 1)} fill="#fff" />
            <Bubble x={x - 26} y={high ? 18 : 50} w={52} h={22} text={s.clues[i]} size={10.5} className="gt-pop" style={{ animationDelay: `${i * 0.35}s` }} />
          </g>
        );
      })}
      {/* gouttes de sueur sur Inès */}
      <path d="M206 112 Q209 118 206 121 Q203 118 206 112 Z" fill="#4ECDC4" stroke={INK} strokeWidth={1.5} className="gt-blink" />
      </g>
    </TutoSvg>
  );
}

function ArtVote({ s }: { s: S }) {
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      <Blob x={30} y={146} s={36} color={CAST.lea} mood="happy" />
      <Blob x={68} y={146} s={36} color={CAST.malik} mood="happy" />
      <Blob x={106} y={146} s={36} color={CAST.tom} mood="happy" />
      <Arrow d="M40 108 Q110 70 160 104" head={[160, 104, 35]} color="#FF6B5B" width={3.5} className="gt-blink" />
      <Blob x={180} y={146} s={44} color={CAST.ines} mood="panic" />
      {/* carte d'Inès qui se retourne */}
      <g className="gt-fade-a"><Card x={152} y={18} w={56} h={40} fill="#fff" text="?" size={20} /></g>
      <g className="gt-fade-b">
        <Card x={152} y={18} w={56} h={40} fill="#FF3EA5">
          <SvgText x={28} y={14} text={s.impostor} size={9} fill="#fff" outline />
          <Burger x={28} y={30} s={0.7} />
        </Card>
      </g>
      <g transform="translate(64 40) rotate(-10)">
        <g className="gt-pop">
          <rect x={-46} y={-13} width={92} height={26} rx={6} fill="none" stroke="#FF3EA5" strokeWidth={3} />
          <SvgText x={0} y={1} text={s.out} size={13} fill="#FF3EA5" />
        </g>
      </g>
      </g>
    </TutoSvg>
  );
}

function ArtBonus() {
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      {/* Fantôme : drap + bulle vide */}
      <g className="gt-float">
        <path d="M30 140 L30 92 Q30 62 56 62 Q82 62 82 92 L82 140 L74 132 L66 140 L56 132 L46 140 L38 132 Z" fill="#F4F0FF" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <circle cx={48} cy={90} r={4} fill={INK} />
        <circle cx={64} cy={90} r={4} fill={INK} />
        <ellipse cx={56} cy={106} rx={5} ry={6} fill={INK} />
      </g>
      <Bubble x={20} y={18} w={48} h={26} text="" />
      {[34, 44, 54].map((cx, i) => <circle key={cx} cx={cx} cy={31} r={3} fill={INK} className="gt-blink" style={{ animationDelay: `${i * 0.2}s` }} />)}
      {/* Bouffon : chapeau à grelots, doigts pointés */}
      <Blob x={162} y={146} s={50} color={CAST.hugo} mood="happy" className="gt-wiggle">
        <path d="M-24 -26 L-30 -52 L-8 -32 L0 -58 L8 -32 L30 -52 L24 -26 Z" fill="#FFD23F" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={-30} cy={-54} r={4.5} fill="#FF3EA5" stroke={INK} strokeWidth={2} />
        <circle cx={0} cy={-60} r={4.5} fill="#4ECDC4" stroke={INK} strokeWidth={2} />
        <circle cx={30} cy={-54} r={4.5} fill="#FF3EA5" stroke={INK} strokeWidth={2} />
      </Blob>
      <Arrow d="M110 34 L136 64" head={[136, 64, 50]} color="#FF6B5B" width={3.5} className="gt-blink" />
      <Arrow d="M212 30 L196 60" head={[196, 60, 118]} color="#FF6B5B" width={3.5} className="gt-blink" />
      <SvgText x={196} y={100} text="ha ha!" size={11} fill="#FFD23F" outline className="gt-pulse" />
      </g>
    </TutoSvg>
  );
}

/** Slides du tuto ; `bonus` = Fantôme ou Bouffon activé. */
export function useUndercoverTuto(bonus: boolean): TutoSlide[] {
  const s = useT(STR);
  const arts = [<ArtWord key="w" s={s} />, <ArtClues key="c" s={s} />, <ArtVote key="v" s={s} />, <ArtBonus key="b" />];
  const slides = s.slides.map((sl, i) => ({ ...sl, art: arts[i] }));
  return bonus ? slides : slides.slice(0, 3);
}
