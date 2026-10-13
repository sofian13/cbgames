import { Fragment, useState } from "react";
import { ChevronDown, Lock, Play } from "lucide-react";
import { CAST, getZGame, type ZLine } from "../catalog";
import { pick, useLang } from "@/lib/i18n";
import { UI } from "../strings";
import { ZBlob, ZPALETTE, type ZColor } from "./ZBlob";
import { BigBtn, CloseBtn, Sheet, Tag } from "./common";
import { gameInfo, haptic, playersLabel } from "./util";
import { useNoAlcohol } from "@/lib/party-mood";

/** Fiche d'un jeu : en-tête plein couleur, mini BD, étapes, bouton Jouer. */
export function GameSheet({
  id, locked, premium, onClose, onPlay, onUnlock,
}: {
  id: string;
  locked: boolean;
  premium: boolean;
  onClose: () => void;
  onPlay: (id: string) => void;
  onUnlock: () => void;
}) {
  const game = getZGame(id);
  const [allRules, setAllRules] = useState(false);
  const lang = useLang();
  const t = pick(UI, lang);
  const noAlc = useNoAlcohol();
  if (!game) return null;
  const info = gameInfo(game, lang);
  const c = ZPALETTE[game.color] ?? ZPALETTE.pink;
  const steps = (info.steps.length ? info.steps : info.rules).slice(0, 5);
  const longest = Math.max(...info.name.split(" ").map((w) => w.length));
  const moreRules = info.steps.length ? info.rules : info.rules.slice(5);

  return (
    <Sheet onClose={onClose} label={info.name} bg="var(--zz-bg)">
      {(close) => (
        <>
          <div className="zz-scroll min-h-0 flex-1">
            {/* En-tête plein, dans la couleur du jeu */}
            {/* Hauteur mini : le blob (qui déborde en bas) ne remonte jamais sur un titre d'une ligne */}
            <div className="relative px-6 pb-14 pt-5" style={{ minHeight: 236, background: c.body, color: c.ink, borderBottom: "3px solid var(--zz-ink)" }}>
              <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full" style={{ background: "rgba(21,8,46,0.3)" }} />
              <div className="absolute right-4 top-4 z-[2]">
                <CloseBtn onClick={close} />
              </div>
              <div className="flex flex-wrap gap-1.5 pr-14 pt-2">
                {game.isNew && <Tag bg="#fff" tilt={-4}>{t.tagNew}</Tag>}
                {game.adult && <Tag bg="var(--zz-ink)" color="#fff" tilt={3}>18+</Tag>}
                {game.free && !premium && <Tag bg="#fff" tilt={2}>{t.tagFree}</Tag>}
                {locked && <Tag bg="#FFD23F" tilt={-2}><Lock size={12} strokeWidth={3} className="mr-1" />{t.premium}</Tag>}
              </div>
              <h2 className="zz-title relative z-[1] mt-3 pr-[30%]" style={{ fontSize: `min(${info.name.length > 12 ? 44 : 54}px, ${(96 / longest).toFixed(1)}vw)`, lineHeight: 0.9 }}>
                {/* Mots insécables : « Loup-Garou » ne se coupe pas au tiret */}
                {info.name.split(" ").map((w, i) => (
                  <Fragment key={i}>{i ? " " : ""}<span className="whitespace-nowrap">{w}</span></Fragment>
                ))}
              </h2>
              <span
                className="zz-stk-sm relative z-[1] mt-4 inline-flex h-9 items-center rounded-full px-3.5 text-[15px] font-bold"
                style={{ background: "#fff", color: "var(--zz-ink)", rotate: "-3deg" }}
              >
                {playersLabel(game.players, lang)}
              </span>
              {/* Blob géant qui déborde sous l'en-tête */}
              {/* Calé contre le bord sans couper le costume (le nez de Pinocchio s'allonge vers la droite) */}
              <div className="absolute" style={{ bottom: -58, right: game.costume === "pinocchio" ? 18 : -4 }}>
                <ZBlob size={178} color={game.color} mood={game.mood} seed={4} speed={2.2} shadow={false} outline costume={game.costume} />
              </div>
            </div>

            <div className="px-5 pb-8 pt-6">
              {info.pitch && (
                // Commence sous le blob qui déborde de l'en-tête : jamais de texte caché dessous
                <p className="mt-9 text-[19px] font-bold leading-snug text-white">{info.pitch}</p>
              )}

              {/* Mini BD */}
              <h3 className="zz-title mt-8 text-white" style={{ fontSize: 28 }}>{t.howItLooks}</h3>
              <Story story={info.story} example={info.example} />

              {/* Étapes */}
              {steps.length > 0 && (
                <>
                  <h3 className="zz-title mt-9 text-white" style={{ fontSize: 28 }}>{t.howToPlay}</h3>
                  <ol className="mt-4 grid gap-4">
                    {steps.map((r, i) => (
                      <li key={i} className="flex items-center gap-4">
                        <span
                          className="zz-stk-sm zz-title grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[16px] text-[30px]"
                          style={{ background: i % 2 ? "#fff" : c.body, color: i % 2 ? "var(--zz-ink)" : c.ink, rotate: `${i % 2 ? 4 : -4}deg` }}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 text-[16.5px] font-semibold leading-snug text-white">{r}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {moreRules.length > 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setAllRules((v) => !v)}
                    aria-expanded={allRules}
                    className="flex min-h-11 items-center gap-1.5 text-[15px] font-bold"
                    // Violet foncé illisible sur le fond nuit → version claire
                    style={{ color: game.color === "purple" ? "#B59CFF" : c.body }}
                  >
                    {allRules ? t.rulesHide : t.rulesShow}
                    <ChevronDown size={18} strokeWidth={3} style={{ rotate: allRules ? "180deg" : "0deg", transition: "rotate 200ms" }} />
                  </button>
                  {allRules && (
                    <ul className="zz-fade mt-2 grid gap-2.5 pl-1">
                      {moreRules.map((r, i) => (
                        <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed" style={{ color: "var(--zz-dim)" }}>
                          <span aria-hidden style={{ color: c.body }}>●</span>
                          <span className="min-w-0">{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {game.adult && !noAlc && (
                <p className="mt-6 text-[14px] leading-relaxed" style={{ color: "var(--zz-mute)" }}>
                  {t.adultNote}
                </p>
              )}
            </div>
          </div>

          {/* Bouton principal, collé en bas */}
          <div className="px-5 pt-3" style={{ paddingBottom: "calc(var(--sab) + 16px)", background: "linear-gradient(180deg, transparent, var(--zz-bg) 35%)" }}>
            {locked ? (
              <BigBtn onClick={() => { haptic("medium"); onUnlock(); }} bg="#FFD23F">
                <Lock size={20} strokeWidth={3} /> {t.unlockGame}
              </BigBtn>
            ) : (
              <BigBtn onClick={() => { haptic("medium"); onPlay(id); }} bg={c.body} color={c.ink}>
                <Play size={20} strokeWidth={3} fill="currentColor" /> {t.play}
              </BigBtn>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ───────── Mini BD : bulles qui sortent de petits blobs ───────── */
const MOODS = ["happy", "laughing", "shocked", "wink", "sus", "cool"] as const;

function Story({ story, example }: { story: ZLine[]; example?: string }) {
  const lines: ZLine[] = story.length ? story : example ? [{ text: example }] : [];
  if (!lines.length) return null;
  const single = !story.length;
  // Chaque personnage parle toujours du même côté
  const sides = new Map<string, "l" | "r">();
  let lastNarr = -1;
  lines.forEach((l, i) => { if (!l.who) lastNarr = i; });

  return (
    <div className="mt-4 grid gap-3.5">
      {lines.map((l, i) => {
        const d = { ["--d" as string]: `${120 + i * 140}ms` };
        if (!l.who) {
          const punch = !single && i === lastNarr && i === lines.length - 1;
          return (
            <div key={i} className="zz-pop flex justify-center" style={d}>
              <p
                className={`${punch ? "zz-stk zz-title" : "zz-stk-sm font-bold"} max-w-[92%] rounded-[14px] px-4 py-2.5 text-center`}
                style={{
                  background: punch ? "#FFD23F" : "#fff",
                  color: "var(--zz-ink)",
                  fontSize: punch ? 21 : single ? 16 : 15,
                  lineHeight: punch ? 1.08 : 1.4,
                  letterSpacing: punch ? "-0.02em" : 0,
                  rotate: punch ? "-2deg" : i % 2 ? "1deg" : "-1deg",
                  textAlign: single ? "left" : "center",
                }}
              >
                {l.text}
              </p>
            </div>
          );
        }
        if (!sides.has(l.who)) sides.set(l.who, sides.size % 2 ? "r" : "l");
        const side = sides.get(l.who)!;
        const col: ZColor = l.color ?? CAST[l.who] ?? "lavender";
        const pc = ZPALETTE[col];
        const blob = (
          <div className="shrink-0 self-end">
            <ZBlob size={46} color={col} mood={MOODS[(i + l.who.length) % MOODS.length]} seed={l.who.length + i} shadow={false} outline speed={2} />
          </div>
        );
        return (
          <div key={i} className={`zz-pop flex items-end gap-3 ${side === "r" ? "flex-row-reverse" : ""}`} style={d}>
            {blob}
            <div className={`zz-bubble from-${side} max-w-[74%] px-3.5 pb-2.5 pt-1.5`} style={{ background: pc.body, color: pc.ink }}>
              <div className="text-[12.5px] font-bold" style={{ opacity: 0.75 }}>{l.who}</div>
              <div className="text-[17px] font-bold leading-snug">{l.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
