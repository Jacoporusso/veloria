# Quinta medaglia con progressi guadagnati — 24 ottobre2026

Runtime0.3.126 durante le prove; contenuti botanici della0.3.127 integrati solo dopo il completamento e l'esportazione. Avvio dal backup reale dopo la prima sconfitta Nerea, nessuna modifica a risorse, squadra, esperienza o RNG dopo importazione.

## Seconda sfida conservata

La politica usa le informazioni visibili del matchup: Chinchou contro Tentacool/Krabby, Quagsire contro Lanturn e Stordiraggio quando disponibile. Sconfitta in14 turni, Lanturn a35HP. Chinchou22/1091XP e Quagsire21/323XP;140 monete, una Sfera e nessuna medicina. RNG2985698348. Driver passato in12,3s, esportazione dall'app e checksum verificati. Il risultato negativo resta parte della progressione.

## Allenamento e apprendimento

Dal checkpoint successivo si esce dalla palestra, si mette Quagsire in testa attraverso Squadra e si cammina fino all'habitat nordest dell'Anello Magnetico.31 incontri vinti, nessun KO dei compagni,4446XP guadagnati dal compagno. Cure gratuite ai Centri, nessun acquisto o consumo:140 monete e inventario invariati. Quagsire21/323XP →24/206XP; RNG1468825727. Durata8,1min automatizzati, comprensivi di cammino, menu, cure ed esportazione; non è una misura del tempo umano o dell'allenamento minimo necessario.

Al24 il driver sceglie Amnesia nella schermata di apprendimento e dimentica Colpocoda, mantenendo PP e mosse degli altri slot. La scelta è registrata nel report. Pantanobomba era stata rifiutata in precedenza e resta assente; nessuna mossa viene assegnata retroattivamente. L'uso precedente della politica «Tieni le mosse» limita le conclusioni sul bilanciamento e sulle strategie disponibili.

## Vittoria Nerea

Ritorno a Portolume, riposo e Chinchou in testa tramite UI; Viola già battuta viene saltata senza nuovo premio. Le tre paratoie restano risolte. Vittoria Nerea in12 turni: Tentacool26, Krabby27 e Lanturn28 eliminati, Chinchou KO e Quagsire a25/79HP; Charmeleon e i due Rattata restano vivi. Stordiraggio e Amnesia eseguiti dalla UI, nessuna lettura del comando avversario futuro.

Medaglia Marea, flag allenatrice sconfitta e1400 monete assegnati una volta:140→1540. Nessuno strumento consumato. Chinchou22/1463XP, Quagsire24/1547XP; RNG2520850373. Driver passato in31,7s (32,7totali), zero errori JS. Backup esportato dalla UI e validato con importSave; squadra, inventario, flag, medaglie e denaro coincidono con l'ultima osservazione del report.

## Artefatti e riproduzione

I prefissi `2026-10-24-natural-nerea-rotation`, `natural-quagsire24` e `natural-nerea-won` conservano report e relativo `-backup-charmander.json`. Tutti e tre i backup passano checksum e confronto con i report. Le contentVersion storiche0.3.114 dei salvataggi sono mantenute, distinte dal runtime eseguito.

Allenamento: PLAYTEST_RESUME_NEREA_BACKUP al file rotation, PLAYTEST_TRAIN_WOOPER=1, PLAYTEST_TRAIN_TARGET=24, PLAYTEST_LEARN_MOVES=amnesia:tail-whip, PLAYTEST_DAMAGE_FIRST=1. Sfida: backup quagsire24, PLAYTEST_NEREA_CHALLENGE=1, PLAYTEST_COAST_ROTATION=1, PLAYTEST_NEREA_ROTATION=1, PLAYTEST_DAMAGE_FIRST=1. Un solo driver per esecuzione; comandi tramite DOM/touch/tastiera.

**Checkpoint più avanzato guadagnato:** `2026-10-24-natural-nerea-won-backup-charmander.json`, palestra di Portolume16,4, cinque medaglie. Sesta–ottava palestra, Lega/finale e le campagne degli altri starter restano da verificare naturalmente. La strategia riuscita non chiude la valutazione di difficoltà, economia o varietà.
