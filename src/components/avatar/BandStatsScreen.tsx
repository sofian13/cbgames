"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useLang, useT, type I18n, type Lang } from "@/lib/i18n";
import {
  bandMonthKey, bandStatsGameArt, bandStatsGameName, bandStatsKey, favoriteGame, gamesRanking, getBandStats, getBandWins,
  losersRanking, monthChampions, pastChampions, resetBandStats, subscribeBandStats, type BandStats, type BandWins,
} from "@/lib/band-stats";
import { useUnlocked } from "@/lib/entitlements";
import { playSfx } from "@/lib/sfx";
import { baseLook, freeLook, type AvatarLook } from "@/lib/avatar/look";
import { getPlayerLook, type BandEntry } from "@/lib/saved-players";
import { shareBandStatsCard } from "@/lib/share-card";
import type { MascotMood } from "@/components/Mascot";
import { AvatarBlob } from "./AvatarBlob";
import { AV_DISPLAY, AV_INK, AvatarLayer, RoundIconBtn, avSticker } from "./AvatarEditor";
import { colorForIndexSafe } from "./colors";

/**
 * « Les stats de la bande » : la carte d'aperçu (dans « Ma bande ») et l'écran plein écran.
 * Uniquement des chiffres mesurés (src/lib/band-stats.ts) : une stat sans données est masquée.
 */

const EMPTY: BandStats = { games: 0, byGame: {}, losses: {}, last: 0, played: {} };
export const useBandStats = () => useSyncExternalStore(subscribeBandStats, getBandStats, () => EMPTY);
const NO_WINS: BandWins = {};
const useBandWins = () => useSyncExternalStore(subscribeBandStats, getBandWins, () => NO_WINS);

const YELLOW = "#FFD23F", PINK = "#FF3EA5", MINT = "#3DDC97", SKY = "#4ECDC4", CORAL = "#FF6B5B", LAVENDER = "#A98BFF";
const CARD_COLORS = [YELLOW, SKY, PINK, MINT, LAVENDER, CORAL];

interface Str {
  title: string;
  titleOf: (name: string) => string;
  open: string;
  games: (n: number) => string;
  gamesBig: (n: number) => string;
  losses: (n: number) => string;
  lossesShort: (n: number) => string;
  kinds: (n: number) => string;
  noGameYet: string;
  noGameHint: string;
  lastLabel: string;
  last: (d: number) => string;
  loserTitle: string;
  loserOne: (name: string) => string;
  loserTie: string;
  loserNone: string;
  loserNote: string;
  favTitle: string;
  favTimes: (n: number) => string;
  favShare: (pct: number) => string;
  topTitle: string;
  crewTitle: string;
  crewPlayed: (n: number) => string;
  untouchable: string;
  share: string;
  shareText: (title: string) => string;
  shareFail: string;
  reset: string;
  resetSure: string;
  resetDone: string;
  back: string;
  emptyTitle: string;
  emptyText: string;
  /** Trophée du mois (month = nom du mois en minuscules, dans la langue) */
  champTitle: (month: string, tie: boolean) => string;
  champWins: (n: number, each: boolean) => string;
  champEmpty: string;
  champEmptyHint: string;
  champPast: string;
  champLine: (month: string, names: string) => string;
  and: string;
}

