import { test, expect } from '@playwright/test';

test('forest instrument, Ada and onward exit stay clear with HD terrain', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // Explicit isolated mission fixture; never touches the user's save or claims a natural playthrough.
  const nextRandom = (seed: number) => { let x=seed>>>0; x^=x<<13; x^=x>>>17; x^=x<<5; return x>>>0; };
  let quietSeed=1;
  for (; quietSeed<1000000; quietSeed++) {
    let state=quietSeed, clear=true;
    for (let n=0;n<64;n++) { state=nextRandom(state); if(state/0x100000000<0.08) {clear=false;break;} }
    if(clear) break;
  }
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    const original = await response.text();
    const source = original.replace(/preview\.flags\s*=\s*\[[^\]]+\];/, "preview.flags = [...preview.flags, 'q_research_sample_received']; preview.rngState = " + quietSeed + ";");
    if (source === original) throw new Error('Mission fixture did not match the preview initializer.');
    await route.fulfill({ response, body: source + '\nglobalThis.__forestGame = game;' });
  });
  await page.goto('/?previewMap=veloria/d01_bosco_veli');
  await expect(page.locator('#game-loading')).toBeHidden({ timeout: 30000 });
  const read = () => page.evaluate(() => {
    const world = (window as any).__forestGame?.scene.keys.world;
    if (!world?.playerTile) return null;
    return { x: world.playerTile.x, y: world.playerTile.y, moving: world.moving, flags: world.save.flags,
      marker: world.openingGuidance?.element.textContent };
  });
  await expect.poll(read).toMatchObject({ x: 1, y: 10, marker: 'SENSORE · A' });
  expect((await read())?.flags).not.toContain('q_ada_helped');
  const floor = await page.evaluate(() => {
    const world = (window as any).__forestGame.scene.keys.world;
    // Terrain is composed once into a continuous surface to avoid tile seams.
    const layer = world.mapLayer.list.find((item: any) => item.type === 'RenderTexture');
    return { width: layer.displayWidth,
      height: layer.displayHeight,
      npc: world.mapLayer.list.filter((item: any) => item.type === 'Image' && item.texture.key === 'veloria-npcs-v2').length };
  });
  expect(floor).toEqual({ width: 960, height: 640, npc: 1 });
  async function step(name: string) {
    await page.getByRole('button', {name}).tap();
    await expect.poll(async () => (await read())?.moving).toBe(false);
  }
  for (let index=0; index<11; index++) await step('Vai a destra');
  await step('Vai in basso');
  for (let index=0; index<5; index++) await step('Vai a destra');
  await expect.poll(read).toMatchObject({x:17,y:11});
  await expect(page.locator('.world-guidance')).toHaveText('SENSORE · A');
  await expect(page.locator('.world-guidance')).toBeVisible();
  await step('Vai in alto'); // Enter the sensor tile: A must also work directly on the instrument.
  await page.getByRole('button',{name:'Conferma e interagisci'}).tap();
  await expect.poll(async () => (await read())?.flags).toContain('q_forest_signal_found');
  await expect.poll(async () => (await read())?.marker).toBe('ADA · A');
  await expect(page.locator('.world-guidance')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('forest-sensor-and-ada-portrait.png')});
  await step('Vai in basso');
  for (let index=0; index<4; index++) await step('Vai a sinistra');
  await step('Vai in alto');
  await page.getByRole('button',{name:'Conferma e interagisci'}).tap();
  await expect(page.locator('#dialogue-speaker')).toHaveText('Ada');
  for(let index=0; index<6 && await page.locator('#dialogue-box').isVisible(); index++) await page.getByRole('button',{name:'Conferma e interagisci'}).tap();
  await expect.poll(async () => (await read())?.flags).toContain('q_ada_helped');
  await expect.poll(async () => (await read())?.marker).toBe('→ VIALE DELLE FRONDE');
  await page.setViewportSize({width:844,height:390});
  await expect.poll(() => page.evaluate(() => {
    const scale = (window as any).__forestGame.scale;
    return { width: scale.width * scale.zoom, height: scale.height * scale.zoom };
  })).toEqual({ width: 844, height: 390 });
  await page.screenshot({path:testInfo.outputPath('forest-ada-landscape.png')});
  expect(errors).toEqual([]);
});
