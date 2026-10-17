import Phaser from 'phaser';
import { resolveBattleTurn, type BattleCommands, type MoveCatalog } from '../../core/battle/engine.ts';
import type { BattleRules } from '../../core/battle/rules.ts';
import type { BattleCommand, BattleCreature, BattleEvent, BattleSide, BattleState } from '../../core/battle/types.ts';
import { formatBattleMoveLabel } from '../battle/format-move-label.ts';
import { createCreatureImage } from '../battle/creature-art.ts';
import { battleExperienceProgress, battleRewardSummary, battleTypeLabel } from '../battle/presentation.ts';

export interface BattleSceneInit {
  /** Prepared snapshot from the game core. Scene code never creates or loads saves. */
  readonly state: BattleState;
  readonly moveCatalog: MoveCatalog;
  readonly rules: BattleRules;
  /** Events remain the source of truth for save/inventory updates in the owning application. */
  readonly onComplete: (state: BattleState, events: readonly BattleEvent[]) => void;
  readonly onDismiss?: () => void;
  /** Optional game-level UUID source for newly captured creatures. */
  readonly createInstanceId?: () => string;
  /** If provided, consumables with a zero count are hidden from the battle bag. */
  readonly inventory?: Readonly<Record<string, number>>;
  /** Optional image texture declared by the current MapDefinition. */
  readonly arenaTextureKey?: string;
  readonly reducedAnimations?: boolean;
}

type ViewMode = 'menu' | 'moves' | 'party' | 'items' | 'captures' | 'message';
type SelectableButton = { row: number; column: number; callback: () => void; paint: (selected: boolean) => void };

const COLORS = {
  sky: 0xdff3ff,
  panel: 0xfffdf5,
  panelRaised: 0xe3f3ff,
  line: 0xa9c5dd,
  paper: '#234565',
  muted: '#506984',
  gold: '#72521b',
  ink: 0x234565,
  coral: 0xf47c69,
  blue: 0x55b9e9,
  yellow: 0xffd263,
  violet: 0xb0a0e5,
  orange: 0xffbd7b,
  green: 0x64b986,
  red: 0xe36a61,
};

