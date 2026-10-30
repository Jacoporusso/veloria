/** Battle-domain contracts. These types deliberately have no Phaser or persistence dependency. */

export const BATTLE_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel',
] as const;

export type BattleType = typeof BATTLE_TYPES[number];
export type BattleSide = 'player' | 'opponent';
export type MoveCategory = 'physical' | 'special' | 'status';
export type DerivedBattleStat = 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';
export type BattleStat = DerivedBattleStat | 'accuracy' | 'evasion';
export type StatStages = Readonly<Partial<Record<BattleStat, number>>>;
export type MovePowerRule = 'brine' | 'targetDamaged' | 'userDamaged' | 'targetActed' | 'targetAsleep' | 'lowHp' | 'gyroBall' | 'wringOut' | 'lowKick' | 'punishment' | 'furyCutter' | 'rollout' | 'trumpCard' | 'stockpile';
export type BattleWeather = 'rain' | 'sun' | 'hail' | 'sandstorm';
export type SemiInvulnerableState = 'air' | 'underground' | 'underwater';

export type MajorStatus = 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze';
export type BattleGender = 'male' | 'female' | 'genderless';

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
  /** Gen IV bad-poison stage; resets to one when the Pokémon switches out. */
  readonly toxicCounter?: number;
}

export interface MoveDefinition {
  /** Stable content ID, e.g. `move_tackle`; never use a localized display name as an ID. */
  readonly id: string;
  readonly name: string;
  readonly type: BattleType;
  readonly category: MoveCategory;
  readonly power: number;
  readonly powerRule?: MovePowerRule;
  readonly leavesTargetAtOneHp?: boolean;
  readonly requiresSleepingTarget?: boolean;
  readonly wakesTargetIfAsleep?: boolean;
  readonly trapTarget?: { readonly minTurns: number; readonly maxTurns: number; readonly damageFraction: number };
  readonly disableLastMove?: boolean;
  readonly disableMinTurns?: number;
  readonly disableMaxTurns?: number;
  readonly tauntMinTurns?: number;
  readonly tauntMaxTurns?: number;
  readonly tauntsTarget?: boolean;
  readonly alwaysFails?: boolean;
  readonly aquaRing?: boolean;
  readonly ingrain?: boolean;
  readonly halvesElectricDamage?: boolean;
  readonly halvesFireDamage?: boolean;
  readonly mist?: boolean;
  readonly luckyChant?: boolean;
  /** Exactly two stage keys; generated JSON is checked by the battle engine before use. */
  readonly statStageSwap?: readonly string[];
  readonly copyTargetStatStages?: boolean;
  readonly clearAllStatStages?: boolean;
  readonly reduceLastMovePp?: number;
  readonly chargeElectricBoost?: boolean;
  readonly tailwind?: boolean;
  readonly weather?: BattleWeather;
  readonly screen?: 'reflect' | 'lightScreen';
  readonly protectUser?: boolean;
  readonly endureUser?: boolean;
  readonly ignoresProtection?: boolean;
  readonly rechargesNextTurn?: boolean;
  readonly chargesBeforeAttack?: boolean;
  readonly skipsChargeInSun?: boolean;
  readonly weatherHalvesPower?: boolean;
  readonly chargeDefenseBoost?: number;
  readonly breaksScreens?: boolean;
  readonly requiresFirstTurnAfterEntry?: boolean;
  readonly thawsUserIfFrozen?: boolean;
  readonly semiInvulnerableWhileCharging?: SemiInvulnerableState;
  readonly hitsSemiInvulnerable?: readonly SemiInvulnerableState[];
  readonly doublesDamageAgainstSemiInvulnerable?: boolean;
  readonly bellyDrum?: boolean;
  readonly randomStatBoost?: boolean;
  readonly preventsEscape?: boolean;
  readonly randomInflictedStatuses?: readonly MajorStatus[];
  readonly usableWhileAsleep?: boolean;
  readonly safeguard?: boolean;
  readonly inflictsDrowsiness?: boolean;
  /** Exact damage on a connected hit; only type immunity can prevent it. */
  readonly fixedDamage?: number;
  /** Return twice the last opposing hit of the selected damage category this turn. */
  readonly counterDamageCategory?: 'physical' | 'special';
  readonly foresight?: boolean;
  readonly miracleEye?: boolean;
  readonly roost?: boolean;
  readonly lockOn?: boolean;
  readonly setTargetAbility?: string;
  readonly imprison?: boolean;
  readonly lastResort?: boolean;
  readonly conversion?: boolean;
  readonly conversion2?: boolean;
  readonly camouflage?: boolean;
  readonly stockpile?: boolean;
  readonly stockpileConsumes?: boolean;
  readonly swallow?: boolean;
  readonly ignoresDamageVariance?: boolean;
  readonly damageByUserLevel?: boolean;
  readonly targetHpFraction?: number;
  readonly endeavorDamage?: boolean;
  readonly oneHitKO?: boolean;
  readonly faintUserAfterMove?: boolean;
  readonly selfDestructs?: boolean;
  readonly requiresOppositeGender?: boolean;
  readonly requiresTargetDamagingMove?: boolean;
  readonly curseMove?: boolean;
  readonly forceSwitchTarget?: boolean;
  readonly perishSong?: boolean;
  readonly hazardEffect?: 'setSpikes' | 'setToxicSpikes' | 'rapidSpin';
  readonly damageDefenseMultiplier?: number;
  readonly accuracy: number;
  readonly alwaysHits?: boolean;
  readonly priority: number;
  /** Official target class from PokéAPI (e.g. `selected-pokemon`, `user`). */
  readonly target?: string;
  readonly maxPp: number;
  readonly statChanges?: readonly { readonly target: 'self' | 'opponent'; readonly stat: BattleStat; readonly stages: number }[];
  readonly criticalStageBoost?: number;
  readonly criticalStageChange?: number;
  readonly inflictedStatus?: MajorStatus;
  readonly inflictedBadlyPoisoned?: boolean;
  readonly nightmareMove?: boolean;
  readonly mirrorMove?: boolean;
  readonly copyLastBattleMove?: boolean;
  readonly encoreTarget?: boolean;
  readonly uproar?: boolean;
  readonly destinyBond?: boolean;
  readonly grudge?: boolean;
  readonly futureSight?: boolean;
  readonly typelessDamage?: boolean;
  /** The move’s core effect needs Pokémon-held-item state, which Veloria does not model. */
  readonly requiresHeldItemContext?: boolean;
  readonly heldItemSecondaryEffect?: 'steal' | 'remove' | 'consumeBerry' | 'boostByBerry';
  readonly suppressesAbility?: boolean;
  readonly magnetRise?: boolean;
  readonly sleepTalk?: boolean;
  readonly mimic?: boolean;
  readonly metronome?: boolean;
  /** Raises Attack once when hit before the user's next action. */
  readonly rage?: boolean;
  readonly substitute?: boolean;
  readonly gravity?: boolean;
  readonly payDay?: boolean;
  readonly magicCoat?: boolean;
  readonly batonPass?: boolean;
  readonly healingWish?: boolean;
  readonly pursuit?: boolean;
  /** Gen IV Me First applies a post-damage 1.5 multiplier to the copied move. */
  readonly damageMultiplier?: number;
  readonly meFirst?: boolean;
  /** Official PokéAPI reflectable flag. */
  readonly reflectable?: boolean;
  readonly statusTarget?: 'self' | 'opponent';
  readonly requiresMissingHp?: boolean;
  readonly requiresStatusFree?: boolean;
  readonly curesUserStatuses?: readonly MajorStatus[];
  readonly curesPartyStatuses?: boolean;
  readonly curesPartyConfusion?: boolean;
  /** Rest clears a pre-existing major status before inflicting its two-turn sleep. */
  readonly replacesUserStatusWithInflictedStatus?: boolean;
  /** Selected status moves (e.g. Thunder Wave) also respect attack-type immunity. */
  readonly statusAffectedByTypeImmunity?: boolean;
  readonly statusChance?: number;
  readonly minStatusTurns?: number;
  readonly maxStatusTurns?: number;
  readonly drainPercent?: number;
  /** Percent of the user's maximum HP restored by a direct recovery move. */
  readonly healingPercent?: number;
  readonly weatherRecovery?: boolean;
  /** HGSS recoil: floor(percent of actual HP removed), minimum 1 after damage. */
  readonly recoilPercent?: number;
  /** HGSS crash rule: half the damage this move would deal, with a target-HP cap. */
  readonly crashOnMoveFailure?: boolean;
  readonly statChangeChance?: number;
  /** Chance to cancel a target's still-pending move in this turn only (0..100). */
  readonly flinchChance?: number;
  readonly minHits?: number;
  readonly maxHits?: number;
  readonly inflictedConfusionChance?: number;
  readonly minConfusionTurns?: number;
  readonly maxConfusionTurns?: number;
  readonly leechSeedFraction?: number;
  /** Teleport escapes wild battles; HGSS prevents escape from trainer battles. */
  readonly escapeBattle?: boolean;
  /** Copies the opposing active creature's battle typing, stats (except HP), stages, and moves. */
  readonly transformTarget?: boolean;
  /** Role Play copies the opposing active Pokémon's actual selected ability. */
  readonly copyTargetAbility?: boolean;
  /** Random total rampage actions before the user becomes confused. */
  readonly lockInMinTurns?: number;
  readonly lockInMaxTurns?: number;
  readonly confusesUserAfterLockIn?: boolean;
  readonly lockEndsOnMiss?: boolean;
  readonly doublesRolloutAfterDefenseCurl?: boolean;
  readonly ignoresAccuracyEvasionStages?: boolean;
  /** Official move flag: makes contact (from PokéAPI move_flag_map.csv). */
  readonly makesContact?: boolean;
  /** Official move flag: sound move (from PokéAPI move_flag_map.csv). */
  readonly soundMove?: boolean;
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
  readonly abilityId?: string;
  /** Stable battle gender derived from the official species ratio and instance ID. */
  readonly gender?: BattleGender;
  /** Battle-local original restored after Role Play ends on switch or battle end. */
  readonly abilityOriginalId?: string;
  readonly flashFireActive?: boolean;
  readonly level: number;
  readonly types: readonly BattleType[];
  readonly typeChangeOriginal?: readonly BattleType[];
  /** Species parameters retained only in the battle snapshot to recompute stats after a level-up. */
  readonly baseStats?: BattleBaseStats;
  /** Official species mass from PokéAPI, converted from hectograms to kilograms. */
  readonly weightKg?: number;
  /** Official species capture_rate; transformation does not change it. */
  readonly captureRate?: number;
  readonly growthCurveId?: string;
  readonly stats: BattleStats;
  readonly hp: number;
  readonly experience: number;
  /** Temporary stages: never persisted to a world save. */
  readonly statStages?: StatStages;
  /** Temporary critical-hit stage; volatile and reset when the creature switches. */
  readonly criticalStage?: number;
  readonly leechSeed?: { readonly sourceSide: BattleSide; readonly fraction: number; readonly moveId: string };
  /** Original battle fields restored when Transform ends on switch or battle end. */
  readonly transformOriginal?: {
    readonly types: readonly BattleType[];
    readonly typeChangeOriginal?: readonly BattleType[];
    readonly weightKg?: number;
    readonly abilityId?: string;
    readonly stats: BattleStats;
    readonly moves: readonly MoveSlot[];
    readonly statStages?: StatStages;
  };
  /** Remaining actions in an official rampage move such as Thrash; battle-only. */
  readonly lockedMoveId?: string;
  readonly lockedTurnsRemaining?: number;
  /** Turn-scoped trapping move effect on the active creature. */
  readonly trappedBy?: string;
  readonly trapTurnsRemaining?: number;
  readonly trapDamageFraction?: number;
  readonly lastUsedMoveId?: string;
  readonly lastTargetingMoveId?: string;
  readonly lastTargetedByCreatureId?: string;
  readonly foresightActive?: boolean;
  readonly miracleEyeActive?: boolean;
  /** Flying typing is absent from damage calculations through the current turn. */
  readonly roostedThisTurn?: boolean;
  readonly lockOnTargetInstanceId?: string;
  readonly lockOnTurnsRemaining?: number;
  readonly imprisonActive?: boolean;
  /** Moves selected since this creature most recently entered the field. */
  readonly usedMoveIdsThisEntry?: readonly string[];
  readonly lastDamagingMoveId?: string;
  readonly stockpileCount?: number;
  readonly stockpileDefenseGain?: number;
  readonly stockpileSpecialDefenseGain?: number;
  readonly consecutiveMoveUses?: number;
  readonly defenseCurlUsed?: boolean;
  readonly protectedThisTurn?: boolean;
  readonly endureThisTurn?: boolean;
  readonly protectionStreak?: number;
  readonly mustRecharge?: boolean;
  readonly chargingMoveId?: string;
  /** Battle turn on which this creature most recently entered; used by Fake Out. */
  readonly enteredBattleTurn?: number;
  readonly semiInvulnerableState?: SemiInvulnerableState;
  readonly escapeBlockedBy?: string;
  readonly drowsyTurnsRemaining?: number;
  readonly disabledMoveId?: string;
  readonly disableTurnsRemaining?: number;
  readonly encoredMoveId?: string;
  readonly encoreTurnsRemaining?: number;
  readonly uproarActive?: boolean;
  readonly destinyBondActive?: boolean;
  readonly grudgeActive?: boolean;
  readonly magnetRiseTurnsRemaining?: number;
  readonly mimicOriginalMoveSlot?: { readonly index: number; readonly slot: MoveSlot };
  readonly rageActive?: boolean;
  readonly substituteHp?: number;
  readonly magicCoatActive?: boolean;
  readonly tauntTurnsRemaining?: number;
  readonly aquaRingActive?: boolean;
  readonly ingrainActive?: boolean;
  readonly mudSportActive?: boolean;
  readonly waterSportActive?: boolean;
  readonly chargeElectricBoostReadyAt?: number;
  readonly status?: StatusEffect;
  /** Volatile confusion counter; battle-only and cleared on switch. */
  readonly confusionTurnsRemaining?: number;
  /** Infatuation persists until the user or source leaves the field. */
  readonly infatuatedBy?: string;
  readonly cursed?: boolean;
  readonly nightmareActive?: boolean;
  readonly perishCount?: number;
  readonly experienceYield: number;
  readonly moves: readonly MoveSlot[];
}

