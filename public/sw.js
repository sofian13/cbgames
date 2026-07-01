const CACHE_VERSION = "af-games-v3";
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Précache RÉSILIENT : chaque ressource est mise en cache indépendamment.
// (avec cache.addAll, un seul 404 faisait échouer TOUT le précache → l'app
// ne s'ouvrait pas du tout hors-ligne.)
async function precache() {
  const cache = await caches.open(APP_CACHE);
  await Promise.all(
    APP_SHELL.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (res.ok) await cache.put(url, res.clone());
      } catch {
        /* on ignore : une ressource ratée ne doit pas casser le reste */
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Hors-ligne + jamais mis en cache : on ne peut rien faire de mieux.
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      // On sert l'app shell ("/") pour que la PWA démarre hors-ligne
      // (le mode local vit sur "/"), sinon la page hors-ligne en dernier recours.
      return (
        (await caches.match("/")) ||
        (await caches.match("/offline.html")) ||
        Response.error()
      );
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Bundles de build Next (noms hashés, immuables) → cache d'abord
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images / assets statiques → cache d'abord
  if (
    url.pathname.startsWith("/cards/") ||
    url.pathname.startsWith("/categories/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigations + le reste → réseau d'abord, cache en secours
  event.respondWith(networkFirst(request));
});
