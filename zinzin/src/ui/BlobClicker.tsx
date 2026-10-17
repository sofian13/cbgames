import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Share2, X } from "lucide-react";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import { baseLook, type AvatarLook } from "@/lib/avatar/look";
import { unlockSecret } from "@/lib/avatar/secrets";
import { type I18n, pick, useLang } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { shareBandCard } from "@/lib/share-card";
import { haptic, reducedMotion } from "./util";
import { useToast } from "./common";
import { ZBlob } from "./ZBlob";
import {
  LEVELS, PARTY_MIN, bigParty, earn, fmtBig, levelCost, levelOutput, levelUnlocked, partyConfetti, perSecond, perTap,
  type ClickerState,
} from "../clicker-engine";
import { loadBest, loadLocal, saveBoth, saveLocal } from "../clicker-save";

/**
 * « Tapote le blob » : mini-jeu à la Cookie Clicker pour celui qui s'ennuie en soirée.
 * Toucher le perso (« moi » de Ma bande) rapporte des gloops ; 10 bâtiments produisent tout seuls,
 * des améliorations doublent tout ; un blob doré passe de temps en temps (frénésie ×7 ou jackpot) ;
 * la « Grande fête » recommence tout contre des confettis (bonus permanent). Paliers de VRAIS taps :
 * récompenses pour les persos + phrases absurdes. App fermée : 10 % de la production, 4 h max.
 * Son du toucher : un pop qui monte en notes (gamme pentatonique) quand on tape vite.
 * Sauvegarde en double sur le téléphone (clicker-save.ts).
 */

const OFFLINE_CAP_S = 4 * 3600;
const OFFLINE_RATE = 0.1;
const FRENZY_MS = 30_000;
const GOLD_SHOW_MS = 9000;

type Reward = { at: number; secret?: string; kind: "eyes" | "extra" | "anim" | "color" | "legend" | "badge" };
const REWARDS: Reward[] = [
  { at: 100, secret: "spiral", kind: "eyes" },
  { at: 500, secret: "foamfinger", kind: "extra" },
  { at: 1000, kind: "anim" },
  { at: 5000, secret: "color-chrome", kind: "color" },
  { at: 10000, secret: "aura", kind: "legend" },
  { at: 50000, kind: "badge" },
];

const LINES: I18n<[number, string][]> = {
  fr: [
    [0, "Tape sur le blob. C'est tout."], [10, "C'est parti. Personne ne t'a vu."], [50, "Tes potes t'ont abandonné ?"],
    [100, "Tu sais qu'il y a une soirée autour de toi ?"], [250, "Pose ce téléphone. Non ? D'accord."],
    [500, "Le blob commence à t'apprécier."], [1000, "1 000 taps. Ça devient inquiétant."],
    [2500, "Quelqu'un a pensé à t'inviter à danser ?"], [5000, "Félicitations, tu es officiellement un meuble."],
    [10000, "10 000. Le blob est devenu légendaire. Toi, non."], [25000, "Ton pouce a demandé un arrêt maladie."],
    [50000, "Succès débloqué : Sans vie sociale 🏆"], [100000, "100 000 taps. On appelle quelqu'un ?"],
  ],
  en: [
    [0, "Tap the blob. That's it."], [10, "Here we go. Nobody saw you."], [50, "Did your friends ditch you?"],
    [100, "You know there's a party around you, right?"], [250, "Put the phone down. No? Fine."],
    [500, "The blob is starting to like you."], [1000, "1,000 taps. This is getting worrying."],
    [2500, "Has anyone thought of asking you to dance?"], [5000, "Congrats, you're officially furniture."],
    [10000, "10,000. The blob is now legendary. You're not."], [25000, "Your thumb just called in sick."],
    [50000, "Achievement unlocked: No social life 🏆"], [100000, "100,000 taps. Should we call someone?"],
  ],
  es: [
    [0, "Toca el blob. Y ya está."], [10, "Empezamos. Nadie te ha visto."], [50, "¿Tus amigos te han abandonado?"],
    [100, "¿Sabes que hay una fiesta a tu alrededor?"], [250, "Suelta el móvil. ¿No? Vale."],
    [500, "El blob empieza a cogerte cariño."], [1000, "1.000 toques. Esto empieza a preocupar."],
    [2500, "¿Alguien ha pensado en sacarte a bailar?"], [5000, "Enhorabuena, ya eres oficialmente un mueble."],
    [10000, "10.000. El blob es legendario. Tú no."], [25000, "Tu pulgar ha pedido la baja."],
    [50000, "Logro desbloqueado: Sin vida social 🏆"], [100000, "100.000 toques. ¿Llamamos a alguien?"],
  ],
};

