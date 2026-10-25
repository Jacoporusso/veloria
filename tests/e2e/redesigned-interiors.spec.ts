import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`redesigned opening interiors keep interactions and exits reachable at ${viewport.width}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await enterGame(page);
    for (const [map, y, targetX, targetY, label] of [
      ['borgofonte_home', 12, 6, 7, 'Diario'],
      ['borgofonte_lab', 11, 12, 8, 'Elia'],
    ] as const) {
      const fixture = await readBrowserSave(page);
      fixture.player = { ...fixture.player, mapId: `veloria/${map}`, spawnPointId: 'from_village', x: 12, y };
      fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen'])];
      await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
      await walkTo(page, `${map}.tmj`, targetX, targetY);
      await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
      await expect(page.locator('#interaction-prompt')).toContainText(label);
      await page.screenshot({ path: info.outputPath(`${map}.png`) });
      await walkTo(page, `${map}.tmj`, 12, 13);
      await walkDirection(page, 'down');
      await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
    }
    // The city artwork must also lead visibly to its actual interior doors.
    for (const [x, y, interior] of [[13, 9, 'borgofonte_home'], [21, 26, 'borgofonte_lab']] as const) {
      await walkTo(page, 'bg_borgofonte.tmj', x, y);
      await page.screenshot({ path: info.outputPath(`borgofonte-${x}-${y}.png`) });
      await walkDirection(page, 'up');
      await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe(`veloria/${interior}`);
      await walkTo(page, `${interior}.tmj`, 12, 13);
      await walkDirection(page, 'down');
      await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
    }
    expect(errors).toEqual([]);
  });
}
