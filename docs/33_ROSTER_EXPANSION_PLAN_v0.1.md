# Piano di espansione roster — sei evoluzioni da incontri esistenti

**Stato:** piano dati, non contenuto runtime. Aggiornato il 21/10/2026.

## Obiettivo e limite delle fonti locali

Il checkpoint descritto in [08_ROADMAP_BACKLOG_v0.3.md](08_ROADMAP_BACKLOG_v0.3.md) riporta 73 specie e 78 mosse supportate e mantiene aperto l’obiettivo del Pokédex #001–#251. Il [GDD](01_GDD_Veloria_v0.1.md) richiede che le forme evolute siano esplicitamente validate prima di renderle ottenibili; le regole di battaglia scelgono le soglie evolutive dai dati ufficiali e non applicano un cap nascosto ([06_BATTLE_AND_PROGRESSION_RULES_v0.3.md](06_BATTLE_AND_PROGRESSION_RULES_v0.3.md)).

La cache locale contiene già i record `pokemon-species` e le catene evolutive da cui si leggono i nomi e le condizioni ufficiali riportate qui sotto. Per i sei target non risultano invece cache `pokemon-{id}.json` né voci in `source-learnsets.json`. Di conseguenza, parametri di battaglia, base esperienza e learnset HGSS delle forme evolute devono essere importati e verificati prima di inserirle nel catalogo. La presenza di mosse compatibili nei loro predecessori non prova che ogni target abbia una mossa supportata al livello iniziale.

Fonti e regole dell’importer sono documentate in [content/sources/pokeapi/README.md](../content/sources/pokeapi/README.md). La generazione di specie controlla che al livello 5 esista almeno una mossa supportata; se una specie non supera quel controllo, va rinviata senza assegnarle mosse inventate.

## Batch proposto

Le soglie nella colonna evoluzione sono quelle già registrate nel riferimento locale importato da PokéAPI HeartGold/SoulSilver (`content/battle/evolution-reference.v1.json`). Sono tutte normali evoluzioni di livello; qui non si propone alcuna sostituzione di scambi, amicizia, strumenti o luoghi.

| Target | ID | Precursore incontrabile | Disponibilità attuale del precursore | Condizione ufficiale dal riferimento locale |
|---|---:|---|---|---|
| Pidgeot | 18 | Pidgeotto #17 | R11 Via delle Cascate, livelli 28–32; R12 Valle del Vento, livelli 33–37 | Pidgeotto raggiunge il livello 36 |
| Gloom | 44 | Oddish #43 | D01 Bosco dei Veli, livelli 3–5; R03 Terrazze del Muschio, 6–8; R04 Salita dei Petali, 8–10 | Oddish raggiunge il livello 21 |
| Poliwhirl | 61 | Poliwag #60 | D01 Bosco dei Veli, livello 5; R03 Terrazze del Muschio, 6–8; D04 Delta degli Specchi, pesca, 25–28 | Poliwag raggiunge il livello 25 |
| Weepinbell | 70 | Bellsprout #69 | D01 Bosco dei Veli, livelli 3–5; R02 Viale delle Fronde, 4–6; R03, 6–8; R04, 8–10 | Bellsprout raggiunge il livello 21 |
| Electrode | 101 | Voltorb #100 | R06 Anello Magnetico, livelli 15–18; R07 Condotto Risonante, 18–21; Parco di Vetracielo, 12–15 | Voltorb raggiunge il livello 30 |
| Ariados | 168 | Spinarak #167 | R01 Sentiero dell’Alba, livelli 2–4; D01 Bosco dei Veli, 3–6; R02, 4–6; R03, 6–8; R04, 8–10; R05 Viadotto dei Ciliegi, 11–13 | Spinarak raggiunge il livello 22 |

