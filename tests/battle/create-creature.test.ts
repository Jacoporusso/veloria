import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import movesData from '../../content/battle/moves.v1.json' with { type: 'json' };
import encounterData from '../../content/encounters/r01_tall_grass.encounter.json' with { type: 'json' };
import { createBattleCreature, createBattleCreatureFromSave } from '../../src/core/battle/create-creature.ts';
import { createBattleState } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { SpeciesBattleRegistry, BattleMoveRegistry } from '../../src/core/battle/create-creature.ts';
import type { CreatureSave } from '../../src/persistence/save-types.ts';
import type { MoveDefinition } from '../../src/core/battle/types.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = movesData.moves as BattleMoveRegistry;

test('creates all four level-5 starters with deterministic prototype stats and full PP', () => {
  const starters = [1, 4, 7, 25].map(speciesId => createBattleCreature({ species, moves, speciesId, level: 5, instanceId: `starter-${speciesId}` }));
  assert.deepEqual(starters.map(creature => creature.name), ['Bulbasaur', 'Charmander', 'Squirtle', 'Pikachu']);
  assert.deepEqual(starters.map(creature => creature.stats.maxHp), [19, 18, 19, 18]);
  assert.deepEqual(starters.map(creature => creature.moves.map(slot => slot.moveId)), [
    ['tackle', 'growl'], ['scratch', 'growl'], ['tackle', 'tail-whip'], ['thunder-shock', 'growl', 'tail-whip'],
  ]);
  assert.deepEqual(starters[0].types, ['grass', 'poison']);
});

test('all 34 registered species including urban species and starter evolutions have valid default battle data', () => {
  const entries = Object.values(species);
  assert.equal(entries.length, 34);
  for (const entry of entries) {
    const creature = createBattleCreature({
      species,
      moves,
      speciesId: entry.speciesId,
      level: 5,
      instanceId: `registry-${entry.speciesId}`,
    });
    assert.equal(creature.speciesId, entry.speciesId);
    assert.ok(creature.moves.length > 0);
    assert.ok(creature.stats.maxHp > 0);
  }
});

test('creation uses only canonical moves available at the requested level', () => {
  const pidgey3 = createBattleCreature({ species, moves, speciesId: 16, level: 3, instanceId: 'pidgey-3' });
  const pidgey9 = createBattleCreature({ species, moves, speciesId: 16, level: 9, instanceId: 'pidgey-9' });
  const mareep5 = createBattleCreature({ species, moves, speciesId: 179, level: 5, instanceId: 'mareep-5' });
  assert.deepEqual(pidgey3.moves.map(slot => slot.moveId), ['tackle']);
  assert.deepEqual(pidgey9.moves.map(slot => slot.moveId), ['tackle', 'sand-attack', 'gust']);
  assert.deepEqual(mareep5.moves.map(slot => slot.moveId), ['tackle', 'growl']);
  for (const creature of [pidgey3, pidgey9, mareep5]) {
    const legal = new Set((species[String(creature.speciesId)] as typeof species[string] & {officialLearnset: {level:number;moveId:string}[]}).officialLearnset
      .filter(entry => entry.level <= creature.level).map(entry => entry.moveId));
    assert.ok(creature.moves.every(slot => legal.has(slot.moveId)));
  }
});

test('trainer move IDs create Sentret and Rattata with the move catalog PP', () => {
  const sentret = createBattleCreature({ species, moves, speciesId: 161, level: 8, instanceId: 'mira-sentret', moveIds: ['tackle', 'defense-curl'] });
  const rattata = createBattleCreature({ species, moves, speciesId: 19, level: 10, instanceId: 'mira-rattata', moveIds: ['tackle', 'quick-attack'] });
  assert.deepEqual(sentret.moves, [{ moveId: 'tackle', pp: 35 }, { moveId: 'defense-curl', pp: 40 }]);
  assert.deepEqual(rattata.moves, [{ moveId: 'tackle', pp: 35 }, { moveId: 'quick-attack', pp: 30 }]);
});

test('night encounter species resolve through the battle registry', () => {
  const night = encounterData.timeBands.night;
  assert.deepEqual(night.map(entry => species[String(entry.speciesId)].name), ['Hoothoot', 'Spinarak', 'Rattata']);
  const hoothoot = createBattleCreature({ species, moves, speciesId: 163, level: 3, instanceId: 'wild-hoothoot' });
  const spinarak = createBattleCreature({ species, moves, speciesId: 167, level: 2, instanceId: 'wild-spinarak' });
  for (const creature of [hoothoot, spinarak]) {
    const legal = new Set((species[String(creature.speciesId)] as typeof species[string] & {officialLearnset: {level:number;moveId:string}[]}).officialLearnset
      .filter(entry => entry.level <= creature.level).map(entry => entry.moveId));
    assert.ok(creature.moves.every(slot => legal.has(slot.moveId)));
  }
});

test('rehydrates a save without changing current HP, experience, or PP', () => {
  const save: CreatureSave = {
    instanceId: 'saved-pikachu-01', speciesId: 25, level: 5, experience: 137, hp: 12, maxHp: 19,
    moves: [{ id: 'thunder-shock', pp: 7 }, { id: 'growl', pp: 23 }],
  };
  const before = structuredClone(save);
  const restored = createBattleCreatureFromSave(save, { species, moves });
  assert.equal(restored.hp, 12);
  assert.equal(restored.stats.maxHp, 19);
  assert.equal(restored.experience, 137);
  assert.deepEqual(restored.moves, [{ moveId: 'thunder-shock', pp: 7 }, { moveId: 'growl', pp: 23 }]);
  assert.deepEqual(save, before);
});

