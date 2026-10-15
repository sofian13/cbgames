import { useEffect, useRef, useState } from "react";
import { Check, Crown, Home as HomeIcon, Pause, Share2, Sparkles, Trophy } from "lucide-react";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { colorForIndex } from "@/components/games/local-kit";
import { armPartyBand, disarmPartyBand } from "@/lib/saved-players";
import { setPartyMood } from "@/lib/party-mood";
import { emitGameFinished, GAME_FINISHED_EVENT, takeLiveFinished, type GameFinishedDetail } from "@/lib/game-finished";
import { getLang, pick, useLang, useT, type I18n } from "@/lib/i18n";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { GAME_KIND, getZGame } from "../catalog";
import { shareApp } from "../settings";
import { shareResultCard, shareTrophyCard } from "@/lib/share-card";
import { soberKind } from "../no-alcohol";
import {
  announced, announcedGains, captureFinished, courageFor, endSoiree, getSoiree, kingsOf, ranking, recapTitles, recordWinners, setPhase, skipGame, unluckyOf, useSoiree, type SoireeState,
} from "../soiree";
import { allTrophies, Ceremony, TROPHY_STR, TrophyList, trophyText } from "./SoireeTrophies";
import { SOIREE } from "../strings";
import { ZBlob, ZPALETTE } from "./ZBlob";
import { BandBlob } from "./BandBlob";
import { BigBtn, Tag, useTapReady } from "./common";
import { GameScreen } from "./Screens";
import { CornerBtn, DiscoBall, SoireeStyles } from "./SoireeKit";
import { gameInfo, haptic, playersLabel } from "./util";

/** Même couleur que dans l'écran « Qui joue ? » */
const colorOf = (s: SoireeState, name: string) => colorForIndex(Math.max(0, s.band.indexOf(name)));

/**
 * Déroulé de la soirée : transition → jeu → « qui a gagné ? » → … → podium.
 * L'état vit dans soiree.ts (localStorage) : on peut quitter l'app et reprendre.
 */
export function SoireeRun({ onHome, onNew, toast }: { onHome: () => void; onNew: () => void; toast: (m: string) => void }) {
  const s = useSoiree();

  useEffect(() => {
    preloadSfx(["whoosh", "confirm", "pop", "coin", "coins", "tada", "applause", "drumroll", "cymbal", "select"]);
    // Fin d'un jeu de la playlist : on garde ce qu'il sait (gagnants, perdant, classement) pour les trophées
    const onFinished = (e: Event) => captureFinished((e as CustomEvent<GameFinishedDetail>).detail ?? {});
    window.addEventListener(GAME_FINISHED_EVENT, onFinished);
    // On ne laisse jamais la bande « armée » derrière soi
    return () => { window.removeEventListener(GAME_FINISHED_EVENT, onFinished); disarmPartyBand(); setPartyMood(null); };
  }, []);

  if (!s) return null;
  const pause = () => { disarmPartyBand(); setPartyMood(null); onHome(); };

  if (s.phase === "playing") {
    const t = pick(SOIREE, getLang());
    const toWinner = () => {
      // Jeu quitté avant son écran de fin : le classement du moment compte (s'il y en a un)
      if (!getSoiree()?.pending) { const d = takeLiveFinished(s.playlist[s.index]); if (d) captureFinished(d); }
      disarmPartyBand(); setPartyMood(null); playSfx("whoosh", { volume: 0.6 }); setPhase("winner"); };
    return (
      <GameScreen
        key={`${s.index}-${s.playlist[s.index]}`}
        id={s.playlist[s.index]}
        onExit={toWinner}
        // Écran de fin du jeu : gros « Jeu suivant » au-dessus de « Rejouer » (SoireeNextButton)
        next={{
          label: s.index < s.playlist.length - 1 ? t.nextGame : t.toResults,
          onNext: toWinner,
          always: NO_END.includes(s.playlist[s.index]),
        }}
      />
    );
  }
  if (s.phase === "winner") return <Winner key={s.index} s={s} onPause={pause} />;
  if (s.phase === "end") {
    // Cérémonie des trophées d'abord (si au moins un jeu a été joué et validé), puis le récap
    if (!s.awards?.done && s.band.length >= 2 && (s.outcomes ?? []).some(Boolean)) return <Ceremony s={s} />;
    return <End s={s} onHome={onHome} onNew={onNew} toast={toast} />;
  }
  return <Intro key={s.index} s={s} onPause={pause} />;
}

