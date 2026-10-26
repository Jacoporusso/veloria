import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';
import { rollEncounterCheck } from '../../src/core/encounters/roll-encounter-check.ts';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

function peacefulHabitatSeed(checks: number) {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    let state = seed;
    let peaceful = true;
    for (let check = 0; check < checks; check += 1) {
      const result = rollEncounterCheck(state, 0.08);
      if (result.encounter) {
        peaceful = false;
        break;
      }
      state = result.nextRngState;
    }
    if (peaceful) return seed;
  }
  throw new Error(`No seed found for ${checks} consecutive coastal encounter checks.`);
}

async function enterR08(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await enterGame(page);
  const fixture = await page.evaluate(async () => {
    const { loadSave } = await import('/src/persistence/save-store.ts' as string);
    const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
    return selectStarter(await loadSave(), 4, 'r08-coastal-path-fixture');
  });
  fixture.player = {
    ...fixture.player,
    mapId: 'veloria/r08_costa_turbine',
    spawnPointId: 'from_ferraluce',
    x: 1,
    y: 21,
  };
  fixture.rngState = peacefulHabitatSeed(64);
  fixture.flags = [...new Set([
    ...fixture.flags,
    'intro_completed',
    'tutorial_habitat_seen',
    'q_ada_helped',
    'q_centrale_report',
    'q_portolume_visited',
    'trainer_r08_viola_defeated',
  ])];
  fixture.inventory['old-rod'] = 1;
  await seedBrowserSave(page, fixture);
  await page.reload();
  await enterGame(page);
}

test('R08 coastal path connects both exits, clearings, and the shore fishing spur', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enterR08(page);

  // Cross the upper and eastern clearings on foot with a deterministic sequence of missed encounter rolls.
  await walkTo(page, 'r08_costa_turbine.tmj', 8, 3);
  expect((await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/r08_costa_turbine', x: 8, y: 3 });
  await page.screenshot({ path: info.outputPath('r08-northwest-clearing-portrait.png') });
  await walkTo(page, 'r08_costa_turbine.tmj', 31, 4);
  expect((await readBrowserSave(page)).player).toMatchObject({ mapId: 'veloria/r08_costa_turbine', x: 31, y: 4 });

  // Visit the fishing spur without starting a second fishing-battle test.
  await walkTo(page, 'r08_costa_turbine.tmj', 21, 13);
  await page.getByRole('button', { name: 'Vai in basso', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'PESCA', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('r08-fishing-spur-portrait.png') });
  await page.keyboard.press('Escape');

  // Follow the eastern arm to Portolume, return on its west edge, then cross to Ferraluce.
  await page.setViewportSize({ width: 844, height: 390 });
  await walkTo(page, 'r08_costa_turbine.tmj', 38, 11);
  await page.screenshot({ path: info.outputPath('r08-east-exit-landscape.png') });
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/portolume');
  await expect(page.locator('#game-loading')).toBeHidden();

  await walkTo(page, 'portolume.tmj', 1, 17);
  await page.getByRole('button', { name: 'Vai a sinistra', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/r08_costa_turbine');
  await expect.poll(async () => (await readBrowserSave(page)).player.spawnPointId).toBe('from_portolume');

  await walkTo(page, 'r08_costa_turbine.tmj', 1, 21);
  await page.screenshot({ path: info.outputPath('r08-west-exit-landscape.png') });
  await page.getByRole('button', { name: 'Vai a sinistra', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/ferraluce');
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(errors).toEqual([]);
});
