import { createPortal } from "react-dom";
import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowRight, Lock, Settings, Users, Volume2, VolumeX } from "lucide-react";
import { FEATURED, SECTIONS, getZGame, type ZFeatured, type ZGame } from "../catalog";
import { ZBlob, ZPALETTE, pauseWhenOffscreen } from "./ZBlob";
import { RoundBtn, Tag } from "./common";
import { gameInfo, haptic, reducedMotion } from "./util";
import { type Lang, pick, useLang } from "@/lib/i18n";
import { UI } from "../strings";
import { Backdrop } from "./Backdrop";
import { BandSlide } from "./BandSlide";
import { GamePicker } from "./GamePicker";
import { SEASON } from "../season";
import { HalloweenEggs, TrickOrTreat } from "./HalloweenEggs";
import { DiscoMode } from "./DiscoMode";
import { ShakeRain } from "./ShakeRain";
import { GoldenBlob } from "./GoldenBlob";
import { PullBlob } from "./PullBlob";
import { CardBlob } from "./CardBlob";
import { SleepyBlob } from "./SleepyBlob";
import { FaceDownBlob } from "./FaceDownBlob";
import { TiredBlob } from "./TiredBlob";
import { DizzyHome } from "./DizzyHome";
import { TapLogo } from "./Logo";
import { drawGreeting, greetingText } from "../greeting";
import { SoireeEntry } from "./SoireeKit";
import { resumable, useSoiree } from "../soiree";
import { useNoAlcohol } from "@/lib/party-mood";
import { NOALC_UI } from "../no-alcohol";
import { isSfxMuted, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import { preloadUiSfx, uiSfx } from "@/lib/ui-sfx";

export function isLocked(g: ZGame, premium: boolean) {
  return !premium && !g.free;
}

export function Home({
  premium, onOpenGame, onSettings, onUnlock, onSoiree, onResumeSoiree,
}: {
  premium: boolean;
  onOpenGame: (id: string) => void;
  onSettings: () => void;
  onUnlock: () => void;
  /** Soirée Zinzin : nouvelle soirée / reprise */
  onSoiree: () => void;
  onResumeSoiree: () => void;
}) {
  const soiree = useSoiree();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lang = useLang();
  const t = pick(UI, lang);
  const noAlc = useNoAlcohol();
  // Tirée une fois par ouverture de l'app (l'accueil reste monté pendant les jeux)
  const [greeting] = useState(() => drawGreeting());
  useEffect(() => { preloadUiSfx(); }, []);
  // Très petit écran (iPhone SE 1re gén., 320 px) : logo un peu plus petit pour laisser la place
  // au badge Zinzin+ et aux deux boutons ronds
  const [narrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 340);
  return (
    // Secret : 3 h du matin → phrase spéciale et cernes sous les yeux des blobs (zz-3h, zinzin.css)
    <div ref={scrollRef} className={`zz-scroll zz-page zz-home fixed inset-0${greeting.slot === "three" ? " zz-3h" : ""}`}>
      <Backdrop scrollRef={scrollRef} />
      {/* Secret : secouer le tél → pluie de blobs (derrière le contenu, devant le fond) */}
      <ShakeRain homeRef={scrollRef} />
      {/* Secrets : blob doré (rare, derrière les cartes) ; blob suspendu quand on tire l'accueil vers le bas */}
      <GoldenBlob homeRef={scrollRef} />
      <PullBlob homeRef={scrollRef} contentRef={contentRef} />
      {/* Secret : ~90 s sans toucher → le blob d'une carte s'endort (réveil au premier toucher) */}
      <SleepyBlob homeRef={scrollRef} />
      {/* Secret : téléphone posé face contre la table puis retourné → un blob passe la tête */}
      <FaceDownBlob homeRef={scrollRef} />
      {/* Secret : batterie < 10 % (pas en charge) → blobs épuisés + soupir, une fois par heure au plus */}
      <TiredBlob homeRef={scrollRef} />
      {/* Secret : défiler très vite de haut en bas → blobs qui titubent, yeux en spirale */}
      <DizzyHome homeRef={scrollRef} />
      {/* Secret : boule à facettes de la carte Soirée → boîte de nuit */}
      <DiscoMode homeRef={scrollRef} />
      {/* Secrets d'Halloween (mode Halloween seulement) : fantôme, lumière éteinte (appui long sur le logo), minuit */}
      {SEASON === "halloween" && <HalloweenEggs homeRef={scrollRef} />}
      <div ref={contentRef} className="relative mx-auto max-w-lg" style={{ zIndex: 1, paddingTop: "calc(var(--sat) + 10px)", paddingBottom: "calc(var(--sab) + 32px)" }}>
        {/* En-tête */}
        <header className="relative flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <h1 className="leading-none"><TapLogo size={narrow ? 38 : 44} /></h1>
            {premium && <Tag bg="#FFD23F" tilt={-6}>{t.premium}</Tag>}
          </div>
          {/* Petite phrase selon l'heure : posée sous le logo, sans ajouter de hauteur */}
          <p data-greet className="pointer-events-none absolute left-5 right-5 top-full mt-1 truncate text-[12.5px] font-semibold leading-tight" style={{ color: "var(--zz-dim)" }}>
            {greetingText(greeting, lang)}
          </p>
          <div className={`flex shrink-0 items-center ${narrow ? "gap-1.5" : "gap-2"}`}>
            <SoundBtn lang={lang} />
            <RoundBtn onClick={() => { haptic(); uiSfx.open(); onSettings(); }} label={t.settings}>
              <Settings size={21} strokeWidth={2.5} />
            </RoundBtn>
          </div>
        </header>

        <Featured onOpenGame={onOpenGame} lang={lang} premium={premium} />

        {/* Soirée Zinzin : les jeux s'enchaînent tout seuls (sans Zinzin+ : jeux gratuits seulement) */}
        <SoireeEntry
          locked={false}
          resume={resumable(soiree) ? { i: soiree.index + 1, n: soiree.playlist.length } : null}
          onStart={onSoiree}
          onResume={onResumeSoiree}
        />

        {/* Bannière Zinzin+ */}
        {!premium && (
          <button
            type="button"
            onClick={() => { haptic(); uiSfx.open(); onUnlock(); }}
            className="zz-push zz-stk zz-rise relative mx-5 mt-5 flex w-[calc(100%-40px)] items-center gap-3 rounded-[26px] py-3.5 pl-[86px] pr-3.5 text-left"
            style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-1deg", ["--d" as string]: "80ms" }}
          >
            <div className="absolute -left-2 -top-5">
              <ZBlob size={88} color="pink" mood="cool" seed={1} shadow={false} outline crown />
            </div>
            <div className="min-w-0 flex-1">
              <div className="zz-title text-[22px]">{t.unlockAllTitle}</div>
              <div className="mt-0.5 text-[14px] font-semibold leading-snug" style={{ opacity: 0.8 }}>{t.unlockAllSub}</div>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: "var(--zz-ink)", color: "#FFD23F" }}>
              <ArrowRight size={22} strokeWidth={3} />
            </span>
          </button>
        )}

        {/* Halloween : citrouille au bord de l'écran, « Bonbon ou un sort ? » */}
        {SEASON === "halloween" && <TrickOrTreat homeRef={scrollRef} />}

        {/* Sections */}
        {SECTIONS.map((sec, si) => {
          const games = sec.ids.map(getZGame).filter((g): g is ZGame => Boolean(g));
          if (!games.length) return null;
          const big = si === 0;
          return (
            <section key={sec.id} className="mt-6">
              <div className="px-5">
                <h3 className="zz-title text-white" style={{ fontSize: big ? "min(34px, 8.5vw)" : 28 }}>
                  {stripTitle(sec.title[lang])}
                </h3>
                <p className="mt-1 text-[15px] font-medium" style={{ color: "var(--zz-dim)" }}>{noAlc && sec.id === "after" ? NOALC_UI[lang].afterSub : sec.subtitle[lang]}</p>
              </div>
              <div className="zz-rail" style={{ paddingTop: big ? 62 : 52, gap: 14 }}>
                {games.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    lang={lang}
                    big={big}
                    seed={si * 7 + i * 3}
                    tilt={(i + si) % 2 ? 1.6 : -1.6}
                    locked={isLocked(g, premium)}
                    showFree={!premium && Boolean(g.free)}
                    delay={big ? 100 + i * 70 : 0}
                    onClick={() => { haptic(); uiSfx.blob(); onOpenGame(g.id); }}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {!noAlc && (
          <p className="mt-4 px-8 text-center text-[13px] leading-relaxed" style={{ color: "var(--zz-mute)" }}>
            {t.sipNote}
          </p>
        )}
      </div>
    </div>
  );
}

/** Retire les emojis des titres de section (on affiche nos propres badges). */
function stripTitle(t: string) {
  return t.replace(/[\p{Extended_Pictographic}️]/gu, "").trim();
}

/* ───────── Carrousel « à la une » ───────── */
const AUTOPLAY_MS = 4000;

function Featured({ onOpenGame, lang, premium }: { onOpenGame: (id: string) => void; lang: Lang; premium: boolean }) {
  const t = pick(UI, lang);
  const [picking, setPicking] = useState(false);
  // Slides dont le jeu existe (une nouveauté pas encore au catalogue est masquée)
  const slides = FEATURED.filter((f) => !f.gameId || getZGame(f.gameId));
  const n = slides.length;
  // Copie de la 1re slide à la fin : on y glisse puis on revient au début sans à-coup
  const track = n > 1 ? [...slides, { ...slides[0], id: `${slides[0].id}-loop` }] : slides;
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const hold = useRef(false);
  const lastTouch = useRef(0);
  const settleT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const settle = useCallback(() => {
    const el = ref.current;
    if (!el || hold.current) return;
    const w = el.clientWidth;
    if (Math.round(el.scrollLeft / w) >= n) el.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
  }, [n]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    // Carte suivante amenée au doigt (pas le défilement auto) : petit souffle
    if (i % n !== idx && (hold.current || Date.now() - lastTouch.current < 1200)) uiSfx.swipe();
    setIdx(i % n);
    clearTimeout(settleT.current);
    settleT.current = setTimeout(settle, 140);
  };

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: reducedMotion() ? "instant" as ScrollBehavior : "smooth" });
  };

  // Défilement auto (pause pendant le doigt posé + 3 s après, et si mouvement réduit)
  useEffect(() => {
    if (n < 2 || reducedMotion()) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el || hold.current || document.hidden || el.offsetParent === null) return;
      // Le blob de la carte s'est endormi (SleepyBlob) : on ne le fait pas glisser hors de l'écran
      if (el.querySelector(".zz-dozing")) return;
      if (Date.now() - lastTouch.current < 3000) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      goTo(i + 1);
    }, AUTOPLAY_MS);
    return () => { clearInterval(t); clearTimeout(settleT.current); };
  }, [n]);

  // Cartes des slides hors écran (et de la copie de bouclage) : leurs animations (persos, étincelles…)
  // en pause. Seulement la carte (1er enfant) : « Ma bande », ouverte depuis sa slide, n'est pas concernée.
  useEffect(() => {
    const stops = Array.from(ref.current?.querySelectorAll(":scope > * > :first-child") ?? [], pauseWhenOffscreen);
    return () => stops.forEach((stop) => stop());
  }, [n]);

  if (!n) return null;

  return (
    <div className="zz-rise relative mt-2" style={{ ["--d" as string]: "20ms" }}>
      <div
        ref={ref}
        className="zz-carousel"
        onScroll={onScroll}
        onPointerDown={() => { hold.current = true; lastTouch.current = Date.now(); }}
        onPointerUp={() => { hold.current = false; lastTouch.current = Date.now(); }}
        onPointerCancel={() => { hold.current = false; lastTouch.current = Date.now(); settle(); }}
        onTouchEnd={() => { hold.current = false; lastTouch.current = Date.now(); }}
        aria-roledescription="carrousel"
        aria-label={t.featuredLabel}
      >
        {track.map((f, i) => (
          f.band
            ? <BandSlide key={f.id} f={f} lang={lang} active={i % n === idx} hidden={i >= n} />
            : <Slide key={f.id} f={f} lang={lang} active={i % n === idx} hidden={i >= n}
                onOpen={f.picker ? () => { haptic(); uiSfx.open(); setPicking(true); } : f.gameId ? () => { haptic(); uiSfx.blob(); onOpenGame(f.gameId!); } : undefined} />
        ))}
      </div>

      {/* Pagination */}
      {n > 1 && (
        <div className="mt-1 flex items-center justify-center">
          {slides.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => { lastTouch.current = Date.now(); goTo(i); }}
              aria-label={t.slideOf(i + 1, n)}
              aria-current={i === idx}
              className="grid h-9 place-items-center px-1"
            >
              <span
                className="block h-3 rounded-full"
                style={{
                  width: i === idx ? 28 : 12,
                  background: i === idx ? "#FFD23F" : "rgba(255,255,255,0.28)",
                  border: i === idx ? "2px solid var(--zz-ink)" : "2px solid transparent",
                  transition: "width 300ms var(--zz-spring), background 200ms",
                }}
              />
            </button>
          ))}
        </div>
      )}
      {/* Hors du carrousel (animé, donc transformé) : sinon la fiche « fixed » resterait prisonnière de la carte */}
      {picking && createPortal(<GamePicker premium={premium} onClose={() => setPicking(false)} onOpenGame={onOpenGame} />, document.body)}
    </div>
  );
}

