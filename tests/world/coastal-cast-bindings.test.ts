import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T;
const appearances = read<any>('content/characters/appearances.v2.json');
const cases = [
  { map: 'acquariva', npcId: 'acquariva_tessa', profileId: 'acquariva-tessa', frame: 0 },
  { map: 'portolume', npcId: 'portolume_captain', profileId: 'portolume-captain-marina', frame: 1 },
  { map: 'r08_costa_turbine', npcId: 'r08_viola', profileId: 'route-trainer-viola-r08', frame: 2 },
  { map: 'd04_delta_specchi', npcId: 'delta_iris', profileId: 'delta-biologist-iris', frame: 3 },
] as const;

for (const entry of cases) {
  test(`${entry.npcId} Tiled object binds its unique profile, atlas frame, and foot origin`, () => {
    const profile = appearances.profiles.find((item: any) => item.id === entry.profileId);
    assert.ok(profile, `missing appearance profile ${entry.profileId}`);
    assert.deepEqual(profile.npcIds, [entry.npcId]);
    assert.equal(profile.frame, entry.frame);

    const asset = appearances.assets.find((item: any) => item.key === profile.assetKey);
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

test('coastal cast uses four distinct identities and atlas frames', () => {
  const selected = cases.map(entry => appearances.profiles.find((item: any) => item.id === entry.profileId));
  assert.equal(new Set(selected.map((profile: any) => profile.id)).size, 4);
  assert.equal(new Set(selected.map((profile: any) => `${profile.assetKey}:${profile.frame}`)).size, 4);
  const deltaIris = selected.find((profile: any) => profile.id === 'delta-biologist-iris');
  const routeIris = appearances.profiles.find((profile: any) => profile.id === 'route-trainer-iris-r06');
  assert.ok(routeIris);
  assert.notEqual(deltaIris.id, routeIris.id);
  assert.ok(!deltaIris.npcIds.some((npcId: string) => routeIris.npcIds.includes(npcId)));
});
