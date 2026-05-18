// ------------------------------
// Wordlie6 Advanced Service Worker
// ------------------------------

const CACHE_VERSION = "v4";
const PRECACHE = `wordlie6-precache-${CACHE_VERSION}`;
const RUNTIME = `wordlie6-runtime-${CACHE_VERSION}`;

// Files required for the game to run offline
const PRECACHE_URLS = [
  "./",
  "index.html",
  "wordlie6.css",
  "wordlie6.js",
  "dictionary.js",
  "manifest.json",
  "assets/images/wordlie6-bg.png",
  "assets/images/icon-192.png",
  "assets/images/icon-512.png"
];

// ------------------------------
// INSTALL — Precache essential files
// ------------------------------
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ------------------------------
// ACTIVATE — Clean old caches
// ------------------------------
self.addEventListener("activate", event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !currentCaches.includes(key))
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ------------------------------
// FETCH — Hybrid strategy
// ------------------------------
self.addEventListener("fetch", event => {
  const request = event.request;

  // 1. HTML → Network-first (ensures updates)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(RUNTIME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // 2. Static assets → Cache-first
  if (
    request.url.endsWith(".css") ||
    request.url.endsWith(".js") ||
    request.url.endsWith(".png") ||
    request.url.endsWith(".jpg") ||
    request.url.endsWith(".jpeg") ||
    request.url.endsWith(".mp3")
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            const copy = response.clone();
            caches.open(RUNTIME).then(cache => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // 3. Default → Network fallback to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
