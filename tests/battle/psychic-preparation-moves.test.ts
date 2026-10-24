import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import learningData from '../../content/battle/level-up-moves.v1.json' with { type: 'json' };
import progression from '../../content/battle/progression.v2.json' with { type: 'json' };
import { createBattleCreature, type BattleMoveRegistry, type SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { experienceToNextLevel } from '../../src/core/battle/progression.ts';
import { prototypeBattleRules, type ExperienceCurve } from '../../src/core/battle/rules.ts';
import { describeMoveEffects } from '../../src/game/battle/move-description.ts';

const source = (name: string) => JSON.parse(readFileSync(new URL(`../../content/sources/pokeapi/${name}.json`, import.meta.url), 'utf8'));
const moves = moveData.moves as BattleMoveRegistry;
const species = speciesData.species as SpeciesBattleRegistry;

for (const id of ['bite', 'headbutt'] as const) {
  test(`${id} retains official HGSS damage and its 30 percent conditional flinch`, () => {
    const raw = source(`move-${id}`), move = moves[id];
    assert.equal(move.name, raw.names.find((entry: any) => entry.language.name === 'it').name);
    assert.deepEqual([move.power, move.accuracy, move.maxPp, move.category, move.type], [raw.power, raw.accuracy, raw.pp, raw.damage_class.name, raw.type.name]);
    assert.equal(move.type, id === 'bite' ? 'dark' : 'normal');
    assert.equal(raw.meta.crit_rate, 0);
    assert.equal(move.flinchChance, raw.meta.flinch_chance);
    assert.equal(move.flinchChance, 30);
    const effects = describeMoveEffects(move).join(' ');
    assert.match(effects, /30%/);
    assert.match(effects, /prima che agisca/);
  });
}

test('all official learners retain distinct repeated learning levels, including Headbutt at 15 and 32', () => {
  for (const [id, entries] of Object.entries(learningData.species)) {
    const raw = source(`pokemon-${id}`);
    for (const moveId of ['bite', 'headbutt']) {
      const slot = raw.moves.find((entry: any) => entry.move.name === moveId);
      const levels = [...new Set<number>((slot?.version_group_details ?? [])
        .filter((entry: any) => entry.version_group.name === 'heartgold-soulsilver' && entry.move_learn_method.name === 'level-up' && entry.level_learned_at >= 2)
        .map((entry: any) => entry.level_learned_at))].sort((a, b) => a - b);
      assert.deepEqual(entries.filter(entry => entry.moveId === moveId).map(entry => entry.level).sort((a, b) => a - b), levels, `${id}:${moveId}`);
    }
  }
  assert.deepEqual(learningData.species['96'].filter(entry => entry.moveId === 'headbutt').map(entry => entry.level), [15, 32]);
});

for (const knowsHeadbutt of [false, true]) {
  test(`Drowzee at 32 ${knowsHeadbutt ? 'keeps the known move and its PP' : 'can learn a move declined at 15'}`, () => {
    const rules = { ...prototypeBattleRules, criticalChance: 0, experienceCurves: progression.growthCurves,
      levelUpMoves: Object.fromEntries(Object.entries(learningData.species).map(([id, entries]) => [id, entries.map(entry => ({ ...entry, maxPp: moves[entry.moveId].maxPp }))])) };
    const own = createBattleCreature({ species, moves, speciesId: 96, level: 31, instanceId: 'returning-learner',
      moveIds: ['pound', knowsHeadbutt ? 'headbutt' : 'confusion', 'meditate', 'psybeam'] });
    const nextLevel = experienceToNextLevel(31, progression.growthCurves[own.growthCurveId as keyof typeof progression.growthCurves] as ExperienceCurve);
    const opponent = createBattleCreature({ species, moves, speciesId: 19, level: 1, instanceId: 'training-opponent', moveIds: ['tackle'] });
    const state = createBattleState({ battleId: 'repeated-source-level', battleType: 'wild', seed: 42, rules,
      playerTeam: [{ ...own, experience: nextLevel - 1, moves: own.moves.map((slot, index) => index === 1 ? { ...slot, pp: 3 } : slot) }],
      opponentTeam: [{ ...opponent, hp: 1 }] });
    const result = resolveBattleTurn(state, { player: { kind: 'useMove', moveSlot: 3 }, opponent: { kind: 'useMove', moveSlot: 0 } }, moves, rules);
    assert.equal(result.state.player.creatures[0].level, 32);
    assert.equal(result.events.some(event => event.type === 'moveLearningSkipped' && event.moveId === 'headbutt'), !knowsHeadbutt);
    if (knowsHeadbutt) assert.equal(result.state.player.creatures[0].moves.find(slot => slot.moveId === 'headbutt')?.pp, 3);
  });
}
