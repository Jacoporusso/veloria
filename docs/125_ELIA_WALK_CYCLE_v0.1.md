# Camminata di Elia — contenuto0.4.45

Otto disegni indipendenti, due passi per direzione, aggiunti a professor-elia. PNG immutati dal generatore e WebP lossless con identico RGBA. Prompt, riferimenti, outputID, hash e scarti in assets/prompts/elia-walk-views-v1.json; manifest in assets/npc-walk-cycles-v1.json. Il primo passoB ovest ripeteva la falcataA: conservato come scarto e sostituito con il disegno alternato rivisto sul composito opaco.

Corpo56worldpx, origineY al fondo esclusivo ad alpha>=128. OrigineX stabilizzata sul centro ponderato della testa nel25% superiore, alla media della coppia. Lo scostamento stimato prima arrivava a7,44worldpx; la differenza fra fasi dopo è inferiore a0,0001worldpx. Sono misure del modello, non una certificazione della naturalezza: quattro screenshot del cammino effettivo sono stati rivisti nel browser. Il ciclo a due fasi resta migliorabile.

Le otto risorse sono dichiarate in laboratorio, Concordia e Santuario. Idle, collisioni, coordinate, dialoghi, missioni e RNG conservati. Elia rimane ferma nella campagna: il cammino è provato nella scena DEV isolata con npcAnimationPreview=professor-elia. La scena generalizzata nel documento124 non introduce pattuglie.

Verifiche:

- Nove casi Chrome passati in1,4min: due walk Elia, due Ada, tre dialoghi/mappe Elia, ingresso invalido e motore differito. Direzioni, chiavi alternate, traslazione, arresto, movimento ridotto, orientamenti e salvataggio invariato.
- Due casi produzione offline in31,1s: Elia9,8s e Celia8s. Elia verifica primo decode di quattro idle e otto walk, dimensioni/alpha, approcci/dialogo e reload. Un precedente filtro con ancoraggio non selezionava test: non è un errore del gioco.
- 840 dominio/persistenza e cinque budget passati. Validatore1098 risorse/48 fondali/48 mappe, TypeScript/build passati. Copertura446 browser e88 offline una volta: un viaggio e87 risorse in shard22+22+22+21.
- Audit indipendente: altri47 profili,192 idle, manifest Ada, tre Tiled e metadati non grafici immutati. Otto copie sorgenti/originali, hash/RGBA/calibrazioni verificati. Nuovi WebP8.809.562 byte, non misura di memoria o traffico.

Due profili walk verificati, Ada ed Elia;46 restanti. QA fisica, budget, mappe e verifica naturale completa restano aperti. Il riscontro utente sul completamento di Lega e Pokédex aggiunge i requisiti di economia e dopogioco del documento126, senza sostituire le altre verifiche.
