import assert from 'node:assert/strict';
import test from 'node:test';
import { exportSave, importSave } from '../../src/persistence/save-backup.ts';
import type { GameSaveV1 } from '../../src/persistence/save-types.ts';

function legacySave(): GameSaveV1 {
  return {
    schemaVersion: 1, contentVersion: 'veloria-content-0.3', saveId: 'backup-save-001', savedAt: '2026-10-09T19:00:00Z',
    player: { name: 'Allenatore', mapId: 'veloria/borgofonte', spawnPointId: 'start', money: 300, x: 20, y: 20 },
    party: [], storage: [], flags: ['q_prologue_started'], badges: [], inventory: { potion: 2 }, rngState: 17,
  };
}

test('backup export is deterministic, checksummed and upgrades a v1 save', () => {
  const first = exportSave(legacySave(), '2026-10-16T09:00:00Z');
  const second = exportSave(legacySave(), '2026-10-16T09:00:00Z');
  assert.equal(first, second);
  const envelope = JSON.parse(first);
  assert.equal(envelope.format, 'veloria-save-backup');
  assert.equal(envelope.formatVersion, 1);
  assert.match(envelope.checksum, /^fnv1a32-[0-9a-f]{8}$/);
  assert.equal(envelope.save.schemaVersion, 2);
  assert.deepEqual(importSave(first), envelope.save);
});

test('backup import accepts raw schema v1 and detects payload corruption', () => {
  assert.equal(importSave(JSON.stringify(legacySave())).schemaVersion, 2);
  const exported = JSON.parse(exportSave(legacySave(), '2026-10-16T09:00:00Z'));
  exported.save.player.money += 1;
  assert.throws(() => importSave(JSON.stringify(exported)), /checksum/);
});

test('backup roundtrip preserves active major statuses and accepts older saves without status', () => {
  const v1 = legacySave();
  const oldV2 = { ...v1, schemaVersion: 2 as const, saveRevision: 4, player: { ...v1.player, x: 5, y: 6 } };
  const withoutStatus = importSave(JSON.stringify(oldV2));
  assert.equal(withoutStatus.party[0]?.status, undefined);

  const withStatus = {
    ...withoutStatus,
    party: [{
      instanceId: 'status-creature-001', speciesId: 25, level: 5, experience: 10, hp: 12, maxHp: 19,
      moves: [{ id: 'thunder-shock', pp: 7 }], status: { status: 'sleep' as const, turnsRemaining: 2 },
    }],
  };
  const restored = importSave(exportSave(withStatus, '2026-10-16T09:00:00Z'));
  assert.deepEqual(restored.party[0]?.status, { status: 'sleep', turnsRemaining: 2 });
});

test('backup import rejects malformed JSON and unsupported envelope versions', () => {
  assert.throws(() => importSave('{'), /valid JSON/);
  assert.throws(() => importSave(JSON.stringify({ format: 'veloria-save-backup', formatVersion: 2 })), /Unsupported backup format version/);
});
