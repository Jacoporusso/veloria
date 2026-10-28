# Casa e laboratorio: geometria e illustrazioni iniziali

Entrambe le illustrazioni moderne già esistenti sono conservate senza generare nuovi pixel. Sorgenti 1536×1024, mondo 768×512: PNG e WebP decodificati sono RGBA-identici. Il laboratorio passa alla copia canonica `public/assets/scenery/borgofonte-lab-interior-v2.webp`, byte-identica al file precedente, che resta disponibile e precachato per la finestra di aggiornamento. Chiave grafica invariata. Provenienza completa in `assets/map-parity-v2.json`; prompt originali in `assets/prompts/borgofonte-home-interior-v2.md` e `assets/prompts/borgofonte-lab-interior-v2.md`.

## Casa: correzione delle collisioni

L'immagine mostra il bordo nord del pavimento intorno a y=100 world, mentre il vecchio collider terminava a y=160: anche il corridoio vuoto tra scaffale e letto era bloccato. Confronto eseguito sulla posizione a terra del personaggio: container al centro tile, ombra a +20px, piedi circa a tileY×32+36. I collider vengono rasterizzati in celle intere; il limite pittorico non è una linea di pixel esatta.

| Elemento | Rettangolo world x, y, larghezza, altezza |
| --- | --- |
| Parete nord | 0, 0, 768, 96 |
| Ritorno alto ovest / est | 0, 96, 96, 64 / 672, 96, 96, 64 |
| Parete laterale ovest / est | 0, 160, 64, 224 / 704, 160, 64, 224 |
| Parete sud ovest / est | 0, 384, 352, 128 / 416, 384, 352, 128 |
| Scrittoio | 128, 128, 128, 96 |
| Letto | 544, 96, 128, 192 |
| Pianta | 96, 96, 32, 32 |
| Scaffale | 288, 96, 160, 32 |
| Comodino | 512, 96, 32, 64 |

La forma a gradino dei lati è necessaria: celle x=2/21, y=3/4 sono ancora sui ritorni in legno, mentre da y=5 il pavimento è libero. Anche la parete sud viene anticipata alla riga corretta: i piedi della riga12 cadono sul corrimano, salvo il varco centrale. Tutti gli altri layer, hotspot, spawn e trigger d'uscita restano identici. Non viene ridisegnata né deformata l'illustrazione per adattarla a collisioni errate.

Il laboratorio conserva la geometria attuale: la proiezione di banchi e archivio spiega le parti visive sopra i rettangoli a terra. Non è emersa una discrepanza globale che giustifichi la modifica dei mobili o della parete nord.

## Verifiche

Validatore passato su 750 media, 48 fondali registrati e 48 mappe. Test di connettività passato su pavimento nord/lati, muri e arredi solidi, accesso a letto/diario/scaffale. Undici casi Chrome distinti passati: rendering dei 48 fondali e identità runtime; porte e approcci delle due stanze; quattro controlli camera; due giri della casa con notifica dello scaffale e reload; recupero di una vecchia posizione sul bordo sud tramite il normale comando Salva, con Charmander ferito, PP consumati e risorse preservate. Screenshot di pavimento, arredi e laboratorio rivisti in portrait/landscape. La prima aspettativa dello scaffale cercava un dialogo invece della notifica effettiva; corretto il test senza cambiare il comportamento del gioco.

Tre prove di produzione offline passate: primo accesso a casa e laboratorio tramite porte reali, pavimento nord, dialogo Elia e ritorno/reload; decodifica delle risorse canoniche del cast e delle scene; prima decodifica dei 48 fondali. Build passata con il consueto avviso chunk Phaser. Suite: 820 test dominio/persistenza, 154 Python, TypeScript senza errori. Discovery CI: 396 casi browser una sola volta, 48 risorse offline divise 24+24.

Il conteggio 48/48 attesta registrazione e binding dei fondali, non il completamento dell'intero gioco. Restano personaggi, cicli di camminata e verifica della progressione naturale fino alla Lega.
