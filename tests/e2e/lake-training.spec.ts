import {expect,test,type Page} from '@playwright/test';
import placements from '../../content/drafts/acquariva/training/placements.json' with {type:'json'};
import training from '../../content/drafts/acquariva/training/route-trainers.json' with {type:'json'};
import species from '../../content/battle/species.v1.json' with {type:'json'};
import moves from '../../content/battle/moves.v1.json' with {type:'json'};
import {createBattleCreature} from '../../src/core/battle/create-creature.ts';
import {enterGame} from './helpers/enter-game';
import {readBrowserSave,seedBrowserSave} from './helpers/world-navigation';
import {fightWithTouch} from './helpers/battle-touch';

test.use({deviceScaleFactor:1,reducedMotion:'reduce'});
const confirm=(page:Page)=>page.getByRole('button',{name:'Conferma e interagisci',exact:true});
async function challenge(page:Page){
  await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm(page).tap();
  for(let i=0;i<16&&!await page.getByRole('button',{name:'SFIDA',exact:true}).isVisible();i++)await confirm(page).tap();
  await expect(page.getByRole('button',{name:'SFIDA',exact:true})).toBeVisible();
}

for(const placement of placements.placements)test(`${placement.name} is optional, solid and rewards a touch victory only once`,async({page},info)=>{
  test.setTimeout(180_000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/src/main.ts*',async route=>{
    const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nglobalThis.__lakeTraining=game;'});
  });
  await page.goto('/');await enterGame(page);
  const trainer=training.trainers.find(trainer=>trainer.id===placement.trainerId)!;
  const save=await readBrowserSave(page);
  save.flags=[...new Set([...save.flags,'q_starter_selected','badge_marea_awarded','q_delta_report'])];
  const map=await import(`../../content/maps/${placement.map}.map.json`,{with:{type:'json'}});
  save.player={...save.player,mapId:map.default.id,spawnPointId:map.default.spawns[0].id,x:placement.x,y:placement.y+1,money:100};
  // Integration checkpoint; progression balance is audited separately.
  save.party=[
    createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:82,level:55,instanceId:'training-lead',moveIds:['thunder-shock','spark']}),
    createBattleCreature({species:species.species as any,moves:moves.moves as any,speciesId:195,level:55,instanceId:'training-reserve',moveIds:['mud-shot','water-gun']}),
  ].map(member=>({instanceId:member.instanceId,speciesId:member.speciesId,level:55,experience:0,hp:member.hp,maxHp:member.stats.maxHp,moves:member.moves.map(slot=>({id:slot.moveId,pp:slot.pp}))}));
  await seedBrowserSave(page,save);await page.reload();await enterGame(page);
  await challenge(page);
  expect((await readBrowserSave(page)).player).toMatchObject({x:placement.x,y:placement.y+1});
  await page.getByRole('button',{name:'NON ORA',exact:true}).tap();
  expect((await readBrowserSave(page)).flags).not.toContain(trainer.battleOnceFlag);
  await challenge(page);await page.getByRole('button',{name:'SFIDA',exact:true}).tap();
  await fightWithTouch(page,'__lakeTraining',{82:'Tuonoshock',195:'Colpodifango'});
  const banner=page.getByRole('dialog',{name:`Hai vinto contro ${trainer.name}!`});
  await expect(banner).toBeVisible();await expect(banner).toContainText(`+${trainer.rewardMoney} monete`);
  await page.screenshot({path:info.outputPath(`${placement.npcId}-victory.png`)});
  await banner.getByRole('button',{name:'Continua',exact:true}).tap();
  await expect.poll(async()=>(await readBrowserSave(page)).flags).toContain(trainer.battleOnceFlag);
  expect((await readBrowserSave(page)).player.money).toBe(100+trainer.rewardMoney);
  await page.reload();await enterGame(page);
  await page.getByRole('button',{name:'Vai in alto',exact:true}).tap();await confirm(page).tap();
  for(let i=0;i<16&&await page.locator('#dialogue-box').isVisible();i++)await confirm(page).tap();
  await expect(page.getByRole('button',{name:'SFIDA',exact:true})).toBeHidden();
  const resumed=await readBrowserSave(page);
  expect(resumed.player.money).toBe(100+trainer.rewardMoney);
  expect(resumed.flags.filter(flag=>flag===trainer.battleOnceFlag)).toHaveLength(1);
  expect(errors).toEqual([]);
});
