import assert from 'node:assert/strict';
import test from 'node:test';
import battleData from '../../content/battle/moves.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import importsData from '../../content/battle/species-imports.v1.json' with { type: 'json' };
import progression from '../../content/battle/progression.v2.json' with { type: 'json' };
import evolutionReference from '../../content/battle/evolution-reference.v1.json' with { type: 'json' };
import learnsets from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import sourceLearnsets from '../../content/sources/pokeapi/source-learnsets.json' with { type: 'json' };
import speciesSources from '../../content/sources/pokeapi/species-manifest.json' with { type: 'json' };
import battleSources from '../../content/sources/pokeapi/manifest.json' with { type: 'json' };
import dragonRage from '../../content/sources/pokeapi/move-dragon-rage.json' with { type: 'json' };
import dragonBreath from '../../content/sources/pokeapi/move-dragon-breath.json' with { type: 'json' };
import dragonPulse from '../../content/sources/pokeapi/move-dragon-pulse.json' with { type: 'json' };
import dragonDance from '../../content/sources/pokeapi/move-dragon-dance.json' with { type: 'json' };
import dragonRush from '../../content/sources/pokeapi/move-dragon-rush.json' with { type: 'json' };
import hydroPump from '../../content/sources/pokeapi/move-hydro-pump.json' with { type: 'json' };
import aquaTail from '../../content/sources/pokeapi/move-aqua-tail.json' with { type: 'json' };
import twister from '../../content/sources/pokeapi/move-twister.json' with { type: 'json' };

const ids = [147, 148, 149, 116, 117, 230];
const moves = battleData.moves as Record<string, { type: string; category: string; power: number; accuracy: number; maxPp: number; fixedDamage?: number; inflictedStatus?: string; statusChance?: number; flinchChance?: number; statChanges?: Array<{ target: string; stat: string; stages: number }> }>;
const species = speciesData.species as Record<string, { types: string[]; baseStats: Record<string, number>; defaultMoveIds: string[]; officialLearnset: Array<{ level: number; moveId: string }> }>;
const fullLearnsets = sourceLearnsets.species as Record<string, Array<{ level: number; moveId: string }>>;
const supportedLearning = learnsets.species as Record<string, Array<{ level: number; moveId: string }>>;
const battleManifest = battleSources.resources as Record<string, { sha256: string }>;
const speciesManifest = speciesSources.resources as Record<string, { sha256: string }>;

test('Concordia dragon roster parameters, previews and learnsets have HGSS source coverage', () => {
  const group = importsData.imports.filter(entry => entry.artworkGroup === 'dragon').map(entry => entry.speciesId);
  assert.deepEqual(group, ids);
  for (const id of ids) {
    const key = String(id);
    assert.ok(species[key], `species ${id} is missing`);
    assert.ok(speciesManifest[`pokemon/${id}`]?.sha256, `pokemon/${id} source checksum is missing`);
    assert.ok(speciesManifest[`pokemon-species/${id}`]?.sha256, `pokemon-species/${id} source checksum is missing`);
    const source = new Set(fullLearnsets[key].map(entry => `${entry.level}:${entry.moveId}`));
    assert.ok(species[key].officialLearnset.length > 0);
    for (const entry of species[key].officialLearnset) {
      assert.ok(source.has(`${entry.level}:${entry.moveId}`), `${id} ${entry.moveId} at level ${entry.level} is not in its full HGSS source learnset`);
      assert.ok(moves[entry.moveId], `${entry.moveId} is absent from the runtime move catalog`);
    }
    assert.deepEqual(supportedLearning[key], species[key].officialLearnset
      .filter(entry => entry.level >= 2)
      .filter((entry, index, all) => all.findIndex(candidate => candidate.moveId === entry.moveId) === index));
  }
  assert.deepEqual(species['147'].defaultMoveIds, ['thunder-wave']);
  assert.deepEqual(species['147'].types, ['dragon']);
  assert.deepEqual(species['147'].baseStats, { hp: 41, attack: 64, defense: 45, specialAttack: 50, specialDefense: 50, speed: 50 });
  assert.deepEqual(species['149'].types, ['dragon', 'flying']);
  assert.deepEqual(species['230'].types, ['water', 'dragon']);
});

