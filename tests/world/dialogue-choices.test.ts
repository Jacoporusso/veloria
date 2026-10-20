import assert from 'node:assert/strict';
import test from 'node:test';
import {selectDialogueEntry,type DialogueEntry} from '../../src/game/interactions/dialogue-catalog.ts';
const entry:DialogueEntry={speaker:'Elia',stages:[
 {whenFlagMissing:'readings',lines:['Raccogli i dati.']},
 {whenFlagMissing:'plan',lines:['Abbiamo due possibilità.'],choicePrompt:'Che cosa facciamo?',choices:[
  {id:'review',label:'Rivediamo le misure',lines:['Controlliamo i sensori.']},
  {id:'restore',label:'Ripristiniamo insieme',lines:['Coordiniamo le due reti.'],questEvent:'plan/restore',requiresFlags:['readings']},
 ]},
 {lines:['Il piano è registrato.']},
]};
test('dialogue choices follow stage and requirements without emitting or applying an event',()=>{
 const before=structuredClone(entry),flags=['readings'];
 assert.equal(selectDialogueEntry(entry,{starterSelected:true,flags:[]})?.choices,undefined);
 const selected=selectDialogueEntry(entry,{starterSelected:true,flags})!;
 assert.equal(selected.choicePrompt,'Che cosa facciamo?');assert.equal(selected.choices?.length,2);
 assert.equal(selected.questEvent,undefined);assert.deepEqual(flags,['readings']);assert.deepEqual(entry,before);
 assert.equal(selectDialogueEntry(entry,{starterSelected:true,flags:['readings','plan']})?.choices,undefined);
});
test('unavailable choices are filtered and plain/starter dialogue selection is preserved',()=>{
 const plain:DialogueEntry={speaker:'Guida',lines:['Salve!'],choices:entry.stages![1].choices};
 assert.deepEqual(selectDialogueEntry(plain,{starterSelected:false,flags:[]})?.choices?.map(c=>c.id),['review']);
 const starter:DialogueEntry={speaker:'Elia',requiresStarterChoice:true,lines:['Scegli!']};
 assert.equal(selectDialogueEntry(starter,{starterSelected:false,flags:[]})?.requiresStarterChoice,true);
 assert.equal(selectDialogueEntry(starter,{starterSelected:true,flags:[]})?.requiresStarterChoice,false);
});
