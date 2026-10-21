## 0.3.111 — Evoluzione di Magneton e controlli PC (21/10/2026)

- Abilitata Magnemite → Magneton al livello 30, condizione ufficiale già nelle fonti locali: catalogo e artwork urbano erano presenti, mancava la regola evolutiva. Nessuna soglia o statistica inventata.
- Prove di soglia/sotto soglia, identità, HP/PP, cerimonia e salvataggio per Magneton. Regressioni mouse sul pulsante A per Elia e Ada in finestra PC con comandi visibili.
- Estesa la prova naturale verso Vetracielo: il primo tentativo ha perso contro Oren dopo Dalia. Preparazione e rivincita aggiunte al percorso di test; terza medaglia ancora da confermare. Aggiornata la documentazione storica di Vetracielo. Cache PWA v132.

## 0.3.110 — Personaggi solidi e prova fino a Dalia (21/10/2026)

- Collisioni esplicite per 14 NPC: non si attraversano più Ada, Nila e gli altri personaggi interessati. Test geometrici su tutte le mappe con cancelli chiusi/aperti preservano percorsi e accesso alle interazioni.
- Estesa la prova naturale dal nuovo allenatore alla seconda medaglia, passando per Nila, Centro Pokémon, allenamento selvatico e acquisti con monete guadagnate. Salvataggio e ripresa verificati; altri starter e campagna completa restano da verificare.
- Cache PWA v131. Evidenze e stato di pubblicazione in docs/CI_STATUS.md.

## 0.3.109 — Curve XP ufficiali per specie (21/10/2026)

- Tutte79 specie usano la propria categoria di crescita PokéAPI: quattro tabelle locali con le soglie dei livelli1–100, fonti e checksum riproducibili senza rete. Eliminata la curva unica provvisoria dal catalogo runtime.
- Contratto progressionv2 e rulesetv12; il motore calcola i delta ufficiali, mantiene XP residui, livelli, mosse ed evoluzioni. La barra XP usa la stessa curva. Nessun moltiplicatore di ricompensa aggiunto.
- Riallineata la prova naturale ai controlli moderni e ai passaggi di Borgofonte: due nuove partite fino a Mira/Radicelmo prima e dopo la modifica, senza preparare squadra, seed, risorse o flag. Risultati e limiti nel resoconto21/10; campagna completa e tutti gli starter restano da verificare.
- Retry limitato dei reset di trasporto nel caricamento del test di Nilo; invariati gli asserti di lotta, premio e persistenza. Cache PWA v130.

## 0.3.108 — Allenamenti sulla costa e in montagna (21/10/2026)

- Quattro sfide facoltative: Noemi nelle Dune Salmastre, Bruno nelle Canne, Ruben nella Valle del Vento e Alma sui Tornanti Bianchi. Squadre da tre membri con mosse ufficiali HGSS valide al livello indicato.
- Diario, dialoghi e feedback strategico; rifiuto libero, premi unici e collisioni aggirabili. Nessun nuovo gate di percorso.
- Misurato il miglioramento del budget XP, con limiti espliciti: il bilanciamento naturale resta aperto. Catalogo79 specie invariato;31 allenatori e53 missioni. Cache PWA v129.

## 0.3.107 — Sei evoluzioni dai sentieri (21/10/2026)

- Pidgeotto→Pidgeot al36, Oddish→Gloom al21, Poliwag→Poliwhirl al25, Bellsprout→Weepinbell al21, Voltorb→Electrode al30 e Spinarak→Ariados al22. Condizioni ufficiali da fonti PokéAPI locali; nessuna modifica alle zone incontri.
- Catalogo a79 specie: statistiche HGSS, learnset supportati e artwork lossless con fonti/checksum. Le mosse non implementate restano esplicitamente escluse; nessuna mossa sostitutiva inventata.
- Cerimonia, scheda Squadra, identità/HP/PP e persistenza verificati per tutte sei le forme. Immagini incluse nella cache PWA v128 e decodificate senza rete.
- Validatore: il gruppo evolution usa la propria pipeline dedicata, evitando una seconda validazione con percorsi generici incompatibili. Tempo CI del percorso catture/box adeguato al ritorno finale misurato, senza eliminare verifiche.

## 0.3.106 — Stabilizzazione della lotta e dei percorsi (21/10/2026)

