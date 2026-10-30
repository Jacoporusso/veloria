# Allenamenti ripetibili — contenuto0.4.46

## Comportamento

Il menu di gioco contiene Allenamenti della Lega. Accesso dalla prima visita al piazzale, prima del titolo di Campione; in seguito è disponibile anche durante i viaggi. L'accesso iniziale è riconosciuto dal luogo o dai flag di visita/completamento. Ingresso gratuito, nessuna medaglia aggiuntiva o moneta richiesta. Un tentativo attivo della Lega deve prima essere concluso/interrotto. Anteprima mappe, transizioni, operazioni pendenti e squadra tuttaKO non avviano allenamenti.

Questa prima tranche è una modalità raggiungibile dal menu, non un edificio o un nuovo NPC sulla mappa. Il menu mostra tre Pokémon per sfida, livello e ricompensa prima della conferma. Una squadra nuova è generata solo confermando l'inizio; aprire il menu, cambiare livello e annullare non consumano RNG o risorse.

| Livello | Monete per vittoria |
|---|---:|
|30|500|
|40|800|
|50|1200|
|60|1800|
|70|2500|
|80|3200|

Vittorie ripetibili senza limite giornaliero. XP, PS, PP e strumenti usati sono quelli reali del normale motore; nessun pagamento su sconfitta/pareggio, nessun costo d'ingresso. Se tutta la squadra vaKO viene soccorsa come negli altri scontri del prototipo, evitando un blocco. Non vengono cancellati flag della storia o riassegnate medaglie/doni.

Un successo livello30 consente due Pozioni200 o tre Sfere150; tre successi coprono una Iperpozione1500. Un successo livello60 paga1800. Sono rapporti ai prezzi attuali, non una verifica del bilanciamento di lungo periodo, che richiede ancora partite e misure.

## Dati e separazione del codice

src/core/world/training-arena.ts contiene modello puro, pool, estrazione, livelli e ricevute. WorldScene adatta menu, battaglia e salvataggio. Pool di33 specie GenI, tre diverse per squadra, senza leggendari/mitico. La selezione rispetta il minimo evolutivo derivato dal riferimento locale PokéAPI, compresa l'ascendenza: per esempio Venusaur32, Charizard36, Rhydon42, Dragonite55. Non viene inventata una variante sotto-livello per riempire la fascia30.

Mosse scelte soltanto fra quelle supportate nell'officialLearnset HGSS al livello selezionato, massimo quattro distinte e almeno un attacco dannoso quando disponibile. Statistiche e PP restano del catalogo. AI usa il profilo registrato gym_final. La squadra è deterministica dal cursore RNG persistito; non usa Math.random o nuove chiamate API.

Ogni avvio ha un ID univoco e una ricevuta pending salvata prima del lancio. Il retry usa la stessa squadra e lo stesso ID. Il completamento accetta soltanto il pending corrispondente; il premio viene pagato una volta, dopo il merge di XP/PS/PP e consumo strumenti. Il successivo allenamento usa una nuova ricevuta, con pulizia di quelle del contesto precedente, evitando crescita illimitata dei flag. Il ricaricamento di un tentativo incompleto lo interrompe senza monete, conservando i progressi già salvati. Nessuna modifica allo schema save.

## Verifiche

- Dieci test di modello: dati reali, livelli evolutivi con100 semi per fascia, mosse/AI registrate, varietà e determinismo, input invalidi, ricevute, pagamenti duplicati, sconfitte/pareggi, recovery, overflow e centinaia di tentativi senza accumulo.
- Cinque casi Chrome dell'arena passati: scelta/annullo di tutte le fasce, accesso dopo la visita anche fuori piazzale, due vittorie vere0→500→1000, XP/PP e ricevute dopo reload, acquisto di Pozione al mercato; ripresa di un pending, blocchi di accesso/squadra esausta, errore quota con avvio fermo e retry unico. Screenshot dei menu portrait/landscape rivisti e riquadro entroviewport verificato.
- Un caso produzione offline passato in13,5s (27,5s compresa preparazione): vittoria reale da zero monete, acquisto di Pozione500→300 e saldo conservato al reload, nessuna richiesta fallita o errore pagina. Non usa debug globals in produzione.
- 850 test dominio/persistenza, cinque budget e154 Python passati. TypeScript, build offline e validatore1098 risorse/48 mappe passati. Copertura451 browser e89 offline una volta: un viaggio e88 risorse in quattro shard22.

Le prime prove native rilevavano fixture non ancora persistite, bookkeeping di visita/Pokédex e chiusura troppo anticipata del testo: corrette le fixture, mantenuti gli invarianti di storia. Il caso quota distingueva null (scena non ancora aggiunta) da false: verificato ora lo stato booleano di attività. Log iniziali e finali conservati in .tmp/training-arena-*.

## Correzione CI della migrazione idle

Le Verify41018163633 e41021617329 terminano entrambe con32 job riusciti su33: fallisce soltanto Browser chapters shard7, perché npc-idle-motion cercava ancora un tween di respiro su Enea dopo la migrazione a viste calibrate. Nessun successo complessivo attribuito alle due esecuzioni. Il test è aggiornato al contratto voluto: nessun tween, scala uniforme, origine/chiave canoniche, stabilità per16frame e dopo cambio qualità; passato in2,7s. L'hook aspetta il completamento della scena e intercetta anche URL main.ts con query.

Coppe, rivincite sui percorsi, strumenti tenuti e nuova ricerca/cattura dei leggendari del documento126 restano aperti. Questo lotto consegna l'economia ripetibile iniziale; non completa il dopogioco.
