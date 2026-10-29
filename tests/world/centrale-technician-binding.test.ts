import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T;

test('Centrale technician keeps one stable identity, matching label, asset and foot anchor', () => {
  const catalog = read<any>('content/characters/appearances.v2.json');
  const profile = catalog.profiles.find((item: any) => item.id === 'centrale-technician');
  assert.ok(profile);
  assert.deepEqual(profile.npcIds, ['centrale_technician']);
  assert.deepEqual(profile.dialogueIds, ['centrale_technician']);
  assert.equal(profile.assetKey, 'veloria-centrale-technician-idle-south-v1');
  assert.equal(profile.frame, undefined, 'standalone artwork has no atlas frame');
  assert.deepEqual(profile.origin, profile.idleViews.down.origin);
  assert.deepEqual(Object.keys(profile.idleViews).sort(), ['down', 'left', 'right', 'up']);

  const asset = catalog.assets.find((item: any) => item.key === profile.assetKey);
  assert.deepEqual(asset, { kind: 'image', key: profile.assetKey, path: `assets/sprites/${profile.assetKey}.webp` });
  assert.ok(existsSync(new URL(`../../assets/sources/veloria-centrale-technician-v1.png`, import.meta.url)));
  assert.ok(existsSync(new URL(`../../public/${asset.path}`, import.meta.url)));

  const map = read<any>('content/maps/d03_centrale_risonante.map.json');
  assert.deepEqual(map.renderAssets.find((item: any) => item.key === asset.key), asset);
  assert.ok(catalog.assets.some((item: any) => item.key === 'veloria-centrale-technician-v1'), 'preserve original global resource');
  assert.ok(!map.renderAssets.some((item: any) => item.key === 'veloria-centrale-technician-v1'));
  const keys = new Set<string>();
  for (const view of Object.values(profile.idleViews) as any[]) {
    assert.ok(!keys.has(view.assetKey)); keys.add(view.assetKey);
    const image = catalog.assets.find((item: any) => item.key === view.assetKey);
    assert.deepEqual(map.renderAssets.find((item: any) => item.key === view.assetKey), image);
    assert.ok(existsSync(new URL(`../../public/${image.path}`, import.meta.url)));
    assert.ok(view.displaySize > 0 && view.origin.y > 0 && view.origin.y <= 1);
  }
  const tiled = read<any>('public/tilemaps/d03_centrale_risonante.tmj');
  const matches = tiled.layers.flatMap((layer: any) => layer.objects ?? [])
    .filter((object: any) => object.properties?.some((property: any) => property.name === 'npcId' && property.value === 'centrale_technician'));
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, 'Tecnica della Centrale');
  const props = Object.fromEntries(matches[0].properties.map((property: any) => [property.name, property.value]));
  assert.equal(props.dialogueId, 'centrale_technician');
  assert.equal(props.characterAppearanceId, profile.id);
  assert.equal(props.sprite, profile.assetKey);
  assert.equal(props.spriteFrame, undefined);
  assert.deepEqual({ x: props.spriteOriginX, y: props.spriteOriginY }, profile.origin);
  assert.equal(read<any>('content/dialogue/world.v1.json').centrale_technician.speaker, matches[0].name);
});
