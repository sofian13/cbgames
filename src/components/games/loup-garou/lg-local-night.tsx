"use client";

/**
 * Loup-Garou local : déroulé d'une nuit. Le téléphone posé au centre appelle
 * chaque rôle à voix haute ; le rôle appelé prend le tél et agit.
 * Un rôle mort (ou sans action possible) est appelé quand même, avec une durée
 * comparable, pour ne rien trahir.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Mascot } from "@/components/Mascot";
import {
  EMPTY_NIGHT, ROLES, type Composition, type NightActions, type Player, type RoleId,
} from "./lg-local-data";
import { speak, speechMs, type Ambience } from "./lg-local-audio";
import { BigButton, Confirm, PickList, RoleCard, Screen, SkyBadge } from "./lg-local-ui";

type StepId = "intro" | "cupidon" | "amoureux" | "gardien" | "loups" | "voyante" | "sorciere";

const TEXT: Record<StepId, { title: string; wake: string; sleep: string }> = {
  intro: {
    title: "La nuit tombe",
    wake: "La nuit tombe sur le village. Tout le monde ferme les yeux… et baisse la tête.",
    sleep: "",
  },
  cupidon: {
    title: "Cupidon",
    wake: "Cupidon, réveille-toi. Prends le téléphone et choisis les deux joueurs qui vont tomber amoureux.",
    sleep: "Cupidon repose le téléphone, touche discrètement l'épaule des deux amoureux, puis se rendort.",
  },
  amoureux: {
    title: "Les amoureux",
    wake: "Les deux amoureux, ouvrez les yeux et regardez-vous. Désormais, si l'un meurt, l'autre le suit.",
    sleep: "Les amoureux referment les yeux.",
  },
  gardien: {
    title: "Le Gardien",
    wake: "Le Gardien se réveille. Prends le téléphone et choisis qui tu protèges cette nuit.",
    sleep: "Le Gardien se rendort.",
  },
  loups: {
    title: "Les Loups-garous",
    wake: "Les loups-garous ouvrent les yeux. Prenez le téléphone et choisissez ensemble votre victime.",
    sleep: "Les loups-garous, repus, referment les yeux.",
  },
  voyante: {
    title: "La Voyante",
    wake: "La Voyante se réveille. Prends le téléphone et choisis un joueur : sa vraie nature te sera révélée.",
    sleep: "La Voyante se rendort.",
  },
  sorciere: {
    title: "La Sorcière",
    wake: "La Sorcière se réveille. Prends le téléphone : il va te montrer la victime de la nuit.",
    sleep: "La Sorcière range ses potions et se rendort.",
  },
};

const STEP_ROLE: Partial<Record<StepId, RoleId>> = {
  cupidon: "cupidon", gardien: "gardien", loups: "loup", voyante: "voyante", sorciere: "sorciere",
};

/** Accélère les temps (tests automatisés uniquement) */
function speed(): number {
  const s = (globalThis as { __LG_SPEED__?: number }).__LG_SPEED__;
  return typeof s === "number" && s > 0 ? s : 1;
}
// Durées en ms (× speed)
const MIN_ACTIVE = 12000; // durée minimale d'un tour actif, de l'appel au « se rendort »
const AFTER_ACTION = 2500; // le temps de reposer le tél
const FAKE_MIN = 9000; // tour « fantôme » (rôle mort) : durée aléatoire en plus de la phrase
const FAKE_SPREAD = 5000;

export interface NightResult {
  actions: NightActions;
  log: string[];
}

