import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { applyQuestEvent, type QuestDefinition } from '../helpers/quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const readQuest = (name: string) => JSON.parse(readFileSync(`content/quests/${name}.quest.json`, 'utf8')) as QuestDefinition;
const measurement = readQuest('r06_measurement');
const arrival = readQuest('ferraluce_arrival');
const report = readQuest('ferraluce_report');
const quests = [measurement, arrival, report];
const seed: GameSave = {
  schemaVersion: 2,
  saveRevision: 1,
  contentVersion: 'test',
  saveId: 'ferraluce-research-test',
  savedAt: '2026-10-18T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/ferraluce', spawnPointId: 'from_r06', money: 0, x: 1, y: 15 },
  party: [],
  storage: [],
  flags: [],
  badges: [],
  inventory: {},
  rngState: 1,
};

test('the measurement waits for Circuito, and Ivo waits for both measurement and arrival', () => {
  assert.equal(measurement.id, 'veloria/q_r06_measurement');
  assert.equal(arrival.id, 'veloria/q_ferraluce_arrival');
  assert.equal(report.id, 'veloria/q_ferraluce_report');
  assert.ok(measurement.steps.some(step => step.trigger === 'r06/sensor/read' && step.setFlag === 'q_r06_measurement' && step.requiresFlags?.includes('badge_circuito_awarded')));
  assert.ok(arrival.steps.some(step => step.trigger === 'area/veloria/ferraluce/enter' && step.setFlag === 'q_ferraluce_visited' && step.requiresFlags?.includes('badge_circuito_awarded')));
  assert.ok(report.steps.some(step => step.trigger === 'ferraluce/ivo/report' && step.setFlag === 'q_ferraluce_report' && step.requiresFlags?.includes('q_ferraluce_visited') && step.requiresFlags?.includes('q_r06_measurement')));

  const noBadge = applyQuestEvent(structuredClone(seed), 'r06/sensor/read', quests);
  assert.equal(noBadge.progressed, false);
  assert.deepEqual(noBadge.save.flags, []);
  const arrivalBeforeGate = applyQuestEvent(structuredClone(seed), 'area/veloria/ferraluce/enter', quests);
  assert.equal(arrivalBeforeGate.progressed, false);
  assert.deepEqual(arrivalBeforeGate.save.flags, []);
  const noPrerequisites = applyQuestEvent(structuredClone(seed), 'ferraluce/ivo/report', quests);
  assert.equal(noPrerequisites.progressed, false);
  assert.deepEqual(noPrerequisites.save.flags, []);

  const withBadge: GameSave = { ...structuredClone(seed), flags: ['badge_circuito_awarded'], badges: ['badge_circuito'] };
  const measured = applyQuestEvent(withBadge, 'r06/sensor/read', quests);
  assert.equal(measured.progressed, true);
  assert.ok(measured.save.flags.includes('q_r06_measurement'));
  assert.deepEqual(measured.save.flags, ['badge_circuito_awarded', 'q_r06_measurement']);

  const reportBeforeArrival = applyQuestEvent(structuredClone(measured.save), 'ferraluce/ivo/report', quests);
  assert.equal(reportBeforeArrival.progressed, false);
  assert.deepEqual(reportBeforeArrival.save.flags, measured.save.flags);
});

test('measurement, arrival, and report complete once and grant two Potions plus one Antidote', () => {
  const withBadge: GameSave = { ...structuredClone(seed), flags: ['badge_circuito_awarded'], badges: ['badge_circuito'], inventory: { potion: 1 } };
  const original = structuredClone(withBadge);
  const measured = applyQuestEvent(withBadge, 'r06/sensor/read', quests);
  assert.equal(measured.progressed, true);
  assert.deepEqual(measured.completedQuestIds, [measurement.id]);

  const arrived = applyQuestEvent(measured.save, 'area/veloria/ferraluce/enter', quests);
  assert.equal(arrived.progressed, true);
  assert.ok(arrived.save.flags.includes('q_ferraluce_visited'));
  assert.deepEqual(arrived.completedQuestIds, [arrival.id]);

  const reported = applyQuestEvent(arrived.save, 'ferraluce/ivo/report', quests);
  assert.equal(reported.progressed, true);
  assert.deepEqual(reported.completedQuestIds, [report.id]);
  assert.ok(reported.save.flags.includes('q_ferraluce_report'));
  assert.deepEqual(reported.save.inventory, { potion: 3, antidote: 1 });
  assert.deepEqual(withBadge, original, 'quest application leaves the input save unchanged');

  for (const [trigger, save] of [
    ['r06/sensor/read', reported.save],
    ['area/veloria/ferraluce/enter', reported.save],
    ['ferraluce/ivo/report', reported.save],
  ] as const) {
    const repeated = applyQuestEvent(structuredClone(save), trigger, quests);
    assert.equal(repeated.progressed, false, `${trigger} cannot award its quest twice`);
    assert.deepEqual(repeated.save, save);
  }
});
