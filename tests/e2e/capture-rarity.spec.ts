import { expect, test, type Page } from '@playwright/test';
import { tapBattleLabel } from './helpers/battle-touch';

type CaptureView = { text: string; percent: number };

async function openWorldBattle(page: Page, speciesId: number): Promise<void> {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    await route.fulfill({ response, body: `${await response.text()}\nglobalThis.__captureRarityGame = game;` });
  });
  await page.goto('/?previewMap=veloria/borgofonte_lab');
  await expect(page.locator('#game-loading')).toBeHidden();
  await page.evaluate(speciesId => {
    const world = (window as any).__captureRarityGame.scene.keys.world;
    world.save.inventory = { ...world.save.inventory, 'poke-ball': 4 };
    world.startWildBattle(speciesId, 5);
  }, speciesId);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).__captureRarityGame.scene.keys.battle;
    return Boolean(scene?.sys?.isActive() && scene.ui?.list?.length && scene.state?.battleType === 'wild');
  })).toBe(true);
}

async function readCaptureView(page: Page): Promise<CaptureView> {
  const text = await page.evaluate(() => {
    const scene = (window as any).__captureRarityGame.scene.keys.battle;
    return scene.ui.list.find((item: any) => item.type === 'Text' && /^SFERA · ×\d+\nCattura ~\d+%$/.test(item.text))?.text ?? null;
  });
  expect(text, 'capture menu renders the sphere quantity and chance').not.toBeNull();
  return { text: text!, percent: Number(text!.match(/Cattura ~(\d+)%/)![1]) };
}

async function startCaptureMenu(page: Page): Promise<void> {
  await tapBattleLabel(page, '__captureRarityGame', 'CATTURA');
  await expect.poll(() => page.evaluate(() => (window as any).__captureRarityGame.scene.keys.battle.mode)).toBe('captures');
}

test('real wild capture menus reflect the sourced rarity for common, rare and legendary species', async ({ page }) => {
  const displayed: number[] = [];
  for (const [index, speciesId] of [16, 143, 144].entries()) {
    if (index > 0) {
      await page.reload();
      await expect(page.locator('#game-loading')).toBeHidden();
      await page.evaluate(speciesId => {
        const world = (window as any).__captureRarityGame.scene.keys.world;
        world.save.inventory = { ...world.save.inventory, 'poke-ball': 4 };
        world.startWildBattle(speciesId, 5);
      }, speciesId);
      await expect.poll(() => page.evaluate(() => {
        const scene = (window as any).__captureRarityGame.scene.keys.battle;
        return Boolean(scene?.sys?.isActive() && scene.ui?.list?.length && scene.state?.battleType === 'wild');
      })).toBe(true);
    } else {
      await openWorldBattle(page, speciesId);
    }
    await startCaptureMenu(page);
    const view = await readCaptureView(page);
    displayed.push(view.percent);
  }
  expect(displayed[0]).toBeGreaterThan(displayed[1]);
  expect(displayed[1]).toBeGreaterThan(displayed[2]);
});

test('capture chance responds to HP and status, menu toggles spend nothing, and a real throw logs its chance', async ({ page }, info) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await openWorldBattle(page, 16);
  const inventoryBefore = await page.evaluate(() => (window as any).__captureRarityGame.scene.keys.battle.remainingInventory['poke-ball']);
  const rngBefore = await page.evaluate(() => (window as any).__captureRarityGame.scene.keys.battle.state.rngState);

  await startCaptureMenu(page);
  const fullHealth = await readCaptureView(page);
  expect(fullHealth.text).toContain('×4');

  for (const [width, height, orientation] of [[390, 844, 'portrait'], [844, 390, 'landscape']] as const) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).__captureRarityGame.scene.keys.battle;
      return `${scene.viewport.width}x${scene.viewport.height}`;
    })).toBe(`${width}x${height}`);
    const geometry = await page.evaluate(() => {
      const scene = (window as any).__captureRarityGame.scene.keys.battle;
      const label = scene.ui.list.find((item: any) => item.type === 'Text' && item.text.startsWith('SFERA · ×'));
      const canvas = scene.game.canvas.getBoundingClientRect();
      const bounds = label.getBounds();
      const zoom = scene.scale.zoom;
      const opponent = scene.actors.opponent.getBounds();
      const player = scene.actors.player.getBounds();
      return {
        opponentTop: opponent.top,
        playerBottom: player.bottom,
        playerHudTop: scene.commandLayout.arena.height - 102,
        left: canvas.left + bounds.left * zoom,
        right: canvas.left + bounds.right * zoom,
        top: canvas.top + bounds.top * zoom,
        bottom: canvas.top + bounds.bottom * zoom,
        canvasLeft: canvas.left,
        canvasRight: canvas.right,
        canvasTop: canvas.top,
        canvasBottom: canvas.bottom,
        text: label.text,
      };
    });
    expect(geometry.text).toContain('Cattura ~');
    expect(geometry.opponentTop).toBeGreaterThanOrEqual(95);
    expect(geometry.playerBottom).toBeLessThanOrEqual(geometry.playerHudTop - 4);
    expect(geometry.left).toBeGreaterThanOrEqual(geometry.canvasLeft - 1);
    expect(geometry.right).toBeLessThanOrEqual(geometry.canvasRight + 1);
    expect(geometry.top).toBeGreaterThanOrEqual(geometry.canvasTop - 1);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.canvasBottom + 1);
    await page.screenshot({ path: info.outputPath(`capture-menu-${orientation}.png`) });
    // Switching away and back through the real touch tabs leaves the battle untouched.
    await tapBattleLabel(page, '__captureRarityGame', 'LOTTA');
    await tapBattleLabel(page, '__captureRarityGame', 'CATTURA');
    expect(await readCaptureView(page)).toEqual(fullHealth);
    expect(await page.evaluate(() => {
      const scene = (window as any).__captureRarityGame.scene.keys.battle;
      return { rng: scene.state.rngState, inventory: scene.remainingInventory['poke-ball'] };
    })).toEqual({ rng: rngBefore, inventory: inventoryBefore });
  }

  await page.evaluate(() => {
    const scene = (window as any).__captureRarityGame.scene.keys.battle;
    const target = scene.state.opponent.creatures[scene.state.opponent.activeIndex];
    target.hp = Math.max(1, Math.floor(target.stats.maxHp * 0.25));
    target.status = { status: 'paralysis' };
    scene.render();
  });
  const prepared = await readCaptureView(page);
  expect(prepared.percent).toBeGreaterThan(fullHealth.percent);

  await tapBattleLabel(page, '__captureRarityGame', 'SFERA');
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).__captureRarityGame.scene.keys.battle;
    return scene.eventLog.filter((event: any) => event.type === 'captureAttempted').length;
  })).toBe(1);
  const result = await page.evaluate(() => {
    const scene = (window as any).__captureRarityGame.scene.keys.battle;
    const attempt = scene.eventLog.find((event: any) => event.type === 'captureAttempted');
    return {
      chance: attempt.chance,
      inventory: scene.remainingInventory['poke-ball'],
      rng: scene.state.rngState,
      outcomes: scene.eventLog.filter((event: any) => event.type === 'captureFailed' || event.type === 'creatureCaptured').length,
    };
  });
  expect(Math.round(result.chance * 100)).toBe(prepared.percent);
  expect(result.inventory).toBe(inventoryBefore - 1);
  expect(result.rng).not.toBe(rngBefore);
  expect(result.outcomes).toBe(1);
  expect(pageErrors).toEqual([]);
});
