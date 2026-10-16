# Veloria — Playbook per Codex / Claude Code (v0.3)

## Scopo

Istruzioni da copiare nel repository quando inizieremo a costruire la PWA. Servono a orchestrare sviluppo incrementale con agenti e revisione umana. Questo ZIP è un **design pack**: le seguenti pseudo-command non sono già installate o eseguibili.

## 1. Regole condivise `AGENTS.md` / `CLAUDE.md` (bozza)

```md
# Veloria — Project Rules
- Tech: TypeScript, Phaser 3, Vite, PWA, IndexedDB. Target mobile portrait iPhone.
- Read docs/01, 02, 03, 04, 06, 07 before architectural changes.
- Keep battle rules pure: never place gameplay formulas in Phaser scenes.
- Create content as versioned data with stable IDs. Map metadata != Tiled tilemap.
- No runtime PokéAPI fetch: import/normalize/cache at build time only.
- Do not add Pokémon sprites, copyrighted music, ROM data or third-party assets without an explicit rights review.
- Every feature requires unit/integration tests and, if user-facing, a mobile review.
- Preserve save compatibility; add a migration before changing serialized data.
- Never claim completion without a runnable build + tests + evidence.
- Do not build out-of-scope towns or species unless approved in the roadmap.
- Stop and ask human approval at: ruleset choice, map art direction, new external asset, save migration, scope change.
```

## 2. Agenti di supporto (responsabilità)

| Agente | Input | Output | Controllo umano |
|---|---|---|---|
| `game-architect` | GDD, arch, milestone | ADR, boundary e interfacce | Approvazione nuovi layer/dipendenze |
| `world-builder` | world map, schemi | metadata mappe, Tiled JSON, spawns | Verifica giocabilità, leggibilità, collisioni |
| `battle-engineer` | ruleset, catalogo creature | pure TS rules, unit tests, logs | Approvazione formule/regole non canoniche |
| `content-curator` | PokéAPI raw, license register | JSON normalizzati e checks | Licenze, completezza, correttezza meccaniche |
| `pwa-mobile` | UX, device target | input, offline/update, save UI | Test iPhone real device e backup |
| `qa-reviewer` | user story + artefatti | diff review, QA checklist, E2E | Decisione di rilascio |

## 3. Comandi guidati suggeriti

Si possono implementare come slash commands del tool di coding preferito; i nomi sotto sono **specifiche**, non automazioni già attive.

- `/veloria:init` → legge docs, verifica toolchain, produce ADR e piano S0, senza implementare giochi completi.
- `/veloria:feature <US-ID>` → scopre dipendenze, crea task atomici, implementa feature, testa e produce report.
- `/veloria:import-pokemon --generation 1,2` → importa dati in cache locale, normalizza, valida, produce diff/manifest; non scarica sprite senza permesso.
- `/veloria:map <mapId>` → scaffold metadata + Tiled template + connessioni, esegue validazione e checklist UX.
- `/veloria:validate-content` → esegue JSON validation, references, assets presence, tests.
- `/veloria:review-mvp` → confronta stato repo con spec E2E-01..08, elenca gap e regression risk.

## 4. Prompt per avviare davvero la prima milestone

```text
Sei il lead engineer del progetto Veloria. Prima leggi README.md e docs/01, 02, 03, 04,
06, 07, 08, 09. Avvia esclusivamente la milestone S0 della roadmap.
Implementa uno scaffold mobile-first Vite + TypeScript + Phaser 3 con PWA,
BootScene e WorldScene, scena giocabile demo Borgofonte con asset originali
placeholder, controller touch/keyboard, movimento tile-based, collisioni,
camera follow e una simple UI. Non usare dati o asset Pokémon protetti.
Mantieni i sistemi indipendenti: una prima core interface di movement senza
Phaser, un adapter Phaser e un loader di MapDefinition.
Aggiungi test, documentazione avvio locale, checklist iPhone, e mostra risultati
esatti di build/test. Non implementare battaglie e non importare 251 specie.
Chiedi review umana prima di prendere decisioni irreversibili sul renderer o sulla UI.
```

## 5. Contratto output agente dopo ogni task

```text
Feature / scope: ...
Files changed: ...
Data contracts / migration impact: ...
Acceptance criteria status: ...
Tests run (commands + actual results): ...
Mobile/offline impact: ...
Known gaps & open questions: ...
Human approval requested: ...
```

## 6. Umano nel loop

Non automatizzare approvazione grafica, selezione delle creature e relative licenze, modifiche importanti al ruleset, modifiche permanenti del salvataggio, contenuti narrativi ad alta visibilità. Coding agents propongono e verificano; la direzione creativa e l'accettazione del lavoro restano umane.
