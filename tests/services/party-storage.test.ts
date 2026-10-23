import assert from 'node:assert/strict';
import test from 'node:test';
import { moveCreatureToStorage, withdrawCreatureFromStorage, transferSelectedCreatures } from '../../src/core/services/party-storage.ts';
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


test('batch exchange validates final size and preserves all records atomically', () => {
  const save = createSave(6);
  const boxed = { ...save.party[0], instanceId: 'boxed' };
  save.storage = [boxed];
  const before = structuredClone(save);
  const result = transferSelectedCreatures(save, ['creature-1', 'creature-2'], ['boxed']);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.save.party, [...save.party.slice(2), boxed]);
  assert.deepEqual(result.save.storage, save.party.slice(0, 2));
  assert.deepEqual(save, before);
  assert.equal(transferSelectedCreatures(save, [], ['boxed']).ok, false);
  assert.equal(transferSelectedCreatures(save, save.party.map(p => p.instanceId), []).ok, false);
  assert.equal(transferSelectedCreatures(save, ['missing'], []).ok, false);
  assert.equal(transferSelectedCreatures(save, ['creature-1', 'creature-1'], []).ok, false);
  const replacement = transferSelectedCreatures(save, save.party.map(p => p.instanceId), ['boxed']);
  assert.equal(replacement.ok, true);
  if (replacement.ok) assert.deepEqual(replacement.save.party, [boxed]);
  const invalid = { ...save, storage: [{ instanceId: 'bad', speciesId: 16 }] };
  assert.equal(transferSelectedCreatures(invalid, ['creature-1'], ['bad']).ok, false);
  assert.deepEqual(invalid.party, before.party);
});
