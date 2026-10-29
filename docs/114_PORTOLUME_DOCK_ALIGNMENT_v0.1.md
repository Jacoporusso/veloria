# Portolume: allineamento del molo

La vecchia posizione di Marina sul bordo del molo permetteva di avvicinarsi da una cella già dipinta come acqua. Marina si sposta di una cella verso la piazza, da 23,15 a 22,15. La sua collisione resta sulla nuova posizione; una fascia costiera chiude la riga 15 a partire dalla colonna 23. Il corridoio del battello alla riga 14 rimane aperto. Non è stata aggiunta terra all'illustrazione.

La prima collocazione sperimentale 22,14 è stata scartata: occupava il corridoio del battello e separava i due lati. La prova degli approcci l'ha rilevato prima del rilascio. La posizione finale 22,15 lascia raggiungibili sud, ovest e nord; est è acqua e resta bloccato. Le quattro pose grafiche non cambiano.

L'indice dei target del diario viene rigenerato dagli oggetti fisici: orientamento e rapporto di Marina puntano ora a 720,515, mantenendo l'identità oggetto 408. Dialoghi, premi, canna, servizi, battello e spawn non cambiano. I salvataggi che si trovassero sulla vecchia cella d'acqua usano la regola già esistente di ritorno a uno spawn valido.

Tre casi Chrome passati: approcci/due qualità/due orientamenti di Marina; collisione e interazione dopo ricarica; consegna singola della canna, navigazione all'osservatorio, lettura, ritorno e persistenza. Quest'ultimo caso verifica anche che dal molo non si possa camminare nella cella d'acqua 24,15. Screenshot portrait rivisto: entrambi i personaggi restano sulla piazza. Tredici test puri su collisioni, binding, target e atlante passati; validatore 914 risorse/48 fondali/48 mappe passato. QA su telefono fisico ancora aperta.

Un caso produzione offline passato: quattro immagini decodificate con trasparenza e dimensioni effettive, tre interazioni e ricarica sulla posizione finale. La fixture ora verifica l'ultimo approccio configurato, senza assumere che debba sempre essere quello est. TypeScript e build produzione passati; resta l'avviso sulle dimensioni dei chunk.
