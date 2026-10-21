import leagueSequence from '../../content/challenges/veloria_league.sequence.json' with {type:'json'};
import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import speciesRegistry from '../../content/battle/species.v1.json' with { type: 'json' };
import moveRegistry from '../../content/battle/moves.v1.json' with { type: 'json' };
import { seedBrowserSave, walkDirection, walkTo as planWalkTo } from './helpers/world-navigation';
import { prepareMonorailTraveler, stationArrival, travelResources } from './helpers/monorail';
import { readBrowserSave } from './helpers/world-navigation';
import magneticRouter from '../../content/puzzles/gym04_magnetic.v1.json' with { type: 'json' };

// Keep the offline journey independent of decorative animation throughput on CI.
const walkTo = (page: import('@playwright/test').Page, file: string, x: number, y: number) => planWalkTo(page, file, x, y, { avoidEncounters: true });

test.use({ reducedMotion: 'reduce' });

test('Acquariva chapter resources load first offline and the waterfall walking return persists',async({page,context})=>{
  test.setTimeout(180_000);
  await page.goto('/');await enterGame(page);
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
  const save=await readBrowserSave(page);
  save.flags=[...new Set([...save.flags,'q_starter_selected','q_delta_report','q_acquariva_visited','q_acquariva_report','badge_riflesso_awarded'])];
  save.badges=[...new Set([...save.badges,'badge_riflesso'])];
  save.player={...save.player,mapId:'veloria/acquariva',spawnPointId:'from_r11',x:7,y:1};
  await seedBrowserSave(page,save);
  const failures:string[]=[];page.on('requestfailed',request=>failures.push(request.url()));
  await context.setOffline(true);await page.reload();await enterGame(page);
  const resources=await page.evaluate(async()=>{
    const names=['r09-dunes','d04-delta','r10-reeds','acquariva','gym06-reflections','r11-cascades'];
    const maps=['r09_dune_salmastre','d04_delta_specchi','r10_sentiero_canne','acquariva','gym06_acquariva','r11_via_cascate'];
    const images=await Promise.all(names.map(async name=>{const image=new Image();image.src=`/assets/sprites/veloria-${name}-v1.webp`;await image.decode();return image.naturalWidth>1000;}));
    const widths=await Promise.all(maps.map(async name=>{const response=await fetch(`/tilemaps/${name}.tmj`);if(!response.ok)throw new Error(name);return(await response.json()).width;}));
    return{images,widths};
  });
  expect(resources).toEqual({images:[true,true,true,true,true,true],widths:[40,40,40,40,32,40]});
  await walkDirection(page,'up');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r11_via_cascate');
  await walkTo(page,'r11_via_cascate.tmj',20,0);
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  await page.reload();await enterGame(page);await walkDirection(page,'down');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r11_via_cascate');
  await walkTo(page,'r11_via_cascate.tmj',17,29);
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  await page.reload();await enterGame(page);
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  expect(failures).toEqual([]);
});

test('Portolume ferry and new chapter resources work on their first offline request', async({page,context})=>{
  test.setTimeout(90_000);
  await page.goto('/');await enterGame(page);
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
  const save=await readBrowserSave(page);
  save.flags=[...save.flags,'q_starter_selected','q_centrale_report','q_portolume_visited','q_portolume_orientation'];
  save.player={...save.player,mapId:'veloria/portolume',spawnPointId:'dock_mainland',x:25,y:14};
  await seedBrowserSave(page,save);
  await context.setOffline(true);
  const failures:string[]=[];page.on('requestfailed',request=>failures.push(request.url()));
  await page.reload();await enterGame(page);
  const decoded=await page.evaluate(async()=>{
    const names=['r08-coast','portolume','gym05-sluices'];
    return Promise.all(names.map(async name=>{const image=new Image();image.src=`/assets/sprites/veloria-${name}-v1.webp`;await image.decode();return image.naturalWidth>1000;}));
  });
  expect(decoded).toEqual([true,true,true]);
  const mapSizes=await page.evaluate(async()=>Promise.all(['r08_costa_turbine','portolume','gym05_portolume'].map(async name=>{
    const response=await fetch(`/tilemaps/${name}.tmj`);if(!response.ok)throw new Error(name);return (await response.json()).width;
  })));
  expect(mapSizes).toEqual([40,40,32]);
  await page.getByRole('button',{name:'Vai a destra',exact:true}).tap();
  await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
  await page.getByRole('button',{name:'Osservatorio delle maree',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).player.spawnPointId).toBe('dock_observatory');
  await page.reload();await enterGame(page);
  await walkTo(page,'portolume.tmj',33,10);
  await page.getByRole('button',{name:'Vai a sinistra',exact:true}).tap();
  await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
  await page.getByRole('button',{name:'Molo di Portolume',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).player.spawnPointId).toBe('dock_mainland');
  expect(failures).toEqual([]);
});

async function getMvpResourcePaths(): Promise<string[]> {
  const mapsDirectory = new URL('../../content/maps/', import.meta.url);
  const files = await readdir(mapsDirectory);
  const mapFiles = files.filter(file => file.endsWith('.map.json')).sort();
  const resources = new Set(['index.html', 'build-manifest.json', 'assets/ui/veloria-region-atlas-v1.webp']);
  for (const file of ['pokeapi-starter-artwork-v1.json', 'pokeapi-route-artwork-v1.json', 'pokeapi-evolution-artwork-v1.json', 'pokeapi-urban-artwork-v1.json']) {
    const artwork = JSON.parse(await readFile(new URL(`../../assets/${file}`, import.meta.url), 'utf8'));
    for (const entry of artwork.artworks) resources.add(entry.path);
  }
  for (const direction of ['down', 'up', 'left', 'right']) {
    resources.add(`assets/sprites/veloria-traveler-${direction}.png`);
  }
  for (const file of mapFiles) {
    const map = JSON.parse(await readFile(new URL(file, mapsDirectory), 'utf8')) as {
      tiledAsset: string;
      renderAssets: { path: string }[];
    };
    resources.add(map.tiledAsset);
    for (const asset of map.renderAssets) resources.add(asset.path);
  }
  const buildManifest = JSON.parse(await readFile(new URL('../../dist/build-manifest.json', import.meta.url), 'utf8')) as Record<string, {
    file?: string;
    css?: string[];
    assets?: string[];
  }>;
  for (const entry of Object.values(buildManifest)) {
    if (entry.file) resources.add(entry.file);
    for (const asset of [...(entry.css ?? []), ...(entry.assets ?? [])]) resources.add(asset);
  }
  return [...resources];
}

async function readSave(page: import('@playwright/test').Page) {
  return page.evaluate(() => new Promise<any>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('saves', 'readonly');
      const get = tx.objectStore('saves').get('main');
      get.onsuccess = () => {
        if (!get.result) { reject(new Error('The initial movement did not create a save.')); return; }
        resolve(get.result);
      };
      get.onerror = () => reject(get.error);
      tx.oncomplete = () => db.close();
    };
  }));
}

function nextRandom(state: number) {
  let value = state >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function findPidgeyCaptureSeed() {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    const encounterRoll = nextRandom(seed);
    if (encounterRoll / 0x1_0000_0000 >= 0.08) continue;
    const speciesRoll = nextRandom(encounterRoll);
    if (1 + Math.floor(speciesRoll / 0x1_0000_0000 * 100) > 20) continue;
    const levelRoll = nextRandom(speciesRoll);
    const firstTurnRoll = nextRandom(levelRoll);
    const secondTurnRoll = nextRandom(firstTurnRoll);
    const captureRoll = nextRandom(secondTurnRoll);
    if (captureRoll / 0x1_0000_0000 < 0.25) return seed;
  }
  throw new Error('No deterministic offline Pidgey capture seed found.');
}

