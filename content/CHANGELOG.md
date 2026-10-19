## veloria-content-0.3.80 — 19/10/2026

- Testo dei dialoghi scandito dal tempo trascorso anziché dal numero di callback: recupera la progressione dopo un task lento del browser, mantenendo velocità lenta/normale/rapida, caratteri Unicode e conferma A della pagina.
- Nuova prova con blocco reale del browser di 750 ms; passano anche le due prove monorotaia, inclusi annullamento e riprova dopo errore asset. Cache PWA v101.
- P4 pubblicata nel commit precedente e provata sull'URL GitHub Pages: ascensore, soluzione del circuito, reload offline e ritorno in città senza errori runtime, con checkpoint isolato. La suite Verify precedente conserva errori nei test lunghi; non è dichiarata verde.

## veloria-content-0.3.79 — 18/10/2026

- Palestra 4 di Ferraluce: ascensore dalla piazza dopo il rapporto a Ivo, Officina Magnetica illustrata originale, ingresso/uscita dichiarativi e ritorno sempre aperto. 19 mappe, 19 quest e otto allenatori.
- Puzzle di orientamento: segnale da Sorgente a Ricevitore, tre comandi regolabili in qualunque ordine, frecce e collegamenti alimentati visibili, orientamenti persistenti. Motore puro e catalogo separati; validazione incrociata con Tiled, collisioni ed evento quest.
- Rhea con Magnemite 20, Skarmory 21 e Steelix 22, mosse HGSS legali ai livelli. Medaglia Acciaio originale a magnete, premio unico 1.100 monete e feedback strategico. Diario, dialoghi e atlante aggiornati. Nessun requisito di possedere una specie specifica.
- Due prove browser complete superate per puzzle/ricarica e sfida/medaglia/premio unico; produzione offline superata per ingresso, puzzle, reload e ritorno. 296 test dominio/persistenza, 40 Python, TypeScript e validazione contenuti superati. Cache PWA v100.
- La prova battaglia usa una squadra preparata: bilanciamento naturale con tutti gli starter e QA su telefono fisico ancora aperti. R07, Centrale, città completa, P5–P8 e Lega restano assenti. La pipeline GitHub precedente conserva fallimenti: esiti in `docs/CI_STATUS.md`.

## veloria-content-0.3.78 — 18/10/2026

- Preparazione del catalogo di Ferraluce: Magneton, Steelix e Skarmory con parametri e learnset HGSS importati; 34 specie e 45 mosse. Sassata usa i dati ufficiali e il normale danno fisico già supportato. Nessun nuovo incontro o capopalestra è abilitato da questo import.
- Tre artwork ufficiali locali lossless, PNG conservati, provenienza/hash registrati; precache PWA v99.
- Riferimenti evolutivi con luogo speciale: Magneton mostra la condizione di aumento di livello presso Mt. Coronet, nome inglese fornito dalla fonte in assenza di italiano. Il luogo non appartiene a Veloria e l'evoluzione non è attivata nel prototipo. Nessuna soglia inventata.
- Catalogo e TypeScript validati; prova Squadra/Pokédex superata per nuovi artwork e condizioni evolutive. Stato delle verifiche e pubblicazione in `docs/CI_STATUS.md`.

## veloria-content-0.3.77 — 18/10/2026

- Monorotaia attiva dopo Circuito tra Brumalta, Petalora, Vetracielo e Ferraluce già visitate; tariffa gratuita prototipale, terminali illustrati e dati dichiarativi validati. Indicazioni di Aster e Lea aggiornate.
- Annullamento e tastiera dei menu servizi corretti; arrivo orientato verso il terminale anche dopo ricaricamento. Un caricamento fallito conserva il punto di partenza e permette di riprovare.
- Verificati quattro casi browser di servizi/avvio/trasporto e due casi offline, oltre a 293 test dominio/persistenza e 35 test Python. Cache PWA v98. Stato di pipeline e pubblicazione in `docs/CI_STATUS.md`.
- Dettagli delle mosse adattati alle misure del font di ripiego senza spezzare categoria e PP in una terza riga; tre prove layout locali superate. La pipeline Linux precedente conserva errori di integrazione da risolvere.

## veloria-content-0.3.76 — 18/10/2026

- Header corretto a 320 px con saldo, menu e aggiornamento visibili e senza sovrapposizione; il marchio si adatta allo spazio residuo. Cache PWA v97.
- Pipeline browser distribuita in tre shard a un worker ciascuno, con prova offline su runner separato: evita la contesa tra rendering ad alta densità e processi rimasti dopo il timeout della suite precedente.
- Prove UI riallineate alla guida DOM, ai dettagli mosse separati, alla griglia landscape e al catalogo dati attuale; restano verifiche di azioni, effetti, persistenza e limiti dello schermo.
- GitHub Pages pubblico con manifest build non nascosto, necessario al precache su hosting statico. Avvio, atlante e ricarica offline della versione v96 già verificati sul sito pubblico; gli esiti della nuova pipeline restano da acquisire.

## veloria-content-0.3.75 — 18/10/2026

- Atlante regionale illustrato originale, generato con ImageGen integrato sul riferimento artistico del progetto. Paesaggio continuo, collegamenti morbidi solo per i tratti esistenti e nome visibile per il luogo selezionato; rimossa la precedente rappresentazione geometrica.
- Mappa dal menu, posizione corrente per città e sentieri, visite persistenti e destinazioni future dichiarate in preparazione. Le 18 mappe runtime sono raggruppate in 22 luoghi regionali; selezionare un luogo non teletrasporta il giocatore. Zoom, scorrimento, selettore accessibile e layout portrait/landscape.
- Icone illustrate nei comandi battaglia e nelle opzioni di cure, deposito e mercato, mantenendo le etichette leggibili e gli stessi acquisti/servizi.
- Camera: dead zone calcolata in unità mondo anziché pixel del backing store; follow aggiornato a ridimensionamento, rotazione, ripresa e cambi del viewport. Prove browser standalone simulate a DPR 3 e 4 con campionamento continuo durante movimento e passaggio di porta; verifica su PWA fisica ancora manuale.
- Cache PWA v94 con atlante locale; PNG sorgente, WebP lossless e prompt registrati. Nessuna nuova mossa/specie o tappa narrativa in questa revisione.

