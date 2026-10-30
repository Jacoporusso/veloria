# Consiglio: quattro identità e sedici pose

## Risultato

Nerea del Consiglio, Silvo, Brando e Luce usano quattro immagini indipendenti per le direzioni cardinali. Totale: 43 profili idle su 48; restano Enea, l'accoglienza della Lega, Ivo di Petalora, Maia e Tobia. Non è un completamento delle camminate: resta verificato soltanto il prototipo di Ada.

Fonte comune `assets/sources/veloria-league-council-v1.png`, frame 0/1/2/3 rispettivamente. Nerea del Consiglio resta distinta da Nerea di Portolume. Sedici sorgenti PNG copiati senza modifiche dagli originali del generatore e sedici WebP lossless con identico RGBA decodificato. Prompt esatti, ID, percorsi, hash, dimensioni e storia dei tentativi in `assets/prompts/council-directional-idles-v1.json`; calibrazione in `assets/npc-idle-views-v1.json`.

Corpo ad alpha >=128 calibrato a 56 pixel mondo; ancoraggio inferiore e centro ponderato dei piedi coerenti con gli altri lotti. Nessuna immagine specchiata. Silvo mantiene la borsa anatomica sinistra; Nerea ornamento e medaglione anatomici sinistri senza medaglione sul dorso; Luce conserva maniche/pannelli asimmetrici e il rombo sullo stinco destro. Per Brando tutti i bordi hanno zero pixel ad alpha >=128: il limite alpha grezzo x=0 della vista nord non indica un taglio materiale.

L'audit indipendente rispetto al commit precedente conferma geometria e proprietà di gioco delle quattro mappe, gli altri 44 profili, le copie raw, tutti gli hash, l'identità RGBA e il corpo a56. I nuovi WebP sommano 13.679.596 byte; questo conteggio non misura consumo GPU o traffico effettivo. Il budget complessivo resta aperto.

## Mappe e interazioni

Sale `league_council01`–`04`: NPC tile16,7, spawn `from_entry`, quattro lati accessibili conservati. Rimossi solo frame e riferimenti grafici precedenti; collisioni, coordinate, ricompense, sfide e progressione non cambiano. Dopo audit globale a zero usi Tiled il vecchio atlante è ritirato dai soli renderAssets delle quattro sale; fonte, catalogo e precache globali restano conservati. Ricevuta in `art/retired-council-atlas-0.4.43.json`.

Le fixture usano lo stato coerente del relativo incontro di Lega: otto medaglie, flag d'accesso e vittorie precedenti, lasciando corrente/successive non vinte. L'interazione reale apre il menu della sfida: i test verificano SFIDA e chiudono con NON ORA senza consumare risorse. Non viene finto un dialogo NPC che questo ramo non mostra e queste fixture non provano il bilanciamento naturale della campagna.

## Verifiche locali

- Quattro casi Chrome mirati passati in52,6s: quattro approcci, qualità ridotta/completa, screenshot portrait/landscape, texture proporzionate entro512, origine e scala, ordinamento e assenza flip/tween, menu reale e stato conservato. Screenshot a scala di gioco dei quattro fronti rivisti.
- Quattro casi produzione offline passati in48,5s: primo decode delle sedici risorse, dimensioni/alpha, approcci e interazione, ricaricamento. Il primo giro falliva per x/y omessi nelle nuove fixture; ripristinate le coordinate NPC16,7 mantenendo la partenza giocatore16,8. Fallimento conservato in `.tmp/council-offline.log`, esito finale in `.tmp/council-offline-final.log`.
- 839 test dominio/persistenza e154 Python passati; validatore1042 risorse,48 fondali,48 mappe,62 missioni,31 allenatori,12 negozi passato.
- TypeScript passato. Assegnazione esatta438 casi browser e83 offline: un viaggio e82 risorse in shard21+21+20+20. Build produzione eseguita dalla configurazione offline.

Ricontrollo globale delle51 presenze passato nei due orientamenti: due casi Chrome in2,3min, `.tmp/council-global.log`. In totale sei casi Chrome distinti e quattro produzione offline passati. Rilascio0.4.43/cachev207 da attestare separatamente. QA fisica su telefono, budget, camminate, mappe e campagna naturale completa restano aperti.
