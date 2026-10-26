# Dune, Delta e Sentiero delle Canne — lotto illustrato

## Ambito

Il lotto continua la direzione 2D moderna dei documenti58 e61: sabbia calda e vegetazione bassa nelle Dune Salmastre; acqua dipinta e pontili leggeri nel Delta degli Specchi; verde dei salici lungo il Sentiero delle Canne. Sono sostituiti soltanto i binding dei fondali e, dove presenti, dei fondali di battaglia. Roster, incontri, collisioni, spawn, sblocchi, missioni e interazioni non cambiano.

Le sorgenti finali sono PNG raw ImageGen, convertite soltanto in WebP lossless. Prompt e checksum sono nei documenti `assets/prompts/*-illustrated-v3.md` e nel manifest parity. I diagrammi SVG D04/R10 derivano dalle celle percorribili Tiled, conservando come pavimento i footprint degli NPC, e sono riferimenti di posizionamento riproducibili; non sono grafica runtime.

## Revisione geometrica

I primi candidati con assi dei pontili spostati sono stati respinti. La revisione in Chrome ha inoltre mostrato che le corsie meridionali richiedevano un margine illustrato sotto i piedi del protagonista: il piano dipinto è stato ampliato verso sud, senza cambiare le celle percorribili. R09 riceve un raccordo est più libero da piccoli sassi e vegetazione. I paletti che apparivano nel piano percorribile dei pontili sono oggetto di una correzione finale prima dell'accettazione.

## Verifiche

Quattro test di dominio su collegamenti, habitat e ricompensa del kit passati. Validatore locale:606 asset,22 fondali con provenienza,48 mappe e62 missioni coerenti. Prove native passate: R09 pesca e uscita verso il Delta; D04 tre osservazioni, rapporto a Iris e passaggio verso Acquariva; sei corsie del Delta nei due orientamenti; R10 campana, kit e uscita verso Acquariva. Nel test R10 sono usati waypoint che passano realmente intorno a Bruno e Maya, evitando di pianificare una camminata attraverso i loro sprite.

Rendering e identità globali dei22 fondali passati prima delle ultime correzioni del piano dipinto. Le prove finali delle corsie D04 e del Sentiero sono state ripetute dopo la rimozione dei paletti: entrambe passate, screenshot dei piedi sulle due corsie meridionali e dei raccordi ispezionati. R09 pesca/uscita ripassato con il margine est ampliato. Build finale passata; tutti21 fondali non iniziali del manifest decodificati alla prima richiesta senza rete, senza visitare preventivamente le mappe. Validatore finale606 asset/22 fondali passato. Pubblicazione e CI da attestare nella ricevuta. Questo lotto non dichiara completata la revisione di tutte48 mappe.

## Pipeline

La precedente pipeline costiera ha superato20 job; il ventunesimo è stato cancellato dal limite esterno di30 minuti dopo circa21 minuti di bootstrap del runner. Nella ripetizione, bootstrap di circa12 minuti e20 casi browser passati prima di raggiungere di nuovo il limite esterno, senza errori di asserzione. Il limite esterno dei job browser viene portato a50 minuti per includere bootstrap e caricamento artefatti; il passo browser resta limitato a24 minuti e i timeout/assert dei singoli test non vengono allentati. L'esito completo deve essere verificato nella nuova pipeline; le cancellazioni precedenti non valgono come successo.
