import assert from 'node:assert/strict';
import test from 'node:test';
import { payDayReward } from '../../src/game/battle/pay-day-reward.ts';

test('scattered coins are collected after victory or capture, regardless of who scattered them', () => {
  assert.equal(payDayReward({ outcome: { kind: 'won', winner: 'player', reason: 'allFainted' }, payDayBonus: 150 }), 150);
  assert.equal(payDayReward({ outcome: { kind: 'captured', creatureId: 'caught', destination: 'storage' }, payDayBonus: 150 }), 150);
  assert.equal(payDayReward({ outcome: { kind: 'won', winner: 'player', reason: 'allFainted' } }), 0);
});

test('scattered coins are not awarded on fleeing, defeat, draw or an unfinished battle', () => {
  for (const outcome of [{ kind: 'fled', side: 'player' }, { kind: 'fled', side: 'opponent' },
    { kind: 'won', winner: 'opponent', reason: 'allFainted' }, { kind: 'draw' }, { kind: 'ongoing' }] as const) {
    assert.equal(payDayReward({ outcome, payDayBonus: 150 }), 0);
  }
});

test('invalid coin totals cannot enter the save balance', () => {
  for (const payDayBonus of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => payDayReward({ outcome: { kind: 'won', winner: 'player', reason: 'allFainted' }, payDayBonus }), /Invalid Pay Day/);
  }
});
