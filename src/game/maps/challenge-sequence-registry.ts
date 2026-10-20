import { validateChallengeSequence, type ChallengeSequence } from '../../core/world/challenge-sequence.ts';

const sequences = Object.values(import.meta.glob<ChallengeSequence>(
  '../../../content/challenges/*.sequence.json', { eager: true, import: 'default' },
));
sequences.forEach(validateChallengeSequence);
if (new Set(sequences.map(sequence => sequence.id)).size !== sequences.length) throw new Error('Duplicate challenge sequence IDs.');

export function listChallengeSequences(): readonly ChallengeSequence[] { return sequences; }
export function getChallengeSequence(id: string): ChallengeSequence | undefined { return sequences.find(sequence => sequence.id === id); }
