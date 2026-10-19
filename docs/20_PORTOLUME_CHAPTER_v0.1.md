# Costa delle Turbine e Portolume — contratto di implementazione

**Stato: basi di dominio implementate in 0.3.83; collegamento al mondo, mappe, contenuti e UI del capitolo non ancora implementati.** Fonti: GDD, documento 02 e roadmap 08. Il capitolo segue l'indagine della Centrale e porta alla quinta palestra; non conclude la regione.

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
- Cache ufficiale preparata per Tentacool #72, Krabby #98, Chinchou #170 e Lanturn #171: risorse `pokemon` e `pokemon-species` da `https://pokeapi.co/api/v2/`, conservate sotto `content/sources/pokeapi/`. Non sono ancora registrati nel roster runtime. Learnset HGSS da usare per la scelta delle mosse; nessuna mossa assegnata per somiglianza di tipo.

Queste basi non costituiscono ancora pesca o navigazione giocabili. Mancano postazioni, equipaggiamento ottenibile, menu, animazioni, reti/spawn del capitolo, nuovo catalogo/artwork, mappe e percorso fino alla medaglia. Esiti delle prove in `CI_STATUS.md`.

## Gate di consegna

1. Catalogo e learnset verificati sulle fonti locali, senza attribuire mosse per analogia di tipo.
2. Traversata, servizi, equipaggiamento, pesca, barca, puzzle e quinta medaglia integrati; stato e premi persistenti e non duplicabili.
3. Azioni fuori ordine spiegate, senza avanzamento; uscite di ritorno sempre disponibili e spawn fuori dagli ostacoli.
4. Validazione di mappe/asset/dati; prove dei nuovi meccanismi, percorso touch portrait/landscape e primo accesso offline.
5. Ispezione delle illustrazioni nel gioco; separare checkpoint di integrazione e bilanciamento naturale con tutti gli starter.

R09–R16, P6–P8, città complete, altri dungeon, Lega ed epilogo restano nel perimetro complessivo da realizzare. Questa pianificazione non ne costituisce implementazione o verifica.
