# Nilo in quattro direzioni

Il profilo condiviso `rival-nilo` usa quattro PNG indipendenti1024×1536, prodotti tramite built-in ImageGen dall'identità del frame2 dell'atlante NPC v3. Felpa petrolio, capelli castani, pantaloni crema e sneakers conservati. La borsa resta al fianco anatomico sinistro con tracolla dalla spalla destra: primo retro rifiutato per lato invertito; primo est rifiutato perché esponeva la borsa sul lato vicino. Il nuovo est la lascia occlusa sul fianco lontano.

Sorgenti `assets/sources/veloria-nilo-idle-{south,west,east,north}-v1.png`, runtime WebP omonimi in `public/assets/sprites/`. Raw senza crop, resize o pulizia; WebP lossless con pixel RGBA decodificati identici. Alpha originale preservato anche nei pixel completamente trasparenti; nessuna normalizzazione del massimo254. Prompt integrali, output selezionati e tentativi rifiutati in `assets/prompts/nilo-idle-views-v1.json`; hash e calibrazioni in `assets/npc-idle-views-v1.json`.

| Vista | Origine x/y | Altezza immagine completa worldpx |
|---|---|---:|
| Sud | .51575 / .96549 | 59.49 |
| Ovest | .51165 / .97786 | 58.12 |
| Est | .48997 / .97591 | 57.92 |
| Nord | .50029 / .97656 | 57.92 |

Altezza ottica56worldpx dal bbox alpha≥128 e origine dai piedi. Superfici runtime340×510 con rapporto2:3 esatto, preparate dal renderer esistente. Posizioni, collider, dialoghi e sfida R15 invariati; nessuna camminata o pattuglia nuova. Le due presenze caricano tutte le pose e mantengono lo stesso profilo.

Verifiche native: Borgofonte nei quattro approcci, R15 nei due accessibili, entrambi con due preferenze animazione e due orientamenti. I primi tentativi del test R15 cercavano celle solide a nord/est: aspettativa corretta rispetto al Tiled, senza modificare il gioco. Il test controlla esplicitamente quei blocchi. Verificati chiavi, origine/piedi, scala uniforme, profondità, nessun flip/tween e stato persistito invariato.

Prova aggiuntiva a densità3: perdita/ripristino effettivi del contesto WebGL, superficie canvas ancora disponibile e ricaricata sulla GPU, screenshot dopo il primo render ripristinato. Review visiva conferma Nilo e ambiente dopo il ripristino. Regressione respiro statico passata su Sera.

L'audit del ciclo di vita conferma un comportamento già presente in `WorldScene`: carico destinazione, distruzione layer precedente, rilascio texture non condivise e delle derivate seamless; preservazione delle chiavi condivise. Il nuovo test cammina laboratorio→Borgofonte→laboratorio e verifica rilascio effettivo, mantenimento dell'atlante condiviso e ricostruzione della superficie compatta di Elia, con dialogo funzionante al ritorno. Questa prova non misura tutta la memoria del browser né certifica ogni transizione o errore di caricamento.

Cinque casi nativi distinti passati; quattro prove produzione offline passate su primo caricamento/approcci Ada, Elia, Nilo e regressione del diario fossili. Il caso Nilo parte dal laboratorio prima di entrare in una scena: partire da Borgofonte avrebbe già caricato il suo artwork. Nessuna pre-visita online a Nilo; immagini decodificate per la prima volta offline e dialoghi dai quattro lati/reload verificati.

818 dominio/persistenza passati; validatore683 asset/37 fondali/48 mappe passato. Cache prevista v183, contenuti0.4.20. Restano45 profili direzionali, camminate, revisione completa mappe e campagna naturale. Pubblicazione e CI complessiva attestate separatamente in CI_STATUS.md.
