import assert from 'node:assert/strict';
import test from 'node:test';
import quest from '../../content/drafts/portolume/portolume_research.quest.json' with { type: 'json' };
import network from '../../content/drafts/portolume/portolume_harbor.ferry.json' with { type: 'json' };
import map from '../../content/drafts/portolume/portolume.map.json' with { type: 'json' };
import { applyQuestEvent } from '../../src/core/quests/apply-quest-event.ts';
import { localFerryDestinations, planLocalFerryTrip } from '../../src/core/world/local-ferry.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const initial: GameSave = {
  schemaVersion: 2, saveRevision: 1, contentVersion: 'test', saveId: 'portolume', savedAt: '2026-10-19T00:00:00Z',
  player: { name: 'Ada', mapId: map.id, spawnPointId: 'from_r08', money: 500, x: 1, y: 17 },
  party: [], storage: [], flags: ['q_centrale_report'], badges: [], inventory: {}, rngState: 42,
};

test('coastal research grants the rod once, preserves progress and rejects premature steps', () => {
  let save = structuredClone(initial);
  for (let index = 0; index < quest.steps.length; index++) {
    for (const later of quest.steps.slice(index + 1)) {
      assert.equal(applyQuestEvent(save, later.trigger, [quest]).progressed, false);
    }
    const result = applyQuestEvent(save, quest.steps[index].trigger, [quest]);
    assert.equal(result.progressed, true);
    save = JSON.parse(JSON.stringify(result.save));
    assert.equal(save.inventory['old-rod'] ?? 0, index >= 1 ? 1 : 0);
  }
  assert.equal(save.inventory.potion, 2);
  assert.equal(save.player.money, initial.player.money);
  assert.equal(save.rngState, initial.rngState);
  for (const step of quest.steps) assert.deepEqual(applyQuestEvent(save, step.trigger, [quest]).save, save);
});

test('the authored boat route opens after orientation and always permits the return trip', () => {
  assert.deepEqual(localFerryDestinations(network, initial, 'mainland'), []);
  const save = { ...initial, flags: [...initial.flags, 'q_portolume_orientation'] };
  for (const [from, to] of [['mainland', 'observatory'], ['observatory', 'mainland']]) {
    const trip = planLocalFerryTrip(network, save, from, to);
    assert.equal(trip.ok, true);
    if (trip.ok) assert.ok(map.spawns.some(spawn => spawn.id === trip.destination.spawnPointId));
  }
});
