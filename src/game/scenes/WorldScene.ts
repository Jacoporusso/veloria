import { ENCOUNTER_HABITAT_SYMBOL } from '../rendering/encounter-habitat-marker.ts';
import { addNpcIdleMotion } from '../rendering/npc-idle-motion.ts';
import { customizeTrainerAppearance, readTrainerAppearance } from '../../core/party/trainer-appearance.ts';
import { createTrainerAvatarSheet } from '../rendering/trainer-avatar-art.ts';
import { composeIllustratedTrainer, trainerSourcePath } from '../rendering/illustrated-trainer.ts';
import { showTrainerAppearanceDialog } from '../ui/TrainerAppearanceEditor.ts';
import { TouchJoystick } from '../input/touch-joystick';
import { getEnvironmentRegulator } from '../maps/environment-regulator-registry';
import { getChallengeSequence, listChallengeSequences } from '../maps/challenge-sequence-registry';
import { abortChallengeSequence, challengeSequenceState, challengeServiceAllowed, prepareChallengeBattle, recoverChallengeSequence, startChallengeSequence, type ChallengeSequence } from '../../core/world/challenge-sequence.ts';
import { settleChallengeSave } from '../battle/challenge-settlement.ts';
import { adjustEnvironmentRegulator, resetEnvironmentRegulator, environmentRegulatorState } from '../../core/world/environment-regulator.ts';
import { environmentRegulatorMenu, type EnvironmentRegulatorCommand } from '../ui/environment-regulator-menu';
import { decorateServiceOption, type ServiceOptionIconKind } from '../ui/ServiceOptionIcon';
import { RegionMapPanel } from '../ui/RegionMapPanel';
import { recordAreaVisited } from '../../core/world/region-atlas';
import { monorailDestinations, monorailNetwork, monorailUnlocked, planMonorailTrip } from '../../core/world/monorail.ts';
import { rotateSignalRouter, signalRouterState, traceSignalRouter } from '../../core/world/signal-router.ts';
import { getSignalRouter } from '../maps/signal-router-registry';
import { getLocalTransportNetwork } from '../maps/local-transport-registry';
import { localTransportDestinations, planLocalTransportTrip } from '../../core/world/local-transport.ts';
import { trainerChallengePrompt } from '../battle/trainer-challenge.ts';
import { beginTrainingAttempt, createTrainingTrainer, recoverTrainingAttempts, settleTrainingAttempt, TRAINING_TIERS } from '../../core/world/training-arena.ts';
import { selectOpeningGuidance } from '../../core/quests/opening-guidance.ts';
import { getOpponentPolicy } from '../battle/opponent-policies.ts';
import Phaser from 'phaser';
import { createUniqueId, saveGame, type GameSave } from '../../persistence/save-store';
import { exportSave, importSave } from '../../persistence/save-backup';
import { moveCreatureToSlot } from '../../core/services/party-order.ts';
import { showStorageManager } from '../ui/StorageMenu';
import { showShopManager } from '../ui/ShopMenu';
import { getStarterName, selectStarter, starters } from '../../core/party/select-starter';
import { applyQuestEvent } from '../../core/quests/apply-quest-event';
import { questCatalog } from '../quests/catalog.ts';
import { selectWildEncounter } from '../../core/encounters/select-encounter.ts';
import { rollEncounterCheck } from '../../core/encounters/roll-encounter-check.ts';
import { castFishingLine, type FishingSpot } from '../../core/encounters/fishing.ts';
import type { BattleEvent, BattleState } from '../../core/battle/types.ts';
import { adjacentGridPoint, iceSlideContinues, isGridTileOpen, selectAreaTrigger, tryGridMove, type CardinalDirection } from '../../core/world/index.ts';
import { publicAssetUrl } from '../../core/assets/index.ts';
import { getMap, getMapKey, getSpawn, listMaps } from '../maps/map-registry';
import type { MapTrigger, MapInteractable, RegisteredMap } from '../maps/map-types';
import { resolveMapRenderAssets } from '../maps/map-render-assets';
import { getNpcDialogue, type Dialogue } from '../interactions/dialogue-catalog';
import { renderMap } from '../rendering/MapRenderer';
import { faceNpcTowardObserver } from '../rendering/npc-idle-views.ts';
import { createAmbientEffectPoints, createGrassSwayPoints, createWaterShimmerPoints, getGrassSwayTween, getWaterShimmerTween } from '../rendering/ambient-effects.ts';
import { battleMoves, battleSpecies, encounterCatalog, trainerCatalog, veloriaBattleRules } from '../battle/catalog.ts';
import { createTrainerBattle, createWildBattle, mergeBattlePlayerState } from '../battle/create-battle-state.ts';
import { healParty } from '../../core/services/healing.ts';
import { recordSpeciesSeen, recordSpeciesCaught } from '../../core/party/pokedex.ts';
import { PokemonPanel } from '../ui/PokemonPanel.ts';
import { applyItemEvolution, pendingEvolutionReceipts, queueEvolutionReceipts, evolutionReceiptFlag } from '../../core/services/item-evolution.ts';
import { itemEvolutionRules } from '../battle/catalog.ts';
import { tradeEvolutionRules } from '../battle/catalog.ts';
import { specialEncounterCatalog } from '../maps/special-encounter-registry.ts';
import { specialEncounterAvailability, type SpecialEncounter } from '../../core/encounters/special-encounter.ts';
import { chooseResearchSymbol, legendaryResearchState, type LegendaryResearchDefinition } from '../../core/encounters/legendary-research.ts';
import { getLegendaryResearch } from '../maps/legendary-research-registry.ts';
import { applyTradeEvolution } from '../../core/services/trade-evolution.ts';
import { chooseItemEvolution } from '../ui/ItemEvolutionMenu.ts';
import { showEvolutionCelebration } from '../ui/EvolutionCelebration.ts';
import { ensureSavedProgress } from '../ui/SaveRetryDialog.ts';
import { itemCatalog, shopCatalog } from '../battle/catalog.ts';
import { createCreaturePortrait } from '../battle/creature-art.ts';
import { TravelerAnimation, TRAVELER_TEXTURE } from '../rendering/traveler-animation.ts';
import { JourneyPanel } from '../journey/JourneyPanel.ts';
import { WorldGuidance } from '../ui/WorldGuidance.ts';
import { worldCameraBounds, worldCameraZoom } from '../rendering/world-camera.ts';
import { payDayReward } from '../battle/pay-day-reward.ts';
import { worldFollowDeadzone } from '../rendering/camera-follow.ts';
import { gameViewport } from '../rendering/game-size.ts';
import { playFishingCast } from '../rendering/fishing-cast';
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
  private touchJoystick?: TouchJoystick;
  private heldDirection: Direction | null = null;
  private queuedDirection: Direction | null = null;
  private slidingDirection: Direction | null = null;
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
  private openingGuidance?: WorldGuidance;
  private openingGuidanceKey = '';
  private completionActive = false;
  private presentationAbort = new AbortController();
  private toastTimer?: ReturnType<typeof setTimeout>;
  private battleActive = false;
  private lastExhaustedHabitatHintAt = -Infinity;
  private fishingActive = false;
  private battleSceneReady: Promise<void> | null = null;
  private mapTransitionLoading = false;
  private movementReleaseRequired = false;
  private challengeOperationActive = false;
  private challengeRecovered = false;
  private typingTimer?: number;
  private typingTarget?: HTMLElement;
  private typingText = '';
  private typingCharacters: string[] = [];
  private typingIndex = 0;
  private regionMap?: RegionMapPanel;
  private pokedexOpen = false;
  private pokedexReturnFocus?: HTMLElement;
  private readonly onMusicThemeChange: (themeId: string) => void;
  private readonly previewMode: boolean;
  private reducedAnimations = false;
  private avatarTextureKey = TRAVELER_TEXTURE;
  private avatarRevision = 0;
  private avatarEditorOpen = false;
  private ambientTweenTargets: Phaser.GameObjects.GameObject[] = [];

  constructor(save: GameSave, onMusicThemeChange: (themeId: string) => void = () => undefined, previewMode = false) {
    super('world');
    this.save = save;
    this.onMusicThemeChange = onMusicThemeChange;
    this.previewMode = previewMode;
  }

  preload() {
    this.recoverChallengeProgress();
    const assetUrl = (path: string) => publicAssetUrl(path, import.meta.env.BASE_URL);
    if (this.save.player.appearance) {
      this.avatarTextureKey = 'veloria-avatar-custom';
      this.load.image('veloria-avatar-source', assetUrl(trainerSourcePath(this.save.player.appearance)));
    } else this.load.image(TRAVELER_TEXTURE, assetUrl('assets/sprites/veloria-traveler-walk-v2.webp'));
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
    this.presentationAbort = new AbortController();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.presentationAbort.abort());
    try { this.map = getMap(this.save.player.mapId); }
    catch { this.map = getMap('veloria/borgofonte'); this.save.player.mapId = this.map.metadata.id; this.save.player.spawnPointId = 'start'; }
    this.reducedAnimations = this.getAnimationQuality() === 'reduced';
    this.playerTile = { x: this.save.player.x, y: this.save.player.y };
    this.drawWorld();
    this.game.events.on(Phaser.Core.Events.POST_RENDER, this.renderGuidance, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.POST_RENDER, this.renderGuidance, this);
      this.openingGuidance?.destroy();
      this.openingGuidance = undefined;
    });
    const spawn = getSpawn(this.map, this.save.player.spawnPointId);
    if (!isGridTileOpen(this.playerTile, this.renderedMap.width, this.renderedMap.height, this.occupied)) {
      this.playerTile = { x: spawn.x, y: spawn.y };
      this.save.player.x = spawn.x; this.save.player.y = spawn.y;
    }
    if (this.playerTile.x === spawn.x && this.playerTile.y === spawn.y) this.facing = spawn.facing;

    if (this.save.player.appearance) {
      const source = this.textures.get('veloria-avatar-source').getSourceImage() as HTMLImageElement;
      this.textures.addCanvas(this.avatarTextureKey, composeIllustratedTrainer(source, this.save.player.appearance));
    }
    this.player = this.makePlayer();
    this.drawFace();
    this.mapLayer.add(this.player);
    this.player.setPosition(this.playerTile.x * TILE + TILE / 2, this.playerTile.y * TILE + TILE / 2).setDepth(this.player.y + 20);
    this.mapLayer.sort('depth');
    this.fitWorldCamera();
    this.dialogueBox=document.querySelector<HTMLElement>('#dialogue-box')!;
    this.starterChoices=document.querySelector<HTMLElement>('#starter-choices')!;
    const stage = document.querySelector<HTMLElement>('.game-stage');
    if (stage) {
      this.journey = new JourneyPanel(stage, (itemId, creatureId) => void this.openItemEvolution(itemId, creatureId),
        (mapId, discoveryId) => this.regionMap?.open(this.save, mapId, discoveryId));
      this.journey.update(this.save);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.journey?.destroy());
    }
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ENTER,M,P') as Record<string, Phaser.Input.Keyboard.Key>;
    // Frame polling alone misses short taps, including turning towards an NPC.
    // Start the first step on keydown; update keeps movement going while held.
    for (const [key, direction] of Object.entries({ W: 'up', UP: 'up', S: 'down', DOWN: 'down', A: 'left', LEFT: 'left', D: 'right', RIGHT: 'right' }) as [string, Direction][]) {
      this.input.keyboard!.on(`keydown-${key}`, (event: KeyboardEvent) => {
        if (!event.repeat) this.tryMove(direction);
      });
    }
    this.input.keyboard!.on('keydown-E', () => this.advanceOrInteract());
    this.input.keyboard!.on('keydown-SPACE', () => this.advanceOrInteract());
    this.input.keyboard!.on('keydown-ENTER', () => this.advanceOrInteract());
    this.input.keyboard!.on('keydown-M', () => this.persistProgress(true));
    this.input.keyboard!.on('keydown-P', () => this.openPokedex(document.querySelector<HTMLElement>('#pokedex-button')!));
    this.regionMap = new RegionMapPanel();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.regionMap?.destroy());
    this.save.flags = recordAreaVisited(this.save.flags, this.map.metadata.id);
    this.bindTouchControls();
    this.scale.on('resize', this.fitWorldCamera, this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.fitWorldCamera, this);
    this.game.events.on(Phaser.Core.Events.RESUME, this.fitWorldCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.fitWorldCamera, this);
      this.events.off(Phaser.Scenes.Events.RESUME, this.fitWorldCamera, this);
      this.game.events.off(Phaser.Core.Events.RESUME, this.fitWorldCamera, this);
    });
    window.setTimeout(() => { const loading = document.querySelector<HTMLElement>('#game-loading'); if (loading) loading.hidden = true; }, 120);
    if (!this.previewMode && pendingEvolutionReceipts(this.save).length) {
      void this.presentPendingEvolutions().then(async () => {
        if (this.presentationAbort.signal.aborted) return;
        if (this.challengeRecovered) {
          this.challengeOperationActive = true;
          await this.finishChallengeRecovery();
        } else if (this.save.flags.includes('q_league_completed') && !this.save.flags.includes('q_league_epilogue_seen')) {
          await this.presentLeagueFinale();
        } else if (this.save.flags.includes('badge_aurora_awarded') && !this.save.flags.includes('prologue_complete_seen')) {
          await this.presentPrologueCompletion();
        }
      });
    } else if (!this.previewMode && this.save.flags.includes('intro_started') && !this.save.flags.includes('intro_completed')) {
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
    if (!this.dialogueLines.length) this.showHabitatHint();
    if (this.challengeRecovered && !this.completionActive) {
      this.challengeOperationActive = true;
      void this.finishChallengeRecovery();
    } else if (!this.completionActive && !this.previewMode && this.save.flags.includes('q_league_completed') && !this.save.flags.includes('q_league_epilogue_seen')) {
      void this.presentLeagueFinale();
    }
  }

  private fitWorldCamera(): void {
    const width = this.renderedMap.width * TILE, height = this.renderedMap.height * TILE;
    const viewport = gameViewport(this.game);
    const logicalZoom = worldCameraZoom(viewport, { width, height });
    const bounds = worldCameraBounds(viewport, { width, height }, logicalZoom);
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    const deadzone = worldFollowDeadzone(viewport, logicalZoom);
    this.cameras.main.setZoom(logicalZoom * viewport.density);
    this.cameras.main.startFollow(this.player, true, .12, .12);
    this.cameras.main.setDeadzone(deadzone.width, deadzone.height);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    // Resolve the new bounds and deadzone before revealing a destination.
    this.cameras.main.preRender();
    this.positionToast();
  }

  private get navigationOpen(): boolean {
    return this.avatarEditorOpen || this.completionActive || this.challengeOperationActive || Boolean(this.regionMap?.isOpen) || Boolean(document.querySelector('#exploration-menu:not([hidden]), #settings-menu:not([hidden]), #save-menu:not([hidden])'));
  }

  private updateInteractionPrompt(): void {
    this.renderedMap.updateExitMarkers(this.save.flags);
    const prompt = document.querySelector<HTMLButtonElement>('#interaction-prompt');
    if (!prompt) return;
    const blocked = this.fishingActive || this.navigationOpen || this.moving || this.battleActive || this.mapTransitionLoading || this.dialogueLines.length > 0 || this.starterChoices?.hidden === false || this.pokedexOpen || this.journey?.isOpen;
    const guidanceKey = this.map.metadata.id + '|' + this.save.flags.join('|');
    if (!this.mapTransitionLoading && guidanceKey !== this.openingGuidanceKey) this.drawOpeningGuidance();

    const adjacent = adjacentGridPoint(this.playerTile, this.facing);
    const target = !blocked && (this.interactionTarget(adjacent.x, adjacent.y));
    this.renderedMap.updateInteractionFocus(target || undefined);
    prompt.hidden = !target;
    if (target && this.promptTargetId !== target.id) {
      const verb = target.properties.serviceId === 'monorail' ? 'Usa' : target.kind === 'npc' ? 'Parla con'
        : target.kind === 'wild-pokemon' ? 'Incontra' : target.kind === 'pickup' ? 'Raccogli' : 'Esamina';
      prompt.textContent = this.interactionActionLabel() + ' · ' +
        (target.kind === 'fishing-spot' ? '🎣 ' + target.name : verb + ' ' + target.name);
      this.promptTargetId = target.id;
    }
  }

  private interactionActionLabel(): string {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches ? 'E / Spazio / Invio' : 'A';
  }

  private renderGuidance(): void {
    const visible = this.sys.isActive() && !this.fishingActive && !this.navigationOpen && !this.moving && !this.battleActive &&
      !this.mapTransitionLoading && !this.dialogueLines.length && this.starterChoices?.hidden !== false &&
      !this.pokedexOpen && !this.journey?.isOpen;
    this.openingGuidance?.render(this.cameras.main, this.game.canvas, visible, this.player ? [this.player.getBounds()] : []);
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
    this.openingGuidance?.clear();
    this.openingGuidanceKey = this.map.metadata.id + '|' + this.save.flags.join('|');
    const guidance = selectOpeningGuidance(this.map.metadata.id, this.save.flags, opening.guidance);
    if (!guidance) return;
    const target = guidance.destinationMapId
      ? this.renderedMap.triggers.find(trigger => trigger.destinationMapId === guidance.destinationMapId)
      : this.renderedMap.interactables.find(item => item.properties.npcId === guidance.npcId || item.properties.dialogueId === guidance.npcId || item.id === guidance.npcId);
    if (!target) return;
    const stage = document.querySelector<HTMLElement>('.game-stage');
    if (!stage) return;
    if (!this.openingGuidance) this.openingGuidance = new WorldGuidance(stage);
    this.openingGuidance.setTarget(guidance.label.replace('PARLA CON A', `PARLA · ${this.interactionActionLabel()}`), { x: target.x, y: target.y, width: target.width, height: target.height });
  }

  private renderAmbientEffects() {
    this.ambientTweenTargets.push(...addNpcIdleMotion(this, this.mapLayer, this.reducedAnimations));
    for (const effect of this.map.metadata.ambientEffects ?? []) {
      if (effect.kind === 'petals') {
        for (const point of createAmbientEffectPoints(this.map.metadata.id, effect)) {
          const petal = this.add.ellipse(point.x, point.y, 5, 2.6, Number.parseInt(point.color.slice(1), 16), .7)
            .setAngle(point.phase * 180).setDepth(90000).setName('ambient-petal');
          this.mapLayer.add(petal);
          if (this.reducedAnimations) continue;
          this.ambientTweenTargets.push(petal);
          this.tweens.add({ targets: petal,
            x: {from: point.x, to: Math.min(effect.area.x + effect.area.width, point.x + 32)},
            y: {from: point.y, to: Math.min(effect.area.y + effect.area.height, point.y + 64)},
            alpha: {from: .7, to: 0}, angle: point.phase * 180 + 80,
            duration: 3800 + point.phase * 2200, delay: point.phase * 2000, repeat: -1,
          });
        }
        continue;
      }
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
        blades.fillEllipse(-3, -4, 5, 9);
        blades.fillEllipse(3, -4, 5, 9);
        blades.fillEllipse(0, -7, 4, 13);
        blades.lineStyle(.7, 0xe0e8b5, .65).lineBetween(0, 0, 0, -11);
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
  private openPokedex(returnFocus: HTMLElement, view: 'team' | 'dex' = 'dex') {
    const panel = document.querySelector<HTMLElement>('#pokedex-panel');
    if (!panel || this.avatarEditorOpen || this.fishingActive || this.battleActive || this.journey?.isOpen) return;
    const browser = new PokemonPanel((itemId, creatureId) => void this.openItemEvolution(itemId, creatureId),
      this.previewMode ? undefined : creatureId => void this.reorderParty(creatureId, 0, browser),
      this.previewMode ? undefined : (creatureId, index) => void this.reorderParty(creatureId, index, browser, true));
    browser.render(this.save, view);
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
    this.mapLayer.sort('depth');
  }

  private closePokedex() {
    const panel = document.querySelector<HTMLElement>('#pokedex-panel');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    this.pokedexOpen = false;
    this.pokedexReturnFocus?.focus();
    this.pokedexReturnFocus = undefined;
  }

  private async reorderParty(creatureId: string, index: number, browser: PokemonPanel, focusHandle = false): Promise<void> {
    if (this.battleActive || this.completionActive || !this.pokedexOpen) return;
    const result = moveCreatureToSlot(this.save, creatureId, index);
    if (!result.ok) { browser.render(this.save, 'team'); return; }
    this.save = result.save;
    this.completionActive = true;
    try {
      if (!await ensureSavedProgress(() => this.persistProgress(), this.presentationAbort.signal)) return;
      if (this.pokedexOpen) {
        browser.render(this.save, 'team');
        const moved = [...document.querySelectorAll<HTMLElement>('#pokedex-list [data-party-id]')].find(row => row.dataset.partyId === creatureId);
        (focusHandle ? moved?.querySelector<HTMLButtonElement>('.party-drag') : document.querySelector<HTMLButtonElement>('#pokedex-list button'))?.focus();
      }
      this.showToast('Ordine della squadra salvato.');
    } finally { this.completionActive = false; }
  }

  private async editTrainerAppearance(): Promise<void> {
    if (this.previewMode || this.avatarEditorOpen || this.mapTransitionLoading || this.battleActive || this.moving || this.completionActive || this.challengeOperationActive || this.fishingActive || this.dialogueLines.length) return;
    this.avatarEditorOpen = true;
    document.querySelector<HTMLElement>('#settings-menu')!.hidden = true;
    this.heldDirection = null; this.queuedDirection = null;
    try {
      await showTrainerAppearanceDialog(readTrainerAppearance(this.save.player.appearance)!, async appearance => {
        const sheet = await createTrainerAvatarSheet(appearance);
        const previous = this.save.player.appearance;
        this.save = customizeTrainerAppearance(this.save, appearance);
        if (!await this.persistProgress()) { if (previous) this.save.player.appearance = previous; else delete this.save.player.appearance; return false; }
        const oldTexture = this.avatarTextureKey;
        this.avatarTextureKey = `veloria-avatar-edited-${++this.avatarRevision}`;
        this.textures.addCanvas(this.avatarTextureKey, sheet);
        this.player.remove(this.playerSprite, true);
        this.traveler = new TravelerAnimation(this, this.avatarTextureKey);
        this.playerSprite = this.traveler.sprite; this.player.add(this.playerSprite); this.drawFace();
        if (oldTexture !== TRAVELER_TEXTURE) this.textures.remove(oldTexture);
        this.showToast('Aspetto salvato. Buon viaggio!'); return true;
      });
    } finally { this.avatarEditorOpen = false; }
  }

  private showHabitatHint(): void {
    if (this.previewMode || this.save.flags.includes('tutorial_habitat_seen') || !this.renderedMap.triggers.some(trigger => trigger.kind === 'encounter-zone')) return;
    this.save.flags.push('tutorial_habitat_seen');
    this.showToast('Il simbolo a tre foglie indica dove incontrare Pokémon. Ritrovi la legenda in Menu → Come si gioca.');
    void this.persistProgress();
  }

  private showFieldGuide(): void {
    if (this.avatarEditorOpen || this.dialogueLines.length || this.battleActive || this.mapTransitionLoading || this.completionActive) return;
    this.showDialogue('Come si gioca', [
      'Cerca i ciuffi a tre foglie e camminaci dentro: segnano le celle dove puoi incontrare Pokémon. Gli incontri possono richiedere più passi. Serve almeno un compagno con PS: se sono tutti KO, curali al Centro Pokémon.',
      'Per pescare cerca il simbolo 🎣 PESCA, fermati accanto rivolto verso il punto e premi A. Ti serve la Canna da pesca della Capitana Marina a Portolume; non tutti gli specchi d’acqua sono postazioni.',
      'Segui i sentieri e le insegne per raggiungere porte e servizi. Le uscite indicano la destinazione; se un passaggio è chiuso, controlla l’obiettivo nel diario.',
      'WASD o frecce per muoverti; E, Spazio, Invio o A sullo schermo per parlare. Su telefono usa frecce o trackpad a destra e azioni a sinistra.',
    ]);
    document.querySelector('#dialogue-speaker')?.insertAdjacentHTML('afterbegin', ENCOUNTER_HABITAT_SYMBOL);
  }

  private makePlayer() {
    const player = this.add.container(0, 0).setSize(25, 40);
    const shadow = this.add.ellipse(0, 20, 24, 8, 0x24382e, .38);
    this.traveler = new TravelerAnimation(this, this.avatarTextureKey);
    this.playerSprite = this.traveler.sprite;
    player.add([shadow, this.playerSprite]);
    return player;
  }

  private drawFace() {
    this.traveler?.face(this.facing);
  }

  private bindTouchControls() {
    this.touchJoystick = new TouchJoystick(direction => {
      this.heldDirection = direction;
      if (direction) this.tryMove(direction);
      else this.queuedDirection = null;
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.touchJoystick?.destroy());
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
      if (this.challengeOperationActive) return; // Keep mandatory save recovery reachable.
      if(this.regionMap?.isOpen)this.regionMap.close();
      else if(this.journey?.isOpen)this.journey.close();
      else if(this.pokedexOpen)this.closePokedex();
      else if(this.dialogueLines.length)this.closeDialogue();
      else {const toast=document.querySelector<HTMLElement>('#toast');toast?.classList.remove('visible');clearTimeout(this.toastTimer);}
    });
    document.querySelector('#action-save')?.addEventListener('click',()=>this.persistProgress(true));
    document.querySelector('#help-button')?.addEventListener('click',()=>this.showFieldGuide());
    document.querySelector('#trainer-appearance-button')?.addEventListener('click',()=>void this.editTrainerAppearance());
    document.querySelector('#region-map-button')?.addEventListener('click', () => {
      if (this.battleActive || this.dialogueLines.length || this.mapTransitionLoading) return;
      this.heldDirection = null; this.queuedDirection = null;
      document.querySelectorAll('.dpad-key.pressed').forEach(button => button.classList.remove('pressed'));
      document.querySelector<HTMLButtonElement>('#menu-button')?.focus({ preventScroll: true });
      this.regionMap?.open(this.save);
    });
    document.querySelector('#pokedex-button')?.addEventListener('click', event => this.openPokedex(event.currentTarget as HTMLElement));
    document.querySelector('#team-button')?.addEventListener('click', event => this.openPokedex(event.currentTarget as HTMLElement, 'team'));
    document.querySelector('#training-button')?.addEventListener('click', () => this.showTrainingMenu());
    document.querySelector('#pokedex-close')?.addEventListener('click', () => this.closePokedex());
    document.querySelector('#pokedex-panel')?.addEventListener('keydown', event => {
      const keyboardEvent = event as KeyboardEvent;
      keyboardEvent.stopPropagation();
      if (keyboardEvent.key === 'Escape') { keyboardEvent.preventDefault(); this.closePokedex(); return; }
      if (keyboardEvent.key !== 'Tab') return;
      const controls = [...document.querySelectorAll<HTMLButtonElement>('#pokedex-panel button')];
      const first = controls[0], last = controls.at(-1);
      if (keyboardEvent.shiftKey && document.activeElement === first) { keyboardEvent.preventDefault(); last?.focus(); }
      else if (!keyboardEvent.shiftKey && document.activeElement === last) { keyboardEvent.preventDefault(); first?.focus(); }
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
    if (this.navigationOpen || this.fishingActive || this.battleActive || this.mapTransitionLoading || this.dialogueLines.length || this.pokedexOpen || this.journey?.isOpen) this.touchJoystick?.reset();
    if (this.movementReleaseRequired) {
      const movementKeys = ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'];
      if (!movementKeys.some(key => this.keys[key].isDown) && !this.heldDirection) this.movementReleaseRequired = false;
      else return;
    }
    if (this.navigationOpen) { this.heldDirection = null; this.queuedDirection = null; return; }
    // The UI can be replaced during a Vite hot reload while Phaser keeps its
    // scene alive for a frame. Treat a missing starter panel as closed instead
    // of letting one stale DOM reference stop the whole world loop.
    if(this.fishingActive||this.battleActive||this.mapTransitionLoading||this.dialogueLines.length||this.starterChoices?.hidden===false||this.pokedexOpen||this.journey?.isOpen)return;
    if(this.moving)return;
    if(this.slidingDirection){this.tryMove(this.slidingDirection);return;}
    if(this.heldDirection){this.tryMove(this.heldDirection);return;}
    if(this.keys.W.isDown||this.keys.UP.isDown)this.tryMove('up');
    else if(this.keys.S.isDown||this.keys.DOWN.isDown)this.tryMove('down');
    else if(this.keys.A.isDown||this.keys.LEFT.isDown)this.tryMove('left');
    else if(this.keys.D.isDown||this.keys.RIGHT.isDown)this.tryMove('right');
  }

  private tryMove(direction:Direction) {
    if (this.movementReleaseRequired) return;
    if (this.slidingDirection && direction !== this.slidingDirection) return;
    if (this.navigationOpen) return;
    if(this.fishingActive||this.battleActive||this.mapTransitionLoading||this.journey?.isOpen||this.pokedexOpen||this.dialogueLines.length||this.starterChoices?.hidden===false)return;
    if(this.moving){if(!this.slidingDirection)this.queuedDirection=direction;return;}
    const destination=tryGridMove(this.playerTile,direction,this.renderedMap.width,this.renderedMap.height,this.occupied);
    this.facing=direction;this.drawFace();
    if(!destination.moved){this.slidingDirection=null;return;}
    const {x,y}=destination.position;
    if(this.renderedMap.iceTiles.has(`${x},${y}`))this.slidingDirection=direction;
    this.journey?.compact();
    this.moving=true;this.playerTile={x,y};
    this.traveler.step(direction, this.time.now, this.reducedAnimations);
    this.tweens.add({targets:this.player,x:x*TILE+TILE/2,y:y*TILE+TILE/2,duration:132,ease:'Linear',onUpdate:()=>{
      this.player.setDepth(this.player.y+20);
      this.mapLayer.sort('depth');
    },onComplete:()=>{
      this.moving=false;
      const centerX=x*TILE+TILE/2,centerY=y*TILE+TILE/2;
      const trigger = selectAreaTrigger(this.renderedMap.triggers, { x: centerX, y: centerY });
      const interrupted = Boolean(trigger && (trigger.kind === 'encounter-zone' || trigger.id !== this.activeTriggerId));
      const continueSliding = !interrupted && iceSlideContinues(this.playerTile,direction,this.renderedMap.width,this.renderedMap.height,this.occupied,this.renderedMap.iceTiles);
      // Persist only a valid stopping point: reloading halfway across ice must
      // not create a new place to turn and bypass the authored puzzle.
      if(!continueSliding){this.save.player.x=x;this.save.player.y=y;this.persistProgress();}
      if (trigger?.kind === 'encounter-zone') {
        this.slidingDirection = null;
        this.queuedDirection = null;
        this.activeTriggerId = trigger.id;
        this.handleTrigger(trigger);
        return;
      }
      if (trigger?.id !== this.activeTriggerId) {
        this.activeTriggerId = trigger?.id ?? null;
        if (trigger) { this.slidingDirection = null; this.queuedDirection = null; this.handleTrigger(trigger); return; }
      }
      if(continueSliding){
        this.slidingDirection=direction;this.queuedDirection=null;this.tryMove(direction);return;
      }
      this.slidingDirection=null;
      const queuedDirection = this.queuedDirection;
      this.queuedDirection = null;
      if (queuedDirection) this.tryMove(queuedDirection);
    }});
  }

  private interact() {
    if (this.fishingActive) return;
    const {x,y}=adjacentGridPoint(this.playerTile,this.facing);
    const prop=this.interactionTarget(x,y);
    if (prop?.kind === 'npc') faceNpcTowardObserver(this.mapLayer, prop, this.playerTile);
    const serviceId = prop?.properties.serviceId;
    const shopId = prop?.properties.shopId;
    if (prop?.kind === 'research-clue' || prop?.kind === 'research-puzzle') {
      void this.showResearchInteraction(prop); return;
    }
    if (prop?.kind === 'wild-pokemon') {
      this.showSpecialEncounterMenu(String(prop.properties.specialEncounterId));
      return;
    }
    if (prop && (prop.kind === 'challenge-sequence' || typeof prop.properties.challengeId === 'string')) {
      this.showChallengeSequenceMenu(String(prop.properties.challengeId), typeof prop.properties.challengeStageId === 'string' ? prop.properties.challengeStageId : undefined);
      return;
    }
    if (prop?.kind === 'local-transport') {
      this.showLocalTransportMenu(String(prop.properties.networkId), String(prop.properties.stopId));
      return;
    }
    if (prop?.kind === 'fishing-spot') {
      this.showFishingMenu(prop);
      return;
    }
    if (prop?.kind === 'environment-regulator') {
      this.showEnvironmentRegulatorMenu(String(prop.properties.regulatorId));
      return;
    }
    if (prop?.kind === 'signal-router-switch') {
      this.showSignalRouterMenu(String(prop.properties.routerId), String(prop.properties.nodeId));
      return;
    }
    if (prop && serviceId === 'monorail') {
      this.showMonorailMenu(String(prop.properties.stationId));
      return;
    }
    if (serviceId === 'pokemon_center' || serviceId === 'rest_point') {
      this.showHealingMenu(prop?.name ?? 'Punto di riposo', serviceId === 'pokemon_center');
      return;
    }
    if (typeof shopId === 'string') {
      const required = prop?.properties.serviceRequiredFlag;
      if (typeof required === 'string' && !this.save.flags.includes(required)) {
        this.showToast(String(prop?.properties.serviceLockedMessage ?? 'Completa prima la prova indicata nel diario.'));
        return;
      }
      this.showShopMenu(prop?.name ?? 'Bottega', shopId); return;
    }
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
    const hasDialogue = prop?.kind === 'npc' || typeof prop?.properties.dialogueId === 'string';
    if (!hasDialogue && typeof questEvent === 'string') this.applyQuestEvent(questEvent);
    if (prop && hasDialogue) {
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
      if (dialogue.questEvent || dialogue.requiresStarterChoice || shouldBattle || dialogue.choices?.length) {
        this.afterDialogue = () => {
          if (dialogue.questEvent && this.applyQuestEvent(dialogue.questEvent)) this.refreshMapVisuals();
          nextAction?.();
          if (dialogue.requiresStarterChoice) this.showStarterChoices();
          if (dialogue.choices?.length) this.showDialogueChoices(dialogue);
          if (dialogue.questEvent && !this.journey?.hasReward) this.showToast('Diario aggiornato.');
          if (battleLocked) this.showToast(String(prop.properties.battleLockedMessage ?? `${trainer?.name ?? 'La guida'} aspetta che tu completi la prova della palestra.`));
          else if (shouldBattle && trainer) this.showTrainerChallenge(trainer);
        };
      }
      this.showDialogue(dialogue.speaker, dialogue.lines.map(line => line.replaceAll('{starter}', this.starterName())));
      return;
    }
    const message = prop?.properties.message;
    this.showToast(typeof message === 'string' ? message : 'Una brezza leggera attraversa la piazza.');
  }

  private interactionTarget(x: number, y: number): MapInteractable | undefined {
    // Preserve facing interactions; inscriptions underfoot are the fallback.
    return this.interactableAtTile(x, y) ?? this.interactableAtTile(this.playerTile.x, this.playerTile.y);
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
      if (progressed) this.refreshMapVisuals();
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
    const challenge = listChallengeSequences().find(sequence => this.save.flags.includes(sequence.activeFlag) && !this.save.flags.includes(sequence.completedFlag));
    if (challenge && !challenge.memberMapIds.includes(destination.metadata.id)) {
      this.mapTransitionLoading = false;
      this.afterDialogue = null;
      this.showServiceOptions(challenge.name, 'Uscire interrompe il tentativo: ripartirai dal primo incontro. Esperienza, denaro e risorse attuali restano conservati.', [
        { label: 'ESCI E INTERROMPI', icon: 'close', action: () => void this.leaveChallenge(challenge) },
        { label: 'RESTO NELLA SFIDA', icon: 'challenge', action: () => undefined },
      ]);
      return;
    }
    this.mapTransitionLoading = true;
    const previous = this.map;
    const gameRegion = document.querySelector('#game');
    gameRegion?.setAttribute('aria-busy', 'true');
    this.movementReleaseRequired = ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'].some(key => this.keys[key].isDown);
    this.heldDirection = null;
    this.queuedDirection = null;
    this.slidingDirection = null;
    document.querySelectorAll('.dpad-key.pressed').forEach(button => button.classList.remove('pressed'));
    const loading = document.querySelector<HTMLElement>('#game-loading');
    // Cached neighboring rooms should not flash the full startup screen.
    // Keep the current scene visible while an uncached illustration arrives.
    const loadingTimer = window.setTimeout(() => {
      if (!loading) return;
      const caption = loading.querySelector('span:last-child');
      if (caption) caption.textContent = `Andiamo a ${destination.metadata.displayName}…`;
      loading.hidden = false;
    }, 350);
    try {
      await this.loadMapRenderAssets(destination);
    } catch {
      window.clearTimeout(loadingTimer);
      this.releaseMapRenderAssets(destination, previous);
      this.mapTransitionLoading = false;
      gameRegion?.removeAttribute('aria-busy');
      if (loading) loading.hidden = true;
      this.showToast('La mappa non è disponibile. Riprova tra poco.');
      return;
    }

    window.clearTimeout(loadingTimer);
    if (loading) loading.hidden = true;
    await this.fadeMapTransition('out');
    if (!this.sys.isActive()) { gameRegion?.removeAttribute('aria-busy'); return; }
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
    this.mapLayer.sort('depth');
    this.fitWorldCamera();
    // A spawn may overlap an entry threshold: it must be left before it can
    // trigger again, regardless of whether movement was held during loading.
    this.activeTriggerId = selectAreaTrigger(this.renderedMap.triggers, { x: this.player.x, y: this.player.y })?.id ?? null;
    this.persistProgress();
    this.applyQuestEvent(`area/${destination.metadata.id}/enter`);
    await this.fadeMapTransition('in');
    this.heldDirection = null;
    this.queuedDirection = null;
    this.movementReleaseRequired = ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'].some(key => this.keys[key].isDown);
    document.querySelectorAll('.dpad-key.pressed').forEach(button => button.classList.remove('pressed'));
    this.mapTransitionLoading = false;
    gameRegion?.removeAttribute('aria-busy');
    this.showToast(destination.metadata.displayName);
    this.showHabitatHint();
  }

  private fadeMapTransition(direction: 'out' | 'in'): Promise<void> {
    const camera = this.cameras.main;
    if (this.reducedAnimations) {
      // No animated darkening or bright flash for reduced motion.
      camera.resetFX();
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const event = direction === 'out'
        ? Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE
        : Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE;
      const finish = () => {
        camera.off(event, finish);
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, finish);
        resolve();
      };
      camera.once(event, finish);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, finish);
      if (direction === 'out') camera.fadeOut(140, 15, 29, 38);
      else camera.fadeIn(180, 15, 29, 38);
    });
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
    const textureKeys = (map: RegisteredMap) => resolveMapRenderAssets([map.metadata]).flatMap(asset =>
      asset.kind === 'tileset' ? [asset.key, `${asset.key}-seamless`] : [asset.key]);
    const keep = new Set(textureKeys(to));
    for (const key of textureKeys(from)) {
      if (!keep.has(key) && this.textures.exists(key)) this.textures.remove(key);
    }
  }

  private tryWildEncounter(zone: MapTrigger) {
    if (!zone.encounterTableId) return;
    if (!this.save.party.some(creature => creature.hp > 0)) {
      if (this.time.now - this.lastExhaustedHabitatHintAt > 8_000) {
        this.showToast('La squadra è tutta KO: cura almeno un Pokémon al Centro Pokémon per cercare nuovi incontri.');
        this.lastExhaustedHabitatHintAt = this.time.now;
      }
      return;
    }
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
    this.startWildBattle(selected.speciesId, selected.level);
  }

  private showSpecialEncounterMenu(id: string): void {
    const encounter = specialEncounterCatalog[id];
    if (!encounter || this.previewMode || this.battleActive) return;
    const availability = specialEncounterAvailability(encounter, this.map.metadata.id, this.save.flags,
      this.save.party.some(creature => creature.hp > 0));
    if (availability !== 'available') {
      this.showToast(availability === 'exhausted' ? 'Cura almeno un Pokémon prima di questo incontro.'
        : availability === 'caught' ? 'Hai già accolto questo Pokémon.' : 'Potrai incontrare questo Pokémon dopo aver proseguito il viaggio.');
      return;
    }
    this.afterDialogue = null;
    this.showServiceOptions(battleSpecies[encounter.speciesId].name,
      `${encounter.description} Livello ${encounter.level}.`, [
        { label: 'INCONTRA', icon: 'pokeball', action: () => {
          if (specialEncounterAvailability(encounter, this.map.metadata.id, this.save.flags,
            this.save.party.some(creature => creature.hp > 0)) === 'available') {
            this.startWildBattle(encounter.speciesId, encounter.level, encounter);
          }
        } },
        { label: 'MI PREPARO', icon: 'close', action: () => undefined },
      ]);
  }

  private async showResearchInteraction(prop: MapInteractable): Promise<void> {
    if (this.previewMode || this.battleActive || this.challengeOperationActive) return;
    const research = getLegendaryResearch(String(prop.properties.researchId));
    if (!research) return;
    this.afterDialogue = null;
    const clueId = prop.properties.researchClueId;
    if (typeof clueId !== 'string') {
      if (research.puzzle.mapId === this.map.metadata.id) this.showResearchPuzzle(research);
      return;
    }
    const clue = research.clues.find(clue => clue.id === clueId && clue.mapId === this.map.metadata.id);
    if (!clue) return;
    const update = applyQuestEvent(this.save, clue.event, questCatalog, { species: battleSpecies, moves: battleMoves });
    this.save = update.save;
    const finish = () => {
      this.challengeOperationActive = false;
      this.refreshMapVisuals();
      const state = legendaryResearchState(research, this.save.flags);
      this.showDialogue(clue.title, [clue.text, `Indizi nel diario: ${state.foundClueIds.length}/${research.clues.length}. Puoi rileggerli quando vuoi.`]);
    };
    if (update.progressed) {
      this.challengeOperationActive = true;
      await this.requireChallengeSave(finish);
    } else finish();
  }

  private showResearchPuzzle(research: LegendaryResearchDefinition, feedback = ''): void {
    this.afterDialogue = null;
    const state = legendaryResearchState(research, this.save.flags);
    if (state.status === 'locked') {
      this.showDialogue(research.puzzle.title, ['Puoi annotare gli indizi già adesso. Per completare questa ricerca devi prima vincere la Lega.']); return;
    }
    if (state.status === 'searching') {
      this.showDialogue(research.puzzle.title, [`Prima di attivare la prova, annota gli indizi nell’ambiente. Indizi trovati: ${state.foundClueIds.length}/${research.clues.length}.`, research.regionHint]); return;
    }
    if (state.status === 'revealed') {
      this.showDialogue(research.puzzle.title, [state.captured ? 'Ricerca d’archivio completata. Il Pokémon che hai già catturato resta con te: qui non ne apparirà un’altra copia.'
        : 'Hai individuato il rifugio. Ora il diario e la mappa possono mostrarti il punto dell’incontro. Dopo una fuga o un KO potrai riprovare.']); return;
    }
    this.showServiceOptions(research.puzzle.title, `${feedback ? feedback + ' ' : ''}${research.puzzle.hint} Segni ricostruiti: ${state.progress}/${research.puzzle.solution.length}.`, [
      ...research.puzzle.options.map(option => ({ label: option.label, icon: 'challenge' as const, action: () => void this.applyResearchSymbol(research, option.id) })),
      { label: 'RILEGGI GLI INDIZI', icon: 'challenge', action: () => this.showServiceOptions('Appunti di ricerca', research.clues.map(clue => `${clue.title}: ${clue.text}`).join(' '), [
        { label: 'TORNA ALLA PROVA', icon: 'challenge', action: () => this.showResearchPuzzle(research) },
        { label: 'NON ORA', icon: 'close', action: () => undefined },
      ]) },
      { label: 'AZZERA LA SEQUENZA', icon: 'close', action: () => void this.applyResearchSymbol(research, '__reset') },
      { label: 'NON ORA', icon: 'close', action: () => undefined },
    ]);
  }

  private async applyResearchSymbol(research: LegendaryResearchDefinition, optionId: string): Promise<void> {
    if (this.battleActive || this.challengeOperationActive || research.puzzle.mapId !== this.map.metadata.id) return;
    const result = chooseResearchSymbol(research, this.save.flags, optionId);
    this.save = { ...this.save, flags: result.flags };
    const quest = result.event ? applyQuestEvent(this.save, result.event, questCatalog, { species: battleSpecies, moves: battleMoves }) : undefined;
    if (quest) this.save = quest.save;
    this.challengeOperationActive = true;
    await this.requireChallengeSave(() => {
      this.challengeOperationActive = false;
      this.refreshMapVisuals();
      if (quest?.completedQuestIds.length) {
        this.showResearchPuzzle(research);
        this.journey?.celebrate(quest.completedQuestIds, this.save);
      } else if (result.outcome === 'wrong') this.showResearchPuzzle(research,
        optionId === '__reset' ? 'La sequenza è stata azzerata.' : 'La sequenza non coincide. Gli indizi restano nel diario. Riparti dal primo segno.');
      else this.showResearchPuzzle(research, 'Il segno risponde. Continua la sequenza.');
    });
  }

  private startWildBattle(speciesId: number, level: number, special?: SpecialEncounter) {
    const state = createWildBattle({
      save: this.save,
      speciesId,
      level,
      registries: { species: battleSpecies, moves: battleMoves },
      rules: veloriaBattleRules,
      battleId: createUniqueId(),
    });
    this.beginBattle(state, undefined, undefined, special);
  }

  private showFishingMenu(prop: MapInteractable) {
    const tableId = prop.properties.encounterTableId;
    const itemId = prop.properties.requiredItemId;
    const biteChance = prop.properties.biteChance;
    const table = typeof tableId === 'string' ? encounterCatalog[tableId] : undefined;
    if (!table || typeof itemId !== 'string' || !itemCatalog[itemId] || typeof biteChance !== 'number') {
      this.showToast('Postazione di pesca non configurata.');
      return;
    }
    const spot: FishingSpot = {
      id: prop.id, mapId: this.map.metadata.id, encounterTableId: table.id,
      requiredItemId: itemId, biteChance,
      requiredFlags: typeof prop.properties.requiredFlag === 'string' ? [prop.properties.requiredFlag] : [],
    };
    const fishingHint = this.save.inventory[itemId]
      ? `Usa ${itemCatalog[itemId].name} per cercare Pokémon nell’acqua. La canna non si consuma.`
      : `Ti serve ${itemCatalog[itemId].name}. Parla con la Capitana Marina al porto di Portolume per riceverla.`;
    this.showServiceOptions(prop.name, fishingHint, [
      { label: 'PESCA', icon: 'fishing', action: () => {
        if (this.fishingActive || this.battleActive || this.mapTransitionLoading) return;
        const result = castFishingLine({
          spot, mapId: this.map.metadata.id, inventory: this.save.inventory, flags: this.save.flags,
          hasReadyCreature: this.save.party.some(creature => creature.hp > 0),
          rngState: this.save.rngState, localHour: new Date().getHours(), table, species: battleSpecies,
        });
        if (result.kind === 'blocked') {
          const messages = {
            'missing-equipment': `Ti serve ${itemCatalog[itemId].name}. Chiedila alla Capitana Marina a Portolume.`,
            exhausted: 'La squadra ha bisogno di riposare prima di pescare.',
            locked: 'Questo punto di pesca non è ancora disponibile.',
            'wrong-map': 'Avvicinati alla postazione per pescare.',
          };
          this.showToast(messages[result.reason]);
          return;
        }
        this.save.rngState = result.nextRngState;
        this.persistProgress();
        this.fishingActive = true;
        this.heldDirection = null;
        this.queuedDirection = null;
        this.showToast('Lenza in acqua…');
        const direction = adjacentGridPoint({x:0,y:0},this.facing);
        playFishingCast(this,{x:this.player.x,y:this.player.y-12},
          {x:prop.x+prop.width/2+direction.x*24,y:prop.y+prop.height/2+direction.y*24},
          this.reducedAnimations,result.kind==='encounter',()=>{
            this.fishingActive=false;
            if(result.kind==='no-bite')this.showToast('Nessuna abboccata. Puoi rilanciare la lenza.');
            else this.startWildBattle(result.encounter.speciesId,result.encounter.level);
          });
      } },
      { label: 'NON PESCARE', icon: 'close', action: () => undefined },
    ]);
  }

  private recoverChallengeProgress(): void {
    if (this.previewMode) return;
    const trainingFlags = recoverTrainingAttempts(this.save.flags);
    if (trainingFlags.length !== this.save.flags.length) {
      this.save = { ...this.save, flags: trainingFlags };
      this.challengeRecovered = true;
    }
    for (const sequence of listChallengeSequences()) {
      const state = challengeSequenceState(sequence, this.save);
      const outsideAttempt = ['active', 'pending'].includes(state.status) && !sequence.memberMapIds.includes(this.save.player.mapId);
      const result = outsideAttempt ? abortChallengeSequence(sequence, this.save) : recoverChallengeSequence(sequence, this.save);
      const stranded = sequence.memberMapIds.includes(this.save.player.mapId) && ['inactive', 'ready'].includes(result.state.status);
      if (!result.changed && !result.checkpoint && !stranded) continue;
      this.save = { ...this.save, flags: result.flags };
      const checkpoint = result.checkpoint ?? (stranded ? sequence.checkpoint : null);
      if (checkpoint) {
        const map = getMap(checkpoint.mapId), spawn = getSpawn(map, checkpoint.spawnId);
        this.save = { ...this.save, player: { ...this.save.player, mapId: map.metadata.id, spawnPointId: spawn.id, x: spawn.x, y: spawn.y } };
      }
      this.challengeRecovered = true;
    }
  }

  private async finishChallengeRecovery(): Promise<void> {
    await this.requireChallengeSave(() => {
      this.challengeOperationActive = false;
      this.challengeRecovered = false;
      this.showToast('Tentativo aggiornato. Esperienza, denaro e risorse sono conservati.');
      if (this.save.flags.includes('q_league_completed') && !this.save.flags.includes('q_league_epilogue_seen')) void this.presentLeagueFinale();
    });
  }

  private async requireChallengeSave(continuation: () => void | Promise<void>): Promise<void> {
    if (await this.persistProgress()) { await continuation(); return; }
    this.challengeOperationActive = true;
    this.afterDialogue = null;
    this.showServiceOptions('Salvataggio da completare', 'I progressi sono pronti, ma non sono ancora al sicuro. Riprova il salvataggio prima di proseguire.', [
      { label: 'RIPROVA SALVATAGGIO', icon: 'challenge', action: () => void this.requireChallengeSave(continuation) },
    ]);
    const keyboard = this.starterChoices.onkeydown;
    this.starterChoices.onkeydown = event => {
      if (event.key === 'Escape' || event.key.toLowerCase() === 'b') { event.preventDefault(); event.stopPropagation(); return; }
      keyboard?.call(this.starterChoices, event);
    };
  }

  private challengeServicePermitted(service: 'healing' | 'storage'): boolean {
    const blocked = listChallengeSequences().some(sequence => !challengeServiceAllowed(sequence, this.save, service));
    if (blocked) this.showToast('Durante il tentativo non puoi riposare o usare il deposito. Puoi usare gli strumenti in battaglia oppure interrompere la sfida.');
    return !blocked;
  }

  private showChallengeSequenceMenu(id: string, stageId?: string): void {
    this.afterDialogue = null;
    const sequence = getChallengeSequence(id);
    if (!sequence) { this.showToast('Questa sfida non è disponibile.'); return; }
    if (this.previewMode) { this.showToast('Apri la partita salvata per partecipare alla sfida.'); return; }
    const state = challengeSequenceState(sequence, this.save);
    if (state.status === 'completed') {
      this.showServiceOptions(sequence.name, 'Hai conquistato il titolo! I tuoi progressi restano disponibili e puoi continuare a esplorare.', [
        { label: 'RIVEDI IL TRAGUARDO', icon: 'challenge', action: () => void this.presentLeagueFinale(true) },
        { label: 'CONTINUA IL VIAGGIO', icon: 'close', action: () => undefined },
      ]);
      return;
    }
    if (state.status === 'invalid' || state.status === 'pending' || state.status === 'awaitingCompletion') {
      this.showServiceOptions(sequence.name, 'Questo tentativo non può essere ripreso da qui. Ripartiamo dal piazzale conservando i progressi della squadra.', [
        { label: 'TORNA AL PIAZZALE', icon: 'transit', action: () => void this.leaveChallenge(sequence) },
      ]);
      return;
    }
    if (state.status === 'inactive') {
      this.showDialogue(sequence.name, [`Per partecipare servono le ${sequence.requiredBadgeIds.length} medaglie richieste e le missioni di accesso completate. Medaglie richieste ancora mancanti: ${state.missingBadgeIds.length}.`,
        state.missingFlags.length ? 'Controlla il diario e completa le missioni di accesso prima di iniziare.' : 'Completa le prove delle Palestre, poi torna al piazzale.']);
      return;
    }
    if (state.status === 'ready') {
      if (listChallengeSequences().some(other => other.id !== sequence.id && this.save.flags.includes(other.activeFlag))) {
        this.showToast('Concludi o interrompi prima il tentativo già in corso.'); return;
      }
      this.showServiceOptions(sequence.name, `${sequence.stages.length} incontri in ordine, con la tua squadra attuale. Nessuna cura o deposito tra le prove; gli strumenti sono consentiti. Se perdi o esci, ricominci dal primo incontro conservando esperienza e risorse attuali.`, [
        { label: 'INIZIA IL TENTATIVO', icon: 'challenge', action: () => {
          const result = startChallengeSequence(sequence, this.save, this.save.party.some(creature => creature.hp > 0));
          if (!result.accepted) { this.showToast('Prepara una squadra cosciente prima di entrare.'); return; }
          this.save = { ...this.save, flags: result.flags };
          void this.travelToChallengeStage(sequence, result.nextStageId!);
        } },
        { label: 'MI PREPARO ANCORA', icon: 'close', action: () => undefined },
      ]);
      return;
    }
    const next = sequence.stages.find(stage => stage.id === state.nextStageId)!;
    const trainer = trainerCatalog[next.trainerId];
    if (!trainer) { this.showToast('L’avversario della prossima prova non è disponibile.'); return; }
    const atOpponent = stageId === next.id && this.map.metadata.id === next.mapId;
    this.showServiceOptions(sequence.name, `${state.wonStageIds.length}/${sequence.stages.length} prove superate. Prossimo avversario: ${trainer.name}.${atOpponent ? ` ${trainerChallengePrompt(trainer, this.save.party, this.save.inventory)}` : ' Puoi proseguire quando sei pronto.'}`, [
      { label: atOpponent ? 'SFIDA' : 'PROSEGUI ALLA PROSSIMA PROVA', icon: 'challenge', action: () => {
        if (atOpponent) void this.startChallengeBattle(sequence, next.id);
        else void this.travelToChallengeStage(sequence, next.id);
      } },
      { label: 'INTERROMPI IL TENTATIVO', icon: 'close', action: () => this.confirmChallengeExit(sequence) },
      { label: 'NON ORA', icon: 'close', action: () => undefined },
    ]);
  }

  private confirmChallengeExit(sequence: ChallengeSequence): void {
    this.afterDialogue = null;
    this.showServiceOptions(sequence.name, 'Interrompere significa ricominciare dal primo incontro. Esperienza, denaro e risorse attuali restano conservati.', [
      { label: 'ESCI E INTERROMPI', icon: 'close', action: () => void this.leaveChallenge(sequence) },
      { label: 'RESTO NELLA SFIDA', icon: 'challenge', action: () => undefined },
    ]);
  }

  private async travelToChallengeStage(sequence: ChallengeSequence, stageId: string): Promise<void> {
    if (this.challengeOperationActive) return;
    const state = challengeSequenceState(sequence, this.save);
    const stage = sequence.stages.find(candidate => candidate.id === stageId);
    if (state.status !== 'active' || state.nextStageId !== stageId || !stage) return;
    this.challengeOperationActive = true;
    await this.requireChallengeSave(async () => {
      this.mapTransitionLoading = true;
      await this.transitionToMap(getMap(stage.mapId), getSpawn(getMap(stage.mapId), stage.spawnId));
      await this.requireChallengeSave(() => { this.challengeOperationActive = false; });
    });
  }

  private async leaveChallenge(sequence: ChallengeSequence): Promise<void> {
    if (this.challengeOperationActive) return;
    this.challengeOperationActive = true;
    const result = abortChallengeSequence(sequence, this.save);
    this.save = { ...this.save, flags: result.flags };
    await this.requireChallengeSave(async () => {
      const checkpoint = sequence.checkpoint, map = getMap(checkpoint.mapId);
      this.mapTransitionLoading = true;
      await this.transitionToMap(map, getSpawn(map, checkpoint.spawnId));
      await this.requireChallengeSave(() => { this.challengeOperationActive = false; });
    });
  }

  private async startChallengeBattle(sequence: ChallengeSequence, stageId: string): Promise<void> {
    if (this.challengeOperationActive || this.battleActive) return;
    const stage = sequence.stages.find(candidate => candidate.id === stageId);
    if (!stage || !trainerCatalog[stage.trainerId] || stage.mapId !== this.map.metadata.id || !this.save.party.some(creature => creature.hp > 0)) { this.showToast('La squadra o la prossima prova non sono disponibili. Puoi interrompere il tentativo e riposare al piazzale.'); return; }
    const prepared = prepareChallengeBattle(sequence, this.save, stageId);
    if (!prepared.accepted) return;
    this.save = { ...this.save, flags: prepared.flags };
    this.challengeOperationActive = true;
    await this.requireChallengeSave(() => {
      this.challengeOperationActive = false;
      this.startTrainerBattle(trainerCatalog[stage.trainerId], { sequence, stageId });
    });
  }

  private async presentLeagueFinale(review = false): Promise<void> {
    if (this.previewMode || this.completionActive || !this.save.flags.includes('q_league_completed') || !review && this.save.flags.includes('q_league_epilogue_seen')) return;
    this.completionActive = true;
    this.heldDirection = null; this.queuedDirection = null;
    this.scene.pause('world');
    const shell = document.querySelector<HTMLElement>('.game-shell');
    if (shell) shell.inert = true;
    try {
      const { showLeagueCompletion } = await import('../ui/LeagueCompletion');
      await showLeagueCompletion(this.save);
      const result = applyQuestEvent(this.save, 'league/epilogue/seen', questCatalog, { species: battleSpecies, moves: battleMoves });
      this.save = result.save;
      await this.requireChallengeSave(() => { this.challengeOperationActive = false; });
    } catch (error) {
      this.showToast('Il riepilogo non è stato aperto. Puoi rivederlo dal terminale della Lega.');
      console.error('Unable to present league completion.', error);
    } finally {
      if (shell) shell.inert = false;
      this.completionActive = false;
      this.scene.resume('world');
    }
  }

  private startTrainerBattle(trainer: (typeof trainerCatalog)[string], challenge?: { sequence: ChallengeSequence; stageId: string }) {
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
      this.beginBattle(state, trainer, challenge);
    } catch (error) {
      this.showToast(error instanceof Error ? `Battaglia non avviata: ${error.message}` : 'Battaglia non avviata.');
      if (challenge) {
        this.save = { ...this.save, flags: this.save.flags.filter(flag => flag !== challenge.sequence.pendingBattleFlag) };
        this.challengeOperationActive = true;
        void this.requireChallengeSave(() => { this.challengeOperationActive = false; });
      }
    }
  }

  private beginBattle(state: BattleState, trainer?: (typeof trainerCatalog)[string], challenge?: { sequence: ChallengeSequence; stageId: string }, special?: SpecialEncounter, training?: { attemptId: string }) {
    if (this.battleActive) return;
    this.battleActive = true;
    const gameRegion = document.querySelector<HTMLElement>('#game');
    gameRegion?.setAttribute('aria-busy', 'true');
    this.onMusicThemeChange(this.map.metadata.id === 'veloria/gym01_brumalta' ? 'battle_gym' : trainer ? 'battle_trainer' : 'battle_wild');
    let dismissMessage = 'Lo scontro è terminato.';
    let earnedMoney = 0;
    let earnedBadgeId: string | undefined;
    let completionHandled = false;
    let challengeSaved: Promise<boolean> = Promise.resolve(true);
    let challengeReturn = false;
    let leagueCompletion = false;
    const hadAuroraBadge = this.save.flags.includes('badge_aurora_awarded');
    const ownedSpecies = new Set([...this.save.party, ...this.save.storage].map(creature => creature.speciesId));
    void this.ensureBattleScene().then(() => {
      document.body.classList.add('battle-active');
      document.querySelector<HTMLElement>('#save-menu')!.hidden = true;
      this.scene.launch('battle', {
        onReady: () => gameRegion?.removeAttribute('aria-busy'),
        opponentPolicy: getOpponentPolicy(trainer?.aiProfileId),
        state,
        moveCatalog: battleMoves,
        rules: veloriaBattleRules,
        inventory: this.save.inventory,
        itemNames: Object.fromEntries(Object.values(itemCatalog).map(item => [item.id, item.name])),
        createInstanceId: createUniqueId,
        arenaTextureKey: this.map.metadata.battleBackgroundKey,
        reducedAnimations: this.reducedAnimations,
        capturedIsNew: state.opponent.creatures.some(creature => !ownedSpecies.has(creature.speciesId)),
        onEvolutionPresented: async (receiptKey: string, battleSignal: AbortSignal) => {
          if (!this.save.flags.includes(receiptKey)) return;
          const signal = AbortSignal.any([this.presentationAbort.signal, battleSignal]);
          this.save = { ...this.save, flags: this.save.flags.filter(flag => flag !== receiptKey) };
          if (!await ensureSavedProgress(() => this.persistProgress(), signal)) throw new DOMException('Presentation cancelled', 'AbortError');
        },
        beforeCelebration: async (_state: BattleState, _events: readonly BattleEvent[], battleSignal: AbortSignal) => {
          const signal = AbortSignal.any([this.presentationAbort.signal, battleSignal]);
          if (!await ensureSavedProgress(() => this.persistProgress(), signal)) throw new DOMException('Presentation cancelled', 'AbortError');
          await this.presentPendingEvolutions(signal);
        },
        victoryPresentation: trainer ? () => ({ trainerName: trainer.name, rewardMoney: earnedMoney, badgeId: earnedBadgeId, feedback: trainer.victoryFeedback ?? trainer.victoryMessage }) : undefined,
        onSpeciesSeen: (speciesId: number) => {
          if (!battleSpecies[speciesId] || this.save.flags.includes(`pokedex_seen_${speciesId}`)) return;
          this.save.flags = recordSpeciesSeen(this.save.flags, speciesId);
          void this.persistProgress();
        },
        onComplete: (finalState: BattleState, events: readonly BattleEvent[], presentedEvolutions: readonly string[] = []) => {
          if (completionHandled) return;
          completionHandled = true;
          const previousMoney = this.save.player.money;
          const scatteredCoins = payDayReward(finalState);
          const previousBadges = new Set(this.save.badges);
          this.save = mergeBattlePlayerState(this.save, finalState);
          this.save = queueEvolutionReceipts(this.save, events.flatMap(event =>
            event.type === 'creatureEvolved' && event.side === 'player' && !presentedEvolutions.includes(evolutionReceiptFlag(event)) ? [{ creatureId: event.creatureId,
              fromSpeciesId: event.fromSpeciesId, toSpeciesId: event.toSpeciesId, level: event.level }] : []));
          this.save.inventory = consumeBattleItems(this.save.inventory, events);
          if (training && trainer) {
            const outcome = finalState.outcome.kind === 'won' && finalState.outcome.winner === 'player' ? 'won'
              : finalState.outcome.kind === 'draw' ? 'draw' : 'lost';
            const result = settleTrainingAttempt({ flags: this.save.flags, money: this.save.player.money,
              attemptId: training.attemptId, rewardMoney: trainer.rewardMoney + scatteredCoins, outcome });
            this.save = { ...this.save, flags: result.flags, player: { ...this.save.player, money: result.money } };
            earnedMoney = result.earnedMoney;
            dismissMessage = outcome === 'won' ? `Allenamento vinto! Hai guadagnato ${earnedMoney} monete. Puoi scegliere una nuova sfida dal menu.`
              : 'Allenamento terminato. Esperienza e risorse attuali sono conservate; puoi riprovare senza pagare un ingresso.';
            if (this.save.party.every(creature => creature.hp === 0)) {
              this.save = healParty(this.save, battleMoves);
              dismissMessage += ' La squadra è stata soccorsa e curata.';
            }
            challengeSaved = this.persistProgress();
            return;
          }
          if (challenge && trainer) {
            const outcome = finalState.outcome.kind === 'won' && finalState.outcome.winner === 'player' ? 'won'
              : finalState.outcome.kind === 'draw' ? 'draw' : 'lost';
            try {
              const settled = settleChallengeSave(this.save, challenge.sequence, challenge.stageId, outcome, trainer.rewardMoney, questCatalog, { species: battleSpecies, moves: battleMoves });
              this.save = settled.save;
              if (settled.result.accepted) this.save.player.money += scatteredCoins;
              earnedMoney = settled.earnedMoney + (settled.result.accepted ? scatteredCoins : 0);
              leagueCompletion = settled.newCompletion;
              challengeReturn = settled.result.checkpoint !== null;
              this.pendingQuestCelebrations.push(...settled.completedQuestIds);
              dismissMessage = outcome === 'won' ? leagueCompletion ? `Hai completato ${challenge.sequence.name}!` : 'Prova superata! Parla con la guida o usa il terminale per proseguire.'
                : 'Il tentativo è terminato. Torni al piazzale conservando esperienza e risorse: lì puoi curare la squadra.';
            } catch (error) {
              const aborted = abortChallengeSequence(challenge.sequence, this.save);
              this.save = { ...this.save, flags: aborted.flags };
              challengeReturn = true;
              dismissMessage = 'Non è stato possibile registrare la prova. Il tentativo è interrotto; i progressi della squadra sono conservati.';
              console.error('Unable to settle challenge battle.', error);
            }
            challengeSaved = this.persistProgress();
            return;
          }
          this.save.player.money += scatteredCoins;
          if (finalState.outcome.kind === 'won' && finalState.outcome.winner === 'player') {
            if (trainer && !this.save.flags.includes(trainer.battleOnceFlag)) {
              this.save.player.money += trainer.rewardMoney;
              this.save = { ...this.save, flags: [...this.save.flags, trainer.battleOnceFlag] };
              this.applyQuestEvent(trainer.defeatQuestEvent);
              earnedMoney = this.save.player.money - previousMoney;
              earnedBadgeId = this.save.badges.find(id => !previousBadges.has(id));
              dismissMessage = trainer.victoryMessage;
            } else dismissMessage = 'Hai vinto lo scontro.';
          } else if (finalState.outcome.kind === 'captured') {
            if (special) this.applyQuestEvent(special.captureEvent);
            dismissMessage = finalState.outcome.destination === 'storage'
              ? 'Il nuovo Pokémon ti aspetta al deposito.' : 'Il nuovo Pokémon si è unito alla squadra.';
          } else if (finalState.outcome.kind === 'fled') {
            dismissMessage = 'Sei riuscito a fuggire.';
          } else if (finalState.outcome.kind === 'draw' || finalState.outcome.kind === 'won' && finalState.outcome.winner === 'opponent') {
            if (this.save.party.every(creature => creature.hp === 0)) {
              // The MVP docs do not define a blackout penalty; heal fully to prevent a softlock.
              this.save = healParty(this.save, battleMoves);
              dismissMessage = 'La squadra è stata soccorsa e curata dopo lo scontro.';
            } else dismissMessage = 'La squadra non può continuare. Riprendi fiato e prova ancora.';
          }
          if (scatteredCoins > 0) dismissMessage += ` Hai raccolto ${scatteredCoins} monete.`;
          this.persistProgress();
        },
        onDismiss: (event?: KeyboardEvent) => {
          this.scene.stop('battle');
          this.scene.resume('world');
          this.battleActive = false;
          this.onMusicThemeChange(this.map.metadata.musicId);
          document.body.classList.remove('battle-active');
          gameRegion?.removeAttribute('aria-busy');
          if (challenge || training) {
            this.challengeOperationActive = true;
            const finish = async () => {
              this.challengeOperationActive = false;
              this.journey?.celebrate(this.pendingQuestCelebrations);
              this.pendingQuestCelebrations = [];
              if (challengeReturn && challenge) await this.leaveChallenge(challenge.sequence);
              this.showToast(dismissMessage);
              if (leagueCompletion) await this.presentLeagueFinale();
            };
            void challengeSaved.then(async saved => {
              if (saved) await finish();
              else await this.requireChallengeSave(finish);
            });
            return;
          }
          this.journey?.celebrate(this.pendingQuestCelebrations);
          this.pendingQuestCelebrations = [];
          if (special) {
            this.refreshMapVisuals();
            if (!this.save.flags.includes(special.capturedFlag)) dismissMessage += ' Potrai ritrovare questo Pokémon qui e riprovare.';
          }
          this.persistProgress();
          this.showToast(dismissMessage);
          if (!hadAuroraBadge && this.save.flags.includes('badge_aurora_awarded') && !this.previewMode) void this.presentPrologueCompletion(event?.key);
        },
      });
      this.scene.pause('world');
    }).catch(error => {
      gameRegion?.removeAttribute('aria-busy');
      this.battleActive = false;
      this.onMusicThemeChange(this.map.metadata.musicId);
      this.showToast('Non è stato possibile caricare la battaglia. Riprova.');
      console.error('Unable to load the battle scene.', error);
      if (challenge || training) {
        this.save = { ...this.save, flags: challenge ? this.save.flags.filter(flag => flag !== challenge.sequence.pendingBattleFlag) : recoverTrainingAttempts(this.save.flags) };
        this.challengeOperationActive = true;
        void this.requireChallengeSave(() => { this.challengeOperationActive = false; });
      }
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
    if (this.slidingDirection) return;
    if (this.navigationOpen) return;
    if (this.starterChoices?.hidden === false) return;
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
    const actionLabel = this.interactionActionLabel();
    this.dialogueLines=lines.map(line=>line.replaceAll('{trainer}',this.save.player.name)
      .replaceAll('premi A', `premi ${actionLabel}`).replaceAll('Premi A', `Premi ${actionLabel}`)
      .replaceAll('con A', `con ${actionLabel}`));this.dialogueIndex=0;
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
    const startedAt = performance.now();
    this.typingTimer = window.setInterval(() => {
      if (!this.typingTarget) { this.stopTyping(); return; }
      // Browser timers can be delayed or coalesced by rendering or background
      // work. Keep the chosen reading speed tied to elapsed time, not callbacks.
      this.typingIndex = Math.min(this.typingCharacters.length, Math.max(1, Math.floor((performance.now() - startedAt) / delay)));
      this.typingTarget.textContent = this.typingCharacters.slice(0, this.typingIndex).join('');
      if (this.typingIndex >= this.typingCharacters.length) this.stopTyping();
    }, delay);
    document.querySelector<HTMLElement>('#dialogue-prompt')!.textContent=this.interactionActionLabel()+(this.dialogueIndex<this.dialogueLines.length-1?' · Continua  ▸':' · Chiudi  ▸');
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
    this.starterChoices.hidden = true;
    this.starterChoices.onkeydown = null;
    this.starterChoices.onkeyup = null;
    this.dialogueLines=[];this.dialogueIndex=0;this.dialogueBox.hidden=true;
    document.querySelector('.game-stage')?.classList.remove('has-dialogue');
    const next=this.afterDialogue;this.afterDialogue=null;next?.();
  }

  private showStarterChoices() {
    this.starterChoices.setAttribute('aria-label', 'Scegli il tuo compagno iniziale');
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
        this.showDialogue('Professoressa Elia',[`Ottima scelta. ${starter.name} sarà il tuo compagno di viaggio.`,`Parlami ancora con ${this.interactionActionLabel()} per ricevere la missione. Poi esci dalla porta in basso: il sentiero a nord si trova fuori, nel paese.`]);
        this.persistProgress(true);
      });
      return button;
    }));
    this.starterChoices.hidden=false;
    // Keep keyboard activation inside the choice panel. Phaser captures Space
    // for the world and would otherwise suppress the button's native click.
    this.starterChoices.onkeydown = event => {
      event.stopPropagation();
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) (event.target as HTMLElement).closest<HTMLButtonElement>('button')?.click();
      }
    };
    this.starterChoices.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }

  private showHealingMenu(name: string, includeStorage: boolean) {
    if (!this.challengeServicePermitted('healing')) return;
    this.afterDialogue = null;
    this.showServiceOptions(name, 'La squadra recupererà tutti gli HP, i PP e gli stati alterati.', [
      { label: 'RIPOSA', icon: 'rest', action: () => {
        if (!this.challengeServicePermitted('healing')) return;
        this.save = healParty(this.save, battleMoves);
        this.persistProgress();
        this.showToast('La squadra è in piena forma.');
      } },
      ...(includeStorage ? [{ label: 'DEPOSITO', icon: 'storage' as const, action: () => this.showStorageMenu(name) }] : []),
      ...(includeStorage ? [{ label: 'SCAMBI', icon: 'trade' as const, action: () => void this.openTradeEvolution(name) }] : []),
      { label: 'DOPO', icon: 'close', action: () => undefined },
    ]);
  }

  private showStorageMenu(_name: string) {
    if (!this.challengeServicePermitted('storage') || this.completionActive) return;
    void this.runManagementService(signal => showStorageManager({
      getSave: () => this.save, commit: save => this.commitManagementSave(save), signal,
    }));
  }

  private showShopMenu(name: string, shopId: string) {
    const shop = shopCatalog[shopId];
    if (!shop) { this.showToast('Questa bottega non è ancora aperta.'); return; }
    if (this.completionActive) return;
    void this.runManagementService(signal => showShopManager({
      name, shop, catalog: itemCatalog, getSave: () => this.save,
      commit: save => this.commitManagementSave(save), signal,
    }));
  }

  private async runManagementService(open: (signal: AbortSignal) => Promise<void>): Promise<void> {
    this.completionActive = true;
    try { await open(this.presentationAbort.signal); }
    finally { this.input.keyboard?.resetKeys(); this.completionActive = false; }
  }

  private async commitManagementSave(save: GameSave): Promise<boolean> {
    this.save = save;
    if (this.previewMode) return true;
    return ensureSavedProgress(() => this.persistProgress(), this.presentationAbort.signal);
  }

  private showDialogueChoices(dialogue: Dialogue): void {
    this.afterDialogue = null;
    const choices = (dialogue.choices ?? []).filter(choice =>
      (choice.requiresFlags ?? []).every(flag => this.save.flags.includes(flag)) &&
      (!choice.unlessFlag || !this.save.flags.includes(choice.unlessFlag)));
    this.showServiceOptions(dialogue.speaker, dialogue.choicePrompt ?? 'Come vuoi procedere?', [
      ...choices.map(choice => ({ label: choice.label, icon: 'challenge' as const, action: () => {
        if (!(choice.requiresFlags ?? []).every(flag => this.save.flags.includes(flag))) return;
        if (choice.unlessFlag && this.save.flags.includes(choice.unlessFlag)) return;
        this.afterDialogue = () => {
          if (choice.questEvent && this.applyQuestEvent(choice.questEvent)) this.refreshMapVisuals();
        };
        this.showDialogue(dialogue.speaker, choice.lines.map(line => line.replaceAll('{starter}', this.starterName())));
      } })),
      { label: 'DECIDO DOPO', icon: 'close', action: () => undefined },
    ]);
  }

  private showEnvironmentRegulatorMenu(id: string): void {
    const regulator = getEnvironmentRegulator(id);
    const menu = environmentRegulatorMenu(regulator, this.save.flags);
    this.afterDialogue = null;
    this.showServiceOptions(regulator.name, menu.prompt, menu.options.map(option => ({
      label: option.label, icon: option.command.kind === 'close' ? 'close' : option.command.kind === 'verify' ? 'challenge' : 'rotate',
      action: () => this.applyEnvironmentRegulatorCommand(id, option.command),
    })));
  }

  private applyEnvironmentRegulatorCommand(id: string, command: EnvironmentRegulatorCommand): void {
    if (command.kind === 'close') return;
    const regulator = getEnvironmentRegulator(id);
    if (command.kind === 'verify') {
      const state = environmentRegulatorState(regulator, this.save.flags);
      if (!state.completed && regulator.requiredFlags.every(flag => this.save.flags.includes(flag)) && state.balanced) {
        this.applyQuestEvent(regulator.solvedEvent);
        void this.persistProgress();
        this.refreshMapVisuals();
        this.showToast('Equilibrio verificato. Prosegui con le indicazioni del diario.');
      } else if (!state.completed) {
        this.showToast('Le letture non coincidono ancora. Controlla gli indizi delle stazioni e riprova.');
      }
    } else {
      const result = command.kind === 'reset' ? resetEnvironmentRegulator(regulator, this.save.flags)
        : adjustEnvironmentRegulator(regulator, command.controlId, command.delta, this.save.flags);
      this.save = { ...this.save, flags: result.flags };
      if (result.changed) void this.persistProgress();
    }
    this.showEnvironmentRegulatorMenu(id);
  }

  private showSignalRouterMenu(routerId: string, nodeId: string): void {
    const router = getSignalRouter(routerId);
    const reflection = router.presentation === 'reflection';
    const convergence = router.presentation === 'convergence';
    const node = router.nodes.find(candidate => candidate.id === nodeId);
    if (!node) return;
    this.afterDialogue = null;
    if (this.save.flags.includes(router.solvedFlag)) {
      this.showDialogue(node.label, [convergence
        ? 'Tutti i flussi raggiungono insieme il ricevitore: natura e tecnologia sono in equilibrio.'
        : reflection
        ? 'Gli specchi sono allineati: la luce ha raggiunto il ricevitore. Puoi affrontare la prova della palestra.'
        : 'Il circuito è stabile: il segnale ha raggiunto il ricevitore. Puoi affrontare il capopalestra.']);
      return;
    }
    const current = signalRouterState(router, node, this.save.flags);
    const trace = traceSignalRouter(router, this.save.flags);
    const last = router.nodes.find(candidate => candidate.id === trace.nodeIds.at(-1))!;
    const prompt = reflection
      ? `Orientamento: ${current.label}. La luce raggiunge ${last.label}. Ruota gli specchi e segui il fascio fino al ricevitore.`
      : convergence
      ? `Orientamento: ${current.label}. ${trace.paths.map(path => {
          const source = router.nodes.find(candidate => candidate.id === path.sourceNodeId)!;
          const endpoint = router.nodes.find(candidate => candidate.id === path.nodeIds.at(-1))!;
          return `${source.label}: ${path.outcome === 'connected' ? 'raggiunge il ricevitore' : path.outcome === 'cycle' ? `gira in un circuito chiuso presso ${endpoint.label}` : `si ferma presso ${endpoint.label}`}.`;
        }).join(' ')} Tutti i flussi devono raggiungere il ricevitore nella stessa configurazione.`
      : `Direzione: ${current.label}. Il segnale arriva a ${last.label}. Segui le linee sul pavimento fino al ricevitore.`;
    this.showServiceOptions(node.label, prompt, [
      { label: 'RUOTA', icon: 'rotate', action: () => {
        const result = rotateSignalRouter(router, nodeId, this.save.flags);
        this.save = { ...this.save, flags: result.flags };
        if (result.trace.outcome === 'connected') this.applyQuestEvent(router.solvedEvent);
        void this.persistProgress();
        this.refreshMapVisuals();
        this.showSignalRouterMenu(routerId, nodeId);
      } },
      { label: 'CHIUDI', icon: 'close', action: () => undefined },
    ]);
  }

  private showLocalTransportMenu(networkId: string, originStopId: string): void {
    const network = getLocalTransportNetwork(networkId);
    const origin = network?.stops.find(stop => stop.id === originStopId);
    if (!network || !origin || origin.mapId !== this.map.metadata.id) {
      this.showToast('Questo collegamento non è disponibile.');
      return;
    }
    this.afterDialogue = null;
    const destinations = localTransportDestinations(network, this.save, originStopId);
    this.showServiceOptions(network.name,
      destinations.length ? `Partenza da ${origin.name}. Il tragitto è gratuito. Dove andiamo?`
        : network.lockedMessage,
      [...destinations.map(stop => ({ label: stop.name, icon: network.kind, action: () => {
        if (this.mapTransitionLoading || this.battleActive) return;
        const trip = planLocalTransportTrip(network, this.save, originStopId, stop.id);
        if (!trip.ok) { this.showToast('Il collegamento non è disponibile. Riapri il terminale.'); return; }
        const destination = getMap(trip.destination.mapId);
        const spawn = getSpawn(destination, trip.destination.spawnPointId);
        this.mapTransitionLoading = true;
        void this.transitionToMap(destination, spawn);
      } })), { label: 'RESTA QUI', icon: 'close', action: () => undefined }]);
  }

  private showMonorailMenu(originStationId: string): void {
    const origin = monorailNetwork.stations.find(station => station.id === originStationId);
    if (!origin || origin.mapId !== this.map.metadata.id) { this.showToast('Questa stazione non è disponibile.'); return; }
    this.afterDialogue = null;
    if (!monorailUnlocked(this.save.flags)) {
      this.showDialogue(monorailNetwork.name, ['Conquista la Medaglia Circuito a Vetracielo per attivare la monorotaia. Potrai tornare nelle città che hai già visitato.']);
      return;
    }
    const destinations = monorailDestinations(this.save, originStationId);
    this.showServiceOptions(monorailNetwork.name,
      destinations.length ? `Partenza da ${origin.name}. Viaggio gratuito verso le città già visitate. Dove andiamo?` : 'Visita altre città a piedi: le loro stazioni appariranno qui. Il viaggio è gratuito.',
      [...destinations.map(station => ({ label: station.name, icon: 'transit' as const, action: () => {
        if (this.mapTransitionLoading || this.battleActive) return;
        const trip = planMonorailTrip(this.save, originStationId, station.id);
        if (!trip.ok) { this.showToast('Questa destinazione non è disponibile. Riapri la stazione.'); return; }
        const destination = getMap(trip.destination.mapId);
        const spawn = getSpawn(destination, trip.destination.spawnPointId);
        this.mapTransitionLoading = true;
        void this.transitionToMap(destination, spawn);
      } })), { label: 'NON PARTIRE', icon: 'close', action: () => undefined }]);
  }

  private showServiceOptions(speaker: string, prompt: string, options: Array<{ label: string; icon?: ServiceOptionIconKind; action: () => void }>) {
    this.showDialogue(speaker, [prompt]);
    this.revealDialogueLine();
    this.starterChoices.setAttribute('aria-label', `Opzioni di ${speaker}`);
    document.querySelector<HTMLElement>('.dialogue-footer')!.hidden = true;
    this.starterChoices.replaceChildren(...options.map(option => {
      const button = document.createElement('button');
      button.className = 'starter-choice';
      button.type = 'button';
      button.textContent = option.label;
      if (option.icon) decorateServiceOption(button, option.icon);
      button.addEventListener('click', () => {
        this.starterChoices.hidden = true;
        this.closeDialogue();
        option.action();
      });
      return button;
    }));
    this.starterChoices.hidden = false;
    // Native button activation must not also advance the world dialogue.
    this.starterChoices.onkeydown = event => {
      event.stopPropagation();
      if (event.key === 'Escape' || event.key.toLowerCase() === 'b') { event.preventDefault(); this.closeDialogue(); return; }
      const buttons = [...this.starterChoices.querySelectorAll<HTMLButtonElement>('button')];
      if (event.key === 'Tab' && event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
      else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
    };
    const focusFirst = () => this.starterChoices.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    if (this.keys.SPACE.isDown) {
      this.starterChoices.tabIndex = -1;
      this.starterChoices.focus({ preventScroll: true });
      this.starterChoices.onkeyup = event => {
        if (event.key !== ' ') return;
        event.preventDefault(); this.starterChoices.onkeyup = null;
        // Phaser ignores a default-prevented keyup; release its matching key too.
        this.keys.SPACE.reset();
        if (!this.starterChoices.hidden) focusFirst();
      };
    } else focusFirst();
  }

  private showTrainerChallenge(trainer: (typeof trainerCatalog)[string]) {
    this.showServiceOptions(trainer.name, trainerChallengePrompt(trainer, this.save.party, this.save.inventory), [
      { label: 'SFIDA', icon: 'challenge', action: () => this.startTrainerBattle(trainer) },
      { label: 'NON ORA', icon: 'close', action: () => this.showToast('La sfida ti aspetta quando sarai pronto.') },
    ]);
  }

  private showTrainingMenu(): void {
    if (this.battleActive || this.moving || this.mapTransitionLoading || this.challengeOperationActive || this.dialogueLines.length) return;
    if (this.previewMode) { this.showToast('Apri la partita salvata per partecipare agli allenamenti.'); return; }
    if (!this.save.flags.includes('q_league_visited') && !this.save.flags.includes('q_league_completed') && this.map.metadata.id !== 'veloria/league_forecourt') {
      this.showDialogue('Allenamenti della Lega', ['Raggiungi il piazzale della Lega per sbloccare gli allenamenti. Poi potrai allenarti anche durante i tuoi viaggi.']); return;
    }
    if (listChallengeSequences().some(sequence => this.save.flags.includes(sequence.activeFlag))) {
      this.showDialogue('Allenamenti della Lega', ['Concludi o interrompi il tentativo della Lega prima di iniziare un allenamento.']); return;
    }
    this.showServiceOptions('Allenamenti della Lega', 'Ingresso gratuito · 3 Pokémon avversari. Scegli il livello: ogni vittoria dà esperienza e monete, anche se hai già vinto altre sfide. PS, PP e strumenti usati restano quelli della tua squadra.', [
      ...TRAINING_TIERS.map(tier => ({ label: `LIVELLO ${tier.level} · ${tier.rewardMoney} MONETE`, icon: 'challenge' as const,
        action: () => this.showServiceOptions(`Allenamento · livello ${tier.level}`,
          `Affronterai 3 Pokémon di livello ${tier.level}. Ricompensa: ${tier.rewardMoney} monete per la vittoria. Nessun costo di ingresso; nessuna ricompensa in caso di sconfitta.`, [
            { label: 'INIZIA ALLENAMENTO', icon: 'challenge', action: () => void this.startTrainingBattle(tier.level) },
            { label: 'CAMBIA LIVELLO', icon: 'close', action: () => this.showTrainingMenu() },
            { label: 'NON ORA', icon: 'close', action: () => undefined },
          ]) })),
      { label: 'NON ORA', icon: 'close', action: () => undefined },
    ]);
  }

  private async startTrainingBattle(level: number): Promise<void> {
    if (this.battleActive || this.challengeOperationActive || this.previewMode || this.mapTransitionLoading) return;
    if (!this.save.party.some(creature => creature.hp > 0)) {
      this.showToast('La squadra è esausta. Al Centro Pokémon puoi recuperare gratuitamente HP e PP.'); return;
    }
    const previous = this.save;
    const attemptId = createUniqueId();
    let trainer: ReturnType<typeof createTrainingTrainer>['trainer'];
    let state: BattleState;
    try {
      const generated = createTrainingTrainer({ level, rngState: this.save.rngState >>> 0, attemptId, species: battleSpecies, moves: battleMoves });
      trainer = generated.trainer;
      this.save = { ...this.save, flags: beginTrainingAttempt(this.save.flags, attemptId), rngState: generated.nextRngState };
      state = createTrainerBattle({ save: this.save, trainer, registries: { species: battleSpecies, moves: battleMoves }, rules: veloriaBattleRules, battleId: attemptId });
    } catch (error) {
      this.save = previous;
      this.showToast(error instanceof Error ? `Allenamento non avviato: ${error.message}` : 'Allenamento non disponibile.'); return;
    }
    this.challengeOperationActive = true;
    await this.requireChallengeSave(() => {
      this.challengeOperationActive = false;
      this.beginBattle(state, trainer, undefined, undefined, { attemptId });
    });
  }

  private starterName() {
    return getStarterName(this.save.party[0]?.speciesId);
  }

  private applyQuestEvent(trigger: string): boolean {
    const result = applyQuestEvent(this.save, trigger, questCatalog, { species: battleSpecies, moves: battleMoves });
    this.save = result.save;
    if (this.battleActive) this.pendingQuestCelebrations.push(...result.completedQuestIds);
    else this.journey?.celebrate(result.completedQuestIds, this.save);
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

  private async openTradeEvolution(serviceName: string): Promise<void> {
    if (this.previewMode || this.navigationOpen || this.battleActive || !this.challengeServicePermitted('storage')) return;
    this.completionActive = true;
    const signal = this.presentationAbort.signal;
    try {
      const selected = await chooseItemEvolution({ method: 'trade', serviceName: `${serviceName} · Scambio assistito`,
        save: this.save, rules: tradeEvolutionRules, species: battleSpecies, moves: battleMoves, signal });
      if (!selected || signal.aborted) return;
      const result = applyTradeEvolution(this.save, selected, tradeEvolutionRules, battleSpecies);
      if (!result.ok) { this.showToast('Questo compagno non può evolversi tramite scambio.'); return; }
      this.save = result.save;
      if (!await ensureSavedProgress(() => this.persistProgress(), signal)) return;
      await this.presentPendingEvolutions();
    } finally { this.completionActive = false; }
  }

  private async openItemEvolution(itemId: string, creatureId?: string): Promise<void> {
    if (this.previewMode || this.navigationOpen || this.battleActive) return;
    this.completionActive = true;
    const signal = this.presentationAbort.signal;
    try {
      const selected = await chooseItemEvolution({ save: this.save, itemId, creatureId, rules: itemEvolutionRules,
        species: battleSpecies, moves: battleMoves, itemName: itemCatalog[itemId]?.name ?? itemId, signal });
      if (!selected || signal.aborted) return;
      const result = applyItemEvolution(this.save, itemId, selected, itemEvolutionRules, battleSpecies);
      if (!result.ok) { this.showToast('Questa evoluzione non è più disponibile. Controlla squadra e zaino.'); return; }
      this.save = result.save;
      if (!await ensureSavedProgress(() => this.persistProgress(), signal)) return;
      await this.presentPendingEvolutions();
    } finally { this.completionActive = false; }
  }

  private async presentPendingEvolutions(signal: AbortSignal = this.presentationAbort.signal): Promise<void> {
    const previousLock = this.completionActive;
    this.completionActive = true;
    try {
      for (const receipt of pendingEvolutionReceipts(this.save)) {
        if (signal.aborted) return;
        await showEvolutionCelebration({ ...receipt,
          fromName: battleSpecies[receipt.fromSpeciesId]?.name ?? 'Pokémon',
          toName: battleSpecies[receipt.toSpeciesId]?.name ?? 'Pokémon',
          reducedAnimations: this.reducedAnimations, signal });
        if (signal.aborted) return;
        this.save = { ...this.save, flags: this.save.flags.filter(flag => flag !== evolutionReceiptFlag(receipt)) };
        if (!await ensureSavedProgress(() => this.persistProgress(), signal)) return;
      }
    } finally { this.completionActive = previousLock; }
  }

  private persistProgress(showToast=false): Promise<boolean> {
    this.save.flags = recordAreaVisited(this.save.flags, this.save.player.mapId);
    for (const creature of [...this.save.party, ...this.save.storage]) {
      if (battleSpecies[creature.speciesId]) this.save.flags = recordSpeciesCaught(this.save.flags, creature.speciesId);
    }
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
    toast.textContent=message;toast.classList.add('visible');this.positionToast();clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>toast.classList.remove('visible'),2600);
  }

  private positionToast(): void {
    const toast = document.querySelector<HTMLElement>('#toast');
    if (!toast) return;
    toast.style.top = '';
    const reward = document.querySelector<HTMLElement>('.journey-reward:not([hidden])');
    if (!reward || !toast.classList.contains('visible')) return;
    const stage = document.querySelector<HTMLElement>('.game-stage')!.getBoundingClientRect();
    const notification = toast.getBoundingClientRect(), celebration = reward.getBoundingClientRect();
    const top = celebration.bottom - stage.top + 10;
    if (top + notification.height <= stage.height - 8) toast.style.top = `${Math.ceil(top)}px`;
    // On extremely short screens, the new action feedback supersedes the older celebration.
    else this.journey?.dismissReward();
  }
}

