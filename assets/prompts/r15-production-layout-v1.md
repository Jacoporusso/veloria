# R15 Passo delle Due Luci — brief geometrico per il fondale

## Griglia e bioma

La mappa `veloria/r15_passo_due_luci` usa il bioma `highland_garden`. `public/tilemaps/r15_passo_due_luci.tmj` è una griglia ortogonale 40×30 con celle da 32×32 px (1280×960 px); coordinate zero-based, x verso est e y verso sud.

## Collisioni e footprint dinamici

Il layer `collision` contiene soprattutto rettangoli permanenti `outside-authored-floor`. Due `solid-footprint` permanenti occupano (17,3) e (29,18), ciascuno sovrapposto alla rispettiva stazione interattiva. Il footprint di Nilo a (22,12) è anch’esso permanente: corrisponde alla sua cella NPC e va mantenuto come ostacolo al cammino.

Il solo collider condizionale è `veloria/special_moltres footprint` a (24,15), una cella con proprietà `blocksWhenFlag=q_league_completed` e `blocksUntilFlag=q_special_moltres_caught`. L’interazione Moltres nella stessa cella ha `visibleWhenFlag=q_league_completed` e `collectedFlag=q_special_moltres_caught`: prima della Lega la creatura è nascosta e il footprint non blocca; dopo la Lega appare e occupa il passaggio finché non viene catturata; dopo la cattura il collider si rimuove. È una condizione di gameplay, distinta dalle collisioni permanenti del paesaggio.

## Punti e condizioni da preservare

| Elemento | Cella/area Tiled | Dati e requisiti |
|---|---:|---|
| Lettura naturale | (17,3) | hotspot `r15_nature_reading`; registra `q_r15_nature_read` solo con `q_d05_report` |
| Lettura della rete | (29,18) | hotspot `r15_network_reading`; registra `q_r15_network_read` solo con `q_d05_report` |
| Nilo | (22,12) | NPC `r15_nilo`, sprite frame 2, appearance `rival-nilo`; battaglia opzionale richiede `q_d05_report`, una sola sconfitta tramite `trainer_r15_nilo_defeated`, poi flag `q_r15_nilo_helped` |
| Giardino del passo | x=26–27, y=5 | habitat `veloria/r15_garden_patch`, encounter chance 0,2 |
| Moltres | (24,15) | incontro speciale `veloria/special_moltres`; visibile dopo `q_league_completed`, impronta occupata fino a `q_special_moltres_caught` |
| Uscita ovest | (2,9) | verso `veloria/d05_grotte_cristallo`, spawn `from_r15`; nessun requisito nel trigger |
| Uscita est | (39,9) | verso `veloria/concordia`, spawn `from_r15`; nessun requisito nel trigger |

Il giocatore arriva da D05 allo spawn `from_cavern` (2,10) e da Concordia allo spawn `from_concordia` (38,9). Entrambe le connessioni in `content/maps/r15_passo_due_luci.map.json` riportano `requiresFlags: []`. L’ingresso iniziale da D05 è comunque protetto dal trigger D05 a (38,3), che richiede `q_d05_report`; il gate è sulla mappa di provenienza, non sui due trigger d’uscita R15.

La quest `content/quests/concordia_research.quest.json` richiede `q_d05_report` per registrare la visita e le due letture. Le stazioni descrivono rispettivamente il ritmo naturale e la sua amplificazione instabile; portare entrambe le letture a Elia a Concordia abilita il piano `q_concordia_restore_plan`. Conservare percorsi visivamente continui fra gli ingressi, le due stazioni, Nilo, il giardino e le uscite. Mantenere libero e leggibile il contatto alle celle interattive (che hanno footprint solidi) e lasciare intatto il collider condizionale di Moltres.

## Prove esistenti e limiti grafici

`tests/e2e/concordia.spec.ts` copre il passaggio reale D05→R15→Concordia, le due letture R15 con approcci (29,19) e (17,4), le scelte di Elia, gli acquisti in città e il percorso di ritorno Concordia→R15→D05. Un altro caso R15 permette di declinare Nilo e poi affrontare la battaglia con ricompensa unica persistente. Le letture richiedono `q_d05_report`; il caso Nilo parte da un checkpoint con quel flag.

Queste prove verificano interazioni e transizioni, non il fondale illustrato: non asseriscono la key o il decode dell’immagine R15, non acquisiscono screenshot R15 con i piedi sulle due stazioni, habitat, Nilo o uscite in portrait e landscape, e non testano la visibilità/collisione di Moltres prima e dopo la Lega. Gli screenshot esistenti di Concordia o della palestra non coprono il fondale R15. Per la revisione grafica occorrono quindi controlli visivi separati degli approcci e del footprint speciale, senza inferire porte o sagome architettoniche dai rettangoli generici di collisione.

## Fonti

- `public/tilemaps/r15_passo_due_luci.tmj`: dimensioni, collisioni, personaggi, interazioni, encounter-zone e uscite.
- `content/maps/r15_passo_due_luci.map.json`: biome, spawn e connessioni.
- `content/dialogue/world.v1.json`, `content/quests/concordia_research.quest.json`, `content/quests/r15_nilo.quest.json` e `content/trainers/r15_nilo.trainer.json`: narrazione e requisiti.
- `tests/e2e/concordia.spec.ts`: prove d’integrazione e lacune di copertura visiva.
