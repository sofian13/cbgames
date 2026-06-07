"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CIPHER_ROWS, CODES, type SceneState } from "./data";

/* ──────────────────────────────────────────────────────────────
   ESCAPE DUO — scenes (4 pieces). Porte de duo-rooms.jsx + duo-rooms2.jsx.
   ────────────────────────────────────────────────────────────── */

const DSTAGE_W = 720, DSTAGE_H = 1180;

type SceneProps = { s: SceneState; onOpen: (id: string) => void; hint: boolean };

function Stage({ bg, children }: { bg: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const fit = () => { const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); setScale(Math.min(r.width / DSTAGE_W, r.height / DSTAGE_H)); };
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "relative", width: DSTAGE_W, height: DSTAGE_H, transform: `scale(${scale})`, transformOrigin: "center", background: bg }}>
        {children}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 160px rgba(0,0,0,0.6)" }} />
      </div>
    </div>
  );
}

function Hot({ x, y, w, h, onClick, done, hint, z = 6, round = 14, label, children }: { x: number; y: number; w: number; h: number; onClick: () => void; done?: boolean; hint?: boolean; z?: number; round?: number; label?: string; children?: ReactNode }) {
  return (
    <button onClick={onClick} title={label} className={"edu-hot" + (hint && !done ? " edu-hot-hint" : "")}
      style={{ position: "absolute", left: x, top: y, width: w, height: h, zIndex: z, border: "none", background: "transparent", cursor: "pointer", padding: 0, borderRadius: round }}>
      {children}
      {done && <span style={{ position: "absolute", top: -8, right: -8, width: 26, height: 26, borderRadius: "50%", background: "#3DDC97", color: "#06281c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>✓</span>}
    </button>
  );
}

function NightWindow() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: -10, borderRadius: 14, background: "linear-gradient(180deg,#5a4636,#3a2c20)", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 8, overflow: "hidden", background: "radial-gradient(120% 90% at 70% 18%, rgba(91,54,214,0.55), transparent 60%), linear-gradient(180deg,#1b1142,#0c0826)" }}>
        <div style={{ position: "absolute", right: 26, top: 22, width: 46, height: 46, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #FFF3CE,#F4D679)", boxShadow: "0 0 30px #FFD23F88" }} />
        {[[34, 44], [64, 110], [120, 56], [150, 120], [26, 118]].map((p, i) => (<span key={i} style={{ position: "absolute", left: p[0], top: p[1], width: 3, height: 3, borderRadius: "50%", background: "#fff", opacity: 0.8 }} />))}
      </div>
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 8, transform: "translateX(-50%)", background: "#3a2c20" }} />
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 8, transform: "translateY(-50%)", background: "#3a2c20" }} />
    </div>
  );
}

/* ══════════════ ATELIER (niv.1) ══════════════ */
function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  const m = minute || 0, h = hour || 0;
  const minDeg = m * 6, hrDeg = (h % 12) * 30 + m * 0.5;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 38% 30%, #E7D7A8,#C9A24B)", boxShadow: "0 8px 22px rgba(0,0,0,0.5), inset 0 0 0 8px #8a6d2f" }} />
      <div style={{ position: "absolute", inset: 18, borderRadius: "50%", background: "radial-gradient(circle at 42% 36%, #FBF4DF,#EDE0BE)" }}>
        {[...Array(12)].map((_, i) => (<span key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 3, height: 8, background: "#5a4326", transform: `translate(-50%,-50%) rotate(${i * 30}deg) translateY(-46px)` }} />))}
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 30, background: "#2a2018", borderRadius: 3, transformOrigin: "50% 100%", transform: `translate(-50%,-100%) rotate(${hrDeg}deg)`, transition: "transform 1.1s cubic-bezier(.5,1.6,.4,1)" }} />
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 42, background: "#3a2e22", borderRadius: 3, transformOrigin: "50% 100%", transform: `translate(-50%,-100%) rotate(${minDeg}deg)`, transition: "transform 1.1s cubic-bezier(.5,1.6,.4,1)" }} />
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 10, height: 10, background: "#2a2018", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
      </div>
    </div>
  );
}