- La regione di gioco segnala il caricamento della lotta fino alla creazione dei controlli interattivi; il segnale viene pulito anche in caso di errore o uscita.
- Geometria condivisa fra carte, messaggi e test touch della build di produzione: eliminate le coordinate dei comandi precedenti. Nessuna modifica alle regole della lotta.
- Verificati offline cattura e tre medaglie con progressi salvati; passati anche Pidgey, Petalora/Nila, Radicelmo e ritorni dalla montagna. Budget CI mirati ai tempi di percorrenza misurati, con tutti gli asserti mantenuti.
- Documentato il prossimo batch di sei evoluzioni ufficiali nel documento33; si tratta di un piano, non di nuove specie già giocabili. Cache PWA v127.

## 0.3.105 — Nuovo selettore della lotta (21/10/2026)

- Integrato il mockup approvato: carte mosse con icona del tipo, categoria, potenza o danno fisso, precisione attuale, PP, efficacia ed effetti di supporto. Eliminata la barra di anteprima.
- Stima danno solo nei dettagli individuali ⓘ, con pulsante Usa; dati e regole reali del catalogo locale, nessuna previsione inventata dal mockup.
- Barra inferiore Lotta/Borsa/Cattura/Squadra/Fuga: passaggio fra pannelli senza turno, azioni disabilitate durante la risoluzione, conferma della fuga. Interfaccia laterale nei landscape corti, compreso 568×320.
- Navigazione da tastiera, mosse esaurite, sostituzione obbligatoria e cerimonie conservate. Test aggiornati ai target reali; il mockup HTML resta come riferimento separato.

## 0.3.104 — Lettura libera del sensore e stabilizzazione (21/10/2026)

- Bosco dei Veli: il sensore registra la lettura prima di parlare con Ada e anche senza il secondo briefing di Elia. Ada riconosce i dati dopo il reload; premio e uscita conservano il requisito della lettura e non si duplicano.
- Diario: dopo una lettura indipendente indica Ada e poi Brumalta; il briefing saltato resta facoltativo, senza assegnare flag mai guadagnati.
- Anteprima mosse: un bersaglio immune non mostra più una probabilità di stato impossibile.
- Test di cattura/evoluzione riallineati alle cerimonie e ai dettagli espandibili; comandi touch attesi fino alla creazione della scena. Scenari grafici riallineati ai fondali illustrati. Limiti CI mirati ai tempi misurati, senza togliere controlli.

## 0.3.103 — Continuità grafica delle mappe (21/10/2026)

- Quattordici fondali illustrati completi da Sentiero dell’Alba a Ferraluce, comprese Brumalta, Radicelmo, Petalora e le prime due palestre. Materiali, vegetazione e luce coerenti con gli scenari avanzati.
- Decorazioni già dipinte escluse dal rendering duplicato; personaggi, incontri, puzzle e servizi restano elementi indipendenti.
- Indicatore discreto sul bersaglio interagibile vicino al personaggio. Geometria di collisioni e passaggi verificata identica.
- Provenienza, prompt, revisioni e checksum di ogni immagine registrati; nuove risorse incluse nella cache PWA v124.

## 0.3.102 — Animazioni di lotta e cerimonie (20/10/2026)

- Attacchi fisici con preparazione/affondo, graffi distinti dalle scie; scariche elettriche, getti, foglie, cristalli e anelli secondo il tipo della mossa.
- Impatti, immunità, schivata, cure, variazioni delle statistiche e simboli degli stati mostrati a partire dagli eventi risolti dal motore.
- Lancio della sfera con traiettoria arcuata; cattura con sigillo, anello di luce, particelle e comparsa del Pokémon.
- Evoluzione con ingresso della forma precedente, orbite, convergenza delle particelle, silhouette e rivelazione luminosa.
- Salto, rotazione e chiusura della scena puliscono gli effetti; modalità ridotta mantenuta. Nessuna modifica a danni, probabilità, PP o turni.

## 0.3.101 — Strategia, evoluzioni e Borgofonte (20/10/2026)

- Mosse: efficacia nelle carte e dettaglio contro l’avversario, fattori dei singoli tipi, effetti e probabilità, precisione base/attuale, PP e stima danni. Paginazione per gli schermi piccoli.
- Evoluzioni per livello solo alla vittoria, con attesa, silhouette e rivelazione saltabile. Catture con rivelazione e scheda del Pokémon.
- Pietrafocaia, Pietraidrica e Pietratuono da Zaino/Squadra con anteprima; consumo, evoluzione e ricevuta salvati insieme. Recupero della cerimonia dopo reload, senza duplicare il costo.
- Dati ufficiali HGSS locali per Raichu, Vaporeon, Jolteon e Flareon; prima pietra nella serra di Radicelmo e bottega dopo Corolla.
- Borgofonte illustrata, percorsi e soglie riallineati; indicatori delle uscite e transizioni con input protetto.

## 0.3.100 — Indietro nella lotta mobile (20/10/2026)

