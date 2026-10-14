"use client";

/**
 * Tuto en slides + règles de Catégorie Chrono (FR / EN / ES).
 * Vignettes 220×170 dessinées avec le kit partagé game-tuto-art.
 */

import type { I18n } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Blob, Bubble, CAST, Crown, Finger, Heart, INK, Phone, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

type Txt = {
  slides: { title: string; text: string }[];
  rules: string[];
  fruit: string;
  apple: string;
  valid: string;
  failed: string;
  ready: string;
  um: string;
  dec: string;
};

export const TUTO_STR: I18n<Txt> = {
  fr: {
    slides: [
      { title: "Une catégorie tombe", text: "Catégorie : « un fruit ». Celui qui tient le tél dit un fruit avant la fin du chrono." },
      { title: "Les autres valident", text: "Bon mot ? Les AUTRES touchent « Validé ». Malik prend le tél et touche « Prêt » : son chrono repart, un peu plus court." },
      { title: "Bloqué ? Un cœur en moins", text: "Malik bloque, répète ou dit n'importe quoi ? Les autres touchent « Raté » : il perd un cœur. Le dernier en vie gagne." },
    ],
    rules: [
      "Une catégorie tombe (ex. « un fruit »). Celui qui tient le tél dit un mot de la catégorie avant la fin du chrono.",
      "Ce sont les AUTRES qui jugent : « Validé » si le mot est bon, « Raté » s'il bloque, répète un mot déjà dit ou sort du sujet.",
      "Validé : passe le tél au suivant. Il touche « Prêt » pour lancer son chrono, un peu plus court à chaque mot (−0,5 s, minimum 3 s).",
      "Chrono à zéro ou « Raté » : une vie en moins, et on change de catégorie.",
      "Le dernier joueur encore en vie gagne.",
    ],
    fruit: "UN FRUIT",
    apple: "Pomme !",
    valid: "Validé",
    failed: "Raté",
    ready: "Prêt",
    um: "Euh…",
    dec: "10 s → 9,5 s",
  },
  en: {
    slides: [
      { title: "A category drops", text: "Category: \"a fruit\". Whoever holds the phone says a fruit before the timer runs out." },
      { title: "The others judge", text: "Good word? The OTHERS tap \"Good\". Malik takes the phone and taps \"Ready\": his timer restarts, a bit shorter." },
      { title: "Stuck? Lose a heart", text: "Malik freezes, repeats or says nonsense? The others tap \"Fail\": he loses a heart. Last one standing wins." },
    ],
    rules: [
      "A category comes up (e.g. \"a fruit\"). Whoever holds the phone says a word from it before the timer runs out.",
      "The OTHER players judge: \"Good\" if the word works, \"Fail\" if they freeze, repeat a word already said or go off-topic.",
      "Good: pass the phone on. The next player taps \"Ready\" to start their timer, a bit shorter with every word (−0.5 s, 3 s minimum).",
      "Timer hits zero or \"Fail\": you lose a life, and a new category comes up.",
      "The last player with lives left wins.",
    ],
    fruit: "A FRUIT",
    apple: "Apple!",
    valid: "Good",
    failed: "Fail",
    ready: "Ready",
    um: "Umm…",
    dec: "10 s → 9.5 s",
  },
  es: {
    slides: [
      { title: "Sale una categoría", text: "Categoría: «una fruta». Quien tiene el móvil dice una fruta antes de que acabe el tiempo." },
      { title: "Los demás juzgan", text: "¿Palabra buena? Los DEMÁS tocan «Vale». Malik coge el móvil y toca «Listo»: su tiempo vuelve a correr, un poco más corto." },
      { title: "¿Bloqueado? Pierdes un corazón", text: "¿Malik se bloquea, repite o dice cualquier cosa? Los demás tocan «Fallo»: pierde un corazón. Gana el último en pie." },
    ],
    rules: [
      "Sale una categoría (p. ej., «una fruta»). Quien tiene el móvil dice una palabra de esa categoría antes de que acabe el tiempo.",
      "Juzgan los DEMÁS: «Vale» si la palabra es buena, «Fallo» si se bloquea, repite una palabra ya dicha o se sale del tema.",
      "Vale: pasa el móvil al siguiente. Toca «Listo» para lanzar su tiempo, un poco más corto con cada palabra (−0,5 s, mínimo 3 s).",
      "Tiempo a cero o «Fallo»: pierdes una vida y sale otra categoría.",
      "Gana el último jugador que conserve vidas.",
    ],
    fruit: "UNA FRUTA",
    apple: "¡Manzana!",
    valid: "Vale",
    failed: "Fallo",
    ready: "Listo",
    um: "Eh…",
    dec: "10 s → 9,5 s",
  },
};