function Slide({ f, lang, active, hidden, onOpen }: { f: ZFeatured; lang: Lang; active: boolean; hidden: boolean; onOpen?: () => void }) {
  const hero = !f.gameId;
  const t = pick(UI, lang);
  const body = (
    <div
      className="zz-stk relative h-[232px] w-full overflow-visible rounded-[30px] px-6 pt-5 text-left"
      style={{ background: f.bg, color: f.ink }}
    >
      {hero && <div className="pointer-events-none absolute inset-0 rounded-[27px] opacity-30" style={{ background: "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.55), transparent 45%)" }} />}
      <div className="relative" style={{ maxWidth: hero ? "64%" : "62%" }}>
        <Tag bg={hero ? "#fff" : "var(--zz-ink)"} color={hero ? "var(--zz-ink)" : f.bg.startsWith("#") ? f.bg : "#fff"} tilt={-4}>{f.kicker[lang]}</Tag>
        <h2 className="zz-title mt-2.5" style={{ fontSize: hero ? 31 : 36, lineHeight: 0.94 }}>{f.title[lang]}</h2>
        <p className="mt-2 text-[14.5px] font-semibold leading-snug" style={{ opacity: 0.85 }}>{f.subtitle[lang]}</p>
        {onOpen && (
          <span className="zz-stk-sm mt-3 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-bold" style={{ background: "#fff", color: "var(--zz-ink)", rotate: "2deg" }}>
            {f.cta?.[lang] ?? t.seeGame} <ArrowRight size={16} strokeWidth={3} />
          </span>
        )}
      </div>
      {/* Le blob déborde de la carte */}
      <div className="absolute -right-3" style={{ bottom: -18 }}>
        <ZBlob size={hero ? 150 : 140} color={f.blob} mood={f.mood} seed={hero ? 2 : f.id.length} shadow={false} outline={!hero} wobble={active} costume={f.costume ?? (f.gameId ? getZGame(f.gameId)?.costume : SEASON === "halloween" ? "witch" : undefined)} />
      </div>
      {f.buddy && (
        <div className="absolute right-6 -top-5">
          <ZBlob size={52} color={f.buddy.color} mood={f.buddy.mood} seed={5} shadow={false} speed={2} outline wobble={active} />
        </div>
      )}
    </div>
  );
  return (
    <div className="px-5 pb-6 pt-7" aria-hidden={hidden || undefined}>
      {onOpen ? (
        <button type="button" onClick={onOpen} tabIndex={hidden ? -1 : 0} className="zz-push block w-full rounded-[30px]" aria-label={f.cta ? f.title[lang] : t.seeGameAria(f.title[lang])}>
          {body}
        </button>
      ) : body}
    </div>
  );
}

