import { EMERGENCY_MOVE_ID, EMERGENCY_MOVE_NAME, hasUsableBattleMove } from './emergency-move.ts';
import { BATTLE_STATS, MIN_STAT_STAGE, MAX_STAT_STAGE, effectiveStat, effectiveMoveAccuracy } from './stat-stages.ts';
import { effectivenessFor, experienceForDefeat, type BattleRules } from './rules.ts';
import { abilityPreventsMove, abilityPreventsTypeDamage, calculateHitDamage } from './damage.ts';
import { calculateStats } from './create-creature.ts';
import { resolveMovePower } from './move-power.ts';
import { experienceToNextLevel } from './progression.ts';
import { BATTLE_TYPES } from './types.ts';
import type {
  BattleCommand, BattleCreature, BattleEvent, BattleOutcome, BattleSide, BattleState,
  BattleTransition, MajorStatus, MoveDefinition, StatusEffect,
  BattleWeather,
} from './types.ts';

export type MoveCatalog = Readonly<Record<string, MoveDefinition>>;
export type BattleCommands = Readonly<Record<BattleSide, BattleCommand>>;

interface RandomCursor { state: number }

/** Turn-local bookkeeping, deliberately absent from battle snapshots and saves. */
interface TurnMoveContext {
  commands: BattleCommands;
  pendingCreatureIds: Set<string>;
  pendingDamagingCreatureIds: Set<string>;
  flinchedCreatureIds: Set<string>;
  actedCreatureIds: Set<string>;
  switchingCreatureIds: Set<string>;
  pursuitBoostedTargetIds: Set<string>;
}

/** Xorshift32. A zero seed is mapped to a fixed non-zero state; output is stable across runtimes. */
export function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0;
  return normalized === 0 ? 0x6d2b79f5 : normalized;
}

function random(cursor: RandomCursor): number {
  let value = cursor.state >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  cursor.state = value >>> 0;
  return cursor.state / 0x1_0000_0000;
}

function integerBetween(cursor: RandomCursor, min: number, max: number): number {
  return min + Math.floor(random(cursor) * (max - min + 1));
}

export function createBattleState(args: {
  battleId: string;
  battleType: BattleState['battleType'];
  seed: number;
  rules: BattleRules;
  playerTeam: readonly BattleCreature[];
  opponentTeam: readonly BattleCreature[];
  playerStorage?: readonly BattleCreature[];
}): BattleState {
  if (!args.battleId.trim()) throw new Error('battleId must be a stable, non-empty ID');
  validateTeam(args.playerTeam, args.rules, 'player');
  validateTeam(args.opponentTeam, args.rules, 'opponent');
  const emergency = args.rules.emergencyMove;
  if (!Number.isFinite(emergency.power) || emergency.power <= 0 || !Number.isFinite(emergency.recoilFraction) || emergency.recoilFraction <= 0 || emergency.recoilFraction > 1) {
    throw new Error('Invalid emergency move rules');
  }
  const playerIds = new Set([...args.playerTeam, ...(args.playerStorage ?? [])].map(creature => creature.instanceId));
  if (playerIds.size !== args.playerTeam.length + (args.playerStorage?.length ?? 0)) throw new Error('Player creature IDs must be unique across party and storage');
  return {
    battleId: args.battleId,
    rulesetId: args.rules.id,
    battleType: args.battleType,
    turn: 0,
    rngState: normalizeSeed(args.seed),
    player: { creatures: args.playerTeam.map((creature, index) => ({ ...cloneCreature(creature), status: creature.status ? { ...creature.status, ...(creature.status.toxicCounter === undefined ? {} : { toxicCounter: 1 }) } : undefined, abilityOriginalId: undefined, flashFireActive: undefined, statStages: undefined, criticalStage: undefined, confusionTurnsRemaining: undefined, infatuatedBy: undefined, tauntTurnsRemaining: undefined, aquaRingActive: undefined, ingrainActive: undefined, mudSportActive: undefined, waterSportActive: undefined, chargeElectricBoostReadyAt: undefined, foresightActive: undefined, miracleEyeActive: undefined, roostedThisTurn: undefined, lockOnTargetInstanceId: undefined, lockOnTurnsRemaining: undefined, imprisonActive: undefined, stockpileCount: undefined, stockpileDefenseGain: undefined, stockpileSpecialDefenseGain: undefined, leechSeed: undefined, trappedBy: undefined, trapTurnsRemaining: undefined, trapDamageFraction: undefined, disabledMoveId: undefined, disableTurnsRemaining: undefined, encoredMoveId: undefined, encoreTurnsRemaining: undefined, uproarActive: undefined, destinyBondActive: undefined, grudgeActive: undefined, magnetRiseTurnsRemaining: undefined, usedMoveIdsThisEntry: undefined, lastDamagingMoveId: undefined, lastUsedMoveId: undefined, lastTargetingMoveId: undefined, lastTargetedByCreatureId: undefined, protectedThisTurn: undefined, endureThisTurn: undefined, protectionStreak: undefined, mustRecharge: undefined, chargingMoveId: undefined, enteredBattleTurn: index === firstAvailable(args.playerTeam) ? 0 : undefined })), activeIndex: firstAvailable(args.playerTeam) },
    opponent: { creatures: args.opponentTeam.map((creature, index) => ({ ...cloneCreature(creature), status: creature.status ? { ...creature.status, ...(creature.status.toxicCounter === undefined ? {} : { toxicCounter: 1 }) } : undefined, abilityOriginalId: undefined, flashFireActive: undefined, statStages: undefined, criticalStage: undefined, confusionTurnsRemaining: undefined, infatuatedBy: undefined, tauntTurnsRemaining: undefined, aquaRingActive: undefined, ingrainActive: undefined, mudSportActive: undefined, waterSportActive: undefined, chargeElectricBoostReadyAt: undefined, foresightActive: undefined, miracleEyeActive: undefined, roostedThisTurn: undefined, lockOnTargetInstanceId: undefined, lockOnTurnsRemaining: undefined, imprisonActive: undefined, stockpileCount: undefined, stockpileDefenseGain: undefined, stockpileSpecialDefenseGain: undefined, leechSeed: undefined, trappedBy: undefined, trapTurnsRemaining: undefined, trapDamageFraction: undefined, disabledMoveId: undefined, disableTurnsRemaining: undefined, encoredMoveId: undefined, encoreTurnsRemaining: undefined, uproarActive: undefined, destinyBondActive: undefined, grudgeActive: undefined, magnetRiseTurnsRemaining: undefined, usedMoveIdsThisEntry: undefined, lastDamagingMoveId: undefined, lastUsedMoveId: undefined, lastTargetingMoveId: undefined, lastTargetedByCreatureId: undefined, protectedThisTurn: undefined, endureThisTurn: undefined, protectionStreak: undefined, mustRecharge: undefined, chargingMoveId: undefined, enteredBattleTurn: index === firstAvailable(args.opponentTeam) ? 0 : undefined })), activeIndex: firstAvailable(args.opponentTeam) },
    playerStorage: (args.playerStorage ?? []).map(creature => ({ ...cloneCreature(creature), statStages: undefined, confusionTurnsRemaining: undefined, infatuatedBy: undefined, tauntTurnsRemaining: undefined, aquaRingActive: undefined, ingrainActive: undefined, mudSportActive: undefined, waterSportActive: undefined, chargeElectricBoostReadyAt: undefined, foresightActive: undefined, miracleEyeActive: undefined, roostedThisTurn: undefined, lockOnTargetInstanceId: undefined, lockOnTurnsRemaining: undefined, imprisonActive: undefined, stockpileCount: undefined, stockpileDefenseGain: undefined, stockpileSpecialDefenseGain: undefined, leechSeed: undefined })),
    pendingLevelEvolutions: [],
    outcome: { kind: 'ongoing' },
  };
}

function validateTeam(team: readonly BattleCreature[], rules: BattleRules, side: BattleSide): void {
  if (team.length < 1 || team.length > rules.maxPartySize) throw new Error(`${side} team size is outside 1..${rules.maxPartySize}`);
  const ids = new Set<string>();
  for (const creature of team) {
    if (!creature.instanceId.trim() || ids.has(creature.instanceId)) throw new Error(`Invalid or duplicate ${side} creature ID`);
    ids.add(creature.instanceId);
    if (!Number.isInteger(creature.level) || creature.level < 1 || creature.level > rules.maxLevel) throw new Error(`Invalid level for ${creature.instanceId}`);
    if (!Number.isInteger(creature.stats.maxHp) || creature.stats.maxHp < 1 || creature.hp < 0 || creature.hp > creature.stats.maxHp) throw new Error(`Invalid HP for ${creature.instanceId}`);
    if (creature.moves.length > rules.maxMoves) throw new Error(`Too many moves for ${creature.instanceId}`);
    if (creature.moves.some(slot => !Number.isInteger(slot.pp) || slot.pp < 0)) throw new Error(`Invalid PP for ${creature.instanceId}`);
    if (creature.experience < 0 || creature.experienceYield < 0) throw new Error(`Invalid experience for ${creature.instanceId}`);
    validateMajorStatus(creature.status, creature.instanceId);
  }
  if (team.every(creature => creature.hp === 0)) throw new Error(`${side} team needs at least one conscious creature`);
}

function validateMajorStatus(status: StatusEffect | undefined, instanceId: string): void {
  if (!status) return;
  const knownStatuses: readonly MajorStatus[] = ['burn', 'poison', 'paralysis', 'sleep', 'freeze'];
  const timed = status.status === 'sleep' || status.status === 'freeze';
  if (!knownStatuses.includes(status.status) ||
      (status.turnsRemaining !== undefined && (!Number.isInteger(status.turnsRemaining) || status.turnsRemaining < 1)) ||
      (status.status === 'sleep' && status.turnsRemaining === undefined) ||
      (!timed && status.turnsRemaining !== undefined)) {
    throw new Error(`Invalid major status for ${instanceId}`);
  }
}

function cloneCreature(creature: BattleCreature): BattleCreature {
  return { ...creature, types: [...creature.types], typeChangeOriginal: creature.typeChangeOriginal ? [...creature.typeChangeOriginal] : undefined, baseStats: creature.baseStats ? { ...creature.baseStats } : undefined, stats: { ...creature.stats }, leechSeed: creature.leechSeed ? { ...creature.leechSeed } : undefined, mimicOriginalMoveSlot: creature.mimicOriginalMoveSlot ? { index: creature.mimicOriginalMoveSlot.index, slot: { ...creature.mimicOriginalMoveSlot.slot } } : undefined, transformOriginal: creature.transformOriginal ? { types: [...creature.transformOriginal.types], typeChangeOriginal: creature.transformOriginal.typeChangeOriginal ? [...creature.transformOriginal.typeChangeOriginal] : undefined, weightKg: creature.transformOriginal.weightKg, abilityId: creature.transformOriginal.abilityId, stats: { ...creature.transformOriginal.stats }, moves: creature.transformOriginal.moves.map(move => ({ ...move })), statStages: creature.transformOriginal.statStages ? { ...creature.transformOriginal.statStages } : undefined } : undefined, statStages: creature.statStages ? { ...creature.statStages } : undefined, moves: creature.moves.map(move => ({ ...move })), status: creature.status ? { ...creature.status } : undefined };
}

function restoreTransform(creature: BattleCreature): BattleCreature {
  const original = creature.transformOriginal;
  return original ? { ...creature, types: [...original.types], typeChangeOriginal: original.typeChangeOriginal ? [...original.typeChangeOriginal] : undefined, weightKg: original.weightKg, abilityId: original.abilityId, stats: { ...original.stats }, moves: original.moves.map(move => ({ ...move })), statStages: original.statStages ? { ...original.statStages } : undefined, transformOriginal: undefined } : creature;
}

function restoreTypeChange(creature: BattleCreature): BattleCreature {
  return creature.typeChangeOriginal ? { ...creature, types: [...creature.typeChangeOriginal], typeChangeOriginal: undefined } : creature;
}

function restoreMimic(creature: BattleCreature): BattleCreature {
  const original = creature.mimicOriginalMoveSlot;
  if (!original) return creature;
  const moves = [...creature.moves];
  moves[original.index] = { ...original.slot };
  return { ...creature, moves, mimicOriginalMoveSlot: undefined };
}

function firstAvailable(team: readonly BattleCreature[]): number {
  const index = team.findIndex(creature => creature.hp > 0);
  return index < 0 ? 0 : index;
}

function sideState(state: BattleState, side: BattleSide) { return state[side]; }
function active(state: BattleState, side: BattleSide): BattleCreature { return sideState(state, side).creatures[sideState(state, side).activeIndex]; }
function otherSide(side: BattleSide): BattleSide { return side === 'player' ? 'opponent' : 'player'; }

function setCreature(state: BattleState, side: BattleSide, index: number, creature: BattleCreature): BattleState {
  const sideValue = sideState(state, side);
  return { ...state, [side]: { ...sideValue, creatures: sideValue.creatures.map((item, i) => i === index ? creature : item) } };
}

function reject(state: BattleState, side: BattleSide, reason: Extract<BattleEvent, { type: 'commandRejected' }>['reason']): BattleTransition {
  return { state, events: [{ type: 'commandRejected', side, reason }] };
}

function validateCommand(state: BattleState, side: BattleSide, command: BattleCommand, catalog: MoveCatalog, rules: BattleRules): BattleTransition | null {
  const own = sideState(state, side);
  const current = active(state, side);
  const encoreSlot = current.encoredMoveId ? current.moves.find(slot => slot.moveId === current.encoredMoveId) : undefined;
  if (command.kind !== 'switch' && encoreSlot && encoreSlot.pp > 0 &&
      (command.kind !== 'useMove' || current.moves[command.moveSlot]?.moveId !== current.encoredMoveId)) return reject(state, side, 'invalidMove');
  if (current.hp > 0 && command.kind === 'switch' && (current.ingrainActive ||
      (active(state, otherSide(side)).abilityId === 'magnet-pull' && current.types.includes('steel')))) return reject(state, side, 'trapped');
      if (current.hp > 0 && ((current.trapTurnsRemaining && current.trapTurnsRemaining > 0) || current.escapeBlockedBy) && command.kind === 'attemptFlee') return reject(state, side, 'trapped');
  if (current.hp > 0 && (current.lockedMoveId || current.chargingMoveId)) {
    const forcedMoveId = current.lockedMoveId ?? current.chargingMoveId!;
    if (!current.moves.some(slot => slot.moveId === forcedMoveId) || !catalog[forcedMoveId]) return reject(state, side, 'invalidMove');
    if (current.lockedMoveId) return null;
    if (command.kind === 'switch') {
      const target = own.creatures[command.partyIndex];
      if (!target || command.partyIndex === own.activeIndex || target.hp <= 0) return reject(state, side, 'invalidSwitch');
      return null;
    }
    if (command.kind === 'useMove' && (!current.moves[command.moveSlot] || !catalog[current.moves[command.moveSlot].moveId])) return reject(state, side, 'invalidMove');
    if (command.kind === 'struggle' || command.kind === 'useItem' || command.kind === 'attemptCapture' || command.kind === 'attemptFlee') return reject(state, side, 'invalidMove');
    return null;
  }
  if (command.kind === 'switch') {
    if ((current.trapTurnsRemaining && current.trapTurnsRemaining > 0) || current.escapeBlockedBy) return reject(state, side, 'trapped');
    const target = own.creatures[command.partyIndex];
    if (!target || command.partyIndex === own.activeIndex || target.hp <= 0) return reject(state, side, 'invalidSwitch');
    return null;
  }
  if (current.hp <= 0) return reject(state, side, 'activeCreatureMustSwitch');
  if (command.kind === 'struggle') {
    if (hasUsableBattleMove(current, catalog)) return reject(state, side, 'emergencyUnavailable');
  } else if (command.kind === 'useMove') {
    const slot = current.moves[command.moveSlot];
    if (!slot || !catalog[slot.moveId]) return reject(state, side, 'invalidMove');
    if (catalog[slot.moveId].batonPass) {
      const target = own.creatures[command.batonPassPartyIndex ?? -1];
      if (!target || command.batonPassPartyIndex === own.activeIndex || target.hp <= 0) return reject(state, side, 'invalidSwitch');
    } else if (command.batonPassPartyIndex !== undefined) return reject(state, side, 'invalidMove');
  } else if (command.kind === 'useItem') {
    const target = own.creatures[command.targetIndex];
    if (!rules.items[command.itemId]) return reject(state, side, 'invalidItem');
    if (!target || target.hp <= 0) return reject(state, side, 'invalidTarget');
  } else if (command.kind === 'attemptCapture') {
    if (side !== 'player' || state.battleType !== 'wild') return reject(state, side, 'captureForbidden');
    if (!rules.captureItems[command.itemId]) return reject(state, side, 'invalidCaptureItem');
    if (!command.captureInstanceId.trim() || [...state.player.creatures, ...state.playerStorage, ...state.opponent.creatures].some(creature => creature.instanceId === command.captureInstanceId)) {
      return reject(state, side, 'invalidCaptureId');
    }
    if (active(state, 'opponent').hp <= 0) return reject(state, side, 'noCaptureTarget');
  } else if (command.kind === 'attemptFlee' && state.battleType !== 'wild') {
    return reject(state, side, 'fleeForbidden');
  }
  return null;
}

function commandPriority(state: BattleState, side: BattleSide, command: BattleCommand, otherCommand: BattleCommand, catalog: MoveCatalog): number {
  const lockedMove = active(state, side).lockedMoveId ?? (command.kind === 'useMove' ? active(state, side).chargingMoveId : undefined);
  if (lockedMove) return catalog[lockedMove]?.priority ?? 0;
  if (active(state, side).mustRecharge) return 0;
  if (command.kind === 'useMove') {
    const moveId = active(state, side).moves[command.moveSlot]?.moveId;
    const move = moveId ? catalog[moveId] : undefined;
    if (move?.pursuit && otherCommand.kind === 'switch') return 7;
    return move?.priority ?? 0;
  }
  return command.kind === 'struggle' ? 0 : command.kind === 'attemptFlee' ? 7 : 6;
}

