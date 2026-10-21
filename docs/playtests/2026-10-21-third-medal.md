# Partita naturale dall'inizio alla terza medaglia

21 ottobre2026, contenuti0.3.111. Nuova partita con Charmander, controlli DOM/touch/tastiera reali, nessuna squadra, livello, XP, seed, moneta, inventario o flag iniettato. Lettura dello stato per osservazione e scelta dei percorsi. Prova automatizzata passata in12,9min (13min complessivi), non una stima della durata per un bambino.

## Percorso osservato

Borgofonte e laboratorio, Sera/Timo, due catture, Ada e sensore, Brumalta/Mira, seme e archivio di Radicelmo, Nila, Petalora/Dalia, Oren, Lea a Vetracielo, Centro, parco, bottega, console Giardini → Vetro → Cielo, Aster. Salvataggi e riprese dopo archivio, seconda e terza medaglia conservano i progressi previsti.

29 battaglie registrate:27 vittorie e2 catture, nessuna sconfitta dell'intera squadra in questa esecuzione. Nila lascia due membri KO e Rattata6 a2HP; Oren lascia due KO e Rattata7 a3HP. Il tentativo precedente aveva perso contro Oren: non viene cancellato né reinterpretato come vittoria (`2026-10-21-natural-oren-first-attempt.json`). Il nuovo test prevede recupero e rivincita dopo preparazione se necessario; in questa esecuzione Oren è stato battuto al primo tentativo, quindi il ramo di rivincita non è attestato.

Prima di Dalia:9 incontri d'allenamento sul percorso04, obiettivo13. Prima di Aster:9 incontri nel parco di Vetracielo, obiettivo17, evoluzione naturale Charmander → Charmeleon. Cure gratuite e acquisti usano i servizi del gioco; comprate cinque pozioni prima di Aster, quattro consumate durante la sfida. Risultato:Charmeleon17 a14/46HP, Rattata3 eRattata7 integri; tre medaglie,1490monete, una pozione e una Poké Ball. Identità, livelli,HP,PP, inventario, denaro e medaglie conservati dopo ritorno al titolo.

Report completo: `2026-10-21-natural-third-medal-charmander.json`. Screenshot della terza medaglia prodotto dagli artifact Playwright. Nessun errore JavaScript.

## Limiti e prossime verifiche

La politica del test usa lo starter finché possibile, tiene le quattro mosse esistenti alle proposte di apprendimento e non pianifica una squadra ottimale. Concentrare gli XP sul primo membro spiega parte dello squilibrio interno della squadra. Queste scelte non sono regole o raccomandazioni imposte al giocatore: prima di modificare roster e difficoltà servono prove con cambi, apprendimenti e catture differenti.

Il livello di preparazione è scelto dal test dalla squadra del leader; non esiste un gate runtime di livello. La durata automatizzata non misura tempi di lettura/esplorazione su telefono. Restano gli altri tre starter, strategie diverse, campagna da Ferraluce al finale, verifica fisica iOS/Android e il ramo di rivincita non eseguito. Questa prova non certifica l'intera avventura.

Riproduzione: server LAN5174, VELORIA_E2E_BASE_URL=http://127.0.0.1:5174, PLAYTEST_STARTER=Charmander, PLAYTEST_CONTINUE_VETRACIELO=1; Playwright con playwright.playtest.config.ts.
