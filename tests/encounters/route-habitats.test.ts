import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const mapsRoot = new URL('../../content/maps/', import.meta.url);
for (const file of readdirSync(mapsRoot).filter(name => /^r\d{2}_.*\.map\.json$/.test(name))) {
  test(`${file}: every encounter habitat is registered and reachable from the entrance`, () => {
    const metadata = JSON.parse(readFileSync(new URL(file, mapsRoot), 'utf8'));
    const map = JSON.parse(readFileSync(new URL(`../../public/${metadata.tiledAsset}`, import.meta.url), 'utf8'));
    const blocked = new Set<string>();
    for (const object of map.layers.find((layer: { name: string }) => layer.name === 'collision').objects) {
      for (let y = Math.floor(object.y / 32); y < Math.ceil((object.y + object.height) / 32); y++) {
        for (let x = Math.floor(object.x / 32); x < Math.ceil((object.x + object.width) / 32); x++) blocked.add(`${x},${y}`);
      }
    }
    const spawn = metadata.spawns[0];
    const pending = [[spawn.x, spawn.y]];
    const reachable = new Set([`${spawn.x},${spawn.y}`]);
    for (let i = 0; i < pending.length; i++) {
      const [x, y] = pending[i];
      for (const [nx, ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        const key = `${nx},${ny}`;
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || blocked.has(key) || reachable.has(key)) continue;
        reachable.add(key); pending.push([nx, ny]);
      }
    }
    const zones = map.layers.flatMap((layer: { objects?: any[] }) => layer.objects ?? []).filter((object: any) => object.properties?.some((p: any) => p.name === 'kind' && p.value === 'encounter-zone'));
    assert.ok(zones.length > 0, 'each route needs wild Pokemon habitats');
    for (const zone of zones) {
      assert.ok(metadata.encounterTableIds.includes(zone.properties.find((p: any) => p.name === 'encounterTableId').value));
      let accessibleCells = 0;
      for (let y = zone.y / 32; y < (zone.y + zone.height) / 32; y++) {
        for (let x = zone.x / 32; x < (zone.x + zone.width) / 32; x++) {
          if (blocked.has(`${x},${y}`)) continue;
          assert.ok(reachable.has(`${x},${y}`), `${zone.name}: unreachable cell ${x},${y}`);
          accessibleCells++;
        }
      }
      assert.ok(accessibleCells > 0, `${zone.name}: habitat must have walkable cells`);
    }
  });
}

