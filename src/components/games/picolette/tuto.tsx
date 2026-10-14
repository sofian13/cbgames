"use client";

/**
 * La Tournée : tuto en slides (1re partie) + feuille de règles en jeu, FR / EN / ES.
 * L'exemple de vote est une vraie carte du paquet découverte (cards*.ts, 1re carte).
 */

import { useState } from "react";
import { type I18n, useT } from "@/lib/i18n";
import { sipsAllowed } from "@/lib/party-mood";
import { GameRulesSheet, type TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Blob, CAST, Card, INK, Phone, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

type Txt = {
  slides: { title: string; text: string }[];
  slide3NoSips: string;
  maxReads: string;
  voteLabel: string;
  /** Carte d'exemple sur 2 lignes */
  card: [string, string];
  whoLoses: string;
  pickLoser: string;
  wheel: [string, string, string];
  next: string;
  rulesName: string;
  rules: string[];
  rulesNoSips: string[];
};

const TXT: I18n<Txt> = {
  fr: {
    slides: [
      { title: "Lis la carte", text: "En haut, le tél affiche qui lit : « Max lit la carte ». Max la lit à voix haute pour toute la table." },
      { title: "Tout le monde joue", text: "« Qui pourrait sauver la Terre d'une invasion alien ? » 3-2-1, tout le monde pointe : Léa est la plus désignée, elle perd." },
      { title: "La roulette, puis on tourne", text: "« Désigner un perdant », puis son prénom : la roulette tire 1 à 3 gorgées (eau OK) ou un gage. Ensuite, le suivant lit." },
    ],
    slide3NoSips: "« Désigner un perdant », puis son prénom : la roulette tire un gage. Ensuite, le suivant lit.",
    maxReads: "Max lit la carte",
    voteLabel: "Vote",
    card: ["Qui pourrait sauver", "la Terre des aliens ?"],
    whoLoses: "Qui perd ? Le plus désigné",
    pickLoser: "Désigner un perdant",
    wheel: ["1", "2", "3"],
    next: "au suivant !",
    rulesName: "La Tournée",
    rules: [
      "Chaque carte a un lecteur, affiché en haut : il la lit à voix haute. Le lecteur change à chaque carte, dans l'ordre des joueurs.",
      "Tout se joue à l'oral (votes, tours de table, duels, défis…). La case « Qui perd ? » dit qui prend la peine.",
      "Touche « Désigner un perdant » et choisis qui a perdu : la roulette tire la peine, 1 à 3 gorgées max (eau ou soft OK) ou un gage. Personne n'est obligé de boire.",
      "Personne ne perd ? Touche « Personne ne perd, carte suivante ».",
      "Règle live : elle reste affichée un moment. Quelqu'un l'enfreint ? Touche « Quelqu'un a craqué ».",
      "Le bouclier annule ta prochaine peine. Les jokers ont des effets spéciaux, expliqués sur la carte.",
      "Pas de fin imposée : touchez « Terminer la partie » quand vous voulez. La star de la soirée est celui qui a pris le plus de peines.",
    ],
    rulesNoSips: [
      "Chaque carte a un lecteur, affiché en haut : il la lit à voix haute. Le lecteur change à chaque carte, dans l'ordre des joueurs.",
      "Tout se joue à l'oral (votes, tours de table, duels, défis…). La case « Qui perd ? » dit qui prend la peine.",
      "Touche « Désigner un perdant » et choisis qui a perdu : la roulette tire un gage.",
      "Personne ne perd ? Touche « Personne ne perd, carte suivante ».",
      "Règle live : elle reste affichée un moment. Quelqu'un l'enfreint ? Touche « Quelqu'un a craqué ».",
      "Le bouclier annule ta prochaine peine. Les jokers ont des effets spéciaux, expliqués sur la carte.",
      "Pas de fin imposée : touchez « Terminer la partie » quand vous voulez. La star de la soirée est celui qui a pris le plus de peines.",
    ],
  },
  en: {
    slides: [
      { title: "Read the card", text: "At the top, the phone shows who reads: \"Max reads the card\". Max reads it out loud to the whole table." },
      { title: "Everyone plays", text: "\"Who could save Earth from an alien invasion?\" 3-2-1, everyone points: Léa gets the most fingers, she loses." },
      { title: "Spin, then move on", text: "Tap \"Pick a loser\", then their name: the wheel picks 1-3 sips (water's fine) or a dare. Then the next player reads." },
    ],
    slide3NoSips: "Tap \"Pick a loser\", then their name: the wheel picks a dare. The next player reads the next card.",
    maxReads: "Max reads the card",
    voteLabel: "Vote",
    card: ["Who could save Earth", "from the aliens?"],
    whoLoses: "Who loses? Most fingers",
    pickLoser: "Pick a loser",
    wheel: ["1", "2", "3"],
    next: "next!",
    rulesName: "The Round",
    rules: [
      "Each card has a reader, shown at the top: they read it out loud. The reader changes with every card, in player order.",
      "Everything happens out loud (votes, rounds, duels, challenges…). The \"Who loses?\" box says who takes the penalty.",
      "Tap \"Pick a loser\" and choose who lost: the wheel picks the penalty, 1 to 3 sips max (water or soft drinks are fine) or a dare. Nobody has to drink.",
      "Nobody lost? Tap \"Nobody loses, next card\".",
      "Live rule: it stays on screen for a while. Someone breaks it? Tap \"Someone slipped up\".",
      "The shield cancels your next penalty. Jokers have special effects, explained on the card.",
      "No set ending: tap \"End the game\" whenever you like. The star of the night is whoever took the most penalties.",
    ],
    rulesNoSips: [
      "Each card has a reader, shown at the top: they read it out loud. The reader changes with every card, in player order.",
      "Everything happens out loud (votes, rounds, duels, challenges…). The \"Who loses?\" box says who takes the penalty.",
      "Tap \"Pick a loser\" and choose who lost: the wheel picks a dare.",
      "Nobody lost? Tap \"Nobody loses, next card\".",
      "Live rule: it stays on screen for a while. Someone breaks it? Tap \"Someone slipped up\".",
      "The shield cancels your next penalty. Jokers have special effects, explained on the card.",
      "No set ending: tap \"End the game\" whenever you like. The star of the night is whoever took the most penalties.",
    ],
  },
  es: {
    slides: [
      { title: "Lee la carta", text: "Arriba, el móvil indica quién lee: «Max lee la carta». Max la lee en voz alta para toda la mesa." },
      { title: "Todos juegan", text: "«¿Quién podría salvar la Tierra de una invasión alienígena?» 3-2-1, todos señalan: Léa es la más señalada, pierde." },
      { title: "Ruleta y a seguir", text: "Toca «Señalar a un perdedor» y su nombre: la ruleta da de 1 a 3 tragos (agua vale) o un reto. Luego lee el siguiente." },
    ],
    slide3NoSips: "Toca «Señalar a un perdedor» y su nombre: la ruleta da un reto. El siguiente jugador lee la próxima carta.",
    maxReads: "Max lee la carta",
    voteLabel: "Voto",
    card: ["¿Quién salvaría la", "Tierra de los aliens?"],
    whoLoses: "¿Quién pierde? El más señalado",
    pickLoser: "Señalar a un perdedor",
    wheel: ["1", "2", "3"],
    next: "¡al siguiente!",
    rulesName: "La Ronda",
    rules: [
      "Cada carta tiene un lector, indicado arriba: la lee en voz alta. El lector cambia con cada carta, en el orden de los jugadores.",
      "Todo se juega en voz alta (votos, rondas, duelos, retos…). La casilla «¿Quién pierde?» dice quién se lleva el castigo.",
      "Toca «Señalar a un perdedor» y elige quién perdió: la ruleta da el castigo, de 1 a 3 tragos máx. (agua o refresco valen) o un reto. Nadie está obligado a beber.",
      "¿Nadie pierde? Toca «Nadie pierde, siguiente carta».",
      "Regla en vivo: se queda en pantalla un rato. ¿Alguien la rompe? Toca «Alguien ha fallado».",
      "El escudo anula tu próximo castigo. Los comodines tienen efectos especiales, explicados en la carta.",
      "No hay final fijo: tocad «Terminar la partida» cuando queráis. La estrella de la noche es quien se llevó más castigos.",
    ],
    rulesNoSips: [
      "Cada carta tiene un lector, indicado arriba: la lee en voz alta. El lector cambia con cada carta, en el orden de los jugadores.",
      "Todo se juega en voz alta (votos, rondas, duelos, retos…). La casilla «¿Quién pierde?» dice quién se lleva el castigo.",
      "Toca «Señalar a un perdedor» y elige quién perdió: la ruleta da un reto.",
      "¿Nadie pierde? Toca «Nadie pierde, siguiente carta».",
      "Regla en vivo: se queda en pantalla un rato. ¿Alguien la rompe? Toca «Alguien ha fallado».",
      "El escudo anula tu próximo castigo. Los comodines tienen efectos especiales, explicados en la carta.",
      "No hay final fijo: tocad «Terminar la partida» cuando queráis. La estrella de la noche es quien se llevó más castigos.",
    ],
  },
};

function ArtRead({ t }: { t: Txt }) {
  return (
    <TutoSvg floor>
      <Blob x={56} y={140} s={56} color={CAST.max} mood="talk" />
      <Phone x={84} y={14} w={70} h={112} rot={4}>
        <rect x={3} y={4} width={56} height={16} rx={8} fill="#fff" stroke={INK} strokeWidth={1.8} />
        <circle cx={11} cy={12} r={5} fill={CAST.max} stroke={INK} strokeWidth={1.4} />
        <SvgText x={36} y={12.5} text={t.maxReads} size={t.maxReads.length > 16 ? 5.6 : 6.4} />
        <Card x={3} y={26} w={56} h={64} fill="#FF6B5B">
          <rect x={6} y={6} width={30} height={11} rx={5.5} fill="#fff" stroke={INK} strokeWidth={1.5} />
          <SvgText x={21} y={12} text={t.voteLabel} size={7} />
          <rect x={8} y={26} width={40} height={5} rx={2.5} fill={INK} opacity={0.75} />
          <rect x={8} y={36} width={32} height={5} rx={2.5} fill={INK} opacity={0.75} />
          <rect x={8} y={46} width={36} height={5} rx={2.5} fill={INK} opacity={0.75} />
        </Card>
      </Phone>
      {/* ondes sonores vers la table */}
      <g className="gt-blink">
        <path d="M164 60 Q174 70 164 80 M174 52 Q190 70 174 88" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      </g>
      <Blob x={186} y={140} s={34} color={CAST.lea} mood="happy" className="gt-bob" />
      <Blob x={150} y={140} s={30} color={CAST.malik} mood="happy" />
    </TutoSvg>
  );
}

function ArtVote({ t }: { t: Txt }) {
  return (
    <TutoSvg floor>
      <Card x={10} y={8} w={200} h={52} fill="#FF6B5B">
        <SvgText x={100} y={17} text={t.card[0]} size={12.5} />
        <SvgText x={100} y={33} text={t.card[1]} size={12.5} />
        <rect x={34} y={40} width={132} height={14} rx={7} fill={INK} />
        <SvgText x={100} y={47.5} text={t.whoLoses} size={t.whoLoses.length > 26 ? 6.8 : 7.8} fill="#fff" />
      </Card>
      {/* Léa au centre, tout le monde la pointe */}
      <Blob x={110} y={140} s={50} color={CAST.lea} mood="panic" className="gt-shake" />
      <Blob x={30} y={140} s={38} color={CAST.max} mood="smirk" />
      <Blob x={190} y={140} s={38} color={CAST.malik} mood="smirk" />
      <Blob x={66} y={112} s={28} color={CAST.ines} mood="wink" />
      <Blob x={156} y={112} s={28} color={CAST.tom} mood="wink" />
      <g className="gt-pulse">
        <Arrow d="M44 106 L80 118" head={[82, 119, 18]} color="#FFD23F" width={3.5} />
        <Arrow d="M176 106 L140 118" head={[138, 119, 162]} color="#FFD23F" width={3.5} />
        <Arrow d="M76 86 L92 98" head={[94, 100, 40]} color="#FFD23F" width={3.5} />
        <Arrow d="M146 86 L130 98" head={[128, 100, 140]} color="#FFD23F" width={3.5} />
      </g>
      <SvgText x={110} y={75} text="3 · 2 · 1 !" size={13} fill="#fff" outline className="gt-pulse" />
    </TutoSvg>
  );
}

function ArtWheel({ t, sips }: { t: Txt; sips: boolean }) {
  const faces = sips ? [...t.wheel, "?"] : ["?", "?", "?", "?"];
  const cols = ["#FFD23F", "#FF3EA5", "#4ECDC4", "#B79CFF"];
  return (
    <TutoSvg floor>
      {/* bouton « Désigner un perdant » */}
      <rect x={8} y={10} width={120} height={24} rx={12} fill="#FF3EA5" stroke={INK} strokeWidth={2.5} />
      <SvgText x={68} y={22.5} text={t.pickLoser} size={t.pickLoser.length > 20 ? 7.6 : 9.5} />
      {/* roulette qui tourne */}
      <g transform="translate(68 88)">
        <g style={{ animation: "gt-spin 2.4s cubic-bezier(.2,.8,.3,1) infinite" }}>
          {faces.map((f, i) => (
            <g key={i} transform={`rotate(${i * 90})`}>
              <path d="M0 0 L0 -38 A38 38 0 0 1 38 0 Z" fill={cols[i]} stroke={INK} strokeWidth={2.5} />
              <SvgText x={16} y={-16} text={f} size={13} />
            </g>
          ))}
        </g>
        <circle r={7} fill="#fff" stroke={INK} strokeWidth={2.5} />
        <path d="M-6 -46 L6 -46 L0 -36 Z" fill="#fff" stroke={INK} strokeWidth={2} />
      </g>
      <style>{"@keyframes gt-spin{0%{transform:rotate(0)}70%,100%{transform:rotate(585deg)}}"}</style>
      {/* Léa boit un verre d'eau */}
      <Blob x={150} y={140} s={42} color={CAST.lea} mood="sad" />
      <g className="gt-wiggle">
        <path d="M172 92 L176 120 L188 120 L192 92 Z" fill="rgba(160,220,255,0.8)" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      </g>
      {/* puis le tél passe au joueur suivant */}
      <Arrow d="M150 38 Q178 22 204 44" head={[205, 46, 60]} color="#fff" width={3.5} />
      <SvgText x={176} y={58} text={t.next} size={10} fill="#fff" />
    </TutoSvg>
  );
}

/** Slides du tuto (dans la langue courante). */
export function useTourneeSlides(): TutoSlide[] {
  const t = useT(TXT);
  const [sips] = useState(() => sipsAllowed(true));
  return [
    { ...t.slides[0], art: <ArtRead t={t} /> },
    { ...t.slides[1], art: <ArtVote t={t} /> },
    { title: t.slides[2].title, text: sips ? t.slides[2].text : t.slide3NoSips, art: <ArtWheel t={t} sips={sips} /> },
  ];
}

/** Feuille de règles de La Tournée (avec « Revoir le tuto »). */
export function TourneeRules({ onClose, onTuto }: { onClose: () => void; onTuto: () => void }) {
  const t = useT(TXT);
  const [sips] = useState(() => sipsAllowed(true));
  return <GameRulesSheet name={t.rulesName} rules={sips ? t.rules : t.rulesNoSips} onClose={onClose} onTuto={onTuto} />;
}