/** Resolve one complete turn without mutating the input snapshot or any caller-owned data. */
export function resolveBattleTurn(
  input: BattleState,
  commands: BattleCommands,
  catalog: MoveCatalog,
  rules: BattleRules,
): BattleTransition {
  if (input.rulesetId !== rules.id) throw new Error(`Battle ruleset mismatch: ${input.rulesetId} != ${rules.id}`);
  if (input.outcome.kind !== 'ongoing') return { state: input, events: [] };
  const replacements = (['player', 'opponent'] as const).filter(side => active(input, side).hp <= 0);
  if (replacements.length) {
    // Replacing a fainted creature is a separate phase, not another attack turn.
    for (const side of replacements) {
      const invalid = validateCommand(input, side, commands[side], catalog, rules);
      if (invalid) return invalid;
    }
    const events: BattleEvent[] = [];
    let state = input;
    for (const side of replacements) {
      const command = commands[side];
      if (command.kind === 'switch') state = applySwitch(state, side, command, events, rules);
    }
    state = checkForWinner(state, events);
    return { state, events };
  }
  for (const side of ['player', 'opponent'] as const) {
    const invalid = validateCommand(input, side, commands[side], catalog, rules);
    if (invalid) return invalid;
  }

  const cursor: RandomCursor = { state: normalizeSeed(input.rngState) };
  const events: BattleEvent[] = [{ type: 'turnStarted', turn: input.turn + 1 }];
  const sides = (['player', 'opponent'] as const).map(side => ({
    side,
    priority: commandPriority(input, side, commands[side], commands[otherSide(side)], catalog),
    speed: effectiveSpeed(active(input, side), (sideState(input, side).tailwindTurnsRemaining ?? 0) > 0, input.weather?.kind),
    tieRoll: random(cursor),
  })).sort((a, b) => b.priority - a.priority || b.speed - a.speed || a.tieRoll - b.tieRoll).map(item => item.side);
  events.push({ type: 'actionOrder', sides });
  let state: BattleState = {
    ...input,
    rngState: cursor.state,
    turn: input.turn + 1,
    player: { ...input.player, creatures: input.player.creatures.map(creature => ({ ...creature, protectedThisTurn: undefined, endureThisTurn: undefined, magicCoatActive: undefined })) },
    opponent: { ...input.opponent, creatures: input.opponent.creatures.map(creature => ({ ...creature, protectedThisTurn: undefined, endureThisTurn: undefined, magicCoatActive: undefined })) },
  };
  for (const side of ['player', 'opponent'] as const) {
    if (active(state, side).enteredBattleTurn === input.turn) state = applyEntryAbility(state, side, events);
  }
  const moveContext: TurnMoveContext = {
    commands,
    pendingCreatureIds: new Set(sides.filter(side => active(input, side).lockedMoveId || active(input, side).chargingMoveId || commands[side].kind === 'useMove' || commands[side].kind === 'struggle').map(side => active(input, side).instanceId)),
    pendingDamagingCreatureIds: new Set(sides.filter(side => {
      const creature = active(input, side);
      const command = commands[side];
      const lockedMove = creature.lockedMoveId ?? (command.kind === 'useMove' ? creature.chargingMoveId : undefined);
      const moveId = lockedMove ?? (command.kind === 'useMove' ? creature.moves[command.moveSlot]?.moveId : command.kind === 'struggle' ? EMERGENCY_MOVE_ID : undefined);
      return moveId !== undefined && (moveId === EMERGENCY_MOVE_ID || catalog[moveId]?.category !== 'status');
    }).map(side => active(input, side).instanceId)),
    flinchedCreatureIds: new Set(),
    actedCreatureIds: new Set(),
    switchingCreatureIds: new Set((['player', 'opponent'] as const).filter(side => {
      const command = commands[side];
      return command.kind === 'switch';
    }).map(side => active(input, side).instanceId)),
    pursuitBoostedTargetIds: new Set(),
  };

  for (const side of sides) {
    if (state.outcome.kind !== 'ongoing') break;
    const actingCreatureId = active(state, side).instanceId;
    if (moveContext.actedCreatureIds.has(actingCreatureId)) continue;
    if ((commands[side].kind === 'useMove' || commands[side].kind === 'struggle') && actingCreatureId !== active(input, side).instanceId) continue;
    const lockedMoveId = active(state, side).lockedMoveId ?? (commands[side].kind === 'useMove' ? active(state, side).chargingMoveId : undefined);
    const forcedSlot = lockedMoveId ? active(state, side).moves.findIndex(slot => slot.moveId === lockedMoveId) : -1;
    const command = forcedSlot >= 0 ? { kind: 'useMove' as const, moveSlot: forcedSlot } : commands[side];
    moveContext.pendingCreatureIds.delete(active(state, side).instanceId);
    moveContext.pendingDamagingCreatureIds.delete(active(state, side).instanceId);
    if (command.kind === 'switch') {
      state = applySwitch(state, side, command, events, rules);
    } else if (command.kind === 'attemptFlee') {
      if ((state.battleType === 'wild' && active(state, side).abilityId === 'run-away') || random(cursor) < rules.fleeBaseChance) {
        state = endBattle(state, { kind: 'fled', side }, events);
      } else events.push({ type: 'fleeFailed', side });
    } else if (command.kind === 'attemptCapture') {
      state = applyCapture(state, command, rules, cursor, events);
    } else if (command.kind === 'useItem') {
      state = applyItem(state, side, command, rules, events);
    } else {
      state = applyMove(state, side, command, catalog, rules, cursor, events, moveContext);
    }
    moveContext.actedCreatureIds.add(actingCreatureId);
    state = checkForWinner(state, events);
  }

  // Residual effects from both active creatures resolve after both chosen actions.
  const residualSides = [...sides].sort((a, b) => effectiveSpeed(active(state, b), (sideState(state, b).tailwindTurnsRemaining ?? 0) > 0, state.weather?.kind) - effectiveSpeed(active(state, a), (sideState(state, a).tailwindTurnsRemaining ?? 0) > 0, state.weather?.kind));
  for (const side of residualSides) {
    if (state.outcome.kind !== 'ongoing') break;
    state = applyLeechSeed(state, side, rules, events);
    state = applyTrappingResidual(state, side, rules, events);
    state = checkForWinner(state, events);
  }
  for (const side of ['player', 'opponent'] as const) {
    if (state.outcome.kind !== 'ongoing') break;
    state = applyDrowsiness(state, side, cursor, rules, events);
    state = applyResidual(state, side, rules, events);
    state = applyShedSkin(state, side, cursor, events);
    state = applyCurseResidual(state, side, events);
    state = applyWeatherResidual(state, side, rules, events);
    state = checkForWinner(state, events);
  }
  if (state.outcome.kind === 'ongoing') {
    for (const side of ['player', 'opponent'] as const) state = applyPerishSongResidual(state, side, events);
    for (const side of ['player', 'opponent'] as const) state = applyFutureSightResidual(state, side, rules, events);
    state = checkForWinner(state, events);
  }
  state = advanceFieldEffects(state, events);
  state = finalizeLevelEvolutions({ ...state, rngState: cursor.state }, rules, events);
  return { state, events };
}

function applyCapture(
  state: BattleState,
  command: Extract<BattleCommand, { kind: 'attemptCapture' }>,
  rules: BattleRules,
  cursor: RandomCursor,
  events: BattleEvent[],
): BattleState {
  const target = active(state, 'opponent');
  const item = rules.captureItems[command.itemId];
  const missingHp = 1 - target.hp / target.stats.maxHp;
  const chance = Math.max(0, Math.min(1, item.baseChance + (item.missingHpBonus ?? 0) * missingHp + (target.status ? item.statusBonus ?? 0 : 0)));
  const roll = random(cursor);
  events.push({ type: 'captureAttempted', side: 'player', itemId: command.itemId, wildCreatureId: target.instanceId, chance, roll });
  if (roll >= chance) {
    events.push({ type: 'captureFailed', side: 'player', itemId: command.itemId, wildCreatureId: target.instanceId, chance, roll });
    return state;
  }

  const destination = state.player.creatures.length < rules.maxPartySize ? 'party' : 'storage';
  const captured: BattleCreature = { ...cloneCreature(restoreTransform(target)), instanceId: command.captureInstanceId, abilityId: target.abilityOriginalId ?? target.abilityId, abilityOriginalId: undefined, statStages: undefined, confusionTurnsRemaining: undefined, infatuatedBy: undefined, tauntTurnsRemaining: undefined, aquaRingActive: undefined, ingrainActive: undefined, mudSportActive: undefined, waterSportActive: undefined, chargeElectricBoostReadyAt: undefined, foresightActive: undefined, miracleEyeActive: undefined, roostedThisTurn: undefined, lockOnTargetInstanceId: undefined, lockOnTurnsRemaining: undefined, imprisonActive: undefined, stockpileCount: undefined, stockpileDefenseGain: undefined, stockpileSpecialDefenseGain: undefined, leechSeed: undefined, cursed: undefined, nightmareActive: undefined, perishCount: undefined, transformOriginal: undefined };
  const capturedState = destination === 'party'
    ? { ...state, player: { ...state.player, creatures: [...state.player.creatures, captured] } }
    : { ...state, playerStorage: [...state.playerStorage, captured] };
  events.push({ type: 'creatureCaptured', side: 'player', wildCreatureId: target.instanceId, creatureId: captured.instanceId, destination });
  return endBattle(capturedState, { kind: 'captured', creatureId: captured.instanceId, destination }, events);
}

function effectiveSpeed(creature: BattleCreature, tailwind = false, weather?: BattleWeather): number {
  const speed = creature.status?.status === 'paralysis' ? Math.floor(effectiveStat(creature, 'speed') / 4) : effectiveStat(creature, 'speed');
  const weatherBoost = weather === 'sun' && creature.abilityId === 'chlorophyll' || weather === 'rain' && creature.abilityId === 'swift-swim';
  return Math.max(1, Math.floor(speed * (tailwind ? 2 : 1) * (weatherBoost ? 2 : 1)));
}

function applySwitch(state: BattleState, side: BattleSide, command: Extract<BattleCommand, { kind: 'switch' }>, events: BattleEvent[], rules: BattleRules, forced = false, batonPass?: { readonly volatile: Partial<BattleCreature>; readonly suppressAbility: boolean }): BattleState {
  const oldCreature = active(state, side);
  const newCreature = sideState(state, side).creatures[command.partyIndex];
  events.push({ type: 'creatureSwitched', side, fromId: oldCreature.instanceId, toId: newCreature.instanceId });
  let switched: BattleState = { ...state, [side]: { ...sideState(state, side), activeIndex: command.partyIndex,
    creatures: sideState(state, side).creatures.map((creature, index) =>
      index === sideState(state, side).activeIndex || index === command.partyIndex
        ? { ...restoreTypeChange(restoreTransform(restoreMimic(creature))), abilityId: creature.abilityOriginalId ?? creature.abilityId, abilityOriginalId: undefined, flashFireActive: undefined, status: index === sideState(state, side).activeIndex && creature.abilityId === 'natural-cure' ? undefined : index === sideState(state, side).activeIndex && creature.status?.toxicCounter !== undefined ? { ...creature.status, toxicCounter: 1 } : creature.status, statStages: undefined, criticalStage: undefined, confusionTurnsRemaining: undefined, infatuatedBy: undefined, cursed: undefined, nightmareActive: undefined, perishCount: undefined, drowsyTurnsRemaining: undefined, tauntTurnsRemaining: undefined, aquaRingActive: undefined, ingrainActive: undefined, mudSportActive: undefined, waterSportActive: undefined, chargeElectricBoostReadyAt: undefined, foresightActive: undefined, miracleEyeActive: undefined, roostedThisTurn: undefined, lockOnTargetInstanceId: undefined, lockOnTurnsRemaining: undefined, imprisonActive: undefined, stockpileCount: undefined, stockpileDefenseGain: undefined, stockpileSpecialDefenseGain: undefined, defenseCurlUsed: undefined, leechSeed: undefined, substituteHp: undefined, magicCoatActive: undefined, lockedMoveId: undefined, lockedTurnsRemaining: undefined, chargingMoveId: undefined, semiInvulnerableState: undefined, escapeBlockedBy: undefined, enteredBattleTurn: index === command.partyIndex ? state.turn : creature.enteredBattleTurn, trappedBy: undefined, trapTurnsRemaining: undefined, trapDamageFraction: undefined, disabledMoveId: undefined, disableTurnsRemaining: undefined, encoredMoveId: undefined, encoreTurnsRemaining: undefined, uproarActive: undefined, destinyBondActive: undefined, grudgeActive: undefined, magnetRiseTurnsRemaining: undefined, usedMoveIdsThisEntry: undefined, lastDamagingMoveId: undefined, lastUsedMoveId: undefined, lastTargetingMoveId: undefined, lastTargetedByCreatureId: undefined, consecutiveMoveUses: undefined, protectedThisTurn: undefined, endureThisTurn: undefined, protectionStreak: undefined, mustRecharge: undefined } : creature),
  } };
  if (batonPass) {
    const incoming = active(switched, side);
    switched = setCreature(switched, side, sideState(switched, side).activeIndex, {
      ...incoming, ...batonPass.volatile,
      abilityId: batonPass.suppressAbility ? undefined : incoming.abilityId,
      abilityOriginalId: batonPass.suppressAbility ? incoming.abilityId : undefined,
    });
    const target = active(switched, otherSide(side));
    if (target.lockOnTargetInstanceId === oldCreature.instanceId) {
      switched = setCreature(switched, otherSide(side), sideState(switched, otherSide(side)).activeIndex,
        { ...target, lockOnTargetInstanceId: newCreature.instanceId });
    }
  }
  const foeSide = otherSide(side);
  const foe = active(switched, foeSide);
  if (foe.trappedBy === oldCreature.instanceId) switched = setCreature(switched, foeSide, sideState(switched, foeSide).activeIndex, { ...foe, trappedBy: undefined, trapTurnsRemaining: undefined, trapDamageFraction: undefined });
  const currentFoe = active(switched, foeSide);
  if (currentFoe.escapeBlockedBy === oldCreature.instanceId) switched = setCreature(switched, foeSide, sideState(switched, foeSide).activeIndex, { ...currentFoe, escapeBlockedBy: undefined });
  const activeAfterSwitch = active(switched, side);
  if (activeAfterSwitch.infatuatedBy) switched = setCreature(switched, side, sideState(switched, side).activeIndex, { ...activeAfterSwitch, infatuatedBy: undefined });
  const foeAfterSwitch = active(switched, foeSide);
  if (foeAfterSwitch.infatuatedBy === oldCreature.instanceId) switched = setCreature(switched, foeSide, sideState(switched, foeSide).activeIndex, { ...foeAfterSwitch, infatuatedBy: undefined });
  switched = applyEntryHazards(switched, side, forced, rules, events);
  switched = applyEntryAbility(switched, side, events);
  if (sideState(switched, side).healingWishPending && active(switched, side).hp > 0) {
    const healed = active(switched, side);
    const amount = healed.stats.maxHp - healed.hp;
    state = setCreature(switched, side, sideState(switched, side).activeIndex, { ...healed, hp: healed.stats.maxHp, status: undefined });
    state = { ...state, [side]: { ...sideState(state, side), healingWishPending: undefined } };
    events.push({ type: 'healingWishTriggered', side, creatureId: healed.instanceId, amount });
    switched = state;
  } else if (sideState(switched, side).healingWishPending && active(switched, side).hp === 0) {
    // The wish remains available if a switch-in effect immediately knocks out this replacement.
  }
  return switched;
}

function applyEntryHazards(state: BattleState, side: BattleSide, forced: boolean, rules: BattleRules, events: BattleEvent[]): BattleState {
  const target = active(state, side);
  if (target.hp <= 0) return state;
  const field = sideState(state, side);
  const grounded = Boolean(target.ingrainActive) || Boolean((state.gravityTurnsRemaining ?? 0) > 0) || (!target.types.includes('flying') && target.abilityId !== 'levitate' && (target.magnetRiseTurnsRemaining ?? 0) <= 0);
  if (grounded && field.spikesLayers) {
    const fraction = field.spikesLayers === 1 ? 1 / 8 : field.spikesLayers === 2 ? 3 / 16 : 1 / 4;
    const damage = Math.min(target.hp, Math.max(1, Math.floor(target.stats.maxHp * fraction)));
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp: target.hp - damage });
    events.push({ type: 'entryHazardDamage', side, creatureId: target.instanceId, hazard: 'spikes', damage });
    if (target.hp === damage) events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
  }
  if (!grounded || !field.toxicSpikesLayers || target.hp <= 0) return state;
  if (target.types.includes('poison')) {
    state = { ...state, [side]: { ...sideState(state, side), toxicSpikesLayers: undefined } };
    events.push({ type: 'hazardCleared', side, hazard: 'toxicSpikes' });
    return state;
  }
  const cursor: RandomCursor = { state: state.rngState };
  return applyStatus(state, side, active(state, side), 'poison', cursor, rules, events,
    undefined, forced, field.toxicSpikesLayers > 1 ? 1 : undefined);
}

function applyEntryAbility(state: BattleState, side: BattleSide, events: BattleEvent[]): BattleState {
  let entrant = active(state, side);
  if (entrant.hp <= 0) return state;
  if (entrant.abilityId === 'trace') {
    const opposing = active(state, otherSide(side));
    if (opposing.hp > 0 && opposing.abilityId && opposing.abilityId !== 'trace') {
      entrant = { ...entrant, abilityOriginalId: entrant.abilityOriginalId ?? entrant.abilityId, abilityId: opposing.abilityId };
      state = setCreature(state, side, sideState(state, side).activeIndex, entrant);
      events.push({ type: 'abilityActivated', side, creatureId: entrant.instanceId, abilityId: 'trace' });
    }
  }
  if (entrant.abilityId !== 'intimidate') return state;
  events.push({ type: 'abilityActivated', side, creatureId: entrant.instanceId, abilityId: 'intimidate' });
  const foeSide = otherSide(side);
  const foe = active(state, foeSide);
  if (foe.hp <= 0) return state;
  if ((sideState(state, foeSide).mistTurnsRemaining ?? 0) > 0) return state;
  if (foe.abilityId === 'clear-body' || foe.abilityId === 'hyper-cutter') {
    events.push({ type: 'statStageLimited', side: foeSide, creatureId: foe.instanceId, stat: 'attack', stage: foe.statStages?.attack ?? 0 });
    return state;
  }
  const previous = foe.statStages?.attack ?? 0;
  const stage = Math.max(MIN_STAT_STAGE, previous - 1);
  if (stage === previous) events.push({ type: 'statStageLimited', side: foeSide, creatureId: foe.instanceId, stat: 'attack', stage });
  else {
    state = setCreature(state, foeSide, sideState(state, foeSide).activeIndex, { ...foe, statStages: { ...foe.statStages, attack: stage } });
    events.push({ type: 'statStageChanged', side: foeSide, creatureId: foe.instanceId, stat: 'attack', change: -1, stage });
  }
  return state;
}

