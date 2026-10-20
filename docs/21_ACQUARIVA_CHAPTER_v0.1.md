# Dune, Delta e Acquariva — contratto del capitolo

Stato: integrato localmente nella versione 0.3.88, verifiche locali passate; pubblicazione da verificare. Fonte principale: documento 02, sezioni 3–8. Il capitolo prosegue da Portolume alla sesta medaglia, senza concludere la regione. Le sezioni di preparazione qui sotto conservano i checkpoint precedenti; per lo stato attuale valgono questa nota e `docs/CI_STATUS.md`.

## Integrazione locale

Le sei mappe sono nei registri runtime, con cinque quest, allenatore Selene, dialoghi, mercato, cure, fermata ferroviaria, atlante e diario. Lina, Teo e Maya propongono tre sfide facoltative lungo il percorso; banner e premi sono persistenti e unici. La Medaglia Riflesso ha un emblema SVG originale condiviso tra banner e raccolta. Gli accessi dalle città richiedono rispettivamente Marea e Riflesso; i ritorni dalle nuove zone rimangono aperti. Acquariva non è selezionabile in monorotaia prima della prima visita. Fonti PNG conservate, sei WebP lossless registrati e precaricati nella cache v109.

Validatore e build riusciti: 30 mappe, 29 quest, 13 allenatori e 7 negozi. Le prove di dominio del capitolo leggono i file effettivi del runtime e verificano gli ingombri reali dei personaggi; 355 prove di dominio/persistenza e 49 Python passate. Sette prove touch verificano traversate/ritorni, ricerca, premi unici, puzzle in ordine diverso con reload, battaglia, cambio dopo KO, medaglia, sfide intermedie e denaro persistenti. Osservatorio e palestra esaminati in portrait/landscape; fermata ferroviaria verificata a DPR3 anche dopo reload. Primo accesso offline alle sei mappe/immagini e ritorno via cascate passati sulla build finale. La squadra della prova P6 è un checkpoint potenziato: bilanciamento naturale e lotta P6 offline non sono dimostrati da queste verifiche.

## Contenuti richiesti

- R09 Dune Salmastre: uscita da Portolume dopo P5, passeggiata costiera verso D04, habitat laterali leggibili, ritorno sempre disponibile.
- D04 Delta degli Specchi: canali, diversità acquatica e osservazioni sull'ecosistema; attraversamento tramite pontili e collegamenti locali dichiarati. Nessuna mossa inventata per attraversare l'acqua.
- R10 Sentiero delle Canne: labirinto leggero con punti di riferimento, collegamento Delta–Acquariva e habitat opzionali.
- Acquariva: lago, canneti, quartieri su pontili, osservatorio, servizi e indicazioni verso P6. Confrontare osservazioni del lago con quelle del porto senza presentarle già come prova conclusiva della causa.
- P6 Psico: puzzle di specchi, contromosse e status; capopalestra e medaglia originali, squadra e mosse da fonti ufficiali locali, feedback e premio unico persistente.
- R11 Via delle Cascate: collegamento percorribile Acquariva–Vetracielo, distinto dalla monorotaia. Verificare entrambi gli accessi, requisiti e ritorno. Il passaggio tardivo aggiuntivo Brumalta–Acquariva resta nel perimetro regionale e non va dichiarato implementato da questa sola scorciatoia.

## Implementazione iniziata

P6 preparata in bozza: Selene schiera Hypno 35, Slowbro 37 ed Espeon 38; dodici mosse verificate sui learnset HGSS. Botta e Meditazione importate dalle fonti locali, portando il catalogo a 53 mosse. Medaglia Riflesso e premio allenatore 1800 monete; feedback su immunità Buio, doppio tipo e status. Requisiti di medaglia: rapporto del lago e puzzle completo.

Ambiente illustrato allineato al Tiled, con sei dispositivi ottici solidi e quattro controlli aggirabili. Tre prove su squadra, geometria e medaglia unica, più le due prove del puzzle in 24 ordini, passate. Suite completa 330 dominio + 16 persistenza (`.tmp/p6-preparation-tests.txt`). Manca integrazione runtime, dialoghi, emblema e percorso touch. R11 è ora preparata in bozza; nessuna delle sei mappe nuove è ancora aperta nel gioco.

Catalogo lacustre pronto: Slowpoke/Slowbro, Drowzee/Hypno, Natu/Xatu, Eevee/Espeon con fonti PokéAPI locali e artwork. Registrate le tre evoluzioni per livello; altre condizioni restano riferimenti espliciti non ancora eseguibili. Psicoraggio, Stordiraggio e Comete disponibili con semantica HGSS. La squadra P6 descritta sopra è verificata sui learnset effettivi; non assegnare a Natu/Xatu mosse Psico anticipate per analogia di tipo. Nessuna delle nuove specie è ancora assegnata a habitat giocabili.

Il sistema di orientamenti condiviso supporta `presentation=reflection` e inclinazioni `/` e `\\`. La variante mostra soltanto i fasci attivi e gli specchi inclinati, anziché frecce e condutture. La propagazione usa il grafo dichiarato nei dati: non è un simulatore ottico libero né ricerca automaticamente ostacoli sul Tiled.

