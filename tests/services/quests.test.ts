import assert from 'node:assert/strict';
import test from 'node:test';
import { applyQuestEvent, type QuestDefinition } from '../../src/core/quests/apply-quest-event.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';
import seedQuest from '../../content/quests/radicelmo_seed_archive.quest.json' with { type: 'json' };

const quest: QuestDefinition = {
  id: 'veloria/test-badge', completionFlag: 'badge_aurora_awarded',
  steps: [{ trigger: 'battle/trainer_mira/defeated', setFlag: 'badge_aurora_awarded', addBadge: 'badge_aurora', requiresFlags: ['q_brumalta_visited'] }],
  reward: { money: 100, items: { potion: 1 } },
};
const save: GameSave = {
  schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'save', savedAt: '2026-10-17T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/brumalta', spawnPointId: 'from_r02', money: 0, x: 1, y: 1 },
  party: [], storage: [], flags: ['q_brumalta_visited'], badges: [], inventory: {}, rngState: 1,
};

test('quest awards its badge, reward and flag exactly once', () => {
  const first = applyQuestEvent(save, 'battle/trainer_mira/defeated', [quest]);
  assert.equal(first.progressed, true);
  assert.deepEqual(first.completedQuestIds, ['veloria/test-badge']);
  assert.deepEqual(first.save.badges, ['badge_aurora']);
  assert.deepEqual(first.save.flags, ['q_brumalta_visited', 'badge_aurora_awarded']);
  assert.equal(first.save.player.money, 100);
  assert.equal(first.save.inventory.potion, 1);
  const second = applyQuestEvent(first.save, 'battle/trainer_mira/defeated', [quest]);
  assert.equal(second.progressed, false);
  assert.equal(second.save.player.money, 100);
  assert.equal(second.save.inventory.potion, 1);
  assert.deepEqual(second.save.badges, ['badge_aurora']);
});

test('quest does not advance before prerequisites are met', () => {
  const result = applyQuestEvent({ ...save, flags: [] }, 'battle/trainer_mira/defeated', [quest]);
  assert.equal(result.progressed, false);
  assert.deepEqual(result.save.badges, []);
});

test('Radicelmo pickup grants its real item, delivery consumes it and rewards only once after reload', () => {
  const initial = { ...save, flags: ['badge_aurora_awarded'], inventory: { potion: 1 } };
  const snapshot = structuredClone(initial);
  const pickup = applyQuestEvent(initial, 'pickup/r03/ancient_seed', [seedQuest]);
  assert.equal(pickup.save.inventory['ancient-seed'], 1);
  assert.equal(pickup.save.inventory.potion, 1);
  assert.equal(pickup.save.player.money, 0);
  assert.deepEqual(pickup.completedQuestIds, []);
  const duplicatePickup = applyQuestEvent(pickup.save, 'pickup/r03/ancient_seed', [seedQuest]);
  assert.equal(duplicatePickup.progressed, false);
  assert.equal(duplicatePickup.save.inventory['ancient-seed'], 1);
  const delivered = applyQuestEvent(structuredClone(pickup.save), 'interaction/radicelmo/archive-report', [seedQuest]);
  assert.equal(delivered.save.inventory['ancient-seed'], undefined);
  assert.equal(delivered.save.inventory['archive-note'], 1);
  assert.equal(delivered.save.inventory.potion, 3);
  assert.equal(delivered.save.player.money, 120);
  assert.deepEqual(delivered.completedQuestIds, [seedQuest.id]);
  assert.deepEqual(applyQuestEvent(structuredClone(delivered.save), 'interaction/radicelmo/archive-report', [seedQuest]).save, delivered.save);
  assert.deepEqual(initial, snapshot);
});

test('delivery missing one of several required items changes neither progress nor inventory', () => {
  const delivery: QuestDefinition = { id: 'delivery', completionFlag: 'delivered', steps: [{
    trigger: 'deliver', setFlag: 'delivered', requiresFlags: [], consumeItems: { potion: 2, antidote: 1 }, grantItems: { 'archive-note': 1 },
  }], reward: { money: 100 } };
  const initial = { ...save, inventory: { potion: 2 } };
  const missing = applyQuestEvent(initial, 'deliver', [delivery]);
  assert.equal(missing.progressed, false);
  assert.equal(missing.save, initial);
  assert.deepEqual(missing.completedQuestIds, []);
  const ready = { ...initial, inventory: { potion: 3, antidote: 1 } };
  const completed = applyQuestEvent(ready, 'deliver', [delivery]);
  assert.deepEqual(completed.save.inventory, { potion: 1, 'archive-note': 1 });
  assert.equal(completed.save.player.money, 100);
  assert.deepEqual(ready.inventory, { potion: 3, antidote: 1 });
});

test('Radicelmo cannot archive a seed that is not in the bag, even if the pickup flag is set', () => {
  const initial = { ...save, flags: ['badge_aurora_awarded', 'q_radicelmo_seed_found'] };
  const result = applyQuestEvent(initial, 'interaction/radicelmo/archive-report', [seedQuest]);
  assert.equal(result.progressed, false);
  assert.equal(result.save, initial);
  assert.equal(result.save.player.money, 0);
});

test('gym resonance seals require the three garden passages in order before the Mira gate opens', () => {
  const puzzle: QuestDefinition = {
    id: 'veloria/q_gym01_resonance', completionFlag: 'gym01_puzzle_solved',
    steps: [
      { trigger: 'gym01/resonance/south', setFlag: 'gym01_resonance_south', requiresFlags: ['q_brumalta_visited'] },
      { trigger: 'gym01/resonance/middle', setFlag: 'gym01_resonance_middle', requiresFlags: ['gym01_resonance_south'] },
      { trigger: 'gym01/resonance/north', setFlag: 'gym01_puzzle_solved', requiresFlags: ['gym01_resonance_middle'] },
    ],
  };
  const initial = { ...save, flags: [...save.flags] };
  const wrongOrder = applyQuestEvent(initial, 'gym01/resonance/north', [puzzle]);
  assert.equal(wrongOrder.progressed, false);
  const south = applyQuestEvent(initial, 'gym01/resonance/south', [puzzle]);
  const middle = applyQuestEvent(south.save, 'gym01/resonance/middle', [puzzle]);
  const north = applyQuestEvent(middle.save, 'gym01/resonance/north', [puzzle]);
  assert.equal(south.progressed && middle.progressed && north.progressed, true);
  assert.ok(north.save.flags.includes('gym01_puzzle_solved'));
  assert.equal(applyQuestEvent(north.save, 'gym01/resonance/north', [puzzle]).progressed, false);
});
