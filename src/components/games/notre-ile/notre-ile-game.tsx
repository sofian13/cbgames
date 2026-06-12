"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PartySocket from "partysocket";
import { getPartyKitHost, getPartyKitWsProtocol } from "@/lib/party/host";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Catalogue (dupliqué du serveur party/island.ts) ───────
type Cat = "prod" | "deco" | "special";
interface BDef {
  name: string; emoji: string; wood: number; stone: number;
  minLevel: number; prod: { wood?: number; stone?: number; stars?: number }; cat: Cat;
}
const BUILDINGS: Record<string, BDef> = {
  scierie: { name: "Scierie", emoji: "🪚", wood: 10, stone: 0, minLevel: 1, prod: { wood: 6 }, cat: "prod" },
  carriere: { name: "Carrière", emoji: "⛏️", wood: 16, stone: 4, minLevel: 1, prod: { stone: 5 }, cat: "prod" },
  jardin: { name: "Jardin", emoji: "🌻", wood: 8, stone: 0, minLevel: 1, prod: { stars: 2 }, cat: "prod" },
  maison: { name: "Maison", emoji: "🏠", wood: 22, stone: 12, minLevel: 2, prod: { stars: 1 }, cat: "prod" },
  arbre: { name: "Arbre", emoji: "🌲", wood: 3, stone: 0, minLevel: 1, prod: {}, cat: "deco" },
  fleur: { name: "Massif", emoji: "🌷", wood: 2, stone: 0, minLevel: 1, prod: {}, cat: "deco" },
  fontaine: { name: "Fontaine", emoji: "⛲", wood: 14, stone: 10, minLevel: 2, prod: { stars: 1 }, cat: "deco" },
  statue: { name: "Statue", emoji: "🗿", wood: 8, stone: 22, minLevel: 2, prod: {}, cat: "deco" },
  phare: { name: "Phare", emoji: "🗼", wood: 50, stone: 40, minLevel: 3, prod: { stars: 4 }, cat: "special" },
  pont: { name: "Pont fleuri", emoji: "🌉", wood: 26, stone: 16, minLevel: 3, prod: { stars: 2 }, cat: "special" },
};
const CAT_LABEL: Record<Cat, string> = { prod: "🏭 Production", deco: "🌷 Déco", special: "✨ Spécial" };
const UNLOCK_WOOD = 15;
const UNLOCK_STONE = 10;
const CODE_KEY = "island-couple-code";

interface Tile { locked: boolean; building: string | null; }
interface LogEntry { who: string; text: string; at: number; }
interface IslandState {
  name: string; wood: number; stone: number; stars: number; xp: number;
  tiles: Tile[]; log: LogEntry[]; lastGather: number; createdAt: number;
  streak: number; level: number;
  rate: { wood: number; stone: number; stars: number };
  pending: { wood: number; stone: number; stars: number };
  now: number; cols: number; rows: number;
}

// ══════════════════════════════════════════════════════════
export default function NotreIleGame({ playerName, onReturnToLobby }: GameProps) {
  const [code, setCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CODE_KEY);
      if (saved) setCode(saved);
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const join = (c: string) => {
    const clean = c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (clean.length < 3) return;
    try { window.localStorage.setItem(CODE_KEY, clean); } catch { /* ignore */ }
    setCode(clean);
  };
  const leave = () => {
    try { window.localStorage.removeItem(CODE_KEY); } catch { /* ignore */ }
    setCode(null);
  };

  if (!ready) return <Centered text="Chargement…" />;
  if (!code) return <CodeEntry onJoin={join} onBack={onReturnToLobby} />;
  return <IslandBoard code={code} name={playerName} onLeave={leave} onReturnToLobby={onReturnToLobby} />;
}

// ── Saisie du code de couple ──────────────────────────────
function CodeEntry({ onJoin, onBack }: { onJoin: (c: string) => void; onBack?: () => void }) {
  const [c, setC] = useState("");
  const gen = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let r = "";
    for (let i = 0; i < 5; i++) r += chars[Math.floor(Math.random() * chars.length)];
    setC(r);
  };
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
      style={{ background: "radial-gradient(circle at 50% 18%, rgba(78,205,196,0.3), transparent 50%), linear-gradient(180deg, #06283D 0%, #0A1A2E 100%)" }}>
      <div className="text-6xl">🏝️</div>
      <h1 className="cb-display-lg mt-2">Notre Île</h1>
      <p className="mt-2 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>
        Une base que vous construisez à deux et qui vous attend entre les sessions.
        Choisissez un <b>code de couple</b> — vous le réutiliserez tous les deux à chaque fois.
      </p>

      <div className="mt-7 w-full max-w-xs">
        <input
          value={c} onChange={(e) => setC(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
          placeholder="EX : NOUS42"
          className="w-full rounded-2xl border px-5 py-4 text-center text-2xl font-bold tracking-[0.3em] outline-none"
          style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(78,205,196,0.5)", color: "#fff", fontFamily: "var(--font-display)" }}
        />
        <div className="mt-2 flex justify-center">
          <button onClick={gen} className="text-xs underline" style={{ color: "var(--text-muted)" }}>🎲 générer un code au hasard</button>
        </div>
        <button onClick={() => onJoin(c)} disabled={c.length < 3}
          className="af-btn af-btn-primary mt-4 w-full disabled:opacity-40" style={{ fontSize: 16 }}>
          Rejoindre notre île →
        </button>
        <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
          Donne le même code à ton/ta partenaire pour qu&apos;il rejoigne la même île.
        </p>
      </div>
      {onBack && <button onClick={onBack} className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>← Lobby</button>}
    </div>
  );
}