export function NightRunner({
  night, players, comp, potions, lastProtected, voice, ambience, onDone,
}: {
  night: number;
  players: Player[];
  comp: Composition;
  potions: { life: boolean; death: boolean };
  lastProtected: number | null;
  voice: boolean;
  ambience: Ambience;
  onDone: (r: NightResult) => void;
}) {
  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = ["intro"];
    if (night === 1 && comp.cupidon) s.push("cupidon", "amoureux");
    if (comp.gardien) s.push("gardien");
    s.push("loups");
    if (comp.voyante) s.push("voyante");
    if (comp.sorciere) s.push("sorciere");
    return s;
  }, [night, comp]);

  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState<"wake" | "sleeping" | "closing">("wake");
  const actions = useRef<NightActions>({ ...EMPTY_NIGHT });
  const log = useRef<string[]>([]);
  const startAt = useRef(0);
  const doneRef = useRef(onDone);
  useLayoutEffect(() => { doneRef.current = onDone; }, [onDone]);
  // cible des loups, aussi en state : la Sorcière l'affiche
  const [wolfTarget, setWolfTarget] = useState<number | null>(null);

  const step = steps[idx];
  const role = STEP_ROLE[step];
  const actor = role ? players.find((p) => p.alive && p.role === role) ?? null : null;
  const active = !!actor;
  const name = (id: number) => players[id]?.name ?? "?";

  // Appel du rôle
  useEffect(() => {
    if (sub !== "wake") return;
    startAt.current = Date.now();
    const txt = TEXT[step].wake;
    speak(txt, voice);
    if (step === "loups") ambience.howl();
    let t: ReturnType<typeof setTimeout> | null = null;
    if (step === "intro") t = setTimeout(() => setSub("closing"), (speechMs(txt) + 2500) * speed());
    else if (step === "amoureux") t = setTimeout(() => setSub("closing"), (speechMs(txt) + 7000) * speed());
    else if (!active) t = setTimeout(() => setSub("closing"), (speechMs(txt) + FAKE_MIN + Math.random() * FAKE_SPREAD) * speed());
    return () => { if (t) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, sub]);

  // Action faite : on laisse le temps de reposer le tél, et on garde une durée minimale
  useEffect(() => {
    if (sub !== "sleeping") return;
    const elapsed = Date.now() - startAt.current;
    const wait = Math.max(AFTER_ACTION * speed(), MIN_ACTIVE * speed() - elapsed);
    const t = setTimeout(() => setSub("closing"), wait);
    return () => clearTimeout(t);
  }, [sub]);

  // Le rôle se rendort, puis étape suivante
  useEffect(() => {
    if (sub !== "closing") return;
    const txt = TEXT[step].sleep;
    speak(txt, voice);
    const t = setTimeout(() => {
      if (idx + 1 < steps.length) {
        setIdx(idx + 1);
        setSub("wake");
      } else {
        doneRef.current({ actions: { ...actions.current }, log: [...log.current] });
      }
    }, (txt ? speechMs(txt) + 1200 : 400) * speed());
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub, idx]);

  const finish = () => setSub("sleeping");

  let body: React.ReactNode = null;
  if (sub === "wake" && active && actor) {
    const alive = players.filter((p) => p.alive);
    if (step === "cupidon") {
      body = <CupidonPanel players={alive} onDone={(a, b) => {
        actions.current.lovers = [a, b];
        log.current.push(`💘 Cupidon unit ${name(a)} et ${name(b)}.`);
        finish();
      }} />;
    } else if (step === "gardien") {
      body = <SinglePick
        players={alive}
        hint="Qui protèges-tu des loups cette nuit ?"
        cta="Protéger"
        note={(p) => (p.id === lastProtected ? "protégé hier" : null)}
        onDone={(id) => {
          actions.current.protect = id;
          log.current.push(`🛡️ Le Gardien (${actor.name}) protège ${name(id)}.`);
          finish();
        }}
      />;
    } else if (step === "loups") {
      const pack = alive.filter((p) => p.role === "loup");
      body = <SinglePick
        players={alive.filter((p) => p.role !== "loup")}
        hint={`La meute : ${pack.map((p) => p.name).join(", ")}. Mettez-vous d'accord en silence.`}
        cta="Dévorer"
        danger
        onDone={(id) => {
          actions.current.wolfTarget = id;
          setWolfTarget(id);
          log.current.push(`🐺 Les loups attaquent ${name(id)}.`);
          finish();
        }}
      />;
    } else if (step === "voyante") {
      body = <SeerPanel players={alive.filter((p) => p.id !== actor.id)} onDone={(id) => {
        actions.current.seer = id;
        log.current.push(`🔮 La Voyante (${actor.name}) sonde ${name(id)} : ${ROLES[players[id].role].name}.`);
        finish();
      }} />;
    } else if (step === "sorciere") {
      const victim = wolfTarget;
      body = <WitchPanel
        players={alive}
        selfId={actor.id}
        victim={victim}
        potions={potions}
        onDone={(saved, poison) => {
          actions.current.saved = saved;
          actions.current.poison = poison;
          if (saved && victim !== null) log.current.push(`🧪 La Sorcière (${actor.name}) sauve ${name(victim)}.`);
          if (poison !== null) log.current.push(`☠️ La Sorcière (${actor.name}) empoisonne ${name(poison)}.`);
          if (!saved && poison === null) log.current.push(`🧪 La Sorcière (${actor.name}) ne fait rien.`);
          finish();
        }}
      />;
    }
  }

  const headline = sub === "closing" && TEXT[step].sleep ? TEXT[step].sleep : TEXT[step].wake;

  return (
    <Screen tone="night" center={!body}>
      {body ? (
        <>
          <p className="af-eyebrow text-center" style={{ color: "rgba(255,255,255,0.5)" }}>Nuit {night}</p>
          <h1 className="mt-1 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 34, lineHeight: 1.02 }}>
            {TEXT[step].title}
          </h1>
          <div className="mt-4 flex flex-1 flex-col">{body}</div>
        </>
      ) : sub === "sleeping" ? (
        <div className="text-center">
          <div className="flex justify-center"><Mascot size={110} color="lavender" mood="asleep" /></div>
          <p className="mt-6" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, lineHeight: 1.1 }}>
            Repose le téléphone au centre et ferme les yeux.
          </p>
        </div>
      ) : (
        <div className="text-center">
          <SkyBadge tone="night" />
          <p className="af-eyebrow mt-6" style={{ color: "rgba(255,255,255,0.45)" }}>Nuit {night} · {TEXT[step].title}</p>
          <p className="mt-3" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, lineHeight: 1.12, color: "rgba(255,255,255,0.92)" }}>
            {headline}
          </p>
          <p className="mt-8 text-[15px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Les autres gardent les yeux fermés 🤫
          </p>
        </div>
      )}
    </Screen>
  );
}

