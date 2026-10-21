import assert from 'node:assert/strict';
import test from 'node:test';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import { BATTLE_TYPES, type BattleCreature, type MoveDefinition } from '../../src/core/battle/types.ts';
import { createMoveCard, MOVE_TYPE_ICONS } from '../../src/game/battle/move-card.ts';

const move: MoveDefinition = { id: 'flame', name: 'Lanciafiamme', type: 'fire', category: 'special', power: 90, accuracy: 100, maxPp: 15, priority: 0 };
const target: BattleCreature = { instanceId: 'target', speciesId: 1, name: 'Target', types: ['grass', 'steel'], level: 10, hp: 30, stats: { maxHp: 30, attack: 20, defense: 20, specialAttack: 20, specialDefense: 20, speed: 20 }, experience: 0, experienceYield: 0, moves: [] };
const rules = { ...prototypeBattleRules, typeChart: { fire: { grass: 2, steel: 2 }, electric: { ground: 0 }, normal: { ghost: 0 }, water: { fire: 2, grass: 0.5 } } };

test('a card retains authored name and actual current accuracy/PP, without a damage estimate', () => {
  const card = createMoveCard(move, target, rules, 3, '75% ORA');
  assert.equal(card.name, 'Lanciafiamme');
  assert.equal(card.typeIcon, '🔥'); assert.equal(card.categoryLabel, 'Speciale');
  assert.equal(card.powerLabel, '90'); assert.equal(card.accuracyLabel, '75% ORA'); assert.equal(card.ppLabel, '3/15 PP');
  assert.equal(card.effectiveness, 'super'); assert.equal(card.effectivenessShort, '↑ ×4');
  assert.match(card.accessibleLabel, /Super efficace ×4/);
  assert.ok(!Object.keys(card).some(key => /forecast|estimate|damage/i.test(key)));
  assert.equal(card.supportEffect, undefined);
  assert.equal(move.name, 'Lanciafiamme');
});

test('support effects preserve targets, stages and probabilities rather than claiming super-effective damage', () => {
  const card = createMoveCard({ ...move, category: 'status', power: 0, statChanges: [{ target: 'opponent', stat: 'attack', stages: -1 }, { target: 'self', stat: 'defense', stages: 2 }], statChangeChance: 50 }, target, rules, 0);
  assert.equal(card.effectiveness, 'support'); assert.equal(card.powerLabel, '—'); assert.equal(card.ppLabel, '0/15 PP');
  assert.match(card.supportEffect!, /Attacco avversario -1 · 50%/);
  assert.match(card.supportEffect!, /Difesa tuo \+2 · 50%/);
  assert.ok(!card.effectivenessShort.includes('×4'));
});

test('attack type immunity and status-specific immunity remain distinct from support', () => {
  const electric = { ...move, type: 'electric' as const, category: 'status' as const, power: 0, inflictedStatus: 'paralysis' as const, statusAffectedByTypeImmunity: true };
  const ground = createMoveCard(electric, { ...target, types: ['ground'] }, rules, 10);
  assert.equal(ground.effectiveness, 'immune');
  assert.equal(ground.supportEffect, undefined);
  assert.match(ground.effectivenessLabel, /IMMUNITÀ DI TIPO/);
  assert.match(ground.accessibleLabel, /Nessun effetto.*IMMUNITÀ DI TIPO/);
  assert.doesNotMatch(ground.accessibleLabel, /Paralisi avversario/);
  const poison = { ...electric, type: 'poison' as const, inflictedStatus: 'poison' as const, statusAffectedByTypeImmunity: false };
  const card = createMoveCard(poison, { ...target, types: ['steel'] }, rules, 10);
  assert.equal(card.effectivenessShort, 'Ø'); assert.match(card.effectivenessLabel, /Stato impedito.*IMMUNITÀ DI TIPO/);
  assert.equal(card.supportEffect, undefined);
  assert.doesNotMatch(card.accessibleLabel, /Veleno avversario/);
  const occupied = createMoveCard({ ...electric, statusAffectedByTypeImmunity: false }, { ...target, types: ['water'], status: { status: 'burn' } }, rules, 10);
  assert.equal(occupied.supportEffect, undefined);
  assert.match(occupied.effectivenessLabel, /Stato già presente/);
  assert.doesNotMatch(occupied.effectivenessLabel, /IMMUNITÀ DI TIPO/);
  assert.doesNotMatch(occupied.accessibleLabel, /Paralisi avversario/);
  assert.equal(createMoveCard({ ...electric, type: 'grass', inflictedStatus: undefined, leechSeedFraction: 1 / 8 }, { ...target, types: ['grass'] }, rules, 4).effectiveness, 'immune');
});

test('fixed damage is not multiplied by weaknesses, but immunities still block it', () => {
  const fixed = { ...move, fixedDamage: 40, power: 0 };
  const card = createMoveCard(fixed, target, rules, 10);
  assert.equal(card.powerLabel, '40 HP fissi'); assert.equal(card.effectiveness, 'fixed'); assert.equal(card.effectivenessShort, '40 HP');
  assert.equal(createMoveCard({ ...fixed, type: 'normal' }, { ...target, types: ['ghost'] }, rules, 10).effectiveness, 'immune');
});

test('all supported types have icons; the eighteenth icon does not add a Fairy combat type', () => {
  assert.ok(BATTLE_TYPES.every(type => MOVE_TYPE_ICONS[type].length > 0));
  assert.equal(Object.keys(MOVE_TYPE_ICONS).length, 18);
  assert.ok(!BATTLE_TYPES.includes('fairy' as never));
  assert.equal(createMoveCard({ ...move, alwaysHits: true }, target, rules, 10).accuracyLabel, 'Non fallisce per precisione');
});
