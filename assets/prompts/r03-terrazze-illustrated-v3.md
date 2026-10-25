# R03 Terrazze del Muschio v3 — candidato artwork

Data: 25/10/2026. Candidato generato e modificato con ImageGen built-in a partire da `assets/sources/veloria-r03_terrazze_muschio-illustrated-v2.png`. Nessun binding, dato Tiled, runtime o metadato modificato.

## Fonte geometrica effettiva

Il `r03_terrazze_muschio.tmj` corrente misura 32×24 celle (tile 32 px), con un oggetto `scenery-image` a `(0,0)` di `1024×768` px e `renderDepth=-4`. L’immagine fonte è 1448×1086, rapporto 4:3, rispettato dal candidato. Nota: docs32 ha una sezione “Radicelmo” da 36×24 relativa alla mappa successiva e distinta (`content/maps/radicelmo.map.json`); per questo asset R03 ho seguito il Tiled effettivo `public/tilemaps/r03_terrazze_muschio.tmj` e il MapDefinition corrente, senza importare le coordinate Radicelmo.

## Prompt della generazione finale

Keep this entire map's layout and exits unchanged, especially the left-edge route centered at y≈792/1086 and the right-edge route centered at y≈294/1086. Preserve the path bends and tree positions. Perform a stronger style flattening: modern 2D illustrated game environment, matte gouache with large clean color shapes, low-detail foliage canopies, simple softly textured earth path, very subtle shadows only. Remove the remaining tiny stone pattern, dense little flowers, glossy lighting, sculpted root details, highlights and miniature 3D depth. This should read as a painted 2D map, not a rendered diorama. Keep the forest lush, natural and warm. Do not add or move any trees, paths, signs, rocks, props, markers, people, labels or other objects.

La generazione è stata iterata prima con un prompt di layout e poi con due correzioni ai terminali di uscita; l’ultimo prompt ha semplificato ulteriormente lo stile. L’intera catena ha preservato la mappa di base, senza alterare l’asset Tiled.

## Verifica geometrica statica misurata

Uscite Tiled: ovest `(0,17)` e est `(31,6)`. Sul PNG finale 1448×1086, il centro previsto delle celle di uscita è rispettivamente y=`(17.5/24)*1086 = 792.3 px` e y=`(6.5/24)*1086 = 294.1 px`. Ho misurato i pixel di bordo con colori del sentiero: all’edge sinistro la banda continua del percorso è y=762–836 px (centro 799 px, scarto ~7 px dal centro Tiled); all’edge destro è y=258–329 px (centro 293.5 px, scarto ~0.6 px). Entrambi i varchi sono attraversati dal percorso. La continuità della strada fra i due bordi è verificata visivamente, non con pathfinding o prova browser.

Gli alberi baked sono collocati approssimativamente sui 12 anchor Tiled: `(2,2),(7,3),(14,2),(21,2),(28,2),(3,8),(11,7),(26,11),(3,21),(14,21),(24,19),(30,18)`. Il candidato mantiene la distribuzione generale, ma non pretende che ogni pixel di tronco coincida al singolo pixel della cella. Gli encounter area restano in zona libera e senza icone: Radura `[10,13,4,2]`, Giardino di Pietra `[21,7,4,2]`. Il PNG non incorpora intenzionalmente la guida Rami `(6,16)`, cartello `(3,16)`, pickup `(16,10)` o rocce interattive `(5,13),(12,17),(21,14),(27,10)`; la verifica visiva statica non garantisce che decorazioni di sfondo non possano confondersi con props runtime in gioco.

## File e checksum

- PNG source: `assets/sources/veloria-r03_terrazze_muschio-illustrated-v3.png` (1448×1086, 2,474,949 byte), SHA-256 `66D6F3D4BD4D293339DA27455206F74972E952C2D0103B2B8A1B61AD05E5808F`.
- WebP runtime lossless: `public/assets/scenery/veloria-r03_terrazze_muschio-illustrated-v3.webp` (1448×1086, 1,920,962 byte), SHA-256 `54DA6035C5740D66EA6C66CC7139C3D1387B4868DBF7B98DCB568A567F0C7FDF`.
- Key proposta: `veloria-r03_terrazze_muschio-illustrated-v3`.
- Restano necessarie verifica in scena e prova di movimento sui due collegamenti prima di qualsiasi binding.

## Esito revisione QA / integrazione

Root ha ispezionato il candidato e approvato l’iterazione come più leggibile e più vicina alla direzione 2D. Il binding è stato aggiornato in `content/maps/r03_terrazze_muschio.map.json` e `public/tilemaps/r03_terrazze_muschio.tmj`, cambiando solo key/path dell’immagine e proprietà sprite.

Controllo dati dopo l’integrazione: l’oggetto `scenery-image` resta `(0,0)`, `1024×768`, `renderDepth=-4`; dimensione griglia, collisioni, spawn, trigger, oggetti interattivi e progression restano invariati. I test in gioco/browser e la verifica globale asset/cache/versione sono ancora demandati al root dopo il completamento di Radicelmo.
