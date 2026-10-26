# Biancavetta — fondale illustrato e accessi

Nuova illustrazione2D opaca coerente con il lotto alpino: strade chiare, neve dipinta, edifici compatti e materiali meno lucidi. La [guida geometrica](../assets/prompts/biancavetta-production-layout-v1.md) deriva da Tiled e distingue il margine visivo dei piedi dalle collisioni, che non cambiano. Preservati anche presidio e osservatorio, entrambi hotspot reali; non sono porte decorative inventate.

Asset: [PNG raw](../assets/sources/veloria-biancavetta-illustrated-v3.png), [WebP lossless](../public/assets/scenery/veloria-biancavetta-illustrated-v3.webp), [prompt e revisioni](../assets/prompts/biancavetta-illustrated-v3.md). Built-in ImageGen,1448×1086, senza crop o resize. La revisione finale porta la palestra verso la soglia reale, invece di conservare la lunga scala precedente alla transizione.

Il binding passa da `terrainBase` a un oggetto `scenery-image` a copertura della mappa, come gli altri fondali illustrati. I quattro pittogrammi già condivisi per cure, acquisti, funivia e osservazione sono abilitati attraverso `wayfindingIcon`; non sono incorporati nel dipinto e non aggiungono collisioni.

## Prove locali

Due casi browser finali passati: accessi a Centro, bottega, presidio, osservatorio, indicazioni e funivia; quattro marker distinti; ingresso palestra e ritorno; uscita ovest; varco est bloccato senza medaglia e percorribile con Medaglia Brina, con ritorno da R14. Screenshot portrait/landscape e assenza di errori JavaScript verificati. Le medaglie nel secondo caso sono precondizioni di fixture, non una vittoria naturale della campagna. Log `.tmp/biancavetta-final-paths.log`.

Build e due controlli globali dei27 fondali passati. Produzione offline:26 fondali non iniziali decodificati alla prima richiesta senza rete; viaggio in funivia con ritorno, reload e risorse invariate passato.767 test dominio e31 persistenza passati; validatore621 asset/27 fondali/48 mappe passato. Il primo caso Biancavetta è stato ripetuto dopo aver ordinato geograficamente le tappe, conservandole tutte. Log `.tmp/biancavetta-final-render.log`, `.tmp/biancavetta-production-offline.log`, `.tmp/biancavetta-domain.log`, `.tmp/biancavetta-validated.log`, `.tmp/biancavetta-geographic-order.log`. Rilascio in `CI_STATUS.md`.

## Revisione ancora aperta

Nel rilascio0.4.6 il riempimento riflesso oltre il bordo nord mostrava un frammento della cupola nella viewport portrait. Il successivo [incremento0.4.7](69_POKEMON_REWARDS_AND_MAP_EDGES_v0.1.md) sostituisce quel riempimento con un campo colore derivato dalla sola fascia esterna, verificato anche a390×1100. La sola presenza nel manifest continua a non certificare la revisione completa della scena.

Rimangono aperti il rifacimento delle altre mappe, le pose direzionali del cast e la verifica naturale della campagna completa. Il [piano delle pose NPC](67_NPC_DIRECTIONAL_ANIMATION_PLAN_v0.1.md) distingue le48 identità presenti dalle animazioni ancora da implementare.
