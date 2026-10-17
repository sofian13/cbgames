import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Share2, X } from "lucide-react";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import { baseLook, type AvatarLook } from "@/lib/avatar/look";
import { unlockSecret } from "@/lib/avatar/secrets";
import { type I18n, type Lang, pick, useLang } from "@/lib/i18n";
import { playSfx, type SfxName } from "@/lib/sfx";
import { shareBandCard } from "@/lib/share-card";
import { haptic, reducedMotion } from "./util";
import { useToast } from "./common";

/**
 * « Tapote le blob » : mini-jeu à la Cookie Clicker pour celui qui s'ennuie en soirée.
 * Chaque toucher : le perso (« moi » de Ma bande, sinon un blob) s'écrase, grossit avec la cadence,
 * fait un bruit ridicule et rapporte des gloops. Les gloops achètent des améliorations
 * (doigt musclé, mini-blobs qui tapotent tout seuls, boule à facettes ×2). Les mini-blobs gagnent
 * aussi un peu app fermée (10 % du rythme, 4 h max). Paliers de TAPS (vrais touchers) : récompenses pour les persos
 * et phrases absurdes. « Partager ma honte » : carte image avec le score.
 * Tout reste sur le téléphone (clé locale zz-clicker-v1).
 */

const KEY = "zz-clicker-v1";
interface Save { taps: number; gloops: number; finger: number; minis: number; last: number }
const EMPTY: Save = { taps: 0, gloops: 0, finger: 0, minis: 0, last: Date.now() };
function load(): Save {
  try { return { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Save>) }; } catch { return { ...EMPTY }; }
}
function persist(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...s, last: Date.now() })); } catch { /* indispo */ }
}

const fingerCost = (lvl: number) => Math.round(25 * 1.6 ** lvl);
const miniCost = (lvl: number) => Math.round(60 * 1.7 ** lvl);
const boostCost = (minis: number) => 150 + minis * 60;
const BOOST_MS = 30_000;
const OFFLINE_CAP_S = 4 * 3600;
/** App fermée, les mini-blobs travaillent au ralenti (10 % du rythme). */
const OFFLINE_RATE = 0.1;

type Reward = { at: number; secret?: string; kind: "eyes" | "extra" | "color" | "anim" | "legend" | "badge" };
const REWARDS: Reward[] = [
  { at: 100, secret: "spiral", kind: "eyes" },
  { at: 500, secret: "foamfinger", kind: "extra" },
  { at: 1000, kind: "anim" },
  { at: 5000, secret: "color-chrome", kind: "color" },
  { at: 10000, secret: "aura", kind: "legend" },
  { at: 50000, kind: "badge" },
];

/** Phrases absurdes selon le nombre de taps (la dernière atteinte reste affichée). */
const LINES: I18n<[number, string][]> = {
  fr: [
    [0, "Tape sur le blob. C'est tout."], [10, "C'est parti. Personne ne t'a vu."], [50, "Tes potes t'ont abandonné ?"],
    [100, "Tu sais qu'il y a une soirée autour de toi ?"], [250, "Pose ce téléphone. Non ? D'accord."],
    [500, "Le blob commence à t'apprécier."], [1000, "1 000 taps. Ça devient inquiétant."],
    [2500, "Quelqu'un a pensé à t'inviter à danser ?"], [5000, "Félicitations, tu es officiellement un meuble."],
    [10000, "10 000. Le blob est devenu légendaire. Toi, non."], [25000, "Ton pouce a demandé un arrêt maladie."],
    [50000, "Succès débloqué : Sans vie sociale 🏆"],
  ],
  en: [
    [0, "Tap the blob. That's it."], [10, "Here we go. Nobody saw you."], [50, "Did your friends ditch you?"],
    [100, "You know there's a party around you, right?"], [250, "Put the phone down. No? Fine."],
    [500, "The blob is starting to like you."], [1000, "1,000 taps. This is getting worrying."],
    [2500, "Has anyone thought of asking you to dance?"], [5000, "Congrats, you're officially furniture."],
    [10000, "10,000. The blob is now legendary. You're not."], [25000, "Your thumb just called in sick."],
    [50000, "Achievement unlocked: No social life 🏆"],
  ],
  es: [
    [0, "Toca el blob. Y ya está."], [10, "Empezamos. Nadie te ha visto."], [50, "¿Tus amigos te han abandonado?"],
    [100, "¿Sabes que hay una fiesta a tu alrededor?"], [250, "Suelta el móvil. ¿No? Vale."],
    [500, "El blob empieza a cogerte cariño."], [1000, "1.000 toques. Esto empieza a preocupar."],
    [2500, "¿Alguien ha pensado en sacarte a bailar?"], [5000, "Enhorabuena, ya eres oficialmente un mueble."],
    [10000, "10.000. El blob es legendario. Tú no."], [25000, "Tu pulgar ha pedido la baja."],
    [50000, "Logro desbloqueado: Sin vida social 🏆"],
  ],
};