## veloria-content-0.3.73 — 18/10/2026

- R06 Anello Magnetico e Piazza dell’Energia di Ferraluce collegati al varco est di Vetracielo dopo Circuito, con ritorni sempre disponibili. Quattro habitat laterali lasciano un corridoio senza incontri obbligati.
- Misurazione del segnale e rapporto a Ivo con ricompensa unica (due Pozioni e un Antidoto), guida contestuale e diario coerenti anche arrivando senza letture. Cure gratuite/deposito e bottega funzionanti.
- Due immagini originali ImageGen: Sala delle Dinamo trasparente e suolo continuo industriale chiaro, PNG e WebP lossless registrati con prompt. Pavimentazione vettoriale dichiarativa separata da collisioni e gameplay. Nessuna nuova specie o mossa.
- Contratto quest allineato al motore: `requiresFlags` è esplicitamente obbligatorio nello schema, anche quando vuoto; test di rifiuto dei dati incompleti.
- Precache PWA v92, 18 mappe / 17 quest / cinque botteghe. Palestra 4, città completa, R07/Centrale e resto dell’avventura restano da implementare.

## veloria-content-0.3.72 — 18/10/2026

- Evoluzioni giocabili dei Pokémon dei sentieri: Pidgeotto (18), Raticate (20), Furret (15), Noctowl (20), Flaaffy (15) e Quagsire (20). Soglie validate rispetto alle risposte PokéAPI locali.
- Catalogo a 31 specie; parametri storici HGSS, learnset ufficiali filtrati sulle 44 mosse implementate, nove artwork evolutivi lossless con PNG sorgenti e checksum. 216 voci learnset non supportate restano dichiarate, senza mosse sostitutive inventate.
- Configurazione dichiarativa condivisa da motore, Squadra e Pokédex; nessuna logica per singola specie nelle scene. Nuove forme incluse nel precache PWA v91.
- Curve XP ancora prototipali, forme finali degli starter/Pidgeotto/Flaaffy e altre evoluzioni mancanti: questo aggiornamento non completa il catalogo né l’avventura.

## veloria-content-0.3.71 — 18/10/2026

- Testi battaglia rasterizzati a risoluzione 4; nomi mosse adattati con dimensioni font intere, dettagli a capo senza riduzione frazionaria.
- Artwork di Ivysaur, Charmeleon, Wartortle, Magnemite e Voltorb rigenerati lossless dai PNG originali; importatori, checksum e registro aggiornati. Gli altri artwork non sono stati rigenerati.
- Cache PWA v90; animazione Poké Ball invariata.

## veloria-content-0.3.70 — 18/10/2026

- Palestra 3 di Vetracielo accessibile dalla scalinata della stazione dopo Lea. Terrazza illustrata originale, tre console numerate Giardini → Vetro → Cielo, progressione persistente e blocco della sfida finché la rete non è collegata.
- Aster con Voltorb 16 / Magnemite 17, premio unico 850 monete e Medaglia Circuito con emblema originale condiviso da banner e medagliere. Nessun nuovo controllo per città in WorldScene.
- 25 specie e 44 mosse da dati PokéAPI locali: nuovi Magnemite/Voltorb nel parco, artwork urbani e riferimenti delle evoluzioni; Ferrostrido, Supersuono, Sonicboom, Tuononda, Scintilla e Stridio implementate. Charge/Rollout restano esplicite come non supportate.
- Danno fisso condiviso da motore, previsione e AI, senza bonus impropri; immunità di tipo selettiva per Tuononda, anche nella scelta AI. Descrizioni coerenti in battaglia, Squadra e Pokédex. Nomi NPC e console resi ad alta risoluzione.
- Import artwork urbani separato e verifica offline nel validatore; PNG e WebP originali/derivati registrati, cache PWA `veloria-shell-v89`. Quartieri di Vetracielo, R06/Ferraluce, altre cinque Palestre e Lega ancora da realizzare; non è un completamento dell’avventura.

## veloria-content-0.3.69 — 18/10/2026

- Messaggi di azione posizionati sotto la ricompensa missione visibile, anche dopo rotazione. Su schermi troppo corti il nuovo messaggio sostituisce la celebrazione precedente.
- Acquisite e verificate 12 risposte ufficiali PokéAPI per preparare Magnemite, Voltorb e relative mosse: manifest separato `vetracielo-source-preview.json`, senza attivare specie/mosse runtime. Cache PWA `veloria-shell-v88`.

## veloria-content-0.3.68 — 18/10/2026

- Aperto il varco est di Petalora dopo la Medaglia Corolla: R05 Viadotto dei Ciliegi e prima Piazza della Monorotaia di Vetracielo, con ritorni reciproci, ponte e binari sopraelevati riservati.
- Quattro habitat sul viadotto e uno nel parco cittadino, livelli 11–14 con fasce orarie. Oren opzionale con Pikachu 13 e Wooper 14, premio unico 240 monete e feedback su tipi/Velocità. Nessuna nuova specie o mossa; roster e dati ufficiali locali conservati.
- Arrivo e orientamento con Lea persistenti, due Pozioni una volta, cure/deposito e rifornimenti in piazza. Diario e guida ora proseguono dopo Corolla.
- Stazione Giardino originale generata tramite ImageGen integrato: PNG sorgente e WebP q88 con alpha, registro asset e prompt aggiornati. Geometria del viadotto dichiarativa nel renderer condiviso; collisioni in Tiled. Nessuna condizione per Vetracielo in WorldScene.
- Cache PWA `veloria-shell-v87`. Palestra 3, fast travel, interni, altri quartieri e nuove specie urbane ancora da implementare; questa è la prima piazza, non la metropoli completa.

