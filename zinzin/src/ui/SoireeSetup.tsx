import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, RefreshCw, Users, X } from "lucide-react";
import { PlayersSetup } from "@/components/games/local-kit";
import { pick, useLang } from "@/lib/i18n";
import { playSfx, preloadSfx } from "@/lib/sfx";
import { GAME_KIND, getZGame } from "../catalog";
import type { ZGameId } from "../catalog-text";
import { LENGTHS, VIBES, generatePlaylist, moveGame, swapGame, uniqueBand, type SoireeLength, type Vibe } from "../soiree";
import { SOIREE, UI } from "../strings";
import { ZBlob, ZPALETTE } from "./ZBlob";
import { BigBtn, Tag } from "./common";
import { CornerBtn, DiscoBall, SOIREE_BG, SoireeStyles } from "./SoireeKit";
import { gameInfo, haptic } from "./util";
import { soberKind, soberVibeSub } from "../no-alcohol";
import { usePremium } from "../premium";
import { PremiumNudge } from "@/components/games/premium-nudge";

const VIBE_LOOK: Record<Vibe, { bg: string; mood: "asleep" | "laughing" | "fire"; color: "mint" | "yellow" | "coral" }> = {
  chill: { bg: "#3DDC97", mood: "asleep", color: "mint" },
  soiree: { bg: "#FFD23F", mood: "laughing", color: "yellow" },
  folle: { bg: "#FF6B5B", mood: "fire", color: "coral" },
};

/**
 * Préparation de la soirée en 3 écrans : la bande → l'ambiance (+ durée) → la playlist.
 */
