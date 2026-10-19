import assert from 'node:assert/strict';
import test from 'node:test';
import data from '../../content/battle/moves.v1.json' with { type: 'json' };
import type { MoveDefinition } from '../../src/core/battle/types.ts';

const moves = data.moves as Record<string, MoveDefinition>;

test('coastal moves preserve distinct HGSS power, PP, category and secondary effects', () => {
  const beam = moves['bubble-beam'];
  assert.deepEqual([beam.name, beam.category, beam.type, beam.power, beam.accuracy, beam.maxPp],
    ['Bollaraggio', 'special', 'water', 65, 100, 20]);
  assert.deepEqual(beam.statChanges, [{ target: 'opponent', stat: 'speed', stages: -1 }]);
  assert.equal(beam.statChangeChance, 10);

  const grip = moves['vice-grip'];
  assert.deepEqual([grip.name, grip.category, grip.type, grip.power, grip.accuracy, grip.maxPp],
    ['Presa', 'physical', 'normal', 55, 100, 30]);
  assert.equal(grip.statChanges, undefined);

  const barrier = moves.barrier;
  assert.deepEqual([barrier.name, barrier.category, barrier.power, barrier.maxPp, barrier.alwaysHits],
    ['Barriera', 'status', 0, 30, true]);
  assert.deepEqual(barrier.statChanges, [{ target: 'self', stat: 'defense', stages: 2 }]);
});
