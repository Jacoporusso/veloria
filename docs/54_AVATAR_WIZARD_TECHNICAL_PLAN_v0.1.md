# Wizard avatar allenatore — piano tecnico v0.1

**Stato:** piano approvato da sottoporre a decisione tecnica prima dell'implementazione runtime. Questo documento non modifica il gioco. La foto è una possibile direzione futura del flusso, senza acquisizione o elaborazione nel lavoro corrente.

## Obiettivo

Durante Nuova partita, permettere di scegliere un avatar allenatore, vederne subito l'anteprima e cambiare le scelte prima di iniziare. Il wizard parte da un preset ragazzo o ragazza e offre, secondo gli asset disponibili, pelle, capelli, occhi, barba facoltativa, vestiti e zaino. Le scelte devono essere modificabili nel wizard e successivamente dalle impostazioni; l’aspetto confermato deve accompagnare la partita salvata. Tutte le categorie estetiche restano selezionabili indipendentemente dal preset iniziale, nei limiti delle combinazioni grafiche supportate.

La prima versione può usare un insieme piccolo e curato di opzioni. Il catalogo deve dichiarare quali combinazioni dispone di asset completi; i preset non impongono restrizioni estetiche basate sul genere. Non ogni dettaglio risulta distinguibile nel personaggio in mappa. Gli occhi devono avere almeno alcune scelte distinguibili e leggibili nell'anteprima. Le opzioni mostrate soltanto nel ritratto vanno indicate come tali; non si deve promettere che siano visibili durante l'esplorazione.

## Stato verificato nel repository

- `src/game/ui/StartScreen.ts` implementa titolo, Continua, Nuova partita, conferma di sostituzione e modulo per il solo nome. `chooseGameSession` restituisce `{ kind: 'new', name }`.
- `src/main.ts` usa `personalizeNewGame(newGameSave(), name)`, salva la partita prima di creare Phaser e poi avvia il mondo. L'anteprima mappa di sviluppo segue un percorso separato.
- `src/core/party/trainer-profile.ts` normalizza il nome (1–16 caratteri percepiti), clona il salvataggio e imposta nome e flag `intro_started`.
- `src/persistence/save-types.ts` dichiara `GameSave` schema 2. `player` contiene nome, mappa, punto di ingresso, denaro e coordinate; non contiene l'aspetto.
- `src/persistence/save-validation.ts` rifiuta proprietà sconosciute sia al livello del salvataggio sia in `player`; la validazione riconosce le versioni 1 e 2. `src/persistence/save-migrations.ts` migra v1 a v2 e preserva i campi esistenti. `CURRENT_SAVE_SCHEMA_VERSION` è 2.
- `src/persistence/save-store.ts` crea nuovi salvataggi v2. `src/persistence/README.md` documenta backup, checksum, migrazioni e conservazione delle versioni precedenti. Esistono salvataggi reali con progressi avanzati: non si presume un reset né si può scartare il contenuto sconosciuto senza una decisione esplicita.
- `src/game/scenes/WorldScene.ts` carica un'unica immagine del viaggiatore e crea il personaggio in `makePlayer`.
- `src/game/rendering/traveler-animation.ts` suddivide `public/assets/sprites/veloria-traveler-walk-v2.webp` in una griglia 4×4: quattro direzioni (`down`, `left`, `right`, `up`), quattro frame per direzione; il frame centrale è usato da fermo e la sequenza anima il passo. La sprite è mostrata a 64×64. Il foglio è un asset composito, non un insieme di livelli separati.
- `docs/05_ART_DIRECTION_v0.3.md` richiede idle e camminata in quattro direzioni, almeno quattro frame per direzione.
- `docs/03_MVP_FUNCTIONAL_SPEC_v0.3.md` e `docs/04_TECHNICAL_ARCHITECTURE_v0.3.md` descrivono la raccolta del nome e il salvataggio prima dell'ingresso nel mondo; non definiscono un profilo estetico.
- `specs/schemas/trainer.v1.schema.json` descrive i trainer delle battaglie NPC, non il profilo giocatore.

## Flusso proposto

1. Continua partita mantiene il comportamento corrente.
2. Nuova partita mantiene la conferma già prevista quando esiste un salvataggio.
3. Il flusso guidato raccoglie nome e aspetto. Il preset iniziale è una scelta esplicita tra ragazzo e ragazza; la denominazione identifica il preset artistico, non deduce identità dalla foto o da altri dati.
4. Ogni selezione aggiorna immediatamente un'anteprima. Si può tornare alle categorie precedenti e cambiare le scelte.
5. Confermando, il bootstrap crea il nuovo salvataggio con nome e profilo validato, lo persiste e solo allora avvia il mondo. Se il salvataggio fallisce, il wizard resta aperto con errore e scelte conservate.

L'estensione UI più circoscritta è `StartScreen.ts`; la funzione pura di profilo in `trainer-profile.ts` può accettare e validare il nuovo profilo. `main.ts` resta il punto che salva il candidato prima di avviare Phaser.

## Modello dati e decisione sul versionamento

Il profilo deve essere composto da identificatori stabili e chiusi, non da colori o frammenti di markup arbitrari. Forma indicativa, da definire insieme agli asset: `presetId`, `skinId`, `hairStyleId`, `hairColorId`, `eyeId`, `beardId | null`, `outfitId`, `backpackId | null`. Gli ID devono essere verificati contro un catalogo locale. I campi facoltativi sono assenti o `null` secondo una convenzione unica. Il nome rimane `player.name`.

Prima di implementare la persistenza va scelta la minima strategia che soddisfa entrambi i requisiti: validare in modo stretto i nuovi profili e conservare i progressi esistenti. In particolare, occorre decidere se:

