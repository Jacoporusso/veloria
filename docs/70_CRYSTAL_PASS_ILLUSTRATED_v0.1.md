# Varco di Cristallo illustrato

## Ambito

R14 ora usa un fondale completo 2D illustrato coerente con Biancavetta: roccia innevata, abeti, cristalli, pavimentazione chiara e un piccolo habitat alpino. Il Tiled resta l’autorità per collisioni, guida Livia, sensore, rifugio, incontri e uscite. Un solo oggetto `scenery-image` sostituisce il precedente `terrainBase`; non vengono sovrapposti due fondali completi.

La guida [r14-production-layout-v1.svg](../assets/prompts/r14-production-layout-v1.svg) è rigenerabile dal Tiled con `tools/generate_map_layout_guide.py`. Il fondo bloccato precede il pavimento, che conserva un margine verso sud di20px sotto i piedi. Il verde indica il vero trigger habitat. Il generatore esclude solo le celle degli attori dinamici e rifiuta geometrie non supportate anziché interpretarle arbitrariamente. Quattro test verificano margine, collisione aggregata, habitat e immutabilità della sorgente.

## Asset e leggibilità

[Prompt, sorgente e hash](../assets/prompts/r14_varco_cristallo-illustrated-v3.md). PNG raw1448×1086, WebP lossless con RGB decodificato identico; nessun crop, resize o ridisegno raster manuale. Manifest `assets/map-parity-v2.json`, registro asset e precache aggiornati. Il rifugio e il sensore usano i pittogrammi vettoriali condivisi già presenti; nessuna nuova collisione.

La prima prova browser ha raggiunto tutti i punti, ma la revisione delle schermate ha individuato una roccia dipinta nella cella di accesso al rifugio. Quel candidato non è stato rilasciato. La revisione ImageGen rimuove roccia e ostacoli decorativi al bordo dell’habitat, preservando geometria e composizione. Un test funzionale passato non basta a certificare l’allineamento visivo.

## Verifiche e limiti

`tests/e2e/r14-illustrated-paths.spec.ts` parte da un solo checkpoint e usa movimento touch con BFS sul Tiled reale: sensore e dialogo, Livia e dialogo, cura effettiva dei PS al rifugio, bordo habitat, ingresso/ritorno dalla grotta e uscita ovest verso Biancavetta. Ogni punto ha schermate portrait e landscape. La prova evita deliberatamente gli incontri casuali: non attesta probabilità o bilanciamento della tabella habitat, che resta invariata.

Sul candidato finale: percorso completo passato (`.tmp/r14-final-paths.log`,54s), schermate del rifugio riviste con piedi sul pavimento e roccia eliminata; due casi margini camera nord/sud nei due orientamenti passati (`.tmp/r14-camera.log`). Due prove produzione offline passate (`.tmp/r14-offline.log`): regolatore della grotta con ritorno reale a R14 e prima decodifica senza rete dei27 fondali non iniziali. Il primo caso richiede ora esplicitamente i nuovi asset R14/Biancavetta, anziché le loro vecchie versioni; anche la ripetizione finale passa (`.tmp/r14-final-offline.log`).

771 test dominio e31 persistenza passati; build TypeScript/Vite passata, validatore624 asset/28 fondali/48 mappe passato. Confronto strutturale dei layer Tiled prima/dopo: identici eccetto due proprietà di segnaletica e il nuovo oggetto decorativo. Cache v171, contenuti0.4.8; pubblicazione e CI da attestare dopo push.

L’inventario censisce28 fondali con provenienza su48 mappe; questa tranche non completa la revisione di tutte le mappe né le pose/animazioni del cast.
