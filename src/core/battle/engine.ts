import { EMERGENCY_MOVE_ID, EMERGENCY_MOVE_NAME, hasUsableBattleMove } from './emergency-move.ts';
import { BATTLE_STATS, MIN_STAT_STAGE, MAX_STAT_STAGE, effectiveStat, effectiveMoveAccuracy } from './stat-stages.ts';
import { effectivenessFor, type BattleRules } from './rules.ts';
import { calculateHitDamage } from './damage.ts';
import { calculateStats } from './create-creature.ts';
import { experienceToNextLevel } from './progression.ts';
import type {
  BattleCommand, BattleCreature, BattleEvent, BattleOutcome, BattleSide, BattleState,
  BattleTransition, MajorStatus, MoveDefinition, StatusEffect,
} from './types.ts';

export type MoveCatalog = Readonly<Record<string, MoveDefinition>>;
export type BattleCommands = Readonly<Record<BattleSide, BattleCommand>>;

interface RandomCursor { state: number }

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
    player: { creatures: args.playerTeam.map(creature => ({ ...cloneCreature(creature), statStages: undefined, confusionTurnsRemaining: undefined, leechSeed: undefined })), activeIndex: firstAvailable(args.playerTeam) },
    opponent: { creatures: args.opponentTeam.map(creature => ({ ...cloneCreature(creature), statStages: undefined, confusionTurnsRemaining: undefined, leechSeed: undefined })), activeIndex: firstAvailable(args.opponentTeam) },
    playerStorage: (args.playerStorage ?? []).map(creature => ({ ...cloneCreature(creature), statStages: undefined, confusionTurnsRemaining: undefined, leechSeed: undefined })),
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
  return { ...creature, types: [...creature.types], baseStats: creature.baseStats ? { ...creature.baseStats } : undefined, stats: { ...creature.stats }, leechSeed: creature.leechSeed ? { ...creature.leechSeed } : undefined, statStages: creature.statStages ? { ...creature.statStages } : undefined, moves: creature.moves.map(move => ({ ...move })), status: creature.status ? { ...creature.status } : undefined };
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
  if (command.kind === 'switch') {
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

function commandPriority(state: BattleState, side: BattleSide, command: BattleCommand, catalog: MoveCatalog): number {
  if (command.kind === 'useMove') {
    const moveId = active(state, side).moves[command.moveSlot]?.moveId;
    return moveId ? catalog[moveId]?.priority ?? 0 : 0;
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
      if (command.kind === 'switch') state = applySwitch(state, side, command, events);
    }
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
    priority: commandPriority(input, side, commands[side], catalog),
    speed: effectiveSpeed(active(input, side)),
    tieRoll: random(cursor),
  })).sort((a, b) => b.priority - a.priority || b.speed - a.speed || a.tieRoll - b.tieRoll).map(item => item.side);
  events.push({ type: 'actionOrder', sides });
  let state: BattleState = { ...input, rngState: cursor.state, turn: input.turn + 1 };

  for (const side of sides) {
    if (state.outcome.kind !== 'ongoing') break;
    const command = commands[side];
    if (command.kind === 'switch') {
      state = applySwitch(state, side, command, events);
    } else if (command.kind === 'attemptFlee') {
      if (random(cursor) < rules.fleeBaseChance) {
        state = endBattle(state, { kind: 'fled', side }, events);
      } else events.push({ type: 'fleeFailed', side });
    } else if (command.kind === 'attemptCapture') {
      state = applyCapture(state, command, rules, cursor, events);
    } else if (command.kind === 'useItem') {
      state = applyItem(state, side, command, rules, events);
    } else {
      state = applyMove(state, side, command, catalog, rules, cursor, events);
    }
    state = checkForWinner(state, events);
  }

  // Residual effects from both active creatures resolve after both chosen actions.
  const residualSides = [...sides].sort((a, b) => effectiveSpeed(active(state, b)) - effectiveSpeed(active(state, a)));
  for (const side of residualSides) {
    if (state.outcome.kind !== 'ongoing') break;
    state = applyLeechSeed(state, side, rules, events);
    state = checkForWinner(state, events);
  }
  for (const side of ['player', 'opponent'] as const) {
    if (state.outcome.kind !== 'ongoing') break;
    state = applyResidual(state, side, rules, events);
    state = checkForWinner(state, events);
  }
  state = { ...state, rngState: cursor.state };
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
  const captured: BattleCreature = { ...cloneCreature(target), instanceId: command.captureInstanceId, statStages: undefined, confusionTurnsRemaining: undefined, leechSeed: undefined };
  const capturedState = destination === 'party'
    ? { ...state, player: { ...state.player, creatures: [...state.player.creatures, captured] } }
    : { ...state, playerStorage: [...state.playerStorage, captured] };
  events.push({ type: 'creatureCaptured', side: 'player', wildCreatureId: target.instanceId, creatureId: captured.instanceId, destination });
  return endBattle(capturedState, { kind: 'captured', creatureId: captured.instanceId, destination }, events);
}

