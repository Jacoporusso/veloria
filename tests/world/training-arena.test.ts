import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import moveData from '../../content/battle/moves.v1.json' with { type: 'json' };
import policyData from '../../content/battle/opponent-policies.v1.json' with { type: 'json' };
import type { SpeciesBattleRegistry, BattleMoveRegistry } from '../../src/core/battle/create-creature.ts';
import {
  beginTrainingAttempt,
  createTrainingTrainer,
  recoverTrainingAttempts,
  settleTrainingAttempt,
  TRAINING_TIERS,
  getTrainingSpeciesMinimumLevel,
} from '../../src/core/world/training-arena.ts';

const species = speciesData.species as SpeciesBattleRegistry;
const moves = moveData.moves as BattleMoveRegistry;

test('training tiers expose the selected levels, rewards, and three-member format', () => {
  assert.deepEqual(TRAINING_TIERS, [
    { level: 30, rewardMoney: 500, teamSize: 3 },
    { level: 40, rewardMoney: 800, teamSize: 3 },
    { level: 50, rewardMoney: 1200, teamSize: 3 },
    { level: 60, rewardMoney: 1800, teamSize: 3 },
    { level: 70, rewardMoney: 2500, teamSize: 3 },
    { level: 80, rewardMoney: 3200, teamSize: 3 },
  ]);
});

test('training teams are deterministic, diverse, legal, and have usable attacks', () => {
  const first = createTrainingTrainer({ level: 50, rngState: 123456, attemptId: 'try_1', species, moves });
  const repeated = createTrainingTrainer({ level: 50, rngState: 123456, attemptId: 'try_1', species, moves });
  assert.deepEqual(first, repeated);
  assert.equal(first.trainer.team.length, 3);
  assert.equal(new Set(first.trainer.team.map(member => member.speciesId)).size, 3);
  assert.notEqual(first.nextRngState, 123456);
  for (const member of first.trainer.team) {
    assert.equal(member.level, 50);
    assert.ok(![144, 145, 146, 150, 151].includes(member.speciesId));
    assert.ok(member.moveIds.length >= 1 && member.moveIds.length <= 4);
    assert.equal(new Set(member.moveIds).size, member.moveIds.length);
    const legal = new Set(species[String(member.speciesId)]!.officialLearnset!
      .filter(entry => entry.level <= member.level && moves[entry.moveId])
      .map(entry => entry.moveId));
    for (const moveId of member.moveIds) assert.ok(legal.has(moveId), `${member.speciesId} cannot learn ${moveId} by ${member.level}`);
    assert.ok(member.moveIds.some(id => {
      const move = moves[id]!;
      return move.category !== 'status' && move.power > 0;
    }));
  }
  assert.equal(first.trainer.rewardMoney, 1200);
  assert.equal(first.trainer.team[0].level, 50);
  assert.ok(policyData.profiles[first.trainer.aiProfileId as keyof typeof policyData.profiles]);
});

test('seed changes vary the generated teams', () => {
  const teams = new Set(Array.from({ length: 12 }, (_, index) =>
    createTrainingTrainer({ level: 40, rngState: index + 10, attemptId: `seed_${index}`, species, moves })
      .trainer.team.map(member => member.speciesId).join(',')));
  assert.ok(teams.size > 1);
});

test('all tiers draw only species obtainable by that level across many seeds', () => {
  assert.equal(getTrainingSpeciesMinimumLevel(3), 32);
  assert.equal(getTrainingSpeciesMinimumLevel(6), 36);
  assert.equal(getTrainingSpeciesMinimumLevel(112), 42);
  assert.equal(getTrainingSpeciesMinimumLevel(149), 55);
  for (const tier of TRAINING_TIERS) {
    for (let seed = 1; seed <= 100; seed++) {
      const result = createTrainingTrainer({
        level: tier.level,
        rngState: seed * 7919,
        attemptId: `tier_${tier.level}_seed_${seed}`,
        species,
        moves,
      });
      for (const member of result.trainer.team) {
        assert.ok(
          getTrainingSpeciesMinimumLevel(member.speciesId) <= tier.level,
          `species ${member.speciesId} (minimum ${getTrainingSpeciesMinimumLevel(member.speciesId)}) appeared at tier ${tier.level}`,
        );
      }
    }
  }
});