const T: I18n<{
  title: string; gloops: string; perSec: (n: string) => string; taps: (n: string) => string; perTap: (n: string) => string;
  upgrades: string; buildings: string; owned: (n: number) => string; prod: (n: string) => string; locked: string;
  offline: (n: string) => string; frenzy: (s: number) => string; goldFrenzy: string; goldJackpot: (n: string) => string;
  party: string; partySub: (n: number) => string; partyNeed: (n: string) => string; partyBtn: (n: number) => string; partyDone: (n: number) => string; confetti: (n: number) => string;
  next: (at: string, what: string) => string; allDone: string; share: string; shareTitle: (n: string) => string; shareText: string;
  reward: Record<Reward["kind"], string>; unlocked: (what: string) => string; close: string; badge: string;
  lvl: (n: number) => string; plusTap: (n: string) => string; soon: (n: number) => string; unlockAt: (n: string) => string;
  partyShort: string; partyGain: (n: number) => string; partyAt: (n: string) => string; doubled: (name: string) => string;
}> = {
  fr: {
    title: "Tapote le blob", gloops: "gloops", perSec: (n) => `${n} par seconde`, taps: (n) => `${n} taps`, perTap: (n) => `+${n} par tap`,
    upgrades: "Améliorations", buildings: "Ta fabrique à gloops", owned: (n) => `× ${n}`, prod: (n) => `+${n}/s`, locked: "???",
    offline: (n) => `Pendant ton absence, ta fabrique a fait ${n} gloops !`, frenzy: (s) => `🔥 Frénésie ×7 : encore ${s} s`,
    goldFrenzy: "✨ Blob doré : FRÉNÉSIE ×7 pendant 30 s !", goldJackpot: (n) => `✨ Blob doré : jackpot de ${n} gloops !`,
    party: "🎉 La Grande fête", partySub: (n) => `Tout recommence à zéro, mais tu gagnes ${n} confettis : +2 % de tout par confetti, pour toujours.`,
    partyNeed: (n) => `Gagne ${n} gloops au total pour lancer la Grande fête.`, partyBtn: (n) => `Lancer la fête (+${n} confettis)`,
    partyDone: (n) => `🎉 Grande fête ! ${n} confettis : tout rapporte plus.`, confetti: (n) => `🎊 ${n} confettis (+${n * 3} %)`,
    next: (at, what) => `Prochaine récompense : ${what} à ${at} taps`, allDone: "Toutes les récompenses sont débloquées. Respect (et inquiétude).",
    share: "Partager ma honte", shareTitle: (n) => `${n} taps sur un blob`, shareText: "J'ai tapoté un blob au lieu de profiter de la soirée. Zinzin 🫠",
    reward: { eyes: "les yeux Hypnotisé", extra: "le Doigt en mousse", anim: "les taps explosifs", color: "la couleur Chrome", legend: "le blob légendaire (Aura)", badge: "le succès « Sans vie sociale »" },
    unlocked: (what) => `🎁 Débloqué : ${what} !`, close: "Fermer", badge: "🏆 Sans vie sociale",
    lvl: (n) => `niv. ${n}`, plusTap: (n) => `+${n}/tap`, soon: (n) => `dans ${n}`, unlockAt: (n) => `à ${n} gloops`,
    partyShort: "Grande fête", partyGain: (n) => `+${n} confettis`, partyAt: (n) => `à ${n} gagnés`, doubled: (name) => `⚡ ${name} : efficacité ×2 !`,
  },
  en: {
    title: "Tap the blob", gloops: "gloops", perSec: (n) => `${n} per second`, taps: (n) => `${n} taps`, perTap: (n) => `+${n} per tap`,
    upgrades: "Upgrades", buildings: "Your gloop factory", owned: (n) => `× ${n}`, prod: (n) => `+${n}/s`, locked: "???",
    offline: (n) => `While you were away, your factory made ${n} gloops!`, frenzy: (s) => `🔥 Frenzy ×7: ${s} s left`,
    goldFrenzy: "✨ Golden blob: FRENZY ×7 for 30 s!", goldJackpot: (n) => `✨ Golden blob: ${n} gloops jackpot!`,
    party: "🎉 The Big Party", partySub: (n) => `Everything starts over, but you get ${n} confetti: +2% to everything per confetti, forever.`,
    partyNeed: (n) => `Earn ${n} gloops in total to throw the Big Party.`, partyBtn: (n) => `Throw the party (+${n} confetti)`,
    partyDone: (n) => `🎉 Big Party! ${n} confetti: everything pays more.`, confetti: (n) => `🎊 ${n} confetti (+${n * 3}%)`,
    next: (at, what) => `Next reward: ${what} at ${at} taps`, allDone: "All rewards unlocked. Respect (and concern).",
    share: "Share my shame", shareTitle: (n) => `${n} taps on a blob`, shareText: "I tapped a blob instead of enjoying the party. Zinzin 🫠",
    reward: { eyes: "Hypnotized eyes", extra: "the Foam finger", anim: "explosive taps", color: "the Chrome color", legend: "the legendary blob (Aura)", badge: "the “No social life” achievement" },
    unlocked: (what) => `🎁 Unlocked: ${what}!`, close: "Close", badge: "🏆 No social life",
    lvl: (n) => `lv ${n}`, plusTap: (n) => `+${n}/tap`, soon: (n) => `in ${n}`, unlockAt: (n) => `at ${n} gloops`,
    partyShort: "Big Party", partyGain: (n) => `+${n} confetti`, partyAt: (n) => `at ${n} earned`, doubled: (name) => `⚡ ${name}: ×2 power!`,
  },
  es: {
    title: "Toca el blob", gloops: "gloops", perSec: (n) => `${n} por segundo`, taps: (n) => `${n} toques`, perTap: (n) => `+${n} por toque`,
    upgrades: "Mejoras", buildings: "Tu fábrica de gloops", owned: (n) => `× ${n}`, prod: (n) => `+${n}/s`, locked: "???",
    offline: (n) => `Mientras no estabas, tu fábrica hizo ${n} gloops.`, frenzy: (s) => `🔥 Frenesí ×7: quedan ${s} s`,
    goldFrenzy: "✨ Blob dorado: ¡FRENESÍ ×7 durante 30 s!", goldJackpot: (n) => `✨ Blob dorado: ¡premio de ${n} gloops!`,
    party: "🎉 La Gran fiesta", partySub: (n) => `Todo vuelve a empezar, pero ganas ${n} confeti: +2 % de todo por confeti, para siempre.`,
    partyNeed: (n) => `Gana ${n} gloops en total para montar la Gran fiesta.`, partyBtn: (n) => `Montar la fiesta (+${n} confeti)`,
    partyDone: (n) => `🎉 ¡Gran fiesta! ${n} confeti: todo rinde más.`, confetti: (n) => `🎊 ${n} confeti (+${n * 3} %)`,
    next: (at, what) => `Próxima recompensa: ${what} a los ${at} toques`, allDone: "Todas las recompensas desbloqueadas. Respeto (y preocupación).",
    share: "Compartir mi vergüenza", shareTitle: (n) => `${n} toques a un blob`, shareText: "He tocado un blob en vez de disfrutar de la fiesta. Zinzin 🫠",
    reward: { eyes: "los ojos Hipnotizado", extra: "el Dedo de espuma", anim: "los toques explosivos", color: "el color Cromo", legend: "el blob legendario (Aura)", badge: "el logro «Sin vida social»" },
    unlocked: (what) => `🎁 Desbloqueado: ${what}`, close: "Cerrar", badge: "🏆 Sin vida social",
    lvl: (n) => `niv. ${n}`, plusTap: (n) => `+${n}/toque`, soon: (n) => `en ${n}`, unlockAt: (n) => `a ${n} gloops`,
    partyShort: "Gran fiesta", partyGain: (n) => `+${n} confeti`, partyAt: (n) => `a ${n} ganados`, doubled: (name) => `⚡ ${name}: ¡×2 de potencia!`,
  },
};

