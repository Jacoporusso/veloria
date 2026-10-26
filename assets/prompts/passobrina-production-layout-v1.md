# Passobrina — maschera di produzione per il fondale

Il [diagramma SVG](passobrina-production-layout-v1.svg) ha dimensioni1280×960, senza margini o legenda. Il pavimento sabbia è ricavato dalle celle libere delle collisioni di `public/tilemaps/passobrina.tmj`, con estensione20px verso sud per l'appoggio dei piedi. Rimossi dalla maschera soltanto gli ingombri dinamici della guida alpina e del terminale.

I rettangoli rosa e viola sono **proposte artistiche per i tetti**, collocate in aree bloccate sopra Centro e bottega; non sono sagome edilizie dichiarate da Tiled. Il rettangolo blu orientale propone il volume della stazione fuori dal corridoio della funivia. I quattro punti indicano i veri hotspot, da non dipingere nell'artwork. Pavimento e punti d'accesso restano il vincolo; tetti e portici richiedono revisione sul rendering reale.

La [guida annotata](passobrina-layout-guide-v1.md) documenta separatamente collisioni, interazioni, approcci e limiti delle informazioni disponibili. Il raster usato da ImageGen è una schermata Chrome del solo SVG, non una modifica pittorica del risultato generato.
