import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPokedexEntries, recordSpeciesSeen, seenSpeciesFromFlags } from '../../src/core/party/pokedex.ts';

const catalog = {
  '25': { speciesId: 25, name: 'Pikachu' },
  '4': { speciesId: 4, name: 'Charmander' },
  '7': { speciesId: 7, name: 'Squirtle' },
};

test('Pokédex entries derive registered species and ownership counts from party and storage', () => {
  const entries = buildPokedexEntries(catalog, [{ speciesId: 4 }, { speciesId: 4 }], [{ speciesId: 7 }]);
  assert.deepEqual(entries, [
    { speciesId: 4, name: 'Charmander', partyCount: 2, storageCount: 0, registered: true, seen: true },
    { speciesId: 7, name: 'Squirtle', partyCount: 0, storageCount: 1, registered: true, seen: true },
    { speciesId: 25, name: 'Pikachu', partyCount: 0, storageCount: 0, registered: false, seen: false },
  ]);
});

test('sightings survive without ownership and deduplicate without changing source flags', () => {
  const original = ['q_started'];
  const flags = recordSpeciesSeen(recordSpeciesSeen(original, 25), 25);
  assert.deepEqual(original, ['q_started']);
  assert.deepEqual(seenSpeciesFromFlags([...flags, 'pokedex_seen_invalid', 'pokedex_seen_0', 'other_7']), [25]);
  const entries = buildPokedexEntries(catalog, [], [], seenSpeciesFromFlags(flags));
  assert.equal(entries.find(entry => entry.speciesId === 25)?.seen, true);
  assert.equal(entries.find(entry => entry.speciesId === 25)?.registered, false);
  assert.equal(entries.find(entry => entry.speciesId === 7)?.seen, false);
});

test('Pokédex ignores owned species missing from the current content catalog', () => {
  const entries = buildPokedexEntries(catalog, [{ speciesId: 999 }], []);
  assert.equal(entries.some(entry => entry.speciesId === 999), false);
});