- Pulsante Indietro con area124×44, separata dai comandi e dal collegamento ai dettagli. Spazio riservato anche in Borsa/Squadra/Cattura; nessun turno o PP consumato tornando al menu.
- Due prove touch passate in portrait390×844 e landscape844×390, toccando il margine del pulsante. Revisione dei dettagli mosse e nuove presentazioni di evoluzione/cattura ancora da implementare secondo il design concordato.

## 0.3.99 — Interazione iniziale da PC (20/10/2026)

- Le pressioni brevi di frecce/WASD aggiornano subito movimento e direzione: il primo tocco non dipende più dal campionamento del fotogramma.
- Invio si aggiunge a E e Spazio per parlare. Indicazioni, dialoghi e suggerimenti distinguono tastiera desktop dal pulsante A touch.
- Selezione dello starter con Invio/Spazio senza intercettazione da parte dei comandi del mondo. Quattro prove desktop Elia→starter→Ada e regressione touch passate. Cache v120.

## 0.3.98 — Allenamenti sui percorsi (20/10/2026)

- Iris su R06, Dario su R07, Viola su R08 e Celia su R11: sfide facoltative, suggerimenti sui tipi, premi unici e passaggi liberi. Squadre con mosse HGSS legali.
- 27 allenatori e 48 missioni; audit XP aggiornato con i nuovi contenuti. Il bilanciamento naturale rimane aperto; nessun moltiplicatore nascosto.
- Quattro vere lotte touch, rifiuto, premi dopo reload e uscite verificati nel browser. Cache v119; dettagli offline e pubblicazione nel CI_STATUS.

## 0.3.97 — Rifornimenti intermedi e audit della crescita (20/10/2026)

- Superpozioni e Antiparalisi a Ferraluce, Portolume e Acquariva; anche Iperpozioni a Passobrina e Biancavetta. Oggetti e prezzi del catalogo corrente, cache v118.
- Audit riproducibile dell'esperienza con funzioni reali del motore, squadre e habitat correnti. Il report distingue budget ottimistico da partita naturale: la distribuzione degli allenatori resta insufficiente e richiede implementazione ulteriore.
- Cinque prove browser verificano acquisti, denaro e reload nei mercati modificati. Corretto l'isolamento della fixture v1: non lascia più un backup v2 recente che prevale correttamente sul salvataggio artificiale.

## 0.3.96 — Lega, Campione ed epilogo (20/10/2026)

- Cinque sale illustrate originali, quattro membri del Consiglio e Campione: tentativi ordinati, otto medaglie richieste, nessuna cura automatica, uscita esplicita e ripresa tra le tappe.
- Premi assegnati una sola volta; cerimonia con la squadra attuale ed epilogo recuperabili dopo il ricaricamento. Nessun albo storico o post-game dichiarato completo.
- Ronzio e Velenpuntura importati da PokéAPI con apprendimenti ufficiali. 48 mappe, 44 quest, 23 allenatori, 11 negozi, 270 asset, 69 specie e 78 mosse; cache v117.
- Salvataggi: selezione dello snapshot valido più recente tra IndexedDB e riserva locale; revisione monotona anche dopo errori di scrittura. Avvio lotta bloccato se entrambi gli archivi falliscono.
- 451 test dominio, 25 persistenza, 103 Python e sette casi browser passati. Verifica offline e stato pubblicazione in CI_STATUS. Bilanciamento naturale, catalogo 251 e ulteriori meccaniche restano aperti.

## 0.3.95 — Cammino dell’Equilibrio e piazzale della Lega (20/10/2026)

- R16 dopo il rapporto del Santuario, tre habitat laterali, Maia/Tobia facoltativi, piazzale con cure/deposito/mercato/accoglienza e ritorni.
- Due ambienti illustrati originali, diario/atlante e cachev116.43mappe,42quest,18allenatori,11negozi,260asset.
- Cinque mosse ufficiali HGSS aggiunte,76totali; tutti gli apprendimenti aggiornati, senza assegnare mosse MT come mosse per livello.
- Core puro delle sfide sequenziali e nove test, ancora da collegare alle sale della Lega. Finale sportivo, epilogo, bilanciamento naturale e catalogo completo restano aperti.

## 0.3.94 — Santuario delle Due Luci (20/10/2026)

