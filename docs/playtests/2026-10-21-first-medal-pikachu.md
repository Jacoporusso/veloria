# Partita naturale Pikachu fino alla prima medaglia

21 ottobre2026, contenuti0.3.114. Nuova partita con controlli DOM/touch/tastiera, nessun seed, squadra, livello, XP, risorsa o flag iniettato. Stessa politica dei precedenti test Bulbasaur/Squirtle: preparazione reale fino al livello8 prima di Mira, nessun ritorno al letto di casa. Passata in4,7min automatizzati, non una misura della durata per un bambino.

Tredici battaglie: dodici vittorie del giocatore e una cattura di Hoothoot5; nessuna sconfitta dell’intera squadra. Sera/Timo, Ada/sensore, Brumalta, cure, acquisti, preparazione selvatici, puzzle e Mira completati. Hoothoot catturato paralizzato, poi curato al Centro reale. Dopo Mira: Pikachu8 KO, Hoothoot6 a15/23HP,850monete, zero pozioni e quattro Poké Ball. Prima medaglia, identità, squadra, HP/PP e progressi persistono dopo titolo/ripresa. Nessun errore JavaScript. [Report completo](2026-10-21-natural-first-medal-pikachu.json).

## Lettura dei risultati

Con Charmander fino alla terza medaglia e i tre report fino a Mira esiste ora almeno una prova naturale del prologo per ogni starter. Non è una certificazione del bilanciamento per tutti: il seed iniziale è quello fisso del gioco (1234567), mentre azioni, orari e catture differiscono, il test privilegia lo starter, usa una soglia di cura fissa, sceglie gli effetti da un insieme limitato e mantiene le quattro mosse quando deve dimenticarne una. Tutti i report preservano sconfitte e risorse consumate.

Il letto gratuito di Borgofonte esiste e supera la prova dedicata (HP, PP, veleno, porte e reload). I consigli di Elia/Sera aggiunti in0.3.114 lo rendono più esplicito; la politica di questa esecuzione ancora non ne usufruisce. Prima di cambiare squadre o premi servono strategie con riposo, cambi e apprendimenti diversi, poi il seguito della campagna. QA fisico mobile ancora aperto.

Riproduzione: server5174, VELORIA_E2E_BASE_URL=http://127.0.0.1:5174, PLAYTEST_STARTER=Pikachu, nessuna variabile CONTINUE attiva; playwright.playtest.config.ts.

Nota di audit22/10: `newGameSave()` inizializza rngState a1234567. Il test non lo sostituisce, ma questo non rende le prove campioni casuali indipendenti. L’inizializzazione casuale delle nuove partite resta un requisito da completare, mantenendo la riproducibilità dei salvataggi e dei test con seed esplicito.

Aggiornamento0.3.115: l’inizializzazione casuale delle nuove avventure è implementata e verificata separatamente. I risultati storici di questo report conservano il seed fisso della loro versione e non diventano campioni indipendenti retroattivamente.
