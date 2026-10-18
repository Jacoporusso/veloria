import { expect, test } from '@playwright/test';

test.use({ deviceScaleFactor: 3, reducedMotion: 'reduce' });
test('industrial ground, foliage and energy hall render in both mobile orientations', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__industrialArtGame = game;' });
  });
  for (const [mapId, x, y] of [['veloria/r06_anello_magnetico', 18, 17], ['veloria/ferraluce', 20, 22]] as const) {
    await page.goto('/?previewMap=' + mapId);
    await expect(page.locator('#game-loading')).toBeHidden();
    // Isolated render framing only; no progression or user save is changed in preview mode.
    await page.evaluate(([x, y]) => {
      const scene = (window as any).__industrialArtGame.scene.keys.world;
      scene.player.setPosition(x * 32 + 16, y * 32 + 16);
      scene.playerTile = { x, y };
    }, [x, y]);
    const art = await page.evaluate(() => {
      const game = (window as any).__industrialArtGame;
      const scene = game.scene.keys.world;
      return {
        base: scene.map.metadata.terrainBase.assetKey,
        floorWidth: game.textures.get('veloria-industrial-floor-v1').getSourceImage().width,
        technicalNpcLabel: scene.mapLayer.list.some((item: any) => item.type === 'Text' && item.text === 'ferraluce_ivo'),
      };
    });
    expect(art.base).toBe('veloria-industrial-floor-v1');
    expect(art.floorWidth).toBeGreaterThan(1000);
    expect(art.technicalNpcLabel).toBe(false);
    for (const [width, height] of [[390, 844], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => new Promise<void>(resolve => (window as any).__industrialArtGame.events.once('postrender', resolve)));
      await page.screenshot({ path: info.outputPath(`${mapId.split('/')[1]}-${width}.png`) });
    }
  }
  expect(errors).toEqual([]);
});
