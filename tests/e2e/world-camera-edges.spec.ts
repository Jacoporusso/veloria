import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision';

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 390, height: 1100 }]) {
  for (const mapName of viewport.height === 1100 ? ['biancavetta'] : ['r04_salita_petali', 'r07_condotto_risonante', 'ferraluce', 'borgofonte_lab', 'biancavetta', 'r14_varco_cristallo', 'd05_grotte_cristallo', 'r15_passo_due_luci', 'concordia', 'd06_santuario_due_luci', 'r16_cammino_equilibrio', 'league_forecourt', 'gym03_vetracielo', 'gym04_ferraluce', 'gym05_portolume', 'gym06_acquariva', 'gym07_biancavetta', 'gym08_concordia', 'league_council01', 'league_council02', 'league_council03', 'league_council04', 'league_champion', 'd03_centrale_risonante']) {
    test(`painted camera edges stay covered in ${mapName} at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      const metadata = JSON.parse(await readFile(`content/maps/${mapName}.map.json`, 'utf8'));
      const tiled = JSON.parse(await readFile(`public/${metadata.tiledAsset}`, 'utf8'));
      const blocked = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, []);
      let position = { x: 1, y: 1 };
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/src/main.ts', async route => {
        const response = await route.fetch();
        const body = (await response.text()).replace(/x: spawn\.x,\s*y: spawn\.y/, `x: ${position.x}, y: ${position.y}`);
        await route.fulfill({ response, body: body + '\nwindow.__cameraEdgeGame=game;' });
      });
      for (const edge of ['top', 'bottom'] as const) {
        const rows = Array.from({ length: tiled.height }, (_, y) => y);
        if (edge === 'bottom') rows.reverse();
        const available = rows.flatMap(y => Array.from({ length: tiled.width }, (_, x) => ({ x, y })))
          .find(point => !blocked.has(`${point.x},${point.y}`));
        expect(available).toBeTruthy();
        position = available!;
        await page.goto(`/?previewMap=${metadata.id}`);
        await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
        await expect.poll(() => page.evaluate(() => {
          const scene = (window as any).__cameraEdgeGame?.scene.keys.world;
          const view = scene?.cameras.main.worldView;
          return view ? { left: view.x, top: view.y, right: view.right, bottom: view.bottom } : undefined;
        })).toBeDefined();
        const view = await page.evaluate(() => {
          const view = (window as any).__cameraEdgeGame.scene.keys.world.cameras.main.worldView;
          return { left: view.x, top: view.y, right: view.right, bottom: view.bottom };
        });
        expect(view.left).toBeGreaterThanOrEqual(-1);
        const backdrop = await page.evaluate(() => {
          const world = (window as any).__cameraEdgeGame.scene.keys.world;
          const images = world.renderedMap.container.list.filter((item: any) => item.name === 'map-edge-backdrop');
          return images.map((image: any) => { const bounds = image.getBounds(); return { top: bounds.top, bottom: bounds.bottom, mode: image.getData('edgeBackdropMode') }; });
        });
        expect(backdrop).toHaveLength(2);
        expect(backdrop.every((image: any) => image.mode === 'ambience')).toBe(true);
        expect(view.top).toBeGreaterThanOrEqual(Math.min(...backdrop.map((image: any) => image.top)) - 1);
        expect(view.right).toBeLessThanOrEqual(tiled.width * tiled.tilewidth + 1);
        expect(view.bottom).toBeLessThanOrEqual(Math.max(...backdrop.map((image: any) => image.bottom)) + 1);
        await page.screenshot({ path: info.outputPath(`${mapName}-${edge}-${viewport.width}.png`) });
      }
      expect(errors).toEqual([]);
    });
  }
}