test('the imported Dragon moves preserve their HGSS-supported effects', () => {
  assert.equal(moves['dragon-rage'].fixedDamage, 40);
  assert.equal(dragonRage.power, null);
  assert.match(dragonRage.effect_entries.find(entry => entry.language.name === 'en')!.short_effect, /^Inflicts 40 points of damage\.$/);
  assert.deepEqual([moves['dragon-breath'].power, moves['dragon-breath'].inflictedStatus, moves['dragon-breath'].statusChance], [60, 'paralysis', 30]);
  assert.deepEqual([dragonBreath.power, dragonBreath.effect_chance, dragonBreath.meta.ailment.name], [60, 30, 'paralysis']);
  // PokéAPI's past_values boundary X/Y records 90 before the later 85 value; HGSS therefore uses 90.
  assert.deepEqual([dragonPulse.power, dragonPulse.past_values[0].version_group.name, dragonPulse.past_values[0].power], [85, 'x-y', 90]);
  assert.deepEqual([moves['dragon-pulse'].power, moves['dragon-pulse'].type, moves['dragon-pulse'].category], [90, 'dragon', 'special']);
  assert.deepEqual(moves['dragon-dance'].statChanges, [
    { target: 'self', stat: 'attack', stages: 1 },
    { target: 'self', stat: 'speed', stages: 1 },
  ]);
  assert.deepEqual(dragonDance.stat_changes.map(entry => [entry.stat.name, entry.change]), [['attack', 1], ['speed', 1]]);
  assert.deepEqual([moves['dragon-rush'].type, moves['dragon-rush'].category, moves['dragon-rush'].power, moves['dragon-rush'].accuracy, moves['dragon-rush'].flinchChance], ['dragon', 'physical', 100, 75, 20]);
  assert.deepEqual([hydroPump.power, hydroPump.past_values[0].version_group.name, hydroPump.past_values[0].power], [110, 'x-y', 120]);
  assert.deepEqual([moves['hydro-pump'].type, moves['hydro-pump'].category, moves['hydro-pump'].power, moves['hydro-pump'].accuracy, moves['hydro-pump'].maxPp], ['water', 'special', 120, 80, 5]);
  assert.deepEqual([aquaTail.power, aquaTail.accuracy, aquaTail.pp], [90, 90, 10]);
  assert.deepEqual([moves['aqua-tail'].type, moves['aqua-tail'].category, moves['aqua-tail'].power, moves['aqua-tail'].accuracy, moves['aqua-tail'].maxPp], ['water', 'physical', 90, 90, 10]);
  for (const id of ['dragon-rage', 'dragon-breath', 'dragon-pulse', 'dragon-dance', 'dragon-rush', 'hydro-pump', 'aqua-tail']) assert.ok(battleManifest[`move/${id}`]?.sha256);
  assert.equal(moves.twister, undefined);
  assert.equal(dragonRush.meta.flinch_chance, 20);
  assert.equal(twister.meta.flinch_chance, 20);
});

test('the proposed P8 lineup uses only moves available by each trainer level', () => {
  const proposed = [
    { speciesId: 148, level: 46, moveIds: ['dragon-rush', 'thunder-wave', 'agility', 'aqua-tail'] },
    { speciesId: 117, level: 47, moveIds: ['bubble-beam', 'smokescreen', 'agility', 'hydro-pump'] },
    { speciesId: 230, level: 48, moveIds: ['hydro-pump', 'bubble-beam', 'smokescreen', 'agility'] },
    { speciesId: 148, level: 49, moveIds: ['dragon-rush', 'dragon-rage', 'thunder-wave', 'aqua-tail'] },
  ];
  for (const member of proposed) {
    const learned = new Set(species[String(member.speciesId)].officialLearnset
      .filter(entry => entry.level <= member.level).map(entry => entry.moveId));
    for (const moveId of member.moveIds) assert.ok(learned.has(moveId), `${member.speciesId} level ${member.level} cannot know ${moveId}`);
  }
  assert.deepEqual(proposed.map(member => member.level), [46, 47, 48, 49]);
  assert.ok(species['148'].officialLearnset.some(entry => entry.moveId === 'aqua-tail' && entry.level === 33));
  assert.ok(species['148'].officialLearnset.some(entry => entry.moveId === 'dragon-rush' && entry.level === 39));
  for (const id of ['117', '230']) assert.ok(species[id].officialLearnset.some(entry => entry.moveId === 'hydro-pump' && entry.level === 40));
});

test('only the official level evolutions activate; Kingdra retains its trade reference', () => {
  const rules = progression.evolutions.filter(rule => ids.includes(rule.fromSpeciesId));
  assert.deepEqual(rules.map(rule => [rule.fromSpeciesId, rule.toSpeciesId, rule.minimumLevel]), [[147, 148, 30], [148, 149, 55], [116, 117, 32]]);
  const reference = evolutionReference.species as Record<string, { evolutions: Array<{ targetSpeciesId: number; trigger: string; minimumLevel: number | null; heldItemName?: string }> }>;
  assert.ok(reference['117'].evolutions.some(entry => entry.targetSpeciesId === 230 && entry.trigger === 'trade' && entry.minimumLevel === null && entry.heldItemName === 'Squama Drago'));
  assert.equal(rules.some(rule => rule.toSpeciesId === 230), false);
});
