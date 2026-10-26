import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test('Delta boardwalk lanes stay visibly walkable from the R09 landing', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);

  const metadata = JSON.parse(await readFile(resolve('content/maps/d04_delta_specchi.map.json'), 'utf8'));
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 1, 'delta-boardwalk-fixture');
  });
  expect(fixture).not.toBeNull();
  fixture!.player = {
    ...fixture!.player,
    mapId: 'veloria/d04_delta_specchi',
    spawnPointId: metadata.spawns[0].id,
    x: 1,
    y: 18,
  };
  fixture!.flags = [...new Set([
    ...fixture!.flags,
    'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen',
    'q_delta_report', 'trainer_delta_teo_defeated', 'badge_marea_awarded',
  ])];
  await seedBrowserSave(page, fixture!);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game canvas')).toBeVisible();

  const captureLane = async (x: number, y: number, name: string) => {
    await walkTo(page, 'd04_delta_specchi.tmj', x, y, { avoidEncounters: true });
    await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({
      mapId: 'veloria/d04_delta_specchi', x, y,
    });
    await page.screenshot({ path: info.outputPath(`delta-${name}.png`) });
  };

  // Portrait captures the lower parallel approaches and the single-tile vertical lane.
  for (const [x, y, name] of [
    [10, 17, 'portrait-lower-lane-north'],
    [10, 18, 'portrait-lower-lane-south'],
    [11, 12, 'portrait-vertical-lane'],
  ] as const) await captureLane(x, y, name);

  // Landscape captures both upper parallel lanes and the nursery boardwalk.
  await page.setViewportSize({ width: 844, height: 390 });
  for (const [x, y, name] of [
    [20, 6, 'landscape-upper-lane-north'],
    [20, 7, 'landscape-upper-lane-south'],
    [19, 23, 'landscape-nursery-approach'],
  ] as const) await captureLane(x, y, name);

  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/d04_delta_specchi');
  expect(errors).toEqual([]);
});
