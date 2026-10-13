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
  EMPTY_NIGHT, type Composition, type NightActions, type Player, type RoleId,
} from "./lg-local-data";
import { speak, speechMs, type Ambience } from "./lg-local-audio";
import { BigButton, Confirm, DISPLAY, INK, MINT, PickList, RoleCard, Screen, SkyBadge, Tag, Title, stk } from "./lg-local-ui";
import { Check, HeartPulse, Skull, X } from "lucide-react";
import { GameInlineIcon } from "@/components/games/game-icon-button";
import { useT } from "@/lib/i18n";
import { NIGHT_TEXT, ROLE_TEXT, STR, type StepId } from "./lg-local-i18n";

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
  const t = useT(STR);
  const TEXT = useT(NIGHT_TEXT);
  const roleText = useT(ROLE_TEXT);
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
        log.current.push(t.logCupid(name(a), name(b)));
        finish();
      }} />;
    } else if (step === "gardien") {
      body = <SinglePick
        players={alive}
        hint={t.guardHint}
        cta={t.guardCta}
        note={(p) => (p.id === lastProtected ? t.protectedYesterday : null)}
        onDone={(id) => {
          actions.current.protect = id;
          log.current.push(t.logGuard(actor.name, name(id)));
          finish();
        }}
      />;
    } else if (step === "loups") {
      const pack = alive.filter((p) => p.role === "loup");
      body = <SinglePick
        players={alive.filter((p) => p.role !== "loup")}
        hint={<>{t.packHint(pack.map((p) => p.name).join(", "))} <span className="whitespace-nowrap">{t.packAgree[0]}</span>{t.packAgree[1]}</>}
        cta={t.devour}
        danger
        onDone={(id) => {
          actions.current.wolfTarget = id;
          setWolfTarget(id);
          log.current.push(t.logWolves(name(id)));
          finish();
        }}
      />;
    } else if (step === "voyante") {
      body = <SeerPanel players={alive.filter((p) => p.id !== actor.id)} onDone={(id) => {
        actions.current.seer = id;
        log.current.push(t.logSeer(actor.name, name(id), roleText[players[id].role].name));
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
          if (saved && victim !== null) log.current.push(t.logWitchSave(actor.name, name(victim)));
          if (poison !== null) log.current.push(t.logWitchPoison(actor.name, name(poison)));
          if (!saved && poison === null) log.current.push(t.logWitchNothing(actor.name));
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
          <div className="text-center"><Tag bg="#2A1866" color="#fff" tilt={-2}>{t.nightN(night)}</Tag></div>
          <Title size={38} className="mt-2 text-center">{TEXT[step].title}</Title>
          <div className="mt-4 flex flex-1 flex-col">{body}</div>
        </>
      ) : sub === "sleeping" ? (
        <div className="text-center">
          <div className="flex justify-center"><Mascot size={110} color="lavender" mood="asleep" shadow={false} /></div>
          <Title size={32} className="mt-6" style={{ lineHeight: 1.05 }}>
            {t.restPhone}
          </Title>
        </div>
      ) : (
        <div className="text-center">
          <SkyBadge tone="night" />
          <div className="mt-6"><Tag bg="#2A1866" color="#fff" tilt={-2}>{t.nightN(night)} · {TEXT[step].title}</Tag></div>
          <p className="mt-4" style={{ ...DISPLAY, fontSize: 30, lineHeight: 1.1 }}>
            {headline.replace(/ ([!?:;])/g, "\u00A0$1")}
          </p>
          <p className="mt-8 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.62)" }}>
            {t.othersClosed}
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
  players: Player[]; hint: React.ReactNode; cta: (name: string) => string; onDone: (id: number) => void;
  note?: (p: Player) => string | null; danger?: boolean;
}) {
  const t = useT(STR);
  const [sel, setSel] = useState<number | null>(null);
  const target = players.find((p) => p.id === sel);
  return (
    <>
      <p className="mb-4 text-center text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{hint}</p>
      <PickList players={players} selected={sel === null ? [] : [sel]} onPick={setSel} note={note} />
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] mt-4 pb-1 pt-2">
        <BigButton onClick={() => sel !== null && onDone(sel)} disabled={sel === null} variant={danger ? "danger" : "primary"}>
          {target ? cta(target.name) : t.pickPlayer}
        </BigButton>
      </div>
    </>
  );
}

