# Santuario delle Due Luci — geometria di produzione

Mappa32×24 celle da32px,1024×768. `tools/generate_map_layout_guide.py` produce la guida SVG dalle collisioni reali, aggiungendo20px verso sud per l’ancoraggio dei piedi. Il PNG è il rendering dello stesso SVG a dimensioni native. Riferimenti di authoring, non fondali finali.

| Elemento | Coordinate Tiled | Avvicinamento verificabile |
|---|---|---|
| Stazione naturale | x9–10,y8–9 | 9,10 |
| Stazione della rete | x21–22,y8–9 | 21,10 |
| Console | 16,15 | 16,16 |
| Ricevitore e segnale runtime | x14–17,y4–5 | 16,6 |
| Elia | 18,17 | 18,18 |
| Mewtwo | 21,16 | 21,17 |
| Ritorno a Concordia | x14–17,y23 | Corridoio sud aperto fino al bordo |

Le due stazioni hanno plinti nelle rispettive impronte solide. Console e segnale sono renderizzati dal gioco: nessun grande oggetto aggiuntivo deve coprire gli avvicinamenti. Elia e Mewtwo restano esclusivamente sprite runtime. La cella Mewtwo è libera prima della Lega e dopo la cattura; è occupata solo durante la disponibilità dell’incontro speciale. Il fondale non deve fissare uno di questi stati.

Direzione: pietra chiara e luce calda, acqua turchese sul margine ovest, cristalli viola sul margine est, coerenza illustrata con Concordia. Piccoli dettagli e vegetazione restano fuori dai passaggi. Coordinate, collisioni e requisiti non si adattano al disegno: il candidato va verificato nel gioco e corretto se necessario.
