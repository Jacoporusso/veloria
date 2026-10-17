import type { GameSave } from '../../persistence/save-types.ts';
import { normalizeTrainerName } from '../../core/party/trainer-profile.ts';
import { getMap } from '../maps/map-registry.ts';
import '../../start-screen.css';

export type GameSessionChoice = { kind: 'continue' } | { kind: 'new'; name: string };

const MAX_NAME_LENGTH = 16;

function mapLabel(mapId: string): string {
  try {
    return getMap(mapId).metadata.displayName;
  } catch {
    return mapId.replaceAll('-', ' ').replaceAll('_', ' ');
  }
}

function brandMark(): string {
  return `<svg class="start-screen__mark" viewBox="0 0 48 54" fill="none" aria-hidden="true">
    <defs><linearGradient id="veloria-start-v" x1="4" y1="3" x2="43" y2="52" gradientUnits="userSpaceOnUse"><stop stop-color="#afffe3"/><stop offset=".52" stop-color="#79cfff"/><stop offset="1" stop-color="#c6b1ff"/></linearGradient></defs>
    <path d="M4 9 20 45a4 4 0 0 0 8 0L44 9" stroke="url(#veloria-start-v)" stroke-width="6" stroke-linecap="round"/>
    <path d="m24 2 3.1 7.2L34 12l-6.9 2.8L24 22l-3.1-7.2L14 12l6.9-2.8L24 2Z" fill="#fff"/>
  </svg>`;
}

