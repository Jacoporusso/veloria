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

## 4. Aggiunta nuova mappa: procedura

1. Assegnare ID permanente, es. `veloria/r03_terrazze_muschio`; indicare `biomeId` e `version`.
2. Disegnare in Tiled con layer naming condiviso; esportare in `.tmj` JSON.
3. Aggiornare connettori e spawn in entrambe le aree coinvolte; evitare connessioni unilaterali non spiegate.
4. Definire NPC, interazioni, quest flags, incontri e condizioni di accesso.
5. Registrare gli asset e verificare licenze e mem-budget.
6. Validare schema/references; eseguire test spawn, collisioni, save/load e ritorni sulle mappe precedenti.
7. Integrare il pack di zona nel manifest; definire download/offline per la nuova area.

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

- JSON Schema per struttura, test di integrità referenziale oltre schema (connessioni valide, ID unici, ranges, flags leciti).
- Lint di collision layer, spawns non bloccati, punti d'interazione raggiungibili, asset path validi.
- Nessuna modifica a un JSON sorgente per 'fix veloce' direttamente nella build senza PR/version bump.
- Uscita `contentVersion` con changelog contenuti e migrazioni necessarie.

## 8. Contenuti di esempio nel pack

`content/examples/` contiene metadata fittizi/stabili per tre mappe, una tabella d'incontri, una quest, un trainer, una regione e un save. Sono **esempi di contratto**, non una rappresentazione completa del gioco; `tools/validate_examples.py` verifica sintassi e coerenza base.
