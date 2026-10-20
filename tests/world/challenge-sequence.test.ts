import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChallengeSequence, challengeSequenceState, startChallengeSequence, prepareChallengeBattle, settleChallengeBattle, abortChallengeSequence, recoverChallengeSequence, challengeServiceAllowed, type ChallengeSequence, type ChallengeTraveler } from '../../src/core/world/challenge-sequence.ts';

const sequence:ChallengeSequence={
  id:'league',name:'Lega',version:1,requiredFlags:['q_resonance_restored'],
  requiredBadgeIds:['badge_aurora','badge_corolla','badge_circuito','badge_acciaio','badge_marea','badge_riflesso','badge_brina','badge_armonia'],
  activeFlag:'challenge_league_active',pendingBattleFlag:'challenge_league_pending',completedFlag:'q_league_completed',completionEvent:'challenge/league/completed',
  memberMapIds:['veloria/league_hall'],checkpoint:{mapId:'veloria/league_forecourt',spawnId:'recovery'},
  servicePolicy:{healing:'forbidden',storage:'forbidden',battleItems:'allowed'},
  stages:Array.from({length:5},(_,index)=>({id:'stage'+(index+1),trainerId:'veloria/trainer_council_'+(index+1),mapId:'veloria/league_hall',spawnId:'stage_'+(index+1),attemptWonFlag:'challenge_league_won_'+(index+1),firstRewardFlag:'challenge_league_paid_'+(index+1),battleOnceFlag:'trainer_league_'+(index+1)+'_defeated'})),
};
const ready=():ChallengeTraveler=>({flags:['q_resonance_restored','foreign-flag/kept'],badges:[...sequence.requiredBadgeIds]});
const freeze=<T>(input:T):T=>{if(input&&typeof input==='object'){Object.freeze(input);for(const value of Object.values(input))freeze(value);}return input;};
function started(){const traveler=ready();return {...traveler,flags:startChallengeSequence(sequence,traveler,true).flags};}
function win(traveler:ChallengeTraveler,stageId:string){const pending=prepareChallengeBattle(sequence,traveler,stageId);assert.equal(pending.accepted,true);return settleChallengeBattle(sequence,{...traveler,flags:pending.flags},stageId,'won');}

test('five ordered victories emit completion only once and quest completion cleans only attempt flags',()=>{
  let traveler=started();
  for(const [index,stage]of sequence.stages.entries()){
    const before=freeze(traveler),serialized=JSON.stringify(before);
    const result=win(before,stage.id);
    assert.equal(JSON.stringify(before),serialized);
    assert.equal(result.rewardStageId,stage.id);
    assert.equal(result.event,index===4?sequence.completionEvent:null);
    assert.equal(result.state.status,index===4?'awaitingCompletion':'active');
    assert.equal(result.nextStageId,index===4?null:sequence.stages[index+1].id);
    traveler=JSON.parse(JSON.stringify({...traveler,flags:result.flags}));
    const duplicate=settleChallengeBattle(sequence,traveler,stage.id,'won');
    assert.equal(duplicate.accepted,false);
    assert.equal(duplicate.event,null);
    assert.equal(duplicate.rewardStageId,null);
    assert.deepEqual(duplicate.flags,traveler.flags);
  }
  assert.ok(!traveler.flags.includes(sequence.completedFlag),'quest engine owns the permanent completion flag');
  traveler={...traveler,flags:[...traveler.flags,sequence.completedFlag]};
  const cleanup=recoverChallengeSequence(sequence,traveler);
  assert.equal(cleanup.state.status,'completed');
  assert.equal(cleanup.checkpoint,null);
  assert.ok(cleanup.flags.includes('foreign-flag/kept'));
  assert.ok(sequence.stages.every(stage=>cleanup.flags.includes(stage.firstRewardFlag)));
  assert.ok(!cleanup.flags.includes(sequence.activeFlag));
  assert.equal(startChallengeSequence(sequence,{...traveler,flags:cleanup.flags},true).accepted,false);
});

