# Prima sfida naturale a Selene — 24 ottobre 2026

## Partenza e preparazione

Backup guadagnato Eevee29 con Morso:3340 monete, cinque medaglie, squadra Eevee29/Drowzee29/Quagsire25/Chinchou22/Charmeleon24. Runtime0.3.129; RNG1733980911 conservato. Riposo gratuito e acquisto dal mercato di Acquariva tramite quantità: quattro Superpozioni a700 e due Pozioni a200, totale3200;140 monete residue. Nessuna risorsa assegnata dal driver.

Ingresso reale17,6 nella palestra. Quattro specchi ruotati attraverso i comandi visibili nell'ordine quarto/secondo/primo/terzo, leggendo le etichette dei nodi del puzzle: sinistra/destra/alto/alto. Flag `gym06_reflections_aligned` ottenuto; backup esportato dalla UI prima della battaglia (`2026-10-24-natural-selene-prebattle-backup-charmander.json`). Il puzzle può essere raggiunto e completato con il salvataggio guadagnato, senza teletrasporto o flag aggiunti.

## Esito

Selene vince in17 turni. Hypno35 resta3/104HP; Slowbro37 ed Espeon38 non entrano. Sei strumenti usati e cinque KO; nessun premio, medaglia o XP ricevuti. Il driver preferisce il danno visibile e cura sotto il50%HP, senza una politica dedicata contro sonno/confusione. Non dimostra il risultato di una strategia umana ottimale.

Prova passata in1,1min, zero errori JS: il passaggio attesta percorso, acquisti, puzzle, gestione della sconfitta ed export, non una vittoria su Selene. Backup/report `2026-10-24-natural-selene-lost*` conservati. A fine sconfitta il gioco ripristina HP/PP della squadra, ancora nella palestra16,3; non è dichiarato un ritorno al Centro in questo driver.

Checksum di entrambi gli export verificati. Squadra/box/medaglie uguali al backup di partenza, inventario tornato ai valori iniziali dopo il consumo delle sei cure, denaro140, puzzle persistente e nessuna Medaglia Riflesso. RNG1600901464 conservato: il checkpoint dopo la sconfitta è cronologicamente il più avanzato e non viene sostituito con quello prima della lotta per scegliere un seed favorevole.

## Limiti e seguito

Maya e Selene restano da vincere. Il divario di livelli e la gestione degli status richiedono una valutazione della preparazione disponibile; il dato non giustifica da solo abbassare il livello dei nemici o alterare le mosse ufficiali. Non si presenta la campagna come completata. Preparazione futura dal checkpoint dopo la sconfitta, senza restituire denaro o medicine consumate.

Driver: `PLAYTEST_SELENE_CHALLENGE=1`, `PLAYTEST_RESUME_FIFTH_BACKUP` al backup Eevee guadagnato, `PLAYTEST_DAMAGE_FIRST=1`. Questo scenario acquista prima della sfida, quindi richiede denaro sufficiente; il checkpoint dopo la sconfitta richiede prima nuova preparazione. File `tests/playtests/helpers/selene-attempt.ts`.
