import '../../item-evolution-menu.css';

/** Keeps the paused caller at a durable-save boundary until persistence succeeds. */
export async function ensureSavedProgress(save: () => Promise<boolean>, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return false;
  const attempt = async (): Promise<boolean> => {
    try { return await save(); }
    catch { return false; }
  };
  const initial = await new Promise<boolean>(resolve => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', aborted);
      resolve(value);
    };
    const aborted = () => finish(false);
    signal?.addEventListener('abort', aborted, { once: true });
    void attempt().then(finish);
  });
  if (signal?.aborted) return false;
  if (initial) return true;
  return new Promise(resolve => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controller = new AbortController();
    const overlay = document.createElement('div');
    overlay.className = 'item-evolution save-retry-dialog';
    // It can be required while a battle or an evolution presentation is mounted.
    overlay.style.zIndex = '110';
    const panel = document.createElement('section');
    panel.className = 'item-evolution__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'save-retry-title');
    const heading = document.createElement('header');
    heading.className = 'item-evolution__header';
    const title = document.createElement('h2');
    title.id = 'save-retry-title';
    title.textContent = 'Salvataggio da completare';
    heading.append(title);
    const content = document.createElement('div');
    content.className = 'item-evolution__content';
    content.tabIndex = 0;
    const message = document.createElement('p');
    message.className = 'item-evolution__intro';
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    message.textContent = 'Non è stato possibile salvare i progressi. Riprova per continuare.';
    content.append(message);
    const footer = document.createElement('footer');
    footer.className = 'item-evolution__footer';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'item-evolution__button is-primary';
    retry.textContent = 'Riprova salvataggio';
    footer.append(retry);
    panel.append(heading, content, footer);
    overlay.append(panel);
    document.body.append(overlay);
    let busy = false;
    let settled = false;
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      controller.abort();
      overlay.remove();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      resolve(success);
    };
    retry.addEventListener('click', async () => {
      if (busy || settled) return;
      busy = true;
      retry.disabled = true;
      panel.setAttribute('aria-busy', 'true');
      message.textContent = 'Salvataggio in corso…';
      const saved = await attempt();
      if (settled) return;
      if (saved) { finish(true); return; }
      busy = false;
      retry.disabled = false;
      panel.removeAttribute('aria-busy');
      message.textContent = 'Il salvataggio non è ancora riuscito. Controlla lo spazio disponibile e riprova.';
      retry.focus({ preventScroll: true });
    }, { signal: controller.signal });
    document.addEventListener('keydown', event => {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        event.preventDefault();
        const target = busy || document.activeElement === retry ? content : retry;
        target.focus({ preventScroll: true });
      } else if (['Escape', 'b', 'B', 'Backspace'].includes(event.key)) event.preventDefault();
      else if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat && !busy) retry.click();
      }
    }, { capture: true, signal: controller.signal });
    for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) {
      overlay.addEventListener(type, event => event.stopPropagation(), { signal: controller.signal });
    }
    signal?.addEventListener('abort', () => finish(false), { once: true, signal: controller.signal });
    retry.focus({ preventScroll: true });
  });
}