function Safe({ open }: { open: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "linear-gradient(180deg,#4a4f57,#2c3036)", boxShadow: "inset 0 0 0 6px #6b7079, 0 10px 24px rgba(0,0,0,0.55)", perspective: 600 }}>
      <div style={{ position: "absolute", inset: 16, borderRadius: 6, background: "linear-gradient(180deg,#22262b,#15181c)" }}>
        <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--f-mono)", fontSize: 11, color: "#9aa0a8", letterSpacing: "0.1em" }}>{open ? "VIDE" : "COFFRE"}</div>
      </div>
      <div style={{ position: "absolute", inset: 10, borderRadius: 8, transformOrigin: "left center", transition: "transform .8s cubic-bezier(.4,1.3,.5,1)", transform: open ? "rotateY(-105deg)" : "rotateY(0deg)", background: "linear-gradient(180deg,#5b626c,#3a3f47)", boxShadow: "inset 0 0 0 3px #777e88" }}>
        <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%,#E7D7A8,#C9A24B)", boxShadow: "0 0 0 4px #3a3f47" }} />
        <div style={{ position: "absolute", left: 14, top: 14, fontFamily: "var(--f-mono)", fontSize: 10, color: "#cfd4da", letterSpacing: "0.12em" }}>⚙ ✦ ☾ ⚷</div>
      </div>
    </div>
  );
}

function Door({ escaped }: { escaped: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: "10px 10px 0 0", background: "linear-gradient(180deg,#5a3f27,#3b2a1c)", boxShadow: "0 0 0 8px #2a1d12, 0 14px 30px rgba(0,0,0,0.5)", perspective: 800, overflow: escaped ? "visible" : "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "left center", transition: "transform 1s cubic-bezier(.4,1.2,.5,1)", transform: escaped ? "rotateY(-72deg)" : "rotateY(0)", borderRadius: "10px 10px 0 0", background: "linear-gradient(180deg,#5a3f27,#3b2a1c)" }}>
        <div style={{ position: "absolute", inset: "18px 16px", borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg,#52391f,#3a2714)", boxShadow: "inset 0 0 0 4px #2f2114" }} />
        <div style={{ position: "absolute", right: 22, top: "52%", width: 18, height: 18, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%,#E7D7A8,#B98F36)" }} />
        <div style={{ position: "absolute", right: 16, top: "40%", width: 30, height: 46, borderRadius: 5, background: "linear-gradient(180deg,#C9A24B,#8a6d2f)" }} />
      </div>
      {escaped && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 0% 50%, rgba(255,230,160,0.9), rgba(255,210,63,0.2) 50%, transparent 75%)" }} />}
    </div>
  );
}

export function AtelierScene({ s, onOpen, hint }: SceneProps) {
  return (
    <Stage bg="linear-gradient(180deg,#3a2a1e 0%,#33241a 62%,#2a1d13 62%,#221710 100%)">
      {[...Array(7)].map((_, i) => (<div key={i} style={{ position: "absolute", top: 0, height: 728, left: i * 103, width: 1.5, background: "rgba(0,0,0,0.18)" }} />))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 716, height: 14, background: "#241810" }} />
      <div style={{ position: "absolute", left: 40, top: 70, width: 200, height: 170 }}><NightWindow /></div>

      <Hot x={300} y={120} w={96} h={56} round={6} label="Brique descellée" done={s.brickFound} hint={hint} onClick={() => onOpen("brick")}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: s.brickFound ? "radial-gradient(circle,#1a120c,#0c0805)" : "linear-gradient(180deg,#7a5236,#5e3d27)", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.3)", transition: "all .4s", transform: s.brickFound ? "translateX(-8px)" : "none" }} />
      </Hot>
      <Hot x={462} y={78} w={156} h={156} round={78} label="Horloge murale" done={s.clockSet} hint={hint} onClick={() => onOpen("clock")}>
        <ClockFace hour={s.clockSet ? CODES.clockH : 0} minute={s.clockSet ? CODES.clockM : 0} />
      </Hot>
      <Hot x={40} y={320} w={186} h={392} round={10} label="Porte" done={s.escaped} hint={hint && s.finalReady} onClick={() => onOpen("door")}>
        <Door escaped={s.escaped} />
      </Hot>
      <Hot x={458} y={326} w={206} h={214} round={12} label="Coffre" done={s.safeOpen} hint={hint} onClick={() => onOpen("safe")}>
        <Safe open={s.safeOpen} />
      </Hot>
      <div style={{ position: "absolute", left: 74, top: 800, width: 572, height: 214, zIndex: 3, background: "linear-gradient(180deg,#5a4029,#3e2c1b)", borderRadius: "14px 14px 6px 6px", boxShadow: "0 -6px 22px rgba(0,0,0,0.4)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 24, background: "linear-gradient(180deg,#6b4d31,#523920)", borderRadius: "14px 14px 0 0" }} />
      </div>
      <Hot x={300} y={884} w={272} h={88} round={8} label="Tiroir de l'établi" done={s.drawerOpen} hint={hint} onClick={() => onOpen("drawer")}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: "linear-gradient(180deg,#5a4029,#46301c)", boxShadow: "inset 0 0 0 3px #3a2716", transform: s.drawerOpen ? "translateY(16px) scaleY(1.05)" : "none", transition: "transform .5s ease" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 56, height: 14, borderRadius: 8, background: "linear-gradient(180deg,#C9A24B,#8a6d2f)" }} />
        </div>
      </Hot>
    </Stage>
  );
}

/* ══════════════ BIBLIOTHÈQUE (niv.1) ══════════════ */
function Calendar({ seen }: { seen: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: "linear-gradient(180deg,#f3ead2,#dccfa9)", boxShadow: "0 8px 20px rgba(0,0,0,0.5)", overflow: "hidden" }}>
      <div style={{ height: 38, background: "linear-gradient(180deg,#7e1f2c,#5e1722)", color: "#f3ead2", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15, letterSpacing: "0.04em" }}>{seen ? "MARS" : "—"}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 38, bottom: 0, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, padding: 10, alignContent: "start" }}>
        {[...Array(15)].map((_, i) => (<div key={i} style={{ aspectRatio: "1", borderRadius: 4, background: seen && i === 9 ? "#7e1f2c" : "rgba(94,23,34,0.12)", color: seen && i === 9 ? "#fff" : "#7e1f2c", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700 }}>{i + 1}</div>))}
      </div>
    </div>
  );
}

