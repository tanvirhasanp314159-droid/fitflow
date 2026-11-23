
const CACHE_NAME = "fitflow-pwa-v1";

const ASSETS = [
  "./styles.css",
  "./script.js",
  "./exercise-animator.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith("fitflow-pwa-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Keep the website and auth redirects fresh.
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.mode === "navigate"
  ) {
    return;
  }

  event.respondWith(
    fetch(request).then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    }).catch(async () => {
      return (
        await caches.match(request) ||
        Response.error()
      );
    })
  );
});
