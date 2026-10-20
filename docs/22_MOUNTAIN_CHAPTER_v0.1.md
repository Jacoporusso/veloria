# Valle del Vento, Passobrina e Biancavetta — contratto del capitolo

**Stato: pianificazione; R12, Passobrina, R13, Biancavetta, P7 e funivia non sono contenuti runtime.** Il checkpoint locale documentato arriva ad Acquariva/P6. Questo documento definisce il lavoro successivo senza attestare mappe, quest, specie, puzzle o verifiche già realizzati. Fonte geografica e narrativa: `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md`, sezioni 2–8; convenzioni runtime: `content/maps/README.md` e capitoli 19–21.

## Perimetro e obiettivo

Il capitolo collega Acquariva alla dorsale nevosa: R12 Valle del Vento → Passobrina → R13 Tornanti Bianchi → Biancavetta/P7 Ghiaccio. Deve mantenere un percorso a piedi leggibile e reversibile, introdurre preparazione pratica alla quota e al clima, e far progredire l'indagine sulla Risonanza senza identificare la causa globale prima delle Grotte del Cristallo (D05/R14).

Il sistema di meteo globale non è un prerequisito. Vento, neve e visibilità possono essere presentati come condizioni locali narrative e visive; eventuali variazioni degli incontri devono risiedere in tabelle e fasce dichiarate, senza inventare una nuova regola di combattimento o alterare probabilità implicitamente.

## Percorso e ritorni

1. **Acquariva → R12:** l'uscita si apre dopo `badge_riflesso_awarded` (Medaglia Riflesso). Prima, il varco spiega il requisito senza spostare il personaggio. L'ingresso in R12 registra la visita e introduce il cambio graduale da rive e pianura a valle ventosa.
2. **R12 → Passobrina:** sentiero principale diretto, con habitat fuori dal passaggio obbligato e landmark visibili anche in condizioni atmosferiche avverse. Passobrina offre Centro/cure e deposito, bottega, indicazioni e accesso di ritorno sempre attivo verso R12.
3. **Preparazione locale:** una ricercatrice o una guida confronta le osservazioni del lago con misure di temperatura, raffiche e neve raccolte in più punti. Il giocatore compie le letture sul campo e riporta il risultato; equipaggiamento o kit, se previsto, è un oggetto effettivamente consegnato e visibile, non un bonus astratto. Il rapporto sblocca il tratto alto di R13. La preparazione deve essere comprensibile e non richiede un Pokémon o una mossa obbligatori.
4. **Passobrina → R13:** il gate controlla il flag del rapporto, con spiegazione contestuale. R13 sale per tornanti riconoscibili; neve e ghiaccio occupano aree laterali o puzzle delimitati, così il ritorno resta sempre raggiungibile anche dopo errori o reload.
5. **R13 → Biancavetta:** ingresso cittadino e ritorno reciproco con spawn davanti al sentiero, fuori da collisioni e trigger d'uscita. Biancavetta offre cure/deposito, bottega, personaggi e indicazioni per P7. La città diventa destinazione di fast travel soltanto dopo la prima visita, secondo il contratto della monorotaia esistente.
6. **P7 Ghiaccio:** ingresso accessibile dalla città senza scambi o specie specifiche. Puzzle di superfici ghiacciate, capopalestra e medaglia originali; premio unico persistente. La vittoria apre la funivia e il passaggio narrativo verso R14, senza aprire o completare D05.

Tutte le connessioni devono essere reciproche nei `MapDefinition` e nei trigger Tiled, con spawn dedicati. Ogni spawn e interazione è raggiungibile a piedi; le prove geometriche devono evitare habitat, acqua, ghiaccio scivoloso non controllato e oggetti solidi. La funivia è trasporto distinto dalla monorotaia e dal cammino: terminali e destinazioni sono dichiarati nei dati, usabili dopo `badge_ghiaccio_awarded`; mantenere R12/R13 percorribili dopo lo sblocco.

## Ricerca climatica e narrazione

La ricerca è un piccolo incarico sul campo, non una spiegazione definitiva. Possibile sequenza: misurare una stazione riparata in valle, osservare una raffica su un crinale e confrontare un accumulo nevoso presso Passobrina; consegnare il rapporto a una ricercatrice locale. I dati mostrano che le oscillazioni della Risonanza coincidono con variazioni ambientali, ma non dimostrano che la rete causi il clima né che ogni anomalia abbia la stessa origine.

Biancavetta amplia la domanda: segnali più regolari in prossimità della montagna e una misura anomala diretta verso il massiccio suggeriscono un nodo a monte. Un tecnico distingue infrastruttura ordinaria e apparati di misura; nessuna prova accusa una persona o un gruppo. R14 e D05 devono fornire l'indagine successiva su altezza e temperatura. La rivelazione del nodo sorgente appartiene al successivo Passo delle Due Luci/R15 e non va anticipata qui.

## P7: puzzle e palestra

La palestra deve insegnare previsione del movimento e lettura dello spazio. La bozza tecnica attuale è `content/drafts/mountain/gym07_ice.layout.json`: una griglia 12×12 con spawn (1,9), uscita (1,10) sul lato sud-ovest e tre rettangoli di ghiaccio distinti, ciascuno 3×4 celle, alle coordinate (2,3), (5,3) e (8,3). I tre landing/sigilli proposti sono (3,2), (6,2) e (9,2); gli ingressi sono (3,7), (6,7) e (9,7). Collisioni perimetrali e ostacoli sono definiti separatamente dalle superfici ghiacciate.

