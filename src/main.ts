import Phaser from 'phaser';
import './style.css';
import './mobile-controls.css';
import './dialogue.css';
import { loadSave, newGameSave } from './persistence/save-store';
import { WorldScene } from './game/scenes/WorldScene';

const save = await loadSave() ?? newGameSave();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#839c67',
  pixelArt: true,
  antialias: false,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [new WorldScene(save)],
  render: { roundPixels: true, antialias: false },
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => undefined));
}

void game;
