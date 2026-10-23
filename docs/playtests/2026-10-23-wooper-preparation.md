# Ricerca naturale di Wooper nel Condotto

Runtime0.3.121,23 ottobre2026. Continuazione dal backup reale dopo la seconda sconfitta contro Viola. Cinque compagni dopo la cattura, quattro medaglie: nessun progresso della palestra viene assegnato dal test.

## Procedura e risultato

Partenza: Chinchou22, Charmeleon24, Rattata6/7;190 monete, due Sfere e nessuna Pozione. Ritorno dalla Costa a Ferraluce, Centro Pokémon e Condotto Risonante. Ricerca nell’habitat Ovest (zona8–12,8–11), massimo sei giri da20 passi con ritorno al Centro tra i giri; percorso e comandi reali. Il driver fugge dalle altre specie e indebolisce Wooper prima di usare la Sfera. Non legge il comando avversario né modifica RNG, squadra, risorse o flag dopo l’importazione.

Cattura riuscita al terzo giro: nove incontri totali, otto fughe (Voltorb, Magnemite e Mareep) e Wooper18 catturato nel secondo turno, al primo lancio. Alcune fughe richiedono più turni: non sono garantite. Nessun KO della squadra; nessun acquisto o consumabile di cura. Rimane una Sfera. Il risultato non misura una probabilità generale di successo: è un solo percorso con il cursore RNG realmente ereditato.

Wooper:47 HP massimi,0XP, Pistolacqua25PP, Colpocoda30PP, Colpodifango15PP e Schianto20PP dopo le cure. La combinazione Acqua/Terra offre immunità Elettro; non rende immune all’Acqua e non garantisce vittoria contro Viola o Nerea. Non viene evoluto artificialmente.

Ritorno completo a Portolume, cure al Centro, esportazione dall’app. Squadra precedente e livelli invariati,190 monete, stessa dotazione salvo una Sfera consumata, medaglie e premi allenatori invariati. RNG3303935501 →1587642285. Nessun errore JavaScript. Driver passato in4,5min (4,6min totale); checksum del backup e corrispondenza di squadra, inventario, flag, medaglie e denaro con il report verificati.

## Riproduzione e prossima prova

`PLAYTEST_RESUME_NEREA_BACKUP=docs/playtests/2026-10-23-natural-viola-rematch-backup-charmander.json`, `PLAYTEST_PREPARE_WOOPER=1`, `PLAYTEST_DAMAGE_FIRST=1`, con gli altri driver di preparazione disattivati.

Helper `tests/playtests/helpers/wooper-preparation.ts`; report `2026-10-23-natural-wooper-preparation-charmander.json`; backup `2026-10-23-natural-wooper-preparation-backup-charmander.json`. La contentVersion del salvataggio resta storicamente0.3.114; il runtime provato è0.3.121.

Prossimo passo: provare crescita e mosse di Wooper con incontri reali e cambi di squadra, poi rivalutare Viola e la quinta palestra. Non è ancora verificata la vittoria con questa nuova composizione.
