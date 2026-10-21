## Tentennamento e ordine degli impedimenti — 0.3.93, ruleset v10

`flinchChance` proviene dai metadati ufficiali della mossa. Un colpo dannoso connesso può far tentennare soltanto un bersaglio vivo che deve ancora eseguire una mossa nello stesso turno. Il vincolo è locale al turno e non entra nel salvataggio. Strumenti e cambi non vengono annullati dal tentennamento; PP non consumati quando la mossa è impedita.

Ordine: sonno/gelo → tentennamento → confusione → paralisi → PP/mossa. Sonno e gelo avanzano anche quando il Pokémon tentenna; il tentennamento evita invece i controlli successivi di confusione e paralisi. Riferimenti primari: [condizioni GenIV di Pokémon Showdown](https://github.com/smogon/pokemon-showdown/blob/master/data/mods/gen4/conditions.ts) e [priorità delle condizioni condivise](https://github.com/smogon/pokemon-showdown/blob/master/data/conditions.ts). Durate, RNG e altre regole prototipali preesistenti non equivalgono a emulazione integrale HGSS; abilità non implementate. Regressioni seeded controllano cursore RNG, eventi, contatori e PP.

Importate sette mosse aggiuntive da fonti locali PokéAPI: Ira di Drago (40 danni fissi), Dragospiro, Dragopulsar, Dragodanza, Dragofuria, Idropompa e Idrondata. Le versioni HGSS usano Dragopulsar90 e Idropompa120 tramite `past_values`; non vengono applicati automaticamente i valori moderni. Tornado resta non supportata perché il suo effetto condizionale non è implementato. La selezione di un gruppo nell’importer aggiorna anche gli apprendimenti precedenti quando una mossa prima non supportata diventa disponibile.

> Decisione progetto 17/10/2026: la retrocompatibilità dei salvataggi del prototipo non è richiesta. Non aggiungere recuperi o migrazioni per conservare dati di cataloghi precedenti; i test di gioco usano dati correnti.

# Veloria — Battle engine e progressione (decision log v0.3)

## Ricompensa esperienza — contenuto 0.3.88, ruleset v8

L'esperienza base della specie viene ora scalata con il livello del Pokémon sconfitto: `base = max(1, floor(baseYield × livello / 7))`; nelle lotte allenatore `floor(base × 1.5)`. Una resa base nulla continua a non assegnare esperienza. I coefficienti sono espliciti in `BattleRules.experienceRewards`, la funzione è pura e gli eventi riportano la ricompensa effettiva, usata anche per livelli, mosse ed evoluzioni.

Riferimento dell'algoritmo classico consultato: [pret/pokeemerald, Cmd_getexp](https://github.com/pret/pokeemerald/blob/master/src/battle_script_commands.c), calcolo della resa per livello e bonus allenatore. Questo non dichiara un'emulazione integrale HGSS: rese base locali da PokéAPI, curve di crescita cubiche del prototipo, esperienza al destinatario del KO, senza ripartizione tra partecipanti, Condividi Esperienza, strumenti tenuti o bonus scambio. Le prove sintetiche di apprendimento/evoluzione usano avversari livello7 con rese artificiali per raggiungere esattamente le soglie desiderate; non sono esempi di bilanciamento naturale.

L'audit del capitolo Acquariva aveva rilevato ricompense costanti indipendenti dal livello, con centinaia di KO necessari per allenare un solo membro da28 a35. La correzione rimuove quel difetto; numero di allenatori intermedi e ritmo della crescita della squadra richiedono ancora revisione. Non si dichiara risolto il bilanciamento dall'esito dei soli checkpoint potenziati.

> Regola vigente dal contenuto 0.3.46: dati e apprendimenti delle mosse provengono da PokéAPI, gruppo HeartGold/SoulSilver. Le precedenti tarature manuali sono superate; gli effetti non ancora supportati restano esplicitamente incompleti.

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

## 12. Prime mosse apprese e calibrazione — prototipo v5

Il learnset locale `content/battle/level-up-moves.v1.json` è generato dai dati PokéAPI HeartGold/SoulSilver. Fra le mosse supportate: Bulbasaur apprende Frustata al 9, Charmander Braciere al 7, Squirtle Bolla al 7 e Pistolacqua al 13, Pikachu Attacco Rapido al 13. I livelli 6 uniformi del precedente prototipo sono rimossi.

Il core applica l’apprendimento quando i punti esperienza producono un livello. Le mosse già note mantengono i PP e non vengono duplicate. Gli slot liberi ricevono la nuova mossa e un evento moveLearned. Con quattro mosse, `moveLearningSkipped` apre una scelta touch e tastiera: sostituire uno slot (la nuova mossa parte con PP massimi) oppure conservare il moveset. Le transizioni pure `moveReplaced`/`moveLearningDeclined` non consumano turni; se la battaglia termina nello stesso turno, il completamento e il salvataggio attendono tutte le scelte in coda. Nessuna migrazione: vengono riusati gli slot attuali del save. Vecchi salvataggi sopra la soglia possono recuperare la mossa al prossimo aumento di livello.

Due partite naturali con Charmander hanno evidenziato l’assenza delle mosse apprese e una prima palestra eccessiva per una squadra arrivata senza grinding. Configurazione di prova: Sentret lv7 e Rattata lv8, un solo stadio di preparazione difensiva nel profilo gym_beginner. La validazione della taratura va riportata con gli esiti effettivi del playtest, non inferita dal solo cambiamento dei dati.

## 13. Ritmo e feedback dell'interfaccia di battaglia

Dopo la scelta del comando il turno si risolve senza un clic obbligatorio su «Continua»: i messaggi delle azioni avanzano automaticamente, mentre il comando A permette di saltarli. La schermata resta in attesa di conferma per l'esito finale e per le scelte che modificano la squadra (per esempio sostituire una mossa appena appresa). Le schede delle mosse mostrano tipo, categoria, potenza, precisione e PP con etichette esplicite; il vantaggio di tipo e l'esito del colpo sono feedback tattici, non una previsione esatta dei danni, che dipendono anche da statistiche, RNG e altri modificatori. Esperienza, avanzamento livello, evoluzioni e ricompense restano visibili come tappe di progressione.

## 14. Ruoli leggibili delle mosse — prototipo v6, 17/10/2026

La taratura manuale di questa sezione è superata dal catalogo importato: Azione ha potenza 35 e precisione 95, Graffio 40/100, Pistolacqua 40, Frustata 35 con 15 PP. Braciere ha probabilità di scottatura 10%, Tuonoshock paralisi 10%, Velenospina veleno 30%. Non si cambiano i dati per differenziare artificialmente mosse simili.

Le schede touch riportano anche la caratteristica tattica disponibile: status e probabilità, priorità, oppure statistica modificata. I valori di accuratezza e PP restano visibili. Ogni nuova mossa deve avere almeno una scelta riconoscibile rispetto agli attacchi diretti già presenti, usando proprietà dati supportate dal core.

I moveset dei nuovi Pokémon derivano dagli apprendimenti ufficiali supportati al loro livello. Il limite di quattro riguarda le mosse conosciute contemporaneamente, non il numero di apprendimenti nella vita del Pokémon. La UI propone sostituzione o rifiuto quando gli slot sono pieni; non elimina mosse in silenzio.

## 15. Frequenza incontri nel Bosco — prototipo contenuti 0.3.44

Il Bosco ha due aree di sottobosco dichiarate nel livello Tiled. Ogni passo su una casella interna effettua un tiro indipendente con probabilità 18%; un fallimento consuma un passo e aggiorna l'RNG persistito. Il numero di specie dipende dall'ora locale del dispositivo: mattino 5, giorno 7, notte 4 (14 distinte complessive, incluse quattro evoluzioni poco frequenti). Le percentuali e i pesi sono ancora prototipi da calibrare nel playtest; la zona deve essere attraversabile e riconoscibile nella mappa.


## 16. Import canonico delle mosse — contenuti 0.3.46

`tools/import_pokeapi_battle.py` genera catalogo e apprendimenti da risposte PokéAPI conservate con URL e SHA-256 in `content/sources/pokeapi/`. `--check` verifica offline che i dati generati siano identici; il validatore principale include questa verifica. Il gruppo HeartGold/SoulSilver evita di mescolare potenze e livelli di generazioni diverse. I nomi italiani provengono dalla stessa fonte.

Il sottoinsieme runtime conta 25 mosse; le liste complete delle 20 specie sono conservate nel report sorgente, che elenca anche le 154 voci di apprendimento con mosse ancora non implementate. Nessun effetto mancante riceve una simulazione sostitutiva. Assorbimento HP, effetti statistici probabilistici, attacchi multipli e confusione sono ora eseguiti dal core e presentati nella UI. I pesi 3/8,3/8,1/8,1/8 degli attacchi 2–5 colpi sono riportati nell’effetto API di Furia. La precisione nulla dell’API è normalizzata con `alwaysHits`, senza mostrare una percentuale inventata.

I vecchi salvataggi mantengono le mosse già registrate, anche se provenienti dal prototipo precedente: non sono automaticamente dichiarati canonici. I nuovi incontri e le nuove squadre allenatore rispettano specie e livello. Abilità, strumenti tenuti e numerose altre meccaniche restano incompleti: l’import verificato dei dati non equivale alla fedeltà integrale dell’intero simulatore.


## Precisione ed elusione — catalogo 0.3.49

Le due statistiche sono stadi volatili limitati a −6…+6, rimossi al cambio e non salvati. In Gen IV ogni stadio ha moltiplicatore `(3+s)/3` se positivo o `3/(3−s)` se negativo. La probabilità è precisione base × moltiplicatore precisione attaccante / moltiplicatore elusione bersaglio, limitata al 100%. Gli stadi si applicano separatamente, non sottraendoli prima del calcolo.

Riferimento di implementazione consultato: [Pokémon Showdown, algoritmo Gen IV hitStepAccuracy](https://github.com/smogon/pokemon-showdown/blob/master/data/mods/gen4/scripts.ts). Abilità, strumenti e condizioni di campo non sono ancora emulati. Le mosse API con precisione nulla mantengono il bypass; la mossa di emergenza non subisce questi modificatori.

Turbosabbia, Muro di Fumo e Profumino sono importate dagli snapshot PokéAPI; il testo effetto inglese di Profumino indica il decremento storico di uno stadio, mentre `stat_changes` espone il valore moderno −2. L’importatore verifica questa forma della fonte prima di convertirla.


## Parassiseme — catalogo 0.3.50

L’importatore riconosce `meta.ailment=leech-seed` e verifica il testo inglese della risposta API che specifica `1/8` degli HP massimi. L’effetto è volatile, distinto dagli stati principali: può coesistere con veleno o scottatura. Il drenaggio viene risolto prima dei danni residui di questi stati; fra bersagli seminati si segue la velocità effettiva. Se non c’è un alleato attivo vivo che possa ricevere energia, il drenaggio non viene applicato. Il campo conserva il lato che riceve energia, non l’identità dell’utilizzatore iniziale.

Il bersaglio Erba è immune, l’applicazione ripetuta non si somma, il cambio del bersaglio elimina il seme e quello dell’utilizzatore lascia il seme al suo posto. HP sottratti e cura sono limitati ai valori reali disponibili; un KO assegna XP una sola volta. Cattura e nuova battaglia eliminano il campo volatile.

Fonte dati: `content/sources/pokeapi/move-leech-seed.json`. Riferimento di comportamento: [Pokémon Showdown, condizione leechseed](https://github.com/smogon/pokemon-showdown/blob/master/data/moves.ts). Non sono implementati Melma, Rapigiro o Staffetta: non vengono aggiunti al catalogo come se i rispettivi effetti fossero disponibili.


## Preparazione della prima Palestra e immunità — 0.3.52/0.3.53

Il riepilogo prima della sfida e il diario derivano numero e livelli degli avversari dal contenuto allenatore. I consigli leggono la squadra e l’inventario senza assegnare progressi o bloccare la sfida: allenamento nelle foglie, compagno, cure gratuite al Centro e scorta di Pozioni. Mira introduce esplicitamente l’effetto di Colpocoda e Ruggito.

Il profilo `gym_beginner` ora dichiara `maxStatusUsesPerMove: 1`: i PP spesi permettono all’AI di riconoscere che la preparazione è già stata tentata. Quando è disponibile un attacco, l’AI non ripropone la mossa di supporto esaurita rispetto a questo limite; se una creatura avesse soltanto mosse di supporto, il fallback resta una mossa legale. Questa è una scelta di difficoltà di Veloria, non una modifica alle mosse ufficiali. Sera, Timo e Pokémon selvatici non ereditano il limite.

Le immunità agli stati di Gen IV sono applicate anche ai doppi tipi: Veleno e Acciaio contro avvelenamento, Fuoco contro scottatura, Ghiaccio contro congelamento. L’immunità Elettro alla paralisi e quella Erba alle polveri delle generazioni successive non vengono introdotte. Riferimenti: [tabella tipi del simulatore Pokémon Showdown](https://github.com/smogon/pokemon-showdown/blob/master/data/typechart.ts) e [override storico Gen V, ereditato da Gen IV](https://github.com/smogon/pokemon-showdown/blob/master/data/mods/gen5/typechart.ts).

Questa correzione non rende l’intero ruleset una riproduzione di HGSS: probabilità/moltiplicatori critici, velocità da paralisi, durate e danni residui conservano ancora semplificazioni prototipali documentate. I dati delle mosse continuano a provenire dagli snapshot PokéAPI.


## Cambio dopo KO — ruleset prototipo v7

Un cambio obbligato avviene fra i turni: il nuovo Pokémon non subisce un attacco gratuito, non consuma PP, non attiva veleno/scottatura/Parassiseme e non fa avanzare il PRNG o il contatore. Se anche l’avversario deve sostituire, le due entrate costituiscono la stessa fase. La scena manda automaticamente la riserva dell’allenatore dopo i messaggi di KO; il giocatore sceglie soltanto le proprie riserve. Un cambio volontario resta invece un’azione normale e permette all’avversario di attaccare.

La raccomandazione di allenamento confronta il livello più alto della squadra con quello dell’avversario più forte (Mira: 8). Rimane un consiglio: nessuna barriera di livello né assegnazione automatica di XP.

Riferimento consultato per distinguere sostituzioni obbligate e azioni del turno: [Pokémon Showdown, richieste forceSwitch e azioni instaswitch](https://github.com/smogon/pokemon-showdown/blob/master/sim/battle.ts). Le condizioni di ingresso come abilità, strumenti e trappole non sono ancora implementate nel prototipo.


## Previsione dei danni — contenuti 0.3.55

`core/battle/damage.ts` contiene la formula condivisa dal risolutore e dalla previsione UI. La previsione non usa il PRNG: calcola gli estremi della variabilità configurata, senza critici o effetti secondari, tenendo conto di categoria fisica/speciale, statistiche, stadi, scottatura, tipo e affinità. Il numero di colpi limita gli estremi per le mosse multiple; gli HP rimasti limitano il danno effettivo. È una stima condizionata al colpire: la precisione è visualizzata separatamente. Le mosse di supporto non ricevono stime di danno.

Esempio verificato: Squirtle lv8 contro Sentret lv7 con Difesa +1, Bolla produce 5–6 HP mentre Azione 4–5 HP nel ruleset corrente. Potenza 20 di Bolla e 35 di Azione restano i valori ufficiali HGSS importati. L’interfaccia rende questa differenza leggibile invece di suggerire che la potenza da sola equivalga al danno.

## Consultazione delle mosse — contenuti 0.3.57

In selezione mosse, Dettagli mosse / I apre un pannello consultabile senza comandi di battaglia, consumo PP o avanzamento del turno. Include anche slot senza PP. Espone bersaglio degli effetti, aumenti/riduzioni e gradi delle statistiche, probabilità, conseguenze degli stati, drenaggio, colpi multipli e priorità dai dati runtime. B/Escape/Chiudi ritorna alla scelta della mossa. La stessa descrizione è disponibile nelle schede Squadra/Pokédex, insieme al learnset HGSS supportato: gli apprendimenti non ancora implementati non vengono presentati come disponibili.

## Danno fisso e mosse urbane — contenuti 0.3.70

Il sottoinsieme passa a 44 mosse / 25 specie. Ferrostrido, Supersuono, Sonicboom, Tuononda, Scintilla e Stridio sono importati dai record PokéAPI locali. Numeri, nomi, probabilità e livelli HGSS sono riprodotti dall’importer; Tuononda mantiene precisione 100 dalla cronologia pre-Sun/Moon. Lo zero di `meta.ailment_chance` di una mossa di stato come Supersuono indica un effetto principale garantito se il controllo di precisione riesce, non assenza di confusione.

`fixedDamage` descrive Sonicboom: il valore 20 è estratto dal testo inglese della fonte. Un colpo riuscito ignora stadi, statistiche, scottatura, affinità, resistenze, critici e variabilità, ma rispetta le immunità; il danno effettivo è limitato agli HP rimasti. Il motore e la previsione usano lo stesso ramo e l’AI riconosce il danno anche con potenza 0. La UI mostra danno fisso e non promette bonus di tipo.

`statusAffectedByTypeImmunity` è un adattatore di regola selettivo per Tuononda: il bersaglio Terra non viene paralizzato. Non estende l’immunità di tipo a tutte le mosse di stato (ad esempio Ruggito su Spettro o Ferrostrido su Terra). Il testo PokéAPI memorizzato dice soltanto che la mossa paralizza: il controllo selettivo è stato verificato separatamente nel [codice sorgente primario del simulatore Showdown](https://github.com/smogon/pokemon-showdown/blob/master/data/moves.ts), voce thunderwave, `ignoreImmunity: false`, ereditata anche dal modulo Gen IV. Questo riferimento meccanico non sostituisce le risposte PokéAPI per valori e learnset.

Charge e Rollout richiedono ancora meccaniche aggiuntive e restano nel report delle mosse non implementate. Non sono aggiunte come attacchi generici. Restano le altre differenze dichiarate del ruleset prototipale v7, fra cui le regole degli stati e la curva XP; questa consegna non promuove il motore a emulazione HGSS completa.


## Evoluzioni dei sentieri — contenuti 0.3.72

Le regole runtime in `content/battle/progression.v1.json` includono ora Pidgey→Pidgeotto al 18, Rattata→Raticate al 20, Sentret→Furret al 15, Hoothoot→Noctowl al 20, Mareep→Flaaffy al 15 e Wooper→Quagsire al 20. Il validatore dell’importer confronta ogni arco con le condizioni ufficiali salvate in `content/battle/evolution-reference.v1.json`, tracciate dal manifest delle fonti.

Le sei forme sono importate nel catalogo con statistiche e tipi riferiti a HGSS e artwork locali lossless. Ereditano la curva XP provvisoria dal modello della forma iniziale, come gli import già presenti: non è una curva ufficiale. Le mosse restano il sottoinsieme supportato, senza introdurre valori sostitutivi per quelle mancanti. Nel motore corrente il controllo evolutivo avviene quando il Pokémon guadagna XP e raggiunge o supera la soglia: una forma già oltre soglia può quindi evolversi al successivo guadagno XP anche senza un ulteriore level-up, comportamento prototipale da rifinire.

Test di soglia e sotto soglia coprono tutte le nove evoluzioni starter/sentieri, conservazione identità/HP/PP e roundtrip del salvataggio. Le prove browser ripetono battaglia, evento unico, illustrazione nuova, IndexedDB/reload e scheda Squadra. Non equivalgono a un playtest di bilanciamento naturale.

## Forme finali e apprendimento — contenuti 0.3.89, ruleset v9

Ivysaur evolve in Venusaur al livello 32, Charmeleon in Charizard al 36, Wartortle in Blastoise al 36 e Flaaffy in Ampharos al 30. Condizioni, statistiche, tipi, nomi e learnset provengono dalle risposte PokéAPI locali; gli artwork del gruppo `starter-finals` seguono lo stesso caricamento e cache delle altre specie. Il sottoinsieme runtime raggiunge 52 specie e 57 mosse.

Sono supportate anche Attacco d’Ala (Volante, fisica, potenza 60, precisione 100, 35 PP), Idropulsar (Acqua, speciale, 60/100/20 PP, confusione al 20%), Tuonopugno (Elettro, fisica, 75/100/15 PP, paralisi al 10%) e Scarica (Elettro, speciale, 80/100/15 PP, paralisi al 30%). Il bersaglio multiplo di Scarica corrisponde al singolo avversario nel formato corrente 1 contro 1: non introduce battaglie multiple. Fonte dei parametri: record `move-*.json` conservati in `content/sources/pokeapi/` e relativi manifest. I livelli di apprendimento sono quelli HGSS importati, senza sostituzioni per le mosse non supportate.

Un guadagno XP propone soltanto gli apprendimenti dei livelli attraversati, compresi quelli della forma evoluta raggiunti con quel guadagno. Le mosse vecchie dimenticate non vengono riproposte a ogni livello. Charizard può quindi proporre Attacco d’Ala al 36 e Ampharos Tuonopugno al 30 durante la stessa ricompensa che li fa evolvere. Restano i limiti già dichiarati della curva provvisoria e del controllo evolutivo dopo l'assegnazione XP.

## Evoluzioni dei sentieri — contenuti 0.3.107

Abilitati Pidgeotto→Pidgeot36, Oddish→Gloom21, Poliwag→Poliwhirl25, Bellsprout→Weepinbell21, Voltorb→Electrode30 e Spinarak→Ariados22. Statistiche e learnset HGSS sono riproducibili dalle fonti locali; gli artwork hanno fonte e checksum registrati. Ogni target dispone di mosse supportate, senza abilitarne gli effetti mancanti. I precursori sono già incontrabili nelle tabelle esistenti.

L’evoluzione di livello viene risolta alla vittoria dopo un effettivo aumento di livello, solo per un Pokémon ancora in vita; la cerimonia viene presentata separatamente dal calcolo e dal salvataggio. Questo comportamento corrente sostituisce le note storiche sul controllo al semplice guadagno XP. Curve XP e bilanciamento restano provvisori. Scambi, amicizia e condizioni non implementate restano riferimenti informativi e non vengono convertiti in soglie inventate.
