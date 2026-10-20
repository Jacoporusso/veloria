import narrative from '../../../content/story/league_epilogue.v1.json' with {type:'json'};
import type {GameSave} from '../../persistence/save-types.ts';
import {battleSpecies} from '../battle/catalog.ts';
import {createCreaturePortrait} from '../battle/creature-art.ts';
import '../../league-completion.css';

/** Present an already committed championship. Never grants rewards or changes saves. */
export function showLeagueCompletion(save:GameSave):Promise<void>{
 return new Promise(resolve=>{
  const focus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const controller=new AbortController();
  const node=<K extends keyof HTMLElementTagNameMap>(tag:K,cls:string,text?:string)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const overlay=node('div','league-completion');
  const panel=node('section','league-completion__panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','league-completion-title');panel.tabIndex=-1;
  const content=node('div','league-completion__content');content.tabIndex=0;
  const kicker=node('p','league-completion__kicker','LEGA DI VELORIA');
  const trophy=node('div','league-completion__trophy');trophy.setAttribute('aria-hidden','true');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');
  for(const [d,fill]of [['M28 18H72V36Q72 62 50 68Q28 62 28 36Z','#ffe3a2'],['M20 23H28V36Q28 49 18 46Q8 43 8 30V23ZM72 23H92V30Q92 43 82 46Q72 49 72 36Z','#afffe3'],['M45 64H55V80H69V88H31V80H45Z','#c6b1ff'],['M50 27L54 38L66 39L57 47L60 59L50 52L40 59L43 47L34 39L46 38Z','#31556f']]){const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',d);p.setAttribute('fill',fill);svg.append(p);}trophy.append(svg);
  const title=node('h1','league-completion__title',narrative.championship.title);title.id='league-completion-title';
  const greeting=node('p','league-completion__greeting');const name=node('strong','',save.player.name);greeting.append(name,' e i tuoi Pokémon avete conquistato la Lega.');
  const story=node('p','league-completion__story',narrative.championship.story);
  const party=node('section','league-completion__party');party.setAttribute('aria-label','La squadra con te');party.append(node('h2','','La squadra con te'));const list=node('ul','league-completion__team');
  for(const member of save.party){const item=node('li','league-completion__member');item.append(createCreaturePortrait(member.speciesId),node('strong','',battleSpecies[String(member.speciesId)]?.name??'Pokémon'),node('span','',`Livello ${member.level}`));list.append(item);}party.append(list);
  const button=node('button','league-completion__continue','Leggi l’epilogo');button.type='button';
  content.append(kicker,trophy,title,greeting,story,party);panel.append(content,button);overlay.append(panel);document.body.append(overlay);
  let phase=0,settled=false;
  const finish=()=>{if(settled)return;settled=true;controller.abort();overlay.remove();if(focus?.isConnected)focus.focus({preventScroll:true});resolve();};
  button.addEventListener('click',()=>{
   if(phase===1){finish();return;}
   phase=1;title.textContent=narrative.epilogue.title;kicker.textContent=narrative.epilogue.eyebrow;greeting.textContent=narrative.epilogue.greeting;
   story.textContent=narrative.epilogue.paragraphs[0];
   const ending=node('p','league-completion__story',narrative.epilogue.paragraphs[1]);content.insertBefore(ending,party);party.hidden=true;button.textContent='Torna a Veloria';content.scrollTop=0;button.focus({preventScroll:true});
  },{signal:controller.signal});
  for(const type of ['pointerdown','pointerup','touchstart','touchend'])overlay.addEventListener(type,event=>event.stopPropagation(),{signal:controller.signal});
  document.addEventListener('keydown',event=>{event.stopImmediatePropagation();if(event.key==='Tab'){event.preventDefault();(document.activeElement===button?content:button).focus();}else if(['Enter',' '].includes(event.key)){event.preventDefault();if(!event.repeat)button.click();}else if(event.key==='Escape'){event.preventDefault();if(phase===1)finish();}},{capture:true,signal:controller.signal});
  button.focus({preventScroll:true});
 });
}
