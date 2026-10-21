import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import moves from '../../content/battle/moves.v1.json' with { type: 'json' };
import learning from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };

const source = (name: string) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/${name}.json`, import.meta.url), 'utf8'));

test('Riduttore retains official Take Down parameters and a distinct damage-based recoil field', () => {
  const raw = source('move-take-down');
  const move = moves.moves['take-down'];
  assert.equal(move.name, raw.names.find((entry: any) => entry.language.name === 'it').name);
  assert.deepEqual([move.type, move.category, move.power, move.accuracy, move.maxPp],
    [raw.type.name, raw.damage_class.name, raw.power, raw.accuracy, raw.pp]);
  assert.deepEqual([move.power, move.accuracy, move.maxPp, move.recoilPercent], [90, 85, 20, 25]);
  assert.equal(move.recoilPercent, -raw.meta.drain);
  assert.ok(!('drainPercent' in move));
});

test('every registered HGSS Take Down learner gets the source level, including Bulbasaur at 15', () => {
  for (const [id, entries] of Object.entries(learning.species)) {
    const raw = source(`pokemon-${id}`);
    const move = raw.moves.find((entry: any) => entry.move.name === 'take-down');
    const officialLevels = [...new Set<number>((move?.version_group_details ?? [])
      .filter((entry: any) => entry.version_group.name === 'heartgold-soulsilver' && entry.move_learn_method.name === 'level-up')
      .map((entry: any) => entry.level_learned_at))].sort((a, b) => a - b);
    const runtimeLevels = entries.filter(entry => entry.moveId === 'take-down').map(entry => entry.level).sort((a, b) => a - b);
    assert.deepEqual(runtimeLevels, officialLevels, `HGSS learner ${id}`);
  }
  assert.ok(learning.species['1'].some(entry => entry.level === 15 && entry.moveId === 'take-down'));
});
