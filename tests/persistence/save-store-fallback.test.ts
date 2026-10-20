import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { loadSave, saveGame, newGameSave } from '../../src/persistence/save-store.ts';
import { checksumJson, verifyChecksum } from '../../src/persistence/save-integrity.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const localMain='veloria-save-v1',localBackup='veloria-save-v1-backup';
function snapshot(revision:number,money:number,id?:string):GameSave{
  const save=newGameSave();return {...save,saveRevision:revision,saveId:id??save.saveId,player:{...save.player,money}};
}

/** Minimal transactional IDB double: gets are async, puts stage until commit,
 * and the first put can throw before any store mutation (the quota regression).
 */
function storage(t: TestContext) {
  const originalIdb=Object.getOwnPropertyDescriptor(globalThis,'indexedDB'),originalLocal=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const idb=new Map<string,unknown>(),local=new Map<string,string>();
  const faults={idbWrites:false,idbOpen:false,localWrites:false,localReads:false};
  const factory={open(){
    const request:any={};
    queueMicrotask(()=>{
      if(faults.idbOpen){request.error=new Error('IDB unavailable');request.onerror?.();return;}
      request.result={close(){},objectStoreNames:{contains:()=>true},transaction(){
        const staged=new Map(idb);let aborted=false,completed=false,pending=0;
        const transaction:any={};
        const finish=()=>queueMicrotask(()=>{
          if(aborted||completed||pending)return;
          completed=true;idb.clear();for(const [key,value]of staged)idb.set(key,value);
          transaction.oncomplete?.();
        });
        transaction.abort=()=>{aborted=true;queueMicrotask(()=>transaction.onabort?.());};
        transaction.objectStore=()=>({
          get(key:string){const operation:any={};pending++;queueMicrotask(()=>{
            if(aborted)return;operation.result=structuredClone(staged.get(key));operation.onsuccess?.();pending--;finish();
          });return operation;},
          put(value:unknown,key:string){
            if(faults.idbWrites)throw new Error('IDB quota');
            staged.set(key,structuredClone(value));finish();return {};
          },
        });
        return transaction;
      }};
      request.onsuccess?.();
    });return request;
  }};
  const localStorage={getItem(key:string){if(faults.localReads)throw new Error('Local access denied');return local.get(key)??null;},setItem(key:string,value:string){if(faults.localWrites)throw new Error('Local quota');local.set(key,String(value));}};
  Object.defineProperty(globalThis,'indexedDB',{value:factory,configurable:true});
  Object.defineProperty(globalThis,'localStorage',{value:localStorage,configurable:true});
  t.after(()=>{
    if(originalIdb)Object.defineProperty(globalThis,'indexedDB',originalIdb);else Reflect.deleteProperty(globalThis,'indexedDB');
    if(originalLocal)Object.defineProperty(globalThis,'localStorage',originalLocal);else Reflect.deleteProperty(globalThis,'localStorage');
  });
  const setIdb=(save:GameSave,slot='main')=>{idb.set(slot,structuredClone(save));idb.set('checksum:'+slot,checksumJson(save));};
  return {idb,local,faults,setIdb};
}

test('first IDB backup put failure falls back above its observed revision and reload chooses newer local state',async t=>{
  const store=storage(t),old=snapshot(40,100);store.setIdb(old);store.faults.idbWrites=true;
  const next=snapshot(1,999),before=JSON.stringify(next);
  await saveGame(next);
  assert.equal(JSON.stringify(next),before);
  assert.equal((store.idb.get('main') as GameSave).saveRevision,40);
  const fallback=JSON.parse(store.local.get(localMain)!);
  assert.equal(fallback.saveRevision,41);
  assert.equal((await loadSave())?.player.money,999);
  assert.equal((await loadSave())?.saveRevision,41);
});

test('recovered IDB writes exceed newer fallback even for imported saves with a different saveId',async t=>{
  const store=storage(t);store.setIdb(snapshot(40,100));store.local.set(localMain,JSON.stringify(snapshot(41,999)));
  const imported=snapshot(1,1234);await saveGame(imported);
  const loaded=(await loadSave())!;
  assert.equal(loaded.saveRevision,42);
  assert.equal(loaded.saveId,imported.saveId);
  assert.equal(loaded.player.money,1234);
  assert.equal((store.idb.get('backup-previous') as GameSave).saveRevision,41);
  assert.ok(verifyChecksum(store.idb.get('main'),store.idb.get('checksum:main')));
});

test('stale or malformed fallback cannot replace a newer validated IDB current snapshot',async t=>{
  const store=storage(t),current=snapshot(50,500);store.setIdb(current);
  for(const raw of [JSON.stringify(snapshot(49,1)),'{broken']){
    store.local.set(localMain,raw);store.local.set(localBackup,'also broken');
    const before=structuredClone(store.idb);
    assert.deepEqual(await loadSave(),current);
    assert.deepEqual(store.idb,before);
  }
});

test('malformed local main does not hide its independently validated backup',async t=>{
  const store=storage(t);store.faults.idbOpen=true;store.local.set(localMain,'{broken');
  const backup=snapshot(12,1200);store.local.set(localBackup,JSON.stringify(backup));
  assert.deepEqual(await loadSave(),backup);
});

test('invalid checksum cannot win revision selection or inflate future revisions',async t=>{
  const store=storage(t);store.setIdb(snapshot(900,900));store.idb.set('checksum:main','wrong');
  store.setIdb(snapshot(9,9),'backup-previous');store.local.set(localMain,JSON.stringify(snapshot(12,12)));
  assert.equal((await loadSave())?.saveRevision,12);
  await saveGame(snapshot(1,1300));
  assert.equal((await loadSave())?.saveRevision,13);
  assert.equal((await loadSave())?.player.money,1300);
});

test('verified IDB previous backup still repairs an invalid current record',async t=>{
  const store=storage(t);store.idb.set('main',{broken:true});store.idb.set('checksum:main','wrong');
  const backup=snapshot(9,9);store.setIdb(backup,'backup-previous');
  assert.deepEqual(await loadSave(),backup);
  assert.deepEqual(store.idb.get('main'),backup);
  assert.ok(verifyChecksum(store.idb.get('main'),store.idb.get('checksum:main')));
});

test('both write failures reject and leave the previous validated IDB snapshot intact',async t=>{
  const store=storage(t),current=snapshot(70,700);store.setIdb(current);
  store.faults.idbWrites=true;store.faults.localWrites=true;
  await assert.rejects(saveGame(snapshot(1,999)),/Local quota/);
  assert.deepEqual(await loadSave(),current);
});

test('unavailable IDB and denied local reads retain bounded fallback and IDB paths respectively',async t=>{
  const store=storage(t);store.faults.idbOpen=true;store.local.set(localMain,JSON.stringify(snapshot(22,22)));
  await saveGame(snapshot(1,2300));assert.equal((await loadSave())?.saveRevision,23);
  store.faults.idbOpen=false;store.faults.localReads=true;
  await saveGame(snapshot(30,3100));assert.equal((await loadSave())?.saveRevision,31);
});

test('input revision participates in the global monotonic maximum',async t=>{
  const store=storage(t);store.setIdb(snapshot(40,40));store.local.set(localMain,JSON.stringify(snapshot(45,45)));
  await saveGame(snapshot(100,10100));
  assert.equal((await loadSave())?.saveRevision,101);
});
