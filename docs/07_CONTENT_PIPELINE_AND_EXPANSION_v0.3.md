# Veloria — Pipeline contenuti ed espansioni (v0.3)

## 1. Obiettivo

Realizzare un gioco in cui aggiungere un percorso, una città, una missione, una specie Pokémon o una generazione non richieda riscrivere scenari e salvataggi. **Contenuti come dati**, regole di gameplay centralizzate, rendering e asset separati.

## 2. Import da PokéAPI

Documentazione: https://pokeapi.co/docs/v2 . L'API fornisce informazioni strutturate utili, fra cui specie, mosse, tipi, evoluzioni, incontri dei titoli ufficiali e liste di apprendimenti; **non fornisce automaticamente mappe giocabili di Veloria, dialoghi, asset moderni completi, animazioni di combattimento o il ruleset corretto**.

Pipeline proposta:

```text
PokéAPI (accesso solo durante import/build, throttling e cache)
    ↓ download raw responses + provenienza e checksum
raw-cache/ (non richiamato a runtime)
    ↓ normalizer per roster gen1/gen2 e scelte ruleset Veloria
normalized JSON: species / moves / type chart / evolution rules
    ↓ lint, referential integrity, schema validation, review umana
published-content/<contentVersion>/
    ↓ bundle / precache degli asset effettivamente usati nell'MVP
PWA offline
```

### Endpoint utili

- `pokemon/{id}`: tipi/stats/mosse e sprite link.
- `pokemon-species/{id}`: dati specie, chain reference, testi localizzati.
- `evolution-chain/{id}`: gerarchia e condizioni di evoluzione; gestire requisiti di scambio con override single-player.
- `move/{id}`: potenza, PP, accuratezza ed effetti; filtrare campi/per generazione.
- `type/{name}` e `generation/{id}`: matchup/type data e perimetro del roster.
- `pokemon/{id}/encounters`: dati per aree dei giochi originali, **non mappatura diretta su Veloria**.

### Policy tecnica

- Mosse e learnset runtime sono generati da PokéAPI, gruppo `heartgold-soulsilver`, tramite `python tools/import_pokeapi_battle.py --fetch`; `--check` verifica offline la riproducibilità. Risposte, URL e checksum sono in `content/sources/pokeapi/`.
- Non modificare a mano potenza, precisione, PP, effetti, livelli o compatibilità specie/mossa. Le mosse ancora non implementate sono registrate nel report sorgente e non ricevono effetti sostitutivi.

- Limitare richieste e parallelismo durante l'import; cache locale persistente dei risultati.
- Import incrementale; determinismo dei JSON prodotti e checksum degli input.
- Usare la **ID nazionale** come chiave specie; canonical name normalizzato e UI localization separati.
- Non associare automaticamente tutti i dati moderni al gameplay Gen2-like. Le regole/modifiche sono documentate in `06_BATTLE...`.
- Asset image URLs nell'API **non equivalgono a permesso di riutilizzo**. Registro licenze prima di includere immagini nella build.

## 3. Data packs versionati

```text
content/
  manifest.json                         # contentVersion, checksum, pack registry
  regions/veloria.region.json          # città e collegamenti
  maps/*.map.json                      # metadata mappe; puntano a Tiled JSON
  tilemaps/*.tmj                        # Tiled JSON creato dagli artisti
  encounters/*.encounters.json
  pokemon/species.*.json
  pokemon/moves.*.json
  pokemon/typechart.json
  quests/*.quest.json
  trainers/*.trainer.json
  gyms/*.gym.json
  translations/it.json
```

Pacchetto = asset+metadata verificati e referenziati tramite ID; il motore carica solo gli asset necessari per la mappa o il combattimento. `MapDefinition` è metadata di Veloria, **non sostituisce** il file `.tmj` di Tiled e non contiene le collisioni tile-by-tile.

