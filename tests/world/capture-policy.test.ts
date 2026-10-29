import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import chartData from '../../content/battle/type-chart.v1.json' with { type: 'json' };
import { createBattleCreature, type BattleMoveRegistry, type SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';
import { estimateMoveDamage } from '../../src/core/battle/damage.ts';
import { prototypeBattleRules, type TypeChart } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';
import { chooseCaptureWeakeningMove, type CaptureMoveForecast } from '../../tests/playtests/helpers/capture-policy.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = movesData.moves as BattleMoveRegistry;
const rules = { ...prototypeBattleRules, typeChart: chartData.chart as TypeChart };
const creature = (speciesId: number, level: number, moveIds: readonly string[], instanceId: string) =>
  createBattleCreature({ species, moves, speciesId, level, moveIds, instanceId });

function forecastsFor(own: BattleCreature, target: BattleCreature): Record<string, CaptureMoveForecast> {
  return Object.fromEntries(own.moves.map(slot => {
    const move = moves[slot.moveId];
    const damage = estimateMoveDamage(own, target, move, rules);
    return [slot.moveId, damage ? { ...damage, accuracy: move.accuracy } : undefined];
  }));
}

test('Charmeleon chooses Scratch over a potentially lethal Ember against Exeggcute', () => {
  const own = creature(5, 35, ['scratch', 'ember'], 'charmeleon-capture');
  const targetBase = creature(102, 20, ['tackle'], 'exeggcute-target');
  const fullForecasts = forecastsFor(own, targetBase);
  const scratchMaximum = fullForecasts.scratch!.maximum;
  const emberMaximum = fullForecasts.ember!.maximum;
  assert.ok(scratchMaximum < emberMaximum, 'local chart and damage forecast make Ember stronger than Scratch');
  const visibleTargetHp = Math.floor((scratchMaximum + emberMaximum) / 2);
  assert.ok(visibleTargetHp > scratchMaximum && visibleTargetHp <= emberMaximum);
  const target = { ...targetBase, hp: visibleTargetHp };
  const forecasts = forecastsFor(own, target);
  const before = structuredClone({ own, forecasts, target });

  assert.equal(chooseCaptureWeakeningMove(own, moves, forecasts, visibleTargetHp), moves.scratch);
  assert.deepEqual({ own, forecasts, target }, before);
});

test('zero-PP and zero-damage moves are not capture attacks', () => {
  const ownBase = creature(5, 35, ['scratch'], 'spent-scratch');
  const own = { ...ownBase, moves: ownBase.moves.map(slot => ({ ...slot, pp: 0 })) };
  const grassTarget = creature(102, 20, ['tackle'], 'exeggcute-pp-target');
  const scratchForecast = forecastsFor(ownBase, grassTarget);
  assert.ok(scratchForecast.scratch!.maximum > 0);
  assert.equal(chooseCaptureWeakeningMove(own, moves, scratchForecast, grassTarget.hp), undefined);

  const ghostTarget = creature(92, 20, ['lick'], 'gastly-target');
  const ghostForecast = forecastsFor(ownBase, ghostTarget);
  assert.equal(ghostForecast.scratch!.maximum, 0);
  assert.equal(chooseCaptureWeakeningMove(ownBase, moves, ghostForecast, ghostTarget.hp), undefined);
});

test('returns undefined when all known damaging moves could KO at visible target HP', () => {
  const own = creature(5, 35, ['scratch', 'ember'], 'charmeleon-no-safe-hit');
  const target = { ...creature(102, 20, ['tackle'], 'exeggcute-one-hp'), hp: 1 };
  const forecasts = forecastsFor(own, target);
  assert.ok(own.moves.every(slot => (forecasts[slot.moveId]?.maximum ?? 0) >= target.hp));

  assert.equal(chooseCaptureWeakeningMove(own, moves, forecasts, target.hp), undefined);
});

test('uses only owned moves and their supplied local definitions', () => {
  const own = creature(5, 35, ['scratch'], 'charmeleon-owned-only');
  const target = creature(102, 20, ['tackle'], 'exeggcute-owned-only');
  const extraMove = moves.ember as MoveDefinition;
  const forecasts = { ...forecastsFor(own, target), ember: { minimum: 1, maximum: 1, accuracy: 100 } };

  assert.equal(chooseCaptureWeakeningMove(own, moves, forecasts, target.hp), moves.scratch);
  assert.ok(extraMove, 'test data includes Ember but the creature does not know it');
});
