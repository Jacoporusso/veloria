const CACHE = 'veloria-shell-v4';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './favicon.svg',
  './assets/tilesets/veloria-ground-v1.png',
  './assets/sprites/borgofonte-house-01.png',
  './assets/sprites/borgofonte-tree-01.png',
  './assets/sprites/veloria-traveler-down.png',
  './assets/sprites/veloria-traveler-up.png',
  './assets/sprites/veloria-traveler-left.png',
  './assets/sprites/veloria-traveler-right.png',
  './tilemaps/bg_borgofonte.tmj',
  './tilemaps/r01_sentiero_alba.tmj',
];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch('./');
    const html = await page.clone().text();
    const localAssets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map((match) => new URL(match[1], self.registration.scope))
      .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname))
      .map((url) => url.href);
    const assets = new Set([...SHELL.map((path) => new URL(path, self.registration.scope).href), ...localAssets]);
    await cache.addAll([...assets]);
  })());
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