// ── Panneaux d'action ─────────────────────────────────────

function SinglePick({
  players, hint, cta, onDone, note, danger = false,
}: {
  players: Player[]; hint: string; cta: string; onDone: (id: number) => void;
  note?: (p: Player) => string | null; danger?: boolean;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const target = players.find((p) => p.id === sel);
  return (
    <>
      <p className="mb-3 text-center text-[17px]" style={{ color: "rgba(255,255,255,0.75)" }}>{hint}</p>
      <PickList players={players} selected={sel === null ? [] : [sel]} onPick={setSel} note={note} />
      <div className="sticky bottom-0 mt-4 pb-1 pt-2">
        <BigButton onClick={() => sel !== null && onDone(sel)} disabled={sel === null} variant={danger ? "danger" : "primary"}>
          {target ? `${cta} ${target.name}` : "Choisis un joueur"}
        </BigButton>
      </div>
    </>
  );
}

function CupidonPanel({ players, onDone }: { players: Player[]; onDone: (a: number, b: number) => void }) {
  const [sel, setSel] = useState<number[]>([]);
  const toggle = (id: number) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : [s[1], id]));
  return (
    <>
      <p className="mb-3 text-center text-[17px]" style={{ color: "rgba(255,255,255,0.75)" }}>
        Choisis deux joueurs (tu peux te choisir toi-même).
      </p>
      <PickList players={players} selected={sel} onPick={toggle} />
      <div className="sticky bottom-0 mt-4 pb-1 pt-2">
        <BigButton variant="pink" disabled={sel.length !== 2} onClick={() => onDone(sel[0], sel[1])}>
          {sel.length === 2 ? "Unir ces deux-là 💘" : `Encore ${2 - sel.length} à choisir`}
        </BigButton>
      </div>
    </>
  );
}

function SeerPanel({ players, onDone }: { players: Player[]; onDone: (id: number) => void }) {
  const [seen, setSeen] = useState<Player | null>(null);
  if (seen) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <p className="text-center text-[20px]"><b>{seen.name}</b> est…</p>
        <RoleCard role={seen.role} compact />
        <BigButton onClick={() => onDone(seen.id)}>J&apos;ai vu — cacher</BigButton>
      </div>
    );
  }
  return (
    <SinglePick
      players={players}
      hint="Qui veux-tu démasquer ?"
      cta="Voir le rôle de"
      onDone={(id) => setSeen(players.find((p) => p.id === id) ?? null)}
    />
  );
}

