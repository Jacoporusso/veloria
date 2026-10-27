# Piazzale della Lega — geometria di produzione

Griglia40×30 da32px,1280×960. La guida SVG è generata da `tools/generate_map_layout_guide.py` con20px di margine per i piedi; il PNG è il rendering a dimensioni native. Riferimenti di authoring, non fondali del runtime.

| Elemento | Cella Tiled | Vincolo |
|---|---|---|
| Ritorno al Cammino | x0,y14–17 | Unica uscita sulla mappa; bordo ovest aperto |
| Centro della Lega | 9,14 | Ingresso dal basso, avvicinamento9,15 |
| Mercato della Lega | 31,14 | Ingresso dal basso, avvicinamento31,15 |
| Accoglienza | 20,7 | NPC runtime, spazio libero20,8 |
| Portale della Lega | 20,5 | Interazione challenge-sequence; avvicinamento20,6 |
| Terrazza sud | 20,28 | Parte del piazzale, nessuna uscita verso altre mappe |

Il vecchio concept mostrava un ramo a est che non corrisponde ad alcuna uscita Tiled. Il nuovo fondale deve chiudere quel lato con giardini/acqua e trattare l’estensione sud come terrazza, senza suggerire un’altra strada. Le porte dei servizi e della Lega devono aprirsi sul pavimento effettivo, senza pilastri o arredi sui passaggi.

Stile coerente con Concordia illustrata: pietra chiara, vetro turchese, copertura rosa per il centro e lavanda per il mercato, dettagli del pavimento più leggeri. Gli indicatori, l’accoglienza e il comportamento del portale restano runtime; nessuna figura, icona o scritta nel fondale. Collisioni e regole della sfida restano invariati.
