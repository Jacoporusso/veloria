import assert from 'node:assert/strict';
import test from 'node:test';
import { trainerPreparation, trainerChallengePrompt } from '../../src/game/battle/trainer-challenge.ts';

const trainer = { name: 'Mira', team: [{ level: 7 }, { level: 8 }] };
test('challenge preview derives opponent levels and useful preparation from actual teams', () => {
  const party = [{ level: 6, hp: 10, maxHp: 20 }];
  const before = structuredClone(party);
  const preparation = trainerPreparation(trainer, party);
  assert.equal(preparation.teamLabel, '2 Pokémon di livello 7–8');
  assert.match(preparation.advice.join(' '), /livello 6.*foglie.*compagno.*Centro Pokémon/);
  assert.match(trainerChallengePrompt(trainer, party), /Vuoi affrontare Mira\?$/);
  assert.deepEqual(party, before);
});
test('healthy parties at the opponent levels get no unnecessary preparation warning', () => {
  assert.deepEqual(trainerPreparation(trainer, [{ level: 8, hp: 20, maxHp: 20 }, { level: 7, hp: 20, maxHp: 20 }]).advice, []);
  assert.match(trainerPreparation({ name: 'Sera', team: [{ level: 3 }] }, [{ level: 5, hp: 20, maxHp: 20 }]).teamLabel, /livello 3$/);
});

test('full HP with an exhausted move still recommends the free Center service', () => {
  const advice = trainerPreparation(trainer, [{ level: 8, hp: 20, maxHp: 20, moves: [{ pp: 0 }] }, { level: 7, hp: 20, maxHp: 20 }]).advice;
  assert.equal(advice.length, 1);
  assert.match(advice[0], /HP e PP.*gratuitamente/);
});

test('no Potions prompts a supply reminder without hiding the challenge', () => {
  const party = [{ level: 8, hp: 20, maxHp: 20 }, { level: 7, hp: 20, maxHp: 20 }];
  assert.match(trainerChallengePrompt(trainer, party, {}), /Pozioni.*Vuoi affrontare Mira/);
  assert.equal(trainerPreparation(trainer, party, { potion: 2 }).advice.length, 0);
});