export function SoireeSetup({ onClose, onLaunch }: {
  onClose: () => void;
  onLaunch: (band: string[], vibe: Vibe, length: SoireeLength, playlist: ZGameId[]) => void;
}) {
  const lang = useLang();
  const t = pick(SOIREE, lang);
  const ui = pick(UI, lang);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [band, setBand] = useState<string[]>([]);
  const [vibe, setVibe] = useState<Vibe>("soiree");
  const [length, setLength] = useState<SoireeLength>(6);
  const [playlist, setPlaylist] = useState<ZGameId[]>([]);

  const toRecap = () => {
    haptic();
    playSfx("card-shuffle", { volume: 0.6 });
    setPlaylist(generatePlaylist(band.length, vibe, length));
    setStep(2);
  };

  return (
    <div className="zz-screen-in zz-scroll zz-page fixed inset-0" style={{ zIndex: 30 }} key={step}>
      <SoireeStyles />
      <CornerBtn onClick={step === 0 ? onClose : () => setStep(step === 2 ? 1 : 0)} label={step === 0 ? ui.close : ui.back}>
        {step === 0 ? <X size={21} strokeWidth={3} /> : <ArrowLeft size={22} strokeWidth={3} />}
      </CornerBtn>

      {step === 0 && (
        <PlayersSetup
          emoji=""
          name={t.setupName}
          min={2}
          max={16}
          accent={SOIREE_BG}
          onStart={(names) => { preloadSfx(["card-shuffle", "whoosh", "confirm"]); setBand(uniqueBand(names)); setStep(1); }}
        />
      )}

      {step === 1 && (
        <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5" style={{ paddingTop: "calc(var(--sat) + 72px)", paddingBottom: "calc(var(--sab) + 16px)" }}>
          <p className="text-[15px] font-bold" style={{ color: "var(--zz-dim)" }}>{t.stepOf(2, 3)}</p>
          <h1 className="zz-title mt-1 text-white" style={{ fontSize: 40 }}>{t.vibeTitle}</h1>
          <div className="mt-5 flex flex-col gap-3.5">
            {VIBES.map((v, i) => {
              const look = VIBE_LOOK[v];
              const on = vibe === v;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { haptic(); playSfx("select", { volume: 0.5 }); setVibe(v); }}
                  className="zz-push zz-stk relative flex min-h-[72px] items-center gap-3 rounded-[24px] py-2.5 pl-4 pr-3 text-left"
                  style={{
                    background: on ? look.bg : "#fff",
                    color: "var(--zz-ink)",
                    rotate: `${on ? (i % 2 ? 1.5 : -1.5) : 0}deg`,
                    outline: on ? "3px solid #fff" : undefined,
                    outlineOffset: on ? 3 : undefined,
                  }}
                >
                  <ZBlob size={54} color={look.color} mood={look.mood} seed={i + 2} outline shadow={false} wobble={on} />
                  <span className="min-w-0 flex-1">
                    <span className="zz-title block text-[24px]">{t.vibes[v].name}</span>
                    <span className="mt-0.5 block text-[14px] font-semibold leading-snug" style={{ opacity: 0.8 }}>{soberVibeSub(v, t.vibes[v].sub, lang)}</span>
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ border: "3px solid var(--zz-ink)", background: on ? "var(--zz-ink)" : "#fff" }}>
                    {on && <span className="h-3 w-3 rounded-full" style={{ background: look.bg }} />}
                  </span>
                </button>
              );
            })}
          </div>

          <h2 className="zz-title mt-6 text-white" style={{ fontSize: 28 }}>{t.lengthTitle}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {LENGTHS.map((n, i) => {
              const on = length === n;
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { haptic(); playSfx("select", { volume: 0.5 }); setLength(n); }}
                  className="zz-push zz-stk-sm flex min-h-[72px] flex-col items-center justify-center rounded-[20px] px-1 py-2"
                  style={{ background: on ? "#FFD23F" : "#fff", color: "var(--zz-ink)", rotate: on ? `${i % 2 ? 2 : -2}deg` : undefined }}
                >
                  <span className="zz-title text-[20px]">{t.lengths[n].name}</span>
                  <span className="mt-1 text-[13px] font-bold" style={{ opacity: 0.75 }}>{t.lengths[n].sub}</span>
                </button>
              );
            })}
          </div>

          <div className="min-h-4 flex-1" />
          <div
            className="sticky bottom-0 z-[2] -mx-5 px-5 pt-5"
            style={{ paddingBottom: "calc(var(--sab) + 16px)", marginBottom: "calc(-1 * (var(--sab) + 16px))", background: "linear-gradient(180deg, rgba(33,16,82,0) 0px, #211052 20px)" }}
          >
            <BigBtn onClick={toRecap} bg={SOIREE_BG} color="#fff">{t.next}</BigBtn>
          </div>
        </div>
      )}

      {step === 2 && (
        <Recap
          band={band}
          vibe={vibe}
          length={length}
          playlist={playlist}
          setPlaylist={setPlaylist}
          onLaunch={() => { haptic("medium"); playSfx("confirm"); onLaunch(band, vibe, length, playlist); }}
        />
      )}
    </div>
  );
}

