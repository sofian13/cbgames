"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sipsAllowed } from "@/lib/party-mood";
import type { GameProps } from "@/lib/games/types";
import { colorForIndex } from "@/components/games/local-kit";
import { Mascot, MASCOT_PALETTE } from "@/components/Mascot";
import { PlayerAvatar, PlayerBlob } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { buzz, preloadObjectSfx, sfxBoom, sfxCount, sfxHeart, sfxLift, sfxPop, startFuse, unlockAudio } from "@/components/games/patate/fx";
import { ScrollReset } from "@/components/games/patate/rules-sheet";
import { patateContent, pick } from "@/components/games/patate/categories";
import { decimal } from "@/components/games/patate/i18n";
import { getLang, pick as pickLang, useT } from "@/lib/i18n";
import { LACHE_PAS_STR } from "./i18n";
import { BombBlob, C, DISPLAY, INK, KitStyles, OptionCard, SectionTitle, SoftLink, StickerBtn, StickerCard, StickerScreen, TOP_PAD, BOTTOM_PAD, dotted, sticker } from "@/components/games/patate/sticker-kit";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, type LoopHandle } from "@/lib/sfx";
import { Crown, CupSoda, Drama, Fingerprint } from "lucide-react";
import { GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { SoundButton } from "@/components/games/local-kit";
import { GameRulesSheet, GameTuto, RulesIconButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { getSavedPlayers } from "@/lib/saved-players";
import { LP_EXTRA, useLpTutoSlides } from "./tuto";
import { rankingOf, uniqueMax, useGameFinished, winnersOf, type GameScores } from "@/lib/game-finished";
import { SoireeGain, SoireeNextButton } from "@/components/games/soiree-next";
import { endHome, EndPills, EndReplay } from "@/components/games/end-actions";

// ── Lâche pas ! ────────────────────────────────────────────
// Tout le monde pose un doigt sur l'écran : une bombe à retardement (cachée,
// 4 à 22 s) s'arme. On peut retirer son doigt quand on veut… mais :
//  • ceux encore posés au BOUM ont perdu ;
//  • si personne n'est pris, c'est le premier à avoir lâché (le trouillard) qui perd ;
//  • le dernier à lâcher avant le boum gagne la couronne.
// Multi-touch pur (Pointer Events) : aucun capteur, aucune permission, fiable en WKWebView.

const ACCENT = "#FF3E6C";
const MAX_FINGERS = 5; // limite multi-touch d'un iPhone

type Phase = "intro" | "lobby" | "count" | "live" | "result" | "end";
type Penalty = "dares" | "sips";

interface Finger {
  id: number; // pointerId
  slot: number; // couleur / ordre d'arrivée
  x: number;
  y: number;
  liftedAt: number | null; // ms depuis le début de la manche
}

interface Outcome {
  fuse: number;
  losers: number[]; // slots
  coward: number | null; // slot du trouillard (personne pris)
  winner: number | null; // slot couronné
  fingers: Finger[];
  /** null : gage seul ; sinon « n gorgées ou le gage » */
  sips: number | null;
  dare: string;
}

export default function LachePasGame({ onReturnToLobby }: GameProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sipsOk] = useState(() => sipsAllowed(true)); // mode sans alcool / Soirée « Chill » : gages seulement
  const [penalty, setPenalty] = useState<Penalty>(() => (sipsOk ? "sips" : "dares"));
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [count, setCount] = useState(3);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [fake, setFake] = useState(0); // incrément = fausse alerte (anim)
  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [stats, setStats] = useState({ rounds: 0, boomed: 0, cowards: 0 });
  const t = useT(LACHE_PAS_STR);
  const x = useT(LP_EXTRA);
  // Prénoms facultatifs : le n-ième doigt posé (slot n) porte le n-ième prénom
  const [names, setNames] = useState<string[]>(() => {
    const saved = typeof window === "undefined" ? [] : getSavedPlayers().slice(0, MAX_FINGERS);
    return Array.from({ length: MAX_FINGERS }, (_, i) => saved[i] ?? "");
  });
  const nameOf = (slot: number) => names[slot]?.trim() || "";
  // Bilan de la PARTIE (toutes les manches) par doigt : couronnes, défaites, a joué au moins une manche
  const [crowns, setCrowns] = useState<number[]>(() => Array(MAX_FINGERS).fill(0));
  const [burns, setBurns] = useState<number[]>(() => Array(MAX_FINGERS).fill(0));
  const [inGame, setInGame] = useState<boolean[]>(() => Array(MAX_FINGERS).fill(false));
  const colorName = (slot: number) => t.colors[colorForIndex(slot)] ?? colorForIndex(slot);
  const labelOf = (slot: number) => nameOf(slot) || colorName(slot);
  // Classement de la partie (même calcul pour l'écran de fin et la Soirée) : le plus de couronnes,
  // ex æquo départagés par le moins de défaites ; doigts sans prénom désignés par leur couleur
  const slots = inGame.map((on, k) => (on ? k : -1)).filter((k) => k >= 0);
  const gameScores: GameScores = { names: slots.map(labelOf), values: slots.map((k) => crowns[k]), tiebreak: slots.map((k) => burns[k]), tiebreakLowerWins: true };
  const champs = winnersOf(gameScores);
  const allNamed = slots.every((k) => nameOf(k));
  // Fin de partie → note éventuelle + Soirée (app) : le résultat de la partie entière, pas de la dernière manche
  useGameFinished(phase === "end", allNamed
    ? { scores: gameScores, loser: uniqueMax(slots.map(nameOf), slots.map((k) => burns[k])) }
    // Un doigt sans prénom : seuls les couronnés qui ont un prénom comptent (jamais un autre à leur place)
    : { winners: slots.filter((k) => champs.includes(labelOf(k)) && nameOf(k)).map(nameOf), loser: null });
  const [rulesOpen, setRulesOpen] = useState(false);
  // Tuto en slides : la 1re fois qu'on ouvre le jeu
  const tuto = useFirstTimeTuto("lache-pas", { atMount: true });
  const tutoSlides = useLpTutoSlides();
  // Gages + provocations figés dans la langue du début de partie
  const [content] = useState(() => ({ dares: patateContent(getLang()).dares, taunts: pickLang(LACHE_PAS_STR).taunts }));

  const fingersRef = useRef<Finger[]>([]);
  const phaseRef = useRef<Phase>("intro");
  const startRef = useRef(0);
  const fuseRef = useRef(0);
  const timers = useRef<number[]>([]);
  const rafRef = useRef(0);
  const fuseLoopRef = useRef<LoopHandle | null>(null); // mèche qui crépite pendant la bombe

  const setF = (f: Finger[]) => {
    fingersRef.current = f;
    setFingers(f);
  };
  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    cancelAnimationFrame(rafRef.current);
    // fin de manche, nouvelle manche ou démontage : la mèche s'éteint
    fuseLoopRef.current?.(0.05);
    fuseLoopRef.current = null;
  };
  useEffect(() => {
    preloadObjectSfx();
    return () => clearTimers();
  }, []);

  // ── Fin de manche ──
  const resolve = useCallback(
    (boomed: boolean) => {
      clearTimers();
      const fs = fingersRef.current;
      const fuse = fuseRef.current;
      const still = fs.filter((f) => f.liftedAt == null);
      const lifted = fs.filter((f) => f.liftedAt != null).sort((a, b) => a.liftedAt! - b.liftedAt!);
      let losers: number[] = [];
      let coward: number | null = null;
      if (still.length > 0) losers = still.map((f) => f.slot);
      else if (lifted.length > 0) {
        coward = lifted[0].slot;
        losers = [coward];
      }
      // Le plus courageux : dernier à lâcher avant le boum (s'il n'est pas le trouillard)
      const bravest = lifted.length > 0 ? lifted[lifted.length - 1].slot : null;
      const winner = bravest != null && bravest !== coward ? bravest : null;
      const sips = penalty === "dares" ? null : 1 + Math.floor(Math.random() * 3);
      if (boomed) {
        sfxBoom();
        buzz("boom");
      } else {
        playCombo("fail");
        buzz("warn");
      }
      setOutcome({ fuse, losers, coward, winner, fingers: fs, sips, dare: pick(content.dares) });
      // Bilan de la partie : +1 couronne au plus courageux, +1 défaite à chaque perdant
      if (winner != null) setCrowns((c) => c.map((v, k) => (k === winner ? v + 1 : v)));
      setBurns((b) => b.map((v, k) => (losers.includes(k) ? v + 1 : v)));
      setInGame((g) => g.map((v, k) => v || fs.some((f) => f.slot === k)));
      setStats((s) => ({ rounds: s.rounds + 1, boomed: s.boomed + (still.length > 0 ? still.length : 0), cowards: s.cowards + (coward != null ? 1 : 0) }));
      go("result");
    },
    [penalty, content],
  );

  // ── Lancement de la bombe ──
  const arm = useCallback(() => {
    go("live");
    sfxCount(true);
    buzz("pass");
    startRef.current = performance.now();
    fuseRef.current = 4000 + Math.random() * 18000;
    setElapsed(0);
    setTaunt(null);
    // Mèche discrète en fond (son constant : aucun indice sur l'heure du boum)
    fuseLoopRef.current?.(0.05);
    fuseLoopRef.current = startFuse(0.35);
    // Explosion
    timers.current.push(window.setTimeout(() => resolve(true), fuseRef.current));
    // Fausses alertes : 1 à 3 pétards au hasard pour faire lâcher les nerveux
    const fakes = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < fakes; i++) {
      const at = 1500 + Math.random() * 16000;
      if (at < fuseRef.current - 600) {
        timers.current.push(
          window.setTimeout(() => {
            sfxPop();
            buzz("warn");
            setFake((k) => k + 1);
          }, at),
        );
      }
    }
    // Battement de cœur : son rythme dépend du temps écoulé, PAS de la mèche (aucun indice)
    let beat = 0;
    const heart = () => {
      if (phaseRef.current !== "live") return;
      const t = performance.now() - startRef.current;
      const gap = Math.max(380, 1000 - t / 25);
      sfxHeart(1 + (1000 - gap) / 900);
      buzz("tick");
      beat++;
      if (beat % 4 === 0) setTaunt(pick(content.taunts));
      timers.current.push(window.setTimeout(heart, gap));
    };
    timers.current.push(window.setTimeout(heart, 400));
    const frame = () => {
      if (phaseRef.current !== "live") return;
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [resolve, content]);

  // ── Compte à rebours une fois les doigts posés ──
  const startCountdown = useCallback(() => {
    clearTimers();
    go("count");
    setCount(3);
    sfxCount();
    let c = 3;
    const step = () => {
      c--;
      if (c <= 0) {
        arm();
        return;
      }
      setCount(c);
      sfxCount();
      timers.current.push(window.setTimeout(step, 800));
    };
    timers.current.push(window.setTimeout(step, 800));
  }, [arm]);

  // Lobby : dès que ≥2 doigts restent posés 1,2 s sans changement → compte à rebours
  useEffect(() => {
    if (phase !== "lobby") return;
    clearTimers();
    if (fingers.length >= 2) {
      timers.current.push(window.setTimeout(startCountdown, 1200));
    }
  }, [phase, fingers.length, startCountdown]);

  // ── Gestion des doigts (Pointer Events, multi-touch) ──
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const p = phaseRef.current;
    if (p !== "lobby" && p !== "count") return; // pendant la bombe, aucun nouveau doigt
    const fs = fingersRef.current;
    if (fs.length >= MAX_FINGERS || fs.some((f) => f.id === e.pointerId)) return;
    unlockAudio();
    const used = new Set(fs.map((f) => f.slot));
    let slot = 0;
    while (used.has(slot)) slot++;
    buzz("tick");
    playSfx("select", { volume: 0.5, rate: 0.9 + slot * 0.08 });
    if (p === "count") go("lobby"); // un nouveau doigt relance l'attente
    setF([...fs, { id: e.pointerId, slot, x: e.clientX, y: e.clientY, liftedAt: null }]);
  };
  const onMove = (e: React.PointerEvent) => {
    const fs = fingersRef.current;
    const i = fs.findIndex((f) => f.id === e.pointerId && f.liftedAt == null);
    if (i < 0) return;
    const next = [...fs];
    next[i] = { ...next[i], x: e.clientX, y: e.clientY };
    setF(next);
  };
  const onUp = (e: React.PointerEvent) => {
    const p = phaseRef.current;
    const fs = fingersRef.current;
    const i = fs.findIndex((f) => f.id === e.pointerId && f.liftedAt == null);
    if (i < 0) return;
    if (p === "lobby" || p === "count") {
      // Avant la bombe : on retire simplement le doigt
      if (p === "count") {
        clearTimers();
        go("lobby");
      }
      setF(fs.filter((_, k) => k !== i));
      return;
    }
    if (p === "live") {
      const next = [...fs];
      next[i] = { ...next[i], liftedAt: performance.now() - startRef.current };
      setF(next);
      sfxLift();
      // Tout le monde a lâché : inutile d'attendre la bombe
      if (next.every((f) => f.liftedAt != null)) resolve(false);
    }
  };

  const newRound = () => {
    clearTimers();
    setF([]);
    setOutcome(null);
    go("lobby");
  };

  const controls = (
    <>
      <GameTopRight>
        <SoundButton />
        <RulesIconButton onClick={() => setRulesOpen(true)} />
      </GameTopRight>
      {rulesOpen && <GameRulesSheet name={t.name} rules={[...t.rules, x.ruleNames]} onClose={() => setRulesOpen(false)} onTuto={tuto.show} />}
      {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
      <ScrollReset dep={phase} />
    </>
  );
  const rerollGage = () => {
    if (!outcome) return;
    setOutcome({ ...outcome, dare: pick(content.dares.filter((x) => x !== outcome.dare)) });
  };

  // ══ Intro ══
  if (phase === "intro") {
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <div className="relative mt-1 flex items-end justify-center gap-1">
          <Mascot size={66} color="pink" mood="shocked" sweat delay={0.1} shadow={false} />
          <div style={{ animation: "zk-throb 1s ease-in-out infinite" }}>
            <BombBlob size={112} />
          </div>
          <Mascot size={66} color="mint" mood="sus" delay={0.4} shadow={false} />
        </div>
        <h1 className="mt-2 text-center text-[clamp(48px,14vw,66px)] leading-[0.92]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          {t.name}
        </h1>
        <p className="mt-3 max-w-xs text-center text-[17px] font-semibold leading-snug">
          {t.intro}
        </p>

        {sipsOk && (
          <div className="mt-6 w-full space-y-2.5">
            <SectionTitle>{t.loserTakes}</SectionTitle>
            <OptionCard on={penalty === "dares"} onClick={() => setPenalty("dares")} icon={Drama} title={t.dareTitle} sub={t.dareSub} onBg={ACCENT} />
            <OptionCard on={penalty === "sips"} onClick={() => setPenalty("sips")} icon={CupSoda} title={t.sipsTitle} sub={t.sipsSub} onBg={ACCENT} />
          </div>
        )}

        <div className="mt-6 w-full space-y-2">
          <SectionTitle>{x.whoPlays}</SectionTitle>
          <p className="text-[14px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>{x.whoPlaysSub}</p>
          <div className="grid grid-cols-1 gap-2">
            {names.map((n, i) => (
              <label key={i} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3" style={{ ...sticker("#fff", { radius: 999, shadow: 3, border: 2.5 }) }}>
                <PlayerAvatar name={n.trim()} colorIndex={i} size={34} mood="happy" border={false} />
                <input
                  value={n}
                  maxLength={14}
                  onChange={(e) => setNames(names.map((v, k) => (k === i ? e.target.value : v)))}
                  placeholder={`${x.namePh(i + 1)} · ${colorName(i)}`}
                  aria-label={x.namePh(i + 1)}
                  className="min-h-10 min-w-0 flex-1 bg-transparent text-[16px] font-bold outline-none placeholder:font-semibold"
                  style={{ color: INK }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-auto w-full pt-7">
          <StickerBtn
            big
            bg={ACCENT}
            color="#fff"
            onClick={() => {
              unlockAudio();
              newRound();
            }}
          >
            {t.placeFingers}
          </StickerBtn>
          <p className="mt-3 text-center text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.introHint}</p>
          <div className="mt-3 flex justify-center">
            <IdeaButton game="Lâche pas !" kind="gage" bg={C.cream} />
          </div>
        </div>
      </StickerScreen>
    );
  }

  // ══ Fin ══
  if (phase === "end") {
    const replayGame = () => {
      // Nouvelle partie : bilan remis à zéro (jamais cumulé avec la précédente)
      setStats({ rounds: 0, boomed: 0, cowards: 0 });
      setCrowns(Array(MAX_FINGERS).fill(0));
      setBurns(Array(MAX_FINGERS).fill(0));
      setInGame(Array(MAX_FINGERS).fill(false));
      newRound();
    };
    return (
      <StickerScreen bg={C.night}>
        <ConfettiBurst count={40} />
        <ScrollReset dep={phase} />
        <div className="flex items-end">
          <Mascot size={104} color="pink" mood="mindblown" crown shadow={false} />
          <BombBlob size={64} face="dead" lit={false} style={{ marginLeft: -14 }} />
        </div>
        <h1 className="mt-3 text-center text-[clamp(38px,11vw,52px)] leading-[0.95]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          {t.endTitle}
        </h1>
        <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
          {[
            { v: stats.rounds, l: t.rounds(stats.rounds), bg: C.yellow, r: -2 },
            { v: stats.boomed, l: t.burnt(stats.boomed), bg: C.coral, r: 1.5 },
            { v: stats.cowards, l: t.cowards(stats.cowards), bg: C.sky, r: -1 },
          ].map((st) => (
            <div key={st.l} className="px-2 py-3 text-center" style={{ ...sticker(st.bg, { radius: 20, shadow: 4 }), transform: `rotate(${st.r}deg)` }}>
              <p className="text-[40px] leading-none" style={DISPLAY}>{st.v}</p>
              <p className="mt-1 text-[14px] font-bold leading-tight">{st.l}</p>
            </div>
          ))}
        </div>
        {/* Classement de la partie : couronnés = gagnants (les mêmes que la Soirée) */}
        {slots.length >= 2 && (
          <div className="mt-6 w-full">
            <p className="text-center text-[18px] leading-tight" style={{ ...DISPLAY, color: C.yellow }}>
              {champs.length ? x.champ(champs.join(x.and)) : x.noChamp}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {[...slots].sort((a, b) => crowns[b] - crowns[a] || burns[a] - burns[b] || a - b).map((k) => {
                const won = champs.includes(labelOf(k));
                const rank = rankingOf(gameScores).find((r) => r.name === labelOf(k))?.rank ?? 0;
                return (
                  <div key={k} className="flex items-center gap-2.5 px-3 py-2" style={{ ...sticker(won ? C.yellow : "#fff", { radius: 18, shadow: 3, border: 2.5 }), color: INK }}>
                    <span className="w-6 text-center text-[18px]" style={DISPLAY}>{won ? <Crown size={18} strokeWidth={3} aria-hidden /> : rank}</span>
                    <PlayerAvatar name={nameOf(k)} colorIndex={k} size={30} mood={won ? "cool" : "happy"} border={false} />
                    <span className="min-w-0 flex-1 truncate text-[17px]" style={DISPLAY}>{labelOf(k)}</span>
                    <span className="shrink-0 text-right text-[13px] font-bold leading-tight">{x.crowns(crowns[k])}<br />{x.losses(burns[k])}</span>
                    <SoireeGain name={labelOf(k)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Une seule action principale (Jeu suivant en Soirée, sinon Rejouer), le reste en pastilles */}
        <div className="mt-auto flex w-full flex-col items-center gap-3 pt-7">
          <SoireeNextButton bg={ACCENT} />
          <EndReplay onClick={replayGame} label={t.replay}>
            <StickerBtn big bg={ACCENT} color="#fff" onClick={replayGame}>
              {t.replay}
            </StickerBtn>
          </EndReplay>
          <EndPills className="mt-1">
            <IdeaButton short game="Lâche pas !" kind="gage" bg={C.cream} />
          </EndPills>
          {endHome(onReturnToLobby) && <SoftLink onClick={onReturnToLobby!}>{t.quit}</SoftLink>}
        </div>
      </StickerScreen>
    );
  }

  // ══ Résultat ══
  if (phase === "result" && outcome) {
    const caught = outcome.coward == null && outcome.losers.length > 0;
    // 5 doigts : blobs un peu plus petits pour tenir sur une seule rangée
    const crowd = outcome.fingers.length >= 5;
    return (
      <div
        className="relative flex min-h-dvh shrink-0 flex-col"
        style={{ ...dotted(caught ? C.coral : "#B5A1FF", true), color: INK, animation: caught ? "lp-quake 0.6s ease-out" : undefined }}
      >
        <KitStyles />
        {controls}
        {caught && <div className="pointer-events-none fixed inset-0 z-30" style={{ animation: "lp-flash 0.9s ease-out forwards" }} />}
        <div className="relative z-10 px-5 text-center" style={{ paddingTop: TOP_PAD }}>
          <p className="zk-pop leading-none" style={{ ...DISPLAY, fontSize: caught ? 72 : 52, color: caught ? C.yellow : "#fff", textShadow: `5px 5px 0 ${INK}`, WebkitTextStroke: `2.5px ${INK}`, ["--zk-r" as string]: "-3deg" }}>
            {caught ? t.boom : t.coward}
          </p>
          <p className="mt-2 text-[16px] font-bold">
            {caught
              ? t.setTo(decimal(outcome.fuse / 1000, 1, t.dec))
              : t.allLetGo(decimal(outcome.fuse / 1000, 1, t.dec))}
          </p>
        </div>
        {/* Les blobs de la manche, dans l'ordre de la table (chacun retrouve sa couleur) :
            rangés proprement, jamais les uns sur les autres ni sous la carte du bas */}
        <div className="relative z-10 mt-5 flex flex-wrap items-end justify-center gap-x-2.5 gap-y-3 px-4">
          {[...outcome.fingers].sort((a, b) => a.slot - b.slot).map((f) => {
            const lost = outcome.losers.includes(f.slot);
            const won = outcome.winner === f.slot;
            return (
              <div key={f.id} className="flex flex-col items-center" style={{ opacity: lost || won ? 1 : 0.6 }}>
                <PlayerBlob name={nameOf(f.slot)} size={lost || won ? (crowd ? 58 : 68) : crowd ? 44 : 54} colorIndex={f.slot} mood={lost ? (caught ? "dead" : "sad") : won ? "cool" : "happy"} crown={won} bob={false} shadow={false} />
                {nameOf(f.slot) && <span className="mt-1 max-w-[84px] truncate text-[14px] leading-tight" style={DISPLAY}>{nameOf(f.slot)}</span>}
                <span className="mt-1 whitespace-nowrap px-2 py-0.5 text-[13px] font-bold" style={{ ...sticker(lost ? INK : "#fff", { radius: 999, shadow: 0, border: 2, color: lost ? "#fff" : INK }) }}>
                  {f.liftedAt == null ? t.caught : `${decimal(f.liftedAt / 1000, 1, t.dec)}\u00a0s`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 mt-auto px-4 pt-6" style={{ paddingBottom: BOTTOM_PAD }}>
          <StickerCard bg={C.cream} radius={26} shadow={6} className="mx-auto max-w-md p-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {outcome.losers.map((sl) => (
                <PlayerAvatar key={sl} name={nameOf(sl)} colorIndex={sl} size={30} mood="dead" border={false} />
              ))}
              {/* Plus de 2 perdants : le titre passe sous la rangée de blobs */}
              <span className={`text-[20px] leading-tight ${outcome.losers.length > 2 ? "basis-full" : "ml-1"}`} style={DISPLAY}>
                {outcome.losers.every((sl) => nameOf(sl))
                  ? caught
                    ? x.lost(outcome.losers.map(nameOf).join(x.and))
                    : x.firstLostName(nameOf(outcome.losers[0]))
                  : caught ? (outcome.losers.length > 1 ? t.theseLost : t.thisLost) : t.firstLost}
              </span>
            </div>
            {outcome.sips != null ? (
              <p className="mt-2 text-[16px] font-semibold leading-snug">
                <b style={DISPLAY}><GameInlineIcon icon={CupSoda} /> {t.sips(outcome.sips)}</b>, {t.orDare} {outcome.dare}
              </p>
            ) : (
              <p className="mt-2 text-[16px] font-semibold leading-snug"><GameInlineIcon icon={Drama} /> {outcome.dare}</p>
            )}
            <div className="mt-3 flex justify-center">
              <RerollButton onClick={rerollGage} label={t.rerollDare} bg={C.yellow} />
            </div>
            {outcome.winner != null && (
              <p className="mt-3 text-[14px] font-bold leading-snug" style={{ color: "#4A3A66" }}>
                <GameInlineIcon icon={Crown} /> {nameOf(outcome.winner) ? x.winnerName(nameOf(outcome.winner)) : t.winner(colorName(outcome.winner))}
              </p>
            )}
            <div className="mt-4 flex gap-2.5">
              <StickerBtn bg="#fff" className="flex-1 px-3" style={{ fontSize: 16 }} onClick={() => { playCombo("fanfare"); go("end"); }}>{t.finish}</StickerBtn>
              <StickerBtn bg={ACCENT} color="#fff" className="flex-[2] whitespace-nowrap px-3" style={{ fontSize: 16 }} onClick={newRound}>{t.nextRound}</StickerBtn>
            </div>
          </StickerCard>
        </div>
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  // ══ Plateau tactile (lobby / compte à rebours / bombe) ══
  const live = phase === "live";
  const holding = fingers.filter((f) => f.liftedAt == null).length;
  const secs = elapsed / 1000;
  // L'ambiance monte avec le temps écoulé (jamais avec la mèche réelle)
  const heat = Math.min(1, secs / 18);
  // Prochain doigt attendu (slot libre le plus bas) et son prénom
  const usedSlots = new Set(fingers.map((f) => f.slot));
  let nextSlot = 0;
  while (usedSlots.has(nextSlot)) nextSlot++;
  const nextName = nameOf(nextSlot);
  const boardBg = !live ? C.night : heat < 0.45 ? "#3A1450" : heat < 0.8 ? "#5E1640" : "#7E1A2E";
  return (
    <>
    {/* Contrôles HORS de la zone tactile : un tap sur « Règles » ne doit pas compter comme un doigt */}
    {controls}
    <div
      className="relative min-h-dvh shrink-0 select-none overflow-hidden text-white"
      style={{
        ...dotted(boardBg),
        transition: "background-color .8s",
        touchAction: "none",
        WebkitTouchCallout: "none",
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <KitStyles />
      {/* Fausse alerte */}
      {fake > 0 && live && <div key={fake} className="pointer-events-none absolute inset-0 z-20" style={{ animation: "lp-fake 0.5s ease-out forwards" }} />}

      {/* Centre : consigne / compte à rebours / bombe */}
      <div className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center px-6 text-center" style={{ top: phase === "count" ? "34%" : TOP_PAD }}>
        {phase === "lobby" && (
          <>
            <div className="grid h-24 w-24 place-items-center" style={{ ...sticker(ACCENT, { radius: 999, shadow: 5, color: "#fff" }), animation: "zk-throb 1.2s ease-in-out infinite" }}>
              <Fingerprint size={54} strokeWidth={2.4} aria-hidden />
            </div>
            <p className="mt-4 text-[34px] leading-none" style={{ ...DISPLAY, textShadow: `3px 3px 0 ${INK}` }}>
              {fingers.length === 0 ? t.lobby0 : fingers.length === 1 ? t.lobby1 : t.lobbyN(fingers.length)}
            </p>
            {nextName && fingers.length < MAX_FINGERS && (
              <p className="mt-3 inline-block px-3 py-1 text-[17px] font-bold" style={{ ...sticker(MASCOT_PALETTE[colorForIndex(nextSlot)].body, { radius: 999, shadow: 3, border: 2.5, color: INK }) }}>
                {x.nextFinger(nextName)}
              </p>
            )}
            <p className="mt-3 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              {fingers.length >= MAX_FINGERS ? t.maxFingers : t.autoStart}
            </p>
          </>
        )}
        {phase === "count" && (
          <p key={count} className="zk-pop leading-none" style={{ ...DISPLAY, fontSize: 150, color: C.yellow, textShadow: `6px 6px 0 ${INK}`, WebkitTextStroke: `3px ${INK}` }}>
            {count}
          </p>
        )}
        {live && (
          <>
            <div style={{ animation: `zk-throb ${Math.max(0.35, 0.9 - heat * 0.5)}s ease-in-out infinite` }}>
              <BombBlob size={96} heat={heat} />
            </div>
            <p className="mt-2 text-[30px] leading-none" style={{ ...DISPLAY, minHeight: 32, textShadow: `3px 3px 0 ${INK}` }}>{taunt ?? t.name}</p>
            <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.holding(holding)}</p>
          </>
        )}
      </div>

      {/* Un blob sous chaque doigt (au-dessus, pour rester visible) */}
      {fingers.map((f) => {
        const c = colorForIndex(f.slot);
        const lifted = f.liftedAt != null;
        return (
          <div key={f.id} className="pointer-events-none absolute z-20" style={{ left: f.x, top: f.y }}>
            <div
              className="absolute rounded-full"
              style={{
                width: 96,
                height: 96,
                left: -48,
                top: -48,
                border: `7px solid ${MASCOT_PALETTE[c].body}`,
                boxShadow: `0 0 0 3px ${INK}, inset 0 0 0 3px ${INK}`,
                opacity: lifted ? 0.2 : 1,
                animation: lifted ? undefined : `lp-ring ${live ? 0.6 : 1.2}s ease-in-out infinite`,
              }}
            />
            <div className="absolute flex flex-col items-center" style={{ left: -32, top: -150, width: 64, opacity: lifted ? 0.55 : 1 }}>
              <PlayerBlob name={nameOf(f.slot)} size={64} colorIndex={f.slot} mood={lifted ? "cool" : live ? (heat > 0.5 ? "shocked" : "sus") : "happy"} sweat={live && !lifted} bob={false} shadow={false} />
              <span className="mt-0.5 max-w-[110px] truncate whitespace-nowrap rounded-full px-2 text-[14px] font-bold" style={{ background: MASCOT_PALETTE[c].body, color: INK, border: `2px solid ${INK}` }}>{labelOf(f.slot)}</span>
              {lifted && <span className="mt-0.5 whitespace-nowrap rounded-full bg-white px-2 text-[13px] font-bold" style={{ color: INK, border: `2px solid ${INK}` }}>{decimal(f.liftedAt! / 1000, 1, t.dec)}&nbsp;s</span>}
            </div>
          </div>
        );
      })}
      <style>{KEYFRAMES}</style>
    </div>
    </>
  );
}

const KEYFRAMES = `
@keyframes lp-ring { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes lp-fake { 0% { background: rgba(255,255,255,0.85); } 30% { background: rgba(255,62,62,0.5); } 100% { background: rgba(255,62,62,0); } }
@keyframes lp-flash { 0% { background: #fff; } 15% { background: #FFD23F; } 40% { background: rgba(255,80,30,0.8); } 100% { background: rgba(255,80,30,0); } }
@keyframes lp-quake { 0%,100% { transform: translate(0,0); } 10% { transform: translate(-12px,8px); } 20% { transform: translate(10px,-10px); } 30% { transform: translate(-8px,6px); } 45% { transform: translate(6px,-4px); } 60% { transform: translate(-3px,2px); } }
`;
