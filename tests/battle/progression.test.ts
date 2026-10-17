import assert from 'node:assert/strict';
import test from 'node:test';
import { experienceToNextLevel } from '../../src/core/battle/progression.ts';

test('prototype medium-fast curve uses cubic XP thresholds between consecutive levels', () => {
  const curve = { exponent: 3, multiplier: 1 };
  assert.equal(experienceToNextLevel(5, curve), 91);
  assert.equal(experienceToNextLevel(6, curve), 127);
});

test('growth curves reject invalid level and non-positive parameters', () => {
  assert.throws(() => experienceToNextLevel(0, { exponent: 3, multiplier: 1 }), /Invalid/);
  assert.throws(() => experienceToNextLevel(5, { exponent: 0, multiplier: 1 }), /Invalid/);
  assert.throws(() => experienceToNextLevel(5, { exponent: 3, multiplier: 0 }), /Invalid/);
});
