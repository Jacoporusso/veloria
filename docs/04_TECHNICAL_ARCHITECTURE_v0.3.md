# Veloria — Architettura tecnica (v0.3)

## 1. Scelte vincolanti e motivazione

**Client-only first:** PWA offline con Vite + TypeScript + **Phaser 3** come renderer/world scene; **IndexedDB** per i salvataggi; editor **Tiled** per tilemap JSON. PokéAPI è una sorgente **di build/import**, non una dipendenza runtime. Phaser scene/rendering non deve contenere formule, regole di cattura o gestione dello stato del salvataggio.

**Rendering:** 2D illustrato moderno, ortogonale, scalabile e adattivo. La griglia logica Tiled resta a 32×32 px; le sorgenti pittoriche possono avere risoluzione superiore. Camera e campionamento devono restare morbidi e privi di fessure anche con zoom frazionario su mobile. La mappa illustrata di Veloria è un artwork di concept e **non può essere caricata come collision tilemap**.

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

### Presentazione Atlante approvata, 17 ottobre 2026

`game/ui/ExplorationMenu.ts` gestisce la navigazione DOM e il focus; non legge o muta salvataggi. WorldScene blocca movimento e interazioni durante i pannelli di navigazione. JourneyPanel compatta l’obiettivo sui movimenti validi, mantenendo i dati derivati dal catalogo. `game/rendering/world-camera.ts` calcola uno zoom che copre il viewport per ogni mappa, senza condizioni su ID specifici, ed è richiamato a caricamento, transizione e resize. La shell occupa 100dvh e usa safe area per gli overlay.

### Bootstrap e prologo

StartScreen è un adapter DOM che restituisce una scelta esplicita; non cancella né scrive salvataggi. Il bootstrap carica lo slot, raccoglie nome/continua e salva la nuova partita prima di istanziare Phaser. trainer-profile valida il nome in una funzione pura. Il service worker viene registrato prima della scelta, per rendere disponibile offline anche il titolo. La preview di sviluppo salta titolo e persistenza, mantenendo l’avviso visibile.

Il prologo usa opening.v1.json per dialogo e indicazioni sulle soglie/NPC delle mappe. intro_started/intro_completed e prologue_complete_seen sono flag compatibili con schema v2. La schermata PrologueCompletion legge un snapshot senza mutarlo; WorldScene sospende l’input e persiste solo la presa visione. Il requisito q_starter_selected è dichiarato come selectionFlag nel catalogo starter, consumato dal selettore e registrato nel validatore dei requisiti delle mappe.

### IA e matrice tipi, prototipo v3

BattleScene delega la selezione avversaria a una funzione pura, con policy risolta dal registro tramite aiProfileId in WorldScene. Il catalogo inietta nel ruleset una matrice locale completa 17×17; dati e profili sono validati alla build. La scena continua a ricevere comandi ed eventi, senza formule o accesso di rete. Nessuna modifica a GameSave.

### Apprendimento locale delle mosse

Il registro level-up-moves è validato contro specie e catalogo, poi normalizzato dal catalogo runtime nel ruleset con PP massimi. Il reducer XP emette moveLearned/moveLearningSkipped. Se il moveset è pieno, BattleScene sospende la presentazione e offre sostituzione o rifiuto; `core/battle/move-learning.ts` applica la scelta come transizione pura, senza consumare un turno. Il callback di completamento e la persistenza aspettano che la coda delle scelte sia risolta, anche dopo un KO terminale. Gli slot e i PP del save esistenti bastano: nessun campo o migrazione nuova.

### Terreno HD e NPC illustrati

Il renderer imposta le dimensioni sorgente delle sole tile layer usando il tileset, poi scala ground/terrain_detail a 32 unità per casella. Oggetti, trigger, collisioni, spawn e salvataggi rimangono in coordinate mondo32 px. Le mappe mantengono Tiled e renderAssets versionati; nessun cambiamento al save. Gli NPC dichiarano sprite e spriteFrame; i frame vengono ricavati dalle dimensioni effettive dell’atlante. Nuove mappe con NPC devono dichiarare l’immagine in renderAssets e il relativo frame.

