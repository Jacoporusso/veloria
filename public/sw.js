const CACHE = 'veloria-shell-v31';
const SHELL = [
  './',
  './index.html',
  './.vite/manifest.json',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/veloria-192.svg',
  './icons/veloria-512.svg',
  './icons/veloria-180.png',
  './icons/veloria-192.png',
  './icons/veloria-512.png',
  './assets/tilesets/veloria-ground-v1.png',
  './assets/tilesets/veloria-brumalta-ground-v1.png',
  './assets/tilesets/veloria-forest-ground-v1.png',
  './assets/sprites/borgofonte-house-01.png',
  './assets/sprites/borgofonte-home-interior-v1.png',
  './assets/sprites/borgofonte-lab-interior-v1.png',
  './assets/sprites/brumalta-center-v1.png',
  './assets/sprites/brumalta-shop-v1.png',
  './assets/sprites/brumalta-gym-v1.png',
  './assets/sprites/radicelmo-greenhouse-v1.png',
  './assets/sprites/radicelmo-community-v1.png',
  './assets/sprites/radicelmo-herbalist-v1.png',
  './assets/sprites/borgofonte-tree-01.png',
  './assets/sprites/veloria-bosco-ancient-tree-v1.png',
  './assets/sprites/veloria-bosco-pond-v1.png',
  './assets/battle/veloria-battle-forest-v1.png',
  './assets/creatures/veloria-creatures-3-v1.png',
  './assets/creatures/veloria-creatures-4-v1.png',
  './assets/sprites/veloria-traveler-walk-v2.png',
  './assets/sprites/veloria-traveler-down.png',
  './assets/sprites/veloria-traveler-up.png',
  './assets/sprites/veloria-traveler-left.png',
  './assets/sprites/veloria-traveler-right.png',
  './tilemaps/bg_borgofonte.tmj',
  './tilemaps/borgofonte_home.tmj',
  './tilemaps/borgofonte_lab.tmj',
  './tilemaps/r01_sentiero_alba.tmj',
  './tilemaps/d01_bosco_veli.tmj',
  './tilemaps/r02_viale_fronde.tmj',
  './tilemaps/c01_brumalta.tmj',
  './tilemaps/gym01_brumalta.tmj',
  './tilemaps/r03_terrazze_muschio.tmj',
  './tilemaps/radicelmo.tmj',
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
    const buildManifestResponse = await cache.match(new URL('./.vite/manifest.json', self.registration.scope));
    if (!buildManifestResponse?.ok) throw new Error('The production build manifest is unavailable.');
    const buildManifest = await buildManifestResponse.json();
    const buildAssets = new Set();
    for (const entry of Object.values(buildManifest)) {
      if (entry.file) buildAssets.add(entry.file);
      for (const file of [...(entry.css ?? []), ...(entry.assets ?? [])]) buildAssets.add(file);
    }
    await cache.addAll([...buildAssets].map((path) => new URL(path, self.registration.scope).href));
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('veloria-shell-') && key !== CACHE).map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Static, content-hashed same-origin assets can be served regardless of
    // request header variations such as module-script Accept headers.
    const cached = await cache.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
