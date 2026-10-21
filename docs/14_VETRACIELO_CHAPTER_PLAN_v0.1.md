# Piano del capitolo di Vetracielo

**Versione:** 0.1 — piano di contenuto implementabile  
**Stato aggiornato:** 21 ottobre 2026. La prima piazza, la Palestra 3, R06 e Ferraluce sono implementati. Il runtime contiene 79 specie, 78 mosse, ruleset 12, 48 mappe, otto Palestre e la Lega. La metropoli completa e i playtest naturali con tutti gli starter restano aperti; resta da verificare anche il gioco su dispositivi fisici.
**Ambito:** espansione dopo la Palestra di Petalora (P2), con arrivo a Vetracielo e Palestra 3

## 1. Scopo e stato delle decisioni

Questo documento traduce i requisiti del world design in un perimetro verificabile per il prossimo capitolo. Le indicazioni marcate **Requisito documentato** provengono dai documenti di progetto esistenti. Le indicazioni marcate **Scelta proposta** restringono il lavoro per renderlo consegnabile; vanno considerate decisioni di produzione proposte, non contenuti già approvati o presenti nel gioco.

Le sezioni 2–9 conservano requisiti, proposte e criteri scritti prima che il capitolo fosse implementato. I riferimenti che lì dicono che R06, Ferraluce o altri capitoli non esistono descrivono il perimetro originale del piano e non lo stato attuale. Per lo stato della Palestra 3 usare anche `15_VETRACIELO_GYM_v0.1.md`; i gate di bilanciamento naturale e di QA fisico restano aperti.

Questo piano conserva i requisiti e le decisioni della prima consegna di Vetracielo. R05, la prima Piazza della Monorotaia, la terrazza della Palestra 3, R06 e Ferraluce sono ora presenti nel runtime. La città completa, i quartieri e i tetti esplorabili, il bilanciamento naturale e la verifica con tutti gli starter restano attività aperte. Le liste di accettazione sotto sono gate di revisione e non vanno considerate chiuse dai soli controlli tecnici.

## 2. Requisiti documentati

Da `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md`:

- **R05 — Viadotto dei Ciliegi** collega Petalora a Vetracielo. La sua funzione è mostrare il contrasto fra campagna e metropoli, con binari panoramici.
- **Vetracielo** è una metropoli di grattacieli, monorotaia, parchi verticali e tetti accessibili. Ospita lo snodo dei trasporti e la Palestra 3 Elettro.
- La lezione della Palestra 3 è l'immunità di Terra e la gestione della Velocità. La prova proposta attiva in sequenza le linee della monorotaia.
- La topologia regionale prosegue da Petalora verso Vetracielo e da Vetracielo lungo R06 — Anello Magnetico verso Ferraluce.
- Le aree devono essere aggiungibili con mappe e contenuti dichiarativi. La progressione deve usare flag ed eventi invece di controlli hardcoded sulla città.

Da `docs/08_ROADMAP_BACKLOG_v0.3.md`, v0.5 è un obiettivo orientativo che comprende le prime quattro Palestre, circa 100 specie reperibili e il viaggio a Vetracielo/Ferraluce. È un'aspirazione di contenuto, non una scadenza né un requisito di questo singolo capitolo.

## 3. Topologia verificata e punti di innesto

La lettura diretta di `content/maps/petalora.map.json` conferma due spawn e connessioni già attive:

| Spawn Petalora | Coordinate | Destinazione corrente | Interpretazione |
| --- | --- | --- | --- |
| `from_r04` | (18, 26) | `veloria/r04_salita_petali`, spawn `from_petalora` | Ritorno verso sud alla Salita dei Petali |
| `from_gym02` | (18, 1) | `veloria/gym02_petalora`, spawn `from_city` | Ingresso verso nord alla Palestra 2; il trigger Tiled richiede `badge_aurora_awarded` |

In `public/tilemaps/petalora.tmj`, il trigger di ritorno a R04 è sul bordo inferiore (x=544, y=864, larghezza 96 px); il trigger della Palestra 2 è sul bordo superiore (x=544, y=0, larghezza 96 px) e richiede `badge_aurora_awarded`. La mappa misura 38×28 caselle da 32 px. Il piano non cambia né riusa questi passaggi.

**Scelta proposta:** aggiungere R05 come nuova uscita da un bordo libero della mappa di Petalora, in una posizione definita durante l'authoring Tiled. La direzione cardinale, la geometria del varco e l'eventuale flag di accesso non sono specificati dal world design e vanno scelti insieme alla mappa. La connessione deve avere uno spawn di arrivo corrispondente in R05 e una connessione reciproca verso Petalora. Da R05 si raggiunge un nuovo distretto esterno di Vetracielo con coppia di spawn reciproci. La Palestra 3 è una mappa separata collegata al distretto.

