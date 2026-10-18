import {expect, test} from '@playwright/test';

test.use({deviceScaleFactor: 2});
for (const quality of ['full','reduced']) test(`Petalora cherry artwork and petals: ${quality}`, async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error=>errors.push(error.message));
  await page.addInitScript(quality=>localStorage.setItem('veloria-animation-quality',quality),quality);
  await page.route('**/src/main.ts*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text())+'\nglobalThis.__petaloraGame = game;'});
  });
  for(const mapId of ['veloria/r04_salita_petali','veloria/petalora']) {
    await page.goto('/?previewMap='+mapId);
    await expect(page.locator('#game-loading')).toBeHidden({timeout:30_000});
    const visuals=await page.evaluate(()=>{
      const world=(window as any).__petaloraGame.scene.keys.world;
      const trees=world.mapLayer.list.filter((item:any)=>item.type==='Image'&&item.texture.key==='veloria-cherry-tree-v1');
      const petals=world.mapLayer.list.filter((item:any)=>item.name==='ambient-petal');
      return {trees:trees.length,petals:petals.length,petalTweens:world.tweens.getTweensOf(petals[0]).length,aspectPreserved:trees.every((tree:any)=>Math.abs(tree.scaleX-tree.scaleY)<.001)};
    });
    expect(visuals.trees).toBeGreaterThan(10);
    expect(visuals.petals).toBe(18);
    expect(visuals.petalTweens).toBe(quality==='full'?1:0);
    expect(visuals.aspectPreserved).toBe(true);
    for(const [width,height]of [[390,844],[844,390]]) {
      await page.setViewportSize({width,height});
      await expect.poll(()=>page.evaluate(()=>({width:(window as any).__petaloraGame.scale.width,height:(window as any).__petaloraGame.scale.height}))).toEqual({width:width*2,height:height*2});
      await page.evaluate(()=>new Promise<void>(resolve=>(window as any).__petaloraGame.events.once('postrender',()=>resolve())));
      await page.screenshot({path:testInfo.outputPath(`${mapId.split('/')[1]}-${width}.png`)});
    }
  }
  expect(errors).toEqual([]);
});
