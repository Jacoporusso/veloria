import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

test('Ferraluce paths reach its center, shop, monorail and gym lift', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId: 'veloria/ferraluce', spawnPointId: 'from_r06', x: 1, y: 15 };
  save.flags = [...new Set([...save.flags, 'intro_completed', 'q_ada_helped', 'tutorial_habitat_seen', 'q_ferraluce_visited', 'q_ferraluce_report', 'prologue_complete_seen'])];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);

  for (const [x, y, name, shot] of [
    [20, 21, 'Ivo', 'ivo'],
    [9, 22, 'Centro', 'center'],
    [30, 22, 'Mercante', 'shop'],
    [24, 22, 'Monorotaia', 'monorail'],
  ] as const) {
    await walkTo(page, 'ferraluce.tmj', x, y, { avoidEncounters: true });
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).click();
    await expect(page.locator('#interaction-prompt')).toContainText(name);
    const dismiss = page.getByRole('button', { name: 'Chiudi ricompensa', exact: true });
    if (await dismiss.isVisible()) await dismiss.click();
    await page.screenshot({ path: info.outputPath(`ferraluce-${shot}.png`) });
  }

  await walkTo(page, 'ferraluce.tmj', 34, 18, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/gym04_ferraluce');
  await page.screenshot({ path: info.outputPath('ferraluce-gym-lift-arrival.png') });
  expect(errors).toEqual([]);
});
