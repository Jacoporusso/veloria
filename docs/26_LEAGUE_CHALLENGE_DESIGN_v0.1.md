# Sfide sequenziali e Lega — progetto v0.1

Stato: **core puro implementato, integrazione di gioco non ancora disponibile**. Audit del codice al 20 ottobre 2026. Questo documento non introduce mappe, allenatori o progressi runtime.

## 1. Requisiti e riferimenti

Il prodotto completo comprende otto Palestre, Lega ed epilogo (`01_GDD_Veloria_v0.1.md`, visione completa). `02_WORLD_MAP_DESIGN_Veloria_v0.2.md` colloca R16 dopo Concordia e il Santuario; la Lega conclude la progressione sportiva, il Santuario risolve la Risonanza. La pressione narrativa resta l’esperimento non autorizzato della divisione della rete, con ricercatori alleati: la Lega non introduce una nuova organizzazione malvagia.

Direzione concordata: quattro membri del Consiglio seguiti dal Campione, in ordine, in un unico tentativo. Servono tutte le otto medaglie e `q_resonance_restored`. Sconfitta, pareggio o abbandono annullano soltanto il tentativo. Esperienza, evoluzioni, apprendimenti, denaro già assegnato e risorse effettivamente consumate restano nello stato corrente. Sono consentiti gli strumenti; non sono consentiti riposo, Centro o deposito durante il tentativo. Un semplice ritorno alla schermata iniziale non deve resettare un tentativo salvato fra incontri.

I nomi dei cinque avversari possono essere originali. Squadre e mosse devono invece usare il catalogo registrato e gli apprendimenti ufficiali HGSS importati: non definire nuovi effetti o moveset inventati per rendere più difficili gli incontri. I numeri di livelli e squadre richiedono un playtest naturale dai quattro starter, non solo fixture al livello massimo.

## 2. Contratto dichiarativo proposto

Un catalogo `content/challenges/*.sequence.json`, validato all’avvio, contiene definizioni riutilizzabili:

```ts
interface ChallengeSequence {
  id: string;
  name: string;
  version: 1;
  requiredFlags: readonly string[];
  requiredBadgeIds: readonly string[];
  activeFlag: string;
  pendingBattleFlag: string;
  completedFlag: string;
  completionEvent: string;
  memberMapIds: readonly string[];
  checkpoint: { mapId: string; spawnId: string };
  servicePolicy: {
    healing: 'forbidden';
    storage: 'forbidden';
    battleItems: 'allowed';
  };
  stages: readonly {
    id: string;
    trainerId: string;
    mapId: string;
    spawnId: string;
    attemptWonFlag: string;
    firstRewardFlag: string;
  }[];
}
```

L’istanza Lega dichiara cinque tappe; il core non impone cinque a ogni altra sequenza. I riferimenti a mappe/spawn sono dati verificati contro il registro, non nomi inseriti in `WorldScene`. `memberMapIds` include soltanto l’area interna alla sfida; il piazzale con cure e deposito è esterno e ospita il checkpoint. Deve esistere una via d’uscita sempre praticabile, anche prima di completare una tappa.

Prerequisiti Lega: `requiredFlags: ['q_resonance_restored']` e `requiredBadgeIds` uguale a `badge_aurora`, `badge_corolla`, `badge_circuito`, `badge_acciaio`, `badge_marea`, `badge_riflesso`, `badge_brina`, `badge_armonia`. Le otto flag di consegna possono essere validate come coerenza dei contenuti, ma il possesso è letto dal campo `save.badges`: `badge_ghiaccio_awarded` e `badge_drago_awarded` non sono gli ID delle medaglie.

Proprietà Tiled proposte: terminale `kind: 'challenge-sequence'`, `challengeId`; avversari `challengeId` e `challengeStageId` oltre al `trainerId` esistente. Interazioni gestite come sfida non devono ricadere nel normale ramo allenatore se la sequenza non è avviata o è già conclusa. Il dialogo distingue requisiti mancanti, preparazione, incontro corrente e completamento.

## 3. Stato derivato e API pure

Nuovo modulo proposto `src/core/world/challenge-sequence.ts`, senza Phaser né IndexedDB:

- `validateChallengeSequence(definition)` verifica struttura e flag distinti.
- `challengeSequenceState(definition, traveler)` restituisce `inactive | ready | active | completed`, indice della tappa corrente e motivi del blocco.
- `startChallengeSequence(definition, traveler)` verifica requisiti e squadra cosciente; emette nuove flag senza curare o ripristinare risorse.
- `prepareChallengeBattle(definition, traveler, stageId)` ammette solo la tappa corrente e imposta `pendingBattleFlag`.
- `settleChallengeBattle(definition, traveler, stageId, outcome)` avanza una tappa o annulla il tentativo; restituisce comandi semantici per ricompensa, quest e destinazione.
- `abortChallengeSequence(definition, traveler, reason)` rimuove esclusivamente le flag del tentativo e propone il checkpoint.
- `challengeServiceAllowed(definition, state, service)` centralizza il divieto di cure/deposito.

