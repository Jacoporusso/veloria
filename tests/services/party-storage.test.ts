import assert from 'node:assert/strict';
import test from 'node:test';
import { moveCreatureToStorage, withdrawCreatureFromStorage } from '../../src/core/services/party-storage.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const createSave = (partyCount = 2): GameSave => ({
  schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'save', savedAt: '2026-10-17T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/brumalta', spawnPointId: 'from_r02', money: 10, x: 1, y: 1 },
  party: Array.from({ length: partyCount }, (_, i) => ({
    instanceId: `creature-${i + 1}`, speciesId: i === 0 ? 25 : 16, level: 5 + i, experience: 14,
    hp: 9, maxHp: 20, moves: [{ id: 'tackle', pp: 7 }], status: i === 0 ? { status: 'poison' as const } : undefined,
  })), storage: [], flags: [], badges: [], inventory: {}, rngState: 1,
});

test('deposit and withdraw preserve full creature state and keep records unique', () => {
  const save = createSave();
  const deposited = moveCreatureToStorage(save, 'creature-1');
  assert.equal(deposited.ok, true);
  if (!deposited.ok) return;
  assert.equal(deposited.save.party.length, 1);
  assert.deepEqual(deposited.save.storage[0], save.party[0]);
  const withdrawn = withdrawCreatureFromStorage(deposited.save, 'creature-1');
  assert.equal(withdrawn.ok, true);
  if (!withdrawn.ok) return;
  assert.deepEqual(withdrawn.save.party[1], save.party[0]);
  assert.equal(withdrawn.save.storage.length, 0);
  assert.equal(save.party.length, 2, 'source save remains unchanged');
});

test('does not allow depositing the last party member or exceeding the party limit', () => {
  const alone = moveCreatureToStorage(createSave(1), 'creature-1');
  assert.deepEqual(alone, { ok: false, reason: 'lastPartyMember' });
  const full = createSave(6);
  full.storage.push({ instanceId: 'stored-1', speciesId: 52, level: 3, experience: 0, hp: 8, maxHp: 8, moves: [] });
  assert.deepEqual(withdrawCreatureFromStorage(full, 'stored-1'), { ok: false, reason: 'partyFull' });
});

test('rejects legacy or malformed box entries that cannot form a party creature', () => {
  const save = createSave(1);
  save.storage.push({ instanceId: 'legacy-1', speciesId: 16 });
  assert.deepEqual(withdrawCreatureFromStorage(save, 'legacy-1'), { ok: false, reason: 'invalidStoredCreature' });
});
