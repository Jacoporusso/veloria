# Preparazione di Quagsire, vittoria su Viola e prima sfida Nerea

Runtime0.3.125,24 ottobre2026. Continuazione del checkpoint dopo la cattura reale di Wooper18. Tutte le azioni dopo importazione avvengono con comandi di gioco; nessuna risorsa, mossa, flag vittoria o XP viene assegnato dal driver. Le importazioni conservano il cursore RNG guadagnato.

## Allenamento ed evoluzione

Wooper viene messo in testa dal menu Squadra. Cammino reale Portolume–Costa–Ferraluce–Anello Magnetico e habitat nordest; cure gratuite ai Centri. Due fasi consecutive, con backup esportato e verificato fra le due:12 vittorie in5,5min, poi altre4 in3,6min automatizzati.16 incontri vinti, nessun KO della squadra,2326XP totali per il compagno; nessun denaro o consumabile speso. I tempi includono spostamenti, menu, cure ed esportazione e non sono una misura del tempo di gioco umano.

Wooper18/0XP →19/687XP →Quagsire20/158XP. Evoluzione al20 osservata una volta negli eventi; stessa instanceId, entrambe le forme registrate come catturate, nuova forma conservata nelle importazioni successive. Finale curato a Portolume,190 monete e una Sfera. RNG1587642285 →3063217382 →4266692222. Entrambi i driver passati, nessun errore JS; checksum e corrispondenza di squadra/inventario/flag/medaglie/denaro fra backup e report verificati.

Il driver di apprendimento conserva le quattro mosse già presenti (Pistolacqua, Colpocoda, Colpodifango, Schianto): questo limita la strategia del test e non dimostra che le nuove mosse siano inutili. La frequenza dei ritorni al Centro e la preparazione necessaria restano elementi da valutare per il pubblico del gioco.

## Viola: sconfitta e cambi di squadra

Tentativo con Quagsire in testa e senza acquisti: sconfitta in14 turni, Tentacool e Krabby eliminati, Chinchou avversario a19HP. XP conservati e nessun premio vittoria. Backup esportato; RNG3284145306.

Dal checkpoint successivo alla sconfitta si torna a Portolume e si mette Chinchou in testa. La politica prova cambi espliciti tramite SQUADRA: Chinchou contro Tentacool, Quagsire contro Krabby/Chinchou quando disponibile con HP sufficienti. Decide da specie/stato visibili, senza leggere il prossimo comando avversario. **Viola battuta in15 turni**, con quattro compagni KO e l’ultimo Rattata appena salito all’8 ancora a22HP. Non è una vittoria comoda o prova statistica di equilibrio.1050 monete assegnate una volta:190→1240.

Ritorno e Centro, acquisto reale di una Superpozione700 e due Pozioni400:140 monete rimaste. Ingresso nella palestra. Questo primo driver completo si ferma perché l’avvicinamento alla leva assumeva percorribile la casella d’acqua8,19. La vittoria e gli acquisti sono conservati, ma non si dichiara quel driver interamente passato.

## Interruzioni dei driver e provenienza

Un precedente tentativo dei cambi era stato interrotto prima di risolvere la battaglia: il driver toccava la scritta decorativa SQUADRA invece della barra dei comandi. Il selettore touch ora preferisce il tab nominato. Ripetizione dal medesimo checkpoint/RNG, senza scegliere un seed favorevole. Report incompleto conservato con nome `natural-coast-rotation-driver-failure`.

Lo stato all’ingresso palestra è recuperato dall’ultima osservazione completa, in sola lettura, della traccia. Il file source conserva evento e SHA-256 della traccia; valori di squadra/inventario/flag/denaro confrontati col report, envelope creato con exportSave e roundtrip/checksum verificati. Nessun valore di gioco viene modificato per il recupero.

Dopo il recupero, le tre leve sono risolte avvicinandosi dalle caselle percorribili. Un secondo errore del driver leggeva l’esito prima dell’avvio effettivo della scena di lotta e restava bloccato nell’esportazione: prova interrotta, **nessun risultato Nerea contato**. Era stato inizialmente annunciato come sconfitta e poi corretto. Checkpoint completo con le tre leve conservato dalla traccia in sola lettura; RNG2861760825 invariato. Il driver ora attende `world.battleActive`/scena pronta prima di comandare o leggere un esito.

## Prima battaglia effettiva contro Nerea

Dal checkpoint con leve risolte: **sconfitta in16 turni**. Tentacool26 e Krabby27 eliminati; Lanturn28 a56/108HP. Una Superpozione e due Pozioni consumate,140 monete e una Sfera rimaste. Nessuna medaglia Marea o ricompensa Nerea assegnata. Il prototipo soccorre e cura dopo KO totale: gli HP pieni nel backup non indicano vittoria.

XP ottenuti: Chinchou22/719XP, Quagsire20/1209XP; Charmeleon24, Rattata6/8. Il driver corretto passa in12,9s (14s totale), registra l’esito negativo ed esporta il backup dall’app. Zero errori JS, checksum e confronto con report verificati. RNG finale588779730. La quinta medaglia e i capitoli successivi restano da verificare con progressione naturale.

## Artefatti e riproduzione

I file `2026-10-24-natural-wooper-training-stage1-*` e `stage2-*` conservano le due fasi; `natural-wooper-trained-backup` è il checkpoint evoluto. `natural-quagsire-viola-attempt-*` conserva la sconfitta. `natural-viola-win-gym-entry-*`, `natural-viola-win-source` e `natural-viola-won-gym-entry-backup` conservano vittoria e recupero. `natural-nerea-ready-*` conserva il checkpoint pre-sfida; **`2026-10-24-natural-nerea-first-attempt-backup-charmander.json` è il punto più avanzato guadagnato**.

Usare PLAYTEST_RESUME_NEREA_BACKUP con il file scelto. Allenamento: PLAYTEST_TRAIN_WOOPER=1. Rivincita con cambi: PLAYTEST_NEREA_CHALLENGE=1, PLAYTEST_SKIP_SUPPLIES=1, PLAYTEST_COAST_ROTATION=1. Ripresa dalla palestra: PLAYTEST_NEREA_CHALLENGE=1. Politica usata: PLAYTEST_DAMAGE_FIRST=1, soglia cure0.6 nella sfida; un solo driver di preparazione per esecuzione. Le contentVersion storiche dei salvataggi restano0.3.114, distinte dal runtime0.3.125.
