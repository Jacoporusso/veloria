# R07 Condotto Risonante — fondo moderno 2D v3, rapporto 10:7

Nuova generazione Built-in ImageGen del 25 ottobre 2026; approvata da root. L’immagine R07 precedente è stata usata solo come riferimento normalizzato per il layout, non come tela di edit. L’asset finale è il PNG raw generato, senza crop o resize. Il rapporto deriva dalla mappa Tiled 40×28: 10:7.

## File

- Sorgente: `assets/sources/veloria-r07_condotto_risonante-illustrated-v3.png` (1499×1049 RGB PNG; SHA-256 `3b94b2bfd05d47d78bfcb141664d8d7de63d0b43aa7dd28c8151872ef86a3480`)
- Runtime: `public/assets/scenery/veloria-r07_condotto_risonante-illustrated-v3.webp` (1499×1049 WebP lossless; SHA-256 `37612a13f0f61413ede1769f75f0fb718c1756186b17aa3fe91d1d2a62c644a6`)
- Output ImageGen raw: `exec-2499db72-9fac-402a-aa12-0f4e0aa33aeb.png`
- Riferimenti di stile: `assets/sources/veloria-petalora-illustrated-v3.png`, `assets/sources/veloria-borgofonte-illustrated-v3.png`
- Layout/collisioni: `public/tilemaps/r07_condotto_risonante.tmj`

## Controllo statico delle uscite

La mappa è 40×28 (10:7). Il PNG misura 1499×1049; il rapporto è 1.42898 contro 1.42857 atteso, errore relativo 0.029% (sotto la tolleranza parity 0.5%). Nessun ridimensionamento raster è stato applicato.

- Uscita Ferraluce: trigger `[0,22,1,3]`, banda verticale 78.57–89.29%, centro 83.93%. La bocca del sentiero occidentale è circa y82.8–83.1%, continua sulla soglia.
- Uscita Centrale: trigger `[39,10,1,3]`, banda verticale 35.71–46.43%, centro 41.07%. La bocca del sentiero orientale è circa y41%, sulla soglia.
- Il percorso forma una L continua tra le due uscite. La console rimane nel quadrante nord-est; Dario `(18,18)` e il cartello `(13,23)` sono lasciati come spazi di sfondo senza figure/testo cotti.

Il percorso visibile è un’indicazione artistica: Tiled mantiene collisioni, soglie, NPC, oggetti e missioni. Nessun browser, build o test gameplay è stato eseguito per questa sostituzione.

## Prompt / provenienza

Genera un nuovo fondale di gioco R07 Condotto Risonante, ortogonale overhead, su canvas landscape esatto 10:7, preferibilmente 1600×1120 per la mappa 40×28; non mantenere il rapporto 4:3 dell’immagine di riferimento. Usa l’R07 precedente soltanto come riferimento di layout normalizzato. Usa Petalora v3 e Borgofonte v3 solo come riferimenti di stile. Conserva il percorso a L: entra dal bordo ovest centrato a y23.5/28 (83.93%), va a est fino a circa x16/40 (40%), sale fino a y11.5/28 (41.07%) e prosegue al bordo est centrato a y11.5/28. Le soglie effettive sono ovest x0,y22–24 ed est x39,y10–12; nessun’altra uscita o strada al bordo. Conserva la console nord-est vicino a x27/40,y5/28. Lascia libere le posizioni runtime di Dario x18,y18 e del cartello x13,y23. Mantieni habitat erbosi aperti a est. Stile illustrato 2D moderno opaco, luce morbida, sentieri di terra chiara compattata con poche pietre, margini erbosi leggibili e dettagli sobri. Niente 3D lucido, pixel art, NPC, Pokémon, segnaletica, marker, testo, UI o uscite finte.
