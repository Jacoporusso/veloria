# Centrale Risonante: conservazione del fondale illustrato

La Centrale mantiene l'illustrazione originale del19 ottobre: è già il riferimento grafico indicato dall'utente. Non sono stati generati nuovi pixel, spostate collisioni o ridisegnate macchine e corridoi. Il PNG e il WebP originali sono copiati byte per byte nelle cartelle comuni `assets/sources/` e `public/assets/scenery/`; i vecchi file pubblicati restano disponibili.

La chiave `veloria-centrale-room-v1` non cambia. La MapDefinition aggiorna solo il percorso del file; scena Tiled e terreno industriale restano separati. Il controllo di binding supporta già un fondale completo sopra un terrainBase differente; una prova dedicata verifica che il terreno non nasconda un fondale mancante o con dimensioni errate.

Il manifest `assets/map-parity-v2.json` registra ora fonte, derivato, hash, dimensioni1448×1086, prompt originale e riferimenti storici. Il prompt resta in `assets/prompts/centrale-room-v1.md`. I pixel PNG/WebP e quelli dei file precedenti sono identici.

Tre casi Chrome passati: cammino Ferraluce/Condotto/Centrale, accesso alle tre postazioni, ordine dell'indagine, reload intermedio, ritorno e premio unico; bordi camera nelle due orientazioni. Le postazioni producono screenshot portrait/landscape. Due casi offline passati: primo accesso dal Condotto con lettura persistita e primo decode dei fondali registrati. Build offline riuscita. La fixture dell'indagine usa un Omanyte con mosse ufficiali disponibili al livello35; non è una prova di progressione naturale.

Con questa registrazione i fondali nel gruppo verificabile sono46 su48. Casa e laboratorio richiedono ancora accettazione della geometria visiva; il conteggio non chiude il goal del progetto.
