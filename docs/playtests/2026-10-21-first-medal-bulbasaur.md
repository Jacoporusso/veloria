# Partita naturale Bulbasaur fino alla prima medaglia

21 ottobre2026, contenuti0.3.113. Nuova partita con nome allenatore, starter, controlli reali DOM/touch/tastiera; nessuna squadra, XP, livello, moneta, seed o flag iniettato. Prova automatizzata passata in4,4min: non misura il tempo di lettura/esplorazione di un bambino.

## Risultato osservato

Dieci battaglie: sette vittorie del giocatore, due sconfitte dell’intera squadra contro selvatici e una cattura di Hoothoot4. Il tipo di esito `won` da solo non prova una vittoria del giocatore: il report distingue esplicitamente `winner: player/opponent`. Le sconfitte e il recupero restano nei dati; non è una partita senza sconfitte.

Sera e Timo superati; Parassiseme appresa, Ada e sensore completati, arrivo a Brumalta con Bulbasaur KO e Hoothoot a2HP. Cure al Centro, preparazione reale nel Viale delle Fronde fino a Bulbasaur8, rifornimenti e puzzle della palestra. Mira battuta: Bulbasaur9 a5/27HP, Hoothoot5 integro,850monete, nessuna pozione o Poké Ball residua. Frustata appresa in uno slot libero durante la progressione, con la nuova schermata informativa. Ritorno al titolo e ripresa conservano identità, squadra, HP/PP e prima medaglia. Nessun errore JavaScript.

Report completo: [dati della partita](2026-10-21-natural-first-medal-bulbasaur.json). Riproduzione: server5174, VELORIA_E2E_BASE_URL=http://127.0.0.1:5174, PLAYTEST_STARTER=Bulbasaur, nessuna variabile CONTINUE attiva; Playwright con playwright.playtest.config.ts.

## Limiti e prossimi passi

La politica sceglie fra danni stimati ed effetti di preparazione disponibili, usa lo starter finché possibile, cattura con HP nemici ridotti e cura con pozioni sotto metà HP. Non pianifica una squadra ottimale o un bilancio prudente degli oggetti. Le due sconfitte e le scorte esaurite segnalano fragilità dell’inizio, da confrontare con Squirtle/Pikachu e strategie diverse prima di cambiare difficoltà o ricompense. Il test prepara il livello8 dalla squadra di Mira; non esiste un gate runtime di livello. Questa prova copre il prologo e la ripresa, non le altre sette medaglie, il finale o dispositivi fisici.
