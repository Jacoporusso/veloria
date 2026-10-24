## 0.3.135 — Wizard illustrato e segnali habitat (locale)

595 test dominio/persistenza, 111 Python, validatore progetto e build passati. Wizard e modifica/ripresa verificati nei due orientamenti; nove combinazioni capelli/carnagione con regressione pelle/zaino e tutte le pose non vuote. Quattro biomi e guida passati, onboarding completo passato. PWA offline: aspetto modificato, salvato e ripreso senza rete. Sei regressioni tastiera battaglia passate dopo la correzione del doppio effetto di Invio sulla carta mossa e sul risultato. [Contratto e limiti](55_TRAINER_WIZARD_AND_HABITATS_v0.1.md).

Verify134 `40096055222` FAILURE: unico job Browser chapters shard2, caso cerimonia. Driver aggiornato all’ordine rivelazione→mossa e bug di input corretto; nessun assert su vecchio sprite/completamento eliminato. Deploy precedente `40096055347` SUCCESS. Nuovo commit/deploy e CI remota non ancora attestati; le prove locali non equivalgono alla suite Linux completa. Campagna, NPC, percorsi e QA fisico rimangono aperti.

## 0.3.134 — Ordine evoluzione/apprendimento

[Verify40093581781](https://github.com/Jacoporusso/veloria/actions/runs/40093581781) della131 conclusa FAILURE nei driver Mira/Aster, che non chiudevano la nuova celebrazione evolutiva. Driver aggiornati a usare Continua e la scelta reale delle mosse, senza rimuovere assert su medaglie/premi. Entrambi i casi passati sulla134 in1,6minuti; le fixture e il runtime non sono stati indeboliti. Questi adattamenti dei test richiedono la propria CI dopo push.

582 test dominio/persistenza, build e validatore passati. Sei browser passati in1,2minuti: midbattle nei due orientamenti, ultimo avversario con WorldScene/ricevute, apprendimento della forma precedente e due regressioni Charizard. Rivelazione obbligatoria prima delle carte mossa, nessun duplicato e reload verificati. [Contratto](51_EVOLUTION_LEARNING_ORDER_v0.1.md). Commit `bc469cc` su main. [Deploy40095709440](https://github.com/Jacoporusso/veloria/actions/runs/40095709440) SUCCESS: test dominio/persistenza, validatore e build Pages passati. Sito pubblico HTTPS200 e cache `veloria-shell-v155` verificati. [Verify40095709422](https://github.com/Jacoporusso/veloria/actions/runs/40095709422) avviata/in coda al controllo, suite completa134 non ancora attestata.

## 0.3.133 — Guida al recupero e regressione Drowzee31

57 test starter/evoluzioni passati, incluso Drowzee31→Hypno senza nuovo livello o mosse retroattive. Build e validatore passati; due browser sui messaggi di disponibilità/KO/pietra e immutabilità del save passati in2,7s, screenshot controllati. Nessun cambiamento al motorev15. [Dettagli](50_EVOLUTION_READINESS_GUIDE_v0.1.md). Commit `680e54a` su main. [Deploy40094904704](https://github.com/Jacoporusso/veloria/actions/runs/40094904704) SUCCESS: suite dominio/persistenza, validatore e build Pages passati. Sito pubblico HTTPS200 e cache `veloria-shell-v154` verificati. [Verify40094904763](https://github.com/Jacoporusso/veloria/actions/runs/40094904763) pending; suite browser remota completa133 non ancora attestata. La Verify132 è stata cancellata dal raggruppamento della coda a favore della133, senza attestazione di successo.

## 0.3.132 — Evoluzione durante la sfida al capopalestra

Rulesetv15: trasformazione alla fine del turno con XP/livello, celebrazione prima del prossimo avversario e nessun duplicato a fine lotta.577 test dominio/persistenza, build e validatore passati. Quattro browser passati in45,8s: due nuove prove Mira portrait/landscape con medaglia/salvataggio/reload e due regressioni Charizard terminali. Screenshot controllati. [Contratto e limiti](49_MIDBATTLE_EVOLUTION_v0.1.md). Commit `6219bab` su main. [Deploy40094489720](https://github.com/Jacoporusso/veloria/actions/runs/40094489720) SUCCESS: test dominio/persistenza, validatore e build Pages passati. Sito pubblico HTTPS200 e cache `veloria-shell-v153` verificati. [Verify40094489674](https://github.com/Jacoporusso/veloria/actions/runs/40094489674) pending; suite completa132 non ancora attestata.

[Verify40092178731](https://github.com/Jacoporusso/veloria/actions/runs/40092178731) della130 conclusa SUCCESS. La131 era in corso all’ultimo controllo; non si attribuisce il suo esito alla132.

## 0.3.131 — Recupero evoluzione alla soglia già raggiunta

Rulesetv14: Charmeleon già36 può diventare Charizard senza dover raggiungere37, dopo una vittoria con XP e senza KO. Nessun cambiamento ai livelli/mosse importati o al formato del save.577 test dominio/persistenza, build e validatore passati; due casi browser Charizard normali/recupero con celebrazione e reload passati in14,6s, screenshot controllato. [Contratto](48_LEVEL_EVOLUTION_RECOVERY_v0.1.md). Commit `9d07375` su main. [Deploy40093581805](https://github.com/Jacoporusso/veloria/actions/runs/40093581805) SUCCESS: test dominio/persistenza, validatore e build Pages passati. Sito pubblico HTTPS200 e cache `veloria-shell-v152` verificati. [Verify40093581781](https://github.com/Jacoporusso/veloria/actions/runs/40093581781) pending dietro la130 ancora in corso; suite completa131 non ancora attestata.

## Recupero naturale Hypno/Dune — 24 ottobre 2026

Dieci vittorie selvatiche ed evoluzione guadagnata Drowzee→Hypno30 in5minuti; poi Lina/Noemi vinte,420+1250 monete, percorso di ritorno e cure gratuite verificati in3,9minuti. Entrambe le prove senza errori JS; backup/checksum, premi, identità e risorse verificati separatamente. [Provenienza e limiti](playtests/2026-10-24-hypno-and-dunes-recovery.md). Nuovi driver/backup richiedono la propria CI dopo integrazione, senza attestazione anticipata.

[Verify40091325868](https://github.com/Jacoporusso/veloria/actions/runs/40091325868) del commit497111c conclusa SUCCESS. [Verify40092178731](https://github.com/Jacoporusso/veloria/actions/runs/40092178731) della130 ora in corso, non ancora attestata completamente verde.

## 0.3.130 — Indicazione sulla confusione e prima prova naturale Selene

Descrittore condiviso: sostituire il Pokémon elimina la confusione, come già implementato dal motore.14 test esistenti descrizioni/effetti canonici e build passati; nessuna modifica alle regole. Prima sfida Selene su runtime129 persa in17 turni, puzzle/acquisti/export verificati; checksum e risorse dei backup controllati. [Dettagli](47_CONFUSION_STRATEGY_HINT_v0.1.md). Commit `59899c4` su main. [Deploy40092178872](https://github.com/Jacoporusso/veloria/actions/runs/40092178872) SUCCESS: test dominio/persistenza, validatore e build Pages passati. Sito pubblico HTTPS200 e cache `veloria-shell-v151` verificati. [Verify40092178731](https://github.com/Jacoporusso/veloria/actions/runs/40092178731) pending; suite completa130 non ancora attestata.

[Deploy40091846770](https://github.com/Jacoporusso/veloria/actions/runs/40091846770) del commit e1fcef0 SUCCESS; [Verify40091846798](https://github.com/Jacoporusso/veloria/actions/runs/40091846798) cancellata dal raggruppamento della coda a favore della130, senza attestazione di successo; resta [Verify40091325868](https://github.com/Jacoporusso/veloria/actions/runs/40091325868), ancora in corso al controllo. Nessuna attestazione anticipata di queste suite.

## 0.3.129 — Gelodenti e verifica degli effetti combinati

84 mosse/83 specie, congelamento10% e tentennamento10% indipendenti.574 test dominio/persistenza,111 Python, validatore/importer offline e build passati. Undici casi di composizione comprendono anche le regole runtime senza modifiche; descrizioni aggiornate. Due casi UI portrait/landscape passati in2,2s e screenshot controllati. Prima consultazione senza rete nella PWA passata in3s (16,5s con build), risorse e salvataggio invariati. [Evidenze e limiti](46_ICE_FANG_COMBINED_EFFECTS_v0.1.md). Commit `db0550c` su main. [Deploy40089977062](https://github.com/Jacoporusso/veloria/actions/runs/40089977062) SUCCESS; sito pubblico HTTPS200 e cache `veloria-shell-v150` verificati. [Verify40089977038](https://github.com/Jacoporusso/veloria/actions/runs/40089977038) conclusa SUCCESS. Playtest Bruno/Maya e backup integrati nel commit `497111c`; la sua CI separata non è ancora attestata.

Il servizio di approvazione è tornato disponibile e i test browser sono stati eseguiti attraverso il normale controllo; nessun bypass del precedente blocco di quota. [Verify40075591104](https://github.com/Jacoporusso/veloria/actions/runs/40075591104) della128 conclusa SUCCESS:21 job riusciti. La suite remota129 è conclusa SUCCESS.

## 0.3.128 — Morso/Bottintesta e preparazione naturale Acquariva (24/10/2026)

83 mosse/83 specie. Due mosse ufficiali con tentennamento30% e correzione degli apprendimenti ripetuti a livelli diversi. Intestazione dei dettagli Pokémon compatta e contestuale.563 test dominio/persistenza,111 Python, validator/importer e build passati. Importazione del backup guadagnato senza rete, dettagli Bottintesta/Morso al livello29 e risorse/RNG invariati passati in4,1s (17,6s con build); screenshot controllato. Dettagli nel [documento45](45_PSYCHIC_PREPARATION_MOVES_v0.1.md). Commitf22fa93 su main. [Deploy40075591062](https://github.com/Jacoporusso/veloria/actions/runs/40075591062) SUCCESS; sito pubblico HTTPS200 e cache `veloria-shell-v149` verificati. [Verify40075591104](https://github.com/Jacoporusso/veloria/actions/runs/40075591104) era in corso all’ultimo controllo. Registrazione locale aggiornata; commit/push della ricevuta non eseguiti: il controllo automatico delle autorizzazioni ha esaurito la quota.

Continuazione naturale: Delta/Acquariva completati, catture Drowzee29 ed Eevee28 con Sfere guadagnate, deposito multiplo reale dei due Rattata. Checkpoint esportato con1890 monete e cinque medaglie; checksum/confronti con report e legalità di mosse/PP per tutti e sette i compagni verificati. Prima traversata interrotta dal driver al reload e stato recuperato senza modifiche dalla traccia; ripresa corretta passata. Secondo errore di coordinata del driver conservato prima della ricerca riuscita. [Report e provenienza](playtests/2026-10-24-acquariva-preparation.md). Selene non ancora tentata naturalmente in questa continuazione.

[Verify40071516996](https://github.com/Jacoporusso/veloria/actions/runs/40071516996) della126 e [Verify40073060003](https://github.com/Jacoporusso/veloria/actions/runs/40073060003) della127 entrambe SUCCESS;127 con21 job riusciti. Questo non attesta anticipatamente la128.

## 0.3.127 — Evoluzioni botaniche e quinta medaglia naturale (24/10/2026)

Vileplume/Victreebel/Bellossom, Pietrafoglia/Pietrasolare acquistabili a Radicelmo, Megaassorbimento/Fogliamagica dai record ufficiali.83 specie,81 mosse,8 rami con pietre; fonti degli oggetti incluse nella verifica offline.558 test dominio/persistenza e111 Python passati, validatore/build passati; tre evoluzioni tramite negozio/Zaino/annullamento/reload passate in26,2s, artwork offline passati in2s (15,4s con build). Screenshot portrait/landscape controllati. Dettagli in [44_BOTANICAL_EVOLUTIONS_v0.1.md](44_BOTANICAL_EVOLUTIONS_v0.1.md). Commit45fab69 su main. [Deploy40073060038](https://github.com/Jacoporusso/veloria/actions/runs/40073060038) SUCCESS; sito pubblico HTTPS200, cache `veloria-shell-v148` e tre nuovi artwork HTTPS200 verificati. [Verify40073060003](https://github.com/Jacoporusso/veloria/actions/runs/40073060003) SUCCESS:21 job riusciti.

Progressione separata su runtime126: seconda sconfitta Nerea conservata,31 vittorie di allenamento senza spese, Quagsire24 con Amnesia appresa via UI; Nerea vinta in12 turni, quinta medaglia e1400 monete reali. Backup esportati/checksum e confronti con report verificati. [Report e limiti](playtests/2026-10-24-nerea-fifth-medal.md). P6–P8/Lega/finale naturali restano aperti.

[Verify40070926614](https://github.com/Jacoporusso/veloria/actions/runs/40070926614) del commit995fe6e conclusa SUCCESS. [Verify40071516996](https://github.com/Jacoporusso/veloria/actions/runs/40071516996) del trackpad126 ancora in corso all'ultimo controllo:13 job riusciti,8 attivi, nessun fallimento osservato. Nessuna attestazione anticipata della suite completa126 o127.

## 0.3.126 — Trackpad touch opzionale (24/10/2026)

Commit `f1a28d3`: impostazione Frecce/Trackpad persistente sul dispositivo, movimento a destra e azioni a sinistra. Build riuscita, due regressioni layout mobile passate e due test dedicati portrait/landscape passati (9,6s): spostamento reale verso una casella libera, cambio direzione, zona neutra, rilascio, blur, cancellazione, reload e ripristino frecce. Controllo visivo screenshot portrait e landscape eseguito. Nessun test fisico Android/iOS attestato. [Deploy40071516967](https://github.com/Jacoporusso/veloria/actions/runs/40071516967) SUCCESS; sito pubblico HTTPS200 e cache `veloria-shell-v147` verificati. [Verify40071516996](https://github.com/Jacoporusso/veloria/actions/runs/40071516996) avviata, suite completa non ancora attestata. Dettagli in [43_TOUCH_JOYSTICK_v0.1.md](43_TOUCH_JOYSTICK_v0.1.md).

## Verifica completa125 e progressione naturale Nerea (24/10/2026)

[Verify40068518426](https://github.com/Jacoporusso/veloria/actions/runs/40068518426) del rilascio9986a89 **SUCCESS:21 job riusciti**. [Verify40067973650](https://github.com/Jacoporusso/veloria/actions/runs/40067973650) della124 conclusa FAILURE nel solo job chapters7: caricamento del driver funivia con ECONNRESET. Il driver ora consente due retry limitati di rete; caso gate/andata/ritorno funivia passato localmente in7s (8s totale). Nessun riavvio del gioco o retry degli assert introdotto.

Continuazione reale:16 vittorie per allenare il Wooper catturato, evoluzione naturale in Quagsire20,190 monete e strumenti invariati; poi prima prova persa e vittoria su Viola con cambi espliciti,1050 monete guadagnate, rifornimenti pagati. Driver interrotti documentati e checkpoint recuperati senza modifiche dai loro eventi completi. Prima battaglia effettiva Nerea: sconfitta in16 turni, Lanturn rimasto56/108HP, tre cure consumate, nessuna quinta medaglia. Report, backup e limiti in [playtests/2026-10-24-quagsire-viola-nerea.md](playtests/2026-10-24-quagsire-viola-nerea.md). I nuovi driver e documenti richiedono la propria CI dopo push; non sono il commit già verificato125.

## 0.3.125 — Guida ai microhabitat (24/10/2026)

Squadra e Pokédex indicano le aree all’interno della mappa, con livelli/orari propri quando una specie compare in più habitat.32 etichette descrittive nei contenuti, nessun cambiamento a pesi o salvataggi.552 test dominio/persistenza,109 Python, validatore e build passati; due prove browser portrait/landscape passate in5,7s e controllo visivo dello screenshot. PWA offline con indicazioni, deposito, negozio e reload passata in6,6s (20,1s inclusa build). Dettagli in [42_POKEDEX_MICROHABITAT_GUIDE_v0.1.md](42_POKEDEX_MICROHABITAT_GUIDE_v0.1.md). Commit9986a89 su main. [Deploy40068518347](https://github.com/Jacoporusso/veloria/actions/runs/40068518347) SUCCESS; HTTPS200 e cache `veloria-shell-v146` verificati sul sito pubblico. [Verify40068518426](https://github.com/Jacoporusso/veloria/actions/runs/40068518426) in attesa della124; suite completa125 non ancora confermata.

[Deploy40067973660](https://github.com/Jacoporusso/veloria/actions/runs/40067973660) della124 SUCCESS; sito pubblico HTTPS200 e cache `veloria-shell-v145` verificati. [Verify40067973650](https://github.com/Jacoporusso/veloria/actions/runs/40067973650) ancora in esecuzione: nove job completati e nessun fallimento al controllo, non attestata interamente verde.

## 0.3.124 — Microhabitat iniziali e prova naturale Mira (24/10/2026)

Bosco con sottobosco/sponda; Viale con insetti/radura; Terrazze con felci/pietra; Salita con fiori/torrente; Viadotto con ciliegi/binari/rive. Metadata e trigger esistenti, nessun cambio di collisioni o tassi per passo.551 test dominio/persistenza, validatore e build passati. Pokédex portrait/landscape e percorso Vetracielo passati in1,4min. Nuova partita reale Charmander, seed1192554284: prima medaglia guadagnata in3,1min, cinque vittorie e una cattura, nessuna sconfitta dell’intera squadra e zero errori JS; titolo/ripresa verificati. Non è ancora confronto naturale di tutti gli starter. Dettagli in [41_EARLY_MICROHABITATS_v0.1.md](41_EARLY_MICROHABITATS_v0.1.md), report conservato nei playtest.

[Verify40018592554](https://github.com/Jacoporusso/veloria/actions/runs/40018592554) della123 FAILURE in cinque job/sette casi: cinque confronti monorotaia legati al flag cattura mancante nella fixture, sconfitta della fixture Tobia dopo scottatura, reset connessione al main del driver Celia. Correzioni circoscritte alle fixture/driver: sette casi online passati in1,4min, monorotaia offline passata in6,3s (20,6s inclusa build). Nessuna rimozione dei confronti di risorse/premi/persistenza. Commit646435a su main. [Deploy40067973660](https://github.com/Jacoporusso/veloria/actions/runs/40067973660) con build SUCCESS e job deploy ancora QUEUED al controllo; nessuna approvazione ambiente pendente. Pages risponde200 ma serve ancora cache `veloria-shell-v144`, quindi124 non ancora confermata pubblica. [Verify40067973650](https://github.com/Jacoporusso/veloria/actions/runs/40067973650) avviata/in coda, suite completa124 non ancora confermata. Continuare a osservare questi handle, senza rilanci basati sul solo tempo di attesa.

## 0.3.123 — Costa, dune e delta differenziati (23/10/2026)

Costa:8 specie fra turbine/riva/pesca; Dune:11 fra terreno asciutto/canneti/laguna; Delta:4 con gruppo d’acqua dolce distinto dal mare. Chinchou mantenuto sulla costa, livelli e tassi per passo/abboccata documentati.551 test dominio/persistenza passati, incluso spawn di ogni specie selvatica con mosse importate ai due estremi di livello. Validatore e build passati. Pokédex portrait/landscape e pesca passati in30,5s; pesca riallineata alla tabella sorgente e percorso gate/andata/ritorno Dune–Delta passati in52,5s. Dettagli in [40_COASTAL_MICROHABITATS_v0.1.md](40_COASTAL_MICROHABITATS_v0.1.md). Commit16db267 su main. [Deploy40018592384](https://github.com/Jacoporusso/veloria/actions/runs/40018592384) SUCCESS; sito pubblico HTTPS200 e cache `veloria-shell-v144` verificati. [Verify40018592554](https://github.com/Jacoporusso/veloria/actions/runs/40018592554) in attesa della suite precedente, non ancora confermata interamente verde; non dichiarato bilanciamento naturale delle Palestre5/6.

## 0.3.122 — Microhabitat industriali (23/10/2026)

Prima revisione della ripetitività documentata nell’audit38: Anello con due gruppi nord/sud e6 specie, Condotto con due gruppi ovest/est e8 specie. Nuove tabelle collegate ai trigger esistenti, Wooper mantenuto a ovest a tutte le ore, nessun cambio di collisioni o tasso per passo.550 test dominio/persistenza, validatore e build passati. Percorso Centrale e due viste Pokédex passati in1,3min. Dettagli e limiti in [39_INDUSTRIAL_MICROHABITATS_v0.1.md](39_INDUSTRIAL_MICROHABITATS_v0.1.md). Commit151def2 su main. [Deploy40017723829](https://github.com/Jacoporusso/veloria/actions/runs/40017723829) SUCCESS; sito pubblico HTTPS200 e cache `veloria-shell-v143` verificati. [Verify40017723742](https://github.com/Jacoporusso/veloria/actions/runs/40017723742) in attesa della suite precedente: verifica completa122 non ancora confermata.

[Verify40012990597](https://github.com/Jacoporusso/veloria/actions/runs/40012990597) della120 terminata FAILURE:20 job riusciti, un fallimento Selene. Screenshot e log confermano sconfitta della fixture preparata contro Espeon, non medaglia mancante dopo una vittoria. Solo il driver ora controlla il seed e sceglie Scintilla già disponibile; prova isolata puzzle/medaglia/reload passata in54,9s. Nessun cambio alla difficoltà o ai seed delle partite reali.

## 0.3.121 — Memoria delle catture (23/10/2026)

Le registrazioni del Pokédex sopravvivono all’evoluzione e al consumo della ricevuta della cerimonia. I conteggi dei Pokémon attualmente posseduti rimangono separati. 550 test dominio/persistenza passati, build passata; due prove browser isolate con IndexedDB e reload passate in portrait/landscape in2,4s. Dettagli in [37_POKEDEX_CAPTURE_HISTORY_v0.1.md](37_POKEDEX_CAPTURE_HISTORY_v0.1.md). Commit `a650c04` su main. [Deploy40013954428](https://github.com/Jacoporusso/veloria/actions/runs/40013954428) SUCCESS; sito pubblico HTTPS200 e cache `veloria-shell-v142` verificati. [Verify40013954389](https://github.com/Jacoporusso/veloria/actions/runs/40013954389) in attesa della120: suite completa121 non ancora confermata.

[Deploy40012990609](https://github.com/Jacoporusso/veloria/actions/runs/40012990609) della120 SUCCESS. [Verify40012990597](https://github.com/Jacoporusso/veloria/actions/runs/40012990597) ancora in esecuzione al controllo: quattro job completati senza fallimenti, non attestata interamente verde.

## 0.3.120 — Habitat e recupero naturale dopo Viola (23/10/2026)

Pokédex/Squadra mostrano habitat da tabelle collegate alle mappe runtime, livelli, metodo e periodo; precedenza alle zone già esplorate.549 test dominio/persistenza passati, due prove browser habitat su portrait/landscape con salvataggio invariato e una prova PWA offline con habitat, deposito, acquisti e reload passata in5,9s (19,4s inclusa build). Build e validatore passati. Dettagli in [36_POKEDEX_HABITATS_v0.1.md](36_POKEDEX_HABITATS_v0.1.md).

Il checkpoint dopo Viola continua realmente fino a Iris: vittoria in cinque turni senza consumabili,402 XP e650 monete guadagnati, poi ritorno e cure a Portolume. Test passato in circa2min; backup esportato dall’app e verificato. Non è una vittoria su Viola o Nerea. Report in [playtests/2026-10-23-iris-recovery.md](playtests/2026-10-23-iris-recovery.md).

[Deploy40010487593](https://github.com/Jacoporusso/veloria/actions/runs/40010487593) della119 SUCCESS; HTTPS200/cachev140 verificati. [Verify40010487596](https://github.com/Jacoporusso/veloria/actions/runs/40010487596) ancora in esecuzione al controllo:18 job completati e un fallimento, Raticate nella shard11. Diagnostica scaricata: turno2, Azione95% con PP consumato, Caterpie ancora a1 HP. Il test assumeva KO al primo attacco ma ereditava il nuovo seed casuale. Ora soltanto la fixture evoluzioni usa un seed controllato, senza cambiare probabilità o seed delle avventure reali. Tutte le21 prove evoluzione/artwork/IndexedDB passate in2,3min. Nuova verifica completa e deploy120 da confermare dopo il push.

## 0.3.119 — Borsa italiana e test dei negozi riallineati (23/10/2026)

La borsa di lotta riceve i nomi italiani dal catalogo del proprietario e mostra quantità e recupero HP/cura dello stato. Sei prove browser borsa/icone/catture/ricompense passate, con controllo visivo portrait/landscape e consumo; build e validatore passati. Il playtest naturale registra una sconfitta contro Viola in14 turni, non una quinta medaglia: report e backup verificati in [playtests/2026-10-23-viola-first-attempt.md](playtests/2026-10-23-viola-first-attempt.md).

[Verify40006092416](https://github.com/Jacoporusso/veloria/actions/runs/40006092416) della0.3.118 è terminata FAILURE in cinque job: nove casi cercavano ancora i vecchi pulsanti o il dialogo precedente dei negozi. Correzioni applicate ai driver, senza eliminare i controlli di acquisto, persistenza, icone, collisione o ritorno. Sei prove medicine/NPC passate in27,8s; Concordia e accesso Lega passati in2,2min; percorso Lega offline passato in50,5s (1,1min inclusa build). Sono tutti i nove casi indicati dal log. La nuova suite completa e il deploy119 vanno confermati dopo il push: nessuna attestazione anticipata di CI verde.

## 0.3.118 — Servizi multipli pubblicati (23/10/2026)

Commit259791e su main: deposito persistente con selezione multipla, acquisti con quantità e totale, ordine squadra con mouse/touch/tastiera.547 test dominio/persistenza,19 prove browser dei menu e dei percorsi esistenti,2 prove offline finali passate; validatore e build passati. La verifica offline artwork include ora Poliwrath62, correggendo la sola attesa obsoleta che aveva fatto fallire Verify0.3.117.

[Deploy40006092397](https://github.com/Jacoporusso/veloria/actions/runs/40006092397) SUCCESS. HTTPS200 e cache `veloria-shell-v139` verificati sul sito pubblico; build-manifest pubblico disponibile. [Verify40006092416](https://github.com/Jacoporusso/veloria/actions/runs/40006092416) in esecuzione al controllo,10 job conclusi e nessun fallimento: non ancora dichiarata interamente verde.

## 0.3.115 — Seed iniziali verificati localmente (22/10/2026)

Nuova avventura con uint32 da Web Crypto, normalizzazione dello zero, nessun nuovo seed in ripresa/importazione. Nessun cambio di schema o delle regole RNG per turno.539 test dominio/persistenza passati, inclusi sorgente controllata per due nuove partite e backup senza ulteriori estrazioni. Browser7,2s (8,1s totali): due avventure con entropia controllata distinta, due reload conservano il cursore e non estraggono altro. Browser LAN reale http://192.168.1.14:5174, senza mock di entropia: nome/starter/ripresa passati in38,7s (39,5s totali). Validatore e build produzione passati; cachev136. Nessuna attestazione di smartphone fisici.

Driver Centrale–Portolume passato in3,3min (3,4min totali) dal backup guadagnato P4 importato via UI. Ricerca, premi unici Ivo/Marina, traghetto, Amo Vecchio, cure e titolo/ripresa verificati; zero errori JS e nessuna battaglia nel tratto. Backup Portolume esportato e checksum valido. Report in [playtests/2026-10-22-centrale-portolume.md](playtests/2026-10-22-centrale-portolume.md). I report storici mantengono il seed fisso della0.3.114; non vengono reinterpretati come campioni casuali indipendenti. [Verify39727808039](https://github.com/Jacoporusso/veloria/actions/runs/39727808039) dell’integrazione precedente ha19 job conclusi senza errori al controllo; [Deploy39727808035](https://github.com/Jacoporusso/veloria/actions/runs/39727808035) SUCCESS. Pubblicazione e CI0.3.115 da confermare.

## Quarta medaglia guadagnata e regressione offline corretta — 22/10/2026

La prima partita naturale Charmander arriva a Rhea in25,1min automatizzati:64 battaglie,58 vittorie,2 catture e4 sconfitte, ultima contro Rhea.34 incontri di preparazione nell’Anello, Charmeleon22 e Rattata3/7. Sensore/Ivo, cure, acquisti e circuito funzionanti; nessun errore JS. Sconfitta conservata nel report, non reinterpretata come vittoria. La continuazione importa via UI lo stato finale realmente guadagnato, verificando squadra/inventario/denaro/RNG immutati: attacchi diretti, due Pozioni acquistate con400monete, Rhea battuta in8turni. Charmeleon23 a27/59HP,1190monete, quattro medaglie e ripresa corretta. Una prova52,8s; report e provenienza in [playtests/2026-10-22-fourth-medal-charmander.md](playtests/2026-10-22-fourth-medal-charmander.md). Non certifica gli altri starter o l’intera campagna.

[Verify39682163794](https://github.com/Jacoporusso/veloria/actions/runs/39682163794) è FAILURE, unico job Offline journey: E2E06 usava quattro conferme fisse per Elia, ora insufficienti dopo il consiglio sul riposo. Driver corretto fino alla chiusura del dialogo, mantenendo gli asserti di quest. E2E06 completo produzione senza rete passato localmente in5,2min (5,6min compresa build), fino a tre medaglie. Gli altri20 job della suite sono SUCCESS. TypeScript e diff-check passati. Questa integrazione non cambia runtime o cache; nuova CI da confermare.

Audit aggiornato: nuove partite ancora con seed fisso1234567; i test non lo iniettano ma non sono campioni casuali indipendenti. Report di confronto corretti e requisito lasciato aperto. Piano Poliwrath nel documento34: nessun nuovo Pokémon dichiarato già implementato.

## Pubblicazione0.3.114 e suite corretta confermate — 22/10/2026

Commitf0e704c su main. [Deploy39682163898](https://github.com/Jacoporusso/veloria/actions/runs/39682163898) SUCCESS; HTTPS200 e cache `veloria-shell-v135` verificati. [Verify39682163794](https://github.com/Jacoporusso/veloria/actions/runs/39682163794) attende la suite precedente. [Verify39680726652](https://github.com/Jacoporusso/veloria/actions/runs/39680726652) delle correzioni apprendimento/evoluzioni è SUCCESS su tutti i job. Questa evidenza supera i precedenti stati in esecuzione; la suite della0.3.114 va confermata separatamente.

Esteso il driver naturale con PLAYTEST_CONTINUE_FERRALUCE=1: include i capitoli precedenti, esporta tramite UI il vero backup dopo Aster e prosegue con sensore/Ivo, cure, XP selvatici, circuito e Rhea. Nuova esecuzione Charmander in corso: nessuna quarta medaglia dichiarata prima dell’esito. TypeScript passato; non modifica runtime o bilanciamento. Documenti16/18 riallineati a P4, seguito e Magneton realmente presenti; corretto il riferimento della bottega delle pietre a Dalia.

## 0.3.114 — Indicazioni sul riposo e confronto del prologo (21/10/2026)

Elia e Sera indicano il letto gratuito di Borgofonte e il recupero di HP/PP/stati, anche nel feedback della prima sfida. Nessuna modifica a squadre, regole o ricompense. E2E13 passato in46,6s: porte reciproche, letto su HP1/PP0/veleno, posizione e reload. Validatore e build passati; cachev135.

Squirtle0.3.113 e Pikachu0.3.114 hanno completato naturalmente il prologo e la ripresa, rispettivamente in3,6/4,7min automatizzati: Squirtle5 vittorie+2 catture, Pikachu12 vittorie+1 cattura, nessuna sconfitta completa o errore JS. Due KO contro Mira per Squirtle, uno per Pikachu; entrambi senza pozioni residue. Report/limiti in playtests/2026-10-21-first-medal-{squirtle,pikachu}.md e rispettivi JSON. Tutti quattro starter hanno almeno una prova naturale del prologo, non della campagna completa. La politica non usa il letto: i consigli sono una correzione di orientamento, non una prova di bilanciamento risolto.

[Verify39678891474](https://github.com/Jacoporusso/veloria/actions/runs/39678891474) conclusa FAILURE, sola shard11 su test Raticate già corretto e passato localmente insieme alle21 evoluzioni. [Verify39680726652](https://github.com/Jacoporusso/veloria/actions/runs/39680726652) della correzione è in esecuzione,8 job conclusi senza fallimenti al controllo. Pubblicazione e CI0.3.114 da confermare.

## Prologo Bulbasaur e aggiornamento test evoluzioni — 21/10/2026

Nuova partita0.3.113 completata fino alla prima medaglia con Bulbasaur:10 battaglie,7 vittorie del giocatore,2 sconfitte selvatiche e1 cattura. Nuovi apprendimenti Parassiseme/Frustata, Ada, Centro, acquisti, puzzle Mira e ripresa dal titolo verificati; nessun errore JS. Bulbasaur9 a5/27HP e Hoothoot5,850monete, scorte esaurite. Report e limiti in [playtests/2026-10-21-first-medal-bulbasaur.md](playtests/2026-10-21-first-medal-bulbasaur.md): il risultato non chiude il bilanciamento o gli altri starter.

La shard11 di [Verify39678891474](https://github.com/Jacoporusso/veloria/actions/runs/39678891474) ha fallito su Raticate: il test attendeva automaticamente la cerimonia, ignorando la nuova conferma della carta per una mossa appresa in uno slot libero. Aggiornato il solo driver della prova per riconoscere e confermare quel passaggio. Tutte21 evoluzioni passate localmente in2,3min, con artwork, cerimonia, HP/PP e reload IndexedDB; TypeScript passato. Nessuna modifica runtime. La CI della correzione va confermata; non dichiarata verde la suite0.3.113.

## Pubblicazione0.3.113 confermata e suite lotta — 21/10/2026

Commit95774e7 su main. [Deploy39678891497](https://github.com/Jacoporusso/veloria/actions/runs/39678891497) SUCCESS; sito HTTPS200 e cache `veloria-shell-v134` verificati. [Verify39678891474](https://github.com/Jacoporusso/veloria/actions/runs/39678891474) in esecuzione all’ultimo controllo. La suite completa precedente [Verify39676474294](https://github.com/Jacoporusso/veloria/actions/runs/39676474294) è SUCCESS.

Verifica locale estesa della lotta:29 prove passate in1,5min. Le prime esecuzioni avevano evidenziato conferme accodate dai test prima dell’elaborazione Phaser (salti messaggi/selezione): gli input della fixture ora attendono due frame e l’avanzamento osservato, senza modificare il motore o ritentare gli asserti. Anche i dettagli di apprendimento, touch, tastiera, effetti, rotazione e sostituzioni passano insieme. Il seguito integra solo test e documentazione; la nuova CI resta da confermare separatamente. Avviato un playtest naturale Bulbasaur, esito non ancora attestato.

## 0.3.113 — Apprendimento verificato localmente (21/10/2026)

Confronto con le carte condivise della lotta e dettagli completi per candidata e mosse conosciute. Apprendimento automatico e scelta con quattro slot coperti; il ritorno dai dettagli preserva stato e selezione. Nove prove browser passate in40,6s: portrait320×568/390×844, landscape844×390/667×320, touch e tastiera, sostituzione/rifiuto e regressioni dettagli normali.537 prove dominio/persistenza, validatore e build produzione passati. Cachev134. Test con fixture browser; non attestano telefoni fisici o nuovo bilanciamento naturale. Pubblicazione e CI da confermare.

## Pubblicazione0.3.112 confermata — 21/10/2026

Commit9878a22 su main. [Deploy39676474365](https://github.com/Jacoporusso/veloria/actions/runs/39676474365) SUCCESS: test, validatore e build Linux riusciti. Sito HTTPS200 e cache `veloria-shell-v133` verificati dopo il deploy. [Verify39676474294](https://github.com/Jacoporusso/veloria/actions/runs/39676474294) in coda al controllo; la suite completa della nuova versione resta da confermare.

La suite completa [Verify39674200882](https://github.com/Jacoporusso/veloria/actions/runs/39674200882) del commit ebbdc8f è SUCCESS su tutti i job: conferma le correzioni dei percorsi di Ada, il caricamento della Lega e le altre verifiche della0.3.111. Questa evidenza aggiorna i precedenti stati in esecuzione/in integrazione riportati sotto; non viene estesa automaticamente alle modifiche0.3.112.

## 0.3.112 — Contraccolpo verificato localmente (21/10/2026)

Riduttore importata senza rete dai dati HGSS locali e resa disponibile nei12 learnset ufficiali.79 specie/79 mosse, movesv11, rulesetv13, cachev133. Importer --check, validatore, TypeScript e build produzione riusciti.537 prove dominio/persistenza e106 Python passate: danni effettivi/overkill, arrotondamento, minimo1HP, mancata/immunità/sonno, PP, KO simultaneo, ordine contraccolpo→XP e ricompensa al giocatore sopravvissuto al KO avversario da contraccolpo (anche emergenza). Importazioni future di effetti negativi restano bloccate fino a verifica specifica.

Due prove browser portrait390×844 e landscape844×390 passate in13,1s: avviso rischio, tutte le pagine dettagli leggibili e cliccabili, risoluzione e reload IndexedDB HP/PP. Venusaur e Piloswine passati in15,3s dopo il cambiamento dei learnset, conservando anche gli HP persi per contraccolpo. Build produzione: scheda Squadra, battaglia e ripresa senza rete passate in5,9s (19,4s compresa build), nessuna richiesta fallita né errore JS. Fixture d'integrazione esplicite; non sono nuovi playtest di bilanciamento naturale o telefoni fisici.

La suite [39674200882](https://github.com/Jacoporusso/veloria/actions/runs/39674200882) delle correzioni precedenti è ancora in esecuzione senza job falliti all'ultimo controllo. Pubblicazione e CI della0.3.112 da confermare.

## Progressione naturale fino ad Aster e correzioni CI — 21/10/2026

Nuova partita0.3.111 con Charmander completata fino alla terza medaglia:13min automatizzati,29 battaglie (27 vittorie,2 catture), evoluzione in Charmeleon17, nessun errore JS, ripresa dal titolo corretta. Risorse e livelli guadagnati nel gioco,9 incontri preparatori prima di Dalia e9 prima di Aster. Dopo Aster:14/46HP del primo membro,1490monete, una pozione. [Report e limiti](playtests/2026-10-21-third-medal.md). La sconfitta del tentativo precedente contro Oren rimane registrata; il ramo di rivincita ora previsto dal test non è stato eseguito perché questa volta Oren è stato battuto subito. Altri starter, strategie e seguito della campagna restano aperti.

Corrette le tre tratte del test E2E04 che attraversavano Ada: percorso al sensore, ritorno verso l'habitat e ritorno al Centro. Usano la geometria Tiled senza rimuovere collisioni. Prova completa cattura con squadra piena/Box/cure/reload passata in2,5min (2,6min complessivi). Test Lega reload in battaglia pendente passato in10,2s dopo maxRetries2 sui soli reset HTTP di route.fetch. Nessun retry degli asserti o modifica alla progressione runtime.

Questa integrazione cambia test e documentazione, non contenuti o cache della0.3.111. La nuova CI va confermata separatamente prima di dichiararla verde.

## Pubblicazione 0.3.111 confermata — 21/10/2026

Commit a14ed39 su main. [Deploy 39671428349](https://github.com/Jacoporusso/veloria/actions/runs/39671428349) SUCCESS: test, validatore e build Linux riusciti. HTTPS200 e cache `veloria-shell-v132` verificati. [Verify 39671428372](https://github.com/Jacoporusso/veloria/actions/runs/39671428372) in esecuzione al controllo; suite completa non ancora attestata verde.

La suite precedente [39608118962](https://github.com/Jacoporusso/veloria/actions/runs/39608118962) è FAILURE: E2E04 tentava di attraversare la nuova collisione di Ada, mentre il test reload della Lega ha avuto ECONNRESET sul caricamento main.ts. Correzioni locali dei soli test preparate, da provare prima dell'integrazione. Tutte le altre shard, comprese le nuove collisioni NPC e l'offline, sono passate. La partita naturale verso Vetracielo è in esecuzione; nessuna terza medaglia dichiarata verificata.

## 0.3.111 — Verifiche locali (21/10/2026)

Magnemite → Magneton al30 aggiunta da fonte ufficiale locale; importer evoluzioni --check riuscito. 524 test dominio/persistenza, validatore e TypeScript passati. Tre prove browser passate in14,3s: cerimonia/artwork/IndexedDB di Magneton e clic del mouse sul pulsante A per Elia e Ada, viewport PC900×800 con comandi visibili. Il bug segnalato dall'utente non è riprodotto in queste condizioni; identificazione del personaggio/circostanza ancora richiesta. Non attesta altre dimensioni o la sessione dell'utente.

Nuova partita naturale0.3.110 ha ripetuto Dalia, poi perso la prima sfida con Oren (8,8min, nessun errore JS). [Evidenza](playtests/2026-10-21-natural-oren-first-attempt.json). Il test ora prevede cure, preparazione e rivincita, ma la terza medaglia resta da verificare. Documenti Vetracielo riallineati allo stato attuale, senza chiudere metropoli completa, tutti gli starter o QA fisico.

Build produzione riuscita. Pubblicazione0.3.111 da confermare.

## Pubblicazione 0.3.110 confermata — 21/10/2026

Commit d8036fe su main. [Deploy 39608119064](https://github.com/Jacoporusso/veloria/actions/runs/39608119064) SUCCESS: test, validatore e build Linux riusciti. Sito pubblico HTTPS 200 e cache `veloria-shell-v131` verificati. [Verify 39608118962](https://github.com/Jacoporusso/veloria/actions/runs/39608118962) in attesa al controllo del deploy; non è ancora attestata verde la suite completa di questa versione.

## 0.3.110 — Seconda medaglia e collisioni NPC (21/10/2026)

Partita naturale con Charmander completata fino a Dalia e ripresa dal titolo: 7,9 minuti di prova automatizzata, due medaglie, nessuna risorsa o progresso iniettato. Preparazione reale tramite Centro, habitat selvatici e negozio. Esito e limiti in [resoconto](playtests/2026-10-21-second-medal.md). Gli altri starter e la campagna successiva restano da verificare.

14 collisioni NPC aggiunte nei TMJ; verifica geometrica su tutte le mappe, con cancelli chiusi/aperti, conserva le celle raggiungibili e l'approccio alle interazioni. 522 test dominio/persistenza passati; validatore, TypeScript e build produzione riusciti. Passate tutte le 14 prove browser di movimento e interazione (49,5 secondi). Pubblicazione della nuova versione ancora da confermare.

La suite completa [Verify 39604036113](https://github.com/Jacoporusso/veloria/actions/runs/39604036113) della versione 0.3.109 è SUCCESS, senza job falliti.

## Pubblicazione 0.3.109 confermata — 21/10/2026

Commit 6b57e82 su main. [Deploy 39604035772](https://github.com/Jacoporusso/veloria/actions/runs/39604035772) SUCCESS: test, validatore e build riusciti su Linux. Sito pubblico HTTPS 200 e cache `veloria-shell-v130` verificati dopo la pubblicazione. [Verify 39604036113](https://github.com/Jacoporusso/veloria/actions/runs/39604036113) in esecuzione al controllo finale; un secondo evento push dello stesso commit ha generato il run 39604036498 ancora in attesa. Nessun esito verde complessivo dichiarato per la nuova versione prima della conclusione della suite.

## 0.3.109 — Crescita ufficiale verificata localmente (21/10/2026)

520 test dominio/persistenza e106 Python passati, TypeScript, validazione fonti/schema e build produzione riusciti. Tutte79 specie assegnate ai quattro tassi ufficiali con100 soglie ciascuno; progressionv2, rulesetv12, cachev130. Passate19 evoluzioni browser; Piloswine aggiunge il caso a crescita lenta, poi Piloswine e Nilo ripassati dopo la chiusura del contratto2. Tutte quattro le categorie coperte dalla presentazione di evoluzione e persistenza.

Due nuove partite naturali Charmander fino a Mira/Radicelmo con ripresa: baseline0.3.108 in7,2min e curve ufficiali in4,7min. Nessun seed, squadra, risorsa, livello, XP o flag iniettato;0 errori JS. Resoconti completi e limiti in `playtests/2026-10-21-official-growth.md`. Ultima build compilata: E2E06 cattura/tre medaglie senza rete passato in5,2min (5,4min con build), progressi salvati. Non certifica altri starter, campagna completa o telefoni fisici.

[Verify39597338393](https://github.com/Jacoporusso/veloria/actions/runs/39597338393) del codice0.3.107 è SUCCESS su tutti i job, prima suite completa verde dopo la stabilizzazione. La successiva39599123971 del codice0.3.108 ha registrato ECONNRESET in route.fetch del test Nilo prima della partita; aggiunto maxRetries2 per i soli reset di trasporto del fetch locale, senza retry degli asserti o cambi al gioco. Nuova pubblicazione/CI da confermare.

## Pubblicazione 0.3.108 confermata — 21/10/2026

Commit6796375 su main. [Deploy39599123864](https://github.com/Jacoporusso/veloria/actions/runs/39599123864) SUCCESS: test, validatore e build riusciti su Linux. Sito HTTPS200, cache `veloria-shell-v129` e trainer Ruben nel TMJ pubblico verificati dopo il deploy. [Verify39599123971](https://github.com/Jacoporusso/veloria/actions/runs/39599123971) in attesa al controllo del deploy, dietro la suite precedente. Nessuna attestazione di CI completa verde prima del suo esito.

## 0.3.108 — Allenamenti costieri e montani verificati (21/10/2026)

Passati513 test dominio/persistenza, TypeScript e validatore (48 mappe,53 missioni,31 allenatori,79 specie,320 asset). Quattro prove browser in1,9min: rifiuto, lotta touch, premio unico, reload e uscita percorribile per Noemi/Bruno/Ruben/Alma. Quattro test geometrici controllano entrambi gli spawn, approccio e aggiramento dei personaggi senza habitat o uscite intermedie. Noemi verificata anche senza rete sulla build produzione: dati dei quattro nuovi NPC, lotta, premio persistente, reload e ritorno al Delta (11,9s;25,3s con build).

Budget XP aggiornato nel resoconto21/10: miglioramento misurato, bilanciamento naturale ancora aperto. Nessuna condivisione XP, moltiplicatore o mossa sostitutiva introdotti. Cachev129; deploy da confermare. La CI39597338393 del codice0.3.107 è ancora in esecuzione, senza job falliti all’ultimo controllo. I soli commit che aggiornano esclusivamente questa ricevuta CI_STATUS non avviano più deploy/verifiche duplicate; modifiche al gioco, dati, test o workflow continuano ad avviarli.

## Pubblicazione 0.3.107 confermata — 21/10/2026

Commit068711e su main. [Deploy39597092439](https://github.com/Jacoporusso/veloria/actions/runs/39597092439) SUCCESS: test, validazione e build riusciti su Linux. Sito HTTPS200, cache `veloria-shell-v128` e artwork Pidgeot200 verificati dopo il deploy. [Verify39597092448](https://github.com/Jacoporusso/veloria/actions/runs/39597092448) in attesa al controllo finale; suite completa non ancora attestata verde.

## 0.3.107 — Sei evoluzioni verificate localmente (21/10/2026)

Catalogo79 specie e78 mosse,320 asset registrati. Passati509 test dominio/persistenza,103 Python, TypeScript, validazione delle fonti/import e build produzione. Sei prove browser verificano Pidgeot, Gloom, Poliwhirl, Weepinbell, Electrode e Ariados: soglia ufficiale, cerimonia, artwork nuovo e identità/HP/PP dopo reload IndexedDB. Il test produzione offline decodifica tutti15 artwork evolution alla prima richiesta senza rete (2,2s;15,3s inclusa build). Le tabelle incontri non cambiano: i precursori erano già disponibili. Cachev128; pubblicazione da confermare.

La CI39594789385 della versione precedente ha segnalato timeout E2E04 al ritorno finale dopo sei catture, e monorotaia alla schermata iniziale del reload dopo quattro stazioni. Budget CI mirati estesi mantenendo ogni verifica e i gate per passo; E2E04 completo ripassato localmente in2,5min e monorotaia in12,5s. Suite Linux completa ancora da attestare, nessun esito verde complessivo dichiarato.

## Pubblicazione 0.3.106 confermata — 21/10/2026

Commit d22f27b su main. [Deploy39594789374](https://github.com/Jacoporusso/veloria/actions/runs/39594789374) SUCCESS: test, validatore e build riusciti su Linux. Sito pubblico HTTPS200 e cache `veloria-shell-v127` confermati dopo il deploy. [Verify39594789385](https://github.com/Jacoporusso/veloria/actions/runs/39594789385) in esecuzione al controllo finale; suite completa non ancora attestata verde.

## 0.3.106 — Stabilizzazione verificata localmente (21/10/2026)

Passati497 test dominio/persistenza, TypeScript e build produzione. E2E06 della build compilata passato in5,2min: cattura e tre medaglie senza rete, premi e progressi persistenti. Passate4 prove browser in6,2min: Pidgey con consumo PP/HP/XP e reload, Petalora/Nila con premio unico, Radicelmo con rapporto e persistenza, montagna con tre letture e tutti i ritorni a piedi. Geometria autorevole condivisa con il renderer, input touch reale; nessun debug globale nella prova offline. Cachev127; deploy e nuova CI da confermare.

Verify39579019618 è terminata FAILURE: due test usavano ancora coordinate dei vecchi comandi della lotta; tre percorsi lunghi hanno esaurito il budget mentre le tracce mostravano avanzamento. Aggiornati i bersagli touch e i soli budget complessivi necessari, mantenendo gate per passo e verifiche di esito. Il caricamento della lotta espone aria-busy fino ai controlli pronti. Nessuna attestazione di suite Linux interamente verde prima del nuovo run.

## Pubblicazione 0.3.105 confermata — 21/10/2026

Commit4141abb su main. [Deploy39579019669](https://github.com/Jacoporusso/veloria/actions/runs/39579019669) SUCCESS: test, validatore e build riusciti su Linux. HTTPS200, cachev126 e bundle pubblico con nuove carte/tab verificati. [Verify39579019618](https://github.com/Jacoporusso/veloria/actions/runs/39579019618) ancora in corso al controllo finale; suite completa non attestata verde.

## 0.3.105 — layout lotta verificato localmente (21/10/2026)

Nuove carte e navigazione dal mockup approvato. TypeScript, build produzione, validatore e497 test dominio/persistenza passati. Passate37 prove browser di lotta/presentazione/catture/pietre; ulteriori9 verifiche mirate includono landscape568×320 e tutti78 dettagli del catalogo. Altre2 prove verificano info a zeroPP, fuga annullata senza turno, Uso dai dettagli con un solo consumoPP e navigazione disabilitata durante l’azione. Molte prove della seconda selezione sono ripetizioni mirate dopo le correzioni, non48 casi distinti. Il test delle schede esclude qualsiasi previsione e richiede il danno stimato nei soli dettagli. Nessuna modifica alle regole o ai salvataggi.

Baseline Verify39569766749 FAILURE: tre lunghi percorsi MVP terminati per budget complessivo (catture/box, R04/Petalora, Radicelmo); non attestata verde. La nuova presentazione non risolve né nasconde questi gate. Cachev126. Pubblicazione/nuovaCI da confermare.

## Pubblicazione 0.3.104 confermata — 21/10/2026

Commit5dc371f su main. [Deploy39569766681](https://github.com/Jacoporusso/veloria/actions/runs/39569766681) SUCCESS: test, validatore e build riusciti su Linux. HTTPS200 e cachev125 confermati. [Verify39569766749](https://github.com/Jacoporusso/veloria/actions/runs/39569766749) ancora in corso al controllo finale. Localmente492 test dominio/persistenza passati, oltre alle prove browser descritte sotto.

## 0.3.104 — Bosco e regressioni locali (21/10/2026)

Riprodotta la perdita della lettura se mancava q_research_sample_received: il sensore mostrava successo ma il requisito della missione ignorava l’evento. La lettura ora è indipendente da Elia/Ada; ricompensa solo al rapporto e passaggio ancora subordinato a q_ada_helped. Diario adattato senza assegnare il briefing saltato. I vecchi salvataggi senza flag lettura si recuperano rileggendo il sensore; non esiste una precedente ricevuta da ricostruire automaticamente.

Passati2 browser missione (sensore→reload→Ada→uscita/ritorno senza doppio premio; Ada→sensore→Ada),18 unit mirati. Stabilizzazione:9 browser catture/pietre/mosse,15 evoluzioni+Petalora,1 Borgofonte e1 catture fino al box (2,6min). Atlante passato nella riproduzione locale. Verify39554346058 FAILURE: aspettative grafiche/cerimonie superate, readiness UI cattura, fixture pietra sopra l’oggetto e budget CI esauriti con avanzamento confermato dalle tracce. Correzioni dei soli test per queste cause; nessun asserto di esito rimosso. Cachev125. Nuovo deploy/CI da confermare.

## Pubblicazione 0.3.103 confermata — 21/10/2026

Commit97aa60c su main. [Deploy39554345901](https://github.com/Jacoporusso/veloria/actions/runs/39554345901) SUCCESS: dominio/persistenza, validatore e build riusciti su Linux. HTTPS200, cachev124 e nuovi artwork Sentiero dell’Alba/Ferraluce200 verificati. [Verify39554346058](https://github.com/Jacoporusso/veloria/actions/runs/39554346058) in corso al controllo finale; suite browser Linux completa non ancora attestata verde.

## 0.3.103 — verifica locale mappe illustrate (21/10/2026)

Quattordici nuovi fondali,308 asset registrati, cachev124. Passati489 test dominio/persistenza e103 Python, TypeScript, validatore contenuti/provenienza e build produzione. Due prove browser inventario coprono tutte14 mappe in390×844 e844×390 e identità NPC/uscite. Percorso touch al Bosco con reload e vittoria Mira con medaglia persistente passati (1,5min). Tutti14 nuovi fondali decodificati alla prima richiesta offline senza visitarne le mappe (2,2s;15,6s inclusa build). Confronto geometria normalizzata14/14 identico.

CI: shard capitoli da6 a12 dopo timeout misurato; E2E13 ha240s in CI per completare la ricarica finale già raggiunta nel run precedente. Nessun asserto rimosso. Pubblicazione e nuovaCI da confermare.

## Pubblicazione 0.3.102 confermata — 21/10/2026

Commit d46aeb3 su main. Deploy39550975449 SUCCESS, HTTPS200 e cachev123 confermati. Verify39550975282 FAILURE: timeout cumulativo shard capitoli4 dopo23 test passati e timeout Borgofonte alla ricarica finale. Nessuna attestazione di suite Linux interamente verde.

## 0.3.102 — animazioni verificate (20/10/2026)

29 prove browser locali passate:25 lotta/pietre (incluse6 animazioni reali elettrico/immunità/Ruggito in portrait e landscape, resize/skip senza nuovi PP o turni),4 cerimonie a movimento completo/ridotto con verifica del movimento CSS tra fotogrammi, reveal automatico e salto senza doppia chiusura.464 test dominio e25 persistenza passati; TypeScript, validatore e build produzione riusciti. Modulo vettoriale BattleEffects separato dalle regole; cattura con traiettoria arcuata e presentazione dopo confine di salvataggio. Cachev123. Deploy e nuova CI da registrare.

## Pubblicazione 0.3.101 confermata —20/10/2026

Commit9676c5d su main. [Deploy39490164790](https://github.com/Jacoporusso/veloria/actions/runs/39490164790) SUCCESS: test dominio/persistenza, validatore e build Pages riusciti anche su Linux. HTTPS conferma pagina200, cachev122, nuova Borgofonte e artwork Flareon200. [Verify39490164885](https://github.com/Jacoporusso/veloria/actions/runs/39490164885) ancora in esecuzione al controllo finale: suite browser completa non ancora attestata verde.

## 0.3.101 — verifiche locali (20/10/2026)

Mosse strategiche, cerimonie, pietre e Borgofonte illustrata. Contenuti:48 mappe,49 missioni,27 allenatori,12 botteghe,73 specie,280 asset registrati. Cache prevista `veloria-shell-v122`.

Verifiche locali:464 test dominio,25 persistenza,103 Python; TypeScript, validatore contenuti/fonti/artwork e build produzione riusciti. Browser: dettagli mosse su320×568 e844×390 con tutti gli effetti/pagine leggibili; Indietro mobile senza turno; evoluzione Caterpie→Metapod con vecchio sprite fino alla rivelazione; quattro prove isolate pietre e salvataggio fallito; raccolta unica e bottega reale, annullamento/evoluzione Eevee→Flareon e reload della ricevuta; avvio touch, porte reciproche e letto Borgofonte; catture fino al box; funivia Brina. Nuovi artwork e Borgofonte decodificati offline alla prima richiesta. E2E06 completo fino a tre medaglie senza rete passato5,5min (5,7min inclusa build).

La precedente Verify39483711095 è FAILURE: cattura selezionata con coordinate superate nei testMVP/offline; funivia trattata dal test come dialogo normale invece di scelta; capitoli2 ancora in timeout cumulativo. Corrette le interazioni dei test senza indebolire gli esiti; capitoli ripartiti su6runner per ridurre il carico misurato. Nessuna attestazione di CI Linux completamente verde per questa versione prima dell'esito del nuovo run. Passati anche avvio con nome/starter e percorso nord37,8s, uso pietre con reload8,6s e sequenza evoluzione pendente → finale Lega4,3s. Le transizioni espongono aria-busy; gli helper attendono che la dissolvenza termini prima di inviare il passo successivo. Pubblicazione confermata nella sezione precedente.

## Pubblicazione Indietro0.3.100 —20/10/2026

Commit `c3d650d7e409a993e5c1f6c27bfcc54b79f1e7e8`, deploy Pages `39483711087` SUCCESS. HTTPS conferma cachev121. Verify `39483711095` in esecuzione; non attestato verde. Design mosse/cattura/evoluzione nel documento29; pietre proposte, non implementate. Borgofonte/transizioni ancora in lavorazione separata.

## Indietro nella lotta mobile0.3.100 —20/10/2026

Pulsante con hit area124×44 al posto del testo interattivo10px. Footer riservato senza sovrapporre gli ultimi comandi; altezza dei pannelli Borsa/Squadra/Cattura adattata in entrambi gli orientamenti. Due test browser passati2,6s: tocco sul margine del target e stato battaglia identico dopo ritorno. TypeScript passato. Borgofonte/transizioni in lavorazione separata, non inclusi in questo commit. Pubblicazione da confermare.

## Pubblicazione correzione PC0.3.99 —20/10/2026

Commit `3f3fcf4f91f3b48faa2fc2ddf0197594ec589c8a` su main. Deploy Pages `39476491396` SUCCESS; HTTPS conferma registro0.3.99 e cachev120. Verifica completa `39476491440` in esecuzione, non ancora attestata verde. Quattro scenari desktop e regressione touch passati localmente. Aggiornamento documentale senza duplicare i workflow.

## Interazione iniziale PC 0.3.99 — verifiche locali 20/10/2026

- Riproduzione: la sola lettura `isDown` nel ciclo frame perde una pressione breve di ArrowUp; il personaggio resta rivolto in basso e non trova Elia davanti a sé. E apriva il dialogo nei casi in cui il frame aveva campionato il tasto; Spazio risultava intermittente. Invio non era collegato. Il suggerimento «PARLA CON A» era ambiguo su PC, dove A muove a sinistra.
- Primo movimento/orientamento ora gestito su keydown, prosecuzione mentre il tasto resta premuto nel ciclo frame. E/Spazio/Invio aprono e avanzano il dialogo; suggerimenti desktop aggiornati. La scelta starter intercetta localmente Invio/Spazio, evitando che Phaser sopprima il click nativo.
- Quattro prove desktop passate20,5s: E, Spazio, Invio e clic, scelta effettiva di Charmander con tastiera/mouse, missione ricevuta e dialogo con Ada nel bosco. Regressione touch E2E01 passata13,9s (14,8 complessivi). 451 test dominio, 25 persistenza, validatore e build passati. Nessuna modifica al core XP inclusa in questa correzione.
- Verify0.3.98 `39427311160` concluso FAILURE: capitoli2 supera il limite cumulativo dopo32casi riusciti; capitoli4 supera60s nel caso atlante. Gli altri11job riusciti, inclusi MVP3 corretto, Lega e offline. Questi timeout restano da risolvere con evidenza specifica; non vengono dichiarati risolti dalla correzione iniziale. Pubblicazione0.3.99 da confermare.

## Pubblicazione allenamenti 0.3.98 — 20/10/2026

Commit `92773b9` su main. Deploy Pages `39427311402` SUCCESS; HTTPS conferma registro0.3.98, cachev119 e NPC Celia nella Tiled pubblica R11. Verify `39427311160` in attesa della run0.3.96, lasciata terminare; Verify0.3.97 `39426075026` cancellato dalla coda a favore dell'ultima revisione, non descritto come fallimento del gioco. Al controllo13:05UTC la precedente run ha12job terminati (11successi e MVP3 con fixture corretta in0.3.97), capitoli2 ancora in esecuzione. Nuova suite Linux completa non ancora attestata. Aggiornamento documentale senza duplicare i workflow.

## Allenamenti intermedi 0.3.98 — verifiche locali 20/10/2026

- Quattro allenatori e quattro quest aggiunti, collegati a R06/R07/R08/R11 con NPC, collisioni, dialoghi, scelta facoltativa e premio unico. Validatore: 48 mappe, 48 quest, 27 allenatori, 11 negozi, 270 asset. 451 test dominio, 25 persistenza e build riusciti.
- Quattro casi browser passati in 1,5 minuti: rifiuto, vera lotta touch, premio, ricaricamento senza duplicazione e cammino fino all'uscita evitando gli habitat. Fixture Raticate80, non partita naturale. Celia portrait esaminata visivamente.
- Offline passato9,3s (22,6 inclusa build): Tiled aggiornate dei quattro percorsi dalla cache, prima visita a Celia, vera lotta finale della prova, premio persistente e uscita ad Acquariva senza richieste fallite. Non si dichiarano quattro lotte offline.
- Audit crescita aggiornato; prima di Selene125→108 KO selvatici equivalenti in un budget ottimistico. Il deficit resta elevato, distribuzione e bilanciamento naturale richiedono altro lavoro. Pubblicazione da confermare.

## Pubblicazione rifornimenti 0.3.97 — 20/10/2026

Commit `5ff5dc7e1feb962f94c7c9915d97eaf50eaa12f9` pubblicato. Deploy Pages `39426075059` SUCCESS; HTTPS conferma registro0.3.97 e cachev118. Nuovo Verify `39426075026` in attesa della precedente suite, senza annullarla. Verify0.3.96 ha già concluso con successo Lega, entrambi i job offline, entrambi i job controlli e tre shard MVP; MVP3 contiene la fixture corretta da questa revisione. Tre shard capitoli ancora in esecuzione al controllo. Non si dichiara una suite completa verde. Aggiornamento documentale senza duplicare workflow.

## Rifornimenti 0.3.97 — verifiche locali 20/10/2026

- Validatore contenuti, 451 test dominio, 25 persistenza e build riusciti. Cinque E2E dei mercati passati in 22,9 secondi, con acquisti, addebito corretto e reload. Il primo tentativo di fixture aveva conservato uno spawn di un'altra mappa e non avviava la scena; corretta la fixture con spawn registrato nella mappa corrente.
- Audit budget XP generato con funzioni del motore e dati reali, ipotesi ottimistiche esplicite. Non è una partita naturale né una prova che il bilanciamento sia completo.
- Verify0.3.96 `39424370226`: Lega, risorse offline, controlli e più shard già riusciti; MVP3 fallisce il vecchio scenario v1 perché un backup v2 più recente prevale sul main v1 artificiale. La policy di recupero è corretta: la fixture ora rappresenta un'installazione con il solo salvataggio v1, senza indebolire le asserzioni di migrazione. Prova isolata passata in 13,1 secondi, 14,2 complessivi. Pubblicazione da confermare.

## Pubblicazione Lega 0.3.96 — 20/10/2026

Commit `c0bb039edb5b6d8374d45b9bb6f69e26362efefc` su main. Deploy Pages `39424370152` concluso SUCCESS, inclusi test, validatore e build con base `/veloria/`. HTTPS conferma registro `veloria-content-0.3.96`, cache `veloria-shell-v117`, chunk della cerimonia e Tiled della sala del Campione 32×24. Verify `39424370226` ancora in esecuzione: non si dichiara verde la suite Linux completa di questa revisione. Aggiornamento documentale senza duplicare i workflow.

## Lega e finale 0.3.96 — verifiche locali 20/10/2026

- Build TypeScript/Vite e validatore contenuti passati: 48 mappe, 44 quest, 23 allenatori, 11 negozi, 270 asset; 69 specie e 78 mosse. 451 test dominio, 25 persistenza e 103 Python riusciti.
- Sette casi browser passati in 4,3 minuti: cinque incontri reali, otto medaglie obbligatorie, interruzione/ripetizione senza duplicare premi, cerimonia dopo reload, epilogo, sconfitta senza cure automatiche, battaglia pendente interrotta, entrambi gli archivi indisponibili, fallback locale più recente, recupero checksum e atlante. Fixture potenziate: non attestano il bilanciamento naturale. Cerimonia portrait esaminata visivamente.
- Primo test offline: risorse caricate correttamente, singolo Dewgong di prova sconfitto dal Campione. Il test successivo usa una squadra completa; nessun indebolimento degli avversari. Seconda prova passata: 20,7 secondi, 34,2 inclusa build. Prima visita offline a tutte le cinque sale, vera battaglia finale, cerimonia, epilogo, premio unico persistente e ritorno. Le quattro vittorie precedenti sono un checkpoint preparato, non una dichiarazione di cinque lotte giocate offline. Pubblicazione da confermare.
- Verify precedente 0.3.95 `39419114192` concluso FAILURE: shard capitoli 2 supera 24 minuti dopo 20 casi riusciti; shard 4 incontra l'aspettativa obsoleta dell'atlante «In preparazione». Aspettativa aggiornata a «Da esplorare», mantenendo controlli di visita e movimento. Prove DPR separate dai capitoli e Lega isolata: 11 job browser, 149 casi conservati, più due job offline. Nuova verifica Linux ancora necessaria; ultima suite completa verde 0.3.94 `39416755246`.

## Pubblicazione Cammino e piazzale 0.3.95 — 20/10/2026

Commit `f4e841efecce1af6a87a30e2cfef7158ef575412` pubblicato su main. Deploy Pages `39419114200` riuscito: test, validatore, build con base `/veloria/` e deploy completati. HTTPS conferma contenuti0.3.95, cachev116 e Tiled R16/piazzale entrambe40×30. Verify `39419114192` ancora in esecuzione: la suite Linux completamente verde attestata è quella precedente0.3.94, non ancora questa revisione. Aggiornamento documentale senza duplicare i workflow.

## Cammino e piazzale della Lega 0.3.95 — 20/10/2026

- 43 mappe, 42 quest, 18 allenatori, 11 negozi, 260 asset; 69 specie e 76 mosse. Build e validatore passati. 446 test dominio + 16 persistenza, 88 Python riusciti.
- Percorso browser: blocco prima del rapporto del Santuario, R16 senza incontri obbligatori, rifiuto di Maia, arrivo al piazzale, cure HP/PP, acquisti, accoglienza, portale informativo, ritorno completo e reload: passato in 1 minuto. Due lotte touch con Maia e Tobia, premi unici e dialoghi dopo reload: passate in 30,6 e 23,9 secondi. Checkpoint freschi e potenziati con contromosse legali; non attestano bilanciamento naturale. Il precedente Quagsire ferito perdeva contro Hypno: nessun indebolimento del trainer per far passare il test.
- Primo accesso offline a due ambienti e due Tiled, cammino completo, servizi HP/PP, acquisto e ritorno a Concordia con reload: passato in 49 secondi, 1 minuto inclusa build. Cache v116. R16 e piazzale esaminati visivamente in landscape. Nessuna modifica runtime durante le prove.
- Core puro delle sfide sequenziali verificato con 9 test; ancora privo di registry e integrazione nelle scene. Sale della Lega, cinque incontri consecutivi, finale ed epilogo non vengono dichiarati giocabili.
- Verify della 0.3.94 `39416755246` concluso SUCCESS: tutti i 10 job riusciti (8 browser, percorso offline e risorse offline). La separazione MVP/capitoli e offline lungo/risorse ha completato l’intera suite Linux, senza rimuovere prove o asserzioni.
- Pubblicazione 0.3.95 ancora da confermare; nuova suite Linux da verificare sui nuovi contenuti.

## Pubblicazione Santuario0.3.94 —20/10/2026

Commit gioco `45c29882a3c8a2a3705a81479f9691050571378b` pubblicato; deploy Pages `39416687436` riuscito. HTTPS conferma registro0.3.94, cachev115 e Tiled D06 32×24. Commit successivo `ddf59b72df11c5e4f9ad35cd256b1455802339e3` include la selezione delle suite Playwright già verificata localmente: il file config non era incluso nel primo staging. Verify intermedio39416687513 annullato perché superato; nuova verifica39416755246 e deploy39416755376 ancora in attesa/all’avvio al momento di questo aggiornamento. Non si attesta una suite Linux completa verde. Aggiornamento soltanto documentale, senza nuovo workflow duplicato.

## Santuario locale0.3.94 —20/10/2026

-41mappe,39quest,16allenatori,10negozi,256asset;69specie/71mosse.429dominio+16persistenza,88Python, validatore e build riusciti.
- Browser completo Santuario40,5s (39,7s scenario): accesso bloccato prima della medaglia, due letture e reload, riesame/rinvio senza consenso, conferma, regolazione parziale persistente, verifica errata/reset, soluzione, ricevitore obbligatorio, rapporto/premio unico e ritorno a Concordia. Regressione percorso D05–R15–Concordia e ritorno passata1,2m. Portrait e landscape esaminati.
- Primo accesso offline al Santuario e alla Tiled, regolazione/verifica/ricevitore/rapporto con premio unico/reload/ritorno riuscito17,3s (30,8s con build). Cachev115. Nessuna modifica runtime durante le prove.
- Primo tentativo browser non orientava il personaggio verso la console dopo reload: fixture corretta. Secondo tentativo ricaricava prima della conferma IndexedDB della lettura orientale; aggiunta attesa del flag persistito. Terzo scenario passato. La revisione visiva ha evidenziato il precedente toast d’errore rimasto dopo verifica riuscita: ora sostituito da conferma, provata nel browser e offline.
- Verify0.3.93 `39390958641`:7shard riusciti, shard5 supera24min dopo il ritorno montano (ora passato6,1m) e13prove successive tutte verdi; suite piatta per conteggio concentrava16MVP in un gruppo. Configurazione ora separa16MVP/125capitoli su4shard ciascuno (8runner come prima), conservando141prove. OfflineE2E06 arriva a tre medaglie persistite e menu emblemi, ma scade720s durante scrollIntoView finale; artifact esaminato. BudgetCI900s, locale480s invariato; itinerario lungo separato dal resto offline in due job, step20min. Nuova conferma Linux necessaria, nessuna prova dichiarata verde per semplice modifica del budget.
- Pubblicazione0.3.94 ancora da confermare. R16, Lega, finale, bilanciamento naturale e catalogo completo restano aperti.

## Pubblicazione Concordia 0.3.93 — 20/10/2026

Commit `4e94056afa7879a2c294fd046f3df18df5c66741` pubblicato su main. Deploy Pages `39390958602` riuscito: test, validatore, build con base `/veloria/` e deploy completati. Verificati via HTTPS registro `veloria-content-0.3.93`, service worker `v114` e Tiled P8 `32×24`. Verify `39390958641` ancora in esecuzione; non si attesta una suite Linux completa verde. Questo aggiornamento modifica soltanto documentazione.

## Concordia locale 0.3.93 — 20/10/2026

- 40 mappe, 38 quest, 16 allenatori, 10 negozi, 254 asset; 69 specie e71mosse, otto medaglie. 425 dominio +16 persistenza e88 Python passati; validatore globale e build riusciti.
- Cinque prove browser D05/R15/Concordia/P8 riuscite in3,5m: percorso e ritorno, decisione di Elia, acquisti, puzzle con due flussi e reload, vera lotta touch con Aurel, banner e premio unico, monorotaia e orientamenti. Ulteriore prova Nilo rifiuto/sfida/ricompensa unica riuscita in33,9s. Squadre potenziate per integrazione: il bilanciamento naturale resta aperto. Vista landscape della convergenza esaminata.
- Primo accesso offline: tre nuovi ambienti, sei artwork Drago e tre Tiled; puzzle con reload parziale, ritorno a piedi dalla palestra alla stazione e monorotaia Concordia–Vetracielo–Concordia con risorse invariate. Passato in25,2s (37,5s con build). Cachev114. Nessun runtime modificato durante le prove.
- Rulesetv10: tentennamento locale al turno. Corretto ordine sonno/gelo, tentennamento, confusione, paralisi e PP, con regressioni RNG e contatori. Medicine importate da fonti locali; prezzi da CSV corrente, non dichiarati storici HGSS.
- Verify0.3.92 `39385729650`: offline e cinque shard riusciti, shard4 fallito. Il riferimento Magneton ora passa nello shard5. Artifact shard4 esaminato: itinerario montano termina300s durante il ritorno in Passobrina, da x26 a25,y15 dopo aver già completato letture, rapporto e Biancavetta. Budget CI di quella prova480s, locale300s invariato. Il job cumulativo interrompe poi le prove MVP a24min; suite crescente distribuita su8shard anziché6 senza eliminare prove o asserzioni. Le correzioni richiedono nuova verifica Linux.
- Pubblicazione0.3.93 ancora da confermare. Santuario, R16, Lega e finale non implementati.

## Pubblicazione Cristallo 0.3.92 — 20/10/2026

Commit a542a5ced137bf5a4f2bf62f7a767c89c69f3bfc pubblicato su main. Deploy Pages39385729788 riuscito: test, validatore, build con base/veloria/ e deploy completati. Via HTTPS confermati registro contenuti0.3.92, cachev113 e Tiled D05 40×30. Verify39385729650 resta in attesa dietro la revisione precedente al momento di questo aggiornamento; nessuna suite Linux completamente verde viene attestata. Questo aggiornamento modifica soltanto documentazione e non richiede una nuova esecuzione duplicata dei workflow.

## Cristallo locale 0.3.92 — 20/10/2026

- 37 mappe, 34 quest, 14 allenatori, 9 negozi, 236 asset, 63 specie e64mosse. Build riuscita. 392 dominio +16 persistenza, 74 Python e validatore globale passati.
- Sette browser in1,7m: console con prerequisiti, errore/reset/reload e portrait/landscape; capitolo completo Brina→R14→due letture→console→ricevitore→rapporto/premio unico→Biancavetta; cinque regressioni Squadra/Pokédex. `.tmp/crystal-browser-v3.log`.
- Primo accesso offline a due Tiled, tre ambienti e cinque artwork; console, salvataggio e ritorno dalla grotta riusciti in15,2s,27,5s con build. `.tmp/crystal-offline-v1.log`. Scenario e menu landscape esaminati visivamente.
- Test iniziale del gate corretto per usare `failureMessage`, che è il campo effettivo dei trigger. La fixture del percorso ora rientra dal bordo dopo il tentativo bloccato prima di attraversare di nuovo; il primo test era rimasto sullo stesso tile dell’uscita e non generava un nuovo ingresso. Nessun aggiramento delle collisioni durante le prove.
- Verify0.3.91 `39382295627` terminato: sei job riusciti (cinque shard e offline); shard5 fallisce solo nel riferimento evolutivo Magneton. Il filtro target>251 aveva cancellato le informazioni ufficiali pur lasciando il testo HGSS. Corretto l’importer per riferimento informativo fino aGenIV, condizioni complete e runtimeGenI–II distinto. Test browser originale invariato ora passa; introdotti test Python per GenIV, esclusioneGenV+ e condizioni sconosciute. Il precedente problema del budget monorotaia risulta superato in Linux.
- Pubblicazione0.3.92 e nuova verifica Linux ancora da confermare. Il bilanciamento naturale e i capitoli finali restano aperti.

## Pubblicazione montagna 0.3.91 — 20/10/2026

Commit cf99e0583cc4bbfb466799d26b973544d0fec387 pubblicato su main. Deploy Pages 39382295591 concluso con successo: test, validatore, build con base /veloria/ e deploy riusciti. Verificati via HTTPS il registro con veloria-content-0.3.91, service worker v112 e Tiled P7 32×24. Verify 39382295627 ancora in esecuzione al momento di questo aggiornamento: non viene attestata una suite Linux interamente verde. Il test finale locale conta 378 prove dominio e 16 persistenza, tutte riuscite.

## Capitolo montano locale 0.3.91 — 20/10/2026

- Integrati cinque ambienti illustrati, Acquariva v2 e percorso fino a P7 con ricerca climatica, Nives, Medaglia Brina e funivia. 220 asset, 35 mappe, 33 quest, 14 allenatori, 9 negozi; catalogo 58 specie/64 mosse. Sei specie montane da fonti HGSS, Delibird differito senza inventare mosse.
- 377 dominio +16 persistenza passati; aggiunta successivamente prova contro il bypass asciutto delle piste, anch’essa passata. 64 test Python passati, inclusi validatori dei trasporti locali e ambito delle evoluzioni.
- Cinque prove browser P7/funivia/regressioni Portolume passate in 2m; percorso completo Acquariva–letture–rapporto–Biancavetta e ritorni passato in 2,2m. P7 comprende ordine libero, reload, console, cancello, vera lotta touch, banner, emblema, monete e medaglia unici, portrait/landscape. Squadra potenziata usata per isolare l’integrazione: bilanciamento naturale ancora aperto.
- Primo accesso offline ai nuovi ambienti, Tiled e artwork, funivia e reload passato in 3,8s; 15,1s inclusa build. Il primo tentativo aveva una fixture save non valida con proprietà `facing` estranea allo schema e ripartiva da Borgofonte: corretta la fixture e aggiunta verifica immediata della mappa caricata, senza modificare il runtime.
- CI della 0.3.90: deploy 39360342181 riuscito; Verify 39360342220 fallisce solo nello shard3. Artifact esaminato: tutti e quattro i viaggi monorotaia e le asserzioni finali dopo reload completati; budget totale90s scaduto durante pulizia delle fixture. Budget CI di quella singola prova portato a120s; locale90s invariato. Altri shard, compresi apprendimento, Centrale e Ferraluce, e offline riusciti. La correzione attende nuova verifica Linux.
- 0.3.91 pronta localmente; push/deploy/CI da verificare. Ultima versione pubblica confermata0.3.90. R14 e capitoli finali non implementati.

## Battaglia e fondazione montagna 0.3.90 — 20/10/2026

- Riprodotto e diagnosticato il fallimento di apprendimento: i trace locali registrano `handleScaleResize → render` che azzera la selezione, anche per notifiche senza cambio effettivo del viewport. La scena ora ignora resize identici e conserva la selezione quando cambia orientamento. Le fixture battaglia usano lo stesso `observeGameSize` del gioco; le prove attendono l'avanzamento automatico dei messaggi, evitando conferme inviate mentre si apre una scelta.
- Venti prove browser di battaglia/presentazione/ghiaccio passate in 1 minuto, inclusa scelta delle mosse con doppia rotazione, sostituzione e rifiuto, dettaglio mosse, messaggi automatici, cambi forzati e tre dimensioni schermo. Dopo la rifinitura del salvataggio sul ghiaccio, quattro prove dedicate passate in 21,9s: tocco singolo e rotazione, muro e cambio direzione, porta e rilascio del vincolo, reload durante lo scivolo. Il salvataggio conserva soltanto fermate valide, evitando svolte artificiali tramite reload a metà pista.
- Fondazione dati: layer Tiled opzionale `movement_surfaces`, ghiaccio separato da trigger e collisioni, validazione di rettangoli/rotazione/offset, raggiungibilità con scivolamento forzato e distinzione tra attraversamento e fermata. Interruzioni sul ghiaccio limitate a un tile per mantenere coerenti runtime e modello di navigazione. Nessuna mappa pubblica utilizza ancora il ghiaccio.
- Con Luna preparati documento 22 e layout P7 preliminare 12×12; la soluzione JSON raggiunge tre sigilli e ogni stato fermabile raggiungibile permette il ritorno all'uscita. È una bozza geometrica, senza illustrazione, quest, boss o collegamento pubblico. R12, Passobrina, R13, Biancavetta, P7 e funivia restano da implementare integralmente.
- 357 test di dominio e 16 di persistenza passati, 56 test Python riusciti, validatore con 194 asset/30 mappe/29 quest/13 allenatori/7 negozi. Build riuscita. Prova offline del capitolo Acquariva sulla cache v111 ripetuta dopo la rifinitura del salvataggio sulle piste: passata in 24,9s (37,9s con build). Nessuna modifica al runtime o alla build durante le prove.
- Verify `39357925973` su 0.3.89 terminato: offline e shard 3/4/5/6 riusciti; shard1 fallisce nell'apprendimento sopra, shard2 esaurisce i budget Centrale/Ferraluce. Gli ultimi salvataggi nei trace avanzano regolarmente: Condotto x22→16 e Ferraluce x19→14. Entrambi hanno già completato gli obiettivi principali e stanno tornando. Budget totali soltanto CI adeguati a 300s/360s, conservando asserzioni per passo, tutti i tap, reload e controlli dei premi. Non si presenta tale modifica come correzione di un blocco runtime.
- Pages 0.3.89: commit `3bdad3c`, deploy `39357925997` riuscito; versione verificata nel modulo pubblico del registro mappe, cache v110 e artwork Charizard HTTP200. Il nuovo checkpoint 0.3.90 non è ancora pubblicato.

## Evoluzioni finali 0.3.89 — verifica locale 20/10/2026

- Catalogo portato a 52 specie e 57 mosse: Venusaur, Charizard, Blastoise e Ampharos, con fonti PokéAPI conservate localmente, checksum e artwork WebP registrati. Evoluzioni rispettivamente ai livelli 32, 36, 36 e 30. Aggiunte Attacco d’Ala, Idropulsar, Tuonopugno e Scarica con parametri ed effetti supportati ricavati dalle fonti; le altre mosse mancanti rimangono esplicite nel rapporto di importazione.
- Ruleset v9: salendo di livello si propongono soltanto le mosse dei livelli appena raggiunti, anche in caso di evoluzione; le mosse precedenti dimenticate non vengono riproposte automaticamente. Regressioni dedicate incluse.
- 351 prove di dominio e 16 di persistenza passate, 49 controlli Python riusciti. Build e validatore riusciti: 194 asset, 30 mappe, 29 missioni, 13 allenatori e 7 negozi. Quattro evoluzioni verificate nel browser con artwork, scelta mosse e persistenza IndexedDB dopo reload, in 30,7s. Due prove dei comandi battaglia passate in 4,4s. I quattro nuovi artwork decodificano alla prima richiesta offline; E2E-06 fino a tre medaglie offline passato in 5,5m sulla stessa build congelata (5,7m con build). Cache locale v110, versione non ancora pubblicata.
- Verify pubblico `39354318314` su `5200b5f` concluso con fallimenti negli shard 1/2/4/5 e offline; shard 3/6 riusciti. Individuati: aspettativa XP obsoleta (50 anziché 21 per Pidgey livello 3), pressione breve dei comandi non osservata dalla scena, lettura transitoria al cambio mappa offline e budget esauriti negli itinerari Centrale/Ferraluce. Corrette le aspettative XP; nei due punti tastiera si tiene il tasto fino alla conferma della selezione senza ripetere l'input; al passaggio offline si attende il caricamento e si verifica lo spawn. Ridotto l'intervallo di osservazione del movimento nei percorsi lunghi senza rimuovere passi o aumentare i timeout. La verifica Linux delle correzioni resta aperta.
- Tre regressioni complete locali successive passate in 3,6m: Centrale 1,2m, Ferraluce 1,5m, incontro Pidgey con HP/PP/XP e reload 53,2s. Evidenza: `.tmp/final-forms-ci-journeys.log`. Nessuna modifica al runtime durante le prove e nessun timeout aumentato.

## Pubblicazione Acquariva 0.3.88 — 20/10/2026

- Push di `5200b5f9b64284feb8da86ac0638c38f47167402` su main riuscito. Repository confermato pubblico. Deploy GitHub Pages `39354318279` completato con successo: build e deploy riusciti, inclusi test di dominio e validatore eseguiti dal workflow.
- Sito pubblico verificato via HTTPS: bundle con `veloria-content-0.3.88`, service worker v109, Tiled Acquariva 40×30 e NPC Lina nel Tiled delle Dune. Avvio della pagina pubblica osservato nel browser fino al mondo di gioco. Il parametro di anteprima non apre Acquariva nella build pubblica: la partita segue la progressione normale.
- Verify `39354318314` sullo stesso commit terminato con fallimenti; diagnosi e correzioni locali descritte sopra. Il deploy riuscito non equivale a una suite GitHub completa verde.

- Integrati Lina nelle Dune, Teo nel Delta e Maya nelle Canne: sfide facoltative, squadre ufficiali da due Pokémon, dialoghi, banner, ricompense di 420/520/620 monete e flag persistenti. Le 24 mosse assegnate sono disponibili nei learnset HGSS ai livelli previsti. Diario aggiornato con indicazioni facoltative per allenarsi.
- Iris, Tessa, Selene e i tre nuovi allenatori hanno ingombri reali nei Tiled. Le prove ora verificano la presenza delle collisioni, senza aggiungerle artificialmente. Percorsi principali e ritorni restano raggiungibili evitando gli habitat. Corretto il riferimento grafico dichiarato di Lina; il feedback di Selene indica contromisure già disponibili.
- Validatore riuscito: 30 mappe, 29 quest, 13 allenatori, 7 negozi, 186 asset. 339 prove dominio + 16 persistenza e 49 Python passate. Sette prove touch passate in 5,8m: intero capitolo, puzzle/battaglia P6, ritorni, tre nuove sfide con rifiuto, collisione, banner, denaro e flag unici dopo reload. Screenshot del banner di Lina esaminato.
- Fermata Acquariva verificata a DPR3: arrivo, reload, interazione a sinistra, landscape e ritorno a Vetracielo senza modificare risorse, 5,8s. Primo accesso offline a tutte le nuove mappe/immagini e cascate ripetuto sulla build finale: passato in 41,7s, inclusa build 54,7s. Build e dati conservati durante ciascuna prova.
- E2E-06 della build con XP v8 passato fino a tre medaglie offline in 5,5m; insieme al primo controllo Acquariva 2 prove in 6,4m. Gli aggiornamenti successivi aggiungono solo allenatori, dialoghi e collisioni del nuovo capitolo; il codice della progressione e i capitoli attraversati da E2E-06 sono invariati. Non è una prova di battaglia P6 offline o di bilanciamento naturale. Pubblicazione e nuova CI da verificare dopo il push.

## Progressione XP e verifiche 0.3.88 — 20/10/2026

- Ruleset v8: ricompensa XP scalata con livello e bonus allenatore, con overflow, apprendimento ed evoluzioni sul valore effettivo.352 prove dominio/persistenza passate (`.tmp/xp-level-scaled-tests-v2.txt`); build riuscita. Le fixture sintetiche che assegnano una soglia esatta usano avversari livello7, senza ripristinare la vecchia ricompensa nel runtime.
- Pannello messaggi toccabile per saltare il timer, mantenendo l'avanzamento automatico. Quattro regressioni browser passate in11,6s: turno senza conferma, tocco che avanza il messaggio senza cambiare lo stato del turno, evoluzione con sprite e scelta delle mosse prima del terminale. Log `.tmp/xp-touch-battle-regressions.txt`.
- R04 passato in1,9m con comandi touch, stesso timeout240s, controllo densità e rettangolo canvas raccolti insieme. L'helper attende il ritorno automatico al menu: i vecchi tap sul pannello comandi non avanzavano i messaggi. Log `.tmp/r04-efficiency-verification-v2.log`.
- Primo accesso offline alle sei mappe/immagini e traversata di andata/ritorno delle cascate con reload passati in41,6s. E2E-06 fino a tre medaglie ancora attivo nella stessa esecuzione, sessione15534, log `.tmp/acquariva-xp-offline-verification.txt`. Nessun riavvio; build di produzione conservata durante la prova. Cache v109, nessuna pubblicazione ancora.
- Audit del ritmo e limiti nel rapporto `docs/playtests/2026-10-20-acquariva-balance.md`. Tre allenatori intermedi preparati in bozza; non ancora incontrabili. Il bilanciamento naturale di P6 resta aperto.

## Integrazione locale Acquariva 0.3.87 — 19/10/2026

- Sei mappe collegate localmente: R09, Delta, R10, Acquariva, palestra Psico e Via delle Cascate. Dialoghi, quest, servizi, monorotaia, atlante, diario, squadra di Selene e Medaglia Riflesso registrati. Cache v108; pubblicazione non ancora eseguita.
- Validatore superato: 30 mappe, 29 quest, 10 allenatori, 7 negozi e 186 asset registrati. Build, 334 prove di dominio, 16 di persistenza e 49 Python riuscite. Aggiornata la fixture del diario per la prosecuzione dopo P5; conservati nomi e proprietà degli ostacoli cittadini, aprendo soltanto le nuove caselle di accesso.
- Quattro prove touch passate in esecuzioni mirate: accesso Marea e traversata/ritorno Dune–Delta 39,7s; tre osservazioni in ordine diverso, reload, premi unici, kit, R10 e rapporto ad Acquariva 2,1m; puzzle in ordine diverso con reload, lotta di Selene, cambio dopo KO, banner/emblema, premio 1800 e medaglia persistente 1,6m; accesso Riflesso e andata/ritorno a Vetracielo via cascate 43,2s. Screenshot di osservatorio e palestra esaminati in portrait/landscape. La lotta usa Magneton e Quagsire livello55: prova di integrazione, non bilanciamento naturale. I tentativi con un solo Pokémon sono terminati regolarmente in sconfitta; il test ora gestisce il cambio di riserva e il terminale.
- Verify 39286112986 su 371f469 è terminata con errore: shard 1/3/5 riusciti; 2/4/6 e offline falliti. I trace di Centrale, Ferraluce, Vetracielo e offline mostrano scadenza del budget mentre il personaggio continuava a muoversi. Ridotte le letture IndexedDB duplicate nei soli helper di test; nessun timeout aumentato. Tre regressioni touch locali riuscite in 6,4 minuti: Centrale 1,9m, Ferraluce 2,5m, Vetracielo 2,0m.
- Unificate due preparazioni della squadra offline, mantenendo il Centro Pokémon reale, la lotta e i reload che verificano persistenza. E2E-06 sulla nuova build resta da eseguire. Shard4 scaduto nel percorso R04 durante un tap della lotta: da diagnosticare separatamente, non dimostrato risolto dalle ottimizzazioni del movimento.

## Pubblicazione 0.3.86 e Sentiero delle Canne — 19/10/2026

- Deploy GitHub Pages 39286113121 su 371f469 completato con successo; Verify 39286112986 ancora in esecuzione al controllo. Non si dichiara verde l'intera CI.
- Preparati illustrazione e dati R10, con due habitat opzionali, riferimenti per orientarsi e ricompensa laterale unica. Due prove di tabelle/raggiungibilità e persistenza del kit passate. R10 non è ancora caricato dal gioco; nessun nuovo accesso aperto verso Acquariva.

## Catalogo lacustre — checkpoint locale successivo a 0.3.86

- Importate otto specie (Slowpoke/Slowbro, Drowzee/Hypno, Natu/Xatu, Eevee/Espeon), parametri, learnset HGSS e artwork ufficiali locali. Catalogo 48 specie/51 mosse; Psicoraggio, Stordiraggio e Comete importate con effetti supportati. 378 voci learnset non implementate ancora esplicitamente registrate. Habitat nuovi non collegati al mondo.
- Evoluzioni runtime di livello 79→80 a 37, 96→97 a 26, 177→178 a 25, con artwork registrati. Le condizioni ufficiali di scambio/strumento, amicizia/orario e roccia speciale sono conservate nei riferimenti e mostrate nei due pannelli, senza trasformarle in livelli o abilitarle nel runtime. Le soglie numeriche d'amicizia della fonte non sono presentate come soglie storiche HGSS verificate.
- Validazione completa: 176 asset, 48 riferimenti evolutivi da 104 risorse API, 28 specie importate; 323 test dominio + 16 persistenza e 49 Python passati (`.tmp/lake-catalog-tests.txt`). Quattro prove browser passate in 15,5 s: artwork completi a DPR1/2/3 portrait/landscape, dettagli in Squadra e Pokédex. Build e prova primo accesso agli otto artwork offline passate in 14,4 s.
- Questo checkpoint non aggiunge mappe giocabili e non è ancora pubblicato.

## Preparazione riflessi P6 — checkpoint locale

- Sistema condiviso di orientamenti esteso con presentazione ottica e inclinazioni esplicite, validate sia in TypeScript sia in Python. Renderer con fasci attivi e specchi; nessun nuovo accesso nel mondo ancora.
- Configurazione di bozza P6 verificata in tutti i 24 ordini, con serializzazione e orientamenti ottici coerenti. Due nuove prove e tre regressioni P4 passate; build riuscita. Resta da verificare visivamente e integrare la palestra nel capitolo Acquariva.
- Al controllo, deploy 39286113121 e Verify 39286112986 su 371f469 ancora queued, come i precedenti 39285031933/39285031878. Nessuna esecuzione annullata o riavviata.

## Diagnosi CI e distribuzione suite 0.3.86 — 19/10/2026

- Letti i log reali di Verify 39225087078: shard1 36 passati e unico fallimento nella lettura prematura di `battle.ui` del test P4 (attesa già corretta e verificata localmente). Shard2 interrotto dal limite globale di 24 minuti dopo 23 prove completate e una fallita; prove restanti non concluse. Shard3 e Offline riusciti. Log sotto `.tmp/ci-39225087078-shard*.log`.
- La traccia della monorotaia mostra esaurimento del budget individuale di 90 s durante il tap su Petalora, dopo requisiti, annullamento, orientamenti e primo viaggio; non prova una causa del runtime. Separati requisiti/cancellazione e percorso quattro stazioni, conservando tutte le asserzioni, tastiera, DPR3 e portrait/landscape. Entrambi passati localmente in 22,4 s (7,9 e 13,2 s).
- Matrice CI portata da tre a sei shard, sempre un worker per runner, stessi limiti individuali e del job. Copertura verificata con enumerazione Playwright: nessun caso escluso o duplicato. Il prossimo esito CI resta da acquisire; la suddivisione non costituisce prova che tutti i problemi siano risolti.
- Cache v107 e contenuto 0.3.86 includono il feedback pesca già verificato. Nessun riavvio manuale dei job precedenti.

## Feedback pesca — checkpoint locale successivo a 0.3.85

- Lenza e galleggiante disegnati nel mondo, segnale di abboccata, durata completa 1,1 s e ridotta 180 ms. Input di movimento/interazione e suggerimenti sospesi durante il lancio; risorse grafiche/tween rimosse allo shutdown senza avviare incontri tardivi. RNG salvato prima dell'effetto.
- Build passata e percorso Ferraluce–Portolume–R08/pesca ripetuto con animazioni complete abilitate: 39,1 s, incontro avviato e canna conservata. Modifica non ancora pubblicata.
- Deploy del capitolo d197ea7, run 39285031933, ancora queued al controllo (build/deploy queued). Conservata la stessa esecuzione, senza annullarla o riavviarla.

## Verifiche Portolume 0.3.85 — 19/10/2026

- Percorso touch P5 superato in 51,7 s: tre console, apertura progressiva dei ponti, reload, battaglia Nerea, banner/emblema, premio 1400 monete e medaglia unica dopo reload. Squadra di checkpoint potenziata: prova di integrazione, non bilanciamento naturale.
- Traversata Ferraluce–R08–Portolume e ritorno R08, seguita dal lancio della lenza, superata in 37,7 s. Incontro effettivo con specie della tabella pesca e livello 20–23; canna conservata. Nessun teletrasporto dopo il setup iniziale.
- Porto–osservatorio–porto con canna e rapporto persistenti passato anche con cambio portrait/landscape e bersaglio A di almeno 44×44 px (14,4 s). Screenshot landscape ispezionato.
- Production offline: primo accesso ai tre Tiled e tre WebP, viaggio all'isola, reload e ritorno al porto passati in 18,1 s compresa build. Non è una lotta P5 completa offline. Test canonici di ricerca/palestra ora leggono i file runtime e passano (cinque prove).
- Suite locale precedente: 311 dominio + 16 persistenza. CI pubblica precedente 39225087078 fallita negli shard 1/2; shard 3 e Offline riusciti. Run 39223134920 anch'essa fallita. Cause residue da diagnosticare; nessuna affermazione di CI completamente verde. Pubblicazione del capitolo da controllare dopo push.

## Integrazione locale Portolume 0.3.85 — 19/10/2026

- Registrate R08, Portolume e P5 nel runtime: 24 mappe, 24 quest, nove allenatori, sei negozi e 158 asset validati. Dialoghi, canna, battello, puzzle, emblema Marea, accesso distinto da Ferraluce, diario, atlante e stazione collegati. Cache v106 preparata, versione non ancora pubblicata.
- Type-check/build e suite dominio/persistenza passati (`.tmp/portolume-integration-tests.txt`). Il percorso dei test ora usa le collisioni condizionali con i flag correnti; non attraversa paratoie ancora chiuse.
- Prima prova browser touch Portolume riuscita in 14,6 s: capitana, canna unica, viaggio all'isola, lettura misuratore, reload, ritorno al porto e rapporto. Screenshot ispezionato: illustrazione e personaggi renderizzati. Test `tests/e2e/portolume.spec.ts`. Setup a checkpoint isolato; non prova l'arrivo naturale dalla Centrale.
- Restano verifica touch della pesca e dell'intero percorso Ferraluce–P5, lotta/medaglia, portrait/landscape completi, offline, feedback animati e bilanciamento naturale. I test sui dati delle bozze non sostituiscono questi percorsi runtime.

## Preparazione Portolume e attesa scena P4 — 19/10/2026

- Creata l'illustrazione originale di Portolume, conservata con prompt e SHA256; non ancora uno sfondo runtime. Bozza della Costa riallineata all'immagine: 183 celle percorribili e 54 rettangoli di collisione, collegamento verificato tra ingressi, habitat e belvedere. Queste sono verifiche geometriche di bozza, non una traversata nel gioco. Registro completo: 154 asset.
- Audit Verify 39221522486: shard 2, shard 3 e Offline riusciti; shard 1 con 34 prove passate e tre fallimenti. Centrale (180 s) e Ferraluce (240 s) esauriscono il budget esterno durante la lettura del movimento. Restano da diagnosticare. Log e artefatti in `.tmp/ci-39221522486/`.
- P4: il test osservava `mode=menu` dopo init, prima della creazione di `ui`, poi leggeva `ui.list` inesistente. L'attesa ora richiede scena attiva, stato e container UI prima di leggere il modo. Nessuna modifica ai tempi o al runtime. Percorso completo di Rhea passato localmente in 34,2 s, compresi premio unico, banner e medaglia persistente dopo reload. Non prova da solo la risoluzione di tutta la CI.
- Deploy Pages 39225087089 su 3ab585a riuscito; Verify 39225087078 accodata al controllo. Verify precedente 39223134920 ancora in esecuzione, con shard 3 già riuscito. Nessun riavvio o cancellazione effettuati.

## Catalogo costiero 0.3.84 — 19/10/2026

- Catalogo esteso a 40 specie e 48 mosse con fonti PokéAPI locali: sei specie delle famiglie Tentacool, Krabby e Chinchou; evoluzioni ai livelli 30/28/27; Bollaraggio, Presa e Barriera con parametri HGSS. Gli habitat costieri non sono ancora collegati al mondo.
- Importatore artwork generalizzato per gruppi dichiarati nei dati; renderer e validatore scoprono i manifest senza elenchi manuali. Sei PNG ufficiali conservati con hash e sei WebP lossless inclusi nella cache v105.
- 321 test dominio/persistenza passati (`.tmp/coast-catalog-domain.txt`), 46 test Python passati. Validatore: 152 asset, 21 mappe, 21 quest, otto allenatori. Quattro prove browser passate: tutti i 40 artwork a tre densità e dettagli evoluzione delle sei specie nei pannelli Squadra/Pokédex (`.tmp/coast-art-panel.txt`).
- Build TypeScript/Vite e prova production offline completate: i sei artwork decodificano alla prima richiesta dopo la disconnessione (1 test, 15,5 secondi compresa build). Nessun capitolo P5 dichiarato giocabile. Pubblicazione della versione precedente b6b14cf riuscita; Verify 39223134920 ancora in esecuzione al controllo, precedente Verify 39221522486 fallita e da diagnosticare.

## Basi Portolume 0.3.83 — 19/10/2026

- Implementati i nuclei puri di pesca e tragitti in barca locali, con configurazione, requisiti e stato immutabile. Pesca con RNG persistibile e canna non consumata; approdi anche nella stessa mappa e rotte direzionali senza consumo di monete/RNG. Non sono ancora azioni raggiungibili dal mondo: restano postazioni, equipaggiamento, UI, mappe e capitolo P5.
- Collisioni estratte e integrate nel renderer, con `blocksUntilFlag`; i muri fissi sovrapposti non vengono rimossi. Validatore Tiled collegato alle quest per intercettare flag inesistenti. Quattro prove di collisione, cinque di barca, sei di pesca passate; pesca ricontrollata dopo la revisione dei flag.
- Gate locale finale: 314 test dominio/persistenza (298 + 16), 43 test Python, type-check/build e validatore completi superati. Validatore: 140 asset, 21 mappe e 21 quest. Tre E2E di regressione dopo l'estrazione delle collisioni superati in 2,8 minuti: Centrale completa, starter unico e interni/riposo. Log `.tmp/portolume-core-domain-final.txt`, `.tmp/portolume-core-python.txt`, `.tmp/portolume-core-validation.txt`, `.tmp/portolume-core-build.txt`, `.tmp/collision-regression.txt`.
- Fonti ufficiali Pokémon/specie #72, #98, #170, #171 acquisite e conservate con URL/hash in `content/sources/pokeapi/coastal-source-preview.json`. Preparazione dati, non nuove specie runtime: il catalogo resta a 34. Nessuna mossa assegnata o inventata in questa consegna. Cache proposta v104; pubblicazione e nuovo esito GitHub da verificare.

## Centrale 0.3.82 pubblicata — 19/10/2026

- Diagnosi dei sette fallimenti iniziali MVP: riprodotto localmente l'errore quando il lettore attende la pagina starter completa prima dei quattro tocchi fissi. Baseline fallita in 21,9 secondi su `#dialogue-box` ancora visibile, stesso testo di Elia della CI (`.tmp/dialogue-fixed-count-baseline.txt`). Il test ora avanza soltanto finché il dialogo è aperto, con limite e controllo finale; nessun comando extra dopo la chiusura e nessuna modifica al gioco. Il caso E2E-01 conserva la pagina iniziale già completata come regressione. Tutti e sette i percorsi interessati passano in 5,9 minuti (`.tmp/dialogue-state-e2e.txt`): starter unico, checksum/recovery, arrivo bosco/reload, oggetto persistente, battaglia HP/PP/XP, cattura/deposito a squadra piena e interni con riposo. Le verifiche GitHub complete restano da acquisire.
- Riallineata la prova artwork al catalogo completo per ID, eliminando il conteggio obsoleto di 31: tutte le 34 specie vengono controllate, con verifica dell'immagine renderizzata. Tre casi DPR1/2/3 portrait e landscape passati in 6,2 secondi (`.tmp/catalog-artwork.txt`). Nessun artwork o limite grafico del gioco modificato.
- Vetracielo: aggiunto allegato diagnostico su eventuale timeout dell'avanzamento automatico. Ogni lettura raccoglie timestamp monotono, coda, timer, Clock e loop nello stesso `page.evaluate`; non aggiunge conferme, non modifica timer o timeout. Il percorso completo continua a passare localmente, 2 minuti (`.tmp/vetracielo-diagnostics.txt`). Nessuna correzione della causa del timer dichiarata.
- Verify `39216323920` su `fbacd95` concluso fallito: shard1 35 passati/2 falliti (Ferraluce e Gym03, budget globale esaurito durante movimento), shard2 26/10 (monorotaia, sette casi MVP con dialogo ancora visibile, R04 e conteggio artwork), shard3 34/2 (conteggio artwork a DPR2/3). Offline adventure riuscito. In questo run Vetracielo non riproduce il precedente timeout di 15 secondi; i problemi di dialoghi, movimento e tempi globali restano aperti. Log REST e artifact in `.tmp/ci-39216323920-*`; audit in sola lettura, senza modifiche del runtime.
- Commit `fe1759a` su main; deploy GitHub Pages `39218933919` riuscito. Prova diretta su `https://jacoporusso.github.io/veloria/` con browser e salvataggio isolati: cache v103, primo accesso alle due mappe dopo aver disabilitato la rete, ordine delle azioni, registro persistente dopo reload, isolamento, riscontro, ritorno e rapporto a Ivo. Premio 300 monete/due Pozioni una sola volta, mantenuto dopo reload finale. Errori runtime e richieste fallite assenti. Log `.tmp/pages-centrale-public.txt`, screenshot `.tmp/pages-centrale-landscape.png`.
- Questa prova pubblica conclude l'intera indagine offline, ampliando il caso di produzione locale descritto sotto. Parte da un checkpoint preparato dopo quattro medaglie: non certifica una partita naturale completa, tutti gli starter o hardware fisico. La suite Verify `39218933885` è ancora da acquisire; il deploy riuscito non viene usato come prova della CI completa.

- Nuove illustrazioni originali integrate per Condotto e Centrale; collisioni del Condotto adattate al percorso disegnato, sensore spostato a (20,16), ingressi ovest y22–24 / est y10–12. WebP lossless e prompt conservati. Postazioni con `activatedFlag` per distinguere azioni completate da azioni ancora da eseguire. Cache v103.
- Percorso touch con le illustrazioni: `.tmp/centrale-art-results/.last-run.json` passato; schermate R07/D03 ispezionate. Verifica finale passata in 1,9 minuti (`.tmp/centrale-final-e2e.txt`): gate quarta medaglia, misura, azione fuori ordine, registro, reload intermedio, isolamento, riscontro, ritorno e premio unico. Rotazione in landscape, controlli da almeno 44 px e ritorno portrait verificati; schermata `.tmp/centrale-final-results/.../d03-centrale-landscape.png` ispezionata.
- Produzione offline: un caso passato in 1,4 minuti, inclusa build; primo accesso alle due mappe senza rete, lettura misuratore e registro, reload in Centrale e ritorno a Ferraluce, zero errori runtime e richieste fallite. Log `.tmp/centrale-offline.txt`. Questo caso non esegue isolamento, riscontro o rapporto finale offline.
- Validazione completa superata: 140 asset, 21 mappe, 21 missioni; 40 test Python passati. Dominio/persistenza 299 passati nella stessa integrazione, prima delle rifiniture grafiche. Nessun playtest naturale con tutti gli starter o QA su telefono fisico dichiarati. P5–P8, Lega, resto della regione e conclusione della storia rimangono da implementare.

## Controlli 0.3.81 e capitolo Centrale locale — 19/10/2026

- Commit `fbacd95`: deploy Pages `39216323884` riuscito. Controlli landscape da almeno 44 px; sei prove DPR3 superate nelle palestre 2–4, portrait/landscape, con rotazione e persistenza. Nuovo run Verify `39216323920` ancora in esecuzione all'ultimo controllo; non è dichiarato verde.
- Verify precedente `39215047534` concluso: tutti e tre gli shard browser falliti, Offline adventure riuscito. Shard3: 33 passati/1 fallito; Vetracielo rimane in modalità battaglia `message` per tutti i 15 secondi di attesa. Il trace non registra coda e TimerEvent: causa dell'avanzamento automatico ancora da isolare. Aumentare un timeout o usare conferme manuali non viene presentato come soluzione del difetto.
- Capitolo R07/D03 in integrazione locale: due mappe, lettura del Condotto e indagine in quattro passi. Validatore completo: 21 mappe, 21 quest, 136 asset; build superata. Dominio/persistenza: 299 test passati (283 + 16), inclusi prerequisiti fuori ordine, serializzazione e premio unico della Centrale. Prove browser, produzione offline e ispezione visiva ancora da completare: il capitolo non è dichiarato pubblicato.

## Dialoghi 0.3.80 e verifica pubblica P4 — 19/10/2026

- Sul sito pubblico 0.3.79: avvio, atlante decodificato, cache v100 e reload offline superati (`.tmp/pages-smoke-v100.txt`). Seconda prova su GitHub Pages: checkpoint isolato, ascensore, circuito risolto, reload offline nella palestra e ritorno a Ferraluce, senza errori runtime (`.tmp/pages-gym04-public.txt`). Non è una partita naturale completa né QA fisico.
- Typewriter locale aggiornato al tempo monotono trascorso: il vecchio callback rivelava solo una lettera a ogni tick anche dopo un lungo ritardo. Il nuovo timer recupera la porzione di testo dovuta senza cambiare pagina o ignorare la velocità selezionata.
- Tre prove passate (26,7 s): browser bloccato 750 ms con ripresa della digitazione, monorotaia quattro città/controlli/tastiera, caricamento fallito e riprova. Log `.tmp/dialogue-timing-fixed.txt`; cache proposta v101. Build TypeScript/Vite superata (`.tmp/dialogue-timing-build.txt`); pubblicazione della correzione in preparazione.
- Verify 0.3.79 `39162769459`: Offline adventure riuscito; tre browser shard falliti. Shard3 33 passati/1 fallito (Vetracielo attesa post-turno 15 s), shard1 29/4 e shard2 15/4 prima del limite job. Il trace P4 mostra 180 s già consumati da setup e navigazione: il timeout arriva circa 0,5 s dopo l’avvio del locator RUOTA, prima delle verifiche di stabilità/scroll/dispatch. Non prova un pulsante bloccato. Offline confermato 6/6, inclusa P4 (36,5 s) e avventura tre medaglie (7,6 min), totale 9,4 min. Audit in lettura del sotto-agente, trace in `.tmp/ci-p4-39162769459-gym04-trace/`. I limiti dei test lunghi e le cause dei rallentamenti browser restano aperti.

## Verifiche locali 0.3.79 — Palestra 4

- Due E2E passati: ascensore/rapporto, tre comandi in ordine diverso, reload intermedio, portrait/landscape e ritorno (45,2 s); Rhea bloccata prima del circuito, vittoria, banner, 1.100 monete una sola volta e quattro medaglie dopo reload (33,8 s). Log `.tmp/gym04-puzzle-verified.txt` e `.tmp/gym04-battle-verified.txt`. Screenshot portrait della palestra ispezionato.
- Produzione offline passata: ingresso, soluzione del circuito in altro ordine, reload e ritorno in città, senza richieste fallite (29 s; 41,3 s con build). Log `.tmp/gym04-offline.txt`.
- Dominio/persistenza 280 + 16 passati; Python 40 passati con directory temporanea del workspace; TypeScript, build e validatore contenuti passati. 19 mappe, 19 quest, otto allenatori, 136 asset registrati. Log `.tmp/gym04-domain-final.txt`, `.tmp/gym04-python-final.txt`, `.tmp/gym04-validation-final.txt`.
- Primo test puzzle: fixture incompleto dei flag precedenti, corretto usando le tappe reali del diario. Primo test sfida: lettura della scena prima del caricamento differito, corretto aspettando lo stato disponibile. Non sono stati rimossi gate o interazioni.
- Squadra di integrazione preparata (Quagsire 35): non certifica bilanciamento naturale. QA fisico, percorso completo con tutti gli starter e collisioni visive ai bordi restano da verificare. R07/Centrale, città completa e resto dell'avventura rimangono aperti.
- Commit 0.3.79 `41f2ec3` pubblicato; deploy Pages `39162769461` riuscito. Verify precedente `39159924891` su 0.3.77 concluso con tutti e quattro i job falliti; correzione Vetracielo verificata localmente, altri timeout ancora da risolvere. Il deploy precedente e le prove locali non vengono dichiarati come suite GitHub verde.

## Diagnostica Linux 0.3.77 — shard 3

- Job `117770885882`, run `39159924891`: 32 prove passate e una fallita (Vetracielo). Le tre prove layout battaglia, incluso 320×568, passano: la correzione dei dettagli mosse è confermata su Linux.
- Snapshot Vetracielo: giocatore già tornato sul viadotto, saldo 740, ricompensa Oren assegnata. Il test attendeva ancora il menu battaglia. L'Invio introdotto per saltare messaggi poteva arrivare dopo la comparsa del banner e chiuderlo. Correzione locale: messaggi automatici senza Invio, scelta esplicita «Tieni le mosse» soltanto nella fase stabile di apprendimento, riconoscimento del terminale anche nell'attesa iniziale del turno.
- Nuova prova locale passata in 2,1 minuti (log `.tmp/vetracielo-receipt.txt`). Shard 1 concluso con 31 passati e tre timeout in Ferraluce/Gym02/Gym03, da diagnosticare; gli altri job del run non hanno ancora un esito completo acquisito. Artefatti in `.tmp/ci-v77-shard3/`.

## Preparazione locale 0.3.78 — catalogo Ferraluce

- 34 specie / 45 mosse: import ufficiali HGSS di Magneton, Steelix e Skarmory, Sassata e tre artwork locali lossless; nessuna Palestra 4 o nuova tabella incontri abilitata.
- Validazione offline di fonti/manifest/checksum, 134 asset e contenuti superata. TypeScript e build produzione superati; dominio/persistenza 293 test, Python 35 test, prova Squadra/Pokédex e prova primo caricamento artwork senza rete superati. Log locali `.tmp/ferraluce-catalog-*`.
- Il primo comando npm della prova offline ha ignorato il filtro e avviato cinque casi: fermato soltanto quel processo, senza attribuire un esito alla suite interrotta. Run mirato successivo tramite CLI Playwright: un caso, passato in 15,1 secondi con build.
- Riferimento evolutivo Magneton con condizione di luogo, senza soglia numerica inventata né attivazione runtime. PokéAPI non fornisce il nome italiano di Mt. Coronet, conservato in inglese.
- La versione pubblica verificata resta 0.3.77. Il run Verify `39159924891` su quella versione è poi terminato con quattro job falliti; nessun esito completo verde dichiarato.

## Aggiornamento 0.3.77 — monorotaia e diagnostica CI

- Petalora: percorso completo irrigazione, Dalia, banner Corolla con rotazione e medagliere superato localmente in 1,3 minuti, senza modifiche al test. Il precedente errore Linux non è riprodotto; causa ancora da accertare. Log `.tmp/gym02-current.txt`.
- Percorso Vetracielo completo superato in 2 minuti dopo aggiornamento dell’attesa battaglia: gestisce esplicitamente messaggi e apprendimento mosse tramite comandi normali. Premio unico di Oren, servizi e persistenza verificati; log `.tmp/vetracielo-current.txt`. È evidenza locale, non una nuova esecuzione Linux.

- Quattro prove browser superate (due trasporto, avvio con starter, icone servizi); due prove produzione offline superate (atlante e tre viaggi con ricarica). Log locali `.tmp/monorail-release-e2e.txt` e `.tmp/monorail-release-offline.txt`.
- Dominio/persistenza: 293 test; Python: 35 test con directory temporanea nel workspace; build e validazione contenuti superate. Nessuna prova su telefono fisico, nessun playtest naturale completo con tutti gli starter.
- La pipeline Verify `39157639261` sul commit precedente `1952caa` è fallita in tutti e quattro i job. Overflow dei dettagli mosse a 320px; timeout di battaglia/navigazione, elemento Dalia rimosso durante lo scroll; shard 2 interrotto al limite di 16 minuti; percorso offline tre medaglie interrotto dopo 12 minuti attendendo il canvas. I due altri casi offline sono passati. Non tutti i timeout hanno una causa dimostrata.
- Corretto localmente l'adattamento dei dettagli mosse ai font di ripiego: tre prove presentation portrait/landscape superate. Verifica Linux e riparazione dei restanti test ancora aperte. Deploy Pages precedente riuscito, ma non prova la salute della suite Verify. Commit `6f689c4` pubblicato su main. Deploy Pages `39159924927` riuscito; prova Chrome sull’URL pubblico: HTTP 200, avvio nuova partita, atlante decodificato, cache v98, reload offline ed errori runtime assenti (log `.tmp/pages-smoke-v98.txt`). Verify `39159924891` ancora in esecuzione: esito completo da acquisire.

## Aggiornamento 18/10/2026 — pubblicazione Pages e riparazione CI

- Repository reso pubblico e sito pubblicato: https://jacoporusso.github.io/veloria/. Deploy `39146964926` completato con successo sul commit `e28496d`.
- Prova Chrome contro l’URL pubblico: HTTP 200, nuova partita, atlante con immagine decodificata, cache `veloria-shell-v96`, reload senza rete ed errori runtime assenti. Il manifest della build è ora `build-manifest.json`: il precedente percorso nascosto `.vite/manifest.json` non veniva pubblicato nell’artifact Pages.
- La suite completa `Verify` **non era verde**: run `39146964935` fallito con asserzioni UI obsolete, overflow header 320px e timeout. Screenshot/tracce scaricati localmente in `.tmp/ci-39146964935/`; il deploy riuscito non viene usato come prova della suite completa.
- Header adattivo corretto a 320px, controlli sempre visibili; 2 prove layout locali superate. Sei prove battaglia/journal e una prova sensore→Ada riallineate al rendering attuale e superate. I dettagli mosse confrontano l’intero insieme degli ID del catalogo, anziché il vecchio numero fisso 38; due prove dedicate superate, comprese tutte le 44 descrizioni.
- Nuova configurazione proposta: tre shard browser, un worker ciascuno, offline su runner separato. La lunga prova delle tre medaglie conserva tutte le interazioni/assert e un timeout globale CI di 12 minuti (8 in locale), dopo che il runner precedente raggiungeva P2 vicino al limite di 8 minuti. Nessun incontro del gioco è stato disabilitato per accelerare i test.
- Ulteriori prove locali superate: tutti i 12 casi `battle-rules` (10 nello stesso run e 2 sul controllo del catalogo corretto), percorso Vetracielo (2 minuti), Gym02/Gym03 (2,7 minuti), R04 (1,9 minuti), E2E-01, E2E-03, E2E-04 (ultimo run completo 2,5 minuti), E2E-05 (1,3 minuti) e R02. I casi cattura usano ora le vere aree con foglie e i varchi Tiled; Mira attende gli stati reali della battaglia e conserva il banner visibile per le asserzioni. Non sono state alterate le probabilità del gioco o le squadre runtime.
- `npm test`: 287/287; TypeScript/build e validatore completi superati. Lo sharding elenca 33 + 33 + 32 casi browser; i tre casi offline restano nel job dedicato. Le verifiche locali descritte non equivalgono ancora a un esito positivo della nuova pipeline GitHub.
- Contenuti 0.3.76 / cache v97 per l’header aggiornato. Esito della nuova configurazione GitHub ancora da acquisire; nessuna dichiarazione di CI completa o QA fisico superati.

## Aggiornamento 18/10/2026 — Anello Magnetico e Ferraluce 0.3.73

- 281 test dominio/persistenza (265 + 16), 24 test Python, TypeScript e validatore superati. Stato: 18 mappe runtime, 17 missioni, sette allenatori, cinque botteghe, 31 specie / 44 mosse, 126 asset registrati.
- Prova touch integrata superata in 2,6 minuti: gate Circuito, arrivo senza lettura, ritorno al sensore, checkpoint/reload, rapporto unico, cure, acquisto e ritorno a Vetracielo. Una successiva prova del renderer copre le ultime rifiniture grafiche e i due orientamenti (11,6 secondi). Screenshot in `test-results-ferraluce-v73-complete/` e `test-results-ferraluce-art-v73/`, ispezionati visivamente.
- Durante lo sviluppo corretti un riferimento di spawn, un prerequisito quest mancante, un varco con coordinate in pixel anziché tile e testi danneggiati da una lettura locale con codifica implicita. I test ora verificano anche geometria dei varchi e obbligatorietà di `requiresFlags`; tutte le letture negli interventi finali usano UTF-8 esplicito.
- Il primo tentativo touch passava negli habitat facoltativi e si fermava in battaglia: il pianificatore del test ora può evitare quelle zone. Non sono stati disabilitati gli incontri nel gioco né alterati i pesi per far passare la prova.
- Build TypeScript/Vite e due scenari di produzione offline superati (6,3 minuti complessivi): percorso fino a Circuito (5,5 minuti), poi lettura sull’Anello, rapporto a Ivo, cure e reload a Ferraluce (36,8 secondi). Il nuovo scenario usa un salvataggio preparato ed è una prova di integrazione, non una partita naturale. Nessuna richiesta fallita. Nessun QA su telefono fisico o pipeline GitHub verificata in questa sessione.
- Otto record PokéAPI preparatori per P4 conservati con hash verificati in un manifest separato; nessuna specie/mossa attivata da quelle fonti. Palestra 4, Centrale, città completa e seguito dell’avventura ancora mancanti.

## Aggiornamento 18/10/2026 — evoluzioni dei sentieri 0.3.72

- 273 test dominio/persistenza (257 + 16), TypeScript e validatore superati. Catalogo 31 specie / 44 mosse, 122 asset registrati, 11 import parametrici e nove artwork evolutivi verificati offline.
- 12 prove browser superate: nove evoluzioni reali con evento unico, nuova immagine, IndexedDB/reload e dettaglio Squadra; catalogo completo a DPR 1/2/3 in portrait e landscape. Screenshot in `test-results-route-evolutions-v72/`; dettaglio Flaaffy controllato visivamente.
- Scenario produzione offline superato in 5,7 minuti: precache di tutti gli artwork dichiarati, percorso fino alle tre medaglie e persistenza dopo reload. La prova usa creature preparate per le battaglie e non certifica il bilanciamento naturale. Build TypeScript/Vite della stessa versione superata. Nessuna prova su smartphone fisico né pipeline GitHub in questa sessione. Curve XP e timing evolutivo restano prototipali, come documentato nelle regole.
- Piano del prossimo capitolo in `16_FERRALUCE_CHAPTER_PLAN_v0.1.md`; R06/Ferraluce/P4 non sono ancora runtime. I risultati Playwright locali con nomi dedicati sono ora esclusi da Git, conservando i file sul disco.

## Aggiornamento 18/10/2026 — nitidezza battaglia 0.3.71

- TypeScript e cinque prove browser dedicate superati: catalogo completo, portrait/landscape a DPR 1/2/3, Sonicboom e Tuononda. Screenshot in `test-results-battle-sharpness-v71/`, controllata visivamente la schermata mosse landscape. Nessuna prova su telefono fisico.
- Testi risoluzione 4, nessuna scala frazionaria per i nomi mosse; cinque artwork locali rigenerati lossless. Cache v90.

## Aggiornamento 18/10/2026 — terza palestra 0.3.70

- 261 test dominio/persistenza, 24 test Python, validatore e build superati. Quattro prove browser palestra/catalogo e due prove effetti mosse superate.
- Scenario produzione offline completato (5,7 minuti): tre medaglie, puzzle Aster, ricompense e persistenza dopo reload. Il test attende esplicitamente il checkpoint prima dei reload delle console. Questo risultato precede la rifinitura 0.3.71; non è stato ripetuto per quest’ultima.
- 16 mappe, 25 specie, 44 mosse. Il percorso tecnico usa Pokémon preparati, non certifica il bilanciamento naturale di tutti gli starter. Cinque Palestre e Lega ancora mancanti; pipeline GitHub non verificata in questa sessione.

## Aggiornamento 18/10/2026 — messaggi e fonti Vetracielo 0.3.69

- Corretto il messaggio delle cure sopra la ricompensa missione, rilevato nello screenshot offline 0.3.68. Ora viene posizionato sotto il premio e ricalcolato alla rotazione; su superfici troppo corte sostituisce il premio precedente. Prova browser dedicata portrait/landscape e build finale TypeScript/Vite superate; scenario offline completo non ripetuto per questa rifinitura di layout.
- Acquisite 12 risposte ufficiali PokéAPI per Magnemite, Voltorb e mosse candidate, con manifest separato e SHA-256 verificati. Sono fonti preparatorie, non contenuto runtime. Rimangono 23 specie e 38 mosse giocabili. Cache PWA v88; contenuti delle nuove mappe e prova completa offline verificati nella versione 0.3.68 sotto.

## Aggiornamento 18/10/2026 — R05 e prima piazza di Vetracielo 0.3.68

- Nuove mappe collegate al varco est di Petalora dopo Corolla; quattro habitat sul viadotto e uno nel parco, Oren opzionale, Lea con premio unico, cure/deposito e rifornimenti. Stazione Giardino originale ImageGen, PNG + WebP q88 con alpha registrati. Nessuna nuova specie/mossa o logica per città in WorldScene; Palestra 3 e metropoli completa ancora assenti.
- 241 test dominio/persistenza superati (225 + 16). Nuovi controlli BFS da ogni spawn verso tutte le uscite evitando habitat, riferimenti reciproci, collisioni stazione/binari, servizi raggiungibili, mosse ufficiali HGSS di Oren, arrivo e orientamento idempotente, priorità diario dopo Corolla. Validatore verde: 15 mappe runtime, 12 missioni, 6 allenatori, 4 botteghe, 104 asset registrati e 70 dipendenze.
- Scenario browser DPR3 passato (2 minuti): gate chiuso senza Corolla, apertura, sfida Oren con Ivysaur 20 preparato, 240 monete, arrivo e dialogo Lea, due Pozioni, cure, acquisto al prezzo effettivo del catalogo, orientamento persistente senza doppio premio dopo reload e ritorno a Petalora. Screenshot portrait/landscape ispezionati. Primo tentativo fermato dall’aspettativa di prezzo errata del test (300 invece dei 200 del catalogo); il runtime era corretto.
- Ripetizione dello scenario browser con dialogo a Oren dopo vittoria e reload superata (2,1 minuti): nessuna seconda sfida o ricompensa. Prova di produzione senza rete superata (4,8 minuti di scenario, 5,1 incluso avvio): prologo → Aurora → Petalora → Corolla → R05 → Lea → cure in Vetracielo → reload con orientamento e due Pozioni persistenti. Nessuna richiesta fallita. Screenshot offline ispezionato. Squadra tecnica Charmeleon 30 nel test offline: non dimostra il bilanciamento naturale.
- 24 test Python superati usando una directory temporanea sotto `.tmp`: il primo tentativo con Temp di sandbox Windows aveva fallito per accesso negato. Build di produzione TypeScript/Vite e diff-check superati; resta avviso chunk Phaser. Nessun test su telefono fisico o pipeline GitHub. La città completa, la Palestra 3, la rifinitura dei binari e il bilanciamento naturale restano da realizzare/verificare.

## Aggiornamento 18/10/2026 — indicazioni e feedback missione 0.3.67

- Indicazioni mondo DOM alla densità nativa, proiezione della camera e posizionamento che evita HUD/controlli/protagonista. Ricompense missione compatte e nessun toast generico duplicato. Piano documentato per R05/Vetracielo; nessuna nuova area giocabile in questa versione.
- 232 test dominio/persistenza superati (216 + 16), inclusi quattro casi di posizionamento. Cinque scenari browser finali superati: tre uscite del primo capitolo e Dalia in portrait/landscape a DPR 1/3, apertura menu e bersaglio fuori schermo. Screenshot ispezionato dopo la protezione del protagonista.
- Scenario completo Palestra 2 superato (1,3 minuti) con nuove asserzioni su ricompensa compatta, diario e assenza del toast duplicato, prima dell’ultima rifinitura della sola proiezione. I primi test visivi hanno trovato un errore di spread DOMRect, un margine frazionario e un caso di uscita vicino al pad: corretti e verificati nuovamente.
- Build TypeScript/Vite e diff-check superati; cache PWA v86. Restano avviso chunk Phaser, QA su smartphone fisico e rifinitura artistica dei canali. Scenario offline completo non ripetuto per questa modifica UI; ultimo esito di produzione offline: 0.3.65.

## Aggiornamento 18/10/2026 — nitidezza battaglia 0.3.66

- Densità nativa fino a 3× su telefono, budget framebuffer 4K per display grandi, artwork non ingranditi oltre i pixel sorgente e dettagli mosse a 11px. Landscape con fino a quattro mosse su una riga più alta.
- Due test del budget/densità e nove scenari browser superati: battaglia con Pidgey, catalogo di 23 specie, rotazione mondo e touch a DPR 1/2/3, oltre a props/terreno. I tre scenari battaglia ripetuti e superati dopo la rifinitura dell’altezza dei pulsanti. Build TypeScript/Vite e diff-check superati; resta l’avviso sulle dimensioni del chunk Phaser. Screenshot landscape 3× ispezionato. Nessuna prova su telefono fisico; gli artwork mantengono il limite delle sorgenti esistenti.

## Aggiornamento 17/10/2026 — seconda palestra 0.3.65

- Palestra di Petalora collegata alla città, quattro stazioni d’irrigazione, canali/fiori condizionali e sfida Dalia Erba. Medaglia Corolla e 650 monete una sola volta, emblemi distinti nel banner e nel medagliere.
- 226 test dominio/persistenza superati (210 + 16), compresi quattro nuovi controlli di quest, gate, visuali e BFS. Validatore contenuti: 13 mappe runtime, 10 missioni, 5 allenatori e 3 botteghe; 102 asset registrati invariati. Build TypeScript/Vite superata, incluso il build di produzione usato dalla prova offline.
- Scenario mobile DPR 2 superato (1,3 minuti): azioni fuori ordine, blocco Dalia, ripresa dopo sorgente, sei fioriture, vittoria, premio, menu con due emblemi dopo caricamento e niente seconda ricompensa. Ripetuto con feedback e medagliere in landscape: superato, screenshot ispezionati. Primo tentativo della fixture anticipava il preload della battaglia; il test ora attende scena attiva e UI realmente costruita.
- Scenario di produzione offline esteso al puzzle, Dalia e medagliere superato (3,9 minuti), dal prologo fino a due medaglie senza richieste fallite. Squadre preparate: Charmeleon 16/30; non sono prove del bilanciamento naturale. Nessuna verifica su telefono fisico o pipeline GitHub. Restano avviso chunk Phaser, rifiniture dei canali e possibile sovrapposizione delle etichette alte con l’HUD.

## Aggiornamento 17/10/2026 — salita e primo quartiere di Petalora 0.3.64

- R04 e Petalora collegati a Radicelmo, gate Aurora senza requisito vivaio, quattro habitat e Nila opzionale. Cure/deposito e bottega funzionanti. Ciliegio originale con PNG/WebP e prompt registrati; 102 voci asset. Palestra 2 e città completa restano da realizzare.
- 222 test dominio/persistenza superati (206 + 16), con BFS delle nuove mappe e priorità fra obiettivi principali e facoltativi. Validatore: 12 mappe runtime, 8 missioni, 4 allenatori, 3 botteghe; mosse di Nila conformi al learnset HGSS disponibile.
- Tre prove browser dedicate superate: percorso reale con gate, andata/ritorno, arrivo persistente, cure, acquisto, vittoria su Nila e premio unico dopo ripresa; grafica a DPR 2 in portrait/landscape con petali animati e ridotti. Screenshot ispezionati. Squadra preparata Charmeleon 16: integrazione verificata, bilanciamento naturale non dimostrato.
- La prima esecuzione del percorso è stata interrotta dal reload HMR durante una modifica del renderer; ripetuta a fonti ferme e superata (1,9 minuti). Nella prima selezione era incluso anche lo scenario esistente degli interni di Borgofonte, passato.
- Prova di produzione offline estesa superata (3 minuti): prologo, incontri, cure, Aurora, gate R04, arrivo a Petalora, cure e ripresa senza rete; nessuna richiesta fallita. Partenza del tratto nuovo preparata a Radicelmo, senza assegnare il flag d’arrivo. Build e diff-check superati; resta l’avviso chunk Phaser. Nessuna prova su smartphone fisico o pipeline GitHub.

## Aggiornamento 17/10/2026 — nitidezza battaglia 0.3.63

- Canvas HiDPI fino a 2×, layout CSS preservato, testi battaglia a risoluzione 2×. Artwork individuali renderizzati con i pixel disponibili, senza nuove immagini. Nessuna modifica all’animazione della Sfera.
- Dieci casi browser distinti superati: tre prove battaglia WebGL alle densità 1/2/3 (23 specie caricate, artwork in campo senza sovraingrandimento, testo 2×, portrait/landscape e touch LOTTA), tre prove del mondo alle stesse densità (rotazione, zoom coerente, movimento touch), quattro prove cattura/vittoria a DPR 2 (animazione, box, fallimento, feedback/premio e callback singoli). Il primo tentativo ha individuato un registro di densità separato fra moduli della fixture: rimosso, il layout legge ora direttamente lo zoom effettivo di Phaser.
- Screenshot WebGL portrait e landscape ispezionati. Build TypeScript/Vite, validatore contenuti e diff-check superati; resta l’avviso chunk Phaser. Nessuna nuova prova su smartphone fisico, offline o pipeline GitHub; dominio di battaglia e salvataggi non modificati.

## Aggiornamento 17/10/2026 — vivaio di Radicelmo 0.3.62

- Missione «Un archivio che cresce» dopo l’archivio: acqua, luce, osservazione e rapporto a Leda. Stato persistente, indicazioni sul prossimo oggetto, dialoghi per azioni premature e ricompensa unica. Riutilizzo dell’atlante illustrato; nessun nuovo asset esterno. L’interno D02, R04 e Petalora restano da implementare.
- 213 test dominio/persistenza superati (197 + 16), compresi cinque nuovi controlli della quest. Build TypeScript/Vite, validatore di sette missioni runtime e diff-check superati; resta l’avviso chunk Phaser.
- E2E-12 esteso superato in 1,2 minuti: gate della medaglia, raccolta/consegna, avvio del vivaio, azioni fuori ordine, ripresa dopo l’acqua, germoglio, ricompensa e seconda ripresa senza duplicazioni. Corretti due errori del test: orientamento dopo il caricamento e attesa della conclusione del movimento prima di A.
- Rotazione portrait → landscape → portrait superata separatamente; screenshot renderizzati ispezionati. Il primo screenshot landscape era preso nel fotogramma transitorio del resize; la verifica dedicata attende dimensioni e postrender effettivi. Nessuna nuova prova offline, su smartphone fisico o pipeline GitHub.

## Aggiornamento 17/10/2026 — prime evoluzioni starter 0.3.61

- Bulbasaur, Charmander e Squirtle evolvono al livello 16. Catalogo a 23 specie, parametri e artwork PokéAPI locali con manifest e checksum; learnset HGSS supportati, curva XP del prototipo invariata. Forme finali e Pietratuono restano da implementare.
- 208 test dominio/persistenza e due test Python sui parametri storici superati. Nove scenari browser distinti verificano evoluzioni, conservazione di identità/HP/PP, salvataggio IndexedDB, schede e artwork.
- Percorso di produzione offline fino alla medaglia Aurora superato (2,3 minuti), inclusa decodifica dei tre nuovi artwork senza rete. Aggiornato il percorso del test alle attuali zone di felci e ai banner di vittoria; il primo tentativo usava un sentiero senza incontri.
- Build, validatore contenuti e diff-check superati. Nessuna nuova verifica su smartphone fisico o pipeline GitHub. Resta l’avviso chunk Phaser.

## Aggiornamento 17/10/2026 — feedback e medagliere 0.3.60

- Animazione Sfera e ricevuta della cattura (immagine, tipo, livello, HP, mosse, squadra/box); fallimento senza banner di successo. Vittoria allenatore con monete realmente assegnate e feedback. Mira con emblema Aurora e medagliere persistente, condiviso con il riepilogo del capitolo.
- 202 test dominio/persistenza superati. 20 scenari browser combattimento/zaino superati, più E2E-05 su Mira e il caso medagliere vuoto (22 scenari distinti). Ripetuti i quattro casi dei nuovi banner dopo il layout finale: portrait, landscape con dati affiancati, pulsante sempre visibile e animazioni ridotte. Screenshot ispezionati.
- Rilevata e corretta una doppia notifica di chiusura durante il click sul banner: la chiusura della scena è ora notificata una sola volta, come il completamento. La suite verifica callback singole, cattura nel box, mancata cattura, feedback, premio e persistenza della medaglia dopo il caricamento.
- Build TypeScript/Vite, validatore contenuti e diff-check superati. Catalogo medaglie e feedback verificati; nessuna nuova prova su smartphone fisico o pipeline GitHub. Resta l’avviso chunk Phaser.

## Aggiornamento 17/10/2026 — evoluzioni nelle schede 0.3.59

- Informazioni evolutive PokéAPI locali per tutte le 20 specie; import riproducibile e checksum verificati offline, con confronto delle quattro soglie runtime già implementate. Nessuna nuova evoluzione abilitata dal solo riferimento.
- Cinque scenari browser superati: Squadra/Pokédex a 390×844, 320×568 e 844×390; livello 16 degli starter, livello 7 di Caterpie, Pietratuono per Pikachu, forme finali e distinzione disponibilità. Sezione spostata prima delle affinità, non in fondo ai learnset.
- Build TypeScript/Vite e validatore contenuti superati. Nessuna verifica aggiuntiva su telefono fisico o pipeline GitHub.

## Aggiornamento 17/10/2026 — continuazione Radicelmo 0.3.58

- Corretto il seme che aggiornava solo il flag senza entrare nello zaino. Contratto generico `grantItems`/`consumeItems`, consegna atomica e ricompensa unica; tutte le missioni runtime ora passano anche lo schema JSON.
- 202 test superati (186 dominio/servizi, 16 persistenza); 6 test Python dello schema. Validatore contenuti e build TypeScript/Vite superati, con il consueto avviso chunk Phaser.
- E2E-12 esteso superato: medaglia richiesta, raccolta nello zaino, caricamento, consegna e ricompensa, seconda ripresa e nuova interazione senza duplicazione. Il primo tentativo è stato interrotto da un aggiornamento Vite durante la prova; ripetuto dopo le modifiche e passato.
- Partita nuova Charmander fino a Mira e poi Radicelmo, 6,7 minuti: nessuna iniezione di progressi, oggetto consegnato, ricompensa e ripresa verificati, zero errori JavaScript. Report nel resoconto del playtest.
- Tre verifiche browser degli indicatori dopo la medaglia superate. Individuato e corretto il testo tagliato dall’uscita est di Brumalta: testo a capo e posizione limitata ai confini della mappa. Nessuna prova su telefono fisico o pipeline GitHub; seconda palestra e campagna completa restano da implementare.

## Aggiornamento 17/10/2026 — strategia e Pokédex 0.3.57

- Descrizioni condivise delle 38 mosse dagli effetti runtime; consultazione in lotta senza azioni/PP/turni. Verificate tutte le descrizioni a 320×568 e 844×390, anche con PP esauriti, e ingresso avversario senza rivelare riserve.
- Squadra e Pokédex separati, schede con statistiche, affinità e learnset supportato. Specie viste ma non catturate consultabili; flag di incontro persistenti senza migrazioni. Test di servizio per proprietà/distinzione visto-catturato e deduplicazione.
- 196 test superati (180 dominio/servizi, 16 persistenza). Browser: 24 scenari complessivi fra zaino, combattimento, schede e presentazione. La prima esecuzione aggregata ha segnalato 2 controlli di presentazione: adattato il controllo per il nuovo comando separato dalle carte e corretto un reale overflow a 320 px; la suite presentazione ripetuta passa 4/4. Gli altri 20 scenari erano passati, inclusa scansione delle 38 descrizioni.
- Build TypeScript/Vite e validatore contenuti superati. Screenshot ispezionati in portrait/landscape. Resta l’avviso chunk Phaser; non verificati telefono fisico o pipeline GitHub. Catalogo e campagna rimangono parziali.

## Aggiornamento 17/10/2026 — zaino e monete 0.3.56

- Contatore monete e zaino collegati alla partita corrente; accesso diretto e dal menu. Nessuna modifica al formato salvataggi e nessuna migrazione.
- Quattro test browser superati: layout 390×844, 320×568 e 844×390, contenuti reali, apertura/chiusura e focus dal menu, aggiornamento saldo/quantità e zaino vuoto. Screenshot portrait/landscape ispezionati; il contenuto scorre in landscape.
- Build TypeScript/Vite, validatore contenuti e diff-check superati. Resta l’avviso chunk Phaser; nessuna nuova prova su telefono fisico o pipeline GitHub.

## Aggiornamento 17/10/2026 — contenuti 0.3.55 / ruleset v7

- 192 test superati: 176 dominio/servizi e 16 persistenza. Superati anche 13 scenari browser combattimento/presentazione, build TypeScript/Vite e validatore dei contenuti. Resta l’avviso sulla dimensione del chunk Phaser.
- Corrette le sostituzioni obbligate dopo KO, le immunità agli stati e la chiusura dell’apprendimento. Le mosse mostrano una stima dei danni calcolata dalla stessa formula del motore.
- Playtest naturali completati fino alla prima medaglia, riepilogo e salvataggio/titolo/continua: Charmander, Bulbasaur e Pikachu su 0.3.54; Squirtle su 0.3.55 con scelta basata sulle stime visibili. Allenamento reale fino al livello 8, catture, Centro e acquisti; nessuna assegnazione di XP o flag dal test. Nessun errore JavaScript osservato. Dettagli e tentativi precedenti nel resoconto del playtest.
- Nessuna compatibilità o migrazione dei vecchi salvataggi richiesta. Non verificati smartphone fisico, campagna completa o pipeline GitHub. I risultati sottostanti sono storici e riferiti alle rispettive versioni.

## Aggiornamento 17/10/2026 — verifica browser combattimento 0.3.51

- Riprodotto nel browser IAB un incontro spontaneo nel Bosco: carte con testo fuori dai bordi; corrette con tre righe e titolo separato.
- Corretto un blocco reale di `finishMoveLearning`: dopo sostituzione/rifiuto il vecchio stato learning rimaneva attivo senza scelta pendente. Il test ora completa sostituzione, rifiuto successivo e callback finale unica.
- 11 scenari browser superati sul server locale 5174 fuori sandbox: efficacia, immunità, dettaglio mosse/risoluzione automatica, AI Mira, evoluzione, apprendimento, cattura, Parassiseme e layout 390×844 / 320×568 / 844×390. Barre HP Parassiseme verificate attraverso i testi effettivamente renderizzati.
- Test dominio/persistenza: 178 superati. Build TypeScript/Vite, validatore contenuti e diff-check superati. Non è un playtest su smartphone fisico né una verifica dell’intera avventura.

## Aggiornamento 17/10/2026 — Parassiseme 0.3.50

- Catalogo locale 38 mosse: Parassiseme ufficiale al livello 7 per Bulbasaur, sorgente API e checksum registrati.
- 7 regressioni specifiche: drenaggio e replay, immunità/duplicazione, cambio bersaglio, cambio utilizzatore, limiti HP e KO/XP, cattura/nuova battaglia, scelta AI.
- `npm test`: 162 test dominio/servizi + 16 persistenza superati; validatore contenuti e build TypeScript/Vite superati. Nessun nuovo playtest browser o telefono.

## Aggiornamento 17/10/2026 — precisione/elusione 0.3.49

- Catalogo PokéAPI locale: 37 mosse; aggiunte Turbosabbia, Muro di Fumo e Profumino con livelli ufficiali.
- Verificati moltiplicatori separati, bypass precisione nulla, riduzione precisione nella risoluzione reale, replay deterministico, consumo PP e reset al cambio.
- `npm test`: 155 test dominio/servizi + 16 persistenza superati; build TypeScript/Vite e validatore contenuti superati. Nessun nuovo playtest browser/mobile. Resta l’avviso dimensione chunk Phaser.

## Aggiornamento 17/10/2026 — catalogo mosse 0.3.48

- Import PokéAPI locale esteso a 34 mosse, con snapshot e checksum; 132 apprendimenti sorgente restano fuori dal runtime.
- Verificati valori storici HGSS di Sanguisuga, livelli reali delle nuove mosse e ordine delle tre polveri di Butterfree al livello 12.
- `npm test`: 151 test dominio/servizi + 16 persistenza superati. `npm run build` e validatore contenuti superati. Nessun nuovo playtest browser o telefono in questa iterazione.

## Aggiornamento 17/10/2026 — habitat e compatibilità deposito

- Contenuti 0.3.47, cache PWA v66: aggiunti habitat R02 e controllo copertura per ogni percorso Rxx.
- Test di raggiungibilità dei terreni calpestabili negli habitat R01/R02/R03.

# Mosse e apprendimenti PokéAPI HGSS — contenuti 0.3.46

- Catalogo e livelli generati da snapshot PokéAPI con URL/checksum; il validatore principale esegue il controllo di riproducibilità offline. Nessuna taratura manuale dei dati delle mosse.
- Nuove creature, starter e allenatori rispettano i learnset supportati al livello. Il report conserva anche gli apprendimenti non implementati. I vecchi ID delle mosse salvate restano compatibili; PP sopra il massimo ufficiale vengono limitati in battaglia.
- Verificati assorbimento, effetti statistici probabilistici, attacchi multipli, confusione, durata sonno importata e apprendimento all'evoluzione. Le altre meccaniche del simulatore restano prototipi dove documentato.
- Build, suite di dominio/persistenza e validatore contenuti verificati localmente. L'E2E browser e il playtest di bilanciamento con le nuove regole non sono dimostrati da questi test.

# Ritmo e leggibilità della battaglia — verifiche locali

- I messaggi delle azioni avanzano automaticamente dopo la selezione, il tasto A li può saltare da tastiera, la chiusura dell'esito e le scelte sulle mosse apprese richiedono conferma.
- Le schede indicano tipo, categoria, potenza, precisione e PP; l'accento cromatico segue il tipo. I messaggi tattici mostrano efficacia e HP persi. La documentazione del ruleset precisa che l'efficacia non predice i danni esatti.
- `npm run build` e `npm test` passano (132 test di dominio/battaglia, 16 di persistenza). `git diff --check` non segnala errori.
- Aggiunto E2E per leggibilità delle schede e avanzamento automatico. L'esecuzione Playwright locale è stata avviata; le prove browser precedenti in questa sessione ricevono `ERR_NETWORK_ACCESS_DENIED` sul loopback.

# Ruoli del catalogo mosse — prototipo v4

- Le mosse supportate dal core hanno ruoli esposti sulle schede compatte: status e probabilità, priorità, o stadi modificati.
- Tackle/Scratch non sono più identiche; Braciere può scottare e Pistolacqua è l'attacco iniziale più potente. Il catalogo passa alla versione 4 e la cache PWA alla v60.
- `npm run build`, `npm test`, il validatore contenuti e `git diff --check` passano. Aggiunte asserzioni E2E per status e mosse di supporto; il runner Playwright non riesce a navigare al server locale (`ERR_NETWORK_ACCESS_DENIED` su 127.0.0.1:5174), quindi questa verifica resta da eseguire su un runner con accesso al loopback.
- La scena world è visibile dal browser locale in portrait; il collaudo touch su telefono reale resta da fare.

# Varietà delle mosse iniziali e incontri del Bosco — contenuti 0.3.44

- Tackle passa da 15 a 6 specie MVP; Millebave aggiunge una scelta di supporto con riduzione Velocità già gestita dal core.
- I due trigger del sottobosco salgono all'18% per passo. La tabella mantiene fasce orarie: 5 specie mattino, 7 giorno, 4 notte.
- Verificare nel playtest se la frequenza e l'accuratezza dei nuovi moveset selvatici sono adatte al primo capitolo.

# Habitat visibili nel Bosco — contenuti 0.3.45

- Zone d'incontro spostate dal sentiero al terreno forestale e segnate con felci dell'atlante illustrato esistente. Il cartello d'ingresso indica dove cercare e la variazione con l'orario.
- Test di raggiungibilità: ogni casella delle due zone è accessibile dall'ingresso e fuori dalle tile di sentiero e acqua. Passano i test mirati incontri/registro asset e il validatore contenuti.
- Anteprima portrait nel browser locale verificata: il gruppo occidentale è visibile sull'erba e il sentiero resta libero. Il collaudo su telefono reale resta da fare.

# Sostituzione mosse apprese — verifiche locali

- Quando un livello insegna una mossa con quattro slot occupati, la battaglia ora mostra un prompt navigabile da touch e tastiera. Si può sostituire uno slot o tenere il moveset; le scelte multiple vengono presentate in sequenza.
- Il core aggiorna solo lo slot scelto, assegna i PP massimi e non consuma un turno. Il callback che persiste lo scontro terminale attende la risoluzione di tutte le scelte; nessun nuovo campo save o migrazione.
- `npm run build` riuscita; `npm test`: 132 test di battaglia/dominio e 16 di persistenza passati. Validatore runtime: 94 asset, 70 dipendenze e tutti i contenuti validi; 21 test Python passati.
- E2E aggiunto per sostituzione, rifiuto e callback ritardato dopo un esito terminale. L’esecuzione browser resta non verificata qui: il runner isolato riceve `ERR_NETWORK_ACCESS_DENIED` sulla porta LAN; il test aggiunto è presente nella suite.

# Asset runtime WebP e caricamento artwork differito 0.3.42 — verifiche locali

- Convertite 39 immagini runtime e lo sfondo della schermata iniziale: 33.964.916 byte PNG diventano 6.024.628 byte WebP (82% in meno); i PNG sorgente restano nel repository e nel registro asset.
- MapDefinition, sorgenti immagine Tiled, manifest artwork PokéAPI e precache PWA ora puntano ai derivati WebP. Il checksum nel manifest è quello dei byte runtime.
- WorldScene non carica più il catalogo grafico Pokémon durante l’avvio. BattleScene carica la squadra, l’avversario e le specie nelle linee evolutive configurate.
- Borgofonte scende da 12,8 MB a 2,5 MB di asset mappa; il Bosco da 13,6 MB a 2,2 MB. Verifica nel browser LAN portrait: scena caricata, immagini renderizzate e console senza errori.
- Build Vite/TypeScript riuscita il 17/10: il bundle contiene lo sfondo WebP da 735 KB invece del PNG da 4,1 MB. Resta l’avviso sul chunk Phaser da 1,48 MB. `npm test` passa con 129 test dominio e 16 test persistenza.
- Validatore contenuti passa con 94 asset, 70 dipendenze inventariate e tutti i pack runtime validati. I 21 test Python passano usando il runtime Python incluso e `TEMP`/`TMP` in workspace; il launcher Windows predefinito non è avviabile in questo profilo.
- Verifica visiva del server LAN su `127.0.0.1:5174`, in portrait: Bosco caricato, HUD e comandi touch presenti, console senza errori o avvisi. È una verifica browser manuale, non sostituisce il test su telefono reale.
- Tentativo Playwright su server LAN: tutti i 43 casi falliscono alla navigazione iniziale per `net::ERR_NETWORK_ACCESS_DENIED` verso `127.0.0.1:5174`; le scene non vengono caricate e i test non valutano il gameplay. L’E2E offline resta da eseguire.
- `gh` è installato, ma il token `GITHUB_TOKEN` e l’account locale risultano non validi; la lista delle pipeline remote non è verificabile da questa sessione.
- Cache PWA aggiornata a `veloria-shell-v59`. Tutti i WebP registrati vengono decodificati e verificati.

# Evoluzioni del primo capitolo 0.3.41 — verifiche locali

- Attivate le due linee Caterpie/Weedle nel contenuto versione 0.3.41. Le soglie 7 e 10 permettono le prime evoluzioni durante gli incontri del Bosco; target, statistiche e artwork sono presenti nel registro MVP.
- La scena di battaglia presenta la nuova specie, il messaggio d’evoluzione e un breve effetto di luce. L’ID stabile, esperienza, mosse e stato restano associati alla creatura salvata.
- `npm test` passato: 126 test dominio e 16 test persistenza. La prova di progressione usa i registri specie e mosse effettivi e verifica Caterpie → Metapod e Weedle → Kakuna a livello 7.
- Build Vite/TypeScript riuscita (resta l’avviso noto sul chunk Phaser da 1,48 MB); `npm test` passato con 128 test dominio e 16 test persistenza; `tools/validate_examples.py` passa su 54 asset, dipendenze e contenuti runtime; `git diff --check` senza errori.
- Aggiunto un E2E che usa la scena reale per controllare messaggio, specie e frame sprite di Metapod; Playwright elenca 43 test in 15 file. Il browser del runner riceve `ERR_NETWORK_ACCESS_DENIED` anche quando Vite è pronto su `127.0.0.1:5183`, quindi l’E2E non è stato eseguito.
- Verifica manuale in una scheda pulita del browser LAN: il Bosco termina il caricamento e mostra la mappa, Ada e il sensore; nessun errore console rilevato. Cache PWA aggiornata a `veloria-shell-v58`.

# Controllare GitHub Actions

GitHub CLI (`gh`) e' gia' installata sul PC. Il repository e' privato: serve un account con accesso.

Da PowerShell, nella cartella del progetto:

```powershell
powershell -File tools/check_github.ps1 -UseStoredLogin
powershell -File tools/check_github.ps1 -UseStoredLogin -RunId 39019222088 -FailedLogs
```

`-UseStoredLogin` usa il login conservato da `gh auth login`: ignora temporaneamente `GH_TOKEN` e `GITHUB_TOKEN`, che possono contenere credenziali scadute. I valori vengono ripristinati in `finally`, senza stamparli o modificare l'ambiente permanente. Omettere l'opzione se si vuole usare un token di ambiente valido.

L'output distingue `in_progress`, `cancelled`, `failure` e `success`: una pipeline in corso non e' una verifica superata. `headSha` permette di confrontare il risultato con `git rev-parse HEAD`.

## Diagnosi browser

Il workflow conserva screenshot, contesti d'errore e trace Playwright per sette giorni nell'artifact `browser-diagnostics-<run>-<attempt>`, anche quando un test fallisce. La prova offline viene eseguita dopo una build riuscita anche se la suite online fallisce, mantenendo comunque la pipeline rossa.

Scaricare gli artifact dal riepilogo della specifica esecuzione su GitHub Actions, oppure:

```powershell
gh run download <run-id> --repo Jacoporusso/veloria --dir test-results-e2e-ci
npx playwright show-trace test-results-e2e-ci/<artifact>/<cartella-test>/trace.zip
```

Il percorso preciso dipende dal test. Se le variabili di ambiente contengono un token scaduto, i comandi `gh` diretti richiedono la stessa rimozione temporanea degli override usata dall'helper.

## Correzione prima installazione PWA — 17 ottobre 2026

La run `39021590968` ha fallito la prova offline con `Execution context was destroyed` durante il primo `controllerchange`. Ora la prima attivazione del service worker prende controllo della pagina senza un ricaricamento superfluo; gli aggiornamenti successivi ricaricano la pagina una sola volta. La prova attende il controller con `waitForFunction`, che sopravvive a eventuali navigazioni di aggiornamento, e mantiene la verifica rigorosa di tutte le risorse MVP in cache.

## Riallineamento scenari al nuovo avvio — 17 ottobre 2026

La run 39028733856 ha concluso 24 test browser con successo e tre fallimenti. E2E-02 assumeva un blocco sulle letture di Elia, mentre il requisito dell’uscita è lo starter; E2E-12 ed E2E-07 non chiudevano il nuovo riepilogo del capitolo nelle loro partite preparate. Le prove ora seguono i prerequisiti effettivi e chiudono il riepilogo con il pulsante del giocatore, verificandone la persistenza. Esecuzione locale mirata: 3/3 passati. Il nuovo risultato remoto va verificato separatamente.

## Diagnosi della run 39031159986

Quattro scenari online e quello offline falliti; non è una pipeline verde. E2E-03 ed E2E-04 mantenevano il vecchio avvicinamento alla soglia nord: dopo l’ampliamento il secondo passo a destra avveniva già in R01, falsando le coordinate e la successiva traversata. Ora usano la destinazione geometrica con arresto al cambio mappa. E2E-09 ha lo stesso budget dei percorsi iniziali completi. I lunghi test di progressione e offline usano prefers-reduced-motion; le prove dedicate agli effetti mantengono le animazioni complete. Gli altri errori erano scadenze durante la traversata o la battaglia: la verifica remota resta necessaria.

Verifica locale successiva: 7/7 regressioni browser passate (Cattura da tastiera, Enter/Spazio sul riepilogo, Pozione, HP/PP/XP, box e medaglia). Il risultato della nuova run GitHub va verificato separatamente.

Anche il percorso PWA offline è passato localmente (1/1, rete disattivata, immagini starter, incontri, cura e Medaglia Aurora). Build, 116 test dominio, 16 persistenza, 20 test Python e validatore dei contenuti passati. Resta la verifica su smartphone fisico.

## Iterazione visiva 0.3.25 — verifiche locali

117 test del dominio e 16 di persistenza passati; validatore contenuti (45 asset registrati) e 20 test Python passati. Presentazione della battaglia verificata a 390×844,320×568,844×390. Pidgey visibile e copertura immagini 20/20 verificata; ridimensionamento mediante ResizeObserver condiviso dall’app e dalla fixture. Sequenza sensore→Ada→uscita verificata tramite controlli reali su fixture isolata dichiarata, senza incontri casuali; scala del terreno e layout portrait/landscape controllati. Questo test non sostituisce il playtest naturale e la QA su telefono fisico.

La run precedente 39033589562 ha superato la suite online ma è scaduta nel percorso offline a 240 secondi, durante la consegna delle rilevazioni nel bosco. Il percorso lungo conserva tutte le asserzioni; budget del test portato a 8 minuti, step a 9 e job a 30 per ottenere un esito completo sul runner Linux. Questo adeguamento non è una conferma di pipeline verde o di prestazioni su smartphone.

Prova offline locale finale con gli asset 0.3.25: passata 1/1 in 1,9 minuti (build inclusa nel comando, 2 minuti complessivi). Gli atlas nuovi sono dichiarati e precacheati. Verifica su telefono fisico e nuova run remota restano separate.


## Atlante illustrato Borgofonte 0.3.26 — verifiche locali

Build TypeScript/Vite riuscita. Validatore contenuti: 46 asset registrati, 78 dipendenze con inventario licenze, 10 mappe runtime validate. Prova browser dedicata 1/1: quattro frame Tiled, dimensioni delle facciate, caricamento e cambio portrait/landscape verificati senza errori JavaScript. Screenshot in test-results-e2e-borgofonte-art.


## Iterazione illustrata 0.3.27 — verifiche locali

- Validatore contenuti: 47 asset registrati, 78 dipendenze con inventario licenze, 10 mappe runtime validate.
- E2E online mirato: 2/2 passati su Borgofonte e Bosco; quattro frame edificio e otto frame botanici, coordinate decorative su celle libere, rotazione portrait/landscape e assenza di errori console.
- E2E-06 offline: 1/1 passato in circa 1,9 minuti. Il test controlla le risorse di tutte le mappe dichiarate nella cache prima di disconnettere la rete, poi completa starter, percorso, incontro, cura e Medaglia Aurora senza rete.
- La build di produzione passa; Vite segnala il chunk JavaScript Phaser oltre 500 kB. La prova Three.js è stata rimossa seguendo la scelta di proseguire con il 2D illustrato.


La 0.3.27 include quattro frame botanici, otto istanze Tiled non collidenti e variazione stabile delle tile HD. Browser E2E controlla frame, dimensioni, celle libere e portrait/landscape; la suite offline verifica il nuovo asset insieme a quelli del pack MVP.


## Iterazione illustrata 0.3.28 — verifiche locali

- Validatore contenuti: 48 asset registrati, 70 dipendenze con inventario licenze, 10 mappe runtime validate.
- Suite di test di dominio e persistenza (`npm run test`): passata.
- E2E online mirato: 3/3 passati su facciate Borgofonte, props del Sentiero e props del Bosco.
- E2E-06 offline: 1/1 passato in 1,9 minuti; PWA e flusso di partita completati senza rete con gli asset dei pack dichiarati.
- Build TypeScript/Vite riuscita. Resta l’avviso preesistente per il chunk JavaScript Phaser oltre 500 kB.

## Iterazione illustrata 0.3.29 — verifiche locali

- Build TypeScript/Vite riuscita; test di dominio e persistenza: 117 + 16 passati.
- Validatore contenuti: 49 asset registrati, 70 dipendenze con inventario licenze, 10 mappe runtime validate.
- E2E online mirato: 3/3 passati su facciate Borgofonte e props del Sentiero e del Bosco.
- E2E-06 offline: 1/1 passato in circa 2 minuti con terreno v3 e nuovi atlanti dichiarati in cache.
- La pagina live sulla rete locale apre Bosco dei Veli e mostra i comandi touch. GitHub Actions non verificabile in questa sessione: `gh` è installato, ma le credenziali GitHub salvate restituiscono HTTP 401. La pipeline remota resta da verificare dopo il rinnovo dell'accesso.
- Vite continua a segnalare il chunk Phaser oltre 500 kB. La prova visiva del terreno su telefono resta necessaria: il rendering è corretto, ma il motivo del sottobosco è ancora fitto.

## Terreno Bosco e compositing tile 0.3.31 — verifiche locali

- Build TypeScript/Vite riuscita; test di dominio e persistenza: 122 + 16 passati.
- Validatore contenuti: 51 asset registrati, 70 dipendenze con inventario licenze, 10 mappe runtime validate.
- E2E mobile a 390×844: 3/3 passati su facciate Borgofonte, props del Sentiero e Bosco; il test controlla la presenza dell'atlante v5 e della superficie terrain composta, senza errori console.
- Screenshot Playwright del Bosco revisionato: il sottosuolo a grandi campiture è leggibile e non mostra fessure fra tile dopo il compositing alla risoluzione mappa.
- E2E-06 offline: 1/1 passato in 2 minuti con l’atlante v5 precaricato.
- La modifica al rendering non tocca collisioni, coordinate o dati Tiled. Vite segnala ancora il chunk Phaser oltre 500 kB. GitHub Actions non è stata verificata: le credenziali `gh` disponibili risultano non valide (HTTP 401).

## Uniformità visiva mappe iniziali 0.3.32 — verifiche locali

- Build TypeScript/Vite riuscita; test di dominio e persistenza: 122 + 16 passati.
- Validatore contenuti: 51 asset registrati, 70 dipendenze con inventario licenze, 10 mappe runtime validate.
- E2E mobile a 390×844: 3/3 passati. Borgofonte, Sentiero dell’Alba e Bosco dei Veli dichiarano e caricano la stessa texture v5 seamless; facciate e props mantengono i frame Tiled attesi.
- E2E-06 offline: 1/1 passato in 2 minuti con la nuova cache `veloria-shell-v49`; la partita completa fino alla Medaglia Aurora resta giocabile senza rete.
- Vite mantiene l’avviso sul chunk Phaser oltre 500 kB. GitHub Actions resta non verificabile perché le credenziali `gh` salvate restituiscono HTTP 401.

## Avvio differito del motore 0.3.33 — verifiche locali

- `npm run build`: passata. L’entry JavaScript iniziale è 16,94 kB (6,09 kB gzip); Phaser (1,48 MB, 340 kB gzip) e WorldScene sono moduli caricati dopo la scelta della sessione.
- `npm test`: 122 test dominio e 16 test persistenza passati. Validatore contenuti: 51 asset registrati, 70 dipendenze inventariate e tutti i contenuti runtime validati.
- La cache PWA passa a `veloria-shell-v50`. Il service worker legge tutte le entry del manifest Vite e precarica anche i chunk dinamici; i test offline precedenti a questa modifica restano evidenza del flusso PWA generale, non una nuova run dopo la divisione dei chunk.
- Verifica browser manuale sulla schermata iniziale: titolo, Continua/Nuova partita e schermata di gioco disponibili, nessun errore console. Nuovo E2E `lazy-engine-load.spec.ts` verifica che Phaser e WorldScene non vengano richiesti prima dell’avvio e che il canvas compaia poi.
- La suite Playwright locale non ha prodotto un esito E2E: il runner è rimasto in attesa del proprio server; con Vite avviato manualmente, un nuovo tentativo ha provato a lanciare un secondo server sulla stessa porta (`Port 5183 is already in use`). Il nuovo E2E resta da eseguire con il web server gestito dal runner. GitHub Actions resta non verificabile per credenziali `gh` HTTP 401.

## Variazione del terreno per coordinata 0.3.34 — verifiche locali

- Build TypeScript/Vite riuscita; `npm test` passato con 122 test dominio e 16 persistenza. Validatore: 51 asset, 70 dipendenze inventariate e contenuti runtime validati.
- I test mirati di seamless tileset e variazione per coordinata passano 5/5. Il browser LAN mostra il Bosco aggiornato, senza errori console; le mappe Tiled, collisioni e passaggi restano invariati.
- Cache PWA aggiornata a `veloria-shell-v51`. La suite offline dopo questa variazione e il caricamento differito resta da eseguire.
- I config Playwright avviano direttamente Vite tramite Node e accettano `VELORIA_E2E_BASE_URL` per riusare un server già attivo. Il test contro il server LAN esce con `ERR_NETWORK_ACCESS_DENIED` dal browser Playwright sandbox; il server LAN resta accessibile nel browser normale. L’avvio del server gestito dal runner non raggiunge lo stato ready in questo ambiente. GitHub Actions rimane non verificabile per credenziali `gh` HTTP 401.

## Terreno illustrato per le rotte forestali 0.3.35 — verifiche locali

- Build TypeScript/Vite riuscita; `npm test`: 122 test dominio e 16 test persistenza passati. I validatori di asset, licenze, rendering mappa e schema JSON terminano tutti con codice 0; `git diff --check` non segnala errori.
- Viale delle Fronde, Terrazze del Muschio e Radicelmo dichiarano l'atlante v5 e usano GID 7 per il terreno base, come il Bosco dei Veli. Geometria, oggetti, collisioni, uscite e incontri non sono stati ridisegnati.
- Verifica manuale nel browser LAN: Viale delle Fronde carica il sottobosco illustrato e la strada, senza errori console. Il ricaricamento ha eliminato la vista sabbiosa precedente, servita dalla pagina rimasta aperta prima dell'aggiornamento. E2E dedicato presente per tutte e tre le mappe, ma non eseguito qui: Playwright sandbox non raggiunge il server LAN (`ERR_NETWORK_ACCESS_DENIED`) e il server gestito dal runner non diventa pronto.
- Cache PWA aggiornata a `veloria-shell-v52`. Vite segnala ancora il chunk Phaser oltre 500 kB. GitHub Actions resta non verificabile per credenziali `gh` con risposta HTTP 401.

## Variazione cromatica continua del sottobosco 0.3.36 — verifiche locali

- Il renderer mantiene il compositing statico unico e varia gradualmente la tinta delle celle con prato ombreggiato. Un test di dominio controlla determinismo, gamma cromatica, transizioni spaziali e isolamento dagli altri materiali.
- Build TypeScript/Vite riuscita; `npm test`: 123 test dominio e 16 test persistenza passati. Validatori asset, licenze, rendering e schema terminati con codice 0; `git diff --check` senza errori.
- E2E verifica caricamento del terreno v5 su Viale, Terrazze e Radicelmo. Il file è elencato da Playwright, ma il test browser non è stato eseguito in questa sessione; il runner locale resta limitato dall'accesso LAN negato al browser sandbox.
- Cache PWA aggiornata a `veloria-shell-v53`. La qualità visiva richiede ancora una verifica su schermo portrait dopo il refresh della pagina in esecuzione.
## Fondo forestale privo di percorsi 0.3.38 — verifiche locali

- Build TypeScript/Vite riuscita; `npm test` passato con 122 test dominio e 16 test persistenza.
- Validatori contenuti, schema, asset e licenze terminati con codice 0.
- Sostituito l'underlay dei quattro ambienti forestali con una base di solo terreno, senza strada incorporata; percorsi e collisioni restano governati da Tiled.
- Uniformati a `3×2` i metadati dell'atlante NPC condiviso che causavano il conflitto nel registro asset e impedivano l'avvio.
- Verifica visiva live su Viale delle Fronde: la pagina completa il caricamento, mostra il fondo senza strada incorporata e mantiene la strada Tiled; la console della sessione pulita non registra errori o avvisi. Cache PWA aggiornata a `veloria-shell-v55`.
## Dettagli del Bosco senza campiture rettangolari 0.3.39 — verifiche locali

- Tolte 91 tile GID 10 da `terrain_detail` nel Bosco. La verifica portrait mostra fondo uniforme, sentiero conservato e nessun rettangolo scuro; coordinate, collisioni e passaggi non cambiano.
- La mappa resta caricabile sulla PWA LAN. Cache PWA aggiornata a `veloria-shell-v56`.
- E2E mirati non eseguiti: il server gestito da Playwright non apre la porta 5183 né produce output entro il timeout; il controllo in browser LAN è completato manualmente e la lista dei 42 test viene caricata correttamente.
## NPC Rami e Leda e avvio delle mappe esterne 0.3.40 — verifiche locali

- Aggiunti sprite autonomi e dati `sprite` mancanti per Guida Rami e Custode Leda; il validatore ora rileva gli NPC senza asset o con frame fuori intervallo.
- Build TypeScript/Vite e `npm test` passati; validatori mappe, schema, asset e licenze terminati con codice 0. Playwright elenca 42 test in 15 file.
- Verifica browser LAN: Terrazze del Muschio e Radicelmo si avviano; Rami e Leda sono renderizzati e la console della nuova sessione è pulita.
- E2E mirati non eseguiti: il server gestito da Playwright non apre la porta 5183 né produce output entro il timeout; cache PWA `veloria-shell-v57`.

## Diagnosi conclusiva del run 39159924891 (0.3.77)

- Shard 2: monorail si ferma sul testo ancora parziale «Conquista la Med» dopo 8 s; E2E-03 esaurisce 120 s controllando scala canvas/CSS; E2E-04 esaurisce 240 s aspettando movimento nel Bosco a (8,10); E2E-05 esaurisce 120 s durante tap direzionale. Anche il job raggiunge il limite complessivo, ma i singoli timeout non vanno descritti soltanto come timeout globale.
- Offline E2E-06 esaurisce 720 s nell'avvicinamento alla prima console di Gym03, aspettando un cambio di posizione dopo tap. Gli altri tre casi offline, compresa la monorotaia, passano. Non è un errore di avvio del canvas in questa run.
- Log e artefatti letti dal sotto-agente in `.tmp/ci-39159924891-shard2/`; nessuna modifica ai test o al runtime da parte dell'agente. Il testo lento e i timeout di movimento richiedono diagnosi ulteriore; non si dichiarano risolti con P4.
