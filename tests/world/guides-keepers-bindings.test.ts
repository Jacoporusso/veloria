import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T;
const catalog = read<any>('content/characters/appearances.v2.json');
const cases = [
  { map: 'biancavetta', npcId: 'biancavetta_guide', profileId: 'biancavetta-guide', frame: 0 },
  { map: 'passobrina', npcId: 'passobrina_guide', profileId: 'passobrina-alpine-guide', frame: 1 },
  { map: 'r14_varco_cristallo', npcId: 'r14_guide', profileId: 'r14-guide-livia', frame: 2 },
  { map: 'radicelmo', npcId: 'radicelmo_keeper', profileId: 'radicelmo-keeper-leda', frame: 3 },
] as const;

for (const entry of cases) {
  test(`${entry.npcId} has a unique profile with matching Tiled origin and authored pose`, () => {
    const profile = catalog.profiles.find((item: any) => item.id === entry.profileId);
    assert.ok(profile);
    assert.deepEqual(profile.npcIds, [entry.npcId]);
    assert.equal(profile.frame, undefined);
    assert.deepEqual(Object.keys(profile.idleViews).sort(), ['down', 'left', 'right', 'up']);
    assert.equal(profile.assetKey, profile.idleViews.down.assetKey);
    assert.equal(new Set(Object.values(profile.idleViews).map((view: any) => view.assetKey)).size, 4);
    const asset = catalog.assets.find((item: any) => item.key === profile.assetKey);
    assert.ok(asset);
    assert.equal(asset.atlas, undefined);

    const map = read<any>(`content/maps/${entry.map}.map.json`);
    assert.deepEqual(map.renderAssets.find((item: any) => item.key === asset.key), asset);
    assert.ok(map.npcRefs.includes(entry.npcId));
    assert.ok(!map.renderAssets.some((item: any) => item.key === 'veloria-guides-and-keepers-v1'));
    for (const view of Object.values(profile.idleViews) as any[]) {
      assert.deepEqual(map.renderAssets.find((item: any) => item.key === view.assetKey),
        catalog.assets.find((item: any) => item.key === view.assetKey));
      assert.ok(view.displaySize > 0 && view.origin.y > 0 && view.origin.y <= 1);
    }
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

test('all four guide and keeper identities use separate profiles and cells', () => {
  const selected = cases.map(entry => catalog.profiles.find((item: any) => item.id === entry.profileId));
  assert.equal(new Set(selected.map((profile: any) => profile.id)).size, 4);
  assert.equal(new Set(selected.map((profile: any) => `${profile.assetKey}:${profile.frame}`)).size, 4);
});
