import assert from 'node:assert/strict';
import test from 'node:test';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { replaceLearnedMove } from '../../src/core/battle/move-learning.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleMoveRegistry, SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';

const species = (speciesData as { species: SpeciesBattleRegistry }).species;
const moves = (moveData as { moves: BattleMoveRegistry }).moves;

function battleWithFullMoves() {
  const rules = {
    ...prototypeBattleRules,
    criticalChance: 0,
    minimumDamageVariance: 1,
    maximumDamageVariance: 1,
    experienceCurves: { veloria_medium_fast_v1: { exponent: 3, multiplier: 1 } },
    levelUpMoves: { 1: [{ level: 6, moveId: 'vine-whip', maxPp: moves['vine-whip'].maxPp }] },
  };
  const player = createBattleCreature({
    species, moves, speciesId: 1, level: 5, instanceId: 'learner-bulbasaur',
    moveIds: ['tackle', 'growl', 'tail-whip', 'scratch'],
  });
  const opponentBase = createBattleCreature({ species, moves, speciesId: 10, level: 3, instanceId: 'lesson-caterpie' });
  const opponent = { ...opponentBase, hp: 1, level: 7, experienceYield: 91, stats: { ...opponentBase.stats, speed: 1 } };
  const state = createBattleState({
    battleId: 'move-learning-terminal-choice', battleType: 'wild', seed: 17,
    rules, playerTeam: [player], opponentTeam: [opponent],
  });
  const transition = resolveBattleTurn(state, {
    player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, rules);
  return { rules, player, state, transition };
}

test('a full moveset reports a pending learned move even when its battle ends', () => {
  const { transition } = battleWithFullMoves();
  assert.equal(transition.state.outcome.kind, 'won');
  assert.equal(transition.state.player.creatures[0].level, 6);
  assert.deepEqual(transition.state.player.creatures[0].moves.map(slot => slot.moveId), ['tackle', 'growl', 'tail-whip', 'scratch']);
  assert.ok(transition.events.some(event => event.type === 'moveLearningSkipped' && event.moveId === 'vine-whip'));
});

test('replacing a learned move gives full PP and preserves all other battle and move state', () => {
  const { transition, player } = battleWithFullMoves();
  const replaced = replaceLearnedMove(transition.state, player.instanceId, 'vine-whip', 2, 4, moves);

  assert.deepEqual(replaced.player.creatures[0].moves, [
    { ...transition.state.player.creatures[0].moves[0], pp: player.moves[0].pp - 1 },
    transition.state.player.creatures[0].moves[1],
    { moveId: 'vine-whip', pp: moves['vine-whip'].maxPp },
    transition.state.player.creatures[0].moves[3],
  ]);
  assert.equal(replaced.outcome, transition.state.outcome);
  assert.equal(replaced.turn, transition.state.turn);
  assert.equal(replaced.player.creatures[0].speciesId, transition.state.player.creatures[0].speciesId);
  assert.equal(player.moves[0].pp, moves.tackle.maxPp);
  assert.equal(player.moves[2].moveId, 'tail-whip');
});

test('move replacement rejects invalid creatures, slots, duplicate moves, capacity and catalog entries', () => {
  const { transition, player } = battleWithFullMoves();
  const replace = (creatureId: string, moveId: string, slotIndex: number, maxMoves = 4, catalog = moves) =>
    replaceLearnedMove(transition.state, creatureId, moveId, slotIndex, maxMoves, catalog);

  assert.throws(() => replace('missing-creature', 'vine-whip', 0), /Unknown player creature/);
  assert.throws(() => replace(player.instanceId, 'vine-whip', -1), /Invalid move slot/);
  assert.throws(() => replace(player.instanceId, 'vine-whip', 4), /Invalid move slot/);
  assert.throws(() => replace(player.instanceId, 'tackle', 0), /already knows/);
  assert.throws(() => replace(player.instanceId, 'vine-whip', 0, 5), /does not have a full moveset/);
  assert.throws(() => replace(player.instanceId, 'unknown-move', 0), /Unknown or invalid learned move/);
});