function Vitrine({ open }: { open: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "linear-gradient(180deg,#4a3a2a,#33271b)", boxShadow: "0 12px 28px rgba(0,0,0,0.5), inset 0 0 0 5px #2a2015" }}>
      <div style={{ position: "absolute", inset: 16, borderRadius: 6, background: "linear-gradient(180deg,#1c2a28,#101a18)", overflow: "hidden" }}>
        {open && <div style={{ position: "absolute", left: "50%", top: "42%", transform: "translateX(-50%)", width: 46, height: 46, borderRadius: "50%", background: "radial-gradient(circle,#FFE9A8,#E7C45A)", boxShadow: "0 0 26px #FFD23F", animation: "edu-duo-glow 1.6s ease-in-out infinite" }} />}
        {[0, 1, 2].map((i) => (<div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${30 + i * 30}%`, height: 3, background: "rgba(255,255,255,0.06)" }} />))}
      </div>
      <div style={{ position: "absolute", inset: 16, borderRadius: 6, transition: "transform .8s ease", transform: open ? "translateY(-104%)" : "translateY(0)", background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))", border: "2px solid rgba(255,255,255,0.18)", boxShadow: "inset 0 0 30px rgba(255,255,255,0.08)" }} />
    </div>
  );
}

function ReadingLamp({ on, found }: { on: boolean; found: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {on && <div style={{ position: "absolute", left: "50%", top: 30, transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,200,90,0.28), transparent 65%)", pointerEvents: "none" }} />}
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: 60, height: 13, borderRadius: 8, background: "linear-gradient(180deg,#C9A24B,#8a6d2f)" }} />
      <div style={{ position: "absolute", left: "54%", bottom: 8, width: 7, height: 96, background: "linear-gradient(90deg,#8a6d2f,#C9A24B,#8a6d2f)", transform: "rotate(8deg)", transformOrigin: "bottom" }} />
      <div style={{ position: "absolute", left: "36%", top: 8, width: 70, height: 40, borderRadius: "40px 40px 8px 8px", background: on ? "linear-gradient(180deg,#3a6b54,#2c5341)" : "#27493a", transform: "rotate(-12deg)" }} />
      {on && <div style={{ position: "absolute", left: "40%", top: 42, width: 48, height: 8, borderRadius: 6, background: "radial-gradient(circle,#FFE9A8,#E7C45A)", boxShadow: "0 0 16px #FFD23F" }} />}
      <div style={{ position: "absolute", left: "50%", bottom: -6, transform: "translateX(-50%) rotate(-5deg)", width: 46, height: 30, borderRadius: 3, background: found ? "#cdbf9a" : "#efe6cd", boxShadow: "0 3px 8px rgba(0,0,0,0.4)" }} />
    </div>
  );
}

function RedBook({ open }: { open: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 700 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "6px 8px 8px 6px", transformOrigin: "left center", transition: "transform .8s cubic-bezier(.4,1.2,.5,1)", transform: open ? "rotateY(-128deg)" : "rotateY(0)", background: "linear-gradient(180deg,#b23142,#7e1f2c)", boxShadow: "0 8px 18px rgba(0,0,0,0.5), inset -8px 0 10px rgba(0,0,0,0.25)" }}>
        <div style={{ position: "absolute", inset: "14px 16px", borderRadius: 3, border: "2px solid #E7C45A", opacity: 0.8 }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 28, color: "#E7C45A" }}>⚙</div>
      </div>
      {open && <div style={{ position: "absolute", inset: 0, borderRadius: "6px 8px 8px 6px", background: "linear-gradient(180deg,#f3ead2,#e6d9b6)", boxShadow: "inset 6px 0 12px rgba(0,0,0,0.15)" }}>
        <div style={{ position: "absolute", inset: "12px 14px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, alignContent: "center" }}>
          {CIPHER_ROWS.slice(0, 4).map((r, i) => (<div key={i} style={{ textAlign: "center", color: "#5e1722", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700 }}>{r[0]}{r[1]}</div>))}
        </div>
      </div>}
    </div>
  );
}

export function BiblioScene({ s, onOpen, hint }: SceneProps) {
  const spines: [string, number][] = [["#6b7a8f", 26], ["#7a5a3a", 22], ["#4e6b57", 28], ["#86643a", 24], ["#5b6b8f", 20]];
  return (
    <Stage bg="linear-gradient(180deg,#2c2436 0%,#26203044 62%,#241b2e 62%,#1c1525 100%)">
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#2e2438,#241b2e 62%, #1d1626 62%, #181020 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 716, height: 14, background: "#15101c" }} />
      <div style={{ position: "absolute", left: 40, top: 70, width: 188, height: 158 }}><NightWindow /></div>
      <div style={{ position: "absolute", left: 466, top: 58, width: 214, height: 260, zIndex: 2, borderRadius: 8, background: "linear-gradient(180deg,#2e2336,#1f1729)", boxShadow: "0 12px 28px rgba(0,0,0,0.5), inset 0 0 0 6px #261c30" }}>
        {[0, 1].map((sh) => (<div key={sh} style={{ position: "absolute", left: 16, right: 16, top: 24 + sh * 116, height: 104, display: "flex", alignItems: "flex-end", gap: 7 }}>
          {spines.map((sp, i) => (<div key={i} style={{ width: sp[1], height: 72 + (i % 2) * 20, background: `linear-gradient(180deg,${sp[0]},${sp[0]}bb)`, borderRadius: "3px 3px 0 0", boxShadow: "inset -3px 0 5px rgba(0,0,0,0.3)" }} />))}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: -8, height: 8, background: "#140e1c" }} />
        </div>))}
      </div>
      <Hot x={290} y={92} w={150} h={184} round={8} label="Calendrier mural" done={s.calendarSeen} hint={hint} onClick={() => onOpen("calendar")}>
        <Calendar seen={s.calendarSeen} />
      </Hot>
      <Hot x={40} y={320} w={186} h={392} round={10} label="Porte" done={s.escaped} hint={hint && s.finalReady} onClick={() => onOpen("door")}>
        <Door escaped={s.escaped} />
      </Hot>
      <Hot x={470} y={336} w={200} h={340} round={10} label="Vitrine" done={s.vitrineOpen} hint={hint} onClick={() => onOpen("vitrine")}>
        <Vitrine open={s.vitrineOpen} />
      </Hot>
      <div style={{ position: "absolute", left: 74, top: 800, width: 572, height: 214, zIndex: 3, background: "linear-gradient(180deg,#3a3147,#272031)", borderRadius: "14px 14px 6px 6px", boxShadow: "0 -6px 22px rgba(0,0,0,0.4)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 24, background: "linear-gradient(180deg,#473b58,#322942)", borderRadius: "14px 14px 0 0" }} />
      </div>
      <Hot x={108} y={640} w={120} h={186} z={4} label="Lampe de lecture" onClick={() => onOpen("lamp")}>
        <ReadingLamp on={s.lampOn} found={s.lampFound} />
      </Hot>
      <Hot x={300} y={716} w={172} h={120} round={8} z={5} label="Grand livre rouge" done={s.bookOpen} hint={hint} onClick={() => onOpen("book")}>
        <RedBook open={s.bookOpen} />
      </Hot>
    </Stage>
  );
}

/* ══════════════ LA CAVE (niv.2) ══════════════ */
function Lantern() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: "50%", top: -40, transform: "translateX(-50%)", width: 4, height: 54, background: "#2a2018" }} />
      <div style={{ position: "absolute", left: "50%", top: 60, transform: "translateX(-50%)", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,190,90,0.22), transparent 62%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)", width: 64, height: 90, borderRadius: 10, background: "linear-gradient(180deg,#8a6d2f,#5a4520)", boxShadow: "inset 0 0 0 3px #C9A24B" }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: 6, background: "radial-gradient(circle,#FFE9A8,#E7A23E)", boxShadow: "0 0 22px #FFC04D" }} />
      </div>
    </div>
  );
}
function Barrels() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {[[0, 40, 150, 170], [120, 10, 150, 200]].map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b[0], top: b[1], width: b[2], height: b[3], borderRadius: "40% / 12%", background: "linear-gradient(90deg,#3e2a18,#6b4a2c,#3e2a18)", boxShadow: "inset 0 0 0 2px #2a1c10, 0 10px 22px rgba(0,0,0,0.4)" }}>
          {[0.22, 0.5, 0.78].map((y, j) => (<div key={j} style={{ position: "absolute", left: 0, right: 0, top: `${y * 100}%`, height: 8, background: "linear-gradient(180deg,#C9A24B,#8a6d2f)" }} />))}
        </div>
      ))}
    </div>
  );
}
function Chest({ open }: { open: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 700 }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", borderRadius: "6px 6px 8px 8px", background: "linear-gradient(180deg,#5a3f24,#3e2a17)", boxShadow: "inset 0 0 0 4px #2a1c10, 0 12px 26px rgba(0,0,0,0.45)" }}>
        <div style={{ position: "absolute", left: "50%", top: "30%", transform: "translateX(-50%)", width: 30, height: 34, borderRadius: 5, background: "linear-gradient(180deg,#E7D7A8,#B98F36)" }} />
        {open && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle,#FFE9A8,#E7C45A)", boxShadow: "0 0 20px #FFD23F", animation: "edu-duo-glow 1.6s ease-in-out infinite" }} />}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "44%", transformOrigin: "50% 100%", transition: "transform .8s cubic-bezier(.4,1.3,.5,1)", transform: open ? "rotateX(-118deg)" : "rotateX(0)", borderRadius: "10px 10px 4px 4px", background: "linear-gradient(180deg,#6b4a2c,#4a3219)", boxShadow: "inset 0 0 0 4px #2a1c10" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 8, transform: "translateX(-50%)", background: "linear-gradient(180deg,#C9A24B,#8a6d2f)" }} />
      </div>
    </div>
  );
}
function Boiler({ set }: { set: boolean }) {
  const needle = set ? 116 : -116;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: "78%", height: "100%", borderRadius: "40px 40px 14px 14px", background: "linear-gradient(90deg,#3a4148,#5b636c 45%,#3a4148)", boxShadow: "inset 0 0 0 4px #2a3036, 0 12px 26px rgba(0,0,0,0.5)" }} />
      {[0.2, 0.5, 0.8].map((y, i) => [0.28, 0.72].map((x, j) => (<span key={i + "-" + j} style={{ position: "absolute", left: `${20 + x * 60}%`, top: `${y * 100}%`, width: 7, height: 7, borderRadius: "50%", background: "#777e88" }} />)))}
      <div style={{ position: "absolute", left: "50%", top: 60, transform: "translateX(-50%)", width: 96, height: 96, borderRadius: "50%", background: "radial-gradient(circle at 40% 34%,#FBF4DF,#EDE0BE)", boxShadow: "inset 0 0 0 6px #C9A24B, 0 4px 12px rgba(0,0,0,0.4)" }}>
        <div style={{ position: "absolute", left: 8, top: 6, right: 8, bottom: "50%", borderRadius: "60px 60px 0 0", background: "conic-gradient(from -120deg at 50% 100%, #3DDC97 0 33%, #FFD23F 33% 66%, #FF6B5B 66% 100%)", opacity: 0.5 }} />
        <span style={{ position: "absolute", left: "50%", bottom: "50%", width: 4, height: 34, background: "#b23142", borderRadius: 3, transformOrigin: "50% 100%", transform: `translateX(-50%) rotate(${needle}deg)`, transition: "transform 1s cubic-bezier(.4,1.6,.4,1)" }} />
        <span style={{ position: "absolute", left: "50%", bottom: "50%", width: 9, height: 9, background: "#2a2018", borderRadius: "50%", transform: "translate(-50%,50%)" }} />
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 34, transform: "translateX(-50%)", width: 74, height: 74, borderRadius: "50%", border: "9px solid #8a6d2f", boxShadow: "0 0 0 3px #5a4520" }}>
        <div style={{ position: "absolute", inset: "42%", borderRadius: "50%", background: "#C9A24B" }} />
      </div>
    </div>
  );
}

export function CaveScene({ s, onOpen, hint }: SceneProps) {
  return (
    <Stage bg="linear-gradient(180deg,#2a2622 0%,#221d18 60%,#1a1510 60%,#140f0b 100%)">
      {[...Array(6)].map((_, r) => [...Array(6)].map((_, c) => (<div key={r + "-" + c} style={{ position: "absolute", left: c * 122 + (r % 2 ? 60 : 0) - 30, top: r * 70, width: 120, height: 68, border: "2px solid rgba(0,0,0,0.22)", borderRadius: 6, background: "rgba(255,255,255,0.012)" }} />)))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 716, height: 14, background: "#120d09" }} />
      <div style={{ position: "absolute", left: 320, top: 40, width: 80, height: 120, zIndex: 2 }}><Lantern /></div>
      <Hot x={40} y={320} w={186} h={392} round={10} label="Porte de la cave" done={s.escaped} hint={hint && s.finalReady} onClick={() => onOpen("door")}><Door escaped={s.escaped} /></Hot>
      <Hot x={476} y={284} w={196} h={428} round={20} label="Chaudière" done={s.boilerSet} hint={hint} onClick={() => onOpen("chaudiere")}><Boiler set={s.boilerSet} /></Hot>
      <Hot x={70} y={848} w={184} h={196} round={20} label="Tonneaux" done={s.tonneauFound} hint={hint} onClick={() => onOpen("tonneau")}><Barrels /></Hot>
      <Hot x={296} y={862} w={236} h={182} round={10} label="Vieux coffre" done={s.chestOpen} hint={hint} onClick={() => onOpen("coffre")}><Chest open={s.chestOpen} /></Hot>
    </Stage>
  );
}

/* ══════════════ L'OBSERVATOIRE (niv.2) ══════════════ */
function Porthole({ found }: { found: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(180deg,#3a4658,#222b38)", boxShadow: "inset 0 0 0 10px #8aa0c0, 0 10px 24px rgba(0,0,0,0.5)" }}>
      <div style={{ position: "absolute", inset: 16, borderRadius: "50%", overflow: "hidden", background: "radial-gradient(circle at 60% 30%, #2a3a66, #0c1230)" }}>
        <div style={{ position: "absolute", right: 24, top: 18, width: 30, height: 30, borderRadius: "50%", background: "radial-gradient(circle at 38% 35%,#FFF3CE,#F4D679)", boxShadow: "0 0 22px #FFD23F88" }} />
        {[[30, 40], [60, 90], [90, 30], [40, 100]].map((p, i) => (<span key={i} style={{ position: "absolute", left: p[0], top: p[1], width: 3, height: 3, borderRadius: "50%", background: "#fff" }} />))}
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%) rotate(-6deg)", width: 54, height: 34, borderRadius: 3, background: found ? "#cdbf9a" : "#efe6cd", boxShadow: "0 3px 8px rgba(0,0,0,0.4)" }} />
    </div>
  );
}
function StarMap({ seen }: { seen: boolean }) {
  const stars = [[30, 40], [70, 70], [110, 50], [150, 90], [120, 130], [60, 140], [170, 150], [40, 110]];
  const lines = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]];
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "linear-gradient(180deg,#1a2440,#0e1430)", boxShadow: "inset 0 0 0 5px #2a3358, 0 12px 26px rgba(0,0,0,0.5)", overflow: "hidden" }}>
      <svg viewBox="0 0 210 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {seen && lines.map((l, i) => (<line key={i} x1={stars[l[0]][0]} y1={stars[l[0]][1]} x2={stars[l[1]][0]} y2={stars[l[1]][1]} stroke="#8AA6D8" strokeWidth="1.5" opacity="0.8" />))}
        {stars.map((p, i) => (<circle key={i} cx={p[0]} cy={p[1]} r={seen && i < 6 ? 3.5 : 2.2} fill={seen && i < 6 ? "#FFE9A8" : "#9fb0d0"} />))}
      </svg>
      {seen && <div style={{ position: "absolute", left: 10, bottom: 8, fontFamily: "var(--f-mono)", fontSize: 10, color: "#FFE49B", letterSpacing: "0.08em" }}>★ tracé</div>}
    </div>
  );
}
function TelescopeView({ aimed }: { aimed: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-52%) rotate(20deg)", width: 10, height: 170, background: "linear-gradient(180deg,#5a4520,#8a6d2f)", transformOrigin: "bottom" }} />
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-48%) rotate(-20deg)", width: 10, height: 170, background: "linear-gradient(180deg,#5a4520,#8a6d2f)", transformOrigin: "bottom" }} />
      <div style={{ position: "absolute", left: "50%", bottom: 150, transform: "translateX(-50%)", width: 34, height: 34, borderRadius: "50%", background: "#8a6d2f" }} />
      <div style={{ position: "absolute", left: "50%", bottom: 150, transformOrigin: "left center", transition: "transform 1s cubic-bezier(.4,1.3,.5,1)", transform: `translateX(-30%) rotate(${aimed ? -34 : 18}deg)`, width: 210, height: 46, borderRadius: 24, background: "linear-gradient(180deg,#C9A24B,#7a5f24)", boxShadow: "inset 0 0 0 3px #5a4520, 0 8px 18px rgba(0,0,0,0.45)" }}>
        <div style={{ position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)", width: 30, height: 54, borderRadius: 14, background: "linear-gradient(180deg,#3a4148,#22282e)" }} />
        <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 18, height: 30, borderRadius: 8, background: aimed ? "radial-gradient(circle,#FFE9A8,#E7C45A)" : "#22282e", boxShadow: aimed ? "0 0 16px #FFD23F" : "none" }} />
      </div>
    </div>
  );
}

export function ObservatoireScene({ s, onOpen, hint }: SceneProps) {
  return (
    <Stage bg="radial-gradient(120% 80% at 50% 0%, rgba(60,80,160,0.4), transparent 60%), linear-gradient(180deg,#0c1230 0%,#0a0f28 60%,#10122e 60%,#0a0b22 100%)">
      {[...Array(40)].map((_, i) => { const x = (i * 97) % 720, y = (i * 53) % 700; return <span key={i} style={{ position: "absolute", left: x, top: y, width: i % 7 ? 2 : 3, height: i % 7 ? 2 : 3, borderRadius: "50%", background: "#fff", opacity: i % 3 ? 0.5 : 0.85 }} />; })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 716, height: 14, background: "#080a1c" }} />
      <Hot x={56} y={78} w={184} h={184} round={92} label="Hublot" done={s.noteFound} hint={hint} onClick={() => onOpen("hublot")}><Porthole found={s.noteFound} /></Hot>
      <Hot x={470} y={70} w={210} h={236} round={10} label="Carte des étoiles" done={s.starmapSeen} hint={hint} onClick={() => onOpen("carte")}><StarMap seen={s.starmapSeen} /></Hot>
      <Hot x={40} y={330} w={186} h={386} round={10} label="Porte du dôme" done={s.escaped} hint={hint && s.finalReady} onClick={() => onOpen("door")}><Door escaped={s.escaped} /></Hot>
      <Hot x={290} y={356} w={300} h={364} round={16} label="Lunette astronomique" done={s.telescopeSet} hint={hint} onClick={() => onOpen("telescope")}><TelescopeView aimed={s.telescopeSet} /></Hot>
    </Stage>
  );
}
