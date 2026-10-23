import '../management-dialog.css';

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  return node;
}

/** Persistent service dialog with focus containment, abort cleanup and input isolation. */
export function managementDialog(title: string, signal?: AbortSignal) {
  const previousFocus = document.activeElement as HTMLElement | null;
  const overlay = element('div', '', 'management-overlay');
  const dialog = element('section', '', 'management-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', title);
  const header = element('header');
  const close = element('button', 'Chiudi');
  close.type = 'button';
  header.append(element('h2', title), close);
  const status = element('p', '', 'management-status');
  status.setAttribute('role', 'status');
  const content = element('div', '', 'management-content');
  const footer = element('footer');
  dialog.append(header, status, content, footer);
  const controller = new AbortController();
  let busy = false;
  let resolve!: () => void;
  const closed = new Promise<void>(done => { resolve = done; });
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    controller.abort();
    signal?.removeEventListener('abort', finish);
    overlay.remove();
    const focus = previousFocus?.isConnected && previousFocus.getClientRects().length ? previousFocus
      : document.querySelector<HTMLButtonElement>('#action-a');
    focus?.focus({ preventScroll: true });
    resolve();
  };
  close.onclick = () => { if (!busy) finish(); };
  document.addEventListener('keydown', event => {
    if (document.querySelector('.save-retry-dialog')) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); if (!busy) finish(); }
    if (event.key === 'Tab') {
      const targets = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')].filter(node => !node.closest('[inert]'));
      event.preventDefault();
      if (targets.length) {
        const index = targets.indexOf(document.activeElement as HTMLElement);
        targets[(index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length].focus();
      }
    }
  }, { capture: true, signal: controller.signal });
  document.addEventListener('keyup', event => {
    if (dialog.contains(document.activeElement)) event.stopImmediatePropagation();
  }, { capture: true, signal: controller.signal });
  overlay.append(dialog);
  document.body.append(overlay);
  close.focus();
  signal?.addEventListener('abort', finish, { once: true });
  if (signal?.aborted) finish();
  return { dialog, content, footer, status, closed,
    setBusy(value: boolean) {
      busy = value;
      close.disabled = value;
      content.inert = value;
      footer.inert = value;
      dialog.setAttribute('aria-busy', String(value));
    },
  };
}
