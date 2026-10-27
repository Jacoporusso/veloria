# Santuario delle Due Luci illustrato

Fondale32×24 con lettura naturale a ovest, lettura della rete a est, ricevitore a nord e ingresso a sud. Nuova illustrazione coerente con Concordia: pietra chiara, acqua turchese, cristalli viola, giardini sui margini. Le due stazioni ricevono il pittogramma condiviso di ricerca. Il segnale della risonanza, la console, Elia e Mewtwo restano elementi runtime.

## Asset e geometria

Raw ImageGen `exec-94c87c2a-cb72-4b20-9fc8-3d66acd24eef.png`, copiato senza crop o resize in `assets/sources/veloria-d06_santuario_due_luci-illustrated-v3.png`,1448×1086. WebP lossless corrispondente in `public/assets/scenery/`. Prompt, hash e riferimenti in `assets/prompts/d06_santuario_due_luci-illustrated-v3.md`. Guida geometrica riproducibile e coordinate in `assets/prompts/d06-production-layout-v1.md`.

Un solo `scenery-image` copre1024×768 worldpx e sostituisce `terrainBase`. Nessuna variazione di collisioni, coordinate, dialoghi, prerequisiti, regolatore o ricompense. La cella Mewtwo21,16 resta libera prima della Lega e dopo cattura; è occupata quando l’incontro è disponibile. Nessun Pokémon è dipinto nel fondale. Cache v176, contenuti0.4.13.

## Verifiche e limiti

Sei casi Chrome passati (`.tmp/d06-art-review.log`,1,2min): missione completa da Concordia con controllo della medaglia, letture, consenso esplicito, regolazione parziale, reset, equilibrio, conferma del ricevitore, rapporto e ricompensa una sola volta; tre stati della zona Mewtwo; camera portrait e landscape. La missione include schermate delle quattro destinazioni nei due orientamenti. I casi Mewtwo controllano sprite e occupazione reali, cammino sulla cella libera e apertura/annullamento dell’incontro senza cambiare RNG. Non eseguono una cattura né la vittoria nella Lega.

Revisione delle schermate presso le due stazioni, il ricevitore e Mewtwo: piedi sul pavimento e approcci accessibili. Il controllo non certifica ogni pixel del perimetro o una campagna naturale completa. Validatore648 asset/32 fondali/48 mappe passato. Due prove produzione offline passate: prima visita al Santuario con equilibrio, ricevitore, rapporto, premio unico e ritorno; prima decodifica dei31 fondali non iniziali. Build passata (`.tmp/d06-offline-final.log`). Pubblicazione da attestare dopo il push. Direzioni/camminate del cast e revisione completa delle48 mappe restano aperte.
