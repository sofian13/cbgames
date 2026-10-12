import { Lock, Play, Users } from "lucide-react";
import { getZGame } from "../catalog";
import { ZBlob, ZPALETTE } from "./ZBlob";
import { Chip, CloseBtn, Sheet } from "./common";
import { gameInfo, haptic, playersLabel } from "./util";

/** Fiche d'un jeu (bottom sheet) : accroche, exemple, règles, bouton Jouer. */
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
  if (!game) return null;
  const info = gameInfo(game);
  const c = ZPALETTE[game.color] ?? ZPALETTE.pink;

  return (
    <Sheet onClose={onClose} label={info.name}>
      {(close) => (
        <>
          <div className="zz-scroll min-h-0 flex-1">
            {/* Bandeau couleur + grand blob */}
            <div className="relative flex h-[196px] items-end justify-center overflow-hidden" style={{ background: `radial-gradient(90% 90% at 50% 0%, ${c.hi} 0%, ${c.body} 60%)` }}>
              <div className="absolute left-1/2 top-2.5 h-1.5 w-10 -translate-x-1/2 rounded-full" style={{ background: "rgba(21,8,46,0.25)" }} />
              <div className="absolute right-3 top-3">
                <CloseBtn onClick={close} />
              </div>
              <div className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full" style={{ background: c.deep, opacity: 0.22 }} />
              <div className="absolute -right-6 top-10 h-24 w-24 rounded-full" style={{ background: c.hi, opacity: 0.35 }} />
              <div className="relative -mb-3">
                <ZBlob size={156} color={game.color} mood={game.mood} seed={4} speed={2.2} />
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              <h2 className="zz-font text-white" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02 }}>{info.name}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip bg="rgba(255,255,255,0.1)" color="#fff"><Users size={13} strokeWidth={2.6} className="mr-1" />{playersLabel(game.players)}</Chip>
                {game.adult && <Chip bg="#fff" color="#15082E">18+</Chip>}
                {game.isNew && <Chip bg={c.body} color={c.ink}>Nouveau</Chip>}
                {game.free && !premium && <Chip bg="rgba(61,220,151,0.18)" color="#3DDC97">Gratuit</Chip>}
                {locked && <Chip bg="rgba(255,210,63,0.16)" color="#FFD23F"><Lock size={12} strokeWidth={2.8} className="mr-1" />Premium</Chip>}
              </div>

              {info.pitch && <p className="mt-4 text-[17px] font-semibold leading-snug text-white">{info.pitch}</p>}

              {info.example && (
                <div className="mt-4 rounded-[20px] px-4 py-3.5 text-[15px] leading-relaxed text-white/90" style={{ background: `color-mix(in srgb, ${c.body} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${c.body} 38%, transparent)` }}>
                  <div className="mb-1 text-[12px] font-extrabold uppercase" style={{ color: c.body, letterSpacing: "0.1em" }}>Exemple</div>
                  {info.example}
                </div>
              )}

              {info.rules.length > 0 && (
                <>
                  <div className="mb-2.5 mt-6 text-[12px] font-extrabold uppercase" style={{ color: "var(--zz-mute)", letterSpacing: "0.1em" }}>Règles</div>
                  <ol className="grid gap-2.5">
                    {info.rules.map((r, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/88">
                        <span className="zz-font mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px] font-bold" style={{ background: c.body, color: c.ink }}>{i + 1}</span>
                        <span className="min-w-0">{r}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {game.adult && (
                <p className="mt-5 text-[13px] leading-relaxed" style={{ color: "var(--zz-mute)" }}>
                  À jouer avec modération. Eau et soft acceptés, chacun boit ce qu'il veut (ou fait un gage).
                </p>
              )}
            </div>
          </div>

          {/* Bouton principal */}
          <div className="px-5 pt-3" style={{ paddingBottom: "calc(var(--sab) + 14px)", background: "linear-gradient(180deg, transparent, var(--zz-bg-2) 30%)" }}>
            {locked ? (
              <button
                type="button"
                onClick={() => { haptic("medium"); onUnlock(); }}
                className="zz-press flex h-[58px] w-full items-center justify-center gap-2 rounded-full text-[18px] font-extrabold text-white"
                style={{ background: "linear-gradient(90deg,#FF3EA5,#FF6B5B)", boxShadow: "0 12px 30px rgba(255,62,165,0.35)" }}
              >
                <Lock size={19} strokeWidth={2.6} /> Débloquer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { haptic("medium"); onPlay(id); }}
                className="zz-press flex h-[58px] w-full items-center justify-center gap-2 rounded-full text-[18px] font-extrabold"
                style={{ background: c.body, color: c.ink, boxShadow: `inset 0 -4px 0 ${c.deep}, 0 12px 30px ${c.body}55` }}
              >
                <Play size={19} strokeWidth={2.8} fill="currentColor" /> Jouer
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
