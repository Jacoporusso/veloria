import { expect } from '@playwright/test';
import type { NaturalJourneyContext } from './natural-journey-context';

/** Continue the earned fifth-medal save through the authored research chapter. */
export async function runPortolumeAcquariva(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const initial = (await observe()).save;
  expect(initial.badges).toHaveLength(5);
  expect(initial.flags).toContain('badge_marea_awarded');
  expect(['veloria/gym05_portolume', 'veloria/acquariva']).toContain((await observe()).mapId);
  const confirm = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  async function inspect(x: number, y: number, direction: string): Promise<void> {
    await walk(x, y);
    await page.getByRole('button', { name: direction, exact: true }).tap();
    await confirm.tap(); await settle();
  }
  if ((await observe()).mapId === 'veloria/gym05_portolume') {
    await walk(15, 23);
    expect((await observe()).mapId).toBe('veloria/portolume');
    await interact(8, 14); await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
    expect((await observe()).save.party.every(member => member.hp === member.maxHp && !member.status)).toBe(true);
    await walk(15, 29);
    expect((await observe()).mapId).toBe('veloria/r09_dune_salmastre');
    await record('Fifth medal opened the coastal garden exit naturally');
    await walk(39, 17);
    expect((await observe()).mapId).toBe('veloria/d04_delta_specchi');
    await inspect(19, 23, 'Vai in basso');
    await inspect(28, 6, 'Vai in basso');
    await inspect(12, 6, 'Vai in basso');
    const beforeReport = (await observe()).save;
    for (const flag of ['q_delta_nursery_read', 'q_delta_reeds_read', 'q_delta_flow_read']) expect(beforeReport.flags).toContain(flag);
    await inspect(12, 18, 'Vai a destra');
    let save = (await observe()).save;
    expect(save.flags).toContain('q_delta_report');
    expect(save.player.money).toBe(beforeReport.player.money + 350);
    expect(save.inventory['poke-ball']).toBe((beforeReport.inventory['poke-ball'] ?? 0) + 3);
    await inspect(12, 18, 'Vai a destra');
    expect((await observe()).save.player.money).toBe(save.player.money);
    expect((await observe()).save.inventory).toEqual(save.inventory);
    await record('Three Delta observations delivered for one earned reward');
    await walk(39, 7);
    expect((await observe()).mapId).toBe('veloria/r10_sentiero_canne');
    const beforeKit = (await observe()).save.inventory.antidote ?? 0;
    await inspect(31, 18, 'Vai in basso');
    expect((await observe()).save.inventory.antidote).toBe(beforeKit + 2);
    await walk(39, 5);
    expect((await observe()).mapId).toBe('veloria/acquariva');
    const beforeLake = (await observe()).save.inventory.potion ?? 0;
    await inspect(33, 14, 'Vai a destra');
    save = (await observe()).save;
    expect(save.flags).toContain('q_acquariva_report');
    expect(save.inventory.potion).toBe(beforeLake + 2);
    await inspect(33, 14, 'Vai a destra');
    expect((await observe()).save.inventory).toEqual(save.inventory);
  } else {
    expect(initial.flags).toContain('q_delta_report');
    expect(initial.flags).toContain('q_acquariva_report');
  }
  await interact(8, 13); await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
  const beforeResume = (await observe()).save;
  expect(beforeResume.party.every(member => member.hp === member.maxHp && !member.status)).toBe(true);
  expect(beforeResume.badges).toEqual(initial.badges);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Salva e torna al titolo' }).click();
  await page.getByRole('button', { name: 'Continua partita', exact: true }).click();
  await expect.poll(async () => (await observe())?.mapId, { timeout: 30_000 }).toBe('veloria/acquariva');
  const afterResume = (await observe()).save;
  for (const key of ['party', 'inventory', 'badges', 'rngState'] as const) expect(afterResume[key]).toEqual(beforeResume[key]);
  expect(afterResume.player.money).toBe(beforeResume.player.money);
  expect(afterResume.flags).toContain('q_acquariva_report');
  await record('Acquariva research, earned rewards and rested party persist after title resume');
  await exportCheckpoint('natural-acquariva-arrival-backup.json');
}