**Scelta proposta:** richiedere `badge_corolla_awarded` per l'uscita Petalora→R05, così il capitolo inizia dopo la Palestra 2. Il ritorno Vetracielo→Petalora rimane disponibile senza requisito. Completata la Palestra 3, il distretto indica o prepara il collegamento successivo a R06; R06 non fa parte di questo capitolo e non deve apparire giocabile finché i suoi contenuti non esistono.

## 4. Perimetro implementabile proposto

Il primo capitolo di Vetracielo comprende:

1. **R05 — Viadotto dei Ciliegi:** attraversamento breve ma completo, paesaggio panoramico ferroviario, almeno un'area d'incontro e passaggio leggibile dalla vegetazione collinare all'ambiente urbano.
2. **Primo distretto di Vetracielo:** area esterna compatta con skyline, monorotaia visibile, un parco verticale a livello strada, un Centro Pokémon o servizio equivalente e almeno un punto di orientamento verso la Palestra. Non richiede edifici multipiano esplorabili.
3. **Palestra 3:** mappa e sequenza di interruttori/linee dichiarative che richiedono l'ordine previsto; allenatori facoltativi o necessari secondo il layout finale; sfida del capopalestra e premio persistente con un emblema distinto.
4. **Incontri e contenuti di battaglia strettamente necessari:** roster reperibile per R05/distretto e squadra della Palestra 3 definiti solo dopo aver registrato i dati ufficiali, controllato learnset e mosse supportate e svolto il bilanciamento. Questo piano non fissa specie, livelli, statistiche, tassi o pesi d'incontro.
5. **Connessione futura dichiarativa:** metadata e segnaletica possono identificare R06 come prosecuzione, ma non devono creare una transizione funzionante verso una mappa inesistente.

Fuori dal perimetro proposto: rete di monorotaia completa o fast travel funzionante, tetti e quartieri multipiano esplorabili, Vetracielo completa, R06 e Ferraluce, Palestra 4 e implementazione di circa 100 specie. Il world design elenca questi elementi come identità o tappe regionali; non li rende prerequisiti per la prima fetta giocabile del capitolo.

## 5. Contenuti ufficiali da acquisire e importare

Il runtime usa dati locali importati da PokéAPI e dichiara esplicitamente il gruppo di versione HeartGold/SoulSilver. I dati originali sono mantenuti sotto `content/sources/pokeapi/`; `content/battle/species.v1.json` e `content/battle/moves.v1.json` contengono il sottoinsieme attualmente implementato. La sola presenza di una risposta sorgente non rende una specie o una mossa disponibile nel gioco.

Prima di scrivere encounter table o squadra della Palestra:

- scegliere le specie necessarie in base agli habitat documentati e alla progressione reale; controllare specie, forme, tipi, statistiche base ed evoluzioni sulla fonte locale PokéAPI;
- importare i dati e i learnset HGSS tramite `tools/import_pokeapi_battle.py`, mantenendo manifest e hash della fonte secondo `content/sources/pokeapi/README.md`;
- importare soltanto le mosse richieste dal learnset/team selezionato e supportate dal motore; ogni nuova mossa deve avere una definizione runtime e una verifica degli effetti implementati;
- aggiungere le specie al catalogo runtime senza sovrascrivere le statistiche ufficiali e senza inventare valori. Il bilanciamento si ottiene con roster, livello e distribuzione d'incontri scelti e poi playtestati;
- aggiungere artwork locale con attribuzione e licenza registrate. Un'immagine sorgente non sostituisce l'entry runtime né la dichiarazione in `assets/ASSET_REGISTER.csv` e nel precache offline.

