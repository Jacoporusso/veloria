# Corposcontro e Segnoraggio — catalogo locale

Importazione dalle fonti PokéAPI già presenti nel repository, gruppo di mosse di HeartGold/SoulSilver. Nessuna regola o probabilità inventata.

| Mossa | Tipo / categoria | Potenza / precisione / PP | Effetto secondario |
|---|---|---|---|
| Corposcontro (`body-slam`, 34) | Normale / fisica | 85 / 100 / 15 | 30% paralisi |
| Segnoraggio (`signal-beam`, 324) | Coleottero / speciale | 75 / 100 / 15 | 10% confusione, 2–5 turni |

Le sorgenti sono `content/sources/pokeapi/move-body-slam.json` e `move-signal-beam.json`; il motore supportava già questi effetti. L’importatore verifica categoria, bersaglio/parametri e assenza degli effetti aggiuntivi non supportati prima di generare il catalogo. Nessun cambiamento al ruleset v15.

Dieci apprendimenti per nove specie: Corposcontro per Poliwag/Poliwhirl al 21 e Jynx al 39; Segnoraggio per Dewgong all’1 e al 7, Chinchou al 31, Lanturn al 35, Mareep al 32, Flaaffy al 36, Ampharos al 42. Conservati entrambi i livelli di Dewgong. Il catalogo passa a 86 mosse per 83 specie; restano 534 apprendimenti esclusi ed esplicitamente documentati.

Sette test dedicati e suite completa dominio/persistenza passati: parametri sorgenti, livelli di tutte le specie, effetti con seed controllati, PP, immutabilità, immunità Spettro a Corposcontro, superefficacia Coleottero su Psico, coesistenza fra stato e confusione, descrizioni condivise. `import_pokeapi_battle.py --check` passato. Questi test non attestano un percorso naturale con le due mosse o un nuovo bilanciamento complessivo. Nessuna riscrittura delle mosse dei Pokémon già salvati.
