import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature, createBattleCreatureFromSave } from '../../src/core/battle/create-creature.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { SpeciesBattleRegistry, BattleMoveRegistry } from '../../src/core/battle/create-creature.ts';
import { mergeBattlePlayerState } from '../../src/game/battle/create-battle-state.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = moveData.moves as BattleMoveRegistry;

test('battle results round-trip HP, PP, experience, status and a captured storage entry', () => {
  const save: GameSave = {
    schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'save', savedAt: '2026-10-17T00:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/r01_sentiero_alba', spawnPointId: 'from_borgofonte', money: 0, x: 1, y: 1 },
    party: [{
      instanceId: 'starter-1', speciesId: 25, level: 5, experience: 0, hp: 18, maxHp: 18,
      moves: [{ id: 'thunder-shock', pp: 30 }],
    }], storage: [], flags: [], badges: [], inventory: {}, rngState: 123,
  };
  const player = createBattleCreatureFromSave(save.party[0], { species, moves });
  const opponent = createBattleCreature({ species, moves, speciesId: 19, level: 3, instanceId: 'wild-1' });
  const captured = { ...createBattleCreature({ species, moves, speciesId: 16, level: 2, instanceId: 'caught-1' }), status: { status: 'poison' as const } };
  const battle = createBattleState({
    battleId: 'save-roundtrip', battleType: 'wild', seed: 456, rules: prototypeBattleRules,
    playerTeam: [player], opponentTeam: [opponent], playerStorage: [captured],
  });
  const injured = {
    ...battle.player.creatures[0], hp: 7, experience: 52, statStages: { attack: -2, defense: 3 },
    moves: [{ moveId: 'thunder-shock', pp: 17 }], status: { status: 'sleep' as const, turnsRemaining: 2 },
  };
  const finalBattle = { ...battle, player: { ...battle.player, creatures: [injured] }, rngState: 789 };
  const result = mergeBattlePlayerState(save, finalBattle);

  assert.equal(result.party[0].hp, 7);
  assert.equal(Object.hasOwn(result.party[0], 'statStages'), false);
  assert.equal(createBattleCreatureFromSave(result.party[0], { species, moves }).statStages, undefined);
  assert.equal(result.party[0].experience, 52);
  assert.deepEqual(result.party[0].moves, [{ id: 'thunder-shock', pp: 17 }]);
  assert.deepEqual(result.party[0].status, { status: 'sleep', turnsRemaining: 2 });
  assert.deepEqual(result.storage[0].status, { status: 'poison' });
  assert.equal(result.rngState, 789);
  assert.equal(save.party[0].hp, 18);
});

test('an evolved creature is saved by its stable instance ID and rehydrates from the target species registry', () => {
  const localSpecies: SpeciesBattleRegistry = {
    90001: { speciesId: 90001, name: 'Seedling', types: ['grass'], baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 }, experienceYield: 20, defaultMoveIds: ['tackle'], growthCurveId: 'veloria_medium_fast_v1' },
    90002: { speciesId: 90002, name: 'Mossling', types: ['grass', 'bug'], baseStats: { hp: 65, attack: 70, defense: 70, specialAttack: 75, specialDefense: 75, speed: 65 }, experienceYield: 30, defaultMoveIds: ['tackle'], growthCurveId: 'veloria_medium_fast_v1' },
    90003: { speciesId: 90003, name: 'Forest Wisp', types: ['grass', 'flying'], baseStats: { hp: 75, attack: 82, defense: 80, specialAttack: 95, specialDefense: 86, speed: 95 }, experienceYield: 60, defaultMoveIds: ['tackle'], growthCurveId: 'veloria_medium_fast_v1' },
  };
  const localMoves: BattleMoveRegistry = {
    tackle: { id: 'tackle', name: 'Bump', type: 'normal', category: 'physical', power: 40, accuracy: 100, priority: 0, maxPp: 10 },
  };
  const save: GameSave = {
    schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'save-evolution', savedAt: '2026-10-17T00:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/r01_sentiero_alba', spawnPointId: 'from_borgofonte', money: 0, x: 1, y: 1 },
    party: [{ instanceId: 'evolving-instance', speciesId: 90001, level: 5, experience: 0, hp: 19, maxHp: 19, moves: [{ id: 'tackle', pp: 10 }] }],
    storage: [], flags: [], badges: [], inventory: {}, rngState: 123,
  };
  const player = createBattleCreatureFromSave(save.party[0], { species: localSpecies, moves: localMoves });
  const opponent = createBattleCreature({ species: localSpecies, moves: localMoves, speciesId: 90002, level: 3, instanceId: 'evolution-opponent' });
  const rules = {
    ...prototypeBattleRules,
    experienceCurves: { veloria_medium_fast_v1: { exponent: 3, multiplier: 1 } },
    evolutions: {
      90001: [{ minimumLevel: 6, target: localSpecies[90002] }],
      90002: [{ minimumLevel: 7, target: localSpecies[90003] }],
    },
  };
  const initial = createBattleState({ battleId: 'evolution-save', battleType: 'wild', seed: 456, rules, playerTeam: [player], opponentTeam: [{ ...opponent, hp: 1, experienceYield: 218 }] });
  const transition = resolveBattleTurn(initial, { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } }, localMoves, rules);
  const evolvedSave = mergeBattlePlayerState(save, transition.state);
  const rehydrated = createBattleCreatureFromSave(evolvedSave.party[0], { species: localSpecies, moves: localMoves });

  assert.equal(evolvedSave.party[0].instanceId, 'evolving-instance');
  assert.equal(evolvedSave.party[0].speciesId, 90003);
  assert.equal(rehydrated.instanceId, 'evolving-instance');
  assert.equal(rehydrated.speciesId, 90003);
  assert.equal(rehydrated.name, 'Forest Wisp');
});