function applyItem(state: BattleState, side: BattleSide, command: Extract<BattleCommand, { kind: 'useItem' }>, rules: BattleRules, events: BattleEvent[]): BattleState {
  const item = rules.items[command.itemId];
  const target = sideState(state, side).creatures[command.targetIndex];
  const heal = Math.min(item.healHp ?? 0, target.stats.maxHp - target.hp);
  let status = target.status;
  if (status && item.cures?.includes(status.status)) status = undefined;
  const updated = { ...target, hp: target.hp + heal, status };
  events.push({ type: 'itemUsed', side, itemId: command.itemId, targetId: target.instanceId, healed: heal });
  return setCreature(state, side, command.targetIndex, updated);
}

/** Sleep and freeze progress before flinch; confusion and paralysis are later checks. */
function checkSleepAndFreeze(state: BattleState, side: BattleSide, cursor: RandomCursor, rules: BattleRules, events: BattleEvent[], usableWhileAsleep = false): { state: BattleState; canAct: boolean } {
  const creature = active(state, side);
  const status = creature.status;
  if (!status) return { state, canAct: true };
  if (status.status === 'sleep') {
    const turnsRemaining = Math.max(0, (status.turnsRemaining ?? 1) - 1);
    const recovered = turnsRemaining === 0;
    events.push({ type: 'statusTick', side, creatureId: creature.instanceId, status: 'sleep', recovered });
    const nextStatus = recovered ? undefined : { ...status, turnsRemaining };
    const next = setCreature(state, side, sideState(state, side).activeIndex, { ...creature, status: nextStatus });
    return { state: next, canAct: recovered || usableWhileAsleep };
  }
  if (status.status === 'freeze') {
    if (random(cursor) < rules.freezeThawChance) {
      const next = setCreature(state, side, sideState(state, side).activeIndex, { ...creature, status: undefined });
      events.push({ type: 'statusTick', side, creatureId: creature.instanceId, status: 'freeze', recovered: true });
      return { state: next, canAct: true };
    }
    const turnsRemaining = status.turnsRemaining === undefined ? undefined : Math.max(0, status.turnsRemaining - 1);
    const recovered = turnsRemaining === 0;
    const nextStatus: StatusEffect | undefined = recovered ? undefined : { ...status, turnsRemaining };
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...creature, status: nextStatus });
    events.push({ type: 'statusTick', side, creatureId: creature.instanceId, status: 'freeze', recovered });
    return { state, canAct: false };
  }
  return { state, canAct: true };
}

function applyCrashDamage(state: BattleState, side: BattleSide, targetSide: BattleSide, move: MoveDefinition, damageMove: MoveDefinition,
  rules: BattleRules, cursor: RandomCursor, events: BattleEvent[]): BattleState {
  if (!move.crashOnMoveFailure) return state;
  const user = active(state, side);
  if (user.hp <= 0) return state;
  const target = active(state, targetSide);
  const variance = rules.minimumDamageVariance + random(cursor) * (rules.maximumDamageVariance - rules.minimumDamageVariance);
  const targetField = sideState(state, targetSide);
  const screenUp = damageMove.category === 'physical' ? targetField.reflectTurnsRemaining : targetField.lightScreenTurnsRemaining;
  const fieldPowerMultiplier = typeFieldPowerMultiplier(state, damageMove.type);
  const wouldDamage = calculateHitDamage(user, target, damageMove, rules, {
    critical: false, variance, weather: state.weather?.kind, screenMultiplier: screenUp ? 0.5 : 1, fieldPowerMultiplier,
    gravityActive: (state.gravityTurnsRemaining ?? 0) > 0,
  }).amount;
  // PokeAPI's current prose is post-Gen-IV. Its effect_changes cache records the old 1-HP rule through Gen II and the newer half-max-HP rule beginning Black/White; HGSS uses the Gen-IV calculated-damage crash behavior (Showdown data/mods/gen4/moves.ts, highjumpkick/jumpkick onMoveFail).
  const crashBasis = wouldDamage || target.stats.maxHp;
  const amount = Math.max(1, Math.min(Math.floor(target.stats.maxHp / 2), Math.floor(crashBasis / 2)));
  const hp = Math.max(0, user.hp - amount);
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...user, hp });
  events.push({ type: 'recoilApplied', side, creatureId: user.instanceId, moveId: move.id, amount: user.hp - hp });
  if (hp === 0) {
    events.push({ type: 'creatureFainted', side, creatureId: user.instanceId });
    const other = active(state, otherSide(side));
    if (other.hp > 0) state = awardExperience(state, otherSide(side), other.instanceId, user, rules, events);
  }
  return state;
}

function typeFieldPowerMultiplier(state: BattleState, moveType: MoveDefinition['type']): number {
  const activeCreatures = [active(state, 'player'), active(state, 'opponent')];
  const halvesElectric = moveType === 'electric' && activeCreatures.some(creature => creature.mudSportActive);
  const halvesFire = moveType === 'fire' && activeCreatures.some(creature => creature.waterSportActive);
  return halvesElectric || halvesFire ? 0.5 : 1;
}

function endRepeatedMoveOnFailure(state: BattleState, side: BattleSide, move: MoveDefinition): BattleState {
  if (!move.lockEndsOnMiss) return state;
  const user = active(state, side);
  return setCreature(state, side, sideState(state, side).activeIndex, { ...user, lockedMoveId: undefined, lockedTurnsRemaining: undefined, uproarActive: undefined, consecutiveMoveUses: undefined });
}

function endLockedMoveIfUnusable(state: BattleState, side: BattleSide, catalog: MoveCatalog): BattleState {
  const user = active(state, side);
  const locked = user.lockedMoveId ? catalog[user.lockedMoveId] : undefined;
  if (!locked?.lockEndsOnMiss) return state;
  return setCreature(state, side, sideState(state, side).activeIndex, { ...user, lockedMoveId: undefined, lockedTurnsRemaining: undefined, consecutiveMoveUses: undefined });
}

