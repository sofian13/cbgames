"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adultDefault } from "@/lib/party-mood";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, PassScreen, colorForIndex } from "@/components/games/local-kit";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { ArrowLeft, ArrowRight, Check, Crown, Smartphone, Speech, X } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { TopRightControls } from "@/components/games/patate/rules-sheet";
import { C, Chip, DISPLAY, INK, KitStyles, SectionTitle, SoftLink, StickerBtn, StickerCard, StickerScreen, TOP_PAD, BOTTOM_PAD, dotted, sticker } from "@/components/games/patate/sticker-kit";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { useLang } from "@/lib/i18n";
import { PACKS_BY_LANG } from "./words";
import { STR } from "./i18n";

// ── Deviner le Mot ─────────────────────────────────────────
// Un joueur met le tél sur son front (écran vers les autres), les autres le
// font deviner sans dire le mot. Il tape à gauche s'il trouve, à droite pour
// passer. Chacun son tour, on cumule les mots trouvés.

const ACCENT = "#4ECDC4";
const DURATIONS = [30, 60, 90] as const;

type Phase = "setup" | "config" | "pass" | "countdown" | "playing" | "turn-end" | "final";
type WordResult = { word: string; ok: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const vib = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* rien */
  }
};

const KEYFRAMES = `
@keyframes gw-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
@keyframes gw-flash { from { opacity: .55 } to { opacity: 0 } }
`;

