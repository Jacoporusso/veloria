import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { collectMapCollision } from '../../src/core/world/map-collision.ts';
import { selectAreaTrigger, tryGridMove } from '../../src/core/world/index.ts';

const cases = [
  ['r01_sentiero_alba', 'left', 9, 11, 'veloria/borgofonte', undefined],
  ['r01_sentiero_alba', 'right', 8, 11, 'veloria/d01_bosco_veli', undefined],
  ['d01_bosco_veli', 'left', 9, 11, 'veloria/r01_sentiero_alba', undefined],
  ['d01_bosco_veli', 'right', 9, 11, 'veloria/r02_viale_fronde', 'q_ada_helped'],
  ['r02_viale_fronde', 'left', 8, 10, 'veloria/d01_bosco_veli', undefined],
  ['r02_viale_fronde', 'right', 8, 10, 'veloria/brumalta', 'q_ada_helped'],
  ['c01_brumalta', 'left', 11, 13, 'veloria/r02_viale_fronde', undefined],
  ['c01_brumalta', 'right', 11, 13, 'veloria/r03_terrazze_muschio', 'badge_aurora_awarded'],
] as const;

for (const [name, direction, top, bottom, destination, flag] of cases) {
  test(`${name} ${direction} exit covers every road lane while keeping its destination and gate`, () => {
    const map = JSON.parse(readFileSync(new URL(`../../public/tilemaps/${name}.tmj`, import.meta.url), 'utf8'));
    const triggers = map.layers.find((layer: any) => layer.name === 'triggers').objects.map((object: any) => ({
      id: object.name, x: object.x, y: object.y, width: object.width, height: object.height,
      ...Object.fromEntries(object.properties.map((p: any) => [p.name, p.value])),
    }));
    const occupied = collectMapCollision(map.layers.find((layer: any) => layer.name === 'collision').objects, map.width, map.height, []);
    const edgeX = direction === 'left' ? 0 : map.width - 1;
    for (let y = top; y <= bottom; y++) {
      const move = tryGridMove({ x: direction === 'left' ? 1 : map.width - 2, y }, direction, map.width, map.height, occupied);
      assert.equal(move.moved, true);
      const trigger = selectAreaTrigger(triggers, { x: (edgeX + .5) * 32, y: (y + .5) * 32 });
      assert.equal(trigger?.destinationMapId, destination);
      assert.equal(trigger?.requiredFlag, flag);
    }
    assert.equal(selectAreaTrigger(triggers, { x: (edgeX+.5)*32, y: (top-.5)*32 })?.kind === 'map-exit', false);
    assert.equal(selectAreaTrigger(triggers, { x: (edgeX+.5)*32, y: (bottom+1.5)*32 })?.kind === 'map-exit', false);
  });
}
