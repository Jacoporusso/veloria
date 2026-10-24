# Evoluzione prima dell'apprendimento — v0.1

Runtime0.3.134, cachePWA155; motorev15 invariato. Segnalazione utente: la proposta della nuova mossa usa il nome evoluto prima che sia stata mostrata l'animazione.

## Correzione

Tutte le evoluzioni entrano nella sequenza dei messaggi, anche sull'ultimo avversario. La celebrazione viene completata prima di aprire l'apprendimento o la sostituzione delle mosse. Le mosse ottenute nello stesso turno dalla forma precedente e quelle della forma nuova vengono presentate dopo l'ultima trasformazione del relativo compagno, mantenendo il loro ordine interno. I messaggi precedenti alla rivelazione usano il nome della forma ancora visibile.

`evolutionPresentationEvents` prepara soltanto la coda di presentazione. Il registro degli eventi meccanici, XP, statistiche, apprendimenti e PP non viene riscritto o filtrato. Le mosse di altri compagni e i turni senza evoluzione mantengono la propria sequenza.

Quando un risultato terminale è già stato salvato, WorldScene consuma e salva la ricevuta della celebrazione appena conclusa attraverso `onEvolutionPresented`; la presentazione finale non la ripete. Restano gli identificatori delle ricevute esistenti e il trattamento precedente delle scelte di apprendimento ancora da risolvere. Durante la lotta, il risultato viene persistito alla sua conclusione come nella132. Nessuna nuova migrazione del save.

## Verifiche

- 582 test dominio/persistenza passati (555+27), inclusi quattro casi puri di ordine, catene evolutive, eventi di altri compagni, assenza di duplicazioni e immutabilità degli input.
- Build e validatore passati; avviso preesistente sui chunk Phaser invariato.
- Sei browser passati in1,2minuti: evoluzione fra due avversari portrait/landscape, evoluzione sull'ultimo avversario con WorldScene e ricevuta salvata, Charmander→Charmeleon con apprendimento dalla forma precedente, Charmeleon→Charizard normale e recupero dalla soglia già raggiunta.
- I test starter ora richiedono esplicitamente la rivelazione evolutiva prima di qualsiasi carta automatica o scelta di sostituzione. Le prove WorldScene controllano celebrazione unica, ripresa, medaglia, assenza di ricevute duplicate, identità e reload. Sono fixture controllate e non avanzamento naturale della campagna.
- Il primo avvio del nuovo scenario finale si è fermato prima dei test per un import del calcolo XP dal modulo errato; corretto al modulo rules senza modificare i calcoli.

Nessun nuovo asset, effetto della mossa o livello importato. CI/deploy attestati in CI_STATUS; campagna completa, catalogo e QA fisico restano aperti.
