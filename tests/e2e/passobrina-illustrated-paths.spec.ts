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

function readyGen1Party() {
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 8,
    instanceId: 'passobrina-art-fixture-bulbasaur',
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

async function visitService(
  page: Page,
  info: { outputPath: (name: string) => string },
  x: number,
  y: number,
  direction: string,
  name: string,
  screenshotStem: string,
) {
  await walkTo(page, 'passobrina.tmj', x, y, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/passobrina', x, y,
  });
  await page.getByRole('button', { name: direction, exact: true }).tap();
  const prompt = page.locator('#interaction-prompt');
  await expect(prompt).toBeVisible();
  const inputLabel = await page.evaluate(() =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches ? 'E / Spazio / Invio' : 'A');
  await expect(prompt).toHaveText(`${inputLabel} · Esamina ${name}`);
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await expect(page.locator('#game canvas')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`${screenshotStem}-${orientation.name}.png`) });
  }
  await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
}

test('Passobrina art and service approaches work on foot in both orientations, with both exits', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__passobrinaGame = game;' });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/passobrina.map.json'), 'utf8'));
  const tiled = JSON.parse(await readFile(resolve('public/tilemaps/passobrina.tmj'), 'utf8'));
  const artworkKey = 'veloria-passobrina-illustrated-v3';
  const artworkPath = 'assets/scenery/veloria-passobrina-illustrated-v3.webp';
  expect(metadata.renderAssets).toContainEqual(expect.objectContaining({ kind: 'image', key: artworkKey, path: artworkPath }));
  const sceneImage = tiled.layers.find((layer: any) => layer.name === 'decorations')?.objects
    .find((object: any) => object.properties?.some((property: any) => property.name === 'kind' && property.value === 'scenery-image'));
  expect(sceneImage?.properties?.find((property: any) => property.name === 'sprite')?.value).toBe(artworkKey);
  const decoded = await page.evaluate(async path => {
    const image = new Image();
    image.src = path;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, `/${artworkPath}`);
  expect(decoded.width).toBeGreaterThan(1000);
  expect(decoded.height).toBeGreaterThan(700);

  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/passobrina', spawnPointId: 'from_r12', x: 1, y: 15 };
  save.flags = [...new Set([
    ...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'q_passobrina_report',
  ])];
  save.party = readyGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();
  const signs = await page.evaluate(() => (window as any).__passobrinaGame.scene.keys.world.mapLayer.list
    .filter((item: any) => item.name.startsWith('wayfinding-')).map((item: any) => item.name).sort());
  expect(signs).toEqual(['wayfinding-cable', 'wayfinding-heal', 'wayfinding-shop', 'wayfinding-survey']);

  await visitService(page, info, 9, 15, 'Vai in alto', 'Centro Pokémon', 'passobrina-center');
  await visitService(page, info, 14, 15, 'Vai in alto', 'Bottega alpina', 'passobrina-market');
  await visitService(page, info, 31, 8, 'Vai a destra', 'Lettura della neve', 'passobrina-snow-reading');
  await visitService(page, info, 29, 20, 'Vai in basso', 'Terminale funivia', 'passobrina-cableway');

  // Cross west to R12 and back through its reciprocal exit, using normal movement throughout.
  await walkTo(page, 'passobrina.tmj', 0, 15, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/r12_valle_vento');
  await walkTo(page, 'r12_valle_vento.tmj', 39, 5, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/passobrina', spawnPointId: 'from_r12', x: 1, y: 15,
  });

  // The eastern exit is gated in Tiled; this fixture carries its authored report flag.
  await walkTo(page, 'passobrina.tmj', 38, 7, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/passobrina', x: 38, y: 7,
  });
  expect((await readBrowserSave(page)).flags).toContain('q_passobrina_report');
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await page.screenshot({ path: info.outputPath(`passobrina-east-gate-${orientation.name}.png`) });
  }
  await walkTo(page, 'passobrina.tmj', 39, 7, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/r13_tornanti_bianchi');
  expect(errors).toEqual([]);
});
