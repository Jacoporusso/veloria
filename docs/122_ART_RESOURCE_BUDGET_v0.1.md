# Prima misura riproducibile del budget grafico

Fotografia del contenuto0.4.43: `art/art-budget-0.4.43.json`. Rigenerare con:

```powershell
node --experimental-strip-types tools/report_art_budget.mjs --output docs/art/art-budget-0.4.43.json
```

Il rapporto verifica gli hash dei WebP contro il manifest idle; riferimenti mancanti, hash obsoleti e chiavi duplicate falliscono esplicitamente. Conta i file una sola volta e distingue i byte su disco dalle stime delle superfici. Non carica immagini o modifica il gioco.

## Risultati

- 43 profili,172 pose idle:160.119.340 byte, circa152,7MiB.
- SHELL statico:497 voci dichiarate;494 file sorgente unici conteggiabili,327.332.082 byte, circa312,2MiB. Il totale esclude navigazione radice, HTML/manifest generati dalla build, risorse scoperte nell'HTML e dipendenze del build manifest: non è il totale completo della cache PWA.
- Ferraluce registra12 pose idle:11.060.674 byte di file. Il modello RGBA8 delle superfici compatte WebGL più mipmap vale16.777.200 byte, circa16MiB; l'alternativa Canvas vale8.323.200 byte. Queste grandezze non si sommano fra loro.

Le stime delle superfici richiamano la funzione reale `npcIdleTextureSize`: rapporto, cap512, frame frazionario per sorgenti irregolari, Canvas arrotondato verso l'alto e WebGL POT con catena completa delle mipmap. Le immagini già sotto il cap conservano il percorso senza mipmap previsto dal renderer.

## Limiti e azioni ancora necessarie

Questi sono byte dei file del repository, non misure del trasferimento HTTP o dello spazio effettivo Cache Storage. Il modello include tutte le pose idle dichiarate nei renderAssets di ciascuna mappa, non la residenza misurata nel tempo. Esclude fondali, avatar, battaglie, overhead del driver e picchi di decode; non certifica memoria o prestazioni su telefono fisico. I byte RGBA del sorgente non sono da considerare permanentemente residenti e non vanno sommati come consumo certo.

La misura conferma che il peso dei download/precache richiede lavoro dedicato, anche con texture runtime compatte. Prima di modificare la politica offline servono un inventario completo della build/cache e prove di installazione e viaggio offline; prima di ottimizzare gli artwork servono confronto visivo e conferma di origini, proporzioni e trasparenza. Il gate budget resta aperto, così come i restanti cinque profili e le47 camminate.

Cinque test dedicati coprono mipmap, immagini piccole, rapporto irregolare, conteggio unico/errori su file mancanti e rilevamento di hash obsoleti. Sono inclusi in `npm test` tramite `test:art-budget`, quindi eseguiti anche nei job Verify.
