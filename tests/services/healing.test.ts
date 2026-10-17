import assert from 'node:assert/strict';
import test from 'node:test';
import { healParty } from '../../src/core/services/healing.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

test('healing restores party HP, PP and statuses without changing the source save', () => {
  const save: GameSave = {
    schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'save', savedAt: '2026-10-17T00:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/brumalta', spawnPointId: 'from_r02', money: 10, x: 1, y: 1 },
    party: [{
      instanceId: 'starter-1', speciesId: 25, level: 5, experience: 0, hp: 4, maxHp: 18,
      moves: [{ id: 'thunder-shock', pp: 3 }, { id: 'growl', pp: 1 }],
      status: { status: 'poison' },
    }],
    storage: [], flags: [], badges: [], inventory: {}, rngState: 1,
  };
  const healed = healParty(save, {
    'thunder-shock': { id: 'thunder-shock', name: 'Tuonoshock', type: 'electric', category: 'special', power: 40, accuracy: 100, priority: 0, maxPp: 30 },
    growl: { id: 'growl', name: 'Ruggito', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 40 },
  });
  assert.equal(healed.party[0].hp, 18);
  assert.deepEqual(healed.party[0].moves, [{ id: 'thunder-shock', pp: 30 }, { id: 'growl', pp: 40 }]);
  assert.equal(healed.party[0].status, undefined);
  assert.equal('status' in healed.party[0], false);
  assert.equal(save.party[0].hp, 4);
  assert.deepEqual(save.party[0].status, { status: 'poison' });
});
