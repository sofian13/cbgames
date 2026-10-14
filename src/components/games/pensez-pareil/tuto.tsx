"use client";

/** Tuto en slides + règles en jeu de Pensez Pareil (mode local, à deux). */

import { type I18n, useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Blob, CAST, Card, Heart, INK, Phone, Sparkle, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

/** Les textes SVG en police display collent les mots : on rétablit l'espace entre les mots. */
const WS_CSS = ".gt-ws text{word-spacing:0.28em}";

type S = {
  slides: { title: string; text: string }[];
  theme: string; answer: string; other: string; sync: string; rounds: string;
  rules: string[];
};

const STR: I18n<S> = {
  fr: {
    slides: [
      { title: "Un thème, en secret", text: "Thème : « un plat du dimanche soir ». Léa écrit sa réponse sans la montrer, puis passe le tél à Tom." },
      { title: "Même mot = SYNC", text: "Tom écrit « pâtes » aussi : SYNC, vous marquez ensemble ! Il faut le même mot : « spaghetti » ne compte pas." },
      { title: "Enchaînez les sync", text: "Plusieurs sync d'affilée, et le bonus grimpe. Après 8 manches, découvrez votre niveau de complicité." },
    ],
    theme: "Un plat du dimanche soir", answer: "PÂTES", other: "SPAGHETTI", sync: "SYNC !", rounds: "8 manches",
    rules: [
      "Vous jouez à deux, sur un seul tél. Un thème s'affiche : chacun écrit sa réponse en secret, sans la montrer, puis passe le tél à l'autre.",
      "Même réponse = SYNC : 100 points pour vous deux. Il faut le même mot : « pâtes » et « spaghetti » ne comptent pas. Les majuscules, accents et articles sont ignorés, et une petite faute de frappe passe sur les mots de 5 lettres ou plus.",
      "Sync d'affilée : chaque sync en série rapporte 25 points de bonus en plus.",
      "Thème bof ? « Pas fou ? Un autre thème » le remplace avant que vous écriviez.",
      "La partie dure 8 manches. À la fin, vous gagnez de l'XP qui fait monter votre niveau de complicité, d'une partie à l'autre.",
    ],
  },
  en: {
    slides: [
      { title: "One theme, in secret", text: "Theme: \"a Sunday-night dinner\". Léa types her answer without showing it, then passes the phone to Tom." },
      { title: "Same word = SYNC", text: "Tom types \"pasta\" too: SYNC, you both score! It has to be the same word: \"spaghetti\" doesn't count." },
      { title: "Chain your syncs", text: "Several syncs in a row and the bonus climbs. After 8 rounds, see your connection level." },
    ],
    theme: "A Sunday-night dinner", answer: "PASTA", other: "SPAGHETTI", sync: "SYNC!", rounds: "8 rounds",
    rules: [
      "You play as a pair, on one phone. A theme appears: each of you types an answer in secret, without showing it, then passes the phone.",
      "Same answer = SYNC: 100 points for both of you. It has to be the same word: \"pasta\" and \"spaghetti\" don't count. Capitals, accents and articles are ignored, and a small typo is fine on words of 5 letters or more.",
      "Syncs in a row: each sync in a streak earns 25 bonus points on top.",
      "Meh theme? \"Meh? Another one\" swaps it before you type.",
      "A game lasts 8 rounds. At the end you earn XP that raises your connection level, game after game.",
    ],
  },
  es: {
    slides: [
      { title: "Un tema, en secreto", text: "Tema: «una cena de domingo». Léa escribe su respuesta sin enseñarla y pasa el móvil a Tom." },
      { title: "Misma palabra = SYNC", text: "Tom también escribe «pasta»: ¡SYNC, puntuáis juntos! Tiene que ser la misma palabra: «espaguetis» no cuenta." },
      { title: "Encadenad syncs", text: "Varios syncs seguidos y el bonus sube. Tras 8 rondas, descubrid vuestro nivel de complicidad." },
    ],
    theme: "Una cena de domingo", answer: "PASTA", other: "ESPAGUETIS", sync: "¡SYNC!", rounds: "8 rondas",
    rules: [
      "Jugáis los dos, con un solo móvil. Aparece un tema: cada uno escribe su respuesta en secreto, sin enseñarla, y pasa el móvil al otro.",
      "Misma respuesta = SYNC: 100 puntos para los dos. Tiene que ser la misma palabra: «pasta» y «espaguetis» no cuentan. Se ignoran mayúsculas, tildes y artículos, y una pequeña errata vale en palabras de 5 letras o más.",
      "Syncs seguidos: cada sync de la racha da 25 puntos extra.",
      "¿Tema flojo? «¿No mola? Otro tema» lo cambia antes de escribir.",
      "La partida dura 8 rondas. Al final ganáis XP que sube vuestro nivel de complicidad, partida tras partida.",
    ],
  },
};

function ArtSecret({ s }: { s: S }) {
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      <Card x={30} y={12} w={160} h={26} fill="#FFD23F" text={s.theme} size={11} />
      <Blob x={46} y={148} s={50} color={CAST.lea} mood="smirk" />
      <Phone x={70} y={56} w={44} h={70} rot={-8}>
        <SvgText x={18} y={22} text="••••" size={14} />
        <rect x={6} y={34} width={24} height={9} rx={4} fill="#FF3EA5" stroke={INK} strokeWidth={1.5} />
      </Phone>
      <Arrow d="M122 92 Q146 70 166 92" head={[166, 92, 40]} className="gt-blink" />
      <Blob x={180} y={148} s={50} color={CAST.tom} mood="happy" className="gt-bob" />
      </g>
    </TutoSvg>
  );
}