Ogni `MapDefinition` dichiara in `renderAssets` le texture usate dalla mappa. Un tileset include il suo `key` (chiave texture Phaser), `path` pubblico, `kind: "tileset"`, `tiledName` (nome esatto nel `.tmj`) e dimensioni tile. Gli sprite includono `kind: "image"`, `key` e `path`. Il preload deduplica le chiavi comuni fra mappe; aggiungere un nuovo bioma/tileset non deve richiedere un branch in `WorldScene` o un nome texture nel renderer. I riferimenti agli asset restano verificati nel registro licenze e nella validazione dei `.tmj`.

MapDefinition v2 può dichiarare `battleBackgroundKey`, riferito a un'immagine `kind: "image"` nel suo `renderAssets`. `BattleScene` ritaglia il fondale per riempire il viewport e mantiene leggibili i pannelli; se il campo manca usa l'arena sintetica di fallback. Il fondale viene caricato con gli asset della mappa attiva e deve essere incluso nel precache offline.

MapDefinition v2 può dichiarare `ambientEffects` con profili cosmetici delimitati da un'area della mappa. I profili usano posizioni deterministiche per map ID e non cambiano collisioni o stato di gioco; il renderer deve rispettare la preferenza reduced rendendo gli effetti statici e meno intensi. Il validatore controlla tipo, palette e limiti geometrici nel `.tmj`.

Questo contratto è MapDefinition v2 (`specs/schemas/map.v2.schema.json`). I metadata runtime v1 restano caricabili con la mappatura legacy originale; `content/examples` continua a validarsi con il contratto v1 e non viene promosso automaticamente.

## 4. Aggiunta nuova mappa: procedura

1. Assegnare ID permanente, es. `veloria/r03_terrazze_muschio`, e creare uno scheletro con `python tools/scaffold_map.py --id veloria/r03_terrazze_muschio --name "Terrazze di Muschio" --biome forest --tileset-key veloria-forest-ground --tileset-path assets/tilesets/veloria-forest-ground-v1.png --tiled-name veloria_terrain --music-id ambient_forest`. Il comando crea metadata v2 in `content/map-drafts/` e uno scheletro `.tmj` in `public/tilemaps/_draft_<slug>.tmj`, non caricati dal runtime.
2. Aprire lo scheletro in Tiled e realizzare terreno, collisioni e oggetti. Le mappe del progetto usano tile da 32 × 32 px e i layer condivisi descritti in `content/maps/README.md`. Prima di rendere la mappa giocabile, aggiungere contenuti e riferimenti, spostare il metadata in `content/maps/` e rinominare il Tiled JSON secondo `tiledAsset`.
3. Aggiornare connettori e spawn in entrambe le aree coinvolte; evitare connessioni unilaterali non spiegate.
4. Definire NPC, interazioni, quest flags, incontri e condizioni di accesso.
5. Registrare gli asset e verificare licenze e mem-budget.
6. Eseguire `python tools/validate_examples.py`, i test Python, `npm run build` e test spawn, collisioni, save/load e ritorni sulle mappe precedenti.
7. Aggiornare contentVersion e changelog, includere gli asset runtime nel precache e integrare il pack di zona; definire download/offline per la nuova area.

Per le immagini runtime, il flusso conserva il PNG sorgente e registra separatamente il WebP derivato. Aggiornare il `path` nei metadata e le sorgenti immagine del Tiled JSON, aggiungere il WebP al registro asset e al precache; per i manifest artwork aggiornare hash e path del file runtime senza cambiare l’URL della fonte. La conversione corrente usa WebP q88 e mantiene il canale alfa.

### Oggetti nelle tappe di missione

Una tappa può dichiarare `grantItems` e/o `consumeItems`, mappe da item ID a quantità intera positiva. Il validatore controlla schema, ID nel catalogo e quantità. Il servizio missioni verifica tutti gli oggetti da consegnare prima di modificare inventario o flag; consuma gli oggetti, applica gli eventuali oggetti ricevuti dalla tappa e assegna la ricompensa finale nello stesso risultato immutabile. La ripetizione di una tappa già completata non ripete nessuna operazione.