function effectiveSpeed(creature: BattleCreature): number {
  const speed = creature.status?.status === 'paralysis' ? Math.floor(effectiveStat(creature, 'speed') / 2) : effectiveStat(creature, 'speed');
  return Math.max(1, speed);
}

function applySwitch(state: BattleState, side: BattleSide, command: Extract<BattleCommand, { kind: 'switch' }>, events: BattleEvent[]): BattleState {
  const oldCreature = active(state, side);
  const newCreature = sideState(state, side).creatures[command.partyIndex];
  events.push({ type: 'creatureSwitched', side, fromId: oldCreature.instanceId, toId: newCreature.instanceId });
  return { ...state, [side]: { ...sideState(state, side), activeIndex: command.partyIndex,
    creatures: sideState(state, side).creatures.map((creature, index) =>
      index === sideState(state, side).activeIndex || index === command.partyIndex
        ? { ...creature, statStages: undefined, confusionTurnsRemaining: undefined, leechSeed: undefined } : creature),
  } };
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

function canAct(state: BattleState, side: BattleSide, cursor: RandomCursor, rules: BattleRules, events: BattleEvent[]): { state: BattleState; canAct: boolean } {
  const creature = active(state, side);
  const status = creature.status;
  if (!status) return { state, canAct: true };
  if (status.status === 'paralysis' && random(cursor) < rules.paralysisActionChance) {
    events.push({ type: 'statusTick', side, creatureId: creature.instanceId, status: 'paralysis' });
    return { state, canAct: false };
  }
  if (status.status === 'sleep') {
    const turnsRemaining = Math.max(0, (status.turnsRemaining ?? 1) - 1);
    const recovered = turnsRemaining === 0;
    events.push({ type: 'statusTick', side, creatureId: creature.instanceId, status: 'sleep', recovered });
    const nextStatus = recovered ? undefined : { ...status, turnsRemaining };
    const next = setCreature(state, side, sideState(state, side).activeIndex, { ...creature, status: nextStatus });
    return { state: next, canAct: recovered };
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

function applyMove(state: BattleState, side: BattleSide, command: Extract<BattleCommand, { kind: 'useMove' | 'struggle' }>, catalog: MoveCatalog, rules: BattleRules, cursor: RandomCursor, events: BattleEvent[]): BattleState {
  let user = active(state, side);
  if (user.hp <= 0) return state;
  const emergency = command.kind === 'struggle';
  const moveId = emergency ? EMERGENCY_MOVE_ID : user.moves[command.moveSlot].moveId;
  const actionPermission = canAct(state, side, cursor, rules, events);
  state = actionPermission.state;
  if (!actionPermission.canAct) {
    events.push({ type: 'moveFailed', side, moveId, reason: 'blockedByStatus' });
    return state;
  }
  // Preserve status recovery performed by canAct instead of restoring the old snapshot.
  user = active(state, side);
  if ((user.confusionTurnsRemaining ?? 0) > 0) {
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
      return state;
    }
    user = active(state, side);
  }
  const slot = command.kind === 'useMove' ? user.moves[command.moveSlot] : undefined;
  if (slot && slot.pp <= 0) {
    events.push({ type: 'moveFailed', side, moveId: slot.moveId, reason: 'noPp' });
    return state;
  }
  const move: MoveDefinition = emergency ? {
    id: EMERGENCY_MOVE_ID, name: EMERGENCY_MOVE_NAME, type: 'normal', category: 'physical',
    power: rules.emergencyMove.power, accuracy: 100, priority: 0, maxPp: 0,
  } : catalog[slot!.moveId];
  if (!Number.isFinite(move.accuracy) || move.accuracy < 0 || move.accuracy > 100 || !Number.isFinite(move.power) || move.power < 0 ||
      (move.fixedDamage !== undefined && (!Number.isInteger(move.fixedDamage) || move.fixedDamage <= 0 || move.category === 'status')) ||
      (move.drainPercent !== undefined && (move.drainPercent < 0 || move.drainPercent > 100)) ||
      (move.leechSeedFraction !== undefined && (!Number.isFinite(move.leechSeedFraction) || move.leechSeedFraction <= 0 || move.leechSeedFraction > 1)) ||
      ((move.minStatusTurns !== undefined || move.maxStatusTurns !== undefined) &&
        (!Number.isInteger(move.minStatusTurns) || !Number.isInteger(move.maxStatusTurns) || move.minStatusTurns! < 1 || move.maxStatusTurns! < move.minStatusTurns!)) ||
      (move.statChangeChance !== undefined && (move.statChangeChance < 0 || move.statChangeChance > 100)) ||
      (move.inflictedConfusionChance !== undefined && (move.inflictedConfusionChance < 0 || move.inflictedConfusionChance > 100)) ||
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
  const spentPp = { ...user, moves: user.moves.map((item, i) => command.kind === 'useMove' && i === command.moveSlot ? { ...item, pp: Math.max(0, item.pp - 1) } : item) };
  state = setCreature(state, side, sideState(state, side).activeIndex, spentPp);
  const targetSide = otherSide(side);
  const target = active(state, targetSide);
  const dealsDamage = move.category !== 'status' && (move.power > 0 || move.fixedDamage !== undefined);
  let damagingMoveConnected = !dealsDamage;
  events.push({ type: 'moveUsed', side, creatureId: user.instanceId, moveId: move.id });
  if (target.hp <= 0) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noTarget' });
    return state;
  }
  if (!move.alwaysHits && random(cursor) * 100 >= (emergency ? 100 : effectiveMoveAccuracy(user, target, move))) {
    events.push({ type: 'moveMissed', side, moveId: move.id });
    return state;
  }
  if (move.category === 'status' && move.statusAffectedByTypeImmunity && move.inflictedStatus &&
      effectivenessFor(target.types, move.type, rules.typeChart) === 0) {
    events.push({ type: 'statusPrevented', side: targetSide, status: move.inflictedStatus, reason: 'immune' });
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
      const critical = move.fixedDamage === undefined && random(cursor) < rules.criticalChance;
      const variance = move.fixedDamage === undefined
        ? rules.minimumDamageVariance + random(cursor) * (rules.maximumDamageVariance - rules.minimumDamageVariance) : 1;
      const { amount, effectiveness } = calculateHitDamage(user, currentTarget, move, rules, { critical, variance, emergency });
      const hp = Math.max(0, currentTarget.hp - amount);
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...currentTarget, hp });
      const actual = currentTarget.hp - hp;
      dealt += actual;
      if (actual > 0) damagingMoveConnected = true;
      events.push({ type: 'damageApplied', sourceSide: side, targetSide, moveId: move.id, amount: actual, effectiveness, critical });
      if (hp === 0) {
        events.push({ type: 'creatureFainted', side: targetSide, creatureId: currentTarget.instanceId });
        if (!emergency) state = awardExperience(state, side, user.instanceId, currentTarget, rules, events);
      }
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
    if (hp === 0) events.push({ type: 'creatureFainted', side, creatureId: user.instanceId });
    else if (active(state, targetSide).hp === 0) state = awardExperience(state, side, user.instanceId, target, rules, events);
  }

  for (const effect of move.statChanges ?? []) {
    if (!damagingMoveConnected || ((move.statChangeChance ?? 100) < 100 && random(cursor) * 100 >= (move.statChangeChance ?? 100))) continue;
    const affectedSide = effect.target === 'self' ? side : targetSide;
    const affected = active(state, affectedSide);
    if (affected.hp <= 0) continue;
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

  const chance = move.statusChance ?? (move.category === 'status' && move.inflictedStatus ? 100 : 0);
  const latestTarget = active(state, targetSide);
  if (move.inflictedStatus && damagingMoveConnected && latestTarget.hp > 0 && random(cursor) * 100 < chance) {
    state = applyStatus(state, targetSide, latestTarget, move.inflictedStatus, cursor, rules, events,
      move.minStatusTurns === undefined ? undefined : [move.minStatusTurns, move.maxStatusTurns!]);
  }
  if (move.inflictedConfusionChance !== undefined && damagingMoveConnected && active(state, targetSide).hp > 0 && random(cursor) * 100 < move.inflictedConfusionChance) {
    const confused = active(state, targetSide);
    if ((confused.confusionTurnsRemaining ?? 0) > 0) events.push({ type: 'confusionPrevented', side: targetSide, creatureId: confused.instanceId });
    else {
      const turns = integerBetween(cursor, move.minConfusionTurns ?? 2, move.maxConfusionTurns ?? 5);
      state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...confused, confusionTurnsRemaining: turns });
      events.push({ type: 'confusionApplied', side: targetSide, creatureId: confused.instanceId, turns });
    }
  }
  return state;
}

