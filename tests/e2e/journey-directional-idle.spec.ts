import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import poseManifest from '../../assets/npc-idle-views-v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

for (const npc of [
  {"name": "Consiglio Nerea", "speaker": "Nerea", "profile": "league-council-nerea", "map": "league_council01", "tiled": "league_council01", "id": "league_council1", "spawn": "from_entry", "x": 16, "y": 7, "flags": ["q_starter_selected", "intro_completed", "tutorial_habitat_seen", "prologue_complete_seen", "q_resonance_restored", "challenge_velorialeague_active"], "badges": ["badge_aurora", "badge_corolla", "badge_circuito", "badge_acciaio", "badge_marea", "badge_riflesso", "badge_brina", "badge_armonia"], "service": "challenge"},
  {"name": "Consiglio Silvo", "speaker": "Silvo", "profile": "league-council-silvo", "map": "league_council02", "tiled": "league_council02", "id": "league_council2", "spawn": "from_entry", "x": 16, "y": 7, "flags": ["q_starter_selected", "intro_completed", "tutorial_habitat_seen", "prologue_complete_seen", "q_resonance_restored", "challenge_velorialeague_active", "challenge_velorialeague_won_council1", "trainer_league_council1_defeated", "challenge_velorialeague_paid_council1"], "badges": ["badge_aurora", "badge_corolla", "badge_circuito", "badge_acciaio", "badge_marea", "badge_riflesso", "badge_brina", "badge_armonia"], "service": "challenge"},
  {"name": "Consiglio Brando", "speaker": "Brando", "profile": "league-council-brando", "map": "league_council03", "tiled": "league_council03", "id": "league_council3", "spawn": "from_entry", "x": 16, "y": 7, "flags": ["q_starter_selected", "intro_completed", "tutorial_habitat_seen", "prologue_complete_seen", "q_resonance_restored", "challenge_velorialeague_active", "challenge_velorialeague_won_council1", "trainer_league_council1_defeated", "challenge_velorialeague_paid_council1", "challenge_velorialeague_won_council2", "trainer_league_council2_defeated", "challenge_velorialeague_paid_council2"], "badges": ["badge_aurora", "badge_corolla", "badge_circuito", "badge_acciaio", "badge_marea", "badge_riflesso", "badge_brina", "badge_armonia"], "service": "challenge"},
  {"name": "Consiglio Luce", "speaker": "Luce", "profile": "league-council-luce", "map": "league_council04", "tiled": "league_council04", "id": "league_council4", "spawn": "from_entry", "x": 16, "y": 7, "flags": ["q_starter_selected", "intro_completed", "tutorial_habitat_seen", "prologue_complete_seen", "q_resonance_restored", "challenge_velorialeague_active", "challenge_velorialeague_won_council1", "trainer_league_council1_defeated", "challenge_velorialeague_paid_council1", "challenge_velorialeague_won_council2", "trainer_league_council2_defeated", "challenge_velorialeague_paid_council2", "challenge_velorialeague_won_council3", "trainer_league_council3_defeated", "challenge_velorialeague_paid_council3"], "badges": ["badge_aurora", "badge_corolla", "badge_circuito", "badge_acciaio", "badge_marea", "badge_riflesso", "badge_brina", "badge_armonia"], "service": "challenge"},
  {"flags": [], "speaker": "Guida Livia", "x": 29, "y": 11, "tiled": "r14_varco_cristallo", "map": "r14_varco_cristallo", "id": "r14_guide", "name": "Guida Livia", "profile": "r14-guide-livia", "spawn": "from_biancavetta"},
  {"flags": [], "spawn": "from_r13", "y": 15, "profile": "biancavetta-guide", "tiled": "biancavetta", "map": "biancavetta", "name": "Guida di Biancavetta", "speaker": "Guida di Biancavetta", "southBlocked": true, "id": "biancavetta_guide", "x": 32},
  {"flags": [], "spawn": "from_r12", "y": 13, "profile": "passobrina-alpine-guide", "westBlocked": true, "tiled": "passobrina", "map": "passobrina", "name": "Guida alpina di Passobrina", "speaker": "Guida alpina", "id": "passobrina_guide", "x": 28},
  { name: 'Tecnica della Centrale', speaker: 'Tecnica della Centrale', profile: 'centrale-technician', map: 'd03_centrale_risonante', spawn: 'from_r07', x: 12, y: 17, flags: ['q_r07_measurement'], tiled: 'd03_centrale_risonante', id: 'centrale_technician' },
  {"name": "Teo", "speaker": "Teo", "profile": "delta-naturalist-teo", "map": "d04_delta_specchi", "spawn": "from_r09", "x": 24, "y": 6, "flags": ["trainer_delta_teo_defeated"], "tiled": "d04_delta_specchi", "id": "delta_teo", "northBlocked": true},
  {"name": "Celia", "speaker": "Celia", "profile": "route-trainer-celia-r11", "map": "r11_via_cascate", "spawn": "from_acquariva", "x": 15, "y": 17, "flags": ["trainer_r11_celia_defeated"], "tiled": "r11_via_cascate", "id": "r11_celia", "eastBlocked": true},
  {"name": "Ruben", "speaker": "Ruben", "profile": "route-trainer-ruben-r12", "map": "r12_valle_vento", "spawn": "from_acquariva", "x": 24, "y": 7, "flags": ["trainer_r12_ruben_defeated"], "tiled": "r12_valle_vento", "id": "r12_ruben"},
  {"name": "Alma", "speaker": "Alma", "profile": "route-trainer-alma-r13", "map": "r13_tornanti_bianchi", "spawn": "from_passobrina", "x": 25, "y": 13, "flags": ["trainer_r13_alma_defeated"], "tiled": "r13_tornanti_bianchi", "id": "r13_alma", "northBlocked": true},
  { name: 'Lina', speaker: 'Lina', profile: 'route-trainer-lina-r09', map: 'r09_dune_salmastre', spawn: 'from_portolume', x: 18, y: 8, flags: ['trainer_r09_lina_defeated'], tiled: 'r09_dune_salmastre', id: 'r09_lina', northBlocked: true },
  { name: 'Noemi', speaker: 'Noemi', profile: 'route-trainer-noemi-r09', map: 'r09_dune_salmastre', spawn: 'from_portolume', x: 28, y: 9, flags: ['trainer_r09_noemi_defeated'], tiled: 'r09_dune_salmastre', id: 'r09_noemi' },
  { name: 'Maya', speaker: 'Maya', profile: 'route-trainer-maya-r10', map: 'r10_sentiero_canne', spawn: 'from_delta', x: 20, y: 8, flags: ['trainer_r10_maya_defeated'], tiled: 'r10_sentiero_canne', id: 'r10_maya', westBlocked: true },
  { name: 'Bruno', speaker: 'Bruno', profile: 'route-trainer-bruno-r10', map: 'r10_sentiero_canne', spawn: 'from_delta', x: 16, y: 13, flags: ['trainer_r10_bruno_defeated'], tiled: 'r10_sentiero_canne', id: 'r10_bruno', northBlocked: true },
  { name: 'Iris Delta', speaker: 'Iris', profile: 'delta-biologist-iris', map: 'd04_delta_specchi', spawn: 'from_r09', x: 13, y: 18, flags: [], southBlocked: true, tiled: 'd04_delta_specchi', id: 'delta_iris' },
  { name: 'Viola', speaker: 'Viola', profile: 'route-trainer-viola-r08', map: 'r08_costa_turbine', spawn: 'from_portolume', x: 20, y: 11, flags: ['trainer_r08_viola_defeated'], tiled: 'r08_costa_turbine', id: 'r08_viola' },
  { name: 'Marina', speaker: 'Capitana Marina', profile: 'portolume-captain-marina', map: 'portolume', spawn: 'from_r08', x: 22, y: 15, flags: [], eastBlocked: true, tiled: 'portolume', id: 'portolume_captain' },
  { name: 'Tessa', speaker: 'Tessa', profile: 'acquariva-tessa', map: 'acquariva', spawn: 'from_r10', x: 34, y: 14, flags: [], tiled: 'acquariva', id: 'acquariva_tessa' },
  { name: 'Dario', speaker: 'Dario', profile: 'route-trainer-dario', map: 'r07_condotto_risonante', spawn: 'from_ferraluce', x: 18, y: 18, flags: ['trainer_r07_dario_defeated'], tiled: 'r07_condotto_risonante', id: 'r07_dario' },
  { name: 'Ivo Ferraluce', speaker: 'Ivo', profile: 'ferraluce-ivo', map: 'ferraluce', spawn: 'from_r06', x: 20, y: 20, flags: ['q_r06_measurement', 'q_ferraluce_report', 'q_centrale_output', 'q_centrale_report'], tiled: 'ferraluce', id: 'ferraluce_ivo' },
  { name: 'Centro Ferraluce', speaker: 'Addetta del Centro', profile: 'ferraluce-care', map: 'ferraluce', spawn: 'from_r06', x: 9, y: 21, flags: [], tiled: 'ferraluce', id: 'ferraluce_care', service: 'center' },
  { name: 'Mercante Ferraluce', speaker: 'Mercante di Ferraluce', profile: 'ferraluce-shop', map: 'ferraluce', spawn: 'from_r06', x: 30, y: 21, flags: [], tiled: 'ferraluce', id: 'ferraluce_shop', service: 'shop' },
  { name: 'Nila', speaker: 'Nila', profile: 'route-trainer-nila', map: 'r04_salita_petali', spawn: 'from_radicelmo', x: 10, y: 16, flags: ['trainer_r04_nila_defeated'], tiled: 'r04_salita_petali', id: 'nila_r04' },
  { name: 'Oren', speaker: 'Oren', profile: 'route-trainer-oren', map: 'r05_viadotto_ciliegi', spawn: 'from_petalora', x: 18, y: 12, flags: ['trainer_r05_oren_defeated'], tiled: 'r05_viadotto_ciliegi', id: 'oren_r05' },
  { name: 'Iris R06', speaker: 'Iris', profile: 'route-trainer-iris-r06', map: 'r06_anello_magnetico', spawn: 'from_vetracielo', x: 21, y: 16, flags: ['trainer_r06_iris_defeated', 'q_r06_iris_helped'], tiled: 'r06_anello_magnetico', id: 'r06_iris' },
  { name: 'Rami', speaker: 'Rami', profile: 'guide-rami-r03', map: 'r03_terrazze_muschio', tiled: 'r03_terrazze_muschio', id: 'r03_path_guide', spawn: 'from_brumalta', x: 6, y: 16, flags: [] },
  { name: 'Leda', speaker: 'Custode Leda', profile: 'radicelmo-keeper-leda', map: 'radicelmo', tiled: 'radicelmo', id: 'radicelmo_keeper', spawn: 'from_r03', x: 25, y: 11, flags: ['q_radicelmo_seed_found', 'q_radicelmo_seed_archived', 'q_radicelmo_greenhouse_started', 'q_radicelmo_seed_sprouted', 'q_radicelmo_greenhouse_complete', 'q_radicelmo_fire_stone_found'] },
  { name: 'Lea', speaker: 'Lea', profile: 'vetracielo-lea', map: 'vetracielo', tiled: 'vetracielo', id: 'vetracielo_lea', spawn: 'from_r05', x: 22, y: 18, flags: ['q_vetracielo_orientation'] },
]) test(`${npc.name} keeps a stable identity, foot anchor and authored approaches in ${npc.map}`, async ({ page }, info) => {
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
  const profile = appearances.profiles.find(item => item.id === npc.profile)! as any;
  const manifestProfile = poseManifest.profiles.find(item => item.profileId === npc.profile) as any;
  expect(manifestProfile, `Pose manifest for ${npc.profile}`).toBeTruthy();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    await route.fulfill({ response, body: await response.text() + '\nwindow.__journeyIdleGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
    'prologue_complete_seen', ...npc.flags])];
  if ('badges' in npc) save.badges = [...npc.badges];
  save.player = { ...save.player, mapId: `veloria/${npc.map}`, spawnPointId: npc.spawn, x: 'southBlocked' in npc ? npc.x - 1 : npc.x, y: 'southBlocked' in npc ? npc.y : npc.y + 1 };
  const tiled = JSON.parse(await readFile(`public/tilemaps/${npc.tiled}.tmj`, 'utf8'));
  const blocked = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, save.flags);
  expect(blocked.has(`${npc.x},${npc.y - 1}`)).toBe('northBlocked' in npc);
  expect(blocked.has(`${npc.x + 1},${npc.y}`)).toBe('eastBlocked' in npc);
  if ('southBlocked' in npc) expect(blocked.has(`${npc.x},${npc.y + 1}`)).toBe(true);
  if ('westBlocked' in npc) expect(blocked.has(`${npc.x - 1},${npc.y}`)).toBe(true);
  for (const mode of ['reduced', 'full']) {
    await page.evaluate(mode => localStorage.setItem('veloria-animation-quality', mode), mode);
    await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
    for (const stop of [
      { x: npc.x, y: npc.y + 1, facing: 'down', button: 'Vai in alto' },
      { x: npc.x - 1, y: npc.y, facing: 'left', button: 'Vai a destra' },
      { x: npc.x, y: npc.y - 1, facing: 'up', button: 'Vai in basso' },
      { x: npc.x + 1, y: npc.y, facing: 'right', button: 'Vai a sinistra' },
    ].filter(stop => !('southBlocked' in npc && stop.facing === 'down') && !('northBlocked' in npc && stop.facing === 'up') && !('eastBlocked' in npc && stop.facing === 'right') && !('westBlocked' in npc && stop.facing === 'left'))) {
      await walkTo(page, `${npc.tiled}.tmj`, stop.x, stop.y, { avoidEncounters: true });
      await page.getByRole('button', { name: stop.button, exact: true }).tap();
      const before = await readBrowserSave(page);
      const action = page.getByRole('button', { name: 'Conferma e interagisci', exact: true });
      await action.tap();
      if ('service' in npc && npc.service === 'shop') {
        const shop = page.getByRole('dialog', { name: 'Mercante di Ferraluce', exact: true });
        await expect(shop.getByRole('spinbutton', { name: 'Quantità Pozione', exact: true })).toBeVisible();
        await shop.getByRole('button', { name: 'Chiudi', exact: true }).click();
      } else if ('service' in npc && npc.service === 'challenge') {
        await expect(page.getByRole('button', { name: 'SFIDA', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'NON ORA', exact: true }).click();
      } else if ('service' in npc && npc.service === 'center') {
        await expect(page.getByRole('button', { name: 'RIPOSA', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'DOPO', exact: true }).click();
      } else {
        await expect(page.locator('#dialogue-speaker')).toHaveText(npc.speaker);
        for (let i = 0; i < 16 && await page.locator('#dialogue-box').isVisible(); i++) await action.tap();
      }
      await expect(page.locator('#dialogue-box')).toBeHidden();
      const state = await page.evaluate(id => {
        const world = (window as any).__journeyIdleGame.scene.keys.world;
        const sprite = world.mapLayer.list.find((item: any) => item.name === 'npc-sprite' && item.getData('npcId') === id);
        const image = sprite.texture.getSourceImage();
        return { key: sprite.texture.key, facing: sprite.getData('npcFacing'), x: sprite.x, y: sprite.y,
          origin: { x: sprite.originX, y: sprite.originY }, height: sprite.displayHeight,
          uniform: sprite.scaleX === sprite.scaleY, flipped: sprite.flipX || sprite.flipY,
          compact: image instanceof HTMLCanvasElement && Math.max(image.width, image.height) <= 512,
          legacyRoute: world.textures.exists('veloria-route-trainers-r04-r07-v1'),
          legacyServices: world.textures.exists('veloria-ferraluce-service-npcs-v1'),
          legacyCoastal: world.textures.exists('veloria-r09-r10-coastal-trainers-v1'),
          legacyTechnician: world.textures.exists('veloria-centrale-technician-v1'),
          legacyGuides: world.textures.exists('veloria-guides-and-keepers-v1'),
          webgl: Boolean(world.game.renderer.gl), minFilter: sprite.texture.source[0].glTexture?.minFilter,
          frameRatio: sprite.frame.width / sprite.frame.height,
          powerOfTwo: (image.width & (image.width - 1)) === 0 && (image.height & (image.height - 1)) === 0,
          tweens: world.tweens.getTweensOf(sprite).length,
          abovePlayer: world.mapLayer.list.indexOf(sprite) > world.mapLayer.list.indexOf(world.player) };
      }, npc.id);
      const view = profile.idleViews[stop.facing];
      const manifestView = manifestProfile.views.find((entry: any) => entry.assetKey === view.assetKey);
      expect(manifestView, `Source dimensions for ${view.assetKey}`).toBeTruthy();
      expect(manifestView.width).toBeGreaterThan(0);
      expect(manifestView.height).toBeGreaterThan(0);
      expect(state).toMatchObject({ key: view.assetKey, facing: stop.facing, x: npc.x * 32 + 16, y: npc.y * 32 + 35,
        origin: view.origin, uniform: true, flipped: false, compact: true, tweens: 0, abovePlayer: stop.y <= npc.y });
      expect(state.height).toBeCloseTo(view.displaySize, 5);
      if (/^r0[4-7]_/.test(npc.map)) expect(state.legacyRoute).toBe(false);
      if (npc.map === 'ferraluce') expect(state.legacyServices).toBe(false);
      if (/^r(09|10)_/.test(npc.map)) expect(state.legacyCoastal).toBe(false);
      if (npc.profile === 'centrale-technician') expect(state.legacyTechnician).toBe(false);
      if (['biancavetta', 'passobrina', 'r14_varco_cristallo'].includes(npc.map)) expect(state.legacyGuides).toBe(false);
      expect(state.frameRatio).toBeCloseTo(manifestView.width / manifestView.height, 8);
      if (state.webgl) {
        expect(state.powerOfTwo).toBe(true);
        expect(state.minFilter).toBe(0x2703); // LINEAR_MIPMAP_LINEAR, retained after every direction change.
      }
      const after = await readBrowserSave(page);
      for (const key of ['player', 'flags', 'party', 'inventory', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
      for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
        await page.setViewportSize(viewport);
        await page.screenshot({ path: info.outputPath(`${npc.name}-${mode}-${stop.facing}-${viewport.width}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});
