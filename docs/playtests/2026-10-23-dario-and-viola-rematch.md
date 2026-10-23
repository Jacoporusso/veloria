# Preparazione con Dario e seconda prova contro Viola

Runtime 0.3.121, 23 ottobre 2026. Due percorsi consecutivi dal backup realmente guadagnato dopo Iris. Nessuna scrittura di livelli, XP, strumenti, denaro, flag o RNG dopo l’importazione dalla UI. I comandi sono quelli del gioco. Entrambi i driver sono passati e non hanno registrato errori JavaScript; ciò non implica vittoria in entrambi gli incontri.

## Dario: vittoria e ritorno

Partenza a Portolume: Chinchou21/1143XP, Charmeleon23/1282XP, Rattata3 e7;840 monete, due Sfere, nessuna Pozione. Tre Pozioni comprate al mercato per600; cammino attraverso la Costa e Ferraluce, cure gratuite e ingresso nel Condotto Risonante. Sfida a Dario(18,18).

Vittoria in13 turni contro Mareep21, Wooper22 e Magnemite22. Tre Pozioni consumate, Chinchou e Charmeleon KO, nessuna sconfitta dell’intera squadra. XP assegnati:252 a Chinchou,198 a Charmeleon,306 al primo Rattata;850 monete una sola volta. Ritorno a piedi e cure fino a Portolume.

Finale:1090 monete, nessuna Pozione, due Sfere. Chinchou21/1395XP, Charmeleon24/97XP, Rattata6/117XP e Rattata7/28XP, tutti curati. RNG2176718721 →3933954000. Driver passato in2,7min. Backup esportato dall’app, checksum e squadra/inventario/flag/medaglie/denaro confrontati con il report.

## Viola: seconda sconfitta conservata

Dal precedente backup si acquistano una Superpozione700 e una Pozione200: restano190 monete. La politica del driver cura sotto il60% HP invece del50% del primo tentativo. È una scelta del giocatore automatizzato, senza cambiare danni, probabilità o IA del gioco. Priorità alle mosse di danno, sostituzione del KO con il primo compagno disponibile; nessuna ottimizzazione completa di cambi e stati.

Sconfitta in14 turni: Tentacool24 e Krabby24 eliminati, Chinchou25 avversario rimasto a18 HP. Entrambi i consumabili usati. Il prototipo soccorre e cura la squadra dopo il KO totale, ma non assegna premio o flag vittoria. Il nostro Chinchou arriva al22 con4XP; Charmeleon24/430XP, Rattata6/117XP e7/28XP. Restano190 monete e due Sfere, quattro medaglie; Nerea non affrontata. RNG finale verificato nel backup. Driver passato in36,6s (37,7s totale); checksum e corrispondenza del report verificati.

Il percorso dimostra che Dario offre risorse realmente ottenibili, ma questa composizione e questa politica non superano ancora Viola. Il prossimo esperimento deve valutare catture e composizione, cambi manuali e mosse di stato, senza dedurre da due sconfitte che la palestra sia impossibile o introdurre premi artificiali.

## Riproduzione

Dario: `PLAYTEST_RESUME_NEREA_BACKUP=docs/playtests/2026-10-23-natural-iris-recovery-backup-charmander.json`, `PLAYTEST_PREPARE_DARIO=1`, `PLAYTEST_DAMAGE_FIRST=1`.

Viola: `PLAYTEST_RESUME_NEREA_BACKUP=docs/playtests/2026-10-23-natural-dario-preparation-backup-charmander.json`, `PLAYTEST_NEREA_CHALLENGE=1`, `PLAYTEST_DAMAGE_FIRST=1`, `PLAYTEST_HEAL_THRESHOLD=0.6`, `PLAYTEST_EXTRA_POTION=1`. Non attivare contemporaneamente altri driver di preparazione.

Report e backup sono i file `2026-10-23-natural-dario-preparation-*` e `2026-10-23-natural-viola-rematch-*` in questa cartella. La contentVersion storica del salvataggio resta0.3.114, distinta dal runtime0.3.121.
