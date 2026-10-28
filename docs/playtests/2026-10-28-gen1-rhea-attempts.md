# Progressione guadagnata verso Rhea

## Percorso dalla terza medaglia

Importato dalla UI il backup realmente guadagnato dopo Aster, SHA256 `369511af7dedb9bf2f795e27857f44192f047e5df0d97d7a01a9c4c2b42e212a`. Squadra, inventario, denaro, flag, medaglie e RNG confrontati prima di muoversi. Il save conserva contentVersion0.4.30 di origine; la prima prova usa la base runtime0.4.32 con supporto alla ripresa da P3. Nessuna mutazione di XP, creature o risorse da parte del driver.

Percorso reale: uscita dalla palestra Aster, cure, Anello Magnetico, lettura del misuratore, rapporto Ferraluce, allenamento fino a Charmeleon22, acquisti e puzzle della palestra Rhea. Esportato dalla UI un backup prima della sfida e uno dopo la sconfitta. Il secondo conserva effettivamente tre medaglie,140monete, zero Pozioni e tre Sfere, oltre a Charmeleon22, Spearow2, Paras9 e Charmander15 ricevuto lungo il percorso.

## Prima sfida persa

Report `2026-10-28-gen1-rhea-first-attempt-report.json`, caso terminale fallito in5,8minuti. Magnemite20 sconfitto da Braci, poi il driver mantiene Charmeleon contro Aerodactyl21 e usa tutte le cinque Pozioni mentre Braci è poco efficace. Aerodactyl rimane29/64PS, la squadra perde al turno16 e Onix22 non entra. Nessun flag Acciaio viene assegnato. Non emerge un difetto di danni o assegnazione medaglie: la strategia del driver è insufficiente.

Rhea ora presenta chiaramente i tipi delle tre specie e il valore di mosse Acqua/cambi squadra, senza modificare dati, AI o premi del boss.

## Cattura riuscita, prima zona di allenamento inadatta

Importato invariato il backup di sconfitta. Vinta la sfida facoltativa di Iris, guadagnate650monete, comprata una Sfera con denaro reale; ritorno a R05 e cattura di Psyduck12 nelle Sponde del Viadotto, usando Paras e Paralizzante tramite la UI. Il nuovo helper tentava poi di allenarlo nel muschio R06 contro specie Erba16–18: Psyduck va KO prima di guadagnare XP. Il test termina fallito dopo10rounds e conserva l'asserzione di raggiungere22. Report `2026-10-28-gen1-rhea-moss-attempt-report.json`. Nessuna esperienza mancante è stata assegnata per chiudere la prova.

Questa scelta di habitat era un errore del driver, non una dimostrazione di preparazione completata. Il codice di battaglia corrente assegna XP al Pokémon che ottiene il KO: mettere un compagno in campo e ritirarlo non lo allena passivamente. La regola non è stata cambiata per rendere più facile il test.

## Preparazione rivista e ripresa dei checkpoint

Il driver mantiene Charmeleon come primo Pokémon nel mondo, valuta i tipi/livelli visibili negli incontri R05 e manda Psyduck solo sui matchup favorevoli: Onix, Sandshrew di livello compatibile, poi Growlithe e Machop quando livelli/mosse lo permettono. Gli altri incontri vengono fuggiti con il compagno veloce; non si legge il comando avversario. La cattura precede un vero riposo a Vetracielo ed export immediato, poi ogni round esporta un altro backup dopo le cure. Tre round senza XP interrompono la prova con lo stato guadagnato conservato; il target22 e Idropulsar restano asserzioni obbligatorie, non vengono abbassati.

La preparazione rivista ha raggiunto Psyduck22 al round33, con Confusione e Idropulsar apprese tramite la UI. Il backup realmente esportato a Ferraluce conserva Charmeleon22 e Psyduck22 curati, tre medaglie,640monete e due Sfere, senza Pozioni. SHA256 del backup `natural-rhea-water-companion-ready-backup.json`: `6928e9d8ca65f9c30f542aba8e5ad6106b2c6b17d074399e2547a458234567a1`. Report durevole: `2026-10-28-gen1-rhea-rail-training-report.json`.

Il caso termina al limite di45minuti dopo l'export e prima di registrare l'inizio della rivincita: ultimo stato osservato presso il Mercante di Ferraluce. Non certifica una vittoria o sconfitta contro Rhea. Il checkpoint consente di riprendere senza rifare l'allenamento, confrontando i dati all'importazione e usando le uscite reali; nessun teletrasporto o ricostruzione dal report. I vecchi log mostrano talvolta deltaXP negativi quando sale il livello, perché il contatore locale riparte: corretta la sola etichetta del driver per riportare livello/XP prima e dopo, senza modificare l'esperienza del gioco.

## Rivincita corrente riuscita

Ripreso lo stesso checkpoint esportato, senza ripetere cattura o allenamento. Due Pozioni acquistate con il denaro guadagnato; Charmeleon contro Magnemite e Psyduck contro i due avversari Roccia. Vittoria al turno8 e quarta medaglia persistente dopo il ritorno al titolo. Un caso passato in37secondi sul runtime0.4.34, nessun pageerror. Prova e limiti separati in `2026-10-28-gen1-fourth-medal.md` e relativo report. I precedenti esiti falliti e il timeout restano invariati.
