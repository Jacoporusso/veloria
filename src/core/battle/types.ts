/** Battle-domain contracts. These types deliberately have no Phaser or persistence dependency. */

export const BATTLE_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel',
] as const;

export type BattleType = typeof BATTLE_TYPES[number];
export type BattleSide = 'player' | 'opponent';
export type MoveCategory = 'physical' | 'special' | 'status';
export type MajorStatus = 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze';

export interface BattleStats {
  readonly maxHp: number;
  readonly attack: number;
  readonly defense: number;
  readonly specialAttack: number;
  readonly specialDefense: number;
  readonly speed: number;
}

export interface BattleBaseStats {
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly specialAttack: number;
  readonly specialDefense: number;
  readonly speed: number;
}

export interface StatusEffect {
  readonly status: MajorStatus;
  /** Remaining turns for sleep/freeze. Omit for persistent burn, poison, or paralysis. */
  readonly turnsRemaining?: number;
}

export interface MoveDefinition {
  /** Stable content ID, e.g. `move_tackle`; never use a localized display name as an ID. */
  readonly id: string;
  readonly name: string;
  readonly type: BattleType;
  readonly category: MoveCategory;
  readonly power: number;
  readonly accuracy: number;
  readonly priority: number;
  readonly maxPp: number;
  readonly inflictedStatus?: MajorStatus;
  readonly statusChance?: number;
}

export interface MoveSlot {
  readonly moveId: string;
  readonly pp: number;
}

export interface BattleCreature {
  /** Instance UUID, stable across save/replay. */
  readonly instanceId: string;
  /** National dex ID is numeric and stable; original test fixtures can use reserved high IDs. */
  readonly speciesId: number;
  readonly name: string;
  readonly level: number;
  readonly types: readonly BattleType[];
  /** Species parameters retained only in the battle snapshot to recompute stats after a level-up. */
  readonly baseStats?: BattleBaseStats;
  readonly growthCurveId?: string;
  readonly stats: BattleStats;
  readonly hp: number;
  readonly experience: number;
  readonly status?: StatusEffect;
  readonly experienceYield: number;
  readonly moves: readonly MoveSlot[];
}

export interface BattleSideState {
  readonly creatures: readonly BattleCreature[];
  readonly activeIndex: number;
}

export type BattleOutcome =
  | { readonly kind: 'ongoing' }
  | { readonly kind: 'won'; readonly winner: BattleSide; readonly reason: 'allFainted' }
  | { readonly kind: 'fled'; readonly side: BattleSide }
  | { readonly kind: 'captured'; readonly creatureId: string; readonly destination: 'party' | 'storage' }
  | { readonly kind: 'draw' };

export interface BattleState {
  readonly battleId: string;
  readonly rulesetId: string;
  readonly battleType: 'wild' | 'trainer';
  readonly turn: number;
  /** Complete PRNG state. Store this with the battle snapshot to replay exactly. */
  readonly rngState: number;
  readonly player: BattleSideState;
  readonly opponent: BattleSideState;
  /** Captured creatures are kept here when the six-slot party is full. */
  readonly playerStorage: readonly BattleCreature[];
  readonly outcome: BattleOutcome;
}

export type BattleCommand =
  | { readonly kind: 'useMove'; readonly moveSlot: number }
  | { readonly kind: 'switch'; readonly partyIndex: number }
  | { readonly kind: 'useItem'; readonly itemId: string; readonly targetIndex: number }
  | { readonly kind: 'attemptCapture'; readonly itemId: string; readonly captureInstanceId: string }
  | { readonly kind: 'attemptFlee' };

export type BattleEvent =
  | { readonly type: 'commandRejected'; readonly side: BattleSide; readonly reason: 'invalidMove' | 'noPp' | 'invalidSwitch' | 'invalidItem' | 'invalidTarget' | 'fleeForbidden' | 'captureForbidden' | 'invalidCaptureItem' | 'invalidCaptureId' | 'noCaptureTarget' | 'activeCreatureMustSwitch' }
  | { readonly type: 'turnStarted'; readonly turn: number }
  | { readonly type: 'actionOrder'; readonly sides: readonly BattleSide[] }
  | { readonly type: 'moveUsed'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string }
  | { readonly type: 'moveMissed'; readonly side: BattleSide; readonly moveId: string }
  | { readonly type: 'moveFailed'; readonly side: BattleSide; readonly moveId: string; readonly reason: 'noPp' | 'blockedByStatus' | 'noTarget' }
  | { readonly type: 'damageApplied'; readonly sourceSide: BattleSide; readonly targetSide: BattleSide; readonly moveId: string; readonly amount: number; readonly effectiveness: number; readonly critical: boolean }
  | { readonly type: 'statusApplied'; readonly side: BattleSide; readonly creatureId: string; readonly status: MajorStatus; readonly turns?: number }
  | { readonly type: 'statusPrevented'; readonly side: BattleSide; readonly status: MajorStatus; readonly reason: 'immune' | 'alreadyAfflicted' }
  | { readonly type: 'statusTick'; readonly side: BattleSide; readonly creatureId: string; readonly status: MajorStatus; readonly damage?: number; readonly recovered?: boolean }
  | { readonly type: 'creatureFainted'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'experienceGained'; readonly side: BattleSide; readonly creatureId: string; readonly amount: number; readonly sourceCreatureId: string }
  | { readonly type: 'levelUp'; readonly side: BattleSide; readonly creatureId: string; readonly previousLevel: number; readonly level: number }
  | { readonly type: 'creatureEvolved'; readonly side: BattleSide; readonly creatureId: string; readonly fromSpeciesId: number; readonly fromName: string; readonly toSpeciesId: number; readonly toName: string; readonly level: number }
  | { readonly type: 'creatureSwitched'; readonly side: BattleSide; readonly fromId: string; readonly toId: string }
  | { readonly type: 'itemUsed'; readonly side: BattleSide; readonly itemId: string; readonly targetId: string; readonly healed?: number }
  | { readonly type: 'captureAttempted'; readonly side: 'player'; readonly itemId: string; readonly wildCreatureId: string; readonly chance: number; readonly roll: number }
  | { readonly type: 'captureFailed'; readonly side: 'player'; readonly itemId: string; readonly wildCreatureId: string; readonly chance: number; readonly roll: number }
  | { readonly type: 'creatureCaptured'; readonly side: 'player'; readonly wildCreatureId: string; readonly creatureId: string; readonly destination: 'party' | 'storage' }
  | { readonly type: 'fleeFailed'; readonly side: BattleSide }
  | { readonly type: 'battleEnded'; readonly outcome: Exclude<BattleOutcome, { kind: 'ongoing' }> };

export interface BattleTransition {
  readonly state: BattleState;
  readonly events: readonly BattleEvent[];
}