I nomi dei percorsi e i livelli sono letti dalle tabelle `content/encounters/d01_woodland.encounter.json`, `r01_tall_grass.encounter.json`, `r02_grove.encounter.json`, `r03_moss_terraces.encounter.json`, `r04_petal_ascent.encounter.json`, `r05_cherry_viaduct.encounter.json`, `r06_magnetic_patch.encounter.json`, `r07_conduit_patch.encounter.json`, `r11_cascade_patch.encounter.json`, `r12_wind_patch.encounter.json`, `d04_delta_fishing.encounter.json` e `vetracielo_park.encounter.json`. I precursori sono già specie runtime; i sei target non lo sono.

La proposta mantiene il gruppo omogeneo: forme di prima o seconda generazione, ottenibili dalla squadra esistente tramite il solo livello. L’incontro di Poliwag nel Delta include già livelli compatibili con la soglia ufficiale 25. Pidgeotto può raggiungere la soglia nell’intervallo di R12. Gli altri precursori sono disponibili prima della soglia e richiedono la progressione normale della squadra.

## Procedura di importazione

1. Aggiungere i sei target a `content/battle/species-imports.v1.json`, con i rispettivi `templateSpeciesId` uguali al precursore indicato e `artworkGroup: "evolution"`. Il template fornisce solo la curva XP provvisoria; statistiche, tipi, esperienza e mosse restano dati della fonte HGSS.
2. Eseguire `python tools/import_pokeapi_species.py --fetch`. Scarica le risorse `pokemon` e `pokemon-species` mancanti per gli import dichiarati e aggiorna i parametri normalizzati per il gruppo HeartGold/SoulSilver.
3. Eseguire `python tools/import_pokeapi_battle.py --fetch --group evolution`. Importa il learnset ufficiale di livello, promuovendo soltanto le mosse già supportate dal catalogo locale. Controllare `content/battle/level-up-moves.v1.json` e `content/sources/pokeapi/source-learnsets.json`, inclusi gli apprendimenti non supportati, prima di procedere. L’asserzione importer sui moveset iniziali è un gate: un target che non può iniziare con una mossa già supportata resta rinviato.
4. Eseguire `python tools/import_pokeapi_evolution_art.py --fetch`. Per gli import marcati `evolution` conserva il PNG sorgente, genera il WebP runtime, aggiorna il manifest artwork e aggiunge le righe mancanti al registro asset. L’importer non offre un selettore di gruppo separato.
5. Eseguire `python tools/import_pokeapi_evolutions.py --fetch` per aggiornare riferimento e manifest delle evoluzioni dalla cache API. Solo dopo avere verificato target, learnset e artwork aggiungere gli archi ufficiali a `content/battle/progression.v1.json`, con ID asset corrispondente agli artwork generati. Non aggiungere condizioni o soglie manuali diverse da quelle importate.
6. Eseguire i controlli offline con `--check` per importer specie, battaglia, artwork ed evoluzioni, poi `python tools/validate_examples.py`. Verificare inoltre che encounter, party, interfaccia Pokédex/evoluzione, salvataggio e rientro dopo evoluzione usino i nuovi record senza cambiare PP o introdurre mosse non supportate. Nessuna tabella incontri va modificata per questa tranche: i precursori sono già presenti.

Il fetch è esplicito: le risposte mancanti devono essere salvate in `content/sources/pokeapi`, con endpoint e SHA-256 nei manifest generati. I controlli `--check` non devono richiedere rete e devono riprodurre i dati dai file locali.

## Gate di rilascio

- Nessun target entra in `species.v1.json`, nei dati runtime o nelle evoluzioni finché parametri, mosse iniziali, learnset, artwork e arco di evoluzione non superano i controlli offline.
- Non aggiungere mosse con effetti non implementati per soddisfare il controllo del moveset; rinviare il target se necessario.
- Gli artwork seguono la pipeline esistente: fonte PokéAPI, checksum, attribuzione e registrazione nel registro asset. Il loro copyright non viene presentato come proprietà del progetto; l’autorizzazione dell’utente a pubblicare il progetto è già registrata nella conversazione.
- Le soglie provengono dal riferimento locale HeartGold/SoulSilver; questo non certifica una simulazione completa di tutte le regole storiche né il bilanciamento naturale della campagna.
