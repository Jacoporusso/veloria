import type { MapAmbientArea, MapAmbientEffect } from '../maps/map-types.ts';

export type AmbientEffectPoint = { x: number; y: number; color: string; phase: number };
export type GrassSwayPoint = AmbientEffectPoint & { scale: number };
export type GrassSwayTween = { angle: { from: number; to: number }; duration: number; delay: number; yoyo: true; repeat: -1; ease: 'Sine.easeInOut' };
export type WaterShimmerTween = { x: { from: number; to: number }; alpha: { from: number; to: number }; duration: number; delay: number; yoyo: true; repeat: -1; ease: 'Sine.easeInOut' };

/** Stable per-map cosmetic placement keeps the scene art consistent across reloads. */
export function createAmbientEffectPoints(mapId: string, effect: MapAmbientEffect): AmbientEffectPoint[] {
  if (effect.kind !== 'fireflies' && effect.kind !== 'petals') throw new Error('Ambient effect is not a floating particle profile.');
  const random = createRandom(`${mapId}:${effect.kind}`);

  return Array.from({ length: effect.count }, () => ({
    x: effect.area.x + random() * effect.area.width,
    y: effect.area.y + random() * effect.area.height,
    color: effect.colors[Math.floor(random() * effect.colors.length)]!,
    phase: random(),
  }));
}

/** Stable highlight placement inside a Tiled-authored water area. */
export function createWaterShimmerPoints(mapId: string, effect: Extract<MapAmbientEffect, { kind: 'water-shimmer' }>): AmbientEffectPoint[] {
  const random = createRandom(`${mapId}:${effect.kind}`);
  const inset = Math.min(6, effect.area.width / 4, effect.area.height / 4);
  const width = Math.max(1, effect.area.width - inset * 2);
  const height = Math.max(1, effect.area.height - inset * 2);
  return Array.from({ length: effect.count }, () => ({
    x: effect.area.x + inset + random() * width,
    y: effect.area.y + inset + random() * height,
    color: effect.colors[Math.floor(random() * effect.colors.length)]!,
    phase: random(),
  }));
}

export function getWaterShimmerTween(point: AmbientEffectPoint, reducedMotion: boolean): WaterShimmerTween | null {
  if (reducedMotion) return null;
  return {
    x: { from: point.x - 3, to: point.x + 3 },
    alpha: { from: .18, to: .62 },
    duration: 1500 + point.phase * 1200,
    delay: point.phase * 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  };
}

/** Deterministic decorative tufts inside authored grass patches. */
export function createGrassSwayPoints(mapId: string, effect: Extract<MapAmbientEffect, { kind: 'grass-sway' }>, areas: readonly MapAmbientArea[]): GrassSwayPoint[] {
  return areas.flatMap((area, areaIndex) => {
    const random = createRandom(`${mapId}:${effect.kind}:${areaIndex}`);
    const rows = Math.max(1, Math.floor(area.height / 32));
    return Array.from({ length: effect.tuftsPerArea }, () => ({
      x: area.x + 4 + random() * Math.max(1, area.width - 8),
      y: area.y + Math.floor(random() * rows) * 32 + 28,
      color: effect.colors[Math.floor(random() * effect.colors.length)]!,
      phase: random(),
      scale: .8 + random() * .4,
    }));
  });
}

export function getGrassSwayTween(point: GrassSwayPoint, reducedMotion: boolean): GrassSwayTween | null {
  if (reducedMotion) return null;
  return {
    angle: { from: -4, to: 4 },
    duration: 1250 + point.phase * 850,
    delay: point.phase * 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  };
}

function createRandom(key: string): () => number {
  let seed = hashString(key);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
