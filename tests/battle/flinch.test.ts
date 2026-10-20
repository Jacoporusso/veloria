import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';
import { describeMoveEffects } from '../../src/game/battle/move-description.ts';
import { formatFlinched } from '../../src/game/battle/presentation.ts';

const attack: MoveDefinition={id:'impact',name:'Impatto',type:'normal',category:'physical',power:10,accuracy:100,alwaysHits:true,priority:0,maxPp:10,flinchChance:100};
const plain: MoveDefinition={...attack,id:'plain',name:'Colpo',flinchChance:undefined};
const moves={impact:attack,plain};
const actions={player:{kind:'useMove',moveSlot:0},opponent:{kind:'useMove',moveSlot:0}} as const;
const rules={...prototypeBattleRules,criticalChance:0,minimumDamageVariance:1,maximumDamageVariance:1,items:{potion:{healHp:20}},typeChart:{normal:{ghost:0}}};
function creature(id:string,speed:number,options:Partial<BattleCreature>={}):BattleCreature {
  return {instanceId:id,speciesId:90001,name:id,level:10,types:['normal'],stats:{maxHp:200,attack:20,defense:20,specialAttack:20,specialDefense:20,speed},hp:200,experience:0,experienceYield:0,moves:[{moveId:id==='player'?'impact':'plain',pp:10}],...options};
}
function battle(playerSpeed=100,opponentSpeed=10,opponent:Partial<BattleCreature>={},seed=42) {
  const state=createBattleState({battleId:'flinch-fixture',battleType:'trainer',seed,rules,playerTeam:[creature('player',playerSpeed)],opponentTeam:[creature('opponent',opponentSpeed,opponent),creature('reserve',20)]});
  // Confusion is deliberately cleared by battle creation; these cases model a
  // later turn in which a prior move has already confused the active creature.
  return opponent.confusionTurnsRemaining===undefined?state:{...state,opponent:{...state.opponent,creatures:state.opponent.creatures.map((target,index)=>index===0?{...target,confusionTurnsRemaining:opponent.confusionTurnsRemaining}:target)}};
}
function freeze<T>(value:T):T {
  if(value&&typeof value==='object') {Object.freeze(value);for(const child of Object.values(value))freeze(child);}
  return value;
}

test('fast connected flinch cancels only the pending move without PP or persistent status',()=>{
  const input=freeze(battle()),before=JSON.stringify(input);
  const result=resolveBattleTurn(input,actions,moves,rules);
  assert.equal(result.state.player.creatures[0].moves[0].pp,9);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp,10);
  assert.deepEqual(result.events.filter(event=>event.type==='flinched'),[{type:'flinched',side:'opponent',creatureId:'opponent'}]);
  assert.equal(result.events.filter(event=>event.type==='moveUsed').length,1);
  assert.equal(result.state.player.creatures[0].hp,200);
  assert.equal(result.state.opponent.creatures[0].status,undefined);
  assert.equal(JSON.stringify(input),before);
  assert.doesNotMatch(JSON.stringify(result.state), /"[^"\n]*flinch[^"\n]*":/i);
  const next=resolveBattleTurn(JSON.parse(JSON.stringify(result.state)),actions,{...moves,impact:{...attack,flinchChance:0}},rules);
  assert.equal(next.state.opponent.creatures[0].moves[0].pp,9);
  assert.equal(next.events.some(event=>event.type==='flinched'),false);
});

test('a slower flinch move cannot undo an action or consume a late secondary-effect roll',()=>{
  const input=battle(1,100);
  const result=resolveBattleTurn(input,actions,moves,rules);
  const noFlinch=resolveBattleTurn(input,actions,{...moves,impact:{...attack,flinchChance:0}},rules);
  assert.equal(result.events.filter(event=>event.type==='moveUsed').length,2);
  assert.equal(result.events.some(event=>event.type==='flinched'),false);
  assert.equal(result.state.rngState,noFlinch.state.rngState);
});