function applyStatus(state: BattleState, side: BattleSide, target: BattleCreature, status: MajorStatus, cursor: RandomCursor, rules: BattleRules, events: BattleEvent[], durationOverride?: readonly [number, number]): BattleState {
  if (target.status) {
    events.push({ type: 'statusPrevented', side, status, reason: 'alreadyAfflicted' });
    return state;
  }
  if (target.types.some(type => rules.statusImmunities[type]?.includes(status))) {
    events.push({ type: 'statusPrevented', side, status, reason: 'immune' });
    return state;
  }
  const duration = durationOverride ?? (status === 'sleep' ? rules.sleepTurns : status === 'freeze' ? rules.freezeTurns : undefined);
  const turnsRemaining = duration ? integerBetween(cursor, duration[0], duration[1]) : undefined;
  const applied: StatusEffect = { status, turnsRemaining };
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, status: applied });
  events.push({ type: 'statusApplied', side, creatureId: target.instanceId, status, turns: turnsRemaining });
  return state;
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

function applyResidual(state: BattleState, side: BattleSide, rules: BattleRules, events: BattleEvent[]): BattleState {
  const target = active(state, side);
  if (target.hp <= 0 || !target.status || (target.status.status !== 'burn' && target.status.status !== 'poison')) return state;
  const fraction = target.status.status === 'burn' ? rules.burnResidualFraction : rules.poisonResidualFraction;
  const damage = Math.max(1, Math.floor(target.stats.maxHp * fraction));
  const hp = Math.max(0, target.hp - damage);
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, hp });
  events.push({ type: 'statusTick', side, creatureId: target.instanceId, status: target.status.status, damage: target.hp - hp });
  if (hp === 0) {
    events.push({ type: 'creatureFainted', side, creatureId: target.instanceId });
    const winner = otherSide(side);
    const winnerCreature = active(state, winner);
    state = awardExperience(state, winner, winnerCreature.instanceId, target, rules, events);
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
  events.push({ type: 'experienceGained', side, creatureId: recipient.instanceId, amount: defeated.experienceYield, sourceCreatureId: defeated.instanceId });
  let moves = recipient.moves;
  const attempted = new Set(moves.map(slot => slot.moveId));
  let level = recipient.level;
  let experience = recipient.experience + defeated.experienceYield;
  const curve = recipient.growthCurveId ? rules.experienceCurves[recipient.growthCurveId] : undefined;
  while (curve && recipient.baseStats && level < rules.maxLevel) {
    const required = experienceToNextLevel(level, curve);
    if (experience < required) break;
    experience -= required;
    const previousLevel = level++;
    events.push({ type: 'levelUp', side, creatureId: recipient.instanceId, previousLevel, level });
    for (const learning of rules.levelUpMoves[recipient.speciesId] ?? []) {
      if (learning.level > level || attempted.has(learning.moveId)) continue;
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
  let evolved: BattleCreature = { ...recipient, level, experience, stats, hp, moves };
  const seenSpecies = new Set<number>([evolved.speciesId]);
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
      growthCurveId: target.growthCurveId ?? evolved.growthCurveId,
      experienceYield: target.experienceYield,
      stats: evolvedStats,
      hp: evolved.hp === 0 ? 0 : Math.min(evolvedStats.maxHp, evolved.hp + Math.max(0, hpIncrease)),
    };
    seenSpecies.add(target.speciesId);
    events.push({ type: 'creatureEvolved', side, creatureId: evolved.instanceId, fromSpeciesId: previous.speciesId, fromName: previous.name, toSpeciesId: target.speciesId, toName: target.name, level: evolved.level });
    for (const learning of rules.levelUpMoves[target.speciesId] ?? []) {
      if (learning.level > evolved.level || attempted.has(learning.moveId)) continue;
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
  return setCreature(state, side, index, evolved);
}

function endBattle(state: BattleState, outcome: Exclude<BattleOutcome, { kind: 'ongoing' }>, events: BattleEvent[]): BattleState {
  if (state.outcome.kind !== 'ongoing') return state;
  events.push({ type: 'battleEnded', outcome });
  return { ...state, outcome };
}