/** Petit chrono rond qui se vide. */
function Clock({ x, y, r = 13 }: { x: number; y: number; r?: number }) {
  const c = 2 * Math.PI * (r - 3);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#fff" stroke={INK} strokeWidth={2.5} />
      <circle r={r - 3} fill="none" stroke="#3DDC97" strokeWidth={5} strokeDasharray={c} transform="rotate(-90)">
        <animate attributeName="stroke-dashoffset" from="0" to={String(c)} dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

/** Gros bouton de jeu (Validé / Raté / Prêt). */
function GameBtn({ x, y, w, label, fill, className }: { x: number; y: number; w: number; label: string; fill: string; className?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <rect x={0} y={3} width={w} height={22} rx={11} fill={INK} />
        <rect x={0} y={0} width={w} height={22} rx={11} fill={fill} stroke={INK} strokeWidth={2.5} />
        <SvgText x={w / 2} y={11.5} text={label} size={11} />
      </g>
    </g>
  );
}

function Slide1({ s }: { s: Txt }) {
  return (
    <TutoSvg floor>
      <Phone x={112} y={30} w={64} h={104} rot={6}>
        <SvgText x={28} y={22} text={s.fruit} size={s.fruit.length > 8 ? 9 : 11} style={{ wordSpacing: "0.25em" }} />
        <Clock x={28} y={56} r={16} />
      </Phone>
      <Blob x={62} y={140} s={66} color={CAST.lea} mood="talk" />
      <Bubble x={14} y={22} w={76} h={26} text={s.apple} size={13} tailX={46} className="gt-pulse" />
    </TutoSvg>
  );
}

function Slide2({ s }: { s: Txt }) {
  return (
    <TutoSvg floor>
      {/* Tom (un AUTRE joueur) touche « Validé » */}
      <GameBtn x={8} y={50} w={66} label={s.valid} fill="#3DDC97" className="gt-pulse" />
      <Finger x={44} y={76} rot={-8} />
      <Blob x={40} y={140} s={44} color={CAST.tom} mood="happy" />
      {/* puis Léa passe le tél à Malik, qui touche « Prêt » */}
      <Blob x={112} y={140} s={42} color={CAST.lea} mood="happy" />
      <Blob x={182} y={140} s={46} color={CAST.malik} mood="happy" />
      <Arrow d="M116 86 Q148 68 176 86" head={[176, 86, 30]} dashed />
      <GameBtn x={156} y={36} w={54} label={s.ready} fill="#FFD23F" className="gt-pulse" />
      <SvgText x={210} y={20} text={s.dec} size={11} fill="#fff" anchor="end" />
    </TutoSvg>
  );
}

function Slide3({ s }: { s: Txt }) {
  return (
    <TutoSvg floor>
      <Blob x={60} y={140} s={56} color={CAST.malik} mood="panic" className="gt-shake" />
      <Bubble x={22} y={40} w={56} h={24} text={s.um} size={12} tailX={34} />
      <Heart x={40} y={22} s={0.9} />
      <Heart x={60} y={22} s={0.9} />
      <Heart x={80} y={22} s={0.9} broken className="gt-blink" />
      <GameBtn x={92} y={92} w={56} label={s.failed} fill="#FF6B5B" className="gt-pulse" />
      <Blob x={180} y={140} s={50} color={CAST.lea} mood="cool" />
      <Crown x={180} y={78} s={0.9} className="gt-bob" />
      <Heart x={166} y={30} s={0.7} />
      <Heart x={180} y={30} s={0.7} />
      <Heart x={194} y={30} s={0.7} />
    </TutoSvg>
  );
}

/** Slides du tuto, dans la langue courante. */
export function useChronoTuto(): { slides: TutoSlide[]; rules: string[] } {
  const s = useT(TUTO_STR);
  const arts = [<Slide1 key={0} s={s} />, <Slide2 key={1} s={s} />, <Slide3 key={2} s={s} />];
  return { slides: s.slides.map((x, i) => ({ ...x, art: arts[i] })), rules: s.rules };
}