const T: I18n<{
  title: string; taps: (n: string) => string; perSec: (n: string) => string; gloops: string;
  finger: string; fingerSub: (n: number) => string; mini: string; miniSub: string; boost: string; boostSub: string; boostOn: (s: number) => string;
  offline: (n: string) => string; next: (at: string, what: string) => string; allDone: string; share: string; shareTitle: (n: string) => string; shareText: string;
  reward: Record<Reward["kind"], string>; unlocked: (what: string) => string; close: string; badge: string;
}> = {
  fr: {
    title: "Tapote le blob", taps: (n) => `${n} taps`, perSec: (n) => `+${n}/s`, gloops: "gloops",
    finger: "Doigt musclé", fingerSub: (n) => `+${n} par tap`, mini: "Mini-blob", miniSub: "tapote tout seul (+1/s)",
    boost: "Boule à facettes", boostSub: "×2 pendant 30 s", boostOn: (s) => `×2 encore ${s} s`,
    offline: (n) => `Pendant ton absence, tes mini-blobs ont fait ${n} gloops !`,
    next: (at, what) => `Prochaine récompense : ${what} à ${at} taps`, allDone: "Tout est débloqué. Respect (et inquiétude).",
    share: "Partager ma honte", shareTitle: (n) => `${n} taps sur un blob`, shareText: "J'ai tapoté un blob au lieu de profiter de la soirée. Zinzin 🫠",
    reward: { eyes: "les yeux Hypnotisé", extra: "le Doigt en mousse", anim: "les taps explosifs", color: "la couleur Chrome", legend: "le blob légendaire (Aura)", badge: "le succès « Sans vie sociale »" },
    unlocked: (what) => `🎁 Débloqué : ${what} !`, close: "Fermer", badge: "🏆 Sans vie sociale",
  },
  en: {
    title: "Tap the blob", taps: (n) => `${n} taps`, perSec: (n) => `+${n}/s`, gloops: "gloops",
    finger: "Strong finger", fingerSub: (n) => `+${n} per tap`, mini: "Mini-blob", miniSub: "taps on its own (+1/s)",
    boost: "Disco ball", boostSub: "×2 for 30 s", boostOn: (s) => `×2 for ${s} more s`,
    offline: (n) => `While you were away, your mini-blobs made ${n} gloops!`,
    next: (at, what) => `Next reward: ${what} at ${at} taps`, allDone: "Everything unlocked. Respect (and concern).",
    share: "Share my shame", shareTitle: (n) => `${n} taps on a blob`, shareText: "I tapped a blob instead of enjoying the party. Zinzin 🫠",
    reward: { eyes: "Hypnotized eyes", extra: "the Foam finger", anim: "explosive taps", color: "the Chrome color", legend: "the legendary blob (Aura)", badge: "the “No social life” achievement" },
    unlocked: (what) => `🎁 Unlocked: ${what}!`, close: "Close", badge: "🏆 No social life",
  },
  es: {
    title: "Toca el blob", taps: (n) => `${n} toques`, perSec: (n) => `+${n}/s`, gloops: "gloops",
    finger: "Dedo musculoso", fingerSub: (n) => `+${n} por toque`, mini: "Mini-blob", miniSub: "toca solo (+1/s)",
    boost: "Bola de discoteca", boostSub: "×2 durante 30 s", boostOn: (s) => `×2 aún ${s} s`,
    offline: (n) => `Mientras no estabas, tus mini-blobs hicieron ${n} gloops.`,
    next: (at, what) => `Próxima recompensa: ${what} a los ${at} toques`, allDone: "Todo desbloqueado. Respeto (y preocupación).",
    share: "Compartir mi vergüenza", shareTitle: (n) => `${n} toques a un blob`, shareText: "He tocado un blob en vez de disfrutar de la fiesta. Zinzin 🫠",
    reward: { eyes: "los ojos Hipnotizado", extra: "el Dedo de espuma", anim: "los toques explosivos", color: "el color Cromo", legend: "el blob legendario (Aura)", badge: "el logro «Sin vida social»" },
    unlocked: (what) => `🎁 Desbloqueado: ${what}`, close: "Cerrar", badge: "🏆 Sin vida social",
  },
};