/** Mounts an accessible title screen and resolves only after the player makes a choice. */
export async function chooseGameSession(existing: GameSave | null, createGame: (name: string) => Promise<void>): Promise<GameSessionChoice> {
  return new Promise(resolve => {
    const root = document.createElement('main');
    root.className = 'start-screen';
    root.setAttribute('aria-label', 'Veloria, schermata iniziale');

    const saveSummary = existing
      ? `<p class="start-screen__save-line"><span class="start-screen__status" aria-hidden="true"></span> Viaggiatore <strong>${escapeHtml(existing.player.name)}</strong></p>
         <p class="start-screen__save-meta">${escapeHtml(mapLabel(existing.player.mapId))}<span aria-hidden="true"> · </span>${existing.badges.length} ${existing.badges.length === 1 ? 'medaglia' : 'medaglie'}</p>`
      : '';

    root.innerHTML = `
      <div class="start-screen__backdrop" aria-hidden="true"></div>
      <div class="start-screen__veil" aria-hidden="true"></div>
      <header class="start-screen__brand">${brandMark()}<div><span class="start-screen__wordmark">VELORIA</span><span class="start-screen__edition">ATLANTE DELLE MERAVIGLIE</span></div></header>
      <section class="start-screen__content" aria-labelledby="start-screen-title">
        <p class="start-screen__eyebrow">Un mondo da scoprire</p>
        <h1 id="start-screen-title">Il viaggio<br><span>comincia qui.</span></h1>
        <p class="start-screen__intro">Attraversa terre lontane, incontra nuovi compagni e scrivi la tua storia.</p>
        <div class="start-screen__actions" aria-label="Scegli come iniziare">
          ${existing ? `<button class="start-screen__button start-screen__button--primary" type="button" data-action="continue" aria-label="Continua partita"><span class="start-screen__button-icon" aria-hidden="true">▶</span><span>Continua partita<small>Riprendi da ${escapeHtml(mapLabel(existing.player.mapId))}</small></span><span class="start-screen__arrow" aria-hidden="true">↗</span></button>` : ''}
          <button class="start-screen__button ${existing ? 'start-screen__button--secondary' : 'start-screen__button--primary'}" type="button" data-action="new" aria-label="Nuova partita"><span class="start-screen__button-icon" aria-hidden="true">✦</span><span>Nuova partita<small>${existing ? 'Inizia un nuovo viaggio' : 'Crea il tuo personaggio'}</small></span><span class="start-screen__arrow" aria-hidden="true">↗</span></button>
        </div>
        ${existing ? `<aside class="start-screen__save-card" aria-label="Riepilogo salvataggio">${saveSummary}</aside>` : ''}
        <div class="start-screen__flow" data-flow aria-live="polite"></div>
      </section>
      <footer class="start-screen__footer"><span>UN’AVVENTURA ORIGINALE</span><span class="start-screen__footer-dot" aria-hidden="true">✦</span><span>IL TUO MONDO TI ASPETTA</span></footer>`;

    document.body.append(root);
    const content = root.querySelector<HTMLElement>('.start-screen__content')!;
    const flow = root.querySelector<HTMLElement>('[data-flow]')!;
    const newButton = root.querySelector<HTMLButtonElement>('[data-action="new"]')!;
    const flowId = 'start-screen-flow-title';
    let settled = false;
    let saving = false;

    const finish = (choice: GameSessionChoice) => {
      if (settled) return;
      settled = true;
      root.remove();
      resolve(choice);
    };

    root.querySelector<HTMLButtonElement>('[data-action="continue"]')?.addEventListener('click', () => finish({ kind: 'continue' }));
    newButton.addEventListener('click', () => {
      if (existing) showConfirmation();
      else showNameForm();
    });

    function showConfirmation(): void {
      root.classList.add('start-screen--editing');
      flow.innerHTML = `<section class="start-screen__dialog" role="dialog" aria-labelledby="${flowId}" aria-describedby="start-screen-confirm-description">
        <p class="start-screen__dialog-kicker">Nuovo capitolo</p><h2 id="${flowId}">Cominciare una nuova partita?</h2>
        <p id="start-screen-confirm-description">Iniziando un nuovo viaggio sostituirai la partita attuale. Prima di procedere, puoi tornare al gioco ed esportare un backup.</p>
        <div class="start-screen__dialog-actions"><button class="start-screen__small-button" type="button" data-action="cancel">Torna al titolo</button><button class="start-screen__small-button start-screen__small-button--accent" type="button" data-action="confirm">Sì, continua</button></div>
      </section>`;
      flow.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.addEventListener('click', () => {
        flow.replaceChildren();
        root.classList.remove('start-screen--editing');
        newButton.focus({ preventScroll: true });
      });
      flow.querySelector<HTMLButtonElement>('[data-action="confirm"]')!.addEventListener('click', showNameForm);
      flow.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.focus({ preventScroll: true });
      flow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function showNameForm(): void {
      root.classList.add('start-screen--editing');
      flow.innerHTML = `<form class="start-screen__dialog start-screen__name-form" aria-labelledby="${flowId}">
        <p class="start-screen__dialog-kicker">Il tuo nome nel mondo</p><h2 id="${flowId}">Come ti chiami?</h2>
        <label class="start-screen__input-label" for="start-screen-player-name">Nome allenatore</label>
        <input id="start-screen-player-name" name="playerName" type="text" maxlength="32" inputmode="text" autocomplete="nickname" autocapitalize="words" enterkeyhint="done" aria-label="Nome allenatore" aria-describedby="start-screen-name-hint start-screen-name-count" required>
        <div class="start-screen__input-details"><span id="start-screen-name-hint">Da 1 a ${MAX_NAME_LENGTH} caratteri</span><span id="start-screen-name-count" aria-live="polite">0/${MAX_NAME_LENGTH}</span></div>
        <p class="start-screen__form-error" role="alert" hidden></p>
        <div class="start-screen__dialog-actions"><button class="start-screen__small-button" type="button" data-action="back">Indietro</button><button class="start-screen__small-button start-screen__small-button--accent" type="submit" aria-label="Inizia il viaggio">Inizia il viaggio <span aria-hidden="true">↗</span></button></div>
      </form>`;
      const form = flow.querySelector<HTMLFormElement>('form')!;
      const input = form.querySelector<HTMLInputElement>('input')!;
      const count = form.querySelector<HTMLElement>('#start-screen-name-count')!;
      const error = form.querySelector<HTMLElement>('.start-screen__form-error')!;
      input.addEventListener('input', () => {
        const length = nameLength(input.value);
        count.textContent = `${length}/${MAX_NAME_LENGTH}`;
        input.removeAttribute('aria-invalid');
        error.hidden = true;
      });
      form.querySelector<HTMLButtonElement>('[data-action="back"]')!.addEventListener('click', () => {
        flow.replaceChildren();
        root.classList.remove('start-screen--editing');
        newButton.focus({ preventScroll: true });
      });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (saving) return;
        const name = normalizeTrainerName(input.value);
        if (name === null) {
          const length = nameLength(input.value.trim());
          error.textContent = length > MAX_NAME_LENGTH
            ? `Il nome può contenere al massimo ${MAX_NAME_LENGTH} caratteri.`
            : 'Inserisci un nome valido di almeno un carattere.';
          error.hidden = false;
          input.setAttribute('aria-invalid', 'true');
          input.focus({ preventScroll: true });
          return;
        }
        saving = true;
        const buttons = [...form.querySelectorAll<HTMLButtonElement>('button')];
        buttons.forEach(button => button.disabled = true);
        input.readOnly = true;
        try {
          await createGame(name);
          finish({ kind: 'new', name });
        } catch {
          error.textContent = 'Non riesco a salvare la nuova partita. Controlla lo spazio e i permessi del browser, poi riprova.';
          error.hidden = false;
          input.focus({ preventScroll: true });
        } finally {
          saving = false;
          buttons.forEach(button => button.disabled = false);
          input.readOnly = false;
        }
      });
      flow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      requestAnimationFrame(() => input.focus({ preventScroll: true }));
    }

    function onKeydown(event: KeyboardEvent): void {
      if (!saving && event.key === 'Escape' && flow.childElementCount > 0) {
        flow.replaceChildren();
        root.classList.remove('start-screen--editing');
        newButton.focus({ preventScroll: true });
      }
    }
    root.addEventListener('keydown', onKeydown);
    content.querySelector<HTMLElement>('.start-screen__eyebrow')?.setAttribute('tabindex', '-1');
    if (window.matchMedia('(pointer: fine)').matches) {
      (existing ? root.querySelector<HTMLButtonElement>('[data-action="continue"]') : newButton)?.focus({ preventScroll: true });
    }
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

function nameLength(value: string): number {
  return typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)].length
    : [...value].length;
}