/* ───────── Transition : « Jeu 2/6 · Prochain : La Patate » ───────── */
function Intro({ s, onPause }: { s: SoireeState; onPause: () => void }) {
  const lang = useLang();
  const t = pick(SOIREE, lang);
  const g = getZGame(s.playlist[s.index])!;
  const info = gameInfo(g, lang);
  const c = ZPALETTE[g.color] ?? ZPALETTE.pink;
  const n = s.playlist.length;
  const top = ranking(s).filter((r) => r.points > 0).slice(0, 3);
  const kings = kingsOf(s);
  const longest = Math.max(...info.name.split(" ").map((w) => w.length));
  // Petit écran (iPhone SE) : blob plus petit pour garder la règle visible
  const small = typeof window !== "undefined" && window.innerHeight < 700;

  useEffect(() => { playSfx("whoosh", { volume: 0.7 }); playSfx("cymbal", { volume: 0.35, delay: 0.25 }); }, []);

  const ready = useTapReady();
  const go = () => {
    if (!ready()) return;
    haptic("medium");
    playSfx("confirm");
    // La bande est validée toute seule dans l'écran « Qui joue ? » du jeu
    armPartyBand(s.band);
    setPartyMood(s.vibe); // les jeux règlent leurs packs 18+ / peines selon l'ambiance
    setPhase("playing");
  };

  return (
    <div
      className="zz-screen-in zz-scroll fixed inset-0"
      style={{ zIndex: 30, background: `radial-gradient(rgba(255,255,255,0.12) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${c.body}`, color: c.ink }}
    >
      <SoireeStyles />
      <CornerBtn onClick={onPause} label={t.pause}><Pause size={20} strokeWidth={3} fill="currentColor" /></CornerBtn>
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5" style={{ paddingTop: "calc(var(--sat) + 14px)", paddingBottom: "calc(var(--sab) + 16px)" }}>
        {/* Progression : un point par jeu */}
        <div className="flex items-center justify-end gap-2 pl-14">
          <div className="flex flex-wrap justify-end gap-1">
            {s.playlist.map((id, i) => (
              <span
                key={id}
                className="block h-3 rounded-full"
                style={{ width: i === s.index ? 22 : 12, background: i < s.index ? "var(--zz-ink)" : i === s.index ? "#fff" : "rgba(21,8,46,0.22)", border: "2px solid var(--zz-ink)" }}
              />
            ))}
          </div>
          <Tag bg="#fff" tilt={3}>{t.gameOf(s.index + 1, n)}</Tag>
        </div>

        {/* Le blob danse sous la boule à facettes */}
        <div className="relative mt-1 flex justify-center" style={{ height: small ? 150 : 220 }}>
          <div className="zzs-swing absolute" style={{ top: -10, left: "calc(50% + 40px)" }}><DiscoBall size={70} hang={26} /></div>
          <div className="zzs-dance absolute bottom-0">
            <ZBlob size={small ? 116 : 170} color={g.color} mood={g.mood} costume={g.costume} seed={s.index} outline shadow={false} wobble={false} />
          </div>
        </div>

        <p className="mt-3 text-[17px] font-bold" style={{ opacity: 0.8 }}>{t.nextUp}</p>
        <h1 className="zz-title" style={{ fontSize: `min(56px, ${(100 / Math.max(6, longest)).toFixed(1)}vw)`, lineHeight: 0.92 }}>{info.name}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag bg="#fff" tilt={-3}>{soberKind(GAME_KIND[g.id], t.kinds[GAME_KIND[g.id]], lang)}</Tag>
          <Tag bg="var(--zz-ink)" color="#fff" tilt={2}>{playersLabel(g.players, lang)}</Tag>
        </div>
        <p className="zz-stk-sm mt-4 rounded-[20px] px-4 py-3 text-[16px] font-semibold leading-snug" style={{ background: "#fff", color: "var(--zz-ink)", rotate: "-1deg" }}>
          {info.pitch}
        </p>
        {s.vibe === "folle" && GAME_KIND[g.id] !== "boire" && (
          <p className="mt-3 text-[14px] font-bold leading-snug" style={{ opacity: 0.85 }}>
            <Sparkles size={14} strokeWidth={3} className="mr-1 inline align-[-2px]" aria-hidden />{t.spicyHint}
          </p>
        )}

        {s.index === 0 && <p className="mt-3 text-[14px] font-extrabold leading-snug" style={{ opacity: 0.85 }}><Trophy size={14} strokeWidth={3} className="mr-1 inline align-[-2px]" aria-hidden />{t.rule}</p>}
        {top.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {top.map((r) => (
              <span key={r.name} className="inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-[14px] font-extrabold" style={{ background: ZPALETTE[colorOf(s, r.name)].body, color: ZPALETTE[colorOf(s, r.name)].ink, border: "2.5px solid var(--zz-ink)" }}>
                {kings.includes(r.name) && <Crown size={14} strokeWidth={3} aria-hidden />}{r.name} · {t.pts(r.points)}
              </span>
            ))}
          </div>
        )}

        <div className="min-h-4 flex-1" />
        <div className="sticky bottom-0 z-[2] -mx-5 px-5 pt-4" style={{ paddingBottom: "calc(var(--sab) + 4px)", marginBottom: "calc(-1 * (var(--sab) + 16px))", background: `linear-gradient(180deg, ${c.body}00 0px, ${c.body} 16px)` }}>
        <BigBtn onClick={go} bg="var(--zz-ink)" color="#fff">{t.go}</BigBtn>
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => { if (!ready()) return; haptic(); playSfx("whoosh", { volume: 0.5 }); skipGame(); }} className="zz-tap min-h-11 px-3 text-[15px] font-bold underline decoration-2 underline-offset-4">
            {t.skip}
          </button>
          {s.index > 0 && (
            <button type="button" onClick={() => { if (!ready()) return; haptic(); endSoiree(); }} className="zz-tap min-h-11 px-3 text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ opacity: 0.75 }}>
              {t.finishNow}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

/** Jeux sans écran de fin (on enchaîne quand on veut) */
const NO_END: string[] = ["tu-prefere"];

/* ───────── Gagnant du jeu : automatique si le jeu le sait, sinon « Qui a gagné ? » ───────── */
function Winner({ s, onPause }: { s: SoireeState; onPause: () => void }) {
  // On annonce EXACTEMENT ce que le jeu a désigné (règle unique, src/lib/game-finished.ts) :
  // jamais de gagnant déduit ici d'un classement (le jeu a pu dire « pas de gagnant »)
  // Prénoms du jeu absents de la bande : affichés quand même, avec « Corriger »
  const { winners: suggested, unknown } = announced(s);
  const [fixing, setFixing] = useState(false);
  if (fixing) return <PickWinner s={s} suggested={suggested} onPause={onPause} />;
  if (suggested.length || unknown.length) return <AutoWinner s={s} winners={suggested} unknown={unknown} onFix={() => setFixing(true)} />;
  // Le jeu ne désigne personne (jeu sans gagnant) : on ne pose pas de question, on enchaîne
  return <NoWinner onFix={() => setFixing(true)} />;
}

const NO_WINNER: I18n<{ title: string; sub: string; pick: string }> = {
  fr: { title: "Pas de gagnant sur ce jeu", sub: "On enchaîne !", pick: "Désigner un gagnant" },
  en: { title: "No winner this time", sub: "On to the next one!", pick: "Pick a winner" },
  es: { title: "Sin ganador en este juego", sub: "¡Seguimos!", pick: "Elegir un ganador" },
};

/* Jeu sans gagnant : court écran puis suite automatique (lien discret pour en désigner un quand même) */
function NoWinner({ onFix }: { onFix: () => void }) {
  const t = useT(NO_WINNER);
  const done = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const go = () => {
    if (done.current) return;
    done.current = true;
    window.clearTimeout(timer.current);
    recordWinners([]);
  };
  useEffect(() => {
    timer.current = window.setTimeout(go, 1500);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="zz-screen-in fixed inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{ zIndex: 30, background: "#211052", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
      onClick={go} role="button">
      <h1 className="zz-title text-white" style={{ fontSize: 34, lineHeight: 1.05 }}>{t.title}</h1>
      <p className="mt-3 text-[18px] font-extrabold" style={{ color: "#FFD23F" }}>{t.sub}</p>
      <button type="button"
        onClick={(e) => { e.stopPropagation(); if (done.current) return; window.clearTimeout(timer.current); onFix(); }}
        className="fixed left-1/2 min-h-11 -translate-x-1/2 px-4 text-[14px] font-bold text-white underline decoration-2 underline-offset-4"
        style={{ bottom: "calc(var(--sab) + 18px)", opacity: 0.75 }}>
        {t.pick}
      </button>
    </div>
  );
}

const UNKNOWN_STR: I18n<{ notInBand: (names: string[]) => string; fixNow: string; goOn: (n: number) => string }> = {
  fr: {
    notInBand: (n) => `${n.map((x) => `« ${x} »`).join(", ")} ${n.length > 1 ? "ne sont" : "n'est"} pas dans la bande : qui c'était ?`,
    fixNow: "Corriger",
    goOn: (n) => (n ? "Continuer sans corriger" : "Continuer sans point"),
  },
  en: {
    notInBand: (n) => `${n.map((x) => `“${x}”`).join(", ")} ${n.length > 1 ? "aren't" : "isn't"} in the crew: who was it?`,
    fixNow: "Fix it",
    goOn: (n) => (n ? "Continue without fixing" : "Continue with no point"),
  },
  es: {
    notInBand: (n) => `${n.map((x) => `«${x}»`).join(", ")} no ${n.length > 1 ? "están" : "está"} en el grupo: ¿quién era?`,
    fixNow: "Corregir",
    goOn: (n) => (n ? "Seguir sin corregir" : "Seguir sin punto"),
  },
};

/** Secret : dernier 3 jeux classés de suite → petit mot d'encouragement (aucun effet sur les points) */
const COURAGE: I18n<(name: string) => string> = {
  fr: (n) => `Courage ${n}, ça va venir 🩹`,
  en: (n) => `Hang in there, ${n}, it's coming 🩹`,
  es: (n) => `Ánimo, ${n}, ya llegará 🩹`,
};

/* Annonce automatique « Malik gagne La Patate ! » (1,8 s ou tap), lien discret « Corriger ».
 * Un gagnant du jeu introuvable dans la bande : affiché quand même, pas de suite automatique, « Corriger » mis en avant. */
function AutoWinner({ s, winners, unknown = [], onFix }: { s: SoireeState; winners: string[]; unknown?: string[]; onFix: () => void }) {
  const lang = useLang();
  const t = pick(SOIREE, lang);
  const u = pick(UNKNOWN_STR, lang);
  const shown = [...winners, ...unknown];
  const doubt = unknown.length > 0;
  const g = getZGame(s.playlist[s.index])!;
  const info = gameInfo(g, lang);
  // Secret : 3e jeu classé de suite où ce joueur finit dernier → « Courage… » (un peu plus de temps pour le lire)
  const [courage] = useState(() => courageFor(s));
  const done = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const ready = useTapReady();
  const go = () => {
    if (done.current) return;
    done.current = true;
    window.clearTimeout(timer.current);
    haptic("success");
    playSfx("coins", { volume: 0.6 });
    recordWinners(winners);
  };
  useEffect(() => {
    playSfx("tada", { volume: 0.7 });
    haptic("success");
    if (!doubt) timer.current = window.setTimeout(go, courage ? 3200 : 1900);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const many = shown.length > 1;
  // Points annoncés = exactement ceux que recordWinners(winners) va compter
  const gains = announcedGains(s);
  const winPts = winners.length ? gains[winners[0]] ?? 0 : 0;
  // Jeu classé : les 2e / 3e payés, en une ligne (« 2e Tom +2 · 3e Inès +1 »)
  const places = [2, 1].map((pts) => ({ pts, names: s.band.filter((n) => gains[n] === pts && !winners.includes(n)) }))
    .filter((p) => p.names.length)
    .map((p) => t.placePts(4 - p.pts, p.names.join(", "), p.pts));
  const size = shown.length === 1 ? 150 : shown.length <= 3 ? 96 : 70;
  const title = t.autoWin(shown, info.name);
  return (
    <div
      className="zz-screen-in fixed inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{ zIndex: 30, background: "radial-gradient(rgba(255,255,255,0.07) 1.4px, transparent 1.6px) 0 0 / 22px 22px, #211052", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
      onClick={() => { if (!doubt && ready()) go(); }}
      role={doubt ? undefined : "button"}
      aria-label={doubt ? undefined : t.tapNext}
    >
      <SoireeStyles />
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}><ConfettiBurst count={40} /></div>
      <div className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
        <Tag bg={ZPALETTE[g.color].body} color={ZPALETTE[g.color].ink} tilt={-3}>{info.name}</Tag>
        <div className={`flex flex-wrap items-end justify-center ${many ? "gap-2" : ""}`} style={{ marginTop: Math.round(size * 0.36) }}>{/* place pour la couronne */}
          {shown.map((w, i) => (
            <div key={w} className={i === 0 ? "zzs-dance" : undefined}>
              <BandBlob name={w} size={size} color={unknown.includes(w) ? "lavender" : colorOf(s, w)} mood="laughing" seed={i + 2} crown outline shadow={false} talk={i === 0} autoTalk={i === 0} />
            </div>
          ))}
        </div>
        <h1 className="zz-title mt-4 text-white" style={{ fontSize: title.length > 34 ? 30 : title.length > 22 ? 36 : 44, lineHeight: 1, overflowWrap: "anywhere" }}>{title}</h1>
        {winners.length > 0 && <p className="mt-3 text-[22px] font-extrabold" style={{ color: "#FFD23F" }}>{t.autoPts(winPts, winners.length > 1)}</p>}
        {winners.length > 0 && places.length > 0 && (
          <p className="mt-1 max-w-[340px] text-[15px] font-bold leading-snug text-white" style={{ opacity: 0.85, overflowWrap: "anywhere" }}>{places.join(" · ")}</p>
        )}
        {doubt ? (
          <>
            <p className="mt-4 max-w-[330px] text-[16px] font-bold leading-snug text-white">{u.notInBand(unknown)}</p>
            <div className="mt-5 w-full max-w-[330px]">
              <BigBtn onClick={() => { if (!ready() || done.current) return; haptic(); playSfx("pop2", { volume: 0.5 }); onFix(); }} bg="#FFD23F">{u.fixNow}</BigBtn>
            </div>
            <button type="button" onClick={() => { if (ready()) go(); }} className="zz-tap mt-1 min-h-11 px-4 text-[15px] font-bold text-white underline decoration-2 underline-offset-4" style={{ opacity: 0.8 }}>
              {u.goOn(winners.length)}
            </button>
          </>
        ) : (
          <p className="mt-6 text-[14px] font-semibold" style={{ color: "var(--zz-dim)" }}>{t.tapNext}</p>
        )}
        {courage && (
          <div className="zz-courage zz-stk-sm mt-4 flex max-w-[330px] items-center gap-2 rounded-full py-1 pl-1.5 pr-4 text-left" role="status" style={{ background: "#fff", color: "var(--zz-ink)" }}>
            <BandBlob name={courage} size={40} color={colorOf(s, courage)} mood="sad" seed={7} outline shadow={false} wobble={false} hop={false} bandaid />
            <span className="text-[15px] font-extrabold leading-snug" style={{ overflowWrap: "anywhere" }}>{pick(COURAGE, lang)(courage)}</span>
          </div>
        )}
      </div>
      {!doubt && <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (done.current) return; window.clearTimeout(timer.current); haptic(); playSfx("pop2", { volume: 0.5 }); onFix(); }}
        className="zz-tap fixed left-1/2 min-h-11 -translate-x-1/2 px-4 text-[14px] font-bold text-white underline decoration-2 underline-offset-4"
        style={{ zIndex: 2, bottom: "calc(var(--sab) + 12px)", opacity: 0.7 }}
      >
        {t.fix}
      </button>}
    </div>
  );
}

/* « Qui a gagné ce jeu ? » : le jeu ne le sait pas (ou on corrige) */
function PickWinner({ s, suggested, onPause }: { s: SoireeState; suggested: string[]; onPause: () => void }) {
  const lang = useLang();
  const t = pick(SOIREE, lang);
  const g = getZGame(s.playlist[s.index])!;
  const info = gameInfo(g, lang);
  const [picked, setPicked] = useState<string[]>(suggested);
  // Secret : pansement du malchanceux (dernier 3 jeux classés de suite)
  const hurt = unluckyOf(s);
  const ready = useTapReady();
  // Un seul enregistrement (double tap sur « Valider » / « Personne »)
  const done = useRef(false);
  const submit = (names: string[]) => {
    if (!ready() || done.current) return;
    done.current = true;
    haptic(names.length ? "success" : undefined);
    playSfx(names.length ? "coins" : "pop2", { volume: names.length ? 0.7 : 0.5 });
    recordWinners(names, { manual: true }); // choix de la table : 2 pts par gagnant choisi
  };
  const toggle = (name: string) => {
    if (!ready()) return;
    haptic();
    playSfx(picked.includes(name) ? "pop2" : "pop", { volume: 0.6 });
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));
  };
  return (
    <div className="zz-screen-in zz-scroll zz-page fixed inset-0" style={{ zIndex: 30 }}>
      <CornerBtn onClick={onPause} label={t.pause}><Pause size={20} strokeWidth={3} fill="currentColor" /></CornerBtn>
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5" style={{ paddingTop: "calc(var(--sat) + 72px)", paddingBottom: "calc(var(--sab) + 16px)" }}>
        <div className="flex items-center gap-2">
          <Tag bg={ZPALETTE[g.color].body} color={ZPALETTE[g.color].ink} tilt={-3}>{info.name}</Tag>
          <Tag bg="#fff" tilt={2}>{t.gameOf(s.index + 1, s.playlist.length)}</Tag>
        </div>
        <h1 className="zz-title mt-3 text-white" style={{ fontSize: 42 }}>{t.winnerTitle}</h1>
        <p className="mt-1.5 text-[15px] font-semibold" style={{ color: "var(--zz-dim)" }}>{t.winnerSub}</p>
        {suggested.length > 0 && (
          <p className="mt-1 text-[14px] font-bold" style={{ color: "#FFD23F" }}>{pick(TROPHY_STR, lang).suggested}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 min-[400px]:grid-cols-3">
          {s.band.map((name, i) => {
            const col = colorOf(s, name);
            const pal = ZPALETTE[col];
            const on = picked.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(name)}
                className="zz-push zz-stk-sm relative flex min-h-[112px] flex-col items-center justify-end rounded-[22px] px-2 pb-2.5 pt-1"
                style={{ background: on ? pal.body : "#fff", color: on ? pal.ink : "var(--zz-ink)", rotate: `${on ? (i % 2 ? 3 : -3) : i % 2 ? 1 : -1}deg` }}
              >
                {on && (
                  <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full" style={{ background: "#FFD23F", border: "2.5px solid var(--zz-ink)", color: "var(--zz-ink)" }}>
                    <Check size={17} strokeWidth={3.4} aria-hidden />
                  </span>
                )}
                <BandBlob name={name} size={58} color={col} mood={on ? "laughing" : "happy"} seed={i} outline shadow={false} crown={on} hop={false} bandaid={name === hurt} />
                <span className="zz-title mt-1 w-full truncate text-center" style={{ fontSize: name.length > 10 ? 16 : 20 }}>{name}</span>
                <span className="text-[13px] font-bold" style={{ opacity: 0.7 }}>{t.pts(s.points[name] ?? 0)}</span>
              </button>
            );
          })}
        </div>

        <div className="min-h-6 flex-1" />
        <div className="sticky bottom-0 z-[2] -mx-5 px-5 pt-5" style={{ paddingBottom: "calc(var(--sab) + 4px)", marginBottom: "calc(-1 * (var(--sab) + 16px))", background: "linear-gradient(180deg, rgba(33,16,82,0) 0px, #211052 20px)" }}>
        <BigBtn
          onClick={() => submit(picked)}
          bg="#FFD23F"
          disabled={!picked.length}
        >
          {t.validate(picked.length)}
        </BigBtn>
        <button
          type="button"
          onClick={() => submit([])}
          className="zz-tap mt-1 min-h-12 w-full text-[16px] font-bold text-white underline decoration-2 underline-offset-4"
        >
          {t.nobody}
        </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Fin : podium, titres, partage ───────── */
function End({ s, onHome, onNew, toast }: { s: SoireeState; onHome: () => void; onNew: () => void; toast: (m: string) => void }) {
  const lang = useLang();
  const t = pick(SOIREE, lang);
  const rows = ranking(s);
  // Titres selon le RANG : « Roi » = les rois (co-rois si ex æquo), jamais un ex æquo du 1er en « fair-play »
  const kings = kingsOf(s);
  const recap = recapTitles(s, t.titles, t.lastTitle);
  const titleOf = (i: number) => recap[i] ?? "";
  // Trophées mesurés (+ prix du public) : remplacent le podium quand il y en a
  const trophies = allTrophies(s);
  const tt = pick(TROPHY_STR, lang);
  // Secret : pansement du malchanceux (dernier 3 jeux classés de suite)
  const hurt = unluckyOf(s);

  useEffect(() => {
    playCombo("fanfare");
    playSfx("applause", { volume: 0.5, delay: 0.5 });
    emitGameFinished({ soiree: true }); // demande de note éventuelle (zinzin/src/rating.ts)
  }, []);

  const podium = rows.slice(0, Math.min(3, rows.length));
  // Ordre visuel : 2e · 1er · 3e
  const order = podium.length === 3 ? [1, 0, 2] : podium.length === 2 ? [1, 0] : [0];
  const heights = [132, 96, 72];

  const ready = useTapReady();
  const share = async () => {
    if (!ready()) return;
    haptic();
    const lines = rows.map((r, i) => `${kings.includes(r.name) ? "👑" : `${r.rank}.`} ${r.name} · ${t.pts(r.points)} · ${titleOf(i)}`);
    const games = s.playlist.slice(0, Math.max(1, s.index)).map((id) => gameInfo(getZGame(id)!, lang).name).join(", ");
    const text = `${t.shareHead} 🪩\n${lines.join("\n")}\n${t.shareGames}${lang === "fr" ? "\u00a0:" : ":"} ${games}\n`;
    // Image story des trophées (ou du podium) ; texte seul en secours
    const top = rows[0];
    if (trophies.length) {
      const tl = trophies.map((x) => { const tx = trophyText(x, lang); return {
        label: tx.name, name: x.name, note: tx.quip, colorIndex: Math.max(0, s.band.indexOf(x.name)),
        ...(x.id === "king" ? { bg: "#FFD23F" } : x.id === "naze" ? { bg: "#D9D4F0", mood: "sad" as const } : {}),
      }; });
      const ttext = `${t.shareHead} 🪩\n${tl.map((x) => `🏆 ${x.label}${lang === "fr" ? "\u00a0:" : ":"} ${x.name}`).join("\n")}\n${t.shareGames}${lang === "fr" ? "\u00a0:" : ":"} ${games}\n`;
      const r2 = await shareTrophyCard({ chip: t.name, title: tt.recapTitle, trophies: tl, text: ttext.trim() });
      if (r2 === "shared" || r2 === "saved") toast(t.shared);
      else if (r2 === "error" && await shareApp(ttext)) toast(t.shared);
      return;
    }
    const res = top ? await shareResultCard({
      game: "soiree", chip: t.name, crown: kings.includes(top.name), mood: "laughing", color: colorOf(s, top.name),
      hero: { kicker: titleOf(0), title: top.name, sub: `${t.shareGames}${lang === "fr" ? "\u00a0:" : ":"} ${games}` },
      rows: rows.map((r, i) => ({ name: r.name, value: t.pts(r.points), note: titleOf(i), colorIndex: Math.max(0, s.band.indexOf(r.name)), rank: r.rank })),
      text: text.trim(),
    }) : "error";
    if (res === "shared" || res === "saved") toast(t.shared);
    else if (res === "error" && await shareApp(text)) toast(t.shared);
  };

  return (
    <div className="zz-screen-in zz-scroll fixed inset-0" style={{ zIndex: 30, background: "radial-gradient(rgba(255,255,255,0.07) 1.4px, transparent 1.6px) 0 0 / 22px 22px, #211052" }}>
      <SoireeStyles />
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 1 }}><ConfettiBurst count={70} /></div>
      <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5" style={{ zIndex: 2, paddingTop: "calc(var(--sat) + 64px)", paddingBottom: "calc(var(--sab) + 16px)" }}>
        <div className="zzs-swing pointer-events-none absolute right-6" style={{ top: "calc(var(--sat) - 6px)" }}><DiscoBall size={70} hang={30} /></div>
        <h1 className="zz-title pr-24" style={{ fontSize: 44, color: "#fff" }}>{t.endTitle}</h1>
        <p className="mt-2 text-[16px] font-bold" style={{ color: "#FFD23F" }}>{t.endSub(s.played ?? s.index)}</p>

        {trophies.length > 0 && (
          <>
            <h2 className="zz-title mt-6 text-[26px]" style={{ color: "#fff" }}>{tt.recapTitle}</h2>
            <TrophyList s={s} trophies={trophies} />
          </>
        )}

        {/* Podium (sans trophées mesurés) */}
        {trophies.length === 0 && <div className="mt-8 flex items-end justify-center gap-2.5">
          {order.map((k) => {
            const r = podium[k];
            if (!r) return null;
            const col = colorOf(s, r.name);
            const pal = ZPALETTE[col];
            return (
              <div key={r.name} className="flex w-[31%] min-w-0 flex-col items-center">
                <div className={k === 0 ? "zzs-dance" : undefined}>
                  <BandBlob name={r.name} size={k === 0 ? 92 : 70} color={col} mood={k === 0 ? "laughing" : k === 1 ? "happy" : "wink"} seed={k + 3} crown={kings.includes(r.name)} outline shadow={false} wobble={k !== 0} talk autoTalk={k === 0} talkDelay={1600} bandaid={r.name === hurt} />
                </div>
                <div className="zz-title mt-1 w-full truncate text-center text-white" style={{ fontSize: r.name.length > 9 ? 17 : 22 }}>{r.name}</div>
                <div
                  className="zz-stk mt-1.5 flex w-full flex-col items-center justify-start rounded-t-[18px] pt-2"
                  style={{ height: heights[k], background: pal.body, color: pal.ink, borderBottom: 0, boxShadow: "none" }}
                >
                  <span className="zz-title text-[30px]">{r.rank}</span>
                  <span className="text-[13px] font-extrabold">{t.pts(r.points)}</span>
                </div>
              </div>
            );
          })}
        </div>}

        {/* Les titres de chacun */}
        <ol className={`zz-stk ${trophies.length ? "mt-6" : "-mt-px"} flex flex-col gap-0 overflow-hidden rounded-[22px]`} style={{ background: "#fff", color: "var(--zz-ink)" }}>
          {rows.map((r, i) => (
            <li key={r.name} className="flex items-center gap-3 px-3.5 py-2.5" style={{ borderTop: i ? "2px solid rgba(21,8,46,0.1)" : undefined }}>
              <span className="zz-title w-6 text-center text-[20px]">{r.rank}</span>
              <BandBlob name={r.name} size={36} color={colorOf(s, r.name)} mood={kings.includes(r.name) ? "cool" : "happy"} seed={i} outline shadow={false} wobble={false} hop={false} bandaid={r.name === hurt} />
              <span className="min-w-0 flex-1">
                <span className="zz-title block truncate text-[19px]">{r.name}</span>
                <span className="block text-[14px] font-bold" style={{ color: kings.includes(r.name) ? "#C2187A" : "rgba(21,8,46,0.7)" }}>{titleOf(i)}</span>
              </span>
              <span className="shrink-0 text-[15px] font-extrabold">{t.pts(r.points)}</span>
            </li>
          ))}
        </ol>

        <div className="min-h-8 flex-1" />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={share} className="zz-push zz-stk flex min-h-[58px] items-center justify-center gap-2 rounded-full text-[18px] font-bold" style={{ background: "#fff", color: "var(--zz-ink)" }}>
            <Share2 size={19} strokeWidth={2.8} aria-hidden /> <span className="zz-title text-[19px]">{t.share}</span>
          </button>
          <BigBtn onClick={() => { if (!ready()) return; haptic(); onNew(); }} bg="#FFD23F" style={{ height: 58, fontSize: 19 }}>{t.newSoiree}</BigBtn>
        </div>
        <button type="button" onClick={() => { if (!ready()) return; haptic(); onHome(); }} className="zz-tap mt-2 flex min-h-12 w-full items-center justify-center gap-1.5 text-[16px] font-bold text-white underline decoration-2 underline-offset-4">
          <HomeIcon size={16} strokeWidth={2.8} aria-hidden /> {t.home}
        </button>
      </div>
    </div>
  );
}