function findNoEncounterSeed(checks: number) {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    let state = seed;
    let clear = true;
    for (let index = 0; index < checks; index += 1) {
      state = nextRandom(state);
      if (state / 0x1_0000_0000 < 0.08) {
        clear = false;
        break;
      }
    }
    if (clear) return seed;
  }
  throw new Error(`No deterministic seed found for ${checks} encounter-free checks.`);
}

async function seedOfflineCapture(page: import('@playwright/test').Page, rngState: number) {
  await page.evaluate((seed) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const value = store.get('main');
      value.onerror = () => reject(value.error);
      value.onsuccess = () => {
        const save = value.result;
        save.rngState = seed;
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), rngState);
}

async function seedOfflineHealing(page: import('@playwright/test').Page) {
  const species = JSON.parse(await readFile(new URL('../../content/battle/species.v1.json', import.meta.url), 'utf8')).species;
  const moves = JSON.parse(await readFile(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves;
  const prepared = createBattleCreature({ species, moves, speciesId: 5, level: 30, instanceId: 'offline-fixture', moveIds: ['scratch', 'growl', 'ember', 'smokescreen'] });
  await page.evaluate(creature => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const value = store.get('main');
      value.onerror = () => reject(value.error);
      value.onsuccess = () => {
        const save = value.result;
        save.party[0] = {
          ...save.party[0],
          speciesId: creature.speciesId,
          level: creature.level,
          experience: 0,
          hp: creature.hp,
          maxHp: creature.stats.maxHp,
          moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
        };
        // Prepare the gym party before the Center restores its HP, status and PP.
        save.party = save.party.map((member: any) => ({
          ...member, hp: 1, status: { status: 'poison' },
          moves: member.moves.map((move: any) => ({ ...move, pp: 0 })),
        }));
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), prepared);
}

async function tapBattleCanvas(page: import('@playwright/test').Page, xRatio: number, bottomOffset: number) {
  const canvas = page.locator('#game canvas');
  await expect.poll(async () => canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return Math.abs(element.width - rect.width) <= 1 && Math.abs(element.height - rect.height) <= 1;
  })).toBe(true);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Battle canvas is not visible offline.');
  await page.touchscreen.tap(box.x + box.width * xRatio, box.y + box.height - bottomOffset);
}

async function advanceBattleMessages(page: import('@playwright/test').Page) {
  for (let tap = 0; tap < 14; tap += 1) {
    if (!(await page.locator('body').evaluate(element => element.classList.contains('battle-active')))) return;
    if (await page.locator('.battle-celebration').isVisible()) {
      await page.getByRole('button', { name: 'Continua', exact: true }).click();
      return;
    }
    await tapBattleCanvas(page, 0.5, 132);
    await page.waitForTimeout(90);
  }
}

async function captureWildOffline(page: import('@playwright/test').Page) {
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  // This suite runs the compiled production bundle: confirm the first ball with
  // the real keyboard command. Dynamic touch bounds are covered by MVP-04.
  await tapBattleCanvas(page, 0.75, 93);
  await page.keyboard.press('Enter', { delay: 40 });
  await advanceBattleMessages(page);
}