## veloria-content-0.3.67 — 18/10/2026

- Indicazioni mondo come testo DOM alla densità nativa, proiettato dopo il rendering della camera. Posizionamento condiviso che evita HUD, notifiche, comandi e protagonista; nessuna etichetta fissata sul bordo per bersagli fuori schermo. Pulizia sullo shutdown e visibilità legata alle interazioni.
- Ricompense missione più compatte, diario compatto durante la celebrazione e rimozione del toast generico duplicato. Premi effettivi e medagliere conservati.
- Piano del prossimo capitolo in `docs/14_VETRACIELO_CHAPTER_PLAN_v0.1.md`; R05 e Vetracielo non sono ancora giocabili. Cache PWA `veloria-shell-v86`.

## veloria-content-0.3.66 — 18/10/2026

- Canvas fino a 3× sui telefoni, con budget massimo equivalente a un framebuffer 4K sui display più grandi. Dimensioni logiche e controlli touch conservati.
- Artwork in battaglia limitati ai pixel sorgente disponibili; dettagli dei pulsanti mossa a 11px. In landscape fino a quattro mosse su una riga più alta. Animazione della Sfera conservata.
- Cache PWA `veloria-shell-v85`. Nessun nuovo artwork o modifica alle regole di combattimento.

## veloria-content-0.3.65 — 17/10/2026

- Prima versione giocabile della Palestra di Petalora: giardino collegato al viale nord, sorgente → deviazione ovest → est → fioritura. Canali che si riempiono e fiori persistenti, dialoghi per azioni fuori ordine e sfida bloccata fino alla soluzione.
- Dalia schiera Oddish 12 e Bellsprout 13 con mosse HGSS supportate. Premio unico di 650 monete e Medaglia Corolla con feedback su copertura, Sonnifero e Acido. Nessuna modifica alle meccaniche del combattimento o ai parametri delle mosse.
- Emblemi distinti e nomi delle ricompense dal catalogo medaglie, condivisi da banner e medagliere. Diario e guida estesi alla seconda palestra; missioni di Radicelmo ancora facoltative.
- Proprietà Tiled `activatedFlag`, `visibleWhenFlag` e `battleLockedMessage` per contenuti estendibili. Nessuna nuova immagine o migrazione dei salvataggi. Cache PWA `veloria-shell-v84`; Vetracielo ancora da implementare.

## veloria-content-0.3.64 — 17/10/2026

- Aperto il passaggio nord di Radicelmo verso R04 Salita dei Petali e il primo quartiere di Petalora. Gate Medaglia Aurora, spawn reciproci, due ponti e quattro habitat di foglie ai lati; sentiero percorribile senza incontri obbligatori.
- Nila: sfida opzionale Pidgey 9/Mareep 10, mosse HGSS disponibili, premio unico 180 monete e feedback. Incontri R04 livelli 8–11 con fasce orarie, cure/deposito e bottega a Petalora.
- Ciliegio illustrato originale generato con ImageGen, PNG sorgente e WebP q88 registrati (102 voci asset). Petali animati deterministici, statici nelle animazioni ridotte; proporzioni sorgente degli alberi conservate.
- Diario con priorità alle tappe principali e missioni di Radicelmo esplicitamente facoltative. Arrivo città dal contratto generico `area/<mapId>/enter`; nessuna migrazione dei save. Palestra 2 ancora da implementare. Cache PWA `veloria-shell-v83`.

## veloria-content-0.3.63 — 17/10/2026

- Rendering HiDPI: il canvas segue la densità dello schermo fino a 2×, con layout e comandi nelle dimensioni CSS originali. Camera mondo e scena battaglia compensano la densità; framebuffer limitato per evitare il costo 9× degli schermi DPR 3.
- Tutti i testi della battaglia sono rasterizzati almeno a risoluzione 2×. Gli artwork locali vengono campionati nel canvas più definito, mantenendo filtro lineare e animazione della Sfera.
- Verificati catalogo completo, immagini in campo, testi, tocchi e rotazione alle densità 1/2/3. Nessuna nuova immagine, regola o modifica ai salvataggi. Cache PWA `veloria-shell-v82`.

## veloria-content-0.3.62 — 17/10/2026

- Nuova missione dopo la consegna del seme: «Un archivio che cresce». Parlando ancora con Leda si attiva la prova nel vivaio esterno, a sud della serra: acqua, luce, osservazione del seme, rapporto finale. Ricompensa unica: 180 monete, due Pozioni e un Antidoto.
- Oggetti illustrati interattivi, dialoghi contestuali per i prerequisiti mancanti, diario e indicatore sul prossimo obiettivo. Spunte persistenti sugli strumenti utilizzati. Il valico per Petalora resta chiuso; questo contenuto non implementa l’interno D02 né la seconda palestra.
- I dialoghi a stadi sono riutilizzabili anche sugli oggetti Tiled, oltre che sugli NPC. Stato e ricompense restano nel motore quest; il renderer legge soltanto i flag. Nessuna migrazione dei salvataggi. Cache PWA `veloria-shell-v81`.

## veloria-content-0.3.61 — 17/10/2026

- Attivate Bulbasaur → Ivysaur, Charmander → Charmeleon e Squirtle → Wartortle dal livello 16. Il catalogo passa a 23 specie; restano quattro starter selezionabili. Le forme finali e l’evoluzione tramite strumenti di Pikachu non sono ancora abilitate.
- Parametri delle nuove specie da snapshot PokéAPI, con normalizzazione di tipi/statistiche per la generazione HGSS; learnset ufficiali supportati generati dallo stesso import delle mosse. Curve XP ancora prototipali. Nuovi import dichiarati in `species-imports.v1.json` e verificabili offline.
- Tre artwork ufficiali locali, PNG sorgenti conservati, WebP q88 e checksum registrati, immagini in squadra/Pokédex/battaglia e precache PWA. Registro asset: 100 voci. Cache `veloria-shell-v80`.
- Regressioni sulle soglie e sulla conservazione di identità, HP mancanti, PP e salvataggio; prove browser di tutte e tre le evoluzioni con scelte mosse e ripresa IndexedDB. Adeguato lo scenario offline agli habitat nelle felci e ai banner di fine scontro.