function CupidonPanel({ players, onDone }: { players: Player[]; onDone: (a: number, b: number) => void }) {
  const t = useT(STR);
  const [sel, setSel] = useState<number[]>([]);
  const toggle = (id: number) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : [s[1], id]));
  return (
    <>
      <p className="mb-4 text-center text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
        {t.cupidHint}
      </p>
      <PickList players={players} selected={sel} onPick={toggle} />
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] mt-4 pb-1 pt-2">
        <BigButton variant="pink" disabled={sel.length !== 2} onClick={() => onDone(sel[0], sel[1])}>
          {sel.length === 2 ? t.unite : t.moreToPick(2 - sel.length)}
        </BigButton>
      </div>
    </>
  );
}

function SeerPanel({ players, onDone }: { players: Player[]; onDone: (id: number) => void }) {
  const t = useT(STR);
  const [seen, setSeen] = useState<Player | null>(null);
  if (seen) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <Title size={30} className="text-center">{t.seerIs(seen.name)}</Title>
        <RoleCard role={seen.role} compact />
        <BigButton onClick={() => onDone(seen.id)}>{t.seerDone}</BigButton>
      </div>
    );
  }
  return (
    <SinglePick
      players={players}
      hint={t.seerHint}
      cta={t.seerCta}
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
  const t = useT(STR);
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
    <div className="mb-4 rounded-[24px] p-4 text-center" style={{ ...stk(saved ? MINT : "#FF6B5B", 5, 3), color: INK, transform: "rotate(-1.5deg)" }}>
      <p className="text-[16px] font-bold">{t.wolvesAttacked}</p>
      <p style={{ ...DISPLAY, fontSize: 36, lineHeight: 1 }}>{victimName ?? t.nobody}</p>
      {saved && <p className="mt-1 text-[16px] font-bold">{t.savedByPotion}</p>}
    </div>
  );

  const flasks = (
    <div className="mb-4 flex flex-wrap justify-center gap-2">
      <Tag bg={potions.life && !saved ? MINT : "#3A2C6B"} color={potions.life && !saved ? INK : "#fff"} tilt={-2}>{t.lifePotion} <Flask on={potions.life && !saved} /></Tag>
      <Tag bg={potions.death ? "#FF6B5B" : "#3A2C6B"} color={potions.death ? INK : "#fff"} tilt={2}>{t.deathPotion} <Flask on={potions.death} /></Tag>
    </div>
  );

  if (!potions.life && !potions.death) {
    return (
      <div className="flex flex-1 flex-col">
        {victimBox}
        <p className="mb-6 text-center text-[18px] font-semibold">{t.flasksEmpty}</p>
        <BigButton onClick={() => onDone(false, null)}>{t.ok}</BigButton>
      </div>
    );
  }

  if (stage === "save") {
    return (
      <div className="flex flex-1 flex-col">
        {victimBox}
        {flasks}
        <div className="grid gap-3">
          <BigButton variant="pink" onClick={() => setConfirmSave(true)}><GameInlineIcon icon={HeartPulse} /> {t.save(victimName ?? "")}</BigButton>
          <BigButton variant="ghost" onClick={() => goPoison(false)}>{t.dontSave}</BigButton>
        </div>
        {confirmSave && (
          <Confirm
            text={t.confirmSave(victimName ?? "")}
            yes={t.yesSave}
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
        <p className="mb-4 text-center text-[18px] font-semibold">{t.usePoison}</p>
        <div className="grid gap-3">
          <BigButton variant="danger" onClick={() => setStage("pick")}><GameInlineIcon icon={Skull} /> {t.poisonSomeone}</BigButton>
          <BigButton variant="ghost" onClick={() => onDone(saved, null)}>{t.nothingMore}</BigButton>
        </div>
      </div>
    );
  }

  const target = players.find((p) => p.id === poisonSel);
  return (
    <>
      <p className="mb-4 text-center text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.whoPoison}</p>
      <PickList players={players.filter((p) => p.id !== selfId)} selected={poisonSel === null ? [] : [poisonSel]} onPick={setPoisonSel} />
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] mt-4 grid gap-3 pb-1 pt-2">
        <BigButton variant="danger" disabled={!target} onClick={() => setConfirmPoison(true)}>
          {target ? t.poison(target.name) : t.pickPlayer}
        </BigButton>
        <BigButton variant="ghost" onClick={() => { setPoisonSel(null); setStage("poison"); }}>{t.back}</BigButton>
      </div>
      {target && confirmPoison && (
        <Confirm
          text={t.confirmPoison(target.name)}
          yes={t.yesPoison}
          danger
          onYes={() => onDone(saved, target.id)}
          onNo={() => setConfirmPoison(false)}
        />
      )}
    </>
  );
}

/** Fiole encore pleine (coche verte) ou déjà utilisée (croix rouge). */
function Flask({ on }: { on: boolean }) {
  return <GameInlineIcon icon={on ? Check : X} style={{ marginLeft: 4 }} />;
}
