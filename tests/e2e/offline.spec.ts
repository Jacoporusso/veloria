import { battleCommandLayout, battleMoveGrid } from '../../src/game/battle/battle-command-layout';
import leagueSequence from '../../content/challenges/veloria_league.sequence.json' with {type:'json'};
import { expect, test } from '@playwright/test';
import { buyFromShop } from './helpers/shop';
import { readFile, readdir } from 'node:fs/promises';
import { enterGame } from './helpers/enter-game';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import speciesRegistry from '../../content/battle/species.v1.json' with { type: 'json' };
import moveRegistry from '../../content/battle/moves.v1.json' with { type: 'json' };
import { seedBrowserSave, walkDirection, walkTo as planWalkTo } from './helpers/world-navigation';
import { prepareMonorailTraveler, stationArrival, travelResources } from './helpers/monorail';
import { readBrowserSave } from './helpers/world-navigation';
import magneticRouter from '../../content/puzzles/gym04_magnetic.v1.json' with { type: 'json' };
import reflectionRouter from '../../content/puzzles/gym06_reflections.v1.json' with { type: 'json' };
import { rollEncounterCheck } from '../../src/core/encounters/roll-encounter-check';
import { selectWildEncounter } from '../../src/core/encounters/select-encounter.ts';
import { exportSave } from '../../src/persistence/save-backup.ts';
import { newGameSave } from '../../src/persistence/save-store.ts';
import { walkIceTo } from './helpers/ice-navigation';
import d01Woodland from '../../content/encounters/d01_woodland.encounter.json' with { type: 'json' };

// Keep the offline journey independent of decorative animation throughput on CI.
const walkTo = (page: import('@playwright/test').Page, file: string, x: number, y: number) => planWalkTo(page, file, x, y, { avoidEncounters: true });

/** Check the artwork the current maps actually use, rather than historical URL naming. */
async function illustratedMapPaths(stems: readonly string[]): Promise<string[]> {
  const manifest = JSON.parse(await readFile('assets/map-parity-v2.json', 'utf8'));
  return Promise.all(stems.map(async stem => {
    const metadata = JSON.parse(await readFile(`content/maps/${stem}.map.json`, 'utf8'));
    const artwork = manifest.artworks.find((entry: any) => entry.mapId === metadata.id);
    expect(artwork, `Illustrated artwork for ${metadata.id}`).toBeTruthy();
    const asset = metadata.renderAssets.find((entry: any) => entry.key === artwork.assetKey);
    expect(asset?.path, metadata.id).toBe(artwork.runtimePath.replace(/^public\//, ''));
    return asset.path;
  }));
}

test.use({ reducedMotion: 'reduce' });

test('Biancavetta illustrated ice gym completes three forced-slide lanes and opens its gate on a first offline visit', async ({ page, context }, info) => {
  test.setTimeout(process.env.CI ? 240_000 : 120_000);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('gym07_biancavetta-illustrated-v3.webp')))).toBe(false);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'badge_riflesso_awarded', 'q_passobrina_report'])];
  save.player = { ...save.player, mapId: 'veloria/gym07_biancavetta', spawnPointId: 'from_city', x: 15, y: 22 };
  await seedBrowserSave(page, save);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  expect(await page.evaluate(async () => {
    const image = new Image(); image.src = '/assets/scenery/veloria-gym07_biancavetta-illustrated-v3.webp';
    await image.decode(); return [image.naturalWidth, image.naturalHeight];
  })).toEqual([1448, 1086]);
  for (const [x, flag] of [[24, 'gym07_ice_east'], [8, 'gym07_ice_west'], [16, 'gym07_ice_center']] as const) {
    await walkIceTo(page, 'gym07_biancavetta.tmj', x, 3);
    await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(flag);
    if (x === 8) { await page.reload(); await enterGame(page); }
  }
  expect((await readBrowserSave(page)).flags).not.toContain('gym07_ice_complete');
  await walkIceTo(page, 'gym07_biancavetta.tmj', 17, 3);
  await page.getByRole('button', { name: 'Vai a destra', exact: true }).tap();
  const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  await action.tap();
  for (let i = 0; i < 24 && await page.locator('#dialogue-box').isVisible(); i++) await action.tap();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('gym07_ice_complete');
  await walkIceTo(page, 'gym07_biancavetta.tmj', 16, 2);
  await page.screenshot({ path: info.outputPath('biancavetta-gate-offline.png') });
  await page.reload(); await enterGame(page);
  await walkIceTo(page, 'gym07_biancavetta.tmj', 15, 22);
  await walkDirection(page, 'down');
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');
  expect(failures).toEqual([]);
});

test('Acquariva illustrated reflection gym aligns on its first offline visit and returns after reload', async ({ page, context }, info) => {
  test.setTimeout(process.env.CI ? 240_000 : 120_000);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('gym06_acquariva-illustrated-v3.webp')))).toBe(false);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'q_delta_report', 'q_acquariva_visited', 'q_acquariva_report'])];
  save.player = { ...save.player, mapId: 'veloria/gym06_acquariva', spawnPointId: 'from_city', x: 15, y: 22 };
  await seedBrowserSave(page, save);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  expect(await page.evaluate(async () => {
    const image = new Image(); image.src = '/assets/scenery/veloria-gym06_acquariva-illustrated-v3.webp';
    await image.decode(); return [image.naturalWidth, image.naturalHeight];
  })).toEqual([1448, 1086]);
  for (const [index, id] of ['fourth', 'second', 'first', 'third'].entries()) {
    const node = reflectionRouter.nodes.find(node => node.id === id)!;
    await walkTo(page, 'gym06_acquariva.tmj', node.x, node.y + 1);
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
    const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
    await action.tap(); await page.getByRole('button', { name: 'RUOTA', exact: true }).tap();
    if (index < 3) await page.getByRole('button', { name: 'CHIUDI', exact: true }).tap();
    else for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await action.tap();
    await expect(page.locator('#dialogue-box')).toBeHidden();
    if (index === 0) { await page.reload(); await enterGame(page); }
  }
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(reflectionRouter.solvedFlag);
  await page.screenshot({ path: info.outputPath('acquariva-reflections-offline.png') });
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain(reflectionRouter.solvedFlag);
  await walkTo(page, 'gym06_acquariva.tmj', 15, 23);
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  expect(failures).toEqual([]);
});

test('Portolume illustrated gym opens both sluices on its first offline visit and returns after reload', async ({ page, context }, info) => {
  test.setTimeout(process.env.CI ? 240_000 : 120_000);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('gym05_portolume-illustrated-v3.webp')))).toBe(false);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'q_centrale_report', 'q_portolume_visited', 'q_portolume_orientation', 'q_portolume_tide_read', 'q_portolume_tide_report'])];
  save.player = { ...save.player, mapId: 'veloria/gym05_portolume', spawnPointId: 'from_portolume', x: 15, y: 22 };
  await seedBrowserSave(page, save);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  expect(await page.evaluate(async () => {
    const image = new Image(); image.src = '/assets/scenery/veloria-gym05_portolume-illustrated-v3.webp';
    await image.decode(); return [image.naturalWidth, image.naturalHeight];
  })).toEqual([1448, 1086]);
  for (const [x, y, flag] of [[8,17,'gym05_basin_balanced'], [24,10,'gym05_sluice_open'], [8,4,'gym05_tide_stable']] as const) {
    await walkTo(page, 'gym05_portolume.tmj', x, y + 1);
    await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
    for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
    await expect(page.locator('#dialogue-box')).toBeHidden();
    await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(flag);
  }
  await page.screenshot({ path: info.outputPath('portolume-sluices-offline.png') });
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toEqual(expect.arrayContaining(['gym05_basin_balanced', 'gym05_sluice_open', 'gym05_tide_stable']));
  await walkTo(page, 'gym05_portolume.tmj', 15, 23);
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/portolume');
  expect(failures).toEqual([]);
});

