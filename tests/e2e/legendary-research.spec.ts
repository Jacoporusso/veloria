import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';
import researchData from '../../content/encounters/legendary-research.v1.json' with { type: 'json' };
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import specialPokemon from '../../content/encounters/special-pokemon.v1.json' with { type: 'json' };

type Research = (typeof researchData.researches)[number];
type TiledObject = {
  id: number; name?: string; x: number; y: number; width?: number; height?: number;
  class?: string; type?: string; properties?: { name: string; value: unknown }[];
};
type TiledMap = {
  width: number; height: number; tilewidth: number; tileheight: number;
  layers: { name: string; objects?: TiledObject[] }[];
};

const BASE_FLAGS = [
  'q_starter_selected', 'intro_completed', 'prologue_complete_seen', 'tutorial_habitat_seen',
  'tutorial_exploration_seen', 'q_resonance_restored', 'q_league_completed', 'q_league_epilogue_seen',
];
const DIRECTION_BUTTONS = {
  up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra',
} as const;

function tileMapName(mapId: string): string {
  return `${mapId.replace(/^veloria\//, '')}.tmj`;
}

function plainMapName(mapId: string): string {
  return mapId.replace(/^veloria\//, '');
}

function propertiesOf(object: TiledObject): Record<string, unknown> {
  return Object.fromEntries((object.properties ?? []).map(property => [property.name, property.value]));
}

async function tiledMap(mapId: string): Promise<TiledMap> {
  return JSON.parse(await readFile(new URL(`../../public/tilemaps/${tileMapName(mapId)}`, import.meta.url), 'utf8')) as TiledMap;
}

async function findResearchObject(research: Research, clueId?: string): Promise<{ map: TiledMap; object: TiledObject }> {
  const mapId = clueId
    ? research.clues.find(clue => clue.id === clueId)?.mapId
    : research.puzzle.mapId;
  if (!mapId) throw new Error(`Unknown clue ${clueId} for ${research.id}`);
  const map = await tiledMap(mapId);
  const object = map.layers.flatMap(layer => layer.objects ?? []).find(item => {
    const properties = propertiesOf(item);
    const kind = properties.kind ?? item.class ?? item.type;
    return properties.researchId === research.id && (clueId
      ? kind === 'research-clue' && properties.researchClueId === clueId
      : kind === 'research-puzzle' && !('researchClueId' in properties));
  });
  if (!object) throw new Error(`Tiled research object missing: ${research.id}${clueId ? ` / clue ${clueId}` : ' / puzzle'}`);
  return { map, object };
}

async function installResearchGameHook(page: Page): Promise<void> {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    await route.fulfill({ response, body: `${await response.text()}\nwindow.__researchGame = game;` });
  });
}

async function seedAtResearchMap(page: Page, mapId: string, extraFlags: string[] = [], removeFlags: string[] = []): Promise<void> {
  const mapName = plainMapName(mapId);
  const metadata = JSON.parse(await readFile(new URL(`../../content/maps/${mapName}.map.json`, import.meta.url), 'utf8')) as {
    id: string; spawns: { id: string; x: number; y: number }[];
  };
  const spawn = metadata.spawns[0];
  if (!spawn) throw new Error(`No authored spawn on ${mapId}`);
  const save = await readBrowserSave(page);
  const ordinaryFlags = save.flags.filter(flag => !flag.startsWith('q_research_') && !flag.startsWith('q_special_'));
  save.flags = [...new Set([...ordinaryFlags, ...BASE_FLAGS, ...extraFlags])].filter(flag => !removeFlags.includes(flag));
  save.player = { ...save.player, mapId: metadata.id, spawnPointId: spawn.id, x: spawn.x, y: spawn.y, money: 0 };
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
}

function reachableTiles(map: TiledMap, current: { x: number; y: number }, blocked: Set<string>) {
  const start = `${current.x},${current.y}`;
  const queue: [number, number][] = [[current.x, current.y]];
  const distance = new Map<string, number>([[start, 0]]);
  const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index]!;
    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || blocked.has(key) || distance.has(key)) continue;
      distance.set(key, distance.get(`${x},${y}`)! + 1);
      queue.push([nx, ny]);
    }
  }
  return distance;
}

