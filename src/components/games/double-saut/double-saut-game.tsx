"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { LEVELS, parseLevel, TILE, VW, VH, type ParsedLevel } from "./levels";

/* ──────────────────────────────────────────────────────────────
   DOUBLE SAUT — client canvas (online).
   Le serveur (party/games/double-saut.ts) est autoritaire ; ici on
   ne fait QUE rendre l'état reçu (positions lissées) + envoyer les
   entrées. Le moteur de dessin est repris du prototype pf-game.js.
   ────────────────────────────────────────────────────────────── */

const PAL: Record<string, { body: string; deep: string; hi: string; glow: string }> = {
  purple: { body: "#7A4EE8", deep: "#3F1F9C", hi: "#B59CFF", glow: "rgba(122,78,232,0.6)" },
  pink: { body: "#FF3EA5", deep: "#A8195F", hi: "#FFA5CD", glow: "rgba(255,62,165,0.6)" },
  coral: { body: "#FF6B5B", deep: "#A0291B", hi: "#FFB4AB", glow: "rgba(255,107,91,0.6)" },
};
const SKY_GLOW: Record<string, string> = {
  mint: "rgba(61,220,151,0.26)", sky: "rgba(78,205,196,0.26)", yellow: "rgba(255,210,63,0.20)",
  coral: "rgba(255,107,91,0.24)", pink: "rgba(255,62,165,0.24)", purple: "rgba(122,78,232,0.30)",
};
const INK = "#15082E";
const SAW_R = 26;

type SrvPlayer = {
  id: string | null; name: string; x: number; y: number; w: number; h: number; vx: number;
  facing: number; onGround: boolean; alive: boolean; squash: number; runT: number;
  atGoal: boolean; deathT: number; color: string; idx: number;
};
type SrvEnemy = { x: number; y: number; w: number; h: number; alive: boolean; dead: number; dir: number };
type SrvState = {
  started: boolean;
  status: "intro" | "play" | "dead" | "clear" | "win";
  statusT: number;
  index: number; levelCount: number; deaths: number; starsTotal: number;
  name: string; accent: string; sky: string; pixelW: number; cameraX: number;
  solo?: boolean;
  slotIds: string[];
  lobby: { id: string; name: string }[];
  players: SrvPlayer[];
  enemies: SrvEnemy[];
  projectiles: { x: number; y: number; vx: number }[];
  coinsTaken: boolean[];
  crumbles: Record<string, string>;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; g: number; color: string; r: number };
