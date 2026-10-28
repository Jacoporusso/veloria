# Interno Casa di Borgofonte v2

Nota del 28/10/2026: il documento seguente conserva il prompt e la geometria richiesti durante la generazione del 24/10. La review del risultato ha poi rilevato collisioni incoerenti con il pavimento effettivamente dipinto. L'illustrazione resta byte-identica; l'allineamento Tiled successivo è descritto in `docs/104_OPENING_INTERIORS_GEOMETRY_v0.1.md`.

Asset generato e integrato il 24/10/2026 con il tool ImageGen integrato. Le reference `world-readability-v2` e `characters-direction-v1` sono state usate solo per palette e trattamento pittorico; non sono stati inclusi personaggi. La nuova immagine è una reinterpretazione dipinta del fondale della camera, senza cambiare la geometria Tiled o gli hotspot.

## Asset

- Mappa: `veloria/borgofonte_home`, 24×16 celle da 32 px.
- Key: `veloria-borgofonte-home-interior-v2`.
- Source: `assets/sources/veloria-borgofonte-home-interior-v2.png` — 1536×1024 RGB, 1.939.082 byte, SHA-256 `726089fb9147c40c69da2ba907660ef548912f92996a3b4b07828c5b832ba8dd`.
- Runtime: `public/assets/scenery/veloria-borgofonte-home-interior-v2.webp` — WebP lossless, 1536×1024 RGB, 1.384.234 byte, SHA-256 `3952eb74781232a6e8801407da1017531d1c1f0d81399bfc91a60dd0e7f2c8a2`.
- I pixel decodificati di PNG e WebP sono identici.
- Rendering Tiled e binding: `content/maps/borgofonte_home.map.json` e `public/tilemaps/borgofonte_home.tmj`. È cambiata solo la key/path dell'immagine; footprint, spawn, collisioni, hotspot e uscita restano quelli esistenti.

## Geometria usata come riferimento

Origine nord-ovest; centri tile normalizzati su mappa 24×16. Parete nord fino a y=31,25%; pareti laterali nelle colonne 0–2 e 21–23, righe 5–12; parete sud da y=81,25% con soglia centrale di due tile, x=11–12. Spawn al centro di (12,12), cioè x=52,08%, y=78,13%; corridoio verso la porta libero. Scrittoio x=4–7, righe 5–6; libreria x=9–12, righe 3–4; letto x=17–20, righe 5–8 e hotspot esteso alle righe 4–8; pianta a (3,5). Le finestre e gli elementi sulle pareti seguono le posizioni dell'illustrazione precedente.

## Prompt iniziale

Use case: illustration-story  
Asset type: production background illustration for a playable top-down RPG bedroom map in Veloria, 24×16 tile grid, 3:2 aspect  
Input images: Image 1 is an approved Veloria illustrated world style reference only (painted forms, palette, softness); Image 2 is an approved character art reference only (hand-painted material treatment and warm palette). Do not depict any character from these references.  
Primary request: paint an original, clean, modern 2D illustrated bedroom interior background with warm, calm, welcoming mood. Match Veloria's approved softly painterly world style; make the scene feel hand-painted, matte, and gently dimensional, not a 3D room.  
Scene/backdrop: a quiet bedroom in Borgofonte, a rural garden village. Warm cream plaster, honey-colored wooden floor, sage-green textiles, two leafy plants, soft morning light from north windows. Original setting, not a real-world photo.  
Style/medium: modern hand-painted 2D storybook game environment, broad gouache-like color shapes, soft brush texture, simple clear silhouettes, gentle light and shadows, restrained natural detail, matte surfaces. Orthographic top-down RPG view, with a short cutaway north wall and low side/south wall strips; floor seen directly from above. Depth comes only from painted shadows and slight wall height, no camera perspective.  
Composition/framing: one full-map landscape image, 1536×1024, 3:2. North at top. The room follows a 24-column × 16-row grid. Room north wall spans x=0–100%, y=0–31.25%. Side walls occupy x=0–12.5% and x=87.5–100%, y=31.25–81.25%. The lower wall occupies y=81.25–100% with exactly one open doorway centered horizontally from x=45.8–54.2%, visibly connected to the inside floor. The player's spawn is center x=52.08%, y=78.13%; keep a broad clear walkable floor route straight south from spawn through the doorway. Landmarks: desk with open journal upper left, x=16.7–33.3%, y=31.25–43.75%; low bookcase on north wall upper center-left, x=37.5–54.2%, y=18.75–31.25%; bed upper right, x=70.8–87.5%, y=31.25–56.25%; small potted plant by west wall, x=12.5–16.7%, y=31–37.5%. Two north-wall windows around x=20–32% and x=68–80%. One additional hanging plant at the far-right wall. A flat sage rug centered around x=40–60%, y=56–78%; keep it visually walkable.  
Constraints: every stated landmark must stay within its specified area; preserve the central floor and doorway route completely clear. Keep the room footprint and furniture sparse and readable for gameplay. No characters, NPCs, creatures, props on the floor in the path, labels, UI, grid overlay, frame, border, or watermark.  
Avoid: pixel art, retro game art, isometric view, diagonal camera, 3D rendering, dollhouse diorama, photorealism, glossy wood, bright metal highlights, heavy black outlines, elaborate carved furniture, excessive tiny detail, clutter, extra doors or windows.