test('all eight badges and restoration are required; ready starts need a conscious party',()=>{
  validateChallengeSequence(sequence);
  assert.equal(startChallengeSequence(sequence,{...ready(),flags:[]},true).reason,'requirements');
  for(const badge of sequence.requiredBadgeIds)assert.equal(startChallengeSequence(sequence,{...ready(),badges:ready().badges.filter(value=>value!==badge)},true).reason,'requirements');
  assert.equal(startChallengeSequence(sequence,ready(),false).reason,'noConsciousParty');
  assert.equal(prepareChallengeBattle(sequence,ready(),'stage1').accepted,false);
  assert.equal(startChallengeSequence(sequence,started(),true).accepted,false);
});

test('out-of-order encounters and callbacks cannot advance or reward the wrong stage',()=>{
  const traveler=started();
  assert.equal(prepareChallengeBattle(sequence,traveler,'stage2').reason,'wrongStage');
  const pending={...traveler,flags:prepareChallengeBattle(sequence,traveler,'stage1').flags};
  assert.equal(prepareChallengeBattle(sequence,pending,'stage1').accepted,false);
  const wrong=settleChallengeBattle(sequence,pending,'stage2','won');
  assert.equal(wrong.reason,'wrongStage');
  assert.deepEqual(wrong.flags,pending.flags);
  assert.equal(wrong.rewardStageId,null);
  assert.equal(settleChallengeBattle(sequence,traveler,'stage1','won').reason,'notPending');
});

test('loss and draw at each of the five stages reset attempt and preserve permanent rewards',()=>{
  for(let failed=0;failed<5;failed++)for(const outcome of ['lost','draw'] as const){
    let traveler=started();
    for(let index=0;index<failed;index++)traveler={...traveler,flags:win(traveler,sequence.stages[index].id).flags};
    const pending={...traveler,flags:prepareChallengeBattle(sequence,traveler,sequence.stages[failed].id).flags};
    const aborted=settleChallengeBattle(sequence,freeze(pending),sequence.stages[failed].id,outcome);
    assert.equal(aborted.state.status,'ready');
    assert.deepEqual(aborted.checkpoint,sequence.checkpoint);
    assert.ok(aborted.flags.includes('foreign-flag/kept'));
    for(const [index,stage]of sequence.stages.entries()){
      assert.ok(!aborted.flags.includes(stage.attemptWonFlag));
      assert.ok(!aborted.flags.includes(stage.battleOnceFlag!));
      assert.equal(aborted.flags.includes(stage.firstRewardFlag),index<failed);
    }
    traveler={...traveler,flags:startChallengeSequence(sequence,{...traveler,flags:aborted.flags},true).flags};
    for(let index=0;index<=failed;index++){
      const result=win(traveler,sequence.stages[index].id);
      assert.equal(result.rewardStageId,index<failed?null:sequence.stages[index].id);
      traveler={...traveler,flags:result.flags};
    }
  }
});

test('cancel, reload pending and invalid progress recover to checkpoint without touching caller resources',()=>{
  const base=started(),won={...base,flags:win(base,'stage1').flags};
  assert.deepEqual(recoverChallengeSequence(sequence,JSON.parse(JSON.stringify(won))).flags,won.flags,'reload between battles resumes');
  const pending={...won,flags:prepareChallengeBattle(sequence,won,'stage2').flags};
  for(const input of [won,pending,{...base,flags:[...base.flags,sequence.stages[3].attemptWonFlag,sequence.stages[3].battleOnceFlag!]}]){
    const caller=freeze({...input,party:[{hp:0,pp:1,experience:123}],inventory:{potion:2},money:500,rngState:987});
    const before=JSON.stringify(caller);
    const cancelled=input===won?abortChallengeSequence(sequence,caller):recoverChallengeSequence(sequence,caller);
    assert.deepEqual(cancelled.checkpoint,sequence.checkpoint);
    assert.equal(cancelled.state.status,'ready');
    assert.equal(JSON.stringify(caller),before);
    if(input.flags.includes(sequence.stages[0].firstRewardFlag))assert.ok(cancelled.flags.includes(sequence.stages[0].firstRewardFlag));
  }
  assert.equal(recoverChallengeSequence(sequence,ready()).changed,false);
});

