# R04 Salita dei Petali — illustrated v3

- Generazione: ImageGen integrato, repaint 2D opaco derivato dalla composizione v2 e rifinitura mirata ai ponti.
- Output: `assets/sources/veloria-r04_salita_petali-illustrated-v3.png` e `public/assets/scenery/veloria-r04_salita_petali-illustrated-v3.webp` lossless, 1484×1060 px, rapporto 1,4:1.
- Binding grafici v3 aggiornati soltanto in `content/maps/r04_salita_petali.map.json` e `public/tilemaps/r04_salita_petali.tmj`; geometria Tiled invariata. Registro, manifest di provenienza e precache PWA aggiornati nel lotto 0.3.141.

## Prompt di rifinitura ImageGen

Use case: precise-object-edit
Asset type: game map background edit, R04 Salita dei Petali v3.
Input: Image 1 is the current source v3. Preserve its style, map composition, trail layout, river, trees, clearings, palette, framing and every pixel outside the bridge decks and the short trail junctions touching their ends.
Edit only the two existing wooden bridges and the few trail pixels immediately connecting to them. Translate both bridge decks 20 px left. Move the upper bridge down 40 px and the lower bridge down 55 px. Do not resize, rotate, repaint, replace, or change perspective of the decks; keep each deck exactly three map cells wide and spanning the stream, with continuous walkable surface and no water gap. Blend the bank/path edges where the bridges were and where they land after moving. Do not move or alter the stream, trails elsewhere, vegetation, rocks, cherry trees, or boundaries.
Exact canvas is 1484×1060. The top bridge visual center must end at x=583 px, y=512 px. The bottom bridge visual center must end at x=583 px, y=830 px. Each should occupy about 106 px across the map direction for the three-cell span; preserve the current orthographic view.
No new elements, no trail extensions beyond small endpoint raccords, no NPCs, signs, objects, habitat markers, text, UI, border or watermark.

## Verifica geometrica della prima iterazione (superata)

Il Tiled è 42×30 celle, origine in alto a sinistra. I ponti sono rettangoli [15,13,3,3] e [15,22,3,3]; i loro centri reali sono quindi (16.5/42, 14.5/30) e (16.5/42, 23.5/30), non i centri dei bordi delle celle. Proiettati sul PNG 1484×1060, i target sono:

- Ponte nord: (583.0 px, 512.3 px).
- Ponte sud: (583.0 px, 830.3 px).

Stima dei centri sul PNG finale usando il bounding box dei pixel legno/ponte: nord circa (592,504), sud circa (593,819.5). Scarto residuo: circa 9–10 px a est e 8–11 px a nord. Silhouette stimata circa 147×101 px; la misura include parapetti/pilastri e resta una stima visiva, non un controllo runtime. Il sentiero si chiude circa a x6 sul lato ovest, coerente con il terreno Tiled; non c’è un’uscita ovest. Gli accessi nord/sud sono visivamente raccordati. Nessun NPC, cartello, pickup, marker habitat o UI visibile.

Le coordinate Tiled restano autorevoli per collisioni e passaggi. La stima dei pixel non sostituisce la verifica browser, non eseguita in questo task.

## Correzione dopo prova di gioco

La prima prova delle sei corsie ha mostrato i piedi nell’acqua nella corsia meridionale di entrambi i ponti: il rettangolo logico non basta a descrivere la proiezione dei piedi dello sprite. Un primo tentativo di spostamento esatto non ha corretto abbastanza il piano e non è stato selezionato.

Output selezionato: `exec-751d17ba-c7a4-4f5f-b29c-bc62c03d9722.png`, ImageGen integrato. Prompt: “Each of the two wooden bridges is TOO NARROW from north to south. EXTEND BOTH WOODEN DECKS SOUTHWARD by HALF THEIR CURRENT HEIGHT: add another five broad wooden planks below each existing deck, covering the water immediately beneath it. Keep northern edge fixed. Thus each bridge becomes 50% taller in the image. Move the southern posts/rail down to enclose the extended deck. Keep bridge width and horizontal positions identical. Upper bridge southern floor edge must reach around 55% of canvas height; lower bridge around85%. Smooth the adjacent pale dirt bank approaches. Preserve the rest of the exact map without changes.”

Collisioni e geometria runtime invariate. PNG copiato e convertito WebP lossless. Verifica finale: sei attraversamenti da x14 a18 con input UI e screenshot al centro, corsie13/14/15 e22/23/24, tutti passati. Root ha controllato i sei screenshot: piedi sul piano in legno anche nelle due corsie meridionali. Il bordo sud del ponte alto resta vicino al piede dell’ultima corsia, senza lo sconfinamento sull’acqua osservato prima.
