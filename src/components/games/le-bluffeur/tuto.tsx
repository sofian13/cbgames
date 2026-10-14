"use client";

/**
 * Le Bluffeur : tuto en slides (1re partie) + feuille de règles en jeu, FR / EN / ES.
 */

import { type I18n, useT } from "@/lib/i18n";
import { GameRulesSheet, type TutoSlide } from "@/components/games/game-tuto";
import { Badge, Blob, Bubble, CAST, Card, Finger, INK, Phone, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

type Txt = {
  slides: { title: string; text: string }[];
  word: string;
  blank: string;
  fake: string;
  options: [string, string, string];
  real: string;
  rulesName: string;
  rules: string[];
};

const TXT: I18n<Txt> = {
  fr: {
    slides: [
      { title: "Une question piège", text: "Celui qui tient le tél lit la question à voix haute : « Une personne callipyge a ___ ». Personne ne sait ? Parfait !" },
      { title: "Invente une fausse réponse", text: "Chacun son tour, en secret, écris une fausse réponse qui a l'air vraie. Malik écrit : « un grand nez »." },
      { title: "Trouve la vraie", text: "Tél au milieu, chacun vote. La vraie : +30. Chaque joueur piégé par ton bluff : +20 pour toi !" },
    ],
    word: "« callipyge »",
    blank: "a ___ ?",
    fake: "un grand nez",
    options: ["un grand nez", "de belles fesses", "peur du noir"],
    real: "VRAI",
    rulesName: "Le Bluffeur",
    rules: [
      "Celui qui tient le tél lit la question à voix haute. Personne ne connaît la réponse : c'est fait exprès !",
      "Chacun son tour, en secret, écris une fausse réponse crédible (ton bluff), puis passe le tél.",
      "Tél au milieu : la vraie réponse est mélangée aux bluffs. Chacun à son tour touche celle qu'il croit vraie.",
      "Trouver la vraie : +30. Chaque joueur piégé par ton bluff : +20 pour toi. Voter pour ton propre bluff ne rapporte rien.",
      "Tu as écrit la vraie réponse sans le savoir ? +15. Deux bluffs identiques n'en font qu'un (chaque auteur marque).",
      "Après 5 manches, le plus gros score gagne.",
    ],
  },
  en: {
    slides: [
      { title: "A tricky question", text: "Whoever holds the phone reads it out loud: \"A callipygian person has ___\". Nobody knows? Perfect!" },
      { title: "Make up a fake answer", text: "One by one, in secret, type a fake answer that sounds real. Malik types: \"a big nose\"." },
      { title: "Spot the real one", text: "Phone in the middle, everyone votes. The real one: +30. Each player fooled by your bluff: +20 for you!" },
    ],
    word: "\"callipygian\"",
    blank: "has ___?",
    fake: "a big nose",
    options: ["a big nose", "a shapely bottom", "a fear of the dark"],
    real: "TRUE",
    rulesName: "The Bluffer",
    rules: [
      "Whoever holds the phone reads the question out loud. Nobody knows the answer: that's the point!",
      "One by one, in secret, type a believable fake answer (your bluff), then pass the phone.",
      "Phone in the middle: the real answer is mixed in with the bluffs. Taking turns, everyone taps the one they think is real.",
      "Finding the real one: +30. Each player fooled by your bluff: +20 for you. Voting for your own bluff scores nothing.",
      "Typed the real answer without knowing? +15. Two identical bluffs become one (each author scores).",
      "After 5 rounds, the highest score wins.",
    ],
  },
  es: {
    slides: [
      { title: "Una pregunta trampa", text: "Quien tiene el móvil la lee en voz alta: «Una persona calipigia tiene ___». ¿Nadie lo sabe? ¡Perfecto!" },
      { title: "Inventa una respuesta falsa", text: "Por turnos y en secreto, escribe una respuesta falsa que parezca real. Malik escribe: «una nariz grande»." },
      { title: "Encuentra la verdadera", text: "Móvil en el centro, cada uno vota. La verdadera: +30. Cada jugador que cae en tu farol: ¡+20 para ti!" },
    ],
    word: "«calipigia»",
    blank: "tiene ___?",
    fake: "una nariz grande",
    options: ["una nariz grande", "unas nalgas bonitas", "miedo a la oscuridad"],
    real: "VERDAD",
    rulesName: "El Farsante",
    rules: [
      "Quien tiene el móvil lee la pregunta en voz alta. Nadie sabe la respuesta: ¡esa es la gracia!",
      "Por turnos y en secreto, escribe una respuesta falsa creíble (tu farol) y pasa el móvil.",
      "Móvil en el centro: la respuesta verdadera se mezcla con los faroles. Por turnos, cada uno toca la que cree verdadera.",
      "Acertar la verdadera: +30. Cada jugador que cae en tu farol: +20 para ti. Votar tu propio farol no da puntos.",
      "¿Escribiste la respuesta verdadera sin saberlo? +15. Dos faroles idénticos cuentan como uno (puntúa cada autor).",
      "Tras 5 rondas, gana la puntuación más alta.",
    ],
  },
};

function ArtQuestion({ t }: { t: Txt }) {
  return (
    <TutoSvg floor>
      {/* la question à trou, lue à voix haute */}
      <g className="gt-float">
        <Card x={44} y={10} w={132} h={54} fill="#fff" rot={-2}>
          <SvgText x={66} y={20} text={t.word} size={14} />
          <SvgText x={66} y={39} text={t.blank} size={14} fill="#E0218A" />
        </Card>
      </g>
      <Blob x={46} y={140} s={44} color={CAST.lea} mood="panic" />
      <Blob x={110} y={140} s={44} color={CAST.malik} mood="sad" />
      <Blob x={174} y={140} s={44} color={CAST.ines} mood="panic" />
      {[46, 110, 174].map((x, i) => (
        <g key={x} className="gt-pop" style={{ animationDelay: `${i * 0.3}s` }}>
          <SvgText x={x} y={78} text="???" size={15} fill="#FFD23F" outline />
        </g>
      ))}
      {/* ondes sonores : on lit à voix haute */}
      <path d="M180 30 Q188 37 180 44 M188 24 Q200 37 188 50" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" className="gt-blink" />
    </TutoSvg>
  );
}

function ArtWrite({ t }: { t: Txt }) {
  return (
    <TutoSvg floor>
      {/* Léa et Inès regardent ailleurs */}
      <Blob x={30} y={140} s={38} color={CAST.lea} mood="sleep" />
      <Blob x={192} y={140} s={38} color={CAST.ines} mood="sleep" />
      <SvgText x={30} y={84} text="z" size={13} fill="#fff" className="gt-float" />
      <SvgText x={192} y={84} text="z" size={13} fill="#fff" className="gt-float" />
      {/* Malik écrit en cachette, son nez s'allonge */}
      <Blob x={128} y={140} s={56} color={CAST.malik} mood="smirk">
        <g className="gt-pulse" style={{ transformOrigin: "-2px 2px" }}>
          <path d="M-2 0 L30 -2 Q34 2 30 6 L-2 6 Z" fill="#FFC9A8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      </Blob>
      <Phone x={58} y={66} w={40} h={64} rot={-10}>
        <rect x={4} y={22} width={28} height={6} rx={3} fill="#C9BFE6" />
        <rect x={4} y={32} width={20} height={6} rx={3} fill="#C9BFE6" />
        <path d="M12 6 L12 2 Q18 -3 24 2 L24 6" fill="none" stroke={INK} strokeWidth={2} />
        <rect x={10} y={6} width={16} height={11} rx={2} fill="#FFD23F" stroke={INK} strokeWidth={2} />
      </Phone>
      <Bubble x={64} y={14} w={128} h={26} text={t.fake} size={12} tail="down" tailX={22} className="gt-bob" />
    </TutoSvg>
  );
}

function ArtVote({ t }: { t: Txt }) {
  const rows = [
    { l: "A", text: t.options[0], y: 14 },
    { l: "B", text: t.options[1], y: 50 },
    { l: "C", text: t.options[2], y: 86 },
  ];
  return (
    <TutoSvg>
      {rows.map((r) => (
        <g key={r.l}>
          <rect x={10} y={r.y} width={150} height={30} rx={12} fill="#fff" stroke={INK} strokeWidth={2.5} />
          {r.l === "B" && <rect x={10} y={r.y} width={150} height={30} rx={12} fill="#3DDC97" stroke={INK} strokeWidth={2.5} className="gt-fade-b" />}
          <circle cx={26} cy={r.y + 15} r={10} fill="#FFD23F" stroke={INK} strokeWidth={2} />
          <SvgText x={26} y={r.y + 16} text={r.l} size={11} />
          <SvgText x={42} y={r.y + 16} text={r.text} size={r.text.length > 17 ? 9.5 : 11} anchor="start" />
        </g>
      ))}
      {/* Léa touche A (le bluff de Malik) : +20 pour Malik */}
      <Finger x={140} y={22} rot={-25} className="gt-fade-a" />
      <g className="gt-fade-a">
        <Blob x={190} y={84} s={40} color={CAST.malik} mood="wink" />
        <Badge x={190} y={30} r={16} fill="#FF3EA5" text="+20" size={12} className="gt-pulse" />
      </g>
      {/* Inès touche B : la vraie, +30 */}
      <g className="gt-fade-b">
        <Blob x={190} y={84} s={40} color={CAST.ines} mood="happy" />
        <Badge x={190} y={30} r={16} fill="#3DDC97" text="+30" size={12} className="gt-pulse" />
        <rect x={124} y={40} width={46} height={17} rx={8.5} fill="#fff" stroke={INK} strokeWidth={2} />
        <SvgText x={147} y={49} text={t.real} size={t.real.length > 4 ? 8.5 : 10} />
      </g>
      <Blob x={40} y={160} s={32} color={CAST.lea} mood="talk" />
      <Blob x={84} y={160} s={32} color={CAST.tom} mood="happy" />
    </TutoSvg>
  );
}

/** Slides du tuto (dans la langue courante). */
export function useBluffSlides(): TutoSlide[] {
  const t = useT(TXT);
  return [
    { ...t.slides[0], art: <ArtQuestion t={t} /> },
    { ...t.slides[1], art: <ArtWrite t={t} /> },
    { ...t.slides[2], art: <ArtVote t={t} /> },
  ];
}

/** Feuille de règles du Bluffeur (avec « Revoir le tuto »). */
export function BluffRules({ onClose, onTuto }: { onClose: () => void; onTuto: () => void }) {
  const t = useT(TXT);
  return <GameRulesSheet name={t.rulesName} rules={t.rules} onClose={onClose} onTuto={onTuto} />;
}
