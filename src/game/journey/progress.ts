import type { GameSave } from '../../persistence/save-types.ts';
import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';

/** Presentation copy follows existing flags; it never grants progress or rewards. */
export const journeyMilestones = [
  { flag: 'q_starter_selected', title: 'Un compagno di viaggio', objective: 'Entra nel laboratorio a sud di Borgofonte e parla con Elia.' },
  { flag: 'q_research_sample_received', title: 'La prima ricerca', objective: 'Parla ancora con Elia: ti affiderà la sua ricerca.' },
  { flag: 'q_forest_signal_found', title: 'Un segnale tra gli alberi', objective: 'Segui il Sentiero dell’Alba e cerca il segnale nel Bosco dei Veli.' },
  { flag: 'q_ada_helped', title: 'La fiducia di Ada', objective: 'Racconta ad Ada, nel Bosco dei Veli, quello che hai scoperto.' },
  { flag: 'q_brumalta_visited', title: 'Le porte di Brumalta', objective: 'Prosegui verso Brumalta: la tua prima Palestra ti aspetta.' },
  { flag: 'gym01_puzzle_solved', title: 'I sigilli del giardino', objective: 'Nella Palestra di Brumalta, attiva i sigilli da sud verso nord.' },
  { flag: 'badge_aurora_awarded', title: 'La Medaglia Aurora', objective: 'Affronta Mira nella Palestra di Brumalta.' },
  { flag: 'q_radicelmo_seed_found', title: 'Un seme dal passato', objective: 'Esplora la Via delle Radici e recupera il seme ancestrale.' },
  { flag: 'q_radicelmo_seed_archived', title: 'La memoria di Radicelmo', objective: 'Porta il seme all’Archivio dei Semi di Radicelmo.' },
] as const;

export function selectJourneyProgress(save: Pick<GameSave, 'flags' | 'party' | 'storage' | 'badges'>) {
  const flags = new Set(save.flags);
  const milestones = journeyMilestones.map(milestone => ({ ...milestone, complete: flags.has(milestone.flag) }));
  const completed = milestones.filter(milestone => milestone.complete).length;
  const current = milestones.find(milestone => !milestone.complete);
  return {
    milestones, completed, total: milestones.length,
    percent: Math.round(completed / milestones.length * 100),
    title: current?.title ?? 'Il viaggio continua',
    objective: current?.objective ?? 'Hai completato le tappe disponibili. Esplora Veloria e completa la tua collezione.',
    speciesCount: new Set([...save.party, ...save.storage].map(creature => creature.speciesId)).size,
    badgeCount: save.badges.length,
  };
}

export function formatQuestRewards(quest: QuestDefinition, itemNames: Readonly<Record<string, string>>): string[] {
  const rewards: string[] = [];
  if (quest.reward?.money) rewards.push(`+${quest.reward.money} monete`);
  for (const [itemId, quantity] of Object.entries(quest.reward?.items ?? {})) {
    if (quantity > 0) rewards.push(`${itemNames[itemId] ?? itemId} ×${quantity}`);
  }
  const badges = new Set(quest.steps.flatMap(step => step.addBadge ? [step.addBadge] : []));
  for (const badge of badges) rewards.push(badge === 'badge_aurora' ? 'Medaglia Aurora' : badge);
  return rewards;
}
