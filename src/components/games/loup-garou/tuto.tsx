"use client";

/** Tuto en slides du Loup-Garou (1re partie) : rôle secret, nuit, jour, vote, amoureux. */

import type { ReactNode } from "react";
import type { I18n } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Blob, Bubble, CAST, Card, Heart, INK, Moon, Phone, Sun, SvgText, TutoSvg, Zzz } from "@/components/games/game-tuto-art";

type Txt = { title: string; text: string };
const TXT: I18n<{ slides: Txt[]; art: { wolf: string; village: string; wolvesOpen: string; you: string; never: string; tie: string; love: string } }> = {
  fr: {
    slides: [
      { title: "Ta carte secrète", text: "Chacun regarde son rôle en secret. Les loups veulent manger le village, le village veut chasser les loups." },
      { title: "La nuit, yeux fermés", text: "Tél au centre, tout le monde ferme les yeux. Le tél appelle un rôle : lui seul les ouvre et joue." },
      { title: "Le jour, on débat", text: "Au réveil, le tél annonce qui est mort. Les morts se taisent. Les vivants discutent : qui ment ?" },
      { title: "Votez, éliminez", text: "Votez pour éliminer un suspect. Le village gagne si tous les loups sortent, les loups s'ils sont aussi nombreux." },
      { title: "L'amour gagne", text: "Avec Cupidon, 2 joueurs tombent amoureux : si l'un meurt, l'autre aussi. Un loup et un villageois derniers en vie ? L'amour gagne !" },
    ],
    art: { wolf: "LOUP", village: "VILLAGE", wolvesOpen: "Les loups, ouvrez les yeux…", you: "C'est toi !", never: "Moi ? Jamais !", tie: "2 = 2 : les loups gagnent", love: "L'AMOUR GAGNE" },
  },
  en: {
    slides: [
      { title: "Your secret card", text: "Everyone checks their role in secret. Wolves want to eat the village; the village wants to catch the wolves." },
      { title: "Night: eyes closed", text: "Phone in the middle, everyone closes their eyes. The phone calls a role: only they open their eyes and play." },
      { title: "Day: talk it out", text: "At sunrise, the phone says who died. The dead stay silent. The living argue: who's lying?" },
      { title: "Vote someone out", text: "Vote to eliminate a suspect. The village wins once all wolves are out; wolves win when they equal the others." },
      { title: "Love wins", text: "With Cupid, 2 players fall in love: if one dies, so does the other. A wolf and a villager last alive? Love wins!" },
    ],
    art: { wolf: "WOLF", village: "VILLAGE", wolvesOpen: "Wolves, open your eyes…", you: "It's you!", never: "Me? Never!", tie: "2 = 2: wolves win", love: "LOVE WINS" },
  },
  es: {
    slides: [
      { title: "Tu carta secreta", text: "Cada uno mira su rol en secreto. Los lobos quieren comerse al pueblo; el pueblo quiere cazar a los lobos." },
      { title: "De noche, ojos cerrados", text: "Móvil en el centro, todos cierran los ojos. El móvil llama a un rol: solo él los abre y juega." },
      { title: "De día, se debate", text: "Al amanecer, el móvil dice quién ha muerto. Los muertos se callan. Los vivos discuten: ¿quién miente?" },
      { title: "Votad y eliminad", text: "Votad para eliminar a un sospechoso. El pueblo gana si echa a todos los lobos; los lobos, si igualan a los demás." },
      { title: "Gana el amor", text: "Con Cupido, 2 jugadores se enamoran: si uno muere, el otro también. ¿Un lobo y un aldeano, últimos vivos? ¡Gana el amor!" },
    ],
    art: { wolf: "LOBO", village: "PUEBLO", wolvesOpen: "Lobos, abrid los ojos…", you: "¡Eres tú!", never: "¿Yo? ¡Jamás!", tie: "2 = 2: ganan los lobos", love: "GANA EL AMOR" },
  },
};

