import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import catalog from '../../content/battle/moves.v1.json' with { type: 'json' };
import roster from '../../content/battle/species.v1.json' with { type: 'json' };
import learning from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import sourceReport from '../../content/sources/pokeapi/source-learnsets.json' with { type: 'json' };
import sourceManifest from '../../content/sources/pokeapi/manifest.json' with { type: 'json' };
import type { MoveDefinition } from '../../src/core/battle/types.ts';
import { formatMoveDescription } from '../../src/game/battle/move-description.ts';

const moves = catalog.moves as Record<string, MoveDefinition>;
const ids = ['flamethrower', 'psychic', 'crunch', 'shadow-ball', 'sludge-bomb'];
const source = (id: string) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/move-${id}.json`, import.meta.url), 'utf8'));

test('late-game attacks retain official HGSS parameters and every secondary effect', () => {
  const expected = [
    ['flamethrower', 'fire', 'special', 95, 15],
    ['psychic', 'psychic', 'special', 90, 10],
    ['crunch', 'dark', 'physical', 80, 15],
    ['shadow-ball', 'ghost', 'special', 80, 15],
    ['sludge-bomb', 'poison', 'special', 90, 10],
  ];
  for (const [id, type, category, power, pp] of expected) {
    const move = moves[id as string];
    assert.deepEqual([move.type, move.category, move.power, move.accuracy, move.maxPp, move.priority], [type, category, power, 100, pp, 0]);
    const raw = source(id as string);
    assert.ok((sourceManifest.resources as Record<string, { sha256: string }>)[`move/${id}`].sha256);
    // These sources describe regular damage plus one modeled secondary effect, without hidden recoil, healing, multi-hit or critical bonuses.
    assert.deepEqual([raw.meta.drain, raw.meta.healing, raw.meta.crit_rate, raw.meta.flinch_chance, raw.meta.min_hits, raw.meta.max_hits], [0, 0, 0, 0, null, null]);
    assert.match(raw.effect_entries.find((entry: { language: { name: string } }) => entry.language.name === 'en').effect, /^Inflicts regular damage\./);
  }
  assert.deepEqual([source('flamethrower').power, source('flamethrower').past_values[0].version_group.name, source('flamethrower').past_values[0].power], [90, 'x-y', 95]);
  assert.deepEqual([moves.flamethrower.inflictedStatus, moves.flamethrower.statusChance], ['burn', 10]);
  assert.deepEqual([moves['sludge-bomb'].inflictedStatus, moves['sludge-bomb'].statusChance], ['poison', 30]);
  for (const [id, stat, chance] of [['psychic', 'specialDefense', 10], ['crunch', 'defense', 20], ['shadow-ball', 'specialDefense', 20]] as const) {
    assert.deepEqual(moves[id].statChanges, [{ target: 'opponent', stat, stages: -1 }]);
    assert.equal(moves[id].statChangeChance, chance);
    assert.match(formatMoveDescription(moves[id]), new RegExp(`${chance}%`));
  }
  // Psychic's 30% source snapshot predates Gold/Silver and must not override HGSS's 10%.
  assert.deepEqual([source('psychic').past_values[0].version_group.name, source('psychic').past_values[0].effect_chance], ['gold-silver', 30]);
});

test('strategic late-game options appear at official levels across the whole roster', () => {
  const species = roster.species as Record<string, { officialLearnset: Array<{ moveId: string; level: number }> }>;
  const learned = learning.species as Record<string, Array<{ moveId: string; level: number }>>;
  for (const [speciesId, moveId, level] of [['6', 'flamethrower', 42], ['97', 'psychic', 50], ['80', 'psychic', 54], ['20', 'crunch', 24], ['143', 'crunch', 44], ['94', 'shadow-ball', 33], ['110', 'sludge-bomb', 48]] as const) {
    assert.ok(species[speciesId].officialLearnset.some(entry => entry.moveId === moveId && entry.level === level));
    assert.ok(learned[speciesId].some(entry => entry.moveId === moveId && entry.level === level));
  }
  for (const [speciesId, entries] of Object.entries(sourceReport.species)) {
    for (const entry of entries.filter(entry => ids.includes(entry.moveId))) {
      assert.ok(species[speciesId].officialLearnset.some(candidate => candidate.moveId === entry.moveId && candidate.level === entry.level), `${speciesId}: ${entry.moveId} must be refreshed from its source`);
    }
    assert.ok(!(sourceReport.unimplemented as Record<string, Array<{ moveId: string }>>)[speciesId].some(entry => ids.includes(entry.moveId)));
  }
  for (const [speciesId, moveId] of [['94', 'shadow-ball'], ['110', 'sludge-bomb']]) {
    assert.ok(species[speciesId].officialLearnset.some(entry => entry.moveId === moveId), `${speciesId} keeps its official HGSS level-up permission for ${moveId}`);
  }
});
