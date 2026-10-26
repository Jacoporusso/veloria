import assert from 'node:assert/strict';
import test from 'node:test';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import progression from '../../content/battle/progression.v2.json' with { type: 'json' };
import evolutionReference from '../../content/battle/evolution-reference.v1.json' with { type: 'json' };
import learnsets from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import sourceLearnsets from '../../content/sources/pokeapi/source-learnsets.json' with { type: 'json' };
import speciesSources from '../../content/sources/pokeapi/species-manifest.json' with { type: 'json' };
import moveSources from '../../content/sources/pokeapi/manifest.json' with { type: 'json' };
import evolutionSources from '../../content/sources/pokeapi/evolution-manifest.json' with { type: 'json' };
import seelChain from '../../content/sources/pokeapi/evolution-chain-37.json' with { type: 'json' };
import moveCoverage from '../../content/sources/pokeapi/gen1-move-coverage.json' with { type: 'json' };

const speciesIds = [41, 42, 74, 75, 86, 87];
const moves = moveData.moves as Record<string, { type: string; category: string; power: number; accuracy: number; maxPp: number; priority?: number; alwaysHits?: boolean; inflictedStatus?: string; statusChance?: number; statChanges?: unknown[]; statChangeChance?: number }>;
const species = speciesData.species as Record<string, { growthCurveId: string; defaultMoveIds: string[]; officialLearnset: Array<{ level: number; moveId: string }> }>;
const groupedRules = progression.evolutions.filter(rule => speciesIds.includes(rule.fromSpeciesId));
const reference = evolutionReference.species as Record<string, { evolutions: Array<{ targetSpeciesId: number; minimumLevel: number | null; trigger: string }> }>;
const sourceManifest = moveSources.resources as Record<string, { path: string; sha256: string }>;
const speciesManifest = speciesSources.resources as Record<string, { path: string; sha256: string }>;

test('mountain species and every imported move have PokéAPI HGSS source records', () => {
  for (const speciesId of speciesIds) {
    const id = String(speciesId);
    assert.ok(species[`${id}`], `missing species ${id}`);
    assert.ok(speciesManifest[`pokemon/${id}`]?.sha256, `missing cached species source checksum ${id}`);
    const full = sourceLearnsets.species[id] as Array<{ level: number; moveId: string }>;
    const supported = species[id].officialLearnset;
    const declared = new Set(full.map(entry => `${entry.level}:${entry.moveId}`));
    assert.ok(supported.length > 0, `no supported level-up entries for ${id}`);
    for (const entry of supported) {
      assert.ok(declared.has(`${entry.level}:${entry.moveId}`), `${id} ${entry.moveId} level ${entry.level} is absent from the full source learnset`);
      assert.ok(moves[entry.moveId], `${id} ${entry.moveId} is not implemented`);
      assert.ok(sourceManifest[`move/${entry.moveId}`]?.sha256, `missing raw move source checksum for ${entry.moveId}`);
    }
    assert.deepEqual((learnsets.species as Record<string, Array<{ level: number; moveId: string }>>)[id],
      supported.filter(entry => entry.level >= 2).filter((entry, index, all) => all.findIndex(candidate => candidate.moveId === entry.moveId && candidate.level === entry.level) === index));
  }
});

test('mountain ice and Dark moves use only effects represented by the battle model', () => {
  assert.deepEqual([moves['powder-snow'].type, moves['powder-snow'].category, moves['powder-snow'].power, moves['powder-snow'].accuracy, moves['powder-snow'].statusChance], ['ice', 'special', 40, 100, 10]);
  assert.deepEqual([moves['aurora-beam'].power, moves['aurora-beam'].statChangeChance], [65, 10]);
  assert.deepEqual([moves['ice-beam'].power, moves['ice-beam'].statusChance], [95, 10]);
  assert.deepEqual([moves['icy-wind'].power, moves['icy-wind'].accuracy, moves['icy-wind'].statChangeChance], [55, 95, 100]);
  assert.deepEqual([moves['ice-shard'].power, moves['ice-shard'].priority], [40, 1]);
  assert.deepEqual([moves['feint-attack'].type, moves['feint-attack'].power, moves['feint-attack'].alwaysHits], ['dark', 60, true]);
  for (const id of ['powder-snow', 'aurora-beam', 'ice-beam', 'icy-wind', 'ice-shard', 'feint-attack']) {
    assert.ok(sourceManifest[`move/${id}`]?.sha256, `missing raw source checksum for ${id}`);
  }
});

test('all official Gen I HGSS level-up move mechanics are represented in the runtime learnsets', () => {
  assert.equal(moveCoverage.runtimeSpeciesCount, 151);
  assert.equal(moveCoverage.uniqueLevelUpMoveCount, 370);
  assert.equal(moveCoverage.implementedMoveCount, 370);
  assert.equal(moveCoverage.unsupportedMoveCount, 0);
  assert.ok(Object.values(moveCoverage.moves).every((entry: any) => entry.implementationStatus === 'implemented'));
});

test('mountain evolution thresholds match the source reference and stay within the requested catalog', () => {
  assert.deepEqual(groupedRules.map(rule => [rule.fromSpeciesId, rule.toSpeciesId, rule.minimumLevel]), [[41, 42, 22], [74, 75, 25], [86, 87, 34]]);
  const evolutionManifest = evolutionSources.resources as Record<string, { sha256: string }>;
  assert.ok(evolutionManifest['evolution-chain/37']?.sha256);
  assert.equal(seelChain.chain.evolves_to[0].evolution_details[0].min_level, 34);
  for (const [from, to, level] of [[41, 42, 22], [86, 87, 34], [74, 75, 25]]) {
    assert.ok(reference[String(from)].evolutions.some(entry => entry.targetSpeciesId === to && entry.trigger === 'level-up' && entry.minimumLevel === level));
  }
  for (const id of speciesIds) assert.ok(species[String(id)].growthCurveId.startsWith('pokeapi_growth_'));
  assert.equal(species['473'], undefined);
  assert.equal(species['461'], undefined);
});
