# Sera: quattro viste illustrate

Sera del Sentiero dell'Alba usa quattro disegni idle indipendenti. Mantiene il profilo `route-trainer-sera`, l'ID NPC `trainer_route01_a` e il dialogo `sera_route01`. La nuova immagine non cambia posizione, collisioni, battaglia o ricompense. Timo, Rami ed Enea conservano le rispettive identità nel vecchio atlante, ancora registrato dove serve.

## Identità e fonti

Il riferimento è Sera nel quadrante superiore sinistro dell'atlante `veloria-cast-opening-and-champion-v1`. Il dialogo e `r01_sera.trainer.json` attestano il ruolo di allenatrice facoltativa prima di Brumalta. Abiti/accessori derivano dalla direzione artistica del profilo e dall'immagine, non vengono presentati come informazioni del dialogo: ricci castani, fascia oliva, giacca crema con verde muschio, pantaloni cargo, scarponi, zaino e scheda percorso sul fianco anatomico sinistro. Nei profili la scheda resta sullo stesso lato e viene occlusa a est; il retro mostra lo zaino centrale. Nessuna specchiatura.

Generazione con ImageGen integrato; prompt esatti, outputID, fonti, hash e calibrazione in `assets/prompts/sera-idle-views-v1.json`. PNG raw 1024×1536 immutati in `assets/sources/veloria-sera-idle-*-v1.png`; WebP lossless con pixel RGBA identici in `public/assets/sprites/`. Originali conservati. L'alone apparente nel viewer trasparente non è stato ripulito: la revisione considera anche il compositing effettivo di Chrome.

## Contratto e scala

Quattro `idleViews` esplicite con origini per posa, corpo alpha≥128 alto56worldpx e origine orizzontale dal centro delle suole. Dimensione completa sud61,79; nord60,15; ovest59,98; est60,66worldpx. Scala uniforme senza flip o tween che sovrascrive le pose. Il frame0 legacy è rimosso solo dal binding di Sera. Dati registrati nel manifest idle e negli asset di R01.

Il test sulle quattro identità del vecchio atlante ora richiede per Sera il nuovo asset sud, quattro riferimenti distinti e frame assente, conservando gli altri tre binding. La prova del respiro legacy usa Timo, ancora statico: mantiene tutte le asserzioni su piedi, variazione di scala, animazioni ridotte e distruzione del tween precedente. Sera è verificata separatamente senza tween.

## Verifiche e limiti

Una prova Chrome di Sera passa quattro approcci reali con entrambe le qualità animazione, ciascuno in portrait/landscape: asset, direzione, scala, ancoraggio, occlusione rispetto al protagonista, nessun flip/tween, salvataggio e RNG invariati. Screenshot sud portrait ed est landscape rivisti. Log `.tmp/sera-aster-native.log`; passano anche i due casi Aster dopo il retry limitato del solo fetch osservativo `main.ts`.

Il job CI122833230114 della Verify40693256771 falliva per `route.fetch: read ECONNRESET` prima delle asserzioni di Aster. Sono mantenuti timeout, interazioni e verifiche: nessun retry dell'intero test. Il resto della CI viene registrato separatamente in `CI_STATUS.md`.

Review runtime completata anche per retro portrait e ovest landscape. Due prove globali coprono le51presenze in entrambi gli orientamenti; passa anche il respiro legacy di Timo (`.tmp/sera-gallery-native.log`, tre casi). Primo accesso produzione offline alle quattro immagini di Sera, decode originale e quattro approcci al dialogo passati (`.tmp/sera-offline.log`); build finale passata con avviso chunk Phaser. Totali locali:828 dominio/persistenza,154 Python, validatore794media/48fondali/48mappe. Discovery404browser una volta;51casi risorse offline in26+25.

Dodici profili su48 hanno ora quattro idle;36 restano da migrare. Sera non dispone ancora di camminata autentica. Il prototipo walk Ada resta distinto dalle idle di Sera. La revisione completa del cast e la progressione naturale dopo Dalia rimangono parte dell'obiettivo aperto.
