/** DOM-only navigation adapter; gameplay and save state remain in their owners. */
export class ExplorationMenu {
  private readonly controller = new AbortController();
  private readonly toggle = document.querySelector<HTMLButtonElement>('#menu-button')!;
  private readonly panel = document.querySelector<HTMLElement>('#exploration-menu')!;

  constructor() {
    const options = { signal: this.controller.signal };
    this.toggle.addEventListener('click', () => this.panel.hidden ? this.open() : this.close(), options);
    this.panel.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest('button');
      if (!button) return;
      this.close(false);
      if (button.id === 'journey-button') { this.toggle.focus(); document.querySelector<HTMLButtonElement>('.journey-trigger')?.click(); }
      if (button.id === 'bag-button') { this.toggle.focus(); document.querySelector<HTMLButtonElement>('.wallet-trigger')?.click(); }
    }, options);
    document.addEventListener('pointerdown', event => {
      if (!this.panel.hidden && !this.panel.contains(event.target as Node) && !this.toggle.contains(event.target as Node)) this.close(false);
    }, options);
    document.addEventListener('keydown', event => {
      const subpanel = document.querySelector<HTMLElement>('#settings-menu:not([hidden]), #save-menu:not([hidden])');
      if (this.panel.hidden && !subpanel) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation();
        if (subpanel) subpanel.hidden = true;
        this.close();
      } else if (event.key === 'Tab') {
        const scope = subpanel ?? this.panel;
        const controls = [...scope.querySelectorAll<HTMLElement>('button:not([hidden]), select, input:not([hidden])')];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }, { ...options, capture: true });
    document.querySelector('#action-b')?.addEventListener('click', () => {
      for (const panel of document.querySelectorAll<HTMLElement>('#settings-menu, #save-menu')) panel.hidden = true;
      this.close(false);
    }, options);
  }

  private open(): void {
    for (const panel of document.querySelectorAll<HTMLElement>('#settings-menu, #save-menu')) panel.hidden = true;
    this.panel.hidden = false;
    this.toggle.setAttribute('aria-expanded', 'true');
    this.panel.querySelector<HTMLButtonElement>('button')?.focus();
  }

  private close(restoreFocus = true): void {
    this.panel.hidden = true;
    this.toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) this.toggle.focus();
  }

  destroy(): void { this.controller.abort(); }
}
