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

La preparazione rivista è in corso al momento della registrazione di questa nota: osservati cattura, checkpoint reale e primi XP di Psyduck nel Giardino dei Binari. Non attesta ancora la quarta medaglia o il completamento dell'allenamento. Le nuove opzioni di ripresa accettano i checkpoint guadagnati di questa tratta nelle mappe effettive, confrontano i dati all'importazione e percorrono fisicamente le uscite per tornare a Ferraluce; nessun teletrasporto o ricostruzione dal report.