Il world design propone per gli ambienti urbani Magnemite (#81), Voltorb (#100) e Porygon (#137, indicato come evento). Sono **candidati documentati**, non roster già approvato. Magnemite e Voltorb possono essere valutati per gli habitat di Vetracielo; Porygon va escluso dagli incontri ordinari finché non viene progettato un evento. La palestra non deve presupporre un singolo counter catturabile: verificare accessibilità e risposte per i quattro starter, come richiesto dal world design.

I learnset e le statistiche ufficiali vanno consultati nei dati PokéAPI della versione HGSS. Non si assumono mosse specifiche per il puzzle o per la squadra finché la selezione non è stata convalidata con la fonte. Per i dettagli sul sottoinsieme già importato e sulle meccaniche non ancora supportate vedere `docs/06_BATTLE_AND_PROGRESSION_RULES_v0.3.md` e `content/sources/pokeapi/README.md`.

## 6. Sistemi riusabili e file di riferimento

- **Mappe e collegamenti:** `content/maps/README.md`, `src/game/maps/map-registry.ts`, `src/game/maps/map-types.ts`. MapDefinition v2 si carica tramite glob; i nuovi contenuti non richiedono un ramo di scena dedicato. Gli ID mappa e spawn sono persistenti.
- **Authoring Tiled e validazione:** `public/tilemaps/*.tmj`, `tools/scaffold_map.py`, `tools/validate_examples.py`. Usare layer standard, connessioni reciproche, spawn accessibili e trigger raggiungibili.
- **Progressione dichiarativa:** oggetti Tiled con `questEvent`, `requiredFlag`, `battleRequiredFlag`, `activatedFlag` e `visibleWhenFlag`; motore eventi in `src/game/scenes/WorldScene.ts` e catalogo quest in `src/game/quests/`.
- **Puzzle palestra e medaglia:** `content/maps/gym02_petalora.map.json`, `public/tilemaps/gym02_petalora.tmj`, `content/quests/gym02_irrigation.quest.json`, `content/quests/gym02_badge.quest.json`, `content/trainers/gym02_dalia.trainer.json`. Sono riferimenti per sequenza ordinata, blocco leggibile, progressione persistente e premio idempotente.
- **Incontri:** `content/encounters/README.md` e `content/encounters/r04_petal_ascent.encounter.json`. Le tabelle richiedono pool mattina/giorno/notte, specie già nel catalogo runtime e stato `prototype` fino a playtest e approvazione dei tassi, livelli e pesi.
- **Asset e offline:** `assets/ASSET_REGISTER.csv`, `public/sw.js`, manifest contenuti e changelog. Ogni media runtime deve essere registrato e incluso nell'offline precache pertinente.

## 7. Criteri di accettazione

Il capitolo è pronto quando tutte le condizioni seguenti sono soddisfatte:

- [ ] Con la Medaglia Corolla assegnata, il giocatore raggiunge R05 da Petalora; senza il flag richiesto, il messaggio spiega il blocco. Il ritorno da R05 usa una nuova coppia di spawn dedicata e non modifica il collegamento esistente Petalora↔R04 (`from_r04` / `from_petalora`).
- [ ] Tutti gli ingressi e le uscite hanno connessioni reciproche, spawn validi, collisioni coerenti e percorsi raggiungibili dall'interno della mappa.
- [ ] Il primo distretto di Vetracielo è esplorabile e riconoscibile come metropoli coerente con i riferimenti documentati; Centro/servizi, NPC e accesso alla palestra funzionano da tastiera e touch.
- [ ] Le interazioni del puzzle monorotaia rispettano l'ordine, spiegano i prerequisiti mancanti, aggiornano visuali via flag, persistono dopo salvataggio/ripresa e non concedono progressi o ricompense duplicati.
- [ ] La palestra non è sfidabile prima dei prerequisiti di arrivo e puzzle definiti; la vittoria assegna una sola volta denaro, flag, medaglia ed emblema catalogati. Sconfitta, reload e dialogo successivo non aggirano gate o duplicano premi.
- [ ] La squadra e gli incontri usano soltanto specie runtime registrate, dati ufficiali importati e mosse supportate; il bilanciamento è riportato con playtest naturali e con i quattro starter, senza inferire esiti dai soli dati.
- [ ] La build offline include le mappe, i dati e gli asset del capitolo dichiarati disponibili; il caricamento non dipende da chiamate remote.
- [ ] `python tools/validate_examples.py` e `npm run build` passano; il flusso è provato nel browser in avanti e al ritorno, con save/load e senza rete. La validazione su smartphone reale resta un gate umano da documentare.

## 8. Sequenza di lavoro proposta

1. Definire punto d'uscita R05 in Petalora e perimetro/forma delle nuove mappe con una bozza Tiled; assegnare ID stabili prima di promuovere la bozza.
2. Importare e verificare le sole specie/mosse selezionate dalla fonte HGSS; scegliere encounter e squadre senza introdurre statistiche custom.
3. Implementare R05 e distretto Vetracielo, aggiungendo metadata v2, connessioni reciproche, asset, NPC, servizi e tabelle d'incontro.
4. Implementare mappa palestra, sequenza delle linee, trainer, capopalestra, quest badge e catalogo medaglie con flag dichiarativi.
5. Aggiornare manifest, changelog e precache; eseguire i criteri automatici e il playtest naturale; marcare come giocabile solo dopo il superamento dei gate.

## 9. Fonti interne

- `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md` — geografia, città, Palestra 3, R05/R06, specie illustrative.
- `docs/06_BATTLE_AND_PROGRESSION_RULES_v0.3.md` — principi di progressione, bilanciamento e stato delle meccaniche.
- `docs/07_CONTENT_PIPELINE_AND_EXPANSION_v0.3.md` — pipeline e pacchetti di contenuto.
- `docs/08_ROADMAP_BACKLOG_v0.3.md` — obiettivo orientativo v0.5 e stato attuale dopo Petalora.
- `docs/13_PETALORA_GYM_v0.1.md` — confine verificato del capitolo precedente.
- `content/maps/petalora.map.json` e `public/tilemaps/petalora.tmj` — spawn, connessioni e trigger correnti verificati direttamente.
- `content/sources/pokeapi/README.md`, `content/sources/pokeapi/manifest.json`, `tools/import_pokeapi_battle.py` — provenienza e import dei dati ufficiali locali.

## 10. Prima consegna implementata — snapshot storico 0.3.68

Questa sezione descrive lo stato al rilascio 0.3.68 e non il catalogo o la mappa correnti.

- **Petalora:** nuovo varco est (37, 11–13), spawn `from_r05` (36,12), gate `badge_corolla_awarded`. Gli accessi a R04 e Palestra 2 sono conservati.
- **R05:** `veloria/r05_viadotto_ciliegi`, 46×26 caselle. Spawn `from_petalora` (1,18) e `from_vetracielo` (44,6), sentiero con ponte e quattro habitat laterali. Binari orizzontali decorativi, collisi e riservati. Oren opzionale: Pikachu 13 / Wooper 14, 240 monete una sola volta. Mosse conformi ai learnset HGSS locali. Livelli, pesi e tassi sono scelte del prototipo, non dati canonici.
- **Vetracielo:** `veloria/vetracielo`, 40×30, prima piazza con Stazione Giardino illustrata originale, Lea, punto cure/deposito, bottega e habitat del parco. Spawn `from_r05` (1,25). La stazione è un elemento ambientale: niente fast travel o interno esplorabile in questa consegna.
- **Progressione:** l'arrivo registra `q_vetracielo_visited` dopo Corolla; Lea registra `q_vetracielo_orientation` e consegna due Pozioni una volta. Diario e indicazioni seguono queste tappe prima del ritorno alle missioni facoltative di Radicelmo.
- **Catalogo:** nessuna nuova specie o mossa: 23 specie e 38 mosse, dati offline esistenti. Magnemite, Voltorb e il roster della Palestra 3 restano da importare e implementare. Il quartiere non rappresenta ancora la metropoli completa prevista dal world design.
- **Asset:** PNG sorgente e WebP q88 `veloria-monorail-station-v1`, registrati con prompt e provenienza in `assets/prompts/vetracielo-monorail-station-v1.md`. Generazione tramite ImageGen integrato. Cache PWA v87 include asset e mappe. Gli esiti verificati sono registrati in `CI_STATUS.md`.

## 11. Palestra e specie urbane — snapshot storico 0.3.70

Questa sezione conserva i dettagli della prima implementazione della Palestra 3. Lo stato attuale e i limiti aggiornati sono documentati in `15_VETRACIELO_GYM_v0.1.md`.

La scalinata della stazione ora collega la piazza alla Terrazza delle Linee dopo il dialogo di Lea. Le console Giardini → Vetro → Cielo abilitano la sfida di Aster (Voltorb 16 / Magnemite 17) e il premio unico Medaglia Circuito + 850 monete. Dettagli di mappe, collisioni, flag e limiti in `15_VETRACIELO_GYM_v0.1.md`.

Magnemite e Voltorb sono catturabili nel parco, hanno artwork locali e riferimento evoluzioni nel Pokédex. Il catalogo attivo passa a 25 specie e 44 mosse, con Sonicboom a danno fisso e Tuononda selettivamente bloccata dall’immunità di tipo. Charge/Rollout restano non implementate e non vengono simulate con mosse generiche. Il controllo di ogni requisito del capitolo rimane distinto dalle prove tecniche con squadre preparate; non sono ancora completati i playtest naturali con tutti gli starter, il QA su smartphone e gli altri quartieri.
