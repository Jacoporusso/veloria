# Brumalta — raccordo boulevard e monorotaia v1

Edit locale del fondale esistente `veloria-c01_brumalta-illustrated-v2`, integrato dopo l'ispezione dell'output e il via libera del responsabile. La tavola conserva il formato 1536×1024.

## Coordinate di controllo

La mappa Tiled è 36×24 celle da 32 px; l'immagine è 1536×1024, con lo stesso rapporto 3:2. Il centro della tile si calcola come `(x + 0.5) / 36`, `(y + 0.5) / 24`.

- Arrivo monorotaia, tile `(21,11)`: centro `(59,72%, 47,92%)`, circa `(917, 491)` px nell'immagine.
- Terminale runtime, tile `(21,10)`: centro `(59,72%, 43,75%)`, circa `(917, 448)` px.
- Asse del boulevard: tile `y=11–13`, dal margine ovest al margine est. La pavimentazione deve collegare il boulevard al terminale e includere l'arrivo senza introdurre un nuovo oggetto di stazione.
- Porte runtime esistenti da rendere leggibili nei raccordi: Centro `(6,7)`, palestra `(28,7)`, bottega `(6,19)`.

## Prompt integrato

Use case: precise-object-edit
Asset type: background scenery for a top-down 2D RPG map, Brumalta (36×24 tiles, 3:2 aspect)
Primary request: edit the existing Brumalta background only to make the boulevard connection into the monorail arrival tile immediately readable and to clarify the existing stone approaches to the service entrances.
Input images: Image 1 is the current approved Brumalta background and is the edit target. Preserve its style, lighting, architecture, fountain, planting, and all other composition.
Scene/backdrop: warm, refined garden city with ivory paving, restrained pale blue-gray stone accents, soft greenery and flower beds.
Composition/framing: full-map orthographic top-down view, keep the entire 3:2 map. Map tile centers convert to image fractions. The monorail runtime terminal is at tile (21,10); its runtime arrival spawn is at tile (21,11), center x=59.72%, y=47.92%. Make the paving at this exact arrival center flow naturally from the east-west boulevard (y=45.83–58.33%) and form a short, clear vertical lead-in north to the runtime terminal tile. Make the lead-in visible through material pattern and continuity, not a painted arrow or sign. Also retain clear, soft stone links from the boulevard/plaza to the existing service doors: center entrance near tile (6,7), gym entrance near (28,7), and shop entrance near (6,19).
Style/medium: preserve the current polished hand-painted modern 2D illustration, delicate garden town materials, coherent with the current artwork.
Constraints: change only paving continuity and legibility in the central boulevard / monorail arrival zone and at the three existing service-door approaches. Keep all buildings, footprints, fountain, plants, tree positions, shadows, colors and lighting unchanged. Preserve every currently open area as traversable. The runtime monorail terminal, other props, signs, people and creatures are added by the game and must remain absent from the image. No new walls, obstacles, doors, exits, furniture, tracks or station architecture. Do not invent route geometry beyond these listed connections. No text, icons, labels, UI, border or watermark.
Avoid: broad redesign, moving or resizing landmarks, tiling seams, dark rectangular roads, oversized paving medallions, path ends that stop short of the boulevard or door thresholds, false paths to map edges.

## Controllo dell'output candidato

L'output generato è 1536×1024 e conserva la composizione generale e gli edifici. Il nuovo raccordo verticale arriva al centro calcolato della tile `(21,11)` e prosegue verso `(21,10)`; i tre camminamenti esistenti diventano più leggibili fino alle soglie. L'output non contiene una stazione, terminale, persone o indicatori. Il disegno resta un fondale decorativo: le collisioni e i punti d'interazione Tiled restano la fonte autorevole per la navigazione.

File candidato ImageGen: `C:/Users/jacop/.codex/generated_images/01a16e40-1f55-7542-afb6-bcb61e8589d2/exec-66cdd5aa-4145-4b0b-bf2f-c5d6d3fc7247.png`
SHA-256 PNG: `29dfa4187a90e80add2e005c907fccf5c56c2fa528086d08fb922573d64a5bda`
PNG sorgente integrato: `assets/sources/veloria-c01_brumalta-illustrated-v2.png` (3.294.410 byte).
WebP runtime lossless: `public/assets/scenery/veloria-c01_brumalta-illustrated-v2.webp` (2.415.840 byte), SHA-256 `2d35259ad7644f02dc38eaf0d590e5a34d69649db05220922122a2e1e49c2d3c`.
Verifica locale: PNG e WebP decodificano a 1536×1024 RGB con pixel identici. Manifest e registri globali restano da aggiornare dal responsabile del task.
