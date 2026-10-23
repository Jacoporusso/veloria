import { expect, type Page } from '@playwright/test';

/** Search a registered habitat using only the two remaining earned capture balls. */
export async function runWooperPreparation(args: {
  page: Page; walk(x: number, y: number): Promise<void>; interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>; observe(): Promise<any>; record(label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = args;
  const initial = (await observe()).save;
  expect(['veloria/portolume', 'veloria/r08_costa_turbine']).toContain((await observe()).mapId);
  expect(initial.party.some((member: any) => member.speciesId === 194 || member.speciesId === 195)).toBe(false);
  expect(initial.badges).toHaveLength(4);
  const later = page.getByRole('button', { name: 'NON ORA', exact: true });
  if (await later.isVisible()) await later.click();
  if ((await observe()).mapId === 'veloria/portolume') await walk(0, 17);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(0, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
  async function rest() {
    await interact(9, 21);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  }
  await rest();
  for (let round = 0; round < 6; round++) {
    const state = (await observe()).save;
    if (state.party.some((member: any) => member.speciesId === 194) || !(state.inventory['poke-ball'] > 0)) break;
    await walk(39, 25);
    await expect.poll(async () => (await observe()).mapId).toBe('veloria/r07_condotto_risonante');
    await walk(8, 8);
    for (let step = 0; step < 20; step++) {
      const current = (await observe()).save;
      if (current.party.some((member: any) => member.speciesId === 194) || !(current.inventory['poke-ball'] > 0) || current.party[0].hp < current.party[0].maxHp / 2) break;
      await walk(8, step % 2 === 0 ? 9 : 8);
    }
    await record(`Wooper habitat search round ${round + 1}`);
    await walk(0, 23);
    await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
    await rest();
  }
  const result = (await observe()).save;
  expect(result.player.money).toBe(initial.player.money);
  expect(result.badges).toEqual(initial.badges);
  expect(result.inventory['poke-ball']).toBeLessThanOrEqual(initial.inventory['poke-ball']);
  await record(result.party.some((member: any) => member.speciesId === 194) ? 'Wooper caught from the authored habitat' : 'Search budget exhausted without granting a companion');
  await walk(39, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(39, 11);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/portolume');
  await interact(8, 14);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  await record('Habitat search returned to Portolume');
  await exportCheckpoint('natural-wooper-preparation-backup.json');
}
