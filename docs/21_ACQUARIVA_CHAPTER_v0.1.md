# Dune, Delta e Acquariva — contratto del capitolo

Stato: preparazione, non giocabile. Fonte principale: documento 02, sezioni 3–8. Il capitolo deve proseguire da Portolume alla sesta medaglia, senza concludere la regione.

## Contenuti richiesti

- R09 Dune Salmastre: uscita da Portolume dopo P5, passeggiata costiera verso D04, habitat laterali leggibili, ritorno sempre disponibile.
- D04 Delta degli Specchi: canali, diversità acquatica e osservazioni sull'ecosistema; attraversamento tramite pontili e collegamenti locali dichiarati. Nessuna mossa inventata per attraversare l'acqua.
- R10 Sentiero delle Canne: labirinto leggero con punti di riferimento, collegamento Delta–Acquariva e habitat opzionali.
- Acquariva: lago, canneti, quartieri su pontili, osservatorio, servizi e indicazioni verso P6. Confrontare osservazioni del lago con quelle del porto senza presentarle già come prova conclusiva della causa.
- P6 Psico: puzzle di specchi, contromosse e status; capopalestra e medaglia originali, squadra e mosse da fonti ufficiali locali, feedback e premio unico persistente.
- R11 Via delle Cascate: collegamento percorribile Acquariva–Vetracielo, distinto dalla monorotaia. Verificare entrambi gli accessi, requisiti e ritorno. Il passaggio tardivo aggiuntivo Brumalta–Acquariva resta nel perimetro regionale e non va dichiarato implementato da questa sola scorciatoia.

## Implementazione iniziata

Catalogo lacustre pronto: Slowpoke/Slowbro, Drowzee/Hypno, Natu/Xatu, Eevee/Espeon con fonti PokéAPI locali e artwork. Registrate le tre evoluzioni per livello; altre condizioni restano riferimenti espliciti non ancora eseguibili. Psicoraggio, Stordiraggio e Comete disponibili con semantica HGSS. La scelta della squadra P6 deve ancora avvenire sui learnset effettivi; non assegnare a Natu/Xatu mosse Psico anticipate per analogia di tipo. Nessuna delle nuove specie è ancora assegnata a habitat giocabili.

Il sistema di orientamenti condiviso supporta `presentation=reflection` e inclinazioni `/` e `\\`. La variante mostra soltanto i fasci attivi e gli specchi inclinati, anziché frecce e condutture. La propagazione usa il grafo dichiarato nei dati: non è un simulatore ottico libero né ricerca automaticamente ostacoli sul Tiled.

Configurazione P6 in `content/drafts/acquariva/gym06_reflections.v1.json`: quattro specchi, sorgente e ricevitore. Non viene scoperta dal registro runtime. Due prove verificano tutti i 24 ordini, salvataggio degli orientamenti, inclinazioni coerenti con il fascio in ingresso e rifiuto dei dati mancanti. Le tre prove del circuito P4 continuano a passare. Build riuscita; mancano mappa, controlli, quest, ispezione visuale e percorso touch del puzzle.

## Gate prima della pubblicazione

### R09 preparata

Illustrazione originale conservata con prompt/hash in `assets/prompts/r09-dunes-v1.md`. Bozza mappa e due tabelle in `content/drafts/acquariva/`: due habitat opzionali, pesca con canna e ritorni previsti a Portolume/Delta. Due prove superate su specie/pesi/fasce e raggiungibilità di uscite/pesca evitando entrambi gli habitat. Non è ancora una traversata nel gioco. Il collegamento a Portolume resta chiuso fino all'integrazione del capitolo.

### D04 preparato

Illustrazione originale con fonte/prompt/hash in `assets/prompts/d04-delta-v1.md`; mappa, tabella pesca e quest in `content/drafts/acquariva/`. Tre osservazioni indipendenti — corrente, canneti, vivaio naturale — richiedono P5; il rapporto alla biologa Iris richiede tutte le letture e apre il seguito verso R10. Premio unico 350 monete e tre Sfere. Due prove verificano tutti i sei ordini, serializzazione, rifiuto prematuro, premio non duplicabile e accessibilità dei pontili con la biologa presente. Il ritorno alle Dune non dipende dal rapporto. Mancano dialoghi, R10, runtime e verifica visuale con personaggio.

1. Importare e conservare dati/artwork delle specie necessarie a incontri e palestra; ogni mossa deve risultare disponibile alla specie al livello previsto. Non assegnare mosse per analogia di tipo.
2. Integrare tutte le mappe del percorso e i ritorni, servizi, ricerca, puzzle, allenatore, medaglia, diario e atlante. Aprire l'uscita di Portolume soltanto quando il percorso è verificabile.
3. Allineare collisioni e pontili alle illustrazioni effettive, non alle sole coordinate richieste nel prompt; impedire il cammino su acqua e vegetazione solida.
4. Verificare ordine errato, riapertura delle UI, salvataggio/reload, premi non duplicabili, scenari portrait/landscape e primo accesso offline.
5. Separare prove a checkpoint e bilanciamento con squadra cresciuta normalmente. P6 deve essere raggiungibile senza scambi multiplayer o una specie obbligatoria.

P7–P8, Santuario, Lega, epilogo, post-game, catalogo completo delle prime due generazioni e capitoli precedenti ancora parziali restano nel progetto. Questo documento non ne prova l'implementazione.
