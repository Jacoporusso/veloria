import assert from 'node:assert/strict';
import test from 'node:test';
import sensor from '../../content/quests/r07_measurement.quest.json' with { type: 'json' };
import investigation from '../../content/quests/centrale_investigation.quest.json' with { type: 'json' };
import { applyQuestEvent } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const initial: GameSave = {
  schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'centrale', savedAt: '2026-10-19T00:00:00Z',
  player: { name: 'Ada', mapId: 'veloria/ferraluce', spawnPointId: 'from_r07', money: 500, x: 38, y: 25 },
  party: [], storage: [], flags: ['badge_acciaio_awarded'], badges: ['badge_acciaio'], inventory: { potion: 1 }, rngState: 42,
};
const quests = [sensor, investigation];
const sequence = ['r07/sensor/read', 'centrale/log/read', 'centrale/regulator/isolate', 'centrale/output/read', 'ferraluce/ivo/centrale_report'];

test('Centrale rejects premature actions at every checkpoint and resumes after serialization', () => {
  let save = structuredClone(initial);
  for (let index = 0; index < sequence.length; index += 1) {
    for (const premature of sequence.slice(index + 1)) {
      const blocked = applyQuestEvent(save, premature, quests);
      assert.equal(blocked.progressed, false, premature);
      assert.deepEqual(blocked.save, save);
    }
    const result = applyQuestEvent(save, sequence[index], quests);
    assert.equal(result.progressed, true);
    save = JSON.parse(JSON.stringify(result.save));
    assert.equal(save.player.money, index === sequence.length - 1 ? 800 : 500);
    assert.equal(save.inventory.potion, index === sequence.length - 1 ? 3 : 1);
  }
  assert.ok(save.flags.includes('q_centrale_report'));
  assert.deepEqual(save.badges, initial.badges);
  assert.equal(save.rngState, initial.rngState);
  for (const event of sequence) assert.deepEqual(applyQuestEvent(save, event, quests).save, save);
  assert.deepEqual(initial.flags, ['badge_acciaio_awarded']);
});

test('the Condotto reading cannot start the investigation before the fourth badge', () => {
  const locked = { ...initial, flags: [], badges: [] };
  for (const event of sequence) {
    const result = applyQuestEvent(locked, event, quests);
    assert.equal(result.progressed, false);
    assert.deepEqual(result.save, locked);
  }
});
