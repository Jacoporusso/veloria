import type { GameSave } from '../../persistence/save-types.ts';

export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly maxStack: number;
}

export interface ShopDefinition {
  readonly id: string;
  readonly items: readonly string[];
}

export type PurchaseFailure = 'notSold' | 'invalidItem' | 'invalidQuantity' | 'insufficientFunds' | 'stackFull';
export type PurchaseResult =
  | { readonly ok: true; readonly save: GameSave }
  | { readonly ok: false; readonly reason: PurchaseFailure; readonly save: GameSave };

/** Pure, idempotent with respect to caller state: returns a copy on success and never mutates inputs. */
export function purchaseShopItem(
  save: GameSave,
  shop: ShopDefinition,
  itemId: string,
  catalog: Readonly<Record<string, ShopItem>>,
  amount = 1,
): PurchaseResult {
  if (!Number.isSafeInteger(amount) || amount < 1) return { ok: false, reason: 'invalidQuantity', save };
  if (!shop.items.includes(itemId)) return { ok: false, reason: 'notSold', save };
  const item = catalog[itemId];
  if (!item || item.id !== itemId || !Number.isSafeInteger(item.price) || item.price < 0 ||
      !Number.isSafeInteger(item.maxStack) || item.maxStack < 1) {
    return { ok: false, reason: 'invalidItem', save };
  }
  const total = item.price * amount;
  if (!Number.isSafeInteger(total)) return { ok: false, reason: 'invalidQuantity', save };
  if (save.player.money < total) return { ok: false, reason: 'insufficientFunds', save };
  const quantity = save.inventory[itemId] ?? 0;
  if (!Number.isSafeInteger(quantity) || quantity < 0 || amount > item.maxStack - quantity) {
    return { ok: false, reason: 'stackFull', save };
  }
  return {
    ok: true,
    save: {
      ...save,
      player: { ...save.player, money: save.player.money - total },
      inventory: { ...save.inventory, [itemId]: quantity + amount },
    },
  };
}
