import { buyFromShop } from './helpers/shop';
import { expect, test, type Page } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection, walkTo } from './helpers/world-navigation';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };

test.use({ hasTouch: true, deviceScaleFactor: 2 });
const confirm = (page: Page) => page.getByRole('button', { name: 'Conferma e interagisci', exact: true });

async function seedRadicelmo(page: Page, greenhouseComplete: boolean, corolla = false) {
  await page.addInitScript(() => localStorage.setItem('veloria-animation-quality', 'reduced'));
  await page.goto('/');
  await enterGame(page);
  const save = await readBrowserSave(page);
  const eevee = createBattleCreature({ species: species.species as any, moves: moves.moves as any,
    speciesId: 133, level: 20, instanceId: 'stone-world-eevee', moveIds: ['tackle', 'quick-attack'] });
  save.party = [{ instanceId: eevee.instanceId, speciesId: 133, level: 20, experience: 100,
    hp: eevee.hp - 5, maxHp: eevee.stats.maxHp, moves: eevee.moves.map(slot => ({ id: slot.moveId, pp: slot.pp - 1 })) }];
  save.player = { ...save.player, mapId: 'veloria/radicelmo', spawnPointId: 'from_r03', x: 26, y: 15, money: 15000 };
  save.flags = ['q_starter_selected', 'prologue_complete_seen', 'badge_aurora_awarded',
    'q_radicelmo_seed_found', 'q_radicelmo_seed_archived',
    ...(greenhouseComplete ? ['q_radicelmo_greenhouse_complete'] : []), ...(corolla ? ['badge_corolla_awarded'] : [])];
  save.badges = ['badge_aurora', ...(corolla ? ['badge_corolla'] : [])];
  save.inventory = {};
  await seedBrowserSave(page, save);
  await page.reload();
  await enterGame(page);
  await expect(page.locator('#game-loading')).toBeHidden();
  return save;
}

async function interactNorth(page: Page) {
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await confirm(page).tap();
}