export interface BattleSideState {
  readonly creatures: readonly BattleCreature[];
  readonly activeIndex: number;
  readonly reflectTurnsRemaining?: number;
  readonly lightScreenTurnsRemaining?: number;
  readonly safeguardTurnsRemaining?: number;
  readonly mistTurnsRemaining?: number;
  readonly luckyChantTurnsRemaining?: number;
  readonly tailwindTurnsRemaining?: number;
  readonly spikesLayers?: number;
  readonly toxicSpikesLayers?: number;
  readonly futureSight?: { readonly turnsRemaining: number; readonly damage: number; readonly sourceCreatureId: string; readonly sourceMoveId: string };
  readonly healingWishPending?: boolean;
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
  readonly lastMoveId?: string;
  readonly weather?: { readonly kind: BattleWeather; readonly turnsRemaining: number };
  readonly gravityTurnsRemaining?: number;
  /** Cumulative battle payout awarded to the winner for Pay Day uses. */
  readonly payDayBonus?: number;
  /** Complete PRNG state. Store this with the battle snapshot to replay exactly. */
  readonly rngState: number;
  readonly player: BattleSideState;
  readonly opponent: BattleSideState;
  /** Captured creatures are kept here when the six-slot party is full. */
  readonly playerStorage: readonly BattleCreature[];
  /** XP recipients eligible for level evolution at the end of this turn. */
  readonly pendingLevelEvolutions: readonly { readonly creatureId: string; readonly previousLevel: number }[];
  readonly outcome: BattleOutcome;
}

