import assert from 'node:assert/strict';
import test from 'node:test';
import { moveCreatureToFirstSlot, moveCreatureToSlot } from '../../src/core/services/party-order.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const createSave = (): GameSave => ({
  schemaVersion: 2, saveRevision: 7, contentVersion: 'test', saveId: 'save', savedAt: '2026-10-17T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/brumalta', spawnPointId: 'from_r02', money: 10, x: 1, y: 1 },
  party: [
    { instanceId: 'one', speciesId: 25, level: 5, experience: 19, hp: 0, maxHp: 20, moves: [{ id: 'tackle', pp: 3 }], status: { status: 'poison' } },
    { instanceId: 'two', speciesId: 16, level: 8, experience: 31, hp: 12, maxHp: 24, moves: [{ id: 'gust', pp: 6 }, { id: 'quick-attack', pp: 9 }] },
    { instanceId: 'three', speciesId: 4, level: 7, experience: 25, hp: 17, maxHp: 22, moves: [{ id: 'ember', pp: 8 }] },
  ],
  storage: [{ instanceId: 'boxed', speciesId: 52, extra: { preserved: true } }],
  flags: ['flag'], badges: ['badge'], inventory: { potion: 2 }, rngState: 1234,
});

test('moves the selected party member to first while preserving every saved record and field', () => {
  const save = createSave();
  const originalParty = [...save.party];
  const result = moveCreatureToFirstSlot(save, 'three');

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.save.party.map(creature => creature.instanceId), ['three', 'one', 'two']);
  assert.deepEqual(result.save.party[0], save.party[2]);
  assert.deepEqual(result.save.party.slice(1), [save.party[0], save.party[1]]);
  assert.equal(result.save.party[0], save.party[2], 'the creature record is reused without reconstruction');
  assert.deepEqual(save.party, originalParty, 'the input save remains unchanged');
  assert.deepEqual({ ...result.save, party: save.party }, save, 'all non-party save fields remain unchanged');
});

test('allows a fainted creature to lead and preserves its HP, PP, status, and experience', () => {
  const save = createSave();
  const fainted = { ...save.party[2]!, hp: 0, status: { status: 'poison' as const } };
  save.party[2] = fainted;
  const result = moveCreatureToFirstSlot(save, fainted.instanceId);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.save.party[0], fainted);
  assert.equal(result.save.party[0]!.hp, 0);
  assert.equal(result.save.party[0]!.moves[0]!.pp, 8);
  assert.deepEqual(result.save.party[0]!.status, { status: 'poison' });
  assert.equal(result.save.party[0]!.experience, 25);
});

test('returns the same save when the requested creature is already first', () => {
  const save = createSave();
  const result = moveCreatureToFirstSlot(save, 'one');

  assert.deepEqual(result, { ok: true, save });
  if (result.ok) assert.equal(result.save, save);
});

test('rejects an instance id that is not in the party without changing the save', () => {
  const save = createSave();
  assert.deepEqual(moveCreatureToFirstSlot(save, 'missing'), { ok: false, reason: 'notFound' });
  assert.deepEqual(save, createSave());
});


test('inserts at either end or an intermediate slot without losing members', () => {
  const save = createSave();
  const moved = moveCreatureToSlot(save, 'one', 2);
  assert.equal(moved.ok, true);
  if (!moved.ok) return;
  assert.deepEqual(moved.save.party.map(p => p.instanceId), ['two', 'three', 'one']);
  const middle = moveCreatureToSlot(moved.save, 'one', 1);
  assert.equal(middle.ok, true);
  if (middle.ok) assert.deepEqual(middle.save.party.map(p => p.instanceId), ['two', 'one', 'three']);
  for (const index of [-1, 3, 1.5, NaN]) assert.equal(moveCreatureToSlot(save, 'one', index).ok, false);
  assert.deepEqual(save, createSave());
});
