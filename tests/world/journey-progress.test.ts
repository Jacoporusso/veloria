import assert from 'node:assert/strict';
import test from 'node:test';
import { selectJourneyProgress, formatQuestRewards } from '../../src/game/journey/progress.ts';

test('journey objective follows existing flags without mutating the save', () => {
  const save = { flags: [], party: [], storage: [], badges: [] };
  const first = selectJourneyProgress(save);
  assert.equal(first.completed, 0);
  assert.match(first.objective, /laboratorio/);
  const advanced = selectJourneyProgress({ ...save, flags: ['q_starter_selected', 'q_research_sample_received'] });
  assert.equal(advanced.completed, 2);
  assert.match(advanced.objective, /misuratore di risonanza.*radura del Bosco dei Veli/i);
  const signalFound = selectJourneyProgress({ ...save, flags: ['q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found'] });
  assert.match(signalFound.objective, /torna da Ada nel Bosco dei Veli.*rilevazioni/i);
  assert.deepEqual(save.flags, []);
});

test('collection counts unique species and uses earned badges', () => {
  const progress = selectJourneyProgress({
    flags: ['badge_aurora_awarded'], badges: ['badge_aurora'],
    party: [{ speciesId: 25 }, { speciesId: 25 }], storage: [{ speciesId: 16 }],
  } as Parameters<typeof selectJourneyProgress>[0]);
  assert.equal(progress.speciesCount, 2);
  assert.equal(progress.badgeCount, 1);
  assert.equal(progress.completed, 1);
});

test('reward labels reflect quest money, items and badges without adding rewards', () => {
  const quest = { id: 'quest', completionFlag: 'done', steps: [{ trigger: 'win', setFlag: 'done', requiresFlags: [], addBadge: 'badge_aurora' }], reward: { money: 100, items: { potion: 2 } } };
  assert.deepEqual(formatQuestRewards(quest, { potion: 'Pozione' }), ['+100 monete', 'Pozione ×2', 'Medaglia Aurora']);
  assert.deepEqual(formatQuestRewards({ id: 'empty', completionFlag: 'x', steps: [] }, {}), []);
  assert.equal(quest.reward.money, 100);
});
