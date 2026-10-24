# Microhabitat dei sentieri iniziali

Content0.3.124 · cache PWA v145 · verifica iniziata23 ottobre, rilascio24 ottobre2026.

## Distribuzioni distinte

La revisione continua gli interventi39/40 sulla ripetitività degli incontri. I trigger già presenti nelle mappe usano gruppi differenti, con metadata e tabelle dichiarative. Nessuna modifica a collisioni, uscite, missioni, tassi per passo o meccanica del sorteggio. Dati delle specie e mosse restano quelli importati; la distribuzione di Veloria è una scelta di progettazione prototipale.

| Mappa | Microhabitat | Specie caratteristiche |
|---|---|---|
| Bosco dei Veli | Sottobosco ovest / sponda est | Pool originale conservato a ovest; Oddish, Bellsprout, Wooper e Poliwag a est |
| Viale delle Fronde | Insetti ovest / radura est | Caterpie, Weedle, bozzoli e Spinarak / Sentret, Bellsprout, Mareep, Oddish e notturni |
| Terrazze del Muschio | Felci / giardino di pietra | Erba e Coleottero / Geodude, Sentret e Zubat notturno |
| Salita dei Petali | Fioriture / torrente | Oddish, Bellsprout e farfalle diurne / Poliwag e Wooper |
| Viadotto dei Ciliegi | Ciliegi / binari / rive | Natu e uccelli / Magnemite, Pikachu, Voltorb / Wooper, Poliwag, Pikachu |

Totali delle specie per mappa (unione di orari e microhabitat): Bosco14, Viale11, Terrazze9, Salita9, Viadotto10. Non tutte sono disponibili nello stesso punto e alla stessa ora. Il Sentiero dell’Alba mantiene il suo roster semplice da introduzione. Alcune specie comuni restano condivise; non è completata l’espansione del catalogo001–251.

Livelli: bosco3–5, con Poliwag soltanto5 nella nuova sponda; Viale4–6 con Metapod/Kakuna rari al7; Terrazze6–8; Salita8–10 con Butterfree/Beedrill diurni10–11; Viadotto11–13 nei ciliegi,12–14 presso binari/rive. Durante la verifica Poliwag3 è stato respinto dal controllo di spawn: nessuna mossa supportata a quel livello. Corretto a5, senza inventare mosse.

## Prove effettuate

551 test dominio/persistenza passati, incluso spawn di tutte le specie selvatiche con mosse ufficiali importate ai limiti di livello. Test di collegamento aggiornati conservando controlli su numero di habitat, tassi e raggiungibilità. Validatore e build passati. Pokédex portrait/landscape e percorso Corolla–Viadotto–Oren–servizi Vetracielo con premi unici/reload passati in1,4min.

Nuova partita reale con Charmander, seed iniziale1192554284, senza assegnazione di risorse o livelli: prima medaglia conquistata in3,1min automatizzati. Sei incontri, cinque vittorie e una cattura di Rattata3; nessuna sconfitta dell’intera squadra, nessun errore JavaScript. Ada, progressione di ricerca, cure/acquisti e preparazione sul nuovo Viale funzionanti. Charmander finale9/73XP,10/26HP; Rattata3,1250 monete, quattro Sfere e nessuna Pozione. Medaglia/squadra/inventario/denaro conservati tornando al titolo e riprendendo.

Report: `docs/playtests/2026-10-23-natural-early-habitats-charmander.json`. È una prova con uno starter e un campione RNG reale, non il bilanciamento verificato di tutti gli starter o delle altre sette Palestre. Restano confronto naturale con gli altri tre starter, riconoscibilità grafica più esplicita dei microhabitat, verifica fisica PWA e completamento della campagna naturale.

## Riparazioni delle verifiche complete precedenti

Verify40018592554 (0.3.123) ha concluso con cinque job falliti, sette casi. Cinque casi monorotaia/concordia/offline confrontavano fixture prive del nuovo `pokedex_caught_25`: la fixture condivisa ora dichiara la cattura del Pikachu che possiede, conservando il confronto integrale delle risorse e dei flag. La prova Tobia aveva perso dopo una scottatura (screenshot con Raticate85 KO e Quagsire49 avversario ancora a62HP): solo la fixture di integrazione ora usa un cursore controllato. Il caso Celia aveva `route.fetch ECONNRESET`: il solo caricamento del driver consente due retry di rete, senza retry degli assert o delle battaglie.

Sette prove online (i sei fallimenti online più il gate della stazione) passate in1,4min. Il caso monorotaia offline passa in6,3s (20,6s inclusa build PWA). Sono verifiche locali dei casi indicati, non una dichiarazione anticipata di nuova CI interamente verde.
