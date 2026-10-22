# Partita naturale Squirtle fino alla prima medaglia

21 ottobre2026, contenuti0.3.113. Nuova partita con controlli reali e senza preparare squadra, XP, livelli, denaro, inventario, flag o seed. Stessa politica del test Bulbasaur, incluso allenamento fino al livello8 prima di Mira. Passata in3,6min automatizzati, non tempo di gioco umano.

Sette battaglie: cinque vittorie del giocatore e due catture (Spinarak2 e Hoothoot5), nessuna sconfitta dell’intera squadra. Sera, Timo, Ada, sensore, Brumalta, cure, acquisti e puzzle Mira completati. Bolla appresa automaticamente con la nuova schermata. Il veleno incontrato prima di Brumalta è stato curato dal servizio reale; nessuna modifica dello stato per aggirarlo.

Mira battuta con Squirtle8 e Spinarak2 KO; Hoothoot5 a10/21HP.850monete, zero pozioni e una Poké Ball residua. Prima medaglia, identità della squadra, HP/PP e progressi conservati al ritorno al titolo e ripresa; nessun errore JavaScript. [Report completo](2026-10-21-natural-first-medal-squirtle.json).

## Confronto e limiti

Bulbasaur aveva richiesto dieci battaglie con due sconfitte contro selvatici; Squirtle sette senza sconfitte complete. Il gioco usa il seed iniziale fisso1234567; azioni, starter e orari producono sequenze e catture diverse: non è un confronto statistico della forza degli starter. Entrambi consumano tutte le pozioni prima/durante la prima palestra. La politica del test non torna al letto gratuito di Borgofonte dopo Sera/Timo: questo limita ogni conclusione sulla disponibilità assoluta di cure. Dal contenuto0.3.114 Elia e Sera spiegano quel servizio esistente. Non si cambiano squadre, meccaniche o ricompense in base a queste due sole esecuzioni.

Restano Pikachu, strategie diverse e seguito della campagna con questi starter, oltre alla prova fisica mobile. Riproduzione: server5174, VELORIA_E2E_BASE_URL=http://127.0.0.1:5174, PLAYTEST_STARTER=Squirtle, nessuna variabile CONTINUE attiva; playwright.playtest.config.ts.

Nota di audit22/10: `newGameSave()` inizializza rngState a1234567. Il test non lo sostituisce, ma questo non rende le prove campioni casuali indipendenti. L’inizializzazione casuale delle nuove partite resta un requisito da completare, mantenendo la riproducibilità dei salvataggi e dei test con seed esplicito.
