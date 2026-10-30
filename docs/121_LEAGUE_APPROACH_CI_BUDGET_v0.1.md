# Isolamento CI del percorso di accesso alla Lega

La Verify40947076372 del commit79afaa0 termina con31 job riusciti su32. Il solo Browser chapters shard6 esaurisce il limite del passo browser a24 minuti, dopo26 casi riusciti su30; nessuna asserzione di gioco fallita è presente nel log. Diagnostica originale conservata in `.tmp/ci-0.4.42-failed.log`, artefatto GitHub12932675222.

Nel gruppo, il caso `R16 requires the Sanctuary report; safe walking path reaches League services and every return persists` passa in7,5min, seguito dalle due lotte opzionali Maia/Tobia passate in49,1s/47,8s. La stessa esecuzione passa anche i due casi di parità visiva delle mappe e gli altri controlli prima del limite del gruppo. Questo non prova che i quattro casi ancora non terminati siano riusciti.

`league-approach.spec.ts` viene assegnato integralmente al nuovo gruppo `league-approach`, un worker e un job. Capitoli lo esclude; discovery verifica assegnazione unica. I tre casi, le asserzioni, fixture, percorsi e timeout individuali restano invariati. Nessuna modifica al timeout del passo24min o a quello del job50min. La matrice complessiva sale da32 a33 job, inclusi i cinque offline.

La verifica corrente della discovery deve confermare438 casi browser una sola volta, con3 nel gruppo dedicato. L'esito CI del nuovo commit va attestato separatamente: questa modifica distribuisce il lavoro misurato, non dichiara anticipatamente riuscita l'intera suite.
