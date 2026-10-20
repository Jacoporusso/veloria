# Capitolo montano — integrazione locale 0.3.91

## Stato

Pubblicato con commit cf99e05 e deploy Pages 39382295591 riuscito; contenuto 0.3.91, cache v112 e Tiled P7 verificati via HTTPS. La suite Verify Linux è ancora in esecuzione. La progressione successiva a Biancavetta non è implementata.

## Percorso e ricerca

Acquariva → R12 Valle del Vento → Passobrina → R13 Tornanti Bianchi → Biancavetta → palestra di Nives. La nuova scala a nord del giardino di Acquariva richiede la Medaglia Riflesso; l’accesso alle Cascate resta distinto.

Le letture di vento, temperatura e neve accettano qualsiasi ordine. La guida di Passobrina riceve il rapporto soltanto dopo tutte e tre, assegna 500 monete e due Pozioni una sola volta e apre il percorso R13. I sentieri principali e i ritorni evitano gli habitat facoltativi. R14 è segnalata come valico controllato dalle guide, senza uscita verso una mappa vuota.

## Palestra della Brina

Mappa Tiled 32×24 con tre piste, ostacoli di cristallo e passerella asciutta a sud. Sul ghiaccio il movimento prosegue diritto fino alla prima fermata valida; il salvataggio conserva le fermate, impedendo di cambiare direzione ricaricando a metà scivolata.

I tre sigilli accettano tutti gli ordini. Dopo averli accesi si esamina la console a destra della terrazza centrale: il cancello dinamico si apre e permette di raggiungere Nives. Ogni fermata raggiungibile consente il ritorno all’ingresso. Geometria e soluzione sono descritte nel JSON sotto content/drafts/mountain; il runtime effettivo è public/tilemaps/gym07_biancavetta.tmj.

Nives usa Sneasel 41, Dewgong 42 e Piloswine 43; mosse controllate nei learnset ufficiali HGSS ai livelli previsti. La vittoria assegna 2.100 monete e Medaglia Brina, emblema originale a fiocco di neve, con feedback della capopalestra e banner. Il flag badge_ghiaccio_awarded apre la funivia.

## Trasporti

Il registro locale dichiarativo supporta battello e funivia: network, fermate, rotte e requisiti sono dati, senza rami specifici delle mappe. La Funivia della Brina collega gratuitamente Passobrina e Biancavetta dopo P7; il requisito viene ricontrollato alla partenza. I percorsi a piedi restano aperti. Non viene aggiunta una fermata della monorotaia in montagna.

Il validatore controlla riferimenti, flag, rotte, terminali solidi e spawn adiacenti orientati verso il terminale, fuori da collisioni, uscite e habitat. Sistemato anche l’arrivo dell’osservatorio di Portolume per renderlo direttamente adiacente al battello.

## Catalogo e grafica

Sei specie nuove nel runtime: Swinub, Piloswine, Sneasel, Seel, Dewgong e Jynx. Parametri, learnset, evoluzioni e artwork sono importati da PokéAPI e conservati in locale con fonti/checksum; nessuna chiamata API durante il gioco. Swinub evolve al 33 e Seel al 34. Le evoluzioni oltre la seconda generazione restano escluse.

Delibird è stato studiato ma resta fuori dal runtime: il suo learnset HGSS offre Present, il cui effetto non è ancora supportato. La fonte rimane in archivio; non viene sostituita da mosse inventate. Il catalogo totale è di 58 specie e 64 mosse supportate; 451 voci dei learnset risultano esplicitamente non implementate.

Cinque ambienti illustrati originali ImageGen e revisione Acquariva v2, sorgenti PNG conservati e derivati WebP lossless. Registrazione e checksum in assets/prompts/mountain-chapter-v1.md. Collisioni e porte seguono gli ambienti illustrati; sono previste verifiche visive in portrait e landscape.

## Evidenze e lavoro residuo

- Validatore locale: 220 asset, 35 mappe, 33 quest, 14 allenatori, 9 negozi.
- 375 test dominio e 16 persistenza passati prima delle ultime due prove aggiuntive sulle quest; queste ultime passano per tutti i sei ordini, console esplicita e premi non duplicabili.
- Cinque controlli Python aggiuntivi sui trasporti locali passati.
- Browser: puzzle P7 reale con ordine est/ovest/centro e reload, cancello, lotta, banner, medaglia e premio unici, ritorno sulle piste, portrait/landscape; funivia bloccata prima della medaglia e viaggi nei due sensi senza consumo di risorse. Cinque prove insieme alle regressioni di Portolume passate in 2 minuti.
- La battaglia è stata verificata con una squadra potenziata per isolare il flusso: non attesta il bilanciamento della progressione naturale.
- Attraversamento completo Acquariva–ricerca–Biancavetta e ritorni a piedi passato in 2,2 minuti. Primo accesso offline a sei illustrazioni, cinque Tiled e sei artwork montani, con viaggio funivia e reload: passato in 3,8s (15,1s inclusa build). Build finale riuscita. Pubblicazione e CI da verificare dopo il push.

R14/D05, R15, Concordia/P8, Santuario, R16, Lega, finale, post-game e catalogo completo restano lavoro successivo.