function applyMove(state: BattleState, side: BattleSide, command: Extract<BattleCommand, { kind: 'useMove' | 'struggle' }>, catalog: MoveCatalog, rules: BattleRules, cursor: RandomCursor, events: BattleEvent[], context: TurnMoveContext, override?: { readonly move: MoveDefinition; readonly skipPp: boolean; readonly noReflect?: boolean }): BattleState {
  let user = active(state, side);
  if (user.hp <= 0) return state;
  if (user.destinyBondActive || user.grudgeActive) {
    user = { ...user, destinyBondActive: undefined, grudgeActive: undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, user);
  }
  if (user.mustRecharge) {
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...user, mustRecharge: undefined });
    events.push({ type: 'rechargeConsumed', side, creatureId: user.instanceId });
    return state;
  }
  if (user.rageActive) {
    user = { ...user, rageActive: undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, user);
  }
  const emergency = command.kind === 'struggle';
  const moveId = override?.move.id ?? (emergency ? EMERGENCY_MOVE_ID : user.moves[command.moveSlot].moveId);
  if (user.encoredMoveId) {
    const encoreSlot = user.moves.find(slot => slot.moveId === user.encoredMoveId);
    if (!encoreSlot || encoreSlot.pp <= 0) {
      user = { ...user, encoredMoveId: undefined, encoreTurnsRemaining: undefined };
      state = setCreature(state, side, sideState(state, side).activeIndex, user);
    } else if (moveId === user.encoredMoveId) {
      const turns = Math.max(0, (user.encoreTurnsRemaining ?? 1) - 1);
      user = { ...user, encoredMoveId: turns > 0 ? user.encoredMoveId : undefined, encoreTurnsRemaining: turns || undefined };
      state = setCreature(state, side, sideState(state, side).activeIndex, user);
    }
  }
  if (!emergency && catalog[moveId]?.thawsUserIfFrozen && user.status?.status === 'freeze') {
    user = { ...user, status: undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, user);
    events.push({ type: 'statusTick', side, creatureId: user.instanceId, status: 'freeze', recovered: true });
  }
  const repeatingLock = user.lockedMoveId === moveId;
  const repeatingCharge = user.chargingMoveId === moveId;
  const actionPermission = override?.skipPp ? { state, canAct: true } : checkSleepAndFreeze(state, side, cursor, rules, events, !emergency && Boolean(catalog[moveId]?.usableWhileAsleep));
  state = actionPermission.state;
  if (!actionPermission.canAct) {
    events.push({ type: 'moveFailed', side, moveId, reason: 'blockedByStatus' });
    return endLockedMoveIfUnusable(state, side, catalog);
  }
  // Preserve recovery even if flinch subsequently prevents the pending move.
  user = active(state, side);
  if (context.flinchedCreatureIds.has(user.instanceId)) {
    context.flinchedCreatureIds.delete(user.instanceId);
    if (user.abilityId !== 'inner-focus') {
      events.push({ type: 'flinched', side, creatureId: user.instanceId });
      return endLockedMoveIfUnusable(state, side, catalog);
    }
  }
  if (!override?.skipPp && (user.confusionTurnsRemaining ?? 0) > 0) {
    const turnsRemaining = user.confusionTurnsRemaining! - 1;
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...user, confusionTurnsRemaining: turnsRemaining || undefined });
    events.push({ type: 'confusionTick', side, creatureId: user.instanceId, turnsRemaining });
    if (turnsRemaining > 0 && random(cursor) < 0.5) {
      const latest = active(state, side);
      const attack = Math.max(1, Math.floor(effectiveStat(latest, 'attack') * (latest.status?.status === 'burn' ? 0.5 : 1)));
      const defense = effectiveStat(latest, 'defense');
      const base = Math.floor((((2 * latest.level / 5 + 2) * 40 * attack / defense) / 50) + 2);
      const variance = rules.minimumDamageVariance + random(cursor) * (rules.maximumDamageVariance - rules.minimumDamageVariance);
      const amount = Math.max(1, Math.floor(base * variance));
      const hp = Math.max(0, latest.hp - amount);
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latest, hp });
      events.push({ type: 'confusionSelfHit', side, creatureId: latest.instanceId, amount: latest.hp - hp });
      if (hp === 0) events.push({ type: 'creatureFainted', side, creatureId: latest.instanceId });
      return endLockedMoveIfUnusable(state, side, catalog);
    }
    user = active(state, side);
  }
  if (!override?.skipPp && user.status?.status === 'paralysis' && random(cursor) < rules.paralysisActionChance) {
    events.push({ type: 'statusTick', side, creatureId: user.instanceId, status: 'paralysis' });
    events.push({ type: 'moveFailed', side, moveId, reason: 'blockedByStatus' });
    return endLockedMoveIfUnusable(state, side, catalog);
  }
  if (!override?.skipPp && user.infatuatedBy) {
    if (active(state, otherSide(side)).instanceId !== user.infatuatedBy) {
      user = { ...user, infatuatedBy: undefined };
      state = setCreature(state, side, sideState(state, side).activeIndex, user);
    } else {
      const immobilized = random(cursor) < 0.5;
      events.push({ type: 'infatuationTick', side, creatureId: user.instanceId, immobilized });
      if (immobilized) {
        events.push({ type: 'moveFailed', side, moveId, reason: 'blockedByStatus' });
        return endLockedMoveIfUnusable(state, side, catalog);
      }
    }
  }
  const slot = command.kind === 'useMove' ? user.moves[command.moveSlot] : undefined;
  if (slot && slot.pp <= 0 && !repeatingLock && !repeatingCharge && !override?.skipPp) {
    events.push({ type: 'moveFailed', side, moveId: slot.moveId, reason: 'noPp' });
    return state;
  }
  let move: MoveDefinition = override?.move ?? (emergency ? {
    id: EMERGENCY_MOVE_ID, name: EMERGENCY_MOVE_NAME, type: 'normal', category: 'physical',
    power: rules.emergencyMove.power, accuracy: 100, priority: 0, maxPp: 0,
  } : catalog[slot!.moveId]);
  if (move.meFirst) {
    const targetSide = otherSide(side);
    const target = active(state, targetSide);
    const targetCommand = context.commands[targetSide];
    const targetMoveId = targetCommand.kind === 'useMove'
      ? target.moves[targetCommand.moveSlot]?.moveId
      : targetCommand.kind === 'struggle' ? EMERGENCY_MOVE_ID : undefined;
    const copied = targetMoveId === EMERGENCY_MOVE_ID ? undefined : targetMoveId ? catalog[targetMoveId] : undefined;
    if (context.actedCreatureIds.has(target.instanceId) || !copied || copied.category === 'status' || copied.power <= 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    events.push({ type: 'moveInvoked', side, creatureId: user.instanceId, sourceMoveId: move.id, moveId: copied.id });
    move = { ...copied, damageMultiplier: 1.5 };
  }
  if (move.copyLastBattleMove) {
    const previous = state.lastMoveId ? catalog[state.lastMoveId] : undefined;
    if (!previous || ['copycat', 'roar', 'whirlwind'].includes(previous.id)) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    events.push({ type: 'moveInvoked', side, creatureId: user.instanceId, sourceMoveId: move.id, moveId: previous.id });
    move = previous;
  }
  if (move.mirrorMove) {
    const mirrorTarget = active(state, otherSide(side));
    const previousMoveId = user.lastTargetedByCreatureId === mirrorTarget.instanceId ? user.lastTargetingMoveId : undefined;
    const cannotCopy = new Set(['mirror-move', 'mimic', 'sketch', 'struggle', 'transform', 'metronome', 'copycat', 'encore', 'future-sight', 'doom-desire', 'counter', 'mirror-coat', 'focus-punch', 'bide', 'destiny-bond', 'protect', 'detect', 'substitute', 'rest', 'recycle', 'sleep-talk', 'trick', 'switcheroo']);
    const previousMove = previousMoveId ? catalog[previousMoveId] : undefined;
    if (!previousMove || cannotCopy.has(previousMove.id) || !previousMove.target || !['selected-pokemon', 'random-opponent', 'all-opponents', 'all-other-pokemon'].includes(previousMove.target)) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    events.push({ type: 'moveInvoked', side, creatureId: user.instanceId, sourceMoveId: move.id, moveId: previousMove.id });
    move = previousMove;
  }
  if (move.sleepTalk) {
    const forbidden = new Set(['assist', 'bide', 'bounce', 'chatter', 'copycat', 'dig', 'dive', 'fly', 'focus-punch', 'me-first', 'metronome', 'mirror-move', 'shadow-force', 'skull-bash', 'sky-attack', 'sky-drop', 'sleep-talk', 'solar-beam', 'razor-wind', 'uproar']);
    const choices = user.moves.map(slot => catalog[slot.moveId]).filter(candidate => candidate && !forbidden.has(candidate.id));
    if (user.status?.status !== 'sleep' || (user.encoreTurnsRemaining ?? 0) > 0 || choices.length === 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    move = choices[integerBetween(cursor, 0, choices.length - 1)];
    events.push({ type: 'moveInvoked', side, creatureId: user.instanceId, sourceMoveId: 'sleep-talk', moveId: move.id });
  }
  if (move.metronome) {
    const forbidden = new Set(['assist', 'chatter', 'copycat', 'counter', 'covet', 'destiny-bond', 'detect', 'endure', 'feint', 'focus-punch', 'follow-me', 'helping-hand', 'me-first', 'metronome', 'mimic', 'mirror-coat', 'mirror-move', 'protect', 'quick-guard', 'sketch', 'sleep-talk', 'snatch', 'struggle', 'switcheroo', 'thief', 'trick', 'wide-guard']);
    const choices = Object.values(catalog).filter(candidate => !forbidden.has(candidate.id) && !candidate.alwaysFails &&
      !candidate.requiresHeldItemContext && !user.moves.some(slot => slot.moveId === candidate.id));
    if (choices.length === 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const sourceMoveId = move.id;
    move = choices[integerBetween(cursor, 0, choices.length - 1)];
    events.push({ type: 'moveInvoked', side, creatureId: user.instanceId, sourceMoveId, moveId: move.id });
  }
  const stockpileCount = user.stockpileCount ?? 0;
  if (move.thawsUserIfFrozen && user.status?.status === 'freeze') {
    user = { ...user, status: undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, user);
    events.push({ type: 'statusTick', side, creatureId: user.instanceId, status: 'freeze', recovered: true });
  }
  if (move.id === user.disabledMoveId && (user.disableTurnsRemaining ?? 0) > 0) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'disabled' });
    return endLockedMoveIfUnusable(state, side, catalog);
  }
  if (move.category === 'status' && (user.tauntTurnsRemaining ?? 0) > 0) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'taunted' });
    return endLockedMoveIfUnusable(state, side, catalog);
  }
  if (user.abilityId === 'damp' && move.selfDestructs) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (!Number.isFinite(move.accuracy) || move.accuracy < 0 || move.accuracy > 100 || !Number.isFinite(move.power) || move.power < 0 ||
      (move.fixedDamage !== undefined && (!Number.isInteger(move.fixedDamage) || move.fixedDamage <= 0 || move.category === 'status')) ||
      (move.damageByUserLevel && (move.category === 'status' || move.power > 0)) ||
      (move.targetHpFraction !== undefined && (!Number.isFinite(move.targetHpFraction) || move.targetHpFraction <= 0 || move.targetHpFraction > 1 || move.category === 'status')) ||
      (move.endeavorDamage && (move.category === 'status' || move.power > 0)) ||
      (move.oneHitKO && (move.category === 'status' || move.power > 0)) ||
      (move.faintUserAfterMove && ((move.category === 'status' && !move.statChanges?.length) || (move.category !== 'status' && move.power <= 0))) ||
      (move.damageDefenseMultiplier !== undefined && (!Number.isFinite(move.damageDefenseMultiplier) || move.damageDefenseMultiplier <= 0 || move.damageDefenseMultiplier > 1)) ||
      (move.damageMultiplier !== undefined && (!Number.isFinite(move.damageMultiplier) || move.damageMultiplier <= 0)) ||
      (move.statStageSwap !== undefined && (move.statStageSwap.length !== 2 || move.statStageSwap.some(stat => !BATTLE_STATS.includes(stat as typeof BATTLE_STATS[number])))) ||
      (move.drainPercent !== undefined && (move.drainPercent < 0 || move.drainPercent > 100)) ||
      (move.healingPercent !== undefined && (move.healingPercent <= 0 || move.healingPercent > 100 || move.category !== 'status')) ||
      (move.trapTarget !== undefined && (!Number.isInteger(move.trapTarget.minTurns) || !Number.isInteger(move.trapTarget.maxTurns) || move.trapTarget.minTurns < 2 || move.trapTarget.maxTurns > 5 || move.trapTarget.maxTurns < move.trapTarget.minTurns || !Number.isFinite(move.trapTarget.damageFraction) || move.trapTarget.damageFraction <= 0 || move.trapTarget.damageFraction > 1)) ||
      (move.requiresMissingHp && move.healingPercent === undefined) ||
      (move.recoilPercent !== undefined && (!Number.isInteger(move.recoilPercent) || move.recoilPercent <= 0 || move.recoilPercent > 100 || move.category === 'status' || (move.power <= 0 && move.fixedDamage === undefined) || move.drainPercent !== undefined)) ||
      (move.crashOnMoveFailure && move.category === 'status') ||
      ((move.disableMinTurns !== undefined || move.disableMaxTurns !== undefined) && (!Number.isInteger(move.disableMinTurns) || !Number.isInteger(move.disableMaxTurns) || move.disableMinTurns! < 1 || move.disableMaxTurns! < move.disableMinTurns!)) ||
      ((move.tauntMinTurns !== undefined || move.tauntMaxTurns !== undefined) && (!Number.isInteger(move.tauntMinTurns) || !Number.isInteger(move.tauntMaxTurns) || move.tauntMinTurns! < 1 || move.tauntMaxTurns! < move.tauntMinTurns!)) ||
      (move.leechSeedFraction !== undefined && (!Number.isFinite(move.leechSeedFraction) || move.leechSeedFraction <= 0 || move.leechSeedFraction > 1)) ||
      ((move.minStatusTurns !== undefined || move.maxStatusTurns !== undefined) &&
        (!Number.isInteger(move.minStatusTurns) || !Number.isInteger(move.maxStatusTurns) || move.minStatusTurns! < 1 || move.maxStatusTurns! < move.minStatusTurns!)) ||
      (move.statChangeChance !== undefined && (move.statChangeChance < 0 || move.statChangeChance > 100)) ||
      (move.criticalStageBoost !== undefined && (!Number.isInteger(move.criticalStageBoost) || move.criticalStageBoost < 1 || move.criticalStageBoost > 3)) ||
      (move.criticalStageChange !== undefined && (!Number.isInteger(move.criticalStageChange) || move.criticalStageChange === 0 || Math.abs(move.criticalStageChange) > 4)) ||
      (move.flinchChance !== undefined && (!Number.isFinite(move.flinchChance) || move.flinchChance < 0 || move.flinchChance > 100)) ||
      (move.inflictedConfusionChance !== undefined && (move.inflictedConfusionChance < 0 || move.inflictedConfusionChance > 100)) ||
      ((move.lockInMinTurns !== undefined || move.lockInMaxTurns !== undefined) &&
        (!Number.isInteger(move.lockInMinTurns) || !Number.isInteger(move.lockInMaxTurns) || move.lockInMinTurns! < 2 || move.lockInMaxTurns! < move.lockInMinTurns! || move.lockInMaxTurns! > (move.uproar ? 6 : 5))) ||
      (move.confusesUserAfterLockIn && move.lockInMinTurns === undefined) ||
      ((move.minConfusionTurns !== undefined || move.maxConfusionTurns !== undefined) &&
        (!Number.isInteger(move.minConfusionTurns) || !Number.isInteger(move.maxConfusionTurns) || move.minConfusionTurns! < 1 || move.maxConfusionTurns! < move.minConfusionTurns!)) ||
      (move.minHits !== undefined && (!Number.isInteger(move.minHits) || move.minHits < 1 || !Number.isInteger(move.maxHits) || move.maxHits! < move.minHits))) {
    throw new Error(`Invalid move data: ${move.id}`);
  }
  for (const effect of move.statChanges ?? []) {
    if (!BATTLE_STATS.includes(effect.stat) || !['self', 'opponent'].includes(effect.target) ||
        !Number.isInteger(effect.stages) || effect.stages === 0 || Math.abs(effect.stages) > MAX_STAT_STAGE) {
      throw new Error('Invalid stat change for move: ' + move.id);
    }
  }
  const ppCost = override?.skipPp ? 0 : !repeatingLock && !repeatingCharge && !emergency && active(state, otherSide(side)).abilityId === 'pressure' ? 2 : 1;
  let spentPp: BattleCreature = { ...user, lastUsedMoveId: emergency ? user.lastUsedMoveId : move.id,
    usedMoveIdsThisEntry: emergency ? user.usedMoveIdsThisEntry : [...new Set([...(user.usedMoveIdsThisEntry ?? []), move.id])],
    consecutiveMoveUses: emergency ? undefined : user.lastUsedMoveId === move.id ? Math.min(5, (user.consecutiveMoveUses ?? 0) + 1) : 1,
    defenseCurlUsed: move.id === 'defense-curl' ? true : user.defenseCurlUsed,
    chargeElectricBoostReadyAt: move.type === 'electric' && user.chargeElectricBoostReadyAt !== undefined && state.turn >= user.chargeElectricBoostReadyAt ? undefined : user.chargeElectricBoostReadyAt,
    lockOnTargetInstanceId: move.lockOn ? user.lockOnTargetInstanceId : undefined,
    lockOnTurnsRemaining: move.lockOn ? user.lockOnTurnsRemaining : undefined,
    protectionStreak: move.protectUser || move.endureUser ? user.protectionStreak : undefined,
    uproarActive: move.uproar ? true : repeatingLock ? user.uproarActive : undefined,
    rageActive: move.rage ? true : undefined,
    moves: user.moves.map((item, i) => command.kind === 'useMove' && i === command.moveSlot && !repeatingLock && !repeatingCharge && !override?.skipPp ? { ...item, pp: Math.max(0, item.pp - ppCost) } : item) };
  let confusionAfterLock = false;
  if (move.lockInMinTurns !== undefined) {
    const turnsRemaining = repeatingLock
      ? Math.max(0, (user.lockedTurnsRemaining ?? 1) - 1)
      : integerBetween(cursor, move.lockInMinTurns, move.lockInMaxTurns!) - 1;
    confusionAfterLock = repeatingLock && turnsRemaining === 0 && Boolean(move.confusesUserAfterLockIn);
    spentPp = { ...spentPp, lockedMoveId: turnsRemaining > 0 ? move.id : undefined,
      lockedTurnsRemaining: turnsRemaining > 0 ? turnsRemaining : undefined };
    if (move.uproar) spentPp = { ...spentPp, uproarActive: turnsRemaining > 0 };
  }
  state = setCreature(state, side, sideState(state, side).activeIndex, spentPp);
  const targetSide = otherSide(side);
  const target = active(state, targetSide);
  const lockOnApplies = !move.lockOn && user.lockOnTargetInstanceId === target.instanceId && (user.lockOnTurnsRemaining ?? 0) > 0;
  const reflectedHit = move.counterDamageCategory ? [...events].reverse().find(event =>
    event.type === 'damageApplied' && event.sourceSide === targetSide && event.targetSide === side &&
    event.targetCreatureId === user.instanceId && event.amount > 0 &&
    catalog[event.moveId]?.category === move.counterDamageCategory) : undefined;
  const reflectedDamage = reflectedHit?.type === 'damageApplied' ? reflectedHit.amount * 2 : undefined;
  if (move.powerRule === 'lowKick' && target.weightKg === undefined) throw new Error(`Move ${move.id} requires official target weight.`);
  const targetWasDamagedThisTurn = events.some(event => event.type === 'damageApplied' && event.targetSide === targetSide && event.targetCreatureId === target.instanceId && event.amount > 0);
  const userWasDamagedThisTurn = events.some(event => event.type === 'damageApplied' && event.targetSide === side && event.targetCreatureId === user.instanceId && event.amount > 0);
  const targetAlreadyActed = context.actedCreatureIds.has(target.instanceId);
  const basePower = move.pursuit && (context.switchingCreatureIds.has(target.instanceId) || context.pursuitBoostedTargetIds.has(target.instanceId)) ? move.power * 2 : move.powerRule ? resolveMovePower(move.powerRule, move.power, spentPp, target, {
    targetWasDamaged: targetWasDamagedThisTurn,
    userWasDamaged: userWasDamagedThisTurn,
    targetAlreadyActed,
    doubleRollout: move.doublesRolloutAfterDefenseCurl === true,
    moveId: move.id,
    userTailwind: (sideState(state, side).tailwindTurnsRemaining ?? 0) > 0,
    targetTailwind: (sideState(state, targetSide).tailwindTurnsRemaining ?? 0) > 0,
    weather: state.weather?.kind,
  }) : move.stockpileConsumes ? stockpileCount * 100 : move.power;
  if (basePower === undefined) throw new Error(`Move ${move.id} lacks its required turn-power context.`);
  const bypassState = target.semiInvulnerableState !== undefined && move.hitsSemiInvulnerable?.includes(target.semiInvulnerableState);
  const chargeBoostActive = move.type === 'electric' && user.chargeElectricBoostReadyAt !== undefined && state.turn >= user.chargeElectricBoostReadyAt;
  const damageMove = { ...move, power: basePower * (move.doublesDamageAgainstSemiInvulnerable && bypassState ? 2 : 1) * (chargeBoostActive ? 2 : 1), ...(reflectedDamage === undefined ? {} : { fixedDamage: reflectedDamage }) };
  const dealsDamage = move.category !== 'status' && (move.power > 0 || move.powerRule !== undefined || move.stockpileConsumes || move.fixedDamage !== undefined || move.counterDamageCategory !== undefined || move.damageByUserLevel || move.targetHpFraction !== undefined || move.endeavorDamage || move.oneHitKO);
  let damagingMoveConnected = !dealsDamage;
  events.push({ type: 'moveUsed', side, creatureId: user.instanceId, moveId: move.id });
  state = { ...state, lastMoveId: move.id };
  const reflector = active(state, targetSide);
  if (!override?.noReflect && move.category === 'status' && move.reflectable && reflector.magicCoatActive) {
    state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...reflector, magicCoatActive: undefined });
    events.push({ type: 'moveInvoked', side: targetSide, creatureId: reflector.instanceId, sourceMoveId: 'magic-coat', moveId: move.id });
    return applyMove(state, targetSide, { kind: 'useMove', moveSlot: 0 }, catalog, rules, cursor, events, context,
      { move, skipPp: true, noReflect: true });
  }
  if (move.payDay) {
    const amount = 5 * user.level;
    state = { ...state, payDayBonus: (state.payDayBonus ?? 0) + amount };
    events.push({ type: 'payDayBonusAdded', side, amount });
  }
  if (move.category === 'status' && move.target === 'selected-pokemon' && targetSide !== side && active(state, targetSide).substituteHp !== undefined) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.target && ['selected-pokemon', 'random-opponent', 'all-opponents', 'all-other-pokemon'].includes(move.target)) {
    const targeted = active(state, otherSide(side));
    if (targeted.hp > 0) state = setCreature(state, otherSide(side), sideState(state, otherSide(side)).activeIndex,
      { ...targeted, lastTargetingMoveId: move.id, lastTargetedByCreatureId: user.instanceId });
  }
  if (move.uproar) {
    for (const affectedSide of ['player', 'opponent'] as const) {
      const sleeping = active(state, affectedSide);
      if (sleeping.status?.status === 'sleep') {
        state = setCreature(state, affectedSide, sideState(state, affectedSide).activeIndex, { ...sleeping, status: undefined });
        events.push({ type: 'statusCured', side: affectedSide, creatureId: sleeping.instanceId, status: 'sleep' });
      }
    }
  }
  if (move.counterDamageCategory && reflectedDamage === undefined) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.alwaysFails) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if ((state.gravityTurnsRemaining ?? 0) > 0 && ['bounce', 'fly', 'high-jump-kick', 'jump-kick', 'sky-drop', 'splash'].includes(move.id)) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.requiresHeldItemContext) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.requiresOppositeGender && (!user.gender || user.gender === 'genderless' || !target.gender || target.gender === 'genderless' || user.gender === target.gender)) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.requiresTargetDamagingMove && (!context.pendingDamagingCreatureIds.has(target.instanceId) || context.actedCreatureIds.has(target.instanceId))) {
    events.push({ type: 'moveFailed', side, moveId, reason: 'noEffect' });
    return state;
  }
  if (move.conversion || move.conversion2 || move.camouflage) {
    const latestUser = active(state, side);
    let candidates: readonly string[];
    if (move.camouflage) {
      candidates = latestUser.types.includes('normal') ? [] : ['normal'];
    } else if (move.conversion) {
      candidates = latestUser.moves.filter(slot => slot.moveId !== 'curse' && catalog[slot.moveId] &&
        !latestUser.types.includes(catalog[slot.moveId].type)).map(slot => catalog[slot.moveId].type);
    } else {
      const incomingMove = latestUser.lastDamagingMoveId ? catalog[latestUser.lastDamagingMoveId] : undefined;
      candidates = incomingMove ? BATTLE_TYPES.filter(type => !latestUser.types.includes(type) && effectivenessFor([type], incomingMove.type, rules.typeChart) < 1) : [];
    }
    if (!candidates.length) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const changedType = (move.camouflage ? 'normal' : candidates[integerBetween(cursor, 0, candidates.length - 1)]) as BattleCreature['types'][number];
    const previousTypes = [...latestUser.types];
    state = setCreature(state, side, sideState(state, side).activeIndex, {
      ...latestUser,
      types: [changedType],
      typeChangeOriginal: latestUser.typeChangeOriginal ?? [...latestUser.types],
    });
    events.push({ type: 'typeChanged', side, creatureId: latestUser.instanceId, moveId: move.id, previousTypes, types: [changedType] });
    return state;
  }
  if (move.stockpile && stockpileCount >= 3) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.stockpileConsumes || move.swallow) {
    if (stockpileCount <= 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const latestUser = active(state, side);
    const stages: Partial<Record<typeof BATTLE_STATS[number], number>> = { ...latestUser.statStages };
    for (const [stat, gained] of [['defense', latestUser.stockpileDefenseGain ?? 0], ['specialDefense', latestUser.stockpileSpecialDefenseGain ?? 0]] as const) {
      const next = Math.max(MIN_STAT_STAGE, (stages[stat] ?? 0) - gained);
      if (next === 0) delete stages[stat]; else stages[stat] = next;
    }
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser,
      stockpileCount: undefined, stockpileDefenseGain: undefined, stockpileSpecialDefenseGain: undefined,
      statStages: Object.keys(stages).length ? stages : undefined,
    });
  }
  if (move.lastResort) {
    const otherMoves = user.moves.map(slot => slot.moveId).filter(moveId => moveId !== move.id);
    if (otherMoves.length === 0 || otherMoves.some(moveId => !user.usedMoveIdsThisEntry?.includes(moveId))) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
  }
  if (target.imprisonActive && target.moves.some(slot => slot.moveId === move.id)) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'imprisoned' });
    return state;
  }
  if (move.imprison) {
    if (!target.moves.some(targetSlot => user.moves.some(userSlot => userSlot.moveId === targetSlot.moveId))) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    } else {
      const latestUser = active(state, side);
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, imprisonActive: true });
      events.push({ type: 'imprisonApplied', side, creatureId: latestUser.instanceId });
    }
    return state;
  }
  if (move.lockOn) {
    if (target.hp <= 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noTarget' });
      return state;
    }
    const latestUser = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, lockOnTargetInstanceId: target.instanceId, lockOnTurnsRemaining: 2 });
    events.push({ type: 'lockOnApplied', side, creatureId: target.instanceId });
    return state;
  }
  if (move.chargesBeforeAttack && !repeatingCharge && !(move.skipsChargeInSun && state.weather?.kind === 'sun')) {
    const latestUser = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, {
      ...latestUser,
      chargingMoveId: move.id,
      semiInvulnerableState: move.semiInvulnerableWhileCharging,
      statStages: move.chargeDefenseBoost ? { ...latestUser.statStages, defense: Math.min(MAX_STAT_STAGE, (latestUser.statStages?.defense ?? 0) + move.chargeDefenseBoost) } : latestUser.statStages,
    });
    events.push({ type: 'chargeStarted', side, creatureId: user.instanceId, moveId: move.id });
    return state;
  }
  if (repeatingCharge) {
    const latestUser = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, chargingMoveId: undefined, semiInvulnerableState: undefined });
  }
  if (target.hp <= 0) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noTarget' });
    return state;
  }
  if (move.oneHitKO && target.abilityId === 'sturdy') {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  const protectTargetsOpponent = !(move.curseMove && active(state, side).types.includes('ghost')) && (move.target ? ['selected-pokemon', 'random-opponent', 'all-opponents', 'all-other-pokemon'].includes(move.target)
    : move.category !== 'status' || move.statusTarget === 'opponent');
  if (target.protectedThisTurn && protectTargetsOpponent && !move.ignoresProtection) {
    const brokeThrough = lockOnApplies && random(cursor) * 100 < (100 - move.accuracy);
    if (!brokeThrough) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return endRepeatedMoveOnFailure(applyCrashDamage(state, side, targetSide, move, damageMove, rules, cursor, events), side, move);
    }
  }
  if (move.soundMove && target.abilityId === 'soundproof' && !move.perishSong && !move.curesPartyStatuses) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.curseMove) {
    const latestUser = active(state, side);
    const latestTarget = active(state, targetSide);
    if (latestUser.types.includes('ghost')) {
      if (latestTarget.cursed) {
        events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
        return state;
      }
      const cost = Math.max(1, Math.floor(latestUser.stats.maxHp / 2));
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, hp: latestUser.hp - cost });
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget, cursed: true });
      events.push({ type: 'hpSacrificed', side, creatureId: latestUser.instanceId, moveId: move.id, amount: cost });
      events.push({ type: 'curseApplied', side: targetSide, creatureId: latestTarget.instanceId });
    } else {
      const stages = latestUser.statStages ?? {};
      const next = { ...stages,
        speed: Math.max(MIN_STAT_STAGE, Math.min(MAX_STAT_STAGE, (stages.speed ?? 0) - 1)),
        attack: Math.max(MIN_STAT_STAGE, Math.min(MAX_STAT_STAGE, (stages.attack ?? 0) + 1)),
        defense: Math.max(MIN_STAT_STAGE, Math.min(MAX_STAT_STAGE, (stages.defense ?? 0) + 1)),
      };
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, statStages: next });
      for (const stat of ['speed', 'attack', 'defense'] as const) {
        const before = stages[stat] ?? 0;
        const after = next[stat] ?? 0;
        if (before !== after) events.push({ type: 'statStageChanged', side, creatureId: latestUser.instanceId, stat, change: after - before, stage: after });
        else events.push({ type: 'statStageLimited', side, creatureId: latestUser.instanceId, stat, stage: after });
      }
    }
    return state;
  }
  if (move.suppressesAbility) {
    const latestTarget = active(state, targetSide);
    if (!latestTarget.abilityId) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    else {
      const suppressedId = latestTarget.abilityId;
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget,
        abilityOriginalId: latestTarget.abilityOriginalId ?? latestTarget.abilityId, abilityId: undefined });
      events.push({ type: 'abilitySuppressed', side: targetSide, creatureId: latestTarget.instanceId, abilityId: suppressedId });
    }
    return state;
  }
  if (move.magnetRise) {
    const current = active(state, side);
    if (current.ingrainActive || current.abilityId === 'levitate' || (current.magnetRiseTurnsRemaining ?? 0) > 0 || (state.gravityTurnsRemaining ?? 0) > 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    } else state = setCreature(state, side, sideState(state, side).activeIndex, { ...current, magnetRiseTurnsRemaining: 5 });
    return state;
  }
  if (move.forceSwitchTarget) {
    const latestTarget = active(state, targetSide);
    if (state.battleType === 'wild') return endBattle(state, { kind: 'fled', side: targetSide === 'opponent' ? targetSide : side }, events);
    const replacementIndex = sideState(state, targetSide).creatures.findIndex((creature, index) => index !== sideState(state, targetSide).activeIndex && creature.hp > 0);
    if (latestTarget.ingrainActive || latestTarget.abilityId === 'suction-cups' || replacementIndex < 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const reserves = sideState(state, targetSide).creatures.map((creature, index) => ({ creature, index })).filter(({ creature, index }) => index !== sideState(state, targetSide).activeIndex && creature.hp > 0);
    const chosen = reserves[integerBetween(cursor, 0, reserves.length - 1)].index;
    context.pendingCreatureIds.delete(latestTarget.instanceId);
    context.pendingDamagingCreatureIds.delete(latestTarget.instanceId);
    return applySwitch(state, targetSide, { kind: 'switch', partyIndex: chosen }, events, rules, true);
  }
  if (move.perishSong) {
    let affected = false;
    for (const affectedSide of ['player', 'opponent'] as const) {
      const activeCreature = active(state, affectedSide);
      if (activeCreature.hp <= 0 || activeCreature.abilityId === 'soundproof' || activeCreature.perishCount !== undefined) continue;
      state = setCreature(state, affectedSide, sideState(state, affectedSide).activeIndex, { ...activeCreature, perishCount: 3 });
      events.push({ type: 'perishSongApplied', side: affectedSide, creatureId: activeCreature.instanceId });
      affected = true;
    }
    if (!affected) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.hazardEffect === 'setSpikes' || move.hazardEffect === 'setToxicSpikes') {
    const hazard = move.hazardEffect === 'setSpikes' ? 'spikes' : 'toxicSpikes';
    const field = sideState(state, targetSide);
    const current = hazard === 'spikes' ? field.spikesLayers ?? 0 : field.toxicSpikesLayers ?? 0;
    const maximum = hazard === 'spikes' ? 3 : 2;
    if (current >= maximum) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    else {
      const layers = current + 1;
      state = { ...state, [targetSide]: { ...field, [hazard === 'spikes' ? 'spikesLayers' : 'toxicSpikesLayers']: layers } };
      events.push({ type: 'hazardSet', side: targetSide, hazard, layers });
    }
    return state;
  }
  if (move.weather) {
    if (state.weather?.kind === move.weather) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    else {
      state = { ...state, weather: { kind: move.weather, turnsRemaining: 5 } };
      events.push({ type: 'weatherApplied', weather: move.weather, turns: 5 });
    }
    return state;
  }
  if (move.batonPass) {
    const partyIndex = command.kind === 'useMove' ? command.batonPassPartyIndex : undefined;
    if (partyIndex === undefined) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const current = active(state, side);
    const pursuerSide = otherSide(side);
    const pursuerCommand = context.commands[pursuerSide];
    const pursuer = active(state, pursuerSide);
    const pursuerMoveId = pursuerCommand.kind === 'useMove' ? pursuer.moves[pursuerCommand.moveSlot]?.moveId : undefined;
    const pursuerMove = pursuerMoveId ? catalog[pursuerMoveId] : undefined;
    if (pursuerMove?.pursuit && !context.actedCreatureIds.has(pursuer.instanceId) && pursuer.hp > 0) {
      context.pursuitBoostedTargetIds.add(current.instanceId);
      context.pendingCreatureIds.delete(pursuer.instanceId);
      context.pendingDamagingCreatureIds.delete(pursuer.instanceId);
      state = applyMove(state, pursuerSide, pursuerCommand as Extract<BattleCommand, { kind: 'useMove' }>, catalog, rules, cursor, events, context);
      context.pursuitBoostedTargetIds.delete(current.instanceId);
      context.actedCreatureIds.add(pursuer.instanceId);
    }
    const volatile: Partial<BattleCreature> = {
      statStages: current.statStages ? { ...current.statStages } : undefined,
      criticalStage: current.criticalStage,
      confusionTurnsRemaining: current.confusionTurnsRemaining,
      escapeBlockedBy: current.escapeBlockedBy,
      cursed: current.cursed,
      perishCount: current.perishCount,
      leechSeed: current.leechSeed ? { ...current.leechSeed } : undefined,
      substituteHp: current.substituteHp,
      aquaRingActive: current.aquaRingActive,
      ingrainActive: current.ingrainActive,
      magnetRiseTurnsRemaining: current.magnetRiseTurnsRemaining,
      chargeElectricBoostReadyAt: current.chargeElectricBoostReadyAt,
      lockOnTargetInstanceId: current.lockOnTargetInstanceId,
      lockOnTurnsRemaining: current.lockOnTurnsRemaining,
    };
    const batonPass = active(state, side).hp > 0;
    state = applySwitch(state, side, { kind: 'switch', partyIndex }, events, rules, false,
      batonPass ? { volatile, suppressAbility: current.abilityId === undefined && current.abilityOriginalId !== undefined } : undefined);
    return state;
  }
  if (move.healingWish) {
    const hasReplacement = sideState(state, side).creatures.some((creature, index) => index !== sideState(state, side).activeIndex && creature.hp > 0);
    if (!hasReplacement || sideState(state, side).healingWishPending) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const current = active(state, side);
    state = { ...state, [side]: { ...sideState(state, side), healingWishPending: true } };
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...current, hp: 0 });
    events.push({ type: 'creatureFainted', side, creatureId: current.instanceId });
    return state;
  }
  if (move.magicCoat) {
    const current = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...current, magicCoatActive: true });
    return state;
  }
  if (move.gravity) {
    if ((state.gravityTurnsRemaining ?? 0) > 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    state = { ...state, gravityTurnsRemaining: 5 };
    events.push({ type: 'gravityApplied', turns: 5 });
    for (const affectedSide of ['player', 'opponent'] as const) {
      const current = active(state, affectedSide);
      const canceledAirMove = current.semiInvulnerableState === 'air';
      if ((current.magnetRiseTurnsRemaining ?? 0) > 0) events.push({ type: 'magnetRiseEnded', side: affectedSide, creatureId: current.instanceId });
      state = setCreature(state, affectedSide, sideState(state, affectedSide).activeIndex, {
        ...current, magnetRiseTurnsRemaining: undefined,
        semiInvulnerableState: canceledAirMove ? undefined : current.semiInvulnerableState,
        chargingMoveId: canceledAirMove ? undefined : current.chargingMoveId,
      });
    }
    return state;
  }
  if (move.screen) {
    const field = sideState(state, side);
    state = { ...state, [side]: { ...field, [move.screen === 'reflect' ? 'reflectTurnsRemaining' : 'lightScreenTurnsRemaining']: 5 } };
    events.push({ type: 'screenApplied', side, screen: move.screen, turns: 5 });
    return state;
  }
  if (move.mist) {
    state = { ...state, [side]: { ...sideState(state, side), mistTurnsRemaining: 5 } };
    events.push({ type: 'mistApplied', side, turns: 5 });
    return state;
  }
  if (move.luckyChant) {
    state = { ...state, [side]: { ...sideState(state, side), luckyChantTurnsRemaining: 5 } };
    events.push({ type: 'luckyChantApplied', side, turns: 5 });
    return state;
  }
  if (move.tailwind) {
    state = { ...state, [side]: { ...sideState(state, side), tailwindTurnsRemaining: 3 } };
    events.push({ type: 'tailwindApplied', side, turns: 3 });
    return state;
  }
  if (move.foresight || move.miracleEye) {
    const latestTarget = active(state, targetSide);
    const alreadyApplied = move.foresight ? latestTarget.foresightActive : latestTarget.miracleEyeActive;
    if (alreadyApplied) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    else {
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, {
        ...latestTarget,
        foresightActive: move.foresight ? true : latestTarget.foresightActive,
        miracleEyeActive: move.miracleEye ? true : latestTarget.miracleEyeActive,
        statStages: { ...latestTarget.statStages, evasion: 0 },
      });
      events.push({ type: 'foresightApplied', side: targetSide, creatureId: latestTarget.instanceId, kind: move.foresight ? 'foresight' : 'miracleEye' });
    }
    return state;
  }
  if (move.safeguard) {
    state = { ...state, [side]: { ...sideState(state, side), safeguardTurnsRemaining: 5 } };
    events.push({ type: 'safeguardApplied', side, turns: 5 });
    return state;
  }
  if (move.inflictsDrowsiness) {
    const targetNow = active(state, targetSide);
    if (targetNow.status || sideState(state, targetSide).safeguardTurnsRemaining) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    } else {
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...targetNow, drowsyTurnsRemaining: 2 });
      events.push({ type: 'drowsinessApplied', side: targetSide, creatureId: targetNow.instanceId });
    }
    return state;
  }
  if (move.tauntsTarget) {
    const latestTarget = active(state, targetSide);
    const turns = integerBetween(cursor, move.tauntMinTurns ?? 3, move.tauntMaxTurns ?? 5);
    state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget, tauntTurnsRemaining: turns });
    events.push({ type: 'tauntApplied', side: targetSide, creatureId: latestTarget.instanceId, turns });
    return state;
  }
  if (move.aquaRing || move.ingrain) {
    const latestUser = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, {
      ...latestUser,
      aquaRingActive: move.aquaRing ? true : latestUser.aquaRingActive,
      ingrainActive: move.ingrain ? true : latestUser.ingrainActive,
    });
    return state;
  }
  if (move.roost) {
    const latestUser = active(state, side);
    if (latestUser.types.includes('flying')) state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, roostedThisTurn: true });
  }
  if (move.halvesElectricDamage || move.halvesFireDamage) {
    const latestUser = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, {
      ...latestUser,
      mudSportActive: move.halvesElectricDamage ? true : latestUser.mudSportActive,
      waterSportActive: move.halvesFireDamage ? true : latestUser.waterSportActive,
    });
    return state;
  }
  if (move.chargeElectricBoost) {
    const latestUser = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, chargeElectricBoostReadyAt: state.turn + 1 });
  }
  if (move.statStageSwap) {
    const [first, second] = move.statStageSwap as readonly [typeof BATTLE_STATS[number], typeof BATTLE_STATS[number]];
    const latestUser = active(state, side);
    const latestTarget = active(state, targetSide);
    const userStages = { ...latestUser.statStages, [first]: latestTarget.statStages?.[first], [second]: latestTarget.statStages?.[second] };
    const targetStages = { ...latestTarget.statStages, [first]: latestUser.statStages?.[first], [second]: latestUser.statStages?.[second] };
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, statStages: userStages });
    state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget, statStages: targetStages });
    return state;
  }
  if (move.copyTargetStatStages) {
    const latestUser = active(state, side);
    const latestTarget = active(state, targetSide);
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, statStages: latestTarget.statStages ? { ...latestTarget.statStages } : undefined });
    return state;
  }
  if (move.clearAllStatStages) {
    for (const affectedSide of ['player', 'opponent'] as const) {
      const current = active(state, affectedSide);
      state = setCreature(state, affectedSide, sideState(state, affectedSide).activeIndex, { ...current, statStages: undefined });
    }
    return state;
  }
  if (move.reduceLastMovePp !== undefined) {
    const latestTarget = active(state, targetSide);
    const slotIndex = latestTarget.moves.findIndex(slot => slot.moveId === latestTarget.lastUsedMoveId);
    if (slotIndex < 0 || latestTarget.moves[slotIndex].pp <= 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    } else {
      const slot = latestTarget.moves[slotIndex];
      const ppRemaining = Math.max(0, slot.pp - move.reduceLastMovePp);
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, {
        ...latestTarget, moves: latestTarget.moves.map((current, index) => index === slotIndex ? { ...current, pp: ppRemaining } : current),
      });
      events.push({ type: 'movePpReduced', side: targetSide, creatureId: latestTarget.instanceId, moveId: slot.moveId, amount: slot.pp - ppRemaining, ppRemaining });
    }
    return state;
  }
  if (move.protectUser || move.endureUser) {
    const latestUser = active(state, side);
    const streak = latestUser.protectionStreak ?? 0;
    const succeeds = streak === 0 || random(cursor) < 1 / (2 ** streak);
    if (!succeeds) {
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, protectionStreak: undefined });
      events.push({ type: 'protectionFailed', side, creatureId: latestUser.instanceId });
    } else {
      state = setCreature(state, side, sideState(state, side).activeIndex, {
        ...latestUser,
        protectionStreak: streak + 1,
        protectedThisTurn: move.protectUser ? true : latestUser.protectedThisTurn,
        endureThisTurn: move.endureUser ? true : latestUser.endureThisTurn,
      });
      events.push({ type: 'protectionApplied', side, creatureId: latestUser.instanceId, kind: move.endureUser ? 'endure' : 'protect' });
    }
    return state;
  }
  if (move.requiresFirstTurnAfterEntry && state.turn !== (user.enteredBattleTurn ?? 0) + 1) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.substitute) {
    const current = active(state, side);
    const substituteHp = Math.max(1, Math.floor(current.stats.maxHp / 4));
    if (current.substituteHp !== undefined || current.hp <= substituteHp) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    } else {
      state = setCreature(state, side, sideState(state, side).activeIndex,
        { ...current, hp: current.hp - substituteHp, substituteHp });
      events.push({ type: 'substituteCreated', side, creatureId: current.instanceId, hp: substituteHp });
    }
    return state;
  }
  if (move.bellyDrum) {
    const current = active(state, side);
    const cost = Math.floor(current.stats.maxHp / 2);
    if (current.hp <= cost || (current.statStages?.attack ?? 0) >= MAX_STAT_STAGE) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const hp = current.hp - cost;
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...current, hp, statStages: { ...current.statStages, attack: MAX_STAT_STAGE } });
    events.push({ type: 'hpSacrificed', side, creatureId: current.instanceId, moveId: move.id, amount: cost });
    events.push({ type: 'statStageChanged', side, creatureId: current.instanceId, stat: 'attack', change: MAX_STAT_STAGE - (current.statStages?.attack ?? 0), stage: MAX_STAT_STAGE });
    return state;
  }
  if (move.requiresSleepingTarget && target.status?.status !== 'sleep') {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.nightmareMove) {
    const latestTarget = active(state, targetSide);
    if (latestTarget.nightmareActive) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    else {
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget, nightmareActive: true });
      events.push({ type: 'nightmareApplied', side: targetSide, creatureId: latestTarget.instanceId });
    }
    return state;
  }
  if (move.requiresMissingHp && user.hp >= user.stats.maxHp) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.requiresStatusFree && (user.status || target.status)) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.id === 'rest' && user.status?.status === 'sleep') {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.escapeBattle) {
    if (state.battleType === 'wild' && !user.trapTurnsRemaining) return endBattle(state, { kind: 'fled', side }, events);
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    return state;
  }
  if (move.transformTarget) {
    const latestUser = active(state, side);
    if (latestUser.transformOriginal) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const copiedStages = Object.fromEntries(['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'].flatMap(stat => {
      const stage = target.statStages?.[stat as keyof NonNullable<BattleCreature['statStages']>];
      return stage === undefined ? [] : [[stat, stage]];
    })) as BattleCreature['statStages'];
    state = setCreature(state, side, sideState(state, side).activeIndex, {
      ...latestUser,
      types: [...target.types],
      weightKg: target.weightKg,
      abilityId: target.abilityId,
      abilityOriginalId: latestUser.abilityOriginalId ?? latestUser.abilityId,
      stats: { ...latestUser.stats, attack: target.stats.attack, defense: target.stats.defense, specialAttack: target.stats.specialAttack, specialDefense: target.stats.specialDefense, speed: target.stats.speed },
      moves: target.moves.map(slot => ({ moveId: slot.moveId, pp: 5 })),
      statStages: copiedStages,
      transformOriginal: { types: [...latestUser.types], typeChangeOriginal: latestUser.typeChangeOriginal ? [...latestUser.typeChangeOriginal] : undefined, weightKg: latestUser.weightKg, abilityId: latestUser.abilityOriginalId ?? latestUser.abilityId, stats: { ...latestUser.stats }, moves: latestUser.moves.map(slot => ({ ...slot })), statStages: latestUser.statStages ? { ...latestUser.statStages } : undefined },
    });
    return state;
  }
  if (move.setTargetAbility) {
    const latestTarget = active(state, targetSide);
    if (!latestTarget.abilityId || latestTarget.abilityId === move.setTargetAbility || ['truant', 'multitype'].includes(latestTarget.abilityId)) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, {
      ...latestTarget, abilityId: move.setTargetAbility,
      abilityOriginalId: latestTarget.abilityOriginalId ?? latestTarget.abilityId,
      flashFireActive: undefined,
    });
    events.push({ type: 'abilityChanged', side: targetSide, creatureId: latestTarget.instanceId,
      previousAbilityId: latestTarget.abilityId, abilityId: move.setTargetAbility, sourceMoveId: move.id });
    return state;
  }
  if (move.copyTargetAbility) {
    const latestUser = active(state, side);
    if (!latestUser.abilityId || !target.abilityId || latestUser.abilityId === target.abilityId) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, abilityId: target.abilityId, abilityOriginalId: latestUser.abilityOriginalId ?? latestUser.abilityId, flashFireActive: undefined });
    events.push({ type: 'abilityChanged', side, creatureId: latestUser.instanceId, previousAbilityId: latestUser.abilityId, abilityId: target.abilityId, sourceMoveId: move.id });
    return state;
  }
  const baseAccuracy = move.oneHitKO ? Math.max(0, Math.min(100, move.accuracy + user.level - target.level)) : move.accuracy;
  const accuracyMove = { ...move, accuracy: baseAccuracy };
  if ((target.semiInvulnerableState && !move.hitsSemiInvulnerable?.includes(target.semiInvulnerableState) && !lockOnApplies) ||
      (!(move.alwaysHits || lockOnApplies) && random(cursor) * 100 >= (emergency ? 100 : effectiveMoveAccuracy(user, target, accuracyMove, state.weather?.kind, (state.gravityTurnsRemaining ?? 0) > 0)))) {
    events.push({ type: 'moveMissed', side, moveId: move.id });
    return endRepeatedMoveOnFailure(applyCrashDamage(state, side, targetSide, move, damageMove, rules, cursor, events), side, move);
  }
  if (move.breaksScreens) {
    const targetField = sideState(state, targetSide);
    if (targetField.reflectTurnsRemaining) events.push({ type: 'screenEnded', side: targetSide, screen: 'reflect' });
    if (targetField.lightScreenTurnsRemaining) events.push({ type: 'screenEnded', side: targetSide, screen: 'lightScreen' });
    state = { ...state, [targetSide]: { ...targetField, reflectTurnsRemaining: undefined, lightScreenTurnsRemaining: undefined } };
  }
  if (move.preventsEscape) {
    state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...active(state, targetSide), escapeBlockedBy: user.instanceId });
    events.push({ type: 'escapeBlocked', side: targetSide, creatureId: target.instanceId, moveId: move.id });
    return state;
  }
  if (move.category === 'status' && move.statusAffectedByTypeImmunity && move.inflictedStatus &&
      (effectivenessFor(target.types, move.type, rules.typeChart) === 0 || abilityPreventsMove(target, move, (state.gravityTurnsRemaining ?? 0) > 0))) {
    events.push({ type: 'statusPrevented', side: targetSide, status: move.inflictedStatus, reason: abilityPreventsMove(target, move, (state.gravityTurnsRemaining ?? 0) > 0) ? 'ability' : 'immune' });
    return state;
  }

  if (move.futureSight) {
    const field = sideState(state, targetSide);
    if (field.futureSight) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
      return state;
    }
    const screen = field.lightScreenTurnsRemaining ? 0.5 : 1;
    const variance = rules.minimumDamageVariance + random(cursor) * (rules.maximumDamageVariance - rules.minimumDamageVariance);
    const storedDamage = calculateHitDamage(user, target, move, rules, { critical: false, variance, weather: state.weather?.kind,
      screenMultiplier: screen, fieldPowerMultiplier: typeFieldPowerMultiplier(state, move.type), gravityActive: (state.gravityTurnsRemaining ?? 0) > 0 }).amount;
    state = { ...state, [targetSide]: { ...field, futureSight: { turnsRemaining: 3, damage: storedDamage, sourceCreatureId: user.instanceId, sourceMoveId: move.id } } };
    events.push({ type: 'futureSightScheduled', side: targetSide, turnsRemaining: 3 });
    return state;
  }

  if (move.leechSeedFraction) {
    if (target.types.includes('grass') || target.leechSeed) {
      events.push({ type: 'leechSeedPrevented', side: targetSide, creatureId: target.instanceId, reason: target.types.includes('grass') ? 'immune' : 'alreadySeeded' });
    } else {
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, {
        ...target, leechSeed: { sourceSide: side, fraction: move.leechSeedFraction, moveId: move.id },
      });
      events.push({ type: 'leechSeedApplied', side: targetSide, creatureId: target.instanceId });
    }
  }

  if (dealsDamage) {
    let hitCount = 1;
    if (move.minHits !== undefined) {
      if (move.minHits === 2 && move.maxHits === 5) {
        const roll = integerBetween(cursor, 1, 8);
        hitCount = roll <= 3 ? 2 : roll <= 6 ? 3 : roll === 7 ? 4 : 5;
      } else hitCount = move.minHits === move.maxHits ? move.minHits : integerBetween(cursor, move.minHits, move.maxHits ?? move.minHits);
    }
    let dealt = 0;
    for (let hit = 0; hit < hitCount && active(state, targetSide).hp > 0; hit++) {
      const currentTarget = active(state, targetSide);
      const criticalStage = Math.min(4, (user.criticalStage ?? 0) + (move.criticalStageBoost ?? 0));
      const criticalChance = Math.min(0.5, rules.criticalChance * 2 ** criticalStage);
      const fixedDamage = damageMove.fixedDamage !== undefined || move.damageByUserLevel || move.targetHpFraction !== undefined || move.endeavorDamage || move.oneHitKO;
      const critical = !fixedDamage && target.abilityId !== 'shell-armor' && !(sideState(state, targetSide).luckyChantTurnsRemaining ?? 0) && random(cursor) < criticalChance;
      const variance = !fixedDamage && !move.ignoresDamageVariance
        ? rules.minimumDamageVariance + random(cursor) * (rules.maximumDamageVariance - rules.minimumDamageVariance) : 1;
      const targetField = sideState(state, targetSide);
      const screenUp = move.category === 'physical' ? targetField.reflectTurnsRemaining : targetField.lightScreenTurnsRemaining;
      const { amount: calculatedAmount, effectiveness } = calculateHitDamage(user, currentTarget, damageMove, rules, {
        critical, variance, emergency, weather: state.weather?.kind, fieldPowerMultiplier: typeFieldPowerMultiplier(state, damageMove.type),
        screenMultiplier: screenUp ? 0.5 : 1, gravityActive: (state.gravityTurnsRemaining ?? 0) > 0,
      });
      const amount = calculatedAmount > 0 && move.damageMultiplier !== undefined
        ? Math.max(1, Math.floor(calculatedAmount * move.damageMultiplier)) : calculatedAmount;
      const boundedAmount = move.leavesTargetAtOneHp || currentTarget.endureThisTurn ? Math.min(amount, Math.max(0, currentTarget.hp - 1)) : amount;
      const hitsSubstitute = currentTarget.substituteHp !== undefined;
      const substituteHpRemaining = hitsSubstitute ? Math.max(0, currentTarget.substituteHp! - boundedAmount) : undefined;
      const hp = hitsSubstitute ? currentTarget.hp : Math.max(0, currentTarget.hp - boundedAmount);
      const actual = currentTarget.hp - hp;
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, {
        ...currentTarget, hp, substituteHp: hitsSubstitute && substituteHpRemaining! > 0 ? substituteHpRemaining : undefined,
        lastDamagingMoveId: actual > 0 ? move.id : currentTarget.lastDamagingMoveId,
      });
      if (hitsSubstitute) {
        events.push({ type: 'substituteDamaged', side: targetSide, creatureId: currentTarget.instanceId,
          damage: Math.min(currentTarget.substituteHp!, boundedAmount), hpRemaining: substituteHpRemaining! });
      }
      dealt += actual;
      if (actual > 0) damagingMoveConnected = true;
      if (actual > 0 && move.makesContact && active(state, side).hp > 0) {
        const defender = active(state, targetSide);
        const contactStatus = defender.abilityId === 'static' ? 'paralysis'
          : defender.abilityId === 'poison-point' ? 'poison'
            : defender.abilityId === 'flame-body' ? 'burn' : undefined;
        const effectSpore = defender.abilityId === 'effect-spore';
        if ((effectSpore || contactStatus) && random(cursor) < 0.3) {
          events.push({ type: 'abilityActivated', side: targetSide, creatureId: defender.instanceId, abilityId: defender.abilityId! });
          const status = contactStatus ?? (['sleep', 'poison', 'paralysis'][Math.floor(random(cursor) * 3)] as MajorStatus);
          state = applyStatus(state, side, active(state, side), status, cursor, rules, events);
        }
        const attacker = active(state, side);
        const charmHolder = active(state, targetSide);
        if (charmHolder.abilityId === 'cute-charm' && attacker.abilityId !== 'oblivious' && attacker.gender &&
            attacker.gender !== 'genderless' && charmHolder.gender && charmHolder.gender !== 'genderless' &&
            attacker.gender !== charmHolder.gender && !attacker.infatuatedBy && random(cursor) < 0.3) {
          state = setCreature(state, side, sideState(state, side).activeIndex, { ...attacker, infatuatedBy: charmHolder.instanceId });
          events.push({ type: 'infatuationApplied', side, creatureId: attacker.instanceId, sourceCreatureId: charmHolder.instanceId });
        }
      }
      if (!hitsSubstitute) events.push({ type: 'damageApplied', sourceSide: side, targetSide, targetCreatureId: currentTarget.instanceId, moveId: move.id, amount: actual, effectiveness, critical });
      const hitTarget = active(state, targetSide);
      if (actual > 0 && side !== targetSide && hitTarget.rageActive) {
        const previousAttack = hitTarget.statStages?.attack ?? 0;
        const attack = Math.min(MAX_STAT_STAGE, previousAttack + 1);
        state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex,
          { ...hitTarget, statStages: { ...hitTarget.statStages, attack }, rageActive: true });
        if (attack > previousAttack) events.push({ type: 'statStageChanged', side: targetSide, creatureId: hitTarget.instanceId, stat: 'attack', change: attack - previousAttack, stage: attack });
        else events.push({ type: 'statStageLimited', side: targetSide, creatureId: hitTarget.instanceId, stat: 'attack', stage: attack });
      }
      if (hp === 0) {
        events.push({ type: 'creatureFainted', side: targetSide, creatureId: currentTarget.instanceId });
        if (actual > 0 && currentTarget.destinyBondActive) {
          const attacker = active(state, side);
          if (attacker.hp > 0) {
            state = setCreature(state, side, sideState(state, side).activeIndex, { ...attacker, hp: 0 });
            events.push({ type: 'creatureFainted', side, creatureId: attacker.instanceId });
          }
        }
        if (actual > 0 && currentTarget.grudgeActive) {
          const attacker = active(state, side);
          const slot = attacker.moves.findIndex(item => item.moveId === move.id);
          if (slot >= 0 && attacker.moves[slot].pp > 0) {
            const amount = attacker.moves[slot].pp;
            state = setCreature(state, side, sideState(state, side).activeIndex, { ...attacker,
              moves: attacker.moves.map((item, index) => index === slot ? { ...item, pp: 0 } : item) });
            events.push({ type: 'movePpReduced', side, creatureId: attacker.instanceId, moveId: move.id, amount, ppRemaining: 0 });
          }
        }
        if (!emergency && !move.recoilPercent) state = awardExperience(state, side, user.instanceId, currentTarget, rules, events);
      }
    }
    if (!damagingMoveConnected) state = endRepeatedMoveOnFailure(applyCrashDamage(state, side, targetSide, move, damageMove, rules, cursor, events), side, move);
    if (move.hazardEffect === 'rapidSpin' && damagingMoveConnected) {
      const latestUser = active(state, side);
      if (latestUser.leechSeed) {
        state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, leechSeed: undefined });
        events.push({ type: 'leechSeedCured', side, creatureId: latestUser.instanceId });
      }
      const latest = active(state, side);
      if (latest.trappedBy || latest.escapeBlockedBy) {
        state = setCreature(state, side, sideState(state, side).activeIndex, { ...latest, trappedBy: undefined, trapTurnsRemaining: undefined, trapDamageFraction: undefined, escapeBlockedBy: undefined });
        if (latest.trappedBy) events.push({ type: 'trappingEnded', side, creatureId: latest.instanceId });
      }
      const field = sideState(state, side);
      if (field.spikesLayers) events.push({ type: 'hazardCleared', side, hazard: 'spikes' });
      if (field.toxicSpikesLayers) events.push({ type: 'hazardCleared', side, hazard: 'toxicSpikes' });
      state = { ...state, [side]: { ...field, spikesLayers: undefined, toxicSpikesLayers: undefined } };
    }
    if (move.rechargesNextTurn && active(state, side).hp > 0) {
      const latestUser = active(state, side);
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, mustRecharge: true });
      events.push({ type: 'rechargeRequired', side, creatureId: latestUser.instanceId });
    }
    if (abilityPreventsTypeDamage(target, move.type)) {
      const latestTarget = active(state, targetSide);
      if (latestTarget.abilityId === 'flash-fire' && !latestTarget.flashFireActive) {
        state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget, flashFireActive: true });
        events.push({ type: 'abilityActivated', side: targetSide, creatureId: latestTarget.instanceId, abilityId: 'flash-fire' });
      } else if ((latestTarget.abilityId === 'volt-absorb' || latestTarget.abilityId === 'water-absorb') && latestTarget.hp > 0) {
        const healed = Math.min(latestTarget.stats.maxHp - latestTarget.hp, Math.max(1, Math.floor(latestTarget.stats.maxHp / 4)));
        if (healed > 0) {
          state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget, hp: latestTarget.hp + healed });
          events.push({ type: 'healingApplied', side: targetSide, creatureId: latestTarget.instanceId, moveId: move.id, amount: healed });
        }
        events.push({ type: 'abilityActivated', side: targetSide, creatureId: latestTarget.instanceId, abilityId: latestTarget.abilityId! });
      }
    }
    // Ordinary recoil uses damage actually removed, including an overkill cap.
    // Resolve it before XP so a recoil KO cannot level up or evolve the attacker.
    if (!emergency && move.recoilPercent && dealt > 0 && active(state, side).abilityId !== 'rock-head') {
      const latestUser = active(state, side);
      const recoil = Math.min(latestUser.hp, Math.max(1, Math.floor(dealt * move.recoilPercent / 100)));
      const hp = latestUser.hp - recoil;
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, hp });
      events.push({ type: 'recoilApplied', side, creatureId: latestUser.instanceId, moveId: move.id, amount: recoil });
      if (hp === 0) {
        events.push({ type: 'creatureFainted', side, creatureId: latestUser.instanceId });
        const survivor = active(state, targetSide);
        if (survivor.hp > 0) state = awardExperience(state, targetSide, survivor.instanceId, latestUser, rules, events);
      } else if (active(state, targetSide).hp === 0) state = awardExperience(state, side, user.instanceId, target, rules, events);
    }
    if (!emergency && move.drainPercent && dealt > 0) {
      const latestUser = active(state, side);
      const healed = Math.min(latestUser.stats.maxHp - latestUser.hp, Math.max(1, Math.floor(dealt * move.drainPercent / 100)));
      if (healed > 0) {
        state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, hp: latestUser.hp + healed });
        events.push({ type: 'healingApplied', side, creatureId: latestUser.instanceId, moveId: move.id, amount: healed });
      }
    }
  }

  if (emergency) {
    const latestUser = active(state, side);
    const recoil = Math.max(1, Math.ceil(latestUser.stats.maxHp * rules.emergencyMove.recoilFraction));
    const hp = Math.max(0, latestUser.hp - recoil);
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, hp });
    events.push({ type: 'recoilApplied', side, creatureId: user.instanceId, moveId: move.id, amount: latestUser.hp - hp });
    if (hp === 0) {
      events.push({ type: 'creatureFainted', side, creatureId: user.instanceId });
      const survivor = active(state, targetSide);
      if (survivor.hp > 0) state = awardExperience(state, targetSide, survivor.instanceId, latestUser, rules, events);
    } else if (active(state, targetSide).hp === 0) state = awardExperience(state, side, user.instanceId, target, rules, events);
  }

  if (!emergency && move.faintUserAfterMove) {
    const latestUser = active(state, side);
    if (latestUser.hp > 0) {
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, hp: 0 });
      events.push({ type: 'creatureFainted', side, creatureId: latestUser.instanceId });
      const survivor = active(state, targetSide);
      if (survivor.hp > 0) state = awardExperience(state, targetSide, survivor.instanceId, latestUser, rules, events);
    }
  }

  if (move.trapTarget && damagingMoveConnected && active(state, targetSide).hp > 0) {
    const trapped = active(state, targetSide);
    const turns = integerBetween(cursor, move.trapTarget.minTurns, move.trapTarget.maxTurns);
    state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, {
      ...trapped, trappedBy: user.instanceId, trapTurnsRemaining: turns, trapDamageFraction: move.trapTarget.damageFraction,
    });
    events.push({ type: 'trappingApplied', side: targetSide, creatureId: trapped.instanceId, moveId: move.id, turns });
  }
  if (move.disableLastMove && damagingMoveConnected) {
    const latestTarget = active(state, targetSide);
    if (latestTarget.lastUsedMoveId && !(latestTarget.disableTurnsRemaining && latestTarget.disableTurnsRemaining > 0)) {
      const turns = integerBetween(cursor, move.disableMinTurns ?? 1, move.disableMaxTurns ?? 8);
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, {
        ...latestTarget, disabledMoveId: latestTarget.lastUsedMoveId, disableTurnsRemaining: turns,
      });
      events.push({ type: 'moveDisabled', side: targetSide, creatureId: latestTarget.instanceId, moveId: latestTarget.lastUsedMoveId, turns });
    } else if (!latestTarget.lastUsedMoveId || (latestTarget.disableTurnsRemaining ?? 0) > 0) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
  }
  if (move.encoreTarget && active(state, targetSide).hp > 0) {
    const latestTarget = active(state, targetSide);
    const lastMove = latestTarget.lastUsedMoveId;
    const slot = latestTarget.moves.find(item => item.moveId === lastMove);
    const forbidden = new Set(['encore', 'mimic', 'mirror-move', 'sketch', 'struggle', 'transform']);
    if (!lastMove || !slot || slot.pp <= 0 || forbidden.has(lastMove) || (latestTarget.encoreTurnsRemaining ?? 0) > 0) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    } else {
      const turns = integerBetween(cursor, 4, 8);
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestTarget, encoredMoveId: lastMove, encoreTurnsRemaining: turns });
      events.push({ type: 'moveEncored', side: targetSide, creatureId: latestTarget.instanceId, moveId: lastMove, turns });
    }
  }
  if (move.mimic) {
    const currentUser = active(state, side);
    const currentTarget = active(state, targetSide);
    const copiedId = currentTarget.lastUsedMoveId;
    const copied = copiedId ? catalog[copiedId] : undefined;
    const banned = new Set(['chatter', 'metronome', 'mimic', 'sketch', 'struggle']);
    const slotIndex = command.kind === 'useMove' ? command.moveSlot : -1;
    const targetFailedMoveThisTurn = events.some(event => event.type === 'moveFailed' && event.side === targetSide);
    if (currentUser.transformOriginal || currentUser.mimicOriginalMoveSlot || !copied || targetFailedMoveThisTurn || banned.has(copied.id) ||
        currentUser.moves.some((slot, index) => index !== slotIndex && slot.moveId === copied.id)) {
      events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    } else {
      const originalSlot = currentUser.moves[slotIndex];
      const moves = currentUser.moves.map((slot, index) => index === slotIndex ? { moveId: copied.id, pp: Math.min(5, copied.maxPp) } : slot);
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...currentUser, moves,
        mimicOriginalMoveSlot: { index: slotIndex, slot: { ...originalSlot } } });
      events.push({ type: 'moveCopied', side, creatureId: currentUser.instanceId, moveId: copied.id });
    }
    return state;
  }
  if (move.destinyBond || move.grudge) {
    const current = active(state, side);
    if (move.destinyBond) {
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...current, destinyBondActive: true });
      events.push({ type: 'destinyBondActivated', side, creatureId: current.instanceId });
    } else {
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...current, grudgeActive: true });
      events.push({ type: 'grudgeActivated', side, creatureId: current.instanceId });
    }
  }

  for (const effect of move.statChanges ?? []) {
    if (!damagingMoveConnected || (move.category !== 'status' && effect.target === 'opponent' && active(state, targetSide).abilityId === 'shield-dust') ||
        ((move.statChangeChance ?? 100) < 100 && random(cursor) * 100 >= (move.statChangeChance ?? 100))) continue;
    const affectedSide = effect.target === 'self' ? side : targetSide;
    const affected = active(state, affectedSide);
    if (affected.hp <= 0) continue;
    if (effect.stat === 'evasion' && effect.stages > 0 && (affected.foresightActive || affected.miracleEyeActive)) {
      events.push({ type: 'statStageLimited', side: affectedSide, creatureId: affected.instanceId, stat: 'evasion', stage: affected.statStages?.evasion ?? 0 });
      continue;
    }
    if (effect.target === 'opponent' && effect.stages < 0 && (sideState(state, affectedSide).mistTurnsRemaining ?? 0) > 0) continue;
    if (effect.target === 'opponent' && effect.stages < 0 &&
        (affected.abilityId === 'clear-body' || (affected.abilityId === 'hyper-cutter' && effect.stat === 'attack') || (affected.abilityId === 'keen-eye' && effect.stat === 'accuracy'))) {
      events.push({ type: 'statStageLimited', side: affectedSide, creatureId: affected.instanceId, stat: effect.stat, stage: affected.statStages?.[effect.stat] ?? 0 });
      continue;
    }
    const previous = affected.statStages?.[effect.stat] ?? 0;
    const stage = Math.max(MIN_STAT_STAGE, Math.min(MAX_STAT_STAGE, previous + effect.stages));
    if (stage === previous) {
      events.push({ type: 'statStageLimited', side: affectedSide, creatureId: affected.instanceId, stat: effect.stat, stage });
    } else {
      state = setCreature(state, affectedSide, sideState(state, affectedSide).activeIndex, {
        ...affected, statStages: { ...affected.statStages, [effect.stat]: stage },
      });
      events.push({ type: 'statStageChanged', side: affectedSide, creatureId: affected.instanceId, stat: effect.stat, change: stage - previous, stage });
    }
  }
  if (move.stockpile) {
    const latestUser = active(state, side);
    state = setCreature(state, side, sideState(state, side).activeIndex, {
      ...latestUser,
      stockpileCount: stockpileCount + 1,
      stockpileDefenseGain: (user.stockpileDefenseGain ?? 0) + (latestUser.statStages?.defense ?? 0) - (user.statStages?.defense ?? 0),
      stockpileSpecialDefenseGain: (user.stockpileSpecialDefenseGain ?? 0) + (latestUser.statStages?.specialDefense ?? 0) - (user.statStages?.specialDefense ?? 0),
    });
  }
  if (move.randomStatBoost) {
    const current = active(state, side);
    const candidates = (['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'] as const)
      .filter(stat => (current.statStages?.[stat] ?? 0) < MAX_STAT_STAGE);
    if (!candidates.length) events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noEffect' });
    else {
      const stat = candidates[Math.floor(random(cursor) * candidates.length)];
      const stage = Math.min(MAX_STAT_STAGE, (current.statStages?.[stat] ?? 0) + 2);
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...current, statStages: { ...current.statStages, [stat]: stage } });
      events.push({ type: 'statStageChanged', side, creatureId: current.instanceId, stat, change: stage - (current.statStages?.[stat] ?? 0), stage });
    }
  }

  const chance = move.statusChance ?? (move.category === 'status' && move.inflictedStatus ? 100 : 0);
  const statusSide = move.statusTarget === 'self' ? side : targetSide;
  if (move.replacesUserStatusWithInflictedStatus && active(state, side).status) {
    const latestUser = active(state, side);
    events.push({ type: 'statusCured', side, creatureId: latestUser.instanceId, status: latestUser.status!.status });
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, status: undefined });
  }
  if (move.curesUserStatuses) {
    const latestUser = active(state, side);
    if (latestUser.status && move.curesUserStatuses.includes(latestUser.status.status)) {
      events.push({ type: 'statusCured', side, creatureId: latestUser.instanceId, status: latestUser.status.status });
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, status: undefined });
    }
  }
  if (move.wakesTargetIfAsleep && damagingMoveConnected) {
    const latestEnemy = active(state, targetSide);
    if (latestEnemy.status?.status === 'sleep') {
      events.push({ type: 'statusCured', side: targetSide, creatureId: latestEnemy.instanceId, status: 'sleep' });
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...latestEnemy, status: undefined });
    }
  }
  if (move.curesPartyStatuses || move.curesPartyConfusion) {
    const party = sideState(state, side);
    const creatures = party.creatures.map(creature => {
      let cured = creature;
      if (move.curesPartyStatuses && cured.status && !(move.soundMove && cured.abilityId === 'soundproof')) {
        events.push({ type: 'statusCured', side, creatureId: cured.instanceId, status: cured.status.status });
        cured = { ...cured, status: undefined };
      }
      if (move.curesPartyConfusion && (cured.confusionTurnsRemaining ?? 0) > 0) {
        events.push({ type: 'confusionCured', side, creatureId: cured.instanceId });
        cured = { ...cured, confusionTurnsRemaining: undefined };
      }
      return cured;
    });
    state = { ...state, [side]: { ...party, creatures } };
  }
  const latestTarget = active(state, statusSide);
  if ((move.inflictedStatus || move.inflictedBadlyPoisoned) && damagingMoveConnected && latestTarget.hp > 0 && latestTarget.abilityId !== 'shield-dust' && random(cursor) * 100 < chance) {
    state = applyStatus(state, statusSide, latestTarget, move.inflictedBadlyPoisoned ? 'poison' : move.inflictedStatus!, cursor, rules, events,
      move.minStatusTurns === undefined ? undefined : [move.minStatusTurns, move.maxStatusTurns!], true, move.inflictedBadlyPoisoned ? 1 : undefined);
  }
  if (move.randomInflictedStatuses?.length && damagingMoveConnected && latestTarget.hp > 0 && latestTarget.abilityId !== 'shield-dust' && random(cursor) * 100 < chance) {
    const inflicted = move.randomInflictedStatuses[Math.floor(random(cursor) * move.randomInflictedStatuses.length)];
    state = applyStatus(state, statusSide, active(state, statusSide), inflicted, cursor, rules, events);
  }
  if (move.inflictedConfusionChance !== undefined && damagingMoveConnected && active(state, targetSide).hp > 0 && active(state, targetSide).abilityId !== 'shield-dust' && random(cursor) * 100 < move.inflictedConfusionChance) {
    const confused = active(state, targetSide);
    if ((confused.confusionTurnsRemaining ?? 0) > 0) events.push({ type: 'confusionPrevented', side: targetSide, creatureId: confused.instanceId, reason: 'alreadyConfused' });
      else if ((sideState(state, targetSide).safeguardTurnsRemaining ?? 0) > 0) events.push({ type: 'confusionPrevented', side: targetSide, creatureId: confused.instanceId, reason: 'safeguard' });
      else if (confused.abilityId === 'own-tempo') events.push({ type: 'confusionPrevented', side: targetSide, creatureId: confused.instanceId, reason: 'ownTempo' });
    else {
      const turns = integerBetween(cursor, move.minConfusionTurns ?? 2, move.maxConfusionTurns ?? 5);
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...confused, confusionTurnsRemaining: turns });
      events.push({ type: 'confusionApplied', side: targetSide, creatureId: confused.instanceId, turns });
    }
  }
  const flinchTarget = active(state, targetSide);
  if (move.flinchChance && dealsDamage && damagingMoveConnected && flinchTarget.hp > 0 && flinchTarget.abilityId !== 'inner-focus' && flinchTarget.abilityId !== 'shield-dust' &&
      context.pendingCreatureIds.has(flinchTarget.instanceId) && random(cursor) * 100 < move.flinchChance) {
    context.flinchedCreatureIds.add(flinchTarget.instanceId);
  }
  const healingPercent = move.swallow ? [25, 50, 100][stockpileCount - 1] : move.healingPercent;
  if (healingPercent) {
    const latestUser = active(state, side);
    const healingFraction = move.weatherRecovery
      ? state.weather?.kind === 'sun' ? 2 / 3 : state.weather ? 1 / 4 : 1 / 2
      : healingPercent / 100;
    const healed = Math.min(latestUser.stats.maxHp - latestUser.hp, Math.floor(latestUser.stats.maxHp * healingFraction));
    if (healed > 0) {
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, hp: latestUser.hp + healed });
      events.push({ type: 'healingApplied', side, creatureId: latestUser.instanceId, moveId: move.id, amount: healed });
    }
  }
  if (move.criticalStageChange) {
    const latestUser = active(state, side);
    const stage = Math.max(0, Math.min(4, (latestUser.criticalStage ?? 0) + move.criticalStageChange));
    if (stage !== (latestUser.criticalStage ?? 0)) {
      state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, criticalStage: stage || undefined });
      events.push({ type: 'criticalStageChanged', side, creatureId: latestUser.instanceId, stage });
    }
  }
  if (confusionAfterLock) {
    const latestUser = active(state, side);
    if (latestUser.hp > 0) {
      if ((latestUser.confusionTurnsRemaining ?? 0) > 0) events.push({ type: 'confusionPrevented', side, creatureId: latestUser.instanceId, reason: 'alreadyConfused' });
      else if ((sideState(state, side).safeguardTurnsRemaining ?? 0) > 0) events.push({ type: 'confusionPrevented', side, creatureId: latestUser.instanceId, reason: 'safeguard' });
      else if (latestUser.abilityId === 'own-tempo') events.push({ type: 'confusionPrevented', side, creatureId: latestUser.instanceId, reason: 'ownTempo' });
      else {
        const turns = integerBetween(cursor, 2, 5);
        state = setCreature(state, side, sideState(state, side).activeIndex, { ...latestUser, confusionTurnsRemaining: turns });
        events.push({ type: 'confusionApplied', side, creatureId: latestUser.instanceId, turns });
      }
    }
  }
  return state;
}

