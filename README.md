# VELORIA — Project Design & Development Pack (v0.3)

**Data:** 17 ottobre 2026 · **Stato:** vertical slice giocabile in prototipo · **Piattaforma:** PWA mobile-first (iPhone/Android), Phaser 3, TypeScript, Vite · **Gioco:** RPG 2D di esplorazione e cattura, regione originale.

Questo archivio contiene la documentazione di progetto e l'implementazione progressiva del vertical slice. Il codice attuale include mappe Tiled giocabili per Borgofonte, Sentiero dell'Alba, Bosco dei Veli, Brumalta e la prima Palestra; il catalogo e il bilanciamento delle creature restano dati prototipo. `content/examples` conserva esempi per validazione e non definisce il bilanciamento canonico.

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
| `assets/ASSET_REGISTER.csv` | Provenienza, licenza e permesso per ogni media pubblicato |
| `assets/DEPENDENCY_LICENSES.csv` | Inventario versionato delle licenze npm rispetto al lockfile |
| `specs/schemas/` | Esempi di contratti JSON versione 1 |
| `content/manifest.json` | Versione dei contenuti usata dai nuovi salvataggi e dal bundle offline |
| `content/examples/` | Esempi validi di mappe, quest, incontri e progressione |
| `tools/validate_examples.py` | Validazione locale di schemi MapDefinition, mappe, contenuti, asset e registro media |
| `tools/scaffold_map.py` | Genera uno scheletro isolato MapDefinition v2 + Tiled per avviare una nuova mappa |

## Continuare lo sviluppo

Il repository e il vertical slice sono già avviati. Per aggiungere zone e sistemi, seguire i contratti in `docs/04_...` e `docs/07_...`: creare metadata `MapDefinition` v2 e mappa Tiled separati, registrare gli asset, aggiornare il manifest e il changelog contenuti, poi verificare schema, connessioni, collisioni, cache offline e salvataggi. Le regole ancora provvisorie restano esplicite in `docs/06_...`; non promuovere contenuti o bilanciamento a definitivi senza review.

## Stato dell'implementazione

**Tema per bambini 0.3.18:** interfaccia chiara azzurro/crema con pulsanti corallo, lilla e blu, dialoghi più grandi, diario luminoso e comandi di battaglia distinti. I colori condivisi dell'interfaccia sono in `src/ui-theme.css`. Per controllare GitHub Actions dal PC: `powershell -File tools/check_github.ps1 -UseStoredLogin`; dettagli in `docs/CI_STATUS.md`.

**Aggiornamento visivo 0.3.17:** protagonista con camminata a 16 frame, diario con obiettivi/ricompense reali e battaglia con feedback degli eventi, HP animati e XP. Otto specie hanno nuove illustrazioni; le altre dodici, inclusi gli starter, sono ancora da completare perché le relative tavole sono state rifiutate dal generatore. Le immagini disponibili e i prompt sono registrati in `assets/prompts/character-modernization-v1.md`. Il bilanciamento e alcune mosse di stato restano prototipali; l’ammodernamento non è dichiarato concluso.

Il percorso giocabile va dalla scelta dello starter alla Medaglia Aurora; dopo la vittoria su Mira si apre anche il tratto aggiuntivo Brumalta → Terrazze del Muschio (R03) → Radicelmo, con la missione dell'archivio dei semi. Il percorso comprende incontri giorno/notte, battaglie e cattura, missione di Ada, cure e negozio a Brumalta, sigilli sequenziali della Palestra, box party, IndexedDB e backup JSON. Le decisioni di progressione e bilanciamento non ancora fissate restano prototipali. La QA su dispositivi fisici e la revisione finale degli asset restano gate manuali.

## Convenzioni

- `SPEC` = decisione di progetto; `PROPOSTA` = modificabile tramite review; `TODO` = implementazione mancante.
- Le mappe illustrate non sono tilemap e i nomi di fantasia restano provvisori se non ancora approvati.
- Il numero 20 dell'MVP indica una **selezione iniziale di 20 specie di partenza/incontro**. Le forme evolute non già presenti nell'elenco vanno esplicitamente aggiunte al runtime se diventano ottenibili durante l'MVP, invece di introdurre evoluzioni volutamente spezzate. Il conteggio finale degli sprite MVP va pertanto confermato con il level design.

## Avvio del prototipo

Il primo prototipo esplorabile si avvia in locale con Node.js:

```sh
npm install
npm run dev -- --host 0.0.0.0
```

Per testare dal telefono, eseguire `npm run dev:lan`, collegare il telefono alla stessa rete Wi-Fi e aprire l'indirizzo `Network` mostrato da Vite (porta `5174`). In sviluppo appare il selettore **Mappa di prova** sopra l'area di gioco: scegli una mappa registrata per aprirla subito. La preview usa una squadra temporanea, salta il salvataggio della partita e mostra un avviso; **Partita normale** torna al salvataggio reale. Vite abilita l'hot reload, quindi le modifiche al codice si aggiornano nel browser mentre il server resta attivo. **WASD** o le frecce muovono il personaggio, **E** o **Spazio** interagiscono, **M** salva nella partita normale. Sul telefono, usare la croce direzionale e i pulsanti A/B/S. La partita viene conservata in IndexedDB. `npm run build` compila TypeScript e genera la PWA in `dist/`; la modalità LAN HTTP serve al test live, mentre installazione e service worker PWA richiedono localhost o un'origine HTTPS.

La storia normale inizia a Borgofonte. Cammina fino alla porta sul lato sud del laboratorio ed entra: Elia si trova all'interno. Parla con lei usando A (E/Spazio sulla tastiera), scegli uno dei quattro starter, poi parlale di nuovo per ricevere le rilevazioni da portare ad Ada. Gli incontri selvatici si attivano nell'erba alta dei percorsi. A Borgofonte sono visitabili la casa e il laboratorio: cammina sulla soglia per entrare o uscire; il letto cura la squadra e gli appunti si leggono con A. Il Centro Pokémon di Brumalta offre ancora i servizi dall'esterno, mentre la Palestra è un'area separata raggiunta dalla porta.

`npm test` esegue i test del core, dei servizi, dei contenuti, del movimento e della persistenza. I test degli strumenti di validazione mappe e asset si eseguono con `python -m unittest discover -s tests -p "test_*.py"`; il validatore completo dei contenuti si avvia con `python tools/validate_examples.py`. Dopo aver aggiornato `package-lock.json`, rigenera l’inventario licenze con `python tools/sync_dependency_licenses.py`. `npm run test:e2e` avvia Vite e Chrome mobile per i flussi browser E2E, esclusa la prova offline. `npm run test:e2e:offline` compila la build di produzione, avvia Vite Preview e verifica cache del service worker e movimento con rete simulata assente (perimetro desktop Chromium; non sostituisce il test E2E-06 su iPhone reale). Se Playwright non trova Chrome installato, esegui una volta `npx playwright install chromium`.

La workflow [Verify](.github/workflows/verify.yml) esegue su ogni pull request e push su `main` build/typecheck, test unitari e persistenza, validazione dei contenuti, E2E browser online e test PWA offline. Il playtest su iPhone reale resta un controllo manuale richiesto prima del rilascio.
