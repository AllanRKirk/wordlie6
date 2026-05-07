self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("wordlie6-cache").then(cache => {
      return cache.addAll([
        "./",
        "index.html",
        "wordlie6.css",
        "wordlie6.js",
        "dictionary.js",
        "manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
