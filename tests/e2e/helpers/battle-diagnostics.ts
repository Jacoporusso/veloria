import type { Page } from '@playwright/test';

/** Failure evidence only: this never advances messages or changes scene timing. */
export async function readBattleDiagnostics(page: Page, gameGlobal: string) {
  return page.evaluate(key => {
    const scene = (window as any)[key]?.scene.keys.battle;
    if (!scene) return { mode: 'missing', terminal: false };
    const timer = scene.messageTimer;
    return {
      observedAt: performance.now(),
      mode: scene.mode,
      terminal: scene.terminalShown,
      active: scene.sys.isActive(),
      visibility: document.visibilityState,
      queue: scene.pendingMessages.map((message: any) => ({
        type: message.event?.type,
        side: message.event?.side,
        text: message.text,
      })),
      timer: timer ? {
        elapsed: timer.elapsed, delay: timer.delay, paused: timer.paused,
        timeScale: timer.timeScale, dispatched: timer.hasDispatched,
      } : null,
      clock: { now: scene.time.now, paused: scene.time.paused, timeScale: scene.time.timeScale },
      loop: { delta: scene.game.loop.delta, actualFps: scene.game.loop.actualFps },
    };
  }, gameGlobal);
}
