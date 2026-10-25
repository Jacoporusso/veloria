# Gap catalogo Gen I — audit e procedura di estensione

Audit locale read-only del 25/10/2026. Nessun dato runtime o cache è stato modificato; nessuna rete/browser/test eseguito.

Aggiornamento successivo: `tools/cache_gen1_reference.py` ha riusato 121 risposte esistenti e scaricato 181 risposte mancanti. Tutti i 302 riferimenti `pokemon`/`pokemon-species` per ID1–151 sono ora conservati con URL e SHA-256 in `content/sources/pokeapi/gen1-reference-manifest.json`, verificabili tramite `--check-published-offline`. Sono riferimenti, non registrazioni runtime: i conteggi di specie giocabili e mancanti sotto rimangono validi. Le quantità «mancanti dalla cache» nelle sezioni successive fotografano lo stato dell’audit iniziale, prima del prefetch.

## Esito del catalogo

`content/battle/species.v1.json` contiene 83 specie in totale, 60 con National Dex ID da 1 a 151. Mancano 91 specie Gen I. I tre nomi segnalati risultano assenti dal registry: Magikarp #129, Gyarados #130, Snorlax #143.

ID Gen I mancanti:

```text
21–24, 27–40, 46–59, 63–68, 76–78, 83–85, 88–94,
102–115, 118–123, 125–132, 137–146, 150–151
```

La lista espansa, senza intervalli: `21, 22, 23, 24, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 63, 64, 65, 66, 67, 68, 76, 77, 78, 83, 84, 85, 88, 89, 90, 91, 92, 93, 94, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 118, 119, 120, 121, 122, 123, 125, 126, 127, 128, 129, 130, 131, 132, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 150, 151`.

Altri conteggi di oggi:

- `content/battle/moves.v1.json`: 86 mosse supportate dal runtime.
- `content/sources/pokeapi/source-learnsets.json`: 83 specie, 1.143 voci HGSS level-up ufficiali; 534 voci non implementate (177 ID mossa distinti) sono conservate separatamente.
- Tutte le 83 specie registrate hanno un learnset ufficiale nel report sorgente; il registry non equivale quindi a copertura Gen I completa.

## Richieste e cache presenti

I raw response PokéAPI sono sotto `content/sources/pokeapi/`. Conteggi locali per endpoint: 84 risorse `pokemon/{id}`, 97 `pokemon-species/{id}`, 127 `move/{name}`, 36 `evolution-chain/{id}` e 9 `version-group/{name}`. Le risorse già conservate non sono tutte riferite al roster runtime: alcune servono al catalogo evoluzioni o ad audit precedenti.

Manifest locali:

- `manifest.json`: 214 risorse registrate (84 Pokémon, 118 mosse, 9 version-group, 3 item).
- `species-manifest.json`: 127 risorse (63 Pokémon, 63 Pokémon-species, un version-group), generate dagli attuali 63 record di `species-imports.v1.json`.
- `evolution-manifest.json`: 145 risorse (35 catene, 96 Pokémon-species, 9 item, 3 location, una mossa e un version-group).

Per coprire i 151 ID servono oggi **91 risposte mancanti `pokemon/{id}` e 90 risposte mancanti `pokemon-species/{id}`**. Le risposte Pokémon forniscono anche i learnset per versione/metodo. Dopo aver scaricato e analizzato quei learnset si conoscerà il numero esatto di nuove risorse `move/{name}` necessarie per le mosse da implementare, e di nuove catene/item/location necessarie per le evoluzioni. Non si può stimare correttamente il set di mosse aggiuntive contando solo il catalogo attuale: le 91 risposte mancanti non sono in cache.

## Pipeline esistente e regole per non inventare mosse

