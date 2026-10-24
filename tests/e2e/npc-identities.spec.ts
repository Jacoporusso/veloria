import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision';
import appearances from '../../content/characters/appearances.v1.json' with { type: 'json' };

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`main NPC identities and foot anchors render across all appearances at ${viewport.width}`, async ({ page }, info) => {
    test.setTimeout(90_000); await page.setViewportSize(viewport);
    let position = { x: 1, y: 1 };
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      // Prepared visual fixture only: start near the subject before constructing
      // the scene. No teleport or camera mutation after boot.
      const body = (await response.text()).replace(/x: spawn\.x,\s*y: spawn\.y/, `x: ${position.x}, y: ${position.y}`);
      await route.fulfill({ response, body: body + '\nwindow.__npcIdentityGame=game;' });
    });
    const cases = [
      ['borgofonte', 'nilo'], ['borgofonte_lab', 'prof_elia'], ['d01_bosco_veli', 'forest_ranger_ada'],
      ['concordia', 'concordia_elia'], ['d06_santuario_due_luci', 'd06_elia'], ['r15_passo_due_luci', 'r15_nilo'],
    ];
    for (const [mapName, npcId] of cases) {
      const metadata = JSON.parse(await readFile(new URL(`../../content/maps/${mapName}.map.json`, import.meta.url), 'utf8'));
      const tiled = JSON.parse(await readFile(new URL(`../../public/${metadata.tiledAsset}`, import.meta.url), 'utf8'));
      const objects = tiled.layers.flatMap((layer: any) => layer.objects ?? []);
      const npc = objects.find((object: any) => object.properties?.some((p: any) => p.name === 'npcId' && p.value === npcId));
      const occupied = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, []);
      position = [{ x: npc.x / 32, y: npc.y / 32 + 1 }, { x: npc.x / 32 + 1, y: npc.y / 32 }, { x: npc.x / 32 - 1, y: npc.y / 32 }]
        .find(point => !occupied.has(`${point.x},${point.y}`))!;
      expect(position).toBeTruthy();
      await page.goto(`/?previewMap=${metadata.id}`);
      await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
      const profile = appearances.profiles.find(profile => profile.npcIds.includes(npcId))!;
      const proof = await page.evaluate(id => {
        const scene = (window as any).__npcIdentityGame.scene.getScene('world');
        const sprite = scene.mapLayer.list.find((child: any) => child.name === 'npc-sprite' && child.getData('npcId') === id);
        const point = scene.cameras.main.getWorldPoint(scene.game.scale.width / 2, scene.game.scale.height / 2);
        return { key: sprite.texture.key, frame: sprite.frame.name, origin: { x: sprite.originX, y: sprite.originY }, identity: sprite.getData('appearanceId'),
          nearby: Math.abs(sprite.x - point.x) < 200 && Math.abs(sprite.y - point.y) < 200 };
      }, npcId);
      expect(proof).toEqual({ key: appearances.atlas.key, frame: `cell-${profile.frame}`, origin: profile.origin, identity: profile.id, nearby: true });
      await page.screenshot({ path: info.outputPath(`${npcId}.png`) });
    }
    expect(errors).toEqual([]);
  });
}
