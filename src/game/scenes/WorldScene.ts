import { selectOpeningGuidance } from '../../core/quests/opening-guidance.ts';
import { getOpponentPolicy } from '../battle/opponent-policies.ts';
import Phaser from 'phaser';
import { createUniqueId, saveGame, type GameSave } from '../../persistence/save-store';
import { exportSave, importSave } from '../../persistence/save-backup';
import { getStarterName, selectStarter, starters } from '../../core/party/select-starter';
import { applyQuestEvent } from '../../core/quests/apply-quest-event';
import { questCatalog } from '../quests/catalog.ts';
import { selectWildEncounter } from '../../core/encounters/select-encounter.ts';
import { rollEncounterCheck } from '../../core/encounters/roll-encounter-check.ts';
import type { BattleEvent, BattleState } from '../../core/battle/types.ts';
import { adjacentGridPoint, isGridTileOpen, selectAreaTrigger, tryGridMove, type CardinalDirection } from '../../core/world/index.ts';
import { publicAssetUrl } from '../../core/assets/index.ts';
import { getMap, getMapKey, getSpawn, listMaps } from '../maps/map-registry';
import type { MapTrigger, MapInteractable, RegisteredMap } from '../maps/map-types';
import { resolveMapRenderAssets } from '../maps/map-render-assets';
import { getNpcDialogue } from '../interactions/dialogue-catalog';
import { renderMap } from '../rendering/MapRenderer';
import { createAmbientEffectPoints, createGrassSwayPoints, createWaterShimmerPoints, getGrassSwayTween, getWaterShimmerTween } from '../rendering/ambient-effects.ts';
import { battleMoves, battleSpecies, encounterCatalog, trainerCatalog, veloriaBattleRules } from '../battle/catalog.ts';
import { createTrainerBattle, createWildBattle, mergeBattlePlayerState } from '../battle/create-battle-state.ts';
import { healParty } from '../../core/services/healing.ts';
import { moveCreatureToStorage, withdrawCreatureFromStorage } from '../../core/services/party-storage.ts';
import { buildPokedexEntries } from '../../core/party/pokedex.ts';
import { purchaseShopItem } from '../../core/services/shop.ts';
import { itemCatalog, shopCatalog } from '../battle/catalog.ts';
import { preloadCreatureArt, createCreaturePortrait } from '../battle/creature-art.ts';
import { TravelerAnimation, TRAVELER_TEXTURE } from '../rendering/traveler-animation.ts';
import { JourneyPanel } from '../journey/JourneyPanel.ts';
import { worldCameraZoom } from '../rendering/world-camera.ts';
import { battleTypeLabel } from '../battle/presentation.ts';
import { showPrologueCompletion } from '../ui/PrologueCompletion';
import opening from '../../../content/dialogue/opening.v1.json';

type Direction = CardinalDirection;
const TILE = 32;

