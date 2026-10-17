import { observeGameSize } from './game/rendering/game-size.ts';
import Phaser from 'phaser';
import './style.css';
import './mobile-controls.css';
import './dialogue.css';
import './settings.css';
import { loadSave, newGameSave, saveGame, type GameSave } from './persistence/save-store';
import { chooseGameSession } from './game/ui/StartScreen';
import { personalizeNewGame } from './core/party/trainer-profile';
import { WorldScene } from './game/scenes/WorldScene';
import { AudioManager } from './game/audio/audio-manager';
import { getMap, getSpawn, listMaps } from './game/maps/map-registry';
import { createUniqueId } from './persistence/save-store';
import { selectStarter, starters } from './core/party/select-starter';
import { guardTouchControls } from './game/input/touch-control-guards';
import { ExplorationMenu } from './game/ui/ExplorationMenu';

const explorationMenu = new ExplorationMenu();
if (import.meta.hot) import.meta.hot.dispose(() => explorationMenu.destroy());

const touchFooter = document.querySelector<HTMLElement>('.game-footer');
if (touchFooter) guardTouchControls(touchFooter);

const audio = new AudioManager();
window.addEventListener('pointerdown', () => { void audio.unlock(); }, { once: true });
window.addEventListener('keydown', () => { void audio.unlock(); }, { once: true });
const audioToggle = document.querySelector<HTMLButtonElement>('#audio-toggle');
const syncAudioButton = () => {
  if (!audioToggle) return;
  audioToggle.textContent = audio.isMuted ? 'Attiva audio' : 'Disattiva audio';
  audioToggle.setAttribute('aria-pressed', String(!audio.isMuted));
};
audioToggle?.addEventListener('click', () => { audio.setMuted(!audio.isMuted); void audio.unlock(); syncAudioButton(); });
syncAudioButton();
const musicVolume = document.querySelector<HTMLInputElement>('#music-volume');
if (musicVolume) {
  musicVolume.value = String(Math.round(audio.volumeLevel * 100));
  musicVolume.addEventListener('input', () => audio.setVolume(Number(musicVolume.value) / 100));
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const updateButton = document.querySelector<HTMLButtonElement>('#update-button');
  void navigator.serviceWorker.register('./sw.js').then(registration => {
      const offerUpdate = (worker: ServiceWorker | null) => {
        if (!worker || !updateButton) return;
        updateButton.hidden = false;
        updateButton.title = 'Nuova versione disponibile · aggiorna quando hai salvato';
        updateButton.setAttribute('aria-label', 'Nuova versione disponibile. Aggiorna Veloria');
        updateButton.onclick = () => {
          if (document.body.classList.contains('battle-active')) return;
          worker.postMessage('SKIP_WAITING');
          updateButton.disabled = true;
          updateButton.textContent = '…';
        };
      };
      offerUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(installing);
        });
      });
      let refreshing = false;
      let controlled = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // First installation already runs this build: claim it without reloading.
        // Subsequent worker updates must reload once to activate the new bundle.
        if (!controlled) { controlled = true; return; }
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
  }).catch(() => undefined);
}


const requestedPreviewMapId = import.meta.env.DEV ? new URLSearchParams(location.search).get('previewMap') : null;
const previewMapId = requestedPreviewMapId && listMaps().some(map => map.metadata.id === requestedPreviewMapId)
  ? requestedPreviewMapId
  : null;
let save: GameSave;
if (previewMapId) {
  const map = getMap(previewMapId);
  const spawn = getSpawn(map, map.metadata.spawns[0].id);
  const preview = newGameSave();
  preview.player = { ...preview.player, mapId: map.metadata.id, spawnPointId: spawn.id, x: spawn.x, y: spawn.y };
  preview.flags = [...preview.flags, 'badge_aurora_awarded', 'q_research_sample_received', 'q_ada_helped'];
  save = selectStarter(preview, starters[0].speciesId, createUniqueId()) ?? preview;
} else {
  const existing = await loadSave();
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (shell) shell.inert = true;
  try {
    let created: GameSave | undefined;
    const choice = await chooseGameSession(existing, async name => {
      const candidate = personalizeNewGame(newGameSave(), name);
      await saveGame(candidate);
      created = candidate;
    });
    if (choice.kind === 'continue' && existing) save = existing;
    else if (created) save = created;
    else throw new Error('Nessuna partita disponibile.');
  } finally {
    if (shell) shell.inert = false;
  }
}

if (import.meta.env.DEV) {
  const stage = document.querySelector<HTMLElement>('.game-stage');
  if (stage) {
    const picker = document.createElement('label');
    picker.className = 'dev-map-picker';
    picker.textContent = 'MAPPA DI PROVA';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Seleziona una mappa da provare');
    select.add(new Option('Partita normale', ''));
    for (const map of listMaps()) select.add(new Option(map.metadata.displayName, map.metadata.id));
    select.value = previewMapId ?? '';
    select.addEventListener('change', () => {
      const url = new URL(location.href);
      if (select.value) url.searchParams.set('previewMap', select.value);
      else url.searchParams.delete('previewMap');
      location.assign(url);
    });
    picker.append(select);
    document.querySelector('#exploration-menu')?.append(picker);
    if (previewMapId) {
      const banner = document.createElement('div');
      banner.className = 'dev-preview-banner';
      banner.textContent = 'ANTEPRIMA · progressi non salvati';
      stage.append(banner);
    }
  }
}
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // Veloria's optional music uses AudioManager after a user gesture; Phaser's
  // unused Web Audio manager otherwise attempts an autoplay context at boot.
  audio: { noAudio: true },
  backgroundColor: '#17251d',
  pixelArt: false,
  antialias: true,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [new WorldScene(save, themeId => audio.setTheme(themeId), Boolean(previewMapId))],
  render: { roundPixels: false, antialias: true },
});


observeGameSize(game, document.querySelector<HTMLElement>('#game')!);