async function waitForPlayerToSettle(page: Page): Promise<void> {
  let previous = '';
  await expect.poll(async () => {
    const player = (await readBrowserSave(page)).player;
    const current = `${player.mapId}:${player.x},${player.y}`;
    await page.waitForTimeout(120);
    const after = (await readBrowserSave(page)).player;
    const settled = current === `${after.mapId}:${after.x},${after.y}` && current === previous;
    previous = `${after.mapId}:${after.x},${after.y}`;
    return settled;
  }, { timeout: 8_000 }).toBe(true);
}

/** Walk to a collision-free neighboring tile and use the real A interaction. */
async function approachAndInteract(page: Page, research: Research, clueId?: string): Promise<{ object: TiledObject; playerBeforeInteraction: Awaited<ReturnType<typeof readBrowserSave>>['player'] }> {
  const { map, object } = await findResearchObject(research, clueId);
  const mapId = clueId ? research.clues.find(clue => clue.id === clueId)!.mapId : research.puzzle.mapId;
  const save = await readBrowserSave(page);
  const collision = map.layers.find(layer => layer.name === 'collision')?.objects ?? [];
  const blocked = collectMapCollision(collision, map.width, map.height, save.flags);
  for (const layer of map.layers.filter(item => ['characters', 'interactions', 'canopy_overhead'].includes(item.name))) {
    for (const other of layer.objects ?? []) {
      if (other.id === object.id) continue;
      const left = Math.floor(other.x / map.tilewidth), right = Math.ceil((other.x + (other.width ?? map.tilewidth)) / map.tilewidth);
      const top = Math.floor(other.y / map.tileheight), bottom = Math.ceil((other.y + (other.height ?? map.tileheight)) / map.tileheight);
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) blocked.add(`${x},${y}`);
    }
  }
  for (const trigger of map.layers.find(layer => layer.name === 'triggers')?.objects ?? []) {
    const properties = propertiesOf(trigger);
    const kind = properties.kind ?? trigger.class ?? trigger.type;
    if (kind !== 'map-exit' && kind !== 'encounter-zone') continue;
    const left = Math.floor(trigger.x / map.tilewidth), right = Math.ceil((trigger.x + (trigger.width ?? map.tilewidth)) / map.tilewidth);
    const top = Math.floor(trigger.y / map.tileheight), bottom = Math.ceil((trigger.y + (trigger.height ?? map.tileheight)) / map.tileheight);
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) blocked.add(`${x},${y}`);
  }

  const left = Math.floor(object.x / map.tilewidth);
  const right = Math.max(left, Math.ceil((object.x + (object.width ?? map.tilewidth)) / map.tilewidth) - 1);
  const top = Math.floor(object.y / map.tileheight);
  const bottom = Math.max(top, Math.ceil((object.y + (object.height ?? map.tileheight)) / map.tileheight) - 1);
  const candidates: { x: number; y: number; direction: keyof typeof DIRECTION_BUTTONS }[] = [];
  for (let x = left; x <= right; x++) {
    candidates.push({ x, y: top - 1, direction: 'down' }, { x, y: bottom + 1, direction: 'up' });
  }
  for (let y = top; y <= bottom; y++) {
    candidates.push({ x: left - 1, y, direction: 'right' }, { x: right + 1, y, direction: 'left' });
  }
  const distance = reachableTiles(map, save.player, blocked);
  const label = object.name ?? String(propertiesOf(object).id ?? object.id);
  const approaches = candidates.filter(candidate => !blocked.has(`${candidate.x},${candidate.y}`) && distance.has(`${candidate.x},${candidate.y}`))
    .sort((a, b) => distance.get(`${a.x},${a.y}`)! - distance.get(`${b.x},${b.y}`)!);
  if (!approaches.length) throw new Error(`No reachable adjacent tile for ${research.id} on ${mapId} (Tiled object ${object.id})`);

  let reached = false;
  for (const approach of approaches) {
    await walkTo(page, tileMapName(mapId), approach.x, approach.y, { avoidEncounters: true });
    await page.locator('.dpad').getByRole('button', { name: DIRECTION_BUTTONS[approach.direction], exact: true }).tap();
    await waitForPlayerToSettle(page);
    const prompt = page.locator('#interaction-prompt');
    await prompt.waitFor({ state: 'visible', timeout: 2_000 }).catch(() => undefined);
    const promptText = await prompt.textContent().catch(() => '');
    if (promptText?.includes(label)) {
      reached = true;
      break;
    }
  }
  if (!reached) throw new Error(`Could not face research object “${label}” on ${mapId}; checked ${approaches.length} reachable sides`);
  await expect(page.locator('#interaction-prompt')).toContainText(label);
  await waitForPlayerToSettle(page);
  const playerBeforeInteraction = (await readBrowserSave(page)).player;
  await page.locator('#action-a').tap();
  return { object, playerBeforeInteraction };
}

