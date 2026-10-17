# Veloria — Battle engine e progressione (decision log v0.3)

## 1. Obiettivo

Mantenere il ritmo di Oro/Argento con comandi moderni e bilanciamento adatto a 4 starter. Le meccaniche precise devono essere **versionate** e formalizzate, perché PokéAPI contiene dati di generazioni molto diverse e non determina da sola quale versione delle regole usare.

## 2. Regole base confermate

- Battaglia uno contro uno, a turni; max 6 Pokémon in squadra, 4 mosse per individuo.
- Tipi iniziali: 17 delle prime due generazioni; includono Buio e Acciaio, escludono Folletto.
- Possibilità di scegliere attacco, strumento, cambio Pokémon o fuga (ove consentita).
- Priorità delle mosse, velocità, HP/PP, efficacia di tipo, mosse di stato, esperienza e evoluzioni.
- Combattimenti allenatore distinti da incontri selvatici; cattura solo dove regole lo permettono.
- Seed pseudo-casuale in test; log deterministico delle mosse/effetti per replay.

## 3. Scelte di design aperte, NON ancora approvate

| Area | Alternativa A | Alternativa B | Proposta |
|---|---|---|---|
| Fisico/speciale | Per tipo come generazione 2 | **Per singola mossa** (modernizzato) | B: favorisce bilanciamento e comprensione; esplicitarlo nel GDD |
| Statistiche | Formula/stats classic Gen II | Stat moderne normalizzate | B per gestione semplificata con dati PokéAPI; calibrare su 4 starter |
| Natura/abilità | Introdotte | Escluse | Escluse MVP; nessun effetto mascherato da PokéAPI |
| Metodi evoluzione trade-only | Scambio necessario | Quest/oggetti alternativi | B: 251 ottenibili in single player |
| Esperienza | Scala classica | Curva lievemente modernizzata | Da prototipare con leader lv target |
| Split generazioni mosse | Learnset storico | Learnset curato per Veloria | Mix controllato: dati origine + override espliciti |

**Nota di coerenza:** l'originale Gen II lega fisico/speciale al tipo; un ruleset moderno per mossa è una modifica consapevole e non va presentato come emulazione fedele.

## 4. Risoluzione turno (ordine suggerito)

1. Valida comando e precondizioni (PP, item, bersaglio, condizioni fuga).
2. Determina ordine per priorità, eventuali modificatori e velocità; pareggio da RNG.
3. Per ogni attore ancora attivo: verifica status/impossibilità, consumo PP, accuratezza, determinazione del danno/effetto e applicazione eventi.
4. Controlla KO, richiesta cambio forzato, sconfitta/vittoria, ricompense XP, oggetti, denaro, flag trainer.
5. Emissione eventi semantici (`moveUsed`, `damageApplied`, `statusApplied`, `creatureFainted`, `battleEnded`) per animazioni.

Non codificare un'animazione prima che l'evento del core sia già stato determinato. Le animazioni possono essere interrotte senza alterare lo stato di battaglia.

## 5. Piano test minimi

- Danno mai negativo, HP sempre `0..maxHp`, PP mai negativi, efficienza tipo effettiva anche su doppio tipo.
- Immunità tipo rispettate; status hanno durata/effetti coerenti e turn ordering documentato.
- Vittoria/KO, fallimento cattura e fuga non producono duplicazioni.
- Cambio Pokémon forzato valido con alleato disponibile, game over se nessuno disponibile.
- Resistenza critici/accuracy verificati su RNG seedabile.
- Evoluzione si attiva **solo** se target species è supportata e asset/data sono presenti; per non spezzare il gameplay, progettare le forme evolute richieste dal livello realistico dell'MVP o ampliare l'elenco di specie implementate. Non introdurre un cap nascosto del livello.

## 6. Starter/Palestra primo atto

Quattro starter lv5; palestra di Mira tipo Normale. Evitare che un solo starter disponga dell'unica contromisura per la sfida. Usare una squadra leader di 2 Pokémon con livello target calibrato dopo playtest: definire species/skills e difficoltà **solo dopo** il prototipo del battle engine. `content/examples/gym01_mira.trainer.json` è quindi un esempio tecnico, non la squadra canonica definitiva.

## 7. Progressione e scala futura

- Livello massimo iniziale **100**, soglia configurabile (estenderla oltre 100 richiede formule e bilanciamento dedicati).
- ID numerico nazionale per specie e UUID per istanze; XP accumulata/curva per specie, statistiche ricalcolate da parametri originali persistenti.
- Acquisizione ed evoluzione in single player anche per linee storicamente legate a trade/eventi: sostituire con percorsi/oggetti/missioni locali.
- L'innesto della terza generazione aumenta il totale teorico a 386 specie, **ma** va pianificata la compatibilità di tipi, mosse, ability/rules, asset e progressione.

## 8. Ottimizzazione del lavoro

Prima implementare un battle core testabile con due creature fittizie originali e tre mosse base; poi importare dati Pokémon; soltanto dopo aggiungere UI/belle animazioni e asset definitivi. Questo riduce il rischio di bug non riconducibili alla grafica.

## 9. Prototipo stadi delle statistiche — 17/10/2026

