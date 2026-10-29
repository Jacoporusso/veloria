import { expect } from '@playwright/test';
import type { NaturalJourneyContext } from './natural-journey-context';

/** Every map change and quest action uses normal player controls. */
export async function runGreenhousePreparation(context: NaturalJourneyContext): Promise<void> {
  const { page, walk, interact, settle, observe, record, exportCheckpoint } = context;
  const state = () => observe();
  const map = async (id: string) => expect((await state()).mapId).toBe(`veloria/${id}`);
  const initial = (await state()).save;
  expect(initial.player.mapId).toBe('veloria/r08_costa_turbine');
  expect(initial.party).toHaveLength(6);
  expect(initial.party.some(member => member.speciesId === 102 && member.level === 27 && member.moves.some(move => move.id === 'confusion'))).toBe(true);
  expect(initial.flags).toContain('q_radicelmo_seed_archived');
  expect(initial.flags).not.toContain('q_radicelmo_greenhouse_complete');
  for (const required of ['badge_aurora_awarded', 'badge_corolla_awarded', 'badge_circuito_awarded', 'q_centrale_report']) {
    expect(initial.flags, `The authored return route requires ${required}`).toContain(required);
  }

  // Follow the authored exits west through Ferraluce, R06, Vetracielo, R05,
  // Petalora, and R04. These are ordinary walks through trigger cells.
  await walk(0, 21); await map('ferraluce');
  await walk(0, 25); await map('r06_anello_magnetico');
  await walk(0, 15); await map('vetracielo');
  await walk(0, 25); await map('r05_viadotto_ciliegi');
  await walk(0, 18); await map('petalora');
  await walk(18, 27); await map('r04_salita_petali');
  await walk(18, 29); await map('radicelmo');
  await expect.poll(async () => (await state()).save.flags).toContain('badge_aurora_awarded');

  // Snapshot the true pre-quest state after the real route, immediately before
  // the first greenhouse dialogue, so the reward delta excludes route encounters.
  await exportCheckpoint('natural-greenhouse-prequest-backup.json');
  const before = (await state()).save;
  const partyIds = before.party.map(member => member.instanceId);
  const badges = [...before.badges];
  const money = before.player.money;
  const potions = before.inventory.potion ?? 0;
  const antidotes = before.inventory.antidote ?? 0;
  const storageIds = before.storage.map(member => member.instanceId);

  await interact(25, 11); // Leda: begin
  await expect.poll(async () => (await state()).save.flags).toContain('q_radicelmo_greenhouse_started');
  await interact(22, 16); // water
  await expect.poll(async () => (await state()).save.flags).toContain('q_radicelmo_greenhouse_watered');
  await interact(28, 16); // light
  await expect.poll(async () => (await state()).save.flags).toContain('q_radicelmo_greenhouse_lit');
  await interact(25, 16); // observe the sprout
  await expect.poll(async () => (await state()).save.flags).toContain('q_radicelmo_seed_sprouted');
  await interact(25, 11); // report to Leda
  await expect.poll(async () => (await state()).save.flags).toContain('q_radicelmo_greenhouse_complete');
  const closeReward = page.getByRole('button', { name: 'Chiudi ricompensa', exact: true });
  if (await closeReward.isVisible()) await closeReward.click();
  await settle();

  const completed = (await state()).save;
  expect(completed.player.money).toBe(money + 180);
  expect(completed.inventory.potion).toBe(potions + 2);
  expect(completed.inventory.antidote).toBe(antidotes + 1);
  expect(completed.party.map(member => member.instanceId)).toEqual(partyIds);
  expect(completed.badges).toEqual(badges);
  expect(completed.storage.slice(0, storageIds.length).map(member => member.instanceId)).toEqual(storageIds);
  // The party was full, so the quest's level-15 Bulbasaur belongs in storage.
  expect(completed.storage.slice(storageIds.length).some(member => member.speciesId === 1 && member.level === 15)).toBe(true);
  await record('Radicelmo greenhouse reward earned once');
  await interact(25, 11);
  const repeated = (await state()).save;
  expect(repeated.player.money).toBe(completed.player.money);
  expect(repeated.inventory).toEqual(completed.inventory);
  expect(repeated.flags).toContain('q_radicelmo_greenhouse_complete');
  await exportCheckpoint('natural-greenhouse-complete-backup.json');

  // Return over the same authored route, checking each map transition.
  await walk(18, 0); await map('r04_salita_petali');
  await walk(30, 0); await map('petalora');
  await walk(37, 12); await map('r05_viadotto_ciliegi');
  await walk(45, 6); await map('vetracielo');
  await walk(39, 25); await map('r06_anello_magnetico');
  await walk(39, 25); await map('ferraluce');
  await walk(39, 21); await map('r08_costa_turbine');
  await walk(39, 11); await map('portolume');
  await interact(8, 14);
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await settle();
  const returned = (await state()).save;
  expect(returned.flags).toContain('q_radicelmo_greenhouse_complete');
  expect(returned.party.map(member => member.instanceId)).toEqual(partyIds);
  expect(returned.badges).toEqual(badges);
  await record('Portolume reached after greenhouse preparation');
  await exportCheckpoint('natural-greenhouse-portolume-backup.json');
}