async function dismissDialogue(page: Page): Promise<void> {
  const dialogue = page.locator('#dialogue-box');
  for (let index = 0; index < 8 && await dialogue.isVisible() && await page.locator('#starter-choices').isHidden(); index++) {
    await page.locator('#action-a').tap();
  }
  await expect(dialogue).toBeHidden({ timeout: 8_000 });
}

async function recordClue(page: Page, research: Research, clueId: string): Promise<void> {
  const clue = research.clues.find(item => item.id === clueId)!;
  const { playerBeforeInteraction } = await approachAndInteract(page, research, clueId);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(clue.flag);
  await expect(page.locator('#dialogue-speaker')).toHaveText(clue.title);
  // A advances the typewriter so the full authored clue is available to assert.
  await page.locator('#action-a').tap();
  await expect(page.locator('#dialogue-text')).toContainText(clue.text);
  const afterClue = (await readBrowserSave(page)).player;
  expect(afterClue.mapId).toBe(playerBeforeInteraction.mapId);
  expect(afterClue.x).toBe(playerBeforeInteraction.x);
  expect(afterClue.y).toBe(playerBeforeInteraction.y);
  await dismissDialogue(page);
}

async function openPuzzle(page: Page, research: Research): Promise<void> {
  await approachAndInteract(page, research);
  await expect(page.locator('#dialogue-speaker')).toHaveText(research.puzzle.title);
}

async function tapPuzzleOption(page: Page, label: string): Promise<void> {
  await page.locator('#starter-choices').getByRole('button', { name: label, exact: true }).click();
}

async function openAtlasDirect(page: Page, mapId: string, discoveryId: string) {
  await page.evaluate(({ mapId, discoveryId }) => {
    const world = (window as any).__researchGame.scene.keys.world;
    world.regionMap.open(world.save, mapId, discoveryId);
  }, { mapId, discoveryId });
  return page.getByRole('dialog', { name: 'Esplora Veloria' });
}

async function specialSpriteCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__researchGame.scene.keys.world.mapLayer.list
    .filter((item: any) => item.name === 'special-pokemon-sprite').length);
}

async function verifyNoPrematureReveal(page: Page, research: Research, speciesName: string): Promise<void> {
  expect(await specialSpriteCount(page)).toBe(0);

  const atlas = await openAtlasDirect(page, research.clues[0]!.mapId, `${research.id}#area`);
  await expect(atlas.locator('.region-map-local')).toHaveCount(0);
  await expect(atlas.locator(`[data-discovery-id="${research.id}#area"]`)).toBeVisible();
  await expect(atlas.locator('.region-map-details')).toContainText(research.regionHint);
  await expect(atlas).not.toContainText(speciesName);
  await atlas.getByRole('button', { name: 'Chiudi ×', exact: true }).click();

  // Even a direct request for the final encounter ID cannot bypass the reveal flag.
  const direct = await openAtlasDirect(page, research.clues[0]!.mapId, research.encounterId);
  await expect(direct.locator('.region-map-local')).toHaveCount(0);
  await expect(direct.locator('.region-map-local-target')).toHaveCount(0);
  await expect(direct).not.toContainText(speciesName);
  await direct.getByRole('button', { name: 'Chiudi ×', exact: true }).click();

  await page.locator('.journey-trigger').click();
  const journal = page.getByRole('dialog', { name: 'Il tuo viaggio' });
  const researchCard = journal.locator('.journey-quest').filter({ hasText: research.regionHint }).filter({ hasText: 'Indagine in corso' });
  await expect(researchCard).toBeVisible();
  await expect(researchCard).toContainText('Indagine');
  await expect(researchCard).not.toContainText(speciesName);
  await journal.getByRole('button', { name: 'Chiudi ×', exact: true }).click();
}

