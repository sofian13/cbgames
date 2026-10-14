"use client";

/**
 * Tuto en slides du Test de pureté (1re partie, ou « Revoir le tuto » dans les règles).
 * La slide 2 dépend du mode : chacun son tour (secret), tous ensemble (groupe) ou solo.
 */

import { type I18n, useT } from "@/lib/i18n";
import type { TutoSlide } from "../game-tuto";
import { Arrow, Blob, CAST, Card, Finger, INK, Phone, SvgText, TutoSvg } from "../game-tuto-art";

type Txt = { title: string; text: string };
type Mode = "solo" | "secret" | "groupe";
const TUTO: I18n<{ q: [string, string]; yes: string; never: string; one: Txt; two: Record<Mode, Txt>; three: Txt; threeSolo: Txt }> = {
  fr: {
    q: ["As-tu déjà écrit à ton ex", "en pleine nuit ?"],
    yes: "Oui",
    never: "Jamais",
    one: { title: "As-tu déjà… ?", text: "Une question à la fois : « As-tu déjà… ? ». Oui = tu perds de la pureté. Jamais = tu restes un ange." },
    two: {
      secret: { title: "Chacun son tour, en secret", text: "Léa répond seule à toutes les questions, sans que personne regarde. Puis elle passe le tél à Tom." },
      groupe: { title: "Tous ensemble", text: "On lit la question à voix haute. Ceux qui l'ont déjà fait lèvent la main, et on les compte sur l'écran." },
      solo: { title: "Rien que toi", text: "Réponds seul à toutes les questions, honnêtement. Personne ne regarde, promis !" },
    },
    three: { title: "Ange ou démon ?", text: "Tél au milieu : grande révélation du plus pur au moins pur. 100\u00A0% = ange, 0\u00A0% = démon !" },
    threeSolo: { title: "Ange ou démon ?", text: "À la fin, ton score tombe : 100\u00A0% = ange, 0\u00A0% = démon. À toi de voir si tu le montres !" },
  },
  en: {
    q: ["Have you ever texted your ex", "in the middle of the night?"],
    yes: "Yes",
    never: "Never",
    one: { title: "Have you ever…?", text: "One question at a time: \"Have you ever…?\". Yes = you lose purity. Never = you stay an angel." },
    two: {
      secret: { title: "Your turn, in secret", text: "Léa answers all the questions alone, with nobody looking. Then she passes the phone to Tom." },
      groupe: { title: "All together", text: "Read the question out loud. Whoever has done it raises a hand, and you count them on the screen." },
      solo: { title: "Just you", text: "Answer all the questions on your own, honestly. Nobody's looking, promise!" },
    },
    three: { title: "Angel or demon?", text: "Phone in the middle: big reveal from purest to least pure. 100% = angel, 0% = demon!" },
    threeSolo: { title: "Angel or demon?", text: "At the end, your score drops: 100% = angel, 0% = demon. Up to you whether you show it!" },
  },
  es: {
    q: ["¿Alguna vez le has escrito", "a tu ex de madrugada?"],
    yes: "Sí",
    never: "Nunca",
    one: { title: "¿Alguna vez…?", text: "Una pregunta cada vez: «¿Alguna vez has…?». Sí = pierdes pureza. Nunca = sigues siendo un ángel." },
    two: {
      secret: { title: "Por turnos, en secreto", text: "Léa responde sola a todas las preguntas, sin que nadie mire. Luego pasa el móvil a Tom." },
      groupe: { title: "Todos juntos", text: "Se lee la pregunta en voz alta. Quien ya lo ha hecho levanta la mano, y se cuentan en la pantalla." },
      solo: { title: "Solo tú", text: "Responde tú solo a todas las preguntas, con sinceridad. ¡Nadie mira, prometido!" },
    },
    three: { title: "¿Ángel o demonio?", text: "Móvil en el centro: gran revelación del más puro al menos puro. ¡100\u00A0% = ángel, 0\u00A0% = demonio!" },
    threeSolo: { title: "¿Ángel o demonio?", text: "Al final sale tu puntuación: 100\u00A0% = ángel, 0\u00A0% = demonio. ¡Tú decides si la enseñas!" },
  },
};

/** Auréole au-dessus d'un blob (centre x, y). */
function Halo({ x, y, className = "gt-float" }: { x: number; y: number; className?: string }) {
  return (
    <g className={className}>
      <ellipse cx={x} cy={y} rx={15} ry={4.5} fill="none" stroke="#FFD23F" strokeWidth={4} />
      <ellipse cx={x} cy={y} rx={15} ry={4.5} fill="none" stroke={INK} strokeWidth={1.2} />
    </g>
  );
}