test('E2E-06: the cached adventure reaches three badges offline', async ({ page, context }, testInfo) => {
  // CI 39554346058 reaches the final Aster battle at 900s (Magnemite is
  // already on the field). Allow its remaining turns and durable third medal
  // within the existing 20-minute workflow step; keep every offline assertion.
  test.setTimeout(process.env.CI ? 1_080_000 : 480_000);
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  await page.addInitScript(() => { Date.prototype.getHours = () => 12; });
  const expectedResources = await getMvpResourcePaths();
  await page.goto('/');
  await enterGame(page);

  // First installation claims this document without an unnecessary reload.
  // WaitForFunction also survives navigation if an existing worker is updated.
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#game-loading')).toBeHidden();

  // Verify every local game asset is successfully cached before simulating
  // airplane mode. Keep the assertions strict; only their timing changed.
  await page.evaluate(async (expectedResources) => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable in this browser.');
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) throw new Error('The Veloria service worker did not activate.');
    const cachesForVeloria = await caches.keys();
    const cacheName = cachesForVeloria.find(name => name.startsWith('veloria-shell-'));
    if (!cacheName) throw new Error('The Veloria app shell cache was not created.');
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const urls = requests.map(request => request.url);
    for (const expected of expectedResources) {
      const cachedRequest = requests.find(request => request.url.endsWith(expected));
      if (!cachedRequest) throw new Error(`Missing cached MVP resource: ${expected}`);
      const cachedResponse = await cache.match(cachedRequest);
      if (!cachedResponse?.ok) {
        const details = cachedResponse ? `HTTP ${cachedResponse.status} ${cachedResponse.type} ${cachedResponse.url}` : 'no response';
        throw new Error(`Missing successful cached MVP response: ${expected} (${details}; cache keys ${urls.filter(url => url.endsWith(expected)).join(', ')})`);
      }
    }
  }, expectedResources);

  // Move once online to create an IndexedDB checkpoint.
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect.poll(async () => {
    try { return (await readSave(page))?.player?.y ?? null; } catch { return null; }
  }).toBe(19);

  // Disable all browser networking for the actual offline assertions.
  await context.setOffline(true);
  expect(await page.evaluate(async () => Promise.all([2, 5, 8].map(async id => {
    const image = new Image();
    image.src = new URL(`assets/creatures/pokeapi-evolution-${id}-v1.webp`, location.href).href;
    await image.decode();
    return image.naturalWidth > 0;
  })))).toEqual([true, true, true]);

  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`));
  const offlineResponse = await page.reload();
  expect(offlineResponse?.status()).toBe(200);
  await enterGame(page);

  const directions = { alto: 'Vai in alto', basso: 'Vai in basso', sinistra: 'Vai a sinistra', destra: 'Vai a destra' } as const;
  const walk = async (direction: keyof typeof directions, count: number, stopAtMapId?: string, beforeSave?: Awaited<ReturnType<typeof readSave>>) => {
    const button = page.getByRole('button', { name: directions[direction] });
    let observed = beforeSave ?? await readSave(page);
    for (let step = 0; step < count; step += 1) {
      await expect(page.locator('#game')).not.toHaveAttribute('aria-busy', 'true');
      const before = observed;
      await button.tap();
      await expect.poll(async () => {
        observed = await readSave(page);
        const player = observed?.player;
        return `${player?.mapId}|${player?.x},${player?.y}`;
      }).not.toBe(`${before.player.mapId}|${before.player.x},${before.player.y}`);
      if (stopAtMapId) {
        await expect(page.locator('#game-loading')).toBeHidden();
        observed = await readSave(page);
        if (observed?.player?.mapId === stopAtMapId) break;
      }
    }
    return observed;
  };
  const walkToMapTile = async (tilemapPath: string, targetX: number, targetY: number) => {
    const current = await readSave(page);
    const map = JSON.parse(await readFile(new URL(`../../public/tilemaps/${tilemapPath}`, import.meta.url), 'utf8'));
    const collisionLayer = map.layers.find((layer: any) => layer.name === 'collision');
    const blocked = new Set<string>();
    for (const object of collisionLayer.objects) {
      const left = Math.max(0, Math.floor(object.x / 32));
      const top = Math.max(0, Math.floor(object.y / 32));
      const right = Math.min(map.width, Math.ceil((object.x + Math.max(1, object.width ?? 32)) / 32));
      const bottom = Math.min(map.height, Math.ceil((object.y + Math.max(1, object.height ?? 32)) / 32));
      for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) blocked.add(`${x},${y}`);
    }
    // Cross only the requested threshold; other doors are not navigation shortcuts.
    for (const trigger of map.layers.find((layer: any) => layer.name === 'triggers').objects) {
      const properties = Object.fromEntries((trigger.properties ?? []).map((property: any) => [property.name, property.value]));
      if (properties.kind !== 'map-exit') continue;
      for (let y = Math.floor(trigger.y / 32); y < Math.ceil((trigger.y + trigger.height) / 32); y += 1) {
        for (let x = Math.floor(trigger.x / 32); x < Math.ceil((trigger.x + trigger.width) / 32); x += 1) {
          if (x !== targetX || y !== targetY) blocked.add(`${x},${y}`);
        }
      }
    }
    const steps = [
      { x: 0, y: -1, direction: 'alto' as const },
      { x: 1, y: 0, direction: 'destra' as const },
      { x: 0, y: 1, direction: 'basso' as const },
      { x: -1, y: 0, direction: 'sinistra' as const },
    ];
    const start = `${current.player.x},${current.player.y}`;
    const goal = `${targetX},${targetY}`;
    const previous = new Map<string, { point: string; direction: typeof steps[number]['direction'] }>();
    const queue = [start];
    const visited = new Set(queue);
    while (queue.length && !visited.has(goal)) {
      const point = queue.shift()!;
      const [x, y] = point.split(',').map(Number);
      for (const step of steps) {
        const nextX = x + step.x, nextY = y + step.y, next = `${nextX},${nextY}`;
        if (nextX < 0 || nextY < 0 || nextX >= map.width || nextY >= map.height || blocked.has(next) || visited.has(next)) continue;
        visited.add(next);
        previous.set(next, { point, direction: step.direction });
        queue.push(next);
      }
    }
    if (!visited.has(goal)) throw new Error(`No walkable route from ${start} to ${tilemapPath} tile ${goal}.`);
    const route: Array<typeof steps[number]['direction']> = [];
    for (let point = goal; point !== start;) {
      const step = previous.get(point);
      if (!step) throw new Error(`Broken route to ${tilemapPath} tile ${goal}.`);
      route.push(step.direction);
      point = step.point;
    }
    let observed = current;
    for (const direction of route.reverse()) observed = await walk(direction, 1, undefined, observed);
  };

  // Start a new-game flow, then follow the same walkable route as E2E-02 while offline.
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect.poll(async () => (await readSave(page))?.player?.y).toBe(20);
  await walkToMapTile('bg_borgofonte.tmj', 21, 25);
  await expect(page.locator('#current-location')).toHaveText('LABORATORIO DI ELIA');
  await walkToMapTile('borgofonte_lab.tmj', 12, 8);
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  for (let step = 0; step < 5; step += 1) {
    if (await page.locator('#starter-choices').isVisible()) break;
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  }
  await expect(page.locator('#starter-choices')).toBeVisible();
  for (const name of ['Pikachu', 'Charmander', 'Squirtle', 'Bulbasaur']) {
    const portrait = page.getByRole('button', { name, exact: true }).locator('.creature-portrait');
    expect(await portrait.evaluate(async element => {
      const image = new Image();
      image.src = getComputedStyle(element).backgroundImage.slice(5, -2);
      await image.decode();
      return image.naturalWidth > 0 && !element.classList.contains('creature-portrait-pending');
    })).toBe(true);
  }
  await page.getByRole('button', { name: 'Charmander', exact: true }).click();
  await expect.poll(async () => (await readSave(page))?.party?.length).toBe(1);
  for (let step = 0; step < 4; step += 1) await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Professoressa Elia');
  for (let step = 0; step < 4; step += 1) await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_research_sample_received');
  await expect(page.locator('#dialogue-box')).toBeHidden();

  await walkToMapTile('borgofonte_lab.tmj', 12, 14);
  await walkToMapTile('bg_borgofonte.tmj', 28, 20);
  await walkToMapTile('bg_borgofonte.tmj', 22, 0);
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/r01_sentiero_alba');
  expect((await readSave(page)).player).toMatchObject({ x: 1, y: 10 });
  await walk('destra', 14);
  await page.getByRole('button', { name: 'Vai in alto' }).tap(); // Face the solid pickup without entering its tile.
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect.poll(async () => (await readSave(page))?.inventory?.potion).toBe(3);
  await walk('destra', 14);
  await walk('alto', 2, 'veloria/d01_bosco_veli');
  const finalSave = await readSave(page);
  expect(finalSave.player).toMatchObject({ mapId: 'veloria/d01_bosco_veli', spawnPointId: 'from_r01', x: 1, y: 10 });
  expect(finalSave.flags).toContain('item_r01_potion_collected');
  // Encounters belong to the visible fern patches, not to the central path.
  await walkToMapTile('d01_bosco_veli.tmj', 2, 9);
  await seedOfflineCapture(page, findPidgeyCaptureSeed());
  await page.reload();
  await enterGame(page);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  try {
    await captureWildOffline(page);
  } catch (error) {
    const toast = await page.locator('#toast').textContent();
    throw new Error(`${error instanceof Error ? error.message : error}; toast: ${toast}; runtime errors: ${runtimeErrors.join(' | ')}`);
  }
  await expect.poll(async () => (await readSave(page))?.party?.length).toBe(2);
  const capturedSave = await readSave(page);
  expect(capturedSave.party[1]).toMatchObject({ speciesId: 16 });
  expect(capturedSave.inventory['poke-ball']).toBe(4);

  // Finish Ada's quest offline, then follow the forest-city connection without encounters.
  const tapConfirm = () => page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await walk('basso', 3);
  await walkToMapTile('d01_bosco_veli.tmj', 13, 12);
  await walk('alto', 1);
  await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  for (let step = 0; step < 4; step += 1) await tapConfirm();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await walkToMapTile('d01_bosco_veli.tmj', 17, 12);
  await walk('alto', 1);
  await tapConfirm();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_forest_signal_found');
  await walkToMapTile('d01_bosco_veli.tmj', 13, 12);
  await walk('alto', 1);
  await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  for (let step = 0; step < 4; step += 1) await tapConfirm();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_ada_helped');

  await seedOfflineCapture(page, findNoEncounterSeed(60));
  await page.reload();
  await enterGame(page);
  await walkToMapTile('d01_bosco_veli.tmj', 29, 10);
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/r02_viale_fronde');
  await walk('destra', 26, 'veloria/brumalta');
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/brumalta');
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_brumalta_visited');

  // Exercise the Center against a damaged, statused party while still disconnected.
  await seedOfflineHealing(page);
  await page.reload();
  await enterGame(page);
  await expect.poll(async () => (await readSave(page))?.party.every((creature: any) =>
    creature.hp === 1 && creature.status?.status === 'poison' && creature.moves.every((move: any) => move.pp === 0),
  )).toBe(true);
  await walk('alto', 5);
  await walk('destra', 5);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm();
  await expect(page.locator('#starter-choices')).toBeVisible();
  await page.getByRole('button', { name: 'RIPOSA' }).click();
  await expect.poll(async () => (await readSave(page))?.party.every((creature: any) =>
    creature.hp === creature.maxHp && creature.status === undefined && creature.moves.every((move: any) => move.pp > 0),
  )).toBe(true);

  await walkToMapTile('c01_brumalta.tmj', 28, 7);
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/gym01_brumalta');
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI BRUMALTA');

  // Activate all three puzzle plates through normal movement before approaching Mira.
  await walkToMapTile('gym01_brumalta.tmj', 13, 14);
  await expect.poll(async () => (await readSave(page))?.flags).toContain('gym01_resonance_south');
  await walkToMapTile('gym01_brumalta.tmj', 8, 10);
  await expect.poll(async () => (await readSave(page))?.flags).toContain('gym01_resonance_middle');
  await walkToMapTile('gym01_brumalta.tmj', 18, 6);
  await expect.poll(async () => (await readSave(page))?.flags).toContain('gym01_puzzle_solved');
  await walkToMapTile('gym01_brumalta.tmj', 14, 3);
  await walk('basso', 1);
  await walk('alto', 1);
  await tapConfirm();
  await expect(page.locator('#dialogue-text')).toContainText('Medaglia Aurora');
  for (let step = 0; step < 5 && !(await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible()); step += 1) {
    await tapConfirm();
  }
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for (let turn = 0; turn < 10; turn += 1) {
    if (!(await page.locator('body').evaluate(element => element.classList.contains('battle-active')))) break;
    await tapBattleCanvas(page, 0.25, 144);
    await tapBattleCanvas(page, 0.25, 140);
    await advanceBattleMessages(page);
  }
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  await expect.poll(async () => (await readSave(page))?.badges?.filter((badge: string) => badge === 'badge_aurora').length).toBe(1);
  await expect(page.getByRole('heading', { name: 'Primo capitolo completato' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('first-chapter-complete-offline.png') });
  await page.getByRole('button', { name: 'Continua a esplorare' }).click();
  const badgeSave = await readSave(page);
  expect(badgeSave.flags).toContain('trainer_gym01_mira_defeated');
  expect(badgeSave.flags).toContain('badge_aurora_awarded');
  expect(badgeSave.flags).toContain('prologue_complete_seen');

  await page.reload();
  await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI BRUMALTA');
  expect((await readSave(page)).badges.filter((badge: string) => badge === 'badge_aurora')).toHaveLength(1);

  // The next region is part of the installed pack, including map transitions and services.
  // Prepare only the starting location; the existing badge must open the authored gate.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request=indexedDB.open('veloria-save',1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result, tx=db.transaction('saves','readwrite'), store=tx.objectStore('saves');
      const get=store.get('main');
      get.onsuccess=()=>{
        const save=get.result;
        save.player={...save.player,mapId:'veloria/radicelmo',spawnPointId:'from_r04',x:18,y:2};
        save.party[0].hp=1;
        store.put(save,'main');store.delete('checksum:main');
      };
      tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
    };
  }));
  await page.reload(); await enterGame(page);
  await walkToMapTile('radicelmo.tmj',18,0);
  await expect(page.locator('#current-location')).toHaveText('SALITA DEI PETALI');
  for(const [x,y]of [[18,23],[7,23],[7,14],[30,14]])await walkToMapTile('r04_salita_petali.tmj',x,y);
  await walkToMapTile('r04_salita_petali.tmj',30,0);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  await expect.poll(async()=>(await readSave(page)).flags).toContain('q_petalora_visited');
  await walkToMapTile('petalora.tmj',10,9);
  await walk('alto',1); await tapConfirm();
  await page.getByRole('button',{name:'RIPOSA',exact:true}).click();
  await expect.poll(async()=>(await readSave(page)).party.every((c:any)=>c.hp===c.maxHp)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('petalora-offline.png')});
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  expect((await readSave(page)).flags).toContain('q_petalora_visited');

  await walkToMapTile('petalora.tmj',18,0);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI PETALORA');
  const examineGymStation=async(x:number,y:number)=>{
    await walkToMapTile('gym02_petalora.tmj',x,y+2);
    await walk('alto',1);await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeVisible();
    for(let tap=0;tap<8&&await page.locator('#dialogue-box').isVisible();tap++)await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  };
  await examineGymStation(5,21);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym02_water_source_open');
  await page.reload();await enterGame(page);
  expect((await readSave(page)).flags).toContain('gym02_water_source_open');
  await examineGymStation(6,15);
  await examineGymStation(20,10);
  await examineGymStation(13,6);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym02_irrigation_solved');
  await walkToMapTile('gym02_petalora.tmj',13,5);
  await walk('alto',1);await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Dalia');
  for(let tap=0;tap<8&&!(await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible());tap++)await tapConfirm();
  await page.getByRole('button',{name:'SFIDA',exact:true}).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for(let turn=0;turn<10;turn++) {
    if(!(await page.locator('body').evaluate(el=>el.classList.contains('battle-active'))))break;
    await tapBattleCanvas(page,.25,144);
    await tapBattleCanvas(page,.25,140);
    await advanceBattleMessages(page);
  }
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  await expect.poll(async()=>(await readSave(page)).badges).toContain('badge_corolla');
  await page.reload();await enterGame(page);
  await page.getByRole('button',{name:'Apri menu di gioco'}).click();
  await page.getByRole('button',{name:'Apri le medaglie'}).click();
  const medals=page.getByRole('dialog',{name:'Le tue medaglie'});
  await expect(medals).toContainText('Medaglia Corolla');
  await expect(medals.locator('[data-badge-id="badge_corolla"] svg')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('corolla-offline.png')});

  await page.keyboard.press('Escape');
  await walkToMapTile('gym02_petalora.tmj',13,25);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  await walkToMapTile('petalora.tmj',37,12);
  await expect(page.locator('#current-location')).toHaveText('VIADOTTO DEI CILIEGI');
  for (const [x,y] of [[15,18],[15,6],[44,6],[45,6]]) await walkToMapTile('r05_viadotto_ciliegi.tmj',x,y);
  await expect(page.locator('#current-location')).toHaveText('VETRACIELO · PIAZZA DELLA MONOROTAIA');
  await expect.poll(async()=>(await readSave(page)).flags).toContain('q_vetracielo_visited');
  const potionsBeforeLea=(await readSave(page)).inventory.potion??0;
  await walkToMapTile('vetracielo.tmj',22,20);await walk('alto',1);await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Lea');
  for(let tap=0;tap<12&&await page.locator('#dialogue-box').isVisible();tap++)await tapConfirm();
  await expect.poll(async()=>(await readSave(page)).flags).toContain('q_vetracielo_orientation');
  expect((await readSave(page)).inventory.potion).toBe(potionsBeforeLea+2);
  await walkToMapTile('vetracielo.tmj',15,22);await walk('alto',1);await tapConfirm();
  await page.getByRole('button',{name:'RIPOSA',exact:true}).click();
  await expect.poll(async()=>(await readSave(page)).party.every((c:any)=>c.hp===c.maxHp)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('vetracielo-offline.png')});
  await page.reload();await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('VETRACIELO · PIAZZA DELLA MONOROTAIA');
  expect((await readSave(page)).flags).toContain('q_vetracielo_orientation');
  expect((await readSave(page)).inventory.potion).toBe(potionsBeforeLea+2);

  await walkToMapTile('vetracielo.tmj',20,16);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI VETRACIELO');
  const inspectRailConsole=async(x:number,y:number)=>{
    await walkToMapTile('gym03_vetracielo.tmj',x,y+2);await walk('alto',1);await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeVisible();
    for(let tap=0;tap<10&&await page.locator('#dialogue-box').isVisible();tap++)await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  };
  await inspectRailConsole(7,23);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym03_line_gardens_active');
  await page.reload();await enterGame(page);
  expect((await readSave(page)).flags).toContain('gym03_line_gardens_active');
  await inspectRailConsole(23,19);await inspectRailConsole(15,15);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym03_lines_connected');
  await walkToMapTile('gym03_vetracielo.tmj',15,12);await walk('alto',1);await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Aster');
  for(let tap=0;tap<10&&!(await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible());tap++)await tapConfirm();
  await page.getByRole('button',{name:'SFIDA',exact:true}).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for(let turn=0;turn<10;turn++) {
    if(!(await page.locator('body').evaluate(el=>el.classList.contains('battle-active'))))break;
    await tapBattleCanvas(page,.25,144);
    // The prepared Charmeleon's third slot is Ember: use its Fire coverage against Steel.
    await tapBattleCanvas(page,.25,80);
    await advanceBattleMessages(page);
  }
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  await expect.poll(async()=>(await readSave(page)).badges).toContain('badge_circuito');
  await page.reload();await enterGame(page);
  await page.getByRole('button',{name:'Apri menu di gioco'}).click();
  await page.getByRole('button',{name:'Apri le medaglie'}).click();
  const circuitMedals=page.getByRole('dialog',{name:'Le tue medaglie'});
  await expect(circuitMedals.locator('.badge-case-card')).toHaveCount(3);
  await circuitMedals.locator('[data-badge-id="badge_circuito"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('circuito-offline.png')});

  expect((await readSave(page)).flags).toContain('q_ada_helped');
  expect(failedRequests).toEqual([]);
});

test('the cached Anello Magnetico reading, Ferraluce report and healing work offline', async ({ page, context }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [], failedRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const resources = await getMvpResourcePaths();
  await page.evaluate(async paths => {
    for (const path of paths) {
      const response = await caches.match(new URL(path, location.href).href);
      if (!response?.ok) throw new Error(`Missing cached chapter asset: ${path}`);
    }
  }, resources);
  const save = await readSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any, speciesId: 195, level: 20, instanceId: 'offline-ferraluce', moveIds: ['water-gun', 'mud-shot'] });
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'q_brumalta_visited', 'gym01_puzzle_solved', 'badge_aurora_awarded', 'prologue_complete_seen', 'q_petalora_visited', 'gym02_water_source_open', 'gym02_water_west_open', 'gym02_water_east_open', 'gym02_irrigation_solved', 'badge_corolla_awarded', 'q_vetracielo_visited', 'q_vetracielo_orientation', 'gym03_line_gardens_active', 'gym03_line_glass_active', 'gym03_lines_connected', 'badge_circuito_awarded'])];
  save.badges = ['badge_aurora', 'badge_corolla', 'badge_circuito'];
  save.player = { ...save.player, mapId: 'veloria/r06_anello_magnetico', spawnPointId: 'from_vetracielo', x: 18, y: 17 };
  save.party = [{ instanceId: creature.instanceId, speciesId: creature.speciesId, level: 20, experience: 0, hp: 3, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  const potions = save.inventory.potion ?? 0;
  await seedBrowserSave(page, save);
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('ANELLO MAGNETICO');
  async function dismiss() {
    for (let tap = 0; tap < 12 && await page.locator('#dialogue-box').isVisible(); tap++)
      await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click(); await dismiss();
  await expect.poll(async () => (await readSave(page)).flags).toContain('q_r06_measurement');
  await walkTo(page, 'r06_anello_magnetico.tmj', 39, 25);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  await walkTo(page, 'ferraluce.tmj', 20, 22); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click(); await dismiss();
  await expect.poll(async () => (await readSave(page)).flags).toContain('q_ferraluce_report');
  expect((await readSave(page)).inventory.potion).toBe(potions + 2);
  await walkTo(page, 'ferraluce.tmj', 9, 23); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await expect.poll(async () => (await readSave(page)).party[0].hp).toBe(creature.stats.maxHp);
  await page.reload(); await enterGame(page);
  expect((await readSave(page)).flags).toContain('q_ferraluce_report');
  await page.screenshot({ path: info.outputPath('ferraluce-offline.png') });
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});


test('Ferraluce magnetic gym opens and retains its circuit with networking disabled', async ({ page, context }) => {
  test.setTimeout(120_000);
  await prepareMonorailTraveler(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.flags.push('q_ferraluce_report');
  save.player = { ...save.player, mapId: 'veloria/ferraluce', spawnPointId: 'from_gym04', x: 34, y: 19 };
  await seedBrowserSave(page, save);
  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  await page.reload(); await enterGame(page);
  await walkDirection(page, 'up');
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI FERRALUCE');
  for (const id of ['second', 'field', 'first']) {
    const node = magneticRouter.nodes.find(node => node.id === id)!;
    await walkTo(page, 'gym04_ferraluce.tmj', node.x, node.y + 2);
    await walkDirection(page, 'up');
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await page.getByRole('button', { name: 'RUOTA', exact: true }).click();
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  }
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(magneticRouter.solvedFlag);
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain(magneticRouter.solvedFlag);
  await walkTo(page, 'gym04_ferraluce.tmj', 15, 23);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  expect(failedRequests).toEqual([]);
});

test('the Condotto and Centrale open for the first time offline and retain the investigation reading', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  const errors: string[] = [], failedRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await prepareMonorailTraveler(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_ferraluce_report', 'gym04_magnetic_aligned', 'badge_acciaio_awarded', 'badge_aurora_awarded', 'badge_corolla_awarded'])];
  save.badges = ['badge_aurora', 'badge_corolla', 'badge_circuito', 'badge_acciaio'];
  save.player = { ...save.player, mapId: 'veloria/ferraluce', spawnPointId: 'from_r07', x: 38, y: 25 };
  await seedBrowserSave(page, save);
  // Neither new map has been opened: their first requests must use the production cache.
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  await walkDirection(page, 'right');
  await expect(page.locator('#current-location')).toHaveText('CONDOTTO RISONANTE');
  async function dismissDialogue() {
    await expect(page.locator('#dialogue-box')).toBeVisible();
    for (let tap = 0; tap < 16 && await page.locator('#dialogue-box').isVisible(); tap++)
      await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  await walkTo(page, 'r07_condotto_risonante.tmj', 20, 18);
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await dismissDialogue();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_r07_measurement');
  await walkTo(page, 'r07_condotto_risonante.tmj', 39, 11);
  await expect(page.locator('#current-location')).toHaveText('CENTRALE RISONANTE');
  await walkTo(page, 'd03_centrale_risonante.tmj', 8, 12);
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await dismissDialogue();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_centrale_log');
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('CENTRALE RISONANTE');
  const resumed = await readBrowserSave(page);
  expect(resumed.flags).toEqual(expect.arrayContaining(['q_r07_measurement', 'q_centrale_log']));
  expect(resumed.flags).not.toContain('q_centrale_isolated');
  await walkTo(page, 'd03_centrale_risonante.tmj', 15, 23);
  await expect(page.locator('#current-location')).toHaveText('CONDOTTO RISONANTE');
  await walkTo(page, 'r07_condotto_risonante.tmj', 0, 23);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  expect((await readBrowserSave(page)).flags).toEqual(expect.arrayContaining(['q_r07_measurement', 'q_centrale_log']));
  await page.screenshot({ path: info.outputPath('centrale-investigation-offline-return.png') });
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

for (const [group, expected] of [['coast',[72,73,98,99,170,171]],['lake',[79,80,96,97,133,177,178,196]],['starter-finals',[3,6,9,181]],['stone-evolutions',[26,134,135,136]]] as const) {
test(`${group} artwork decodes on its first request offline`, async ({ page, context }) => {
  const manifest = JSON.parse(await readFile(new URL(`../../assets/pokeapi-${group}-artwork-v1.json`, import.meta.url), 'utf8'));
  const artwork = manifest.artworks as Array<{ speciesId: number; path: string }>;
  expect(artwork.map(entry => entry.speciesId).sort((a, b) => a - b)).toEqual(expected);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  const decoded = await page.evaluate(async paths => Promise.all(paths.map(async path => {
    const image = new Image(); image.src = new URL(path, location.href).href;
    await image.decode(); return image.naturalWidth > 0 && image.naturalHeight > 0;
  })), artwork.map(entry => entry.path));
  expect(decoded).toEqual(artwork.map(() => true));
  expect(failedRequests).toEqual([]);
});

}

test('Ferraluce candidate artwork decodes on its first request offline', async ({ page, context }) => {
  const manifest = JSON.parse(await readFile(new URL('../../assets/pokeapi-urban-artwork-v1.json', import.meta.url), 'utf8'));
  const artwork = manifest.artworks.filter((entry: { speciesId: number }) => [82, 208, 227].includes(entry.speciesId));
  expect(artwork).toHaveLength(3);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  const decoded = await page.evaluate(async paths => Promise.all(paths.map(async path => {
    const image = new Image(); image.src = new URL(path, location.href).href;
    await image.decode(); return image.naturalWidth > 0 && image.naturalHeight > 0;
  })), artwork.map((entry: { path: string }) => entry.path));
  expect(decoded).toEqual([true, true, true]);
  expect(failedRequests).toEqual([]);
});

test('illustrated atlas opens for the first time offline from the production cache', async ({ page, context }) => {
  await page.goto('/');
  await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  // Never open the panel online: its image must come from install-time precache.
  await context.setOffline(true);
  await page.reload();
  await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la mappa di Veloria' }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas).toBeVisible();
  await expect(atlas.locator('.region-map-location')).toContainText('Borgofonte');
  expect(await page.evaluate(async () => {
    const image = new Image();
    image.src = '/assets/ui/veloria-region-atlas-v1.webp';
    await image.decode();
    return image.naturalWidth > 1000;
  })).toBe(true);
  await atlas.locator('.region-map-select').selectOption('ferraluce');
  await expect(atlas.locator('.region-map-details h3')).toHaveText('Ferraluce');
  await atlas.getByRole('button', { name: 'Chiudi ×' }).click();
  await expect(atlas).toBeHidden();
});


test('the monorail reaches visited cities and resumes at the terminal with networking disabled', async ({ page, context }) => {
  test.setTimeout(90_000);
  await prepareMonorailTraveler(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const before = travelResources(await readBrowserSave(page));
  await context.setOffline(true);
  const failures: string[] = [];
  page.on('requestfailed', request => failures.push(request.url()));
  for (const id of ['brumalta', 'ferraluce', 'vetracielo']) {
    await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
    const { station, spawn } = await stationArrival(id);
    await page.getByRole('button', { name: station.name, exact: true }).tap();
    await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({ mapId: station.mapId, spawnPointId: spawn.id, x: spawn.x, y: spawn.y });
    await expect(page.locator('#game-loading')).toBeHidden();
    expect(travelResources(await readBrowserSave(page))).toEqual(before);
    await page.reload(); await enterGame(page);
    expect((await readBrowserSave(page)).player).toMatchObject({ mapId: station.mapId, spawnPointId: spawn.id, x: spawn.x, y: spawn.y });
    expect(travelResources(await readBrowserSave(page))).toEqual(before);
  }
  expect(failures).toEqual([]);
});


test('mountain resources decode on first offline request and cable return survives reload',async({page,context})=>{
 test.setTimeout(120_000);
 await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','badge_riflesso_awarded','q_passobrina_report','badge_ghiaccio_awarded'])];save.badges=[...new Set([...save.badges,'badge_brina'])];save.player={...save.player,mapId:'veloria/passobrina',spawnPointId:'cable_arrival',x:29,y:22};
 await seedBrowserSave(page,save);const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);
 expect((await readBrowserSave(page)).player.mapId).toBe('veloria/passobrina');
 const decoded=await page.evaluate(async()=>{
  const names=['r12-wind-valley-v1','passobrina-v1','r13-white-switchbacks-v1','biancavetta-v1','gym07-ice-v1','acquariva-v2'];
  const images=await Promise.all(names.map(async name=>{const image=new Image();image.src=`/assets/scenery/veloria-${name}.webp`;await image.decode();return image.naturalWidth>1000;}));
  const widths=await Promise.all(['r12_valle_vento','passobrina','r13_tornanti_bianchi','biancavetta','gym07_biancavetta'].map(async name=>{const r=await fetch(`/tilemaps/${name}.tmj`);if(!r.ok)throw new Error(name);return(await r.json()).width;}));
  const creatures=await Promise.all([220,221,215,86,87,124].map(async id=>{const im=new Image();im.src=`/assets/creatures/pokeapi-mountain-${id}-v1.webp`;await im.decode();return im.naturalWidth>100;}));return{images,widths,creatures};
 });
 expect(decoded).toEqual({images:Array(6).fill(true),widths:[40,40,40,40,32],creatures:Array(6).fill(true)});
 await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Biancavetta',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');
 await page.reload();await enterGame(page);await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Passobrina',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/passobrina');expect(failures).toEqual([]);
});

test('crystal resources and environmental regulation work on first offline visit',async({page,context})=>{
 test.setTimeout(120_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','badge_ghiaccio_awarded','q_d05_low_read','q_d05_middle_read'])];save.player={...save.player,mapId:'veloria/d05_grotte_cristallo',spawnPointId:'from_r14',x:29,y:3};await seedBrowserSave(page,save);
 const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/d05_grotte_cristallo');
 const resources=await page.evaluate(async()=>{
  const paths=['assets/scenery/veloria-r14-crystal-pass-v1.webp','assets/scenery/veloria-d05-crystal-caverns-v1.webp','assets/scenery/veloria-biancavetta-v2.webp',...[41,42,74,75,95].map(i=>`assets/creatures/pokeapi-crystal-${i}-v1.webp`)];
  const images=await Promise.all(paths.map(async p=>{const im=new Image();im.src='/'+p;await im.decode();return im.naturalWidth>100;}));
  const maps=await Promise.all(['r14_varco_cristallo','d05_grotte_cristallo'].map(async m=>{const r=await fetch(`/tilemaps/${m}.tmj`);if(!r.ok)throw new Error(m);return(await r.json()).width;}));return{images,maps};
 });expect(resources).toEqual({images:Array(8).fill(true),maps:[40,40]});
 await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
 for(const name of ['Ventilazione → Aperta','Ventilazione → Delicata','Scambio termico → Lieve','Scambio termico → Moderato','VERIFICA EQUILIBRIO','CHIUDI'])await page.getByRole('button',{name,exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d05_climate_balanced');await page.reload();await enterGame(page);expect((await readBrowserSave(page)).flags).toContain('q_d05_climate_balanced');
 await walkTo(page,'d05_grotte_cristallo.tmj',11,29);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r14_varco_cristallo');expect(failures).toEqual([]);
});

test('P8 relays, crystal and dragon resources, and Concordia rail work offline',async({page,context})=>{
 test.setTimeout(150_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','q_concordia_restore_plan','q_d05_report','badge_circuito_awarded','badge_ghiaccio_awarded','q_concordia_visited','q_vetracielo_visited','atlas_visited_veloria/concordia','atlas_visited_veloria/vetracielo'])];save.badges=[...new Set([...save.badges,'badge_circuito','badge_brina'])];save.player={...save.player,mapId:'veloria/gym08_concordia',spawnPointId:'from_city',x:15,y:22};await seedBrowserSave(page,save);
 const failures:string[]=[];page.on('requestfailed',request=>failures.push(request.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/gym08_concordia');
 const decoded=await page.evaluate(async()=>{
  const images=['assets/scenery/veloria-concordia-v1.webp','assets/scenery/veloria-gym08-convergence-v1.webp','assets/scenery/veloria-r15-two-lights-v1.webp',...[116,117,147,148,149,230].map(id=>`assets/creatures/pokeapi-dragon-${id}-v1.webp`)];
  const imageResults=await Promise.all(images.map(async path=>{const image=new Image();image.src='/'+path;await image.decode();return image.naturalWidth>100&&image.naturalHeight>100;}));
  const maps=await Promise.all(['concordia','gym08_concordia','r15_passo_due_luci'].map(async name=>{const response=await fetch(`/tilemaps/${name}.tmj`);if(!response.ok)throw new Error(name);return(await response.json()).width;}));return{imageResults,maps};
 });expect(decoded).toEqual({imageResults:Array(9).fill(true),maps:[40,32,40]});
 for(const [index,x,y]of [[0,21,14],[1,21,8],[2,11,8],[3,11,14]]as const){
  await walkTo(page,'gym08_concordia.tmj',x,y+1);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'RUOTA',exact:true}).tap();
  if(index<3){expect((await readBrowserSave(page)).flags).not.toContain('gym08_convergence_complete');await page.getByRole('button',{name:'CHIUDI',exact:true}).tap();}
  if(index===3){for(let i=0;i<12&&await page.locator('#dialogue-box').isVisible();i++)await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await expect(page.locator('#dialogue-box')).toBeHidden();}
  if(index===1){await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/gym08_concordia');expect((await readBrowserSave(page)).flags).not.toContain('gym08_convergence_complete');}
 }
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('gym08_convergence_complete');
 await walkTo(page,'gym08_concordia.tmj',15,23);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');
 // Check the city station offline while retaining the completed P8 progression.
 await walkTo(page,'concordia.tmj',20,24);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();
 const before=travelResources(await readBrowserSave(page));await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Vetracielo',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');expect(travelResources(await readBrowserSave(page))).toEqual(before);
 await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Concordia',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');expect(travelResources(await readBrowserSave(page))).toEqual(before);expect(failures).toEqual([]);
});


test('Sanctuary first offline visit restores and verifies resonance, rewards once and returns to Concordia',async({page,context})=>{
 test.setTimeout(process.env.CI?240_000:150_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','badge_drago_awarded','q_d06_nature_read','q_d06_network_read','q_d06_restore_authorized'])];save.badges=[...new Set([...save.badges,'badge_armonia'])];save.player={...save.player,mapId:'veloria/d06_santuario_due_luci',spawnPointId:'from_concordia',x:15,y:22};await seedBrowserSave(page,save);const initialMoney=save.player.money,initialItems=save.inventory['hyper-potion']??0;
 const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/d06_santuario_due_luci');
 expect(await page.evaluate(async()=>{const image=new Image();image.src='/assets/scenery/veloria-sanctuary-two-lights-v1.webp';await image.decode();const response=await fetch('/tilemaps/d06_santuario_due_luci.tmj');return[image.naturalWidth>1000,(await response.json()).width];})).toEqual([true,32]);
 const confirm=()=>page.getByRole('button',{name:'Conferma e interagisci',exact:true});
 async function finishDialogue(){for(let i=0;i<24&&await page.locator('#dialogue-box').isVisible();i++)await confirm().tap();await expect(page.locator('#dialogue-box')).toBeHidden();}
 await walkTo(page,'d06_santuario_due_luci.tmj',16,16);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();for(const name of ['Flusso naturale → Graduale','Amplificazione → Controllata','Sincronia → Parziale','Sincronia → Condivisa','VERIFICA EQUILIBRIO','CHIUDI'])await page.getByRole('button',{name,exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d06_balance_restored');
 await page.reload();await enterGame(page);await walkTo(page,'d06_santuario_due_luci.tmj',16,6);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();await finishDialogue();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d06_receiver_confirmed');
 await walkTo(page,'d06_santuario_due_luci.tmj',18,18);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();await finishDialogue();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_resonance_restored');
 await page.reload();await enterGame(page);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();await finishDialogue();const after=await readBrowserSave(page);expect(after.player.money).toBe(initialMoney+1000);expect(after.inventory['hyper-potion']).toBe(initialItems+2);
 await walkTo(page,'d06_santuario_due_luci.tmj',15,23);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');expect(failures).toEqual([]);
});


test('R16 and League forecourt resources, services and the full walking return work on first offline visit',async({page,context})=>{
 test.setTimeout(process.env.CI?300_000:180_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','q_resonance_restored'])];save.player={...save.player,mapId:'veloria/r16_cammino_equilibrio',spawnPointId:'from_concordia',x:1,y:19,money:5000};
 const creature=createBattleCreature({species:speciesRegistry.species as any,moves:moveRegistry.moves as any,speciesId:6,level:50,instanceId:'offline-league',moveIds:['flamethrower','wing-attack']});save.party=[{instanceId:creature.instanceId,speciesId:6,level:50,experience:0,hp:1,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:1}))}];await seedBrowserSave(page,save);
 const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/r16_cammino_equilibrio');
 expect(await page.evaluate(async()=>{const images=await Promise.all(['veloria-r16-equilibrium-v1','veloria-league-forecourt-v1'].map(async key=>{const i=new Image();i.src='/assets/scenery/'+key+'.webp';await i.decode();return i.naturalWidth>1000;}));const widths=await Promise.all(['r16_cammino_equilibrio','league_forecourt'].map(async slug=>{const r=await fetch('/tilemaps/'+slug+'.tmj');if(!r.ok)throw new Error(slug);return(await r.json()).width;}));return{images,widths};})).toEqual({images:[true,true],widths:[40,40]});
 await walkTo(page,'r16_cammino_equilibrio.tmj',39,1);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/league_forecourt');await page.reload();await enterGame(page);await walkTo(page,'league_forecourt.tmj',9,15);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'RIPOSA',exact:true}).tap();for(let i=0;i<12&&await page.locator('#dialogue-box').isVisible();i++)await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).party[0].hp).toBe(creature.stats.maxHp);expect((await readBrowserSave(page)).party[0].moves[0].pp).toBe(moveRegistry.moves['flamethrower'].maxPp);
 await walkTo(page,'league_forecourt.tmj',31,15);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:/Iperpozione/}).tap();await expect.poll(async()=>(await readBrowserSave(page)).inventory['hyper-potion']).toBe(1);
 await walkTo(page,'league_forecourt.tmj',0,15);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r16_cammino_equilibrio');await walkTo(page,'r16_cammino_equilibrio.tmj',0,19);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.money).toBe(3500);expect((await readBrowserSave(page)).inventory['hyper-potion']).toBe(1);expect(failures).toEqual([]);
});


test('League rooms cache offline and a real final battle completes the championship and epilogue',async({page,context})=>{
 test.setTimeout(process.env.CI?360_000:240_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','q_resonance_restored','q_league_orientation','prologue_complete_seen',leagueSequence.activeFlag,...leagueSequence.stages.slice(0,4).flatMap(stage=>[stage.attemptWonFlag,stage.firstRewardFlag,stage.battleOnceFlag])])];save.badges=leagueSequence.requiredBadgeIds;save.player={...save.player,mapId:'veloria/league_champion',spawnPointId:'from_entry',x:15,y:21,money:1000};
 // Four previous wins are a checkpoint fixture. Only the final battle is claimed as played offline.
 const creature=createBattleCreature({species:speciesRegistry.species as any,moves:moveRegistry.moves as any,speciesId:87,level:100,instanceId:'offline-final',moveIds:['ice-beam']});save.party=Array.from({length:6},(_,index)=>({instanceId:`offline-final-${index}`,speciesId:87,level:100,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:m.pp}))}));await seedBrowserSave(page,save);const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/league_champion');
 expect(await page.evaluate(async()=>Promise.all(['council01','council02','council03','council04','champion'].map(async slug=>{const image=new Image();image.src='/assets/scenery/veloria-league-'+slug+'-v1.webp';await image.decode();const r=await fetch('/tilemaps/league_'+slug+'.tmj');return image.naturalWidth>1000&&r.ok&&(await r.json()).width===32;})))).toEqual(Array(5).fill(true));
 await walkTo(page,'league_champion.tmj',16,8);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'SFIDA',exact:true}).tap();await expect(page.locator('body')).toHaveClass(/battle-active/);
 for(let input=0;input<600&&await page.locator('body').evaluate(b=>b.classList.contains('battle-active'));input++){if(await page.locator('.battle-celebration').isVisible()){await page.getByRole('button',{name:'Continua',exact:true}).tap();break;}await page.keyboard.press('Enter');await page.waitForTimeout(100);}
 const ceremony=page.getByRole('dialog',{name:'Campione di Veloria!'});await expect(ceremony).toBeVisible();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_league_completed');await ceremony.getByRole('button',{name:'Leggi l’epilogo',exact:true}).tap();await page.getByRole('button',{name:'Torna a Veloria',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_league_epilogue_seen');await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.money).toBe(16000);await walkTo(page,'league_champion.tmj',15,23);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/league_forecourt');expect(failures).toEqual([]);
});


test('new route trainer data and Celia battle work on first offline visit', async ({ page, context }) => {
  test.setTimeout(process.env.CI ? 240_000 : 150_000);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'prologue_complete_seen'])];
  save.player = { ...save.player, mapId: 'veloria/r11_via_cascate', spawnPointId: 'from_acquariva', x: 15, y: 18, money: 2000 };
  const c = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 20, level: 80, instanceId: 'offline-celia', moveIds: ['crunch'] });
  save.party = [{ instanceId: c.instanceId, speciesId: 20, level: 80, experience: 0,
    hp: c.hp, maxHp: c.stats.maxHp, moves: c.moves.map(m => ({ id: m.moveId, pp: m.pp })) }];
  await seedBrowserSave(page, save);
  const failures: string[] = [];
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  expect(await page.evaluate(async () => Promise.all([
    ['r06_anello_magnetico', 'r06_iris'], ['r07_condotto_risonante', 'r07_dario'],
    ['r08_costa_turbine', 'r08_viola'], ['r11_via_cascate', 'r11_celia'],
  ].map(async ([map, key]) => {
    const r = await fetch(`/tilemaps/${map}.tmj`);
    const tiled = await r.json();
    return r.ok && tiled.layers.flatMap((l: any) => l.objects ?? []).some((o: any) =>
      o.properties?.some((p: any) => p.name === 'trainerId' && p.value === `veloria/trainer_${key}`));
  })))).toEqual([true, true, true, true]);
  const a = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await a.tap();
  for (let i = 0; i < 20 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); i++) await a.tap();
  await page.getByRole('button', { name: 'SFIDA', exact: true }).tap();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for (let input = 0; input < 400 && await page.locator('body').evaluate(b => b.classList.contains('battle-active')); input++) {
    if (await page.locator('.battle-celebration').isVisible()) {
      await page.getByRole('button', { name: 'Continua', exact: true }).tap(); break;
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  }
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_r11_celia_helped');
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).player.money).toBe(3500);
  await walkTo(page, 'r11_via_cascate.tmj', 16, 29);
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  expect(failures).toEqual([]);
});


test('illustrated Borgofonte decodes on its first offline request', async ({ page, context }) => {
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30000 });
  await context.setOffline(true);
  expect(await page.evaluate(async () => {
    const image = new Image(); image.src = new URL('assets/scenery/veloria-borgofonte-v2.webp', location.href).href;
    await image.decode(); return image.naturalWidth > 0 && image.naturalHeight > 0;
  })).toBe(true);
});

test('fourteen illustrated early-map environments decode on their first offline request', async ({ page, context }) => {
  test.setTimeout(120_000);
  const stems = [
    'r01_sentiero_alba', 'd01_bosco_veli', 'r02_viale_fronde', 'c01_brumalta',
    'gym01_brumalta', 'r03_terrazze_muschio', 'radicelmo', 'r04_salita_petali',
    'petalora', 'gym02_petalora', 'r05_viadotto_ciliegi', 'vetracielo',
    'r06_anello_magnetico', 'ferraluce',
  ];
  const errors: string[] = [];
  const failures: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  // Only the initial town has rendered. None of these environments may be warmed by visiting its map.
  const warmed = await page.evaluate(names => {
    const resources = performance.getEntriesByType('resource').map(entry => entry.name);
    return names.filter(stem => resources.some(url => url.includes(`/assets/scenery/veloria-${stem}-illustrated-v2.webp`)));
  }, stems);
  expect(warmed).toEqual([]);
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true);
  const decoded = await page.evaluate(async names => Promise.all(names.map(async stem => {
    const image = new Image();
    const path = `assets/scenery/veloria-${stem}-illustrated-v2.webp`;
    image.src = new URL(path, location.href).href;
    await image.decode();
    return { stem, width: image.naturalWidth, height: image.naturalHeight };
  })), stems);
  expect(decoded.map(image => image.stem)).toEqual(stems);
  for (const image of decoded) {
    expect(image.width, `${image.stem} image width`).toBeGreaterThanOrEqual(1000);
    expect(image.height, `${image.stem} image height`).toBeGreaterThanOrEqual(700);
  }
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
});
