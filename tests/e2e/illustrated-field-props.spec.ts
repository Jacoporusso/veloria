import { test, expect, type Page } from '@playwright/test';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };

async function exposeGame(page: Page, errors: string[]) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + '\nglobalThis.__veloriaGame = game;' });
  });
}

for (const deviceScaleFactor of [1, 2, 3]) test.describe(`world density ${deviceScaleFactor}`, () => {
test.use({deviceScaleFactor});
test('Radicelmo nursery stays visible after portrait and landscape rotation', async ({ page }, testInfo) => {
  const errors: string[] = [];
  await exposeGame(page, errors);
  await page.goto('/?previewMap=veloria/radicelmo');
  await expect(page.locator('#game-loading')).toBeHidden({timeout: 30_000});
  await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    world.player.setPosition(25 * 32 + 16, 18 * 32 + 16);
    world.playerTile = {x: 25, y: 18};
    world.fitWorldCamera();
  });
  for (const [width, height] of [[390, 844], [844, 390], [390, 844]]) {
    await page.setViewportSize({width, height});
    await expect.poll(() => page.evaluate(() => {
      const game = (window as any).__veloriaGame;
      const parent = document.querySelector('#game')!;
      const density = Math.min(3, window.devicePixelRatio);
      return game.scale.width === parent.clientWidth * density && game.scale.height === parent.clientHeight * density;
    })).toBe(true);
    await page.evaluate(() => new Promise<void>(resolve => {
      (window as any).__veloriaGame.events.once('postrender', () => resolve());
    }));
    const objects = await page.evaluate(() => {
      const world = (window as any).__veloriaGame.scene.keys.world;
      return world.renderedMap.interactables.filter((item: any) => ['radicelmo_water', 'radicelmo_light', 'radicelmo_seed'].includes(item.properties.dialogueId)).length;
    });
    expect(objects).toBe(3);
    const zoom = await page.evaluate(() => (window as any).__veloriaGame.scene.keys.world.cameras.main.zoom);
    expect(zoom / Math.min(3, deviceScaleFactor)).toBeCloseTo(Math.max(1, Math.min(1.25, width / 800), width / 1152, height / 768));
    await page.screenshot({path: testInfo.outputPath(`nursery-${width}x${height}.png`)});
  }
  await page.getByRole('button', {name: 'Vai a destra'}).tap();
  await expect.poll(() => page.evaluate(() => (window as any).__veloriaGame.scene.keys.world.playerTile)).toEqual({x: 26, y: 18});
  expect(errors).toEqual([]);
});
});

test('route signs, rocks and pickup render from the declared prop atlas', async ({ page }, testInfo) => {
  const errors: string[] = [];
  await exposeGame(page, errors);
  await page.goto('/?previewMap=veloria/r01_sentiero_alba');
  try { await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 }); }
  catch { throw new Error(`Game startup failed: ${errors.join(' | ') || 'loading state remained visible'}`); }
  const routeFrames = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    return world.mapLayer.list
      .filter((item: any) => item.type === 'Image' && item.texture.key === 'veloria-field-props-v1')
      .map((item: any) => item.frame.name)
      .sort();
  });
  expect(routeFrames).toContain('cell-0');
  expect(routeFrames).toContain('cell-1');
  expect(routeFrames).toContain('cell-2');
  const routeTerrainLoaded = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    return world.textures.exists('veloria-ground-hd-v5-seamless') &&
      world.mapLayer.list.some((item: any) => item.type === 'RenderTexture');
  });
  expect(routeTerrainLoaded).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('field-props-route.png') });

  expect(errors).toEqual([]);
});

test('forest sign, rocks and quest instrument use the same illustrated atlas', async ({ page }, testInfo) => {
  const errors: string[] = [];
  await exposeGame(page, errors);
  await page.goto('/?previewMap=veloria/d01_bosco_veli');
  try { await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 }); }
  catch { throw new Error(`Game startup failed: ${errors.join(' | ') || 'loading state remained visible'}`); }
  const forestFrames = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    return world.mapLayer.list
      .filter((item: any) => item.type === 'Image' && item.texture.key === 'veloria-field-props-v1')
      .map((item: any) => item.frame.name)
      .sort();
  });
  expect(forestFrames).toContain('cell-0');
  expect(forestFrames).toContain('cell-1');
  expect(forestFrames).toContain('cell-3');
  const groundTileset = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    const surface = world.mapLayer.list.find((item: any) => item.type === 'RenderTexture');
    return {
      sourceLoaded: world.textures.exists('veloria-ground-hd-v5'),
      seamlessTilesetLoaded: world.textures.exists('veloria-ground-hd-v5-seamless'),
      forestFloorLoaded: world.textures.exists('veloria-forest-floor-v1'),
      surface: surface ? { width: surface.width, height: surface.height } : null,
    };
  });
  expect(groundTileset).toEqual({
    sourceLoaded: true,
    seamlessTilesetLoaded: true,
    forestFloorLoaded: true,
    surface: { width: 960, height: 640 },
  });
  await page.screenshot({ path: testInfo.outputPath('field-props-forest.png') });
  expect(errors).toEqual([]);
});

test('forest routes and Radicelmo share the seamless v5 terrain', async ({ page }) => {
  const errors: string[] = [];
  await exposeGame(page, errors);

  for (const entry of [
    { mapId: 'veloria/r02_viale_fronde' },
    { mapId: 'veloria/r03_terrazze_muschio', npcId: 'r03_path_guide' },
    { mapId: 'veloria/radicelmo', npcId: 'radicelmo_keeper' },
  ]) {
    await page.goto(`/?previewMap=${entry.mapId}`);
    try { await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 }); }
    catch { throw new Error(`Map ${entry.mapId} did not finish startup: ${errors.join(' | ') || 'loading state remained visible'}`); }

    const terrain = await page.evaluate(() => {
      const world = (window as any).__veloriaGame.scene.keys.world;
      const surface = world.mapLayer.list.find((item: any) => item.type === 'RenderTexture');
      return {
        seamlessTilesetLoaded: world.textures.exists('veloria-ground-hd-v5-seamless'),
        forestFloorLoaded: world.textures.exists('veloria-forest-floor-v1'),
        npcSprites: world.mapLayer.list
          .filter((item: any) => item.type === 'Image' && item.name === 'npc-sprite')
          .map((item: any) => ({ npcId: item.getData('npcId'), appearanceId: item.getData('appearanceId'), key: item.texture.key, frame: item.frame.name })),
        surface: surface ? { width: surface.width, height: surface.height } : null,
      };
    });
    expect(terrain.seamlessTilesetLoaded, `${entry.mapId} loads v5`).toBe(true);
    expect(terrain.forestFloorLoaded, `${entry.mapId} loads the full-map forest underlay`).toBe(true);
    expect(terrain.surface, `${entry.mapId} composes terrain`).not.toBeNull();
    if (entry.npcId) {
      const profile = appearances.profiles.find(profile => profile.npcIds.includes(entry.npcId!));
      expect(profile, `${entry.npcId} has an appearance profile`).toBeTruthy();
      const asset = appearances.assets.find(asset => asset.key === profile!.assetKey);
      expect(asset, `${profile!.id} has a declared image asset`).toBeTruthy();
      const frame = asset!.atlas ? `cell-${profile!.frame}` : profile!.frame === undefined ? '__BASE' : String(profile!.frame);
      expect(terrain.npcSprites).toContainEqual({
        npcId: entry.npcId,
        appearanceId: profile!.id,
        key: profile!.assetKey,
        frame,
      });
    }
  }

  expect(errors).toEqual([]);
});
