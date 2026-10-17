import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Disc3, Headphones, Lock, Orbit, PartyPopper, Pointer, Share2, X } from "lucide-react";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import { baseLook, type AvatarLook } from "@/lib/avatar/look";
import { unlockSecret } from "@/lib/avatar/secrets";
import { type I18n, pick, useLang } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { shareBandCard } from "@/lib/share-card";
import { haptic, reducedMotion } from "./util";
import { useToast } from "./common";
import { useLiteFx, watchFps } from "./perf";
import { ZBlob } from "./ZBlob";
import { ClickerScene, ENVS, type EnvId } from "./ClickerScenes";
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

const FRENZY_MS = 30_000;
const GIFT_KEY = "zz-clicker-gift-day";
const GOLD_SHOW_MS = 9000;

type Reward = { at: number; secret?: string; kind: "eyes" | "extra" | "anim" | "color" | "legend" | "badge" };
const REWARDS: Reward[] = [
  { at: 100, secret: "spiral", kind: "eyes" },
  { at: 500, secret: "foamfinger", kind: "extra" },
  { at: 5000, secret: "color-chrome", kind: "color" },
  { at: 10000, secret: "aura", kind: "legend" },
  { at: 50000, kind: "badge" },
];

/** Pouvoirs visuels du blob, débloqués aux paliers de vrais taps (grosse annonce à chaque fois). */
type Power = "sweat" | "boom" | "fire" | "sparks" | "bolts" | "crown";
const POWERS: { at: number; id: Power; icon: string }[] = [
  { at: 250, id: "sweat", icon: "💦" },
  { at: 1000, id: "boom", icon: "🎉" },
  { at: 2500, id: "fire", icon: "🔥" },
  { at: 5000, id: "sparks", icon: "✨" },
  { at: 25000, id: "bolts", icon: "⚡" },
  { at: 50000, id: "crown", icon: "👑" },
];
const POWER_TXT: I18n<{ title: string; name: Record<Power, string>; desc: Record<Power, string>; combo: (n: number) => string }> = {
  fr: {
    title: "NOUVEAU POUVOIR !",
    name: { sweat: "La sueur", boom: "Taps explosifs", fire: "Combo de feu", sparks: "Étincelles", bolts: "Éclairs", crown: "Couronne de flammes" },
    desc: { sweat: "Tape vite : ton blob transpire.", boom: "Chaque tap explose en confettis.", fire: "8 taps d'affilée : ton blob prend feu !", sparks: "Des étincelles tournent autour de lui.", bolts: "Gros combo : la foudre tombe.", crown: "Une couronne de flammes, pour toujours." },
    combo: (n) => `COMBO ×${n}`,
  },
  en: {
    title: "NEW POWER!",
    name: { sweat: "Sweat", boom: "Explosive taps", fire: "Fire combo", sparks: "Sparkles", bolts: "Lightning", crown: "Crown of flames" },
    desc: { sweat: "Tap fast: your blob sweats.", boom: "Every tap bursts into confetti.", fire: "8 taps in a row: your blob catches fire!", sparks: "Sparkles orbit around it.", bolts: "Huge combo: lightning strikes.", crown: "A crown of flames, forever." },
    combo: (n) => `COMBO ×${n}`,
  },
  es: {
    title: "¡NUEVO PODER!",
    name: { sweat: "El sudor", boom: "Toques explosivos", fire: "Combo de fuego", sparks: "Chispas", bolts: "Rayos", crown: "Corona de llamas" },
    desc: { sweat: "Toca rápido: tu blob suda.", boom: "Cada toque explota en confeti.", fire: "¡8 toques seguidos: tu blob arde!", sparks: "Unas chispas giran a su alrededor.", bolts: "Combo enorme: caen rayos.", crown: "Una corona de llamas, para siempre." },
    combo: (n) => `COMBO ×${n}`,
  },
};
const hasPower = (taps: number, id: Power) => taps >= (POWERS.find((p) => p.id === id)?.at ?? Infinity);

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
  envNew: string; envDesc: string; envAt: (n: string) => string; giftTitle: string; giftSub: string; giftBtn: string;
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
    envNew: "NOUVEAU DÉCOR !", envDesc: "Ton blob déménage. Change de décor quand tu veux, en haut.", envAt: (n) => `à ${n} taps`,
    giftTitle: "Cadeau du jour", giftSub: "Content de te revoir ! Reviens demain pour un autre cadeau.", giftBtn: "Je prends !",
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
    envNew: "NEW SCENERY!", envDesc: "Your blob is moving. Switch scenery anytime, up top.", envAt: (n) => `at ${n} taps`,
    giftTitle: "Daily gift", giftSub: "Good to see you! Come back tomorrow for another gift.", giftBtn: "Grab it!",
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
    envNew: "¡NUEVO ESCENARIO!", envDesc: "Tu blob se muda. Cambia de escenario cuando quieras, arriba.", envAt: (n) => `a ${n} toques`,
    giftTitle: "Regalo del día", giftSub: "¡Qué bien verte! Vuelve mañana para otro regalo.", giftBtn: "¡Lo quiero!",
  },
};

