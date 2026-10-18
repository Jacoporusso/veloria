import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { applyQuestEvent, type QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const readQuest = (name: string) => JSON.parse(readFileSync(`content/quests/${name}.quest.json`, 'utf8')) as QuestDefinition;
const arrival = readQuest('vetracielo_arrival');
const orientation = readQuest('vetracielo_orientation');
const seed: GameSave = {
  schemaVersion: 2,
  saveRevision: 1,
  contentVersion: 'test',
  saveId: 'vetracielo-orientation-test',
  savedAt: '2026-10-18T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/vetracielo', spawnPointId: 'from_r05', money: 0, x: 1, y: 1 },
  party: [],
  storage: [],
  flags: [],
  badges: [],
  inventory: {},
  rngState: 1,
};

test('Vetracielo arrival waits for Corolla and orientation waits for arrival', () => {
  assert.equal(arrival.completionFlag, 'q_vetracielo_visited');
  assert.equal(orientation.completionFlag, 'q_vetracielo_orientation');
  assert.ok(arrival.steps.some(step => step.trigger === 'area/veloria/vetracielo/enter' && step.requiresFlags?.includes('badge_corolla_awarded')));
  assert.ok(orientation.steps.some(step => step.trigger === 'vetracielo/lea/orientation' && step.requiresFlags?.includes('q_vetracielo_visited')));

  const beforeGate = applyQuestEvent(structuredClone(seed), 'area/veloria/vetracielo/enter', [arrival]);
  assert.equal(beforeGate.progressed, false);
  assert.deepEqual(beforeGate.save.flags, []);

  const eligible = { ...structuredClone(seed), flags: ['badge_corolla_awarded'], badges: ['badge_corolla'] };
  const arrived = applyQuestEvent(eligible, 'area/veloria/vetracielo/enter', [arrival]);
  assert.equal(arrived.progressed, true);
  assert.ok(arrived.save.flags.includes('q_vetracielo_visited'));
  assert.deepEqual(eligible.flags, ['badge_corolla_awarded'], 'arrival does not mutate the saved input');

  const orientationBeforeArrival = applyQuestEvent(structuredClone(seed), 'vetracielo/lea/orientation', [orientation]);
  assert.equal(orientationBeforeArrival.progressed, false);
});

test('Lea orientation grants two Potions once and remains complete after reloading a cloned save', () => {
  const initial: GameSave = {
    ...structuredClone(seed),
    flags: ['badge_corolla_awarded', 'q_vetracielo_visited'],
    badges: ['badge_corolla'],
    inventory: { potion: 1 },
  };
  const originalSnapshot = structuredClone(initial);
  const first = applyQuestEvent(initial, 'vetracielo/lea/orientation', [orientation]);
  assert.equal(first.progressed, true);
  assert.deepEqual(first.completedQuestIds, [orientation.id]);
  assert.ok(first.save.flags.includes('q_vetracielo_orientation'));
  assert.equal(first.save.inventory.potion, 3);
  assert.deepEqual(initial, originalSnapshot, 'quest application leaves its input save unchanged');

  const reloaded = structuredClone(first.save);
  const repeated = applyQuestEvent(reloaded, 'vetracielo/lea/orientation', [orientation]);
  assert.equal(repeated.progressed, false);
  assert.deepEqual(repeated.save, first.save);
});
