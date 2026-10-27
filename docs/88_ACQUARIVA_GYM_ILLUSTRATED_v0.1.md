# Palestra dei riflessi di Acquariva illustrata

Il fondale mantiene vetrate lunari, glicini bianchi, ninfee e riflessi lilla, con pavimento chiaro e privo di falsi comandi. Specchi, sorgente, ricevitore, fasci e Selene rimangono runtime. La stessa nuova immagine è dichiarata anche in `battleBackgroundKey`, per evitare che la sfida usi lo scenario precedente.

Geometria32×24,1024×768 worldpx; raw finale1448×1086. Sorgente `assets/sources/veloria-gym06_acquariva-illustrated-v3.png`; WebP omonimo in `public/assets/scenery/`. Output ImageGen finale `exec-0533bdb3-c94d-4a64-a487-72c6227ca3e7.png`, senza crop/resize; conversione lossless con pixel RGBA identici. Hash in `assets/map-parity-v2.json`; prompt integrali e iterazioni in `assets/prompts/gym06_acquariva-illustrated-v3.md`.

La prima immagine aggiungeva passerelle inesistenti; la seconda contraeva le terrazze. Entrambe rifiutate prima dell'integrazione. Il riferimento tecnico ricostruisce la partizione acqua/pavimento dalle collisioni, omettendo solo nella copia di authoring i footprint dei sei strumenti e dell'NPC, con20px verso sud per i piedi. Due edit separati rifiniscono prima l'acqua e poi il pavimento mantenendo la partizione. Il composito tecnico non è usato come asset finale. Procedura e campioni in `assets/prompts/gym06-production-layout-v1.md`.

Tiled di gioco: unica differenza la chiave `scenery-image`. Metadati: descrittore immagine e riferimento arena aggiornati; nessun cambio a coordinate, collisioni, router, dialoghi, allenatore, ricompense o uscite.

Tre casi Chrome passati sul raw finale: puzzle completo in ordine non lineare, persistenza parziale/reload, battaglia Selene, medaglia e premio unico/reload/ritorno; camera superiore/inferiore in portrait e landscape. Screenshot di tutti i quattro approcci nei due orientamenti; controllo visivo del pavimento presso primo/quarto specchio e del nuovo fondale durante la battaglia. La fixture di combattimento forte verifica integrazione e ricompense, non bilanciamento naturale. Log `.tmp/gym06-native.log`.

818 test dominio/persistenza passati; validatore685 asset/38 fondali/48 mappe passato. Discovery358 browser assegnati esattamente una volta;40 risorse offline distribuite20+20 senza omissioni. Due prove produzione offline passate: prima visita alla palestra, quattro rotazioni, reload parziale/finale e ritorno26,7s; prima decodifica dei37 fondali non iniziali3,0s. Build passata, consueto avviso dimensione chunk Phaser. Log `.tmp/gym06-offline.log`. Cache prevista v184/contenuti0.4.21; pubblicazione riportata in CI_STATUS.md.

L'aggiornamento di una palestra non conclude la revisione delle48 scene o del cast. Restano45 profili direzionali, i cicli di camminata e la campagna naturale completa da verificare.
