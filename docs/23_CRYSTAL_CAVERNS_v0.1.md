# Varco e Grotte del Cristallo — capitolo 0.3.92

## Stato

Integrato localmente; non ancora pubblicato. La versione pubblica confermata resta 0.3.91. Sette prove browser riuscite in 1,7m: attraversamento completo/ritorno, console e cinque regressioni dei pannelli Pokémon. Offline passato in15,2s (27,5s inclusa build). 392 dominio +16 persistenza, 74 Python e validatore globale passati:236asset/37mappe/34quest/14allenatori/9negozi. R15 e Concordia/P8 restano capitoli successivi: l’arco alto è un ricevitore narrativo, senza uscita verso mappe vuote.

## Percorso e indicazioni

Il ponte a est della terrazza panoramica di Biancavetta richiede `badge_ghiaccio_awarded`. L’illustrazione Biancavetta v2 apre realmente la balaustra e il ponte, mantenendo gli edifici e gli altri accessi.

R14 Varco del Cristallo collega città, belvedere, rifugio e ingresso delle grotte. Livia è presso il rifugio: la squadra può riposare senza pagamento. La grotta D05 ha tre terrazze, due scalinate e un percorso principale che evita gli habitat facoltativi. Collisioni, terminali solidi e spawn seguono le illustrazioni. Le quote non sono una simulazione fisica: sono dislivelli e percorsi visibili.

## Ricerca e prova

La stazione bassa descrive il calore, quella centrale le correnti. Le letture sono indipendenti e accettano entrambi gli ordini; diario e dialoghi mantengono gli appunti. La console sul ripiano alto richiede entrambe le letture e la Medaglia Brina.

- Ventilazione: Chiusa, Delicata, Aperta, Forte. Indizio: **Delicata**.
- Scambio termico: Chiuso, Lieve, Moderato, Massimo. Indizio: **Moderato**.

Le impostazioni sono livelli discreti di un puzzle, non valori scientifici di temperatura. Il giocatore può modificare i controlli, chiudere, ricaricare e ripristinare. La verifica è esplicita: regolare i valori non assegna da solo il completamento. Nessuna configurazione consuma risorse o impedisce il ritorno.

Una volta raggiunto l’equilibrio, il ricevitore dell’arco alto distingue un’onda proveniente dal Passo delle Due Luci. I cristalli ne alterano l’intensità: non viene ancora identificata la sorgente né risolto l’arco della Risonanza. Il rapporto a Livia assegna una volta 700 monete e due Pozioni. Il ritorno a piedi fino a Biancavetta resta aperto.

## Architettura estendibile

`src/core/world/environment-regulator.ts` implementa un sistema puro: catalogo di controlli, livelli, stato iniziale e target, prerequisiti, aggiustamento, reset e lettura. Ogni regolatore ha fino a quattro controlli e ogni controllo fino a sedici livelli interi. Etichette e indizi sono contenuti. Le selezioni si salvano in flag esclusivi `regulator_<id>_<control>_level<offset>`; eventi/ricompense restano alla quest engine. Il sistema non conosce D05 o temperature reali.

Registry in `content/regulators/*.v1.json`, presentazione testuale accessibile in `environment-regulator-menu.ts`, gestione dei comandi condivisa in WorldScene. Nessun ramo per map ID. Le opzioni mostrano solo passi possibili e includono verifica, ripristino e chiusura. Il validatore Python controlla intervalli, copertura dei livelli, namespace, eventi e flag registrati, terminali e collisioni.

## Catalogo e fonti

Cinque specie ufficiali aggiunte: Geodude, Graveler, Onix, Zubat e Golbat. Stats, tipi, apprendimenti e artwork provengono dai raw PokéAPI conservati in locale. Zubat evolve per livello al 22 e Geodude al 25. Non vengono inventati livelli per gli scambi: Onix/Steelix e Graveler/Golem conservano i riferimenti ufficiali senza regole runtime di scambio. Il catalogo raggiunge 63 specie e 64 mosse supportate; il report elenca anche le mosse non implementate.

Il riferimento informativo delle evoluzioni descrive i metodi ufficiali fino a HGSS/quarta generazione, anche quando il target è fuori dal roster giocabile Gen I–II. Questo evita di affermare che Magneton o Piloswine non abbiano evoluzioni ufficiali. I target fuori catalogo restano segnalati come non disponibili e non vengono aggiunti alle regole runtime. Condizioni sconosciute causano errore nell’importer; non vengono omesse.

## Verifiche richieste prima della pubblicazione

- Attraversamento in entrambi i sensi, gate Brina, due letture in ordine inverso, reload, console, ricevitore e premio unico.
- Console bloccata senza letture; tentativo errato, modifica parziale, reload e reset; portrait e landscape.
- Tutte le sedici configurazioni raggiungono il target e consentono il reset; premi idempotenti e prerequisiti non aggirabili.
- Primo accesso offline a mappe, illustrazioni, artwork e console; ritorno dalla grotta.
- Regressione Pokédex/Squadra sulle evoluzioni ufficiali, pipeline riproducibile, build, unit test e validatore globale.

La geografia completa fino a Lega, l’epilogo, il catalogo intero e il bilanciamento naturale non sono attestati da questo capitolo.
