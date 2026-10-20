import { expect, test, type Page } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';

// Long progression journeys exercise reduced motion; dedicated effect tests cover full animation.
test.use({ reducedMotion: 'reduce' });

async function readSaveSlot(page: Page, slot: 'main' | 'backup-previous' = 'main') {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await page.evaluate((key) => new Promise<any>((resolve, reject) => {
        const request = indexedDB.open('veloria-save', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('saves', 'readonly');
          const value = transaction.objectStore('saves').get(key);
          value.onsuccess = () => resolve(value.result ?? null);
          value.onerror = () => reject(value.error);
          transaction.oncomplete = () => database.close();
          transaction.onerror = () => reject(transaction.error);
        };
      }), slot);
    } catch (error) {
      if (attempt > 0 || !String(error).includes('Execution context was destroyed')) throw error;
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => undefined);
    }
  }
  return null;
}

async function readCurrentSave(page: Page) {
  return readSaveSlot(page);
}

async function readSaveChecksum(page: Page, slot: 'main' | 'backup-previous' = 'main') {
  return page.evaluate((key) => new Promise<any>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readonly');
      const value = transaction.objectStore('saves').get(`checksum:${key}`);
      value.onsuccess = () => resolve(value.result ?? null);
      value.onerror = () => reject(value.error);
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => reject(transaction.error);
    };
  }), slot);
}

async function clearSavedSlots(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      store.delete('main');
      store.delete('backup-previous');
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.evaluate(() => {
    localStorage.removeItem('veloria-save-v1');
    localStorage.removeItem('veloria-save-v1-backup');
  });
}

