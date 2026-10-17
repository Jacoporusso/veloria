import Phaser from 'phaser';
import { resolveBattleTurn, type BattleCommands, type MoveCatalog } from '../../core/battle/engine.ts';
import type { BattleRules } from '../../core/battle/rules.ts';
import type { BattleCommand, BattleCreature, BattleEvent, BattleSide, BattleState } from '../../core/battle/types.ts';
import { formatBattleMoveLabel } from '../battle/format-move-label.ts';

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
}

type ViewMode = 'menu' | 'moves' | 'party' | 'items' | 'captures' | 'message';
type SelectableButton = { row: number; column: number; callback: () => void; background: Phaser.GameObjects.Rectangle };

const COLORS = {
  night: 0x111d19,
  panel: 0x172820,
  panelRaised: 0x20372e,
  line: 0x6f8368,
  paper: '#efe8d5',
  muted: '#a5b19f',
  gold: '#d6be83',
  green: 0x9eb47d,
  greenDeep: 0x566f45,
  red: 0xc66f5d,
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
  private pendingMessages: string[] = [];
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
    this.remainingInventory = data.inventory ? { ...data.inventory } : undefined;
    this.mode = 'menu';
    this.pendingMessages = [];
    this.eventLog = [];
    this.completionReported = false;
    this.terminalShown = false;
    this.captureCounter = 0;
    this.playerForcedToSwitch = false;
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
    this.ui.removeAll(true);
    this.selectableButtons = [];
    this.selectionIndex = 0;
    const width = this.scale.width;
    const height = this.scale.height;
    this.drawArena(width, height);
    this.drawCreatureInfo(this.activeCreature('opponent'), 'opponent', 18, 18, width - 36, 66);
    this.drawCreatureInfo(this.activeCreature('player'), 'player', width * 0.36, height * 0.40, width * 0.61 - 18, 72);
    this.drawCreaturePlaceholder(this.activeCreature('opponent'), width * 0.75, height * 0.28, 0.94, false);
    this.drawCreaturePlaceholder(this.activeCreature('player'), width * 0.24, height * 0.59, 1.08, true);
    this.drawPartyPips(width, height);
    this.drawMessagePanel(width, height);
    this.drawCommandPanel(width, height);
  }

  private drawArena(width: number, height: number): void {
    this.cameras.main.setBackgroundColor(COLORS.night);
    if (this.arenaTextureKey && this.textures.exists(this.arenaTextureKey)) {
      const background = this.add.image(width / 2, height / 2, this.arenaTextureKey);
      const coverScale = Math.max(width / background.width, height / background.height);
      background.setScale(coverScale);
      this.ui.add(background);
      const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x111d19, 0.22);
      this.ui.add(shade);
    } else {
      this.rect(0, 0, width, height, 0x172a22);
      this.rect(0, height * 0.47, width, height * 0.22, 0x314332);
      this.rect(0, height * 0.59, width, height * 0.12, 0x26382c);
    }
    const field = this.add.graphics();
    field.fillStyle(0x708455, 0.34);
    field.fillEllipse(width * 0.72, height * 0.43, width * 0.42, height * 0.09);
    field.fillStyle(0x819562, 0.26);
    field.fillEllipse(width * 0.25, height * 0.68, width * 0.44, height * 0.075);
    field.lineStyle(1, 0xe0d29c, 0.11);
    field.lineBetween(0, height * 0.55, width, height * 0.55);
    this.ui.add(field);
  }

  private drawCreatureInfo(creature: BattleCreature, side: BattleSide, x: number, y: number, width: number, height: number): void {
    this.panel(x, y, width, height, COLORS.panel, COLORS.line, 0.94);
    const name = this.add.text(x + 12, y + 9, `${creature.name}  Lv.${creature.level}`, {
      fontFamily: 'DM Mono, monospace', fontSize: '11px', color: COLORS.paper,
    });
    this.ui.add(name);
    const hpLabel = this.add.text(x + 12, y + 30, 'HP', { fontFamily: 'DM Mono, monospace', fontSize: '8px', color: COLORS.gold });
    this.ui.add(hpLabel);
    const barX = x + 35;
    const barY = y + 31;
    const barWidth = Math.max(42, width - 92);
    this.rect(barX, barY, barWidth, 7, 0x08140f);
    const ratio = Phaser.Math.Clamp(creature.hp / creature.stats.maxHp, 0, 1);
    const hpColor = ratio > 0.5 ? COLORS.green : ratio > 0.2 ? 0xcbb76b : COLORS.red;
    if (ratio > 0) this.rect(barX, barY, Math.max(2, barWidth * ratio), 7, hpColor);
    const hpText = this.add.text(x + width - 12, y + 29, `${creature.hp}/${creature.stats.maxHp}`, {
      fontFamily: 'DM Mono, monospace', fontSize: '8px', color: COLORS.paper,
    }).setOrigin(1, 0);
    this.ui.add(hpText);
    if (creature.status) {
      this.label(x + 12, y + height - 16, this.statusName(creature.status.status).toUpperCase(), '#c66f5d', 7);
    } else {
      this.label(x + 12, y + height - 16, side === 'opponent' ? 'INCONTRO SELVATICO' : 'LA TUA SQUADRA', COLORS.muted, 7);
    }
  }

  private drawCreaturePlaceholder(creature: BattleCreature, x: number, y: number, scale: number, isPlayer: boolean): void {
    const accent = this.typeColor(creature.types[0]);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x07110d, 0.30);
    graphics.fillEllipse(x, y + 33 * scale, 82 * scale, 18 * scale);
    graphics.fillStyle(accent, 0.22);
    graphics.fillEllipse(x, y + 9 * scale, 78 * scale, 68 * scale);
    graphics.fillStyle(accent, 0.96);
    graphics.fillEllipse(x, y, 51 * scale, 46 * scale);
    graphics.fillStyle(0xe8dfc6, 0.88);
    graphics.fillEllipse(x + (isPlayer ? 9 : -9) * scale, y - 6 * scale, 10 * scale, 11 * scale);
    graphics.fillStyle(0x22352b, 1);
    graphics.fillCircle(x + (isPlayer ? 10 : -10) * scale, y - 6 * scale, 2 * scale);
    graphics.fillStyle(accent, 0.9);
    graphics.fillRoundedRect(x - 22 * scale, y + 11 * scale, 44 * scale, 27 * scale, 10 * scale);
    graphics.fillStyle(0xd8c992, 0.9);
    graphics.fillEllipse(x, y + 15 * scale, 19 * scale, 10 * scale);
    this.ui.add(graphics);
    const creatureName = this.add.text(x, y + 52 * scale, creature.name, {
      fontFamily: 'DM Mono, monospace', fontSize: '8px', color: COLORS.paper,
      stroke: '#111d19', strokeThickness: 3,
    }).setOrigin(0.5, 0);
    this.ui.add(creatureName);
  }

  private drawPartyPips(width: number, height: number): void {
    const ownParty = this.state.player.creatures;
    const opponentParty = this.state.opponent.creatures;
    const y = height - 198;
    this.label(24, y, 'SQUADRA', COLORS.muted, 7);
    ownParty.forEach((creature, index) => this.pip(91 + index * 15, y + 4, creature.hp > 0, index === this.state.player.activeIndex));
    if (this.state.battleType === 'trainer') {
      this.label(width - 88 - opponentParty.length * 15, y, 'AVVERSARIO', COLORS.muted, 7);
      opponentParty.forEach((creature, index) => this.pip(width - 20 - index * 15, y + 4, creature.hp > 0, index === this.state.opponent.activeIndex));
    }
  }

  private drawMessagePanel(width: number, height: number): void {
    const x = 14;
    const y = height - 174;
    const panelWidth = width - 28;
    this.panel(x, y, panelWidth, 82, 0x18271f, 0x91835c, 0.96);
    const message = this.mode === 'message'
      ? this.pendingMessages[0] ?? this.outcomeMessage()
      : this.mode === 'party' && this.playerForcedToSwitch
        ? 'Scegli chi mandare in campo.'
        : 'Cosa vuoi fare?';
    const text = this.add.text(x + 14, y + 13, message, {
      fontFamily: 'Playfair Display, Georgia, serif', fontSize: '14px', color: COLORS.paper,
      wordWrap: { width: panelWidth - 28 }, lineSpacing: 3,
    });
    this.ui.add(text);
    if (this.mode === 'message') {
      const hint = this.add.text(x + panelWidth - 12, y + 66, 'A · CONTINUA', {
        fontFamily: 'DM Mono, monospace', fontSize: '7px', color: COLORS.gold,
      }).setOrigin(1, 0);
      this.ui.add(hint);
    }
  }

  private drawCommandPanel(width: number, height: number): void {
    const x = 14;
    const y = height - 95;
    const panelWidth = width - 28;
    this.panel(x, y, panelWidth, 95, 0x18271f, 0x91835c, 0.98);
    if (this.mode === 'message') {
      this.button(x, y, panelWidth, 73, 'CONTINUA', () => this.advanceMessage(), COLORS.panelRaised, true, 0, 0);
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
          ? formatBattleMoveLabel(move.name, move.type, slot.pp, move.maxPp)
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
    const buttonWidth = (width - gap * (columns - 1)) / columns;
    const buttonAreaHeight = 86;
    const buttonHeight = Math.min(43, (buttonAreaHeight - gap * (maxRows - 1)) / maxRows);
    options.slice(0, columns * maxRows).forEach((option, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const bx = x + column * (buttonWidth + gap);
      const by = y + row * (buttonHeight + gap);
      this.button(bx, by, buttonWidth, buttonHeight, option.label, option.callback, option.enabled ? COLORS.panelRaised : 0x1a241f, option.enabled, row, column);
    });
    if (this.mode !== 'menu' && !this.playerForcedToSwitch) {
      const back = this.label(x + width - 4, y + 88, 'B · INDIETRO', COLORS.muted, 7).setOrigin(1, 0);
      back.setInteractive({ useHandCursor: true }).on('pointerdown', this.back, this);
    }
  }

  private button(x: number, y: number, width: number, height: number, label: string, callback: () => void, color: number, enabled = true, row = 0, column = 0): void {
    const background = this.add.rectangle(x + width / 2, y + height / 2, width, height, color, enabled ? 1 : 0.8)
      .setStrokeStyle(1, enabled ? 0x8e9470 : 0x526052, enabled ? 0.66 : 0.25);
    if (enabled) {
      const index = this.selectableButtons.length;
      this.selectableButtons.push({ row, column, callback, background });
      background.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.selectionIndex = index;
        this.activateSelected();
      });
    }
    const text = this.add.text(x + width / 2, y + height / 2, label, {
      fontFamily: 'DM Mono, monospace', fontSize: '8px', color: enabled ? COLORS.paper : '#788477',
      align: 'center', lineSpacing: 2, wordWrap: { width: width - 12 },
    }).setOrigin(0.5);
    this.ui.add([background, text]);
    this.updateSelectionStyle();
  }

  private activateSelected(): void {
    this.selectableButtons[this.selectionIndex]?.callback();
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
      button.background.setStrokeStyle(1, index === this.selectionIndex ? 0xd6be83 : 0x8e9470, index === this.selectionIndex ? 1 : 0.66);
    });
  }

  private panel(x: number, y: number, width: number, height: number, color: number, stroke: number, alpha = 1): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(x, y, width, height, 9);
    graphics.lineStyle(1, stroke, 0.52);
    graphics.strokeRoundedRect(x, y, width, height, 9);
    this.ui.add(graphics);
  }

  private rect(x: number, y: number, width: number, height: number, color: number): void {
    this.ui.add(this.add.rectangle(x + width / 2, y + height / 2, width, height, color));
  }

  private label(x: number, y: number, text: string, color: string, size: number): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, text, { fontFamily: 'DM Mono, monospace', fontSize: `${size}px`, color, letterSpacing: 1 });
    this.ui.add(label);
    return label;
  }

  private pip(x: number, y: number, alive: boolean, active: boolean): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(alive ? (active ? 0xd6be83 : COLORS.green) : 0x37443b, 1);
    graphics.fillCircle(x, y, active ? 4 : 3);
    if (active) {
      graphics.lineStyle(1, 0xefe8d5, 0.5);
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
    this.pendingMessages = transition.events.map(event => this.describeEvent(event)).filter((message): message is string => Boolean(message));
    if (!this.pendingMessages.length) this.pendingMessages = ['Nessuna azione ha avuto effetto.'];
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
    this.render();
  }

  private showTerminalMessage(): void {
    const terminal = this.outcomeMessage();
    this.pendingMessages = [terminal];
    this.mode = 'message';
    this.terminalShown = true;
    this.render();
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
