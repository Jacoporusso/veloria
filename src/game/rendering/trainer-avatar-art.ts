import type { TrainerAppearance } from '../../core/party/trainer-appearance.ts';
import { loadIllustratedTrainer } from './illustrated-trainer.ts';

/** The editor samples the same composed animation sheet used by the map. */
export function createTrainerAvatarPreview(appearance: TrainerAppearance): HTMLElement {
  const root = document.createElement('div'); root.className = 'trainer-avatar-preview';
  root.setAttribute('role', 'img'); root.setAttribute('aria-label', 'Anteprima del tuo allenatore');
  root.dataset.ready = 'loading';
  root.textContent = 'Prepariamo il tuo allenatore…';
  void loadIllustratedTrainer(appearance).then(sheet => {
    const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 240;
    canvas.getContext('2d')!.drawImage(sheet, 192, 0, 192, 240, 0, 0, 192, 240);
    canvas.setAttribute('aria-hidden', 'true'); root.replaceChildren(canvas); root.dataset.ready = 'true';
  }).catch(() => { root.textContent = 'Immagine non disponibile. Cambia una scelta per riprovare.'; root.dataset.ready = 'error'; });
  return root;
}

export const createTrainerAvatarSheet = loadIllustratedTrainer;