function applyStatus(state: BattleState, side: BattleSide, target: BattleCreature, status: MajorStatus, cursor: RandomCursor, rules: BattleRules, events: BattleEvent[], durationOverride?: readonly [number, number], allowSynchronize = true, toxicCounter?: number): BattleState {
  if (target.status) {
    events.push({ type: 'statusPrevented', side, status, reason: 'alreadyAfflicted' });
    return state;
  }
  if ((sideState(state, side).safeguardTurnsRemaining ?? 0) > 0) {
    events.push({ type: 'statusPrevented', side, status, reason: 'safeguard' });
    return state;
  }
  if (target.types.some(type => rules.statusImmunities[type]?.includes(status))) {
    events.push({ type: 'statusPrevented', side, status, reason: 'immune' });
    return state;
  }
  if (status === 'sleep' && (active(state, 'player').uproarActive || active(state, 'opponent').uproarActive)) {
    events.push({ type: 'statusPrevented', side, status, reason: 'immune' });
    return state;
  }
  const abilityStatusImmunity = (target.abilityId === 'immunity' && status === 'poison') ||
    (target.abilityId === 'insomnia' && status === 'sleep') || (target.abilityId === 'vital-spirit' && status === 'sleep') ||
    (target.abilityId === 'limber' && status === 'paralysis') || (target.abilityId === 'water-veil' && status === 'burn');
  if (abilityStatusImmunity) {
    events.push({ type: 'statusPrevented', side, status, reason: 'ability' });
    return state;
  }
  const duration = durationOverride ?? (status === 'sleep' ? rules.sleepTurns : status === 'freeze' ? rules.freezeTurns : undefined);
  let turnsRemaining = duration ? integerBetween(cursor, duration[0], duration[1]) : undefined;
  if (status === 'sleep' && target.abilityId === 'early-bird' && turnsRemaining !== undefined) turnsRemaining = Math.max(1, Math.ceil(turnsRemaining / 2));
  const applied: StatusEffect = { status, turnsRemaining, ...(status === 'poison' && toxicCounter !== undefined ? { toxicCounter } : {}) };
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, status: applied });
  events.push({ type: 'statusApplied', side, creatureId: target.instanceId, status, turns: turnsRemaining });
  if (allowSynchronize && target.abilityId === 'synchronize' && ['burn', 'poison', 'paralysis'].includes(status)) {
    const sourceSide = otherSide(side);
    state = applyStatus(state, sourceSide, active(state, sourceSide), status, cursor, rules, events, undefined, false);
  }
  return state;
}

