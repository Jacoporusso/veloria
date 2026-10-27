# Grotte del Cristallo: budget del percorso completo in CI

Le run40468192040,40471009557,40480363245 e40485483922 riportano il limite300s del test completo Brina→R14→D05→rapporto→ritorno, durante `crystal.spec.ts` sul cammino finale R14. La stessa prova passa localmente intorno a1,3min; la run40479185466 era interamente passata con29 job. Non è stata dimostrata una regressione del gioco o uno stallo di IndexedDB.

## Evidenza dalla traccia

Audit read-only delegato a Luna sul trace della run40468192040, conservato privatamente in `.tmp/atlas-ci-journeys3`. Circa260 azioni direzionali totali, comprese prove dirette dei cancelli: non tutte equivalgono a passi riusciti. Nel segmento finale sono dimostrati27 avanzamenti consecutivi, perché il successivo comando del helper viene emesso solo dopo il cambio di posizione salvato.

Cinque tocchi campionati nel ritorno durano543–579ms: circa90ms di risoluzione del locator,92–101ms di controllo visibilità/stabilità,44–48ms di scroll,180–196ms nella fase di input. Il resto è lavoro prima dell’input; nessuna lunga attesa di navigazione successiva. Le letture del salvataggio e i controlli successivi aggiungono circa523–561ms fra fine del tocco e prossimo comando. Questo campione documenta un ritmo vicino a un secondo per passo nel runner, non un rallentamento monotono o una causa unica.

L’ultimo tocco termina a302974ms della traccia; la lettura del salvataggio parte a302976ms, circa24ms prima del cutoff. Il suo esito è censurato dalla fine del test: non prova che il database si sia bloccato. I log delle altre run confermano il timeout nello stesso punto ma non sostituiscono la loro traccia.

## Modifica

Solo il budget complessivo di questo test passa a480s in CI; resta300s locale. Percorso, ricompense, reload, verifica del rapporto e ritorno pedonale restano interi. Un `test.step` identifica esplicitamente l’ultimo ritorno nel report.

Il helper cerca il pulsante per ruolo/nome dentro `.dpad`, conservando la normale actionability di Playwright e senza `force`. Ogni tocco è ora limitato a8s; il controllo già esistente del cambio di posizione persistita resta a8s, con letture fresche di IndexedDB per ogni osservazione. Nessuna cache di coordinate, teletrasporto, salto di passi o modifica del gioco. La selezione dei350 casi browser non cambia.

Un tentativo di polling dentro la pagina non ha dimostrato un vantaggio sufficiente nella prova locale ed è stato rimosso; nessun observer o stato di test è stato aggiunto al runtime. Il nuovo budget riguarda il costo della verifica completa sul runner, non la velocità con cui si muove il personaggio.

## Verifiche

Sei casi locali passati (`.tmp/crystal-budget-final.log`): console e prerequisiti, percorso completo con premio unico e ritorno (1,1min), quattro casi ghiaccio su arresto, rotazione, uscita e ripristino dell’ultimo punto valido. Il budget locale non è stato aumentato. Due prove produzione offline passate: circuito P4 con reload/ritorno18,0s e percorso R16/Piazzale/servizi/ritorno45,0s (`.tmp/navigation-guards-offline.log`). Build passata. Discovery350 casi invariata e verificata. Nuova CI da attestare dopo il push. Questa modifica non certifica la campagna naturale completa né elimina una causa di stallo non dimostrata.