/** Flamme de dessin animé (contour épais, langues de feu) : posée en couronne derrière le blob en combo. */
const FLAME = "M50 128 C22 128 6 106 12 80 C16 64 26 58 28 46 C36 56 38 64 36 72 C46 58 44 36 56 6 C62 30 76 40 80 60 C84 52 84 44 82 36 C96 54 98 82 90 100 C82 118 68 128 50 128Z";
// Couronne de flammes qui sortent de DERRIÈRE le blob (bas des flammes cachés derrière lui)
const FLAMES: { x: number; y: number; w: number; r: number }[] = [
  { x: -104, y: -40, w: 60, r: -30 }, { x: -82, y: 6, w: 72, r: -18 }, { x: -42, y: 36, w: 84, r: -7 },
  { x: 0, y: 48, w: 96, r: 0 }, { x: 42, y: 36, w: 84, r: 7 }, { x: 82, y: 6, w: 72, r: 18 }, { x: 104, y: -40, w: 60, r: 30 },
];

/** Couleurs et pictos des 6 cartes (même famille que les cartes de jeux de l'accueil) */
const CARD_STYLE: { bg: string; deep: string; icon: "finger" | "mini" | "dj" | "club" | "planet" }[] = [
  { bg: "#FF3EA5", deep: "#C41F78", icon: "finger" },
  { bg: "#3DDC97", deep: "#1C9E68", icon: "mini" },
  { bg: "#A98BFF", deep: "#6E50D8", icon: "dj" },
  { bg: "#52C7FF", deep: "#1F8FC4", icon: "club" },
  { bg: "#FF8A1F", deep: "#D2560A", icon: "planet" },
];
function CardIcon({ kind }: { kind: (typeof CARD_STYLE)[number]["icon"] }) {
  const p = { size: 19, strokeWidth: 2.8, color: "#15082E" };
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "#fff", border: "2.5px solid #15082E", boxShadow: "0 2px 0 #15082E" }}>
      {kind === "finger" ? <Pointer {...p} /> : kind === "mini" ? <ZBlob size={26} color="mint" mood="happy" seed={3} shadow={false} wobble={false} hop={false} />
        : kind === "dj" ? <Headphones {...p} /> : kind === "club" ? <Disc3 {...p} /> : <Orbit {...p} />}
    </span>
  );
}

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
  const [pops, setPops] = useState<{ id: number; x: number; y: number; v: string; boom: boolean; sweat?: boolean }[]>([]);
  const blob = useRef<HTMLDivElement>(null);
  const combo = useRef<number[]>([]);
  const note = useRef(0);
  const popId = useRef(0);
  const squash = useRef<Animation | null>(null);
  const lastFx = useRef(0);
  const pw = pick(POWER_TXT, lang);
  // Téléphone qui peine : effets allégés automatiquement (perf.ts)
  const liteFx = useLiteFx();
  // Combo : taps enchaînés à moins de 450 ms ; retombe à zéro dès qu'on s'arrête
  const [streak, setStreak] = useState(0);
  const streakT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [celebrate, setCelebrate] = useState<Power | null>(null);
  const [envCelebrate, setEnvCelebrate] = useState<EnvId | null>(null);
  const [envPick, setEnvPick] = useState(false);
  const [gift, setGift] = useState<number | null>(null);
  const celebrateT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(streakT.current); clearTimeout(celebrateT.current); }, []);
  const frenzy = now < frenzyUntil;
  const update = (next: ClickerState) => { sRef.current = next; setS(next); };

  // Ouverture : la meilleure des deux sauvegardes. Rien ne se gagne quand on ne joue pas.
  useEffect(() => {
    let alive = true;
    void loadBest().then((best) => {
      if (!alive) return;
      update(best);
      // Cadeau du jour : à la 1re ouverture de la journée (rien n'est perdu si on rate un jour)
      try {
        const today = new Date().toDateString();
        if (localStorage.getItem(GIFT_KEY) !== today) {
          setGift(Math.max(100, Math.round(perSecond(best) * 120 + perTap(best) * 40)));
        }
      } catch { /* indispo */ }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Production : 10 fois par seconde ; sauvegardes (locale toutes les 2 s, fichier toutes les 15 s, et en quittant)
  useEffect(() => {
    let lastT = performance.now();
    let frames = 0;
    const tick = setInterval(() => {
      const n = performance.now();
      // Pas de rattrapage : app en arrière-plan ou page en pause = rien ne tourne
      const dt = document.hidden ? 0 : Math.min(0.25, (n - lastT) / 1000);
      lastT = n;
      const ms = Date.now();
      setNow(ms);
      const ps = perSecond(sRef.current, ms < frenzyUntil);
      if (ps > 0) sRef.current = earn(sRef.current, ps * dt);
      // Affichage 4 fois par seconde seulement (le calcul, lui, reste fin) : moins de travail pour le téléphone
      if (++frames % 3 === 0) setS(sRef.current);
    }, 100);
    const loc = setInterval(() => saveLocal(sRef.current), 2000);
    const file = setInterval(() => void saveBoth(sRef.current), 15000);
    const hide = () => { if (document.hidden) void saveBoth(sRef.current); };
    document.addEventListener("visibilitychange", hide);
    return () => { clearInterval(tick); clearInterval(loc); clearInterval(file); document.removeEventListener("visibilitychange", hide); };
  }, [frenzyUntil]);
  useEffect(() => () => { void saveBoth(sRef.current); }, []);
  // L'accueil est entièrement recouvert : ses animations se mettent en pause (batterie, fluidité du mini-jeu)
  useEffect(() => {
    const home = document.querySelector(".zz-home");
    home?.classList.add("zz-covered");
    return () => home?.classList.remove("zz-covered");
  }, []);

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

  const explosive = hasPower(s.taps, "boom");
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
    // Nouveau pouvoir : grosse annonce plein écran
    const power = POWERS.find((p) => cur.taps < p.at && next.taps >= p.at);
    if (power) {
      setCelebrate(power.id);
      playSfx("tada", { volume: 0.55 });
      playSfx("firecracker", { volume: 0.35, delay: 0.15 });
      haptic("success");
      clearTimeout(celebrateT.current);
      celebrateT.current = setTimeout(() => setCelebrate(null), 2600);
    }
    // Nouveau décor : grande annonce, et on y emménage directement
    const newEnv = ENVS.find((e) => e.at > 0 && cur.taps < e.at && next.taps >= e.at);
    if (newEnv) {
      next.env = newEnv.id;
      setEnvCelebrate(newEnv.id);
      playSfx("tada", { volume: 0.55 });
      haptic("success");
      clearTimeout(celebrateT.current);
      celebrateT.current = setTimeout(() => setEnvCelebrate(null), 2800);
    }
    update(next);
    // Plusieurs doigts = des dizaines de taps par seconde : vibration et son limités (le compteur, lui, compte tout)
    const nowT = performance.now();
    const quiet = nowT - lastFx.current < 45;
    if (!quiet) lastFx.current = nowT;
    if (!quiet) haptic("light");
    setStreak((n) => { if (n + 1 === 6 || (n + 1) % 12 === 0) watchFps(1500); return n + 1; });
    clearTimeout(streakT.current);
    streakT.current = setTimeout(() => setStreak(0), 450);
    // Note : monte tant qu'on tape vite, redescend doucement sinon (boucle la mélodie en haut)
    note.current = combo.current.length > 1 ? note.current + 1 : Math.max(0, note.current - 3);
    if (note.current >= SCALE.length) note.current = 5;
    if (!quiet) playSfx("pop", { volume: 0.32, rate: 0.85 * 2 ** (SCALE[note.current] / 12) });
    const k = Math.min(1, combo.current.length / 12);
    const el = blob.current;
    if (el && typeof el.animate === "function" && !reducedMotion()) {
      const big = 1 + k * 0.14;
      // Une seule animation à la fois : la précédente est annulée (sinon elles s'empilaient en mémoire
      // jusqu'au plantage quand on tapait à plusieurs doigts)
      squash.current?.cancel();
      squash.current = el.animate(
        [
          { transform: `scale(${big},${big})` },
          { transform: `scale(${big * 1.14},${big * 0.86})`, offset: 0.22 },
          { transform: `scale(${big * 0.95},${big * 1.06})`, offset: 0.55 },
          { transform: `scale(${big},${big})` },
        ],
        { duration: 240, easing: "ease-out" },
      );
    }
    const id = ++popId.current;
    setPops((p) => [...p.slice(liteFx ? -5 : -12), { id, x: e.clientX + (Math.random() * 40 - 20), y: e.clientY, v: fmtBig(v, lang), boom: explosive, sweat: hasPower(next.taps, "sweat") && streak >= 5 }]);
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

  const unlockedEnvs = ENVS.filter((e) => s.taps >= e.at);
  const envId: EnvId = (unlockedEnvs.find((e) => e.id === s.env) ?? unlockedEnvs[unlockedEnvs.length - 1]).id;
  const envInfo = ENVS.find((e) => e.id === envId)!;
  const chooseEnv = (id: EnvId) => { haptic("light"); playSfx("pop", { volume: 0.35 }); update({ ...sRef.current, env: id }); setEnvPick(false); };
  const takeGift = () => {
    if (gift == null) return;
    try { localStorage.setItem(GIFT_KEY, new Date().toDateString()); } catch { /* indispo */ }
    update(earn(sRef.current, gift));
    playSfx("coins", { volume: 0.55 });
    playSfx("tada", { volume: 0.4, delay: 0.1 });
    haptic("success");
    setGift(null);
  };
  const ps = perSecond(s, frenzy);
  const line = [...lines].reverse().find(([at]) => s.taps >= at)?.[1] ?? lines[0][1];
  const nextReward = REWARDS.find((r) => s.taps < r.at);
  const nextPower = POWERS.find((p) => s.taps < p.at);
  const nextEnv = ENVS.find((e) => s.taps < e.at);
  const confettiGain = partyConfetti(s);

  const share = async () => {
    haptic();
    await shareBandCard([{ name: me?.name ?? "Moi", look }], t.shareTitle(fmtBig(s.taps, lang)), line, t.shareText, [`${fmtBig(s.earnedAll, lang)} ${t.gloops}`]);
  };

  // Dessins lourds (SVG des persos) recalculés seulement quand ils changent, pas à chaque image
  const laughing = streak > 8;
  const shownLook = legendary && look.extra === "none" ? { ...look, extra: "aura" } : look;
  const lookKey = JSON.stringify(shownLook);
  const bigBlob = useMemo(
    () => <AvatarBlob look={shownLook} name={me?.name} size={170} mood={laughing ? "laughing" : "happy"} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lookKey, me?.name, laughing],
  );
  const miniCount = Math.min(8, s.lv[1]);
  const minis = useMemo(() => Array.from({ length: miniCount }, (_, i) => (
    <div key={i} className="zz-click-mini absolute" style={{ ["--a" as string]: `${i * 45}deg`, animationDelay: `${-i * 0.37}s` } as CSSProperties}>
      <AvatarBlob look={{ ...baseLook(["mint", "yellow", "sky", "coral", "lavender", "orange", "lime", "pink"][i]), eyes: "happy" }} size={30} animate={false} />
    </div>
  )), [miniCount]);

  return createPortal(
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ zIndex: 45, background: "var(--zz-bg)", paddingTop: "calc(var(--sat) + 8px)", paddingBottom: "calc(var(--sab) + 10px)" }} role="dialog" aria-label={t.title}>
      <ClickerScene env={envId} still={liteFx} />
      {frenzy && <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(255, 62, 165, 0.16)" }} aria-hidden />}
      <div className="relative z-[1] mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col">
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
          {/* Décor : pastille pour en changer (seulement s'il y en a plusieurs de débloqués) */}
          {unlockedEnvs.length > 1 && (
            <button type="button" onClick={() => { haptic("light"); setEnvPick((v) => !v); }}
              className="zz-push zz-stk-sm mx-auto mt-1.5 flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-extrabold"
              style={{ background: "#fff", color: "#15082E" }} aria-expanded={envPick}>
              <span>{envInfo.icon}</span>{envInfo.name[lang]}<span style={{ opacity: 0.6 }}>{envPick ? "▴" : "▾"}</span>
            </button>
          )}
          {envPick && (
            <div className="zz-pop mx-3 mt-2 flex flex-wrap justify-center gap-1.5">
              {ENVS.map((e) => {
                const open = s.taps >= e.at;
                const on = e.id === envId;
                return (
                  <button key={e.id} type="button" disabled={!open} onClick={() => chooseEnv(e.id)}
                    className="zz-push flex h-9 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-extrabold"
                    style={open
                      ? { background: on ? "#FFD23F" : "#fff", color: "#15082E", border: "2.5px solid #15082E" }
                      : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "2.5px solid transparent" }}>
                    <span>{open ? e.icon : "🔒"}</span>{open ? e.name[lang] : t.envAt(fmtBig(e.at, lang))}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Le blob à tapoter, ses mini-blobs, ses pouvoirs, et parfois le blob doré */}
        <div className="relative grid min-h-0 flex-1 place-items-center" style={{ touchAction: "manipulation" }}>
          {hasPower(s.taps, "fire") && streak >= 8 && (
            <div className="zz-fire" aria-hidden style={{ ["--fs" as string]: String(Math.min(1.25, 0.9 + (streak - 8) * 0.025)) } as CSSProperties}>
              {(liteFx ? FLAMES.filter((_, i) => i % 2 === 0) : FLAMES).map((f, i) => (
                <svg key={i} className="zz-flame" viewBox="0 0 100 130" width={f.w} height={f.w * 1.3}
                  style={{ left: `calc(50% + ${f.x}px)`, bottom: f.y, rotate: `${f.r}deg`, animationDelay: `${-i * 0.11}s`, animationDuration: `${0.36 + (i % 3) * 0.07}s` }}>
                  <path d={FLAME} fill="#FF6A1A" stroke="#15082E" strokeWidth={7} strokeLinejoin="round" />
                  <path d={FLAME} fill="#FFD23F" transform="translate(50 128) scale(0.6) translate(-50 -128)" />
                  <path d={FLAME} fill="#FFF7C2" transform="translate(50 128) scale(0.28) translate(-50 -128)" />
                </svg>
              ))}
            </div>
          )}
          {hasPower(s.taps, "sparks") && Array.from({ length: liteFx ? 3 : 6 }, (_, i) => (
            <span key={`sp${i}`} aria-hidden className="zz-click-spark pointer-events-none absolute text-[18px]" style={{ ["--a" as string]: `${i * (liteFx ? 120 : 60)}deg`, animationDelay: `${-i * 0.5}s` } as CSSProperties}>✦</span>
          ))}
          {hasPower(s.taps, "bolts") && streak >= 14 && (liteFx ? [2] : [0, 1, 2]).map((i) => (
            <svg key={`b${i}`} aria-hidden className="zz-bolt pointer-events-none absolute" width="46" height="90" viewBox="0 0 46 90"
              style={{ left: `${[14, 72, 44][i]}%`, top: `${[12, 18, 2][i]}%`, animationDelay: `${i * 0.17}s`, rotate: `${[-14, 12, 4][i]}deg` }}>
              <path d="M28 0 L4 50 L20 50 L12 90 L42 34 L25 34 L36 0Z" fill="#FFF36B" stroke="#15082E" strokeWidth="3" strokeLinejoin="round" />
            </svg>
          ))}
          {streak >= 5 && (
            <div className="zz-combo pointer-events-none absolute left-1/2 top-[6%] z-[3] -translate-x-1/2 whitespace-nowrap" key={Math.floor(streak / 5)}
              style={{ color: streak >= 14 ? "#FFF36B" : streak >= 8 ? "#FF8A1F" : "#fff", fontSize: Math.min(34, 20 + streak * 0.5) }}>
              {pw.combo(streak)}{streak >= 8 && hasPower(s.taps, "fire") ? " 🔥" : ""}
            </div>
          )}
          {minis}
          <div ref={blob} onPointerDown={tap} role="button" aria-label={t.title}
            className="relative z-[2] select-none"
            style={{ WebkitTapHighlightColor: "transparent", WebkitUserSelect: "none", cursor: "pointer", willChange: "transform" }}>
            {hasPower(s.taps, "crown") && (
              <div className="zz-crownfire pointer-events-none absolute left-1/2 top-[-22px] z-[3] -translate-x-1/2" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} className="zz-flame" viewBox="0 0 100 130" width={[20, 26, 32, 26, 20][i]} height={[26, 34, 42, 34, 26][i]}
                    style={{ left: `${10 + i * 22}px`, bottom: 0, animationDelay: `${-i * 0.11}s` }}>
                    <path d={FLAME} fill="#FF6A1A" stroke="#15082E" strokeWidth={9} strokeLinejoin="round" />
                    <path d={FLAME} fill="#FFD23F" transform="translate(50 128) scale(0.55) translate(-50 -128)" />
                  </svg>
                ))}
              </div>
            )}
            {legendary && <div className="zz-click-glow pointer-events-none absolute inset-[-18%] -z-[1] rounded-full" aria-hidden />}
            {bigBlob}
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
            const cs = CARD_STYLE[i];
            return (
              <button key={d.id} type="button" onClick={() => buyLevel(i)} disabled={!open}
                className="zz-push zz-stk-sm relative flex min-h-[100px] flex-col items-center justify-center rounded-[18px] px-1 py-1.5 text-center"
                style={!open
                  ? { background: "#2B1F52", color: "rgba(255,255,255,0.6)" }
                  // Pas assez de gloops : même couleur, assombrie (pleine : le décor ne transparaît jamais)
                  : { background: can ? cs.bg : `linear-gradient(rgba(21,8,46,0.38), rgba(21,8,46,0.38)), ${cs.bg}`, color: "#15082E", transition: "background 200ms" }}>
                {open && s.lv[i] > 0 && (
                  <span className="absolute -right-1.5 -top-2 rounded-full px-1.5 text-[11px] font-extrabold" style={{ background: "#FFD23F", color: "#15082E", border: "2px solid #15082E" }}>{t.lvl(s.lv[i])}</span>
                )}
                {open ? <CardIcon kind={cs.icon} /> : <Lock size={20} strokeWidth={2.8} />}
                <span className="mt-1 text-[12.5px] font-extrabold leading-tight">{open ? d.name[lang] : t.locked}</span>
                {open ? (
                  <>
                    <span className="text-[11px] font-bold" style={{ opacity: 0.8 }}>{i === 0 ? t.plusTap(fmtBig(gain, lang)) : t.prod(fmtBig(gain, lang))}{toDouble <= 3 ? ` · ×2 ${t.soon(toDouble)}` : ""}</span>
                    <span className="mt-1 rounded-full px-2 text-[12.5px] font-extrabold" style={{ background: "#fff", color: "#15082E", border: "2px solid #15082E" }}>{fmtBig(cost, lang)}</span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold">{t.unlockAt(fmtBig(LEVELS[i].base * 0.5, lang))}</span>
                )}
              </button>
            );
          })}
          {/* 6e carte : la Grande fête (recommencer contre des confettis) */}
          <button type="button" onClick={party} disabled={confettiGain <= 0}
            className="zz-push zz-stk-sm flex min-h-[100px] flex-col items-center justify-center rounded-[18px] px-1 py-1.5 text-center"
            style={confettiGain > 0 ? { background: "#FFD23F", color: "#15082E" } : { background: "#2B1F52", color: "rgba(255,255,255,0.6)" }}>
            {confettiGain > 0
              ? <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "#fff", border: "2.5px solid #15082E", boxShadow: "0 2px 0 #15082E" }}><PartyPopper size={19} strokeWidth={2.8} color="#15082E" /></span>
              : <PartyPopper size={20} strokeWidth={2.8} />}
            <span className="mt-1 text-[12.5px] font-extrabold leading-tight">{t.partyShort}</span>
            <span className="text-[11px] font-bold leading-tight">{confettiGain > 0 ? t.partyGain(confettiGain) : t.partyAt(fmtBig(PARTY_MIN, lang))}</span>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-4">
          <p className="min-w-0 flex-1 text-[12px] font-semibold leading-tight" style={{ color: "var(--zz-mute)" }}>
            {(() => {
              // La prochaine nouveauté, quelle qu'elle soit : décor, pouvoir ou récompense pour les persos
              const opts = [
                nextEnv && { at: nextEnv.at, label: `${nextEnv.icon} ${nextEnv.name[lang]}` },
                nextPower && { at: nextPower.at, label: `${nextPower.icon} ${pw.name[nextPower.id]}` },
                nextReward && { at: nextReward.at, label: t.reward[nextReward.kind] },
              ].filter(Boolean) as { at: number; label: string }[];
              const n = opts.sort((a, b) => a.at - b.at)[0];
              return n ? t.next(fmtBig(n.at, lang), n.label) : t.allDone;
            })()}
          </p>
          <button type="button" onClick={() => void share()} className="zz-push zz-stk-sm flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-extrabold" style={{ background: "#FF3EA5", color: "#fff" }}>
            <Share2 size={15} strokeWidth={2.8} /> {t.share}
          </button>
        </div>
      </div>

      {/* Nouveau décor : annonce plein écran */}
      {envCelebrate && (
        <div className="pointer-events-none fixed inset-0 grid place-items-center" style={{ zIndex: 48, background: "rgba(10,2,30,0.5)" }} aria-live="polite">
          <div className="zz-power text-center">
            <div className="zz-stk-sm mx-auto inline-block rounded-full px-4 py-1 text-[15px] font-extrabold" style={{ background: "#3DDC97", color: "#15082E", rotate: "-3deg" }}>{t.envNew}</div>
            <div className="mt-2 text-[86px] leading-none">{ENVS.find((e) => e.id === envCelebrate)?.icon}</div>
            <div className="zz-title mt-1 text-[38px] leading-tight text-white">{ENVS.find((e) => e.id === envCelebrate)?.name[lang]}</div>
            <div className="mx-8 mt-1 text-[16px] font-bold" style={{ color: "#FFD23F" }}>{t.envDesc}</div>
          </div>
        </div>
      )}

      {/* Cadeau du jour */}
      {gift != null && (
        <div className="fixed inset-0 grid place-items-center px-8" style={{ zIndex: 49, background: "rgba(10,2,30,0.6)" }}>
          <div className="zz-pop zz-stk w-full max-w-[300px] rounded-[28px] px-5 pb-5 pt-4 text-center" style={{ background: "#fff", color: "#15082E", rotate: "-1.5deg" }}>
            <div className="mx-auto -mt-14 w-fit"><ZBlob size={96} color="pink" mood="love" seed={6} shadow={false} outline hop={false} /></div>
            <div className="zz-title mt-1 text-[26px]">🎁 {t.giftTitle}</div>
            <div className="zz-title mt-1 text-[36px]" style={{ color: "#FF3EA5" }}>+{fmtBig(gift, lang)}</div>
            <div className="text-[13px] font-bold" style={{ opacity: 0.6 }}>{t.gloops}</div>
            <p className="mt-2 text-[13.5px] font-semibold leading-snug" style={{ opacity: 0.75 }}>{t.giftSub}</p>
            <button type="button" onClick={takeGift} className="zz-push zz-stk-sm mt-3 h-12 w-full rounded-full text-[17px] font-extrabold" style={{ background: "#FFD23F", color: "#15082E" }}>
              {t.giftBtn}
            </button>
          </div>
        </div>
      )}

      {/* Nouveau pouvoir : annonce plein écran */}
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 grid place-items-center" style={{ zIndex: 48, background: "rgba(10,2,30,0.55)" }} aria-live="polite">
          <div className="zz-power text-center">
            <div className="zz-stk-sm mx-auto inline-block rounded-full px-4 py-1 text-[15px] font-extrabold" style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-3deg" }}>{pw.title}</div>
            <div className="mt-2 text-[86px] leading-none">{POWERS.find((p) => p.id === celebrate)?.icon}</div>
            <div className="zz-title mt-1 text-[38px] leading-tight text-white">{pw.name[celebrate]}</div>
            <div className="mx-8 mt-1 text-[16px] font-bold" style={{ color: "#FFD23F" }}>{pw.desc[celebrate]}</div>
            {Array.from({ length: liteFx ? 7 : 14 }, (_, i) => (
              <i key={i} className="zz-click-bit zz-power-bit" style={{ ["--a" as string]: `${i * (liteFx ? 52 : 26)}deg`, background: ["#FF3EA5", "#3DDC97", "#52C7FF", "#FFD23F", "#A98BFF", "#FF8A1F"][i % 6] } as CSSProperties} />
            ))}
          </div>
        </div>
      )}

      {/* Gouttes de sueur (pouvoir « La sueur ») */}
      {pops.filter((p) => p.sweat).map((p) => (
        <span key={`d${p.id}`} className="zz-sweat pointer-events-none fixed text-[20px]" style={{ left: p.x, top: p.y - 60, zIndex: 46, ["--dx" as string]: `${p.id % 2 ? 60 : -60}px` } as CSSProperties}>💦</span>
      ))}

      {/* « +N » qui s'envolent (et confettis à partir de 1 000 taps) */}
      {pops.map((p) => (
        <span key={p.id} className="zz-click-pop zz-title pointer-events-none fixed text-[26px]" style={{ left: p.x, top: p.y - 30, color: "#fff", zIndex: 46 }}>
          +{p.v}
          {p.boom && Array.from({ length: liteFx ? 3 : 6 }, (_, i) => (
            <i key={i} className="zz-click-bit" style={{ ["--a" as string]: `${i * (liteFx ? 120 : 60) + 15}deg`, background: ["#FF3EA5", "#3DDC97", "#52C7FF", "#FFD23F", "#A98BFF", "#FF8A1F"][i] } as CSSProperties} />
          ))}
        </span>
      ))}
      {toastNode}
    </div>,
    document.body,
  );
}
