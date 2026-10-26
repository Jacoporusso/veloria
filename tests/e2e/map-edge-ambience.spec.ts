import { expect, test } from '@playwright/test';

for (const blurSupported of [true, false]) test(`map margins exclude interior objects and reuse opaque textures (blur ${blurSupported})`, async ({ page }) => {
  if (!blurSupported) await page.addInitScript(() => { delete (CanvasRenderingContext2D.prototype as any).filter; });
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nwindow.__edgeAmbienceGame=game;' });
  });
  await page.goto('/?previewMap=veloria/biancavetta');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
  expect(await page.evaluate(() => 'filter' in document.createElement('canvas').getContext('2d')!)).toBe(blurSupported);
  const result = await page.evaluate(async () => {
    const scene = (window as any).__edgeAmbienceGame.scene.keys.world;
    const { renderMapEdgeBackdrop } = await import('/src/game/rendering/map-edge-backdrop.ts' as string);
    const source = scene.textures.createCanvas('qa-edge-interior', 128, 256);
    // Red represents an interior building. Only green/blue edge bands may escape the map.
    source.context.fillStyle = '#ff0000'; source.context.fillRect(0, 0, 128, 256);
    source.context.fillStyle = '#00ff00'; source.context.fillRect(0, 0, 128, 40);
    source.context.fillStyle = '#0000ff'; source.context.fillRect(0, 216, 128, 40);
    source.refresh();
    const first = scene.add.container(-10000, -10000);
    renderMapEdgeBackdrop(scene, first, source.key, 128, 256, -4);
    const results = first.list.map((image: any) => {
      const canvas = image.texture.getSourceImage() as HTMLCanvasElement;
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
      const top = image.y === 0;
      let badPixels = 0, translucent = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] > 10 || pixels[index + (top ? 1 : 2)] < 245) badPixels++;
        if (pixels[index + 3] !== 255) translucent++;
      }
      const bounds = image.getBounds();
      return { key: image.texture.key, edge: top ? 'top' : 'bottom', badPixels, translucent,
        top: bounds.top + 10000, bottom: bounds.bottom + 10000 };
    }).sort((a: any, b: any) => a.edge.localeCompare(b.edge));
    const second = scene.add.container(-10000, -10000);
    renderMapEdgeBackdrop(scene, second, source.key, 128, 256, -4);
    const reused = second.list.map((image: any) => image.texture.key).sort();
    first.destroy(true); second.destroy(true);
    return { results, reused };
  });
  expect(result.results.map(({ key }) => key).sort()).toEqual(result.reused);
  expect(result.results).toEqual([
    expect.objectContaining({ edge: 'bottom', badPixels: 0, translucent: 0, top: 256, bottom: 512 }),
    expect.objectContaining({ edge: 'top', badPixels: 0, translucent: 0, top: -256, bottom: 0 }),
  ]);
});
