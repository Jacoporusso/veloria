import { expect, test, type Page } from '@playwright/test';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import router from '../../content/puzzles/gym04_magnetic.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { journeyMilestones } from '../../src/game/journey/progress.ts';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

// Full journeys keep every interaction at standard density; dedicated world-control
// and camera/presentation tests cover high-density rendering and orientation.
test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

async function prepare(page: Page, report: boolean) {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__gym04Game = game;' });
  });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  const priorMilestones = journeyMilestones.slice(0, journeyMilestones.findIndex(step => step.flag === 'q_ferraluce_report'));
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped',
    ...priorMilestones.map(step => step.flag), 'prologue_complete_seen', 'badge_circuito_awarded', 'q_ferraluce_visited', ...(report ? ['q_ferraluce_report'] : [])])];
  save.badges = ['badge_aurora', 'badge_corolla', 'badge_circuito'];
  save.player = { ...save.player, mapId: 'veloria/ferraluce', spawnPointId: 'from_gym04', x: 34, y: 19, money: 100 };
  const creature = createBattleCreature({ species: species.species as any, moves: moves.moves as any, speciesId: 140, level: 36, instanceId: 'gym04-integration', moveIds: ['mud-shot', 'aqua-jet', 'mega-drain'] });
  save.party = [{ instanceId: creature.instanceId, speciesId: 140, level: creature.level, experience: 0, hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
}

async function inspect(page: Page, x: number, y: number) {
  await walkTo(page, 'gym04_ferraluce.tmj', x, y + 2);
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
}

test('Ferraluce lift gates on the report; magnetic orientations persist and connect in any order', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await prepare(page, false);
  await walkDirection(page, 'up');
  await expect(page.locator('#toast')).toContainText('Ivo');
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/ferraluce');
  const save = await readBrowserSave(page);
  save.flags.push('q_ferraluce_report'); save.player.x = 34; save.player.y = 19;
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await walkDirection(page, 'up');
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI FERRALUCE');
  await expect(page.locator('.journey-heading')).toHaveText('Il circuito magnetico');
  for (const [index, id] of ['field', 'first', 'second'].entries()) {
    const node = router.nodes.find(node => node.id === id)!;
    await inspect(page, node.x, node.y);
    await expect(page.locator('#dialogue-text')).toContainText('Direzione:');
    await page.getByRole('button', { name: 'RUOTA', exact: true }).click();
    if (index < 2) await page.getByRole('button', { name: 'CHIUDI', exact: true }).click();
    else {
      await expect(page.locator('#dialogue-text')).toContainText('circuito è stabile');
      await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    }
    if (index === 0) { await page.reload(); await enterGame(page); }
  }
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(router.solvedFlag);
  await expect(page.locator('.journey-heading')).toHaveText('La Medaglia Acciaio');
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: info.outputPath(`magnetic-room-${width}.png`) });
  }
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain(router.solvedFlag);
  await inspect(page, 10, 15);
  await expect(page.getByRole('button', { name: 'RUOTA', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await walkTo(page, 'gym04_ferraluce.tmj', 15, 23);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  expect((await readBrowserSave(page)).player.money).toBe(100);
  expect(errors).toEqual([]);
});

test('Rhea requires the circuit, awards Acciaio once, and the medal survives reload', async ({ page }, info) => {
  test.setTimeout(240_000);
  await prepare(page, true);
  await walkDirection(page, 'up');
  await inspect(page, 15, 10);
  for (let i = 0; i < 12 && await page.locator('#dialogue-box').isVisible(); i++) await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.getByRole('button', { name: 'SFIDA', exact: true })).toBeHidden();
  const save = await readBrowserSave(page);
  save.flags.push(router.solvedFlag);
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await inspect(page, 15, 10);
  for (let i = 0; i < 12 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); i++) await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  async function tapLabel(prefix: string) {
    const point = await page.evaluate(prefix => {
      const scene = (window as any).__gym04Game.scene.keys.battle;
      const label = scene.ui.list.find((item: any) => item.type === 'Text' && item.text.startsWith(prefix));
      if (!label) throw new Error(`Missing battle command ${prefix}`);
      const bounds = label.getBounds(), canvas = scene.game.canvas.getBoundingClientRect();
      return { x: canvas.x + bounds.centerX * scene.scale.zoom, y: canvas.y + bounds.centerY * scene.scale.zoom };
    }, prefix);
    await page.touchscreen.tap(point.x, point.y);
  }
  for (let turn = 0; turn < 15; turn++) {
    await expect.poll(async () => {
      const mode = await page.evaluate(() => {
        const scene = (window as any).__gym04Game.scene.keys.battle;
        return !scene?.sys.isActive() || !scene.ui || !scene.state
          ? 'loading'
          : scene.terminalShown ? 'terminal' : scene.mode;
      });
      if (mode === 'learning') await tapLabel('Tieni le mosse');
      return mode === 'terminal' || mode === 'menu';
    }, { timeout: 25_000 }).toBe(true);
    if (await page.locator('.battle-celebration').isVisible()) break;
    const opponent = await page.evaluate(() => {
      const state = (window as any).__gym04Game.scene.keys.battle.state;
      return state.opponent.creatures[state.opponent.activeIndex].speciesId;
    });
    await tapLabel('LOTTA'); await tapLabel(opponent === 81 ? 'Colpodifango' : 'Pistolacqua');
  }
  const banner = page.getByRole('dialog', { name: 'Medaglia Acciaio conquistata!' });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('+1100 monete');
  await expect(banner).toContainText('Rhea');
  await expect(banner).toContainText('Difesa');
  await expect(banner.locator('[data-badge-id="badge_acciaio"] svg')).toBeVisible();
  await page.screenshot({ path: info.outputPath('acciaio-banner.png') });
  await banner.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('badge_acciaio_awarded');
  expect((await readBrowserSave(page)).player.money).toBe(1200);
  await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri le medaglie' }).click();
  await expect(page.locator('.badge-case-card')).toHaveCount(4);
  await expect(page.locator('[data-badge-id="badge_acciaio"] svg')).toBeVisible();
  await page.keyboard.press('Escape');
  await inspect(page, 15, 10);
  for (let i = 0; i < 12 && await page.locator('#dialogue-box').isVisible(); i++) await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.getByRole('button', { name: 'SFIDA', exact: true })).toBeHidden();
  expect((await readBrowserSave(page)).player.money).toBe(1200);
});