Il `itemId` del pickup Tiled identifica l’oggetto nella presentazione; non assegna da solo l’oggetto. Per un pickup intermedio usare `grantItems` sulla tappa di raccolta. Esempio: `radicelmo_seed_archive.quest.json` consegna un `ancient-seed` alla raccolta e lo ritira alla catalogazione da Leda; la ricompensa finale è distinta. Il test deve comprendere raccolta, caricamento, consegna e ripetizione senza duplicazioni.

## 5. Aggiunta Pokémon: procedura

1. Recuperare raw species/varieties, mosse ed evoluzioni.
2. Normalizzare solo fields dichiarati nel ruleset e assegnare sprite asset separato, con licenza verificata.
3. Aggiungere mosse mancanti se richieste e implementare effetti non previsti con nuovi test.
4. Registrare eventuale forma/evoluzione e requisiti speciali.
5. Bilanciare incontri, trainer e availability senza alterare le tabelle esistenti non intenzionalmente.
6. Testare import sul vecchio salvataggio, PC, Pokédex e migrazione compatibilità.

**Gen III+:** nuovi Pokémon possono richiedere sistemi non presenti (abilità, nature, breeding, meteo, nuovi tipi per generazioni ancora successive). Non basta importare un nuovo JSON.

## 6. Save durability e compatibilità

- Per Pokémon catturato: `instanceId` UUID, `speciesId`, progressione, status, moves, stats derivabili, metadata essenziali.
- Salvataggio: schemaVersion per struttura serializzata, contentVersion per disponibilità pacchetti.
- Migrations versionate eseguite prima di accedere ai dati. Dopo migrazione creazione copia di sicurezza del save originale.
- `mapId`, `flagId`, `trainerId`, `itemId` non possono essere riassegnati a nuovi contenuti.
- Se un pack viene rimosso, offrire safe-spawn fallback e gestione Pokémon con dati assenti, senza cancellarli.

## 7. Validazione e qualità dei dati

- JSON Schema per struttura, test di integrità referenziale oltre schema (connessioni valide, ID unici, ranges, flags leciti). `tools/validate_examples.py` applica gli schemi MapDefinition v1/v2 agli esempi e alle mappe runtime; lo scaffold valida il metadata v2 generato prima di scrivere la bozza.
- Lint di collision layer, spawns non bloccati, punti d'interazione raggiungibili, asset path validi.
- Nessuna modifica a un JSON sorgente per 'fix veloce' direttamente nella build senza PR/version bump.
- Uscita `contentVersion` con changelog contenuti e migrazioni necessarie.

## 8. Contenuti di esempio nel pack

`content/examples/` contiene metadata fittizi/stabili per tre mappe, una tabella d'incontri, una quest, un trainer, una regione e un save. Sono **esempi di contratto**, non una rappresentazione completa del gioco; `tools/validate_examples.py` verifica sintassi e coerenza base.


### Evoluzioni: riferimenti e regole giocabili

Il catalogo giocabile resta Gen I–II. Il riferimento informativo delle evoluzioni conserva i metodi ufficiali disponibili fino a HGSS/Gen IV, anche con target oltre 251; la UI li segnala come fuori catalogo e non disponibili. Il riferimento non abilita automaticamente regole runtime. Condizioni come mossa conosciuta, oggetto tenuto, amicizia, fascia oraria e luogo devono essere importate e descritte interamente; condizioni sconosciute fanno fallire l’import. Non trasformare uno scambio o un requisito speciale in un livello inventato.

## Curve XP ufficiali — contratto progressionv2

Dopo un import specie eseguire `tools/import_pokeapi_growth.py --fetch` (solo per fonti assenti) e poi `--check`. Le79 specie attuali sono verificate da pokemon-species e growth-rate locali; le tabelle di100 totali e le assegnazioni sono riproducibili dal growth-manifest con SHA-256. `progression.v2.json` conserva gli archi evolutivi già abilitati e cambia il formato delle curve; lo schema2 rifiuta formule, livelli mancanti o extra e categorie non registrate. Il controllo dell’importatore verifica anche ordine strettamente crescente, totale iniziale0 e coerenza della curva tra forme evolutive. Il runtime non chiama l’API.
