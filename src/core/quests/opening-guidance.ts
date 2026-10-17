export interface OpeningGuidance {
  readonly mapId: string;
  readonly destinationMapId?: string;
  readonly npcId?: string;
  readonly label: string;
  readonly requiresFlags?: readonly string[];
  readonly missingFlags?: readonly string[];
}
export function selectOpeningGuidance(mapId: string, flags: readonly string[], targets: readonly OpeningGuidance[]): OpeningGuidance | undefined {
  const active = new Set(flags);
  return targets.find(target => target.mapId === mapId && (target.requiresFlags ?? []).every(flag => active.has(flag)) && (target.missingFlags ?? []).every(flag => !active.has(flag)));
}
