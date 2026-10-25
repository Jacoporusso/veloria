import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const representativeStems = new Set(['r01_sentiero_alba', 'd01_bosco_veli', 'c01_brumalta', 'petalora']);
const parityManifest = JSON.parse(readFileSync(resolve('assets/map-parity-v2.json'), 'utf8'));
const mapMetadata = readdirSync(resolve('content/maps'))
  .filter(file => file.endsWith('.map.json'))
  .map(file => JSON.parse(readFileSync(resolve('content/maps', file), 'utf8')));
const knownMapNames = readdirSync(resolve('content/maps'))
  .filter(file => file.endsWith('.map.json'))
  .map(file => JSON.parse(readFileSync(resolve('content/maps', file), 'utf8')).displayName);
const mapDefinitions = parityManifest.artworks.map((artwork: { mapId: string; assetKey: string }) => {
  const metadata = mapMetadata.find(map => map.id === artwork.mapId);
  if (!metadata) throw new Error(`No MapDefinition found for parity artwork ${artwork.mapId}`);
  if (!metadata.renderAssets.some((asset: any) => asset.key === artwork.assetKey)) {
    throw new Error(`Parity artwork ${artwork.assetKey} is not registered by ${artwork.mapId}`);
  }
  const tiled = JSON.parse(readFileSync(resolve('public', metadata.tiledAsset), 'utf8'));
  const tiledName = metadata.tiledAsset.split('/').pop() ?? metadata.tiledAsset;
  return { stem: tiledName.replace(/\.tmj$/, ''), metadata, tiled, assetKey: artwork.assetKey };
});

async function exposeGame(page: import('@playwright/test').Page) {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__mapParityGame = game;` });
  });
}

async function openMap(page: import('@playwright/test').Page, mapId: string) {
  await page.goto(`/?previewMap=${encodeURIComponent(mapId)}`);
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__mapParityGame?.scene.keys.world?.renderedMap))).toBe(true);
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
}

test('illustrated maps render and retain visible world objects in portrait and landscape', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await exposeGame(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (const map of mapDefinitions) {
      await openMap(page, map.metadata.id);
      const result = await page.evaluate(({ destinationNames, assetKey }: { destinationNames: string[]; assetKey: string }) => {
        const game = (window as any).__mapParityGame;
        const world = game.scene.keys.world;
        const metadata = world.map.metadata;
        const tiled = world.mapLayer.list;
        const backgroundAsset = metadata.renderAssets.find((asset: any) => asset.key === assetKey);
        const image = tiled.find((item: any) => item.type === 'Image' && item.texture.key === backgroundAsset?.key && item.width > 0);
        const source = image && world.textures.get(image.texture.key).getSourceImage() as HTMLImageElement;
        const npcInteractables = world.renderedMap.interactables.filter((item: any) => item.kind === 'npc');
        const npcSprites = npcInteractables.map((npc: any) => tiled.some((item: any) => item.type === 'Image' && item.texture.key === npc.properties.sprite));
        const exitLabels = tiled.filter((item: any) => item.type === 'Text' && destinationNames.includes(String(item.text).split('\n')[0]));
        return {
          mapWidth: world.renderedMap.width * 32, mapHeight: world.renderedMap.height * 32,
          assetKey: backgroundAsset?.key,
          imageFound: Boolean(image), imageBounds: image && { x: image.x, y: image.y, width: image.displayWidth, height: image.displayHeight },
          decoded: Boolean(source?.complete && source.naturalWidth > 0 && source.naturalHeight > 0),
          textureExists: Boolean(backgroundAsset && world.textures.exists(backgroundAsset.key)),
          npcCount: npcInteractables.length, npcSprites,
          exitCount: world.renderedMap.triggers.filter((trigger: any) => trigger.kind === 'map-exit' && trigger.destinationMapId).length,
          visibleExitLabels: exitLabels.filter((label: any) => label.visible && String(label.text).trim()).length,
        };
      }, { destinationNames: knownMapNames, assetKey: map.assetKey });
      expect(result.assetKey, map.stem).toBe(map.assetKey);
      expect(result.textureExists, map.stem).toBe(true);
      expect(result.decoded, map.stem).toBe(true);
      expect(result.imageFound, map.stem).toBe(true);
      expect(result.imageBounds, map.stem).toEqual({ x: 0, y: 0, width: result.mapWidth, height: result.mapHeight });
      if (result.npcCount > 0) {
        expect(result.npcSprites, map.stem).toHaveLength(result.npcCount);
        expect(result.npcSprites.every(Boolean), map.stem).toBe(true);
      }
      if (result.exitCount > 0) expect(result.visibleExitLabels, map.stem).toBeGreaterThan(0);
      if (representativeStems.has(map.stem)) {
        await page.screenshot({ path: testInfo.outputPath(`${map.stem}-${viewport.width}x${viewport.height}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});

test('illustrated maps keep Tiled NPC and exit identities available at runtime', async ({ page }) => {
  test.setTimeout(180_000);
  await exposeGame(page);
  for (const map of mapDefinitions) {
    await openMap(page, map.metadata.id);
    const expectedNpcs = map.tiled.layers
      .filter((layer: any) => layer.name === 'characters')
      .flatMap((layer: any) => layer.objects ?? [])
      .filter((object: any) => {
        const props = object.properties ?? [];
        const declaredKind = props.find((property: any) => property.name === 'kind')?.value;
        return (declaredKind ?? object.class ?? object.type) === 'npc' &&
          !props.some((property: any) => ['visibleWhenFlag', 'collectedFlag'].includes(property.name));
      })
      .map((object: any) => object.properties?.find((property: any) => property.name === 'id')?.value ?? object.name)
      .sort();
    const expectedExits = map.tiled.layers
      .filter((layer: any) => layer.name === 'triggers')
      .flatMap((layer: any) => layer.objects ?? [])
      .filter((object: any) => object.properties?.some((property: any) => property.name === 'kind' && property.value === 'map-exit'))
      .map((object: any) => object.name)
      .sort();
    const runtime = await page.evaluate(() => {
      const world = (window as any).__mapParityGame.scene.keys.world;
      return {
        npcs: world.renderedMap.interactables.filter((item: any) => item.kind === 'npc').map((item: any) => item.id).sort(),
        exits: world.renderedMap.triggers.filter((item: any) => item.kind === 'map-exit').map((item: any) => item.id).sort(),
      };
    });
    expect(runtime.npcs, map.stem).toEqual(expectedNpcs);
    expect(runtime.exits, map.stem).toEqual(expectedExits);
  }
});
