# Costa delle Turbine e Portolume — contratto di implementazione

**Stato: integrazione locale 0.3.85, non pubblicata e non ancora verificata integralmente.** Tre mappe, dialoghi, canna, battello, servizi, diario e P5 sono ora collegati al runtime. Prima prova touch porto–osservatorio–porto e persistenza riuscita; mancano attraversamento completo da Ferraluce, pesca, lotta P5, offline e revisione visuale completa. Fonti: GDD, documento 02 e roadmap 08. Il capitolo segue l'indagine della Centrale e porta alla quinta palestra; non conclude la regione.

## Requisiti del capitolo

- **R08 Costa delle Turbine:** Ferraluce → Portolume, apertura sul mare, impianti eolici e habitat laterali. Andata e ritorno reali, senza incontri obbligati per ogni attraversamento.
- **Portolume:** porto, moli, skyline, giardini costieri, cure/deposito, rifornimenti e NPC. Identità 2D illustrata moderna, palette marina con rame, ciano e luce calda; comandi e UI esistenti in portrait e landscape.
- **Indagine:** confrontare dati della Centrale e osservazioni delle maree. Il dettaglio narrativo è originale di Veloria; non identifica automaticamente tutti i ricercatori come colpevoli né risolve già il mistero delle Vene.
- **Navigazione locale e pesca:** azioni effettive del giocatore, non sole etichette di tabelle. Tragitto in barca con arrivi validi; postazioni di pesca con equipaggiamento ottenibile e incontri da dati locali.
- **P5 Acqua:** puzzle delle chiuse/marea, capopalestra originale, squadra con mosse ufficiali supportate, feedback, emblema e premio unico persistente. Nessuna specie precisa obbligatoria per entrare.
- **Trasporti e orientamento:** Portolume entra nella rete delle città visitate; diario e atlante indicano dove andare, mantenendo percorribile la costa a piedi.

## Integrazione tecnica necessaria

| Sistema | Stato verificato | Intervento richiesto |
|---|---|---|
| Incontri | Tabelle pesate e fasce orarie; `fishing`/`surf` sono metodi nominali | Collegare la pesca a un'interazione esplicita con gestione RNG e salvataggio condivisa; non trasformare una zona attraversata a piedi in pesca |
| Acqua | Movimento terrestre; collisioni statiche e condizionali con `blocksUntilFlag` | Configurare chiuse e pontili nei dati; collegare il planner della barca a interazioni e spawn reali |
| Equipaggiamento | Inventario e oggetti da quest | Canna o permesso ottenibile una volta, visibile nello zaino, requisito spiegato sul posto |
| Specie | Squirtle, Wartortle, Poliwag, Wooper e Quagsire disponibili | Verificare/importare Tentacool, Krabby e Chinchou indicati dal documento 02; fonti PokéAPI conservate localmente, artwork e mosse registrati prima dell'uso |
| Ferraluce | Varco R07 sul bordo est y24–26, ascensore P4 e monorotaia funzionanti | Aggiungere una soglia distinta per R08 con approccio leggibile; nessun trigger sovrapposto o modifica involontaria degli accessi esistenti |

Scelta di progressione proposta per questa implementazione: accesso R08 dopo `q_centrale_report`. La soglia viene aperta soltanto insieme al capitolo giocabile. Coordinarne geometria e indicazioni con il Tiled reale; non assumere che esista già un'uscita libera. Le maree possono essere uno stato locale del puzzle: non è richiesto inventare un sistema meteorologico globale o una mossa Surf d'esplorazione.

## Basi implementate e fonti acquisite

- `src/core/encounters/fishing.ts`: controllo di postazione, equipaggiamento, flag e squadra disponibile; esito dell'abboccata e scelta di specie/livello usano il RNG persistente del gioco. Nessuna canna consumata.
- `src/core/world/local-ferry.ts`: reti locali dichiarative, rotte direzionali esplicite, approdi nella stessa mappa consentiti e requisiti ricontrollati all'imbarco. Nessuna moneta, inventario o RNG modificati dal planner.
- `src/core/world/map-collision.ts`: collisioni del renderer basate su dati, con apertura della sola impronta della chiusa e conservazione dei muri sovrapposti. Validazione Python contro flag di quest non dichiarati.
- Registrati Tentacool #72, Tentacruel #73, Krabby #98, Kingler #99, Chinchou #170 e Lanturn #171: dati e learnset HGSS da PokéAPI conservati sotto `content/sources/pokeapi/`, artwork nel gruppo `coast`, evoluzioni ai livelli 30, 28 e 27. Bollaraggio, Presa e Barriera importate dalle fonti locali; Barriera usa i 30 PP della versione HGSS. Queste specie attendono ancora gli habitat giocabili del capitolo.