## Prompt dell'ultima passata

Use case: precise-object-edit  
Asset type: playable full-map bedroom scenery, 24×16 grid, 3:2, Borgofonte  
Input image: Image 1 is the current warm painted bedroom illustration. Preserve its style, room footprint, windows, wall pictures, bookcase, bed, plants, and bedside table.  
Primary request: correct only the exact scale/position of the sage rug, doorway and desk to align them more closely with the 24×16 Tiled map.  
Composition/geometry: keep image dimensions and north-up orthographic layout. The doorway in the south wall must be a centered 2-tile opening, exactly 8.33% of the full image width (x=45.83–54.17%). Narrow the current opening; remove any outside porch/platform beyond the bottom map edge. The walkable floor should meet the two-tile door gap directly. The arrival spawn tile center is x=52.08%, y=78.13%, just inside the threshold. Keep the vertical route from that point to the doorway unobstructed and visually clear. Reduce the rug to a small rectangular mat centered on the room: x=40–60% of image width and y=56–76% of image height. Keep it flat and walkable. Move the desk downward so its body is inside x=16.67–33.33%, y=31.25–43.75%; the tabletop/journal may extend slightly into the interaction area above, but should not cross north of y=25%. Keep the bookcase on the north wall at x=37.5–54.17%, the bed upper right, and other furniture in place.  
Style: retain the current soft matte hand-painted modern 2D illustration, warm cream/honey/sage colors and natural soft shadows.  
Constraints: do not change any other room geometry, wall position, window or furniture. Keep central corridor open. No new furniture, exterior platform, labels, people, characters, creatures, UI, border or watermark.  
Avoid: oversized rug, wide doorway, extra steps, objects in the spawn route, clutter, pixel art, retro rendering, hard outlines, glossy 3D.

## Ispezione e limiti

L'immagine integrata conserva il rapporto 3:2, la camera nord in alto, il letto in alto a destra, scrittoio in alto a sinistra, libreria sulla parete nord e il passaggio aperto dallo spawn alla porta centrale. Nessun personaggio o oggetto interattivo esterno alla stanza è dipinto. L'asset è uno sfondo illustrativo: collisioni e aree d'interazione restano definite dai dati Tiled.

La porta è centrata e corrisponde visivamente a circa due celle; la verifica visiva non può fissare al pixel il bordo pittorico delle pareti. Il tappeto risulta ancora un poco più largo e più a nord rispetto al riferimento testuale iniziale, ma non ha collisione in Tiled e lascia libero il tile di spawn e il corridoio per la soglia. Scrittoio e arredi hanno ombre e piccoli volumi 2.5D coerenti con il disegno della stanza; il risultato è più pittorico e meno retrò, pur conservando una lieve resa volumetrica.