const STR: I18n<Str> = {
  fr: {
    title: "Les stats de la bande",
    titleOf: (n) => `Les stats de la bande de ${n}`,
    open: "Voir les stats de la bande",
    games: (n) => `partie${n > 1 ? "s" : ""} jouée${n > 1 ? "s" : ""}`,
    gamesBig: (n) => `${n} partie${n > 1 ? "s" : ""}`,
    losses: (n) => `${n} défaite${n > 1 ? "s" : ""}`,
    lossesShort: (n) => `défaite${n > 1 ? "s" : ""}`,
    kinds: (n) => `jeu${n > 1 ? "x" : ""} testé${n > 1 ? "s" : ""}`,
    noGameYet: "Pas encore de partie",
    noGameHint: "Finissez une partie, on compte tout.",
    lastLabel: "Dernière soirée",
    last: (d) => (d === 0 ? "aujourd'hui" : d === 1 ? "hier" : d < 14 ? `il y a ${d} jours` : d < 60 ? `il y a ${Math.round(d / 7)} semaines` : `il y a ${Math.round(d / 30)} mois`),
    loserTitle: "Qui perd le plus",
    loserOne: (n) => `${n} collectionne les défaites.`,
    loserTie: "Égalité au sommet de la honte.",
    loserNone: "Aucun perdant pour l'instant… suspect.",
    loserNote: "Compté dans les jeux qui désignent un perdant.",
    favTitle: "Jeu préféré",
    favTimes: (n) => `joué ${n} fois`,
    favShare: (p) => `${p} % de vos parties`,
    topTitle: "Top 3 des jeux",
    crewTitle: "Perso par perso",
    crewPlayed: (n) => `${n} partie${n > 1 ? "s" : ""}`,
    untouchable: "intouchable",
    share: "Partager les stats",
    shareText: (t) => `${t} sur Zinzin`,
    shareFail: "Impossible de créer l'image",
    reset: "Remettre à zéro",
    resetSure: "Sûr ? Touche encore",
    resetDone: "Stats remises à zéro",
    back: "Retour",
    emptyTitle: "Zéro partie au compteur",
    emptyText: "Finissez une partie et les stats tombent ici. Les défaites aussi.",
    champTitle: (m, tie) => `${tie ? "Co-champions" : "Champion"} ${/^[aeiouyàâäéèêëîïôöûüh]/i.test(m) ? "d'" : "de "}${m}`,
    champWins: (n, each) => `${n} victoire${n > 1 ? "s" : ""}${each ? " chacun" : ""} ce mois-ci`,
    champEmpty: "Le trône est vide ce mois-ci…",
    champEmptyHint: "Gagnez une partie pour vous asseoir dessus.",
    champPast: "Les anciens rois",
    champLine: (m, n) => `${m} : ${n}`,
    and: "&",
  },
  en: {
    title: "Crew stats",
    titleOf: (n) => `${n}'s crew stats`,
    open: "See the crew stats",
    games: (n) => `game${n > 1 ? "s" : ""} played`,
    gamesBig: (n) => `${n} game${n > 1 ? "s" : ""}`,
    losses: (n) => `${n} loss${n > 1 ? "es" : ""}`,
    lossesShort: (n) => `loss${n > 1 ? "es" : ""}`,
    kinds: (n) => `game${n > 1 ? "s" : ""} tried`,
    noGameYet: "No games yet",
    noGameHint: "Finish a game, we count everything.",
    lastLabel: "Last party",
    last: (d) => (d === 0 ? "today" : d === 1 ? "yesterday" : d < 14 ? `${d} days ago` : d < 60 ? `${Math.round(d / 7)} weeks ago` : `${Math.round(d / 30)} months ago`),
    loserTitle: "Loses the most",
    loserOne: (n) => `${n} collects losses.`,
    loserTie: "A tie at the top of shame.",
    loserNone: "No loser yet… suspicious.",
    loserNote: "Counted in games that pick a loser.",
    favTitle: "Favourite game",
    favTimes: (n) => `played ${n} time${n > 1 ? "s" : ""}`,
    favShare: (p) => `${p}% of your games`,
    topTitle: "Top 3 games",
    crewTitle: "Crew members",
    crewPlayed: (n) => `${n} game${n > 1 ? "s" : ""}`,
    untouchable: "untouchable",
    share: "Share the stats",
    shareText: (t) => `${t} on Zinzin`,
    shareFail: "Couldn't create the image",
    reset: "Reset",
    resetSure: "Sure? Tap again",
    resetDone: "Stats reset",
    back: "Back",
    emptyTitle: "Zero games on the clock",
    emptyText: "Finish a game and the stats land here. The losses too.",
    champTitle: (m, tie) => `${m.charAt(0).toUpperCase()}${m.slice(1)} ${tie ? "co-champions" : "champion"}`,
    champWins: (n, each) => `${n} win${n > 1 ? "s" : ""}${each ? " each" : ""} this month`,
    champEmpty: "The throne is empty this month…",
    champEmptyHint: "Win a game to claim it.",
    champPast: "Former rulers",
    champLine: (m, n) => `${m}: ${n}`,
    and: "&",
  },
  es: {
    title: "Las stats del grupo",
    titleOf: (n) => `Las stats del grupo de ${n}`,
    open: "Ver las stats del grupo",
    games: (n) => `partida${n > 1 ? "s" : ""} jugada${n > 1 ? "s" : ""}`,
    gamesBig: (n) => `${n} partida${n > 1 ? "s" : ""}`,
    losses: (n) => `${n} derrota${n > 1 ? "s" : ""}`,
    lossesShort: (n) => `derrota${n > 1 ? "s" : ""}`,
    kinds: (n) => `juego${n > 1 ? "s" : ""} probado${n > 1 ? "s" : ""}`,
    noGameYet: "Aún no hay partidas",
    noGameHint: "Terminad una partida, lo contamos todo.",
    lastLabel: "Última fiesta",
    last: (d) => (d === 0 ? "hoy" : d === 1 ? "ayer" : d < 14 ? `hace ${d} días` : d < 60 ? `hace ${Math.round(d / 7)} semanas` : `hace ${Math.round(d / 30)} meses`),
    loserTitle: "Quién pierde más",
    loserOne: (n) => `${n} colecciona derrotas.`,
    loserTie: "Empate en la cima de la vergüenza.",
    loserNone: "Nadie ha perdido aún… sospechoso.",
    loserNote: "Contado en los juegos que eligen un perdedor.",
    favTitle: "Juego favorito",
    favTimes: (n) => `jugado ${n} ${n > 1 ? "veces" : "vez"}`,
    favShare: (p) => `${p} % de vuestras partidas`,
    topTitle: "Top 3 de juegos",
    crewTitle: "Uno por uno",
    crewPlayed: (n) => `${n} partida${n > 1 ? "s" : ""}`,
    untouchable: "intocable",
    share: "Compartir las stats",
    shareText: (t) => `${t} en Zinzin`,
    shareFail: "No se pudo crear la imagen",
    reset: "Poner a cero",
    resetSure: "¿Seguro? Toca otra vez",
    resetDone: "Stats a cero",
    back: "Volver",
    emptyTitle: "Cero partidas en el marcador",
    emptyText: "Terminad una partida y las stats caen aquí. Las derrotas también.",
    champTitle: (m, tie) => `${tie ? "Cocampeones" : "Campeón"} de ${m}`,
    champWins: (n, each) => `${n} victoria${n > 1 ? "s" : ""}${each ? " cada uno" : ""} este mes`,
    champEmpty: "El trono está vacío este mes…",
    champEmptyHint: "Ganad una partida para ocuparlo.",
    champPast: "Antiguos reyes",
    champLine: (m, n) => `${m}: ${n}`,
    and: "y",
  },
};

