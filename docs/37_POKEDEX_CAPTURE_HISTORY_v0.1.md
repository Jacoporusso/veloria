# Memoria delle catture nel Pokédex

Content 0.3.121 · cache PWA v142 · 23 ottobre 2026.

Il Pokédex conserva le specie possedute anche dopo l’evoluzione: i conteggi della squadra e del deposito rimangono separati dalla registrazione storica. La registrazione usa flag persistenti `pokedex_caught_<id>` e implica anche l’avvistamento.

Il proprietario del salvataggio registra le specie effettivamente possedute prima di creare ogni snapshot. Le ricevute di evoluzione registrano entrambe le forme nella stessa operazione della trasformazione, sia con pietra sia con livello. Consumare la ricevuta della presentazione non cancella le catture. La sola osservazione di un avversario non conta come cattura.

Non si inventano catture pregresse dai soli avvistamenti nei vecchi salvataggi. Le specie ancora possedute vengono registrate al prossimo salvataggio.

Verifiche: 550 test di dominio/persistenza passati, inclusa regressione su evoluzione, consumo ricevuta, serializzazione e specie non possedute. Build TypeScript/Vite passata. Due prove browser isolate con IndexedDB passato in portrait e landscape: registrazioni conservate dopo reload e specie soltanto avvistata distinta dalle catturate. La verifica iniziale nella sandbox non ha raggiunto localhost (ERR_NETWORK_ACCESS_DENIED); le stesse prove fuori sandbox sono passate in 2,4s. Pubblicazione da confermare.
