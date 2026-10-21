import {expect,type Page} from '@playwright/test';
import {enterGame} from './enter-game';
import {readBrowserSave,seedBrowserSave,walkTo} from './world-navigation';
import {tapBattleLabel} from './battle-touch';
import {createBattleCreature} from '../../../src/core/battle/create-creature.ts';
import {estimateMoveDamage} from '../../../src/core/battle/damage.ts';
import {prototypeBattleRules} from '../../../src/core/battle/rules.ts';
import species from '../../../content/battle/species.v1.json' with {type:'json'};
import moves from '../../../content/battle/moves.v1.json' with {type:'json'};
import chart from '../../../content/battle/type-chart.v1.json' with {type:'json'};
import sequence from '../../../content/challenges/veloria_league.sequence.json' with {type:'json'};
export {sequence};
export const confirm=(p:Page)=>p.getByRole('button',{name:'Conferma e interagisci',exact:true});
export async function finishDialogue(p:Page){for(let i=0;i<24&&await p.locator('#dialogue-box').isVisible();i++)await confirm(p).tap();await expect(p.locator('#dialogue-box')).toBeHidden();}
export async function seedLeague(p:Page,weak=false,missingBadge=false){
 await p.route('**/src/main.ts*',async route=>{const response=await route.fetch({ maxRetries: 2 });await route.fulfill({response,body:await response.text()+'\n globalThis.leagueGame=game;'});});await p.goto('/');await enterGame(p);const save=await readBrowserSave(p);save.flags=[...new Set([...save.flags,'q_starter_selected','q_resonance_restored','q_league_orientation','q_league_visited','prologue_complete_seen'])];save.badges=sequence.requiredBadgeIds.slice(missingBadge?1:0);save.player={...save.player,mapId:'veloria/league_forecourt',spawnPointId:'league_checkpoint',x:20,y:8,money:1000};save.rngState=12345;save.inventory['hyper-potion']=20;
 const members=weak?[[4,5,['growl']]]:[[6,100,['flamethrower','wing-attack','dragon-rage']],[181,100,['discharge','thunder-punch','thunder-shock']],[87,100,['ice-beam','aurora-beam','aqua-tail','ice-shard']],[195,100,['mud-bomb','water-gun','slam']],[20,100,['crunch','quick-attack','tackle']],[3,100,['vine-whip','leech-seed','sleep-powder']]];
 save.party=members.map(([id,level,ids],i)=>{const c=createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:id as number,level:level as number,instanceId:'league-fixture-'+i,moveIds:ids as string[]});return{instanceId:c.instanceId,speciesId:c.speciesId,level:c.level,experience:0,hp:weak?1:c.hp,maxHp:c.stats.maxHp,moves:c.moves.map(m=>({id:m.moveId,pp:m.pp}))};});await seedBrowserSave(p,save);await p.reload();await enterGame(p);return save;
}
export async function portal(p:Page){await walkTo(p,'league_forecourt.tmj',20,6);await p.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm(p).tap();}
export async function startAttempt(p:Page){await portal(p);await p.getByRole('button',{name:'INIZIA IL TENTATIVO',exact:true}).tap();await expect.poll(async()=>(await readBrowserSave(p)).player.mapId).toBe(sequence.stages[0].mapId);await expect(p.locator('#game-loading')).toBeHidden();}
export async function challengeOpponent(p:Page,index:number){const stage=sequence.stages[index];await walkTo(p,stage.mapId.split('/')[1]+'.tmj',16,8);await p.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm(p).tap();await p.getByRole('button',{name:'SFIDA',exact:true}).tap();}
/** Uses actual touch targets. A strong fixture picks legal damaging moves with PP and a useful matchup. */
export async function finishLeagueBattle(p:Page,win=true){
 for(let turn=0;turn<70;turn++){
  await expect.poll(async()=>{const mode=await p.evaluate(()=>{const s=(window as any).leagueGame.scene.keys.battle;return s?.sys.isActive()&&s.state&&s.ui?s.terminalShown?'terminal':s.mode:'loading';});if(mode==='learning')await tapBattleLabel(p,'leagueGame','Tieni le mosse');return['menu','party','terminal'].includes(mode);},{timeout:30_000}).toBe(true);
  const data=await p.evaluate(()=>{const s=(window as any).leagueGame.scene.keys.battle;return{terminal:s.terminalShown,mode:s.mode,state:s.state};});const state=data.state;
  if(data.terminal){expect(state.outcome.kind).toBe('won');expect(state.outcome.winner).toBe(win?'player':'opponent');return;}
  const user=state.player.creatures[state.player.activeIndex],target=state.opponent.creatures[state.opponent.activeIndex];
  if(data.mode==='party'){const next=state.player.creatures.find((c:any,i:number)=>c.hp>0&&i!==state.player.activeIndex);expect(next).toBeTruthy();await tapBattleLabel(p,'leagueGame',`${next.name} · ${next.hp}/`);continue;}
  let chosen:string|undefined;
  if(!win)chosen='Ruggito';else{const candidates=user.moves.filter((slot:any)=>slot.pp>0).map((slot:any)=>{const m=(moves.moves as any)[slot.moveId],r=estimateMoveDamage(user,target,m,{...prototypeBattleRules,typeChart:chart.chart as any});return{name:m.name,score:r?(r.minimum+r.maximum)/2*m.accuracy/100:-1};}).sort((a:any,b:any)=>b.score-a.score);chosen=candidates[0]?.name;}
  expect(chosen).toBeTruthy();await tapBattleLabel(p,'leagueGame','LOTTA');await tapBattleLabel(p,'leagueGame',chosen!);
 }
 throw new Error('League battle exceeded70touchchoices');
}
export async function closeVictory(p:Page,name:string){const banner=p.getByRole('dialog',{name:'Hai vinto contro '+name+'!'});await expect(banner).toBeVisible();await banner.getByRole('button',{name:'Continua',exact:true}).tap();}
