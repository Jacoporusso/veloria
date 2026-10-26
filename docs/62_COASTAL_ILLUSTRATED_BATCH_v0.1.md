# Lotto costiero — 26 ottobre 2026

## Direzione e ambito

Costa delle Turbine, Portolume e Acquariva vengono uniformate al linguaggio 2D illustrato di Petalora: acqua dipinta, superfici opache, vegetazione meno minuta e strade leggere. I primi candidati costieri mantenevano una resa troppo realistica e sono stati respinti prima dell'integrazione.

Le sorgenti PNG raw e le conversioni WebP lossless sono nel repository; prompt, dimensioni e checksum sono nei tre documenti `assets/prompts/*-illustrated-v3.md` e nel manifest parity. Nessun ritaglio o ridimensionamento raster. La nuova registrazione porta il manifest a19 fondali, senza attestare il completamento delle48 mappe.

## Geometria

MapDefinition e Tiled cambiano soltanto i riferimenti grafici. Collisioni, habitat, NPC, uscite, spawn, servizi e condizioni di missione rimangono identici. I fondali di lotta delle due città seguono i nuovi asset dichiarati. Acquariva chiude il sentiero dipinto a sud, dove non esiste un'uscita, e mantiene i due raccordi settentrionali.

## Verifiche

Eseguiti con Chrome nativo: attraversamento R08 attraverso entrambe le uscite, due radure e punto pesca; traghetto di Portolume, lettura del misuratore e ritorno; servizi delle due città nei due orientamenti; rapporto a Tessa e ingresso nelle due palestre; raccordo Portolume–Delta con sblocco della Medaglia Marea. Rendering, dimensioni, NPC e uscite di tutti19 fondali verificati nei due orientamenti. L'ispezione visiva ha richiesto un'ulteriore correzione della vegetazione lungo l'approccio alla palestra di Acquariva: nuova esecuzione e accettazione finale da registrare.

Validatore passato:598 asset,19 fondali,48 mappe,62 missioni. Corretto inoltre il checkout Windows di due snapshot CSV PokéAPI: `.gitattributes` conserva gli a capo LF cui corrispondono i checksum ufficiali; contenuto dei dati invariato.

Correzione finale Acquariva riprovata: servizi, rapporto e ingresso palestra passati; screenshot dell'approccio ispezionato con piedi sul percorso libero. Build finale passata. Tutti18 fondali non iniziali del manifest, inclusi i tre nuovi, decodificati alla prima richiesta senza rete nella build di produzione; nessuna visita preventiva alle mappe. CI e pubblicazione da attestare; ricevuta finale in `CI_STATUS.md`.
