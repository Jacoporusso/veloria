# Nila, Oren e Iris R06: viste direzionali

Tre allenatori mantengono identità, dialoghi, squadre, premi e coordinate delle rispettive mappe: Nila in R04, Oren in R05 e Iris in R06. Iris R06 resta distinta dalla biologa del Delta. Le quattro viste idle sono disegni indipendenti nello stile illustrato moderno, senza specchiature.

## Sorgenti e revisione

Immagini prodotte con ImageGen integrato; PNG originali copiati senza alterazioni in `assets/sources/veloria-{nila,oren,iris-r06}-idle-*-v1.png`, WebP lossless in `public/assets/sprites/`. I documenti `assets/prompts/{nila,oren,iris-r06}-idle-views-v1.json` conservano prompt, riferimenti, output, hash, misure e scarti. Nessuna pulizia creativa dei pixel.

Il fermaglio di Nila resta sul lato anatomico destro; guida botanica sul sinistro. Oren conserva orologio sinistro e cinghia al fianco destro: il primo retro aveva la cinghia a sinistra ed è stato sostituito con una nuova generazione dopo la revisione del coordinatore. Iris conserva guanto sinistro, mano destra nuda sul fianco, tasca destra e bussola frontale; il retro non duplica la bussola. La tracolla delle viste successive segue il fronte effettivamente selezionato, documentando la differenza rispetto alla prima richiesta testuale.

Origini specifiche sulle suole, scala uniforme e corpo di riferimento alto56pixel nel mondo. Catalogo, manifest e tre Tiled usano le nuove immagini; gli atlanti restano disponibili alle identità non ancora migrate. Collisioni e geometria non cambiano.

## Verifica e limiti

Revisione visiva delle dodici sorgenti completata, compreso il retro corretto di Oren. Tre casi Chrome passati (`.tmp/route-trainers-native.log`): quattro approcci, due qualità e due orientamenti, direzione/origine/scala/occlusione e salvataggio/RNG invariati. Tre casi produzione offline passati (`.tmp/route-trainers-offline.log`), con primo decode delle quattro pose e interazioni reali. Build e TypeScript passati; resta l'avviso sul chunk Phaser. I fixture non attestano un progresso naturale.

828 test dominio/persistenza,154 Python e validatore850media/48fondali/48mappe passati. Discovery411browser assegnati una sola volta e58risorse offline divise29+29. Corretto un prefisso `public/` improprio nel catalogo Iris; aggiunte tutte12immagini al precache prima della verifica offline. Le asserzioni non sono state indebolite.

La revisione dei compositi ha rilevato aliasing dei dettagli fini alla scala di gioco. Il confronto diretto nel browser fra WebP e canvas intermedia, con protagonista nascosto, conserva il disegno (`.tmp/pose-source-diagnostic.log`). La prova privata con canvas128 riduce il disturbo, ma abbassare la risoluzione massima penalizzerebbe l'ingrandimento sui telefoni: la soluzione mantiene invece il frame340×510 e la capacità512, con padding trasparente a superficie512×512 solo WebGL e filtro trilineare mipmap. I PNG e il rapporto/scala/origine del frame restano invariati. Il cambio direzione conserva il filtro anziché sovrascriverlo con LINEAR.

I livelli sono generati dal wrapper Phaser, che conserva parametri e rigenerazione dopo perdita del contesto; il renderer Canvas conserva la riduzione con rapporto esatto. Le superfici WebGL occupano più spazio della precedente340×510 e le mipmap aggiungono memoria: non viene dichiarato un miglioramento di memoria o prestazioni. La review dei compositi Nila/Oren/Iris mostra meno stipple, con dettagli sottili più morbidi aDPR1; geometria e ancoraggi invariati. Screenshot Nilo aDPR3 rivisto dopo perdita/ripristino del contesto.

Verifica finale nativa:34casi distinti passati,7 in `.tmp/pose-minification-final.log` e27 fra `.tmp/pose-minification-regression.log` e `.tmp/pose-minification-identities.log`. Le prime due prove globali fallivano per gancio diagnostico assente quando Vite aggiungeva la query al modulo; corretto solo il pattern della route e aggiunta attesa esplicita, poi entrambe passate sulle51presenze. Conservate tutte le asserzioni. Inclusi capipalestra, tre Elia, Nilo aDPR3 con filtro9987 dopo context restore, rilascio/ricostruzione texture entrando/uscendo dal laboratorio e due qualità delle camminate Ada. Test esatti ora distinguono superficie512² e frame340×510, mantenendo proporzioni e salvataggio. Cinque casi produzione offline finali passati (`.tmp/pose-minification-offline.log`), inclusi Nilo, Ada e i tre nuovi personaggi; build finale/TypeScript passati con avviso chunk Phaser. Pubblicazione registrata separatamente in `CI_STATUS.md`.

Il lotto porta le identità idle direzionali a19su48;29restano da migrare. Non aggiunge camminate e non certifica il completamento della campagna. Il progresso naturale separato ha raggiunto Psyduck22/Idropulsar, con checkpoint reale esportato prima della rivincita Rhea; limite di45minuti prima della sfida, nessuna quarta medaglia attestata.
