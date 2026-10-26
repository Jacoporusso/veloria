# Passobrina — guida geometrica derivata da Tiled

Il diagramma è [passobrina-layout-guide-v1.svg](passobrina-layout-guide-v1.svg). La geometria è derivata esclusivamente da `public/tilemaps/passobrina.tmj`: griglia 40×30, tile 32×32 px, coordinate zero-based (x verso est, y verso sud). Non usa artwork o screenshot.

## Legenda e metodo

- Le forme scure riproducono gli oggetti del layer `collision`, rasterizzati sulle celle coperte. L’ingombro della Guida alpina a (28,13) è distinto perché l’oggetto Tiled ha un nome esplicito.
- Ogni cella libera dalla collisione è color sabbia. Il quadrato interno 20×20 px lascia 6 px di margine per lato e indica una zona centrale di appoggio del piede; è una misura grafica, non un collider aggiunto a Tiled.
- Le linee verdi sono percorsi ortogonali minimi calcolati dalla cella interna accanto all’uscita E1 agli approcci dei servizi, evitando i trigger di uscita.
- I marker gialli indicano le celle effettive del layer `interactions`; i quadrati turchesi indicano celle cardinali adiacenti libere da cui rivolgersi verso l’interazione.
- Le uscite sono trigger Tiled e le etichette riportano solo nomi e requisiti presenti nelle loro proprietà.

## Punti e accessi

| Marker | Cella Tiled | Approccio libero | Riferimento |
|---|---:|---:|---|
| E1 | (0,15) | (1,15), verso ovest | Uscita per Valle del Vento / R12 |
| E2 | (39,7) | (38,7), verso est | Uscita per Tornanti Bianchi / R13; richiede `q_passobrina_report` |
| I1 | (9,14) | (9,15), verso nord | Centro Pokémon |
| I2 | (14,14) | (14,15), verso nord | Bottega alpina |
| I3 | (32,8) | (31,8), verso est | Lettura della neve |
| I4 | (29,21) | (29,20), verso sud | Terminale funivia; la cella interattiva è coperta da collisione Tiled |
| A4b | (29,21) | (29,22), verso nord | Secondo approccio al terminale funivia |

Gli approcci sono celle libere adiacenti ricavate dalla geometria Tiled. Non sono affermazioni sulla forma di una porta nell’illustrazione.

## Limite della geometria disponibile

Tiled non definisce un layer separato con sagome nominate per edifici o porte. Gli oggetti solidi sono chiamati genericamente “Roccia, acqua, vegetazione o struttura”; la guida li mostra come collisioni senza dedurne la categoria. Hotspot, terminale e trigger d’uscita hanno invece posizioni esplicite.

## Fonte

- `public/tilemaps/passobrina.tmj`: layer `collision`, `characters`, `interactions` e `triggers`.

La guida descrive la geometria logica della mappa, non certifica l’allineamento visivo del fondale e non modifica asset runtime o collisioni.

