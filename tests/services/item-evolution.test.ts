import assert from 'node:assert/strict';
import test from 'node:test';
import itemEvolutionData from '../../content/battle/item-evolutions.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import { calculateStats, type SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';
import {
  applyItemEvolution, evolutionReceiptFlag, pendingEvolutionReceipts, queueEvolutionReceipts,
  type ItemEvolutionRule,
} from '../../src/core/services/item-evolution.ts';
import type { CreatureSave, GameSave } from '../../src/persistence/save-types.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const rules = itemEvolutionData.rules as ItemEvolutionRule[];
const baseSave: GameSave = {
  schemaVersion: 2, saveRevision: 4, contentVersion: 'test', saveId: 'save', savedAt: '2026-10-20T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/brumalta', spawnPointId: 'from_r02', money: 300, x: 1, y: 1 },
  party: [], storage: [], flags: ['existing-flag'], badges: [], inventory: { 'thunder-stone': 2 }, rngState: 17,
};

function pikachu(overrides: Partial<CreatureSave> = {}): CreatureSave {
  const maxHp = calculateStats(species['25'].baseStats, 20).maxHp;
  return {
    instanceId: 'pikachu-01', speciesId: 25, level: 20, experience: 3180, hp: maxHp - 7, maxHp,
    moves: [{ id: 'thunder-shock', pp: 7 }, { id: 'quick-attack', pp: 13 }],
    status: { status: 'sleep', turnsRemaining: 2 }, ...overrides,
  };
}

function saveWith(creature: CreatureSave, overrides: Partial<GameSave> = {}): GameSave {
  return { ...baseSave, party: [creature], ...overrides };
}

test('stone use commits inventory, transformed creature, and durable receipt together', () => {
  const current = pikachu();
  const reserve: CreatureSave = { ...current, instanceId: 'reserve', speciesId: 133, hp: 3 };
  const original = saveWith(current, { party: [current, reserve], storage: [{ instanceId: 'box-1', speciesId: 1, nickname: 'Bulba' }] });
  const before = structuredClone(original);

  const result = applyItemEvolution(original, 'thunder-stone', current.instanceId, rules, species);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.save.inventory['thunder-stone'], 1);
  assert.equal(result.save.party[0].speciesId, 26);
  assert.equal(result.save.party[1], reserve);
  assert.deepEqual(result.save.storage, original.storage);
  assert.equal(result.creature.speciesId, 26);
  assert.equal(result.creature.experience, current.experience);
  assert.equal(result.creature.level, current.level);
  assert.deepEqual(result.creature.moves, current.moves);
  assert.deepEqual(result.creature.status, current.status);
  assert.equal(result.creature.hp, Math.min(result.creature.maxHp, current.hp + result.creature.maxHp - current.maxHp));
  assert.equal(result.receipt.creatureId, current.instanceId);
  assert.deepEqual(pendingEvolutionReceipts(result.save), [result.receipt]);
  assert.ok(result.save.flags.includes('pokedex_seen_26'));
  assert.deepEqual(original, before);
});

test('fainted creatures remain fainted through a stone evolution', () => {
  const result = applyItemEvolution(saveWith(pikachu({ hp: 0 })), 'thunder-stone', 'pikachu-01', rules, species);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.creature.hp, 0);
});

test('cancelled selection performs no item evolution call', () => {
  const selectedCreatureId: string | null = null;
  const apply = (selection: string | null) => selection === null
    ? undefined
    : applyItemEvolution(saveWith(pikachu()), 'thunder-stone', selection, rules, species);

  assert.equal(apply(selectedCreatureId), undefined);
  assert.equal(baseSave.inventory['thunder-stone'], 2);
  assert.deepEqual(baseSave.party, []);
});

test('rejects missing item, absent party member, incompatible stone, and missing target without changing save', () => {
  const current = pikachu();
  const save = saveWith(current);
  const missingSave = { ...save, inventory: {} };
  const missingItem = applyItemEvolution(missingSave, 'thunder-stone', current.instanceId, rules, species);
  assert.equal(missingItem.ok, false);
  if (!missingItem.ok) { assert.equal(missingItem.reason, 'missingItem'); assert.equal(missingItem.save, missingSave); }

  const absent = applyItemEvolution(save, 'thunder-stone', 'not-in-party', rules, species);
  assert.equal(absent.ok, false);
  if (!absent.ok) assert.equal(absent.reason, 'notInParty');

  const incompatibleSave = saveWith(current, { inventory: { 'fire-stone': 1 } });
  const incompatible = applyItemEvolution(incompatibleSave, 'fire-stone', 'pikachu-01', rules, species);
  assert.equal(incompatible.ok, false);
  if (!incompatible.ok) { assert.equal(incompatible.reason, 'incompatible'); assert.equal(incompatible.save, incompatibleSave); }

  const unavailable = applyItemEvolution(save, 'thunder-stone', current.instanceId, rules, { ...species, '26': undefined } as unknown as SpeciesBattleRegistry);
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) { assert.equal(unavailable.reason, 'unavailable'); assert.equal(unavailable.save, save); }
  assert.equal(save.inventory['thunder-stone'], 2);
  assert.equal(save.party[0].speciesId, 25);
});

test('receipt flags parse after JSON reload, ignore malformed entries, and deduplicate', () => {
  const receipt = { creatureId: 'party/a%1', fromSpeciesId: 25, toSpeciesId: 26, level: 20 };
  const queued = queueEvolutionReceipts(baseSave, [receipt, receipt]);
  const reloaded = JSON.parse(JSON.stringify(queued)) as GameSave;
  assert.equal(reloaded.flags.filter(flag => flag === evolutionReceiptFlag(receipt)).length, 1);
  assert.equal(reloaded.flags.filter(flag => flag === 'pokedex_seen_26').length, 1);
  assert.deepEqual(pendingEvolutionReceipts(reloaded), [receipt]);

  const malformed: GameSave = { ...reloaded, flags: [...reloaded.flags, 'presentation/evolution/%E0%A4%A/25/26/20',
    'presentation/evolution/id/25/not-a-species/20', 'presentation/evolution/id/25/26'] };
  assert.deepEqual(pendingEvolutionReceipts(malformed), [receipt]);
});
