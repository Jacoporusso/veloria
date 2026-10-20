import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import catalog from '../../content/battle/moves.v1.json' with { type: 'json' };
import roster from '../../content/battle/species.v1.json' with { type: 'json' };
import learning from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import report from '../../content/sources/pokeapi/source-learnsets.json' with { type: 'json' };
import manifest from '../../content/sources/pokeapi/manifest.json' with { type: 'json' };
import type { MoveDefinition } from '../../src/core/battle/types.ts';
import { formatMoveDescription } from '../../src/game/battle/move-description.ts';
const moves = catalog.moves as Record<string, MoveDefinition>;
const source = (id: string) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/move-${id}.json`, import.meta.url), 'utf8'));

test('Ronzio and Velenpuntura import full supported official effects without balance overrides', () => {
  assert.deepEqual([moves['bug-buzz'].name, moves['bug-buzz'].type, moves['bug-buzz'].category, moves['bug-buzz'].power, moves['bug-buzz'].accuracy, moves['bug-buzz'].maxPp], ['Ronzio', 'bug', 'special', 90, 100, 10]);
  assert.deepEqual(moves['bug-buzz'].statChanges, [{ target: 'opponent', stat: 'specialDefense', stages: -1 }]);
  assert.equal(moves['bug-buzz'].statChangeChance, 10);
  assert.deepEqual([moves['poison-jab'].name, moves['poison-jab'].type, moves['poison-jab'].category, moves['poison-jab'].power, moves['poison-jab'].accuracy, moves['poison-jab'].maxPp, moves['poison-jab'].inflictedStatus, moves['poison-jab'].statusChance], ['Velenpuntura', 'poison', 'physical', 80, 100, 20, 'poison', 30]);
  for (const id of ['bug-buzz', 'poison-jab']) {
    const raw = source(id);
    assert.deepEqual(raw.past_values, [], `${id} has no historical parameter overrides`);
    assert.deepEqual([raw.meta.drain, raw.meta.healing, raw.meta.crit_rate, raw.meta.flinch_chance, raw.meta.min_hits, raw.meta.max_hits], [0, 0, 0, 0, null, null]);
    assert.match(raw.effect_entries.find((entry: { language: { name: string } }) => entry.language.name === 'en').effect, /^Inflicts regular damage\./);
    assert.ok((manifest.resources as Record<string, { sha256: string }>)[`move/${id}`].sha256);
  }
  assert.equal(source('bug-buzz').meta.stat_chance, 10);
  assert.equal(source('poison-jab').meta.ailment_chance, 30);
  assert.match(formatMoveDescription(moves['bug-buzz']), /10%/);
  assert.match(formatMoveDescription(moves['poison-jab']), /30%/);
});

test('Butterfree and Beedrill gain the official HGSS late-game attacks at their actual levels', () => {
  const species = roster.species as Record<string, { officialLearnset: Array<{ moveId: string; level: number }> }>;
  const learnsets = learning.species as Record<string, Array<{ moveId: string; level: number }>>;
  for (const [speciesId, moveId, level] of [['12', 'bug-buzz', 40], ['15', 'poison-jab', 37]] as const) {
    for (const entries of [species[speciesId].officialLearnset, learnsets[speciesId]]) assert.ok(entries.some(entry => entry.moveId === moveId && entry.level === level));
  }
  for (const [speciesId, entries] of Object.entries(report.species)) {
    for (const entry of entries.filter(entry => ['bug-buzz', 'poison-jab'].includes(entry.moveId))) assert.ok(species[speciesId].officialLearnset.some(candidate => candidate.moveId === entry.moveId && candidate.level === entry.level));
    assert.ok(!(report.unimplemented as Record<string, Array<{ moveId: string }>>)[speciesId].some(entry => ['bug-buzz', 'poison-jab'].includes(entry.moveId)));
  }
});
