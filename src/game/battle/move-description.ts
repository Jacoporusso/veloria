import type { BattleStat, MajorStatus, MoveDefinition, MovePowerRule } from '../../core/battle/types.ts';
import { battleTypeLabel } from './presentation.ts';
import abilityContent from '../../../content/battle/abilities.v1.json' with { type: 'json' };

const STATS: Record<BattleStat, string> = { attack: 'Attacco', defense: 'Difesa', specialAttack: 'Attacco speciale', specialDefense: 'Difesa speciale', speed: 'Velocità', accuracy: 'Precisione', evasion: 'Elusione' };
const STATUS: Record<MajorStatus, string> = { burn: 'scottatura', poison: 'veleno', paralysis: 'paralisi', sleep: 'sonno', freeze: 'gelo' };
const STATUS_HELP: Record<MajorStatus, string> = { burn: 'La scottatura causa danni a fine turno e riduce i danni fisici inflitti.', poison: 'Il veleno sottrae HP a fine turno.', paralysis: 'La paralisi riduce la Velocità e può impedire di agire.', sleep: 'Il sonno impedisce di usare mosse finché il Pokémon non si sveglia.', freeze: 'Il gelo impedisce di usare mosse finché il Pokémon non si scongela.' };
const chance = (value: number) => value < 100 ? ` (${value}% di probabilità)` : '';
const POWER_RULES: Record<MovePowerRule, string> = {
  brine: 'La potenza raddoppia se l’avversario ha metà degli HP o meno.',
  targetDamaged: 'La potenza raddoppia se l’avversario ha già subito danni in questo turno.',
  userDamaged: 'La potenza raddoppia se il tuo Pokémon è stato danneggiato dall’avversario in questo turno.',
  targetActed: 'La potenza raddoppia se l’avversario ha già agito.',
  targetAsleep: 'La potenza raddoppia contro un avversario addormentato.',
  lowHp: 'La potenza aumenta quando al tuo Pokémon restano meno HP.',
  gyroBall: 'Più il tuo Pokémon è lento rispetto all’avversario, maggiore è la potenza.',
  wringOut: 'La potenza è maggiore quando all’avversario restano più HP.',
  lowKick: 'La potenza dipende dal peso avversario: un bersaglio più pesante subisce un colpo più potente.',
  punishment: 'La potenza aumenta con i gradi positivi delle statistiche avversarie.',
  furyCutter: 'Usata in successione, raddoppia la potenza fino a 16 volte. Un errore o una sostituzione interrompe la serie.',
  rollout: 'La potenza raddoppia a ogni colpo consecutivo, fino a 16 volte. Un errore interrompe la serie.',
  trumpCard: 'La potenza aumenta quando alla mossa restano meno PP: raggiunge il massimo quando consumi l’ultimo PP.',
  stockpile: 'La potenza dipende dagli accumuli di Accumulo: 100 per accumulo, fino a 300. Fallisce senza accumuli.',
};

