import test from 'node:test';
import assert from 'node:assert/strict';
import { settleChallengeSave } from '../../src/game/battle/challenge-settlement.ts';
import { prepareChallengeBattle, startChallengeSequence, type ChallengeSequence } from '../../src/core/world/challenge-sequence.ts';
import { newGameSave } from '../../src/persistence/save-store.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const sequence:ChallengeSequence={id:'fixture',version:1,name:'Sfida',requiredFlags:[],requiredBadgeIds:[],activeFlag:'fixture_active',pendingBattleFlag:'fixture_pending',completedFlag:'q_fixture_completed',completionEvent:'fixture/won',memberMapIds:['veloria/arena'],checkpoint:{mapId:'veloria/courtyard',spawnId:'recovery'},servicePolicy:{healing:'forbidden',storage:'forbidden',battleItems:'allowed'},stages:['first','last'].map(id=>({id,trainerId:'veloria/trainer_'+id,mapId:'veloria/arena',spawnId:id,attemptWonFlag:'fixture_won_'+id,firstRewardFlag:'fixture_paid_'+id,battleOnceFlag:'trainer_'+id+'_defeated'}))};
const quest={id:'fixture',steps:[{trigger:'fixture/won',setFlag:'q_fixture_completed',requiresFlags:['fixture_won_first','fixture_won_last']}],completionFlag:'q_fixture_completed',reward:{money:100,items:{'hyper-potion':2}}};
function pending(save:GameSave,id:string){return {...save,flags:prepareChallengeBattle(sequence,save,id).flags};}
function start(save:GameSave){return {...save,flags:startChallengeSequence(sequence,save,true).flags};}

test('settlement pays each trainer once and applies final quest before cleaning attempt flags',()=>{
  let save=start(newGameSave());const initialMoney=save.player.money;
  const first=settleChallengeSave(pending(save,'first'),sequence,'first','won',37,[quest]);
  save=JSON.parse(JSON.stringify(first.save));
  assert.equal(save.player.money,initialMoney+37);
  assert.ok(save.flags.includes('fixture_paid_first'));
  const duplicate=settleChallengeSave(save,sequence,'first','won',37,[quest]);
  assert.deepEqual(duplicate.save,save);
  assert.equal(duplicate.earnedMoney,0);
  const failure=settleChallengeSave(pending(save,'last'),sequence,'last','lost',50,[quest]);
  assert.equal(failure.save.player.money,initialMoney+37);
  assert.deepEqual(failure.result.checkpoint,sequence.checkpoint);
  save=start(failure.save);
  save=settleChallengeSave(pending(save,'first'),sequence,'first','won',37,[quest]).save;
  assert.equal(save.player.money,initialMoney+37,'repeat trainer cannot pay twice');
  const final=settleChallengeSave(pending(save,'last'),sequence,'last','won',50,[quest]);
  assert.equal(final.save.player.money,initialMoney+37+50+100);
  assert.equal(final.save.inventory['hyper-potion'],2);
  assert.ok(final.newCompletion);
  assert.deepEqual(final.completedQuestIds,['fixture']);
  assert.ok(final.save.flags.includes(sequence.completedFlag));
  assert.ok(sequence.stages.every(stage=>!final.save.flags.includes(stage.attemptWonFlag)&&!final.save.flags.includes(stage.battleOnceFlag!)));
  assert.ok(!final.save.flags.includes(sequence.activeFlag));
});

test('loss preserves already merged resources and never heals or refunds the caller',()=>{
  const base=start(newGameSave()),save=pending({...base,player:{...base.player,money:4321},party:[{instanceId:'partner',speciesId:25,level:25,experience:123,hp:0,maxHp:80,moves:[{id:'thunder-shock',pp:1}]}],inventory:{potion:1},rngState:987},'first');
  const before=JSON.stringify(save);
  const result=settleChallengeSave(save,sequence,'first','draw',100,[quest]);
  assert.equal(JSON.stringify(save),before);
  assert.deepEqual(result.save.party,save.party);
  assert.deepEqual(result.save.inventory,save.inventory);
  assert.equal(result.save.player.money,4321);
  assert.equal(result.save.rngState,987);
  assert.ok(!result.save.flags.includes('fixture_paid_first'));
});

test('missing completion quest fails before returning a partial reward snapshot',()=>{
  let save=start(newGameSave());
  save=settleChallengeSave(pending(save,'first'),sequence,'first','won',10,[quest]).save;
  save=pending(save,'last');const before=JSON.stringify(save);
  assert.throws(()=>settleChallengeSave(save,sequence,'last','won',10,[]),/completion quest/);
  assert.equal(JSON.stringify(save),before);
});
