# Dalia: viste direzionali

Il profilo `gym-leader-dalia`, NPC `dalia_gym` nella palestra di Petalora, usa quattro illustrazioni idle indipendenti. La figura in alto a destra dell'atlante `veloria-gym-leaders-a-v1.png` resta il riferimento d'identità: soprabito salvia con fodera rosa, treccia fiorita sulla destra anatomica, cintura e pouch sul fianco sinistro. Le mani sono rilassate e vuote; annaffiatoio e rametto della vecchia posa non vengono mantenuti come oggetti fissi durante il dialogo.

Nessuna immagine viene specchiata. Il PNG raw 1024×1536 conserva i pixel e la trasparenza generati; il WebP lossless decodifica agli stessi valori RGBA. La calibrazione usa il corpo con alpha almeno128 per mantenere circa56 pixel mondo di altezza visibile, con ancoraggio ai piedi. Il renderer esistente prepara superfici340×510 proporzionate prima di creare gli attori.

Prompt, riferimenti, scarti e output del generatore integrato sono in `assets/prompts/dalia-idle-views-v1.json`; hash, origini e dimensioni sono in `assets/npc-idle-views-v1.json`. I binding della mappa e del Tiled usano l'immagine sud come base, senza un frame dell'atlante. Collisioni, dialoghi e progressione non cambiano.

Verifiche locali: due casi Chrome passati con movimento ridotto e completo, quattro approcci reali, profondità, proporzioni, piedi, dialogo, stato persistito invariato, screenshot portrait/landscape e posa base dopo reload. Primo accesso offline alle quattro pose, interazioni e ricaricamento passati. Review visiva effettuata su est portrait e nord landscape; nessun fondale opaco visibile attorno al personaggio. Suite completa locale:788 test dominio e31 persistenza passati. Validatori:707 media,41 fondali,48 mappe.

Queste immagini sono pose idle: non aggiungono cicli di camminata. Restano43 profili direzionali da migrare, oltre alla revisione delle altre scene e alla verifica della campagna naturale.
