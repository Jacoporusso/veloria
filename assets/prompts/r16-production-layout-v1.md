# Cammino dell’Equilibrio — geometria di produzione

Tiled40×30,1280×960 worldpx. `tools/generate_map_layout_guide.py` produce la guida SVG dalle collisioni e dalle zone incontro reali, con20px verso sud per i piedi. Il PNG è il rendering a dimensioni native della stessa guida. Sono riferimenti di authoring: il fondale finale resta raw ImageGen.

| Elemento | Celle Tiled | Vincolo |
|---|---|---|
| Concordia | x0,y19–20 | Percorso aperto fino al bordo ovest |
| Maia | 9,20 | Sprite runtime, avvicinamento9,21 |
| Tobia | 20,13 | Sprite runtime, avvicinamento20,14 |
| Habitat ovest | x8–10,y15–16 | Accesso dalla cella8,17 |
| Habitat centrale | x20–22,y18–19 | Accesso dalla cella20,17 |
| Habitat est | x32–34,y10–11 | Accesso dalla cella31,10 |
| Piazzale della Lega | x39,y1–2 | Percorso aperto fino al bordo nord-est |

Percorso diagonale su terrazze, con margini organici leggeri e tre radure d’erba sullo stesso livello del sentiero. Nessuna balaustra sulle celle libere e nessuna falsa porta giocabile nel fondale. Acqua, rocce e vegetazione restano nelle parti bloccate. Gli allenatori e le sagome condivise degli habitat sono disegnati dal runtime, non inclusi nell’immagine.

Lo stile segue Concordia illustrata; il precedente Cammino è un riferimento narrativo, non una guida di collisione. La revisione nel gioco deve verificare piedi, margini, accessi all’erba e transizioni reali prima dell’accettazione. Nessuna modifica a collisioni, probabilità, specie o requisiti è giustificata dalla sola immagine.
