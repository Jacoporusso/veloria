import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import species from '../../content/battle/species.v1.json' with { type: 'json' };

const source = (name: string) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/${name}.json`, import.meta.url), 'utf8'));

for (const id of ['mega-drain', 'magical-leaf'] as const) {
  test(`${id} uses its official parameters and implemented effect`, () => {
    const raw = source(`move-${id}`);
    const move = moves.moves[id];
    assert.equal(move.name, raw.names.find((entry: any) => entry.language.name === 'it').name);
    assert.deepEqual([move.type, move.category, move.power, move.maxPp], [raw.type.name, raw.damage_class.name, raw.power, raw.pp]);
    assert.equal(raw.meta.crit_rate, 0);
    if (id === 'mega-drain') {
      assert.equal(moves.moves[id].drainPercent, raw.meta.drain);
      assert.equal(moves.moves[id].drainPercent, 50);
      assert.equal(move.accuracy, raw.accuracy);
    } else {
      assert.equal(raw.accuracy, null);
      assert.equal(moves.moves[id].alwaysHits, true);
    }
  });
}

test('new supported moves reach every official HGSS learner, including previously registered species', () => {
  for (const [id, definition] of Object.entries(species.species)) {
    const raw = source(`pokemon-${id}`);
    for (const moveId of ['mega-drain', 'magical-leaf']) {
      const slot = raw.moves.find((entry: any) => entry.move.name === moveId);
      const levels = [...new Set((slot?.version_group_details ?? [])
        .filter((entry: any) => entry.version_group.name === 'heartgold-soulsilver' && entry.move_learn_method.name === 'level-up')
        .map((entry: any) => entry.level_learned_at))].sort();
      assert.deepEqual(definition.officialLearnset.filter(entry => entry.moveId === moveId).map(entry => entry.level).sort(), levels, `${id}:${moveId}`);
    }
  }
  assert.ok(species.species['45'].officialLearnset.some(entry => entry.moveId === 'mega-drain' && entry.level === 1));
  assert.ok(species.species['182'].officialLearnset.some(entry => entry.moveId === 'magical-leaf' && entry.level === 23));
});
