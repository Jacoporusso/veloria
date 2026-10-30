import { expect, test, type Page } from '@playwright/test';
import appearances from '../../content/characters/appearances.v2.json' with { type: 'json' };
import walkManifest from '../../assets/npc-walk-cycles-v1.json' with { type: 'json' };
import { enterGame } from './helpers/enter-game';
import { readBrowserSave } from './helpers/world-navigation';

const animatedProfiles = appearances.profiles.filter(profile => 'walkCycle' in profile);
const observe = (page: Page) => page.evaluate(() => {
  const scene = (window as any).__npcMotionGame?.scene.keys['npc-animation-preview'];
  const actor = scene?.actor;
  if (!actor) return null;
  return { logical: { ...scene.logicalPosition }, x: actor.x, y: actor.y, key: actor.texture.key,
    motion: actor.getData('npcMotion'), frame: actor.getData('npcAnimationFrame'), elapsed: actor.getData('npcAnimationElapsedMs'),
    direction: actor.getData('npcFacing'), origin: { x: actor.originX, y: actor.originY },
    width: actor.displayWidth, height: actor.displayHeight, scaleX: actor.scaleX, scaleY: actor.scaleY,
    flipped: actor.flipX || actor.flipY, worldActive: Boolean(scene.game.scene.isActive('world')) };
});

test('unknown identities and profiles without walk artwork keep the normal campaign entry', async ({ page }) => {
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch({ maxRetries: 2 });
    await route.fulfill({ response, body: await response.text() + '\nwindow.__npcMotionGame = game;' });
  });
  await page.goto('/'); await enterGame(page);
  await page.getByRole('button', { name: 'Salva la partita', exact: true }).tap();
  const before = await readBrowserSave(page);
  const stationary = appearances.profiles.find(profile => !('walkCycle' in profile));
  for (const identity of ['missing-npc', ...(stationary ? [stationary.id] : [])]) {
    await page.goto(`/?npcAnimationPreview=${identity}`); await enterGame(page);
    await expect(page.locator('.npc-animation-tools')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__npcMotionGame.scene.isActive('world'))).toBe(true);
    const after = await readBrowserSave(page);
    for (const key of ['player', 'flags', 'party', 'inventory', 'rngState'] as const) expect(after[key]).toEqual(before[key]);
  }
});

for (const profile of animatedProfiles) for (const reducedMotion of ['no-preference', 'reduce'] as const) test.describe(`${profile.id} walk preview: ${reducedMotion}`, () => {
  test.use({ reducedMotion, deviceScaleFactor: 1 });
  test('authentic frames move in four directions and return to idle without touching the campaign save', async ({ page }, info) => {
    test.setTimeout(120_000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/src/main.ts*', async route => {
      const response = await route.fetch({ maxRetries: 2 });
      await route.fulfill({ response, body: await response.text() + '\nwindow.__npcMotionGame = game;' });
    });
    await page.goto('/'); await enterGame(page);
    await page.getByRole('button', { name: 'Salva la partita', exact: true }).tap();
    const before = await readBrowserSave(page);
    await page.goto(`/?npcAnimationPreview=${encodeURIComponent(profile.id)}`);
    await expect(page.getByRole('region', { name: `Prova animazioni ${profile.description.split(',')[0]}` })).toBeVisible();
    await expect.poll(() => observe(page)).not.toBeNull();
    await expect(page.getByRole('checkbox', { name: 'Movimento ridotto' })).toBeChecked({ checked: reducedMotion === 'reduce' });
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      for (const [direction, label] of [['up', 'nord'], ['right', 'est'], ['down', 'sud'], ['left', 'ovest']] as const) {
        const start = (await observe(page))!;
        await page.getByRole('button', { name: `Cammina verso ${label}`, exact: true }).click();
        await expect.poll(async () => (await observe(page))?.motion).toBe('walk');
        const keys = new Set<string>();
        await expect.poll(async () => {
          const state = (await observe(page))!; keys.add(state.key);
          return reducedMotion === 'reduce' ? state.elapsed > profile.walkCycle!.frameDurationMs * 3 : keys.size === profile.walkCycle!.views[direction].length;
        }, { intervals: [50, 75, 100] }).toBe(true);
        const moving = (await observe(page))!;
        expect(moving.x).toBe(moving.logical.x); expect(moving.y).toBe(moving.logical.y);
        expect(moving.logical).not.toEqual(start.logical);
        expect(moving.worldActive).toBe(false); expect(moving.flipped).toBe(false);
        expect(moving.scaleX).toBeCloseTo(moving.scaleY, 8);
        const authored = walkManifest.profiles.find(entry => entry.profileId === profile.id)!.frames.find(frame => frame.assetKey === moving.key)!;
        expect(moving.width / moving.height).toBeCloseTo(authored.width / authored.height, 6);
        const expectedKeys = profile.walkCycle!.views[direction].map(pose => pose.assetKey);
        expect([...keys].every(key => expectedKeys.includes(key))).toBe(true);
        if (reducedMotion === 'reduce') expect([...keys]).toEqual([expectedKeys[0]]);
        await page.screenshot({ path: info.outputPath(`${profile.id}-walk-${direction}-${viewport.width}-${reducedMotion}.png`) });
        await page.getByRole('button', { name: 'Ferma', exact: true }).click();
        await expect.poll(async () => (await observe(page))?.key).toBe(profile.idleViews![direction].assetKey);
        const stopped = (await observe(page))!;
        await expect.poll(async () => (await observe(page))?.elapsed).toBeGreaterThan(300);
        expect((await observe(page))!.logical).toEqual(stopped.logical);
      }
    }
    expect(await readBrowserSave(page)).toEqual(before);
    expect(errors).toEqual([]);
  });
});
