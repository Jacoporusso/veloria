# D05 Grotte del Cristallo — brief geometrico per il fondale

## Griglia e fonte

`public/tilemaps/d05_grotte_cristallo.tmj` definisce una mappa ortogonale 40×30, con celle da 32×32 px (1280×960 px). Coordinate Tiled zero-based: x cresce verso est, y verso sud.

Il layer `collision` contiene rettangoli che coprono le fasce non calpestabili e i terminali; gli oggetti sono tutti denominati genericamente `outside-floor-or-solid-terminal` e non hanno proprietà. Non permettono di distinguere parete, bordo, acqua o volume di struttura. Non ci sono collisioni con `blocksUntilFlag` o `blocksWhenFlag`: la geometria fisica attuale non è condizionale. Il ricevitore a (36,4) è invece nominato nel layer collision e coincide con l’hotspot `Passaggio superiore`: resta un oggetto solido/interattivo, con accesso da una cella adiacente.

Il layer `characters` di D05 è vuoto; la Guida Livia e il rapporto della missione sono in R14.

## Interazioni e requisiti

| Punto | Cella Tiled | Funzione / requisito |
|---|---:|---|
| Misuratore inferiore | (5,13) | hotspot `d05_low_reading`; ricerca richiede `badge_ghiaccio_awarded`, quindi imposta `q_d05_low_read` solo con medaglia Brina |
| Misuratore centrale | (18,11) | hotspot `d05_middle_reading`; imposta `q_d05_middle_read` con `badge_ghiaccio_awarded` |
| Console delle correnti | (29,2) | regolatore `crystalclimate`; richiede `badge_ghiaccio_awarded`, `q_d05_low_read` e `q_d05_middle_read`; controllo Ventilazione target Delicata e Scambio termico target Moderato; verifica riuscita imposta `q_d05_climate_balanced` |
| Passaggio superiore | (36,4) | hotspot `d05_upper_passage`, sulla stessa cella del ricevitore solido; lettura `q_d05_upper_read` possibile dopo `q_d05_climate_balanced` |
| Habitat cristallino | x=33–35, y=14–15 | encounter table `veloria/d05_crystal_patch`, chance 0,2 |

Il file quest `content/quests/crystal_research.quest.json` avvia la ricerca all’ingresso D05 solo con `badge_ghiaccio_awarded`. Le letture bassa e centrale richiedono la medaglia; la console richiede inoltre entrambe; la lettura alta richiede il clima bilanciato. Il rapporto viene registrato da Livia in R14 e richiede tutte e quattro le prove (`q_d05_low_read`, `q_d05_middle_read`, `q_d05_climate_balanced`, `q_d05_upper_read`); imposta `q_d05_report` e assegna 700 monete e 2 Pozioni.

## Uscite

| Uscita | Cella | Destinazione | Requisito |
|---|---:|---|---|
| Varco di Cristallo | (11,29) | `veloria/r14_varco_cristallo`, spawn `from_cavern` | nessuno nel trigger |
| Passo delle Due Luci | (38,3) | `veloria/r15_passo_due_luci`, spawn `from_cavern` | `q_d05_report`; messaggio di blocco invita a portare prima le letture a Livia presso il rifugio R14 |

La prova Brina di accesso parte dalla soglia est Biancavetta (39,15), bloccata prima di `badge_ghiaccio_awarded`; una volta aggiunta la medaglia attraversa R14 ed entra in D05 dall’uscita (34,5). D05 non introduce un altro requisito di medaglia sulle proprie uscite: la progressione interna è governata dai flag di ricerca descritti sopra.

## Percorsi e allineamento da preservare

`tests/e2e/crystal.spec.ts` esercita la missione e la geometria attraverso camminate reali con `walkTo`, che calcola percorsi sulla collisione Tiled ed evita le encounter-zone:

- ingresso da R14: target trigger D05 (34,5), spawn D05 `from_r14` (11,28);
- stazione centrale, approccio (18,12), adiacente all’hotspot (18,11);
- stazione bassa, approccio (5,14), adiacente all’hotspot (5,13);
- console, approccio (29,3), adiacente al regolatore (29,2);
- passaggio/ricevitore superiore, approccio (36,3), adiacente all’hotspot (36,4);
- rientro R14 dal varco sud (11,29), poi approccio a Livia in R14 (29,12), senza passare sulla sua cella NPC (29,11);
- uscita ovest R14 (0,16) e ritorno a Biancavetta.

Il fondale deve mantenere percorsi continui fra ingresso, terrazza bassa, centrale, console alta e ricevitore, nonché accesso leggibile alla radura habitat orientale (33–35,14–15) e alle due uscite. Conservare spazio visivo calpestabile sotto gli approcci riportati; gli oggetti d’interazione restano alle coordinate Tiled. Evitare di trasformare la console o il ricevitore in un blocco che tagli il passaggio fra terrazze.

## Copertura visuale dei test e limiti

`tests/e2e/crystal.spec.ts` copre i prerequisiti della console, il salvataggio/ripristino delle regolazioni, le letture bassa/centrale/alta, il rapporto Livia, la ricompensa e il ritorno a Biancavetta. Verifica inoltre il blocco della soglia Biancavetta prima della medaglia. La spec include screenshot del pannello console in landscape e portrait, della lettura superiore e del rapporto.

Non certifica il nuovo fondale: non asserisce key o decode dell’asset full-scene, né acquisisce i piedi e i punti di contatto sul fondale a ciascun servizio/approccio in portrait e landscape. Non cammina fino all’uscita est D05 (38,3) per verificare visivamente il requisito `q_d05_report`, non documenta screenshot della radura habitat e non confronta le corsie dipinte con i piedi del personaggio. Sono i punti da aggiungere alla successiva verifica grafica; non si deducono porte o sagome d’edificio dai rettangoli di collision generici.

## Fonti

- `public/tilemaps/d05_grotte_cristallo.tmj`: griglia, collisioni, interazioni e uscite.
- `content/maps/d05_grotte_cristallo.map.json`: spawns, connessioni e encounter table.
- `content/regulators/crystal_climate.v1.json`: requisiti e livelli target della console.
- `content/quests/crystal_research.quest.json` e `content/dialogue/world.v1.json`: condizioni, letture, rapporto e ricompensa.
- `tests/e2e/crystal.spec.ts`: prove d’integrazione esistenti.
