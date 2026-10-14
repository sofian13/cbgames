"use client";

/**
 * Tuto en slides du Faux Témoin (remplace l'ancien écran « Comment on joue ? » de début de partie)
 * + petites consignes partagées (points, égalité au vote).
 */

import { type I18n, useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Blob, Bubble, CAST, Card, INK, Phone, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

/** Les textes SVG en police display collent les mots : on rétablit l'espace entre les mots. */
const WS_CSS = ".gt-ws text{word-spacing:0.28em}";

type S = {
  slides: { title: string; text: string }[];
  sawNothing: string; question: string; answer: string; caught: string;
  pointsLine: string;
  voteTie: string;
  names: [string, string, string];
};

const STR: I18n<S> = {
  fr: {
    slides: [
      { title: "Regarde la scène", text: "Chacun son tour, 5 secondes pour mémoriser une image. Sauf le Faux Témoin : lui ne voit rien ! (Dès 6 joueurs, ils peuvent être plusieurs.)" },
      { title: "Tout à l'oral", text: "L'app tire l'ordre : Léa → Tom, Tom → Inès… Léa demande « Combien de mouettes ? », Tom répond. Plus besoin de toucher le tél." },
      { title: "Démasquez-le", text: "À trois, pointez le suspect. Démasqué ? Une dernière bonne réponse et il marque quand même. Sinon, les témoins gagnent." },
    ],
    sawNothing: "Rien vu…", question: "Combien de mouettes ?", answer: "Euh… 5 ?", caught: "DÉMASQUÉ",
    pointsLine: "Points : Faux Témoin pas démasqué +3, démasqué mais bonne réponse +2, sinon +1 pour chaque témoin. Dès 6 joueurs, choisissez 2 Faux Témoins (3 dès 9) : on vote alors pour autant de suspects.",
    voteTie: "Égalité ? Revotez seulement entre les ex æquo.",
    names: ["Léa", "Tom", "Inès"],
  },
  en: {
    slides: [
      { title: "Look at the scene", text: "One by one, you get 5 seconds to memorise a picture. Except the Fake Witness: they see nothing! (From 6 players, there can be more than one.)" },
      { title: "All out loud", text: "The app picks the order: Léa → Tom, Tom → Inès… Léa asks \"How many seagulls?\", Tom answers. No need to touch the phone." },
      { title: "Unmask them", text: "On three, point at the suspect. Caught? One last right answer and they still score. Otherwise, the witnesses win." },
    ],
    sawNothing: "Saw nothing…", question: "How many seagulls?", answer: "Erm… 5?", caught: "BUSTED",
    pointsLine: "Points: Fake Witness not caught +3, caught but right answer +2, otherwise +1 for each witness. From 6 players, pick 2 Fake Witnesses (3 from 9): you then vote for that many suspects.",
    voteTie: "A tie? Vote again between the tied players only.",
    names: ["Léa", "Tom", "Inès"],
  },
  es: {
    slides: [
      { title: "Mira la escena", text: "Por turnos, 5 segundos para memorizar una imagen. ¡Menos el Falso Testigo: él no ve nada! (Desde 6 jugadores, pueden ser varios.)" },
      { title: "Todo en voz alta", text: "La app sortea el orden: Léa → Tom, Tom → Inès… Léa pregunta «¿Cuántas gaviotas?» y Tom responde. No hace falta tocar el móvil." },
      { title: "Desenmascáralo", text: "A la de tres, señalad al sospechoso. ¿Pillado? Una última respuesta correcta y puntúa igual. Si no, ganan los testigos." },
    ],
    sawNothing: "No vi nada…", question: "¿Cuántas gaviotas?", answer: "Eh… ¿5?", caught: "PILLADO",
    pointsLine: "Puntos: Falso Testigo no pillado +3, pillado pero acierta +2; si no, +1 para cada testigo. Desde 6 jugadores, elegid 2 Falsos Testigos (3 desde 9): se vota a tantos sospechosos.",
    voteTie: "¿Empate? Volved a votar solo entre los empatados.",
    names: ["Léa", "Tom", "Inès"],
  },
};

/** Petite plage : parasol rouge, chien, 3 mouettes (dans l'écran du tél, 48×82). */
function Beach() {
  return (
    <g>
      <rect x={0} y={0} width={48} height={50} fill="#9BE3FF" />
      <rect x={0} y={50} width={48} height={32} fill="#FFE29A" />
      <circle cx={38} cy={12} r={6} fill="#FFD23F" stroke={INK} strokeWidth={1.2} />
      {[8, 18, 27].map((x, i) => <path key={i} d={`M${x} ${20 + (i % 2) * 5} q3 -3 5 0 q2 -3 5 0`} fill="none" stroke={INK} strokeWidth={1.4} />)}
      <path d="M8 56 Q18 40 28 56 Z" fill="#FF6B5B" stroke={INK} strokeWidth={1.4} />
      <line x1={18} y1={52} x2={18} y2={72} stroke={INK} strokeWidth={1.6} />
      <ellipse cx={36} cy={68} rx={6} ry={4} fill="#C98A4B" stroke={INK} strokeWidth={1.2} />
      <circle cx={42} cy={64} r={3} fill="#C98A4B" stroke={INK} strokeWidth={1.2} />
    </g>
  );
}

function ArtLook({ s }: { s: S }) {
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      <Blob x={28} y={150} s={42} color={CAST.lea} mood="happy" />
      <Phone x={52} y={34} w={56} h={96} rot={-6} className="gt-bob"><Beach /></Phone>
      <Blob x={194} y={150} s={42} color={CAST.tom} mood="cool" />
      <Phone x={122} y={34} w={56} h={96} rot={6} screen="#15082E">
        <SvgText x={24} y={40} text="?" size={26} fill="#fff" className="gt-blink" />
      </Phone>
      <SvgText x={150} y={20} text={s.sawNothing} size={12} fill="#FFD23F" outline />
      <SvgText x={80} y={20} text="5 s" size={13} fill="#fff" outline />
      </g>
    </TutoSvg>
  );
}

