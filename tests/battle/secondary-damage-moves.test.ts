import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import learnsetData from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import typeChartData from '../../content/battle/type-chart.v1.json' with { type: 'json' };
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';
import { describeMoveEffects } from '../../src/game/battle/move-description.ts';

const source = (name: string) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/${name}.json`, import.meta.url), 'utf8'));
const ids = ['body-slam', 'signal-beam'] as const;
const moves = moveData.moves as Record<string, MoveDefinition>;
const rules = { ...prototypeBattleRules, typeChart: typeChartData.chart, criticalChance: 0, minimumDamageVariance: 1, maximumDamageVariance: 1 };
const wait: MoveDefinition = { id: 'wait', name: 'Attesa', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 10 };
const catalog = { ...moves, wait };
const commands = { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 0 } } as const;

function creature(id: string, moveId: string): BattleCreature {
  return { instanceId: id, speciesId: 90001, name: id, level: 20, types: ['normal'], hp: 500,
    stats: { maxHp: 500, attack: 70, defense: 50, specialAttack: 60, specialDefense: 50, speed: id === 'player' ? 100 : 10 },
    experience: 0, experienceYield: 0, moves: [{ moveId, pp: catalog[moveId].maxPp }] };
}
function turn(moveId: typeof ids[number], seed: number, target: Partial<BattleCreature> = {}) {
  const state = createBattleState({ battleId: 'secondary-damage', battleType: 'wild', seed, rules,
    playerTeam: [creature('player', moveId)], opponentTeam: [{ ...creature('opponent', 'wait'), ...target }] });
  const before = structuredClone(state);
  const result = resolveBattleTurn(state, commands, catalog, rules);
  assert.deepEqual(state, before);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 14);
  return result;
}

for (const id of ids) {
  test(`${id} parameters and every registered HGSS learning level match cached official responses`, () => {
    const raw = source(`move-${id}`), move = moves[id];
    assert.deepEqual([move.power, move.accuracy, move.maxPp, move.type, move.category, move.priority],
      [raw.power, raw.accuracy, raw.pp, raw.type.name, raw.damage_class.name, raw.priority]);
    assert.equal(move.name, raw.names.find((entry: any) => entry.language.name === 'it').name);
    assert.equal(raw.past_values.length, 0);
    if (id === 'body-slam') {
      assert.equal(move.inflictedStatus, 'paralysis'); assert.equal(move.statusChance, raw.effect_chance);
    } else {
      assert.equal(move.inflictedConfusionChance, raw.effect_chance);
      assert.deepEqual([move.minConfusionTurns, move.maxConfusionTurns], [raw.meta.min_turns, raw.meta.max_turns]);
    }
    let count = 0;
    for (const [speciesId, species] of Object.entries(speciesData.species)) {
      const pokemon = source(`pokemon-${speciesId}`);
      const entry = pokemon.moves.find((entry: any) => entry.move.name === id);
      const levels = [...new Set<number>((entry?.version_group_details ?? [])
        .filter((entry: any) => entry.version_group.name === 'heartgold-soulsilver' && entry.move_learn_method.name === 'level-up')
        .map((entry: any) => entry.level_learned_at))].sort((a, b) => a - b);
      count += levels.length;
      assert.deepEqual(species.officialLearnset.filter(slot => slot.moveId === id).map(slot => slot.level).sort((a, b) => a - b), levels, speciesId);
      assert.deepEqual((learnsetData.species as Record<string, Array<{ level: number; moveId: string }>>)[speciesId].filter(slot => slot.moveId === id).map(slot => slot.level).sort((a, b) => a - b), levels.filter(level => level >= 2), speciesId);
    }
    assert.equal(count, id === 'body-slam' ? 7 : 5);
  });
}

for (const [seed, paralyzed, confused] of [[1, true, false], [13, true, true]] as const) {
  test(`secondary effects use the catalog chance at seed ${seed}`, () => {
    const body = turn('body-slam', seed), beam = turn('signal-beam', seed);
    assert.equal(body.events.some(event => event.type === 'statusApplied' && event.status === 'paralysis'), paralyzed);
    assert.equal(beam.events.some(event => event.type === 'confusionApplied'), confused);
    if (confused) {
      const confusion = beam.events.find(event => event.type === 'confusionApplied');
      assert.ok(confusion && confusion.turns >= 2 && confusion.turns <= 5);
    }
  });
}

test('Body Slam Ghost immunity prevents both damage and paralysis', () => {
  const result = turn('body-slam', 13, { types: ['ghost'] });
  assert.equal(result.state.opponent.creatures[0].hp, 500);
  assert.ok(result.events.some(event => event.type === 'damageApplied' && event.effectiveness === 0));
  assert.ok(!result.events.some(event => event.type === 'statusApplied'));
});

test('Signal Beam can confuse a Psychic target with an existing major status', () => {
  const result = turn('signal-beam', 13, { types: ['psychic'], status: { status: 'poison' } });
  assert.ok(result.events.some(event => event.type === 'damageApplied' && event.moveId === 'signal-beam' && event.effectiveness === 2));
  assert.ok(result.events.some(event => event.type === 'confusionApplied'));
  assert.equal(result.state.opponent.creatures[0].status?.status, 'poison');
});

test('shared move descriptions expose the two different tactical effects', () => {
  const body = describeMoveEffects(moves['body-slam']).join(' '), beam = describeMoveEffects(moves['signal-beam']).join(' ');
  assert.match(body, /danni fisici/); assert.match(body, /paralisi.*30%/);
  assert.match(beam, /danni speciali/); assert.match(beam, /Confonde.*10%.*2–5 turni/);
});