## veloria-content-0.3.60 — 17/10/2026

- Cattura con Sfera rossa/bianca, lancio, assorbimento e oscillazioni; feedback statico quando le animazioni sono ridotte. Alla riuscita il riepilogo mostra subito immagine, tipo, livello, HP, mosse e destinazione squadra/box; un fallimento torna allo scontro senza banner di successo.
- Vittorie con banner, XP e denaro realmente assegnati, più feedback dell’allenatore dai suoi contenuti. Mira consegna visivamente la Medaglia Aurora e commenta il risultato. Nessuna ricompensa viene assegnata dal componente grafico.
- Menu Medaglie persistente con emblema originale condiviso fra vittoria, riepilogo del capitolo e medagliere. Il catalogo delle medaglie e i feedback degli allenatori entrano nella validazione dei contenuti.
- Layout portrait/landscape con contenuto scorrevole e pulsante Continua sempre visibile. Chiusura finale protetta da doppie notifiche, pulizia degli eventi alla fine della scena e rispetto delle animazioni ridotte. Cache PWA `veloria-shell-v79`.

## veloria-content-0.3.59 — 17/10/2026

- Sezione Evoluzione subito dopo il riepilogo del Pokémon, sia in Squadra sia nel Pokédex. Mostra forma successiva e livello o strumento richiesto, forme finali e disponibilità effettiva nel prototipo.
- Riferimenti PokéAPI per tutte le 20 specie, salvati localmente con risorse grezze, URL e SHA-256; import riproducibile tramite `tools/import_pokeapi_evolutions.py --fetch` e controllo offline `--check`, integrato nel validatore principale. Filtrati metodi successivi a HGSS e forme regionali; nessuna richiesta API durante il gioco.
- Le quattro evoluzioni già funzionanti devono coincidere con i dati sorgente. Le altre sono descritte come non ancora disponibili: questa modifica non aggiunge nuove specie al motore. Cache PWA `veloria-shell-v78`.

## veloria-content-0.3.58 — 17/10/2026

- Continuazione dopo Mira resa esplicita: uscita sud della palestra, uscita est di Brumalta, Terrazze del Muschio e custode Leda a Radicelmo. Corretti il vecchio nome Via delle Radici, dialoghi e riepilogo del primo capitolo. Indicatori guidati dai flag fino alla conclusione della missione.
- Corretto il seme raccolto ma assente dallo zaino: le tappe di missione supportano `grantItems` e `consumeItems`. Raccolta e consegna sono persistenti e non ripetibili; una consegna incompleta non modifica flag, inventario o ricompense. Leda ritira il seme e consegna scheda dell’Archivio, due Pozioni e 120 monete una sola volta.
- Schema e validazione estesi a tutte le missioni runtime; descrizioni degli oggetti chiave disponibili nello zaino. Nessuna migrazione dei vecchi salvataggi. Cache PWA `veloria-shell-v77`.

## veloria-content-0.3.57 — 17/10/2026

- Menu con voci distinte Squadra e Pokédex. Schede selezionabili con illustrazione, tipi, debolezze/resistenze/immunità calcolate sulla matrice runtime, statistiche base, statistiche al livello per i compagni, mosse attuali e apprendimenti HGSS implementati.
- Descrizioni delle mosse derivate dagli effetti reali: bersaglio, aumenti/riduzioni delle statistiche, probabilità, stati e loro conseguenze, drenaggio, colpi multipli, priorità e Parassiseme. Stesso adattatore per schede e consultazione in lotta; nessun valore di mossa inventato.
- In lotta Dettagli mosse (tasto I) apre una consultazione senza turni/PP, accessibile anche con mosse esaurite. Comandi touch da 44 px; tutte le 38 descrizioni verificate in portrait e landscape.
- Pokédex esteso alle specie viste: flag persistenti `pokedex_seen_<id>` solo per avversari realmente mostrati, incluse fuga/sconfitta; le riserve non rivelate non sono anticipate. I compagni posseduti mantengono la registrazione durante la progressione. Nessuna migrazione dei vecchi salvataggi. Cache PWA `veloria-shell-v76`.

## veloria-content-0.3.56 — 17/10/2026

- Contatore monete compatto nella testata; apre Zaino e dotazioni, accessibile anche dal menu. Quantità e saldo derivano dalla partita corrente e si aggiornano con acquisti, consumi e ricompense.
- Oggetti con nome, quantità e funzione dal catalogo locale; gli stack esauriti non sono mostrati. Pannello scorrevole in portrait/landscape, chiusura Escape e ripristino del focus. Riusa il blocco input del diario durante la consultazione.
- Si mostrano gli oggetti posseduti: nessun nuovo sistema di slot/accessori equipaggiabili o migrazione dei salvataggi. Cache PWA `veloria-shell-v75`.

## veloria-content-0.3.55 — 17/10/2026

- Il dettaglio della mossa mostra una stima dei danni sul bersaglio corrente e il bonus del tipo del proprio Pokémon. La stima condivide la formula con i colpi realmente risolti: statistiche fisiche/speciali, stadi, scottatura, efficacia, bonus tipo e variabilità del ruleset; non legge RNG e non modifica i valori PokéAPI.
- In caso di supporto non è mostrato un danno fittizio. Le stime escludono critici/effetti secondari e rispettano HP rimasti, immunità e numero di colpi.
- Il giocatore del playtest sceglie in base alla stessa previsione disponibile nell’interfaccia, superando il confronto fuorviante della sola potenza. Cache PWA `veloria-shell-v74`.

