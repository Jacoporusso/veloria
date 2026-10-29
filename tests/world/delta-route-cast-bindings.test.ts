import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T;
const catalog = read<any>('content/characters/appearances.v2.json');
const cases = [
  { map: 'd04_delta_specchi', npcId: 'delta_teo', profileId: 'delta-naturalist-teo' },
  { map: 'r11_via_cascate', npcId: 'r11_celia', profileId: 'route-trainer-celia-r11' },
  { map: 'r12_valle_vento', npcId: 'r12_ruben', profileId: 'route-trainer-ruben-r12' },
  { map: 'r13_tornanti_bianchi', npcId: 'r13_alma', profileId: 'route-trainer-alma-r13' },
] as const;

for (const entry of cases) {
  test(`${entry.npcId} binds its four independent directional views without changing identity`, () => {
    const profile = catalog.profiles.find((item: any) => item.id === entry.profileId);
    assert.ok(profile);
    assert.deepEqual(profile.npcIds, [entry.npcId]);
    assert.equal(profile.frame, undefined);
    assert.deepEqual(Object.keys(profile.idleViews).sort(), ['down', 'left', 'right', 'up']);
    assert.equal(profile.assetKey, profile.idleViews.down.assetKey);
    assert.deepEqual(profile.origin, profile.idleViews.down.origin);

    const map = read<any>(`content/maps/${entry.map}.map.json`);
    assert.ok(map.npcRefs.includes(entry.npcId));
    assert.equal(map.renderAssets.some((item: any) => item.key === 'veloria-delta-route-cast-v1'), false);
    const assetKeys = new Set<string>();
    for (const [direction, view] of Object.entries(profile.idleViews) as [string, any][]) {
      assert.ok(!assetKeys.has(view.assetKey));
      assetKeys.add(view.assetKey);
      const asset = catalog.assets.find((item: any) => item.key === view.assetKey);
      assert.ok(asset);
      assert.equal(asset.atlas, undefined);
      assert.equal(asset.path, `assets/sprites/${view.assetKey}.webp`);
      assert.deepEqual(map.renderAssets.find((item: any) => item.key === asset.key), asset);
      assert.ok(view.displaySize > 0);
      assert.ok(view.origin.x > 0 && view.origin.x < 1 && view.origin.y > 0 && view.origin.y <= 1);
      assert.ok(['down', 'up', 'left', 'right'].includes(direction));
    }

    const tiled = read<any>(`public/tilemaps/${entry.map}.tmj`);
    const objects = tiled.layers.flatMap((layer: any) => layer.objects ?? []);
    const matches = objects.filter((object: any) => object.properties?.some((property: any) =>
      property.name === 'npcId' && property.value === entry.npcId));
    assert.equal(matches.length, 1);
    const properties = Object.fromEntries(matches[0].properties.map((property: any) => [property.name, property.value]));
    assert.equal(properties.characterAppearanceId, profile.id);
    assert.equal(properties.sprite, profile.assetKey);
    assert.equal(properties.spriteFrame, undefined);
    assert.deepEqual({ x: properties.spriteOriginX, y: properties.spriteOriginY }, profile.origin);
    assert.ok(profile.dialogueIds.includes(properties.dialogueId));
  });
}

test('Delta cast keeps its four NPC identities while retiring atlas map bindings', () => {
  const atlas = catalog.assets.find((asset: any) => asset.key === 'veloria-delta-route-cast-v1');
  assert.ok(atlas, 'preserve the shared atlas in the global asset catalog');
  assert.ok(atlas.atlas);
  const idleManifest = read<any>('assets/npc-idle-views-v1.json');
  for (const entry of cases) {
    assert.ok(idleManifest.profiles.some((item: any) => item.profileId === entry.profileId));
  }
  for (const file of ['d04_delta_specchi', 'r11_via_cascate', 'r12_valle_vento', 'r13_tornanti_bianchi']) {
    const map = read<any>(`content/maps/${file}.map.json`);
    assert.equal(map.renderAssets.some((item: any) => item.key === atlas.key), false);
  }
  for (const file of readdirSync(new URL('../../public/tilemaps/', import.meta.url)).filter(name => name.endsWith('.tmj'))) {
    const tiled = read<any>(`public/tilemaps/${file}`);
    for (const layer of tiled.layers) for (const object of layer.objects ?? []) {
      const properties = Object.fromEntries((object.properties ?? []).map((property: any) => [property.name, property.value]));
      assert.notEqual(properties.sprite, atlas.key, `Tiled object ${object.id} in ${file} must not use the retired atlas`);
    }
  }
});

test('Delta Teo remains a distinct naturalist identity from Delta Iris', () => {
  const teo = catalog.profiles.find((profile: any) => profile.id === 'delta-naturalist-teo');
  const iris = catalog.profiles.find((profile: any) => profile.id === 'delta-biologist-iris');
  assert.ok(teo && iris);
  assert.notEqual(teo.id, iris.id);
  assert.notEqual(teo.assetKey, iris.assetKey);
  assert.ok(!teo.npcIds.some((npcId: string) => iris.npcIds.includes(npcId)));
});
