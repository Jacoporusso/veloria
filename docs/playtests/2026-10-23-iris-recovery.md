# Recupero dopo Viola: Iris e ritorno a Portolume

Runtime0.3.119,23/10/2026. Il driver importa dalla UI il backup reale dopo la sconfitta contro Viola, confrontando squadra, inventario, denaro e RNG. Nessuna risorsa o vittoria viene aggiunta per preparare il test.

Partenza: Chinchou21 con741 XP, Charmeleon23 con1282 XP, Rattata3/7;190 monete, due Sfere, un Antidoto, nessuna Pozione/Superpozione. Il prototipo aveva già curato la squadra dopo la sconfitta. Quattro medaglie; Iris e Viola ancora non battute.

## Percorso ed esito

Ritorno a piedi dalla costa a Ferraluce, Centro Pokémon e Anello Magnetico. Sfida accettata parlando con Iris(21,16). **Vittoria in cinque turni**, contro Voltorb17 e Wooper18. Chinchou guadagna240+162 XP, arriva a1143 XP ma resta al21; termina l’incontro a28/62 HP. Nessun KO della squadra, nessun consumabile usato. Ricompensa650 monete e un solo flag vittoria, confrontati con lo stato iniziale.

Ritorno a Ferraluce, cure gratuite al Centro, cammino attraverso R08 e ritorno a Portolume, con ulteriore controllo del Centro. Finale: tutti curati,840 monete, stessi strumenti e stessi compagni. RNG166312726 →2176718721. Report senza errori JavaScript. **Driver passato in circa due minuti automatizzati**, incluso il ritorno e l’esportazione del backup attraverso l’app. Checksum e corrispondenza di squadra, inventario e denaro con il report verificati.

La vittoria dimostra una possibilità di recupero economico dopo il tentativo fallito, senza rigiocare un allenatore già sconfitto o assegnare strumenti. Non dimostra ancora vittoria contro Viola o Nerea: entrambe restano disponibili, la quinta medaglia non è assegnata. La crescita lenta di Chinchou e gli altri compagni sottolivellati restano elementi della preparazione da valutare.

## Riproduzione e artefatti

Usare `PLAYTEST_RECOVER_IRIS=1` e `PLAYTEST_RESUME_NEREA_BACKUP=docs/playtests/2026-10-23-natural-viola-first-attempt-backup-charmander.json`, senza attivare contemporaneamente `PLAYTEST_NEREA_CHALLENGE`. Il driver usa soltanto movimento, dialoghi, sfida e servizi reali dopo l’importazione del checkpoint.

Report: `2026-10-23-natural-iris-recovery-charmander.json`. Backup esportato: `2026-10-23-natural-iris-recovery-backup-charmander.json`. Il salvataggio conserva la propria contentVersion storica0.3.114; non viene confusa con la versione runtime testata.
