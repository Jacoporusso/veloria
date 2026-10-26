import { expect, test, type Page } from '@playwright/test';
import { createBattleCreature } from '../../src/core/battle/create-creature';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

const views = [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
] as const;

function legalGen1Party() {
  const creature = createBattleCreature({
    species: species.species as any,
    moves: moves.moves as any,
    speciesId: 1,
    level: 8,
    instanceId: 'coastal-city-services-bulbasaur',
  });
  return [{
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: creature.experience,
    hp: creature.hp,
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
  }];
}

async function enterCityFixture(page: Page, mapId: string, spawnPointId: string, x: number, y: number, extraFlags: string[]) {
  await page.goto('/');
  await enterGame(page);
  const save = await readBrowserSave(page);
  save.player = { ...save.player, mapId, spawnPointId, x, y };
  save.flags = [...new Set([
    ...save.flags,
    'intro_completed', 'tutorial_habitat_seen', 'q_starter_selected', 'q_centrale_report',
    'prologue_complete_seen', ...extraFlags,
  ])];
  save.party = legalGen1Party();
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
}

async function reachPrompt(page: Page, mapFile: string, x: number, y: number, direction: string, text: string, screenshotPath: string) {
  await walkTo(page, mapFile, x, y, { avoidEncounters: true });
  await page.getByRole('button', { name: direction, exact: true }).tap();
  await expect(page.locator('#interaction-prompt')).toContainText(text);
  await page.screenshot({ path: screenshotPath });
}

test('Portolume center, market, monorail and gym threshold remain reachable on foot in both orientations', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  // Use the authored mainland dock spawn and keep the observatory island covered
  // by the existing Portolume fishing/transport test.
  await page.setViewportSize({ width: 390, height: 844 });
  await enterCityFixture(page, 'veloria/portolume', 'dock_mainland', 25, 14, ['q_portolume_visited']);
  expect(await readBrowserSave(page)).toMatchObject({ player: { mapId: 'veloria/portolume', spawnPointId: 'dock_mainland', x: 25, y: 14 } });
  await page.screenshot({ path: info.outputPath('portolume-mainland-dock-portrait.png') });

  for (const view of views) {
    await page.setViewportSize({ width: view.width, height: view.height });
    await expect(page.locator('#game canvas')).toBeVisible();
    for (const [x, y, direction, label, name] of [
      [8, 15, 'Vai in alto', 'Centro Pokémon', 'center'],
      [14, 15, 'Vai in alto', 'Mercato del Porto', 'market'],
      [7, 20, 'Vai in basso', 'Monorotaia di Portolume', 'monorail'],
    ] as const) {
      await reachPrompt(page, 'portolume.tmj', x, y, direction, label, info.outputPath(`portolume-${view.name}-${name}.png`));
    }
  }

  // Cross the gym threshold, then stop before approaching the trainer or starting a battle.
  await walkTo(page, 'portolume.tmj', 18, 7, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('portolume-gym-approach.png') });
  await walkTo(page, 'portolume.tmj', 18, 6, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/gym05_portolume');
  await page.screenshot({ path: info.outputPath('portolume-gym-threshold.png') });
  expect(errors).toEqual([]);
});

test('Acquariva services, Tessa and gym threshold remain reachable on foot in both orientations', async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await enterCityFixture(page, 'veloria/acquariva', 'from_r10', 1, 16, ['q_delta_report', 'q_acquariva_visited']);
  for (const view of views) {
    await page.setViewportSize({ width: view.width, height: view.height });
    await expect(page.locator('#game canvas')).toBeVisible();
    for (const [x, y, direction, label, name] of [
      [8, 14, 'Vai in alto', 'Centro Pokémon', 'center'],
      [13, 15, 'Vai in alto', 'Mercato del Lago', 'market'],
      [6, 23, 'Vai in alto', 'Monorotaia di Acquariva', 'monorail'],
    ] as const) {
      await reachPrompt(page, 'acquariva.tmj', x, y, direction, label, info.outputPath(`acquariva-${view.name}-${name}.png`));
    }
  }

  // Tessa's report is available in this fixture; keep the authored approach and facing.
  await walkTo(page, 'acquariva.tmj', 33, 14, { avoidEncounters: true });
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Tessa');
  for (let step = 0; step < 24 && await page.locator('#dialogue-box').isVisible(); step++) {
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  }
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_acquariva_report');
  await page.screenshot({ path: info.outputPath('acquariva-tessa-report.png') });
  await page.getByRole('button', { name: 'Chiudi ricompensa', exact: true }).click();

  // The report unlocks the actual threshold; entering the gym does not start its battle.
  await walkTo(page, 'acquariva.tmj', 17, 7, { avoidEncounters: true });
  await page.screenshot({ path: info.outputPath('acquariva-gym-approach.png') });
  await walkTo(page, 'acquariva.tmj', 17, 6, { avoidEncounters: true });
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/gym06_acquariva');
  await page.screenshot({ path: info.outputPath('acquariva-gym-threshold.png') });
  expect(errors).toEqual([]);
});