Configurazione P6 in `content/drafts/acquariva/gym06_reflections.v1.json`: quattro specchi, sorgente e ricevitore. Non viene scoperta dal registro runtime. Due prove verificano tutti i 24 ordini, salvataggio degli orientamenti, inclinazioni coerenti con il fascio in ingresso e rifiuto dei dati mancanti. Le tre prove del circuito P4 continuano a passare. Mappa, controlli e quest sono preparati nella stessa cartella; mancano integrazione, ispezione visuale e percorso touch del puzzle.

## Gate prima della pubblicazione

### R09 preparata

Illustrazione originale conservata con prompt/hash in `assets/prompts/r09-dunes-v1.md`. Bozza mappa e due tabelle in `content/drafts/acquariva/`: due habitat opzionali, pesca con canna e ritorni previsti a Portolume/Delta. Due prove superate su specie/pesi/fasce e raggiungibilità di uscite/pesca evitando entrambi gli habitat. Non è ancora una traversata nel gioco. Il collegamento a Portolume resta chiuso fino all'integrazione del capitolo.

### D04 preparato

Illustrazione originale con fonte/prompt/hash in `assets/prompts/d04-delta-v1.md`; mappa, tabella pesca e quest in `content/drafts/acquariva/`. Tre osservazioni indipendenti — corrente, canneti, vivaio naturale — richiedono P5; il rapporto alla biologa Iris richiede tutte le letture e apre il seguito verso R10. Premio unico 350 monete e tre Sfere. Due prove verificano tutti i sei ordini, serializzazione, rifiuto prematuro, premio non duplicabile e accessibilità dei pontili con la biologa presente. Il ritorno alle Dune non dipende dal rapporto. Mancano dialoghi, R10, runtime e verifica visuale con personaggio.

### R10 preparato

Illustrazione originale e geometria allineata del Sentiero delle Canne conservate con fonte/hash. Due habitat, campana del salice come riferimento e kit facoltativo sul ramo del pontile: due Antidoti una sola volta dopo il rapporto del Delta. Incontri con Natu, Drowzee, Hoothoot ed Eevee secondo fascia oraria. Due prove superate: tabelle valide, uscite e riferimenti raggiungibili evitando gli habitat; kit persistente e non duplicabile. File sotto `content/drafts/acquariva/`, ancora esclusi dal runtime. Mancano Acquariva, R11 e P6 complete prima dell'apertura del capitolo.

### Acquariva preparata

Illustrazione originale ripulita dalle figure incorporate con ImageGen; fonte, due prompt e hash conservati. Geometria di bozza con ingresso R10, osservatorio raggiungibile a piedi, cure/deposito, negozio, terminale ferroviario, ingresso P6 e uscita R11. Il monumento e l'acqua sono esclusi dal cammino; tutti gli approcci sono collegati anche con la ricercatrice presente. Tessa confronta il rapporto completo del Delta, assegna due Pozioni una sola volta e abilita P6. Due prove di geometria/quest passate; mancano dialoghi integrati, R11, P6 completa e prova touch. L'uscita R11 è proposta dopo Medaglia Riflesso, come scelta di progressione di questa implementazione, non nome canonico preesistente.

### R11 preparata

Via delle Cascate illustrata con fonte/hash in `assets/prompts/r11-cascades-v1.md`. Bozza 40×30 con sentiero continuo sulla sponda sinistra, belvedere e due prati laterali. Tabella di incontri locali con Pidgeotto, Flaaffy, Natu, Eevee e Drowzee secondo fascia oraria. Prova di geometria e tabella passata: entrambi i ritorni e il belvedere sono raggiungibili evitando gli habitat; acqua e salti restano bloccati. Nessun requisito sulle uscite interne, per non intrappolare il giocatore. Gli accessi cittadini dovranno richiedere la Medaglia Riflesso. Mancano collegamenti cittadini, runtime e verifica visuale con personaggio.

### Verifiche richieste per l'integrazione

1. Importare e conservare dati/artwork delle specie necessarie a incontri e palestra; ogni mossa deve risultare disponibile alla specie al livello previsto. Non assegnare mosse per analogia di tipo.
2. Integrare tutte le mappe del percorso e i ritorni, servizi, ricerca, puzzle, allenatore, medaglia, diario e atlante. Aprire l'uscita di Portolume soltanto quando il percorso è verificabile.
3. Allineare collisioni e pontili alle illustrazioni effettive, non alle sole coordinate richieste nel prompt; impedire il cammino su acqua e vegetazione solida.
4. Verificare ordine errato, riapertura delle UI, salvataggio/reload, premi non duplicabili, scenari portrait/landscape e primo accesso offline.
5. Separare prove a checkpoint e bilanciamento con squadra cresciuta normalmente. P6 deve essere raggiungibile senza scambi multiplayer o una specie obbligatoria.

P7–P8, Santuario, Lega, epilogo, post-game, catalogo completo delle prime due generazioni e capitoli precedenti ancora parziali restano nel progetto. Questo documento non ne prova l'implementazione.
