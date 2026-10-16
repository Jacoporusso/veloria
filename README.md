# VELORIA — Project Design & Development Pack (v0.3)

**Data:** 09 ottobre 2026 · **Stato:** concept + documentazione MVP · **Piattaforma:** PWA mobile-first (iPhone/Android), Phaser 3, TypeScript, Vite · **Gioco:** RPG 2D di esplorazione e cattura, regione originale.

Questo archivio raccoglie **tutti gli output di progettazione prodotti finora** più i documenti tecnici indispensabili per iniziare a sviluppare il vertical slice. Non contiene un gioco già implementato, sprite Pokémon pronti all'uso, una tilemap Tiled giocabile o codice applicativo completo. La cartella `content/examples` include **dati dimostrativi**: non rappresentano tutte le aree, né una definizione definitiva del bilanciamento.

## Decisioni confermate

- **Regione:** Veloria, originale; ambientazione mista **natura e tecnologia**.
- **Visual:** HD pixel art, ricca di vegetazione, illuminazione atmosferica e dettagli; qualità aspirazionale simile ai JRPG moderni come *Sea of Stars*, con asset originali.
- **Pokédex obiettivo:** prime due generazioni, **251 specie** (#001–#251). Il catalogo è un obiettivo dati, non 251 sprite già inclusi.
- **Starter:** Pikachu, Charmander, Squirtle, Bulbasaur (livello 5).
- **Struttura:** otto Palestre, 16 percorsi principali, biomi diversi, Lega e post-game futuro.
- **MVP:** Borgofonte → Sentiero dell'Alba → Bosco dei Veli → Brumalta, primo leader **Mira (Normale)**, circa 30–45 minuti di gioco progettati.
- **Tecnologia:** TypeScript, Phaser, Vite/PWA, mappe Tiled, IndexedDB, JSON locali generati/importati da PokéAPI.
- **Espandibilità:** mappe, Pokémon, missioni e regole versionati; salvataggi migrabili. Nuove generazioni comporteranno anche implementazione e QA di eventuali nuove meccaniche.
- **Target:** uso privato, non distribuito. Ciò **non elimina** i vincoli di proprietà intellettuale.

## Contenuto del pacchetto

| Percorso | Utilità |
|---|---|
| `docs/01_GDD_Veloria_v0.1.md` | Visione, protagonisti, gameplay, ambito e MVP originale |
| `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md` | Geografia, otto città, Palestre, 16 percorsi, dungeon, narrativa |
| `docs/03_MVP_FUNCTIONAL_SPEC_v0.3.md` | Funzionalità, flusso, criteri di accettazione |
| `docs/04_TECHNICAL_ARCHITECTURE_v0.3.md` | Architettura a moduli, stack, PWA, salvataggi, test |
| `docs/05_ART_DIRECTION_v0.3.md` | Direzione artistica, asset list, regole produttive |
| `docs/06_BATTLE_AND_PROGRESSION_RULES_v0.3.md` | Scelte sulle regole di battaglia, bilanciamento e trade-off |
| `docs/07_CONTENT_PIPELINE_AND_EXPANSION_v0.3.md` | PokéAPI, Tiled, pack contenuti, import e versioning |
| `docs/08_ROADMAP_BACKLOG_v0.3.md` | Epiche, storie, dipendenze, priorità e Definition of Done |
| `docs/09_AI_DEVELOPMENT_PLAYBOOK_v0.3.md` | Avvio operativo con Codex/Claude, agenti e prompt/command |
| `docs/10_LICENSES_AND_REFERENCES_v0.3.md` | Note legali, licenze asset e fonti tecniche |
| `docs/11_WORLD_MAP_ART_REVIEW_v0.3.md` | Cosa mostra la mappa, differenza fra concept e livello giocabile |
| `assets/concept/Veloria_World_Map_Concept_v0.1.png` | **Mappa illustrata approvata come direzione visiva** |
| `specs/schemas/` | Esempi di contratti JSON versione 1 |
| `content/examples/` | Esempi validi di mappe, quest, incontri e progressione |
| `tools/validate_examples.py` | Validazione locale senza dipendenze dei JSON d'esempio |

## Ordine di lavoro suggerito

1. **Leggere** `docs/01_...`, `docs/02_...` e `docs/03_...` per scope e gameplay.
2. **Decidere e fissare** i punti aperti in `docs/06_...` prima di implementare il battle engine.
3. **Creare il repository** `veloria` seguendo `docs/04_...`; usare `docs/09_...` come contratto per agenti di coding.
4. **Realizzare il micro-prototipo** con placeholder originali, senza alcun asset Pokémon protetto incorporato di default.
5. **Convertire** i JSON di esempio nelle prime mappe Tiled, perfezionando misure e collisioni su iPhone.
6. **Integrare in seguito** dati Pokémon importati in locale con controllo della provenienza e dei diritti d'uso di ogni asset.

## Prossimo passo concreto

**Vertical slice tecnica S0:** aprire sul telefono una PWA installabile con movimento in quattro direzioni, input touch, camera, collisione e una mappa prototipo di Borgofonte; test offline, poi implementare prologo e combattimento. Non costruire contemporaneamente otto Palestre.

## Convenzioni

- `SPEC` = decisione di progetto; `PROPOSTA` = modificabile tramite review; `TODO` = implementazione mancante.
- Le mappe illustrate non sono tilemap e i nomi di fantasia restano provvisori se non ancora approvati.
- Il numero 20 dell'MVP indica una **selezione iniziale di 20 specie di partenza/incontro**. Le forme evolute non già presenti nell'elenco vanno esplicitamente aggiunte al runtime se diventano ottenibili durante l'MVP, invece di introdurre evoluzioni volutamente spezzate. Il conteggio finale degli sprite MVP va pertanto confermato con il level design.
