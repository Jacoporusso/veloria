# Primo tentativo costiero Gen I: Viola

Runtime 0.4.35 `3a7830f98a431502c8c4c00e4b0dd08ec9243d7d`. Il caso termina fallito prima della palestra Nerea: la squadra perde contro Viola al turno 16. Il driver esporta il risultato reale e poi segnala il requisito non raggiunto; nessuna quinta medaglia viene dichiarata.

Viola resta facoltativa nel gioco. Questo caso aveva scelto di affrontarla per preparazione: lo stop riguarda quella prova, non un blocco del passaggio verso la palestra.

Importato invariato il checkpoint di Portolume, SHA256 `6c654d9c41d51aee45e230b146982df3afa9428003fa8bd6546c884fda5c663e`. Riposo tramite il Centro e acquisto di una Superpozione con 700 delle 1640 monete guadagnate; rimangono 940 monete. La squadra mantiene Charmeleon 23, Paras 9, Spearow 2, Charmander 15 e Psyduck 22.

I cambi basati sui tipi visibili portano Psyduck su Tentacool. La squadra sconfigge Tentacool 24 e Krabby 24, ma il secondo Tentacool 25 resta a 41 PS quando la squadra perde. Psyduck viene KO contro Krabby; Charmeleon conclude il secondo avversario. Sono consumate realmente la Superpozione e le quattro Pozioni. I colpi Vicegrip su Psyduck infliggono 22–26 PS, più dei 20 ripristinati da ciascuna Pozione: ripetere quelle cure non risolve il matchup.

Il gioco soccorre e cura la squadra dopo un KO completo secondo la regola già presente in WorldScene, conservando XP e risorse consumate. Il backup finale R08 (20,12) ha quattro medaglie, 940 monete, zero Pozioni/Superpozioni e Psyduck salito realmente al livello 23. Non è una cura o un livello assegnato dal driver.

Export UI `natural-viola-attempt-backup.json`, SHA256 `9696fa64ad76df59aa033cd8d1a741530763a71982418572f4570153b2eb75c8`. Checkpoint curato pre-sfida `natural-nerea-rested-backup.json`, SHA256 `6b97191e853411a1ed8bb668f3674980c7e904b93bfb270318f75b112b999c5c`. Report durevole `2026-10-28-gen1-viola-first-attempt-report.json`, SHA256 `c5171a4988ac8f2baf5b1a1890cec022b1b1880cd44c665f15060f6743f942ad`; nessun pageerror.

Prossimo passo: preparare un compagno realmente catturato o guadagnato e una copertura migliore per Krabby, partendo dal checkpoint di sconfitta. Exeggcute è disponibile nell'erba R08 a livello 20–23 con Semitraglia già nel learnset; Magnemite/Voltorb sono disponibili a R06 a livello 15–18 con mosse Elettro. Sono opzioni verificate staticamente, non catture o vittorie già dimostrate. Nessuna modifica a XP, mosse, AI, ricompense o livelli degli avversari è stata introdotta per far passare il test.
