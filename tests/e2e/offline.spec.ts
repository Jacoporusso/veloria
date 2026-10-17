import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';

async function getMvpResourcePaths(): Promise<string[]> {
  const mapsDirectory = new URL('../../content/maps/', import.meta.url);
  const files = await readdir(mapsDirectory);
  const mapFiles = files.filter(file => file.endsWith('.map.json')).sort();
  const resources = new Set(['index.html', '.vite/manifest.json']);
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
  const buildManifest = JSON.parse(await readFile(new URL('../../dist/.vite/manifest.json', import.meta.url), 'utf8')) as Record<string, {
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
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
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
        save.party = save.party.map((creature: any) => ({
          ...creature,
          hp: 1,
          status: { status: 'poison' },
          moves: creature.moves.map((move: any) => ({ ...move, pp: 0 })),
        }));
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
}

async function seedOfflineGymBattleParty(page: import('@playwright/test').Page) {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
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
          level: 30,
          experience: 0,
          hp: 999,
          maxHp: 999,
          moves: [
            { id: 'scratch', pp: 35 },
            { id: 'quick-attack', pp: 30 },
            { id: 'tackle', pp: 35 },
            { id: 'growl', pp: 40 },
          ],
        };
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
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
    await tapBattleCanvas(page, 0.5, 132);
    await page.waitForTimeout(90);
  }
}

async function captureWildOffline(page: import('@playwright/test').Page) {
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  await tapBattleCanvas(page, 0.75, 93);
  await tapBattleCanvas(page, 0.25, 144);
  for (let tap = 0; tap < 14; tap += 1) {
    if (!(await page.locator('body').evaluate(element => element.classList.contains('battle-active')))) return;
    await tapBattleCanvas(page, 0.5, 132);
    await page.waitForTimeout(90);
  }
}

test('E2E-06 desktop portion: the cached starter, route, encounter, healing and Aurora Badge work offline', async ({ page, context }, testInfo) => {
  test.setTimeout(240_000);
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
  }).toBe(21);

  // Disable all browser networking for the actual offline assertions.
  await context.setOffline(true);

  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`));
  const offlineResponse = await page.reload();
  expect(offlineResponse?.status()).toBe(200);
  await enterGame(page);

  const directions = { alto: 'Vai in alto', basso: 'Vai in basso', sinistra: 'Vai a sinistra', destra: 'Vai a destra' } as const;
  const walk = async (direction: keyof typeof directions, count: number, stopAtMapId?: string) => {
    const button = page.getByRole('button', { name: directions[direction] });
    for (let step = 0; step < count; step += 1) {
      const before = await readSave(page);
      await button.tap();
      await expect.poll(async () => {
        const player = (await readSave(page))?.player;
        return `${player?.mapId}|${player?.x},${player?.y}`;
      }).not.toBe(`${before.player.mapId}|${before.player.x},${before.player.y}`);
      if (stopAtMapId && (await readSave(page))?.player?.mapId === stopAtMapId) break;
    }
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
    for (const direction of route.reverse()) await walk(direction, 1);
  };

  // Start a new-game flow, then follow the same walkable route as E2E-02 while offline.
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect.poll(async () => (await readSave(page))?.player?.y).toBe(22);
  await walkToMapTile('bg_borgofonte.tmj', 20, 30);
  await expect(page.locator('#current-location')).toHaveText('LABORATORIO DI ELIA');
  await walkToMapTile('borgofonte_lab.tmj', 12, 8);
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  for (let step = 0; step < 5; step += 1) {
    if (await page.locator('#starter-choices').isVisible()) break;
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  }
  await expect(page.locator('#starter-choices')).toBeVisible();
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
  await walkToMapTile('bg_borgofonte.tmj', 20, 22);
  await walk('alto', 15);
  await walk('destra', 2, 'veloria/r01_sentiero_alba');
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/r01_sentiero_alba');
  await walk('destra', 14);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect.poll(async () => (await readSave(page))?.inventory?.potion).toBe(3);
  await walk('destra', 14);
  await walk('alto', 2, 'veloria/d01_bosco_veli');
  const finalSave = await readSave(page);
  expect(finalSave.player).toMatchObject({ mapId: 'veloria/d01_bosco_veli', spawnPointId: 'from_r01', x: 1, y: 10 });
  expect(finalSave.flags).toContain('item_r01_potion_collected');
  await seedOfflineCapture(page, findPidgeyCaptureSeed());
  await page.reload();
  await enterGame(page);
  await page.getByRole('button', { name: 'Vai a destra' }).tap();
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
  await walk('destra', 10);
  await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  for (let step = 0; step < 4; step += 1) await tapConfirm();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await walk('destra', 4);
  await tapConfirm();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_forest_signal_found');
  await walk('sinistra', 2);
  await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  for (let step = 0; step < 4; step += 1) await tapConfirm();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_ada_helped');

  await seedOfflineCapture(page, findNoEncounterSeed(60));
  await page.reload();
  await enterGame(page);
  await walk('destra', 15, 'veloria/r02_viale_fronde');
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

  // Keep the offline gym battle deterministic and winnable after testing the Center's recovery service.
  await seedOfflineGymBattleParty(page);
  await page.reload();
  await enterGame(page);
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

  expect((await readSave(page)).flags).toContain('q_ada_helped');
  expect(failedRequests).toEqual([]);
});
