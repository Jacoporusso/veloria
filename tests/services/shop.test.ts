import assert from 'node:assert/strict';
import test from 'node:test';
import { purchaseShopItem } from '../../src/core/services/shop.ts';

const save = {
  schemaVersion: 2 as const, saveRevision: 1, contentVersion: 'test', saveId: 'save', savedAt: '2026-01-01T00:00:00Z',
  player: { name: 'Allenatore', mapId: 'veloria/brumalta', spawnPointId: 'from_r02', money: 300, x: 1, y: 1 },
  party: [], storage: [], flags: [], badges: [], inventory: { potion: 1 }, rngState: 1,
};
const shop = { id: 'veloria/brumalta_general', items: ['potion', 'poke-ball'] };
const items = { potion: { id: 'potion', name: 'Pozione', price: 200, maxStack: 99 }, 'poke-ball': { id: 'poke-ball', name: 'Sfera', price: 150, maxStack: 99 } };

test('purchases available stock with money and returns a detached save', () => {
  const result = purchaseShopItem(save, shop, 'potion', items);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.save.player.money, 100);
  assert.equal(result.save.inventory.potion, 2);
  assert.equal(save.player.money, 300);
  assert.equal(save.inventory.potion, 1);
});

test('rejects unaffordable, unsold and full-stack purchases without changing the save', () => {
  const poor = { ...save, player: { ...save.player, money: 100 } };
  assert.equal(purchaseShopItem(poor, shop, 'poke-ball', items).ok, false);
  assert.equal(purchaseShopItem(save, shop, 'antidote', items).ok, false);
  const full = { ...save, inventory: { ...save.inventory, potion: 99 } };
  const result = purchaseShopItem(full, shop, 'potion', items);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'stackFull');
  assert.equal(save.player.money, 300);
});
