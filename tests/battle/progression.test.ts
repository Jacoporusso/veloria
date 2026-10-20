import assert from 'node:assert/strict';
import test from 'node:test';
import progressionData from '../../content/battle/progression.v1.json' with { type: 'json' };
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../src/core/battle/create-creature.ts';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { experienceToNextLevel } from '../../src/core/battle/progression.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { EvolutionRule } from '../../src/core/battle/rules.ts';
import type { BattleMoveRegistry, SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';

const species = (speciesData as { species: SpeciesBattleRegistry }).species;
const moves = (moveData as { moves: BattleMoveRegistry }).moves;
const evolutionRules = progressionData.evolutions.reduce<Record<number, EvolutionRule[]>>((rules, entry) => {
  const target = species[String(entry.toSpeciesId)];
  assert.ok(target, `Evolution target ${entry.toSpeciesId} exists in the MVP species registry`);
  (rules[entry.fromSpeciesId] ??= []).push({ minimumLevel: entry.minimumLevel, target });
  return rules;
}, {});
const rules = {
  ...prototypeBattleRules,
  evolutions: evolutionRules,
  experienceCurves: progressionData.growthCurves,
  criticalChance: 0,
};

test('prototype medium-fast curve uses cubic XP thresholds between consecutive levels', () => {
  const curve = { exponent: 3, multiplier: 1 };
  assert.equal(experienceToNextLevel(5, curve), 91);
  assert.equal(experienceToNextLevel(6, curve), 127);
});

test('growth curves reject invalid level and non-positive parameters', () => {
  assert.throws(() => experienceToNextLevel(0, { exponent: 3, multiplier: 1 }), /Invalid/);
  assert.throws(() => experienceToNextLevel(5, { exponent: 0, multiplier: 1 }), /Invalid/);
  assert.throws(() => experienceToNextLevel(5, { exponent: 3, multiplier: 0 }), /Invalid/);
});

test('Caterpie and Weedle evolve during a first-act battle and keep their party identity', async t => {
  for (const [fromSpeciesId, toSpeciesId, expectedName] of [[10, 11, 'Metapod'], [13, 14, 'Kakuna']] as const) {
    await t.test(`${species[String(fromSpeciesId)].name} evolves at level 7`, () => {
      const player = createBattleCreature({ species, moves, speciesId: fromSpeciesId, level: 5, instanceId: `starter-bug-${fromSpeciesId}` });
      const baseOpponent = createBattleCreature({ species, moves, speciesId: 10, level: 3, instanceId: `wild-bug-${fromSpeciesId}` });
      const opponent = {
        ...baseOpponent,
        hp: 1,
        level: 7, experienceYield: 218,
        stats: { ...baseOpponent.stats, speed: 1 },
      };
      const initial = createBattleState({
        battleId: `vertical-slice-evolution-${fromSpeciesId}`,
        battleType: 'wild',
        seed: 0x51ce,
        rules,
        playerTeam: [player],
        opponentTeam: [opponent],
      });
      const transition = resolveBattleTurn(initial, {
        player: { kind: 'useMove', moveSlot: 0 },
        opponent: { kind: 'useMove', moveSlot: 0 },
      }, moves, rules);
      const evolved = transition.state.player.creatures[0];

      assert.equal(evolved.speciesId, toSpeciesId);
      assert.equal(evolved.name, expectedName);
      assert.equal(evolved.level, 7);
      assert.equal(evolved.instanceId, player.instanceId);
      assert.ok(transition.events.some(event => event.type === 'creatureEvolved' && event.fromSpeciesId === fromSpeciesId && event.toSpeciesId === toSpeciesId));
    });
  }
});

test('vertical-slice evolution content includes both second-stage thresholds and registered artwork species', () => {
  assert.deepEqual(progressionData.evolutions.map(({ fromSpeciesId, toSpeciesId, minimumLevel }) => [fromSpeciesId, toSpeciesId, minimumLevel]), [
    [1, 2, 16], [4, 5, 16], [7, 8, 16],
    [10, 11, 7], [11, 12, 10], [13, 14, 7], [14, 15, 10],
    [16, 17, 18], [19, 20, 20], [161, 162, 15], [163, 164, 20], [179, 180, 15], [194, 195, 20],
    [72, 73, 30], [98, 99, 28], [170, 171, 27],
    [79, 80, 37], [96, 97, 26], [177, 178, 25],
    [2, 3, 32], [5, 6, 36], [8, 9, 36], [180, 181, 30],
    [220, 221, 33], [86, 87, 34],
    [41, 42, 22], [74, 75, 25],
  ]);
  for (const speciesId of [10, 11, 12, 13, 14, 15]) assert.ok(species[String(speciesId)]);
});

test('the second evolution stages trigger at level 10 with their registered target data', async t => {
  for (const [fromSpeciesId, toSpeciesId, expectedName] of [[11, 12, 'Butterfree'], [14, 15, 'Beedrill']] as const) {
    await t.test(`${species[String(fromSpeciesId)].name} evolves at level 10`, () => {
      // A trained cocoon retains its pre-evolution attack; wild cocoons only know Harden.
      const player = createBattleCreature({ species, moves, speciesId: fromSpeciesId, level: 9, instanceId: `second-stage-${fromSpeciesId}`, moveIds: [fromSpeciesId === 11 ? 'tackle' : 'poison-sting', 'harden'] });
      const baseOpponent = createBattleCreature({ species, moves, speciesId: 10, level: 3, instanceId: `second-stage-opponent-${fromSpeciesId}` });
      const opponent = { ...baseOpponent, hp: 1, level: 7, experienceYield: 271, stats: { ...baseOpponent.stats, speed: 1 } };
      const initial = createBattleState({
        battleId: `vertical-slice-second-evolution-${fromSpeciesId}`,
        battleType: 'wild',
        seed: 0x51ce,
        rules,
        playerTeam: [player],
        opponentTeam: [opponent],
      });
      const transition = resolveBattleTurn(initial, {
        player: { kind: 'useMove', moveSlot: 0 },
        opponent: { kind: 'useMove', moveSlot: 0 },
      }, moves, rules);
      const evolved = transition.state.player.creatures[0];

      assert.equal(evolved.speciesId, toSpeciesId);
      assert.equal(evolved.name, expectedName);
      assert.equal(evolved.level, 10);
      assert.equal(evolved.instanceId, player.instanceId);
      assert.ok(transition.events.some(event => event.type === 'creatureEvolved' && event.fromSpeciesId === fromSpeciesId && event.toSpeciesId === toSpeciesId));
    });
  }
});