test('R15 first offline visit keeps the Moltres clearing and light readings interactive', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 1, level: 8, instanceId: 'offline-r15' });
  save.party = [{ instanceId: creature.instanceId, speciesId: 1, level: 8, experience: 0, hp: creature.hp,
    maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', 'q_d05_report', 'q_league_completed', 'q_league_epilogue_seen'])];
  save.player = { ...save.player, mapId: 'veloria/r15_passo_due_luci', spawnPointId: 'from_cavern', x: 24, y: 16 };
  await seedBrowserSave(page, save);
  const failures: string[] = [], errors: string[] = [];
  page.on('requestfailed', request => failures.push(request.url())); page.on('pageerror', error => errors.push(error.message));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await expect(page.locator('#interaction-prompt')).toContainText('Moltres');
  const before = await readBrowserSave(page);
  const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  await action.tap(); await expect(page.getByRole('button', { name: 'INCONTRA', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('r15-moltres-offline.png') });
  await page.getByRole('button', { name: 'MI PREPARO', exact: true }).tap();
  expect((await readBrowserSave(page)).rngState).toBe(before.rngState);
  await walkTo(page, 'r15_passo_due_luci.tmj', 29, 19);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await action.tap();
  for (let i = 0; i < 20 && await page.locator('#dialogue-box').isVisible(); i++) await action.tap();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  expect((await readBrowserSave(page)).flags).toContain('q_r15_network_read');
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain('q_r15_network_read');
  expect((await readBrowserSave(page)).flags).not.toContain('q_special_moltres_caught');
  expect(failures).toEqual([]); expect(errors).toEqual([]);
});

for (const npc of [
  { name: 'Tecnica della Centrale', speaker: 'Tecnica della Centrale', profile: 'centrale-technician', map: 'd03_centrale_risonante', spawn: 'from_r07', x: 12, y: 17, flags: ['q_r07_measurement'], start: { x: 12, y: 18 }, coldStart: false },
  {"name": "Teo", "speaker": "Teo", "profile": "delta-naturalist-teo", "map": "d04_delta_specchi", "spawn": "from_r09", "x": 24, "y": 6, "flags": ["trainer_delta_teo_defeated"], "start": {"x": 24, "y": 7}, "coldStart": false, "blockedApproach": {"x": 24, "y": 5}, "approaches": [{"x": 24, "y": 7, "label": "Vai in alto", "pose": "down"}, {"x": 23, "y": 6, "label": "Vai a destra", "pose": "left"}, {"x": 25, "y": 6, "label": "Vai a sinistra", "pose": "right"}]},
  {"name": "Celia", "speaker": "Celia", "profile": "route-trainer-celia-r11", "map": "r11_via_cascate", "spawn": "from_acquariva", "x": 15, "y": 17, "flags": ["trainer_r11_celia_defeated"], "start": {"x": 15, "y": 18}, "coldStart": false, "blockedApproach": {"x": 16, "y": 17}, "approaches": [{"x": 15, "y": 18, "label": "Vai in alto", "pose": "down"}, {"x": 14, "y": 17, "label": "Vai a destra", "pose": "left"}, {"x": 15, "y": 16, "label": "Vai in basso", "pose": "up"}]},
  {"name": "Ruben", "speaker": "Ruben", "profile": "route-trainer-ruben-r12", "map": "r12_valle_vento", "spawn": "from_acquariva", "x": 24, "y": 7, "flags": ["trainer_r12_ruben_defeated"], "start": {"x": 24, "y": 8}, "coldStart": false},
  {"name": "Alma", "speaker": "Alma", "profile": "route-trainer-alma-r13", "map": "r13_tornanti_bianchi", "spawn": "from_passobrina", "x": 25, "y": 13, "flags": ["trainer_r13_alma_defeated"], "start": {"x": 25, "y": 14}, "coldStart": false, "blockedApproach": {"x": 25, "y": 12}, "approaches": [{"x": 25, "y": 14, "label": "Vai in alto", "pose": "down"}, {"x": 24, "y": 13, "label": "Vai a destra", "pose": "left"}, {"x": 26, "y": 13, "label": "Vai a sinistra", "pose": "right"}]},
  { name: 'Lina', speaker: 'Lina', profile: 'route-trainer-lina-r09', map: 'r09_dune_salmastre', spawn: 'from_portolume', x: 18, y: 8, flags: ['trainer_r09_lina_defeated'], start: { x: 18, y: 9 }, coldStart: false, blockedApproach: { x: 18, y: 7 }, approaches: [{ x: 18, y: 9, label: 'Vai in alto', pose: 'down' }, { x: 17, y: 8, label: 'Vai a destra', pose: 'left' }, { x: 19, y: 8, label: 'Vai a sinistra', pose: 'right' }] },
  { name: 'Noemi', speaker: 'Noemi', profile: 'route-trainer-noemi-r09', map: 'r09_dune_salmastre', spawn: 'from_portolume', x: 28, y: 9, flags: ['trainer_r09_noemi_defeated'], start: { x: 28, y: 10 }, coldStart: false },
  { name: 'Maya', speaker: 'Maya', profile: 'route-trainer-maya-r10', map: 'r10_sentiero_canne', spawn: 'from_delta', x: 20, y: 8, flags: ['trainer_r10_maya_defeated'], start: { x: 20, y: 9 }, coldStart: false, blockedApproach: { x: 19, y: 8 }, approaches: [{ x: 20, y: 9, label: 'Vai in alto', pose: 'down' }, { x: 20, y: 7, label: 'Vai in basso', pose: 'up' }, { x: 21, y: 8, label: 'Vai a sinistra', pose: 'right' }] },
  { name: 'Bruno', speaker: 'Bruno', profile: 'route-trainer-bruno-r10', map: 'r10_sentiero_canne', spawn: 'from_delta', x: 16, y: 13, flags: ['trainer_r10_bruno_defeated'], start: { x: 16, y: 14 }, coldStart: false, blockedApproach: { x: 16, y: 12 }, approaches: [{ x: 16, y: 14, label: 'Vai in alto', pose: 'down' }, { x: 15, y: 13, label: 'Vai a destra', pose: 'left' }, { x: 17, y: 13, label: 'Vai a sinistra', pose: 'right' }] },
  { name: 'Iris Delta', speaker: 'Iris', profile: 'delta-biologist-iris', map: 'd04_delta_specchi', spawn: 'from_r09', x: 13, y: 18, flags: [], start: { x: 12, y: 18 }, blockedApproach: { x: 13, y: 19 }, approaches: [{ x: 12, y: 18, label: 'Vai a destra', pose: 'left' }, { x: 13, y: 17, label: 'Vai in basso', pose: 'up' }, { x: 14, y: 18, label: 'Vai a sinistra', pose: 'right' }], coldStart: false },
  { name: 'Viola', speaker: 'Viola', profile: 'route-trainer-viola-r08', map: 'r08_costa_turbine', spawn: 'from_portolume', x: 20, y: 11, flags: ['trainer_r08_viola_defeated'], start: { x: 20, y: 12 }, coldStart: false },
  { name: 'Marina', speaker: 'Capitana Marina', profile: 'portolume-captain-marina', map: 'portolume', spawn: 'from_r08', x: 22, y: 15, flags: [], start: { x: 22, y: 16 }, blockedApproach: { x: 23, y: 15 }, approaches: [{ x: 22, y: 16, label: 'Vai in alto', pose: 'down' }, { x: 21, y: 15, label: 'Vai a destra', pose: 'left' }, { x: 22, y: 14, label: 'Vai in basso', pose: 'up' }], coldStart: false },
  { name: 'Tessa', speaker: 'Tessa', profile: 'acquariva-tessa', map: 'acquariva', spawn: 'from_r10', x: 34, y: 14, flags: [], start: { x: 34, y: 15 }, coldStart: false },
  { name: 'Dario', speaker: 'Dario', profile: 'route-trainer-dario', map: 'r07_condotto_risonante', spawn: 'from_ferraluce', x: 18, y: 18, flags: ['trainer_r07_dario_defeated'], start: { x: 18, y: 19 }, coldStart: false },
  { name: 'Ivo Ferraluce', speaker: 'Ivo', profile: 'ferraluce-ivo', map: 'ferraluce', spawn: 'from_r06', x: 20, y: 20, flags: ['q_r06_measurement', 'q_ferraluce_report', 'q_centrale_output', 'q_centrale_report'], start: { x: 20, y: 21 }, coldStart: false },
  { name: 'Centro Ferraluce', speaker: 'Addetta del Centro', profile: 'ferraluce-care', map: 'ferraluce', spawn: 'from_r06', x: 9, y: 21, flags: [], start: { x: 9, y: 22 }, coldStart: false, service: 'center' },
  { name: 'Mercante Ferraluce', speaker: 'Mercante di Ferraluce', profile: 'ferraluce-shop', map: 'ferraluce', spawn: 'from_r06', x: 30, y: 21, flags: [], start: { x: 30, y: 22 }, coldStart: false, service: 'shop' },
  { name: 'Nila', speaker: 'Nila', profile: 'route-trainer-nila', map: 'r04_salita_petali', spawn: 'from_radicelmo', x: 10, y: 16, flags: ['trainer_r04_nila_defeated'], start: { x: 10, y: 17 }, coldStart: false },
  { name: 'Oren', speaker: 'Oren', profile: 'route-trainer-oren', map: 'r05_viadotto_ciliegi', spawn: 'from_petalora', x: 18, y: 12, flags: ['trainer_r05_oren_defeated'], start: { x: 18, y: 13 }, coldStart: false },
  { name: 'Iris R06', speaker: 'Iris', profile: 'route-trainer-iris-r06', map: 'r06_anello_magnetico', spawn: 'from_vetracielo', x: 21, y: 16, flags: ['trainer_r06_iris_defeated', 'q_r06_iris_helped'], start: { x: 21, y: 17 }, coldStart: false },
  { name: 'Rami', speaker: 'Rami', profile: 'guide-rami-r03', map: 'r03_terrazze_muschio', spawn: 'from_brumalta', x: 6, y: 16,
    start: { x: 6, y: 17 }, flags: [], coldStart: false },
  { name: 'Leda', speaker: 'Custode Leda', profile: 'radicelmo-keeper-leda', map: 'radicelmo', spawn: 'from_r03', x: 25, y: 11,
    start: { x: 25, y: 12 }, flags: ['q_radicelmo_seed_found', 'q_radicelmo_seed_archived', 'q_radicelmo_greenhouse_started', 'q_radicelmo_seed_sprouted', 'q_radicelmo_greenhouse_complete', 'q_radicelmo_fire_stone_found'], coldStart: false },
  { name: 'Lea', speaker: 'Lea', profile: 'vetracielo-lea', map: 'vetracielo', spawn: 'from_r05', x: 22, y: 18,
    start: { x: 22, y: 19 }, flags: ['q_vetracielo_orientation'], coldStart: false },
  { name: 'Timo', speaker: 'Timo', profile: 'route-trainer-timo', map: 'r01_sentiero_alba', spawn: 'from_borgofonte', x: 18, y: 12,
    start: { x: 18, y: 13 }, flags: ['trainer_route01_timo_defeated'], coldStart: false },
  { name: 'Sera', speaker: 'Sera', profile: 'route-trainer-sera', map: 'r01_sentiero_alba', spawn: 'from_borgofonte', x: 7, y: 9,
    start: { x: 7, y: 10 }, flags: ['trainer_route01_sera_defeated'], coldStart: false },
  { name: 'Ada', speaker: 'Ada', profile: 'ranger-ada', map: 'd01_bosco_veli', spawn: 'from_r01', x: 13, y: 10,
    start: { x: 1, y: 10 }, flags: [], coldStart: false },
  { name: 'Elia', speaker: 'Professoressa Elia', profile: 'professor-elia', map: 'borgofonte_lab', spawn: 'from_village', x: 12, y: 7,
    start: { x: 12, y: 8 }, flags: ['q_research_sample_received'], coldStart: false },
  { name: 'Nilo', speaker: 'Nilo', profile: 'rival-nilo', map: 'borgofonte', spawn: 'start', x: 26, y: 17,
    start: { x: 26, y: 18 }, flags: [], coldStart: true },
  { name: 'Mira', speaker: 'Mira', profile: 'gym-leader-mira', map: 'gym01_brumalta', spawn: 'from_city', x: 14, y: 2,
    start: { x: 14, y: 3 }, flags: ['gym01_puzzle_solved', 'trainer_gym01_mira_defeated'], coldStart: false },
  { name: 'Dalia', speaker: 'Dalia', profile: 'gym-leader-dalia', map: 'gym02_petalora', spawn: 'from_city', x: 13, y: 3,
    start: { x: 13, y: 4 }, flags: [], coldStart: false },
  { name: 'Aster', speaker: 'Aster', profile: 'gym-leader-aster', map: 'gym03_vetracielo', spawn: 'from_city', x: 15, y: 10,
    start: { x: 15, y: 28 }, flags: ['gym03_lines_connected', 'trainer_gym03_aster_defeated'], coldStart: false },
  { name: 'Rhea', speaker: 'Rhea', profile: 'gym-leader-rhea', map: 'gym04_ferraluce', spawn: 'from_city', x: 15, y: 10,
    start: { x: 15, y: 22 }, flags: ['gym04_magnetic_aligned', 'trainer_gym04_rhea_defeated', 'badge_acciaio_awarded'], coldStart: false },
  { name: 'Nerea', speaker: 'Nerea', profile: 'gym-leader-nerea-portolume', map: 'gym05_portolume', spawn: 'from_portolume', x: 16, y: 3,
    start: { x: 15, y: 22 }, flags: ['q_portolume_tide_report', 'gym05_basin_balanced', 'gym05_sluice_open', 'gym05_tide_stable', 'trainer_gym05_nerea_defeated', 'badge_marea_awarded'], coldStart: false,
    approaches: [
      { x: 16, y: 4, label: 'Vai in alto', pose: 'down' },
      { x: 15, y: 3, label: 'Vai a destra', pose: 'left' },
      { x: 17, y: 3, label: 'Vai a sinistra', pose: 'right' },
    ], blockedApproach: { x: 16, y: 2 } },
  { name: 'Selene', speaker: 'Selene', profile: 'gym-leader-selene', map: 'gym06_acquariva', spawn: 'from_city', x: 16, y: 2,
    start: { x: 15, y: 22 },
    flags: ['q_acquariva_report', 'gym06_reflections_aligned', 'trainer_gym06_selene_defeated', 'badge_riflesso_awarded'], coldStart: false,
    approaches: [
      { x: 16, y: 3, label: 'Vai in alto', pose: 'down' },
      { x: 15, y: 2, label: 'Vai a destra', pose: 'left' },
      { x: 17, y: 2, label: 'Vai a sinistra', pose: 'right' },
    ], blockedApproach: { x: 16, y: 1 } },
  { name: 'Nives', speaker: 'Nives', profile: 'gym-leader-nives', map: 'gym07_biancavetta', spawn: 'from_city', x: 16, y: 1,
    start: { x: 15, y: 22 }, navigation: 'ice',
    flags: ['gym07_ice_complete', 'trainer_gym07_nives_defeated', 'badge_ghiaccio_awarded'], coldStart: false,
    approaches: [
      { x: 16, y: 2, label: 'Vai in alto', pose: 'down' },
      { x: 15, y: 1, label: 'Vai a destra', pose: 'left' },
      { x: 17, y: 1, label: 'Vai a sinistra', pose: 'right' },
    ], blockedApproach: { x: 16, y: 0 } },
  { name: 'Aurel', speaker: 'Aurel', profile: 'gym-leader-aurel', map: 'gym08_concordia', spawn: 'from_city', x: 16, y: 2,
    start: { x: 15, y: 22 },
    flags: ['gym08_convergence_complete', 'trainer_gym08_aurel_defeated', 'badge_drago_awarded'], coldStart: false },
]) test(`${npc.name} directional idle images load offline and configured approaches remain interactive`, async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const catalog = JSON.parse(await readFile(new URL('../../content/characters/appearances.v2.json', import.meta.url), 'utf8'));
  const poseManifest = JSON.parse(await readFile(new URL('../../assets/npc-idle-views-v1.json', import.meta.url), 'utf8'));
  const walkManifest = JSON.parse(await readFile(new URL('../../assets/npc-walk-cycles-v1.json', import.meta.url), 'utf8'));
  const profile = catalog.profiles.find((entry: any) => entry.id === npc.profile);
  const manifestProfile = poseManifest.profiles.find((entry: any) => entry.profileId === npc.profile);
  expect(manifestProfile, `Pose manifest for ${npc.profile}`).toBeTruthy();
  const idleViews = Object.values(profile.idleViews) as any[];
  const paths = idleViews.map((view: any) => {
    const asset = catalog.assets.find((entry: any) => entry.key === view.assetKey);
    const manifestView = manifestProfile.views.find((entry: any) => entry.assetKey === view.assetKey);
    expect(asset?.path, `Catalog path for ${view.assetKey}`).toBeTruthy();
    expect(manifestView, `Manifest dimensions for ${view.assetKey}`).toBeTruthy();
    expect(asset.path).toBe(manifestView.runtimePath.replace(/^public\//, ''));
    return asset.path;
  });
  const expectedIdleDimensions = idleViews.map((view: any) => {
    const manifestView = manifestProfile.views.find((entry: any) => entry.assetKey === view.assetKey);
    return [manifestView.width, manifestView.height];
  });
  expect(paths).toHaveLength(4);
  const walkViews = profile.walkCycle ? Object.values(profile.walkCycle.views).flatMap((frames: any) => frames) : [];
  const manifestWalkProfile = walkManifest.profiles.find((entry: any) => entry.profileId === npc.profile);
  if (walkViews.length) expect(manifestWalkProfile, `Walk manifest for ${npc.profile}`).toBeTruthy();
  const walkPaths = walkViews.map((view: any) => {
    const asset = catalog.assets.find((entry: any) => entry.key === view.assetKey);
    const manifestFrame = manifestWalkProfile?.frames.find((entry: any) => entry.assetKey === view.assetKey);
    expect(asset?.path, `Catalog path for ${view.assetKey}`).toBeTruthy();
    expect(manifestFrame, `Manifest dimensions for ${view.assetKey}`).toBeTruthy();
    expect(asset.path).toBe(manifestFrame.runtimePath.replace(/^public\//, ''));
    return asset.path;
  });
  const expectedWalkDimensions = walkViews.map((view: any) => {
    const manifestFrame = manifestWalkProfile.frames.find((entry: any) => entry.assetKey === view.assetKey);
    return [manifestFrame.width, manifestFrame.height];
  });
  if (npc.profile === 'ranger-ada') expect(walkPaths).toHaveLength(8);
  const allPaths = [...paths, ...walkPaths];
  await page.addInitScript(() => localStorage.setItem('veloria-animation-quality', 'reduced'));
  await page.goto('/');
  if (npc.coldStart) {
    // Start in the laboratory before entering any world scene: Borgofonte also
    // contains Nilo, so starting there would silently warm all four textures.
    await expect(page.getByRole('button', { name: 'Nuova partita', exact: true })).toBeVisible();
    const cold = newGameSave();
    cold.player = { ...cold.player, mapId: 'veloria/borgofonte_lab', spawnPointId: 'from_village', x: 12, y: 11 };
    cold.flags.push('q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen');
    await seedBrowserSave(page, cold); await page.reload();
  }
  await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const warmed = await page.evaluate(paths => {
    const resources = performance.getEntriesByType('resource').map(entry => entry.name);
    return paths.filter(path => resources.some(url => url.includes(`/${path}`)));
  }, allPaths);
  expect(warmed).toEqual([]);
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 1, level: 8, instanceId: `offline-${npc.name}-idles` });
  save.party = [{ instanceId: creature.instanceId, speciesId: 1, level: 8, experience: 0,
    hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen', ...npc.flags])];
  save.player = { ...save.player, mapId: `veloria/${npc.map}`, spawnPointId: npc.spawn, ...npc.start };
  await seedBrowserSave(page, save);
  const errors: string[] = [], failures: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  const decoded = await page.evaluate(async paths => Promise.all(paths.map(async path => {
    const image = new Image(); image.src = `/${path}`; await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
    if (!canvasContext) throw new Error(`No 2D canvas for ${path}`);
    canvasContext.drawImage(image, 0, 0);
    const pixels = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;
    let minAlpha = 255, minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset + 3];
      minAlpha = Math.min(minAlpha, alpha);
      if (alpha >= 128) {
        const index = offset / 4, x = index % canvas.width, y = Math.floor(index / canvas.width);
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    return { width: image.naturalWidth, height: image.naturalHeight, minAlpha,
      alpha128Bounds: maxX < 0 ? null : [minX, minY, maxX + 1, maxY + 1] };
  })), allPaths);
  expect(decoded.map(({ width, height }) => [width, height])).toEqual([...expectedIdleDimensions, ...expectedWalkDimensions]);
  for (const pose of decoded) {
    expect(pose.minAlpha, 'sprite must contain genuinely transparent pixels').toBe(0);
    expect(pose.alpha128Bounds, 'sprite must contain a visible alpha>=128 body').not.toBeNull();
  }
  const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  if ('blockedApproach' in npc) {
    const map = JSON.parse(await readFile(new URL(`../../public/tilemaps/${npc.map}.tmj`, import.meta.url), 'utf8'));
    const center = { x: npc.blockedApproach.x * 32 + 16, y: npc.blockedApproach.y * 32 + 16 };
    const blocked = map.layers.find((layer: any) => layer.name === 'collision').objects.some((object: any) =>
      object.x <= center.x && center.x < object.x + object.width && object.y <= center.y && center.y < object.y + object.height);
    expect(blocked, `approach tile (${npc.blockedApproach.x},${npc.blockedApproach.y}) remains blocked by existing map geometry`).toBe(true);
  }
  const approaches = 'approaches' in npc ? npc.approaches : [
    { x: npc.x, y: npc.y + 1, label: 'Vai in alto', pose: 'down' },
    { x: npc.x - 1, y: npc.y, label: 'Vai a destra', pose: 'left' },
    { x: npc.x, y: npc.y - 1, label: 'Vai in basso', pose: 'up' },
    { x: npc.x + 1, y: npc.y, label: 'Vai a sinistra', pose: 'right' },
  ];
  for (const stop of approaches) {
    const mapFile = `${npc.map === 'borgofonte' ? 'bg_borgofonte' : npc.map}.tmj`;
    if ('navigation' in npc && npc.navigation === 'ice') await walkIceTo(page, mapFile, stop.x, stop.y);
    else await walkTo(page, mapFile, stop.x, stop.y);
    await page.getByRole('button', { name: stop.label, exact: true }).tap();
    const before = await readBrowserSave(page);
    await action.tap();
    if ('service' in npc && npc.service === 'shop') {
      const shop = page.getByRole('dialog', { name: 'Mercante di Ferraluce', exact: true });
      await expect(shop.getByRole('spinbutton', { name: 'Quantità Pozione', exact: true })).toBeVisible();
      await shop.getByRole('button', { name: 'Chiudi', exact: true }).click();
    } else if ('service' in npc && npc.service === 'center') {
      await expect(page.getByRole('button', { name: 'RIPOSA', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'DOPO', exact: true }).click();
    } else {
      await expect(page.locator('#dialogue-speaker')).toHaveText(npc.speaker);
      for (let i = 0; i < 20 && await page.locator('#dialogue-box').isVisible(); i++) await action.tap();
    }
    await expect(page.locator('#dialogue-box')).toBeHidden();
    const after = await readBrowserSave(page);
    expect(after.player).toMatchObject({ mapId: `veloria/${npc.map}`, x: stop.x, y: stop.y });
    expect(after.rngState).toBe(before.rngState);
    if ('service' in npc) {
      expect(after.party).toEqual(before.party); expect(after.inventory).toEqual(before.inventory);
      expect(after.player.money).toBe(before.player.money); expect(after.flags).toEqual(before.flags);
    }
    await page.screenshot({ path: info.outputPath(`${npc.name}-offline-${stop.pose}.png`) });
  }
  await page.reload(); await enterGame(page);
  const lastApproach = approaches[approaches.length - 1];
  expect((await readBrowserSave(page)).player).toMatchObject({ mapId: `veloria/${npc.map}`, x: lastApproach.x, y: lastApproach.y });
  if (/^r0[4-7]_/.test(npc.map) || npc.map === 'ferraluce') {
    const retired = npc.map === 'ferraluce' ? 'veloria-ferraluce-service-npcs-v1.webp' : 'veloria-route-trainers-r04-r07-v1.webp';
    expect(await page.evaluate(retired => performance.getEntriesByType('resource').some(entry => entry.name.includes(retired)), retired)).toBe(false);
  }
  if (/^r(09|10)_/.test(npc.map)) {
    expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('veloria-r09-r10-coastal-trainers-v1.webp')))).toBe(false);
  }
  if (npc.profile === 'centrale-technician') {
    expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('veloria-centrale-technician-v1.webp')))).toBe(false);
  }
  if (npc.map === 'gym07_biancavetta' || npc.map === 'gym08_concordia') {
    expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('veloria-gym-leaders-b-v1.webp')))).toBe(false);
  }
  expect(failures).toEqual([]); expect(errors).toEqual([]);
});