L’interfaccia `traveler` è una proiezione readonly di flag, medaglie, mappa e disponibilità della squadra. Le funzioni non restituiscono un vecchio snapshot economico né un rollback della squadra.

Persistenza senza nuova versione del save: `GameSave` v2 contiene già `flags: string[]`, `badges`, squadra, inventario e RNG. Non aggiungere una proprietà top-level senza migrazione: `save-validation.ts` rifiuta chiavi sconosciute. Nomi suggeriti `challenge_league_active`, `challenge_league_pending`, `challenge_league_won_council1`, ecc.; completamento permanente `q_league_completed` e ricompense permanenti separate. Tutti i nomi sono dichiarati o derivati da ID validati, senza collisioni.

L’indice si ricava dal prefisso contiguo delle tappe vinte: non salvare anche un contatore ridondante. Flag vinte non contigue, pending senza active, due sequenze contemporaneamente attive o active dopo completed sono stati incoerenti. La normalizzazione di caricamento annulla soltanto l’insieme esplicito di flag del tentativo, preserva tutto il resto e riporta al checkpoint; non ricompensa né prova ad avanzare una tappa incoerente.

## 4. Vittorie, ricompense e prevenzione dei duplicati

`TrainerBattleDefinition.battleOnceFlag` è oggi usata sia per non ripetere un allenatore sia per assegnargli denaro una sola volta. Queste due responsabilità devono essere separate nell’adattatore della sequenza:

1. Le flag di vittoria nel tentativo e le `battleOnceFlag` dei cinque allenatori sono temporanee. Si azzerano con sconfitta/uscita per rendere nuovamente affrontabile il Consiglio dall’inizio.
2. `firstRewardFlag` è permanente. Il premio del singolo allenatore viene assegnato solo se manca questa flag. Annullare un tentativo non cancella il denaro già ottenuto e non rende nuovamente ottenibile lo stesso premio monetario.
3. XP ed evoluzioni vengono normalmente dal motore per ogni battaglia realmente combattuta, anche nelle ripetizioni. Non ripristinare il vecchio livello o sottrarre XP al reset.
4. L’ultima vittoria produce una sola `completionEvent`; la quest engine assegna `completedFlag`, premio finale ed epilogo una sola volta. Le flag temporanee si ripuliscono senza eliminare completamento, ricompense o Risonanza.

Evitare l’attuale ramo generico `!trainer.battleOnceFlag → denaro + defeatQuestEvent` per questi cinque avversari: cancellare quella flag a ogni tentativo produrrebbe premi monetari ripetuti. Gli eventi/flag delle tappe non devono essere permanenti quest di vittoria che aprono le porte nei tentativi successivi. L’adattatore restituisce esplicitamente quali flag temporanee togliere: niente cancellazione generica di tutte le flag `trainer_` o `q_`.

## 5. Punti reali d’integrazione

| File/hook attuale | Integrazione proposta |
| --- | --- |
| `src/game/maps/challenge-sequence-registry.ts` (nuovo) | Pattern eager glob e controllo ID duplicati come `local-transport-registry.ts`; risolve il catalogo. |
| `src/game/scenes/WorldScene.ts`, `interact()` | Terminale di iscrizione/abbandono e avversario di tappa; controllo core prima del normale controllo `battleOnceFlag`. |
| `WorldScene.startTrainerBattle()`, `beginBattle()` e callback `onComplete` | Mantiene `mergeBattlePlayerState`, consumo oggetti ed eventi Pokédex; instrada poi l’esito all’adattatore sequenza invece del ramo premi allenatore ordinario. |
| `src/game/battle/create-battle-state.ts` | Riutilizza `createTrainerBattle` e `mergeBattlePlayerState`: nessun secondo motore di combattimento. |
| `WorldScene`, callback `onDismiss` | Avvia la transizione di checkpoint dopo perdita/abbandono, o la presentazione della tappa vinta. La successiva sfida parte da un’interazione esplicita; niente catena di battaglie nascosta dietro un dismiss. |
| `WorldScene.transitionToMap()` | Verifica se si lascia `memberMapIds`; chiede conferma prima di abbandonare e applica abort + destinazione checkpoint. Anche trasporto, backup importato e ripresa del gioco rispettano la stessa politica. |
| `WorldScene.showHealingMenu()` e `showStorageMenu()` | Controllo core prima di aprire il menu e prima delle azioni: rifiuta cure/deposito mentre active, anche se un contenuto errato espone un servizio. |
| `src/core/services/party-storage.ts` | Resta indipendente; l’adattatore servizi applica la policy, senza legare il servizio puro a una specifica Lega. |
| `WorldScene.persistProgress()` / `src/persistence/save-store.ts` | Salva un unico snapshot coerente con esito, risorse, avanzamento e flag; usa la coda `saveQueue` e gestisce esplicitamente il booleano di riuscita. |
| `src/core/quests/apply-quest-event.ts` | Premio finale idempotente con la quest dichiarativa di completamento; l’epilogo non può assegnarlo una seconda volta. |
| `tools/challenge_sequence_validation.py` (nuovo) | Controlli incrociati allenatori, flag, mappe, spawn, collocazioni, uscite, servizi vietati e apprendimenti ufficiali delle squadre. |