/** Oreilles de loup posées sur un blob (repère du blob : centre bas en 0,0, largeur ~s). */
function Ears({ x, y, s = 40 }: { x: number; y: number; s?: number }) {
  const k = s / 60;
  return (
    <g transform={`translate(${x} ${y - 52 * k}) scale(${k})`}>
      <path d="M-24 -2 L-18 -26 L-6 -6 Z M24 -2 L18 -26 L6 -6 Z" fill="#6B5A8E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

function House({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-9 0 L-9 -11 L0 -19 L9 -11 L9 0 Z" fill="#FFF6E5" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <rect x={-3} y={-7} width={6} height={7} fill="#FF6B5B" stroke={INK} strokeWidth={1.5} />
    </g>
  );
}

function WolfHead({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-11 6 L-13 -12 L-5 -6 L0 -8 L5 -6 L13 -12 L11 6 Q0 14 -11 6 Z" fill="#6B5A8E" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={-4} cy={-1} r={1.8} fill="#FFD23F" />
      <circle cx={4} cy={-1} r={1.8} fill="#FFD23F" />
    </g>
  );
}

function ArtCard({ wolf, village }: { wolf: string; village: string }) {
  return (
    <TutoSvg floor>
      {/* deux camps */}
      <g>
        <WolfHead x={30} y={24} /><WolfHead x={58} y={24} />
        <SvgText x={44} y={46} text={wolf} size={11} fill="#fff" />
        <line x1={110} y1={8} x2={110} y2={52} stroke="#fff" strokeWidth={2.5} strokeDasharray="4 4" />
        {[140, 160, 180, 200].map((hx) => <House key={hx} x={hx} y={34} />)}
        <SvgText x={170} y={46} text={village} size={11} fill="#fff" />
      </g>
      {/* villageois au fond */}
      <Blob x={36} y={140} s={40} color={CAST.malik} mood="happy" />
      <Blob x={186} y={140} s={40} color={CAST.ines} mood="happy" />
      {/* Hugo regarde sa carte loup en secret */}
      <Blob x={110} y={142} s={56} color={CAST.hugo} mood="smirk" />
      <Phone x={128} y={64} w={40} h={62} rot={10} className="gt-bob">
        <WolfHead x={16} y={20} s={0.9} />
        <SvgText x={16} y={38} text={wolf} size={8} />
      </Phone>
    </TutoSvg>
  );
}

function ArtNight({ line }: { line: string }) {
  const ring: [number, string, boolean][] = [[30, CAST.lea, false], [66, CAST.hugo, true], [154, CAST.tom, true], [190, CAST.sarah, false]];
  return (
    <TutoSvg floor>
      <Moon x={196} y={22} />
      <Bubble x={34} y={10} w={150} h={24} text={line} size={10.5} className="gt-bob" />
      <Phone x={92} y={70} w={36} h={56} body="#2E1C6E" screen="#1A0F45">
        <circle cx={14} cy={20} r={6} fill="none" stroke="#FFD23F" strokeWidth={2} className="gt-pulse" />
        <circle cx={14} cy={20} r={11} fill="none" stroke="#FFD23F" strokeWidth={1.5} className="gt-blink" />
      </Phone>
      {ring.map(([x, c, wolf]) => (
        <g key={x}>
          <Blob x={x} y={146} s={40} color={c} mood={wolf ? "smirk" : "sleep"} />
          {wolf && <Ears x={x} y={146} s={40} />}
          {!wolf && <Zzz x={x + 12} y={96} />}
        </g>
      ))}
      {/* les 2 loups pointent Sarah */}
      <Arrow d="M74 104 Q130 82 180 112" head={[180, 112, 30]} color="#FF6B5B" width={3} dashed />
    </TutoSvg>
  );
}

function ArtDay({ you, never }: { you: string; never: string }) {
  return (
    <TutoSvg floor sky="#3A2A80">
      <Sun x={24} y={24} />
      {/* fantôme de Sarah, bouche cousue */}
      <g opacity={0.55} className="gt-float">
        <Blob x={196} y={92} s={36} color="#fff" mood="sad" />
        <path d="M188 80 L204 80" stroke={INK} strokeWidth={2} />
        <path d="M190 77 L190 83 M194 77 L194 83 M198 77 L198 83 M202 77 L202 83" stroke={INK} strokeWidth={1.2} />
      </g>
      <Blob x={46} y={142} s={50} color={CAST.lea} mood="talk" />
      <Blob x={128} y={142} s={50} color={CAST.tom} mood="panic" className="gt-shake" />
      <Bubble x={14} y={52} w={68} h={24} text={you} size={11} />
      <Bubble x={96} y={52} w={76} h={24} text={never} size={11} className="gt-bob" style={{ animationDelay: "0.5s" }} />
      <Arrow d="M74 118 L100 118" head={[100, 118, 0]} color="#fff" width={3} />
      {/* chrono */}
      <g transform="translate(100 22)">
        <circle r={13} fill="#fff" stroke={INK} strokeWidth={2.5} />
        <path d="M0 0 L0 -9" stroke={INK} strokeWidth={2.5} strokeLinecap="round" className="gt-spin" style={{ transformOrigin: "0 0", animation: "gt-tick 3s linear infinite" }} />
      </g>
      <style>{"@keyframes gt-tick{to{transform:rotate(360deg)}}"}</style>
    </TutoSvg>
  );
}

function ArtVote({ wolf, tie }: { wolf: string; tie: string }) {
  return (
    <TutoSvg floor>
      {/* mains levées vers Tom */}
      {[24, 56, 88].map((x, i) => (
        <g key={x}>
          <Blob x={x} y={146} s={34} color={[CAST.lea, CAST.malik, CAST.ines][i]} mood="happy" />
          <path d={`M${x + 12} 120 L${x + 22} 100`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${x + 12} 120 L${x + 22} 100`} stroke="#FFC9A8" strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      <g transform="rotate(14 150 140)">
        <Blob x={150} y={146} s={44} color={CAST.tom} mood="panic" />
      </g>
      <Card x={164} y={70} w={40} h={52} fill="#6B5A8E" rot={8} className="gt-pop">
        <WolfHead x={20} y={22} s={0.9} />
        <SvgText x={20} y={42} text={wolf} size={8} fill="#fff" />
      </Card>
      {/* balance 2 = 2 */}
      <g transform="translate(70 26)">
        <path d="M-40 0 L40 0 M0 0 L0 22" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        <WolfHead x={-32} y={-6} s={0.6} /><WolfHead x={-18} y={-6} s={0.6} />
        <House x={18} y={-1} /><House x={34} y={-1} />
        <SvgText x={0} y={-8} text="=" size={14} fill="#FFD23F" />
      </g>
      <SvgText x={70} y={60} text={tie} size={10} fill="#fff" />
    </TutoSvg>
  );
}

function ArtLove({ love }: { love: string }) {
  return (
    <TutoSvg floor>
      {/* Cupidon (petites ailes) */}
      <g transform="translate(30 30)">
        <path d="M-14 0 Q-22 -10 -12 -14 Q-8 -6 -6 0 Z M14 0 Q22 -10 12 -14 Q8 -6 6 0 Z" fill="#fff" stroke={INK} strokeWidth={2} />
        <circle r={9} fill="#FFC9E5" stroke={INK} strokeWidth={2} />
      </g>
      <Arrow d="M44 34 Q90 20 104 60" head={[104, 60, 70]} color="#FF3EA5" width={3} dashed />
      <Blob x={78} y={142} s={50} color={CAST.hugo} mood="happy" />
      <Ears x={78} y={142} s={50} />
      <Blob x={142} y={142} s={50} color={CAST.ines} mood="happy" />
      <Heart x={110} y={72} s={1.6} className="gt-pulse" />
      <Heart x={92} y={58} s={0.7} className="gt-float" />
      <Heart x={130} y={56} s={0.8} className="gt-float" style={{ animationDelay: "0.6s" }} />
      <g>
        <rect x={52} y={10} width={150} height={22} rx={10} fill="#FF3EA5" stroke={INK} strokeWidth={2.5} />
        <SvgText x={127} y={22} text={love} size={12} fill="#fff" />
      </g>
    </TutoSvg>
  );
}

export function useLgTutoSlides(): TutoSlide[] {
  const t = useT(TXT);
  const arts: ReactNode[] = [
    <ArtCard key="c" wolf={t.art.wolf} village={t.art.village} />,
    <ArtNight key="n" line={t.art.wolvesOpen} />,
    <ArtDay key="d" you={t.art.you} never={t.art.never} />,
    <ArtVote key="v" wolf={t.art.wolf} tie={t.art.tie} />,
    <ArtLove key="l" love={t.art.love} />,
  ];
  return t.slides.map((s, i) => ({ ...s, art: arts[i] }));
}
