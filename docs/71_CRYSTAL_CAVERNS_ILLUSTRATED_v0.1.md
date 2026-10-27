# Grotte del Cristallo illustrate

## Integrazione

D05 usa un fondale completo2D illustrato con pavimento chiaro, pareti blu ardesia, cristalli ciano/ametista e pozze laterali fuori dalle corsie. [Guida geometrica](../assets/prompts/d05-production-layout-v1.md) e [prompt/provenienza](../assets/prompts/d05_grotte_cristallo-illustrated-v3.md). SVG generato dal Tiled con `tools/generate_map_layout_guide.py`, comprese celle libere e20px di margine sotto i piedi. Nessun personaggio è incorporato nell’illustrazione.

Un solo oggetto `scenery-image` sostituisce il precedente `terrainBase`; restano invariati dimensioni, layer logici, missioni, probabilità incontri e collegamenti. Il primo candidato aveva muschio su una diramazione priva di incontri: la revisione ImageGen lo rimuove, conservando il solo habitat orientale dichiarato. Sorgente PNG raw1448×1086 e WebP lossless, RGB decodificato identico; nessun crop o resize.

La stazione bassa mostra il termometro condiviso, quella centrale lo strumento per le correnti. Console e ricevitore usano il misuratore vettoriale esistente tramite la proprietà opzionale `fieldInstrument: gauge`; il renderer applica questa proprietà soltanto agli oggetti che la dichiarano. Tutti e quattro hanno il pittogramma condiviso di rilevamento. Dialoghi, regolatore, eventi e collisioni rimangono quelli originali.

## Verifica prevista e scope

La regressione grafica parte da un solo checkpoint già completato, con squadra GenI valida: cammina da sud alle due stazioni, al bordo habitat, alla console e al ricevitore, poi attraversa l’uscitaR15 e torna a D05. Screenshot portrait/landscape in ciascun punto e controllo del singolo asset full-scene. Quel checkpoint non prova il completamento naturale della missione.

La missione è verificata separatamente da `crystal.spec.ts`: medaglia, letture, regolazioni reali, ricevitore, rapporto e premio unico, ritorno completo a Biancavetta. Aggiunto controllo del gateR15 ancora chiuso prima del rapporto con messaggio esplicativo. Il gate permette di stare sulla cella soglia(38,3), ma impedisce la transizione; il test inizialmente presumeva erroneamente che fermasse il movimento alla cella(37,3). Corretta l’aspettativa, mantenendo controllo del messaggio, della mappa e del flag mancante.

## Risultati e lavoro ancora aperto

Prima prova: console e percorso grafico passati, missione fallita sulla sola aspettativa di posizione della soglia appena descritta. La revisione manuale delle immagini trova però un problema reale distinto: parete dipinta davanti alla stazione centrale e margine insufficiente presso la stazione bassa. Una seconda revisione ImageGen ripristina quelle corsie, senza modificare il Tiled.

Sul candidato successivo passano tutti e tre i casi (`.tmp/d05-revised-paths.log`): console17,3s, missione completa circa1,1min, percorso grafico24,3s. Schermate delle due stazioni riviste: piedi sul pavimento.771 test dominio e31 persistenza passati, build TypeScript/Vite passata, validatore627 asset/29 fondali/48 mappe passato prima della seconda revisione artistica; hash di sorgente/derivata aggiornati e conversione lossless verificata anche dopo tale revisione.

Il confronto cromatico sul primo candidato segnala96 campioni blu su celle libere; tre screenshot di bordi percorsi realmente confermano il problema anche lontano dalle stazioni (`.tmp/d05-border-review.log`). Una ulteriore correzione globale conserva82 indizi e non viene scelta. Per migliorare la geometria viene preparato un riferimento canvas con pavimento e muschio sulle celle Tiled esatte: [riferimento di authoring](../assets/prompts/d05-exact-floor-reference.png). La sua sagoma tecnica, troppo rigida per il gioco, viene rifinita da ImageGen; non entra nel renderer e non sostituisce il raw generato come asset finale.

Il candidato rifinito riduce gli indizi a3; dopo un’ultima correzione locale ne restano2. Sono indicazioni, non un classificatore affidabile né un criterio di accettazione automatico. Il nuovo test visita anche corridoio d’ingresso, tornante basso, angolo nord-est della curva, nicchia settentrionale e margine sud del corridoio alto. Le schermate mostrano pavimento sotto il protagonista nelle aree prima occupate dalle pareti; nei due campioni residui si vedono piccoli sassi sulla superficie superiore del bordo, senza la precedente sovrapposizione a una parete verticale. Il Tiled non è stato modificato per eliminare i campioni.

Sul raw finale `exec-a89a92c3-13c7-418d-9576-a612684c4a12.png` passano percorso ampliato45,8s e due casi camera nei due orientamenti (`.tmp/d05-final-native.log`). La missione completa resta verificata separatamente, senza cambiamenti alle regole.775 test dominio più31 persistenza passati (inclusi quattro nuovi test del contratto di orientamento NPC), validatore628 asset/29 fondali/48 mappe passato e RGB lossless verificato. Produzione offline finale passata (`.tmp/d05-final-offline.log`): console/regolazione con ritorno aR14 e prima richiesta senza rete dei28 fondali non iniziali. Il relativo avvio di produzione completa anche la build TypeScript/Vite sullo stato finale.

La tranche porta a29 i fondali con provenienza. Restano48 mappe da valutare rispetto ai criteri completi di accettazione e48 profili NPC da completare nelle direzioni/animazioni previste; il numero di asset non certifica la fine del redesign. Cache v172, contenuti0.4.9; pubblicazione ancora da attestare.
