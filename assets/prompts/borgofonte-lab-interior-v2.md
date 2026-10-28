# Laboratorio di Elia — illustrazione moderna v2

Nota del 28/10/2026: fonte e pixel restano invariati; il derivato è copiato nella cartella canonica `public/assets/scenery/`. Il vecchio file in `public/assets/sprites/` resta disponibile. Geometria invariata; accettazione runtime in `docs/104_OPENING_INTERIORS_GEOMETRY_v0.1.md`.

Strumento: OpenAI ImageGen integrato, modifica del fondale v1. Sorgente `assets/sources/borgofonte-lab-interior-v2.png`; derivato WebP lossless in `public/assets/sprites/`. Camera e geometria Tiled invariati. Primo ambiente del rifacimento completo, non completamento dell’intero obiettivo.

## Prompt

Edit target: existing Borgofonte laboratory background. Redraw as a premium MODERN HAND ILLUSTRATED 2D adventure game background, smooth clean painted shapes, soft warm daylight, cream plaster, light oak, sage/teal botanical research equipment, subtle coral accents. No pixel art, no 3D rendering, no isometric camera. Preserve EXACT orthogonal overhead composition and furniture footprints: image 3:2, displayed768x512; north blocked wall y0-160, side walls x0-96 and672-768; left workbench x96-288 y160-224, right workbench x480-672 y160-224; seed archive x288-480 y160-192. All floor below benches y224-384 MUST BE CLEAR, spacious and walkable. South walls y384-512 with exactly centered open doorway x352-416 extending through bottom edge. Match doorway at45.83%-54.17% image width. Simplify heavy timber beams, ornate tile border and excessive slab seams into attractive lighter continuous limestone floor and softly rounded cabinets, contemporary illustrated children adventure feel. Keep microscopy, fern dome, books, plant specimens as clear large charming details confined to north furniture. Absolutely no people, creatures, text, UI, central furniture, decorative floor obstacles. Outside cutaway walls very dark muted teal. Preserve original map alignment strictly.

## Controllo visivo

Output 1536×1024: corridoio centrale libero, due banchi e archivio nelle impronte esistenti; apertura sud centrata. Tolto il bordo ornamentale del pavimento e la trama pixel; forme più morbide e luce calda. Il fondale non contiene personaggi. Accettazione completa richiede verifica nel gioco e offline.
