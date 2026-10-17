import { effectivenessFor, type BattleRules } from './rules.ts';
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
  const playerIds = new Set([...args.playerTeam, ...(args.playerStorage ?? [])].map(creature => creature.instanceId));
  if (playerIds.size !== args.playerTeam.length + (args.playerStorage?.length ?? 0)) throw new Error('Player creature IDs must be unique across party and storage');
  return {
    battleId: args.battleId,
    rulesetId: args.rules.id,
    battleType: args.battleType,
    turn: 0,
    rngState: normalizeSeed(args.seed),
    player: { creatures: args.playerTeam.map(cloneCreature), activeIndex: firstAvailable(args.playerTeam) },
    opponent: { creatures: args.opponentTeam.map(cloneCreature), activeIndex: firstAvailable(args.opponentTeam) },
    playerStorage: (args.playerStorage ?? []).map(cloneCreature),
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
  return { ...creature, types: [...creature.types], baseStats: creature.baseStats ? { ...creature.baseStats } : undefined, stats: { ...creature.stats }, moves: creature.moves.map(move => ({ ...move })), status: creature.status ? { ...creature.status } : undefined };
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
  if (command.kind === 'useMove') {
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
  return command.kind === 'attemptFlee' ? 7 : 6;
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
  const captured: BattleCreature = { ...cloneCreature(target), instanceId: command.captureInstanceId };
  const capturedState = destination === 'party'
    ? { ...state, player: { ...state.player, creatures: [...state.player.creatures, captured] } }
    : { ...state, playerStorage: [...state.playerStorage, captured] };
  events.push({ type: 'creatureCaptured', side: 'player', wildCreatureId: target.instanceId, creatureId: captured.instanceId, destination });
  return endBattle(capturedState, { kind: 'captured', creatureId: captured.instanceId, destination }, events);
}

function effectiveSpeed(creature: BattleCreature): number {
  const speed = creature.status?.status === 'paralysis' ? Math.floor(creature.stats.speed / 2) : creature.stats.speed;
  return Math.max(1, speed);
}

function applySwitch(state: BattleState, side: BattleSide, command: Extract<BattleCommand, { kind: 'switch' }>, events: BattleEvent[]): BattleState {
  const oldCreature = active(state, side);
  const newCreature = sideState(state, side).creatures[command.partyIndex];
  events.push({ type: 'creatureSwitched', side, fromId: oldCreature.instanceId, toId: newCreature.instanceId });
  return { ...state, [side]: { ...sideState(state, side), activeIndex: command.partyIndex } };
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

function applyMove(state: BattleState, side: BattleSide, command: Extract<BattleCommand, { kind: 'useMove' }>, catalog: MoveCatalog, rules: BattleRules, cursor: RandomCursor, events: BattleEvent[]): BattleState {
  const user = active(state, side);
  if (user.hp <= 0) return state;
  const actionPermission = canAct(state, side, cursor, rules, events);
  state = actionPermission.state;
  if (!actionPermission.canAct) {
    events.push({ type: 'moveFailed', side, moveId: user.moves[command.moveSlot].moveId, reason: 'blockedByStatus' });
    return state;
  }
  const slot = user.moves[command.moveSlot];
  if (slot.pp <= 0) {
    events.push({ type: 'moveFailed', side, moveId: slot.moveId, reason: 'noPp' });
    return state;
  }
  const move = catalog[slot.moveId];
  if (!Number.isFinite(move.accuracy) || move.accuracy < 0 || move.accuracy > 100 || !Number.isFinite(move.power) || move.power < 0) {
    throw new Error(`Invalid move data: ${move.id}`);
  }
  const spentPp = { ...user, moves: user.moves.map((item, i) => i === command.moveSlot ? { ...item, pp: Math.max(0, item.pp - 1) } : item) };
  state = setCreature(state, side, sideState(state, side).activeIndex, spentPp);
  const targetSide = otherSide(side);
  const target = active(state, targetSide);
  events.push({ type: 'moveUsed', side, creatureId: user.instanceId, moveId: move.id });
  if (target.hp <= 0) {
    events.push({ type: 'moveFailed', side, moveId: move.id, reason: 'noTarget' });
    return state;
  }
  if (random(cursor) * 100 >= move.accuracy) {
    events.push({ type: 'moveMissed', side, moveId: move.id });
    return state;
  }

  if (move.category !== 'status' && move.power > 0) {
    const attackStat = move.category === 'physical' ? 'attack' : 'specialAttack';
    const defenseStat = move.category === 'physical' ? 'defense' : 'specialDefense';
    const burnFactor = move.category === 'physical' && user.status?.status === 'burn' ? 0.5 : 1;
    const attack = Math.max(1, Math.floor(user.stats[attackStat] * burnFactor));
    const defense = Math.max(1, target.stats[defenseStat]);
    const effectiveness = effectivenessFor(target.types, move.type, rules.typeChart);
    const critical = random(cursor) < rules.criticalChance;
    const variance = rules.minimumDamageVariance + random(cursor) * (rules.maximumDamageVariance - rules.minimumDamageVariance);
    const stab = user.types.includes(move.type) ? 1.5 : 1;
    const base = Math.floor((((2 * user.level / 5 + 2) * move.power * attack / defense) / 50) + 2);
    const amount = effectiveness === 0 ? 0 : Math.max(1, Math.floor(base * (critical ? rules.criticalMultiplier : 1) * effectiveness * stab * variance));
    const hp = Math.max(0, target.hp - amount);
    state = setCreature(state, targetSide, sideState(state, targetSide).activeIndex, { ...target, hp });
    events.push({ type: 'damageApplied', sourceSide: side, targetSide, moveId: move.id, amount: target.hp - hp, effectiveness, critical });
    if (hp === 0) {
      events.push({ type: 'creatureFainted', side: targetSide, creatureId: target.instanceId });
      state = awardExperience(state, side, user.instanceId, target, rules, events);
    }
  }

  const chance = move.statusChance ?? (move.category === 'status' && move.inflictedStatus ? 100 : 0);
  const latestTarget = active(state, targetSide);
  if (move.inflictedStatus && latestTarget.hp > 0 && random(cursor) * 100 < chance) {
    state = applyStatus(state, targetSide, latestTarget, move.inflictedStatus, cursor, rules, events);
  }
  return state;
}

function applyStatus(state: BattleState, side: BattleSide, target: BattleCreature, status: MajorStatus, cursor: RandomCursor, rules: BattleRules, events: BattleEvent[]): BattleState {
  if (target.status) {
    events.push({ type: 'statusPrevented', side, status, reason: 'alreadyAfflicted' });
    return state;
  }
  if (target.types.some(type => rules.statusImmunities[type]?.includes(status))) {
    events.push({ type: 'statusPrevented', side, status, reason: 'immune' });
    return state;
  }
  const duration = status === 'sleep' ? rules.sleepTurns : status === 'freeze' ? rules.freezeTurns : undefined;
  const turnsRemaining = duration ? integerBetween(cursor, duration[0], duration[1]) : undefined;
  const applied: StatusEffect = { status, turnsRemaining };
  state = setCreature(state, side, sideState(state, side).activeIndex, { ...target, status: applied });
  events.push({ type: 'statusApplied', side, creatureId: target.instanceId, status, turns: turnsRemaining });
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
  let level = recipient.level;
  let experience = recipient.experience + defeated.experienceYield;
  const curve = recipient.growthCurveId ? rules.experienceCurves[recipient.growthCurveId] : undefined;
  while (curve && recipient.baseStats && level < rules.maxLevel) {
    const required = experienceToNextLevel(level, curve);
    if (experience < required) break;
    experience -= required;
    const previousLevel = level++;
    events.push({ type: 'levelUp', side, creatureId: recipient.instanceId, previousLevel, level });
  }
  const stats = recipient.baseStats && level !== recipient.level
    ? calculateStats(recipient.baseStats, level)
    : recipient.stats;
  const maxHpIncrease = stats.maxHp - recipient.stats.maxHp;
  const hp = recipient.hp === 0 ? 0 : Math.min(stats.maxHp, recipient.hp + Math.max(0, maxHpIncrease));
  let evolved: BattleCreature = { ...recipient, level, experience, stats, hp };
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
  }
  return setCreature(state, side, index, evolved);
}

function endBattle(state: BattleState, outcome: Exclude<BattleOutcome, { kind: 'ongoing' }>, events: BattleEvent[]): BattleState {
  if (state.outcome.kind !== 'ongoing') return state;
  events.push({ type: 'battleEnded', outcome });
  return { ...state, outcome };
}
