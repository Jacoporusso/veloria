# Primo lotto: wizard allenatore e segnali habitat

## Ambito

L’obiettivo generale di implementare l’intero gioco resta invariato. Il piano operativo comprende ora anche `53_WORLD_AND_AVATAR_IMPROVEMENT_PLAN_v0.1.md`: wizard personalizzabile, identità NPC, habitat riconoscibili, percorsi accessibili e stile illustrato uniforme. Questo lotto implementa il wizard e il segnale degli incontri; non conclude il rifacimento artistico o l’avventura completa.

## Implementazione

- Nuova partita: nome → aspetto → riepilogo → conferma. Indietro conserva la bozza; nessuna partita sostituita prima della conferma salvata. Un errore conserva le scelte e permette il tentativo successivo.
- Preset ragazzo/ragazza, tre carnagioni, tre tagli e colori dei capelli, tre colori occhi, barba facoltativa, tre abiti e tre zaini. Le categorie sono indipendenti dal preset. Casuale modifica esclusivamente la bozza estetica, senza consumare il cursore casuale della partita.
- Impostazioni → Aspetto allenatore: stesso editor, salvataggio e aggiornamento del personaggio. Annulla non modifica il profilo. Il dialogo blocca esplorazione/interazioni mentre è aperto.
- `TrainerAppearance` usa ID chiusi e validati; `player.appearance` è opzionale nello schema 2. I salvataggi precedenti continuano a funzionare senza riscritture obbligatorie. L’editor propone un default se il campo manca; finché non viene confermato, il vecchio sprite resta utilizzato.
- Compositore condiviso tra anteprima e sedici pose (quattro direzioni × quattro fasi). Texture generata localmente, senza foto o servizi remoti. La prima grafica vettoriale è stata scartata durante la revisione: ora tre atlanti illustrati originali, derivati dalla tavola approvata, forniscono le pose. Palette e dettagli vengono composti localmente; revisione completa delle maschere e delle animazioni ancora aperta. Catalogo e salvataggi sono separati dalla geometria degli asset.
- Un segnale statico a tre foglie per ogni `encounter-zone`, derivato dai trigger effettivi e indipendente dagli effetti ambientali/animazioni. Nessuna modifica a probabilità, specie o collisioni.
- Prima mappa con habitat: breve spiegazione; guida richiamabile da Come si gioca. Nuovo flag solo didattico `tutorial_habitat_seen`.

## Punti di integrazione

- Dominio: `src/core/party/trainer-appearance.ts`, `trainer-profile.ts`.
- Persistenza: tipi e validazione esistenti, nessuna migrazione forzata.
- UI: `TrainerAppearanceEditor.ts`, `StartScreen.ts`, `trainer-appearance.css`.
- Rendering: `trainer-avatar-art.ts`, `traveler-animation.ts`, caricamento e cambio texture in `WorldScene.ts`.
- Habitat: `encounter-habitat-marker.ts`, `MapRenderer.ts`; guida e introduzione in `WorldScene.ts`.

## Verifiche e limiti

Primi test dominio/persistenza passati: 595 totali, inclusi catalogo mosse locale già in lavorazione e nuovi casi avatar/habitat. Backup avanzato Acquariva verificato: modificare l’aspetto conserva tutti gli altri dati. Primo tentativo browser ha evidenziato un errore di codifica dell’SVG nel loader Phaser: corretto usando il formato base64 richiesto dal loader. Successivi test wizard nei due orientamenti e recupero da storage pieno passati. Nove prove aggiuntive passate: comandi PC E/Spazio/Invio/A, guida e segnali su prato/bosco/costa/neve, caricamento differito del motore.

Build, validatore progetto e 111 test Python passati. PWA offline: modifica dell’aspetto, salvataggio e ripresa dopo reload passati senza richieste fallite. Verifica finale di sette casi browser passata: quattro biomi, wizard nei due orientamenti e studio delle nove combinazioni taglio/carnagione con controllo regressione pelle/zaino e sedici pose non vuote. Screenshot dello studio palette ispezionato. La suite onboarding completa è passata (nome, starter, ripresa, errore storage ed entropia); i due successivi errori del test tastiera erano dovuti al focus rimasto sul preset nel driver, corretto puntando esplicitamente il selettore Barba. Pubblicazione e CI remota da registrare in CI_STATUS. Nessuna attestazione di QA fisico telefono, equivalenza degli asset al concept o completamento delle nuove mappe/NPC. Le tavole di concept non sono state applicate direttamente come fondali: occorre prima allinearle alla camera e ai Tiled, separando gli elementi interattivi.

## Prossimi lotti

1. Rifinire maschere e dettagli dei tre atlanti illustrati del protagonista; verificare tutte le palette e le animazioni su telefono fisico.
2. Matrice di identità degli NPC per ID narrativo, poi sostituzione grafica per gruppi di mappe.
3. Percorsi leggeri, porte e soglie di transizione allineati alla geometria reale; verifica spawn → servizi → missione → uscita → ritorno.
4. Estensione del primo gruppo Borgofonte/Sentiero/Bosco alle altre mappe.
5. Foto soltanto nella fase futura prevista dal piano: non implementata né necessaria al wizard.

## Lavoro parallelo

Audit Luna completati e incorporati. Nella fase di implementazione i subagent hanno iniziato dominio/persistenza e segnali habitat, poi si sono fermati per quota di utilizzo. Il task principale ha ripreso i file parziali, implementato UI/rendering e svolto l’integrazione. Non sono presenti subagent attivi per questo lotto.


### CI precedente

Verify `40096055222` della 0.3.134 conclusa failure nel caso `battle-rules.spec.ts` sulla cerimonia: il driver presumeva che l’evento non fosse accodato e che la vittoria seguisse immediatamente la rivelazione. Il contratto 134 invece accoda l’evoluzione, mostra la cerimonia prima della mossa e richiede la conferma della carta Rafforzatore. Driver aggiornato conservando gli assert sul vecchio sprite, aggiungendo il controllo del nome non anticipato e la carta mossa successiva alla rivelazione. L’esito locale della regressione e i riferimenti del nuovo rilascio sono riportati in CI_STATUS.


### Correzione del passaggio di input

Il caso della vecchia CI ha inoltre riprodotto un problema reale: confermare la carta mossa con Invio poteva attivare il pulsante DOM del risultato appena creato/focalizzato e chiudere subito la celebrazione. `BattleScene.confirm` ora annulla l’azione predefinita dell’evento gestito. La prova conserva la conferma da tastiera e passa sulla sequenza completa. Sei regressioni passate: cerimonia, sostituzione/rifiuto mosse, cattura e dettagli su tre larghezze.
