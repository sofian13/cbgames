"use client";

/** Tuto en slides + règles en jeu de Pensez Pareil (mode local, à deux, à voix haute). */

import { type I18n, useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Blob, CAST, Card, Heart, INK, Phone, Sparkle, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

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
      { title: "Un mot dans la tête", text: "Thème : « un plat du dimanche soir ». Léa et Tom pensent chacun à un mot, sans rien dire. Le tél reste posé entre vous deux." },
      { title: "3, 2, 1… dites-le !", text: "À « 1 », vous dites votre mot à voix haute en même temps. « Pâtes ! » « Pâtes ! » : touchez « Même mot ! », c'est SYNC. « Spaghetti » ne compte pas : c'est vous qui jugez." },
      { title: "Enchaînez les sync", text: "Plusieurs sync d'affilée, et le bonus grimpe. Après 8 manches, découvrez votre niveau de complicité." },
    ],
    theme: "Un plat du dimanche soir", answer: "PÂTES", other: "SPAGHETTI", sync: "SYNC !", rounds: "8 manches",
    rules: [
      "Vous jouez à deux, le tél posé entre vous. Un thème s'affiche : chacun pense à un mot dans sa tête, sans rien dire.",
      "Lancez « 3, 2, 1 » : à « 1 », vous dites votre mot à voix haute en même temps. Puis un seul tap : « Même mot ! » ou « Pas pareil ».",
      "Même mot = SYNC : 100 points pour vous deux. Il faut exactement le même mot : « pâtes » et « spaghetti », c'est pas pareil. Les synonymes sont refusés, et c'est vous qui jugez, honnêtement !",
      "Sync d'affilée : chaque sync en série rapporte 25 points de bonus en plus.",
      "Thème bof ? « Pas fou ? Un autre thème » le remplace avant le décompte.",
      "La partie dure 8 manches. À la fin, vous gagnez de l'XP qui fait monter votre niveau de complicité, d'une partie à l'autre.",
    ],
  },
  en: {
    slides: [
      { title: "A word in your head", text: "Theme: \"a Sunday-night dinner\". Léa and Tom each think of a word, silently. The phone stays between you." },
      { title: "3, 2, 1… say it!", text: "On \"1\", you both say your word out loud. \"Pasta!\" \"Pasta!\": tap \"Same word!\", it's a SYNC. \"Spaghetti\" doesn't count: you two are the judges." },
      { title: "Chain your syncs", text: "Several syncs in a row and the bonus climbs. After 8 rounds, see your connection level." },
    ],
    theme: "A Sunday-night dinner", answer: "PASTA", other: "SPAGHETTI", sync: "SYNC!", rounds: "8 rounds",
    rules: [
      "You play as a pair, the phone between you. A theme appears: each of you thinks of a word, silently.",
      "Start \"3, 2, 1\": on \"1\", you both say your word out loud. Then a single tap: \"Same word!\" or \"Not the same\".",
      "Same word = SYNC: 100 points for both of you. It has to be exactly the same word: \"pasta\" and \"spaghetti\" are not the same. No synonyms, and you two judge, honestly!",
      "Syncs in a row: each sync in a streak earns 25 bonus points on top.",
      "Meh theme? \"Meh? Another theme\" swaps it before the countdown.",
      "A game lasts 8 rounds. At the end you earn XP that raises your connection level, game after game.",
    ],
  },
  es: {
    slides: [
      { title: "Una palabra en la cabeza", text: "Tema: «una cena de domingo». Léa y Tom piensan cada uno una palabra, en silencio. El móvil se queda entre los dos." },
      { title: "3, 2, 1… ¡decidla!", text: "Al «1», decís vuestra palabra en voz alta a la vez. «¡Pasta!» «¡Pasta!»: tocad «¡Misma palabra!», es SYNC. «Espaguetis» no cuenta: juzgáis vosotros." },
      { title: "Encadenad syncs", text: "Varios syncs seguidos y el bonus sube. Tras 8 rondas, descubrid vuestro nivel de complicidad." },
    ],
    theme: "Una cena de domingo", answer: "PASTA", other: "ESPAGUETIS", sync: "¡SYNC!", rounds: "8 rondas",
    rules: [
      "Jugáis los dos, con el móvil entre vosotros. Aparece un tema: cada uno piensa una palabra, en silencio.",
      "Lanzad «3, 2, 1»: al «1», decís vuestra palabra en voz alta a la vez. Luego un solo toque: «¡Misma palabra!» o «No es igual».",
      "Misma palabra = SYNC: 100 puntos para los dos. Tiene que ser exactamente la misma: «pasta» y «espaguetis» no valen. Nada de sinónimos, y juzgáis vosotros, ¡con honestidad!",
      "Syncs seguidos: cada sync de la racha da 25 puntos extra.",
      "¿Tema flojo? «¿No mola? Otro tema» lo cambia antes de la cuenta atrás.",
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
      <Blob x={46} y={148} s={50} color={CAST.lea} mood="smirk" className="gt-bob" />
      <Card x={30} y={64} w={30} h={30} fill="#fff" text="?" size={16} rot={-6} />
      {/* le tél reste posé au milieu : décompte */}
      <Phone x={88} y={70} w={44} h={70}>
        <g className="gt-pulse"><SvgText x={22} y={34} text="3" size={30} fill="#FF3EA5" /></g>
      </Phone>
      <Blob x={174} y={148} s={50} color={CAST.tom} mood="smirk" className="gt-bob" style={{ animationDelay: ".3s" }} />
      <Card x={160} y={64} w={30} h={30} fill="#fff" text="?" size={16} rot={6} />
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
