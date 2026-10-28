# Tentativi naturali verso Aster

Entrambi i tentativi partono tramite importazione UI dal backup guadagnato della seconda medaglia, SHA256 `b48ab23b7906f157f2fff6f7bdd9e0cba467f89dd323e4650dffc1daf00ab6b3`. Squadra, inventario, denaro, flag, medaglie e RNG confrontati all'importazione. Nessuna iniezione di progressi o ricostruzione del salvataggio dal report. Il salvataggio conserva contentVersion0.4.30, distinta dal runtime: primo tentativo sulla base0.4.31 con supporto di ripresa da P2; secondo sulla working tree0.4.32 con le nuove idle Timo e correzione della policy del driver. Dati di battaglia invariati fra i due.

Percorso raggiunto: uscita della palestra Dalia, cure a Petalora, Viadotto dei Ciliegi e vittoria su Oren, Vetracielo, orientamento di Lea, allenamento reale nel parco fino al livello17, evoluzione reale Charmander→Charmeleon, cure e cinque Pozioni comprate con denaro guadagnato; console Giardini/Vetro/Cielo attivate. Questo prova il percorso fino alla sfida, non la conquista della terza medaglia.

## Primo esito: sconfitta,17turni

Report `2026-10-28-gen1-aster-first-attempt-report.json`. Charmeleon17, Spearow2 e Paras8 perdono contro Voltorb16 e Magnemite17. Il driver ripete Ruggito quattro volte su Voltorb perché il suo Attacco rimane invariato: Antisuono blocca la mossa sonora. Cinque Pozioni usate, Voltorb sconfitto da due Braci, Magnemite rimane34/35PS. Nessun flag Circuito: l'asserzione finale fallisce coerentemente con la sconfitta. La squadra soccorsa dopo la lotta non è una vittoria né un bug di assegnazione della medaglia.

## Secondo esito: sconfitta,13turni

Report `2026-10-28-gen1-aster-setup-recheck-report.json`. Corretto il driver: ogni setup viene tentato una sola volta per mossa, creatura e bersaglio, anche se l'effetto non modifica gli stadi. L'event log conferma un solo Ruggito di Charmeleon su Voltorb. La squadra perde comunque: paralisi e riduzione della Difesa Speciale causano pressione da Tuonoshock mentre il driver continua a usare Pozioni; il setup su Magnemite non aiuta contro il danno speciale. Nessuna evidenza di KO o danni illegali; la terza medaglia resta non verificata.

Il tentativo successivo usa la policy già disponibile `PLAYTEST_DAMAGE_FIRST=1`, conservando gli altri dati. Ora il driver esporta un backup reale prima di Aster, e lo stato effettivo dopo una sconfitta prima dell'asserzione finale. Le asserzioni sulla medaglia e sulla persistenza non sono rimosse. Un eventuale esito positivo sarà registrato separatamente; questi due fallimenti rimangono evidenza della preparazione e della strategia, non vengono cancellati.
