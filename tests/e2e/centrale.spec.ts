import { expect, test, type Page } from '@playwright/test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

async function seedFerraluce(page: Page, hasSteelBadge: boolean) {
  await page.goto('/');
  await enterGame(page);
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({
    species: speciesData.species as any,
    moves: moveData.moves as any,
    speciesId: 138,
    level: 35,
    instanceId: 'centrale-investigation-omanyte',
    moveIds: ['mud-shot', 'water-gun', 'rollout'],
  });
  save.flags = [...new Set([
    ...save.flags.filter(flag => flag === 'intro_completed'),
    'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped',
    'q_brumalta_visited', 'gym01_puzzle_solved', 'badge_aurora_awarded', 'prologue_complete_seen',
    'q_petalora_visited', 'gym02_water_source_open', 'gym02_water_west_open', 'gym02_water_east_open',
    'gym02_irrigation_solved', 'badge_corolla_awarded', 'q_vetracielo_visited', 'q_vetracielo_orientation',
    'gym03_line_gardens_active', 'gym03_line_glass_active', 'gym03_lines_connected', 'badge_circuito_awarded',
    'q_r06_measurement', 'q_ferraluce_visited', 'q_ferraluce_report', 'gym04_magnetic_aligned',
    ...(hasSteelBadge ? ['badge_acciaio_awarded'] : []),
  ])];
  save.badges = ['badge_aurora', 'badge_corolla', 'badge_circuito', ...(hasSteelBadge ? ['badge_acciaio'] : [])];
  save.player = { ...save.player, mapId: 'veloria/ferraluce', spawnPointId: 'from_r07', x: 38, y: 25, money: 1200 };
  save.party = [{
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    level: creature.level,
    experience: 0,
    hp: creature.hp,
    maxHp: creature.stats.maxHp,
    moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
  }];
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
}

async function dismissDialogue(page: Page) {
  const dialogue = page.locator('#dialogue-box');
  for (let tap = 0; tap < 8 && await dialogue.isVisible(); tap++) {
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  }
  await expect(dialogue).toBeHidden();
}

async function inspect(page: Page, map: string, x: number, y: number, speaker: string, capture?: () => Promise<void>) {
  await walkTo(page, map, x, y + 2, { avoidEncounters: true });
  await walkDirection(page, 'up');
  if (capture) await capture();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText(speaker);
  await expect(page.locator('#dialogue-box')).toBeVisible();
}

test('R07 readings and Centrale investigation advance in order and report once', async ({ page }, info) => {
  // Linux software rendering was still walking the return route at 180s;
  // every movement assertion remains bounded independently.
  test.setTimeout(process.env.CI ? 300_000 : 180_000);
  await seedFerraluce(page, false);
  const initial = await readBrowserSave(page);
  const startingMoney = initial.player.money;
  const startingPotions = initial.inventory.potion ?? 0;

  // The east exit remains closed until the fourth badge is present.
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  await expect(page.locator('#toast')).toContainText('Il percorso resta chiuso');
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/ferraluce');
  expect((await readBrowserSave(page)).flags).not.toContain('badge_acciaio_awarded');

  const unlocked = await readBrowserSave(page);
  unlocked.flags.push('badge_acciaio_awarded');
  unlocked.badges.push('badge_acciaio');
  unlocked.player.x = 38;
  unlocked.player.y = 25;
  await seedBrowserSave(page, unlocked);
  await page.reload();
  await enterGame(page);
  await walkDirection(page, 'right');
  await expect(page.locator('#current-location')).toHaveText('CONDOTTO RISONANTE');
  await page.screenshot({ path: info.outputPath('r07-condotto.png') });

  await inspect(page, 'r07_condotto_risonante.tmj', 20, 16, 'Misuratore del Condotto');
  await expect(page.locator('#dialogue-text')).toContainText('prove sperimentali');
  await dismissDialogue(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_r07_measurement');

  await walkTo(page, 'r07_condotto_risonante.tmj', 39, 11, { avoidEncounters: true });
  await expect(page.locator('#current-location')).toHaveText('CENTRALE RISONANTE');
  await page.screenshot({ path: info.outputPath('d03-centrale.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#current-location')).toHaveText('CENTRALE RISONANTE');
  for (const name of ['Vai in alto', 'Conferma e interagisci']) {
    const bounds = await page.getByRole('button', { name, exact: true }).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(390);
  }
  await page.screenshot({ path: info.outputPath('d03-centrale-landscape.png') });
  await page.setViewportSize({ width: 390, height: 844 });

  async function captureStation(label: string) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.screenshot({ path: info.outputPath(`centrale-${label}-${viewport.width}.png`) });
    }
    await page.setViewportSize({ width: 390, height: 844 });
  }

  // Trying the regulator first explains the required order and grants no progress.
  await inspect(page, 'd03_centrale_risonante.tmj', 23, 10, 'Console della linea di prova', () => captureStation('regulator'));
  await expect(page.locator('#dialogue-text')).toContainText('Prima di agire');
  await dismissDialogue(page);
  expect((await readBrowserSave(page)).flags).not.toContain('q_centrale_isolated');

  await inspect(page, 'd03_centrale_risonante.tmj', 8, 10, 'Registro delle prove', () => captureStation('log'));
  await expect(page.locator('#dialogue-text')).toContainText('autorizzazione');
  await dismissDialogue(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_centrale_log');

  // Reload between the log and isolation confirms that the quest checkpoint persists.
  await page.reload();
  await enterGame(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_centrale_log');
  await inspect(page, 'd03_centrale_risonante.tmj', 23, 10, 'Console della linea di prova');
  await expect(page.locator('#dialogue-text')).toContainText('linea sperimentale');
  await dismissDialogue(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_centrale_isolated');

  await inspect(page, 'd03_centrale_risonante.tmj', 15, 6, 'Sensore di uscita', () => captureStation('sensor'));
  await expect(page.locator('#dialogue-text')).toContainText('impulsi della linea sperimentale');
  await dismissDialogue(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_centrale_output');

  // Return by the authored map exits and report to Ivo in Ferraluce.
  await walkTo(page, 'd03_centrale_risonante.tmj', 14, 23, { avoidEncounters: true });
  await expect(page.locator('#current-location')).toHaveText('CONDOTTO RISONANTE');
  await walkTo(page, 'r07_condotto_risonante.tmj', 0, 23, { avoidEncounters: true });
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  await inspect(page, 'ferraluce.tmj', 20, 20, 'Ivo');
  await expect(page.locator('#dialogue-text')).toContainText('riscontro verificabile');
  await dismissDialogue(page);
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_centrale_report');
  const reported = await readBrowserSave(page);
  expect(reported.player.money).toBe(startingMoney + 300);
  expect(reported.inventory.potion).toBe(startingPotions + 2);

  await inspect(page, 'ferraluce.tmj', 20, 20, 'Ivo');
  await dismissDialogue(page);
  const afterRepeat = await readBrowserSave(page);
  expect(afterRepeat.player.money).toBe(startingMoney + 300);
  expect(afterRepeat.inventory.potion).toBe(startingPotions + 2);
  await page.reload();
  await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('q_centrale_report');
});
