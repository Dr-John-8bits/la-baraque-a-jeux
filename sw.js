/*
 * Service worker de La Baraque à Jeux.
 * Objectif : rendre le portail et les 4 jeux utilisables hors-ligne et éviter de
 * re-télécharger le shell (CSS/JS/polices) à chaque lancement quotidien.
 *
 * Stratégies :
 *  - navigations HTML  -> réseau d'abord, repli sur le cache (contenu frais en ligne,
 *    jouable hors-ligne).
 *  - autres GET même origine -> stale-while-revalidate (réponse immédiate depuis le
 *    cache, mise à jour en arrière-plan).
 *
 * Les chemins sont relatifs au service worker (racine du déploiement), donc portables
 * que le site soit servi à la racine d'un domaine ou dans un sous-dossier GitHub Pages.
 */
const VERSION = "labaj-v2-2026-06-14";
const CACHE = `labaj-${VERSION}`;

const CORE = [
  "./",
  "./blog.html",
  "./packages/ui/tokens.css",
  "./packages/ui/base.css",
  "./packages/ui/site-nav.css",
  "./packages/ui/components.css",
  "./packages/ui/about-dialog.js",
  "./packages/ui/register-sw.js",
  "./packages/ui/portal-hub.js",
  "./packages/game-utils/daily.js",
  "./packages/game-utils/fetch-json.js",
  "./packages/game-utils/markdown.js",
  "./packages/game-utils/random.js",
  "./packages/game-utils/share.js",
  "./packages/game-utils/storage.js",
  "./packages/game-utils/text-render.js",
  "./assets/fonts/inter-latin.woff2",
  "./assets/fonts/inter-latin-ext.woff2",
  "./assets/brand/la-baraque-a-jeux-lille.webp",
  "./apps/le-mot-a-biloute/",
  "./apps/le-mot-a-biloute/styles.css",
  "./apps/le-mot-a-biloute/app.js",
  "./apps/lille-mele/",
  "./apps/lille-mele/styles.css",
  "./apps/lille-mele/app.js",
  "./apps/biloute-biere-braderie/",
  "./apps/biloute-biere-braderie/styles.css",
  "./apps/biloute-biere-braderie/app.js",
  "./apps/station-mystere/",
  "./apps/station-mystere/styles.css",
  "./apps/station-mystere/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Précache tolérant : un asset manquant ne doit pas faire échouer l'installation.
      await Promise.allSettled(CORE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Repli ultime : la page d'accueil mise en cache.
    const fallback = await cache.match("./");
    if (fallback) return fallback;
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}