// ── Plateau de l'île ──────────────────────────────────────
type Sheet =
  | { kind: "build"; tile: number }
  | { kind: "tile"; tile: number }
  | { kind: "unlock"; tile: number }
  | { kind: "rename" }
  | null;

function IslandBoard({ code, name, onLeave, onReturnToLobby }: {
  code: string; name: string; onLeave: () => void; onReturnToLobby?: () => void;
}) {
  const [state, setState] = useState<IslandState | null>(null);
  const [connected, setConnected] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const socketRef = useRef<PartySocket | null>(null);
  const offsetRef = useRef(0); // serverNow - clientNow
  const [, force] = useState(0);

  useEffect(() => {
    const host = getPartyKitHost();
    const socket = new PartySocket({ host, room: code, party: "island", protocol: getPartyKitWsProtocol(host) });
    socketRef.current = socket;
    socket.addEventListener("open", () => {
      setConnected(true);
      socket.send(JSON.stringify({ type: "hello", payload: { name } }));
    });
    socket.addEventListener("message", (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "island-state") {
          const s = msg.payload as IslandState;
          offsetRef.current = s.now - Date.now();
          setState(s);
        }
      } catch { /* ignore */ }
    });
    socket.addEventListener("close", () => setConnected(false));
    return () => { socket.close(); socketRef.current = null; };
  }, [code, name]);

  // Tick pour la récolte "live"
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const send = useCallback((action: string, extra: Record<string, unknown> = {}) => {
    socketRef.current?.send(JSON.stringify({ type: "action", payload: { action, ...extra } }));
  }, []);

  // Récolte estimée localement (rate × temps écoulé), capée à 12h
  const livePending = useMemo(() => {
    if (!state) return { wood: 0, stone: 0, stars: 0 };
    const now = Date.now() + offsetRef.current;
    const hours = Math.min(12, (now - state.lastGather) / 3_600_000);
    return {
      wood: Math.floor(state.rate.wood * hours),
      stone: Math.floor(state.rate.stone * hours),
      stars: Math.floor(state.rate.stars * hours),
    };
  }, [state, Math.floor((Date.now() + offsetRef.current) / 1000)]);

  if (!state) return <Centered text={connected ? "Accostage sur l'île…" : "Connexion à l'île…"} />;

  const canAfford = (w: number, s: number) => state.wood >= w && state.stone >= s;
  const pendingTotal = livePending.wood + livePending.stone + livePending.stars;

  const onTileTap = (idx: number) => {
    const t = state.tiles[idx];
    if (t.locked) {
      // déverrouillable seulement si adjacent à une case ouverte
      const c = idx % state.cols, r = Math.floor(idx / state.cols);
      const adj = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([nr, nc]) =>
        nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols && !state.tiles[nr * state.cols + nc].locked);
      if (adj) setSheet({ kind: "unlock", tile: idx });
      return;
    }
    if (t.building) setSheet({ kind: "tile", tile: idx });
    else setSheet({ kind: "build", tile: idx });
  };

  return (
    <div className="relative flex min-h-[100svh] flex-col text-white"
      style={{ background: "linear-gradient(180deg, #06283D 0%, #0A1A2E 100%)" }}>

      {/* Barre ressources */}
      <div className="sticky top-0 z-20 px-3 py-2 backdrop-blur-md"
        style={{ background: "rgba(6,40,61,0.85)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setSheet({ kind: "rename" })} className="min-w-0 text-left">
            <p className="truncate text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>🏝️ {state.name}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Code {code} · ✏️</p>
          </button>
          <div className="flex items-center gap-1.5">
            <Res emoji="🪵" v={state.wood} rate={state.rate.wood} />
            <Res emoji="🪨" v={state.stone} rate={state.rate.stone} />
            <Res emoji="⭐" v={state.stars} rate={state.rate.stars} />
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="af-chip" style={{ background: "rgba(78,205,196,0.16)", borderColor: "rgba(78,205,196,0.35)", color: "#4ECDC4" }}>
            🏆 Niveau {state.level}
          </span>
          {state.streak > 0 && (
            <span className="af-chip" style={{ background: "rgba(255,140,0,0.16)", borderColor: "rgba(255,140,0,0.32)", color: "#FFA640" }}>
              🔥 {state.streak} j
            </span>
          )}
          <button onClick={() => send("gather")} disabled={pendingTotal <= 0}
            className="af-btn af-btn-primary disabled:opacity-30"
            style={{ padding: "6px 14px", fontSize: 12 }}>
            {pendingTotal > 0
              ? `Récolter ${livePending.wood ? `+${livePending.wood}🪵 ` : ""}${livePending.stone ? `+${livePending.stone}🪨 ` : ""}${livePending.stars ? `+${livePending.stars}⭐` : ""}`.trim()
              : "Rien à récolter"}
          </button>
        </div>
      </div>

      {/* Grille / île */}
      <div className="flex flex-1 items-center justify-center p-3">
        <div className="w-full max-w-md rounded-3xl p-3"
          style={{ background: "linear-gradient(160deg, #0E4D64, #0a3346)", boxShadow: "inset 0 0 50px rgba(0,0,0,0.4)" }}>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${state.cols}, minmax(0,1fr))` }}>
            {state.tiles.map((t, i) => (
              <TileView key={i} tile={t} onTap={() => onTileTap(i)} />
            ))}
          </div>
        </div>
      </div>

      {/* Journal partagé */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl border p-2.5" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="af-eyebrow mb-1">Journal de l&apos;île</p>
          <div className="max-h-24 space-y-0.5 overflow-y-auto">
            {state.log.slice(0, 8).map((l, i) => (
              <p key={i} className="text-[11px] leading-snug" style={{ color: i === 0 ? "#fff" : "var(--text-dim)" }}>
                <b style={{ color: "var(--text-muted)" }}>{l.who}</b> {l.text}
              </p>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-3">
          <button onClick={onLeave} className="text-[11px]" style={{ color: "var(--text-muted)" }}>↪ changer d&apos;île</button>
          {onReturnToLobby && <button onClick={onReturnToLobby} className="text-[11px]" style={{ color: "var(--text-muted)" }}>← lobby</button>}
        </div>
      </div>

      {/* Feuilles (sheets) */}
      {sheet?.kind === "build" && (
        <BuildSheet
          level={state.level} canAfford={canAfford}
          onPick={(id) => { send("build", { tile: sheet.tile, building: id }); setSheet(null); }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === "tile" && (() => {
        const id = state.tiles[sheet.tile].building!;
        const def = BUILDINGS[id];
        return (
          <BottomSheet onClose={() => setSheet(null)}>
            <div className="text-center">
              <div className="text-5xl">{def?.emoji}</div>
              <p className="cb-display-sm mt-1">{def?.name}</p>
              {def && (def.prod.wood || def.prod.stone || def.prod.stars) ? (
                <p className="mt-1 text-xs" style={{ color: "#4ECDC4" }}>
                  Produit {def.prod.wood ? `+${def.prod.wood}🪵 ` : ""}{def.prod.stone ? `+${def.prod.stone}🪨 ` : ""}{def.prod.stars ? `+${def.prod.stars}⭐` : ""} /h
                </p>
              ) : <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Décoration</p>}
              <button onClick={() => { send("remove", { tile: sheet.tile }); setSheet(null); }}
                className="af-btn af-btn-ghost mt-4 w-full">Démolir (récupère 50%)</button>
            </div>
          </BottomSheet>
        );
      })()}
      {sheet?.kind === "unlock" && (
        <BottomSheet onClose={() => setSheet(null)}>
          <div className="text-center">
            <div className="text-5xl">🏝️</div>
            <p className="cb-display-sm mt-1">Agrandir l&apos;île</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>Gagne un nouveau terrain constructible.</p>
            <p className="mt-2 font-bold" style={{ color: canAfford(UNLOCK_WOOD, UNLOCK_STONE) ? "#4ECDC4" : "#ff6b6b" }}>
              Coût : {UNLOCK_WOOD}🪵 {UNLOCK_STONE}🪨
            </p>
            <button onClick={() => { send("unlock", { tile: sheet.tile }); setSheet(null); }}
              disabled={!canAfford(UNLOCK_WOOD, UNLOCK_STONE)}
              className="af-btn af-btn-primary mt-4 w-full disabled:opacity-40">Déverrouiller</button>
          </div>
        </BottomSheet>
      )}
      {sheet?.kind === "rename" && (
        <RenameSheet current={state.name} onSave={(n) => { send("rename", { name: n }); setSheet(null); }} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────
function Res({ emoji, v, rate }: { emoji: string; v: number; rate: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: "rgba(255,255,255,0.06)" }}>
      <span className="text-sm">{emoji}</span>
      <span className="cb-mono text-sm font-bold">{v}</span>
      {rate > 0 && <span className="text-[9px]" style={{ color: "#4ECDC4" }}>+{rate}/h</span>}
    </div>
  );
}

function TileView({ tile, onTap }: { tile: Tile; onTap: () => void }) {
  const def = tile.building ? BUILDINGS[tile.building] : null;
  return (
    <button onClick={onTap}
      className="relative flex aspect-square items-center justify-center rounded-lg transition active:scale-90"
      style={{
        background: tile.locked
          ? "repeating-linear-gradient(45deg, #0a2738, #0a2738 6px, #0d2f43 6px, #0d2f43 12px)"
          : "linear-gradient(160deg, #4CAF50, #3d8b40)",
        boxShadow: tile.locked ? "none" : "inset 0 -3px 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)",
        opacity: tile.locked ? 0.55 : 1,
      }}>
      {tile.locked ? (
        <span className="text-sm opacity-70">🔒</span>
      ) : def ? (
        <span style={{ fontSize: "clamp(16px, 6vw, 28px)", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))" }}>{def.emoji}</span>
      ) : (
        <span className="text-lg" style={{ color: "rgba(255,255,255,0.35)" }}>+</span>
      )}
    </button>
  );
}

function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border-t p-5 pb-8"
        style={{ background: "#0A1A2E", borderColor: "rgba(255,255,255,0.12)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        {children}
      </div>
    </div>
  );
}

function BuildSheet({ level, canAfford, onPick, onClose }: {
  level: number;
  canAfford: (w: number, s: number) => boolean;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const cats: Cat[] = ["prod", "deco", "special"];
  return (
    <BottomSheet onClose={onClose}>
      <p className="cb-display-sm mb-1 text-center">Construire ici</p>
      <p className="mb-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>Niveau {level} · plus tu construis, plus l&apos;île monte</p>
      <div className="max-h-[55vh] space-y-3 overflow-y-auto">
        {cats.map((cat) => {
          const items = Object.entries(BUILDINGS).filter(([, d]) => d.cat === cat);
          return (
            <div key={cat}>
              <p className="af-eyebrow mb-1.5">{CAT_LABEL[cat]}</p>
              <div className="grid grid-cols-2 gap-2">
                {items.map(([id, d]) => {
                  const afford = canAfford(d.wood, d.stone);
                  const locked = level < d.minLevel;
                  const dis = !afford || locked;
                  return (
                    <button key={id} onClick={() => !dis && onPick(id)} disabled={dis}
                      className={cn("rounded-2xl border p-2.5 text-left transition active:scale-95")}
                      style={{
                        background: dis ? "rgba(255,255,255,0.03)" : "rgba(76,175,80,0.12)",
                        borderColor: dis ? "rgba(255,255,255,0.08)" : "rgba(76,175,80,0.4)",
                        opacity: dis ? 0.5 : 1,
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{d.emoji}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">{d.name}</p>
                          <p className="text-[10px]" style={{ color: locked ? "#ff6b6b" : "var(--text-dim)" }}>
                            {locked ? `Niv. ${d.minLevel} requis` : `${d.wood ? `${d.wood}🪵` : ""} ${d.stone ? `${d.stone}🪨` : ""}`.trim()}
                          </p>
                        </div>
                      </div>
                      {(d.prod.wood || d.prod.stone || d.prod.stars) ? (
                        <p className="mt-1 text-[9px]" style={{ color: "#4ECDC4" }}>
                          {d.prod.wood ? `+${d.prod.wood}🪵 ` : ""}{d.prod.stone ? `+${d.prod.stone}🪨 ` : ""}{d.prod.stars ? `+${d.prod.stars}⭐` : ""}/h
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}

function RenameSheet({ current, onSave, onClose }: { current: string; onSave: (n: string) => void; onClose: () => void }) {
  const [n, setN] = useState(current);
  return (
    <BottomSheet onClose={onClose}>
      <p className="cb-display-sm mb-3 text-center">Nommer l&apos;île</p>
      <input value={n} onChange={(e) => setN(e.target.value.slice(0, 24))} autoFocus
        className="w-full rounded-2xl border px-4 py-3 text-center outline-none"
        style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(78,205,196,0.5)", color: "#fff", fontFamily: "var(--font-display)" }} />
      <button onClick={() => n.trim() && onSave(n.trim())} className="af-btn af-btn-primary mt-3 w-full">Enregistrer</button>
    </BottomSheet>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div className="flex min-h-[100svh] flex-1 flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(180deg, #06283D 0%, #0A1A2E 100%)" }}>
      <div className="text-5xl">🏝️</div>
      <p className="mt-4 animate-pulse text-center text-lg" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}