/* ───────── Carte de jeu ───────── */
function GameCard({
  game, lang, big, seed, tilt, locked, showFree, delay, onClick,
}: {
  game: ZGame; lang: Lang; big: boolean; seed: number; tilt: number; locked: boolean; showFree: boolean; delay: number; onClick: () => void;
}) {
  const info = gameInfo(game, lang);
  const t = pick(UI, lang);
  const c = ZPALETTE[game.color] ?? ZPALETTE.pink;
  const w = big ? 214 : 172;
  const blob = big ? 112 : 88;
  // Un mot très long (« Loup-Garou ») : titre un peu plus petit pour garder la marge de la carte
  const longWord = Math.max(...info.name.split(" ").map((w) => w.length)) >= 10;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`zz-push zz-stk relative flex shrink-0 flex-col rounded-[26px] text-left ${big ? "zz-rise" : ""}`}
      style={{
        width: w, height: big ? 262 : 214,
        background: c.body,
        color: c.ink,
        rotate: `${tilt}deg`,
        ["--d" as string]: `${delay}ms`,
      }}
      aria-label={`${info.name}${locked ? t.lockedSuffix : ""}`}
    >
      {/* Blob qui dépasse du haut de la carte (secret : il réagit quand on le touche, sans ouvrir la fiche) */}
      <div className="absolute z-[3]" style={{ right: big ? 6 : -10, top: -blob * 0.34 }}>
        <CardBlob size={blob} color={game.color} mood={game.mood} seed={seed} costume={game.costume} />
      </div>

      {/* Coin haut-gauche : sticker joueurs (+ cadenas), sur une ligne, à l'écart du blob */}
      <div className="relative z-[2] px-3 pt-3">
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-extrabold"
          style={{ background: locked ? "var(--zz-ink)" : "#fff", color: locked ? "#fff" : "var(--zz-ink)", border: "2.5px solid var(--zz-ink)", boxShadow: "0 3px 0 var(--zz-ink)", rotate: "-3deg" }}
        >
          {/* Verrouillé : cadenas à la place de l'icône joueurs (sticker plus court) */}
          {locked ? <Lock size={13} strokeWidth={3} aria-hidden /> : <Users size={14} strokeWidth={3} aria-hidden />}
          {game.players.replace("-", "–")}
        </span>
      </div>

      <div className="flex-1" />

      <div className="relative px-4 pb-4">
        {/* Étiquettes juste au-dessus du titre (jamais sous le blob) */}
        {(game.isNew || game.adult || showFree) && (
          // Une seule ligne d'étiquettes compactes : « Nouveau » et « Gratuit » fusionnent si les deux
          <div className="mb-2 flex flex-nowrap items-center gap-1.5">
            {(game.isNew || showFree) && (
              <Tag bg="#fff" tilt={-3} style={TAG_SM}>
                {game.isNew && showFree ? `${t.tagNew} · ${t.tagFree}` : game.isNew ? t.tagNew : t.tagFree}
              </Tag>
            )}
            {game.adult && <Tag bg="var(--zz-ink)" color="#fff" tilt={3} style={TAG_SM}>18+</Tag>}
          </div>
        )}
        <div className="zz-title" style={{ fontSize: big ? 30 : longWord ? 21 : 24, lineHeight: 0.95 }}>
          {/* Un mot ne se coupe jamais (« Loup-Garou » ne passe pas à la ligne au tiret) */}
          {info.name.split(" ").map((w, i) => (
            <Fragment key={i}>{i ? " " : ""}<span className="whitespace-nowrap">{w}</span></Fragment>
          ))}
        </div>
        <p
          className="mt-1.5 font-semibold"
          style={{ fontSize: big ? 14 : 13, lineHeight: 1.3, opacity: 0.8, display: "-webkit-box", WebkitLineClamp: big ? 3 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {info.tagline || info.pitch}
        </p>
      </div>
    </button>
  );
}

const TAG_SM: CSSProperties = { height: 24, paddingInline: 8, fontSize: 12 };

const SOUND_LABEL: Record<Lang, { off: string; on: string }> = {
  fr: { off: "Couper le son", on: "Remettre le son" },
  en: { off: "Mute sound", on: "Turn sound on" },
  es: { off: "Silenciar", on: "Activar el sonido" },
};

/** Couper / remettre le son (état global de sfx.ts, le même que le bouton son des jeux). */
function SoundBtn({ lang }: { lang: Lang }) {
  const muted = useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
  const l = SOUND_LABEL[lang] ?? SOUND_LABEL.fr;
  return (
    <RoundBtn
      label={muted ? l.on : l.off}
      onClick={() => {
        haptic();
        setSfxMuted(!muted);
        // pas de son quand on coupe ; un petit bloop quand on remet
        if (muted) uiSfx.choice();
      }}
    >
      {muted ? <VolumeX size={21} strokeWidth={2.5} /> : <Volume2 size={21} strokeWidth={2.5} />}
    </RoundBtn>
  );
}