La posizione di checkpoint deve essere un vero spawn asciutto, libero e fuori da trigger/zone incontri, con un percorso sicuro verso cure gratuite e deposito nel piazzale. L’entrata nel primo incontro deve essere separata dall’iscrizione: il giocatore vede squadra, ordine della sfida e avviso sulle risorse prima di confermare.

## 6. Sconfitta, abbandono e salvataggio

Ordine di settlement: merge del risultato battaglia → consumo reale degli strumenti → ricompensa eventualmente dovuta → avanzamento/reset del tentativo → aggiornamento coordinate se necessario → salvataggio unico. Un pareggio equivale a una sconfitta della sequenza. Le battaglie allenatore già vietano fuga/cattura; un esito inatteso non produce una vittoria di tappa.

L’attuale `onComplete` cura automaticamente la squadra interamente KO per evitare softlock. Per la sfida non deve esserci una cura fra tappe o un ripristino implicito di HP/PP sul campo: annulla prima il tentativo e riporta al checkpoint esterno conservando lo stato post-battaglia. Il soccorso gratuito del piazzale, invocabile anche con squadra interamente KO, è un servizio esterno successivo e visibile. Il ramo generico della battaglia non deve applicare contemporaneamente il suo auto-heal. Nessuna penalità monetaria nuova.

Abbandono volontario: conferma chiara «Il tentativo ricomincia dal primo incontro; esperienza e progressi restano». Conserva HP, PP, stati e inventario correnti; non trasforma l’uscita in un riposo gratuito. Una porta laterale deve poter annullare il tentativo da qualunque tappa. Il ritorno al checkpoint dopo una perdita non deve richiedere che il personaggio, con tutti KO, attraversi nuovi incontri.

Ricaricamento fra incontri: riprende la tappa corrente e le risorse salvate. Ricaricamento con `pendingBattleFlag`: il mondo attuale non salva lo snapshot di una battaglia in corso; quindi il tentativo viene interrotto e riparte dal checkpoint. Restano gli incontri precedenti già consolidati. Non promettere persistenza di danni/oggetti dell’incontro interrotto: oggi vengono consolidati soltanto in `onComplete`. Il salvataggio del Pokédex durante la lotta non costituisce un salvataggio di quella lotta.

Prima del lancio della scena battaglia, la flag pending deve essere scritta e il salvataggio deve riuscire. Se fallisce, non avviare il combattimento. Un doppio clic o callback ripetuto non deve contare due vittorie: un contesto in memoria con `battleId` e tappa attesa accetta un unico settlement; flag pending e indice coerente impediscono avanzamenti fuori ordine. La callback `onComplete` attuale non è asincrona: occorre conservare una promise di settlement e far attendere `onDismiss` prima di sbloccare movimento/transizione. Non ignorare un `persistProgress()` fallito e lanciare già la sfida successiva.

Attenzione: `persistProgress()` sovrascrive `save.player.x/y` con `playerTile`. Prima di salvare un checkpoint bisogna aggiornare coerentemente anche `playerTile`, oppure applicare la transizione e il salvataggio attraverso un unico adattatore. Cambiare soltanto `save.player.mapId` nel callback non basta. La coda revisionata non rende atomiche due scene che aggiornano indipendentemente mappe e risorse.

## 7. Completamento, epilogo e verifiche necessarie

Il Campione vinto conclude la sequenza sportiva; il flag della Risonanza resta un prerequisito distinto e già risolto. L’epilogo ha un’interazione/presentazione riprendibile: `q_league_completed` non dipende dal guardare tutti i messaggi o dall’animazione. Un eventuale `q_epilogue_seen` viene scritto dopo la presentazione e non contiene premi. Il finale deve riconoscere squadra e nome dell’allenatore, il ruolo degli alleati e la possibilità di continuare l’esplorazione. Non dichiarare completato il Pokédex o tutte le missioni perché è stato battuto il Campione.

Verifiche prima di pubblicare:

- Core: requisiti di tutte le medaglie, cinque vittorie ordinate, rifiuto di salti/doppio settlement, reset dopo ogni possibile tappa, flag estranei e risorse preservati, premi permanenti una sola volta, replay/salvataggio JSON e caricamento incoerente sicuro.
- Integrazione: nessuna cura/deposito durante active, strumenti funzionanti, KO/pareggio e uscita verso checkpoint, reload fra incontri, reload pending, fallimento del salvataggio e callback tardive.
- Browser: percorso intero e finale, abbandono alla prima/quarta tappa, sconfitta dopo almeno una vittoria, ritorno senza softlock, offline, portrait/landscape e riapertura PWA.
- Bilanciamento: squadra cresciuta nel mondo, scorta e PP realistici, quattro starter e contromisure disponibili; dichiarare separatamente i test con fixture potenziate.

R16 e piazzale possono essere pubblicati come contenuti di arrivo soltanto con feedback onesto sull’accessibilità della sfida. Finché questo core e i cinque incontri non sono implementati e verificati, la Lega rimane incompleta.


## 8. Contratto del core implementato

`src/core/world/challenge-sequence.ts` opera esclusivamente su `{ flags, badges }` readonly. Non modifica squadra, XP, denaro, inventario, RNG o coordinate e non scrive sul disco. Il documento resta una proposta per registry, scene, contenuti e adattatore di salvataggio.

API pubbliche: `validateChallengeSequence`, `challengeSequenceState`, `startChallengeSequence(sequence, traveler, hasConsciousParty)`, `prepareChallengeBattle(sequence, traveler, stageId)`, `settleChallengeBattle(sequence, traveler, stageId, outcome)`, `abortChallengeSequence`, `recoverChallengeSequence` e `challengeServiceAllowed`. Gli esiti ammessi sono `won | lost | draw`.

Le transizioni restituiscono `{ flags, changed, accepted, reason, state, nextStageId, event, rewardStageId, checkpoint }`. L’adattatore mantiene medaglie e altri dati e applica le nuove flag a un nuovo snapshot. `checkpoint` è soltanto una destinazione dichiarata: nessuna transizione Phaser avviene nel core. `battleOnceFlag` è ora opzionale in ogni stage: se dichiarata deve essere posseduta esclusivamente dal tentativo, viene impostata insieme alla vittoria e rimossa con il reset. Gli ID e le flag delle varie responsabilità devono essere distinti.

**Ricompense:** una vittoria imposta permanentemente `firstRewardFlag` prima di restituire `rewardStageId`. Solo un risultato con `rewardStageId` non nullo autorizza il premio monetario del trainer; il ramo ordinario che paga in base a `battleOnceFlag` deve essere disattivato per gli incontri di sequenza. Assegnare denaro nel medesimo snapshot delle nuove flag: salvare prima la ricevuta e poi il denaro perderebbe il premio in caso di interruzione; eseguire entrambi i rami lo raddoppierebbe. L’annullamento conserva tutte le ricevute e il denaro già consolidato.

**Completamento atomico:** l’ultima vittoria accettata rimuove pending, conserva active e tutte le vittorie contigue, restituisce `completionEvent` e stato transitorio `awaitingCompletion`. Il core NON imposta `completedFlag`: l’adattatore deve applicare l’evento alla quest engine sullo snapshot con le nuove flag, ricevere il flag finale e il premio idempotente, richiamare `recoverChallengeSequence` per ripulire le flag temporanee e salvare tutto insieme. Una callback duplicata non trova più pending e non riemette evento o premio. Non persistere volontariamente lo stato intermedio `awaitingCompletion`.

**Ripresa:** `recoverChallengeSequence` lascia intatto un tentativo valido fra tappe. Pending, vittorie non contigue, ricevute mancanti per vittorie registrate o stato `awaitingCompletion` senza completamento permanente annullano il tentativo e propongono il checkpoint, senza inventare l’esito dell’incontro. Se il completamento permanente è già presente, la ripulitura conserva finale e ricevute senza spostare il giocatore al checkpoint. Gli altri flag validi nel save restano invariati, anche se non condividono la convenzione di nomi del catalogo.

`challengeServiceAllowed` nega cure e deposito in stato active/pending/awaitingCompletion/invalid; consente strumenti in battaglia. Non rende disponibili servizi che una mappa non offre. Il catalogo delle sfide potrà estendersi a un altro numero di tappe: cinque è una proprietà della Lega, non del motore.

Verifica del core: `tests/world/challenge-sequence.test.ts` copre progressione a cinque tappe, gate delle otto medaglie, salti e callback duplicate, perdita/pareggio a ogni tappa, premi permanenti su ripetizione, annullamento, ricaricamento pending, immutabilità e servizi. Questo non dimostra una partita della Lega già giocabile.
