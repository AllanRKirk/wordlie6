const CACHE_NAME = "wordlie6-cache-v3";
self.skipWaiting();
clients.claim();

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "wordlie6.css",
  "wordlie6.js",
  "dictionary.js",
  "manifest.json",

  // Icons
  "assets/images/icon-192.png",
  "assets/images/icon-512.png",
  "assets/images/icon-1024.png",

  // Apple iPhone screenshots
  "assets/images/apple/iphone-0.png",
  "assets/images/apple/iphone-1.png",
  "assets/images/apple/iphone-2.png",
  "assets/images/apple/iphone-3.png",
  "assets/images/apple/iphone-4.png",
  "assets/images/apple/iphone-5.png",

  // Apple iPad screenshots
  "assets/images/apple/ipad-0.png",
  "assets/images/apple/ipad-1.png",
  "assets/images/apple/ipad-2.png",
  "assets/images/apple/ipad-3.png",
  "assets/images/apple/ipad-4.png",
  "assets/images/apple/ipad-5.png",

  // Microsoft screenshots
  "assets/images/microsoft/microsoft-0.png",
  "assets/images/microsoft/microsoft-1.png",
  "assets/images/microsoft/microsoft-2.png",
  "assets/images/microsoft/microsoft-3.png",
  "assets/images/microsoft/microsoft-4.png",
  "assets/images/microsoft/microsoft-5.png"
];

self.addEventListener("install", event => {
  self.skipWaiting(); // NEW: activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  clients.claim(); // NEW: take control of all pages immediately
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
