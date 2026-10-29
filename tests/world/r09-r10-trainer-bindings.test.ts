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
  test(`${entry.npcId} binds a unique directional profile and authored foot origin`, () => {
    const profile = catalog.profiles.find((item: any) => item.id === entry.profileId);
    assert.ok(profile);
    assert.deepEqual(profile.npcIds, [entry.npcId]);
    assert.equal(profile.frame, undefined);
    assert.deepEqual(Object.keys(profile.idleViews).sort(), ['down', 'left', 'right', 'up']);
    const asset = catalog.assets.find((item: any) => item.key === profile.assetKey);
    assert.ok(asset);
    assert.equal(asset.atlas, undefined);

    const map = read<any>(`content/maps/${entry.map}.map.json`);
    assert.deepEqual(map.renderAssets.find((item: any) => item.key === asset.key), asset);
    assert.equal(map.renderAssets.some((item: any) => item.key === 'veloria-r09-r10-coastal-trainers-v1'), false);
    for (const view of Object.values(profile.idleViews) as any[]) {
      assert.ok(map.renderAssets.some((item: any) => item.key === view.assetKey));
      assert.ok(view.origin.x > 0 && view.origin.x < 1 && view.origin.y > 0 && view.origin.y <= 1);
    }
    assert.ok(map.npcRefs.includes(entry.npcId));
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

test('R09–R10 trainers have separate IDs and sixteen independent direction assets', () => {
  const selected = cases.map(entry => catalog.profiles.find((item: any) => item.id === entry.profileId));
  assert.equal(new Set(selected.map((profile: any) => profile.id)).size, 4);
  assert.equal(new Set(selected.map((profile: any) => `${profile.assetKey}:${profile.frame}`)).size, 4);
  assert.equal(new Set(selected.flatMap((profile: any) => Object.values(profile.idleViews).map((view: any) => view.assetKey))).size, 16);
});
