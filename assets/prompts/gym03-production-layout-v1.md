# Vetracielo — geometria del fondale della palestra

Griglia30×30 da32px,960×960, composizione quadrata. Guida SVG da `tools/generate_map_layout_guide.py`, con20px verso sud per i piedi; PNG renderizzato a dimensioni native. Il vecchio fondale rooftop è riferimento narrativo, non collisione.

| Punto | Cella Tiled | Avvicinamento |
|---|---|---|
| Aster | 15,10 | 15,11 |
| Linea Giardini | 7,23 | 7,24 |
| Linea Vetro | 23,19 | 23,20 |
| Linea Cielo | 15,15 | 15,16 |
| Guida | 13,27 | Cartello runtime |
| Ritorno alla città | x13–17,y29 | Corridoio sud aperto |

Le tre console e i segni di attivazione sono runtime. Il fondale non deve contenere placche, frecce, pulsanti o circuiti che sembrino altri controlli. Il padiglione settentrionale è decorativo e non introduce un’uscita. Monorotaie e vegetazione restano fuori dal pavimento percorribile. Mantengono autorità Tiled e dialoghi: ordine Giardini→Vetro→Cielo, cancello della sfida e ricompensa.
