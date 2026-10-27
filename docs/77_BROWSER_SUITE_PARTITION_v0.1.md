# Verifica browser: percorsi illustrati separati

La run40471009557, sui contenuti0.4.13, termina con23 job passati e due fallimenti. «Browser chapters shard9» raggiunge il limite del browser step dopo19 casi passati, lasciando incompleta una selezione di24: i log mostrano molti percorsi illustrati da1–3min consecutivi. «Browser journeys shard3» raggiunge il limite300s del singolo percorso Brina/grotte durante il ritorno R14. Sono due problemi distinti.

## Distribuzione

`playwright.config.ts` assegna automaticamente `*-paths.spec.ts` e `redesigned-interiors.spec.ts` alla suite `world`, escludendoli da `chapters`. La matrice aggiunge quattro shard world, con un solo worker per runner. Restano12 chapters,4 journeys,4 MVP,2 controls,1 league e2 offline:29 job totali. Nessuna modifica ai timeout, alle aspettative o ai percorsi giocati.

`node tools/check_browser_suite_coverage.mjs` confronta la discovery effettiva Playwright senza filtro con quella delle sei suite non offline. Fallisce per casi mancanti, duplicati, inattesi o suite vuote. Usa file, posizione e percorso completo dei describe per distinguere test parametrizzati con titolo identico. Viene eseguito nel primo job chapters.

Verifica locale passata:267 chapters,28 world,17 journeys,16 MVP,6 controls,5 league;339 casi assegnati esattamente una volta. Offline conserva la configurazione dedicata. Il controllo riguarda la selezione dei casi, non prova la loro esecuzione o l’esito della nuova CI.

## Timeout delle grotte ancora aperto

Lo stesso test passa senza modifiche localmente in1,3min (`.tmp/crystal-ci-recheck.log`) e la CI0.4.12 è interamente passata con25 job (`40469908296`). Nelle run0.4.11 e0.4.13, invece, il percorso supera300s. Non è stata applicata una correzione presunta al motore, né aumentato il limite o accorciato il ritorno. La nuova partizione risolve il sovraccarico di selezione del job chapters; non dimostra di risolvere questo timeout intermittente del singolo caso.

Log acquisiti in `.tmp/d06-ci-chapters9.log` e `.tmp/d06-ci-journeys3.log`. Run40479185466 del commit32d5106 completata SUCCESS con29 job passati, compreso il percorso delle grotte. Conferma della copertura eseguita per quella revisione; nessuna prova che il timeout intermittente del singolo caso sia definitivamente risolto. Nessuna variazione del runtime o della cache pubblica v176 per questa modifica di verifica.
