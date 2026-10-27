# Piazzale della Lega illustrato

Fondale coerente con Concordia e Cammino dell’Equilibrio: pietra chiara, vetro turchese, centro con copertura rosa e mercato lavanda. Porte sul pavimento effettivo, decorazione del piazzale più leggera e nessuna strada verso il vecchio falso accesso est. La terrazza sud resta parte del piazzale, senza collegamenti a nuove mappe.

## Geometria e asset

Tiled40×30,1280×960. Guida di authoring SVG/PNG e coordinate in `assets/prompts/league-forecourt-production-layout-v1.md`. Raw ImageGen `exec-620d7648-1fc2-4a83-bacd-d84478dc95d2.png`, copiato senza crop o resize in `assets/sources/veloria-league_forecourt-illustrated-v3.png`,1448×1086; WebP lossless corrispondente in `public/assets/scenery/`. Prompt e hash in `assets/prompts/league_forecourt-illustrated-v3.md`.

Un solo `scenery-image` sostituisce il precedente `terrainBase`. Cure e mercato ricevono i pittogrammi condivisi. Accoglienza e portale restano runtime; collisioni, coordinate, servizi, prezzi, medaglie richieste e gestione del tentativo non cambiano. Cache v178, contenuti0.4.15.

## Verifiche e limiti

Quattro casi Chrome passati (`.tmp/forecourt-art-review.log`,1,8min): percorso completo da Concordia, R16 e servizi con recupero reale PS/PP, acquisto e ritorno; ingresso in una battaglia della Lega e ricaricamento che interrompe il tentativo mantenendo la squadra salvata; camera portrait e landscape. Soste presso centro, mercato, accoglienza, portale e terrazza nei due orientamenti. Schermate controllate presso le destinazioni: piedi sul pavimento, accessi utilizzabili. Sul margine sud resta visibile il riempimento ambientale oltre il mondo; la prova non dichiara dettaglio illustrato fuori dai limiti della mappa.

Due casi produzione offline passati (`.tmp/forecourt-offline-final.log`): prima visita con servizi e ritorno completo44,2s, prima decodifica dei33 fondali non iniziali3,3s. Build passata; validatore656 asset/34 fondali/48 mappe passato. Pubblicazione da attestare dopo il push. Non vengono ripetute tutte e cinque le battaglie del campionato per questa modifica di fondale. Revisione completa delle48 mappe, direzioni/camminate del cast e campagna naturale restano aperte.
