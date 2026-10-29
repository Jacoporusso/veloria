# Allenamento verso Confusione: primo lotto interrotto dal timeout

Runtime applicativo 0.4.40, contenuti del commit `a7d1a2d119956579bef887a099996a68fad2bb25`. Ripresa dall'export UI successivo alla sconfitta con Nerea, SHA256 `dccf36517c15bcf85cf595813472eccc5dfa3816d7f0e854886e312da5231739`. Il driver esce normalmente dalla palestra, raggiunge Portolume, riposa e pesca con la canna già ottenuta. Non modifica XP, squadra, denaro, strumenti o RNG.

Target: Exeggcute 27 per apprendere Confusione dal learnset ufficiale tramite il selettore del gioco. Il primo lotto, limitato a 80 lanci, incontra il timeout esterno di 900.000 ms prima di raggiungere il target. Nessun pageerror registrato. Questo esito non dimostra un crash del gioco né il raggiungimento del livello richiesto.

L'ultimo export UI effettivo è quello dopo 65 lanci: Exeggcute 26 con 683 XP nel livello e 63 PS, 190 monete, una Sfera, nessuna Pozione o Superpozione; quattro medaglie. Gli altri membri e l'inventario conservano lo stato iniziale. SHA256 `fa5fe4359f0289768a54578da542af465b17feb151120d58ad486fbc13474b91`, file `.tmp/natural-gen1-coastal-level27/natural-prologue-natural-j-04b21-ress-and-real-game-controls/natural-coastal-training-progress-backup.json`.

Il report conserva anche una battaglia e lo stato in memoria successivi a quell'export: non vengono usati per ricostruire un backup. La ripresa importa l'ultimo file esportato dalla UI. Prove complete e hash in `2026-10-29-gen1-coastal-level27-timeout-report.json`.

Il driver ora riserva tempo per il ritorno al Centro e l'export, con budget interno di dieci minuti configurabile fra uno e dodici tramite `PLAYTEST_COAST_TRAIN_MINUTES`. Il limite esterno resta quindici minuti e l'asserzione sul target resta obbligatoria: un lotto incompleto conserva il progresso e fallisce il requisito del livello. Il contatore finale dei lanci viene incrementato dopo la pesca effettivamente completata. La ripresa verso il 27 è separata e deve avere un proprio esito prima di essere dichiarata riuscita.