Queste basi non costituiscono ancora pesca o navigazione giocabili. Mancano postazioni, equipaggiamento ottenibile, menu, animazioni, reti/spawn del capitolo, mappe e percorso fino alla medaglia. Esiti delle prove in `CI_STATUS.md`.

## Collegamento della pesca in lavorazione

Il WorldScene riconosce `kind=fishing-spot` e legge dal Tiled `encounterTableId`, `requiredItemId`, `biteChance` e l'eventuale `requiredFlag`. Il menu con icona propone il lancio o l'uscita; il lancio ricontrolla requisiti e squadra, conserva la canna e aggiorna il RNG anche senza abboccata. L'incontro avvia lo stesso costruttore di battaglia usato dagli habitat terrestri. Il validatore rifiuta tabelle di altre mappe o metodi, oggetti/flag inesistenti e probabilità non valide.

Build e tre test del validatore passati; regressione reale E2E-03 passata in 56 secondi con HP, PP e XP persistenti dopo la rifattorizzazione dell'avvio selvatico. Mancano ancora la prova touch di una postazione reale, la canna ottenibile e il feedback animato: il collegamento tecnico non prova una sessione di pesca completa.

Illustrazione della Costa generata e conservata con prompt/hash in `assets/prompts/r08-coast-v1.md`. Non è ancora uno sfondo runtime; la geometria Tiled deve essere adattata alla costa effettivamente disegnata.

La bozza R08 è stata riallineata: ingresso ovest y21–22, uscita est y10–11, belvedere (21,14), percorsi verso entrambi gli habitat verificati con BFS. Restano ispezione nel gioco e registrazione insieme al capitolo. Portolume ha ora una prima illustrazione originale (`assets/prompts/portolume-v1.md`), con centro, mercato, palestra e isola separata; la geometria della città deve ancora essere riallineata all'output. Le bozze sotto `.tmp/portolume-draft/` e `.tmp/portolume-city-draft/` non sono contenuti caricati dal gioco.

## Gate di consegna

### Collegamento traghetti in lavorazione

### Quinta palestra in lavorazione

Bozze di Nerea, puzzle e medaglia in `content/drafts/portolume/`: Tentacool 26, Krabby 27 e Lanturn 28, con tutte le mosse verificate contro il learnset HGSS locale al livello effettivo. Medaglia Marea, premio allenatore 1400 monete, feedback su Difesa/Difesa Speciale e doppio tipo di Lanturn. Nomi e dialoghi sono contenuti originali di questa implementazione.

La palestra illustrata ha tre terrazze, due ponti con paratoie e tre regolazioni successive: compensazione, apertura, stabilizzazione. Il renderer delle paratoie usa `activatedFlag`; collisioni e stato persistente usano i medesimi flag. Tre prove superate: legalità mosse, ordine/medaglia unica dopo serializzazione e raggiungibilità della prossima console con ritorno sud. Mancano ancora dialoghi integrati, emblema, percorso touch e bilanciamento naturale; il tema meteo indicato nel documento 02 non ha ancora un sistema di combattimento implementato.

`local-ferry-registry.ts` carica reti `content/transit/*.ferry.json`, verifica configurazione e duplicati. Il WorldScene legge `kind=local-ferry`, `networkId` e `stopId`, presenta un menu con icona battello e ricontrolla la rotta prima di usare la transizione mappe esistente. Il registro runtime è ancora vuoto: la rete porto–osservatorio resta sotto `content/drafts/portolume/`.

La bozza di quest consegna `old-rod` una sola volta dopo l'arrivo e l'orientamento, richiede la lettura delle maree prima del rapporto e non consuma RNG o monete. Build riuscita; cinque prove del nucleo traghetti e due prove sui dati effettivi della bozza superate. Mancano ancora oggetto nel catalogo runtime, dialoghi, interazioni collegate, feedback del viaggio e prova touch; questi esiti non provano una navigazione nel mondo completo.

1. Catalogo e learnset verificati sulle fonti locali, senza attribuire mosse per analogia di tipo.
2. Traversata, servizi, equipaggiamento, pesca, barca, puzzle e quinta medaglia integrati; stato e premi persistenti e non duplicabili.
3. Azioni fuori ordine spiegate, senza avanzamento; uscite di ritorno sempre disponibili e spawn fuori dagli ostacoli.
4. Validazione di mappe/asset/dati; prove dei nuovi meccanismi, percorso touch portrait/landscape e primo accesso offline.
5. Ispezione delle illustrazioni nel gioco; separare checkpoint di integrazione e bilanciamento naturale con tutti gli starter.

R09–R16, P6–P8, città complete, altri dungeon, Lega ed epilogo restano nel perimetro complessivo da realizzare. Questa pianificazione non ne costituisce implementazione o verifica.