test('special encounter Journal guidance opens the destination Atlas without a network or moving the player', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 1, level: 10, instanceId: 'offline-discovery-guide' });
  save.party = [{ instanceId: creature.instanceId, speciesId: 1, level: 10, experience: 0,
    hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  save.player = { ...save.player, mapId: 'veloria/acquariva', spawnPointId: 'from_r12', x: 13, y: 1 };
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'prologue_complete_seen',
    'tutorial_habitat_seen', 'q_acquariva_report', 'badge_riflesso_awarded'])];
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const before = await readBrowserSave(page);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Apri diario del viaggio' }).click();
  await page.getByRole('button', { name: 'Mostra Snorlax sulla mappa' }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas).toBeVisible();
  await expect(atlas.locator('.region-map-select')).toHaveValue('r12');
  await expect(atlas.locator('.region-map-local')).toHaveAttribute('data-map-id', 'veloria/r12_valle_vento');
  await expect(atlas.locator('.region-map-discovery-pin')).toHaveCount(1);
  const encounter = atlas.getByRole('region', { name: 'Incontro con Snorlax' });
  await expect(encounter).toContainText('Da raggiungere');
  await expect(encounter).toContainText('radura orientale');
  await encounter.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('offline-snorlax-destination-guide.png') });
  const after = await readBrowserSave(page);
  for (const key of ['player', 'party', 'storage', 'inventory', 'flags', 'badges', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(errors).toEqual([]);
});

test('fossil reward guidance locates Elia from the first offline Journal visit', async ({ page, context }, info) => {
  await page.goto('/'); await enterGame(page);
  const fixture = await readBrowserSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 1, level: 10, instanceId: 'offline-fossil-guide' });
  fixture.party = [{ instanceId: creature.instanceId, speciesId: 1, level: 10, experience: 0, hp: creature.hp,
    maxHp: creature.stats.maxHp, moves: creature.moves.map(move => ({ id: move.moveId, pp: move.pp })) }];
  fixture.flags = [...new Set([...fixture.flags, 'q_starter_selected', 'q_research_sample_received',
    'q_league_completed', 'q_league_epilogue_seen', 'prologue_complete_seen',
    'badge_ghiaccio_awarded', 'q_r14_visited', 'q_d05_visited'])];
  await seedBrowserSave(page, fixture);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  const before = await readBrowserSave(page);
  await page.getByRole('button', { name: 'Apri diario del viaggio' }).click();
  const journal = page.getByRole('dialog', { name: 'Il tuo viaggio' });
  const quest = journal.locator('.journey-quest').filter({ hasText: 'Una nuova vita per Kabuto' });
  await expect(quest.locator('.journey-quest-state')).toHaveText('Da ricevere');
  await journal.getByRole('button', { name: 'Mostra Kabuto sulla mappa', exact: true }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas.locator('.region-map-select')).toHaveValue('borgofonte');
  await expect(atlas.locator('.region-map-local')).toHaveAttribute('data-map-id', 'veloria/borgofonte_lab');
  await expect(atlas.locator('.region-map-local-target')).toHaveAttribute('data-map-x', '400');
  await expect(atlas.locator('.region-map-local-target')).toHaveAttribute('data-map-y', '259');
  const gift = atlas.getByRole('region', { name: 'Pokémon in dono: Kabuto', exact: true });
  await expect(gift).toContainText('Elia'); await expect(gift).toContainText('cupola azzurra');
  await expect(gift).toContainText('Ridona vita a Kabuto');
  await page.evaluate(async () => {
    const image = new Image(); image.src = document.querySelector<SVGImageElement>('.region-map-chart image')!.href.baseVal;
    await image.decode(); await new Promise(requestAnimationFrame);
  });
  await page.screenshot({ path: info.outputPath('offline-kabuto-lab-guidance.png') });
  await atlas.getByRole('button', { name: 'Mostra tutta la regione' }).click();
  await atlas.locator('.region-map-discovery-pin[data-kind="fishing"]').first().click();
  await expect(atlas.locator('.region-map-local-target')).toHaveAttribute('data-kind', 'fishing');
  await expect(atlas.locator('.region-map-discovery-pin')).toHaveCount(1);
  await atlas.getByRole('button', { name: 'Chiudi ×' }).click();
  await page.getByRole('button', { name: 'Apri diario del viaggio' }).click();
  await page.getByRole('button', { name: 'Mostra Le correnti del Cristallo sulla mappa', exact: true }).click();
  await expect(atlas.locator('.region-map-local')).toHaveAttribute('data-map-id', 'veloria/d05_grotte_cristallo');
  await expect(atlas.locator('.region-map-local-target')).toHaveAttribute('data-map-x', '176');
  await expect(atlas.locator('.region-map-local-target')).toHaveAttribute('data-map-y', '451');
  const after = await readBrowserSave(page);
  for (const key of ['player', 'party', 'storage', 'inventory', 'flags', 'badges', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(failures).toEqual([]);
});

test('opening interiors are first visited offline with reachable floor, dialogue and return paths', async ({ page, context }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  await page.goto('/'); await enterGame(page);
  const fixture = await readBrowserSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 4, level: 5, instanceId: 'offline-opening-interiors' });
  fixture.party = [{ instanceId: creature.instanceId, speciesId: 4, level: 5, experience: 0, hp: creature.hp,
    maxHp: creature.stats.maxHp, moves: creature.moves.map(move => ({ id: move.moveId, pp: move.pp })) }];
  fixture.flags = [...new Set([...fixture.flags, 'q_starter_selected', 'q_research_sample_received',
    'intro_completed', 'tutorial_habitat_seen', 'prologue_complete_seen'])];
  await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const paths = await illustratedMapPaths(['borgofonte_home', 'borgofonte_lab']);
  expect(await page.evaluate(paths => performance.getEntriesByType('resource').some(entry => paths.some(path => entry.name.includes(path))), paths)).toBe(false);
  const before = await readBrowserSave(page);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true);
  await walkTo(page, 'bg_borgofonte.tmj', 13, 9); await walkDirection(page, 'up');
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte_home');
  await walkTo(page, 'borgofonte_home.tmj', 15, 3);
  await page.screenshot({ path: info.outputPath('home-north-floor-offline.png') });
  const home = await readBrowserSave(page);
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).player).toEqual(home.player);
  await walkTo(page, 'borgofonte_home.tmj', 12, 13); await walkDirection(page, 'down');
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  await walkTo(page, 'bg_borgofonte.tmj', 21, 26); await walkDirection(page, 'up');
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte_lab');
  await walkTo(page, 'borgofonte_lab.tmj', 12, 8);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await expect(page.locator('#interaction-prompt')).toContainText('Elia');
  await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  await expect(page.locator('#dialogue-speaker')).toContainText('Elia');
  for (let i = 0; i < 10 && await page.locator('#dialogue-box').isVisible(); i++) {
    await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
  }
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await walkTo(page, 'borgofonte_lab.tmj', 12, 13); await walkDirection(page, 'down');
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  await page.reload(); await enterGame(page);
  const after = await readBrowserSave(page);
  for (const key of ['party', 'inventory', 'badges', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(after.player.money).toBe(before.player.money);
  expect(after.flags).toEqual(expect.arrayContaining([...before.flags, 'atlas_visited_veloria/borgofonte_home', 'atlas_visited_veloria/borgofonte_lab']));
  expect(failures).toEqual([]);
});

test('canonical NPC artwork and redesigned scenery decode offline without changing progress', async ({ page, context }) => {
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const before = await readBrowserSave(page);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  const decoded = await page.evaluate(async () => {
    const paths = ['assets/sprites/veloria-npcs-v3.webp', 'assets/scenery/veloria-c01_brumalta-illustrated-v2.webp',
      'assets/scenery/borgofonte-lab-interior-v2.webp', 'assets/scenery/veloria-borgofonte-home-interior-v2.webp',
      'assets/scenery/veloria-borgofonte-illustrated-v3.webp', 'assets/scenery/veloria-r02_viale_fronde-illustrated-v3.webp',
      'assets/scenery/veloria-d01_bosco_veli-illustrated-v3.webp', 'assets/sprites/veloria-gym-leaders-a-v1.webp',
      'assets/sprites/veloria-gym-leaders-b-v1.webp', 'assets/sprites/veloria-league-council-v1.webp',
      'assets/sprites/veloria-cast-opening-and-champion-v1.webp', 'assets/scenery/veloria-petalora-illustrated-v3.webp',
      'assets/scenery/veloria-r04_salita_petali-illustrated-v3.webp'];
    return Promise.all(paths.map(async path => { const image = new Image(); image.src = new URL(path, location.href).href; await image.decode(); return { width: image.naturalWidth, height: image.naturalHeight }; }));
  });
  expect(decoded).toEqual([
    ...Array.from({ length: 4 }, () => ({ width: 1536, height: 1024 })),
    { width: 1470, height: 1070 }, { width: 1484, height: 1060 },
    { width: 1536, height: 1024 }, { width: 1254, height: 1254 }, { width: 1254, height: 1254 }, { width: 1254, height: 1254 },
    { width: 1254, height: 1254 }, { width: 1461, height: 1077 }, { width: 1484, height: 1060 },
  ]);
  const after = await readBrowserSave(page);
  for (const key of ['player', 'party', 'storage', 'inventory', 'flags', 'badges', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(failures).toEqual([]);
});

test('exhausted habitat guidance and encounters after healing work offline', async ({ page, context }) => {
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const fixture = await readBrowserSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 4, level: 5, instanceId: 'offline-habitat', moveIds: ['scratch', 'growl'] });
  fixture.player = { ...fixture.player, mapId: 'veloria/r11_via_cascate', spawnPointId: 'from_acquariva', x: 6, y: 4 };
  fixture.flags = [...new Set([...fixture.flags, 'q_starter_selected', 'prologue_complete_seen', 'tutorial_habitat_seen'])];
  fixture.party = [{ instanceId: creature.instanceId, speciesId: 4, level: 5, experience: 0, hp: 0, maxHp: creature.stats.maxHp,
    moves: creature.moves.map(move => ({ id: move.moveId, pp: move.pp })) }];
  const seed = 1;
  expect(rollEncounterCheck(seed, .09).encounter).toBe(true);
  fixture.rngState = seed;
  await seedBrowserSave(page, fixture);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  await walkDirection(page, 'down');
  await expect(page.locator('#toast')).toContainText('La squadra è tutta KO');
  expect((await readBrowserSave(page)).rngState).toBe(seed);
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  fixture.party[0].hp = fixture.party[0].maxHp;
  await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
  await walkDirection(page, 'down');
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  expect(failures).toEqual([]);
});

