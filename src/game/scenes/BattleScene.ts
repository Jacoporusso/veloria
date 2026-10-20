import { effectiveMoveAccuracy } from '../../core/battle/stat-stages.ts';
import { estimateMoveDamage } from '../../core/battle/damage.ts';
import { navigateGrid } from '../input/grid-navigation.ts';
import { chooseOpponentCommand, type OpponentPolicy } from '../../core/battle/opponent-policy.ts';
import { getOpponentPolicy } from '../battle/opponent-policies.ts';
import Phaser from 'phaser';
import { resolveBattleTurn, type BattleCommands, type MoveCatalog } from '../../core/battle/engine.ts';
import { replaceLearnedMove } from '../../core/battle/move-learning.ts';
import { effectivenessFor } from '../../core/battle/rules.ts';
import { EMERGENCY_MOVE_ID, EMERGENCY_MOVE_NAME, hasUsableBattleMove } from '../../core/battle/emergency-move.ts';
import type { BattleRules } from '../../core/battle/rules.ts';
import type { BattleCommand, BattleCreature, BattleEvent, BattleSide, BattleState, MoveDefinition } from '../../core/battle/types.ts';
import { createCreatureImage, preloadCreatureArt } from '../battle/creature-art.ts';
import { battleExperienceProgress, battleRewardSummary, battleTypeLabel, formatFlinched, formatStatStageChanged, formatStatStageLimited } from '../battle/presentation.ts';
import { formatMoveDescription } from '../battle/move-description.ts';
import { BattleCelebration, type VictoryPresentation } from '../ui/BattleCelebration.ts';
import { gameViewport } from '../rendering/game-size.ts';

export interface BattleSceneInit {
  /** Prepared snapshot from the game core. Scene code never creates or loads saves. */
  readonly state: BattleState;
  readonly moveCatalog: MoveCatalog;
  readonly rules: BattleRules;
  /** Events remain the source of truth for save/inventory updates in the owning application. */
  readonly onComplete: (state: BattleState, events: readonly BattleEvent[]) => void;
  readonly onDismiss?: (event?: KeyboardEvent) => void;
  readonly victoryPresentation?: () => VictoryPresentation;
  /** Optional game-level UUID source for newly captured creatures. */
  readonly createInstanceId?: () => string;
  /** If provided, consumables with a zero count are hidden from the battle bag. */
  readonly inventory?: Readonly<Record<string, number>>;
  /** Optional image texture declared by the current MapDefinition. */
  readonly arenaTextureKey?: string;
  readonly reducedAnimations?: boolean;
  readonly opponentPolicy?: OpponentPolicy;
  readonly onSpeciesSeen?: (speciesId: number) => void;
}

type ViewMode = 'menu' | 'moves' | 'moveDetails' | 'party' | 'items' | 'captures' | 'message' | 'learning';
type SelectableButton = { row: number; column: number; callback: () => void; paint: (selected: boolean) => void };

const COLORS = {
  sky: 0xdff3ff,
  panel: 0x153448,
  panelRaised: 0xd4e6f0,
  line: 0x87b9ce,
  paper: '#f1f9fc',
  muted: '#bdd3df',
  gold: '#ffe5a0',
  ink: 0x234565,
  coral: 0xffb6a4,
  blue: 0xbce8ff,
  yellow: 0xffd263,
  violet: 0xd9c9ff,
  orange: 0xffbd7b,
  green: 0x64b986,
  red: 0xe36a61,
};

