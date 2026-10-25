import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { createEncounterHabitatCells, createEncounterHabitatMarkers, ENCOUNTER_HABITAT_LEAF_PATH, ENCOUNTER_HABITAT_SYMBOL } from '../../src/game/rendering/encounter-habitat-marker.ts';

type TiledObject = { name?: string; x?: number; y?: number; width?: number; height?: number; class?: string; properties?: { name: string; value: unknown }[] };
type TiledMap = { width: number; height: number; layers: { name: string; type: string; objects?: TiledObject[] }[] };
type Trigger = { id: string; kind: string; x: number; y: number; width: number; height: number };

test('map and guide use the approved prototype silhouette without a badge', () => {
  const prototype = readFileSync(new URL('../../world-design-prototype.html', import.meta.url), 'utf8');
  assert.ok(prototype.includes(`d="${ENCOUNTER_HABITAT_LEAF_PATH}"`));
  assert.ok(ENCOUNTER_HABITAT_SYMBOL.includes(`d="${ENCOUNTER_HABITAT_LEAF_PATH}"`));
  assert.doesNotMatch(ENCOUNTER_HABITAT_SYMBOL, /<(rect|ellipse)\b/);
});

function loadMap(file: string): TiledMap {
  return JSON.parse(readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')) as TiledMap;
}
function encounterTriggers(map: TiledMap): Trigger[] {
  const layer = map.layers.find(candidate => candidate.name === 'triggers');
  if (!layer) return [];
  return (layer.objects ?? [])
    .filter(object => object.class === 'encounter-zone' || object.properties?.some(property => property.name === 'kind' && property.value === 'encounter-zone'))
    .map(object => ({ id: object.name ?? '', kind: 'encounter-zone', x: object.x ?? 0, y: object.y ?? 0, width: object.width ?? 0, height: object.height ?? 0 }));
}
function collision(map: TiledMap) {
  return collectMapCollision(map.layers.find(layer => layer.name === 'collision')?.objects ?? [], map.width, map.height, []);
}

test('one marker and only walkable cells per encounter zone across all 43 authored zones', () => {
  let totalZones = 0;
  const maps = readdirSync(new URL('../../public/tilemaps/', import.meta.url)).filter(file => file.endsWith('.tmj'));
  for (const name of maps) {
    const map = loadMap('../../public/tilemaps/' + name);
    const zones = encounterTriggers(map);
    const blocked = collision(map);
    const markers = createEncounterHabitatMarkers(zones, blocked);
    const cells = createEncounterHabitatCells(zones, blocked);
    totalZones += zones.length;
    const zonesWithOpenTiles = zones.filter(zone => createEncounterHabitatCells([zone], blocked).length > 0);
    assert.equal(markers.length, zonesWithOpenTiles.length, `${name}: one marker for every open zone`);
    assert.deepEqual(markers.map(marker => marker.triggerId), zonesWithOpenTiles.map(zone => zone.id));
    for (const marker of markers) {
      assert.ok(cells.some(cell => cell.triggerId === marker.triggerId && cell.x === marker.x && cell.y === marker.y));
      assert.ok(!blocked.has(`${Math.floor(marker.x / 32)},${Math.floor(marker.y / 32)}`));
    }
    for (const cell of cells) assert.ok(!blocked.has(`${Math.floor(cell.x / 32)},${Math.floor(cell.y / 32)}`));
  }
  assert.equal(totalZones, 43);
});

test('R01 western grass marker lands on open ground, not a water collision tile', () => {
  const map = loadMap('../../public/tilemaps/r01_sentiero_alba.tmj');
  const zones = encounterTriggers(map);
  const west = zones.find(zone => zone.id === 'Erba alta ovest');
  assert.ok(west);
  const blocked = collision(map);
  const marker = createEncounterHabitatMarkers([west], blocked)[0];
  assert.ok(marker);
  assert.ok(createEncounterHabitatCells([west], blocked).some(cell => cell.x === marker.x && cell.y === marker.y));
  assert.ok(!blocked.has(`${Math.floor(marker.x / 32)},${Math.floor(marker.y / 32)}`));
});

test('marker placement skips unrelated/zero-area zones and leaves fully blocked zones unmarked', () => {
  const triggers: Trigger[] = [
    { id: 'exit', kind: 'map-exit', x: 0, y: 0, width: 32, height: 32 },
    { id: 'bad-zone', kind: 'encounter-zone', x: 0, y: 0, width: 0, height: 32 },
    { id: 'blocked-zone', kind: 'encounter-zone', x: 0, y: 0, width: 64, height: 32 },
  ];
  assert.deepEqual(createEncounterHabitatMarkers(triggers, new Set(['0,0', '1,0'])), []);
  assert.deepEqual(createEncounterHabitatCells(triggers, new Set(['0,0', '1,0'])), []);
});