/** Cornes de petit diable (centre x, haut du crâne y). */
function Horns({ x, y, className = "gt-pulse" }: { x: number; y: number; className?: string }) {
  return (
    <g className={className}>
      <path d={`M${x - 14} ${y + 4} Q${x - 18} ${y - 8} ${x - 10} ${y - 12} Q${x - 10} ${y - 2} ${x - 5} ${y + 2} Z`} fill="#FF3B3B" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${x + 14} ${y + 4} Q${x + 18} ${y - 8} ${x + 10} ${y - 12} Q${x + 10} ${y - 2} ${x + 5} ${y + 2} Z`} fill="#FF3B3B" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

/** Bras levé (main en l'air) à côté d'un blob. */
function RaisedHand({ x, y }: { x: number; y: number }) {
  return (
    <g className="gt-wiggle">
      <path d={`M${x} ${y} L${x + 4} ${y - 22}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d={`M${x} ${y} L${x + 4} ${y - 22}`} stroke="#FFC9A8" strokeWidth={4} strokeLinecap="round" />
      <circle cx={x + 4} cy={y - 25} r={6} fill="#FFC9A8" stroke={INK} strokeWidth={2.2} />
    </g>
  );
}

export function usePureteTuto(mode: Mode): TutoSlide[] {
  const t = useT(TUTO);
  const two = t.two[mode];
  const three = mode === "solo" ? t.threeSolo : t.three;
  return [
    {
      ...t.one,
      art: (
        <TutoSvg floor>
          {/* carte question */}
          <Card x={20} y={12} w={180} h={42} fill="#FFF6E5">
            <SvgText x={90} y={14} text={t.q[0]} size={12} />
            <SvgText x={90} y={29} text={t.q[1]} size={12} />
          </Card>
          {/* Oui : cornes qui poussent */}
          <Blob x={62} y={136} s={50} color={CAST.tom} mood="smirk" />
          <Horns x={62} y={92} />
          <Card x={34} y={142} w={56} h={22} fill="#FF3B3B" text={t.yes} size={12} color="#fff" />
          {/* Jamais : auréole */}
          <Blob x={158} y={136} s={50} color={CAST.lea} mood="happy" />
          <Halo x={158} y={84} />
          <Card x={128} y={142} w={60} h={22} fill="#fff" text={t.never} size={12} />
        </TutoSvg>
      ),
    },
    {
      ...two,
      art:
        mode === "groupe" ? (
          <TutoSvg floor>
            <Blob x={34} y={150} s={42} color={CAST.lea} mood="happy" />
            <Blob x={82} y={150} s={42} color={CAST.tom} mood="smirk" />
            <RaisedHand x={100} y={128} />
            <Blob x={134} y={150} s={42} color={CAST.malik} mood="wink" />
            <RaisedHand x={152} y={128} />
            <Blob x={186} y={150} s={42} color={CAST.ines} mood="happy" />
            <Phone x={84} y={10} w={54} h={70}>
              <SvgText x={23} y={28} text="2 / 4" size={15} className="gt-pulse" />
            </Phone>
          </TutoSvg>
        ) : (
          <TutoSvg floor>
            {/* Léa répond en cachant l'écran */}
            <Blob x={52} y={150} s={58} color={CAST.lea} mood="smirk" />
            <Phone x={72} y={60} w={42} h={66} rot={-10}>
              <SvgText x={17} y={22} text="12/20" size={9} />
              <rect x={4} y={34} width={26} height={9} rx={4} fill="#FF3B3B" stroke={INK} strokeWidth={1.5} />
            </Phone>
            {mode === "secret" ? (
              <>
                {/* Tom dos tourné, qui sifflote */}
                <Blob x={176} y={150} s={52} color={CAST.tom} mood="sleep" />
                <SvgText x={196} y={84} text="♪" size={18} fill="#fff" className="gt-float" />
                <Arrow d="M118 70 Q150 44 170 78" head={[170, 78, 60]} dashed />
              </>
            ) : (
              <>
                <Finger x={104} y={108} />
                <SvgText x={170} y={70} text="100 %" size={22} fill="#FFD23F" outline className="gt-pulse" />
              </>
            )}
          </TutoSvg>
        ),
    },
    {
      ...three,
      art: (
        <TutoSvg>
          {/* classement : l'ange en haut, le démon en bas */}
          <g transform="translate(0 0)">
            <Card x={40} y={14} w={150} h={36} fill="#FFF6E5" />
            <Blob x={64} y={48} s={28} color={CAST.lea} mood="happy" />
            <Halo x={64} y={20} />
            <SvgText x={150} y={33} text="92 %" size={18} />
          </g>
          <Card x={40} y={60} w={150} h={36} fill="#FFF6E5" />
          <Blob x={64} y={94} s={28} color={CAST.malik} mood="wink" />
          <SvgText x={150} y={79} text="55 %" size={18} />
          <g className="gt-shake">
            <Card x={40} y={108} w={150} h={36} fill="#FF3B3B" />
            <Blob x={64} y={142} s={28} color={CAST.tom} mood="smirk" />
            <Horns x={64} y={113} className="" />
            <SvgText x={150} y={127} text="12 %" size={18} fill="#fff" />
          </g>
        </TutoSvg>
      ),
    },
  ];
}
