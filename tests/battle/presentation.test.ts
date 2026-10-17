import assert from 'node:assert/strict';
import test from 'node:test';
import { battleExperienceProgress, battleRewardSummary } from '../../src/game/battle/presentation.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, BattleEvent } from '../../src/core/battle/types.ts';

test('XP presentation uses the remaining-per-level core curve, without inventing lifetime XP', () => {
  const creature = { level: 5, experience: 45, growthCurveId: 'veloria_medium_fast_v1' } as BattleCreature;
  assert.deepEqual(battleExperienceProgress(creature, prototypeBattleRules), { ratio: 45 / 91, label: '45/91 XP' });
  assert.equal(battleExperienceProgress({ ...creature, growthCurveId: undefined }, prototypeBattleRules), undefined);
  assert.deepEqual(battleExperienceProgress({ ...creature, level: 100 }, prototypeBattleRules), { ratio: 1, label: 'LIVELLO MASSIMO' });
});

test('reward summary aggregates only actual player XP, levels and captures', () => {
  const events: BattleEvent[] = [
    { type: 'experienceGained', side: 'player', creatureId: 'a', amount: 90, sourceCreatureId: 'b' },
    { type: 'experienceGained', side: 'opponent', creatureId: 'b', amount: 100, sourceCreatureId: 'a' },
    { type: 'levelUp', side: 'player', creatureId: 'a', previousLevel: 5, level: 6 },
    { type: 'creatureCaptured', side: 'player', wildCreatureId: 'b', creatureId: 'c', destination: 'storage' },
  ];
  assert.deepEqual(battleRewardSummary(events), ['+90 XP', '+1 LIVELLO', '1 NUOVA CATTURA']);
  assert.deepEqual(battleRewardSummary([]), []);
});
