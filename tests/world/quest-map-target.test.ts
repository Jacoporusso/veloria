import assert from 'node:assert/strict';
import test from 'node:test';
import { questMapTarget } from '../../src/core/quests/quest-map-target.ts';

const point = { mapId: 'veloria/a', objectName: 'Misuratore', x: 176, y: 451, source: 'map#object-1' };
const quest = { id: 'test', completionFlag: 'done', steps: [
  { trigger: 'read/first', setFlag: 'first', requiresFlags: ['unlocked'] },
  { trigger: 'read/second', setFlag: 'second', requiresFlags: ['unlocked'] },
] };
const events = { 'read/first': [point], 'read/second': [{ ...point, mapId: 'veloria/b' }, { ...point, mapId: 'veloria/c' }] };

test('quest navigation skips completed and locked steps without changing flags or target data', () => {
  const flags = Object.freeze(['unlocked', 'first']);
  const before = structuredClone(events);
  assert.deepEqual(questMapTarget(quest, flags, events, 'veloria/c'), { ...point, mapId: 'veloria/c', stepFlag: 'second' });
  assert.deepEqual(events, before); assert.deepEqual(flags, ['unlocked', 'first']);
  assert.equal(questMapTarget(quest, [], events), undefined);
  assert.equal(questMapTarget(quest, ['done', 'unlocked'], events), undefined);
});

test('an explicit parallel objective keeps its own physical source instead of the first pending step', () => {
  assert.deepEqual(questMapTarget(quest, ['unlocked'], events, undefined, 'second'), { ...point, mapId: 'veloria/b', stepFlag: 'second' });
  assert.equal(questMapTarget(quest, ['unlocked'], {}, undefined, 'first'), undefined);
});
