import type { BattleCreature, MoveDefinition } from '../../../src/core/battle/types.ts';

export type CaptureMoveForecast = { minimum: number; maximum: number; accuracy: number } | undefined;

/**
 * Select the lowest-maximum-damage known move that has PP, a positive forecast,
 * a positive hit chance, and normal forecast below the currently visible HP.
 * Critical hits can exceed the shown range; this reduces risk, not guarantees capture.
 * `undefined` means preserve the target and throw the capture item instead.
 */
export function chooseCaptureWeakeningMove(
  own: BattleCreature,
  moveCatalog: Readonly<Record<string, MoveDefinition>>,
  forecasts: Readonly<Record<string, CaptureMoveForecast>>,
  visibleTargetHp: number,
): MoveDefinition | undefined {
  if (!Number.isFinite(visibleTargetHp) || visibleTargetHp <= 0) return undefined;

  let weakest: MoveDefinition | undefined;
  let weakestMaximum = Number.POSITIVE_INFINITY;
  for (const slot of own.moves) {
    if (slot.pp <= 0) continue;
    const move = moveCatalog[slot.moveId];
    const forecast = forecasts[slot.moveId];
    if (!move || move.category === 'status' || !forecast || forecast.accuracy <= 0 ||
        forecast.maximum <= 0 || forecast.maximum >= visibleTargetHp) continue;
    if (forecast.maximum < weakestMaximum) {
      weakest = move;
      weakestMaximum = forecast.maximum;
    }
  }
  return weakest;
}
