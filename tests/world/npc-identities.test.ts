import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { npcSpriteOrigin } from '../../src/game/rendering/npc-sprite-origin.ts';

const read = (path: string) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const catalog = read('content/characters/appearances.v2.json');
const assetByKey = new Map(catalog.assets.map((asset: any) => [asset.key, asset]));
const maps = readdirSync(new URL('../../content/maps/', import.meta.url)).filter(file => file.endsWith('.map.json')).map(file => read(`content/maps/${file}`));

for (const profile of catalog.profiles) {
  test(`all appearances of ${profile.id} retain the same authored identity and foot anchor`, () => {
    const asset: any = assetByKey.get(profile.assetKey);
    assert.ok(asset, `profile ${profile.id} references missing asset ${profile.assetKey}`);
    const found: string[] = [];
    for (const map of maps) {
      const tiled = read(`public/${map.tiledAsset}`);
      for (const layer of tiled.layers) for (const object of layer.objects ?? []) {
        const props = Object.fromEntries((object.properties ?? []).map((p: any) => [p.name, p.value]));
        if (!profile.npcIds.includes(props.npcId)) continue;
        found.push(props.npcId);
        assert.equal(props.characterAppearanceId, profile.id);
        assert.equal(props.sprite, asset.key);
        assert.equal(props.spriteFrame, profile.frame);
        assert.deepEqual(npcSpriteOrigin(props), profile.origin);
        assert.ok(profile.dialogueIds.includes(props.dialogueId));
        assert.ok(read('content/dialogue/world.v1.json')[props.dialogueId]);
        const mapAsset = map.renderAssets.find((candidate: any) => candidate.key === asset.key);
        assert.deepEqual(mapAsset, asset);
      }
    }
    assert.deepEqual(found.sort(), [...profile.npcIds].sort());
  });
}

test('profile asset references exist and asset/frame identity pairs are unique', () => {
  assert.equal(assetByKey.size, catalog.assets.length, 'catalog asset keys must be unique');
  for (const asset of catalog.assets) {
    assert.equal(asset.kind, 'image');
    assert.ok(existsSync(new URL(`../../public/${asset.path}`, import.meta.url)), `asset file is missing: public/${asset.path}`);
    if (asset.atlas) assert.ok(asset.atlas.columns > 0 && asset.atlas.rows > 0, `asset ${asset.key} has an invalid atlas grid`);
  }
  const seenPairs = new Set<string>();
  for (const profile of catalog.profiles) {
    const asset: any = assetByKey.get(profile.assetKey);
    assert.ok(asset, `profile ${profile.id} references missing asset ${profile.assetKey}`);
    assert.equal(asset.kind, 'image');
    if (asset.atlas) {
      assert.ok(Number.isInteger(profile.frame), `atlas profile ${profile.id} needs a frame`);
      assert.ok(profile.frame >= 0 && profile.frame < asset.atlas.columns * asset.atlas.rows);
    }
    const pair = `${profile.assetKey}:${profile.frame ?? 'single'}`;
    assert.ok(!seenPairs.has(pair), `duplicate profile asset/frame pair ${pair}`);
    seenPairs.add(pair);
  }
  for (const study of catalog.unboundStudies) {
    const asset: any = assetByKey.get(study.assetKey);
    assert.ok(asset, `unbound study references missing asset ${study.assetKey}`);
    if (asset.atlas) assert.ok(Number.isInteger(study.frame) && study.frame >= 0 && study.frame < asset.atlas.columns * asset.atlas.rows);
  }
});

test('the narrative explicitly identifies professor Elia', () => {
  assert.match(read('content/dialogue/world.v1.json').prof_elia.speaker, /Professoressa/);
});

test('foot anchors preserve legacy defaults and reject malformed custom origins', () => {
  assert.deepEqual(npcSpriteOrigin({}), { x: .5, y: 1 });
  for (const properties of [{ spriteOriginX: .5 }, { spriteOriginX: -1, spriteOriginY: 1 }, { spriteOriginX: .5, spriteOriginY: NaN }]) {
    assert.throws(() => npcSpriteOrigin(properties), /explicit pair/);
  }
});
