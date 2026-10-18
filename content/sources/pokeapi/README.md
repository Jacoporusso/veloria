# PokéAPI battle sources

Authoritative source: https://pokeapi.co/docs/v2 . Selected version group: `heartgold-soulsilver`.

The JSON responses here are cached build inputs, not runtime network requests. `manifest.json` records the public endpoint and SHA-256 of every response used by the importer. `source-learnsets.json` retains the complete level-up lists for the 20 supported species, including moves whose mechanics are not implemented yet.

Run `python tools/import_pokeapi_battle.py --fetch` to download missing resources and generate the catalog. Run `python tools/import_pokeapi_battle.py --check` offline to detect source or generated-data drift. The main content validator runs that check automatically.

Generated outputs are `content/battle/moves.v1.json`, `content/battle/level-up-moves.v1.json`, starter moves in `content/starters/starting-partners.v1.json`, and move fields in `content/battle/species.v1.json`. Do not edit their move values or learning levels manually. The importer applies PokéAPI `past_values` at version-group boundaries, retains Italian move names, and resolves the historical String Shot and Sweet Scent stages from the API effect text.

Only implemented moves enter the runtime subset. The source report explicitly lists the remaining level-up entries; their effects must be implemented before adding them. This import does not claim that the entire battle simulator is a faithful emulation: abilities, held items, many field effects, and several other mechanics remain outside the current game.

New creatures select their supported official moves at their actual level, with four active slots. Prototype save compatibility is not required; the importer does not rewrite player saves.

Evolution reference data is imported separately with `python tools/import_pokeapi_evolutions.py --fetch`. It caches species, chains and item names, generates `content/battle/evolution-reference.v1.json`, and records source URLs/checksums in `evolution-manifest.json`. `--check` reproduces both outputs offline and checks the implemented runtime thresholds against the sources. The main content validator runs this check. HGSS-era methods for canonical forms are displayed independently from runtime availability: a reference entry does not enable an evolution or add an unimplemented target species. Unsupported nontrivial conditions fail the import instead of producing guessed UI copy.

Species imports are declared in `content/battle/species-imports.v1.json`. Run `python tools/import_pokeapi_species.py --fetch`, then the battle importer to generate their learnsets. The species importer normalizes individual stat/type snapshots for the generation selected by the version group: [PokéAPI historical snapshots apply through their listed generation](https://pokeapi.co/docs/v2#pokemon). It does not apply Generation I's combined Special to HGSS split stats. The configured prototype growth curve is inherited from the parent; base experience yields do not imply a complete historical XP model. `--check` verifies parameters and `species-manifest.json` offline.

Run `python tools/import_pokeapi_evolution_art.py --fetch` for artwork of the declared imports. It retains original PNGs, creates WebP q88 files, and records both checksums/provenance plus asset-register entries. Regeneration requires Pillow; `--check` requires only the standard library. Add the generated runtime paths to the PWA shell and enable only evolutions with a registered target and approved prototype artwork. The content validator checks sources, assets and offline paths. No import rewrites player saves.

Urban imports use `artworkGroup: urban` in the species import configuration. `python tools/import_pokeapi_urban_art.py --fetch` caches approved private-prototype official artwork separately from evolution artwork, and `--check` verifies the local manifest and both checksums without network. Urban data references are promoted from the planning-only `vetracielo-source-preview.json` into the normal generated manifests when the battle/species/evolution imports run. The preview manifest remains a historical planning snapshot and does not itself enable content.


### Evoluzioni dei sentieri — 0.3.72

La configurazione `species-imports.v1.json` dichiara altri sei import (17,20,162,164,180,195), ereditando soltanto la curva XP provvisoria dai rispettivi precursori. I parametri storici, learnset e condizioni evolutive restano dati della fonte. Eseguire in ordine gli importatori species, battle, evolution_art, evolutions; `--fetch` è necessario soltanto per risposte/artwork assenti. `--check` verifica poi tutti i manifest e hash senza rete. Gli artwork evolutivi sono WebP lossless dai PNG conservati; il gruppo conta ora nove immagini, separato dalle due urbane. Il runtime non chiama PokéAPI.
