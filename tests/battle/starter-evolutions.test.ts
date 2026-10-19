import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import progression from '../../content/battle/progression.v1.json' with { type: 'json' };
import learnsets from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import { createBattleCreature, createBattleCreatureFromSave, type SpeciesBattleRegistry, type BattleMoveRegistry } from '../../src/core/battle/create-creature.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules, type BattleRules, type EvolutionRule } from '../../src/core/battle/rules.ts';
import { experienceToNextLevel } from '../../src/core/battle/progression.ts';
import { mergeBattlePlayerState } from '../../src/game/battle/create-battle-state.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = moveData.moves as BattleMoveRegistry;
const evolutions: Record<number, EvolutionRule[]> = {};
for (const rule of progression.evolutions) (evolutions[rule.fromSpeciesId] ??= []).push({ minimumLevel: rule.minimumLevel, target: species[rule.toSpeciesId] });
const rules: BattleRules = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1,
  experienceCurves: progression.growthCurves, evolutions,
  levelUpMoves: Object.fromEntries(Object.entries(learnsets.species).map(([id, entries]) => [id, entries.map(entry => ({ ...entry, maxPp: moves[entry.moveId].maxPp }))])),
};

function defeatWild(speciesId: number, experience: number, level = 15) {
  const creature = createBattleCreature({ species, moves, speciesId, level, experience, instanceId: `starter-${speciesId}` });
  const injured = { ...creature, hp: creature.stats.maxHp - 5 };
  const target = { ...createBattleCreature({ species, moves, speciesId: 10, level: 3, instanceId: 'wild' }), hp: 1 };
  const state = createBattleState({ battleId: 'starter-evolution', battleType: 'wild', seed: 17, rules, playerTeam: [injured], opponentTeam: [target] });
  const moveSlot = injured.moves.findIndex(slot => moves[slot.moveId].power > 0);
  const transition = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, rules);
  return { injured, moveSlot, ...transition };
}

for (const [fromId, toId, threshold] of [[1, 2, 16], [4, 5, 16], [7, 8, 16], [16, 17, 18], [19, 20, 20], [161, 162, 15], [163, 164, 20], [179, 180, 15], [194, 195, 20], [72, 73, 30], [98, 99, 28], [170, 171, 27], [79, 80, 37], [96, 97, 26], [177, 178, 25]]) {
  test(`${species[fromId].name} evolves at level ${threshold} and preserves identity, injury and spent PP through saving`, () => {
    const required = experienceToNextLevel(threshold - 1, progression.growthCurves.veloria_medium_fast_v1);
    const { injured, moveSlot, state, events } = defeatWild(fromId, required - 1, threshold - 1);
    const evolved = state.player.creatures[0];
    assert.equal(evolved.speciesId, toId);
    assert.equal(evolved.level, threshold);
    assert.equal(evolved.instanceId, injured.instanceId);
    assert.equal(evolved.hp, evolved.stats.maxHp - 5);
    assert.equal(evolved.moves[moveSlot].pp, injured.moves[moveSlot].pp - 1);
    assert.deepEqual(evolved.types, species[toId].types);
    assert.equal(events.filter(event => event.type === 'creatureEvolved').length, 1);
    assert.ok(evolved.moves.length <= 4);
    assert.equal(new Set(evolved.moves.map(slot => slot.moveId)).size, evolved.moves.length);
    const save: GameSave = { schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'starter-evolution', savedAt: '2026-10-17T00:00:00Z',
      player: { name: 'Aurora', mapId: 'veloria/borgofonte', spawnPointId: 'start', x: 20, y: 20, money: 300 },
      party: [], storage: [], flags: [], badges: [], inventory: {}, rngState: 17 };
    const persisted = structuredClone(mergeBattlePlayerState(save, state));
    const reloaded = createBattleCreatureFromSave(persisted.party[0], { species, moves });
    assert.equal(reloaded.speciesId, toId);
    assert.equal(reloaded.instanceId, injured.instanceId);
    assert.equal(reloaded.hp, evolved.hp);
    assert.deepEqual(reloaded.moves, evolved.moves);
    assert.equal(persisted.party.length, 1);
  });

  test(`${species[fromId].name} stays in its original form below level ${threshold}`, () => {
    const { state, events } = defeatWild(fromId, 0, threshold - 1);
    assert.equal(state.player.creatures[0].speciesId, fromId);
    assert.equal(state.player.creatures[0].level, threshold - 1);
    assert.equal(events.some(event => event.type === 'creatureEvolved'), false);
  });
}