function consumeBattleItems(inventory: Record<string, number>, events: readonly BattleEvent[]): Record<string, number> {
  const next = { ...inventory };
  for (const event of events) {
    const consumed = event.type === 'itemUsed' && event.side === 'player'
      ? event.itemId
      : event.type === 'captureAttempted'
        ? event.itemId
        : undefined;
    if (consumed) next[consumed] = Math.max(0, (next[consumed] ?? 0) - 1);
  }
  return next;
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerTile = { x: 20, y: 20 };
  private map!: RegisteredMap;
  private mapLayer!: Phaser.GameObjects.Container;
  private renderedMap!: ReturnType<typeof renderMap>;
  private save: GameSave;
  private saveQueue = Promise.resolve();
  private afterDialogue: (() => void) | null = null;
  private starterChoices!: HTMLElement;
  private moving = false;
  private heldDirection: Direction | null = null;
  private queuedDirection: Direction | null = null;
  private activeTriggerId: string | null = null;
  private facing: Direction = 'down';
  private dialogueLines: string[] = [];
  private dialogueIndex = 0;
  private dialogueBox!: HTMLElement;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private occupied = new Set<string>();
  private playerSprite!: Phaser.GameObjects.Sprite;
  private traveler!: TravelerAnimation;
  private journey?: JourneyPanel;
  private pendingQuestCelebrations: string[] = [];
  private promptTargetId = '';
  private openingGuidance?: Phaser.GameObjects.Text;
  private openingGuidanceKey = '';
  private completionActive = false;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private battleActive = false;
  private battleSceneReady: Promise<void> | null = null;
  private mapTransitionLoading = false;
  private typingTimer?: number;
  private typingTarget?: HTMLElement;
  private typingText = '';
  private typingCharacters: string[] = [];
  private typingIndex = 0;
  private pokedexOpen = false;
  private pokedexReturnFocus?: HTMLElement;
  private readonly onMusicThemeChange: (themeId: string) => void;
  private readonly previewMode: boolean;
  private reducedAnimations = false;
  private ambientTweenTargets: Phaser.GameObjects.GameObject[] = [];

  constructor(save: GameSave, onMusicThemeChange: (themeId: string) => void = () => undefined, previewMode = false) {
    super('world');
    this.save = save;
    this.onMusicThemeChange = onMusicThemeChange;
    this.previewMode = previewMode;
  }

  preload() {
    const assetUrl = (path: string) => publicAssetUrl(path, import.meta.env.BASE_URL);
    this.load.image(TRAVELER_TEXTURE, assetUrl('assets/sprites/veloria-traveler-walk-v2.png'));
    preloadCreatureArt(this);
    const maps = listMaps();
    let initialMap: RegisteredMap;
    try { initialMap = getMap(this.save.player.mapId); }
    catch { initialMap = getMap('veloria/borgofonte'); }
    for (const asset of resolveMapRenderAssets([initialMap.metadata])) {
      this.load.image(asset.key, assetUrl(asset.path));
    }
    for (const map of maps) this.load.tilemapTiledJSON(getMapKey(map), assetUrl(map.metadata.tiledAsset));
  }

  create() {
    try { this.map = getMap(this.save.player.mapId); }
    catch { this.map = getMap('veloria/borgofonte'); this.save.player.mapId = this.map.metadata.id; this.save.player.spawnPointId = 'start'; }
    this.reducedAnimations = this.getAnimationQuality() === 'reduced';
    this.playerTile = { x: this.save.player.x, y: this.save.player.y };
    this.drawWorld();
    if (!isGridTileOpen(this.playerTile, this.renderedMap.width, this.renderedMap.height, this.occupied)) {
      const spawn = getSpawn(this.map, this.save.player.spawnPointId);
      this.playerTile = { x: spawn.x, y: spawn.y };
      this.save.player.x = spawn.x; this.save.player.y = spawn.y;
    }

    this.player = this.makePlayer();
    this.mapLayer.add(this.player);
    this.player.setPosition(this.playerTile.x * TILE + TILE / 2, this.playerTile.y * TILE + TILE / 2).setDepth(this.player.y + 20);
    this.cameras.main.startFollow(this.player, true, .12, .12);
    this.cameras.main.setDeadzone(100, 60);
    this.fitWorldCamera();
    this.dialogueBox=document.querySelector<HTMLElement>('#dialogue-box')!;
    this.starterChoices=document.querySelector<HTMLElement>('#starter-choices')!;
    const stage = document.querySelector<HTMLElement>('.game-stage');
    if (stage) {
      this.journey = new JourneyPanel(stage);
      this.journey.update(this.save);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.journey?.destroy());
    }
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,M,P') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-E', () => this.advanceOrInteract());
    this.input.keyboard!.on('keydown-SPACE', () => this.advanceOrInteract());
    this.input.keyboard!.on('keydown-M', () => this.persistProgress(true));
    this.input.keyboard!.on('keydown-P', () => this.openPokedex(document.querySelector<HTMLElement>('#pokedex-button')!));
    this.bindTouchControls();
    this.scale.on('resize', this.fitWorldCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.fitWorldCamera, this));
    window.setTimeout(() => { const loading = document.querySelector<HTMLElement>('#game-loading'); if (loading) loading.hidden = true; }, 120);
    if (!this.previewMode && this.save.flags.includes('intro_started') && !this.save.flags.includes('intro_completed')) {
      this.afterDialogue = () => {
        this.save.flags = [...new Set([...this.save.flags, 'intro_completed'])];
        this.persistProgress();
      };
      this.showDialogue(opening.speaker, opening.lines);
    } else if (!this.previewMode && this.save.flags.includes('intro_started') && this.save.flags.includes('badge_aurora_awarded') && !this.save.flags.includes('prologue_complete_seen')) {
      void this.presentPrologueCompletion();
    }
    if (this.map.metadata.id === 'veloria/borgofonte' && !this.save.flags.includes('q_starter_selected')) {
      this.showToast('Elia ti aspetta nel laboratorio. Entra dalla porta sul lato sud.');
    }
  }

  private fitWorldCamera(): void {
    const width = this.renderedMap.width * TILE, height = this.renderedMap.height * TILE;
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setZoom(worldCameraZoom(this.scale, { width, height }));
    this.cameras.main.centerOn(this.player.x, this.player.y);
  }

  private get navigationOpen(): boolean {
    return this.completionActive || Boolean(document.querySelector('#exploration-menu:not([hidden]), #settings-menu:not([hidden]), #save-menu:not([hidden])'));
  }

  private updateInteractionPrompt(): void {
    const prompt = document.querySelector<HTMLButtonElement>('#interaction-prompt');
    if (!prompt) return;
    const blocked = this.navigationOpen || this.moving || this.battleActive || this.mapTransitionLoading || this.dialogueLines.length > 0 || this.starterChoices?.hidden === false || this.pokedexOpen || this.journey?.isOpen;
    const guidanceKey = this.map.metadata.id + '|' + this.save.flags.join('|');
    if (!this.mapTransitionLoading && guidanceKey !== this.openingGuidanceKey) this.drawOpeningGuidance();
    this.openingGuidance?.setVisible(!blocked);
    const adjacent = adjacentGridPoint(this.playerTile, this.facing);
    const target = !blocked && this.interactableAtTile(adjacent.x, adjacent.y);
    prompt.hidden = !target;
    if (target && this.promptTargetId !== target.id) {
      const verb = target.kind === 'npc' ? 'Parla con' : target.kind === 'pickup' ? 'Raccogli' : 'Esamina';
      prompt.textContent = 'A · ' + verb + ' ' + target.name;
      this.promptTargetId = target.id;
    }
  }

  private async presentPrologueCompletion(activationKey?: string): Promise<void> {
    if (this.completionActive || this.save.flags.includes('prologue_complete_seen')) return;
    this.completionActive = true;
    this.heldDirection = null;
    this.queuedDirection = null;
    const shell = document.querySelector<HTMLElement>('.game-shell');
    if (shell) shell.inert = true;
    this.scene.pause('world');
    try {
      await showPrologueCompletion(this.save, activationKey);
      this.save.flags = [...new Set([...this.save.flags, 'prologue_complete_seen'])];
      this.persistProgress();
    } finally {
      if (shell) shell.inert = false;
      this.completionActive = false;
      document.querySelector<HTMLButtonElement>('#menu-button')?.focus({ preventScroll: true });
      this.scene.resume('world');
    }
  }

  private drawWorld() {
    this.renderedMap = renderMap(this, this.map, this.save.flags);
    this.mapLayer = this.renderedMap.container;
    this.drawOpeningGuidance();
    this.renderAmbientEffects();
    this.occupied = this.renderedMap.occupied;
    this.onMusicThemeChange(this.map.metadata.musicId);
    const location = document.querySelector<HTMLElement>('#current-location');
    if (location) location.textContent = this.map.metadata.displayName.toLocaleUpperCase('it');
    document.querySelector('#game')?.setAttribute('aria-label', `Mappa interattiva: ${this.map.metadata.displayName}`);
  }

  private drawOpeningGuidance(): void {
    this.openingGuidance?.destroy();
    this.openingGuidance = undefined;
    this.openingGuidanceKey = this.map.metadata.id + '|' + this.save.flags.join('|');
    const guidance = selectOpeningGuidance(this.map.metadata.id, this.save.flags, opening.guidance);
    if (!guidance) return;
    const target = guidance.destinationMapId
      ? this.renderedMap.triggers.find(trigger => trigger.destinationMapId === guidance.destinationMapId)
      : this.renderedMap.interactables.find(item => item.properties.npcId === guidance.npcId || item.properties.dialogueId === guidance.npcId || item.id === guidance.npcId);
    if (!target) return;
    const marker = this.add.text(target.x + target.width / 2, target.y - 12, guidance.label, {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#d3fff0', backgroundColor: '#163e50',
      padding: { x: 8, y: 6 },
    }).setOrigin(.5, 1).setDepth(100000);
    this.mapLayer.add(marker);
    this.openingGuidance = marker;
  }

  private renderAmbientEffects() {
    for (const effect of this.map.metadata.ambientEffects ?? []) {
      if (effect.kind === 'fireflies') {
        for (const point of createAmbientEffectPoints(this.map.metadata.id, effect)) {
          const color = Number.parseInt(point.color.slice(1), 16);
          const glow = this.add.circle(point.x, point.y, 7, color, this.reducedAnimations ? .12 : .26).setDepth(point.y + 1);
          const core = this.add.circle(point.x, point.y, 2.4, color, this.reducedAnimations ? .55 : .95).setDepth(point.y + 2);
          this.mapLayer.add([glow, core]);
          if (this.reducedAnimations) continue;
          this.ambientTweenTargets.push(glow, core);
          const delay = point.phase * 2600;
          const duration = 2100 + point.phase * 1800;
          this.tweens.add({
            targets: glow, alpha: { from: .08, to: .3 }, y: point.y - 5, duration, delay,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          this.tweens.add({
            targets: core, alpha: { from: .45, to: 1 }, y: point.y - 5, duration: duration * .8, delay: delay + duration * .2,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        }
        continue;
      }

      if (effect.kind === 'water-shimmer') {
        for (const point of createWaterShimmerPoints(this.map.metadata.id, effect)) {
          const highlight = this.add.ellipse(point.x, point.y, 9, 2, Number.parseInt(point.color.slice(1), 16), this.reducedAnimations ? .13 : .42)
            .setDepth(point.y + 3);
          this.mapLayer.add(highlight);
          const tween = getWaterShimmerTween(point, this.reducedAnimations);
          if (!tween) continue;
          this.ambientTweenTargets.push(highlight);
          this.tweens.add({ targets: highlight, ...tween });
        }
        continue;
      }

      const grassAreas = this.renderedMap.triggers
        .filter(trigger => effect.triggerIds.includes(trigger.id) && trigger.kind === 'encounter-zone')
        .map(({ x, y, width, height }) => ({ x, y, width, height }));
      for (const point of createGrassSwayPoints(this.map.metadata.id, effect, grassAreas)) {
        const tuft = this.add.container(point.x, point.y).setDepth(point.y + 10).setScale(point.scale);
        const blades = this.add.graphics();
        blades.fillStyle(Number.parseInt(point.color.slice(1), 16), .92);
        blades.fillRect(-5, -3, 2, 3);
        blades.fillRect(-3, -5, 2, 5);
        blades.fillRect(-1, -7, 2, 7);
        blades.fillRect(1, -5, 2, 5);
        blades.fillStyle(0xb7ca7a, .9);
        blades.fillRect(-2, -6, 1, 3);
        blades.fillRect(2, -4, 1, 2);
        tuft.add(blades);
        this.mapLayer.add(tuft);
        const tween = getGrassSwayTween(point, this.reducedAnimations);
        if (!tween) continue;
        this.ambientTweenTargets.push(tuft);
        this.tweens.add({ targets: tuft, ...tween });
      }
    }
  }

  private getAnimationQuality(): 'full' | 'reduced' {
    let preference: string | null = null;
    try { preference = localStorage.getItem('veloria-animation-quality'); }
    catch { /* Use the platform accessibility preference. */ }
    return preference === 'full' || preference === 'reduced'
      ? preference
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
  }

  private destroyMapLayer() {
    for (const target of this.ambientTweenTargets) this.tweens.killTweensOf(target);
    this.ambientTweenTargets = [];
    this.mapLayer.destroy(true);
  }
  private openPokedex(returnFocus: HTMLElement) {
    const panel = document.querySelector<HTMLElement>('#pokedex-panel');
    const list = document.querySelector<HTMLOListElement>('#pokedex-list');
    const summary = document.querySelector<HTMLElement>('#pokedex-summary');
    if (!panel || !list || !summary) return;

    const entries = buildPokedexEntries(battleSpecies, this.save.party, this.save.storage);
    const registered = entries.filter(entry => entry.registered);
    summary.textContent = `${registered.length} di ${entries.length} specie del primo arco registrate · ${this.save.party.length}/6 in squadra · ${this.save.storage.length} nel box`;
    list.replaceChildren(...registered.map(entry => {
      const item = document.createElement('li');
      item.className = 'pokedex-entry';
      const number = document.createElement('span');
      number.className = 'pokedex-number';
      number.textContent = `N° ${String(entry.speciesId).padStart(3, '0')}`;
      const name = document.createElement('span');
      name.className = 'pokedex-name';
      name.textContent = entry.name;
      const count = document.createElement('span');
      count.className = 'pokedex-count';
      count.textContent = entry.partyCount ? `SQUADRA ×${entry.partyCount}` : `BOX ×${entry.storageCount}`;
      item.append(createCreaturePortrait(entry.speciesId), number, name, count);
      return item;
    }));
    if (registered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'pokedex-empty';
      empty.textContent = 'Scegli il tuo primo compagno per iniziare il registro.';
      list.append(empty);
    }
    panel.hidden = false;
    this.pokedexOpen = true;
    this.pokedexReturnFocus = returnFocus.closest('.exploration-menu') ? document.querySelector<HTMLElement>('#menu-button') ?? returnFocus : returnFocus;
    document.querySelector<HTMLButtonElement>('#pokedex-close')?.focus();
  }

  private refreshMapVisuals() {
    this.mapLayer.remove(this.player, false);
    this.destroyMapLayer();
    this.drawWorld();
    this.mapLayer.add(this.player);
    this.player.setDepth(this.player.y + 20);
  }

  private closePokedex() {
    const panel = document.querySelector<HTMLElement>('#pokedex-panel');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    this.pokedexOpen = false;
    this.pokedexReturnFocus?.focus();
    this.pokedexReturnFocus = undefined;
  }

  private makePlayer() {
    const player = this.add.container(0, 0).setSize(25, 40);
    const shadow = this.add.ellipse(0, 20, 24, 8, 0x24382e, .38);
    this.traveler = new TravelerAnimation(this);
    this.playerSprite = this.traveler.sprite;
    player.add([shadow, this.playerSprite]);
    return player;
  }

  private drawFace() {
    this.traveler?.face(this.facing);
  }

  private bindTouchControls() {
    const buttons=document.querySelectorAll<HTMLButtonElement>('.dpad-key');
    buttons.forEach(button=>{
      const dir=button.dataset.direction as Direction;
      const start=(event:Event)=>{event.preventDefault();button.classList.add('pressed');this.heldDirection=dir;this.tryMove(dir);};
      const stop=()=>{button.classList.remove('pressed');if(this.heldDirection===dir)this.heldDirection=null;};
      button.addEventListener('pointerdown',start);button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('pointerleave',stop);
    });
    document.querySelector('#action-a')?.addEventListener('click',()=>this.advanceOrInteract());
    document.querySelector('#interaction-prompt')?.addEventListener('click',()=>this.advanceOrInteract());
    document.querySelector('#title-button')?.addEventListener('click',()=>{ void this.persistProgress(true).then(saved => { if (saved) location.reload(); }); });
    document.querySelector('#action-b')?.addEventListener('click',()=>{
      if(this.journey?.isOpen)this.journey.close();
      else if(this.pokedexOpen)this.closePokedex();
      else if(this.dialogueLines.length)this.closeDialogue();
      else {const toast=document.querySelector<HTMLElement>('#toast');toast?.classList.remove('visible');clearTimeout(this.toastTimer);}
    });
    document.querySelector('#action-save')?.addEventListener('click',()=>this.persistProgress(true));
    document.querySelector('#help-button')?.addEventListener('click',()=>this.showToast('WASD o frecce per muoverti · E o Spazio per parlare · P o ◈ per il Pokédex. Su telefono usa i comandi in basso.'));
    document.querySelector('#pokedex-button')?.addEventListener('click', event => this.openPokedex(event.currentTarget as HTMLElement));
    document.querySelector('#pokedex-close')?.addEventListener('click', () => this.closePokedex());
    document.querySelector('#pokedex-panel')?.addEventListener('keydown', event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Escape') { this.closePokedex(); return; }
      if (keyboardEvent.key !== 'Tab') return;
      const closeButton = document.querySelector<HTMLButtonElement>('#pokedex-close');
      if (!closeButton) return;
      keyboardEvent.preventDefault();
      closeButton.focus();
    });
    const settingsMenu = document.querySelector<HTMLElement>('#settings-menu');
    document.querySelector('#settings-button')?.addEventListener('click',()=>{if(settingsMenu){settingsMenu.hidden=!settingsMenu.hidden;if(!settingsMenu.hidden)settingsMenu.querySelector<HTMLElement>('select, button')?.focus();}});
    const textSpeed = document.querySelector<HTMLSelectElement>('#text-speed');
    if (textSpeed) {
      try { textSpeed.value = localStorage.getItem('veloria-text-speed') ?? 'normal'; } catch { textSpeed.value = 'normal'; }
      textSpeed.addEventListener('change',()=>{try{localStorage.setItem('veloria-text-speed',textSpeed.value);}catch{/* Preference stays active for this session. */}});
    }
    const animationQuality = document.querySelector<HTMLSelectElement>('#animation-quality');
    if (animationQuality) {
      animationQuality.value = this.getAnimationQuality();
      this.reducedAnimations = animationQuality.value === 'reduced';
      animationQuality.addEventListener('change', () => {
        this.reducedAnimations = animationQuality.value === 'reduced';
        this.tweens.killTweensOf(this.playerSprite);
        this.playerSprite.setY(-8);
        this.refreshMapVisuals();
        try { localStorage.setItem('veloria-animation-quality', animationQuality.value); } catch { /* Preference stays active for this session. */ }
      });
    }
    const saveMenu=document.querySelector<HTMLElement>('#save-menu');
    document.querySelector('#backup-button')?.addEventListener('click',()=>{if(saveMenu){saveMenu.hidden=!saveMenu.hidden;if(!saveMenu.hidden)saveMenu.querySelector<HTMLElement>('button')?.focus();}});
    document.querySelector('#export-save')?.addEventListener('click',()=>this.exportBackup());
    document.querySelector('#import-save')?.addEventListener('click',()=>document.querySelector<HTMLInputElement>('#save-file')?.click());
    document.querySelector<HTMLInputElement>('#save-file')?.addEventListener('change',event=>void this.importBackup(event.currentTarget as HTMLInputElement));
  }

  update(time: number) {
    this.traveler?.update(time);
    this.updateInteractionPrompt();
    if (this.navigationOpen) { this.heldDirection = null; this.queuedDirection = null; return; }
    // The UI can be replaced during a Vite hot reload while Phaser keeps its
    // scene alive for a frame. Treat a missing starter panel as closed instead
    // of letting one stale DOM reference stop the whole world loop.
    if(this.battleActive||this.mapTransitionLoading||this.dialogueLines.length||this.starterChoices?.hidden===false||this.pokedexOpen||this.journey?.isOpen)return;
    if(this.moving)return;
    if(this.heldDirection){this.tryMove(this.heldDirection);return;}
    if(this.keys.W.isDown||this.keys.UP.isDown)this.tryMove('up');
    else if(this.keys.S.isDown||this.keys.DOWN.isDown)this.tryMove('down');
    else if(this.keys.A.isDown||this.keys.LEFT.isDown)this.tryMove('left');
    else if(this.keys.D.isDown||this.keys.RIGHT.isDown)this.tryMove('right');
  }

  private tryMove(direction:Direction) {
    if (this.navigationOpen) return;
    if(this.battleActive||this.mapTransitionLoading||this.journey?.isOpen||this.pokedexOpen||this.dialogueLines.length||this.starterChoices?.hidden===false)return;
    if(this.moving){this.queuedDirection=direction;return;}
    const destination=tryGridMove(this.playerTile,direction,this.renderedMap.width,this.renderedMap.height,this.occupied);
    this.facing=direction;this.drawFace();
    if(!destination.moved)return;
    const {x,y}=destination.position;
    this.journey?.compact();
    this.moving=true;this.playerTile={x,y};
    this.traveler.step(direction, this.time.now, this.reducedAnimations);
    this.tweens.add({targets:this.player,x:x*TILE+TILE/2,y:y*TILE+TILE/2,duration:132,ease:'Linear',onUpdate:()=>this.player.setDepth(this.player.y+20),onComplete:()=>{
      this.moving=false;this.save.player.x=x;this.save.player.y=y;
      this.persistProgress();
      const centerX=x*TILE+TILE/2,centerY=y*TILE+TILE/2;
      const trigger = selectAreaTrigger(this.renderedMap.triggers, { x: centerX, y: centerY });
      if (trigger?.kind === 'encounter-zone') {
        this.queuedDirection = null;
        this.activeTriggerId = trigger.id;
        this.handleTrigger(trigger);
        return;
      }
      if (trigger?.id !== this.activeTriggerId) {
        this.activeTriggerId = trigger?.id ?? null;
        if (trigger) { this.queuedDirection = null; this.handleTrigger(trigger); return; }
      }
      const queuedDirection = this.queuedDirection;
      this.queuedDirection = null;
      if (queuedDirection) this.tryMove(queuedDirection);
    }});
  }

  private interact() {
    const {x,y}=adjacentGridPoint(this.playerTile,this.facing);
    const prop=this.interactableAtTile(x,y);
    const serviceId = prop?.properties.serviceId;
    const shopId = prop?.properties.shopId;
    if (serviceId === 'pokemon_center' || serviceId === 'rest_point') {
      this.showHealingMenu(prop?.name ?? 'Punto di riposo', serviceId === 'pokemon_center');
      return;
    }
    if (typeof shopId === 'string') { this.showShopMenu(prop?.name ?? 'Bottega', shopId); return; }
    if (prop?.kind === 'pickup') {
      const questEvent = prop.properties.questEvent;
      const progressed = typeof questEvent === 'string' && this.applyQuestEvent(questEvent);
      if (progressed) {
        this.refreshMapVisuals();
        const item = itemCatalog[String(prop.properties.itemId)];
        this.showToast(`Hai raccolto ${item?.name ?? prop.name}.`);
      } else {
        this.showToast(String(prop.properties.failureMessage ?? 'Qui non è rimasto nulla da raccogliere.'));
      }
      return;
    }
    const questEvent = prop?.properties.questEvent;
    if (prop?.kind !== 'npc' && typeof questEvent === 'string') this.applyQuestEvent(questEvent);
    if (prop?.kind === 'npc') {
      const dialogueId = String(prop.properties.dialogueId ?? prop.properties.npcId ?? prop.id);
      const dialogue = getNpcDialogue(dialogueId, {
        starterSelected: this.save.flags.includes('q_starter_selected'),
        flags: this.save.flags,
      });
      if (!dialogue) { this.showDialogue(prop.name, ['Un saluto cordiale.']); return; }
      const nextAction = this.afterDialogue;
      const trainerId = typeof prop.properties.trainerId === 'string' ? prop.properties.trainerId : undefined;
      const trainerFlag = typeof prop.properties.battleOnceFlag === 'string' ? prop.properties.battleOnceFlag : undefined;
      const battleRequiredFlag = typeof prop.properties.battleRequiredFlag === 'string' ? prop.properties.battleRequiredFlag : undefined;
      const trainer = trainerId ? trainerCatalog[trainerId] : undefined;
      const shouldBattle = Boolean(trainer && trainerFlag && !this.save.flags.includes(trainerFlag));
      const battleLocked = Boolean(shouldBattle && battleRequiredFlag && !this.save.flags.includes(battleRequiredFlag));
      if (dialogue.questEvent || dialogue.requiresStarterChoice || shouldBattle) {
        this.afterDialogue = () => {
          if (dialogue.questEvent) this.applyQuestEvent(dialogue.questEvent);
          nextAction?.();
          if (dialogue.requiresStarterChoice) this.showStarterChoices();
          if (dialogue.questEvent) this.showToast('Diario aggiornato.');
          if (battleLocked) this.showToast('Mira aspetta che tu attivi i tre sigilli del giardino.');
          else if (shouldBattle && trainer) this.showTrainerChallenge(trainer);
        };
      }
      this.showDialogue(dialogue.speaker, dialogue.lines.map(line => line.replaceAll('{starter}', this.starterName())));
      return;
    }
    const message = prop?.properties.message;
    this.showToast(typeof message === 'string' ? message : 'Una brezza leggera attraversa la piazza.');
  }

  private interactableAtTile(x:number,y:number):MapInteractable|undefined {
    const centerX=x*TILE+TILE/2,centerY=y*TILE+TILE/2;
    return this.renderedMap.interactables.find(item=>centerX>=item.x&&centerX<item.x+item.width&&centerY>=item.y&&centerY<item.y+item.height);
  }


  private handleTrigger(exit:MapTrigger) {
    if (exit.kind === 'encounter-zone') {
      this.tryWildEncounter(exit);
      return;
    }
    if (exit.questEvent) {
      const progressed = this.applyQuestEvent(exit.questEvent);
      this.showToast(progressed ? (exit.message ?? 'Hai registrato una nuova scoperta.') : (exit.failureMessage ?? 'Il sigillo resta silenzioso.'));
      return;
    }
    if(exit.requiredFlag&&!this.save.flags.includes(exit.requiredFlag)){
      this.showToast(exit.failureMessage ?? 'Il percorso resta chiuso per ora.');
      return;
    }
    if(!exit.destinationMapId||!exit.destinationSpawnId){this.showToast(exit.message??'La strada prosegue oltre la mappa.');return;}
    const destination=getMap(exit.destinationMapId);
    const spawn=getSpawn(destination,exit.destinationSpawnId);
    if (this.mapTransitionLoading) return;
    this.mapTransitionLoading = true;
    void this.transitionToMap(destination, spawn);
  }

  private async transitionToMap(destination: RegisteredMap, spawn: ReturnType<typeof getSpawn>) {
    const previous = this.map;
    this.heldDirection = null;
    this.queuedDirection = null;
    document.querySelectorAll('.dpad-key.pressed').forEach(button => button.classList.remove('pressed'));
    const loading = document.querySelector<HTMLElement>('#game-loading');
    if (loading) {
      const caption = loading.querySelector('span:last-child');
      if (caption) caption.textContent = `Andiamo a ${destination.metadata.displayName}…`;
      loading.hidden = false;
    }
    try {
      await this.loadMapRenderAssets(destination);
    } catch {
      this.releaseMapRenderAssets(destination, previous);
      this.mapTransitionLoading = false;
      if (loading) loading.hidden = true;
      this.showToast('La mappa non è disponibile. Riprova tra poco.');
      return;
    }

    this.mapLayer.remove(this.player,false);
    this.destroyMapLayer();
    this.map=destination;
    this.activeTriggerId = null;
    this.playerTile={x:spawn.x,y:spawn.y};
    this.save.player.mapId=destination.metadata.id;
    this.save.player.spawnPointId=spawn.id;
    this.save.player.x=spawn.x;this.save.player.y=spawn.y;
    this.facing=spawn.facing;this.drawFace();
    this.drawWorld();
    this.releaseMapRenderAssets(previous, destination);
    this.mapLayer.add(this.player);
    this.player.setPosition(spawn.x*TILE+TILE/2,spawn.y*TILE+TILE/2).setDepth(this.player.y+20);
    this.fitWorldCamera();
    this.mapTransitionLoading = false;
    if (loading) loading.hidden = true;
    this.persistProgress();
    if (destination.metadata.id === 'veloria/brumalta') this.applyQuestEvent('area/veloria/brumalta/enter');
    this.showToast(destination.metadata.displayName);
  }

  private loadMapRenderAssets(map: RegisteredMap): Promise<void> {
    const assetUrl = (path: string) => publicAssetUrl(path, import.meta.env.BASE_URL);
    const pending = resolveMapRenderAssets([map.metadata]).filter(asset => !this.textures.exists(asset.key));
    if (pending.length === 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const missing = pending.filter(asset => !this.textures.exists(asset.key));
        if (missing.length > 0) reject(new Error(`Map assets did not load: ${missing.map(asset => asset.key).join(', ')}`));
        else resolve();
      });
      for (const asset of pending) this.load.image(asset.key, assetUrl(asset.path));
      this.load.start();
    });
  }

  private releaseMapRenderAssets(from: RegisteredMap, to: RegisteredMap) {
    const keep = new Set(resolveMapRenderAssets([to.metadata]).map(asset => asset.key));
    for (const asset of resolveMapRenderAssets([from.metadata])) {
      if (!keep.has(asset.key) && this.textures.exists(asset.key)) this.textures.remove(asset.key);
    }
  }

  private tryWildEncounter(zone: MapTrigger) {
    if (!zone.encounterTableId || !this.save.party.some(creature => creature.hp > 0)) return;
    const table = encounterCatalog[zone.encounterTableId];
    if (!table) { this.showToast(`Tabella incontri non trovata: ${zone.encounterTableId}`); return; }
    const check = rollEncounterCheck(this.save.rngState, zone.encounterChance ?? 0);
    this.save.rngState = check.nextRngState;
    if (!check.encounter) { this.persistProgress(); return; }
    const selected = selectWildEncounter({
      rngState: this.save.rngState,
      localHour: new Date().getHours(),
      table,
      species: battleSpecies,
    });
    this.save.rngState = selected.nextRngState;
    const state = createWildBattle({
      save: this.save,
      speciesId: selected.speciesId,
      level: selected.level,
      registries: { species: battleSpecies, moves: battleMoves },
      rules: veloriaBattleRules,
      battleId: createUniqueId(),
    });
    this.beginBattle(state);
  }

  private startTrainerBattle(trainer: (typeof trainerCatalog)[string]) {
    if (!this.save.party.some(creature => creature.hp > 0)) {
      this.showToast('La squadra è esausta. Usa una pozione prima della prova.');
      return;
    }
    try {
      const state = createTrainerBattle({
        save: this.save,
        trainer,
        registries: { species: battleSpecies, moves: battleMoves },
        rules: veloriaBattleRules,
        battleId: createUniqueId(),
      });
      this.beginBattle(state, trainer);
    } catch (error) {
      this.showToast(error instanceof Error ? `Battaglia non avviata: ${error.message}` : 'Battaglia non avviata.');
    }
  }

  private beginBattle(state: BattleState, trainer?: (typeof trainerCatalog)[string]) {
    if (this.battleActive) return;
    this.battleActive = true;
    this.onMusicThemeChange(this.map.metadata.id === 'veloria/gym01_brumalta' ? 'battle_gym' : trainer ? 'battle_trainer' : 'battle_wild');
    let dismissMessage = 'Lo scontro è terminato.';
    const hadAuroraBadge = this.save.flags.includes('badge_aurora_awarded');
    void this.ensureBattleScene().then(() => {
      document.body.classList.add('battle-active');
      document.querySelector<HTMLElement>('#save-menu')!.hidden = true;
      this.scene.launch('battle', {
        opponentPolicy: getOpponentPolicy(trainer?.aiProfileId),
        state,
        moveCatalog: battleMoves,
        rules: veloriaBattleRules,
        inventory: this.save.inventory,
        createInstanceId: createUniqueId,
        arenaTextureKey: this.map.metadata.battleBackgroundKey,
        reducedAnimations: this.reducedAnimations,
        onComplete: (finalState: BattleState, events: readonly BattleEvent[]) => {
          this.save = mergeBattlePlayerState(this.save, finalState);
          this.save.inventory = consumeBattleItems(this.save.inventory, events);
          if (finalState.outcome.kind === 'won' && finalState.outcome.winner === 'player') {
            if (trainer && !this.save.flags.includes(trainer.battleOnceFlag)) {
              this.save.player.money += trainer.rewardMoney;
              this.save = { ...this.save, flags: [...this.save.flags, trainer.battleOnceFlag] };
              this.applyQuestEvent(trainer.defeatQuestEvent);
              dismissMessage = trainer.victoryMessage;
            } else dismissMessage = 'Hai vinto lo scontro.';
          } else if (finalState.outcome.kind === 'captured') {
            dismissMessage = 'La nuova creatura è stata aggiunta alla squadra.';
          } else if (finalState.outcome.kind === 'fled') {
            dismissMessage = 'Sei riuscito a fuggire.';
          } else if (finalState.outcome.kind === 'draw' || finalState.outcome.kind === 'won' && finalState.outcome.winner === 'opponent') {
            if (this.save.party.every(creature => creature.hp === 0)) {
              // The MVP docs do not define a blackout penalty; heal fully to prevent a softlock.
              this.save = healParty(this.save, battleMoves);
              dismissMessage = 'La squadra è stata soccorsa e curata dopo lo scontro.';
            } else dismissMessage = 'La squadra non può continuare. Riprendi fiato e prova ancora.';
          }
          this.persistProgress();
        },
        onDismiss: (event?: KeyboardEvent) => {
          this.scene.stop('battle');
          this.scene.resume('world');
          this.battleActive = false;
          this.onMusicThemeChange(this.map.metadata.musicId);
          document.body.classList.remove('battle-active');
          this.journey?.celebrate(this.pendingQuestCelebrations);
          this.pendingQuestCelebrations = [];
          this.persistProgress();
          this.showToast(dismissMessage);
          if (!hadAuroraBadge && this.save.flags.includes('badge_aurora_awarded') && !this.previewMode) void this.presentPrologueCompletion(event?.key);
        },
      });
      this.scene.pause('world');
    }).catch(error => {
      this.battleActive = false;
      this.onMusicThemeChange(this.map.metadata.musicId);
      this.showToast('Non è stato possibile caricare la battaglia. Riprova.');
      console.error('Unable to load the battle scene.', error);
    });
  }

  private ensureBattleScene(): Promise<void> {
    if (!this.battleSceneReady) {
      this.battleSceneReady = import('./BattleScene').then(({ BattleScene }) => {
        this.scene.add('battle', BattleScene, false);
      }).catch(error => {
        this.battleSceneReady = null;
        throw error;
      });
    }
    return this.battleSceneReady;
  }

  private advanceOrInteract() {
    if (this.navigationOpen) return;
    if (this.battleActive || this.mapTransitionLoading || this.journey?.isOpen || this.pokedexOpen) return;
    if(this.dialogueLines.length){
      if (this.typingTimer !== undefined) { this.revealDialogueLine(); return; }
      if(this.dialogueIndex<this.dialogueLines.length-1){this.dialogueIndex++;this.updateDialoguePage();}
      else this.closeDialogue();
      return;
    }
    this.interact();
  }

  private showDialogue(speaker:string,lines:string[]) {
    this.starterChoices.hidden=true;
    document.querySelector<HTMLElement>('.dialogue-footer')!.hidden=false;
    this.dialogueLines=lines.map(line=>line.replaceAll('{trainer}',this.save.player.name));this.dialogueIndex=0;
    document.querySelector<HTMLElement>('#dialogue-speaker')!.textContent=speaker;
    this.dialogueBox.hidden=false;
    document.querySelector('.game-stage')?.classList.add('has-dialogue');
    this.updateDialoguePage();
  }

  private updateDialoguePage() {
    this.stopTyping();
    const text = document.querySelector<HTMLElement>('#dialogue-text')!;
    this.typingTarget = text;
    this.typingText = this.dialogueLines[this.dialogueIndex];
    this.typingCharacters = Array.from(this.typingText);
    this.typingIndex = 0;
    if (this.typingCharacters.length === 0) { text.textContent = this.typingText; return; }
    text.textContent = '';
    let speed: string | null = null;
    try { speed = localStorage.getItem('veloria-text-speed'); } catch { /* Use the accessible default. */ }
    const delay = speed === 'slow' ? 42 : speed === 'fast' ? 8 : 20;
    this.typingTimer = window.setInterval(() => {
      if (!this.typingTarget) { this.stopTyping(); return; }
      this.typingTarget.textContent += this.typingCharacters[this.typingIndex++];
      if (this.typingIndex >= this.typingCharacters.length) this.stopTyping();
    }, delay);
    document.querySelector<HTMLElement>('#dialogue-prompt')!.textContent=this.dialogueIndex<this.dialogueLines.length-1?'A · Continua  ▸':'A · Chiudi  ▸';
  }

  private revealDialogueLine() {
    if (this.typingTarget) this.typingTarget.textContent = this.typingText;
    this.stopTyping();
  }

  private stopTyping() {
    if (this.typingTimer !== undefined) window.clearInterval(this.typingTimer);
    this.typingTimer = undefined;
    this.typingTarget = undefined;
  }

  private closeDialogue() {
    this.stopTyping();
    this.dialogueLines=[];this.dialogueIndex=0;this.dialogueBox.hidden=true;
    document.querySelector('.game-stage')?.classList.remove('has-dialogue');
    const next=this.afterDialogue;this.afterDialogue=null;next?.();
  }

  private showStarterChoices() {
    const box=this.dialogueBox;
    box.hidden=false;
    document.querySelector('.game-stage')?.classList.add('has-dialogue');
    document.querySelector<HTMLElement>('#dialogue-speaker')!.textContent='SCEGLI IL TUO COMPAGNO';
    document.querySelector<HTMLElement>('#dialogue-text')!.textContent='Quattro avventure diverse. Scegli con chi iniziare.';
    document.querySelector<HTMLElement>('.dialogue-footer')!.hidden=true;
    this.starterChoices.replaceChildren(...starters.map(starter=>{
      const button=document.createElement('button');
      button.className='starter-choice';button.type='button';
      button.setAttribute('aria-label', starter.name);
      const detail = document.createElement('small');
      detail.className = 'starter-description';
      detail.id = `starter-detail-${starter.speciesId}`;
      detail.textContent = battleSpecies[starter.speciesId].types.map(battleTypeLabel).join(' / ') + ' · Livello 5';
      button.setAttribute('aria-describedby', detail.id);
      button.append(createCreaturePortrait(starter.speciesId), document.createTextNode(starter.name), detail);
      button.addEventListener('click',()=>{
        const selected = selectStarter(this.save, starter.speciesId, createUniqueId());
        if (!selected) return;
        this.save = selected;
        this.starterChoices.hidden=true;
        document.querySelector<HTMLElement>('.dialogue-footer')!.hidden=false;
        this.showDialogue('Professoressa Elia',[`Ottima scelta. ${starter.name} sarà il tuo compagno di viaggio.`,'Parlami ancora con A per ricevere la missione. Poi esci dalla porta in basso: il sentiero a nord si trova fuori, nel paese.']);
        this.persistProgress(true);
      });
      return button;
    }));
    this.starterChoices.hidden=false;
  }

  private showHealingMenu(name: string, includeStorage: boolean) {
    this.afterDialogue = null;
    this.showServiceOptions(name, 'La squadra recupererà tutti gli HP, i PP e gli stati alterati.', [
      { label: 'RIPOSA', action: () => {
        this.save = healParty(this.save, battleMoves);
        this.persistProgress();
        this.showToast('La squadra è in piena forma.');
      } },
      ...(includeStorage ? [{ label: 'DEPOSITO', action: () => this.showStorageMenu(name) }] : []),
      { label: 'DOPO', action: () => undefined },
    ]);
  }

  private showStorageMenu(name: string) {
    const speciesName = (speciesId: number) => battleSpecies[String(speciesId)]?.name ?? `Specie ${speciesId}`;
    const options = [
      ...this.save.party.map(creature => ({
        label: `BOX · ${speciesName(creature.speciesId)} Lv.${creature.level}`,
        action: () => {
          const result = moveCreatureToStorage(this.save, creature.instanceId);
          if (result.ok) {
            this.save = result.save;
            this.persistProgress();
            this.showToast(`${speciesName(creature.speciesId)} depositato nel box.`);
          } else this.showToast(result.reason === 'lastPartyMember' ? 'Devi lasciare almeno un Pokémon in squadra.' : 'Non riesco a spostare questo Pokémon.');
        },
      })),
      ...this.save.storage.map(creature => ({
        label: `RITIRA · ${speciesName(creature.speciesId)}${typeof creature.level === 'number' ? ` Lv.${creature.level}` : ''}`,
        action: () => {
          const result = withdrawCreatureFromStorage(this.save, creature.instanceId);
          if (result.ok) {
            this.save = result.save;
            this.persistProgress();
            this.showToast(`${speciesName(creature.speciesId)} aggiunto alla squadra.`);
          } else this.showToast(result.reason === 'partyFull' ? 'La squadra è già al completo.' : 'Questo Pokémon non può essere ritirato.');
        },
      })),
      { label: 'INDIETRO', action: () => this.showHealingMenu(name, true) },
    ];
    this.afterDialogue = null;
    this.showServiceOptions(name, `Squadra: ${this.save.party.length}/6 · Box: ${this.save.storage.length}. Scegli un Pokémon.`, options);
  }

  private showShopMenu(name: string, shopId: string) {
    const shop = shopCatalog[shopId];
    if (!shop) { this.showToast('Questa bottega non è ancora aperta.'); return; }
    const options = shop.items.flatMap(itemId => {
      const item = itemCatalog[itemId];
      if (!item) return [];
      return [{ label: `${item.name} · ${item.price} ₿  (${this.save.inventory[itemId] ?? 0})`, action: () => {
        const result = purchaseShopItem(this.save, shop, itemId, itemCatalog);
        if (result.ok) {
          this.save = result.save;
          this.persistProgress();
          this.showToast(`${item.name} acquistato.`);
        } else {
          const message = result.reason === 'insufficientFunds' ? 'Non hai abbastanza denaro.'
            : result.reason === 'stackFull' ? 'Non puoi portare altri strumenti di questo tipo.'
              : 'Questo articolo non è disponibile.';
          this.showToast(message);
        }
      } }];
    });
    options.push({ label: 'CHIUDI', action: () => undefined });
    this.afterDialogue = null;
    this.showServiceOptions(name, `Hai ${this.save.player.money} ₿. Scegli cosa acquistare.`, options);
  }

  private showServiceOptions(speaker: string, prompt: string, options: Array<{ label: string; action: () => void }>) {
    this.showDialogue(speaker, [prompt]);
    document.querySelector<HTMLElement>('.dialogue-footer')!.hidden = true;
    this.starterChoices.replaceChildren(...options.map(option => {
      const button = document.createElement('button');
      button.className = 'starter-choice';
      button.type = 'button';
      button.textContent = option.label;
      button.addEventListener('click', () => {
        this.starterChoices.hidden = true;
        this.closeDialogue();
        option.action();
      });
      return button;
    }));
    this.starterChoices.hidden = false;
  }

  private showTrainerChallenge(trainer: (typeof trainerCatalog)[string]) {
    this.showServiceOptions(trainer.name, `Vuoi affrontare ${trainer.name}?`, [
      { label: 'SFIDA', action: () => this.startTrainerBattle(trainer) },
      { label: 'NON ORA', action: () => this.showToast('La sfida ti aspetta quando sarai pronto.') },
    ]);
  }

  private starterName() {
    return getStarterName(this.save.party[0]?.speciesId);
  }

  private applyQuestEvent(trigger: string): boolean {
    const result = applyQuestEvent(this.save, trigger, questCatalog);
    this.save = result.save;
    if (this.battleActive) this.pendingQuestCelebrations.push(...result.completedQuestIds);
    else this.journey?.celebrate(result.completedQuestIds);
    if (result.progressed) this.persistProgress();
    return result.progressed;
  }

  private exportBackup() {
    try {
      const contents=exportSave(this.save,new Date().toISOString());
      const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));
      const link=document.createElement('a');
      link.href=url;link.download=`veloria-${new Date().toISOString().slice(0,10)}.json`;link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      this.showToast('Backup JSON esportato.');
      document.querySelector<HTMLElement>('#save-menu')!.hidden=true;
    } catch(error) { this.showToast(error instanceof Error?`Backup non esportato: ${error.message}`:'Backup non esportato.'); }
  }

  private async importBackup(input:HTMLInputElement) {
    if (this.previewMode) return;
    const file=input.files?.[0];
    input.value='';
    if(!file)return;
    if(!window.confirm('Importare questo salvataggio? La partita corrente verrà sostituita.'))return;
    try {
      const imported=importSave(await file.text());
      await this.saveQueue;
      await saveGame(imported);
      this.showToast('Salvataggio importato. Ricarico la partita…');
      setTimeout(()=>window.location.reload(),500);
    } catch(error) { this.showToast(error instanceof Error?`Backup non importato: ${error.message}`:'Backup non importato.'); }
    document.querySelector<HTMLElement>('#save-menu')!.hidden=true;
  }

  private persistProgress(showToast=false): Promise<boolean> {
    this.journey?.update(this.save);
    if (this.previewMode) {
      if (showToast) this.showToast('Anteprima: i progressi non vengono salvati.');
      return Promise.resolve(false);
    }
    this.save.player.x=this.playerTile.x;this.save.player.y=this.playerTile.y;
    const snapshot = structuredClone(this.save);
    const operation = this.saveQueue.then(()=>saveGame(snapshot)).then(()=>{
      if(showToast)this.showToast('Partita salvata.');
      return true;
    }).catch(()=>{this.showToast('Salvataggio non riuscito.');return false;});
    this.saveQueue=operation.then(()=>undefined);
    return operation;
  }

  private showToast(message:string) {
    const toast=document.querySelector<HTMLElement>('#toast');if(!toast)return;
    toast.textContent=message;toast.classList.add('visible');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>toast.classList.remove('visible'),2600);
  }
}

