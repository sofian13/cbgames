import type { Party, Connection } from "partykit/server";

/**
 * Notre Île — base partagée et PERSISTANTE pour un couple.
 *
 * Chaque "room" = un code de couple stable (réutilisé à chaque session).
 * L'état de l'île vit dans party.storage (Durable Object), donc les deux
 * partenaires chargent la même île, et elle survit aux déconnexions.
 *
 * Idle-friendly : les bâtiments de production accumulent des ressources
 * dans le temps (même hors-ligne), récoltables via l'action "gather".
 */

// ── Catalogue (dupliqué côté client dans notre-ile-game.tsx) ──
interface BuildingDef {
  name: string;
  emoji: string;
  wood: number;
  stone: number;
  minLevel: number;
  prod: { wood?: number; stone?: number; stars?: number }; // par heure
  xp: number;
  cat: "prod" | "deco" | "special";
}

const BUILDINGS: Record<string, BuildingDef> = {
  scierie: { name: "Scierie", emoji: "🪚", wood: 10, stone: 0, minLevel: 1, prod: { wood: 6 }, xp: 8, cat: "prod" },
  carriere: { name: "Carrière", emoji: "⛏️", wood: 16, stone: 4, minLevel: 1, prod: { stone: 5 }, xp: 10, cat: "prod" },
  jardin: { name: "Jardin", emoji: "🌻", wood: 8, stone: 0, minLevel: 1, prod: { stars: 2 }, xp: 8, cat: "prod" },
  maison: { name: "Maison", emoji: "🏠", wood: 22, stone: 12, minLevel: 2, prod: { stars: 1 }, xp: 14, cat: "prod" },
  arbre: { name: "Arbre", emoji: "🌲", wood: 3, stone: 0, minLevel: 1, prod: {}, xp: 2, cat: "deco" },
  fleur: { name: "Massif", emoji: "🌷", wood: 2, stone: 0, minLevel: 1, prod: {}, xp: 2, cat: "deco" },
  fontaine: { name: "Fontaine", emoji: "⛲", wood: 14, stone: 10, minLevel: 2, prod: { stars: 1 }, xp: 12, cat: "deco" },
  statue: { name: "Statue", emoji: "🗿", wood: 8, stone: 22, minLevel: 2, prod: {}, xp: 10, cat: "deco" },
  phare: { name: "Phare", emoji: "🗼", wood: 50, stone: 40, minLevel: 3, prod: { stars: 4 }, xp: 30, cat: "special" },
  pont: { name: "Pont fleuri", emoji: "🌉", wood: 26, stone: 16, minLevel: 3, prod: { stars: 2 }, xp: 16, cat: "special" },
};

const COLS = 6;
const ROWS = 5;
const LEVEL_XP = [0, 40, 110, 220, 380]; // seuils (niveaux 1..5)
const UNLOCK_WOOD = 15;
const UNLOCK_STONE = 10;
const GATHER_CAP_H = 12; // accumulation max en heures
const MS_PER_DAY = 86_400_000;

interface Tile {
  locked: boolean;
  building: string | null;
}
interface LogEntry {
  who: string;
  text: string;
  at: number;
}
interface Island {
  name: string;
  wood: number;
  stone: number;
  stars: number;
  xp: number;
  tiles: Tile[];
  log: LogEntry[];
  lastGather: number;
  createdAt: number;
  streak: number;
  lastDay: number;
}

function levelFromXp(xp: number): number {
  let lvl = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) lvl = i + 1;
  return lvl;
}

function newIsland(now: number): Island {
  const tiles: Tile[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      tiles.push({ locked: c >= 3, building: null });
    }
  }
  return {
    name: "Notre Île",
    wood: 30,
    stone: 12,
    stars: 0,
    xp: 0,
    tiles,
    log: [{ who: "—", text: "Une nouvelle île émerge de l'océan 🌊", at: now }],
    lastGather: now,
    createdAt: now,
    streak: 0,
    lastDay: 0,
  };
}

function ratePerHour(island: Island): { wood: number; stone: number; stars: number } {
  const rate = { wood: 0, stone: 0, stars: 0 };
  for (const t of island.tiles) {
    if (!t.building) continue;
    const def = BUILDINGS[t.building];
    if (!def) continue;
    rate.wood += def.prod.wood ?? 0;
    rate.stone += def.prod.stone ?? 0;
    rate.stars += def.prod.stars ?? 0;
  }
  return rate;
}

function pendingGather(island: Island, now: number) {
  const rate = ratePerHour(island);
  const hours = Math.min(GATHER_CAP_H, (now - island.lastGather) / 3_600_000);
  return {
    wood: Math.floor(rate.wood * hours),
    stone: Math.floor(rate.stone * hours),
    stars: Math.floor(rate.stars * hours),
  };
}

export default class IslandServer {
  party: Party;
  island: Island | null = null;
  names: Map<string, string> = new Map();

  constructor(party: Party) {
    this.party = party;
  }

  async load(now: number): Promise<Island> {
    if (this.island) return this.island;
    const stored = await this.party.storage.get<Island>("island");
    this.island = stored ?? newIsland(now);
    return this.island;
  }

  async save() {
    if (this.island) await this.party.storage.put("island", this.island);
  }

