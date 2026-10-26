import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T;
const catalog = read<any>('content/characters/appearances.v2.json');
const cases = [
  { map: 'r09_dune_salmastre', npcId: 'r09_lina', profileId: 'route-trainer-lina-r09', frame: 0 },
  { map: 'r09_dune_salmastre', npcId: 'r09_noemi', profileId: 'route-trainer-noemi-r09', frame: 1 },
  { map: 'r10_sentiero_canne', npcId: 'r10_maya', profileId: 'route-trainer-maya-r10', frame: 2 },
  { map: 'r10_sentiero_canne', npcId: 'r10_bruno', profileId: 'route-trainer-bruno-r10', frame: 3 },
] as const;

for (const entry of cases) {
  test(`${entry.npcId} binds a unique profile, frame, and authored foot origin`, () => {
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

test('R09–R10 trainers have separate IDs and no duplicated atlas frames', () => {
  const selected = cases.map(entry => catalog.profiles.find((item: any) => item.id === entry.profileId));
  assert.equal(new Set(selected.map((profile: any) => profile.id)).size, 4);
  assert.equal(new Set(selected.map((profile: any) => `${profile.assetKey}:${profile.frame}`)).size, 4);
});
