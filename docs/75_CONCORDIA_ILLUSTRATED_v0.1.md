# Concordia illustrata

Fondale 2D illustrato di Concordia, prodotto dalla geometria Tiled40×30. Mantiene pietra chiara, vetro turchese, giardini e cascate della città delle due luci. Gli accessi sono concentrati sulle loro coordinate effettive: palestra a nord, osservatorio di Elia a nord-est, Centro Pokémon e mercato a ovest, monorotaia a sud, santuario a est. Le immagini non introducono nuove uscite giocabili.

## Asset e collegamento

Raw ImageGen `exec-d19743e1-c17d-4d05-92b4-3c9fb32bfa59.png`, copiato senza crop o resize in `assets/sources/veloria-concordia-illustrated-v3.png`,1448×1086. Derivata WebP lossless in `public/assets/scenery/veloria-concordia-illustrated-v3.webp`. Prompt integrale e hash in `assets/prompts/concordia-illustrated-v3.md`; guida geometrica, coordinate e limiti in `assets/prompts/concordia-production-layout-v1.md`.

La mappa usa un solo `scenery-image` invece del precedente `terrainBase`. Il fondale della lotta usa la stessa nuova chiave. Centro Pokémon e mercato ricevono i pittogrammi vettoriali condivisi; la monorotaia conserva il terminale runtime. Nessuna variazione di collisioni, servizi, prezzi, eventi, probabilità, flag o requisiti di passaggio. Cache v175, contenuti0.4.12.

## Verifiche

Quattro prove browser passate: percorso D05→R15→Concordia, piano esplicito con Elia, acquisti e ritorno alle grotte; andata/ritorno monorotaia con reload e risorse invariate; camera portrait e landscape. Il percorso include soste ai cinque accessi/servizi nei due orientamenti, con schermate controllate presso centro, mercato, stazione, santuario e osservatorio. Il personaggio resta sul pavimento in corrispondenza degli avvicinamenti verificati. Il test non svolge una partita naturale completa né certifica il bilanciamento delle lotte.

Il primo controllo dei contenuti ha rilevato accenti corrotti da una lettura Python senza codifica esplicita durante l’integrazione. Ricostruiti i tre JSON coinvolti dalle sorgenti Git UTF-8, applicando solo le modifiche previste; il validatore ora passa su97 file localizzati,644 asset,31 fondali e48 mappe. Nessuna alterazione dei testi di gioco prevista.

Log nativi `.tmp/concordia-art-review.log`; validazione finale `.tmp/concordia-validation-final.log`. Produzione offline: due casi passati su relè P8, risorse del cristallo/drago, monorotaia di Concordia e prima decodifica dei30 fondali non iniziali; build passata (`.tmp/concordia-offline-final.log`). Pubblicazione da attestare dopo il push. L’inventario di31 fondali non conclude la revisione delle48 mappe né il lavoro sulle direzioni/camminate dei personaggi.