  pushLog(who: string, text: string, now: number) {
    if (!this.island) return;
    this.island.log.unshift({ who, text, at: now });
    if (this.island.log.length > 30) this.island.log.length = 30;
  }

  broadcastState() {
    if (!this.island) return;
    const now = Date.now();
    const payload = {
      ...this.island,
      level: levelFromXp(this.island.xp),
      rate: ratePerHour(this.island),
      pending: pendingGather(this.island, now),
      now,
      cols: COLS,
      rows: ROWS,
    };
    this.party.broadcast(JSON.stringify({ type: "island-state", payload }));
  }

  async onStart() {
    await this.load(Date.now());
  }

  async onConnect(conn: Connection) {
    const now = Date.now();
    const island = await this.load(now);

    // Streak quotidien (jour UTC) — bonus une fois par nouveau jour.
    const today = Math.floor(now / MS_PER_DAY);
    if (island.lastDay !== today) {
      if (island.lastDay === today - 1) island.streak += 1;
      else island.streak = 1;
      island.lastDay = today;
      const bonusWood = 10 + island.streak * 2;
      const bonusStars = 3 + island.streak;
      island.wood += bonusWood;
      island.stars += bonusStars;
      this.pushLog("☀️", `Jour ${island.streak} de suite ! +${bonusWood}🪵 +${bonusStars}⭐`, now);
      await this.save();
    }
    conn.send(JSON.stringify({ type: "island-state", payload: this.statePayload(now) }));
  }

  statePayload(now: number) {
    const island = this.island!;
    return {
      ...island,
      level: levelFromXp(island.xp),
      rate: ratePerHour(island),
      pending: pendingGather(island, now),
      now,
      cols: COLS,
      rows: ROWS,
    };
  }

  async onMessage(message: string, sender: Connection) {
    let msg: { type: string; payload?: Record<string, unknown> };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    const now = Date.now();
    const island = await this.load(now);
    const p = msg.payload ?? {};

    if (msg.type === "hello") {
      const name = (p.name as string)?.slice(0, 16) || "Quelqu'un";
      this.names.set(sender.id, name);
      return;
    }

    const who = this.names.get(sender.id) ?? "Quelqu'un";

    if (msg.type === "action") {
      const action = p.action as string;

      if (action === "gather") {
        const pend = pendingGather(island, now);
        if (pend.wood + pend.stone + pend.stars <= 0) return;
        island.wood += pend.wood;
        island.stone += pend.stone;
        island.stars += pend.stars;
        island.lastGather = now;
        this.pushLog(who, `a récolté +${pend.wood}🪵 +${pend.stone}🪨 +${pend.stars}⭐`, now);
        await this.save();
        this.broadcastState();
        return;
      }

      if (action === "build") {
        const idx = Number(p.tile);
        const id = p.building as string;
        const def = BUILDINGS[id];
        const tile = island.tiles[idx];
        if (!def || !tile || tile.locked || tile.building) return;
        if (levelFromXp(island.xp) < def.minLevel) return;
        if (island.wood < def.wood || island.stone < def.stone) return;
        island.wood -= def.wood;
        island.stone -= def.stone;
        const before = levelFromXp(island.xp);
        island.xp += def.xp;
        const after = levelFromXp(island.xp);
        tile.building = id;
        this.pushLog(who, `a construit ${def.emoji} ${def.name}`, now);
        if (after > before) this.pushLog("🎉", `L'île passe niveau ${after} !`, now);
        await this.save();
        this.broadcastState();
        return;
      }

      if (action === "remove") {
        const idx = Number(p.tile);
        const tile = island.tiles[idx];
        if (!tile || !tile.building) return;
        const def = BUILDINGS[tile.building];
        if (def) {
          // remboursement 50%
          island.wood += Math.floor(def.wood / 2);
          island.stone += Math.floor(def.stone / 2);
          this.pushLog(who, `a démoli ${def.emoji} ${def.name}`, now);
        }
        tile.building = null;
        await this.save();
        this.broadcastState();
        return;
      }

      if (action === "unlock") {
        const idx = Number(p.tile);
        const tile = island.tiles[idx];
        if (!tile || !tile.locked) return;
        // doit être adjacent à une case déverrouillée
        const c = idx % COLS;
        const r = Math.floor(idx / COLS);
        const neighbors = [
          [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
        ];
        const adjacentUnlocked = neighbors.some(([nr, nc]) => {
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
          return !island.tiles[nr * COLS + nc].locked;
        });
        if (!adjacentUnlocked) return;
        if (island.wood < UNLOCK_WOOD || island.stone < UNLOCK_STONE) return;
        island.wood -= UNLOCK_WOOD;
        island.stone -= UNLOCK_STONE;
        tile.locked = false;
        island.xp += 4;
        this.pushLog(who, `a agrandi l'île 🏝️ (+1 terrain)`, now);
        await this.save();
        this.broadcastState();
        return;
      }

      if (action === "rename") {
        const name = (p.name as string)?.trim().slice(0, 24);
        if (!name) return;
        island.name = name;
        this.pushLog(who, `a renommé l'île « ${name} »`, now);
        await this.save();
        this.broadcastState();
        return;
      }
    }
  }
}