export type BattleCommand =
  | { readonly kind: 'struggle' }
  | { readonly kind: 'useMove'; readonly moveSlot: number; readonly batonPassPartyIndex?: number }
  | { readonly kind: 'switch'; readonly partyIndex: number }
  | { readonly kind: 'useItem'; readonly itemId: string; readonly targetIndex: number }
  | { readonly kind: 'attemptCapture'; readonly itemId: string; readonly captureInstanceId: string }
  | { readonly kind: 'attemptFlee' };

export type BattleEvent =
  | { readonly type: 'commandRejected'; readonly side: BattleSide; readonly reason: 'emergencyUnavailable' | 'invalidMove' | 'noPp' | 'invalidSwitch' | 'invalidItem' | 'invalidTarget' | 'fleeForbidden' | 'captureForbidden' | 'invalidCaptureItem' | 'invalidCaptureId' | 'noCaptureTarget' | 'activeCreatureMustSwitch' | 'trapped' }
  | { readonly type: 'turnStarted'; readonly turn: number }
  | { readonly type: 'actionOrder'; readonly sides: readonly BattleSide[] }
  | { readonly type: 'moveUsed'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string }
  | { readonly type: 'moveMissed'; readonly side: BattleSide; readonly moveId: string }
  | { readonly type: 'flinched'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'moveFailed'; readonly side: BattleSide; readonly moveId: string; readonly reason: 'noPp' | 'blockedByStatus' | 'noTarget' | 'noEffect' | 'disabled' | 'taunted' | 'recharging' | 'imprisoned' }
  | { readonly type: 'imprisonApplied'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'typeChanged'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly previousTypes: readonly BattleType[]; readonly types: readonly BattleType[] }
  | { readonly type: 'damageApplied'; readonly sourceSide: BattleSide; readonly targetSide: BattleSide; readonly targetCreatureId: string; readonly moveId: string; readonly amount: number; readonly effectiveness: number; readonly critical: boolean }
  | { readonly type: 'recoilApplied'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly amount: number }
  | { readonly type: 'healingApplied'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly amount: number }
  | { readonly type: 'leechSeedApplied'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'leechSeedCured'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'leechSeedPrevented'; readonly side: BattleSide; readonly creatureId: string; readonly reason: 'immune' | 'alreadySeeded' }
  | { readonly type: 'leechSeedTick'; readonly side: BattleSide; readonly creatureId: string; readonly damage: number }
  | { readonly type: 'confusionApplied'; readonly side: BattleSide; readonly creatureId: string; readonly turns: number }
  | { readonly type: 'confusionPrevented'; readonly side: BattleSide; readonly creatureId: string; readonly reason?: 'alreadyConfused' | 'ownTempo' | 'safeguard' }
  | { readonly type: 'confusionTick'; readonly side: BattleSide; readonly creatureId: string; readonly turnsRemaining: number }
  | { readonly type: 'confusionSelfHit'; readonly side: BattleSide; readonly creatureId: string; readonly amount: number }
  | { readonly type: 'statStageChanged'; readonly side: BattleSide; readonly creatureId: string; readonly stat: BattleStat; readonly change: number; readonly stage: number }
  | { readonly type: 'statStageLimited'; readonly side: BattleSide; readonly creatureId: string; readonly stat: BattleStat; readonly stage: number }
  | { readonly type: 'hpSacrificed'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly amount: number }
  | { readonly type: 'criticalStageChanged'; readonly side: BattleSide; readonly creatureId: string; readonly stage: number }
  | { readonly type: 'statusApplied'; readonly side: BattleSide; readonly creatureId: string; readonly status: MajorStatus; readonly turns?: number }
  | { readonly type: 'statusPrevented'; readonly side: BattleSide; readonly status: MajorStatus; readonly reason: 'immune' | 'alreadyAfflicted' | 'ability' | 'safeguard' }
  | { readonly type: 'statusCured'; readonly side: BattleSide; readonly creatureId: string; readonly status: MajorStatus }
  | { readonly type: 'confusionCured'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'infatuationApplied'; readonly side: BattleSide; readonly creatureId: string; readonly sourceCreatureId: string }
  | { readonly type: 'infatuationTick'; readonly side: BattleSide; readonly creatureId: string; readonly immobilized: boolean }
  | { readonly type: 'curseApplied'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'curseTick'; readonly side: BattleSide; readonly creatureId: string; readonly damage: number }
  | { readonly type: 'nightmareApplied'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'nightmareTick'; readonly side: BattleSide; readonly creatureId: string; readonly damage: number }
  | { readonly type: 'destinyBondActivated'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'grudgeActivated'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'futureSightScheduled'; readonly side: BattleSide; readonly turnsRemaining: number }
  | { readonly type: 'futureSightHit'; readonly side: BattleSide; readonly creatureId: string; readonly damage: number }
  | { readonly type: 'perishSongApplied'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'perishSongTick'; readonly side: BattleSide; readonly creatureId: string; readonly turnsRemaining: number }
  | { readonly type: 'hazardSet'; readonly side: BattleSide; readonly hazard: 'spikes' | 'toxicSpikes'; readonly layers: number }
  | { readonly type: 'hazardCleared'; readonly side: BattleSide; readonly hazard: 'spikes' | 'toxicSpikes' }
  | { readonly type: 'entryHazardDamage'; readonly side: BattleSide; readonly creatureId: string; readonly hazard: 'spikes'; readonly damage: number }
  | { readonly type: 'trappingApplied'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly turns: number }
  | { readonly type: 'trappingTick'; readonly side: BattleSide; readonly creatureId: string; readonly damage: number; readonly turnsRemaining: number }
  | { readonly type: 'trappingEnded'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'escapeBlocked'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string }
  | { readonly type: 'moveDisabled'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly turns: number }
  | { readonly type: 'moveEncored'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly turns: number }
  | { readonly type: 'movePpReduced'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly amount: number; readonly ppRemaining: number }
  | { readonly type: 'tauntApplied'; readonly side: BattleSide; readonly creatureId: string; readonly turns: number }
  | { readonly type: 'tauntEnded'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'abilityChanged'; readonly side: BattleSide; readonly creatureId: string; readonly previousAbilityId: string; readonly abilityId: string; readonly sourceMoveId: string }
  | { readonly type: 'abilitySuppressed'; readonly side: BattleSide; readonly creatureId: string; readonly abilityId: string }
  | { readonly type: 'magnetRiseEnded'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'moveInvoked'; readonly side: BattleSide; readonly creatureId: string; readonly sourceMoveId: string; readonly moveId: string }
  | { readonly type: 'moveCopied'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string }
  | { readonly type: 'substituteCreated'; readonly side: BattleSide; readonly creatureId: string; readonly hp: number }
  | { readonly type: 'substituteDamaged'; readonly side: BattleSide; readonly creatureId: string; readonly damage: number; readonly hpRemaining: number }
  | { readonly type: 'gravityApplied'; readonly turns: number }
  | { readonly type: 'gravityEnded' }
  | { readonly type: 'payDayBonusAdded'; readonly side: BattleSide; readonly amount: number }
  | { readonly type: 'healingWishTriggered'; readonly side: BattleSide; readonly creatureId: string; readonly amount: number }
  | { readonly type: 'abilityActivated'; readonly side: BattleSide; readonly creatureId: string; readonly abilityId: string }
  | { readonly type: 'weatherApplied'; readonly weather: BattleWeather; readonly turns: number }
  | { readonly type: 'weatherEnded'; readonly weather: BattleWeather }
  | { readonly type: 'weatherTick'; readonly side: BattleSide; readonly creatureId: string; readonly damage: number; readonly weather: BattleWeather }
  | { readonly type: 'screenApplied'; readonly side: BattleSide; readonly screen: 'reflect' | 'lightScreen'; readonly turns: number }
  | { readonly type: 'screenEnded'; readonly side: BattleSide; readonly screen: 'reflect' | 'lightScreen' }
  | { readonly type: 'safeguardApplied'; readonly side: BattleSide; readonly turns: number }
  | { readonly type: 'safeguardEnded'; readonly side: BattleSide }
  | { readonly type: 'mistApplied'; readonly side: BattleSide; readonly turns: number }
  | { readonly type: 'mistEnded'; readonly side: BattleSide }
  | { readonly type: 'luckyChantApplied'; readonly side: BattleSide; readonly turns: number }
  | { readonly type: 'luckyChantEnded'; readonly side: BattleSide }
  | { readonly type: 'tailwindApplied'; readonly side: BattleSide; readonly turns: number }
  | { readonly type: 'foresightApplied'; readonly side: BattleSide; readonly creatureId: string; readonly kind: 'foresight' | 'miracleEye' }
  | { readonly type: 'lockOnApplied'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'tailwindEnded'; readonly side: BattleSide }
  | { readonly type: 'drowsinessApplied'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'drowsinessEnded'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'protectionApplied'; readonly side: BattleSide; readonly creatureId: string; readonly kind: 'protect' | 'endure' }
  | { readonly type: 'protectionFailed'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'rechargeRequired'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'rechargeConsumed'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'chargeStarted'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string }
  | { readonly type: 'statusTick'; readonly side: BattleSide; readonly creatureId: string; readonly status: MajorStatus; readonly damage?: number; readonly recovered?: boolean }
  | { readonly type: 'creatureFainted'; readonly side: BattleSide; readonly creatureId: string }
  | { readonly type: 'experienceGained'; readonly side: BattleSide; readonly creatureId: string; readonly amount: number; readonly sourceCreatureId: string }
  | { readonly type: 'moveLearned'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string }
  | { readonly type: 'moveLearningSkipped'; readonly side: BattleSide; readonly creatureId: string; readonly moveId: string; readonly reason: 'fullMoveSlots' }
  | { readonly type: 'moveReplaced'; readonly side: 'player'; readonly creatureId: string; readonly moveId: string; readonly previousMoveId: string; readonly slotIndex: number }
  | { readonly type: 'moveLearningDeclined'; readonly side: 'player'; readonly creatureId: string; readonly moveId: string }
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
