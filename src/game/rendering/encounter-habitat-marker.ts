import type { MapTrigger } from '../maps/map-types.ts';

export type EncounterHabitatMarker = { x: number; y: number; triggerId: string };

/** The guide uses the same silhouette and palette as the authored map markers. */
export const ENCOUNTER_HABITAT_SYMBOL = '<svg xmlns="http://www.w3.org/2000/svg" width="33" height="24" viewBox="-11 -8 22 16" aria-hidden="true" style="vertical-align:middle;margin-right:8px"><rect x="-10.5" y="-7.5" width="21" height="15" rx="7" fill="#173d42" stroke="#e0f9d9" stroke-width=".7"/><g fill="#c9f5c1"><ellipse cx="0" cy="-3" rx="2.5" ry="3.5"/><ellipse cx="-4" cy="1" rx="2.5" ry="3"/><ellipse cx="4" cy="1" rx="2.5" ry="3"/></g><path d="M0 0v4" stroke="#f5fff0" stroke-width="1.2"/></svg>';

/** One stable marker per authored encounter patch, independent of its tile count. */
export function createEncounterHabitatMarkers(triggers: readonly Pick<MapTrigger, 'id' | 'kind' | 'x' | 'y' | 'width' | 'height'>[]): EncounterHabitatMarker[] {
  return triggers.flatMap(trigger => {
    if (trigger.kind !== 'encounter-zone' || trigger.width <= 0 || trigger.height <= 0) return [];
    return [{
      x: trigger.x + trigger.width / 2,
      y: trigger.y + trigger.height / 2,
      triggerId: trigger.id,
    }];
  });
}