La sequenza direzionale registrata nel JSON raggiunge i landing nell'ordine ovest, centro, est: destra, destra, su, su, su; poi destra ×3, giù, su; infine destra ×3, giù, su. Il test `tests/world/gym07-ice-layout.test.ts` applica la regola di scivolamento fino alla fermata e verifica anche che ogni stato fermabile raggiungibile dal spawn possa tornare all'uscita. Questo controlla il modello geometrico dichiarato, non una mappa Tiled, la grafica, gli interattori o una sessione nel gioco.

Questa è solo una bozza tecnica: deve essere arricchita artisticamente e poi tradotta in una mappa Tiled con interazioni, trigger e collisioni allineati. Il JSON non implementa piste giocabili, sigilli, porta, progressione, personaggi o ricompense. L'ordine libero dei sigilli non è ancora verificato. Ogni errore di puzzle dovrà lasciare il giocatore in una posizione recuperabile e spiegare come riprovare.

**Proposta narrativa, non runtime:** Nives è il nome proposto per la capopalestra e responsabile del presidio meteo; un'assistente all'ingresso può spiegare il movimento e un addetto può offrire un promemoria. Medaglia Brina, flag `badge_ghiaccio_awarded`, vittoria e sblocco funivia sono requisiti di design, non contenuti implementati. Anche premio in monete, squadra/livelli, dialoghi e interazioni non sono ancora definiti o runtime. Finalizzare roster e mosse solo dopo verifica su fonti locali e playtest; non inventare statistiche o mosse.
## Specie candidate

Il documento 02 cita Swinub, Sneasel, Delibird e Seel per il bioma montano. Sono candidati Gen I–II da verificare e importare prima dell'uso; la citazione non significa che siano presenti nel runtime o assegnati agli incontri. Possibili ulteriori candidati coerenti da valutare: Jynx, Teddiursa, Phanpy, Skarmory e Piloswine, sempre subordinati alla disponibilità ufficiale nel sottoinsieme Gen I–II e alle fonti locali. Definire incontri e pesi solo dopo la verifica di specie, artwork e dati runtime. Non far dipendere la progressione da una cattura.

## Contratti runtime da rispettare

- Mappe nuove in `content/maps/<id>.map.json`, versione 2, tilemap Tiled e layer convenzionali. ID e spawn persistenti; uscite con `destinationMapId` e `destinationSpawnId`, gate con flag; riferimenti reciproci dichiarati.
- Quest e trigger dichiarativi sotto `content/quests/`; passaggi fuori ordine spiegano il prerequisito e non mutano stato. Premi atomici, persistenti e non duplicabili; diario e atlante seguono gli eventi reali.
- Incontri in tabelle proprie della mappa, con metodi e fasce espliciti. Nessun fetch PokéAPI a runtime; import e manifest fonti/checksum, artwork nel registro asset e immagini incluse nel precache offline.
- Puzzle e allenatore usano i sistemi dati già esistenti quando compatibili; non introdurre logica specifica nella scena. Il checkpoint locale 0.3.90 offre la primitiva riusabile `movement_surfaces` per il ghiaccio e test del salvataggio sulle fermate valide; il contratto di authoring è in `content/maps/README.md`. Questo non costituisce l'integrazione della palestra o del capitolo.
- Funivia modellata tramite il registro di trasporto esistente, se compatibile: fermate e rotte esplicite, requisito ricontrollato all'uso, destinazione raggiunta con spawn valido. Se il registro non supporta trasporto funiviario o gate medaglia, documentare l'estensione prima dell'integrazione.

## Gate di consegna

1. Collegamento completo Acquariva–Passobrina–Biancavetta e ritorni, gate P6/ricerca espliciti e spawn sicuri.
2. Ricerca climatica completa e persistente; dialoghi coerenti con R08–Acquariva e non conclusivi sulla sorgente.
3. Specie, mosse, livelli, artwork e tabelle controllati sulle fonti locali; palestra vincibile senza catture o scambi obbligatori.
4. P7 con regole del ghiaccio comunicate, reset/retry sicuro, ordine errato senza mutazioni e medaglia/premio unici.
5. Funivia sbloccata solo dopo P7, visite/rotte persistenti e accessi a piedi ancora aperti.
6. Validazione contenuti, prove su save/reload, attraversamenti in entrambi i sensi, puzzle, funivia, portrait/landscape e primo accesso offline; ispezione visuale delle mappe con personaggio.
7. Distinguere checkpoint preparati, integrazione runtime, pubblicazione e bilanciamento naturale: una prova con squadra potenziata non dimostra il bilanciamento della progressione.

## Decisioni aperte

- Quale personaggio conduce la ricerca climatica e se il rapporto richiede due o tre osservazioni.
- Quale oggetto concreto, se necessario, rappresenta la preparazione alla montagna; evitare un requisito puramente cosmetico.
- Promuovere la geometria draft 12×12 a Tiled e verificare tutti gli ordini dei sigilli e i ritorni con la meccanica riusabile; la soluzione attuale prova un solo ordine.
- Nives e Medaglia Brina restano proposte narrative; definire capopalestra, roster/livelli/mosse, premio e trigger dopo audit del catalogo e playtest.
- Fermate e destinazioni della funivia: collegamento diretto Passobrina–Biancavetta o accesso a una fermata alta/R14; la topologia deve preservare il cammino e non saltare contenuti necessari.
- Posizione e forma del segnale verso la sorgente: mantenere la rivelazione conclusiva a R15/D05 come da macro-arco, senza risolvere qui il mistero.

R14/D05, R15, Concordia/P8, Santuario, Lega, finale e post-game rimangono capitoli successivi. Questo contratto non ne dichiara l'implementazione.




