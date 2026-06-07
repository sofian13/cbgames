"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import {
  FRESH_PROGRESS, HINTS, HINTS2, ROLES, ROOMS2, fmtTime,
  type EduActions, type EduProgress, type RoleId, type SceneState,
} from "./data";
import { DObjectView, DModal, dBtn, dFlavor } from "./objects";
import { AtelierScene, BiblioScene, CaveScene, ObservatoireScene } from "./rooms";

/* ──────────────────────────────────────────────────────────────
   ESCAPE DUO — coop 2 joueurs online. Le serveur attribue les roles
   et synchronise progression + niveau. Chaque client joue SA piece.
   ────────────────────────────────────────────────────────────── */

interface EduState {
  started: boolean;
  level: 1 | 2;
  startEpoch: number | null;
  finishElapsed: number | null;
  roles: { atelier: { id: string; name: string } | null; biblio: { id: string; name: string } | null };
  progress: Record<RoleId, EduProgress>;
  bothEscaped: boolean;
  finished: boolean;
}

const wrap: CSSProperties = {
  position: "fixed", inset: 0, zIndex: 140, overflowY: "auto", color: "#fff",
  fontFamily: "var(--font-sans, system-ui, sans-serif)",
  background: "radial-gradient(120% 80% at 20% 0%, rgba(91,54,214,0.4) 0%, transparent 55%), radial-gradient(100% 70% at 100% 100%, rgba(201,162,75,0.2) 0%, transparent 60%), linear-gradient(180deg,#140d22 0%,#0d0818 100%)",
};
const topBtn = (on: boolean): CSSProperties => ({ width: 40, height: 40, borderRadius: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? "rgba(201,162,75,0.3)" : "rgba(0,0,0,0.35)", border: `1px solid ${on ? "#C9A24B" : "rgba(255,255,255,0.12)"}`, color: "#fff", fontSize: 16 });

function Confetti() {
  const pal = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4", "#C9A24B"];
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {Array.from({ length: 34 }).map((_, i) => (<span key={i} className="edu-confetti" style={{ left: `${(i * 53) % 100}%`, ["--cx" as string]: `${((i % 5) - 2) * 24}px`, background: pal[i % pal.length], animationDelay: `${(i % 6) * 0.12}s`, animationDuration: `${1.8 + (i % 4) * 0.35}s` } as CSSProperties} />))}
  </div>;
}

