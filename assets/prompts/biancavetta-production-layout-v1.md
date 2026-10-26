# Biancavetta — guida di produzione

Il diagramma è [biancavetta-production-layout-v1.svg](biancavetta-production-layout-v1.svg), una maschera piatta di 1280×960 px derivata dalla griglia Tiled 40×30 con celle da 32×32 px. Coordinate zero-based; x cresce verso est e y verso sud.

## Codifica geometrica

- Blu-grigio `#8da4b6`: celle coperte dal layer `collision` di `public/tilemaps/biancavetta.tmj`.
- Sabbia `#e5cfa7`: celle non coperte da collisione.
- La sabbia di ogni cella libera si estende per 20 px verso sud (altezza disegnata 52 px), sopra il fondo blu: è un margine visivo per i piedi, non un ampliamento delle celle percorribili.
- Sono esclusi dalla maschera pittorica l'impronta NPC `npc-footprint-biancavetta_guide` a (32,15), il terminale funivia (29,23) e il Cartello Varco (35,13), che rimangono oggetti/segnali runtime. Le loro collisioni reali in Tiled non cambiano.
- Il diagramma non rappresenta edifici, porte, rampe o forme di oggetti non definite nei dati.

## Servizi, interazioni e uscite

| Elemento | Cella Tiled | Dato/runtime |
|---|---:|---|
| Centro Pokémon | (7,13) | hotspot `serviceId=pokemon_center` |
| Bottega di quota | (14,13) | hotspot `shopId=veloria/biancavetta_market` |
| Palestra Ghiaccio | (20,6) | uscita verso `veloria/gym07_biancavetta`, spawn `from_city`; nessun requisito dichiarato nel trigger |
| Terminale funivia | (29,23) | trasporto `mountain_cable`, fermata `biancavetta`; il footprint è bloccato in Tiled |
| Varco del Cristallo | (35,13) | hotspot `dialogueId=biancavetta_crystal_sign` |
| Casa ovest | (7,7) | presidio, hotspot con messaggio sulle nevicate |
| Cupola est | (30,8) | osservatorio, hotspot con messaggio sulle misurazioni |
| Uscita ovest | (0,17) | verso `veloria/r13_tornanti_bianchi`, spawn `from_biancavetta`; nessun requisito dichiarato |
| Uscita palestra | (20,6) | verso `veloria/gym07_biancavetta`, spawn `from_city`; nessun requisito dichiarato |
| Uscita est | (39,15) | verso `veloria/r14_varco_cristallo`, spawn `from_biancavetta`; richiede `badge_ghiaccio_awarded` |

La palestra è codificata come uscita Tiled, non come hotspot distinto. Le celle riportate sono le posizioni esatte degli oggetti Tiled, non dimensioni di porte o impronte visive. Per l’illustrazione, lasciare terreno continuo e leggibile agli approcci accessibili senza dedurre sagome di edifici dai rettangoli generici di collisione.

## Fonti e limiti

- `public/tilemaps/biancavetta.tmj`: dimensioni, layer `collision`, `characters`, `interactions` e `triggers`.
- `content/maps/biancavetta.map.json`: spawns, destinazioni e collegamenti mappa.

Il file non modifica collisioni né certifica la percorribilità del fondale illustrato; è un riferimento geometrico ricavato dai dati disponibili.
