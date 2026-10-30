# Cattura basata sulla specie — modello accessibile Veloria v1

## Dati e regola

Tutti i151 valori `captureRate` del catalogo sono copiati da `capture_rate` nei file ufficiali PokéAPI `pokemon-species` già conservati nel repository e coperti dal manifest di provenienza. L'importer verifica interi1–255 e ogni valore contro la fonte anche in modalità offline `--check`. Nessun valore è scelto in base al nome o all'etichetta di leggendario: per esempio Pidgey255, Snorlax25, Articuno/Zapdos/Moltres/Mewtwo3, Mew45. Mew segue quindi il suo dato, non quello degli uccelli leggendari.

La formula di gioco è un bilanciamento originale di Veloria, **non la formula ufficiale di una generazione Pokémon**. È esplicita in `src/core/battle/capture-chance.ts` e condivisa da motore e anteprima:

```
preparazione = clamp(baseChance + missingHpBonus × frazionePSmancanti + statusBonusSePresente, 0, 1)
probabilità = preparazione × radiceCubica(captureRate / 255)
```

La radice cubica mantiene l'ordine di difficoltà delle specie ma attenua gli estremi: una preparazione ottima non rende certa la cattura di un leggendario, senza richiedere in media decine di lanci. La Sfera conserva i valori dichiarati nei dati:0,25 iniziale,0,55 per tutti i PS mancanti,0,20 per un'alterazione di stato maggiore. Ogni stato maggiore riconosciuto dal motore riceve qui lo stesso bonus: non attribuire a questo modello i moltiplicatori di sonno/congelamento di una formula ufficiale. Un futuro strumento con `baseChance:1` è esplicitamente garantito; nessuno strumento nuovo viene aggiunto da questa tranche.

| Specie | Dato fonte | PS pieni, senza stato | 1/100PS e stato |
|---|---:|---:|---:|
| Pidgey |255|25%|99,45%|
| Snorlax |25|circa11,53%|circa45,86%|
| Articuno |3|circa5,69%|circa22,62%|
| Mew |45|circa14,02%|circa55,78%|

Le percentuali indicano un singolo lancio indipendente condizionato allo stato attuale. Non garantiscono un numero massimo di tentativi. Con rate3 e preparazione quasi massima la media teorica è circa4,4 sfere, ma il risultato effettivo resta casuale. Ogni tentativo fallito lascia procedere il turno avversario: preparare PS/stato e curarsi rimane una scelta di combattimento. La ricerca del rifugio e la sua persistenza restano le regole della tranche0.4.47; fuga o KO non cancellano lo sblocco.

## Interfaccia e salvataggio

Il selettore mostra sulla Sfera la probabilità approssimata prima del lancio, insieme alla quantità disponibile. Nessun click di conferma aggiunto. Una probabilità inferiore a1 non viene mai presentata come100%: il testo approssimato è limitato a99%; la certezza esplicita usa «Cattura garantita». Nessuna barra sopra le mosse viene reintrodotta. In landscape i limiti completi delle illustrazioni vengono tenuti fuori dalle rispettive schede PS, compresa l’oscillazione idle: niente teste o corpi coperti dal proprio HUD.

Il valore della specie viene ricostruito dal catalogo quando si crea la battaglia, anche per Pokémon già salvati, e aggiornato con l'evoluzione. Trasformazione non cambia il valore di Ditto. Il salvataggio dei Pokémon non richiede nuovi campi o un riavvio della partita. Consultare la percentuale o cambiare scheda non consuma RNG né inventario; il lancio reale usa lo stesso calcolo e un solo tiro di cattura. La probabilità non viene ricalcolata dall'animazione.

## Verifica e stato

Passati838 test dominio,31 persistenza,5 budget e157 Python; validatore completo1098 media/48 mappe/67 missioni. Quattro casi Chrome passati: menu comuni/rari/leggendari, PS/stato e lancio reale con ricevuta coerente, anteprima senza consumo, rientro ai comandi e servizi. Screenshot della cattura e della borsa rivisti in portrait/landscape. Il dato ufficiale è confrontato per tutte151 specie; test deterministici coprono fallimento, successo garantito, monotonicità e Ditto.

Passata anche la prova di produzione offline contro Articuno: Sfera al6% a PS pieni, un lancio fallito, fuga con Fugafacile, ritorno al viaggio, inventario3/4 persistito e RNG conservato al reload; nessun errore di rete o runtime. Copertura verificata459 casi browser e91 offline (1 percorso +90 risorse, shard23/23/22/22), una sola assegnazione per caso. Build finale e TypeScript passati. La pubblicazione0.4.48/cachev212 è in corso. Rimangono da valutare sul gioco completo le squadre dei rari contro una squadra da Campione, le risorse consumate in combattimento e le coppe del dopogioco. La probabilità basata sulla specie non dimostra da sola il bilanciamento completo dell'incontro.
