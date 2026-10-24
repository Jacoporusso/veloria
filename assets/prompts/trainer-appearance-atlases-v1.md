# Atlanti allenatore personalizzabile — v1

24 ottobre 2026. Tool integrato ImageGen. Base generata prendendo come riferimento il primo protagonista di `public/assets/concepts/characters-direction-v1.png`; varianti ottenute con editing della base. PNG originali conservati in `assets/sources/avatars/`, derivati WebP lossless in `public/assets/avatars/`. Alfa reale, tre atlanti da 1254×1254: il compositore divide i quattro intervalli con arrotondamento dei bordi, poi normalizza le pose a 192×240 con ancoraggio ai piedi. Non assumere che 1254 sia divisibile per quattro.

## Prompt base esatto

Use the FIRST young adventurer (chestnut short-haired boy, teal jacket, cream shirt, navy shorts, coral backpack) on this approved Veloria character sheet as identity and painted style reference. Create a PRODUCTION GAME SPRITE SHEET ONLY, no text, no labels, no extra portraits. Exact 4 columns x 4 rows grid, evenly spaced equal size cells, transparent background with actual alpha, no ground, no shadows extending outside the cells. Each cell contains exactly one complete figure, same size and centered anchor, feet baseline identical. Modern hand painted detailed 2D character with soft shading and natural anatomy, NO pixel art NO 3D. Camera elevated orthographic TOP DOWN like small figures at bottom of reference. Row 1 facing DOWN towards viewer, 4 frames walk cycle left foot forward, neutral standing, right foot forward, neutral standing. Row 2 facing LEFT profile, same 4 walk frames. Row 3 facing RIGHT profile, same walk frames. Row 4 facing UP back view with coral backpack visible, same walk frames. Keep hair, facial appearance, clothes and scale identical across every cell, change only orientation and stepping pose. Leave generous transparent gutters, full body never cropped. Square canvas. Sixteen figures exactly. No borders or grid lines. This is a clean reusable original game asset based on the approved reference.

## Prompt varianti esatto

Il seguente testo è stato inviato una volta per ogni sostituzione della frase fra parentesi quadre, con la base come target di editing:

Edit this sixteen-frame character sprite sheet. Preserve EXACTLY the 4x4 grid, equal cell geometry, figure size, feet anchor, poses, facing directions, clothes, skin and palette. Change ONLY the hairstyle in every cell to [HAIRSTYLE]. A charming youthful androgynous adventurer suitable for either player preset. Keep beautiful detailed 2D painted illustration and all directional views including the back. This must remain an animation atlas of exactly sixteen complete characters, not a portrait board. Transparent alpha background, no backdrop or text. No changed walking direction or extra items. Colors stay chestnut hair, light warm skin, teal jacket, cream shirt, navy shorts and coral backpack.

- `curly`: short rounded natural CURLY chestnut hair with defined painted curls, same compact silhouette and no ponytail
- `long`: LONG chestnut hair reaching just below the shoulders, soft natural strands with a small half-up tie so face and backpack remain visible

## Contratto e revisione

Le tre tavole sono state ispezionate. Quattro righe direzionali e sedici pose per ciascun taglio; capelli lunghi e ricci differenziati. Preset ragazzo/ragazza impostano una combinazione iniziale di taglio/abito/zaino: tutte le caratteristiche restano modificabili. Il preset non è un'inferenza sull'identità della persona.

La personalizzazione usa regioni cromatiche dei materiali della sorgente (pelle calda, capelli castani, giacca petrolio, zaino corallo), con conservazione della luminosità. Sono regioni specifiche di questi asset, non segmentazione universale di immagini o foto. Occhi/barba sono dettagli piccoli sovrapposti nel compositore. Nuovi asset devono essere verificati con le maschere e con tutte le palette, senza presumere che qualunque illustrazione possa riusare le soglie correnti. Miglioramento verso livelli/mask esplicite e controllo di tutte le combinazioni resta aperto.

Anteprima e mappa usano il medesimo foglio composto. Verifica browser e screenshot dei due orientamenti da registrare nel documento del lotto; QA fisico e revisione delle animazioni non sono attestati dalla sola generazione.