/** Gamme pentatonique (demi-tons) : le pop monte d'une note à chaque tap rapide, puis redescend. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

export function BlobClicker({ onClose }: { onClose: () => void }) {
  const lang = useLang();
  const t = pick(T, lang);
  const lines = pick(LINES, lang);
  const { show: toast, node: toastNode } = useToast();
  const band = useBand();
  const me = band.find((b) => b.me) ?? band[0];
  const look: AvatarLook = me?.look ?? { ...baseLook("pink"), eyes: "happy" };
  const [s, setS] = useState<ClickerState>(loadLocal);
  const sRef = useRef(s);
  sRef.current = s;
  const [now, setNow] = useState(Date.now());
  const [frenzyUntil, setFrenzyUntil] = useState(0);
  const [gold, setGold] = useState<{ id: number; x: number; y: number } | null>(null);
  const [pops, setPops] = useState<{ id: number; x: number; y: number; v: string; boom: boolean }[]>([]);
  const blob = useRef<HTMLDivElement>(null);
  const combo = useRef<number[]>([]);
  const note = useRef(0);
  const popId = useRef(0);
  const frenzy = now < frenzyUntil;
  const update = (next: ClickerState) => { sRef.current = next; setS(next); };

  // Ouverture : la meilleure des deux sauvegardes + gains hors ligne
  useEffect(() => {
    let alive = true;
    void loadBest().then((best) => {
      if (!alive) return;
      const secs = Math.min(OFFLINE_CAP_S, Math.max(0, (Date.now() - best.last) / 1000));
      const got = perSecond(best) * secs * OFFLINE_RATE;
      const next = got >= 1 ? earn(best, got) : best;
      update(next);
      if (got >= 10 && secs >= 60) setTimeout(() => toast(t.offline(fmtBig(got, lang))), 400);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Production : 10 fois par seconde ; sauvegardes (locale toutes les 2 s, fichier toutes les 15 s, et en quittant)
  useEffect(() => {
    let lastT = performance.now();
    const tick = setInterval(() => {
      const n = performance.now();
      const dt = (n - lastT) / 1000;
      lastT = n;
      const ms = Date.now();
      setNow(ms);
      const ps = perSecond(sRef.current, ms < frenzyUntil);
      if (ps > 0) update(earn(sRef.current, ps * dt));
    }, 100);
    const loc = setInterval(() => saveLocal(sRef.current), 2000);
    const file = setInterval(() => void saveBoth(sRef.current), 15000);
    const hide = () => { if (document.hidden) void saveBoth(sRef.current); };
    document.addEventListener("visibilitychange", hide);
    return () => { clearInterval(tick); clearInterval(loc); clearInterval(file); document.removeEventListener("visibilitychange", hide); };
  }, [frenzyUntil]);
  useEffect(() => () => { void saveBoth(sRef.current); }, []);

  // Blob doré : passe de temps en temps (toutes les 60 à 150 s), 9 s pour l'attraper
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let off: ReturnType<typeof setTimeout>;
    let id = 0;
    const plan = () => {
      timer = setTimeout(() => {
        setGold({ id: ++id, x: 12 + Math.random() * 64, y: 18 + Math.random() * 50 });
        playSfx("chime", { volume: 0.4, rate: 1.4 });
        off = setTimeout(() => setGold(null), GOLD_SHOW_MS);
        plan();
      }, 60_000 + Math.random() * 90_000);
    };
    plan();
    return () => { clearTimeout(timer); clearTimeout(off); };
  }, []);

  const catchGold = () => {
    setGold(null);
    haptic("success");
    playSfx("coins", { volume: 0.5 });
    playSfx("ding2", { volume: 0.5, rate: 1.3, delay: 0.08 });
    const cur = sRef.current;
    if (Math.random() < 0.5) {
      setFrenzyUntil(Date.now() + FRENZY_MS);
      toast(t.goldFrenzy);
    } else {
      const gain = Math.max(77, Math.min(cur.gloops * 0.15, perSecond(cur) * 900) + 13);
      update(earn(cur, gain));
      toast(t.goldJackpot(fmtBig(gain, lang)));
    }
  };

  const explosive = s.taps >= 1000;
  const legendary = s.taps >= 10000;

  const tap = (e: React.PointerEvent) => {
    const nowMs = performance.now();
    combo.current = [...combo.current.filter((x) => nowMs - x < 1200), nowMs];
    const cur = sRef.current;
    const v = perTap(cur, frenzy);
    const next = earn({ ...cur, taps: cur.taps + 1 }, v);
    for (const r of REWARDS) {
      if (cur.taps < r.at && next.taps >= r.at) {
        if (r.secret) unlockSecret(r.secret);
        playSfx("tada", { volume: 0.45 });
        haptic("success");
        toast(t.unlocked(t.reward[r.kind]));
      }
    }
    update(next);
    haptic("light");
    // Note : monte tant qu'on tape vite, redescend doucement sinon (boucle la mélodie en haut)
    note.current = combo.current.length > 1 ? note.current + 1 : Math.max(0, note.current - 3);
    if (note.current >= SCALE.length) note.current = 5;
    playSfx("pop", { volume: 0.32, rate: 0.85 * 2 ** (SCALE[note.current] / 12) });
    const k = Math.min(1, combo.current.length / 12);
    const el = blob.current;
    if (el && typeof el.animate === "function" && !reducedMotion()) {
      const big = 1 + k * 0.14;
      el.animate(
        [
          { transform: `scale(${big},${big})` },
          { transform: `scale(${big * 1.14},${big * 0.86})`, offset: 0.22 },
          { transform: `scale(${big * 0.95},${big * 1.06})`, offset: 0.55 },
          { transform: `scale(${big},${big})` },
        ],
        { duration: 240, easing: "ease-out", fill: "forwards" },
      );
    }
    const id = ++popId.current;
    setPops((p) => [...p.slice(-12), { id, x: e.clientX + (Math.random() * 40 - 20), y: e.clientY, v: fmtBig(v, lang), boom: explosive }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 900);
  };

  const buyLevel = (i: number) => {
    const cur = sRef.current;
    const cost = levelCost(i, cur.lv[i]);
    if (!levelUnlocked(cur, i) || cur.gloops < cost) { haptic("light"); return; }
    const lv = cur.lv.slice(); lv[i]++;
    update({ ...cur, gloops: cur.gloops - cost, lv });
    // Jalon : tous les 10 niveaux, l'amélioration double
    if (lv[i] % 10 === 0) { haptic("success"); playSfx("ding", { volume: 0.45, rate: 1.2 }); toast(t.doubled(LEVELS[i].name[lang])); }
    else { haptic("medium"); playSfx("coin", { volume: 0.4, rate: 1 + i * 0.06 }); }
  };
  const party = () => {
    const gain = partyConfetti(sRef.current);
    if (gain <= 0) return;
    const next = bigParty(sRef.current);
    update(next);
    void saveBoth(next);
    haptic("success");
    playSfx("tada", { volume: 0.5 });
    toast(t.partyDone(next.confetti));
  };

  const ps = perSecond(s, frenzy);
  const line = [...lines].reverse().find(([at]) => s.taps >= at)?.[1] ?? lines[0][1];
  const nextReward = REWARDS.find((r) => s.taps < r.at);
  const confettiGain = partyConfetti(s);

  const share = async () => {
    haptic();
    await shareBandCard([{ name: me?.name ?? "Moi", look }], t.shareTitle(fmtBig(s.taps, lang)), line, t.shareText, [`${fmtBig(s.earnedAll, lang)} ${t.gloops}`]);
  };

  const card = (can: boolean): CSSProperties => ({ background: can ? "#fff" : "rgba(255,255,255,0.12)", color: can ? "var(--zz-ink)" : "rgba(255,255,255,0.75)" });

  return createPortal(
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ zIndex: 45, background: frenzy ? "#3A0E3F" : "var(--zz-bg)", transition: "background 400ms", paddingTop: "calc(var(--sat) + 8px)", paddingBottom: "calc(var(--sab) + 10px)" }} role="dialog" aria-label={t.title}>
      <div className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5">
          <h2 className="zz-title text-[26px] text-white">{t.title}</h2>
          <button type="button" onClick={() => { void saveBoth(sRef.current); onClose(); }} aria-label={t.close}
            className="zz-push zz-stk-sm grid h-11 w-11 place-items-center rounded-full" style={{ background: "#fff", color: "var(--zz-ink)" }}>
            <X size={22} strokeWidth={3} />
          </button>
        </div>
        <div className="text-center">
          <div className="zz-title text-[44px] leading-none" style={{ color: "#FFD23F" }}>{fmtBig(s.gloops, lang)}</div>
          <div className="mt-1 text-[13px] font-bold" style={{ color: "var(--zz-dim)" }}>
            {t.gloops} · {t.perSec(fmtBig(ps, lang))} · {t.taps(fmtBig(s.taps, lang))}
          </div>
          {frenzy
            ? <div className="mt-1 text-[14px] font-extrabold" style={{ color: "#FF8A1F" }}>{t.frenzy(Math.ceil((frenzyUntil - now) / 1000))}</div>
            : (s.confetti > 0 || s.taps >= 50000) && (
              <div className="mt-1 flex justify-center gap-1.5 text-[12px] font-extrabold">
                {s.confetti > 0 && <span style={{ color: "#FFD23F" }}>{t.confetti(s.confetti)}</span>}
                {s.taps >= 50000 && <span style={{ color: "#FFD23F" }}>{t.badge}</span>}
              </div>
            )}
          <p className="mx-6 mt-1.5 text-[15.5px] font-bold leading-snug text-white">{line}</p>
        </div>

        {/* Le blob à tapoter, ses mini-blobs, et parfois le blob doré */}
        <div className="relative grid min-h-0 flex-1 place-items-center" style={{ touchAction: "manipulation" }}>
          {Array.from({ length: Math.min(8, s.lv[1]) }, (_, i) => (
            <div key={i} className="zz-click-mini absolute" style={{ ["--a" as string]: `${i * 45}deg`, animationDelay: `${-i * 0.37}s` } as CSSProperties}>
              <AvatarBlob look={{ ...baseLook(["mint", "yellow", "sky", "coral", "lavender", "orange", "lime", "pink"][i]), eyes: "happy" }} size={30} animate={false} />
            </div>
          ))}
          <div ref={blob} onPointerDown={tap} role="button" aria-label={t.title}
            className={`relative select-none ${legendary ? "zz-click-legend" : ""}`}
            style={{ WebkitTapHighlightColor: "transparent", WebkitUserSelect: "none", cursor: "pointer" }}>
            <AvatarBlob look={legendary && look.extra === "none" ? { ...look, extra: "aura" } : look} name={me?.name} size={170} mood={combo.current.length > 8 ? "laughing" : "happy"} />
          </div>
          {gold && (
            <button key={gold.id} type="button" onClick={catchGold} aria-label="Blob doré"
              className="zz-click-gold absolute" style={{ left: `${gold.x}%`, top: `${gold.y}%` }}>
              <ZBlob size={56} color="yellow" mood="wink" seed={9} shadow={false} outline gloss hop={false}
                palette={{ body: "#FFD23F", deep: "#C99400", hi: "#FFF6C2", ink: "#2A1A00" }} />
            </button>
          )}
        </div>

        {/* 6 cartes toujours à la même place : 5 améliorations à niveaux + la Grande fête */}
        <div className="grid grid-cols-3 gap-2 px-4">
          {LEVELS.map((d, i) => {
            const open = levelUnlocked(s, i);
            const cost = levelCost(i, s.lv[i]);
            const can = open && s.gloops >= cost;
            const gain = levelOutput(s, i, s.lv[i] + 1) - levelOutput(s, i);
            const toDouble = 10 - (s.lv[i] % 10);
            return (
              <button key={d.id} type="button" onClick={() => buyLevel(i)} disabled={!open}
                className="zz-push zz-stk-sm relative flex min-h-[92px] flex-col items-center justify-center rounded-[18px] px-1 py-1.5 text-center"
                style={!open ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" } : card(can)}>
                {open && s.lv[i] > 0 && (
                  <span className="absolute -right-1 -top-1.5 rounded-full px-1.5 text-[11px] font-extrabold" style={{ background: "var(--zz-ink)", color: "#FFD23F" }}>{t.lvl(s.lv[i])}</span>
                )}
                <span className="text-[20px] leading-none">{open ? d.icon : "🔒"}</span>
                <span className="mt-1 text-[12.5px] font-extrabold leading-tight">{open ? d.name[lang] : t.locked}</span>
                {open ? (
                  <>
                    <span className="text-[11px] font-bold" style={{ opacity: 0.75 }}>{i === 0 ? t.plusTap(fmtBig(gain, lang)) : t.prod(fmtBig(gain, lang))}{toDouble <= 3 ? ` · ×2 ${t.soon(toDouble)}` : ""}</span>
                    <span className="mt-0.5 text-[13px] font-extrabold" style={{ color: can ? "#C41F78" : undefined }}>{fmtBig(cost, lang)}</span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold">{t.unlockAt(fmtBig(LEVELS[i].base * 0.5, lang))}</span>
                )}
              </button>
            );
          })}
          {/* 6e carte : la Grande fête (recommencer contre des confettis) */}
          <button type="button" onClick={party} disabled={confettiGain <= 0}
            className="zz-push zz-stk-sm flex min-h-[92px] flex-col items-center justify-center rounded-[18px] px-1 py-1.5 text-center"
            style={confettiGain > 0 ? { background: "#FFD23F", color: "var(--zz-ink)" } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
            <span className="text-[20px] leading-none">🎉</span>
            <span className="mt-1 text-[12.5px] font-extrabold leading-tight">{t.partyShort}</span>
            <span className="text-[11px] font-bold leading-tight">{confettiGain > 0 ? t.partyGain(confettiGain) : t.partyAt(fmtBig(PARTY_MIN, lang))}</span>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-4">
          <p className="min-w-0 flex-1 text-[12px] font-semibold leading-tight" style={{ color: "var(--zz-mute)" }}>
            {nextReward ? t.next(fmtBig(nextReward.at, lang), t.reward[nextReward.kind]) : t.allDone}
          </p>
          <button type="button" onClick={() => void share()} className="zz-push zz-stk-sm flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-extrabold" style={{ background: "#FF3EA5", color: "#fff" }}>
            <Share2 size={15} strokeWidth={2.8} /> {t.share}
          </button>
        </div>
      </div>

      {/* « +N » qui s'envolent (et confettis à partir de 1 000 taps) */}
      {pops.map((p) => (
        <span key={p.id} className="zz-click-pop zz-title pointer-events-none fixed text-[26px]" style={{ left: p.x, top: p.y - 30, color: "#fff", zIndex: 46 }}>
          +{p.v}
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
