import { expect, type Page } from '@playwright/test';

/** Backtrack to an undefeated trainer using the actual post-loss save and free Centers. */
export async function runIrisRecovery(args: {
  page: Page; walk(x: number, y: number): Promise<void>; interact(x: number, y: number): Promise<void>;
  settle(): Promise<void>; observe(): Promise<any>; record(label: string): Promise<void>;
  challenge(x: number, y: number, label: string): Promise<void>;
  exportCheckpoint(filename: string): Promise<void>;
}): Promise<void> {
  const { page, walk, interact, settle, observe, record, challenge, exportCheckpoint } = args;
  const initial = (await observe()).save;
  expect((await observe()).mapId).toBe('veloria/r08_costa_turbine');
  expect(initial.flags).not.toContain('trainer_r06_iris_defeated');
  expect(initial.flags).not.toContain('trainer_r08_viola_defeated');
  expect(initial.badges).toHaveLength(4);
  const later = page.getByRole('button', { name: 'NON ORA', exact: true });
  if (await later.isVisible()) await later.click();
  await walk(0, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
  async function restInFerraluce() {
    await interact(9, 21);
    await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
    expect((await observe()).save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
  }
  await restInFerraluce();
  await record('Backtracked to Ferraluce using the post-Viola loss checkpoint');
  await walk(0, 25);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r06_anello_magnetico');
  await challenge(21, 16, 'Iris natural recovery attempt');
  if (await later.isVisible()) await later.click();
  const result = (await observe()).save;
  if (result.flags.includes('trainer_r06_iris_defeated')) {
    expect(result.player.money).toBe(initial.player.money + 650);
    expect(result.flags.filter((flag: string) => flag === 'trainer_r06_iris_defeated')).toHaveLength(1);
    await record('Iris reward earned without extra supplies or replayed victories');
  } else await record('Iris not defeated: preserve the real attempt');
  await walk(39, 24);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/ferraluce');
  await restInFerraluce();
  await walk(39, 21);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/r08_costa_turbine');
  await walk(39, 11);
  await expect.poll(async () => (await observe()).mapId).toBe('veloria/portolume');
  await interact(8, 14);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  await record('Recovery attempt returned to Portolume with earned resources');
  await exportCheckpoint('natural-iris-recovery-backup.json');
}
