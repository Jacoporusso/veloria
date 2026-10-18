import { test, expect } from '@playwright/test';

test('Borgofonte renders the four illustrated house frames from Tiled', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({ response, body: source + '\nglobalThis.__veloriaGame = game;' });
  });

  await page.goto('/?previewMap=veloria/borgofonte');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  const houses = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    return world.mapLayer.list
      .filter((item: any) => item.type === 'Image' && item.texture.key === 'veloria-borgofonte-buildings-v1')
      .map((item: any) => ({ frame: item.frame.name, width: item.displayWidth, height: item.displayHeight }))
      .sort((left: any, right: any) => left.frame.localeCompare(right.frame));
  });
  expect(houses).toEqual([
    { frame: 'cell-0', width: 192, height: 160 },
    { frame: 'cell-1', width: 192, height: 160 },
    { frame: 'cell-2', width: 224, height: 160 },
    { frame: 'cell-3', width: 192, height: 160 },
  ]);
  const plants = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    return world.mapLayer.list
      .filter((item: any) => item.type === 'Image' && item.texture.key === 'veloria-borgofonte-plants-v1')
      .map((item: any) => ({ frame: item.frame.name, width: item.displayWidth, height: item.displayHeight }))
      .sort((left: any, right: any) => left.frame.localeCompare(right.frame));
  });
  expect(plants).toEqual([
    { frame: 'cell-0', width: 56, height: 48 },
    { frame: 'cell-0', width: 56, height: 48 },
    { frame: 'cell-1', width: 56, height: 48 },
    { frame: 'cell-1', width: 56, height: 48 },
    { frame: 'cell-2', width: 56, height: 48 },
    { frame: 'cell-2', width: 56, height: 48 },
    { frame: 'cell-3', width: 56, height: 48 },
    { frame: 'cell-3', width: 56, height: 48 },
  ]);
  const groundTilesetLoaded = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    return world.textures.exists('veloria-ground-hd-v5-seamless') &&
      world.mapLayer.list.some((item: any) => item.type === 'RenderTexture');
  });
  expect(groundTilesetLoaded).toBe(true);
  const blockedPlantCells = await page.evaluate(() => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    const cells = [[3, 15], [8, 16], [4, 27], [10, 26], [35, 15], [36, 19], [26, 28], [37, 28]];
    return cells.filter(([x, y]) => world.occupied.has(`${x},${y}`));
  });
  expect(blockedPlantCells).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('borgofonte-buildings-portrait.png') });

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => page.evaluate(() => (window as any).__veloriaGame.scale.width)).toBe(1280);
  await page.screenshot({ path: testInfo.outputPath('borgofonte-buildings-landscape.png') });
  expect(errors).toEqual([]);
});
