# Rhea: viste idle direzionali

Il profilo `gym-leader-rhea`, NPC `rhea_gym` nella palestra di Ferraluce, usa quattro viste indipendenti. Il riferimento è la figura in basso a destra, frame3, dell'atlante `veloria-gym-leaders-a-v1.png`: capelli ramati, occhiali da officina indossati, tuta navy, grembiule chiaro e guanto magnetico sulla destra anatomica. La chiave tenuta nella vecchia posa è omessa; mani rilassate, guanto indossato conservato.

Nessun flip. PNG raw1024×1536 invariati, WebP lossless RGBA-identici, ancoraggio ai piedi e altezza visibile calibrata a circa56 pixel mondo. Le quattro pose vengono scelte all'interazione; non cambiano collisioni o battaglia e non costituiscono cicli di camminata.

Prompt esatti, output, riferimenti e scarti sono in `assets/prompts/rhea-idle-views-v1.json`; hash, dimensioni, origini e displaySize nel manifest `assets/npc-idle-views-v1.json`. Il Tiled usa la vista sud standalone senza spriteFrame.

Passano due casi Chrome: quattro approcci, dialoghi, piedi, profondità, proporzioni, stato invariato, reload e screenshot portrait/landscape con animazioni complete e ridotte. Review visiva su est portrait e nord landscape effettuata. Passa anche il primo accesso offline a tutte le pose con interazioni e reload. Pubblicazione da completare. Sette profili direzionali migrati,41 ancora da migrare; tutti i cicli di camminata restano aperti.