test('trainer creation rejects invalid inputs and does not mutate registries', () => {
  const beforeSpecies = structuredClone(species);
  const beforeMoves = structuredClone(moves);
  for (const args of [
    { level: 20, rngState: 1, attemptId: 'valid' },
    { level: 30, rngState: -1, attemptId: 'valid' },
    { level: 30, rngState: 1, attemptId: 'bad id' },
  ]) {
    assert.throws(() => createTrainingTrainer({ ...args, species, moves } as Parameters<typeof createTrainingTrainer>[0]));
  }
  assert.deepEqual(species, beforeSpecies);
  assert.deepEqual(moves, beforeMoves);
});

test('attempt receipts preserve story flags, reject duplicate starts, and pay a win once', () => {
  const original = ['story_flag_done', 'trainer_old_defeated', 'training_attempt_paid_legacy'];
  const pending = beginTrainingAttempt(original, 'one');
  assert.deepEqual(pending, ['story_flag_done', 'trainer_old_defeated', 'training_attempt_pending_one']);
  assert.throws(() => beginTrainingAttempt(pending, 'two'), /already pending/);
  const won = settleTrainingAttempt({ flags: pending, money: 50, attemptId: 'one', rewardMoney: 500, outcome: 'won' });
  assert.equal(won.accepted, true);
  assert.equal(won.money, 550);
  assert.equal(won.earnedMoney, 500);
  assert.ok(won.flags.includes('story_flag_done'));
  assert.ok(won.flags.includes('training_attempt_paid_one'));
  assert.throws(() => beginTrainingAttempt(won.flags, 'one'), /already paid/);
  const replay = settleTrainingAttempt({ flags: won.flags, money: won.money, attemptId: 'one', rewardMoney: 500, outcome: 'won' });
  assert.equal(replay.accepted, false);
  assert.equal(replay.money, 550);
  assert.equal(replay.earnedMoney, 0);
  assert.deepEqual(replay.flags, won.flags);
});

test('losses and draws clear the matching pending attempt without rewards', () => {
  for (const outcome of ['lost', 'draw'] as const) {
    const flags = beginTrainingAttempt(['chapter_complete'], `attempt_${outcome}`);
    const result = settleTrainingAttempt({ flags, money: 20, attemptId: `attempt_${outcome}`, rewardMoney: 800, outcome });
    assert.equal(result.accepted, true);
    assert.equal(result.money, 20);
    assert.equal(result.earnedMoney, 0);
    assert.deepEqual(result.flags, ['chapter_complete']);
  }
});

test('recovery clears pending attempts but retains paid receipts', () => {
  const recovered = recoverTrainingAttempts([
    'story_done',
    'training_attempt_pending_crashed',
    'training_attempt_paid_complete',
  ]);
  assert.deepEqual(recovered, ['story_done', 'training_attempt_paid_complete']);
  const rejected = settleTrainingAttempt({ flags: recovered, money: 100, attemptId: 'crashed', rewardMoney: 500, outcome: 'won' });
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.money, 100);
});

test('old or missing receipts cannot settle; invalid money and overflow throw', () => {
  const pending = beginTrainingAttempt([], 'new');
  assert.equal(settleTrainingAttempt({ flags: pending, money: 10, attemptId: 'old', rewardMoney: 1, outcome: 'won' }).accepted, false);
  assert.throws(() => settleTrainingAttempt({ flags: pending, money: -1, attemptId: 'new', rewardMoney: 1, outcome: 'won' }));
  assert.throws(() => settleTrainingAttempt({ flags: pending, money: Number.MAX_SAFE_INTEGER, attemptId: 'new', rewardMoney: 1, outcome: 'won' }), /safe integer/);
  assert.throws(() => settleTrainingAttempt({ flags: pending, money: 0, attemptId: 'new', rewardMoney: Number.MAX_SAFE_INTEGER + 1, outcome: 'won' }));
});

test('receipt flags stay bounded across hundreds of resolved attempts', () => {
  let flags = ['story_flag'];
  let money = 0;
  for (let index = 0; index < 300; index++) {
    const id = `round_${index}`;
    flags = beginTrainingAttempt(flags, id);
    const result = settleTrainingAttempt({ flags, money, attemptId: id, rewardMoney: 1, outcome: 'won' });
    flags = result.flags;
    money = result.money;
  }
  assert.equal(flags.filter(flag => flag.startsWith('training_attempt_pending_')).length, 0);
  assert.equal(flags.filter(flag => flag.startsWith('training_attempt_paid_')).length, 1);
  assert.ok(flags.includes('story_flag'));
  assert.equal(money, 300);
});
