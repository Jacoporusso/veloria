import mira from '../../../content/trainers/gym01_mira.trainer.json' with { type: 'json' };
import dalia from '../../../content/trainers/gym02_dalia.trainer.json' with { type: 'json' };
import aster from '../../../content/trainers/gym03_aster.trainer.json' with { type: 'json' };
import rhea from '../../../content/trainers/gym04_rhea.trainer.json' with { type: 'json' };
import nerea from '../../../content/trainers/gym05_nerea.trainer.json' with { type: 'json' };
import badgeContent from '../../../content/badges/badges.v1.json' with { type: 'json' };
import { trainerPreparation } from '../battle/trainer-challenge.ts';
import type { GameSave } from '../../persistence/save-types.ts';
import type { QuestDefinition } from '../../core/quests/apply-quest-event.ts';

/** Presentation copy follows existing flags; it never grants progress or rewards. */
export const journeyMilestones = [
  { flag: 'q_starter_selected', title: 'Un compagno di viaggio', objective: 'Entra nel laboratorio a sud di Borgofonte e parla con Elia.' },
  { flag: 'q_research_sample_received', title: 'La prima ricerca', objective: 'Parla ancora con Elia: ti affiderà la sua ricerca.' },
  { flag: 'q_forest_signal_found', title: 'Le rilevazioni nel Bosco dei Veli', objective: 'Segui il Sentiero dell’Alba fino al bosco. Esamina il misuratore di risonanza nella radura del Bosco dei Veli, a destra di Ada: avvicinati e premi A.' },
  { flag: 'q_ada_helped', title: 'Riferisci ad Ada', objective: 'Torna da Ada nel Bosco dei Veli, sul sentiero a sinistra del misuratore, e premi A per riferire le rilevazioni.' },
  { flag: 'q_brumalta_visited', title: 'Le porte di Brumalta', objective: 'Segui il sentiero a destra fino all’uscita per il Viale delle Fronde, poi raggiungi Brumalta.' },
  { flag: 'gym01_puzzle_solved', title: 'I sigilli del giardino', objective: 'Nella Palestra di Brumalta, attiva i sigilli da sud verso nord.' },
  { flag: 'badge_aurora_awarded', trainer: mira, title: 'La Medaglia Aurora', objective: 'Affronta Mira nella Palestra di Brumalta.' },
  { flag: 'q_radicelmo_seed_found', optional: true, title: 'Un seme dal passato', objective: 'Dopo la Medaglia Aurora, esci da Brumalta verso est per le Terrazze del Muschio. Segui i lastroni chiari e raccogli il Seme custodito.' },
  { flag: 'q_radicelmo_seed_archived', optional: true, title: 'La memoria di Radicelmo', objective: 'Dal sentiero a est delle Terrazze del Muschio raggiungi Radicelmo e porta il seme alla custode Leda, nell’archivio della serra.' },
  { flag: 'q_radicelmo_greenhouse_started', optional: true, title: 'Un archivio che cresce', objective: 'Parla ancora con Leda davanti alla serra di Radicelmo: il seme può germogliare nel vivaio a sud dell’edificio.' },
  { flag: 'q_radicelmo_greenhouse_watered', optional: true, title: 'Prima l’acqua', objective: 'Nel vivaio a sud della serra, usa il regolatore dell’acqua a sinistra del vaso. Avvicinati e premi A.' },
  { flag: 'q_radicelmo_greenhouse_lit', optional: true, title: 'Una luce gentile', objective: 'Usa il misuratore di luce a destra del vaso, nel vivaio a sud della serra.' },
  { flag: 'q_radicelmo_seed_sprouted', optional: true, title: 'La prima foglia', objective: 'Osserva il vaso centrale del vivaio e premi A per controllare il seme.' },
  { flag: 'q_radicelmo_greenhouse_complete', optional: true, title: 'Una scoperta viva', objective: 'Torna da Leda davanti alla serra di Radicelmo per registrare il germoglio e ricevere la ricompensa.' },
  { flag: 'q_petalora_visited', title: 'Tra i ciliegi', objective: 'Esci a nord di Radicelmo. Nella Salita dei Petali segui il sentiero chiaro e i due ponti, poi risali verso nord fino a Petalora. La Medaglia Aurora apre il passaggio; la prova del vivaio è facoltativa.' },
  { flag: 'gym02_water_source_open', title: 'Acqua per i ciliegi', objective: 'Da Petalora segui il viale verso nord fino alla palestra. Apri la sorgente in basso a sinistra del giardino.' },
  { flag: 'gym02_water_west_open', title: 'La deviazione ovest', objective: 'Nella palestra di Petalora raggiungi il regolatore a sinistra, sopra la sorgente. Premi A per portare l’acqua verso il centro.' },
  { flag: 'gym02_water_east_open', title: 'La deviazione est', objective: 'Raggiungi il regolatore sulla terrazza a destra della palestra e premi A per riempire il canale superiore.' },
  { flag: 'gym02_irrigation_solved', title: 'Il giardino rifiorisce', objective: 'Osserva la Terrazza dei Ciliegi al centro della palestra, poco sotto Dalia, e premi A.' },
  { flag: 'badge_corolla_awarded', trainer: dalia, title: 'La Medaglia Corolla', objective: 'Affronta Dalia nella Palestra di Petalora. I suoi Pokémon Erba usano anche mosse di Veleno e sonno.' },
  { flag: 'q_vetracielo_visited', title: 'Verso la città dei giardini', objective: 'Con la Medaglia Corolla, esci a est di Petalora. Sul Viadotto dei Ciliegi segui il sentiero a nord, attraversa il ponte e continua a est fino a Vetracielo.' },
  { flag: 'q_vetracielo_orientation', title: 'La Piazza della Monorotaia', objective: 'Parla con Lea davanti alla stazione di Vetracielo, al centro della piazza. Trovi cure gratuite a sinistra, rifornimenti a destra e un parco con Pokémon a nord-ovest.' },
  { flag: 'gym03_line_gardens_active', title: 'La linea dei giardini', objective: 'Entra dalla scalinata della stazione di Vetracielo. Sulla terrazza attiva la console 1 Giardini in basso a sinistra.' },
  { flag: 'gym03_line_glass_active', title: 'Il collegamento di vetro', objective: 'Nella palestra di Vetracielo, dopo Giardini, attiva la console 2 Vetro sul lato destro.' },
  { flag: 'gym03_lines_connected', title: 'La rete raggiunge il cielo', objective: 'Attiva la console 3 Cielo al centro della terrazza, poco sotto Aster.' },
  { flag: 'badge_circuito_awarded', trainer: aster, title: 'La Medaglia Circuito', objective: 'Affronta Aster sulla terrazza di Vetracielo. Terra è immune alle mosse Elettro; Sonicboom invece infligge danno fisso.' },
  { flag: 'q_r06_measurement', title: 'Il segnale dell’Anello', objective: 'Con la Medaglia Circuito esci a est di Vetracielo. Sull’Anello Magnetico esamina il misuratore vicino al sentiero centrale: avvicinati e premi A.' },
  { flag: 'q_ferraluce_visited', title: 'Acciaio, vetro e giardini', objective: 'Dal misuratore prosegui a est sull’Anello Magnetico fino al primo distretto di Ferraluce.' },
  { flag: 'q_ferraluce_report', title: 'Un segnale da capire', objective: 'Porta le letture a Ivo, al centro della piazza di Ferraluce. Cure gratuite a sinistra e rifornimenti a destra.' },
  { flag: 'gym04_magnetic_aligned', title: 'Il circuito magnetico', objective: 'Dopo il rapporto a Ivo sali sulla pedana P4 a est della piazza, poco a nord del cartello. Nella palestra orienta il primo nastro a est, il secondo a nord e il campo a ovest: segui il segnale fino al ricevitore.' },
  { flag: 'badge_acciaio_awarded', trainer: rhea, title: 'La Medaglia Acciaio', objective: 'Affronta Rhea al centro-nord dell’Officina Magnetica. Prepara mosse speciali e risposte diverse: Steelix è immune a Elettro, Skarmory a Terra. Wooper si incontra sull’Anello Magnetico.' },
  { flag: 'q_r07_measurement', title: 'Gli impulsi del Condotto', objective: 'Con la Medaglia Acciaio esci a est della parte bassa della piazza di Ferraluce. Nel Condotto Risonante esamina il misuratore vicino alla curva della passerella.' },
  { flag: 'q_centrale_log', title: 'Una prova senza autorizzazione', objective: 'Dal misuratore prosegui a est fino alla Centrale Risonante. Consulta il registro sulla postazione a sinistra della sala.' },
  { flag: 'q_centrale_isolated', title: 'Mettere in sicurezza la linea', objective: 'Dopo aver letto il registro, usa la console sulla destra della Centrale per isolare la linea sperimentale. La rete ordinaria deve restare attiva.' },
  { flag: 'q_centrale_output', title: 'Un riscontro misurabile', objective: 'Verifica il sensore al centro, in fondo alla sala della Centrale. Controlla che gli impulsi della linea sperimentale siano cessati.' },
  { flag: 'q_centrale_report', title: 'I fatti prima delle accuse', objective: 'Esci a sud dalla Centrale, torna a ovest lungo il Condotto e riferisci a Ivo nella piazza di Ferraluce.' },
  { flag: 'q_portolume_visited', title: 'Il mare oltre le turbine', objective: 'Dopo il rapporto a Ivo, esci dal varco est di Ferraluce poco sopra quello del Condotto. Segui la passeggiata della Costa delle Turbine fino a Portolume.' },
  { flag: 'q_portolume_orientation', title: 'La capitana del porto', objective: 'Parla con Marina presso il molo a destra della piazza. Ti affiderà la canna e ti indicherà il battello.' },
  { flag: 'q_portolume_tide_read', title: 'Il ritmo delle maree', objective: 'Usa il battello del molo per raggiungere l’osservatorio. Leggi il misuratore sull’isola, a nord-est dell’approdo.' },
  { flag: 'q_portolume_tide_report', title: 'Misure da confrontare', objective: 'Torna al porto con il battello e riferisci le misure a Marina.' },
  { flag: 'gym05_basin_balanced', title: 'Compensare il flusso', objective: 'Entra nella palestra a nord della piazza. Regola la console a sinistra della terrazza d’ingresso.' },
  { flag: 'gym05_sluice_open', title: 'La chiusa superiore', objective: 'Attraversa il primo ponte della palestra e usa la console a destra sulla terrazza centrale.' },
  { flag: 'gym05_tide_stable', title: 'Una marea stabile', objective: 'Attraversa il secondo ponte e usa la console a sinistra sulla terrazza superiore.' },
  { flag: 'badge_marea_awarded', trainer: nerea, title: 'La Medaglia Marea', objective: 'Parla con Nerea al centro della terrazza superiore della palestra di Portolume.' },
] as const;

