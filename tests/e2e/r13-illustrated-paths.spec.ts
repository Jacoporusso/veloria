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
    instanceId: 'r13-art-fixture-bulbasaur',
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

async function captureStop(
  page: Page,
  info: { outputPath: (name: string) => string },
  x: number,
  y: number,
  name: string,
  face?: { direction: string; prompt: string },
) {
  await walkTo(page, 'r13_tornanti_bianchi.tmj', x, y, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/r13_tornanti_bianchi', x, y,
  });
  if (face) {
    await page.getByRole('button', { name: face.direction, exact: true }).tap();
    await expect(page.locator('#interaction-prompt')).toContainText(face.prompt);
  }
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await expect(page.locator('#game canvas')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`r13-${name}-${orientation.name}.png`) });
  }
  await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
}

test('R13 illustrated switchbacks reach both habitat edges, Alma, Articuno and Biancavetta', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/r13_tornanti_bianchi.map.json'), 'utf8'));
  const artworkKey = 'veloria-r13_tornanti_bianchi-illustrated-v3';
  const artworkPath = 'assets/scenery/veloria-r13_tornanti_bianchi-illustrated-v3.webp';
  expect(metadata.renderAssets).toContainEqual(expect.objectContaining({ kind: 'image', key: artworkKey, path: artworkPath }));
  const tiled = JSON.parse(await readFile(resolve('public', metadata.tiledAsset), 'utf8'));
  const backgrounds = tiled.layers.find((layer: any) => layer.name === 'decorations').objects
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

  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/r13_tornanti_bianchi', spawnPointId: 'from_passobrina', x: 1, y: 24 };
  save.flags = [...new Set([
    ...save.flags.filter(flag => ![
      'trainer_r13_alma_defeated', 'q_special_articuno_caught',
    ].includes(flag)),
    'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
    'q_league_completed', 'q_league_epilogue_seen',
  ])];
  save.party = readyGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();

  // These are safe cells immediately outside the two encounter-zone rectangles.
  await captureStop(page, info, 10, 11, 'upper-habitat-edge');
  await captureStop(page, info, 31, 17, 'lower-habitat-edge');
  await captureStop(page, info, 15, 13, 'trail-sign', { direction: 'Vai a sinistra', prompt: 'Esamina Indicazioni' });

  // Keep Alma's live collision footprint: approach from the east, never use her tile.
  await captureStop(page, info, 26, 13, 'alma-approach', { direction: 'Vai a sinistra', prompt: 'Parla con Alma' });

  // q_league_completed reveals Articuno; remain on the free tile north of it and do not activate the menu.
  await captureStop(page, info, 27, 22, 'articuno-approach', { direction: 'Vai in basso', prompt: 'Incontra Articuno' });
  expect((await readBrowserSave(page)).flags).not.toContain('q_special_articuno_caught');
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);

  await captureStop(page, info, 38, 4, 'biancavetta-exit-approach');
  await walkTo(page, 'r13_tornanti_bianchi.tmj', 39, 5, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');
  expect((await readBrowserSave(page)).flags).not.toContain('trainer_r13_alma_defeated');
  expect(errors).toEqual([]);
});
