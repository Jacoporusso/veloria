import {expect, type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import type {GameSave} from '../../../src/persistence/save-types.ts';
import {collectMapCollision} from '../../../src/core/world/map-collision.ts';

export async function readBrowserSave(page: Page): Promise<GameSave> {
  return page.evaluate(()=>new Promise<any>((resolve,reject)=>{
    const request=indexedDB.open('veloria-save',1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result, tx=db.transaction('saves','readonly'), get=tx.objectStore('saves').get('main');
      get.onsuccess=()=>resolve(get.result);get.onerror=()=>reject(get.error);
      tx.oncomplete=()=>db.close();
    };
  }));
}

/** Isolated test setup only; subsequent interactions use the normal game save path. */
export async function seedBrowserSave(page: Page, save: GameSave): Promise<void> {
  await page.evaluate(save=>new Promise<void>((resolve,reject)=>{
    const request=indexedDB.open('veloria-save',1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result, tx=db.transaction('saves','readwrite'), store=tx.objectStore('saves');
      store.put(save,'main');store.delete('checksum:main');
      tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
    };
  }),save);
}

export async function walkDirection(page: Page, direction: 'up'|'down'|'left'|'right', beforeSave?: GameSave): Promise<GameSave> {
  const labels={up:'Vai in alto',down:'Vai in basso',left:'Vai a sinistra',right:'Vai a destra'};
  const before=(beforeSave ?? await readBrowserSave(page)).player;
  let observed: GameSave;
  await page.getByRole('button',{name:labels[direction],exact:true}).tap();
  await expect.poll(async()=>{
    observed=await readBrowserSave(page);
    const p=observed.player;
    return `${p.mapId}|${p.x},${p.y}`;
  }).not.toBe(`${before.mapId}|${before.x},${before.y}`);
  await expect(page.locator('#game-loading')).toBeHidden({timeout:30_000});
  return observed!;
}

/** Plan against the authored collision map; do not teleport through the play test. */
export async function walkTo(page: Page, tiledFile: string, targetX: number, targetY: number, options: { avoidEncounters?: boolean } = {}) {
  const m=JSON.parse(await readFile(new URL('../../../public/tilemaps/'+tiledFile,import.meta.url),'utf8'));
  const save=await readBrowserSave(page);
  const blocked=collectMapCollision(m.layers.find((l:any)=>l.name==='collision').objects,m.width,m.height,save.flags);
  const add=(o:any,allowTarget=false)=>{
    for(let y=Math.floor(o.y/32);y<Math.ceil((o.y+o.height)/32);y++)
      for(let x=Math.floor(o.x/32);x<Math.ceil((o.x+o.width)/32);x++)
        if(!allowTarget||x!==targetX||y!==targetY)blocked.add(`${x},${y}`);
  };
  for(const o of m.layers.find((l:any)=>l.name==='triggers').objects)
    if(o.properties?.some((p:any)=>p.name==='kind'&&p.value==='map-exit'))add(o,true);
    else if(options.avoidEncounters && o.properties?.some((p:any)=>p.name==='kind'&&p.value==='encounter-zone'))add(o);
  const p=save.player;
  const start=`${p.x},${p.y}`, target=`${targetX},${targetY}`, queue=[start];
  const previous=new Map<string,{from:string;direction:'up'|'down'|'left'|'right'}>();
  const visited=new Set(queue);
  const directions=[[0,-1,'up'],[0,1,'down'],[-1,0,'left'],[1,0,'right']] as const;
  for(let i=0;i<queue.length&&!visited.has(target);i++) {
    const [x,y]=queue[i].split(',').map(Number);
    for(const [dx,dy,direction]of directions) {
      const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=m.width||ny>=m.height||blocked.has(key)||visited.has(key))continue;
      visited.add(key);queue.push(key);previous.set(key,{from:queue[i],direction});
    }
  }
  expect(visited.has(target),`${tiledFile}: reachable ${target}`).toBe(true);
  const route:Array<'up'|'down'|'left'|'right'>=[];
  for(let key=target;key!==start;) {const step=previous.get(key)!;route.push(step.direction);key=step.from;}
  let observed=save;
  for(const direction of route.reverse())observed=await walkDirection(page,direction,observed);
}