- Nuovo ambiente illustrato originale e accesso dal padiglione orientale di Concordia dopo P8, con ritorno sempre disponibile.
- Conclusione della ricerca sulla Risonanza: due letture, consenso esplicito con Elia, regolazione qualitativa a tre controlli, verifica del ricevitore e rapporto con premio unico. Nessuna distruzione della rete o nuova fazione antagonista.
- Diario e atlante aggiornati, segnale visivo del ricevitore, cachev115. Il feedback di regolazione riuscita sostituisce il precedente errore.
-41mappe,39quest,256asset. R16, Lega, finale e bilanciamento naturale restano aperti. Verifiche e pubblicazione in CI_STATUS.

# Changelog — Veloria Project Pack

## 0.3.93 — 20/10/2026 — locale, non ancora pubblicata

- Passo delle Due Luci, Concordia e ottava palestra illustrati, con letture indipendenti, servizi, habitat facoltativo e incontro opzionale con Nilo.
- Elia propone riesame, rinvio o decisione esplicita di ripristino: solo quest’ultima apre la palestra. Santuario, Lega e finale restano da implementare.
- Puzzle dichiarativo a due sorgenti: entrambi i flussi devono raggiungere il ricevitore. Relè persistenti, cancello dinamico, Aurel e Medaglia Armonia con banner e premio unico.
- Sei specie ufficiali aggiunte; catalogo a 69 specie e 71 mosse supportate. Nuove medicine importate da fonti PokéAPI locali; prezzi correnti del prototipo, senza attribuirli al listino storico HGSS.
- Cinque prove browser passate in circa 3,5 minuti. Il Dewgong75 della prova contro Aurel verifica l’integrazione, non il bilanciamento naturale. Offline del capitolo, pubblicazione e CI completa ancora da attestare.

## 0.3.92 — 20/10/2026

- Ponte illustrato a est di Biancavetta, Varco del Cristallo e grotta a tre terrazze con scalinate, rifugio e habitat facoltativi.
- Ricerca di calore e correnti, console con controlli discreti, reset e verifica esplicita. Letture e regolazioni persistono; ricevitore alto e rapporto a Livia assegnano una volta 700 monete e due Pozioni.
- Sistema di regolazione ambientale dichiarativo e riusabile, separato da scene e contenuti; validazione Python e test di stati, limiti, reset e prerequisiti.
- Geodude, Graveler, Onix, Zubat e Golbat da fonti ufficiali locali. Evoluzioni per livello Zubat22/Geodude25; scambi conservati come riferimenti senza livelli inventati.
- Corretto il riferimento evolutivo: catalogo giocabile Gen I–II distinto dalle informazioni ufficiali HGSS/Gen IV. Ripristinati Magnezone e le evoluzioni di Eevee; descritte Forzantica per Mamoswine e Affilartigli/notte per Weavile senza abilitare target fuori catalogo.
- Prove touch del capitolo completo e ritorni, menu portrait/landscape, Pokédex/Squadra e primo accesso offline. R15/Concordia e finale restano da implementare.

## 0.3.91 — 20/10/2026

- Capitolo montano: R12, Passobrina, R13, Biancavetta e P7 con cinque nuove illustrazioni originali, percorsi e servizi. Nuova scala illustrata a nord di Acquariva.
- Ricerca climatica con tre letture in ordine libero, rapporto e premi unici. Diario e atlante aggiornati.
- Tre piste di ghiaccio, sigilli, console e cancello dinamico; Nives, Medaglia Brina, banner e sblocco della funivia nei due sensi.
- Trasporto locale dichiarativo per battello/funivia; validazione di rotte, flag, terminali e arrivi sicuri. Arrivo del battello all’osservatorio reso adiacente al terminale.
- Sei specie montane e sette mosse ufficiali aggiunte, evoluzioni Swinub/Seel e artwork locali. Delibird resta escluso finché Present non sarà supportata. Fonti oltre Gen II conservate ma non importate nel runtime.
- Prove di percorso completo e ritorni, quest in tutti gli ordini, puzzle con reload, battaglia, medaglia unica e funivia. Stato offline/pubblicazione/CI nel relativo documento.

## 0.3.90 — 20/10/2026

- La selezione in battaglia sopravvive a resize e rotazione; ignorati eventi resize senza variazioni delle dimensioni. Corrette le fixture browser per usare il normale osservatore del viewport.
- Aggiunta meccanica riusabile per superfici ghiacciate in Tiled, con collisioni, arresto, trigger per tile, salvataggio e controlli di raggiungibilità che distinguono attraversamento e fermata.
- Preparati contratto del capitolo montano e geometria preliminare della P7, con soluzione e ritorni verificati. R12, Passobrina, R13, Biancavetta, P7 e funivia non sono ancora mappe giocabili.

## v0.3 — 09/10/2026