/** Jours entiers (calendrier) depuis une date. */
function daysSince(ms: number): number {
  const a = new Date(ms), b = new Date();
  const d0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const d1 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((d1 - d0) / 86_400_000));
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

/** Look d'un prénom : son perso de la bande, sinon son perso enregistré, sinon un blob coloré. */
function lookFor(name: string, band: BandEntry[], unlocked: boolean): AvatarLook {
  const k = bandStatsKey(name);
  const i = band.findIndex((b) => bandStatsKey(b.name) === k);
  const raw = i >= 0 ? band[i].look ?? baseLook(colorForIndexSafe(i)) : getPlayerLook(name) ?? baseLook(colorForIndexSafe(hash(k)));
  return unlocked ? raw : freeLook(raw);
}

/** Nom du mois (« 2026-10 » → « octobre »), en minuscules, dans la langue de l'app. */
const LOCALES: Record<string, string> = { fr: "fr-FR", en: "en-GB", es: "es-ES" };
function monthName(key: string, lang: Lang): string {
  const [y, m] = key.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(LOCALES[lang] ?? lang, { month: "long" }).format(new Date(y, m - 1, 15)).toLowerCase();
  } catch {
    return key;
  }
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « Malik », « Malik & Inès », « Malik, Inès & Sam ». */
const joinNames = (names: string[], and: string) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`;

/** Nom affiché d'un jeu (catalogue de l'app), ou null si inconnu (jeu retiré…). */
const gameLabel = (id: string, lang: Lang) => bandStatsGameName(id, lang) ?? null;

/** Animations d'entrée (rien si mouvement réduit). */
const CSS = `
@keyframes bst-pop{0%{opacity:0;transform:translateY(18px) scale(.92)}70%{opacity:1;transform:translateY(-3px) scale(1.02)}100%{opacity:1;transform:none}}
@keyframes bst-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes bst-rise{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes bst-rain{0%{transform:translateY(-2px);opacity:0}30%{opacity:1}100%{transform:translateY(12px);opacity:0}}
@keyframes bst-nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
.bst-in{animation:bst-pop .55s cubic-bezier(.2,.9,.3,1.3) both}
.bst-bar{transform-origin:left center;animation:bst-grow .7s cubic-bezier(.2,.8,.2,1) both}
.bst-ped{transform-origin:bottom center;animation:bst-rise .55s cubic-bezier(.2,.9,.3,1.2) both}
.bst-drop{animation:bst-rain 1.1s ease-in infinite}
.bst-arrow{animation:bst-nudge 1.6s ease-in-out infinite}
.bst-press{transition:transform .12s ease}
.bst-press:active{transform:translateY(3px) scale(.98)}
@media (prefers-reduced-motion: reduce){.bst-in,.bst-bar,.bst-ped,.bst-drop,.bst-arrow{animation:none!important}.bst-press{transition:none}}
`;
const Styles = () => <style>{CSS}</style>;

/** Entrée décalée d'un bloc (+ rotation de sticker conservée pendant l'animation). */
const enter = (i: number, rot = 0): CSSProperties => ({ animationDelay: `${0.06 + i * 0.08}s`, rotate: `${rot}deg` });

/* ───────── Carte d'aperçu (dans « Ma bande ») ───────── */
export function BandStatsCard({ onOpen }: { onOpen: () => void }) {
  const t = useT(STR);
  const s = useBandStats();
  const losers = losersRanking(s);
  const kinds = Object.keys(s.byGame).length;
  // 2e chiffre : le pire perdant s'il est seul en tête, sinon le nombre de jeux testés
  const top = losers[0] && (!losers[1] || losers[1].n < losers[0].n) ? losers[0] : null;
  return (
    <button type="button" onClick={() => { playSfx("tap", { volume: 0.4 }); onOpen(); }} aria-label={t.open}
      className="bst-press mb-3 block w-full rounded-[24px] px-4 pb-3.5 pt-3 text-left"
      style={{ ...avSticker(YELLOW, 5), color: AV_INK, rotate: "-1deg" }}>
      <Styles />
      <span className="flex items-center justify-between gap-2">
        <span style={{ ...AV_DISPLAY, fontSize: 21, lineHeight: 1.05 }}>{t.title}</span>
        <span className="bst-arrow grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ ...avSticker("#fff", 2) }} aria-hidden>
          <ChevronRight size={20} strokeWidth={3.2} />
        </span>
      </span>
      {s.games === 0 ? (
        <span className="mt-1.5 block text-[14px] font-bold leading-snug">{t.noGameYet} · <span style={{ opacity: 0.75 }}>{t.noGameHint}</span></span>
      ) : (
        <span className="mt-2 grid grid-cols-2 gap-2.5">
          <span className="block rounded-[16px] px-3 py-2" style={{ ...avSticker(PINK, 3), color: "#fff", rotate: "-2deg" }}>
            <span className="block" style={{ ...AV_DISPLAY, fontSize: 34, lineHeight: 1 }}>{s.games}</span>
            <span className="block text-[12px] font-extrabold leading-tight">{t.games(s.games)}</span>
          </span>
          <span className="block rounded-[16px] px-3 py-2" style={{ ...avSticker(top ? CORAL : SKY, 3), color: top ? "#fff" : AV_INK, rotate: "2deg" }}>
            <span className="block" style={{ ...AV_DISPLAY, fontSize: 34, lineHeight: 1 }}>{top ? top.n : kinds}</span>
            <span className="block truncate text-[12px] font-extrabold leading-tight">{top ? `${t.lossesShort(top.n)} · ${top.name}` : t.kinds(kinds)}</span>
          </span>
        </span>
      )}
    </button>
  );
}

/* ───────── Écran plein écran ───────── */
export function BandStatsScreen({ band, onClose, onToast }: { band: BandEntry[]; onClose: () => void; onToast: (m: string) => void }) {
  const t = useT(STR);
  const lang = useLang();
  const unlocked = useUnlocked();
  const s = useBandStats();
  const art = bandStatsGameArt();
  const [resetArmed, setResetArmed] = useState(false);
  const [sharing, setSharing] = useState(false);

  const meName = band.find((b) => b.me)?.name ?? band[0]?.name;
  const title = meName ? t.titleOf(meName) : t.title;
  const losers = losersRanking(s);
  const podium = losers.slice(0, 3);
  const tieTop = losers.length > 1 && losers[1].n === losers[0].n;
  const ranking = gamesRanking(s).filter((g) => gameLabel(g.id, lang));
  const favId = favoriteGame(s);
  const favName = favId ? gameLabel(favId, lang) : null;
  const colorOf = (id: string, i: number) => art?.color(id) ?? CARD_COLORS[i % CARD_COLORS.length];
  const days = s.last ? daysSince(s.last) : null;
  const tracked = Object.keys(s.played).length > 0;
  // Trophée du mois (victoires datées)
  const wins = useBandWins();
  const monthKey = useMemo(() => bandMonthKey(), []);
  const champ = monthChampions(wins, monthKey);
  const champTie = !!champ && champ.names.length > 1;
  const champTitle = t.champTitle(monthName(monthKey, lang), champTie);
  const past = pastChampions(wins, monthKey, 3);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const out = await shareBandStatsCard({
        title,
        games: { value: String(s.games), label: t.games(s.games) },
        last: days !== null ? { label: t.lastLabel, value: t.last(days) } : undefined,
        fav: favId && favName ? { id: favId, label: t.favTitle, name: favName, value: t.favTimes(s.byGame[favId] ?? 0), color: colorOf(favId, 0) } : undefined,
        podium: podium.length ? { title: t.loserTitle, people: podium.map((p) => ({ name: p.name, look: lookFor(p.name, band, true), value: String(p.n), label: t.lossesShort(p.n) })) } : undefined,
        top: ranking.length >= 2 ? { title: t.topTitle, rows: ranking.slice(0, 3).map((g, i) => ({ name: gameLabel(g.id, lang) ?? "", n: g.n, color: colorOf(g.id, i) })) } : undefined,
        champion: champ ? {
          label: champTitle,
          names: joinNames(champ.names.slice(0, 3), t.and),
          value: t.champWins(champ.n, champTie),
          people: champ.names.slice(0, 3).map((n) => ({ name: n, look: lookFor(n, band, true) })),
        } : undefined,
        text: t.shareText(title),
      });
      if (out === "error") onToast(t.shareFail);
    } finally {
      setSharing(false);
    }
  };

  const reset = () => {
    if (!resetArmed) { setResetArmed(true); return; }
    resetBandStats();
    setResetArmed(false);
    onToast(t.resetDone);
    playSfx("back", { volume: 0.4 });
  };

  let k = 0; // ordre d'entrée des blocs
  return (
    <AvatarLayer label={t.title} z={44}>
      <Styles />
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <RoundIconBtn onClick={onClose} label={t.back}><ArrowLeft size={22} strokeWidth={3} /></RoundIconBtn>
        <h2 className="min-w-0 flex-1" style={{ ...AV_DISPLAY, fontSize: 26, lineHeight: 1.02 }}>{t.title}</h2>
      </div>

      <div className="mx-auto w-full max-w-lg min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", overscrollBehavior: "contain" }}>
        {s.games === 0 ? (
          <div className="bst-in mt-6 flex flex-col items-center rounded-[28px] px-5 pb-6 pt-4 text-center" style={{ ...avSticker(LAVENDER, 5), color: AV_INK, ...enter(0, -1.5) }}>
            <div className="relative">
              <AvatarBlob look={lookFor(meName ?? "?", band, unlocked)} name={meName} size={130} mood="asleep" />
              <span className="absolute -right-3 top-1" style={{ ...AV_DISPLAY, fontSize: 26, rotate: "12deg" }} aria-hidden>z<span style={{ fontSize: 18 }}>z</span></span>
            </div>
            <p className="mt-2" style={{ ...AV_DISPLAY, fontSize: 26, lineHeight: 1.05 }}>{t.emptyTitle}</p>
            <p className="mt-2 text-[15px] font-bold leading-snug">{t.emptyText}</p>
            <button type="button" onClick={onClose} className="bst-press mt-5 min-h-[50px] rounded-full px-7 text-[16px]" style={{ ...avSticker("#fff", 4), ...AV_DISPLAY }}>{t.back}</button>
          </div>
        ) : (<>
          {/* Gros chiffre + dernière soirée */}
          <div className="grid grid-cols-[1.15fr_1fr] gap-3">
            <div className="bst-in flex flex-col justify-center rounded-[26px] px-4 py-3" style={{ ...avSticker(PINK, 5), color: "#fff", ...enter(k++, -2.5), gridColumn: days === null ? "1 / -1" : undefined }}>
              <span style={{ ...AV_DISPLAY, fontSize: s.games > 999 ? 52 : 68, lineHeight: 0.95, WebkitTextStroke: `2px ${AV_INK}`, paintOrder: "stroke fill", textShadow: `0 4px 0 ${AV_INK}` }}>{s.games}</span>
              <span className="mt-1 text-[14px] font-extrabold leading-tight">{t.games(s.games)}</span>
            </div>
            {days !== null && (
              <div className="bst-in flex flex-col justify-center rounded-[26px] px-3.5 py-3" style={{ ...avSticker(SKY, 5), color: AV_INK, ...enter(k++, 2.5) }}>
                <span className="text-[12px] font-extrabold uppercase tracking-wide" style={{ opacity: 0.75 }}>{t.lastLabel}</span>
                <span className="mt-1" style={{ ...AV_DISPLAY, fontSize: 24, lineHeight: 1.02 }}>{t.last(days)}</span>
              </div>
            )}
          </div>

          {/* Trophée du mois */}
          <Section title={champTitle} i={k++}>
            <MonthChampion champ={champ} band={band} unlocked={unlocked} t={t} />
            {past.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span className="font-extrabold uppercase tracking-wide">{t.champPast}</span>
                {past.map((p) => (
                  <span key={p.month} className="max-w-full truncate rounded-full px-2.5 py-0.5" style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" }}>
                    {t.champLine(cap(monthName(p.month, lang)), joinNames(p.names.slice(0, 2), t.and) + (p.names.length > 2 ? "…" : ""))}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Podium « Qui perd le plus » */}
          <Section title={t.loserTitle} i={k++}>
            {podium.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[22px] p-3" style={{ ...avSticker("#fff", 4), color: AV_INK, rotate: "1deg" }}>
                <AvatarBlob look={lookFor(meName ?? "?", band, unlocked)} name={meName} size={64} mood="sus" animate={false} />
                <p className="text-[15px] font-bold leading-snug">{t.loserNone}</p>
              </div>
            ) : (
              <>
                <Podium people={podium} band={band} unlocked={unlocked} t={t} />
                <p className="mt-3 text-center text-[15px] font-extrabold" style={{ color: YELLOW }}>{tieTop ? t.loserTie : t.loserOne(podium[0].name)}</p>
              </>
            )}
            <p className="mt-1 text-center text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{t.loserNote}</p>
          </Section>

          {/* Jeu préféré */}
          {favId && favName && (
            <Section title={t.favTitle} i={k++}>
              <div className="flex items-center gap-2 rounded-[26px] py-3 pl-2 pr-4" style={{ ...avSticker(colorOf(favId, 0), 5), color: AV_INK, rotate: "-1.5deg" }}>
                <div className="grid h-[118px] w-[118px] shrink-0 place-items-center">{art?.art(favId, 104)}</div>
                <div className="min-w-0 flex-1">
                  <p className="break-words" style={{ ...AV_DISPLAY, fontSize: favName.length > 14 ? 22 : 27, lineHeight: 1.02 }}>{favName}</p>
                  <p className="mt-2 inline-block rounded-full px-3 py-1 text-[13px] font-extrabold" style={{ ...avSticker("#fff", 2), rotate: "2deg" }}>{t.favTimes(s.byGame[favId] ?? 0)}</p>
                  <p className="mt-1.5 text-[13px] font-bold" style={{ opacity: 0.8 }}>{t.favShare(Math.round(((s.byGame[favId] ?? 0) / s.games) * 100))}</p>
                </div>
              </div>
            </Section>
          )}

          {/* Top 3 des jeux */}
          {ranking.length >= 2 && (
            <Section title={t.topTitle} i={k++}>
              <ol className="flex flex-col gap-2.5 rounded-[24px] p-3" style={{ ...avSticker("#fff", 5), color: AV_INK, rotate: "1deg" }}>
                {ranking.slice(0, 3).map((g, i) => {
                  const max = ranking[0].n;
                  const col = colorOf(g.id, i);
                  return (
                    <li key={g.id} className="flex items-center gap-2">
                      <span className="grid h-12 w-12 shrink-0 place-items-center">{art?.art(g.id, 42)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="relative h-11">
                          <div className="bst-bar absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(44, (g.n / max) * 100)}%`, background: col, border: `2.5px solid ${AV_INK}`, boxShadow: `0 3px 0 ${AV_INK}`, animationDelay: `${0.35 + i * 0.12}s` }} />
                          <div className="relative flex h-full items-center justify-between gap-2 px-3">
                            <span className="min-w-0 truncate text-[14px] font-extrabold">{gameLabel(g.id, lang)}</span>
                            <span className="shrink-0" style={{ ...AV_DISPLAY, fontSize: 20 }}>{g.n}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}

          {/* Perso par perso */}
          {band.length > 0 && (
            <Section title={t.crewTitle} i={k++}>
              <ul className="grid grid-cols-2 gap-3">
                {band.map((b, i) => {
                  const key = bandStatsKey(b.name);
                  const lost = s.losses[key]?.n ?? 0;
                  const played = s.played[key]?.n ?? 0;
                  const mood: MascotMood = lost && podium[0] && !tieTop && bandStatsKey(podium[0].name) === key ? "sad" : lost ? "happy" : "cool";
                  return (
                    <li key={b.name} className="bst-in flex flex-col items-center rounded-[22px] px-2 pb-2.5 pt-2 text-center"
                      style={{ ...avSticker(CARD_COLORS[i % CARD_COLORS.length], 4), color: AV_INK, ...enter(k + i * 0.5, i % 2 ? 1.5 : -1.5) }}>
                      <AvatarBlob look={lookFor(b.name, band, unlocked)} name={b.name} size={68} mood={mood} animate={false} />
                      <span className="mt-0.5 block w-full truncate" style={{ ...AV_DISPLAY, fontSize: 18 }}>{b.name}</span>
                      <span className="mt-1 rounded-full px-2.5 py-0.5 text-[12px] font-extrabold" style={{ background: "#fff", border: `2px solid ${AV_INK}` }}>
                        {lost ? t.losses(lost) : `0 · ${t.untouchable}`}
                      </span>
                      {tracked && played > 0 && <span className="mt-1 text-[12px] font-bold" style={{ opacity: 0.8 }}>{t.crewPlayed(played)}</span>}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {/* Partager + remise à zéro */}
          <button type="button" onClick={share} disabled={sharing}
            className="bst-press mt-8 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full text-[18px] disabled:opacity-60"
            style={{ ...avSticker(PINK, 5), color: "#fff", ...AV_DISPLAY }}>
            <ImageIcon size={21} strokeWidth={2.8} /> {t.share}
          </button>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={reset} onBlur={() => setResetArmed(false)}
              className="min-h-11 px-3 text-[13px] font-bold underline decoration-1 underline-offset-2"
              style={{ color: resetArmed ? "#FF9AA8" : "rgba(255,255,255,0.5)" }}>
              {resetArmed ? t.resetSure : t.reset}
            </button>
          </div>
        </>)}
      </div>
    </AvatarLayer>
  );
}

function Section({ title, i, children }: { title: string; i: number; children: ReactNode }) {
  return (
    <section className="bst-in mt-7" style={enter(i)}>
      <h3 className="mb-3" style={{ ...AV_DISPLAY, fontSize: 24, lineHeight: 1.05 }}>{title}</h3>
      {children}
    </section>
  );
}

/** Champion(s) du mois : blob(s) couronné(s) + trophée doré ; sinon le trône vide. */
function MonthChampion({ champ, band, unlocked, t }: { champ: { names: string[]; n: number } | null; band: BandEntry[]; unlocked: boolean; t: Str }) {
  if (!champ) {
    return (
      <div className="flex items-center gap-3 rounded-[24px] py-3 pl-3 pr-4" style={{ ...avSticker("#fff", 4), color: AV_INK, rotate: "1deg" }}>
        <EmptyThrone />
        <div className="min-w-0 flex-1">
          <p style={{ ...AV_DISPLAY, fontSize: 21, lineHeight: 1.05 }}>{t.champEmpty}</p>
          <p className="mt-1 text-[14px] font-bold leading-snug" style={{ opacity: 0.75 }}>{t.champEmptyHint}</p>
        </div>
      </div>
    );
  }
  const crew = champ.names.slice(0, 3);
  const size = crew.length === 1 ? 104 : crew.length === 2 ? 82 : 68;
  const names = joinNames(crew, t.and) + (champ.names.length > 3 ? "…" : "");
  return (
    <div className="relative flex items-center gap-2 rounded-[26px] py-3 pl-2 pr-4" style={{ ...avSticker(YELLOW, 5), color: AV_INK, rotate: "-1.5deg" }}>
      <div className="flex shrink-0 items-end" style={{ paddingTop: size * 0.3 }}>
        {crew.map((n, i) => (
          <div key={n} className="relative" style={{ marginLeft: i ? -size * 0.22 : 0, zIndex: crew.length - i }}>
            <Crown size={size * 0.46} />
            <AvatarBlob look={lookFor(n, band, unlocked)} name={n} size={size} mood="happy" animate={i === 0} />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words" style={{ ...AV_DISPLAY, fontSize: names.length > 16 ? 20 : 26, lineHeight: 1.02 }}>{names}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-[18px] py-1 pl-1.5 pr-3 text-[13px] font-extrabold leading-tight" style={{ ...avSticker("#fff", 2), rotate: "2deg" }}>
          <Trophy size={22} /> <span>{t.champWins(champ.n, crew.length > 1)}</span>
        </p>
      </div>
    </div>
  );
}

/** Petite couronne posée sur la tête du champion. */
function Crown({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.72} viewBox="-26 -24 52 32" className="absolute left-1/2 z-[2] -translate-x-1/2" style={{ top: -size * 0.42, rotate: "-8deg" }} aria-hidden>
      <path d="M-20 4 L-24 -16 L-11 -6 L0 -22 L11 -6 L24 -16 L20 4Z" fill={YELLOW} stroke={AV_INK} strokeWidth={3.4} strokeLinejoin="round" />
      <circle cx={0} cy={-6} r={3.2} fill={PINK} stroke={AV_INK} strokeWidth={1.6} />
    </svg>
  );
}

/** Petit trophée doré. */
function Trophy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden>
      <path d="M7 4h10v4.5a5 5 0 0 1-10 0z" fill={YELLOW} stroke={AV_INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M7 5.5H4.2c0 3 1.2 4.6 3.3 4.9M17 5.5h2.8c0 3-1.2 4.6-3.3 4.9" fill="none" stroke={AV_INK} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M12 13.5v3.2M8.5 20h7l-.8-3.3H9.3z" fill="#E09A00" stroke={AV_INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M9.4 6v2.2" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
    </svg>
  );
}

/** Trône vide (une toile d'araignée au coin) : personne n'a gagné ce mois-ci. */
function EmptyThrone() {
  return (
    <svg width={72} height={80} viewBox="0 0 72 80" className="shrink-0" aria-hidden>
      <path d="M14 8 Q36 -2 58 8 L56 46 H16Z" fill={LAVENDER} stroke={AV_INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M22 14 Q36 8 50 14 L49 42 H23Z" fill="#C9B8FF" opacity={0.7} />
      <rect x={8} y={44} width={56} height={14} rx={6} fill={PINK} stroke={AV_INK} strokeWidth={3} />
      <path d="M14 58 V74 M58 58 V74" stroke={AV_INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M30 5 L36 0 L42 5" fill={YELLOW} stroke={AV_INK} strokeWidth={2.2} strokeLinejoin="round" />
      {/* Toile d'araignée */}
      <g stroke="rgba(21,8,46,0.55)" strokeWidth={1.1} fill="none">
        <path d="M58 8 L44 20 M58 8 L50 24 M58 8 L56 26" />
        <path d="M51 14 Q53 17 52 20 M47 18 Q51 21 53 22" />
      </g>
    </svg>
  );
}

/** Podium : 2e à gauche, 1er au centre (l'air dépité, sous son petit nuage), 3e à droite. */
function Podium({ people, band, unlocked, t }: { people: { name: string; n: number }[]; band: BandEntry[]; unlocked: boolean; t: Str }) {
  const slots = [
    { rank: 2, ped: 58, size: 74, bg: YELLOW, tilt: -3 },
    { rank: 1, ped: 86, size: 96, bg: CORAL, tilt: 0 },
    { rank: 3, ped: 40, size: 66, bg: LAVENDER, tilt: 3 },
  ].filter((s) => people[s.rank - 1]);
  return (
    <div>
    <div className="flex items-end justify-center gap-2 px-1">
      {slots.map((sl) => {
        const p = people[sl.rank - 1];
        const first = sl.rank === 1;
        return (
          <div key={sl.rank} className="flex min-w-0 flex-1 flex-col items-center" style={{ maxWidth: first ? 130 : 112 }}>
            <div className="relative" style={{ marginTop: first ? 52 : 0 }}>
              {first && <RainCloud />}
              <AvatarBlob look={lookFor(p.name, band, unlocked)} name={p.name} size={sl.size} mood={first ? "sad" : "laughing"} />
            </div>
            <span className="relative z-[1] -mt-1 mb-1 block max-w-full truncate rounded-full px-2.5 py-0.5"
              style={{ ...avSticker("#fff", 2), color: AV_INK, ...AV_DISPLAY, fontSize: first ? 17 : 15, rotate: `${sl.tilt}deg` }}>{p.name}</span>
            <div className="bst-ped flex w-full flex-col items-center justify-start rounded-t-[16px] pt-1.5"
              style={{ height: sl.ped + 18, background: sl.bg, border: `2.5px solid ${AV_INK}`, borderBottom: 0, color: sl.bg === CORAL ? "#fff" : AV_INK, animationDelay: `${0.25 + (3 - sl.rank) * 0.1}s` }}>
              <span style={{ ...AV_DISPLAY, fontSize: first ? 30 : 24, lineHeight: 1 }}>{p.n}</span>
              <span className="text-[12px] font-extrabold leading-tight">{t.lossesShort(p.n)}</span>
            </div>
          </div>
        );
      })}
    </div>
    <div className="h-[6px] rounded-full" style={{ background: AV_INK, boxShadow: "0 2px 0 rgba(255,255,255,0.12)" }} />
    </div>
  );
}

/** Petit nuage de pluie au-dessus du premier perdant. */
function RainCloud() {
  return (
    <svg width={58} height={46} viewBox="0 0 58 46" className="absolute left-1/2 -translate-x-1/2" style={{ top: -60 }} aria-hidden>
      {[14, 28, 42].map((x, i) => (
        <path key={x} className="bst-drop" style={{ animationDelay: `${i * 0.3}s` }} d={`M${x} 28 q-3 6 0 8 q3 -2 0 -8z`} fill="#7FD4FF" stroke={AV_INK} strokeWidth={1.6} />
      ))}
      <path d="M12 26 C4 26 3 16 11 15 C11 7 22 4 27 10 C31 3 45 5 45 14 C54 14 55 26 46 26 Z" fill="#C9C3DF" stroke={AV_INK} strokeWidth={2.6} strokeLinejoin="round" />
    </svg>
  );
}
