import test from 'node:test';
import assert from 'node:assert/strict';
import { overlaps, placeGuidance } from '../../src/game/ui/guidance-placement.ts';

test('upper-map guidance avoids the header and expanded journal', () => {
  const target = { x: 180, y: 70, width: 32, height: 32 };
  const obstacles = [{ x: 0, y: 0, width: 390, height: 64 }, { x: 16, y: 74, width: 300, height: 62 }];
  const result = placeGuidance(target, { width: 215, height: 34 }, { width: 390, height: 844 }, obstacles);
  assert.ok(result);
  assert.ok(!overlaps(result, target));
  assert.ok(obstacles.every(obstacle => !overlaps(result, obstacle, 8)));
});

test('offscreen targets and fully obstructed screens have no misleading pinned label', () => {
  const viewport = { width: 390, height: 390 };
  assert.equal(placeGuidance({ x: 500, y: 80, width: 32, height: 32 }, { width: 180, height: 34 }, viewport, []), undefined);
  assert.equal(placeGuidance({ x: 100, y: 100, width: 32, height: 32 }, { width: 180, height: 34 }, viewport, [{ x: 0, y: 0, ...viewport }]), undefined);
});

test('viewport dimensions may be inherited getters like a browser DOMRect', () => {
  const viewport = Object.create({ get width() { return 390; }, get height() { return 844; } });
  assert.ok(placeGuidance({ x: 150, y: 180, width: 32, height: 32 }, { width: 200, height: 34 }, viewport, []));
});

test('exit labels can move above the touch controls near the lower edge', () => {
  const obstacles = [{ x: 240, y: 650, width: 140, height: 180 }, { x: 8, y: 650, width: 130, height: 180 }];
  const result = placeGuidance({ x: 170, y: 800, width: 96, height: 32 }, { width: 225, height: 34 }, { width: 390, height: 844 }, obstacles);
  assert.ok(result);
  assert.ok(result.y + result.height < 650);
});
