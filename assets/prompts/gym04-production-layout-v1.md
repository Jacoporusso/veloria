# Ferraluce — geometria dell’officina magnetica

Griglia32×24 da32px,1024×768. Guida SVG dalle collisioni effettive, con20px verso sud per i piedi; PNG renderizzato a dimensioni native. Audit dei contenuti eseguito in parallelo con agente Luna.

| Punto | Cella Tiled | Comportamento |
|---|---|---|
| Sorgente | 6,15 | Nodo runtime, nessun comando di rotazione |
| Primo nastro | 10,15 | Switch runtime, est per risolvere |
| Secondo nastro | 20,15 | Switch runtime, nord per risolvere |
| Campo | 20,8 | Switch runtime, ovest per risolvere |
| Ricevitore | 10,8 | Nodo runtime, nessuna rotazione |
| Rhea | 15,10 | NPC e sfida subordinata al circuito |
| Guida | 14,20 | Hotspot runtime |
| Ascensore | x12–19,y23 | Uscita verso la città |

Parete nord nelle celle y0–7; margini laterali bloccati larghi tre celle; angoli sud chiusi e ingresso centrale aperto. I sei piccoli footprint interni appartengono a nodi e NPC; non giustificano nuove macchine o placche dipinte. Il pavimento deve essere libero e neutro, con parete nord allineata al limite y33,33% del canvas.

Circuiti luminosi, direzioni, sorgente, ricevitore e stato risolto sono disegnati dal gioco tramite `gym04magnetic`. Non dipingerli nel fondale. Coil e piante decorative restano sui margini solidi. Rotazioni, persistenza, prerequisito del rapporto e premio non cambiano con l’artwork.
