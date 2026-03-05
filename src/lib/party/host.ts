const DEFAULT_PROD_PARTYKIT_HOST = "af-games.rayanesabi.partykit.dev";

function isLocalHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.");
}

export function getPartyKitHost() {
  const configuredHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST?.trim();
  if (configuredHost) return configuredHost;

  if (typeof window !== "undefined") {
    const browserHost = window.location.hostname;
    if (browserHost === "localhost" || browserHost === "127.0.0.1") {
      return "localhost:1999";
    }
  }

  const fallbackHost = process.env.NEXT_PUBLIC_PARTYKIT_FALLBACK_HOST?.trim();
  return fallbackHost || DEFAULT_PROD_PARTYKIT_HOST;
}

export function getPartyKitWsProtocol(host: string) {
  return isLocalHost(host) ? "ws" : "wss";
}

export function getPartyKitHttpProtocol(host: string) {
  return isLocalHost(host) ? "http" : "https";
}

