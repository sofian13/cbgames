import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";

/* ──────────────────────────────────────────────────────────────
   ESCAPE DUO — coop 2 joueurs asymetrique.
   J1 = Atelier/Cave, J2 = Bibliotheque/Observatoire. Chacun joue
   sa piece ; les infos s'echangent A L'ORAL. Le serveur attribue
   les roles (ordre d'arrivee) et synchronise progression + niveau
   pour avancer/gagner ensemble.
   ────────────────────────────────────────────────────────────── */

type RoleId = "atelier" | "biblio";

interface RoleProgress {
  items: string[];
  clues: string[];
  escaped: boolean;
  hintsUsed: number;
  // niv.1 atelier
  brickFound: boolean; drawerOpen: boolean; clockSet: boolean; safeOpen: boolean;
  // niv.1 biblio
  lampFound: boolean; lampOn: boolean; bookOpen: boolean; calendarSeen: boolean; vitrineOpen: boolean;
  // niv.2 cave
  tonneauFound: boolean; chestOpen: boolean; boilerSet: boolean;
  // niv.2 observatoire
  noteFound: boolean; starmapSeen: boolean; telescopeSet: boolean;
}

function freshProgress(): RoleProgress {
  return {
    items: [], clues: [], escaped: false, hintsUsed: 0,
    brickFound: false, drawerOpen: false, clockSet: false, safeOpen: false,
    lampFound: false, lampOn: false, bookOpen: false, calendarSeen: false, vitrineOpen: false,
    tonneauFound: false, chestOpen: false, boilerSet: false,
    noteFound: false, starmapSeen: false, telescopeSet: false,
  };
}

const BOOL_FLAGS = new Set<keyof RoleProgress>([
  "brickFound", "drawerOpen", "clockSet", "safeOpen",
  "lampFound", "lampOn", "bookOpen", "calendarSeen", "vitrineOpen",
  "tonneauFound", "chestOpen", "boilerSet",
  "noteFound", "starmapSeen", "telescopeSet",
]);

export class EscapeDuoGame extends BaseGame {
  joinOrder: string[] = [];
  level: 1 | 2 = 1;
  startEpoch: number | null = null;
  finishElapsed: number | null = null;
  progress: Record<RoleId, RoleProgress> = { atelier: freshProgress(), biblio: freshProgress() };

  addPlayer(id: string, name: string, conn: Connection) {
    super.addPlayer(id, name, conn);
    if (!this.joinOrder.includes(id) && !this.isBot(id)) this.joinOrder.push(id);
  }

  humanOrder(): string[] {
    return this.joinOrder.filter((id) => this.players.has(id));
  }

  roleOf(playerId: string): RoleId | null {
    const order = this.humanOrder();
    if (order[0] === playerId) return "atelier";
    if (order[1] === playerId) return "biblio";
    return null;
  }

  resetProgress() {
    this.progress = { atelier: freshProgress(), biblio: freshProgress() };
  }

  start() {
    if (this.started) return;
    if (this.humanOrder().length < 2) return;
    this.started = true;
    this.level = 1;
    this.startEpoch = Date.now();
    this.finishElapsed = null;
    this.resetProgress();
    this.broadcastState();
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const me = [...this.players.values()].find((p) => p.connectionId === sender.id);
    if (!me) return;
    const action = payload.action as string;

    if (action === "start") { this.start(); return; }
    if (action === "restart") {
      this.started = false;
      this.level = 1;
      this.startEpoch = null;
      this.finishElapsed = null;
      this.resetProgress();
      this.broadcastState();
      return;
    }

    const role = this.roleOf(me.id);
    if (!role || !this.started) return;
    const P = this.progress[role];

    switch (action) {
      case "flag": {
        const key = payload.key as keyof RoleProgress;
        if (BOOL_FLAGS.has(key)) (P[key] as boolean) = !!payload.value;
        break;
      }
      case "item": {
        const id = payload.id as string;
        if (id && !P.items.includes(id)) P.items.push(id);
        break;
      }
      case "clue": {
        const text = payload.text as string;
        if (text && !P.clues.includes(text)) P.clues.push(text);
        break;
      }
      case "hint":
        P.hintsUsed++;
        break;
      case "escaped": {
        P.escaped = true;
        if (
          this.level === 2 &&
          this.progress.atelier.escaped &&
          this.progress.biblio.escaped &&
          this.finishElapsed == null
        ) {
          this.finishElapsed = this.startEpoch ? (Date.now() - this.startEpoch) / 1000 : 0;
        }
        break;
      }
      case "next-level": {
        if (this.level === 1 && this.progress.atelier.escaped && this.progress.biblio.escaped) {
          this.level = 2;
          this.resetProgress();
        }
        break;
      }
    }
    this.broadcastState();
  }

  getState(): Record<string, unknown> {
    const order = this.humanOrder();
    const roles = {
      atelier: order[0] ? { id: order[0], name: this.players.get(order[0])!.name } : null,
      biblio: order[1] ? { id: order[1], name: this.players.get(order[1])!.name } : null,
    };
    const bothEscaped = this.progress.atelier.escaped && this.progress.biblio.escaped;
    return {
      started: this.started,
      level: this.level,
      startEpoch: this.startEpoch,
      finishElapsed: this.finishElapsed,
      roles,
      progress: this.progress,
      bothEscaped,
      finished: this.level === 2 && bothEscaped,
    };
  }

  cleanup() {}
}
