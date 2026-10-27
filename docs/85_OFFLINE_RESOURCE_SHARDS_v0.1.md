# Distribuzione delle prove offline

Il log del job Offline resources 122205125023, run 40508853603, mostra 37 casi avviati: 35 passati prima del cutoff del passo a 20 minuti. Non riporta un caso fallito prima del timeout. Questo dimostra un limite del budget aggregato; non dimostra l'esito dei due casi rimasti.

La matrice mantiene il viaggio E2E-06 separato e divide le risorse con gli shard nativi Playwright 1/2 e 2/2. La configurazione CI già abilita la distribuzione per singolo caso; ogni macchina continua a usare un worker e gli stessi timeout. Nessuna asserzione o prova viene rimossa.

`node tools/check_offline_shard_coverage.mjs` interroga la discovery reale con la configurazione offline, confronta le identità complete con la baseline e rifiuta omissioni, duplicati e shard vuoti. Locale: 37 casi assegnati esattamente una volta, 19 + 18. Il controllo gira anche nel primo job risorse. L'esito effettivo di entrambi i job resta da verificare in CI. Nessuna modifica al runtime 0.4.18/cache v181.