async function solveResearch(page: Page, research: Research, options: { injectWrong?: boolean; reloadPartial?: boolean; alreadyCaptured?: boolean } = {}) {
  const initialMoney = (await readBrowserSave(page)).player.money;
  await openPuzzle(page, research);
  const menu = page.locator('#starter-choices');
  await expect(menu).toBeVisible();
  for (const option of research.puzzle.options) await expect(menu.getByRole('button', { name: option.label, exact: true })).toBeVisible();

  if (options.injectWrong) {
    const wrong = research.puzzle.options.find(option => option.id !== research.puzzle.solution[0])!;
    await tapPuzzleOption(page, wrong.label);
    await expect(page.locator('#dialogue-text')).toContainText('La sequenza non coincide');
    await expect.poll(async () => (await readBrowserSave(page)).flags.filter(flag => flag.startsWith(research.puzzle.progressFlagPrefix)).length).toBe(0);
    await expect(page.locator('#starter-choices')).toBeVisible();
  }

  if (options.reloadPartial) {
    await tapPuzzleOption(page, research.puzzle.options.find(option => option.id === research.puzzle.solution[0])!.label);
    await expect(page.locator('#dialogue-text')).toContainText(`Segni ricostruiti: 1/${research.puzzle.solution.length}`);
    const partial = await readBrowserSave(page);
    expect(partial.flags).toContain(`${research.puzzle.progressFlagPrefix}0_${research.puzzle.solution[0]}`);
    await page.reload();
    await enterGame(page);
    await openPuzzle(page, research);
    await expect(page.locator('#dialogue-text')).toContainText(`Segni ricostruiti: 1/${research.puzzle.solution.length}`);
    const recovered = await readBrowserSave(page);
    expect(recovered.flags).toContain(`${research.puzzle.progressFlagPrefix}0_${research.puzzle.solution[0]}`);
    for (const clue of research.clues) await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(clue.flag);
    await expect(page.locator('#dialogue-text')).toContainText(research.puzzle.hint);
    await page.locator('#starter-choices').getByRole('button', { name: 'RILEGGI GLI INDIZI', exact: true }).click();
    for (const clue of research.clues) {
      await expect(page.locator('#dialogue-text')).toContainText(clue.title);
      await expect(page.locator('#dialogue-text')).toContainText(clue.text);
    }
    await page.locator('#starter-choices').getByRole('button', { name: 'TORNA ALLA PROVA', exact: true }).click();
    await expect(page.locator('#starter-choices')).toBeVisible();
  } else {
    for (const [index, optionId] of research.puzzle.solution.entries()) {
      const option = research.puzzle.options.find(item => item.id === optionId)!;
      await tapPuzzleOption(page, option.label);
      if (index < research.puzzle.solution.length - 1) {
        await expect(page.locator('#dialogue-text')).toContainText(`Segni ricostruiti: ${index + 1}/${research.puzzle.solution.length}`);
      }
    }
  }

  if (options.reloadPartial) {
    for (let index = 1; index < research.puzzle.solution.length; index++) {
      const option = research.puzzle.options.find(item => item.id === research.puzzle.solution[index])!;
      await tapPuzzleOption(page, option.label);
      if (index < research.puzzle.solution.length - 1) {
        await expect(page.locator('#dialogue-text')).toContainText(`Segni ricostruiti: ${index + 1}/${research.puzzle.solution.length}`);
      }
    }
  }

  const questSlug = research.questId.split('/').at(-1)!.replace(/^q_/, '');
  const quest = await readFile(new URL(`../../content/quests/${questSlug}.quest.json`, import.meta.url), 'utf8')
    .then(source => JSON.parse(source) as { completionFlag: string; reward?: { money?: number } });
  const reward = quest.reward?.money ?? 0;
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(research.revealedFlag);
  const completed = await readBrowserSave(page);
  expect(completed.flags).toContain(quest.completionFlag);
  expect(completed.player.money).toBe(initialMoney + reward);
  await expect(page.locator('#dialogue-text')).toContainText(options.alreadyCaptured
    ? 'Ricerca d’archivio completata' : 'Hai individuato il rifugio');
  const visibleSprites = await specialSpriteCount(page);
  if (options.alreadyCaptured) expect(visibleSprites).toBe(0);
  else expect(visibleSprites).toBeGreaterThan(0);

  await page.reload();
  await enterGame(page);
  const reloaded = await readBrowserSave(page);
  expect(reloaded.player.money).toBe(initialMoney + reward);
  expect(reloaded.flags.filter(flag => flag === research.revealedFlag)).toHaveLength(1);

  const encounter = specialPokemon.encounters.find(item => item.id === research.encounterId)!;
  const atlas = await openAtlasDirect(page, encounter.mapId, research.encounterId);
  const target = atlas.locator('.region-map-local-target');
  await expect(atlas.locator('.region-map-local')).toHaveAttribute('data-map-id', encounter.mapId);
  await expect(target).toBeVisible();
  const encounterMap = await tiledMap(encounter.mapId);
  const object = encounterMap.layers.flatMap(layer => layer.objects ?? []).find(item =>
    propertiesOf(item).specialEncounterId === research.encounterId,
  );
  if (!object) throw new Error(`Tiled encounter object missing: ${research.encounterId}`);
  const expectedX = object.x + (object.width ?? 32) / 2;
  const expectedY = object.y + (object.height ?? 32) / 2 + 19;
  await expect(target).toHaveAttribute('data-map-x', String(expectedX));
  await expect(target).toHaveAttribute('data-map-y', String(expectedY));
  await atlas.getByRole('button', { name: 'Chiudi ×', exact: true }).click();
  // The puzzle prop is collected/hidden after reveal. Reload above already proves
  // the one-time reward persisted without reopening that hidden interaction.
  expect(reloaded.player.money).toBe(initialMoney + reward);
  return { completed: reloaded, reward };
}

