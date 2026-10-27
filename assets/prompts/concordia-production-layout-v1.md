# Concordia — geometria del fondale illustrato

`public/tilemaps/concordia.tmj`: 40×30 celle da32px, 1280×960. La guida SVG è prodotta da `tools/generate_map_layout_guide.py`, con margine piedi20px; PNG ottenuto renderizzando lo stesso SVG a1280×960 senza trasformazioni. Sono riferimenti di authoring, non immagini del runtime. Le celle degli attori non vengono trasformate in ostacoli dipinti.

| Destinazione | Cella | Vincolo |
|---|---:|---|
| Passo delle Due Luci | 0,15 | Boulevard aperto fino al bordo ovest |
| Palestra | 20,4 | Soglia visibile; richiede il piano concordato con Elia |
| Elia | 29,10 | Piano libero per il personaggio runtime, nessun NPC dipinto |
| Centro Pokémon | 8,10 | Porta sul ramo ovest, avvicinamento8,11 |
| Mercato | 13,11 | Avvicinamento13,12, senza bancarelle sui piedi |
| Monorotaia | 20,23 | Terminale runtime e arrivo20,24 |
| Santuario | 31,13 | Soglia con avvicinamento31,14; richiede Medaglia Armonia |
| Indicazioni Santuario | 32,13 | Cartello runtime, non testo nel fondale |
| Cammino dell’Equilibrio | 39,15 | Bordo est aperto; richiede ripristino della risonanza |
| Indicazioni Lega | 37,16 | Cartello runtime, non testo nel fondale |

Il fondale mantiene l’identità di città delle due luci: pietra chiara, vetro turchese, giardini e cascate. Il riferimento precedente serve alla composizione narrativa; il Passo delle Due Luci illustrato guida il trattamento. Nessun nuovo percorso o ingresso giocabile è introdotto dal solo disegno. Collisioni, requisiti, servizi e ricompense restano nei contenuti esistenti.

Il candidato deve essere verificato nel gioco presso ogni destinazione nei due orientamenti, non accettato dalla sola somiglianza con la guida. Eventuali correzioni conservano il raw originale e la provenienza.
