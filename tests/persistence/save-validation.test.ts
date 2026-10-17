import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSave } from '../../src/persistence/save-validation.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

function currentSave(): GameSave {
  return {
    schemaVersion: 2,
    saveRevision: 3,
    contentVersion: 'veloria-content-0.3',
    saveId: 'test-save-001',
    savedAt: '2026-10-09T19:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/borgofonte', spawnPointId: 'start', money: 0, x: 1, y: 2 },
    party: [{ instanceId: 'creature-001', speciesId: 25, level: 5, experience: 0, hp: 19, maxHp: 19, moves: [{ id: 'thunder-shock', pp: 30 }] }],
    storage: [], flags: [], badges: [], inventory: { potion: 0 }, rngState: 1,
  };
}

test('deep validation accepts a complete current save', () => {
  assert.deepEqual(validateSave(currentSave()), { valid: true, version: 2 });
});

test('deep validation rejects impossible creature state, duplicate IDs and unknown current fields', () => {
  const invalid = currentSave();
  invalid.party[0].hp = 20;
  invalid.storage.push({ instanceId: 'creature-001', speciesId: 25 });
  (invalid as GameSave & { unexpected: boolean }).unexpected = true;
  const result = validateSave(invalid);
  assert.equal(result.valid, false);
  if (result.valid) return;
  assert.ok(result.issues.some(issue => issue.includes('hp')));
  assert.ok(result.issues.some(issue => issue.includes('duplicate creature instance ID')));
  assert.ok(result.issues.some(issue => issue.includes('unknown property')));
});

test('deep validation enforces party, move, inventory, flag and RNG limits', () => {
  const invalid = currentSave();
  invalid.party[0].moves.push({ id: 'a', pp: 0 }, { id: 'b', pp: 0 }, { id: 'c', pp: 0 }, { id: 'd', pp: 0 });
  invalid.flags = ['q_started', 'q_started'];
  invalid.inventory.potion = -1;
  invalid.rngState = -1;
  const result = validateSave(invalid);
  assert.equal(result.valid, false);
  if (result.valid) return;
  assert.ok(result.issues.some(issue => issue.includes('at most 4 moves')));
  assert.ok(result.issues.some(issue => issue.includes('duplicate value')));
  assert.ok(result.issues.some(issue => issue.includes('inventory.potion')));
  assert.ok(result.issues.some(issue => issue.includes('rngState')));
});

test('v1 compatibility preserves the old schema allowances for storage and RNG values', () => {
  const legacy = {
    schemaVersion: 1,
    contentVersion: 'veloria-content-0.3',
    saveId: 'legacy-save-002',
    savedAt: '2026-10-09T19:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/borgofonte', spawnPointId: 'start', money: 0 },
    party: [], storage: [{ instanceId: 'legacy-box-001', speciesId: 0 }], flags: [], badges: [], inventory: {}, rngState: 0x1_0000_0000,
  };
  assert.deepEqual(validateSave(legacy), { valid: true, version: 1 });
});

test('v2 accepts optional major statuses with valid duration rules and old status-less records', () => {
  const save = currentSave();
  assert.deepEqual(validateSave(save), { valid: true, version: 2 });

  const cases = [
    { status: 'burn' },
    { status: 'poison' },
    { status: 'paralysis' },
    { status: 'sleep', turnsRemaining: 2 },
    { status: 'freeze', turnsRemaining: 3 },
    { status: 'freeze' },
  ] as const;
  for (const status of cases) {
    save.party[0].status = status;
    assert.deepEqual(validateSave(save), { valid: true, version: 2 }, `expected valid status ${status.status}`);
  }
});

test('v2 rejects unknown statuses and invalid turnsRemaining combinations', () => {
  const save = currentSave();
  const invalidCases = [
    { status: 'confused' },
    { status: 'burn', turnsRemaining: 2 },
    { status: 'sleep' },
    { status: 'freeze', turnsRemaining: 0 },
    { status: 'sleep', turnsRemaining: 1.5 },
  ];
  for (const status of invalidCases) {
    save.party[0].status = status as never;
    assert.equal(validateSave(save).valid, false, `expected invalid status ${JSON.stringify(status)}`);
  }
});