## veloria-content-0.3.54 — 17/10/2026

- Il cambio obbligato dopo un KO è una fase separata: nessun attacco gratuito, nessun PP o RNG consumato, nessun danno residuo e nessun avanzamento di turno. I cambi volontari conservano il costo normale.
- I sostituti dell’allenatore entrano automaticamente dopo i messaggi di KO; il giocatore non deve scegliere una mossa per provocarli. Gestite anche sostituzioni simultanee. Ruleset prototipo v7.
- I consigli confrontano il livello più alto della squadra con l’avversario più forte. Il playtest usa incontri, catture e acquisti reali per preparare la squadra, senza impostare livelli o statistiche. Cache PWA `veloria-shell-v73`.

## veloria-content-0.3.53 — 17/10/2026

- AI della prima Palestra: ogni mossa di supporto viene proposta al massimo una volta per Pokémon, finché esiste un’alternativa offensiva. Colpocoda non innesca più una sequenza di Ricciolscudo ripetuti. Le altre politiche mantengono i limiti precedenti.
- Corrette immunità di tipo agli stati: Veleno/Acciaio non avvelenabili, Fuoco non scottabile, Ghiaccio non congelabile. Non introdotte immunità moderne di Elettro alla paralisi o di Erba alle polveri. Ruleset prototipo v6; restano esplicite le altre semplificazioni del motore.
- Nessun valore delle mosse PokéAPI o livello della squadra di Mira modificato. Cache PWA `veloria-shell-v72`.

## veloria-content-0.3.52 — 17/10/2026

- Prima delle sfide sono visibili numero e livelli dei Pokémon avversari, con consigli ricavati da squadra, HP/stati/PP e Pozioni disponibili. Nessun blocco di livello: SFIDA e NON ORA restano disponibili.
- Diario della Medaglia Aurora arricchito con livelli di Mira e indicazioni di preparazione. Mira introduce il ruolo di Colpocoda e Ruggito. Nei menu con scelte il testo è mostrato subito, così le informazioni sono leggibili prima di decidere.
- Playtest naturale aggiornato ai learnset PokéAPI, separando tentativi diretti da preparazione, cure e acquisti reali; i vecchi risultati sono esplicitamente storici. Cache PWA `veloria-shell-v71`.

## veloria-content-0.3.51 — 17/10/2026

- Carte mosse semplificate a nome, tipo/categoria e PP, con gerarchia tipografica e layout compatto per landscape. Rimossi i dettagli che fuoriuscivano dai pulsanti in portrait.
- Corretto il blocco della scena dopo sostituzione/rifiuto di una mossa: la risoluzione riprende i messaggi e le successive scelte senza lasciare un pannello vuoto.
- Il pannello selezionato conserva potenza, precisione attuale ed effetti, compresa la probabilità degli effetti secondari. Le mosse di supporto mostrano la variazione effettiva anziché un generico conteggio.
- Aggiunte verifiche browser dei limiti delle carte a 320×568 e 844×390, oltre allo scenario Parassiseme con HP visivi sincronizzati al motore. Cache PWA `veloria-shell-v70`.

## veloria-content-0.3.50 — 17/10/2026

- Parassiseme importato da PokéAPI: Bulbasaur lo apprende al livello 7, 90% precisione e 10 PP. Drenaggio a fine turno pari a 1/8 degli HP massimi, cura limitata agli HP effettivamente sottratti e allo spazio disponibile.
- Immunità Erba, nessuna sovrapposizione, rimozione quando il bersaglio esce dal campo; il sostituto dell’utilizzatore riceve la cura. L’effetto volatile non viene conservato dopo cattura o in una nuova battaglia.
- Eventi, feedback HP, descrizioni UI e scelta AI integrati. Catalogo locale: 38 mosse, 126 apprendimenti sorgente ancora esclusi. Cache PWA `veloria-shell-v69`.

## veloria-content-0.3.49 — 17/10/2026

- Precisione ed elusione temporanee nel motore di battaglia, con moltiplicatori separati di Gen IV, limiti ±6 e reset al cambio. L’AI considera la probabilità effettiva di colpire.
- Importate Turbosabbia (Pidgey lv5), Muro di Fumo (Charmander lv10) e Profumino (Oddish lv5). Profumino riduce l’elusione di uno stadio, ricavato dal testo effetto storico dell’API. Catalogo locale: 37 mosse, 127 apprendimenti sorgente ancora esclusi.
- UI: etichette Precisione/Elusione e probabilità attuale nelle mosse quando diversa da quella base. Cache PWA `veloria-shell-v68`.

## veloria-content-0.3.48 — 17/10/2026

- Importate nove mosse PokéAPI aggiuntive: Velenpolvere, Sonnifero, Paralizzante, Doppiasberla, Sfuriate, Sanguisuga, Limitazione, Colpodifango e Schianto. Il catalogo locale passa a 34 mosse; 22 apprendimenti prima esclusi entrano nella progressione ufficiale HGSS.
- Sanguisuga usa la potenza storica 20 e 15 PP, non i valori moderni. Nessuna taratura manuale. Restano 132 apprendimenti sorgente non implementati.
- Roadmap allineata alla decisione di non richiedere retrocompatibilità. Cache PWA `veloria-shell-v67`.

## veloria-content-0.3.47 — 17/10/2026

- Aggiunti due habitat con felci illustrate nel Viale delle Fronde, prima privo di incontri: livelli 4–6 e specie diverse per mattino, giorno e notte.
- Il validatore richiede habitat in ogni percorso Rxx. Distribuzioni e probabilità sono contenuti di Veloria; specie e mosse provengono dagli snapshot PokéAPI locali. Cache PWA `veloria-shell-v66`.
- Rimosso il recupero dei Poliwag legacy richiesto nella revisione precedente: la retrocompatibilità non è un requisito del prototipo.

