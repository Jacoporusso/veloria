# Cammino dell’Equilibrio illustrato

Nuovo fondale del collegamento Concordia→Lega: terrazze con pietra chiara, margini organici leggeri, cascate e tre radure d’erba allo stesso livello del sentiero. Nessuna balaustra pesante sui passaggi. Gli habitat mantengono il marcatore condiviso del runtime; Maia e Tobia restano sprite separati.

## Geometria e asset

Mappa40×30,1280×960 worldpx. Guida SVG generata da collisioni e trigger effettivi; coordinate e rendering PNG in `assets/prompts/r16-production-layout-v1.md`. La guida include20px verso sud per l’ancoraggio dei piedi; non è l’immagine pubblicata.

Raw ImageGen `exec-df9df463-007c-4576-90e3-6acf031f2931.png`, copiato senza crop o resize in `assets/sources/veloria-r16_cammino_equilibrio-illustrated-v3.png`,1448×1086. WebP lossless corrispondente in `public/assets/scenery/`. Prompt e hash in `assets/prompts/r16_cammino_equilibrio-illustrated-v3.md`.

Un solo `scenery-image` sostituisce il vecchio `terrainBase`; nuova chiave anche per il fondale di lotta. Nessuna modifica a collisioni, accessi, dialoghi, allenatori, premi, specie, probabilità o requisiti. Cache v177, contenuti0.4.14.

## Verifiche e limiti

Tre casi Chrome passati (`.tmp/r16-art-review.log`,1,3min): requisito del rapporto del Santuario, percorso Concordia→R16→Piazzale, rifiuto della sfida di Maia, cure con recupero reale PS/PP, acquisto Iperpozione, orientamento, ritorno completo e persistenza; camera portrait e landscape. Soste aggiunte ai tre avvicinamenti dell’habitat e a Tobia nei due orientamenti. Le schermate controllate mostrano contatti sul pavimento/erba e collegamenti delle radure accessibili.

Questa prova non cattura Pokémon né ripete le due battaglie opzionali: i contenuti di queste battaglie restano invariati nei relativi test dedicati. Non certifica tutti i pixel del perimetro o una campagna naturale completa. Validatore652 asset/33 fondali/48 mappe passato. Due prove produzione offline passate: prima visita R16/Piazzale con servizi e ritorno completo (45,2s), prima decodifica dei32 fondali non iniziali (2,9s). Build passata (`.tmp/r16-offline-final.log`). Pubblicazione da attestare dopo il push. Revisione completa delle48 mappe e direzioni/camminate del cast restano aperte.
