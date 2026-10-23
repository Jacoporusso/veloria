# Habitat nel dettaglio Pokémon

Content0.3.120 · cache PWA141 ·23/10/2026.

## Esperienza del giocatore

Il dettaglio Pokédex e Squadra include **Dove incontrarlo**: nome della zona, metodo di incontro con icona, intervallo di livelli e periodi del giorno. La zona attuale ha l’indicazione “Sei qui”; le regioni già esplorate hanno precedenza e le altre sono indicate “Da esplorare”. Una nota ricorda che alcune zone richiedono progressi e che la pesca necessita della canna.

Esempi dai dati attuali: Wooper compare nell’Anello Magnetico ai livelli16–18 e nel Condotto Risonante ai livelli18–21; Chinchou compare sulla Costa delle Turbine20–23 sia pescando sia nelle zone d’erba. Sono tabelle di Veloria: non si importano luoghi della serie originale o habitat inventati. Le probabilità non vengono presentate come garanzie di cattura.

## Dati e architettura

`findSpeciesHabitats` è una funzione pura in `src/core/party/habitats.ts`. Legge soltanto le tabelle dichiarate in `encounterTableIds` dalle mappe runtime e con mapId corrispondente. Ignora voci a peso zero e tabelle non collegate, raggruppa per mappa/metodo e conserva i periodi realmente presenti. Non deduce una presenza selvaggia dal fatto che la specie possa evolvere in un’altra.

La UI usa nomi delle mappe registrate e stato di visita dell’atlante. Nessuna chiamata di rete, modifica di inventario, squadra, flag o cursore RNG. Aggiungendo specie e tabelle collegate nelle mappe, le informazioni si aggiornano senza mantenere una seconda lista manuale di habitat.

## Verifica

Due test di dominio controllano raggruppamento, periodi, livelli, tabelle non collegate, mappe non corrispondenti, peso zero, immutabilità e dati reali Costa/Condotto.549 test dominio/persistenza passati. Due prove browser reali con il backup guadagnato dopo Iris controllano Wooper visto ma non catturato e Chinchou catturato, i due metodi sulla costa, la priorità delle zone note e l’assenza di cambi al salvataggio, in390×844 e844×390.

La prova offline di deposito/negozio consulta anche gli habitat di Wooper con rete disabilitata, poi effettua trasferimenti, acquista tre Pozioni e ricarica. Passata in5,9s (19,4s inclusa build). Build e validatore passati; l’interfaccia è stata controllata su screenshot. Queste verifiche non equivalgono a una prova su telefoni fisici o al bilanciamento della quinta palestra.
