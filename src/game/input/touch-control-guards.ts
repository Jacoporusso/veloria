/** Suppress native long-press UI only on the game's touch controls. */
export function guardTouchControls(footer: HTMLElement): void {
  const preventDefault = (event: Event): void => event.preventDefault();
  footer.addEventListener('contextmenu', preventDefault);
  footer.addEventListener('selectstart', preventDefault);
  footer.addEventListener('dragstart', preventDefault);

  // Android can start its text/callout gesture from touchstart even when
  // pointerdown was cancelled. D-pad movement already uses pointer events.
  // Action buttons retain their native click (A/B/save and keyboard activation).
  footer.querySelector<HTMLElement>('.dpad')?.addEventListener('touchstart', preventDefault, { passive: false });
}