function applyDrowsiness(state: BattleState, side: BattleSide, cursor: RandomCursor, rules: BattleRules, events: BattleEvent[]): BattleState {
  const target = active(state, side);
  if (!target.drowsyTurnsRemaining || target.hp <= 0) return state;
  const remaining = target.drowsyTurnsRemaining - 1;
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, drowsyTurnsRemaining: remaining || undefined });
  if (remaining > 0) return state;
  events.push({ type: 'drowsinessEnded', side, creatureId: target.instanceId });
  const current = active(state, side);
  return applyStatus(state, side, current, 'sleep', cursor, rules, events);
}

function applyLeechSeed(state: BattleState, side: BattleSide, rules: BattleRules, events: BattleEvent[]): BattleState {
  const target = active(state, side);
  const seed = target.leechSeed;
  if (!seed || target.hp <= 0) return state;
  const recipient = active(state, seed.sourceSide);
  if (recipient.hp <= 0) return state;
  const damage = Math.min(target.hp, Math.max(1, Math.floor(target.stats.maxHp * seed.fraction)));
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp: target.hp - damage });
  events.push({ type: 'leechSeedTick', side, creatureId: target.instanceId, damage });
  const healed = Math.min(recipient.stats.maxHp - recipient.hp, damage);
  if (healed > 0) {
    state = setCreature(state, seed.sourceSide, sideState(state, seed.sourceSide).activeIndex, { ...recipient, hp: recipient.hp + healed });
    events.push({ type: 'healingApplied', side: seed.sourceSide, creatureId: recipient.instanceId, moveId: seed.moveId, amount: healed });
  }
  if (target.hp === damage) {
    events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
    state = awardExperience(state, seed.sourceSide, recipient.instanceId, target, rules, events);
  }
  return state;
}

