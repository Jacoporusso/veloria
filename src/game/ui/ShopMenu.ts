import type { GameSave } from '../../persistence/save-types.ts';
import { purchaseShopItem, type ShopDefinition, type ShopItem } from '../../core/services/shop.ts';
import { element, managementDialog } from './ManagementDialog';
import { decorateServiceOption } from './ServiceOptionIcon';

export async function showShopManager(args: {
  name: string; shop: ShopDefinition; catalog: Readonly<Record<string, ShopItem & { battle?: { healHp?: number; cures?: readonly string[] }; capture?: unknown }>>;
  getSave(): GameSave; commit(save: GameSave): Promise<boolean>; signal?: AbortSignal;
}): Promise<void> {
  const ui = managementDialog(args.name, args.signal);
  const money = element('strong');
  ui.footer.append(money);
  const quantities = new Map<string, number>();
  const render = () => {
    const save = args.getSave();
    money.textContent = `Monete: ${save.player.money} ₿`;
    ui.content.replaceChildren();
    for (const itemId of args.shop.items) {
      const item = args.catalog[itemId];
      if (!item) continue;
      const owned = save.inventory[itemId] ?? 0;
      const maximum = Math.max(0, Math.min(item.maxStack - owned, item.price ? Math.floor(save.player.money / item.price) : item.maxStack - owned));
      const row = element('article', '', 'shop-row');
      row.setAttribute('aria-label', item.name);
      const description = element('div');
      const heading = element('h3', item.name);
      description.append(heading, element('small', `${item.price} ₿ ciascuno · Nello zaino: ${owned} · Acquistabili: ${maximum}`));
      const controls = element('div', '', 'shop-purchase');
      const label = element('label', `Quantità ${item.name}`);
      const input = element('input');
      input.type = 'number'; input.min = '1'; input.max = String(maximum || 1); input.step = '1';
      input.value = String(Math.min(quantities.get(itemId) ?? 1, maximum || 1));
      input.disabled = !maximum;
      label.append(input);
      const buy = element('button');
      buy.type = 'button';
      const update = () => {
        const amount = input.valueAsNumber;
        const valid = Number.isSafeInteger(amount) && amount > 0 && amount <= maximum;
        buy.textContent = valid ? `Acquista ×${amount} · ${amount * item.price} ₿` : 'Quantità non disponibile';
        decorateServiceOption(buy, item.battle?.healHp ? 'potion' : item.battle?.cures?.length ? 'antidote' : item.capture ? 'pokeball' : 'shop');
        buy.disabled = !valid;
        if (valid) quantities.set(itemId, amount);
      };
      input.oninput = update;
      buy.onclick = async () => {
        if (buy.disabled) return;
        const amount = input.valueAsNumber;
        const result = purchaseShopItem(args.getSave(), args.shop, itemId, args.catalog, amount);
        if (!result.ok) { ui.status.textContent = 'Acquisto non disponibile: controlla quantità, spazio e monete.'; return; }
        ui.setBusy(true);
        try {
          if (await args.commit(result.save)) {
            render();
            ui.status.textContent = `${item.name} ×${amount} acquistati · ${item.price * amount} ₿. Acquisto salvato.`;
          }
        } finally {
          ui.setBusy(false);
          ui.content.querySelector<HTMLInputElement>(`input`)?.focus({ preventScroll: true });
        }
      };
      update();
      controls.append(label, buy); row.append(description, controls); ui.content.append(row);
    }
  };
  ui.status.textContent = 'Scegli la quantità: il totale è mostrato prima dell’acquisto.';
  render();
  await ui.closed;
}
