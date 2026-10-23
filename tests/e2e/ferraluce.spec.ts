import { buyFromShop } from './helpers/shop';
import { expect, test } from '@playwright/test';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo as planWalkTo } from './helpers/world-navigation';

const walkTo = (page: import('@playwright/test').Page, file: string, x: number, y: number) => planWalkTo(page, file, x, y, { avoidEncounters: true });

// Full journeys keep every interaction at standard density; dedicated world-control
// and camera/presentation tests cover high-density rendering and orientation.
test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

test('Circuito opens R06, the reading reaches Ivo once, and Ferraluce services survive reload', async ({ page }, info) => {
  // CI 39554346058 reaches the final R06 return at 360s: the next save poll
  // confirms movement after the global deadline. Keep every walking assertion.
  test.setTimeout(process.env.CI ? 480_000 : 240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__ferraluceGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  await expect.poll(async () => (await readBrowserSave(page))?.flags).toContain('intro_completed');
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({ species: species.species as any, moves: moves.moves as any, speciesId: 195, level: 20, instanceId: 'ferraluce-traveler', moveIds: ['water-gun', 'mud-shot'] });
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'q_brumalta_visited', 'gym01_puzzle_solved', 'badge_aurora_awarded', 'prologue_complete_seen', 'q_petalora_visited', 'gym02_water_source_open', 'gym02_water_west_open', 'gym02_water_east_open', 'gym02_irrigation_solved', 'badge_corolla_awarded', 'q_vetracielo_visited', 'q_vetracielo_orientation', 'gym03_line_gardens_active', 'gym03_line_glass_active', 'gym03_lines_connected'])];
  save.player = { ...save.player, mapId: 'veloria/vetracielo', spawnPointId: 'from_r06', x: 38, y: 25, money: 500 };
  save.party = [{ instanceId: creature.instanceId, speciesId: creature.speciesId, level: creature.level, experience: 0, hp: 5, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  save.badges = ['badge_aurora', 'badge_corolla'];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await walkTo(page, 'vetracielo.tmj', 39, 25);
  await expect(page.locator('#current-location')).toContainText('VETRACIELO');
  await expect(page.locator('#toast')).toContainText('Circuito');
  const unlocked = await readBrowserSave(page);
  unlocked.flags.push('badge_circuito_awarded'); unlocked.badges.push('badge_circuito');
  unlocked.player.x = 38; unlocked.player.y = 25;
  await seedBrowserSave(page, unlocked); await page.reload(); await enterGame(page);
  await walkTo(page, 'vetracielo.tmj', 39, 25);
  await expect(page.locator('#current-location')).toHaveText('ANELLO MAGNETICO');
  await expect(page.locator('.journey-heading')).toHaveText('Il segnale dell’Anello');

  async function dismiss() {
    for (let tap = 0; tap < 12 && await page.locator('#dialogue-box').isVisible(); tap++)
      await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  async function inspect(file: string, x: number, y: number) {
    await walkTo(page, file, x, y + 2); await walkDirection(page, 'up');
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  }
  // Visit out of order: Ivo must explain where the missing reading is.
  await walkTo(page, 'r06_anello_magnetico.tmj', 39, 25);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_ferraluce_visited');
  const initialPotions = (await readBrowserSave(page)).inventory.potion ?? 0;
  await inspect('ferraluce.tmj', 20, 20);
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ivo');
  await dismiss();
  expect((await readBrowserSave(page)).flags).not.toContain('q_ferraluce_report');
  await walkTo(page, 'ferraluce.tmj', 0, 25);
  await inspect('r06_anello_magnetico.tmj', 18, 15); await dismiss();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_r06_measurement');
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('q_r06_measurement');
  await walkTo(page, 'r06_anello_magnetico.tmj', 39, 25);
  await inspect('ferraluce.tmj', 20, 20); await dismiss();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_ferraluce_report');
  expect((await readBrowserSave(page)).inventory.potion).toBe(initialPotions + 2);
  await inspect('ferraluce.tmj', 20, 20); await dismiss();
  expect((await readBrowserSave(page)).inventory.potion).toBe(initialPotions + 2);
  await inspect('ferraluce.tmj', 9, 21);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).party[0].hp).toBe(creature.stats.maxHp);
  await inspect('ferraluce.tmj', 30, 21);
  await buyFromShop(page, 'Pozione');
  await expect.poll(async () => (await readBrowserSave(page)).player.money).toBe(300);
  await expect.poll(() => page.evaluate(() => (window as any).__ferraluceGame.textures.get('veloria-ferraluce-energy-hall-v1').getSourceImage().width)).toBe(1536);
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: info.outputPath(`ferraluce-${width}.png`) });
  }
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('q_ferraluce_report');
  await walkTo(page, 'ferraluce.tmj', 0, 25);
  await walkTo(page, 'r06_anello_magnetico.tmj', 0, 15);
  await expect(page.locator('#current-location')).toContainText('VETRACIELO');
  expect((await readBrowserSave(page)).player).toMatchObject({ x: 38, y: 25, money: 300 });
  expect(errors).toEqual([]);
});