## veloria-content-0.3.46 — 17/10/2026

- Sostituiti i valori e gli apprendimenti manuali con import riproducibile PokéAPI HeartGold/SoulSilver: 25 mosse implementate e fonti complete delle 20 specie. Snapshot API e checksum restano nel repository; i controlli impediscono modifiche manuali divergenti.
- I nuovi Pokémon ricevono mosse compatibili con specie e livello. Corrette le squadre di Sera/Timo/Mira; Poliwag compare dal livello 5, quando dispone di Bolla. Le mosse dei vecchi save vengono conservate per compatibilità.
- Aggiunti assorbimento HP, probabilità delle variazioni statistiche, attacchi multipli e confusione per eseguire gli effetti importati.
- Il report sorgente elenca gli apprendimenti ufficiali ancora non implementati. Cache PWA `veloria-shell-v63`.

## veloria-content-0.3.45 — 17/10/2026

- Le due zone d'incontro del Bosco sono segnate da gruppi di felci illustrate, ricavate dall'atlante piante già registrato. Il cartello d'ingresso spiega dove cercare e la variazione degli incontri con l'orario.
- Le aree sono spostate dal sentiero al terreno forestale; tutte le caselle sono raggiungibili dall'ingresso senza attraversare collisioni.
- Verificata la raggiungibilità di ogni casella d'incontro dall'ingresso, oltre alla probabilità e alla tabella referenziata.
- Cache PWA aggiornata a `veloria-shell-v62`.

## veloria-content-0.3.44 — 17/10/2026

- Tackle compare in 6 delle 20 specie MVP (prima era presente in 15); uccelli, ragni, insetti, acquatici e Pokémon rapidi hanno moveset iniziali più caratteristici.
- Aggiunta Millebave: mossa di supporto di tipo Coleottero che riduce la Velocità avversaria.
- Nei due sottoboschi del Bosco la probabilità d'incontro per passo sale dall'8% al 18%; le tabelle restano separate per fascia oraria, con 14 specie totali e 4–7 disponibili per fascia.
- Cache PWA aggiornata a `veloria-shell-v61`.

## veloria-content-0.3.43 — 17/10/2026

- Le schede delle mosse mostrano effetti di stato, priorità e variazioni statistiche anche nei comandi touch compatti.
- Bilanciamento prototipo v4: Tackle potenza 35, Scratch 40, Pistolacqua 45 e Braciere con 10% di probabilità di scottatura.
- Cache PWA aggiornata a `veloria-shell-v60`.

## veloria-content-0.3.42 — 17/10/2026

- Convertite in WebP 39 immagini runtime e lo sfondo della schermata iniziale: 34,0 MB diventano 6,0 MB; i PNG originali restano registrati come sorgenti.
- Le mappe, gli atlanti creatura e la cache offline usano le copie WebP con checksum aggiornati per gli artwork PokéAPI.
- Il mondo non carica più gli artwork di battaglia all’avvio: la scena carica solo la squadra, l’avversario e le evoluzioni raggiungibili.
- Cache PWA aggiornata a `veloria-shell-v59`.

## veloria-content-0.3.41 — 17/10/2026

- Attive le linee Caterpie → Metapod → Butterfree e Weedle → Kakuna → Beedrill: primo stadio al livello 7, secondo al 10.
- La battaglia presenta la specie evoluta con un breve effetto visivo; ID, esperienza, mosse e stato restano associati alla creatura salvata.
- Cache PWA aggiornata a `veloria-shell-v58`.

## veloria-content-0.3.40 — 17/10/2026

- Rami e Leda hanno sprite originali dichiarati nelle rispettive mappe; Terrazze del Muschio e Radicelmo completano il caricamento invece di restare sulla schermata iniziale.
- Il validatore delle mappe ora controlla che ogni NPC abbia un'immagine registrata e un frame valido.
- Cache PWA aggiornata a `veloria-shell-v57`; prompt, trasparenza e checksum in `assets/prompts/npc-rami-v1.md` e `npc-leda-v1.md`.

## veloria-content-0.3.39 — 17/10/2026

- Rimosse dal layer decorativo del Bosco le 91 tile di prato scuro che, sovrapposte alla base pittorica continua, formavano blocchi rettangolari attorno agli alberi.
- Sentiero, acqua, collisioni, oggetti e connessioni restano invariati; cache PWA aggiornata a `veloria-shell-v56`.

## veloria-content-0.3.38 — 17/10/2026

- Il fondo forestale ora contiene solo campiture di terreno: percorsi e punti d'interesse restano definiti da Tiled e dagli oggetti illustrati, senza strade incorporate nell'immagine di base.
- Le cinque mappe che condividono `veloria-npcs-v2` dichiarano lo stesso atlante `3×2`; il registro asset non si blocca più per definizioni incompatibili.
- Bosco, Viale, Terrazze e Radicelmo condividono il fondo. Geometria, collisioni, interazioni e incontri non cambiano.
- Cache PWA aggiornata a `veloria-shell-v55`; prompt e checksum in `assets/prompts/forest-floor-v1.md`.

## veloria-content-0.3.37 — 17/10/2026

- Bosco, Viale, Terrazze e Radicelmo usano un fondale forestale illustrato completo, senza ripetizione della stessa tile nel sottosuolo.
- `terrainBase` dichiara immagine e tile Tiled di base; il renderer verifica che il layer `ground` contenga solo quel materiale prima di sostituirne la resa. Percorsi, dettagli, collisioni, oggetti e incontri restano nei dati Tiled.
- Asset originale registrato con prompt e checksum in `assets/prompts/forest-floor-v1.md`; PWA aggiornata a `veloria-shell-v54`.

## veloria-content-0.3.36 — 17/10/2026

