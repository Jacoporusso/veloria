import assert from 'node:assert/strict';
import test from 'node:test';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import progression from '../../content/battle/progression.v1.json' with { type: 'json' };
import evolutionReference from '../../content/battle/evolution-reference.v1.json' with { type: 'json' };
import learnsets from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import sourceLearnsets from '../../content/sources/pokeapi/source-learnsets.json' with { type: 'json' };
import speciesSources from '../../content/sources/pokeapi/species-manifest.json' with { type: 'json' };
import moveSources from '../../content/sources/pokeapi/manifest.json' with { type: 'json' };
import evolutionSources from '../../content/sources/pokeapi/evolution-manifest.json' with { type: 'json' };
import swinubChain from '../../content/sources/pokeapi/evolution-chain-112.json' with { type: 'json' };
import seelChain from '../../content/sources/pokeapi/evolution-chain-37.json' with { type: 'json' };
import catalogAudit from '../../content/sources/pokeapi/mountain-catalog-audit.json' with { type: 'json' };
import delibirdSource from '../../content/sources/pokeapi/pokemon-225.json' with { type: 'json' };

const speciesIds = [220, 221, 215, 86, 87, 124];
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
      supported.filter(entry => entry.level >= 2).filter((entry, index, all) => all.findIndex(candidate => candidate.moveId === entry.moveId) === index));
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

test('unsupported HGSS move effects are documented and stay out of runtime learnsets', () => {
  const runtimeMoves = new Set(speciesIds.flatMap(id => species[String(id)].officialLearnset.map(entry => entry.moveId)));
  for (const finding of catalogAudit.unsupportedMechanics) {
    assert.ok(finding.moves.length > 0);
    for (const id of finding.moves) {
      assert.ok(sourceManifest[`move/${id}`]?.sha256, `unsupported example ${id} has no cached source`);
      assert.equal(runtimeMoves.has(id), false, `unsupported move ${id} leaked into the runtime learnsets`);
    }
  }
  const delibirdMoves=delibirdSource.moves.filter(move=>move.version_group_details.some(detail=>detail.version_group.name==='heartgold-soulsilver'&&detail.move_learn_method.name==='level-up'));
  assert.deepEqual(delibirdMoves.map(entry=>entry.move.name), ['present']);
  assert.equal(species['225'], undefined);
  assert.ok(catalogAudit.deferredSpecies.some(entry => entry.speciesId === 225));
});

test('mountain evolution thresholds match the source reference and stay within the requested catalog', () => {
  assert.deepEqual(groupedRules.map(rule => [rule.fromSpeciesId, rule.toSpeciesId, rule.minimumLevel]), [[220, 221, 33], [86, 87, 34]]);
  const evolutionManifest = evolutionSources.resources as Record<string, { sha256: string }>;
  assert.ok(evolutionManifest['evolution-chain/112']?.sha256);
  assert.ok(evolutionManifest['evolution-chain/37']?.sha256);
  assert.equal(swinubChain.chain.evolves_to[0].evolution_details[0].min_level, 33);
  assert.equal(seelChain.chain.evolves_to[0].evolution_details[0].min_level, 34);
  for (const [from, to, level] of [[220, 221, 33], [86, 87, 34]]) {
    assert.ok(reference[String(from)].evolutions.some(entry => entry.targetSpeciesId === to && entry.trigger === 'level-up' && entry.minimumLevel === level));
  }
  assert.equal(species['220'].growthCurveId, species['194'].growthCurveId);
  assert.equal(species['221'].growthCurveId, species['195'].growthCurveId);
  assert.equal(species['215'].growthCurveId, species['19'].growthCurveId);
  assert.equal(species['86'].growthCurveId, species['7'].growthCurveId);
  assert.equal(species['87'].growthCurveId, species['80'].growthCurveId);
  assert.equal(species['124'].growthCurveId, species['96'].growthCurveId);
  assert.equal(species['473'], undefined);
  assert.equal(species['461'], undefined);
});