function applyTrappingResidual(state: BattleState, side: BattleSide, rules: BattleRules, events: BattleEvent[]): BattleState {
  const target = active(state, side);
  if (!target.trapTurnsRemaining || target.trapTurnsRemaining < 1) return state;
  const sourceSide = otherSide(side);
  const source = active(state, sourceSide);
  if (source.hp <= 0 || source.instanceId !== target.trappedBy || target.hp <= 0) {
    events.push({ type: 'trappingEnded', side, creatureId: target.instanceId });
    return setCreature(state, side, sideState(state, side).activeIndex, { ...target, trappedBy: undefined, trapTurnsRemaining: undefined, trapDamageFraction: undefined });
  }
  const damage = Math.min(target.hp, Math.max(1, Math.floor(target.stats.maxHp * (target.trapDamageFraction ?? 1 / 16))));
  const turnsRemaining = target.trapTurnsRemaining - 1;
  const hp = target.hp - damage;
  state = setCreature(state, side, sideState(state, side).activeIndex, {
    ...target,
    hp,
    trappedBy: turnsRemaining > 0 && hp > 0 ? target.trappedBy : undefined,
    trapTurnsRemaining: turnsRemaining > 0 && hp > 0 ? turnsRemaining : undefined,
    trapDamageFraction: turnsRemaining > 0 && hp > 0 ? target.trapDamageFraction : undefined,
  });
  events.push({ type: 'trappingTick', side, creatureId: target.instanceId, damage, turnsRemaining: Math.max(0, turnsRemaining) });
  if (hp === 0) {
    events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
    state = awardExperience(state, sourceSide, source.instanceId, target, rules, events);
  } else if (turnsRemaining <= 0) events.push({ type: 'trappingEnded', side, creatureId: target.instanceId });
  return state;
}

