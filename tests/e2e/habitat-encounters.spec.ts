import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { rollEncounterCheck } from '../../src/core/encounters/roll-encounter-check';
import { collectMapCollision } from '../../src/core/world/map-collision';
import { enterGame } from './helpers/enter-game';
import { readBrowserSave, seedBrowserSave, walkDirection } from './helpers/world-navigation';

for (const [index, stem] of ['r01_sentiero_alba', 'd01_bosco_veli', 'r09_dune_salmastre', 'r13_tornanti_bianchi', 'r11_via_cascate', 'r16_cammino_equilibrio'].entries()) {
  test(`walking inside ${stem} rolls again and starts a real wild encounter`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(index % 2 ? { width: 844, height: 390 } : { width: 390, height: 844 });
    await page.goto('/'); await enterGame(page);
    const metadata = JSON.parse(await readFile(new URL(`../../content/maps/${stem}.map.json`, import.meta.url), 'utf8'));
    const tiled = JSON.parse(await readFile(new URL(`../../public/${metadata.tiledAsset}`, import.meta.url), 'utf8'));
    const objects = tiled.layers.flatMap((layer: any) => layer.objects ?? []);
    const properties = (object: any) => Object.fromEntries((object.properties ?? []).map((p: any) => [p.name, p.value]));
    const zone = objects.find((object: any) => properties(object).kind === 'encounter-zone');
    const inside = (x: number, y: number) => x * 32 + 16 >= zone.x && x * 32 + 16 < zone.x + zone.width && y * 32 + 16 >= zone.y && y * 32 + 16 < zone.y + zone.height;
    const blocked = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, []);
    const directions = [{ dx: 1, dy: 0, name: 'right' }, { dx: -1, dy: 0, name: 'left' }, { dx: 0, dy: 1, name: 'down' }, { dx: 0, dy: -1, name: 'up' }] as const;
    let route: { x: number; y: number; first: typeof directions[number]['name']; second: typeof directions[number]['name'] } | undefined;
    for (let y = zone.y / 32; y < (zone.y + zone.height) / 32 && !route; y++) {
      for (let x = zone.x / 32; x < (zone.x + zone.width) / 32 && !route; x++) {
        if (blocked.has(`${x},${y}`)) continue;
        for (const entry of directions) {
          const sx = x - entry.dx, sy = y - entry.dy;
          if (sx < 0 || sy < 0 || sx >= tiled.width || sy >= tiled.height || inside(sx, sy) || blocked.has(`${sx},${sy}`)) continue;
          const next = directions.find(d => inside(x + d.dx, y + d.dy) && !blocked.has(`${x + d.dx},${y + d.dy}`));
          if (next) { route = { x: sx, y: sy, first: entry.name, second: next.name }; break; }
        }
      }
    }
    expect(route, 'habitat has a walkable entrance and two consecutive cells').toBeTruthy();
    const chance = properties(zone).encounterChance;
    let seed = 1;
    while (seed < 100_000) {
      const first = rollEncounterCheck(seed, chance);
      if (!first.encounter && rollEncounterCheck(first.nextRngState, chance).encounter) break;
      seed++;
    }
    expect(seed).toBeLessThan(100_000);
    const fixture = await page.evaluate(async () => {
      const { loadSave } = await import('/src/persistence/save-store.ts' as string);
      const { selectStarter } = await import('/src/core/party/select-starter.ts' as string);
      return selectStarter(await loadSave(), 4, 'habitat-fixture');
    });
    fixture.player = { ...fixture.player, mapId: metadata.id, spawnPointId: metadata.spawns[0].id, x: route!.x, y: route!.y };
    fixture.flags = [...new Set([...fixture.flags, 'intro_completed', 'tutorial_habitat_seen'])];
    fixture.rngState = seed;
    await seedBrowserSave(page, fixture); await page.reload(); await enterGame(page);
    await page.screenshot({ path: info.outputPath('habitat-approach.png') });
    await walkDirection(page, route!.first);
    await expect.poll(async () => (await readBrowserSave(page)).rngState).toBe(rollEncounterCheck(seed, chance).nextRngState);
    await expect(page.locator('body')).not.toHaveClass(/battle-active/);
    await walkDirection(page, route!.second);
    await expect(page.locator('body')).toHaveClass(/battle-active/);
    await page.screenshot({ path: info.outputPath('wild-encounter.png') });
  });
}