- Il prato ombreggiato riceve variazioni cromatiche morbide e deterministiche per cella, ricavate da rumore spaziale continuo invece che da tinte isolate.
- Il compositing statico resta in un'unica superficie; cambiano solo i colori di rendering delle celle erbose. Percorsi, collisioni e incontri non cambiano.
- Cache PWA aggiornata a `veloria-shell-v53`.

## veloria-content-0.3.35 — 17/10/2026

- Viale delle Fronde, Terrazze del Muschio e Radicelmo passano al tileset illustrato v5 già usato dal primo tratto dell’avventura.
- Le celle del layer `ground` passano dal vecchio GID 2 al GID 7 (prato ombreggiato v5), come nel Bosco dei Veli. Estensione, oggetti, collisioni, connessioni e incontri restano invariati; il renderer applica blending e variazione deterministica.
- Cache PWA aggiornata a `veloria-shell-v52`.

## veloria-content-0.3.34 — 17/10/2026

- La variazione del terreno usa riflessioni stabili derivate dalle coordinate, superando lo schema a scacchiera che rendeva evidente la ripetizione delle tile.
- I bordi del tileset seamless restano identici, quindi la varietà non introduce fessure né modifica collisioni, incontri o passaggi.
- Cache PWA aggiornata a `veloria-shell-v51`.

## veloria-content-0.3.33 — 17/10/2026

- Phaser e WorldScene vengono caricati dopo la scelta della sessione; il bootstrap iniziale scende da circa 140 kB a 17 kB non compressi.
- Cache PWA aggiornata a `veloria-shell-v50`; l’installazione continua a precaricare anche i moduli dinamici per giocare offline.
- La selezione e il salvataggio della partita restano invariati.

## veloria-content-0.3.32 — 17/10/2026

- La direzione illustrata v5 è ora coerente in Borgofonte, Sentiero dell’Alba e Bosco dei Veli: base pittorica più morbida, campiture leggibili e minore rumore a scala mobile.
- Tutte e tre le mappe conservano gli stessi ID, celle, passaggi e collisioni Tiled; la PWA precarica solo l’atlante HD attivo insieme ai tileset legacy delle altre aree.

## veloria-content-0.3.31 — 17/10/2026

- Il terreno del Bosco usa campiture morbide e forme ampie con pochissimo dettaglio minuto per conservare una lettura illustrata a scala di gioco. La disposizione Tiled dei dodici materiali resta invariata.
- La variante v5 sostituisce v4 dopo la revisione dello screenshot alla scala reale; Borgofonte e Sentiero dell’Alba restano su v3.
- Il renderer allinea i bordi di ogni frame, estrude i gutter Tiled contro l'interpolazione lineare e compone i due layer statici del terreno a risoluzione di mappa per eliminare fessure durante lo zoom mobile.
- Collisioni, coordinate, connessioni e incontri non cambiano. La PWA precarica l’atlante.

## veloria-content-0.3.30 — 17/10/2026

- Il Bosco dei Veli usa un atlante illustrato con forme di terreno più ampie e meno dettagli fini per mantenere la leggibilità a scala di gioco. La griglia Tiled a 12 materiali resta invariata; Borgofonte e Sentiero dell’Alba continuano a usare v3.
- Collisioni, coordinate, connessioni e incontri non cambiano. La PWA precarica entrambi gli atlanti perché mappe diverse li usano.
- Asset prototipo privato, variante visiva da valutare nel playtest.

## veloria-content-0.3.29 — 17/10/2026

- Le definizioni dell’atlante NPC condiviso ora sono uniformi tra le mappe, evitando il conflitto che impediva l’avvio della partita.
- Borgofonte, Sentiero dell’Alba e Bosco dei Veli usano una nuova variante illustrata del tileset HD, con gli stessi dodici materiali, la stessa griglia e gli stessi ID Tiled.
- Le mappe dichiarano il nuovo asset; collisioni, coordinate, passaggi e logica d’interazione non cambiano. Il servizio PWA precarica la versione aggiornata.
- La direzione approvata viene registrata come illustrazione 2D moderna, superando la pixel art densa come obiettivo per nuovi ambienti.

## veloria-content-0.3.28 — 17/10/2026

- Cartelli, rocce muschiose, fiaschetta-seme e misuratore della missione usano un atlante illustrato originale. I frame sono selezionati dai dati Tiled; le immagini vengono dichiarate per mappa e incluse nella cache offline.
- MapDefinition v2 dichiara la griglia di un atlante nell'asset stesso. Il renderer recupera i frame da questa configurazione invece di associare colonne/righe a chiavi texture specifiche.
- Collisioni, interazioni, coordinate e comportamento delle targhe restano separati dall'illustrazione.

## veloria-content-0.3.27 — 17/10/2026

- Otto gruppi botanici illustrati arricchiscono i prati di Borgofonte. Sono istanze esplicite Tiled, disposte ai margini e senza collisioni. Le texture HD del terreno usano riflessioni deterministiche per coordinata per ridurre il motivo periodico senza effetti casuali tra partite.
- L’atlas originale è precaricato per il gioco offline e registrato con prompt e frame in assets/prompts/borgofonte-plants-v1.md. Asset di prototipo, revisione visiva pendente.

## veloria-content-0.3.26 — 17/10/2026

- Borgofonte ora usa quattro facciate originali illustrate: casa, emporio, laboratorio e officina. I frame atlas restano dichiarati nei dati Tiled; il renderer conserva dimensioni, interazioni e collisioni.
- La build offline precarica il nuovo atlante; nessuna modifica al salvataggio o alle regole di gioco.
- Asset generato originale per Veloria, uso di prototipo e revisione visiva umana ancora pendente. Prompt e dettagli in assets/prompts/borgofonte-buildings-v1.md.

## veloria-content-0.3.18