test('miss, type immunity, knockout and absent target never produce flinch',()=>{
  const scenarios=[
    {input:battle(),move:{...attack,alwaysHits:false,accuracy:0}},
    {input:battle(100,10,{types:['ghost']}),move:attack},
    {input:battle(100,10,{hp:1}),move:attack},
    {input:battle(1,100,{hp:1}),move:attack},
  ];
  for(const {input,move}of scenarios){
    const result=resolveBattleTurn(input,actions,{...moves,impact:move},rules);
    assert.equal(result.events.some(event=>event.type==='flinched'),false);
  }
  const absent=battle(1,100,{hp:1,moves:[{moveId:'plain',pp:0}]});
  const noTarget=resolveBattleTurn(absent,{player:actions.player,opponent:{kind:'struggle'}},moves,rules);
  assert.ok(noTarget.events.some(event=>event.type==='moveFailed'&&event.reason==='noTarget'));
  assert.ok(!noTarget.events.some(event=>event.type==='flinched'));
});

test('flinch does not replace major status or cancel end-of-turn poison',()=>{
  const input=battle(100,10,{status:{status:'poison'}});
  const result=resolveBattleTurn(input,actions,moves,rules);
  assert.deepEqual(result.state.opponent.creatures[0].status,{status:'poison'});
  assert.ok(result.events.some(event=>event.type==='flinched'));
  assert.ok(result.events.some(event=>event.type==='statusTick'&&event.status==='poison'&&event.damage));
});

test('sleep progresses before flinch, including waking without executing or spending PP',()=>{
  for(const turnsRemaining of [1,3]) {
    const input=freeze(battle(100,10,{status:{status:'sleep',turnsRemaining}}));
    const result=resolveBattleTurn(input,actions,moves,rules);
    const target=result.state.opponent.creatures[0];
    assert.deepEqual(target.status,turnsRemaining===1?undefined:{status:'sleep',turnsRemaining:2});
    assert.equal(target.moves[0].pp,10);
    assert.equal(result.state.rngState,3759983556,'sleep progress consumes no random draw');
    const sleep=result.events.findIndex(event=>event.type==='statusTick'&&event.status==='sleep');
    const flinch=result.events.findIndex(event=>event.type==='flinched');
    assert.ok(sleep>=0);
    if(turnsRemaining===1) assert.ok(flinch>sleep,'wake-up is retained before flinch blocks the move');
    else {assert.equal(flinch,-1);assert.ok(result.events.some(event=>event.type==='moveFailed'&&event.reason==='blockedByStatus'));}
    assert.equal(input.opponent.creatures[0].status?.turnsRemaining,turnsRemaining);
  }
});

test('freeze gets its seeded thaw check before flinch; failed thaw still advances the prototype counter',()=>{
  for(const [seed,thawed,expectedRng] of [[1,true,745495504],[42,false,1441438134]] as const) {
    const input=freeze(battle(100,10,{status:{status:'freeze',turnsRemaining:3}},seed));
    const result=resolveBattleTurn(input,actions,moves,rules);
    assert.deepEqual(result.state.opponent.creatures[0].status,thawed?undefined:{status:'freeze',turnsRemaining:2});
    assert.equal(result.state.opponent.creatures[0].moves[0].pp,10);
    assert.equal(result.state.rngState,expectedRng,'exactly one thaw roll follows the flinch secondary roll');
    const thaw=result.events.findIndex(event=>event.type==='statusTick'&&event.status==='freeze');
    assert.ok(thaw>=0);
    if(thawed) assert.ok(result.events.findIndex(event=>event.type==='flinched')>thaw);
    else assert.equal(result.events.some(event=>event.type==='flinched'),false);
    assert.equal(input.opponent.creatures[0].status?.turnsRemaining,3);
  }
});

test('flinch skips both confusion progress and paralysis roll without changing either condition',()=>{
  const input=freeze(battle(100,10,{status:{status:'paralysis'},confusionTurnsRemaining:3}));
  const result=resolveBattleTurn(input,actions,moves,rules);
  const target=result.state.opponent.creatures[0];
  assert.deepEqual(target.status,{status:'paralysis'});
  assert.equal(target.confusionTurnsRemaining,3);
  assert.equal(target.moves[0].pp,10);
  assert.equal(result.state.rngState,3759983556,'no confusion or paralysis random draw after flinch');
  assert.ok(!result.events.some(event=>event.type==='confusionTick'||event.type==='confusionSelfHit'||event.type==='statusTick'&&event.status==='paralysis'));
});

