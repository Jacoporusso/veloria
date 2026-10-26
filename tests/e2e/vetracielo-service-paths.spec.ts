import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

test('Vetracielo paths reach the station services, monorail and gym stair', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/vetracielo', spawnPointId: 'from_r05', x: 1, y: 25 };
  save.flags = [...new Set([...save.flags, 'intro_completed', 'q_ada_helped', 'tutorial_habitat_seen', 'q_vetracielo_orientation', 'prologue_complete_seen'])];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);

  for (const [x, y, name, shot] of [
    [22, 19, 'Lea', 'lea'],
    [15, 21, 'Punto cure della stazione', 'station-care'],
    [27, 21, 'Rifornimenti', 'station-supplies'],
    [24, 22, 'Monorotaia', 'monorail'],
  ] as const) {
    await walkTo(page, 'vetracielo.tmj', x, y, { avoidEncounters: true });
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
    await expect(page.locator('#interaction-prompt')).toContainText(name);
    const dismiss = page.getByRole('button', { name: 'Chiudi ricompensa', exact: true });
    if (await dismiss.isVisible()) await dismiss.click();
    await page.screenshot({ path: info.outputPath(`vetracielo-${shot}.png`) });
  }

  await walkTo(page, 'vetracielo.tmj', 20, 16, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/gym03_vetracielo');
  await page.screenshot({ path: info.outputPath('vetracielo-gym-stair-arrival.png') });
  expect(errors).toEqual([]);
});
