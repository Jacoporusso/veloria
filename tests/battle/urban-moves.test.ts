import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import type { MoveDefinition } from '../../src/core/battle/types.ts';

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const root = process.cwd();
const speciesData = readJson<{ species: Record<string, { speciesId: number; name: string; officialLearnset?: { level: number; moveId: string }[] }> }>(`${root}/content/battle/species.v1.json`);
const moveData = readJson<{ moves: Record<string, MoveDefinition> }>(`${root}/content/battle/moves.v1.json`);
const sourceLearnsets = readJson<{ source: { versionGroup: string }; species: Record<string, { level: number; moveId: string }[]> }>(`${root}/content/sources/pokeapi/source-learnsets.json`);

test('canonical urban battle content has 34 species and 45 implemented moves', () => {
  assert.equal(Object.keys(speciesData.species).length, 34);
  assert.equal(Object.keys(moveData.moves).length, 45);
  assert.equal(sourceLearnsets.source.versionGroup, 'heartgold-soulsilver');
});

test('Aster fields Voltorb 16 and Magnemite 17 with official level-legal HGSS moves', () => {
  const trainer = readJson<{ id: string; team: { speciesId: number; level: number; moveIds: string[] }[] }>(`${root}/content/trainers/gym03_aster.trainer.json`);
  assert.equal(trainer.id, 'veloria/trainer_aster_gym03');
  assert.deepEqual(trainer.team.map(member => [member.speciesId, member.level]), [[100, 16], [81, 17]]);

  for (const member of trainer.team) {
    const species = speciesData.species[String(member.speciesId)];
    const officialRuntimeLearnset = species?.officialLearnset ?? [];
    const sourceLearnset = sourceLearnsets.species[String(member.speciesId)] ?? [];
    assert.ok(species, `species ${member.speciesId} exists in the runtime registry`);
    assert.ok(member.moveIds.length > 0 && member.moveIds.length <= 4);
    for (const moveId of member.moveIds) {
      assert.ok(moveData.moves[moveId], `${moveId} has an implemented runtime definition`);
      assert.ok(officialRuntimeLearnset.some(entry => entry.moveId === moveId && entry.level <= member.level), `${species.name} learns ${moveId} by level ${member.level}`);
      assert.ok(sourceLearnset.some(entry => entry.moveId === moveId && entry.level <= member.level), `${moveId} is in the cached official HGSS learnset`);
    }
  }
});

test('new electric and city moves retain their canonical effects and type immunity policy', () => {
  const moves = moveData.moves;
  assert.equal(moves['sonic-boom'].name, 'Sonicboom');
  assert.equal(moves['sonic-boom'].fixedDamage, 20);
  assert.equal(moves['sonic-boom'].accuracy, 90);

  assert.equal(moves.supersonic.inflictedConfusionChance, 100);
  assert.deepEqual([moves.supersonic.minConfusionTurns, moves.supersonic.maxConfusionTurns], [2, 5]);

  assert.equal(moves['thunder-wave'].name, 'Tuononda');
  assert.equal(moves['thunder-wave'].accuracy, 100, 'HGSS accuracy comes from the cached pre-Sun/Moon value');
  assert.equal(moves['thunder-wave'].inflictedStatus, 'paralysis');
  assert.equal(moves['thunder-wave'].statusAffectedByTypeImmunity, true);
  assert.equal(moves.spark.power, 65);
  assert.equal(moves.spark.accuracy, 100);
  assert.equal(moves.spark.inflictedStatus, 'paralysis');
  assert.equal(moves.spark.statusChance, 30);
  assert.equal(moves.spark.statusAffectedByTypeImmunity, undefined, 'ordinary damaging moves use the type chart');

  assert.equal(moves['metal-sound'].name, 'Ferrostrido');
  assert.deepEqual(moves['metal-sound'].statChanges, [{ target: 'opponent', stat: 'specialDefense', stages: -2 }]);
  assert.deepEqual(moves.screech.statChanges, [{ target: 'opponent', stat: 'defense', stages: -2 }]);
});
