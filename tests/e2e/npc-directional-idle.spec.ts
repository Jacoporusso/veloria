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
const confirm = (page: Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
const adaTile = { x: 13, y: 10 };

function readyGen1Party() {
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 8,
    instanceId: 'ada-direction-fixture-bulbasaur',
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

async function closeDialogue(page: Page): Promise<void> {
  for (let step = 0; step < 16 && await page.locator('#dialogue-box').isVisible(); step += 1) {
    await confirm(page).tap();
  }
  await expect(page.locator('#dialogue-box')).toBeHidden();
}

async function adaSpriteState(page: Page) {
  return page.evaluate(() => {
    const world = (window as any).__adaIdleGame.scene.keys.world;
    const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === 'forest_ranger_ada');
    if (!sprite) throw new Error('Ada sprite is missing from the world map layer.');
    return {
      textureKey: sprite.texture.key,
      origin: { x: sprite.originX, y: sprite.originY },
      display: { width: sprite.displayWidth, height: sprite.displayHeight },
      x: sprite.x,
      y: sprite.y,
      flipX: sprite.flipX,
      flipY: sprite.flipY,
      npcFacing: sprite.getData('npcFacing'),
      directionalIdle: sprite.getData('directionalIdle'),
      tweenCount: world.tweens.getTweensOf(sprite).length,
      drawnAbovePlayer: world.mapLayer.list.indexOf(sprite) > world.mapLayer.list.indexOf(world.player),
      player: { x: world.playerTile.x, y: world.playerTile.y },
      rngState: world.save.rngState,
    };
  });
}

test('Ada uses four anchored idle views when approached from each side, independent of motion preference', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__adaIdleGame = game;' });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/d01_bosco_veli.map.json'), 'utf8'));
  const tiled = JSON.parse(await readFile(resolve('public', metadata.tiledAsset), 'utf8'));
  const ada = tiled.layers.find((layer: any) => layer.name === 'characters')?.objects
    .find((item: any) => item.properties?.some((property: any) => property.name === 'npcId' && property.value === 'forest_ranger_ada'));
  expect(ada).toMatchObject({ x: 13 * 32, y: 10 * 32, width: 32, height: 32 });
  expect(ada.properties).toContainEqual(expect.objectContaining({ name: 'characterAppearanceId', value: 'ranger-ada' }));
  const appearanceCatalog = JSON.parse(await readFile(resolve('content/characters/appearances.v2.json'), 'utf8'));
  const profile = appearanceCatalog.profiles.find((item: any) => item.id === 'ranger-ada');
  expect(profile).toBeTruthy();
  const idleViews = profile.idleViews;
  expect(Object.keys(idleViews).sort()).toEqual(['down', 'left', 'right', 'up']);
  const assetKeys = Object.values(idleViews).map((view: any) => view.assetKey);
  expect(new Set(assetKeys).size).toBe(4);
  const declaredAssets = new Set(appearanceCatalog.assets.map((asset: any) => asset.key));
  for (const [direction, view] of Object.entries(idleViews) as [string, any][]) {
    expect(view.assetKey, `${direction} idle image is declared in the appearance catalog`).toBeTruthy();
    expect(declaredAssets.has(view.assetKey), `${direction} idle image is a registered appearance asset`).toBe(true);
    expect(view.displaySize).toBeGreaterThan(0);
    expect(view.origin.x).toBeGreaterThanOrEqual(0);
    expect(view.origin.x).toBeLessThanOrEqual(1);
    expect(view.origin.y).toBeGreaterThanOrEqual(0);
    expect(view.origin.y).toBeLessThanOrEqual(1);
  }

  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/d01_bosco_veli', spawnPointId: 'from_r01', x: 1, y: 10 };
  save.flags = [...new Set([
    ...save.flags.filter(flag => flag !== 'q_ada_helped'),
    'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
  ])];
  save.party = readyGen1Party();
  await page.evaluate(() => localStorage.setItem('veloria-animation-quality', 'reduced'));
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();

  const directionsToAda = [
    { x: 13, y: 11, movement: 'up', facing: 'down' },
    { x: 12, y: 10, movement: 'right', facing: 'left' },
    { x: 13, y: 9, movement: 'down', facing: 'up' },
    { x: 14, y: 10, movement: 'left', facing: 'right' },
  ] as const;
  const expectedAnchor = { x: adaTile.x * 32 + 16, y: adaTile.y * 32 + 16 + 19 };

  async function inspectPoses(mode: 'reduced' | 'full') {
    for (const stop of directionsToAda) {
      await walkTo(page, 'd01_bosco_veli.tmj', stop.x, stop.y, { avoidEncounters: true });
      await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
        mapId: 'veloria/d01_bosco_veli', x: stop.x, y: stop.y,
      });
      // Face Ada from the real adjacent tile. The move is blocked by her unchanged live collider.
      await page.getByRole('button', { name: directions[stop.movement], exact: true }).tap();
      await expect(page.locator('#interaction-prompt')).toContainText('Ada');
      const beforeInteraction = await readBrowserSave(page);
      const rngBefore = beforeInteraction.rngState;
      await confirm(page).tap();
      await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
      await closeDialogue(page);
      const afterInteraction = await readBrowserSave(page);
      expect(afterInteraction.player).toMatchObject({ mapId: 'veloria/d01_bosco_veli', x: stop.x, y: stop.y });
      expect(afterInteraction.rngState).toBe(rngBefore);

      const state = await adaSpriteState(page);
      const view = idleViews[stop.facing];
      expect(state).toMatchObject({
        textureKey: view.assetKey,
        origin: view.origin,
        display: { width: view.displaySize, height: view.displaySize },
        ...expectedAnchor,
        flipX: false,
        flipY: false,
        npcFacing: stop.facing,
        directionalIdle: true,
        tweenCount: 0,
        drawnAbovePlayer: stop.y <= adaTile.y,
        player: { x: stop.x, y: stop.y },
      });

      for (const orientation of orientations) {
        await page.setViewportSize({ width: orientation.width, height: orientation.height });
        await expect(page.locator('#game canvas')).toBeVisible();
        await page.screenshot({ path: info.outputPath(`ada-idle-${mode}-${stop.facing}-${orientation.name}.png`) });
      }
      await page.setViewportSize({ width: orientations[0].width, height: orientations[0].height });
    }
  }

  const basePose = await adaSpriteState(page);
  expect(basePose).toMatchObject({
    textureKey: idleViews.down.assetKey,
    origin: idleViews.down.origin,
    display: { width: idleViews.down.displaySize, height: idleViews.down.displaySize },
    ...expectedAnchor,
    npcFacing: 'down',
    directionalIdle: true,
    flipX: false,
    flipY: false,
  });
  await inspectPoses('reduced');

  // Full idle preference overrides Playwright's reduced-motion media setting; Ada still has no bob tween.
  await page.evaluate(() => localStorage.setItem('veloria-animation-quality', 'full'));
  await page.reload();
  await enterGame(page);
  await inspectPoses('full');
  expect(errors).toEqual([]);
});
