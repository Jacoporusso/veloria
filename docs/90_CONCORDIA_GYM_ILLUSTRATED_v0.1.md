# Concordia — santuario della convergenza

Il fondale della palestra 08 usa ora un santuario illustrato con alberi, vetro, acqua turchese a ovest e cristalli lilla a est. La pianta deriva dalle collisioni effettive della mappa 32×24: corte rettangolare, collo settentrionale e ingresso meridionale. Le collisioni non sono state modificate per adattarle all'immagine.

Sorgenti, quattro relè, ricevitore, fasci e cancello rimangono oggetti del renderer. Il pavimento non contiene copie dipinte di questi elementi, evitando segnali di stato incoerenti. La stessa chiave viene usata per terreno e sfondo della lotta di Aurel.

Il PNG selezionato è conservato senza ritocchi; il WebP lossless ha pixel RGBA identici. Prompt completo, output ImageGen e riferimenti sono in `assets/prompts/gym08_concordia-illustrated-v3.md`; dimensioni, hash e legami runtime sono in `assets/map-parity-v2.json`.

La verifica browser copre le quattro postazioni nelle due orientazioni, salvataggio parziale e ricaricamento, apertura del cancello, lotta reale tramite comandi touch, medaglia e ricompensa uniche e ritorno a Concordia. La squadra del checkpoint è deliberatamente forte: questa prova non certifica il bilanciamento della campagna naturale. Le prove dei bordi camera includono il limite superiore e inferiore nelle due orientazioni. Gli esiti vengono registrati dopo l'esecuzione, senza considerarli impliciti nella presenza del test.

Esito locale: tre casi Chrome passati in 1,2 minuti (`.tmp/gym08-native.log`); review visiva della postazione sud-occidentale in portrait e dell'arena in landscape effettuata. Validatore: 40 fondali con provenienza e legami validi. Due casi offline passati (`.tmp/gym08-offline.log`): primo accesso e soluzione dei relè con ricaricamento parziale, uscita e monorotaia con risorse conservate; decodifica al primo accesso dei fondali registrati. Build del pacchetto offline riuscita; avviso dimensione chunk Phaser presente. Pubblicazione di questo incremento ancora da completare.

Restano aperte la revisione delle altre scene e del cast, le animazioni di camminata e la verifica dell'intera campagna.
