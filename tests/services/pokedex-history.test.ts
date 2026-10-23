import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPokedexEntries, caughtSpeciesFromFlags, recordSpeciesCaught } from '../../src/core/party/pokedex.ts';
import { queueEvolutionReceipts } from '../../src/core/services/item-evolution.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

test('evolution retains both caught species after the presentation receipt is consumed and JSON reloads', () => {
  const original = { flags: ['q_started'], party: [{ speciesId: 5 }], storage: [] } as unknown as GameSave;
  const queued = queueEvolutionReceipts(original, [{ creatureId: 'starter', fromSpeciesId: 4, toSpeciesId: 5, level: 16 }]);
  const reloaded = JSON.parse(JSON.stringify({ ...queued, flags: queued.flags.filter(flag => !flag.startsWith('presentation/')) }));
  const caught = caughtSpeciesFromFlags(reloaded.flags);
  assert.deepEqual(caught, [4, 5]);
  const entries = buildPokedexEntries({ 4: { speciesId: 4, name: 'Charmander' }, 5: { speciesId: 5, name: 'Charmeleon' }, 7: { speciesId: 7, name: 'Squirtle' } }, reloaded.party, [], [], caught);
  assert.equal(entries[0].registered, true);
  assert.equal(entries[0].partyCount, 0);
  assert.equal(entries[0].seen, true);
  assert.equal(entries[2].registered, false);
  assert.deepEqual(original.flags, ['q_started']);
  assert.deepEqual(recordSpeciesCaught(recordSpeciesCaught([], 4), 4), ['pokedex_seen_4', 'pokedex_caught_4']);
  assert.deepEqual(caughtSpeciesFromFlags(['pokedex_caught_0', 'pokedex_caught_no', 'pokedex_seen_7']), []);
});
