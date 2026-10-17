import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// The harness exposes only an observation handle. All actions below use DOM/touch/keyboard.
async function observe(page: Page): Promise<any> {
  return page.evaluate(() => {
    const game = (window as any).__naturalGame;
    const world = game?.scene.keys.world;
    if (!world?.playerTile || !world.map?.metadata || !world.renderedMap) return null;
    const battle = game.scene.isActive('battle') ? game.scene.keys.battle : undefined;
    return { mapId: world.map.metadata.id, x: world.playerTile.x, y: world.playerTile.y,
      moving: world.moving, loading: world.mapTransitionLoading, save: world.save,
      battle: battle ? { mode: battle.mode, turn: battle.state.turn, outcome: battle.state.outcome,
        id: battle.state.battleId, events: battle.eventLog, type: battle.state.battleType, player: battle.state.player, opponent: battle.state.opponent,
        inventory: battle.remainingInventory, moves: battle.moveCatalog } : null };
  });
}
const directions = [[0,-1,'Vai in alto'],[1,0,'Vai a destra'],[0,1,'Vai in basso'],[-1,0,'Vai a sinistra']] as const;

test('fresh trainer completes the prologue through real game controls', async ({ page }, testInfo) => {
  const report: any[] = [];
  const starter = process.env.PLAYTEST_STARTER ?? 'Charmander';
  const observedBattles = new Set<string>();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\nglobalThis.__naturalGame = game;' });
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Nuova partita',exact:true}).click();
  await page.getByRole('textbox',{name:'Nome allenatore'}).fill('Aurora');
  await page.getByRole('button',{name:'Inizia il viaggio'}).click();
  await expect.poll(async () => Boolean(await observe(page))).toBe(true);
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30000 });

  async function record(label: string) {
    const state = await observe(page);
    const row = { label, mapId: state.mapId, x:state.x,y:state.y,
      party: state.save.party, badges: state.save.badges, flags: state.save.flags, inventory:state.save.inventory };
    report.push(row); console.log(label, JSON.stringify(row));
  }
  async function fight() {
    for (let action=0; action<600; action++) {
      const state=await observe(page), battle=state.battle;
      if(!battle) return;
      if (battle.outcome.kind !== 'ongoing' && !observedBattles.has(battle.id)) {
        observedBattles.add(battle.id);
        report.push({ label: 'Battle result', id: battle.id, turn: battle.turn, outcome: battle.outcome, player: battle.player, opponent: battle.opponent, events: battle.events });
      }
      if(battle.mode==='message'||battle.mode==='party') {
        await page.keyboard.press('Enter',{delay:40}); continue;
      }
      if(battle.mode!=='menu') throw Error('Unexpected battle mode: '+battle.mode);
      const own=battle.player.creatures[battle.player.activeIndex];
      const target=battle.opponent.creatures[battle.opponent.activeIndex];
      if(battle.type==='wild' && state.save.party.length===1 && target.hp/target.stats.maxHp<=0.55 && battle.inventory?.['poke-ball']>0) {
        await page.keyboard.press('ArrowDown',{delay:40});
        await page.keyboard.press('ArrowRight',{delay:40});
        await page.keyboard.press('Enter',{delay:40});
      } else if(own.hp/own.stats.maxHp<0.5 && battle.inventory?.potion>0) {
        await page.keyboard.press('ArrowDown',{delay:40});
        await page.keyboard.press('Enter',{delay:40});
      } else {
        await page.keyboard.press('Enter',{delay:40});
        // Choose the strongest visible power/type option; no pending opponent command is consulted.
        const slots = own.moves.map((slot: any, index: number) => ({ index, pp: slot.pp, move: battle.moves[slot.moveId] }));
        const preferred = slots.filter((slot: any) => slot.pp > 0 && slot.move?.power > 0)
          .sort((a: any, b: any) => b.move.power * (own.types.includes(b.move.type) ? 1.5 : 1) - a.move.power * (own.types.includes(a.move.type) ? 1.5 : 1))[0];
        if (preferred) {
          const enabled = slots.filter((slot: any) => slot.pp > 0);
          const first = enabled[0].index;
          if (Math.floor(preferred.index / 2) > Math.floor(first / 2)) await page.keyboard.press('ArrowDown',{delay:40});
          if (preferred.index % 2 > first % 2) await page.keyboard.press('ArrowRight',{delay:40});
        }
      }
      await page.keyboard.press('Enter',{delay:40});
    }
    throw Error('Battle exceeded 600 UI actions');
  }
  async function settle() {
    for(let attempt=0;attempt<30;attempt++) {
      const state=await observe(page);
      if(state.battle) { await fight(); continue; }
      if(state.moving||state.loading) { await expect.poll(async()=>{const s=await observe(page);return !s.moving&&!s.loading}).toBe(true);continue; }
      if(await page.locator('#starter-choices').isVisible()) return;
      if(await page.locator('#dialogue-box').isVisible()) {
        await page.getByRole('button',{name:'Conferma e interagisci'}).tap();continue;
      }
      return;
    }
    throw Error('Dialogue did not finish');
  }
  async function walk(tx:number,ty:number) {
    await settle();
    const geometry=await page.evaluate(()=>{
      const w=(window as any).__naturalGame.scene.keys.world;
      return {width:w.renderedMap.width,height:w.renderedMap.height,blocked:[...w.occupied],
        exits:w.renderedMap.triggers.filter((t:any)=>t.kind==='map-exit').map((t:any)=>({x:t.x/32,y:t.y/32,w:t.width/32,h:t.height/32}))};
    });
    const start=await observe(page), blocked=new Set(geometry.blocked);
    for(const exit of geometry.exits) for(let y=exit.y;y<exit.y+exit.h;y++)for(let x=exit.x;x<exit.x+exit.w;x++)if(x!==tx||y!==ty)blocked.add(x+','+y);
    const q:Array<{x:number;y:number;path:string[]}>=[{x:start.x,y:start.y,path:[]}],seen=new Set([start.x+','+start.y]);
    let path:string[]|undefined;
    for(let cursor=0;cursor<q.length;cursor++) {
      const n=q[cursor];if(n.x===tx&&n.y===ty){path=n.path;break;}
      for(const[dx,dy,label]of directions){const x=n.x+dx,y=n.y+dy,key=x+','+y;if(x<0||y<0||x>=geometry.width||y>=geometry.height||blocked.has(key)||seen.has(key))continue;seen.add(key);q.push({x,y,path:[...n.path,label]});}
    }
    if(!path)throw Error('No route in '+start.mapId+' to '+tx+','+ty);
    for(const label of path) {
      const before=await observe(page);
      await page.getByRole('button',{name:label,exact:true}).tap();
      await expect.poll(async()=>{const s=await observe(page);return s.mapId+'|'+s.x+','+s.y}).not.toBe(before.mapId+'|'+before.x+','+before.y);
      await settle();
      if((await observe(page)).mapId!==start.mapId)break;
    }
  }
  async function interact(x:number,y:number) {
    // Approach from below so facing is set by a real final movement, not by state mutation.
    await walk(x,y+2);await walk(x,y+1);
    await page.getByRole('button',{name:'Conferma e interagisci'}).tap();
    await settle();
  }
  async function challenge(x:number,y:number,label:string) {
    await interact(x,y);
    await page.getByRole('button',{name:'SFIDA',exact:true}).click();
    await expect.poll(async()=>Boolean((await observe(page)).battle)).toBe(true);
    await settle();await record(label);
  }
  try {
    await settle();
    await walk(20,30);
    await interact(12,7);
    await expect(page.getByRole('button',{name:starter,exact:true})).toBeVisible();
    await page.getByRole('button',{name:starter,exact:true}).click();
    const starterIds: Record<string,number> = {Charmander:4,Bulbasaur:1,Squirtle:7,Pikachu:25};
    await expect.poll(async()=>(await observe(page)).save.party[0]?.speciesId).toBe(starterIds[starter]);
    await settle();await interact(12,7);
    await expect.poll(async()=>(await observe(page)).save.flags).toContain('q_research_sample_received');
    await walk(11,14);await walk(23,7);await record('R01 reached naturally');
    await challenge(7,9,'Sera battle completed');
    await interact(15,9);
    await challenge(18,12,'Timo battle completed');
    // Walk in actual grass to attempt one natural encounter/capture; keep the real seed and probabilities.
    await walk(8,7);
    for(let step=0;step<100&&(await observe(page)).save.party.length===1;step++)await walk(8,step%2===0?6:7);
    expect((await observe(page)).save.party.length, 'A real wild capture must succeed before the gym').toBeGreaterThan(1);
    await record('Natural grass encounters');
    await walk(29,8);await interact(17,10);await interact(13,10);
    await expect.poll(async()=>(await observe(page)).save.flags).toContain('q_ada_helped');
    await walk(29,10);await walk(27,9);await record('Brumalta reached naturally');
    await interact(6,6);await page.getByRole('button',{name:'RIPOSA',exact:true}).click();await settle();
    await walk(28,7);
    await walk(13,14);await walk(8,10);await walk(18,6);
    await challenge(14,2,'Mira battle completed');
    const end=await observe(page);
    expect(end.save.flags).toContain('badge_aurora_awarded');
    expect(end.save.badges).toContain('badge_aurora');
    await expect(page.getByRole('button',{name:'Continua a esplorare'})).toBeVisible();
    await page.screenshot({path:testInfo.outputPath('natural-first-medal.png')});
    const originalId = end.save.party[0].instanceId;
    const victoryParty = end.save.party;
    await page.getByRole('button',{name:'Continua a esplorare'}).click();
    await page.getByRole('button',{name:'Apri menu di gioco'}).click();
    await page.getByRole('button',{name:'Salva e torna al titolo'}).click();
    await page.getByRole('button',{name:'Continua partita'}).click();
    await expect.poll(async()=>Boolean(await observe(page))).toBe(true);
    await expect.poll(async()=>(await observe(page)).save.flags).toContain('badge_aurora_awarded');
    expect((await observe(page)).save.party[0].instanceId).toBe(originalId);
    expect((await observe(page)).save.party).toEqual(victoryParty);
    expect((await observe(page)).save.badges).toContain('badge_aurora');
    expect(errors).toEqual([]);
  } finally {
    await record('Final observed state');
    const path = testInfo.outputPath('natural-prologue-report.json');
    await writeFile(path, JSON.stringify({starter,report,errors},null,2));
    await testInfo.attach('natural-prologue-report',{path,contentType:'application/json'});
  }
});
