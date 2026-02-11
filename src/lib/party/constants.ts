export const ROOM_CODE_LENGTH = 4;
export const MAX_PLAYERS = 8;
export const MIN_PLAYERS_TO_START = 2;
export const READY_CHECK_TIMEOUT = 30_000; // 30s
export const HEARTBEAT_INTERVAL = 10_000; // 10s
export const DISCONNECT_TIMEOUT = 15_000; // 15s before removing player

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}
