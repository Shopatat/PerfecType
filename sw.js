/* Service worker : l'appli s'ouvre même sans réseau.
   Réseau d'abord pour les fichiers de l'appli : dès que le téléphone a du réseau, il prend la dernière version
   (plus besoin de vider quoi que ce soit). Sans réseau, il sert la copie en cache.
   Change VERSION à chaque modification pour rafraîchir la copie hors ligne. */
const VERSION = "perfectype-v6";
const FICHIERS = [
  "./", "index.html", "css/style.css", "js/app.js", "js/ia.js", "js/vendor/anthropic.mjs",
  "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;               // les appels aux IA ne passent jamais par le cache
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(e.request, { cache: "no-cache" })
        .then(res => { if (res.ok) { const copie = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copie)); } return res; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(VERSION).then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; }))));
  }
});