export default function GuessWordGame({ onReturnToLobby }: GameProps) {
  // Langue courante : interface + paquets de mots (même ids dans toutes les langues)
  const lang = useLang();
  const t = STR[lang];
  const PACKS = PACKS_BY_LANG[lang];
  // Coupure du son globale (sfx.ts) : on joue toujours, sfx.ts filtre
  const sound = true;
  useEffect(() => {
    preloadSfx(["tick", "tock", "gong", "success", "whooshdown", "bell", "whoosh", "win", "powerup", "ding"]);
  }, []);

  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [packs, setPacks] = useState<string[]>(() => PACKS.filter((p) => (p.adult ? adultDefault(!!p.defaultOn) : p.defaultOn)).map((p) => p.id)); // pack 18+ selon l'ambiance de soirée
  const [duration, setDuration] = useState<number>(60);
  const [tours, setTours] = useState(2);

  const [turn, setTurn] = useState(0); // numéro de passage global
  const [deck, setDeck] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [count, setCount] = useState(3);
  const [results, setResults] = useState<WordResult[]>([]);
  const [flash, setFlash] = useState<{ ok: boolean; n: number } | null>(null);

  const current = players.length ? turn % players.length : 0;
  const totalTurns = players.length * tours;

  // Pioche : tous les mots des packs choisis, sans doublon, mélangés
  const pool = useMemo(() => {
    const set = new Set<string>();
    PACKS.filter((p) => packs.includes(p.id)).forEach((p) => p.words.forEach((w) => set.add(w)));
    return [...set];
  }, [packs, PACKS]);

  // Compte à rebours 3-2-1 avant le tour
  useEffect(() => {
    if (phase !== "countdown") return;
    if (sound) playSfx("tick", { volume: 0.8 });
    const id = setTimeout(() => {
      if (count <= 1) {
        if (sound) playSfx("gong", { volume: 0.6, rate: 1.2 });
        vib(80);
        endAt.current = Date.now() + duration * 1000;
        setPhase("playing");
      } else setCount(count - 1);
    }, 850);
    return () => clearTimeout(id);
  }, [phase, count, sound, duration]);

  // Chrono du tour basé sur une échéance (pas de dérive), nettoyé au démontage
  const endAt = useRef(0);
  useEffect(() => {
    if (phase !== "playing") return;
    let last = -1;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      if (left === last) return;
      last = left;
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(id);
        if (sound) playSfx("bell", { volume: 0.8 });
        vib([200, 80, 200]);
        // Le mot affiché au gong est grillé : le joueur suivant repart sur un mot neuf
        setWordIdx((i) => i + 1);
        setPhase("turn-end");
      } else if (left <= 5 && sound) playSfx(left % 2 ? "tick" : "tock", { volume: 0.7, rate: 1 + (5 - left) * 0.08 });
    }, 200);
    return () => clearInterval(id);
  }, [phase, sound]);

  const startTurn = () => {
    if (wordIdx >= deck.length) {
      setDeck(shuffle(pool));
      setWordIdx(0);
    }
    setResults([]);
    setTimeLeft(duration);
    setCount(3);
    setPhase("countdown");
  };

  const answer = useCallback(
    (ok: boolean) => {
      if (phase !== "playing") return;
      const word = deck[wordIdx];
      if (!word) return;
      setResults((r) => [...r, { word, ok }]);
      setFlash({ ok, n: Date.now() });
      if (sound) {
        if (ok) playSfx("success", { volume: 0.75 });
        else playSfx("whooshdown", { volume: 0.6 });
      }
      vib(ok ? 40 : [30, 40, 30]);
      if (ok) setScores((s) => s.map((v, i) => (i === current ? v + 1 : v)));
      if (wordIdx + 1 >= deck.length) {
        // Pioche épuisée : on remélange plutôt que de bloquer
        setDeck(shuffle(pool));
        setWordIdx(0);
      } else setWordIdx(wordIdx + 1);
    },
    [phase, deck, wordIdx, sound, current, pool]
  );

  // « Mot nul ? » : change le 1er mot du tour sans le compter (avant toute réponse)
  const rerollWord = () => {
    if (phase !== "playing" || results.length > 0) return;
    if (wordIdx + 1 >= deck.length) {
      setDeck(shuffle(pool));
      setWordIdx(0);
    } else setWordIdx(wordIdx + 1);
  };

  const nextTurn = () => {
    if (turn + 1 >= totalTurns) {
      playCombo("fanfare");
      setPhase("final");
      return;
    }
    setTurn(turn + 1);
    setPhase("pass");
  };


  const controls = <TopRightControls title={t.title} rules={t.rules} accent={ACCENT} />;
  const replay = () => {
    setScores(players.map(() => 0));
    setTurn(0);
    setDeck(shuffle(pool));
    setWordIdx(0);
    setPhase("pass");
  };

  // ── Écrans ─────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <>
        {controls}
        <PlayersSetup
          emoji=""
          name={t.title}
          min={2}
          max={12}
          accent={ACCENT}
          onStart={(names) => {
            setPlayers(names);
            setPhase("config");
          }}
        />
      </>
    );
  }

  if (phase === "config") {
    const canStart = pool.length > 0;
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <Mascot size={74} color="sky" mood="thinking" arms shadow={false} />
        <h1 className="mt-1 text-center text-[clamp(42px,12vw,58px)] leading-[0.92]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          {t.title}
        </h1>
        <StickerCard bg={C.cream} radius={22} shadow={5} tilt={-1} className="mt-4 p-4">
          <ul className="space-y-1.5 text-[15px] font-semibold leading-snug">
            <li><GameInlineIcon icon={Smartphone} />{t.how1[0]}<b>{t.how1[1]}</b>{t.how1[2]}</li>
            <li><GameInlineIcon icon={Speech} />{t.how2[0]}<b>{t.how2[1]}</b>{t.how2[2]}</li>
            <li><GameInlineIcon icon={ArrowLeft} />{t.how3[0]}<b>{t.how3[1]}</b>{t.how3[2]}<b>{t.how3[3]}</b>{t.how3[4]}<GameInlineIcon icon={ArrowRight} /></li>
          </ul>
        </StickerCard>

        <div className="mt-6 w-full">
          <SectionTitle>{t.themes} <span className="text-[17px]" style={{ color: "rgba(255,255,255,0.8)" }}>· {t.words(pool.length)}</span></SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {PACKS.map((p) => {
              const on = packs.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPacks((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
                  className="zk-push relative flex items-center gap-2 px-3 py-2 text-left"
                  style={{ ...sticker(on ? (p.adult ? C.pink : ACCENT) : C.cream, { radius: 18, shadow: on ? 4 : 2 }), minHeight: 56, opacity: on ? 1 : 0.85 }}
                  aria-pressed={on}
                >
                  <span className="min-w-0 flex-1 text-[17px] leading-tight" style={DISPLAY}>
                    {p.name}
                    {p.adult && <span className="block text-[13px] font-bold" style={{ fontFamily: "inherit", letterSpacing: 0 }}>18+</span>}
                  </span>
                  {on && (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: INK, color: "#fff" }}>
                      <Check size={14} strokeWidth={3.5} aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 w-full">
          <SectionTitle>{t.timePerPlayer}</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {DURATIONS.map((d) => (
              <Chip key={d} on={duration === d} onClick={() => setDuration(d)} onBg={ACCENT}>{d} s</Chip>
            ))}
          </div>
        </div>

        <div className="mt-6 w-full">
          <SectionTitle>{t.turns}</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((n) => (
              <Chip key={n} on={tours === n} onClick={() => setTours(n)} onBg={ACCENT}>{n}</Chip>
            ))}
          </div>
          <p className="mt-2 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            {t.turnsHint(tours)}
          </p>
        </div>

        <div className="mt-auto flex w-full flex-col items-center pt-7">
          <StickerBtn big bg={ACCENT} disabled={!canStart} onClick={replay}>
            {canStart ? t.letsGo : t.pickTheme}
          </StickerBtn>
          <SoftLink onClick={() => setPhase("setup")}>{t.editPlayers}</SoftLink>
          <div className="mt-2">
            <IdeaButton game="Deviner le Mot" kind="mot" bg={C.cream} />
          </div>
        </div>
      </StickerScreen>
    );
  }

  if (phase === "pass") {
    return (
      <>
        {controls}
        <PassScreen
          toName={players[current]}
          colorIndex={current}
          accent={ACCENT}
          hint={t.passHint(Math.floor(turn / players.length) + 1, tours, duration)}
          buttonLabel={t.ready}
          onReady={startTurn}
        />
      </>
    );
  }

  if (phase === "countdown") {
    return (
      <StickerScreen bg={ACCENT} light center>
        <style>{KEYFRAMES}</style>
        <p className="text-[24px]" style={DISPLAY}><GameInlineIcon icon={Smartphone} />{t.phoneOnForehead}</p>
        <p key={count} className="mt-4 leading-none" style={{ ...DISPLAY, fontSize: 170, color: "#fff", textShadow: `6px 6px 0 ${INK}`, WebkitTextStroke: `3px ${INK}`, animation: "gw-pop .5s ease-out" }}>
          {count > 0 ? count : "GO"}
        </p>
      </StickerScreen>
    );
  }

  if (phase === "playing") {
    const word = deck[wordIdx] ?? "";
    const urgent = timeLeft <= 10;
    const found = results.filter((r) => r.ok).length;
    const long = word.length > 14;
    // le mot le plus long doit tenir sur une ligne (pas de « Antarc-tique »)
    const longestWord = Math.max(1, ...word.split(/\s+/).map((w) => w.length));
    return (
      <div className="relative flex min-h-[100dvh] shrink-0 select-none flex-col overflow-hidden" style={{ ...dotted(urgent ? "#5E1640" : C.night), color: "#fff", touchAction: "manipulation", transition: "background-color .5s" }}>
        <KitStyles />
        <style>{KEYFRAMES}</style>
        {flash && (
          <div
            key={flash.n}
            className="pointer-events-none absolute inset-0 z-20"
            style={{ background: flash.ok ? C.mint : C.coral, animation: "gw-flash .4s ease-out forwards" }}
          />
        )}
        {/* Chrono et score centrés : coins du haut laissés libres */}
        <div className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <span className="px-4 py-0.5 tabular-nums leading-tight" style={{ ...sticker(urgent ? C.coral : "#fff", { radius: 999, shadow: 3 }), ...DISPLAY, fontSize: 40 }}>
            {timeLeft}
          </span>
          <span className="mt-2 text-[15px] font-bold">
            {players[current]} · {t.found(found)}
          </span>
        </div>

        {results.length === 0 && (
          <div className="absolute inset-x-0 z-30 flex justify-center" style={{ top: "calc(env(safe-area-inset-top, 0px) + 112px)" }}>
            <RerollButton onClick={rerollWord} label={t.reroll} />
          </div>
        )}
        {/* Deux grandes moitiés tactiles : à l'aveugle, le front collé au tél */}
        <div className="absolute inset-0 flex gap-0">
          <button type="button" onClick={() => answer(true)} className="flex flex-1 flex-col items-center justify-end" style={{ background: "rgba(61,220,151,0.16)", borderRight: `3px solid ${INK}`, paddingBottom: BOTTOM_PAD }} aria-label={t.got}>
            <GameIconBadge icon={Check} bg={C.mint} size={64} />
            <span className="mt-1.5 text-[20px]" style={DISPLAY}>{t.got}</span>
          </button>
          <button type="button" onClick={() => answer(false)} className="flex flex-1 flex-col items-center justify-end" style={{ background: "rgba(255,107,91,0.16)", paddingBottom: BOTTOM_PAD }} aria-label={t.skip}>
            <GameIconBadge icon={X} bg={C.coral} size={64} />
            <span className="mt-1.5 text-[20px]" style={DISPLAY}>{t.skip}</span>
          </button>
        </div>

        <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center px-4" style={{ paddingTop: TOP_PAD }}>
          <div key={wordIdx + deck.length} className="max-w-full px-5 py-4 text-center" style={{ ...sticker(C.cream, { radius: 26, shadow: 6 }), transform: "rotate(-2deg)", animation: "gw-pop .25s ease-out" }}>
            <h2
              lang={lang}
              style={{ ...DISPLAY, fontSize: `min(${long ? "10vw, 3rem" : "14vw, 4.2rem"}, ${(130 / longestWord).toFixed(1)}vw)`, lineHeight: 1.02, overflowWrap: "anywhere", hyphens: "auto" }}
            >
              {word}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "turn-end") {
    const found = results.filter((r) => r.ok).length;
    const last = turn + 1 >= totalTurns;
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker(C.coral, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
          {t.timeUp}
        </span>
        <div className="mt-3">
          <MascotAvatar color={colorForIndex(current)} size={70} mood={found >= 8 ? "fire" : found >= 4 ? "happy" : "sad"} border={false} />
        </div>
        <h2 className="mt-1 max-w-full truncate text-center leading-none" style={{ ...DISPLAY, fontSize: `min(40px, ${(110 / Math.max(1, players[current]?.length ?? 1)).toFixed(1)}vw)`, textShadow: `3px 3px 0 ${INK}` }}>{players[current]}</h2>
        <div className="mt-3 px-6 py-1.5 text-center" style={{ ...sticker(ACCENT, { radius: 22, shadow: 5 }), transform: "rotate(-2deg)" }}>
          <p className="text-[56px] leading-none" style={DISPLAY}>{found}</p>
          <p className="text-[16px] font-bold">{t.wordsFound(found)}</p>
        </div>
        <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
          {results.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 text-[15px] font-bold" style={sticker(r.ok ? C.mint : C.cream, { radius: 999, shadow: 2, border: 2.5 })}>
              {r.ok ? <Check size={14} strokeWidth={3.5} aria-hidden /> : <X size={14} strokeWidth={3.5} aria-hidden />} {r.word}
            </span>
          ))}
          {results.length === 0 && <p className="text-[16px] font-semibold">{t.noWords}</p>}
        </div>
        <Standings players={players} scores={scores} />
        <div className="mt-auto flex w-full flex-col items-center pt-7">
          <StickerBtn big bg={ACCENT} onClick={nextTurn}>
            {last ? t.finalRanking : t.nextPlayer(players[(turn + 1) % players.length])}
          </StickerBtn>
          {!last && (
            <SoftLink
              onClick={() => {
                playCombo("fanfare");
                setPhase("final");
              }}
            >
              {t.endGame}
            </SoftLink>
          )}
        </div>
      </StickerScreen>
    );
  }

  // ── Classement final ──
  const ranking = players.map((name, i) => ({ name, i, s: scores[i] ?? 0 })).sort((a, b) => b.s - a.s);
  const top = ranking[0];
  const tie = ranking.length > 1 && ranking[1].s === top?.s;
  return (
    <StickerScreen bg={C.night}>
      {controls}
      <ConfettiBurst count={60} />
      <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker(C.yellow, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
        {tie ? t.tieTop : t.bestGuesser}
      </span>
      <div className="mt-3">
        <Mascot size={100} color={colorForIndex(top?.i ?? 0)} mood="cool" arms crown shadow={false} />
      </div>
      <h2 className="mt-1 max-w-full break-words text-center leading-[0.95]" style={{ ...DISPLAY, fontSize: `min(54px, 11vw, ${(110 / Math.max(1, ...(tie ? ranking.filter((r) => r.s === top.s) : [top]).map((r) => r?.name.length ?? 1))).toFixed(1)}vw)`, textShadow: `4px 4px 0 ${INK}` }}>
        {tie
          ? ranking.filter((r) => r.s === top.s).map((r, k) => <Fragment key={r.i}>{k ? " & " : ""}<span className="whitespace-nowrap">{r.name}</span></Fragment>)
          : top?.name}
      </h2>
      <Standings players={players} scores={scores} big />
      <div className="mt-auto flex w-full flex-col items-center pt-7">
        <StickerBtn big bg={ACCENT} onClick={replay}>{t.playAgain}</StickerBtn>
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          <StickerBtn bg={C.cream} onClick={() => setPhase("config")}>{t.themesBtn}</StickerBtn>
          {onReturnToLobby ? <StickerBtn bg={INK} color="#fff" onClick={onReturnToLobby}>{t.quit}</StickerBtn> : <span />}
        </div>
        <div className="mt-4">
          <IdeaButton game="Deviner le Mot" kind="mot" bg={C.cream} />
        </div>
      </div>
    </StickerScreen>
  );
}

function Standings({ players, scores, big }: { players: string[]; scores: number[]; big?: boolean }) {
  const rows = players.map((name, i) => ({ name, i, s: scores[i] ?? 0 })).sort((a, b) => b.s - a.s);
  return (
    <div className="mt-5 w-full space-y-2">
      {rows.map((r, k) => {
        const lead = k === 0 && r.s > 0;
        return (
          <div key={r.i} className="flex items-center gap-3 px-3" style={{ ...sticker(lead ? C.yellow : C.cream, { radius: 18, shadow: 3 }), minHeight: big ? 54 : 48 }}>
            <span className="grid w-6 place-items-center text-[18px]" style={DISPLAY}>{lead ? <Crown size={18} strokeWidth={2.8} aria-hidden /> : k + 1}</span>
            <MascotAvatar color={colorForIndex(r.i)} size={30} border={false} />
            <span className="min-w-0 flex-1 truncate text-[18px]" style={DISPLAY}>{r.name}</span>
            <span className="text-[19px]" style={DISPLAY}>{r.s}</span>
          </div>
        );
      })}
    </div>
  );
}
