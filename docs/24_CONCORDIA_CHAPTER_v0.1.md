# Passo delle Due Luci e Concordia — capitolo 0.3.93

## Stato e limiti

Versione **locale, non ancora pubblicata** al momento di questo documento. Il catalogo integrato contiene 40 mappe, 38 quest, 16 allenatori, 10 negozi, 254 asset registrati, 69 specie e 71 mosse supportate. Le otto medaglie sono presenti; questo non attesta il completamento della storia.

Cinque prove browser sono passate in circa 3,5 minuti. Verificano percorso, dialoghi, scelta, acquisti, convergenza, lotta, medaglia, salvataggio, trasporto e regressioni pertinenti. La prova di Aurel usa un Dewgong di livello 75 preparato come checkpoint: dimostra l’integrazione della battaglia e della ricompensa, **non il bilanciamento della progressione naturale**. La verifica offline del nuovo capitolo resta pendente. Pubblicazione e CI della nuova revisione non sono ancora attestate qui.

## Percorso e letture

Dopo il rapporto delle Grotte del Cristallo (`q_d05_report`), l’arco alto conduce al Passo delle Due Luci. Il ponte e la piazza collegano la grotta a Concordia; le diramazioni portano alla stazione naturale e alla stazione della rete. Le due letture sono indipendenti e persistono al reload. Il percorso principale evita il piccolo habitat facoltativo a nord-est. Il lago e l’isola staccata a sud-ovest non sono pavimento percorribile.

Nilo offre un incontro facoltativo sul passo, con Ampharos43, Graveler44 e Golbat45. La sconfitta assegna una volta 1600 monete e un feedback su paralisi, confusione e preparazione. Non è un blocco della ricerca o dell’accesso alla città.

Concordia offre Centro Pokémon, mercato, osservatorio di Elia e monorotaia. Il terminale ha un arrivo sicuro adiacente; la città diventa una destinazione dopo la visita secondo le regole della rete. Le strade future verso Santuario e Lega hanno indicazioni narrative, senza uscite verso mappe assenti. Fontana, edifici, terminali e personaggi mantengono impronte solide.

## Elia e la decisione esplicita

Elia confronta il ritmo del giardino e quello amplificato nei condotti. Prima delle due letture indica dove recuperare i dati. Dopo entrambe propone una scelta reale nel dialogo:

- **Rivediamo le misure**: approfondisce i dati senza registrare il piano.
- **Ripristiniamo l’equilibrio**: emette `concordia/plan/restore` e registra `q_concordia_restore_plan`.
- **Decido dopo**: chiude senza completare la scelta.

Leggere il dialogo o chiuderlo non seleziona automaticamente il piano. Solo la decisione esplicita apre l’accesso alla palestra. Il piano conserva entrambi i flussi: non attribuisce ancora l’avvenuto riallineamento del Santuario.

## P8: due sorgenti, un ricevitore

La palestra illustrata contiene due sorgenti fisse, quattro relè ruotabili e un ricevitore comune. Il flusso naturale parte da `sourcewest`, quello della rete da `sourceeast`. Ogni coppia di relè deve orientarsi prima verso la terrazza e poi verso il ricevitore. Una sola sorgente collegata non completa il puzzle.

Il sistema dichiarativo esistente in `src/core/world/signal-router.ts` supporta `additionalSourceNodeIds`: percorre separatamente ogni sorgente e dichiara `connected` solo quando tutte raggiungono l’obiettivo. Cicli e interruzioni restano distinguibili. Il catalogo `content/puzzles/gym08_convergence.v1.json` possiede geometria logica, etichette e stati; Tiled possiede collisioni e interazioni. Menu e decorazione condividono la lettura dei percorsi. I relè persistono durante il reload.

L’evento `gym08/convergence/connected`, con il piano registrato, assegna `gym08_convergence_complete`. Il flag rimuove il cancello a nord e permette di raggiungere Aurel. Tutti i controlli e l’uscita rimangono accessibili prima del completamento; il cancello non si aggira dai lati.

## Aurel e ottava medaglia

Aurel schiera Dragonair46, Seadra47, Kingdra48 e Dragonair49. Le mosse provengono dagli apprendimenti ufficiali supportati del catalogo, senza assegnazioni inventate. La vittoria assegna 2600 monete, `badge_armonia` e `badge_drago_awarded`. Banner, emblema e feedback spiegano che Dragonair e Kingdra non hanno le stesse debolezze: Acqua/Drago non equivale a Drago puro. Premi e medaglia restano unici dopo il reload.

## Catalogo e medicine

Aggiunti Dratini, Dragonair, Dragonite, Horsea, Seadra e Kingdra, con artwork e fonti PokéAPI locali. Il catalogo complessivo raggiunge 69 specie e 71 mosse supportate. Le fonti, gli apprendimenti e i riferimenti evolutivi restano separati dalle meccaniche effettivamente disponibili: non viene inventato un livello per evoluzioni tramite scambio.

Il mercato include Superpozione, Iperpozione e Antiparalisi oltre agli strumenti già disponibili. `tools/import_pokeapi_items.py` genera nomi ed effetti dai dati PokéAPI conservati: descrizioni HGSS e quantità di cura esplicite, con errore se la fonte richiesta manca. Antiparalisi rimuove la paralisi. L’effetto non viene dedotto dal solo nome dello strumento.

**Prezzi:** il campo `cost` del CSV PokéAPI corrente viene conservato come prezzo dell’economia del prototipo. La fonte non è versionata come listino HGSS; questi prezzi non sono presentati come prezzi storici HGSS. Il manifest registra provenienza e checksum separatamente dagli effetti.

## Evidenze e lavoro restante

- Percorso D05–R15–Concordia e ritorno; letture in ordine inverso con reload; accesso palestra bloccato senza piano.
- Riesame e rinvio della scelta senza completamento; decisione di ripristino esplicita e persistente.
- Acquisti con icone, inventario e monete; arrivo/ritorno in monorotaia e risorse invariate.
- Convergenza parziale non sufficiente, salvataggio dei relè, ricevitore comune, rotazione portrait/landscape.
- Lotta touch reale contro Aurel, banner Armonia, ricompensa unica e uscita dalla palestra.

Primo accesso offline verificato: tre ambienti, sei artwork e tre Tiled, relè con reload e ritorno a piedi alla stazione, viaggio Concordia–Vetracielo–Concordia con risorse invariate (25,2s; 37,5s con build). Nilo verificato con rifiuto, lotta touch e premio unico dopo reload (33,9s). 425 test dominio,16 persistenza e88 Python riusciti; build e validatore riusciti. Da verificare separatamente: CI completa e pubblicazione. Da implementare ancora: Santuario e riallineamento effettivo, percorso della Lega, finale e contenuti successivi. Il bilanciamento naturale dell’intera avventura e il catalogo completo non sono provati da questi test.
