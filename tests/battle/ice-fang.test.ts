import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules, type BattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';
import { describeMoveEffects } from '../../src/game/battle/move-description.ts';

const source = (name: string) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/${name}.json`, import.meta.url), 'utf8'));
const iceFang = moveData.moves['ice-fang'] as MoveDefinition;
const reply: MoveDefinition = { id: 'reply', name: 'Colpo di prova', type: 'normal', category: 'physical', power: 1,
  accuracy: 100, alwaysHits: true, priority: 0, maxPp: 10 };
const catalog = { 'ice-fang': iceFang, reply };
const commands = { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } } as const;
// Immediate thaw makes both secondary rolls observable in one turn. Runtime
// freeze duration and thaw chance remain unchanged in prototypeBattleRules.
const rules: BattleRules = { ...prototypeBattleRules, criticalChance: 0, minimumDamageVariance: 1,
  maximumDamageVariance: 1, freezeTurns: [1, 1], freezeThawChance: 1 };

function creature(id: 'player' | 'opponent', speed: number): BattleCreature {
  return { instanceId: id, speciesId: 90001, name: id, level: 10, types: ['normal'], hp: 500,
    stats: { maxHp: 500, attack: 20, defense: 20, specialAttack: 20, specialDefense: 20, speed },
    experience: 0, experienceYield: 0, moves: [{ moveId: id === 'player' ? 'ice-fang' : 'reply', pp: id === 'player' ? 15 : 10 }] };
}

function battle(seed: number, target: Partial<BattleCreature> = {}, slow = false, battleRules: BattleRules = rules) {
  const input = createBattleState({ battleId: 'ice-fang-composition', battleType: 'wild', seed, rules: battleRules,
    playerTeam: [creature('player', slow ? 5 : 100)], opponentTeam: [{ ...creature('opponent', 10), ...target }] });
  const before = structuredClone(input);
  const result = resolveBattleTurn(input, commands, catalog, battleRules);
  assert.deepEqual(input, before, 'resolving combined effects must not mutate the input snapshot');
  return result;
}

test('Ice Fang parameters, independent effects and all HGSS learners match the cached source', () => {
  const raw = source('move-ice-fang');
  assert.deepEqual([iceFang.power, iceFang.accuracy, iceFang.maxPp, iceFang.type, iceFang.category],
    [raw.power, raw.accuracy, raw.pp, raw.type.name, raw.damage_class.name]);
  assert.deepEqual([iceFang.inflictedStatus, iceFang.statusChance, iceFang.flinchChance], ['freeze', 10, 10]);
  assert.equal(iceFang.statusChance, raw.meta.ailment_chance);
  assert.equal(iceFang.flinchChance, raw.meta.flinch_chance);
  assert.match(raw.effect_entries.find((entry: any) => entry.language.name === 'en').effect, /separate chance/);
  assert.equal(iceFang.minStatusTurns, undefined);
  for (const [id, species] of Object.entries(speciesData.species)) {
    const pokemon = source(`pokemon-${id}`);
    const slot = pokemon.moves.find((entry: any) => entry.move.name === 'ice-fang');
    const levels = [...new Set<number>((slot?.version_group_details ?? [])
      .filter((entry: any) => entry.version_group.name === 'heartgold-soulsilver' && entry.move_learn_method.name === 'level-up')
      .map((entry: any) => entry.level_learned_at))].sort((a, b) => a - b);
    assert.deepEqual(species.officialLearnset.filter(entry => entry.moveId === 'ice-fang').map(entry => entry.level).sort((a, b) => a - b), levels, `learner ${id}`);
  }
});

for (const [seed, frozen, flinched] of [[1, false, false], [7, false, true], [13, true, false], [33, true, true]] as const) {
  test(`independent Ice Fang effects with seed ${seed}: freeze=${frozen}, flinch=${flinched}`, () => {
    const result = battle(seed);
    assert.equal(result.events.some(event => event.type === 'statusApplied' && event.status === 'freeze'), frozen);
    assert.equal(result.events.some(event => event.type === 'flinched'), flinched);
    assert.equal(result.state.player.creatures[0].moves[0].pp, 14);
    assert.equal(result.state.opponent.creatures[0].moves[0].pp, flinched ? 10 : 9);
    if (frozen) assert.ok(result.events.some(event => event.type === 'statusTick' && event.status === 'freeze' && event.recovered));
    if (frozen && flinched) {
      assert.ok(result.events.findIndex(event => event.type === 'flinched') > result.events.findIndex(event => event.type === 'statusTick'));
    }
  });
}

test('Ice immunity prevents freeze without suppressing the independent flinch', () => {
  const result = battle(59, { types: ['ice'] });
  assert.ok(result.events.some(event => event.type === 'statusPrevented' && event.reason === 'immune'));
  assert.ok(result.events.some(event => event.type === 'flinched'));
  assert.equal(result.state.opponent.creatures[0].status, undefined);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp, 10);
});

test('both effects also occur with the unchanged runtime freeze and thaw rules', () => {
  const result = battle(508, {}, false, prototypeBattleRules);
  assert.ok(result.events.some(event => event.type === 'statusApplied' && event.status === 'freeze'));
  const recovered = result.events.findIndex(event => event.type === 'statusTick' && event.status === 'freeze' && event.recovered);
  const flinched = result.events.findIndex(event => event.type === 'flinched');
  assert.ok(recovered >= 0 && flinched > recovered);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp, 10);
  assert.equal(result.state.opponent.creatures[0].status, undefined);
  assert.equal(result.state.rngState, 688625133);
});

test('an existing major status is preserved while the other secondary effect can succeed', () => {
  const result = battle(59, { status: { status: 'poison' } });
  assert.ok(result.events.some(event => event.type === 'statusPrevented' && event.reason === 'alreadyAfflicted'));
  assert.ok(result.events.some(event => event.type === 'flinched'));
  assert.equal(result.state.opponent.creatures[0].status?.status, 'poison');
});

test('a slower Ice Fang can freeze but cannot cancel an action already performed', () => {
  const result = battle(24, {}, true);
  assert.ok(result.events.some(event => event.type === 'statusApplied' && event.status === 'freeze'));
  assert.equal(result.events.some(event => event.type === 'flinched'), false);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp, 9);
});

test('a miss or a knockout cannot apply either secondary effect', () => {
  const missed = battle(12);
  assert.ok(missed.events.some(event => event.type === 'moveMissed' && event.side === 'player'));
  const knockout = battle(1, { hp: 1 });
  assert.equal(knockout.state.opponent.creatures[0].hp, 0);
  for (const result of [missed, knockout]) {
    assert.equal(result.events.some(event => event.type === 'statusApplied' || event.type === 'flinched'), false);
    assert.equal(result.state.player.creatures[0].moves[0].pp, 14);
  }
});

test('shared move details explain both probabilities, independence and Ice immunity', () => {
  const text = describeMoveEffects(iceFang).join(' ');
  assert.equal(text.match(/10%/g)?.length, 2);
  assert.match(text, /indipendenti/);
  assert.match(text, /Ghiaccio.*immuni al gelo/);
  assert.match(text, /prima che agisca/);
});
