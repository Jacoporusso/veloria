import { expect, test } from '@playwright/test';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave } from './helpers/world-navigation';

const cases = [
  { map: 'veloria/r01_sentiero_alba', x: 28, y: 10, direction: 'Vai a destra', to: 'veloria/d01_bosco_veli', open: true },
  { map: 'veloria/r01_sentiero_alba', x: 1, y: 11, direction: 'Vai a sinistra', to: 'veloria/borgofonte', open: true },
  { map: 'veloria/d01_bosco_veli', x: 28, y: 11, direction: 'Vai a destra', to: 'veloria/r02_viale_fronde', open: false },
  { map: 'veloria/d01_bosco_veli', x: 28, y: 11, direction: 'Vai a destra', to: 'veloria/r02_viale_fronde', open: true },
  { map: 'veloria/r02_viale_fronde', x: 26, y: 10, direction: 'Vai a destra', to: 'veloria/brumalta', open: true },
  { map: 'veloria/brumalta', x: 34, y: 13, direction: 'Vai a destra', to: 'veloria/r03_terrazze_muschio', open: true },
];

for (const [index, fixture] of cases.entries()) {
  test(`road lane ${fixture.map} y${fixture.y} ${fixture.open ? 'transitions' : 'retains the Ada gate'}`, async ({ page }, info) => {
    await page.setViewportSize(index % 2 ? { width: 844, height: 390 } : { width: 390, height: 844 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await enterGame(page);
    const prepared = await page.evaluate(async fixture => {
      const { loadSave } = await import('/src/persistence/save-store.ts' as string);
      const { getMap } = await import('/src/game/maps/map-registry.ts' as string);
      const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
      const save = selectStarter(await loadSave(), 4, 'fixture-starter');
      save.flags = [...new Set([...save.flags, 'intro_completed', 'q_research_sample_received', 'prologue_complete_seen',
        'tutorial_habitat_seen', ...(fixture.open ? ['q_ada_helped', 'badge_aurora_awarded'] : [])])];
      save.player = { ...save.player, mapId: fixture.map, spawnPointId: getMap(fixture.map).metadata.spawns[0].id, x: fixture.x, y: fixture.y };
      return save;
    }, fixture);
    await seedBrowserSave(page, prepared); await page.reload(); await enterGame(page);
    await page.screenshot({ path: info.outputPath('approach.png') });
    await page.getByRole('button', { name: fixture.direction, exact: true }).click();
    if (fixture.open) {
      await expect.poll(async () => (await readBrowserSave(page)).player.mapId).toBe(fixture.to);
      await expect(page.locator('#game-loading')).toBeHidden();
    } else {
      await expect(page.locator('#toast')).toContainText('Ada');
      expect((await readBrowserSave(page)).player.mapId).toBe(fixture.map);
    }
    expect(errors).toEqual([]);
  });
}
