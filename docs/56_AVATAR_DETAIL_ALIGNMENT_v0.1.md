# Correzione dettagli avatar — 0.3.136

## Problema riprodotto e causa

Occhi e barba erano sovrapposti come ellissi a coordinate fisse: la testa cambia posizione fra le pose del passo e fra fronte/profilo. Lo zaino era selezionato con una fascia cromatica ampia che poteva coinvolgere altri dettagli o lasciare una banda inferiore non colorata. I precedenti test verificavano palette, pose e persistenza, ma non l’allineamento di questi dettagli.

## Correzione

- Landmark delle iridi e maschere della barba per ogni posa dei tre atlanti, in coordinate normalizzate 192×240.
- Gli occhi ricolorano le iridi già dipinte, preservando pupille, bianco e riflessi. Non vengono più disegnati puntini nuovi.
- La barba segue la mandibola e modifica soltanto i pixel della pelle dentro la maschera; nessuna barba/iride sul retro.
- Lo zaino usa poligoni dedicati per fronte, profilo e retro, inclusa la parte inferiore. Il materiale corallo viene distinto dai dettagli metallici; componenti cromatiche isolate sotto otto pixel escluse.
- Nessuna modifica all’alfa/sagoma delle immagini. Stessi asset e stesso compositore per wizard, impostazioni e gioco; salvataggi invariati.
- Dati delle pose e operazioni geometriche separati in `trainer-pose-masks.ts`; normalizzazione dell’atlante separata dal cambio palette.

Le maschere sono calibrate sugli atlanti `trainer-*-v1.webp`, non una segmentazione universale: una sostituzione degli asset richiede revisione dei landmark e delle maschere.

## Evidenze

598 test dominio/persistenza passati. Nuovi test verificano pose, assenza del viso sul retro, copertura inferiore zaino, esclusione delle mani e rimozione delle componenti isolate senza unire i bordi di righe diverse.

Browser: quattro casi passati (wizard nei due orientamenti, controllo dei dettagli su tutti i frame e regressione pelle/zaino). Dopo la rifinitura dei poligoni, ripassati i due casi di rendering. Test sui dettagli: tre acconciature × 16 pose per ciascuna variazione occhi/barba/zaino, nessun cambiamento fuori maschera o su pixel trasparenti, nessuna modifica dell’alfa. Studio comparativo fronte/profilo/retro ispezionato visivamente. Non è ancora una prova su dispositivo fisico.

Build, PWA offline e pubblicazione: esiti in CI_STATUS. Nessun progresso della partita viene azzerato da questa correzione.
