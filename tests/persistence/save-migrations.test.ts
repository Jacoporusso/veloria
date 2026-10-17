import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateSave, migrateV1ToV2 } from '../../src/persistence/save-migrations.ts';
import { validateSave } from '../../src/persistence/save-validation.ts';
import type { GameSaveV1 } from '../../src/persistence/save-types.ts';

function legacySave(overrides: Partial<GameSaveV1> = {}): GameSaveV1 {
  return {
    schemaVersion: 1,
    contentVersion: 'veloria-content-0.3',
    saveId: 'legacy-save-001',
    savedAt: '2026-10-09T19:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/borgofonte', spawnPointId: 'start', money: 300 },
    party: [{
      instanceId: 'creature-001', speciesId: 25, level: 5, experience: 0, hp: 19, maxHp: 19,
      moves: [{ id: 'thunder-shock', pp: 30 }],
    }],
    storage: [],
    flags: ['q_starter_selected'],
    badges: [],
    inventory: { potion: 2 },
    rngState: 1234567,
    ...overrides,
  };
}

test('v1 save with optional coordinates validates and migrates to detached v2 data', () => {
  const source = legacySave();
  assert.deepEqual(validateSave(source), { valid: true, version: 1 });

  const migrated = migrateV1ToV2(source);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.saveRevision, 1);
  assert.deepEqual({ x: migrated.player.x, y: migrated.player.y }, { x: 0, y: 0 });
  assert.equal(source.player.x, undefined);
  assert.notEqual(migrated.party, source.party);
});

test('migration entry point accepts v1 and returns the current schema', () => {
  const migrated = migrateSave(legacySave({ player: {
    name: 'Ada', mapId: 'veloria/borgofonte', spawnPointId: 'start', money: 17, x: 3, y: 9,
  } }));
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.player.x, 3);
  assert.equal(migrated.player.y, 9);
  assert.deepEqual(validateSave(migrated), { valid: true, version: 2 });
});

test('unsupported versions and invalid legacy payloads fail without being rewritten', () => {
  assert.throws(() => migrateSave({ ...legacySave(), schemaVersion: 99 }), /supported versions/);
  assert.throws(() => migrateSave({ ...legacySave(), party: [{ ...legacySave().party[0], hp: 20 }] }), /hp/);
});
