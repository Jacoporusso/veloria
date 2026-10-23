import { expect, type Page } from '@playwright/test';
import { buyFromShop } from '../../e2e/helpers/shop';

/** Try the optional coastal trainer, then the fifth gym with earned party/resources only. */
export async function runNereaAttempt(args: {
  page: Page; walk(x: number, y: number): Promise<void>; interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>; observe(): Promise<any>; record(label: string): Promise<void>;
  challenge(x: number, y: number, label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, challenge, exportCheckpoint } = args;
  expect((await observe()).mapId).toBe('veloria/portolume');
  expect((await observe()).save.party[0].speciesId).toBe(170);
  expect((await observe()).save.badges).toHaveLength(4);
  expect((await observe()).save.flags).not.toContain('trainer_r08_viola_defeated');
  const initialMoney = (await observe()).save.player.money;
  await interact(14, 14);
  await buyFromShop(page, 'Superpozione');
  expect((await observe()).save.player.money).toBe(initialMoney - 700);
  await record('Bought a Super Potion with coastal checkpoint money');
  if (process.env.PLAYTEST_EXTRA_POTION === '1') {
    await interact(14, 14); await buyFromShop(page, 'Pozione');
    expect((await observe()).save.player.money).toBe(initialMoney - 900);
    await record('Bought one additional Potion with earned preparation money');
  }
  await walk(0, 17);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await challenge(20, 11, 'Viola natural preparation attempt');
  const later = page.getByRole('button', { name: 'NON ORA', exact: true });
  if (await later.isVisible()) await later.click();
  const afterViola = (await observe()).save;
  if (!afterViola.flags.includes('trainer_r08_viola_defeated')) {
    await record('Viola not defeated: retain the real result for preparation review');
    await exportCheckpoint('natural-viola-attempt-backup.json');
    return;
  }
  expect(afterViola.player.money).toBe(initialMoney - (process.env.PLAYTEST_EXTRA_POTION === '1' ? 900 : 700) + 1050);
  await walk(39, 11);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/portolume');
  await interact(8, 14);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  await interact(14, 14); await buyFromShop(page, 'Superpozione');
  await interact(14, 14); await buyFromShop(page, 'Pozione', 2);
  await record('Viola reward funded gym supplies and Center rest');
  await walk(18, 6);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/gym05_portolume');
  for (const [x, y, flag] of [[8, 17, 'gym05_basin_balanced'], [24, 10, 'gym05_sluice_open'], [8, 4, 'gym05_tide_stable']] as const) {
    await interact(x, y);
    expect((await observe()).save.flags).toContain(flag);
  }
  await record('Nerea sluices completed with the naturally earned party');
  const beforeGym = (await observe()).save;
  await challenge(16, 3, 'Nerea first natural attempt');
  if (await later.isVisible()) await later.click();
  const result = (await observe()).save;
  if (result.flags.includes('badge_marea_awarded')) {
    expect(result.badges).toHaveLength(5);
    expect(result.player.money).toBe(beforeGym.player.money + 1400);
    await record('Fifth medal earned naturally');
  } else {
    expect(result.badges).toHaveLength(4);
    await record('Nerea not defeated: preserve the loss and remaining resources');
  }
  await exportCheckpoint('natural-nerea-attempt-backup.json');
}
