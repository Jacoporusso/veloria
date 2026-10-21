import progression from '../../content/battle/progression.v2.json' with {type:'json'};
import test from 'node:test';
import assert from 'node:assert/strict';
import speciesData from '../../content/battle/species.v1.json' with {type:'json'};
import moveData from '../../content/battle/moves.v1.json' with {type:'json'};
import learningData from '../../content/battle/level-up-moves.v1.json' with {type:'json'};
import {createBattleCreature, createBattleCreatureFromSave, type SpeciesBattleRegistry, type BattleMoveRegistry} from '../../src/core/battle/create-creature.ts';
import {createBattleState,resolveBattleTurn} from '../../src/core/battle/engine.ts';
import {prototypeBattleRules, type ExperienceCurve} from '../../src/core/battle/rules.ts';
import {experienceToNextLevel} from '../../src/core/battle/progression.ts';
const species=speciesData.species as SpeciesBattleRegistry, moves=moveData.moves as BattleMoveRegistry;
const growthCurves: Readonly<Record<string, ExperienceCurve>> = progression.growthCurves;
const rules={...prototypeBattleRules,experienceCurves:growthCurves,criticalChance:0,levelUpMoves:Object.fromEntries(Object.entries(learningData.species).map(([id,entries])=>[id,entries.map(entry=>({...entry,maxPp:moves[entry.moveId].maxPp}))]))};
function award(speciesId:number, targetLevel:number, mode:'normal'|'known'|'full'='normal') {
  const base=createBattleCreature({species,moves,speciesId,level:5,instanceId:'own'});
  let experience=0;
  for(let n=base.level;n<targetLevel;n++) experience+=experienceToNextLevel(n,rules.experienceCurves[base.growthCurveId]);
  const entry=rules.levelUpMoves[speciesId].find(item=>item.level===targetLevel);
  const slots=mode==='full' ? ['scratch','growl','tackle','gust'].map(moveId=>({moveId,pp:3})) : mode==='known' && entry ? [...base.moves,{moveId:entry.moveId,pp:2}] : base.moves;
  const player={...base,experience:0,stats:{...base.stats,speed:100},moves:slots};
  const enemy={...createBattleCreature({species,moves,speciesId:19,level:2,instanceId:'foe'}),hp:1,level: 7, experienceYield:experience};
  const state=createBattleState({battleId:'learn',battleType:'wild',seed:321,rules,playerTeam:[player],opponentTeam:[enemy]});
  const before=structuredClone(state);
  const result=resolveBattleTurn(state,{player:{kind:'useMove',moveSlot:0},opponent:{kind:'useMove',moveSlot:0}},moves,rules);
  assert.deepEqual(state,before);
  return result;
}
test('canonical starter moves arrive at their HGSS levels with full PP and an event',()=>{
  for(const [id,moveId,level] of [[1,'vine-whip',9],[4,'ember',7],[7,'bubble',7],[25,'thunder-wave',10]] as const) {
    const result=award(id,level), creature=result.state.player.creatures[0], entry=rules.levelUpMoves[id].find(item=>item.moveId===moveId);
    assert.equal(creature.level,level);
    assert.deepEqual(creature.moves.at(-1),{moveId,pp:moves[moveId].maxPp});
    assert.equal(result.events.filter(event=>event.type==='moveLearned'&&event.moveId===moveId).length,1);
    const saved={instanceId:creature.instanceId,speciesId:id,level,experience:creature.experience,hp:creature.hp,maxHp:creature.stats.maxHp,moves:creature.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))};
    assert.deepEqual(createBattleCreatureFromSave(saved,{species,moves}).moves,creature.moves);
    assert.ok(entry);
  }
});

test('Pikachu reaches Quick Attack at level thirteen after Thunder Wave fills its fourth slot', () => {
  const result = award(25, 13);
  assert.equal(result.state.player.creatures[0].moves.length, 4);
  assert.ok(result.state.player.creatures[0].moves.some(slot => slot.moveId === 'thunder-wave'));
  assert.ok(result.events.some(event => event.type === 'moveLearningSkipped' && event.moveId === 'quick-attack' && event.reason === 'fullMoveSlots'));
});
test('a move already known keeps its PP and is not duplicated',()=>{
  const result=award(4,7,'known');
  assert.equal(result.state.player.creatures[0].moves.filter(slot=>slot.moveId==='ember').length,1);
  assert.equal(result.state.player.creatures[0].moves.find(slot=>slot.moveId==='ember')?.pp,2);
  assert.equal(result.events.some(event=>event.type==='moveLearned'),false);
});
test('a full move set is preserved and each newly reached move is explicitly skipped',()=>{
  const result=award(4,19,'full');
  assert.equal(result.state.player.creatures[0].moves.length,4);
  assert.equal(result.state.player.creatures[0].moves.some(slot=>slot.moveId==='ember'),false);
  assert.ok(result.events.some(event=>event.type==='moveLearningSkipped'&&event.reason==='fullMoveSlots'));
});
test('one award processes multiple canonical levels and replays deterministically',()=>{
  const first=award(4,30);
  const learned=first.events.filter(event=>event.type==='moveLearned');
  assert.ok(first.state.player.creatures[0].level>=30);
  assert.deepEqual(learned.map(event=>event.moveId),['ember','smokescreen']);
  assert.deepEqual(award(4,30),first);
});

test('Butterfree learns its three level-12 powders in source order', () => {
  const result = award(12, 12);
  assert.deepEqual(result.events.filter(event => event.type === 'moveLearned').map(event => event.moveId), ['poison-powder', 'stun-spore', 'sleep-powder']);
  assert.deepEqual(result.state.player.creatures[0].moves.map(slot => slot.moveId), ['confusion', 'poison-powder', 'stun-spore', 'sleep-powder']);
});

test('a later level does not offer a forgotten move from an earlier level again',()=>{
  const player=createBattleCreature({species,moves,speciesId:4,level:10,instanceId:'forgotten-smokescreen',moveIds:['ember'],
    experience:experienceToNextLevel(10,growthCurves[species[4].growthCurveId!])-1});
  const enemy={...createBattleCreature({species,moves,speciesId:19,level:7,instanceId:'one-xp'}),hp:1,experienceYield:1};
  const state=createBattleState({battleId:'no-relearning',battleType:'wild',seed:321,rules,playerTeam:[player],opponentTeam:[enemy]});
  const result=resolveBattleTurn(state,{player:{kind:'useMove',moveSlot:0},opponent:{kind:'useMove',moveSlot:0}},moves,rules);
  assert.equal(result.state.player.creatures[0].level,11);
  assert.deepEqual(result.state.player.creatures[0].moves.map(slot=>slot.moveId),['ember']);
  assert.equal(result.events.some(event=>event.type==='moveLearned'||event.type==='moveLearningSkipped'),false);
});
