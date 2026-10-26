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
const directions = {
  up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra',
} as const;
const confirm = (page: Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });

function readyGen1Party() {
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 8,
    instanceId: 'r14-art-fixture-bulbasaur',
  });
  return [{
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: 0,
    hp: Math.max(1, creature.hp - 1),
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
  }];
}

async function captureStop(
  page: Page,
  info: { outputPath: (name: string) => string },
  x: number,
  y: number,
  name: string,
  face?: { direction: keyof typeof directions; prompt: string },
) {
  await walkTo(page, 'r14_varco_cristallo.tmj', x, y, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/r14_varco_cristallo', x, y,
  });
  if (face) {
    await page.getByRole('button', { name: directions[face.direction], exact: true }).tap();
    await expect(page.locator('#interaction-prompt')).toContainText(face.prompt);
  }
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await expect(page.locator('#game canvas')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`r14-${name}-${orientation.name}.png`) });
  }
  await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
}

async function closeDialogue(page: Page): Promise<void> {
  for (let step = 0; step < 16 && await page.locator('#dialogue-box').isVisible(); step += 1) {
    await confirm(page).tap();
  }
  await expect(page.locator('#dialogue-box')).toBeHidden();
}

test('R14 illustrated route reaches the refuge, research points, habitat and both exits', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/r14_varco_cristallo.map.json'), 'utf8'));
  const tiled = JSON.parse(await readFile(resolve('public', metadata.tiledAsset), 'utf8'));
  const artworkKey = 'veloria-r14_varco_cristallo-illustrated-v3';
  const artworkPath = 'assets/scenery/veloria-r14_varco_cristallo-illustrated-v3.webp';
  expect(metadata.renderAssets).toContainEqual(expect.objectContaining({ kind: 'image', key: artworkKey, path: artworkPath }));
  const backgrounds = tiled.layers.find((layer: any) => layer.name === 'decorations')?.objects
    .filter((item: any) => item.properties?.some((property: any) => property.name === 'sprite' && property.value === artworkKey));
  expect(backgrounds).toHaveLength(1);
  expect(backgrounds[0]).toMatchObject({ x: 0, y: 0, width: 1280, height: 960 });
  const decoded = await page.evaluate(async path => {
    const image = new Image();
    image.src = path;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, `/${artworkPath}`);
  expect(decoded.width).toBeGreaterThan(1000);
  expect(decoded.height).toBeGreaterThan(700);
  expect(decoded.width / decoded.height).toBeCloseTo(4 / 3, 3);

  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/r14_varco_cristallo', spawnPointId: 'from_biancavetta', x: 1, y: 16 };
  save.flags = [...new Set([
    ...save.flags.filter(flag => ![
      'q_d05_low_read', 'q_d05_middle_read', 'q_d05_climate_balanced', 'q_d05_upper_read',
      'q_d05_receiver_confirmed', 'q_d05_report',
    ].includes(flag)),
    'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
  ])];
  save.party = readyGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();
  const injuredParty = (await readBrowserSave(page)).party;
  expect(injuredParty[0].hp).toBeLessThan(injuredParty[0].maxHp);

  // The sensor interaction is at (12,5), blocked by its authored footprint; stand south at (12,6).
  await captureStop(page, info, 12, 6, 'wind-sensor-approach', { direction: 'up', prompt: 'Sensore del belvedere' });
  await confirm(page).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Belvedere del Cristallo');
  await expect(page.locator('#dialogue-box')).toContainText('terrazze più alte');
  await closeDialogue(page);

  // Livia occupies (29,11); approach from the north without stepping onto her tile.
  await captureStop(page, info, 29, 10, 'guide-approach', { direction: 'down', prompt: 'Guida del varco' });
  await confirm(page).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Guida Livia');
  await expect(page.locator('#dialogue-box')).toContainText('rifugio');
  await closeDialogue(page);

  // The refuge interaction is at (30,12); heal through its real service menu.
  await captureStop(page, info, 30, 11, 'warm-refuge-approach', { direction: 'down', prompt: 'Rifugio caldo' });
  await confirm(page).tap();
  const restButton = page.getByRole('button', { name: 'RIPOSA', exact: true });
  await expect(restButton).toBeVisible();
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await page.screenshot({ path: info.outputPath(`r14-refuge-menu-${orientation.name}.png`) });
  }
  await restButton.tap();
  await expect.poll(async () => (await readBrowserSave(page)).party[0].hp).toBe(injuredParty[0].maxHp);

  // Habitat is x=23..25,y=19..20. Stand on the reachable western edge, outside the trigger.
  await captureStop(page, info, 22, 19, 'crystal-habitat-edge');
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({ x: 22, y: 19 });

  // Approach the cave exit from below, enter and return through the reciprocal D05 exit.
  await captureStop(page, info, 34, 6, 'cave-exit-approach');
  await walkTo(page, 'r14_varco_cristallo.tmj', 34, 5, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/d05_grotte_cristallo', spawnPointId: 'from_r14', x: 11, y: 28,
  });
  await walkTo(page, 'd05_grotte_cristallo.tmj', 11, 29, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/r14_varco_cristallo', spawnPointId: 'from_cavern', x: 34, y: 6,
  });

  await captureStop(page, info, 1, 16, 'west-exit-approach');
  await walkTo(page, 'r14_varco_cristallo.tmj', 0, 16, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/biancavetta', spawnPointId: 'from_r14', x: 38, y: 15,
  });
  expect(errors).toEqual([]);
});
