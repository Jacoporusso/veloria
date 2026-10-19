export interface LocalFerryStop {
  id: string;
  name: string;
  mapId: string;
  spawnPointId: string;
  requiredFlags?: readonly string[];
}

export interface LocalFerryRoute {
  fromStopId: string;
  toStopId: string;
  requiredFlags?: readonly string[];
}

export interface LocalFerryNetwork {
  id: string;
  name: string;
  requiredFlags: readonly string[];
  stops: readonly LocalFerryStop[];
  routes: readonly LocalFerryRoute[];
}

export interface LocalFerryTraveler {
  player: { mapId: string; spawnPointId?: string; x?: number; y?: number };
  flags: readonly string[];
}

function requireId(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Local ferry network has an empty or invalid ${label}`);
  }
}

function validateFlags(value: unknown, label: string): asserts value is readonly string[] {
  if (!Array.isArray(value) || value.some(flag => typeof flag !== 'string' || flag.trim().length === 0)) {
    throw new Error(`Local ferry network has invalid ${label}`);
  }
}

/** Check authored ferry data before exposing destinations or planning a trip. */
export function validateLocalFerryNetwork(network: LocalFerryNetwork): void {
  if (!network || typeof network !== 'object') throw new Error('Local ferry network must be an object');
  requireId(network.id, 'network ID');
  requireId(network.name, 'network name');
  validateFlags(network.requiredFlags, 'network requiredFlags');
  if (!Array.isArray(network.stops) || network.stops.length === 0) {
    throw new Error('Local ferry network must have at least one stop');
  }
  if (!Array.isArray(network.routes) || network.routes.length === 0) {
    throw new Error('Local ferry network must have at least one route');
  }

  const stops = new Map<string, LocalFerryStop>();
  for (const stop of network.stops) {
    if (!stop || typeof stop !== 'object') throw new Error('Local ferry network has an invalid stop');
    requireId(stop.id, 'stop ID');
    requireId(stop.name, `name for stop ${stop.id}`);
    requireId(stop.mapId, `map ID for stop ${stop.id}`);
    requireId(stop.spawnPointId, `spawn point ID for stop ${stop.id}`);
    if (stops.has(stop.id)) throw new Error(`Local ferry network has duplicate stop ID: ${stop.id}`);
    if (stop.requiredFlags !== undefined) validateFlags(stop.requiredFlags, `requiredFlags for stop ${stop.id}`);
    stops.set(stop.id, stop);
  }

  const routes = new Set<string>();
  for (const route of network.routes) {
    if (!route || typeof route !== 'object') throw new Error('Local ferry network has an invalid route');
    requireId(route.fromStopId, 'route origin stop ID');
    requireId(route.toStopId, 'route destination stop ID');
    if (!stops.has(route.fromStopId)) throw new Error(`Local ferry route references unknown stop: ${route.fromStopId}`);
    if (!stops.has(route.toStopId)) throw new Error(`Local ferry route references unknown stop: ${route.toStopId}`);
    if (route.fromStopId === route.toStopId) throw new Error(`Local ferry route cannot return to the same stop: ${route.fromStopId}`);
    const key = `${route.fromStopId}\u0000${route.toStopId}`;
    if (routes.has(key)) throw new Error(`Local ferry network has duplicate directed route: ${route.fromStopId} -> ${route.toStopId}`);
    if (route.requiredFlags !== undefined) validateFlags(route.requiredFlags, `requiredFlags for route ${route.fromStopId} -> ${route.toStopId}`);
    routes.add(key);
  }
}

function hasFlags(flags: readonly string[], requirements: readonly string[] | undefined): boolean {
  return (requirements ?? []).every(flag => flags.includes(flag));
}

export function localFerryDestinations(
  network: LocalFerryNetwork,
  traveler: LocalFerryTraveler,
  originStopId: string,
): LocalFerryStop[] {
  validateLocalFerryNetwork(network);
  const origin = network.stops.find(stop => stop.id === originStopId);
  if (!origin || traveler.player.mapId !== origin.mapId || !hasFlags(traveler.flags, network.requiredFlags) ||
      !hasFlags(traveler.flags, origin.requiredFlags)) return [];

  return network.routes
    .filter(route => route.fromStopId === originStopId &&
      hasFlags(traveler.flags, route.requiredFlags))
    .map(route => network.stops.find(stop => stop.id === route.toStopId)!)
    .filter(destination => hasFlags(traveler.flags, destination.requiredFlags));
}

export type LocalFerryTrip = { ok: true; destination: LocalFerryStop } | {
  ok: false;
  reason: 'unknown-stop' | 'wrong-origin' | 'same-stop' | 'no-route' | 'locked';
};

/** Recheck every flag and the origin map at boarding time. */
export function planLocalFerryTrip(
  network: LocalFerryNetwork,
  traveler: LocalFerryTraveler,
  originStopId: string,
  destinationStopId: string,
): LocalFerryTrip {
  validateLocalFerryNetwork(network);
  const origin = network.stops.find(stop => stop.id === originStopId);
  const destination = network.stops.find(stop => stop.id === destinationStopId);
  if (!origin || !destination) return { ok: false, reason: 'unknown-stop' };
  if (origin.mapId !== traveler.player.mapId) return { ok: false, reason: 'wrong-origin' };
  if (originStopId === destinationStopId) return { ok: false, reason: 'same-stop' };
  const route = network.routes.find(item => item.fromStopId === originStopId && item.toStopId === destinationStopId);
  if (!route) {
    return { ok: false, reason: 'no-route' };
  }
  if (!hasFlags(traveler.flags, network.requiredFlags) || !hasFlags(traveler.flags, origin.requiredFlags) ||
      !hasFlags(traveler.flags, route.requiredFlags) || !hasFlags(traveler.flags, destination.requiredFlags)) {
    return { ok: false, reason: 'locked' };
  }
  return { ok: true, destination };
}
