type Point = { x: number; y: number };
type AreaTrigger = Point & { width: number; height: number; kind?: string };

/** A doorway remains usable when its threshold overlaps an ambient/message zone. */
export function selectAreaTrigger<T extends AreaTrigger>(triggers: readonly T[], point: Point): T | undefined {
  let fallback: T | undefined;
  for (const trigger of triggers) {
    if (point.x < trigger.x || point.x >= trigger.x + trigger.width ||
        point.y < trigger.y || point.y >= trigger.y + trigger.height) continue;
    if (trigger.kind === 'map-exit') return trigger;
    fallback ??= trigger;
  }
  return fallback;
}