test('confusion self-hit precedes paralysis and suppresses its random roll',()=>{
  const input=freeze(battle(100,10,{status:{status:'paralysis'},confusionTurnsRemaining:2},12345));
  const result=resolveBattleTurn(input,actions,{...moves,impact:{...attack,flinchChance:0}},rules);
  assert.ok(result.events.some(event=>event.type==='confusionSelfHit'));
  assert.equal(result.state.opponent.creatures[0].confusionTurnsRemaining,1);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp,10);
  assert.equal(result.state.rngState,3283620450,'confusion roll then self-hit variance; no paralysis roll');
  assert.ok(!result.events.some(event=>event.type==='statusTick'&&event.status==='paralysis'));
});

test('paralysis rolls only after confusion permits acting, preserving PP when it blocks',()=>{
  const input=freeze(battle(100,10,{status:{status:'paralysis'},confusionTurnsRemaining:2},1));
  const result=resolveBattleTurn(input,actions,{...moves,impact:{...attack,flinchChance:0}},rules);
  const confusion=result.events.findIndex(event=>event.type==='confusionTick');
  const paralysis=result.events.findIndex(event=>event.type==='statusTick'&&event.status==='paralysis');
  assert.ok(confusion>=0&&paralysis>confusion);
  assert.equal(result.state.opponent.creatures[0].confusionTurnsRemaining,1);
  assert.equal(result.state.opponent.creatures[0].moves[0].pp,10);
  assert.equal(result.state.rngState,745495504,'confusion then paralysis each consume one roll');
  assert.ok(!result.events.some(event=>event.type==='confusionSelfHit'));
});

test('switch and items execute normally even before or after an unusually high-priority hit',()=>{
  for(const priority of [0,7]) for(const command of [{kind:'switch',partyIndex:1},{kind:'useItem',itemId:'potion',targetIndex:0}] as const){
    const input=battle(100,10,{hp:150});
    const result=resolveBattleTurn(input,{player:actions.player,opponent:command},{...moves,impact:{...attack,priority}},rules);
    assert.ok(result.events.some(event=>event.type===(command.kind==='switch'?'creatureSwitched':'itemUsed')));
    assert.equal(result.events.some(event=>event.type==='flinched'),false);
    assert.equal(result.state.opponent.creatures[0].moves[0].pp,10);
    assert.equal(result.state.opponent.creatures[1].moves[0].pp,10);
  }
});

test('flinch uses action priority as well as speed and can prevent emergency struggle',()=>{
  const priority=resolveBattleTurn(battle(1,100),actions,{...moves,impact:{...attack,priority:1}},rules);
  assert.ok(priority.events.some(event=>event.type==='flinched'));
  const input=battle(100,10,{moves:[{moveId:'plain',pp:0}]});
  const result=resolveBattleTurn(input,{player:actions.player,opponent:{kind:'struggle'}},moves,rules);
  assert.ok(result.events.some(event=>event.type==='flinched'));
  assert.ok(!result.events.some(event=>event.type==='recoilApplied'));
});

test('seeded chance replay is stable and includes both successful and unsuccessful secondary rolls',()=>{
  const catalog={...moves,impact:{...attack,flinchChance:20}};
  let flinched=0;
  for(let seed=1;seed<=100;seed++){
    const input=freeze(battle(100,10,{},seed));
    const first=resolveBattleTurn(input,actions,catalog,rules);
    assert.equal(JSON.stringify(first),JSON.stringify(resolveBattleTurn(JSON.parse(JSON.stringify(input)),actions,catalog,rules)));
    if(first.events.some(event=>event.type==='flinched'))flinched++;
  }
  assert.ok(flinched>0&&flinched<100);
});

test('invalid flinch percentages fail explicitly and descriptions state chance and timing',()=>{
  for(const flinchChance of [-1,101,NaN,Infinity]) assert.throws(()=>resolveBattleTurn(battle(),actions,{...moves,impact:{...attack,flinchChance}},rules),/Invalid move data/);
  const description=describeMoveEffects({...attack,flinchChance:20}).join(' ');
  assert.match(description,/20%/);
  assert.match(description,/prima che agisca/);
  assert.match(description,/senza consumare PP/);
  assert.match(formatFlinched('Dragonair'),/Dragonair ha tentennato/);
});