const fmt = (n: number, lang: Lang) => Math.floor(n).toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "fr-FR");

/** Bruits ridicules : un petit pop presque toujours, de temps en temps un bruit plus bête. */
const SILLY: { s: SfxName; v: number; r: [number, number]; d?: number }[] = [
  { s: "croak", v: 0.5, r: [1.1, 1.4] }, { s: "slap", v: 0.5, r: [1.1, 1.3] }, { s: "laugh", v: 0.35, r: [1.4, 1.6], d: 0.5 },
  { s: "elastic-snap", v: 0.4, r: [1, 1.3] }, { s: "ghost-boo", v: 0.4, r: [1.6, 2] }, { s: "pep", v: 0.45, r: [1.2, 1.5] },
];

export function BlobClicker({ onClose }: { onClose: () => void }) {
  const lang = useLang();
  const { show: toast, node: toastNode } = useToast();
  const t = pick(T, lang);
  const lines = pick(LINES, lang);
  const band = useBand();
  const me = band.find((b) => b.me) ?? band[0];
  const look: AvatarLook = me?.look ?? { ...baseLook("pink"), eyes: "happy" };
  const [s, setS] = useState<Save>(load);
  const sRef = useRef(s);
  sRef.current = s;
  const [boostUntil, setBoostUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [pops, setPops] = useState<{ id: number; x: number; y: number; v: number; boom: boolean }[]>([]);
  const blob = useRef<HTMLDivElement>(null);
  const combo = useRef<number[]>([]);
  const popId = useRef(0);

  // Gains hors ligne des mini-blobs (moitié du rythme, 8 h max), une fois à l'ouverture
  useEffect(() => {
    const cur = load();
    const secs = Math.min(OFFLINE_CAP_S, Math.max(0, (Date.now() - cur.last) / 1000));
    const earned = Math.floor(cur.minis * secs * OFFLINE_RATE);
    if (earned >= 1) {
      const next = { ...cur, gloops: cur.gloops + earned };
      setS(next); persist(next);
      setTimeout(() => toast(t.offline(fmt(earned, lang))), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mini-blobs : +1 gloop/s chacun (×2 avec la boule), sauvegarde régulière
  useEffect(() => {
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const cur = sRef.current;
      if (cur.minis > 0) {
        const mult = n < boostUntil ? 2 : 1;
        const next = { ...cur, gloops: cur.gloops + (cur.minis * mult) / 4 };
        sRef.current = next;
        setS(next);
      }
    }, 250);
    const save = setInterval(() => persist(sRef.current), 3000);
    return () => { clearInterval(id); clearInterval(save); persist(sRef.current); };
  }, [boostUntil]);

  const boosted = now < boostUntil;
  const perTap = (1 + s.finger) * (boosted ? 2 : 1);
  const explosive = s.taps >= 1000;
  const legendary = s.taps >= 10000;

  const tap = (e: React.PointerEvent) => {
    const nowMs = performance.now();
    combo.current = [...combo.current.filter((x) => nowMs - x < 1500), nowMs];
    const next = { ...sRef.current, taps: sRef.current.taps + 1, gloops: sRef.current.gloops + perTap };
    // Paliers franchis à ce tap : récompense + annonce
    for (const r of REWARDS) {
      if (sRef.current.taps < r.at && next.taps >= r.at) {
        if (r.secret) unlockSecret(r.secret);
        playSfx("tada", { volume: 0.5 });
        haptic("success");
        toast(t.unlocked(t.reward[r.kind]));
      }
    }
    sRef.current = next;
    setS(next);
    if (next.taps % 50 === 0) persist(next);
    // Le blob s'écrase (plus fort avec la cadence) et grossit un peu tant qu'on tapote vite
    haptic("light");
    const k = Math.min(1, combo.current.length / 12);
    const el = blob.current;
    if (el && typeof el.animate === "function" && !reducedMotion()) {
      const big = 1 + k * 0.18;
      el.animate(
        [
          { transform: `scale(${big},${big})` },
          { transform: `scale(${big * (1.16 + k * 0.1)},${big * (0.84 - k * 0.08)})`, offset: 0.2 },
          { transform: `scale(${big * 0.94},${big * 1.07})`, offset: 0.55 },
          { transform: `scale(${big},${big})` },
        ],
        { duration: 260, easing: "ease-out", fill: "forwards" },
      );
    }
    // Bruit : pop varié, et un bruit ridicule environ 1 fois sur 12
    if (Math.random() < 1 / 12) {
      const x = SILLY[Math.floor(Math.random() * SILLY.length)];
      playSfx(x.s, { volume: x.v, rate: x.r[0] + Math.random() * (x.r[1] - x.r[0]), ...(x.d ? { duration: x.d } : {}) });
    } else {
      playSfx(Math.random() < 0.5 ? "pop" : "bloop2", { volume: 0.35, rate: 0.85 + k * 0.5 + Math.random() * 0.15 });
    }
    const id = ++popId.current;
    setPops((p) => [...p.slice(-14), { id, x: e.clientX, y: e.clientY, v: perTap, boom: explosive }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 900);
  };

  const buy = (kind: "finger" | "mini" | "boost") => {
    const cur = sRef.current;
    const cost = kind === "finger" ? fingerCost(cur.finger) : kind === "mini" ? miniCost(cur.minis) : boostCost(cur.minis);
    if (cur.gloops < cost || (kind === "boost" && boosted)) { haptic("light"); playSfx("error", { volume: 0.3 }); return; }
    const next = { ...cur, gloops: cur.gloops - cost, finger: cur.finger + (kind === "finger" ? 1 : 0), minis: cur.minis + (kind === "mini" ? 1 : 0) };
    sRef.current = next; setS(next); persist(next);
    if (kind === "boost") setBoostUntil(Date.now() + BOOST_MS);
    haptic("medium");
    playSfx(kind === "boost" ? "disco" : "coin", { volume: kind === "boost" ? 0.5 : 0.5, ...(kind === "boost" ? { duration: 2.5 } : {}) });
  };

  const line = [...lines].reverse().find(([at]) => s.taps >= at)?.[1] ?? lines[0][1];
  const nextReward = REWARDS.find((r) => s.taps < r.at);
  const share = async () => {
    haptic();
    await shareBandCard(
      [{ name: me?.name ?? "Moi", look }],
      t.shareTitle(fmt(s.taps, lang)),
      line,
      t.shareText,
      [`${fmt(s.gloops, lang)} ${t.gloops}`],
    );
  };

  const shop: { kind: "finger" | "mini" | "boost"; name: string; sub: string; cost: number; lvl?: number }[] = [
    { kind: "finger", name: t.finger, sub: t.fingerSub(s.finger + 2), cost: fingerCost(s.finger), lvl: s.finger },
    { kind: "mini", name: t.mini, sub: t.miniSub, cost: miniCost(s.minis), lvl: s.minis },
    { kind: "boost", name: t.boost, sub: boosted ? t.boostOn(Math.ceil((boostUntil - now) / 1000)) : t.boostSub, cost: boostCost(s.minis) },
  ];

  return createPortal(
    <div className="zz-scroll fixed inset-0 flex flex-col" style={{ zIndex: 45, background: boosted ? "#2A0E4F" : "var(--zz-bg)", transition: "background 400ms" }} role="dialog" aria-label={t.title}>
      <div className="flex items-center justify-between px-5" style={{ paddingTop: "calc(var(--sat) + 10px)" }}>
        <h2 className="zz-title text-[28px] text-white">{t.title}</h2>
        <button type="button" onClick={() => { persist(sRef.current); onClose(); }} aria-label={t.close}
          className="zz-push zz-stk-sm grid h-11 w-11 place-items-center rounded-full" style={{ background: "#fff", color: "var(--zz-ink)" }}>
          <X size={22} strokeWidth={3} />
        </button>
      </div>

      <div className="mt-2 text-center">
        <div className="zz-title text-[46px] leading-none" style={{ color: "#FFD23F" }}>{fmt(s.gloops, lang)}</div>
        <div className="mt-1 text-[14px] font-bold" style={{ color: "var(--zz-dim)" }}>
          {t.gloops} · {t.taps(fmt(s.taps, lang))}{s.minis ? ` · ${t.perSec(fmt(s.minis * (boosted ? 2 : 1), lang))}` : ""}
        </div>
        {s.taps >= 50000 && <div className="zz-stk-sm mx-auto mt-2 inline-block rounded-full px-3 py-0.5 text-[13px] font-extrabold" style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-2deg" }}>{t.badge}</div>}
        <p className="mx-6 mt-2 min-h-[44px] text-[16px] font-bold leading-snug text-white">{line}</p>
      </div>

      {/* Le blob à tapoter (+ ses mini-blobs autour) */}
      <div className="relative mx-auto grid flex-1 place-items-center" style={{ minHeight: 240, width: "100%", touchAction: "manipulation" }}>
        {Array.from({ length: Math.min(8, s.minis) }, (_, i) => (
          <div key={i} className="zz-click-mini absolute" style={{ ["--a" as string]: `${i * 45}deg`, animationDelay: `${-i * 0.37}s` } as CSSProperties}>
            <AvatarBlob look={{ ...baseLook(["mint", "yellow", "sky", "coral", "lavender", "orange", "lime", "pink"][i]), eyes: "happy" }} size={34} animate={false} />
          </div>
        ))}
        <div
          ref={blob}
          onPointerDown={tap}
          role="button"
          aria-label={t.title}
          className={`relative select-none ${legendary ? "zz-click-legend" : ""}`}
          style={{ WebkitTapHighlightColor: "transparent", WebkitUserSelect: "none", cursor: "pointer" }}
        >
          <AvatarBlob look={legendary && look.extra === "none" ? { ...look, extra: "aura" } : look} name={me?.name} size={190} mood={combo.current.length > 8 ? "laughing" : "happy"} />
        </div>
      </div>

      {/* Améliorations */}
      <div className="mx-auto w-full max-w-lg px-5">
        <div className="grid grid-cols-3 gap-2">
          {shop.map((it) => {
            const can = s.gloops >= it.cost && !(it.kind === "boost" && boosted);
            return (
              <button key={it.kind} type="button" onClick={() => buy(it.kind)}
                className="zz-push zz-stk-sm flex min-h-[96px] flex-col items-center justify-center rounded-[18px] px-1.5 py-2 text-center"
                style={{ background: can ? "#fff" : "rgba(255,255,255,0.14)", color: can ? "var(--zz-ink)" : "rgba(255,255,255,0.75)" }}>
                <span className="text-[13.5px] font-extrabold leading-tight">{it.name}{it.lvl ? ` ${it.lvl}` : ""}</span>
                <span className="mt-0.5 text-[11.5px] font-semibold leading-tight" style={{ opacity: 0.8 }}>{it.sub}</span>
                <span className="mt-1 text-[13px] font-extrabold" style={{ color: can ? "#C41F78" : undefined }}>{fmt(it.cost, lang)}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[13px] font-semibold" style={{ color: "var(--zz-mute)" }}>
          {nextReward ? t.next(fmt(nextReward.at, lang), t.reward[nextReward.kind]) : t.allDone}
        </p>
        <button type="button" onClick={() => void share()}
          className="zz-push zz-stk mx-auto mb-2 mt-3 flex h-12 items-center gap-2 rounded-full px-5 text-[16px] font-extrabold"
          style={{ background: "#FF3EA5", color: "#fff", marginBottom: "calc(var(--sab) + 12px)" }}>
          <Share2 size={18} strokeWidth={2.8} /> {t.share}
        </button>
      </div>

      {/* « +N » qui s'envolent (et confettis à partir de 1 000 taps) */}
      {pops.map((p) => (
        <span key={p.id} className="zz-click-pop zz-title pointer-events-none fixed text-[28px]" style={{ left: p.x, top: p.y - 30, color: "#fff", zIndex: 46 }}>
          +{fmt(p.v, lang)}
          {p.boom && Array.from({ length: 6 }, (_, i) => (
            <i key={i} className="zz-click-bit" style={{ ["--a" as string]: `${i * 60 + 15}deg`, background: ["#FF3EA5", "#3DDC97", "#52C7FF", "#FFD23F", "#A98BFF", "#FF8A1F"][i] } as CSSProperties} />
          ))}
        </span>
      ))}
      {toastNode}
    </div>,
    document.body,
  );
}