### Asset raster runtime

Le immagini runtime di mappa, battaglia e schermata iniziale sono servite in WebP con trasparenza quando necessaria. I PNG originali restano registrati in `ASSET_REGISTER.csv`; le copie WebP hanno righe di registro proprie e sono quelle referenziate dai metadata e dal precache PWA. Gli artwork PokéAPI conservano URL di origine e checksum del file runtime nel relativo manifesto. La WorldScene precarica gli asset della mappa e il personaggio; BattleScene carica solo le specie in campo e le evoluzioni configurate della squadra, senza ritardare l’ingresso nel mondo con tutto il catalogo artistico.


### Sostituzioni obbligate — ruleset v7

`resolveBattleTurn` riconosce gli attivi KO prima della fase di comandi ordinaria. Valida e applica soltanto le sostituzioni richieste, restituisce eventi `creatureSwitched` e conserva turno, RNG, HP e PP: non esegue attacchi o effetti residui. I comandi della parte che non deve sostituire vengono ignorati in questa fase. I cambi volontari rimangono azioni del turno.

La scena di battaglia apre la scelta del giocatore quando necessaria. Quando solo l’avversario deve sostituire, avvia automaticamente la fase dopo i messaggi di KO; l’interfaccia esistente a due comandi passa un segnaposto del giocatore che il dominio non esegue. Se entrambi devono sostituire, le due scelte sono risolte insieme. Le regressioni verificano sia il contratto puro sia HP/PP/turno nella scena reale.

### Consultazione strategica — contenuti 0.3.57

`PokemonPanel` è un adattatore HTML in sola lettura per Squadra e Pokédex: legge cataloghi, squadra e registro degli incontri; tipi e affinità usano la matrice del motore. Le statistiche al livello derivano dalla stessa funzione `calculateStats`; gli HP massimi del compagno provengono dalla partita. Le descrizioni condivise in `game/battle/move-description.ts` leggono i campi di `MoveDefinition` e sono riusate dalla consultazione in battaglia, senza dedurre effetti dai nomi delle mosse.

`BattleScene.onSpeciesSeen` segnala soltanto l’avversario realmente mostrato, inizialmente e dopo un ingresso; il precaricamento delle riserve non registra incontri. `WorldScene` persiste i flag `pokedex_seen_<id>` e registra anche le specie possedute, mantenendo lo storico durante la progressione. La vista pura `buildPokedexEntries` distingue visto e posseduto. Non sono aggiunte migrazioni o ricostruzioni retroattive degli incontri.

### Feedback dei risultati — contenuti 0.3.60

`BattleCelebration` è una ricevuta HTML degli eventi risolti, in sola lettura. La cattura usa l’istanza realmente aggiunta a squadra o box; il riepilogo mostra i dati di quella creatura. La presentazione della vittoria riceve da `WorldScene.victoryPresentation` il denaro e l’eventuale nuova medaglia effettivamente assegnati da `onComplete`, insieme a `victoryFeedback` del contenuto allenatore. La scena protegge sia il completamento sia la notifica di chiusura da duplicazioni.

Il componente si chiude con touch o tastiera, gestisce focus e scorrimento e viene distrutto allo shutdown della scena. Le animazioni della Sfera e del banner non cambiano RNG, probabilità o inventario. Il medagliere legge esclusivamente `save.badges`; il catalogo `content/badges/badges.v1.json` e `BadgeEmblem` condividono identità e disegno della medaglia nelle diverse schermate.

### Interazioni ambientali a stadi — contenuti 0.3.62