- Consolidati GDD v0.1 e World Map Design v0.2 originali senza sovrascriverli.
- Inclusa mappa illustrata della regione, concept approvato come direzione grafica.
- Aggiunte specifiche MVP, architettura, art direction, ruleset decision log, content pipeline, backlog, playbook AI, note diritti, revisione mappa.
- Aggiunti dati di esempio e validatore locale senza dipendenze.
- Esplicitato che lo ZIP non è ancora il gioco, e che la mappa artistica non è una tilemap Tiled.
- Chiarito il perimetro delle specie MVP e il tema delle evoluzioni raggiungibili.

## v0.2 — 09/10/2026

- Definita geografia regionale, città, otto Palestre, dungeon e 16 percorsi.

## v0.1 — 09/10/2026

- Stabilita visione di progetto PWA Phaser e vertical slice.

## 17/10/2026 — Atlante immersivo approvato

- Integrato il prototipo approvato: mappa a tutto schermo, menu compatto, obiettivo richiudibile, dialoghi e pannelli blu con gradienti.
- Ripristinati esattamente aspetto e griglia del pad originale; azioni A/B/S a sinistra e movimento a destra.
- Camera adattiva a stanze, mappe ampie e rotazione del dispositivo; PWA shell v33.

## 17/10/2026 — Nuova partita e prologo

- Schermata titolo Atlante con continua, conferma nuova partita e nome allenatore.
- Introduzione personalizzata, indicazioni a laboratorio/Elia, comando A contestuale e descrizioni degli starter.
- Riepilogo del primo capitolo dopo Mira, con dati reali di squadra e salvataggio.
- Contenuti 0.3.19, cache PWA v34; i vecchi salvataggi restano compatibili.

- Salvataggio iniziale con errore visibile e riprova; ritorno al titolo solo dopo scrittura riuscita, con test browser di memoria esaurita.

## 17/10/2026 — Effetti delle mosse di stato

- Ruleset prototipo v2: Growl, Tail Whip e Defense Curl modificano le statistiche durante la battaglia.
- Effetti definiti nei dati, limiti e reset al cambio/cattura; nessuna modifica allo schema dei salvataggi.
- Contenuti 0.3.20 e cache PWA v35.

## 17/10/2026 — Efficacie dei tipi e IA

- Matrice locale completa di 17 tipi con provenienza PokéAPI registrata; ruleset prototipo v3.
- IA pura collegata ai profili allenatore: efficacie, mosse di preparazione utili e rotazione dei selvatici.
- Contenuti 0.3.21, cache PWA v36; nessuna modifica allo schema save.
- CI: i nuovi commit attendono la verifica in corso invece di cancellarla; resta in coda la revisione più recente.

## 17/10/2026 — Battaglie senza PP

- Scontro d’emergenza per entrambe le squadre: nessun PP aggiunto, contraccolpo e gestione del doppio KO.
- Corretti i cambi infiniti tra riserve senza PP e il ripristino errato di sonno/congelamento dopo il recupero.
- Ruleset prototipo v4; contenuti 0.3.22 e cache PWA v37.

## 17/10/2026 — Starter visibili e uscita verso R01

- Quattro artwork PokéAPI locali su richiesta dell’utente per il prototipo privato, con fonti e checksum registrati.
- Indicazioni dopo la scelta e soglia nord del villaggio corrette; test reale fino al Sentiero dell’Alba.
- Contenuti 0.3.23, cache PWA v38.

## 17/10/2026 — Progressione e playtest naturale

- Apprendimento al livello 6 dei quattro starter, con eventi UI e persistenza negli slot esistenti.
- Prima calibrazione di Mira basata su partite senza preparazione artificiale.
- Playtest lungo separato dalla CI, con rapporto di battaglie/progressi e verifica del salvataggio finale.
- Ruleset prototipo v5; contenuti 0.3.24 e cache PWA v39.

- Cattura raggiungibile da tastiera anche con opzioni adiacenti disabilitate; riepilogo capitolo protetto dal tasto ancora premuto.
- Prologo completato tramite controlli reali con tutti e quattro gli starter, cattura e salvataggio/ripresa verificati.

## 17/10/2026 — Personaggi e mondo più definiti

- Sei NPC illustrati, quattro varianti di chioma, terreno HD a Borgofonte/R01/Bosco e rendering indipendente dalla griglia 32 px.
- Pidgey e altre sette specie ora visibili con artwork locali registrati; tutte le 20 specie MVP coperte.
- Pulsanti battaglia navy a gradiente e icone, ridimensionamento osservato per rotazione mobile.
- Sensore riconoscibile e utilizzabile anche dalla sua casella; guida contestuale e indicazioni precise di Ada.
- Contenuti 0.3.25, cache PWA v40; prompt originali conservati.
