# 0.3.126 — Trackpad touch opzionale

## Uso

Menu → Impostazioni → Movimento touch → Trackpad a trascinamento.
Frecce resta la modalità predefinita ed è sempre ripristinabile dallo stesso selettore.
La preferenza è locale al dispositivo, salvata in `veloria-movement-control`, separata dal salvataggio della partita.

## Comportamento

- Movimento a destra, azioni A/B/S a sinistra; portrait e landscape con safe area.
- Trascinamento dal centro, quattro direzioni cardinali e zona neutra di 12 pixel.
- Cursore limitato a 32 pixel, cattura del puntatore anche fuori dal disco.
- Stessa velocità, collisioni e movimento a caselle delle frecce; nessun movimento diagonale.
- Arresto al rilascio, cancellazione, perdita della cattura, blur, cambio visibilità/orientamento, apertura dei pannelli e interruzioni del gioco.
- Listener rimossi allo shutdown della scena. Nessun cambiamento alle azioni touch e alla tastiera.

## Verifica

Build TypeScript/Vite riuscita. Regressioni layout mobile: 2 casi passati.
Test browser dedicati in 390×844 e 844×390: preferenza, trascinamento, movimento reale verso una casella libera, centro neutro, rilascio, blur, cancellazione, reload e ritorno alle frecce.
Le prove Chromium non sostituiscono la verifica fisica su Android/iOS.
