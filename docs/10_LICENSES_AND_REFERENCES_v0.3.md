# Veloria — Diritti, provenienza e riferimenti (v0.3)

## 1. Uso personale ≠ licenza

Il progetto è destinato a uso strettamente privato su smartphone, senza distribuzione. Questo **non** significa che contenuti come specie, artwork, nomi, loghi, audio, ROM e mappe Pokémon siano automaticamente liberi da riprodurre, né che la documentazione di PokéAPI conceda diritti di riuso di tutti gli asset citati. Per una possibile pubblicazione futura occorrerà una revisione legale specifica oppure la sostituzione con contenuti originali o autorizzati.

## 2. Policy di produzione

- Il **mondo di Veloria**, città, narrazione, missioni, UI, strutture e audio saranno originali o con licenze verificate.
- La **mappa illustrata** generata per questo progetto serve come riferimento concept, non come tilemap o fonte per copiare mappe altrui.
- I riferimenti *Sea of Stars* descrivono qualità generale/atmosfera (HD pixel art, luci, ricchezza ambientale): **nessun asset, sprite, mappa o composizione proprietaria** verrà copiato.
- Le richieste PokéAPI non devono sovraccaricare il servizio. Cache/import solo durante lo sviluppo, non a ogni combattimento.
- Lo ZIP non include ROM, musiche ufficiali, sprite ufficiali o bulk dump dei 251 Pokémon.
- Ogni asset esterno deve avere fonte, licenza, autorizzazione, eventuali obblighi di attribution e status nel registro CSV.

## 3. Fonti tecniche

- PokéAPI Docs: https://pokeapi.co/docs/v2
- PokéAPI sprites repository (riferimento informativo, diritti separati): https://github.com/PokeAPI/sprites
- Phaser 3: https://docs.phaser.io/phaser/concepts/scenes
- Phaser loader: https://docs.phaser.io/phaser/concepts/loader
- Phaser input: https://docs.phaser.io/phaser/concepts/input
- Phaser tilemaps: https://docs.phaser.io/api-documentation/3.88.2/class/tilemaps-tilemap
- Tiled editor: https://www.mapeditor.org/
- Vite: https://vite.dev/guide/
- Vite PWA plugin: https://vite-pwa-org.netlify.app/
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Game Boy disassembly reference (solo per ricerca storica, non per includere materiale protetto): https://github.com/pret/pokegold

## 4. Checklist pre-integrazione

- [ ] Asset presente nel registro `assets/ASSET_REGISTER.csv`.
- [ ] Fonte e autore rintracciabili.
- [ ] Licenza/permesso compatibile con utilizzo previsto.
- [ ] Obblighi di attribution applicati.
- [ ] Il contenuto non è estratto illegalmente da ROM o prodotti terzi.
- [ ] È chiaro cosa dovrà essere sostituito in caso di rilascio pubblico.

Queste note non costituiscono una consulenza legale.

La validazione automatica `python tools/validate_examples.py` verifica inoltre che ogni media pubblicato in `public/` sia registrato una sola volta, che il file resti dentro il repository e che creator, licenza, permesso e stato siano compilati. Un asset esterno deve avere anche una `source_url`; per gli asset originali del progetto basta indicare chiaramente autore/strumento e natura del materiale. Le icone PWA e il favicon seguono lo stesso registro degli asset di mappa.

`assets/DEPENDENCY_LICENSES.csv` registra per ogni pacchetto bloccato da `package-lock.json` versione, licenza dichiarata da npm, URL risolto, integrity, ambito dev/prod e stato optional. Dopo una modifica alle dipendenze eseguire `python tools/sync_dependency_licenses.py`, poi il validator controlla che il registro corrisponda ancora al lockfile. Il registro è una traccia tecnica e non una valutazione legale delle licenze.