async function seedPidgeyBattle(page: Page) {
  await page.evaluate((changes) => new Promise<void>((resolve, reject) => {
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
        save.rngState = changes.rngState;
        save.party[0].moves.find((move: any) => move.id === 'growl').pp = 1;
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), { rngState: findPidgeySeed() });
}

async function seedCenterHealingScenario(page: Page) {
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

async function tapConfirm(page: Page) {
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
}

async function finishOpenDialogue(page: Page) {
  const dialogue = page.locator('#dialogue-box');
  await expect(dialogue).toBeVisible();
  await expect(page.locator('#starter-choices')).toBeHidden();
  // A reveals or advances depending on typing progress. Stop at closure so a
  // faster/slower browser cannot turn an extra confirmation into a new interaction.
  for (let step = 0; step < 24 && await dialogue.isVisible(); step += 1) await tapConfirm(page);
  await expect(dialogue).toBeHidden();
}

async function waitForWorldReady(page: Page) {
  await enterGame(page);
  await expect(page.locator('#current-location')).not.toHaveText('');
}

async function continueAfterChapterSummary(page: Page) {
  const button = page.getByRole('button', { name: 'Continua a esplorare' });
  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toBeHidden();
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('prologue_complete_seen');
}

async function reachStarterChoice(page: Page) {
  await page.goto('/');
  await waitForWorldReady(page);
  const down = page.getByRole('button', { name: 'Vai in basso' });
  await down.tap();
  await page.waitForTimeout(180);
  await down.tap();
  await expect.poll(async () => (await readCurrentSave(page))?.player.y).toBe(22);

  await walkToMapTile(page, 'bg_borgofonte.tmj', 20, 30, 'veloria/borgofonte_lab');
  await expect(page.locator('#current-location')).toHaveText('LABORATORIO DI ELIA');
  await walkToMapTile(page, 'borgofonte_lab.tmj', 12, 8);

  await tapConfirm(page);
  await expect(page.locator('#dialogue-box')).toBeVisible();
  for (let step = 0; step < 5; step += 1) {
    if (await page.locator('#starter-choices').isVisible()) break;
    await tapConfirm(page);
  }
  await expect(page.locator('#starter-choices')).toBeVisible();
}

async function chooseCharmander(page: Page) {
  await reachStarterChoice(page);
  await page.getByRole('button', { name: 'Charmander', exact: true }).click();
  await expect(page.locator('#dialogue-text')).toContainText('Charmander');
  await expect.poll(async () => (await readCurrentSave(page))?.party?.length).toBe(1);
}

async function completeResearchReadings(page: Page) {
  await walkToMapTile(page, 'borgofonte_lab.tmj', 12, 8);
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Professoressa Elia');
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('q_research_sample_received');
  await walkToMapTile(page, 'borgofonte_lab.tmj', 12, 14, 'veloria/borgofonte');
  await walkToMapTile(page, 'bg_borgofonte.tmj', 20, 22);
}

async function completeAdaForestQuest(page: Page) {
  const player = (await readCurrentSave(page)).player;
  expect(player.mapId).toBe('veloria/d01_bosco_veli');
  expect(player.y).toBe(10);
  if (player.x < 12) await walkToTile(page, 'destra', 12 - player.x);
  else if (player.x > 12) await walkToTile(page, 'sinistra', player.x - 12);
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();

  await walkToTile(page, 'destra', 4);
  await tapConfirm(page);
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('q_forest_signal_found');
  await walkToTile(page, 'sinistra', 2);
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  const save = await readCurrentSave(page);
  expect(save.flags).toContain('q_ada_helped');
  expect(save.inventory.potion).toBeGreaterThanOrEqual(4);
}

async function walkToTile(page: Page, direction: 'alto' | 'basso' | 'sinistra' | 'destra', count: number, stopAtMapId?: string) {
  const controls = {
    alto: 'Vai in alto',
    basso: 'Vai in basso',
    sinistra: 'Vai a sinistra',
    destra: 'Vai a destra',
  } as const;
  const button = page.getByRole('button', { name: controls[direction] });
  for (let step = 0; step < count; step += 1) {
    const before = await readCurrentSave(page);
    await button.tap();
    await expect.poll(async () => {
      const after = await readCurrentSave(page);
      return `${after?.player.mapId}|${after?.player.spawnPointId}|${after?.player.x},${after?.player.y}`;
    }).not.toBe(`${before.player.mapId}|${before.player.spawnPointId}|${before.player.x},${before.player.y}`);
    // A tile is saved before a portal's artwork finishes loading. Wait for the actual destination.
    await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
    if (stopAtMapId && (await readCurrentSave(page))?.player.mapId === stopAtMapId) break;
  }
}

async function walkToGymTile(page: Page, targetX: number, targetY: number) {
  const current = await readCurrentSave(page);
  const map = JSON.parse(await readFile(new URL('../../public/tilemaps/gym01_brumalta.tmj', import.meta.url), 'utf8'));
  const collisionLayer = map.layers.find((layer: any) => layer.name === 'collision');
  const blocked = new Set<string>();
  for (const object of collisionLayer.objects) {
    const left = Math.max(0, Math.floor(object.x / 32));
    const top = Math.max(0, Math.floor(object.y / 32));
    const right = Math.min(map.width, Math.ceil((object.x + Math.max(1, object.width ?? 32)) / 32));
    const bottom = Math.min(map.height, Math.ceil((object.y + Math.max(1, object.height ?? 32)) / 32));
    for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) blocked.add(`${x},${y}`);
  }

  const directions = [
    { x: 0, y: -1, direction: 'alto' as const },
    { x: 1, y: 0, direction: 'destra' as const },
    { x: 0, y: 1, direction: 'basso' as const },
    { x: -1, y: 0, direction: 'sinistra' as const },
  ];
  const start = `${current.player.x},${current.player.y}`;
  const goal = `${targetX},${targetY}`;
  const previous = new Map<string, { point: string; direction: typeof directions[number]['direction'] }>();
  const queue = [start];
  const visited = new Set(queue);
  while (queue.length && !visited.has(goal)) {
    const point = queue.shift()!;
    const [x, y] = point.split(',').map(Number);
    for (const step of directions) {
      const nextX = x + step.x, nextY = y + step.y, next = `${nextX},${nextY}`;
      if (nextX < 0 || nextY < 0 || nextX >= map.width || nextY >= map.height || blocked.has(next) || visited.has(next)) continue;
      visited.add(next);
      previous.set(next, { point, direction: step.direction });
      queue.push(next);
    }
  }
  if (!visited.has(goal)) throw new Error(`No walkable route from ${start} to gym tile ${goal}.`);
  const route: Array<typeof directions[number]['direction']> = [];
  for (let point = goal; point !== start;) {
    const step = previous.get(point);
    if (!step) throw new Error(`Broken gym route to ${goal}.`);
    route.push(step.direction);
    point = step.point;
  }
  for (const direction of route.reverse()) await walkToTile(page, direction, 1);
}

async function walkToMapTile(page: Page, tiledFile: string, targetX: number, targetY: number, stopAtMapId?: string) {
  const current = await readCurrentSave(page);
  const map = JSON.parse(await readFile(new URL(`../../public/tilemaps/${tiledFile}`, import.meta.url), 'utf8'));
  const blocked = new Set<string>();
  for (const object of map.layers.find((layer: any) => layer.name === 'collision').objects) {
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
  const directions = [
    { x: 0, y: -1, direction: 'alto' as const },
    { x: 1, y: 0, direction: 'destra' as const },
    { x: 0, y: 1, direction: 'basso' as const },
    { x: -1, y: 0, direction: 'sinistra' as const },
  ];
  const start = `${current.player.x},${current.player.y}`;
  const goal = `${targetX},${targetY}`;
  const previous = new Map<string, { point: string; direction: typeof directions[number]['direction'] }>();
  const queue = [start];
  const visited = new Set(queue);
  while (queue.length && !visited.has(goal)) {
    const point = queue.shift()!;
    const [x, y] = point.split(',').map(Number);
    for (const step of directions) {
      const nextX = x + step.x, nextY = y + step.y, next = `${nextX},${nextY}`;
      if (nextX < 0 || nextY < 0 || nextX >= map.width || nextY >= map.height || blocked.has(next) || visited.has(next)) continue;
      visited.add(next);
      previous.set(next, { point, direction: step.direction });
      queue.push(next);
    }
  }
  if (!visited.has(goal)) throw new Error(`No walkable route from ${start} to ${tiledFile} tile ${goal}.`);
  const route: Array<typeof directions[number]['direction']> = [];
  for (let point = goal; point !== start;) {
    const step = previous.get(point);
    if (!step) throw new Error(`Broken route to ${tiledFile} tile ${goal}.`);
    route.push(step.direction);
    point = step.point;
  }
  for (const direction of route.reverse()) {
    await walkToTile(page, direction, 1, stopAtMapId);
    if (stopAtMapId && (await readCurrentSave(page))?.player.mapId === stopAtMapId) return;
  }
}

function findSafeExpansionSeed() {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    let state = seed;
    let safe = true;
    for (let roll = 0; roll < 16; roll += 1) {
      state = nextRandom(state);
      if (state / 0x1_0000_0000 < 0.12) { safe = false; break; }
    }
    if (safe) return seed;
  }
  throw new Error('No deterministic encounter-free seed found for the expansion route.');
}

async function seedRadicelmoScenario(page: Page, badgeAwarded: boolean) {
  await page.evaluate(({ hasBadge, rngState }) => new Promise<void>((resolve, reject) => {
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
        save.player = { ...save.player, mapId: 'veloria/brumalta', spawnPointId: 'from_r03', x: 34, y: 12 };
        save.flags = [...new Set([...save.flags, 'q_ada_helped', ...(hasBadge ? ['badge_aurora_awarded'] : [])])];
        if (hasBadge && !save.badges.includes('badge_aurora')) save.badges.push('badge_aurora');
        save.rngState = rngState;
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), { hasBadge: badgeAwarded, rngState: findSafeExpansionSeed() });
}

async function seedR02Scenario(page: Page) {
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
        save.player = { ...save.player, mapId: 'veloria/r02_viale_fronde', spawnPointId: 'from_bosco', x: 1, y: 9 };
        save.flags = [...new Set([...save.flags, 'q_ada_helped'])];
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
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

function findPidgeySeed() {
    for (let seed = 1; seed < 1_000_000; seed += 1) {
    const encounterRoll = nextRandom(seed);
    if (encounterRoll / 0x1_0000_0000 >= 0.08) continue;
    const speciesRoll = nextRandom(encounterRoll);
    if (1 + Math.floor(speciesRoll / 0x1_0000_0000 * 100) <= 40) return seed;
  }
  throw new Error('No deterministic Pidgey encounter seed found.');
}

function findPidgeyCaptureSeed() {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    const encounterRoll = nextRandom(seed);
    if (encounterRoll / 0x1_0000_0000 >= 0.18) continue;
    const speciesRoll = nextRandom(encounterRoll);
    // Pidgey is the first day-band entry in the woodland table (20 of 100 weight).
    if (1 + Math.floor(speciesRoll / 0x1_0000_0000 * 100) > 20) continue;
    const levelRoll = nextRandom(speciesRoll);
    const captureRoll = nextRandom(levelRoll);
    if (captureRoll / 0x1_0000_0000 < 0.25) return seed;
  }
  throw new Error('No deterministic Pidgey capture seed found.');
}

function findNoEncounterSeed() {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    if (nextRandom(seed) / 0x1_0000_0000 >= 0.08) return seed;
  }
  throw new Error('No deterministic non-encounter seed found.');
}

async function setSaveRngState(page: Page, rngState: number) {
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

async function seedGymBadgeScenario(page: Page) {
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
        save.player.mapId = 'veloria/gym01_brumalta';
        save.player.spawnPointId = 'from_city';
        save.player.x = 13;
        save.player.y = 17;
        save.flags = [...new Set([...save.flags, 'q_brumalta_visited'])];
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
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
}

async function seedLegacySaveScenario(page: Page) {
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
        save.schemaVersion = 1;
        delete save.saveRevision;
        save.badges = ['badge_aurora'];
        save.storage = [{ instanceId: 'legacy-storage-001', speciesId: 16 }];
        save.flags = [...new Set([...save.flags, 'q_brumalta_visited', 'trainer_gym01_mira_defeated', 'badge_aurora_awarded'])];
        delete save.player.x;
        delete save.player.y;
        // Model an installation containing only this v1 save. A newer v2
        // backup would correctly win the revision-based recovery policy.
        store.delete('backup-previous');
        store.delete('checksum:backup-previous');
        localStorage.removeItem('veloria-save-v1');
        localStorage.removeItem('veloria-save-v1-backup');
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
}

async function seedBackupRoundtripScenario(page: Page) {
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
        const starter = save.party[0];
        save.player = { ...save.player, mapId: 'veloria/brumalta', spawnPointId: 'from_r02', x: 1, y: 12, money: 350 };
        save.party = [starter, {
          ...starter,
          instanceId: 'backup-party-pidgey-001',
          speciesId: 16,
          level: 8,
          experience: 0,
          hp: starter.maxHp,
        }];
        save.storage = [{ instanceId: 'backup-box-pidgey-001', speciesId: 16, level: 4 }];
        save.flags = [...new Set([...save.flags, 'q_brumalta_visited', 'q_forest_signal_found', 'badge_aurora_awarded'])];
        save.badges = ['badge_aurora'];
        save.inventory = { potion: 2, 'poke-ball': 1, antidote: 1, 'moss-key': 1 };
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
}

async function tapBattleCanvas(page: Page, xRatio: number, bottomOffset: number) {
  const canvas = page.locator('#game canvas');
  let box: { x: number; y: number; width: number; height: number } | null = null;
  await expect.poll(async () => {
    box = await canvas.evaluate(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || Math.abs(element.width - rect.width) > 1 || Math.abs(element.height - rect.height) > 1) return null;
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    return box !== null;
  }).toBe(true);
  if (!box) throw new Error('Battle canvas is not visible.');
  const readyBox = box as { x: number; y: number; width: number; height: number };
  await page.touchscreen.tap(readyBox.x + readyBox.width * xRatio, readyBox.y + readyBox.height - bottomOffset);
}

async function advanceBattleMessages(page: Page, stopAtCelebration = false) {
  for (let tap = 0; tap < 14; tap += 1) {
    if (!(await page.locator('body').evaluate(element => element.classList.contains('battle-active')))) return;
    if (await page.locator('.battle-celebration').isVisible()) {
      if (stopAtCelebration) return;
      await page.getByRole('button', { name: 'Continua', exact: true }).click();
      return;
    }
    // The battle message button is centered; this coordinate falls between command columns when a menu is open.
    await tapBattleCanvas(page, 0.5, 132);
    await page.waitForTimeout(90);
  }
}

async function battleStatus(page: Page): Promise<{ mode: string; terminalShown: boolean }> {
  return page.evaluate(() => {
    const game = (window as any).__mvpGame;
    if (!game?.scene.isActive('battle')) return { mode: 'inactive', terminalShown: false };
    const scene = game.scene.getScene('battle');
    return { mode: scene.mode, terminalShown: scene.terminalShown };
  });
}

async function battleMode(page: Page): Promise<string> { return (await battleStatus(page)).mode; }

async function advanceBattleToMenuWithTouch(page: Page) {
  let terminalShown = false;
  // Let the queued turn messages advance through their normal timers.
  await expect.poll(async () => {
    const status = await battleStatus(page);
    terminalShown = status.terminalShown;
    return status.terminalShown || status.mode === 'menu' || status.mode === 'inactive';
  }, { timeout: 30_000, intervals: [100, 250, 500], message: 'The turn message queue returns to the command menu automatically.' }).toBe(true);
  if (terminalShown) await expect(page.locator('.battle-celebration')).toBeVisible({ timeout: 15_000 });
}

async function advanceBattleToMenu(page: Page) {
  for (let step = 0; step < 60; step += 1) {
    if (await page.locator('.battle-celebration').isVisible()) return;
    const { mode, terminalShown } = await battleStatus(page);
    if (terminalShown) {
      await expect(page.locator('.battle-celebration')).toBeVisible({ timeout: 15_000 });
      return;
    }
    if (mode === 'menu' || mode === 'inactive') return;
    if (mode === 'message') {
      await tapBattleCanvas(page, 0.5, 132);
      await page.waitForTimeout(90);
    } else if (mode === 'learning' || mode === 'moves') await page.keyboard.press('Enter', { delay: 40 });
    else await page.waitForTimeout(40);
  }
  throw new Error(`Battle did not return to its command menu; current mode is ${await battleMode(page)}.`);
}

async function captureWildWithTouch(page: Page) {
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  // CATTURA is row two, column two; the first capture item is the top-left choice.
  await tapBattleCanvas(page, 0.75, 93);
  await tapBattleCanvas(page, 0.25, 144);
  await advanceBattleMessages(page);
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
}

test('E2E-01: mobile controls reach Elia, select one starter, and do not offer a second', async ({ page }) => {
  await chooseCharmander(page);
  let save = await readCurrentSave(page);
  expect(await readSaveChecksum(page)).toMatch(/^fnv1a32-[0-9a-f]{8}$/);
  expect(save.party).toHaveLength(1);
  expect(save.party[0]).toMatchObject({ speciesId: 4, level: 5 });
  expect(save.player).toMatchObject({ mapId: 'veloria/borgofonte_lab', x: 12, y: 8 });

  // A slow reader may confirm after the first page has finished typing.
  await expect(page.locator('#dialogue-text')).toHaveText('Ottima scelta. Charmander sarà il tuo compagno di viaggio.');
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Professoressa Elia');
  await expect(page.locator('#starter-choices')).toBeHidden();
  save = await readCurrentSave(page);
  expect(save.party).toHaveLength(1);
  expect(save.party[0].speciesId).toBe(4);
  await page.getByRole('button', { name: 'Annulla' }).tap();
  await expect(page.locator('#dialogue-box')).toBeHidden();

  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
  await expect(page.getByRole('dialog', { name: 'Pokédex' })).toBeVisible();
  const speciesCatalog = JSON.parse(await readFile(new URL('../../content/battle/species.v1.json', import.meta.url), 'utf8')).species;
  await expect(page.locator('#pokedex-summary')).toContainText(`1 viste · 1 catturate · ${Object.keys(speciesCatalog).length} specie`);
  await expect(page.locator('#pokedex-list')).toContainText('Charmander');
  await page.getByRole('button', { name: 'Chiudi il Pokédex' }).click();
  await expect(page.getByRole('dialog', { name: 'Pokédex' })).toBeHidden();
  await page.keyboard.press('p', { delay: 40 });
  await expect(page.getByRole('dialog', { name: 'Pokédex' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chiudi il Pokédex' })).toBeFocused();
  await page.keyboard.press('Escape', { delay: 40 });
  await expect(page.getByRole('dialog', { name: 'Pokédex' })).toBeHidden();
});

test('E2E save recovery: a checksum mismatch restores the previous valid record', async ({ page }) => {
  await chooseCharmander(page);
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await walkToTile(page, 'destra', 1);
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
        save.player.money += 1;
        store.put(save, 'main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));

  await page.reload();
  await waitForWorldReady(page);
  const recovered = await readCurrentSave(page);
  expect(recovered.party).toHaveLength(1);
  expect(recovered.party[0].speciesId).toBe(4);
  expect(await readSaveChecksum(page)).toMatch(/^fnv1a32-[0-9a-f]{8}$/);
});

test('E2E-02: touch navigation reaches the forest and restores its spawn after reload', async ({ page }) => {
  test.setTimeout(120_000);
  await chooseCharmander(page);
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();

  // Elia supplies the readings after the starter; the northern exit requires the starter itself.
  await completeResearchReadings(page);

  // The helper returns to the village approach at (20,22); follow the north path.
  await walkToMapTile(page, 'bg_borgofonte.tmj', 23, 7, 'veloria/r01_sentiero_alba');
  await expect.poll(async () => {
    const save = await readCurrentSave(page);
    return `${save?.player.mapId}|${save?.player.spawnPointId}|${save?.player.x},${save?.player.y}`;
  }).toBe('veloria/r01_sentiero_alba|from_borgofonte|1,10');
  await expect(page.locator('#current-location')).toHaveText("SENTIERO DELL'ALBA");

  // Follow the encounter-free southern edge of R01 and enter the forest exit at (29, 8).
  await walkToTile(page, 'destra', 28);
  await walkToTile(page, 'alto', 2);
  await expect.poll(async () => {
    const player = (await readCurrentSave(page))?.player;
    return `${player?.mapId}|${player?.spawnPointId}|${player?.x},${player?.y}`;
  }).toBe('veloria/d01_bosco_veli|from_r01|1,10');
  await expect(page.locator('#current-location')).toHaveText('BOSCO DEI VELI');

  await page.reload();
  await waitForWorldReady(page);
  await expect(page.locator('#current-location')).toHaveText('BOSCO DEI VELI');
  const restored = await readCurrentSave(page);
  expect(restored.player).toMatchObject({
    mapId: 'veloria/d01_bosco_veli',
    spawnPointId: 'from_r01',
    x: 1,
    y: 10,
  });
  expect(restored.party).toHaveLength(1);
  expect(restored.flags).toContain('q_starter_selected');
});

test('E2E-09: the R01 first-aid pickup grants one potion and stays collected after reload', async ({ page }) => {
  test.setTimeout(120_000);
  await chooseCharmander(page);
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await completeResearchReadings(page);
  await walkToMapTile(page, 'bg_borgofonte.tmj', 23, 7, 'veloria/r01_sentiero_alba');
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/r01_sentiero_alba');
  await walkToTile(page, 'destra', 14);

  // The pickup rests on a blocked side tile. Face it from the path, then interact with A.
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  await expect.poll(async () => (await readCurrentSave(page))?.inventory?.potion).toBe(3);
  let save = await readCurrentSave(page);
  expect(save.flags).toContain('item_r01_potion_collected');

  await page.reload();
  await waitForWorldReady(page);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  save = await readCurrentSave(page);
  expect(save.inventory.potion).toBe(3);
  expect(save.flags.filter((flag: string) => flag === 'item_r01_potion_collected')).toHaveLength(1);
});

test('E2E-03: a wild Pidgey battle exhausts Growl, uses Scratch, and persists HP, PP, and XP', async ({ page }) => {
  // This scenario includes the full indoor prologue, route traversal and several turns.
  // Allow slower CI input while retaining every step, including the final reload.
  test.setTimeout(process.env.CI ? 240_000 : 120_000);
  // The smallest supported portrait candidate catches battle UI overflow before device QA.
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    Date.prototype.getHours = () => 12;
  });
  await chooseCharmander(page);
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await completeResearchReadings(page);
  await walkToMapTile(page, 'bg_borgofonte.tmj', 23, 7, 'veloria/r01_sentiero_alba');
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/r01_sentiero_alba');

  // Walk to the tile just outside the northwest grass zone, then seed one 8% roll for a day-band Pidgey.
  await walkToTile(page, 'alto', 4);
  await walkToTile(page, 'destra', 6);
  let before = await readCurrentSave(page);
  expect(before.player).toMatchObject({ mapId: 'veloria/r01_sentiero_alba', x: 7, y: 6 });
  await seedPidgeyBattle(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForWorldReady(page);
  await walkToTile(page, 'destra', 1);
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  const battleBounds = await page.locator('#game canvas').evaluate(canvas => {
    const rect = canvas.getBoundingClientRect();
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
  });
  expect(battleBounds).toMatchObject({ left: 0, top: 0, right: 320, bottom: 568, width: 320, height: 568 });
  expect(await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }))).toEqual({ width: 320, height: 568 });

  before = await readCurrentSave(page);
  const initialCreature = before.party[0];
  expect(initialCreature.moves.find((move: any) => move.id === 'growl').pp).toBe(1);
  const canvas = page.locator('#game canvas');

  // LOTTA (first menu cell), then Growl (second move cell).
  await tapBattleCanvas(page, 0.25, 144);
  await tapBattleCanvas(page, 0.75, 140);
  await advanceBattleMessages(page);

  // Scratch is the first move cell. Repeat until the battle closes; centered message taps are harmless on menus.
  for (let turn = 0; turn < 6; turn += 1) {
    if (!(await page.locator('body').evaluate(element => element.classList.contains('battle-active')))) break;
    await tapBattleCanvas(page, 0.25, 144);
    await tapBattleCanvas(page, 0.25, 140);
    await advanceBattleMessages(page);
  }
  await advanceBattleMessages(page);
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);

  await expect.poll(async () => {
    const save = await readCurrentSave(page);
    return save?.party?.[0]?.experience;
  }).toBe(initialCreature.experience + 21); // Pidgey level 3: floor(50 * 3 / 7).
  const afterBattle = await readCurrentSave(page);
  const defeated = afterBattle.party[0];
  expect(defeated.instanceId).toBe(initialCreature.instanceId);
  expect(defeated.hp).toBeLessThan(initialCreature.hp);
  expect(defeated.hp).toBeGreaterThan(0);
  expect(defeated.moves.find((move: any) => move.id === 'growl').pp).toBe(0);
  expect(defeated.moves.find((move: any) => move.id === 'scratch').pp).toBeLessThan(initialCreature.moves.find((move: any) => move.id === 'scratch').pp);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForWorldReady(page);
  const restored = await readCurrentSave(page);
  expect(restored.party[0]).toMatchObject({
    instanceId: initialCreature.instanceId,
    hp: defeated.hp,
    experience: initialCreature.experience + 21,
  });
  expect(restored.party[0].moves).toEqual(defeated.moves);
});

test('E2E-04: capture with a full party stores a unique creature visible at the Pokémon Center after reload', async ({ page }) => {
  test.setTimeout(process.env.CI ? 360_000 : 240_000);
  await page.addInitScript(() => { Date.prototype.getHours = () => 12; });
  await chooseCharmander(page);
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await completeResearchReadings(page);

  // Enter Bosco via R01 while keeping to the encounter-free south edge of the route.
  await walkToMapTile(page, 'bg_borgofonte.tmj', 23, 7, 'veloria/r01_sentiero_alba');
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/r01_sentiero_alba');
  await walkToTile(page, 'destra', 28);
  await walkToTile(page, 'alto', 2);
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/d01_bosco_veli');
  await walkToMapTile(page, 'd01_bosco_veli.tmj', 1, 8);

  // Capture five real woodland Pidgey with the five starting balls, filling the six-slot party.
  for (let captured = 0; captured < 5; captured += 1) {
    await setSaveRngState(page, findPidgeyCaptureSeed());
    await page.reload();
    await waitForWorldReady(page);
    await walkToTile(page, captured === 3 ? 'sinistra' : 'destra', 1);
    await captureWildWithTouch(page);
    await expect.poll(async () => (await readCurrentSave(page))?.party?.length).toBe(captured + 2);
    expect((await readCurrentSave(page)).inventory['poke-ball']).toBe(4 - captured);
  }
  let save = await readCurrentSave(page);
  expect(save.party).toHaveLength(6);
  expect(save.party.slice(1).every((creature: any) => creature.speciesId === 16)).toBe(true);
  expect(save.inventory['poke-ball']).toBe(0);

  await walkToTile(page, 'basso', 2);
  await completeAdaForestQuest(page);
  await setSaveRngState(page, findNoEncounterSeed());
  await page.reload();
  await waitForWorldReady(page);

  // Leave the forest only after completing Ada's report.
  for (let step = 0; step < 4 && await page.locator('#dialogue-box').isVisible(); step += 1) await tapConfirm(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await walkToTile(page, 'destra', 15);
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/r02_viale_fronde');
  await walkToTile(page, 'destra', 26);
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/brumalta');
  await walkToTile(page, 'destra', 5);
  await walkToTile(page, 'basso', 2);
  await tapConfirm(page);
  await expect(page.locator('#starter-choices')).toBeVisible();
  await page.getByRole('button', { name: /Sfera.*150/ }).click();
  await expect.poll(async () => (await readCurrentSave(page))?.inventory?.['poke-ball']).toBe(1);
  expect((await readCurrentSave(page)).player.money).toBe(350);

  // Return to the forest, prepare one guaranteed Pidgey, and catch it while all six slots are occupied.
  await walkToTile(page, 'alto', 2);
  await walkToTile(page, 'sinistra', 6);
  await expect.poll(async () => {
    const player = (await readCurrentSave(page))?.player;
    return `${player?.mapId}|${player?.spawnPointId}|${player?.x},${player?.y}`;
  }).toBe('veloria/r02_viale_fronde|to_brumalta|26,9');
  await walkToTile(page, 'sinistra', 26, 'veloria/d01_bosco_veli');
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/d01_bosco_veli');
  await expect.poll(async () => (await readCurrentSave(page))?.player).toMatchObject({ spawnPointId: 'to_r02', x: 29, y: 10 });
  await walkToTile(page, 'sinistra', 23);
  await walkToTile(page, 'alto', 2);
  save = await readCurrentSave(page);
  expect(save.player).toMatchObject({ mapId: 'veloria/d01_bosco_veli', x: 6, y: 8 });
  await setSaveRngState(page, findPidgeyCaptureSeed());
  await page.reload();
  await waitForWorldReady(page);
  await walkToTile(page, 'sinistra', 1);
  await captureWildWithTouch(page);
  await expect.poll(async () => (await readCurrentSave(page))?.storage?.length).toBe(1);
  const capturedInBox = (await readCurrentSave(page)).storage[0];
  expect(capturedInBox.speciesId).toBe(16);
  expect((await readCurrentSave(page)).party).toHaveLength(6);
  expect((await readCurrentSave(page)).inventory['poke-ball']).toBe(0);

  // Enter Brumalta's storage service and verify the stored wild instance is listed for withdrawal.
  await walkToTile(page, 'basso', 2);
  await walkToTile(page, 'destra', 24);
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/r02_viale_fronde');
  await walkToTile(page, 'destra', 26);
  await expect.poll(async () => (await readCurrentSave(page))?.player.mapId).toBe('veloria/brumalta');
  await walkToTile(page, 'alto', 5);
  await walkToTile(page, 'destra', 5);
  await page.getByRole('button', { name: 'Vai in alto' }).tap(); // Face the Center's entrance.
  await tapConfirm(page);
  await expect(page.locator('#starter-choices')).toBeVisible();
  await seedCenterHealingScenario(page);
  await page.reload();
  await waitForWorldReady(page);
  await expect.poll(async () => (await readCurrentSave(page))?.party.every((creature: any) =>
    creature.hp === 1 && creature.status?.status === 'poison' && creature.moves.every((move: any) => move.pp === 0),
  )).toBe(true);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  await expect(page.locator('#starter-choices')).toBeVisible();
  await page.getByRole('button', { name: 'RIPOSA' }).click();
  await expect.poll(async () => (await readCurrentSave(page))?.party.every((creature: any) =>
    creature.hp === creature.maxHp && creature.status === undefined && creature.moves.every((move: any) => move.pp > 0),
  )).toBe(true);

  // Healing remains available alongside storage after the party is restored.
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  await expect(page.locator('#starter-choices')).toBeVisible();
  await page.getByRole('button', { name: 'DEPOSITO' }).click();
  await expect(page.locator('#dialogue-text')).toContainText('Squadra: 6/6 · Box: 1.');
  await expect(page.getByRole('button', { name: /RITIRA · Pidgey/ })).toHaveCount(1);

  await page.reload();
  await waitForWorldReady(page);
  const restored = await readCurrentSave(page);
  expect(restored.party).toHaveLength(6);
  expect(restored.storage).toHaveLength(1);
  expect(restored.storage[0]).toMatchObject({ instanceId: capturedInBox.instanceId, speciesId: 16 });
  const occurrences = [...restored.party, ...restored.storage]
    .filter((creature: any) => creature.instanceId === capturedInBox.instanceId);
  expect(occurrences).toHaveLength(1);
});

test('E2E-05: defeating Mira awards one persistent Aurora Badge and updates her dialogue', async ({ page }, testInfo) => {
  test.setTimeout(process.env.CI ? 240_000 : 120_000);
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__mvpGame = game;` });
  });
  await chooseCharmander(page);
  await seedGymBadgeScenario(page);
  await page.reload();
  await waitForWorldReady(page);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI BRUMALTA');

  // Travel is seeded at the gym entrance, but the three trigger tiles are activated through real movement.
  await walkToGymTile(page, 13, 14);
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('gym01_resonance_south');
  await walkToGymTile(page, 8, 10);
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('gym01_resonance_middle');
  await walkToGymTile(page, 18, 6);
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('gym01_puzzle_solved');
  await walkToGymTile(page, 14, 3);
  await walkToTile(page, 'basso', 1);
  await walkToTile(page, 'alto', 1);
  await tapConfirm(page);
  await expect(page.locator('#dialogue-text')).toContainText('Medaglia Aurora');
  for (let step = 0; step < 5 && !(await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible()); step += 1) {
    await tapConfirm(page);
  }
  await expect(page.getByRole('button', { name: 'NON ORA', exact: true })).toBeVisible();
  await expect(page.locator('#dialogue-text')).toContainText('2 Pokémon di livello 7–8');
  await page.screenshot({ path: testInfo.outputPath('mira-preparation.png') });
  await page.getByRole('button', { name: 'NON ORA', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  expect((await readCurrentSave(page)).flags).not.toContain('trainer_gym01_mira_defeated');

  await tapConfirm(page);
  for (let step = 0; step < 5 && !(await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible()); step += 1) {
    await tapConfirm(page);
  }
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);

  await advanceBattleToMenu(page);
  for (let turn = 0; turn < 20; turn += 1) {
    if (await page.locator('.battle-celebration').isVisible()) break;
    await expect.poll(() => battleMode(page)).toBe('menu');
    await page.keyboard.press('Enter', { delay: 40 });
    await expect.poll(() => battleMode(page)).toBe('moves');
    await page.keyboard.press('Enter', { delay: 40 }); // Scratch, the first move slot.
    await expect.poll(() => battleMode(page)).toBe('message');
    await advanceBattleToMenu(page);
  }
  const celebration = page.getByRole('dialog', { name: 'Medaglia Aurora conquistata!' });
  await expect(celebration).toBeVisible();
  await expect(celebration).toContainText('+500 monete');
  await expect(celebration).toContainText('Ti affido la Medaglia Aurora');
  await expect(celebration.locator('.badge-emblem svg')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mira-medal-celebration.png') });
  await celebration.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  await expect.poll(async () => (await readCurrentSave(page))?.badges?.filter((badge: string) => badge === 'badge_aurora').length).toBe(1);
  let save = await readCurrentSave(page);
  expect(save.flags).toContain('trainer_gym01_mira_defeated');
  expect(save.flags).toContain('badge_aurora_awarded');
  expect(save.player.money).toBe(800);
  await expect(page.getByRole('heading', { name: 'Primo capitolo completato' })).toBeVisible();
  await page.getByRole('button', { name: 'Continua a esplorare' }).click();
  await expect.poll(async () => (await readCurrentSave(page)).flags).toContain('prologue_complete_seen');

  await page.reload();
  await waitForWorldReady(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri le medaglie' }).click();
  await expect(page.getByRole('dialog', { name: 'Le tue medaglie' })).toContainText('Medaglia Aurora');
  await expect(page.locator('.badge-case-card .badge-emblem svg')).toBeVisible();
  await page.keyboard.press('Escape');
  save = await readCurrentSave(page);
  expect(save.badges.filter((badge: string) => badge === 'badge_aurora')).toHaveLength(1);
  expect(save.flags).toContain('trainer_gym01_mira_defeated');
  await walkToTile(page, 'basso', 1);
  await walkToTile(page, 'alto', 1);
  await tapConfirm(page);
  await expect(page.locator('#dialogue-text')).toContainText('Hai conquistato la Medaglia Aurora');
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  expect((await readCurrentSave(page)).badges.filter((badge: string) => badge === 'badge_aurora')).toHaveLength(1);
});

test('R02: the Viale vista loads Brumalta and its sign explains the route ahead', async ({ page }, testInfo) => {
  await chooseCharmander(page);
  await seedR02Scenario(page);
  await page.reload();
  await waitForWorldReady(page);

  await expect(page.locator('#current-location')).toHaveText('VIALE DELLE FRONDE');
  await walkToMapTile(page, 'r02_viale_fronde.tmj', 20, 8);
  await page.screenshot({ path: testInfo.outputPath('r02-brumalta-vista.png') });
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  await expect(page.locator('#toast')).toContainText(/Brumalta.*città-parco/);
  await expect(page.locator('#toast')).toContainText('felci');
});

test('R04: the petal ascent reaches Petalora, services work, and Nila rewards only once', async ({page}, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__mvpGame = game;` });
  });
  await chooseCharmander(page);
  const species = JSON.parse(await readFile(new URL('../../content/battle/species.v1.json', import.meta.url), 'utf8')).species;
  const moves = JSON.parse(await readFile(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves;
  // Prepared party checks route integration and reward persistence, not natural battle balance.
  const prepared = createBattleCreature({species, moves, speciesId: 5, level: 16, instanceId: 'petalora-party', moveIds: ['ember', 'scratch', 'growl', 'smokescreen']});
  async function seed(hasBadge: boolean) {
    await page.evaluate(({creature, hasBadge}) => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('veloria-save', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('saves', 'readwrite'), store = tx.objectStore('saves');
        const get = store.get('main');
        get.onsuccess = () => {
          const save = get.result;
          save.player = {...save.player, mapId: 'veloria/radicelmo', spawnPointId: 'from_r04', x: 18, y: 2, money: 500};
          save.flags = [...new Set([...save.flags, 'q_research_sample_received','q_forest_signal_found','q_ada_helped','q_brumalta_visited','gym01_puzzle_solved','prologue_complete_seen', ...(hasBadge ? ['badge_aurora_awarded'] : [])])];
          save.badges = hasBadge ? ['badge_aurora'] : [];
          save.party = [{instanceId: creature.instanceId, speciesId: creature.speciesId, level: creature.level, experience: 0, hp: 1, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({id: slot.moveId, pp: slot.pp}))}];
          store.put(save, 'main'); store.delete('checksum:main');
        };
        tx.oncomplete = () => {db.close(); resolve();};
        tx.onerror = () => reject(tx.error);
      };
    }), {creature: prepared, hasBadge});
    await page.reload(); await waitForWorldReady(page);
  }
  await seed(false);
  await walkToTile(page, 'alto', 2);
  expect((await readCurrentSave(page)).player.mapId).toBe('veloria/radicelmo');
  await expect(page.locator('#toast')).toContainText('Medaglia Aurora');
  await seed(true);
  await walkToMapTile(page, 'radicelmo.tmj', 18, 0, 'veloria/r04_salita_petali');
  await expect(page.locator('#current-location')).toHaveText('SALITA DEI PETALI');
  expect((await readCurrentSave(page)).flags).not.toContain('q_radicelmo_greenhouse_complete');
  for (const [x,y] of [[18,23],[7,23],[7,14],[30,14]]) await walkToMapTile(page, 'r04_salita_petali.tmj', x,y);
  await page.screenshot({path: testInfo.outputPath('petal-ascent.png')});
  await walkToMapTile(page, 'r04_salita_petali.tmj', 30, 0, 'veloria/petalora');
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  await expect.poll(async () => (await readCurrentSave(page)).flags).toContain('q_petalora_visited');
  await page.reload(); await waitForWorldReady(page);
  expect((await readCurrentSave(page)).flags).toContain('q_petalora_visited');
  await walkToMapTile(page, 'petalora.tmj', 10, 9);
  await walkToTile(page, 'alto', 1);
  await tapConfirm(page);
  await page.getByRole('button', {name:'RIPOSA', exact:true}).click();
  await expect.poll(async () => (await readCurrentSave(page)).party.every((c:any)=>c.hp===c.maxHp)).toBe(true);
  const beforeShop = await readCurrentSave(page);
  await walkToMapTile(page, 'petalora.tmj', 27, 9);
  await walkToTile(page, 'alto', 1);
  await tapConfirm(page);
  await page.getByRole('button', {name:/^Pozione · 200/}).click();
  await expect.poll(async () => (await readCurrentSave(page)).player.money).toBe(beforeShop.player.money - 200);
  expect((await readCurrentSave(page)).inventory.potion).toBe((beforeShop.inventory.potion ?? 0) + 1);
  await page.screenshot({path: testInfo.outputPath('petalora-services.png')});
  await walkToMapTile(page, 'petalora.tmj', 18, 27, 'veloria/r04_salita_petali');
  await expect(page.locator('#current-location')).toHaveText('SALITA DEI PETALI');
  await walkToMapTile(page, 'r04_salita_petali.tmj', 30,14);
  await walkToMapTile(page, 'r04_salita_petali.tmj', 10,14);
  await walkToTile(page, 'basso', 1);
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Nila');
  for(let tap=0;tap<8 && !(await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible());tap++) await tapConfirm(page);
  const moneyBefore = (await readCurrentSave(page)).player.money;
  await page.getByRole('button',{name:'SFIDA',exact:true}).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for(let turn=0;turn<12;turn++) {
    if(await page.locator('.battle-celebration').isVisible())break;
    await tapBattleCanvas(page,.25,144);
    await tapBattleCanvas(page,.25,140);
    await advanceBattleToMenuWithTouch(page);
  }
  const banner=page.locator('.battle-celebration');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Nila');
  await expect(banner).toContainText('+180 monete');
  await banner.getByRole('button',{name:'Continua',exact:true}).click();
  await expect.poll(async () => (await readCurrentSave(page)).flags).toContain('trainer_r04_nila_defeated');
  expect((await readCurrentSave(page)).player.money).toBe(moneyBefore+180);
  await page.reload(); await waitForWorldReady(page);
  await walkToMapTile(page,'r04_salita_petali.tmj',10,14);
  await walkToTile(page,'basso',1);
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Nila');
  for(let tap=0;tap<8 && await page.locator('#dialogue-box').isVisible();tap++)await tapConfirm(page);
  await expect(page.getByRole('button',{name:'SFIDA',exact:true})).toBeHidden();
  expect((await readCurrentSave(page)).player.money).toBe(moneyBefore+180);
  expect(errors).toEqual([]);
});

