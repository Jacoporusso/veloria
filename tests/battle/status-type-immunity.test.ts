import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createBattleState, resolveBattleTurn } from '../../src/core/battle/engine.ts';
import { prototypeBattleRules } from '../../src/core/battle/rules.ts';
import { chooseOpponentCommand } from '../../src/core/battle/opponent-policy.ts';
import type { BattleCreature, MoveDefinition } from '../../src/core/battle/types.ts';

const wave: MoveDefinition = { id: 'wave', name: 'Thunder Wave', type: 'electric', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20, inflictedStatus: 'paralysis', statusAffectedByTypeImmunity: true };
const wait: MoveDefinition = { id: 'wait', name: 'Wait', type: 'normal', category: 'status', power: 0, accuracy: 100, priority: 0, maxPp: 20 };
const rules = { ...prototypeBattleRules, typeChart: { electric: { ground: 0 }, normal: { ghost: 0 }, steel: { ground: 0.5 } } };
function creature(id: string, extra: Partial<BattleCreature> = {}): BattleCreature {
  return { instanceId: id, speciesId: 90001, name: id, level: 10, types: ['normal'], stats: { maxHp: 100, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: id === 'player' ? 100 : 10 }, hp: 100, experience: 0, experienceYield: 0, moves: [{ moveId: 'wave', pp: 20 }, { moveId: 'wait', pp: 20 }], ...extra };
}
function battle(target: Partial<BattleCreature> = {}) {
  return createBattleState({ battleId: 'status-type', battleType: 'wild', seed: 1, rules, playerTeam: [creature('player')], opponentTeam: [creature('opponent', target)] });
}
const commands = { player: { kind: 'useMove', moveSlot: 0 }, opponent: { kind: 'useMove', moveSlot: 1 } } as const;
function resolve(target: Partial<BattleCreature> = {}, move = wave) {
  return resolveBattleTurn(battle(target), commands, { wave: move, wait }, rules);
}

test('Thunder Wave fixture matches cached official accuracy, status category and paralysis effect', () => {
  const source = JSON.parse(readFileSync(new URL('../../content/sources/pokeapi/move-thunder-wave.json', import.meta.url), 'utf8'));
  // The historical value before Sun/Moon applies to the project's HGSS rules.
  assert.equal(source.past_values.find((entry: { version_group: { name: string } }) => entry.version_group.name === 'sun-moon').accuracy, wave.accuracy);
  assert.equal(source.damage_class.name, wave.category);
  assert.equal(source.meta.ailment.name, wave.inflictedStatus);
});

test('selectively type-affected status move cannot paralyze Water/Ground; PP and replay remain deterministic', () => {
  const initial = battle({ types: ['water', 'ground'] });
  const original = structuredClone(initial);
  const result = resolveBattleTurn(initial, commands, { wave, wait }, rules);
  assert.deepEqual(result, resolveBattleTurn(initial, commands, { wave, wait }, rules));
  assert.deepEqual(initial, original);
  assert.equal(result.state.opponent.creatures[0].status, undefined);
  assert.equal(result.state.player.creatures[0].moves[0].pp, 19);
  assert.ok(result.events.some(event => event.type === 'statusPrevented' && event.status === 'paralysis' && event.reason === 'immune'));
  assert.ok(!result.events.some(event => event.type === 'statusApplied'));
});

test('susceptible targets are paralyzed; existing major-status and status immunities retain their semantics', () => {
  assert.equal(resolve().state.opponent.creatures[0].status?.status, 'paralysis');
  const afflicted = resolve({ status: { status: 'poison' } });
  assert.equal(afflicted.state.opponent.creatures[0].status?.status, 'poison');
  assert.ok(afflicted.events.some(event => event.type === 'statusPrevented' && event.reason === 'alreadyAfflicted'));
  const burn = resolve({ types: ['fire'] }, { ...wave, type: 'fire', inflictedStatus: 'burn' });
  assert.equal(burn.state.opponent.creatures[0].status, undefined);
  assert.ok(burn.events.some(event => event.type === 'statusPrevented' && event.reason === 'immune'));
});

test('ordinary status moves do not inherit attack-type immunity: Growl affects Ghost and Metal Sound affects Ground', () => {
  const growl: MoveDefinition = { ...wait, id: 'wave', statChanges: [{ target: 'opponent', stat: 'attack', stages: -1 }] };
  assert.equal(resolve({ types: ['ghost'] }, growl).state.opponent.creatures[0].statStages?.attack, -1);
  const metal: MoveDefinition = { ...wait, id: 'wave', type: 'steel', statChanges: [{ target: 'opponent', stat: 'specialDefense', stages: -2 }] };
  assert.equal(resolve({ types: ['ground'] }, metal).state.opponent.creatures[0].statStages?.specialDefense, -2);
  assert.equal(resolve({ types: ['ground'] }, { ...wave, statusAffectedByTypeImmunity: false }).state.opponent.creatures[0].status?.status, 'paralysis');
});

test('AI skips type-immune Thunder Wave setup while preserving Metal Sound on Ground', () => {
  const state = battle();
  const opponent = state.opponent.creatures[0];
  const attack: MoveDefinition = { ...wait, id: 'attack', category: 'special', power: 40 };
  const metal: MoveDefinition = { ...wait, id: 'metal', type: 'steel', statChanges: [{ target: 'opponent', stat: 'specialDefense', stages: -2 }] };
  const policy = { id: 'immunity-test', statusEveryTurns: 1, maxSetupStage: 2, damageSelection: 'best' } as const;
  const setup = (moveId: string, types: BattleCreature['types']) => ({ ...state,
    player: { ...state.player, creatures: [{ ...state.player.creatures[0], types }] },
    opponent: { ...state.opponent, creatures: [{ ...opponent, moves: [{ moveId, pp: 20 }, { moveId: 'attack', pp: 20 }] }] },
  });
  const catalog = { wave, attack, metal };
  assert.deepEqual(chooseOpponentCommand(setup('wave', ['water', 'ground']), catalog, rules, policy), { kind: 'useMove', moveSlot: 1 });
  assert.deepEqual(chooseOpponentCommand(setup('wave', ['normal']), catalog, rules, policy), { kind: 'useMove', moveSlot: 0 });
  assert.deepEqual(chooseOpponentCommand(setup('metal', ['ground']), catalog, rules, policy), { kind: 'useMove', moveSlot: 0 });
});
