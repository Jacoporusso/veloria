import type Phaser from 'phaser';
import { renderDensity } from './display-density.ts';

/** Layout remains in CSS pixels; only the backing canvas and camera use device pixels. */
export function gameViewport(game: Phaser.Game): { width: number; height: number; density: number } {
  const density = renderDensity(1 / game.scale.zoom);
  return { width: game.scale.width / density, height: game.scale.height / density, density };
}

/** Observe the actual play surface, including mobile orientation and dynamic viewport changes. */
export function observeGameSize(game: Phaser.Game, parent: HTMLElement, highDensity = false): void {
  let frame: number | undefined;
  const resize = () => {
    frame = undefined;
    if (!game.isBooted) return;
    const width = parent.clientWidth, height = parent.clientHeight;
    if (width <= 0 || height <= 0) return;
    const density = highDensity ? renderDensity(window.devicePixelRatio, width, height) : 1;
    const pixelWidth = Math.round(width * density), pixelHeight = Math.round(height * density);
    if (game.scale.zoom !== 1 / density) game.scale.setZoom(1 / density);
    if (game.scale.width !== pixelWidth || game.scale.height !== pixelHeight) game.scale.resize(pixelWidth, pixelHeight);
  };
  const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(resize); };
  const observer = new ResizeObserver(schedule);
  observer.observe(parent);
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  game.events.once('ready', schedule);
  game.events.once('destroy', () => {
    observer.disconnect();
    window.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    window.removeEventListener('pageshow', schedule);
    document.removeEventListener('visibilitychange', schedule);
    game.events.off('ready', schedule);
    if (frame !== undefined) cancelAnimationFrame(frame);
  });
  schedule();
}
