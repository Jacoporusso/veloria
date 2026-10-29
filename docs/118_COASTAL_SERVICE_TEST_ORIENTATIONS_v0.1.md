# Percorsi cittadini: verifiche indipendenti per orientamento

La Verify 40936155157 del commit `b7b0c41f5146db39add4be03b2a307ce5e47834c` termina con 31 job riusciti su 32. Il solo Browser chapters shard 2 fallisce nel caso Acquariva di `coastal-city-services.spec.ts`: esaurisce i 180 secondi del test mentre esegue l'ultimo passo da 17,7 alla soglia della palestra. Gli altri 28 casi dello shard passano, compresa l'indagine della Centrale. Il log non attesta un'asserzione di collisione errata o un errore applicativo: il motivo riportato è il timeout esterno del caso.

Ogni città ora ha un caso indipendente per portrait e landscape. Ciascuno parte dallo spawn iniziale previsto e percorre realmente tutti i servizi, poi raggiunge ed entra nella palestra. Acquariva completa anche il resoconto di Tessa in ogni orientamento; prima questa parte era eseguita solo dopo il ciclo, in landscape. Non vengono aumentati i limiti, saltati controlli o modificati ostacoli, coordinate o gameplay. Rimangono 180 secondi in CI e 120 in locale per ciascun caso.

Quattro casi Chrome locali passati in 1,6 minuti complessivi: Portolume portrait 20,0s, landscape 20,3s; Acquariva portrait 27,2s, landscape 27,4s. TypeScript e diff check passati. Il risultato locale non sostituisce la nuova Verify completa, da controllare dopo il push. Il lotto grafico già pubblicato resta 0.4.41/cache v205.
