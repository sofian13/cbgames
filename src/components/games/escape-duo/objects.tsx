"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CIPHER_ROWS, CODES, CODES2, RELAY, RELAY2, type EduActions, type RoleId, type SceneState } from "./data";

/* ──────────────────────────────────────────────────────────────
   ESCAPE DUO — interactions (modales, cadenas, relais).
   Porte de duo-objects.jsx.
   ────────────────────────────────────────────────────────────── */

export const dFlavor: CSSProperties = { fontSize: 14.5, color: "var(--ink-muted)", lineHeight: 1.55, margin: "6px 0 16px" };
export const dBtn = (acc: string): CSSProperties => ({ width: "100%", padding: "14px 20px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(180deg,${acc},${acc}cc)`, color: "#1a1322", fontWeight: 800, fontSize: 15.5 });

export function DModal({ title, accent = "#C9A24B", onClose, children, wide }: { title: string; accent?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,5,16,0.76)", backdropFilter: "blur(4px)", padding: 18, animation: "edu-flash-in .22s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: wide ? 460 : 400, maxHeight: "88vh", overflowY: "auto", background: "linear-gradient(180deg,#241a2e,#1a1322)", borderRadius: 24, border: `1px solid ${accent}55`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 8px" }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 19 }}>{title}</div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 17, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "4px 18px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function Relay({ children }: { children: ReactNode }) {
  return <div style={{ padding: "13px 15px", borderRadius: 14, margin: "4px 0 14px", background: "linear-gradient(180deg,rgba(255,210,63,0.16),rgba(255,210,63,0.07))", border: "1px solid rgba(255,210,63,0.5)", color: "#FFE49B", fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{children}</div>;
}
function AskPartner({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 9, padding: "12px 14px", borderRadius: 12, marginBottom: 14, background: "rgba(127,178,166,0.14)", border: "1px solid rgba(127,178,166,0.45)", color: "#Bfe6dd", fontSize: 13.5, lineHeight: 1.45 }}><span>🔊</span><span>{children}</span></div>;
}
function DFound({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, margin: "4px 0 14px", background: "rgba(61,220,151,0.14)", border: "1px solid rgba(61,220,151,0.45)", color: "#9BF3CB", fontWeight: 600, fontSize: 14 }}>{children}</div>;
}

const dPad: CSSProperties = { height: 50, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 20, cursor: "pointer" };

function CodeLock({ digits, answer, accent = "#C9A24B", onSolve, label }: { digits: number; answer: string; accent?: string; onSolve: () => void; label?: string }) {
  const [v, setV] = useState("");
  const [shake, setShake] = useState(false);
  const press = (d: string) => v.length < digits && setV(v + d);
  const go = () => { if (v === answer) onSolve(); else { setShake(true); setTimeout(() => { setShake(false); setV(""); }, 460); } };
  return (
    <div>
      {label && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", marginBottom: 10 }}>{label}</div>}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14, animation: shake ? "edu-shake .42s" : "none" }}>
        {Array.from({ length: digits }).map((_, i) => (<div key={i} style={{ width: 46, height: 56, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 26, color: "#fff", background: "rgba(0,0,0,0.3)", border: `1.5px solid ${v[i] ? accent : "rgba(255,255,255,0.14)"}` }}>{v[i] || ""}</div>))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, maxWidth: 240, margin: "0 auto" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (<button key={d} onClick={() => press(String(d))} style={dPad}>{d}</button>))}
        <button onClick={() => setV(v.slice(0, -1))} style={{ ...dPad, fontSize: 17 }}>⌫</button>
        <button onClick={() => press("0")} style={dPad}>0</button>
        <button onClick={go} style={{ ...dPad, background: accent, color: "#1a1322" }}>✓</button>
      </div>
    </div>
  );
}

const dStep: CSSProperties = { width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 20, cursor: "pointer" };
function DStepper({ label, display, onMinus, onPlus }: { label: string; display: string | number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onMinus} style={dStep}>−</button>
        <div style={{ width: 50, fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 26 }}>{display}</div>
        <button onClick={onPlus} style={dStep}>+</button>
      </div>
    </div>
  );
}

function DClockSetter({ onSolve }: { onSolve: () => void }) {
  const [h, setH] = useState(12);
  const [m, setM] = useState(0);
  const [shake, setShake] = useState(false);
  const minDeg = m * 6, hrDeg = (h % 12) * 30 + m * 0.5;
  const go = () => { if (h === CODES.clockH && m === CODES.clockM) onSolve(); else { setShake(true); setTimeout(() => setShake(false), 460); } };
  return (
    <div style={{ textAlign: "center", animation: shake ? "edu-shake .42s" : "none" }}>
      <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto 16px", borderRadius: "50%", background: "radial-gradient(circle at 42% 36%,#FBF4DF,#EDE0BE)", boxShadow: "inset 0 0 0 8px #C9A24B, 0 8px 20px rgba(0,0,0,0.4)" }}>
        {[...Array(12)].map((_, i) => (<span key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 3, height: 8, background: "#5a4326", transform: `translate(-50%,-50%) rotate(${i * 30}deg) translateY(-58px)` }} />))}
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 38, background: "#2a2018", borderRadius: 3, transformOrigin: "50% 100%", transform: `translate(-50%,-100%) rotate(${hrDeg}deg)`, transition: "transform .5s cubic-bezier(.5,1.6,.4,1)" }} />
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 52, background: "#3a2e22", borderRadius: 3, transformOrigin: "50% 100%", transform: `translate(-50%,-100%) rotate(${minDeg}deg)`, transition: "transform .5s cubic-bezier(.5,1.6,.4,1)" }} />
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 11, height: 11, background: "#2a2018", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 18, marginBottom: 18 }}>
        <DStepper label="Heures" display={h === 0 ? 12 : h} onMinus={() => setH(h === 1 ? 12 : h - 1)} onPlus={() => setH(h === 12 ? 1 : h + 1)} />
        <DStepper label="Minutes" display={String(m).padStart(2, "0")} onMinus={() => setM((m + 55) % 60)} onPlus={() => setM((m + 5) % 60)} />
      </div>
      <button onClick={go} style={dBtn("#C9A24B")}>Régler l&apos;horloge</button>
    </div>
  );
}

