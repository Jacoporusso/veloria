import { expect, test } from '@playwright/test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';
import { readBattleDiagnostics } from './helpers/battle-diagnostics';

// Full journeys keep every interaction at standard density; dedicated world-control
// and camera/presentation tests cover high-density rendering and orientation.
test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
test('Corolla opens the viaduct, Oren rewards once, and Vetracielo services persist', async ({ page }, info) => {
  // CI 39554346058 reaches the final R05 return at 240s with consecutive
  // successful walking steps. Retain the complete trainer/reward/return route.
  test.setTimeout(process.env.CI ? 360_000 : 240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__vetracieloGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  await expect.poll(async () => (await readBrowserSave(page))?.flags).toContain('intro_completed');
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({ species: speciesData.species as any, moves: moveData.moves as any, speciesId: 2, level: 20, instanceId: 'r05-fixture', moveIds: ['vine-whip', 'tackle', 'sleep-powder'] });
  save.player = { ...save.player, mapId: 'veloria/petalora', spawnPointId: 'from_r05', x: 35, y: 12, money: 500 };
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'q_brumalta_visited', 'gym01_puzzle_solved', 'badge_aurora_awarded', 'prologue_complete_seen', 'q_petalora_visited', 'gym02_water_source_open', 'gym02_water_west_open', 'gym02_water_east_open', 'gym02_irrigation_solved'])];
  save.badges = ['badge_aurora'];
  save.party = [{ instanceId: creature.instanceId, speciesId: 2, level: 20, experience: 0, hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await walkTo(page, 'petalora.tmj', 37, 12);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  await expect(page.locator('#toast')).toContainText('Corolla');
  const unlocked = await readBrowserSave(page);
  unlocked.flags.push('badge_corolla_awarded'); unlocked.badges.push('badge_corolla');
  unlocked.player.x = 35; unlocked.player.y = 12;
  await seedBrowserSave(page, unlocked); await page.reload(); await enterGame(page);
  await walkTo(page, 'petalora.tmj', 37, 12);
  await expect(page.locator('#current-location')).toHaveText('VIADOTTO DEI CILIEGI');
  await expect(page.locator('.journey-heading')).toHaveText('Verso la città dei giardini');

  async function confirmDialogue() {
    for (let tap = 0; tap < 12 && await page.locator('#dialogue-box').isVisible(); tap++) {
      await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    }
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  await walkTo(page, 'r05_viadotto_ciliegi.tmj', 15, 18);
  await walkTo(page, 'r05_viadotto_ciliegi.tmj', 18, 14); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  for (let tap = 0; tap < 8 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); tap++) {
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  }
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  async function tapBattleLabel(prefix: string) {
    const point = await page.evaluate(prefix => {
      const scene = (window as any).__vetracieloGame.scene.keys.battle;
      const text = scene.ui.list.find((item: any) => item.type === 'Text' && item.text.startsWith(prefix));
      const bounds = text.getBounds(), surface = scene.game.canvas.getBoundingClientRect();
      return { x: surface.x + bounds.centerX * scene.scale.zoom, y: surface.y + bounds.centerY * scene.scale.zoom };
    }, prefix);
    await page.touchscreen.tap(point.x, point.y);
  }
  for (let turn = 0; turn < 10; turn++) {
    if (await page.locator('.battle-celebration').isVisible()) break;
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).__vetracieloGame.scene.keys.battle;
      return Boolean(scene?.sys.isActive() && scene.ui?.list.length && (scene.terminalShown || scene.mode === 'menu'));
    })).toBe(true);
    if (await page.evaluate(() => (window as any).__vetracieloGame.scene.keys.battle.terminalShown)) break;
    await tapBattleLabel('LOTTA'); await tapBattleLabel('Frustata');
    let lastBattleState: Awaited<ReturnType<typeof readBattleDiagnostics>> | undefined;
    const battleSamples: Awaited<ReturnType<typeof readBattleDiagnostics>>[] = [];
    try {
      await expect.poll(async () => {
        const state = await readBattleDiagnostics(page, '__vetracieloGame');
        lastBattleState = state;
        battleSamples.push(state);
        if (state.terminal || state.mode === 'menu') return true;
        // Automatic messages can finish between observing their mode and pressing
        // Enter, which would dismiss the victory receipt. Only answer learning:
        // it stays open until an explicit choice and preserves the tested moves.
        if (state.mode === 'learning') await tapBattleLabel('Tieni le mosse');
        return false;
      }, { timeout: 15_000 }).toBe(true);
    } catch (error) {
      await info.attach('battle-auto-advance-state', {
        body: JSON.stringify({
          last: lastBattleState ?? await readBattleDiagnostics(page, '__vetracieloGame'),
          samples: battleSamples,
        }, null, 2),
        contentType: 'application/json',
      });
      throw error;
    }
  }
  const victory = page.locator('.battle-celebration');
  await expect(victory).toBeVisible(); await expect(victory).toContainText('240');
  await victory.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('trainer_r05_oren_defeated');
  expect((await readBrowserSave(page)).player.money).toBe(740);
  await page.screenshot({ path: info.outputPath('viaduct.png') });
  for (const [x, y] of [[15, 6], [44, 6], [45, 6]]) await walkTo(page, 'r05_viadotto_ciliegi.tmj', x, y);
  await expect(page.locator('#current-location')).toHaveText('VETRACIELO · PIAZZA DELLA MONOROTAIA');
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_vetracielo_visited');
  const before = (await readBrowserSave(page)).inventory.potion ?? 0;
  await walkTo(page, 'vetracielo.tmj', 22, 20); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Lea'); await confirmDialogue();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_vetracielo_orientation');
  expect((await readBrowserSave(page)).inventory.potion).toBe(before + 2);
  await walkTo(page, 'vetracielo.tmj', 15, 22); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).party.every(p => p.hp === p.maxHp)).toBe(true);
  await walkTo(page, 'vetracielo.tmj', 27, 22); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await page.getByRole('button', { name: /^Pozione ·/ }).click();
  await expect.poll(async () => (await readBrowserSave(page)).player.money).toBe(540);
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: info.outputPath(`vetracielo-${width}.png`) });
  }
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('q_vetracielo_orientation');
  await walkTo(page, 'vetracielo.tmj', 22, 20); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click(); await confirmDialogue();
  expect((await readBrowserSave(page)).inventory.potion).toBe(before + 3);
  await walkTo(page, 'vetracielo.tmj', 0, 25);
  await expect(page.locator('#current-location')).toHaveText('VIADOTTO DEI CILIEGI');
  for (const [x, y] of [[15, 6], [18, 14]]) await walkTo(page, 'r05_viadotto_ciliegi.tmj', x, y);
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click(); await confirmDialogue();
  await expect(page.getByRole('button', { name: 'SFIDA', exact: true })).toBeHidden();
  expect((await readBrowserSave(page)).player.money).toBe(540);
  for (const [x, y] of [[15, 18], [0, 18]]) await walkTo(page, 'r05_viadotto_ciliegi.tmj', x, y);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  expect((await readBrowserSave(page)).player).toMatchObject({ x: 36, y: 12 });
  expect((await readBrowserSave(page)).player.money).toBe(540);
  expect(errors).toEqual([]);
});