function Recap({ band, vibe, length, playlist, setPlaylist, onLaunch }: {
  band: string[];
  vibe: Vibe;
  length: SoireeLength;
  playlist: ZGameId[];
  setPlaylist: (p: ZGameId[]) => void;
  onLaunch: () => void;
}) {
  const lang = useLang();
  const t = pick(SOIREE, lang);
  const [flash, setFlash] = useState<number | null>(null);
  const premium = usePremium();
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5" style={{ paddingTop: "calc(var(--sat) + 72px)" }}>
      <div className="relative">
        <p className="text-[15px] font-bold" style={{ color: "var(--zz-dim)" }}>{t.stepOf(3, 3)}</p>
        <h1 className="zz-title mt-1 pr-24 text-white" style={{ fontSize: 44 }}>{t.recapTitle}</h1>
        <div className="zzs-swing pointer-events-none absolute right-2" style={{ top: -70 }}><DiscoBall size={74} hang={40} /></div>
      </div>
      <p className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--zz-dim)" }}>{t.recapSub(band.length)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag bg="#fff" tilt={-3}><Users size={13} strokeWidth={3} className="mr-1" />{band.length}</Tag>
        <Tag bg={VIBE_LOOK[vibe].bg} tilt={2}>{t.vibes[vibe].name}</Tag>
        <Tag bg="#fff" tilt={-2}>{t.lengths[length].name}</Tag>
      </div>

      {playlist.length === 0 ? (
        <div className="zz-stk mt-6 rounded-[24px] p-5 text-center text-[16px] font-bold" style={{ background: "#fff", color: "var(--zz-ink)" }}>
          <div className="mb-2 flex justify-center"><ZBlob size={70} color="lavender" mood="sad" seed={3} outline shadow={false} /></div>
          {t.noGames}
        </div>
      ) : (
        <>
          {/* Sans Zinzin+ : soirée avec les jeux gratuits (rappel discret, fermable) */}
          {!premium && <PremiumNudge text={t.freeOnly} style={{ marginTop: 16 }} />}
          {premium && playlist.length < length && (
            <p className="mt-4 rounded-[16px] px-3 py-2 text-[14px] font-bold" style={{ background: "#FFF6E5", color: "var(--zz-ink)", border: "2.5px solid var(--zz-ink)" }}>
              {t.fewGames(playlist.length)}
            </p>
          )}
          <ol className="mt-5 flex flex-col gap-3">
            {playlist.map((id, i) => {
              const g = getZGame(id)!;
              const info = gameInfo(g, lang);
              const c = ZPALETTE[g.color] ?? ZPALETTE.pink;
              return (
                <li
                  key={`${id}-${i}`}
                  className={`zz-stk relative flex items-center gap-2.5 rounded-[22px] py-2 pl-2 pr-2 ${flash === i ? "zz-pop" : ""}`}
                  style={{ background: c.body, color: c.ink, rotate: `${i % 2 ? 0.8 : -0.8}deg` }}
                >
                  <span className="zz-title grid h-9 w-9 shrink-0 place-items-center rounded-full text-[18px]" style={{ background: "var(--zz-ink)", color: "#fff" }}>{i + 1}</span>
                  {/* Petit écran : pas de blob, pour laisser la place au nom */}
                  <span className="hidden shrink-0 min-[380px]:block">
                    <ZBlob size={50} color={g.color} mood={g.mood} seed={i} costume={g.costume} outline shadow={false} wobble={false} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="zz-title block break-words text-[18px] leading-[1]">{info.name}</span>
                    <span className="mt-1 block text-[13px] font-bold" style={{ opacity: 0.75 }}>{soberKind(GAME_KIND[id], t.kinds[GAME_KIND[id]], lang)}</span>
                  </span>
                  <span className="flex shrink-0 flex-col">
                    <MiniBtn label={t.moveUp(info.name)} disabled={i === 0} onClick={() => setPlaylist(moveGame(playlist, i, -1))}><ChevronUp size={18} strokeWidth={3} /></MiniBtn>
                    <MiniBtn label={t.moveDown(info.name)} disabled={i === playlist.length - 1} onClick={() => setPlaylist(moveGame(playlist, i, 1))}><ChevronDown size={18} strokeWidth={3} /></MiniBtn>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      haptic();
                      playSfx("card-flip", { volume: 0.6 });
                      setPlaylist(swapGame(playlist, i, band.length, vibe));
                      setFlash(i);
                    }}
                    aria-label={`${t.change} ${info.name}`}
                    className="zz-push zz-stk-sm flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[13px] font-extrabold"
                    style={{ background: "#fff", color: "var(--zz-ink)" }}
                  >
                    <RefreshCw size={15} strokeWidth={3} aria-hidden /> <span className="hidden min-[380px]:inline">{t.change}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <div className="min-h-6 flex-1" />
      <div
        className="sticky bottom-0 z-[2] -mx-5 px-5 pt-6"
        style={{ paddingBottom: "calc(var(--sab) + 16px)", background: "linear-gradient(180deg, rgba(33,16,82,0) 0px, #211052 22px)" }}
      >
        <BigBtn onClick={onLaunch} bg={SOIREE_BG} color="#fff" disabled={!playlist.length}>{t.launch}</BigBtn>
      </div>
    </div>
  );
}

function MiniBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => { haptic(); playSfx("tap", { volume: 0.4 }); onClick(); }}
      className="zz-tap grid h-9 w-11 place-items-center disabled:opacity-25"
    >
      <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: "#fff", color: "var(--zz-ink)", border: "2px solid var(--zz-ink)" }}>{children}</span>
    </button>
  );
}
