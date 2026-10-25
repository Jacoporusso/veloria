import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };

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
      ['gym01_brumalta', 'mira'], ['gym02_petalora', 'dalia_gym'],
      ['gym03_vetracielo', 'aster_gym'], ['gym04_ferraluce', 'rhea_gym'],
      ['gym05_portolume', 'nerea_gym'], ['gym06_acquariva', 'selene_gym'],
      ['gym07_biancavetta', 'nives_gym'], ['gym08_concordia', 'aurel_gym'],
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
      const asset = appearances.assets.find(asset => asset.key === profile.assetKey)!;
      const proof = await page.evaluate(id => {
        const scene = (window as any).__npcIdentityGame.scene.getScene('world');
        const sprite = scene.mapLayer.list.find((child: any) => child.name === 'npc-sprite' && child.getData('npcId') === id);
        const camera = scene.cameras.main;
        const origin = camera.getWorldPoint(0, 0);
        const surface = scene.game.canvas.getBoundingClientRect();
        const bounds = sprite.getBounds();
        const projectX = (x: number) => surface.left + (x - origin.x) * camera.zoom * surface.width / scene.game.scale.width;
        const projectY = (y: number) => surface.top + (y - origin.y) * camera.zoom * surface.height / scene.game.scale.height;
        const top = projectY(bounds.top);
        const journey = document.querySelector('.journey-trigger') as HTMLElement | null;
        const hudBottom = journey?.getBoundingClientRect().bottom ?? 0;
        // Actual projection proves visibility at any zoom; a fixed distance
        // from camera center in world units does not (especially at map edges).
        return { key: sprite.texture.key, frame: sprite.frame.name, origin: { x: sprite.originX, y: sprite.originY }, identity: sprite.getData('appearanceId'),
          nearby: Math.abs(sprite.x - scene.player.x) <= 64 && Math.abs(sprite.y - scene.player.y) <= 64,
          onScreen: projectX(bounds.left) >= surface.left && projectX(bounds.right) <= surface.right && top >= surface.top && projectY(bounds.bottom) <= surface.bottom,
          clearOfHud: top > hudBottom };
      }, npcId);
      const frame = asset.atlas ? `cell-${profile.frame}` : profile.frame === undefined ? '__BASE' : String(profile.frame);
      expect(proof).toEqual({ key: asset.key, frame, origin: profile.origin, identity: profile.id, nearby: true, onScreen: true, clearOfHud: true });
      await page.screenshot({ path: info.outputPath(`${npcId}.png`) });
    }
    expect(errors).toEqual([]);
  });
}