for (const [index, research] of researchData.researches.entries()) {
  test(`research ${research.id} records every clue and reveals its authored encounter after the full puzzle`, async ({ page }) => {
    test.setTimeout(process.env.CI ? 240_000 : 180_000);
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await installResearchGameHook(page);
    await page.goto('/');
    await enterGame(page);
    await seedAtResearchMap(page, research.clues[0]!.mapId);
    const speciesId = specialPokemon.encounters.find(encounter => encounter.id === research.encounterId)!.speciesId;
    const speciesName = (species.species as any)[String(speciesId)].name as string;
    expect(await specialSpriteCount(page)).toBe(0);
    if (index === 0) await verifyNoPrematureReveal(page, research, speciesName);

    for (const clue of [...research.clues].reverse()) await recordClue(page, research, clue.id);
    const flagsAfterClues = (await readBrowserSave(page)).flags;
    for (const clue of research.clues) expect(flagsAfterClues.filter(flag => flag === clue.flag)).toHaveLength(1);
    expect(flagsAfterClues).not.toContain(research.revealedFlag);

    await solveResearch(page, research, { injectWrong: true, reloadPartial: index === 0 });
    expect(pageErrors).toEqual([]);
  });
}

test('an older captured legendary keeps its capture while pre-League clues and the archive reward persist', async ({ page }) => {
  test.setTimeout(process.env.CI ? 240_000 : 180_000);
  const research = researchData.researches[0]!;
  const clueBeforeLeague = research.clues[0]!;
  await installResearchGameHook(page);
  await page.goto('/');
  await enterGame(page);
  await seedAtResearchMap(page, clueBeforeLeague.mapId, [research.capturedFlag], ['q_league_completed', 'q_league_epilogue_seen']);
  const partyBefore = (await readBrowserSave(page)).party;

  await recordClue(page, research, clueBeforeLeague.id);
  let save = await readBrowserSave(page);
  expect(save.flags).toContain(clueBeforeLeague.flag);
  expect(save.flags).not.toContain(research.requiredFlag);
  await page.reload();
  await enterGame(page);
  save = await readBrowserSave(page);
  expect(save.flags).toContain(clueBeforeLeague.flag);

  save.flags = [...new Set([...save.flags, research.requiredFlag, 'q_league_epilogue_seen'])];
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  for (const clue of research.clues.filter(item => item.id !== clueBeforeLeague.id)) await recordClue(page, research, clue.id);
  expect(await specialSpriteCount(page)).toBe(0);

  const result = await solveResearch(page, research, { alreadyCaptured: true });
  expect(result.completed.flags).toContain(research.capturedFlag);
  expect(result.completed.flags).toContain(research.revealedFlag);
  expect(result.completed.party).toEqual(partyBefore);
  expect(await specialSpriteCount(page)).toBe(0);
  await page.reload();
  await enterGame(page);
  expect((await readBrowserSave(page)).player.money).toBe(result.completed.player.money);
  expect((await readBrowserSave(page)).party).toEqual(partyBefore);
});
