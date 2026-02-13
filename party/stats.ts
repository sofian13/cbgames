import type { Party } from "partykit/server";

interface PlayerStats {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  topRank: number;
  lastPlayed: number;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default class StatsServer {
  party: Party;

  constructor(party: Party) {
    this.party = party;
  }

  async onRequest(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(req.url);

    try {
      // GET /parties/stats/global?action=get-stats&playerId=xxx
      if (req.method === "GET") {
        const action = url.searchParams.get("action");

        if (action === "get-stats") {
          const playerId = url.searchParams.get("playerId");
          if (!playerId) return this.json({ error: "Missing playerId" }, 400);
          const stats = await this.party.storage.get<PlayerStats>(`player:${playerId}`);
          return this.json(stats ?? null);
        }

        if (action === "leaderboard") {
          const limit = Math.min(50, Number(url.searchParams.get("limit")) || 20);
          const all = await this.party.storage.list<PlayerStats>({ prefix: "player:" });
          const sorted = Array.from(all.values())
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit);
          return this.json(sorted);
        }

        return this.json({ error: "Unknown action" }, 400);
      }

      // POST /parties/stats/global
      if (req.method === "POST") {
        const body = await req.json() as Record<string, unknown>;
        const action = body.action as string;

        if (action === "save-result") {
          const { playerId, playerName, rank, score } = body as {
            playerId: string; playerName: string; rank: number; score: number;
          };
          if (!playerId || !playerName) return this.json({ error: "Missing fields" }, 400);

          const key = `player:${playerId}`;
          const current = await this.party.storage.get<PlayerStats>(key) ?? {
            playerId, playerName, totalPoints: 0, gamesPlayed: 0, wins: 0, topRank: 999, lastPlayed: 0,
          };

          const rankBonus = rank === 1 ? 50 : rank === 2 ? 25 : rank === 3 ? 10 : 0;
          const earnedPoints = Math.max(0, Math.round(score / 10)) + rankBonus + 5;

          current.playerName = playerName; // Update name in case it changed
          current.totalPoints += earnedPoints;
          current.gamesPlayed += 1;
          if (rank === 1) current.wins += 1;
          if (rank < current.topRank) current.topRank = rank;
          current.lastPlayed = Date.now();

          await this.party.storage.put(key, current);

          return this.json({ earnedPoints, stats: current });
        }

        return this.json({ error: "Unknown action" }, 400);
      }

      return this.json({ error: "Method not allowed" }, 405);
    } catch (err) {
      return this.json({ error: "Internal error" }, 500);
    }
  }

  json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}