/** Describes implemented effects directly from the runtime catalog, never from move names. */
export function describeMoveEffects(move: MoveDefinition): string[] {
  const effects: string[] = [];
  if (move.powerRule) effects.push(POWER_RULES[move.powerRule]);
  if (move.fixedDamage) effects.push(`Infligge ${move.fixedDamage} HP di danno fisso se colpisce. Statistiche, resistenze, bonus di tipo e colpi critici non aumentano o riducono questo danno; le immunità lo annullano.`);
  if (move.damageByUserLevel) effects.push('Infligge un numero di HP pari al livello del tuo Pokémon; le immunità possono annullarlo.');
  if (move.targetHpFraction) effects.push(`Sottrae il ${move.targetHpFraction * 100}% degli HP attuali avversari, se colpisce e il bersaglio non è immune.`);
  if (move.endeavorDamage) effects.push('Porta gli HP avversari al valore degli HP attuali del tuo Pokémon. Fallisce se l’avversario ha già gli stessi HP o meno.');
  if (move.oneHitKO) effects.push('Se colpisce, manda KO l’avversario. Fallisce contro un livello superiore; la precisione cresce con la differenza di livello. Le immunità restano valide.');
  if (move.category !== 'status' && move.power > 0) effects.push(move.category === 'physical'
    ? 'Infligge danni fisici: il tuo Attacco si confronta con la Difesa avversaria.'
    : 'Infligge danni speciali: il tuo Attacco speciale si confronta con la Difesa speciale avversaria.');
  for (const change of move.statChanges ?? []) {
    if (!change.stages) continue;
    effects.push(`${change.stages > 0 ? 'Aumenta' : 'Riduce'} ${STATS[change.stat]} ${change.target === 'self' ? 'del tuo Pokémon' : 'dell’avversario'} di ${Math.abs(change.stages)} ${Math.abs(change.stages) === 1 ? 'grado' : 'gradi'}${chance(move.statChangeChance ?? 100)}.`);
  }
  if (move.inflictedStatus) effects.push(`Infligge ${STATUS[move.inflictedStatus]} ${move.statusTarget === 'self' ? 'al tuo Pokémon' : 'all’avversario'}${chance(move.statusChance ?? 100)}${move.minStatusTurns ? ` per ${move.minStatusTurns === move.maxStatusTurns ? move.minStatusTurns : `${move.minStatusTurns}–${move.maxStatusTurns ?? move.minStatusTurns}`} turni` : ''}. ${STATUS_HELP[move.inflictedStatus]}`);
  if (move.inflictedBadlyPoisoned) effects.push(`Causa veleno progressivo all’avversario${chance(move.statusChance ?? 100)}: il danno parte da 1/16 degli HP massimi e aumenta a ogni turno. Sostituire il Pokémon riporta il conteggio iniziale; lo stato resta finché viene curato.`);
  if (move.nightmareMove) effects.push('Funziona solo contro un Pokémon addormentato: gli sottrae 1/4 degli HP massimi a fine turno finché dorme e resta in campo.');
  if (move.mirrorMove) effects.push('Ripete l’ultima mossa avversaria diretta contro il tuo Pokémon, se chi l’ha usata è ancora in campo e la conosce. Alcune mosse non sono copiabili.');
  if (move.copyLastBattleMove) effects.push('Ripete l’ultima mossa usata nella lotta, anche se era del tuo Pokémon. Fallisce se quella mossa non è copiabile.');
  if (move.encoreTarget) effects.push('Costringe l’avversario a ripetere la sua ultima mossa per 4–8 azioni. Termina se esaurisce i PP o viene sostituito.');
  if (move.uproar) effects.push('Il frastuono sveglia i Pokémon attivi e impedisce di addormentarsi finché continua. Può essere usata anche durante il sonno.');
  if (move.destinyBond) effects.push('Fino alla tua prossima mossa, se un attacco avversario manda KO il tuo Pokémon, va KO anche chi ha attaccato. Non si attiva per danni a fine turno.');
  if (move.grudge) effects.push('Fino alla tua prossima mossa, se il tuo Pokémon va KO per un attacco diretto, azzera i PP rimasti della mossa che lo ha sconfitto.');
  if (move.futureSight) effects.push('Prepara un attacco che colpisce alla fine del secondo turno successivo, anche se il bersaglio viene sostituito. Il danno viene calcolato quando usi la mossa e non usa debolezze, resistenze, bonus del proprio tipo o colpi critici.');
  if (move.requiresHeldItemContext) effects.push('Richiede un oggetto tenuto o già consumato da un Pokémon. In Veloria i compagni usano gli strumenti dallo zaino e non tengono oggetti: questa mossa non può riuscire.');
  if (move.heldItemSecondaryEffect) effects.push(`L’effetto aggiuntivo può ${move.heldItemSecondaryEffect === 'steal' ? 'rubare un oggetto tenuto' : move.heldItemSecondaryEffect === 'remove' ? 'rimuovere un oggetto tenuto' : 'consumare la bacca tenuta dal bersaglio'}. In Veloria i Pokémon non tengono oggetti: restano i danni indicati, senza questo effetto aggiuntivo.`);
  if (move.suppressesAbility) effects.push('Disattiva l’abilità avversaria finché il bersaglio resta in campo. Non cambia l’abilità permanente del Pokémon.');
  if (move.magnetRise) effects.push('Fa levitare il tuo Pokémon per 5 turni, rendendolo immune alle mosse Terra finché non viene messo a terra da un altro effetto.');
  if (move.sleepTalk) effects.push('Funziona solo mentre il tuo Pokémon dorme: usa casualmente una delle sue altre mosse compatibili, senza consumare i PP di quella mossa.');
  if (move.mimic) effects.push('Sostituisce temporaneamente questa mossa con l’ultima mossa avversaria copiabile, con 5 PP. La mossa originale torna quando cambi Pokémon o finisce la lotta.');
  if (move.metronome) effects.push('Usa casualmente una mossa compatibile del catalogo di Veloria, consumando solo i PP di Metronomo. Non puoi scegliere quale mossa uscirà.');
  if (move.rage) effects.push('Dopo averla usata, aumenta l’Attacco di 1 grado quando ricevi un colpo, fino alla tua prossima azione.');
  if (move.substitute) effects.push('Sacrifica 1/4 degli HP massimi per creare un sostituto con altrettanti HP. Assorbe i colpi e protegge dagli effetti diretti finché viene distrutto; sparisce quando cambi Pokémon. Fallisce se non hai abbastanza HP.');
  if (move.gravity) effects.push('Intensifica la gravità per 5 turni: moltiplica la precisione delle mosse per 5/3 e tutti i Pokémon vengono messi a terra, anche Volante e Levitazione. Interrompe e impedisce le mosse che richiedono di sollevarsi, come Volo e Rimbalzo.');
  if (move.magicCoat) effects.push('Per questo turno riflette contro chi le usa le mosse di supporto compatibili dirette al tuo Pokémon, come quelle che infliggono sonno. Non riflette gli attacchi che causano danni.');
  if (move.payDay) effects.push('Sparge monete pari a 5 volte il livello di chi la usa. Le monete accumulate vengono raccolte se vinci la lotta o catturi il Pokémon selvatico.');
  if (move.batonPass) effects.push('Scegli un compagno della squadra: entra al posto del tuo Pokémon e riceve i gradi temporanei delle statistiche e gli effetti trasferibili, compreso l’eventuale sostituto. Non trasferisce gli stati principali come veleno o paralisi.');
  if (move.healingWish) effects.push('Il tuo Pokémon va KO per affidare un desiderio al compagno che lo sostituirà. Dopo i danni di ingresso, il compagno che resta in piedi recupera tutti gli HP e guarisce dagli stati principali. Richiede un altro Pokémon disponibile in squadra.');
  if (move.camouflage) effects.push('Cambia il tipo del tuo Pokémon in Normale, secondo le regole di terreno usate nelle lotte di Veloria. Il tipo originale torna quando viene sostituito.');
  if (move.meFirst) effects.push('Se agisci prima di un avversario che ha scelto un attacco, lo copi e lo usi contro di lui con danni aumentati del 50%. Fallisce se l’avversario ha già agito o la mossa non è copiabile.');
  if (move.pursuit) effects.push('Intercetta un avversario che sta lasciando il campo e raddoppia i danni in quel caso. Con Staffetta il momento del cambio dipende dall’ordine delle azioni.');
  if (move.randomInflictedStatuses?.length) effects.push(`Può causare uno solo di questi stati: ${move.randomInflictedStatuses.map(status => STATUS[status]).join(', ')}${chance(move.statusChance ?? 100)}.`);
  if (move.statusAffectedByTypeImmunity) effects.push(`Non funziona sui Pokémon immuni al tipo ${battleTypeLabel(move.type)}.`);
  if (move.inflictedConfusionChance) effects.push(`Confonde l’avversario${chance(move.inflictedConfusionChance)}${move.minConfusionTurns ? ` per ${move.minConfusionTurns}–${move.maxConfusionTurns ?? move.minConfusionTurns} turni` : ''}: può colpirsi da solo. Sostituire il Pokémon elimina la confusione.`);
  if (move.flinchChance) effects.push(`Può far tentennare l’avversario (${move.flinchChance}% di probabilità): perde la mossa di questo turno senza consumare PP, solo se colpisci prima che agisca e resta in campo.`);
  if (move.inflictedStatus && move.flinchChance) effects.push('Le due probabilità sono indipendenti: un colpo può causare entrambi gli effetti.');
  if (move.inflictedStatus === 'freeze') effects.push(`I Pokémon di tipo Ghiaccio sono immuni al gelo.${move.flinchChance ? ' Possono comunque tentennare.' : ''}`);
  if (move.drainPercent) effects.push(`Recuperi HP pari al ${move.drainPercent}% dei danni inflitti.`);
  if (move.healingPercent) effects.push(move.weatherRecovery
    ? 'Cura metà degli HP massimi senza meteo, due terzi con il sole e un quarto con pioggia, sabbia o grandine.'
    : `Cura il ${move.healingPercent}% degli HP massimi del tuo Pokémon.`);
  if (move.curesUserStatuses?.length) effects.push(`Cura questi stati del tuo Pokémon: ${move.curesUserStatuses.map(status => STATUS[status]).join(', ')}.`);
  if (move.curesPartyStatuses) effects.push('Cura gli stati alterati persistenti di tutti i Pokémon della squadra.');
  if (move.curesPartyConfusion) effects.push('Elimina la confusione dai compagni.');
  if (move.replacesUserStatusWithInflictedStatus) effects.push('Elimina lo stato alterato precedente prima di applicare il nuovo stato.');
  if (move.requiresMissingHp) effects.push('Fallisce se gli HP sono già al massimo.');
  if (move.requiresSleepingTarget) effects.push('Funziona soltanto contro un avversario addormentato.');
  if (move.usableWhileAsleep) effects.push('Può essere usata mentre il tuo Pokémon dorme.');
  if (move.wakesTargetIfAsleep) effects.push('Se colpisce un avversario addormentato, lo sveglia.');
  if (move.leavesTargetAtOneHp) effects.push('Lascia almeno 1 HP all’avversario: utile per preparare una cattura.');
  if (move.criticalStageBoost) effects.push(`Probabilità di colpo critico aumentata di ${move.criticalStageBoost} grado.`);
  if (move.criticalStageChange) effects.push(`Aumenta di ${move.criticalStageChange} gradi la probabilità critica del tuo Pokémon, fino alla sostituzione.`);
  if (move.bellyDrum) effects.push('Sacrifica metà degli HP massimi e porta l’Attacco al grado massimo (+6). Richiede più di metà degli HP.');
  if (move.randomStatBoost) effects.push('Aumenta di 2 gradi una statistica scelta casualmente fra quelle che non sono già al massimo.');
  if (move.faintUserAfterMove) effects.push('Il tuo Pokémon va KO dopo aver usato la mossa.');
  if (move.damageDefenseMultiplier === .5) effects.push('Calcola il danno usando la Difesa avversaria dimezzata.');
  if (move.escapeBattle) effects.push('Permette di fuggire da un incontro selvatico, se non sei intrappolato. Non permette di fuggire da un allenatore.');
  if (move.transformTarget) effects.push('Copia forma, peso, tipi, abilità, statistiche tranne gli HP, gradi temporanei e mosse avversarie, con 5 PP per mossa. La trasformazione termina con una sostituzione o a fine lotta.');
  if (move.copyTargetAbility) effects.push('Copia l’abilità dell’avversario. L’abilità originale ritorna con una sostituzione o a fine lotta.');
  if (move.setTargetAbility) effects.push(`Sostituisce l’abilità avversaria con ${(abilityContent.abilities as Record<string, {name: string}>)[move.setTargetAbility]?.name ?? move.setTargetAbility}, fino alla sostituzione o a fine lotta.`);
  if (move.counterDamageCategory) effects.push(`Restituisce il doppio dei danni ${move.counterDamageCategory === 'physical' ? 'fisici' : 'speciali'} dell’ultimo colpo avversario subito in questo turno. Fallisce se non hai subito un colpo adatto.`);
  if (move.foresight) effects.push('Permette di colpire gli Spettro con Normale e Lotta e annulla i vantaggi di Elusione del bersaglio, fino alla sua sostituzione.');
  if (move.miracleEye) effects.push('Permette di colpire i tipi Buio con Psico e annulla i vantaggi di Elusione del bersaglio, fino alla sua sostituzione.');
  if (move.roost) effects.push('Per il resto di questo turno perde temporaneamente il tipo Volante: possono cambiare debolezze e immunità.');
  if (move.lockOn) effects.push('La prossima mossa contro lo stesso bersaglio, entro la fine del turno successivo, ignora precisione ed elusione e può raggiungerlo anche durante Volo o Fossa. Protezione può ancora fermarla.');
  if (move.lastResort) effects.push('Funziona solo dopo aver usato tutte le altre mosse del tuo Pokémon da quando è entrato in campo. Fallisce se è la sua unica mossa.');
  if (move.conversion) effects.push('Cambia il proprio tipo in quello di una delle proprie mosse, scelto casualmente tra i tipi diversi da quello attuale.');
  if (move.conversion2) effects.push('Cambia il proprio tipo in uno che resiste o è immune al tipo dell’ultima mossa avversaria ricevuta.');
  if (move.requiresOppositeGender) effects.push('Funziona soltanto se il bersaglio è del sesso opposto. Fallisce con Pokémon senza sesso.');
  if (move.requiresTargetDamagingMove) effects.push('Riesce soltanto se l’avversario ha scelto una mossa che infligge danni e deve ancora agire.');
  if (move.forceSwitchTarget) effects.push('In una lotta contro un allenatore costringe il bersaglio a lasciare il posto a un compagno disponibile. Contro un Pokémon selvatico può terminare l’incontro senza cattura.');
  if (move.curseMove) effects.push('Se chi la usa è Spettro, sacrifica metà degli HP massimi per maledire il bersaglio, che perde 1/4 degli HP massimi a fine turno finché resta in campo. Negli altri casi aumenta Attacco e Difesa di 1 grado e riduce Velocità di 1 grado.');
  if (move.perishSong) effects.push('Avvia un conto alla rovescia per entrambi i Pokémon attivi: dopo tre turni vanno KO. Sostituire un Pokémon annulla il suo conto; Antisuono protegge chi possiede l’abilità.');
  if (move.hazardEffect === 'setSpikes') effects.push('Sparge punte sul lato avversario, fino a 3 strati: i Pokémon a terra perdono 1/8, 1/6 o 1/4 degli HP massimi quando entrano in campo.');
  if (move.hazardEffect === 'setToxicSpikes') effects.push('Sparge punte velenose sul lato avversario: 1 strato avvelena chi entra a terra, 2 strati causano veleno progressivo. I Pokémon Veleno a terra le assorbono; Volante, Levitazione e Acciaio evitano il veleno.');
  if (move.hazardEffect === 'rapidSpin') effects.push('Se colpisce, libera il tuo Pokémon dai semi e dalle mosse che lo intrappolano, e rimuove le punte dal tuo lato del campo.');
  if (move.makesContact) effects.push('Richiede contatto fisico: può attivare le abilità avversarie legate al contatto.');
  if (move.soundMove) effects.push('È una mossa sonora: non funziona contro l’abilità Antisuono.');
  if (move.imprison) effects.push('Finché il tuo Pokémon resta in campo, impedisce all’avversario di usare le mosse che entrambi conoscono.');
  if (move.stockpile) effects.push('Accumula energia fino a 3 volte, aumentando ogni volta Difesa e Difesa speciale di 1 grado.');
  if (move.stockpileConsumes) effects.push('Consuma tutti gli accumuli e annulla gli aumenti difensivi che avevano prodotto.');
  if (move.swallow) effects.push('Consuma gli accumuli per curare il 25%, 50% o 100% degli HP massimi con 1, 2 o 3 accumuli; annulla i relativi aumenti difensivi.');
  if (move.aquaRing || move.ingrain) effects.push('Recupera 1/16 degli HP massimi a fine turno finché resta in campo.');
  if (move.ingrain) effects.push('Mette radici: non può essere sostituito e può essere colpito da Terra anche se prima era immune.');
  if (move.halvesElectricDamage) effects.push('Finché chi ha usato la mossa resta attivo, dimezza i danni delle mosse Elettro su tutto il campo.');
  if (move.halvesFireDamage) effects.push('Finché chi ha usato la mossa resta attivo, dimezza i danni delle mosse Fuoco su tutto il campo.');
  if (move.mist) effects.push('Protegge la tua parte dalle riduzioni delle statistiche causate dall’avversario per 5 turni.');
  if (move.luckyChant) effects.push('Impedisce colpi critici contro la tua parte per 5 turni.');
  if (move.safeguard) effects.push('Protegge la tua parte da nuovi stati alterati e confusione per 5 turni.');
  if (move.inflictsDrowsiness) effects.push('Rende assonnato il bersaglio: si addormenta alla fine del turno successivo se resta in campo.');
  if (move.statStageSwap) effects.push(`Scambia con l’avversario i gradi temporanei di ${move.statStageSwap.map(stat => STATS[stat as BattleStat] ?? stat).join(' e ')}; non scambia le statistiche base.`);
  if (move.copyTargetStatStages) effects.push('Copia i gradi temporanei delle statistiche avversarie, comprese Precisione ed Elusione.');
  if (move.clearAllStatStages) effects.push('Azzera i gradi temporanei di statistiche, Precisione ed Elusione di entrambi i Pokémon attivi.');
  if (move.reduceLastMovePp) effects.push(`Riduce fino a ${move.reduceLastMovePp} PP l’ultima mossa usata dall’avversario.`);
  if (move.chargeElectricBoost) effects.push('Aumenta la Difesa speciale di 1 grado e raddoppia la potenza della prossima mossa Elettro usata nel turno successivo.');
  if (move.tailwind) effects.push('Raddoppia la Velocità della tua parte per 3 turni; il vento continua anche cambiando Pokémon.');
  if (move.alwaysFails) effects.push(['follow-me', 'helping-hand'].includes(move.id)
    ? 'È pensata per le lotte con alleati. Nelle lotte singole di Veloria non produce effetti.'
    : 'Non produce alcun effetto in lotta.');
  if (move.trapTarget) effects.push(`Intrappola l’avversario per ${move.trapTarget.minTurns}–${move.trapTarget.maxTurns} turni: perde il ${move.trapTarget.damageFraction * 100}% degli HP massimi a fine turno e non può fuggire o essere sostituito.`);
  if (move.disableLastMove) effects.push(`Blocca l’ultima mossa usata dall’avversario${move.disableMinTurns ? ` per ${move.disableMinTurns}–${move.disableMaxTurns ?? move.disableMinTurns} turni` : ''}. Fallisce se non ha ancora usato una mossa.`);
  if (move.tauntsTarget) effects.push(`Per ${move.tauntMinTurns ?? 3}–${move.tauntMaxTurns ?? 5} turni impedisce all’avversario di usare mosse di supporto.`);
  if (move.crashOnMoveFailure) effects.push('Se manca, viene protetta o il bersaglio è immune, subisci metà del danno che avrebbe inflitto, fino a metà degli HP massimi del bersaglio. Contro un’immunità il contraccolpo è metà degli HP massimi del bersaglio.');
  if (move.doublesRolloutAfterDefenseCurl) effects.push('La potenza raddoppia ulteriormente se hai usato Ricciolscudo prima di Rotolamento, senza sostituire il Pokémon.');
  if (move.preventsEscape) effects.push('Impedisce all’avversario di fuggire o essere sostituito finché chi ha usato la mossa resta in campo.');
  if (move.lockInMinTurns) effects.push(`Il tuo Pokémon deve continuare a usare questa mossa per ${move.lockInMinTurns === move.lockInMaxTurns ? move.lockInMinTurns : `${move.lockInMinTurns}–${move.lockInMaxTurns}`} turni${move.confusesUserAfterLockIn ? ', poi si confonde' : ''}.`);
  if (move.protectUser) effects.push('Protegge il tuo Pokémon dalle mosse avversarie per questo turno. Usarla ripetutamente riduce la probabilità di riuscita.');
  if (move.endureUser) effects.push('Per questo turno sopravvive agli attacchi con almeno 1 HP. Usarla ripetutamente riduce la probabilità di riuscita.');
  if (move.ignoresProtection) effects.push('Può superare la protezione avversaria.');
  if (move.screen) effects.push(`Per 5 turni dimezza i danni ${move.screen === 'reflect' ? 'fisici' : 'speciali'} ricevuti dalla tua parte, salvo colpi critici e mosse che ignorano lo schermo.`);
  if (move.breaksScreens) effects.push('Rimuove Riflesso e Schermoluce dalla parte avversaria prima di infliggere danni.');
  if (move.rechargesNextTurn) effects.push('Dopo il colpo deve ricaricarsi: nel turno seguente non può usare una mossa.');
  if (move.chargesBeforeAttack) effects.push(`Carica nel primo turno e attacca nel secondo${move.skipsChargeInSun ? '; con il sole attacca subito' : ''}.`);
  if (move.chargeDefenseBoost) effects.push(`Durante la carica aumenta la Difesa di ${move.chargeDefenseBoost} grado.`);
  if (move.semiInvulnerableWhileCharging) effects.push('Durante la carica evita le mosse che non possono raggiungere la sua posizione.');
  if (move.requiresFirstTurnAfterEntry) effects.push('Funziona soltanto nel primo turno dopo l’ingresso del tuo Pokémon.');
  if (move.thawsUserIfFrozen) effects.push('Può scongelare il tuo Pokémon prima di agire.');
  if (move.weather) effects.push(`Cambia il meteo per 5 turni: ${{ rain: 'pioggia (Acqua ×1,5; Fuoco ×0,5)', sun: 'sole (Fuoco ×1,5; Acqua ×0,5)', hail: 'grandine (danni periodici, tranne ai tipi Ghiaccio)', sandstorm: 'tempesta di sabbia (danni periodici, tranne ai tipi Roccia, Terra e Acciaio)' }[move.weather]}.`);
  if (move.recoilPercent) effects.push(`Dopo aver inflitto danni, il tuo Pokémon perde HP pari al ${move.recoilPercent}% dei danni inflitti (almeno 1 HP). Il contraccolpo può mandarlo KO e non si applica se la mossa manca o non danneggia per un’immunità.`);
  if (move.minHits) effects.push(`Colpisce ${move.minHits === move.maxHits ? move.minHits : `${move.minHits}–${move.maxHits ?? move.minHits}`} volte nello stesso turno.`);
  if (move.leechSeedFraction) effects.push(`Pianta un seme: a fine turno sottrae ${Number((move.leechSeedFraction * 100).toFixed(2))}% degli HP massimi avversari e cura il Pokémon attivo dalla tua parte. Non funziona sui Pokémon Erba o già seminati.`);
  if (move.priority > 0) effects.push(`Priorità +${move.priority}: agisce prima delle mosse con priorità inferiore, anche se sei più lento.`);
  if (move.priority < 0) effects.push(`Priorità ${move.priority}: agisce dopo le mosse con priorità superiore.`);
  if (move.alwaysHits) effects.push('Non effettua il controllo di precisione.');
  if (move.ignoresAccuracyEvasionStages && !move.alwaysHits) effects.push('Ignora i gradi temporanei di Precisione ed Elusione.');
  if (!effects.length) effects.push('Nessun effetto aggiuntivo implementato.');
  if (move.statChanges?.length) effects.push('I gradi delle statistiche sono temporanei e si azzerano quando il Pokémon viene sostituito.');
  return effects;
}

export function formatMoveDescription(move: MoveDefinition): string {
  const category = move.category === 'physical' ? 'Fisica' : move.category === 'special' ? 'Speciale' : 'Supporto';
  const power = move.fixedDamage ? `Danno fisso ${move.fixedDamage} HP` : `Potenza ${move.power || '—'}`;
  return [`${battleTypeLabel(move.type)} · ${category} · ${power} · Precisione ${move.alwaysHits ? 'sempre' : `${move.accuracy}%`} · PP ${move.maxPp}`, ...describeMoveEffects(move)].join('\n\n');
}
