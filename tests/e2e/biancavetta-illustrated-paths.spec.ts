import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { createBattleCreature } from '../../src/core/battle/create-creature';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

const orientations = [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
] as const;
const directionLabels = {
  up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra',
} as const;

function readyGen1Party() {
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 8,
    instanceId: 'biancavetta-art-fixture-bulbasaur',
  });
  return [{
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: 0,
    hp: creature.hp,
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
  }];
}

async function captureApproach(
  page: Page,
  info: { outputPath: (name: string) => string },
  x: number,
  y: number,
  name: string,
  face?: { direction: keyof typeof directionLabels; prompt: string },
) {
  await walkTo(page, 'biancavetta.tmj', x, y, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/biancavetta', x, y,
  });
  if (face) {
    await page.getByRole('button', { name: directionLabels[face.direction], exact: true }).tap();
    await expect(page.locator('#interaction-prompt')).toContainText(face.prompt);
  }
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await expect(page.locator('#game canvas')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`biancavetta-${name}-${orientation.name}.png`) });
  }
  await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
}

async function startAtWestSpawn(page: Page): Promise<void> {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__biancavettaGame = game;' });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/biancavetta', spawnPointId: 'from_r13', x: 1, y: 17 };
  save.flags = [...new Set([
    ...save.flags.filter(flag => flag !== 'badge_ghiaccio_awarded'),
    'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
  ])];
  save.badges = save.badges.filter(badge => badge !== 'badge_brina');
  save.party = readyGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();
}

test('Biancavetta artwork, optional service markers and west/gym routes work on foot', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await startAtWestSpawn(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/biancavetta.map.json'), 'utf8'));
  const tiled = JSON.parse(await readFile(resolve('public/tilemaps/biancavetta.tmj'), 'utf8'));
  const artworkKey = 'veloria-biancavetta-illustrated-v3';
  const artworkPath = 'assets/scenery/veloria-biancavetta-illustrated-v3.webp';
  expect(metadata.renderAssets).toContainEqual(expect.objectContaining({ kind: 'image', key: artworkKey, path: artworkPath }));
  const background = tiled.layers.find((layer: any) => layer.name === 'decorations')?.objects
    .find((object: any) => object.properties?.some((property: any) => property.name === 'kind' && property.value === 'scenery-image'));
  expect(background?.properties?.find((property: any) => property.name === 'sprite')?.value).toBe(artworkKey);
  expect(background).toMatchObject({ x: 0, y: 0, width: 1280, height: 960 });
  const decoded = await page.evaluate(async path => {
    const image = new Image();
    image.src = path;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, `/${artworkPath}`);
  expect(decoded.width).toBeGreaterThan(1000);
  expect(decoded.height).toBeGreaterThan(700);
  expect(decoded.width / decoded.height).toBeCloseTo(4 / 3, 3);

  const markers = await page.evaluate(() => (window as any).__biancavettaGame.scene.keys.world.mapLayer.list
    .filter((item: any) => item.name.startsWith('wayfinding-')).map((item: any) => item.name).sort());
  expect(markers).toEqual(['wayfinding-cable', 'wayfinding-heal', 'wayfinding-shop', 'wayfinding-survey']);

  // Tiled interaction cells: center (7,13), shop (14,13), survey (35,13), cable terminal (29,23).
  // The last has a solid terminal footprint, so approach from its free western neighbor.
  // Follow the western branch, central gym, then eastern/lower services.
  await captureApproach(page, info, 7, 8, 'west-patrol-house', { direction: 'up', prompt: 'Casa ovest' });
  await captureApproach(page, info, 7, 14, 'pokemon-center', { direction: 'up', prompt: 'Centro Pokémon' });
  await captureApproach(page, info, 14, 14, 'market', { direction: 'up', prompt: 'Bottega di quota' });

  // Enter and leave the gym through both authored exit triggers, without starting its challenge.
  await captureApproach(page, info, 20, 7, 'ice-gym-approach');
  await walkTo(page, 'biancavetta.tmj', 20, 6, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/gym07_biancavetta', spawnPointId: 'from_city', x: 15, y: 22,
  });
  await page.getByRole('button', { name: directionLabels.down, exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/biancavetta', spawnPointId: 'from_gym07', x: 20, y: 8,
  });

  await captureApproach(page, info, 30, 9, 'east-observatory', { direction: 'up', prompt: 'Cupola est' });
  await captureApproach(page, info, 35, 14, 'crystal-gate-sign', { direction: 'up', prompt: 'Varco del Cristallo' });
  await captureApproach(page, info, 28, 23, 'cableway', { direction: 'right', prompt: 'Funivia' });

  await walkTo(page, 'biancavetta.tmj', 0, 17, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/r13_tornanti_bianchi');
  expect(errors).toEqual([]);
});

test('Biancavetta east exit stays gated until the Ice badge, then returns through R14', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await startAtWestSpawn(page);

  // The east exit at (39,15) stays shut without the authored badge flag.
  await captureApproach(page, info, 38, 15, 'east-gate-locked-approach');
  await walkTo(page, 'biancavetta.tmj', 39, 15, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/biancavetta', x: 39, y: 15,
  });
  await expect(page.locator('#toast')).toContainText('Medaglia Brina');
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await page.screenshot({ path: info.outputPath(`biancavetta-east-gate-locked-${orientation.name}.png`) });
  }

  // Add the badge to the fixture, then enter through the real Tiled trigger.
  await walkTo(page, 'biancavetta.tmj', 38, 15, { avoidEncounters: true });
  const unlockedSave = await readBrowserSave(page);
  unlockedSave.flags = [...new Set([...unlockedSave.flags, 'badge_ghiaccio_awarded'])];
  unlockedSave.badges = [...new Set([...unlockedSave.badges, 'badge_brina'])];
  await seedBrowserSave(page, unlockedSave);
  await page.reload();
  await enterGame(page);
  await walkTo(page, 'biancavetta.tmj', 39, 15, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/r14_varco_cristallo');
  await page.screenshot({ path: info.outputPath('biancavetta-east-gate-unlocked.png') });
  await walkTo(page, 'r14_varco_cristallo.tmj', 0, 16, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/biancavetta', spawnPointId: 'from_r14', x: 38, y: 15,
  });
  expect(errors).toEqual([]);
});