Un oggetto Tiled può dichiarare `dialogueId` per usare gli stessi dialoghi a stadi degli NPC. La scena risolve lo stadio prima dell’interazione e applica l’eventuale `questEvent` alla chiusura del dialogo; i prerequisiti e le ricompense rimangono responsabilità di `applyQuestEvent`. Un dialogo associato all’oggetto ha precedenza sull’eventuale evento diretto. Dopo un avanzamento la scena rigenera le visuali della mappa mantenendo posizione e personaggio.

La proprietà opzionale `completedFlag` mostra una spunta di stato, derivata dal save e valida anche dopo una ripresa. Il validatore verifica riferimenti a dialoghi e flag. Il vivaio di Radicelmo usa questo contratto per acqua → luce → osservazione → rapporto a Leda, senza aggiungere condizioni specifiche per questa mappa alla scena o al motore quest.

### Canvas e testi HiDPI — contenuti 0.3.63

Il bootstrap usa `Scale.NONE` e `observeGameSize(..., true)`: il backing canvas ha dimensioni CSS × densità, con densità limitata a 2; lo zoom del ScaleManager è il reciproco della densità. `gameViewport` ricava da quello zoom le dimensioni logiche. Si usa lo stato di Phaser, senza un registro di densità separato che possa divergere durante HMR o import di fixture.

Il mondo moltiplica zoom e deadzone per la densità. La battaglia dispone gli elementi nelle dimensioni logiche e scala il contenitore UI; Phaser conserva le trasformazioni delle aree touch. La factory privata dei testi della battaglia imposta anche `TextStyle.resolution` a 2: ingrandire il solo framebuffer lascerebbe i glifi rasterizzati alla vecchia definizione. Gli artwork conservano dimensioni sorgente e filtro lineare. Il terreno statico resta composto alla risoluzione della griglia; questo intervento migliora canvas, testi di battaglia e immagini individuali, senza rigenerare gli atlanti o il terreno.

### Espansione geografica e obiettivi facoltativi — contenuti 0.3.64

Ogni transizione completata emette `area/<mapId>/enter` nel motore quest. Il contratto sostituisce il caso specifico per Brumalta e permette di registrare l’arrivo a Petalora nei contenuti, senza nuove condizioni per città nel controller. Le missioni prive di un evento corrispondente non vengono modificate.

I milestone di presentazione possono dichiarare `optional: true`: la selezione dell’obiettivo preferisce la prima tappa principale incompleta, poi quella facoltativa. `currentFlag` allinea il titolo compatto e la riga evidenziata nel diario. Il flag facoltativo non concede progressi e non modifica i prerequisiti delle mappe o delle quest.

Il profilo ambientale `petals` usa conteggio, palette e area del contratto mappe v2. La distribuzione è deterministica e cosmetica; la scena gestisce animazione e riduzione del movimento, mantenendo i target nel ciclo di distruzione della mappa. Gli alberi vengono adattati all’ingombro massimo 96×112 mantenendo il rapporto della sorgente.

### Visuali condizionali e medaglie multiple — contenuti 0.3.65

Gli oggetti Tiled possono dichiarare `visibleWhenFlag` (visuale/interazione presente solo dopo il flag) e `activatedFlag` (stato del canale d’irrigazione). Il renderer riceve i flag in sola lettura. Non aggiorna collisioni o quest: le basi solide restano nel layer collision e il flusso quest continua a usare i dialoghi a stadi. I riferimenti ai flag sono validati anche per gli oggetti decorativi.

`battleRequiredFlag` blocca le sfide; `battleLockedMessage` permette a ogni contenuto di spiegare il prerequisito, con fallback generico. Il motore di battaglia rimane indipendente da città e puzzle.

`createBadgeEmblem(badgeId)` risolve la variante grafica dal catalogo condiviso. Banner e medagliere passano l’ID effettivamente assegnato; il riepilogo del primo capitolo conserva Aurora come default. Il validatore rifiuta emblemi non implementati. Le ricompense del diario leggono i nomi dal catalogo, evitando nuove condizioni per ogni medaglia.

