const CACHE = 'veloria-shell-v140';
const SHELL = [
  './assets/creatures/pokeapi-evolution-18-v1.webp',
  './assets/creatures/pokeapi-evolution-44-v1.webp',
  './assets/creatures/pokeapi-evolution-61-v1.webp',
  './assets/creatures/pokeapi-evolution-70-v1.webp',
  './assets/creatures/pokeapi-evolution-101-v1.webp',
  './assets/creatures/pokeapi-evolution-168-v1.webp',
  './assets/scenery/veloria-r02_viale_fronde-illustrated-v2.webp',
  './assets/scenery/veloria-c01_brumalta-illustrated-v2.webp',
  './assets/scenery/veloria-gym01_brumalta-illustrated-v2.webp',
  './assets/scenery/veloria-radicelmo-illustrated-v2.webp',
  './assets/scenery/veloria-r05_viadotto_ciliegi-illustrated-v2.webp',
  './assets/scenery/veloria-vetracielo-illustrated-v2.webp',
  './assets/scenery/veloria-r06_anello_magnetico-illustrated-v2.webp',
  './assets/scenery/veloria-ferraluce-illustrated-v2.webp',
  './assets/scenery/veloria-r01_sentiero_alba-illustrated-v2.webp',
  './assets/scenery/veloria-d01_bosco_veli-illustrated-v2.webp',
  './assets/scenery/veloria-r03_terrazze_muschio-illustrated-v2.webp',
  './assets/scenery/veloria-r04_salita_petali-illustrated-v2.webp',
  './assets/scenery/veloria-petalora-illustrated-v2.webp',
  './assets/scenery/veloria-gym02_petalora-illustrated-v2.webp',

  './assets/scenery/veloria-borgofonte-v2.webp',
  './assets/creatures/pokeapi-stone-evolutions-26-v1.webp',
  './assets/creatures/pokeapi-stone-evolutions-62-v1.webp',
  './assets/creatures/pokeapi-stone-evolutions-134-v1.webp',
  './assets/creatures/pokeapi-stone-evolutions-135-v1.webp',
  './assets/creatures/pokeapi-stone-evolutions-136-v1.webp',
  './tilemaps/league_council01.tmj',
  './tilemaps/league_council02.tmj',
  './tilemaps/league_council03.tmj',
  './tilemaps/league_council04.tmj',
  './tilemaps/league_champion.tmj',
  './assets/scenery/veloria-league-council01-v1.webp',
  './assets/scenery/veloria-league-council02-v1.webp',
  './assets/scenery/veloria-league-council03-v1.webp',
  './assets/scenery/veloria-league-council04-v1.webp',
  './assets/scenery/veloria-league-champion-v1.webp',

  './tilemaps/r16_cammino_equilibrio.tmj',
  './tilemaps/league_forecourt.tmj',
  './assets/scenery/veloria-r16-equilibrium-v1.webp',
  './assets/scenery/veloria-league-forecourt-v1.webp',
  './tilemaps/d06_santuario_due_luci.tmj',
  './assets/scenery/veloria-sanctuary-two-lights-v1.webp',
  './tilemaps/r15_passo_due_luci.tmj',
  './tilemaps/concordia.tmj',
  './tilemaps/gym08_concordia.tmj',
  './assets/scenery/veloria-r15-two-lights-v1.webp',
  './assets/scenery/veloria-concordia-v1.webp',
  './assets/scenery/veloria-gym08-convergence-v1.webp',
  './assets/creatures/pokeapi-dragon-147-v1.webp',
  './assets/creatures/pokeapi-dragon-148-v1.webp',
  './assets/creatures/pokeapi-dragon-149-v1.webp',
  './assets/creatures/pokeapi-dragon-116-v1.webp',
  './assets/creatures/pokeapi-dragon-117-v1.webp',
  './assets/creatures/pokeapi-dragon-230-v1.webp',

  './assets/scenery/veloria-biancavetta-v2.webp',
  './assets/creatures/pokeapi-crystal-41-v1.webp',
  './assets/creatures/pokeapi-crystal-42-v1.webp',
  './assets/creatures/pokeapi-crystal-74-v1.webp',
  './assets/creatures/pokeapi-crystal-75-v1.webp',
  './assets/creatures/pokeapi-crystal-95-v1.webp',

  './tilemaps/r14_varco_cristallo.tmj',
  './tilemaps/d05_grotte_cristallo.tmj',
  './assets/scenery/veloria-r14-crystal-pass-v1.webp',
  './assets/scenery/veloria-d05-crystal-caverns-v1.webp',
  './tilemaps/r12_valle_vento.tmj',
  './tilemaps/passobrina.tmj',
  './tilemaps/r13_tornanti_bianchi.tmj',
  './tilemaps/biancavetta.tmj',
  './tilemaps/gym07_biancavetta.tmj',

  './assets/scenery/veloria-biancavetta-v1.webp',
  './assets/scenery/veloria-acquariva-v2.webp',
  './assets/scenery/veloria-gym07-ice-v1.webp',
  './assets/scenery/veloria-passobrina-v1.webp',
  './assets/scenery/veloria-r12-wind-valley-v1.webp',
  './assets/scenery/veloria-r13-white-switchbacks-v1.webp',
  './assets/creatures/pokeapi-mountain-124-v1.webp',
  './assets/creatures/pokeapi-mountain-215-v1.webp',
  './assets/creatures/pokeapi-mountain-220-v1.webp',
  './assets/creatures/pokeapi-mountain-221-v1.webp',
  './assets/creatures/pokeapi-mountain-225-v1.webp',
  './assets/creatures/pokeapi-mountain-86-v1.webp',
  './assets/creatures/pokeapi-mountain-87-v1.webp',

  './assets/creatures/pokeapi-starter-finals-3-v1.webp',
  './assets/creatures/pokeapi-starter-finals-6-v1.webp',
  './assets/creatures/pokeapi-starter-finals-9-v1.webp',
  './assets/creatures/pokeapi-starter-finals-181-v1.webp',

  './tilemaps/r09_dune_salmastre.tmj',
  './tilemaps/d04_delta_specchi.tmj',
  './tilemaps/r10_sentiero_canne.tmj',
  './tilemaps/acquariva.tmj',
  './tilemaps/gym06_acquariva.tmj',
  './tilemaps/r11_via_cascate.tmj',
  './assets/sprites/veloria-r09-dunes-v1.webp',
  './assets/sprites/veloria-d04-delta-v1.webp',
  './assets/sprites/veloria-r10-reeds-v1.webp',
  './assets/sprites/veloria-acquariva-v1.webp',
  './assets/sprites/veloria-gym06-reflections-v1.webp',
  './assets/sprites/veloria-r11-cascades-v1.webp',


  './assets/creatures/pokeapi-lake-79-v1.webp',
  './assets/creatures/pokeapi-lake-80-v1.webp',
  './assets/creatures/pokeapi-lake-96-v1.webp',
  './assets/creatures/pokeapi-lake-97-v1.webp',
  './assets/creatures/pokeapi-lake-133-v1.webp',
  './assets/creatures/pokeapi-lake-177-v1.webp',
  './assets/creatures/pokeapi-lake-178-v1.webp',
  './assets/creatures/pokeapi-lake-196-v1.webp',

  './tilemaps/r08_costa_turbine.tmj',
  './tilemaps/portolume.tmj',
  './tilemaps/gym05_portolume.tmj',
  './assets/sprites/veloria-r08-coast-v1.webp',
  './assets/sprites/veloria-portolume-v1.webp',
  './assets/sprites/veloria-gym05-sluices-v1.webp',

  './assets/creatures/pokeapi-coast-72-v1.webp',
  './assets/creatures/pokeapi-coast-73-v1.webp',
  './assets/creatures/pokeapi-coast-98-v1.webp',
  './assets/creatures/pokeapi-coast-99-v1.webp',
  './assets/creatures/pokeapi-coast-170-v1.webp',
  './assets/creatures/pokeapi-coast-171-v1.webp',

  './assets/ui/veloria-region-atlas-v1.webp',
  './assets/tilesets/veloria-industrial-floor-v1.webp',
  './tilemaps/r06_anello_magnetico.tmj',
  './tilemaps/ferraluce.tmj',
  './tilemaps/r07_condotto_risonante.tmj',
  './tilemaps/d03_centrale_risonante.tmj',
  './assets/sprites/veloria-centrale-room-v1.webp',
  './assets/sprites/veloria-r07-conduit-v1.webp',
  './tilemaps/gym04_ferraluce.tmj',
  './assets/sprites/veloria-gym04-magnetic-room-v1.webp',
  './assets/sprites/veloria-ferraluce-energy-hall-v1.webp',
  './assets/creatures/pokeapi-evolution-17-v1.webp',
  './assets/creatures/pokeapi-evolution-20-v1.webp',
  './assets/creatures/pokeapi-evolution-162-v1.webp',
  './assets/creatures/pokeapi-evolution-164-v1.webp',
  './assets/creatures/pokeapi-evolution-180-v1.webp',
  './assets/creatures/pokeapi-evolution-195-v1.webp',

  './tilemaps/gym03_vetracielo.tmj',
  './assets/sprites/veloria-gym03-rooftop-v1.webp',
  './assets/creatures/pokeapi-urban-81-v1.webp',
  './assets/creatures/pokeapi-urban-100-v1.webp',
  './assets/creatures/pokeapi-urban-82-v1.webp',
  './assets/creatures/pokeapi-urban-208-v1.webp',
  './assets/creatures/pokeapi-urban-227-v1.webp',
  './tilemaps/r05_viadotto_ciliegi.tmj',
  './tilemaps/vetracielo.tmj',
  './assets/sprites/veloria-monorail-station-v1.webp',
  './tilemaps/gym02_petalora.tmj',
  './tilemaps/r04_salita_petali.tmj',
  './tilemaps/petalora.tmj',
  './assets/sprites/veloria-cherry-tree-v1.webp',
  './assets/creatures/pokeapi-evolution-2-v1.webp',
  './assets/creatures/pokeapi-evolution-5-v1.webp',
  './assets/creatures/pokeapi-evolution-8-v1.webp',
  './',
  './index.html',
  './build-manifest.json',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/veloria-192.svg',
  './icons/veloria-512.svg',
  './icons/veloria-180.png',
  './icons/veloria-192.png',
  './icons/veloria-512.png',
  './assets/tilesets/veloria-ground-v1.png',
  './assets/tilesets/veloria-ground-hd-v5.webp',
  './assets/tilesets/veloria-forest-floor-v1.webp',
  './assets/tilesets/veloria-brumalta-ground-v1.webp',
  './assets/tilesets/veloria-forest-ground-v1.webp',
  './assets/sprites/borgofonte-house-01.webp',
  './assets/sprites/veloria-borgofonte-buildings-v1.webp',
  './assets/sprites/veloria-borgofonte-plants-v1.webp',
  './assets/sprites/veloria-field-props-v1.webp',
  './assets/sprites/veloria-npc-rami-v1.webp',
  './assets/sprites/veloria-npc-leda-v1.webp',
  './assets/sprites/borgofonte-home-interior-v1.webp',
  './assets/sprites/borgofonte-lab-interior-v1.webp',
  './assets/sprites/brumalta-center-v1.webp',
  './assets/sprites/brumalta-shop-v1.webp',
  './assets/sprites/brumalta-gym-v1.webp',
  './assets/sprites/radicelmo-greenhouse-v1.webp',
  './assets/sprites/radicelmo-community-v1.webp',
  './assets/sprites/radicelmo-herbalist-v1.webp',
  './assets/sprites/borgofonte-tree-01.webp',
  './assets/sprites/veloria-npcs-v2.webp',
  './assets/sprites/veloria-canopy-v2.webp',
  './assets/sprites/veloria-bosco-ancient-tree-v1.webp',
  './assets/sprites/veloria-bosco-pond-v1.webp',
  './assets/battle/veloria-battle-forest-v1.webp',
  './assets/creatures/pokeapi-starter-1-v1.webp',
  './assets/creatures/pokeapi-starter-4-v1.webp',
  './assets/creatures/pokeapi-starter-7-v1.webp',
  './assets/creatures/pokeapi-starter-25-v1.webp',
  './assets/creatures/pokeapi-route-16-v1.webp',
  './assets/creatures/pokeapi-route-19-v1.webp',
  './assets/creatures/pokeapi-route-161-v1.webp',
  './assets/creatures/pokeapi-route-163-v1.webp',
  './assets/creatures/pokeapi-route-43-v1.webp',
  './assets/creatures/pokeapi-route-60-v1.webp',
  './assets/creatures/pokeapi-route-69-v1.webp',
  './assets/creatures/pokeapi-route-194-v1.webp',
  './assets/creatures/veloria-creatures-3-v1.webp',
  './assets/creatures/veloria-creatures-4-v1.webp',
  './assets/sprites/veloria-traveler-walk-v2.webp',
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
    const buildManifestResponse = await cache.match(new URL('./build-manifest.json', self.registration.scope));
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
