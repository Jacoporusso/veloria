# Sentiero dell’Alba — raccordo uscita est

> Tentativo non integrato: il candidato non rispettava le coordinate. Source, runtime e voce del manifest sono stati ripristinati agli originali. Esito e misurazioni in `r01-sentiero-alba-exit-raccordo-audit-v1.md`.

24 ottobre 2026. Revisione mirata del fondale R01 esistente con il tool integrato ImageGen. La sorgente mantiene dimensioni e rapporto 3:2. Scopo: raccordare l’asse principale `[y9–11]` all’uscita Tiled est `[29,8,1,1]` con una curva dolce negli ultimi 3–4 tile; mantenere la superficie chiara e morbida già approvata.

## Prompt esatto

Edit this existing map background with a single focused correction. It is Veloria's Sentiero dell'Alba, a 1536x1024 full-map image, exact 3:2 aspect.

The real eastern map exit is centered at x=98.3%, y=42.5% (cell x29,y8 on a 30x20 grid). The broad main path crosses at y45–60%. Gently curve its final 3–4 tile lengths northward and join the east boundary precisely at y42.5%. Keep the road continuous, clearly walkable, and open at the edge, with no vegetation covering the opening. This should be a shallow natural bend, not a fork or extra road.

Keep path material light and soft: warm pale compacted earth, sparse flat cream stepping stones, soft edges, restrained low-contrast texture. Preserve the existing widths, stream, trees, rocks, vegetation, land layout, color palette, lighting, painted style, composition, dimensions, scale, and top-down orthographic camera everywhere else. Do not move, add, remove, or reinterpret any other object. No people, text, UI, icons, markers, signs, pickups, sensors, buildings, bridges, walls, fences, or new exits. Keep all open ground open.

## Esito

Il candidato ImageGen salvato come `exec-1ac11cb5-24c3-45b8-a75e-8026b0190923.png` non è stato integrato: il sentiero raggiungeva il bordo est troppo in alto. Il fondale runtime e la sorgente sono stati ripristinati dal commit HEAD. I tentativi successivi e le misure sono documentati in `r01-sentiero-alba-exit-raccordo-audit-v1.md`.
