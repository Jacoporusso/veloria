import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createEncounterHabitatMarkers } from '../../src/game/rendering/encounter-habitat-marker.ts';

type TiledObject = { name?: string; x?: number; y?: number; width?: number; height?: number; class?: string; properties?: { name: string; value: unknown }[] };

function encounterTriggers(file: string) {
  const map = JSON.parse(readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8'));
  const layer = map.layers.find((candidate: { name: string }) => candidate.name === 'triggers');
  if (!layer) return [];
  return (layer.objects as TiledObject[])
    .filter(object => object.class === 'encounter-zone' || object.properties?.some(property => property.name === 'kind' && property.value === 'encounter-zone'))
    .map(object => ({ id: object.name ?? '', kind: 'encounter-zone', x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? 0, height: object.height ?? 0 }));
}

test('three-leaf markers map one-to-one to real encounter zones across distinct biomes', () => {
  let totalZones = 0;
  const maps = readdirSync(new URL('../../public/tilemaps/', import.meta.url)).filter(file => file.endsWith('.tmj'));
  for (const name of maps) {
    const file = '../../public/tilemaps/' + name;
    const zones = encounterTriggers(file);
    const markers = createEncounterHabitatMarkers(zones);
    totalZones += zones.length;
    assert.equal(markers.length, zones.length);
    assert.deepEqual(markers.map(marker => marker.triggerId), zones.map(zone => zone.id));
    for (const [index, marker] of markers.entries()) {
      const zone = zones[index]!;
      assert.equal(marker.x, zone.x + zone.width / 2);
      assert.equal(marker.y, zone.y + zone.height / 2);
      assert.ok(marker.x > zone.x && marker.x < zone.x + zone.width);
      assert.ok(marker.y > zone.y && marker.y < zone.y + zone.height);
    }
  }
  assert.ok(totalZones > 0);
});

test('marker placement ignores unrelated and zero-area triggers', () => {
  assert.deepEqual(createEncounterHabitatMarkers([
    { id: 'exit', kind: 'map-exit', x: 0, y: 0, width: 32, height: 32 },
    { id: 'bad-zone', kind: 'encounter-zone', x: 0, y: 0, width: 0, height: 32 },
  ]), []);
});