Ruleset tecnico `veloria-battle-prototype-v2`: Growl riduce l'Attacco avversario di uno stadio, Tail Whip riduce la Difesa avversaria di uno, Defense Curl aumenta la propria Difesa di uno. Gli effetti sono dati in `statChanges`, senza confronti con il nome della mossa nel motore.

Cinque statistiche supportate: Attacco, Difesa, Attacco speciale, Difesa speciale e Velocità. Limiti -6/+6; moltiplicatore (2+n)/2 per n positivo o nullo, 2/(2-n) per n negativo, valore derivato arrotondato per difetto e minimo 1. Le statistiche base restano immutate. Il rallentamento da paralisi e la penalità fisica da scottatura si applicano dopo lo stadio. L'ordine usa la velocità all'inizio del turno.

Il consumo PP e l'accuratezza precedono gli effetti; al limite si consuma comunque il turno e si emette un messaggio esplicito. Gli stadi si azzerano al cambio (uscente ed entrante), alla cattura e alla creazione di una battaglia. Non entrano nel salvataggio del mondo. Eventi semantici `statStageChanged` e `statStageLimited` guidano i messaggi UI.

Restano fuori da questo prototipo accuratezza/elusione, probabilità secondaria di variazione e regole storiche con cui i critici ignorano determinati stadi. I critici usano attualmente le statistiche modificate e il moltiplicatore del ruleset: scelta esplicita di prototipo, non emulazione canonica.

## 10. Efficacie e avversari del prototipo v3 — 17/10/2026

Il runtime usa ora `veloria-battle-prototype-v3`. La matrice completa di 17 tipi in `content/battle/type-chart.v1.json` adotta i rapporti delle generazioni II–V: inclusi Buio/Acciaio, escluso Folletto. Fonte di import: CSV primari del progetto [PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), con URL, SHA-256 e data nel JSON. Sono applicati i soli rapporti storici con generation_id=5 (Spettro e Buio contro Acciaio a 0,5), non le differenze della prima generazione. I doppi tipi moltiplicano entrambi i fattori; un'immunità mantiene zero. Nessuna richiesta di rete durante il gioco.

Questa scelta versiona il prototipo coerentemente con i 17 tipi previsti. Restano provvisori lo split per mossa, le statistiche, i critici e le immunità agli status: la matrice riguarda il danno, non implementa tutte le regole canoniche.

La scelta avversaria è pura in `core/battle/opponent-policy.ts`; i profili sono in `content/battle/opponent-policies.v1.json`. Allenatori collegati tramite aiProfileId; selvatici tramite profilo wild. Il ranking degli attacchi considera potenza, precisione, statistiche effettive, STAB, efficacia e scottatura: è una funzione di utilità, non una previsione esatta dei danni. Gli effetti di preparazione sono scelti solo se utili, con cadenza per turno e soglia di stadio configurabili. Un avversario con sole mosse speciali non induce un inutile aumento di Difesa fisica.

Le politiche best scelgono il miglior attacco stimato; cycle alterna gli attacchi utilizzabili e non immuni. Le riserve entrano dopo KO o esaurimento PP dell'attivo. Il selettore non modifica lo stato, non consuma RNG e non riceve il comando scelto dal giocatore. Non usa ancora strumenti né cambi tattici; il caso senza PP in tutta la squadra richiede ancora una mossa di emergenza prima di considerare completa la gestione delle battaglie lunghe.

## 11. Esaurimento PP e contraccolpo — prototipo v4, 17/10/2026

Quando l'attivo non ha alcuna mossa conosciuta con PP disponibili, LOTTA offre Scontro d’emergenza. Il comando semantico `struggle` viene rifiutato se esiste ancora una mossa utilizzabile. Non occupa uno slot, non ripristina PP e non viene aggiunto al catalogo delle mosse apprese o al salvataggio. Funziona anche con una lista mosse vuota.

Scelta esplicita del ruleset `veloria-battle-prototype-v4`: potenza 50, priorità 0, precisione 100, attacco fisico con stadi/scottatura applicati; rapporto di tipo neutro e nessuno STAB. Contraccolpo dopo il colpo: ceil(maxHp/4), minimo 1 e HP mai sotto zero. Il contraccolpo avviene anche se il bersaglio va KO; entrambi KO senza riserve produce pareggio, senza XP al vincitore già esausto. I parametri sono nel ruleset e non costituiscono una promessa di emulazione canonica.

Sonno, paralisi e congelamento continuano a condizionare la possibilità di agire: un'azione impedita non causa contraccolpo. Il recupero di sonno/congelamento viene mantenuto nel nuovo snapshot, evitando il ripristino dello status precedente dopo il consumo PP.

L'avversario senza PP cambia soltanto se ha una riserva cosciente con mosse disponibili. Se tutte le riserve sono esauste, usa l'emergenza senza rimbalzare fra cambi inutili. Eventi `recoilApplied` governano messaggio, HP e animazione.

Dopo un pareggio con tutta la squadra KO si applica lo stesso soccorso del prototipo usato dopo una sconfitta: cura completa, nessuna medaglia o ricompensa allenatore, ritorno all’esplorazione.