test('trainer appearance can be changed, saved and resumed while the PWA is offline', async ({ page, context }) => {
  const failures: string[] = [];
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const before = await readBrowserSave(page);
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Impostazioni accessibilità e audio' }).click();
  await page.getByRole('button', { name: 'Aspetto allenatore' }).click();
  await page.getByRole('combobox', { name: 'Capelli', exact: true }).selectOption('long');
  await page.getByRole('combobox', { name: 'Abbigliamento', exact: true }).selectOption('lavender');
  await page.getByRole('button', { name: 'Salva aspetto', exact: true }).click();
  await expect(page.locator('.trainer-avatar-dialog')).toHaveCount(0);
  await page.reload(); await enterGame(page);
  const after = await readBrowserSave(page);
  expect(after.player.appearance).toMatchObject({ hairStyle: 'long', outfit: 'lavender' });
  for (const key of ['party', 'storage', 'inventory', 'badges', 'flags', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(failures).toEqual([]);
});

test('a seen Gyarados exposes Ice Fang combined effects on its first offline detail visit', async ({ page, context }, info) => {
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const fixture = await readBrowserSave(page);
  fixture.flags.push('pokedex_seen_130');
  await seedBrowserSave(page, fixture);
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  const before = await readBrowserSave(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
  const panel = page.getByRole('dialog', { name: 'Pokédex', exact: true });
  await panel.getByRole('button', { name: /Gyarados/ }).click();
  const card = panel.locator('.pokemon-move').filter({ hasText: /Gelodenti · Livello 32/ });
  await expect(card).toContainText('Potenza 65');
  await expect(card).toContainText('indipendenti');
  await expect(card).toContainText('Ghiaccio sono immuni al gelo');
  expect((await card.innerText()).match(/10%/g)).toHaveLength(2);
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('ice-fang-first-offline-detail.png') });
  const after = await readBrowserSave(page);
  for (const key of ['party', 'storage', 'inventory', 'badges', 'flags', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(failures).toEqual([]);
});

test('earned Acquariva team studies Headbutt and the upcoming Bite level after offline backup import', async ({ page, context }, info) => {
  const backup = await readFile(new URL('../../docs/playtests/2026-10-24-natural-eevee-caught-backup-charmander.json', import.meta.url), 'utf8');
  const sourceSave = JSON.parse(backup).save;
  await page.goto('/'); await enterGame(page);
  const gen1Save = {
    ...sourceSave,
    party: sourceSave.party.filter((member: { speciesId: number }) => member.speciesId <= 151),
    storage: sourceSave.storage.filter((member: { speciesId: number }) => member.speciesId <= 151),
    flags: sourceSave.flags.filter((flag: string) => !/^pokedex_(seen|caught)_\d+$/.test(flag) || Number(flag.split('_').at(-1)) <= 151),
  };
  const gen1Backup = exportSave(gen1Save, '2026-10-26T00:00:00.000Z');
  const earned = JSON.parse(gen1Backup).save;
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const failures: string[] = []; page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri importazione ed esportazione salvataggio' }).click();
  page.once('dialog', dialog => dialog.accept());
  await Promise.all([page.waitForEvent('load'), page.locator('#save-file').setInputFiles({ name: 'earned-acquariva.json', mimeType: 'application/json', buffer: Buffer.from(gen1Backup) })]);
  await enterGame(page);
  const before = await readBrowserSave(page);
  expect(before.party).toEqual(earned.party); expect(before.rngState).toBe(earned.rngState);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const team = page.getByRole('dialog', { name: 'Squadra', exact: true });
  await team.locator('.pokemon-select').filter({ hasText: 'Drowzee' }).click();
  const headbutt = team.locator('.pokemon-move').filter({ hasText: /Bottintesta · PP/ });
  await expect(headbutt).toContainText('Potenza 70'); await expect(headbutt).toContainText('30%');
  await expect(headbutt).toContainText('prima che agisca');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  await team.locator('.pokemon-select').filter({ hasText: 'Eevee' }).click();
  await expect(page.locator('#pokedex-summary')).toHaveText('Eevee · Livello 28 · NORMALE');
  const bite = team.locator('.pokemon-move').filter({ hasText: /Morso · Livello 29/ });
  await expect(bite).toContainText('BUIO'); await expect(bite).toContainText('Potenza 60'); await expect(bite).toContainText('30%');
  await bite.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('eevee-bite-learnset-offline.png') });
  const after = await readBrowserSave(page);
  for (const key of ['party', 'storage', 'inventory', 'flags', 'badges', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  expect(after.party.find(member => member.speciesId === 133)?.moves.some(slot => slot.id === 'bite')).toBe(false);
  expect(failures).toEqual([]);
});

test('Acquariva chapter resources load first offline and the waterfall walking return persists',async({page,context})=>{
  test.setTimeout(180_000);
  await page.goto('/');await enterGame(page);
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
  const save=await readBrowserSave(page);
  save.flags=[...new Set([...save.flags,'q_starter_selected','q_delta_report','q_acquariva_visited','q_acquariva_report','badge_riflesso_awarded'])];
  save.badges=[...new Set([...save.badges,'badge_riflesso'])];
  save.player={...save.player,mapId:'veloria/acquariva',spawnPointId:'from_r11',x:7,y:1};
  await seedBrowserSave(page,save);
  const failures:string[]=[];page.on('requestfailed',request=>failures.push(request.url()));
  await context.setOffline(true);await page.reload();await enterGame(page);
  const maps=['r09_dune_salmastre','d04_delta_specchi','r10_sentiero_canne','acquariva','gym06_acquariva','r11_via_cascate'];
  const paths=await illustratedMapPaths(maps);
  const resources=await page.evaluate(async({maps,paths})=>{
    const images=await Promise.all(paths.map(async path=>{const image=new Image();image.src='/'+path;await image.decode();return image.naturalWidth>1000;}));
    const widths=await Promise.all(maps.map(async name=>{const response=await fetch(`/tilemaps/${name}.tmj`);if(!response.ok)throw new Error(name);return(await response.json()).width;}));
    return{images,widths};
  },{maps,paths});
  expect(resources).toEqual({images:[true,true,true,true,true,true],widths:[40,40,40,40,32,40]});
  await walkDirection(page,'up');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r11_via_cascate');
  await walkTo(page,'r11_via_cascate.tmj',20,0);
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');
  await page.reload();await enterGame(page);await walkDirection(page,'down');
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r11_via_cascate');
  await walkTo(page,'r11_via_cascate.tmj',17,29);
  await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  await page.reload();await enterGame(page);
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  expect(failures).toEqual([]);
});

test('Portolume ferry and new chapter resources work on their first offline request', async({page,context})=>{
  test.setTimeout(90_000);
  await page.goto('/');await enterGame(page);
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
  const save=await readBrowserSave(page);
  save.flags=[...save.flags,'q_starter_selected','q_centrale_report','q_portolume_visited','q_portolume_orientation'];
  save.player={...save.player,mapId:'veloria/portolume',spawnPointId:'dock_mainland',x:25,y:14};
  await seedBrowserSave(page,save);
  await context.setOffline(true);
  const failures:string[]=[];page.on('requestfailed',request=>failures.push(request.url()));
  await page.reload();await enterGame(page);
  const paths=await illustratedMapPaths(['r08_costa_turbine','portolume','gym05_portolume']);
  const decoded=await page.evaluate(async paths=>Promise.all(paths.map(async path=>{
    const image=new Image();image.src='/'+path;await image.decode();return image.naturalWidth>1000;
  })),paths);
  expect(decoded).toEqual([true,true,true]);
  const mapSizes=await page.evaluate(async()=>Promise.all(['r08_costa_turbine','portolume','gym05_portolume'].map(async name=>{
    const response=await fetch(`/tilemaps/${name}.tmj`);if(!response.ok)throw new Error(name);return (await response.json()).width;
  })));
  expect(mapSizes).toEqual([40,40,32]);
  await page.getByRole('button',{name:'Vai a destra',exact:true}).tap();
  await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
  await page.getByRole('button',{name:'Osservatorio delle maree',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).player.spawnPointId).toBe('dock_observatory');
  await page.reload();await enterGame(page);
  await walkTo(page,'portolume.tmj',33,10);
  await page.getByRole('button',{name:'Vai a sinistra',exact:true}).tap();
  await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
  await page.getByRole('button',{name:'Molo di Portolume',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).player.spawnPointId).toBe('dock_mainland');
  expect(failures).toEqual([]);
});

async function getMvpResourcePaths(): Promise<string[]> {
  const mapsDirectory = new URL('../../content/maps/', import.meta.url);
  const files = await readdir(mapsDirectory);
  const mapFiles = files.filter(file => file.endsWith('.map.json')).sort();
  const resources = new Set(['index.html', 'build-manifest.json', 'assets/ui/veloria-region-atlas-v1.webp']);
  for (const file of ['pokeapi-starter-artwork-v1.json', 'pokeapi-route-artwork-v1.json', 'pokeapi-evolution-artwork-v1.json', 'pokeapi-urban-artwork-v1.json']) {
    const artwork = JSON.parse(await readFile(new URL(`../../assets/${file}`, import.meta.url), 'utf8'));
    for (const entry of artwork.artworks) if (entry.speciesId <= 151) resources.add(entry.path);
  }
  for (const direction of ['down', 'up', 'left', 'right']) {
    resources.add(`assets/sprites/veloria-traveler-${direction}.png`);
  }
  for (const file of mapFiles) {
    const map = JSON.parse(await readFile(new URL(file, mapsDirectory), 'utf8')) as {
      tiledAsset: string;
      renderAssets: { path: string }[];
    };
    resources.add(map.tiledAsset);
    for (const asset of map.renderAssets) resources.add(asset.path);
  }
  const buildManifest = JSON.parse(await readFile(new URL('../../dist/build-manifest.json', import.meta.url), 'utf8')) as Record<string, {
    file?: string;
    css?: string[];
    assets?: string[];
  }>;
  for (const entry of Object.values(buildManifest)) {
    if (entry.file) resources.add(entry.file);
    for (const asset of [...(entry.css ?? []), ...(entry.assets ?? [])]) resources.add(asset);
  }
  return [...resources];
}

async function readSave(page: import('@playwright/test').Page) {
  return page.evaluate(() => new Promise<any>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('saves', 'readonly');
      const get = tx.objectStore('saves').get('main');
      get.onsuccess = () => {
        if (!get.result) { reject(new Error('The initial movement did not create a save.')); return; }
        resolve(get.result);
      };
      get.onerror = () => reject(get.error);
      tx.oncomplete = () => db.close();
    };
  }));
}

function nextRandom(state: number) {
  let value = state >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function findDeterministicEncounterSeed(table: any, chance: number, speciesId: number, battleRandomDrawsBeforeCapture = 2) {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    const check = rollEncounterCheck(seed, chance);
    if (!check.encounter) continue;
    const selected = selectWildEncounter({ rngState: check.nextRngState, localHour: 12,
      table, species: speciesRegistry.species as any });
    if (selected.speciesId !== speciesId) continue;
    let captureState = selected.nextRngState;
    for (let draw = 0; draw < battleRandomDrawsBeforeCapture; draw += 1) captureState = nextRandom(captureState);
    const captureRoll = nextRandom(captureState);
    if (captureRoll / 0x1_0000_0000 < 0.25) return seed;
  }
  throw new Error(`No deterministic offline ${(speciesRegistry.species as any)[String(speciesId)].name} encounter seed found for ${table.id}.`);
}

function findNoEncounterSeed(checks: number) {
  for (let seed = 1; seed < 1_000_000; seed += 1) {
    let state = seed;
    let clear = true;
    for (let index = 0; index < checks; index += 1) {
      state = nextRandom(state);
      if (state / 0x1_0000_0000 < 0.08) {
        clear = false;
        break;
      }
    }
    if (clear) return seed;
  }
  throw new Error(`No deterministic seed found for ${checks} encounter-free checks.`);
}

async function seedOfflineCapture(page: import('@playwright/test').Page, rngState: number) {
  await page.evaluate((seed) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const value = store.get('main');
      value.onerror = () => reject(value.error);
      value.onsuccess = () => {
        const save = value.result;
        save.rngState = seed;
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), rngState);
}

async function seedOfflineHealing(page: import('@playwright/test').Page) {
  const species = JSON.parse(await readFile(new URL('../../content/battle/species.v1.json', import.meta.url), 'utf8')).species;
  const moves = JSON.parse(await readFile(new URL('../../content/battle/moves.v1.json', import.meta.url), 'utf8')).moves;
  const prepared = createBattleCreature({ species, moves, speciesId: 5, level: 30, instanceId: 'offline-fixture', moveIds: ['scratch', 'growl', 'ember', 'smokescreen'] });
  await page.evaluate(creature => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('veloria-save', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const value = store.get('main');
      value.onerror = () => reject(value.error);
      value.onsuccess = () => {
        const save = value.result;
        save.party[0] = {
          ...save.party[0],
          speciesId: creature.speciesId,
          level: creature.level,
          experience: 0,
          hp: creature.hp,
          maxHp: creature.stats.maxHp,
          moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })),
        };
        // Prepare the gym party before the Center restores its HP, status and PP.
        save.party = save.party.map((member: any) => ({
          ...member, hp: 1, status: { status: 'poison' },
          moves: member.moves.map((move: any) => ({ ...move, pp: 0 })),
        }));
        store.put(save, 'main');
        store.delete('checksum:main');
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), prepared);
}

/** Production journey: use the authored responsive geometry and actual touch input, no debug globals. */
async function tapBattleControl(page: import('@playwright/test').Page, control: 'moves' | 'captures' | 'message' | number) {
  const box = await page.locator('#game canvas').boundingBox();
  if (!box) throw new Error('Battle canvas is not visible offline.');
  const layout = battleCommandLayout(box.width, box.height);
  const target = typeof control === 'number' ? battleMoveGrid(layout.deck).card(control)
    : control === 'message' ? layout.message
    : { x: layout.navigation.x + (control === 'moves' ? 0 : 2) * layout.navigation.width / 5,
        y: layout.navigation.y, width: layout.navigation.width / 5, height: layout.navigation.height };
  await page.touchscreen.tap(box.x + target.x + target.width / 2, box.y + target.y + target.height / 2);
}

async function advanceBattleMessages(page: import('@playwright/test').Page) {
  for (let tap = 0; tap < 14; tap += 1) {
    if (!(await page.locator('body').evaluate(element => element.classList.contains('battle-active')))) return;
    if (await page.locator('.battle-celebration').isVisible()) {
      await page.getByRole('button', { name: 'Continua', exact: true }).click();
      return;
    }
    await tapBattleControl(page, 'message');
    await page.waitForTimeout(90);
  }
}

async function captureWildOffline(page: import('@playwright/test').Page) {
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  await expect(page.locator('#game')).not.toHaveAttribute('aria-busy', 'true');
  // This suite runs the compiled production bundle: confirm the first ball with
  // the real keyboard command. The tab uses the same responsive layout as the game.
  await tapBattleControl(page, 'captures');
  await page.keyboard.press('Enter', { delay: 40 });
  await advanceBattleMessages(page);
}

