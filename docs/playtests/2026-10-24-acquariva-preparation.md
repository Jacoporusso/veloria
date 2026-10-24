# Da Portolume ad Acquariva e due nuove catture — 24 ottobre2026

## Percorso e risorse

Avvio dal backup realmente guadagnato dopo Nerea: cinque medaglie,1540 monete, una Sfera e nessuna medicina curativa. Runtime0.3.127 nella prima traversata. Cure gratuite al Centro di Portolume, uscita aperta da Marea, Dune e Delta attraversati con i comandi touch. Tre osservazioni (vivaio, canneti, corrente) consegnate a Iris:350 monete e tre Sfere una sola volta, con seconda interazione senza duplicazione. Kit delle Canne: due Antidoti. Rapporto a Tessa: due Pozioni una sola volta. Arrivo e riposo ad Acquariva senza battaglie, RNG2520850373 invariato.

Il primo driver fallisce al controllo dopo Continua: la scena non era ancora creata e l'osservatore restituiva null. Non è dichiarato un passaggio completo del driver. Ultima osservazione intera e ferma ad Acquariva recuperata dalla traccia: evento originale e SHA-256 conservati in `2026-10-24-natural-acquariva-arrival-source.json`, envelope costruito con exportSave, importazione/checksum/uguaglianza verificati, nessun campo di gioco modificato. La traccia completa resta nel temporaneo locale; il record sorgente conserva l'evento usato.

Driver corretto con attesa esplicita della scena. Ripresa dal checkpoint recuperato su runtime0.3.128, riposo, ritorno al titolo e Continua passati in8,2s (9,1totali), con squadra/inventario/medaglie/denaro/RNG conservati; backup infine esportato dalla UI.1890 monete,4 Sfere,2 Pozioni,3 Antidoti e cinque medaglie. File `natural-acquariva-arrival` con report/backup; file `-driver-failure` e `-recovered-backup` distinguono la provenienza.

## Drowzee e deposito multiplo

Un tentativo iniziale del nuovo driver usa la coordinata errata0,17 per l'uscita di Acquariva: nessuna battaglia o risorsa consumata, solo cure e ordine squadra tramite UI. Report `natural-drowzee-search-driver-failure` conservato. Corretto il bersaglio alla casella percorribile0,16; nuova prova dallo stesso backup/RNG, senza scegliere un risultato favorevole.

Quagsire in testa dalla Squadra, cammino reale al prato delle ninfee delle Canne. Drowzee29 incontrato e catturato in5 turni con due Sfere, usando Amnesia dalla UI per preparare la cattura. Il compagno conserva Confusione/Bottintesta/Meditazione/Psicoraggio dal learnset ufficiale e nessuna XP extra. Ritorno e Centro gratuito. Dettagli Bottintesta verificati in Squadra:30% e condizione di agire prima.

I due Rattata6/8 vengono selezionati insieme nel Deposito e spostati con una sola conferma: identità, livelli, mosse, PP e HP conservati nel box. Nessun rilascio. Fine: quattro membri in squadra, due nel box,1890 monete,2 Sfere e medicine invariate. RNG3355243495. Driver passato in39,8s (40,7totali), zero errori JS; backup esportato dalla UI e checksum/confronto col report verificati.

## Eevee

Dal backup Drowzee si torna allo stesso habitat con l'orario reale del dispositivo, senza alterare il clock. Tre incontri lasciati con Fuga (Drowzee28, Natu30, Natu29), poi Eevee28 catturato in5 turni con una Sfera. Nessun KO completo, acquisto, premio o risorsa assegnata dal driver. Ritorno al Centro ed esportazione; prova passata in1,2min, zero errori JS.

**Checkpoint più avanzato guadagnato:** `2026-10-24-natural-eevee-caught-backup-charmander.json`. Acquariva8,14,1890 monete, una Sfera, due Pozioni, tre Antidoti, cinque medaglie. Squadra curata: Quagsire24, Chinchou22, Charmeleon24, Drowzee29, Eevee28; Rattata6/8 nel box. RNG621636651. Morso non è ancora conosciuta da Eevee: il livello ufficiale29 è visibile nella scheda. Tutti e sette i compagni sono verificati contro i learnset HGSS e i limiti PP; checksum, squadra/inventario/flag/medaglie/denaro coincidono col report.

## Offline e limiti

Il backup guadagnato viene importato tramite il menu dell'app senza rete sulla build PWA. Consultati Bottintesta attuale e Morso futura al29, verificando l'assenza di modifiche a squadra, box, risorse e RNG. Il primo assert aveva una capitalizzazione diversa dall'etichetta BUIO; corretto il selettore. La verifica aggiornata include anche l'intestazione compatta delle schede.

La contentVersion storica0.3.114 dei salvataggi è mantenuta e distinta dai runtime eseguiti. I tempi dei driver includono comandi, cammino, menu e attese; non misurano il tempo umano o il minimo allenamento. Le osservazioni possono leggere stato e geometria per pianificare, mentre le mutazioni passano da controlli e menu. Nessuna scelta di combattimento legge il comando avversario futuro.

Selene e la sesta medaglia non sono ancora state tentate in questa continuazione. Restano preparazione, allenatori facoltativi, apprendimento/evoluzioni guadagnati, P6–P8/Lega/finale naturali, altri starter e QA fisico.

Riproduzione: PLAYTEST_RESUME_FIFTH_BACKUP al backup guadagnato scelto, PLAYTEST_DAMAGE_FIRST=1; per le catture PLAYTEST_ACQUARIVA_SEARCH=1 e PLAYTEST_CAPTURE_SPECIES=96 oppure133. Per la traversata iniziale usare il backup Nerea; per la ripresa Acquariva usare il checkpoint corrispondente. Un solo browser driver per volta.