type Confetti = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; c: string; w: number; h: number };

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export default function DoubleSautGame({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const router = useRouter();
  const { sendAction } = useGame(roomCode, "double-saut", playerId, playerName);
  const { gameState } = useGameStore();
  const state = gameState as SrvState | null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SrvState | null>(null);
  stateRef.current = state;

  // entrées locales
  const moveXRef = useRef(0);
  const mySlotRef = useRef(-1);
  const [orientation, setOrientation] = useState<"ok" | "portrait">("ok");

  const gameStarted = !!state?.started;
  const lobby = state?.lobby ?? [];
  const mySlot = state?.slotIds ? state.slotIds.indexOf(playerId) : -1;
  mySlotRef.current = mySlot;
  const amSpectator = !!state?.started && mySlot < 0;

  // niveaux parsés (statique) — caché par index
  const parsedCache = useRef<Map<number, ParsedLevel>>(new Map());
  const getParsed = useCallback((i: number) => {
    let p = parsedCache.current.get(i);
    if (!p) { p = parseLevel(LEVELS[i]); parsedCache.current.set(i, p); }
    return p;
  }, []);

  // ─────────── Boucle de rendu ───────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    let clock = 0;
    let shake = 0;
    let camX = 0;
    let camInit = false;
    const particles: Particle[] = [];
    let confetti: Confetti[] = [];
    let stars: { x: number; y: number; r: number; p: number }[] = [];
    let starsForIndex = -1;
    const disp = new Map<string, { x: number; y: number }>(); // positions lissées
    let prevStatus = "intro";
    let prevIndex = -1;
    let prevCoins: boolean[] = [];
    let prevEnemyAlive: boolean[] = [];

    const burst = (x: number, y: number, color: string, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 260;
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 0.5 + Math.random() * 0.5, g: 900, color, r: 2 + Math.random() * 4 });
      }
    };
    const sparkle = (x: number, y: number) => {
      for (let i = 0; i < 10; i++) { const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160; particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + Math.random() * 0.4, g: 120, color: "#FFD23F", r: 2 + Math.random() * 3 }); }
    };
    const spawnConfetti = () => {
      confetti = [];
      const C = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4", "#7A4EE8", "#FF6B5B"];
      for (let i = 0; i < 120; i++) confetti.push({ x: Math.random() * VW, y: -Math.random() * VH, vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 220, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, c: C[i % C.length], w: 7 + Math.random() * 7, h: 10 + Math.random() * 8 });
    };

    const clampCam = (x: number, pixelW: number) => Math.max(0, Math.min(pixelW - VW, x));
    const solidAtView = (lvl: ParsedLevel, crumbles: Record<string, string>, cx: number, cy: number) => {
      if (cx < 0 || cx >= lvl.W) return true;
      if (cy < 0 || cy >= lvl.H) return false;
      const t = lvl.tiles[cy][cx];
      if (t === 1) return true;
      if (t === 3) return crumbles[cx + "," + cy] !== "gone";
      return false;
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!last) last = t;
      let dt = (t - last) / 1000; last = t;
      if (dt > 0.1) dt = 0.1;
      clock += dt;

      const S = stateRef.current;
      // fond neutre quand pas en jeu
      if (!S || !S.started || !S.players.length) {
        ctx.fillStyle = "#0E0828"; ctx.fillRect(0, 0, VW, VH);
        return;
      }
      const lvl = getParsed(S.index);

      // nouvelle manche / niveau → régénère décor + reset deltas
      if (S.index !== prevIndex) {
        prevIndex = S.index;
        disp.clear();
        stars = [];
        for (let i = 0; i < Math.floor(lvl.W * 1.1); i++)
          stars.push({ x: Math.random() * lvl.W * TILE, y: Math.random() * VH * 0.62, r: 0.6 + Math.random() * 1.8, p: Math.random() * 6 });
        starsForIndex = S.index;
        prevCoins = S.coinsTaken.slice();
        prevEnemyAlive = S.enemies.map((e) => e.alive);
        camInit = false;
      }
      if (starsForIndex !== S.index) starsForIndex = S.index;

      // events dérivés
      if (prevStatus !== "dead" && S.status === "dead") {
        shake = 16;
        for (const p of S.players) if (!p.alive) burst(p.x + p.w / 2, p.y + p.h / 2, PAL[p.color]?.body ?? "#fff", 26);
      }
      if (prevStatus !== "clear" && S.status === "clear") spawnConfetti();
      if (prevStatus !== "win" && S.status === "win") spawnConfetti();
      prevStatus = S.status;

      if (S.coinsTaken) {
        for (let i = 0; i < S.coinsTaken.length; i++) {
          if (S.coinsTaken[i] && !prevCoins[i] && lvl.coins[i]) sparkle(lvl.coins[i].x, lvl.coins[i].y);
        }
        prevCoins = S.coinsTaken.slice();
      }
      for (let i = 0; i < S.enemies.length; i++) {
        if (prevEnemyAlive[i] && !S.enemies[i].alive) burst(S.enemies[i].x + S.enemies[i].w / 2, S.enemies[i].y, PAL.coral.body, 16);
      }
      prevEnemyAlive = S.enemies.map((e) => e.alive);

      // positions lissées (lerp vers cible serveur)
      const k = Math.min(1, dt * 16);
      const players = S.players.map((p) => {
        const key = "p" + p.idx;
        let d = disp.get(key);
        if (!d) { d = { x: p.x, y: p.y }; disp.set(key, d); }
        d.x += (p.x - d.x) * k; d.y += (p.y - d.y) * k;
        if (Math.abs(p.x - d.x) > 80 || Math.abs(p.y - d.y) > 80) { d.x = p.x; d.y = p.y; }
        return { ...p, x: d.x, y: d.y };
      });
      const enemies = S.enemies.map((e, i) => {
        const key = "e" + i;
        let d = disp.get(key);
        if (!d) { d = { x: e.x, y: e.y }; disp.set(key, d); }
        d.x += (e.x - d.x) * k; d.y += (e.y - d.y) * k;
        return { ...e, x: d.x, y: d.y };
      });

      // caméra (suit le milieu des vivants)
      const alive = players.filter((p) => p.alive);
      const mid = alive.length ? alive.reduce((a, p) => a + p.x + p.w / 2, 0) / alive.length : players[0].x;
      const target = clampCam(mid - VW / 2, S.pixelW);
      if (!camInit) { camX = target; camInit = true; } else camX += (target - camX) * Math.min(1, dt * 6);
      camX = clampCam(camX, S.pixelW);

      // particules / confetti
      for (const p of particles) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
      if (S.status === "clear" || S.status === "win") for (const c of confetti) { c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; if (c.y > VH + 30) { c.y = -20; c.x = Math.random() * VW; } }
      if (shake > 0) shake = Math.max(0, shake - dt * 60);

      const accent = S.accent;
      // ── fond ──
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, "#0E0828"); g.addColorStop(1, "#1A1142");
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      const rg = ctx.createRadialGradient(VW * 0.3, 0, 0, VW * 0.3, 0, VW * 0.9);
      rg.addColorStop(0, SKY_GLOW[S.sky] || SKY_GLOW.purple); rg.addColorStop(1, "transparent");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, VW, VH);
      for (const st of stars) {
        const sx = st.x - camX * 0.3;
        if (sx < -10 || sx > VW + 10) continue;
        const tw = 0.5 + 0.5 * Math.sin(clock * 2 + st.p);
        ctx.globalAlpha = 0.4 + tw * 0.5; ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(sx, st.y, st.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawHills(ctx, camX * 0.45, VH * 0.72, accent, 0.1, 150);
      drawHills(ctx, camX * 0.62, VH * 0.82, accent, 0.16, 110);

      const shx = shake ? (Math.random() - 0.5) * shake : 0;
      const shy = shake ? (Math.random() - 0.5) * shake : 0;
      ctx.save();
      ctx.translate(-Math.round(camX) + shx, shy);

      const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
      const c1 = Math.min(lvl.W - 1, Math.floor((camX + VW) / TILE) + 1);
      for (let cy = 0; cy < lvl.H; cy++) for (let cx = c0; cx <= c1; cx++) {
        const tt = lvl.tiles[cy][cx];
        if (tt === 1) drawBlock(ctx, cx, cy, accent, (a, b) => solidAtView(lvl, S.crumbles, a, b));
        else if (tt === 2) drawSpikes(ctx, cx, cy);
        else if (tt === 3) drawCrumble(ctx, cx, cy, accent, S.crumbles[cx + "," + cy]);
      }
      if (lvl.goal) drawGoal(ctx, lvl.goal, accent, clock);
      lvl.coins.forEach((c, i) => { if (!S.coinsTaken[i]) drawCoin(ctx, c, clock); });
      lvl.shooters.forEach((sh) => drawCannon(ctx, sh, clock));
      lvl.saws.forEach((s) => drawSaw(ctx, s, clock));
      enemies.forEach((e) => drawEnemy(ctx, e, clock));
      S.projectiles.forEach((pr) => drawFireball(ctx, pr));
      for (const p of particles) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (players[1]) drawPlayer(ctx, players[1]);
      if (players[0]) drawPlayer(ctx, players[0]);
      ctx.restore();

      // HUD
      drawHUD(ctx, S, mySlotRef.current);
      if (S.status === "clear" || S.status === "win") for (const c of confetti) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.fillStyle = c.c; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); ctx.restore(); }
      drawOverlay(ctx, S);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // gameStarted dans les deps : le <canvas> n'existe qu'en phase "EN JEU",
    // donc l'effet doit se relancer au démarrage pour brancher la boucle rAF.
  }, [getParsed, gameStarted]);

  // ─────────── Entrées ───────────
  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyThumbRef = useRef<HTMLDivElement | null>(null);
  const joyId = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (mySlotRef.current >= 0) sendAction({ action: "input", moveX: moveXRef.current });
    }, 33);
    return () => clearInterval(id);
  }, [sendAction]);

  const setMove = (v: number) => { moveXRef.current = mySlotRef.current >= 0 ? v : 0; };

  const onJoyMove = useCallback((clientX: number, clientY: number) => {
    const base = joyRef.current; if (!base) return;
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = clientX - cx, dy = clientY - cy;
    const R = 56, d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    if (joyThumbRef.current) joyThumbRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / R;
    setMove(Math.abs(nx) < 0.18 ? 0 : Math.max(-1, Math.min(1, nx * 1.4)));
  }, []);
  const endJoy = useCallback(() => {
    joyId.current = null; setMove(0);
    if (joyThumbRef.current) joyThumbRef.current.style.transform = "translate(-50%,-50%)";
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => { if (joyId.current !== null && e.pointerId === joyId.current) onJoyMove(e.clientX, e.clientY); };
    const up = (e: PointerEvent) => { if (joyId.current !== null && e.pointerId === joyId.current) endJoy(); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [onJoyMove, endJoy]);

  // clavier (desktop) — ← → + Espace/↑
  useEffect(() => {
    const keys: Record<string, boolean> = {};
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", " "].includes(k)) e.preventDefault();
      if (keys[k]) return; keys[k] = true;
      if ((k === "arrowup" || k === " ") && mySlotRef.current >= 0) sendAction({ action: "jump-down" });
      poll();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase(); keys[k] = false;
      if ((k === "arrowup" || k === " ") && mySlotRef.current >= 0) sendAction({ action: "jump-up" });
      poll();
    };
    const poll = () => { let x = 0; if (keys["arrowleft"]) x -= 1; if (keys["arrowright"]) x += 1; setMove(x); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [sendAction]);

  // orientation
  useEffect(() => {
    const upd = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setOrientation(window.innerWidth < 760 && portrait ? "portrait" : "ok");
    };
    upd();
    window.addEventListener("resize", upd);
    window.addEventListener("orientationchange", upd);
    try { (screen.orientation as { lock?: (o: "landscape") => Promise<void> }).lock?.("landscape")?.catch(() => {}); } catch {}
    return () => { window.removeEventListener("resize", upd); window.removeEventListener("orientationchange", upd); };
  }, []);

  const quit = () => (onReturnToLobby ? onReturnToLobby() : router.push(`/room/${roomCode}`));

  // ─────────── SALON (avant départ) ───────────
  if (!state?.started) {
    const ready = lobby.length >= 1;
    const willSolo = lobby.length < 2;
    return (
      <div className="fixed inset-0 z-[140] flex flex-col items-center justify-center gap-6 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(122,78,232,0.35),transparent_60%),linear-gradient(180deg,#0A0420,#150834)] px-6 text-white select-none">
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-300/80">Coop · 2 joueurs</div>
          <h1 className="mt-1 text-4xl font-black" style={{ fontFamily: "var(--font-display,'Bricolage Grotesque'),sans-serif" }}>Double Saut</h1>
          <p className="mt-2 max-w-sm text-sm text-white/60">Deux blobs, six niveaux. Atteignez la sortie <b>ensemble</b> — si l&apos;un tombe, on recommence le niveau à deux. Jouable seul (partenaire IA) ou à deux.</p>
        </div>
        <div className="flex min-w-[260px] flex-col gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Joueurs en piste</div>
          {[0, 1].map((i) => {
            const pl = lobby[i];
            const color = i === 0 ? "#7A4EE8" : "#FF3EA5";
            return (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-black/20 px-3 py-2">
                <span className="h-7 w-7 rounded-full" style={{ background: color, opacity: pl ? 1 : 0.25, boxShadow: pl ? `0 0 14px ${color}` : "none" }} />
                <span className={pl ? "font-semibold" : "text-white/35"}>{pl ? `${pl.name}${pl.id === playerId ? " (toi)" : ""}` : i === 1 ? "Partenaire IA (ou un 2e joueur)" : "En attente…"}</span>
              </div>
            );
          })}
          {lobby.length > 2 && (
            <div className="text-[11px] text-white/45">+ {lobby.length - 2} spectateur(s)</div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={quit} className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10">Quitter</button>
          <button
            onClick={() => sendAction({ action: "start" })}
            disabled={!ready}
            className="rounded-full bg-[linear-gradient(180deg,#8A63F2,#5B36D6)] px-7 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,54,214,0.5)] transition disabled:opacity-40 active:scale-95"
          >
            {willSolo ? "Lancer en solo (partenaire IA)" : "Lancer la partie"}
          </button>
        </div>
      </div>
    );
  }

  const showWin = state.status === "win";

  // ─────────── EN JEU ───────────
  return (
    <div className="fixed inset-0 z-[140] flex flex-col overflow-hidden bg-[#07041A] text-white select-none">
      {/* barre du haut */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-3">
        <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white/70 backdrop-blur">
          {amSpectator ? "👁 Spectateur" : "🎮 Tu joues"}
        </div>
        <div className="flex gap-2">
          <button onClick={() => sendAction({ action: "restart-level" })} className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white/75 backdrop-blur transition hover:bg-white/10">⟳ Rejouer</button>
          <button onClick={quit} className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white/75 backdrop-blur transition hover:bg-white/10">Quitter</button>
        </div>
      </div>

      {/* aire de jeu */}
      <div className="flex flex-1 items-center justify-center p-1">
        <canvas
          ref={canvasRef}
          width={VW}
          height={VH}
          className="h-auto max-h-full w-full max-w-full rounded-2xl"
          style={{ aspectRatio: "16 / 9", objectFit: "contain", touchAction: "none" }}
        />
      </div>

      {/* contrôles tactiles */}
      {!amSpectator && (
        <>
          <button
            onPointerDown={(e) => { e.preventDefault(); if (mySlotRef.current >= 0) sendAction({ action: "jump-down" }); (e.currentTarget as HTMLElement).classList.add("scale-90"); }}
            onPointerUp={(e) => { if (mySlotRef.current >= 0) sendAction({ action: "jump-up" }); (e.currentTarget as HTMLElement).classList.remove("scale-90"); }}
            onPointerCancel={(e) => { if (mySlotRef.current >= 0) sendAction({ action: "jump-up" }); (e.currentTarget as HTMLElement).classList.remove("scale-90"); }}
            className="absolute bottom-6 right-6 z-20 grid h-28 w-28 place-items-center rounded-full border-2 border-white/25 transition active:scale-90"
            style={{ background: "radial-gradient(circle at 38% 30%, #8A63F2, #5B36D6 55%, #3A1F9C)", boxShadow: "0 14px 30px rgba(91,54,214,0.55), inset 0 3px 0 rgba(255,255,255,0.35)", touchAction: "none" }}
          >
            <span className="text-2xl">▲</span>
            <span className="absolute bottom-4 text-[13px] font-extrabold tracking-wider">SAUT</span>
          </button>
          <div
            ref={joyRef}
            onPointerDown={(e) => { e.preventDefault(); joyId.current = e.pointerId; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {} onJoyMove(e.clientX, e.clientY); }}
            className="absolute bottom-6 left-6 z-20 h-36 w-36 rounded-full border-2 border-white/16"
            style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.10), rgba(255,255,255,0.04))", touchAction: "none" }}
          >
            <div ref={joyThumbRef} className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full border border-white/30" style={{ transform: "translate(-50%,-50%)", background: "radial-gradient(circle at 35% 30%, #fff, #B59CFF 40%, #5B36D6)" }} />
          </div>
        </>
      )}

      {/* victoire */}
      {showWin && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
          <div className="text-5xl font-black text-[#FFD23F]" style={{ fontFamily: "var(--font-display,'Bricolage Grotesque'),sans-serif" }}>VICTOIRE !</div>
          <p className="text-white/80">Vous avez fini les 6 niveaux ensemble 🎉</p>
          <div className="flex gap-3">
            <button onClick={() => sendAction({ action: "restart-game" })} className="rounded-full bg-[linear-gradient(180deg,#8A63F2,#5B36D6)] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,54,214,0.5)] active:scale-95">Rejouer</button>
            <button onClick={quit} className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/75 hover:bg-white/10">Quitter</button>
          </div>
        </div>
      )}

      {/* portrait */}
      {orientation === "portrait" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/92 p-6 text-center">
          <div className="max-w-xs rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-7">
            <div className="text-2xl">📱➡️</div>
            <p className="mt-3 text-lg font-semibold">Passe en paysage</p>
            <p className="mt-2 text-sm text-white/50">Double Saut se joue en mode paysage, contrôles en bas.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════ Fonctions de dessin (reprises de pf-game.js) ════════════ */
function drawHills(ctx: CanvasRenderingContext2D, off: number, baseY: number, accent: string, alpha: number, amp: number) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = accent;
  ctx.beginPath(); ctx.moveTo(0, VH);
  for (let x = -100; x <= VW + 100; x += 40) {
    const wx = x + off;
    const y = baseY + Math.sin(wx * 0.012) * amp + Math.sin(wx * 0.05) * (amp * 0.25);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawBlock(ctx: CanvasRenderingContext2D, cx: number, cy: number, accent: string, solid: (a: number, b: number) => boolean) {
  const x = cx * TILE, y = cy * TILE;
  const topOpen = !solid(cx, cy - 1);
  rr(ctx, x, y, TILE, TILE + 2, 8);
  const g = ctx.createLinearGradient(0, y, 0, y + TILE);
  g.addColorStop(0, "#43317F"); g.addColorStop(1, "#281C57");
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); rr(ctx, x, y, TILE, TILE, 8); ctx.clip();
  ctx.globalAlpha = 0.18; ctx.fillStyle = accent; ctx.fillRect(x, y, TILE, TILE);
  ctx.globalAlpha = 1;
  if (topOpen) {
    ctx.fillStyle = accent; ctx.fillRect(x, y, TILE, 10);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x, y, TILE, 3);
    ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(x, y + 10, TILE, 2);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 1.2;
  rr(ctx, x + 0.6, y + 0.6, TILE - 1.2, TILE - 1.2, 8); ctx.stroke();
}
function drawSpikes(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const x = cx * TILE, y = cy * TILE, n = 3, w = TILE / n;
  for (let i = 0; i < n; i++) {
    const sx = x + i * w;
    const g = ctx.createLinearGradient(sx, y, sx, y + TILE);
    g.addColorStop(0, "#FF8A7A"); g.addColorStop(1, "#A0291B");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(sx, y + TILE); ctx.lineTo(sx + w / 2, y + 6); ctx.lineTo(sx + w, y + TILE); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.moveTo(sx + w / 2, y + 6); ctx.lineTo(sx + w * 0.62, y + TILE * 0.5); ctx.lineTo(sx + w / 2, y + TILE * 0.5); ctx.closePath(); ctx.fill();
  }
}
function drawCrumble(ctx: CanvasRenderingContext2D, cx: number, cy: number, accent: string, st: string | undefined) {
  const x = cx * TILE, y = cy * TILE;
  if (st === "gone") { ctx.globalAlpha = 0.2; ctx.strokeStyle = accent; ctx.lineWidth = 2; rr(ctx, x + 4, y + 4, TILE - 8, TILE - 8, 6); ctx.stroke(); ctx.globalAlpha = 1; return; }
  let dx = 0, dy = 0;
  if (st === "shake") { dx = (Math.random() - 0.5) * 4; dy = (Math.random() - 0.5) * 4; }
  ctx.save(); ctx.translate(dx, dy);
  rr(ctx, x + 2, y + 2, TILE - 4, TILE - 4, 8);
  const g = ctx.createLinearGradient(0, y, 0, y + TILE);
  g.addColorStop(0, "#6B5A2E"); g.addColorStop(1, "#3E3318");
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = accent; ctx.globalAlpha = 0.7; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + 12, y + 6); ctx.lineTo(x + 20, y + 22); ctx.lineTo(x + 14, y + 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 34, y + 4); ctx.lineTo(x + 28, y + 24); ctx.lineTo(x + 38, y + 42); ctx.stroke();
  ctx.restore();
}
function drawCoin(ctx: CanvasRenderingContext2D, c: { x: number; y: number }, clock: number) {
  const yy = c.y + Math.sin(clock * 3 + c.x) * 3;
  const s = 9 + Math.sin(clock * 6 + c.x) * 1.5;
  ctx.save(); ctx.translate(c.x, yy);
  ctx.shadowColor = "rgba(255,210,63,0.8)"; ctx.shadowBlur = 12; ctx.fillStyle = "#FFD23F";
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r2 = i % 2 ? s * 0.45 : s; ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); }
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.25, s * 0.22, 0, 7); ctx.fill();
  ctx.restore();
}
function drawSaw(ctx: CanvasRenderingContext2D, s: { x: number; y: number }, clock: number) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(clock * 7);
  ctx.fillStyle = "#C9CCD6"; ctx.beginPath();
  const teeth = 12;
  for (let i = 0; i < teeth * 2; i++) { const a = i * Math.PI / teeth, r2 = i % 2 ? SAW_R : SAW_R + 8; ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); }
  ctx.closePath(); ctx.fill();
  const g = ctx.createRadialGradient(-4, -4, 2, 0, 0, SAW_R);
  g.addColorStop(0, "#EEF0F5"); g.addColorStop(1, "#7C8090");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, SAW_R - 2, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, SAW_R - 8, 0, 7); ctx.stroke();
  ctx.fillStyle = "#2A2F3D"; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
  ctx.restore();
}
function drawCannon(ctx: CanvasRenderingContext2D, sh: { x: number; y: number; dir: number }, clock: number) {
  ctx.save(); ctx.translate(sh.x, sh.y);
  rr(ctx, -TILE / 2 + 4, -TILE / 2 + 4, TILE - 8, TILE - 8, 8);
  const g = ctx.createLinearGradient(0, -20, 0, 20); g.addColorStop(0, "#3B2C72"); g.addColorStop(1, "#241953");
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "#FF6B5B"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#15082E"; rr(ctx, sh.dir > 0 ? 6 : -22, -9, 16, 18, 4); ctx.fill();
  ctx.fillStyle = "rgba(255,176,74," + (0.3 + 0.5 * Math.sin(clock * 4)) + ")";
  ctx.beginPath(); ctx.arc(sh.dir > 0 ? 22 : -22, 0, 4, 0, 7); ctx.fill();
  ctx.restore();
}
function drawFireball(ctx: CanvasRenderingContext2D, pr: { x: number; y: number; vx: number }) {
  ctx.save(); ctx.translate(pr.x, pr.y);
  ctx.shadowColor = "rgba(255,140,40,0.9)"; ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
  g.addColorStop(0, "#FFE891"); g.addColorStop(0.5, "#FF9A3C"); g.addColorStop(1, "#FF3E2E");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
  ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(-Math.sign(pr.vx) * 10, 0, 6, 0, 7); ctx.fill();
  ctx.restore();
}
function drawGoal(ctx: CanvasRenderingContext2D, gg: { x: number; y: number }, accent: string, clock: number) {
  const cx = gg.x + TILE / 2, cy = gg.y + TILE;
  ctx.save(); ctx.translate(cx, cy);
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(clock * 3);
  const rg = ctx.createRadialGradient(0, 0, 4, 0, 0, 70);
  rg.addColorStop(0, accent); rg.addColorStop(1, "transparent");
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  rr(ctx, -22, -52, 44, 104, 22);
  const pg = ctx.createLinearGradient(0, -52, 0, 52);
  pg.addColorStop(0, "rgba(255,255,255,0.95)"); pg.addColorStop(0.5, accent); pg.addColorStop(1, "rgba(255,255,255,0.6)");
  ctx.fillStyle = pg; ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = clock * 2 + i * 2.1, rad = 30;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(Math.cos(a) * rad, Math.sin(a) * (rad + 14), 3, 0, 7); ctx.fill();
  }
  ctx.fillStyle = INK; ctx.font = '700 13px "Bricolage Grotesque", sans-serif'; ctx.textAlign = "center";
  ctx.fillText("SORTIE", 0, 4);
  ctx.restore();
}
function drawEnemy(ctx: CanvasRenderingContext2D, e: SrvEnemy, clock: number) {
  const cx = e.x + e.w / 2;
  if (!e.alive) {
    const a = Math.max(0, 1 - e.dead * 2);
    ctx.globalAlpha = a; ctx.fillStyle = PAL.coral.deep;
    rr(ctx, e.x, e.y + e.h - 8, e.w, 8, 4); ctx.fill(); ctx.globalAlpha = 1; return;
  }
  const P = PAL.coral, r = e.w / 2 + 2, walk = Math.sin(clock * 8) * 2;
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(cx, e.y + e.h + 2, r * 0.7, 4, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(cx, e.y + e.h / 2 + walk);
  ctx.fillStyle = P.deep; ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rad = i % 2 ? r : r + 5; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); ctx.fill();
  const g = ctx.createRadialGradient(-4, -5, 2, 0, 0, r);
  g.addColorStop(0, P.hi); g.addColorStop(0.5, P.body); g.addColorStop(1, P.deep);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, 7); ctx.fill();
  const dir = e.dir;
  for (const s of [-1, 1]) {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s * 6 + dir * 2, -3, 5, 0, 7); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(s * 6 + dir * 3, -2, 2.5, 0, 7); ctx.fill();
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-11, -11); ctx.lineTo(-2, -7); ctx.moveTo(11, -11); ctx.lineTo(2, -7); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 8, 4, Math.PI, 0); ctx.stroke();
  ctx.restore();
}
function drawPlayer(ctx: CanvasRenderingContext2D, p: SrvPlayer) {
  const P = PAL[p.color] ?? PAL.purple;
  const cx = p.x + p.w / 2, baseY = p.y + p.h, dead = !p.alive;
  if (!dead) { ctx.fillStyle = "rgba(0,0,0,0.32)"; ctx.beginPath(); ctx.ellipse(cx, baseY + 2, p.w * 0.55, 5, 0, 0, 7); ctx.fill(); }
  let sq = p.squash; if (dead) sq = -0.1;
  const sx = 1 + sq * 0.55, sy = 1 - sq * 0.7;
  const bob = (p.onGround && Math.abs(p.vx) > 30) ? Math.sin(p.runT) * 2 : 0;
  const r = 22;
  ctx.save(); ctx.translate(cx, baseY - r + bob); ctx.scale(sx, sy);
  if (dead) ctx.rotate(Math.sin(p.deathT * 12) * 0.3);
  ctx.shadowColor = P.glow; ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(-r * 0.32, -r * 0.36, 2, 0, 0, r * 1.1);
  g.addColorStop(0, P.hi); g.addColorStop(0.45, P.body); g.addColorStop(1, P.deep);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 1.02, 0, 0, 7); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.4, r * 0.24, r * 0.16, -0.4, 0, 7); ctx.fill();
  const eo = p.facing * 3;
  if (dead) {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    for (const s of [-1, 1]) { const ex = s * 7; ctx.beginPath(); ctx.moveTo(ex - 3, -6); ctx.lineTo(ex + 3, 0); ctx.moveTo(ex + 3, -6); ctx.lineTo(ex - 3, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 9, 3.5, 0, Math.PI); ctx.stroke();
  } else {
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s * 7 + eo, -3, 5.2, 0, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(s * 7 + eo * 1.5, -2, 2.8, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s * 7 + eo * 1.5 + 1, -3.5, 1, 0, 7); ctx.fill();
    }
    ctx.fillStyle = INK;
    if (!p.onGround) { ctx.beginPath(); ctx.ellipse(eo, 9, 3.5, 4.5, 0, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(eo, 7, 4.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.fill(); }
    ctx.fillStyle = "rgba(255,62,165,0.4)";
    ctx.beginPath(); ctx.arc(-11, 4, 3.2, 0, 7); ctx.arc(11, 4, 3.2, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function drawHUD(ctx: CanvasRenderingContext2D, S: SrvState, mySlot: number) {
  ctx.save();
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillStyle = "rgba(14,8,40,0.55)"; rr(ctx, 20, 64, 320, 56, 16); ctx.fill();
  ctx.fillStyle = S.accent; ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.fillText("NIVEAU " + String(S.index + 1).padStart(2, "0") + " / " + String(S.levelCount).padStart(2, "0"), 38, 86);
  ctx.fillStyle = "#fff"; ctx.font = '800 24px "Bricolage Grotesque", sans-serif';
  ctx.fillText(S.name, 38, 110);
  const taken = (S.coinsTaken || []).filter(Boolean).length;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(14,8,40,0.55)"; rr(ctx, VW - 250, 64, 230, 56, 16); ctx.fill();
  ctx.fillStyle = "#FFD23F"; ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
  ctx.fillText("★ " + taken + "/" + S.starsTotal, VW - 150, 98);
  ctx.fillStyle = "#FF6B5B"; ctx.fillText("⟳ " + S.deaths, VW - 40, 98);
  // pastilles joueurs
  S.players.forEach((p, i) => {
    const x = VW / 2 - 150 + i * 168;
    const color = i === 0 ? "#7A4EE8" : "#FF3EA5";
    ctx.fillStyle = "rgba(14,8,40,0.55)"; rr(ctx, x, 68, 150, 40, 20); ctx.fill();
    ctx.save(); ctx.globalAlpha = p.alive ? 1 : 0.4;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + 22, 88, 13, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 19, 85, 2, 0, 7); ctx.arc(x + 26, 85, 2, 0, 7); ctx.fill();
    ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = p.alive ? "#fff" : "rgba(255,255,255,0.5)";
    ctx.font = '700 13px "DM Sans", sans-serif';
    const label = (p.name || `J${i + 1}`) + (i === mySlot ? " · toi" : "");
    ctx.fillText(label.length > 14 ? label.slice(0, 13) + "…" : label, x + 42, 93);
  });
  ctx.restore();
}
function drawOverlay(ctx: CanvasRenderingContext2D, S: SrvState) {
  const dim = (a: number) => { ctx.fillStyle = "rgba(8,4,22," + a + ")"; ctx.fillRect(0, 0, VW, VH); };
  ctx.textAlign = "center";
  if (S.status === "intro") {
    const a = Math.min(1, S.statusT * 4) * Math.min(1, (1.3 - S.statusT) * 4 + 0.4);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = S.accent; ctx.font = '900 72px "Bricolage Grotesque", sans-serif';
    ctx.fillText(S.name, VW / 2, VH / 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = '700 22px "DM Sans", sans-serif';
    ctx.fillText("Niveau " + (S.index + 1) + " · à deux — prêts ?", VW / 2, VH / 2 + 44);
    ctx.restore();
  } else if (S.status === "dead") {
    dim(0.45 * Math.min(1, S.statusT * 6));
    ctx.fillStyle = "#FF6B5B"; ctx.font = '900 64px "Bricolage Grotesque", sans-serif';
    ctx.fillText("AÏE !", VW / 2, VH / 2 - 6);
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = '700 22px "DM Sans", sans-serif';
    ctx.fillText("Un blob est tombé — on recommence ensemble", VW / 2, VH / 2 + 34);
  } else if (S.status === "clear") {
    dim(0.3);
    ctx.fillStyle = "#3DDC97"; ctx.font = '900 64px "Bricolage Grotesque", sans-serif';
    ctx.fillText("NIVEAU TERMINÉ !", VW / 2, VH / 2);
    ctx.fillStyle = "#fff"; ctx.font = '700 22px "DM Sans", sans-serif';
    ctx.fillText("Les deux blobs sont à la sortie ✦", VW / 2, VH / 2 + 40);
  }
  ctx.textAlign = "left";
}