test('E2E-12: the Aurora Badge opens the moss terraces and Radicelmo archive and greenhouse persist', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await chooseCharmander(page);

  // The visible Brumalta road remains closed until the persistent badge flag is awarded.
  await seedRadicelmoScenario(page, false);
  await page.reload();
  await waitForWorldReady(page);
  await page.getByRole('button', { name: 'Vai a destra' }).tap();
  await expect.poll(async () => (await readCurrentSave(page))?.player).toMatchObject({
    mapId: 'veloria/brumalta', x: 35, y: 12,
  });
  await expect(page.locator('#toast')).toContainText('Medaglia Aurora');

  // Re-enter the same gate after awarding the documented flag, using real map movement.
  await seedRadicelmoScenario(page, true);
  await page.reload();
  await waitForWorldReady(page);
  await continueAfterChapterSummary(page);
  await page.getByRole('button', { name: 'Vai a destra' }).tap();
  await expect.poll(async () => (await readCurrentSave(page))?.player).toMatchObject({
    mapId: 'veloria/r03_terrazze_muschio', spawnPointId: 'from_brumalta', x: 1, y: 17,
  });

  await walkToMapTile(page, 'r03_terrazze_muschio.tmj', 16, 12);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('q_radicelmo_seed_found');
  await expect.poll(async () => (await readCurrentSave(page))?.inventory['ancient-seed']).toBe(1);
  await page.getByRole('button', { name: /^Apri zaino e dotazioni:/ }).click();
  await expect(page.getByRole('dialog', { name: 'Zaino e dotazioni' })).toContainText('Seme ancestrale');
  await page.keyboard.press('Escape');
  await page.reload();
  await waitForWorldReady(page);
  expect((await readCurrentSave(page)).inventory['ancient-seed']).toBe(1);

  await walkToMapTile(page, 'r03_terrazze_muschio.tmj', 31, 6, 'veloria/radicelmo');
  await expect.poll(async () => (await readCurrentSave(page))?.player).toMatchObject({
    mapId: 'veloria/radicelmo', spawnPointId: 'from_r03', x: 1, y: 14,
  });
  const potionsBeforeReport = (await readCurrentSave(page)).inventory.potion ?? 0;
  const moneyBeforeReport = (await readCurrentSave(page)).player.money;

  await walkToMapTile(page, 'radicelmo.tmj', 25, 13);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Custode Leda');
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect.poll(async () => (await readCurrentSave(page))?.flags).toContain('q_radicelmo_seed_archived');
  const completed = await readCurrentSave(page);
  expect(completed.inventory['archive-note']).toBe(1);
  expect(completed.inventory['ancient-seed'] ?? 0).toBe(0);
  expect(completed.player.money).toBe(moneyBeforeReport + 120);
  expect(completed.inventory.potion).toBe(potionsBeforeReport + 2);
  expect(completed.player.mapId).toBe('veloria/radicelmo');
  await page.getByRole('button', { name: /^Apri zaino e dotazioni:/ }).click();
  const bag = page.getByRole('dialog', { name: 'Zaino e dotazioni' });
  await expect(bag).toContainText('Scheda dell’Archivio');
  await expect(bag).not.toContainText('Seme ancestrale');
  await page.keyboard.press('Escape');
  await page.reload();
  await waitForWorldReady(page);
  await walkToMapTile(page, 'radicelmo.tmj', 25, 13);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm(page);
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  const repeated = await readCurrentSave(page);
  expect(repeated.player.money).toBe(completed.player.money);
  expect(repeated.inventory).toEqual(completed.inventory);
  expect(repeated.flags).toContain('q_radicelmo_seed_archived');
  expect(repeated.flags).toContain('q_radicelmo_greenhouse_started');

  async function examine(x: number, speaker: string) {
    await walkToMapTile(page, 'radicelmo.tmj', x, 18);
    await walkToTile(page, 'alto', 1);
    await tapConfirm(page);
    await expect(page.locator('#dialogue-box')).toBeVisible();
    await expect(page.locator('#dialogue-speaker')).toHaveText(speaker);
    for (let tap = 0; tap < 8 && await page.locator('#dialogue-box').isVisible(); tap++) await tapConfirm(page);
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  // Wrong-order interactions explain the actual missing prerequisite and grant nothing.
  await examine(28, 'Misuratore di luce');
  expect((await readCurrentSave(page)).flags).not.toContain('q_radicelmo_greenhouse_lit');
  await examine(25, 'Vaso del seme ancestrale');
  expect((await readCurrentSave(page)).flags).not.toContain('q_radicelmo_seed_sprouted');
  await examine(22, 'Regolatore dell’acqua');
  await expect.poll(async () => (await readCurrentSave(page)).flags).toContain('q_radicelmo_greenhouse_watered');
  await page.reload();
  await waitForWorldReady(page);
  expect((await readCurrentSave(page)).flags).toContain('q_radicelmo_greenhouse_watered');
  await examine(28, 'Misuratore di luce');
  await expect.poll(async () => (await readCurrentSave(page)).flags).toContain('q_radicelmo_greenhouse_lit');
  await examine(25, 'Vaso del seme ancestrale');
  await expect.poll(async () => (await readCurrentSave(page)).flags).toContain('q_radicelmo_seed_sprouted');
  expect((await readCurrentSave(page)).player.money).toBe(completed.player.money);
  await page.screenshot({path: testInfo.outputPath('greenhouse-portrait.png')});
  await page.setViewportSize({width: 844, height: 390});
  await page.evaluate(async () => {
    for (let frame = 0; frame < 6; frame++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  });
  await page.screenshot({path: testInfo.outputPath('greenhouse-landscape.png')});
  await page.setViewportSize({width: 390, height: 844});
  await walkToMapTile(page, 'radicelmo.tmj', 25, 13);
  await page.getByRole('button', {name: 'Vai in alto'}).tap();
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Custode Leda');
  for (let tap = 0; tap < 8 && await page.locator('#dialogue-box').isVisible(); tap++) await tapConfirm(page);
  await expect.poll(async () => (await readCurrentSave(page)).flags).toContain('q_radicelmo_greenhouse_complete');
  const greenhouse = await readCurrentSave(page);
  expect(greenhouse.player.money).toBe(completed.player.money + 180);
  expect(greenhouse.inventory.potion).toBe(completed.inventory.potion + 2);
  expect(greenhouse.inventory.antidote ?? 0).toBe((completed.inventory.antidote ?? 0) + 1);
  await page.reload();
  await waitForWorldReady(page);
  await walkToMapTile(page, 'radicelmo.tmj', 25, 13);
  await page.getByRole('button', {name: 'Vai in alto'}).tap();
  await tapConfirm(page);
  for (let tap = 0; tap < 8 && await page.locator('#dialogue-box').isVisible(); tap++) await tapConfirm(page);
  expect((await readCurrentSave(page)).inventory).toEqual(greenhouse.inventory);
  expect((await readCurrentSave(page)).player.money).toBe(greenhouse.player.money);
});

test('E2E-08: opening a v1 save migrates it without losing badges, party, box, or the original backup', async ({ page }) => {
  await chooseCharmander(page);
  const original = await readCurrentSave(page);
  await seedLegacySaveScenario(page);
  await page.reload();
  await waitForWorldReady(page);

  const migrated = await readCurrentSave(page);
  expect(migrated.schemaVersion).toBe(2);
  expect(migrated.saveRevision).toBeGreaterThan(0);
  expect(migrated.player).toMatchObject({
    name: original.player.name,
    mapId: original.player.mapId,
    spawnPointId: original.player.spawnPointId,
    money: original.player.money,
    x: 0,
    y: 0,
  });
  expect(migrated.party).toEqual(original.party);
  expect(migrated.storage).toEqual([{ instanceId: 'legacy-storage-001', speciesId: 16 }]);
  expect(migrated.badges).toEqual(['badge_aurora']);
  expect(migrated.flags).toEqual(expect.arrayContaining([
    'q_starter_selected', 'q_brumalta_visited', 'trainer_gym01_mira_defeated', 'badge_aurora_awarded',
  ]));

  const originalBackup = await readSaveSlot(page, 'backup-previous');
  expect(originalBackup.schemaVersion).toBe(1);
  expect(originalBackup.party[0].instanceId).toBe(original.party[0].instanceId);
  expect(originalBackup.badges).toEqual(['badge_aurora']);
  expect(originalBackup.player).not.toHaveProperty('x');
  expect(originalBackup.player).not.toHaveProperty('y');
});

test('E2E-07: exported backup restores location, progression, party, storage, and inventory', async ({ page }) => {
  await chooseCharmander(page);
  await seedBackupRoundtripScenario(page);
  await page.reload();
  await waitForWorldReady(page);
  await continueAfterChapterSummary(page);
  const before = await readCurrentSave(page);

  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri importazione ed esportazione salvataggio' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Esporta backup JSON' }).click(),
  ]);
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  const backup = JSON.parse(await readFile(backupPath!, 'utf8'));
  expect(backup.save.party).toHaveLength(2);
  expect(backup.save.party[0]).toMatchObject({ instanceId: before.party[0].instanceId, speciesId: 4 });
  expect(backup.save.player).toMatchObject({ mapId: 'veloria/brumalta', spawnPointId: 'from_r02', x: 1, y: 12 });

  await clearSavedSlots(page);
  expect(await readCurrentSave(page)).toBeNull();
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri importazione ed esportazione salvataggio' }).click();
  page.once('dialog', dialog => dialog.accept());
  const reload = page.waitForEvent('load');
  await page.locator('#save-file').setInputFiles({
    name: 'veloria-backup.json',
    mimeType: 'application/json',
    buffer: await readFile(backupPath!),
  });
  await reload;
  await waitForWorldReady(page);
  await expect.poll(async () => (await readCurrentSave(page))?.party?.[0]?.instanceId).toBe(before.party[0].instanceId);
  const restored = await readCurrentSave(page);
  expect({
    saveId: restored.saveId,
    player: restored.player,
    party: restored.party,
    storage: restored.storage,
    flags: restored.flags,
    badges: restored.badges,
    inventory: restored.inventory,
  }).toEqual({
    saveId: before.saveId,
    player: before.player,
    party: before.party,
    storage: before.storage,
    flags: before.flags,
    badges: before.badges,
    inventory: before.inventory,
  });
});