/** Mobile-first battle UI. All game rules and state transitions are delegated to the pure reducer. */
export class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  private moveCatalog!: MoveCatalog;
  private rules!: BattleRules;
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
  private captureCounter = 0;
  private playerForcedToSwitch = false;
  private selectableButtons: SelectableButton[] = [];
  private selectionIndex = 0;
  private readonly handleScaleResize = (): void => this.render();
  private readonly removeScaleResizeListener = (): void => {
    this.scale.off('resize', this.handleScaleResize);
    this.ui?.list.forEach(child => this.tweens.killTweensOf(child));
  };

  constructor() {
    super('battle');
  }

  init(data: BattleSceneInit): void {
    this.state = data.state;
    this.moveCatalog = data.moveCatalog;
    this.rules = data.rules;
    this.onComplete = data.onComplete;
    this.onDismiss = data.onDismiss;
    this.createInstanceId = data.createInstanceId;
    this.arenaTextureKey = data.arenaTextureKey;
    this.reducedAnimations = data.reducedAnimations ?? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.remainingInventory = data.inventory ? { ...data.inventory } : undefined;
    this.mode = 'menu';
    this.pendingMessages = [];
    this.eventLog = [];
    this.completionReported = false;
    this.terminalShown = false;
    this.captureCounter = 0;
    this.playerForcedToSwitch = false;
    this.presentedEvent = undefined;
    this.visualHp.clear();
    this.visualActiveIds.clear();
  }

  create(): void {
    this.ui = this.add.container(0, 0);
    this.scale.on('resize', this.handleScaleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeScaleResizeListener);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.removeScaleResizeListener);
    this.input.keyboard?.on('keydown-ENTER', this.confirm, this);
    this.input.keyboard?.on('keydown-SPACE', this.confirm, this);
    this.input.keyboard?.on('keydown-ESC', this.back, this);
    this.input.keyboard?.on('keydown-B', this.back, this);
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

  private confirm(): void {
    if (this.mode === 'message') {
      this.advanceMessage();
      return;
    }
    if (this.selectableButtons.length) {
      this.activateSelected();
    } else if (this.mode !== 'party' || !this.playerForcedToSwitch) {
      this.back();
    }
  }

  private back(): void {
    if (this.mode === 'message' || this.playerForcedToSwitch) return;
    if (this.mode === 'menu') return;
    this.mode = 'menu';
    this.render();
  }

  private render(): void {
    if (!this.ui || !this.state) return;
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
    this.selectionIndex = 0;
    const width = this.scale.width;
    const height = this.scale.height;
    this.drawArena(width, height);
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
    const name = this.add.text(x + 12, y + 9, creature.name, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '18px', fontStyle: 'bold', color: COLORS.paper,
    });
    this.ui.add(name);
    this.label(x + width - 12, y + 13, `LV ${creature.level}`, COLORS.paper, 10).setOrigin(1, 0);
    const hpLabel = this.add.text(x + 12, y + 34, 'HP', { fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: COLORS.muted });
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
    const hpText = this.add.text(x + width - 12, y + 34, `${hp}/${creature.stats.maxHp}`, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '11px', fontStyle: 'bold', color: COLORS.paper,
    }).setOrigin(1, 0);
    this.ui.add(hpText);
    if (creature.status) {
      this.label(x + 12, y + 53, this.statusName(creature.status.status).toUpperCase(), '#a33b36', 10);
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
      const scale = size / Math.max(image.width, image.height);
      image.setScale(scale).setFlipX(side === 'player');
      actor.add(image);
    } else {
      // Unknown content stays explicit rather than impersonating a different species.
      actor.add(this.add.text(0, 0, creature.name, { fontFamily: 'Georgia, serif', fontSize: '18px', color: COLORS.paper }).setOrigin(0.5));
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
    const message = this.mode === 'message'
      ? this.pendingMessages[0]?.text ?? this.outcomeMessage()
      : this.mode === 'party' && this.playerForcedToSwitch
        ? 'Scegli chi mandare in campo.'
        : 'Cosa vuoi fare?';
    const text = this.add.text(x + 14, y + 13, message, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '17px', color: COLORS.paper,
      wordWrap: { width: panelWidth - 28 }, lineSpacing: 3,
    });
    this.ui.add(text);
    if (this.mode === 'message') {
      const hint = this.add.text(x + panelWidth - 12, y + 66, 'A · CONTINUA', {
        fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: '9px', fontStyle: 'bold', color: COLORS.muted,
      }).setOrigin(1, 0);
      this.ui.add(hint);
    }
  }

  private drawCommandPanel(width: number, height: number): void {
    const x = 14;
    const y = height - this.commandHeight();
    const panelWidth = width - 28;
    this.panel(x, y, panelWidth, this.commandHeight(), COLORS.panel, COLORS.line, 0.99);
    if (this.mode === 'message') {
      this.button(x + 8, y + 8, panelWidth - 16, 52, this.terminalShown ? 'TORNA AL VIAGGIO' : 'CONTINUA', () => this.advanceMessage(), COLORS.blue, true, 0, 0);
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
    const options = creature.moves.map((slot, index) => {
      const move = this.moveCatalog[slot.moveId];
      return {
        label: move
          ? `${formatBattleMoveLabel(move.name, move.type, slot.pp, move.maxPp)}\n${move.power > 0 ? `POT ${move.power}` : 'STATO'} · PREC ${move.accuracy}%`
          : `${slot.moveId}\nPP ${slot.pp}/${slot.pp}`,
        enabled: slot.pp > 0,
        callback: () => this.act({ kind: 'useMove', moveSlot: index }),
      };
    });
    if (!options.length) options.push({ label: 'Nessuna mossa', enabled: false, callback: () => undefined });
    this.drawGridButtons(x, y, width, options, 2, 2);
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

  private drawGridButtons(x: number, y: number, width: number, options: Array<{ label: string; enabled: boolean; callback: () => void }>, columns: number, maxRows: number): void {
    const gap = 7;
    if (this.scale.height < 520 && this.scale.width > 600) {
      columns = Math.max(3, Math.ceil(options.length / 2));
      maxRows = 2;
    }
    const buttonWidth = (width - gap * (columns - 1)) / columns;
    const buttonAreaHeight = this.commandHeight() - 20;
    const buttonHeight = Math.min(52, (buttonAreaHeight - gap * (maxRows - 1)) / maxRows);
    options.slice(0, columns * maxRows).forEach((option, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const bx = x + column * (buttonWidth + gap);
      const by = y + row * (buttonHeight + gap);
      const color = this.mode === 'menu'
        ? [COLORS.coral, COLORS.violet, COLORS.orange, COLORS.blue, 0xc6dbe9][index] ?? COLORS.panelRaised
        : this.mode === 'moves' ? [0xffc8b9, 0xffe3a0, 0xc7e7fa, 0xdcd2f6][index % 4]
          : this.mode === 'party' ? 0xe2d9f6 : this.mode === 'captures' ? 0xc7e7fa : 0xffdfb8;
      this.button(bx, by, buttonWidth, buttonHeight, option.label, option.callback, color, option.enabled, row, column);
    });
    if (this.mode !== 'menu' && !this.playerForcedToSwitch) {
      const back = this.label(x + width - 4, y + this.commandHeight() - 14, 'B · INDIETRO', COLORS.paper, 10).setOrigin(1, 0);
      back.setInteractive({ useHandCursor: true }).on('pointerdown', this.back, this);
    }
  }

  private button(x: number, y: number, width: number, height: number, label: string, callback: () => void, color: number, enabled = true, row = 0, column = 0): void {
    const background = this.add.graphics();
    const paint = (selected: boolean): void => {
      background.clear();
      background.fillStyle(COLORS.ink, enabled ? 0.15 : 0.07);
      background.fillRoundedRect(x, y + 3, width, height, 12);
      background.fillStyle(enabled ? color : 0xe7eaf0, 1);
      background.fillRoundedRect(x, y, width, height, 12);
      background.lineStyle(selected ? 3 : 1, selected ? COLORS.ink : COLORS.line, 1);
      background.strokeRoundedRect(x + 1.5, y + 1.5, width - 3, height - 3, 10);
      if (selected) {
        // A visible shape as well as colour identifies keyboard focus.
        background.fillStyle(COLORS.ink, 1);
        background.fillTriangle(x + 8, y + height / 2 - 4, x + 8, y + height / 2 + 4, x + 13, y + height / 2);
      }
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
    const visibleLabel = enabled ? label : this.mode === 'menu' ? `${label}\n— non disponibile` : `× ${label}`;
    const text = this.add.text(x + width / 2, y + height / 2, visibleLabel, {
      fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: this.mode === 'menu' || this.mode === 'message' ? '13px' : '12px',
      fontStyle: 'bold', color: enabled ? COLORS.paper : '#606c80',
      align: 'center', lineSpacing: 1, wordWrap: { width: width - 28 },
    }).setOrigin(0.5);
    this.ui.add([background, text]);
    this.updateSelectionStyle();
  }

  private activateSelected(): void {
    this.selectableButtons[this.selectionIndex]?.callback();
  }

  private commandHeight(): number {
    return this.scale.height < 520 && this.scale.width > 600 ? 112 : 166;
  }

  private navigate(rowDelta: number, columnDelta: number): void {
    if (this.mode === 'message' || this.selectableButtons.length < 2) return;
    const current = this.selectableButtons[this.selectionIndex];
    if (!current) return;
    const alongRow = rowDelta !== 0;
    const sameLane = this.selectableButtons
      .map((button, index) => ({ button, index }))
      .filter(({ button }) => alongRow ? button.column === current.column : button.row === current.row);
    const delta = alongRow ? rowDelta : columnDelta;
    const coordinate = (button: SelectableButton) => alongRow ? button.row : button.column;
    const candidates = sameLane.filter(({ button }) => (coordinate(button) - coordinate(current)) * delta > 0);
    const next = candidates.sort((a, b) => Math.abs(coordinate(a.button) - coordinate(current)) - Math.abs(coordinate(b.button) - coordinate(current)))[0]
      ?? sameLane.filter(({ button }) => button !== current).sort((a, b) => (coordinate(b.button) - coordinate(a.button)) * delta)[0];
    if (next) {
      this.selectionIndex = next.index;
      this.updateSelectionStyle();
    }
  }

  private updateSelectionStyle(): void {
    this.selectableButtons.forEach((button, index) => {
      button.paint(index === this.selectionIndex);
    });
  }

  private panel(x: number, y: number, width: number, height: number, color: number, stroke: number, alpha = 1): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.ink, 0.13);
    graphics.fillRoundedRect(x, y + 3, width, height, 15);
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(x, y, width, height, 15);
    graphics.lineStyle(1.5, stroke, 0.9);
    graphics.strokeRoundedRect(x, y, width, height, 15);
    this.ui.add(graphics);
  }

  private rect(x: number, y: number, width: number, height: number, color: number): void {
    this.ui.add(this.add.rectangle(x + width / 2, y + height / 2, width, height, color));
  }

  private label(x: number, y: number, text: string, color: string, size: number): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, text, { fontFamily: 'Nunito, Trebuchet MS, sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color, letterSpacing: 0.5 });
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
    if (this.state.outcome.kind !== 'ongoing' && !this.completionReported) {
      this.completionReported = true;
      this.onComplete(this.state, [...this.eventLog]);
    }
    this.render();
  }

  private chooseOpponentCommand(): BattleCommand {
    const opponent = this.activeCreature('opponent');
    if (opponent.hp <= 0) {
      const replacement = this.state.opponent.creatures.findIndex((creature, index) => index !== this.state.opponent.activeIndex && creature.hp > 0);
      return replacement >= 0 ? { kind: 'switch', partyIndex: replacement } : { kind: 'useMove', moveSlot: 0 };
    }
    const availableMove = opponent.moves.findIndex(slot => slot.pp > 0 && this.moveCatalog[slot.moveId]);
    if (availableMove >= 0) return { kind: 'useMove', moveSlot: availableMove };
    const replacement = this.state.opponent.creatures.findIndex((creature, index) => index !== this.state.opponent.activeIndex && creature.hp > 0);
    if (replacement >= 0) return { kind: 'switch', partyIndex: replacement };
    return { kind: 'useMove', moveSlot: 0 };
  }

  private advanceMessage(): void {
    if (this.pendingMessages.length > 1) {
      this.pendingMessages.shift();
      this.render();
      return;
    }
    this.pendingMessages = [];
    if (this.state.outcome.kind !== 'ongoing') {
      if (!this.terminalShown) this.showTerminalMessage();
      else this.onDismiss?.();
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
  }

  private applyVisualEvent(event: BattleEvent): void {
    if (event.type === 'creatureSwitched') this.visualActiveIds.set(event.side, event.toId);
    const changeHp = (side: BattleSide, delta: number): void => {
      const creature = this.displayedCreature(side);
      const current = this.visualHp.get(creature.instanceId) ?? creature.hp;
      this.hpTweenFrom.set(creature.instanceId, current);
      this.visualHp.set(creature.instanceId, Phaser.Math.Clamp(current + delta, 0, creature.stats.maxHp));
    };
    if (event.type === 'damageApplied') changeHp(event.targetSide, -event.amount);
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
        if (move?.category === 'physical') {
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
      if (target && source && !this.reducedAnimations) {
        const sphere = this.add.circle(source.x, source.y - 12, 12, 0xf3e8c9).setStrokeStyle(4, 0xc78760);
        this.ui.add(sphere);
        this.tweens.add({ targets: sphere, x: target.x, y: target.y, angle: 540, duration: 480, ease: 'Quad.easeOut' });
      }
    } else if (event.type === 'creatureCaptured') {
      if (this.actors.opponent) this.floatingFeedback(this.actors.opponent, 'CATTURATO!', '#f4db9b');
    } else if (event.type === 'creatureFainted') {
      const actor = this.actors[event.side];
      if (actor && !this.reducedAnimations) this.tweens.add({ targets: actor, alpha: 0.15, y: actor.y + 12, duration: 280 });
    }
  }

  private floatingFeedback(actor: Phaser.GameObjects.Container, text: string, color: string): void {
    const feedback = this.add.text(actor.x, actor.y - 52, text, {
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
        return `${creature?.name ?? 'La creatura'} usa ${move?.name ?? event.moveId}.`;
      }
      case 'moveMissed': return 'L’attacco manca il bersaglio.';
      case 'moveFailed': return event.reason === 'noPp' ? 'Non restano PP per questa mossa.' : event.reason === 'blockedByStatus' ? 'Lo stato impedisce di agire.' : 'Non c’è un bersaglio disponibile.';
      case 'damageApplied':
        if (event.effectiveness === 0) return 'L’attacco non ha effetto.';
        if (event.effectiveness > 1) return 'Un colpo efficace!';
        if (event.effectiveness < 1) return 'Il bersaglio resiste all’attacco.';
        return event.critical ? 'Un colpo critico!' : 'Il colpo va a segno.';
      case 'statusApplied': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} ${this.statusVerb(event.status)}.`;
      case 'statusPrevented': return event.reason === 'alreadyAfflicted' ? 'La creatura ha già un problema di stato.' : 'Il tipo della creatura la protegge da questo stato.';
      case 'statusTick':
        if (event.damage) return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} subisce ${event.damage} danni dallo stato.`;
        return event.recovered ? 'La creatura si è ripresa.' : null;
      case 'creatureFainted': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} non può più continuare.`;
      case 'experienceGained': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} ottiene ${event.amount} punti esperienza.`;
      case 'levelUp': return `${this.creatureById(event.side, event.creatureId)?.name ?? 'La creatura'} sale al livello ${event.level}!`;
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