test('rehydrates all five persisted major statuses and preserves timed turns', () => {
  const statuses = [
    { status: 'burn' },
    { status: 'poison' },
    { status: 'paralysis' },
    { status: 'sleep', turnsRemaining: 2 },
    { status: 'freeze', turnsRemaining: 3 },
  ] as const;
  for (const [index, status] of statuses.entries()) {
    const save: CreatureSave = {
      instanceId: `saved-status-${index}`, speciesId: 25, level: 5, experience: 0, hp: 12, maxHp: 19,
      moves: [{ id: 'thunder-shock', pp: 7 }], status,
    };
    assert.deepEqual(createBattleCreatureFromSave(save, { species, moves }).status, status);
  }
});

test('battle state creation merges the creature status into a detached state snapshot', () => {
  const creature = createBattleCreatureFromSave({
    instanceId: 'saved-sleeping-01', speciesId: 25, level: 5, experience: 0, hp: 12, maxHp: 19,
    moves: [{ id: 'thunder-shock', pp: 7 }], status: { status: 'sleep', turnsRemaining: 2 },
  }, { species, moves });
  const opponent = createBattleCreature({ species, moves, speciesId: 19, level: 4, instanceId: 'opponent-01' });
  const state = createBattleState({
    battleId: 'status-roundtrip', battleType: 'wild', seed: 1, rules: prototypeBattleRules,
    playerTeam: [creature], opponentTeam: [opponent],
  });

  assert.deepEqual(state.player.creatures[0]?.status, { status: 'sleep', turnsRemaining: 2 });
  assert.notEqual(state.player.creatures[0]?.status, creature.status);
});

test('rejects bad IDs, levels, unknown moves, and invalid save PP', () => {
  const make = (overrides: Partial<Parameters<typeof createBattleCreature>[0]>) => createBattleCreature({ species, moves, speciesId: 25, level: 5, instanceId: 'valid-id', ...overrides });
  assert.throws(() => make({ instanceId: '  ' }), /instanceId/);
  assert.throws(() => make({ level: 101 }), /level/);
  assert.throws(() => make({ speciesId: 999 }), /Unknown or mismatched species/);
  assert.throws(() => make({ moveIds: ['missing-move'] }), /Unknown or mismatched move/);
  assert.throws(() => make({ moveIds: ['tackle', 'tackle'] }), /unique/);
  assert.throws(() => createBattleCreatureFromSave({
    instanceId: 'saved', speciesId: 25, level: 5, experience: 0, hp: 10, maxHp: 19, moves: [{ id: 'growl', pp: -1 }],
  }, { species, moves }), /move PP/);
});

test('versioned move values form a usable, stable catalog without a global chart', () => {
  const catalog = moves as Record<string, MoveDefinition>;
  assert.equal(movesData.version, 10);
  assert.equal(catalog['quick-attack'].priority, 1);
  assert.equal(catalog['thunder-shock'].inflictedStatus, 'paralysis');
  assert.deepEqual(catalog['string-shot'].statChanges, [{ target: 'opponent', stat: 'speed', stages: -1 }]);
  assert.equal(catalog['tackle'].power, 35);
  assert.equal(catalog.scratch.power, 40);
  assert.notEqual(catalog.tackle.power, catalog.scratch.power);
  assert.deepEqual([catalog.ember.inflictedStatus, catalog.ember.statusChance], ['burn', 10]);
  assert.equal(catalog['water-gun'].power, 40);
  assert.equal(catalog['vine-whip'].power, 35);
  assert.notEqual(catalog.ember.power, catalog['vine-whip'].power);
  assert.equal(catalog.tackle.accuracy, 95);
  assert.equal(Object.keys(catalog).length, 45);
  assert.equal('typeChart' in movesData, false);
});

test('legacy PP above the sourced maximum is clamped without replacing saved moves', () => {
  const saved: CreatureSave = {
    instanceId: 'legacy-vine-whip', speciesId: 1, level: 9, experience: 8, hp: 19, maxHp: 24,
    moves: [{ id: 'vine-whip', pp: 25 }],
  };
  const creature = createBattleCreatureFromSave(saved, { species, moves });
  assert.deepEqual(creature.moves, [{ moveId: 'vine-whip', pp: 15 }]);
  assert.equal(creature.hp, 19);
  assert.equal(creature.experience, 8);
  assert.equal(saved.moves[0].pp, 25);
});

test('expanded sourced moves preserve HGSS values and real learning boundaries', () => {
  assert.deepEqual([moves['leech-life'].power, moves['leech-life'].maxPp, moves['leech-life'].drainPercent], [20, 15, 50]);
  assert.deepEqual([moves['mud-shot'].power, moves['mud-shot'].statChangeChance], [55, 100]);
  assert.deepEqual(moves['mud-shot'].statChanges, [{ target: 'opponent', stat: 'speed', stages: -1 }]);
  for (const [id, moveId, level] of [[167, 'leech-life', 12], [194, 'mud-shot', 9], [161, 'fury-swipes', 13], [60, 'double-slap', 15], [12, 'stun-spore', 12], [16, 'sand-attack', 5], [4, 'smokescreen', 10], [43, 'sweet-scent', 5], [1, 'leech-seed', 7]] as const) {
    const before = createBattleCreature({ species, moves, speciesId: id, level: level - 1, instanceId: `before-${id}` });
    const after = createBattleCreature({ species, moves, speciesId: id, level, instanceId: `after-${id}` });
    assert.equal(before.moves.some(slot => slot.moveId === moveId), false);
    assert.ok(after.moves.some(slot => slot.moveId === moveId && slot.pp === moves[moveId].maxPp));
  }
});