function BigSymbols({ syms }: { syms: readonly string[] }) {
  return <div style={{ display: "flex", justifyContent: "center", gap: 14, margin: "6px 0 14px" }}>
    {syms.map((g, i) => (<div key={i} style={{ width: 60, height: 60, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#F0DDA8", background: "rgba(201,162,75,0.14)", border: "1px solid rgba(201,162,75,0.5)" }}>{g}</div>))}
  </div>;
}

function CipherTable() {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "4px 0 14px" }}>
    {CIPHER_ROWS.map((r, i) => (<div key={i} style={{ padding: "10px 0", borderRadius: 10, textAlign: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ fontSize: 22, color: "#E7C45A" }}>{r[0]}</div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 18, fontWeight: 700, marginTop: 2 }}>{r[1]}</div>
    </div>))}
  </div>;
}

const tokenStyle: CSSProperties = { textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 54, color: "#FFD23F", margin: "4px 0 10px" };

/* ══════════════ ROUTEUR ══════════════ */
export function DObjectView({ id, role, s, A, onClose, level }: { id: string; role: RoleId; s: SceneState; A: EduActions; onClose: () => void; level: 1 | 2 }) {
  const close = <button onClick={onClose} style={{ ...dBtn("#3a3146"), color: "#fff", marginTop: 12 }}>Fermer</button>;
  const finalCode = level === 2 ? CODES2.final : CODES.final;

  /* ---------- ATELIER (niv.1) ---------- */
  if (id === "brick") {
    return <DModal title="La brique descellée" onClose={onClose}>
      {!s.brickFound ? <>
        <p style={dFlavor}>Une brique bouge. Derrière, un papier plié couvert de poussière.</p>
        <Relay>{RELAY.brick}</Relay>
        <button onClick={() => { A.setFlag("brickFound", true); A.addClue("Donné à la Biblio : fermoir du livre = 6-1-9."); }} style={dBtn("#C9A24B")}>J&apos;ai prévenu mon binôme</button>
      </> : <><p style={dFlavor}>Le trou est vide. Tu as dicté « 6-1-9 » pour le grand livre de la Bibliothèque.</p>{close}</>}
    </DModal>;
  }
  if (id === "drawer") {
    return <DModal title="Tiroir de l'établi" onClose={onClose}>
      {s.drawerOpen ? <>
        <p style={dFlavor}>Le tiroir est ouvert. Tu y as pris une belle loupe en laiton.</p>
        <DFound><span>🔍</span> Loupe en main</DFound>{close}
      </> : <>
        <p style={dFlavor}>Verrouillé par un cadran à 3 chiffres.</p>
        <AskPartner>Le code est caché dans la Bibliothèque, sous la lampe de lecture. Demande-le à ton binôme.</AskPartner>
        <CodeLock digits={3} answer={CODES.drawer} onSolve={() => { A.setFlag("drawerOpen", true); A.addItem("loupe"); A.addClue("Tiroir ouvert → loupe récupérée."); }} />
      </>}
    </DModal>;
  }
  if (id === "clock") {
    return <DModal title="L'horloge murale" onClose={onClose}>
      {s.clockSet ? <>
        <p style={dFlavor}>Réglée sur 3 h 45. Un compartiment s&apos;est ouvert : deux symboles y sont peints.</p>
        <BigSymbols syms={CODES.vitrineSymbols} />
        <Relay>{RELAY.clockOut}</Relay>{close}
      </> : <>
        <p style={dFlavor}>Les aiguilles tournent. À quelle heure l&apos;arrêter ?</p>
        <AskPartner>L&apos;heure exacte est entourée sur le calendrier de la Bibliothèque. Demande-la à ton binôme.</AskPartner>
        <DClockSetter onSolve={() => { A.setFlag("clockSet", true); A.addClue("Horloge 3h45 → symboles vitrine : ✦ ☾ (donnés à la Biblio)."); }} />
      </>}
    </DModal>;
  }
  if (id === "safe") {
    return <DModal title="Le coffre" onClose={onClose}>
      {s.safeOpen ? <>
        <p style={dFlavor}>Le coffre s&apos;ouvre. À l&apos;intérieur, un jeton gravé d&apos;un chiffre.</p>
        <div style={tokenStyle}>2</div>
        <Relay>{RELAY.finalA}</Relay>{close}
      </> : !A.hasItem("loupe") ? <>
        <p style={dFlavor}>Une plaque porte 4 symboles minuscules, illisibles à l&apos;œil nu. Il te faudrait une loupe.</p>{close}
      </> : <>
        <p style={dFlavor}>À la loupe, les 4 symboles gravés apparaissent nettement :</p>
        <BigSymbols syms={CODES.safeSymbols} />
        <AskPartner>Lis ces 4 symboles à ton binôme : avec le grand livre rouge, il les traduira en chiffres. Entre le code qu&apos;il te dicte.</AskPartner>
        <CodeLock digits={4} answer={CODES.safe} onSolve={() => { A.setFlag("safeOpen", true); A.addClue("Coffre ouvert → mon chiffre final : 2."); }} />
      </>}
    </DModal>;
  }

  /* ---------- BIBLIOTHÈQUE (niv.1) ---------- */
  if (id === "lamp") {
    return <DModal title="La lampe de lecture" accent="#7FB2A6" onClose={onClose}>
      {!s.lampFound ? <>
        <p style={dFlavor}>En soulevant le socle de la lampe, tu trouves un petit mot glissé dessous.</p>
        <Relay>{RELAY.lamp}</Relay>
        <button onClick={() => { A.setFlag("lampFound", true); A.setFlag("lampOn", true); A.addClue("Donné à l'Atelier : tiroir = 3-4-7."); }} style={dBtn("#7FB2A6")}>J&apos;ai prévenu mon binôme</button>
      </> : <><p style={dFlavor}>La lampe éclaire le bureau. Tu as dicté « 3-4-7 » pour le tiroir de l&apos;Atelier.</p>{close}</>}
    </DModal>;
  }
  if (id === "book") {
    return <DModal title="Le grand livre rouge" accent="#7FB2A6" onClose={onClose} wide>
      {s.bookOpen ? <>
        <p style={dFlavor}>Le livre est ouvert sur la clé de chiffrement. Garde-la sous les yeux pour traduire les symboles de ton binôme.</p>
        <CipherTable />{close}
      </> : <>
        <p style={dFlavor}>Un fermoir de laiton à 3 chiffres scelle le livre.</p>
        <AskPartner>Le code du fermoir est caché dans l&apos;Atelier, derrière une brique. Demande-le à ton binôme.</AskPartner>
        <CodeLock digits={3} answer={CODES.book} accent="#7FB2A6" onSolve={() => { A.setFlag("bookOpen", true); A.addClue("Livre ouvert → clé de chiffrement disponible."); }} />
      </>}
    </DModal>;
  }
  if (id === "calendar") {
    return <DModal title="Le calendrier mural" accent="#7FB2A6" onClose={onClose}>
      {s.calendarSeen ? <>
        <p style={dFlavor}>Une date de mars est entourée, avec une heure notée à côté : <b style={{ color: "#fff" }}>3 h 45</b>.</p>
        <Relay>{RELAY.calendar}</Relay>{close}
      </> : <>
        <p style={dFlavor}>Les pages sont figées sur un mois oublié. Feuillette-les.</p>
        <button onClick={() => { A.setFlag("calendarSeen", true); A.addClue("Calendrier → heure 3h45 (donnée à l'Atelier)."); }} style={dBtn("#7FB2A6")}>📖 Feuilleter le calendrier</button>
      </>}
    </DModal>;
  }
  if (id === "vitrine") {
    return <DModal title="La vitrine" accent="#7FB2A6" onClose={onClose}>
      {s.vitrineOpen ? <>
        <p style={dFlavor}>La vitre coulisse. Sur le velours, un jeton gravé d&apos;un chiffre.</p>
        <div style={tokenStyle}>7</div>
        <Relay>{RELAY.finalB}</Relay>{close}
      </> : <>
        <p style={dFlavor}>Un cadran à 2 chiffres verrouille la vitre coulissante.</p>
        <AskPartner>Ton binôme te dicte 2 symboles (l&apos;horloge de l&apos;Atelier). Traduis-les avec le grand livre rouge, puis entre les 2 chiffres.</AskPartner>
        <CodeLock digits={2} answer={CODES.vitrine} accent="#7FB2A6" onSolve={() => { A.setFlag("vitrineOpen", true); A.addClue("Vitrine ouverte → mon chiffre final : 7."); }} />
      </>}
    </DModal>;
  }

  /* ---------- NIVEAU 2 · CAVE ---------- */
  if (id === "tonneau") {
    return <DModal title="Les tonneaux" accent="#C98F4B" onClose={onClose}>
      {!s.tonneauFound ? <>
        <p style={dFlavor}>En roulant un tonneau, un mot tracé à la craie apparaît sur la pierre humide.</p>
        <Relay>{RELAY2.tonneau}</Relay>
        <button onClick={() => { A.setFlag("tonneauFound", true); A.addClue("Donné à l'Observatoire : carte = 4-2-8."); }} style={dBtn("#C98F4B")}>J&apos;ai prévenu mon binôme</button>
      </> : <><p style={dFlavor}>Rien de plus. Tu as dicté « 4-2-8 » pour la carte des étoiles.</p>{close}</>}
    </DModal>;
  }
  if (id === "coffre") {
    return <DModal title="Le vieux coffre" accent="#C98F4B" onClose={onClose}>
      {s.chestOpen ? <>
        <p style={dFlavor}>Le couvercle se soulève. Une manivelle de laiton repose sur le velours.</p>
        <DFound><span>🔧</span> Manivelle récupérée</DFound>
        <Relay>{RELAY2.coffreOut}</Relay>{close}
      </> : <>
        <p style={dFlavor}>Un cadenas à 3 chiffres maintient le couvercle.</p>
        <AskPartner>Le code est caché dans l&apos;Observatoire, derrière le hublot. Demande-le à ton binôme.</AskPartner>
        <CodeLock digits={3} answer={CODES2.coffre} accent="#C98F4B" onSolve={() => { A.setFlag("chestOpen", true); A.addItem("manivelle"); A.addClue("Coffre ouvert → manivelle + orientation lunette 7-3 (donnée à l'Observatoire)."); }} />
      </>}
    </DModal>;
  }
  if (id === "chaudiere") {
    return <DModal title="La chaudière" accent="#C98F4B" onClose={onClose}>
      {s.boilerSet ? <>
        <p style={dFlavor}>La pression se stabilise dans le vert. Une trappe s&apos;ouvre : un jeton gravé en tombe.</p>
        <div style={tokenStyle}>4</div>
        <Relay>{RELAY2.finalA}</Relay>{close}
      </> : !A.hasItem("manivelle") ? <>
        <p style={dFlavor}>Le volant de réglage est grippé : impossible de le tourner à mains nues. Il te faut une manivelle.</p>{close}
      </> : <>
        <p style={dFlavor}>Avec la manivelle, le volant tourne enfin. Règle la pression sur la bonne valeur (2 chiffres).</p>
        <AskPartner>La pression exacte est lue sur la carte des étoiles de l&apos;Observatoire. Demande-la à ton binôme.</AskPartner>
        <CodeLock digits={2} answer={CODES2.chaudiere} accent="#C98F4B" onSolve={() => { A.setFlag("boilerSet", true); A.addClue("Chaudière réglée → mon chiffre final : 4."); }} />
      </>}
    </DModal>;
  }

  /* ---------- NIVEAU 2 · OBSERVATOIRE ---------- */
  if (id === "hublot") {
    return <DModal title="Le hublot" accent="#8AA6D8" onClose={onClose}>
      {!s.noteFound ? <>
        <p style={dFlavor}>Un mot est glissé dans le joint du hublot.</p>
        <Relay>{RELAY2.hublot}</Relay>
        <button onClick={() => { A.setFlag("noteFound", true); A.addClue("Donné à la Cave : coffre = 7-3-1."); }} style={dBtn("#8AA6D8")}>J&apos;ai prévenu mon binôme</button>
      </> : <><p style={dFlavor}>Le joint est vide. Tu as dicté « 7-3-1 » pour le coffre de la Cave.</p>{close}</>}
    </DModal>;
  }
  if (id === "carte") {
    return <DModal title="La carte des étoiles" accent="#8AA6D8" onClose={onClose}>
      {s.starmapSeen ? <>
        <p style={dFlavor}>Les points s&apos;allument et tracent la Grande Ourse. Sous le dessin, deux chiffres de pression : <b style={{ color: "#fff" }}>6 - 4</b>.</p>
        <Relay>{RELAY2.carteOut}</Relay>{close}
      </> : <>
        <p style={dFlavor}>La carte est verrouillée par un cadran à 3 chiffres.</p>
        <AskPartner>Le code est tracé à la craie dans la Cave, derrière les tonneaux. Demande-le à ton binôme.</AskPartner>
        <CodeLock digits={3} answer={CODES2.carte} accent="#8AA6D8" onSolve={() => { A.setFlag("starmapSeen", true); A.addClue("Carte → pression chaudière 6-4 (donnée à la Cave)."); }} />
      </>}
    </DModal>;
  }
  if (id === "telescope") {
    return <DModal title="La lunette" accent="#8AA6D8" onClose={onClose}>
      {s.telescopeSet ? <>
        <p style={dFlavor}>La lunette pivote et capte une étoile éclatante. Dans l&apos;oculaire, un jeton gravé :</p>
        <div style={tokenStyle}>9</div>
        <Relay>{RELAY2.finalB}</Relay>{close}
      </> : <>
        <p style={dFlavor}>Deux molettes orientent la lunette (2 chiffres).</p>
        <AskPartner>L&apos;orientation est gravée dans le coffre de la Cave. Demande-la à ton binôme.</AskPartner>
        <CodeLock digits={2} answer={CODES2.telescope} accent="#8AA6D8" onSolve={() => { A.setFlag("telescopeSet", true); A.addClue("Lunette alignée → mon chiffre final : 9."); }} />
      </>}
    </DModal>;
  }

  /* ---------- PORTE (commune) ---------- */
  if (id === "door") {
    const acc = role === "biblio" ? "#7FB2A6" : "#FFD23F";
    return <DModal title="La porte" accent={acc} onClose={onClose}>
      <p style={dFlavor}>Un dernier cadran à 2 chiffres. La liberté est juste derrière.</p>
      <AskPartner>Chacun a trouvé UN chiffre (toi et ton binôme). Mettez-les dans l&apos;ordre Atelier puis Bibliothèque et entrez le même code des deux côtés.</AskPartner>
      <CodeLock digits={2} answer={finalCode} accent={acc} onSolve={() => { A.setFlag("escaped", true); }} />
    </DModal>;
  }

  return null;
}
