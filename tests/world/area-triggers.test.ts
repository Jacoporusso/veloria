import assert from 'node:assert/strict';
import test from 'node:test';
import { selectAreaTrigger } from '../../src/core/world/area-triggers.ts';

test('a house doorway takes priority over its overlapping village message regardless of object order', () => {
  const ambient = { id: 'bread', kind: 'message', x: 320, y: 320, width: 256, height: 160 };
  const door = { id: 'home', kind: 'map-exit', x: 480, y: 416, width: 32, height: 32 };
  const triggers = [ambient, door];
  assert.equal(selectAreaTrigger(triggers, { x: 496, y: 432 }), door);
  assert.equal(selectAreaTrigger([door, ambient], { x: 496, y: 432 }), door);
  assert.deepEqual(triggers, [ambient, door]);
  assert.equal(selectAreaTrigger(triggers, { x: 464, y: 432 }), ambient);
});

test('non-exit triggers retain author order and right/bottom rectangle boundaries are exclusive', () => {
  const quest = { kind: 'quest', x: 32, y: 32, width: 32, height: 32 };
  const grass = { kind: 'encounter-zone', x: 0, y: 0, width: 64, height: 64 };
  assert.equal(selectAreaTrigger([quest, grass], { x: 32, y: 32 }), quest);
  assert.equal(selectAreaTrigger([grass, quest], { x: 32, y: 32 }), grass);
  assert.equal(selectAreaTrigger([quest], { x: 64, y: 48 }), undefined);
  assert.equal(selectAreaTrigger([quest], { x: 48, y: 64 }), undefined);
  assert.equal(selectAreaTrigger([], { x: 0, y: 0 }), undefined);
});
