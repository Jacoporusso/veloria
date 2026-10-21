# Partita naturale fino alla seconda medaglia

Versione 0.3.110, 21 ottobre 2026. Prova browser con Charmander, nuova partita senza seed, squadra, livelli, XP, inventario, monete o flag iniettati. Azioni tramite i controlli del gioco; lettura dello stato per osservazione e navigazione. Completata in 7,9 minuti con animazioni/test automatizzato: non è una stima della durata per un bambino.

Percorso: prologo, Mira, archivio di Radicelmo, Nila, Petalora, cure gratuite al Centro, allenamento negli habitat del percorso 04 fino al livello 13, acquisto di tre pozioni con monete guadagnate, puzzle di irrigazione e Dalia.

Dopo Nila: Charmander e Rattata KO, Sentret a 5 HP. Nessuna sconfitta dell'intera squadra; il Centro permette di recuperare. È un segnale da verificare con altre strategie e starter, non una certificazione del bilanciamento.

Dopo Dalia: Charmander livello 14, 26/34 HP; due medaglie, due pozioni e 1600 monete. Ritorno al titolo e ripresa conservano squadra, mosse/PP, progressi, inventario e monete. Report completo: `2026-10-21-natural-second-medal-charmander.json`.

Questa prova precede l'aggiunta delle collisioni degli altri 13 NPC (Nila era già solida). Le modifiche geometriche successive hanno verifiche separate. Non attesta gli altri starter, la campagna dopo Dalia o dispositivi fisici.

Riproduzione: VELORIA_E2E_BASE_URL=http://127.0.0.1:5174, PLAYTEST_STARTER=Charmander e PLAYTEST_CONTINUE_PETALORA=1; eseguire Playwright con playwright.playtest.config.ts.
