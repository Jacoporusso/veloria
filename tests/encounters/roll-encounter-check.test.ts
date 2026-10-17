import assert from 'node:assert/strict';
import test from 'node:test';
import { rollEncounterCheck } from '../../src/core/encounters/roll-encounter-check.ts';

test('rolls deterministically and advances the save RNG state once', () => {
  const first = rollEncounterCheck(1, 0.001);
  assert.deepEqual(first, { encounter: true, nextRngState: 270369 });
  assert.deepEqual(rollEncounterCheck(1, 0.001), first);
  assert.deepEqual(rollEncounterCheck(0, 0.3), { encounter: true, nextRngState: 1085196063 });
});

test('chance boundaries always consume one draw and produce the expected result', () => {
  assert.deepEqual(rollEncounterCheck(1, 0), { encounter: false, nextRngState: 270369 });
  assert.deepEqual(rollEncounterCheck(1, 1), { encounter: true, nextRngState: 270369 });
  assert.equal(rollEncounterCheck(1, 0.000062).encounter, false);
  assert.equal(rollEncounterCheck(1, 0.000063).encounter, true);
});

test('rejects invalid probabilities and RNG states', () => {
  for (const chance of [-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => rollEncounterCheck(1, chance), /chance/);
  }
  assert.throws(() => rollEncounterCheck(-1, 0.5), /rngState/);
  assert.throws(() => rollEncounterCheck(1.5, 0.5), /rngState/);
});
