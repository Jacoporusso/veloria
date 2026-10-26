# R13 Tornanti Bianchi — guida di produzione

SVG piatto 1280×960, mappa Tiled 40×30 celle da 32 px, coordinate zero-based. È generato solo dalla collision mask e dagli encounter-zone di `public/tilemaps/r13_tornanti_bianchi.tmj`; non contiene titolo, legenda, margini, marker o oggetti runtime.

## Regole di rasterizzazione

- Blu-grigio `#8da4b6`: celle coperte da oggetti del layer `collision`.
- Sabbia `#e5cfa7`: celle non coperte da collisione.
- Verde `#8faf70`: celle libere coperte da encounter-zone.
- Ogni cella libera ha una fascia aggiuntiva di 20 px verso sud, come la guida R12, per mantenere il terreno sotto i piedi. Il bordo SVG ritaglia naturalmente la fascia oltre y=960.
- Sono escluse dalla maschera bloccata solo le due impronte dinamiche nominate nel Tiled: `Alma collision` a (25,13) e `veloria/special_articuno footprint` a (27,23). Tutti gli altri solidi restano bloccati.

## Coordinate da preservare

- Uscita ovest per Passobrina: (0,24), una cella.
- Uscita est per Biancavetta: (39,5), una cella.
- Alma: (25,13).
- Indicazioni: (14,13).
- Articuno: (27,23), visibile con `q_league_completed`.
- Prato neve alto: x=8–9, y=10–11.
- Prato neve basso: x=32–33, y=17–18.

## Fonte e limite

Fonte geometrica unica: `public/tilemaps/r13_tornanti_bianchi.tmj`, layer `collision`, `interactions` e `triggers`. La mappa stabilisce esattamente le celle d’uscita e d’interazione; la guida non rappresenta impronte di edifici o percorsi illustrativi non codificati nei layer Tiled.
