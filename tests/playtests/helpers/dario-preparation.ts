import { expect, type Page } from '@playwright/test';
import { buyFromShop } from '../../e2e/helpers/shop';

/** A second earned preparation route; no state writes after importing the checkpoint. */
export async function runDarioPreparation(args: {
  page: Page; walk(x: number, y: number): Promise<void>; interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>; observe(): Promise<any>; record(label: string): Promise<void>;
  challenge(x: number, y: number, label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, challenge, exportCheckpoint } = args;
  const initial = (await observe()).save;
  expect((await observe()).mapId).toBe('veloria/portolume');
  expect(initial.flags).not.toContain('trainer_r07_dario_defeated');
  expect(initial.badges).toHaveLength(4);
  await interact(14, 14); await buyFromShop(page, 'Pozione', 3);
  expect((await observe()).save.player.money).toBe(initial.player.money - 600);
  await record('Three Potions purchased with the Iris reward');
  await walk(0, 17);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(0, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
  await interact(9, 21);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  await walk(39, 25);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r07_condotto_risonante');
  await challenge(18, 18, 'Dario natural preparation attempt');
  const later = page.getByRole('button', { name: 'NON ORA', exact: true });
  if (await later.isVisible()) await later.click();
  const result = (await observe()).save;
  const won = result.flags.includes('trainer_r07_dario_defeated');
  expect(result.player.money).toBe(initial.player.money - 600 + (won ? 850 : 0));
  if (won) expect(result.flags.filter((flag: string) => flag === 'trainer_r07_dario_defeated')).toHaveLength(1);
  await record(won ? 'Dario defeated with earned supplies' : 'Dario loss retained without granted progress');
  await walk(0, 23);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
  await interact(9, 21);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  await walk(39, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(39, 11);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/portolume');
  await interact(8, 14);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  await record('Dario preparation returned to Portolume');
  await exportCheckpoint('natural-dario-preparation-backup.json');
}