function applyResidual(state: BattleState, side: BattleSide, rules: BattleRules, events: BattleEvent[]): BattleState {
  let target = active(state, side);
  if ((target.magnetRiseTurnsRemaining ?? 0) > 0) {
    const remaining = target.magnetRiseTurnsRemaining! - 1;
    target = { ...target, magnetRiseTurnsRemaining: remaining || undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, target);
    if (remaining === 0) events.push({ type: 'magnetRiseEnded', side, creatureId: target.instanceId });
  }
  if (target.disableTurnsRemaining && target.disableTurnsRemaining > 0) {
    const turns = target.disableTurnsRemaining - 1;
    target = { ...target, disabledMoveId: turns > 0 ? target.disabledMoveId : undefined, disableTurnsRemaining: turns > 0 ? turns : undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, target);
  }
  if (target.tauntTurnsRemaining && target.tauntTurnsRemaining > 0) {
    const turns = target.tauntTurnsRemaining - 1;
    target = { ...target, tauntTurnsRemaining: turns > 0 ? turns : undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, target);
    if (!turns) events.push({ type: 'tauntEnded', side, creatureId: target.instanceId });
  }
  if (target.hp <= 0) return state;
  if (target.chargeElectricBoostReadyAt !== undefined && state.turn >= target.chargeElectricBoostReadyAt) {
    target = { ...target, chargeElectricBoostReadyAt: undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, target);
  }
  for (const moveId of [target.aquaRingActive ? 'aqua-ring' : undefined, target.ingrainActive ? 'ingrain' : undefined]) {
    if (!moveId) continue;
    const amount = Math.min(target.stats.maxHp - target.hp, Math.max(1, Math.floor(target.stats.maxHp / 16)));
    if (amount > 0) {
      target = { ...target, hp: target.hp + amount };
      state = setCreature(state, side, sideState(state, side).activeIndex, target);
      events.push({ type: 'healingApplied', side, creatureId: target.instanceId, moveId, amount });
    }
  }
  if (target.nightmareActive && target.status?.status === 'sleep') {
    const damage = Math.max(1, Math.floor(target.stats.maxHp / 4));
    const hp = Math.max(0, target.hp - damage);
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp });
    events.push({ type: 'nightmareTick', side, creatureId: target.instanceId, damage: target.hp - hp });
    target = { ...target, hp };
    if (hp === 0) {
      events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
      const winner = otherSide(side);
      state = awardExperience(state, winner, active(state, winner).instanceId, target, rules, events);
      return state;
    }
  } else if (target.nightmareActive && target.status?.status !== 'sleep') {
    target = { ...target, nightmareActive: undefined };
    state = setCreature(state, side, sideState(state, side).activeIndex, target);
  }
  if (!target.status || (target.status.status !== 'burn' && target.status.status !== 'poison')) return state;
  const fraction = target.status.status === 'burn' ? rules.burnResidualFraction : rules.poisonResidualFraction;
  const toxicCounter = target.status.status === 'poison' ? target.status.toxicCounter : undefined;
  const damage = Math.max(1, Math.floor(target.stats.maxHp * (toxicCounter === undefined ? fraction : toxicCounter / 16)));
  const hp = Math.max(0, target.hp - damage);
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp,
    ...(toxicCounter === undefined || hp === 0 ? {} : { status: { ...target.status!, toxicCounter: Math.min(15, toxicCounter + 1) } }) });
  events.push({ type: 'statusTick', side, creatureId: target.instanceId, status: target.status.status, damage: target.hp - hp });
  if (hp === 0) {
    events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
    const winner = otherSide(side);
    const winnerCreature = active(state, winner);
    state = awardExperience(state, winner, winnerCreature.instanceId, target, rules, events);
  }
  return state;
}

function applyShedSkin(state: BattleState, side: BattleSide, cursor: RandomCursor, events: BattleEvent[]): BattleState {
  const current = active(state, side);
  if (current.hp <= 0 || current.abilityId !== 'shed-skin' || !current.status || random(cursor) >= 0.33) return state;
  events.push({ type: 'statusCured', side, creatureId: current.instanceId, status: current.status.status });
  return setCreature(state, side, sideState(state, side).activeIndex, { ...current, status: undefined });
}

function applyCurseResidual(state: BattleState, side: BattleSide, events: BattleEvent[]): BattleState {
  const target = active(state, side);
  if (!target.cursed || target.hp <= 0) return state;
  const damage = Math.min(target.hp, Math.max(1, Math.floor(target.stats.maxHp / 4)));
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp: target.hp - damage });
  events.push({ type: 'curseTick', side, creatureId: target.instanceId, damage });
  if (target.hp - damage === 0) events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
  return state;
}

function applyPerishSongResidual(state: BattleState, side: BattleSide, events: BattleEvent[]): BattleState {
  const target = active(state, side);
  if (target.hp <= 0 || target.perishCount === undefined) return state;
  const turnsRemaining = target.perishCount - 1;
  events.push({ type: 'perishSongTick', side, creatureId: target.instanceId, turnsRemaining });
  if (turnsRemaining <= 0) {
    state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp: 0, perishCount: undefined });
    events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
  } else state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, perishCount: turnsRemaining });
  return state;
}

function applyFutureSightResidual(state: BattleState, side: BattleSide, rules: BattleRules, events: BattleEvent[]): BattleState {
  const field = sideState(state, side);
  const pending = field.futureSight;
  if (!pending) return state;
  if (pending.turnsRemaining > 1) {
    return { ...state, [side]: { ...field, futureSight: { ...pending, turnsRemaining: pending.turnsRemaining - 1 } } };
  }
  state = { ...state, [side]: { ...field, futureSight: undefined } };
  const target = active(state, side);
  if (target.hp <= 0) return state;
  const damage = Math.min(target.hp, pending.damage);
  const hp = target.hp - damage;
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp });
  events.push({ type: 'futureSightHit', side, creatureId: target.instanceId, damage });
  if (hp === 0) {
    events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
    const sourceSide = otherSide(side);
    state = awardExperience(state, sourceSide, pending.sourceCreatureId, target, rules, events);
  }
  return state;
}

function applyWeatherResidual(state: BattleState, side: BattleSide, rules: BattleRules, events: BattleEvent[]): BattleState {
  const weather = state.weather;
  const target = active(state, side);
  if (!weather || target.hp <= 0) return state;
  const immune = weather.kind === 'hail' ? target.types.includes('ice')
    : weather.kind === 'sandstorm' && target.types.some(type => ['rock', 'ground', 'steel'].includes(type));
  if (immune || (weather.kind !== 'hail' && weather.kind !== 'sandstorm')) return state;
  const damage = Math.min(target.hp, Math.max(1, Math.floor(target.stats.maxHp / 16)));
  const hp = target.hp - damage;
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp });
  events.push({ type: 'weatherTick', side, creatureId: target.instanceId, damage, weather: weather.kind });
  if (hp === 0) {
    events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
    const winner = otherSide(side);
    state = awardExperience(state, winner, active(state, winner).instanceId, target, rules, events);
  }
  return state;
}

function advanceFieldEffects(state: BattleState, events: BattleEvent[]): BattleState {
  if (state.weather) {
    const turnsRemaining = state.weather.turnsRemaining - 1;
    if (turnsRemaining <= 0) {
      events.push({ type: 'weatherEnded', weather: state.weather.kind });
      state = { ...state, weather: undefined };
    } else state = { ...state, weather: { ...state.weather, turnsRemaining } };
  }
  if (state.gravityTurnsRemaining) {
    if (state.gravityTurnsRemaining <= 1) {
      state = { ...state, gravityTurnsRemaining: undefined };
      events.push({ type: 'gravityEnded' });
    } else state = { ...state, gravityTurnsRemaining: state.gravityTurnsRemaining - 1 };
  }
  for (const side of ['player', 'opponent'] as const) {
    let sideStateValue = sideState(state, side);
    sideStateValue = { ...sideStateValue, creatures: sideStateValue.creatures.map(creature => { const lockTurns = creature.lockOnTurnsRemaining; return { ...creature, roostedThisTurn: undefined, lockOnTurnsRemaining: lockTurns && lockTurns > 1 ? lockTurns - 1 : undefined, lockOnTargetInstanceId: lockTurns && lockTurns > 1 ? creature.lockOnTargetInstanceId : undefined }; }) };
    for (const screen of ['reflect', 'lightScreen'] as const) {
      const key = screen === 'reflect' ? 'reflectTurnsRemaining' : 'lightScreenTurnsRemaining';
      const remaining = sideStateValue[key];
      if (!remaining) continue;
      if (remaining <= 1) {
        events.push({ type: 'screenEnded', side, screen });
        sideStateValue = { ...sideStateValue, [key]: undefined };
      } else sideStateValue = { ...sideStateValue, [key]: remaining - 1 };
    }
    const safeguard = sideStateValue.safeguardTurnsRemaining;
    if (safeguard) {
      if (safeguard <= 1) {
        events.push({ type: 'safeguardEnded', side });
        sideStateValue = { ...sideStateValue, safeguardTurnsRemaining: undefined };
      } else sideStateValue = { ...sideStateValue, safeguardTurnsRemaining: safeguard - 1 };
    }
    const mist = sideStateValue.mistTurnsRemaining;
    if (mist) {
      if (mist <= 1) {
        events.push({ type: 'mistEnded', side });
        sideStateValue = { ...sideStateValue, mistTurnsRemaining: undefined };
      } else sideStateValue = { ...sideStateValue, mistTurnsRemaining: mist - 1 };
    }
    const luckyChant = sideStateValue.luckyChantTurnsRemaining;
    if (luckyChant) {
      if (luckyChant <= 1) {
        events.push({ type: 'luckyChantEnded', side });
        sideStateValue = { ...sideStateValue, luckyChantTurnsRemaining: undefined };
      } else sideStateValue = { ...sideStateValue, luckyChantTurnsRemaining: luckyChant - 1 };
    }
    const tailwind = sideStateValue.tailwindTurnsRemaining;
    if (tailwind) {
      if (tailwind <= 1) {
        events.push({ type: 'tailwindEnded', side });
        sideStateValue = { ...sideStateValue, tailwindTurnsRemaining: undefined };
      } else sideStateValue = { ...sideStateValue, tailwindTurnsRemaining: tailwind - 1 };
    }
    state = { ...state, [side]: sideStateValue };
  }
  return state;
}

function checkForWinner(state: BattleState, events: BattleEvent[]): BattleState {
  if (state.outcome.kind !== 'ongoing') return state;
  const playerLost = state.player.creatures.every(creature => creature.hp === 0);
  const opponentLost = state.opponent.creatures.every(creature => creature.hp === 0);
  if (!playerLost && !opponentLost) return state;
  if (playerLost && opponentLost) return endBattle(state, { kind: 'draw' }, events);
  const winner: BattleSide = playerLost ? 'opponent' : 'player';
  return endBattle(state, { kind: 'won', winner, reason: 'allFainted' }, events);
}

function awardExperience(state: BattleState, side: BattleSide, recipientId: string, defeated: BattleCreature, rules: BattleRules, events: BattleEvent[]): BattleState {
  if (side !== 'player' || defeated.experienceYield <= 0) return state;
  const team = sideState(state, side);
  const index = team.creatures.findIndex(creature => creature.instanceId === recipientId);
  if (index < 0) return state;
  const recipient = team.creatures[index];
  const reward = experienceForDefeat(defeated.experienceYield, defeated.level, state.battleType === 'trainer', rules.experienceRewards);
  events.push({ type: 'experienceGained', side, creatureId: recipient.instanceId, amount: reward, sourceCreatureId: defeated.instanceId });
  let moves = recipient.moves;
  const attempted = new Set(moves.map(slot => slot.moveId));
  let level = recipient.level;
  let experience = recipient.experience + reward;
  const curve = recipient.growthCurveId ? rules.experienceCurves[recipient.growthCurveId] : undefined;
  while (curve && recipient.baseStats && level < rules.maxLevel) {
    const required = experienceToNextLevel(level, curve);
    if (experience < required) break;
    experience -= required;
    const previousLevel = level++;
    events.push({ type: 'levelUp', side, creatureId: recipient.instanceId, previousLevel, level });
    for (const learning of rules.levelUpMoves[recipient.speciesId] ?? []) {
      if (learning.level !== level || attempted.has(learning.moveId)) continue;
      attempted.add(learning.moveId);
      if (moves.length >= rules.maxMoves) {
        events.push({ type: 'moveLearningSkipped', side, creatureId: recipient.instanceId, moveId: learning.moveId, reason: 'fullMoveSlots' });
      } else {
        moves = [...moves, { moveId: learning.moveId, pp: learning.maxPp }];
        events.push({ type: 'moveLearned', side, creatureId: recipient.instanceId, moveId: learning.moveId });
      }
    }
  }
  const stats = recipient.baseStats && level !== recipient.level
    ? calculateStats(recipient.baseStats, level)
    : recipient.stats;
  const maxHpIncrease = stats.maxHp - recipient.stats.maxHp;
  const hp = recipient.hp === 0 ? 0 : Math.min(stats.maxHp, recipient.hp + Math.max(0, maxHpIncrease));
  const updated = setCreature(state, side, index, { ...recipient, level, experience, stats, hp, moves });
  const reachedEvolution = rules.evolutions[recipient.speciesId]?.some(rule => level >= rule.minimumLevel);
  if ((level === recipient.level && !reachedEvolution) || updated.pendingLevelEvolutions.some(entry => entry.creatureId === recipientId)) return updated;
  return { ...updated, pendingLevelEvolutions: [...updated.pendingLevelEvolutions, { creatureId: recipientId, previousLevel: recipient.level }] };
}

/** Resolve evolution at the end of the XP-earning turn, including between trainer opponents.
 * Living XP recipients qualify after a level gain, or when already at an evolution threshold.
 */
function finalizeLevelEvolutions(state: BattleState, rules: BattleRules, events: BattleEvent[]): BattleState {
  if (state.outcome.kind === 'ongoing' || state.outcome.kind === 'won' && state.outcome.winner === 'player') {
    for (const pending of state.pendingLevelEvolutions) {
      const index = state.player.creatures.findIndex(creature => creature.instanceId === pending.creatureId);
      const recipient = state.player.creatures[index];
      if (!recipient || recipient.hp === 0) continue;
      const evolved = evolveAfterBattle(recipient, pending.previousLevel, rules, events);
      state = setCreature(state, 'player', index, evolved);
    }
  }
  return { ...state, pendingLevelEvolutions: [] };
}

function evolveAfterBattle(recipient: BattleCreature, previousLevel: number, rules: BattleRules, events: BattleEvent[]): BattleCreature {
  const side = 'player';
  let evolved = recipient;
  let moves = recipient.moves;
  const attempted = new Set(moves.map(slot => slot.moveId));
  const seenSpecies = new Set<number>([evolved.speciesId]);
  // A recovered evolution offers only this level's new-form moves, never older forgotten moves.
  const firstLearningLevel = previousLevel === recipient.level ? recipient.level : previousLevel + 1;
  while (true) {
    const rule = rules.evolutions[evolved.speciesId]?.find(candidate => evolved.level >= candidate.minimumLevel && !seenSpecies.has(candidate.target.speciesId));
    if (!rule) break;
    const previous = evolved;
    const target = rule.target;
    const evolvedStats = calculateStats(target.baseStats, evolved.level);
    const hpIncrease = evolvedStats.maxHp - evolved.stats.maxHp;
    evolved = {
      ...evolved,
      speciesId: target.speciesId,
      name: target.name,
      types: [...target.types],
      baseStats: { ...target.baseStats },
      abilityId: target.defaultAbilityId,
      weightKg: target.weightKg,
      growthCurveId: target.growthCurveId ?? evolved.growthCurveId,
      experienceYield: target.experienceYield,
      stats: evolvedStats,
      hp: evolved.hp === 0 ? 0 : Math.min(evolvedStats.maxHp, evolved.hp + Math.max(0, hpIncrease)),
    };
    seenSpecies.add(target.speciesId);
    events.push({ type: 'creatureEvolved', side, creatureId: evolved.instanceId, fromSpeciesId: previous.speciesId, fromName: previous.name, toSpeciesId: target.speciesId, toName: target.name, level: evolved.level });
    for (const learning of rules.levelUpMoves[target.speciesId] ?? []) {
      if (learning.level < firstLearningLevel || learning.level > evolved.level || attempted.has(learning.moveId)) continue;
      attempted.add(learning.moveId);
      if (moves.length >= rules.maxMoves) {
        events.push({ type: 'moveLearningSkipped', side, creatureId: evolved.instanceId, moveId: learning.moveId, reason: 'fullMoveSlots' });
      } else {
        moves = [...moves, { moveId: learning.moveId, pp: learning.maxPp }];
        evolved = { ...evolved, moves };
        events.push({ type: 'moveLearned', side, creatureId: evolved.instanceId, moveId: learning.moveId });
      }
    }
  }
  return evolved;
}

function endBattle(state: BattleState, outcome: Exclude<BattleOutcome, { kind: 'ongoing' }>, events: BattleEvent[]): BattleState {
  if (state.outcome.kind !== 'ongoing') return state;
  events.push({ type: 'battleEnded', outcome });
  const clearBattleEffects = (creature: BattleCreature) => ({ ...restoreTypeChange(restoreTransform(restoreMimic(creature))), status: creature.status?.toxicCounter === undefined ? creature.status : { ...creature.status, toxicCounter: 1 }, abilityId: creature.abilityOriginalId ?? creature.abilityId, abilityOriginalId: undefined, flashFireActive: undefined, criticalStage: undefined, infatuatedBy: undefined, cursed: undefined, nightmareActive: undefined, perishCount: undefined, substituteHp: undefined, magicCoatActive: undefined, lockedMoveId: undefined, lockedTurnsRemaining: undefined, chargingMoveId: undefined, semiInvulnerableState: undefined, escapeBlockedBy: undefined, drowsyTurnsRemaining: undefined, tauntTurnsRemaining: undefined, aquaRingActive: undefined, ingrainActive: undefined, mudSportActive: undefined, waterSportActive: undefined, chargeElectricBoostReadyAt: undefined, foresightActive: undefined, miracleEyeActive: undefined, roostedThisTurn: undefined, lockOnTargetInstanceId: undefined, lockOnTurnsRemaining: undefined, imprisonActive: undefined, stockpileCount: undefined, stockpileDefenseGain: undefined, stockpileSpecialDefenseGain: undefined, defenseCurlUsed: undefined, trappedBy: undefined, trapTurnsRemaining: undefined, trapDamageFraction: undefined, disabledMoveId: undefined, disableTurnsRemaining: undefined, encoredMoveId: undefined, encoreTurnsRemaining: undefined, uproarActive: undefined, destinyBondActive: undefined, grudgeActive: undefined, magnetRiseTurnsRemaining: undefined, usedMoveIdsThisEntry: undefined, lastDamagingMoveId: undefined, lastUsedMoveId: undefined, lastTargetingMoveId: undefined, lastTargetedByCreatureId: undefined, protectedThisTurn: undefined, endureThisTurn: undefined, protectionStreak: undefined, mustRecharge: undefined });
  return { ...state, weather: undefined, gravityTurnsRemaining: undefined, playerStorage: state.playerStorage.map(clearBattleEffects), player: { ...state.player, healingWishPending: undefined, reflectTurnsRemaining: undefined, lightScreenTurnsRemaining: undefined, safeguardTurnsRemaining: undefined, creatures: state.player.creatures.map(clearBattleEffects) }, opponent: { ...state.opponent, healingWishPending: undefined, reflectTurnsRemaining: undefined, lightScreenTurnsRemaining: undefined, safeguardTurnsRemaining: undefined, creatures: state.opponent.creatures.map(clearBattleEffects) }, outcome };
}