test('greenhouse discovery grants its first Fire Stone once, only after the research, and survives reload', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await seedRadicelmo(page, false);
  await interactNorth(page);
  await expect(page.locator('#toast')).toContainText('Completa acqua, luce e germoglio');
  expect((await readBrowserSave(page)).inventory['fire-stone'] ?? 0).toBe(0);

  // Set up the explicitly completed research; collection itself remains a real interaction.
  const eligible = await readBrowserSave(page);
  eligible.flags.push('q_radicelmo_greenhouse_complete');
  // The first north tap steps onto this walkable pickup (26,14). Reset only
  // fixture setup to its southern approach before repeating the real action.
  eligible.player = { ...eligible.player, x: 26, y: 15 };
  await seedBrowserSave(page, eligible);
  await page.reload();
  await enterGame(page);
  await interactNorth(page);
  await expect.poll(async () => (await readBrowserSave(page)).inventory['fire-stone']).toBe(1);
  expect((await readBrowserSave(page)).flags).toContain('q_radicelmo_fire_stone_found');
  await page.reload();
  await enterGame(page);
  expect((await readBrowserSave(page)).inventory['fire-stone']).toBe(1);
  await interactNorth(page);
  expect((await readBrowserSave(page)).inventory['fire-stone']).toBe(1);
  expect((await readBrowserSave(page)).flags.filter(flag => flag === 'q_radicelmo_fire_stone_found')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('Corolla unlocks the stone shop, purchases persist and bag evolution saves consumption with its receipt before the ceremony', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await seedRadicelmo(page, true);
  // Walk around the still-uncollected stone; the generic route helper plans only authored collision.
  await walkDirection(page, 'right');
  await walkTo(page, 'radicelmo.tmj', 28, 12);
  await interactNorth(page);
  await expect(page.locator('#toast')).toContainText('Medaglia Corolla');
  await expect(page.getByRole('button', { name: /Pietrafocaia · 3000/ })).toHaveCount(0);

  const eligible = await readBrowserSave(page);
  eligible.flags.push('badge_corolla_awarded');
  eligible.badges.push('badge_corolla');
  await seedBrowserSave(page, eligible);
  await page.reload();
  await enterGame(page);
  for (const [id, name, balance] of [['fire-stone', 'Pietrafocaia', 12000], ['water-stone', 'Pietraidrica', 9000], ['thunder-stone', 'Pietratuono', 6000]] as const) {
    await interactNorth(page);
    await buyFromShop(page, name);
    await expect.poll(async () => (await readBrowserSave(page)).inventory[id]).toBe(1);
    expect((await readBrowserSave(page)).player.money).toBe(balance);
  }
  await page.reload();
  await enterGame(page);
  const before = await readBrowserSave(page);
  expect(before.inventory).toMatchObject({ 'fire-stone': 1, 'water-stone': 1, 'thunder-stone': 1 });

  const openStone = async () => {
    await page.getByRole('button', { name: /^Apri zaino e dotazioni:/ }).tap();
    await page.getByRole('dialog', { name: 'Zaino e dotazioni' }).getByRole('button', { name: 'Usa Pietrafocaia', exact: true }).tap();
    const chooser = page.getByRole('dialog', { name: 'Pietrafocaia', exact: true });
    await chooser.getByRole('button', { name: /Eevee/ }).tap();
    await expect(chooser).toContainText('Flareon');
    await expect(chooser).toContainText('Mosse che conserva');
    await expect(chooser).toContainText('Livello 20');
    return chooser;
  };
  let chooser = await openStone();
  await chooser.getByRole('button', { name: 'Indietro', exact: true }).tap();
  await chooser.getByRole('button', { name: 'Annulla', exact: true }).tap();
  const cancelled = await readBrowserSave(page);
  expect(cancelled.party).toEqual(before.party);
  expect(cancelled.inventory).toEqual(before.inventory);

  chooser = await openStone();
  await chooser.getByRole('button', { name: 'Evolvi in Flareon', exact: true }).tap();
  const ceremony = page.getByRole('dialog', { name: 'Ora è Flareon!' });
  await expect(ceremony).toBeVisible();
  const committed = await readBrowserSave(page);
  expect(committed.inventory['fire-stone']).toBe(0);
  expect(committed.party[0].speciesId).toBe(136);
  expect(committed.flags).toContain('presentation/evolution/stone-world-eevee/133/136/20');
  for (const key of ['instanceId', 'level', 'experience', 'moves'] as const) expect(committed.party[0][key]).toEqual(before.party[0][key]);
  expect(committed.party[0].maxHp - committed.party[0].hp).toBe(5);
  await page.screenshot({ path: testInfo.outputPath('world-stone-evolution.png') });
  // Reload the durable receipt before dismissing it: presentation resumes without a second cost.
  await page.reload();
  await enterGame(page);
  await expect(ceremony).toBeVisible();
  await ceremony.getByRole('button', { name: 'Continua', exact: true }).tap();
  await expect.poll(async () => (await readBrowserSave(page)).flags.some(flag => flag.startsWith('presentation/evolution/'))).toBe(false);
  const after = await readBrowserSave(page);
  expect(after.player.money).toBe(6000);
  expect(after.inventory).toMatchObject({ 'fire-stone': 0, 'water-stone': 1, 'thunder-stone': 1 });
  expect(after.party[0].speciesId).toBe(136);
  expect(errors).toEqual([]);
});


test('a pending evolution on reload completes before the championship presentation', async ({ page }) => {
  await seedRadicelmo(page, true, true);
  const save = await readBrowserSave(page);
  save.party[0].speciesId = 136;
  save.flags.push('q_league_completed', 'presentation/evolution/stone-world-eevee/133/136/20');
  await seedBrowserSave(page, save);
  await page.reload(); await enterGame(page);
  const evolution = page.getByRole('dialog', { name: 'Ora è Flareon!' });
  await expect(evolution).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Campione di Veloria!' })).toHaveCount(0);
  await evolution.getByRole('button', { name: 'Continua', exact: true }).tap();
  await expect(page.getByRole('dialog', { name: 'Campione di Veloria!' })).toBeVisible();
  expect((await readBrowserSave(page)).flags.some(flag => flag.startsWith('presentation/evolution/'))).toBe(false);
});

for (const [parentId, targetId, parentName, targetName, stoneId, stoneName, width, height] of [
  [44, 45, 'Gloom', 'Vileplume', 'leaf-stone', 'Pietrafoglia', 390, 844],
  [30, 31, 'Nidorina', 'Nidoqueen', 'moon-stone', 'Pietralunare', 844, 390],
  [70, 71, 'Weepinbell', 'Victreebel', 'leaf-stone', 'Pietrafoglia', 390, 844],
] as const) {
  test(`botanical stone purchase and ${targetName} evolution persist through the real bag and reload`, async ({ page }, info) => {
    test.setTimeout(120_000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await seedRadicelmo(page, true, true);
    const fixture = await readBrowserSave(page);
    const maxHp = createBattleCreature({ species: species.species as any, moves: moves.moves as any, speciesId: parentId, level: 21,
      instanceId: `botanical-${targetId}` }).stats.maxHp;
    fixture.party = [{ instanceId: `botanical-${targetId}`, speciesId: parentId, level: 21, experience: 117, hp: maxHp - 5, maxHp,
      moves: [{ id: parentId === 44 ? 'acid' : parentId === 30 ? 'poison-sting' : 'vine-whip', pp: 3 }, { id: parentId === 30 ? 'double-kick' : 'sleep-powder', pp: 4 }] }];
    await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
    await walkTo(page, 'radicelmo.tmj', 26, 14); await walkTo(page, 'radicelmo.tmj', 28, 12); await interactNorth(page);
    await buyFromShop(page, stoneName);
    const before = await readBrowserSave(page);
    expect(before.player.money).toBe(12000); expect(before.inventory[stoneId]).toBe(1);
    const open = async () => {
      await page.getByRole('button', { name: /^Apri zaino e dotazioni:/ }).tap();
      await page.getByRole('dialog', { name: 'Zaino e dotazioni' }).getByRole('button', { name: `Usa ${stoneName}`, exact: true }).tap();
      const chooser = page.getByRole('dialog', { name: stoneName, exact: true });
      await chooser.getByRole('button', { name: new RegExp(parentName) }).tap();
      await expect(chooser).toContainText(targetName); return chooser;
    };
    let chooser = await open();
    await chooser.getByRole('button', { name: 'Indietro', exact: true }).tap();
    await chooser.getByRole('button', { name: 'Annulla', exact: true }).tap();
    const cancelled = await readBrowserSave(page);
    expect(cancelled.party).toEqual(before.party); expect(cancelled.inventory).toEqual(before.inventory);
    chooser = await open();
    await chooser.getByRole('button', { name: `Evolvi in ${targetName}`, exact: true }).tap();
    const ceremony = page.getByRole('dialog', { name: `Ora è ${targetName}!`, exact: true });
    await expect(ceremony).toBeVisible();
    const committed = await readBrowserSave(page);
    expect(committed.party[0].speciesId).toBe(targetId); expect(committed.inventory[stoneId]).toBe(0);
    for (const key of ['instanceId', 'level', 'experience', 'moves'] as const) expect(committed.party[0][key]).toEqual(before.party[0][key]);
    expect(committed.party[0].maxHp - committed.party[0].hp).toBe(5);
    expect(await page.locator('.evolution-celebration__after').evaluate(async node => {
      const url = (node as HTMLElement).style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      if (!url || node.classList.contains('creature-portrait-pending')) return false;
      const image = new Image(); image.src = url; await image.decode(); return image.naturalWidth > 0;
    })).toBe(true);
    await page.screenshot({ path: info.outputPath(`${targetName.toLowerCase()}-ceremony.png`) });
    await page.reload(); await enterGame(page); await expect(ceremony).toBeVisible();
    await ceremony.getByRole('button', { name: 'Continua', exact: true }).tap();
    await expect.poll(async () => (await readBrowserSave(page)).flags.some(flag => flag.startsWith('presentation/evolution/'))).toBe(false);
    const after = await readBrowserSave(page);
    expect(after.party[0].speciesId).toBe(targetId); expect(after.inventory[stoneId]).toBe(0);
    expect(after.flags).toContain(`pokedex_caught_${parentId}`); expect(after.flags).toContain(`pokedex_caught_${targetId}`);
    expect(after.player.money).toBe(12000); expect(errors).toEqual([]);
  });
}