function ArtAsk({ s }: { s: S }) {
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      <Phone x={82} y={46} w={56} h={92} screen="#FFF6E5">
        {/* L'ordre des questions tiré par l'app */}
        {[[0, 1], [1, 2], [2, 0]].map(([a, b], i) => (
          <g key={i}>
            <rect x={3} y={8 + i * 22} width={42} height={18} rx={6} fill={i === 0 ? "#FFD23F" : "#fff"} stroke={INK} strokeWidth={1.5} />
            <SvgText x={24} y={17.5 + i * 22} text={`${s.names[a]} → ${s.names[b]}`} size={6.5} />
          </g>
        ))}
      </Phone>
      <Blob x={34} y={150} s={44} color={CAST.lea} mood="talk" />
      <Bubble x={4} y={12} w={150} h={24} text={s.question} size={10} tailX={30} />
      <Blob x={186} y={150} s={44} color={CAST.tom} mood="panic" className="gt-shake" />
      <Bubble x={150} y={60} w={64} h={24} text={s.answer} size={11} tailX={36} className="gt-pop" />
      <path d="M206 92 Q209 98 206 101 Q203 98 206 92 Z" fill="#4ECDC4" stroke={INK} strokeWidth={1.5} className="gt-blink" />
      </g>
    </TutoSvg>
  );
}

function ArtUnmask({ s }: { s: S }) {
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      <Blob x={28} y={150} s={36} color={CAST.lea} mood="happy" />
      <Blob x={64} y={150} s={36} color={CAST.ines} mood="happy" />
      <Blob x={100} y={150} s={36} color={CAST.malik} mood="happy" />
      <Arrow d="M40 110 Q110 76 150 110" head={[150, 110, 40]} color="#FF6B5B" width={3.5} className="gt-blink" />
      <Blob x={176} y={150} s={46} color={CAST.tom} mood="panic" />
      {/* QCM de la dernière chance */}
      <g className="gt-pop">
        {["3", "5", "7"].map((v, i) => <Card key={v} x={140 + i * 24} y={44} w={20} h={24} fill={i === 0 ? "#3DDC97" : "#fff"} text={v} size={12} />)}
      </g>
      <g transform="translate(64 30) rotate(-8)">
        <g className="gt-pop" style={{ animationDelay: ".3s" }}>
          <rect x={-50} y={-13} width={100} height={26} rx={6} fill="none" stroke="#FF3EA5" strokeWidth={3} />
          <SvgText x={0} y={1} text={s.caught} size={13} fill="#FF3EA5" />
        </g>
      </g>
      <SvgText x={110} y={88} text="+3 · +2 · +1" size={11} fill="#FFD23F" outline />
      </g>
    </TutoSvg>
  );
}

export function useFTTuto(): TutoSlide[] {
  const s = useT(STR);
  const arts = [<ArtLook key="a" s={s} />, <ArtAsk key="b" s={s} />, <ArtUnmask key="c" s={s} />];
  return s.slides.map((sl, i) => ({ ...sl, art: arts[i] }));
}

/** Consignes courtes (points, égalité au vote). */
export function useFTExtra() {
  const s = useT(STR);
  return { pointsLine: s.pointsLine, voteTie: s.voteTie };
}