export default function EscapeDuoGame({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const router = useRouter();
  const { sendAction } = useGame(roomCode, "escape-duo", playerId, playerName);
  const gameState = useGameStore((s) => s.gameState) as unknown as EduState | null;

  const [entered, setEntered] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [showHot, setShowHot] = useState(false);
  const [panel, setPanel] = useState<"hint" | "journal" | null>(null);
  const [now, setNow] = useState(0);

  const started = !!gameState?.started;
  const roles = gameState?.roles ?? { atelier: null, biblio: null };
  const myRole: RoleId | null = roles.atelier?.id === playerId ? "atelier" : roles.biblio?.id === playerId ? "biblio" : null;
  const level = (gameState?.level ?? 1) as 1 | 2;
  const myProgress: EduProgress = (myRole && gameState?.progress?.[myRole]) || FRESH_PROGRESS;

  // horloge
  useEffect(() => {
    if (!started || gameState?.finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => clearInterval(id);
  }, [started, gameState?.finished]);

  const elapsed = gameState?.finishElapsed != null
    ? gameState.finishElapsed
    : gameState?.startEpoch ? (now - gameState.startEpoch) / 1000 : 0;

  const quit = () => (onReturnToLobby ? onReturnToLobby() : router.push(`/room/${roomCode}`));

  const finalReady = myRole === "atelier"
    ? (level === 1 ? myProgress.safeOpen : myProgress.boilerSet)
    : (level === 1 ? myProgress.vitrineOpen : myProgress.telescopeSet);

  const s: SceneState = { ...myProgress, finalReady };

  const A: EduActions = useMemo(() => ({
    addItem: (id) => sendAction({ action: "item", id }),
    setFlag: (k, v) => { if (k === "escaped") sendAction({ action: "escaped" }); else sendAction({ action: "flag", key: k, value: v }); },
    addClue: (t) => sendAction({ action: "clue", text: t }),
    hasItem: (id) => myProgress.items.includes(id),
  }), [sendAction, myProgress.items]);

  // ─────────── SALON (avant départ) ───────────
  if (!started) {
    const bothHere = !!roles.atelier && !!roles.biblio;
    const spectator = !myRole && bothHere;
    const myAssigned = myRole ? ROLES[myRole] : null;
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "44px 20px 50px" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, letterSpacing: "0.24em", color: "#FFD23F", fontWeight: 700 }}>AF GAMES · ESCAPE COOP</div>
            <h1 style={{ margin: "8px 0 6px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 40, letterSpacing: "-0.025em", lineHeight: 0.95 }}>Escape Duo</h1>
            <p style={{ fontSize: 14.5, color: "var(--ink-muted)", lineHeight: 1.5, maxWidth: 380, margin: "0 auto" }}>
              Deux pièces voisines, un téléphone chacun. Tout ce qui ouvre TA pièce est caché dans celle de ton binôme. Parlez-vous à travers le mur — impossible de s&apos;échapper seul.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
            {(["atelier", "biblio"] as RoleId[]).map((k) => {
              const r = ROLES[k]; const occ = roles[k]; const mine = myRole === k;
              return (
                <div key={k} style={{ textAlign: "left", padding: "18px 18px", borderRadius: 22, background: `linear-gradient(160deg,${r.accent}22,rgba(255,255,255,0.03))`, border: `1.5px solid ${mine ? r.accent : r.accent + "55"}`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", right: -16, top: -14, fontSize: 90, opacity: 0.16 }}>{r.emoji}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.2em", color: r.accent, fontWeight: 700 }}>JOUEUR · {k === "atelier" ? "A" : "B"}</div>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 25, margin: "4px 0 6px" }}><span style={{ marginRight: 8 }}>{r.emoji}</span>{r.name}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.4 }}>
                    {occ ? <>👤 <b style={{ color: "#fff" }}>{occ.name}</b>{mine ? " (toi)" : ""}</> : <span style={{ color: "var(--ink-soft)" }}>En attente d&apos;un joueur…</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {spectator ? (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)" }}>👁 La partie est complète (2 joueurs). Tu es spectateur.</p>
          ) : (
            <>
              <button
                onClick={() => sendAction({ action: "start" })}
                disabled={!bothHere}
                style={{ width: "100%", padding: "16px", borderRadius: 18, border: "none", cursor: bothHere ? "pointer" : "default", background: bothHere ? "linear-gradient(180deg,#8A63F2,#5B36D6)" : "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 800, fontSize: 16.5, opacity: bothHere ? 1 : 0.5 }}>
                {bothHere ? "Commencer l'évasion →" : "En attente du 2e joueur…"}
              </button>
              {myAssigned && <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12 }}>Tu joueras <b style={{ color: myAssigned.accent }}>{myAssigned.emoji} {myAssigned.name}</b>. Ouvrez le jeu sur vos deux téléphones.</p>}
            </>
          )}
          <div style={{ textAlign: "center" }}><button onClick={quit} style={{ marginTop: 16, background: "none", border: "none", color: "var(--ink-soft)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Quitter</button></div>
        </div>
      </div>
    );
  }

  // spectateur en cours de partie
  if (!myRole) {
    return <div style={wrap}><div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 54, marginBottom: 10 }}>👁</div>
      <h1 style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 30 }}>Partie en cours</h1>
      <p style={{ color: "var(--ink-muted)", marginTop: 8 }}>Escape Duo se joue à 2. Les deux rôles sont pris.</p>
      <button onClick={quit} style={{ ...dBtn("#5B36D6"), color: "#fff", maxWidth: 260, margin: "22px auto 0" }}>Retour au salon</button>
    </div></div>;
  }

  const R = ROLES[myRole];
  const RM = level === 1 ? ROLES[myRole] : ROOMS2[myRole];
  const hasProgress = myProgress.items.length > 0 || myProgress.clues.length > 0 || myProgress.brickFound || myProgress.lampFound;

  // intro du rôle (niveau 1 uniquement)
  if (level === 1 && !entered && !hasProgress && !myProgress.escaped && !gameState!.bothEscaped) {
    return <div style={wrap}><div style={{ maxWidth: 440, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 10 }}>{R.emoji}</div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, letterSpacing: "0.22em", color: R.accent, fontWeight: 700 }}>JOUEUR {myRole === "atelier" ? "A" : "B"}</div>
      <h1 style={{ margin: "8px 0 14px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em" }}>{R.name}</h1>
      <p style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.55, marginBottom: 26 }}>{R.intro}</p>
      <button onClick={() => setEntered(true)} style={{ width: "100%", maxWidth: 320, margin: "0 auto", padding: "16px", borderRadius: 18, border: "none", cursor: "pointer", background: `linear-gradient(180deg,${R.accent},${R.accent}bb)`, color: "#1a1322", fontWeight: 800, fontSize: 17 }}>Entrer dans {R.short} →</button>
    </div></div>;
  }

  // victoire finale
  if (gameState!.finished) {
    const min = elapsed / 60;
    const totalHints = (gameState!.progress.atelier.hintsUsed) + (gameState!.progress.biblio.hintsUsed);
    const stars = (min <= 26 && totalHints <= 2) ? 3 : (min <= 45 && totalHints <= 6) ? 2 : 1;
    return <div style={wrap}><Confetti /><div style={{ maxWidth: 420, margin: "0 auto", padding: "66px 24px", textAlign: "center", position: "relative" }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🌙</div>
      <h1 style={{ margin: "0 0 6px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 40 }}>Dehors, enfin !</h1>
      <p style={{ fontSize: 15, color: "var(--ink-muted)", marginBottom: 22 }}>Les deux dernières portes cèdent en même temps. L&apos;air froid de la nuit — vous y êtes arrivés, à deux.</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, fontSize: 40, marginBottom: 20 }}>{[0, 1, 2].map(i => <span key={i} style={{ opacity: i < stars ? 1 : 0.18, color: "#FFD23F" }}>★</span>)}</div>
      <div style={{ display: "inline-flex", gap: 22, padding: "14px 26px", borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 26 }}>
        <div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 24 }}>{fmtTime(elapsed)}</div><div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Temps total</div></div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.12)" }} />
        <div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 24 }}>{totalHints}</div><div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Indices</div></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300, margin: "0 auto" }}>
        <button onClick={() => { setEntered(false); sendAction({ action: "restart" }); }} style={{ padding: "15px", borderRadius: 16, border: "none", cursor: "pointer", background: "linear-gradient(180deg,#5B36D6,#42279e)", color: "#fff", fontWeight: 800, fontSize: 16 }}>Rejouer depuis le début</button>
        <button onClick={quit} style={{ padding: "13px", borderRadius: 16, cursor: "pointer", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", color: "#fff", fontWeight: 600, fontSize: 14 }}>Quitter</button>
      </div>
    </div></div>;
  }

  // interstitiel fin niveau 1
  if (level === 1 && gameState!.bothEscaped) {
    const next = ROOMS2[myRole];
    return <div style={wrap}><Confetti /><div style={{ maxWidth: 430, margin: "0 auto", padding: "60px 24px", textAlign: "center", position: "relative" }}>
      <div style={{ fontSize: 58, marginBottom: 8 }}>🔓</div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, letterSpacing: "0.2em", color: "#FFD23F", fontWeight: 700 }}>NIVEAU 1 — TERMINÉ</div>
      <h1 style={{ margin: "8px 0 12px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 32 }}>Première porte franchie</h1>
      <p style={{ fontSize: 14.5, color: "var(--ink-muted)", lineHeight: 1.55, marginBottom: 6 }}>Mais le couloir ne mène pas dehors… il continue. {next.intro}</p>
      <div style={{ fontSize: 36, margin: "14px 0" }}>{next.emoji}</div>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 18 }}>Attendez-vous l&apos;un l&apos;autre, puis continuez ensemble.</p>
      <button onClick={() => { setEntered(true); sendAction({ action: "next-level" }); }} style={{ width: "100%", maxWidth: 320, margin: "0 auto", padding: "16px", borderRadius: 18, border: "none", cursor: "pointer", background: `linear-gradient(180deg,${next.accent},${next.accent}bb)`, color: "#1a1322", fontWeight: 800, fontSize: 16.5 }}>Continuer vers {next.name} →</button>
    </div></div>;
  }

  // en attente du binôme (j'ai fini ma porte)
  if (myProgress.escaped && !gameState!.bothEscaped) {
    return <div style={wrap}><div style={{ maxWidth: 420, margin: "0 auto", padding: "90px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>🚪✨</div>
      <h1 style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 30 }}>Ta porte est ouverte !</h1>
      <p style={{ color: "var(--ink-muted)", marginTop: 10, lineHeight: 1.55 }}>Encourage ton binôme à l&apos;oral — vous ne sortez que lorsque les <b style={{ color: "#fff" }}>deux</b> portes sont franchies.</p>
      <div style={{ marginTop: 20, fontFamily: "var(--f-mono)", fontSize: 22 }}>🕯️ {fmtTime(elapsed)}</div>
    </div></div>;
  }

  // ─────────── EN JEU ───────────
  const HSET = level === 1 ? HINTS : HINTS2;
  const step = level === 1
    ? (myRole === "atelier" ? (!s.brickFound ? 0 : !s.drawerOpen ? 1 : !s.clockSet ? 2 : !s.safeOpen ? 3 : 4) : (!s.lampFound ? 0 : !s.bookOpen ? 1 : !s.calendarSeen ? 2 : !s.vitrineOpen ? 3 : 4))
    : (myRole === "atelier" ? (!s.tonneauFound ? 0 : !s.chestOpen ? 1 : !s.boilerSet ? 2 : 3) : (!s.noteFound ? 0 : !s.starmapSeen ? 1 : !s.telescopeSet ? 2 : 3));

  const Scene = level === 1
    ? (myRole === "atelier" ? AtelierScene : BiblioScene)
    : (myRole === "atelier" ? CaveScene : ObservatoireScene);

  const invItems: ({ icon: string; name: string } | false)[] = level === 1
    ? (myRole === "atelier" ? [s.items.includes("loupe") ? { icon: "🔍", name: "Loupe" } : false, false] : [s.bookOpen ? { icon: "🔑", name: "Clé de chiffrement" } : false, false])
    : (myRole === "atelier" ? [s.items.includes("manivelle") ? { icon: "🔧", name: "Manivelle" } : false, false] : [false, false]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 140, background: "#140d0a", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, bottom: 80 }}>
        <Scene s={s} onOpen={setActive} hint={showHot} />
      </div>

      {/* barre haut */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", zIndex: 20, background: "linear-gradient(180deg,rgba(0,0,0,0.5),transparent)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, background: `${RM.accent}26`, border: `1px solid ${RM.accent}66`, fontWeight: 700, fontSize: 12.5, color: "#fff" }}>{RM.emoji} {RM.short}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 13.5 }}>🕯️ {fmtTime(elapsed)}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowHot(v => !v)} style={topBtn(showHot)} title="Surligner les objets">👁️</button>
          <button onClick={() => setPanel("journal")} style={topBtn(false)} title="Journal">📓</button>
          <button onClick={() => { setPanel("hint"); sendAction({ action: "hint" }); }} style={{ ...topBtn(false), width: "auto", padding: "0 13px", gap: 6, fontSize: 13, fontWeight: 700 }}>💡 Indice</button>
          <button onClick={quit} style={{ ...topBtn(false), width: "auto", padding: "0 12px", fontSize: 12.5, fontWeight: 700 }}>Quitter</button>
        </div>
      </div>

      {/* inventaire */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px", zIndex: 20, background: "linear-gradient(0deg,rgba(0,0,0,0.55),transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 440, margin: "0 auto" }}>
          <span style={{ fontSize: 11, color: "var(--ink-soft)", fontFamily: "var(--f-mono)", letterSpacing: "0.1em", flexShrink: 0 }}>SAC</span>
          <div style={{ display: "flex", gap: 8, flex: 1 }}>
            {[0, 1].map(i => { const it = invItems[i]; return (
              <div key={i} style={{ flex: 1, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: it ? `${RM.accent}26` : "rgba(255,255,255,0.04)", border: it ? `1px solid ${RM.accent}66` : "1px dashed rgba(255,255,255,0.14)" }}>
                {it ? <><span style={{ fontSize: 22 }}>{it.icon}</span><span style={{ fontSize: 11.5, color: "#fff", fontWeight: 600 }}>{it.name}</span></> : null}
              </div>
            ); })}
          </div>
        </div>
      </div>

      {active && <DObjectView id={active} role={myRole} level={level} s={s} A={A} onClose={() => setActive(null)} />}

      {panel === "hint" && <DModal title="Indice" accent="#FFD23F" onClose={() => setPanel(null)}>
        <p style={{ fontSize: 15, color: "#EDE3C8", lineHeight: 1.6, margin: "6px 0 14px" }}>💡 {HSET[myRole][step]}</p>
        <button onClick={() => setPanel(null)} style={dBtn("#FFD23F")}>Compris</button>
      </DModal>}
      {panel === "journal" && <DModal title="Journal" onClose={() => setPanel(null)}>
        {s.clues.length === 0 ? <p style={dFlavor}>Rien de noté. Fouille et parle à ton binôme !</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "6px 0 14px" }}>{s.clues.map((c, i) => (<div key={i} style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13.5, color: "#EDE3C8", lineHeight: 1.5 }}>✎ {c}</div>))}</div>}
        <button onClick={() => setPanel(null)} style={{ ...dBtn("#3a3146"), color: "#fff" }}>Fermer</button>
      </DModal>}
    </div>
  );
}
