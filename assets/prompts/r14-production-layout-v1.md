# R14 Varco di Cristallo — guida di produzione

Il diagramma è [r14-production-layout-v1.svg](r14-production-layout-v1.svg). È una maschera 1280×960 px per la griglia Tiled 40×30, con celle da 32×32 px; coordinate zero-based, x verso est e y verso sud. La griglia e la geometria provengono da `public/tilemaps/r14_varco_cristallo.tmj`.

## Codifica geometrica

- Blu-grigio `#8da4b6`: celle coperte dal layer `collision`.
- Sabbia `#e5cfa7`: celle non coperte da collisione.
- Ogni cella libera ha un’estensione di 20 px verso sud (altezza SVG 52 px). Il fondo bloccato viene disegnato prima del pavimento: il margine resta visibile sotto i piedi del personaggio, anche quando la cella subito a sud è bloccata. La maschera è una guida artistica; le collisioni logiche rimangono quelle del Tiled.
- Verde `#76a879`: habitat dichiarato nei trigger, con lo stesso margine sotto i piedi.
- È esclusa dalla maschera bloccata solo la cella dinamica dell’NPC Guida del varco (29,11), dichiarata nel layer `characters`; coincide con un oggetto del layer `collision`.
- Non sono rappresentati marker, testi, personaggi o sagome d’edifici.

## Coordinate Tiled e requisiti

| Elemento | Cella o area | Dati dichiarati |
|---|---:|---|
| Uscita ovest — Biancavetta | (0,16) | destinazione `veloria/biancavetta`, spawn `from_r14`; nessun requisito nel trigger |
| Uscita nord-est — Grotte di Cristallo | (34,5) | destinazione `veloria/d05_grotte_cristallo`, spawn `from_r14`; nessun requisito nel trigger |
| Habitat laterale | x=23–25, y=19–20 | `veloria/r14_crystal_patch`, probabilità incontro 0,2 |
| Guida del varco | (29,11) | NPC `r14_guide`, dialogo `r14_guide`; appearance ID `r14-guide-livia`, frame 2 |
| Sensore del belvedere | (12,5) | hotspot, dialogo `r14_wind_reading` |
| Rifugio caldo | (30,12) | hotspot `serviceId=pokemon_center`; messaggio: “Un rifugio al riparo dal vento. Puoi far riposare la squadra prima di entrare nella grotta.” |

Il Tiled non specifica requisiti per le due uscite; `content/maps/r14_varco_cristallo.map.json` conferma connessioni con `requiresFlags: []`. Il rifugio è dichiarato come punto di cura. Non sono definiti footprint di edifici né posizioni di porte: i rettangoli del layer collision hanno nomi generici e non permettono di attribuire forma o categoria agli ostacoli.

## Fonti e limiti

- `public/tilemaps/r14_varco_cristallo.tmj`: dimensioni e layer `collision`, `characters`, `interactions`, `triggers`.
- `content/maps/r14_varco_cristallo.map.json`: identità mappa, spawn e requisiti delle connessioni.

Questa guida descrive la maschera logica Tiled e non certifica l’allineamento del fondale illustrato.

## Rigenerazione

```powershell
python tools/generate_map_layout_guide.py public/tilemaps/r14_varco_cristallo.tmj assets/prompts/r14-production-layout-v1.svg
python -m unittest tests.test_map_layout_guide
```

Il generatore non modifica il Tiled; rifiuta geometrie ruotate, gruppi e offset non supportati invece di produrre una guida approssimativa. I test verificano il margine sotto i piedi, l’esclusione puntuale degli NPC da collisioni aggregate, l’habitat e l’immutabilità della sorgente.
