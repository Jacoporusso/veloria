import { expect, test } from '@playwright/test';

test('illustrated hairstyles keep skin separate from a mint backpack and retain all sixteen poses', async ({ page }, info) => {
  await page.setViewportSize({ width: 1100, height: 1100 });
  await page.route('**/src/main.ts', route => route.fulfill({ contentType: 'text/javascript', body: `
    import { loadIllustratedTrainer } from '/src/game/rendering/illustrated-trainer.ts';
    import { DEFAULT_TRAINER_APPEARANCE } from '/src/core/party/trainer-appearance.ts';
    document.body.innerHTML='<main id="studies" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px;background:#183b48;color:#eef7f3"></main>';
    window.__paletteProof=[];
    for(const hairStyle of ['short','curly','long']) for(const skin of ['light','medium','deep']) {
      const appearance={...DEFAULT_TRAINER_APPEARANCE,hairStyle,skin,backpack:'mint',outfit:'lavender'};
      const sheet=await loadIllustratedTrainer(appearance);
      const ctx=sheet.getContext('2d');
      const face=ctx.getImageData(84+192,60,24,40).data;
      let green=0,opaque=0;
      for(let i=0;i<face.length;i+=4) if(face[i+3]>128){opaque++;if(face[i+1]>face[i]*1.25&&face[i+1]>face[i+2]*1.1)green++;}
      const poses=[];
      for(let row=0;row<4;row++)for(let column=0;column<4;column++){
        const pixels=ctx.getImageData(column*192,row*240,192,240).data;let solid=0;
        for(let i=3;i<pixels.length;i+=4)if(pixels[i]>128)solid++;
        poses.push(solid);
      }
      window.__paletteProof.push({hairStyle,skin,green,opaque,poses});
      const card=document.createElement('section'),title=document.createElement('p'),preview=document.createElement('canvas');
      title.textContent=hairStyle+' / '+skin;preview.width=192;preview.height=240;
      preview.getContext('2d').drawImage(sheet,192,0,192,240,0,0,192,240);
      card.append(title,preview);document.querySelector('#studies').append(card);
    }
    window.__paletteReady=true;
  ` }));
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__paletteReady, undefined, { timeout: 30_000 });
  const proof = await page.evaluate(() => (window as any).__paletteProof);
  expect(proof).toHaveLength(9);
  for (const sample of proof) {
    expect(sample.opaque).toBeGreaterThan(200);
    expect(sample.green / sample.opaque, `${sample.hairStyle}/${sample.skin}: skin must not use the mint backpack color`).toBeLessThan(.15);
    expect(sample.poses).toHaveLength(16);
    for (const count of sample.poses) expect(count).toBeGreaterThan(1000);
  }
  await page.screenshot({ path: info.outputPath('illustrated-palette-studies.png'), fullPage: true });
});
