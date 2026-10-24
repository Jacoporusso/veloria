import { expect } from '@playwright/test';
import puzzle from '../../../content/puzzles/gym06_reflections.v1.json' with { type: 'json' };
import trainer from '../../../content/trainers/gym06_selene.trainer.json' with { type: 'json' };
import items from '../../../content/items/items.v1.json' with { type: 'json' };
import { buyFromShop } from '../../e2e/helpers/shop';
import type { NaturalJourneyContext } from './natural-journey-context';

/** Solve the authored mirrors and retain a real attempt with paid supplies. */
export async function runSeleneAttempt(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const initial = (await observe()).save;
  expect((await observe()).mapId).toBe('veloria/acquariva');
  expect(initial.badges).toHaveLength(5);
  expect(initial.flags).toContain('q_acquariva_report');
  const eevee = initial.party.find(member => member.speciesId === 133);
  expect(eevee?.moves.some(slot => slot.id === 'bite')).toBe(true);
  await interact(8, 13);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  let spent = 0;
  for (const [id, name, quantity] of [['super-potion', 'Superpozione', 4], ['potion', 'Pozione', 2]] as const) {
    const cost = items.items[id].price * quantity;
    expect((await observe()).save.player.money).toBeGreaterThanOrEqual(cost);
    await interact(13, 14); await buyFromShop(page, name, quantity);
    spent += cost;
    expect((await observe()).save.player.money).toBe(initial.player.money - spent);
  }
  await record('Selene supplies bought with earned money through quantity controls');
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
  await team.locator('.pokemon-select').filter({ hasText: 'Eevee' }).click();
  const lead = team.getByRole('button', { name: '↑ Metti in testa', exact: true });
  if (await lead.isVisible()) await lead.click();
  await page.keyboard.press('Escape');
  expect((await observe()).save.party[0].instanceId).toBe(eevee!.instanceId);
  await walk(17, 6);
  expect((await observe()).mapId).toBe('veloria/gym06_acquariva');
  if (!(await observe()).save.flags.includes(puzzle.solvedFlag)) {
    for (const id of ['fourth', 'second', 'first', 'third']) {
      const node = puzzle.nodes.find(node => node.id === id)!;
      await walk(node.x, node.y + 1);
      await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
      await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
      await expect(page.locator('#dialogue-text')).toContainText('Orientamento:');
      const desired = node.states.find(state => state.nextNodeId)!.label;
      if (!(await page.locator('#dialogue-text').innerText()).includes(desired)) {
        await page.getByRole('button', { name: 'RUOTA', exact: true }).click();
      }
      const close = page.getByRole('button', { name: 'CHIUDI', exact: true });
      if (await close.isVisible()) await close.click();
      await settle();
    }
  }
  expect((await observe()).save.flags).toContain(puzzle.solvedFlag);
  await record('Selene mirrors solved through the visible controls');
  await exportCheckpoint('natural-selene-prebattle-backup.json');
  await walk(16, 3);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap(); await settle();
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click(); await settle();
  const later = page.getByRole('button', { name: 'NON ORA', exact: true });
  if (await later.isVisible()) await later.click();
  const final = (await observe()).save;
  const won = final.flags.includes(trainer.battleOnceFlag);
  expect(final.player.money).toBe(initial.player.money - spent + (won ? trainer.rewardMoney : 0));
  expect(final.badges).toHaveLength(won ? 6 : 5);
  await record(won ? 'Sixth medal earned naturally' : 'Selene loss retained with spent supplies and earned puzzle progress');
  await exportCheckpoint('natural-selene-attempt-backup.json');
}
