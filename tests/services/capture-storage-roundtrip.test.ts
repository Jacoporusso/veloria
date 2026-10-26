import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import type { BattleMoveRegistry, SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';
import { moveCreatureToStorage } from '../../src/core/services/party-storage.ts';
import { createWildBattle, mergeBattlePlayerState } from '../../src/game/battle/create-battle-state.ts';
import { exportSave, importSave } from '../../src/persistence/save-backup.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = moveData.moves as BattleMoveRegistry;
const registries = { species, moves };

test('full party capture, deposit and backup reload keep the new instance exactly once', () => {
  const party = [25, 16, 19, 21, 23, 46].map((speciesId, index) => {
    const creature = createBattleCreature({ ...registries, speciesId, level: 5, instanceId: `party-${index + 1}` });
    return {
      instanceId: creature.instanceId,
      speciesId: creature.speciesId,
      level: creature.level,
      experience: creature.experience,
      hp: creature.hp,
      maxHp: creature.stats.maxHp,
      moves: creature.moves.map(move => ({ id: move.moveId, pp: move.pp })),
    };
  });
  const save: GameSave = {
    schemaVersion: 2,
    saveRevision: 1,
    contentVersion: 'test',
    saveId: 'capture-box-roundtrip',
    savedAt: '2026-10-17T10:00:00.000Z',
    player: { name: 'Allenatore', mapId: 'veloria/brumalta', spawnPointId: 'from_r02', money: 0, x: 2, y: 2 },
    party,
    storage: [],
    flags: [],
    badges: [],
    inventory: { 'poke-ball': 1 },
    rngState: 7,
  };
  const captureRules = {
    ...prototypeBattleRules,
    captureItems: { 'poke-ball': { baseChance: 1 } },
  };
  const battle = createWildBattle({
    save,
    speciesId: 10,
    level: 4,
    registries,
    rules: captureRules,
    battleId: 'wild-caterpie-001',
  });
  const captured = resolveBattleTurn(battle, {
    player: { kind: 'attemptCapture', itemId: 'poke-ball', captureInstanceId: 'captured-caterpie-001' },
    opponent: { kind: 'useMove', moveSlot: 0 },
  }, moves, captureRules).state;

  assert.deepEqual(captured.outcome, { kind: 'captured', creatureId: 'captured-caterpie-001', destination: 'storage' });
  const afterBattle = mergeBattlePlayerState(save, captured);
  assert.equal(afterBattle.party.length, 6);
  assert.deepEqual(afterBattle.storage.map(creature => creature.instanceId), ['captured-caterpie-001']);

  const deposited = moveCreatureToStorage(afterBattle, 'party-1');
  assert.equal(deposited.ok, true);
  if (!deposited.ok) return;
  const reloaded = importSave(exportSave(deposited.save, '2026-10-17T10:01:00.000Z'));
  const ids = [...reloaded.party, ...reloaded.storage].map(creature => creature.instanceId);
  assert.equal(reloaded.party.length, 5);
  assert.equal(reloaded.storage.length, 2);
  assert.equal(ids.length, 7);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(reloaded.storage.find(creature => creature.instanceId === 'captured-caterpie-001'), afterBattle.storage[0]);
  assert.equal(save.party.length, 6, 'operations must not mutate the source save');
});
