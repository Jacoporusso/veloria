import { expect } from '@playwright/test';
import lina from '../../../content/trainers/r09_lina.trainer.json' with { type: 'json' };
import noemi from '../../../content/trainers/r09_noemi.trainer.json' with { type: 'json' };
import type { NaturalJourneyContext } from './natural-journey-context';

/** Recover through unfinished optional battles, with no purchases or reward grants. */
export async function runDunesRecovery(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const initial = (await observe()).save;
  expect((await observe()).mapId).toBe('veloria/acquariva');
  expect(initial.badges).toHaveLength(5);
  await walk(0, 16); expect((await observe()).mapId).toBe('veloria/r10_sentiero_canne');
  await walk(0, 21); expect((await observe()).mapId).toBe('veloria/d04_delta_specchi');
  await walk(0, 17); expect((await observe()).mapId).toBe('veloria/r09_dune_salmastre');
  let reward = 0;
  for (const [trainer, x, y] of [[lina, 18, 8], [noemi, 28, 9]] as const) {
    if (!(await observe()).save.flags.includes(trainer.battleOnceFlag)) {
      await walk(x, y + 1);
      await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
      await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap(); await settle();
      await page.getByRole('button', { name: 'SFIDA', exact: true }).click(); await settle();
      const won = (await observe()).save.flags.includes(trainer.battleOnceFlag);
      if (won) reward += trainer.rewardMoney;
      await record(won ? `${trainer.name} recovery reward earned once` : `${trainer.name} recovery loss retained`);
      await exportCheckpoint(`natural-${trainer.name.toLowerCase()}-recovery-backup.json`);
    }
    expect((await observe()).save.player.money).toBe(initial.player.money + reward);
    await walk(19, 0); expect((await observe()).mapId).toBe('veloria/portolume');
    await interact(8, 14);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
    await walk(15, 29); expect((await observe()).mapId).toBe('veloria/r09_dune_salmastre');
  }
  await walk(39, 17); expect((await observe()).mapId).toBe('veloria/d04_delta_specchi');
  await walk(39, 7); expect((await observe()).mapId).toBe('veloria/r10_sentiero_canne');
  await walk(39, 5); expect((await observe()).mapId).toBe('veloria/acquariva');
  await interact(8, 13);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  const final = (await observe()).save;
  expect(final.player.money).toBe(initial.player.money + reward);
  expect(final.inventory).toEqual(initial.inventory);
  expect(final.badges).toEqual(initial.badges);
  expect(final.storage).toEqual(initial.storage);
  await record('Dunes recovery retained after returning to Acquariva Center');
  await exportCheckpoint('natural-dunes-recovery-backup.json');
}
