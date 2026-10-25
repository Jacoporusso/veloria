# Viale delle Fronde v3 — candidato artwork

Data: 25/10/2026. Asset creato con ImageGen built-in modificando il fondale v2, dopo aver letto `docs/32_EARLY_MAP_ART_CONSTRAINTS_v0.1.md` e `assets/sources/veloria-r02_viale_fronde-illustrated-v2.png`. Nessun binding o oggetto Tiled/runtime è stato modificato.

## Prompt finale usato

Refine this exact map illustration, preserving its 7:5 canvas, all path and foliage positions, exits, and overall geometry. Simplify the Viale delle Fronde into clearly modern matte 2D game art: broad calm painted color shapes, fewer tiny flowers and leaf details, much flatter shading, softer edges, no glossy highlights, strong bevels, or toy-like depth. Keep the continuous west-to-east road across the center and preserve the natural-gravel-to-pale-stone transition at the same point about 64% from the left. Remove the large compass medallion and decorative inset pattern from the road: the east stone section should be simple, lightly textured pale paving with no emblem, border, prop, or obstacle. Retain the natural forest edge, sparse tree forms, and distant subtle Brumalta skyline on the right. Keep the entire central roadway empty and unobstructed. Do not add signs, habitat markers, NPCs, props, labels, or new routes.

## Allineamento statico controllato

- Tiled `public/tilemaps/r02_viale_fronde.tmj`: mappa 28×20 con tile 32×32; immagine scena esistente 896×640 a (0,0), `renderDepth=-4`. Output 1484×1060 mantiene rapporto 7:5 e viene inserito al medesimo rettangolo immagine.
- Varchi reali: ingresso Bosco x0,y8–10 (centro y9) e ingresso Brumalta x27,y8–10 (centro y9). Nel candidato il viale attraversa l’intera immagine sul piano centrale; non risultano strozzature o diramazioni.
- Raccordo terreno/pietra circa x18 (64.3% della mappa): nel candidato la variazione è nella stessa fascia, graduale e senza scalino.
- Coordinate Tiled dei tronchi con collisione: (3,3), (8,2), (13,3), (18,2), (23,3), (4,15), (10,16), (16,15), (22,16). Il candidato conserva alberi ai margini superiori e inferiori, ma il posizionamento delle chiome è solo una corrispondenza visiva approssimativa: il prompt non dimostra collisioni o passabilità. Le felci runtime nelle zone [4,6,4,2] e [20,11,4,2] e il cartello (20,7) non sono incorporati intenzionalmente.
- Nessun NPC, habitat marker, cartello, pickup o prop è intenzionalmente dipinto. La skyline remota di Brumalta è parte del fondale; l’oggetto runtime separato `Scorcio di Brumalta` va controllato in scena per escludere duplicazioni.
- La scena è un candidato d’iterazione stilistica; necessaria verifica in gioco e su portrait/landscape prima dell’integrazione.

## File e checksum

- Source: `assets/sources/veloria-r02_viale_fronde-illustrated-v3.png` (1484×1060, 2,527,527 byte), SHA-256 `7F4F855B316904C7A42D03C4157827B026DE96F7BA3947C8065FE13399A52C1B`.
- Runtime WebP lossless: `public/assets/scenery/veloria-r02_viale_fronde-illustrated-v3.webp` (1484×1060, 1,988,306 byte), SHA-256 `664CE9D8E69F9F5AC1806FF19E64D6F75B285FE9BD5316A11F710A11838267C6`.
- Key proposta: `veloria-r02_viale_fronde-illustrated-v3`.
