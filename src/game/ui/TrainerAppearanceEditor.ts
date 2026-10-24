import { TRAINER_APPEARANCE_OPTIONS, type TrainerAppearance } from '../../core/party/trainer-appearance.ts';
import { createTrainerAvatarPreview } from '../rendering/trainer-avatar-art.ts';
import '../../trainer-appearance.css';

const labels: Record<keyof TrainerAppearance, string> = {
  preset: 'Personaggio', skin: 'Carnagione', hairStyle: 'Capelli', hairColor: 'Colore capelli',
  eyes: 'Occhi', beard: 'Barba', outfit: 'Abbigliamento', backpack: 'Zaino',
};
const values: Record<string, string> = {
  boy: 'Ragazzo', girl: 'Ragazza', light: 'Chiara', medium: 'Media', deep: 'Scura', short: 'Corti',
  curly: 'Ricci', long: 'Lunghi', brown: 'Castani', black: 'Neri', blond: 'Biondi', blue: 'Azzurri',
  green: 'Verdi', none: 'Senza barba', teal: 'Petrolio', lavender: 'Lilla', coral: 'Corallo', mint: 'Menta', navy: 'Blu notte',
};

/** Local draft only. The owner commits it once the user confirms and saving succeeds. */
export function createTrainerAppearanceEditor(initial: TrainerAppearance, onChange: (appearance: TrainerAppearance) => void): HTMLElement {
  let draft = { ...initial };
  const root = document.createElement('section'); root.className = 'trainer-editor';
  root.setAttribute('aria-label', 'Personalizza il tuo allenatore');
  const preview = document.createElement('div'); preview.className = 'trainer-editor__preview';
  const controls = document.createElement('div'); controls.className = 'trainer-editor__controls';
  const selects = new Map<keyof TrainerAppearance, HTMLSelectElement>();
  const update = () => { preview.replaceChildren(createTrainerAvatarPreview(draft)); onChange({ ...draft }); };
  for (const key of Object.keys(TRAINER_APPEARANCE_OPTIONS) as (keyof TrainerAppearance)[]) {
    const label = document.createElement('label'); label.textContent = labels[key];
    const select = document.createElement('select'); select.setAttribute('aria-label', labels[key]);
    for (const value of TRAINER_APPEARANCE_OPTIONS[key]) {
      const option = document.createElement('option'); option.value = value;
      option.textContent = key === 'beard' && value === 'short' ? 'Corta' : values[value];
      select.append(option);
    }
    select.value = draft[key];
    select.addEventListener('change', () => {
      draft = key === 'preset' ? { ...draft, preset: select.value as TrainerAppearance['preset'], hairStyle: select.value === 'girl' ? 'long' : 'short', outfit: select.value === 'girl' ? 'lavender' : 'teal', backpack: select.value === 'girl' ? 'mint' : 'coral' } : { ...draft, [key]: select.value };
      for (const [field, input] of selects) input.value = draft[field];
      update();
    });
    selects.set(key, select); label.append(select); controls.append(label);
  }
  const random = document.createElement('button'); random.type = 'button'; random.textContent = '✦ Aspetto casuale';
  random.className = 'start-screen__small-button';
  random.addEventListener('click', () => {
    for (const key of Object.keys(TRAINER_APPEARANCE_OPTIONS) as (keyof TrainerAppearance)[]) {
      const options = TRAINER_APPEARANCE_OPTIONS[key];
      const value = options[Math.floor(Math.random() * options.length)];
      draft = { ...draft, [key]: value }; selects.get(key)!.value = value;
    }
    update();
  });
  const hint = document.createElement('p'); hint.className = 'trainer-editor__hint';
  hint.textContent = 'Ogni scelta è libera. Puoi cambiare aspetto anche dalle impostazioni.';
  root.append(preview, controls, random, hint); update(); return root;
}

export function showTrainerAppearanceDialog(initial: TrainerAppearance, commit: (appearance: TrainerAppearance) => Promise<boolean>): Promise<boolean> {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog'); dialog.className = 'trainer-avatar-dialog';
    dialog.setAttribute('aria-labelledby', 'trainer-avatar-title');
    const returnFocus = document.activeElement as HTMLElement | null;
    let draft = { ...initial }, saving = false;
    dialog.innerHTML = '<header><span>IL TUO ALLENATORE</span><h2 id="trainer-avatar-title">Un aspetto tutto tuo.</h2></header>';
    dialog.append(createTrainerAppearanceEditor(draft, value => { draft = value; }));
    const error = document.createElement('p'); error.setAttribute('role', 'alert'); error.hidden = true;
    const actions = document.createElement('div'); actions.className = 'start-screen__dialog-actions';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Annulla';
    const save = document.createElement('button'); save.type = 'button'; save.textContent = 'Salva aspetto';
    for (const button of [cancel, save]) button.className = 'start-screen__small-button';
    const close = (changed: boolean) => { dialog.close(); dialog.remove(); (returnFocus?.checkVisibility() ? returnFocus : document.querySelector<HTMLElement>('#menu-button'))?.focus(); resolve(changed); };
    dialog.addEventListener('keydown', event => event.stopPropagation());
    cancel.onclick = () => { if (!saving) close(false); };
    dialog.addEventListener('cancel', event => { event.preventDefault(); if (!saving) close(false); });
    save.onclick = async () => {
      if (saving) return; saving = true;
      const inputs = [...dialog.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select')];
      inputs.forEach(input => input.disabled = true); error.hidden = true;
      try { if (await commit(draft)) { close(true); return; } } catch { /* Keep the draft for retry. */ }
      error.textContent = 'Non riesco a salvare l’aspetto. Le tue scelte sono qui: riprova.'; error.hidden = false;
      saving = false; inputs.forEach(input => input.disabled = false);
    };
    actions.append(cancel, save); dialog.append(error, actions); document.body.append(dialog); dialog.showModal();
  });
}
