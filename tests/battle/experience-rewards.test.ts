import assert from 'node:assert/strict';
import test from 'node:test';
import {experienceForDefeat,prototypeBattleRules} from '../../src/core/battle/rules.ts';

test('experience scales with defeated level and applies the trainer bonus after base rounding',()=>{
  const rules=prototypeBattleRules.experienceRewards;
  assert.equal(experienceForDefeat(64,7,false,rules),64);
  assert.equal(experienceForDefeat(64,28,false,rules),256);
  assert.equal(experienceForDefeat(64,28,true,rules),384);
  assert.equal(experienceForDefeat(17,5,false,rules),12);
  assert.equal(experienceForDefeat(17,5,true,rules),18);
  assert.equal(experienceForDefeat(1,1,false,rules),1);
  assert.equal(experienceForDefeat(0,50,true,rules),0);
});

test('invalid experience parameters fail instead of poisoning progression',()=>{
  const rules=prototypeBattleRules.experienceRewards;
  for(const [yieldValue,level] of [[-1,7],[NaN,7],[64,0],[64,1.5]])assert.throws(()=>experienceForDefeat(yieldValue,level,false,rules));
  assert.throws(()=>experienceForDefeat(64,7,false,{...rules,levelDivisor:0}));
});
