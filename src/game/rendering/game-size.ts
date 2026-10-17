import type Phaser from 'phaser';

/** Observe the actual play surface, including mobile orientation and dynamic viewport changes. */
export function observeGameSize(game: Phaser.Game, parent: HTMLElement): void {
  let frame: number | undefined;
  const resize = () => {
    frame = undefined;
    if (!game.isBooted) return;
    const width = parent.clientWidth, height = parent.clientHeight;
    if (width > 0 && height > 0 && (game.scale.width !== width || game.scale.height !== height)) game.scale.resize(width, height);
  };
  const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(resize); };
  const observer = new ResizeObserver(schedule);
  observer.observe(parent);
  game.events.once('ready', schedule);
  game.events.once('destroy', () => {
    observer.disconnect();
    game.events.off('ready', schedule);
    if (frame !== undefined) cancelAnimationFrame(frame);
  });
  schedule();
}
