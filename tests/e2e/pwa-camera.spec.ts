import { expect, test } from '@playwright/test';

for (const deviceScaleFactor of [3, 4]) test.describe(`standalone follow at DPR ${deviceScaleFactor}`, () => {
  test.use({ deviceScaleFactor, reducedMotion: 'reduce' });
  test('continuous movement, orientation and doorway keep the traveler in view', async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
      const nativeMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = query => {
        const result = nativeMatchMedia(query);
        if (query.includes('display-mode: standalone')) Object.defineProperty(result, 'matches', { value: true });
        return result;
      };
    });
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nglobalThis.__cameraGame = game;' });
    });
    await page.goto('/?previewMap=veloria/borgofonte_lab');
    await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => Boolean((window as any).__cameraGame?.scene.keys.world.player))).toBe(true);
    await page.evaluate(() => {
      const game = (window as any).__cameraGame;
      (window as any).__cameraFailures = [];
      (window as any).__cameraSamples = 0;
      game.events.on('postrender', () => {
        const world = game.scene.keys.world, camera = world.cameras.main;
        if (!world.sys.isActive() || world.mapTransitionLoading) return;
        const origin = camera.getWorldPoint(0, 0), surface = game.canvas.getBoundingClientRect();
        const x = (world.player.x - origin.x) * camera.zoom * surface.width / game.canvas.width;
        const y = (world.player.y - origin.y) * camera.zoom * surface.height / game.canvas.height;
        (window as any).__cameraSamples++;
        if (x < 12 || y < 20 || x > surface.width - 12 || y > surface.height - 12)
          (window as any).__cameraFailures.push({ x, y, width: surface.width, height: surface.height, map: world.map.metadata.id });
      });
    });
    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 390, height: 740 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await expect.poll(() => page.evaluate(() => {
        const game = (window as any).__cameraGame;
        return Math.round(game.scale.width * game.scale.zoom);
      })).toBe(size.width);
      // Hold through several real tile tweens: sampling only the final idle frame misses the bug.
      for (const key of ['ArrowRight', 'ArrowLeft']) {
        await page.keyboard.down(key);
        await page.waitForTimeout(900);
        await page.keyboard.up(key);
      }
      await page.screenshot({ path: info.outputPath(`standalone-${size.width}x${size.height}.png`) });
    }
    const route = await page.evaluate(() => {
      const world = (window as any).__cameraGame.scene.keys.world;
      const start = `${world.playerTile.x},${world.playerTile.y}`, target = '12,14';
      const queue = [{ key: start, path: [] as string[] }], visited = new Set([start]);
      for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        if (current.key === target) return current.path;
        const [x, y] = current.key.split(',').map(Number);
        for (const [dx, dy, key] of [[0, -1, 'ArrowUp'], [0, 1, 'ArrowDown'], [-1, 0, 'ArrowLeft'], [1, 0, 'ArrowRight']] as const) {
          const nx = x + dx, ny = y + dy, next = `${nx},${ny}`;
          if (nx < 0 || ny < 0 || nx >= world.renderedMap.width || ny >= world.renderedMap.height || visited.has(next) || world.occupied.has(next)) continue;
          visited.add(next); queue.push({ key: next, path: [...current.path, key] });
        }
      }
      throw new Error('Laboratory doorway must be reachable.');
    });
    for (const key of route) {
      await page.keyboard.down(key);
      await page.waitForTimeout(65);
      await page.keyboard.up(key);
      await expect.poll(() => page.evaluate(() => !(window as any).__cameraGame.scene.keys.world.moving)).toBe(true);
    }
    await expect(page.locator('#current-location')).toHaveText('BORGOFONTE');
    await page.evaluate(() => (window as any).__cameraGame.events.emit('resume'));
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowDown');
    expect(await page.evaluate(() => (window as any).__cameraSamples)).toBeGreaterThan(100);
    expect(await page.evaluate(() => (window as any).__cameraFailures)).toEqual([]);
  });
});
