import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';
import { fightWithTouch } from './helpers/battle-touch';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
const confirm = (page: Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
async function finishDialogue(page: Page) {
  for (let i = 0; i < 20 && await page.locator('#dialogue-box').isVisible(); i++) await confirm(page).tap();
  await expect(page.locator('#dialogue-box')).toBeHidden();
}
for (const [map, key, name, x, y, reward, exitX, exitY, destination] of [
  ['r09_dune_salmastre', 'r09_noemi', 'Noemi', 28, 9, 1250, 39, 17, 'd04_delta_specchi'],
  ['r10_sentiero_canne', 'r10_bruno', 'Bruno', 16, 13, 1450, 39, 5, 'acquariva'],
  ['r12_valle_vento', 'r12_ruben', 'Ruben', 24, 7, 1700, 39, 5, 'passobrina'],
  ['r13_tornanti_bianchi', 'r13_alma', 'Alma', 25, 13, 1900, 39, 5, 'biancavetta'],
  ['r06_anello_magnetico', 'r06_iris', 'Iris', 21, 16, 650, 39, 24, 'ferraluce'],
  ['r07_condotto_risonante', 'r07_dario', 'Dario', 18, 18, 850, 39, 10, 'd03_centrale_risonante'],
  ['r08_costa_turbine', 'r08_viola', 'Viola', 20, 11, 1050, 39, 10, 'portolume'],
  ['r11_via_cascate', 'r11_celia', 'Celia', 15, 17, 1500, 16, 29, 'acquariva'],
] as const) {
  test(`${name} offers an optional battle, pays once and leaves the walking route open`, async ({ page }, info) => {
    test.setTimeout(process.env.CI ? 300_000 : 180_000);
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nglobalThis.trainingGame=game;' });
    });
    await page.goto('/'); await enterGame(page);
    const metadata = JSON.parse(await readFile(new URL(`../../content/maps/${map}.map.json`, import.meta.url), 'utf8'));
    const save = await readBrowserSave(page);
    save.flags = [...new Set([...save.flags, 'q_starter_selected', 'prologue_complete_seen', 'badge_acciaio_awarded', 'badge_riflesso_awarded'])];
    save.player = { ...save.player, mapId: `veloria/${map}`, spawnPointId: metadata.spawns[0].id, x, y: y + 1, money: 2000 };
    // Strong, legal integration fixture; this does not attest naturally earned levels.
    const creature = createBattleCreature({ species: species.species as any, moves: moves.moves as any,
      speciesId: 20, level: 80, instanceId: 'training-fixture', moveIds: ['crunch'] });
    save.party = [{ instanceId: creature.instanceId, speciesId: 20, level: 80, experience: 0,
      hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(m => ({ id: m.moveId, pp: m.pp })) }];
    await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
    async function offer() {
      await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
      await confirm(page).tap();
      for (let i = 0; i < 20 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); i++) await confirm(page).tap();
    }
    await offer();
    await page.getByRole('button', { name: 'NON ORA', exact: true }).tap();
    expect((await readBrowserSave(page)).flags).not.toContain(`trainer_${key}_defeated`);
    await expect(page.locator('body')).not.toHaveClass(/battle-active/);
    await page.screenshot({ path: info.outputPath('trainer-portrait.png') });
    await offer(); await page.getByRole('button', { name: 'SFIDA', exact: true }).tap();
    await fightWithTouch(page, 'trainingGame', { 20: 'Sgranocchio' });
    const banner = page.getByRole('dialog').filter({ hasText: name });
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Continua', exact: true }).tap();
    await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(`q_${key}_helped`);
    expect((await readBrowserSave(page)).player.money).toBe(2000 + reward);
    await page.reload(); await enterGame(page);
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await confirm(page).tap();
    await finishDialogue(page);
    await expect(page.getByRole('button', { name: 'SFIDA', exact: true })).toBeHidden();
    expect((await readBrowserSave(page)).player.money).toBe(2000 + reward);
    await walkTo(page, `${map}.tmj`, exitX, exitY, { avoidEncounters: true });
    await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe(`veloria/${destination}`);
  });
}
