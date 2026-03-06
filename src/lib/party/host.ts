const DEFAULT_PROD_PARTYKIT_HOST = "af-games.sofian13.partykit.dev";

function isLocalHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.");
}

function isPrivateNetworkHost(host: string) {
  if (host.startsWith("192.168.") || host.startsWith("10.")) return true;
  const match = host.match(/^172\.(\d+)\./);
  if (!match) return false;
  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

export function getPartyKitHost() {
  if (typeof window !== "undefined") {
    const forcedHost = new URLSearchParams(window.location.search).get("pk")?.trim();
    if (forcedHost) return forcedHost;
  }

  const configuredHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST?.trim();
  if (configuredHost) return configuredHost;

  if (typeof window !== "undefined") {
    const browserHost = window.location.hostname;
    if (
      browserHost === "localhost" ||
      browserHost === "127.0.0.1" ||
      isPrivateNetworkHost(browserHost)
    ) {
      if (isPrivateNetworkHost(browserHost)) {
        return `${browserHost}:1999`;
      }
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