1. Aggiungere i 91 ID al manifest di lavoro `content/battle/species-imports.v1.json`. `templateSpeciesId` è un supporto transitorio richiesto dall’importer parametri; non è fonte per statistiche, tipi o nome, e non deve essere usato come learnset.
2. `tools/import_pokeapi_species.py --fetch` scarica/usa `pokemon/{id}` e `pokemon-species/{id}`, applica i parametri storici della versione configurata (attualmente HGSS), usa i nomi italiani e aggiorna `species-manifest.json` con URL e SHA-256. `--check` è offline e verifica i file generati contro la cache.
3. `tools/import_pokeapi_battle.py --fetch` usa `pokemon/{id}` per estrarre esclusivamente le mosse `level-up` del gruppo `heartgold-soulsilver`. Il report completo e le mosse non ancora supportate restano in `source-learnsets.json`; `officialLearnset` runtime filtra solo `SUPPORTED_MOVES` definite nel tool e `moves.v1.json` contiene solo le relative meccaniche implementate. `defaultMoveIds` è ricavato dal learnset ufficiale supportato fino al livello 5, non da una mossa globale.
4. **Non aggiungere Tackle (o altra mossa) come fallback generico.** Tackle è legittimo solo dove il record PokéAPI HGSS la assegna davvero. L’importer battle attualmente fallisce esplicitamente se una specie non ha almeno una mossa supportata entro il livello 5; quella specie va lasciata deferred finché non si implementa una sua mossa ufficiale appropriata. `create-creature.ts` usa il learnset ufficiale quando presente; non sostituire il guardrail con una mossa inventata.
5. Per rendere giocabili tutti i 151, confrontare i learnset sorgente dei nuovi ID, implementare le mosse mancanti con i loro effetti reali, aggiungere gli endpoint `move/{name}` alla cache e a `SUPPORTED_MOVES`, quindi rigenerare. Le 177 mosse attualmente pendenti mostrano già che la copertura dati è più ampia della copertura meccanica: importare i learnset da solo non implementa quelle mosse.
6. `tools/import_pokeapi_evolutions.py --fetch` genera `evolution-reference.v1.json` e il relativo manifest da catene ufficiali. È una fonte di riferimento e **non** abilita automaticamente evoluzioni nel gioco. `tools/import_item_evolutions.py` deriva solo i rami pietra dichiarati in `species-imports.v1.json`; evoluzioni runtime per livello e altri metodi vanno aggiunti esplicitamente in `content/battle/progression.v2.json`, rispettando gli archi e le condizioni verificate dal riferimento ufficiale. Non dedurre un’evoluzione dalla sola somiglianza/template.
7. `tools/import_pokeapi_growth.py --fetch` aggiorna le curve XP ufficiali richieste dalle specie registrate. Per ognuno degli importer con `--check`, eseguire la verifica offline dopo il fetch/generate con la cache completa. Nessun fetch è richiesto durante il gioco.

Ordine suggerito per il lotto dati: completare prima `species-imports.v1.json` e le decisioni sulle mosse; scaricare le risorse mancanti con i tool `--fetch`; implementare mosse e regole mancanti; rigenerare registry/learnset/crescita/evoluzione; poi passare validatori e test di contenuto. Il lotto può essere suddiviso per famiglie, ma non marcare l’intero catalogo completo finché ognuna delle 151 specie ha un nome, dati ufficiali, almeno un set di mosse ufficiali supportato a livello giocabile e un trattamento esplicito delle evoluzioni applicabili.

### File di riferimento

- `content/battle/species.v1.json`
- `content/battle/species-imports.v1.json`
- `content/battle/moves.v1.json`
- `content/battle/level-up-moves.v1.json`
- `content/sources/pokeapi/source-learnsets.json`
- `content/sources/pokeapi/manifest.json`
- `content/sources/pokeapi/species-manifest.json`
- `content/sources/pokeapi/evolution-manifest.json`
- `tools/import_pokeapi_species.py`
- `tools/import_pokeapi_battle.py`
- `tools/import_pokeapi_evolutions.py`
- `tools/import_pokeapi_growth.py`
- `tools/import_item_evolutions.py`
- `src/core/battle/create-creature.ts`
