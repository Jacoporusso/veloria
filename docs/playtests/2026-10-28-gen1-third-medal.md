# Progressione GenI fino alla medaglia Circuito

Un caso Chrome passato in6,4minuti complessivi sul runtime0.4.32, poi pubblicato come `8c6a63afa31956e3b7d8facbadd34c7c1a39f574`. La prova parte dal backup realmente guadagnato dopo Dalia; SHA256 iniziale `b48ab23b7906f157f2fff6f7bdd9e0cba467f89dd323e4650dffc1daf00ab6b3`. Importazione da UI e confronto di squadra, inventario, denaro, flag, medaglie e RNG. Nessuna assegnazione artificiale di progressi o risorse.

Variabili PLAYTEST prima rimosse; impostati `PLAYTEST_RESUME_SECOND_BACKUP` sul backup privato guadagnato, `PLAYTEST_CONTINUE_VETRACIELO=1` e `PLAYTEST_DAMAGE_FIRST=1`. Driver `tests/playtests/natural-prologue.spec.ts`, config `playwright.playtest.config.ts`, output `.tmp/natural-gen1-third-medal-damage`. Il gancio è solo osservativo, le azioni sono DOM/touch/tastiera. Il save conserva contentVersion0.4.30 d'origine, distinta dal runtime corrente.

Percorso reale: cure a Petalora, Viadotto/Oren, arrivo a Vetracielo e orientamento di Lea, allenamento nel parco, evoluzione Charmander→Charmeleon, riposi e acquisti, tre console Giardini/Vetro/Cielo, Aster. La policy privilegia il miglior danno previsto tra le mosse possedute, senza leggere il comando avversario. Non cambia livelli, mosse o AI del boss.

Aster sconfitto al turno5 (`winner: player`, `reason: allFainted`). Tre Braci usate e una Pozione consumata; il report conserva anche azioni avversarie, paralisi e turni. Squadra finale: Charmeleon18 a21/48PS, Spearow2 a13/13PS, Paras9 a25/25PS;1140monete, quattro Pozioni, tre Poké Ball e una scheda archivio. Tre medaglie Aurora/Corolla/Circuito. Titolo/ripresa conserva squadra, medaglie, inventario e denaro. Nessun pageerror.

Esportati dalla vera UI il backup prima di Aster e quello della terza medaglia; confrontati party/badges/flags/inventory/RNG con il salvataggio osservato. SHA256 del backup finale sintetico `369511af7dedb9bf2f795e27857f44192f047e5df0d97d7a01a9c4c2b42e212a`. Backup e screenshot restano privati nell'output del test, non sono dati dell'utente.

Report durevole `2026-10-28-gen1-third-medal-report.json`, SHA256 `d605188775ca7c76f0c3847a053f06dec617100336f12881a24c0112e2b20b1e`. I due fallimenti precedenti restano registrati in `2026-10-28-gen1-aster-attempts.md`. La diversa policy agisce già da Oren e può cambiare i successivi sorteggi: questo esito non è un confronto controllato con identica sequenza RNG nella battaglia del boss.

Questa è continuità guadagnata sul roster GenI fino alla terza medaglia. Restano da percorrere le altre cinque palestre e la Lega; non certifica tutti gli starter, tutte le strategie o un telefono fisico. Nessun checkpoint storico GenII è utilizzato per l'attestazione corrente.
