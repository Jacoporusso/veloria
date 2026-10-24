# Gelodenti: congelamento e tentennamento indipendenti — 0.3.129

## Stato

Implementazione verificata localmente per0.3.129/v150. Il blocco di quota del servizio di autorizzazione era stato registrato durante la ricevuta128; dopo il ripristino, i controlli browser e offline sono stati eseguiti con il normale percorso di approvazione. Pubblicazione e CI autorevoli sono riportate in CI_STATUS.

## Fonte e comportamento

Gelodenti deriva dal record locale `content/sources/pokeapi/move-ice-fang.json`, già presente nel progetto e incluso nel manifest delle fonti con checksum. Parametri HGSS: Ghiaccio, fisica, potenza65, precisione95%,15PP;10% di congelamento e10% di tentennamento come prove indipendenti, confermate anche dal testo sorgente inglese.

L'importer accetta espressamente questa combinazione dopo aver verificato categoria damage-ailment, bersaglio singolo, assenza di modificatore critico/cambi statistiche e probabilità dichiarate. Il motore già dispone dei due effetti: nessuna modifica alle regole di durata/scongelamento o al protocollo delle azioni.

Un colpo può attivare nessuno, uno o entrambi gli effetti. Un bersaglio Ghiaccio non può essere congelato, ma può tentennare. Uno stato principale preesistente non viene sostituito; l'altro effetto rimane possibile. Il tentennamento non annulla azioni già eseguite. Mancato colpo e KO impediscono entrambi gli effetti secondari; l'uso consuma una sola PP.

Tutti gli83 learnset sono rigenerati dai record HGSS: Steelix al livello1 e Piloswine al28 sono gli attuali apprendimenti registrati. Il catalogo locale contiene84 mosse supportate,544 apprendimenti esclusi ancora documentati. Mosse di salvataggi e squadre degli allenatori non vengono riscritte. Le regole generali di stato restano quelle dichiarate del prototipo: questa patch non attesta una simulazione HGSS completa.

## Informazioni al giocatore

I dettagli condivisi da lotta e schede mostrano le due probabilità e spiegano l'indipendenza. Le mosse che infliggono gelo indicano l'immunità dei tipi Ghiaccio; il riferimento al tentennamento appare solo quando la mossa lo permette. L'audit montano non classifica più Gelodenti come effetto combinato escluso. Critici speciali, ambiti non rappresentati e mosse variabili restano aperti.

## Verifiche locali

- 574 test dominio/persistenza passati, inclusi11 casi dedicati al catalogo e alla composizione: quattro esiti, immunità, stato già presente, lentezza, mancato colpo, KO, PP, input immutabile e descrizione.
- Un caso usa senza modifiche le regole runtime: seed508 attiva congelamento, scongelamento e tentennamento, con RNG688625133 e PP del bersaglio preservati. La fixture principale forza lo scongelamento immediato solo per rendere osservabili separatamente le due prove; le regole runtime restano immutate.
- 111 test Python e validatore passati; importer riproducibile senza rete, registro/fonti e contenuti verificati.
- Build TypeScript/Vite passata. Resta il precedente avviso di dimensione dei chunk Phaser.
- Due casi UI portrait/landscape in `tests/e2e/ice-fang-ui.spec.ts` passati in2,2s; screenshot controllati visivamente.
- Prima apertura dei dettagli di un Piloswine visto, senza rete nella PWA prodotta, passata in3s (16,5s con build), senza variazioni a squadra, box, risorse, flag o RNG. La fixture di integrazione non viene presentata come una cattura naturale.

Esiti di commit/push, CI remota e deploy sono tracciati separatamente in CI_STATUS. Il checkpoint naturale più avanzato resta quello con Eevee28/Drowzee29 ad Acquariva e cinque medaglie; nessuna nuova progressione naturale viene dichiarata da questa patch.
