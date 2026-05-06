// JavaScript source code
const CACHE_NAME = "wordlie6-cache-v1";
const ASSETS = [
  "wordlie6.html",
  "wordlie6.css",
  "wordlie6.js",
  "dictionary.js",
  "manifest.json",
  "assets/images/wordlie6.jpg",
  "assets/sounds/cheers.mp3"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});