# Guide dei Pokémon ricevuti in dono

`pokemon-rewards.v1.json` descrive dove completare le missioni che assegnano un Pokémon. Ogni record collega `questId`, `mapId` e `npcId` reali, con tre testi: requisito (`unlockHint`), percorso locale (`routeHint`) e azione da eseguire (`actionHint`).

Specie, livelli, ricompense e flag non si duplicano qui: provengono dalla quest. `pokemonRewardDiscoveryState` distingue requisiti esterni e passaggi interni; non assegna ricompense e non sostituisce il servizio delle missioni.

Quando si aggiunge una quest con `reward.pokemon`, aggiungere anche la guida e verificare il luogo nel Tiled e le scelte del dialogo. `tests/world/pokemon-reward-guidance.test.ts` richiede copertura completa e un NPC realmente presente nella mappa. Le prove browser verificano inoltre apertura dell'atlante senza spostamenti e consegna effettiva dei fossili.

## Punti delle missioni nell’atlante

`atlas-quest-targets.v1.json` è generato da `tools/build_atlas_quest_targets.py`: non modificare manualmente le coordinate. Dopo cambi a Tiled, dialoghi, regolatori, allenatori o puzzle, rigenerarlo; `--check` e il validatore generale rilevano un indice obsoleto. Ogni evento conserva mappa, oggetto, coordinate e sorgente. Il runtime seleziona il prossimo passo disponibile senza modificare flag o posizione. Gli ingressi indicano lo spawn reale; gli eventi non spaziali non ricevono pin. Contratto e verifiche in `docs/74_ATLAS_EXACT_TARGETS_v0.1.md`.
