import { expect, test } from '@playwright/test';

test('eyes, beard and backpack stay on their authored pose masks without adding floating pixels', async ({ page }, info) => {
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.route('**/src/main.ts', route => route.fulfill({ contentType: 'text/javascript', body: `
    import {loadIllustratedTrainer} from '/src/game/rendering/illustrated-trainer.ts';
    import {trainerPoseMask,inTrainerPolygon} from '/src/game/rendering/trainer-pose-masks.ts';
    import {DEFAULT_TRAINER_APPEARANCE} from '/src/core/party/trainer-appearance.ts';
    document.body.innerHTML='<main id="proof" style="display:grid;grid-template-columns:repeat(4,1fr);background:#183b48;color:white;padding:16px"></main>';
    window.__detailProof=[];
    for(const hairStyle of ['short','curly','long']) {
      const appearance={...DEFAULT_TRAINER_APPEARANCE,hairStyle};
      const base=await loadIllustratedTrainer(appearance),baseData=base.getContext('2d').getImageData(0,0,768,960).data;
      for(const [feature,patch] of [['base',{}],['eyes',{eyes:'green'}],['beard',{beard:'short'}],['backpack',{backpack:'mint'}]]) {
        const sheet=await loadIllustratedTrainer({...appearance,...patch});
        const data=sheet.getContext('2d').getImageData(0,0,768,960).data;
        const counts=Array(16).fill(0);let outside=0,alphaChanges=0;
        for(let y=0;y<960;y++)for(let x=0;x<768;x++){
          const i=(y*768+x)*4;if(data[i+3]!==baseData[i+3])alphaChanges++;
          if(data[i]===baseData[i]&&data[i+1]===baseData[i+1]&&data[i+2]===baseData[i+2])continue;
          const poseIndex=Math.floor(y/240)*4+Math.floor(x/192),pose=trainerPoseMask(hairStyle,poseIndex),lx=x%192,ly=y%240;
          counts[poseIndex]++;
          const inside=feature==='eyes'?pose.eyes.some(([ex,ey])=>((lx-ex)/3.8)**2+((ly-ey)/4.2)**2<=1):feature==='beard'?inTrainerPolygon(lx,ly,pose.beard):pose.bags.some(p=>inTrainerPolygon(lx,ly,p));
          if(!inside||baseData[i+3]<160)outside++;
        }
        window.__detailProof.push({hairStyle,feature,counts,outside,alphaChanges});
        const card=document.createElement('section'),title=document.createElement('p'),canvas=document.createElement('canvas');
        title.textContent=hairStyle+' / '+feature;canvas.width=192;canvas.height=480;
        canvas.getContext('2d').drawImage(sheet,192,0,192,240,0,0,192,240);
        canvas.getContext('2d').drawImage(sheet,192,feature==='backpack'?720:240,192,240,0,240,192,240);
        card.append(title,canvas);document.querySelector('#proof').append(card);
      }
    }
    window.__detailReady=true;
  ` }));
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__detailReady, undefined, { timeout: 30_000 });
  for (const proof of await page.evaluate(() => (window as any).__detailProof)) {
    expect(proof.outside, `${proof.hairStyle}/${proof.feature} mask spill`).toBe(0);
    expect(proof.alphaChanges).toBe(0);
    if (proof.feature === 'base') continue;
    for (let frame = 0; frame < 16; frame++) {
      if (frame >= 12 && proof.feature !== 'backpack') expect(proof.counts[frame]).toBe(0);
      else expect(proof.counts[frame], `${proof.hairStyle}/${proof.feature}/${frame}`).toBeGreaterThan(0);
    }
  }
  await page.screenshot({ path: info.outputPath('avatar-details.png'), fullPage: true });
});
