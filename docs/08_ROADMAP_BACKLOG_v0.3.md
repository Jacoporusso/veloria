# Veloria — Roadmap e backlog operativo (v0.3)

## 1. Milestone: ordine e gate, non stime

| Milestone | Obiettivo | Gate |
|---|---|---|
| **S0** — Foundation | Repo, Vite+Phaser, touch, mappa placeholder, collisioni e camera | Su iPhone il personaggio si muove e non attraversa ostacoli |
| **S1** — World slice | Borgofonte + R01, passaggi, NPC e dialoghi | Percorso attraversabile e reload mantiene la posizione |
| **S2** — Battle core | Creature placeholder, mosse, RNG, KO, XP, UI minima | Test unit e battle simulator riproducibile |
| **S3** — Creature & encounters | 4 starter, 20 specie target, erba, capture, party/storage | Incontri/cattura/exp funzionanti senza chiamate HTTP |
| **S4** — Story slice | Bosco, missione Ada, Brumalta, cura e negozio | Giocabile fino alla Palestra |
| **S5** — Gym + save/offline | Mira, prima medaglia, IndexedDB, export/import, PWA offline | E2E-01..08 superati |
| **S6** — Polish | Arte originale, audio autorizzato, animazioni, QA mobile | UX verificata su hardware reale e asset audit superato |

Il rilascio MVP si intende concluso con S6. Le fasi possono essere sovrapposte solo se non compromettono i test e gli ownership boundary.

## 2. Epiche e user stories principali

### EPIC A — Foundation e movement

- **US-A01 (P0):** Come giocatore, apro la PWA in portrait senza zoom o scorrimento della pagina.
- **US-A02 (P0):** Posso muovermi in 4 direzioni da tastiera e con D-pad touch; input responsivo e collisioni coerenti.
- **US-A03 (P0):** Passo da una mappa all'altra tramite spawn ID, con camera e preload degli asset necessari.
- **US-A04 (P1):** Posso cambiare qualità animazioni e mutare audio.

### EPIC B — Narrative

- **US-B01 (P0):** Dialogo con la prof.ssa Elia; ottengo uno e uno solo dei 4 starter.
- **US-B02 (P0):** Parlo con NPC, vedo testo paginato, scelgo opzioni e sblocco eventi; accetto o rinvio esplicitamente le sfide degli allenatori.
- **US-B03 (P0):** Completo mini quest di Ada con stato persistente e ricompensa senza duplicazione.

### EPIC C — Creatures & battle

- **US-C01 (P0):** Incontri nell'erba per area/time band, con seed controllabile nei test.
- **US-C02 (P0):** Core turn-based senza dipendenze Phaser, mosse/PP/status/danni/KO.
- **US-C03 (P0):** Catturo e deposito, aggiungo al party fino a cap 6.
- **US-C04 (P0):** XP e progressione; implemento evoluzioni raggiungibili nel vertical slice.
- **US-C05 (P0):** Affronto allenatori e capopalestra senza cattura/fuga abusive.

### EPIC D — Persistenza/PWA

- **US-D01 (P0):** Save/autosave IndexedDB, checksum, slot backup e versioning.
- **US-D02 (P0):** Import/export JSON validato e rollback su errori.
- **US-D03 (P0):** PWA installabile, interamente offline per i pack MVP dichiarati disponibili.
- **US-D04 (P1):** UI di aggiornamento e compatibilità dei vecchi save.

### EPIC E — Art/QA

- **US-E01 (P0):** Primo tileset originale base di Borgofonte, con collisioni e layer overhead.
- **US-E02 (P1):** Boschi stratificati, animazioni erba, acqua e luce riducibili su mobile.
- **US-E03 (P0):** UI battaglia leggibile senza dover zoomare; safe-area test.
- **US-E04 (P0):** Documentare proprietà/licenze di ogni asset e dipendenza.

## 3. Dipendenze critiche

```text
S0 renderer, input, camera
 ├─> S1 navigazione, NPC, passaggi
 ├─> S2 motore combattimento puro (indipendente dalla grafica)
 └─> S3 creature pipeline (dipende dal modello dati S2)
S1 + S3 -> S4
S2 + S3 + S4 -> S5
S5 -> S6
```

## 4. Definition of Ready (per ogni storia)

- Behaviour osservabile e scenario testato; mapId/IDs e precondizioni definiti.
- In/out of scope, UX/asset requirements e states di errore dichiarati.
- Dipendenze da API e licenze identificate; nessuna ambiguità su asset e regole.
- Test di accettazione specifico; non introdurre una feature se non è misurabile.

## 5. Definition of Done

- Build/lint/typecheck/test automatici verdi.
- Check integrazione mobile, memory/perf e fallback offline pertinente.
- Save/load e vecchie migration testate se lo stato cambia.
- Dati e asset registrati; nessun asset protetto aggiunto inconsapevolmente.
- Human review: verifica UX, contenuti, regressioni e consegna; l'AI aiuta ma **non sostituisce** approvazione e playtest.

## 6. Sequenza della prima iterazione per Codex/Claude

1. Scaffolding `vite + typescript + phaser` e manifest PWA.
2. Una **sola** scena con terreno/ostacoli placeholder e D-pad touch.
3. Controller input disaccoppiato e camera follow.
4. Test automatizzato della funzione `canMove`/collisione.
5. Caricamento di un `MapDefinition` di esempio e transition tra due aree.
6. Screenshot mobile e review umana del ritmo, tile size e zoom.

**Non** partire da battle engine, 251 Pokémon, monorotaia e grandi città nello stesso sprint.

## 7. Espansione oltre MVP

**v0.5 (orientativa):** prime 4 Palestre, ~100 specie reperibili, viaggio a Vetracielo/Ferraluce. **v1.0:** 8 Palestre, 251 specie ottenibili, Lega e finale narrativo. **v2.0 opzionale:** seconda regione/postgame, fino a Gen III e oltre previa implementazione meccaniche. Queste sono **aspirazioni di contenuto**, non date garantite.
