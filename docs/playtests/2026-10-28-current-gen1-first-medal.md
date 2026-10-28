# Nuova partita GenI: prologo e prima medaglia

Revision runtime `930ebfe5ca74055fbe30ec61f25f6f6f7906b2e1`, contenuti `veloria-content-0.4.27`. Comando: `PLAYTEST_STARTER=Charmander PLAYTEST_PREPARE_GYM=1 node node_modules/@playwright/test/cli.js test tests/playtests/natural-prologue.spec.ts --config=playwright.playtest.config.ts --workers=1`. Tutte le altre variabili PLAYTEST rimosse; nessun backup importato. Un caso passato in 5,3 minuti su Chrome.

Il driver osserva lo stato ma agisce tramite DOM, touch e tastiera. Nuova partita con nome Aurora, starter Charmander livello 5, RNG iniziale 3583262684. Nessuna iniezione di squadra, XP, denaro, bandiere, catture o RNG. Il report integrale è in `2026-10-28-current-gen1-first-medal-report.json`; è una partita sintetica del test, non un salvataggio utente.

Percorso osservato: laboratorio e campione di ricerca, Sentiero dell'Alba, cattura di Pidgey, sensore/Ada nel Bosco, Brumalta, riposo, allenamento reale nel Viale delle Fronde, cattura di Butterfree, acquisto di due pozioni, rompicapo della palestra e vittoria su Mira. Charmander termina al livello 9 con 2/26 PS; Pidgey livello 3 e Butterfree livello 6. Medaglia Aurora e 700 monete alla fine. Squadra e medaglia conservate dopo Salva e torna al titolo / Continua partita; nessun pageerror.

Il report registra anche esiti di battaglia precedenti: l'etichetta generica “Timo battle completed” non significa vittoria; il relativo flag allenatore non è presente. La riuscita finale non viene usata per cancellare le sconfitte della progressione.

Questa prova attesta una progressione guadagnata fino alla prima palestra sul catalogo GenI attuale. Non attesta gli altri starter, le successive sette palestre, la Lega, né una continuità con i backup storici contenenti specie GenII. Restano da percorrere e documentare quei tratti sul roster corrente.
