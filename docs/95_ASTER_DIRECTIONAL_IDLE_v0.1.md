# Aster: viste idle direzionali

Il profilo `gym-leader-aster`, NPC `aster_gym` nella palestra di Vetracielo, usa quattro viste indipendenti. Il riferimento è la figura in basso a sinistra, frame2, dell'atlante `veloria-gym-leaders-a-v1.png`: capelli argento con ciocca dorata, giacca navy/crema con piping giallo, dispositivo sul petto anatomico destro e polsino sinistro. Le mani sono rilassate e vuote; il terminale tenuto nella vecchia posa non diventa un accessorio fisso.

La revisione ha scartato immagini che duplicavano la patch gialla sulle maniche. Le viste approvate mantengono gli accessori sui lati coerenti senza flip o rotazioni artificiali. PNG raw1024×1536 conservati e WebP lossless RGBA-identici. Calibrazione con corpo alpha>=128 a circa56 pixel mondo di altezza; il renderer prepara superfici proporzionate340×510.

Prompt esatti, riferimenti, scarti e output ImageGen integrato sono in `assets/prompts/aster-idle-views-v1.json`; dimensioni, origini e hash in `assets/npc-idle-views-v1.json`. Catalogo, renderAssets della mappa e Tiled usano la vista sud come base standalone, senza spriteFrame. Collisioni e battaglia non cambiano.

Due casi Chrome passati: quattro approcci reali, dialoghi, profondità, ancoraggio, proporzioni, assenza di flip/tween, stato invariato e posa base dopo reload, con movimento completo/ridotto e screenshot portrait/landscape. Review visiva su nord landscape ed est portrait effettuata. Suite locale:788 test dominio e31 persistenza passati. Validatori:717 media,42 fondali,48 mappe. Primo accesso offline alle quattro pose, interazioni e ricaricamento passati. Pubblicazione da completare.

Le sei identità direzionali completate sono Ada, Elia, Nilo, Mira, Dalia e Aster. Restano42 profili da migrare e tutti i cicli di camminata; le pose idle non attestano animazioni di locomozione.
