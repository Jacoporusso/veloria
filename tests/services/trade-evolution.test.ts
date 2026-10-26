import assert from 'node:assert/strict';
import test from 'node:test';
import speciesData from '../../content/battle/species.v1.json' with { type: 'json' };
import tradeData from '../../content/battle/trade-evolutions.v1.json' with { type: 'json' };
import { calculateStats, type SpeciesBattleRegistry } from '../../src/core/battle/create-creature.ts';
import { applyTradeEvolution } from '../../src/core/services/trade-evolution.ts';
import { pendingEvolutionReceipts } from '../../src/core/services/item-evolution.ts';
import type { GameSave } from '../../src/persistence/save-types.ts';

const species = speciesData.species as SpeciesBattleRegistry;
for (const [from, to] of [[64, 65], [67, 68], [75, 76], [93, 94]]) {
  test(`assisted trade ${from} -> ${to} returns the same companion and durable ceremony`, () => {
    const maxHp = calculateStats(species[from].baseStats, 30).maxHp;
    const save: GameSave = { schemaVersion: 2, contentVersion: 'test', saveRevision: 1, saveId: 'trade-test', savedAt: '',
      player: { name: 'Ada', mapId: 'veloria/radicelmo', spawnPointId: 'test', x: 1, y: 1, money: 230 },
      party: [{ instanceId: 'companion', speciesId: from, level: 30, experience: 123, maxHp, hp: maxHp - 7,
        moves: [{ id: species[from].defaultMoveIds[0], pp: 3 }], status: { status: 'poison' } }],
      inventory: { 'poke-ball': 2 }, storage: [], flags: [], badges: [], rngState: 19 };
    const snapshot = structuredClone(save);
    const result = applyTradeEvolution(save, 'companion', tradeData.rules, species);
    assert.ok(result.ok);
    if (!result.ok) return;
    assert.equal(result.creature.speciesId, to);
    for (const field of ['instanceId', 'level', 'experience', 'moves', 'status'] as const) {
      assert.deepEqual(result.creature[field], save.party[0][field]);
    }
    assert.equal(result.creature.maxHp - result.creature.hp, 7);
    assert.deepEqual(result.save.inventory, save.inventory);
    assert.deepEqual(result.save.player, save.player);
    assert.equal(result.save.rngState, save.rngState);
    assert.deepEqual(pendingEvolutionReceipts(JSON.parse(JSON.stringify(result.save))), [result.receipt]);
    assert.equal(result.save.party.length, 1);
    assert.equal(applyTradeEvolution(result.save, 'companion', tradeData.rules, species).ok, false);
    assert.deepEqual(save, snapshot);
    assert.equal(applyTradeEvolution(save, 'absent', tradeData.rules, species).ok, false);
  });
}
