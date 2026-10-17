import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAmbientEffectPoints, createGrassSwayPoints, createWaterShimmerPoints, getGrassSwayTween, getWaterShimmerTween } from '../../src/game/rendering/ambient-effects.ts';
import type { MapAmbientEffect } from '../../src/game/maps/map-types.ts';
import routeMap from '../../content/maps/r01_sentiero_alba.map.json' with { type: 'json' };
import forestMap from '../../content/maps/d01_bosco_veli.map.json' with { type: 'json' };

const forestFireflies: MapAmbientEffect = {
  kind: 'fireflies',
  count: 14,
  area: { x: 128, y: 96, width: 704, height: 448 },
  colors: ['#e7d99b', '#c8d59b', '#a5c8a9'],
};

test('ambient effect placement is deterministic, map-specific, and stays inside its declared area', () => {
  const points = createAmbientEffectPoints('veloria/d01_bosco_veli', forestFireflies);
  assert.equal(points.length, forestFireflies.count);
  assert.deepEqual(points, createAmbientEffectPoints('veloria/d01_bosco_veli', forestFireflies));
  assert.notDeepEqual(points, createAmbientEffectPoints('veloria/r01_sentiero_alba', forestFireflies));
  for (const point of points) {
    assert.ok(point.x >= 128 && point.x <= 832);
    assert.ok(point.y >= 96 && point.y <= 544);
    assert.ok(forestFireflies.colors.includes(point.color));
    assert.ok(point.phase >= 0 && point.phase < 1);
  }
  assert.equal(getGrassSwayTween(points[0]!, true), null);
  assert.deepEqual(getGrassSwayTween(points[0]!, false), {
    angle: { from: -4, to: 4 },
    duration: 1250 + points[0]!.phase * 850,
    delay: points[0]!.phase * 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
});

test('Bosco water highlights follow the authored pool, remain deterministic, and stop moving in reduced mode', () => {
  const effect = forestMap.ambientEffects?.find(item => item.kind === 'water-shimmer');
  assert.ok(effect && effect.kind === 'water-shimmer');
  const forestTiles = JSON.parse(readFileSync(fileURLToPath(new URL('../../public/tilemaps/d01_bosco_veli.tmj', import.meta.url)), 'utf8'));
  const collisionLayer = forestTiles.layers.find(layer => layer.name === 'collision');
  assert.ok(collisionLayer && collisionLayer.type === 'objectgroup');
  const poolTiles = collisionLayer.objects.filter(object => object.name.startsWith('pool-water-'));
  assert.equal(poolTiles.length, 15);

  const points = createWaterShimmerPoints(forestMap.id, effect);
  assert.equal(points.length, effect.count);
  assert.deepEqual(points, createWaterShimmerPoints(forestMap.id, effect));
  for (const point of points) {
    assert.ok(poolTiles.some(tile => point.x >= tile.x && point.x <= tile.x + tile.width && point.y >= tile.y && point.y <= tile.y + tile.height));
    assert.ok(effect.colors.includes(point.color));
    assert.ok(point.phase >= 0 && point.phase < 1);
  }

  assert.equal(getWaterShimmerTween(points[0]!, true), null);
  assert.deepEqual(getWaterShimmerTween(points[0]!, false), {
    x: { from: points[0]!.x - 3, to: points[0]!.x + 3 },
    alpha: { from: .18, to: .62 },
    duration: 1500 + points[0]!.phase * 1200,
    delay: points[0]!.phase * 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
});

test('R01 grass tufts are stable and stay inside the encounter zones they reference', () => {
  const effect = routeMap.ambientEffects?.find(item => item.kind === 'grass-sway');
  assert.ok(effect && effect.kind === 'grass-sway');
  const routeTiles = JSON.parse(readFileSync(fileURLToPath(new URL('../../public/tilemaps/r01_sentiero_alba.tmj', import.meta.url)), 'utf8'));
  const triggerLayer = routeTiles.layers.find(layer => layer.name === 'triggers');
  assert.ok(triggerLayer && triggerLayer.type === 'objectgroup');
  const areas = effect.triggerIds.map(id => {
    const trigger = triggerLayer.objects.find(object => object.name === id);
    assert.ok(trigger);
    assert.ok(trigger.properties?.some(property => property.name === 'kind' && property.value === 'encounter-zone'));
    return { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height };
  });
  const points = createGrassSwayPoints(routeMap.id, effect, areas);
  assert.equal(points.length, effect.tuftsPerArea * effect.triggerIds.length);
  assert.deepEqual(points, createGrassSwayPoints(routeMap.id, effect, areas));
  for (const point of points) {
    assert.ok(areas.some(area => point.x >= area.x && point.x <= area.x + area.width && point.y >= area.y && point.y <= area.y + area.height));
    assert.ok(effect.colors.includes(point.color));
    assert.ok(point.scale >= .8 && point.scale <= 1.2);
    assert.ok(point.phase >= 0 && point.phase < 1);
  }
});
