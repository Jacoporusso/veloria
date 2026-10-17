# Veloria — Architettura tecnica (v0.3)

## 1. Scelte vincolanti e motivazione

**Client-only first:** PWA offline con Vite + TypeScript + **Phaser 3** come renderer/world scene; **IndexedDB** per i salvataggi; editor **Tiled** per tilemap JSON. PokéAPI è una sorgente **di build/import**, non una dipendenza runtime. Phaser scene/rendering non deve contenere formule, regole di cattura o gestione dello stato del salvataggio.

**Rendering:** pixel-art ortogonale, scalabile e adattiva. Partire con texture base 32×32 px per tile, da validare su schermo reale. Camera con pixel snapping se appropriato; no blur se si usa zoom intero. La mappa illustrata di Veloria è un artwork di concept e **non può essere caricata come collision tilemap**.

## 2. Diagramma logico

```text
+-------------------- PWA Shell --------------------+
| Vite, manifest, Service Worker, input mobile/keys |
+-------------------------+-------------------------+
                          |
+---------------------- Phaser ---------------------+
| BootScene | WorldScene | BattleScene | Ui overlays |
| Renderer, sprite, camera, tilemap, sound, animation|
+-------------------------+-------------------------+
                          | commands / events
+--------------------- Game Core -------------------+
| Map transitions | Quest FSM | Party | Inventory   |
| Battle rules | Encounter rng | Progression       |
+-------------------------+-------------------------+
                          |
+------------------- Data / Persistence ------------+
| Content registry (validated JSON)                |
| IndexedDB saves + backup export/import           |
| Offline asset packs with content version         |
+---------------------------------------------------+
```

## 3. Folder structure proposta

```text
veloria/
  apps/web/
    index.html
    src/
      main.ts
      game/scenes/{BootScene,WorldScene,BattleScene}.ts
      game/ui/
      game/input/
      game/render/
      core/battle/
      core/encounters/
      core/quests/
      core/party/
      core/inventory/
      core/progression/
      data/loaders/
      data/registry/
      persistence/{save,migrations,backup}/
      pwa/
    public/assets/{sprites,tilesets,audio,ui}/
    public/content/{maps,quests,encounters,trainers,pokemon}/
  packages/shared-types/
  packages/content-validator/
  tools/import-pokeapi/
  docs/
  tests/{unit,integration,e2e}/
```

**Non creare prematuramente un monorepo complesso:** questa è la struttura target. In S0 un'app Vite monorepo-free con cartelle equivalenti è sufficiente.

## 4. Contratti chiave

- `MapDefinition`: `id`, `version`, `biomeId`, `tiledAsset`, `renderAssets[]` (v2), `connections[]`, `spawns[]`, `encounterTableId`, `npcRefs`, `scriptRefs`. Each tileset asset maps its Tiled `name` to a Phaser texture key and public path; map-specific images use the same asset list. Runtime v1 metadata is adapted through the legacy Veloria asset mapping; the v1 example contract remains unchanged.

Runtime loading follows the same map boundary: load the active map's `renderAssets` at scene startup, load destination assets before committing a map transition, then release textures used only by the previous map. This limits decoded textures resident in Phaser. The service worker still downloads and precaches every asset in the declared MVP offline pack so offline coverage is unchanged.

Interiors use ordinary MapDefinition/Tiled maps with reciprocal doorway triggers. A room may declare a background `scenery-image`; invisible `hotspot` rectangles provide furniture interactions and separate collision rectangles constrain movement. `core/world/selectAreaTrigger` gives map exits priority over overlapping ambient zones while retaining authored order for other triggers. The Phaser adapter supplies the player's pixel center and handles the chosen event. Rest points share the pure party-healing service with Pokémon Centers; only Centers expose storage. Adding rooms requires no map-ID branches or save schema changes.

Large, infrequent UI such as `BattleScene` is imported when first needed. Production precache follows Vite's generated build manifest so hashed dynamic chunks are available before offline play; checking only the entry HTML script would miss them.
- `EncounterTable`: `id`, `mapId`, `timeBand`, `entries[{speciesId,weight,minLevel,maxLevel}]`; pesi relativi, non percentuali non validate.
- `TrainerDefinition`: `id`, `name`, `team[]`, `aiProfileId`, `reward`, `battleOnceFlag`.
- `QuestDefinition`: `id`, `steps`, `flags`, `conditions`, `rewards`; eventi idempotenti.
- `GameSave`: `schemaVersion`, `contentVersion`, `saveId`, `player`, `party`, `storage`, `flags`, `badges`, `inventory`, `rngState`, `lastMap`, `savedAt`.
- `SpeciesData`: `nationalDex`, `name`, `types`, `baseStats`, `growthRate`, `learnset`, `evolutions`; API importa raw data, runtime riceve solo JSON **normalizzati e validati**.

