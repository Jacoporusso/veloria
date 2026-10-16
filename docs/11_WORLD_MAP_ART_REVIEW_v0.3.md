# Veloria — Revisione della mappa illustrata (v0.3)

**Asset:** `assets/concept/Veloria_World_Map_Concept_v0.1.png`

## 1. Status e approvazione

La mappa presenta l'identità della regione e rispetta i riferimenti visivi dichiarati: Borgofonte rurale, Bosco dei Veli monumentale, Brumalta come città-parco, Petalora ricca di ciliegi, Vetracielo e Ferraluce tecnologiche, Portolume costiera, Acquariva acquatica, Biancavetta innevata, Concordia/Lega finali. Il **linguaggio grafico di Petalora** è il riferimento privilegiato per la successiva art direction.

**Status:** concept visivo approvato come impostazione generale, non approvazione del world layout tecnico. Non è in scala e non riflette ogni strada/route dell'elenco in modo preciso.

## 2. Differenze fra illustrazione e specifica

- Nella mappa illustrata non sono etichettati tutti e 16 i percorsi e tutti i 6 dungeon. Non sono perciò "assenti" dal design: rimangono descritti nel World Map Design v0.2.
- È presente una rete di infrastrutture/monorotaia resa artisticamente. Le sue linee non sono un grafo tecnico utilizzabile per pathfinding o fast travel.
- La collocazione di alcune località è compressa per composizione: la **progressione giocabile** resta quella nel file `02_WORLD_MAP_DESIGN...`.
- Il titolo, le distanze e l'aspetto geologico sono strumenti di moodboard, non misure geografiche ufficiali.
- I segnali grafici che ricordano templi/torii e strutture moderne non costituiscono asset Tiled; richiedono produzione artistica originale.

## 3. Come trasformarla in world map usabile

1. Creare layer concettuali separati: acqua, coste, rilievi, biomi, insediamenti, routes, fast travel, punti d'interesse.
2. Stabilire coordinate **logiche** per i nodi (non pixels cartografici) e griglia di world design.
3. Disegnare una versione annotata con R01–R16, D01–D06 e le otto Palestre; correggere sovrapposizioni.
4. Per l'MVP costruire tilemap ortogonali reali in Tiled con layer collision/interact/spawn; asset HD pixel art ottimizzati per iPhone.
5. Separare la world map nel menu (illustrazione) dalle mappe di gioco esplorabili.

## 4. Design della transizione MVP

Borgofonte → R01 Sentiero dell'Alba → Bosco dei Veli → R02 Viale delle Fronde → Brumalta (P1). Petalora, Vetracielo e la costa compaiono come obiettivi futuri, non devono essere caricati nel primo vertical slice.

## 5. Decisione sulla direzione di Petalora

- Ciliegi rosa stratificati con petali mossi dal vento.
- Passerelle/ponteggi e terrazze in legno originale; piccoli ruscelli/cascate.
- Illuminazione morbida, forte varietà di piccoli dettagli vegetali.
- Leggibilità dei percorsi: non sacrificare collisioni chiare e silhouette giocabili alla densità decorativa.
- Special effect budget scalabile per non saturare GPU/batteria su mobile.
