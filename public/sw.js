/* Pashove Delivery — service worker
 *
 * Deux rôles, volontairement limités :
 *   1. garder en cache les assets statiques (jamais le HTML : il est
 *      authentifié et propre à chaque livreur) ;
 *   2. afficher les notifications push et ouvrir l'espace livreur au clic.
 *
 * Le script vit à la racine pour pouvoir être enregistré avec le périmètre
 * étroit de l'espace livreur, mais il ne s'active que là où il est enregistré.
 */

const STATIC_CACHE = "pashove-static-v1";
const STATIC_PREFIX = "/_next/static/";
const ICON = "/pwa/icon-192.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("pashove-static-") && key !== STATIC_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const cacheable =
    url.pathname.startsWith(STATIC_PREFIX) ||
    url.pathname.startsWith("/pwa/");

  if (!cacheable) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Pashove Delivery";
  const options = {
    body: payload.body || "Nouvelle course disponible.",
    icon: ICON,
    badge: ICON,
    tag: payload.tag || "pashove-delivery",
    renotify: true,
    vibrate: [180, 80, 180],
    data: { url: payload.url || "/app/courier" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || "/app/courier",
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if (client.url === targetUrl) return client.focus();
      }

      // Un onglet livreur déjà ouvert : on le réutilise plutôt que d'en
      // empiler un second.
      for (const client of windows) {
        if (client.url.includes("/app/courier") && "navigate" in client) {
          await client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    })(),
  );
});
