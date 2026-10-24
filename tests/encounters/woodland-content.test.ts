import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import wetBankData from '../../content/encounters/d01_wet_bank.encounter.json' with { type: 'json' };
import woodlandData from '../../content/encounters/d01_woodland.encounter.json' with { type: 'json' };
import forestMap from '../../content/maps/d01_bosco_veli.map.json' with { type: 'json' };

const tiledMap = JSON.parse(readFileSync(fileURLToPath(new URL('../../public/tilemaps/d01_bosco_veli.tmj', import.meta.url)), 'utf8'));

test('Bosco encounter zones distinguish woodland and wet bank at the tuned per-step rate', () => {
  const triggerLayer = tiledMap.layers.find((layer: { name: string; type: string }) => layer.name === 'triggers' && layer.type === 'objectgroup');
  assert.ok(triggerLayer);
  const zones = triggerLayer.objects.filter((object: { properties?: readonly { name: string; value: unknown }[] }) =>
    object.properties?.some(property => property.name === 'kind' && property.value === 'encounter-zone'));

  assert.equal(zones.length, 2);
  assert.equal(new Set(zones.map((zone: any) => zone.properties.find((entry: any) => entry.name === 'encounterTableId').value)).size, 2);
  for (const zone of zones) {
    const property = (name: string) => zone.properties?.find((entry: { name: string }) => entry.name === name)?.value;
    assert.ok([woodlandData.id, wetBankData.id].includes(property('encounterTableId')));
    assert.ok(forestMap.encounterTableIds.includes(property('encounterTableId')));
    assert.equal(property('encounterChance'), 0.18);
  }
});

test('every encounter cell can be reached from the forest entrance without crossing collision', () => {
  const blocked = new Set<string>();
  for (const object of tiledMap.layers.find((layer: { name: string }) => layer.name === 'collision').objects) {
    for (let y = Math.floor(object.y / 32); y < Math.ceil((object.y + object.height) / 32); y++) {
      for (let x = Math.floor(object.x / 32); x < Math.ceil((object.x + object.width) / 32); x++) blocked.add(`${x},${y}`);
    }
  }
  const spawn = forestMap.spawns.find(item => item.id === 'from_r01');
  assert.ok(spawn);
  const pending = [[spawn.x, spawn.y]];
  const reachable = new Set([`${spawn.x},${spawn.y}`]);
  for (let index = 0; index < pending.length; index++) {
    const [x, y] = pending[index];
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= tiledMap.width || ny >= tiledMap.height || blocked.has(key) || reachable.has(key)) continue;
      reachable.add(key);
      pending.push([nx, ny]);
    }
  }
  const zones = tiledMap.layers.find((layer: { name: string }) => layer.name === 'triggers').objects
    .filter((object: { class: string }) => object.class === 'encounter-zone');
  const terrain = tiledMap.layers.find((layer: { name: string }) => layer.name === 'terrain_detail').data;
  for (const zone of zones) {
    for (let y = zone.y / 32; y < (zone.y + zone.height) / 32; y++) {
      for (let x = zone.x / 32; x < (zone.x + zone.width) / 32; x++) {
        assert.ok(reachable.has(`${x},${y}`), `${zone.name}: encounter cell ${x},${y} must be reachable`);
        assert.equal(terrain[y * tiledMap.width + x], 0, `${zone.name}: encounters belong on forest ground, outside the path and water`);
      }
    }
  }
});

test('woodland species remain varied across the documented local-time bands', () => {
  const bands = woodlandData.timeBands;
  assert.equal(bands.morning.length, 5);
  assert.equal(bands.day.length, 7);
  assert.equal(bands.night.length, 4);
  const uniqueSpecies = new Set(Object.values(bands).flat().map(entry => entry.speciesId));
  assert.equal(uniqueSpecies.size, 14);
});
