# Palestre di Vetracielo e Ferraluce illustrate

Due fondali dalla geometria effettiva, con strumenti della prova esclusivamente runtime. Vetracielo conserva terrazza e monorotaie, con pietra chiara e pavimento più quieto. Ferraluce conserva officina, vetro turchese e architettura d’induzione, con parete nord raccordata al limite percorribile.

## Geometria e asset

Vetracielo:30×30,960×960 worldpx, raw1254×1254. Ferraluce:32×24,1024×768 worldpx, raw1448×1086. Coordinate e guide SVG/PNG in `assets/prompts/gym03-production-layout-v1.md` e `assets/prompts/gym04-production-layout-v1.md`. Immagini nuove, opache, conservate senza crop o resize; WebP lossless con pixel decodificati identici. Le precedenti immagini restano registrate come riferimenti storici.

Output finali:

- P3 `exec-27697423-172b-4b52-a1ad-11ddb04853a0.png`, fonte `assets/sources/veloria-gym03_vetracielo-illustrated-v3.png`.
- P4 `exec-483fbc10-daab-4125-acd0-fe884f550616.png`, fonte `assets/sources/veloria-gym04_ferraluce-illustrated-v3.png`.

Prompt integrali e hash nei rispettivi documenti `assets/prompts/*-illustrated-v3.md` e in `assets/map-parity-v2.json`. Un solo `scenery-image` per mappa sostituisce la vecchia chiave. Coordinate, collisioni, NPC, requisiti, ordine delle linee, orientamenti magnetici e ricompense invariati. Cache v180, contenuti0.4.17.

## Selezione dei candidati

Le prime immagini aggiungevano placche sul pavimento che sembravano altri comandi: rimosse tramite ImageGen. A P4 la revisione porta la parete nord al limite previsto dalla geometria; frecce, nodi e stato del circuito restano generati dal gioco.

La prima esecuzione P3 passava logicamente ma mostrava i piedi sulla balaustra dipinta vicino alla console Giardini. Il riferimento canvas `assets/prompts/gym03-exact-floor-reference.png` applica il materiale del candidato precedente alle celle libere esatte, con margine piedi20px; è solo authoring. ImageGen rifinisce il pavimento, poi un edit separato elimina la vecchia balaustra visibile sotto il bordo, aggiungendo una fascia di pietra fuori dal percorso. Il raw finale non è il composito tecnico. Nessuna collisione è stata spostata per adattarsi all’immagine.

## Verifiche e limiti

Prima esecuzione: sei casi passati su prova P3 con tre linee, battaglia Aster, medaglia, premio unico, reload e ritorno; prova P4 con rapporto obbligatorio, rotazioni in ordine diverso, persistenza parziale e ritorno; camera nei due orientamenti per entrambe le mappe. La review visiva ha comunque rifiutato il primo contatto P3, dimostrando che i soli test funzionali non bastano.

Dopo la correzione del pavimento: percorso completo P3 e due casi camera passati; dopo la finitura del bordo, ulteriore percorso completo P3 passato1,1min. Schermate dei comandi e di Aster nei due orientamenti, con piedi sul pavimento alla console Giardini confermati. Log `.tmp/gyms34-native-review.log`, `.tmp/gym03-floor-final.log`, `.tmp/gym03-edge-final.log`.

Validatore673 asset/36 fondali/48 mappe passato. Due casi produzione offline passati: circuito magnetico al primo ingresso senza rete, rotazioni/reload/ritorno18,2s; prima decodifica dei35 fondali non iniziali3,5s. Build passata (`.tmp/gyms34-offline-final.log`). Pubblicazione da attestare dopo il push. Non viene ripetuta la battaglia Rhea per un cambio del fondale e senza modificare il personaggio o la sua interazione. Budget texture, direzioni/camminate del cast, revisione completa delle48 mappe e campagna naturale restano aperti.
