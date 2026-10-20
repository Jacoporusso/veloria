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
