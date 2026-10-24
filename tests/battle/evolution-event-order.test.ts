import assert from 'node:assert/strict';
import test from 'node:test';
import { evolutionPresentationEvents } from '../../src/game/battle/evolution-event-order.ts';
import type { BattleEvent } from '../../src/core/battle/types.ts';

const level: BattleEvent = { type: 'levelUp', side: 'player', creatureId: 'hero', previousLevel: 15, level: 16 };
const evolution: BattleEvent = { type: 'creatureEvolved', side: 'player', creatureId: 'hero', fromSpeciesId: 4, toSpeciesId: 5, fromName: 'Charmander', toName: 'Charmeleon', level: 16 };
const skipped: BattleEvent = { type: 'moveLearningSkipped', side: 'player', creatureId: 'hero', moveId: 'dragon-rage', reason: 'fullMoveSlots' };
const learned: BattleEvent = { type: 'moveLearned', side: 'player', creatureId: 'hero', moveId: 'ember' };

test('learning from before and after evolution follows the revealed form without changing mechanical events', () => {
  const events = [level, skipped, evolution, learned];
  const before = structuredClone(events);
  assert.deepEqual(evolutionPresentationEvents(events), [level, evolution, skipped, learned]);
  assert.deepEqual(events, before);
  assert.equal(evolutionPresentationEvents(events)[1], evolution);
});

test('learning waits until the last transformation in a chain', () => {
  const final: BattleEvent = { ...evolution, fromSpeciesId: 5, toSpeciesId: 6, fromName: 'Charmeleon', toName: 'Charizard', level: 36 };
  assert.deepEqual(evolutionPresentationEvents([level, evolution, skipped, final, learned]), [level, evolution, final, skipped, learned]);
});

test('unrelated creatures keep their learning order and every event appears exactly once', () => {
  const other: BattleEvent = { ...learned, creatureId: 'reserve' };
  const events = [level, skipped, other, evolution, learned];
  const result = evolutionPresentationEvents(events);
  assert.deepEqual(result, [level, other, evolution, skipped, learned]);
  assert.equal(new Set(result).size, events.length);
});

test('ordinary learning without evolution keeps its original sequence', () => {
  const events = [level, skipped, learned];
  assert.equal(evolutionPresentationEvents(events), events);
});
