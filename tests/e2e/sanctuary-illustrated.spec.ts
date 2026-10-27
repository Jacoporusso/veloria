import { expect, test } from '@playwright/test';
import { createBattleCreature } from '../../src/core/battle/create-creature';
import species from '../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkTo } from './helpers/world-navigation';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

for (const state of ['before-league', 'available', 'caught'] as const) {
  test(`illustrated sanctuary keeps Mewtwo clearing correct: ${state}`, async ({ page }, info) => {
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nwindow.__sanctuaryArtGame = game;' });
    });
    await page.goto('/'); await enterGame(page);
    const save = await readBrowserSave(page);
    const creature = createBattleCreature({ species: species.species as any, moves: moves.moves as any,
      speciesId: 1, level: 8, instanceId: 'sanctuary-art-review' });
    save.party = [{ instanceId: creature.instanceId, speciesId: 1, level: 8, experience: 0,
      hp: creature.hp, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: slot.pp })) }];
    save.flags = [...new Set([...save.flags, 'q_starter_selected', 'intro_completed', 'tutorial_habitat_seen',
      'prologue_complete_seen', ...(state === 'before-league' ? [] : ['q_league_completed', 'q_league_epilogue_seen']),
      ...(state === 'caught' ? ['q_special_mewtwo_caught'] : [])])];
    save.player = { ...save.player, mapId: 'veloria/d06_santuario_due_luci', spawnPointId: 'from_concordia', x: 21, y: 17 };
    await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
    const available = state === 'available';
    expect(await page.evaluate(() => {
      const world = (window as any).__sanctuaryArtGame.scene.keys.world;
      return { blocked: world.occupied.has('21,16'), sprites: world.mapLayer.list.filter((item: any) =>
        item.name === 'special-pokemon-sprite' && item.texture.key === 'pokeapi-gen1-150-v1').length };
    })).toEqual({ blocked: available, sprites: available ? 1 : 0 });
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.screenshot({ path: info.outputPath(`mewtwo-${state}-${viewport.width}.png`) });
    }
    if (available) {
      await page.getByRole('button', { name: 'Vai in alto', exact: true }).tap();
      expect((await readBrowserSave(page)).player).toMatchObject({ x: 21, y: 17 });
      const before = await readBrowserSave(page);
      await page.getByRole('button', { name: 'Conferma e interagisci', exact: true }).tap();
      await expect(page.getByRole('button', { name: 'INCONTRA', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'MI PREPARO', exact: true }).tap();
      const after = await readBrowserSave(page);
      expect(after.rngState).toBe(before.rngState);
      expect(after.flags).not.toContain('q_special_mewtwo_caught');
    } else {
      await walkTo(page, 'd06_santuario_due_luci.tmj', 21, 16);
      expect((await readBrowserSave(page)).player).toMatchObject({ x: 21, y: 16 });
    }
  });
}