function WitchPanel({
  players, selfId, victim, potions, onDone,
}: {
  players: Player[];
  selfId: number;
  victim: number | null;
  potions: { life: boolean; death: boolean };
  onDone: (saved: boolean, poison: number | null) => void;
}) {
  const [stage, setStage] = useState<"save" | "poison" | "pick">(potions.life && victim !== null ? "save" : "poison");
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [poisonSel, setPoisonSel] = useState<number | null>(null);
  const [confirmPoison, setConfirmPoison] = useState(false);
  const victimName = players.find((p) => p.id === victim)?.name;

  const goPoison = (s: boolean) => {
    setSaved(s);
    if (potions.death) setStage("poison");
    else onDone(s, null);
  };

  const victimBox = (
    <div className="mb-4 rounded-3xl border p-4 text-center" style={{ borderColor: "rgba(255,77,94,0.45)", background: "rgba(255,77,94,0.1)" }}>
      <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.7)" }}>Les loups ont attaqué</p>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32 }}>{victimName ?? "personne"}</p>
      {saved && <p className="mt-1 text-[15px] font-bold" style={{ color: "#3DDC97" }}>Sauvé·e par ta potion ✨</p>}
    </div>
  );

  const flasks = (
    <p className="mb-3 text-center text-[15px]" style={{ color: "rgba(255,255,255,0.6)" }}>
      Potion de vie : {potions.life && !saved ? "✅" : "❌"} · Potion de mort : {potions.death ? "✅" : "❌"}
    </p>
  );

  if (!potions.life && !potions.death) {
    return (
      <div className="flex flex-1 flex-col">
        {victimBox}
        <p className="mb-6 text-center text-[18px]">Tes fioles sont vides. Tu ne peux plus rien faire.</p>
        <BigButton onClick={() => onDone(false, null)}>OK</BigButton>
      </div>
    );
  }

  if (stage === "save") {
    return (
      <div className="flex flex-1 flex-col">
        {victimBox}
        {flasks}
        <div className="grid gap-2">
          <BigButton variant="pink" onClick={() => setConfirmSave(true)}>💚 Sauver {victimName}</BigButton>
          <BigButton variant="ghost" onClick={() => goPoison(false)}>Ne pas sauver</BigButton>
        </div>
        {confirmSave && (
          <Confirm
            text={`Utiliser ta potion de vie pour sauver ${victimName} ? Tu ne pourras plus jamais le faire.`}
            yes="Oui, sauver"
            onYes={() => { setConfirmSave(false); goPoison(true); }}
            onNo={() => setConfirmSave(false)}
          />
        )}
      </div>
    );
  }

  if (stage === "poison") {
    return (
      <div className="flex flex-1 flex-col">
        {victimBox}
        {flasks}
        <p className="mb-4 text-center text-[18px]">Veux-tu utiliser ta potion de mort ?</p>
        <div className="grid gap-2">
          <BigButton variant="danger" onClick={() => setStage("pick")}>☠️ Empoisonner quelqu&apos;un</BigButton>
          <BigButton variant="ghost" onClick={() => onDone(saved, null)}>Non, rien de plus</BigButton>
        </div>
      </div>
    );
  }

  const target = players.find((p) => p.id === poisonSel);
  return (
    <>
      <p className="mb-3 text-center text-[17px]" style={{ color: "rgba(255,255,255,0.75)" }}>Qui empoisonnes-tu ?</p>
      <PickList players={players.filter((p) => p.id !== selfId)} selected={poisonSel === null ? [] : [poisonSel]} onPick={setPoisonSel} />
      <div className="sticky bottom-0 mt-4 grid gap-2 pb-1 pt-2">
        <BigButton variant="danger" disabled={!target} onClick={() => setConfirmPoison(true)}>
          {target ? `Empoisonner ${target.name}` : "Choisis un joueur"}
        </BigButton>
        <BigButton variant="ghost" onClick={() => { setPoisonSel(null); setStage("poison"); }}>Retour</BigButton>
      </div>
      {target && confirmPoison && (
        <Confirm
          text={`Empoisonner ${target.name} ? Ta potion de mort sera utilisée pour de bon.`}
          yes="Oui, empoisonner"
          danger
          onYes={() => onDone(saved, target.id)}
          onNo={() => setConfirmPoison(false)}
        />
      )}
    </>
  );
}
