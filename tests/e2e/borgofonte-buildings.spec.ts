import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const borgofonte = JSON.parse(readFileSync(resolve('content/maps/borgofonte.map.json'), 'utf8'));
const borgofonteTiled = JSON.parse(readFileSync(resolve('public', borgofonte.tiledAsset), 'utf8'));
const scenery = borgofonteTiled.layers.flatMap((layer: any) => layer.objects ?? [])
  .find((object: any) => object.properties?.some((property: any) => property.name === 'kind' && property.value === 'scenery-image'));
const scenerySprite = scenery?.properties?.find((property: any) => property.name === 'sprite')?.value;
const boundScenery = borgofonte.renderAssets.find((asset: any) => asset.key === scenerySprite);
if (!boundScenery) throw new Error('Borgofonte Tiled scenery-image does not resolve to a MapDefinition render asset');

test('Borgofonte renders its baked scene and keeps Tiled building entrances', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__veloriaGame = game;` });
  });

  await page.goto('/?previewMap=veloria/borgofonte');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  const scene = await page.evaluate((scenerySprite: string) => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    const art = world.map.metadata.renderAssets.find((asset: any) => asset.key === scenerySprite);
    const backgrounds = world.mapLayer.list.filter((item: any) => item.type === 'Image' && item.texture.key === art?.key);
    const background = backgrounds[0];
    const source = background && world.textures.get(art.key).getSourceImage() as HTMLImageElement;
    const entrances = world.renderedMap.triggers
      .filter((trigger: any) => trigger.kind === 'map-exit')
      .map((trigger: any) => ({ mapId: trigger.destinationMapId, x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height }))
      .sort((left: any, right: any) => left.mapId.localeCompare(right.mapId));
    const buildingLabels = ['Casa di Borgofonte', 'Laboratorio di Elia'].map(name =>
      world.mapLayer.list.some((item: any) => item.type === 'Text' && item.text === name));
    return {
      dimensions: { width: world.renderedMap.width * 32, height: world.renderedMap.height * 32 },
      backgroundKey: art?.key,
      backgroundCount: backgrounds.length,
      backgroundBounds: background && { x: background.x, y: background.y, width: background.displayWidth, height: background.displayHeight },
      decoded: Boolean(source?.complete && source.naturalWidth > 0 && source.naturalHeight > 0),
      entrances,
      buildingLabels,
      legacyBuildingSprites: world.mapLayer.list.filter((item: any) => item.type === 'Image' && item.texture.key === 'veloria-borgofonte-buildings-v1').length,
      groundTilesetLoaded: world.textures.exists('veloria-ground-hd-v5-seamless') &&
        world.mapLayer.list.some((item: any) => item.type === 'RenderTexture'),
    };
  }, scenerySprite);

  expect(scene.backgroundKey).toBe(scenerySprite);
  expect(scene.backgroundCount).toBe(1);
  expect(scene.backgroundBounds).toEqual({ x: 0, y: 0, ...scene.dimensions });
  expect(scene.decoded).toBe(true);
  expect(scene.entrances).toEqual([
    { mapId: 'veloria/borgofonte_home', x: 416, y: 256, width: 32, height: 32 },
    { mapId: 'veloria/borgofonte_lab', x: 672, y: 800, width: 32, height: 32 },
    { mapId: 'veloria/r01_sentiero_alba', x: 672, y: 0, width: 96, height: 32 },
  ]);
  expect(scene.buildingLabels).toEqual([true, true]);
  expect(scene.legacyBuildingSprites).toBe(0);
  expect(scene.groundTilesetLoaded).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('borgofonte-baked-portrait.png') });

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => page.evaluate(() => (window as any).__veloriaGame.scale.width)).toBe(1280);
  await expect.poll(() => page.evaluate((scenerySprite: string) => {
    const world = (window as any).__veloriaGame.scene.keys.world;
    return world.mapLayer.list.some((item: any) => item.type === 'Image' && item.texture.key === scenerySprite);
  }, scenerySprite)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('borgofonte-baked-landscape.png') });
  expect(errors).toEqual([]);
});