test('E2E-10: music volume and mute preferences persist across reloads', async ({ page }) => {
  await page.goto('/');
  await waitForWorldReady(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  const volume = page.getByRole('slider', { name: 'Volume della musica' });
  await expect(volume).toBeVisible();
  await volume.evaluate(element => {
    (element as HTMLInputElement).value = '47';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('veloria-audio-volume'))).toBe('0.47');

  const audioToggle = page.getByRole('button', { name: 'Disattiva audio' });
  await audioToggle.click();
  await expect(page.getByRole('button', { name: 'Attiva audio' })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('veloria-audio-muted'))).toBe('true');

  await page.reload();
  await waitForWorldReady(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  await expect(page.getByRole('button', { name: 'Attiva audio' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('slider', { name: 'Volume della musica' })).toHaveValue('47');
});

test('E2E-11: reduced animation quality persists and movement remains available', async ({ page }) => {
  await page.goto('/');
  await waitForWorldReady(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  const quality = page.getByLabel('Qualità animazioni');
  await quality.selectOption('reduced');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('veloria-animation-quality'))).toBe('reduced');

  await page.reload();
  await waitForWorldReady(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  await expect(page.getByLabel('Qualità animazioni')).toHaveValue('reduced');
  await page.keyboard.press('Escape', { delay: 40 });
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect.poll(async () => (await readCurrentSave(page))?.player?.y).toBe(21);
});

test('DEV: map picker opens every registered map without reading or saving the player game', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?previewMap=veloria/r03_terrazze_muschio');
  await waitForWorldReady(page);
  await expect(page.locator('#current-location')).toHaveText('TERRAZZE DEL MUSCHIO');
  await expect(page.getByText('ANTEPRIMA · progressi non salvati')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dev-map-preview-mobile.png') });
  const picker = page.getByRole('combobox', { name: 'Seleziona una mappa da provare' });
  const registeredMaps = (await readdir(new URL('../../content/maps/', import.meta.url))).filter(file => file.endsWith('.map.json'));
  await page.keyboard.press('m');
  await expect(page.locator('#toast')).toContainText('Anteprima');
  const saveDatabaseExists = await page.evaluate(async () =>
    (await indexedDB.databases()).some(database => database.name === 'veloria-save'),
  );
  expect(saveDatabaseExists).toBe(false);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await expect(picker.locator('option')).toHaveCount(registeredMaps.length + 1);
  await picker.selectOption('veloria/radicelmo');
  await expect(page).toHaveURL(/previewMap=veloria%2Fradicelmo/);
  await expect(page.locator('#current-location')).toHaveText('RADICELMO');
});

test('E2E-13: Borgofonte interiors have reciprocal doors, persistent location and a working resting bed', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseCharmander(page);
  await finishOpenDialogue(page);
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('borgofonte-lab-mobile.png') });

  await walkToMapTile(page, 'borgofonte_lab.tmj', 12, 14, 'veloria/borgofonte');
  await expect.poll(async () => (await readCurrentSave(page))?.player).toMatchObject({ mapId: 'veloria/borgofonte', x: 20, y: 31 });
  await walkToMapTile(page, 'bg_borgofonte.tmj', 15, 13, 'veloria/borgofonte_home');
  await expect(page.locator('#current-location')).toHaveText('CASA DI BORGOFONTE');

  const wounded = await readCurrentSave(page);
  wounded.party[0].hp = 1;
  wounded.party[0].moves[0].pp = 0;
  wounded.party[0].status = { status: 'poison' };
  await page.evaluate(save => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      store.put(save, 'main');
      store.delete('checksum:main');
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), wounded);
  await page.reload();
  await waitForWorldReady(page);
  await expect(page.locator('#current-location')).toHaveText('CASA DI BORGOFONTE');
  await walkToMapTile(page, 'borgofonte_home.tmj', 16, 8);
  await page.getByRole('button', { name: 'Vai a destra' }).tap();
  await tapConfirm(page);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Letto di casa');
  await expect(page.getByRole('button', { name: 'DEPOSITO', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await expect.poll(async () => (await readCurrentSave(page))?.party[0].hp).toBe(wounded.party[0].maxHp);
  const rested = await readCurrentSave(page);
  expect(rested.party[0].moves[0].pp).toBeGreaterThan(0);
  expect(rested.party[0].status).toBeUndefined();
  expect(rested.player).toMatchObject({ mapId: 'veloria/borgofonte_home', x: 16, y: 8 });
  await page.screenshot({ path: testInfo.outputPath('borgofonte-home-mobile.png') });
  await walkToMapTile(page, 'borgofonte_home.tmj', 12, 14, 'veloria/borgofonte');
  await expect.poll(async () => (await readCurrentSave(page))?.player).toMatchObject({ mapId: 'veloria/borgofonte', x: 15, y: 14 });
  await page.reload();
  await waitForWorldReady(page);
  await expect(page.locator('#current-location')).toHaveText('BORGOFONTE');
});