### Indicazioni mondo leggibili — contenuti 0.3.67

`WorldGuidance` presenta le etichette selezionate dai contenuti come testo DOM, proiettato in coordinate CSS dalla camera non ruotata dopo `postrender`. `placeGuidance` è una funzione pura: cerca uno spazio vicino al bersaglio visibile ed evita header, diario, notifiche, controlli e protagonista. Se non trova spazio, nasconde l’etichetta; il diario rimane accessibile. Il componente non modifica collisioni, target o flag. La scena lo pulisce allo shutdown e ne sospende la visibilità durante dialoghi, movimento, menu e battaglie. Le dimensioni DOMRect vengono lette esplicitamente, senza spread di proprietà ereditate.

### Viadotto e prima piazza di Vetracielo — contenuti 0.3.68

R05 e Vetracielo riusano scoperta delle mappe v2, collegamenti, incontri, servizi e quest per evento di arrivo. L’orientamento di Lea usa dialogo a stadi e motore quest idempotente; nessuna logica di città è aggiunta a WorldScene. `elevated-rail` rende soltanto il binario orizzontale cosmetico tramite geometrie condivise: le aree riservate e la base della stazione sono definite nel layer collision. La stazione usa `scenery-image` con asset trasparente registrato, mantenendo i terminali cure/bottega come interazioni autonome raggiungibili.


### Estensioni 0.3.70–0.3.71

`fixedDamage` e `statusAffectedByTypeImmunity` sono dati del catalogo condivisi da motore, AI e descrizioni/previsioni. Le console `rail-console` usano `activatedFlag` e prerequisiti dichiarativi, senza rami per città in WorldScene. L’artwork urbano ha manifest/importatore indipendente e verifica offline. I testi battaglia usano risoluzione 4 e font interi per evitare un secondo ricampionamento dei titoli; gli importatori evoluzioni/urbani conservano PNG sorgente e generano WebP lossless.


### Primo arrivo a Ferraluce — 0.3.73

R06 e Ferraluce usano il registro mappe automatico e quest dichiarative: nessun ramo per città o formula nuova in WorldScene. `paved-walkway` disegna strisce continue nel renderer con profondità fissa sotto gli elementi di scenario; resta solo presentazione, mentre Tiled definisce la collisione. `terrainBase` riusa il contratto esistente per il nuovo suolo chiaro. Lo schema quest richiede `requiresFlags` per riflettere il tipo TypeScript e impedire passi non validi prima del runtime. Il pianificatore dei soli test touch può evitare gli habitat facoltativi, senza cambiare il gioco o i tassi di incontro.

## Inizializzazione RNG — contenuti0.3.115

Solo una nuova avventura genera un seed uint32 tramite Web Crypto getRandomValues. Lo zero viene normalizzato al valore nonzero già usato dallo xorshift32. Il cursore vive in GameSave.rngState: incontri e lotte lo consumano secondo le proprie regole deterministiche; titolo/ripresa, reload e importazione non lo ripescano. Nessun cambio di schema o riscrittura del seed nei salvataggi esistenti.

I test unit e browser controllano esplicitamente la sorgente di entropia per verificare nuove partite distinte e ripresa invariata. Il driver naturale registra startingRngState e dichiara separatamente le continuazioni da backup guadagnati. Le prove storiche fino a0.3.114 partivano dal seed fisso1234567: non sono campioni casuali indipendenti.

## Recupero evoluzioni per livello — runtime131

`awardExperience` accoda anche un destinatario già alla soglia configurata; `finalizeLevelEvolutions` conserva il controllo di vittoria e HP. La coda resta transitoria, senza cambiare il save. `evolveAfterBattle` limita le mosse della nuova forma al livello corrente quando non si è verificato un nuovo level-up. Il rulesetv14 distingue esplicitamente la nuova semantica. [Contratto e verifiche](48_LEVEL_EVOLUTION_RECOVERY_v0.1.md).
