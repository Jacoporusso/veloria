import {expect,type Page} from '@playwright/test';

/** Inspect presentation state; every battle command still goes through a real touch target. */
export async function tapBattleLabel(page:Page,gameKey:string,prefix:string){
  let point:{x:number;y:number}|null=null;
  // The world marks the battle active before Phaser has finished creating its UI.
  // Wait for the requested target itself instead of treating the body class as readiness.
  await expect.poll(async()=>{
    point=await page.evaluate(({gameKey,prefix})=>{
      const scene=(window as any)[gameKey]?.scene?.keys?.battle;
      if(!scene?.sys?.isActive()||!scene.ui?.list)return null;
      const label=scene.ui.list.find((item:any)=>item.type==='Text'&&item.active&&item.visible&&item.text.startsWith(prefix));
      if(!label)return null;
      const b=label.getBounds(),c=scene.game.canvas.getBoundingClientRect();
      if(b.width<=0||b.height<=0||c.width<=0||c.height<=0)return null;
      return{x:c.x+b.centerX*scene.scale.zoom,y:c.y+b.centerY*scene.scale.zoom};
    },{gameKey,prefix});
    return point!==null;
  },{timeout:15_000,intervals:[50,100,250],message:`Active battle exposes the touch target: ${prefix}`}).toBe(true);
  await page.touchscreen.tap(point!.x,point!.y);
}

export async function fightWithTouch(page:Page,gameKey:string,moveLabels:Record<number,string>,maxTurns=45){
  for(let turn=0;turn<maxTurns;turn++){
    await expect.poll(async()=>{
      const mode=await page.evaluate(gameKey=>{
        const s=(window as any)[gameKey].scene.keys.battle;
        return !s?.sys.isActive()||!s.ui||!s.state?'loading':s.terminalShown?'terminal':s.mode;
      },gameKey);
      if(mode==='learning')await tapBattleLabel(page,gameKey,'Tieni le mosse');
      return mode==='menu'||mode==='party'||mode==='terminal';
    },{timeout:25_000}).toBe(true);
    const ready=await page.evaluate(gameKey=>{
      const s=(window as any)[gameKey].scene.keys.battle,team=s.state.player;
      const replacement=team.creatures.find((member:any,index:number)=>member.hp>0&&index!==team.activeIndex);
      return{mode:s.mode,terminal:s.terminalShown,active:team.creatures[team.activeIndex].speciesId,
        replacement:replacement?`${replacement.name} · ${replacement.hp}/`:null};
    },gameKey);
    if(ready.terminal)return;
    if(ready.mode==='party'){
      expect(ready.replacement).not.toBeNull();await tapBattleLabel(page,gameKey,ready.replacement!);continue;
    }
    expect(moveLabels[ready.active],`Move choice for species ${ready.active}`).toBeTruthy();
    await tapBattleLabel(page,gameKey,'LOTTA');await tapBattleLabel(page,gameKey,moveLabels[ready.active]);
  }
  throw new Error(`Battle did not finish in ${maxTurns} touch choices`);
}