function ArtSync({ s }: { s: S }) {
  return (
    <TutoSvg>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      <g className="gt-slide" style={{ ["--gt-dx" as string]: "14px" }}>
        <Card x={18} y={22} w={84} h={40} fill="#fff" text={s.answer} size={16} rot={-4} />
      </g>
      <g className="gt-slide" style={{ ["--gt-dx" as string]: "-14px" }}>
        <Card x={118} y={22} w={84} h={40} fill="#FFF6E5" text={s.answer} size={16} rot={4} />
      </g>
      <g className="gt-pulse">
        <SvgText x={110} y={84} text={s.sync} size={24} fill="#FF3EA5" outline />
      </g>
      <Sparkle x={40} y={86} />
      <Sparkle x={182} y={84} s={0.8} style={{ animationDelay: ".4s" }} />
      {/* « pâtes » ≠ « spaghetti » */}
      <Card x={18} y={112} w={72} h={30} fill="#fff" text={s.answer} size={12} />
      <SvgText x={106} y={128} text="≠" size={20} fill="#fff" />
      <Card x={122} y={112} w={84} h={30} fill="#fff" text={s.other} size={11} />
      <path d="M118 140 L210 114" stroke="#FF3EA5" strokeWidth={4} strokeLinecap="round" />
      </g>
    </TutoSvg>
  );
}

function ArtChain({ s }: { s: S }) {
  return (
    <TutoSvg floor>
      <style>{WS_CSS}</style>
      <g className="gt-ws">
      <Blob x={40} y={148} s={46} color={CAST.lea} mood="happy" className="gt-bob" />
      <Blob x={86} y={148} s={46} color={CAST.tom} mood="happy" className="gt-bob" style={{ animationDelay: ".3s" }} />
      <Heart x={63} y={84} s={1.3} className="gt-pulse" />
      {/* jauge de série qui monte */}
      {[0, 1, 2].map((i) => (
        <g key={i} className="gt-pop" style={{ animationDelay: `${i * 0.35}s` }}>
          <rect x={128 + i * 28} y={112 - i * 26} width={22} height={28 + i * 26} rx={5} fill={["#FFD23F", "#FF9F1C", "#FF3EA5"][i]} stroke={INK} strokeWidth={2.5} />
          <SvgText x={139 + i * 28} y={100 - i * 26} text={`×${i + 1}`} size={12} fill="#fff" outline />
        </g>
      ))}
      <Card x={14} y={14} w={96} h={28} fill="#fff" text={s.rounds} size={13} rot={-3} />
      </g>
    </TutoSvg>
  );
}

export function usePPTuto(): TutoSlide[] {
  const s = useT(STR);
  const arts = [<ArtSecret key="a" s={s} />, <ArtSync key="b" s={s} />, <ArtChain key="c" s={s} />];
  return s.slides.map((sl, i) => ({ ...sl, art: arts[i] }));
}

export function usePPRules(): string[] {
  return useT(STR).rules;
}
