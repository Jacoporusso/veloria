# PWA: download dei fondali attivi

La migrazione grafica aveva lasciato nel precache versioni superate delle immagini complete delle mappe. Sono state confrontate tutte le48 MapDefinition correnti, i relativi asset/render binding e i riferimenti della versione pubblicata0.4.25. La verifica distingue questi sfondi da atlanti NPC, creature, tileset e interfaccia.

Dal download iniziale sono esclusi43 fondali inutilizzati sia dalle mappe correnti sia da quelle pubblicate:106.186.948 byte, circa101,27 MiB. Tre vecchi fondali della Lega restano precachati per la finestra di aggiornamento della versione pubblicata. Nessun file viene cancellato dal repository o dalla cartella pubblica.

L'elenco esatto, le dimensioni, gli hash e la revisione di confronto sono in `docs/art/retired-full-map-precache-0.4.26.json`. Il controllo è stato ripetuto prima della modifica verificando ogni file e ogni binding attivo. La validazione delle48 mappe conferma che tutti i loro renderAssets restano nel precache.

Dopo la riduzione passano tre prove offline: primo accesso alle quattro pose di Rhea con interazioni/reload, risorse delle cinque sale della Lega con finale/epilogo da checkpoint, primo decode dei fondali registrati. La build offline passa. La cifra indica byte di file non più richiesti dal precache, non una misura del tempo di avvio o della memoria GPU.