- Applied the user's child-friendly UI direction: sky/cream shell, coral/lilac/blue tactile controls, larger rounded typography, brighter dialogue and journal panels, and distinct battle command colours with labels and keyboard focus indicators.
- Shared HTML UI tokens live in `src/ui-theme.css`; the map illustration style, collision grid, quest rewards and save schema are unchanged.
- Updated the PWA chrome and project-owned vector icon colours; PNG icons are rendered from those SVG sources. Shell cache v32 includes the refreshed build and icons.

## veloria-content-0.3.17

- Added a four-direction, sixteen-frame traveler walk atlas and continuous tile interpolation; collision, interaction and save coordinates stay unchanged.
- Added a journey HUD and accessible journal with nine milestones derived from existing flags, real quest rewards, collection and badges. Completion cards are deferred until battle dismissal when necessary.
- Replaced geometric battle creatures with illustrated atlas entries for Caterpie, Metapod, Butterfree, Weedle, Kakuna, Beedrill, Spinarak and Mareep. Other twelve species, including the four starters, still need authorized illustrations: image generation rejected those sheets, and unavailable art stays explicit rather than loading broken URLs.
- Added event-driven attack, damage, healing, capture, KO and level feedback; HP transitions, real XP progress and a battle reward summary. Enlarged touch commands and provided compact portrait and landscape layouts. Battle resolution and balance remain unchanged.
- Registered three generated assets and precached them in shell v30. Exact prompts and generation coverage are recorded in `assets/prompts/character-modernization-v1.md`; no save migration.

## veloria-content-0.3.16

- Added original bedroom and laboratory interiors in Borgofonte, with reciprocal doors, furniture collisions, research hotspots, and a resting service in the bedroom.
- Moved Elia into the laboratory: the existing starter choice and research-reading quest now take place indoors. Existing saved parties, flags and exterior map IDs remain compatible.
- Registered and precached both room backdrops; generation prompts are recorded in `assets/prompts/borgofonte-interiors-v1.md`. Maps remain prototype art pending human visual acceptance.
- Fixed healing persistence: cleared statuses are omitted from healed creatures, and checksums use the same representation for optional undefined object fields as JSON backups. Browser healing scenarios now start from validated wounded/poisoned records.

## veloria-content-0.3.15

- Added an original Brumalta city-park vista and an interactable directional sign to the Viale delle Fronde, making the forest-to-city transition readable in the Tiled map.

## veloria-content-0.3.14

- Added original community lodge and herbalist sprites for Radicelmo, replacing Brumalta's reused facades; both are registered and included in the offline shell cache.

## veloria-content-0.3.13

- Added the playable R03 moss terraces and Radicelmo village, with reciprocal travel links and Aurora Badge access from Brumalta.
- Added a time-of-day woodland encounter table, Leda's seed archive quest, a village healing service and herb shop, and a greenhouse landmark.
- Registered and precached an original Radicelmo greenhouse sprite; the route and village reuse the established forest tileset and battle backdrop.

# Content changelog

## Unreleased

- Borgofonte's exit to the Sentiero dell'Alba now stays closed until the player chooses a starter with Elia.

## veloria-content-0.3.12

- Added an original, compact forest-edge battle background referenced by the grassland and forest map definitions. The fallback arena remains available for maps without a declared background.

## veloria-content-0.3.11

- Added an original Bosco dei Veli pond sprite overlay and a reusable Tiled `decorations` layer for declared scenery images. The pool remains non-walkable; the existing water shimmer sits above the artwork.

## veloria-content-0.3.10

- Added deterministic water highlights to the Bosco dei Veli pool. They shimmer at full animation quality and remain faint and static with reduced motion.

## veloria-content-0.3.9

- Added reduced-motion aware grass sway to the four tall-grass encounter patches on the Sentiero dell’Alba. Visual areas reference Tiled encounter zones and do not alter gameplay.

## veloria-content-0.3.8

- Added a data-driven Bosco dei Veli firefly effect profile. Motion quality settings keep reduced mode static and lighter.

## veloria-content-0.3.7

- Added a persistent full/reduced movement animation setting that defaults to the operating system's reduced-motion preference.

## veloria-content-0.3.6

- Added versioned original procedural music themes for each MVP area and battle type, with a persistent volume control.

## veloria-content-0.3.5

- Added original 192×160 shop and gym facade sprites for Brumalta and declared them in the map metadata, Tiled objects, asset register, and offline shell cache.

### 0.3.19 — Avvio del viaggio

- Introduzione narrativa versionata con nome allenatore e indicazioni al laboratorio.
- Requisito della scelta starter dichiarato nel relativo catalogo e applicato all’uscita da Borgofonte.
- Profilo nome e flag del prologo compatibili con i salvataggi v2 esistenti.

## 0.3.20 — 17/10/2026

- Catalogo mosse versione 2: effetti statChanges per Growl, Tail Whip e Defense Curl; regole prototipo esplicite nel decision log.

## 0.3.21 — 17/10/2026

- Matrice tipi Gen II–V completa, sorgenti/hash registrati; profili IA versionati e collegati agli allenatori.

## 0.3.22 — 17/10/2026

- Regole di emergenza per esaurimento PP, parametri versionati nel ruleset prototipo v4. Nessun nuovo slot o campo persistente.

## 0.3.23 — 17/10/2026

- Guida iniziale condizionata dai flag, testo esplicito sulle uscite e soglia nord di Borgofonte estesa sul vialetto. Artwork starter locali richiesti dall’utente per il prototipo privato.

## 0.3.24 — 17/10/2026

- Tre mosse elementali e learnset curato al livello 6 per i quattro starter.
- Mira: Sentret lv7/Rattata lv8; profili IA v2 con una preparazione difensiva per la prima palestra.

## 0.3.25 — 17/10/2026

- Immagini per le otto specie mancanti, sei NPC originali e terreno/vegetazione HD.
- Guida del Bosco: sensore, Ada, uscita per il Viale; testi e missione coerenti.
- Collisioni, ricompense e salvataggi conservano lo schema precedente.
