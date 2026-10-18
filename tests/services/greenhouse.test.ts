import assert from 'node:assert/strict';
import test from 'node:test';
import { applyQuestEvent, type QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';
import greenhouseQuest from '../../content/quests/radicelmo_greenhouse.quest.json' with { type: 'json' };
import worldDialogue from '../../content/dialogue/world.v1.json' with { type: 'json' };

const quest = greenhouseQuest as QuestDefinition;
const save: GameSave = {
  schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'greenhouse', savedAt: '2026-10-17T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/radicelmo', spawnPointId: 'default', money: 25, x: 1, y: 1 },
  party: [], storage: [], flags: [], badges: [], inventory: { potion: 1 }, rngState: 1,
};

const events = {
  begin: 'interaction/radicelmo/greenhouse/begin',
  water: 'interaction/radicelmo/greenhouse/water',
  light: 'interaction/radicelmo/greenhouse/light',
  observe: 'interaction/radicelmo/greenhouse/observe',
  report: 'interaction/radicelmo/greenhouse/report',
} as const;

test('greenhouse quest requires the seed archive before starting', () => {
  const result = applyQuestEvent(save, events.begin, [quest]);
  assert.equal(result.progressed, false);
  assert.equal(result.save, save);
  assert.deepEqual(result.completedQuestIds, []);
});

test('greenhouse requires water, light, observation, then report; reward arrives only at report', () => {
  let current: GameSave = { ...save, flags: ['q_radicelmo_seed_archived'] };
  for (const premature of [events.water, events.light, events.observe, events.report]) {
    const result = applyQuestEvent(current, premature, [quest]);
    assert.equal(result.progressed, false, `${premature} must wait for its prerequisites`);
    assert.equal(result.save, current);
    assert.deepEqual(result.completedQuestIds, []);
  }

  const begin = applyQuestEvent(current, events.begin, [quest]);
  assert.equal(begin.progressed, true);
  assert.equal(begin.save.player.money, 25);
  assert.deepEqual(begin.save.inventory, { potion: 1 });
  current = begin.save;
  for (const [trigger, expectedFlag] of [
    [events.water, 'q_radicelmo_greenhouse_watered'],
    [events.light, 'q_radicelmo_greenhouse_lit'],
    [events.observe, 'q_radicelmo_seed_sprouted'],
  ] as const) {
    const result = applyQuestEvent(current, trigger, [quest]);
    assert.equal(result.progressed, true);
    assert.ok(result.save.flags.includes(expectedFlag));
    assert.deepEqual(result.completedQuestIds, []);
    assert.equal(result.save.player.money, 25);
    assert.deepEqual(result.save.inventory, { potion: 1 });
    current = result.save;
  }

  const report = applyQuestEvent(current, events.report, [quest]);
  assert.equal(report.progressed, true);
  assert.deepEqual(report.completedQuestIds, [quest.id]);
  assert.ok(report.save.flags.includes('q_radicelmo_greenhouse_complete'));
  assert.equal(report.save.player.money, 205);
  assert.deepEqual(report.save.inventory, { potion: 3, antidote: 1 });
});

test('greenhouse report reward is not duplicated after clone and reload', () => {
  let current: GameSave = { ...save, flags: ['q_radicelmo_seed_archived'] };
  for (const trigger of Object.values(events)) current = applyQuestEvent(current, trigger, [quest]).save;
  const reloaded = structuredClone(current);
  const duplicate = applyQuestEvent(reloaded, events.report, [quest]);
  assert.equal(duplicate.progressed, false);
  assert.deepEqual(duplicate.save, reloaded);
  assert.deepEqual(duplicate.completedQuestIds, []);
  assert.equal(duplicate.save.player.money, 205);
  assert.deepEqual(duplicate.save.inventory, { potion: 3, antidote: 1 });
});

test('greenhouse quest events do not mutate their input save', () => {
  const initial: GameSave = { ...save, flags: ['q_radicelmo_seed_archived'], inventory: { ...save.inventory } };
  const snapshot = structuredClone(initial);
  applyQuestEvent(initial, events.begin, [quest]);
  assert.deepEqual(initial, snapshot);
});

test('greenhouse dialogue reserves reward claims for the report stage', () => {
  const keeper = (worldDialogue as Record<string, any>).radicelmo_keeper;
  const water = (worldDialogue as Record<string, any>).radicelmo_water;
  const light = (worldDialogue as Record<string, any>).radicelmo_light;
  const seed = (worldDialogue as Record<string, any>).radicelmo_seed;
  const greenhouseStages = [
    ...keeper.stages.filter((stage: any) => stage.questEvent?.includes('/greenhouse/')),
    ...water.stages.filter((stage: any) => stage.questEvent?.includes('/greenhouse/')),
    ...light.stages.filter((stage: any) => stage.questEvent?.includes('/greenhouse/')),
    ...seed.stages.filter((stage: any) => stage.questEvent?.includes('/greenhouse/')),
  ];
  const reportStage = greenhouseStages.find((stage: any) => stage.questEvent === events.report);
  assert.ok(reportStage, 'the report interaction must have a dialogue stage');
  const rewardClaim = /ricevi|riceverai|ricompensa|monete|pozion|antidoto/i;
  for (const stage of greenhouseStages.filter((stage: any) => stage.questEvent !== events.report)) {
    assert.equal(stage.lines.some((line: string) => rewardClaim.test(line)), false, `${stage.questEvent} must not promise a reward`);
  }
  assert.ok(reportStage.lines.some((line: string) => rewardClaim.test(line)));
});
