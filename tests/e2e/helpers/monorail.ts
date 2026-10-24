import { readFile, readdir } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import species from '../../../content/battle/species.v1.json' with { type: 'json' };
import moves from '../../../content/battle/moves.v1.json' with { type: 'json' };
import { createBattleCreature } from '../../../src/core/battle/create-creature.ts';
import { monorailNetwork } from '../../../src/core/world/monorail.ts';
import { readBrowserSave, seedBrowserSave } from './world-navigation';
import { enterGame } from './enter-game';

export async function stationArrival(id: string) {
  const station = monorailNetwork.stations.find(item => item.id === id)!;
  const root = new URL('../../../content/maps/', import.meta.url);
  for (const file of await readdir(root)) {
    if (!file.endsWith('.map.json')) continue;
    const map = JSON.parse(await readFile(new URL(file, root), 'utf8'));
    if (map.id === station.mapId) return { station, spawn: map.spawns.find((spawn: { id: string }) => spawn.id === station.spawnPointId) };
  }
  throw new Error(`Missing station map: ${id}`);
}

/** An isolated integration checkpoint, not a natural three-badge playthrough. */
export async function prepareMonorailTraveler(page: Page, unlocked = true, visited = ['brumalta', 'petalora', 'vetracielo', 'ferraluce']) {
  await page.goto('/'); await enterGame(page);
  const save = await readBrowserSave(page);
  const creature = createBattleCreature({ species: species.species as any, moves: moves.moves as any, speciesId: 25, level: 20, instanceId: 'rail-traveler', moveIds: ['thunder-shock', 'quick-attack'] });
  save.party = [{ instanceId: creature.instanceId, speciesId: 25, level: 20, experience: 0, hp: 12, maxHp: creature.stats.maxHp, moves: creature.moves.map(slot => ({ id: slot.moveId, pp: 1 })) }];
  save.flags = [...save.flags.filter(flag => !flag.startsWith('atlas_visited_')),
    'q_starter_selected', 'q_research_sample_received', 'q_forest_signal_found', 'q_ada_helped', 'prologue_complete_seen', 'pokedex_seen_25', 'pokedex_caught_25',
    ...visited.flatMap(id => {
      const station = monorailNetwork.stations.find(item => item.id === id)!;
      return [`atlas_visited_${station.mapId}`, `q_${id}_visited`];
    }), ...(unlocked ? ['badge_circuito_awarded'] : [])];
  save.flags = [...new Set(save.flags)];
  save.badges = unlocked ? ['badge_circuito'] : [];
  save.player.money = 812;
  const { station, spawn } = await stationArrival('vetracielo');
  save.player = { ...save.player, mapId: station.mapId, spawnPointId: spawn.id, x: spawn.x, y: spawn.y };
  await seedBrowserSave(page, save); await page.reload(); await enterGame(page);
}

export function travelResources(save: Awaited<ReturnType<typeof readBrowserSave>>) {
  return { money: save.player.money, inventory: save.inventory, party: save.party, storage: save.storage, badges: save.badges, rngState: save.rngState,
    progression: save.flags.filter(flag => !flag.startsWith('atlas_visited_')).sort() };
}
