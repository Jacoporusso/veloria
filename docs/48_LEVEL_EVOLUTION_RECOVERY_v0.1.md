# Recupero delle evoluzioni per livello — v0.1

## Problema e comportamento

Segnalazione: Charmeleon è già al36 ma non è ancora Charizard. Il vecchio reducer accodava l'evoluzione soltanto dopo un nuovo livello e la eliminava alla sconfitta o se il destinatario era KO alla vittoria. Un compagno rimasto alla soglia doveva quindi guadagnare un livello ulteriore.

Runtime0.3.131, ruleset `veloria-battle-prototype-v14`, cachePWA152: quando un compagno guadagna XP ed è già alla soglia di una regola evolutiva configurata, torna eleggibile senza richiedere un altro livello. La trasformazione resta alla fine di una lotta vinta e richiede che quel compagno non sia KO. Riserva senza XP, fuga, cattura, pareggio e sconfitta non attivano il recupero. Il recupero non è un'evoluzione al caricamento del save.

È una scelta esplicita di accessibilità del prototipo, non una dichiarazione di emulazione completa delle regole ufficiali. Specie, livelli minimi, statistiche e learnset importati restano invariati. Nessun campo o migrazione del salvataggio, nessuna XP aggiuntiva o ripristino di strumenti.

## Mosse ed eventi

Il reducer usa la stessa coda transitoria della battaglia. Nel recupero senza incremento di livello conserva `previousLevel` al livello reale; nessun evento levelUp artificiale. Le mosse della nuova forma sono considerate solo al livello attuale, non quelle più vecchie già superate. Charmeleon36 può quindi diventare Charizard36 e proporre Attacco d'Ala36 con la normale scelta di sostituzione/rifiuto. Slot e PP precedenti sono conservati.

## Verifiche

- 63 casi mirati su evoluzioni differite/starter passati: soglia già raggiunta, recupero dopo KO e cura, nessuna evoluzione di riserve senza XP o avversari senza ricompensa; nessuna concessione retroattiva di mosse precedenti.
- Suite dominio/persistenza:550+27=577 casi passati.
- Build TypeScript/Vite e validatore passati; resta l'avviso preesistente sui chunk Phaser.
- Browser: due prove Charizard passate in14,6s complessivi, evoluzione normale e recupero da Charmeleon già36 senza nuovo livello. Celebrazione, artwork, completamento una sola volta, IndexedDB/reload e identità/mosse/PP verificati. Sono fixture di integrazione controllate, non una partita naturale a quel livello.
- Screenshot della scheda Charizard36 controllato visivamente. Nessun test fisico Android/iOS dichiarato.

Esiti remoti e pubblicazione in CI_STATUS. Il checkpoint naturale della campagna rimane dopo il recupero delle Dune con cinque medaglie; questa correzione non dimostra il completamento di P6–P8 o Lega.