export function selectJourneyProgress(save: Pick<GameSave, 'flags' | 'party' | 'storage' | 'badges'>) {
  const flags = new Set(save.flags);
  const milestones = journeyMilestones.map(milestone => ({ ...milestone, optional: 'optional' in milestone && milestone.optional, complete: flags.has(milestone.flag) }));
  const completed = milestones.filter(milestone => milestone.complete).length;
  const current = milestones.find(milestone => !milestone.complete && !milestone.optional)
    ?? milestones.find(milestone => !milestone.complete);
  const trainer = current && 'trainer' in current ? current.trainer : undefined;
  const preparation = trainer ? trainerPreparation(trainer, save.party) : undefined;
  const objective = current?.objective
    ? [current.objective, preparation ? `${trainer!.name} schiera ${preparation.teamLabel}.` : '', ...(preparation?.advice ?? [])].filter(Boolean).join(' ')
    : 'Hai completato le tappe disponibili. Esplora Veloria e completa la tua collezione.';
  return {
    milestones, completed, total: milestones.length,
    percent: Math.round(completed / milestones.length * 100),
    title: current?.title ?? 'Il viaggio continua',
    currentFlag: current?.flag,
    objective,
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
  for (const badge of badges) rewards.push((badgeContent.badges as Record<string, {name: string}>)[badge]?.name ?? badge);
  return rewards;
}
