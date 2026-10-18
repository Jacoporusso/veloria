import type { CreatureSave } from '../../persistence/save-types.ts';

type TrainerPreview = { readonly name: string; readonly team: readonly { readonly level: number }[] };
type PartyPreview = readonly (Pick<CreatureSave, 'level' | 'hp' | 'maxHp' | 'status'> & { readonly moves?: readonly { readonly pp: number }[] })[];

/** Advice is derived from visible teams. It never locks a challenge or alters a save. */
export function trainerPreparation(trainer: TrainerPreview, party: PartyPreview, inventory?: Readonly<Record<string, number>>) {
  const levels = trainer.team.map(member => member.level);
  const minimumLevel = Math.min(...levels);
  const maximumLevel = Math.max(...levels);
  const levelLabel = minimumLevel === maximumLevel ? `${minimumLevel}` : `${minimumLevel}–${maximumLevel}`;
  const teamLabel = `${trainer.team.length} Pokémon di livello ${levelLabel}`;
  const strongestLevel = Math.max(0, ...party.map(member => member.level));
  const advice: string[] = [];
  if (strongestLevel < maximumLevel) {
    advice.push(`Il tuo Pokémon più allenato è al livello ${strongestLevel}. Puoi prepararti con gli incontri nelle zone di foglie dei percorsi già esplorati.`);
  }
  if (party.length < trainer.team.length) advice.push('Catturare un compagno può aiutarti nella sfida.');
  if (party.some(member => member.hp < member.maxHp || member.status || member.moves?.some(move => move.pp === 0))) {
    advice.push('Al Centro Pokémon puoi recuperare HP e PP e rimuovere gli stati alterati gratuitamente.');
  }
  if (inventory && trainer.team.length > 1 && !(inventory.potion > 0)) advice.push('Fai scorta di Pozioni prima della sfida: recuperano HP durante la lotta.');
  return { teamLabel, minimumLevel, maximumLevel, advice };
}

export function trainerChallengePrompt(trainer: TrainerPreview, party: PartyPreview, inventory?: Readonly<Record<string, number>>): string {
  const preparation = trainerPreparation(trainer, party, inventory);
  return [`${trainer.name} schiera ${preparation.teamLabel}.`, ...preparation.advice, `Vuoi affrontare ${trainer.name}?`].join(' ');
}