test('incomplete final settlement is interrupted on recovery, never fabricated into a completion event',()=>{
  let traveler=started();
  for(const stage of sequence.stages)traveler={...traveler,flags:win(traveler,stage.id).flags};
  const recovered=recoverChallengeSequence(sequence,traveler);
  assert.equal(recovered.event,null);
  assert.equal(recovered.state.status,'ready');
  assert.ok(!recovered.flags.includes(sequence.completedFlag));
  assert.ok(sequence.stages.every(stage=>recovered.flags.includes(stage.firstRewardFlag)));
});

test('invalid identities, endpoints, duplicate stages and conflicting flag ownership fail closed',()=>{
  const invalid=[
    (copy:ChallengeSequence)=>{copy.id='bad_id';},
    (copy:ChallengeSequence)=>{copy.checkpoint.mapId=copy.memberMapIds[0];},
    (copy:ChallengeSequence)=>{copy.stages[0].mapId='veloria/elsewhere';},
    (copy:ChallengeSequence)=>{copy.stages[1].id=copy.stages[0].id;},
    (copy:ChallengeSequence)=>{copy.stages[1].trainerId=copy.stages[0].trainerId;},
    (copy:ChallengeSequence)=>{copy.stages[0].firstRewardFlag=copy.activeFlag;},
    (copy:ChallengeSequence)=>{copy.requiredFlags=[copy.pendingBattleFlag];},
    (copy:ChallengeSequence)=>{copy.stages=[];},
    (copy:ChallengeSequence)=>{copy.checkpoint.spawnId='broken//spawn';},
  ];
  for(const mutate of invalid){const copy=structuredClone(sequence);mutate(copy);assert.throws(()=>validateChallengeSequence(copy),/Invalid|Duplicate/);}
  assert.throws(()=>challengeSequenceState(sequence,{...ready(),flags:['duplicate','duplicate']}),/Invalid.*traveler/);
});

test('service policy denies healing and storage during the attempt but permits battle items',()=>{
  const active=started();
  for(const traveler of [active,{...active,flags:prepareChallengeBattle(sequence,active,'stage1').flags}]){
    assert.equal(challengeServiceAllowed(sequence,traveler,'healing'),false);
    assert.equal(challengeServiceAllowed(sequence,traveler,'storage'),false);
    assert.equal(challengeServiceAllowed(sequence,traveler,'battleItems'),true);
  }
  assert.equal(challengeServiceAllowed(sequence,ready(),'healing'),true);
  assert.equal(challengeServiceAllowed(sequence,ready(),'storage'),true);
});

test('the engine also supports a one-stage challenge without a legacy trainer lock',()=>{
  const single={...sequence,stages:[{...sequence.stages[0],battleOnceFlag:undefined}]};
  let traveler=ready();
  traveler={...traveler,flags:startChallengeSequence(single,traveler,true).flags};
  traveler={...traveler,flags:prepareChallengeBattle(single,traveler,'stage1').flags};
  const victory=settleChallengeBattle(single,traveler,'stage1','won');
  assert.equal(victory.event,single.completionEvent);
  assert.equal(victory.state.status,'awaitingCompletion');
  assert.equal(challengeServiceAllowed(single,{...traveler,flags:victory.flags},'healing'),false);
  assert.equal(challengeSequenceState(single,{...traveler,flags:[...victory.flags,single.completedFlag]}).status,'completed');
});
