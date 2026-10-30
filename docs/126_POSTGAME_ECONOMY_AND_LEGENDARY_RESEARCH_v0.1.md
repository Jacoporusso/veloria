# Economia ripetibile, dopogioco e ricerca dei leggendari

Avanzamento0.4.46: la prima tranche allenamenti ripetibili è implementata dal menu, accessibile dopo la prima visita alla Lega e anche durante i viaggi; edificio/NPC dedicati non aggiunti. Specifiche, premi e prove nel documento127. Coppe, rivincite itineranti e indagini/catture dei leggendari restano da implementare. Le sezioni successive conservano il piano completo.

Requisiti utente30ottobre: partita arrivata al termine della Lega e tutti i Pokémon raccolti; mancano attività per allenare la squadra e recuperare monete, acquisti sostenibili alla Lega e obiettivi dopo il completamento. I leggendari sono troppo facili da trovare e catturare. Questo documento è un piano implementativo, non una dichiarazione di funzionalità già consegnate.

## Evidenza corrente

Il Mercato della Lega esiste, con Pozione, Superpozione, Iperpozione, Antidoto, Antiparalisi e Sfera; non è una nuova fonte di monete. Le ricompense della sequenza Lega sono intenzionalmente pagate una volta tramite firstRewardFlag. Non basta riabilitarle senza distinguere tentativo, vittoria e ricevuta persistita: rischierebbe pagamenti duplicati al reload. Il catalogo attuale non implementa strumenti tenuti/equipaggiabili: ampliarli richiede effetti reali e dati di fonte, non solo voci di negozio.

La cattura in src/core/battle/engine.ts usa baseChance + missingHpBonus × quotaPSmancanti + statusBonus. La Sfera dichiara0,25/0,55/0,20 in content/items/items.v1.json: con pochi PS e status la chance si avvicina a1 indipendentemente dalla specie. Le fonti locali PokéAPI pokemon-species contengono già capture_rate: Pidgey255, Snorlax25, Articuno/Zapdos/Moltres/Mewtwo3, Mew45. Mew è mythical, non legendary. Non imporre quindi un valore identico a tutte le specie rare.

## Priorità1: allenamento e monete già all'arrivo alla Lega

Accesso evidente dal piazzale e dall'accoglienza, prima di diventare Campione. Ingresso gratuito, cura e mercato raggiungibili; non richiede strumenti acquistati o denaro per sbloccare l'unico modo di guadagnare. Livello della sfida selezionabile e mostrato prima di iniziare, fasce iniziali proposte30/40/50/60/70/80 da bilanciare. Squadre avversarie varie, sorteggiate da pool curati GenI e coerenti con il livello; tipi, statistiche e mosse derivano dal catalogo/PokéAPI, con mosse realmente apprendibili. Nessuna alterazione nascosta del livello dopo la scelta.

Ogni vittoria assegna monete ripetibili e allenamento reale; ricompensa dichiarata in anticipo e proporzionata alla fascia. La simulazione deve verificare quante vittorie servono per Sfera150, Pozione200, Superpozione700 e Iperpozione1500, per evitare un nuovo grind obbligato. Sconfitta/interruzione non paga e non introduce debiti. Nessun limite giornaliero, attesa reale o serie giornaliera richiesta. Il tentativo ha un'identità e una sola liquidazione persistita: reload, doppio click o retry di salvataggio non pagano due volte. La squadra generata e il consumo RNG sono fissati all'avvio confermato, non ricalcolati a ogni apertura del menu.

Successivamente rivincite degli allenatori sui percorsi e incarichi ripetibili rendono utile tornare nelle varie zone. Ricompense della storia, doni Pokémon e medaglie restano una tantum. La funzione ripetibile ha un contesto proprio e non rimuove i flag di missioni già concluse.

## Priorità2: motivi per giocare dopo Lega e Pokédex

Coppe con regole leggibili: per esempio squadre di tre, sfide di tipo e serie di incontri. Progressione per traguardi permanenti, trofei/titoli e ricompense utili o cosmetiche; avversari e strategie differenti invece della sola crescita dei numeri. Primo ciclo di coppe con squadra reale; eventuali livelli normalizzati richiedono una proiezione di battaglia separata che non sovrascriva livello, mosse, PS o progressi permanenti. Nessuna perdita dei Pokémon già raccolti. Obiettivi nel diario e nella mappa, distinti dalle missioni della storia completata.

Gli incarichi di ricerca possono chiedere uso di tipi, vittorie con condizioni e osservazioni ambientali. Dopo151 catture non devono ridursi a raccogliere altre copie degli stessi Pokémon. Altre città e leghe delle generazioni successive restano un'espansione distinta, senza introdurre GenII nel catalogo di Veloria.

## Priorità3: leggendari da scoprire, non segnalini esposti

Indicazione iniziale di una macrozona plausibile, senza coordinate, sprite del leggendario o pin esatto. Piccola indagine coerente con il luogo: voce di un personaggio, tracce nell'ambiente, collegamento fra indizi, prova ambientale e accesso al rifugio. Esempio proposto per Articuno: ricostruire correnti fredde e attivare punti ambientali prima dell'apertura del rifugio. È una proposta di contenuto Veloria, non un fatto ufficiale Pokémon già documentato.

Il diario conserva gli indizi e propone aiuti progressivi comprensibili anche ai bambini. Evitare ricerca di pixel, tap casuali, attese del mondo reale e una lunga checklist di oggetti. Registrare anche gli indizi trovati prima di parlare al personaggio che assegna la ricerca; rileggere lo stato corrente quando si torna da lui, evitando il blocco già osservato con Ada/sensore.

La mappa mostra la regione di ricerca fino alla scoperta. I collegamenti dal diario puntano al prossimo indizio conosciuto, non al leggendario nascosto. Il catalogo delle scoperte non deve esporre le coordinate finali attraverso pin, legenda, lista, pannelli accessibili o il collegamento diretto della missione. Il pin preciso può comparire solo dopo lo sblocco narrativo del rifugio. Regole separate per doni/pesca/missioni comuni: non annullare i loro punti esatti richiesti dall'utente.

Ogni leggendario richiede un percorso differente, seguito da un incontro preparato e cattura che usi capture_rate della specie, PS, status e Ball coerenti con il modello scelto. Importare/verificare i dati di tutte151 specie, senza moltiplicatori inventati nascosti o presunte formule ufficiali non verificate. Combattimento e ricerca devono dare difficoltà; non limitarsi a obbligare decine di lanci. KO/fuga devono consentire un nuovo tentativo esplicito senza perdere permanentemente la possibilità di completare il Pokédex. Le catture già ottenute dall'utente restano ottenute.

## Gate di verifica

Allenamento: accesso con zero monete, scelta livello, squadre/mosse legali, vittorie ripetibili, perdita/uscita, monete/XP/strumenti, salvataggio atomico e retry/reload, UI touch nei due orientamenti e offline. Ricerca: indizi in ordine libero, registrazione persistente, aiuti, nessuno spoiler nelle superfici della mappa/diario, rivelazione solo a prova completata, ritentativo e catture pregresse conservate. Cattura: dati di fonte per151 specie, confronto comune/raro/leggendario, effetti dei PS/status/Ball e prove RNG deterministiche. Nessun gate è attestato solo da questo piano.
