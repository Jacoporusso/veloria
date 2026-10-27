import { expect, test } from '@playwright/test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { enterGame } from './helpers/enter-game';
import { fightWithTouch } from './helpers/battle-touch';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

// Full journeys keep every interaction at standard density; dedicated world-control
// and camera/presentation tests cover high-density rendering and orientation.
test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
test('Vetracielo lines, Aster and the third medal persist without duplicate rewards', async ({ page }, info) => {
  // CI 39554346058 completes the medal/reward checks and runs out of time
  // during the final walking exit. Preserve that return and its per-step gates.
  test.setTimeout(process.env.CI ? 240_000 : 180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__gym03Game = game;' });
  });
  await page.goto('/'); await enterGame(page);
  await expect.poll(async () => (await readBrowserSave(page))?.flags).toContain('intro_completed');
  // Exercise the leader's documented Ground strategy with a legal level-up move.
  // A lone Water-type Omanyte could lose to paralysis and Electric attacks.
  const creature = createBattleCreature({ species: speciesData.species as any, moves: moveData.moves as any, speciesId: 50, level: 25, instanceId: 'gym03-diglett', moveIds: ['dig', 'mud-slap', 'scratch'] });
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'q_brumalta_visited', 'gym01_puzzle_solved', 'badge_aurora_awarded', 'prologue_complete_seen', 'q_petalora_visited', 'gym02_water_source_open', 'gym02_water_west_open', 'gym02_water_east_open', 'gym02_irrigation_solved', 'badge_corolla_awarded', 'q_vetracielo_visited'])];
  save.badges = ['badge_aurora', 'badge_corolla'];
  save.player = { ...save.player, mapId: 'veloria/vetracielo', spawnPointId: 'from_gym03', x: 20, y: 18, money: 500 };
  save.party = [{ instanceId: creature.instanceId, speciesId: 50, level: 25, experience: 0, hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await walkTo(page, 'vetracielo.tmj', 20, 16);
  await expect(page.locator('#current-location')).toHaveText('VETRACIELO · PIAZZA DELLA MONOROTAIA');
  await expect(page.locator('#toast')).toContainText('Lea');
  // Isolated precondition setup; the gate above was exercised with real touch movement.
  const oriented = await readBrowserSave(page); oriented.flags.push('q_vetracielo_orientation');
  oriented.player.x = 20; oriented.player.y = 18;
  await seedBrowserSave(page, oriented); await page.reload(); await enterGame(page);
  await walkTo(page, 'vetracielo.tmj', 20, 16);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI VETRACIELO');
  async function dismissDialogue() {
    for (let tap = 0; tap < 10 && await page.locator('#dialogue-box').isVisible(); tap++)
      await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  async function inspect(x: number, y: number, name: string) {
    await walkTo(page, 'gym03_vetracielo.tmj', x, y + 2); await walkDirection(page, 'up');
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.screenshot({ path: info.outputPath(`gym03-${x}-${y}-${viewport.width}.png`) });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await expect(page.locator('#dialogue-speaker')).toHaveText(name);
  }
  await inspect(15, 10, 'Aster'); await dismissDialogue();
  await expect(page.getByRole('button', { name: 'SFIDA', exact: true })).toBeHidden();
  await inspect(23, 19, 'Linea Vetro'); await dismissDialogue();
  expect((await readBrowserSave(page)).flags).not.toContain('gym03_line_glass_active');
  await inspect(7, 23, 'Linea Giardini'); await dismissDialogue();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('gym03_line_gardens_active');
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('gym03_line_gardens_active');
  await inspect(23, 19, 'Linea Vetro'); await dismissDialogue();
  await inspect(15, 15, 'Linea Cielo'); await dismissDialogue();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('gym03_lines_connected');
  await expect.poll(() => page.evaluate(() => {
    const world = (window as any).__gym03Game.scene.keys.world;
    return world.mapLayer.list.filter((item: any) => item.type === 'Text' && item.text === '✓').length;
  })).toBe(3);
  await page.screenshot({ path: info.outputPath('three-lines-active.png') });
  await inspect(15, 10, 'Aster');
  for (let tap = 0; tap < 10 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); tap++)
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-text')).toContainText('livello 16–17');
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  await fightWithTouch(page, '__gym03Game', { 50: 'Fossa' }, 10);
  const banner = page.getByRole('dialog', { name: 'Medaglia Circuito conquistata!' });
  await expect(banner).toBeVisible(); await expect(banner).toContainText('+850 monete');
  await expect(banner.locator('[data-badge-id="badge_circuito"] svg')).toBeVisible();
  await expect(banner).toContainText('Ferrostrido');
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const button = await banner.getByRole('button', { name: 'Continua', exact: true }).boundingBox();
    expect(button!.y + button!.height).toBeLessThanOrEqual(height);
    await page.screenshot({ path: info.outputPath(`circuito-${width}.png`) });
  }
  await banner.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).badges).toEqual(['badge_aurora', 'badge_corolla', 'badge_circuito']);
  expect((await readBrowserSave(page)).player.money).toBe(1350);
  await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri le medaglie' }).click();
  const medals = page.getByRole('dialog', { name: 'Le tue medaglie' });
  await expect(medals.locator('.badge-case-card')).toHaveCount(3);
  await medals.locator('[data-badge-id="badge_circuito"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('three-medals.png') });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await inspect(15, 10, 'Aster'); await dismissDialogue();
  await expect(page.getByRole('button', { name: 'SFIDA', exact: true })).toBeHidden();
  expect((await readBrowserSave(page)).player.money).toBe(1350);
  await walkTo(page, 'gym03_vetracielo.tmj', 15, 29);
  await expect(page.locator('#current-location')).toHaveText('VETRACIELO · PIAZZA DELLA MONOROTAIA');
  expect(errors).toEqual([]);
});