Esempi concreti e validatore in `../specs/schemas` e `../content/examples`.

## 5. Battaglia come dominio puro

```ts
// Interfacce illustrative, NON una implementazione pronta.
type Command =
  | { kind: 'selectMove'; moveId: string; targetSlot: number }
  | { kind: 'useItem'; itemId: string; targetSlot?: number }
  | { kind: 'switch'; partyIndex: number }
  | { kind: 'attemptFlee' };

type Transition = { state: BattleState; events: BattleEvent[] };
function reduceBattle(state: BattleState, command: Command, rng: SeededRng): Transition;
```

L'engine calcola la transizione; Phaser traduce eventi in animazioni, senza influire sull'esito delle regole. Per replay e unit test: PRNG seedabile, log eventi non ambiguo.

## 6. Cache e PWA iOS

- App manifest con icone originali 192/512 e tema coerente; `display: standalone`; supportare safe area.
- Service Worker custom in `public/sw.js`: precache **app shell + tilemap e asset dell'MVP** e cache runtime delle risorse locali; i pacchetti futuri per bioma possono restare on-demand solo se già scaricati prima di dichiararli offline.
- Versione contenuti (`contentVersion`) distinta da `schemaVersion` del salvataggio. La build non deve cancellare IndexedDB quando aggiorna la cache.
- UI aggiornamenti: "Nuova versione disponibile", salva/sospendi e ricarica in sicurezza, evitando aggiornamenti incontrollati durante una battaglia.
- Safari/iOS può eliminare i dati locali per motivi di spazio o gestione sistema: offrire sempre backup esportabile e messaggio educativo nel menu Save.
- Non affidare il salvataggio al solo `localStorage`; IndexedDB più robusto ma non equivalente a storage permanente garantito.

## 7. Salvataggi e migrazioni

- Snapshot atomico di gioco quando lo stato è stabile; evitare save a metà transizione animata.
- Metadati schema, backup versionato e checksum di integrità (non crittografia).
- Migrations pure e idempotenti: `migrateV1toV2`, ecc., validate con fixtures storiche.
- Le specie hanno ID nazionali numerici stabili; le **istanze** catturate hanno UUID. `mapId` e quest flags non vengono riciclati.
- Recovery: slot precedente e import JSON; errori di migrazione non sovrascrivono il vecchio save.

## 8. Performance mobile

- 60 FPS target aspirazionale; modalità 30 FPS o riduzione particelle/illuminazione se il dispositivo rallenta.
- Sprite atlas divisi per zona/bioma; streaming asset mirato; scaricare contenuti solo a scene/pack necessari.
- Particelle neve/foglie/riflessi sono effetti **cosmetici degradabili**, non bloccanti.
- `MapDefinition v2.ambientEffects` dichiara gli effetti per area; il renderer genera layout deterministici per map ID. In qualità reduced le particelle non si muovono e usano alpha inferiore.
- Evitare shader/filtri GPU su tutto lo schermo nei device più vecchi.
- Audio riprodotto dopo interazione iniziale, con fallback mute.
- Preferenze di animazione full/reduced salvate localmente; la modalità reduced elimina il bob cosmetico del personaggio e rispetta `prefers-reduced-motion` come valore iniziale.

## 9. Test suite

**Unit:** efficienza tipi, danni, cattura, XP, RNG, priorità, status, evoluzione, acquisti, flag.
**Integration:** import dati, serializzazione, caricamento mappe, idempotenza eventi, migrazioni.
**E2E:** avvio, touch, scenari nel documento MVP, offline, background/resume, cambio orientamento, safe area.
**Visual QA:** sprite in erba/ombra, layering foreground, leggibilità a 100% su iPhone reale, densità urbana.

## 10. Dipendenze e conferma versioni

Preferire versioni compatibili **pinnate al momento dell'implementazione** con lockfile. Phaser 3 ha API ufficiali per tilemap Tiled JSON e scene; il comportamento esatto di Vite e plugin PWA va validato su toolchain effettiva. Non assumere che l'ultima versione major di ogni package sia interoperabile senza test.

Fonti: https://docs.phaser.io/phaser/concepts/loader · https://docs.phaser.io/phaser/concepts/scenes · https://docs.phaser.io/phaser/concepts/input · https://github.com/vite-pwa/vite-plugin-pwa
