import { ChevronRight, Lock, Settings, Users } from "lucide-react";
import { SECTIONS, getZGame, type ZGame } from "../catalog";
import { ZBlob, ZPALETTE } from "./ZBlob";
import { RoundBtn } from "./common";
import { gameInfo, haptic } from "./util";

export function isLocked(g: ZGame, premium: boolean) {
  return !premium && !g.free;
}

export function Home({
  premium, onOpenGame, onSettings, onUnlock,
}: {
  premium: boolean;
  onOpenGame: (id: string) => void;
  onSettings: () => void;
  onUnlock: () => void;
}) {
  return (
    <div className="zz-scroll fixed inset-0" style={{ background: "var(--zz-bg)" }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div className="zz-glow" style={{ width: 340, height: 340, left: -140, top: -80, background: "#5A2BE0", opacity: 0.45 }} />
        <div className="zz-glow" style={{ width: 280, height: 280, right: -150, top: 60, background: "#FF3EA5", opacity: 0.2 }} />
      </div>

      <div className="relative mx-auto max-w-lg" style={{ paddingTop: "calc(var(--sat) + 10px)", paddingBottom: "calc(var(--sab) + 32px)" }}>
        {/* En-tête */}
        <header className="flex items-center justify-between px-5">
          <div className="flex items-center gap-1.5">
            <h1 className="zz-font text-white" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1 }}>zinzin</h1>
            {premium && (
              <span className="ml-1 rounded-full px-2 py-[3px] text-[11px] font-extrabold uppercase" style={{ background: "#FFD23F", color: "#2A1A00", letterSpacing: "0.04em" }}>Premium</span>
            )}
          </div>
          <RoundBtn onClick={() => { haptic(); onSettings(); }} label="Réglages">
            <Settings size={21} strokeWidth={2.2} />
          </RoundBtn>
        </header>

        {/* Hero */}
        <section
          className="zz-rise relative mx-5 mt-4 overflow-hidden rounded-[30px] px-6 pb-6 pt-6"
          style={{ background: "linear-gradient(135deg,#7A4EE8 0%,#B743D8 55%,#FF3EA5 100%)", minHeight: 176, boxShadow: "0 20px 50px rgba(122,78,232,0.35)" }}
        >
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.5), transparent 45%)" }} />
          <div className="relative max-w-[64%]">
            <h2 className="zz-font text-white" style={{ fontSize: 29, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
              On joue à quoi ce soir&nbsp;?
            </h2>
            <p className="mt-2 text-[14px] font-medium leading-snug text-white/85">Un seul téléphone, tout le monde joue.</p>
          </div>
          <div className="absolute -bottom-7 -right-3">
            <ZBlob size={150} color="yellow" mood="laughing" seed={2} shadow={false} />
          </div>
          <div className="absolute right-5 top-4">
            <ZBlob size={46} color="mint" mood="shocked" seed={5} shadow={false} speed={2} />
          </div>
        </section>

        {/* Bannière premium */}
        {!premium && (
          <button
            type="button"
            onClick={() => { haptic(); onUnlock(); }}
            className="zz-press zz-rise mx-5 mt-3 flex w-[calc(100%-40px)] items-center gap-3 rounded-[22px] py-3 pl-3 pr-4 text-left"
            style={{ background: "linear-gradient(90deg, rgba(255,210,63,0.16), rgba(255,210,63,0.05))", border: "1.5px solid rgba(255,210,63,0.45)", ["--d" as string]: "80ms" }}
          >
            <ZBlob size={44} color="yellow" mood="cool" seed={1} shadow={false} wobble={false} />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-extrabold text-white">Débloquer tout</div>
              <div className="text-[13px]" style={{ color: "var(--zz-dim)" }}>Tous les jeux + les nouveautés chaque mois</div>
            </div>
            <ChevronRight size={22} style={{ color: "#FFD23F" }} />
          </button>
        )}

        {/* Sections */}
        {SECTIONS.map((sec, si) => {
          const games = sec.ids.map(getZGame).filter((g): g is ZGame => Boolean(g));
          if (!games.length) return null;
          const big = si === 0;
          return (
            <section key={sec.id} className="mt-7">
              <div className="mb-2 px-5">
                <h3 className="zz-font text-white" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {stripTitle(sec.title)}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: "var(--zz-mute)" }}>{sec.subtitle}</p>
              </div>
              <div className="zz-rail">
                {games.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    big={big}
                    seed={si * 7 + i * 3}
                    locked={isLocked(g, premium)}
                    showFree={!premium && Boolean(g.free)}
                    delay={big ? 100 + i * 70 : 0}
                    onClick={() => { haptic(); onOpenGame(g.id); }}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <p className="mt-6 px-8 text-center text-[12px] leading-relaxed" style={{ color: "var(--zz-mute)" }}>
          Les jeux à boire se jouent avec modération. Eau et soft acceptés.
        </p>
      </div>
    </div>
  );
}

/** Retire les emojis des titres de section (on affiche nos propres badges). */
function stripTitle(t: string) {
  return t.replace(/[\p{Extended_Pictographic}️]/gu, "").trim();
}

function GameCard({
  game, big, seed, locked, showFree, delay, onClick,
}: {
  game: ZGame; big: boolean; seed: number; locked: boolean; showFree: boolean; delay: number; onClick: () => void;
}) {
  const info = gameInfo(game);
  const c = ZPALETTE[game.color] ?? ZPALETTE.pink;
  const w = big ? 236 : 162;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`zz-press relative flex shrink-0 flex-col overflow-hidden rounded-[28px] text-left ${big ? "zz-rise" : ""}`}
      style={{
        width: w, height: big ? 304 : 236,
        background: `radial-gradient(120% 80% at 30% 0%, ${c.hi}88 0%, transparent 55%), ${c.body}`,
        color: c.ink,
        boxShadow: `inset 0 -6px 0 ${c.deep}55, 0 12px 28px rgba(0,0,0,0.28)`,
        ["--d" as string]: `${delay}ms`,
      }}
      aria-label={`${info.name}${locked ? " (verrouillé)" : ""}`}
    >
      {/* Halo clair derrière le blob */}
      <div className="absolute left-1/2 rounded-full" style={{ width: w * 0.86, height: w * 0.86, marginLeft: -w * 0.43, top: big ? 8 : 0, background: `radial-gradient(circle, ${c.hi} 0%, transparent 68%)`, opacity: 0.75 }} />

      {/* Badges */}
      <div className="absolute left-3 top-3 z-[2] flex flex-wrap gap-1.5 pr-12">
        {game.isNew && <Badge bg="#fff" color="#15082E">Nouveau</Badge>}
        {game.adult && <Badge bg="#15082E" color="#fff">18+</Badge>}
        {showFree && <Badge bg="rgba(21,8,46,0.16)" color={c.ink}>Gratuit</Badge>}
      </div>
      {locked && (
        <div className="absolute right-3 top-3 z-[2] grid h-8 w-8 place-items-center rounded-full" style={{ background: "rgba(21,8,46,0.78)", color: "#fff" }}>
          <Lock size={15} strokeWidth={2.6} />
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center" style={{ paddingTop: big ? 18 : 14 }}>
        <ZBlob size={big ? 128 : 86} color={game.color} mood={game.mood} seed={seed} speed={2.4} />
      </div>

      <div className="relative px-4 pb-4">
        <div className="zz-font" style={{ fontSize: big ? 25 : 19, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
          {info.name}
        </div>
        <p
          className="mt-1 font-medium"
          style={{ fontSize: big ? 13.5 : 12.5, lineHeight: 1.3, opacity: 0.78, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {info.pitch}
        </p>
        <div className="mt-2 flex items-center gap-1 text-[12px] font-bold" style={{ opacity: 0.85 }}>
          <Users size={13} strokeWidth={2.6} /> {game.players}
        </div>
      </div>
    </button>
  );
}

function Badge({ bg, color, children }: { bg: string; color: string; children: string }) {
  return (
    <span className="rounded-full px-2 py-[3px] text-[11px] font-extrabold uppercase leading-none" style={{ background: bg, color, letterSpacing: "0.04em" }}>
      {children}
    </span>
  );
}
