import startersData from '../../../content/starters/starting-partners.v1.json';
import type { GameSave } from '../../persistence/save-store';

export const starters = startersData.starters;
const STARTER_FLAG = startersData.selectionFlag;

export function getStarterName(speciesId: number | undefined): string {
  return starters.find(starter => starter.speciesId === speciesId)?.name ?? 'compagno';
}

export function selectStarter(save: GameSave, speciesId: number, instanceId: string): GameSave | null {
  if (save.flags.includes(STARTER_FLAG)) return null;
  const starter = starters.find(item => item.speciesId === speciesId);
  if (!starter) throw new Error(`Unknown starter species: ${speciesId}`);

  return {
    ...save,
    party: [{ instanceId, speciesId, level: 5, experience: 0, hp: starter.hp, maxHp: starter.hp, moves: starter.moves.map(move => ({ ...move })) }],
    flags: [...save.flags, STARTER_FLAG],
  };
}
