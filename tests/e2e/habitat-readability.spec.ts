import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { collectMapCollision } from '../../src/core/world/map-collision';
import { createEncounterHabitatMarkers } from '../../src/game/rendering/encounter-habitat-marker';

for (const [mapId, viewport] of [
  ['veloria/r01_sentiero_alba', { width: 390, height: 844 }],
  ['veloria/d01_bosco_veli', { width: 844, height: 390 }],
  ['veloria/r09_dune_salmastre', { width: 390, height: 844 }],
  ['veloria/r13_tornanti_bianchi', { width: 844, height: 390 }],
  ['veloria/r11_via_cascate', { width: 390, height: 844 }],
  ['veloria/r16_cammino_equilibrio', { width: 844, height: 390 }],
] as const) {
  test(`encounter signs and consultable guide in ${mapId}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const stem = mapId.split('/')[1];
    const tiled = JSON.parse(await readFile(new URL(`../../public/tilemaps/${stem}.tmj`, import.meta.url), 'utf8'));
    const occupied = collectMapCollision(tiled.layers.find((layer: any) => layer.name === 'collision').objects, tiled.width, tiled.height, []);
    const zones = tiled.layers.find((layer: any) => layer.name === 'triggers').objects.map((object: any) => ({
      ...object, id: object.name, kind: object.properties?.find((property: any) => property.name === 'kind')?.value,
    }));
    const anchor = createEncounterHabitatMarkers(zones, occupied)[0];
    const ax = Math.floor(anchor.x / 32), ay = Math.floor(anchor.y / 32);
    const approach = [[ax - 1, ay], [ax + 1, ay], [ax, ay - 1], [ax, ay + 1]]
      .find(([x, y]) => x >= 0 && y >= 0 && x < tiled.width && y < tiled.height && !occupied.has(`${x},${y}`))!;
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/x: spawn\.x,\s*y: spawn\.y/, `x: ${approach[0]}, y: ${approach[1]}`);
      await route.fulfill({ response, body: body + '\nwindow.__habitatGame=game;' });
    });
    await page.goto(`/?previewMap=${mapId}`);
    await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30_000 });
    const proof = await page.evaluate(() => {
      const scene = (window as any).__habitatGame.scene.getScene('world');
      const zones = scene.renderedMap.triggers.filter((t: any) => t.kind === 'encounter-zone');
      const markers = scene.mapLayer.list.filter((child: any) => child.name === 'encounter-habitat-marker');
      const grass = scene.mapLayer.list.filter((child: any) => ['encounter-habitat-marker', 'encounter-habitat-grass'].includes(child.name));
      return { zones: zones.map((z: any) => z.id), markers: markers.map((m: any) => m.getData('triggerId')),
        singlePerPatch: grass.length === zones.length,
        walkable: grass.every((tuft: any) => !scene.renderedMap.occupied.has(`${tuft.getData('tileX')},${tuft.getData('tileY')}`)),
        canonicalLeaf: grass.every((tuft: any) => tuft.texture.key === 'veloria-habitat-leaf-v2') };
    });
    expect(proof.zones.length).toBeGreaterThan(0); expect(proof.markers).toEqual(proof.zones);
    expect(proof.singlePerPatch).toBe(true); expect(proof.walkable).toBe(true); expect(proof.canonicalLeaf).toBe(true);
    await page.screenshot({ path: info.outputPath('habitat-patch.png') });
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Mostra i comandi' }).click();
    await expect(page.locator('#dialogue-speaker')).toHaveText('Come si gioca');
    // The first tap reveals typewriter text; the following tap advances the guide.
    await page.getByRole('button', { name: 'Conferma e interagisci' }).click();
    await expect(page.locator('#dialogue-text')).toContainText('tre foglie');
    await page.screenshot({ path: info.outputPath('habitat-guide.png') });
  });
}