- aggiungere un campo opzionale con default deterministico ai salvataggi correnti, mantenendo valide le vecchie versioni senza riscriverle finché non vengono salvate; oppure
- introdurre una nuova versione di schema e una migrazione pura che preservi tutti i campi e assegni un aspetto predefinito ai record storici.

La prima opzione riduce la migrazione, ma richiede di chiarire come i record senza aspetto vengano normalizzati in memoria e come siano esportati/risalvati. La seconda rende esplicita la forma corrente, ma richiede aggiornare validazione, tipi, migrazioni, backup/import e documentazione. Non si assume a priori che un campo opzionale sia sufficiente, né che sia obbligatorio uno schema v3: la scelta deve essere motivata dal contratto effettivo di lettura, scrittura, import/export e checksum. In entrambi i casi, nessuna modifica deve eliminare o sovrascrivere party, storage, inventario, flag, medaglie, posizione, RNG, ID o altri progressi esistenti.

Una volta scelta la strategia, aggiornare in modo coerente `save-types.ts`, `save-validation.ts`, `save-migrations.ts` se necessaria, `save-store.ts`, `save-backup.ts`/import-export se richiesto dal contratto, test e `src/persistence/README.md`. Non cambiare le migrazioni storiche: aggiungere quella nuova solo se la decisione la richiede. La validazione deve accettare i record storici supportati e respingere ID avatar non riconosciuti nei nuovi profili.

## Anteprima e rendering

`TravelerAnimation` è il punto d'integrazione del personaggio in mappa. La schermata wizard deve riusare la stessa definizione visiva del gioco, così da evitare che anteprima e personaggio salvato divergano. Il renderer attuale riceve una sola tavola 4×4; non esistono livelli verificati per corpo, capelli, vestiti o zaino. Perciò il piano asset deve scegliere e documentare una delle soluzioni seguenti prima di promettere quali opzioni si vedranno in gioco:

- tavole complete precomposte per le combinazioni limitate ammesse; oppure
- livelli animati compatibili, con identica griglia, ritaglio, allineamento e ordine di disegno per tutti i sedici frame; oppure
- composizione procedurale dei livelli, solo se gli asset base sono disegnati per consentirla e il risultato mantiene contrasto e leggibilità.

La prima scelta ha crescita combinatoria e va limitata con attenzione. La composizione a livelli permette più combinazioni ma richiede asset coerenti e una pipeline che ne garantisca la registrazione. In tutte le direzioni e frame vanno mantenuti scala, origine e silhouette; zaino, barba e capelli non devono saltare o coprire il volto tra frame. Il movimento ridotto deve continuare a mostrare un frame stabile.

Per un prototipo con anteprima si può montare il renderer in un contenitore DOM/Canvas o usare un renderer condiviso con Phaser. Non codificare una seconda ricostruzione dell'avatar in CSS se è destinata a divergere dallo sprite di gioco. Ritratti o scelte che non dispongono di asset nelle quattro direzioni possono essere incluse solo se il wizard dichiara chiaramente che valgono per il ritratto e non per l'esplorazione.

## Foto: possibile direzione futura

In una fase futura, una foto scelta dalla persona potrebbe servire a suggerire opzioni già presenti nel catalogo (per esempio palette o acconciature). La persona deve poter controllare e cambiare ogni suggerimento nel wizard prima di salvarlo. La foto non deve essere usata per dedurre genere, identità o un preset ragazzo/ragazza. Questa proposta non definisce né autorizza un servizio, un'API, un caricamento remoto o un modello; non si implementano acquisizione, invio o analisi di foto in questa fase. La funzionalità corrente resta completamente utilizzabile senza foto.

## Criteri di accettazione

- Da una partita nuova si può scegliere un preset iniziale ragazzo o ragazza, modificare le categorie effettivamente implementate e vedere l'anteprima aggiornata subito.
- Il wizard consente di tornare indietro e cambiare nome o scelte prima di confermare; le scelte non vengono perse se la persistenza segnala un errore.
- Nuova partita salva nome e aspetto prima di avviare il mondo. Continua partita non apre il wizard e riprende il profilo salvato.
- Le opzioni offerte hanno etichette accessibili e distinguibili senza affidarsi solo al colore; occhi, quando esposti come categoria, hanno almeno un piccolo insieme di scelte visibilmente diverse nella scala dell'anteprima.
- Il gioco mostra il profilo confermato secondo la portata dichiarata per ciascuna opzione. Se una scelta è solo ritratto, il wizard lo indica e non la presenta come variazione dello sprite esplorabile.
- Gli asset di mappa, quando personalizzabili, rispettano i quattro orientamenti e i quattro frame per orientamento, con idle, passo, allineamento e modalità animazioni ridotte coerenti.
- Salvataggi correnti e legacy con progressi avanzati sono letti, validati, caricati, salvati ed esportati senza perdita di dati; le regole dei campi avatar sconosciuti sono esplicite e verificate.
- Dalle impostazioni si può riaprire l’editor e salvare il nuovo aspetto mantenendo squadra, inventario, missioni, posizione e RNG.
- La selezione del preset è esplicita e non viene dedotta da una foto. Foto e servizi remoti non sono necessari né invocati.

## Ambito escluso

Non si implementano ora caricamento o analisi di foto, API o servizi esterni, deduzione di genere, account o sincronizzazione cloud. L’editor dell’aspetto nelle impostazioni è incluso nel piano manuale e deve usare lo stesso catalogo/renderer senza modificare i progressi. Foto, servizi remoti, account e sincronizzazione richiedono una decisione e un piano separati.
