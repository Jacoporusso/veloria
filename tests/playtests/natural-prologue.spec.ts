import { buyFromShop } from '../e2e/helpers/shop';
import { runCentralePortolume } from './helpers/centrale-portolume';
import { tapBattleLabel } from '../e2e/helpers/battle-touch';
import { expect, test, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

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
        id: battle.state.battleId, rulesetId: battle.state.rulesetId, events: battle.eventLog, type: battle.state.battleType, player: battle.state.player, opponent: battle.state.opponent,
        inventory: battle.remainingInventory, moves: battle.moveCatalog,
        forecasts: Object.fromEntries(battle.state.player.creatures[battle.state.player.activeIndex].moves.map((slot: any) => [slot.moveId, battle.moveForecast(battle.moveCatalog[slot.moveId])])) } : null };
  });
}
const directions = [[0,-1,'Vai in alto'],[1,0,'Vai a destra'],[0,1,'Vai in basso'],[-1,0,'Vai a sinistra']] as const;

test('natural journey uses earned progress and real game controls', async ({ page }, testInfo) => {
  const report: any[] = [];
  const starter = process.env.PLAYTEST_STARTER ?? 'Charmander';
  const prepareGym = process.env.PLAYTEST_PREPARE_GYM !== '0';
  const resumePortolumeFile = process.env.PLAYTEST_RESUME_PORTOLUME_BACKUP;
  const resumeRheaFile = process.env.PLAYTEST_RESUME_RHEA_BACKUP;
  const resumeBackupFile = resumePortolumeFile ?? resumeRheaFile;
  expect(Boolean(resumePortolumeFile && resumeRheaFile), 'Choose one earned checkpoint').toBe(false);
  const damageFirst = process.env.PLAYTEST_DAMAGE_FIRST === '1';
  const continueFerraluce = process.env.PLAYTEST_CONTINUE_FERRALUCE === '1' || Boolean(resumeRheaFile);
  const continueVetracielo = process.env.PLAYTEST_CONTINUE_VETRACIELO === '1' || continueFerraluce;
  const continuePetalora = process.env.PLAYTEST_CONTINUE_PETALORA === '1' || continueVetracielo;
  const continueRadicelmo = process.env.PLAYTEST_CONTINUE_RADICELMO === '1' || continuePetalora;
  if (continuePetalora) test.setTimeout(continueFerraluce ? 2_700_000 : continueVetracielo ? 1_800_000 : 1_200_000);
  const gym = JSON.parse(await readFile(new URL('../../content/trainers/gym01_mira.trainer.json', import.meta.url), 'utf8'));
  const preparationLevel = Math.max(...gym.team.map((member: { level: number }) => member.level));
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
  let startingRngState = (await observe(page)).save.rngState;

  async function record(label: string) {
    const state = await observe(page);
    if (!state) { report.push({ label, worldUnavailable: true }); return; }
    const row = { label, contentVersion: state.save.contentVersion, mapId: state.mapId, x:state.x,y:state.y,
      party: state.save.party, badges: state.save.badges, flags: state.save.flags, inventory:state.save.inventory, money:state.save.player.money };
    report.push(row); console.log(label, JSON.stringify(row));
  }
  async function exportCheckpoint(filename: string) {
    await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
    await page.getByRole('button', { name: 'Apri importazione ed esportazione salvataggio' }).click();
    const [backup] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Esporta backup JSON' }).click()]);
    const path = testInfo.outputPath(filename);
    await backup.saveAs(path);
    await testInfo.attach(filename, { path, contentType: 'application/json' });
  }
  async function fight() {
    for (let action=0; action<600; action++) {
      await expect(page.locator('#game')).not.toHaveAttribute('aria-busy', 'true');
      const state=await observe(page), battle=state.battle;
      if(!battle) return;
      if (battle.outcome.kind !== 'ongoing' && !observedBattles.has(battle.id)) {
        observedBattles.add(battle.id);
        report.push({ label: 'Battle result', id: battle.id, rulesetId: battle.rulesetId, turn: battle.turn, outcome: battle.outcome, player: battle.player, opponent: battle.opponent, events: battle.events });
      }
      const celebration = page.locator('.battle-celebration, .evolution-celebration');
      if (await celebration.isVisible()) {
        const next = celebration.getByRole('button', { name: 'Continua', exact: true });
        await expect(next).toBeVisible({timeout:15_000}); await next.click(); continue;
      }
      if (battle.mode === 'learning') { await tapBattleLabel(page, '__naturalGame', 'Tieni le mosse'); continue; }
      if(battle.mode==='message'||battle.mode==='party') {
        await page.keyboard.press('Enter',{delay:40}); continue;
      }
      if(battle.mode!=='menu' && battle.mode!=='moves') throw Error('Unexpected battle mode: '+battle.mode);
      const own=battle.player.creatures[battle.player.activeIndex];
      const target=battle.opponent.creatures[battle.opponent.activeIndex];
      const upgradeCompanion = prepareGym && state.mapId === 'veloria/r02_viale_fronde' && target.level >= 5
        && state.save.party.length < 3 && state.save.party.slice(1).every((member: any) => member.level < 5);
      if(battle.type==='wild' && (state.save.party.length===1 || upgradeCompanion) && target.hp/target.stats.maxHp<=0.55 && battle.inventory?.['poke-ball']>0) {
        await tapBattleLabel(page, '__naturalGame', 'CATTURA');
        await page.keyboard.press('Enter',{delay:40});
      } else if(own.hp/own.stats.maxHp<0.5 && battle.inventory?.potion>0) {
        await tapBattleLabel(page, '__naturalGame', 'BORSA');
        await page.keyboard.press('Enter',{delay:40});
      } else {
        await tapBattleLabel(page, '__naturalGame', 'LOTTA');
        // Use visible setup effects once, then damage. Never inspect the pending opponent command.
        const slots = own.moves.map((slot: any, index: number) => ({ index, pp: slot.pp, move: battle.moves[slot.moveId] }));
        const displayedScore = (slot: any) => {
          const forecast = battle.forecasts[slot.move.id];
          return forecast ? (forecast.minimum + forecast.maximum) / 2 * forecast.accuracy / 100 : 0;
        };
        const damageOption = slots.filter((slot: any) => slot.pp > 0 && slot.move?.power > 0)
          .sort((a: any, b: any) => displayedScore(b) - displayedScore(a))[0];
        const usefulSetup = !damageFirst && prepareGym && battle.type === 'trainer' && own.hp > own.stats.maxHp / 2 && target.hp > target.stats.maxHp / 2
          ? slots.find((slot: any) => slot.pp > 0 && slot.move?.leechSeedFraction && !target.leechSeed && !target.types.includes('grass'))
            ?? slots.find((slot: any) => slot.pp > 0 && slot.move?.category === 'status'
              && slot.move.statChanges?.some((effect: any) => effect.target === 'opponent' && effect.stat === 'attack' && effect.stages < 0)
              && (target.statStages?.attack ?? 0) === 0)
            ?? slots.find((slot: any) => slot.pp > 0 && slot.move?.category === 'status' && damageOption?.move.category === 'physical'
              && slot.move.statChanges?.some((effect: any) => effect.target === 'opponent' && effect.stat === 'defense' && effect.stages < 0)
              && (target.statStages?.defense ?? 0) >= 0)
          : undefined;
        const preferred = usefulSetup ?? damageOption;
        if (preferred) await tapBattleLabel(page, '__naturalGame', preferred.move.name);
        else await page.keyboard.press('Enter',{delay:40}); // The normal emergency move when PP are exhausted.
      }
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
      await expect(page.locator('#game')).not.toHaveAttribute('aria-busy', 'true');
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
    if (resumeBackupFile) {
      const backup = JSON.parse(await readFile(resumeBackupFile, 'utf8'));
      expect(backup.save.player.mapId).toBe('veloria/gym04_ferraluce');
      expect(backup.save.flags).toContain('gym04_magnetic_aligned');
      if (resumePortolumeFile) expect(backup.save.flags).toContain('badge_acciaio_awarded');
      else expect(backup.save.flags).not.toContain('badge_acciaio_awarded');
      await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
      await page.getByRole('button', { name: 'Apri importazione ed esportazione salvataggio' }).click();
      page.once('dialog', dialog => dialog.accept());
      await Promise.all([page.waitForEvent('load'), page.locator('#save-file').setInputFiles(resumeBackupFile)]);
      await page.getByRole('button', { name: 'Continua partita', exact: true }).click();
      await expect.poll(async () => Boolean(await observe(page))).toBe(true);
      await expect.poll(async () => (await observe(page)).mapId).toBe(backup.save.player.mapId);
      expect((await observe(page)).save.party).toEqual(backup.save.party);
      expect((await observe(page)).save.inventory).toEqual(backup.save.inventory);
      expect((await observe(page)).save.player.money).toBe(backup.save.player.money);
      expect((await observe(page)).save.rngState).toBe(backup.save.rngState);
      startingRngState = backup.save.rngState;
      await record(resumePortolumeFile ? 'Resumed unchanged earned fourth medal checkpoint' : 'Resumed unchanged earned Rhea checkpoint');
    }
    if (!resumeBackupFile) {
      await walk(21,25);
      await interact(12,7);
      await expect(page.getByRole('button',{name:starter,exact:true})).toBeVisible();
      await page.getByRole('button',{name:starter,exact:true}).click();
      const starterIds: Record<string,number> = {Charmander:4,Bulbasaur:1,Squirtle:7,Pikachu:25};
      await expect.poll(async()=>(await observe(page)).save.party[0]?.speciesId).toBe(starterIds[starter]);
      await settle();await interact(12,7);
      await expect.poll(async()=>(await observe(page)).save.flags).toContain('q_research_sample_received');
      await walk(11,14);await walk(22,0);await record('R01 reached naturally');
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
      if (prepareGym && (await observe(page)).save.party[0].level < preparationLevel) {
        await walk(0,12); // Return to the Viale delle Fronde through the real city exit.
        await walk(6,7);
        for (let step=0;step<160&&(await observe(page)).save.party[0].level<preparationLevel;step++) {
          await walk(6,step%2===0?6:7);
          if ((await observe(page)).save.party[0].hp === 0) {
            await walk(27,9);
            await interact(6,6);await page.getByRole('button',{name:'RIPOSA',exact:true}).click();await settle();
            await walk(0,12);await walk(6,7);
          }
        }
        expect((await observe(page)).save.party[0].level, 'Preparation uses real wild encounters, not injected XP').toBeGreaterThanOrEqual(preparationLevel);
        await record('Natural preparation in R02');
        await walk(27,9);
        await interact(6,6);await page.getByRole('button',{name:'RIPOSA',exact:true}).click();await settle();
      }
      if (prepareGym) {
        for (let purchase=0;purchase<2;purchase++) {
          const current = (await observe(page)).save;
          if ((current.inventory.potion ?? 0) >= 2 || current.player.money < 200) break;
          await interact(6,19);
          await buyFromShop(page, 'Pozione');await settle();
        }
        await record('Supplies purchased before Mira');
      }
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
      if (continueRadicelmo) {
        await walk(13,19); // Leave the gym through the actual southern doorway.
        await interact(6,6);await page.getByRole('button',{name:'RIPOSA',exact:true}).click();await settle();
        await walk(35,12);
        expect((await observe(page)).mapId).toBe('veloria/r03_terrazze_muschio');
        await interact(16,10);
        expect((await observe(page)).save.inventory['ancient-seed']).toBe(1);
        await record('Ancient seed collected naturally after Mira');
        await walk(31,6);
        expect((await observe(page)).mapId).toBe('veloria/radicelmo');
        const beforeDelivery = (await observe(page)).save;
        await interact(25,11);
        const archived = (await observe(page)).save;
        expect(archived.flags).toContain('q_radicelmo_seed_archived');
        expect(archived.inventory['ancient-seed'] ?? 0).toBe(0);
        expect(archived.inventory['archive-note']).toBe(1);
        expect(archived.inventory.potion).toBe((beforeDelivery.inventory.potion ?? 0) + 2);
        expect(archived.player.money).toBe(beforeDelivery.player.money + 120);
        await record('Radicelmo archive completed naturally');
        await page.screenshot({path:testInfo.outputPath('natural-radicelmo-archive.png')});
        await page.getByRole('button',{name:'Apri menu di gioco'}).click();
        await page.getByRole('button',{name:'Salva e torna al titolo'}).click();
        await page.getByRole('button',{name:'Continua partita'}).click();
        await expect.poll(async()=>Boolean(await observe(page))).toBe(true);
        expect((await observe(page)).save.inventory).toEqual(archived.inventory);
        expect((await observe(page)).save.flags).toContain('q_radicelmo_seed_archived');
        expect((await observe(page)).mapId).toBe('veloria/radicelmo');
      }
      if (continuePetalora) {
        const dalia = JSON.parse(await readFile(new URL('../../content/trainers/gym02_dalia.trainer.json', import.meta.url), 'utf8'));
        const targetLevel = Math.max(...dalia.team.map((member: { level: number }) => member.level));
        async function restInPetalora() {
          await interact(10, 7);
          await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
          expect((await observe(page)).save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
        }
        await walk(18, 0);
        expect((await observe(page)).mapId).toBe('veloria/r04_salita_petali');
        await challenge(10, 16, 'Nila battle completed naturally');
        expect((await observe(page)).save.flags).toContain('trainer_r04_nila_defeated');
        await walk(30, 0);
        expect((await observe(page)).mapId).toBe('veloria/petalora');
        await record('Petalora reached naturally');
        await restInPetalora();
        await walk(18, 27);
        await walk(35, 18);
        const trainingStart = observedBattles.size;
        for (let step = 0; step < 280 && (await observe(page)).save.party[0].level < targetLevel; step++) {
          await walk(35, step % 2 === 0 ? 19 : 18);
          const lead = (await observe(page)).save.party[0];
          if (lead.hp < lead.maxHp / 2 || lead.moves.every((move: any) => move.pp === 0)) {
            await walk(30, 0); await restInPetalora();
            await walk(18, 27); await walk(35, 18);
          }
        }
        expect((await observe(page)).save.party[0].level, 'Dalia preparation requires genuinely earned XP').toBeGreaterThanOrEqual(targetLevel);
        report.push({ label: 'Petalora training encounters', battles: observedBattles.size - trainingStart, targetLevel });
        await record('Natural preparation before Dalia');
        await walk(30, 0); await restInPetalora();
        for (let purchase = 0; purchase < 3; purchase++) {
          const save = (await observe(page)).save;
          if ((save.inventory.potion ?? 0) >= 3 || save.player.money < 200) break;
          await interact(27, 7);
          await buyFromShop(page, 'Pozione'); await settle();
        }
        await record('Supplies purchased before Dalia');
        await walk(18, 0);
        expect((await observe(page)).mapId).toBe('veloria/gym02_petalora');
        for (const [x, y, flag] of [[5, 21, 'gym02_water_source_open'], [6, 15, 'gym02_water_west_open'], [20, 10, 'gym02_water_east_open'], [13, 6, 'gym02_irrigation_solved']] as const) {
          await interact(x, y);
          expect((await observe(page)).save.flags).toContain(flag);
        }
        await challenge(13, 3, 'Dalia battle completed naturally');
        const secondMedal = (await observe(page)).save;
        expect(secondMedal.flags).toContain('badge_corolla_awarded');
        expect(secondMedal.badges).toContain('badge_corolla');
        await page.screenshot({ path: testInfo.outputPath('natural-second-medal.png') });
        await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
        await page.getByRole('button', { name: 'Salva e torna al titolo' }).click();
        await page.getByRole('button', { name: 'Continua partita' }).click();
        await expect.poll(async () => Boolean(await observe(page))).toBe(true);
        expect((await observe(page)).save.party).toEqual(secondMedal.party);
        expect((await observe(page)).save.badges).toEqual(secondMedal.badges);
        expect((await observe(page)).save.player.money).toBe(secondMedal.player.money);
        expect((await observe(page)).save.inventory).toEqual(secondMedal.inventory);
        await record('Second medal persists after title resume');
      }
      if (continueVetracielo) {
        await walk(13, 25);
        await interact(10, 7);
        await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
        await walk(37, 12);
        expect((await observe(page)).mapId).toBe('veloria/r05_viadotto_ciliegi');
        await challenge(18, 12, 'Oren battle completed naturally');
        const orenWonFirstTry = (await observe(page)).save.flags.includes('trainer_r05_oren_defeated');
        report.push({ label: 'Oren first attempt', won: orenWonFirstTry });
        await walk(45, 6);
        expect((await observe(page)).mapId).toBe('veloria/vetracielo');
        await record('Vetracielo reached naturally');
        await interact(22, 18);
        expect((await observe(page)).save.flags).toContain('q_vetracielo_orientation');
        async function restInVetracielo() {
          await interact(15, 20);
          await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
          expect((await observe(page)).save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
        }
        await restInVetracielo();
        const aster = JSON.parse(await readFile(new URL('../../content/trainers/gym03_aster.trainer.json', import.meta.url), 'utf8'));
        const targetLevel = Math.max(...aster.team.map((member: { level: number }) => member.level));
        const trainingStart = observedBattles.size;
        await walk(4, 15);
        for (let step = 0; step < 400 && (await observe(page)).save.party[0].level < targetLevel; step++) {
          await walk(4, step % 2 === 0 ? 16 : 15);
          const lead = (await observe(page)).save.party[0];
          if (lead.hp < lead.maxHp / 2 || lead.moves.every((move: any) => move.pp === 0)) {
            await restInVetracielo(); await walk(4, 15);
          }
        }
        expect((await observe(page)).save.party[0].level, 'Aster preparation requires genuinely earned XP').toBeGreaterThanOrEqual(targetLevel);
        report.push({ label: 'Vetracielo training encounters', battles: observedBattles.size - trainingStart, targetLevel });
        await record('Natural preparation before Aster');
        await restInVetracielo();
        for (let purchase = 0; purchase < 5; purchase++) {
          const save = (await observe(page)).save;
          if ((save.inventory.potion ?? 0) >= 5 || save.player.money < 200) break;
          await interact(27, 20);
          await buyFromShop(page, 'Pozione'); await settle();
        }
        if (!orenWonFirstTry) {
          await walk(0, 25);
          await challenge(18, 12, 'Oren rematch after natural preparation');
          expect((await observe(page)).save.flags).toContain('trainer_r05_oren_defeated');
          await walk(45, 6); await restInVetracielo();
        }
        await record('Supplies purchased before Aster');
        await walk(19, 16);
        expect((await observe(page)).mapId).toBe('veloria/gym03_vetracielo');
        for (const [x, y, flag] of [[7, 23, 'gym03_line_gardens_active'], [23, 19, 'gym03_line_glass_active'], [15, 15, 'gym03_lines_connected']] as const) {
          await interact(x, y);
          expect((await observe(page)).save.flags).toContain(flag);
        }
        await challenge(15, 10, 'Aster battle completed naturally');
        const thirdMedal = (await observe(page)).save;
        expect(thirdMedal.flags).toContain('badge_circuito_awarded');
        expect(thirdMedal.badges).toContain('badge_circuito');
        await page.screenshot({ path: testInfo.outputPath('natural-third-medal.png') });
        await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
        await page.getByRole('button', { name: 'Salva e torna al titolo' }).click();
        await page.getByRole('button', { name: 'Continua partita' }).click();
        await expect.poll(async () => Boolean(await observe(page))).toBe(true);
        expect((await observe(page)).save.party).toEqual(thirdMedal.party);
        expect((await observe(page)).save.badges).toEqual(thirdMedal.badges);
        expect((await observe(page)).save.player.money).toBe(thirdMedal.player.money);
        expect((await observe(page)).save.inventory).toEqual(thirdMedal.inventory);
        await record('Third medal persists after title resume');
        // Export the actual earned save through the player's backup UI for later continuation.
        await exportCheckpoint('natural-third-medal-backup.json');
      }
    } // Fresh journey through Aster; a rematch imports only a recorded earned save.
    if (continueFerraluce && !resumePortolumeFile) {
      if (!resumeRheaFile) {
        await walk(15, 29);
        expect((await observe(page)).mapId).toBe('veloria/vetracielo');
        await interact(15, 20);
        await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
        await walk(39, 25);
        expect((await observe(page)).mapId).toBe('veloria/r06_anello_magnetico');
        await interact(18, 15);
        expect((await observe(page)).save.flags).toContain('q_r06_measurement');
        await walk(39, 25);
        expect((await observe(page)).mapId).toBe('veloria/ferraluce');
        await interact(20, 20);
        expect((await observe(page)).save.flags).toContain('q_ferraluce_report');
        await record('Ferraluce report delivered naturally');
        async function restInFerraluce() {
          await interact(9, 21);
          await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
          expect((await observe(page)).save.party.every((member: any) => member.hp === member.maxHp && !member.status)).toBe(true);
        }
        await restInFerraluce();
        const rhea = JSON.parse(await readFile(new URL('../../content/trainers/gym04_rhea.trainer.json', import.meta.url), 'utf8'));
        const targetLevel = Math.max(...rhea.team.map((member: { level: number }) => member.level));
        const trainingStart = observedBattles.size;
        await walk(0, 25); await walk(30, 21);
        for (let step = 0; step < 800 && (await observe(page)).save.party[0].level < targetLevel; step++) {
          await walk(30, step % 2 === 0 ? 22 : 21);
          const lead = (await observe(page)).save.party[0];
          if (lead.hp < lead.maxHp / 2 || lead.moves.every((move: any) => move.pp === 0)) {
            await walk(39, 25); await restInFerraluce(); await walk(0, 25); await walk(30, 21);
          }
        }
        expect((await observe(page)).save.party[0].level, 'Rhea preparation requires genuinely earned XP').toBeGreaterThanOrEqual(targetLevel);
        report.push({ label: 'Anello training encounters', battles: observedBattles.size - trainingStart, targetLevel });
        await walk(39, 25); await restInFerraluce();
        for (let purchase = 0; purchase < 5; purchase++) {
          const save = (await observe(page)).save;
          if ((save.inventory.potion ?? 0) >= 5 || save.player.money < 200) break;
          await interact(30, 21); await buyFromShop(page, 'Pozione'); await settle();
        }
        await record('Natural preparation before Rhea');
        await walk(34, 18);
      } else {
        // Continue from the real defeat: no XP, money, objects or flags are granted here.
        await walk(15, 23);
        expect((await observe(page)).mapId).toBe('veloria/ferraluce');
        await interact(9, 21);
        await page.getByRole('button', { name: 'RIPOSA', exact: true }).click(); await settle();
        for (let purchase = 0; purchase < 2; purchase++) {
          const save = (await observe(page)).save;
          if ((save.inventory.potion ?? 0) >= 2 || save.player.money < 200) break;
          await interact(30, 21); await buyFromShop(page, 'Pozione'); await settle();
        }
        await record('Rhea rematch supplies earned and purchased');
        await walk(34, 18);
      }
      expect((await observe(page)).mapId).toBe('veloria/gym04_ferraluce');
      const router = JSON.parse(await readFile(new URL('../../content/puzzles/gym04_magnetic.v1.json', import.meta.url), 'utf8'));
      for (const id of (await observe(page)).save.flags.includes(router.solvedFlag) ? [] : ['field', 'first', 'second']) {
        const node = router.nodes.find((candidate: any) => candidate.id === id);
        await interact(node.x, node.y);
        await page.getByRole('button', { name: 'RUOTA', exact: true }).click();
        const close = page.getByRole('button', { name: 'CHIUDI', exact: true });
        if (await close.isVisible()) await close.click();
        else await page.getByRole('button', { name: 'Annulla', exact: true }).click();
        await settle();
      }
      expect((await observe(page)).save.flags).toContain(router.solvedFlag);
      await challenge(15, 10, 'Rhea battle completed naturally');
      const fourthMedal = (await observe(page)).save;
      expect(fourthMedal.flags).toContain('badge_acciaio_awarded');
      expect(fourthMedal.badges).toContain('badge_acciaio');
      await page.screenshot({ path: testInfo.outputPath('natural-fourth-medal.png') });
      await page.getByRole('button', { name: 'Apri menu di gioco' }).click();
      await page.getByRole('button', { name: 'Salva e torna al titolo' }).click();
      await page.getByRole('button', { name: 'Continua partita' }).click();
      await expect.poll(async () => Boolean(await observe(page))).toBe(true);
      expect((await observe(page)).save.party).toEqual(fourthMedal.party);
      expect((await observe(page)).save.badges).toEqual(fourthMedal.badges);
      expect((await observe(page)).save.player.money).toBe(fourthMedal.player.money);
      expect((await observe(page)).save.inventory).toEqual(fourthMedal.inventory);
      await record('Fourth medal persists after title resume');
      await exportCheckpoint('natural-fourth-medal-backup.json');
    }
    if (resumePortolumeFile) await runCentralePortolume({ page, walk, interact, settle, observe: () => observe(page), record, exportCheckpoint });
    expect(errors).toEqual([]);
  } finally {
    await record('Final observed state');
    const path = testInfo.outputPath('natural-prologue-report.json');
    await writeFile(path, JSON.stringify({starter,startingRngState,prepareGym,continueRadicelmo,continuePetalora,continueVetracielo,continueFerraluce,resumeRheaFile,resumePortolumeFile,damageFirst,report,errors},null,2));
    await testInfo.attach('natural-prologue-report',{path,contentType:'application/json'});
  }
});
