# Lotto direzionale Rami, Leda e Lea

Tre identità indipendenti conservano ruoli, posizioni e legami narrativi: `guide-rami-r03` nelle Terrazze del Muschio, `radicelmo-keeper-leda` a Radicelmo e `vetracielo-lea` nella piazza della monorotaia. Ogni profilo ha quattro disegni idle autentici, senza flip; mantella/rotolo/felci per Rami, capelli argento e abiti del vivaio per Leda, uniforme azzurra/avorio e borsa con mappa per Lea. I dettagli artistici derivano dai riferimenti, non vengono attribuiti al dialogo come fatti anagrafici.

## Produzione e coerenza

ImageGen integrato, con agenti Luna su Rami/Leda e revisione finale del coordinatore. PNG originali immutati in `assets/sources/veloria-{rami,leda,lea}-idle-*-v1.png`; WebP lossless RGBA-identici nei corrispondenti percorsi `public/assets/sprites/`. Prompt esatti, riferimenti, outputID, hash e scarti conservati nei tre documenti `assets/prompts/{rami,leda,lea}-idle-views-v1.json`.

La prima coppia laterale di Leda metteva la tasca sul lato sbagliato: conservati fronte/retro con tasca anatomica destra, corretti ovest (lato lontano occluso) ed est (tasca sul lato vicino). In Lea la treccia passa davanti alla spalla anatomica destra; il primo retro la disegnava lunga sul dorso, sostituito da una correzione generata. Borsa e orologio rimangono a sinistra. Le versioni scartate e le motivazioni restano nella provenienza.

Rami ha margini semitrasparenti estesi nelle sorgenti: il bbox alpha>0 non è stato usato come misura del corpo e non è stato ripulito. La calibrazione usa alpha≥128 e corpo alto56worldpx, con origine delle suole specifica per posa. I compositi Chrome selezionati sono stati rivisti sul vero terreno: nessun alone evidente a scala di gioco. Questa accettazione non costituisce una misura della memoria GPU o del costo dei margini trasparenti.

## Integrazione

Asset espliciti nel catalogo, nel manifest idle e nei renderAssets delle tre mappe; base/down corrispondente ai Tiled e origini calibrate. Rimossi i soli frame legacy di Rami e Leda dai loro binding; nessun cambiamento a geometria, collisioni, hotspot, premi o progressione. Gli atlanti precedenti restano registrati per le altre identità. I test ora verificano i nuovi asset/direzioni, preservando le asserzioni di identità e i binding delle persone non migrate.

Corretto inoltre un testo di Leda: la Medaglia Corolla appartiene a Dalia. Rhea ora esplicita i tipi reali Magnemite Elettro/Acciaio, Aerodactyl Roccia/Volante e Onix Roccia/Terra, con indicazione di Psyduck sulle Sponde del Viadotto e del cambio squadra. Nessun valore di combattimento è cambiato.

## Prove locali

Cinque casi Chrome passati (`.tmp/journey-cast-native.log`): quattro approcci reali per ognuno dei tre NPC, qualità complete/ridotte, portrait/landscape, più le51presenze globali nei due orientamenti. Verificati asset, direzione, origine, scala uniforme, assenza di flip/tween, occlusione con il protagonista, salvataggio e RNG invariati. Riviste le12sorgenti selezionate e compositi frontali portrait/laterali landscape dei tre personaggi.

Tre casi produzione offline passati (`.tmp/journey-cast-offline.log`): primo decode delle quattro pose per NPC e quattro dialoghi reali, senza pageerror o richieste fallite. I fixture di Leda/Lea usano missioni già concluse per isolare l'interazione grafica; non attestano una nuova progressione naturale.

828 test dominio/persistenza e154 Python passati; validatore826media/48fondali/48mappe. Discovery408browser una volta,55risorse offline in28+27. Build offline passata con avviso chunk Phaser. Build finale verificata anche dopo la precisazione testuale di Rhea, in un output privato separato dal server nativo (`.tmp/release-0433-build-final.log`); TypeScript senza errori.

La copertura direzionale è16profili su48:32 restano da migrare. I nuovi set sono idle, non camminate. Pipeline walk e verifica del cast completo rimangono nell'obiettivo aperto.
