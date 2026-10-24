# Evoluzione durante lo scontro — v0.1

## Richiesta e regole

L'utente richiede che un Pokémon raggiunta la soglia evolva durante la sfida al capopalestra, senza aspettare l'esito dell'intero incontro. Runtime0.3.132, ruleset `veloria-battle-prototype-v15`, cachePWA153. Questa scelta di Veloria sostituisce il rinvio alla vittoria finale delle versioni precedenti; non è presentata come emulazione completa della serie originale.

Il reducer applica l'evoluzione alla fine del turno che assegna XP/livello, anche quando lo scontro continua. Prima del successivo avversario il nuovo Pokémon ha statistiche e tipi aggiornati, mantenendo identità, danni e PP. Vale anche il recupero di una soglia già raggiunta senza un altro livello. Non trasforma riserve senza XP o Pokémon KO alla risoluzione del turno. Fuga o sconfitta successive non annullano un'evoluzione già avvenuta. Livelli minimi e dati delle mosse restano invariati.

## Presentazione e persistenza

La scena accoda il messaggio evolutivo nella sequenza del turno. Sospende input e avanzamento automatico durante la celebrazione, poi propone le eventuali mosse della nuova forma e riprende con il prossimo avversario. L'artwork vecchio rimane fino alla rivelazione, quindi HP e ritratto sono aggiornati. Si riusa la celebrazione esistente nei due orientamenti.

Le presentazioni già concluse sono identificate con la stessa chiave delle ricevute evolutive. `onComplete` conserva tutti gli eventi e comunica separatamente le chiavi mostrate al proprietario WorldScene: quest'ultimo non riaccoda quelle celebrazioni al risultato finale. Non vengono filtrati gli eventi meccanici o i premi.

Il risultato viene persistito alla conclusione della lotta, come già previsto dal gioco; questa modifica non introduce il salvataggio/ripristino di uno scontro in corso. Se la lotta si conclude con una sconfitta dopo l'evoluzione, la forma evoluta resta nel risultato e non viene riportata alla precedente.

## Verifiche

- 577 test dominio/persistenza passati. Sette casi dedicati verificano evoluzione nello stesso turno, ordine levelUp/evoluzione, assenza di duplicati, recupero alla soglia, esclusioni KO/riserve/senzaXP e conservazione dopo fuga/sconfitta successive.
- Build e validatore passati. Resta l'avviso preesistente sui chunk Phaser.
- Quattro casi browser passati in45,8s: due nuove prove complete WorldScene/BattleScene contro Mira a390×844 e844×390; evoluzione normale e recupero terminale Charizard già coperti dalla131.
- Nelle nuove fixture Charmeleon35 è predisposto vicino al36. Dopo Sentret, la celebrazione mostra Charizard36 mentre l'esito è ancora ongoing e il secondo avversario non è entrato. Dopo Continua si apprende Attacco d'Ala e si affronta Rattata con l'artwork Charizard; a fine incontro la celebrazione evolutiva è stata aperta una sola volta. Medaglia, IndexedDB/reload, identità e assenza di ricevute duplicate verificati. Sono fixture di integrazione, non progressione naturale guadagnata.
- La prima esecuzione aveva omesso il prerequisito quest `q_brumalta_visited`: trasformazione/ripresa passavano, ma mancava la medaglia. Corretto il setup, mantenendo il controllo sulla medaglia. Nessuna modifica alle regole delle quest.
- Screenshot portrait/landscape della celebrazione controllati visivamente; nessuna prova fisica Android/iOS dichiarata.

Commit, CI e pubblicazione sono attestati separatamente in CI_STATUS. La campagna naturale resta dopo le Dune con cinque medaglie: questa correzione non prova P6–P8/Lega/finale.

## Correzione successiva — runtime134

La segnalazione sull'ordine delle mosse ha evidenziato il percorso terminale e gli apprendimenti emessi prima dell'evoluzione. Nella134 entrambe le sequenze mostrano prima la trasformazione e poi l'apprendimento, con regressioni esplicite e consumo delle ricevute già salvate. [Dettagli](51_EVOLUTION_LEARNING_ORDER_v0.1.md).
