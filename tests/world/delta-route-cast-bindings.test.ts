import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T;
const catalog = read<any>('content/characters/appearances.v2.json');
const cases = [
  { map: 'd04_delta_specchi', npcId: 'delta_teo', profileId: 'delta-naturalist-teo', frame: 0 },
  { map: 'r11_via_cascate', npcId: 'r11_celia', profileId: 'route-trainer-celia-r11', frame: 1 },
  { map: 'r12_valle_vento', npcId: 'r12_ruben', profileId: 'route-trainer-ruben-r12', frame: 2 },
  { map: 'r13_tornanti_bianchi', npcId: 'r13_alma', profileId: 'route-trainer-alma-r13', frame: 3 },
] as const;

for (const entry of cases) {
  test(`${entry.npcId} binds the matching appearance identity, atlas cell, and foot origin`, () => {
    const profile = catalog.profiles.find((item: any) => item.id === entry.profileId);
    assert.ok(profile);
    assert.deepEqual(profile.npcIds, [entry.npcId]);
    assert.equal(profile.frame, entry.frame);
    const asset = catalog.assets.find((item: any) => item.key === profile.assetKey);
    assert.ok(asset);
    assert.deepEqual(asset.atlas, { columns: 2, rows: 2 });

    const map = read<any>(`content/maps/${entry.map}.map.json`);
    assert.deepEqual(map.renderAssets.find((item: any) => item.key === asset.key), asset);
    assert.ok(map.npcRefs.includes(entry.npcId));
    const tiled = read<any>(`public/tilemaps/${entry.map}.tmj`);
    const objects = tiled.layers.flatMap((layer: any) => layer.objects ?? []);
    const matches = objects.filter((object: any) => object.properties?.some((property: any) =>
      property.name === 'npcId' && property.value === entry.npcId));
    assert.equal(matches.length, 1);
    const properties = Object.fromEntries(matches[0].properties.map((property: any) => [property.name, property.value]));
    assert.equal(properties.characterAppearanceId, profile.id);
    assert.equal(properties.sprite, profile.assetKey);
    assert.equal(properties.spriteFrame, profile.frame);
    assert.deepEqual({ x: properties.spriteOriginX, y: properties.spriteOriginY }, profile.origin);
    assert.ok(profile.dialogueIds.includes(properties.dialogueId));
  });
}

test('Delta Teo is distinct from Delta Iris', () => {
  const teo = catalog.profiles.find((profile: any) => profile.id === 'delta-naturalist-teo');
  const iris = catalog.profiles.find((profile: any) => profile.id === 'delta-biologist-iris');
  assert.ok(teo && iris);
  assert.notEqual(teo.id, iris.id);
  assert.notEqual(teo.assetKey === iris.assetKey && teo.frame === iris.frame, true);
  assert.ok(!teo.npcIds.some((npcId: string) => iris.npcIds.includes(npcId)));
});
