import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { createBattleCreature } from '../../src/core/battle/create-creature';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
const action = (page: Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
const orientations = [{ width: 390, height: 844 }, { width: 844, height: 390 }];

async function checkpoint(page: Page, flags: string[] = [], x = 2, y = 10) {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__r15Game = game;' });
  });
  await page.setViewportSize(orientations[0]);
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({ species: species.species as any, moves: moves.moves as any,
    speciesId: 1, level: 8, instanceId: 'r15-art-review' });
  save.party = [{ instanceId: creature.instanceId, speciesId: 1, level: 8, experience: 0,
    hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'q_d05_report', ...flags])];
  save.player = { ...save.player, mapId: 'veloria/r15_passo_due_luci', spawnPointId: 'from_cavern', x, y };
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
}

async function closeDialogue(page: Page) {
  for (let i = 0; i < 20 && await page.locator('#dialogue-box').isVisible(); i++) await action(page).tap();
  await expect(page.locator('#dialogue-box')).toBeHidden();
}

async function capture(page: Page, info: { outputPath(name: string): string }, x: number, y: number, name: string) {
  await walkTo(page, 'r15_passo_due_luci.tmj', x, y, { avoidEncounters: true });
  expect((await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/r15_passo_due_luci', x, y });
  for (const viewport of orientations) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: info.outputPath(`r15-${name}-${viewport.width}.png`) });
  }
  await page.setViewportSize(orientations[0]);
}

async function moltresState(page: Page) {
  return page.evaluate(() => {
    const world = (window as any).__r15Game.scene.keys.world;
    return {
      blocked: world.occupied.has('24,15'),
      sprites: world.mapLayer.list.filter((item: any) => item.name === 'special-pokemon-sprite' && item.texture.key === 'pokeapi-gen1-146-v1').length,
    };
  });
}

test('R15 illustrated paths connect both readings, Nilo, habitat and both exits', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await checkpoint(page);
  const metadata = JSON.parse(await readFile('content/maps/r15_passo_due_luci.map.json', 'utf8'));
  const tiled = JSON.parse(await readFile(`public/${metadata.tiledAsset}`, 'utf8'));
  const key = 'veloria-r15_passo_due_luci-illustrated-v3';
  expect(metadata.renderAssets).toContainEqual({ kind: 'image', key, path: `assets/scenery/${key}.webp` });
  const backgrounds = tiled.layers.find((layer: any) => layer.name === 'decorations').objects
    .filter((item: any) => item.properties?.some((p: any) => p.name === 'sprite' && p.value === key));
  expect(backgrounds).toHaveLength(1);
  expect(backgrounds[0]).toMatchObject({ x: 0, y: 0, width: 1280, height: 960 });
  expect(await page.evaluate(async path => {
    const image = new Image(); image.src = path; await image.decode(); return [image.naturalWidth, image.naturalHeight];
  }, `/assets/scenery/${key}.webp`)).toEqual([1448, 1086]);
  expect(await moltresState(page)).toEqual({ blocked: false, sprites: 0 });

  await capture(page, info, 11, 12, 'west-path-south-edge');
  await capture(page, info, 17, 4, 'nature-reading');
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await action(page).tap(); await closeDialogue(page);
  expect((await readBrowserSave(page)).flags).toContain('q_r15_nature_read');
  await capture(page, info, 22, 13, 'nilo-approach');
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await expect(page.locator('#interaction-prompt')).toContainText('Nilo');
  await capture(page, info, 24, 15, 'moltres-clearing-before-league');
  await capture(page, info, 29, 19, 'network-reading');
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await action(page).tap(); await closeDialogue(page);
  expect((await readBrowserSave(page)).flags).toContain('q_r15_network_read');
  await capture(page, info, 26, 6, 'garden-habitat-edge');
  await capture(page, info, 38, 10, 'east-path-south-edge');
  await walkTo(page, 'r15_passo_due_luci.tmj', 39, 9, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');
  await walkTo(page, 'concordia.tmj', 0, 15, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/r15_passo_due_luci', x: 38, y: 9 });
  await walkTo(page, 'r15_passo_due_luci.tmj', 2, 9, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/d05_grotte_cristallo', x: 37, y: 3 });
  expect(errors).toEqual([]);
});

for (const caught of [false, true]) test(`R15 Moltres footprint follows post-League capture state (${caught})`, async ({ page }, info) => {
  const flags = ['q_league_completed', 'q_league_epilogue_seen', ...(caught ? ['q_special_moltres_caught'] : [])];
  await checkpoint(page, flags, 24, 16);
  expect(await moltresState(page)).toEqual({ blocked: !caught, sprites: caught ? 0 : 1 });
  if (caught) {
    await capture(page, info, 24, 15, 'moltres-clearing-after-capture');
  } else {
    await capture(page, info, 24, 16, 'moltres-approach-after-league');
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
    expect((await readBrowserSave(page)).player).toMatchObject({ x: 24, y: 16 });
    const before = await readBrowserSave(page);
    await action(page).tap(); await expect(page.getByRole('button', { name: 'INCONTRA', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'MI PREPARO', exact: true }).tap();
    const after = await readBrowserSave(page);
    expect(after.rngState).toBe(before.rngState);
    expect(after.flags).not.toContain('q_special_moltres_caught');
  }
});
