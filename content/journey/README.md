# Guide dei Pokémon ricevuti in dono

`pokemon-rewards.v1.json` descrive dove completare le missioni che assegnano un Pokémon. Ogni record collega `questId`, `mapId` e `npcId` reali, con tre testi: requisito (`unlockHint`), percorso locale (`routeHint`) e azione da eseguire (`actionHint`).

Specie, livelli, ricompense e flag non si duplicano qui: provengono dalla quest. `pokemonRewardDiscoveryState` distingue requisiti esterni e passaggi interni; non assegna ricompense e non sostituisce il servizio delle missioni.

Quando si aggiunge una quest con `reward.pokemon`, aggiungere anche la guida e verificare il luogo nel Tiled e le scelte del dialogo. `tests/world/pokemon-reward-guidance.test.ts` richiede copertura completa e un NPC realmente presente nella mappa. Le prove browser verificano inoltre apertura dell'atlante senza spostamenti e consegna effettiva dei fossili.
