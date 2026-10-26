# Via delle Cascate — illustrazione moderna

Il fondale R11 viene ridisegnato con superfici opache, acqua dipinta e vegetazione illustrata. Eliminati i paletti decorativi dal sentiero. Geometria Tiled, personaggi, habitat, belvedere, condizioni di accesso e collegamenti con Acquariva/Vetracielo conservati.

Sorgente [PNG raw](../assets/sources/veloria-r11_via_cascate-illustrated-v3.png), [runtime WebP lossless](../public/assets/scenery/veloria-r11_via_cascate-illustrated-v3.webp), [prompt e provenienza](../assets/prompts/r11_via_cascate-illustrated-v3.md). Built-in ImageGen, riferimento geometrico dal precedente fondale; nessun crop o ridimensionamento. Dimensioni1448×1086, rapporto4:3 della mappa40×30.

## Evidenza locale

- Percorso reale Acquariva→R11→Vetracielo e ritorno, con persistenza dopo reload: passato.
- Sentiero sud, bordi delle due radure e belvedere raggiunti a piedi; otto schermate portrait/landscape revisionate. Piedi sul terreno calpestabile nei punti verificati; nessun errore JavaScript.
- Produzione: build passata, nuovi fondali decodificati alla prima richiesta senza rete, collegamento delle Cascate percorso offline in entrambe le direzioni: due casi passati.
- 767 test dominio e31 persistenza passati; validatore611 asset,24 fondali con provenienza e48 mappe passato.

Log locali ignorati da Git: `.tmp/r11-illustrated-path.log`, `.tmp/r11-visual-review.log`, `.tmp/r11-production-offline.log`, `.tmp/r11-domain.log`, `.tmp/r11-content-validation.log`.

Il manifest24 non certifica il completamento delle48 mappe. Prossimo lotto: Passobrina→Tornanti Bianchi→Biancavetta, conservando servizi, soglie e radure. Restano aperte animazioni direzionali del cast e verifica della campagna completa. Pubblicazione e CI in `CI_STATUS.md`.
