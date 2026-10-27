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
const directions = { up: 'Vai in alto', down: 'Vai in basso', left: 'Vai a sinistra', right: 'Vai a destra' } as const;

function readyGen1Party() {
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 8,
    instanceId: 'd05-art-fixture-bulbasaur',
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
  face?: { direction: keyof typeof directions; prompt: string },
) {
  await walkTo(page, 'd05_grotte_cristallo.tmj', x, y, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/d05_grotte_cristallo', x, y,
  });
  if (face) {
    await page.getByRole('button', { name: directions[face.direction], exact: true }).tap();
    await expect(page.locator('#interaction-prompt')).toContainText(face.prompt);
  }
  for (const orientation of orientations) {
    await page.setViewportSize({ width: orientation.width, height: orientation.height });
    await expect(page.locator('#game canvas')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`d05-${name}-${orientation.name}.png`) });
  }
  await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
}

test('D05 illustrated routes preserve all stations, habitat and the report-gated R15 return', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/d05_grotte_cristallo.map.json'), 'utf8'));
  const tiled = JSON.parse(await readFile(resolve('public', metadata.tiledAsset), 'utf8'));
  const artworkKey = 'veloria-d05_grotte_cristallo-illustrated-v3';
  const artworkPath = 'assets/scenery/veloria-d05_grotte_cristallo-illustrated-v3.webp';
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

  // One consistent, already-completed checkpoint avoids replaying the puzzle covered by crystal.spec.ts.
  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/d05_grotte_cristallo', spawnPointId: 'from_r14', x: 11, y: 28 };
  save.flags = [...new Set([
    ...save.flags,
    'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
    'badge_ghiaccio_awarded', 'q_r14_visited', 'q_d05_visited', 'q_d05_low_read',
    'q_d05_middle_read', 'q_d05_climate_balanced', 'q_d05_upper_read', 'q_d05_report',
  ])];
  save.badges = [...new Set([...save.badges, 'badge_brina'])];
  save.party = readyGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();

  // Walk in map order from the southern D05 spawn; the habitat patch is x=33..35,y=14..15.
  await captureStop(page, info, 12, 25, 'entrance-east-floor-edge');
  await captureStop(page, info, 12, 20, 'lower-bend-east-floor-edge');
  await captureStop(page, info, 15, 21, 'lower-bend-south-floor-edge');
  await captureStop(page, info, 20, 19, 'lower-bend-northeast-floor-edge');
  await captureStop(page, info, 5, 14, 'lower-station', { direction: 'up', prompt: 'Misuratore inferiore' });
  await captureStop(page, info, 18, 12, 'middle-station', { direction: 'up', prompt: 'Misuratore centrale' });
  await captureStop(page, info, 32, 14, 'habitat-west-edge');
  await captureStop(page, info, 29, 3, 'climate-console-approach', { direction: 'up', prompt: 'Regolatore climatico' });
  await captureStop(page, info, 31, 2, 'northern-console-nook');
  await captureStop(page, info, 30, 5, 'upper-corridor-south-floor-edge');
  await captureStop(page, info, 36, 3, 'upper-receiver-approach', { direction: 'down', prompt: 'Passaggio superiore' });

  // R15 exit (38,3) opens with q_d05_report. Stand on adjacent (37,3), then use the real exit.
  await captureStop(page, info, 37, 3, 'two-lights-exit-approach');
  expect((await readBrowserSave(page)).flags).toContain('q_d05_report');
  await walkTo(page, 'd05_grotte_cristallo.tmj', 38, 3, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/r15_passo_due_luci', spawnPointId: 'from_cavern', x: 2, y: 10,
  });

  // Return by walking to the reciprocal north exit at R15 (2,9), without reseeding or teleporting.
  await walkTo(page, 'r15_passo_due_luci.tmj', 2, 9, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
    mapId: 'veloria/d05_grotte_cristallo', spawnPointId: 'from_r15', x: 37, y: 3,
  });
  expect(errors).toEqual([]);
});
