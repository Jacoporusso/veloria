import test from 'node:test';
import assert from 'node:assert/strict';
import speciesData from '../../content/battle/species.v1.json' with {type:'json'};
import moveData from '../../content/battle/moves.v1.json' with {type:'json'};
import learningData from '../../content/battle/level-up-moves.v1.json' with {type:'json'};
import {createBattleCreature, createBattleCreatureFromSave, type SpeciesBattleRegistry, type BattleMoveRegistry} from '../../src/core/battle/create-creature.ts';
import {createBattleState,resolveBattleTurn} from '../../src/core/battle/engine.ts';
import {prototypeBattleRules} from '../../src/core/battle/rules.ts';
const species=speciesData.species as SpeciesBattleRegistry, moves=moveData.moves as BattleMoveRegistry;
const rules={...prototypeBattleRules,criticalChance:0,levelUpMoves:Object.fromEntries(Object.entries(learningData.species).map(([id,entries])=>[id,entries.map(entry=>({...entry,maxPp:moves[entry.moveId].maxPp}))]))};
function level(speciesId:number, full=false, known=false, reward=2) {
  const base=createBattleCreature({species,moves,speciesId,level:5,instanceId:'own'});
  const learned=rules.levelUpMoves[speciesId][0];
  const slots=full ? ['scratch','growl','tackle','gust'].map(moveId=>({moveId,pp:3})) : known ? [...base.moves,{moveId:learned.moveId,pp:2}] : base.moves;
  const player={...base,experience:90,stats:{...base.stats,speed:100},moves:slots};
  const enemy={...createBattleCreature({species,moves,speciesId:19,level:2,instanceId:'foe'}),hp:1,experienceYield:reward};
  const state=createBattleState({battleId:'learn',battleType:'wild',seed:321,rules,playerTeam:[player],opponentTeam:[enemy]});
  const before=structuredClone(state);
  const result=resolveBattleTurn(state,{player:{kind:'useMove',moveSlot:0},opponent:{kind:'useMove',moveSlot:0}},moves,rules);
  assert.deepEqual(state,before);
  return result;
}
test('each real starter learns its curated level-six move with full PP and an event',()=>{
  for(const id of [1,4,7,25]) {
    const result=level(id), creature=result.state.player.creatures[0], entry=rules.levelUpMoves[id][0];
    assert.equal(creature.level,6);
    assert.deepEqual(creature.moves.at(-1),{moveId:entry.moveId,pp:entry.maxPp});
    assert.equal(result.events.filter(event=>event.type==='moveLearned'&&event.moveId===entry.moveId).length,1);
    const saved={instanceId:creature.instanceId,speciesId:id,level:6,experience:creature.experience,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))};
    assert.deepEqual(createBattleCreatureFromSave(saved,{species,moves}).moves,creature.moves);
  }
});
test('known moves keep their PP and are not duplicated',()=>{
  const result=level(4,false,true);
  assert.equal(result.state.player.creatures[0].moves.filter(slot=>slot.moveId==='ember').length,1);
  assert.equal(result.state.player.creatures[0].moves.find(slot=>slot.moveId==='ember')?.pp,2);
  assert.equal(result.events.some(event=>event.type==='moveLearned'),false);
});
test('a full move set is preserved and the skipped learning is explicit',()=>{
  const result=level(4,true);
  assert.equal(result.state.player.creatures[0].moves.length,4);
  assert.equal(result.state.player.creatures[0].moves.some(slot=>slot.moveId==='ember'),false);
  assert.ok(result.events.some(event=>event.type==='moveLearningSkipped'&&event.reason==='fullMoveSlots'));
});

test('several levels in one award learn each move once and replay deterministically',()=>{
  const first=level(4,false,false,1000);
  assert.ok(first.state.player.creatures[0].level>6);
  assert.equal(first.events.filter(event=>event.type==='moveLearned'&&event.moveId==='ember').length,1);
  assert.equal(first.state.player.creatures[0].moves.filter(slot=>slot.moveId==='ember').length,1);
  assert.deepEqual(level(4,false,false,1000),first);
});
