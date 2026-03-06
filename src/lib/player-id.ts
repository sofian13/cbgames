const PLAYER_SESSION_KEY = "af-games-player-session";

function randomSessionToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getSessionScopedPlayerId(baseId: string) {
  if (typeof window === "undefined") return baseId;
  let sessionToken = sessionStorage.getItem(PLAYER_SESSION_KEY);
  if (!sessionToken) {
    sessionToken = randomSessionToken();
    sessionStorage.setItem(PLAYER_SESSION_KEY, sessionToken);
  }
  return `${baseId}:${sessionToken}`;
}

