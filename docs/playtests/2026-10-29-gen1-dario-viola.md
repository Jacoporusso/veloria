# Preparazione Dario e tentativo Viola — 29 ottobre 2026

Runtime 0.4.39, commit applicativo `9fa278fe111df55e3164b6333a732d02b34363b4`. Il driver aggiunge una preferenza esplicita per Sonnifero prima di Parassiseme e, contro l'Acciaio di Dario, una sostituzione basata sui tipi visibili e sulle mosse possedute. Non modifica squadra, livelli, denaro, avversari o RNG. Il campo contentVersion dei salvataggi resta quello originario 0.4.30 e non identifica il runtime.

## Dario: superato

Ripresa dall'export UI di allenamento, SHA256 `3d93b4e82fb7f10f4725636343f0c57a37105d42c0d77083bef698027d28f71a`. Con 240 monete il driver acquista una sola Pozione al prezzo del catalogo, anziché richiederne tre senza fondi sufficienti. Il caso passa in 2,6 minuti: vittoria su Dario, premio ordinario di 850 monete, ritorno e riposo al Centro di Portolume.

Export finale `natural-dario-preparation-backup.json`: quattro medaglie, 890 monete, una Sfera, nessuna Pozione o Superpozione. Exeggcute 23 con 755 XP nel livello, Charmeleon 23 con 1005 XP, Psyduck 23 con 74 XP; tutti curati. SHA256 `b8dcad4366346b9a5088bea15b2f4cdff69554f29ce0f5a9a7e52beb765c65aa`.

## Viola: non superata

La ripresa importa esattamente l'export precedente. Acquista una Superpozione con le monete guadagnate e tenta la sfida facoltativa di Viola. Il caso termina con una sconfitta ed esporta il risultato effettivo: quattro medaglie, 190 monete, nessuna cura acquistata rimasta. Non assegna il flag di vittoria. Nerea non viene raggiunta: la scelta di fermarsi dopo Viola appartiene a questo percorso del driver e non costituisce un requisito del gioco.

## Nerea: percorso e sfida raggiunti, medaglia non ottenuta

Il driver ora consente di saltare esplicitamente la preparazione facoltativa con `PLAYTEST_DIRECT_NEREA=1`, senza assegnare il premio di Viola. Ripresa dall'export della sconfitta, SHA256 `14199353152ea3db6376a5a6d5a289e36f166b0727a405eeae24f5e748e223d8`. La prova diretta raggiunge la palestra, completa le tre chiuse tramite interazione e affronta Nerea. Termina dopo 1,2 minuti con una sconfitta effettiva, non con un blocco di navigazione o di interazione. Il test resta rosso perché richiede la quinta medaglia: non viene attenuata l'asserzione.

Export `natural-nerea-attempt-backup.json`: quattro medaglie e 190 monete conservate, Exeggcute 23 con 1130 XP nel livello, Psyduck 23 con 1122 XP. Il recupero della squadra dopo la sconfitta avviene nel gioco. Nessun pageerror nei tre report. Nessuna modifica al bilanciamento o all'avversario per far passare il caso.

La quinta medaglia resta da conquistare. La prossima verifica deve ripartire dall'ultimo export successivo alla sconfitta, senza riutilizzare consumabili o premi già spesi. I tre report allegati mantengono separati il caso passato e quelli falliti e includono gli hash dei relativi export UI.