test('E2E-06: the cached adventure reaches three badges offline', async ({ page, context }, testInfo) => {
  // CI 39554346058 reaches the final Aster battle at 900s (Magnemite is
  // already on the field). Allow its remaining turns and durable third medal
  // within the existing 20-minute workflow step; keep every offline assertion.
  test.setTimeout(process.env.CI ? 1_080_000 : 480_000);
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  await page.addInitScript(() => { Date.prototype.getHours = () => 12; });
  const expectedResources = await getMvpResourcePaths();
  await page.goto('/');
  await enterGame(page);

  // First installation claims this document without an unnecessary reload.
  // WaitForFunction also survives navigation if an existing worker is updated.
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#game-loading')).toBeHidden();

  // Verify every local game asset is successfully cached before simulating
  // airplane mode. Keep the assertions strict; only their timing changed.
  await page.evaluate(async (expectedResources) => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable in this browser.');
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) throw new Error('The Veloria service worker did not activate.');
    const cachesForVeloria = await caches.keys();
    const cacheName = cachesForVeloria.find(name => name.startsWith('veloria-shell-'));
    if (!cacheName) throw new Error('The Veloria app shell cache was not created.');
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const urls = requests.map(request => request.url);
    for (const expected of expectedResources) {
      const cachedRequest = requests.find(request => request.url.endsWith(expected));
      if (!cachedRequest) throw new Error(`Missing cached MVP resource: ${expected}`);
      const cachedResponse = await cache.match(cachedRequest);
      if (!cachedResponse?.ok) {
        const details = cachedResponse ? `HTTP ${cachedResponse.status} ${cachedResponse.type} ${cachedResponse.url}` : 'no response';
        throw new Error(`Missing successful cached MVP response: ${expected} (${details}; cache keys ${urls.filter(url => url.endsWith(expected)).join(', ')})`);
      }
    }
  }, expectedResources);

  // Move once online to create an IndexedDB checkpoint.
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect.poll(async () => {
    try { return (await readSave(page))?.player?.y ?? null; } catch { return null; }
  }).toBe(19);

  // Disable all browser networking for the actual offline assertions.
  await context.setOffline(true);
  expect(await page.evaluate(async () => Promise.all([2, 5, 8].map(async id => {
    const image = new Image();
    image.src = new URL(`assets/creatures/pokeapi-evolution-${id}-v1.webp`, location.href).href;
    await image.decode();
    return image.naturalWidth > 0;
  })))).toEqual([true, true, true]);

  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`));
  const offlineResponse = await page.reload();
  expect(offlineResponse?.status()).toBe(200);
  await enterGame(page);

  const directions = { alto: 'Vai in alto', basso: 'Vai in basso', sinistra: 'Vai a sinistra', destra: 'Vai a destra' } as const;
  const walk = async (direction: keyof typeof directions, count: number, stopAtMapId?: string, beforeSave?: Awaited<ReturnType<typeof readSave>>) => {
    const button = page.getByRole('button', { name: directions[direction] });
    let observed = beforeSave ?? await readSave(page);
    for (let step = 0; step < count; step += 1) {
      await expect(page.locator('#game')).not.toHaveAttribute('aria-busy', 'true');
      const before = observed;
      await button.tap();
      await expect.poll(async () => {
        observed = await readSave(page);
        const player = observed?.player;
        return `${player?.mapId}|${player?.x},${player?.y}`;
      }).not.toBe(`${before.player.mapId}|${before.player.x},${before.player.y}`);
      if (stopAtMapId) {
        await expect(page.locator('#game-loading')).toBeHidden();
        observed = await readSave(page);
        if (observed?.player?.mapId === stopAtMapId) break;
      }
    }
    return observed;
  };
  const walkToMapTile = async (tilemapPath: string, targetX: number, targetY: number) => {
    const current = await readSave(page);
    const map = JSON.parse(await readFile(new URL(`../../public/tilemaps/${tilemapPath}`, import.meta.url), 'utf8'));
    const collisionLayer = map.layers.find((layer: any) => layer.name === 'collision');
    const blocked = new Set<string>();
    for (const object of collisionLayer.objects) {
      const left = Math.max(0, Math.floor(object.x / 32));
      const top = Math.max(0, Math.floor(object.y / 32));
      const right = Math.min(map.width, Math.ceil((object.x + Math.max(1, object.width ?? 32)) / 32));
      const bottom = Math.min(map.height, Math.ceil((object.y + Math.max(1, object.height ?? 32)) / 32));
      for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) blocked.add(`${x},${y}`);
    }
    // Cross only the requested threshold; other doors are not navigation shortcuts.
    for (const trigger of map.layers.find((layer: any) => layer.name === 'triggers').objects) {
      const properties = Object.fromEntries((trigger.properties ?? []).map((property: any) => [property.name, property.value]));
      if (properties.kind !== 'map-exit') continue;
      for (let y = Math.floor(trigger.y / 32); y < Math.ceil((trigger.y + trigger.height) / 32); y += 1) {
        for (let x = Math.floor(trigger.x / 32); x < Math.ceil((trigger.x + trigger.width) / 32); x += 1) {
          if (x !== targetX || y !== targetY) blocked.add(`${x},${y}`);
        }
      }
    }
    const steps = [
      { x: 0, y: -1, direction: 'alto' as const },
      { x: 1, y: 0, direction: 'destra' as const },
      { x: 0, y: 1, direction: 'basso' as const },
      { x: -1, y: 0, direction: 'sinistra' as const },
    ];
    const start = `${current.player.x},${current.player.y}`;
    const goal = `${targetX},${targetY}`;
    const previous = new Map<string, { point: string; direction: typeof steps[number]['direction'] }>();
    const queue = [start];
    const visited = new Set(queue);
    while (queue.length && !visited.has(goal)) {
      const point = queue.shift()!;
      const [x, y] = point.split(',').map(Number);
      for (const step of steps) {
        const nextX = x + step.x, nextY = y + step.y, next = `${nextX},${nextY}`;
        if (nextX < 0 || nextY < 0 || nextX >= map.width || nextY >= map.height || blocked.has(next) || visited.has(next)) continue;
        visited.add(next);
        previous.set(next, { point, direction: step.direction });
        queue.push(next);
      }
    }
    if (!visited.has(goal)) throw new Error(`No walkable route from ${start} to ${tilemapPath} tile ${goal}.`);
    const route: Array<typeof steps[number]['direction']> = [];
    for (let point = goal; point !== start;) {
      const step = previous.get(point);
      if (!step) throw new Error(`Broken route to ${tilemapPath} tile ${goal}.`);
      route.push(step.direction);
      point = step.point;
    }
    let observed = current;
    for (const direction of route.reverse()) observed = await walk(direction, 1, undefined, observed);
  };
  const walkToMapExit = async (tilemapPath: string, destinationMapId: string) => {
    const map = JSON.parse(await readFile(new URL(`../../public/tilemaps/${tilemapPath}`, import.meta.url), 'utf8'));
    const exit = map.layers.find((layer: any) => layer.name === 'triggers').objects.find((object: any) => {
      const properties = Object.fromEntries((object.properties ?? []).map((property: any) => [property.name, property.value]));
      return properties.kind === 'map-exit' && properties.destinationMapId === destinationMapId;
    });
    if (!exit) throw new Error(`${tilemapPath} has no map exit to ${destinationMapId}.`);
    // Aim for the middle of the currently authored exit rectangle so wider
    // thresholds do not transition on the first incidental edge tile.
    const targetX = Math.floor(exit.x / 32) + Math.floor(exit.width / 64);
    const targetY = Math.floor(exit.y / 32) + Math.floor(exit.height / 64);
    await walkToMapTile(tilemapPath, targetX, targetY);
    return { x: targetX, y: targetY };
  };

  // Start a new-game flow, then follow the same walkable route as E2E-02 while offline.
  await page.getByRole('button', { name: 'Vai in basso' }).tap();
  await expect.poll(async () => (await readSave(page))?.player?.y).toBe(20);
  await walkToMapTile('bg_borgofonte.tmj', 21, 25);
  await expect(page.locator('#current-location')).toHaveText('LABORATORIO DI ELIA');
  await walkToMapTile('borgofonte_lab.tmj', 12, 8);
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  for (let step = 0; step < 5; step += 1) {
    if (await page.locator('#starter-choices').isVisible()) break;
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  }
  await expect(page.locator('#starter-choices')).toBeVisible();
  for (const name of ['Pikachu', 'Charmander', 'Squirtle', 'Bulbasaur']) {
    const portrait = page.getByRole('button', { name, exact: true }).locator('.creature-portrait');
    expect(await portrait.evaluate(async element => {
      const image = new Image();
      image.src = getComputedStyle(element).backgroundImage.slice(5, -2);
      await image.decode();
      return image.naturalWidth > 0 && !element.classList.contains('creature-portrait-pending');
    })).toBe(true);
  }
  await page.getByRole('button', { name: 'Charmander', exact: true }).click();
  await expect.poll(async () => (await readSave(page))?.party?.length).toBe(1);
  // Follow dialogue visibility rather than a fixed number of text pages.
  for (let step = 0; step < 20 && await page.locator('#dialogue-box').isVisible(); step += 1)
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Professoressa Elia');
  // Follow dialogue visibility rather than a fixed number of text pages.
  for (let step = 0; step < 20 && await page.locator('#dialogue-box').isVisible(); step += 1)
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_research_sample_received');
  await expect(page.locator('#dialogue-box')).toBeHidden();

  await walkToMapTile('borgofonte_lab.tmj', 12, 14);
  await walkToMapTile('bg_borgofonte.tmj', 28, 20);
  await walkToMapTile('bg_borgofonte.tmj', 22, 0);
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/r01_sentiero_alba');
  expect((await readSave(page)).player).toMatchObject({ x: 1, y: 10 });
  await walk('destra', 14);
  await page.getByRole('button', { name: 'Vai in alto' }).tap(); // Face the solid pickup without entering its tile.
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await expect.poll(async () => (await readSave(page))?.inventory?.potion).toBe(3);
  const exitCell = await walkToMapExit('r01_sentiero_alba.tmj', 'veloria/d01_bosco_veli');
  const finalSave = await readSave(page);
  expect(finalSave.player).toMatchObject({ mapId: 'veloria/d01_bosco_veli', spawnPointId: 'from_r01', x: 1, y: exitCell.y });
  expect(finalSave.flags).toContain('item_r01_potion_collected');
  // Encounters belong to the visible fern patches, not to the central path.
  await walkToMapTile('d01_bosco_veli.tmj', 2, 9);
  await seedOfflineCapture(page, findDeterministicEncounterSeed(d01Woodland, 0.18, d01Woodland.timeBands.day[0].speciesId));
  await page.reload();
  await enterGame(page);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  try {
    await captureWildOffline(page);
  } catch (error) {
    const toast = await page.locator('#toast').textContent();
    throw new Error(`${error instanceof Error ? error.message : error}; toast: ${toast}; runtime errors: ${runtimeErrors.join(' | ')}`);
  }
  await expect.poll(async () => (await readSave(page))?.party?.length).toBe(2);
  const capturedSave = await readSave(page);
  expect(capturedSave.party[1]).toMatchObject({ speciesId: d01Woodland.timeBands.day[0].speciesId });
  expect(capturedSave.inventory['poke-ball']).toBe(4);

  // Finish Ada's quest offline, then follow the forest-city connection without encounters.
  const tapConfirm = () => page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await walk('basso', 3);
  await walkToMapTile('d01_bosco_veli.tmj', 13, 12);
  await walk('alto', 1);
  await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  for (let step = 0; step < 4; step += 1) await tapConfirm();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await walkToMapTile('d01_bosco_veli.tmj', 17, 12);
  await walk('alto', 1);
  await tapConfirm();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_forest_signal_found');
  await walkToMapTile('d01_bosco_veli.tmj', 13, 12);
  await walk('alto', 1);
  await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  for (let step = 0; step < 4; step += 1) await tapConfirm();
  await expect(page.locator('#dialogue-box')).toBeHidden();
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_ada_helped');

  await seedOfflineCapture(page, findNoEncounterSeed(60));
  await page.reload();
  await enterGame(page);
  await walkToMapTile('d01_bosco_veli.tmj', 29, 10);
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/r02_viale_fronde');
  await walk('destra', 26, 'veloria/brumalta');
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/brumalta');
  await expect.poll(async () => (await readSave(page))?.flags).toContain('q_brumalta_visited');

  // Exercise the Center against a damaged, statused party while still disconnected.
  await seedOfflineHealing(page);
  await page.reload();
  await enterGame(page);
  await expect.poll(async () => (await readSave(page))?.party.every((creature: any) =>
    creature.hp === 1 && creature.status?.status === 'poison' && creature.moves.every((move: any) => move.pp === 0),
  )).toBe(true);
  await walk('alto', 5);
  await walk('destra', 5);
  await page.getByRole('button', { name: 'Vai in alto' }).tap();
  await tapConfirm();
  await expect(page.locator('#starter-choices')).toBeVisible();
  await page.getByRole('button', { name: 'RIPOSA' }).click();
  await expect.poll(async () => (await readSave(page))?.party.every((creature: any) =>
    creature.hp === creature.maxHp && creature.status === undefined && creature.moves.every((move: any) => move.pp > 0),
  )).toBe(true);

  await walkToMapTile('c01_brumalta.tmj', 28, 7);
  await expect.poll(async () => (await readSave(page))?.player?.mapId).toBe('veloria/gym01_brumalta');
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI BRUMALTA');

  // Activate all three puzzle plates through normal movement before approaching Mira.
  await walkToMapTile('gym01_brumalta.tmj', 13, 14);
  await expect.poll(async () => (await readSave(page))?.flags).toContain('gym01_resonance_south');
  await walkToMapTile('gym01_brumalta.tmj', 8, 10);
  await expect.poll(async () => (await readSave(page))?.flags).toContain('gym01_resonance_middle');
  await walkToMapTile('gym01_brumalta.tmj', 18, 6);
  await expect.poll(async () => (await readSave(page))?.flags).toContain('gym01_puzzle_solved');
  await walkToMapTile('gym01_brumalta.tmj', 14, 3);
  await walk('basso', 1);
  await walk('alto', 1);
  await tapConfirm();
  await expect(page.locator('#dialogue-text')).toContainText('Medaglia Aurora');
  for (let step = 0; step < 5 && !(await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible()); step += 1) {
    await tapConfirm();
  }
  await page.getByRole('button', { name: 'SFIDA', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for (let turn = 0; turn < 10; turn += 1) {
    if (!(await page.locator('body').evaluate(element => element.classList.contains('battle-active')))) break;
    await tapBattleControl(page, 'moves');
    await tapBattleControl(page, 0);
    await advanceBattleMessages(page);
  }
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  await expect.poll(async () => (await readSave(page))?.badges?.filter((badge: string) => badge === 'badge_aurora').length).toBe(1);
  await expect(page.getByRole('heading', { name: 'Primo capitolo completato' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('first-chapter-complete-offline.png') });
  await page.getByRole('button', { name: 'Continua a esplorare' }).click();
  const badgeSave = await readSave(page);
  expect(badgeSave.flags).toContain('trainer_gym01_mira_defeated');
  expect(badgeSave.flags).toContain('badge_aurora_awarded');
  expect(badgeSave.flags).toContain('prologue_complete_seen');

  await page.reload();
  await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI BRUMALTA');
  expect((await readSave(page)).badges.filter((badge: string) => badge === 'badge_aurora')).toHaveLength(1);

  // The next region is part of the installed pack, including map transitions and services.
  // Prepare only the starting location; the existing badge must open the authored gate.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request=indexedDB.open('veloria-save',1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result, tx=db.transaction('saves','readwrite'), store=tx.objectStore('saves');
      const get=store.get('main');
      get.onsuccess=()=>{
        const save=get.result;
        save.player={...save.player,mapId:'veloria/radicelmo',spawnPointId:'from_r04',x:18,y:2};
        save.party[0].hp=1;
        store.put(save,'main');store.delete('checksum:main');
      };
      tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
    };
  }));
  await page.reload(); await enterGame(page);
  await walkToMapTile('radicelmo.tmj',18,0);
  await expect(page.locator('#current-location')).toHaveText('SALITA DEI PETALI');
  for(const [x,y]of [[18,23],[7,23],[7,14],[30,14]])await walkToMapTile('r04_salita_petali.tmj',x,y);
  await walkToMapTile('r04_salita_petali.tmj',30,0);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  await expect.poll(async()=>(await readSave(page)).flags).toContain('q_petalora_visited');
  await walkToMapTile('petalora.tmj',10,9);
  await walk('alto',1); await tapConfirm();
  await page.getByRole('button',{name:'RIPOSA',exact:true}).click();
  await expect.poll(async()=>(await readSave(page)).party.every((c:any)=>c.hp===c.maxHp)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('petalora-offline.png')});
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  expect((await readSave(page)).flags).toContain('q_petalora_visited');

  await walkToMapTile('petalora.tmj',18,0);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI PETALORA');
  const examineGymStation=async(x:number,y:number)=>{
    await walkToMapTile('gym02_petalora.tmj',x,y+2);
    await walk('alto',1);await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeVisible();
    for(let tap=0;tap<8&&await page.locator('#dialogue-box').isVisible();tap++)await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  };
  await examineGymStation(5,21);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym02_water_source_open');
  await page.reload();await enterGame(page);
  expect((await readSave(page)).flags).toContain('gym02_water_source_open');
  await examineGymStation(6,15);
  await examineGymStation(20,10);
  await examineGymStation(13,6);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym02_irrigation_solved');
  await walkToMapTile('gym02_petalora.tmj',13,5);
  await walk('alto',1);await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Dalia');
  for(let tap=0;tap<8&&!(await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible());tap++)await tapConfirm();
  await page.getByRole('button',{name:'SFIDA',exact:true}).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for(let turn=0;turn<10;turn++) {
    if(!(await page.locator('body').evaluate(el=>el.classList.contains('battle-active'))))break;
    await tapBattleControl(page, 'moves');
    await tapBattleControl(page, 0);
    await advanceBattleMessages(page);
  }
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  await expect.poll(async()=>(await readSave(page)).badges).toContain('badge_corolla');
  await page.reload();await enterGame(page);
  await page.getByRole('button',{name:'Apri menu di gioco'}).click();
  await page.getByRole('button',{name:'Apri le medaglie'}).click();
  const medals=page.getByRole('dialog',{name:'Le tue medaglie'});
  await expect(medals).toContainText('Medaglia Corolla');
  await expect(medals.locator('[data-badge-id="badge_corolla"] svg')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('corolla-offline.png')});

  await page.keyboard.press('Escape');
  await walkToMapTile('gym02_petalora.tmj',13,25);
  await expect(page.locator('#current-location')).toHaveText('PETALORA');
  await walkToMapTile('petalora.tmj',37,12);
  await expect(page.locator('#current-location')).toHaveText('VIADOTTO DEI CILIEGI');
  for (const [x,y] of [[15,18],[15,6],[44,6],[45,6]]) await walkToMapTile('r05_viadotto_ciliegi.tmj',x,y);
  await expect(page.locator('#current-location')).toHaveText('VETRACIELO · PIAZZA DELLA MONOROTAIA');
  await expect.poll(async()=>(await readSave(page)).flags).toContain('q_vetracielo_visited');
  const potionsBeforeLea=(await readSave(page)).inventory.potion??0;
  await walkToMapTile('vetracielo.tmj',22,20);await walk('alto',1);await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Lea');
  for(let tap=0;tap<12&&await page.locator('#dialogue-box').isVisible();tap++)await tapConfirm();
  await expect.poll(async()=>(await readSave(page)).flags).toContain('q_vetracielo_orientation');
  expect((await readSave(page)).inventory.potion).toBe(potionsBeforeLea+2);
  await walkToMapTile('vetracielo.tmj',15,22);await walk('alto',1);await tapConfirm();
  await page.getByRole('button',{name:'RIPOSA',exact:true}).click();
  await expect.poll(async()=>(await readSave(page)).party.every((c:any)=>c.hp===c.maxHp)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('vetracielo-offline.png')});
  await page.reload();await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('VETRACIELO · PIAZZA DELLA MONOROTAIA');
  expect((await readSave(page)).flags).toContain('q_vetracielo_orientation');
  expect((await readSave(page)).inventory.potion).toBe(potionsBeforeLea+2);

  await walkToMapTile('vetracielo.tmj',20,16);
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI VETRACIELO');
  const inspectRailConsole=async(x:number,y:number)=>{
    await walkToMapTile('gym03_vetracielo.tmj',x,y+2);await walk('alto',1);await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeVisible();
    for(let tap=0;tap<10&&await page.locator('#dialogue-box').isVisible();tap++)await tapConfirm();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  };
  await inspectRailConsole(7,23);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym03_line_gardens_active');
  await page.reload();await enterGame(page);
  expect((await readSave(page)).flags).toContain('gym03_line_gardens_active');
  await inspectRailConsole(23,19);await inspectRailConsole(15,15);
  await expect.poll(async()=>(await readSave(page)).flags).toContain('gym03_lines_connected');
  await walkToMapTile('gym03_vetracielo.tmj',15,12);await walk('alto',1);await tapConfirm();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Aster');
  for(let tap=0;tap<10&&!(await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible());tap++)await tapConfirm();
  await page.getByRole('button',{name:'SFIDA',exact:true}).click();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for(let turn=0;turn<10;turn++) {
    if(!(await page.locator('body').evaluate(el=>el.classList.contains('battle-active'))))break;
    await tapBattleControl(page, 'moves');
    // The prepared Charmeleon's third slot is Ember: use its Fire coverage against Steel.
    await tapBattleControl(page, 2);
    await advanceBattleMessages(page);
  }
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  await expect.poll(async()=>(await readSave(page)).badges).toContain('badge_circuito');
  await page.reload();await enterGame(page);
  await page.getByRole('button',{name:'Apri menu di gioco'}).click();
  await page.getByRole('button',{name:'Apri le medaglie'}).click();
  const circuitMedals=page.getByRole('dialog',{name:'Le tue medaglie'});
  await expect(circuitMedals.locator('.badge-case-card')).toHaveCount(3);
  await circuitMedals.locator('[data-badge-id="badge_circuito"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('circuito-offline.png')});

  expect((await readSave(page)).flags).toContain('q_ada_helped');
  expect(failedRequests).toEqual([]);
});

test('the cached Anello Magnetico reading, Ferraluce report and healing work offline', async ({ page, context }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [], failedRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const resources = await getMvpResourcePaths();
  await page.evaluate(async paths => {
    for (const path of paths) {
      const response = await caches.match(new URL(path, location.href).href);
      if (!response?.ok) throw new Error(`Missing cached chapter asset: ${path}`);
    }
  }, resources);
  const save = await readSave(page);
  const creature = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any, speciesId: 140, level: 21, instanceId: 'offline-ferraluce', moveIds: ['mud-shot', 'sand-attack', 'absorb'] });
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'q_brumalta_visited', 'gym01_puzzle_solved', 'badge_aurora_awarded', 'prologue_complete_seen', 'q_petalora_visited', 'gym02_water_source_open', 'gym02_water_west_open', 'gym02_water_east_open', 'gym02_irrigation_solved', 'badge_corolla_awarded', 'q_vetracielo_visited', 'q_vetracielo_orientation', 'gym03_line_gardens_active', 'gym03_line_glass_active', 'gym03_lines_connected', 'badge_circuito_awarded'])];
  save.badges = ['badge_aurora', 'badge_corolla', 'badge_circuito'];
  save.player = { ...save.player, mapId: 'veloria/r06_anello_magnetico', spawnPointId: 'from_vetracielo', x: 18, y: 17 };
  save.party = [{ instanceId: creature.instanceId, speciesId: creature.speciesId, level: 20, experience: 0, hp: 3, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
  const potions = save.inventory.potion ?? 0;
  await seedBrowserSave(page, save);
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('ANELLO MAGNETICO');
  async function dismiss() {
    for (let tap = 0; tap < 12 && await page.locator('#dialogue-box').isVisible(); tap++)
      await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click(); await dismiss();
  await expect.poll(async () => (await readSave(page)).flags).toContain('q_r06_measurement');
  await walkTo(page, 'r06_anello_magnetico.tmj', 39, 25);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  await walkTo(page, 'ferraluce.tmj', 20, 22); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click(); await dismiss();
  await expect.poll(async () => (await readSave(page)).flags).toContain('q_ferraluce_report');
  expect((await readSave(page)).inventory.potion).toBe(potions + 2);
  await walkTo(page, 'ferraluce.tmj', 9, 23); await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
  await page.getByRole('button', { name: 'RIPOSA', exact: true }).click();
  await expect.poll(async () => (await readSave(page)).party[0].hp).toBe(creature.stats.maxHp);
  await page.reload(); await enterGame(page);
  expect((await readSave(page)).flags).toContain('q_ferraluce_report');
  await page.screenshot({ path: info.outputPath('ferraluce-offline.png') });
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});


test('Ferraluce magnetic gym opens and retains its circuit with networking disabled', async ({ page, context }) => {
  test.setTimeout(120_000);
  await prepareMonorailTraveler(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.flags.push('q_ferraluce_report');
  save.player = { ...save.player, mapId: 'veloria/ferraluce', spawnPointId: 'from_gym04', x: 34, y: 19 };
  await seedBrowserSave(page, save);
  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  await page.reload(); await enterGame(page);
  await walkDirection(page, 'up');
  await expect(page.locator('#current-location')).toHaveText('PALESTRA DI FERRALUCE');
  for (const id of ['second', 'field', 'first']) {
    const node = magneticRouter.nodes.find(node => node.id === id)!;
    await walkTo(page, 'gym04_ferraluce.tmj', node.x, node.y + 2);
    await walkDirection(page, 'up');
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await page.getByRole('button', { name: 'RUOTA', exact: true }).click();
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  }
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain(magneticRouter.solvedFlag);
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).flags).toContain(magneticRouter.solvedFlag);
  await walkTo(page, 'gym04_ferraluce.tmj', 15, 23);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  expect(failedRequests).toEqual([]);
});

test('the Condotto and Centrale open for the first time offline and retain the investigation reading', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  const errors: string[] = [], failedRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await prepareMonorailTraveler(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_ferraluce_report', 'gym04_magnetic_aligned', 'badge_acciaio_awarded', 'badge_aurora_awarded', 'badge_corolla_awarded'])];
  save.badges = ['badge_aurora', 'badge_corolla', 'badge_circuito', 'badge_acciaio'];
  save.player = { ...save.player, mapId: 'veloria/ferraluce', spawnPointId: 'from_r07', x: 38, y: 25 };
  await seedBrowserSave(page, save);
  // Neither new map has been opened: their first requests must use the production cache.
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  await walkDirection(page, 'right');
  await expect(page.locator('#current-location')).toHaveText('CONDOTTO RISONANTE');
  async function dismissDialogue() {
    await expect(page.locator('#dialogue-box')).toBeVisible();
    for (let tap = 0; tap < 16 && await page.locator('#dialogue-box').isVisible(); tap++)
      await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
    await expect(page.locator('#dialogue-box')).toBeHidden();
  }
  await walkTo(page, 'r07_condotto_risonante.tmj', 20, 18);
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await dismissDialogue();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_r07_measurement');
  await walkTo(page, 'r07_condotto_risonante.tmj', 39, 11);
  await expect(page.locator('#current-location')).toHaveText('CENTRALE RISONANTE');
  await walkTo(page, 'd03_centrale_risonante.tmj', 8, 12);
  await walkDirection(page, 'up');
  await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
  await dismissDialogue();
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_centrale_log');
  await page.reload(); await enterGame(page);
  await expect(page.locator('#current-location')).toHaveText('CENTRALE RISONANTE');
  const resumed = await readBrowserSave(page);
  expect(resumed.flags).toEqual(expect.arrayContaining(['q_r07_measurement', 'q_centrale_log']));
  expect(resumed.flags).not.toContain('q_centrale_isolated');
  await walkTo(page, 'd03_centrale_risonante.tmj', 15, 23);
  await expect(page.locator('#current-location')).toHaveText('CONDOTTO RISONANTE');
  await walkTo(page, 'r07_condotto_risonante.tmj', 0, 23);
  await expect(page.locator('#current-location')).toContainText('FERRALUCE');
  expect((await readBrowserSave(page)).flags).toEqual(expect.arrayContaining(['q_r07_measurement', 'q_centrale_log']));
  await page.screenshot({ path: info.outputPath('centrale-investigation-offline-return.png') });
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

for (const [group, expected] of [['evolution',[2,5,8,17,18,20,44,61,70,101]],['coast',[72,73,98,99]],['lake',[79,80,96,97,133]],['starter-finals',[3,6,9]],['stone-evolutions',[26,62,134,135,136]],['botanical',[45,71]]] as const) {
test(`${group} artwork decodes on its first request offline`, async ({ page, context }) => {
  const manifest = JSON.parse(await readFile(new URL(`../../assets/pokeapi-${group}-artwork-v1.json`, import.meta.url), 'utf8'));
  const artwork = (manifest.artworks as Array<{ speciesId: number; path: string }>).filter(entry => entry.speciesId <= 151);
  expect(artwork.map(entry => entry.speciesId).sort((a, b) => a - b)).toEqual(expected);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  const decoded = await page.evaluate(async paths => Promise.all(paths.map(async path => {
    const image = new Image(); image.src = new URL(path, location.href).href;
    await image.decode(); return image.naturalWidth > 0 && image.naturalHeight > 0;
  })), artwork.map(entry => entry.path));
  expect(decoded).toEqual(artwork.map(() => true));
  expect(failedRequests).toEqual([]);
});

}

test('Ferraluce candidate artwork decodes on its first request offline', async ({ page, context }) => {
  const manifest = JSON.parse(await readFile(new URL('../../assets/pokeapi-urban-artwork-v1.json', import.meta.url), 'utf8'));
  const artwork = manifest.artworks.filter((entry: { speciesId: number }) => [81, 100, 82].includes(entry.speciesId));
  expect(artwork).toHaveLength(3);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const failedRequests: string[] = [];
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await context.setOffline(true);
  const decoded = await page.evaluate(async paths => Promise.all(paths.map(async path => {
    const image = new Image(); image.src = new URL(path, location.href).href;
    await image.decode(); return image.naturalWidth > 0 && image.naturalHeight > 0;
  })), artwork.map((entry: { path: string }) => entry.path));
  expect(decoded).toEqual([true, true, true]);
  expect(failedRequests).toEqual([]);
});

test('illustrated atlas opens for the first time offline from the production cache', async ({ page, context }) => {
  await page.goto('/');
  await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  // Never open the panel online: its image must come from install-time precache.
  await context.setOffline(true);
  await page.reload();
  await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la mappa di Veloria' }).click();
  const atlas = page.getByRole('dialog', { name: 'Esplora Veloria' });
  await expect(atlas).toBeVisible();
  await expect(atlas.locator('.region-map-location')).toContainText('Borgofonte');
  expect(await page.evaluate(async () => {
    const image = new Image();
    image.src = '/assets/ui/veloria-region-atlas-v1.webp';
    await image.decode();
    return image.naturalWidth > 1000;
  })).toBe(true);
  await atlas.locator('.region-map-select').selectOption('ferraluce');
  await expect(atlas.locator('.region-map-details h3')).toHaveText('Ferraluce');
  await atlas.getByRole('button', { name: 'Chiudi ×' }).click();
  await expect(atlas).toBeHidden();
});


test('the monorail reaches visited cities and resumes at the terminal with networking disabled', async ({ page, context }) => {
  test.setTimeout(90_000);
  await prepareMonorailTraveler(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const before = travelResources(await readBrowserSave(page));
  await context.setOffline(true);
  const failures: string[] = [];
  page.on('requestfailed', request => failures.push(request.url()));
  for (const id of ['brumalta', 'ferraluce', 'vetracielo']) {
    await page.getByRole('button', { name: 'Conferma e interagisci' }).tap();
    const { station, spawn } = await stationArrival(id);
    await page.getByRole('button', { name: station.name, exact: true }).tap();
    await expect.poll(async () => (await readBrowserSave(page)).player).toMatchObject({ mapId: station.mapId, spawnPointId: spawn.id, x: spawn.x, y: spawn.y });
    await expect(page.locator('#game-loading')).toBeHidden();
    expect(travelResources(await readBrowserSave(page))).toEqual(before);
    await page.reload(); await enterGame(page);
    expect((await readBrowserSave(page)).player).toMatchObject({ mapId: station.mapId, spawnPointId: spawn.id, x: spawn.x, y: spawn.y });
    expect(travelResources(await readBrowserSave(page))).toEqual(before);
  }
  expect(failures).toEqual([]);
});


test('mountain resources decode on first offline request and cable return survives reload',async({page,context})=>{
 test.setTimeout(120_000);
 await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','badge_riflesso_awarded','q_passobrina_report','badge_ghiaccio_awarded'])];save.badges=[...new Set([...save.badges,'badge_brina'])];save.player={...save.player,mapId:'veloria/passobrina',spawnPointId:'cable_arrival',x:29,y:22};
 await seedBrowserSave(page,save);const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);
 expect((await readBrowserSave(page)).player.mapId).toBe('veloria/passobrina');
 const paths=await illustratedMapPaths(['r12_valle_vento','passobrina','r13_tornanti_bianchi','biancavetta','gym07_biancavetta','acquariva']);
 const decoded=await page.evaluate(async paths=>{
  const images=await Promise.all(paths.map(async path=>{const image=new Image();image.src='/'+path;await image.decode();return image.naturalWidth>1000;}));
  const widths=await Promise.all(['r12_valle_vento','passobrina','r13_tornanti_bianchi','biancavetta','gym07_biancavetta'].map(async name=>{const r=await fetch(`/tilemaps/${name}.tmj`);if(!r.ok)throw new Error(name);return(await r.json()).width;}));
  const creatures=await Promise.all([10,11,12,13,14,15].map(async id=>{const im=new Image();im.src=`/assets/creatures/pokeapi-gen1-${id}-v1.webp`;await im.decode();return im.naturalWidth>100;}));return{images,widths,creatures};
 },paths);
 expect(decoded).toEqual({images:Array(6).fill(true),widths:[40,40,40,40,32],creatures:Array(6).fill(true)});
 await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Biancavetta',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/biancavetta');
 await page.reload();await enterGame(page);await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Passobrina',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/passobrina');expect(failures).toEqual([]);
});

test('crystal resources and environmental regulation work on first offline visit',async({page,context})=>{
 test.setTimeout(120_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','badge_ghiaccio_awarded','q_d05_low_read','q_d05_middle_read'])];save.player={...save.player,mapId:'veloria/d05_grotte_cristallo',spawnPointId:'from_r14',x:29,y:3};await seedBrowserSave(page,save);
 const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/d05_grotte_cristallo');
 const resources=await page.evaluate(async()=>{
  const paths=['assets/scenery/veloria-r14_varco_cristallo-illustrated-v3.webp','assets/scenery/veloria-d05_grotte_cristallo-illustrated-v3.webp','assets/scenery/veloria-biancavetta-illustrated-v3.webp',...[41,42,74,75,95].map(i=>`assets/creatures/pokeapi-crystal-${i}-v1.webp`)];
  const images=await Promise.all(paths.map(async p=>{const im=new Image();im.src='/'+p;await im.decode();return im.naturalWidth>100;}));
  const maps=await Promise.all(['r14_varco_cristallo','d05_grotte_cristallo'].map(async m=>{const r=await fetch(`/tilemaps/${m}.tmj`);if(!r.ok)throw new Error(m);return(await r.json()).width;}));return{images,maps};
 });expect(resources).toEqual({images:Array(8).fill(true),maps:[40,40]});
 await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();
 for(const name of ['Ventilazione → Aperta','Ventilazione → Delicata','Scambio termico → Lieve','Scambio termico → Moderato','VERIFICA EQUILIBRIO','CHIUDI'])await page.getByRole('button',{name,exact:true}).tap();
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d05_climate_balanced');await page.reload();await enterGame(page);expect((await readBrowserSave(page)).flags).toContain('q_d05_climate_balanced');
 await walkTo(page,'d05_grotte_cristallo.tmj',11,29);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r14_varco_cristallo');expect(failures).toEqual([]);
});

test('P8 relays, crystal and dragon resources, and Concordia rail work offline',async({page,context})=>{
 test.setTimeout(150_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'tutorial_habitat_seen','q_starter_selected','q_concordia_restore_plan','q_d05_report','badge_circuito_awarded','badge_ghiaccio_awarded','q_concordia_visited','q_vetracielo_visited','atlas_visited_veloria/concordia','atlas_visited_veloria/vetracielo'])];save.badges=[...new Set([...save.badges,'badge_circuito','badge_brina'])];save.player={...save.player,mapId:'veloria/gym08_concordia',spawnPointId:'from_city',x:15,y:22};await seedBrowserSave(page,save);
 const failures:string[]=[];page.on('requestfailed',request=>failures.push(request.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/gym08_concordia');
 const decoded=await page.evaluate(async()=>{
  const images=['assets/scenery/veloria-concordia-illustrated-v3.webp','assets/scenery/veloria-gym08_concordia-illustrated-v3.webp','assets/scenery/veloria-r15_passo_due_luci-illustrated-v3.webp',
   'assets/creatures/pokeapi-dragon-116-v1.webp','assets/creatures/pokeapi-dragon-117-v1.webp','assets/creatures/pokeapi-dragon-147-v1.webp',
   'assets/creatures/pokeapi-dragon-148-v1.webp','assets/creatures/pokeapi-dragon-149-v1.webp','assets/creatures/pokeapi-gen1-130-v1.webp'];
  const imageResults=await Promise.all(images.map(async path=>{const image=new Image();image.src='/'+path;await image.decode();return image.naturalWidth>100&&image.naturalHeight>100;}));
  const maps=await Promise.all(['concordia','gym08_concordia','r15_passo_due_luci'].map(async name=>{const response=await fetch(`/tilemaps/${name}.tmj`);if(!response.ok)throw new Error(name);return(await response.json()).width;}));return{imageResults,maps};
 });expect(decoded).toEqual({imageResults:Array(9).fill(true),maps:[40,32,40]});
 for(const [index,x,y]of [[0,21,14],[1,21,8],[2,11,8],[3,11,14]]as const){
  await walkTo(page,'gym08_concordia.tmj',x,y+1);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'RUOTA',exact:true}).tap();
  if(index<3){expect((await readBrowserSave(page)).flags).not.toContain('gym08_convergence_complete');await page.getByRole('button',{name:'CHIUDI',exact:true}).tap();}
  if(index===3){for(let i=0;i<12&&await page.locator('#dialogue-box').isVisible();i++)await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await expect(page.locator('#dialogue-box')).toBeHidden();}
  if(index===1){await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/gym08_concordia');expect((await readBrowserSave(page)).flags).not.toContain('gym08_convergence_complete');}
 }
 await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('gym08_convergence_complete');
 await walkTo(page,'gym08_concordia.tmj',15,23);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');
 // Check the city station offline while retaining the completed P8 progression.
 await walkTo(page,'concordia.tmj',20,24);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();
 const before=travelResources(await readBrowserSave(page));await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Vetracielo',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');expect(travelResources(await readBrowserSave(page))).toEqual(before);
 await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/vetracielo');await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'Concordia',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');expect(travelResources(await readBrowserSave(page))).toEqual(before);expect(failures).toEqual([]);
});


test('Sanctuary first offline visit restores and verifies resonance, rewards once and returns to Concordia',async({page,context})=>{
 test.setTimeout(process.env.CI?240_000:150_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});
 const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','badge_drago_awarded','q_d06_nature_read','q_d06_network_read','q_d06_restore_authorized'])];save.badges=[...new Set([...save.badges,'badge_armonia'])];save.player={...save.player,mapId:'veloria/d06_santuario_due_luci',spawnPointId:'from_concordia',x:15,y:22};await seedBrowserSave(page,save);const initialMoney=save.player.money,initialItems=save.inventory['hyper-potion']??0;
 const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/d06_santuario_due_luci');
 expect(await page.evaluate(async()=>{const image=new Image();image.src='/assets/scenery/veloria-d06_santuario_due_luci-illustrated-v3.webp';await image.decode();const response=await fetch('/tilemaps/d06_santuario_due_luci.tmj');return[image.naturalWidth>1000,(await response.json()).width];})).toEqual([true,32]);
 const confirm=()=>page.getByRole('button',{name:'Conferma e interagisci',exact:true});
 async function finishDialogue(){for(let i=0;i<24&&await page.locator('#dialogue-box').isVisible();i++)await confirm().tap();await expect(page.locator('#dialogue-box')).toBeHidden();}
 await walkTo(page,'d06_santuario_due_luci.tmj',16,16);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();for(const name of ['Flusso naturale → Graduale','Amplificazione → Controllata','Sincronia → Parziale','Sincronia → Condivisa','VERIFICA EQUILIBRIO','CHIUDI'])await page.getByRole('button',{name,exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d06_balance_restored');
 await page.reload();await enterGame(page);await walkTo(page,'d06_santuario_due_luci.tmj',16,6);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();await finishDialogue();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_d06_receiver_confirmed');
 await walkTo(page,'d06_santuario_due_luci.tmj',18,18);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();await finishDialogue();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_resonance_restored');
 await page.reload();await enterGame(page);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm().tap();await finishDialogue();const after=await readBrowserSave(page);expect(after.player.money).toBe(initialMoney+1000);expect(after.inventory['hyper-potion']).toBe(initialItems+2);
 await walkTo(page,'d06_santuario_due_luci.tmj',15,23);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');expect(failures).toEqual([]);
});


test('R16 and League forecourt resources, services and the full walking return work on first offline visit',async({page,context})=>{
 test.setTimeout(process.env.CI?300_000:180_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','q_resonance_restored'])];save.player={...save.player,mapId:'veloria/r16_cammino_equilibrio',spawnPointId:'from_concordia',x:1,y:19,money:5000};
 const creature=createBattleCreature({species:speciesRegistry.species as any,moves:moveRegistry.moves as any,speciesId:6,level:50,instanceId:'offline-league',moveIds:['flamethrower','wing-attack']});save.party=[{instanceId:creature.instanceId,speciesId:6,level:50,experience:0,hp:1,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:1}))}];await seedBrowserSave(page,save);
 const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/r16_cammino_equilibrio');
 expect(await page.evaluate(async()=>{const images=await Promise.all(['veloria-r16_cammino_equilibrio-illustrated-v3','veloria-league_forecourt-illustrated-v3'].map(async key=>{const i=new Image();i.src='/assets/scenery/'+key+'.webp';await i.decode();return i.naturalWidth>1000;}));const widths=await Promise.all(['r16_cammino_equilibrio','league_forecourt'].map(async slug=>{const r=await fetch('/tilemaps/'+slug+'.tmj');if(!r.ok)throw new Error(slug);return(await r.json()).width;}));return{images,widths};})).toEqual({images:[true,true],widths:[40,40]});
 await walkTo(page,'r16_cammino_equilibrio.tmj',39,1);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/league_forecourt');await page.reload();await enterGame(page);await walkTo(page,'league_forecourt.tmj',9,15);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'RIPOSA',exact:true}).tap();for(let i=0;i<12&&await page.locator('#dialogue-box').isVisible();i++)await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).party[0].hp).toBe(creature.stats.maxHp);expect((await readBrowserSave(page)).party[0].moves[0].pp).toBe(moveRegistry.moves['flamethrower'].maxPp);
 await walkTo(page,'league_forecourt.tmj',31,15);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await buyFromShop(page, 'Iperpozione');await expect.poll(async()=>(await readBrowserSave(page)).inventory['hyper-potion']).toBe(1);
 await walkTo(page,'league_forecourt.tmj',0,15);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/r16_cammino_equilibrio');await walkTo(page,'r16_cammino_equilibrio.tmj',0,19);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/concordia');await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.money).toBe(3500);expect((await readBrowserSave(page)).inventory['hyper-potion']).toBe(1);expect(failures).toEqual([]);
});


test('League rooms cache offline and a real final battle completes the championship and epilogue',async({page,context})=>{
 test.setTimeout(process.env.CI?360_000:240_000);await page.goto('/');await enterGame(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),undefined,{timeout:30_000});const save=await readBrowserSave(page);save.flags=[...new Set([...save.flags,'q_starter_selected','q_resonance_restored','q_league_orientation','prologue_complete_seen',leagueSequence.activeFlag,...leagueSequence.stages.slice(0,4).flatMap(stage=>[stage.attemptWonFlag,stage.firstRewardFlag,stage.battleOnceFlag])])];save.badges=leagueSequence.requiredBadgeIds;save.player={...save.player,mapId:'veloria/league_champion',spawnPointId:'from_entry',x:15,y:21,money:1000};
 // Four previous wins are a checkpoint fixture. Only the final battle is claimed as played offline.
 const creature=createBattleCreature({species:speciesRegistry.species as any,moves:moveRegistry.moves as any,speciesId:87,level:100,instanceId:'offline-final',moveIds:['ice-beam']});save.party=Array.from({length:6},(_,index)=>({instanceId:`offline-final-${index}`,speciesId:87,level:100,experience:0,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(m=>({id:m.moveId,pp:m.pp}))}));await seedBrowserSave(page,save);const failures:string[]=[];page.on('requestfailed',r=>failures.push(r.url()));await context.setOffline(true);await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.mapId).toBe('veloria/league_champion');
 expect(await page.evaluate(async()=>Promise.all(['council01','council02','council03','council04','champion'].map(async slug=>{const image=new Image();image.src='/assets/scenery/'+('veloria-league_'+slug+'-illustrated-v3')+'.webp';await image.decode();const r=await fetch('/tilemaps/league_'+slug+'.tmj');return image.naturalWidth>1000&&r.ok&&(await r.json()).width===32;})))).toEqual(Array(5).fill(true));
 await walkTo(page,'league_champion.tmj',16,8);await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await page.getByRole('button',{name:'Conferma e interagisci',exact:true}).tap();await page.getByRole('button',{name:'SFIDA',exact:true}).tap();await expect(page.locator('body')).toHaveClass(/battle-active/);
 for(let input=0;input<600&&await page.locator('body').evaluate(b=>b.classList.contains('battle-active'));input++){if(await page.locator('.battle-celebration').isVisible()){await page.getByRole('button',{name:'Continua',exact:true}).tap();break;}await page.keyboard.press('Enter');await page.waitForTimeout(100);}
 const ceremony=page.getByRole('dialog',{name:'Campione di Veloria!'});await expect(ceremony).toBeVisible();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_league_completed');await ceremony.getByRole('button',{name:'Leggi l’epilogo',exact:true}).tap();await page.getByRole('button',{name:'Torna a Veloria',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain('q_league_epilogue_seen');await page.reload();await enterGame(page);expect((await readBrowserSave(page)).player.money).toBe(16000);await walkTo(page,'league_champion.tmj',15,23);await expect.poll(async()=>(await readBrowserSave(page)).player.mapId).toBe('veloria/league_forecourt');expect(failures).toEqual([]);
});


test('new route trainer data and Celia battle work on first offline visit', async ({ page, context }) => {
  test.setTimeout(process.env.CI ? 240_000 : 150_000);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'prologue_complete_seen'])];
  save.player = { ...save.player, mapId: 'veloria/r11_via_cascate', spawnPointId: 'from_acquariva', x: 15, y: 18, money: 2000 };
  const c = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 20, level: 80, instanceId: 'offline-celia', moveIds: ['crunch'] });
  save.party = [{ instanceId: c.instanceId, speciesId: 20, level: 80, experience: 0,
    hp: c.hp, maxHp: c.stats.maxHp, moves: c.moves.map(m => ({ id: m.moveId, pp: m.pp })) }];
  await seedBrowserSave(page, save);
  const failures: string[] = [];
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  expect(await page.evaluate(async () => Promise.all([
    ['r06_anello_magnetico', 'r06_iris'], ['r07_condotto_risonante', 'r07_dario'],
    ['r08_costa_turbine', 'r08_viola'], ['r11_via_cascate', 'r11_celia'],
  ].map(async ([map, key]) => {
    const r = await fetch(`/tilemaps/${map}.tmj`);
    const tiled = await r.json();
    return r.ok && tiled.layers.flatMap((l: any) => l.objects ?? []).some((o: any) =>
      o.properties?.some((p: any) => p.name === 'trainerId' && p.value === `veloria/trainer_${key}`));
  })))).toEqual([true, true, true, true]);
  const a = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await a.tap();
  for (let i = 0; i < 20 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); i++) await a.tap();
  await page.getByRole('button', { name: 'SFIDA', exact: true }).tap();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for (let input = 0; input < 400 && await page.locator('body').evaluate(b => b.classList.contains('battle-active')); input++) {
    if (await page.locator('.battle-celebration').isVisible()) {
      await page.getByRole('button', { name: 'Continua', exact: true }).tap(); break;
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  }
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_r11_celia_helped');
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).player.money).toBe(3500);
  await walkTo(page, 'r11_via_cascate.tmj', 16, 29);
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/acquariva');
  expect(failures).toEqual([]);
});


test('illustrated Borgofonte decodes on its first offline request', async ({ page, context }) => {
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30000 });
  await context.setOffline(true);
  expect(await page.evaluate(async () => {
    const image = new Image(); image.src = new URL('assets/scenery/veloria-borgofonte-illustrated-v3.webp', location.href).href;
    await image.decode(); return { width: image.naturalWidth, height: image.naturalHeight };
  })).toEqual({ width: 1470, height: 1070 });
});

test('registered illustrated environments decode on their first offline request', async ({ page, context }) => {
  test.setTimeout(120_000);
  const manifest = JSON.parse(await readFile(new URL('../../assets/map-parity-v2.json', import.meta.url), 'utf8'));
  const artworks = manifest.artworks.filter((art: any) => art.mapId !== 'veloria/borgofonte')
    .map((art: any) => ({ mapId: art.mapId, path: art.runtimePath.replace(/^public\//, ''), width: art.width, height: art.height }));
  expect(artworks.length).toBeGreaterThan(0);
  const errors: string[] = [];
  const failures: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  // Only the initial town has rendered. None of these environments may be warmed by visiting its map.
  const warmed = await page.evaluate((assets: {mapId: string; path: string}[]) => {
    const resources = performance.getEntriesByType('resource').map(entry => entry.name);
    return assets.filter(art => resources.some(url => url.includes(`/${art.path}`))).map(art => art.mapId);
  }, artworks);
  expect(warmed).toEqual([]);
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true);
  const decoded = await page.evaluate(async (assets: {mapId: string; path: string}[]) => Promise.all(assets.map(async art => {
    const image = new Image();
    image.src = new URL(art.path, location.href).href;
    await image.decode();
    return { mapId: art.mapId, width: image.naturalWidth, height: image.naturalHeight };
  })), artworks);
  expect(decoded).toEqual(artworks.map(({mapId, width, height}: any) => ({mapId, width, height})));
  expect((await readBrowserSave(page)).player.mapId).toBe('veloria/borgofonte');
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
});

test('Riduttore strategy, battle and HP/PP survive an offline reload', async ({ page, context }) => {
  test.setTimeout(150_000);
  const errors: string[] = [], failures: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  // Integration fixture with the official level-15 Bulbasaur move; not a natural playtest.
  const save = await readBrowserSave(page);
  const c = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 1, level: 15, instanceId: 'offline-recoil', moveIds: ['take-down'] });
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'prologue_complete_seen'])];
  save.player = { ...save.player, mapId: 'veloria/d01_bosco_veli', spawnPointId: 'from_r01', x: 2, y: 9 };
  save.rngState = findDeterministicEncounterSeed(d01Woodland, 0.18, d01Woodland.timeBands.day[0].speciesId);
  save.party = [{ instanceId: c.instanceId, speciesId: 1, level: 15, experience: 0,
    hp: c.hp, maxHp: c.stats.maxHp, moves: c.moves.map(move => ({ id: move.moveId, pp: move.pp })) }];
  await seedBrowserSave(page, save);
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri la squadra' }).click();
  const panel = page.getByRole('dialog', { name: 'Squadra' });
  await panel.getByRole('button', { name: /Bulbasaur/ }).click();
  await expect(panel).toContainText('Riduttore');
  await expect(panel).toContainText('25% dei danni inflitti');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  await expect(page.locator('#game')).not.toHaveAttribute('aria-busy', 'true');
  await tapBattleControl(page, 'moves'); await tapBattleControl(page, 0);
  for (let action = 0; action < 100 && await page.locator('body').evaluate(body => body.classList.contains('battle-active')); action++) {
    if (await page.locator('.battle-celebration').isVisible()) {
      await page.getByRole('button', { name: 'Continua', exact: true }).click(); break;
    }
    await page.keyboard.press('Enter', { delay: 40 }); await page.waitForTimeout(100);
  }
  await expect(page.locator('body')).not.toHaveClass(/battle-active/);
  const result = (await readBrowserSave(page)).party[0];
  expect(result.hp).toBeGreaterThan(0);
  expect(result.hp).toBeLessThan(c.hp);
  expect(result.experience).toBeGreaterThan(0);
  expect(result.moves[0].pp).toBeLessThan(c.moves[0].pp);
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).party[0]).toEqual(result);
  expect(failures).toEqual([]); expect(errors).toEqual([]);
});

test('new dune training battle and reward persist offline', async ({ page, context }) => {
  test.setTimeout(process.env.CI ? 240_000 : 150_000);
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'prologue_complete_seen'])];
  save.player = { ...save.player, mapId: 'veloria/r09_dune_salmastre', spawnPointId: 'from_portolume', x: 28, y: 10, money: 2000 };
  const c = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
    speciesId: 20, level: 80, instanceId: 'offline-noemi', moveIds: ['crunch'] });
  save.party = [{ instanceId: c.instanceId, speciesId: 20, level: 80, experience: 0,
    hp: c.hp, maxHp: c.stats.maxHp, moves: c.moves.map(m => ({ id: m.moveId, pp: m.pp })) }];
  await seedBrowserSave(page, save);
  const failures: string[] = [];
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  expect(await page.evaluate(async () => Promise.all([
    ['r09_dune_salmastre', 'r09_noemi'], ['r10_sentiero_canne', 'r10_bruno'],
    ['r12_valle_vento', 'r12_ruben'], ['r13_tornanti_bianchi', 'r13_alma'],
  ].map(async ([map, key]) => {
    const r = await fetch(`/tilemaps/${map}.tmj`);
    const tiled = await r.json();
    return r.ok && tiled.layers.flatMap((l: any) => l.objects ?? []).some((o: any) =>
      o.properties?.some((p: any) => p.name === 'trainerId' && p.value === `veloria/trainer_${key}`));
  })))).toEqual([true, true, true, true]);
  const a = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await a.tap();
  for (let i = 0; i < 20 && !await page.getByRole('button', { name: 'SFIDA', exact: true }).isVisible(); i++) await a.tap();
  await page.getByRole('button', { name: 'SFIDA', exact: true }).tap();
  await expect(page.locator('body')).toHaveClass(/battle-active/);
  for (let input = 0; input < 400 && await page.locator('body').evaluate(b => b.classList.contains('battle-active')); input++) {
    if (await page.locator('.battle-celebration').isVisible()) {
      await page.getByRole('button', { name: 'Continua', exact: true }).tap(); break;
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  }
  await expect.poll(async () => (await readBrowserSave(page)).flags).toContain('q_r09_noemi_helped');
  await page.reload(); await enterGame(page);
  expect((await readBrowserSave(page)).player.money).toBe(3250);
  await walkTo(page, 'r09_dune_salmastre.tmj', 39, 17);
  await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe('veloria/d04_delta_specchi');
  expect(failures).toEqual([]);
});


test('bulk storage and market work offline and persist after reload', async ({ page, context }) => {
  test.setTimeout(150_000);
  const errors: string[] = [], failures: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await enterGame(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  const save = await readBrowserSave(page);
  save.party = [25, 16].map((speciesId, index) => {
    const c = createBattleCreature({ species: speciesRegistry.species as any, moves: moveRegistry.moves as any,
      speciesId, level: 5, instanceId: `offline-service-${index}` });
    return { instanceId: c.instanceId, speciesId, level: 5, experience: 0, hp: c.hp,
      maxHp: c.stats.maxHp, moves: c.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) };
  });
  save.storage = [];
  save.player = { ...save.player, mapId: 'veloria/portolume', spawnPointId: 'from_r08', x: 8, y: 15, money: 1000 };
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'prologue_complete_seen', 'pokedex_seen_104'])];
  save.inventory = { potion: 0 };
  await seedBrowserSave(page, save);
  page.on('requestfailed', request => failures.push(request.url()));
  await context.setOffline(true); await page.reload(); await enterGame(page);
  await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
  await page.getByRole('button', { name: 'Apri il Pokédex' }).click();
  await page.getByRole('dialog', { name: 'Pokédex', exact: true }).getByRole('button', { name: /Cubone.*VISTO/ }).click();
  const habitats = page.getByRole('region', { name: 'Dove incontrarlo' });
  await expect(habitats).toContainText('Condotto Risonante');
  await expect(habitats).toContainText('Erba alta · Lv.18–21');
  await expect(habitats).toContainText('Muschio occidentale');
  await page.keyboard.press('Escape');
  const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await action.tap();
  await page.getByRole('button', { name: 'DEPOSITO', exact: true }).click();
  const depot = page.getByRole('dialog', { name: 'Deposito Pokémon' });
  await depot.getByRole('region', { name: 'Squadra', exact: true }).getByRole('button').nth(1).click();
  await depot.getByRole('button', { name: 'Sposta selezionati' }).click();
  await expect(depot).toHaveAttribute('aria-busy', 'false');
  await depot.getByRole('region', { name: 'Box', exact: true }).getByRole('button').click();
  await depot.getByRole('button', { name: 'Sposta selezionati' }).click();
  await expect(depot).toHaveAttribute('aria-busy', 'false');
  await depot.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await walkTo(page, 'portolume.tmj', 14, 15);
  await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap(); await action.tap();
  await buyFromShop(page, 'Pozione', 3);
  await page.reload(); await enterGame(page);
  const restored = await readBrowserSave(page);
  expect(restored.party).toEqual(save.party);
  expect(restored.storage).toEqual([]);
  expect(restored.inventory.potion).toBe(3);
  expect(restored.player.money).toBe(400);
  expect(failures).toEqual([]); expect(errors).toEqual([]);
});
