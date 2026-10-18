import network from '../../../content/transit/monorail.v1.json' with { type: 'json' };
import { areaForMap, visitedAreaIds } from './region-atlas.ts';

export interface MonorailStation {
  id: string;
  name: string;
  mapId: string;
  spawnPointId: string;
}

export interface MonorailTraveler {
  player: { mapId: string };
  flags: readonly string[];
}

export const monorailNetwork: {
  version: number; id: string; name: string;
  requiredFlags: readonly string[];
  stations: readonly MonorailStation[];
} = network;

export function monorailUnlocked(flags: readonly string[]): boolean {
  return monorailNetwork.requiredFlags.every(flag => flags.includes(flag));
}

function stationVisited(station: MonorailStation, flags: readonly string[]): boolean {
  const area = areaForMap(station.mapId);
  return !!area && visitedAreaIds(flags).includes(area.id);
}

/** The rail network is separate from walking connections; it cannot discover a city. */
export function monorailDestinations(save: MonorailTraveler, originStationId: string): MonorailStation[] {
  const origin = monorailNetwork.stations.find(station => station.id === originStationId);
  if (!origin || origin.mapId !== save.player.mapId || !monorailUnlocked(save.flags)) return [];
  return monorailNetwork.stations.filter(station => station.mapId !== origin.mapId && stationVisited(station, save.flags));
}

export type MonorailTrip = { ok: true; destination: MonorailStation } | {
  ok: false; reason: 'unknown-station' | 'locked' | 'wrong-origin' | 'same-station' | 'unvisited';
};

/** Recheck eligibility when boarding, not only when the destination menu opens. */
export function planMonorailTrip(save: MonorailTraveler, originStationId: string, destinationId: string): MonorailTrip {
  const origin = monorailNetwork.stations.find(station => station.id === originStationId);
  const destination = monorailNetwork.stations.find(station => station.id === destinationId);
  if (!origin || !destination) return { ok: false, reason: 'unknown-station' };
  if (!monorailUnlocked(save.flags)) return { ok: false, reason: 'locked' };
  if (origin.mapId !== save.player.mapId) return { ok: false, reason: 'wrong-origin' };
  if (destination.mapId === origin.mapId) return { ok: false, reason: 'same-station' };
  if (!stationVisited(destination, save.flags)) return { ok: false, reason: 'unvisited' };
  return { ok: true, destination };
}