/** Mobile-first battle UI. All game rules and state transitions are delegated to the pure reducer. */
export class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  private moveCatalog!: MoveCatalog;
  private rules!: BattleRules;
  private opponentPolicy!: OpponentPolicy;
  private onComplete!: BattleSceneInit['onComplete'];
  private onDismiss?: BattleSceneInit['onDismiss'];
  private createInstanceId?: BattleSceneInit['createInstanceId'];
  private arenaTextureKey?: string;
  private ui!: Phaser.GameObjects.Container;
  private mode: ViewMode = 'menu';
  private pendingMessages: Array<{ text: string; event?: BattleEvent }> = [];
  private presentedEvent?: BattleEvent;
  private reducedAnimations = false;
  private actors: Partial<Record<BattleSide, Phaser.GameObjects.Container>> = {};
  private visualHp = new Map<string, number>();
  private hpTweenFrom = new Map<string, number>();
  private visualActiveIds = new Map<BattleSide, string>();
  private eventLog: BattleEvent[] = [];
  private remainingInventory?: Record<string, number>;
  private completionReported = false;
  private terminalShown = false;
  private dismissalReported = false;
  private celebration?: BattleCelebration;
  private victoryPresentation?: BattleSceneInit['victoryPresentation'];
  private pendingMoveLearning?: Extract<BattleEvent, { type: 'moveLearningSkipped' }>;
  private messageTimer?: Phaser.Time.TimerEvent;
  private movePreview?: Phaser.GameObjects.Container;
  private captureCounter = 0;
  private playerForcedToSwitch = false;
  private selectableButtons: SelectableButton[] = [];
  private moveSlotIndexes: number[] = [];
  private selectionIndex = 0;
  private detailMoveIndex = 0;
  private onSpeciesSeen?: BattleSceneInit['onSpeciesSeen'];
  private seenSpecies = new Set<number>();
  private renderedViewportKey = '';
  private readonly handleScaleResize = (): void => {
    if (this.viewportKey === this.renderedViewportKey) return;
    this.render(true);
  };
  private readonly removeScaleResizeListener = (): void => {
    this.scale.off('resize', this.handleScaleResize);
    this.ui?.list.forEach(child => this.tweens.killTweensOf(child));
    this.messageTimer?.remove(false);
    this.messageTimer = undefined;
  };

  constructor() {
    super('battle');
  }

  init(data: BattleSceneInit): void {
    this.state = data.state;
    this.moveCatalog = data.moveCatalog;
    this.rules = data.rules;
    this.opponentPolicy = data.opponentPolicy ?? getOpponentPolicy();
    this.onComplete = data.onComplete;
    this.onDismiss = data.onDismiss;
    this.celebration?.destroy();
    this.celebration = undefined;
    this.victoryPresentation = data.victoryPresentation;
    this.onSpeciesSeen = data.onSpeciesSeen;
    this.seenSpecies.clear();
    this.createInstanceId = data.createInstanceId;
    this.arenaTextureKey = data.arenaTextureKey;
    this.reducedAnimations = data.reducedAnimations ?? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.remainingInventory = data.inventory ? { ...data.inventory } : undefined;
    this.mode = 'menu';
    this.pendingMessages = [];
    this.messageTimer?.remove(false);
    this.messageTimer = undefined;
    this.movePreview = undefined;
    this.eventLog = [];
    this.completionReported = false;
    this.terminalShown = false;
    this.dismissalReported = false;
    this.pendingMoveLearning = undefined;
    this.captureCounter = 0;
    this.playerForcedToSwitch = false;
    this.presentedEvent = undefined;
    this.visualHp.clear();
    this.visualActiveIds.clear();
  }

  preload(): void {
    const speciesIds = new Set<number>();
    for (const creature of this.state.player.creatures) {
      let speciesId: number | undefined = creature.speciesId;
      const seen = new Set<number>();
      while (speciesId !== undefined && !seen.has(speciesId)) {
        seen.add(speciesId);
        speciesIds.add(speciesId);
        speciesId = this.rules.evolutions[speciesId]?.[0]?.target.speciesId;
      }
    }
    for (const creature of this.state.opponent.creatures) speciesIds.add(creature.speciesId);
    preloadCreatureArt(this, [...speciesIds]);
  }

  create(): void {
    this.ui = this.add.container(0, 0);
    this.scale.on('resize', this.handleScaleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeScaleResizeListener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.celebration?.destroy());
    this.events.once(Phaser.Scenes.Events.DESTROY, this.removeScaleResizeListener);
    this.input.keyboard?.on('keydown-ENTER', this.confirm, this);
    this.input.keyboard?.on('keydown-SPACE', this.confirm, this);
    this.input.keyboard?.on('keydown-ESC', this.back, this);
    this.input.keyboard?.on('keydown-B', this.back, this);
    this.input.keyboard?.on('keydown-I', this.openMoveDetails, this);
    this.input.keyboard?.on('keydown-UP', () => this.navigate(-1, 0), this);
    this.input.keyboard?.on('keydown-DOWN', () => this.navigate(1, 0), this);
    this.input.keyboard?.on('keydown-LEFT', () => this.navigate(0, -1), this);
    this.input.keyboard?.on('keydown-RIGHT', () => this.navigate(0, 1), this);
    if (this.state.outcome.kind === 'ongoing' && this.activeCreature('player').hp <= 0) {
      this.playerForcedToSwitch = true;
      this.mode = 'party';
    }
    this.render();
  }

  private confirm(event?: KeyboardEvent): void {
    if (this.mode === 'moveDetails') { this.back(); return; }
    if (this.mode === 'message') {
      this.advanceMessage(event);
      return;
    }
    if (this.selectableButtons.length) {
      this.activateSelected();
    } else if (this.mode !== 'party' || !this.playerForcedToSwitch) {
      this.back();
    }
  }

  private back(): void {
    if (this.mode === 'moveDetails') { this.mode = 'moves'; this.render(); return; }
    if (this.mode === 'message' || this.mode === 'learning' || this.playerForcedToSwitch) return;
    if (this.mode === 'menu') return;
    this.mode = 'menu';
    this.render();
  }

  private render(preserveSelection = false): void {
    this.renderedViewportKey = this.viewportKey;
    if (!this.ui || !this.state) return;
    this.ui.setScale(this.viewport.density);
    // Cancel presentation tweens before replacing their targets (including on resize).
    this.ui.list.forEach(child => this.tweens.killTweensOf(child));
    this.ui.removeAll(true);
    this.actors = {};
    const event = this.mode === 'message' ? this.pendingMessages[0]?.event : undefined;
    const newEvent = event && event !== this.presentedEvent ? event : undefined;
    this.hpTweenFrom.clear();
    if (newEvent) {
      this.presentedEvent = newEvent;
      this.applyVisualEvent(newEvent);
    }
    this.selectableButtons = [];
    this.moveSlotIndexes = [];
    if (!preserveSelection) this.selectionIndex = 0;
    this.movePreview = undefined;
    const width = this.viewport.width;
    const height = this.viewport.height;
    this.drawArena(width, height);
    const opponent = this.displayedCreature('opponent');
    if (!this.seenSpecies.has(opponent.speciesId)) {
      this.seenSpecies.add(opponent.speciesId);
      this.onSpeciesSeen?.(opponent.speciesId);
    }
    if (this.mode === 'moveDetails') { this.drawMoveDetails(width, height); return; }
    const fieldHeight = Math.max(180, height - this.commandHeight() - 115);
    const landscape = height < 520 && width > 600;
    const compact = !landscape && height < 700;
    if (landscape) {
      // Put cards beside the stage: a portrait stack cannot fit a short phone screen.
      const size = Math.min(118, fieldHeight * 0.62);
      this.drawCreatureInfo(this.displayedCreature('opponent'), 'opponent', width * 0.72, 16, width * 0.28 - 14, 79);
      this.drawCreatureInfo(this.displayedCreature('player'), 'player', 14, 16, width * 0.28 - 14, 92);
      this.drawCreature(this.displayedCreature('opponent'), 'opponent', width * 0.61, fieldHeight * 0.56, size);
      this.drawCreature(this.displayedCreature('player'), 'player', width * 0.39, fieldHeight * 0.61, size);
    } else if (compact) {
      const size = Math.min(128, width * 0.30);
      this.drawCreatureInfo(this.displayedCreature('opponent'), 'opponent', 14, 12, width - 28, 70);
      this.drawCreatureInfo(this.displayedCreature('player'), 'player', width * 0.35, fieldHeight - 92, width * 0.65 - 14, 92);
      this.drawCreature(this.displayedCreature('opponent'), 'opponent', width * 0.73, 90 + size / 2, size);
      this.drawCreature(this.displayedCreature('player'), 'player', width * 0.175, fieldHeight - 44, Math.min(112, width * 0.30));
    } else {
      const opponentCardWidth = width > 600 ? width * 0.47 : width - 28;
      this.drawCreatureInfo(this.displayedCreature('opponent'), 'opponent', 14, 16, opponentCardWidth, 79);
      this.drawCreatureInfo(this.displayedCreature('player'), 'player', width * 0.35, fieldHeight * 0.54, width * 0.65 - 14, 92);
      this.drawCreature(this.displayedCreature('opponent'), 'opponent', width * 0.73, Math.max(145, fieldHeight * 0.35), Math.min(150, width * 0.38));
      this.drawCreature(this.displayedCreature('player'), 'player', width * 0.23, fieldHeight * 0.78, Math.min(170, width * 0.42));
    }
    if (!compact) this.drawPartyPips(width, height);
    this.drawMessagePanel(width, height);
    this.drawCommandPanel(width, height);
    this.selectionIndex = Math.min(this.selectionIndex, Math.max(0, this.selectableButtons.length - 1));
    this.updateSelectionStyle();
    if (newEvent) this.animateEvent(newEvent);
  }

  private drawArena(width: number, height: number): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    if (this.arenaTextureKey && this.textures.exists(this.arenaTextureKey)) {
      const background = this.add.image(width / 2, height / 2, this.arenaTextureKey);
      const coverScale = Math.max(width / background.width, height / background.height);
      background.setScale(coverScale);
      this.ui.add(background);
      const shade = this.add.rectangle(width / 2, height / 2, width, height, 0xfff2d8, 0.04);
      this.ui.add(shade);
    } else {
      this.rect(0, 0, width, height, COLORS.sky);
      this.rect(0, height * 0.47, width, height * 0.53, 0xdbedc3);
      this.rect(0, height * 0.59, width, height * 0.41, 0xc4dfa8);
    }
    const field = this.add.graphics();
    field.fillStyle(0xffedb2, 0.46);
    field.fillEllipse(width * 0.72, height * 0.43, width * 0.42, height * 0.09);
    field.fillStyle(0xffedb2, 0.42);
    field.fillEllipse(width * 0.25, height * 0.68, width * 0.44, height * 0.075);
    field.lineStyle(1, 0xfffdf5, 0.22);
    field.lineBetween(0, height * 0.55, width, height * 0.55);
    this.ui.add(field);
  }

  private drawCreatureInfo(creature: BattleCreature, side: BattleSide, x: number, y: number, width: number, height: number): void {
    this.panel(x, y, width, height, COLORS.panel, COLORS.line, 0.98);
    const name = this.text(x + 12, y + 9, creature.name, {
      fontFamily: 'system-ui, Segoe UI, sans-serif', fontSize: '18px', fontStyle: 'bold', color: COLORS.paper,
    });
    this.ui.add(name);
    this.label(x + width - 12, y + 13, `LV ${creature.level}`, COLORS.paper, 10).setOrigin(1, 0);
    const hpLabel = this.text(x + 12, y + 34, 'HP', { fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: COLORS.muted });
    this.ui.add(hpLabel);
    const barX = x + 35;
    const barY = y + 36;
    const barWidth = Math.max(42, width - 92);
    this.rect(barX, barY, barWidth, 7, 0xdce6e8);
    const hp = this.visualHp.get(creature.instanceId) ?? creature.hp;
    const ratio = Phaser.Math.Clamp(hp / creature.stats.maxHp, 0, 1);
    const hpColor = ratio > 0.5 ? COLORS.green : ratio > 0.2 ? COLORS.yellow : COLORS.red;
    const fill = this.add.rectangle(barX, barY, barWidth, 7, hpColor).setOrigin(0, 0).setScale(ratio, 1);
    this.ui.add(fill);
    const previousHp = this.hpTweenFrom.get(creature.instanceId);
    if (previousHp !== undefined && !this.reducedAnimations) {
      fill.scaleX = Phaser.Math.Clamp(previousHp / creature.stats.maxHp, 0, 1);
      this.tweens.add({ targets: fill, scaleX: ratio, duration: 420, ease: 'Cubic.easeOut' });
    }
    const hpText = this.text(x + width - 12, y + 34, `${hp}/${creature.stats.maxHp}`, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: COLORS.paper,
    }).setOrigin(1, 0);
    this.ui.add(hpText);
    if (creature.status || creature.confusionTurnsRemaining || creature.leechSeed) {
      this.label(x + 12, y + 53, [creature.status ? this.statusName(creature.status.status).toUpperCase() : '', creature.confusionTurnsRemaining ? 'CONFUSIONE' : '', creature.leechSeed ? 'PARASSISEME' : ''].filter(Boolean).join(' · '), '#ffb6a4', 10);
    } else {
      this.label(x + 12, y + 53, creature.types.map(battleTypeLabel).join(' · '), COLORS.muted, 10);
    }
    if (side === 'player') {
      const progress = battleExperienceProgress(creature, this.rules);
      if (progress) {
        this.rect(x + 12, y + 71, width - 24, 4, 0xdbe9f5);
        if (progress.ratio > 0) this.rect(x + 12, y + 71, (width - 24) * progress.ratio, 4, COLORS.blue);
        this.label(x + 12, y + 78, progress.label, COLORS.muted, 9);
      }
    }
  }

  private drawCreature(creature: BattleCreature, side: BattleSide, x: number, y: number, size: number): void {
    const shadow = this.add.ellipse(x, y + size * 0.40, size * 0.67, 13, 0x081a12, 0.37);
    const actor = this.add.container(x, y);
    const image = createCreatureImage(this, creature.speciesId, 0, 0);
    if (image) {
      // Never enlarge an illustration beyond its source pixels on a dense display.
      const scale = Math.min(size / Math.max(image.width, image.height), 1 / this.viewport.density);
      image.setScale(scale).setFlipX(side === 'player');
      actor.add(image);
    } else {
      // Unknown content stays explicit rather than impersonating a different species.
      actor.add(this.text(0, 0, creature.name, { fontFamily: 'Georgia, serif', fontSize: '18px', color: COLORS.paper }).setOrigin(0.5));
    }
    if ((this.visualHp.get(creature.instanceId) ?? creature.hp) === 0) actor.setAlpha(0.3);
    this.ui.add([shadow, actor]);
    this.actors[side] = actor;
    if (!this.reducedAnimations) this.tweens.add({ targets: actor, y: y - 3, duration: side === 'player' ? 1300 : 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private drawPartyPips(width: number, height: number): void {
    const ownParty = this.state.player.creatures;
    const opponentParty = this.state.opponent.creatures;
    const y = height - this.commandHeight() - 111;
    this.label(24, y, 'SQUADRA', COLORS.paper, 9);
    ownParty.forEach((creature, index) => this.pip(91 + index * 15, y + 4, creature.hp > 0, index === this.state.player.activeIndex));
    if (this.state.battleType === 'trainer') {
      this.label(width - 88 - opponentParty.length * 15, y, 'AVVERSARIO', COLORS.paper, 9);
      opponentParty.forEach((creature, index) => this.pip(width - 20 - index * 15, y + 4, creature.hp > 0, index === this.state.opponent.activeIndex));
    }
  }

  private drawMessagePanel(width: number, height: number): void {
    const x = 14;
    const y = height - this.commandHeight() - 92;
    const panelWidth = width - 28;
    this.panel(x, y, panelWidth, 82, COLORS.panel, COLORS.line, 0.99);
    if (this.mode === 'moves') {
      this.drawMovePreview(x, y, panelWidth);
      return;
    }
    const message = this.mode === 'learning'
      ? this.moveLearningPrompt()
      : this.mode === 'message'
      ? this.pendingMessages[0]?.text ?? this.outcomeMessage()
      : this.mode === 'party' && this.playerForcedToSwitch
        ? 'Scegli chi mandare in campo.'
        : 'Cosa vuoi fare?';
    const text = this.text(x + 14, y + 13, message, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '17px', color: COLORS.paper,
      wordWrap: { width: panelWidth - 28 }, lineSpacing: 3,
    });
    this.ui.add(text);
    if (this.mode === 'message' || this.mode === 'learning') {
      const hintLabel = this.mode === 'learning' ? '↑ ↓ · SCEGLI' : this.terminalShown ? 'A · CHIUDI' : 'TOCCA / A · SALTA';
      const hint = this.text(x + panelWidth - 12, y + 66, hintLabel, {
        fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '9px', fontStyle: 'bold', color: COLORS.muted,
      }).setOrigin(1, 0);
      this.ui.add(hint);
      if (this.mode === 'message' && !this.terminalShown) {
        const skip = this.add.zone(x, y, panelWidth, 82).setOrigin(0).setInteractive({ useHandCursor: true });
        skip.on('pointerdown', () => this.advanceMessage());
        this.ui.add(skip);
      }
    }
  }

  private drawCommandPanel(width: number, height: number): void {
    const x = 14;
    const y = height - this.commandHeight();
    const panelWidth = width - 28;
    this.panel(x, y, panelWidth, this.commandHeight(), COLORS.panel, COLORS.line, 0.99);
    if (this.mode === 'learning') {
      this.drawMoveLearningChoices(x, y, panelWidth);
      return;
    }
    if (this.mode === 'message') {
      if (this.terminalShown) {
        this.button(x + 8, y + 8, panelWidth - 16, 52, 'TORNA AL VIAGGIO', () => this.advanceMessage(), COLORS.yellow, true, 0, 0);
      } else {
        this.drawTurnResolution(x, y, panelWidth);
      }
      return;
    }
    if (this.mode === 'menu') {
      this.drawMenu(x, y, panelWidth);
      return;
    }
    if (this.mode === 'moves') {
      this.drawMoveChoices(x, y, panelWidth);
      return;
    }
    if (this.mode === 'party') {
      this.drawPartyChoices(x, y, panelWidth);
      return;
    }
    if (this.mode === 'items' || this.mode === 'captures') {
      this.drawItemChoices(x, y, panelWidth);
    }
  }

  private drawMenu(x: number, y: number, width: number): void {
    const options = [
      { label: 'LOTTA', callback: () => this.open('moves'), enabled: this.activeCreature('player').hp > 0 },
      { label: 'SQUADRA', callback: () => this.open('party'), enabled: this.state.player.creatures.length > 1 },
      { label: 'BORSA', callback: () => this.open('items'), enabled: this.availableItemIds().length > 0 },
      { label: 'CATTURA', callback: () => this.open('captures'), enabled: this.availableCaptureIds().length > 0 && this.state.battleType === 'wild' },
      ...(this.state.battleType === 'wild' ? [{ label: 'FUGA', callback: () => this.act({ kind: 'attemptFlee' }), enabled: true }] : []),
    ];
    this.drawGridButtons(x, y, width, options, 2, 3);
  }

  private drawMoveChoices(x: number, y: number, width: number): void {
    const creature = this.activeCreature('player');
    if (!hasUsableBattleMove(creature, this.moveCatalog)) {
      this.drawGridButtons(x, y, width, [{
        label: `${EMERGENCY_MOVE_NAME.toUpperCase()}\nSenza PP · causa contraccolpo`,
        enabled: true,
        accent: COLORS.orange,
        callback: () => this.act({ kind: 'struggle' }),
      }], 1, 2);
      this.drawMoveDetailsLink(x, y);
      return;
    }
    const options = creature.moves.map((slot, index) => {
      const move = this.moveCatalog[slot.moveId];
      const type = move ? battleTypeLabel(move.type).toLocaleUpperCase('it-IT') : '';
      const category = move?.category === 'status' ? 'SUPPORTO' : move?.category === 'physical' ? 'FISICA' : 'SPECIALE';
      return {
        label: move ? `${move.name}\n${type} · ${category}\nPP ${slot.pp}/${move.maxPp}` : `${slot.moveId}\nPP ${slot.pp}`,
        enabled: slot.pp > 0,
        accent: move ? this.typeColor(move.type) : COLORS.blue,
        callback: () => this.act({ kind: 'useMove', moveSlot: index }),
      };
    });
    options.forEach((option, index) => { if (option.enabled) this.moveSlotIndexes.push(index); });
    if (!options.length) options.push({ label: 'Nessuna mossa', enabled: false, accent: COLORS.blue, callback: () => undefined });
    this.drawGridButtons(x, y, width, options, 2, 2);
    this.drawMoveDetailsLink(x, y);
  }

  private drawMoveDetailsLink(x: number, y: number): void {
    const top = y + this.commandHeight() - 47;
    const target = this.add.zone(x + 4, top, 155, 44).setOrigin(0).setInteractive({ useHandCursor: true });
    target.on('pointerdown', this.openMoveDetails, this);
    this.ui.add(target);
    this.label(x + 8, top + 14, 'ⓘ DETTAGLI MOSSE', '#bce8ff', 12);
  }

  private openMoveDetails(): void {
    if (this.mode !== 'moves') return;
    this.detailMoveIndex = this.moveSlotIndexes[this.selectionIndex] ?? 0;
    this.mode = 'moveDetails';
    this.render();
  }

  /** Inspection never issues a battle command or consumes a turn. All slots remain inspectable at zero PP. */
  private drawMoveDetails(width: number, height: number): void {
    this.panel(10, 10, width - 20, height - 20, COLORS.panel, COLORS.line, 0.99);
    this.label(26, 24, 'MOSSE · STUDIA LA STRATEGIA', '#fff7df', 15);
    const slots = this.activeCreature('player').moves;
    const landscape = width > 600 && height < 520;
    const selectorWidth = landscape ? 190 : width - 52;
    const columns = landscape ? 1 : 2;
    const itemWidth = (selectorWidth - 8 * (columns - 1)) / columns;
    slots.forEach((slot, index) => {
      const move = this.moveCatalog[slot.moveId];
      const bx = 26 + (index % columns) * (itemWidth + 8);
      const by = 60 + Math.floor(index / columns) * 48;
      const card = this.add.rectangle(bx, by, itemWidth, 44, index === this.detailMoveIndex ? 0x3a6070 : 0x223e54).setOrigin(0);
      card.setStrokeStyle(1, index === this.detailMoveIndex ? 0xafffe3 : 0x426479);
      card.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.detailMoveIndex = index; this.render(); });
      this.ui.add(card);
      this.label(bx + 10, by + 7, `${move?.name ?? slot.moveId}\nPP ${slot.pp}/${move?.maxPp ?? '?'}`, COLORS.paper, 11);
    });
    const move = this.moveCatalog[slots[this.detailMoveIndex]?.moveId ?? ''];
    const textX = landscape ? 240 : 26;
    const textY = landscape ? 60 : 168;
    if (move) {
      this.label(textX, textY, move.name, '#afffe3', 19);
      const description = this.text(textX, textY + 32, formatMoveDescription(move), {
        fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '13px', color: COLORS.paper,
        lineSpacing: 3, wordWrap: { width: width - textX - 30 },
      });
      this.ui.add(description);
    }
    const closeTarget = this.add.zone(width - 138, height - 62, 116, 44).setOrigin(0).setInteractive({ useHandCursor: true });
    closeTarget.setName('move-details-back');
    closeTarget.on('pointerdown', this.back, this);
    this.ui.add(closeTarget);
    this.label(width - 28, height - 49, 'CHIUDI · B', '#bce8ff', 14).setOrigin(1, 0);
  }

  private drawPartyChoices(x: number, y: number, width: number): void {
    const options = this.state.player.creatures.map((creature, index) => ({
      label: `${creature.name} · ${creature.hp}/${creature.stats.maxHp} HP`,
      enabled: creature.hp > 0 && index !== this.state.player.activeIndex,
      callback: () => this.act({ kind: 'switch', partyIndex: index }),
    }));
    if (this.playerForcedToSwitch) options.push({ label: 'Ritorno non disponibile', enabled: false, callback: () => undefined });
    this.drawGridButtons(x, y, width, options, 2, 3);
  }

  private drawItemChoices(x: number, y: number, width: number): void {
    const ids = this.mode === 'items' ? this.availableItemIds() : this.availableCaptureIds();
    const options = ids.map(itemId => ({
      label: this.prettyId(itemId),
      enabled: true,
      callback: () => this.mode === 'items'
        ? this.act({ kind: 'useItem', itemId, targetIndex: this.state.player.activeIndex })
        : this.act({ kind: 'attemptCapture', itemId, captureInstanceId: this.makeInstanceId() }),
    }));
    this.drawGridButtons(x, y, width, options, 2, 3);
  }

  private drawMoveLearningChoices(x: number, y: number, width: number): void {
    const learning = this.pendingMoveLearning;
    const creature = learning ? this.creatureById('player', learning.creatureId) : undefined;
    if (!learning || !creature) {
      this.drawGridButtons(x, y, width, [{ label: 'Continua', enabled: true, callback: () => this.finishMoveLearning() }], 1, 1);
      return;
    }
    const options = creature.moves.map((slot, slotIndex) => {
      const move = this.moveCatalog[slot.moveId];
      return {
        label: `${move?.name ?? slot.moveId}\n${move ? `${battleTypeLabel(move.type)} · ` : ''}PP ${slot.pp}${move ? `/${move.maxPp}` : ''}`,
        enabled: true,
        callback: () => this.resolveMoveLearning(slotIndex),
      };
    });
    options.push({ label: 'Tieni le mosse', enabled: true, callback: () => this.resolveMoveLearning(null) });
    this.drawGridButtons(x, y, width, options, 2, 3);
  }

  private drawMovePreview(x: number, y: number, width: number): void {
    const creature = this.activeCreature('player');
    const slot = creature.moves[this.moveSlotIndexes[this.selectionIndex] ?? this.selectionIndex];
    const move = slot ? this.moveCatalog[slot.moveId] : undefined;
    if (!slot || !move) return;
    const typeColor = this.typeColor(move.type);
    const category = move.category === 'status' ? 'STATO' : move.category === 'physical' ? 'FISICA' : 'SPECIALE';
    const typeEffectiveness = effectivenessFor(this.activeCreature('opponent').types, move.type, this.rules.typeChart);
    const effectiveness = move.fixedDamage && typeEffectiveness !== 0 ? 1 : typeEffectiveness;
    const matchup = move.statusAffectedByTypeImmunity && effectiveness === 0 ? 'NESSUN EFFETTO · IMMUNITÀ DI TIPO' : move.category === 'status'
      ? move.leechSeedFraction
        ? `DRENA 1/${Math.round(1 / move.leechSeedFraction)} DEGLI HP MASSIMI A FINE TURNO`
        : move.inflictedStatus
        ? `PUÒ INFLIGGERE ${this.statusName(move.inflictedStatus).toLocaleUpperCase('it-IT')} · ${move.statusChance ?? 100}%`
        : move.statChanges?.length
          ? this.moveTacticLabel(move) ?? 'MOSSA DI SUPPORTO'
          : move.inflictedConfusionChance ? `PUÒ CONFONDERE · ${move.inflictedConfusionChance}%`
          : 'MOSSA DI SUPPORTO'
      : effectiveness === 0 ? 'NESSUN EFFETTO' : effectiveness > 1 ? 'SUPER EFFICACE' : effectiveness < 1 ? 'POCO EFFICACE' : 'EFFETTO NORMALE';
    const detail = move.category === 'status'
      ? `${category} · PRECISIONE ${this.moveAccuracyLabel(move)} · PP ${slot.pp}/${move.maxPp}`
      : `${move.fixedDamage ? `DANNO FISSO ${move.fixedDamage} HP` : `POTENZA ${move.power}`} · PRECISIONE ${this.moveAccuracyLabel(move)} · PP ${slot.pp}/${move.maxPp}`;
    const preview = this.add.container(0, 0);
    const badge = this.add.graphics();
    badge.fillStyle(typeColor, 0.95);
    badge.fillRoundedRect(x + 12, y + 10, 8, 59, 4);
    preview.add(badge);
    const title = this.text(x + 30, y + 8, `${move.name.toLocaleUpperCase('it-IT')}  ·  ${battleTypeLabel(move.type).toLocaleUpperCase('it-IT')}`, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff7df',
      wordWrap: { width: width - 54 },
    });
    const values = this.text(x + 30, y + 31, detail, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#d6e9f5',
      wordWrap: { width: width - 54 },
    });
    const extra = move.category !== 'status' ? this.moveTacticLabel(move) : undefined;
    const tactic = this.text(x + 30, y + 54, `${matchup}  ·  ${extra ?? this.activeCreature('opponent').types.map(battleTypeLabel).join(' / ')}`, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '10px', fontStyle: 'bold', color: effectiveness > 1 ? '#ffe08a' : effectiveness === 0 ? '#ffb6a4' : '#bdd3df',
      wordWrap: { width: width - 54 },
    });
    const forecast = this.moveForecast(move);
    if (forecast && tactic.height <= 14) {
      const damage = forecast.minimum === forecast.maximum ? `${forecast.minimum}` : `${forecast.minimum}–${forecast.maximum}`;
      const affinity = !move.fixedDamage && creature.types.includes(move.type) ? ' · TIPO +50%' : '';
      preview.add(this.text(x + 30, y + 68, `STIMA DANNI: ${damage} HP${affinity}`, {
        fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#b6efc0',
      }));
    }
    this.movePreview = preview;
    preview.add([title, values, tactic]);
    this.ui.add(preview);
  }

  private drawTurnResolution(x: number, y: number, width: number): void {
    const badge = this.add.graphics();
    badge.fillStyle(0x79cfff, 0.16);
    badge.fillRoundedRect(x + 10, y + 12, width - 20, 46, 13);
    badge.lineStyle(1, 0x79cfff, 0.38);
    badge.strokeRoundedRect(x + 10, y + 12, width - 20, 46, 13);
    const label = this.text(x + width / 2, y + 35, `TURNO ${this.state.turn}  ·  AZIONI IN CORSO`, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: width < 380 ? '10px' : '12px', fontStyle: 'bold', color: '#dff3ff',
      align: 'center', wordWrap: { width: width - 36 },
    }).setOrigin(0.5);
    this.ui.add([badge, label]);
  }

  private moveLearningPrompt(): string {
    const learning = this.pendingMoveLearning;
    const creature = learning ? this.creatureById('player', learning.creatureId) : undefined;
    const moveName = learning ? this.moveCatalog[learning.moveId]?.name ?? learning.moveId : 'una nuova mossa';
    return `${creature?.name ?? 'La tua creatura'} vuole imparare ${moveName}.\nQuale mossa vuoi sostituire?`;
  }

  private drawGridButtons(x: number, y: number, width: number, options: Array<{ label: string; enabled: boolean; callback: () => void; accent?: number }>, columns: number, maxRows: number): void {
    const gap = 7;
    if (options.length > 1 && this.viewport.height < 520 && this.viewport.width > 600) {
      const singleMoveRow = this.mode === 'moves' && options.length <= 4;
      columns = singleMoveRow ? options.length : Math.max(3, Math.ceil(options.length / 2));
      maxRows = singleMoveRow ? 1 : 2;
    }
    const buttonWidth = (width - gap * (columns - 1)) / columns;
    const hasBack = this.mode !== 'menu' && this.mode !== 'learning' && !this.playerForcedToSwitch;
    const buttonAreaHeight = this.commandHeight() - (hasBack ? 48 : 20);
    const buttonHeight = Math.min(this.mode === 'moves' ? 66 : 52, (buttonAreaHeight - gap * (maxRows - 1)) / maxRows);
    options.slice(0, columns * maxRows).forEach((option, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const bx = x + column * (buttonWidth + gap);
      const by = y + row * (buttonHeight + gap);
      const color = option.accent ?? (this.mode === 'learning' ? [0xafffe3, 0xc6b1ff, 0x79cfff, 0xffb6a4, 0xffd263][index] ?? COLORS.blue
        : this.mode === 'menu'
        ? [0xafffe3, 0xc6b1ff, 0x79cfff, 0xafffe3, 0xbdd3df][index] ?? COLORS.blue
        : this.mode === 'moves' ? [0xafffe3, 0xc6b1ff, 0x79cfff, 0xffb6a4][index % 4]
          : this.mode === 'party' ? 0xc6b1ff : this.mode === 'captures' ? 0xafffe3 : 0x79cfff);
      this.button(bx, by, buttonWidth, buttonHeight, option.label, option.callback, color, option.enabled, row, column);
    });
    if (hasBack) {
      const bx = x + width - 130, by = y + this.commandHeight() - 46;
      const surface = this.add.graphics();
      surface.fillStyle(0x315565, .95).fillRoundedRect(bx, by, 124, 44, 10);
      surface.lineStyle(1, 0x9ad8db, .6).strokeRoundedRect(bx, by, 124, 44, 10);
      const back = this.add.zone(bx, by, 124, 44).setOrigin(0).setName('battle-back').setInteractive({ useHandCursor: true });
      back.on('pointerdown', this.back, this);
      this.ui.add([surface, back]);
      this.label(bx + 62, by + 13, 'B · INDIETRO', COLORS.paper, 13).setOrigin(.5, 0);
    }
  }

  private button(x: number, y: number, width: number, height: number, label: string, callback: () => void, color: number, enabled = true, row = 0, column = 0): void {
    const background = this.add.graphics();
    const hasIcon = this.mode === 'menu';
    const paint = (selected: boolean): void => {
      background.clear();
      background.fillStyle(0x071a2b, enabled ? 0.30 : 0.12);
      background.fillRoundedRect(x, y + 3, width, height, 12);
      this.gradientSurface(background, x, y, width, height, 12,
        enabled ? (selected ? 0x315d6c : 0x254557) : 0x1b3042,
        enabled ? (selected ? 0x263f61 : 0x1b304a) : 0x182a3b);
      background.lineStyle(selected ? 1.8 : 1, enabled ? color : 0x8fa9ba, selected ? 0.95 : enabled ? 0.27 : 0.16);
      background.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, 11);
      if (selected) {
        // A continuous inset marker identifies focus independently of hue.
        background.fillStyle(color, 1);
        background.fillRoundedRect(x + 5, y + 12, 3, Math.max(10, height - 24), 1.5);
        background.lineStyle(1, 0xffffff, 0.20);
        background.lineBetween(x + 16, y + 3, x + width - 16, y + 3);
      } else if (this.mode === 'moves') {
        background.fillStyle(color, 0.58);
        background.fillRoundedRect(x + 5, y + 12, 3, Math.max(10, height - 24), 1.5);
      }
      if (hasIcon) this.commandIcon(background, label, x + 25, y + height / 2, enabled ? color : 0x8397aa, enabled ? 1 : 0.65);
    };
    paint(false);
    if (enabled) {
      const index = this.selectableButtons.length;
      this.selectableButtons.push({ row, column, callback, paint });
      background.setInteractive(new Phaser.Geom.Rectangle(x, y, width, height), Phaser.Geom.Rectangle.Contains);
      if (background.input) background.input.cursor = 'pointer';
      background.on('pointerdown', () => {
        this.selectionIndex = index;
        this.activateSelected();
      });
    }
    const visibleLabel = enabled ? label : this.mode === 'menu' ? `${label}\nNon disponibile` : `× ${label}`;
    if (this.mode === 'moves') {
      const [title, ...details] = visibleLabel.split('\n');
      const compact = height < 60;
      const name = this.text(x + width / 2, y + (compact ? 5 : 9), title, {
        fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: compact ? '12px' : '14px',
        fontStyle: 'bold', color: enabled ? '#f1f9fc' : '#99afbf', align: 'center',
      }).setOrigin(0.5, 0);
      if (name.width > width - 28) name.setFontSize(Math.max(10, Math.floor((compact ? 12 : 14) * (width - 28) / name.width)));
      const detail = this.text(x + width / 2, y + (compact ? 19 : 31), details.join('\n'), {
        fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '11px',
        color: enabled ? '#d6e9f5' : '#99afbf', align: 'center', lineSpacing: 1,
      }).setOrigin(0.5, 0);
      // Keep the authored category/PP lines together even with wider fallback fonts.
      // Wrapping the category adds a third line that escapes compact move cards.
      for (let size = 10; size >= 9 && (detail.width > width - 16 || detail.height > height - (compact ? 23 : 35)); size--) {
        detail.setFontSize(size);
      }
      this.ui.add([background, name, detail]);
      this.updateSelectionStyle();
      return;
    }
    const compactCommand = hasIcon && width < 155;
    const text = this.text(x + width / 2 + (hasIcon ? 14 : 0), y + height / 2, visibleLabel, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: !enabled && this.mode === 'menu' ? '11px' : this.mode === 'menu' ? compactCommand ? '11px' : '13px' : this.mode === 'message' ? '13px' : '12px',
      fontStyle: 'bold', color: enabled ? '#f1f9fc' : '#99afbf',
      align: 'center', lineSpacing: 2, wordWrap: { width: width - (hasIcon ? 62 : 28) },
    }).setOrigin(0.5);
    this.ui.add([background, text]);
    this.updateSelectionStyle();
  }

  private activateSelected(): void {
    this.selectableButtons[this.selectionIndex]?.callback();
  }

  private commandHeight(): number {
    const hasBack = this.mode !== 'menu' && this.mode !== 'message' && this.mode !== 'learning' && !this.playerForcedToSwitch;
    const landscape = this.viewport.height < 520 && this.viewport.width > 600;
    if (landscape) return hasBack ? 148 : 112;
    return hasBack && this.mode !== 'moves' ? 204 : 166;
  }

  private navigate(rowDelta: number, columnDelta: number): void {
    if (this.mode === 'moveDetails') {
      const count = this.activeCreature('player').moves.length;
      this.detailMoveIndex = (this.detailMoveIndex + rowDelta + columnDelta + count) % count;
      this.render();
      return;
    }
    if (this.mode === 'message' || this.selectableButtons.length < 2) return;
    this.selectionIndex = navigateGrid(this.selectableButtons, this.selectionIndex, rowDelta, columnDelta);
    this.updateSelectionStyle();
    if (this.mode === 'moves') {
      if (this.movePreview) {
        const x = 14;
        const y = this.viewport.height - this.commandHeight() - 92;
        this.movePreview.destroy();
        this.movePreview = undefined;
        this.drawMovePreview(x, y, this.viewport.width - 28);
      }
    }
  }

  private updateSelectionStyle(): void {
    this.selectableButtons.forEach((button, index) => {
      button.paint(index === this.selectionIndex);
    });
  }

  private panel(x: number, y: number, width: number, height: number, color: number, stroke: number, alpha = 1): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x071a2b, 0.25);
    graphics.fillRoundedRect(x, y + 4, width, height, 16);
    graphics.setAlpha(alpha);
    this.gradientSurface(graphics, x, y, width, height, 16, color, 0x22344e);
    graphics.lineStyle(1, stroke, 0.22);
    graphics.strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, 16);
    this.ui.add(graphics);
  }

  /** Rounded gradients use a few canvas-compatible strips; no texture or asset allocation. */
  private gradientSurface(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, radius: number, top: number, bottom: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    for (let offset = 0; offset < height; offset += 2) {
      const h = Math.min(2, height - offset);
      const center = offset + h / 2;
      const edge = center < r ? r - center : center > height - r ? center - (height - r) : 0;
      const inset = edge > 0 ? r - Math.sqrt(Math.max(0, r * r - edge * edge)) : 0;
      const t = center / height;
      const channel = (shift: number) => Math.round(((top >> shift) & 255) * (1 - t) + ((bottom >> shift) & 255) * t);
      graphics.fillStyle((channel(16) << 16) | (channel(8) << 8) | channel(0), 1);
      graphics.fillRect(x + inset, y + offset, width - inset * 2, h);
    }
  }

  /** Bold geometric action marks stay recognizable on phones without relying on emoji fonts. */
  private commandIcon(graphics: Phaser.GameObjects.Graphics, label: string, x: number, y: number, color: number, alpha: number): void {
    graphics.fillStyle(color, 0.18 * alpha);
    graphics.fillCircle(x, y, 17);
    graphics.lineStyle(2.7, color, alpha);
    if (label === 'LOTTA') {
      // Two crossed blades with visible guards and pommels.
      graphics.lineBetween(x - 8, y - 8, x + 7, y + 7);
      graphics.lineBetween(x + 8, y - 8, x - 7, y + 7);
      graphics.lineBetween(x - 10, y - 2, x - 3, y - 9);
      graphics.lineBetween(x + 3, y - 9, x + 10, y - 2);
      graphics.lineBetween(x - 10, y - 10, x - 7, y - 10);
      graphics.lineBetween(x + 7, y - 10, x + 10, y - 10);
    } else if (label === 'CATTURA') {
      // Red and white capture ball, divided by a strong dark equator.
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, 11);
      graphics.fillStyle(0xef6f6b, alpha);
      graphics.beginPath();
      graphics.arc(x, y, 10, Math.PI, Math.PI * 2, false);
      graphics.closePath();
      graphics.fillPath();
      graphics.lineStyle(2.5, 0x19354a, alpha);
      graphics.lineBetween(x - 10, y, x + 10, y);
      graphics.strokeCircle(x, y, 10);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, 4);
      graphics.lineStyle(2, 0x19354a, alpha);
      graphics.strokeCircle(x, y, 4);
    } else if (label === 'BORSA') {
      graphics.lineStyle(2.7, color, alpha);
      graphics.fillStyle(color, 0.36 * alpha);
      graphics.fillRoundedRect(x - 10, y - 2, 20, 14, 4);
      graphics.strokeRoundedRect(x - 10, y - 2, 20, 14, 4);
      graphics.strokeRoundedRect(x - 5, y - 9, 10, 9, 3);
      graphics.lineBetween(x - 10, y + 3, x + 10, y + 3);
    } else if (label === 'SQUADRA') {
      graphics.fillStyle(color, 0.30 * alpha);
      graphics.fillCircle(x, y - 5, 4);
      graphics.fillCircle(x - 8, y + 5, 3.5);
      graphics.fillCircle(x + 8, y + 5, 3.5);
      graphics.lineStyle(2.4, color, alpha);
      graphics.strokeCircle(x, y - 5, 4);
      graphics.strokeCircle(x - 8, y + 5, 3.5);
      graphics.strokeCircle(x + 8, y + 5, 3.5);
      graphics.beginPath();
      graphics.arc(x, y + 8, 11, Math.PI, Math.PI * 2, false);
      graphics.strokePath();
    } else {
      graphics.lineStyle(3, color, alpha);
      graphics.lineBetween(x - 9, y, x + 9, y);
      graphics.lineBetween(x + 2, y - 8, x + 10, y);
      graphics.lineBetween(x + 2, y + 8, x + 10, y);
    }
  }

  private rect(x: number, y: number, width: number, height: number, color: number): void {
    this.ui.add(this.add.rectangle(x + width / 2, y + height / 2, width, height, color));
  }

  private get viewport() { return gameViewport(this.game); }
  private get viewportKey(): string {
    const {width,height,density} = this.viewport;
    return `${width}|${height}|${density}`;
  }

  private text(x: number, y: number, value: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    return this.add.text(x, y, value, { ...style, resolution: Math.max(4, Math.ceil(this.viewport.density)) });
  }

  private label(x: number, y: number, text: string, color: string, size: number): Phaser.GameObjects.Text {
    const label = this.text(x, y, text, { fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color, letterSpacing: 0.5 });
    this.ui.add(label);
    return label;
  }

  private pip(x: number, y: number, alive: boolean, active: boolean): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(alive ? (active ? COLORS.yellow : COLORS.green) : 0xa4b4c2, 1);
    graphics.fillCircle(x, y, active ? 4 : 3);
    if (active) {
      graphics.lineStyle(2, COLORS.ink, 0.85);
      graphics.strokeCircle(x, y, 6);
    }
    this.ui.add(graphics);
  }

  private open(mode: ViewMode): void {
    if (this.mode === 'message') return;
    this.mode = mode;
    this.render();
  }

  private act(playerCommand: BattleCommand): void {
    if (this.state.outcome.kind !== 'ongoing') return;
    const opponentCommand = this.chooseOpponentCommand();
    this.visualHp = new Map([...this.state.player.creatures, ...this.state.opponent.creatures].map(creature => [creature.instanceId, creature.hp]));
    this.visualActiveIds = new Map<BattleSide, string>([
      ['player', this.activeCreature('player').instanceId],
      ['opponent', this.activeCreature('opponent').instanceId],
    ]);
    const transition = resolveBattleTurn(
      this.state,
      { player: playerCommand, opponent: opponentCommand } satisfies BattleCommands,
      this.moveCatalog,
      this.rules,
    );
    this.state = transition.state;
    this.eventLog.push(...transition.events);
    this.consumeInventoryForEvents(transition.events);
    this.playerForcedToSwitch = this.state.outcome.kind === 'ongoing' && this.activeCreature('player').hp <= 0;
    this.pendingMessages = transition.events.flatMap(event => {
      const text = this.describeEvent(event);
      return text ? [{ text, event }] : [];
    });
    if (!this.pendingMessages.length) this.pendingMessages = [{ text: 'Nessuna azione ha avuto effetto.' }];
    this.mode = 'message';
    this.openNextMoveLearningIfNeeded();
    const hasPendingPlayerLearning = transition.events.some(event => event.type === 'moveLearningSkipped' && event.side === 'player');
    if (this.state.outcome.kind !== 'ongoing' && !hasPendingPlayerLearning && !this.completionReported) {
      this.completionReported = true;
      this.onComplete(this.state, [...this.eventLog]);
    }
    this.render();
    this.scheduleMessageAdvance();
  }

  private chooseOpponentCommand(): BattleCommand {
    return chooseOpponentCommand(this.state, this.moveCatalog, this.rules, this.opponentPolicy);
  }

  private advanceMessage(event?: KeyboardEvent): void {
    this.messageTimer?.remove(false);
    this.messageTimer = undefined;
    const current = this.pendingMessages[0];
    if (current?.event?.type === 'moveLearningSkipped' && current.event.side === 'player') {
      this.pendingMessages.shift();
      this.beginMoveLearning(current.event);
      return;
    }
    if (this.pendingMessages.length > 1) {
      this.pendingMessages.shift();
      this.openNextMoveLearningIfNeeded();
      if (this.state.outcome.kind === 'captured' && this.pendingMessages[0]?.event?.type === 'creatureCaptured') {
        this.showTerminalMessage();
        return;
      }
      this.render();
      this.scheduleMessageAdvance();
      return;
    }
    this.pendingMessages = [];
    this.finishPostTurn(event);
  }

  private openNextMoveLearningIfNeeded(): void {
    const next = this.pendingMessages[0];
    if (next?.event?.type !== 'moveLearningSkipped' || next.event.side !== 'player') return;
    this.pendingMessages.shift();
    this.beginMoveLearning(next.event);
  }

  private beginMoveLearning(event: Extract<BattleEvent, { type: 'moveLearningSkipped' }>): void {
    this.pendingMoveLearning = event;
    this.mode = 'learning';
    this.render();
  }

  private resolveMoveLearning(slotIndex: number | null): void {
    const learning = this.pendingMoveLearning;
    if (!learning) return;
    const creature = this.creatureById('player', learning.creatureId);
    if (!creature) {
      this.pendingMoveLearning = undefined;
      this.finishMoveLearning();
      return;
    }
    if (slotIndex === null) {
      const event: BattleEvent = { type: 'moveLearningDeclined', side: 'player', creatureId: learning.creatureId, moveId: learning.moveId };
      this.eventLog.push(event);
      const text = this.describeEvent(event);
      if (text) this.pendingMessages.unshift({ text, event });
    } else {
      const previousMoveId = creature.moves[slotIndex]?.moveId;
      if (!previousMoveId) return;
      this.state = replaceLearnedMove(this.state, learning.creatureId, learning.moveId, slotIndex, this.rules.maxMoves, this.moveCatalog);
      const event: BattleEvent = {
        type: 'moveReplaced', side: 'player', creatureId: learning.creatureId, moveId: learning.moveId,
        previousMoveId, slotIndex,
      };
      this.eventLog.push(event);
      const text = this.describeEvent(event);
      if (text) this.pendingMessages.unshift({ text, event });
    }
    this.pendingMoveLearning = undefined;
    this.finishMoveLearning();
  }

  private finishMoveLearning(): void {
    this.mode = 'message';
    this.openNextMoveLearningIfNeeded();
    if (this.pendingMoveLearning) {
      this.render();
      return;
    }
    if (this.pendingMessages.length) {
      this.mode = 'message';
      this.render();
      this.scheduleMessageAdvance();
      return;
    }
    this.finishPostTurn();
  }

  private finishPostTurn(event?: KeyboardEvent): void {
    if (this.state.outcome.kind !== 'ongoing') {
      if (!this.completionReported) {
        this.completionReported = true;
        this.onComplete(this.state, [...this.eventLog]);
      }
      if (!this.terminalShown) this.showTerminalMessage();
      else if (!this.dismissalReported) {
        this.dismissalReported = true;
        this.onDismiss?.(event);
      }
      return;
    }
    if (this.activeCreature('player').hp > 0 && this.activeCreature('opponent').hp <= 0) {
      // The core ignores the player's placeholder command during a forced replacement.
      this.act({ kind: 'useMove', moveSlot: 0 });
      return;
    }
    this.mode = this.playerForcedToSwitch ? 'party' : 'menu';
    this.visualHp.clear();
    this.visualActiveIds.clear();
    this.render();
  }

  private showTerminalMessage(): void {
    const terminal = this.outcomeMessage();
    const rewards = battleRewardSummary(this.eventLog);
    this.pendingMessages = [{ text: `${terminal}${rewards.length ? `\n${rewards.join('   ·   ')}` : ''}` }];
    this.mode = 'message';
    this.terminalShown = true;
    this.render();
    if (this.state.outcome.kind === 'captured' || this.state.outcome.kind === 'won' && this.state.outcome.winner === 'player') {
      this.celebration = new BattleCelebration(this.state, this.eventLog, this.moveCatalog, this.victoryPresentation?.(), event => this.finishPostTurn(event), this.reducedAnimations);
    }
  }

  private scheduleMessageAdvance(): void {
    if (this.mode !== 'message' || this.terminalShown || this.pendingMessages[0]?.event?.type === 'moveLearningSkipped') return;
    this.messageTimer?.remove(false);
    const duration = this.pendingMessages[0]?.event?.type === 'captureAttempted' && !this.reducedAnimations ? 1250 : 720;
    this.messageTimer = this.time.delayedCall(duration, () => {
      this.messageTimer = undefined;
      this.advanceMessage();
    });
  }

  private applyVisualEvent(event: BattleEvent): void {
    if (event.type === 'creatureSwitched') this.visualActiveIds.set(event.side, event.toId);
    const changeHp = (side: BattleSide, delta: number, creatureId?: string): void => {
      const creature = (creatureId ? this.creatureById(side, creatureId) : undefined) ?? this.displayedCreature(side);
      const current = this.visualHp.get(creature.instanceId) ?? creature.hp;
      this.hpTweenFrom.set(creature.instanceId, current);
      this.visualHp.set(creature.instanceId, Phaser.Math.Clamp(current + delta, 0, creature.stats.maxHp));
    };
    if (event.type === 'damageApplied') changeHp(event.targetSide, -event.amount);
    if (event.type === 'recoilApplied') changeHp(event.side, -event.amount, event.creatureId);
    if (event.type === 'healingApplied') changeHp(event.side, event.amount, event.creatureId);
    if (event.type === 'leechSeedTick') changeHp(event.side, -event.damage, event.creatureId);
    if (event.type === 'confusionSelfHit') changeHp(event.side, -event.amount, event.creatureId);
    if (event.type === 'statusTick' && event.damage) changeHp(event.side, -event.damage);
    if (event.type === 'itemUsed' && event.healed) {
      const creature = this.creatureById(event.side, event.targetId);
      if (creature) {
        const previousHp = this.visualHp.get(creature.instanceId) ?? creature.hp;
        this.hpTweenFrom.set(creature.instanceId, previousHp);
        this.visualHp.set(creature.instanceId, Math.min(creature.stats.maxHp, previousHp + event.healed));
      }
    }
    // Level-ups may increase max HP; the terminal panel must match the resolved snapshot.
    if (event.type === 'battleEnded') { this.visualHp.clear(); this.visualActiveIds.clear(); }
  }

  /** Effects consume resolved semantic events. Skipping text only cancels visuals. */
  private animateEvent(event: BattleEvent): void {
    if (event.type === 'moveUsed') {
      const actor = this.actors[event.side];
      const target = this.actors[event.side === 'player' ? 'opponent' : 'player'];
      const move = this.moveCatalog[event.moveId];
      if (actor && target && !this.reducedAnimations) {
        if (move?.category === 'physical' || event.moveId === EMERGENCY_MOVE_ID) {
          this.tweens.add({ targets: actor, x: actor.x + (target.x - actor.x) * 0.14, duration: 125, yoyo: true, ease: 'Cubic.easeOut' });
        } else {
          const orb = this.add.circle(actor.x, actor.y, 10, this.typeColor(move?.type), 0.9);
          this.ui.add(orb);
          this.tweens.add({ targets: orb, x: target.x, y: target.y, scale: 0.4, duration: 350, ease: 'Cubic.easeIn', onComplete: () => orb.destroy() });
        }
      }
    } else if (event.type === 'damageApplied') {
      const actor = this.actors[event.targetSide];
      if (actor) {
        this.floatingFeedback(actor, event.effectiveness === 0 ? 'IMMUNE' : `−${event.amount}${event.critical ? '  CRITICO' : ''}`, event.effectiveness > 1 ? '#ffd88e' : '#fff4e6');
        if (!this.reducedAnimations) this.tweens.add({ targets: actor, alpha: 0.2, duration: 85, yoyo: true, repeat: 2 });
      }
    } else if (event.type === 'healingApplied') {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, `+${event.amount} HP`, '#b6efc0');
    } else if (event.type === 'leechSeedTick') {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, `−${event.damage} HP`, '#b6efc0');
    } else if (event.type === 'leechSeedApplied') {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, 'PARASSISEME', '#b6efc0');
    } else if (event.type === 'confusionApplied') {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, 'CONFUSIONE', '#c6b1ff');
    } else if (event.type === 'recoilApplied' || event.type === 'confusionSelfHit') {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, `−${event.amount} HP`, '#ffb6a4');
    } else if (event.type === 'statusTick' && event.damage) {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, `−${event.damage}`, '#e7a9e3');
    } else if (event.type === 'levelUp') {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, `LIVELLO ${event.level}!`, '#c6edaf');
    } else if (event.type === 'experienceGained') {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, `+${event.amount} XP`, '#b2e2f1');
    } else if (event.type === 'itemUsed' && event.healed) {
      const actor = this.actors[event.side];
      if (actor) this.floatingFeedback(actor, `+${event.healed} HP`, '#b6efc0');
    } else if (event.type === 'captureAttempted') {
      const target = this.actors.opponent;
      const source = this.actors.player;
      if (target && source) {
        const sphere = this.add.container(this.reducedAnimations ? target.x : source.x, this.reducedAnimations ? target.y : source.y - 12);
        sphere.name = 'capture-sphere';
        const shell = this.add.circle(0, 0, 14, 0xffffff).setStrokeStyle(2, 0x24384b);
        const top = this.add.graphics().fillStyle(0xff6b73);
        top.beginPath().arc(0, 0, 13, Math.PI, Math.PI * 2, false).closePath().fillPath();
        sphere.add([shell, top, this.add.rectangle(0, 0, 27, 3, 0x24384b), this.add.circle(0, 0, 6, 0x24384b), this.add.circle(0, 0, 3, 0xffffff)]);
        this.ui.add(sphere);
        if (this.reducedAnimations) target.alpha = 0.35;
        else this.tweens.add({ targets: sphere, x: target.x, y: target.y - 16, angle: 360, duration: 400, ease: 'Sine.easeOut', onComplete: () => {
          this.tweens.add({ targets: target, alpha: 0.1, scale: 0.5, duration: 150 });
          this.tweens.add({ targets: sphere, y: target.y + 14, duration: 130, ease: 'Bounce.easeOut', onComplete: () => {
            this.tweens.add({ targets: sphere, angle: { from: -18, to: 18 }, yoyo: true, repeat: 1, duration: 130, ease: 'Sine.easeInOut' });
          } });
        } });
      }
    } else if (event.type === 'captureFailed') {
      if (this.actors.opponent) this.floatingFeedback(this.actors.opponent, 'SI È LIBERATO!', '#ffb6a4');
    } else if (event.type === 'creatureCaptured') {
      if (this.actors.opponent) this.floatingFeedback(this.actors.opponent, 'CATTURATO!', '#f4db9b');
    } else if (event.type === 'creatureEvolved') {
      const actor = this.actors[event.side];
      if (actor) {
        this.floatingFeedback(actor, `${event.toName.toUpperCase()}!`, '#c6edaf');
        if (!this.reducedAnimations) {
          const glow = this.add.circle(actor.x, actor.y, 34, 0xc6edaf, 0.22).setStrokeStyle(3, 0xf4e6a2, 0.9);
          this.ui.add(glow);
          this.tweens.add({ targets: glow, scale: 2.1, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => glow.destroy() });
        }
      }
    } else if (event.type === 'creatureFainted') {
      const actor = this.actors[event.side];
      if (actor && !this.reducedAnimations) this.tweens.add({ targets: actor, alpha: 0.15, y: actor.y + 12, duration: 280 });
    }
  }

  private floatingFeedback(actor: Phaser.GameObjects.Container, text: string, color: string): void {
    const feedback = this.text(actor.x, actor.y - 52, text, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '18px', fontStyle: 'bold', color,
      stroke: COLORS.paper, strokeThickness: 5,
    }).setOrigin(0.5);
    this.ui.add(feedback);
    if (!this.reducedAnimations) this.tweens.add({ targets: feedback, y: feedback.y - 18, duration: 750, ease: 'Cubic.easeOut' });
  }

  private describeEvent(event: BattleEvent): string | null {
    switch (event.type) {
      case 'commandRejected':
        return event.reason === 'captureForbidden' ? 'Non puoi catturare le creature di un allenatore.' : 'Non puoi eseguire questa azione.';
      case 'moveUsed': {
        const creature = this.creatureById(event.side, event.creatureId);
        const move = this.moveCatalog[event.moveId];
        const moveName = event.moveId === EMERGENCY_MOVE_ID ? EMERGENCY_MOVE_NAME : move?.name ?? event.moveId;
        return `${creature?.name ?? 'La creatura'} usa ${moveName}.`;
      }
      case 'recoilApplied':
        return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} subisce ${event.amount} danni da contraccolpo.`;
      case 'healingApplied': return `Assorbe energia e recupera ${event.amount} HP.`;
      case 'flinched': return formatFlinched(this.creatureById(event.side, event.creatureId)?.name ?? 'Il Pokémon');
      case 'leechSeedApplied': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} è colpita da Parassiseme!`;
      case 'leechSeedPrevented': return event.reason === 'immune' ? 'Parassiseme non ha effetto sui Pokémon Erba.' : 'Il bersaglio è già sotto l’effetto di Parassiseme.';
      case 'leechSeedTick': return `Parassiseme sottrae ${event.damage} HP a ${this.creatureById(event.side, event.creatureId)?.name ?? 'la creatura'}.`;
      case 'confusionApplied': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} è confusa!`;
      case 'confusionPrevented': return 'Il bersaglio è già confuso.';
      case 'confusionTick': return event.turnsRemaining === 0 ? 'La confusione è passata.' : null;
      case 'confusionSelfHit': return `Si colpisce per la confusione! −${event.amount} HP`;
      case 'moveMissed': return 'L’attacco manca il bersaglio.';
      case 'moveFailed': return event.reason === 'noPp' ? 'Non restano PP per questa mossa.' : event.reason === 'blockedByStatus' ? 'Lo stato impedisce di agire.' : 'Non c’è un bersaglio disponibile.';
      case 'damageApplied':
        if (event.effectiveness === 0) return 'Nessun effetto: il bersaglio è immune.';
        if (event.effectiveness > 1) return `Super efficace! −${event.amount} HP`;
        if (event.effectiveness < 1) return `Poco efficace · −${event.amount} HP`;
        return event.critical ? `Colpo critico! −${event.amount} HP` : `A segno · −${event.amount} HP`;
      case 'statusApplied': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} ${this.statusVerb(event.status)}.`;
      case 'statusPrevented': return event.reason === 'alreadyAfflicted' ? 'La creatura ha già un problema di stato.' : 'Il tipo della creatura la protegge da questo stato.';
      case 'statusTick':
        if (event.damage) return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} subisce ${event.damage} danni dallo stato.`;
        return event.recovered ? 'La creatura si è ripresa.' : null;
      case 'creatureFainted': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} non può più continuare.`;
      case 'experienceGained': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} ottiene ${event.amount} punti esperienza.`;
      case 'moveLearned': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} ha imparato ${this.moveCatalog[event.moveId]?.name ?? event.moveId}!`;
      case 'moveLearningSkipped': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} ha già quattro mosse: ${this.moveCatalog[event.moveId]?.name ?? event.moveId} non è stata appresa.`;
      case 'moveReplaced': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} dimentica ${this.moveCatalog[event.previousMoveId]?.name ?? event.previousMoveId} e impara ${this.moveCatalog[event.moveId]?.name ?? event.moveId}!`;
      case 'moveLearningDeclined': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} tiene le mosse che conosce.`;
      case 'levelUp': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} sale al livello ${event.level}!`;
      case 'statStageChanged':
        return formatStatStageChanged(event.stat, event.change, this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura');
      case 'statStageLimited':
        return formatStatStageLimited(event.stat, event.stage, this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura');
      case 'creatureEvolved': return `${event.fromName} si è evoluta in ${event.toName}!`;
      case 'creatureSwitched': return `${this.creatureById(event.side, event.toId)?.name ?? 'La nuova creatura'} entra in campo.`;
      case 'itemUsed': return 'Hai usato uno strumento.';
      case 'captureAttempted': return 'La sfera è in volo…';
      case 'captureFailed': return 'La creatura si è liberata!';
      case 'creatureCaptured': return `Cattura riuscita. ${this.creatureById('player', event.creatureId)?.name ?? 'La creatura'} è ${event.destination === 'party' ? 'in squadra' : 'nel box'}.`;
      case 'fleeFailed': return 'Non riesci a fuggire.';
      case 'battleEnded': return event.outcome.kind === 'captured' ? 'La creatura si unisce al tuo viaggio.' : this.outcomeMessage(event.outcome);
      case 'turnStarted':
      case 'actionOrder': return null;
    }
  }

  private outcomeMessage(outcome = this.state.outcome): string {
    if (outcome.kind === 'captured') return 'La cattura è riuscita.';
    if (outcome.kind === 'fled') return outcome.side === 'player' ? 'Sei riuscito a fuggire.' : 'La creatura è fuggita.';
    if (outcome.kind === 'draw') return 'Lo scontro termina in parità.';
    if (outcome.kind === 'won') return outcome.winner === 'player' ? 'Hai vinto lo scontro.' : 'La tua squadra non può più continuare.';
    return 'Lo scontro continua.';
  }

  private displayedCreature(side: BattleSide): BattleCreature {
    const id = this.visualActiveIds.get(side);
    return (id ? this.creatureById(side, id) : undefined) ?? this.activeCreature(side);
  }

  private activeCreature(side: BattleSide): BattleCreature {
    const team = this.state[side].creatures;
    return team[this.state[side].activeIndex];
  }

  private creatureById(side: BattleSide, id: string): BattleCreature | undefined {
    return this.state[side].creatures.find(creature => creature.instanceId === id)
      ?? (side === 'player' ? this.state.playerStorage.find(creature => creature.instanceId === id) : undefined);
  }

  private availableItemIds(): string[] {
    return Object.keys(this.rules.items).filter(id => this.remainingInventory === undefined || (this.remainingInventory[id] ?? 0) > 0);
  }

  private availableCaptureIds(): string[] {
    return Object.keys(this.rules.captureItems).filter(id => this.remainingInventory === undefined || (this.remainingInventory[id] ?? 0) > 0);
  }

  private consumeInventoryForEvents(events: readonly BattleEvent[]): void {
    if (!this.remainingInventory) return;
    for (const event of events) {
      const itemId = event.type === 'itemUsed' && event.side === 'player'
        ? event.itemId
        : event.type === 'captureAttempted' && event.side === 'player'
          ? event.itemId
          : undefined;
      if (itemId) this.remainingInventory[itemId] = Math.max(0, (this.remainingInventory[itemId] ?? 0) - 1);
    }
  }

  private makeInstanceId(): string {
    if (this.createInstanceId) return this.createInstanceId();
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    this.captureCounter += 1;
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private prettyId(id: string): string {
    return id.replace(/^item_/, '').replaceAll('_', ' ').toLocaleUpperCase('it-IT');
  }

  private statusName(status: NonNullable<BattleCreature['status']>['status']): string {
    return ({ burn: 'Scottatura', poison: 'Veleno', paralysis: 'Paralisi', sleep: 'Sonno', freeze: 'Gelo' })[status];
  }

  private moveTacticLabel(move: MoveDefinition): string | undefined {
    if (move.leechSeedFraction) return `DRENA 1/${Math.round(1 / move.leechSeedFraction)} HP OGNI TURNO`;
    if (move.drainPercent) return `ASSORBE ${move.drainPercent}% DEI DANNI`;
    if (move.minHits) return `${move.minHits}–${move.maxHits} COLPI`;
    if (move.inflictedConfusionChance) return `CONFUSIONE ${move.inflictedConfusionChance}%`;
    if (move.inflictedStatus) {
      return `${this.statusName(move.inflictedStatus).toLocaleUpperCase('it-IT')} ${move.statusChance ?? 100}%`;
    }
    if (move.priority > 0) return `PRIORITÀ +${move.priority}`;
    if (move.statChanges?.length) {
      const effect = move.statChanges[0];
      const stat = ({ attack: 'ATT.', defense: 'DIF.', specialAttack: 'ATT. SPEC.', specialDefense: 'DIF. SPEC.', speed: 'VEL.', accuracy: 'PREC.', evasion: 'ELUS.' })[effect.stat];
      const target = effect.target === 'self' ? 'TUA' : 'AVV.';
      return `${stat} ${target} ${effect.stages > 0 ? '+' : ''}${effect.stages}${move.statChangeChance ? ` · ${move.statChangeChance}%` : ''}`;
    }
    return undefined;
  }

  private moveAccuracyLabel(move: MoveDefinition): string {
    if (move.alwaysHits) return '—';
    const accuracy = effectiveMoveAccuracy(this.activeCreature('player'), this.activeCreature('opponent'), move);
    return accuracy === move.accuracy ? `${move.accuracy}%` : `${Math.floor(accuracy)}% ORA`;
  }

  private moveForecast(move: MoveDefinition) {
    const user = this.activeCreature('player');
    const target = this.activeCreature('opponent');
    const damage = estimateMoveDamage(user, target, move, this.rules);
    return damage ? { ...damage, accuracy: effectiveMoveAccuracy(user, target, move) } : undefined;
  }

  private statusVerb(status: NonNullable<BattleCreature['status']>['status']): string {
    return ({ burn: 'si scotta', poison: 'viene avvelenata', paralysis: 'viene paralizzata', sleep: 'si addormenta', freeze: 'viene congelata' })[status];
  }

  private typeColor(type: BattleCreature['types'][number] | undefined): number {
    return ({
      normal: 0xc9b98f, fire: 0xc87854, water: 0x6e9fb1, electric: 0xd6be69, grass: 0x819d62,
      ice: 0xa2c6c1, fighting: 0xa75f53, poison: 0x936e9d, ground: 0xb79261, flying: 0xa9b9bb,
      psychic: 0xc17e9a, bug: 0x9da257, rock: 0x9f9374, ghost: 0x77718d, dragon: 0x667fb2,
      dark: 0x6f746f, steel: 0x9caaa7,
    } as Record<string, number>)[type ?? 'normal'] ?? 0xc9b98f;
  }
}
